import { NextResponse } from "next/server"

export async function GET() {
  const timestamp = new Date().toISOString()
  console.log("[v0] 🧪 Webhook test endpoint called at:", timestamp)

  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is accessible",
    timestamp,
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWhatsAppToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasWhatsAppPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasWhatsAppVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
      hasGroqKey: !!process.env.GROQ_API_KEY,
    },
  })
}

export async function POST() {
  const timestamp = new Date().toISOString()
  console.log("[v0] 🧪 Webhook test POST called at:", timestamp)

  return NextResponse.json({
    status: "ok",
    message: "Webhook POST endpoint is accessible",
    timestamp,
  })
}
