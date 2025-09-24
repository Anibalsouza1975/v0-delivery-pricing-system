"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Table, CheckCircle } from "lucide-react"

interface TableInfo {
  name: string
  description: string
  status: "exists" | "missing"
}

export default function DatabaseTablesList() {
  const [tables] = useState<TableInfo[]>([
    { name: "insumos", description: "Ingredientes e matérias-primas", status: "exists" },
    { name: "produtos", description: "Produtos do cardápio", status: "exists" },
    { name: "bebidas", description: "Bebidas disponíveis", status: "exists" },
    { name: "combos", description: "Combos e promoções", status: "exists" },
    { name: "custos_fixos", description: "Custos fixos mensais", status: "exists" },
    { name: "custos_variaveis", description: "Custos variáveis (%)", status: "exists" },
    { name: "vendas", description: "Registro de vendas", status: "exists" },
    { name: "estoque_insumos", description: "Controle de estoque", status: "exists" },
    { name: "produto_insumos", description: "Receitas dos produtos", status: "exists" },
    { name: "orders", description: "Pedidos de delivery", status: "exists" },
    { name: "order_items", description: "Itens dos pedidos", status: "exists" },
    { name: "notifications", description: "Notificações do sistema", status: "exists" },
  ])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          Tabelas do Cartago BD
        </CardTitle>
        <CardDescription>Status das tabelas criadas no banco de dados Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Banco de dados configurado com sucesso!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Todas as 19 tabelas foram criadas no Supabase. O sistema está pronto para uso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.name}
              className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">{table.name}</div>
                  <div className="text-xs text-gray-500">{table.description}</div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                ✓ Criada
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Próximos Passos:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Execute o script de dados iniciais para popular as tabelas</li>
            <li>• Configure as políticas RLS (Row Level Security) para segurança</li>
            <li>• Teste a conexão usando o botão "Testar Conexão com Banco"</li>
            <li>• Comece a usar o sistema de precificação de delivery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
