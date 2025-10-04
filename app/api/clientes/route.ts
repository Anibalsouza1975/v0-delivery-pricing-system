import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca")
    const status = searchParams.get("status")

    let query = supabase.from("clientes").select("*").order("ultimo_pedido_at", { ascending: false, nullsFirst: false })

    // Filtrar por busca
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,endereco.ilike.%${busca}%`)
    }

    // Filtrar por status
    if (status && status !== "todos") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Erro ao buscar clientes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Erro na API de clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
