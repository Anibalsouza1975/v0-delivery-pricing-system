import { type NextRequest, NextResponse } from "next/server"

// Endpoint para testar se o Meta consegue acessar nosso servidor
export async function GET(request: NextRequest) {
  console.log("[v0] ===== TESTE META GET =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0] ===== FIM TESTE META =====")

  return NextResponse.json({
    status: "success",
    message: "Endpoint acessível pelo Meta",
    timestamp: new Date().toISOString(),
    url: request.url,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] ===== TESTE META POST =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Body:", JSON.stringify(body, null, 2))
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] ===== FIM TESTE META =====")

    return NextResponse.json({
      status: "success",
      message: "POST recebido com sucesso",
      receivedData: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Erro no teste Meta:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
