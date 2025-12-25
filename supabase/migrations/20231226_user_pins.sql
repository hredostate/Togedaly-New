-- Migration: User PINs Table
-- Description: Stores hashed transaction PINs for users
-- Date: 2023-12-26

-- Create user_pins table
CREATE TABLE IF NOT EXISTS public.user_pins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Users can only read their own PIN hash (for verification)
CREATE POLICY "Users can read own PIN"
    ON public.user_pins
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own PIN
CREATE POLICY "Users can insert own PIN"
    ON public.user_pins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own PIN
CREATE POLICY "Users can update own PIN"
    ON public.user_pins
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_pins_user_id ON public.user_pins(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_pins_updated_at
    BEFORE UPDATE ON public.user_pins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
