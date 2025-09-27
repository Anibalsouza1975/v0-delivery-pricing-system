import { NextResponse } from "next/server"

export async function GET() {
  const timestamp = new Date().toISOString()

  // Teste de conectividade específico para Meta
  const testData = {
    status: "success",
    message: "Meta Connection Test - Endpoint accessible",
    timestamp,
    webhook_url: "https://v0-delivery-pricing-system.vercel.app/api/webhook/whatsapp",
    force_url: "https://v0-delivery-pricing-system.vercel.app/api/webhook/meta-force",
    verify_token: "cartago_webhook_2024",
    environment: {
      whatsapp_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
      phone_id: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      verify_token: !!process.env.WHATSAPP_VERIFY_TOKEN,
    },
  }

  return NextResponse.json(testData, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
  })
}
