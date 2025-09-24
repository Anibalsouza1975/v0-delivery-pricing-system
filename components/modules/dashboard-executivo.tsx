"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Target,
  Award,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Timer,
  Activity,
  Zap,
  Users,
  FileText,
  Store,
  BarChart3,
  Truck,
} from "lucide-react"
import { useDatabasePricing } from "@/components/database-pricing-context"
import { Switch } from "@/components/ui/switch"

interface VendaData {
  id: string
  data: string
  total: number
  produtos: { produtoId: string; quantidade: number; preco: number }[]
  formaPagamento: string
  cliente?: {
    nome: string
    telefone: string
    endereco: string
  }
}

interface MetricasVendas {
  vendaTotal: number
  lucroTotal: number
  custoTotal: number
  quantidadeVendida: number
  ticketMedio: number
  tempoMedioPedidos: number
  margemLucro: number
  roi: number
  crescimentoVendas: number
  metaMensal: number
  progressoMeta: number
}

interface ProdutoRanking {
  id: string
  nome: string
  quantidadeVendida: number
  receita: number
  lucro: number
  participacao: number
  margemUnitaria: number
}

interface MetricasComparativas {
  vendasHoje: number
  vendasOntem: number
  vendasSemanaAtual: number
  vendasSemanaPassada: number
  vendasMesAtual: number
  vendasMesPassado: number
  crescimentoDiario?: number
  crescimentoSemanal?: number
  crescimentoMensal?: number
}

interface MetricasTempo {
  tempoMedioPreparo: number
  tempoMedioEntrega: number
  eficienciaOperacional: number
  pedidosNoHorario: number
  pedidosAtrasados: number
  horariosPickVendas: { hora: string; vendas: number; eficiencia: number }[]
  tempoMedioPorProduto: { produto: string; tempo: number }[]
  capacidadeUtilizada: number
}

interface RelatorioDetalhado {
  periodo: string
  vendas: {
    total: number
    quantidade: number
    ticketMedio: number
    crescimento: number
  }
  lucros: {
    bruto: number
    liquido: number
    margem: number
    roi: number
  }
  produtos: {
    maisVendido: string
    maisLucrativo: string
    melhorMargem: string
    piorPerformance: string
  }
  operacional: {
    tempoMedio: number
    eficiencia: number
    capacidade: number
    satisfacao: number
  }
  tendencias: {
    vendas: "alta" | "baixa" | "estavel"
    lucros: "alta" | "baixa" | "estavel"
    eficiencia: "alta" | "baixa" | "estavel"
  }
}

interface HorarioFuncionamento {
  dia: string
  abertura: string
  fechamento: string
  ativo: boolean
}

