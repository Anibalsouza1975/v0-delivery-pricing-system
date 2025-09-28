"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Phone, Clock, User, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

interface WhatsAppMessage {
  id: string
  phone_number: string
  message: string
  response: string
  timestamp: string
  created_at: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/whatsapp/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Erro ao buscar conversas:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConversations()

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchConversations()
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR")
  }

  const groupConversationsByPhone = (messages: WhatsAppMessage[]) => {
    const grouped = messages.reduce(
      (acc, message) => {
        if (!acc[message.phone_number]) {
          acc[message.phone_number] = []
        }
        acc[message.phone_number].push(message)
        return acc
      },
      {} as Record<string, WhatsAppMessage[]>,
    )

    // Ordenar mensagens dentro de cada conversa por timestamp
    Object.keys(grouped).forEach((phone) => {
      grouped[phone].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

    return grouped
  }

  const groupedConversations = groupConversationsByPhone(conversations)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Conversas WhatsApp</h1>
                <p className="text-muted-foreground mt-2">Acompanhe todas as conversas do auto-atendimento</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando conversas...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Conversas WhatsApp</h1>
                <p className="text-muted-foreground mt-2">
                  {Object.keys(groupedConversations).length} conversas ativas • {conversations.length} mensagens totais
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {Object.keys(groupedConversations).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground mb-6">
                As conversas do WhatsApp aparecerão aqui quando os clientes enviarem mensagens.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedConversations).map(([phoneNumber, messages]) => {
              const lastMessage = messages[0]
              const messageCount = messages.length

              return (
                <Card key={phoneNumber} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {phoneNumber}
                            <Badge variant="secondary">{messageCount} mensagens</Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            Última mensagem: {formatTime(lastMessage.timestamp)}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {messages.slice(0, 3).map((message) => (
                        <div key={message.id} className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">Cliente</span>
                              <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <p className="text-sm">{message.message}</p>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">IA Cartago</span>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm">{message.response}</p>
                          </div>
                        </div>
                      ))}

                      {messages.length > 3 && (
                        <div className="text-center pt-4 border-t">
                          <p className="text-sm text-muted-foreground">+ {messages.length - 3} mensagens anteriores</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
