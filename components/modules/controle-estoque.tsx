"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { usePricing } from "@/components/pricing-context-supabase"
import { Package, TrendingUp, AlertTriangle, History, ShoppingCart } from "lucide-react"

export default function ControleEstoque() {
  const {
    ingredientesBase,
    insumos,
    estoqueInsumos,
    comprasInsumos,
    registrarCompra,
    getEstoqueAtual,
    addNotificacao,
  } = usePricing()

  const [selectedTab, setSelectedTab] = useState("estoque")
  const [isCompraDialogOpen, setIsCompraDialogOpen] = useState(false)

  const [novaCompra, setNovaCompra] = useState({
    insumoId: "",
    quantidade: "",
    precoUnitario: "",
  })

  const getEstoqueAtualIngrediente = (ingredienteBaseId: string): number => {
    // Encontrar todos os insumos relacionados a este ingrediente base
    const insumosRelacionados = insumos.filter((i) => i.ingrediente_base_id === ingredienteBaseId)

    // Somar o estoque de todos os insumos relacionados
    return insumosRelacionados.reduce((total, insumo) => {
      return total + getEstoqueAtual(insumo.id)
    }, 0)
  }

  const handleAddCompra = async () => {
    if (!novaCompra.insumoId || !novaCompra.quantidade || !novaCompra.precoUnitario) return

    try {
      await registrarCompra(
        novaCompra.insumoId,
        Number.parseFloat(novaCompra.quantidade),
        Number.parseFloat(novaCompra.precoUnitario),
      )

      await addNotificacao({
        titulo: "Compra Registrada",
        mensagem: `Compra de ${novaCompra.quantidade} unidades registrada com sucesso`,
        tipo: "success",
        lida: false,
      })

      setNovaCompra({
        insumoId: "",
        quantidade: "",
        precoUnitario: "",
      })
      setIsCompraDialogOpen(false)
    } catch (error) {
      console.error("[v0] Erro ao registrar compra:", error)
      await addNotificacao({
        titulo: "Erro ao Registrar Compra",
        mensagem: "Ocorreu um erro ao registrar a compra",
        tipo: "error",
        lida: false,
      })
    }
  }

  const ingredientesComEstoque =
    ingredientesBase?.map((ingrediente) => {
      const quantidadeAtual = getEstoqueAtualIngrediente(ingrediente.id)

      // Calcular valor do estoque baseado nas compras
      const insumosRelacionados = insumos.filter((i) => i.ingrediente_base_id === ingrediente.id)
      const valorEstoque = insumosRelacionados.reduce((total, insumo) => {
        const comprasInsumo = comprasInsumos.filter((c) => c.insumo_id === insumo.id && c.quantidade_restante > 0)
        const valorInsumo = comprasInsumo.reduce((subtotal, compra) => {
          return subtotal + compra.quantidade_restante * compra.preco_unitario
        }, 0)
        return total + valorInsumo
      }, 0)

      return {
        ...ingrediente,
        quantidadeAtual,
        valorEstoque,
      }
    }) || []

  const ingredientesEstoqueBaixo = ingredientesComEstoque.filter((i) => i.quantidadeAtual < 10)
  const valorTotalEstoque = ingredientesComEstoque.reduce(
    (total, ingrediente) => total + (ingrediente.valorEstoque || 0),
    0,
  )
  const totalItensEstoque = ingredientesComEstoque.filter((i) => i.quantidadeAtual > 0).length

  const getStatusBadge = (quantidade: number) => {
    if (quantidade === 0) return { variant: "destructive" as const, text: "Sem Estoque" }
    if (quantidade < 10) return { variant: "secondary" as const, text: "Estoque Baixo" }
    if (quantidade < 50) return { variant: "outline" as const, text: "Estoque Médio" }
    return { variant: "default" as const, text: "Estoque OK" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Estoque</h2>
          <p className="text-muted-foreground">Registre compras dos insumos e acompanhe estoque atual</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCompraDialogOpen} onOpenChange={setIsCompraDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Registrar Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Compra</DialogTitle>
                <DialogDescription>Adicione uma nova compra de insumo ao estoque</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="insumo">Insumo</Label>
                  <Select
                    value={novaCompra.insumoId}
                    onValueChange={(value) => setNovaCompra({ ...novaCompra, insumoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos?.map((insumo: any) => {
                        const ingredienteBase = ingredientesBase?.find((i) => i.id === insumo.ingrediente_base_id)
                        return (
                          <SelectItem key={insumo.id} value={insumo.id}>
                            {insumo.nome} - {ingredienteBase?.nome} ({insumo.unidade})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="0.01"
                      value={novaCompra.quantidade}
                      onChange={(e) => setNovaCompra({ ...novaCompra, quantidade: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preco">Preço Unitário</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={novaCompra.precoUnitario}
                      onChange={(e) => setNovaCompra({ ...novaCompra, precoUnitario: e.target.value })}
                      placeholder="Ex: 5.00"
                    />
                  </div>
                </div>

                <Button onClick={handleAddCompra} className="w-full">
                  Registrar Compra
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(valorTotalEstoque || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Investimento em estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredientes em Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItensEstoque}</div>
            <p className="text-xs text-muted-foreground">De {ingredientesBase?.length || 0} cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{ingredientesEstoqueBaixo.length}</div>
            <p className="text-xs text-muted-foreground">Precisam reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Hoje</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                comprasInsumos.filter((c) => new Date(c.data_compra).toDateString() === new Date().toDateString())
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Registradas hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
          <TabsTrigger value="alertas">Alertas de Reposição</TabsTrigger>
          <TabsTrigger value="compras">Histórico de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estoque Atual por Ingrediente Base</CardTitle>
              <CardDescription>Quantidade disponível e valor investido por ingrediente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Quantidade Atual</TableHead>
                      <TableHead className="text-right">Unidade</TableHead>
                      <TableHead className="text-right">Valor em Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesComEstoque.map((ingrediente) => {
                      const status = getStatusBadge(ingrediente.quantidadeAtual)
                      return (
                        <TableRow key={ingrediente.id}>
                          <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ingrediente.categoria}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(ingrediente.quantidadeAtual || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{ingrediente.unidade}</TableCell>
                          <TableCell className="text-right font-mono">
                            {(ingrediente.valorEstoque || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.text}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes com Estoque Baixo</CardTitle>
              <CardDescription>Ingredientes que precisam de reposição urgente</CardDescription>
            </CardHeader>
            <CardContent>
              {ingredientesEstoqueBaixo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum ingrediente com estoque baixo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ingredientesEstoqueBaixo.map((ingrediente) => (
                    <div key={ingrediente.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{ingrediente.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          Estoque atual: {(ingrediente.quantidadeAtual || 0).toFixed(2)} {ingrediente.unidade}
                        </p>
                      </div>
                      <Badge variant="secondary">Repor</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Compras</CardTitle>
              <CardDescription>Todas as compras registradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unitário</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprasInsumos
                      .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())
                      .map((compra) => {
                        const insumo = insumos?.find((i) => i.id === compra.insumo_id)
                        const ingredienteBase = ingredientesBase?.find((i) => i.id === insumo?.ingrediente_base_id)
                        return (
                          <TableRow key={compra.id}>
                            <TableCell>{new Date(compra.data_compra).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">
                              {insumo?.nome || "Insumo não encontrado"}
                              {ingredienteBase && (
                                <div className="text-xs text-muted-foreground">{ingredienteBase.nome}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(compra.quantidade || 0).toFixed(2)} {insumo?.unidade}
                            </TableCell>
                            <TableCell className="text-right">
                              {(compra.preco_unitario || 0).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {((compra.quantidade || 0) * (compra.preco_unitario || 0)).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(compra.quantidade_restante || 0).toFixed(2)} {insumo?.unidade}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
