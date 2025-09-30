import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] 🧪 ===== TESTE MANUAL DE WEBHOOK =====")

  try {
    const body = await request.json()
    console.log("[v0] Body recebido:", JSON.stringify(body, null, 2))

    // Simular chamada ao webhook real
    const webhookUrl = `${request.nextUrl.origin}/api/webhook/whatsapp`
    console.log("[v0] Chamando webhook real:", webhookUrl)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.text()
    console.log("[v0] Resposta do webhook:", result)
    console.log("[v0] Status:", response.status)

    return NextResponse.json({
      success: true,
      webhookResponse: result,
      webhookStatus: response.status,
    })
  } catch (error) {
    console.error("[v0] Erro no teste:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint de teste do webhook. Use POST com body de mensagem do WhatsApp.",
    example: {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "5541995336065",
                    id: "test_" + Date.now(),
                    timestamp: Date.now(),
                    type: "text",
                    text: { body: "teste" },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  })
}
