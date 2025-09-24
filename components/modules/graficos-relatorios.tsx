"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDatabasePricing } from "@/components/database-pricing-context"
import { BarChart3, TrendingUp, DollarSign, Target, PiIcon as PieIcon, Activity } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Pie,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function GraficosRelatoriosModule() {
  const {
    custosFixos,
    custosVariaveis,
    produtos,
    bebidas,
    combos,
    insumos,
    getTotalCustosFixos,
    getTotalCustosVariaveis,
  } = useDatabasePricing()

  // Dados para gráficos
  const totalCustosFixos = getTotalCustosFixos()
  const totalCustosVariaveis = getTotalCustosVariaveis()

  // Análise de produtos por categoria
  const produtosPorCategoria = produtos.reduce(
    (acc, produto) => {
      const categoria = produto.categoria || "Outros"
      if (!acc[categoria]) {
        acc[categoria] = { categoria, quantidade: 0, valorTotal: 0 }
      }
      acc[categoria].quantidade += 1
      acc[categoria].valorTotal += produto.precoVenda
      return acc
    },
    {} as Record<string, { categoria: string; quantidade: number; valorTotal: number }>,
  )

  const dadosProdutosPorCategoria = Object.values(produtosPorCategoria)

  // Análise de custos fixos por categoria
  const custosPorCategoria = custosFixos.reduce(
    (acc, custo) => {
      const categoria = custo.categoria || "Outros"
      if (!acc[categoria]) {
        acc[categoria] = { categoria, valor: 0 }
      }
      acc[categoria].valor += custo.valor
      return acc
    },
    {} as Record<string, { categoria: string; valor: number }>,
  )

  const dadosCustosPorCategoria = Object.values(custosPorCategoria)

  // Análise de margem de lucro
  const margemPorProduto = produtos
    .map((produto) => ({
      nome: produto.nome.length > 15 ? produto.nome.substring(0, 15) + "..." : produto.nome,
      margem: produto.margemLucro,
      cmv: produto.cmv,
      precoVenda: produto.precoVenda,
    }))
    .slice(0, 10) // Top 10 produtos

  // Análise de bebidas vs produtos
  const comparativoItens = [
    {
      tipo: "Produtos",
      quantidade: produtos.length,
      valorMedio: produtos.length > 0 ? produtos.reduce((sum, p) => sum + p.precoVenda, 0) / produtos.length : 0,
    },
    {
      tipo: "Bebidas",
      quantidade: bebidas.length,
      valorMedio: bebidas.length > 0 ? bebidas.reduce((sum, b) => sum + b.precoVenda, 0) / bebidas.length : 0,
    },
    {
      tipo: "Combos",
      quantidade: combos.length,
      valorMedio: combos.length > 0 ? combos.reduce((sum, c) => sum + c.precoFinal, 0) / combos.length : 0,
    },
  ]

  // Simulação de faturamento
  const simulacaoFaturamento = [
    {
      mes: "Jan",
      faturamento: 15000,
      custoFixo: totalCustosFixos,
      custoVariavel: (15000 * totalCustosVariaveis) / 100,
    },
    {
      mes: "Fev",
      faturamento: 18000,
      custoFixo: totalCustosFixos,
      custoVariavel: (18000 * totalCustosVariaveis) / 100,
    },
    {
      mes: "Mar",
      faturamento: 22000,
      custoFixo: totalCustosFixos,
      custoVariavel: (22000 * totalCustosVariaveis) / 100,
    },
    {
      mes: "Abr",
      faturamento: 25000,
      custoFixo: totalCustosFixos,
      custoVariavel: (25000 * totalCustosVariaveis) / 100,
    },
    {
      mes: "Mai",
      faturamento: 28000,
      custoFixo: totalCustosFixos,
      custoVariavel: (28000 * totalCustosVariaveis) / 100,
    },
    {
      mes: "Jun",
      faturamento: 30000,
      custoFixo: totalCustosFixos,
      custoVariavel: (30000 * totalCustosVariaveis) / 100,
    },
  ].map((item) => ({
    ...item,
    lucro: item.faturamento - item.custoFixo - item.custoVariavel,
  }))

  // Métricas principais
  const ticketMedio =
    [...produtos, ...bebidas, ...combos].length > 0
      ? [
          ...produtos.map((p) => p.precoVenda),
          ...bebidas.map((b) => b.precoVenda),
          ...combos.map((c) => c.precoFinal),
        ].reduce((sum, valor) => sum + valor, 0) / [...produtos, ...bebidas, ...combos].length
      : 0

  const margemMediaProdutos =
    produtos.length > 0 ? produtos.reduce((sum, p) => sum + p.margemLucro, 0) / produtos.length : 0

  const pontoEquilibrio =
    totalCustosFixos > 0 && totalCustosVariaveis < 100 ? totalCustosFixos / (1 - totalCustosVariaveis / 100) : 0

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Valor médio por item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{margemMediaProdutos.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Dos produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ponto de Equilíbrio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pontoEquilibrio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Faturamento mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{produtos.length + bebidas.length + combos.length}</div>
            <p className="text-xs text-muted-foreground">No cardápio</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de produtos por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Produtos por Categoria
            </CardTitle>
            <CardDescription>Distribuição dos produtos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosProdutosPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosProdutosPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum produto cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de custos fixos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Custos Fixos por Categoria
            </CardTitle>
            <CardDescription>Distribuição dos custos mensais</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosCustosPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={dadosCustosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ categoria, valor }) =>
                      `${categoria}: ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {dadosCustosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      (value as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                      "Valor",
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum custo fixo cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise de margem de lucro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Margem de Lucro por Produto
          </CardTitle>
          <CardDescription>Top 10 produtos com suas respectivas margens</CardDescription>
        </CardHeader>
        <CardContent>
          {margemPorProduto.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={margemPorProduto} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={120} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "margem") return [`${value}%`, "Margem"]
                    if (name === "cmv")
                      return [(value as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "CMV"]
                    if (name === "precoVenda")
                      return [
                        (value as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                        "Preço",
                      ]
                    return [value, name]
                  }}
                />
                <Bar dataKey="margem" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <p>Nenhum produto cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparativo de itens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Comparativo: Produtos vs Bebidas vs Combos
          </CardTitle>
          <CardDescription>Análise comparativa dos diferentes tipos de itens</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativoItens}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "valorMedio")
                    return [
                      (value as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                      "Valor Médio",
                    ]
                  return [value, name]
                }}
              />
              <Bar dataKey="quantidade" fill="#FFBB28" name="Quantidade" />
              <Bar dataKey="valorMedio" fill="#FF8042" name="Valor Médio" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Simulação de faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Simulação de Faturamento e Lucro
          </CardTitle>
          <CardDescription>Projeção baseada nos custos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={simulacaoFaturamento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  (value as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                  "",
                ]}
              />
              <Line type="monotone" dataKey="faturamento" stroke="#0088FE" strokeWidth={2} name="Faturamento" />
              <Line type="monotone" dataKey="custoFixo" stroke="#FF8042" strokeWidth={2} name="Custo Fixo" />
              <Line type="monotone" dataKey="custoVariavel" stroke="#FFBB28" strokeWidth={2} name="Custo Variável" />
              <Line type="monotone" dataKey="lucro" stroke="#00C49F" strokeWidth={3} name="Lucro" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
            <CardDescription>Principais indicadores do negócio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total de Custos Fixos:</span>
              <Badge variant="outline">
                {totalCustosFixos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Total de Custos Variáveis:</span>
              <Badge variant="outline">{totalCustosVariaveis.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Produtos Cadastrados:</span>
              <Badge variant="outline">{produtos.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Bebidas Cadastradas:</span>
              <Badge variant="outline">{bebidas.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Combos Criados:</span>
              <Badge variant="outline">{combos.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Insumos Cadastrados:</span>
              <Badge variant="outline">{insumos.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
            <CardDescription>Sugestões para otimizar o negócio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {produtos.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">📝 Cadastre produtos para começar a análise de precificação</p>
              </div>
            )}
            {totalCustosFixos === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💰 Cadastre seus custos fixos para calcular o ponto de equilíbrio
                </p>
              </div>
            )}
            {margemMediaProdutos < 20 && produtos.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Margem média baixa ({margemMediaProdutos.toFixed(1)}%). Considere revisar preços
                </p>
              </div>
            )}
            {combos.length === 0 && produtos.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">🍽️ Crie combos para aumentar o ticket médio</p>
              </div>
            )}
            {bebidas.length === 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">🥤 Adicione bebidas ao cardápio para complementar as vendas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
