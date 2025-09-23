"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Clock, CheckCircle, Truck, Package, ChefHat, MapPin, Phone, User } from "lucide-react"

interface Pedido {
  id: string
  cliente: {
    nome: string
    telefone: string
    email: string
    endereco: string
    complemento: string
    bairro: string
    cep: string
  }
  itens: Array<{
    id: string
    nome: string
    preco: number
    quantidade: number
    tipo: string
  }>
  subtotal: number
  frete: number
  total: number
  formaPagamento: string
  observacoes: string
  status: "pendente" | "confirmado" | "preparando" | "pronto" | "saiu_entrega" | "entregue"
  data: Date
  tempoEstimado: number
  tempoInicioPreparo?: Date
  tempoFinalizacao?: Date
  origem?: string
}

const statusConfig = {
  pendente: {
    label: "Pedido Recebido",
    color: "bg-yellow-500",
    description: "Seu pedido foi recebido e está aguardando confirmação",
  },
  confirmado: {
    label: "Confirmado",
    color: "bg-blue-500",
    description: "Pedido confirmado! Entrará em preparo em breve",
  },
  preparando: {
    label: "Em Preparo",
    color: "bg-orange-500",
    description: "Nossos chefs estão preparando seu pedido com carinho",
  },
  pronto: {
    label: "Pronto",
    color: "bg-green-500",
    description: "Seu pedido está pronto! Saindo para entrega",
  },
  saiu_entrega: {
    label: "Saiu para Entrega",
    color: "bg-purple-500",
    description: "Pedido a caminho! Chegará em breve",
  },
  entregue: {
    label: "Entregue",
    color: "bg-emerald-600",
    description: "Pedido entregue com sucesso! Obrigado pela preferência",
  },
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pendente":
      return <Clock className="h-6 w-6 text-white" />
    case "confirmado":
      return <CheckCircle className="h-6 w-6 text-white" />
    case "preparando":
      return <ChefHat className="h-6 w-6 text-white" />
    case "pronto":
      return <Package className="h-6 w-6 text-white" />
    case "saiu_entrega":
      return <Truck className="h-6 w-6 text-white" />
    case "entregue":
      return <CheckCircle className="h-6 w-6 text-white" />
    default:
      return <Clock className="h-6 w-6 text-white" />
  }
}

