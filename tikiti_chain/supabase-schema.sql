-- Supabase Database Schema for NFT Ticketing App with ML Recommendations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Interactions Table
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'favorite', 'purchase', 'share', 'attend')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    duration INTEGER, -- time spent viewing in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Social Connections Table
CREATE TABLE IF NOT EXISTS user_social_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connection_strength DECIMAL(3,2) DEFAULT 1.0 CHECK (connection_strength >= 0 AND connection_strength <= 1),
    UNIQUE(follower_id, following_id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    category_preferences JSONB DEFAULT '{}',
    price_range INTEGER[] DEFAULT ARRAY[0, 1000],
    location_preferences JSONB DEFAULT '{}',
    time_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events Table (if not already exists)
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location JSONB NOT NULL, -- {latitude, longitude, address}
    gallery TEXT[] DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation History Table
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    model_info JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML Model Performance Table
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_type TEXT NOT NULL,
    model_version TEXT NOT NULL,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_data_size INTEGER,
    training_duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_event_id ON user_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_social_connections_follower ON user_social_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_following ON user_social_connections(following_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(time);
CREATE INDEX IF NOT EXISTS idx_events_price ON events(price);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_created_at ON recommendation_history(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

-- User Interactions Policies
CREATE POLICY "Users can view their own interactions" ON user_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON user_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON user_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Social Connections Policies
CREATE POLICY "Users can view their own connections" ON user_social_connections
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create their own connections" ON user_social_connections
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own connections" ON user_social_connections
    FOR DELETE USING (auth.uid() = follower_id);

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Recommendation History Policies
CREATE POLICY "Users can view their own recommendation history" ON recommendation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation history" ON recommendation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for ML features
CREATE OR REPLACE FUNCTION get_user_activity_level(user_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::DECIMAL / 10.0
        FROM user_interactions
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_event_popularity(event_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::DECIMAL / 50.0
        FROM user_interactions
        WHERE event_id = event_uuid
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_similar_users_count(user_uuid UUID, event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT ui.user_id)
        FROM user_interactions ui
        JOIN user_social_connections usc ON ui.user_id = usc.following_id
        WHERE usc.follower_id = user_uuid
        AND ui.event_id = event_uuid
        AND ui.interaction_type = 'like'
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_interactions_updated_at
    BEFORE UPDATE ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion functions
CREATE OR REPLACE FUNCTION seed_sample_interactions()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    event_record RECORD;
    interaction_types TEXT[] := ARRAY['view', 'like', 'favorite', 'purchase', 'share', 'attend'];
    interaction_type TEXT;
    i INTEGER;
BEGIN
    -- Get random users and events
    FOR user_record IN SELECT id FROM auth.users LIMIT 10 LOOP
        FOR event_record IN SELECT id FROM events LIMIT 20 LOOP
            -- Randomly create interactions
            IF random() < 0.3 THEN -- 30% chance of interaction
                interaction_type := interaction_types[floor(random() * array_length(interaction_types, 1)) + 1];
                
                INSERT INTO user_interactions (user_id, event_id, interaction_type, rating)
                VALUES (
                    user_record.id,
                    event_record.id,
                    interaction_type,
                    CASE 
                        WHEN interaction_type = 'view' THEN 1
                        WHEN interaction_type = 'like' THEN 3
                        WHEN interaction_type = 'favorite' THEN 4
                        WHEN interaction_type = 'purchase' THEN 5
                        WHEN interaction_type = 'share' THEN 4
                        WHEN interaction_type = 'attend' THEN 5
                    END
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create views for analytics
CREATE OR REPLACE VIEW user_interaction_stats AS
SELECT 
    user_id,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN interaction_type = 'purchase' THEN 1 END) as purchases,
    COUNT(CASE WHEN interaction_type = 'attend' THEN 1 END) as attendances,
    AVG(rating) as avg_rating
FROM user_interactions
GROUP BY user_id;

CREATE OR REPLACE VIEW event_popularity_stats AS
SELECT 
    event_id,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN interaction_type = 'purchase' THEN 1 END) as purchases,
    AVG(rating) as avg_rating
FROM user_interactions
GROUP BY event_id;

