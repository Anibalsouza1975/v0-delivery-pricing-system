import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const telefone = searchParams.get("telefone")

    let query = supabase
      .from("whatsapp_conversas")
      .select(`
        *,
        whatsapp_mensagens (
          id,
          tipo,
          conteudo,
          status,
          created_at
        )
      `)
      .order("updated_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (telefone) {
      query = query.eq("cliente_telefone", telefone)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Erro ao buscar conversas:", error)
      return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
    }

    const conversas =
      data?.map((conversa) => ({
        id: conversa.id,
        cliente: conversa.cliente_nome,
        telefone: conversa.cliente_telefone,
        status: conversa.status,
        ultimaMensagem: conversa.ultima_mensagem || "Sem mensagens",
        timestamp: new Date(conversa.updated_at),
        mensagens:
          conversa.whatsapp_mensagens
            ?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((msg: any) => ({
              id: msg.id,
              tipo: msg.tipo,
              conteudo: msg.conteudo,
              status: msg.status,
              timestamp: new Date(msg.created_at),
            })) || [],
      })) || []

    return NextResponse.json({ success: true, conversas })
  } catch (error) {
    console.error("[v0] Erro na API conversas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { cliente_nome, cliente_telefone, mensagem } = await request.json()

    const { data: conversaExistente } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", cliente_telefone)
      .eq("status", "ativa")
      .single()

    let conversaId = conversaExistente?.id

    if (!conversaId) {
      const { data: novaConversa, error } = await supabase
        .from("whatsapp_conversas")
        .insert({
          cliente_nome,
          cliente_telefone,
          status: "ativa",
          ultima_mensagem: mensagem,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao criar conversa:", error)
        return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
      }

      conversaId = novaConversa.id
    }

    const { error: msgError } = await supabase.from("whatsapp_mensagens").insert({
      conversa_id: conversaId,
      tipo: "cliente",
      conteudo: mensagem,
    })

    if (msgError) {
      console.error("[v0] Erro ao salvar mensagem:", msgError)
      return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversa_id: conversaId })
  } catch (error) {
    console.error("[v0] Erro na API conversas POST:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
