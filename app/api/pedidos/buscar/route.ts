import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const numeroPedido = searchParams.get("numero")

  if (!numeroPedido) {
    return NextResponse.json({ error: "Número do pedido é obrigatório" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    console.log("[v0] Buscando pedido no BD:", numeroPedido)

    const { data: pedidoNovo, error: errorPedido } = await supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", numeroPedido)
      .single()

    let pedido = null

    if (!errorPedido && pedidoNovo) {
      console.log("[v0] Pedido encontrado na tabela pedidos:", pedidoNovo.numero_pedido)
      pedido = pedidoNovo
    } else {
      console.log("[v0] Pedido não encontrado na tabela pedidos, buscando na tabela vendas...")

      const { data: pedidoAntigo, error: errorVenda } = await supabase
        .from("vendas")
        .select("*")
        .eq("numero_pedido", numeroPedido)
        .single()

      if (errorVenda || !pedidoAntigo) {
        console.log("[v0] Pedido não encontrado em nenhuma tabela:", numeroPedido)
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }

      console.log("[v0] Pedido encontrado na tabela vendas:", pedidoAntigo.numero_pedido)

      pedido = {
        id: pedidoAntigo.id,
        numero_pedido: pedidoAntigo.numero_pedido,
        cliente_nome: pedidoAntigo.cliente_nome,
        cliente_telefone: pedidoAntigo.cliente_telefone,
        cliente_endereco: pedidoAntigo.cliente_endereco,
        cliente_complemento: "",
        cliente_observacoes: pedidoAntigo.observacoes || "",
        itens: [], // Vendas antigas não têm itens detalhados
        subtotal: pedidoAntigo.total - (pedidoAntigo.taxa_entrega || 0),
        taxa_entrega: pedidoAntigo.taxa_entrega || 0,
        total: pedidoAntigo.total,
        forma_pagamento: pedidoAntigo.forma_pagamento,
        observacoes_pedido: pedidoAntigo.observacoes || "",
        status: pedidoAntigo.status,
        origem: "venda_antiga",
        created_at: pedidoAntigo.created_at,
        updated_at: pedidoAntigo.updated_at,
      }
    }

    if (pedido.itens && Array.isArray(pedido.itens) && pedido.itens.length > 0) {
      const itensComImagens = await Promise.all(
        pedido.itens.map(async (item: any) => {
          let imagemUrl = null

          if (item.id) {
            // Primeiro tentar buscar como produto
            const { data: produto } = await supabase.from("produtos").select("imagem_url").eq("id", item.id).single()

            if (produto?.imagem_url) {
              imagemUrl = produto.imagem_url
            } else {
              // Se não encontrou como produto, tentar como bebida
              const { data: bebida } = await supabase.from("bebidas").select("imagem_url").eq("id", item.id).single()

              if (bebida?.imagem_url) {
                imagemUrl = bebida.imagem_url
              } else {
                // Se não encontrou como bebida, tentar como combo
                const { data: combo } = await supabase.from("combos").select("imagem_url").eq("id", item.id).single()

                if (combo?.imagem_url) {
                  imagemUrl = combo.imagem_url
                }
              }
            }
          }

          console.log(`[v0] Item ${item.nome}: imagem encontrada = ${imagemUrl ? "SIM" : "NÃO"}`)

          return {
            ...item,
            imagem_url: imagemUrl,
          }
        }),
      )

      pedido.itens = itensComImagens
      console.log("[v0] Imagens dos produtos adicionadas aos itens")
    } else if (pedido.origem === "venda_antiga") {
      const { data: itensVenda } = await supabase.from("itens_venda").select("*").eq("venda_id", pedido.id)

      if (itensVenda && itensVenda.length > 0) {
        pedido.itens = itensVenda.map((item: any) => ({
          id: item.produto_id || item.bebida_id || item.combo_id,
          nome: "Item do pedido",
          quantidade: item.quantidade,
          preco: item.preco_unitario,
          imagem_url: null,
        }))
        console.log("[v0] Itens da venda antiga carregados:", itensVenda.length)
      }
    }

    return NextResponse.json({ pedido })
  } catch (error) {
    console.error("[v0] Erro na busca:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
