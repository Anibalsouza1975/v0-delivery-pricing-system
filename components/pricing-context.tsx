"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { CustoFixo, CustoVariavel, Insumo, Produto, Bebida, Combo } from "@/app/page"

export interface EstoqueInsumo {
  id: string
  ingredienteBaseId: string
  quantidadeComprada: number
  quantidadeAtual: number
  dataCompra: string
  precoCompra: number
  fornecedor?: string
  lote?: string
  dataVencimento?: string
}

export interface MovimentacaoEstoque {
  id: string
  ingredienteBaseId: string
  tipo: "entrada" | "saida"
  quantidade: number
  data: string
  motivo: string
  vendaId?: string
  produtoId?: string
  observacao?: string
}

export interface IngredienteBase {
  id: string
  nome: string
  categoria: string
  unidade: string
  precoUnitario: number
}

export interface Venda {
  id: string
  data: string
  total: number
  status: string
  produtos: { produtoId: string; quantidade: number; nome: string; preco: number }[]
  cliente?: string
  observacoes?: string
}

interface PricingContextType {
  // Estados
  custosFixos: CustoFixo[]
  custosVariaveis: CustoVariavel[]
  insumos: Insumo[]
  produtos: Produto[]
  bebidas: Bebida[]
  combos: Combo[]
  vendas: Venda[]
  adicionais: any[]
  personalizacoes: any[]

  estoqueInsumos: EstoqueInsumo[]
  movimentacoesEstoque: MovimentacaoEstoque[]
  ingredientesBase: IngredienteBase[]

  // Funções para custos fixos
  addCustoFixo: (custo: Omit<CustoFixo, "id">) => void
  updateCustoFixo: (id: string, custo: Partial<CustoFixo>) => void
  deleteCustoFixo: (id: string) => void

  // Funções para custos variáveis
  addCustoVariavel: (custo: Omit<CustoVariavel, "id">) => void
  updateCustoVariavel: (id: string, custo: Partial<CustoVariavel>) => void
  deleteCustoVariavel: (id: string) => void

  // Funções para insumos
  addInsumo: (insumo: Omit<Insumo, "id">) => void
  updateInsumo: (id: string, insumo: Partial<Insumo>) => void
  deleteInsumo: (id: string) => void

  // Funções para produtos
  addProduto: (produto: Omit<Produto, "id">) => void
  updateProduto: (id: string, produto: Partial<Produto>) => void
  deleteProduto: (id: string) => void

  // Funções para bebidas
  addBebida: (bebida: Omit<Bebida, "id">) => void
  updateBebida: (id: string, bebida: Partial<Bebida>) => void
  deleteBebida: (id: string) => void

  // Funções para combos
  addCombo: (combo: Omit<Combo, "id">) => void
  updateCombo: (id: string, combo: Partial<Combo>) => void
  deleteCombo: (id: string) => void

  addVenda: (venda: Omit<Venda, "id">) => void
  updateVenda: (id: string, venda: Partial<Venda>) => void
  deleteVenda: (id: string) => void

  addIngredienteBase: (ingrediente: Omit<IngredienteBase, "id">) => void
  updateIngredienteBase: (id: string, ingrediente: Partial<IngredienteBase>) => void
  deleteIngredienteBase: (id: string) => void

  // Funções de estoque simplificadas
  registrarCompra: (ingredienteBaseId: string, quantidade: number, precoTotal: number, fornecedor?: string) => void
  getEstoqueAtual: (ingredienteBaseId: string) => number
  getValorEstoque: (ingredienteBaseId: string) => number
  baixarEstoque: (ingredienteBaseId: string, quantidade: number, motivo: string, vendaId?: string) => boolean
  verificarEstoqueSuficiente: (produtoId: string, quantidadeProduto: number) => boolean
  abaterEstoquePorVenda: (vendaId: string) => void

  // Cálculos
  getTotalCustosFixos: () => number
  getTotalCustosVariaveis: () => number
  calculateCMV: (produtoId: string) => number
  calculatePrecoVenda: (cmv: number, margem: number) => number

  // Persistência
  exportData: () => string
  importData: (jsonData: string) => boolean
  clearAllData: () => void

