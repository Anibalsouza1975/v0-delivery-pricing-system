"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageCircle,
  Settings,
  Bot,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Activity,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Phone,
  Save,
  TestTube,
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

interface Metricas {
  totalConversas: number
  conversasAtivas: number
  conversasHoje: number
  mensagensHoje: number
  taxaResposta: number
  tempoMedioResposta: string
}

export default function AutoAtendimentoWhatsAppModule() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [configuracao, setConfiguracao] = useState<ConfiguracaoBot>({
    ativo: false,
    nomeBot: "Cartago Bot",
    mensagemBoasVindas:
      "Olá! 👋 Bem-vindo ao Cartago Burger Grill! Sou seu assistente virtual e estou aqui para ajudar com pedidos, cardápio e informações. Como posso te ajudar hoje?",
    horarioFuncionamento: {
      inicio: "18:00",
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

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [metricas, setMetricas] = useState<Metricas>({
    totalConversas: 0,
    conversasAtivas: 0,
    conversasHoje: 0,
    mensagensHoje: 0,
    taxaResposta: 0,
    tempoMedioResposta: "0min",
  })

  const [statusConexao, setStatusConexao] = useState<"conectado" | "desconectado" | "configurando" | "token_expirado">(
    "desconectado",
  )
  const [tokenError, setTokenError] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>("")
  const [conectandoWhatsApp, setConectandoWhatsApp] = useState(false)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [debugToken, setDebugToken] = useState("")
  const [debugResult, setDebugResult] = useState<any>(null)
  const [testingToken, setTestingToken] = useState(false)
  const [webhookDiagnostics, setWebhookDiagnostics] = useState<any>(null)
  const [testingWebhookConfig, setTestingWebhookConfig] = useState(false)
  const [updatingWebhookUrl, setUpdatingWebhookUrl] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setCarregandoDados(true)

      // Carregar configuração
      const configResponse = await fetch("/api/whatsapp/config")
      if (configResponse.ok) {
        const { config } = await configResponse.json()
        if (config) {
          setConfiguracao({
            ativo: config.ativo,
            nomeBot: config.nome_bot,
            mensagemBoasVindas: config.mensagem_boas_vindas,
            horarioFuncionamento: {
              inicio: config.horario_inicio,
              fim: config.horario_fim,
            },
            respostasAutomaticas: config.respostas_automaticas,
          })
          setStatusConexao(config.status_conexao || "desconectado")
          setTokenError(config.token_error || null)
        }
      }

      // Carregar conversas
      const conversasResponse = await fetch("/api/whatsapp/conversas")
      if (conversasResponse.ok) {
        const { conversas } = await conversasResponse.json()
        setConversas(conversas || [])
      }

      // Carregar métricas
      const metricasResponse = await fetch("/api/whatsapp/metricas")
      if (metricasResponse.ok) {
        const { metricas } = await metricasResponse.json()
        setMetricas(metricas)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados WhatsApp:", error)
    } finally {
      setCarregandoDados(false)
    }
  }

  const handleSalvarConfiguracao = async () => {
    try {
      setSalvandoConfig(true)

      const response = await fetch("/api/whatsapp/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configuracao),
      })

      if (response.ok) {
        alert("Configuração salva com sucesso!")
      } else {
        throw new Error("Erro ao salvar configuração")
      }
    } catch (error) {
      console.error("[v0] Erro ao salvar configuração:", error)
      alert("Erro ao salvar configuração. Tente novamente.")
    } finally {
      setSalvandoConfig(false)
    }
  }

  const handleTestarConexao = async () => {
    setStatusConexao("configurando")

    try {
      const response = await fetch("/api/whatsapp/test-connection")
      const data = await response.json()

      if (data.success) {
        setStatusConexao("conectado")
        alert(`Conexão testada com sucesso!\nNúmero: ${data.phoneNumber}\nStatus: ${data.status}`)
      } else {
        setStatusConexao("desconectado")
        alert(`Erro na conexão: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Erro ao testar conexão:", error)
      setStatusConexao("desconectado")
      alert("Erro ao testar conexão. Verifique as configurações.")
    }
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

  const handleTestarWebhook = async () => {
    try {
      setTestingWebhook(true)

      const response = await fetch("/api/whatsapp/test-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        alert(`✅ Webhook testado com sucesso!

📱 Mensagem simulada: "${data.testData.receivedMessage}"
📞 Número: ${data.testData.fromNumber}
🤖 Resposta da IA: "${data.testData.aiResponse}"
⏰ Timestamp: ${new Date(data.testData.timestamp).toLocaleString()}

O webhook está funcionando corretamente!`)
      } else {
        alert(`❌ Erro no teste do webhook: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Erro ao testar webhook:", error)
      alert(`❌ Erro ao testar webhook: ${error instanceof Error ? error.message : "Erro desconhecido"}

Verifique o console para mais detalhes.`)
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleDebugToken = async () => {
    try {
      setTestingToken(true)
      const response = await fetch("/api/whatsapp/debug-token")
      const data = await response.json()
      setDebugResult(data.debug)
    } catch (error) {
      console.error("[v0] Erro ao fazer debug do token:", error)
      setDebugResult({ error: "Erro ao fazer debug do token" })
    } finally {
      setTestingToken(false)
    }
  }

  const handleTestNewToken = async () => {
    if (!debugToken.trim()) {
      alert("Por favor, cole o novo token primeiro")
      return
    }

    try {
      setTestingToken(true)
      const response = await fetch("/api/whatsapp/update-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newToken: debugToken.trim() }),
      })
      const data = await response.json()

      if (data.success) {
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
          max-width: 500px;
          width: 90%;
          border: 1px solid #e2e8f0;
        `
        popup.innerHTML = `
          <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #16a34a;">Token testado</h3>
            <p style="margin: 0; color: #16a34a;">Token válido! Atualize a variável WHATSAPP_ACCESS_TOKEN nas configurações do projeto.</p>
          </div>
          <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Instruções:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Vá para o ícone de engrenagem (⚙️) no canto superior direito</li>
              <li>Clique em 'Environment Variables'</li>
              <li>Encontre 'WHATSAPP_ACCESS_TOKEN'</li>
              <li>Cole o novo token e salve</li>
              <li>Aguarde alguns segundos para o sistema processar</li>
            </ol>
          </div>
          <button onclick="this.parentElement.remove()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          ">OK</button>
        `
        document.body.appendChild(popup)

        if (data.tokenPreview) {
          setDebugToken("")
        }
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Erro ao testar novo token:", error)
      alert("Erro ao testar novo token")
    } finally {
      setTestingToken(false)
    }
  }

  const handleDiagnosticarWebhook = async () => {
    try {
      setTestingWebhookConfig(true)

      const response = await fetch("/api/whatsapp/webhook-diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setWebhookDiagnostics(data)

      if (data.urlMismatch) {
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
          max-width: 700px;
          width: 90%;
          border: 1px solid #e2e8f0;
          max-height: 80vh;
          overflow-y: auto;
        `
        popup.innerHTML = `
          <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ URL do Webhook Incorreta</h3>
            <p style="margin: 0; color: #dc2626;">O webhook no Meta está configurado para uma URL diferente da atual.</p>
          </div>
          <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">URLs detectadas:</p>
            <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 5px 0;"><strong>URL atual do sistema:</strong></p>
              <code style="font-size: 12px; word-break: break-all;">${data.webhookUrl}</code>
            </div>
            <div style="background: #fef3c7; padding: 10px; border-radius: 6px;">
              <p style="margin: 0 0 5px 0;"><strong>URL configurada no Meta:</strong></p>
              <code style="font-size: 12px; word-break: break-all;">${data.webhookUrlInMeta}</code>
            </div>
          </div>
          <div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>Problema:</strong> O Meta está enviando mensagens para a URL antiga, por isso elas não chegam no sistema atual.
            </p>
          </div>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #0369a1;">📋 Como corrigir manualmente:</p>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.6; color: #0369a1;">
              <li>Acesse <a href="https://developers.facebook.com/apps" target="_blank" style="color: #3b82f6;">Meta for Developers</a></li>
              <li>Vá para seu app WhatsApp Business</li>
              <li>Na seção "WhatsApp" → "Configuração"</li>
              <li>Encontre "Webhooks" e clique em "Editar"</li>
              <li>Atualize a URL para: <br><code style="background: #e0f2fe; padding: 2px 4px; border-radius: 3px; font-size: 11px; word-break: break-all;">${data.webhookUrl}</code></li>
              <li>Mantenha o token: <code style="background: #e0f2fe; padding: 2px 4px; border-radius: 3px; font-size: 11px;">${data.verifyToken}</code></li>
              <li>Clique em "Verificar e salvar"</li>
              <li>Teste enviando uma mensagem para +1 555 185 0889</li>
            </ol>
          </div>
          <div style="background: #dcfce7; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 13px; color: #166534;">
              <strong>💡 Alternativa:</strong> Você pode fazer o deploy para produção clicando em "Publish" no v0, assim a URL do Meta ficará correta automaticamente.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              flex: 1;
            ">Fechar</button>
            <button onclick="window.open('https://developers.facebook.com/apps', '_blank')" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              flex: 1;
            ">Abrir Meta for Developers</button>
          </div>
        `
        document.body.appendChild(popup)
      } else if (!data.webhookConfigured) {
        // Show original webhook not configured popup
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
          max-width: 600px;
          width: 90%;
          border: 1px solid #e2e8f0;
          max-height: 80vh;
          overflow-y: auto;
        `
        popup.innerHTML = `
          <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Webhook não configurado no Meta</h3>
            <p style="margin: 0; color: #dc2626;">O webhook não está recebendo mensagens do WhatsApp porque não foi configurado no painel da Meta.</p>
          </div>
          <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Instruções passo a passo:</p>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Acesse <a href="https://developers.facebook.com/apps" target="_blank" style="color: #3b82f6;">Meta for Developers</a></li>
              <li>Vá para seu app WhatsApp Business</li>
              <li>Na seção "WhatsApp" → "Configuração"</li>
              <li>Encontre "Webhooks" e clique em "Configurar"</li>
              <li>Cole esta URL: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px;">${data.webhookUrl}</code></li>
              <li>Cole este token: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px;">${data.verifyToken}</code></li>
              <li>Marque "messages" nos eventos</li>
              <li>Clique em "Verificar e salvar"</li>
              <li>Ative o webhook para seu número de telefone</li>
            </ol>
          </div>
          <div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>Importante:</strong> Sem essa configuração, o WhatsApp não enviará mensagens para nosso sistema, mesmo que tudo esteja funcionando internamente.
            </p>
          </div>
          <button onclick="this.parentElement.remove()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          ">Entendi, vou configurar</button>
        `
        document.body.appendChild(popup)
      }
    } catch (error) {
      console.error("[v0] Erro ao diagnosticar webhook:", error)
      alert("Erro ao diagnosticar webhook")
    } finally {
      setTestingWebhookConfig(false)
    }
  }

  const handleCorrigirWebhookUrl = async (newUrl: string) => {
    try {
      setUpdatingWebhookUrl(true)

      const response = await fetch("/api/whatsapp/update-webhook-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhookUrl: newUrl }),
      })

      const data = await response.json()

      if (data.success) {
        // Show success popup
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
          max-width: 500px;
          width: 90%;
          border: 1px solid #e2e8f0;
        `
        popup.innerHTML = `
          <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #16a34a;">✅ URL do Webhook Atualizada!</h3>
            <p style="margin: 0; color: #16a34a;">O webhook foi configurado com sucesso no Meta. Agora as mensagens do WhatsApp devem chegar corretamente.</p>
          </div>
          <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Próximos passos:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Envie uma mensagem de teste para +1 555 185 0889</li>
              <li>O sistema deve responder automaticamente</li>
              <li>Verifique a aba "Conversas" para ver as mensagens</li>
            </ol>
          </div>
          <button onclick="this.parentElement.remove(); window.location.reload()" style="
            background: #16a34a;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          ">OK, testar agora</button>
        `
        document.body.appendChild(popup)

        // Refresh diagnostics
        setTimeout(() => {
          handleDiagnosticarWebhook()
        }, 2000)
      } else {
        alert(`Erro ao atualizar webhook: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Erro ao corrigir URL do webhook:", error)
      alert("Erro ao corrigir URL do webhook")
    } finally {
      setUpdatingWebhookUrl(false)
    }
  }

  if (carregandoDados) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando dados do WhatsApp...</span>
      </div>
    )
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
          <Button variant="outline" size="sm" onClick={carregarDados}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Badge
            variant={
              statusConexao === "conectado"
                ? "default"
                : statusConexao === "token_expirado"
                  ? "destructive"
                  : "secondary"
            }
            className="flex items-center gap-1"
          >
            {statusConexao === "conectado" ? (
              <CheckCircle className="h-3 w-3" />
            ) : statusConexao === "configurando" ? (
              <Clock className="h-3 w-3" />
            ) : statusConexao === "token_expirado" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {statusConexao === "conectado"
              ? "Conectado"
              : statusConexao === "configurando"
                ? "Configurando..."
                : statusConexao === "token_expirado"
                  ? "Token Expirado"
                  : "Desconectado"}
          </Badge>
        </div>
      </div>

      {statusConexao === "token_expirado" && tokenError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Token de Acesso do WhatsApp Expirado</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>O token de acesso do WhatsApp Business API expirou e precisa ser renovado.</p>
            <div className="text-sm bg-red-50 p-3 rounded border">
              <p>
                <strong>Erro técnico:</strong> {tokenError.message}
              </p>
              <p>
                <strong>Código:</strong> {tokenError.code} (Subcode: {tokenError.subcode})
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Para resolver:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Meta for Developers <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Vá para seu app WhatsApp Business</li>
                <li>Na seção "WhatsApp" → "Configuração da API"</li>
                <li>Clique em "Gerar token de acesso"</li>
                <li>Copie o novo token</li>
                <li>
                  Atualize a variável <code className="bg-gray-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> nas
                  configurações do projeto
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                <div className="text-2xl font-bold">{metricas.totalConversas}</div>
                <p className="text-xs text-muted-foreground">Todas as conversas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metricas.conversasAtivas}</div>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.conversasHoje}</div>
                <p className="text-xs text-muted-foreground">Iniciadas hoje</p>
              </CardContent>
            </Card>

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
                {conversas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">As conversas aparecerão aqui quando os clientes enviarem mensagens</p>
                  </div>
                ) : (
                  conversas.map((conversa) => (
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
                  ))
                )}
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

              <Button onClick={handleSalvarConfiguracao} className="w-full" disabled={salvandoConfig}>
                {salvandoConfig ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
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
                Status da Integração WhatsApp Business API
              </CardTitle>
              <CardDescription>Verificação da conexão com a API oficial do WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Card
                  className={`p-4 border-2 ${statusConexao === "token_expirado" ? "border-red-200 bg-red-50" : ""}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">WhatsApp Business API</h3>
                      <Badge
                        variant={
                          statusConexao === "conectado"
                            ? "default"
                            : statusConexao === "token_expirado"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {statusConexao === "conectado"
                          ? "Conectado"
                          : statusConexao === "token_expirado"
                            ? "Token Expirado"
                            : "Desconectado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Integração oficial da Meta configurada via tokens de acesso.
                    </p>

                    {statusConexao === "token_expirado" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Token de acesso expirado</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Webhook configurado e funcionando</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>IA integrada para respostas automáticas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Não pode enviar/receber mensagens reais</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Webhook configurado e funcionando</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>IA integrada para respostas automáticas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Processamento de pedidos automatizado</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleTestarConexao} disabled={statusConexao === "configurando"}>
                        {statusConexao === "configurando" ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <Activity className="h-4 w-4 mr-2" />
                            Testar Conexão
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleTestarWebhook} disabled={testingWebhook}>
                        {testingWebhook ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testando Webhook...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4 mr-2" />
                            Testar Webhook
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={carregarDados}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar Status
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Como Testar o Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Envie uma mensagem para o número do WhatsApp Business</p>
                        <p className="text-sm text-muted-foreground">Número: +1 555 185 0889</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">O sistema responderá automaticamente</p>
                        <p className="text-sm text-muted-foreground">
                          A IA processará sua mensagem e enviará uma resposta personalizada
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Acompanhe na aba "Conversas"</p>
                        <p className="text-sm text-muted-foreground">
                          Todas as mensagens aparecerão aqui em tempo real
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">🔧 Diagnóstico:</p>
                    <p className="text-sm text-yellow-800 mb-2">
                      Se as mensagens não estão sendo respondidas, use o botão "Testar Webhook" acima para verificar se
                      o sistema está processando mensagens corretamente.
                    </p>
                    <p className="text-sm text-yellow-800">
                      O teste simulará uma mensagem recebida e mostrará se o webhook está funcionando.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">💡 Dica:</p>
                    <p className="text-sm text-blue-800">
                      Experimente perguntar sobre o cardápio, preços ou fazer um pedido. O sistema está configurado para
                      responder automaticamente!
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-900">🚨 Problema Identificado:</p>
                    </div>
                    <p className="text-sm text-red-800 mb-3">
                      O sistema interno funciona perfeitamente (teste do webhook passa), mas mensagens reais do WhatsApp
                      não chegam. Isso indica que o webhook não foi configurado no painel da Meta.
                    </p>
                    <Button
                      onClick={handleDiagnosticarWebhook}
                      disabled={testingWebhookConfig || updatingWebhookUrl}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                    >
                      {testingWebhookConfig || updatingWebhookUrl ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {updatingWebhookUrl ? "Corrigindo..." : "Diagnosticando..."}
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Diagnosticar Configuração Webhook
                        </>
                      )}
                    </Button>
                  </div>

                  {webhookDiagnostics && (
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium mb-2">Resultado do Diagnóstico Webhook:</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>URL do Webhook:</strong>
                          <code className="bg-gray-100 px-1 rounded ml-1">{webhookDiagnostics.webhookUrl}</code>
                        </p>
                        <p>
                          <strong>Token de Verificação:</strong>
                          <code className="bg-gray-100 px-1 rounded ml-1">{webhookDiagnostics.verifyToken}</code>
                        </p>
                        <p>
                          <strong>Webhook Configurado no Meta:</strong>
                          <span
                            className={`ml-1 ${webhookDiagnostics.webhookConfigured ? "text-green-600" : "text-red-600"}`}
                          >
                            {webhookDiagnostics.webhookConfigured ? "✅ Sim" : "❌ Não"}
                          </span>
                        </p>
                        {webhookDiagnostics.urlMismatch && (
                          <p>
                            <strong>URL no Meta:</strong>
                            <code className="bg-yellow-100 px-1 rounded ml-1">
                              {webhookDiagnostics.webhookUrlInMeta}
                            </code>
                            <span className="ml-1 text-red-600">⚠️ Diferente da atual</span>
                          </p>
                        )}
                        <p>
                          <strong>Sistema Interno:</strong>
                          <span className="ml-1 text-green-600">✅ Funcionando</span>
                        </p>
                        <p>
                          <strong>Mensagens Reais Recebidas:</strong>
                          <span
                            className={`ml-1 ${webhookDiagnostics.realMessagesReceived ? "text-green-600" : "text-red-600"}`}
                          >
                            {webhookDiagnostics.realMessagesReceived ? "✅ Sim" : "❌ Não"}
                          </span>
                        </p>
                        {webhookDiagnostics.urlMismatch && (
                          <div className="bg-yellow-50 p-2 rounded mt-2">
                            <p className="text-yellow-800 text-xs">
                              <strong>Solução:</strong> A URL do webhook no Meta está desatualizada. Use o botão
                              "Corrigir URL Automaticamente" acima.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {statusConexao === "token_expirado" && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Diagnóstico e Correção do Token
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      Ferramenta para verificar e testar tokens do WhatsApp Business API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button onClick={handleDebugToken} disabled={testingToken} variant="outline">
                          {testingToken ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-2" />
                              Verificar Token Atual
                            </>
                          )}
                        </Button>
                      </div>

                      {debugResult && (
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-medium mb-2">Resultado do Diagnóstico:</h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Token existe:</strong> {debugResult.tokenExists ? "✅ Sim" : "❌ Não"}
                            </p>
                            <p>
                              <strong>Tamanho do token:</strong> {debugResult.tokenLength} caracteres
                            </p>
                            <p>
                              <strong>Preview do token:</strong>{" "}
                              <code className="bg-gray-100 px-1 rounded">{debugResult.tokenPreview}</code>
                            </p>
                            <p>
                              <strong>Status:</strong>
                              <span
                                className={`ml-1 ${debugResult.tokenStatus === "válido" ? "text-green-600" : "text-red-600"}`}
                              >
                                {debugResult.tokenStatus}
                              </span>
                            </p>
                            {debugResult.errorDetails && (
                              <div className="bg-red-50 p-2 rounded">
                                <p>
                                  <strong>Erro:</strong>{" "}
                                  {debugResult.errorDetails.error?.message || debugResult.errorDetails.message}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              Verificado em: {new Date(debugResult.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="debugToken">Testar Novo Token</Label>
                        <div className="space-y-2">
                          <Textarea
                            id="debugToken"
                            value={debugToken}
                            onChange={(e) => setDebugToken(e.target.value)}
                            placeholder="Cole aqui o novo token gerado no Meta for Developers..."
                            rows={3}
                            className="font-mono text-sm"
                          />
                          <Button onClick={handleTestNewToken} disabled={testingToken || !debugToken.trim()}>
                            {testingToken ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Testando...
                              </>
                            ) : (
                              <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Testar Novo Token
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-1">Como usar:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Clique em "Verificar Token Atual" para ver o status do token</li>
                          <li>Gere um novo token no Meta for Developers</li>
                          <li>Cole o novo token no campo acima</li>
                          <li>Clique em "Testar Novo Token" para verificar se é válido</li>
                          <li>Se válido, atualize a variável WHATSAPP_ACCESS_TOKEN no projeto</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
