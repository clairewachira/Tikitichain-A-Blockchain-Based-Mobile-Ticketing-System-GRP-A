-- Blockchain Integration Migration for TikitiChain
-- This migration adds blockchain support for NFT ticketing

-- User Wallets Table
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    wallet_address TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL, -- Encrypted with user's password or secure key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add blockchain fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS blockchain_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blockchain_event_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS total_supply INTEGER,
ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS royalty_percent INTEGER DEFAULT 500, -- 5% in basis points
ADD COLUMN IF NOT EXISTS max_resale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS resale_allowed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS blockchain_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organizer_wallet_address TEXT;

-- Blockchain Tickets Table (NFTs)
CREATE TABLE IF NOT EXISTS blockchain_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_id BIGINT NOT NULL UNIQUE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_wallet_address TEXT NOT NULL,
    token_uri TEXT,
    purchase_price DECIMAL(10,2) NOT NULL,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain Transactions Table (for tracking all blockchain operations)
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('create_event', 'mint_ticket', 'transfer_ticket', 'redeem_ticket', 'deactivate_event')),
    transaction_hash TEXT NOT NULL UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT,
    value_eth DECIMAL(18,10),
    gas_used BIGINT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    error_message TEXT,
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);

CREATE INDEX IF NOT EXISTS idx_events_blockchain_enabled ON events(blockchain_enabled);
CREATE INDEX IF NOT EXISTS idx_events_blockchain_event_id ON events(blockchain_event_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_tickets_token_id ON blockchain_tickets(token_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tickets_event_id ON blockchain_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tickets_owner_user_id ON blockchain_tickets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tickets_owner_wallet ON blockchain_tickets(owner_wallet_address);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_event_id ON blockchain_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);

-- Row Level Security (RLS) Policies
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- User Wallets Policies
CREATE POLICY "Users can view their own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Blockchain Tickets Policies
CREATE POLICY "Users can view their own tickets" ON blockchain_tickets
    FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view tickets for events they interact with" ON blockchain_tickets
    FOR SELECT USING (
        event_id IN (
            SELECT event_id FROM user_interactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service can insert tickets" ON blockchain_tickets
    FOR INSERT WITH CHECK (true); -- Service role only

CREATE POLICY "Service can update tickets" ON blockchain_tickets
    FOR UPDATE USING (true); -- Service role only

-- Blockchain Transactions Policies
CREATE POLICY "Users can view their own transactions" ON blockchain_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert transactions" ON blockchain_transactions
    FOR INSERT WITH CHECK (true); -- Service role only

CREATE POLICY "Service can update transactions" ON blockchain_transactions
    FOR UPDATE USING (true); -- Service role only

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blockchain_tickets_updated_at
    BEFORE UPDATE ON blockchain_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's blockchain tickets for an event
CREATE OR REPLACE FUNCTION get_user_event_blockchain_tickets(user_uuid UUID, event_uuid UUID)
RETURNS TABLE (
    token_id BIGINT,
    token_uri TEXT,
    purchase_price DECIMAL(10,2),
    is_redeemed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bt.token_id,
        bt.token_uri,
        bt.purchase_price,
        bt.is_redeemed,
        bt.created_at
    FROM blockchain_tickets bt
    WHERE bt.owner_user_id = user_uuid AND bt.event_id = event_uuid
    ORDER BY bt.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has a wallet
CREATE OR REPLACE FUNCTION user_has_wallet(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_wallets WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- View for event blockchain stats
CREATE OR REPLACE VIEW event_blockchain_stats AS
SELECT
    e.id as event_id,
    e.title,
    e.blockchain_enabled,
    e.blockchain_event_id,
    e.total_supply,
    e.tickets_sold,
    COUNT(bt.id) as nft_tickets_minted,
    COUNT(CASE WHEN bt.is_redeemed THEN 1 END) as tickets_redeemed,
    SUM(bt.purchase_price) as total_revenue
FROM events e
LEFT JOIN blockchain_tickets bt ON e.id = bt.event_id
WHERE e.blockchain_enabled = true
GROUP BY e.id, e.title, e.blockchain_enabled, e.blockchain_event_id, e.total_supply, e.tickets_sold;

-- View for user's blockchain tickets
CREATE OR REPLACE VIEW user_blockchain_tickets_view AS
SELECT
    bt.id,
    bt.token_id,
    bt.owner_user_id,
    bt.owner_wallet_address,
    bt.purchase_price,
    bt.is_redeemed,
    bt.redeemed_at,
    bt.created_at,
    e.id as event_id,
    e.title as event_title,
    e.location,
    e.time as event_time,
    e.gallery,
    e.category
FROM blockchain_tickets bt
JOIN events e ON bt.event_id = e.id;

-- Function to increment tickets_sold for an event
CREATE OR REPLACE FUNCTION increment_tickets_sold(event_id UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE events
    SET tickets_sold = COALESCE(tickets_sold, 0) + amount
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
