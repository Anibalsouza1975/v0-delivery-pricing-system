import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Buscar todos os pedidos com informações de clientes
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select("cliente_nome, cliente_telefone, cliente_endereco, cliente_complemento, total, created_at")
      .not("cliente_telefone", "is", null)

    if (pedidosError) throw pedidosError

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum pedido encontrado para migrar",
        clientesMigrados: 0,
      })
    }

    // Agrupar pedidos por telefone para criar clientes únicos
    const clientesMap = new Map<
      string,
      {
        nome: string
        telefone: string
        endereco?: string
        complemento?: string
        total_pedidos: number
        total_gasto: number
        ultimo_pedido_at: string
        primeiro_pedido_at: string
      }
    >()

    pedidos.forEach((pedido) => {
      const telefone = pedido.cliente_telefone?.trim()
      if (!telefone) return

      const clienteExistente = clientesMap.get(telefone)

      if (clienteExistente) {
        // Atualizar cliente existente
        clienteExistente.total_pedidos += 1
        clienteExistente.total_gasto += pedido.total || 0
        if (new Date(pedido.created_at) > new Date(clienteExistente.ultimo_pedido_at)) {
          clienteExistente.ultimo_pedido_at = pedido.created_at
        }
        if (new Date(pedido.created_at) < new Date(clienteExistente.primeiro_pedido_at)) {
          clienteExistente.primeiro_pedido_at = pedido.created_at
        }
      } else {
        // Criar novo cliente
        clientesMap.set(telefone, {
          nome: pedido.cliente_nome?.trim() || "Cliente",
          telefone: telefone,
          endereco: pedido.cliente_endereco?.trim(),
          complemento: pedido.cliente_complemento?.trim(),
          total_pedidos: 1,
          total_gasto: pedido.total || 0,
          ultimo_pedido_at: pedido.created_at,
          primeiro_pedido_at: pedido.created_at,
        })
      }
    })

    // Inserir clientes na tabela
    const clientesParaInserir = Array.from(clientesMap.values()).map((cliente) => ({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      complemento: cliente.complemento,
      total_pedidos: cliente.total_pedidos,
      total_gasto: cliente.total_gasto,
      ultimo_pedido_at: cliente.ultimo_pedido_at,
      created_at: cliente.primeiro_pedido_at,
      status:
        cliente.total_gasto >= 500 || cliente.total_pedidos >= 5
          ? "vip"
          : new Date(cliente.ultimo_pedido_at) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            ? "inativo"
            : "ativo",
    }))

    // Inserir clientes (ignorar duplicatas)
    const { data: clientesInseridos, error: insertError } = await supabase
      .from("clientes")
      .upsert(clientesParaInserir, {
        onConflict: "telefone",
        ignoreDuplicates: false,
      })
      .select()

    if (insertError) throw insertError

    // Atualizar pedidos com cliente_id
    const { data: clientesAtualizados, error: clientesError } = await supabase.from("clientes").select("id, telefone")

    if (clientesError) throw clientesError

    // Criar mapa de telefone -> cliente_id
    const telefoneParaClienteId = new Map<string, string>()
    clientesAtualizados?.forEach((cliente) => {
      telefoneParaClienteId.set(cliente.telefone, cliente.id)
    })

    // Atualizar pedidos em lotes
    const pedidosParaAtualizar = pedidos
      .map((pedido) => {
        const clienteId = telefoneParaClienteId.get(pedido.cliente_telefone?.trim() || "")
        if (!clienteId) return null

        return {
          cliente_telefone: pedido.cliente_telefone,
          cliente_id: clienteId,
        }
      })
      .filter((p) => p !== null)

    // Atualizar cada pedido com seu cliente_id
    for (const pedido of pedidosParaAtualizar) {
      await supabase
        .from("pedidos")
        .update({ cliente_id: pedido.cliente_id })
        .eq("cliente_telefone", pedido.cliente_telefone)
    }

    return NextResponse.json({
      success: true,
      message: "Clientes migrados com sucesso!",
      clientesMigrados: clientesParaInserir.length,
      pedidosAtualizados: pedidosParaAtualizar.length,
    })
  } catch (error) {
    console.error("Erro ao migrar clientes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao migrar clientes",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
