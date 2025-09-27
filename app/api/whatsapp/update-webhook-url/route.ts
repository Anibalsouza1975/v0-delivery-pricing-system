import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json()

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "cartago_webhook_2024"

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: "Token de acesso ou ID do número não configurados",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Atualizando webhook URL para:", webhookUrl)

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        override_callback_uri: webhookUrl,
        verify_token: verifyToken,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("[v0] Webhook atualizado com sucesso:", result)

      return NextResponse.json({
        success: true,
        message: "Webhook URL atualizada com sucesso!",
        data: result,
      })
    } else {
      const error = await response.text()
      console.error("[v0] Erro ao atualizar webhook:", error)

      return NextResponse.json(
        {
          success: false,
          error: `Erro ao atualizar webhook: ${error}`,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("[v0] Erro na atualização do webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno na atualização",
      },
      { status: 500 },
    )
  }
}
