-- Add OAuth support to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS oauth_provider text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS oauth_metadata jsonb DEFAULT '{}'::jsonb;

-- Add index for OAuth queries
CREATE INDEX IF NOT EXISTS idx_profiles_oauth_provider ON profiles(oauth_provider);

-- Update profile trigger to handle OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        oauth_provider,
        avatar_url,
        oauth_metadata
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        ),
        NEW.raw_user_meta_data->>'provider',
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN NEW.raw_user_meta_data->>'provider' IS NOT NULL 
            THEN jsonb_build_object(
                'provider', NEW.raw_user_meta_data->>'provider',
                'provider_id', NEW.raw_user_meta_data->>'provider_id'
            )
            ELSE '{}'::jsonb
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle account linking
CREATE OR REPLACE FUNCTION link_oauth_account(
    user_id UUID,
    provider TEXT,
    provider_id TEXT,
    provider_email TEXT,
    avatar_url TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Update profile with OAuth info if not set
    UPDATE profiles
    SET 
        oauth_provider = COALESCE(oauth_provider, provider),
        avatar_url = COALESCE(profiles.avatar_url, avatar_url),
        oauth_metadata = CASE 
            WHEN oauth_metadata ? 'linked_providers' 
            THEN jsonb_set(
                oauth_metadata,
                '{linked_providers}',
                (oauth_metadata->'linked_providers') || 
                jsonb_build_object(provider, jsonb_build_object(
                    'provider_id', provider_id,
                    'email', provider_email,
                    'linked_at', extract(epoch from now())
                ))
            )
            ELSE jsonb_build_object(
                'linked_providers', 
                jsonb_build_object(provider, jsonb_build_object(
                    'provider_id', provider_id,
                    'email', provider_email,
                    'linked_at', extract(epoch from now())
                ))
            )
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlink OAuth account
CREATE OR REPLACE FUNCTION unlink_oauth_account(
    user_id UUID,
    provider TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET oauth_metadata = oauth_metadata #- '{linked_providers,' || provider || '}'
    WHERE id = user_id;
    
    -- Clear primary OAuth provider if it matches
    UPDATE profiles
    SET 
        oauth_provider = NULL,
        avatar_url = NULL
    WHERE id = user_id 
    AND oauth_provider = provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow profile creation from trigger" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policy for inserting new profiles (handled by trigger)
CREATE POLICY "Allow profile creation from trigger"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for updating existing profiles
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND (
            -- Non-OAuth fields can always be updated
            (
                oauth_provider IS NULL 
                AND avatar_url IS NULL
                AND (oauth_metadata = '{}'::jsonb OR oauth_metadata IS NULL)
            )
            OR
            -- OAuth fields can only be updated through our functions
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND (
                    -- Allow unlinking via oauth_metadata updates
                    (oauth_metadata IS DISTINCT FROM profiles.oauth_metadata 
                    AND oauth_metadata->'linked_providers' IS NOT NULL)
                    -- Allow initial OAuth setup
                    OR (profiles.oauth_provider IS NULL 
                        AND profiles.avatar_url IS NULL 
                        AND (profiles.oauth_metadata = '{}'::jsonb 
                             OR profiles.oauth_metadata IS NULL))
                )
            )
        )
    ); 