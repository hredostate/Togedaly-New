
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables for the build, falling back to placeholders if not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://euzbdlmxqtcbjvyaeauq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1emJkbG14cXRjYmp2eWFlYXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMjkyNjIsImV4cCI6MjA3NzgwNTI2Mn0.hnxe7aJxJTWOmWa-7zBTJeWiC0bC5YIyIZVvzbNaz1k";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !supabaseUrl) {
    console.warn("Supabase credentials are not set. Database features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In a real server-side environment, this would use the service_role key.
// For this client-side demo, we'll alias the anon client.
export const supabaseAdmin = supabase;
