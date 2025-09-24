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
import { useDatabasePricing } from "@/components/database-pricing-context"
import { Download, Upload, Trash2, Database, AlertTriangle, CheckCircle, TestTube } from "lucide-react"
import DatabaseTest from "@/components/database-test"

export default function DataManagement() {
  const { refreshData } = useDatabasePricing()
  const [importText, setImportText] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [showDatabaseTest, setShowDatabaseTest] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleExport = () => {
    try {
      const data = {
        message: "Exportação de dados do banco Supabase não implementada ainda",
        timestamp: new Date().toISOString(),
        note: "Os dados agora estão no banco de dados Supabase e podem ser acessados diretamente",
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `delivery-pricing-database-info-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setAlert({ type: "success", message: "Informações do banco exportadas!" })
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

    setAlert({
      type: "error",
      message: "Importação para banco Supabase não implementada ainda. Use a interface para adicionar dados.",
    })
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
    setAlert({
      type: "error",
      message: "Limpeza de dados do banco Supabase deve ser feita com cuidado. Use o painel do Supabase.",
    })
    setIsClearDialogOpen(false)
    setTimeout(() => setAlert(null), 3000)
  }

  const handleRefreshData = async () => {
    try {
      await refreshData()
      setAlert({ type: "success", message: "Dados atualizados do banco de dados!" })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao atualizar dados do banco." })
      setTimeout(() => setAlert(null), 3000)
    }
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
        <p className="text-sm text-muted-foreground">Gerencie dados do banco Supabase e teste a integração</p>
      </div>

      {/* Database Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            Teste de Integração
          </CardTitle>
          <CardDescription>Teste a conexão e operações com o banco de dados Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowDatabaseTest(!showDatabaseTest)} variant="outline" className="w-full">
            <TestTube className="h-4 w-4 mr-2" />
            {showDatabaseTest ? "Ocultar Testes" : "Mostrar Testes de Banco"}
          </Button>
        </CardContent>
      </Card>

      {showDatabaseTest && <DatabaseTest />}

      {/* Cards de ações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Atualizar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Atualizar Dados
            </CardTitle>
            <CardDescription>Recarregue os dados mais recentes do banco</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefreshData} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardContent>
        </Card>

        {/* Exportar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Exportar Info
            </CardTitle>
            <CardDescription>Baixe informações sobre o banco de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Baixar Info
            </Button>
          </CardContent>
        </Card>

        {/* Importar dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-600" />
              Importar Dados
            </CardTitle>
            <CardDescription>Funcionalidade em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Em Desenvolvimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Importar Dados</DialogTitle>
                  <DialogDescription>
                    Esta funcionalidade será implementada para migração de dados para o Supabase.
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
            <CardDescription>Use o painel do Supabase para gerenciar dados</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Via Supabase
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Limpeza de Dados</DialogTitle>
                  <DialogDescription>
                    Para limpar dados do banco Supabase, acesse o painel administrativo do Supabase diretamente. Isso
                    garante maior segurança na manipulação dos dados.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                    Entendi
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
            Sobre o Banco de Dados Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Persistência Real</p>
              <p className="text-sm text-muted-foreground">
                Todos os dados agora são salvos em um banco de dados PostgreSQL real via Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Sincronização Automática</p>
              <p className="text-sm text-muted-foreground">
                Os dados são sincronizados automaticamente entre diferentes dispositivos e sessões.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Backup Automático</p>
              <p className="text-sm text-muted-foreground">
                O Supabase faz backup automático dos seus dados, garantindo maior segurança.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Escalabilidade</p>
              <p className="text-sm text-muted-foreground">
                O sistema agora pode crescer com seu negócio, suportando muito mais dados e usuários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
