/// <reference types="vite/client" />

// ⚠️ SECURITY WARNING: VITE Environment Variables ⚠️
//
// IMPORTANT: Variables prefixed with VITE_ are exposed to the client browser bundle
// and can be extracted by anyone viewing the application source code.
//
// NEVER store sensitive credentials in VITE_* variables:
// ❌ VITE_DATABASE_PASSWORD
// ❌ VITE_ADMIN_SECRET
// ❌ VITE_PRIVATE_API_KEY
//
// For production:
// - API keys (VITE_API_KEY, VITE_OPENAI_API_KEY): Move to server-side Next.js API routes
// - Supabase keys: VITE_SUPABASE_ANON_KEY is safe (designed for client use with RLS)
// - All sensitive operations must use server-side routes with non-VITE environment variables
//
// Safe for VITE_* prefix:
// ✅ Public API endpoints
// ✅ Supabase URL and anon key (protected by RLS)
// ✅ Public feature flags
// ✅ Public configuration values

interface ImportMetaEnv {
  // ⚠️ WARNING: These AI API keys are exposed client-side - migrate to server routes
  readonly VITE_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  
  // ✅ Safe: Supabase anon key is designed for client use with Row Level Security
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