  // Funções para adicionais e personalizações
  setAdicionais: (value: any[]) => void
  setPersonalizacoes: (value: any[]) => void
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

export function PricingProvider({ children }: { children: ReactNode }) {
  const [custosFixos, setCustosFixos] = useLocalStorage<CustoFixo[]>("delivery-pricing-custos-fixos", [])
  const [custosVariaveis, setCustosVariaveis] = useLocalStorage<CustoVariavel[]>(
    "delivery-pricing-custos-variaveis",
    [],
  )
  const [insumos, setInsumos] = useLocalStorage<Insumo[]>("delivery-pricing-insumos", [])
  const [produtos, setProdutos] = useLocalStorage<Produto[]>("delivery-pricing-produtos", [])
  const [bebidas, setBebidas] = useLocalStorage<Bebida[]>("delivery-pricing-bebidas", [])
  const [combos, setCombos] = useLocalStorage<Combo[]>("delivery-pricing-combos", [])

  const [vendas, setVendas] = useLocalStorage<Venda[]>("delivery-pricing-vendas", [])

  const [adicionais, setAdicionais] = useLocalStorage<any[]>("adicionais", [])
  const [personalizacoes, setPersonalizacoes] = useLocalStorage<any[]>("personalizacoes", [])

  const [estoqueInsumos, setEstoqueInsumos] = useLocalStorage<EstoqueInsumo[]>("delivery-pricing-estoque-insumos", [])
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useLocalStorage<MovimentacaoEstoque[]>(
    "delivery-pricing-movimentacoes-estoque",
    [],
  )
  const [ingredientesBase, setIngredientesBase] = useLocalStorage<IngredienteBase[]>(
    "delivery-pricing-ingredientes-base",
    [],
  )

  // Funções para custos fixos
  const addCustoFixo = (custo: Omit<CustoFixo, "id">) => {
    const newCusto = { ...custo, id: Date.now().toString() }
    setCustosFixos((prev) => [...prev, newCusto])
  }

  const updateCustoFixo = (id: string, custo: Partial<CustoFixo>) => {
    setCustosFixos((prev) => prev.map((c) => (c.id === id ? { ...c, ...custo } : c)))
  }

  const deleteCustoFixo = (id: string) => {
    setCustosFixos((prev) => prev.filter((c) => c.id !== id))
  }

  // Funções para custos variáveis
  const addCustoVariavel = (custo: Omit<CustoVariavel, "id">) => {
    const newCusto = { ...custo, id: Date.now().toString() }
    setCustosVariaveis((prev) => [...prev, newCusto])
  }

  const updateCustoVariavel = (id: string, custo: Partial<CustoVariavel>) => {
    setCustosVariaveis((prev) => prev.map((c) => (c.id === id ? { ...c, ...custo } : c)))
  }

  const deleteCustoVariavel = (id: string) => {
    setCustosVariaveis((prev) => prev.filter((c) => c.id !== id))
  }

  // Funções para insumos
  const addInsumo = (insumo: Omit<Insumo, "id">) => {
    const newInsumo = { ...insumo, id: Date.now().toString() }
    setInsumos((prev) => [...prev, newInsumo])
  }

  const updateInsumo = (id: string, insumo: Partial<Insumo>) => {
    setInsumos((prev) => prev.map((i) => (i.id === id ? { ...i, ...insumo } : i)))
  }

  const deleteInsumo = (id: string) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id))
  }

  // Funções para produtos
  const addProduto = (produto: Omit<Produto, "id">) => {
    const newProduto = { ...produto, id: Date.now().toString() }
    setProdutos((prev) => [...prev, newProduto])
  }

  const updateProduto = (id: string, produto: Partial<Produto>) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...produto } : p)))
  }

  const deleteProduto = (id: string) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id))
  }

  // Funções para bebidas
  const addBebida = (bebida: Omit<Bebida, "id">) => {
    const newBebida = { ...bebida, id: Date.now().toString() }
    setBebidas((prev) => [...prev, newBebida])
  }

  const updateBebida = (id: string, bebida: Partial<Bebida>) => {
    setBebidas((prev) => prev.map((b) => (b.id === id ? { ...b, ...bebida } : b)))
  }

  const deleteBebida = (id: string) => {
    setBebidas((prev) => prev.filter((b) => b.id !== id))
  }

  // Funções para combos
  const addCombo = (combo: Omit<Combo, "id">) => {
    const newCombo = { ...combo, id: Date.now().toString() }
    setCombos((prev) => [...prev, newCombo])
  }

  const updateCombo = (id: string, combo: Partial<Combo>) => {
    setCombos((prev) => prev.map((c) => (c.id === id ? { ...c, ...combo } : c)))
  }

  const deleteCombo = (id: string) => {
    setCombos((prev) => prev.filter((c) => c.id !== id))
  }

  const addEstoqueInsumo = (estoque: Omit<EstoqueInsumo, "id">) => {
    const newEstoque = { ...estoque, id: Date.now().toString() }
    setEstoqueInsumos((prev) => [...prev, newEstoque])

    const movimentacao: Omit<MovimentacaoEstoque, "id"> = {
      ingredienteBaseId: estoque.ingredienteBaseId,
      tipo: "entrada",
      quantidade: estoque.quantidadeComprada,
      data: estoque.dataCompra,
      motivo: "Compra de ingrediente",
      observacao: estoque.fornecedor ? `Fornecedor: ${estoque.fornecedor}` : undefined,
    }
    addMovimentacaoEstoque(movimentacao)
  }

  const updateEstoqueInsumo = (id: string, estoque: Partial<EstoqueInsumo>) => {
    setEstoqueInsumos((prev) => prev.map((e) => (e.id === id ? { ...e, ...estoque } : e)))
  }

  const deleteEstoqueInsumo = (id: string) => {
    setEstoqueInsumos((prev) => prev.filter((e) => e.id !== id))
  }

  const addMovimentacaoEstoque = (movimentacao: Omit<MovimentacaoEstoque, "id">) => {
    const newMovimentacao = {
      ...movimentacao,
      id: Date.now().toString(),
      data: movimentacao.data || new Date().toISOString(),
    }
    setMovimentacoesEstoque((prev) => [...prev, newMovimentacao])
  }

  const getEstoqueAtualInsumo = (ingredienteBaseId: string): number => {
    const estoques = estoqueInsumos.filter((e) => e.ingredienteBaseId === ingredienteBaseId)
    return estoques.reduce((total, estoque) => total + estoque.quantidadeAtual, 0)
  }

  const baixarEstoquePorVenda = (vendaId: string, produtosVendidos: { produtoId: string; quantidade: number }[]) => {
    produtosVendidos.forEach(({ produtoId, quantidade }) => {
      const produto = produtos.find((p) => p.id === produtoId)
      if (!produto) return

      // Para cada insumo do produto, baixar do estoque
      produto.insumos.forEach(({ insumoId, quantidade: quantidadePorUnidade }) => {
        const quantidadeTotal = quantidadePorUnidade * quantidade

        // Baixar do estoque (FIFO - First In, First Out)
        let quantidadeRestante = quantidadeTotal
        const estoquesInsumo = estoqueInsumos
          .filter((e) => e.ingredienteBaseId === insumoId && e.quantidadeAtual > 0)
          .sort((a, b) => new Date(a.dataCompra).getTime() - new Date(b.dataCompra).getTime())

        estoquesInsumo.forEach((estoque) => {
          if (quantidadeRestante <= 0) return

          const quantidadeBaixar = Math.min(estoque.quantidadeAtual, quantidadeRestante)

          // Atualizar estoque
          updateEstoqueInsumo(estoque.id, {
            quantidadeAtual: estoque.quantidadeAtual - quantidadeBaixar,
          })

          quantidadeRestante -= quantidadeBaixar

          // Registrar movimentação de saída
          const movimentacao: Omit<MovimentacaoEstoque, "id"> = {
            ingredienteBaseId: insumoId,
            tipo: "saida",
            quantidade: quantidadeBaixar,
            data: new Date().toISOString(),
            motivo: "Venda de produto",
            vendaId,
            produtoId,
            observacao: `Produto: ${produto.nome} (${quantidade}x)`,
          }
          addMovimentacaoEstoque(movimentacao)
        })
      })
    })
  }

  const getInsumosComEstoqueBaixo = (limite = 10): { insumo: Insumo; quantidadeAtual: number }[] => {
    return insumos
      .map((insumo) => ({
        insumo,
        quantidadeAtual: getEstoqueAtualInsumo(insumo.id),
      }))
      .filter(({ quantidadeAtual }) => quantidadeAtual <= limite)
      .sort((a, b) => a.quantidadeAtual - b.quantidadeAtual)
  }

  // Funções para ingredientes base
  const getEstoqueAtualIngrediente = (ingredienteBaseId: string): number => {
    const estoques = estoqueInsumos.filter((e) => e.ingredienteBaseId === ingredienteBaseId)
    return estoques.reduce((total, estoque) => total + estoque.quantidadeAtual, 0)
  }

  // Cálculos
  const getTotalCustosFixos = () => {
    return custosFixos.reduce((total, custo) => total + custo.valor, 0)
  }

  const getTotalCustosVariaveis = () => {
    return custosVariaveis.reduce((total, custo) => total + custo.percentual, 0)
  }

  const calculateCMV = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return 0

    return produto.insumos.reduce((total, item) => {
      const insumo = insumos.find((i) => i.id === item.insumoId)
      if (!insumo) return total
      return total + insumo.precoCompra * item.quantidade
    }, 0)
  }

  const calculatePrecoVenda = (cmv: number, margem: number) => {
    return cmv / (1 - margem / 100)
  }

  const exportData = () => {
    const data = {
      custosFixos,
      custosVariaveis,
      insumos,
      produtos,
      bebidas,
      combos,
      estoqueInsumos,
      movimentacoesEstoque,
      ingredientesBase,
      vendas,
      adicionais,
      personalizacoes,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData)

      // Validar estrutura básica dos dados
      if (!data || typeof data !== "object") {
        throw new Error("Formato de dados inválido")
      }

      // Importar dados se existirem
      if (Array.isArray(data.custosFixos)) setCustosFixos(data.custosFixos)
      if (Array.isArray(data.custosVariaveis)) setCustosVariaveis(data.custosVariaveis)
      if (Array.isArray(data.insumos)) setInsumos(data.insumos)
      if (Array.isArray(data.produtos)) setProdutos(data.produtos)
      if (Array.isArray(data.bebidas)) setBebidas(data.bebidas)
      if (Array.isArray(data.combos)) setCombos(data.combos)
      if (Array.isArray(data.estoqueInsumos)) setEstoqueInsumos(data.estoqueInsumos)
      if (Array.isArray(data.movimentacoesEstoque)) setMovimentacoesEstoque(data.movimentacoesEstoque)
      if (Array.isArray(data.ingredientesBase)) setIngredientesBase(data.ingredientesBase)
      if (Array.isArray(data.vendas)) setVendas(data.vendas)
      if (Array.isArray(data.adicionais)) setAdicionais(data.adicionais)
      if (Array.isArray(data.personalizacoes)) setPersonalizacoes(data.personalizacoes)

      return true
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      return false
    }
  }

  const clearAllData = () => {
    setCustosFixos([])
    setCustosVariaveis([])
    setInsumos([])
    setProdutos([])
    setBebidas([])
    setCombos([])
    setEstoqueInsumos([])
    setMovimentacoesEstoque([])
    setIngredientesBase([])
    setVendas([])
    setAdicionais([])
    setPersonalizacoes([])
  }

  const addIngredienteBase = (ingrediente: Omit<IngredienteBase, "id">) => {
    const newIngrediente = { ...ingrediente, id: Date.now().toString() }
    setIngredientesBase((prev) => [...prev, newIngrediente])
  }

  const updateIngredienteBase = (id: string, ingrediente: Partial<IngredienteBase>) => {
    setIngredientesBase((prev) => prev.map((i) => (i.id === id ? { ...i, ...ingrediente } : i)))
  }

  const deleteIngredienteBase = (id: string) => {
    setIngredientesBase((prev) => prev.filter((i) => i.id !== id))
  }

  const registrarCompra = (ingredienteBaseId: string, quantidade: number, precoTotal: number, fornecedor?: string) => {
    console.log("[v0] Registrando compra:", { ingredienteBaseId, quantidade, precoTotal })

    const ingrediente = ingredientesBase.find((i) => i.id === ingredienteBaseId)
    if (!ingrediente) {
      console.error("[v0] Ingrediente não encontrado:", ingredienteBaseId)
      return
    }

    const precoUnitarioReal = precoTotal / quantidade

    // Atualizar preço unitário do ingrediente base
    updateIngredienteBase(ingredienteBaseId, { precoUnitario: precoUnitarioReal })

    const novaCompra: EstoqueInsumo = {
      id: Date.now().toString(),
      ingredienteBaseId,
      quantidadeComprada: quantidade,
      quantidadeAtual: quantidade,
      dataCompra: new Date().toISOString(),
      precoCompra: precoTotal,
      fornecedor,
    }

    setEstoqueInsumos((prev) => [...prev, novaCompra])

    // Registrar movimentação
    const movimentacao: MovimentacaoEstoque = {
      id: (Date.now() + 1).toString(),
      ingredienteBaseId,
      tipo: "entrada",
      quantidade,
      data: new Date().toISOString(),
      motivo: "Compra de ingrediente",
      observacao: fornecedor ? `Fornecedor: ${fornecedor}` : undefined,
    }

    setMovimentacoesEstoque((prev) => [...prev, movimentacao])
  }

  const getEstoqueAtual = (ingredienteBaseId: string): number => {
    const estoques = estoqueInsumos.filter((e) => e.ingredienteBaseId === ingredienteBaseId)
    return estoques.reduce((total, estoque) => total + estoque.quantidadeAtual, 0)
  }

  const getValorEstoque = (ingredienteBaseId: string): number => {
    const estoques = estoqueInsumos.filter((e) => e.ingredienteBaseId === ingredienteBaseId)
    return estoques.reduce((total, estoque) => {
      const precoUnitario = estoque.precoCompra / estoque.quantidadeComprada
      return total + estoque.quantidadeAtual * precoUnitario
    }, 0)
  }

  const baixarEstoque = (ingredienteBaseId: string, quantidade: number, motivo: string, vendaId?: string): boolean => {
    console.log("[v0] Baixando estoque:", { ingredienteBaseId, quantidade, motivo })

    let quantidadeRestante = quantidade
    const estoquesDisponiveis = estoqueInsumos
      .filter((e) => e.ingredienteBaseId === ingredienteBaseId && e.quantidadeAtual > 0)
      .sort((a, b) => new Date(a.dataCompra).getTime() - new Date(b.dataCompra).getTime()) // FIFO

    const estoqueTotal = estoquesDisponiveis.reduce((total, e) => total + e.quantidadeAtual, 0)

    if (estoqueTotal < quantidade) {
      console.warn(
        "[v0] Estoque insuficiente para:",
        ingredienteBaseId,
        "Disponível:",
        estoqueTotal,
        "Necessário:",
        quantidade,
        "- Pedido será processado mesmo assim",
      )

      if (estoqueTotal > 0) {
        estoquesDisponiveis.forEach((estoque) => {
          if (quantidadeRestante <= 0) return

          const quantidadeBaixar = Math.min(estoque.quantidadeAtual, quantidadeRestante)

          // Atualizar estoque
          setEstoqueInsumos((prev) =>
            prev.map((e) =>
              e.id === estoque.id ? { ...e, quantidadeAtual: e.quantidadeAtual - quantidadeBaixar } : e,
            ),
          )

          quantidadeRestante -= quantidadeBaixar

          // Registrar movimentação
          const movimentacao: MovimentacaoEstoque = {
            id: Date.now().toString() + Math.random(),
            ingredienteBaseId,
            tipo: "saida",
            quantidade: quantidadeBaixar,
            data: new Date().toISOString(),
            motivo,
            vendaId,
            observacao: `Baixa parcial - ${motivo} (Estoque insuficiente)`,
          }

          setMovimentacoesEstoque((prev) => [...prev, movimentacao])
        })
      }

      if (quantidadeRestante > 0) {
        const movimentacao: MovimentacaoEstoque = {
          id: Date.now().toString() + Math.random(),
          ingredienteBaseId,
          tipo: "saida",
          quantidade: quantidadeRestante,
          data: new Date().toISOString(),
          motivo,
          vendaId,
          observacao: `Estoque negativo - ${motivo} (Falta: ${quantidadeRestante})`,
        }
        setMovimentacoesEstoque((prev) => [...prev, movimentacao])
      }

      return true
    }

    estoquesDisponiveis.forEach((estoque) => {
      if (quantidadeRestante <= 0) return

      const quantidadeBaixar = Math.min(estoque.quantidadeAtual, quantidadeRestante)

      // Atualizar estoque
      setEstoqueInsumos((prev) =>
        prev.map((e) => (e.id === estoque.id ? { ...e, quantidadeAtual: e.quantidadeAtual - quantidadeBaixar } : e)),
      )

      quantidadeRestante -= quantidadeBaixar

      // Registrar movimentação
      const movimentacao: MovimentacaoEstoque = {
        id: Date.now().toString() + Math.random(),
        ingredienteBaseId,
        tipo: "saida",
        quantidade: quantidadeBaixar,
        data: new Date().toISOString(),
        motivo,
        vendaId,
        observacao: `Baixa automática - ${motivo}`,
      }

      setMovimentacoesEstoque((prev) => [...prev, movimentacao])
    })

    console.log("[v0] Estoque abatido com sucesso para:", ingredienteBaseId)
    return true
  }

  const verificarEstoqueSuficiente = (produtoId: string, quantidadeProduto: number): boolean => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return false

    return produto.insumos.every(({ insumoId, quantidade: quantidadePorUnidade }) => {
      const insumo = insumos.find((i) => i.id === insumoId)
      if (!insumo) return false

      const quantidadeNecessaria = quantidadePorUnidade * quantidadeProduto
      const estoqueAtual = getEstoqueAtual(insumo.id)

      return estoqueAtual >= quantidadeNecessaria
    })
  }

  const abaterEstoquePorVenda = (vendaId: string) => {
    console.log("[v0] Abatendo estoque para venda:", vendaId)

    try {
      let venda = vendas.find((v) => v.id === vendaId)

      if (!venda) {
        try {
          const vendasLocalStorage = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")
          venda = vendasLocalStorage.find((v: any) => v.id === vendaId)
          console.log("[v0] Venda encontrada no localStorage:", venda ? "sim" : "não")
        } catch (error) {
          console.error("[v0] Erro ao buscar vendas no localStorage:", error)
        }
      }

      if (!venda) {
        try {
          const pedidosProducao = JSON.parse(localStorage.getItem("delivery-pricing-controle-producao") || "[]")
          const pedidoProducao = pedidosProducao.find((p: any) => p.id === vendaId)
          if (pedidoProducao) {
            console.log("[v0] Pedido encontrado no controle de produção, convertendo para venda")
            // Converter formato do pedido para formato de venda
            venda = {
              id: pedidoProducao.id,
              data: pedidoProducao.data || new Date().toISOString(),
              total: pedidoProducao.total || 0,
              status: "concluido",
              produtos:
                pedidoProducao.itens
                  ?.filter((item: any) => item.tipo === "produto")
                  .map((item: any) => ({
                    produtoId: item.id,
                    quantidade: item.quantidade || 1,
                    nome: item.nome,
                    preco: item.preco || 0,
                  })) || [],
              cliente: pedidoProducao.cliente?.nome || "Cliente não informado",
              observacoes: pedidoProducao.observacoes || "",
            }
            console.log("[v0] Venda convertida do pedido:", JSON.stringify(venda))
          }
        } catch (error) {
          console.error("[v0] Erro ao buscar no controle de produção:", error)
        }
      }

      if (!venda) {
        console.error("[v0] Venda não encontrada:", vendaId)
        return
      }

      console.log("[v0] Venda encontrada para abatimento:", JSON.stringify(venda))

      if (!venda.produtos || venda.produtos.length === 0) {
        console.log("[v0] Nenhum produto para abater estoque")
        return
      }

      venda.produtos.forEach(({ produtoId, quantidade }) => {
        try {
          const produto = produtos.find((p) => p.id === produtoId)
          if (!produto) {
            console.error("[v0] Produto não encontrado:", produtoId)
            return
          }

          console.log("[v0] Processando produto:", produto.nome, "quantidade:", quantidade)

          if (!produto.insumos || produto.insumos.length === 0) {
            console.log("[v0] Produto sem insumos cadastrados:", produto.nome)
            return
          }

          produto.insumos.forEach(({ insumoId, quantidade: quantidadePorUnidade }) => {
            try {
              let insumo = insumos.find((i) => i.id === insumoId)

              // Se não encontrou por ID, tentar buscar por ingredienteBaseId
              if (!insumo) {
                insumo = insumos.find((i) => i.ingredienteBaseId === insumoId)
              }

              // Se ainda não encontrou, tentar buscar ingrediente base diretamente
              if (!insumo) {
                const ingredienteBase = ingredientesBase.find((ib) => ib.id === insumoId)
                if (ingredienteBase) {
                  console.log("[v0] Usando ingrediente base diretamente:", ingredienteBase.nome)
                  // Criar insumo temporário baseado no ingrediente base
                  insumo = {
                    id: ingredienteBase.id,
                    nome: ingredienteBase.nome,
                    ingredienteBaseId: ingredienteBase.id,
                    precoCompra: ingredienteBase.precoUnitario,
                    categoria: ingredienteBase.categoria,
                    unidade: ingredienteBase.unidade,
                    quantidadeComprada: 1,
                    dataCompra: new Date().toISOString(),
                    fornecedor: "Sistema",
                  }
                }
              }

              if (!insumo) {
                console.warn("[v0] Insumo não encontrado:", insumoId, "- Continuando sem abater estoque")
                return
              }

              const quantidadeInsumo = Number(quantidadePorUnidade) || 0
              const quantidadeProdutoVendido = Number(quantidade) || 0
              const quantidadeNecessaria = quantidadeInsumo * quantidadeProdutoVendido

              if (isNaN(quantidadeNecessaria) || quantidadeNecessaria <= 0) {
                console.error("[v0] Quantidade inválida calculada:", {
                  quantidadeInsumo,
                  quantidadeProdutoVendido,
                  quantidadeNecessaria,
                })
                return
              }

              const ingredienteBaseId = insumo.ingredienteBaseId
              if (!ingredienteBaseId) {
                console.error("[v0] Insumo sem ingrediente base associado:", insumo.nome)
                return
              }

              console.log("[v0] Abatendo do ingrediente:", ingredienteBaseId, "quantidade:", quantidadeNecessaria)

              const sucesso = baixarEstoque(
                ingredienteBaseId,
                quantidadeNecessaria,
                `Venda ${vendaId} - ${produto.nome}`,
                vendaId,
              )
              if (sucesso) {
                console.log("[v0] Estoque abatido com sucesso para:", ingredienteBaseId)
              } else {
                console.error("[v0] Falha ao abater estoque para:", ingredienteBaseId)
              }
            } catch (insumoError) {
              console.error("[v0] Erro ao processar insumo:", insumoError)
            }
          })
        } catch (produtoError) {
          console.error("[v0] Erro ao processar produto:", produtoError)
        }
      })

      console.log("[v0] Abatimento de estoque concluído para venda:", vendaId)
    } catch (error) {
      console.error("[v0] Erro geral no abatimento de estoque:", error)
    }
  }

  const addVenda = (venda: Omit<Venda, "id">) => {
    const newVenda = { ...venda, id: Date.now().toString() }
    setVendas((prev) => [...prev, newVenda])
  }

  const updateVenda = (id: string, venda: Partial<Venda>) => {
    setVendas((prev) => prev.map((v) => (v.id === id ? { ...v, ...venda } : v)))

    if (venda.status === "concluido") {
      console.log("[v0] Venda concluída, abatendo estoque:", id)
      abaterEstoquePorVenda(id)
    }
  }

  const deleteVenda = (id: string) => {
    setVendas((prev) => prev.filter((v) => v.id !== id))
  }

  const value = {
    custosFixos,
    custosVariaveis,
    insumos,
    produtos,
    bebidas,
    combos,
    vendas,
    adicionais,
    personalizacoes,
    estoqueInsumos,
    movimentacoesEstoque,
    ingredientesBase,
    addCustoFixo,
    updateCustoFixo,
    deleteCustoFixo,
    addCustoVariavel,
    updateCustoVariavel,
    deleteCustoVariavel,
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
    addVenda,
    updateVenda,
    deleteVenda,
    addIngredienteBase,
    updateIngredienteBase,
    deleteIngredienteBase,
    addEstoqueInsumo,
    updateEstoqueInsumo,
    deleteEstoqueInsumo,
    addMovimentacaoEstoque,
    getEstoqueAtualIngrediente,
    registrarCompra,
    getEstoqueAtual,
    getValorEstoque,
    baixarEstoque,
    verificarEstoqueSuficiente,
    abaterEstoquePorVenda,
    getTotalCustosFixos,
    getTotalCustosVariaveis,
    calculateCMV,
    calculatePrecoVenda,
    exportData,
    importData,
    clearAllData,
    setAdicionais,
    setPersonalizacoes,
  }

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
}

export function usePricing() {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider")
  }
  return context
}
