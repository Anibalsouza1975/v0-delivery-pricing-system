"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bot, BotOff, Send, User, MessageCircle, Clock } from "lucide-react"

interface Message {
  id: string
  telefone: string
  mensagem: string
  tipo: "recebida" | "enviada"
  remetente: "cliente" | "bot" | "admin"
  admin_nome?: string
  created_at: string
}

interface BotStatus {
  telefone: string
  bot_ativo: boolean
  desativado_por?: string
  data_desativacao?: string
}

interface ChatManualAdminProps {
  telefone: string
  clienteNome: string
  isOpen: boolean
  onClose: () => void
}

export default function ChatManualAdmin({ telefone, clienteNome, isOpen, onClose }: ChatManualAdminProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat-manual/messages?telefone=${telefone}`)
      if (!response.ok) throw new Error("Erro ao carregar mensagens")
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  const loadBotStatus = async () => {
    try {
      const response = await fetch(`/api/chat-manual/bot-status?telefone=${telefone}`)
      if (!response.ok) throw new Error("Erro ao carregar status do bot")
      const data = await response.json()
      setBotStatus(data)
    } catch (error) {
      console.error("Erro ao carregar status:", error)
    }
  }

  const toggleBot = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/chat-manual/toggle-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          ativar: !botStatus?.bot_ativo,
        }),
      })

      if (!response.ok) throw new Error("Erro ao alterar status do bot")

      await loadBotStatus()
      alert(
        botStatus?.bot_ativo
          ? "Bot desativado para este número. Você está no controle!"
          : "Bot reativado para este número.",
      )
    } catch (error) {
      console.error("Erro ao alterar bot:", error)
      alert("Erro ao alterar status do bot")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch("/api/chat-manual/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          mensagem: newMessage,
        }),
      })

      if (!response.ok) throw new Error("Erro ao enviar mensagem")

      setNewMessage("")
      await loadMessages()
    } catch (error) {
      console.error("Erro ao enviar:", error)
      alert("Erro ao enviar mensagem")
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      loadBotStatus()

      // Atualizar mensagens a cada 3 segundos
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen, telefone])

  useEffect(() => {
    // Scroll para o final quando novas mensagens chegarem
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat com {clienteNome}
              </DialogTitle>
              <DialogDescription>{telefone}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={botStatus?.bot_ativo ? "default" : "destructive"}>
                {botStatus?.bot_ativo ? (
                  <>
                    <Bot className="h-3 w-3 mr-1" />
                    Bot Ativo
                  </>
                ) : (
                  <>
                    <BotOff className="h-3 w-3 mr-1" />
                    Bot Desativado
                  </>
                )}
              </Badge>
              <Button
                size="sm"
                variant={botStatus?.bot_ativo ? "destructive" : "default"}
                onClick={toggleBot}
                disabled={isLoading}
              >
                {botStatus?.bot_ativo ? (
                  <>
                    <BotOff className="h-4 w-4 mr-2" />
                    Desativar Bot
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Reativar Bot
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isFromClient = msg.remetente === "cliente"
                  const isFromBot = msg.remetente === "bot"

                  return (
                    <div key={msg.id} className={`flex ${isFromClient ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isFromClient
                            ? "bg-slate-100 text-slate-900"
                            : isFromBot
                              ? "bg-blue-100 text-blue-900"
                              : "bg-green-600 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isFromClient ? (
                            <User className="h-3 w-3" />
                          ) : isFromBot ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {isFromClient ? clienteNome : isFromBot ? "Bot" : msg.admin_nome || "Admin"}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-4 mt-4">
            {!botStatus?.bot_ativo ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isSending}
                />
                <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-sm text-amber-800">
                  <Bot className="h-4 w-4 inline mr-2" />
                  Bot está ativo. Desative o bot para enviar mensagens manualmente.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
