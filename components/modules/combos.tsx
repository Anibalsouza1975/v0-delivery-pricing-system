"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useDatabasePricing } from "@/components/database-pricing-context"
import { Plus, Edit, Trash2, Utensils, Minus, Package } from "lucide-react"
import type { Combo } from "@/app/page"

export default function CombosModule() {
  const { combos, produtos, bebidas, addCombo, updateCombo, deleteCombo, adicionais, personalizacoes } =
    useDatabasePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [configIfood, setConfigIfood] = useState({
    valorFrete: 5,
    comissaoIfood: 27,
    cupomDesconto: 0,
  })
  const [formData, setFormData] = useState({
    nome: "",
    desconto: "10",
    produtos: [{ produtoId: "", quantidade: "1" }],
    bebidas: [{ bebidaId: "", quantidade: "1" }],
    foto: "",
    adicionaisPermitidos: [] as string[],
    personalizacoesPermitidas: [] as string[],
  })

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handleAdicionaisUpdate = () => {
      setRefreshKey((prev) => prev + 1)
    }

    window.addEventListener("adicionaisUpdated", handleAdicionaisUpdate)
    return () => window.removeEventListener("adicionaisUpdated", handleAdicionaisUpdate)
  }, [])

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [adicionais, personalizacoes])

  const adicionaisParaCombos = adicionais.filter((adicional) => {
    return adicional.categorias && Array.isArray(adicional.categorias) && adicional.categorias.includes("Combos")
  })

  const personalizacoesParaCombos = personalizacoes.filter((personalizacao) => {
    return (
      personalizacao.categorias &&
      Array.isArray(personalizacao.categorias) &&
      personalizacao.categorias.includes("Combos")
    )
  })

  const categorias = [
    "Hambúrgueres",
    "Lanches",
    "Batatas",
    "Bebidas",
    "Sobremesas",
    "Saladas",
    "Pratos Executivos",
    "Pizzas",
    "Massas",
    "Grelhados",
    "Vegetarianos",
    "Veganos",
    "Combos",
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData({ ...formData, foto: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const produtosData = formData.produtos
      .filter((item) => item.produtoId && item.quantidade)
      .map((item) => ({
        produtoId: item.produtoId,
        quantidade: Number.parseFloat(item.quantidade),
      }))

    const bebidasData = formData.bebidas
      .filter((item) => item.bebidaId && item.quantidade)
      .map((item) => ({
        bebidaId: item.bebidaId,
        quantidade: Number.parseFloat(item.quantidade),
      }))

    if (produtosData.length === 0 && bebidasData.length === 0) {
      alert("Adicione pelo menos um produto ou bebida ao combo")
      return
    }

    const precoTotalProdutos = produtosData.reduce((total, item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)
      return total + (produto ? produto.precoVenda * item.quantidade : 0)
    }, 0)

    const precoTotalBebidas = bebidasData.reduce((total, item) => {
      const bebida = bebidas.find((b) => b.id === item.bebidaId)
      return total + (bebida ? bebida.precoVenda * item.quantidade : 0)
    }, 0)

    const precoTotal = precoTotalProdutos + precoTotalBebidas
    const desconto = Number.parseFloat(formData.desconto)
    const precoFinal = precoTotal * (1 - desconto / 100)

    const comboData = {
      nome: formData.nome,
      produtos: produtosData,
      bebidas: bebidasData,
      desconto,
      precoFinal,
      foto: formData.foto,
      adicionaisPermitidos: formData.adicionaisPermitidos,
      personalizacoesPermitidas: formData.personalizacoesPermitidas,
    }

    if (editingCombo) {
      updateCombo(editingCombo.id, comboData)
    } else {
      addCombo(comboData)
    }

    setFormData({
      nome: "",
      desconto: "10",
      produtos: [{ produtoId: "", quantidade: "1" }],
      bebidas: [{ bebidaId: "", quantidade: "1" }],
      foto: "",
      adicionaisPermitidos: [],
      personalizacoesPermitidas: [],
    })
    setEditingCombo(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo)
    setFormData({
      nome: combo.nome,
      desconto: combo.desconto.toString(),
      produtos: combo.produtos.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade.toString(),
      })),
      bebidas: combo.bebidas.map((item) => ({
        bebidaId: item.bebidaId,
        quantidade: item.quantidade.toString(),
      })),
      foto: combo.foto || "",
      adicionaisPermitidos: combo.adicionaisPermitidos || [],
      personalizacoesPermitidas: combo.personalizacoesPermitidas || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este combo?")) {
      deleteCombo(id)
    }
  }

  const addProdutoLine = () => {
    setFormData({
      ...formData,
      produtos: [...formData.produtos, { produtoId: "", quantidade: "1" }],
    })
  }

  const removeProdutoLine = (index: number) => {
    const newProdutos = formData.produtos.filter((_, i) => i !== index)
    setFormData({ ...formData, produtos: newProdutos })
  }

  const updateProdutoLine = (index: number, field: string, value: string) => {
    const newProdutos = [...formData.produtos]
    newProdutos[index] = { ...newProdutos[index], [field]: value }
    setFormData({ ...formData, produtos: newProdutos })
  }

  const addBebidaLine = () => {
    setFormData({
      ...formData,
      bebidas: [...formData.bebidas, { bebidaId: "", quantidade: "1" }],
    })
  }

  const removeBebidaLine = (index: number) => {
    const newBebidas = formData.bebidas.filter((_, i) => i !== index)
    setFormData({ ...formData, bebidas: newBebidas })
  }

  const updateBebidaLine = (index: number, field: string, value: string) => {
    const newBebidas = [...formData.bebidas]
    newBebidas[index] = { ...newBebidas[index], [field]: value }
    setFormData({ ...formData, bebidas: newBebidas })
  }

  const calculatePrecoTotal = () => {
    const precoTotalProdutos = formData.produtos.reduce((total, item) => {
      if (!item.produtoId || !item.quantidade) return total
      const produto = produtos.find((p) => p.id === item.produtoId)
      return total + (produto ? produto.precoVenda * Number.parseFloat(item.quantidade) : 0)
    }, 0)

    const precoTotalBebidas = formData.bebidas.reduce((total, item) => {
      if (!item.bebidaId || !item.quantidade) return total
      const bebida = bebidas.find((b) => b.id === item.bebidaId)
      return total + (bebida ? bebida.precoVenda * Number.parseFloat(item.quantidade) : 0)
    }, 0)

    return precoTotalProdutos + precoTotalBebidas
  }

  const precoTotal = calculatePrecoTotal()
  const desconto = Number.parseFloat(formData.desconto) || 0
  const precoFinal = precoTotal * (1 - desconto / 100)
  const precoMedioIfood =
    combos.length > 0
      ? combos.reduce((total, c) => {
          const precoIfoodBase = c.precoFinal + configIfood.valorFrete - configIfood.cupomDesconto
          const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
          return total + precoIfood
        }, 0) / combos.length
      : 0

  const totalCombos = combos.length
  const descontoMedio = combos.length > 0 ? combos.reduce((total, c) => total + c.desconto, 0) / combos.length : 0
  const precoMedio = combos.length > 0 ? combos.reduce((total, c) => total + c.precoFinal, 0) / combos.length : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combos Cadastrados</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalCombos}</div>
            <p className="text-xs text-muted-foreground">Combos no cardápio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconto Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{descontoMedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Desconto médio aplicado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {precoMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Preço médio dos combos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio iFood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {precoMedioIfood.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
          <h3 className="text-lg font-semibold">Combos Cadastrados</h3>
          <p className="text-sm text-muted-foreground">
            Monte seus combos de maneira fácil e precifique corretamente, sem tomar prejuízos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCombo(null)
                setFormData({
                  nome: "",
                  desconto: "10",
                  produtos: [{ produtoId: "", quantidade: "1" }],
                  bebidas: [{ bebidaId: "", quantidade: "1" }],
                  foto: "",
                  adicionaisPermitidos: [],
                  personalizacoesPermitidas: [],
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCombo ? "Editar Combo" : "Criar Combo"}</DialogTitle>
              <DialogDescription>
                {editingCombo ? "Edite as informações do combo." : "Crie um novo combo com produtos e bebidas."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Combo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Combo X-Bacon"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desconto">Desconto (%)</Label>
                    <Input
                      id="desconto"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.desconto}
                      onChange={(e) => setFormData({ ...formData, desconto: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="foto">Foto do Combo</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  {formData.foto && (
                    <div className="mt-2">
                      <img
                        src={formData.foto || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Produtos do Combo</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addProdutoLine}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Produto
                    </Button>
                  </div>

                  {formData.produtos.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Select
                          value={item.produtoId}
                          onValueChange={(value) => updateProdutoLine(index, "produtoId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome} -{" "}
                                {produto.precoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => updateProdutoLine(index, "quantidade", e.target.value)}
                          placeholder="Qtd"
                        />
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {item.produtoId && item.quantidade
                          ? (
                              produtos.find((p) => p.id === item.produtoId)?.precoVenda ||
                              0 * Number.parseFloat(item.quantidade)
                            ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "R$ 0,00"}
                      </div>
                      <div className="col-span-1">
                        {formData.produtos.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeProdutoLine(index)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Bebidas do Combo</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBebidaLine}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Bebida
                    </Button>
                  </div>

                  {formData.bebidas.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Select
                          value={item.bebidaId}
                          onValueChange={(value) => updateBebidaLine(index, "bebidaId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a bebida" />
                          </SelectTrigger>
                          <SelectContent>
                            {bebidas.map((bebida) => (
                              <SelectItem key={bebida.id} value={bebida.id}>
                                {bebida.nome} -{" "}
                                {bebida.precoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => updateBebidaLine(index, "quantidade", e.target.value)}
                          placeholder="Qtd"
                        />
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {item.bebidaId && item.quantidade
                          ? (
                              bebidas.find((b) => b.id === item.bebidaId)?.precoVenda ||
                              0 * Number.parseFloat(item.quantidade)
                            ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "R$ 0,00"}
                      </div>
                      <div className="col-span-1">
                        {formData.bebidas.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBebidaLine(index)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Preço Total (sem desconto):</span>
                    <span className="font-mono">
                      {precoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span className="font-mono">{formData.desconto}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia:</span>
                    <span className="font-mono text-green-600">
                      -{(precoTotal - precoFinal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-primary">
                    <span>Preço Final do Combo:</span>
                    <span className="font-mono">
                      {precoFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  <hr className="my-3" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-orange-600">Configurações iFood</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="combo-frete" className="text-xs">
                          Frete (R$)
                        </Label>
                        <Input
                          id="combo-frete"
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
                        <Label htmlFor="combo-comissao" className="text-xs">
                          Comissão (%)
                        </Label>
                        <Input
                          id="combo-comissao"
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
                        <Label htmlFor="combo-cupom" className="text-xs">
                          Cupom (R$)
                        </Label>
                        <Input
                          id="combo-cupom"
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
                          const precoIfoodBase = precoFinal + configIfood.valorFrete - configIfood.cupomDesconto
                          const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
                          return precoIfood.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Adicionais Permitidos</Label>
                    <span className="text-xs text-muted-foreground">
                      Selecione quais adicionais podem ser aplicados a este combo
                    </span>
                  </div>

                  <div className="border border-border rounded-lg p-4 max-h-32 overflow-y-auto">
                    {adicionaisParaCombos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum adicional configurado para combos.
                        <br />
                        Vá em "Gerenciar Adicionais" e marque a categoria "Combos".
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {adicionaisParaCombos.map((adicional) => (
                          <div key={adicional.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`adicional-${adicional.id}`}
                              checked={formData.adicionaisPermitidos.includes(adicional.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    adicionaisPermitidos: [...formData.adicionaisPermitidos, adicional.id],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    adicionaisPermitidos: formData.adicionaisPermitidos.filter(
                                      (id) => id !== adicional.id,
                                    ),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`adicional-${adicional.id}`} className="text-sm">
                              {adicional.nome} (+
                              {adicional.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Personalizações Permitidas</Label>
                    <span className="text-xs text-muted-foreground">
                      Selecione quais personalizações podem ser aplicadas a este combo
                    </span>
                  </div>

                  <div className="border border-border rounded-lg p-4 max-h-32 overflow-y-auto">
                    {personalizacoesParaCombos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma personalização configurada para combos.
                        <br />
                        Vá em "Gerenciar Personalizações" e marque a categoria "Combos".
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {personalizacoesParaCombos.map((personalizacao) => (
                          <div key={personalizacao.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`personalizacao-${personalizacao.id}`}
                              checked={formData.personalizacoesPermitidas.includes(personalizacao.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    personalizacoesPermitidas: [
                                      ...formData.personalizacoesPermitidas,
                                      personalizacao.id,
                                    ],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    personalizacoesPermitidas: formData.personalizacoesPermitidas.filter(
                                      (id) => id !== personalizacao.id,
                                    ),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`personalizacao-${personalizacao.id}`} className="text-sm">
                              {personalizacao.nome}
                              <Badge
                                variant={personalizacao.tipo === "remover" ? "destructive" : "secondary"}
                                className="ml-1 text-xs"
                              >
                                {personalizacao.tipo === "remover" ? "Remover" : "Substituir"}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingCombo ? "Salvar Alterações" : "Criar Combo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {combos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum combo cadastrado</p>
              <p className="text-sm">Crie combos para aumentar o ticket médio e oferecer mais valor aos clientes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Preço Original</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Preço Final</TableHead>
                  <TableHead className="text-right">Preço iFood</TableHead>
                  <TableHead className="text-right">Economia</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combos.map((combo) => {
                  const precoOriginal = combo.precoFinal / (1 - combo.desconto / 100)
                  const economia = precoOriginal - combo.precoFinal
                  const totalItens = combo.produtos.length + combo.bebidas.length
                  const precoIfoodBase = combo.precoFinal + configIfood.valorFrete - configIfood.cupomDesconto
                  const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)

                  return (
                    <TableRow key={combo.id}>
                      <TableCell className="font-medium">{combo.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span className="text-sm">{totalItens} itens</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {precoOriginal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{combo.desconto.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {combo.precoFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-orange-600">
                        {precoIfood.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        -{economia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(combo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(combo.id)}
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
