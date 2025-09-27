import { NextResponse } from "next/server"

export async function GET() {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] Testando conexão WhatsApp...")
    console.log("[v0] Token exists:", !!token)
    console.log("[v0] Phone ID exists:", !!phoneNumberId)

    if (!token || !phoneNumberId) {
      return NextResponse.json({
        success: false,
        error: "Tokens do WhatsApp não configurados",
        details: {
          hasToken: !!token,
          hasPhoneId: !!phoneNumberId,
        },
      })
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=display_phone_number,verified_name,status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    console.log("[v0] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Error response:", errorText)

      let errorMessage = "Erro na conexão com WhatsApp API"

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        // Se não conseguir parsear, usa o texto original
        errorMessage = errorText
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      })
    }

    const data = await response.json()
    console.log("[v0] Success response:", data)

    return NextResponse.json({
      success: true,
      message: "Conexão com WhatsApp Business API funcionando",
      phoneNumber: data.display_phone_number || "Não disponível",
      verifiedName: data.verified_name || "Não verificado",
      status: data.status || "unknown",
    })
  } catch (error) {
    console.error("[v0] Erro ao testar conexão:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
