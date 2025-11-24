-- Add wallet_type column to support both custodial and external wallets
-- Migration for Hybrid Wallet System

-- Add wallet_type column with default 'custodial' for existing wallets
ALTER TABLE user_wallets
ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'custodial'
CHECK (wallet_type IN ('custodial', 'walletconnect'));

-- Make encrypted_private_key nullable since external wallets won't have it
ALTER TABLE user_wallets
ALTER COLUMN encrypted_private_key DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN user_wallets.wallet_type IS 'Type of wallet: custodial (app-managed) or walletconnect (external wallet)';
COMMENT ON COLUMN user_wallets.encrypted_private_key IS 'Encrypted private key for custodial wallets only. NULL for external wallets.';

-- Add index for wallet_type lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_type ON user_wallets(wallet_type);

-- Add updated_at trigger if not exists (should already exist from previous migration)
-- Just ensuring it's there
CREATE TRIGGER IF NOT EXISTS update_user_wallets_updated_at
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
