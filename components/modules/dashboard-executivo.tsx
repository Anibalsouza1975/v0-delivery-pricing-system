"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
  Building,
  Upload,
  Save,
} from "lucide-react"
import { usePricing } from "@/components/pricing-context-supabase"
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

interface DadosEmpresa {
  id?: string
  nome: string
  razao_social?: string
  cnpj?: string
  telefone: string
  email?: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  logo_url?: string
  cor_primaria: string
  cor_secundaria: string
  descricao?: string
  horario_funcionamento?: string
  redes_sociais?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
}

export default function DashboardExecutivoModule() {
  const {
    produtos,
    insumos,
    getTotalCustosFixos,
    getTotalCustosVariaveis,
    vendas: vendasSupabase,
    itensVenda,
    bebidas: bebidasSupabase,
    combos: combosSupabase,
  } = usePricing()

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
      ? JSON.parse(saved) // Corrigido JSON.Parse para JSON.parse
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
  const [filtroData, setFiltroData] = useState("semana") // Alterado de "hoje" para "semana"
  const [mostrarLucros, setMostrarLucros] = useState(false)
  const [criterioRanking, setCriterioRanking] = useState<"quantidade" | "receita" | "lucro" | "margem">("quantidade")
  const [visualizacaoRanking, setVisualizacaoRanking] = useState<"lista" | "grid" | "grafico">("lista")
  const [abaSelecionada, setAbaSelecionada] = useState("dashboard")

  const [configuracaoFrete, setConfiguracaoFrete] = useState({
    freteGratis: false,
    valorFrete: 5.0,
    valorMinimoFreteGratis: 30.0,
  })

  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    cor_primaria: "#dc2626",
    cor_secundaria: "#f59e0b",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false)

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
    console.log("[v0] Dashboard - Carregando dados do Supabase")
    console.log("[v0] Vendas Supabase:", vendasSupabase?.length || 0)
    console.log("[v0] Itens Venda:", itensVenda?.length || 0)
    console.log("[v0] Produtos:", produtos?.length || 0)

    if (vendasSupabase && Array.isArray(vendasSupabase)) {
      const vendasConvertidas: VendaData[] = vendasSupabase.map((venda) => {
        // Buscar itens desta venda
        const itensVendaFiltrados = itensVenda?.filter((item) => item.venda_id === venda.id) || []

        const produtos = itensVendaFiltrados.map((item) => ({
          produtoId: item.produto_id || item.bebida_id || item.combo_id || "",
          quantidade: item.quantidade || 1,
          preco: item.preco_unitario || 0,
        }))

        return {
          id: venda.id,
          data: venda.data_venda || venda.created_at,
          total: venda.total || 0,
          produtos,
          formaPagamento: venda.forma_pagamento || "Não informado",
          cliente: venda.cliente_nome
            ? {
                nome: venda.cliente_nome,
                telefone: venda.cliente_telefone || "",
                endereco: venda.cliente_endereco || "",
              }
            : undefined,
        }
      })

      console.log("[v0] Vendas convertidas:", vendasConvertidas.length)
      setVendas(vendasConvertidas)
    }

    // Usar dados do contexto para produtos, bebidas e combos
    if (produtos && Array.isArray(produtos)) {
      setProdutos(produtos)
    }
    if (bebidasSupabase && Array.isArray(bebidasSupabase)) {
      setBebidas(bebidasSupabase)
    }
    if (combosSupabase && Array.isArray(combosSupabase)) {
      setCombos(combosSupabase)
    }

    // Também manter compatibilidade com localStorage para dados antigos
    const vendasLocalStorage = JSON.parse(localStorage.getItem("vendas") || "[]")
    const pedidosLocalStorage = JSON.parse(localStorage.getItem("pedidos") || "[]")

    if (Array.isArray(vendasLocalStorage) && vendasLocalStorage.length > 0) {
      console.log("[v0] Adicionando vendas do localStorage:", vendasLocalStorage.length)
      setVendas((prev) => [...prev, ...vendasLocalStorage])
    }

    if (Array.isArray(pedidosLocalStorage) && pedidosLocalStorage.length > 0) {
      console.log("[v0] Adicionando pedidos do localStorage:", pedidosLocalStorage.length)
      setPedidos(pedidosLocalStorage)
    }
  }, [vendasSupabase, itensVenda, produtos, bebidasSupabase, combosSupabase])

  useEffect(() => {
    if (vendas.length === 0) {
      console.log("[v0] Nenhuma venda encontrada, resetando métricas")
      return
    }

    console.log("[v0] Calculando métricas de tempo para", vendas.length, "vendas")

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

    console.log("[v0] Vendas filtradas:", vendasFiltradas.length, "para período:", filtroData)

    const tempoMedioPreparo =
      vendasFiltradas.length > 0
        ? vendasFiltradas.reduce((acc, venda) => {
            if (!Array.isArray(venda.produtos)) return acc

            const tempoVenda = venda.produtos.reduce((tempoTotal, produtoVenda) => {
              // Buscar produto real no banco
              const produtoInfo = produtos?.find((p) => p.id === produtoVenda.produtoId)
              if (produtoInfo) {
                // Usar tempo_preparo real do produto se disponível
                const tempoPreparo = produtoInfo.tempo_preparo || 10
                return tempoTotal + tempoPreparo * produtoVenda.quantidade
              }
              // Fallback para produtos não encontrados
              return tempoTotal + 10 * produtoVenda.quantidade
            }, 0)
            return acc + tempoVenda
          }, 0) / vendasFiltradas.length
        : 0

    console.log("[v0] Tempo médio de preparo calculado:", tempoMedioPreparo, "minutos")

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

      // Eficiência baseada no horário e volume de vendas
      let eficiencia = 0
      if (vendas > 0) {
        // Horários de pico (11-14h e 18-21h) têm eficiência menor devido ao volume
        if ((hora >= 11 && hora <= 14) || (hora >= 18 && hora <= 21)) {
          eficiencia = Math.max(60, Math.min(85, 75 + Math.random() * 10))
        } else if (hora >= 6 && hora <= 22) {
          eficiencia = Math.max(80, Math.min(95, 85 + Math.random() * 10))
        } else {
          eficiencia = Math.max(90, Math.min(100, 95 + Math.random() * 5))
        }
      }

      return {
        hora: `${hora.toString().padStart(2, "0")}:00`,
        vendas,
        eficiencia,
      }
    }).filter((item) => item.vendas > 0 || (item.hora >= "06:00" && item.hora <= "23:00"))

    const produtoTempoMap = new Map()
    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoVenda) => {
            const produtoInfo = produtos?.find((p) => p.id === produtoVenda.produtoId)
            if (produtoInfo) {
              // Usar tempo_preparo real do produto
              const tempoProduto = produtoInfo.tempo_preparo || 10

              const existing = produtoTempoMap.get(produtoInfo.nome) || { total: 0, count: 0 }
              existing.total += tempoProduto * produtoVenda.quantidade
              existing.count += produtoVenda.quantidade
              produtoTempoMap.set(produtoInfo.nome, existing)
            }
          })
        }
      })
    }

    const tempoMedioPorProduto = Array.from(produtoTempoMap.entries())
      .map(([produto, data]) => ({
        produto: produto.length > 15 ? produto.substring(0, 15) + "..." : produto,
        tempo: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 10)

    const capacidadeMaxima = 100
    const capacidadeUtilizada = Math.min(100, (totalPedidos / capacidadeMaxima) * 100)

    console.log("[v0] Métricas de tempo calculadas:", {
      tempoMedioPreparo,
      eficienciaOperacional,
      horariosPickVendas: horariosPickVendas.length,
      tempoMedioPorProduto: tempoMedioPorProduto.length,
    })

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

  const calcularMetricas = useCallback(() => {
    if (!vendas || !Array.isArray(vendas)) return

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

    console.log("[v0] Quantidade vendida calculada:", quantidadeVendida, "de", vendasFiltradas.length, "vendas")
    console.log("[v0] Venda total:", vendaTotal)

    let custoTotal = 0
    let lucroTotal = vendaTotal

    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoVenda) => {
            const produto = produtos?.find((p) => p.id === produtoVenda.produtoId)
            if (produto) {
              const custoUnitario = produto.cmv || 0
              const custoTotalProduto = custoUnitario * produtoVenda.quantidade
              custoTotal += custoTotalProduto
              lucroTotal -= custoTotalProduto
            }
          })
        }
      })
    }

    const custosOperacionais = filtroData === "mes" ? getTotalCustosFixos() : getTotalCustosFixos() / 30
    const custosVariaveisTotais = filtroData === "mes" ? getTotalCustosVariaveis() : getTotalCustosVariaveis()

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

    const tempoMedioPedidos = metricasTempo.tempoMedioPreparo || 0

    console.log("[v0] Métricas finais:", {
      vendaTotal,
      quantidadeVendida,
      tempoMedioPedidos,
      ticketMedio,
    })

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

    // Primeiro, processar dados do localStorage (vendas antigas)
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
              existing.lucro += (produtoVenda.preco - (produto.cmv || 0)) * produtoVenda.quantidade
              existing.margemUnitaria =
                produtoVenda.preco > 0 ? ((produtoVenda.preco - (produto.cmv || 0)) / produtoVenda.preco) * 100 : 0

              produtosMap.set(key, existing)
            }
          })
        }
      })
    }

    // Agora processar dados reais do Supabase (itens_venda)
    console.log("[v0] Processando itens_venda do Supabase:", itensVenda?.length || 0)
    if (itensVenda && Array.isArray(itensVenda)) {
      // Filtrar itens_venda baseado nas vendas filtradas
      const vendasIds = vendasFiltradas.map((v) => v.id)
      const itensVendaFiltrados = itensVenda.filter((item) => vendasIds.includes(item.venda_id))

      console.log("[v0] Itens venda filtrados:", itensVendaFiltrados.length)

      itensVendaFiltrados.forEach((itemVenda) => {
        // Buscar produto por produto_id, bebida_id ou combo_id
        let produto = null
        let precoUnitario = 0

        if (itemVenda.produto_id) {
          produto = produtos?.find((p) => p.id === itemVenda.produto_id)
          precoUnitario = produto?.preco || 0
        } else if (itemVenda.bebida_id) {
          produto = bebidas?.find((b) => b.id === itemVenda.bebida_id)
          precoUnitario = produto?.preco || 0
        } else if (itemVenda.combo_id) {
          produto = combos?.find((c) => c.id === itemVenda.combo_id)
          precoUnitario = produto?.preco || 0
        }

        if (produto) {
          const key = produto.id
          const quantidade = itemVenda.quantidade || 1
          const receita = precoUnitario * quantidade
          const custoUnitario = produto.cmv || produto.custo || 0
          const lucroItem = (precoUnitario - custoUnitario) * quantidade
          const margemUnitaria = precoUnitario > 0 ? ((precoUnitario - custoUnitario) / precoUnitario) * 100 : 0

          const existing = produtosMap.get(key) || {
            id: produto.id,
            nome: produto.nome,
            quantidadeVendida: 0,
            receita: 0,
            lucro: 0,
            participacao: 0,
            margemUnitaria: 0,
          }

          existing.quantidadeVendida += quantidade
          existing.receita += receita
          existing.lucro += lucroItem
          existing.margemUnitaria = margemUnitaria

          produtosMap.set(key, existing)

          console.log("[v0] Produto processado:", produto.nome, "Qtd:", quantidade, "Receita:", receita)
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

    console.log("[v0] Ranking produtos calculado:", ranking.length)
    console.log(
      "[v0] Top 3 produtos:",
      ranking.slice(0, 3).map((p) => ({ nome: p.nome, qtd: p.quantidadeVendida, receita: p.receita })),
    )
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
        quantidade: quantidadeVendida, // Usando quantidade correta aqui
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
        tempoMedio: tempoMedioPedidos,
        eficiencia: metricasTempo.eficienciaOperacional || 100,
        capacidade: Math.min(100, (quantidadeVendida / 100) * 100),
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
    itensVenda, // Adicionado para garantir que o cálculo seja refeito quando itensVenda muda
    bebidas, // Adicionado para garantir que o cálculo seja refeito quando bebidas muda
    combos, // Adicionado para garantir que o cálculo seja refeito quando combos muda
  ])

  useEffect(() => {
    if (vendas.length === 0) {
      console.log("[v0] Nenhuma venda para calcular métricas principais")
      return
    }

    console.log("[v0] Calculando métricas principais para", vendas.length, "vendas")

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

    console.log("[v0] Quantidade vendida calculada:", quantidadeVendida, "de", vendasFiltradas.length, "vendas")
    console.log("[v0] Venda total:", vendaTotal)

    let custoTotal = 0
    let lucroTotal = vendaTotal

    if (vendasFiltradas && Array.isArray(vendasFiltradas)) {
      vendasFiltradas.forEach((venda) => {
        if (venda && venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoVenda) => {
            const produto = produtos?.find((p) => p.id === produtoVenda.produtoId)
            if (produto) {
              const custoUnitario = produto.cmv || 0
              const custoTotalProduto = custoUnitario * produtoVenda.quantidade
              custoTotal += custoTotalProduto
              lucroTotal -= custoTotalProduto
            }
          })
        }
      })
    }

    const custosOperacionais = filtroData === "mes" ? getTotalCustosFixos() : getTotalCustosFixos() / 30
    const custosVariaveisTotais = filtroData === "mes" ? getTotalCustosVariaveis() : getTotalCustosVariaveis()

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

    const tempoMedioPedidos = metricasTempo.tempoMedioPreparo || 0

    console.log("[v0] Métricas finais:", {
      vendaTotal,
      quantidadeVendida,
      tempoMedioPedidos,
      ticketMedio,
    })

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

    // Primeiro, processar dados do localStorage (vendas antigas)
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
              existing.lucro += (produtoVenda.preco - (produto.cmv || 0)) * produtoVenda.quantidade
              existing.margemUnitaria =
                produtoVenda.preco > 0 ? ((produtoVenda.preco - (produto.cmv || 0)) / produtoVenda.preco) * 100 : 0

              produtosMap.set(key, existing)
            }
          })
        }
      })
    }

    // Agora processar dados reais do Supabase (itens_venda)
    console.log("[v0] Processando itens_venda do Supabase:", itensVenda?.length || 0)
    if (itensVenda && Array.isArray(itensVenda)) {
      // Filtrar itens_venda baseado nas vendas filtradas
      const vendasIds = vendasFiltradas.map((v) => v.id)
      const itensVendaFiltrados = itensVenda.filter((item) => vendasIds.includes(item.venda_id))

      console.log("[v0] Itens venda filtrados:", itensVendaFiltrados.length)

      itensVendaFiltrados.forEach((itemVenda) => {
        // Buscar produto por produto_id, bebida_id ou combo_id
        let produto = null
        let precoUnitario = 0

        if (itemVenda.produto_id) {
          produto = produtos?.find((p) => p.id === itemVenda.produto_id)
          precoUnitario = produto?.preco || 0
        } else if (itemVenda.bebida_id) {
          produto = bebidas?.find((b) => b.id === itemVenda.bebida_id)
          precoUnitario = produto?.preco || 0
        } else if (itemVenda.combo_id) {
          produto = combos?.find((c) => c.id === itemVenda.combo_id)
          precoUnitario = produto?.preco || 0
        }

        if (produto) {
          const key = produto.id
          const quantidade = itemVenda.quantidade || 1
          const receita = precoUnitario * quantidade
          const custoUnitario = produto.cmv || produto.custo || 0
          const lucroItem = (precoUnitario - custoUnitario) * quantidade
          const margemUnitaria = precoUnitario > 0 ? ((precoUnitario - custoUnitario) / precoUnitario) * 100 : 0

          const existing = produtosMap.get(key) || {
            id: produto.id,
            nome: produto.nome,
            quantidadeVendida: 0,
            receita: 0,
            lucro: 0,
            participacao: 0,
            margemUnitaria: 0,
          }

          existing.quantidadeVendida += quantidade
          existing.receita += receita
          existing.lucro += lucroItem
          existing.margemUnitaria = margemUnitaria

          produtosMap.set(key, existing)

          console.log("[v0] Produto processado:", produto.nome, "Qtd:", quantidade, "Receita:", receita)
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

    console.log("[v0] Ranking produtos calculado:", ranking.length)
    console.log(
      "[v0] Top 3 produtos:",
      ranking.slice(0, 3).map((p) => ({ nome: p.nome, qtd: p.quantidadeVendida, receita: p.receita })),
    )
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
        quantidade: quantidadeVendida, // Usando quantidade correta aqui
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
        tempoMedio: tempoMedioPedidos,
        eficiencia: metricasTempo.eficienciaOperacional || 100,
        capacidade: Math.min(100, (quantidadeVendida / 100) * 100),
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
    itensVenda, // Adicionado para garantir que o cálculo seja refeito quando itensVenda muda
    bebidas, // Adicionado para garantir que o cálculo seja refeito quando bebidas muda
    combos, // Adicionado para garantir que o cálculo seja refeito quando combos muda
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

    const vendasDoDia = vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      return dataVenda.toDateString() === data.toDateString()
    })

    const totalVendas = vendasDoDia.reduce((acc, venda) => acc + (venda.total || 0), 0)
    const quantidadePedidos = vendasDoDia.length

    return {
      dia: data.toLocaleDateString("pt-BR", { weekday: "short" }),
      vendas: totalVendas,
      pedidos: quantidadePedidos,
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
              formatter={(value: any, name: string) => [
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

  const carregarDadosEmpresa = async () => {
    try {
      const response = await fetch("/api/empresa")
      if (response.ok) {
        const dados = await response.json()
        if (dados) {
          setDadosEmpresa(dados)
          if (dados.logo_url) {
            setLogoPreview(dados.logo_url)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados da empresa:", error)
    }
  }

  const salvarDadosEmpresa = async () => {
    setSalvandoEmpresa(true)
    try {
      let logoUrl = dadosEmpresa.logo_url

      // Upload da logo se houver arquivo selecionado
      if (logoFile) {
        const formData = new FormData()
        formData.append("logo", logoFile)

        const uploadResponse = await fetch("/api/empresa/upload-logo", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          logoUrl = url
        }
      }

      // Salvar dados da empresa
      const response = await fetch("/api/empresa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dadosEmpresa,
          logo_url: logoUrl,
        }),
      })

      if (response.ok) {
        const dadosSalvos = await response.json()
        setDadosEmpresa(dadosSalvos)
        if (dadosSalvos.logo_url) {
          setLogoPreview(dadosSalvos.logo_url)
        }
        alert("Dados da empresa salvos com sucesso!")
      } else {
        alert("Erro ao salvar dados da empresa")
      }
    } catch (error) {
      console.error("[v0] Erro ao salvar dados da empresa:", error)
      alert("Erro ao salvar dados da empresa")
    } finally {
      setSalvandoEmpresa(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    carregarDadosEmpresa()
  }, [])

  const renderDadosEmpresa = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Configure os dados da sua empresa que aparecerão no sistema e para os clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo da Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Logo da Empresa</h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {logoPreview ? (
                  <img
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo da empresa"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Sem logo</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB</p>
              </div>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Empresa *</label>
              <input
                type="text"
                value={dadosEmpresa.nome}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nome: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nome fantasia da empresa"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Razão Social</label>
              <input
                type="text"
                value={dadosEmpresa.razao_social || ""}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, razao_social: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Razão social da empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CNPJ</label>
              <input
                type="text"
                value={dadosEmpresa.cnpj || ""}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cnpj: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefone *</label>
              <input
                type="text"
                value={dadosEmpresa.telefone}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, telefone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                value={dadosEmpresa.email || ""}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Endereço Completo *</label>
                <input
                  type="text"
                  value={dadosEmpresa.endereco}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, endereco: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cidade *</label>
                <input
                  type="text"
                  value={dadosEmpresa.cidade}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cidade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="São Paulo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estado *</label>
                <select
                  value={dadosEmpresa.estado}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, estado: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CEP *</label>
                <input
                  type="text"
                  value={dadosEmpresa.cep}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cep: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="00000-000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personalização */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personalização Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={dadosEmpresa.cor_primaria}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cor_primaria: e.target.value })}
                    className="w-12 h-10 border rounded"
                  />
                  <input
                    type="text"
                    value={dadosEmpresa.cor_primaria}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cor_primaria: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="#dc2626"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cor Secundária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={dadosEmpresa.cor_secundaria}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cor_secundaria: e.target.value })}
                    className="w-12 h-10 border rounded"
                  />
                  <input
                    type="text"
                    value={dadosEmpresa.cor_secundaria}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cor_secundaria: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Adicionais</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Descrição da Empresa</label>
              <textarea
                value={dadosEmpresa.descricao || ""}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, descricao: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Breve descrição da empresa e seus serviços"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Horário de Funcionamento</label>
              <input
                type="text"
                value={dadosEmpresa.horario_funcionamento || ""}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, horario_funcionamento: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Segunda a Sábado: 18h às 23h"
              />
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Redes Sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Instagram</label>
                <input
                  type="text"
                  value={dadosEmpresa.redes_sociais?.instagram || ""}
                  onChange={(e) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      redes_sociais: {
                        ...dadosEmpresa.redes_sociais,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="@minha_empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facebook</label>
                <input
                  type="text"
                  value={dadosEmpresa.redes_sociais?.facebook || ""}
                  onChange={(e) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      redes_sociais: {
                        ...dadosEmpresa.redes_sociais,
                        facebook: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="facebook.com/minhaempresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input
                  type="text"
                  value={dadosEmpresa.redes_sociais?.whatsapp || ""}
                  onChange={(e) =>
                    setDadosEmpresa({
                      ...dadosEmpresa,
                      redes_sociais: {
                        ...dadosEmpresa.redes_sociais,
                        whatsapp: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={salvarDadosEmpresa}
              disabled={salvandoEmpresa || !dadosEmpresa.nome || !dadosEmpresa.telefone}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {salvandoEmpresa ? "Salvando..." : "Salvar Dados da Empresa"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const abas = [
    { id: "dashboard", nome: "Dashboard", icone: TrendingUp },
    { id: "relatorios", nome: "Relatórios", icone: BarChart3 },
    { id: "analises", nome: "Análises", icone: Package },
    { id: "dados-empresa", nome: "Dados da Empresa", icone: Building },
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
        <TabsList className="grid w-full grid-cols-5">
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
                {dadosVendasDiarias.some((d) => d.vendas > 0) ? (
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma venda nos últimos 7 dias</p>
                      <p className="text-sm">Os dados aparecerão aqui quando houver vendas</p>
                    </div>
                  </div>
                )}
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
                <CardTitle className="text-lg">Produto Mais Lucrativo</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-xl">{rankingProdutos.sort((a, b) => b.lucro - a.lucro)[0]?.nome}</h3>
                    <p className="text-muted-foreground">
                      {mostrarLucros
                        ? `Lucro: ${rankingProdutos.sort((a, b) => b.lucro - a.lucro)[0]?.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                        : `Margem: ${rankingProdutos.sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]?.margemUnitaria.toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rankingProdutos.sort((a, b) => b.lucro - a.lucro)[0]?.quantidadeVendida} unidades vendidas
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum produto vendido</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maior Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-xl">{rankingProdutos[0]?.nome}</h3>
                    <p className="text-muted-foreground">{rankingProdutos[0]?.quantidadeVendida} unidades vendidas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receita:{" "}
                      {rankingProdutos[0]?.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum produto vendido</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Melhor Margem</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingProdutos.length > 0 ? (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {rankingProdutos.sort((a, b) => b.margemUnitaria - a.margemUnitaria)[0]?.quantidadeVendida}{" "}
                      unidades vendidas
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum produto vendido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dados-empresa" className="space-y-6">
          {renderDadosEmpresa()}
        </TabsContent>

        <TabsContent value="configuracao-loja" className="space-y-6">
          {renderConfiguracaoLoja()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
