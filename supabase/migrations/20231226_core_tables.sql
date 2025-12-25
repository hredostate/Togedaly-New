-- Migration: Core Application Tables
-- Description: Creates tables for pools, memberships, wallets, and related data
-- Date: 2023-12-26

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    full_name TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    trust_score INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_kobo BIGINT DEFAULT 0 CHECK (balance_kobo >= 0),
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT,
    reference TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pools_tp table (Trust Pool / Ajo)
CREATE TABLE IF NOT EXISTS public.pools_tp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT DEFAULT 'NGN',
    base_amount NUMERIC NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'daily')),
    collateral_ratio NUMERIC DEFAULT 0.5,
    min_lock_cycles INTEGER DEFAULT 2,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pools_legacy table (Ventures, Group Buys, Events, Waybills)
CREATE TABLE IF NOT EXISTS public.pools_legacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    pool_type TEXT NOT NULL CHECK (pool_type IN ('invest', 'group_buy', 'event', 'waybill')),
    frequency TEXT CHECK (frequency IN ('monthly', 'weekly', 'daily', 'one_time')),
    base_amount_kobo BIGINT NOT NULL,
    raised_amount_kobo BIGINT DEFAULT 0,
    min_contribution_kobo BIGINT,
    vote_threshold_pct INTEGER DEFAULT 51,
    is_active BOOLEAN DEFAULT true,
    milestones JSONB DEFAULT '[]'::jsonb,
    target_state TEXT,
    creator_score INTEGER,
    roadmap JSONB,
    fulfillment_timeline JSONB,
    dispute_window_end TIMESTAMPTZ,
    event_settings JSONB,
    waybill_data JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pool_memberships table
CREATE TABLE IF NOT EXISTS public.pool_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'pending')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool_id, user_id)
);

-- Create collateral_accounts table
CREATE TABLE IF NOT EXISTS public.collateral_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    locked_kobo BIGINT DEFAULT 0,
    unlockable_kobo BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool_id, user_id)
);

-- Create cycle_obligations table
CREATE TABLE IF NOT EXISTS public.cycle_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL,
    amount_due_kobo BIGINT NOT NULL,
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pool_cycles table
CREATE TABLE IF NOT EXISTS public.pool_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL,
    cycle_number INTEGER NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool_id, cycle_number)
);

-- Add RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools_tp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools_legacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_cycles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Wallet policies
CREATE POLICY "Users can read own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
    ON public.wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can update wallets
CREATE POLICY "Service can update wallets"
    ON public.wallets FOR UPDATE
    USING (auth.role() = 'service_role');

-- Wallet transaction policies
CREATE POLICY "Users can read own transactions"
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert transactions
CREATE POLICY "Service can insert transactions"
    ON public.wallet_transactions FOR INSERT
    WITH CHECK (true);

-- Pool policies
CREATE POLICY "Anyone can read active pools"
    ON public.pools_tp FOR SELECT
    USING (is_active = true);

CREATE POLICY "Anyone can read active legacy pools"
    ON public.pools_legacy FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated users can create pools"
    ON public.pools_tp FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create legacy pools"
    ON public.pools_legacy FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Membership policies
CREATE POLICY "Users can read memberships"
    ON public.pool_memberships FOR SELECT
    USING (true);

CREATE POLICY "Users can create memberships"
    ON public.pool_memberships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Collateral policies
CREATE POLICY "Users can read own collateral"
    ON public.collateral_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own collateral"
    ON public.collateral_accounts FOR ALL
    USING (auth.uid() = user_id);

-- Obligations policies
CREATE POLICY "Users can read own obligations"
    ON public.cycle_obligations FOR SELECT
    USING (auth.uid() = user_id);

-- Cycles policies
CREATE POLICY "Anyone can read cycles"
    ON public.pool_cycles FOR SELECT
    USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pools_tp_is_active ON public.pools_tp(is_active);
CREATE INDEX IF NOT EXISTS idx_pools_legacy_is_active ON public.pools_legacy(is_active);
CREATE INDEX IF NOT EXISTS idx_pool_memberships_user_id ON public.pool_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_id ON public.pool_memberships(pool_id);
CREATE INDEX IF NOT EXISTS idx_collateral_accounts_user_id ON public.collateral_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_obligations_user_id ON public.cycle_obligations(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_cycles_pool_id ON public.pool_cycles(pool_id);

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pools_tp_updated_at
    BEFORE UPDATE ON public.pools_tp
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pools_legacy_updated_at
    BEFORE UPDATE ON public.pools_legacy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collateral_accounts_updated_at
    BEFORE UPDATE ON public.collateral_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to credit wallet (atomic operation)
CREATE OR REPLACE FUNCTION public.credit_wallet(
    p_user_id UUID,
    p_amount_kobo BIGINT,
    p_description TEXT DEFAULT NULL,
    p_reference TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
    v_new_balance BIGINT;
BEGIN
    -- Insert wallet if doesn't exist
    INSERT INTO public.wallets (user_id, balance_kobo)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET balance_kobo = balance_kobo + p_amount_kobo
    WHERE user_id = p_user_id
    RETURNING balance_kobo INTO v_new_balance;
    
    -- Insert transaction record
    INSERT INTO public.wallet_transactions (user_id, amount_kobo, type, description, reference, metadata)
    VALUES (p_user_id, p_amount_kobo, 'credit', p_description, p_reference, p_metadata);
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to debit wallet (atomic operation)
CREATE OR REPLACE FUNCTION public.debit_wallet(
    p_user_id UUID,
    p_amount_kobo BIGINT,
    p_description TEXT DEFAULT NULL,
    p_reference TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
    v_current_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    -- Get current balance
    SELECT balance_kobo INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id;
    
    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user';
    END IF;
    
    IF v_current_balance < p_amount_kobo THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET balance_kobo = balance_kobo - p_amount_kobo
    WHERE user_id = p_user_id
    RETURNING balance_kobo INTO v_new_balance;
    
    -- Insert transaction record
    INSERT INTO public.wallet_transactions (user_id, amount_kobo, type, description, reference, metadata)
    VALUES (p_user_id, p_amount_kobo, 'debit', p_description, p_reference, p_metadata);
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
