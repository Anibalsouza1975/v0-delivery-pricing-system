"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  clientDb,
  type DatabaseIngredient,
  type DatabaseProduct,
  type DatabaseFixedCost,
  type DatabaseVariableCost,
  type DatabaseBeverage,
  type DatabaseCombo,
} from "@/lib/database"

// Legacy types for compatibility
export interface CustoFixo {
  id: string
  nome: string
  valor: number
  categoria: string
  frequencia: string
}

export interface CustoVariavel {
  id: string
  nome: string
  percentual: number
  categoria: string
}

export interface Insumo {
  id: string
  nome: string
  unidade: string
  precoCompra: number
  categoria: string
  fornecedor?: string
  ingredienteBaseId?: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  descricao?: string
  precoBase: number
  precoCusto: number
  margemPercentual: number
  tempoPreparacao: number
  ativo: boolean
  imagemUrl?: string
  insumos: { insumoId: string; quantidade: number }[]
}

export interface Bebida {
  id: string
  nome: string
  tamanho: string
  preco: number
  custo: number
  ativo: boolean
}

export interface Combo {
  id: string
  nome: string
  descricao?: string
  preco: number
  descontoPercentual: number
  ativo: boolean
  produtos: { produtoId: string; quantidade: number }[]
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

interface DatabasePricingContextType {
  // Estados
  custosFixos: CustoFixo[]
  custosVariaveis: CustoVariavel[]
  insumos: Insumo[]
  produtos: Produto[]
  bebidas: Bebida[]
  combos: Combo[]
  vendas: Venda[]
  loading: boolean
  error: string | null

  // Funções para custos fixos
  addCustoFixo: (custo: Omit<CustoFixo, "id">) => Promise<void>
  updateCustoFixo: (id: string, custo: Partial<CustoFixo>) => Promise<void>
  deleteCustoFixo: (id: string) => Promise<void>

  // Funções para custos variáveis
  addCustoVariavel: (custo: Omit<CustoVariavel, "id">) => Promise<void>
  updateCustoVariavel: (id: string, custo: Partial<CustoVariavel>) => Promise<void>
  deleteCustoVariavel: (id: string) => Promise<void>

  // Funções para insumos
  addInsumo: (insumo: Omit<Insumo, "id">) => Promise<void>
  updateInsumo: (id: string, insumo: Partial<Insumo>) => Promise<void>
  deleteInsumo: (id: string) => Promise<void>

  // Funções para produtos
  addProduto: (produto: Omit<Produto, "id">) => Promise<void>
  updateProduto: (id: string, produto: Partial<Produto>) => Promise<void>
  deleteProduto: (id: string) => Promise<void>

  // Funções para bebidas
  addBebida: (bebida: Omit<Bebida, "id">) => Promise<void>
  updateBebida: (id: string, bebida: Partial<Bebida>) => Promise<void>
  deleteBebida: (id: string) => Promise<void>

  // Funções para combos
  addCombo: (combo: Omit<Combo, "id">) => Promise<void>
  updateCombo: (id: string, combo: Partial<Combo>) => Promise<void>
  deleteCombo: (id: string) => Promise<void>

  // Funções para vendas
  addVenda: (venda: Omit<Venda, "id">) => Promise<void>
  updateVenda: (id: string, venda: Partial<Venda>) => Promise<void>
  deleteVenda: (id: string) => Promise<void>

  // Cálculos
  getTotalCustosFixos: () => number
  getTotalCustosVariaveis: () => number
  calculateCMV: (produtoId: string) => number
  calculatePrecoVenda: (cmv: number, margem: number) => number

