"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Package,
  Phone,
  Search,
  Truck,
  User,
  XCircle,
  RefreshCw,
  Send,
  Bot,
  BotOff,
  X,
} from "lucide-react"

interface Reclamacao {
  id: string
  numero_ticket: string
  numero_pedido?: string
  cliente_nome: string
  cliente_telefone: string
  categoria: string
  descricao: string
  status: "aberto" | "em_andamento" | "resolvido" | "fechado"
  resposta?: string
  data_criacao: string
  data_atualizacao: string
  data_resolucao?: string
}

interface ChatWindow {
  id: string
  reclamacao: Reclamacao
  mensagens: any[]
  novaMensagem: string
  enviandoMensagem: boolean
  botAtivo: boolean
}

const categorias = [
  { value: "problema_pedido", label: "Problema com o pedido", icon: Package },
  { value: "problema_entrega", label: "Problema com a entrega", icon: Truck },
  { value: "qualidade_produto", label: "Qualidade do produto", icon: AlertCircle },
  { value: "problema_pagamento", label: "Problema com pagamento", icon: AlertCircle },
  { value: "outro", label: "Outro assunto", icon: MessageSquare },
]

const statusConfig = {
  aberto: { label: "Aberto", color: "bg-red-600 text-white", icon: AlertCircle },
  em_andamento: { label: "Em Andamento", color: "bg-blue-600 text-white", icon: Clock },
  resolvido: { label: "Resolvido", color: "bg-green-600 text-white", icon: CheckCircle },
  fechado: { label: "Fechado", color: "bg-gray-600 text-white", icon: XCircle },
}

