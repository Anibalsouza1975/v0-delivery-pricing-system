"use client"

import { useState } from "react"
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
} from "lucide-react"
import { useDatabasePricing } from "@/components/database-pricing-context"
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
import AjudaTutorialModule from "@/components/modules/ajuda-tutorial"
import AutoAtendimentoWhatsAppModule from "@/components/modules/auto-atendimento-whatsapp"

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
  custoUnitario: number
  markup: number
  precoVenda: number
  foto?: string
  descricao?: string
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

const modules = [
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
]

export default function DeliveryPricingSystem() {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const { getTotalCustosFixos, produtos, getTotalCustosVariaveis, insumos, bebidas, combos, vendas, estoqueInsumos } =
    useDatabasePricing()

  const totalVendas = vendas?.reduce((acc, venda) => acc + venda.total, 0) || 0
  const vendasHoje =
    vendas?.filter((venda) => {
      const hoje = new Date().toDateString()
      return new Date(venda.data).toDateString() === hoje
    }).length || 0

  const renderModuleContent = () => {
    switch (activeModule) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cartago Burguer Grill - Sistema Completo</h1>
              <p className="text-muted-foreground mt-2">Sistema integrado de precificação, vendas, estoque e gestão</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModule("data-management")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Dados
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!activeModule ? (
          <>
            {/* Dashboard Overview */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Faturamento total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vendasHoje}</div>
                    <p className="text-xs text-muted-foreground">Pedidos hoje</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{produtos.length}</div>
                    <p className="text-xs text-muted-foreground">Itens no cardápio</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {getTotalCustosFixos().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Mensais</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTotalCustosVariaveis().toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Do faturamento</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-purple-500">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">Itens Estoque</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{estoqueInsumos?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Insumos controlados</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => setActiveModule(module.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${module.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">{module.description}</CardDescription>
                      <Button className="w-full mt-4 bg-transparent" variant="outline">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {activeModule === "data-management"
                  ? "Gerenciamento de Dados"
                  : modules.find((m) => m.id === activeModule)?.title}
              </h2>
              <Button variant="outline" onClick={() => setActiveModule(null)}>
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
