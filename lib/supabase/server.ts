import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Cliente Supabase para uso em Server Components e Server Actions
 * Importante: sempre criar uma nova instância, nunca usar variável global
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // O método "setAll" foi chamado de um Server Component.
          // Isso pode ser ignorado se você tiver middleware atualizando
          // as sessões dos usuários.
        }
      },
    },
  })
}

export const createServerClient = createClient
