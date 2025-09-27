"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  Package,
  CheckCircle,
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  Volume2,
  VolumeX,
  Printer,
  Eye,
  AlertTriangle,
  Package2,
  History,
  Trash2,
  Filter,
} from "lucide-react"
import { usePricing } from "@/components/pricing-context-supabase"

interface Pedido {
  id: string
  numero_pedido: string
  cliente_nome: string
  cliente_telefone?: string
  cliente_endereco: string
  cliente_complemento?: string
  cliente_observacoes?: string
  itens: Array<{
    nome: string
    categoria: string
    preco: number
    quantidade: number
    personalizacoes?: {
      removidos?: string[]
      adicionados?: string[]
    }
    observacoes?: string
  }>
  subtotal: number
  taxa_entrega: number // Campo correto do banco
  total: number
  status: "pendente" | "preparando" | "pronto" | "saiu_entrega" | "entregue" | "concluido"
  forma_pagamento: string
  origem?: "menu" | "vendas"
  created_at: string
  updated_at: string
  observacoes_pedido?: string // Campo correto do banco
}

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-slate-600 text-white", icon: Clock },
  preparando: { label: "Preparando", color: "bg-blue-600 text-white", icon: Package },
  pronto: { label: "Pronto", color: "bg-purple-600 text-white", icon: CheckCircle },
  saiu_entrega: { label: "Saiu para Entrega", color: "bg-orange-600 text-white", icon: Package },
  entregue: { label: "Entregue", color: "bg-green-600 text-white", icon: CheckCircle },
  concluido: { label: "Concluído", color: "bg-emerald-700 text-white", icon: CheckCircle },
}

