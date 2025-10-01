import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    webhook_url: "https://v0-delivery-pricing-system.vercel.app/api/webhook/whatsapp",
    message: "Webhook está acessível e funcionando",
    instructions: [
      "1. Verifique se o webhook está configurado no Meta",
      "2. URL do webhook: https://v0-delivery-pricing-system.vercel.app/api/webhook/whatsapp",
      "3. Verify Token: cartago_webhook_2024",
      "4. Certifique-se de que o campo 'messages' está subscrito (toggle azul)",
      "5. Envie uma mensagem de teste para o número WhatsApp",
    ],
  })
}
