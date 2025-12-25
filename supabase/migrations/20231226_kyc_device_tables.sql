-- Migration: KYC and Device Tracking Tables
-- Description: Stores KYC verification data and device login history
-- Date: 2023-12-26

-- Create kyc_profiles table
CREATE TABLE IF NOT EXISTS public.kyc_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
    provider TEXT CHECK (provider IN ('smileid', 'verifyme', 'manual')),
    last_ref TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_events table for tracking user device logins
CREATE TABLE IF NOT EXISTS public.device_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_hash TEXT NOT NULL,
    ip TEXT,
    city TEXT,
    country TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own KYC profile
CREATE POLICY "Users can read own KYC profile"
    ON public.kyc_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own KYC profile
CREATE POLICY "Users can insert own KYC profile"
    ON public.kyc_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own KYC profile
CREATE POLICY "Users can update own KYC profile"
    ON public.kyc_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all KYC profiles
CREATE POLICY "Admins can read all KYC profiles"
    ON public.kyc_profiles
    FOR SELECT
    USING (auth.jwt()->>'email' ~ '@togedaly\.com$');

-- Admins can update KYC status
CREATE POLICY "Admins can update KYC status"
    ON public.kyc_profiles
    FOR UPDATE
    USING (auth.jwt()->>'email' ~ '@togedaly\.com$');

-- Users can read their own device history
CREATE POLICY "Users can read own device history"
    ON public.device_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert device events
CREATE POLICY "Service role can insert device events"
    ON public.device_events
    FOR INSERT
    WITH CHECK (true);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_user_id ON public.kyc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_status ON public.kyc_profiles(status);
CREATE INDEX IF NOT EXISTS idx_device_events_user_id ON public.device_events(user_id);
CREATE INDEX IF NOT EXISTS idx_device_events_created_at ON public.device_events(created_at DESC);

-- Add updated_at trigger for kyc_profiles
CREATE TRIGGER update_kyc_profiles_updated_at
    BEFORE UPDATE ON public.kyc_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to track device login (can be called from API routes)
CREATE OR REPLACE FUNCTION public.track_device_login(
    p_user_id UUID,
    p_device_hash TEXT,
    p_ip TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.device_events (user_id, device_hash, ip, city, country, user_agent)
    VALUES (p_user_id, p_device_hash, p_ip, p_city, p_country, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