export default function StatusPedidoClienteModule() {
  const [numeroPedido, setNumeroPedido] = useState("")
  const [telefone, setTelefone] = useState("")
  const [pedidoEncontrado, setPedidoEncontrado] = useState<Pedido | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)

  // Atualizar tempo decorrido a cada minuto
  useEffect(() => {
    if (pedidoEncontrado && pedidoEncontrado.tempoInicioPreparo) {
      const interval = setInterval(() => {
        const agora = new Date()
        const inicio = new Date(pedidoEncontrado.tempoInicioPreparo!)
        const minutos = Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60))
        setTempoDecorrido(minutos)
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [pedidoEncontrado])

  const buscarPedido = () => {
    if (!numeroPedido.trim() || !telefone.trim()) {
      alert("Por favor, preencha o número do pedido e telefone")
      return
    }

    const numeroLimpo = (numeroPedido || "").replace(/[#\s]/g, "")
    const telefoneLimpo = (telefone || "").replace(/\D/g, "")

    console.log("[v0] Buscando pedido:", { numeroLimpo, telefoneLimpo })

    const pedidosControleProducao = JSON.parse(localStorage.getItem("delivery-pricing-controle-producao") || "[]")
    const pedidosVendas = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")

    // Combinar todos os pedidos
    const todosPedidos = [
      ...pedidosControleProducao,
      ...pedidosVendas.map((v: any) => ({
        id: v.id,
        cliente: v.cliente || "Cliente Balcão",
        itens: v.itens || [],
        total: v.total || 0,
        frete: 0,
        status: v.status || "pendente",
        data: v.data || v.dataHora || new Date().toISOString(),
        origem: "vendas",
      })),
    ]

    console.log("[v0] Pedidos encontrados:", todosPedidos)

    const pedido = todosPedidos.find((p: Pedido) => {
      const pedidoIdLimpo = (p.id || "").replace(/[#\s]/g, "")
      const pedidoTelefoneLimpo = (typeof p.cliente === "string" ? "" : p.cliente?.telefone || "").replace(/\D/g, "")

      console.log("[v0] Comparando:", {
        pedidoIdLimpo,
        numeroLimpo,
        pedidoTelefoneLimpo,
        telefoneLimpo,
        match: pedidoIdLimpo === numeroLimpo && pedidoTelefoneLimpo === telefoneLimpo,
      })

      return pedidoIdLimpo === numeroLimpo && pedidoTelefoneLimpo === telefoneLimpo
    })

    if (pedido) {
      // Converter strings de data de volta para Date objects
      pedido.dataHora = new Date(pedido.data || pedido.dataHora)
      if (pedido.tempoInicioPreparo) {
        pedido.tempoInicioPreparo = new Date(pedido.tempoInicioPreparo)
      }
      if (pedido.tempoFinalizacao) {
        pedido.tempoFinalizacao = new Date(pedido.tempoFinalizacao)
      }

      setPedidoEncontrado(pedido)
      setShowDetalhes(true)

      // Calcular tempo decorrido inicial
      if (pedido.tempoInicioPreparo) {
        const agora = new Date()
        const inicio = new Date(pedido.tempoInicioPreparo)
        const minutos = Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60))
        setTempoDecorrido(minutos)
      }
    } else {
      alert("Pedido não encontrado. Verifique o número do pedido e telefone.")
    }
  }

  const calcularTempoRestante = () => {
    if (!pedidoEncontrado || !pedidoEncontrado.tempoInicioPreparo) return null

    const tempoRestante = pedidoEncontrado.tempoEstimado - tempoDecorrido
    return Math.max(0, tempoRestante)
  }

  const getStatusAtual = () => {
    if (!pedidoEncontrado) return null
    return statusConfig[pedidoEncontrado.status] || statusConfig.pendente
  }

  const formatarTelefone = (tel: string) => {
    if (!tel || typeof tel !== "string") return tel || ""
    const numbers = tel.replace(/\D/g, "")
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    return tel
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Acompanhar Pedido</h2>
        <p className="text-muted-foreground">Digite o número do seu pedido e telefone para acompanhar o status</p>
      </div>

      {/* Formulário de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Localizar Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero-pedido">Número do Pedido</Label>
              <Input
                id="numero-pedido"
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                placeholder="Ex: PED1234567890"
              />
            </div>
            <div>
              <Label htmlFor="telefone-busca">Telefone</Label>
              <Input
                id="telefone-busca"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <Button onClick={buscarPedido} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Buscar Pedido
          </Button>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="bg-muted">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Como acompanhar seu pedido:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Digite o número do pedido que você recebeu após a confirmação</li>
            <li>• Informe o telefone usado no pedido</li>
            <li>• Acompanhe o status em tempo real</li>
            <li>• Receba notificações sobre mudanças no status</li>
          </ul>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Status do Pedido</DialogTitle>
            <DialogDescription>Acompanhe o andamento do seu pedido em tempo real</DialogDescription>
          </DialogHeader>

          {pedidoEncontrado && (
            <div className="space-y-6">
              {/* Status Atual */}
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${getStatusAtual()?.color || "bg-gray-500"}`}>
                      {getStatusIcon(pedidoEncontrado.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{getStatusAtual()?.label || "Status Desconhecido"}</h3>
                      <p className="text-muted-foreground">
                        {getStatusAtual()?.description || "Aguardando atualização"}
                      </p>
                    </div>
                  </div>

                  {/* Tempo de Preparo */}
                  {pedidoEncontrado.status === "preparando" && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Tempo em preparo:</span>
                        <span className="text-lg font-bold text-primary">{tempoDecorrido} min</span>
                      </div>
                      {calcularTempoRestante() !== null && (
                        <div className="flex justify-between items-center mt-2">
                          <span>Tempo estimado restante:</span>
                          <span className="font-semibold">{calcularTempoRestante()} min</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações do Pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Número:</span>
                      <span className="font-mono font-semibold">{pedidoEncontrado.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data/Hora:</span>
                      <span>
                        {pedidoEncontrado.dataHora && pedidoEncontrado.dataHora instanceof Date
                          ? pedidoEncontrado.dataHora.toLocaleString("pt-BR")
                          : "Data não disponível"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold text-primary">
                        {typeof pedidoEncontrado.total === "number"
                          ? pedidoEncontrado.total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "R$ 0,00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento:</span>
                      <span className="capitalize">
                        {pedidoEncontrado.formaPagamento && typeof pedidoEncontrado.formaPagamento === "string"
                          ? pedidoEncontrado.formaPagamento
                              .replace(/-/g, " ")
                              .replace("cartao", "cartão")
                              .replace("debito", "débito")
                              .replace("credito", "crédito")
                          : "Não informado"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {typeof pedidoEncontrado.cliente === "string"
                          ? pedidoEncontrado.cliente
                          : pedidoEncontrado.cliente &&
                              typeof pedidoEncontrado.cliente === "object" &&
                              typeof pedidoEncontrado.cliente.nome === "string"
                            ? pedidoEncontrado.cliente.nome
                            : "Cliente"}
                      </span>
                    </div>
                    <div>
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {typeof pedidoEncontrado.cliente === "object" &&
                        pedidoEncontrado.cliente?.telefone &&
                        typeof pedidoEncontrado.cliente.telefone === "string"
                          ? formatarTelefone(pedidoEncontrado.cliente.telefone)
                          : "Telefone não informado"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>
                        {typeof pedidoEncontrado.cliente === "object" &&
                        pedidoEncontrado.cliente?.endereco &&
                        typeof pedidoEncontrado.cliente.endereco === "string"
                          ? pedidoEncontrado.cliente.endereco
                          : "Endereço não informado"}
                      </p>
                      {typeof pedidoEncontrado.cliente === "object" &&
                        pedidoEncontrado.cliente?.complemento &&
                        typeof pedidoEncontrado.cliente.complemento === "string" && (
                          <p>{pedidoEncontrado.cliente.complemento}</p>
                        )}
                      <p>
                        {typeof pedidoEncontrado.cliente === "object" &&
                        pedidoEncontrado.cliente?.bairro &&
                        typeof pedidoEncontrado.cliente.bairro === "string"
                          ? pedidoEncontrado.cliente.bairro
                          : ""}{" "}
                        -{" "}
                        {typeof pedidoEncontrado.cliente === "object" &&
                        pedidoEncontrado.cliente?.cep &&
                        typeof pedidoEncontrado.cliente.cep === "string"
                          ? pedidoEncontrado.cliente.cep
                          : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pedidoEncontrado.itens.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{item.nome}</span>
                          <span className="text-muted-foreground ml-2">x{item.quantidade}</span>
                        </div>
                        <span className="font-semibold">
                          {typeof item.preco === "number" && typeof item.quantidade === "number"
                            ? (item.preco * item.quantidade).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "R$ 0,00"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {typeof pedidoEncontrado.subtotal === "number"
                          ? pedidoEncontrado.subtotal.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "R$ 0,00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>
                        {typeof pedidoEncontrado.frete === "number"
                          ? pedidoEncontrado.frete === 0
                            ? "GRÁTIS"
                            : pedidoEncontrado.frete.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                          : "R$ 0,00"}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">
                        {typeof pedidoEncontrado.total === "number"
                          ? pedidoEncontrado.total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "R$ 0,00"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {pedidoEncontrado.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{pedidoEncontrado.observacoes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Contato */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="font-semibold mb-2">Precisa de ajuda?</p>
                    <p className="text-sm text-muted-foreground">
                      Entre em contato: <strong>(11) 99999-9999</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">WhatsApp disponível das 18h às 23h</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
