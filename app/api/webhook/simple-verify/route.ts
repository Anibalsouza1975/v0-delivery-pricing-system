import type { NextRequest } from "next/server"

// Endpoint de verificação simplificado para teste
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] ===== VERIFICAÇÃO SIMPLES =====")
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token:", token)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] Expected token:", process.env.WHATSAPP_VERIFY_TOKEN)

  // Verificação básica
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[v0] ✅ Verificação simples OK")
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  console.log("[v0] ❌ Verificação simples falhou")
  return new Response("Forbidden", { status: 403 })
}

// POST para receber mensagens (básico)
export async function POST(request: NextRequest) {
  console.log("[v0] POST recebido no endpoint simples")
  const body = await request.json()
  console.log("[v0] Body:", JSON.stringify(body, null, 2))

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
