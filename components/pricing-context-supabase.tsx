"use client"

import { createContext, useState, useEffect, useRef, type ReactNode, useContext } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CustoFixo, CustoVariavel, Insumo, Produto, Bebida, Combo } from "@/app/page"

// Interfaces adaptadas para Supabase
export interface EstoqueInsumo {
  id: string
  insumo_id: string
  quantidade_atual: number
  quantidade_minima: number
  created_at: string
  updated_at: string
}

export interface CompraInsumo {
  id: string
  insumo_id: string
  quantidade: number
  preco_unitario: number
  quantidade_restante: number
  data_compra: string
  created_at: string
}

export interface IngredienteBase {
  id: string
  nome: string
  categoria: string
  unidade: string
  preco_unitario: number
  fornecedor?: string
  created_at: string
  updated_at: string
}

export interface Adicional {
  id: string
  nome: string
  preco: number
  insumo_id?: string
  categorias: string[]
  ativo: boolean
  imagem_url?: string
  descricao?: string
  created_at: string
  updated_at: string
}

export interface Personalizacao {
  id: string
  nome: string
  tipo: "remover" | "substituir"
  descricao?: string
  categorias: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Venda {
  id: string
  numero_pedido: string
  cliente_nome?: string
  cliente_telefone?: string
  cliente_endereco?: string
  total: number
  taxa_entrega: number
  forma_pagamento: string
  status: string
  observacoes?: string
  data_venda: string
  created_at: string
  updated_at: string
}

export interface ItemVenda {
  id: string
  venda_id: string
  produto_id?: string
  bebida_id?: string
  combo_id?: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  created_at: string
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  created_at: string
}

export interface Categoria {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

interface PricingContextType {
  // Estados
  custosFixos: CustoFixo[]
  custosVariaveis: CustoVariavel[]
  ingredientesBase: IngredienteBase[]
  insumos: Insumo[]
  produtos: Produto[]
  bebidas: Bebida[]
  combos: Combo[]
  vendas: Venda[]
  itensVenda: ItemVenda[]
  estoqueInsumos: EstoqueInsumo[]
  comprasInsumos: CompraInsumo[]
  notificacoes: Notificacao[]
  adicionais: Adicional[]
  personalizacoes: Personalizacao[]
  categorias: Categoria[]

  // Estados de loading
  loading: boolean

  // Funções CRUD para custos fixos
  addCustoFixo: (custo: Omit<CustoFixo, "id">) => Promise<void>
  updateCustoFixo: (id: string, custo: Partial<CustoFixo>) => Promise<void>
  deleteCustoFixo: (id: string) => Promise<void>

  // Funções CRUD para custos variáveis
  addCustoVariavel: (custo: Omit<CustoVariavel, "id">) => Promise<void>
  updateCustoVariavel: (id: string, custo: Partial<CustoVariavel>) => Promise<void>
  deleteCustoVariavel: (id: string) => Promise<void>

  // Funções CRUD para ingredientes base
  addIngredienteBase: (ingrediente: Omit<IngredienteBase, "id" | "created_at" | "updated_at">) => Promise<void>
  updateIngredienteBase: (id: string, ingrediente: Partial<IngredienteBase>) => Promise<void>
  deleteIngredienteBase: (id: string) => Promise<void>

  // Funções CRUD para insumos
  addInsumo: (insumo: Omit<Insumo, "id">) => Promise<void>
  updateInsumo: (id: string, insumo: Partial<Insumo>) => Promise<void>
  deleteInsumo: (id: string) => Promise<void>

  // Funções CRUD para produtos
  addProduto: (produto: Omit<Produto, "id">) => Promise<void>
  updateProduto: (id: string, produto: Partial<Produto>) => Promise<void>
  deleteProduto: (id: string) => Promise<void>

  // Funções CRUD para bebidas
  addBebida: (bebida: Omit<Bebida, "id">) => Promise<void>
  updateBebida: (id: string, bebida: Partial<Bebida>) => Promise<void>
  deleteBebida: (id: string) => Promise<void>

  // Funções CRUD para combos
  addCombo: (combo: Omit<Combo, "id">) => Promise<void>
  updateCombo: (id: string, combo: Partial<Combo>) => Promise<void>
  deleteCombo: (id: string) => Promise<void>

  // Funções CRUD para adicionais
  addAdicional: (adicional: Omit<Adicional, "id" | "created_at" | "updated_at">) => Promise<void>
  updateAdicional: (id: string, adicional: Partial<Adicional>) => Promise<void>
  deleteAdicional: (id: string) => Promise<void>

  // Funções CRUD para personalizações
  addPersonalizacao: (personalizacao: Omit<Personalizacao, "id" | "created_at" | "updated_at">) => Promise<void>
  updatePersonalizacao: (id: string, personalizacao: Partial<Personalizacao>) => Promise<void>
  deletePersonalizacao: (id: string) => Promise<void>

  // Funções CRUD para vendas
  addVenda: (venda: Omit<Venda, "id" | "numero_pedido" | "created_at" | "updated_at">) => Promise<string>
  updateVenda: (id: string, venda: Partial<Venda>) => Promise<void>
  deleteVenda: (id: string) => Promise<void>

  // Funções CRUD para categorias
  addCategoria: (categoria: Omit<Categoria, "id" | "created_at" | "updated_at">) => Promise<void>
  updateCategoria: (id: string, categoria: Partial<Categoria>) => Promise<void>
  deleteCategoria: (id: string) => Promise<void>

  // Funções de estoque
  registrarCompra: (insumo_id: string, quantidade: number, preco_unitario: number) => Promise<void>
  getEstoqueAtual: (insumo_id: string) => number
  getEstoqueAtualIngrediente: (ingrediente_base_id: string) => number
  baixarEstoque: (insumo_id: string, quantidade: number, motivo: string, venda_id?: string) => Promise<boolean>
  verificarEstoqueSuficiente: (produto_id: string, quantidade: number) => Promise<boolean>
  abaterEstoquePorVenda: (pedidoId: string) => Promise<void>

  // Funções de cálculo
  getTotalCustosFixos: () => number
  getTotalCustosVariaveis: () => number
  calculateCMV: (produto_id: string) => Promise<number>
  calculatePrecoVenda: (cmv: number, margem: number) => number

  // Funções de notificação
  addNotificacao: (notificacao: Omit<Notificacao, "id" | "created_at">) => Promise<void>
  marcarNotificacaoLida: (id: string) => Promise<void>

  // Função de refresh com loading (para uso manual)
  refreshData: () => Promise<void>
  // Função de refresh silencioso (para atualizações automáticas)
  refreshDataSilent: () => Promise<void>
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

export function PricingProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const isInitializedRef = useRef(false)
  const isLoadingRef = useRef(false)

