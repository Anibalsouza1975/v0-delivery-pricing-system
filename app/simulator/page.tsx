"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  from: "user" | "bot"
  text: string
  timestamp: Date
}

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [phone, setPhone] = useState("5541999999999")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      from: "user",
      text: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/webhook/test-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          message: input,
        }),
      })

      const data = await response.json()

      const conversasResponse = await fetch("/api/whatsapp/conversas")
      const conversasData = await conversasResponse.json()
      const conversas = conversasData.conversas || []

      // Encontrar a conversa atual
      const currentConversation = conversas.find((c: any) => c.telefone === phone)

      if (currentConversation?.ultimaMensagem) {
        const botMessage: Message = {
          from: "bot",
          text: currentConversation.ultimaMensagem,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      }
    } catch (error) {
      console.error("[v0] Erro ao enviar mensagem:", error)
      const errorMessage: Message = {
        from: "bot",
        text: "Erro ao processar mensagem. Verifique os logs.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de WhatsApp Bot</CardTitle>
          <p className="text-sm text-muted-foreground">Teste o bot enquanto aguarda aprovação do Meta</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Número de telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma mensagem ainda. Envie uma mensagem para começar!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>💡 Dica: Este simulador usa o mesmo código que o webhook real.</p>
            <p>Quando o Meta aprovar, o bot funcionará exatamente assim!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
