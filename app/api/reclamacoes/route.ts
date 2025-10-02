import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const categoria = searchParams.get("categoria")
    const busca = searchParams.get("busca")

    let query = supabase.from("reclamacoes").select("*").order("data_criacao", { ascending: false })

    if (status && status !== "todos") {
      query = query.eq("status", status)
    }

    if (categoria && categoria !== "todos") {
      query = query.eq("categoria", categoria)
    }

    if (busca) {
      query = query.or(
        `numero_ticket.ilike.%${busca}%,numero_pedido.ilike.%${busca}%,cliente_nome.ilike.%${busca}%,cliente_telefone.ilike.%${busca}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar reclamações:", error)
      return NextResponse.json({ error: "Erro ao buscar reclamações" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Erro no GET /api/reclamacoes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numero_pedido, cliente_nome, cliente_telefone, categoria, descricao } = body

    if (!cliente_nome || !cliente_telefone || !categoria || !descricao) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Gerar número do ticket
    const dataAtual = new Date()
    const ano = dataAtual.getFullYear()
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0")
    const dia = String(dataAtual.getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-6)
    const numero_ticket = `TKT${ano}${mes}${dia}${timestamp}`

    const { data, error } = await supabase
      .from("reclamacoes")
      .insert({
        numero_ticket,
        numero_pedido,
        cliente_nome,
        cliente_telefone,
        categoria,
        descricao,
        status: "aberto",
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar reclamação:", error)
      return NextResponse.json({ error: "Erro ao criar reclamação" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Erro no POST /api/reclamacoes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
