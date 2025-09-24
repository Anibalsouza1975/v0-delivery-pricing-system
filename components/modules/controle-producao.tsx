"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { useDatabasePricing } from "@/components/database-pricing-context"

interface Pedido {
  id: string
  cliente:
    | string
    | {
        nome: string
        telefone: string
        endereco: string
        complemento?: string
        observacoes?: string
        formaPagamento: string
      }
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
  total: number
  frete: number
  status: "pendente" | "preparando" | "pronto" | "saiu_entrega" | "entregue" | "concluido"
  dataHora: string
  origem: "menu" | "vendas"
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
  const { produtos, insumos, ingredientesBase, getEstoqueAtualIngrediente, abaterEstoquePorVenda } =
    useDatabasePricing()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidosConcluidos, setPedidosConcluidos] = useState<Pedido[]>([])
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [audioAtivado, setAudioAtivado] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const pedidosCountRef = useRef<number>(0)

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

  const extrairDadosCliente = (cliente: string | object, pedido?: any) => {
    console.log("[v0] Extraindo dados do cliente:", typeof cliente, cliente)
    console.log("[v0] Dados do pedido para extração:", pedido)

    if (typeof cliente === "string") {
      console.log("[v0] Cliente é string, usando dados padrão")
      return {
        nome: cliente,
        telefone: "",
        endereco: "Retirada no Balcão",
        formaPagamento: pedido?.formaPagamento || "dinheiro",
        observacoes: "",
      }
    }

    const clienteObj = cliente as any
    const formaPagamento = pedido?.formaPagamento || clienteObj?.formaPagamento || "não informado"
    console.log("[v0] Forma de pagamento encontrada no pedido:", pedido?.formaPagamento)
    console.log("[v0] Forma de pagamento encontrada no cliente:", clienteObj?.formaPagamento)
    console.log("[v0] Forma de pagamento final:", formaPagamento)

    const dadosExtraidos = {
      nome: clienteObj?.nome || "Cliente",
      telefone: clienteObj?.telefone || "",
      endereco: clienteObj?.endereco || "Endereço não informado",
      formaPagamento: formaPagamento,
      observacoes: clienteObj?.observacoes || "",
    }

    console.log("[v0] Dados cliente extraídos:", dadosExtraidos)
    return dadosExtraidos
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
    const dadosCliente = extrairDadosCliente(pedido.cliente, pedido)
    console.log("[v0] Imprimindo pedido - forma de pagamento:", dadosCliente.formaPagamento)

    const itensFormatados = pedido.itens
      .map((item, index) => {
        const itemCompleto = item as any
        const personalizacoes = itemCompleto.personalizacoes
        const observacoes = itemCompleto.observacoes

        const precoBase = item.preco || 0

        let valorAdicionais = 0
        if (personalizacoes?.adicionados) {
          personalizacoes.adicionados.forEach((adicionalNome: string) => {
            const adicional = insumos?.find((i) => i.nome === adicionalNome)
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
        itemCompleto.personalizacoes.adicionados.forEach((adicionalNome: string) => {
          const adicional = insumos?.find((i) => i.nome === adicionalNome)
          if (adicional && adicional.preco) {
            valorAdicionais += adicional.preco
          }
        })
      }

      return acc + (precoBase + valorAdicionais) * item.quantidade
    }, 0)

    const totalFormatado = `${"TOTAL:".padEnd(32)}${subtotal.toFixed(2).padStart(8)}`
    const entregaFormatado = pedido.frete > 0 ? `${"+ ENTREGA:".padEnd(32)}${pedido.frete.toFixed(2).padStart(8)}` : ""
    const totalGeralFormatado =
      pedido.frete > 0 ? `${"= TOTAL A PAGAR:".padEnd(32)}${(subtotal + pedido.frete).toFixed(2).padStart(8)}` : ""

    const statusPagamento =
      dadosCliente.formaPagamento === "pagamento-na-entrega" ? "*** A PAGAR NA ENTREGA ***" : "*** PEDIDO JÁ PAGO ***"

    console.log("[v0] Status pagamento calculado:", statusPagamento, "baseado em:", dadosCliente.formaPagamento)

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
    
    ${dadosCliente.nome.toUpperCase()}
    ${dadosCliente.telefone ? `(${dadosCliente.telefone.replace(/(\d{2})(\d{5})(\d{4})/, "$1) $2-$3")})` : ""}
    ${dadosCliente.endereco}
    
    ----------------------------------------
    
    (Pedido N.: ${pedido.id})
    
    ITEM (V.Unit)                    Total
    ${itensFormatados}
    
    ----------------------------------------
    ${totalFormatado}
    ${entregaFormatado}
    ${totalGeralFormatado}
    
    ----------------------------------------
    FORMA DE PAGAMENTO: ${dadosCliente.formaPagamento.toUpperCase().replace(/-/g, " ")}
    
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
            <title>Pedido #${pedido.id}</title>
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
    const dadosCliente = extrairDadosCliente(pedido.cliente, pedido)
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
**** PEDIDO #${pedido.id} ****

Cliente: ${dadosCliente.nome.toUpperCase()}
${dadosCliente.telefone ? `Telefone: ${dadosCliente.telefone}` : ""}
Endereço: ${dadosCliente.endereco}
Pagamento: ${
      dadosCliente.formaPagamento === "pagamento-na-entrega"
        ? "Pag. na Entrega"
        : dadosCliente.formaPagamento
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
${pedido.frete > 0 ? `Taxa de entrega: R$ ${pedido.frete.toFixed(2)}` : ""}

Status: ${statusConfig[pedido.status]?.label || pedido.status}
Tempo: ${getTempoDecorrido(pedido.dataHora)}

${
  dadosCliente.observacoes || (pedido as any).observacoes
    ? `OBSERVAÇÕES DO CLIENTE:\n${dadosCliente.observacoes || (pedido as any).observacoes}`
    : ""
}${alertaEstoque}
    `)
  }

  useEffect(() => {
    const carregarPedidos = () => {
      const pedidosControleProducao = JSON.parse(localStorage.getItem("delivery-pricing-controle-producao") || "[]")
      const pedidosVendas = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")

      console.log("[v0] Carregando pedidos do controle de produção:", pedidosControleProducao.length)
      console.log("[v0] Carregando pedidos de vendas:", pedidosVendas.length)

      const pedidosFormatados = [
        ...pedidosControleProducao.map((p: any) => ({
          ...p,
          origem: "menu" as const,
          status: p.status || "pendente",
          dataHora: p.data || p.dataHora || new Date().toISOString(),
        })),
        ...pedidosVendas
          .filter((v: any) => !pedidosControleProducao.some((p: any) => p.id === v.id)) // Remove duplicatas
          .map((v: any) => ({
            id: v.id,
            cliente: v.cliente || "Cliente Balcão",
            itens: v.itens || [],
            total: v.total || 0,
            frete: 0,
            status: v.status || "pendente",
            dataHora: v.data || v.dataHora || new Date().toISOString(),
            origem: "vendas" as const,
          })),
      ]

      const ativos = pedidosFormatados.filter((p) => p.status !== "concluido")
      const concluidos = pedidosFormatados.filter((p) => p.status === "concluido")

      ativos.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())

      const novosAtivos = ativos.filter((p) => p.status === "pendente")
      if (pedidosCountRef.current > 0 && novosAtivos.length > pedidosCountRef.current && audioAtivado) {
        tocarSomNotificacao()
      }
      pedidosCountRef.current = novosAtivos.length

      console.log("[v0] Pedidos ativos carregados:", ativos.length)
      console.log("[v0] Pedidos concluídos carregados:", concluidos.length)

      setPedidos(ativos)
      setPedidosConcluidos(concluidos)
    }

    carregarPedidos()
    const interval = setInterval(carregarPedidos, 15000)

    const handlePedidoAdicionado = () => {
      console.log("[v0] Evento de pedido adicionado recebido, recarregando...")
      setTimeout(carregarPedidos, 500)
    }

    window.addEventListener("pedidoAdicionado", handlePedidoAdicionado)

    return () => {
      clearInterval(interval)
      window.removeEventListener("pedidoAdicionado", handlePedidoAdicionado)
    }
  }, [])

  const getCorTempo = (dataHora: string) => {
    const agora = new Date().getTime()
    const pedidoTime = new Date(dataHora).getTime()
    const minutosPassados = (agora - pedidoTime) / (1000 * 60)

    if (minutosPassados >= 20) return "border-l-red-500 bg-red-50"
    if (minutosPassados >= 10) return "border-l-orange-500 bg-orange-50"
    if (minutosPassados >= 5) return "border-l-yellow-500 bg-yellow-50"
    return "border-l-gray-300 bg-white"
  }

  const atualizarStatus = (pedidoId: string, novoStatus: string) => {
    console.log("[v0] Atualizando status do pedido:", pedidoId, "para:", novoStatus)

    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus as any } : p)))

    const pedidosControleProducao = JSON.parse(localStorage.getItem("delivery-pricing-controle-producao") || "[]")
    const pedidosVendas = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")

    const pedidoControleIndex = pedidosControleProducao.findIndex((p: any) => p.id === pedidoId)
    if (pedidoControleIndex !== -1) {
      pedidosControleProducao[pedidoControleIndex].status = novoStatus
      localStorage.setItem("delivery-pricing-controle-producao", JSON.stringify(pedidosControleProducao))
      console.log("[v0] Status atualizado no localStorage (controle-producao)")
    }

    const pedidoVendaIndex = pedidosVendas.findIndex((v: any) => v.id === pedidoId)
    if (pedidoVendaIndex !== -1) {
      pedidosVendas[pedidoVendaIndex].status = novoStatus
      localStorage.setItem("delivery-pricing-vendas", JSON.stringify(pedidosVendas))
      console.log("[v0] Status atualizado no localStorage (vendas)")
    }

    if (novoStatus === "concluido") {
      console.log("[v0] Iniciando abatimento de estoque para:", pedidoId)
      if (typeof abaterEstoquePorVenda === "function") {
        abaterEstoquePorVenda(pedidoId)
      } else {
        console.log("[v0] Função abaterEstoquePorVenda não disponível")
      }

      setTimeout(
        () => {
          const pedidoConcluido = pedidos.find((p) => p.id === pedidoId)
          if (pedidoConcluido) {
            setPedidos((prev) => prev.filter((p) => p.id !== pedidoId))
            setPedidosConcluidos((prev) => [...prev, pedidoConcluido])
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
                        #{pedido.id}
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Produção</h1>
          <p className="text-muted-foreground text-sm">Gerencie todos os pedidos em tempo real</p>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" variant={audioAtivado ? "default" : "outline"} onClick={ativarAudio} className="text-xs">
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
          </div>
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
            const corTempo = getCorTempo(pedido.dataHora)
            const statusIcon = getStatusIcon(pedido.status)
            const dadosCliente = extrairDadosCliente(pedido.cliente, pedido)
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
                          #{pedido.id}
                          {temProblemaEstoque && (
                            <Package2 className="h-4 w-4 text-red-600" title="Problema de estoque detectado" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTempoDecorrido(pedido.dataHora)}
                          </span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {pedido.origem}
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
                          <div className="text-xs text-red-500">+{problemasEstoque.length - 2} itens com problema</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{dadosCliente.nome}</span>
                    </div>

                    {dadosCliente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{dadosCliente.telefone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-xs">{dadosCliente.endereco}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="capitalize">
                        {dadosCliente.formaPagamento === "pagamento-na-entrega"
                          ? "Pag. na Entrega"
                          : dadosCliente.formaPagamento
                              .replace(/-/g, " ")
                              .replace("cartao", "cartão")
                              .replace("debito", "débito")
                              .replace("credito", "crédito")
                              .replace("mercadopago", "Mercado Pago")
                              .replace("pix", "PIX")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1 text-sm">Itens:</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {pedido.itens.map((item, index) => {
                        const itemCompleto = item as any
                        const personalizacoes = itemCompleto.personalizacoes
                        const observacoes = itemCompleto.observacoes
                        const produto = produtos?.find((p) => p.nome === item.nome)

                        return (
                          <div key={index} className="text-xs border-l-2 border-gray-200 pl-2">
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

                            {personalizacoes && (
                              <div className="ml-2 mt-1 space-y-0.5">
                                {personalizacoes.removidos && personalizacoes.removidos.length > 0 && (
                                  <div className="text-red-600 text-xs">
                                    <span className="font-medium">Retirar:</span> {personalizacoes.removidos.join(", ")}
                                  </div>
                                )}
                                {personalizacoes.adicionados && personalizacoes.adicionados.length > 0 && (
                                  <div className="text-green-600 text-xs">
                                    <span className="font-medium">Adicionar:</span>{" "}
                                    {personalizacoes.adicionados.join(", ")}
                                  </div>
                                )}
                              </div>
                            )}

                            {observacoes && observacoes.trim() && (
                              <div className="text-blue-600 text-xs ml-2 mt-0.5">
                                <span className="font-medium">Comentário:</span> {observacoes.trim()}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {(dadosCliente.observacoes || (pedido as any).observacoes) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                      <span className="font-medium text-blue-700">Observações do Cliente:</span>{" "}
                      <span className="text-blue-600">{dadosCliente.observacoes || (pedido as any).observacoes}</span>
                    </div>
                  )}

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
              {pedidosConcluidos.slice(-5).map((pedido) => {
                const dadosCliente = extrairDadosCliente(pedido.cliente, pedido)

                return (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between py-1 border-b last:border-b-0 text-sm"
                  >
                    <div>
                      <span className="font-medium">#{pedido.id}</span>
                      <span className="text-muted-foreground ml-2">{dadosCliente.nome}</span>
                    </div>
                    <Badge className="bg-emerald-700 text-white text-xs">Concluído</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
