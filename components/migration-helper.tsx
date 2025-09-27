"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { usePricing } from "@/components/pricing-context-supabase"
import { Database, Upload, CheckCircle, AlertCircle } from "lucide-react"

export default function MigrationHelper() {
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const {
    addCustoFixo,
    addCustoVariavel,
    addIngredienteBase,
    addInsumo,
    addProduto,
    addBebida,
    addCombo,
    addVenda,
    registrarCompra,
  } = usePricing()

  const migrateFromLocalStorage = async () => {
    try {
      setMigrationStatus("running")
      setProgress(0)
      setErrorMessage("")

      // Verificar se há dados no localStorage
      const localStorageKeys = [
        "delivery-pricing-custos-fixos",
        "delivery-pricing-custos-variaveis",
        "delivery-pricing-ingredientes-base",
        "delivery-pricing-insumos",
        "delivery-pricing-produtos",
        "delivery-pricing-bebidas",
        "delivery-pricing-combos",
        "delivery-pricing-vendas",
        "delivery-pricing-estoque-insumos",
      ]

      const totalSteps = localStorageKeys.length
      let currentStepIndex = 0

      // Migrar custos fixos
      setCurrentStep("Migrando custos fixos...")
      const custosFixos = JSON.parse(localStorage.getItem("delivery-pricing-custos-fixos") || "[]")
      for (const custo of custosFixos) {
        await addCustoFixo({
          nome: custo.nome,
          valor: custo.valor,
          categoria: custo.categoria,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar custos variáveis
      setCurrentStep("Migrando custos variáveis...")
      const custosVariaveis = JSON.parse(localStorage.getItem("delivery-pricing-custos-variaveis") || "[]")
      for (const custo of custosVariaveis) {
        await addCustoVariavel({
          nome: custo.nome,
          percentual: custo.percentual,
          categoria: custo.categoria,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar ingredientes base
      setCurrentStep("Migrando ingredientes base...")
      const ingredientesBase = JSON.parse(localStorage.getItem("delivery-pricing-ingredientes-base") || "[]")
      for (const ingrediente of ingredientesBase) {
        await addIngredienteBase({
          nome: ingrediente.nome,
          categoria: ingrediente.categoria,
          unidade: ingrediente.unidade,
          preco_unitario: ingrediente.precoUnitario,
          fornecedor: ingrediente.fornecedor,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar insumos
      setCurrentStep("Migrando insumos...")
      const insumos = JSON.parse(localStorage.getItem("delivery-pricing-insumos") || "[]")
      for (const insumo of insumos) {
        await addInsumo({
          nome: insumo.nome,
          categoria: insumo.categoria,
          unidade: insumo.unidade,
          preco_unitario: insumo.precoUnitario || insumo.precoCompra,
          ingrediente_base_id: insumo.ingredienteBaseId,
          rendimento: insumo.rendimento || 1,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar produtos
      setCurrentStep("Migrando produtos...")
      const produtos = JSON.parse(localStorage.getItem("delivery-pricing-produtos") || "[]")
      for (const produto of produtos) {
        await addProduto({
          nome: produto.nome,
          categoria: produto.categoria,
          descricao: produto.descricao,
          foto: produto.foto,
          cmv: produto.cmv,
          precoVenda: produto.precoVenda,
          margemLucro: produto.margemLucro,
          insumos: produto.insumos || [],
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar bebidas
      setCurrentStep("Migrando bebidas...")
      const bebidas = JSON.parse(localStorage.getItem("delivery-pricing-bebidas") || "[]")
      for (const bebida of bebidas) {
        await addBebida({
          nome: bebida.nome,
          custoUnitario: bebida.custoUnitario,
          markup: bebida.markup,
          precoVenda: bebida.precoVenda,
          foto: bebida.foto,
          descricao: bebida.descricao,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar combos
      setCurrentStep("Migrando combos...")
      const combos = JSON.parse(localStorage.getItem("delivery-pricing-combos") || "[]")
      for (const combo of combos) {
        await addCombo({
          nome: combo.nome,
          descricao: combo.descricao,
          desconto: combo.desconto,
          precoFinal: combo.precoFinal,
          produtos: combo.produtos || [],
          bebidas: combo.bebidas || [],
          foto: combo.foto,
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar vendas
      setCurrentStep("Migrando vendas...")
      const vendas = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")
      for (const venda of vendas) {
        await addVenda({
          cliente_nome: venda.cliente,
          total: venda.total,
          status: venda.status,
          observacoes: venda.observacoes,
          data_venda: venda.data,
          taxa_entrega: 0,
          forma_pagamento: "dinheiro",
        })
      }
      setProgress((++currentStepIndex / totalSteps) * 100)

      // Migrar estoque
      setCurrentStep("Migrando estoque...")
      const estoqueInsumos = JSON.parse(localStorage.getItem("delivery-pricing-estoque-insumos") || "[]")
      for (const estoque of estoqueInsumos) {
        if (estoque.quantidadeAtual > 0) {
          const precoUnitario = estoque.precoCompra / estoque.quantidadeComprada
          await registrarCompra(estoque.ingredienteBaseId, estoque.quantidadeAtual, precoUnitario)
        }
      }
      setProgress(100)

      setCurrentStep("Migração concluída com sucesso!")
      setMigrationStatus("completed")
    } catch (error) {
      console.error("[v0] Erro na migração:", error)
      setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido na migração")
      setMigrationStatus("error")
    }
  }

  const clearLocalStorage = () => {
    const keys = [
      "delivery-pricing-custos-fixos",
      "delivery-pricing-custos-variaveis",
      "delivery-pricing-ingredientes-base",
      "delivery-pricing-insumos",
      "delivery-pricing-produtos",
      "delivery-pricing-bebidas",
      "delivery-pricing-combos",
      "delivery-pricing-vendas",
      "delivery-pricing-estoque-insumos",
      "delivery-pricing-movimentacoes-estoque",
      "adicionais",
      "personalizacoes",
    ]

    keys.forEach((key) => localStorage.removeItem(key))
    alert("Dados do localStorage limpos com sucesso!")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migração de Dados
          </CardTitle>
          <CardDescription>
            Migre seus dados do localStorage para o banco de dados Supabase para melhor performance e segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus === "idle" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta operação irá transferir todos os seus dados do localStorage para o banco de dados. Certifique-se
                  de que o banco está configurado corretamente.
                </AlertDescription>
              </Alert>
              <Button onClick={migrateFromLocalStorage} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Migração
              </Button>
            </div>
          )}

          {migrationStatus === "running" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          )}

          {migrationStatus === "completed" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Migração concluída com sucesso! Seus dados agora estão no Supabase.</AlertDescription>
              </Alert>
              <Button onClick={clearLocalStorage} variant="outline" className="w-full bg-transparent">
                Limpar localStorage (Opcional)
              </Button>
            </div>
          )}

          {migrationStatus === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Erro na migração: {errorMessage}</AlertDescription>
              </Alert>
              <Button onClick={() => setMigrationStatus("idle")} variant="outline" className="w-full">
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
