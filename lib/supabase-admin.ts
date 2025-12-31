import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Admin client with service_role for secure server-side operations
// Only use this in API routes, never expose to client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Untyped admin client for newer tables (dnd_players, dnd_player_notes, dnd_inventory)
// that may not be in the generated types yet
export const supabaseAdminUntyped = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
