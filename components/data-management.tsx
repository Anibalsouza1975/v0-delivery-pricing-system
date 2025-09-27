"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePricing } from "@/components/pricing-context-supabase"
import { Download, Upload, Trash2, Database, AlertTriangle, CheckCircle } from "lucide-react"

export default function DataManagement() {
  const { exportData, importData, clearAllData } = usePricing()
  const [importText, setImportText] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleExport = () => {
    try {
      const data = exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `delivery-pricing-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setAlert({ type: "success", message: "Dados exportados com sucesso!" })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao exportar dados." })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleImport = () => {
    if (!importText.trim()) {
      setAlert({ type: "error", message: "Por favor, cole os dados para importar." })
      setTimeout(() => setAlert(null), 3000)
      return
    }

    console.log("[v0] Iniciando importação de dados...")

    const success = importData(importText)
    if (success) {
      setAlert({ type: "success", message: "Dados importados com sucesso!" })
      setImportText("")
      setIsImportDialogOpen(false)
      console.log("[v0] Dados importados com sucesso")
    } else {
      setAlert({ type: "error", message: "Erro ao importar dados. Verifique o formato." })
      console.log("[v0] Erro ao importar dados")
    }
    setTimeout(() => setAlert(null), 3000)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      console.log("[v0] Arquivo carregado, tamanho:", content.length, "caracteres")
      setImportText(content)
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    clearAllData()
    setAlert({ type: "success", message: "Todos os dados foram removidos." })
    setIsClearDialogOpen(false)
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert className={alert.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {alert.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={alert.type === "success" ? "text-green-800" : "text-red-800"}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Gerenciamento de Dados</h3>
        <p className="text-sm text-muted-foreground">Faça backup, restaure ou limpe os dados do sistema</p>
      </div>

      {/* Cards de ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exportar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Exportar Dados
            </CardTitle>
            <CardDescription>Faça backup de todos os seus dados em um arquivo JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Importar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Importar Dados
            </CardTitle>
            <CardDescription>Restaure seus dados a partir de um backup</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Importar Dados</DialogTitle>
                  <DialogDescription>
                    Cole o conteúdo do arquivo de backup ou selecione um arquivo para importar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file-import">Selecionar arquivo</Label>
                    <Input id="file-import" type="file" accept=".json" onChange={handleFileImport} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="import-text">Ou cole os dados aqui</Label>
                    <Textarea
                      id="import-text"
                      placeholder="Cole o conteúdo do arquivo JSON aqui..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows={6}
                      className="max-h-40 overflow-y-auto resize-none"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportText("")
                      setIsImportDialogOpen(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleImport}>Importar Dados</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Limpar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Limpar Dados
            </CardTitle>
            <CardDescription>Remove todos os dados do sistema (ação irreversível)</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Tudo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Limpeza</DialogTitle>
                  <DialogDescription>
                    Esta ação irá remover permanentemente todos os dados do sistema: custos fixos, custos variáveis,
                    insumos, produtos, bebidas e combos. Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleClearData}>
                    Sim, Limpar Tudo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Informações sobre persistência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sobre a Persistência de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Salvamento Automático</p>
              <p className="text-sm text-muted-foreground">
                Todos os dados são salvos automaticamente no navegador enquanto você trabalha.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Backup e Restauração</p>
              <p className="text-sm text-muted-foreground">
                Exporte seus dados para fazer backup e importe quando necessário.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium">Limitações do Navegador</p>
              <p className="text-sm text-muted-foreground">
                Os dados são armazenados localmente no seu navegador. Limpar dados do navegador ou usar modo privado
                pode resultar em perda de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
