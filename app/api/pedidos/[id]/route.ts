import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const pedidoId = params.id

    const supabase = await createClient()

    const { data: pedidoAtual, error: errorBusca } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single()

    if (errorBusca) {
      console.error("Erro ao buscar pedido:", errorBusca)
      return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("pedidos")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedidoId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar pedido:", error)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    if (status === "concluido" && pedidoAtual.status !== "concluido") {
      console.log("Inserindo venda para pedido concluído:", pedidoId)

      // Inserir na tabela vendas
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .insert({
          numero_pedido: pedidoAtual.numero_pedido,
          cliente_nome: pedidoAtual.cliente_nome,
          cliente_telefone: pedidoAtual.cliente_telefone,
          cliente_endereco: pedidoAtual.cliente_endereco,
          total: pedidoAtual.total,
          taxa_entrega: pedidoAtual.taxa_entrega || 0,
          forma_pagamento: pedidoAtual.forma_pagamento,
          status: "entregue", // Status final na tabela vendas
          observacoes: pedidoAtual.observacoes_pedido,
          data_venda: new Date().toISOString(),
        })
        .select()
        .single()

      if (vendaError) {
        console.error("Erro ao inserir venda:", vendaError)
        // Não falhar a atualização do pedido por causa da venda
      } else {
        console.log("Venda inserida com sucesso:", vendaData?.id)

        // Inserir itens da venda
        if (pedidoAtual.itens && Array.isArray(pedidoAtual.itens)) {
          const { data: produtos } = await supabase.from("produtos").select("id, nome")
          const { data: bebidas } = await supabase.from("bebidas").select("id, nome")
          const { data: combos } = await supabase.from("combos").select("id, nome")

          const itensVenda = pedidoAtual.itens.map((item: any) => {
            let produto_id = null
            let bebida_id = null
            let combo_id = null

            // Buscar produto pelo nome (case insensitive)
            const produtoEncontrado = produtos?.find(
              (p) => p.nome.toLowerCase().trim() === item.nome?.toLowerCase().trim(),
            )
            if (produtoEncontrado) {
              produto_id = produtoEncontrado.id
            }

            // Se não encontrou produto, buscar bebida
            if (!produto_id) {
              const bebidaEncontrada = bebidas?.find(
                (b) => b.nome.toLowerCase().trim() === item.nome?.toLowerCase().trim(),
              )
              if (bebidaEncontrada) {
                bebida_id = bebidaEncontrada.id
              }
            }

            // Se não encontrou produto nem bebida, buscar combo
            if (!produto_id && !bebida_id) {
              const comboEncontrado = combos?.find(
                (c) => c.nome.toLowerCase().trim() === item.nome?.toLowerCase().trim(),
              )
              if (comboEncontrado) {
                combo_id = comboEncontrado.id
              }
            }

            console.log(`[v0] Item: ${item.nome} -> Produto: ${produto_id}, Bebida: ${bebida_id}, Combo: ${combo_id}`)

            return {
              venda_id: vendaData.id,
              produto_id,
              bebida_id,
              combo_id,
              quantidade: item.quantidade || 1,
              preco_unitario: item.preco || 0,
              subtotal: (item.preco || 0) * (item.quantidade || 1),
            }
          })

          const { error: itensError } = await supabase.from("itens_venda").insert(itensVenda)

          if (itensError) {
            console.error("Erro ao inserir itens da venda:", itensError)
          } else {
            console.log("Itens da venda inseridos com sucesso com associações:", itensVenda.length)
          }
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pedidoId = params.id

    const supabase = await createClient()

    const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId)

    if (error) {
      console.error("Erro ao excluir pedido:", error)
      return NextResponse.json({ error: "Erro ao excluir pedido" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
