"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Clock, CheckCircle, Truck, Package, ChefHat } from "lucide-react"

interface PedidoBD {
  id: string
  numero_pedido: string
  cliente_nome: string
  cliente_telefone: string
  cliente_endereco: string
  cliente_complemento: string
  itens: any[]
  subtotal: number
  taxa_entrega: number
  total: number
  forma_pagamento: string
  status: string
  observacoes_pedido: string
  cliente_observacoes: string
  created_at: string
}

interface DadosEmpresa {
  nome: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url?: string
  cor_primaria: string
  cor_secundaria: string
  descricao?: string
  horario_funcionamento?: string
  redes_sociais?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
}

interface StatusPedidoClienteModuleProps {
  initialNumero?: string
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

export default function StatusPedidoClienteModule({ initialNumero = "" }: StatusPedidoClienteModuleProps) {
  const [numeroPedido, setNumeroPedido] = useState(initialNumero)
  const [pedidoEncontrado, setPedidoEncontrado] = useState<PedidoBD | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [loading, setLoading] = useState(false)

  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: "Minha Empresa",
    telefone: "(11) 99999-9999",
    endereco: "Rua Principal, 123",
    cidade: "São Paulo",
    estado: "SP",
    cor_primaria: "#dc2626",
    cor_secundaria: "#f59e0b",
    descricao: "Delivery de comida deliciosa",
    horario_funcionamento: "Segunda a Sábado: 18h às 23h",
  })

  useEffect(() => {
    const carregarDadosEmpresa = async () => {
      try {
        const response = await fetch("/api/empresa/dados-publicos")
        if (response.ok) {
          const dados = await response.json()
          setDadosEmpresa(dados)
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar dados da empresa:", error)
      }
    }

    carregarDadosEmpresa()
  }, [])

  useEffect(() => {
    if (initialNumero && initialNumero.trim() !== "") {
      buscarPedido()
    }
  }, [initialNumero])

  const buscarPedido = async () => {
    if (!numeroPedido.trim()) {
      alert("Por favor, digite o número do pedido")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Buscando pedido:", numeroPedido)

      const response = await fetch(`/api/pedidos/buscar?numero=${encodeURIComponent(numeroPedido.trim())}`)
      const data = await response.json()

      if (response.ok && data.pedido) {
        console.log("[v0] Pedido encontrado:", data.pedido.numero_pedido)
        setPedidoEncontrado(data.pedido)
        setShowDetalhes(true)
      } else {
        alert("Pedido não encontrado. Verifique o número do pedido.")
      }
    } catch (error) {
      console.error("[v0] Erro na busca:", error)
      alert("Erro ao buscar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusAtual = () => {
    if (!pedidoEncontrado) return null
    return statusConfig[pedidoEncontrado.status as keyof typeof statusConfig] || statusConfig.pendente
  }

  const formatarTelefone = (tel: string) => {
    if (!tel) return "Não informado"
    const numbers = tel.replace(/\D/g, "")
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    return tel
  }

  const formatarFormaPagamento = (forma: string) => {
    if (!forma) return "Não informado"

    const formas: { [key: string]: string } = {
      dinheiro: "DINHEIRO",
      "cartao-debito": "CARTÃO DÉBITO",
      "cartao-credito": "CARTÃO CRÉDITO",
      pix: "PIX",
    }

    return formas[forma.toLowerCase()] || forma.toUpperCase()
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Acompanhar Pedido</h2>
        <p className="text-muted-foreground">Digite o número do seu pedido para acompanhar o status em tempo real</p>
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
          <div>
            <Label htmlFor="numero-pedido">Número do Pedido</Label>
            <Input
              id="numero-pedido"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Ex: PED1234567890"
              className="text-lg"
              onKeyPress={(e) => e.key === "Enter" && buscarPedido()}
            />
          </div>

          <Button onClick={buscarPedido} className="w-full" size="lg" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Buscando..." : "Buscar Pedido"}
          </Button>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="bg-muted">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Como acompanhar seu pedido:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Digite o número do pedido que você recebeu</li>
            <li>• Acompanhe o status em tempo real</li>
            <li>• Veja todos os produtos do seu pedido</li>
            <li>• Receba informações sobre tempo de entrega</li>
          </ul>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="text-center space-y-4 mb-4">
              {dadosEmpresa.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={dadosEmpresa.logo_url || "/placeholder.svg"}
                    alt={`Logo ${dadosEmpresa.nome}`}
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      console.log("[v0] Erro ao carregar logo da empresa:", e)
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}

              <h1 className="font-serif text-2xl font-bold text-gray-800 tracking-wide">{dadosEmpresa.nome}</h1>
            </div>

            <DialogTitle>Comprovante do Pedido</DialogTitle>
            <DialogDescription>Detalhes completos do seu pedido</DialogDescription>
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
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 font-mono text-sm bg-white">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 font-sans">Comprovante de Pedido</div>
                    </div>

                    <div className="border-t-2 border-gray-300 my-4"></div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Pedido:</span>
                        <span className="font-bold text-lg">{pedidoEncontrado.numero_pedido}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Data:</span>
                        <span>{formatarData(pedidoEncontrado.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Cliente:</span>
                        <span className="font-medium">{pedidoEncontrado.cliente_nome || "Cliente"}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 my-4"></div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800 text-base">Itens do Pedido</h3>
                      {pedidoEncontrado.itens && pedidoEncontrado.itens.length > 0 ? (
                        <div className="space-y-3">
                          {pedidoEncontrado.itens.map((item: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  {item.imagem_url ? (
                                    <img
                                      src={item.imagem_url || "/placeholder.svg"}
                                      alt={item.nome}
                                      className="w-12 h-12 object-cover rounded border"
                                      onError={(e) => {
                                        e.currentTarget.src = "/generic-product-display.png"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                      <span className="text-xs text-gray-500">🍽️</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800">
                                        {item.quantidade}x {item.nome}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        Valor unitário:{" "}
                                        {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </div>
                                    </div>
                                    <div className="font-semibold text-gray-800">
                                      {(item.preco * item.quantidade).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </div>
                                  </div>

                                  {/* Personalizações */}
                                  {item.personalizacoes && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {item.personalizacoes.retirar && item.personalizacoes.retirar.length > 0 && (
                                        <div>• Retirar: {item.personalizacoes.retirar.join(", ")}</div>
                                      )}
                                      {item.personalizacoes.adicionar && item.personalizacoes.adicionar.length > 0 && (
                                        <div>• Adicionar: {item.personalizacoes.adicionar.join(", ")}</div>
                                      )}
                                    </div>
                                  )}

                                  {/* Observações do item */}
                                  {item.observacoes && (
                                    <div className="text-xs text-gray-600 mt-1">• Obs: {item.observacoes}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">Nenhum item encontrado</div>
                      )}
                    </div>

                    <div className="border-t-2 border-gray-300 my-4"></div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h3 className="font-semibold text-gray-800 text-base mb-3">Resumo do Pedido</h3>

                      <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">
                          {pedidoEncontrado.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-700">Taxa de entrega:</span>
                        <span className="font-medium">
                          {pedidoEncontrado.taxa_entrega === 0
                            ? "GRÁTIS"
                            : pedidoEncontrado.taxa_entrega.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                        </span>
                      </div>

                      <div className="border-t border-gray-300 pt-2 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-gray-800">Total:</span>
                          <span className="font-bold text-xl text-green-600">
                            {pedidoEncontrado.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-700 mb-1">Forma de Pagamento</div>
                      <div className="font-bold text-lg text-blue-800">
                        {formatarFormaPagamento(pedidoEncontrado.forma_pagamento)}
                      </div>
                      <div className="mt-2">
                        {pedidoEncontrado.forma_pagamento === "pagamento-na-entrega" ? (
                          <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            💰 Pagar na Entrega
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ✅ Pagamento Confirmado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Observações */}
                    {(pedidoEncontrado.observacoes_pedido || pedidoEncontrado.cliente_observacoes) && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">📝 Observações</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          {pedidoEncontrado.observacoes_pedido && <div>• {pedidoEncontrado.observacoes_pedido}</div>}
                          {pedidoEncontrado.cliente_observacoes && <div>• {pedidoEncontrado.cliente_observacoes}</div>}
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">Obrigado pela preferência! 🙏</div>
                      <div className="text-xs text-gray-500 mt-1">Acompanhe seu pedido em tempo real</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">Precisa de ajuda?</h3>
                    <p className="mb-2">
                      Entre em contato: <strong>{dadosEmpresa.telefone}</strong>
                    </p>
                    <p className="text-sm opacity-90">
                      {dadosEmpresa.horario_funcionamento || "WhatsApp disponível das 18h às 23h"}
                    </p>
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
