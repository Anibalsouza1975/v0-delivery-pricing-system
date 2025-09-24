"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, Play } from "lucide-react"
import { useDatabasePricing } from "@/components/database-pricing-context"
import { clientDb } from "@/lib/database"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message?: string
  duration?: number
}

export default function DatabaseTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Conexão com Supabase", status: "pending" },
    { name: "Criação de Ingrediente", status: "pending" },
    { name: "Leitura de Ingredientes", status: "pending" },
    { name: "Atualização de Ingrediente", status: "pending" },
    { name: "Exclusão de Ingrediente", status: "pending" },
    { name: "Criação de Produto", status: "pending" },
    { name: "Criação de Custo Fixo", status: "pending" },
    { name: "Criação de Custo Variável", status: "pending" },
    { name: "Criação de Bebida", status: "pending" },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const { refreshData } = useDatabasePricing()

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, ...updates } : test)))
  }

  const runTests = async () => {
    setIsRunning(true)

    // Reset all tests
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: "pending" as const, message: undefined, duration: undefined })),
    )

    for (let i = 0; i < tests.length; i++) {
      const startTime = Date.now()
      updateTest(i, { status: "running" })

      try {
        switch (i) {
          case 0: // Conexão com Supabase
            await clientDb.getIngredients()
            updateTest(i, {
              status: "success",
              message: "Conexão estabelecida com sucesso",
              duration: Date.now() - startTime,
            })
            break

          case 1: // Criação de Ingrediente
            const newIngredient = await clientDb.createIngredient({
              name: "Teste Ingrediente",
              unit: "kg",
              cost_per_unit: 10.5,
              supplier: "Fornecedor Teste",
            })
            updateTest(i, {
              status: "success",
              message: `Ingrediente criado: ${newIngredient.id}`,
              duration: Date.now() - startTime,
            })
            break

          case 2: // Leitura de Ingredientes
            const ingredients = await clientDb.getIngredients()
            updateTest(i, {
              status: "success",
              message: `${ingredients.length} ingredientes encontrados`,
              duration: Date.now() - startTime,
            })
            break

          case 3: // Atualização de Ingrediente
            const ingredientsToUpdate = await clientDb.getIngredients()
            const testIngredient = ingredientsToUpdate.find((ing) => ing.name === "Teste Ingrediente")
            if (testIngredient) {
              await clientDb.updateIngredient(testIngredient.id, {
                cost_per_unit: 12.0,
              })
              updateTest(i, {
                status: "success",
                message: "Ingrediente atualizado com sucesso",
                duration: Date.now() - startTime,
              })
            } else {
              throw new Error("Ingrediente de teste não encontrado")
            }
            break

          case 4: // Exclusão de Ingrediente
            const ingredientsToDelete = await clientDb.getIngredients()
            const ingredientToDelete = ingredientsToDelete.find((ing) => ing.name === "Teste Ingrediente")
            if (ingredientToDelete) {
              await clientDb.deleteIngredient(ingredientToDelete.id)
              updateTest(i, {
                status: "success",
                message: "Ingrediente excluído com sucesso",
                duration: Date.now() - startTime,
              })
            } else {
              throw new Error("Ingrediente de teste não encontrado")
            }
            break

          case 5: // Criação de Produto
            const newProduct = await clientDb.createProduct({
              name: "Teste Produto",
              category: "Teste",
              description: "Produto de teste",
              base_price: 25.0,
              cost_price: 15.0,
              margin_percentage: 40.0,
              preparation_time: 10,
              is_active: true,
            })
            updateTest(i, {
              status: "success",
              message: `Produto criado: ${newProduct.id}`,
              duration: Date.now() - startTime,
            })
            // Limpar produto de teste
            await clientDb.deleteProduct(newProduct.id)
            break

          case 6: // Criação de Custo Fixo
            const newFixedCost = await clientDb.createFixedCost({
              name: "Teste Custo Fixo",
              amount: 500.0,
              frequency: "monthly",
              category: "Teste",
            })
            updateTest(i, {
              status: "success",
              message: `Custo fixo criado: ${newFixedCost.id}`,
              duration: Date.now() - startTime,
            })
            // Limpar custo de teste
            await clientDb.deleteFixedCost(newFixedCost.id)
            break

          case 7: // Criação de Custo Variável
            const newVariableCost = await clientDb.createVariableCost({
              name: "Teste Custo Variável",
              percentage: 5.0,
              category: "Teste",
            })
            updateTest(i, {
              status: "success",
              message: `Custo variável criado: ${newVariableCost.id}`,
              duration: Date.now() - startTime,
            })
            // Limpar custo de teste
            await clientDb.deleteVariableCost(newVariableCost.id)
            break

          case 8: // Criação de Bebida
            const newBeverage = await clientDb.createBeverage({
              name: "Teste Bebida",
              size: "350ml",
              price: 5.0,
              cost: 2.0,
              is_active: true,
            })
            updateTest(i, {
              status: "success",
              message: `Bebida criada: ${newBeverage.id}`,
              duration: Date.now() - startTime,
            })
            // Limpar bebida de teste
            await clientDb.deleteBeverage(newBeverage.id)
            break

          default:
            throw new Error("Teste não implementado")
        }
      } catch (error) {
        console.error(`Erro no teste ${i}:`, error)
        updateTest(i, {
          status: "error",
          message: error instanceof Error ? error.message : "Erro desconhecido",
          duration: Date.now() - startTime,
        })
      }

      // Pequena pausa entre testes
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Refresh data after tests
    await refreshData()
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Sucesso
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      case "running":
        return <Badge variant="secondary">Executando...</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const totalTests = tests.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Teste de Integração com Banco de Dados</CardTitle>
          </div>
          <CardDescription>Teste todas as operações CRUD do sistema com o Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="font-medium text-green-600">{successCount}</span> sucessos
              </div>
              <div className="text-sm">
                <span className="font-medium text-red-600">{errorCount}</span> erros
              </div>
              <div className="text-sm">
                <span className="font-medium">{totalTests}</span> testes totais
              </div>
            </div>
            <Button onClick={runTests} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? "Executando..." : "Executar Testes"}
            </Button>
          </div>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && <div className="text-sm text-muted-foreground">{test.message}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && <span className="text-xs text-muted-foreground">{test.duration}ms</span>}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
