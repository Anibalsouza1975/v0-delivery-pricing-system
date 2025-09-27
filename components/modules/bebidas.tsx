"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { usePricing } from "@/components/pricing-context-supabase"
import { Plus, Edit, Trash2, Coffee, Percent, X } from "lucide-react"
import type { Bebida } from "@/app/page"

export default function BebidasModule() {
  const { bebidas, addBebida, updateBebida, deleteBebida } = usePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBebida, setEditingBebida] = useState<Bebida | null>(null)
  const [configIfood, setConfigIfood] = useState({
    valorFrete: 5,
    comissaoIfood: 27,
    cupomDesconto: 0,
  })
  const [formData, setFormData] = useState({
    nome: "",
    custoUnitario: "",
    markup: "100",
    foto: "",
    descricao: "",
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData({ ...formData, foto: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (bebida: Bebida) => {
    console.log("[v0] handleEdit called with bebida:", bebida)
    setEditingBebida(bebida)
    const formDataToSet = {
      nome: bebida.nome,
      custoUnitario: (bebida.custo_unitario ?? 0).toString(), // Fixed: use custo_unitario from DB
      markup: (bebida.markup ?? 100).toString(),
      foto: bebida.imagem_url || "", // Fixed: use imagem_url from DB
      descricao: bebida.descricao || "",
    }
    console.log("[v0] Setting form data:", formDataToSet)
    setFormData(formDataToSet)
    setIsDialogOpen(true)
    console.log("[v0] Dialog should be open now")
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta bebida?")) {
      deleteBebida(id)
    }
  }

  const calculatePrecoVenda = () => {
    const custo = Number.parseFloat(formData.custoUnitario) || 0
    const markup = Number.parseFloat(formData.markup) || 0
    const precoCalculado = custo * (1 + markup / 100)
    console.log("[v0] calculatePrecoVenda - custo:", custo, "markup:", markup, "precoCalculado:", precoCalculado)
    return precoCalculado
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const custoUnitario = Number.parseFloat(formData.custoUnitario)
    const markup = Number.parseFloat(formData.markup)
    const precoVenda = custoUnitario * (1 + markup / 100)

    // Calculate iFood price
    const precoIfoodBase = precoVenda + configIfood.valorFrete - configIfood.cupomDesconto
    const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
    const lucroUnitario = precoVenda - custoUnitario

    const bebidaData = {
      nome: formData.nome,
      custo_unitario: custoUnitario, // Fixed: use correct field name
      markup,
      preco_venda: precoVenda, // Fixed: use correct field name
      imagem_url: formData.foto, // Fixed: use correct field name
      descricao: formData.descricao,
      preco_ifood: precoIfood,
      lucro_unitario: lucroUnitario,
      tamanho: "350ml", // Default size
      ativo: true,
    }

    console.log("[v0] Submitting bebida data:", bebidaData)

    if (editingBebida) {
      updateBebida(editingBebida.id, bebidaData)
    } else {
      addBebida(bebidaData)
    }

    setFormData({ nome: "", custoUnitario: "", markup: "100", foto: "", descricao: "" })
    setEditingBebida(null)
    setIsDialogOpen(false)
  }

  const totalBebidas = bebidas.length
  const markupMedio = bebidas.length > 0 ? bebidas.reduce((total, b) => total + (b.markup || 0), 0) / bebidas.length : 0
  const precoMedio =
    bebidas.length > 0 ? bebidas.reduce((total, b) => total + (b.precoVenda || 0), 0) / bebidas.length : 0
  const precoMedioIfood =
    bebidas.length > 0
      ? bebidas.reduce((total, b) => {
          const precoIfoodBase = (b.precoVenda || 0) + configIfood.valorFrete - configIfood.cupomDesconto
          const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
          return total + precoIfood
        }, 0) / bebidas.length
      : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bebidas Cadastradas</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{totalBebidas}</div>
            <p className="text-xs text-muted-foreground">Bebidas no cardápio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Markup Médio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{markupMedio.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Margem média aplicada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(precoMedio || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Preço médio de venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio iFood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(precoMedioIfood || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Preço médio no iFood</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações iFood</CardTitle>
          <p className="text-sm text-muted-foreground">Configure os parâmetros para cálculo do preço no iFood</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorFrete">Valor do Frete (R$)</Label>
              <Input
                id="valorFrete"
                type="number"
                step="0.01"
                min="0"
                value={configIfood.valorFrete}
                onChange={(e) => setConfigIfood({ ...configIfood, valorFrete: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissaoIfood">Comissão iFood (%)</Label>
              <Input
                id="comissaoIfood"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={configIfood.comissaoIfood}
                onChange={(e) =>
                  setConfigIfood({ ...configIfood, comissaoIfood: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cupomDesconto">Cupom de Desconto (R$)</Label>
              <Input
                id="cupomDesconto"
                type="number"
                step="0.01"
                min="0"
                value={configIfood.cupomDesconto}
                onChange={(e) =>
                  setConfigIfood({ ...configIfood, cupomDesconto: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bebidas Cadastradas</h3>
          <p className="text-sm text-muted-foreground">Precifique suas bebidas corretamente utilizando o markup</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingBebida(null)
                setFormData({ nome: "", custoUnitario: "", markup: "100", foto: "", descricao: "" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bebida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBebida ? "Editar Bebida" : "Adicionar Bebida"}</DialogTitle>
              <DialogDescription>
                {editingBebida ? "Edite as informações da bebida." : "Adicione uma nova bebida ao cardápio."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Bebida</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Coca-Cola 350ml"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Refrigerante gelado, lata 350ml"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="foto">Foto da Bebida</Label>
                  <div className="space-y-2">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {formData.foto && (
                      <div className="relative inline-block">
                        <img
                          src={formData.foto || "/placeholder.svg"}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setFormData({ ...formData, foto: "" })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="custoUnitario">Custo Unitário (R$)</Label>
                  <Input
                    id="custoUnitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoUnitario}
                    onChange={(e) => setFormData({ ...formData, custoUnitario: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="markup">Markup (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.markup}
                    onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                    placeholder="100"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    100% = dobra o preço | 50% = aumenta 50% sobre o custo
                  </p>
                </div>

                {formData.custoUnitario && formData.markup && (
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Custo:</span>
                      <span className="font-mono">
                        {(Number.parseFloat(formData.custoUnitario) || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Markup:</span>
                      <span className="font-mono">{formData.markup}%</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary">
                      <span>Preço de Venda:</span>
                      <span className="font-mono">
                        {(calculatePrecoVenda() || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>

                    <hr className="my-3" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-orange-600">Configurações iFood</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="modal-frete" className="text-xs">
                            Frete (R$)
                          </Label>
                          <Input
                            id="modal-frete"
                            type="number"
                            step="0.01"
                            min="0"
                            value={configIfood.valorFrete}
                            onChange={(e) =>
                              setConfigIfood({ ...configIfood, valorFrete: Number.parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="modal-comissao" className="text-xs">
                            Comissão (%)
                          </Label>
                          <Input
                            id="modal-comissao"
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            value={configIfood.comissaoIfood}
                            onChange={(e) =>
                              setConfigIfood({ ...configIfood, comissaoIfood: Number.parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="modal-cupom" className="text-xs">
                            Cupom (R$)
                          </Label>
                          <Input
                            id="modal-cupom"
                            type="number"
                            step="0.01"
                            min="0"
                            value={configIfood.cupomDesconto}
                            onChange={(e) =>
                              setConfigIfood({ ...configIfood, cupomDesconto: Number.parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-orange-600">
                        <span>Preço iFood:</span>
                        <span className="font-mono">
                          {(() => {
                            const precoVenda = calculatePrecoVenda() || 0
                            const precoIfoodBase = precoVenda + configIfood.valorFrete - configIfood.cupomDesconto
                            const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
                            return (precoIfood || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">{editingBebida ? "Salvar Alterações" : "Adicionar Bebida"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {bebidas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma bebida cadastrada</p>
              <p className="text-sm">Adicione bebidas ao seu cardápio e precifique corretamente com markup.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Custo Unitário</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Preço iFood</TableHead>
                  <TableHead className="text-right">Lucro Unit.</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bebidas.map((bebida) => {
                  const precoIfoodBase = (bebida.preco_venda || 0) + configIfood.valorFrete - configIfood.cupomDesconto
                  const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)

                  return (
                    <TableRow key={bebida.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {bebida.imagem_url && (
                            <img
                              src={bebida.imagem_url || "/placeholder.svg"}
                              alt={bebida.nome}
                              className="w-10 h-10 object-cover rounded-lg border"
                            />
                          )}
                          <div>
                            <div className="font-medium">{bebida.nome}</div>
                            {bebida.descricao && (
                              <div className="text-sm text-muted-foreground">{bebida.descricao}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(bebida.custo_unitario || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{(bebida.markup || 0).toFixed(0)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {bebida.preco_venda && !isNaN(bebida.preco_venda)
                          ? bebida.preco_venda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "R$ 0,00"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-orange-600">
                        {(precoIfood || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {((bebida.preco_venda || 0) - (bebida.custo_unitario || 0)).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(bebida)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(bebida.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
