-- Fix wallet_type for existing wallets
-- This script ensures all existing user_wallets have the wallet_type column set properly

-- First, check if the wallet_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_wallets' AND column_name = 'wallet_type'
    ) THEN
        ALTER TABLE user_wallets
        ADD COLUMN wallet_type VARCHAR(20) DEFAULT 'custodial'
        CHECK (wallet_type IN ('custodial', 'walletconnect'));
    END IF;
END $$;

-- Update any NULL wallet_type values to 'custodial' (for backwards compatibility)
UPDATE user_wallets
SET wallet_type = 'custodial'
WHERE wallet_type IS NULL;

-- For wallets with encrypted_private_key, ensure they are custodial
UPDATE user_wallets
SET wallet_type = 'custodial'
WHERE encrypted_private_key IS NOT NULL AND encrypted_private_key != '' AND wallet_type != 'custodial';

-- For wallets without encrypted_private_key, mark as walletconnect
UPDATE user_wallets
SET wallet_type = 'walletconnect'
WHERE (encrypted_private_key IS NULL OR encrypted_private_key = '') AND wallet_type != 'walletconnect';

-- Verify the results
SELECT
    wallet_type,
    COUNT(*) as count,
    COUNT(CASE WHEN encrypted_private_key IS NOT NULL AND encrypted_private_key != '' THEN 1 END) as with_private_key,
    COUNT(CASE WHEN encrypted_private_key IS NULL OR encrypted_private_key = '' THEN 1 END) as without_private_key
FROM user_wallets
GROUP BY wallet_type;
