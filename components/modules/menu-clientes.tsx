"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { usePricing } from "@/components/pricing-context-supabase"
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Phone,
  CreditCard,
  User,
  Home,
  ChefHat,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const categoriasProduto = [
  "Todos",
  "Hambúrgueres",
  "Batatas",
  "Bebidas",
  "Combos",
  "Pizzas",
  "Sanduíches",
  "Saladas",
  "Pratos Executivos",
  "Lanches",
  "Sobremesas",
  "Outros",
]

interface Adicional {
  id: string
  nome: string
  preco: number
  categorias?: string[]
}

interface Personalizacao {
  id: string
  nome: string
  tipo: "remover" | "substituir"
  descricao?: string
  categorias?: string[]
}

interface DadosEmpresa {
  nome: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
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

export default function MenuClientesModule() {
  const { produtos, bebidas, combos, adicionais, personalizacoes } = usePricing()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const [insumos, setInsumos] = useState<any[]>([])
  const [abaterEstoquePorVenda, setAbaterEstoquePorVenda] = useState<any>(null)

  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: "Minha Empresa",
    telefone: "(11) 99999-9999",
    endereco: "Rua Principal, 123",
    cidade: "São Paulo",
    estado: "SP",
    cor_primaria: "#dc2626",
    cor_secundaria: "#f59e0b",
    descricao: "Delivery de comida deliciosa",
    horario_funcionamento: "Segunda a Sábado: 18h às 23h",
  })

  // console.log("[v0] Produtos carregados:", produtos?.length || 0, produtos)
  // console.log("[v0] Combos carregados:", combos)
  // console.log("[v0] Bebidas carregados:", bebidas)

  const allMenuItems = [
    ...(produtos || []).map((item) => ({ ...item, type: "produto" as const })),
    ...(bebidas || []).map((item) => ({ ...item, type: "bebida" as const })),
    ...(combos || []).map((item) => ({ ...item, type: "combo" as const })),
  ]

  const categoriasPromocionais = ["Até 20% off (com desconto)", "Promoção 20% Off (Novidade Temporária)"]

  const getAvailableCategories = () => {
    const baseCategorias = ["Todos"]

    // Sempre adicionar Combos e Bebidas como categorias fixas
    baseCategorias.push("Combos", "Bebidas")

    const categoriasComProdutos = new Set()
    allMenuItems.forEach((item) => {
      if (item.type === "produto" && item.categoria) {
        categoriasComProdutos.add(item.categoria)
      }
    })

    Array.from(categoriasComProdutos).forEach((categoria) => {
      if (!baseCategorias.includes(categoria) && !categoriasPromocionais.includes(categoria)) {
        baseCategorias.push(categoria)
      }
    })

    console.log("[v0] Categorias:", baseCategorias.length)
    return baseCategorias
  }

  const categoriasDisponiveis = getAvailableCategories()

  const [cart, setCart] = useState<
    Record<string, { quantity: number; customizations?: { removed: string[]; added: string[] }; comments?: string }>
  >({})
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [addedIngredients, setAddedIngredients] = useState<string[]>([])
  const [selectedPersonalizacoes, setSelectedPersonalizacoes] = useState<string[]>([])
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalComments, setModalComments] = useState("")
  const [lojaAberta, setLojaAberta] = useState(true)
  const [customerData, setCustomerData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    complemento: "",
    observacoes: "",
    formaPagamento: "",
  })

  const highlightsRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [configuracaoFrete, setConfiguracaoFrete] = useState({
    freteGratis: false,
    valorFrete: 5.0,
    valorMinimoFreteGratis: 30.0,
  })

  useEffect(() => {
    const carregarDadosEmpresa = async () => {
      try {
        const response = await fetch("/api/empresa/dados-publicos")
        if (response.ok) {
          const dados = await response.json()
          setDadosEmpresa(dados)
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar dados da empresa:", error)
      }
    }

    carregarDadosEmpresa()
  }, [])

  useEffect(() => {
    const carregarConfiguracaoFrete = () => {
      const freteConfig = localStorage.getItem("delivery-pricing-frete-config")
      if (freteConfig) {
        setConfiguracaoFrete(JSON.parse(freteConfig))
      }
    }

    carregarConfiguracaoFrete()

    const handleFreteAtualizado = (event: CustomEvent) => {
      setConfiguracaoFrete(event.detail)
    }

    window.addEventListener("freteConfiguracaoAtualizada", handleFreteAtualizado as EventListener)

    return () => {
      window.removeEventListener("freteConfiguracaoAtualizada", handleFreteAtualizado as EventListener)
    }
  }, [])

  const calcularFrete = (subtotal: number) => {
    if (configuracaoFrete.freteGratis) {
      return 0
    }

    if (configuracaoFrete.valorMinimoFreteGratis > 0 && subtotal >= configuracaoFrete.valorMinimoFreteGratis) {
      return 0
    }

    return configuracaoFrete.valorFrete
  }

  const getTextoFrete = () => {
    if (configuracaoFrete.freteGratis) {
      return "Grátis"
    }

    if (configuracaoFrete.valorMinimoFreteGratis > 0) {
      return `R$ ${configuracaoFrete.valorFrete.toFixed(2)} • Grátis acima de R$ ${configuracaoFrete.valorMinimoFreteGratis.toFixed(2)}`
    }

    return `R$ ${configuracaoFrete.valorFrete.toFixed(2)}`
  }

  // const [adicionais] = useState<Adicional[]>(() => {
  //   const saved = localStorage.getItem("adicionais")
  //   return saved ? JSON.parse(saved) : []
  // })

  // const [personalizacoes] = useState<Personalizacao[]>(() => {
  //   const saved = localStorage.getItem("personalizacoes")

  const [showClosedModal, setShowClosedModal] = useState(false)

  useEffect(() => {
    const checkLojaStatus = () => {
      const status = localStorage.getItem("lojaAberta")
      setLojaAberta(status ? JSON.parse(status) : true)
    }

    checkLojaStatus()
    // Verificar a cada 5 segundos se o status mudou
    const interval = setInterval(checkLojaStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const scrollToCategory = (category: string) => {
    setSelectedCategory(category)
    if (category === "Todos") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      const element = categoryRefs.current[category]
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  const scrollHighlights = (direction: "left" | "right") => {
    if (highlightsRef.current) {
      const scrollAmount = 300
      const newScrollLeft = highlightsRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount)
      highlightsRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" })
    }
  }

  const getProductIngredients = (produto: any) => {
    // console.log("[v0] Obtendo ingredientes do produto:", produto.nome, produto.insumos)
    if (!produto.insumos) return []

    return produto.insumos
      .map((insumoItem: any) => {
        const insumo = insumos.find((i) => i.id === insumoItem.insumoId)
        return insumo ? insumo.nome : null
      })
      .filter(Boolean)
  }

  const getCartKey = (itemId: string, customizations?: { removed: string[]; added: string[] }, comments?: string) => {
    const customKey = customizations
      ? `${customizations.removed.sort().join(",")}-${customizations.added.sort().join(",")}`
      : ""
    const commentKey = comments || ""
    return `${itemId}-${customKey}-${commentKey}`
  }

  const addToCart = (itemId: string, customizations?: { removed: string[]; added: string[] }, comments?: string) => {
    console.log("[v0] Item adicionado:", itemId.split("-")[0])
    const cartKey = getCartKey(itemId, customizations, comments)

    setCart((prev) => {
      const existing = prev[cartKey] || { quantity: 0, customizations: { removed: [], added: [] }, comments: "" }
      return {
        ...prev,
        [cartKey]: {
          quantity: existing.quantity + 1,
          customizations: customizations || existing.customizations || { removed: [], added: [] },
          comments: comments || existing.comments || "",
          originalItemId: itemId, // Mantendo referência ao item original
        },
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    console.log("[v0] Item removido:", itemId.split("-")[0])
    setCart((prev) => {
      const newCart = { ...prev }
      if (newCart[itemId] && newCart[itemId].quantity > 1) {
        newCart[itemId].quantity--
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [cartKey, cartItem]) => {
      const itemId = cartItem.originalItemId || cartKey.split("-")[0]
      const item = allMenuItems.find((i) => `${i.type}-${i.id}` === itemId)

      if (item) {
        let itemTotal = getItemPrice(item) * cartItem.quantity

        if (cartItem.customizations?.added) {
          cartItem.customizations.added.forEach((adicionadoNome) => {
            const adicional = (adicionais || []).find((a) => a.nome === adicionadoNome)
            if (adicional) {
              const adicionalTotal = adicional.preco * cartItem.quantity
              itemTotal += adicionalTotal
            }
          })
        }

        total += itemTotal
      }

      return total
    }, 0)
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, cartItem) => total + cartItem.quantity, 0)
  }

  const handleProductClick = (item: any) => {
    if (!lojaAberta) {
      setShowClosedModal(true)
      return
    }

    // console.log("[v0] Abrindo modal de customização")
    setSelectedItem(item)
    setIsCustomizeOpen(true)
    setModalQuantity(1)
    setModalComments("")
    setRemovedIngredients([])
    setAddedIngredients([])
    setSelectedPersonalizacoes([])
  }

  const openCustomizeModal = (item: any) => {
    if (!lojaAberta) {
      setShowClosedModal(true)
      return
    }

    handleProductClick(item)
  }

  const getModalItemPrice = () => {
    if (!selectedItem) return 0

    const basePrice = getItemPrice(selectedItem)
    let additionalsPrice = 0

    addedIngredients.forEach((adicionadoNome) => {
      const adicional = (adicionais || []).find((a) => a.nome === adicionadoNome)
      if (adicional) {
        additionalsPrice += adicional.preco
      }
    })

    return (basePrice + additionalsPrice) * modalQuantity
  }

  const confirmCustomization = () => {
    console.log("[v0] Customização confirmada:", selectedItem?.nome)

    if (selectedItem) {
      const itemKey = getItemKey(selectedItem)
      for (let i = 0; i < modalQuantity; i++) {
        addToCart(
          itemKey,
          {
            removed: [...removedIngredients, ...selectedPersonalizacoes],
            added: addedIngredients,
          },
          modalComments.trim(),
        )
      }
      setIsCustomizeOpen(false)
      setSelectedItem(null)
      setRemovedIngredients([])
      setAddedIngredients([])
      setSelectedPersonalizacoes([])
      setModalQuantity(1)
      setModalComments("")
    }
  }

  const getItemsByCategory = (category: string) => {
    return allMenuItems.filter((item) => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase())
      let matchesCategory = false

      if (category === "Todos") {
        matchesCategory = true
      } else if (category === "Hambúrgueres") {
        matchesCategory = item.type === "produto" && item.categoria === "Hambúrgueres"
      } else if (category === "Batatas") {
        matchesCategory =
          item.type === "produto" &&
          (item.categoria === "Batatas" ||
            item.nome.toLowerCase().includes("batata") ||
            item.nome.toLowerCase().includes("fritas"))
      } else if (category === "Bebidas") {
        matchesCategory =
          item.type === "bebida" ||
          (item.type === "produto" &&
            (item.nome.toLowerCase().includes("coca") ||
              item.nome.toLowerCase().includes("refrigerante") ||
              item.nome.toLowerCase().includes("suco")))
      } else if (category === "Combos") {
        matchesCategory = item.type === "combo"
      } else {
        matchesCategory = item.type === "produto" && item.categoria === category
      }

      return matchesSearch && matchesCategory
    })
  }

  const getHighlightItems = () => {
    return allMenuItems.sort((a, b) => getItemPrice(b) - getItemPrice(a)).slice(0, 6)
  }

  const getPromotionItems = () => {
    return allMenuItems
      .filter((item) => item.type === "produto" && item.categoria === "Até 20% off (com desconto)")
      .slice(0, 8) // Aumentando para 8 produtos
  }

  const getTemporaryPromotionItems = () => {
    return allMenuItems
      .filter((item) => item.type === "produto" && item.categoria === "Promoção 20% Off (Novidade Temporária)")
      .slice(0, 6) // Até 6 produtos
  }

  const getItemPrice = (item: any) => {
    if (item.type === "produto") {
      // Tentar diferentes campos de preço para produtos
      return item.precoVenda || item.preco_venda || item.precoIfood || item.preco_ifood || 0
    }
    if (item.type === "bebida") {
      // Tentar diferentes campos de preço para bebidas
      return item.preco_venda || item.precoVenda || item.precoIfood || item.preco_ifood || 0
    }
    if (item.type === "combo") {
      // Para combos, usar precoFinal ou preco_final
      return item.precoFinal || item.preco_final || 0
    }
    return 0
  }

  const getItemImage = (item: any) => {
    let imageField = null

    if (item.type === "bebida") {
      // Para bebidas, usar imagemUrl ou imagem_url
      imageField = item.imagemUrl || item.imagem_url
    } else {
      // Para produtos e combos, usar foto
      imageField = item.foto
    }

    if (imageField && typeof imageField === "string") {
      if (imageField.startsWith("http://") || imageField.startsWith("https://")) {
        return imageField
      }
      if (imageField.startsWith("data:image/")) {
        return imageField
      }
    }

    const placeholderUrl = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.nome + " delicious food premium")}`
    return placeholderUrl
  }

  const getItemKey = (item: any) => `${item.type}-${item.id}`

  const finalizarPedido = async () => {
    const itensFormatados = Object.entries(cart).map(([cartKey, cartItem]) => {
      // Melhor lógica para encontrar o item original
      let itemId = cartItem.originalItemId
      if (!itemId) {
        // Fallback: extrair ID do carrinho
        const parts = cartKey.split("-")
        if (parts.length >= 2) {
          itemId = `${parts[0]}-${parts[1]}`
        } else {
          itemId = cartKey
        }
      }

      const item = allMenuItems.find((i) => `${i.type}-${i.id}` === itemId)

      if (!item) {
        console.error("[v0] Item não encontrado:", itemId.split("-")[0])
        // Retornar um item padrão para não quebrar o pedido
        return {
          id: itemId,
          nome: "Item não encontrado",
          preco: 0,
          quantidade: cartItem.quantity,
          tipo: "produto",
          observacoes: cartItem.comments || "",
          personalizacoes: {
            removidos: cartItem.customizations?.removed || [],
            adicionados: cartItem.customizations?.added || [],
          },
        }
      }

      let precoItem = getItemPrice(item)

      // Adicionar preço dos adicionais
      if (cartItem.customizations?.added) {
        cartItem.customizations.added.forEach((adicionadoNome) => {
          const adicional = (adicionais || []).find((a) => a.nome === adicionadoNome)
          if (adicional) {
            precoItem += adicional.preco
          }
        })
      }

      const itemFormatado = {
        id: item.id,
        nome: item.nome,
        preco: precoItem,
        quantidade: cartItem.quantity,
        tipo: item.type,
        observacoes: cartItem.comments || "",
        personalizacoes: {
          removidos: cartItem.customizations?.removed || [],
          adicionados: cartItem.customizations?.added || [],
        },
      }

      console.log("[v0] Item formatado:", item.nome, "x" + cartItem.quantity)
      return itemFormatado
    })

    console.log("[v0] Iniciando finalização do pedido")
    console.log("[v0] Forma de pagamento:", customerData.formaPagamento)
    console.log("[v0] Itens:", itensFormatados.length)

    // Validação dos dados obrigatórios
    if (!customerData.nome?.trim()) {
      alert("Por favor, preencha o nome completo!")
      return
    }
    if (!customerData.telefone?.trim()) {
      alert("Por favor, preencha o telefone!")
      return
    }
    if (!customerData.endereco?.trim()) {
      alert("Por favor, preencha o endereço!")
      return
    }
    if (!customerData.formaPagamento) {
      alert("Por favor, selecione a forma de pagamento!")
      return
    }

    const pedidoId = `PED${Date.now()}`
    console.log("[v0] ID do pedido:", pedidoId)

    try {
      const subtotal = getCartTotal()
      const frete = calcularFrete(subtotal)

      const pedido = {
        id: pedidoId,
        cliente: {
          nome: customerData.nome.trim(),
          telefone: customerData.telefone.trim(),
          email: "",
          endereco: customerData.endereco.trim(),
          complemento: customerData.complemento?.trim() || "",
          bairro: "Centro",
          cep: "00000-000",
        },
        itens: itensFormatados,
        subtotal: subtotal,
        frete: frete,
        total: subtotal + frete,
        formaPagamento: customerData.formaPagamento,
        observacoes: customerData.observacoes?.trim() || "",
        status: "pendente" as const,
        data: new Date().toISOString(),
        tempoEstimado: 35,
      }

      console.log("[v0] Pedido criado:", pedidoId, "Total:", subtotal + frete)

      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedido),
      })

      console.log("[v0] Status da resposta:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Erro na API:", errorText.substring(0, 100))

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: "Erro desconhecido", details: errorText }
        }

        console.error("[v0] Erro parsed:", errorData.error)
        throw new Error(`Erro ao salvar pedido: ${errorData.details || errorData.error || "Erro desconhecido"}`)
      }

      const pedidoSalvo = await response.json()
      console.log("[v0] Pedido salvo:", pedidoSalvo.id)

      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent("pedidoAdicionado", { detail: pedido }))

      // Salvar no sistema de pricing (opcional)
      const produtosParaBaixar = itensFormatados.filter((item) => item.tipo === "produto")
      if (produtosParaBaixar.length > 0) {
        const vendaParaSistema = {
          id: pedidoId,
          data: new Date().toISOString(),
          total: subtotal + frete,
          status: "concluido" as const,
          produtos: produtosParaBaixar.map((item) => ({
            produtoId: item.id,
            quantidade: item.quantidade,
            nome: item.nome,
            preco: item.preco,
          })),
          cliente: customerData.nome.trim(),
          observacoes: customerData.observacoes?.trim() || "",
        }

        console.log("[v0] Venda para sistema:", pedidoId)

        try {
          const vendasExistentes = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")
          vendasExistentes.unshift(vendaParaSistema)
          localStorage.setItem("delivery-pricing-vendas", JSON.stringify(vendasExistentes))
          console.log("[v0] Venda salva no sistema")
        } catch (error) {
          console.error("[v0] Erro ao salvar venda (não-crítico):", error)
        }
      }

      // Limpar dados após sucesso
      setCart({})
      setIsCheckoutOpen(false)
      setCustomerData({
        nome: "",
        telefone: "",
        endereco: "",
        complemento: "",
        observacoes: "",
        formaPagamento: "",
      })

      console.log("[v0] Pedido finalizado:", pedidoId)
      alert(
        `Pedido #${pedido.id} realizado com sucesso! Você pode acompanhar o status usando seu número de pedido e telefone.`,
      )
    } catch (error) {
      console.error("[v0] Erro na finalização:", error)

      // Melhor tratamento de erro para o usuário
      let errorMessage = "Erro desconhecido"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }

      alert(`Erro ao processar pedido: ${errorMessage}. Tente novamente ou entre em contato conosco.`)
    }
  }

  const renderProductCard = (item: any, isHighlight = false) => {
    const imageUrl = getItemImage(item)

    return (
      <div
        key={item.id}
        className={`bg-card rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer relative ${
          isHighlight ? "ring-2 ring-primary/20" : ""
        } ${!lojaAberta ? "opacity-75" : ""}`}
        onClick={() => handleProductClick(item)}
      >
        {!lojaAberta && (
          <div className="store-closed-overlay">
            <div className="store-closed-text">Fechado</div>
          </div>
        )}

        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={item.nome}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.nome + " delicious food premium")}`
            }}
          />
          {isHighlight && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
              Destaque
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 text-foreground line-clamp-1">{item.nome}</h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.descricao}</p>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">R$ {(getItemPrice(item) || 0).toFixed(2)}</span>
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 ${
                lojaAberta ? "bg-primary hover:bg-primary/90 hover:scale-110" : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!lojaAberta}
            >
              +
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getAdicionaisParaCombo = (combo: any) => {
    if (!combo || !combo.adicionaisPermitidos) return []

    return (adicionais || []).filter((adicional) => combo.adicionaisPermitidos.includes(adicional.id))
  }

  const getPersonalizacoesParaCombo = (combo: any) => {
    if (!combo || !combo.personalizacoesPermitidas) return []

    return (personalizacoes || []).filter((personalizacao) =>
      combo.personalizacoesPermitidas.includes(personalizacao.id),
    )
  }

  const getAdicionaisParaProduto = (produto: any) => {
    if (!produto || !produto.categoria) return []

    return (adicionais || []).filter(
      (adicional) => adicional.categorias && adicional.categorias.includes(produto.categoria),
    )
  }

  const getPersonalizacoesParaProduto = (produto: any) => {
    if (!produto || !produto.categoria) return []

    return (personalizacoes || []).filter(
      (personalizacao) => personalizacao.categorias && personalizacao.categorias.includes(produto.categoria),
    )
  }

  const cartTotal = getCartTotal()
  const cartItemCount = getCartItemCount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {!lojaAberta && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 border-b border-red-300 py-3 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              <span className="font-medium">
                Estamos fechados no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos agora.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                {dadosEmpresa.logo_url ? (
                  <img
                    src={dadosEmpresa.logo_url || "/placeholder.svg"}
                    alt={`Logo ${dadosEmpresa.nome}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChefHat className="h-10 w-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{dadosEmpresa.nome}</h1>
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {dadosEmpresa.descricao || "Delivery de comida deliciosa"}
                  </span>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    <span className="font-medium">4.8</span>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    0-10 min • {getTextoFrete()}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 ${lojaAberta ? "text-green-100" : "text-red-100"}`}
            >
              <div className={`w-3 h-3 rounded-full ${lojaAberta ? "bg-green-400" : "bg-red-400"} shadow-lg`}></div>
              <span className="text-sm font-medium">
                {lojaAberta ? "Aberto" : "Fechado"}
                {!lojaAberta && <span className="ml-1 text-xs opacity-75">• Volte em breve</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 h-5 w-5" />
            <Input
              placeholder="Buscar no cardápio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white shadow-lg rounded-2xl text-lg placeholder:text-orange-400"
            />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categoriasDisponiveis.map((categoria) => (
              <button
                key={categoria}
                onClick={() => scrollToCategory(categoria)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === categoria
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200 hover:scale-105"
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>
      </div>

      {getTemporaryPromotionItems().length > 0 && (
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 py-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-bold animate-pulse shadow-lg">
                🔥 NOVO
              </div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">Promoção 20% Off (Novidade Temporária)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getTemporaryPromotionItems().map((item) => {
                const itemKey = getItemKey(item)
                const cartItem = cart[itemKey]
                const cartQuantity = cartItem?.quantity || 0
                const originalPrice = getItemPrice(item)
                const discountPrice = originalPrice * 0.8

                return (
                  <div
                    key={itemKey}
                    className="flex bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-white/20"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="relative">
                      <img
                        src={getItemImage(item) || "/placeholder.svg"}
                        alt={item.nome}
                        className="w-36 h-36 object-cover flex-shrink-0"
                      />
                      {!lojaAberta && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Fechado</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        -20%
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.nome}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.descricao}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 line-through">
                            {(originalPrice || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                          <span className="text-xl font-bold text-red-600">
                            {(discountPrice || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg rounded-full px-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProductClick(item)
                          }}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-orange-50 to-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
              Destaques
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollHighlights("left")}
                className="border-orange-200 hover:bg-orange-50 rounded-full w-10 h-10 p-0"
              >
                <ChevronLeft className="h-5 w-5 text-orange-600" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollHighlights("right")}
                className="border-orange-200 hover:bg-orange-50 rounded-full w-10 h-10 p-0"
              >
                <ChevronRight className="h-5 w-5 text-orange-600" />
              </Button>
            </div>
          </div>

          <div ref={highlightsRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {getHighlightItems().map((item) => {
              const itemKey = getItemKey(item)
              const cartItem = cart[itemKey]
              const cartQuantity = cartItem?.quantity || 0

              return (
                <div
                  key={itemKey}
                  className="flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-orange-100"
                  onClick={() => handleProductClick(item)}
                >
                  <div className="relative">
                    <img
                      src={getItemImage(item) || "/placeholder.svg"}
                      alt={item.nome}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    {cartQuantity > 0 && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                        {cartQuantity}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                        ⭐ Destaque
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{item.nome}</h3>
                    {item.descricao && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.descricao}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">
                        {(getItemPrice(item) || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg rounded-full px-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCustomizeModal(item)
                        }}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {categoriasDisponiveis.slice(1).map((categoria) => {
          if (categoriasPromocionais.includes(categoria)) return null

          const categoryItems = getItemsByCategory(categoria)
          if (categoryItems.length === 0) return null

          return (
            <div key={categoria} ref={(el) => (categoryRefs.current[categoria] = el)} className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
                {categoria}
              </h2>
              <div className="space-y-6">
                {categoryItems.map((item) => {
                  const itemKey = getItemKey(item)
                  const cartItem = cart[itemKey]
                  const cartQuantity = cartItem?.quantity || 0

                  return (
                    <div
                      key={itemKey}
                      className="flex bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-orange-100"
                      onClick={() => handleProductClick(item)}
                    >
                      <div className="relative">
                        <img
                          src={getItemImage(item) || "/placeholder.svg"}
                          alt={item.nome}
                          className="w-36 h-36 object-cover flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 mb-2">{item.nome}</h3>
                          {item.descricao && (
                            <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{item.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-orange-600">
                            {(getItemPrice(item) || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                          {cartQuantity === 0 ? (
                            <Button
                              size="lg"
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg rounded-full px-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                openCustomizeModal(item)
                              }}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(itemKey)}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50 rounded-full w-10 h-10 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-lg px-3 py-1 bg-orange-100 text-orange-800 rounded-full min-w-[3rem] text-center">
                                {cartQuantity}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => openCustomizeModal(item)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full w-10 h-10 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className="modal-ifood max-w-2xl bg-popover p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Personalizar {selectedItem?.nome}</DialogTitle>
            <DialogDescription>
              Customize seu pedido adicionando ingredientes extras e personalizações
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div className="modal-image-container relative h-64 overflow-hidden rounded-t-lg">
              {selectedItem && (
                <img
                  src={getItemImage(selectedItem) || "/placeholder.svg"}
                  alt={selectedItem.nome}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              )}
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-primary shadow-lg hover:bg-white transition-all duration-200"
              >
                ×
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-popover-foreground mb-2">{selectedItem?.nome}</h2>
                  <p className="text-lg font-semibold text-primary">
                    {selectedItem &&
                      getItemPrice(selectedItem).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-full">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                    {dadosEmpresa.logo_url ? (
                      <img
                        src={dadosEmpresa.logo_url || "/placeholder.svg"}
                        alt={`Logo ${dadosEmpresa.nome}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ChefHat className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-popover-foreground">{dadosEmpresa.nome}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                      <span>•</span>
                      <span>0-10 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {(selectedItem?.type === "produto"
                ? getAdicionaisParaProduto(selectedItem)
                : selectedItem?.type === "combo"
                  ? getAdicionaisParaCombo(selectedItem)
                  : []
              ).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-popover-foreground">Personalize seu Pedido</h3>
                    <span className="text-sm text-muted-foreground">Adicione extras</span>
                  </div>

                  <div className="space-y-3">
                    {(selectedItem?.type === "produto"
                      ? getAdicionaisParaProduto(selectedItem)
                      : getAdicionaisParaCombo(selectedItem)
                    ).map((adicional) => (
                      <div
                        key={adicional.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`add-${adicional.id}`}
                            checked={addedIngredients.includes(adicional.nome)}
                            onCheckedChange={(checked) => {
                              console.log("[v0] Adicional alterado:", adicional.nome, checked)
                              if (checked) {
                                setAddedIngredients([...addedIngredients, adicional.nome])
                              } else {
                                setAddedIngredients(addedIngredients.filter((i) => i !== adicional.nome))
                              }
                            }}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-popover-foreground">{adicional.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium">
                            + {(adicional.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedItem?.type === "produto"
                ? getPersonalizacoesParaProduto(selectedItem)
                : selectedItem?.type === "combo"
                  ? getPersonalizacoesParaCombo(selectedItem)
                  : []
              ).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-popover-foreground">Personalizações</h3>
                    <span className="text-sm text-muted-foreground">Customize seu pedido</span>
                  </div>

                  <div className="space-y-3">
                    {(selectedItem?.type === "produto"
                      ? getPersonalizacoesParaProduto(selectedItem)
                      : getPersonalizacoesParaCombo(selectedItem)
                    ).map((personalizacao) => (
                      <div
                        key={personalizacao.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`custom-${personalizacao.id}`}
                            checked={selectedPersonalizacoes.includes(personalizacao.nome)}
                            onCheckedChange={(checked) => {
                              console.log("[v0] Personalização alterada:", personalizacao.nome, checked)
                              if (checked) {
                                setSelectedPersonalizacoes([...selectedPersonalizacoes, personalizacao.nome])
                              } else {
                                setSelectedPersonalizacoes(
                                  selectedPersonalizacoes.filter((p) => p !== personalizacao.nome),
                                )
                              }
                            }}
                            className="border-border data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-popover-foreground">{personalizacao.nome}</span>
                            {personalizacao.descricao && (
                              <span className="text-xs text-muted-foreground">{personalizacao.descricao}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={personalizacao.tipo === "remover" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {personalizacao.tipo === "remover" ? "Remover" : "Substituir"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem && selectedItem.type === "produto" && getProductIngredients(selectedItem).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-popover-foreground">Remover Ingredientes</h3>
                  <div className="space-y-3">
                    {getProductIngredients(selectedItem).map((ingrediente: string) => (
                      <div
                        key={ingrediente}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`remove-${ingrediente}`}
                            checked={removedIngredients.includes(ingrediente)}
                            onCheckedChange={(checked) => {
                              console.log("[v0] Ingrediente para remover alterado:", ingrediente, checked)
                              if (checked) {
                                setRemovedIngredients([...removedIngredients, ingrediente])
                              } else {
                                setRemovedIngredients(removedIngredients.filter((i) => i !== ingrediente))
                              }
                            }}
                            className="border-border data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                          />
                          <span className="text-popover-foreground">Sem {ingrediente}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="observacoes" className="text-popover-foreground font-medium">
                  Algum comentário?
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: tirar a cebola, maionese à parte etc."
                  className="border-border focus:border-primary focus:ring-primary bg-input"
                  rows={3}
                  value={modalComments}
                  onChange={(e) => setModalComments(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{modalComments.length} / 140</p>
              </div>

              <div className="pt-2">
                <button className="text-sm text-destructive hover:underline">Denunciar item</button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border bg-transparent hover:bg-muted"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    disabled={modalQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-lg px-4 py-2 bg-muted rounded-lg min-w-[3rem] text-center">
                    {modalQuantity}
                  </span>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={confirmCustomization}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 text-lg font-medium shadow-lg rounded-full transition-all duration-200 hover:scale-105"
                  disabled={!selectedItem}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar •{" "}
                  {(getModalItemPrice() || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-medium shadow-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ver carrinho • {cartItemCount} {cartItemCount === 1 ? "item" : "itens"} •{" "}
                {(cartTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-popover">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-popover-foreground">
                  <ShoppingCart className="h-5 w-5" />
                  Finalizar Pedido
                </DialogTitle>
                <DialogDescription className="text-popover-foreground/70">
                  Revise seus itens e preencha os dados para finalizar seu pedido
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-popover-foreground">Resumo do Pedido</h3>
                  <div className="space-y-3">
                    {Object.entries(cart).map(([cartKey, cartItem]) => {
                      const originalItemId = cartItem.originalItemId || cartKey.split("|")[0]
                      const item = allMenuItems.find((i) => `${i.type}-${i.id}` === originalItemId)

                      if (!item) return null

                      const itemPrice = getItemPrice(item)
                      let totalItemPrice = itemPrice * cartItem.quantity

                      // Calcular preço dos adicionais
                      if (cartItem.customizations?.added) {
                        cartItem.customizations.added.forEach((adicionadoNome) => {
                          const adicional = adicionais.find((a) => a.nome === adicionadoNome)
                          if (adicional) {
                            totalItemPrice += adicional.preco * cartItem.quantity
                          }
                        })
                      }

                      return (
                        <div
                          key={cartKey}
                          className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={getItemImage(item) || "/placeholder.svg?height=60&width=60&query=food"}
                              alt={item.nome}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base">
                                  {cartItem.quantity}x {item.nome}
                                </div>

                                {cartItem.customizations?.removed && cartItem.customizations.removed.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M20 12H4"
                                        />
                                      </svg>
                                      Retirar: {cartItem.customizations.removed.join(", ")}
                                    </span>
                                  </div>
                                )}

                                {cartItem.customizations?.added && cartItem.customizations.added.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 4v16m8-8H4"
                                        />
                                      </svg>
                                      Adicionar: {cartItem.customizations.added.join(", ")}
                                    </span>
                                  </div>
                                )}

                                {cartItem.comments && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                        />
                                      </svg>
                                      {cartItem.comments}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right ml-4">
                                <div className="font-bold text-lg text-gray-900">
                                  {(totalItemPrice || 0).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </div>
                                {cartItem.quantity > 1 && (
                                  <div className="text-sm text-gray-500">
                                    {((totalItemPrice || 0) / cartItem.quantity).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}{" "}
                                    cada
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-red-500 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total do Pedido</span>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-red-600">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-2xl font-bold">
                      R$ {((getCartTotal() || 0) + (calcularFrete(getCartTotal() || 0) || 0)).toFixed(2)}
                    </div>
                    <div className="text-xs mt-1 opacity-90">
                      Produtos: R$ {(getCartTotal() || 0).toFixed(2)}
                      {(calcularFrete(getCartTotal() || 0) || 0) > 0 && (
                        <> + Frete: R$ {(calcularFrete(getCartTotal() || 0) || 0).toFixed(2)}</>
                      )}
                      {(calcularFrete(getCartTotal() || 0) || 0) === 0 && !configuracaoFrete.freteGratis && (
                        <> • Frete Grátis!</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-popover-foreground">
                    <User className="h-5 w-5" />
                    Dados do Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome" className="text-popover-foreground">
                        Nome Completo *
                      </Label>
                      <Input
                        id="nome"
                        value={customerData.nome}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="Seu nome completo"
                        className="border-border focus:border-primary focus:ring-primary bg-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone" className="text-popover-foreground">
                        Telefone *
                      </Label>
                      <Input
                        id="telefone"
                        value={customerData.telefone}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="border-border focus:border-primary focus:ring-primary bg-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-popover-foreground">
                    <Home className="h-5 w-5" />
                    Endereço de Entrega
                  </h3>
                  <div>
                    <Label htmlFor="endereco" className="text-popover-foreground">
                      Endereço Completo *
                    </Label>
                    <Textarea
                      id="endereco"
                      value={customerData.endereco}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Rua, número, bairro, cidade"
                      rows={3}
                      className="border-border focus:border-primary focus:ring-primary bg-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complemento" className="text-popover-foreground">
                      Complemento
                    </Label>
                    <Input
                      id="complemento"
                      value={customerData.complemento}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, complemento: e.target.value }))}
                      placeholder="Apartamento, bloco, referência..."
                      className="border-border focus:border-primary focus:ring-primary bg-input"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-popover-foreground">
                    <CreditCard className="h-5 w-5" />
                    Forma de Pagamento
                  </h3>
                  <Select
                    value={customerData.formaPagamento}
                    onValueChange={(value) => setCustomerData((prev) => ({ ...prev, formaPagamento: value }))}
                  >
                    <SelectTrigger className="border-border focus:border-primary focus:ring-primary bg-input">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="pagamento-na-entrega">Pagamento na Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-popover-foreground">Observações</h3>
                  <Textarea
                    value={customerData.observacoes}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Alguma observação especial para seu pedido?"
                    rows={3}
                    className="border-border focus:border-primary focus:ring-primary bg-input"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 border-border text-popover-foreground hover:bg-muted"
                  >
                    Continuar Comprando
                  </Button>
                  <Button
                    onClick={finalizarPedido}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Finalizar Pedido
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-red-600">Loja Fechada</DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              Estamos fechados no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos agora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={() => setShowClosedModal(false)} className="bg-red-600 hover:bg-red-700 text-white px-8">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-white">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {dadosEmpresa.horario_funcionamento || "Segunda a Sábado: 18h às 23h"}
                </p>
                <p className="text-white/80">Horário de funcionamento</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-black drop-shadow-lg">Delivery</p>
                <p className="text-white/80">Ligue já!</p>
              </div>
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30">
                <Phone className="h-6 w-6" />
                <span className="text-2xl font-bold">{dadosEmpresa.telefone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
