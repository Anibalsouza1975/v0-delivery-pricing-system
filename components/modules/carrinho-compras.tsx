"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { usePricing } from "@/components/pricing-context"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, MapPin, Clock, User, CheckCircle, Truck } from "lucide-react"

interface CartItem {
  id: string
  nome: string
  preco: number
  quantidade: number
  tipo: string
  foto?: string
}

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
  itens: CartItem[]
  subtotal: number
  frete: number
  total: number
  formaPagamento: string
  observacoes: string
  status: "pendente" | "confirmado" | "preparando" | "pronto" | "entregue"
  dataHora: Date
  tempoEstimado: number
}

export default function CarrinhoComprasModule() {
  const { produtos, bebidas, combos } = usePricing()
  const [carrinho, setCarrinho] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pedidoRealizado, setPedidoRealizado] = useState<Pedido | null>(null)
  const [lojaAberta, setLojaAberta] = useState(true)

  useEffect(() => {
    const verificarStatusLoja = () => {
      const status = localStorage.getItem("lojaAberta")
      const horarioAutomatico = localStorage.getItem("horarioAutomaticoAtivo")

      if (horarioAutomatico === "true") {
        const agora = new Date()
        const diaSemana = agora.getDay()
        const horaAtual = agora.getHours() * 60 + agora.getMinutes()

        const horarios = JSON.parse(localStorage.getItem("horariosLoja") || "{}")
        const horarioHoje = horarios[diaSemana]

        if (horarioHoje && horarioHoje.ativo) {
          const [inicioH, inicioM] = horarioHoje.inicio.split(":").map(Number)
          const [fimH, fimM] = horarioHoje.fim.split(":").map(Number)
          const inicioMinutos = inicioH * 60 + inicioM
          const fimMinutos = fimH * 60 + fimM

          setLojaAberta(horaAtual >= inicioMinutos && horaAtual <= fimMinutos)
        } else {
          setLojaAberta(false)
        }
      } else {
        setLojaAberta(status !== "false")
      }
    }

    verificarStatusLoja()
    const interval = setInterval(verificarStatusLoja, 60000)

    return () => clearInterval(interval)
  }, [])

  const adicionarAoCarrinho = (item: any, tipo: string) => {
    const itemCarrinho: CartItem = {
      id: `${tipo}-${item.id}`,
      nome: item.nome,
      preco: tipo === "combo" ? item.precoFinal : item.precoVenda,
      quantidade: 1,
      tipo,
      foto: item.foto,
    }

    setCarrinho((prev) => {
      const existente = prev.find((i) => i.id === itemCarrinho.id)
      if (existente) {
        return prev.map((i) => (i.id === itemCarrinho.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      }
      return [...prev, itemCarrinho]
    })
  }

  const removerDoCarrinho = (itemId: string) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== itemId))
  }

  const atualizarQuantidade = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(itemId)
      return
    }

    setCarrinho((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantidade: novaQuantidade } : item)))
  }

  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const calcularFrete = () => {
    const subtotal = calcularSubtotal()
    return subtotal >= 30 ? 0 : 8.9
  }

  const calcularTotal = () => {
    return calcularSubtotal() + calcularFrete()
  }

  const finalizarPedido = () => {
    if (!lojaAberta) {
      alert("Desculpe, a loja está fechada no momento. Não é possível finalizar pedidos.")
      return
    }

    const novoPedido: Pedido = {
      id: `PED${Date.now()}`,
      cliente: dadosCliente,
      itens: carrinho,
      subtotal: calcularSubtotal(),
      frete: calcularFrete(),
      total: calcularTotal(),
      formaPagamento: dadosPedido.formaPagamento,
      observacoes: dadosPedido.observacoes || "",
      status: "pendente",
      dataHora: new Date(),
      tempoEstimado: 35,
    }

    // Salvar pedido no localStorage (em produção seria enviado para API)
    const pedidosExistentes = JSON.parse(localStorage.getItem("pedidos") || "[]")
    pedidosExistentes.push(novoPedido)
    localStorage.setItem("pedidos", JSON.stringify(pedidosExistentes))

    setPedidoRealizado(novoPedido)
    setCarrinho([])
    setShowCheckout(false)
    setShowSuccess(true)

    // Resetar formulários
    setDadosCliente({
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      complemento: "",
      bairro: "",
      cep: "",
    })
    setDadosPedido({
      formaPagamento: "",
      observacoes: "",
    })
  }

  const isFormularioValido = () => {
    return (
      dadosCliente.nome &&
      dadosCliente.telefone &&
      dadosCliente.endereco &&
      dadosCliente.bairro &&
      dadosCliente.cep &&
      dadosPedido.formaPagamento
    )
  }

  // Adicionar alguns itens de exemplo para demonstração
  const adicionarItensExemplo = () => {
    if (produtos.length > 0) {
      adicionarAoCarrinho(produtos[0], "produto")
    }
    if (bebidas.length > 0) {
      adicionarAoCarrinho(bebidas[0], "bebida")
    }
  }

  const [dadosCliente, setDadosCliente] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    complemento: "",
    bairro: "",
    cep: "",
  })

  const [dadosPedido, setDadosPedido] = useState({
    formaPagamento: "",
    observacoes: "",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carrinho de Compras</h2>
          <p className="text-muted-foreground">
            {carrinho.length === 0
              ? "Seu carrinho está vazio"
              : `${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"} no carrinho`}
          </p>
        </div>

        {carrinho.length === 0 && (
          <Button onClick={adicionarItensExemplo} variant="outline">
            Adicionar Itens de Exemplo
          </Button>
        )}
      </div>

      {carrinho.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Carrinho Vazio</h3>
            <p className="text-muted-foreground mb-4">Adicione produtos ao seu carrinho para continuar com o pedido.</p>
            <Button onClick={() => window.location.reload()}>Ver Cardápio</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Itens do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Seus Itens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {carrinho.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={item.foto || `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.nome)}`}
                      alt={item.nome}
                      className="w-16 h-16 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h4 className="font-semibold">{item.nome}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{item.tipo}</p>
                      <p className="font-bold text-primary">
                        {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantidade}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{calcularSubtotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className={calcularFrete() === 0 ? "text-green-600 font-semibold" : ""}>
                      {calcularFrete() === 0
                        ? "GRÁTIS"
                        : calcularFrete().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  {calcularSubtotal() < 30 && (
                    <p className="text-xs text-muted-foreground">
                      Adicione mais{" "}
                      {(30 - calcularSubtotal()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} para
                      frete grátis
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {calcularTotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Tempo estimado: 25-40 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Entrega em domicílio</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)} disabled={!lojaAberta}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {lojaAberta ? "Finalizar Pedido" : "Loja Fechada"}
                </Button>

                {!lojaAberta && (
                  <p className="text-xs text-center text-destructive mt-2">
                    Estamos fechados no momento. Volte em breve!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>Preencha seus dados para concluir o pedido</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={dadosCliente.nome}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={dadosCliente.telefone}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dadosCliente.email}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={dadosCliente.endereco}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, endereco: e.target.value })}
                    placeholder="Rua, número"
                  />
                </div>
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={dadosCliente.complemento}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, complemento: e.target.value })}
                    placeholder="Apto, bloco, etc"
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={dadosCliente.bairro}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, bairro: e.target.value })}
                    placeholder="Nome do bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={dadosCliente.cep}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Forma de Pagamento
              </h3>

              <Select
                value={dadosPedido.formaPagamento}
                onValueChange={(value) => setDadosPedido({ ...dadosPedido, formaPagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pagamento-na-entrega">Pagamento na Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={dadosPedido.observacoes}
                onChange={(e) => setDadosPedido({ ...dadosPedido, observacoes: e.target.value })}
                placeholder="Alguma observação especial para seu pedido?"
                rows={3}
              />
            </div>

            {/* Resumo Final */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{calcularSubtotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>
                      {calcularFrete() === 0
                        ? "GRÁTIS"
                        : calcularFrete().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      {calcularTotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Voltar
            </Button>
            <Button
              onClick={finalizarPedido}
              disabled={!isFormularioValido() || !lojaAberta}
              className="bg-primary hover:bg-primary/90"
            >
              {lojaAberta ? "Confirmar Pedido" : "Loja Fechada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Pedido Realizado com Sucesso!</DialogTitle>
            <DialogDescription className="text-center">
              Seu pedido foi recebido e está sendo preparado
            </DialogDescription>
          </DialogHeader>

          {pedidoRealizado && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Número do Pedido:</span>
                      <span className="font-mono">{pedidoRealizado.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-primary">
                        {pedidoRealizado.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Tempo Estimado:</span>
                      <span>{pedidoRealizado.tempoEstimado} minutos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Status:</span>
                      <Badge variant="secondary">Confirmado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                <p>Você receberá atualizações sobre o status do seu pedido</p>
                <p>Em caso de dúvidas, entre em contato: (11) 99999-9999</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              Continuar Comprando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
