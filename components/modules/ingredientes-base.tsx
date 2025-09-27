"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { usePricing } from "@/components/pricing-context-supabase"
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react"

const categoriasIngrediente = [
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
  "Outros",
]

const unidadesBase = ["kg", "g", "L", "ml", "unidade", "fatia", "porção", "pacote", "lata", "garrafa", "caixa", "fardo"]

export default function IngredientesBaseModule() {
  const { ingredientesBase, addIngredienteBase, updateIngredienteBase, deleteIngredienteBase } = usePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngrediente, setEditingIngrediente] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    unidade: "",
    precoUnitario: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting ingrediente base form:", formData)

      const ingredienteData = {
        nome: formData.nome,
        categoria: formData.categoria,
        unidade: formData.unidade,
        preco_unitario: Number.parseFloat(formData.precoUnitario), // Use snake_case for database
      }

      console.log("[v0] Processed ingrediente data:", ingredienteData)

      if (editingIngrediente) {
        console.log("[v0] Updating ingrediente base:", editingIngrediente.id)
        await updateIngredienteBase(editingIngrediente.id, ingredienteData)
      } else {
        console.log("[v0] Adding new ingrediente base")
        await addIngredienteBase(ingredienteData)
      }

      // Reset form on success
      setFormData({
        nome: "",
        categoria: "",
        unidade: "",
        precoUnitario: "",
      })
      setEditingIngrediente(null)
      setIsDialogOpen(false)
      console.log("[v0] Ingrediente base operation completed successfully")
    } catch (error) {
      console.error("[v0] Erro ao submeter formulário de ingrediente base:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido ao salvar ingrediente base")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (ingrediente: any) => {
    console.log("[v0] Editing ingrediente:", ingrediente)
    setEditingIngrediente(ingrediente)
    setFormData({
      nome: ingrediente.nome,
      categoria: ingrediente.categoria,
      unidade: ingrediente.unidade,
      precoUnitario: (ingrediente.preco_unitario || 0).toString(), // Use snake_case from database
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ingrediente base?")) {
      try {
        console.log("[v0] Deleting ingrediente base:", id)
        await deleteIngredienteBase(id)
        console.log("[v0] Ingrediente base deleted successfully")
      } catch (error) {
        console.error("[v0] Erro ao excluir ingrediente base:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido ao excluir ingrediente base")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Ingredientes Base</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre os ingredientes que você compra (10kg de carne, 2,4kg de queijo, etc.)
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingIngrediente(null)
                setFormData({
                  nome: "",
                  categoria: "",
                  unidade: "",
                  precoUnitario: "",
                })
                setError(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ingrediente Base
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingIngrediente ? "Editar Ingrediente Base" : "Adicionar Ingrediente Base"}</DialogTitle>
              <DialogDescription>Cadastre os ingredientes que você compra para usar nos produtos.</DialogDescription>
            </DialogHeader>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Ingrediente</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Carne Bovina, Queijo Cheddar, Pão Brioche"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasIngrediente.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unidade">Unidade de Compra</Label>
                    <Select
                      value={formData.unidade}
                      onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                      required
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesBase.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="precoUnitario">Preço por {formData.unidade || "unidade"} (R$)</Label>
                    <Input
                      id="precoUnitario"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precoUnitario}
                      onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
                      placeholder="0,00"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Exemplos:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      <strong>Carne Bovina:</strong> 10kg por R$ 350,00 (R$ 35,00/kg)
                    </p>
                    <p>
                      <strong>Queijo Cheddar:</strong> 2,4kg por R$ 120,00 (R$ 50,00/kg)
                    </p>
                    <p>
                      <strong>Pão Brioche:</strong> 12 unidades por R$ 18,00 (R$ 1,50/unidade)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : editingIngrediente ? "Salvar Alterações" : "Adicionar Ingrediente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tabela de ingredientes base */}
      <Card>
        <CardContent className="p-0">
          {ingredientesBase?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum ingrediente base cadastrado</p>
              <p className="text-sm">Cadastre os ingredientes que você compra para usar no controle de estoque.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço Unitário</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientesBase?.map((ingrediente: any) => (
                  <TableRow key={ingrediente.id}>
                    <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ingrediente.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ingrediente.unidade}</TableCell>
                    <TableCell className="text-right font-mono">
                      {(ingrediente.preco_unitario || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      <div className="text-xs text-muted-foreground">por {ingrediente.unidade}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(ingrediente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ingrediente.id)}
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
