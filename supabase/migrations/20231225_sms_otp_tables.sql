-- SMS Configuration table (admin-only)
CREATE TABLE IF NOT EXISTS sms_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT DEFAULT 'kudisms',
  api_token TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP storage table (for production use instead of in-memory)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- RLS policies
ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write sms_config
-- Using regex for exact domain matching to prevent spoofing
CREATE POLICY "Admin read sms_config" ON sms_config
  FOR SELECT
  USING (auth.jwt()->>'email' ~ '@togedaly\.com$');

CREATE POLICY "Admin write sms_config" ON sms_config
  FOR ALL
  USING (auth.jwt()->>'email' ~ '@togedaly\.com$');

-- Service role can manage OTP codes (API routes use service role)
-- Users cannot directly access OTP codes
CREATE POLICY "Service role manage otp_codes" ON otp_codes
  FOR ALL
  USING (auth.role() = 'service_role');
