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
    let webhookVerificationWorking = false
    try {
      const testResponse = await fetch(
        `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`,
        {
          method: "GET",
          headers: {
            "User-Agent": "Meta-Webhook-Test/1.0",
          },
        },
      )
      webhookAccessible = testResponse.ok
      const responseText = await testResponse.text()
      webhookVerificationWorking = responseText === "test123"

      console.log("[v0] Webhook acessível:", webhookAccessible)
      console.log("[v0] Webhook verification working:", webhookVerificationWorking)
      console.log("[v0] Response text:", responseText)
    } catch (error) {
      console.error("[v0] Erro ao testar webhook:", error)
    }

    let apiConnectionStatus = "unknown"
    let webhookConfigured = false
    let phoneNumberInfo = null
    let subscriptionStatus = null

    if (accessToken && phoneNumberId) {
      try {
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

          try {
            const subscriptionResponse = await fetch(
              `https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            )

            if (subscriptionResponse.ok) {
              subscriptionStatus = await subscriptionResponse.json()
              console.log("[v0] Status de subscrição:", subscriptionStatus)
              webhookConfigured = subscriptionStatus?.data?.length > 0
            }
          } catch (subError) {
            console.error("[v0] Erro ao verificar subscrições:", subError)
          }
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
      webhookVerificationWorking,
      webhookConfigured,
      apiConnectionStatus,
      phoneNumberInfo,
      subscriptionStatus,
      realMessagesReceived: false, // Seria true se tivéssemos logs de mensagens reais
      accessTokenExists: !!accessToken,
      phoneNumberIdExists: !!phoneNumberId,
      timestamp: new Date().toISOString(),
      recommendations: [],
      testEndpoints: {
        metaTest: `${protocol}://${currentUrl.replace(/^https?:\/\//, "")}/api/webhook/meta-test`,
        webhookTest: `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`,
      },
    }

    if (!webhookAccessible) {
      diagnostics.recommendations.push("❌ Webhook não está acessível - verifique se a URL está correta no Meta")
    }
    if (!webhookVerificationWorking) {
      diagnostics.recommendations.push("❌ Verificação do webhook falhou - verifique o token de verificação")
    }
    if (apiConnectionStatus === "error") {
      diagnostics.recommendations.push("❌ Token de acesso inválido - gere um novo token no Meta")
    }
    if (apiConnectionStatus === "connection_failed") {
      diagnostics.recommendations.push("❌ Falha na conexão com API - verifique conectividade")
    }
    if (!webhookConfigured) {
      diagnostics.recommendations.push(
        "⚠️ Webhook pode não estar configurado corretamente - verifique subscrições no Meta",
      )
    }
    if (webhookAccessible && webhookVerificationWorking && apiConnectionStatus === "connected" && !webhookConfigured) {
      diagnostics.recommendations.push(
        "🔧 Tudo parece correto, mas mensagens não chegam - verifique se o campo 'messages' está subscrito no Meta",
      )
    }

    console.log("[v0] Diagnóstico completo:", diagnostics)

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("[v0] Erro no diagnóstico do webhook:", error)
    return NextResponse.json({ error: "Erro interno no diagnóstico" }, { status: 500 })
  }
}
