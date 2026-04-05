// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard: if env vars are missing or are placeholders, create a no-op stub
// so the app renders and the UI can be developed before Supabase is connected.
const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('<project-ref>') &&
  !supabaseKey.includes('<anon')

let supabase

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  // Stub client — returns safe empty responses so the UI renders correctly
  // Replace .env values with real Supabase credentials to enable full auth.
  console.warn(
    '[DMIS] Supabase credentials not configured. Auth is in demo mode.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable real auth.'
  )

  const notConfiguredError = { message: 'Supabase not configured. Add credentials to .env' }

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (_event, _cb) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: notConfiguredError }),
      signUp: async () => ({ data: null, error: notConfiguredError }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
  }
}

export { supabase }
