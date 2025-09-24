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
import { useDatabasePricing } from "@/components/database-pricing-context"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import type { Insumo } from "@/app/page"

const categoriasInsumo = [
  "Carnes",
  "Pães",
  "Queijos",
  "Vegetais",
  "Molhos",
  "Temperos",
  "Embalagens",
  "Bebidas",
  "Sobremesas",
  "Batatas",
  "BBQ",
  "Acompanhamentos",
  "Promoções",
  "Outros",
]

const unidadesUso = ["g", "ml", "cm", "unidade", "fatia", "porção", "pacote", "lata", "garrafa", "caixa", "fardo"]

export default function CadastroInsumosModule() {
  const { insumos, addInsumo, updateInsumo, deleteInsumo, ingredientesBase } = useDatabasePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    ingredienteBaseId: "",
    quantidadeUso: "",
    unidadeUso: "",
    categoria: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const ingredienteBase = ingredientesBase?.find((i) => i.id === formData.ingredienteBaseId)
    if (!ingredienteBase) return

    let precoCalculado = 0
    const quantidade = Number.parseFloat(formData.quantidadeUso)

    if (ingredienteBase.unidade === "kg" && formData.unidadeUso === "g") {
      // Conversão kg para g
      precoCalculado = (ingredienteBase.precoUnitario * quantidade) / 1000
    } else if (ingredienteBase.unidade === "L" && formData.unidadeUso === "ml") {
      // Conversão L para ml
      precoCalculado = (ingredienteBase.precoUnitario * quantidade) / 1000
    } else if (ingredienteBase.unidade === "g" && formData.unidadeUso === "g") {
      // g para g (direto)
      precoCalculado = ingredienteBase.precoUnitario * quantidade
    } else if (ingredienteBase.unidade === "ml" && formData.unidadeUso === "ml") {
      // ml para ml (direto)
      precoCalculado = ingredienteBase.precoUnitario * quantidade
    } else if (
      ["unidade", "fatia", "porção", "pacote", "lata", "garrafa", "caixa", "fardo"].includes(ingredienteBase.unidade) &&
      ["unidade", "fatia", "porção"].includes(formData.unidadeUso)
    ) {
      // Unidades discretas (unidade, fatia, porção, pacote, etc.)
      precoCalculado = ingredienteBase.precoUnitario * quantidade
    } else if (ingredienteBase.unidade === formData.unidadeUso) {
      // Mesma unidade (qualquer uma)
      precoCalculado = ingredienteBase.precoUnitario * quantidade
    } else {
      // Fallback: assume conversão direta
      precoCalculado = ingredienteBase.precoUnitario * quantidade
    }

    const insumoData = {
      nome: formData.nome,
      ingredienteBaseId: formData.ingredienteBaseId,
      ingredienteBaseNome: ingredienteBase.nome,
      quantidadeUso: quantidade,
      unidadeUso: formData.unidadeUso,
      categoria: formData.categoria,
      precoUnitario: precoCalculado,
    }

    if (editingInsumo) {
      updateInsumo(editingInsumo.id, insumoData)
    } else {
      addInsumo(insumoData)
    }

    setFormData({
      nome: "",
      ingredienteBaseId: "",
      quantidadeUso: "",
      unidadeUso: "",
      categoria: "",
    })
    setEditingInsumo(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setFormData({
      nome: insumo.nome,
      ingredienteBaseId: insumo.ingredienteBaseId,
      quantidadeUso: insumo.quantidadeUso?.toString() || "",
      unidadeUso: insumo.unidadeUso || "",
      categoria: insumo.categoria,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este insumo?")) {
      deleteInsumo(id)
    }
  }

  const totalInsumos = insumos.length
  const valorTotalEstoque = insumos.reduce((total, insumo) => total + insumo.precoUnitario, 0)

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Insumos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalInsumos}</div>
            <p className="text-xs text-muted-foreground">Insumos criados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInsumos > 0
                ? (valorTotalEstoque / totalInsumos).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "R$ 0,00"}
            </div>
            <p className="text-xs text-muted-foreground">Por insumo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(insumos.map((i) => i.categoria)).size}</div>
            <p className="text-xs text-muted-foreground">Diferentes categorias</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão para adicionar novo insumo */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Insumos para Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Crie insumos baseados nos ingredientes base (ex: Hambúrguer 160g usando Carne Bovina)
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingInsumo(null)
                setFormData({
                  nome: "",
                  ingredienteBaseId: "",
                  quantidadeUso: "",
                  unidadeUso: "",
                  categoria: "",
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingInsumo ? "Editar Insumo" : "Criar Insumo"}</DialogTitle>
              <DialogDescription>Crie um insumo baseado em um ingrediente base cadastrado.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Insumo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Hambúrguer 160g, Queijo 2 fatias"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ingredienteBase">Ingrediente Base</Label>
                  <Select
                    value={formData.ingredienteBaseId}
                    onValueChange={(value) => setFormData({ ...formData, ingredienteBaseId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ingrediente base" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantidadeUso">Quantidade por Porção</Label>
                    <Input
                      id="quantidadeUso"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantidadeUso}
                      onChange={(e) => setFormData({ ...formData, quantidadeUso: e.target.value })}
                      placeholder="Ex: 160"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unidadeUso">Unidade de Uso</Label>
                    <Select
                      value={formData.unidadeUso}
                      onValueChange={(value) => setFormData({ ...formData, unidadeUso: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">gramas (g)</SelectItem>
                        <SelectItem value="ml">mililitros (ml)</SelectItem>
                        <SelectItem value="unidade">unidade</SelectItem>
                        <SelectItem value="fatia">fatia</SelectItem>
                        <SelectItem value="porção">porção</SelectItem>
                        <SelectItem value="pacote">pacote</SelectItem>
                        <SelectItem value="lata">lata</SelectItem>
                        <SelectItem value="garrafa">garrafa</SelectItem>
                        <SelectItem value="caixa">caixa</SelectItem>
                        <SelectItem value="fardo">fardo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasInsumo.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.ingredienteBaseId && formData.quantidadeUso && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">💰 Cálculo de Custo:</h4>
                    <div className="text-xs text-green-700">
                      {(() => {
                        const ingredienteBase = ingredientesBase?.find((i) => i.id === formData.ingredienteBaseId)
                        if (!ingredienteBase) return null

                        const quantidade = Number.parseFloat(formData.quantidadeUso || "0")
                        let custoCalculado = 0

                        if (ingredienteBase.unidade === "kg" && formData.unidadeUso === "g") {
                          custoCalculado = (ingredienteBase.precoUnitario * quantidade) / 1000
                        } else if (ingredienteBase.unidade === "L" && formData.unidadeUso === "ml") {
                          custoCalculado = (ingredienteBase.precoUnitario * quantidade) / 1000
                        } else if (ingredienteBase.unidade === "g" && formData.unidadeUso === "g") {
                          custoCalculado = ingredienteBase.precoUnitario * quantidade
                        } else if (ingredienteBase.unidade === "ml" && formData.unidadeUso === "ml") {
                          custoCalculado = ingredienteBase.precoUnitario * quantidade
                        } else if (
                          ["unidade", "fatia", "porção", "pacote", "lata", "garrafa", "caixa", "fardo"].includes(
                            ingredienteBase.unidade,
                          ) &&
                          ["unidade", "fatia", "porção"].includes(formData.unidadeUso)
                        ) {
                          custoCalculado = ingredienteBase.precoUnitario * quantidade
                        } else if (ingredienteBase.unidade === formData.unidadeUso) {
                          custoCalculado = ingredienteBase.precoUnitario * quantidade
                        } else {
                          custoCalculado = ingredienteBase.precoUnitario * quantidade
                        }

                        return (
                          <p>
                            <strong>{formData.nome || "Insumo"}:</strong> {quantidade}
                            {formData.unidadeUso} de {ingredienteBase.nome} ={" "}
                            <span className="font-bold text-green-600">
                              {custoCalculado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </p>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">{editingInsumo ? "Salvar Alterações" : "Criar Insumo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de insumos */}
      <Card>
        <CardContent className="p-0">
          {insumos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum insumo criado</p>
              <p className="text-sm">Crie insumos baseados nos ingredientes base para usar nas fichas técnicas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Insumo</TableHead>
                  <TableHead>Ingrediente Base</TableHead>
                  <TableHead>Quantidade de Uso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Custo por Porção</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{insumo.ingredienteBaseNome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {insumo.quantidadeUso}
                      {insumo.unidadeUso}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{insumo.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {insumo.precoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(insumo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(insumo.id)}
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
