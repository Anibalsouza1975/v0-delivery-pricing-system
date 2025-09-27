import { type NextRequest, NextResponse } from "next/server"

// Endpoint específico para forçar reconhecimento do Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("=== META FORCE VERIFICATION ===")
  console.log("Timestamp:", new Date().toISOString())
  console.log("Mode:", mode)
  console.log("Token:", token)
  console.log("Challenge:", challenge)
  console.log("User-Agent:", request.headers.get("user-agent"))

  // Resposta mais agressiva para Meta
  if (mode === "subscribe" && token === "cartago_webhook_2024") {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  return new Response("Forbidden", { status: 403 })
}

export async function POST(request: NextRequest) {
  console.log("=== META FORCE POST ===")
  console.log("Timestamp:", new Date().toISOString())
  console.log("Headers:", Object.fromEntries(request.headers.entries()))

  const body = await request.text()
  console.log("Body:", body)

  return NextResponse.json({ status: "received", timestamp: new Date().toISOString() })
}
