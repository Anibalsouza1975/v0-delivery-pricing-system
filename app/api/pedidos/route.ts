import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enviarNotificacaoPedido } from "@/lib/whatsapp-order-notifications"

export async function POST(request: NextRequest) {
  try {
    const pedido = await request.json()
    console.log("[v0] API: Recebendo pedido:", pedido.id)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("pedidos")
      .insert([
        {
          id: pedido.id,
          numero_pedido: pedido.id,
          cliente_nome: pedido.cliente.nome,
          cliente_telefone: pedido.cliente.telefone,
          cliente_endereco: pedido.cliente.endereco,
          cliente_complemento: pedido.cliente.complemento || "",
          cliente_observacoes: pedido.cliente.observacoes || "",
          itens: pedido.itens,
          subtotal: pedido.subtotal,
          taxa_entrega: pedido.frete || 0,
          total: pedido.total,
          forma_pagamento: pedido.formaPagamento,
          observacoes_pedido: pedido.observacoes || "",
          status: pedido.status || "pendente",
          origem: "menu",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] API: Erro ao inserir pedido:", error)
      return NextResponse.json({ error: "Erro ao salvar pedido", details: error.message }, { status: 500 })
    }

    console.log("[v0] API: Pedido salvo com sucesso:", data.id)

    console.log("[v0] Enviando notificação de novo pedido via WhatsApp")
    enviarNotificacaoPedido({
      numeroPedido: data.numero_pedido,
      clienteNome: pedido.cliente.nome || "Cliente",
      clienteTelefone: pedido.cliente.telefone,
      status: data.status,
      total: data.total,
      subtotal: data.subtotal,
      taxaEntrega: data.taxa_entrega,
      enderecoEntrega: pedido.cliente.endereco,
      formaPagamento: pedido.formaPagamento,
      itens: pedido.itens,
      pedidoPago:
        pedido.formaPagamento?.toLowerCase().includes("pix") || pedido.formaPagamento?.toLowerCase().includes("cartão"),
    }).catch((err) => {
      console.error("[v0] Erro ao enviar notificação WhatsApp:", err)
      // Não falhar a criação do pedido por causa da notificação
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API: Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const limit = searchParams.get("limit")

    const supabase = await createClient()

    let query = supabase.from("pedidos").select("*").order("created_at", { ascending: false })

    if (status === "ativos") {
      query = supabase
        .from("pedidos")
        .select("*")
        .or(
          "status.neq.concluido,and(status.eq.concluido,created_at.gte." +
            new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() +
            ")",
        )
        .order("created_at", { ascending: false })
        .limit(50)
    } else if (status && status !== "todos") {
      query = query.eq("status", status)
    }

    // Filtros de data
    if (dataInicio) {
      query = query.gte("created_at", dataInicio)
    }

    if (dataFim) {
      query = query.lte("created_at", dataFim)
    }

    // Limite de resultados
    if (limit && status !== "ativos") {
      query = query.limit(Number.parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] API: Erro ao buscar pedidos:", error)
      return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
    }

    console.log(`[v0] API: Retornando ${data?.length || 0} pedidos`)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] API: Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
