-- Simple Role-Based Authentication Migration
-- Run this step by step in Supabase SQL Editor

-- Step 1: Create user_roles enum type (run this first)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('attendee', 'organizer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'attendee' NOT NULL;

-- Step 3: Update existing users to have attendee role
UPDATE profiles
SET role = 'attendee'
WHERE role IS NULL;

-- Step 4: Create organizer_profiles table
CREATE TABLE IF NOT EXISTS organizer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name TEXT,
    organization_description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add organizer_id to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_verified ON organizer_profiles(verified);

-- Step 7: Enable RLS on new tables
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Organizers can view their own organizer profile" ON organizer_profiles;
DROP POLICY IF EXISTS "Organizers can update their own organizer profile" ON organizer_profiles;
DROP POLICY IF EXISTS "Organizers can insert their own organizer profile" ON organizer_profiles;
DROP POLICY IF EXISTS "Admins can view all organizer profiles" ON organizer_profiles;
DROP POLICY IF EXISTS "Admins can update any organizer profile" ON organizer_profiles;

-- Step 9: Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Step 10: Create RLS policies for organizer_profiles
CREATE POLICY "Organizers can view their own organizer profile"
    ON organizer_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Organizers can update their own organizer profile"
    ON organizer_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Organizers can insert their own organizer profile"
    ON organizer_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all organizer profiles"
    ON organizer_profiles FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update any organizer profile"
    ON organizer_profiles FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Step 11: Grant permissions
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON organizer_profiles TO authenticated;

-- Step 12: Create helper functions
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_organizer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role IN ('admin', 'organizer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Migration completed successfully!' as message;
