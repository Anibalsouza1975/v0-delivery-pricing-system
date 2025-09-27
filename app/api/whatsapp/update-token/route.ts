import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { newToken } = await request.json()

    if (!newToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Token não fornecido",
        },
        { status: 400 },
      )
    }

    // Testar o novo token primeiro
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "WHATSAPP_PHONE_NUMBER_ID não configurado",
        },
        { status: 400 },
      )
    }

    try {
      console.log("[v0] Testando novo token...")
      const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Token inválido:", errorData)
        return NextResponse.json({
          success: false,
          error: "Token inválido",
          details: errorData,
        })
      }

      console.log("[v0] Token válido! Preparando para atualizar...")

      // Instruções para o usuário atualizar manualmente
      return NextResponse.json({
        success: true,
        message: "Token validado com sucesso!",
        instructions: {
          step1: "Vá para o ícone de engrenagem (⚙️) no canto superior direito",
          step2: "Clique em 'Environment Variables'",
          step3: "Encontre 'WHATSAPP_ACCESS_TOKEN'",
          step4: "Cole o novo token e salve",
          step5: "Aguarde alguns segundos para o sistema processar",
        },
        tokenPreview: `${newToken.substring(0, 10)}...${newToken.substring(newToken.length - 10)}`,
      })
    } catch (error) {
      console.error("[v0] Erro ao testar token:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao conectar com WhatsApp API",
          details: error.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Erro ao processar atualização de token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
