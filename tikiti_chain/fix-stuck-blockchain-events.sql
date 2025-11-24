-- SQL Script to Fix Events Stuck in "Blockchain Created but Database Not Updated" State
-- Use this when an event was created on blockchain but the database update failed

-- Step 1: Find failed blockchain event creation transactions
SELECT
    bt.transaction_hash,
    bt.event_id,
    bt.created_at,
    bt.error_message,
    e.title as event_title,
    e.blockchain_enabled,
    e.blockchain_event_id
FROM blockchain_transactions bt
JOIN events e ON bt.event_id = e.id
WHERE bt.transaction_type = 'create_event'
  AND bt.status = 'failed'
  AND e.blockchain_enabled = false
ORDER BY bt.created_at DESC;

-- Step 2: For a specific event, update it to mark as blockchain-enabled
-- Replace 'YOUR_EVENT_ID' with the actual event ID from Step 1
-- Replace values with the actual event parameters (check transaction details or use defaults)

/*
UPDATE events
SET
    blockchain_enabled = true,
    blockchain_event_id = 'event-YOUR_EVENT_ID',
    blockchain_active = true,
    total_supply = 1000,  -- Use actual value or default
    tickets_sold = 0,
    royalty_percent = 500,  -- 5%
    max_resale_price = 0,
    resale_allowed = true,
    blockchain_price = 0.001  -- MATIC
WHERE id = 'YOUR_EVENT_ID';
*/

-- Step 3: Update the failed transaction to confirmed (optional)
-- Replace 'YOUR_TRANSACTION_HASH' with actual transaction hash
/*
UPDATE blockchain_transactions
SET status = 'confirmed'
WHERE transaction_hash = 'YOUR_TRANSACTION_HASH';
*/

-- Step 4: Verify the fix
/*
SELECT
    id,
    title,
    blockchain_enabled,
    blockchain_event_id,
    blockchain_active,
    total_supply,
    blockchain_price
FROM events
WHERE id = 'YOUR_EVENT_ID';
*/

-- Example Usage:
-- 1. Run Step 1 to find stuck events
-- 2. Copy an event_id from the results
-- 3. Uncomment and modify Step 2, replacing YOUR_EVENT_ID
-- 4. Run Step 2 to fix the event
-- 5. Optionally run Step 3 to mark transaction as confirmed
-- 6. Run Step 4 to verify the fix worked
