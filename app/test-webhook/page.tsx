"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function TestWebhookPage() {
  const [telefone, setTelefone] = useState("5541995336065")
  const [mensagem, setMensagem] = useState("Olá, quero fazer um pedido")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  const testarWebhook = async () => {
    setLoading(true)
    setResultado(null)

    try {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: telefone,
                      id: "test_" + Date.now(),
                      timestamp: Date.now(),
                      type: "text",
                      text: { body: mensagem },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }

      console.log("Enviando payload:", payload)

      const response = await fetch("/api/webhook/test-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResultado({ success: response.ok, data, status: response.status })
    } catch (error) {
      setResultado({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teste de Webhook WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Simule o recebimento de uma mensagem do WhatsApp para testar se o bot está funcionando
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Simular Mensagem</CardTitle>
            <CardDescription>Preencha os campos abaixo para simular uma mensagem do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Número de Telefone</label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="5541995336065"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem</label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite a mensagem de teste..."
                rows={4}
                disabled={loading}
              />
            </div>

            <Button onClick={testarWebhook} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Testar Webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {resultado && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {resultado.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Teste Concluído
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Erro no Teste
                  </>
                )}
                <Badge variant={resultado.success ? "default" : "destructive"}>Status: {resultado.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto">{JSON.stringify(resultado, null, 2)}</pre>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">O que verificar:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Verifique o console do navegador para logs detalhados</li>
                  <li>Verifique a aba "Conversas" para ver se a mensagem foi salva</li>
                  <li>Se houver erro, verifique se o Groq API Key está configurado</li>
                  <li>Se houver erro de envio, verifique o WhatsApp Access Token</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Checklist de Funcionamento:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  Webhook recebe a mensagem
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  Mensagem é salva no banco de dados
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  IA Groq processa e gera resposta
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">4</Badge>
                  Resposta é salva no banco
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">5</Badge>
                  Resposta é enviada via WhatsApp API
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Este teste simula o recebimento de uma mensagem. Para testar o envio real via
                WhatsApp, você precisa configurar o webhook no Meta for Developers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
