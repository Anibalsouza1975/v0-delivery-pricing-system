import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] ===== FORCE META TEST GET =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0] URL:", request.url)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))

  return NextResponse.json({
    status: "success",
    message: "Force Meta Test Endpoint - GET working",
    timestamp: new Date().toISOString(),
    url: request.url,
    userAgent: request.headers.get("user-agent"),
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== FORCE META TEST POST =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] User-Agent:", request.headers.get("user-agent"))

    const body = await request.json()
    console.log("[v0] Body recebido:", JSON.stringify(body, null, 2))

    return NextResponse.json({
      status: "success",
      message: "Force Meta Test Endpoint - POST working",
      timestamp: new Date().toISOString(),
      receivedData: body,
    })
  } catch (error) {
    console.error("[v0] Erro no force test:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error in force test",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
