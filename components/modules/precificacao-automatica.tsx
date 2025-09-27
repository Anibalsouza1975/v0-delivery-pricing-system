"use client"

import { useState, useEffect, useMemo } from "react"
import { usePricing } from "@/components/pricing-context-supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, TrendingUp, Package, AlertTriangle, Target, Zap, BarChart3, Plus, Minus } from "lucide-react"

interface CustoCalculado {
  produtoId: string
  nome: string
  categoria: string
  custoReal: number
  precoSugerido: number
  margemAtual: number
  margemSugerida: number
  status: "lucro" | "prejuizo" | "equilibrio"
  ingredientes: {
    nome: string
    quantidade: number
    custoUnitario: number
    custoTotal: number
    estoqueDisponivel: number
  }[]
}

interface SimulacaoPreco {
  precoVenda: number
  custoTotal: number
  lucroUnitario: number
  margemPercentual: number
}

interface CalculadoraCusto {
  ingredientes: {
    id: string
    nome: string
    quantidade: number
    unidade: string
    precoUnitario: number
    custoTotal: number
  }[]
  custoIngredientes: number
  custoFixoRateado: number
  custoVariavelRateado: number
  custoTotal: number
  precoSugeridoMargem30: number
  precoSugeridoMargem40: number
  precoSugeridoMargem50: number
}

interface NovoIngrediente {
  nome: string
  quantidade: number
  unidade: string
  precoUnitario: number
  custoTotal: number
}

const fichasTecnicas = [
  // Exemplo de ficha técnica
  {
    produto: "Produto A",
    ingredientes: [
      { nome: "Ingrediente 1", quantidade: 100, unidade: "g" },
      { nome: "Ingrediente 2", quantidade: 50, unidade: "ml" },
    ],
  },
  // Outras fichas técnicas aqui
]

