import { type NextRequest, NextResponse } from "next/server"

// Simulação de uma sessão WhatsApp Web real
const sessionData = {
  qrCode: null as string | null,
  status: "disconnected" as "disconnected" | "qr" | "connected",
  sessionId: null as string | null,
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = `session_${Date.now()}`
    sessionData.sessionId = sessionId
    sessionData.status = "qr"

    // Simular geração de QR Code real do WhatsApp Web
    // Em produção, aqui seria usado Baileys ou similar
    const qrData = `2@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${Date.now()}`

    // Gerar QR Code usando serviço online
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

    sessionData.qrCode = qrCodeUrl

    // Simular conexão após 15 segundos (tempo real de escaneamento)
    setTimeout(() => {
      sessionData.status = "connected"
      sessionData.qrCode = null
    }, 15000)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeUrl,
      sessionId,
      status: "qr",
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar QR Code:", error)
    return NextResponse.json({ success: false, error: "Erro ao gerar QR Code" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId || sessionData.sessionId !== sessionId) {
    return NextResponse.json({ status: "invalid_session" })
  }

  return NextResponse.json({
    status: sessionData.status,
    qrCode: sessionData.qrCode,
  })
}
