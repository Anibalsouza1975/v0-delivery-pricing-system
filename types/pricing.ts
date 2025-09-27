export interface CustoFixo {
  id: string
  nome: string
  valor: number
  categoria: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CustoVariavel {
  id: string
  nome: string
  valor: number
  categoria: string
  unidade: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Insumo {
  id: string
  nome: string
  custoUnitario: number
  unidade: string
  categoria: string
  fornecedor?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IngredienteReceita {
  insumoId: string
  quantidade: number
  unidade: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  ingredientes: IngredienteReceita[]
  margemLucro: number
  precoVenda?: number
  custoProducao?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface Bebida {
  id: string
  nome: string
  categoria: string
  custoUnitario: number
  margemLucro: number
  precoVenda: number
  fornecedor?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ItemCombo {
  tipo: "produto" | "bebida"
  id: string
  quantidade: number
}

export interface Combo {
  id: string
  nome: string
  descricao: string
  itens: ItemCombo[]
  desconto: number
  precoOriginal?: number
  precoComDesconto?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface PricingData {
  custosFixos: CustoFixo[]
  custosVariaveis: CustoVariavel[]
  insumos: Insumo[]
  produtos: Produto[]
  bebidas: Bebida[]
  combos: Combo[]
}
