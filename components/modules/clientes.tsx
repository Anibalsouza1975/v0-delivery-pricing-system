"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Cliente {
  nome: string
  telefone: string
  endereco?: string
  total_pedidos: number
  total_gasto: number
  ultimo_pedido: string
}

interface Pedido {
  id: string
  numero_pedido: string
  cliente_nome: string
  cliente_telefone: string
  cliente_endereco?: string
  total: number
  taxa_entrega: number
  subtotal: number
  forma_pagamento: string
  status: string
  observacoes?: string
  created_at: string
  itens?: any
}

export default function ClientesModule() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [buscaTexto, setBuscaTexto] = useState("")
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState("todos")
  const [visualizacaoTabela, setVisualizacaoTabela] = useState(true)
  const [ordenacao, setOrdenacao] = useState("alfabetica-az")
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [dialogPedidoAberto, setDialogPedidoAberto] = useState(false)
  const [migrandoClientes, setMigrandoClientes] = useState(false)

  const supabase = createClient()

  const carregarClientes = async () => {
    setLoading(true)
    try {
      const { data: clientesData, error } = await supabase
        .from("clientes")
        .select("*")
        .order("ultimo_pedido_at", { ascending: false, nullsFirst: false })

      if (error) throw error

      const clientesFormatados: Cliente[] =
        clientesData?.map((c) => ({
          nome: c.nome,
          telefone: c.telefone,
          endereco: c.endereco,
          total_pedidos: c.total_pedidos || 0,
          total_gasto: c.total_gasto || 0,
          ultimo_pedido: c.ultimo_pedido_at || c.created_at,
        })) || []

      setClientes(clientesFormatados)
      setClientesFiltrados(clientesFormatados)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  useEffect(() => {
    if (!buscaTexto.trim()) {
      setClientesFiltrados(clientes)
      return
    }

    const texto = buscaTexto.toLowerCase()
    const filtrados = clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(texto) ||
        cliente.telefone.toLowerCase().includes(texto) ||
        (cliente.endereco && cliente.endereco.toLowerCase().includes(texto)),
    )
    setClientesFiltrados(filtrados)
  }, [buscaTexto, clientes])

  const carregarPedidosCliente = async (cliente: Cliente) => {
    try {
      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_telefone", cliente.telefone)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPedidosCliente(pedidos || [])
      setClienteSelecionado(cliente)
      setDialogAberto(true)
    } catch (error) {
      console.error("Erro ao carregar pedidos do cliente:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pendente: "bg-yellow-500",
      preparando: "bg-blue-500",
      pronto: "bg-green-500",
      entregue: "bg-emerald-500",
      cancelado: "bg-red-500",
    }
    return statusMap[status.toLowerCase()] || "bg-gray-500"
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const clientesAtivos = clientesFiltrados.filter((c) => {
    const diasDesdeUltimoPedido = Math.floor((Date.now() - new Date(c.ultimo_pedido).getTime()) / (1000 * 60 * 60 * 24))
    return diasDesdeUltimoPedido <= 30
  })

  const clientesInativos = clientesFiltrados.filter((c) => {
    const diasDesdeUltimoPedido = Math.floor((Date.now() - new Date(c.ultimo_pedido).getTime()) / (1000 * 60 * 60 * 24))
    return diasDesdeUltimoPedido > 30
  })

  const clientesVIP = clientesFiltrados.filter((c) => c.total_pedidos >= 5 || c.total_gasto >= 500)

  const ordenarClientes = (lista: Cliente[]) => {
    const listaOrdenada = [...lista]

    switch (ordenacao) {
      case "alfabetica-az":
        return listaOrdenada.sort((a, b) => a.nome.localeCompare(b.nome))
      case "alfabetica-za":
        return listaOrdenada.sort((a, b) => b.nome.localeCompare(a.nome))
      case "maior-gasto":
        return listaOrdenada.sort((a, b) => b.total_gasto - a.total_gasto)
      case "menor-gasto":
        return listaOrdenada.sort((a, b) => a.total_gasto - b.total_gasto)
      case "mais-pedidos":
        return listaOrdenada.sort((a, b) => b.total_pedidos - a.total_pedidos)
      case "menos-pedidos":
        return listaOrdenada.sort((a, b) => a.total_pedidos - b.total_pedidos)
      case "ultimo-pedido":
        return listaOrdenada.sort((a, b) => new Date(b.ultimo_pedido).getTime() - new Date(a.ultimo_pedido).getTime())
      case "primeiro-pedido":
        return listaOrdenada.sort((a, b) => new Date(a.ultimo_pedido).getTime() - new Date(b.ultimo_pedido).getTime())
      default:
        return listaOrdenada
    }
  }

  const carregarDetalhesPedido = async (pedido: Pedido) => {
    try {
      if (!pedido.itens) {
        const { data, error } = await supabase.from("pedidos").select("*").eq("id", pedido.id).single()

        if (error) throw error
        setPedidoSelecionado(data)
      } else {
        setPedidoSelecionado(pedido)
      }
      setDialogPedidoAberto(true)
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error)
    }
  }

  const renderTabelaClientes = (lista: Cliente[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead>Último Pedido</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((cliente) => (
              <TableRow
                key={cliente.telefone}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => carregarPedidosCliente(cliente)}
              >
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>{cliente.telefone}</TableCell>
                <TableCell className="max-w-xs truncate">{cliente.endereco || "-"}</TableCell>
                <TableCell className="text-center">{cliente.total_pedidos}</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {cliente.total_gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatarData(cliente.ultimo_pedido)}</TableCell>
                <TableCell className="text-center">
                  {cliente.total_pedidos >= 5 || cliente.total_gasto >= 500 ? (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">VIP</Badge>
                  ) : (
                    <Badge variant="outline">Regular</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderListaClientes = (lista: Cliente[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {lista.map((cliente) => (
        <Card
          key={cliente.telefone}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => carregarPedidosCliente(cliente)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {cliente.telefone}
                  </CardDescription>
                </div>
              </div>
              {(cliente.total_pedidos >= 5 || cliente.total_gasto >= 500) && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">VIP</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cliente.endereco && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{cliente.endereco}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <ShoppingBag className="h-3 w-3" />
                  Pedidos
                </div>
                <div className="text-lg font-bold text-orange-600">{cliente.total_pedidos}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" />
                  Total Gasto
                </div>
                <div className="text-lg font-bold text-green-600">
                  {cliente.total_gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Último pedido: {formatarData(cliente.ultimo_pedido)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const migrarClientesExistentes = async () => {
    setMigrandoClientes(true)
    try {
      const response = await fetch("/api/clientes/migrar", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        alert(
          `✅ Migração concluída!\n\n` +
            `Clientes migrados: ${data.clientesMigrados}\n` +
            `Pedidos atualizados: ${data.pedidosAtualizados}`,
        )
        // Recarregar clientes
        await carregarClientes()
      } else {
        alert(`❌ Erro na migração: ${data.details || data.error}`)
      }
    } catch (error) {
      console.error("Erro ao migrar clientes:", error)
      alert("❌ Erro ao migrar clientes. Verifique o console para mais detalhes.")
    } finally {
      setMigrandoClientes(false)
    }
  }

  return (
    <div className="space-y-6">
      {clientes.length === 0 && !loading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Importar Clientes Existentes</h3>
                  <p className="text-sm text-orange-700">
                    Encontramos pedidos no sistema. Clique para importar os clientes automaticamente.
                  </p>
                </div>
              </div>
              <Button
                onClick={migrarClientesExistentes}
                disabled={migrandoClientes}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {migrandoClientes ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Importar Clientes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{clientesAtivos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{clientesVIP.length}</div>
            <p className="text-xs text-muted-foreground mt-1">5+ pedidos ou R$500+</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {clientes.length > 0
                ? (clientes.reduce((acc, c) => acc + c.total_gasto, 0) / clientes.length).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "R$ 0,00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou endereço..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={carregarClientes} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="visualizacao"
                    checked={visualizacaoTabela}
                    onCheckedChange={(checked) => setVisualizacaoTabela(checked as boolean)}
                  />
                  <Label htmlFor="visualizacao" className="flex items-center gap-2 cursor-pointer">
                    {visualizacaoTabela ? (
                      <>
                        <List className="h-4 w-4" />
                        Visualização em Tabela
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="h-4 w-4" />
                        Visualização em Cards
                      </>
                    )}
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={ordenacao} onValueChange={setOrdenacao}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alfabetica-az">Nome (A-Z)</SelectItem>
                    <SelectItem value="alfabetica-za">Nome (Z-A)</SelectItem>
                    <SelectItem value="maior-gasto">Maior Gasto</SelectItem>
                    <SelectItem value="menor-gasto">Menor Gasto</SelectItem>
                    <SelectItem value="mais-pedidos">Mais Pedidos</SelectItem>
                    <SelectItem value="menos-pedidos">Menos Pedidos</SelectItem>
                    <SelectItem value="ultimo-pedido">Último Pedido (Recente)</SelectItem>
                    <SelectItem value="primeiro-pedido">Último Pedido (Antigo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos ({clientesFiltrados.length})</TabsTrigger>
          <TabsTrigger value="ativos">Ativos ({clientesAtivos.length})</TabsTrigger>
          <TabsTrigger value="vip">VIP ({clientesVIP.length})</TabsTrigger>
          <TabsTrigger value="inativos">Inativos ({clientesInativos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </CardContent>
            </Card>
          ) : visualizacaoTabela ? (
            renderTabelaClientes(ordenarClientes(clientesFiltrados))
          ) : (
            renderListaClientes(ordenarClientes(clientesFiltrados))
          )}
        </TabsContent>

        <TabsContent value="ativos" className="mt-6">
          {clientesAtivos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente ativo nos últimos 30 dias</p>
              </CardContent>
            </Card>
          ) : visualizacaoTabela ? (
            renderTabelaClientes(ordenarClientes(clientesAtivos))
          ) : (
            renderListaClientes(ordenarClientes(clientesAtivos))
          )}
        </TabsContent>

        <TabsContent value="vip" className="mt-6">
          {clientesVIP.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente VIP ainda</p>
              </CardContent>
            </Card>
          ) : visualizacaoTabela ? (
            renderTabelaClientes(ordenarClientes(clientesVIP))
          ) : (
            renderListaClientes(ordenarClientes(clientesVIP))
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-6">
          {clientesInativos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente inativo</p>
              </CardContent>
            </Card>
          ) : visualizacaoTabela ? (
            renderTabelaClientes(ordenarClientes(clientesInativos))
          ) : (
            renderListaClientes(ordenarClientes(clientesInativos))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              {clienteSelecionado?.nome}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {clienteSelecionado?.telefone}
                </div>
                {clienteSelecionado?.endereco && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {clienteSelecionado.endereco}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ShoppingBag className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold">{clienteSelecionado?.total_pedidos}</div>
                    <div className="text-xs text-muted-foreground">Total de Pedidos</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {clienteSelecionado?.total_gasto.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Gasto</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {clienteSelecionado && clienteSelecionado.total_pedidos > 0
                        ? (clienteSelecionado.total_gasto / clienteSelecionado.total_pedidos).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "R$ 0,00"}
                    </div>
                    <div className="text-xs text-muted-foreground">Ticket Médio</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Histórico de Pedidos</h3>
              <div className="space-y-3">
                {pedidosCliente.map((pedido) => (
                  <Card
                    key={pedido.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => carregarDetalhesPedido(pedido)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold">Pedido #{pedido.numero_pedido}</div>
                          <div className="text-sm text-muted-foreground">{formatarData(pedido.created_at)}</div>
                        </div>
                        <Badge className={getStatusColor(pedido.status)}>{pedido.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subtotal:</span>{" "}
                          <span className="font-semibold">
                            {pedido.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taxa Entrega:</span>{" "}
                          <span className="font-semibold">
                            {pedido.taxa_entrega.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{" "}
                          <span className="font-semibold text-green-600">
                            {pedido.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pagamento:</span>{" "}
                          <span className="font-semibold">{pedido.forma_pagamento}</span>
                        </div>
                      </div>
                      {pedido.observacoes && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <span className="text-muted-foreground">Observações:</span> {pedido.observacoes}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
                        Clique para ver detalhes completos do pedido
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogPedidoAberto} onOpenChange={setDialogPedidoAberto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes do Pedido #{pedidoSelecionado?.numero_pedido}</DialogTitle>
            <DialogDescription className="text-base font-semibold text-foreground mt-2">
              {pedidoSelecionado && formatarData(pedidoSelecionado.created_at)}
            </DialogDescription>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(pedidoSelecionado.status)} className="text-sm px-3 py-1">
                  {pedidoSelecionado.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Pagamento: <span className="font-semibold">{pedidoSelecionado.forma_pagamento}</span>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{pedidoSelecionado.cliente_nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{pedidoSelecionado.cliente_telefone}</span>
                  </div>
                  {pedidoSelecionado.cliente_endereco && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{pedidoSelecionado.cliente_endereco}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  {pedidoSelecionado.itens && typeof pedidoSelecionado.itens === "object" ? (
                    <div className="space-y-3">
                      {Array.isArray(pedidoSelecionado.itens) ? (
                        pedidoSelecionado.itens.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-start pb-3 border-b last:border-0">
                            <div className="flex-1">
                              <div className="font-medium">{item.nome || item.produto}</div>
                              <div className="text-sm text-muted-foreground">
                                Quantidade: {item.quantidade} x{" "}
                                {(item.preco || item.valor || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </div>
                              {item.observacoes && (
                                <div className="text-xs text-muted-foreground mt-1">Obs: {item.observacoes}</div>
                              )}
                            </div>
                            <div className="font-semibold">
                              {((item.preco || item.valor || 0) * item.quantidade).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Detalhes dos itens não disponíveis</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Detalhes dos itens não disponíveis</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">
                      {pedidoSelecionado.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de Entrega:</span>
                    <span className="font-semibold">
                      {pedidoSelecionado.taxa_entrega.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-green-600">
                      {pedidoSelecionado.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {pedidoSelecionado.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{pedidoSelecionado.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
