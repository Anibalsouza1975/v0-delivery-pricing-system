import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando teste do webhook WhatsApp")

    // Simular uma mensagem recebida do WhatsApp
    const testMessage = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "801264823070601",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15551850889",
                  phone_number_id: "801264823070601",
                },
                messages: [
                  {
                    from: "5541992688237",
                    id: "test_message_id",
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: "Olá, gostaria de fazer um pedido",
                    },
                    type: "text",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    }

    console.log("[v0] Mensagem de teste criada:", JSON.stringify(testMessage, null, 2))

    // Processar a mensagem como se fosse real
    const entry = testMessage.entry[0]
    const change = entry.changes[0]
    const message = change.value.messages[0]

    console.log("[v0] Processando mensagem de teste do número:", message.from)
    console.log("[v0] Conteúdo da mensagem:", message.text.body)

    const { text: aiResponse } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [
        {
          role: "system",
          content: `Você é um assistente virtual do Cartago Burger Grill, uma hamburgueria especializada em hambúrgueres artesanais.
          
          Informações importantes:
          - Fazemos entregas na região
          - Temos promoções especiais
          - Horário de funcionamento: 18h às 23h
          - Especialidade: hambúrgueres artesanais e lanches gourmet
          
          Responda de forma amigável, profissional e concisa.`,
        },
        {
          role: "user",
          content: message.text.body,
        },
      ],
      maxTokens: 300,
      temperature: 0.7,
    })

    console.log("[v0] Resposta da IA gerada:", aiResponse)

    // Simular envio da resposta (não vamos realmente enviar no teste)
    const responseData = {
      success: true,
      message: "Teste do webhook executado com sucesso",
      testData: {
        receivedMessage: message.text.body,
        fromNumber: message.from,
        aiResponse: aiResponse,
        timestamp: new Date().toISOString(),
      },
    }

    console.log("[v0] Teste do webhook concluído com sucesso")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Erro no teste do webhook:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no teste do webhook",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
