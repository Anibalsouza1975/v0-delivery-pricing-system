"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  Play,
  CheckCircle,
  ArrowRight,
  Calculator,
  Package,
  FileText,
  BarChart3,
  Zap,
  Coffee,
  Utensils,
  ShoppingCart,
  Receipt,
  Menu,
  CreditCard,
  Target,
  TrendingUp,
  Settings,
  HelpCircle,
  Clock,
  Users,
  DollarSign,
} from "lucide-react"

export default function AjudaTutorialModule() {
  const tutorialSteps = [
    {
      step: 1,
      title: "Configuração Inicial",
      description: "Configure os custos básicos do seu negócio",
      modules: ["custos-fixos", "custos-variaveis"],
      time: "10-15 min",
      difficulty: "Fácil",
      tasks: [
        "Cadastre custos fixos (aluguel, luz, funcionários)",
        "Configure custos variáveis (taxas, combustível)",
        "Defina valores mensais e percentuais",
      ],
    },
    {
      step: 2,
      title: "Cadastro de Ingredientes",
      description: "Registre todos os ingredientes que você compra",
      modules: ["ingredientes-base", "cadastro-insumos"],
      time: "20-30 min",
      difficulty: "Fácil",
      tasks: [
        "Cadastre ingredientes base (10kg carne, 2,4kg queijo)",
        "Configure insumos individuais (pão, bacon, salada)",
        "Defina preços unitários e unidades de medida",
      ],
    },
    {
      step: 3,
      title: "Criação de Produtos",
      description: "Monte suas fichas técnicas e calcule custos reais",
      modules: ["ficha-tecnica", "precificacao-automatica"],
      time: "30-45 min",
      difficulty: "Médio",
      tasks: [
        "Crie fichas técnicas dos produtos",
        "Use a calculadora personalizada para testes",
        "Analise custos e margens sugeridas",
      ],
    },
    {
      step: 4,
      title: "Precificação e Bebidas",
      description: "Configure preços de venda e bebidas",
      modules: ["bebidas", "combos"],
      time: "15-20 min",
      difficulty: "Fácil",
      tasks: ["Cadastre bebidas com markup", "Monte combos promocionais", "Defina preços competitivos"],
    },
    {
      step: 5,
      title: "Sistema de Vendas",
      description: "Configure o sistema de vendas e atendimento",
      modules: ["vendas", "menu-clientes", "carrinho-compras"],
      time: "25-35 min",
      difficulty: "Médio",
      tasks: ["Configure sistema de vendas", "Personalize menu para clientes", "Teste carrinho de compras"],
    },
    {
      step: 6,
      title: "Controle Operacional",
      description: "Gerencie produção, estoque e pedidos",
      modules: ["controle-pedidos", "controle-estoque", "status-pedido-cliente"],
      time: "20-30 min",
      difficulty: "Médio",
      tasks: ["Configure controle de produção", "Ative alertas de estoque", "Teste acompanhamento de pedidos"],
    },
    {
      step: 7,
      title: "Análise e Relatórios",
      description: "Monitore performance e tome decisões",
      modules: ["dashboard-executivo", "graficos-relatorios", "relacao-produtos"],
      time: "15-25 min",
      difficulty: "Fácil",
      tasks: ["Analise dashboard executivo", "Gere relatórios de performance", "Monitore produtos mais lucrativos"],
    },
  ]

  const quickTips = [
    {
      icon: Calculator,
      title: "Precificação Inteligente",
      tip: "Use a Precificação Automática para calcular custos reais baseados no seu estoque atual",
    },
    {
      icon: Target,
      title: "Margem Ideal",
      tip: "A margem recomendada de 40% garante lucratividade sem perder competitividade",
    },
    {
      icon: Package,
      title: "Controle de Estoque",
      tip: "Configure alertas de estoque baixo para nunca ficar sem ingredientes",
    },
    {
      icon: BarChart3,
      title: "Dashboard Executivo",
      tip: "Monitore diariamente as métricas de vendas, lucros e produtos em destaque",
    },
    {
      icon: Clock,
      title: "Tempo de Produção",
      tip: "Configure tempos realistas de preparo para melhorar a experiência do cliente",
    },
    {
      icon: DollarSign,
      title: "Análise de Lucro",
      tip: "Identifique produtos em prejuízo e ajuste preços ou receitas rapidamente",
    },
  ]

  const moduleIcons: { [key: string]: any } = {
    "custos-fixos": Calculator,
    "custos-variaveis": TrendingUp,
    "ingredientes-base": ShoppingCart,
    "cadastro-insumos": Package,
    "ficha-tecnica": FileText,
    "precificacao-automatica": Zap,
    bebidas: Coffee,
    combos: Utensils,
    vendas: Receipt,
    "menu-clientes": Menu,
    "carrinho-compras": CreditCard,
    "controle-pedidos": Package,
    "controle-estoque": Package,
    "status-pedido-cliente": Package,
    "dashboard-executivo": BarChart3,
    "graficos-relatorios": BarChart3,
    "relacao-produtos": Package,
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-100 text-green-800"
      case "Médio":
        return "bg-yellow-100 text-yellow-800"
      case "Difícil":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-lg bg-blue-600">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Guia Completo do Sistema</h1>
            <p className="text-muted-foreground">Aprenda a usar todos os módulos passo a passo</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">17</div>
            <p className="text-sm text-muted-foreground">Módulos Disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">2-3h</div>
            <p className="text-sm text-muted-foreground">Tempo Total Setup</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">7</div>
            <p className="text-sm text-muted-foreground">Etapas Principais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">100%</div>
            <p className="text-sm text-muted-foreground">Integração Módulos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tutorial Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Roteiro de Implementação
          </CardTitle>
          <CardDescription>Siga estas etapas na ordem para configurar completamente seu sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tutorialSteps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < tutorialSteps.length - 1 && <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />}

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {step.time}
                    </Badge>
                    <Badge className={getDifficultyColor(step.difficulty)}>{step.difficulty}</Badge>
                  </div>

                  <p className="text-muted-foreground">{step.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {step.modules.map((moduleId) => {
                      const IconComponent = moduleIcons[moduleId] || Package
                      return (
                        <Badge key={moduleId} variant="secondary" className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" />
                          {moduleId.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tarefas desta etapa:</p>
                    <ul className="space-y-1">
                      {step.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dicas Importantes
          </CardTitle>
          <CardDescription>Dicas essenciais para aproveitar ao máximo o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex gap-3 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tip.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Fluxo de Integração
          </CardTitle>
          <CardDescription>Como os módulos trabalham juntos no seu dia a dia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h4 className="font-medium">1. Cadastros Base</h4>
                <p className="text-sm text-muted-foreground">Ingredientes, custos e insumos</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-medium">2. Produtos & Preços</h4>
                <p className="text-sm text-muted-foreground">Fichas técnicas e precificação</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <h4 className="font-medium">3. Vendas & Análise</h4>
                <p className="text-sm text-muted-foreground">Operação e relatórios</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-center space-y-2">
            <h4 className="font-medium">Sincronização Automática</h4>
            <p className="text-sm text-muted-foreground">
              Todos os módulos compartilham dados em tempo real. Alterações em ingredientes atualizam automaticamente
              custos, preços e relatórios.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Suporte e Recursos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Recursos Disponíveis</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Calculadora de custos em tempo real</li>
                <li>• Alertas automáticos de estoque</li>
                <li>• Relatórios de performance</li>
                <li>• Backup automático de dados</li>
                <li>• Integração entre todos os módulos</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Próximos Passos</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Comece pelos custos fixos e variáveis</li>
                <li>• Cadastre seus ingredientes principais</li>
                <li>• Crie 2-3 produtos para teste</li>
                <li>• Use a precificação automática</li>
                <li>• Monitore o dashboard executivo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
