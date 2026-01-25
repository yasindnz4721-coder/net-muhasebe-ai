-- Migration script for Multi-User Shared Accounts
-- This script decouples users from profiles and allows shared access.

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID, -- We'll link this to profiles(id)
    PRIMARY KEY (user_id, profile_id)
);

-- 2. Modify profiles table to allow non-user IDs as primary keys
-- In PostgreSQL, we can't easily drop a PK that is referenced. 
-- But we can add a new column and migrate data if needed.
-- Currently 'profiles' PK 'id' references 'users(id)'. 
-- We want it to just be a UUID PK, and the relationship moves to user_profiles.

-- Let's change the foreign key constraint on profiles(id)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Add current_profile_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_profile_id UUID;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_id ON user_profiles(profile_id);

-- 5. Migrate existing data
-- For every existing profile-user pair (where id matched), create an entry in user_profiles
INSERT INTO user_profiles (user_id, profile_id)
SELECT id, id FROM profiles
ON CONFLICT DO NOTHING;

-- Set current_profile_id for existing users
UPDATE users SET current_profile_id = id WHERE current_profile_id IS NULL;
