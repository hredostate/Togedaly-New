-- Migration: Admin Tables for Full CRUD Operations
-- Created: 2024-12-25
-- Description: Creates all tables needed for admin panel with proper RLS policies

-- ============================================================================
-- 1. KYC Documents Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT CHECK (doc_type IN ('id_card', 'selfie', 'proof_of_address')) NOT NULL,
  storage_path TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_created_at ON kyc_documents(created_at DESC);

-- ============================================================================
-- 2. Risk Events Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('system', 'paystack', 'manual')) DEFAULT 'system',
  code TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_events_resolved ON risk_events(resolved);
CREATE INDEX idx_risk_events_severity ON risk_events(severity);
CREATE INDEX idx_risk_events_user_id ON risk_events(user_id);
CREATE INDEX idx_risk_events_created_at ON risk_events(created_at DESC);

-- ============================================================================
-- 3. Admin Action Requests Table (Maker-Checker Pattern)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_action_requests (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL,
  pool_id TEXT,
  action_type TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_action_requests_status ON admin_action_requests(status);
CREATE INDEX idx_admin_action_requests_org_id ON admin_action_requests(org_id);
CREATE INDEX idx_admin_action_requests_created_at ON admin_action_requests(created_at DESC);

-- ============================================================================
-- 4. Pool Treasury Policies Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS pool_treasury_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id TEXT NOT NULL UNIQUE,
  max_single_payout_kobo BIGINT,
  daily_limit_kobo BIGINT,
  requires_dual_approval BOOLEAN DEFAULT false,
  allowed_categories TEXT[],
  kill_draws BOOLEAN DEFAULT false,
  kill_unlocks BOOLEAN DEFAULT false,
  kill_payments BOOLEAN DEFAULT false,
  per_user_daily_draw_ngn NUMERIC DEFAULT 0,
  per_org_daily_draw_ngn NUMERIC DEFAULT 0,
  per_user_daily_unlock_ngn NUMERIC DEFAULT 0,
  max_draw_pct NUMERIC DEFAULT 0,
  min_reserve_pct NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pool_treasury_policies_pool_id ON pool_treasury_policies(pool_id);

-- ============================================================================
-- 5. Incoming Transfers Table (Payment Routing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS incoming_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount_kobo BIGINT NOT NULL,
  currency TEXT DEFAULT 'NGN',
  provider TEXT NOT NULL,
  provider_ref TEXT UNIQUE NOT NULL,
  paystack_tx_id BIGINT,
  sender_bank TEXT,
  sender_account_number TEXT,
  receiver_account_number TEXT,
  narration TEXT,
  status TEXT CHECK (status IN ('pending', 'routed', 'failed', 'unmatched')) DEFAULT 'pending',
  routed_to TEXT,
  routed_dest_id TEXT,
  confidence_score DECIMAL(3,2),
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incoming_transfers_status ON incoming_transfers(status);
CREATE INDEX idx_incoming_transfers_user_id ON incoming_transfers(user_id);
CREATE INDEX idx_incoming_transfers_provider_ref ON incoming_transfers(provider_ref);
CREATE INDEX idx_incoming_transfers_paystack_tx_id ON incoming_transfers(paystack_tx_id);
CREATE INDEX idx_incoming_transfers_created_at ON incoming_transfers(created_at DESC);

-- ============================================================================
-- 6. Audit Logs Table (if not already exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 7. Billing Plans Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_plans (
  id BIGSERIAL PRIMARY KEY,
  tier TEXT CHECK (tier IN ('free', 'pro', 'enterprise')) NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'NGN',
  monthly_fee BIGINT DEFAULT 0,
  annual_fee BIGINT,
  max_pools INTEGER,
  max_members INTEGER,
  max_org_admins INTEGER,
  features JSONB NOT NULL DEFAULT '{"ai_nudges": true, "priority_support": false}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_plans_tier ON billing_plans(tier);
CREATE INDEX idx_billing_plans_is_active ON billing_plans(is_active);

-- ============================================================================
-- 8. Organization Subscriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_subscriptions (
  org_id BIGINT PRIMARY KEY,
  plan_id BIGINT REFERENCES billing_plans(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  promo_code_id BIGINT,
  referral_code_id BIGINT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_subscriptions_plan_id ON org_subscriptions(plan_id);
CREATE INDEX idx_org_subscriptions_status ON org_subscriptions(status);

-- ============================================================================
-- 9. Promo Codes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  promo_type TEXT CHECK (promo_type IN ('percent_off', 'fixed_amount')) NOT NULL,
  value NUMERIC NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  per_org_limit INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(active);

-- ============================================================================
-- 10. Organization Credits Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_credits (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  source TEXT CHECK (source IN ('referral', 'manual', 'stripe', 'paystack')) NOT NULL,
  created_by TEXT NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_credits_org_id ON org_credits(org_id);
CREATE INDEX idx_org_credits_created_at ON org_credits(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_treasury_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoming_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_credits ENABLE ROW LEVEL SECURITY;

-- KYC Documents Policies
CREATE POLICY "Admins can view all KYC documents" ON kyc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update KYC documents" ON kyc_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view their own KYC documents" ON kyc_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents" ON kyc_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Risk Events Policies
CREATE POLICY "Admins can view all risk events" ON risk_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'support')
    )
  );

CREATE POLICY "Admins can insert risk events" ON risk_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'support')
    )
  );

CREATE POLICY "Admins can update risk events" ON risk_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Admin Action Requests Policies
CREATE POLICY "Admins can view action requests" ON admin_action_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can create action requests" ON admin_action_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
    AND auth.uid() = requested_by
  );

CREATE POLICY "Admins can update action requests" ON admin_action_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Pool Treasury Policies
CREATE POLICY "Admins can view treasury policies" ON pool_treasury_policies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage treasury policies" ON pool_treasury_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Incoming Transfers Policies
CREATE POLICY "Admins can view all transfers" ON incoming_transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'support')
    )
  );

CREATE POLICY "Users can view their own transfers" ON incoming_transfers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transfers" ON incoming_transfers
  FOR INSERT
  WITH CHECK (true);

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Billing Plans Policies
CREATE POLICY "Anyone can view active billing plans" ON billing_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage billing plans" ON billing_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Organization Subscriptions Policies
CREATE POLICY "Users can view their own subscription" ON org_subscriptions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage all subscriptions" ON org_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Promo Codes Policies
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Organization Credits Policies
CREATE POLICY "Users can view their own credits" ON org_credits
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage all credits" ON org_credits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Triggers for updated_at columns
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_action_requests_updated_at BEFORE UPDATE ON admin_action_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pool_treasury_policies_updated_at BEFORE UPDATE ON pool_treasury_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incoming_transfers_updated_at BEFORE UPDATE ON incoming_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON billing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_subscriptions_updated_at BEFORE UPDATE ON org_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert default billing plans
-- ============================================================================

INSERT INTO billing_plans (tier, name, currency, monthly_fee, annual_fee, max_pools, max_members, max_org_admins, features, is_active) 
VALUES 
  ('free', 'Starter', 'NGN', 0, 0, 1, 0, 0, '{"ai_nudges": true, "priority_support": false}'::jsonb, true),
  ('pro', 'Verified Saver', 'NGN', 1000, 10000, 5, 0, 0, '{"ai_nudges": true, "priority_support": true}'::jsonb, true),
  ('enterprise', 'Odogwu VIP', 'NGN', 5000, 50000, 999, 0, 0, '{"ai_nudges": true, "priority_support": true, "custom_branding": true}'::jsonb, true)
ON CONFLICT DO NOTHING;
