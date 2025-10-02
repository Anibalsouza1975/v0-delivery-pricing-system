import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar conversas do backup com filtros
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const busca = searchParams.get("busca") || ""
    const limite = Number.parseInt(searchParams.get("limite") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("whatsapp_conversas_backup")
      .select(
        `
        *,
        whatsapp_mensagens_backup (count)
      `,
        { count: "exact" },
      )
      .order("data_backup", { ascending: false })
      .range(offset, offset + limite - 1)

    // Aplicar filtro de busca se fornecido
    if (busca) {
      query = query.or(`cliente_nome.ilike.%${busca}%,cliente_telefone.ilike.%${busca}%`)
    }

    const { data: conversas, error, count } = await query

    if (error) {
      console.error("[v0] Erro ao buscar conversas backup:", error)
      return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversas: conversas || [],
      total: count || 0,
    })
  } catch (error) {
    console.error("[v0] Erro na API conversas backup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
