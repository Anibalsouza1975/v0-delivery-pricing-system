"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  CreditCard,
  CheckCircle,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react"
import { useDatabasePricing } from "@/components/database-pricing-context"

interface ItemVenda {
  id: string
  tipo: "produto" | "bebida" | "combo"
  nome: string
  preco: number
  quantidade: number
  observacoes?: string
}

interface Venda {
  id: string
  data: string
  cliente: {
    nome: string
    telefone: string
    endereco: string
  }
  itens: ItemVenda[]
  subtotal: number
  desconto: number
  frete: number
  total: number
  formaPagamento: string
  status: "pendente" | "confirmado" | "preparando" | "entregue" | "cancelado"
  observacoes?: string
}

export default function VendasModule() {
  const {
    produtos,
    bebidas,
    combos,
    insumos,
    getEstoqueAtualInsumo,
    baixarEstoquePorVenda,
    getInsumosComEstoqueBaixo,
  } = useDatabasePricing()

  const [carrinho, setCarrinho] = useState<ItemVenda[]>([])
  const [vendas, setVendas] = useState<Venda[]>(() => {
    if (typeof window !== "undefined") {
      const vendasSalvas = localStorage.getItem("vendas")
      return vendasSalvas ? JSON.parse(vendasSalvas) : []
    }
    return []
  })
  const [activeTab, setActiveTab] = useState("nova-venda")
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [showEstoqueAlert, setShowEstoqueAlert] = useState(false)

  // Estados do formulário de venda
  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  })
  const [desconto, setDesconto] = useState(0)
  const [frete, setFrete] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState("")
  const [observacoes, setObservacoes] = useState("")

  console.log("[v0] VendasModule carregado")
  console.log("[v0] Produtos:", produtos?.length || 0)
  console.log("[v0] Bebidas:", bebidas?.length || 0)
  console.log("[v0] Combos:", combos?.length || 0)

  const verificarEstoqueSuficiente = (
    produtoId: string,
    quantidadeDesejada: number,
  ): { suficiente: boolean; faltante: { insumo: string; necessario: number; disponivel: number }[] } => {
    const produto = produtos?.find((p) => p.id === produtoId)
    if (!produto) return { suficiente: true, faltante: [] }

    const faltante: { insumo: string; necessario: number; disponivel: number }[] = []

    produto.insumos.forEach(({ insumoId, quantidade: quantidadePorUnidade }) => {
      const quantidadeNecessaria = quantidadePorUnidade * quantidadeDesejada
      const estoqueAtual = getEstoqueAtualInsumo(insumoId)

      if (estoqueAtual < quantidadeNecessaria) {
        const insumo = insumos?.find((i) => i.id === insumoId)
        faltante.push({
          insumo: insumo?.nome || "Insumo não encontrado",
          necessario: quantidadeNecessaria,
          disponivel: estoqueAtual,
        })
      }
    })

    return {
      suficiente: faltante.length === 0,
      faltante,
    }
  }

  const verificarEstoqueCarrinho = () => {
    const problemas: { item: string; faltante: { insumo: string; necessario: number; disponivel: number }[] }[] = []

    carrinho.forEach((item) => {
      if (item.tipo === "produto") {
        const verificacao = verificarEstoqueSuficiente(item.id, item.quantidade)
        if (!verificacao.suficiente) {
          problemas.push({
            item: item.nome,
            faltante: verificacao.faltante,
          })
        }
      }
    })

    return problemas
  }

  // Combinar todos os itens disponíveis
  const itensDisponiveis = useMemo(() => {
    if (!produtos || !bebidas || !combos) {
      console.log("[v0] Dados não carregados ainda")
      return []
    }

    const todosProdutos = produtos.map((p) => ({
      id: p.id,
      tipo: "produto" as const,
      nome: p.nome,
      categoria: p.categoria,
      preco: p.precoVenda,
    }))

    const todasBebidas = bebidas.map((b) => ({
      id: b.id,
      tipo: "bebida" as const,
      nome: b.nome,
      categoria: "Bebidas",
      preco: b.precoVenda,
    }))

    const todosCombos = combos.map((c) => ({
      id: c.id,
      tipo: "combo" as const,
      nome: c.nome,
      categoria: "Combos",
      preco: c.precoFinal,
    }))

    console.log("[v0] Itens disponíveis:", [...todosProdutos, ...todasBebidas, ...todosCombos].length)
    return [...todosProdutos, ...todasBebidas, ...todosCombos]
  }, [produtos, bebidas, combos])

  // Filtrar itens
  const itensFiltrados = useMemo(() => {
    return itensDisponiveis.filter((item) => {
      const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategoria = filtroCategoria === "todos" || item.categoria === filtroCategoria
      return matchSearch && matchCategoria
    })
  }, [itensDisponiveis, searchTerm, filtroCategoria])

  // Categorias únicas
  const categorias = useMemo(() => {
    const cats = [...new Set(itensDisponiveis.map((item) => item.categoria))]
    return cats.sort()
  }, [itensDisponiveis])

  // Cálculos do carrinho
  const subtotal = carrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0)
  const total = subtotal - desconto + frete

  const adicionarAoCarrinho = (item: (typeof itensDisponiveis)[0]) => {
    const itemExistente = carrinho.find((c) => c.id === item.id && c.tipo === item.tipo)
    const quantidadeAtual = itemExistente ? itemExistente.quantidade : 0
    const novaQuantidade = quantidadeAtual + 1

    // Verificar estoque apenas para produtos (bebidas e combos não têm controle de estoque por insumos)
    if (item.tipo === "produto") {
      const verificacao = verificarEstoqueSuficiente(item.id, novaQuantidade)
      if (!verificacao.suficiente) {
        const problemas = verificacao.faltante
          .map((f) => `${f.insumo}: precisa ${f.necessario.toFixed(2)}, disponível ${f.disponivel.toFixed(2)}`)
          .join("\n")

        alert(`Estoque insuficiente para ${item.nome}:\n${problemas}`)
        return
      }
    }

    if (itemExistente) {
      setCarrinho((prev) =>
        prev.map((c) => (c.id === item.id && c.tipo === item.tipo ? { ...c, quantidade: c.quantidade + 1 } : c)),
      )
    } else {
      setCarrinho((prev) => [
        ...prev,
        {
          id: item.id,
          tipo: item.tipo,
          nome: item.nome,
          preco: item.preco,
          quantidade: 1,
        },
      ])
    }
  }

  const atualizarQuantidade = (id: string, tipo: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      setCarrinho((prev) => prev.filter((item) => !(item.id === id && item.tipo === tipo)))
    } else {
      // Verificar estoque apenas para produtos
      if (tipo === "produto") {
        const verificacao = verificarEstoqueSuficiente(id, novaQuantidade)
        if (!verificacao.suficiente) {
          const problemas = verificacao.faltante
            .map((f) => `${f.insumo}: precisa ${f.necessario.toFixed(2)}, disponível ${f.disponivel.toFixed(2)}`)
            .join("\n")

          alert(`Estoque insuficiente:\n${problemas}`)
          return
        }
      }

      setCarrinho((prev) =>
        prev.map((item) => (item.id === id && item.tipo === tipo ? { ...item, quantidade: novaQuantidade } : item)),
      )
    }
  }

  const removerDoCarrinho = (id: string, tipo: string) => {
    setCarrinho((prev) => prev.filter((item) => !(item.id === id && item.tipo === tipo)))
  }

  const finalizarVenda = () => {
    if (carrinho.length === 0 || !cliente.nome || !cliente.telefone) {
      alert("Preencha os dados do cliente e adicione itens ao carrinho")
      return
    }

    // Verificar estoque final antes de finalizar
    const problemasEstoque = verificarEstoqueCarrinho()
    if (problemasEstoque.length > 0) {
      const mensagem = problemasEstoque
        .map(
          (p) =>
            `${p.item}:\n${p.faltante.map((f) => `  - ${f.insumo}: precisa ${f.necessario.toFixed(2)}, disponível ${f.disponivel.toFixed(2)}`).join("\n")}`,
        )
        .join("\n\n")

      alert(`Não é possível finalizar a venda. Estoque insuficiente:\n\n${mensagem}`)
      return
    }

    const novaVenda: Venda = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      cliente,
      itens: [...carrinho],
      subtotal,
      desconto,
      frete,
      total,
      formaPagamento,
      status: "pendente",
      observacoes,
    }

    const produtosVendidos = carrinho
      .filter((item) => item.tipo === "produto")
      .map((item) => ({ produtoId: item.id, quantidade: item.quantidade }))

    if (produtosVendidos.length > 0) {
      baixarEstoquePorVenda(novaVenda.id, produtosVendidos)
      console.log("[v0] Estoque baixado automaticamente para venda:", novaVenda.id)
    }

    const vendasAtualizadas = [novaVenda, ...vendas]
    setVendas(vendasAtualizadas)
    localStorage.setItem("vendas", JSON.stringify(vendasAtualizadas))

    const pedidosExistentes = JSON.parse(localStorage.getItem("pedidos") || "[]")
    const novoPedido = {
      id: `PED${novaVenda.id}`,
      cliente: {
        nome: novaVenda.cliente.nome,
        telefone: novaVenda.cliente.telefone,
        endereco: novaVenda.cliente.endereco,
        complemento: "",
        observacoes: novaVenda.observacoes || "",
        formaPagamento: novaVenda.formaPagamento,
      },
      itens: novaVenda.itens.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        preco: item.preco,
        observacoes: item.observacoes || "",
      })),
      total: novaVenda.total,
      frete: novaVenda.frete,
      status: "pendente",
      data: novaVenda.data,
      origem: "vendas",
    }

    const pedidosAtualizados = [novoPedido, ...pedidosExistentes]
    localStorage.setItem("pedidos", JSON.stringify(pedidosAtualizados))

    // Limpar formulário
    setCarrinho([])
    setCliente({ nome: "", telefone: "", endereco: "" })
    setDesconto(0)
    setFrete(0)
    setFormaPagamento("")
    setObservacoes("")

    alert("Venda registrada com sucesso! Estoque atualizado automaticamente.")
    setActiveTab("historico")
  }

  const atualizarStatusVenda = (vendaId: string, novoStatus: Venda["status"]) => {
    const vendasAtualizadas = vendas.map((venda) => (venda.id === vendaId ? { ...venda, status: novoStatus } : venda))
    setVendas(vendasAtualizadas)
    localStorage.setItem("vendas", JSON.stringify(vendasAtualizadas))

    const pedidosExistentes = JSON.parse(localStorage.getItem("pedidos") || "[]")
    const pedidosAtualizados = pedidosExistentes.map((pedido: any) =>
      pedido.id === `PED${vendaId}` ? { ...pedido, status: novoStatus } : pedido,
    )
    localStorage.setItem("pedidos", JSON.stringify(pedidosAtualizados))
  }

  const getStatusColor = (status: Venda["status"]) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-500"
      case "confirmado":
        return "bg-blue-500"
      case "preparando":
        return "bg-orange-500"
      case "entregue":
        return "bg-green-500"
      case "cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const totalVendasHoje = vendas
    .filter((v) => {
      const hoje = new Date().toDateString()
      const vendaData = new Date(v.data).toDateString()
      return vendaData === hoje && v.status !== "cancelado"
    })
    .reduce((sum, v) => sum + v.total, 0)

  const vendasHoje = vendas.filter((v) => {
    const hoje = new Date().toDateString()
    const vendaData = new Date(v.data).toDateString()
    return vendaData === hoje
  }).length

  const insumosEstoqueBaixo = getInsumosComEstoqueBaixo ? getInsumosComEstoqueBaixo(10) : []

  return (
    <div className="space-y-6">
      {insumosEstoqueBaixo.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-2">
              {insumosEstoqueBaixo.length} insumo(s) com estoque baixo podem afetar a produção:
            </p>
            <div className="flex flex-wrap gap-2">
              {insumosEstoqueBaixo.slice(0, 5).map(({ insumo, quantidadeAtual }) => (
                <Badge key={insumo.id} variant="secondary" className="bg-orange-100 text-orange-700">
                  {insumo.nome}: {quantidadeAtual.toFixed(1)} {insumo.unidade}
                </Badge>
              ))}
              {insumosEstoqueBaixo.length > 5 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  +{insumosEstoqueBaixo.length - 5} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {itensDisponiveis.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Carregando produtos... Se esta mensagem persistir, cadastre alguns produtos primeiro.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header com métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendasHoje}</div>
            <p className="text-xs text-muted-foreground">Pedidos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVendasHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens no Carrinho</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carrinho.length}</div>
            <p className="text-xs text-muted-foreground">Produtos selecionados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Carrinho</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Valor a receber</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nova-venda">Nova Venda</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="nova-venda" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produtos disponíveis */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Disponíveis</CardTitle>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar produtos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat || "categoria-vazia"}>
                            {cat || "Sem categoria"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {itensFiltrados.map((item) => (
                      <Card
                        key={`${item.tipo}-${item.id}`}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{item.nome}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {item.tipo === "produto" ? "Produto" : item.tipo === "bebida" ? "Bebida" : "Combo"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => adicionarAoCarrinho(item)} className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrinho e finalização */}
            <div className="space-y-4">
              {/* Carrinho */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrinho ({carrinho.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrinho.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Carrinho vazio</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {carrinho.map((item, index) => (
                        <div
                          key={`${item.tipo}-${item.id}-${index}`}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} cada
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => atualizarQuantidade(item.id, item.tipo, item.quantidade - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantidade}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => atualizarQuantidade(item.id, item.tipo, item.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removerDoCarrinho(item.id, item.tipo)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados do cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={cliente.nome}
                      onChange={(e) => setCliente((prev) => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={cliente.telefone}
                      onChange={(e) => setCliente((prev) => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Textarea
                      id="endereco"
                      value={cliente.endereco}
                      onChange={(e) => setCliente((prev) => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Endereço completo"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resumo e finalização */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="desconto">Desconto (R$)</Label>
                      <Input
                        id="desconto"
                        type="number"
                        value={desconto}
                        onChange={(e) => setDesconto(Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frete">Frete (R$)</Label>
                      <Input
                        id="frete"
                        type="number"
                        value={frete}
                        onChange={(e) => setFrete(Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pagamento">Forma de Pagamento</Label>
                      <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                          <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações do pedido"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                    {desconto > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto:</span>
                        <span>-{desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                    )}
                    {frete > 0 && (
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>{frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                  </div>

                  <Button onClick={finalizarVenda} className="w-full" size="lg">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>Gerencie e acompanhe todas as vendas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {vendas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma venda registrada ainda</p>
              ) : (
                <div className="space-y-4">
                  {vendas.map((venda) => (
                    <Card key={venda.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">Pedido #{venda.id}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(venda.data).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-sm">
                              <User className="h-3 w-3 inline mr-1" />
                              {venda.cliente.nome} - {venda.cliente.telefone}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(venda.status)}>{venda.status}</Badge>
                            <p className="font-bold text-lg mt-1">
                              {venda.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {venda.itens.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantidade}x {item.nome}
                              </span>
                              <span>
                                {(item.preco * item.quantidade).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Select
                            value={venda.status}
                            onValueChange={(status) => atualizarStatusVenda(venda.id, status as Venda["status"])}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="preparando">Preparando</SelectItem>
                              <SelectItem value="entregue">Entregue</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vendas.length}</div>
                <p className="text-xs text-muted-foreground">Pedidos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Faturamento Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendas
                    .filter((v) => v.status !== "cancelado")
                    .reduce((sum, v) => sum + v.total, 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <p className="text-xs text-muted-foreground">Valor total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendas.filter((v) => v.status !== "cancelado").length > 0
                    ? (
                        vendas.filter((v) => v.status !== "cancelado").reduce((sum, v) => sum + v.total, 0) /
                        vendas.filter((v) => v.status !== "cancelado").length
                      ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : "R$ 0,00"}
                </div>
                <p className="text-xs text-muted-foreground">Por pedido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendas.length > 0
                    ? ((vendas.filter((v) => v.status === "cancelado").length / vendas.length) * 100).toFixed(1)
                    : "0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Pedidos cancelados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {vendas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma venda para análise</p>
              ) : (
                <div className="space-y-2">
                  {/* Aqui você pode implementar a lógica para mostrar produtos mais vendidos */}
                  <p className="text-muted-foreground">Relatório em desenvolvimento...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
