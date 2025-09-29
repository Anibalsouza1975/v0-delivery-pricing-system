"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, X, MapPin, Phone, Clock, Star } from "lucide-react"
import { usePricing } from "@/components/pricing-context-supabase"
import Image from "next/image"

interface CartItem {
  id: string
  nome: string
  preco: number
  quantidade: number
  tipo: "produto" | "bebida" | "combo"
  foto?: string
  adicionais?: string[]
}

export default function CustomerMenuPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("todos")
  const [customerData, setCustomerData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    complemento: "",
    formaPagamento: "",
    observacoes: "",
  })
  const [showCheckout, setShowCheckout] = useState(false)

  const { produtos, bebidas, combos, loading } = usePricing()

  const TAXA_ENTREGA = 5.0

  const addToCart = (item: any, tipo: "produto" | "bebida" | "combo") => {
    const cartItem: CartItem = {
      id: item.id,
      nome: item.nome,
      preco: tipo === "produto" ? item.precoVenda : tipo === "bebida" ? item.preco_venda : item.precoFinal,
      quantidade: 1,
      tipo,
      foto: item.foto || item.imagem_url,
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id && cartItem.tipo === tipo)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.tipo === tipo
            ? { ...cartItem, quantidade: cartItem.quantidade + 1 }
            : cartItem,
        )
      }
      return [...prevCart, cartItem]
    })
  }

  const removeFromCart = (id: string, tipo: "produto" | "bebida" | "combo") => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.tipo === tipo)))
  }

  const updateQuantity = (id: string, tipo: "produto" | "bebida" | "combo", newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id, tipo)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id && item.tipo === tipo ? { ...item, quantidade: newQuantity } : item)),
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantidade, 0)
  }

  const categories = [
    { id: "todos", name: "Todos", icon: "🍽️" },
    { id: "hamburguer", name: "Hambúrguers", icon: "🍔" },
    { id: "bebida", name: "Bebidas", icon: "🥤" },
    { id: "combo", name: "Combos", icon: "🍟" },
    { id: "sobremesa", name: "Sobremesas", icon: "🍰" },
  ]

  const filteredItems = () => {
    let allItems: any[] = []

    if (selectedCategory === "todos" || selectedCategory === "hamburguer") {
      allItems = [...allItems, ...produtos.map((p) => ({ ...p, tipo: "produto" }))]
    }
    if (selectedCategory === "todos" || selectedCategory === "bebida") {
      allItems = [...allItems, ...bebidas.map((b) => ({ ...b, tipo: "bebida" }))]
    }
    if (selectedCategory === "todos" || selectedCategory === "combo") {
      allItems = [...allItems, ...combos.map((c) => ({ ...c, tipo: "combo" }))]
    }

    return allItems
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Cartago Burguer Grill</h1>
              <div className="flex items-center gap-4 text-sm text-orange-100 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Delivery disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>18h - 23h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>(11) 99999-9999</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowCart(true)}
              className="relative bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrinho
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1">
                  {getCartItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white shadow-sm sticky top-[88px] z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-orange-600 text-white"
                    : "bg-white text-slate-700 hover:bg-orange-50"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems().map((item) => (
            <Card key={`${item.tipo}-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-slate-100">
                {item.foto || item.imagem_url ? (
                  <Image src={item.foto || item.imagem_url} alt={item.nome} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <span className="text-4xl">
                      {item.tipo === "bebida" ? "🥤" : item.tipo === "combo" ? "🍟" : "🍔"}
                    </span>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.nome}</CardTitle>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm text-slate-600">4.8</span>
                  </div>
                </div>
                {item.descricao && <p className="text-sm text-slate-600 line-clamp-2">{item.descricao}</p>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-orange-600">
                    R${" "}
                    {(item.tipo === "produto"
                      ? item.precoVenda
                      : item.tipo === "bebida"
                        ? item.preco_venda
                        : item.precoFinal
                    ).toFixed(2)}
                  </div>
                  <Button
                    onClick={() => addToCart(item, item.tipo)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:w-96 md:rounded-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Seu Pedido</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Seu carrinho está vazio</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.nome}</h4>
                        <p className="text-sm text-slate-600">R$ {item.preco.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.tipo, item.quantidade - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantidade}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.tipo, item.quantidade + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id, item.tipo)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>R$ {TAXA_ENTREGA.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-orange-600">R$ {(getCartTotal() + TAXA_ENTREGA).toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowCart(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Finalizar Pedido
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Finalizar Pedido</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Order Summary */}
              <div>
                <h4 className="font-medium mb-3">Resumo do Pedido</h4>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={`${item.tipo}-${item.id}`} className="flex justify-between text-sm">
                      <span>
                        {item.quantidade}x {item.nome}
                      </span>
                      <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de entrega:</span>
                      <span>R$ {TAXA_ENTREGA.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">R$ {(getCartTotal() + TAXA_ENTREGA).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Data */}
              <div>
                <h4 className="font-medium mb-3">Dados do Cliente</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={customerData.nome}
                    onChange={(e) => setCustomerData({ ...customerData, nome: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={customerData.telefone}
                    onChange={(e) => setCustomerData({ ...customerData, telefone: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="font-medium mb-3">Endereço de Entrega</h4>
                <div className="space-y-3">
                  <textarea
                    placeholder="Endereço Completo"
                    value={customerData.endereco}
                    onChange={(e) => setCustomerData({ ...customerData, endereco: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Complemento (apartamento, bloco, referência...)"
                    value={customerData.complemento}
                    onChange={(e) => setCustomerData({ ...customerData, complemento: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-medium mb-3">Forma de Pagamento</h4>
                <select
                  value={customerData.formaPagamento}
                  onChange={(e) => setCustomerData({ ...customerData, formaPagamento: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione a forma de pagamento</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                </select>
              </div>

              {/* Observations */}
              <div>
                <h4 className="font-medium mb-3">Observações</h4>
                <textarea
                  placeholder="Alguma observação especial para seu pedido?"
                  value={customerData.observacoes}
                  onChange={(e) => setCustomerData({ ...customerData, observacoes: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                  Continuar Comprando
                </Button>
                <Button
                  onClick={() => {
                    // Here you would normally send the order to your backend
                    alert("Pedido enviado com sucesso! Entraremos em contato em breve.")
                    setCart([])
                    setShowCheckout(false)
                    setCustomerData({
                      nome: "",
                      telefone: "",
                      endereco: "",
                      complemento: "",
                      formaPagamento: "",
                      observacoes: "",
                    })
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
