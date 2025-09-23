"use client"
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

// ... resto do código do context original ...
