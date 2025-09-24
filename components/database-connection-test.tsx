"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { clientDb } from "@/lib/database"

interface TestResult {
  table: string
  status: "success" | "error" | "loading"
  count?: number
  error?: string
}

export default function DatabaseConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const testDatabaseConnection = async () => {
    setTesting(true)
    setResults([])

    const tables = [
      { name: "insumos", fn: () => clientDb.getIngredients() },
      { name: "produtos", fn: () => clientDb.getProducts() },
      { name: "bebidas", fn: () => clientDb.getBeverages() },
      { name: "combos", fn: () => clientDb.getCombos() },
      { name: "custos_fixos", fn: () => clientDb.getFixedCosts() },
      { name: "custos_variaveis", fn: () => clientDb.getVariableCosts() },
      { name: "vendas", fn: () => clientDb.getSales() },
      { name: "estoque_insumos", fn: () => clientDb.getStock() },
    ]

    for (const table of tables) {
      setResults((prev) => [...prev, { table: table.name, status: "loading" }])

      try {
        const data = await table.fn()
        setResults((prev) =>
          prev.map((r) => (r.table === table.name ? { ...r, status: "success" as const, count: data.length } : r)),
        )
      } catch (error) {
        console.error(`[v0] Error testing ${table.name}:`, error)
        setResults((prev) =>
          prev.map((r) =>
            r.table === table.name
              ? { ...r, status: "error" as const, error: error instanceof Error ? error.message : "Erro desconhecido" }
              : r,
          ),
        )
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setTesting(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (result: TestResult) => {
    switch (result.status) {
      case "loading":
        return <Badge variant="secondary">Testando...</Badge>
      case "success":
        return <Badge variant="default">{result.count} registros</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Teste de Conexão - Cartago BD
        </CardTitle>
        <CardDescription>Teste a conexão com as tabelas do banco de dados Cartago BD no Supabase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testDatabaseConnection} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando Conexão...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Testar Conexão com Banco
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Resultados dos Testes:</h3>
            {results.map((result) => (
              <div key={result.table} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.table}</span>
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(result)}</div>
              </div>
            ))}
          </div>
        )}

        {results.some((r) => r.status === "error") && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Erros Encontrados:</h4>
            <div className="space-y-1 text-sm text-red-700">
              {results
                .filter((r) => r.status === "error")
                .map((result) => (
                  <div key={result.table}>
                    <strong>{result.table}:</strong> {result.error}
                  </div>
                ))}
            </div>
            <div className="mt-3 text-sm text-red-600">
              <p>
                <strong>Possíveis soluções:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Execute o script SQL para criar as tabelas: scripts/001_create_cartago_tables.sql</li>
                <li>Execute o script de dados iniciais: scripts/002_seed_cartago_data.sql</li>
                <li>Verifique se as variáveis de ambiente do Supabase estão configuradas</li>
                <li>Confirme se o banco de dados está acessível</li>
              </ul>
            </div>
          </div>
        )}

        {results.length > 0 && results.every((r) => r.status === "success") && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Conexão com Cartago BD bem-sucedida!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">Todas as tabelas estão acessíveis e funcionando corretamente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
