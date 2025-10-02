import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const telefone = searchParams.get("telefone")

    if (!telefone) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }

    console.log("[v0] Buscando mensagens para telefone:", telefone)

    // Buscar conversa
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id, cliente_nome")
      .eq("cliente_telefone", telefone)
      .single()

    if (!conversa) {
      return NextResponse.json({ messages: [], clienteNome: telefone })
    }

    // Buscar mensagens
    const { data: mensagens, error } = await supabase
      .from("whatsapp_mensagens")
      .select("*")
      .eq("conversa_id", conversa.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Erro ao buscar mensagens:", error)
      return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
    }

    return NextResponse.json({
      messages: mensagens || [],
      clienteNome: conversa.cliente_nome,
    })
  } catch (error) {
    console.error("[v0] Erro no endpoint de mensagens:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
