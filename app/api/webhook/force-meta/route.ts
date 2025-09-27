import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Endpoint que força o Meta a reconhecer o webhook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] ===== FORCE META VERIFICATION =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Full URL:", request.url)

  // Se não tem parâmetros, é um teste do navegador
  if (!mode && !token && !challenge) {
    return NextResponse.json({
      status: "✅ Force Meta endpoint funcionando!",
      timestamp: new Date().toISOString(),
      config: {
        WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN ? "✅ OK" : "❌ Missing",
        WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? "✅ OK" : "❌ Missing",
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ? "✅ OK" : "❌ Missing",
      },
      instructions:
        "Para verificação Meta, adicione os parâmetros: ?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=123",
    })
  }

  console.log("[v0] Mode:", mode)
  console.log("[v0] Token received:", token)
  console.log("[v0] Token expected:", process.env.WHATSAPP_VERIFY_TOKEN)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    console.log("[v0] ✅ FORCE verification SUCCESS - returning challenge")

    // Headers otimizados para Meta
    const response = new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })

    console.log("[v0] Response headers set, returning challenge:", challenge)
    return response
  }

  console.log("[v0] ❌ FORCE verification FAILED")
  console.log("[v0] - Mode check:", mode === "subscribe")
  console.log("[v0] - Token check:", token === process.env.WHATSAPP_VERIFY_TOKEN)
  console.log("[v0] - Challenge check:", !!challenge)

  return new Response("Verification failed", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
      "X-Error": "verification_failed",
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] ===== FORCE META POST =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Method:", request.method)
  console.log("[v0] URL:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))

  try {
    const rawBody = await request.text()
    console.log("[v0] FORCE POST - Raw body length:", rawBody.length)
    console.log("[v0] FORCE POST - Raw body:", rawBody)

    if (rawBody) {
      const body = JSON.parse(rawBody)
      console.log("[v0] FORCE POST - Parsed body:", JSON.stringify(body, null, 2))

      if (body.object === "whatsapp_business_account") {
        console.log("[v0] 🚀 FORCE META - WhatsApp message detected!")

        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]
        const messages = changes?.value?.messages

        if (messages && messages.length > 0) {
          console.log("[v0] 🎉 FORCE META - Real messages found:", messages.length)

          messages.forEach((message: any, index: number) => {
            console.log(`[v0] FORCE META - Message ${index + 1}:`, {
              from: message.from,
              text: message.text?.body,
              type: message.type,
              id: message.id,
              timestamp: message.timestamp,
            })
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: "force_received",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    )
  } catch (error) {
    console.log("[v0] FORCE POST error:", error)
    return new Response(
      JSON.stringify({
        status: "force_error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
