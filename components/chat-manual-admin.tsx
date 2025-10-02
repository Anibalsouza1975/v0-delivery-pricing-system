"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Send, Power, PowerOff, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  tipo: "cliente" | "bot" | "admin"
  conteudo: string
  created_at: string
  status: string
}

interface ChatManualAdminProps {
  telefone: string
  numeroTicket: string
  onClose: () => void
}

export function ChatManualAdmin({ telefone, numeroTicket, onClose }: ChatManualAdminProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [botAtivo, setBotAtivo] = useState(true)
  const [clienteNome, setClienteNome] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Carregar mensagens e status do bot
  useEffect(() => {
    loadMessages()
    loadBotStatus()
    const interval = setInterval(loadMessages, 5000) // Atualizar a cada 5s
    return () => clearInterval(interval)
  }, [telefone])

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    try {
      const response = await fetch(`/api/chat-manual/messages?telefone=${encodeURIComponent(telefone)}`)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
        setClienteNome(data.clienteNome || telefone)
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  async function loadBotStatus() {
    try {
      const response = await fetch(`/api/chat-manual/bot-status?telefone=${encodeURIComponent(telefone)}`)
      const data = await response.json()

      if (data.botAtivo !== undefined) {
        setBotAtivo(data.botAtivo)
      }
    } catch (error) {
      console.error("Erro ao carregar status do bot:", error)
    }
  }

  async function toggleBot() {
    try {
      setLoading(true)
      const response = await fetch("/api/chat-manual/toggle-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          ativar: !botAtivo,
          adminNome: "Admin",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBotAtivo(data.botAtivo)
      }
    } catch (error) {
      console.error("Erro ao alternar bot:", error)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

    try {
      setLoading(true)

      const response = await fetch("/api/chat-manual/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          mensagem: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await loadMessages()
      } else {
        alert("Erro ao enviar mensagem")
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      alert("Erro ao enviar mensagem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Chat Manual - {numeroTicket}</h3>
            <p className="text-sm text-muted-foreground">
              {clienteNome} • {telefone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadMessages} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant={botAtivo ? "destructive" : "default"}
              size="sm"
              onClick={toggleBot}
              disabled={loading}
              className="gap-2"
            >
              {botAtivo ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Desativar Bot
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Ativar Bot
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status do Bot */}
        <div
          className={`px-4 py-2 text-sm ${botAtivo ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}
        >
          {botAtivo ? "🤖 Bot ativo - Respostas automáticas habilitadas" : "👤 Modo manual - Você está no controle"}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.tipo === "cliente" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.tipo === "cliente"
                      ? "bg-gray-100 text-gray-900"
                      : msg.tipo === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {msg.tipo === "cliente" ? "Cliente" : msg.tipo === "admin" ? "Você (Admin)" : "Bot"}
                  </div>
                  <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
