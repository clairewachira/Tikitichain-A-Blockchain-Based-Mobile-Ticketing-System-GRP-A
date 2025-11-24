-- Migration: Add DELETE policy for user_interactions table
-- This fixes the bug where users cannot unlike events or mark themselves as "not going"

-- Drop the policy if it exists (in case this migration is run multiple times)
DROP POLICY IF EXISTS "Users can delete their own interactions" ON user_interactions;

-- Create the DELETE policy
CREATE POLICY "Users can delete their own interactions" ON user_interactions
    FOR DELETE USING (auth.uid() = user_id);
