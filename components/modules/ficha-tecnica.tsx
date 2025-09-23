"use client"

import type React from "react"

import { useState } from "react"
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
import { usePricing } from "@/components/pricing-context"
import { Plus, Edit, Trash2, FileText, Minus } from "lucide-react"
import type { Produto } from "@/app/page"
import { Checkbox } from "@/components/ui/checkbox"

const categoriasProduto = [
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
  "Até 20% off (com desconto)",
  "Promoção 20% Off (Novidade Temporária)",
  "Outros",
]

interface Adicional {
  id: string
  nome: string
  preco: number
  insumoId?: string
  categorias: string[] // Categorias onde este adicional pode ser usado
}

interface Personalizacao {
  id: string
  nome: string
  tipo: "remover" | "substituir"
  descricao?: string
  categorias: string[] // Categorias onde esta personalização pode ser usada
}

export default function FichaTecnicaModule() {
  const {
    produtos,
    insumos,
    ingredientesBase,
    addIngredienteBase,
    updateIngredienteBase,
    deleteIngredienteBase,
    adicionais,
    personalizacoes,
    setAdicionais,
    setPersonalizacoes,
    addProduto,
    updateProduto,
    deleteProduto,
  } = usePricing()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState("")

  const [isAdicionaisDialogOpen, setIsAdicionaisDialogOpen] = useState(false)
  const [novoAdicional, setNovoAdicional] = useState({
    nome: "",
    preco: "",
    insumoId: "",
    categorias: [] as string[],
  })

  const [isPersonalizacoesDialogOpen, setIsPersonalizacoesDialogOpen] = useState(false)
  const [novaPersonalizacao, setNovaPersonalizacao] = useState({
    nome: "",
    tipo: "remover" as const,
    descricao: "",
    categorias: [] as string[],
  })

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
    "Até 20% off (com desconto)",
    "Promoção 20% Off (Novidade Temporária)",
    "Combos",
    "Outros",
  ]

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    margemLucro: "30",
    insumos: [{ insumoId: "", quantidade: "" }],
    valorFrete: "5.00",
    freteGratis: false,
    cupomDesconto: "0",
    comissaoIfood: "27",
    foto: "",
    descricao: "",
  })

  const [editingAdicional, setEditingAdicional] = useState<Adicional | null>(null)
  const [editingPersonalizacao, setEditingPersonalizacao] = useState<Personalizacao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [insumosData, setInsumosData] = useState<{ insumoId: string; quantidade: string }[]>([])

  const saveAdicionais = (newAdicionais: Adicional[]) => {
    console.log("[v0] SALVANDO ADICIONAIS:", newAdicionais)
    setAdicionais(newAdicionais)
  }

  const handleAddAdicional = () => {
    if (!novoAdicional.nome.trim() || !novoAdicional.preco || novoAdicional.categorias.length === 0) return

    console.log("[v0] CRIANDO ADICIONAL:", {
      nome: novoAdicional.nome,
      categorias: novoAdicional.categorias,
      temCombos: novoAdicional.categorias.includes("Combos"),
    })

    const adicional: Adicional = {
      id: Date.now().toString(),
      nome: novoAdicional.nome.trim(),
      preco: Number.parseFloat(novoAdicional.preco),
      insumoId: novoAdicional.insumoId || undefined,
      categorias: novoAdicional.categorias,
    }

    if (editingAdicional) {
      const updated = adicionais.map((a) =>
        a.id === editingAdicional.id ? { ...adicional, id: editingAdicional.id } : a,
      )
      saveAdicionais(updated)
      setEditingAdicional(null)
    } else {
      saveAdicionais([...adicionais, adicional])
    }

    setNovoAdicional({ nome: "", preco: "", insumoId: "", categorias: [] })
  }

  const handleEditAdicional = (adicional: Adicional) => {
    setEditingAdicional(adicional)
    setNovoAdicional({
      nome: adicional.nome,
      preco: adicional.preco.toString(),
      insumoId: (adicional as any).insumoId || "",
      categorias: adicional.categorias || [],
    })
  }

  const savePersonalizacoes = (newPersonalizacoes: Personalizacao[]) => {
    console.log("[v0] SALVANDO PERSONALIZAÇÕES:", newPersonalizacoes)
    setPersonalizacoes(newPersonalizacoes)
  }

  const handleAddPersonalizacao = () => {
    if (!novaPersonalizacao.nome.trim() || novaPersonalizacao.categorias.length === 0) return

    const personalizacao: Personalizacao = {
      id: Date.now().toString(),
      nome: novaPersonalizacao.nome.trim(),
      tipo: novaPersonalizacao.tipo,
      descricao: novaPersonalizacao.descricao.trim() || undefined,
      categorias: novaPersonalizacao.categorias,
    }

    if (editingPersonalizacao) {
      const updated = personalizacoes.map((p) =>
        p.id === editingPersonalizacao.id ? { ...personalizacao, id: editingPersonalizacao.id } : p,
      )
      savePersonalizacoes(updated)
      setEditingPersonalizacao(null)
    } else {
      savePersonalizacoes([...personalizacoes, personalizacao])
    }

    setNovaPersonalizacao({ nome: "", tipo: "remover", descricao: "", categorias: [] })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Submetendo produto com categoria:", formData.categoria)

    const insumosData = formData.insumos
      .filter((item) => item.insumoId && item.quantidade)
      .map((item) => ({
        insumoId: item.insumoId,
        quantidade: Number.parseFloat(item.quantidade),
      }))

    if (!formData.categoria) {
      alert("Por favor, selecione uma categoria para o produto.")
      return
    }

    if (!formData.nome.trim()) {
      alert("Por favor, informe o nome do produto.")
      return
    }

    console.log("[v0] Insumos encontrados:", insumosData.length)

    if (formData.categoria && !categoriasProduto.includes(formData.categoria)) {
      categoriasProduto.push(formData.categoria)
      console.log("[v0] Nova categoria adicionada:", formData.categoria)
    }

    const cmvCalculado = insumosData.reduce((total, item) => {
      const insumo = insumos.find((i) => i.id === item.insumoId)
      return total + (insumo ? insumo.precoUnitario * item.quantidade : 0)
    }, 0)

    const precoVendaCalculado =
      cmvCalculado > 0 ? cmvCalculado + (cmvCalculado * Number(formData.margemLucro)) / 100 : 0

    const precoIfoodBaseCalculado =
      precoVendaCalculado + (formData.freteGratis ? 0 : Number(formData.valorFrete)) - Number(formData.cupomDesconto)
    const precoIfoodCalculado = precoIfoodBaseCalculado / (1 - Number(formData.comissaoIfood) / 100)

    const produtoData = {
      nome: formData.nome,
      categoria: formData.categoria,
      foto: formData.foto,
      descricao: formData.descricao,
      insumos: insumosData,
      cmv: cmvCalculado,
      precoVenda: precoVendaCalculado,
      margemLucro: Number(formData.margemLucro),
      valorFrete: Number(formData.valorFrete),
      freteGratis: formData.freteGratis,
      cupomDesconto: Number(formData.cupomDesconto),
      comissaoIfood: Number(formData.comissaoIfood),
      precoIfood: precoIfoodCalculado,
    }

    console.log("[v0] Dados do produto a ser salvo:", produtoData)

    try {
      if (editingProduto) {
        updateProduto(editingProduto.id, produtoData)
        console.log("[v0] Produto atualizado com sucesso")
      } else {
        addProduto(produtoData)
        console.log("[v0] Produto adicionado com sucesso")
      }

      alert("Produto salvo com sucesso!")

      setFormData({
        nome: "",
        categoria: "",
        foto: "",
        descricao: "",
        margemLucro: "30",
        valorFrete: "5.00",
        freteGratis: false,
        cupomDesconto: "0",
        comissaoIfood: "27",
      })
      setInsumosData([])
      setEditingProduto(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error("[v0] Erro ao salvar produto:", error)
      alert("Erro ao salvar produto. Tente novamente.")
    }
  }

  const handleEdit = (produto: any) => {
    console.log("[v0] Editando produto:", produto)
    setEditingProduto(produto)
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      foto: produto.foto || "",
      descricao: produto.descricao || "",
      margemLucro: produto.margemLucro?.toString() || "30",
      insumos: produto.insumos || [{ insumoId: "", quantidade: "" }],
      valorFrete: produto.valorFrete?.toString() || "5.00",
      freteGratis: produto.freteGratis || false,
      cupomDesconto: produto.cupomDesconto?.toString() || "0",
      comissaoIfood: produto.comissaoIfood?.toString() || "27",
    })
    const insumosFormatados =
      produto.insumos?.map((insumo: any) => ({
        insumoId: insumo.insumoId,
        quantidade: insumo.quantidade?.toString() || "",
      })) || []
    setInsumosData(insumosFormatados)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduto(id)
    }
  }

  const addInsumoLine = () => {
    setFormData({
      ...formData,
      insumos: [...formData.insumos, { insumoId: "", quantidade: "" }],
    })
  }

  const removeInsumoLine = (index: number) => {
    const newInsumos = formData.insumos.filter((_, i) => i !== index)
    setFormData({ ...formData, insumos: newInsumos })
  }

  const updateInsumoLine = (index: number, field: string, value: string) => {
    const newInsumos = [...formData.insumos]
    newInsumos[index] = { ...newInsumos[index], [field]: value }
    setFormData({ ...formData, insumos: newInsumos })
  }

  const calculateCurrentCMV = () => {
    if (!formData.insumos || !Array.isArray(formData.insumos)) {
      return 0
    }
    return formData.insumos.reduce((total, item) => {
      if (!item.insumoId || !item.quantidade) return total
      const insumo = insumos.find((i) => i.id === item.insumoId)
      return total + (insumo ? insumo.precoUnitario * Number.parseFloat(item.quantidade) : 0)
    }, 0)
  }

  const currentCMV = calculateCurrentCMV()
  const currentPrecoVenda = currentCMV + (currentCMV * Number.parseFloat(formData.margemLucro)) / 100

  const currentValorFrete = Number.parseFloat(formData.valorFrete || "0")
  const currentCupomDesconto = Number.parseFloat(formData.cupomDesconto || "0")
  const currentComissaoIfood = Number.parseFloat(formData.comissaoIfood || "27")

  const currentPrecoIfoodBase =
    currentPrecoVenda + (formData.freteGratis ? 0 : currentValorFrete) - currentCupomDesconto
  const currentPrecoIfood = currentPrecoIfoodBase / (1 - currentComissaoIfood / 100)

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

  const handleDeletePersonalizacao = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta personalização?")) {
      const updatedPersonalizacoes = personalizacoes.filter((p) => p.id !== id)
      savePersonalizacoes(updatedPersonalizacoes)
    }
  }

  const handleDeleteAdicional = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este adicional?")) {
      const updatedAdicionais = adicionais.filter((a) => a.id !== id)
      console.log("[v0] EXCLUINDO ADICIONAL:", { id, restantes: updatedAdicionais.length })
      saveAdicionais(updatedAdicionais)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{produtos.length}</div>
            <p className="text-xs text-muted-foreground">Fichas técnicas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adicionais Cadastrados</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adicionais.length}</div>
            <p className="text-xs text-muted-foreground">Ingredientes extras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personalizações</CardTitle>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{personalizacoes.length}</div>
            <p className="text-xs text-muted-foreground">Opções de remoção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.length > 0
                ? (produtos.reduce((total, p) => total + p.cmv, 0) / produtos.length).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "R$ 0,00"}
            </div>
            <p className="text-xs text-muted-foreground">Custo médio dos produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.length > 0
                ? (produtos.reduce((total, p) => total + p.margemLucro, 0) / produtos.length).toFixed(1) + "%"
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Margem de lucro média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {produtos.length > 0
                ? (produtos.reduce((total, p) => total + p.precoVenda, 0) / produtos.length).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "R$ 0,00"}
            </div>
            <p className="text-xs text-muted-foreground">Preço médio de venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Botões para adicionar novo produto e gerenciar adicionais */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fichas Técnicas de Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Monte suas fichas técnicas e gerencie os adicionais e personalizações disponíveis
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isPersonalizacoesDialogOpen} onOpenChange={setIsPersonalizacoesDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Minus className="h-4 w-4 mr-2" />
                Gerenciar Personalizações
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Gerenciar Personalizações</DialogTitle>
                <DialogDescription>
                  Cadastre opções de personalização como "sem cebola", "sem molho", etc. que podem ser aplicadas aos
                  produtos.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nome da personalização"
                      value={novaPersonalizacao.nome}
                      onChange={(e) => setNovaPersonalizacao({ ...novaPersonalizacao, nome: e.target.value })}
                    />
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
                    <Input
                      placeholder="Descrição (opcional)"
                      value={novaPersonalizacao.descricao}
                      onChange={(e) => setNovaPersonalizacao({ ...novaPersonalizacao, descricao: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categorias onde deve aparecer</Label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {(categoriasDisponiveis || []).map((categoria) => (
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
                    <p className="text-xs text-muted-foreground">
                      Selecione as categorias onde esta personalização deve aparecer
                    </p>
                  </div>

                  <Button onClick={handleAddPersonalizacao} disabled={novaPersonalizacao.categorias.length === 0}>
                    {editingPersonalizacao ? "Salvar" : "Adicionar"}
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto">
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
                      {(personalizacoes || []).map((personalizacao) => (
                        <TableRow key={personalizacao.id}>
                          <TableCell>{personalizacao.nome}</TableCell>
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
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPersonalizacao(personalizacao)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePersonalizacao(personalizacao.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {personalizacoes.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">Nenhuma personalização cadastrada</div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAdicionaisDialogOpen} onOpenChange={setIsAdicionaisDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Adicionais
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Gerenciar Adicionais</DialogTitle>
                <DialogDescription>
                  Cadastre os ingredientes extras que podem ser adicionados aos produtos. Vincule aos insumos para
                  controle de estoque automático.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nome do adicional"
                      value={novoAdicional.nome}
                      onChange={(e) => setNovoAdicional({ ...novoAdicional, nome: e.target.value })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Preço"
                      value={novoAdicional.preco}
                      onChange={(e) => setNovoAdicional({ ...novoAdicional, preco: e.target.value })}
                    />
                    <Select
                      value={novoAdicional.insumoId}
                      onValueChange={(value) => setNovoAdicional({ ...novoAdicional, insumoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Insumo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(insumos || []).map((insumo) => (
                          <SelectItem key={insumo.id} value={insumo.id}>
                            {insumo.nome} ({insumo.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Categorias onde deve aparecer</Label>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {(categoriasDisponiveis || []).map((categoria) => (
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
                    <p className="text-xs text-muted-foreground">
                      Selecione as categorias onde este adicional deve aparecer
                    </p>
                  </div>

                  <Button onClick={handleAddAdicional} disabled={novoAdicional.categorias.length === 0}>
                    {editingAdicional ? "Salvar" : "Adicionar"}
                  </Button>
                </div>

                <div className="flex-1 min-h-0">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categorias</TableHead>
                            <TableHead>Insumo</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(adicionais || []).map((adicional) => {
                            const insumoVinculado = adicional.insumoId
                              ? (insumos || []).find((i) => i.id === adicional.insumoId)
                              : null

                            return (
                              <TableRow key={adicional.id}>
                                <TableCell>{adicional.nome}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {(adicional.categorias || []).map((cat) => (
                                      <Badge key={cat} variant="outline" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {insumoVinculado ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {insumoVinculado.nome}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Sem insumo</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {adicional.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditAdicional(adicional)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAdicional(adicional.id)}
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
                      {adicionais.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">Nenhum adicional cadastrado</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduto(null)
                  setFormData({
                    nome: "",
                    categoria: "",
                    margemLucro: "30",
                    insumos: [{ insumoId: "", quantidade: "" }],
                    valorFrete: "5.00",
                    freteGratis: false,
                    cupomDesconto: "0",
                    comissaoIfood: "27",
                    foto: "",
                    descricao: "",
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Ficha Técnica
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduto ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}</DialogTitle>
                <DialogDescription>
                  {editingProduto
                    ? "Edite as informações do produto."
                    : "Crie uma nova ficha técnica de produto com precificação para iFood."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome do Produto</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: X-Bacon"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      {!showCustomCategory ? (
                        <div className="space-y-2">
                          <Select
                            value={formData.categoria || ""}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setShowCustomCategory(true)
                                setFormData({ ...formData, categoria: "" })
                              } else {
                                setFormData({ ...formData, categoria: value })
                              }
                            }}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {(categoriasProduto || []).map((categoria) => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">
                                <div className="flex items-center">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar nova categoria
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="Digite a nova categoria"
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (customCategory.trim()) {
                                  setFormData({ ...formData, categoria: customCategory.trim() })
                                  setCustomCategory("")
                                  setShowCustomCategory(false)
                                }
                              }}
                            >
                              OK
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCustomCategory(false)
                                setCustomCategory("")
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="foto">Foto do Produto</Label>
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

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição do Produto</Label>
                    <textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva os ingredientes e características do produto..."
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="margemLucro">Margem de Lucro (%)</Label>
                    <Input
                      id="margemLucro"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.margemLucro}
                      onChange={(e) => setFormData({ ...formData, margemLucro: e.target.value })}
                      required
                    />
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-orange-600">Configurações iFood</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="valorFrete">Valor do Frete (R$)</Label>
                        <Input
                          id="valorFrete"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valorFrete}
                          onChange={(e) => setFormData({ ...formData, valorFrete: e.target.value })}
                          disabled={formData.freteGratis}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="comissaoIfood">Comissão iFood (%)</Label>
                        <Input
                          id="comissaoIfood"
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={formData.comissaoIfood}
                          onChange={(e) => setFormData({ ...formData, comissaoIfood: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="freteGratis"
                          checked={formData.freteGratis}
                          onChange={(e) => setFormData({ ...formData, freteGratis: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="freteGratis">Frete Grátis</Label>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cupomDesconto">Cupom de Desconto (R$)</Label>
                        <Input
                          id="cupomDesconto"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cupomDesconto}
                          onChange={(e) => setFormData({ ...formData, cupomDesconto: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ... existing insumos section ... */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Insumos do Produto</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addInsumoLine}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Insumo
                      </Button>
                    </div>

                    {(formData.insumos || []).map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Select
                            value={item.insumoId || ""}
                            onValueChange={(value) => updateInsumoLine(index, "insumoId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o insumo" />
                            </SelectTrigger>
                            <SelectContent>
                              {(insumos || []).map((insumo) => (
                                <SelectItem key={insumo.id} value={insumo.id}>
                                  {insumo.nome} ({insumo.unidade})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantidade}
                            onChange={(e) => updateInsumoLine(index, "quantidade", e.target.value)}
                            placeholder="Qtd"
                          />
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground">
                          {item.insumoId && item.quantidade
                            ? (
                                (insumos.find((i) => i.id === item.insumoId)?.precoUnitario || 0) *
                                Number.parseFloat(item.quantidade)
                              ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "R$ 0,00"}
                        </div>
                        <div className="col-span-1">
                          {formData.insumos.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeInsumoLine(index)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>CMV (Custo):</span>
                      <span className="font-mono">
                        {currentCMV.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem de Lucro:</span>
                      <span className="font-mono">{formData.margemLucro}%</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary">
                      <span>Preço de Venda (Balcão):</span>
                      <span className="font-mono">
                        {currentPrecoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="text-orange-600 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>+ Frete:</span>
                        <span className="font-mono">
                          {formData.freteGratis
                            ? "Grátis"
                            : currentValorFrete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>- Cupom:</span>
                        <span className="font-mono">
                          {currentCupomDesconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Comissão iFood:</span>
                        <span className="font-mono">{formData.comissaoIfood}%</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Preço iFood:</span>
                        <span className="font-mono">
                          {currentPrecoIfood.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingProduto ? "Salvar Alterações" : "Criar Ficha Técnica"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabela de produtos */}
      <Card>
        <CardContent className="p-0">
          {produtos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma ficha técnica cadastrada</p>
              <p className="text-sm">Crie fichas técnicas para calcular CMV e preços de venda dos seus produtos.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">CMV</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Preço Balcão</TableHead>
                  <TableHead className="text-right">Preço iFood</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(produtos || []).map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{produto.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {produto.cmv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right font-mono">{produto.margemLucro.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {produto.precoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-orange-600">
                      {(produto.precoIfood || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleEdit(produto)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(produto.id)}
                          className="text-destructive hover:text-destructive"
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
    </div>
  )
}
