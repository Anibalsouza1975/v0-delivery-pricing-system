"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw, Table } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TableInfo {
  name: string
  count: number
  status: "success" | "error" | "loading"
  sampleData?: any[]
  error?: string
}

export default function DiagnosticoBDModule() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  // Inicializar cliente Supabase
  useEffect(() => {
    const client = createClient()
    setSupabase(client)
  }, [])

  const testConnection = async () => {
    if (!supabase) return

    setIsRefreshing(true)
    setConnectionStatus("loading")

    try {
      // Teste básico de conexão
      const { data, error } = await supabase.from("produtos").select("count", { count: "exact", head: true })

      if (error) throw error

      setConnectionStatus("connected")
      await loadTableData()
    } catch (error) {
      console.error("[v0] Erro na conexão:", error)
      setConnectionStatus("error")
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadTableData = async () => {
    if (!supabase) return

    const tableNames = [
      "produtos",
      "bebidas",
      "combos",
      "vendas",
      "insumos",
      "ingredientes_base",
      "custos_fixos",
      "custos_variaveis",
      "estoque_insumos",
      "compras_insumos",
      "notificacoes",
    ]

    const tablePromises = tableNames.map(async (tableName) => {
      try {
        // Contar registros
        const { count, error: countError } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (countError) throw countError

        // Buscar dados de exemplo (primeiros 3 registros)
        const { data: sampleData, error: dataError } = await supabase.from(tableName).select("*").limit(3)

        if (dataError) throw dataError

        return {
          name: tableName,
          count: count || 0,
          status: "success" as const,
          sampleData: sampleData || [],
        }
      } catch (error) {
        console.error(`[v0] Erro ao carregar tabela ${tableName}:`, error)
        return {
          name: tableName,
          count: 0,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }
      }
    })

    const results = await Promise.all(tablePromises)
    setTables(results)
  }

  useEffect(() => {
    if (supabase) {
      testConnection()
    }
  }, [supabase])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "loading":
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const formatTableName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const renderSampleData = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-muted-foreground">Nenhum dado encontrado</p>

    const firstItem = data[0]
    const keys = Object.keys(firstItem).slice(0, 4) // Mostrar apenas as primeiras 4 colunas

    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="p-2 bg-muted rounded text-sm">
            {keys.map((key) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground truncate max-w-32">
                  {typeof item[key] === "object" ? JSON.stringify(item[key]) : String(item[key] || "N/A")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6" />
              <div>
                <CardTitle>Status da Conexão com Banco de Dados</CardTitle>
                <CardDescription>Diagnóstico completo da conexão Supabase</CardDescription>
              </div>
            </div>
            <Button onClick={testConnection} disabled={isRefreshing} variant="outline" size="sm">
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(connectionStatus)}
            <div>
              <p className="font-medium">
                {connectionStatus === "connected" && "Conectado com sucesso"}
                {connectionStatus === "error" && "Erro na conexão"}
                {connectionStatus === "loading" && "Testando conexão..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {connectionStatus === "connected" && "Banco de dados acessível e funcionando"}
                {connectionStatus === "error" && "Verifique as configurações do Supabase"}
                {connectionStatus === "loading" && "Aguarde..."}
              </p>
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-medium mb-2">Variáveis de Ambiente</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>SUPABASE_URL:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configurada" : "✗ Ausente"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>SUPABASE_ANON_KEY:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Configurada" : "✗ Ausente"}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Estatísticas Gerais</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total de Tabelas:</span>
                  <Badge variant="outline">{tables.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tabelas com Dados:</span>
                  <Badge variant="outline">{tables.filter((t) => t.count > 0).length}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados das Tabelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Dados das Tabelas
          </CardTitle>
          <CardDescription>Visualize o conteúdo e estatísticas de cada tabela do banco de dados</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <Card key={table.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{formatTableName(table.name)}</CardTitle>
                        {getStatusIcon(table.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-1">{table.count}</div>
                      <p className="text-sm text-muted-foreground">{table.count === 1 ? "registro" : "registros"}</p>
                      {table.error && <p className="text-xs text-red-500 mt-2">{table.error}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {tables.map((table) => (
                    <Card key={table.name}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{formatTableName(table.name)}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(table.status)}
                            <Badge variant="outline">{table.count} registros</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {table.status === "success" ? (
                          <div>
                            <h4 className="font-medium mb-2">Dados de Exemplo:</h4>
                            {renderSampleData(table.sampleData || [])}
                          </div>
                        ) : (
                          <p className="text-red-500">{table.error || "Erro ao carregar dados"}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
