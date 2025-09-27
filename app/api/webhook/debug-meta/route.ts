import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] ===== DEBUG META GET ====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))

  return NextResponse.json({
    status: "debug_success",
    message: "Debug endpoint para Meta funcionando",
    timestamp: new Date().toISOString(),
    url: request.url,
    userAgent: request.headers.get("user-agent"),
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] ===== DEBUG META POST ====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))

  const body = await request.text()
  console.log("[v0] Body recebido:", body)

  return NextResponse.json({
    status: "debug_post_success",
    message: "Debug POST funcionando",
    timestamp: new Date().toISOString(),
    bodyLength: body.length,
    body: body,
  })
}
