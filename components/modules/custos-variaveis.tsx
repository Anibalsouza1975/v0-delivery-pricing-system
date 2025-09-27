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
import { usePricing } from "@/components/pricing-context-supabase"
import { Plus, Edit, Trash2, TrendingUp, Percent } from "lucide-react"
import type { CustoVariavel } from "@/app/page"

const categoriasCustoVariavel = [
  "Combustível",
  "Taxa de Cartão",
  "Comissão iFood",
  "Comissão Uber Eats",
  "Comissão Rappi",
  "Taxa de Entrega",
  "Embalagens",
  "Marketing Digital",
  "Empréstimos",
  "Outros",
]

export default function CustosVariaveisModule() {
  const { custosVariaveis, addCustoVariavel, updateCustoVariavel, deleteCustoVariavel, getTotalCustosVariaveis } =
    usePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCusto, setEditingCusto] = useState<CustoVariavel | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    percentual: "",
    categoria: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const custoData = {
      nome: formData.nome,
      percentual: Number.parseFloat(formData.percentual),
      categoria: formData.categoria,
    }

    if (editingCusto) {
      updateCustoVariavel(editingCusto.id, custoData)
    } else {
      addCustoVariavel(custoData)
    }

    setFormData({ nome: "", percentual: "", categoria: "" })
    setEditingCusto(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (custo: CustoVariavel) => {
    setEditingCusto(custo)
    setFormData({
      nome: custo.nome,
      percentual: custo.percentual.toString(),
      categoria: custo.categoria,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este custo variável?")) {
      deleteCustoVariavel(id)
    }
  }

  const totalCustosVariaveis = getTotalCustosVariaveis()

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Percentual</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalCustosVariaveis.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Sobre o faturamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custosVariaveis.length}</div>
            <p className="text-xs text-muted-foreground">Custos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulação R$ 1.000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((1000 * totalCustosVariaveis) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Custo em R$ 1.000 de venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão para adicionar novo custo */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Custos Variáveis Cadastrados</h3>
          <p className="text-sm text-muted-foreground">Gerencie todos os custos que variam conforme o faturamento</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCusto(null)
                setFormData({ nome: "", percentual: "", categoria: "" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCusto ? "Editar Custo Variável" : "Adicionar Custo Variável"}</DialogTitle>
              <DialogDescription>
                {editingCusto
                  ? "Edite as informações do custo variável."
                  : "Adicione um novo custo variável percentual."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Custo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Taxa de cartão de crédito"
                    required
                  />
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
                      {categoriasCustoVariavel.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="percentual">Percentual (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentual}
                    onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingCusto ? "Salvar Alterações" : "Adicionar Custo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de custos variáveis */}
      <Card>
        <CardContent className="p-0">
          {custosVariaveis.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum custo variável cadastrado</p>
              <p className="text-sm">Adicione seus custos variáveis para calcular o impacto no faturamento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                  <TableHead className="text-right">Em R$ 100</TableHead>
                  <TableHead className="text-right">Em R$ 1.000</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosVariaveis.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell className="font-medium">{custo.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{custo.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{custo.percentual.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {((100 * custo.percentual) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {((1000 * custo.percentual) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(custo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(custo.id)}
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
