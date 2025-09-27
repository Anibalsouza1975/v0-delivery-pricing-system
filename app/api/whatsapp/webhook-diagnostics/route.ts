import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando diagnóstico do webhook...")

    const currentUrl = request.headers.get("host") || request.url
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const webhookUrl = `${protocol}://${currentUrl.replace(/^https?:\/\//, "")}/api/webhook/whatsapp`

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "cartago_webhook_2024"
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] Webhook URL atual:", webhookUrl)
    console.log("[v0] Verify Token:", verifyToken)
    console.log("[v0] Access Token exists:", !!accessToken)
    console.log("[v0] Phone Number ID:", phoneNumberId)

    // Check if webhook is configured in Meta by testing the WhatsApp API
    let webhookConfigured = false
    let webhookUrlInMeta = null
    let urlMismatch = false

    if (accessToken && phoneNumberId) {
      try {
        // Test WhatsApp API connection
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] WhatsApp API response:", data)

          // Check if webhook is configured
          webhookConfigured = !!data.webhook_configuration?.application
          webhookUrlInMeta = data.webhook_configuration?.application

          urlMismatch = webhookConfigured && webhookUrlInMeta !== webhookUrl

          console.log("[v0] Webhook configured in Meta:", webhookConfigured)
          console.log("[v0] Webhook URL in Meta:", webhookUrlInMeta)
          console.log("[v0] URL mismatch detected:", urlMismatch)
        }
      } catch (error) {
        console.error("[v0] Error checking WhatsApp API:", error)
      }
    }

    const diagnostics = {
      webhookUrl,
      webhookUrlInMeta,
      verifyToken,
      webhookConfigured,
      urlMismatch, // Adicionar detecção de incompatibilidade
      realMessagesReceived: false,
      accessTokenExists: !!accessToken,
      phoneNumberIdExists: !!phoneNumberId,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Diagnóstico completo:", diagnostics)

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("[v0] Erro no diagnóstico do webhook:", error)
    return NextResponse.json({ error: "Erro interno no diagnóstico" }, { status: 500 })
  }
}
