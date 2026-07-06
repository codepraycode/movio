import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Supabase's newer "publishable" key (sb_publishable_…) replaces the legacy
// anon key. We accept either so existing setups keep working.
const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    // Surfaced in the console during local dev so a missing .env.local is obvious.
    console.warn(
        '[movio] Missing Supabase env vars. Copy .env.example to .env.local and fill in ' +
            'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from your Supabase dashboard (Settings → API).',
    )
}

// Fallbacks keep the dev server booting for UI work even before keys are set;
// any real insert will fail with a caught, human-readable error until they are.
export const supabase = createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseKey || 'public-anon-key-placeholder',
)

/** Postgres unique-violation code — used to detect duplicate waitlist emails. */
export const PG_UNIQUE_VIOLATION = '23505'
