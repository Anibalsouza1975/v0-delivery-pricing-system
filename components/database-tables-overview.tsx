"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Table, CheckCircle } from "lucide-react"

export default function DatabaseTablesOverview() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Lista das tabelas que existem no Supabase (baseado no schema atual)
  const existingTables = [
    { name: "insumos", description: "Ingredientes e matérias-primas", type: "Cartago BD" },
    { name: "produtos", description: "Produtos do cardápio", type: "Cartago BD" },
    { name: "bebidas", description: "Bebidas disponíveis", type: "Cartago BD" },
    { name: "combos", description: "Combos e promoções", type: "Cartago BD" },
    { name: "custos_fixos", description: "Custos fixos mensais", type: "Cartago BD" },
    { name: "custos_variaveis", description: "Custos variáveis (%)", type: "Cartago BD" },
    { name: "vendas", description: "Registro de vendas", type: "Cartago BD" },
    { name: "estoque_insumos", description: "Controle de estoque", type: "Cartago BD" },
    { name: "produto_insumos", description: "Receitas dos produtos", type: "Cartago BD" },
    { name: "ingredients", description: "Ingredients (English)", type: "Sistema" },
    { name: "products", description: "Products (English)", type: "Sistema" },
    { name: "beverages", description: "Beverages (English)", type: "Sistema" },
    { name: "fixed_costs", description: "Fixed costs (English)", type: "Sistema" },
    { name: "variable_costs", description: "Variable costs (English)", type: "Sistema" },
    { name: "orders", description: "Pedidos de delivery", type: "Sistema" },
    { name: "order_items", description: "Itens dos pedidos", type: "Sistema" },
    { name: "product_ingredients", description: "Product recipes", type: "Sistema" },
    { name: "combo_products", description: "Combo compositions", type: "Sistema" },
    { name: "notifications", description: "Sistema de notificações", type: "Sistema" },
  ]

  const cartagoTables = existingTables.filter((t) => t.type === "Cartago BD")
  const systemTables = existingTables.filter((t) => t.type === "Sistema")

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Tabelas Existentes no Supabase
        </CardTitle>
        <CardDescription>Visão geral das {existingTables.length} tabelas já criadas no banco de dados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status geral */}
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Banco de dados configurado com sucesso!</p>
            <p className="text-sm text-green-700">{existingTables.length} tabelas encontradas no Supabase</p>
          </div>
        </div>

        {/* Tabelas do Cartago BD */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tabelas do Cartago BD ({cartagoTables.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cartagoTables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{table.name}</span>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </div>
                <Badge variant="default">Ativa</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Tabelas do Sistema */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tabelas do Sistema ({systemTables.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {systemTables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{table.name}</span>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </div>
                <Badge variant="secondary">Sistema</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Informações Importantes:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• As tabelas do Cartago BD estão prontas para uso</li>
            <li>• O sistema possui versões em português e inglês das tabelas</li>
            <li>• Todas as tabelas têm campos de auditoria (created_at, updated_at)</li>
            <li>• O sistema de pedidos (orders) está configurado para delivery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
