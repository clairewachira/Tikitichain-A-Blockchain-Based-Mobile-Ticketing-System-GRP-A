-- Role-Based Authentication Migration for Tikiti Chain
-- This migration adds role support for attendees, organizers, and admins

-- Create user_roles enum type
CREATE TYPE user_role AS ENUM ('attendee', 'organizer', 'admin');

-- Create profiles table if it doesn't exist
-- Note: email is stored in auth.users, not profiles
-- Only create if table doesn't exist, to avoid conflicts with existing schema
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'attendee' NOT NULL
);

-- Add role column to existing profiles table (if it exists without role)
-- This will fail silently if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'attendee' NOT NULL;
    END IF;
END $$;

-- Create organizer_profiles table for additional organizer information
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

-- Add organizer_id to events table to track who created the event
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_verified ON organizer_profiles(verified);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Organizers can view their own organizer profile" ON organizer_profiles;
DROP POLICY IF EXISTS "Organizers can update their own organizer profile" ON organizer_profiles;

-- RLS Policies for profiles
-- Users can view any profile (for social features)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can only update their own profile (except role - only admins can change roles)
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            -- Non-admins cannot change their role
            role = (SELECT role FROM profiles WHERE id = auth.uid())
            OR
            -- Admins can change roles
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        )
    );

-- Users can insert their own profile (set via trigger on signup)
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for organizer_profiles
-- Organizers can view their own profile
CREATE POLICY "Organizers can view their own organizer profile"
    ON organizer_profiles FOR SELECT
    USING (auth.uid() = id);

-- Organizers can update their own profile (except verified status)
CREATE POLICY "Organizers can update their own organizer profile"
    ON organizer_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND verified = (SELECT verified FROM organizer_profiles WHERE id = auth.uid())
    );

-- Organizers can insert their own profile
CREATE POLICY "Organizers can insert their own organizer profile"
    ON organizer_profiles FOR INSERT
    WITH CHECK (auth.uid() = id AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('organizer', 'admin'));

-- Admins can view all organizer profiles
CREATE POLICY "Admins can view all organizer profiles"
    ON organizer_profiles FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admins can update any organizer profile (including verification)
CREATE POLICY "Admins can update any organizer profile"
    ON organizer_profiles FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Function to automatically create a profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'attendee'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or organizer
CREATE OR REPLACE FUNCTION public.is_admin_or_organizer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role IN ('admin', 'organizer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View to get user with role information
-- Only select columns that exist in profiles table
CREATE OR REPLACE VIEW user_profiles_with_role AS
SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    op.organization_name,
    op.verified as organizer_verified,
    op.created_at,
    op.updated_at
FROM profiles p
LEFT JOIN organizer_profiles op ON p.id = op.id;

-- Grant access to the view
GRANT SELECT ON user_profiles_with_role TO authenticated;

-- Update existing events to have an organizer_id (optional - set to first admin/organizer)
-- You can manually update this later with actual organizers
DO $$
DECLARE
    first_organizer_id UUID;
BEGIN
    -- Get the first admin or organizer user
    SELECT id INTO first_organizer_id
    FROM profiles
    WHERE role IN ('admin', 'organizer')
    LIMIT 1;

    -- If there's an organizer/admin, assign them to events without organizer
    IF first_organizer_id IS NOT NULL THEN
        UPDATE events
        SET organizer_id = first_organizer_id
        WHERE organizer_id IS NULL;
    END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE organizer_profiles IS 'Additional information for event organizers';
COMMENT ON COLUMN profiles.role IS 'User role: attendee (default), organizer, or admin';
COMMENT ON COLUMN organizer_profiles.verified IS 'Whether the organizer has been verified by an admin';
COMMENT ON COLUMN events.organizer_id IS 'The user who created/manages this event';
