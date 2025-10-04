import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Cliente {
  id: string
  nome: string
  telefone: string
  endereco?: string
  bairro?: string
  cidade?: string
  complemento?: string
  total_pedidos: number
  total_gasto: number
  ultimo_pedido_at?: string
  status: "ativo" | "inativo" | "vip"
  created_at: string
  updated_at: string
}

export interface CriarClienteData {
  nome: string
  telefone: string
  endereco?: string
  bairro?: string
  cidade?: string
  complemento?: string
}

/**
 * Busca ou cria um cliente pelo telefone
 * Usado quando um novo pedido é criado
 */
export async function buscarOuCriarCliente(data: CriarClienteData): Promise<Cliente | null> {
  try {
    // Primeiro, tenta buscar o cliente existente pelo telefone
    const { data: clienteExistente, error: erroConsulta } = await supabase
      .from("clientes")
      .select("*")
      .eq("telefone", data.telefone)
      .single()

    if (clienteExistente) {
      // Cliente já existe, atualiza informações se necessário
      const { data: clienteAtualizado, error: erroAtualizacao } = await supabase
        .from("clientes")
        .update({
          nome: data.nome || clienteExistente.nome,
          endereco: data.endereco || clienteExistente.endereco,
          bairro: data.bairro || clienteExistente.bairro,
          cidade: data.cidade || clienteExistente.cidade,
          complemento: data.complemento || clienteExistente.complemento,
        })
        .eq("id", clienteExistente.id)
        .select()
        .single()

      if (erroAtualizacao) {
        console.error("[v0] Erro ao atualizar cliente:", erroAtualizacao)
        return clienteExistente
      }

      return clienteAtualizado
    }

    // Cliente não existe, cria um novo
    const { data: novoCliente, error: erroCriacao } = await supabase
      .from("clientes")
      .insert({
        nome: data.nome || "Cliente",
        telefone: data.telefone,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        complemento: data.complemento,
        status: "ativo",
      })
      .select()
      .single()

    if (erroCriacao) {
      console.error("[v0] Erro ao criar cliente:", erroCriacao)
      return null
    }

    return novoCliente
  } catch (error) {
    console.error("[v0] Erro em buscarOuCriarCliente:", error)
    return null
  }
}

/**
 * Atualiza as estatísticas de um cliente (total de pedidos, total gasto, etc.)
 */
export async function atualizarEstatisticasCliente(clienteId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("atualizar_estatisticas_cliente", {
      p_cliente_id: clienteId,
    })

    if (error) {
      console.error("[v0] Erro ao atualizar estatísticas do cliente:", error)
    }
  } catch (error) {
    console.error("[v0] Erro em atualizarEstatisticasCliente:", error)
  }
}
