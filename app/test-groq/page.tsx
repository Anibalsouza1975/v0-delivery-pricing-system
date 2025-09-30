"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function TestGroqPage() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const testGroq = async () => {
    if (!message.trim()) {
      setError("Digite uma mensagem primeiro")
      return
    }

    setLoading(true)
    setError("")
    setResponse("")

    try {
      const res = await fetch("/api/test-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar")
      }

      setResponse(data.response)
    } catch (err: any) {
      setError(err.message || "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste do Groq AI</CardTitle>
            <CardDescription>
              Teste se o Groq está funcionando corretamente (independente do webhook do WhatsApp)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem de teste</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite uma mensagem para testar o bot (ex: Quanto custa enviar de Curitiba para São Paulo?)"
                rows={4}
                className="w-full"
              />
            </div>

            <Button onClick={testGroq} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Testar Groq"
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Erro:</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {response && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-2">Resposta do Groq:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Groq AI</span>
              <span className="text-green-600">✓ Funcionando</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Webhook WhatsApp</span>
              <span className="text-yellow-600">⏳ Aguardando aprovação Meta</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Número próprio</span>
              <span className="text-yellow-600">⏳ Em análise</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
