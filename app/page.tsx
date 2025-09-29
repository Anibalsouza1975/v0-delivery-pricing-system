"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calculator,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  Coffee,
  Utensils,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  Receipt,
  Menu,
  CreditCard,
  Zap,
  HelpCircle,
  MessageCircle,
  Database,
  RefreshCw,
} from "lucide-react"
import { usePricing } from "@/components/pricing-context-supabase"
import CustosFixosModule from "@/components/modules/custos-fixos"
import CustosVariaveisModule from "@/components/modules/custos-variaveis"
import CadastroInsumosModule from "@/components/modules/cadastro-insumos"
import FichaTecnicaModule from "@/components/modules/ficha-tecnica"
import BebidasModule from "@/components/modules/bebidas"
import CombosModule from "@/components/modules/combos"
import GraficosRelatoriosModule from "@/components/modules/graficos-relatorios"
import DataManagement from "@/components/data-management"
import VendasModule from "@/components/modules/vendas"
import MenuClientesModule from "@/components/modules/menu-clientes"
import CarrinhoComprasModule from "@/components/modules/carrinho-compras"
import ControleProducaoModule from "@/components/modules/controle-producao"
import StatusPedidoClienteModule from "@/components/modules/status-pedido-cliente"
import DashboardExecutivoModule from "@/components/modules/dashboard-executivo"
import RelacaoProdutosModule from "@/components/modules/relacao-produtos"
import ControleEstoqueModule from "@/components/modules/controle-estoque"
import IngredientesBaseModule from "@/components/modules/ingredientes-base"
import PrecificacaoAutomaticaModule from "@/components/modules/precificacao-automatica"
import AjudaTutorialModule from "@/components/modules/ajuda-tutorial" // Added import for help tutorial module
import AutoAtendimentoWhatsAppModule from "@/components/modules/auto-atendimento-whatsapp" // Added import for WhatsApp module
import DiagnosticoBDModule from "@/components/modules/diagnostico-bd" // Added import for database diagnostic module
import LoadingScreen from "@/components/loading-screen"
import MigrationHelper from "@/components/migration-helper"

// Tipos para o sistema
export interface CustoFixo {
  id: string
  nome: string
  valor: number
  categoria: string
}

export interface CustoVariavel {
  id: string
  nome: string
  percentual: number
  categoria: string
}

export interface Insumo {
  id: string
  nome: string
  unidade: string
  precoUnitario: number
  categoria: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  insumos: { insumoId: string; quantidade: number }[]
  cmv: number
  precoVenda: number
  margemLucro: number
  valorFrete?: number
  freteGratis?: boolean
  cupomDesconto?: number
  comissaoIfood?: number
  precoIfood?: number
  foto?: string
  descricao?: string
}

export interface Bebida {
  id: string
  nome: string
  tamanho?: string
  custo_unitario: number // Updated to match database field name
  markup: number
  preco_venda: number // Updated to match database field name
  imagem_url?: string // Updated to match database field name
  descricao?: string
  preco_ifood?: number // Added new field
  lucro_unitario?: number // Added new field
  ativo?: boolean
  created_at?: string
  updated_at?: string
}

export interface Combo {
  id: string
  nome: string
  produtos: { produtoId: string; quantidade: number }[]
  bebidas: { bebidaId: string; quantidade: number }[]
  desconto: number
  precoFinal: number
  foto?: string
  descricao?: string
  adicionaisPermitidos?: string[]
  personalizacoesPermitidas?: string[]
}

export interface Venda {
  id: string
  numero_pedido: string
  cliente_nome?: string
  cliente_telefone?: string
  cliente_endereco?: string
  total: number
  taxa_entrega: number
  forma_pagamento: string
  status: string
  observacoes?: string
  data_venda: string
  created_at: string
  updated_at: string
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  created_at: string
}

