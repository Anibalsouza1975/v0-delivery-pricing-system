import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// Simulação de conexão WhatsApp Web
const isConnected = false
let qrCode = ""

export async function POST(request: NextRequest) {
  try {
    const { action, message, from } = await request.json()

    switch (action) {
      case "generate-qr":
        // Simular geração de QR Code
        qrCode = `whatsapp-web-qr-${Date.now()}`
        return NextResponse.json({
          success: true,
          qrCode: `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" fill="white"/>
              <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
                QR Code para WhatsApp Web
              </text>
              <text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">
                ${qrCode}
              </text>
            </svg>
          `).toString("base64")}`,
        })

      case "check-connection":
        return NextResponse.json({ connected: isConnected })

      case "send-message":
        if (!isConnected) {
          return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 })
        }

        // Processar mensagem com IA
        const response = await generateText({
          model: groq("llama-3.1-8b-instant"),
          messages: [
            {
              role: "system",
              content: `Você é o assistente virtual do Cartago Burger Grill, uma hamburgueria.
              
              Informações do restaurante:
              - Especialidade: Hambúrgueres artesanais
              - Horário: 18h às 23h (Ter a Dom)
              - Delivery disponível
              - Cardápio: Hambúrgueres, batatas, bebidas, sobremesas
              
              Seja amigável, prestativo e sempre ofereça ajuda com pedidos, cardápio e informações.
              Responda de forma natural e conversacional.`,
            },
            {
              role: "user",
              content: message,
            },
          ],
        })

        return NextResponse.json({
          success: true,
          reply: response.text,
          to: from,
        })

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Erro na API WhatsApp Web:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "WhatsApp Web API ativa",
    connected: isConnected,
    timestamp: new Date().toISOString(),
  })
}
