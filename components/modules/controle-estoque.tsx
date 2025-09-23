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
import { usePricing } from "@/components/pricing-context"
import { Edit, Trash2, Package, TrendingUp, AlertTriangle, History, ShoppingCart } from "lucide-react"

export default function ControleEstoque() {
  const {
    ingredientesBase,
    estoqueInsumos,
    movimentacoesEstoque,
    addEstoqueInsumo,
    updateEstoqueInsumo,
    deleteEstoqueInsumo,
    addMovimentacaoEstoque,
    getEstoqueAtualIngrediente,
  } = usePricing()

  const [selectedTab, setSelectedTab] = useState("estoque")
  const [isCompraDialogOpen, setIsCompraDialogOpen] = useState(false)
  const [isEditCompraDialogOpen, setIsEditCompraDialogOpen] = useState(false)
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<any>(null)

  const [novaCompra, setNovaCompra] = useState({
    ingredienteBaseId: "",
    quantidadeComprada: "",
    tipoEmbalagem: "",
    quantidadeEmbalagem: "",
    precoCompra: "",
    fornecedor: "",
    lote: "",
    dataVencimento: "",
  })

  const [novaMovimentacao, setNovaMovimentacao] = useState({
    ingredienteBaseId: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    motivo: "",
    observacao: "",
  })

  const handleAddCompra = () => {
    if (!novaCompra.ingredienteBaseId || !novaCompra.quantidadeComprada || !novaCompra.precoCompra) return

    let quantidadeTotal = Number.parseFloat(novaCompra.quantidadeComprada)
    if (novaCompra.quantidadeEmbalagem && novaCompra.tipoEmbalagem) {
      const qtdEmbalagem = Number.parseFloat(novaCompra.quantidadeEmbalagem)
      quantidadeTotal = quantidadeTotal * qtdEmbalagem
    }

    const estoque = {
      ingredienteBaseId: novaCompra.ingredienteBaseId,
      quantidadeComprada: quantidadeTotal,
      quantidadeAtual: quantidadeTotal,
      dataCompra: new Date().toISOString(),
      precoCompra: Number.parseFloat(novaCompra.precoCompra),
      fornecedor: novaCompra.fornecedor || undefined,
      lote: novaCompra.lote || undefined,
      dataVencimento: novaCompra.dataVencimento || undefined,
    }

    addEstoqueInsumo(estoque)

    addMovimentacaoEstoque({
      ingredienteBaseId: novaCompra.ingredienteBaseId,
      tipo: "entrada",
      quantidade: quantidadeTotal,
      motivo: "Compra",
      observacao: `Compra de ${quantidadeTotal} unidades${novaCompra.fornecedor ? ` - ${novaCompra.fornecedor}` : ""}`,
    })

    setNovaCompra({
      ingredienteBaseId: "",
      quantidadeComprada: "",
      tipoEmbalagem: "",
      quantidadeEmbalagem: "",
      precoCompra: "",
      fornecedor: "",
      lote: "",
      dataVencimento: "",
    })
    setIsCompraDialogOpen(false)
  }

  const handleEditCompra = () => {
    if (!editingCompra) return

    let quantidadeTotal = Number.parseFloat(novaCompra.quantidadeComprada)
    if (novaCompra.quantidadeEmbalagem && novaCompra.tipoEmbalagem) {
      const qtdEmbalagem = Number.parseFloat(novaCompra.quantidadeEmbalagem)
      quantidadeTotal = quantidadeTotal * qtdEmbalagem
    }

    const diferencaQuantidade = quantidadeTotal - editingCompra.quantidadeComprada
    const novaQuantidadeAtual = editingCompra.quantidadeAtual + diferencaQuantidade

    updateEstoqueInsumo(editingCompra.id, {
      quantidadeComprada: quantidadeTotal,
      quantidadeAtual: Math.max(0, novaQuantidadeAtual),
      precoCompra: Number.parseFloat(novaCompra.precoCompra),
      fornecedor: novaCompra.fornecedor || undefined,
      lote: novaCompra.lote || undefined,
      dataVencimento: novaCompra.dataVencimento || undefined,
    })

    if (diferencaQuantidade !== 0) {
      addMovimentacaoEstoque({
        ingredienteBaseId: editingCompra.ingredienteBaseId,
        tipo: diferencaQuantidade > 0 ? "entrada" : "saida",
        quantidade: Math.abs(diferencaQuantidade),
        motivo: "Ajuste de compra",
        observacao: `Correção de compra - ${diferencaQuantidade > 0 ? "Adição" : "Redução"} de ${Math.abs(diferencaQuantidade)} unidades`,
      })
    }

    setEditingCompra(null)
    setIsEditCompraDialogOpen(false)
  }

  const handleDeleteCompra = (compra: any) => {
    if (confirm("Tem certeza que deseja excluir esta compra? Isso afetará o estoque.")) {
      deleteEstoqueInsumo(compra.id)

      addMovimentacaoEstoque({
        ingredienteBaseId: compra.ingredienteBaseId,
        tipo: "saida",
        quantidade: compra.quantidadeAtual,
        motivo: "Exclusão de compra",
        observacao: `Compra excluída - Remoção de ${compra.quantidadeAtual} unidades`,
      })
    }
  }

  const handleEditarCompra = (compra: any) => {
    setEditingCompra(compra)
    const ingredienteBase = ingredientesBase?.find((i) => i.id === compra.ingredienteBaseId)

    setNovaCompra({
      ingredienteBaseId: compra.ingredienteBaseId,
      quantidadeComprada: compra.quantidadeComprada.toString(),
      tipoEmbalagem: "",
      quantidadeEmbalagem: "",
      precoCompra: compra.precoCompra.toString(),
      fornecedor: compra.fornecedor || "",
      lote: compra.lote || "",
      dataVencimento: compra.dataVencimento || "",
    })
    setIsEditCompraDialogOpen(true)
  }

  const ingredientesComEstoque =
    ingredientesBase?.map((ingrediente) => {
      const quantidadeAtual = getEstoqueAtualIngrediente(ingrediente.id)
      const estoquesIngrediente = estoqueInsumos.filter(
        (e) => e.ingredienteBaseId === ingrediente.id && e.quantidadeAtual > 0,
      )
      const valorEstoque = estoquesIngrediente.reduce((total, e) => {
        const precoUnitario = e.precoCompra / e.quantidadeComprada
        return total + e.quantidadeAtual * precoUnitario
      }, 0)

      return {
        ...ingrediente,
        quantidadeAtual,
        valorEstoque,
      }
    }) || []

  const ingredientesEstoqueBaixo = ingredientesComEstoque.filter((i) => i.quantidadeAtual < 10)
  const valorTotalEstoque = ingredientesComEstoque.reduce((total, ingrediente) => total + ingrediente.valorEstoque, 0)
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
          <p className="text-muted-foreground">Registre compras dos ingredientes base e acompanhe estoque atual</p>
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
                <DialogDescription>Adicione uma nova compra de ingrediente ao estoque</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ingrediente">Ingrediente Base</Label>
                  <Select
                    value={novaCompra.ingredienteBaseId}
                    onValueChange={(value) => setNovaCompra({ ...novaCompra, ingredienteBaseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientesBase?.map((ingrediente: any) => (
                        <SelectItem key={ingrediente.id} value={ingrediente.id}>
                          {ingrediente.nome} ({ingrediente.unidade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade Comprada</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="0.01"
                      value={novaCompra.quantidadeComprada}
                      onChange={(e) => setNovaCompra({ ...novaCompra, quantidadeComprada: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipoEmbalagem">Tipo de Embalagem (Opcional)</Label>
                    <Select
                      value={novaCompra.tipoEmbalagem}
                      onValueChange={(value) => setNovaCompra({ ...novaCompra, tipoEmbalagem: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="pacote">Pacote</SelectItem>
                        <SelectItem value="fardo">Fardo</SelectItem>
                        <SelectItem value="saco">Saco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="qtdEmbalagem">Qtd por Embalagem</Label>
                    <Input
                      id="qtdEmbalagem"
                      type="number"
                      value={novaCompra.quantidadeEmbalagem}
                      onChange={(e) => setNovaCompra({ ...novaCompra, quantidadeEmbalagem: e.target.value })}
                      placeholder="Ex: 24"
                    />
                  </div>
                </div>

                {novaCompra.quantidadeComprada && novaCompra.quantidadeEmbalagem && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Total calculado:</strong>{" "}
                      {Number.parseFloat(novaCompra.quantidadeComprada) *
                        Number.parseFloat(novaCompra.quantidadeEmbalagem)}{" "}
                      unidades
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preco">Preço Total da Compra</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={novaCompra.precoCompra}
                      onChange={(e) => setNovaCompra({ ...novaCompra, precoCompra: e.target.value })}
                      placeholder="Ex: 50.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fornecedor">Fornecedor (Opcional)</Label>
                    <Input
                      id="fornecedor"
                      value={novaCompra.fornecedor}
                      onChange={(e) => setNovaCompra({ ...novaCompra, fornecedor: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lote">Lote (Opcional)</Label>
                    <Input
                      id="lote"
                      value={novaCompra.lote}
                      onChange={(e) => setNovaCompra({ ...novaCompra, lote: e.target.value })}
                      placeholder="Número do lote"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vencimento">Data de Vencimento (Opcional)</Label>
                    <Input
                      id="vencimento"
                      type="date"
                      value={novaCompra.dataVencimento}
                      onChange={(e) => setNovaCompra({ ...novaCompra, dataVencimento: e.target.value })}
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
              {valorTotalEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
              {estoqueInsumos.filter((e) => new Date(e.dataCompra).toDateString() === new Date().toDateString()).length}
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
                            {ingrediente.quantidadeAtual.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{ingrediente.unidade}</TableCell>
                          <TableCell className="text-right font-mono">
                            {ingrediente.valorEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
                          Estoque atual: {ingrediente.quantidadeAtual.toFixed(2)} {ingrediente.unidade}
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
                      <TableHead>Ingrediente</TableHead>
                      <TableHead className="text-right">Qtd Comprada</TableHead>
                      <TableHead className="text-right">Qtd Atual</TableHead>
                      <TableHead className="text-right">Preço Pago</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoqueInsumos
                      .sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime())
                      .map((compra) => {
                        const ingrediente = ingredientesBase?.find((i) => i.id === compra.ingredienteBaseId)
                        return (
                          <TableRow key={compra.id}>
                            <TableCell>{new Date(compra.dataCompra).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">
                              {ingrediente?.nome || "Ingrediente não encontrado"}
                            </TableCell>
                            <TableCell className="text-right">
                              {compra.quantidadeComprada.toFixed(2)} {ingrediente?.unidade}
                            </TableCell>
                            <TableCell className="text-right">
                              {compra.quantidadeAtual.toFixed(2)} {ingrediente?.unidade}
                            </TableCell>
                            <TableCell className="text-right">
                              {compra.precoCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </TableCell>
                            <TableCell>{compra.fornecedor || "-"}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditarCompra(compra)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCompra(compra)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

      <Dialog open={isEditCompraDialogOpen} onOpenChange={setIsEditCompraDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Compra</DialogTitle>
            <DialogDescription>Modifique os dados da compra. Isso afetará o estoque atual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ingrediente Base</Label>
              <Input
                value={ingredientesBase?.find((i) => i.id === novaCompra.ingredienteBaseId)?.nome || ""}
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantidade">Quantidade Comprada</Label>
                <Input
                  id="edit-quantidade"
                  type="number"
                  step="0.01"
                  value={novaCompra.quantidadeComprada}
                  onChange={(e) => setNovaCompra({ ...novaCompra, quantidadeComprada: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-preco">Preço Total da Compra</Label>
                <Input
                  id="edit-preco"
                  type="number"
                  step="0.01"
                  value={novaCompra.precoCompra}
                  onChange={(e) => setNovaCompra({ ...novaCompra, precoCompra: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fornecedor">Fornecedor</Label>
                <Input
                  id="edit-fornecedor"
                  value={novaCompra.fornecedor}
                  onChange={(e) => setNovaCompra({ ...novaCompra, fornecedor: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-lote">Lote</Label>
                <Input
                  id="edit-lote"
                  value={novaCompra.lote}
                  onChange={(e) => setNovaCompra({ ...novaCompra, lote: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleEditCompra} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
