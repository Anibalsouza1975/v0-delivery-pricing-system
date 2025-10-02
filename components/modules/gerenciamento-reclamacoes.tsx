"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  MessageCircle,
} from "lucide-react"
import { ChatManualAdmin } from "@/components/chat-manual-admin"

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
  const [chatAberto, setChatAberto] = useState<{ telefone: string; ticket: string } | null>(null)

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

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(reclamacao.data_criacao).toLocaleDateString("pt-BR")}
                        <br />
                        {new Date(reclamacao.data_criacao).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setChatAberto({
                            telefone: reclamacao.cliente_telefone,
                            ticket: reclamacao.numero_ticket,
                          })
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Abrir Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {chatAberto && (
        <ChatManualAdmin
          telefone={chatAberto.telefone}
          numeroTicket={chatAberto.ticket}
          onClose={() => setChatAberto(null)}
        />
      )}
    </div>
  )
}
