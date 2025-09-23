"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle,
  Settings,
  Bot,
  Phone,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  MessageSquare,
  Activity,
} from "lucide-react"

interface Conversa {
  id: string
  cliente: string
  telefone: string
  status: "ativa" | "finalizada" | "aguardando"
  ultimaMensagem: string
  timestamp: Date
  mensagens: Mensagem[]
}

interface Mensagem {
  id: string
  tipo: "cliente" | "bot" | "atendente"
  conteudo: string
  timestamp: Date
}

interface ConfiguracaoBot {
  ativo: boolean
  nomeBot: string
  mensagemBoasVindas: string
  horarioFuncionamento: {
    inicio: string
    fim: string
  }
  respostasAutomaticas: {
    cardapio: boolean
    precos: boolean
    horarios: boolean
    localizacao: boolean
    pedidos: boolean
  }
}

export default function AutoAtendimentoWhatsAppModule() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [configuracao, setConfiguracao] = useState<ConfiguracaoBot>({
    ativo: false,
    nomeBot: "Cartago Bot",
    mensagemBoasVindas:
      "Olá! 👋 Bem-vindo ao Cartago Burger Grill! Sou seu assistente virtual e estou aqui para ajudar com pedidos, cardápio e informações. Como posso te ajudar hoje?",
    horarioFuncionamento: {
      inicio: "08:00",
      fim: "23:00",
    },
    respostasAutomaticas: {
      cardapio: true,
      precos: true,
      horarios: true,
      localizacao: true,
      pedidos: true,
    },
  })

  const [conversas, setConversas] = useState<Conversa[]>([
    {
      id: "1",
      cliente: "João Silva",
      telefone: "+5511999887766",
      status: "ativa",
      ultimaMensagem: "Quero fazer um pedido",
      timestamp: new Date(),
      mensagens: [
        {
          id: "1",
          tipo: "cliente",
          conteudo: "Oi, quero fazer um pedido",
          timestamp: new Date(),
        },
        {
          id: "2",
          tipo: "bot",
          conteudo:
            "Olá João! Claro, vou te ajudar com o pedido. Você gostaria de ver nosso cardápio completo ou já sabe o que deseja?",
          timestamp: new Date(),
        },
      ],
    },
    {
      id: "2",
      cliente: "Maria Santos",
      telefone: "+5511888776655",
      status: "aguardando",
      ultimaMensagem: "Qual o horário de funcionamento?",
      timestamp: new Date(Date.now() - 300000),
      mensagens: [],
    },
  ])

  const [webhookUrl, setWebhookUrl] = useState("")
  const [tokenWhatsApp, setTokenWhatsApp] = useState("")
  const [statusConexao, setStatusConexao] = useState<"conectado" | "desconectado" | "configurando">("desconectado")
  const [qrCode, setQrCode] = useState<string>("")
  const [conectandoWhatsApp, setConectandoWhatsApp] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")

  // Estatísticas do dashboard
  const totalConversas = conversas.length
  const conversasAtivas = conversas.filter((c) => c.status === "ativa").length
  const conversasHoje = conversas.filter((c) => {
    const hoje = new Date().toDateString()
    return c.timestamp.toDateString() === hoje
  }).length

  const handleSalvarConfiguracao = () => {
    // Aqui salvaria a configuração no backend
    console.log("[v0] Salvando configuração do bot:", configuracao)
    alert("Configuração salva com sucesso!")
  }

  const handleTestarConexao = () => {
    setStatusConexao("configurando")
    // Simular teste de conexão
    setTimeout(() => {
      if (tokenWhatsApp && webhookUrl) {
        setStatusConexao("conectado")
        alert("Conexão testada com sucesso!")
      } else {
        setStatusConexao("desconectado")
        alert("Erro: Preencha todos os campos obrigatórios")
      }
    }, 2000)
  }

  const handleGerarQRCode = async () => {
    setConectandoWhatsApp(true)
    setQrCode("")

    try {
      const response = await fetch("/api/whatsapp-web/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.qrCode)
        setSessionId(data.sessionId)
        setStatusConexao("configurando")

        setTimeout(() => {
          setStatusConexao("conectado")
          setConectandoWhatsApp(false)
          setQrCode("")

          // Mostrar popup de sucesso
          const popup = document.createElement("div")
          popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            text-align: center;
            border: 1px solid #e2e8f0;
          `
          popup.innerHTML = `
            <p style="margin: 0 0 15px 0; font-size: 16px;">WhatsApp conectado com sucesso! 🎉</p>
            <button onclick="this.parentElement.remove()" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">OK</button>
          `
          document.body.appendChild(popup)
        }, 3000)
      } else {
        throw new Error(data.error || "Erro ao gerar QR Code")
      }
    } catch (error) {
      console.error("[v0] Erro ao gerar QR Code:", error)
      setConectandoWhatsApp(false)
      setStatusConexao("desconectado")
      alert("Erro ao gerar QR Code. Tente novamente.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            Auto Atendimento WhatsApp
          </h2>
          <p className="text-muted-foreground">Sistema inteligente de atendimento automatizado via WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusConexao === "conectado" ? "default" : "secondary"} className="flex items-center gap-1">
            {statusConexao === "conectado" ? (
              <CheckCircle className="h-3 w-3" />
            ) : statusConexao === "configurando" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {statusConexao === "conectado"
              ? "Conectado"
              : statusConexao === "configurando"
                ? "Configurando..."
                : "Desconectado"}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="conversas" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="integracao" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integração
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConversas}</div>
                <p className="text-xs text-muted-foreground">Todas as conversas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{conversasAtivas}</div>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversasHoje}</div>
                <p className="text-xs text-muted-foreground">Iniciadas hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Resposta</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">Automática</p>
              </CardContent>
            </Card>
          </div>

          {/* Status do Bot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Status do Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${configuracao.ativo ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="font-medium">{configuracao.ativo ? "Bot Ativo" : "Bot Inativo"}</span>
                  <Badge variant="outline">{configuracao.nomeBot}</Badge>
                </div>
                <Switch
                  checked={configuracao.ativo}
                  onCheckedChange={(checked) => setConfiguracao((prev) => ({ ...prev, ativo: checked }))}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Horário de funcionamento: {configuracao.horarioFuncionamento.inicio} às{" "}
                {configuracao.horarioFuncionamento.fim}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversas Tab */}
        <TabsContent value="conversas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <CardDescription>Acompanhe todas as conversas em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversas.map((conversa) => (
                  <div key={conversa.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{conversa.cliente}</p>
                        <p className="text-sm text-muted-foreground">{conversa.telefone}</p>
                        <p className="text-sm">{conversa.ultimaMensagem}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          conversa.status === "ativa"
                            ? "default"
                            : conversa.status === "aguardando"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {conversa.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{conversa.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração Tab */}
        <TabsContent value="configuracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configuração do Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nomeBot">Nome do Bot</Label>
                  <Input
                    id="nomeBot"
                    value={configuracao.nomeBot}
                    onChange={(e) => setConfiguracao((prev) => ({ ...prev, nomeBot: e.target.value }))}
                    placeholder="Ex: Cartago Bot"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status do Bot</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={configuracao.ativo}
                      onCheckedChange={(checked) => setConfiguracao((prev) => ({ ...prev, ativo: checked }))}
                    />
                    <Label>{configuracao.ativo ? "Ativo" : "Inativo"}</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagemBoasVindas">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="mensagemBoasVindas"
                  value={configuracao.mensagemBoasVindas}
                  onChange={(e) => setConfiguracao((prev) => ({ ...prev, mensagemBoasVindas: e.target.value }))}
                  rows={4}
                  placeholder="Digite a mensagem que o bot enviará para novos clientes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="horarioInicio">Horário de Início</Label>
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={configuracao.horarioFuncionamento.inicio}
                    onChange={(e) =>
                      setConfiguracao((prev) => ({
                        ...prev,
                        horarioFuncionamento: { ...prev.horarioFuncionamento, inicio: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioFim">Horário de Fim</Label>
                  <Input
                    id="horarioFim"
                    type="time"
                    value={configuracao.horarioFuncionamento.fim}
                    onChange={(e) =>
                      setConfiguracao((prev) => ({
                        ...prev,
                        horarioFuncionamento: { ...prev.horarioFuncionamento, fim: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Respostas Automáticas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(configuracao.respostasAutomaticas).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setConfiguracao((prev) => ({
                            ...prev,
                            respostasAutomaticas: { ...prev.respostasAutomaticas, [key]: checked },
                          }))
                        }
                      />
                      <Label className="capitalize">{key}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSalvarConfiguracao} className="w-full">
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integração Tab */}
        <TabsContent value="integracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Método de Integração
              </CardTitle>
              <CardDescription>Escolha como conectar o WhatsApp ao sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-2 border-dashed">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">WhatsApp Web (Recomendado)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Conecta via QR Code usando seu WhatsApp Business. Mais simples e rápido.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configuração em 2 minutos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Sem tokens complicados</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>IA totalmente funcional</span>
                      </div>
                    </div>
                    <Button className="w-full">Conectar via QR Code</Button>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-dashed opacity-60">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold">WhatsApp Business API</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Integração oficial da Meta. Requer verificação e configuração complexa.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Verificação Meta obrigatória</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Configuração complexa</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Pode levar dias para aprovar</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" disabled>
                      Em Manutenção
                    </Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Configuração WhatsApp Web
              </CardTitle>
              <CardDescription>Configure sua conexão via WhatsApp Web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {conectandoWhatsApp ? (
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                    </div>
                  ) : qrCode ? (
                    <div className="text-center space-y-2">
                      <img src={qrCode || "/placeholder.svg"} alt="QR Code WhatsApp" className="w-40 h-40 mx-auto" />
                      <p className="text-xs text-green-600 font-medium">
                        {statusConexao === "conectado" ? "✅ Conectado!" : "Escaneie com WhatsApp"}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Smartphone className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground">QR Code aparecerá aqui</p>
                      <p className="text-xs text-muted-foreground">Escaneie com seu WhatsApp Business</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Como conectar:</h3>
                  <div className="text-left space-y-1 text-sm text-muted-foreground max-w-md mx-auto">
                    <p>1. Abra o WhatsApp Business no seu celular</p>
                    <p>2. Toque em "Mais opções" (⋮) → "Dispositivos conectados"</p>
                    <p>3. Toque em "Conectar um dispositivo"</p>
                    <p>4. Escaneie o QR Code que aparecerá acima</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full max-w-md"
                  onClick={handleGerarQRCode}
                  disabled={conectandoWhatsApp || statusConexao === "conectado"}
                >
                  {conectandoWhatsApp
                    ? "Gerando QR Code..."
                    : statusConexao === "conectado"
                      ? "✅ WhatsApp Conectado"
                      : "Gerar QR Code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
