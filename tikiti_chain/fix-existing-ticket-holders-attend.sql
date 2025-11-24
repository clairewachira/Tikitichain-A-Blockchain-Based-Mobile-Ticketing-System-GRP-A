-- SQL Script to Add "attend" Interactions for Existing Blockchain Ticket Holders
-- This fixes the issue where users who purchased tickets before the auto-attend feature
-- are not showing up in the attendees list

-- Step 1: Find users with blockchain tickets but no "attend" interaction
SELECT DISTINCT
    bt.owner_user_id,
    bt.event_id,
    e.title as event_title,
    u.username,
    COUNT(bt.id) as ticket_count
FROM blockchain_tickets bt
JOIN events e ON bt.event_id = e.id
JOIN auth.users u ON bt.owner_user_id = u.id
LEFT JOIN user_interactions ui ON
    ui.user_id = bt.owner_user_id
    AND ui.event_id = bt.event_id
    AND ui.interaction_type = 'attend'
WHERE ui.id IS NULL  -- No attend interaction exists
GROUP BY bt.owner_user_id, bt.event_id, e.title, u.username
ORDER BY e.title, u.username;

-- Step 2: Add "attend" interactions for all ticket holders without them
INSERT INTO user_interactions (user_id, event_id, interaction_type)
SELECT DISTINCT
    bt.owner_user_id,
    bt.event_id,
    'attend'
FROM blockchain_tickets bt
LEFT JOIN user_interactions ui ON
    ui.user_id = bt.owner_user_id
    AND ui.event_id = bt.event_id
    AND ui.interaction_type = 'attend'
WHERE ui.id IS NULL  -- Only add if no attend interaction exists
ON CONFLICT DO NOTHING;  -- Skip if somehow already exists

-- Step 3: Verify the fix - should return 0 rows
SELECT DISTINCT
    bt.owner_user_id,
    bt.event_id,
    e.title as event_title,
    u.username
FROM blockchain_tickets bt
JOIN events e ON bt.event_id = e.id
JOIN auth.users u ON bt.owner_user_id = u.id
LEFT JOIN user_interactions ui ON
    ui.user_id = bt.owner_user_id
    AND ui.event_id = bt.event_id
    AND ui.interaction_type = 'attend'
WHERE ui.id IS NULL;

-- Step 4: Show attendee count per event after fix
SELECT
    e.id,
    e.title,
    COUNT(DISTINCT bt.owner_user_id) as ticket_holders,
    COUNT(DISTINCT ui.user_id) as attendees_marked
FROM events e
LEFT JOIN blockchain_tickets bt ON e.id = bt.event_id
LEFT JOIN user_interactions ui ON
    e.id = ui.event_id
    AND ui.interaction_type = 'attend'
WHERE e.blockchain_enabled = true
GROUP BY e.id, e.title
ORDER BY e.title;
