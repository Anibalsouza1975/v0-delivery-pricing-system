import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando diagnóstico avançado do webhook...")

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

    let webhookAccessible = false
    try {
      const testResponse = await fetch(
        `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`,
        {
          method: "GET",
        },
      )
      webhookAccessible = testResponse.ok && (await testResponse.text()) === "test123"
      console.log("[v0] Webhook acessível:", webhookAccessible)
    } catch (error) {
      console.error("[v0] Erro ao testar webhook:", error)
    }

    let apiConnectionStatus = "unknown"
    let webhookConfigured = false
    let phoneNumberInfo = null

    if (accessToken && phoneNumberId) {
      try {
        // Teste de conexão com a API do WhatsApp
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        console.log("[v0] Status da API WhatsApp:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Dados do número de telefone:", data)

          apiConnectionStatus = "connected"
          phoneNumberInfo = data

          // Verificar se há configuração de webhook
          webhookConfigured = !!data.webhook_configuration
        } else {
          const errorText = await response.text()
          console.error("[v0] Erro na API WhatsApp:", errorText)
          apiConnectionStatus = "error"
        }
      } catch (error) {
        console.error("[v0] Erro ao conectar com API WhatsApp:", error)
        apiConnectionStatus = "connection_failed"
      }
    }

    const diagnostics = {
      webhookUrl,
      verifyToken,
      webhookAccessible,
      webhookConfigured,
      apiConnectionStatus,
      phoneNumberInfo,
      realMessagesReceived: false, // Seria true se tivéssemos logs de mensagens reais
      accessTokenExists: !!accessToken,
      phoneNumberIdExists: !!phoneNumberId,
      timestamp: new Date().toISOString(),
      recommendations: [],
    }

    if (!webhookAccessible) {
      diagnostics.recommendations.push("Webhook não está acessível - verifique a URL no Meta")
    }
    if (apiConnectionStatus === "error") {
      diagnostics.recommendations.push("Token de acesso inválido - verifique as credenciais")
    }
    if (!webhookConfigured) {
      diagnostics.recommendations.push("Webhook não configurado no Meta - configure na seção Webhooks")
    }

    console.log("[v0] Diagnóstico completo:", diagnostics)

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("[v0] Erro no diagnóstico do webhook:", error)
    return NextResponse.json({ error: "Erro interno no diagnóstico" }, { status: 500 })
  }
}
