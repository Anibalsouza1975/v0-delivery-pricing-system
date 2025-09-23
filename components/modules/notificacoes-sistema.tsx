"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bell, BellRing, Clock, Settings, Volume2, VolumeX } from "lucide-react"

interface NotificationSettings {
  novoPedido: {
    ativo: boolean
    som: boolean
    email: boolean
    whatsapp: boolean
  }
  pedidoAtrasado: {
    ativo: boolean
    tempoLimite: number // em minutos
    som: boolean
    email: boolean
  }
  pedidoPronto: {
    ativo: boolean
    som: boolean
    notificarCliente: boolean
  }
  baixoEstoque: {
    ativo: boolean
    limite: number
    email: boolean
  }
}

interface Notificacao {
  id: string
  tipo: "novo_pedido" | "pedido_atrasado" | "pedido_pronto" | "baixo_estoque"
  titulo: string
  mensagem: string
  dataHora: Date
  lida: boolean
  pedidoId?: string
}

export default function NotificacoesSistemaModule() {
  const [configuracoes, setConfiguracoes] = useState<NotificationSettings>({
    novoPedido: {
      ativo: true,
      som: true,
      email: false,
      whatsapp: false,
    },
    pedidoAtrasado: {
      ativo: true,
      tempoLimite: 45,
      som: true,
      email: false,
    },
    pedidoPronto: {
      ativo: true,
      som: true,
      notificarCliente: false,
    },
    baixoEstoque: {
      ativo: false,
      limite: 5,
      email: false,
    },
  })

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [somAtivo, setSomAtivo] = useState(true)

  // Carregar configurações do localStorage
  useEffect(() => {
    const configSalvas = localStorage.getItem("notificationSettings")
    if (configSalvas) {
      setConfiguracoes(JSON.parse(configSalvas))
    }

    const notifSalvas = localStorage.getItem("notifications")
    if (notifSalvas) {
      const notifData = JSON.parse(notifSalvas).map((n: any) => ({
        ...n,
        dataHora: new Date(n.dataHora),
      }))
      setNotificacoes(notifData)
    }
  }, [])

  // Salvar configurações
  const salvarConfiguracoes = (novasConfig: NotificationSettings) => {
    localStorage.setItem("notificationSettings", JSON.stringify(novasConfig))
    setConfiguracoes(novasConfig)
  }

  // Adicionar notificação
  const adicionarNotificacao = (notif: Omit<Notificacao, "id" | "dataHora" | "lida">) => {
    const novaNotif: Notificacao = {
      ...notif,
      id: `notif_${Date.now()}`,
      dataHora: new Date(),
      lida: false,
    }

    const novasNotif = [novaNotif, ...notificacoes].slice(0, 50) // Manter apenas 50 notificações
    setNotificacoes(novasNotif)
    localStorage.setItem("notifications", JSON.stringify(novasNotif))

    // Tocar som se ativo
    if (somAtivo && configuracoes.novoPedido.som) {
      playNotificationSound()
    }

    // Mostrar notificação do navegador
    if (Notification.permission === "granted") {
      new Notification(notif.titulo, {
        body: notif.mensagem,
        icon: "/favicon.ico",
      })
    }
  }

  // Tocar som de notificação
  const playNotificationSound = () => {
    const audio = new Audio("/notification-sound.mp3")
    audio.play().catch(() => {
      // Fallback para som do sistema
      console.log("Som de notificação")
    })
  }

  // Marcar como lida
  const marcarComoLida = (notifId: string) => {
    const novasNotif = notificacoes.map((n) => (n.id === notifId ? { ...n, lida: true } : n))
    setNotificacoes(novasNotif)
    localStorage.setItem("notifications", JSON.stringify(novasNotif))
  }

  // Marcar todas como lidas
  const marcarTodasComoLidas = () => {
    const novasNotif = notificacoes.map((n) => ({ ...n, lida: true }))
    setNotificacoes(novasNotif)
    localStorage.setItem("notifications", JSON.stringify(novasNotif))
  }

  // Solicitar permissão para notificações
  const solicitarPermissaoNotificacao = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }

  // Simular nova notificação para teste
  const testarNotificacao = () => {
    adicionarNotificacao({
      tipo: "novo_pedido",
      titulo: "Novo Pedido Recebido!",
      mensagem: "Pedido #PED123456 - João Silva - R$ 45,90",
      pedidoId: "PED123456",
    })
  }

  const notificacaoNaoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Notificações</h2>
          <p className="text-muted-foreground">Configure alertas e acompanhe notificações em tempo real</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSomAtivo(!somAtivo)}
              className={somAtivo ? "text-green-600" : "text-red-600"}
            >
              {somAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {somAtivo ? "Som Ativo" : "Som Desativado"}
            </Button>
          </div>
          <Button onClick={testarNotificacao} variant="outline" size="sm">
            Testar Notificação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Novos Pedidos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Novos Pedidos</Label>
                    <p className="text-sm text-muted-foreground">Alertas quando receber novos pedidos</p>
                  </div>
                  <Switch
                    checked={configuracoes.novoPedido.ativo}
                    onCheckedChange={(checked) =>
                      salvarConfiguracoes({
                        ...configuracoes,
                        novoPedido: { ...configuracoes.novoPedido, ativo: checked },
                      })
                    }
                  />
                </div>

                {configuracoes.novoPedido.ativo && (
                  <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Som de alerta</Label>
                      <Switch
                        checked={configuracoes.novoPedido.som}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            novoPedido: { ...configuracoes.novoPedido, som: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notificação por email</Label>
                      <Switch
                        checked={configuracoes.novoPedido.email}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            novoPedido: { ...configuracoes.novoPedido, email: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">WhatsApp</Label>
                      <Switch
                        checked={configuracoes.novoPedido.whatsapp}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            novoPedido: { ...configuracoes.novoPedido, whatsapp: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pedidos Atrasados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Pedidos Atrasados</Label>
                    <p className="text-sm text-muted-foreground">Alertas para pedidos que passaram do tempo</p>
                  </div>
                  <Switch
                    checked={configuracoes.pedidoAtrasado.ativo}
                    onCheckedChange={(checked) =>
                      salvarConfiguracoes({
                        ...configuracoes,
                        pedidoAtrasado: { ...configuracoes.pedidoAtrasado, ativo: checked },
                      })
                    }
                  />
                </div>

                {configuracoes.pedidoAtrasado.ativo && (
                  <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
                    <div>
                      <Label className="text-sm">Tempo limite (minutos)</Label>
                      <Input
                        type="number"
                        value={configuracoes.pedidoAtrasado.tempoLimite}
                        onChange={(e) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            pedidoAtrasado: {
                              ...configuracoes.pedidoAtrasado,
                              tempoLimite: Number.parseInt(e.target.value) || 45,
                            },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Som de alerta</Label>
                      <Switch
                        checked={configuracoes.pedidoAtrasado.som}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            pedidoAtrasado: { ...configuracoes.pedidoAtrasado, som: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pedidos Prontos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Pedidos Prontos</Label>
                    <p className="text-sm text-muted-foreground">Alertas quando pedidos ficarem prontos</p>
                  </div>
                  <Switch
                    checked={configuracoes.pedidoPronto.ativo}
                    onCheckedChange={(checked) =>
                      salvarConfiguracoes({
                        ...configuracoes,
                        pedidoPronto: { ...configuracoes.pedidoPronto, ativo: checked },
                      })
                    }
                  />
                </div>

                {configuracoes.pedidoPronto.ativo && (
                  <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Som de alerta</Label>
                      <Switch
                        checked={configuracoes.pedidoPronto.som}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            pedidoPronto: { ...configuracoes.pedidoPronto, som: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notificar cliente</Label>
                      <Switch
                        checked={configuracoes.pedidoPronto.notificarCliente}
                        onCheckedChange={(checked) =>
                          salvarConfiguracoes({
                            ...configuracoes,
                            pedidoPronto: { ...configuracoes.pedidoPronto, notificarCliente: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Permissões do Navegador */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Permissões do Navegador</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações do navegador</span>
                  <Button onClick={solicitarPermissaoNotificacao} variant="outline" size="sm">
                    {Notification?.permission === "granted" ? "Ativado" : "Ativar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Notificações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações Recentes
                  {notificacaoNaoLidas > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {notificacaoNaoLidas}
                    </Badge>
                  )}
                </CardTitle>
                {notificacaoNaoLidas > 0 && (
                  <Button onClick={marcarTodasComoLidas} variant="outline" size="sm">
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notificacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação ainda</p>
                  <p className="text-sm">As notificações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notif.lida ? "bg-muted/50" : "bg-primary/5 border-primary/20"
                      }`}
                      onClick={() => marcarComoLida(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${notif.lida ? "bg-muted" : "bg-primary"}`}>
                          {notif.tipo === "novo_pedido" && <BellRing className="h-3 w-3 text-white" />}
                          {notif.tipo === "pedido_atrasado" && <Clock className="h-3 w-3 text-white" />}
                          {notif.tipo === "pedido_pronto" && <Bell className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${notif.lida ? "text-muted-foreground" : ""}`}>
                            {notif.titulo}
                          </p>
                          <p className={`text-xs ${notif.lida ? "text-muted-foreground" : "text-muted-foreground"}`}>
                            {notif.mensagem}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.dataHora.toLocaleString("pt-BR")}</p>
                        </div>
                        {!notif.lida && <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <p className="text-sm text-muted-foreground">Pedidos Recebidos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <p className="text-sm text-muted-foreground">Pedidos Entregues</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <p className="text-sm text-muted-foreground">Em Produção</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">28 min</div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