  // Refresh data
  refreshData: () => Promise<void>
}

const DatabasePricingContext = createContext<DatabasePricingContextType | undefined>(undefined)

// Helper functions to convert between database and legacy formats
const convertDbIngredientToInsumo = (dbIngredient: DatabaseIngredient): Insumo => ({
  id: dbIngredient.id,
  nome: dbIngredient.nome,
  unidade: dbIngredient.unidade,
  precoCompra: dbIngredient.preco_compra,
  categoria: dbIngredient.categoria || "Ingredientes",
  fornecedor: dbIngredient.fornecedor,
  ingredienteBaseId: dbIngredient.id,
})

const convertInsumoToDbIngredient = (
  insumo: Omit<Insumo, "id">,
): Omit<DatabaseIngredient, "id" | "created_at" | "updated_at"> => ({
  nome: insumo.nome,
  unidade: insumo.unidade,
  preco_compra: insumo.precoCompra,
  categoria: insumo.categoria,
  fornecedor: insumo.fornecedor,
})

const convertDbProductToProduto = (dbProduct: DatabaseProduct): Produto => ({
  id: dbProduct.id,
  nome: dbProduct.nome,
  categoria: dbProduct.categoria,
  descricao: dbProduct.descricao,
  precoBase: dbProduct.preco_base,
  precoCusto: dbProduct.preco_custo,
  margemPercentual: dbProduct.margem_percentual,
  tempoPreparacao: dbProduct.tempo_preparacao,
  ativo: dbProduct.ativo,
  imagemUrl: dbProduct.imagem_url,
  insumos: [], // Will be populated separately
})

const convertProdutoToDbProduct = (
  produto: Omit<Produto, "id">,
): Omit<DatabaseProduct, "id" | "created_at" | "updated_at"> => ({
  nome: produto.nome,
  categoria: produto.categoria,
  descricao: produto.descricao,
  preco_base: produto.precoBase,
  preco_custo: produto.precoCusto,
  margem_percentual: produto.margemPercentual,
  tempo_preparacao: produto.tempoPreparacao,
  ativo: produto.ativo,
  imagem_url: produto.imagemUrl,
})

const convertDbFixedCostToCustoFixo = (dbCost: DatabaseFixedCost): CustoFixo => ({
  id: dbCost.id,
  nome: dbCost.nome,
  valor: dbCost.valor,
  categoria: dbCost.categoria,
  frequencia: dbCost.frequencia,
})

const convertCustoFixoToDbFixedCost = (
  custo: Omit<CustoFixo, "id">,
): Omit<DatabaseFixedCost, "id" | "created_at" | "updated_at"> => ({
  nome: custo.nome,
  valor: custo.valor,
  frequencia: custo.frequencia,
  categoria: custo.categoria,
})

const convertDbVariableCostToCustoVariavel = (dbCost: DatabaseVariableCost): CustoVariavel => ({
  id: dbCost.id,
  nome: dbCost.nome,
  percentual: dbCost.percentual,
  categoria: dbCost.categoria,
})

const convertCustoVariavelToDbVariableCost = (
  custo: Omit<CustoVariavel, "id">,
): Omit<DatabaseVariableCost, "id" | "created_at" | "updated_at"> => ({
  nome: custo.nome,
  percentual: custo.percentual,
  categoria: custo.categoria,
})

const convertDbBeverageToBebida = (dbBeverage: DatabaseBeverage): Bebida => ({
  id: dbBeverage.id,
  nome: dbBeverage.nome,
  tamanho: dbBeverage.tamanho,
  preco: dbBeverage.preco,
  custo: dbBeverage.custo,
  ativo: dbBeverage.ativo,
})

const convertBebidaToDbBeverage = (
  bebida: Omit<Bebida, "id">,
): Omit<DatabaseBeverage, "id" | "created_at" | "updated_at"> => ({
  nome: bebida.nome,
  tamanho: bebida.tamanho,
  preco: bebida.preco,
  custo: bebida.custo,
  ativo: bebida.ativo,
})

const convertDbComboToCombo = (dbCombo: DatabaseCombo): Combo => ({
  id: dbCombo.id,
  nome: dbCombo.nome,
  descricao: dbCombo.descricao,
  preco: dbCombo.preco,
  descontoPercentual: dbCombo.desconto_percentual,
  ativo: dbCombo.ativo,
  produtos: [], // Will be populated separately
})

const convertComboToDbCombo = (combo: Omit<Combo, "id">): Omit<DatabaseCombo, "id" | "created_at" | "updated_at"> => ({
  nome: combo.nome,
  descricao: combo.descricao,
  preco: combo.preco,
  desconto_percentual: combo.descontoPercentual,
  ativo: combo.ativo,
})

export function DatabasePricingProvider({ children }: { children: ReactNode }) {
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([])
  const [custosVariaveis, setCustosVariaveis] = useState<CustoVariavel[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)

      const retryOperation = async (operation: () => Promise<any>, retries = 3): Promise<any> => {
        for (let i = 0; i < retries; i++) {
          try {
            return await operation()
          } catch (err: any) {
            console.log(`[v0] Attempt ${i + 1} failed:`, err.message)
            if (i === retries - 1) throw err
            if (err.message?.includes("schema cache") || err.message?.includes("table")) {
              // Wait a bit before retrying for cache issues
              await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
            } else {
              throw err
            }
          }
        }
        throw new Error("Max retries exceeded")
      }

      const [dbIngredients, dbProducts, dbFixedCosts, dbVariableCosts, dbBeverages, dbCombos] = await Promise.all([
        retryOperation(() => clientDb.getIngredients()),
        retryOperation(() => clientDb.getProducts()),
        retryOperation(() => clientDb.getFixedCosts()),
        retryOperation(() => clientDb.getVariableCosts()),
        retryOperation(() => clientDb.getBeverages()),
        retryOperation(() => clientDb.getCombos()),
      ])

      console.log("[v0] Data loaded successfully:", {
        ingredients: dbIngredients.length,
        products: dbProducts.length,
        fixedCosts: dbFixedCosts.length,
        variableCosts: dbVariableCosts.length,
        beverages: dbBeverages.length,
        combos: dbCombos.length,
      })

      setCustosFixos(dbFixedCosts.map(convertDbFixedCostToCustoFixo))
      setCustosVariaveis(dbVariableCosts.map(convertDbVariableCostToCustoVariavel))
      setInsumos(dbIngredients.map(convertDbIngredientToInsumo))
      setProdutos(dbProducts.map(convertDbProductToProduto))
      setBebidas(dbBeverages.map(convertDbBeverageToBebida))
      setCombos(dbCombos.map(convertDbComboToCombo))
    } catch (err) {
      console.error("[v0] Error loading data:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Custos Fixos
  const addCustoFixo = async (custo: Omit<CustoFixo, "id">) => {
    try {
      const dbCost = await clientDb.createFixedCost(convertCustoFixoToDbFixedCost(custo))
      setCustosFixos((prev) => [...prev, convertDbFixedCostToCustoFixo(dbCost)])
    } catch (err) {
      console.error("[v0] Error adding fixed cost:", err)
      throw err
    }
  }

  const updateCustoFixo = async (id: string, custo: Partial<CustoFixo>) => {
    try {
      const updates: Partial<DatabaseFixedCost> = {}
      if (custo.nome) updates.nome = custo.nome
      if (custo.valor !== undefined) updates.valor = custo.valor
      if (custo.categoria) updates.categoria = custo.categoria
      if (custo.frequencia) updates.frequencia = custo.frequencia

      const dbCost = await clientDb.updateFixedCost(id, updates)
      setCustosFixos((prev) => prev.map((c) => (c.id === id ? convertDbFixedCostToCustoFixo(dbCost) : c)))
    } catch (err) {
      console.error("[v0] Error updating fixed cost:", err)
      throw err
    }
  }

  const deleteCustoFixo = async (id: string) => {
    try {
      await clientDb.deleteFixedCost(id)
      setCustosFixos((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting fixed cost:", err)
      throw err
    }
  }

  // Custos Variáveis
  const addCustoVariavel = async (custo: Omit<CustoVariavel, "id">) => {
    try {
      const dbCost = await clientDb.createVariableCost(convertCustoVariavelToDbVariableCost(custo))
      setCustosVariaveis((prev) => [...prev, convertDbVariableCostToCustoVariavel(dbCost)])
    } catch (err) {
      console.error("[v0] Error adding variable cost:", err)
      throw err
    }
  }

  const updateCustoVariavel = async (id: string, custo: Partial<CustoVariavel>) => {
    try {
      const updates: Partial<DatabaseVariableCost> = {}
      if (custo.nome) updates.nome = custo.nome
      if (custo.percentual !== undefined) updates.percentual = custo.percentual
      if (custo.categoria) updates.categoria = custo.categoria

      const dbCost = await clientDb.updateVariableCost(id, updates)
      setCustosVariaveis((prev) => prev.map((c) => (c.id === id ? convertDbVariableCostToCustoVariavel(dbCost) : c)))
    } catch (err) {
      console.error("[v0] Error updating variable cost:", err)
      throw err
    }
  }

  const deleteCustoVariavel = async (id: string) => {
    try {
      await clientDb.deleteVariableCost(id)
      setCustosVariaveis((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting variable cost:", err)
      throw err
    }
  }

  // Insumos
  const addInsumo = async (insumo: Omit<Insumo, "id">) => {
    try {
      const dbIngredient = await clientDb.createIngredient(convertInsumoToDbIngredient(insumo))
      setInsumos((prev) => [...prev, convertDbIngredientToInsumo(dbIngredient)])
    } catch (err) {
      console.error("[v0] Error adding ingredient:", err)
      throw err
    }
  }

  const updateInsumo = async (id: string, insumo: Partial<Insumo>) => {
    try {
      const updates: Partial<DatabaseIngredient> = {}
      if (insumo.nome) updates.nome = insumo.nome
      if (insumo.unidade) updates.unidade = insumo.unidade
      if (insumo.precoCompra !== undefined) updates.preco_compra = insumo.precoCompra
      if (insumo.categoria) updates.categoria = insumo.categoria
      if (insumo.fornecedor) updates.fornecedor = insumo.fornecedor

      const dbIngredient = await clientDb.updateIngredient(id, updates)
      setInsumos((prev) => prev.map((i) => (i.id === id ? convertDbIngredientToInsumo(dbIngredient) : i)))
    } catch (err) {
      console.error("[v0] Error updating ingredient:", err)
      throw err
    }
  }

  const deleteInsumo = async (id: string) => {
    try {
      await clientDb.deleteIngredient(id)
      setInsumos((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting ingredient:", err)
      throw err
    }
  }

  // Produtos
  const addProduto = async (produto: Omit<Produto, "id">) => {
    try {
      const dbProduct = await clientDb.createProduct(convertProdutoToDbProduct(produto))
      setProdutos((prev) => [...prev, convertDbProductToProduto(dbProduct)])
    } catch (err) {
      console.error("[v0] Error adding product:", err)
      throw err
    }
  }

  const updateProduto = async (id: string, produto: Partial<Produto>) => {
    try {
      const updates: Partial<DatabaseProduct> = {}
      if (produto.nome) updates.nome = produto.nome
      if (produto.categoria) updates.categoria = produto.categoria
      if (produto.descricao) updates.descricao = produto.descricao
      if (produto.precoBase !== undefined) updates.preco_base = produto.precoBase
      if (produto.precoCusto !== undefined) updates.preco_custo = produto.precoCusto
      if (produto.margemPercentual !== undefined) updates.margem_percentual = produto.margemPercentual
      if (produto.tempoPreparacao !== undefined) updates.tempo_preparacao = produto.tempoPreparacao
      if (produto.ativo !== undefined) updates.ativo = produto.ativo
      if (produto.imagemUrl) updates.imagem_url = produto.imagemUrl

      const dbProduct = await clientDb.updateProduct(id, updates)
      setProdutos((prev) => prev.map((p) => (p.id === id ? convertDbProductToProduto(dbProduct) : p)))
    } catch (err) {
      console.error("[v0] Error updating product:", err)
      throw err
    }
  }

  const deleteProduto = async (id: string) => {
    try {
      await clientDb.deleteProduct(id)
      setProdutos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting product:", err)
      throw err
    }
  }

  // Bebidas
  const addBebida = async (bebida: Omit<Bebida, "id">) => {
    try {
      const dbBeverage = await clientDb.createBeverage(convertBebidaToDbBeverage(bebida))
      setBebidas((prev) => [...prev, convertDbBeverageToBebida(dbBeverage)])
    } catch (err) {
      console.error("[v0] Error adding beverage:", err)
      throw err
    }
  }

  const updateBebida = async (id: string, bebida: Partial<Bebida>) => {
    try {
      const updates: Partial<DatabaseBeverage> = {}
      if (bebida.nome) updates.nome = bebida.nome
      if (bebida.tamanho) updates.tamanho = bebida.tamanho
      if (bebida.preco !== undefined) updates.preco = bebida.preco
      if (bebida.custo !== undefined) updates.custo = bebida.custo
      if (bebida.ativo !== undefined) updates.ativo = bebida.ativo

      const dbBeverage = await clientDb.updateBeverage(id, updates)
      setBebidas((prev) => prev.map((b) => (b.id === id ? convertDbBeverageToBebida(dbBeverage) : b)))
    } catch (err) {
      console.error("[v0] Error updating beverage:", err)
      throw err
    }
  }

  const deleteBebida = async (id: string) => {
    try {
      await clientDb.deleteBeverage(id)
      setBebidas((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting beverage:", err)
      throw err
    }
  }

  // Combos
  const addCombo = async (combo: Omit<Combo, "id">) => {
    try {
      const dbCombo = await clientDb.createCombo(convertComboToDbCombo(combo))
      setCombos((prev) => [...prev, convertDbComboToCombo(dbCombo)])
    } catch (err) {
      console.error("[v0] Error adding combo:", err)
      throw err
    }
  }

  const updateCombo = async (id: string, combo: Partial<Combo>) => {
    try {
      const updates: Partial<DatabaseCombo> = {}
      if (combo.nome) updates.nome = combo.nome
      if (combo.descricao) updates.descricao = combo.descricao
      if (combo.preco !== undefined) updates.preco = combo.preco
      if (combo.descontoPercentual !== undefined) updates.desconto_percentual = combo.descontoPercentual
      if (combo.ativo !== undefined) updates.ativo = combo.ativo

      const dbCombo = await clientDb.updateCombo(id, updates)
      setCombos((prev) => prev.map((c) => (c.id === id ? convertDbComboToCombo(dbCombo) : c)))
    } catch (err) {
      console.error("[v0] Error updating combo:", err)
      throw err
    }
  }

  const deleteCombo = async (id: string) => {
    try {
      await clientDb.deleteCombo(id)
      setCombos((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting combo:", err)
      throw err
    }
  }

  // Vendas (keeping in memory for now, can be moved to database later)
  const addVenda = async (venda: Omit<Venda, "id">) => {
    const newVenda = { ...venda, id: Date.now().toString() }
    setVendas((prev) => [...prev, newVenda])
  }

  const updateVenda = async (id: string, venda: Partial<Venda>) => {
    setVendas((prev) => prev.map((v) => (v.id === id ? { ...v, ...venda } : v)))
  }

  const deleteVenda = async (id: string) => {
    setVendas((prev) => prev.filter((v) => v.id !== id))
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

  const value = {
    custosFixos,
    custosVariaveis,
    insumos,
    produtos,
    bebidas,
    combos,
    vendas,
    loading,
    error,
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
    getTotalCustosFixos,
    getTotalCustosVariaveis,
    calculateCMV,
    calculatePrecoVenda,
    refreshData,
  }

  return <DatabasePricingContext.Provider value={value}>{children}</DatabasePricingContext.Provider>
}

export function useDatabasePricing() {
  const context = useContext(DatabasePricingContext)
  if (context === undefined) {
    throw new Error("useDatabasePricing must be used within a DatabasePricingProvider")
  }
  return context
}
