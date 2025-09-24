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
import { Plus, Edit, Trash2, Calculator } from "lucide-react"
import type { CustoFixo } from "@/app/page"

const categoriasCustoFixo = [
  "Aluguel",
  "Energia Elétrica",
  "Água",
  "Internet",
  "Telefone",
  "Funcionários",
  "Sistemas",
  "Pró-labore",
  "Seguros",
  "Contabilidade",
  "Marketing",
  "Outros",
]

const frequenciasCustoFixo = ["Mensal", "Anual", "Trimestral", "Semestral", "Semanal", "Diário"]

export default function CustosFixosModule() {
  const { custosFixos, addCustoFixo, updateCustoFixo, deleteCustoFixo, getTotalCustosFixos } = useDatabasePricing()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCusto, setEditingCusto] = useState<CustoFixo | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "",
    frequencia: "Mensal", // Default to monthly
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const custoData = {
      nome: formData.nome,
      valor: Number.parseFloat(formData.valor),
      categoria: formData.categoria,
      frequencia: formData.frequencia,
    }

    console.log("[v0] Submitting fixed cost data:", custoData)

    if (editingCusto) {
      updateCustoFixo(editingCusto.id, custoData)
    } else {
      addCustoFixo(custoData)
    }

    setFormData({ nome: "", valor: "", categoria: "", frequencia: "Mensal" })
    setEditingCusto(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (custo: CustoFixo) => {
    setEditingCusto(custo)
    setFormData({
      nome: custo.nome,
      valor: custo.valor.toString(),
      categoria: custo.categoria,
      frequencia: custo.frequencia,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este custo fixo?")) {
      deleteCustoFixo(id)
    }
  }

  const totalCustosFixos = getTotalCustosFixos()

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalCustosFixos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Custos fixos mensais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custosFixos.length}</div>
            <p className="text-xs text-muted-foreground">Custos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalCustosFixos / 30).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Média diária</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão para adicionar novo custo */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Custos Fixos Cadastrados</h3>
          <p className="text-sm text-muted-foreground">Gerencie todos os custos fixos mensais do seu negócio</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCusto(null)
                setFormData({ nome: "", valor: "", categoria: "", frequencia: "Mensal" })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCusto ? "Editar Custo Fixo" : "Adicionar Custo Fixo"}</DialogTitle>
              <DialogDescription>
                {editingCusto ? "Edite as informações do custo fixo." : "Adicione um novo custo fixo mensal."}
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
                    placeholder="Ex: Aluguel do estabelecimento"
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
                      {categoriasCustoFixo.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select
                    value={formData.frequencia}
                    onValueChange={(value) => setFormData({ ...formData, frequencia: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequenciasCustoFixo.map((frequencia) => (
                        <SelectItem key={frequencia} value={frequencia}>
                          {frequencia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
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

      {/* Tabela de custos fixos */}
      <Card>
        <CardContent className="p-0">
          {custosFixos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum custo fixo cadastrado</p>
              <p className="text-sm">Adicione seus custos fixos mensais para começar a calcular a precificação.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Valor Diário</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosFixos.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell className="font-medium">{custo.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{custo.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{custo.frequencia}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {custo.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {(custo.valor / 30).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
