"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { usePricing } from "@/components/pricing-context-supabase"
import { Plus, Utensils, Minus, Edit, Trash2 } from "lucide-react"
import type { Combo, Adicional, Personalizacao } from "@/app/page"

export default function CombosModule() {
  const {
    combos,
    produtos,
    bebidas,
    addCombo,
    updateCombo,
    deleteCombo,
    adicionais = [],
    personalizacoes = [],
    addAdicional,
    updateAdicional,
    deleteAdicional,
    addPersonalizacao,
    updatePersonalizacao,
    deletePersonalizacao,
  } = usePricing()

  const [activeTab, setActiveTab] = useState("combos")

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

  const [novoAdicional, setNovoAdicional] = useState({
    nome: "",
    preco: "",
    insumoId: "",
    categorias: [] as string[],
  })
  const [editingAdicional, setEditingAdicional] = useState<Adicional | null>(null)

  const [novaPersonalizacao, setNovaPersonalizacao] = useState({
    nome: "",
    tipo: "remover" as const,
    descricao: "",
    categorias: [] as string[],
  })
  const [editingPersonalizacao, setEditingPersonalizacao] = useState<Personalizacao | null>(null)

  const categoriasDisponiveis = [
    "Hambúrgueres",
    "Batatas",
    "BBQ",
    "Pizzas",
    "Sanduíches",
    "Saladas",
    "Pratos Executivos",
    "Lanches",
    "Sobremesas",
    "Bebidas",
    "Molhos",
    "Acompanhamentos",
    "Promoções",
    "Combos",
    "Outros",
  ]

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

  const handleAddAdicional = async () => {
    if (!novoAdicional.nome.trim() || !novoAdicional.preco || novoAdicional.categorias.length === 0) return

    try {
      const adicionalData = {
        nome: novoAdicional.nome.trim(),
        preco: Number.parseFloat(novoAdicional.preco),
        insumo_id: novoAdicional.insumoId || undefined,
        categorias: novoAdicional.categorias,
        ativo: true,
      }

      if (editingAdicional) {
        await updateAdicional(editingAdicional.id, adicionalData)
        setEditingAdicional(null)
      } else {
        await addAdicional(adicionalData)
      }

      setNovoAdicional({ nome: "", preco: "", insumoId: "", categorias: [] })
    } catch (error) {
      console.error("Erro ao salvar adicional:", error)
      alert("Erro ao salvar adicional. Tente novamente.")
    }
  }

  const handleEditAdicional = (adicional: Adicional) => {
    setEditingAdicional(adicional)
    setNovoAdicional({
      nome: adicional.nome,
      preco: adicional.preco.toString(),
      insumoId: adicional.insumo_id || "",
      categorias: adicional.categorias || [],
    })
  }

  const handleDeleteAdicional = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este adicional?")) {
      try {
        await deleteAdicional(id)
      } catch (error) {
        console.error("Erro ao excluir adicional:", error)
        alert("Erro ao excluir adicional. Tente novamente.")
      }
    }
  }

  const handleAddPersonalizacao = async () => {
    if (!novaPersonalizacao.nome.trim() || novaPersonalizacao.categorias.length === 0) return

    try {
      const personalizacaoData = {
        nome: novaPersonalizacao.nome.trim(),
        tipo: novaPersonalizacao.tipo,
        descricao: novaPersonalizacao.descricao.trim() || undefined,
        categorias: novaPersonalizacao.categorias,
        ativo: true,
      }

      if (editingPersonalizacao) {
        await updatePersonalizacao(editingPersonalizacao.id, personalizacaoData)
        setEditingPersonalizacao(null)
      } else {
        await addPersonalizacao(personalizacaoData)
      }

      setNovaPersonalizacao({ nome: "", tipo: "remover", descricao: "", categorias: [] })
    } catch (error) {
      console.error("Erro ao salvar personalização:", error)
      alert("Erro ao salvar personalização. Tente novamente.")
    }
  }

  const handleEditPersonalizacao = (personalizacao: Personalizacao) => {
    setEditingPersonalizacao(personalizacao)
    setNovaPersonalizacao({
      nome: personalizacao.nome,
      tipo: personalizacao.tipo,
      descricao: personalizacao.descricao || "",
      categorias: personalizacao.categorias || [],
    })
  }

  const handleDeletePersonalizacao = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta personalização?")) {
      try {
        await deletePersonalizacao(id)
      } catch (error) {
        console.error("Erro ao excluir personalização:", error)
        alert("Erro ao excluir personalização. Tente novamente.")
      }
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("[v0] Iniciando criação/edição de combo")
      console.log("[v0] Produtos disponíveis:", produtos.length)
      console.log("[v0] Bebidas disponíveis:", bebidas.length)

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

      console.log("[v0] Produtos selecionados:", produtosData)
      console.log("[v0] Bebidas selecionadas:", bebidasData)

      if (produtosData.length === 0 && bebidasData.length === 0) {
        alert("Adicione pelo menos um produto ou bebida ao combo")
        return
      }

      const precoTotalProdutos = produtosData.reduce((total, item) => {
        const produto = produtos.find((p) => p.id === item.produtoId)
        const precoUnitario = produto?.precoVenda || produto?.preco_venda || 0
        const subtotal = precoUnitario * item.quantidade
        console.log(`[v0] Produto ${produto?.nome}: R$ ${precoUnitario} x ${item.quantidade} = R$ ${subtotal}`)
        return total + subtotal
      }, 0)

      const precoTotalBebidas = bebidasData.reduce((total, item) => {
        const bebida = bebidas.find((b) => b.id === item.bebidaId)
        const precoUnitario = bebida?.precoVenda || bebida?.preco_venda || 0
        const subtotal = precoUnitario * item.quantidade
        console.log(`[v0] Bebida ${bebida?.nome}: R$ ${precoUnitario} x ${item.quantidade} = R$ ${subtotal}`)
        return total + subtotal
      }, 0)

      const precoTotal = precoTotalProdutos + precoTotalBebidas
      const desconto = Number.parseFloat(formData.desconto)
      const precoFinal = precoTotal * (1 - desconto / 100)

      console.log(`[v0] Preço total: R$ ${precoTotal}`)
      console.log(`[v0] Desconto: ${desconto}%`)
      console.log(`[v0] Preço final: R$ ${precoFinal}`)

      if (isNaN(precoFinal) || precoFinal <= 0) {
        console.error("[v0] Preço final inválido:", precoFinal)
        alert("Erro: Preço final inválido. Verifique se os produtos têm preços cadastrados.")
        return
      }

      const comboData = {
        nome: formData.nome,
        descricao: `Combo com ${produtosData.length + bebidasData.length} itens`,
        produtos: produtosData,
        bebidas: bebidasData,
        desconto,
        precoFinal,
        foto: formData.foto,
        adicionaisPermitidos: formData.adicionaisPermitidos,
        personalizacoesPermitidas: formData.personalizacoesPermitidas,
      }

      console.log("[v0] Dados do combo a serem salvos:", comboData)

      if (editingCombo) {
        await updateCombo(editingCombo.id, comboData)
        console.log("[v0] Combo atualizado com sucesso")
      } else {
        await addCombo(comboData)
        console.log("[v0] Combo criado com sucesso")
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
    } catch (error) {
      console.error("[v0] Erro ao salvar combo:", error)
      alert(`Erro ao salvar combo: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    }
  }

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo)
    setFormData({
      nome: combo.nome || "",
      desconto: (combo.desconto || 0).toString(),
      produtos: (combo.produtos || []).map((item) => ({
        produtoId: item.produtoId || "",
        quantidade: (item.quantidade || 1).toString(),
      })),
      bebidas: (combo.bebidas || []).map((item) => ({
        bebidaId: item.bebidaId || "",
        quantidade: (item.quantidade || 1).toString(),
      })),
      foto: combo.foto || "",
      adicionaisPermitidos: combo.adicionaisPermitidos || [],
      personalizacoesPermitidas: combo.personalizacoesPermitidas || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este combo?")) {
      try {
        await deleteCombo(id)
      } catch (error) {
        console.error("Erro ao excluir combo:", error)
        alert("Erro ao excluir combo. Tente novamente.")
      }
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
      const precoUnitario = produto?.precoVenda || produto?.preco_venda || 0
      return total + precoUnitario * Number.parseFloat(item.quantidade)
    }, 0)

    const precoTotalBebidas = formData.bebidas.reduce((total, item) => {
      if (!item.bebidaId || !item.quantidade) return total
      const bebida = bebidas.find((b) => b.id === item.bebidaId)
      const precoUnitario = bebida?.precoVenda || bebida?.preco_venda || 0
      return total + precoUnitario * Number.parseFloat(item.quantidade)
    }, 0)

    return precoTotalProdutos + precoTotalBebidas
  }

  const precoTotal = calculatePrecoTotal()
  const desconto = Number.parseFloat(formData.desconto) || 0
  const precoFinal = precoTotal * (1 - desconto / 100)

  const precoMedioIfood =
    combos.length > 0
      ? combos.reduce((total, c) => {
          const precoIfoodBase = (c.precoFinal || 0) + configIfood.valorFrete - configIfood.cupomDesconto
          const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
          return total + (isNaN(precoIfood) || !isFinite(precoIfood) ? 0 : precoIfood)
        }, 0) / combos.length
      : 0

  const totalCombos = combos.length
  const descontoMedio =
    combos.length > 0 ? combos.reduce((total, c) => total + (c.desconto || 0), 0) / combos.length : 0
  const precoMedio = combos.length > 0 ? combos.reduce((total, c) => total + (c.precoFinal || 0), 0) / combos.length : 0

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="combos">Combos</TabsTrigger>
          <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
          <TabsTrigger value="personalizacoes">Personalizações</TabsTrigger>
        </TabsList>

        <TabsContent value="combos" className="space-y-6">
          {/* Conteúdo da aba Combos */}
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
                <div className="text-2xl font-bold">
                  {(isNaN(descontoMedio) || !isFinite(descontoMedio) ? 0 : descontoMedio).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Desconto médio aplicado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(isNaN(precoMedio) || !isFinite(precoMedio) ? 0 : precoMedio).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
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
                  {(isNaN(precoMedioIfood) || !isFinite(precoMedioIfood) ? 0 : precoMedioIfood).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    },
                  )}
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
                    onChange={(e) =>
                      setConfigIfood({ ...configIfood, valorFrete: Number.parseFloat(e.target.value) || 0 })
                    }
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

                    {/* ... existing code for produtos and bebidas ... */}
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
                                    {(produto.precoVenda || produto.preco_venda || 0).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
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
                              ? (() => {
                                  const produto = produtos.find((p) => p.id === item.produtoId)
                                  const precoUnitario = produto?.precoVenda || produto?.preco_venda || 0
                                  const valor = precoUnitario * Number.parseFloat(item.quantidade)
                                  return (isNaN(valor) || !isFinite(valor) ? 0 : valor).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })
                                })()
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
                                    {(bebida.precoVenda || bebida.preco_venda || 0).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
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
                              ? (() => {
                                  const bebida = bebidas.find((b) => b.id === item.bebidaId)
                                  const precoUnitario = bebida?.precoVenda || bebida?.preco_venda || 0
                                  const valor = precoUnitario * Number.parseFloat(item.quantidade)
                                  return (isNaN(valor) || !isFinite(valor) ? 0 : valor).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })
                                })()
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
                          {(isNaN(precoTotal) || !isFinite(precoTotal) ? 0 : precoTotal).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desconto:</span>
                        <span className="font-mono">{formData.desconto}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Economia:</span>
                        <span className="font-mono text-green-600">
                          -
                          {(isNaN(precoTotal - precoFinal) || !isFinite(precoTotal - precoFinal)
                            ? 0
                            : precoTotal - precoFinal
                          ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-primary">
                        <span>Preço Final do Combo:</span>
                        <span className="font-mono">
                          {(isNaN(precoFinal) || !isFinite(precoFinal) ? 0 : precoFinal).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
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
                                setConfigIfood({
                                  ...configIfood,
                                  comissaoIfood: Number.parseFloat(e.target.value) || 0,
                                })
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
                                setConfigIfood({
                                  ...configIfood,
                                  cupomDesconto: Number.parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between font-bold text-orange-600">
                          <span>Preço iFood:</span>
                          <span className="font-mono">
                            {(() => {
                              const precoIfoodBase =
                                (precoFinal || 0) + configIfood.valorFrete - configIfood.cupomDesconto
                              const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)
                              return (isNaN(precoIfood) || !isFinite(precoIfood) ? 0 : precoIfood).toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                },
                              )
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
                            Vá na aba "Adicionais" e marque a categoria "Combos".
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
                                  {(adicional.preco || 0).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                  )
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
                            Vá na aba "Personalizações" e marque a categoria "Combos".
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
                  <p className="text-sm">
                    Crie combos para aumentar o ticket médio e oferecer mais valor aos clientes.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagem</TableHead>
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
                      const precoOriginal = (combo.precoFinal || 0) / (1 - (combo.desconto || 0) / 100)
                      const economia = precoOriginal - (combo.precoFinal || 0)
                      const totalItens = (combo.produtos?.length || 0) + (combo.bebidas?.length || 0)
                      const precoIfoodBase =
                        (combo.precoFinal || 0) + configIfood.valorFrete - configIfood.cupomDesconto
                      const precoIfood = precoIfoodBase / (1 - configIfood.comissaoIfood / 100)

                      return (
                        <TableRow key={combo.id}>
                          <TableCell>
                            {combo.foto ? (
                              <img
                                src={combo.foto || "/placeholder.svg"}
                                alt={combo.nome}
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg border flex items-center justify-center">
                                <Utensils className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{combo.nome}</TableCell>
                          <TableCell>{totalItens} itens</TableCell>
                          <TableCell className="text-right">
                            {(isNaN(precoOriginal) || !isFinite(precoOriginal) ? 0 : precoOriginal).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-right">{combo.desconto || 0}%</TableCell>
                          <TableCell className="text-right">
                            {(combo.precoFinal || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {(isNaN(precoIfood) || !isFinite(precoIfood) ? 0 : precoIfood).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {(isNaN(economia) || !isFinite(economia) ? 0 : economia).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(combo)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(combo.id)}>
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
        </TabsContent>

        <TabsContent value="adicionais" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gerenciar Adicionais</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre ingredientes extras que podem ser adicionados aos combos
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Adicional</Label>
                  <Input
                    placeholder="Ex: Bacon extra"
                    value={novoAdicional.nome}
                    onChange={(e) => setNovoAdicional({ ...novoAdicional, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={novoAdicional.preco}
                    onChange={(e) => setNovoAdicional({ ...novoAdicional, preco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insumo (opcional)</Label>
                  <Select
                    value={novoAdicional.insumoId}
                    onValueChange={(value) => setNovoAdicional({ ...novoAdicional, insumoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um insumo" />
                    </SelectTrigger>
                    <SelectContent>{/* Aqui você pode mapear os insumos disponíveis */}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categorias onde deve aparecer</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {categoriasDisponiveis.map((categoria) => (
                      <div key={categoria} className="flex items-center space-x-2">
                        <Checkbox
                          id={`adicional-categoria-${categoria}`}
                          checked={novoAdicional.categorias.includes(categoria)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNovoAdicional((prev) => ({
                                ...prev,
                                categorias: [...prev.categorias, categoria],
                              }))
                            } else {
                              setNovoAdicional((prev) => ({
                                ...prev,
                                categorias: prev.categorias.filter((c) => c !== categoria),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`adicional-categoria-${categoria}`} className="text-sm cursor-pointer">
                          {categoria}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleAddAdicional} disabled={novoAdicional.categorias.length === 0}>
                {editingAdicional ? "Salvar Alterações" : "Adicionar Adicional"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionais Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {adicionais.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum adicional cadastrado</p>
                  <p className="text-sm">Adicione ingredientes extras para seus combos.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categorias</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adicionais.map((adicional) => (
                      <TableRow key={adicional.id}>
                        <TableCell className="font-medium">{adicional.nome}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(adicional.categorias || []).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(adicional.preco || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditAdicional(adicional)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAdicional(adicional.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizacoes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gerenciar Personalizações</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre opções de personalização como "sem cebola", "sem molho", etc.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Personalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Personalização</Label>
                  <Input
                    placeholder="Ex: Sem cebola"
                    value={novaPersonalizacao.nome}
                    onChange={(e) => setNovaPersonalizacao({ ...novaPersonalizacao, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={novaPersonalizacao.tipo}
                    onValueChange={(value: "remover" | "substituir") =>
                      setNovaPersonalizacao({ ...novaPersonalizacao, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remover">Remover</SelectItem>
                      <SelectItem value="substituir">Substituir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Descrição adicional"
                    value={novaPersonalizacao.descricao}
                    onChange={(e) => setNovaPersonalizacao({ ...novaPersonalizacao, descricao: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categorias onde deve aparecer</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {categoriasDisponiveis.map((categoria) => (
                      <div key={categoria} className="flex items-center space-x-2">
                        <Checkbox
                          id={`personalizacao-categoria-${categoria}`}
                          checked={novaPersonalizacao.categorias.includes(categoria)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNovaPersonalizacao((prev) => ({
                                ...prev,
                                categorias: [...prev.categorias, categoria],
                              }))
                            } else {
                              setNovaPersonalizacao((prev) => ({
                                ...prev,
                                categorias: prev.categorias.filter((c) => c !== categoria),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`personalizacao-categoria-${categoria}`} className="text-sm cursor-pointer">
                          {categoria}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleAddPersonalizacao} disabled={novaPersonalizacao.categorias.length === 0}>
                {editingPersonalizacao ? "Salvar Alterações" : "Adicionar Personalização"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalizações Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {personalizacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Minus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma personalização cadastrada</p>
                  <p className="text-sm">Adicione opções de personalização para seus combos.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categorias</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personalizacoes.map((personalizacao) => (
                      <TableRow key={personalizacao.id}>
                        <TableCell className="font-medium">{personalizacao.nome}</TableCell>
                        <TableCell>
                          <Badge
                            variant={personalizacao.tipo === "remover" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {personalizacao.tipo === "remover" ? "Remover" : "Substituir"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(personalizacao.categorias || []).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {personalizacao.descricao || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPersonalizacao(personalizacao)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePersonalizacao(personalizacao.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