const modules = [
  {
    id: "diagnostico-bd",
    title: "Diagnóstico do Banco",
    description: "Verifique a conexão com o banco de dados e visualize os dados existentes em todas as tabelas.",
    icon: Database,
    color: "bg-slate-600",
  },
  {
    id: "dashboard-executivo",
    title: "Dashboard Executivo",
    description: "Painel completo com métricas de vendas, lucros, ranking de produtos e análises em tempo real.",
    icon: BarChart3,
    color: "bg-red-600",
  },
  {
    id: "precificacao-automatica",
    title: "Precificação Automática",
    description: "Calcule custos reais baseados no estoque e otimize preços com simulador inteligente de margem.",
    icon: Zap,
    color: "bg-primary",
  },
  {
    id: "ajuda-tutorial",
    title: "Ajuda & Tutorial",
    description: "Guia completo passo a passo para usar todos os módulos do sistema de forma eficiente.",
    icon: HelpCircle,
    color: "bg-blue-600",
  },
  {
    id: "auto-atendimento-whatsapp",
    title: "Auto Atendimento WhatsApp",
    description: "Sistema inteligente de atendimento automatizado via WhatsApp com IA integrada ao cardápio.",
    icon: MessageCircle,
    color: "bg-green-600",
  },
  {
    id: "ingredientes-base",
    title: "Ingredientes Base",
    description:
      "Cadastre os ingredientes que você compra (10kg de carne, 2,4kg de queijo, etc.) para controle de estoque.",
    icon: ShoppingCart,
    color: "bg-emerald-600",
  },
  {
    id: "custos-fixos",
    title: "Custos Fixos",
    description: "Aluguel, luz, água, internet, funcionários, sistemas, pró-labore, etc.",
    icon: Calculator,
    color: "bg-blue-500",
  },
  {
    id: "custos-variaveis",
    title: "Custos Variáveis",
    description: "Gasolina, empréstimos, taxas de cartão, food, taxa de serviços, etc.",
    icon: TrendingUp,
    color: "bg-orange-500",
  },
  {
    id: "ficha-tecnica",
    title: "Ficha Técnica de Produto",
    description:
      "Monte suas fichas técnicas e obtenha informações válidas sobre o produto CMV, preço de venda ideal no cardápio e food.",
    icon: FileText,
    color: "bg-green-500",
  },
  {
    id: "relacao-produtos",
    title: "Relação de Produtos",
    description: "Entenda o quanto cada item gera de produto específico CMV, custo fixo, custo variável e outros.",
    icon: Package,
    color: "bg-purple-500",
  },
  {
    id: "cadastro-insumos",
    title: "Cadastro de Insumos",
    description: "Cadastre pão, bacon, queijo, salada, carne, etc. e o preço de venda deles.",
    icon: ShoppingCart,
    color: "bg-yellow-500",
  },
  {
    id: "bebidas",
    title: "Bebidas",
    description: "Precifique suas bebidas corretamente utilizando o markup.",
    icon: Coffee,
    color: "bg-cyan-500",
  },
  {
    id: "combos",
    title: "Combos",
    description: "Monte seus combos de maneira extremamente fácil e precifique corretamente, sem tomar prejuízos.",
    icon: Utensils,
    color: "bg-red-500",
  },
  {
    id: "vendas",
    title: "Sistema de Vendas",
    description: "Registre vendas, gerencie pedidos e acompanhe o faturamento em tempo real.",
    icon: Receipt,
    color: "bg-emerald-500",
  },
  {
    id: "menu-clientes",
    title: "Menu para Clientes",
    description: "Menu elegante e profissional para apresentar aos seus clientes com fotos e preços.",
    icon: Menu,
    color: "bg-pink-500",
  },
  {
    id: "carrinho-compras",
    title: "Carrinho de Compras",
    description: "Sistema completo de carrinho, checkout e finalização de pedidos para clientes.",
    icon: CreditCard,
    color: "bg-violet-500",
  },
  {
    id: "controle-pedidos",
    title: "Controle de Produção",
    description: "Gerencie pedidos em tempo real, acompanhe status e controle tempo de produção com alertas visuais.",
    icon: Package,
    color: "bg-slate-500",
  },
  {
    id: "graficos-relatorios",
    title: "Gráficos e Relatórios",
    description:
      "Veja de forma muito visual o preço ideal de venda no cardápio próprio, no iFood e outros dados para análise.",
    icon: BarChart3,
    color: "bg-indigo-500",
  },
  {
    id: "status-pedido-cliente",
    title: "Acompanhar Pedido",
    description: "Para clientes acompanharem o status do pedido em tempo real com número e telefone.",
    icon: Package,
    color: "bg-teal-500",
  },
  {
    id: "controle-estoque",
    title: "Controle de Estoque",
    description: "Gerencie compras, acompanhe estoque atual automaticamente e receba alertas de reposição.",
    icon: Package,
    color: "bg-amber-500",
  },
  {
    id: "migration",
    title: "Migração de Dados",
    description: "Ajuda na migração de dados para o novo sistema.",
    icon: Database,
    color: "bg-gray-500",
  },
]

