import { type NextRequest, NextResponse } from "next/server"

// Endpoint de debug específico para Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const debugInfo = {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: "GET",
    mode,
    token_received: token,
    token_expected: process.env.WHATSAPP_VERIFY_TOKEN,
    challenge,
    headers: Object.fromEntries(request.headers.entries()),
    user_agent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
  }

  console.log("[v0] ===== META DEBUG VERIFICATION =====")
  console.log("[v0] Debug info:", JSON.stringify(debugInfo, null, 2))

  if (mode === "subscribe") {
    if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("[v0] ✅ DEBUG verification SUCCESS")
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "X-Debug-Status": "success",
          "X-Debug-Timestamp": new Date().toISOString(),
        },
      })
    } else {
      console.log("[v0] ❌ DEBUG verification FAILED - token mismatch")
      return new Response(`Token mismatch. Expected: ${process.env.WHATSAPP_VERIFY_TOKEN}, Got: ${token}`, {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
          "X-Debug-Status": "token_mismatch",
        },
      })
    }
  }

  console.log("[v0] ❌ DEBUG verification FAILED - invalid mode")
  return new Response(`Invalid mode. Expected: subscribe, Got: ${mode}`, {
    status: 400,
    headers: {
      "Content-Type": "text/plain",
      "X-Debug-Status": "invalid_mode",
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] ===== META DEBUG POST =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))

  try {
    const rawBody = await request.text()
    console.log("[v0] Raw body length:", rawBody.length)
    console.log("[v0] Raw body:", rawBody)

    if (rawBody) {
      const body = JSON.parse(rawBody)
      console.log("[v0] Parsed body:", JSON.stringify(body, null, 2))

      if (body.object === "whatsapp_business_account") {
        console.log("[v0] 🎉 WHATSAPP MESSAGE DETECTED IN DEBUG!")
        const messages = body.entry?.[0]?.changes?.[0]?.value?.messages
        if (messages) {
          console.log("[v0] Messages found:", messages.length)
          messages.forEach((msg: any, index: number) => {
            console.log(`[v0] Message ${index + 1}:`, {
              from: msg.from,
              text: msg.text?.body,
              type: msg.type,
              id: msg.id,
            })
          })
        }
      }
    }

    return NextResponse.json({
      status: "debug_received",
      timestamp: new Date().toISOString(),
      body_length: rawBody.length,
    })
  } catch (error) {
    console.log("[v0] Debug POST error:", error)
    return NextResponse.json({
      status: "debug_error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
