"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePricing } from "@/components/pricing-context-supabase"
import { TrendingUp, AlertTriangle, DollarSign, BarChart3 } from "lucide-react"

export default function RelacaoProdutos() {
  const { produtos, bebidas, combos, insumos, custosFixos, custosVariaveis, calculateCMV } = usePricing()
  const [selectedCategory, setSelectedCategory] = useState<"todos" | "produtos" | "bebidas" | "combos">("todos")

  const toNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Calcular total de custos fixos mensais
  const totalCustosFixos = custosFixos.reduce((total, custo) => total + toNumber(custo.valor), 0)

  // Calcular total de custos variáveis (percentual)
  const totalCustosVariaveis = custosVariaveis.reduce((total, custo) => total + toNumber(custo.percentual), 0)

  // Função para calcular rateio de custo fixo por produto (baseado no preço de venda)
  const calcularRateioCustoFixo = (precoVenda: number, totalVendasEstimadas: number) => {
    if (totalVendasEstimadas === 0) return 0
    const participacao = precoVenda / totalVendasEstimadas
    return (totalCustosFixos * participacao) / 30 // Dividido por 30 dias
  }

  // Função para calcular custo variável por produto
  const calcularCustoVariavel = (precoVenda: number) => {
    return precoVenda * (totalCustosVariaveis / 100)
  }

  // Função para analisar um produto
  const analisarProduto = (item: any, tipo: "produto" | "bebida" | "combo") => {
    let precoVenda = 0
    let cmv = 0

    if (tipo === "produto") {
      precoVenda = toNumber(item.precoVenda)
      cmv = toNumber(calculateCMV(item.id))
    } else if (tipo === "bebida") {
      // Para bebidas, calcular preço baseado no custo e markup
      const custoUnitario = toNumber(item.custoUnitario || item.custo_unitario)
      const markup = toNumber(item.markup)
      precoVenda = custoUnitario * (1 + markup / 100)
      cmv = custoUnitario
    } else if (tipo === "combo") {
      // Para combos, usar preço final após desconto
      precoVenda = toNumber(item.precoFinal || item.preco_final)
      cmv = toNumber(item.precoOriginal || item.preco_original || 0)
    }

    const custoVariavel = calcularCustoVariavel(precoVenda)

    // Estimativa simples de rateio (pode ser melhorada com dados reais de vendas)
    const totalEstimado = [
      ...produtos.map((p) => toNumber(p.precoVenda)),
      ...bebidas.map((b) => {
        const custoUnitario = toNumber(b.custoUnitario || b.custo_unitario)
        const markup = toNumber(b.markup)
        return custoUnitario * (1 + markup / 100)
      }),
      ...combos.map((c) => toNumber(c.precoFinal || c.preco_final)),
    ].reduce((sum, p) => sum + p, 0)

    const custoFixoRateado = calcularRateioCustoFixo(precoVenda, totalEstimado)

    const custoTotal = cmv + custoVariavel + custoFixoRateado
    const margemBruta = precoVenda - cmv
    const margemLiquida = precoVenda - custoTotal
    const percentualMargemLiquida = precoVenda > 0 ? (margemLiquida / precoVenda) * 100 : 0
    const roi = cmv > 0 ? (margemLiquida / cmv) * 100 : 0

    return {
      ...item,
      tipo,
      cmv,
      custoVariavel,
      custoFixoRateado,
      custoTotal,
      margemBruta,
      margemLiquida,
      percentualMargemLiquida,
      roi,
      precoVenda,
    }
  }

  // Analisar todos os itens
  const itensAnalisados = [
    ...produtos.map((p) => analisarProduto(p, "produto")),
    ...bebidas.map((b) => analisarProduto(b, "bebida")),
    ...combos.map((c) => analisarProduto(c, "combo")),
  ].filter((item) => {
    if (selectedCategory === "todos") return true
    return item.tipo === selectedCategory.slice(0, -1) // Remove 's' do final
  })

  // Ordenar por rentabilidade
  const itensPorRentabilidade = [...itensAnalisados].sort((a, b) => b.margemLiquida - a.margemLiquida)
  const itensProblematicos = itensAnalisados.filter((item) => item.margemLiquida < 0)
  const itensMaisRentaveis = itensPorRentabilidade.slice(0, 5)

  // Estatísticas gerais
  const totalItens = itensAnalisados.length
  const margemMediaLiquida =
    itensAnalisados.length > 0
      ? itensAnalisados.reduce((sum, item) => sum + item.percentualMargemLiquida, 0) / itensAnalisados.length
      : 0

  const getBadgeVariant = (margem: number) => {
    if (margem < 0) return "destructive"
    if (margem < 10) return "secondary"
    if (margem < 25) return "default"
    return "default"
  }

  const getBadgeColor = (margem: number) => {
    if (margem < 0) return "bg-red-500"
    if (margem < 10) return "bg-yellow-500"
    if (margem < 25) return "bg-blue-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relação de Produtos</h2>
          <p className="text-muted-foreground">Análise completa de rentabilidade com todos os custos incluídos</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItens}</div>
            <p className="text-xs text-muted-foreground">Produtos analisados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{margemMediaLiquida.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Margem líquida média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Problemáticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{itensProblematicos.length}</div>
            <p className="text-xs text-muted-foreground">Com margem negativa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos/Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(totalCustosFixos / 30).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Rateio diário</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === "todos" ? "default" : "outline"}
          onClick={() => setSelectedCategory("todos")}
        >
          Todos
        </Button>
        <Button
          variant={selectedCategory === "produtos" ? "default" : "outline"}
          onClick={() => setSelectedCategory("produtos")}
        >
          Produtos
        </Button>
        <Button
          variant={selectedCategory === "bebidas" ? "default" : "outline"}
          onClick={() => setSelectedCategory("bebidas")}
        >
          Bebidas
        </Button>
        <Button
          variant={selectedCategory === "combos" ? "default" : "outline"}
          onClick={() => setSelectedCategory("combos")}
        >
          Combos
        </Button>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="completa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completa">Análise Completa</TabsTrigger>
          <TabsTrigger value="rentabilidade">Ranking de Rentabilidade</TabsTrigger>
          <TabsTrigger value="problemas">Itens Problemáticos</TabsTrigger>
        </TabsList>

        <TabsContent value="completa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada por Produto</CardTitle>
              <CardDescription>
                Custos completos incluindo CMV, custos variáveis e rateio de custos fixos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Preço Venda</TableHead>
                      <TableHead className="text-right">CMV</TableHead>
                      <TableHead className="text-right">Custo Variável</TableHead>
                      <TableHead className="text-right">Custo Fixo</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                      <TableHead className="text-right">Margem Líquida</TableHead>
                      <TableHead className="text-right">% Margem</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensAnalisados.map((item) => (
                      <TableRow key={`${item.tipo}-${item.id}`}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {item.precoVenda.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.cmv.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.custoVariavel.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.custoFixoRateado.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.custoTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.margemLiquida < 0 ? "text-red-600" : "text-green-600"}>
                            R$ {item.margemLiquida.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={getBadgeVariant(item.percentualMargemLiquida)}
                            className={getBadgeColor(item.percentualMargemLiquida)}
                          >
                            {item.percentualMargemLiquida.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.roi < 0 ? "text-red-600" : "text-green-600"}>
                            {item.roi.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentabilidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Rentabilidade</CardTitle>
              <CardDescription>Produtos ordenados por margem líquida (maior lucro real)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itensMaisRentaveis.map((item, index) => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.nome}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{item.tipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">R$ {item.margemLiquida.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.percentualMargemLiquida.toFixed(1)}% de margem
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problemas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Itens Problemáticos
              </CardTitle>
              <CardDescription>Produtos com margem negativa que precisam de revisão urgente</CardDescription>
            </CardHeader>
            <CardContent>
              {itensProblematicos.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600">Parabéns!</h3>
                  <p className="text-muted-foreground">Nenhum produto com margem negativa encontrado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itensProblematicos.map((item) => (
                    <div
                      key={`${item.tipo}-${item.id}`}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div>
                        <h4 className="font-semibold">{item.nome}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{item.tipo}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Custo total: R$ {item.custoTotal.toFixed(2)} | Preço: R$ {item.precoVenda.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">R$ {item.margemLiquida.toFixed(2)}</div>
                        <div className="text-sm text-red-500">{item.percentualMargemLiquida.toFixed(1)}% de margem</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Preço sugerido: R$ {(item.custoTotal * 1.3).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