export default function DeliveryPricingSystem() {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authCode, setAuthCode] = useState("")
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const router = useRouter()

  const {
    getTotalCustosFixos,
    produtos,
    getTotalCustosVariaveis,
    bebidas,
    combos,
    vendas,
    estoqueInsumos,
    loading,
    refreshData,
    refreshDataSilent,
  } = usePricing()

  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem("admin_auth")
      const currentTime = Date.now()

      if (adminAuth) {
        const authData = JSON.parse(adminAuth)
        // Check if auth is still valid (24 hours)
        if (currentTime - authData.timestamp < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true)
          return
        } else {
          localStorage.removeItem("admin_auth")
        }
      }

      // Show auth prompt after a brief delay
      setTimeout(() => {
        setShowAuthPrompt(true)
      }, 1000)
    }

    checkAuth()
  }, [])

  const handleAuth = () => {
    // Simple authentication - you can change this code
    const correctCode = "ADMIN2024"

    if (authCode === correctCode) {
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
      }
      localStorage.setItem("admin_auth", JSON.stringify(authData))
      setIsAuthenticated(true)
      setShowAuthPrompt(false)
      setAuthCode("")
    } else {
      alert("Código incorreto!")
      setAuthCode("")
    }
  }

  const redirectToCustomerMenu = () => {
    router.push("/m/cb2024")
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshDataSilent()
    }, 60000)

    return () => clearInterval(interval)
  }, [refreshDataSilent])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (showAuthPrompt && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-600">Esta área é restrita para administradores.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Código de Acesso</label>
              <input
                type="password"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAuth()}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Digite o código de acesso"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAuth}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={redirectToCustomerMenu}
                className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 transition-colors"
              >
                Ver Cardápio
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoadingScreen />
  }

  const totalVendas =
    vendas?.reduce((acc, venda) => {
      return acc + venda.total
    }, 0) || 0

  const hoje = new Date().toDateString()
  const vendasHojeArray =
    vendas?.filter((venda) => {
      const dataVenda = new Date(venda.data_venda).toDateString()
      return dataVenda === hoje
    }) || []

  const vendasHojeTotal = vendasHojeArray.reduce((acc, venda) => acc + venda.total, 0)
  const quantidadeVendasHoje = vendasHojeArray.length

  const custosVariaveisPercentual = getTotalCustosVariaveis()
  const custosVariaveisValidos = Number.isFinite(custosVariaveisPercentual) ? custosVariaveisPercentual : 0

  const custosFixosTotal = getTotalCustosFixos()
  const custosFixosValidos = Number.isFinite(custosFixosTotal) ? custosFixosTotal : 0

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId)
  }

  const renderModuleContent = () => {
    switch (activeModule) {
      case "diagnostico-bd":
        return <DiagnosticoBDModule />
      case "dashboard-executivo":
        return <DashboardExecutivoModule />
      case "precificacao-automatica":
        return <PrecificacaoAutomaticaModule />
      case "ajuda-tutorial":
        return <AjudaTutorialModule />
      case "auto-atendimento-whatsapp":
        return <AutoAtendimentoWhatsAppModule />
      case "ingredientes-base":
        return <IngredientesBaseModule />
      case "custos-fixos":
        return <CustosFixosModule />
      case "custos-variaveis":
        return <CustosVariaveisModule />
      case "cadastro-insumos":
        return <CadastroInsumosModule />
      case "ficha-tecnica":
        return <FichaTecnicaModule />
      case "bebidas":
        return <BebidasModule />
      case "combos":
        return <CombosModule />
      case "vendas":
        return <VendasModule />
      case "menu-clientes":
        return <MenuClientesModule />
      case "carrinho-compras":
        return <CarrinhoComprasModule />
      case "controle-pedidos":
        return <ControleProducaoModule />
      case "graficos-relatorios":
        return <GraficosRelatoriosModule />
      case "data-management":
        return <DataManagement />
      case "status-pedido-cliente":
        return <StatusPedidoClienteModule />
      case "relacao-produtos":
        return <RelacaoProdutosModule />
      case "controle-estoque":
        return <ControleEstoqueModule />
      case "migration":
        return <MigrationHelper />
      default:
        return (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <p>Módulo em desenvolvimento...</p>
                <p className="text-sm mt-2">Este módulo será implementado nas próximas etapas.</p>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="border-b bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-3xl font-bold text-white">Cartago Burguer Grill - Sistema Completo</h1>
              <p className="text-orange-100 mt-1 md:mt-2 text-sm md:text-base">
                Sistema integrado de precificação, vendas, estoque e gestão
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModule("migration")}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
              >
                <Database className="h-3 w-3 md:h-4 md:w-4" />
                Migração
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveModule("data-management")
                }}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
              >
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
                Dados
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {!activeModule ? (
          <>
            <div className="mb-6 md:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-100">Total Vendas</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-green-200">{vendas?.length || 0} vendas • Faturamento total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">Vendas Hoje</CardTitle>
                    <Receipt className="h-4 w-4 text-blue-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {vendasHojeTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-blue-200">{quantidadeVendasHoje} vendas • Faturamento hoje</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-100">Produtos Cadastrados</CardTitle>
                    <Package className="h-4 w-4 text-purple-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{produtos.length}</div>
                    <p className="text-xs text-purple-200">Itens no cardápio</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100">Custos Fixos</CardTitle>
                    <Calculator className="h-4 w-4 text-orange-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {custosFixosValidos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-orange-200">Mensais</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-teal-100">Custos Variáveis</CardTitle>
                    <Target className="h-4 w-4 text-teal-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{custosVariaveisValidos.toFixed(1)}%</div>
                    <p className="text-xs text-teal-200">Do faturamento</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 md:p-3 rounded-lg bg-white/20">
                        <Package className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <CardTitle className="text-base md:text-lg text-white">Itens Estoque</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{estoqueInsumos?.length || 0}</div>
                    <p className="text-xs text-indigo-200">Insumos controlados</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {modules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                    onClick={() => {
                      handleModuleClick(module.id)
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 md:p-3 rounded-xl ${module.color} shadow-lg`}>
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <CardTitle className="text-base md:text-lg text-slate-800 leading-tight">
                          {module.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm leading-relaxed text-slate-600 mb-4 line-clamp-3">
                        {module.description}
                      </CardDescription>
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleModuleClick(module.id)
                        }}
                      >
                        Acessar Módulo
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                {activeModule === "data-management"
                  ? "Gerenciamento de Dados"
                  : activeModule === "migration"
                    ? "Migração de Dados"
                    : modules.find((m) => m.id === activeModule)?.title}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveModule(null)
                }}
                className="bg-white/80 border-slate-300 text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
              >
                Voltar ao Dashboard
              </Button>
            </div>

            {renderModuleContent()}
          </div>
        )}
      </main>
    </div>
  )
}
