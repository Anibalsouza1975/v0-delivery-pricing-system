import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const userAgent = request.headers.get("user-agent") || "unknown"
  const forwardedFor = request.headers.get("x-forwarded-for") || "unknown"

  console.log("[v0] ===== META TEST ENDPOINT =====")
  console.log("[v0] Timestamp:", timestamp)
  console.log("[v0] User-Agent:", userAgent)
  console.log("[v0] X-Forwarded-For:", forwardedFor)
  console.log("[v0] URL:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0] ===== FIM META TEST =====")

  return NextResponse.json({
    status: "success",
    message: "Meta test endpoint accessible",
    timestamp,
    userAgent,
    forwardedFor,
    url: request.url,
    isMetaBot: userAgent.toLowerCase().includes("facebook") || userAgent.toLowerCase().includes("meta"),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const timestamp = new Date().toISOString()

    console.log("[v0] ===== META TEST POST =====")
    console.log("[v0] Timestamp:", timestamp)
    console.log("[v0] Body:", JSON.stringify(body, null, 2))
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] ===== FIM META TEST POST =====")

    return NextResponse.json({
      status: "success",
      message: "Meta test POST received",
      timestamp,
      receivedData: body,
    })
  } catch (error) {
    console.error("[v0] Erro no Meta test POST:", error)
    return NextResponse.json({ error: "Error processing POST" }, { status: 500 })
  }
}
