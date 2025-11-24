-- Ticket Resale/Marketplace Migration
-- This migration adds support for users to list their tickets for resale

-- Create ticket_listings table
CREATE TABLE IF NOT EXISTS ticket_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ticket information
    token_id TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Seller information
    seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_wallet_address TEXT NOT NULL,

    -- Listing details
    listing_price DECIMAL(10, 6) NOT NULL, -- Price in ETH/MATIC
    original_price DECIMAL(10, 6) NOT NULL, -- Original purchase price

    -- Status
    status TEXT NOT NULL CHECK (status IN ('active', 'sold', 'cancelled', 'expired')) DEFAULT 'active',

    -- Buyer information (filled when sold)
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    buyer_wallet_address TEXT,
    sold_price DECIMAL(10, 6),
    sold_at TIMESTAMP WITH TIME ZONE,

    -- Transaction tracking
    transaction_hash TEXT, -- Hash when sold

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for listing

    -- Constraints
    CONSTRAINT positive_listing_price CHECK (listing_price > 0),
    CONSTRAINT positive_original_price CHECK (original_price > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_listings_event_id ON ticket_listings(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_listings_seller_user_id ON ticket_listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_listings_status ON ticket_listings(status);
CREATE INDEX IF NOT EXISTS idx_ticket_listings_token_id ON ticket_listings(token_id);
CREATE INDEX IF NOT EXISTS idx_ticket_listings_created_at ON ticket_listings(created_at DESC);

-- Composite index for active listings by event
CREATE INDEX IF NOT EXISTS idx_ticket_listings_active_by_event
ON ticket_listings(event_id, status) WHERE status = 'active';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ticket_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_listings_updated_at
    BEFORE UPDATE ON ticket_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_listings_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE ticket_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
    ON ticket_listings
    FOR SELECT
    USING (status = 'active' OR auth.uid() = seller_user_id OR auth.uid() = buyer_user_id);

-- Policy: Users can insert their own listings
CREATE POLICY "Users can create listings for their tickets"
    ON ticket_listings
    FOR INSERT
    WITH CHECK (auth.uid() = seller_user_id);

-- Policy: Sellers can update their own active listings (price, cancel, etc.)
CREATE POLICY "Sellers can update their own listings"
    ON ticket_listings
    FOR UPDATE
    USING (auth.uid() = seller_user_id)
    WITH CHECK (auth.uid() = seller_user_id);

-- Policy: Sellers can delete their own listings
CREATE POLICY "Sellers can delete their own listings"
    ON ticket_listings
    FOR DELETE
    USING (auth.uid() = seller_user_id);

-- Create view for active marketplace listings with event details
CREATE OR REPLACE VIEW marketplace_listings AS
SELECT
    tl.id,
    tl.token_id,
    tl.event_id,
    tl.seller_user_id,
    tl.seller_wallet_address,
    tl.listing_price,
    tl.original_price,
    tl.status,
    tl.created_at,
    tl.expires_at,
    -- Event details
    e.title as event_title,
    e.description as event_description,
    e.location as event_location,
    e.time as event_time,
    e.gallery as event_gallery,
    e.category as event_category,
    e.organizer_wallet_address,
    e.max_resale_price,
    e.royalty_percent,
    -- Calculate price difference
    (tl.listing_price - tl.original_price) as price_difference,
    CASE
        WHEN tl.listing_price > tl.original_price THEN 'above'
        WHEN tl.listing_price < tl.original_price THEN 'below'
        ELSE 'equal'
    END as price_status
FROM ticket_listings tl
JOIN events e ON tl.event_id = e.id
WHERE tl.status = 'active'
    AND (tl.expires_at IS NULL OR tl.expires_at > NOW())
ORDER BY tl.created_at DESC;

-- Create view for user's ticket listings
CREATE OR REPLACE VIEW user_ticket_listings AS
SELECT
    tl.id,
    tl.token_id,
    tl.event_id,
    tl.seller_user_id,
    tl.listing_price,
    tl.original_price,
    tl.status,
    tl.created_at,
    tl.sold_at,
    tl.sold_price,
    tl.buyer_wallet_address,
    -- Event details
    e.title as event_title,
    e.time as event_time,
    e.gallery as event_gallery,
    -- Earnings calculation for sold tickets
    CASE
        WHEN tl.status = 'sold' AND tl.sold_price IS NOT NULL THEN
            tl.sold_price - (tl.sold_price * COALESCE(e.royalty_percent, 0) / 10000)
        ELSE NULL
    END as seller_earnings
FROM ticket_listings tl
JOIN events e ON tl.event_id = e.id
WHERE tl.seller_user_id = auth.uid()
ORDER BY tl.created_at DESC;

-- Function to automatically expire old listings
CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS void AS $$
BEGIN
    UPDATE ticket_listings
    SET status = 'expired'
    WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a listing
CREATE OR REPLACE FUNCTION cancel_ticket_listing(listing_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ticket_listings
    SET status = 'cancelled'
    WHERE id = listing_id
        AND seller_user_id = auth.uid()
        AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark listing as sold (called after blockchain transfer)
CREATE OR REPLACE FUNCTION mark_listing_sold(
    listing_id UUID,
    buyer_id UUID,
    buyer_address TEXT,
    sale_price DECIMAL(10, 6),
    tx_hash TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE ticket_listings
    SET
        status = 'sold',
        buyer_user_id = buyer_id,
        buyer_wallet_address = buyer_address,
        sold_price = sale_price,
        sold_at = NOW(),
        transaction_hash = tx_hash
    WHERE id = listing_id
        AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON marketplace_listings TO authenticated;
GRANT SELECT ON user_ticket_listings TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ticket_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_listing_sold(UUID, UUID, TEXT, DECIMAL, TEXT) TO authenticated;

-- Create statistics view for analytics
CREATE OR REPLACE VIEW ticket_resale_stats AS
SELECT
    e.id as event_id,
    e.title as event_title,
    COUNT(*) FILTER (WHERE tl.status = 'active') as active_listings,
    COUNT(*) FILTER (WHERE tl.status = 'sold') as sold_listings,
    AVG(tl.listing_price) FILTER (WHERE tl.status = 'active') as avg_listing_price,
    AVG(tl.sold_price) FILTER (WHERE tl.status = 'sold') as avg_sold_price,
    MIN(tl.listing_price) FILTER (WHERE tl.status = 'active') as min_listing_price,
    MAX(tl.listing_price) FILTER (WHERE tl.status = 'active') as max_listing_price
FROM events e
LEFT JOIN ticket_listings tl ON e.id = tl.event_id
WHERE e.blockchain_enabled = true
GROUP BY e.id, e.title;

GRANT SELECT ON ticket_resale_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ticket_listings IS 'Stores ticket resale listings for the secondary marketplace';
COMMENT ON COLUMN ticket_listings.token_id IS 'The blockchain token ID of the ticket NFT';
COMMENT ON COLUMN ticket_listings.listing_price IS 'The price the seller is asking for the ticket in ETH/MATIC';
COMMENT ON COLUMN ticket_listings.original_price IS 'The original purchase price paid by the seller';
COMMENT ON COLUMN ticket_listings.status IS 'Listing status: active, sold, cancelled, or expired';
COMMENT ON VIEW marketplace_listings IS 'Public view of all active ticket listings with event details';
COMMENT ON VIEW user_ticket_listings IS 'User-specific view showing all their listings and sales history';
