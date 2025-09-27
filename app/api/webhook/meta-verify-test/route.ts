import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] ===== TESTE VERIFICAÇÃO META =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token:", token)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))
  console.log("[v0] ===== FIM TESTE =====")

  // Se não tem parâmetros, retorna info do endpoint
  if (!mode && !token && !challenge) {
    return NextResponse.json({
      status: "success",
      message: "Meta Verify Test Endpoint",
      timestamp: new Date().toISOString(),
      url: request.url,
      expectedParams: {
        "hub.mode": "subscribe",
        "hub.verify_token": "cartago_webhook_2024",
        "hub.challenge": "any_string",
      },
    })
  }

  // Verificação simples
  if (mode === "subscribe" && token === "cartago_webhook_2024" && challenge) {
    console.log("[v0] ✅ Teste de verificação passou!")
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return new NextResponse("Verification failed", { status: 403 })
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST recebido no endpoint de teste")
  const body = await request.text()
  console.log("[v0] Body:", body)

  return NextResponse.json({
    status: "received",
    timestamp: new Date().toISOString(),
    body: body,
  })
}
