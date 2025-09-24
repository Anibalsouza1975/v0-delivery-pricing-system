import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Database types based on Cartago BD schema
export interface DatabaseIngredient {
  id: string
  nome: string
  unidade: string
  preco_compra: number
  categoria?: string
  fornecedor?: string
  created_at: string
  updated_at: string
}

export interface DatabaseProduct {
  id: string
  nome: string
  categoria: string
  descricao?: string
  preco_base: number
  preco_custo: number
  margem_percentual: number
  tempo_preparacao: number
  ativo: boolean
  imagem_url?: string
  created_at: string
  updated_at: string
}

export interface DatabaseProductIngredient {
  id: string
  produto_id: string
  insumo_id: string
  quantidade: number
  created_at: string
}

export interface DatabaseFixedCost {
  id: string
  nome: string
  valor: number
  frequencia: string
  categoria: string
  created_at: string
  updated_at: string
}

export interface DatabaseVariableCost {
  id: string
  nome: string
  percentual: number
  categoria: string
  created_at: string
  updated_at: string
}

export interface DatabaseBeverage {
  id: string
  nome: string
  tamanho: string
  preco: number
  custo: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseCombo {
  id: string
  name: string
  description?: string
  price: number
  discount_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseStock {
  id: string
  insumo_id: string
  quantidade_atual: number
  quantidade_minima: number
  created_at: string
  updated_at: string
}

export interface DatabaseSale {
  id: string
  data: string
  total: number
  status: string
  cliente?: string
  observacoes?: string
  created_at: string
}

// Client-side database functions using Cartago BD table names
export const clientDb = {
  // Insumos (Ingredients)
  async getIngredients(): Promise<DatabaseIngredient[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("insumos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async createIngredient(
    ingredient: Omit<DatabaseIngredient, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseIngredient> {
    const supabase = createClient()
    const { data, error } = await supabase.from("insumos").insert(ingredient).select().single()

    if (error) throw error
    return data
  },

  async updateIngredient(id: string, updates: Partial<DatabaseIngredient>): Promise<DatabaseIngredient> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("insumos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteIngredient(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("insumos").delete().eq("id", id)

    if (error) throw error
  },

  // Produtos (Products)
  async getProducts(): Promise<DatabaseProduct[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("produtos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async createProduct(product: Omit<DatabaseProduct, "id" | "created_at" | "updated_at">): Promise<DatabaseProduct> {
    const supabase = createClient()
    const { data, error } = await supabase.from("produtos").insert(product).select().single()

    if (error) throw error
    return data
  },

  async updateProduct(id: string, updates: Partial<DatabaseProduct>): Promise<DatabaseProduct> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("produtos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("produtos").delete().eq("id", id)

    if (error) throw error
  },

  // Custos Fixos (Fixed Costs)
  async getFixedCosts(): Promise<DatabaseFixedCost[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("custos_fixos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async createFixedCost(cost: Omit<DatabaseFixedCost, "id" | "created_at" | "updated_at">): Promise<DatabaseFixedCost> {
    const supabase = createClient()
    const { data, error } = await supabase.from("custos_fixos").insert(cost).select().single()

    if (error) throw error
    return data
  },

  async updateFixedCost(id: string, updates: Partial<DatabaseFixedCost>): Promise<DatabaseFixedCost> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("custos_fixos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteFixedCost(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("custos_fixos").delete().eq("id", id)

    if (error) throw error
  },

  // Custos Variáveis (Variable Costs)
  async getVariableCosts(): Promise<DatabaseVariableCost[]> {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("custos_variaveis").select("*").order("nome")

      if (error) {
        console.error("[v0] Variable costs query error:", error)
        throw error
      }

      console.log("[v0] Variable costs loaded:", data?.length || 0)
      return data || []
    } catch (err: any) {
      console.error("[v0] Failed to get variable costs:", err.message)

      // If it's a schema cache error, try to refresh the connection
      if (err.message?.includes("schema cache") || err.message?.includes("table")) {
        console.log("[v0] Attempting to refresh Supabase connection...")
        // Create a new client instance to refresh the cache
        const freshSupabase = createClient()
        const { data, error } = await freshSupabase.from("custos_variaveis").select("*").order("nome")

        if (error) throw error
        console.log("[v0] Variable costs loaded after refresh:", data?.length || 0)
        return data || []
      }

      throw err
    }
  },

  async createVariableCost(
    cost: Omit<DatabaseVariableCost, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseVariableCost> {
    const supabase = createClient()
    const { data, error } = await supabase.from("custos_variaveis").insert(cost).select().single()

    if (error) throw error
    return data
  },

  async updateVariableCost(id: string, updates: Partial<DatabaseVariableCost>): Promise<DatabaseVariableCost> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("custos_variaveis")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteVariableCost(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("custos_variaveis").delete().eq("id", id)

    if (error) throw error
  },

  // Bebidas (Beverages)
  async getBeverages(): Promise<DatabaseBeverage[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("bebidas").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async createBeverage(
    beverage: Omit<DatabaseBeverage, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseBeverage> {
    const supabase = createClient()
    const { data, error } = await supabase.from("bebidas").insert(beverage).select().single()

    if (error) throw error
    return data
  },

  async updateBeverage(id: string, updates: Partial<DatabaseBeverage>): Promise<DatabaseBeverage> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bebidas")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteBeverage(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("bebidas").delete().eq("id", id)

    if (error) throw error
  },

  // Combos
  async getCombos(): Promise<DatabaseCombo[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("combos").select("*").order("name")

    if (error) throw error
    return data || []
  },

  async createCombo(combo: Omit<DatabaseCombo, "id" | "created_at" | "updated_at">): Promise<DatabaseCombo> {
    const supabase = createClient()
    const { data, error } = await supabase.from("combos").insert(combo).select().single()

    if (error) throw error
    return data
  },

  async updateCombo(id: string, updates: Partial<DatabaseCombo>): Promise<DatabaseCombo> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("combos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteCombo(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("combos").delete().eq("id", id)

    if (error) throw error
  },

  // Vendas (Sales)
  async getSales(): Promise<DatabaseSale[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("vendas").select("*").order("data", { ascending: false })

    if (error) throw error
    return data || []
  },

  async createSale(sale: Omit<DatabaseSale, "id" | "created_at">): Promise<DatabaseSale> {
    const supabase = createClient()
    const { data, error } = await supabase.from("vendas").insert(sale).select().single()

    if (error) throw error
    return data
  },

  async updateSale(id: string, updates: Partial<DatabaseSale>): Promise<DatabaseSale> {
    const supabase = createClient()
    const { data, error } = await supabase.from("vendas").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async deleteSale(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("vendas").delete().eq("id", id)

    if (error) throw error
  },

  // Estoque (Stock)
  async getStock(): Promise<DatabaseStock[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("estoque_insumos").select("*")

    if (error) throw error
    return data || []
  },

  async createStock(stock: Omit<DatabaseStock, "id" | "created_at" | "updated_at">): Promise<DatabaseStock> {
    const supabase = createClient()
    const { data, error } = await supabase.from("estoque_insumos").insert(stock).select().single()

    if (error) throw error
    return data
  },

  async updateStock(id: string, updates: Partial<DatabaseStock>): Promise<DatabaseStock> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("estoque_insumos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteStock(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("estoque_insumos").delete().eq("id", id)

    if (error) throw error
  },
}

// Server-side database functions using Cartago BD table names
export const serverDb = {
  async getIngredients(): Promise<DatabaseIngredient[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("insumos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async getProducts(): Promise<DatabaseProduct[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("produtos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async getFixedCosts(): Promise<DatabaseFixedCost[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("custos_fixos").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async getVariableCosts(): Promise<DatabaseVariableCost[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("custos_variaveis").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async getBeverages(): Promise<DatabaseBeverage[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("bebidas").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  async getCombos(): Promise<DatabaseCombo[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("combos").select("*").order("name")

    if (error) throw error
    return data || []
  },

  async getSales(): Promise<DatabaseSale[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("vendas").select("*").order("data", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getStock(): Promise<DatabaseStock[]> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("estoque_insumos").select("*")

    if (error) throw error
    return data || []
  },
}