export default function ControleProducaoModule() {
  const { produtos, insumos, ingredientesBase, getEstoqueAtualIngrediente } = usePricing()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidosHistorico, setPedidosHistorico] = useState<Pedido[]>([])
  const [pedidosConcluidos, setPedidosConcluidos] = useState<Pedido[]>([]) // Adicionado estado separado para pedidos concluídos
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [audioAtivado, setAudioAtivado] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const pedidosCountRef = useRef<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null) // Substituindo SSE por polling
  const [isConnected, setIsConnected] = useState(false) // Estado de conexão simplificado
  const isInitializedRef = useRef(false)

  // Estado para filtros do histórico
  const [filtroHistorico, setFiltroHistorico] = useState({
    periodo: "hoje",
    dataInicio: "",
    dataFim: "",
    status: "todos",
  })
  const [showHistorico, setShowHistorico] = useState(false) // Estado para controlar a exibição da aba histórico
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Pedido | null>(null) // Estado para o modal de exclusão

  const carregarDadosCompletos = async () => {
    if (isLoading) {
      console.log("[v0] Carregamento em andamento, ignorando...")
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Carregando dados...")

      // Carregar pedidos ativos e concluídos em paralelo
      const [responseAtivos, responseConcluidos] = await Promise.all([
        fetch("/api/pedidos?status=ativos&limit=50"),
        fetch("/api/pedidos?status=concluido&limit=5"),
      ])

      if (responseAtivos.ok) {
        const dataAtivos = await responseAtivos.json()
        const pedidosMapeados = dataAtivos.map((p: any) => ({
          ...p,
          frete: p.taxa_entrega || 0,
          observacoes: p.observacoes_pedido || "",
        }))
        const pedidosAtivos = pedidosMapeados.filter((p: Pedido) => p.status !== "concluido" && p.status !== "entregue")
        setPedidos(pedidosAtivos)

        // Verificar novos pedidos para notificação
        const novosPendentes = pedidosAtivos.filter((p: Pedido) => p.status === "pendente")
        if (pedidosCountRef.current > 0 && novosPendentes.length > pedidosCountRef.current && audioAtivado) {
          tocarSomNotificacao()
        }
        pedidosCountRef.current = novosPendentes.length
      }

      if (responseConcluidos.ok) {
        const dataConcluidos = await responseConcluidos.json()
        const pedidosConcluidos = dataConcluidos
          .map((p: any) => ({
            ...p,
            frete: p.taxa_entrega || 0,
            observacoes: p.observacoes_pedido || "",
          }))
          .filter((p: Pedido) => p.status === "concluido")
        setPedidosConcluidos(pedidosConcluidos)
      }

      setIsConnected(true)
      console.log("[v0] Dados carregados")
    } catch (error) {
      console.error("[v0] Erro ao carregar:", error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const carregarHistoricoComFiltros = async () => {
    try {
      console.log("[v0] Carregando histórico...")
      const params = new URLSearchParams()

      if (filtroHistorico.status !== "todos") {
        params.append("status", filtroHistorico.status)
      }

      if (filtroHistorico.periodo === "hoje") {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        params.append("dataInicio", hoje.toISOString())
      } else if (filtroHistorico.periodo === "semana") {
        const semanaAtras = new Date()
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        params.append("dataInicio", semanaAtras.toISOString())
      } else if (filtroHistorico.periodo === "mes") {
        const mesAtras = new Date()
        mesAtras.setMonth(mesAtras.getMonth() - 1)
        params.append("dataInicio", mesAtras.toISOString())
      } else if (filtroHistorico.periodo === "personalizado" && filtroHistorico.dataInicio && filtroHistorico.dataFim) {
        params.append("dataInicio", new Date(filtroHistorico.dataInicio).toISOString())
        params.append("dataFim", new Date(filtroHistorico.dataFim + "T23:59:59").toISOString())
      }

      const response = await fetch(`/api/pedidos?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Erro ao carregar histórico")
      }

      const data = await response.json()
      const pedidosMapeados = data.map((p: any) => ({
        ...p,
        frete: p.taxa_entrega || 0,
        observacoes: p.observacoes_pedido || "",
      }))

      setPedidosHistorico(pedidosMapeados)
      console.log(`[v0] Histórico carregado: ${pedidosMapeados.length} pedidos`)
    } catch (error) {
      console.error("[v0] Erro no histórico:", error)
      setPedidosHistorico([])
    }
  }

  const excluirPedido = async (pedidoId: string) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir pedido")
      }

      // Atualizar lista local
      setPedidosHistorico((prev) => prev.filter((p) => p.id !== pedidoId))
      setPedidoParaExcluir(null)

      console.log(`[v0] Pedido excluído: ${pedidoId.substring(0, 8)}`)
      alert("Pedido excluído com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao excluir:", error)
      alert("Erro ao excluir pedido. Tente novamente.")
    }
  }

  const atualizarStatusNoBanco = async (pedidoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar status")
      }

      return true
    } catch (error) {
      console.error("[v0] Erro ao atualizar status:", error)
      return false
    }
  }

  const verificarDisponibilidadeEstoque = (pedido: Pedido) => {
    const problemasEstoque: { item: string; faltante: { insumo: string; necessario: number; disponivel: number }[] }[] =
      []

    pedido.itens.forEach((item) => {
      const produto = produtos?.find((p) => p.nome === item.nome)
      if (produto && produto.insumos) {
        const faltante: { insumo: string; necessario: number; disponivel: number }[] = []

        produto.insumos.forEach(({ insumoId, quantidade: quantidadePorUnidade }) => {
          const insumo = insumos?.find((i) => i.id === insumoId)
          if (insumo && insumo.ingredienteBaseId) {
            const quantidadeNecessariaInsumo = quantidadePorUnidade * item.quantidade
            const quantidadeNecessariaIngredienteBase = quantidadeNecessariaInsumo * insumo.quantidade

            const estoqueAtualIngredienteBase = getEstoqueAtualIngrediente(insumo.ingredienteBaseId)

            if (estoqueAtualIngredienteBase < quantidadeNecessariaIngredienteBase) {
              faltante.push({
                insumo: insumo.nome,
                necessario: quantidadeNecessariaIngredienteBase,
                disponivel: estoqueAtualIngredienteBase,
              })
            }
          }
        })

        if (faltante.length > 0) {
          problemasEstoque.push({
            item: item.nome,
            faltante,
          })
        }
      }
    })

    return problemasEstoque
  }

  const ativarAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }

      setAudioAtivado(true)
    } catch (error) {
      console.error("Erro ao ativar áudio:", error)
    }
  }

  const tocarSomNotificacao = () => {
    if (!audioAtivado || !audioContextRef.current) return

    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3)

      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 0.3)
    } catch (error) {
      console.error("Erro ao tocar som:", error)
    }
  }

  const imprimirPedido = (pedido: Pedido) => {
    console.log("[v0] Imprimindo pedido:", pedido.numero_pedido, "Pagamento:", pedido.forma_pagamento)

    const itensFormatados = pedido.itens
      .map((item, index) => {
        const itemCompleto = item as any
        const personalizacoes = itemCompleto.personalizacoes
        const observacoes = itemCompleto.observacoes

        const precoBase = item.preco || 0

        let valorAdicionais = 0
        if (personalizacoes?.adicionados) {
          personalizacoes.adicionados.forEach((adicionadoNome: string) => {
            const adicional = insumos?.find((i) => i.nome === adicionadoNome)
            if (adicional && adicional.preco) {
              valorAdicionais += adicional.preco
            }
          })
        }

        const valorTotal = ((precoBase + valorAdicionais) * item.quantidade).toFixed(2)

        const nomeItem = `${item.quantidade} ${item.nome}`
        let itemText = nomeItem.padEnd(32) + valorTotal.padStart(8)

        if (personalizacoes) {
          if (personalizacoes.removidos && personalizacoes.removidos.length > 0) {
            itemText += `\n    Retirar: ${personalizacoes.removidos.join(", ")}`
          }
          if (personalizacoes.adicionados && personalizacoes.adicionados.length > 0) {
            itemText += `\n    Adicionar: ${personalizacoes.adicionados.join(", ")}`
          }
        }

        if (observacoes && observacoes.trim()) {
          itemText += `\n    Obs: ${observacoes.trim()}`
        }

        return itemText
      })
      .join("\n")

    const subtotal = pedido.itens.reduce((acc, item) => {
      const precoBase = item.preco || 0

      let valorAdicionais = 0
      const itemCompleto = item as any
      if (itemCompleto.personalizacoes?.adicionados) {
        itemCompleto.personalizacoes.adicionados.forEach((adicionadoNome: string) => {
          const adicional = insumos?.find((i) => i.nome === adicionadoNome)
          if (adicional && adicional.preco) {
            valorAdicionais += adicional.preco
          }
        })
      }

      return acc + (precoBase + valorAdicionais) * item.quantidade
    }, 0)

    const totalFormatado = `${"TOTAL:".padEnd(32)}${subtotal.toFixed(2).padStart(8)}`
    const entregaFormatado =
      pedido.taxa_entrega > 0 ? `${"+ ENTREGA:".padEnd(32)}${pedido.taxa_entrega.toFixed(2).padStart(8)}` : ""
    const totalGeralFormatado =
      pedido.taxa_entrega > 0
        ? `${"= TOTAL A PAGAR:".padEnd(32)}${(subtotal + pedido.taxa_entrega).toFixed(2).padStart(8)}`
        : ""

    const statusPagamento =
      pedido.forma_pagamento === "pagamento-na-entrega" ? "*** A PAGAR NA ENTREGA ***" : "*** PEDIDO JÁ PAGO ***"

    console.log("[v0] Status pagamento:", statusPagamento.includes("PAGAR") ? "A pagar" : "Pago")

    const conteudoImpressao = `
           CARTAGO BURGER GRILL
    Rua das Flores, 123 - Centro
         CEP: 12345-678
    Tel: (11) 99999-9999 - WhatsApp
         CNPJ: 12.345.678/0001-90
    
    ----------------------------------------
    IMPRESSO EM ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    SIMPLES CONFERÊNCIA DA CONTA
    RELATÓRIO GERENCIAL
    
    *** NÃO É DOCUMENTO FISCAL ***
    
    ${pedido.cliente_nome.toUpperCase()}
    ${pedido.cliente_telefone ? `(${pedido.cliente_telefone.replace(/(\d{2})(\d{5})(\d{4})/, "$1) $2-$3")})` : ""}
    ${pedido.cliente_endereco}
    
    ----------------------------------------
    
    (Pedido N.: ${pedido.numero_pedido})
    
    ITEM (V.Unit)                    Total
    ${itensFormatados}
    
    ----------------------------------------
    ${totalFormatado}
    ${entregaFormatado}
    ${totalGeralFormatado}
    
    ----------------------------------------
    FORMA DE PAGAMENTO: ${pedido.forma_pagamento.toUpperCase().replace(/-/g, " ")}
    
    ${statusPagamento}
    
    ----------------------------------------
    
    * Obrigado pela Preferência! *
         Volte Sempre!
    `

    const janela = window.open("", "_blank")
    if (janela) {
      janela.document.write(`
        <html>
          <head>
            <title>Pedido #${pedido.numero_pedido}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 11px; 
                margin: 10px; 
                line-height: 1.3;
                max-width: 300px;
                text-align: center;
              }
              pre { 
                white-space: pre-wrap; 
                margin: 0;
                text-align: left;
              }
              .center { text-align: center; }
              .left { text-align: left; }
            </style>
          </head>
          <body>
            <pre>${conteudoImpressao}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
    }
  }

  const visualizarPedido = (pedido: Pedido) => {
    const problemasEstoque = verificarDisponibilidadeEstoque(pedido)

    const itensFormatados = pedido.itens
      .map((item, index) => {
        let itemText = `${item.quantidade} UN ${item.nome.toUpperCase()}`

        const itemCompleto = item as any
        const personalizacoes = itemCompleto.personalizacoes
        const observacoes = itemCompleto.observacoes

        if (personalizacoes) {
          if (personalizacoes.removidos && personalizacoes.removidos.length > 0) {
            itemText += `\n    Retirar: ${personalizacoes.removidos.join(", ")}`
          }
          if (personalizacoes.adicionados && personalizacoes.adicionados.length > 0) {
            itemText += `\n    Adicionar: ${personalizacoes.adicionados.join(", ")}`
          }
        }

        if (observacoes && observacoes.trim()) {
          itemText += `\n    Comentário: ${observacoes.trim()}`
        }

        return itemText
      })
      .join("\n\n")

    let alertaEstoque = ""
    if (problemasEstoque.length > 0) {
      alertaEstoque =
        "\n⚠️ ALERTA DE ESTOQUE:\n" +
        problemasEstoque
          .map(
            (p) =>
              `${p.item}:\n${p.faltante
                .map(
                  (f) => `  - ${f.insumo}: precisa ${f.necessario.toFixed(2)}, disponível ${f.disponivel.toFixed(2)}`,
                )
                .join("\n")}`,
          )
          .join("\n\n")
    }

    alert(`
**** PEDIDO #${pedido.numero_pedido} ****

Cliente: ${pedido.cliente_nome.toUpperCase()}
${pedido.cliente_telefone ? `Telefone: ${pedido.cliente_telefone}` : ""}
Endereço: ${pedido.cliente_endereco}
Pagamento: ${
      pedido.forma_pagamento === "pagamento-na-entrega"
        ? "Pag. na Entrega"
        : pedido.forma_pagamento
            .replace(/-/g, " ")
            .replace("cartao", "cartão")
            .replace("debito", "débito")
            .replace("credito", "crédito")
            .replace("mercadopago", "Mercado Pago")
            .replace("pix", "PIX")
            .toUpperCase()
    }

ITENS DO PEDIDO:
${itensFormatados}

Valor total: R$ ${pedido.total.toFixed(2)}
${pedido.taxa_entrega > 0 ? `Taxa de entrega: R$ ${pedido.taxa_entrega.toFixed(2)}` : ""}

Status: ${statusConfig[pedido.status]?.label || pedido.status}
Tempo: ${getTempoDecorrido(pedido.created_at)}

${pedido.observacoes_pedido ? `OBSERVAÇÕES DO CLIENTE:\n${pedido.observacoes_pedido}` : ""}${alertaEstoque}
    `)
  }

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log("[v0] Já inicializado, ignorando...")
      return
    }

    console.log("[v0] Inicializando controle...")
    isInitializedRef.current = true

    // Carregar dados imediatamente
    carregarDadosCompletos()

    // Configurar polling controlado a cada 30 segundos
    pollingIntervalRef.current = setInterval(() => {
      if (!isLoading) {
        console.log("[v0] Polling...")
        carregarDadosCompletos()
      }
    }, 30000)

    // Listener para novos pedidos do localStorage
    const handlePedidoAdicionado = () => {
      console.log("[v0] Novo pedido recebido")
      if (!isLoading) {
        carregarDadosCompletos()
      }
    }

    window.addEventListener("pedidoAdicionado", handlePedidoAdicionado)

    return () => {
      console.log("[v0] Limpando recursos...")
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      window.removeEventListener("pedidoAdicionado", handlePedidoAdicionado)
      setIsConnected(false)
      isInitializedRef.current = false
    }
  }, []) // Dependências vazias para executar apenas uma vez

  useEffect(() => {
    if (showHistorico) {
      carregarHistoricoComFiltros()
    }
  }, [filtroHistorico, showHistorico])

  const getCorTempo = (dataHora: string) => {
    const agora = new Date().getTime()
    const pedidoTime = new Date(dataHora).getTime()
    const minutosPassados = (agora - pedidoTime) / (1000 * 60)

    if (minutosPassados >= 20) return "border-l-red-500 bg-red-50"
    if (minutosPassados >= 10) return "border-l-orange-500 bg-orange-50"
    if (minutosPassados >= 5) return "border-l-yellow-500 bg-yellow-50"
    return "border-l-gray-300 bg-white"
  }

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    console.log("[v0] Atualizando status:", pedidoId.substring(0, 8), "->", novoStatus)

    // Atualizar estado local imediatamente
    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus as any } : p)))

    // Atualizar no banco
    const sucesso = await atualizarStatusNoBanco(pedidoId, novoStatus)

    if (!sucesso) {
      // Reverter mudança local se falhou no banco
      setTimeout(() => {
        if (!isLoading) {
          carregarDadosCompletos()
        }
      }, 1000)
      alert("Erro ao atualizar status. Tente novamente.")
      return
    }

    if (novoStatus === "concluido") {
      console.log("[v0] Pedido concluído:", pedidoId.substring(0, 8))

      // Remover da lista ativa após 2 minutos
      setTimeout(
        () => {
          setPedidos((prev) => prev.filter((p) => p.id !== pedidoId))
          if (!isLoading) {
            carregarDadosCompletos()
          }
        },
        2 * 60 * 1000,
      )
    }
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroStatus === "todos") return true
    return pedido.status === filtroStatus
  })

  const getTempoDecorrido = (dataHora: string) => {
    if (!dataHora) return "Agora"

    const agora = new Date().getTime()
    const pedidoTime = new Date(dataHora).getTime()

    if (isNaN(pedidoTime)) return "Agora"

    const minutosPassados = Math.floor((agora - pedidoTime) / (1000 * 60))

    if (minutosPassados < 1) return "Agora"
    if (minutosPassados === 1) return "1 minuto"
    return `${minutosPassados} minutos`
  }

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (config && config.icon) {
      const IconComponent = config.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <AlertCircle className="h-4 w-4" />
  }

  const getInsumosComEstoqueBaixoIngredientesBase = (limite = 10) => {
    if (!insumos || !ingredientesBase) return []

    return insumos
      .map((insumo) => {
        if (!insumo.ingredienteBaseId) return null

        const estoqueAtualIngredienteBase = getEstoqueAtualIngrediente(insumo.ingredienteBaseId)
        const estoqueDisponivelInsumo = estoqueAtualIngredienteBase / insumo.quantidade

        return {
          insumo,
          quantidadeAtual: estoqueDisponivelInsumo,
        }
      })
      .filter(
        (item): item is { insumo: any; quantidadeAtual: number } => item !== null && item.quantidadeAtual < limite,
      )
  }

  const insumosEstoqueBaixo = getInsumosComEstoqueBaixoIngredientesBase(10)
  const pedidosComProblemasEstoque = pedidos.filter((pedido) => verificarDisponibilidadeEstoque(pedido).length > 0)

  return (
    <div className="space-y-4">
      {insumosEstoqueBaixo.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Estoque Baixo - Pode Afetar a Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-3">
              {insumosEstoqueBaixo.length} insumo(s) com estoque baixo podem impactar{" "}
              {pedidosComProblemasEstoque.length} pedido(s):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-orange-700 mb-2">Insumos em Falta:</h4>
                <div className="flex flex-wrap gap-2">
                  {insumosEstoqueBaixo.slice(0, 8).map(({ insumo, quantidadeAtual }) => (
                    <Badge key={insumo.id} variant="secondary" className="bg-orange-100 text-orange-700">
                      {insumo.nome}: {quantidadeAtual.toFixed(1)} {insumo.unidade}
                    </Badge>
                  ))}
                  {insumosEstoqueBaixo.length > 8 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      +{insumosEstoqueBaixo.length - 8} mais
                    </Badge>
                  )}
                </div>
              </div>
              {pedidosComProblemasEstoque.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-700 mb-2">Pedidos Afetados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {pedidosComProblemasEstoque.slice(0, 5).map((pedido) => (
                      <Badge key={pedido.id} variant="destructive" className="bg-red-100 text-red-700">
                        #{pedido.numero_pedido}
                      </Badge>
                    ))}
                    {pedidosComProblemasEstoque.length > 5 && (
                      <Badge variant="destructive" className="bg-red-100 text-red-700">
                        +{pedidosComProblemasEstoque.length - 5} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="producao" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Controle de Produção</h1>
            <p className="text-muted-foreground text-sm">Gerencie todos os pedidos em tempo real</p>
          </div>

          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="producao" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produção
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="flex items-center gap-2"
              onClick={() => {
                setShowHistorico(true)
                setTimeout(carregarHistoricoComFiltros, 100)
              }}
            >
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="producao" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={audioAtivado ? "default" : "outline"}
                onClick={ativarAudio}
                className="text-xs"
              >
                {audioAtivado ? (
                  <>
                    <Volume2 className="h-3 w-3 mr-1" />
                    Som Ativo
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3 mr-1" />
                    Ativar Som
                  </>
                )}
              </Button>

              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "Sistema ativo" : "Reconectando..."}
                </span>
              </div>

              {audioAtivado && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Notificações ativas</span>
                </div>
              )}
              {pedidosComProblemasEstoque.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600">
                    {pedidosComProblemasEstoque.length} pedidos com problemas de estoque
                  </span>
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600">Carregando...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                  <SelectItem value="saiu_entrega">Saiu para Entrega</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground font-medium">{pedidosFiltrados.length} pedidos ativos</div>
            </div>
          </div>

          {/* Legenda de tempo mantida */}
          <Card className="bg-slate-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium text-slate-700">Legenda de Tempo:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>{"< 5min"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>5-10min</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>10-20min</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>{">20min"}</span>
                </div>
                <div className="flex items-center gap-2 ml-4 border-l pl-4">
                  <Package2 className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Problema de Estoque</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosFiltrados.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Nenhum pedido encontrado</h3>
                      <p className="text-muted-foreground text-sm">
                        {filtroStatus === "todos"
                          ? "Não há pedidos ativos no momento"
                          : `Não há pedidos com status "${
                              statusConfig[filtroStatus as keyof typeof statusConfig]?.label || filtroStatus
                            }"`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              pedidosFiltrados.map((pedido) => {
                const corTempo = getCorTempo(pedido.created_at)
                const statusIcon = getStatusIcon(pedido.status)
                const problemasEstoque = verificarDisponibilidadeEstoque(pedido)
                const temProblemaEstoque = problemasEstoque.length > 0

                return (
                  <Card
                    key={pedido.id}
                    className={`border-l-4 ${corTempo} h-fit ${temProblemaEstoque ? "ring-2 ring-red-200" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {statusIcon}
                          <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              #{pedido.numero_pedido}
                              {temProblemaEstoque && (
                                <Package2 className="h-4 w-4 text-red-600" title="Problema de estoque detectado" />
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTempoDecorrido(pedido.created_at)}
                              </span>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {pedido.origem || "menu"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Badge className={`${statusConfig[pedido.status]?.color || "bg-gray-500"} text-xs px-2 py-1`}>
                          {statusConfig[pedido.status]?.label || pedido.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {temProblemaEstoque && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span className="text-xs font-medium text-red-700">Estoque Insuficiente</span>
                          </div>
                          <div className="text-xs text-red-600 space-y-1">
                            {problemasEstoque.slice(0, 2).map((problema, idx) => (
                              <div key={idx}>
                                <span className="font-medium">{problema.item}:</span>
                                {problema.faltante.slice(0, 1).map((f, fidx) => (
                                  <div key={fidx} className="ml-2">
                                    {f.insumo}: precisa {f.necessario.toFixed(1)}, tem {f.disponivel.toFixed(1)}
                                  </div>
                                ))}
                              </div>
                            ))}
                            {problemasEstoque.length > 2 && (
                              <div className="text-xs text-red-500">
                                +{problemasEstoque.length - 2} itens com problema
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{pedido.cliente_nome}</span>
                        </div>

                        {pedido.cliente_telefone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{pedido.cliente_telefone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-xs">{pedido.cliente_endereco}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="capitalize">
                            {pedido.forma_pagamento === "pagamento-na-entrega"
                              ? "Pag. na Entrega"
                              : pedido.forma_pagamento
                                  .replace(/-/g, " ")
                                  .replace("cartao", "cartão")
                                  .replace("debito", "débito")
                                  .replace("credito", "crédito")
                                  .replace("mercadopago", "Mercado Pago")
                                  .replace("pix", "PIX")}
                          </span>
                        </div>
                      </div>

                      {/* Itens do pedido mantidos */}
                      <div>
                        <h4 className="font-medium mb-1 text-sm">Itens:</h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {pedido.itens.map((item, index) => {
                            const produto = produtos?.find((p) => p.nome === item.nome)

                            return (
                              <div key={index} className="border-l-2 border-gray-200 pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                  {produto?.imagem && (
                                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                      <img
                                        src={
                                          produto.imagem.startsWith("data:") && produto.imagem.length > 1000
                                            ? `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(produto.nome)}`
                                            : produto.imagem
                                        }
                                        alt={produto.nome}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.src = `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(produto.nome)}`
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="font-medium">
                                    {item.quantidade} UN {item.nome.toUpperCase()}
                                  </div>
                                </div>

                                {item.personalizacoes && (
                                  <div className="ml-2 mt-1 space-y-0.5">
                                    {item.personalizacoes.removidos && item.personalizacoes.removidos.length > 0 && (
                                      <div className="text-red-600 text-xs">
                                        <span className="font-medium">Retirar:</span>{" "}
                                        {item.personalizacoes.removidos.join(", ")}
                                      </div>
                                    )}
                                    {item.personalizacoes.adicionados &&
                                      item.personalizacoes.adicionados.length > 0 && (
                                        <div className="text-green-600 text-xs">
                                          <span className="font-medium">Adicionar:</span>{" "}
                                          {item.personalizacoes.adicionados.join(", ")}
                                        </div>
                                      )}
                                  </div>
                                )}

                                {item.observacoes && item.observacoes.trim() && (
                                  <div className="text-blue-600 text-xs ml-2 mt-0.5">
                                    <span className="font-medium">Comentário:</span> {item.observacoes.trim()}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Observações do pedido */}
                      {pedido.observacoes_pedido && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                          <span className="font-medium text-blue-700">Observações do Cliente:</span>{" "}
                          <span className="text-blue-600">{pedido.observacoes_pedido}</span>
                        </div>
                      )}

                      {/* Botões de ação mantidos */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => visualizarPedido(pedido)}
                            className="flex-1 text-xs h-7"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => imprimirPedido(pedido)}
                            className="flex-1 text-xs h-7"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Imprimir
                          </Button>
                        </div>

                        <Select value={pedido.status} onValueChange={(value) => atualizarStatus(pedido.id, value)}>
                          <SelectTrigger className="w-full h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="preparando">Preparando</SelectItem>
                            <SelectItem value="pronto">Pronto</SelectItem>
                            <SelectItem value="saiu_entrega">Saiu para Entrega</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {pedidosConcluidos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pedidos Concluídos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {pedidosConcluidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between py-1 border-b last:border-b-0 text-sm"
                    >
                      <div>
                        <span className="font-medium">#{pedido.numero_pedido}</span>
                        <span className="text-muted-foreground ml-2">{pedido.cliente_nome}</span>
                      </div>
                      <Badge className="bg-emerald-700 text-white text-xs">Concluído</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros do histórico */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select
                    value={filtroHistorico.periodo}
                    onValueChange={(value) => setFiltroHistorico((prev) => ({ ...prev, periodo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Última Semana</SelectItem>
                      <SelectItem value="mes">Último Mês</SelectItem>
                      <SelectItem value="personalizado">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filtroHistorico.periodo === "personalizado" && (
                  <>
                    <div>
                      <Label htmlFor="dataInicio">Data Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={filtroHistorico.dataInicio}
                        onChange={(e) => setFiltroHistorico((prev) => ({ ...prev, dataInicio: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataFim">Data Fim</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={filtroHistorico.dataFim}
                        onChange={(e) => setFiltroHistorico((prev) => ({ ...prev, dataFim: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="statusHistorico">Status</Label>
                  <Select
                    value={filtroHistorico.status}
                    onValueChange={(value) => setFiltroHistorico((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="preparando">Preparando</SelectItem>
                      <SelectItem value="pronto">Pronto</SelectItem>
                      <SelectItem value="saiu_entrega">Saiu para Entrega</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{pedidosHistorico.length} pedidos encontrados</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPedidosHistorico([])
                    setTimeout(carregarHistoricoComFiltros, 100)
                  }}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Filter className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de pedidos do histórico */}
          <div className="space-y-2">
            {pedidosHistorico.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Nenhum pedido encontrado</h3>
                    <p className="text-muted-foreground text-sm">
                      Não há pedidos para o período e filtros selecionados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pedidosHistorico.map((pedido) => (
                <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{pedido.numero_pedido}</span>
                            <Badge className={`${statusConfig[pedido.status]?.color || "bg-gray-500"} text-xs`}>
                              {statusConfig[pedido.status]?.label || pedido.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {pedido.origem || "menu"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {pedido.cliente_nome} • {new Date(pedido.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-semibold">
                            {pedido.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => visualizarPedido(pedido)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => imprimirPedido(pedido)}
                            className="h-8 w-8 p-0"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setPedidoParaExcluir(pedido)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!pedidoParaExcluir} onOpenChange={() => setPedidoParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o pedido #{pedidoParaExcluir?.numero_pedido}? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPedidoParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => pedidoParaExcluir && excluirPedido(pedidoParaExcluir.id)}>
              Excluir Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