export default function GerenciamentoReclamacoesModule() {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([])
  const [reclamacaoSelecionada, setReclamacaoSelecionada] = useState<Reclamacao | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos")
  const [busca, setBusca] = useState("")
  const [resposta, setResposta] = useState("")
  const [novoStatus, setNovoStatus] = useState<string>("")

  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([])
  const chatEndRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const carregarReclamacoes = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== "todos") params.append("status", filtroStatus)
      if (filtroCategoria !== "todos") params.append("categoria", filtroCategoria)
      if (busca) params.append("busca", busca)

      const response = await fetch(`/api/reclamacoes?${params.toString()}`)
      if (!response.ok) throw new Error("Erro ao carregar reclamações")

      const data = await response.json()
      setReclamacoes(data)
    } catch (error) {
      console.error("Erro ao carregar reclamações:", error)
      alert("Erro ao carregar reclamações. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarReclamacao = async () => {
    if (!reclamacaoSelecionada) return

    try {
      const response = await fetch(`/api/reclamacoes/${reclamacaoSelecionada.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: novoStatus || reclamacaoSelecionada.status,
          resposta: resposta || reclamacaoSelecionada.resposta,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar reclamação")

      alert("Reclamação atualizada com sucesso!")
      setReclamacaoSelecionada(null)
      setResposta("")
      setNovoStatus("")
      carregarReclamacoes()
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      alert("Erro ao atualizar reclamação. Tente novamente.")
    }
  }

  const verificarStatusBot = async (telefone: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/whatsapp/bot-control?telefone=${telefone}`)
      if (!response.ok) return true // Default: bot ativo

      const data = await response.json()
      return data.bot_ativo
    } catch (error) {
      console.error("Erro ao verificar status do bot:", error)
      return true
    }
  }

  const alternarBot = async (telefone: string, ativar: boolean) => {
    try {
      const response = await fetch("/api/whatsapp/bot-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          bot_ativo: ativar,
          motivo: ativar ? null : "Atendimento manual via chat",
          desativado_por: "Atendente",
        }),
      })

      if (!response.ok) throw new Error("Erro ao alterar status do bot")

      // Update chat window bot status
      setChatWindows((prev) =>
        prev.map((chat) => (chat.reclamacao.cliente_telefone === telefone ? { ...chat, botAtivo: ativar } : chat)),
      )

      console.log(`[v0] Bot ${ativar ? "ativado" : "desativado"} para ${telefone}`)
    } catch (error) {
      console.error("Erro ao alterar status do bot:", error)
      alert("Erro ao alterar status do bot. Tente novamente.")
    }
  }

  const carregarMensagensChat = async (chatId: string, telefone: string) => {
    try {
      const response = await fetch(`/api/whatsapp/conversas?telefone=${telefone}`)
      if (!response.ok) throw new Error("Erro ao carregar mensagens")

      const data = await response.json()
      const mensagens =
        data.success && data.conversas && data.conversas.length > 0 ? data.conversas[0].mensagens || [] : []

      setChatWindows((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, mensagens } : chat)))
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  const enviarMensagem = async (chatId: string) => {
    const chat = chatWindows.find((c) => c.id === chatId)
    if (!chat || !chat.novaMensagem.trim()) return

    setChatWindows((prev) => prev.map((c) => (c.id === chatId ? { ...c, enviandoMensagem: true } : c)))

    try {
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: chat.reclamacao.cliente_telefone,
          message: chat.novaMensagem,
          tipo: "atendente",
        }),
      })

      if (!response.ok) throw new Error("Erro ao enviar mensagem")

      // Clear message and reload
      setChatWindows((prev) => prev.map((c) => (c.id === chatId ? { ...c, novaMensagem: "" } : c)))

      await carregarMensagensChat(chatId, chat.reclamacao.cliente_telefone)

      // Scroll to bottom
      setTimeout(() => {
        chatEndRefs.current[chatId]?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      alert("Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setChatWindows((prev) => prev.map((c) => (c.id === chatId ? { ...c, enviandoMensagem: false } : c)))
    }
  }

  const abrirChat = async (reclamacao: Reclamacao) => {
    // Check if chat is already open
    const existingChat = chatWindows.find((c) => c.reclamacao.id === reclamacao.id)
    if (existingChat) {
      alert("Este chat já está aberto!")
      return
    }

    // Check bot status
    const botAtivo = await verificarStatusBot(reclamacao.cliente_telefone)

    // Create new chat window
    const newChat: ChatWindow = {
      id: reclamacao.id,
      reclamacao,
      mensagens: [],
      novaMensagem: "",
      enviandoMensagem: false,
      botAtivo,
    }

    setChatWindows((prev) => [...prev, newChat])

    // Disable bot automatically when opening chat
    if (botAtivo) {
      await alternarBot(reclamacao.cliente_telefone, false)
    }

    // Load messages
    await carregarMensagensChat(reclamacao.id, reclamacao.cliente_telefone)
  }

  const fecharChat = async (chatId: string) => {
    const chat = chatWindows.find((c) => c.id === chatId)
    if (!chat) return

    // Reactivate bot when closing chat
    if (!chat.botAtivo) {
      await alternarBot(chat.reclamacao.cliente_telefone, true)
    }

    setChatWindows((prev) => prev.filter((c) => c.id !== chatId))
  }

  useEffect(() => {
    if (chatWindows.length === 0) return

    const interval = setInterval(() => {
      chatWindows.forEach((chat) => {
        carregarMensagensChat(chat.id, chat.reclamacao.cliente_telefone)
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [chatWindows])

  useEffect(() => {
    chatWindows.forEach((chat) => {
      if (chat.mensagens.length > 0) {
        chatEndRefs.current[chat.id]?.scrollIntoView({ behavior: "smooth" })
      }
    })
  }, [chatWindows])

  useEffect(() => {
    carregarReclamacoes()
  }, [filtroStatus, filtroCategoria])

  const reclamacoesAbertas = reclamacoes.filter((r) => r.status === "aberto").length
  const reclamacoesEmAndamento = reclamacoes.filter((r) => r.status === "em_andamento").length
  const reclamacoesResolvidas = reclamacoes.filter((r) => r.status === "resolvido").length

  const getTempoDecorrido = (dataHora: string) => {
    const agora = new Date().getTime()
    const ticketTime = new Date(dataHora).getTime()
    const minutosPassados = Math.floor((agora - ticketTime) / (1000 * 60))

    if (minutosPassados < 60) return `${minutosPassados}min`
    const horasPassadas = Math.floor(minutosPassados / 60)
    if (horasPassadas < 24) return `${horasPassadas}h`
    const diasPassados = Math.floor(horasPassadas / 24)
    return `${diasPassados}d`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reclamacoesAbertas}</div>
            <p className="text-xs text-red-100 mt-1">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reclamacoesEmAndamento}</div>
            <p className="text-xs text-blue-100 mt-1">Sendo atendidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolvidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reclamacoesResolvidas}</div>
            <p className="text-xs text-green-100 mt-1">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reclamacoes.length}</div>
            <p className="text-xs text-purple-100 mt-1">Todos os tickets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Reclamações</CardTitle>
              <CardDescription>Gerencie tickets de suporte e reclamações dos clientes</CardDescription>
            </div>
            <Button onClick={carregarReclamacoes} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Buscar</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Número do ticket, pedido ou cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && carregarReclamacoes()}
                />
                <Button onClick={carregarReclamacoes} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {reclamacoes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma reclamação encontrada</h3>
                <p className="text-muted-foreground">
                  {filtroStatus !== "todos" || filtroCategoria !== "todos"
                    ? "Tente ajustar os filtros"
                    : "Não há reclamações no momento"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          reclamacoes.map((reclamacao) => {
            const categoria = categorias.find((c) => c.value === reclamacao.categoria)
            const IconeCategoria = categoria?.icon || MessageSquare

            return (
              <Card
                key={reclamacao.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setReclamacaoSelecionada(reclamacao)
                  setResposta(reclamacao.resposta || "")
                  setNovoStatus(reclamacao.status)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-slate-100 rounded-lg">
                        <IconeCategoria className="h-5 w-5 text-slate-600" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">#{reclamacao.numero_ticket}</span>
                          <Badge className={statusConfig[reclamacao.status].color}>
                            {statusConfig[reclamacao.status].label}
                          </Badge>
                          {reclamacao.numero_pedido && (
                            <Badge variant="outline" className="text-xs">
                              Pedido #{reclamacao.numero_pedido}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {reclamacao.cliente_nome}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reclamacao.cliente_telefone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTempoDecorrido(reclamacao.data_criacao)} atrás
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">{categoria?.label}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{reclamacao.descricao}</p>
                        </div>

                        {reclamacao.resposta && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                            <p className="text-xs font-medium text-green-700">Resposta:</p>
                            <p className="text-sm text-green-600 line-clamp-2">{reclamacao.resposta}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(reclamacao.data_criacao).toLocaleDateString("pt-BR")}
                      <br />
                      {new Date(reclamacao.data_criacao).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog
        open={!!reclamacaoSelecionada}
        onOpenChange={() => {
          setReclamacaoSelecionada(null)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ticket #{reclamacaoSelecionada?.numero_ticket}
              <Badge className={statusConfig[reclamacaoSelecionada?.status || "aberto"].color}>
                {statusConfig[reclamacaoSelecionada?.status || "aberto"].label}
              </Badge>
            </DialogTitle>
            <DialogDescription>Detalhes e atendimento da reclamação</DialogDescription>
          </DialogHeader>

          {reclamacaoSelecionada && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{reclamacaoSelecionada.cliente_nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{reclamacaoSelecionada.cliente_telefone}</p>
                </div>
                {reclamacaoSelecionada.numero_pedido && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Número do Pedido</Label>
                    <p className="font-medium">#{reclamacaoSelecionada.numero_pedido}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <p className="font-medium">
                    {categorias.find((c) => c.value === reclamacaoSelecionada.categoria)?.label}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Descrição do Problema</Label>
                <div className="bg-slate-50 border rounded-lg p-3 mt-1">
                  <p className="text-sm">{reclamacaoSelecionada.descricao}</p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Resposta</Label>
                <Textarea
                  placeholder="Digite sua resposta ao cliente..."
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Criado em: {new Date(reclamacaoSelecionada.data_criacao).toLocaleString("pt-BR")}</p>
                <p>Atualizado em: {new Date(reclamacaoSelecionada.data_atualizacao).toLocaleString("pt-BR")}</p>
                {reclamacaoSelecionada.data_resolucao && (
                  <p>Resolvido em: {new Date(reclamacaoSelecionada.data_resolucao).toLocaleString("pt-BR")}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReclamacaoSelecionada(null)
              }}
            >
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (reclamacaoSelecionada) {
                  abrirChat(reclamacaoSelecionada)
                  setReclamacaoSelecionada(null)
                }
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir Chat
            </Button>
            <Button onClick={atualizarReclamacao}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 flex gap-4 z-50">
        {chatWindows.map((chat) => (
          <Card key={chat.id} className="w-96 h-[600px] flex flex-col shadow-2xl">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {chat.reclamacao.cliente_nome}
                  </CardTitle>
                  <CardDescription className="text-xs">Ticket #{chat.reclamacao.numero_ticket}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={chat.botAtivo ? "default" : "outline"}
                    onClick={() => alternarBot(chat.reclamacao.cliente_telefone, !chat.botAtivo)}
                    title={chat.botAtivo ? "Bot Ativo - Clique para desativar" : "Bot Desativado - Clique para ativar"}
                  >
                    {chat.botAtivo ? <Bot className="h-4 w-4" /> : <BotOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => fecharChat(chat.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
              {chat.mensagens.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                </div>
              ) : (
                chat.mensagens.map((msg) => {
                  const isCliente = msg.tipo === "cliente"
                  const isBot = msg.tipo === "bot"
                  const isAtendente = msg.tipo === "atendente"

                  return (
                    <div key={msg.id} className={`flex ${isCliente ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isCliente
                            ? "bg-white border border-slate-200"
                            : isBot
                              ? "bg-blue-100 border border-blue-200"
                              : "bg-green-100 border border-green-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isBot && <Bot className="h-3 w-3 text-blue-600" />}
                          {isAtendente && <User className="h-3 w-3 text-green-600" />}
                          {isCliente && <User className="h-3 w-3 text-slate-600" />}
                          <span className="text-xs font-semibold">
                            {isCliente ? "Cliente" : isBot ? "Bot" : "Atendente"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={(el) => (chatEndRefs.current[chat.id] = el)} />
            </CardContent>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={chat.novaMensagem}
                  onChange={(e) =>
                    setChatWindows((prev) =>
                      prev.map((c) => (c.id === chat.id ? { ...c, novaMensagem: e.target.value } : c)),
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      enviarMensagem(chat.id)
                    }
                  }}
                  disabled={chat.enviandoMensagem}
                  className="flex-1"
                />
                <Button
                  onClick={() => enviarMensagem(chat.id)}
                  disabled={chat.enviandoMensagem || !chat.novaMensagem.trim()}
                  size="icon"
                >
                  {chat.enviandoMensagem ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