export default function DashboardExecutivoModule() {
  const { produtos, insumos, getTotalCustosFixos, getTotalCustosVariaveis } = useDatabasePricing()
  const [vendas, setVendas] = useState<VendaData[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [produtosLista, setProdutos] = useState<any[]>([])
  const [bebidas, setBebidas] = useState<any[]>([])
  const [combos, setCombos] = useState<any[]>([])
  const [lojaAberta, setLojaAberta] = useState(() => {
    const saved = localStorage.getItem("lojaAberta")
    return saved ? JSON.parse(saved) : true
  })

  const [horarioAutomatico, setHorarioAutomatico] = useState(() => {
    const saved = localStorage.getItem("horarioAutomatico")
    return saved ? JSON.parse(saved) : false
  })

  const [horariosFuncionamento, setHorariosFuncionamento] = useState<HorarioFuncionamento[]>(() => {
    const saved = localStorage.getItem("horariosFuncionamento")
    return saved
      ? JSON.parse(saved)
      : [
          { dia: "Segunda-feira", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Terça-feira", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Quarta-feira", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Quinta-feira", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Sexta-feira", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Sábado", abertura: "08:00", fechamento: "22:00", ativo: true },
          { dia: "Domingo", abertura: "08:00", fechamento: "22:00", ativo: false },
        ]
  })

  const [metricas, setMetricas] = useState<MetricasVendas>({
    vendaTotal: 0,
    lucroTotal: 0,
    custoTotal: 0,
    quantidadeVendida: 0,
    ticketMedio: 0,
    tempoMedioPedidos: 0,
    margemLucro: 0,
    roi: 0,
    crescimentoVendas: 0,
    metaMensal: 50000,
    progressoMeta: 0,
  })
  const [metricasTempo, setMetricasTempo] = useState<MetricasTempo>({
    tempoMedioPreparo: 0,
    tempoMedioEntrega: 0,
    eficienciaOperacional: 0,
    pedidosNoHorario: 0,
    pedidosAtrasados: 0,
    horariosPickVendas: [],
    tempoMedioPorProduto: [],
    capacidadeUtilizada: 0,
  })
  const [rankingProdutos, setRankingProdutos] = useState<ProdutoRanking[]>([])
  const [metricasComparativas, setMetricasComparativas] = useState<MetricasComparativas>({
    vendasHoje: 0,
    vendasOntem: 0,
    vendasSemanaAtual: 0,
    vendasSemanaPassada: 0,
    vendasMesAtual: 0,
    vendasMesPassado: 0,
  })
  const [relatorioDetalhado, setRelatorioDetalhado] = useState<RelatorioDetalhado | null>(null)
  const [filtroData, setFiltroData] = useState("hoje")
  const [mostrarLucros, setMostrarLucros] = useState(false)
  const [criterioRanking, setCriterioRanking] = useState<"quantidade" | "receita" | "lucro" | "margem">("quantidade")
  const [visualizacaoRanking, setVisualizacaoRanking] = useState<"lista" | "grid" | "grafico">("lista")
  const [abaSelecionada, setAbaSelecionada] = useState("dashboard")

  const [configuracaoFrete, setConfiguracaoFrete] = useState({
    freteGratis: false,
    valorFrete: 5.0,
    valorMinimoFreteGratis: 30.0,
  })

  useEffect(() => {
    const vendasData = JSON.parse(localStorage.getItem("vendas") || "[]")
    const pedidosData = JSON.parse(localStorage.getItem("pedidos") || "[]")
    const produtosData = JSON.parse(localStorage.getItem("produtos") || "[]")
    const bebidasData = JSON.parse(localStorage.getItem("bebidas") || "[]")
    const combosData = JSON.parse(localStorage.getItem("combos") || "[]")

    // Garantir que todos os arrays existam
    setVendas(Array.isArray(vendasData) ? vendasData : [])
    setPedidos(Array.isArray(pedidosData) ? pedidosData : [])
    setProdutos(Array.isArray(produtosData) ? produtosData : [])
    setBebidas(Array.isArray(bebidasData) ? bebidasData : [])
    setCombos(Array.isArray(combosData) ? combosData : [])
  }, [])

  useEffect(() => {
    if (!Array.isArray(vendas) || !Array.isArray(pedidos)) return

    const agora = new Date()
    const vendasFiltradas = [...vendas]
    const pedidosFiltrados = [...pedidos]

    const vendasSalvas = localStorage.getItem("vendas")
    const pedidosSalvos = localStorage.getItem("pedidos")

    let todasVendas: VendaData[] = []

    if (vendasSalvas) {
      todasVendas = [...todasVendas, ...JSON.parse(vendasSalvas)]
    }

    if (pedidosSalvos) {
      const pedidos = JSON.parse(pedidosSalvos)
      const vendasDePedidos = pedidos.map((pedido: any) => ({
        id: pedido.id,
        data: pedido.data || pedido.dataHora,
        total: pedido.total,
        produtos:
          pedido.itens?.map((item: any) => ({
            produtoId: item.produtoId || item.id,
            quantidade: item.quantidade,
            preco: item.preco || item.precoUnitario || 0,
          })) || [],
        formaPagamento: pedido.formaPagamento || "não informado",
        cliente: pedido.cliente,
      }))
      todasVendas = [...todasVendas, ...vendasDePedidos]
    }

    setVendas(todasVendas)
  }, [])

  useEffect(() => {
    if (vendas.length === 0) return

    const agora = new Date()
    const vendasFiltradas = vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      switch (filtroData) {
        case "hoje":
          return dataVenda.toDateString() === agora.toDateString()
        case "semana":
          const inicioSemana = new Date(agora)
          inicioSemana.setDate(agora.getDate() - 7)
          return dataVenda >= inicioSemana
        case "mes":
          return dataVenda.getMonth() === agora.getMonth() && dataVenda.getFullYear() === agora.getFullYear()
        default:
          return true
      }
    })

    const tempoMedioPreparo =
      vendasFiltradas.length > 0
        ? vendasFiltradas.reduce((acc, venda) => {
            if (!Array.isArray(venda.produtos)) return acc

            const tempoVenda = venda.produtos.reduce((tempoTotal, produto) => {
              const produtoInfo = Array.isArray(produtos) ? produtos.find((p) => p.id === produto.produtoId) : null
              const complexidade = produtoInfo?.insumos?.length || 1
              return tempoTotal + (complexidade * 2 + 8) * (produto.quantidade || 0)
            }, 0)
            return acc + tempoVenda
          }, 0) / vendasFiltradas.length
        : 0

    const tempoMedioEntrega = 25 + Math.random() * 15

    const tempoIdealPreparo = 15
    const eficienciaOperacional =
      tempoMedioPreparo > 0 ? Math.max(0, Math.min(100, (tempoIdealPreparo / tempoMedioPreparo) * 100)) : 0

    const totalPedidos = vendasFiltradas.length
    const pedidosNoHorario = Math.floor(totalPedidos * (0.7 + Math.random() * 0.25))
    const pedidosAtrasados = totalPedidos - pedidosNoHorario

    const horariosPickVendas = Array.from({ length: 24 }, (_, hora) => {
      const vendasDaHora = vendasFiltradas.filter((venda) => {
        const horaVenda = new Date(venda.data).getHours()
        return horaVenda === hora
      })
      const vendas = vendasDaHora.length > 0 ? vendasDaHora.reduce((acc, v) => acc + (v.total || 0), 0) : 0
      const eficiencia = vendas > 0 ? Math.max(60, Math.min(100, 85 + Math.random() * 15)) : 0

      return {
        hora: `${hora}:00`,
        vendas,
        eficiencia,
      }
    }).filter((item) => item.vendas > 0)

    const produtoTempoMap = new Map()
    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produto) => {
            const produtoInfo = produtos?.find((p) => p.id === produto.produtoId)
            if (produtoInfo) {
              const complexidade = produtoInfo.insumos?.length || 1
              const tempoProduto = (complexidade * 2 + 8) * produto.quantidade

              const existing = produtoTempoMap.get(produtoInfo.nome) || { total: 0, count: 0 }
              existing.total += tempoProduto
              existing.count += produto.quantidade
              produtoTempoMap.set(produtoInfo.nome, existing)
            }
          })
        }
      })
    }

    const tempoMedioPorProduto = Array.from(produtoTempoMap.entries())
      .map(([produto, data]) => ({
        produto,
        tempo: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 8)

    const capacidadeMaxima = 100
    const capacidadeUtilizada = Math.min(100, (totalPedidos / capacidadeMaxima) * 100)

    setMetricasTempo({
      tempoMedioPreparo,
      tempoMedioEntrega,
      eficienciaOperacional,
      pedidosNoHorario,
      pedidosAtrasados,
      horariosPickVendas,
      tempoMedioPorProduto,
      capacidadeUtilizada,
    })
  }, [vendas, produtos, filtroData, produtosLista])

  useEffect(() => {
    if (vendas.length === 0) return

    const agora = new Date()
    const ontem = new Date(agora)
    ontem.setDate(agora.getDate() - 1)

    const inicioSemanaAtual = new Date(agora)
    inicioSemanaAtual.setDate(agora.getDate() - agora.getDay())

    const inicioSemanaPassada = new Date(inicioSemanaAtual)
    inicioSemanaPassada.setDate(inicioSemanaAtual.getDate() - 7)

    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0)

    if (Array.isArray(vendas)) {
      const vendasHoje = vendas
        .filter((v) => new Date(v.data).toDateString() === agora.toDateString())
        .reduce((acc, v) => acc + (v.total || 0), 0)

      const vendasOntem = vendas
        .filter((v) => new Date(v.data).toDateString() === ontem.toDateString())
        .reduce((acc, v) => acc + (v.total || 0), 0)

      const vendasSemanaAtual = vendas
        .filter((v) => new Date(v.data) >= inicioSemanaAtual)
        .reduce((acc, v) => acc + (v.total || 0), 0)

      const vendasSemanaPassada = vendas
        .filter((v) => {
          const dataVenda = new Date(v.data)
          return dataVenda >= inicioSemanaPassada && dataVenda < inicioSemanaAtual
        })
        .reduce((acc, v) => acc + (v.total || 0), 0)

      const vendasMesAtual = vendas
        .filter((v) => new Date(v.data) >= inicioMesAtual)
        .reduce((acc, v) => acc + (v.total || 0), 0)

      const vendasMesPassado = vendas
        .filter((v) => {
          const dataVenda = new Date(v.data)
          return dataVenda >= inicioMesPassado && dataVenda <= fimMesPassado
        })
        .reduce((acc, v) => acc + (v.total || 0), 0)

      setMetricasComparativas({
        vendasHoje,
        vendasOntem,
        vendasSemanaAtual,
        vendasSemanaPassada,
        vendasMesAtual,
        vendasMesPassado,
        crescimentoDiario: vendasOntem > 0 ? ((vendasHoje - vendasOntem) / vendasOntem) * 100 : 0,
        crescimentoSemanal:
          vendasSemanaPassada > 0 ? ((vendasSemanaAtual - vendasSemanaPassada) / vendasSemanaPassada) * 100 : 0,
        crescimentoMensal: vendasMesPassado > 0 ? ((vendasMesAtual - vendasMesPassado) / vendasMesPassado) * 100 : 0,
      })
    }
  }, [vendas])

  useEffect(() => {
    if (vendas.length === 0) return

    const agora = new Date()
    const vendasFiltradas = vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      switch (filtroData) {
        case "hoje":
          return dataVenda.toDateString() === agora.toDateString()
        case "semana":
          const inicioSemana = new Date(agora)
          inicioSemana.setDate(agora.getDate() - 7)
          return dataVenda >= inicioSemana
        case "mes":
          return dataVenda.getMonth() === agora.getMonth() && dataVenda.getFullYear() === agora.getFullYear()
        default:
          return true
      }
    })

    const vendaTotal = Array.isArray(vendasFiltradas)
      ? vendasFiltradas.reduce((acc, venda) => acc + (venda.total || 0), 0)
      : 0

    const quantidadeVendida = Array.isArray(vendasFiltradas)
      ? vendasFiltradas.reduce(
          (acc, venda) =>
            acc + (Array.isArray(venda.produtos) ? venda.produtos.reduce((sum, p) => sum + (p.quantidade || 0), 0) : 0),
          0,
        )
      : 0

    let custoTotal = 0
    let lucroTotal = 0
    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoVenda) => {
            const produto = produtos?.find((p) => p.id === produtoVenda.produtoId)
            if (produto) {
              const custoProduto = produto.cmv * produtoVenda.quantidade
              custoTotal += custoProduto
              lucroTotal += (produtoVenda.preco - produto.cmv) * produtoVenda.quantidade
            }
          })
        }
      })
    }

    const custosFixosDiarios = getTotalCustosFixos() / 30
    const custosVariaveisPercentual = getTotalCustosVariaveis() / 100
    const custosVariaveisTotais = vendaTotal * custosVariaveisPercentual

    const custosOperacionais =
      filtroData === "hoje"
        ? custosFixosDiarios
        : filtroData === "semana"
          ? custosFixosDiarios * 7
          : filtroData === "mes"
            ? getTotalCustosFixos()
            : getTotalCustosFixos()

    custoTotal += custosOperacionais + custosVariaveisTotais
    lucroTotal -= custosOperacionais + custosVariaveisTotais

    const ticketMedio = vendasFiltradas.length > 0 ? vendaTotal / vendasFiltradas.length : 0
    const margemLucro = vendaTotal > 0 ? (lucroTotal / vendaTotal) * 100 : 0
    const roi = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0

    let crescimentoVendas = 0
    if (filtroData === "hoje" && metricasComparativas.vendasOntem > 0) {
      crescimentoVendas =
        ((metricasComparativas.vendasHoje - metricasComparativas.vendasOntem) / metricasComparativas.vendasOntem) * 100
    } else if (filtroData === "semana" && metricasComparativas.vendasSemanaPassada > 0) {
      crescimentoVendas =
        ((metricasComparativas.vendasSemanaAtual - metricasComparativas.vendasSemanaPassada) /
          metricasComparativas.vendasSemanaPassada) *
        100
    } else if (filtroData === "mes" && metricasComparativas.vendasMesPassado > 0) {
      crescimentoVendas =
        ((metricasComparativas.vendasMesAtual - metricasComparativas.vendasMesPassado) /
          metricasComparativas.vendasMesPassado) *
        100
    }

    const metaMensal = 50000
    const progressoMeta = filtroData === "mes" ? (vendaTotal / metaMensal) * 100 : 0

    const tempoMedioPedidos = metricasTempo.tempoMedioPreparo

    setMetricas({
      vendaTotal,
      lucroTotal,
      custoTotal,
      quantidadeVendida,
      ticketMedio,
      tempoMedioPedidos,
      margemLucro,
      roi,
      crescimentoVendas,
      metaMensal,
      progressoMeta,
    })

    const produtosMap = new Map()
    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoVenda) => {
            const produto = produtos?.find((p) => p.id === produtoVenda.produtoId)
            if (produto) {
              const key = produto.id
              const existing = produtosMap.get(key) || {
                id: produto.id,
                nome: produto.nome,
                quantidadeVendida: 0,
                receita: 0,
                lucro: 0,
                participacao: 0,
                margemUnitaria: 0,
              }

              existing.quantidadeVendida += produtoVenda.quantidade
              existing.receita += produtoVenda.preco * produtoVenda.quantidade
              existing.lucro += (produtoVenda.preco - produto.cmv) * produtoVenda.quantidade
              existing.margemUnitaria =
                produtoVenda.preco > 0 ? ((produtoVenda.preco - produto.cmv) / produtoVenda.preco) * 100 : 0

              produtosMap.set(key, existing)
            }
          })
        }
      })
    }

    const ranking = Array.from(produtosMap.values())
      .sort((a, b) => {
        switch (criterioRanking) {
          case "receita":
            return b.receita - a.receita
          case "lucro":
            return b.lucro - a.lucro
          case "margem":
            return b.margemUnitaria - a.margemUnitaria
          default:
            return b.quantidadeVendida - a.quantidadeVendida
        }
      })
      .map((item) => ({
        ...item,
        participacao: vendaTotal > 0 ? (item.receita / vendaTotal) * 100 : 0,
      }))

    setRankingProdutos(ranking.slice(0, 15))

    const maisVendido =
      ranking.length > 0 ? ranking.sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)[0]?.nome || "N/A" : "N/A"
    const maisLucrativo = ranking.length > 0 ? ranking.sort((a, b) => b.lucro - a.lucro)[0]?.nome || "N/A" : "N/A"
    const melhorMargem =
      ranking.length > 0 ? ranking.sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]?.nome || "N/A" : "N/A"
    const piorPerformance = ranking.length > 0 ? ranking.sort((a, b) => a.lucro - b.lucro)[0]?.nome || "N/A" : "N/A"

    const satisfacao = Math.max(70, Math.min(100, 85 + Math.random() * 15)) // Simulado

    setRelatorioDetalhado({
      periodo:
        filtroData === "hoje"
          ? "Hoje"
          : filtroData === "semana"
            ? "Última Semana"
            : filtroData === "mes"
              ? "Este Mês"
              : "Todos os Dados",
      vendas: {
        total: vendaTotal,
        quantidade: quantidadeVendida,
        ticketMedio,
        crescimento: crescimentoVendas,
      },
      lucros: {
        bruto: lucroTotal + custosOperacionais + custosVariaveisTotais,
        liquido: lucroTotal,
        margem: margemLucro,
        roi,
      },
      produtos: {
        maisVendido,
        maisLucrativo,
        melhorMargem,
        piorPerformance,
      },
      operacional: {
        tempoMedio: metricasTempo.tempoMedioPreparo,
        eficiencia: metricasTempo.eficienciaOperacional,
        capacidade: metricasTempo.capacidadeUtilizada,
        satisfacao,
      },
      tendencias: {
        vendas: crescimentoVendas > 5 ? "alta" : crescimentoVendas < -5 ? "baixa" : "estavel",
        lucros: margemLucro > 20 ? "alta" : margemLucro < 10 ? "baixa" : "estavel",
        eficiencia:
          metricasTempo.eficienciaOperacional > 80
            ? "alta"
            : metricasTempo.eficienciaOperacional < 60
              ? "baixa"
              : "estavel",
      },
    })
  }, [
    vendas,
    produtos,
    filtroData,
    getTotalCustosFixos,
    getTotalCustosVariaveis,
    metricasComparativas,
    criterioRanking,
    metricasTempo,
  ])

  const exportarRelatorio = () => {
    if (!relatorioDetalhado) return

    const dadosExportacao = {
      relatorio: "Dashboard Executivo",
      periodo: relatorioDetalhado.periodo,
      dataGeracao: new Date().toLocaleString("pt-BR"),
      resumoExecutivo: {
        vendas: relatorioDetalhado.vendas,
        lucros: mostrarLucros ? relatorioDetalhado.lucros : { observacao: "Dados de lucro ocultos" },
        produtos: relatorioDetalhado.produtos,
        operacional: relatorioDetalhado.operacional,
        tendencias: relatorioDetalhado.tendencias,
      },
      rankingProdutos: rankingProdutos.slice(0, 10),
      metricas: {
        vendaTotal: metricas.vendaTotal,
        ticketMedio: metricas.ticketMedio,
        quantidadeVendida: metricas.quantidadeVendida,
        tempoMedioPedidos: metricas.tempoMedioPedidos,
        eficienciaOperacional: metricasTempo.eficienciaOperacional,
        capacidadeUtilizada: metricasTempo.capacidadeUtilizada,
      },
    }

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-executivo-${filtroData}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const dadosVendasDiarias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    data.setDate(data.getDate() - (6 - i))
    const vendasDoDia = Array.isArray(vendas)
      ? vendas.filter((venda) => new Date(venda.data).toDateString() === data.toDateString())
      : []
    const totalDia = vendasDoDia.length > 0 ? vendasDoDia.reduce((acc, venda) => acc + (venda.total || 0), 0) : 0

    return {
      dia: data.toLocaleDateString("pt-BR", { weekday: "short" }),
      vendas: totalDia,
      pedidos: vendasDoDia.length,
    }
  })

  const dadosFormaPagamento = [
    { nome: "Cartão Débito", valor: vendas.filter((v) => v.formaPagamento === "cartao-debito").length, cor: "#dc2626" },
    {
      nome: "Cartão Crédito",
      valor: vendas.filter((v) => v.formaPagamento === "cartao-credito").length,
      cor: "#f59e0b",
    },
    { nome: "PIX", valor: vendas.filter((v) => v.formaPagamento === "pix").length, cor: "#4b5563" },
    { nome: "Dinheiro", valor: vendas.filter((v) => v.formaPagamento === "dinheiro").length, cor: "#a16207" },
  ]

  const dadosGraficoRanking = rankingProdutos.slice(0, 8).map((produto) => ({
    nome: produto.nome.length > 15 ? produto.nome.substring(0, 15) + "..." : produto.nome,
    valor:
      criterioRanking === "quantidade"
        ? produto.quantidadeVendida
        : criterioRanking === "receita"
          ? produto.receita
          : criterioRanking === "lucro"
            ? produto.lucro
            : produto.margemUnitaria,
  }))

  const renderRanking = () => {
    if (visualizacaoRanking === "grafico") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dadosGraficoRanking} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="nome" type="category" width={120} />
            <Tooltip
              formatter={(value: any) => [
                criterioRanking === "quantidade"
                  ? `${value} unidades`
                  : criterioRanking === "receita" || criterioRanking === "lucro"
                    ? `R$ ${value.toLocaleString("pt-BR")}`
                    : `${value.toFixed(1)}%`,
                criterioRanking === "quantidade"
                  ? "Quantidade"
                  : criterioRanking === "receita"
                    ? "Receita"
                    : criterioRanking === "lucro"
                      ? "Lucro"
                      : "Margem",
              ]}
            />
            <Bar dataKey="valor" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (visualizacaoRanking === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankingProdutos.map((produto, index) => (
            <Card key={produto.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={index < 3 ? "default" : "secondary"}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                >
                  {index + 1}
                </Badge>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    produto.margemUnitaria >= 30
                      ? "bg-green-100 text-green-800"
                      : produto.margemUnitaria >= 20
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {produto.margemUnitaria.toFixed(1)}%
                </div>
              </div>
              <h4 className="font-medium text-sm mb-2">{produto.nome}</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Vendidos:</span>
                  <span className="font-medium">{produto.quantidadeVendida}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receita:</span>
                  <span className="font-medium">
                    {produto.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                {mostrarLucros && (
                  <div className="flex justify-between">
                    <span>Lucro:</span>
                    <span className={`font-medium ${produto.lucro >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {produto.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Participação:</span>
                  <span className="font-medium">{produto.participacao.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {rankingProdutos.map((produto, index) => (
          <div
            key={produto.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Badge
                variant={index < 3 ? "default" : "secondary"}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {index + 1}
              </Badge>
              <div>
                <h4 className="font-medium">{produto.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  {produto.quantidadeVendida} unidades • {produto.participacao.toFixed(1)}% das vendas
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Margem: {produto.margemUnitaria.toFixed(1)}%
                  </Badge>
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      produto.margemUnitaria >= 30
                        ? "bg-green-100 text-green-800"
                        : produto.margemUnitaria >= 20
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {produto.margemUnitaria >= 30 ? "Excelente" : produto.margemUnitaria >= 20 ? "Boa" : "Baixa"}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {criterioRanking === "quantidade"
                  ? `${produto.quantidadeVendida} unidades`
                  : criterioRanking === "receita"
                    ? produto.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : criterioRanking === "lucro"
                      ? produto.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : `${produto.margemUnitaria.toFixed(1)}%`}
              </div>
              {mostrarLucros && criterioRanking !== "lucro" && (
                <div className={`text-sm ${produto.lucro >= 0 ? "text-green-600" : "text-red-600"}`}>
                  Lucro: {produto.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {produto.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} receita
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const verificarHorarioAutomatico = () => {
    console.log("[v0] Verificando horário automático:", { horarioAutomatico, lojaAberta })

    if (!horarioAutomatico) return

    const agora = new Date()
    const diaAtual = agora.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ]
    const nomeHoje = diasSemana[diaAtual]

    console.log("[v0] Dia atual:", nomeHoje)

    const horarioHoje = horariosFuncionamento.find((h) => h.dia === nomeHoje)

    console.log("[v0] Horário configurado para hoje:", horarioHoje)

    if (!horarioHoje || !horarioHoje.ativo) {
      // Loja fechada hoje
      console.log("[v0] Loja deve estar fechada hoje")
      if (lojaAberta) {
        console.log("[v0] Fechando loja automaticamente")
        setLojaAberta(false)
      }
      return
    }

    const horaAtual =
      agora.getHours().toString().padStart(2, "0") + ":" + agora.getMinutes().toString().padStart(2, "0")

    const deveEstarAberta = horaAtual >= horarioHoje.abertura && horaAtual < horarioHoje.fechamento

    console.log("[v0] Verificação de horário:", {
      horaAtual,
      abertura: horarioHoje.abertura,
      fechamento: horarioHoje.fechamento,
      deveEstarAberta,
      lojaAberta,
    })

    if (deveEstarAberta !== lojaAberta) {
      console.log("[v0] Alterando status da loja:", deveEstarAberta ? "ABRIR" : "FECHAR")
      setLojaAberta(deveEstarAberta)
    }
  }

  useEffect(() => {
    localStorage.setItem("lojaAberta", JSON.stringify(lojaAberta))
  }, [lojaAberta])

  useEffect(() => {
    localStorage.setItem("horarioAutomatico", JSON.stringify(horarioAutomatico))
  }, [horarioAutomatico])

  useEffect(() => {
    localStorage.setItem("horariosFuncionamento", JSON.stringify(horariosFuncionamento))
  }, [horariosFuncionamento])

  useEffect(() => {
    verificarHorarioAutomatico()
    const interval = setInterval(verificarHorarioAutomatico, 60000) // Verifica a cada minuto
    return () => clearInterval(interval)
  }, [horarioAutomatico, horariosFuncionamento, lojaAberta])

  const [toggleLojaStatus, setToggleLojaStatus] = useState<(prevState: boolean) => boolean>(
    () => (prevState: boolean) => !prevState,
  )

  useEffect(() => {
    const freteConfig = localStorage.getItem("delivery-pricing-frete-config")
    if (freteConfig) {
      setConfiguracaoFrete(JSON.parse(freteConfig))
    }
  }, [])

  const salvarConfiguracaoFrete = (novaConfig: typeof configuracaoFrete) => {
    setConfiguracaoFrete(novaConfig)
    localStorage.setItem("delivery-pricing-frete-config", JSON.stringify(novaConfig))
    // Disparar evento para atualizar outros componentes
    window.dispatchEvent(new CustomEvent("freteConfiguracaoAtualizada", { detail: novaConfig }))
  }

  const renderConfiguracaoLoja = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Store className="w-5 h-5" />
          Status da Loja
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${lojaAberta ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm font-medium">Loja {lojaAberta ? "Aberta" : "Fechada"}</span>
          </div>
          <Button
            variant={lojaAberta ? "destructive" : "default"}
            size="sm"
            onClick={() => setLojaAberta(!lojaAberta)}
            disabled={horarioAutomatico}
          >
            {lojaAberta ? "Fechar Loja" : "Abrir Loja"}
          </Button>
        </div>

        {horarioAutomatico && (
          <p className="text-sm text-gray-600 mt-2">* Controle manual desabilitado - usando horários automáticos</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários Automáticos
          </h3>
          <div className="flex items-center gap-2">
            <Switch checked={horarioAutomatico} onCheckedChange={setHorarioAutomatico} />
            <span className="text-sm">Ativar</span>
          </div>
        </div>

        {horarioAutomatico && (
          <div className="space-y-4">
            {horariosFuncionamento.map((horario, index) => (
              <div key={horario.dia} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-24">
                  <Switch
                    checked={horario.ativo}
                    onCheckedChange={(checked) => {
                      const novosHorarios = [...horariosFuncionamento]
                      novosHorarios[index].ativo = checked
                      setHorariosFuncionamento(novosHorarios)
                    }}
                  />
                </div>
                <div className="w-32 font-medium">{horario.dia}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={horario.abertura}
                    onChange={(e) => {
                      const novosHorarios = [...horariosFuncionamento]
                      novosHorarios[index].abertura = e.target.value
                      setHorariosFuncionamento(novosHorarios)
                    }}
                    disabled={!horario.ativo}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <span>às</span>
                  <input
                    type="time"
                    value={horario.fechamento}
                    onChange={(e) => {
                      const novosHorarios = [...horariosFuncionamento]
                      novosHorarios[index].fechamento = e.target.value
                      setHorariosFuncionamento(novosHorarios)
                    }}
                    disabled={!horario.ativo}
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Configuração de Frete
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Frete Grátis para Todos os Pedidos</span>
            </div>
            <Switch
              checked={configuracaoFrete.freteGratis}
              onCheckedChange={(checked) =>
                salvarConfiguracaoFrete({
                  ...configuracaoFrete,
                  freteGratis: checked,
                })
              }
            />
          </div>

          {!configuracaoFrete.freteGratis && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valor do Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={configuracaoFrete.valorFrete}
                    onChange={(e) =>
                      salvarConfiguracaoFrete({
                        ...configuracaoFrete,
                        valorFrete: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valor Mínimo para Frete Grátis (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={configuracaoFrete.valorMinimoFreteGratis}
                    onChange={(e) =>
                      salvarConfiguracaoFrete({
                        ...configuracaoFrete,
                        valorMinimoFreteGratis: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="30.00"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Configuração atual:</strong>
                {configuracaoFrete.valorMinimoFreteGratis > 0
                  ? ` Frete de R$ ${configuracaoFrete.valorFrete.toFixed(2)} • Grátis acima de R$ ${configuracaoFrete.valorMinimoFreteGratis.toFixed(2)}`
                  : ` Frete fixo de R$ ${configuracaoFrete.valorFrete.toFixed(2)} para todos os pedidos`}
              </div>
            </>
          )}

          {configuracaoFrete.freteGratis && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <strong>Configuração atual:</strong> Frete grátis para todos os pedidos
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const abas = [
    { id: "dashboard", nome: "Dashboard", icone: TrendingUp },
    { id: "relatorios", nome: "Relatórios", icone: BarChart3 },
    { id: "analises", nome: "Análises", icone: Package },
    { id: "configuracao-loja", nome: "Configuração da Loja", icone: Store },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground">Visão completa do seu negócio em tempo real</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-lg">
            <div className={`w-3 h-3 rounded-full ${lojaAberta ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm font-medium">Loja {lojaAberta ? "Aberta" : "Fechada"}</span>
            <Button
              variant={lojaAberta ? "destructive" : "default"}
              size="sm"
              onClick={() => setLojaAberta(!lojaAberta)}
              className="ml-2"
              disabled={horarioAutomatico}
            >
              {lojaAberta ? "Fechar Loja" : "Abrir Loja"}
            </Button>
          </div>

          <select
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Este Mês</option>
            <option value="todos">Todos os Dados</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarLucros(!mostrarLucros)}
            className="flex items-center gap-2"
          >
            {mostrarLucros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {mostrarLucros ? "Ocultar Lucros" : "Mostrar Lucros"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportarRelatorio}
            className="flex items-center gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {abas.map((aba) => (
            <TabsTrigger key={aba.id} value={aba.id}>
              {aba.nome}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              className={`border-l-4 ${metricasTempo.eficienciaOperacional >= 80 ? "border-l-green-500" : metricasTempo.eficienciaOperacional >= 60 ? "border-l-yellow-500" : "border-l-red-500"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Eficiência Operacional</p>
                    <p className="text-2xl font-bold">{metricasTempo.eficienciaOperacional.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {metricasTempo.eficienciaOperacional >= 80
                        ? "Excelente"
                        : metricasTempo.eficienciaOperacional >= 60
                          ? "Boa"
                          : "Precisa melhorar"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Tempo Médio Preparo</p>
                    <p className="text-2xl font-bold">{metricasTempo.tempoMedioPreparo.toFixed(0)}min</p>
                    <p className="text-xs text-muted-foreground">Meta: 15min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Capacidade Utilizada</p>
                    <p className="text-2xl font-bold">{metricasTempo.capacidadeUtilizada.toFixed(0)}%</p>
                    <Progress value={metricasTempo.capacidadeUtilizada} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${metricasTempo.pedidosAtrasados === 0 ? "border-l-green-500" : metricasTempo.pedidosAtrasados < 5 ? "border-l-yellow-500" : "border-l-red-500"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Pedidos no Prazo</p>
                    <p className="text-2xl font-bold">{metricasTempo.pedidosNoHorario}</p>
                    <p className="text-xs text-muted-foreground">{metricasTempo.pedidosAtrasados} atrasados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold kpi-highlight">
                  {metricas.vendaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {metricas.crescimentoVendas >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <p className={`text-xs ${metricas.crescimentoVendas >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metricas.crescimentoVendas >= 0 ? "+" : ""}
                    {metricas.crescimentoVendas.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {mostrarLucros && (
              <Card className="metric-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metricas.lucroTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metricas.lucroTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Margem: {metricas.margemLucro.toFixed(1)}% • ROI: {metricas.roi.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <p className="text-xs text-muted-foreground">Por pedido</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.tempoMedioPedidos.toFixed(0)}min</div>
                <p className="text-xs text-muted-foreground">Preparo dos pedidos</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.quantidadeVendida}</div>
                <p className="text-xs text-muted-foreground">Unidades</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Eficiência por Horário</CardTitle>
                <CardDescription>Performance operacional ao longo do dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricasTempo.horariosPickVendas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === "eficiencia" ? `${value.toFixed(1)}%` : `R$ ${value.toLocaleString("pt-BR")}`,
                        name === "eficiencia" ? "Eficiência" : "Vendas",
                      ]}
                    />
                    <Line type="monotone" dataKey="eficiencia" stroke="#dc2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="vendas" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Tempo de Preparo por Produto</CardTitle>
                <CardDescription>Produtos que demandam mais tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricasTempo.tempoMedioPorProduto} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="produto" type="category" width={100} />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)} min`, "Tempo Médio"]} />
                    <Bar dataKey="tempo" fill="#4b5563" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <div>
                    <CardTitle>Ranking de Produtos</CardTitle>
                    <CardDescription>Análise detalhada de performance por produto</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={criterioRanking}
                    onChange={(e) => setCriterioRanking(e.target.value as any)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="quantidade">Por Quantidade</option>
                    <option value="receita">Por Receita</option>
                    {mostrarLucros && <option value="lucro">Por Lucro</option>}
                    <option value="margem">Por Margem</option>
                  </select>
                  <div className="flex border border-border rounded-md">
                    <Button
                      variant={visualizacaoRanking === "lista" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setVisualizacaoRanking("lista")}
                      className="rounded-r-none"
                    >
                      Lista
                    </Button>
                    <Button
                      variant={visualizacaoRanking === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setVisualizacaoRanking("grid")}
                      className="rounded-none border-x"
                    >
                      Grid
                    </Button>
                    <Button
                      variant={visualizacaoRanking === "grafico" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setVisualizacaoRanking("grafico")}
                      className="rounded-l-none"
                    >
                      Gráfico
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderRanking()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          {relatorioDetalhado && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatório Executivo - {relatorioDetalhado.periodo}
                  </CardTitle>
                  <CardDescription>Gerado em {new Date().toLocaleString("pt-BR")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Resumo de Vendas</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">
                            {relatorioDetalhado.vendas.total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantidade:</span>
                          <span className="font-medium">{relatorioDetalhado.vendas.quantidade} itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ticket Médio:</span>
                          <span className="font-medium">
                            {relatorioDetalhado.vendas.ticketMedio.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Crescimento:</span>
                          <span
                            className={`font-medium ${relatorioDetalhado.vendas.crescimento >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {relatorioDetalhado.vendas.crescimento >= 0 ? "+" : ""}
                            {relatorioDetalhado.vendas.crescimento.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </Card>

                    {mostrarLucros && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Análise de Lucros</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Lucro Bruto:</span>
                            <span className="font-medium">
                              {relatorioDetalhado.lucros.bruto.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lucro Líquido:</span>
                            <span
                              className={`font-medium ${relatorioDetalhado.lucros.liquido >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {relatorioDetalhado.lucros.liquido.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Margem:</span>
                            <span className="font-medium">{relatorioDetalhado.lucros.margem.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ROI:</span>
                            <span className="font-medium">{relatorioDetalhado.lucros.roi.toFixed(1)}%</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Performance Produtos</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mais Vendido:</span>
                          <p className="font-medium">{relatorioDetalhado.produtos.maisVendido}</p>
                        </div>
                        {mostrarLucros && (
                          <div>
                            <span className="text-muted-foreground">Mais Lucrativo:</span>
                            <p className="font-medium">{relatorioDetalhado.produtos.maisLucrativo}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Melhor Margem:</span>
                          <p className="font-medium">{relatorioDetalhado.produtos.melhorMargem}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precisa Atenção:</span>
                          <p className="font-medium text-orange-600">{relatorioDetalhado.produtos.piorPerformance}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Indicadores Operacionais</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tempo Médio:</span>
                          <span className="font-medium">{relatorioDetalhado.operacional.tempoMedio.toFixed(0)}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Eficiência:</span>
                          <span className="font-medium">{relatorioDetalhado.operacional.eficiencia.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacidade:</span>
                          <span className="font-medium">{relatorioDetalhado.operacional.capacidade.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Satisfação:</span>
                          <span className="font-medium text-green-600">
                            {relatorioDetalhado.operacional.satisfacao.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-4">Análise de Tendências</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                            relatorioDetalhado.tendencias.vendas === "alta"
                              ? "bg-green-100 text-green-800"
                              : relatorioDetalhado.tendencias.vendas === "baixa"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {relatorioDetalhado.tendencias.vendas === "alta" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : relatorioDetalhado.tendencias.vendas === "baixa" ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <Target className="h-4 w-4" />
                          )}
                          Vendas{" "}
                          {relatorioDetalhado.tendencias.vendas === "alta"
                            ? "em Alta"
                            : relatorioDetalhado.tendencias.vendas === "baixa"
                              ? "em Baixa"
                              : "Estáveis"}
                        </div>
                      </div>

                      {mostrarLucros && (
                        <div className="text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                              relatorioDetalhado.tendencias.lucros === "alta"
                                ? "bg-green-100 text-green-800"
                                : relatorioDetalhado.tendencias.lucros === "baixa"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {relatorioDetalhado.tendencias.lucros === "alta" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : relatorioDetalhado.tendencias.lucros === "baixa" ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <Target className="h-4 w-4" />
                            )}
                            Lucros{" "}
                            {relatorioDetalhado.tendencias.lucros === "alta"
                              ? "em Alta"
                              : relatorioDetalhado.tendencias.lucros === "baixa"
                                ? "em Baixa"
                                : "Estáveis"}
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                            relatorioDetalhado.tendencias.eficiencia === "alta"
                              ? "bg-green-100 text-green-800"
                              : relatorioDetalhado.tendencias.eficiencia === "baixa"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {relatorioDetalhado.tendencias.eficiencia === "alta" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : relatorioDetalhado.tendencias.eficiencia === "baixa" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                          Eficiência{" "}
                          {relatorioDetalhado.tendencias.eficiencia === "alta"
                            ? "Excelente"
                            : relatorioDetalhado.tendencias.eficiencia === "baixa"
                              ? "Baixa"
                              : "Moderada"}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-4">Recomendações Estratégicas</h4>
                    <div className="space-y-3 text-sm">
                      {relatorioDetalhado.tendencias.vendas === "baixa" && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">Atenção: Queda nas Vendas</p>
                            <p className="text-red-700">
                              Considere revisar estratégias de marketing e promoções para reverter a tendência.
                            </p>
                          </div>
                        </div>
                      )}

                      {relatorioDetalhado.operacional.eficiencia < 70 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">Oportunidade: Melhoria Operacional</p>
                            <p className="text-yellow-700">
                              A eficiência operacional pode ser otimizada. Analise os gargalos no processo de produção.
                            </p>
                          </div>
                        </div>
                      )}

                      {relatorioDetalhado.tendencias.vendas === "alta" && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">Excelente: Crescimento Sustentado</p>
                            <p className="text-green-700">
                              Continue investindo nos produtos mais vendidos e considere expandir a capacidade.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analises" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
                <CardDescription>Evolução diária das vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dadosVendasDiarias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === "vendas" ? `R$ ${value.toLocaleString("pt-BR")}` : `${value} pedidos`,
                        name === "vendas" ? "Vendas" : "Pedidos",
                      ]}
                    />
                    <Area type="monotone" dataKey="vendas" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Performance</CardTitle>
                <CardDescription>Indicadores operacionais principais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Tempo Médio de Entrega</span>
                  </div>
                  <span className="font-bold">{metricasTempo.tempoMedioEntrega.toFixed(0)}min</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {metricasTempo.pedidosNoHorario + metricasTempo.pedidosAtrasados > 0
                      ? (
                          (metricasTempo.pedidosNoHorario /
                            (metricasTempo.pedidosNoHorario + metricasTempo.pedidosAtrasados)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Produtividade</span>
                  </div>
                  <span className="font-bold">
                    {metricasTempo.capacidadeUtilizada > 80
                      ? "Alta"
                      : metricasTempo.capacidadeUtilizada > 60
                        ? "Média"
                        : "Baixa"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Pico de Demanda</span>
                  </div>
                  <span className="font-bold">
                    {Array.isArray(metricasTempo.horariosPickVendas) && metricasTempo.horariosPickVendas.length > 0
                      ? metricasTempo.horariosPickVendas.reduce((max, curr) => (curr.vendas > max.vendas ? curr : max))
                          .hora
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produto Mais Lucrat</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl">{rankingProdutos.sort((a, b) => b.lucro - a.lucro)[0]?.nome}</h3>
                    <p className="text-muted-foreground">
                      {mostrarLucros
                        ? `Lucro: ${rankingProdutos.sort((a, b) => b.lucro - a.lucro)[0]?.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                        : `Margem: ${rankingProdutos.sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]?.margemUnitaria.toFixed(1)}%`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maior Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl">{rankingProdutos[0]?.nome}</h3>
                    <p className="text-muted-foreground">{rankingProdutos[0]?.quantidadeVendida} unidades vendidas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Melhor Margem</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl">
                      {rankingProdutos.sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]?.nome}
                    </h3>
                    <p className="text-muted-foreground">
                      {rankingProdutos
                        .sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]
                        ?.margemUnitaria.toFixed(1)}
                      % de margem
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="configuracao-loja" className="space-y-6">
          {renderConfiguracaoLoja()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
