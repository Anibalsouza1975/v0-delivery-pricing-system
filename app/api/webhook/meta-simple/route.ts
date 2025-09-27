import { type NextRequest, NextResponse } from "next/server"

// Endpoint super simples para teste do Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] ===== META SIMPLE VERIFICATION =====")
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token:", token)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] Expected token:", process.env.WHATSAPP_VERIFY_TOKEN)

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[v0] ✅ Simple verification SUCCESS")
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  console.log("[v0] ❌ Simple verification FAILED")
  return new Response("Forbidden", { status: 403 })
}

export async function POST(request: NextRequest) {
  console.log("[v0] ===== META SIMPLE POST =====")
  console.log("[v0] Timestamp:", new Date().toISOString())

  try {
    const body = await request.json()
    console.log("[v0] Simple POST body:", JSON.stringify(body, null, 2))

    return NextResponse.json({ status: "received" })
  } catch (error) {
    console.log("[v0] Simple POST error:", error)
    return NextResponse.json({ status: "error" })
  }
}
