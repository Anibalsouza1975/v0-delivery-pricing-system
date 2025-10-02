import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase para uso em Server Components e Server Actions
 * Versão simplificada sem SSR para evitar erros de parse do ESM
 */
export function createClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export const createServerClient = createClient
