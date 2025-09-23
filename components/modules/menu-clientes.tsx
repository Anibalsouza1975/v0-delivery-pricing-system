"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { usePricing } from "@/components/pricing-context"
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

export default function MenuClientesModule() {
  const { produtos, bebidas, combos, adicionais, personalizacoes } = usePricing()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const [insumos, setInsumos] = useState<any[]>([])
  const [abaterEstoquePorVenda, setAbaterEstoquePorVenda] = useState<any>(null)

  console.log("[v0] Combos carregados:", combos)
  console.log("[v0] Bebidas carregadas:", bebidas)

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

    // Adicionar outras categorias que têm produtos cadastrados
    const categoriasComProdutos = new Set()
    allMenuItems.forEach((item) => {
      if (item.type === "produto" && item.categoria) {
        categoriasComProdutos.add(item.categoria)
      }
    })

    // Adicionar categorias fixas que têm produtos (exceto Combos e Bebidas que já foram adicionadas)
    const categoriasFixas = ["Hambúrgueres", "Batatas"]
    categoriasFixas.forEach((categoria) => {
      if (categoriasComProdutos.has(categoria)) {
        baseCategorias.push(categoria)
      }
    })

    // Adicionar outras categorias que têm produtos
    Array.from(categoriasComProdutos).forEach((categoria) => {
      if (
        !baseCategorias.includes(categoria) &&
        !categoriasFixas.includes(categoria) &&
        !categoriasPromocionais.includes(categoria)
      ) {
        baseCategorias.push(categoria)
      }
    })

    console.log("[v0] Categorias disponíveis:", baseCategorias)
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
    console.log("[v0] Obtendo ingredientes do produto:", produto.nome, produto.insumos)
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
    console.log("[v0] Adicionando ao carrinho:", itemId, customizations, comments)
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
    console.log("[v0] Removendo do carrinho:", itemId)
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
      const itemId = cartItem.originalItemId || cartKey.split("|")[0]
      const item = allMenuItems.find((i) => `${i.type}-${i.id}` === itemId)

      if (item) {
        let itemTotal = getItemPrice(item) * cartItem.quantity

        if (cartItem.customizations?.added) {
          cartItem.customizations.added.forEach((adicionadoNome) => {
            const adicional = adicionais.find((a) => a.nome === adicionadoNome)
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

    console.log("[v0] Abrindo modal de customização")
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
      const adicional = adicionais.find((a) => a.nome === adicionadoNome)
      if (adicional) {
        additionalsPrice += adicional.preco
      }
    })

    return (basePrice + additionalsPrice) * modalQuantity
  }

  const confirmCustomization = () => {
    console.log("[v0] Confirmando customização:", {
      item: selectedItem?.nome,
      removed: removedIngredients,
      added: addedIngredients,
      personalizacoes: selectedPersonalizacoes,
      quantity: modalQuantity,
      comments: modalComments,
    })

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
    if (item.type === "produto") return item.precoVenda
    if (item.type === "bebida") return item.precoVenda
    if (item.type === "combo") return item.precoFinal
    return 0
  }

  const getItemImage = (item: any) => {
    if (item.foto && typeof item.foto === "string") {
      if (item.foto.startsWith("http://") || item.foto.startsWith("https://")) {
        return item.foto
      }
      if (item.foto.startsWith("data:image/")) {
        return item.foto
      }
    }

    const placeholderUrl = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.nome + " delicious food premium")}`
    return placeholderUrl
  }

  const getItemKey = (item: any) => `${item.type}-${item.id}`

  const finalizarPedido = async () => {
    const itensCarrinho = Object.entries(cart).map(([itemKey, { quantity, customizations, comments }]) => {
      const [categoria, nome] = itemKey.split(":")
      const produto = produtos?.find((p) => p.categoria === categoria && p.nome === nome)

      return {
        nome,
        categoria,
        preco: produto?.preco || 0,
        quantidade: quantity,
        personalizacoes: customizations,
        observacoes: comments || "", // Adicionando comentários como observações
      }
    })

    console.log("[v0] Iniciando finalização do pedido")
    console.log("[v0] Forma de pagamento capturada:", customerData.formaPagamento)

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
    console.log("[v0] ID do pedido gerado:", pedidoId)

    try {
      const itensFormatados = Object.entries(cart).map(([cartKey, cartItem]) => {
        const itemId = (cartItem as any).originalItemId || cartKey.split("-")[0] + "-" + cartKey.split("-")[1]
        const item = allMenuItems.find((i) => `${i.type}-${i.id}` === itemId)

        let precoItem = getItemPrice(item!)
        if (cartItem.customizations?.added) {
          cartItem.customizations.added.forEach((adicionadoNome) => {
            const adicional = adicionais.find((a) => a.nome === adicionadoNome)
            if (adicional) {
              precoItem += adicional.preco
            }
          })
        }

        const itemFormatado = {
          id: item?.id || itemId,
          nome: item?.nome || "Item não encontrado",
          preco: precoItem,
          quantidade: cartItem.quantity,
          tipo: item?.type || "produto",
          observacoes: cartItem.comments || "",
          personalizacoes: cartItem.customizations
            ? {
                removidos: cartItem.customizations.removed || [],
                adicionados: cartItem.customizations.added || [],
              }
            : { removidos: [], adicionados: [] },
        }

        console.log("[v0] Item formatado:", JSON.stringify(itemFormatado))
        return itemFormatado
      })

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

      console.log("[v0] Forma de pagamento no objeto pedido:", pedido.formaPagamento)
      console.log("[v0] Pedido completo:", JSON.stringify(pedido))

      try {
        const pedidosExistentes = JSON.parse(localStorage.getItem("delivery-pricing-controle-producao") || "[]")
        pedidosExistentes.unshift(pedido)
        localStorage.setItem("delivery-pricing-controle-producao", JSON.stringify(pedidosExistentes))
        console.log("[v0] Pedido salvo no controle de produção:", pedidoId)

        window.dispatchEvent(new CustomEvent("pedidoAdicionado", { detail: pedido }))
      } catch (error) {
        console.error("[v0] Erro crítico ao salvar pedido no controle de produção:", error)
        alert("Erro crítico ao salvar pedido. Tente novamente.")
        return
      }

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

        console.log("[v0] Venda para sistema:", JSON.stringify(vendaParaSistema))

        try {
          const vendasExistentes = JSON.parse(localStorage.getItem("delivery-pricing-vendas") || "[]")
          vendasExistentes.unshift(vendaParaSistema)
          localStorage.setItem("delivery-pricing-vendas", JSON.stringify(vendasExistentes))
          console.log("[v0] Venda salva no sistema de pricing")
        } catch (error) {
          console.error("[v0] Erro ao salvar venda no sistema (não-crítico):", error)
        }

        setTimeout(() => {
          console.log("[v0] Iniciando abatimento de estoque para:", pedidoId)
          try {
            abaterEstoquePorVenda(pedidoId)
            console.log("[v0] Processo de abatimento de estoque iniciado para pedido:", pedidoId)
          } catch (error) {
            console.warn("[v0] Aviso: Problema no abatimento de estoque (pedido já foi salvo):", error)
          }
        }, 2000)
      }

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

      console.log("[v0] Pedido finalizado com sucesso:", pedidoId)
      alert(
        `Pedido #${pedido.id} realizado com sucesso! Você pode acompanhar o status usando seu número de pedido e telefone.`,
      )
    } catch (error) {
      console.error("[v0] Erro geral na finalização do pedido:", error)
      alert("Erro ao processar pedido. Tente novamente.")
    }
  }

  const renderProductCard = (item: any, isHighlight = false) => {
    const imageUrl = item.imagem || "/delicious-food.png"

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
              target.src = "/delicious-food.png"
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
            <span className="text-xl font-bold text-primary">R$ {item.preco?.toFixed(2) || "0.00"}</span>
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

    return adicionais.filter((adicional) => combo.adicionaisPermitidos.includes(adicional.id))
  }

  const getPersonalizacoesParaCombo = (combo: any) => {
    if (!combo || !combo.personalizacoesPermitidas) return []

    return personalizacoes.filter((personalizacao) => combo.personalizacoesPermitidas.includes(personalizacao.id))
  }

  const getAdicionaisParaProduto = (produto: any) => {
    if (!produto || !produto.categoria) return []

    return adicionais.filter((adicional) => adicional.categorias && adicional.categorias.includes(produto.categoria))
  }

  const getPersonalizacoesParaProduto = (produto: any) => {
    if (!produto || !produto.categoria) return []

    return personalizacoes.filter(
      (personalizacao) => personalizacao.categorias && personalizacao.categorias.includes(produto.categoria),
    )
  }

  const cartTotal = getCartTotal()
  const cartItemCount = getCartItemCount()

  return (
    <div className="min-h-screen bg-background">
      {!lojaAberta && (
        <div className="bg-red-50 border-b border-red-200 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <Clock className="h-5 w-5" />
              <span className="font-medium">
                Estamos fechados no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos agora.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cartago Burger Grill</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Hambúrgueres • Lanches • Delivery</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.8</span>
                  </div>
                  <span>0-10 min • {getTextoFrete()}</span>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${lojaAberta ? "text-green-600" : "text-red-600"}`}>
              <div className={`w-2 h-2 rounded-full ${lojaAberta ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium">
                {lojaAberta ? "Aberto" : "Fechado"}
                {!lojaAberta && <span className="ml-1 text-xs opacity-75">• Volte em breve</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar no cardápio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-border focus:border-primary focus:ring-primary bg-input"
            />
          </div>
        </div>
      </div>

      <div className="sticky-category-nav">
        <div className="container mx-auto px-4">
          <div className="category-filter-pills">
            {categoriasDisponiveis.map((categoria) => (
              <button
                key={categoria}
                onClick={() => scrollToCategory(categoria)}
                className={`category-pill ${selectedCategory === categoria ? "active" : ""}`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>
      </div>

      {getTemporaryPromotionItems().length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">NOVO</div>
              <h2 className="text-xl font-bold text-red-600">Promoção 20% Off (Novidade Temporária)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTemporaryPromotionItems().map((item) => {
                const itemKey = getItemKey(item)
                const cartItem = cart[itemKey]
                const cartQuantity = cartItem?.quantity || 0
                const originalPrice = getItemPrice(item)
                const discountPrice = originalPrice * 0.8 // 20% de desconto

                return (
                  <div
                    key={itemKey}
                    className="flex bg-card rounded-lg overflow-hidden product-card-ifood cursor-pointer border-2 border-red-200 hover:border-red-300 transition-colors"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="relative">
                      <img
                        src={getItemImage(item) || "/placeholder.svg"}
                        alt={item.nome}
                        className="w-32 h-32 object-cover flex-shrink-0"
                      />
                      {!lojaAberta && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Fechado</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -20%
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{item.nome}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.descricao}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground line-through">
                            {originalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                          <span className="text-lg font-bold text-red-600">
                            {discountPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProductClick(item)
                          }}
                        >
                          <Plus className="h-4 w-4" />
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

      {getPromotionItems().length > 0 && (
        <div className="bg-muted py-6">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Até 20% off (com desconto)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPromotionItems().map((item) => {
                const itemKey = getItemKey(item)
                const cartItem = cart[itemKey]
                const cartQuantity = cartItem?.quantity || 0
                const originalPrice = getItemPrice(item)
                const discountPrice = originalPrice * 0.8 // 20% de desconto

                return (
                  <div
                    key={itemKey}
                    className="flex bg-card rounded-lg overflow-hidden product-card-ifood cursor-pointer"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="relative">
                      <img
                        src={getItemImage(item) || "/placeholder.svg"}
                        alt={item.nome}
                        className="w-32 h-32 object-cover flex-shrink-0"
                      />
                      {!lojaAberta && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Fechado</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -20%
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <h3 className="font-semibold text-card-foreground mb-1">{item.nome}</h3>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="price-highlight">
                          {discountPrice.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <span className="discount-price">
                          {originalPrice.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Serve 1 pessoa</span>
                        {cartQuantity > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {cartQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Destaques</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => scrollHighlights("left")} className="border-border">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => scrollHighlights("right")} className="border-border">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={highlightsRef} className="highlights-carousel flex gap-4 overflow-x-auto pb-4">
            {getHighlightItems().map((item) => {
              const itemKey = getItemKey(item)
              const cartItem = cart[itemKey]
              const cartQuantity = cartItem?.quantity || 0

              return (
                <div
                  key={itemKey}
                  className="flex-shrink-0 w-72 product-card-ifood rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleProductClick(item)}
                >
                  <div className="relative">
                    <img
                      src={getItemImage(item) || "/placeholder.svg"}
                      alt={item.nome}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                    {cartQuantity > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full font-medium">
                        {cartQuantity}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="promotion-badge text-xs px-2 py-1 rounded-full font-medium">Destaque</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-card-foreground mb-1 line-clamp-1">{item.nome}</h3>
                    {item.descricao && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.descricao}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="price-highlight">
                        {getItemPrice(item).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCustomizeModal(item)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {categoriasDisponiveis.slice(1).map((categoria) => {
        if (categoriasPromocionais.includes(categoria)) return null

        const categoryItems = getItemsByCategory(categoria)
        if (categoryItems.length === 0) return null

        return (
          <div key={categoria} ref={(el) => (categoryRefs.current[categoria] = el)} className="category-section mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">{categoria}</h2>
            <div className="space-y-4">
              {categoryItems.map((item) => {
                const itemKey = getItemKey(item)
                const cartItem = cart[itemKey]
                const cartQuantity = cartItem?.quantity || 0

                return (
                  <div
                    key={itemKey}
                    className="flex bg-card rounded-lg overflow-hidden product-card-ifood cursor-pointer"
                    onClick={() => handleProductClick(item)}
                  >
                    <img
                      src={getItemImage(item) || "/placeholder.svg"}
                      alt={item.nome}
                      className="w-32 h-32 object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold text-card-foreground mb-1">{item.nome}</h3>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.descricao}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="price-highlight">
                          {getItemPrice(item).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        {cartQuantity === 0 ? (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCustomizeModal(item)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(itemKey)}
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium px-2">{cartQuantity}</span>
                            <Button
                              size="sm"
                              onClick={() => openCustomizeModal(item)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className="modal-ifood max-w-2xl bg-popover p-0">
          <div className="relative">
            <div className="modal-image-container">
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
                className="absolute top-4 right-4 w-8 h-8 bg-background rounded-full flex items-center justify-center text-foreground hover:text-primary shadow-md"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent h-24"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">{selectedItem?.nome}</h2>
                <p className="text-lg font-semibold drop-shadow-lg">
                  {selectedItem &&
                    getItemPrice(selectedItem).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <ChefHat className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-popover-foreground">Cartago Burger Grill</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>4.8</span>
                    <span>•</span>
                    <span>0-10 min</span>
                    <span>•</span>
                    <span>{getTextoFrete()}</span>
                  </div>
                </div>
              </div>

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
                            + {adicional.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
                    className="border-border bg-transparent"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    disabled={modalQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-lg">{modalQuantity}</span>
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium"
                >
                  Adicionar •{" "}
                  {getModalItemPrice().toLocaleString("pt-BR", {
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
                {cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-popover">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-popover-foreground">
                  <ShoppingCart className="h-5 w-5" />
                  Finalizar Pedido
                </DialogTitle>
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
                                  {totalItemPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                                {cartItem.quantity > 1 && (
                                  <div className="text-sm text-gray-500">
                                    {(totalItemPrice / cartItem.quantity).toLocaleString("pt-BR", {
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
                      R$ {(getCartTotal() + calcularFrete(getCartTotal())).toFixed(2)}
                    </div>
                    <div className="text-xs mt-1 opacity-90">
                      Produtos: R$ {getCartTotal().toFixed(2)}
                      {calcularFrete(getCartTotal()) > 0 && (
                        <> + Frete: R$ {calcularFrete(getCartTotal()).toFixed(2)}</>
                      )}
                      {calcularFrete(getCartTotal()) === 0 && !configuracaoFrete.freteGratis && <> • Frete Grátis!</>}
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

      <div className="bg-primary py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <p className="text-lg">
                <span className="font-bold">Todos os lanches acompanham</span> Batata frita{" "}
                <span className="text-sm">(150g)</span> e refrigerante lata.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-black">Delivery</p>
                <p className="text-sm opacity-90">Ligue já!</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Phone className="h-5 w-5" />
                <span className="text-xl font-bold">99642-0379</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