  // Estados
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([])
  const [custosVariaveis, setCustosVariaveis] = useState<CustoVariavel[]>([])
  const [ingredientesBase, setIngredientesBase] = useState<IngredienteBase[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([])
  const [estoqueInsumos, setEstoqueInsumos] = useState<EstoqueInsumo[]>([])
  const [comprasInsumos, setComprasInsumos] = useState<CompraInsumo[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [adicionais, setAdicionais] = useState<Adicional[]>([])
  const [personalizacoes, setPersonalizacoes] = useState<Personalizacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const addNotificacao = async (notificacao: Omit<Notificacao, "id" | "created_at">) => {
    try {
      console.log("[v0] Adicionando notificação:", notificacao)
      const { data, error } = await supabase.from("notificacoes").insert([notificacao]).select().single()

      if (error) {
        console.error("[v0] Erro ao adicionar notificação:", error)
        throw error
      }
      if (data) {
        setNotificacoes((prev) => [data, ...prev])
        console.log("[v0] Notificação adicionada com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao adicionar notificação:", error)
      throw error
    }
  }

  const marcarNotificacaoLida = async (id: string) => {
    try {
      const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id)
      if (error) throw error
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch (error) {
      console.error("[v0] Erro ao marcar notificação como lida:", error)
      throw error
    }
  }

  // Funções CRUD para categorias
  const addCategoria = async (categoria: Omit<Categoria, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("[v0] Adicionando categoria:", categoria)

      const categoriaExistente = categorias.find((c) => c.nome.toLowerCase() === categoria.nome.toLowerCase())
      if (categoriaExistente) {
        throw new Error(`A categoria "${categoria.nome}" já existe.`)
      }

      const { data, error } = await supabase.from("categorias").insert([categoria]).select().single()

      if (error) {
        console.error("[v0] Erro ao adicionar categoria:", error)
        if (error.code === "23505" && error.message.includes("categorias_nome_key")) {
          throw new Error(`A categoria "${categoria.nome}" já existe.`)
        }
        throw error
      }
      if (data) {
        setCategorias((prev) => [...prev, data])
        console.log("[v0] Categoria adicionada com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao adicionar categoria:", error)
      throw error
    }
  }

  const updateCategoria = async (id: string, categoria: Partial<Categoria>) => {
    try {
      console.log("[v0] Atualizando categoria:", id, categoria)
      const { data, error } = await supabase.from("categorias").update(categoria).eq("id", id).select().single()

      if (error) {
        console.error("[v0] Erro ao atualizar categoria:", error)
        throw error
      }
      if (data) {
        setCategorias((prev) => prev.map((c) => (c.id === id ? data : c)))
        console.log("[v0] Categoria atualizada com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao atualizar categoria:", error)
      throw error
    }
  }

  const deleteCategoria = async (id: string) => {
    try {
      console.log("[v0] Excluindo categoria:", id)

      // Verificar se a categoria está sendo usada em produtos
      const { data: produtosUsandoCategoria } = await supabase
        .from("produtos")
        .select("id, nome")
        .eq("categoria", categorias.find((c) => c.id === id)?.nome)

      if (produtosUsandoCategoria && produtosUsandoCategoria.length > 0) {
        const nomeCategoria = categorias.find((c) => c.id === id)?.nome || "categoria"
        const quantidadeProdutos = produtosUsandoCategoria.length
        const produtosNomes = produtosUsandoCategoria.map((p) => p.nome).join(", ")

        let mensagem = `Para excluir a categoria "${nomeCategoria}", você precisa primeiro excluir ou alterar a categoria `

        if (quantidadeProdutos === 1) {
          mensagem += `do produto: ${produtosNomes}`
        } else {
          mensagem += `dos ${quantidadeProdutos} produtos: ${produtosNomes}`
        }

        mensagem += `.\n\nVocê pode editar cada produto e alterar sua categoria, ou excluir os produtos que não são mais necessários.`

        throw new Error(mensagem)
      }

      // Deletar realmente do banco de dados em vez de marcar como inativo
      const { error } = await supabase.from("categorias").delete().eq("id", id)

      if (error) {
        console.error("[v0] Erro ao excluir categoria:", error)
        throw error
      }

      setCategorias((prev) => prev.filter((c) => c.id !== id))
      console.log("[v0] Categoria excluída com sucesso")
    } catch (error) {
      throw error
    }
  }

  const loadAllData = async () => {
    // Evitar execuções simultâneas
    if (isLoadingRef.current) {
      console.log("[v0] Carregamento já em andamento, ignorando...")
      return
    }

    try {
      isLoadingRef.current = true
      console.log("[v0] Iniciando carregamento único de dados...")
      setLoading(true)

      // Carregar dados básicos primeiro (tabelas que sabemos que existem)
      const [
        custosFixosData,
        custosVariaveisData,
        ingredientesBaseData,
        insumosData,
        produtosData,
        bebidasData,
        combosData,
        vendasData,
        itensVendaData,
        estoqueData,
        comprasData,
        notificacoesData,
      ] = await Promise.all([
        supabase.from("custos_fixos").select("*").order("nome"),
        supabase.from("custos_variaveis").select("*").order("nome"),
        supabase.from("ingredientes_base").select("*").order("nome"),
        supabase
          .from("insumos")
          .select(`
          *,
          ingredientes_base!ingrediente_base_id (
            nome
          )
        `)
          .order("nome"),
        supabase
          .from("produtos")
          .select(`
          *,
          produto_insumos (
            insumo_id,
            quantidade
          )
        `)
          .order("nome"),
        supabase.from("bebidas").select("*").order("nome"),
        supabase
          .from("combos")
          .select(`
          *,
          combo_produtos (
            produto_id,
            quantidade
          ),
          combo_bebidas (
            bebida_id,
            quantidade
          )
        `)
          .order("nome"),
        supabase.from("vendas").select("*").order("data_venda", { ascending: false }),
        supabase.from("itens_venda").select("*").order("created_at", { ascending: false }),
        supabase.from("estoque_insumos").select("*"),
        supabase.from("compras_insumos").select("*").order("data_compra", { ascending: false }),
        supabase.from("notificacoes").select("*").order("created_at", { ascending: false }),
      ])

      let adicionaisData = { data: [], error: null }
      let personalizacoesData = { data: [], error: null }
      let categoriasData = { data: [], error: null }

      try {
        adicionaisData = await supabase.from("adicionais").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar adicionais:", error)
        adicionaisData.error = error
      }

      try {
        personalizacoesData = await supabase.from("personalizacoes").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar personalizações:", error)
        personalizacoesData.error = error
      }

      try {
        categoriasData = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar categorias:", error)
        categoriasData.error = error
      }

      // Processar e definir estados com verificação de erro
      if (custosFixosData.error) {
        console.error("[v0] Erro ao carregar custos fixos:", custosFixosData.error)
      } else if (custosFixosData.data) {
        setCustosFixos(custosFixosData.data)
      }

      if (custosVariaveisData.error) {
        console.error("[v0] Erro ao carregar custos variáveis:", custosVariaveisData.error)
      } else if (custosVariaveisData.data) {
        setCustosVariaveis(custosVariaveisData.data)
      }

      if (ingredientesBaseData.error) {
        console.error("[v0] Erro ao carregar ingredientes base:", ingredientesBaseData.error)
      } else if (ingredientesBaseData.data) {
        setIngredientesBase(ingredientesBaseData.data)
      }

      // Processar insumos com proper column mapping
      if (insumosData.error) {
        console.error("[v0] Erro ao carregar insumos:", insumosData.error)
      } else if (insumosData.data) {
        const insumosProcessados = insumosData.data.map((insumo) => ({
          ...insumo,
          ingredienteBaseId: insumo.ingrediente_base_id,
          ingredienteBaseNome: insumo.ingredientes_base?.nome || "N/A",
          quantidadeUso: insumo.rendimento,
          unidadeUso: insumo.unidade,
          precoUnitario: insumo.preco_unitario,
        }))
        setInsumos(insumosProcessados)
      }

      if (produtosData.error) {
        console.error("[v0] Erro ao carregar produtos:", produtosData.error)
      } else if (produtosData.data) {
        const produtosProcessados = produtosData.data.map((produto) => ({
          ...produto,
          precoVenda: produto.preco_venda,
          margemLucro: produto.margem_lucro,
          precoIfood: produto.preco_ifood,
          foto: produto.imagem_url,
          insumos:
            produto.produto_insumos?.map((pi: any) => ({
              insumoId: pi.insumo_id,
              quantidade: pi.quantidade,
            })) || [],
        }))
        setProdutos(produtosProcessados)
        console.log("[v0] Produtos carregados:", produtosProcessados.length, produtosProcessados)
      }

      if (bebidasData.error) {
        console.error("[v0] Erro ao carregar bebidas:", bebidasData.error)
      } else if (bebidasData.data) {
        const bebidasProcessadas = bebidasData.data.map((bebida) => ({
          ...bebida,
          precoVenda: bebida.preco_venda,
          custoUnitario: bebida.custo_unitario,
          precoIfood: bebida.preco_ifood,
          lucroUnitario: bebida.lucro_unitario,
          imagemUrl: bebida.imagem_url,
        }))
        setBebidas(bebidasProcessadas)
        console.log("[v0] Bebidas carregadas:", bebidasProcessadas)
      }

      // Processar combos
      if (combosData.error) {
        console.error("[v0] Erro ao carregar combos:", combosData.error)
      } else if (combosData.data) {
        const combosProcessados = combosData.data.map((combo) => ({
          ...combo,
          precoFinal: combo.preco_final,
          desconto: combo.desconto_percentual,
          foto: combo.imagem_url,
          produtos:
            combo.combo_produtos?.map((cp: any) => ({
              produtoId: cp.produto_id,
              quantidade: cp.quantidade,
            })) || [],
          bebidas:
            combo.combo_bebidas?.map((cb: any) => ({
              bebidaId: cb.bebida_id,
              quantidade: cb.quantidade,
            })) || [],
        }))
        setCombos(combosProcessados)
        console.log("[v0] Combos carregados:", combosProcessados)
      }

      if (vendasData.error) {
        console.error("[v0] Erro ao carregar vendas:", vendasData.error)
      } else if (vendasData.data) {
        setVendas(vendasData.data)
      }

      if (itensVendaData.error) {
        console.error("[v0] Erro ao carregar itens de venda:", itensVendaData.error)
      } else if (itensVendaData.data) {
        setItensVenda(itensVendaData.data)
        console.log("[v0] Itens de venda carregados:", itensVendaData.data.length)
      }

      if (estoqueData.error) {
        console.error("[v0] Erro ao carregar estoque:", estoqueData.error)
      } else if (estoqueData.data) {
        setEstoqueInsumos(estoqueData.data)
      }

      if (comprasData.error) {
        console.error("[v0] Erro ao carregar compras:", comprasData.error)
      } else if (comprasData.data) {
        setComprasInsumos(comprasData.data)
      }

      if (notificacoesData.error) {
        console.error("[v0] Erro ao carregar notificações:", notificacoesData.error)
      } else if (notificacoesData.data) {
        setNotificacoes(notificacoesData.data)
      }

      if (adicionaisData.error) {
        console.error("[v0] Erro ao carregar adicionais:", adicionaisData.error)
        setAdicionais([])
      } else if (adicionaisData.data) {
        setAdicionais(adicionaisData.data)
      }

      if (personalizacoesData.error) {
        console.error("[v0] Erro ao carregar personalizações:", personalizacoesData.error)
        setPersonalizacoes([])
      } else if (personalizacoesData.data) {
        setPersonalizacoes(personalizacoesData.data)
      }

      if (categoriasData.error) {
        console.error("[v0] Erro ao carregar categorias:", categoriasData.error)
        setCategorias([])
      } else if (categoriasData.data) {
        setCategorias(categoriasData.data)
      }

      const categoriasDisponiveis = ["Todos"]
      if (produtosData.data) {
        const categoriasUnicas = [...new Set(produtosData.data.map((p) => p.categoria).filter(Boolean))]
        categoriasDisponiveis.push(...categoriasUnicas)
      }
      if (bebidasData.data) {
        const categoriasBebidas = [...new Set(bebidasData.data.map((b) => b.categoria).filter(Boolean))]
        categoriasBebidas.forEach((cat) => {
          if (!categoriasDisponiveis.includes(cat)) {
            categoriasDisponiveis.push(cat)
          }
        })
      }
      if (combosData.data && combosData.data.length > 0) {
        if (!categoriasDisponiveis.includes("Combos")) {
          categoriasDisponiveis.push("Combos")
        }
      }
      console.log("[v0] Categorias disponíveis:", categoriasDisponiveis)

      console.log("[v0] Dados carregados com sucesso - EXECUÇÃO ÚNICA")
    } catch (error) {
      console.error("[v0] Erro crítico ao carregar dados:", error)
      try {
        await addNotificacao({
          titulo: "Erro ao Carregar Dados",
          mensagem: "Ocorreu um erro ao carregar os dados do sistema.",
          tipo: "error",
          lida: false,
        })
      } catch (notificationError) {
        console.error("[v0] Erro ao criar notificação:", notificationError)
      }
    } finally {
      setLoading(false)
      isLoadingRef.current = false
      console.log("[v0] Carregamento finalizado")
    }
  }

  const refreshDataSilent = async () => {
    // Evitar execuções simultâneas
    if (isLoadingRef.current) {
      console.log("[v0] Carregamento já em andamento, ignorando...")
      return
    }

    try {
      isLoadingRef.current = true
      console.log("[v0] Iniciando atualização silenciosa de dados...")
      // NÃO definir setLoading(true) para evitar mostrar a tela de carregamento

      // Carregar dados básicos primeiro (tabelas que sabemos que existem)
      const [
        custosFixosData,
        custosVariaveisData,
        ingredientesBaseData,
        insumosData,
        produtosData,
        bebidasData,
        combosData,
        vendasData,
        itensVendaData,
        estoqueData,
        comprasData,
        notificacoesData,
      ] = await Promise.all([
        supabase.from("custos_fixos").select("*").order("nome"),
        supabase.from("custos_variaveis").select("*").order("nome"),
        supabase.from("ingredientes_base").select("*").order("nome"),
        supabase
          .from("insumos")
          .select(`
          *,
          ingredientes_base!ingrediente_base_id (
            nome
          )
        `)
          .order("nome"),
        supabase
          .from("produtos")
          .select(`
          *,
          produto_insumos (
            insumo_id,
            quantidade
          )
        `)
          .order("nome"),
        supabase.from("bebidas").select("*").order("nome"),
        supabase
          .from("combos")
          .select(`
          *,
          combo_produtos (
            produto_id,
            quantidade
          ),
          combo_bebidas (
            bebida_id,
            quantidade
          )
        `)
          .order("nome"),
        supabase.from("vendas").select("*").order("data_venda", { ascending: false }),
        supabase.from("itens_venda").select("*").order("created_at", { ascending: false }),
        supabase.from("estoque_insumos").select("*"),
        supabase.from("compras_insumos").select("*").order("data_compra", { ascending: false }),
        supabase.from("notificacoes").select("*").order("created_at", { ascending: false }),
      ])

      let adicionaisData = { data: [], error: null }
      let personalizacoesData = { data: [], error: null }
      let categoriasData = { data: [], error: null }

      try {
        adicionaisData = await supabase.from("adicionais").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar adicionais:", error)
        adicionaisData.error = error
      }

      try {
        personalizacoesData = await supabase.from("personalizacoes").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar personalizações:", error)
        personalizacoesData.error = error
      }

      try {
        categoriasData = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")
      } catch (error) {
        console.error("[v0] Erro ao carregar categorias:", error)
        categoriasData.error = error
      }

      // Processar e definir estados com verificação de erro (mesmo código do loadAllData)
      if (custosFixosData.error) {
        console.error("[v0] Erro ao carregar custos fixos:", custosFixosData.error)
      } else if (custosFixosData.data) {
        setCustosFixos(custosFixosData.data)
      }

      if (custosVariaveisData.error) {
        console.error("[v0] Erro ao carregar custos variáveis:", custosVariaveisData.error)
      } else if (custosVariaveisData.data) {
        setCustosVariaveis(custosVariaveisData.data)
      }

      if (ingredientesBaseData.error) {
        console.error("[v0] Erro ao carregar ingredientes base:", ingredientesBaseData.error)
      } else if (ingredientesBaseData.data) {
        setIngredientesBase(ingredientesBaseData.data)
      }

      // Processar insumos com proper column mapping
      if (insumosData.error) {
        console.error("[v0] Erro ao carregar insumos:", insumosData.error)
      } else if (insumosData.data) {
        const insumosProcessados = insumosData.data.map((insumo) => ({
          ...insumo,
          ingredienteBaseId: insumo.ingrediente_base_id,
          ingredienteBaseNome: insumo.ingredientes_base?.nome || "N/A",
          quantidadeUso: insumo.rendimento,
          unidadeUso: insumo.unidade,
          precoUnitario: insumo.preco_unitario,
        }))
        setInsumos(insumosProcessados)
      }

      if (produtosData.error) {
        console.error("[v0] Erro ao carregar produtos:", produtosData.error)
      } else if (produtosData.data) {
        const produtosProcessados = produtosData.data.map((produto) => ({
          ...produto,
          precoVenda: produto.preco_venda,
          margemLucro: produto.margem_lucro,
          precoIfood: produto.preco_ifood,
          foto: produto.imagem_url,
          insumos:
            produto.produto_insumos?.map((pi: any) => ({
              insumoId: pi.insumo_id,
              quantidade: pi.quantidade,
            })) || [],
        }))
        setProdutos(produtosProcessados)
        console.log("[v0] Produtos atualizados silenciosamente:", produtosProcessados.length)
      }

      if (bebidasData.error) {
        console.error("[v0] Erro ao carregar bebidas:", bebidasData.error)
      } else if (bebidasData.data) {
        const bebidasProcessadas = bebidasData.data.map((bebida) => ({
          ...bebida,
          precoVenda: bebida.preco_venda,
          custoUnitario: bebida.custo_unitario,
          precoIfood: bebida.preco_ifood,
          lucroUnitario: bebida.lucro_unitario,
          imagemUrl: bebida.imagem_url,
        }))
        setBebidas(bebidasProcessadas)
        console.log("[v0] Bebidas atualizadas silenciosamente:", bebidasProcessadas.length)
      }

      // Processar combos
      if (combosData.error) {
        console.error("[v0] Erro ao carregar combos:", combosData.error)
      } else if (combosData.data) {
        const combosProcessados = combosData.data.map((combo) => ({
          ...combo,
          precoFinal: combo.preco_final,
          desconto: combo.desconto_percentual,
          foto: combo.imagem_url,
          produtos:
            combo.combo_produtos?.map((cp: any) => ({
              produtoId: cp.produto_id,
              quantidade: cp.quantidade,
            })) || [],
          bebidas:
            combo.combo_bebidas?.map((cb: any) => ({
              bebidaId: cb.bebida_id,
              quantidade: cb.quantidade,
            })) || [],
        }))
        setCombos(combosProcessados)
        console.log("[v0] Combos atualizados silenciosamente:", combosProcessados.length)
      }

      if (vendasData.error) {
        console.error("[v0] Erro ao carregar vendas:", vendasData.error)
      } else if (vendasData.data) {
        setVendas(vendasData.data)
        console.log("[v0] Vendas atualizadas silenciosamente:", vendasData.data.length)
      }

      if (itensVendaData.error) {
        console.error("[v0] Erro ao carregar itens de venda:", itensVendaData.error)
      } else if (itensVendaData.data) {
        setItensVenda(itensVendaData.data)
        console.log("[v0] Itens de venda atualizados silenciosamente:", itensVendaData.data.length)
      }

      if (estoqueData.error) {
        console.error("[v0] Erro ao carregar estoque:", estoqueData.error)
      } else if (estoqueData.data) {
        setEstoqueInsumos(estoqueData.data)
      }

      if (comprasData.error) {
        console.error("[v0] Erro ao carregar compras:", comprasData.error)
      } else if (comprasData.data) {
        setComprasInsumos(comprasData.data)
      }

      if (notificacoesData.error) {
        console.error("[v0] Erro ao carregar notificações:", notificacoesData.error)
      } else if (notificacoesData.data) {
        setNotificacoes(notificacoesData.data)
      }

      if (adicionaisData.error) {
        console.error("[v0] Erro ao carregar adicionais:", adicionaisData.error)
        setAdicionais([])
      } else if (adicionaisData.data) {
        setAdicionais(adicionaisData.data)
      }

      if (personalizacoesData.error) {
        console.error("[v0] Erro ao carregar personalizações:", personalizacoesData.error)
        setPersonalizacoes([])
      } else if (personalizacoesData.data) {
        setPersonalizacoes(personalizacoesData.data)
      }

      if (categoriasData.error) {
        console.error("[v0] Erro ao carregar categorias:", categoriasData.error)
        setCategorias([])
      } else if (categoriasData.data) {
        setCategorias(categoriasData.data)
      }

      const categoriasDisponiveis = ["Todos"]
      if (produtosData.data) {
        const categoriasUnicas = [...new Set(produtosData.data.map((p) => p.categoria).filter(Boolean))]
        categoriasDisponiveis.push(...categoriasUnicas)
      }
      if (bebidasData.data) {
        const categoriasBebidas = [...new Set(bebidasData.data.map((b) => b.categoria).filter(Boolean))]
        categoriasBebidas.forEach((cat) => {
          if (!categoriasDisponiveis.includes(cat)) {
            categoriasDisponiveis.push(cat)
          }
        })
      }
      if (combosData.data && combosData.data.length > 0) {
        if (!categoriasDisponiveis.includes("Combos")) {
          categoriasDisponiveis.push("Combos")
        }
      }
      console.log("[v0] Categorias disponíveis:", categoriasDisponiveis)

      console.log("[v0] Dados atualizados silenciosamente com sucesso")
    } catch (error) {
      console.error("[v0] Erro crítico ao atualizar dados silenciosamente:", error)
    } finally {
      isLoadingRef.current = false
      console.log("[v0] Atualização silenciosa finalizada")
    }
  }

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log("[v0] Context já inicializado, ignorando useEffect")
      return
    }

    console.log("[v0] Inicializando pricing context pela primeira vez")
    isInitializedRef.current = true

    loadAllData().catch((error) => {
      console.error("[v0] Erro no useEffect ao carregar dados:", error)
      isLoadingRef.current = false
      isInitializedRef.current = false // Permitir nova tentativa em caso de erro
    })

    // Cleanup para resetar em caso de desmontagem
    return () => {
      console.log("[v0] Limpando pricing context")
      isInitializedRef.current = false
      isLoadingRef.current = false
    }
  }, []) // Array de dependências vazio para execução única

  // Funções CRUD para custos fixos
  const addCustoFixo = async (custo: Omit<CustoFixo, "id">) => {
    try {
      console.log("[v0] Adicionando custo fixo:", custo)
      const { data, error } = await supabase.from("custos_fixos").insert([custo]).select().single()

      if (error) {
        console.error("[v0] Erro ao adicionar custo fixo:", error)
        throw error
      }
      if (data) {
        setCustosFixos((prev) => [...prev, data])
        console.log("[v0] Custo fixo adicionado com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao adicionar custo fixo:", error)
      throw error
    }
  }

  const updateCustoFixo = async (id: string, custo: Partial<CustoFixo>) => {
    const { data, error } = await supabase.from("custos_fixos").update(custo).eq("id", id).select().single()

    if (error) throw error
    if (data) setCustosFixos((prev) => prev.map((c) => (c.id === id ? data : c)))
  }

  const deleteCustoFixo = async (id: string) => {
    const { error } = await supabase.from("custos_fixos").delete().eq("id", id)

    if (error) throw error
    setCustosFixos((prev) => prev.filter((c) => c.id !== id))
  }

  // Funções CRUD para custos variáveis
  const addCustoVariavel = async (custo: Omit<CustoVariavel, "id">) => {
    const { data, error } = await supabase.from("custos_variaveis").insert([custo]).select().single()

    if (error) throw error
    if (data) setCustosVariaveis((prev) => [...prev, data])
  }

  const updateCustoVariavel = async (id: string, custo: Partial<CustoVariavel>) => {
    const { data, error } = await supabase.from("custos_variaveis").update(custo).eq("id", id).select().single()

    if (error) throw error
    if (data) setCustosVariaveis((prev) => prev.map((c) => (c.id === id ? data : c)))
  }

  const deleteCustoVariavel = async (id: string) => {
    const { error } = await supabase.from("custos_variaveis").delete().eq("id", id)

    if (error) throw error
    setCustosVariaveis((prev) => prev.filter((c) => c.id !== id))
  }

  // Funções CRUD para ingredientes base
  const addIngredienteBase = async (ingrediente: Omit<IngredienteBase, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase.from("ingredientes_base").insert([ingrediente]).select().single()

    if (error) throw error
    if (data) setIngredientesBase((prev) => [...prev, data])
  }

  const updateIngredienteBase = async (id: string, ingrediente: Partial<IngredienteBase>) => {
    const { data, error } = await supabase.from("ingredientes_base").update(ingrediente).eq("id", id).select().single()

    if (error) throw error
    if (data) setIngredientesBase((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  const deleteIngredienteBase = async (id: string) => {
    const { error } = await supabase.from("ingredientes_base").delete().eq("id", id)

    if (error) throw error
    setIngredientesBase((prev) => prev.filter((i) => i.id !== id))
  }

  // Funções CRUD para insumos
  const addInsumo = async (insumo: Omit<Insumo, "id">) => {
    try {
      console.log("[v0] Adicionando insumo:", insumo)
      const insumoData = {
        nome: insumo.nome,
        ingrediente_base_id: insumo.ingredienteBaseId,
        rendimento: insumo.quantidadeUso,
        unidade: insumo.unidadeUso,
        categoria: insumo.categoria,
        preco_unitario: insumo.precoUnitario,
      }

      const { data, error } = await supabase.from("insumos").insert([insumoData]).select().single()

      if (error) {
        console.error("[v0] Erro ao adicionar insumo:", error)
        throw error
      }
      if (data) {
        const insumoFormatted = {
          ...data,
          ingredienteBaseId: data.ingrediente_base_id,
          ingredienteBaseNome: insumo.ingredienteBaseNome,
          quantidadeUso: data.rendimento,
          unidadeUso: data.unidade,
          precoUnitario: data.preco_unitario,
        }
        setInsumos((prev) => [...prev, insumoFormatted])
        console.log("[v0] Insumo adicionado com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao adicionar insumo:", error)
      throw error
    }
  }

  const updateInsumo = async (id: string, insumo: Partial<Insumo>) => {
    try {
      console.log("[v0] Atualizando insumo:", id, insumo)
      const updateData: any = {}
      if (insumo.nome) updateData.nome = insumo.nome
      if (insumo.ingredienteBaseId) updateData.ingrediente_base_id = insumo.ingredienteBaseId
      if (insumo.quantidadeUso !== undefined) updateData.rendimento = insumo.quantidadeUso
      if (insumo.unidadeUso) updateData.unidade = insumo.unidadeUso
      if (insumo.categoria) updateData.categoria = insumo.categoria
      if (insumo.precoUnitario !== undefined) updateData.preco_unitario = insumo.precoUnitario

      const { data, error } = await supabase.from("insumos").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("[v0] Erro ao atualizar insumo:", error)
        throw error
      }
      if (data) {
        const insumoFormatted = {
          ...data,
          ingredienteBaseId: data.ingrediente_base_id,
          ingredienteBaseNome: insumo.ingredienteBaseNome || insumos.find((i) => i.id === id)?.ingredienteBaseNome,
          quantidadeUso: data.rendimento,
          unidadeUso: data.unidade,
          precoUnitario: data.preco_unitario,
        }
        setInsumos((prev) => prev.map((i) => (i.id === id ? insumoFormatted : i)))
        console.log("[v0] Insumo atualizado com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao atualizar insumo:", error)
      throw error
    }
  }

  const deleteInsumo = async (id: string) => {
    const { error } = await supabase.from("insumos").delete().eq("id", id)

    if (error) throw error
    setInsumos((prev) => prev.filter((i) => i.id !== id))
  }

  // Funções CRUD para produtos
  const addProduto = async (produto: Omit<Produto, "id">) => {
    try {
      console.log("[v0] Dados do produto a ser salvo:", produto)

      const { data, error } = await supabase
        .from("produtos")
        .insert([
          {
            nome: produto.nome,
            categoria: produto.categoria,
            descricao: produto.descricao,
            imagem_url: produto.foto,
            cmv: produto.cmv,
            preco_venda: produto.precoVenda,
            margem_lucro: produto.margemLucro,
            preco_ifood: produto.precoIfood,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao adicionar produto:", error)
        throw error
      }

      if (data) {
        // Adicionar insumos do produto
        if (produto.insumos && produto.insumos.length > 0) {
          const produtoInsumos = produto.insumos.map((insumo) => ({
            produto_id: data.id,
            insumo_id: insumo.insumoId,
            quantidade: insumo.quantidade,
          }))

          const { error: insumoError } = await supabase.from("produto_insumos").insert(produtoInsumos)

          if (insumoError) {
            console.error("[v0] Erro ao adicionar insumos do produto:", insumoError)
            // Reverter a criação do produto se falhar ao adicionar insumos
            await supabase.from("produtos").delete().eq("id", data.id)
            throw insumoError
          }
        }

        const produtoFormatted = {
          ...data,
          precoVenda: data.preco_venda,
          margemLucro: data.margem_lucro,
          precoIfood: data.preco_ifood,
          foto: data.imagem_url,
          insumos: produto.insumos || [],
        }

        setProdutos((prev) => [...prev, produtoFormatted])
        console.log("[v0] Produto adicionado com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao adicionar produto:", error)
      throw error
    }
  }

  const updateProduto = async (id: string, produto: Partial<Produto>) => {
    try {
      console.log("[v0] Atualizando produto:", id, produto)
      const updateData: any = {}
      if (produto.nome) updateData.nome = produto.nome
      if (produto.categoria) updateData.categoria = produto.categoria
      if (produto.descricao) updateData.descricao = produto.descricao
      if (produto.foto) updateData.imagem_url = produto.foto
      if (produto.cmv !== undefined) updateData.cmv = produto.cmv
      if (produto.precoVenda !== undefined) updateData.preco_venda = produto.precoVenda
      if (produto.margemLucro !== undefined) updateData.margem_lucro = produto.margemLucro
      if (produto.precoIfood !== undefined) updateData.preco_ifood = produto.precoIfood

      const { data, error } = await supabase.from("produtos").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("[v0] Erro ao atualizar produto:", error)
        throw error
      }

      if (data) {
        // Atualizar insumos se fornecidos
        if (produto.insumos) {
          // Remover insumos existentes
          await supabase.from("produto_insumos").delete().eq("produto_id", id)

          // Adicionar novos insumos
          if (produto.insumos.length > 0) {
            const produtoInsumos = produto.insumos.map((insumo) => ({
              produto_id: id,
              insumo_id: insumo.insumoId,
              quantidade: insumo.quantidade,
            }))

            const { error: insumoError } = await supabase.from("produto_insumos").insert(produtoInsumos)

            if (insumoError) {
              console.error("[v0] Erro ao atualizar insumos do produto:", insumoError)
              throw insumoError
            }
          }
        }

        const produtoFormatted = {
          ...data,
          precoVenda: data.preco_venda,
          margemLucro: data.margem_lucro,
          precoIfood: data.preco_ifood,
          foto: data.imagem_url,
          insumos: produto.insumos || produtos.find((p) => p.id === id)?.insumos || [],
        }

        setProdutos((prev) => prev.map((p) => (p.id === id ? produtoFormatted : p)))
        console.log("[v0] Produto atualizado com sucesso")
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao atualizar produto:", error)
      throw error
    }
  }

  const deleteProduto = async (id: string) => {
    try {
      // Remover insumos do produto primeiro
      await supabase.from("produto_insumos").delete().eq("produto_id", id)

      // Remover o produto
      const { error } = await supabase.from("produtos").delete().eq("id", id)

      if (error) throw error
      setProdutos((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("[v0] Erro ao excluir produto:", error)
      throw error
    }
  }

  // Funções CRUD para bebidas
  const addBebida = async (bebida: Omit<Bebida, "id">) => {
    try {
      const { data, error } = await supabase
        .from("bebidas")
        .insert([
          {
            nome: bebida.nome,
            categoria: bebida.categoria,
            descricao: bebida.descricao,
            imagem_url: bebida.imagemUrl,
            custo_unitario: bebida.custoUnitario,
            preco_venda: bebida.precoVenda,
            preco_ifood: bebida.precoIfood,
            lucro_unitario: bebida.lucroUnitario,
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        const bebidaFormatted = {
          ...data,
          precoVenda: data.preco_venda,
          custoUnitario: data.custo_unitario,
          precoIfood: data.preco_ifood,
          lucroUnitario: data.lucro_unitario,
          imagemUrl: data.imagem_url,
        }
        setBebidas((prev) => [...prev, bebidaFormatted])
      }
    } catch (error) {
      console.error("[v0] Erro ao adicionar bebida:", error)
      throw error
    }
  }

  const updateBebida = async (id: string, bebida: Partial<Bebida>) => {
    try {
      const updateData: any = {}
      if (bebida.nome) updateData.nome = bebida.nome
      if (bebida.categoria) updateData.categoria = bebida.categoria
      if (bebida.descricao) updateData.descricao = bebida.descricao
      if (bebida.imagemUrl) updateData.imagem_url = bebida.imagemUrl
      if (bebida.custoUnitario !== undefined) updateData.custo_unitario = bebida.custoUnitario
      if (bebida.precoVenda !== undefined) updateData.preco_venda = bebida.precoVenda
      if (bebida.precoIfood !== undefined) updateData.preco_ifood = bebida.precoIfood
      if (bebida.lucroUnitario !== undefined) updateData.lucro_unitario = bebida.lucroUnitario

      const { data, error } = await supabase.from("bebidas").update(updateData).eq("id", id).select().single()

      if (error) throw error

      if (data) {
        const bebidaFormatted = {
          ...data,
          precoVenda: data.preco_venda,
          custoUnitario: data.custo_unitario,
          precoIfood: data.preco_ifood,
          lucroUnitario: data.lucro_unitario,
          imagemUrl: data.imagem_url,
        }
        setBebidas((prev) => prev.map((b) => (b.id === id ? bebidaFormatted : b)))
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar bebida:", error)
      throw error
    }
  }

  const deleteBebida = async (id: string) => {
    const { error } = await supabase.from("bebidas").delete().eq("id", id)

    if (error) throw error
    setBebidas((prev) => prev.filter((b) => b.id !== id))
  }

  // Funções CRUD para combos
  const addCombo = async (combo: Omit<Combo, "id">) => {
    try {
      const { data, error } = await supabase
        .from("combos")
        .insert([
          {
            nome: combo.nome,
            descricao: combo.descricao,
            imagem_url: combo.foto,
            preco_final: combo.precoFinal,
            desconto_percentual: combo.desconto,
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        // Adicionar produtos do combo
        if (combo.produtos && combo.produtos.length > 0) {
          const comboProdutos = combo.produtos.map((produto) => ({
            combo_id: data.id,
            produto_id: produto.produtoId,
            quantidade: produto.quantidade,
          }))

          const { error: produtoError } = await supabase.from("combo_produtos").insert(comboProdutos)
          if (produtoError) throw produtoError
        }

        // Adicionar bebidas do combo
        if (combo.bebidas && combo.bebidas.length > 0) {
          const comboBebidas = combo.bebidas.map((bebida) => ({
            combo_id: data.id,
            bebida_id: bebida.bebidaId,
            quantidade: bebida.quantidade,
          }))

          const { error: bebidaError } = await supabase.from("combo_bebidas").insert(comboBebidas)
          if (bebidaError) throw bebidaError
        }

        const comboFormatted = {
          ...data,
          precoFinal: data.preco_final,
          desconto: data.desconto_percentual,
          foto: data.imagem_url,
          produtos: combo.produtos || [],
          bebidas: combo.bebidas || [],
        }

        setCombos((prev) => [...prev, comboFormatted])
      }
    } catch (error) {
      console.error("[v0] Erro ao adicionar combo:", error)
      throw error
    }
  }

  const updateCombo = async (id: string, combo: Partial<Combo>) => {
    try {
      const updateData: any = {}
      if (combo.nome) updateData.nome = combo.nome
      if (combo.descricao) updateData.descricao = combo.descricao
      if (combo.foto) updateData.imagem_url = combo.foto
      if (combo.precoFinal !== undefined) updateData.preco_final = combo.precoFinal
      if (combo.desconto !== undefined) updateData.desconto_percentual = combo.desconto

      const { data, error } = await supabase.from("combos").update(updateData).eq("id", id).select().single()

      if (error) throw error

      if (data) {
        // Atualizar produtos se fornecidos
        if (combo.produtos) {
          await supabase.from("combo_produtos").delete().eq("combo_id", id)

          if (combo.produtos.length > 0) {
            const comboProdutos = combo.produtos.map((produto) => ({
              combo_id: id,
              produto_id: produto.produtoId,
              quantidade: produto.quantidade,
            }))

            const { error: produtoError } = await supabase.from("combo_produtos").insert(comboProdutos)
            if (produtoError) throw produtoError
          }
        }

        // Atualizar bebidas se fornecidas
        if (combo.bebidas) {
          await supabase.from("combo_bebidas").delete().eq("combo_id", id)

          if (combo.bebidas.length > 0) {
            const comboBebidas = combo.bebidas.map((bebida) => ({
              combo_id: id,
              bebida_id: bebida.bebidaId,
              quantidade: bebida.quantidade,
            }))

            const { error: bebidaError } = await supabase.from("combo_bebidas").insert(comboBebidas)
            if (bebidaError) throw bebidaError
          }
        }

        const comboFormatted = {
          ...data,
          precoFinal: data.preco_final,
          desconto: data.desconto_percentual,
          foto: data.imagem_url,
          produtos: combo.produtos || combos.find((c) => c.id === id)?.produtos || [],
          bebidas: combo.bebidas || combos.find((c) => c.id === id)?.bebidas || [],
        }

        setCombos((prev) => prev.map((c) => (c.id === id ? comboFormatted : c)))
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar combo:", error)
      throw error
    }
  }

  const deleteCombo = async (id: string) => {
    try {
      // Remover produtos e bebidas do combo primeiro
      await supabase.from("combo_produtos").delete().eq("combo_id", id)
      await supabase.from("combo_bebidas").delete().eq("combo_id", id)

      // Remover o combo
      const { error } = await supabase.from("combos").delete().eq("id", id)

      if (error) throw error
      setCombos((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("[v0] Erro ao excluir combo:", error)
      throw error
    }
  }

  // Funções CRUD para adicionais
  const addAdicional = async (adicional: Omit<Adicional, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("adicionais").insert([adicional]).select().single()

      if (error) throw error
      if (data) setAdicionais((prev) => [...prev, data])
    } catch (error) {
      console.error("[v0] Erro ao adicionar adicional:", error)
      throw error
    }
  }

  const updateAdicional = async (id: string, adicional: Partial<Adicional>) => {
    try {
      const { data, error } = await supabase.from("adicionais").update(adicional).eq("id", id).select().single()

      if (error) throw error
      if (data) setAdicionais((prev) => prev.map((a) => (a.id === id ? data : a)))
    } catch (error) {
      console.error("[v0] Erro ao atualizar adicional:", error)
      throw error
    }
  }

  const deleteAdicional = async (id: string) => {
    try {
      const { error } = await supabase.from("adicionais").delete().eq("id", id)

      if (error) throw error
      setAdicionais((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error("[v0] Erro ao excluir adicional:", error)
      throw error
    }
  }

  // Funções CRUD para personalizações
  const addPersonalizacao = async (personalizacao: Omit<Personalizacao, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("personalizacoes").insert([personalizacao]).select().single()

      if (error) throw error
      if (data) setPersonalizacoes((prev) => [...prev, data])
    } catch (error) {
      console.error("[v0] Erro ao adicionar personalização:", error)
      throw error
    }
  }

  const updatePersonalizacao = async (id: string, personalizacao: Partial<Personalizacao>) => {
    try {
      const { data, error } = await supabase
        .from("personalizacoes")
        .update(personalizacao)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      if (data) setPersonalizacoes((prev) => prev.map((p) => (p.id === id ? data : p)))
    } catch (error) {
      console.error("[v0] Erro ao atualizar personalização:", error)
      throw error
    }
  }

  const deletePersonalizacao = async (id: string) => {
    try {
      const { error } = await supabase.from("personalizacoes").delete().eq("id", id)

      if (error) throw error
      setPersonalizacoes((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("[v0] Erro ao excluir personalização:", error)
      throw error
    }
  }

  // Funções CRUD para vendas
  const addVenda = async (venda: Omit<Venda, "id" | "numero_pedido" | "created_at" | "updated_at">) => {
    try {
      const numeroPedido = `PED-${Date.now()}`
      const vendaData = {
        ...venda,
        numero_pedido: numeroPedido,
      }

      const { data, error } = await supabase.from("vendas").insert([vendaData]).select().single()

      if (error) throw error

      if (data) {
        setVendas((prev) => [data, ...prev])
        return data.id
      }

      return ""
    } catch (error) {
      console.error("[v0] Erro ao adicionar venda:", error)
      throw error
    }
  }

  const updateVenda = async (id: string, venda: Partial<Venda>) => {
    try {
      const { data, error } = await supabase.from("vendas").update(venda).eq("id", id).select().single()

      if (error) throw error
      if (data) setVendas((prev) => prev.map((v) => (v.id === id ? data : v)))
    } catch (error) {
      console.error("[v0] Erro ao atualizar venda:", error)
      throw error
    }
  }

  const deleteVenda = async (id: string) => {
    try {
      const { error } = await supabase.from("vendas").delete().eq("id", id)

      if (error) throw error
      setVendas((prev) => prev.filter((v) => v.id !== id))
    } catch (error) {
      console.error("[v0] Erro ao excluir venda:", error)
      throw error
    }
  }

  // Funções de estoque
  const registrarCompra = async (insumo_id: string, quantidade: number, preco_unitario: number) => {
    try {
      const { data, error } = await supabase
        .from("compras_insumos")
        .insert([
          {
            insumo_id,
            quantidade,
            preco_unitario,
            quantidade_restante: quantidade,
            data_compra: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setComprasInsumos((prev) => [data, ...prev])

        // Atualizar estoque
        const estoqueExistente = estoqueInsumos.find((e) => e.insumo_id === insumo_id)
        if (estoqueExistente) {
          const novaQuantidade = estoqueExistente.quantidade_atual + quantidade
          await supabase.from("estoque_insumos").update({ quantidade_atual: novaQuantidade }).eq("insumo_id", insumo_id)

          setEstoqueInsumos((prev) =>
            prev.map((e) => (e.insumo_id === insumo_id ? { ...e, quantidade_atual: novaQuantidade } : e)),
          )
        } else {
          const novoEstoque = {
            id: crypto.randomUUID(),
            insumo_id,
            quantidade_atual: quantidade,
            quantidade_minima: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          await supabase.from("estoque_insumos").insert([novoEstoque])
          setEstoqueInsumos((prev) => [...prev, novoEstoque])
        }
      }
    } catch (error) {
      console.error("[v0] Erro ao registrar compra:", error)
      throw error
    }
  }

  const getEstoqueAtual = (insumo_id: string) => {
    const estoque = estoqueInsumos.find((e) => e.insumo_id === insumo_id)
    return estoque?.quantidade_atual || 0
  }

  const getEstoqueAtualIngrediente = (ingrediente_base_id: string) => {
    const insumosDoIngrediente = insumos.filter((i) => i.ingredienteBaseId === ingrediente_base_id)
    return insumosDoIngrediente.reduce((total, insumo) => total + getEstoqueAtual(insumo.id), 0)
  }

  const baixarEstoque = async (insumo_id: string, quantidade: number, motivo: string, venda_id?: string) => {
    try {
      const estoqueAtual = getEstoqueAtual(insumo_id)
      if (estoqueAtual < quantidade) {
        return false
      }

      const novaQuantidade = estoqueAtual - quantidade
      await supabase.from("estoque_insumos").update({ quantidade_atual: novaQuantidade }).eq("insumo_id", insumo_id)

      setEstoqueInsumos((prev) =>
        prev.map((e) => (e.insumo_id === insumo_id ? { ...e, quantidade_atual: novaQuantidade } : e)),
      )

      return true
    } catch (error) {
      console.error("[v0] Erro ao baixar estoque:", error)
      return false
    }
  }

  const verificarEstoqueSuficiente = async (produto_id: string, quantidade: number) => {
    try {
      const produto = produtos.find((p) => p.id === produto_id)
      if (!produto || !produto.insumos) return true

      for (const insumo of produto.insumos) {
        const estoqueAtual = getEstoqueAtual(insumo.insumoId)
        const quantidadeNecessaria = insumo.quantidade * quantidade

        if (estoqueAtual < quantidadeNecessaria) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error("[v0] Erro ao verificar estoque:", error)
      return false
    }
  }

  const abaterEstoquePorVenda = async (pedidoId: string) => {
    try {
      // Implementar lógica de abatimento de estoque por venda
      console.log("[v0] Abatendo estoque para venda:", pedidoId)
    } catch (error) {
      console.error("[v0] Erro ao abater estoque por venda:", error)
      throw error
    }
  }

  // Funções de cálculo
  const getTotalCustosFixos = () => {
    return custosFixos.reduce((total, custo) => total + custo.valor, 0)
  }

  const getTotalCustosVariaveis = () => {
    return custosVariaveis.reduce((total, custo) => total + custo.percentual, 0)
  }

  const calculateCMV = async (produto_id: string) => {
    try {
      const produto = produtos.find((p) => p.id === produto_id)
      if (!produto || !produto.insumos) return 0

      let cmvTotal = 0

      for (const insumo of produto.insumos) {
        const insumoData = insumos.find((i) => i.id === insumo.insumoId)
        if (insumoData) {
          cmvTotal += insumoData.precoUnitario * insumo.quantidade
        }
      }

      return cmvTotal
    } catch (error) {
      console.error("[v0] Erro ao calcular CMV:", error)
      return 0
    }
  }

  const calculatePrecoVenda = (cmv: number, margem: number) => {
    return cmv * (1 + margem / 100)
  }

  // Função de refresh
  const refreshData = async () => {
    await loadAllData()
  }

  const contextValue: PricingContextType = {
    // Estados
    custosFixos,
    custosVariaveis,
    ingredientesBase,
    insumos,
    produtos,
    bebidas,
    combos,
    vendas,
    itensVenda,
    estoqueInsumos,
    comprasInsumos,
    notificacoes,
    adicionais,
    personalizacoes,
    categorias,
    loading,

    // Funções CRUD
    addCustoFixo,
    updateCustoFixo,
    deleteCustoFixo,
    addCustoVariavel,
    updateCustoVariavel,
    deleteCustoVariavel,
    addIngredienteBase,
    updateIngredienteBase,
    deleteIngredienteBase,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    addProduto,
    updateProduto,
    deleteProduto,
    addBebida,
    updateBebida,
    deleteBebida,
    addCombo,
    updateCombo,
    deleteCombo,
    addAdicional,
    updateAdicional,
    deleteAdicional,
    addPersonalizacao,
    updatePersonalizacao,
    deletePersonalizacao,
    addVenda,
    updateVenda,
    deleteVenda,
    addCategoria,
    updateCategoria,
    deleteCategoria,

    // Funções de estoque
    registrarCompra,
    getEstoqueAtual,
    getEstoqueAtualIngrediente,
    baixarEstoque,
    verificarEstoqueSuficiente,
    abaterEstoquePorVenda,

    // Funções de cálculo
    getTotalCustosFixos,
    getTotalCustosVariaveis,
    calculateCMV,
    calculatePrecoVenda,

    // Funções de notificação
    addNotificacao,
    marcarNotificacaoLida,

    refreshData: loadAllData,
    refreshDataSilent,
  }

  return <PricingContext.Provider value={contextValue}>{children}</PricingContext.Provider>
}

export const usePricing = () => {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider")
  }
  return context
}
