import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'parle-ta-langue-auth',
    storage: window.localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  // AJOUT : Headers pour Supabase self-hosted
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react'
    }
  }
})

// Supprimer le listener global pour éviter les conflits

// AJOUT 2 : Debug
if (import.meta.env.DEV) {
  console.log('✅ Supabase configuré pour Parle Ta Langue')
}