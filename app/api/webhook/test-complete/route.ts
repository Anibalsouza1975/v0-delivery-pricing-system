import { type NextRequest, NextResponse } from "next/server"

// Endpoint para testar se o Meta consegue acessar nosso servidor
export async function GET(request: NextRequest) {
  console.log("[v0] ===== TESTE COMPLETO GET =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))

  return NextResponse.json({
    status: "success",
    message: "Endpoint GET acessível pelo Meta",
    timestamp: new Date().toISOString(),
    url: request.url,
    userAgent: request.headers.get("user-agent"),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] ===== TESTE COMPLETO POST =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] URL:", request.url)
    console.log("[v0] User-Agent:", request.headers.get("user-agent"))
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] Body:", JSON.stringify(body, null, 2))
    console.log("[v0] ===== FIM TESTE =====")

    return NextResponse.json({
      status: "success",
      message: "Endpoint POST acessível pelo Meta",
      timestamp: new Date().toISOString(),
      receivedData: body,
    })
  } catch (error) {
    console.error("[v0] Erro no teste POST:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
