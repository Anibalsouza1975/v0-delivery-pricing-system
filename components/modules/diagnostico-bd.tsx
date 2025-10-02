"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Table,
  Archive,
  Trash2,
  Search,
  MessageSquare,
  Calendar,
  Settings,
  BarChart3,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TableInfo {
  name: string
  count: number
  status: "success" | "error" | "loading"
  sampleData?: any[]
  error?: string
}

interface BackupInfo {
  data: string
  quantidade: number
  ids: string[]
}

interface ConversaBackup {
  id: string
  cliente_nome: string
  cliente_telefone: string
  status: string
  data_backup: string
  whatsapp_mensagens_backup: { count: number }[]
}

interface BackupConfig {
  backup_automatico: boolean
  intervalo_dias: number
  manter_dias: number
  ultimo_backup?: string
}

const supabase = createClient()

export default function DiagnosticoBDModule() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null)

  const [abaBackup, setAbaBackup] = useState("visao-geral")
  const [conversasBackup, setConversasBackup] = useState<ConversaBackup[]>([])
  const [buscaConversa, setBuscaConversa] = useState("")
  const [totalConversas, setTotalConversas] = useState(0)
  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaBackup | null>(null)
  const [mensagensConversa, setMensagensConversa] = useState<any[]>([])
  const [dialogMensagensAberto, setDialogMensagensAberto] = useState(false)
  const [configTemp, setConfigTemp] = useState<BackupConfig>({
    backup_automatico: false,
    intervalo_dias: 7,
    manter_dias: 30,
  })
  const [diasArquivamento, setDiasArquivamento] = useState(30)
  const [isArquivando, setIsArquivando] = useState(false)

  const { toast } = useToast()

  const testConnection = async () => {
    setIsRefreshing(true)
    setConnectionStatus("loading")

    try {
      const { data, error } = await supabase.from("produtos").select("count", { count: "exact", head: true })

      if (error) throw error

      setConnectionStatus("connected")
      await loadTableData()
      await loadBackups()
      await loadBackupConfig()
    } catch (error) {
      console.error("Erro na conexão:", error)
      setConnectionStatus("error")
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadBackups = async () => {
    try {
      const response = await fetch("/api/whatsapp/backup")
      const data = await response.json()

      if (data.success) {
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error("Erro ao carregar backups:", error)
    }
  }

  const loadBackupConfig = async () => {
    try {
      const response = await fetch("/api/whatsapp/backup/config")
      const data = await response.json()

      if (data.success && data.config) {
        setBackupConfig(data.config)
        setConfigTemp(data.config)
      }
    } catch (error) {
      console.error("Erro ao carregar config backup:", error)
    }
  }

  const loadConversasBackup = async () => {
    try {
      const params = new URLSearchParams({
        busca: buscaConversa,
        limite: "50",
        offset: "0",
      })

      const response = await fetch(`/api/whatsapp/backup/conversas?${params}`)
      const data = await response.json()

      if (data.success) {
        setConversasBackup(data.conversas || [])
        setTotalConversas(data.total || 0)
      }
    } catch (error) {
      console.error("Erro ao carregar conversas backup:", error)
    }
  }

  const visualizarMensagens = async (conversa: ConversaBackup) => {
    try {
      setConversaSelecionada(conversa)
      const response = await fetch(`/api/whatsapp/backup/mensagens/${conversa.id}`)
      const data = await response.json()

      if (data.success) {
        setMensagensConversa(data.mensagens || [])
        setDialogMensagensAberto(true)
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens desta conversa",
        variant: "destructive",
      })
    }
  }

  const salvarConfiguracao = async () => {
    try {
      const response = await fetch("/api/whatsapp/backup/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configTemp),
      })

      const data = await response.json()

      if (data.success) {
        setBackupConfig(configTemp)
        toast({
          title: "Configuração salva!",
          description: "As configurações de backup foram atualizadas com sucesso.",
        })
      } else {
        toast({
          title: "Erro ao salvar",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar config:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      })
    }
  }

  const criarBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await fetch("/api/whatsapp/backup", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Backup criado com sucesso!",
          description: `${data.conversas} conversas e ${data.mensagens} mensagens foram salvas.`,
        })
        await loadBackups()
        await loadBackupConfig()
        await loadConversasBackup()
      } else {
        toast({
          title: "Erro ao criar backup",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro ao criar backup",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const limparBackupsAntigos = async () => {
    try {
      const dias = configTemp.manter_dias || 30
      const response = await fetch(`/api/whatsapp/backup?dias=${dias}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Backups antigos removidos",
          description: data.message,
        })
        await loadBackups()
        await loadConversasBackup()
      }
    } catch (error) {
      console.error("Erro ao limpar backups:", error)
      toast({
        title: "Erro ao limpar backups",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    }
  }

  const arquivarConversasAntigas = async () => {
    setIsArquivando(true)
    try {
      const response = await fetch("/api/whatsapp/backup/limpar-e-arquivar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias: diasArquivamento }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Conversas arquivadas com sucesso!",
          description: data.message,
        })
        await loadBackups()
        await loadBackupConfig()
        await loadConversasBackup()
        await testConnection() // Atualizar contadores das tabelas
      } else {
        toast({
          title: "Erro ao arquivar conversas",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao arquivar conversas:", error)
      toast({
        title: "Erro ao arquivar conversas",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    } finally {
      setIsArquivando(false)
    }
  }

  const loadTableData = async () => {
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
      "whatsapp_conversas",
      "whatsapp_mensagens",
      "whatsapp_conversas_backup",
      "whatsapp_mensagens_backup",
    ]

    const tablePromises = tableNames.map(async (tableName) => {
      try {
        const { count, error: countError } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (countError) throw countError

        const { data: sampleData, error: dataError } = await supabase.from(tableName).select("*").limit(3)

        if (dataError) throw dataError

        return {
          name: tableName,
          count: count || 0,
          status: "success" as const,
          sampleData: sampleData || [],
        }
      } catch (error) {
        console.error(`Erro ao carregar tabela ${tableName}:`, error)
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
    testConnection()
  }, [])

  useEffect(() => {
    if (abaBackup === "conversas") {
      loadConversasBackup()
    }
  }, [abaBackup, buscaConversa])

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
    const keys = Object.keys(firstItem).slice(0, 4)

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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6" />
            <div>
              <CardTitle>Backup de Conversas WhatsApp</CardTitle>
              <CardDescription>Gerencie backups das conversas e mensagens do WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={abaBackup} onValueChange={setAbaBackup} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visao-geral">
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="conversas">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversas
              </TabsTrigger>
              <TabsTrigger value="configuracoes">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Aba Visão Geral */}
            <TabsContent value="visao-geral" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Último Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {backupConfig?.ultimo_backup
                        ? new Date(backupConfig.ultimo_backup).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {backupConfig?.ultimo_backup
                        ? new Date(backupConfig.ultimo_backup).toLocaleTimeString("pt-BR")
                        : "Nenhum backup realizado"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Archive className="h-4 w-4 text-green-500" />
                      Total de Backups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{backups.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {backups.reduce((acc, b) => acc + b.quantidade, 0)} conversas salvas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Backup Automático
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{backupConfig?.backup_automatico ? "Ativo" : "Inativo"}</p>
                    <p className="text-sm text-muted-foreground">
                      {backupConfig?.backup_automatico
                        ? `A cada ${backupConfig.intervalo_dias} dias`
                        : "Configure nas opções"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={criarBackup} disabled={isBackingUp} className="flex-1">
                  {isBackingUp ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  Criar Backup Agora
                </Button>
                <Button onClick={limparBackupsAntigos} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Antigos
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-3">Histórico de Backups</h4>
                {backups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum backup encontrado</p>
                    <p className="text-sm">Clique em "Criar Backup Agora" para começar</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {backups.map((backup, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{new Date(backup.data).toLocaleDateString("pt-BR")}</p>
                              <p className="text-sm text-muted-foreground">{backup.quantidade} conversas</p>
                            </div>
                          </div>
                          <Badge variant="outline">{new Date(backup.data).toLocaleTimeString("pt-BR")}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Archive className="h-5 w-5 text-orange-500" />
                    Arquivar Conversas Antigas
                  </CardTitle>
                  <CardDescription>
                    Move conversas antigas para backup e remove das tabelas principais para otimizar o banco
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dias-arquivamento">Arquivar conversas com mais de (dias)</Label>
                    <Input
                      id="dias-arquivamento"
                      type="number"
                      min="7"
                      max="365"
                      value={diasArquivamento}
                      onChange={(e) => setDiasArquivamento(Number.parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Conversas que não foram atualizadas há mais de {diasArquivamento} dias serão movidas para backup e
                      removidas das tabelas principais
                    </p>
                  </div>
                  <Button
                    onClick={arquivarConversasAntigas}
                    disabled={isArquivando}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    {isArquivando ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Archive className="h-4 w-4 mr-2" />
                    )}
                    Arquivar e Limpar Agora
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Conversas */}
            <TabsContent value="conversas" className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={buscaConversa}
                    onChange={(e) => setBuscaConversa(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={loadConversasBackup} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {conversasBackup.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-sm">Faça um backup para visualizar as conversas aqui</p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    {totalConversas} {totalConversas === 1 ? "conversa encontrada" : "conversas encontradas"}
                  </div>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {conversasBackup.map((conversa) => (
                        <Card key={conversa.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{conversa.cliente_nome}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {conversa.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{conversa.cliente_telefone}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {conversa.whatsapp_mensagens_backup?.[0]?.count || 0} mensagens
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(conversa.data_backup).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => visualizarMensagens(conversa)}>
                                Ver Mensagens
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="configuracoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Backup Automático</CardTitle>
                  <CardDescription>Configure o backup automático das conversas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backup-auto">Ativar backup automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Fazer backup automaticamente em intervalos regulares
                      </p>
                    </div>
                    <Switch
                      id="backup-auto"
                      checked={configTemp.backup_automatico}
                      onCheckedChange={(checked) => setConfigTemp({ ...configTemp, backup_automatico: checked })}
                    />
                  </div>

                  {configTemp.backup_automatico && (
                    <div className="space-y-2">
                      <Label htmlFor="intervalo">Intervalo entre backups (dias)</Label>
                      <Input
                        id="intervalo"
                        type="number"
                        min="1"
                        max="30"
                        value={configTemp.intervalo_dias}
                        onChange={(e) =>
                          setConfigTemp({ ...configTemp, intervalo_dias: Number.parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Backup será realizado automaticamente a cada {configTemp.intervalo_dias} dias
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Limpeza Automática</CardTitle>
                  <CardDescription>Configure a retenção de backups antigos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manter">Manter backups por (dias)</Label>
                    <Input
                      id="manter"
                      type="number"
                      min="7"
                      max="365"
                      value={configTemp.manter_dias}
                      onChange={(e) => setConfigTemp({ ...configTemp, manter_dias: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Backups com mais de {configTemp.manter_dias} dias serão removidos automaticamente
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={salvarConfiguracao} className="w-full">
                Salvar Configurações
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para visualizar mensagens */}
      <Dialog open={dialogMensagensAberto} onOpenChange={setDialogMensagensAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Mensagens - {conversaSelecionada?.cliente_nome}</DialogTitle>
            <DialogDescription>{conversaSelecionada?.cliente_telefone}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {mensagensConversa.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.tipo === "recebida" ? "bg-muted mr-12" : "bg-primary text-primary-foreground ml-12"
                  }`}
                >
                  <p className="text-sm">{msg.conteudo}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at_original).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
