import { type NextRequest, NextResponse } from "next/server"

// Endpoint para teste direto no navegador
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] ===== BROWSER TEST ENDPOINT =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))

  // Se não tem parâmetros, é um teste do navegador
  if (!mode && !token && !challenge) {
    const testInfo = {
      status: "✅ Endpoint funcionando!",
      timestamp: new Date().toISOString(),
      environment: {
        WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN ? "✅ Configurado" : "❌ Não configurado",
        WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? "✅ Configurado" : "❌ Não configurado",
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ? "✅ Configurado" : "❌ Não configurado",
      },
      instructions: {
        "Para teste Meta": "Adicione ?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=123",
        "URL completa Meta": `${request.url}?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test123`,
      },
    }

    return NextResponse.json(testInfo, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  }

  // Se tem parâmetros, é uma verificação do Meta
  console.log("[v0] Meta verification attempt:")
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token:", token)
  console.log("[v0] Challenge:", challenge)

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    console.log("[v0] ✅ Meta verification SUCCESS")
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  console.log("[v0] ❌ Meta verification FAILED")
  return new Response("Verification failed", { status: 403 })
}

export async function POST(request: NextRequest) {
  console.log("[v0] ===== BROWSER TEST POST =====")
  console.log("[v0] Timestamp:", new Date().toISOString())

  try {
    const body = await request.json()
    console.log("[v0] 🎉 POST received:", JSON.stringify(body, null, 2))

    if (body.object === "whatsapp_business_account") {
      console.log("[v0] 🚀 WhatsApp message detected!")
      const messages = body.entry?.[0]?.changes?.[0]?.value?.messages
      if (messages) {
        messages.forEach((msg: any, index: number) => {
          console.log(`[v0] Message ${index + 1}:`, {
            from: msg.from,
            text: msg.text?.body,
            type: msg.type,
          })
        })
      }
    }

    return NextResponse.json({
      status: "received",
      timestamp: new Date().toISOString(),
      message: "Webhook funcionando!",
    })
  } catch (error) {
    console.log("[v0] POST error:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
