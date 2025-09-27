import { type NextRequest, NextResponse } from "next/server"

// Endpoint para testar se o webhook está recebendo dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] ===== TESTE WEBHOOK =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] Body:", JSON.stringify(body, null, 2))
    console.log("[v0] ===== FIM TESTE =====")

    return NextResponse.json({
      status: "received",
      timestamp: new Date().toISOString(),
      body: body,
    })
  } catch (error) {
    console.error("[v0] Erro no teste webhook:", error)
    return NextResponse.json({ error: "Error processing test" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "webhook test endpoint active",
    timestamp: new Date().toISOString(),
    url: request.url,
  })
}