export default function PrecificacaoAutomaticaModule() {
  const { produtos, ingredientesBase, estoqueInsumos, insumos, getTotalCustosFixos, getEstoqueAtual, getValorEstoque } =
    usePricing()

  const [custosCalculados, setCustosCalculados] = useState<CustoCalculado[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("")
  const [simulacao, setSimulacao] = useState<SimulacaoPreco | null>(null)
  const [precoSimulacao, setPrecoSimulacao] = useState<string>("")
  const [margemDesejada, setMargemDesejada] = useState<string>("30")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date())
  const [alertasAtivos, setAlertasAtivos] = useState<string[]>([])

  const [calculadoraPersonalizada, setCalculadoraPersonalizada] = useState<CalculadoraCusto>({
    ingredientes: [],
    custoIngredientes: 0,
    custoFixoRateado: 0,
    custoVariavelRateado: 0,
    custoTotal: 0,
    precoSugeridoMargem30: 0,
    precoSugeridoMargem40: 0,
    precoSugeridoMargem50: 0,
  })

  const [novoIngrediente, setNovoIngrediente] = useState<NovoIngrediente>({
    nome: "",
    quantidade: 0,
    unidade: "g",
    precoUnitario: 0,
    custoTotal: 0,
  })

  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false)

  const calcularCustoReal = (produtoId: string): CustoCalculado | null => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return null

    let custoIngredientes = 0
    const ingredientesDetalhados: CustoCalculado["ingredientes"] = []

    // Calcular custo dos ingredientes baseado na ficha técnica e preços reais do estoque
    if (produto.insumos && produto.insumos.length > 0) {
      produto.insumos.forEach(({ insumoId, quantidade }) => {
        // Buscar ingrediente base
        const ingredienteBase = ingredientesBase.find((ib) => ib.id === insumoId)
        if (!ingredienteBase) return

        // Calcular preço unitário real baseado nas compras do estoque
        const estoquesIngrediente = estoqueInsumos.filter((e) => e.ingredienteBaseId === insumoId)
        let precoUnitarioReal = ingredienteBase.precoUnitario

        if (estoquesIngrediente.length > 0) {
          // Calcular preço médio ponderado das compras
          const totalQuantidade = estoquesIngrediente.reduce((sum, e) => sum + e.quantidadeComprada, 0)
          const totalValor = estoquesIngrediente.reduce((sum, e) => {
            const precoUnitario = e.precoCompra / e.quantidadeComprada
            return sum + e.quantidadeAtual * precoUnitario
          }, 0)
          precoUnitarioReal = totalQuantidade > 0 ? totalValor / totalQuantidade : ingredienteBase.precoUnitario
        }

        // Converter unidades se necessário (kg para g, L para ml)
        const quantidadeConvertida = quantidade
        let precoConvertido = precoUnitarioReal

        if (ingredienteBase.unidade === "kg" && quantidade < 10) {
          // Assumir que quantidade pequena está em gramas
          precoConvertido = precoUnitarioReal / 1000 // Converter de R$/kg para R$/g
        } else if (ingredienteBase.unidade === "L" && quantidade < 10) {
          // Assumir que quantidade pequena está em ml
          precoConvertido = precoUnitarioReal / 1000 // Converter de R$/L para R$/ml
        }

        const custoIngrediente = quantidadeConvertida * precoConvertido
        custoIngredientes += custoIngrediente

        ingredientesDetalhados.push({
          nome: ingredienteBase.nome,
          quantidade: quantidadeConvertida,
          custoUnitario: precoConvertido,
          custoTotal: custoIngrediente,
          estoqueDisponivel: getEstoqueAtual(insumoId),
        })
      })
    }

    // Calcular custos fixos rateados (por produto/dia)
    const custoFixoTotal = getTotalCustosFixos()
    const custoFixoRateado = produtos.length > 0 ? custoFixoTotal / produtos.length / 30 : 0 // Rateio mensal

    // Custos variáveis estimados (embalagem, energia, etc.)
    const custoVariavel = custoIngredientes * 0.15 // 15% dos ingredientes

    const custoTotal = custoIngredientes + custoFixoRateado + custoVariavel

    // Calcular margem atual se produto tem preço definido
    let margemAtual = 0
    let status: "lucro" | "prejuizo" | "equilibrio" = "equilibrio"

    if (produto.preco && produto.preco > 0) {
      margemAtual = ((produto.preco - custoTotal) / produto.preco) * 100
      if (margemAtual > 5) status = "lucro"
      else if (margemAtual < -5) status = "prejuizo"
    }

    return {
      produtoId: produto.id,
      nome: produto.nome,
      categoria: produto.categoria || "Sem categoria",
      custoReal: custoTotal,
      precoSugerido: custoTotal * 1.4, // 40% de margem
      margemAtual,
      margemSugerida: 40,
      status,
      ingredientes: ingredientesDetalhados,
    }
  }

  const verificarAlertasPrecos = (novosCustos: CustoCalculado[]) => {
    const novosAlertas: string[] = []

    novosCustos.forEach((custo) => {
      // Alerta para produtos em prejuízo
      if (custo.status === "prejuizo") {
        novosAlertas.push(`${custo.nome}: Produto em prejuízo (margem ${custo.margemAtual.toFixed(1)}%)`)
      }

      // Alerta para estoque baixo de ingredientes
      custo.ingredientes.forEach((ingrediente) => {
        if (ingrediente.estoqueDisponivel < 10) {
          novosAlertas.push(
            `${custo.nome}: Estoque baixo de ${ingrediente.nome} (${ingrediente.estoqueDisponivel} unidades)`,
          )
        }
      })
    })

    setAlertasAtivos(novosAlertas)
  }

  const simularPrecoOriginal = (produtoNome: string, precoVenda: number) => {
    const produto = produtos.find((p) => p.nome === produtoNome)
    if (!produto) return null

    // Buscar receita do produto na ficha técnica
    const receita = fichasTecnicas.find((f) => f.produto === produtoNome)
    let custoTotalIngredientes = 0

    if (receita && receita.ingredientes) {
      custoTotalIngredientes = receita.ingredientes.reduce((total, ingrediente) => {
        const insumo = insumos.find((i) => i.nome === ingrediente.nome)
        if (insumo) {
          // Converter unidades se necessário
          let precoConvertido = insumo.precoPorPorcao
          if (insumo.unidade === "kg" && ingrediente.unidade === "g") {
            precoConvertido = (insumo.precoPorPorcao / 1000) * ingrediente.quantidade
          } else if (insumo.unidade === "L" && ingrediente.unidade === "ml") {
            precoConvertido = (insumo.precoPorPorcao / 1000) * ingrediente.quantidade
          } else {
            precoConvertido = insumo.precoPorPorcao * ingrediente.quantidade
          }
          return total + precoConvertido
        }
        return total
      }, 0)
    } else {
      // Fallback para produtos sem receita cadastrada
      custoTotalIngredientes = produto.preco * 0.35 // Estima 35% do preço como custo de ingredientes
    }

    // Custos fixos e variáveis realistas
    const custoFixoRateado = 8.5
    const custoVariavelRateado = custoTotalIngredientes * 0.1

    const custoTotal = custoTotalIngredientes + custoFixoRateado + custoVariavelRateado
    const lucroUnitario = precoVenda - custoTotal
    const margemPercentual = custoTotal > 0 ? (lucroUnitario / precoVenda) * 100 : 0

    return {
      precoVenda,
      custoTotal,
      lucroUnitario,
      margemPercentual,
    }
  }

  // Calcular preço para margem desejada
  const calcularPrecoPorMargem = (produtoId: string, margemDesejada: number): number => {
    const custoCalculado = custosCalculados.find((c) => c.produtoId === produtoId)
    if (!custoCalculado) return 0

    return custoCalculado.custoReal / (1 - margemDesejada / 100)
  }

  const adicionarIngredienteCalculadora = () => {
    setCalculadoraPersonalizada((prev) => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        {
          id: Date.now().toString(),
          nome: "",
          quantidade: 0,
          unidade: "g",
          precoUnitario: 0,
          custoTotal: 0,
        },
      ],
    }))
  }

  const removerIngredienteCalculadora = (id: string) => {
    setCalculadoraPersonalizada((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((ing) => ing.id !== id),
    }))
  }

  const atualizarIngredienteCalculadora = (id: string, campo: string, valor: any) => {
    setCalculadoraPersonalizada((prev) => {
      const novosIngredientes = prev.ingredientes.map((ing) => {
        if (ing.id === id) {
          const ingredienteAtualizado = { ...ing, [campo]: valor }

          let custoCalculado = ingredienteAtualizado.quantidade * ingredienteAtualizado.precoUnitario

          // Se a unidade for kg e a quantidade estiver em gramas, converter
          if (ingredienteAtualizado.unidade === "kg" && ingredienteAtualizado.quantidade < 10) {
            // Assumir que quantidades pequenas são em gramas, converter para kg
            custoCalculado = (ingredienteAtualizado.quantidade / 1000) * ingredienteAtualizado.precoUnitario
          }
          // Se a unidade for litros e a quantidade estiver em ml, converter
          else if (ingredienteAtualizado.unidade === "l" && ingredienteAtualizado.quantidade < 10) {
            // Assumir que quantidades pequenas são em ml, converter para litros
            custoCalculado = (ingredienteAtualizado.quantidade / 1000) * ingredienteAtualizado.precoUnitario
          }

          ingredienteAtualizado.custoTotal = custoCalculado
          return ingredienteAtualizado
        }
        return ing
      })

      // Recalcular totais
      const custoIngredientes = novosIngredientes.reduce((sum, ing) => sum + ing.custoTotal, 0)
      const custosFixosDiarios = getTotalCustosFixos() / 30
      const custoFixoRateado = custosFixosDiarios / 100 // Estimativa conservadora
      const custoVariavelRateado = custoIngredientes * 0.15 // 15% dos ingredientes
      const custoTotal = custoIngredientes + custoFixoRateado + custoVariavelRateado

      return {
        ...prev,
        ingredientes: novosIngredientes,
        custoIngredientes,
        custoFixoRateado,
        custoVariavelRateado,
        custoTotal,
        precoSugeridoMargem30: custoTotal / 0.7,
        precoSugeridoMargem40: custoTotal / 0.6,
        precoSugeridoMargem50: custoTotal / 0.5,
      }
    })
  }

  const preencherComIngredienteBase = (ingredienteCalculadoraId: string, ingredienteBaseId: string) => {
    const ingredienteBase = ingredientesBase.find((ib) => ib.id === ingredienteBaseId)
    if (!ingredienteBase) return

    // Calcular preço unitário real baseado no estoque
    const estoquesIngrediente = estoqueInsumos
      .filter((e) => e.ingredienteBaseId === ingredienteBaseId && e.quantidadeAtual > 0)
      .sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime())

    let precoUnitarioReal = ingredienteBase.precoUnitario

    if (estoquesIngrediente.length > 0) {
      const totalQuantidade = estoquesIngrediente.reduce((sum, e) => sum + e.quantidadeAtual, 0)
      const valorTotal = estoquesIngrediente.reduce((sum, e) => sum + e.precoCompra, 0)
      precoUnitarioReal = totalQuantidade > 0 ? valorTotal / totalQuantidade : ingredienteBase.precoUnitario
    }

    let precoConvertido = precoUnitarioReal

    // Se o ingrediente base está em kg e queremos usar em gramas, converter
    if (ingredienteBase.unidade === "kg") {
      precoConvertido = precoUnitarioReal / 1000
    } else if (ingredienteBase.unidade === "L") {
      precoConvertido = precoUnitarioReal / 1000
    }

    atualizarIngredienteCalculadora(ingredienteCalculadoraId, "nome", ingredienteBase.nome)
    atualizarIngredienteCalculadora(
      ingredienteCalculadoraId,
      "unidade",
      ingredienteBase.unidade === "kg" ? "g" : ingredienteBase.unidade === "L" ? "ml" : ingredienteBase.unidade,
    )
    atualizarIngredienteCalculadora(ingredienteCalculadoraId, "precoUnitario", precoConvertido)
  }

  const calcularCustos = (ingredientes: any[]) => {
    const custoIngredientes = ingredientes.reduce((sum, ing) => sum + ing.custoTotal, 0)

    const custoFixoRateado = 2.5 // Custo fixo mais realista por produto (energia, aluguel rateado)

    const custoVariavelRateado = custoIngredientes * 0.05 // Embalagem, guardanapos, etc.

    const custoTotal = custoIngredientes + custoFixoRateado + custoVariavelRateado

    return {
      custoIngredientes,
      custoFixoRateado,
      custoVariavelRateado,
      custoTotal,
      precoSugeridoMargem30: custoTotal / 0.7,
      precoSugeridoMargem40: custoTotal / 0.6,
      precoSugeridoMargem50: custoTotal / 0.5,
    }
  }

  const adicionarIngrediente = () => {
    setShowAddIngredientModal(true)
  }

  const confirmarAdicionarIngrediente = () => {
    if (novoIngrediente.nome && novoIngrediente.quantidade > 0 && novoIngrediente.precoUnitario > 0) {
      const custoTotal = novoIngrediente.quantidade * novoIngrediente.precoUnitario
      const novoIng = {
        ...novoIngrediente,
        id: Date.now().toString(),
        custoTotal,
      }

      const novosIngredientes = [...calculadoraPersonalizada.ingredientes, novoIng]
      const custos = calcularCustos(novosIngredientes)

      setCalculadoraPersonalizada({
        ingredientes: novosIngredientes,
        ...custos,
      })

      setNovoIngrediente({
        nome: "",
        quantidade: 0,
        unidade: "g",
        precoUnitario: 0,
        custoTotal: 0,
      })

      setShowAddIngredientModal(false)
    }
  }

  useEffect(() => {
    const novosCalculos = produtos
      .map((produto) => calcularCustoReal(produto.id))
      .filter((calculo): calculo is CustoCalculado => calculo !== null)

    setCustosCalculados(novosCalculos)
    verificarAlertasPrecos(novosCalculos)
    setUltimaAtualizacao(new Date())
  }, [produtos, ingredientesBase, estoqueInsumos, insumos])

  const estatisticas = useMemo(() => {
    const totalProdutos = custosCalculados.length
    const produtosLucro = custosCalculados.filter((c) => c.status === "lucro").length
    const produtosPrejuizo = custosCalculados.filter((c) => c.status === "prejuizo").length
    const margemMedia =
      custosCalculados.length > 0
        ? custosCalculados.reduce((sum, c) => sum + c.margemAtual, 0) / custosCalculados.length
        : 0
    const custoMedio =
      custosCalculados.length > 0
        ? custosCalculados.reduce((sum, c) => sum + c.custoReal, 0) / custosCalculados.length
        : 0

    return {
      totalProdutos,
      produtosLucro,
      produtosPrejuizo,
      margemMedia,
      custoMedio,
    }
  }, [custosCalculados])

  useEffect(() => {
    if (produtoSelecionado && precoSimulacao) {
      const novaSimulacao = simularPrecoOriginal(produtoSelecionado, Number.parseFloat(precoSimulacao))
      setSimulacao(novaSimulacao)
    } else {
      setSimulacao(null)
    }
  }, [produtoSelecionado, precoSimulacao, custosCalculados])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lucro":
        return "bg-destructive text-destructive-foreground"
      case "prejuizo":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "lucro":
        return <TrendingUp className="h-4 w-4" />
      case "prejuizo":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {alertasAtivos.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Precificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertasAtivos.slice(0, 5).map((alerta, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span>{alerta}</span>
                </div>
              ))}
              {alertasAtivos.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">E mais {alertasAtivos.length - 5} alertas...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{estatisticas.totalProdutos}</div>
            <p className="text-xs text-muted-foreground">Produtos analisados</p>
            <p className="text-xs text-muted-foreground mt-1">Atualizado: {ultimaAtualizacao.toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{estatisticas.margemMedia.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Margem atual média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Lucrativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{estatisticas.produtosLucro}</div>
            <p className="text-xs text-muted-foreground">Com margem positiva</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Prejuízo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{estatisticas.produtosPrejuizo}</div>
            <p className="text-xs text-muted-foreground">Precisam de ajuste</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas principais */}
      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analise">Análise Completa</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora Personalizada</TabsTrigger>
          <TabsTrigger value="simulador">Simulador de Preços</TabsTrigger>
          <TabsTrigger value="otimizacao">Otimização</TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise Completa de Produtos
              </CardTitle>
              <CardDescription>Análise automática baseada na ficha técnica e preços reais do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {custosCalculados.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum produto encontrado na Ficha Técnica.
                    <br />
                    Cadastre produtos com ingredientes para ver a análise.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {custosCalculados.map((produto) => (
                    <Card key={produto.produtoId} className="border-l-4 border-l-destructive">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{produto.nome}</CardTitle>
                            <CardDescription>{produto.categoria}</CardDescription>
                          </div>
                          <Badge
                            variant={
                              produto.status === "lucro"
                                ? "default"
                                : produto.status === "prejuizo"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {produto.status === "lucro"
                              ? "Lucrativo"
                              : produto.status === "prejuizo"
                                ? "Prejuízo"
                                : "Equilibrio"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Custo Real</p>
                            <p className="text-lg font-semibold text-destructive">R$ {produto.custoReal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Preço Sugerido</p>
                            <p className="text-lg font-semibold text-destructive">
                              R$ {produto.precoSugerido.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Margem Atual</p>
                            <p className="text-lg font-semibold text-destructive">{produto.margemAtual.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Margem Sugerida</p>
                            <p className="text-lg font-semibold text-destructive">{produto.margemSugerida}%</p>
                          </div>
                        </div>

                        {/* Detalhamento dos ingredientes */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Composição de Custos:</h4>
                          {produto.ingredientes.map((ingrediente, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span>
                                {ingrediente.nome} ({ingrediente.quantidade}g)
                              </span>
                              <span className="text-destructive font-medium">
                                R$ {ingrediente.custoTotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Custos Personalizada
              </CardTitle>
              <CardDescription>
                Crie um produto do zero e calcule o custo baseado nos preços reais do seu estoque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium mb-4">Ingredientes</h3>
                  <Button onClick={adicionarIngrediente} className="bg-destructive hover:bg-destructive/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </div>

                {calculadoraPersonalizada.ingredientes.map((ingrediente, index) => (
                  <div key={ingrediente.id} className="grid grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Ingrediente</Label>
                      <Select
                        value={ingrediente.nome}
                        onValueChange={(value) => {
                          const ingredienteBase = ingredientesBase.find((ib) => ib.nome === value)
                          if (ingredienteBase) {
                            // Calcular preço real do estoque
                            const estoquesIngrediente = estoqueInsumos.filter(
                              (e) => e.ingredienteBaseId === ingredienteBase.id,
                            )
                            let precoReal = ingredienteBase.precoUnitario

                            if (estoquesIngrediente.length > 0) {
                              const totalQuantidade = estoquesIngrediente.reduce(
                                (sum, e) => sum + e.quantidadeComprada,
                                0,
                              )
                              const totalValor = estoquesIngrediente.reduce((sum, e) => sum + e.precoCompra, 0)
                              precoReal =
                                totalQuantidade > 0 ? totalValor / totalQuantidade : ingredienteBase.precoUnitario
                            }

                            // Converter para preço por grama se necessário
                            let precoConvertido = precoReal
                            let unidadeConvertida = ingredienteBase.unidade
                            if (ingredienteBase.unidade === "kg") {
                              precoConvertido = precoReal / 1000
                              unidadeConvertida = "g"
                            } else if (ingredienteBase.unidade === "L") {
                              precoConvertido = precoReal / 1000
                              unidadeConvertida = "ml"
                            }

                            const novosIngredientes = [...calculadoraPersonalizada.ingredientes]
                            novosIngredientes[index] = {
                              ...ingrediente,
                              nome: value,
                              unidade: unidadeConvertida,
                              precoUnitario: precoConvertido,
                              custoTotal: ingrediente.quantidade * precoConvertido,
                            }

                            const custos = calcularCustos(novosIngredientes)

                            setCalculadoraPersonalizada({
                              ingredientes: novosIngredientes,
                              ...custos,
                            })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientesBase.map((ingrediente) => (
                            <SelectItem key={ingrediente.id} value={ingrediente.nome}>
                              {ingrediente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={ingrediente.quantidade}
                        onChange={(e) => {
                          const quantidade = Number.parseFloat(e.target.value) || 0
                          const novosIngredientes = [...calculadoraPersonalizada.ingredientes]
                          novosIngredientes[index] = {
                            ...ingrediente,
                            quantidade,
                            custoTotal: quantidade * ingrediente.precoUnitario,
                          }

                          const custos = calcularCustos(novosIngredientes)

                          setCalculadoraPersonalizada({
                            ingredientes: novosIngredientes,
                            ...custos,
                          })
                        }}
                      />
                    </div>

                    <div>
                      <Label>Unidade</Label>
                      <Input value={ingrediente.unidade} disabled />
                    </div>

                    <div>
                      <Label>Preço/Unidade</Label>
                      <Input value={ingrediente.precoUnitario.toFixed(3)} disabled />
                    </div>

                    <div>
                      <Label>Custo</Label>
                      <Input
                        value={`R$ ${ingrediente.custoTotal.toFixed(2)}`}
                        disabled
                        className="text-destructive font-medium"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const novosIngredientes = calculadoraPersonalizada.ingredientes.filter((_, i) => i !== index)
                        const custos = calcularCustos(novosIngredientes)

                        setCalculadoraPersonalizada({
                          ingredientes: novosIngredientes,
                          ...custos,
                        })
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Resumo dos custos */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo dos Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingredientes</p>
                      <p className="text-lg font-semibold text-destructive">
                        R$ {calculadoraPersonalizada.custoIngredientes.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Fixo</p>
                      <p className="text-lg font-semibold text-destructive">
                        R$ {calculadoraPersonalizada.custoFixoRateado.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Variável</p>
                      <p className="text-lg font-semibold text-destructive">
                        R$ {calculadoraPersonalizada.custoVariavelRateado.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Total</p>
                      <p className="text-xl font-bold text-destructive">
                        R$ {calculadoraPersonalizada.custoTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Preços Sugeridos por Margem</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-destructive">Margem 30%</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-destructive">
                            R$ {calculadoraPersonalizada.precoSugeridoMargem30.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Lucro: R${" "}
                            {(
                              calculadoraPersonalizada.precoSugeridoMargem30 - calculadoraPersonalizada.custoTotal
                            ).toFixed(2)}{" "}
                            por unidade
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Recomendado para:</strong> Produtos de entrada ou promoções
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-destructive bg-destructive/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-destructive flex items-center gap-2">
                            Margem 40%{" "}
                            <Badge variant="destructive" className="text-xs">
                              RECOMENDADO
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-destructive">
                            R$ {calculadoraPersonalizada.precoSugeridoMargem40.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Lucro: R${" "}
                            {(
                              calculadoraPersonalizada.precoSugeridoMargem40 - calculadoraPersonalizada.custoTotal
                            ).toFixed(2)}{" "}
                            por unidade
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Ideal para:</strong> Operação sustentável com boa margem
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-destructive">Margem 50%</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-destructive">
                            R$ {calculadoraPersonalizada.precoSugeridoMargem50.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Lucro: R${" "}
                            {(
                              calculadoraPersonalizada.precoSugeridoMargem50 - calculadoraPersonalizada.custoTotal
                            ).toFixed(2)}{" "}
                            por unidade
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Recomendado para:</strong> Produtos premium ou especialidades
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulador" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Simulador de Preços
              </CardTitle>
              <CardDescription>Teste diferentes preços e veja o impacto na margem de lucro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Produto</Label>
                  <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preço de Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={precoSimulacao}
                    onChange={(e) => setPrecoSimulacao(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {simulacao && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Resultado da Simulação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Preço de Venda</p>
                        <p className="text-lg font-semibold text-destructive">R$ {simulacao.precoVenda.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Custo Total</p>
                        <p className="text-lg font-semibold text-destructive">R$ {simulacao.custoTotal.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lucro Unitário</p>
                        <p
                          className={`text-lg font-semibold ${simulacao.lucroUnitario >= 0 ? "text-destructive" : "text-destructive"}`}
                        >
                          R$ {simulacao.lucroUnitario.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Margem (%)</p>
                        <p
                          className={`text-lg font-semibold ${simulacao.margemPercentual >= 0 ? "text-destructive" : "text-destructive"}`}
                        >
                          {simulacao.margemPercentual.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Otimização */}
        <TabsContent value="otimizacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Otimização de Preços
              </CardTitle>
              <CardDescription>Sugestões automáticas para melhorar a rentabilidade dos seus produtos</CardDescription>
            </CardHeader>
            <CardContent>{/* Conteúdo da aba Otimização */}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar ingrediente */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Adicionar Ingrediente</h3>

            <div className="space-y-4">
              <div>
                <Label>Ingrediente</Label>
                <Select
                  value={novoIngrediente.nome}
                  onValueChange={(value) => {
                    const ingredienteBase = ingredientesBase.find((ib) => ib.nome === value)
                    if (ingredienteBase) {
                      // Calcular preço real do estoque
                      const estoquesIngrediente = estoqueInsumos.filter(
                        (e) => e.ingredienteBaseId === ingredienteBase.id,
                      )
                      let precoReal = ingredienteBase.precoUnitario

                      if (estoquesIngrediente.length > 0) {
                        const totalQuantidade = estoquesIngrediente.reduce((sum, e) => sum + e.quantidadeComprada, 0)
                        const totalValor = estoquesIngrediente.reduce((sum, e) => sum + e.precoCompra, 0)
                        precoReal = totalQuantidade > 0 ? totalValor / totalQuantidade : ingredienteBase.precoUnitario
                      }

                      // Converter para preço por grama se necessário
                      let precoConvertido = precoReal
                      let unidadeConvertida = ingredienteBase.unidade
                      if (ingredienteBase.unidade === "kg") {
                        precoConvertido = precoReal / 1000
                        unidadeConvertida = "g"
                      } else if (ingredienteBase.unidade === "L") {
                        precoConvertido = precoReal / 1000
                        unidadeConvertida = "ml"
                      }

                      setNovoIngrediente({
                        ...novoIngrediente,
                        nome: value,
                        unidade: unidadeConvertida,
                        precoUnitario: precoConvertido,
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientesBase.map((ingrediente) => (
                      <SelectItem key={ingrediente.id} value={ingrediente.nome}>
                        {ingrediente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={novoIngrediente.quantidade}
                  onChange={(e) => {
                    const quantidade = Number.parseFloat(e.target.value) || 0
                    setNovoIngrediente({
                      ...novoIngrediente,
                      quantidade,
                      custoTotal: quantidade * novoIngrediente.precoUnitario,
                    })
                  }}
                  placeholder="Ex: 100"
                />
              </div>

              <div>
                <Label>Unidade</Label>
                <Input value={novoIngrediente.unidade} disabled />
              </div>

              <div>
                <Label>Preço por Unidade</Label>
                <Input value={`R$ ${novoIngrediente.precoUnitario.toFixed(3)}`} disabled />
              </div>

              <div>
                <Label>Custo Total</Label>
                <Input
                  value={`R$ ${(novoIngrediente.quantidade * novoIngrediente.precoUnitario).toFixed(2)}`}
                  disabled
                  className="text-destructive font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddIngredientModal(false)
                  setNovoIngrediente({
                    nome: "",
                    quantidade: 0,
                    unidade: "g",
                    precoUnitario: 0,
                    custoTotal: 0,
                  })
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarAdicionarIngrediente}
                className="bg-destructive hover:bg-destructive/90 flex-1"
                disabled={!novoIngrediente.nome || novoIngrediente.quantidade <= 0}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
