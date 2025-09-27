import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

    // Mostrar apenas os primeiros e últimos caracteres do token por segurança
    const tokenPreview = WHATSAPP_ACCESS_TOKEN
      ? `${WHATSAPP_ACCESS_TOKEN.substring(0, 10)}...${WHATSAPP_ACCESS_TOKEN.substring(WHATSAPP_ACCESS_TOKEN.length - 10)}`
      : "Token não encontrado"

    console.log("[v0] Token atual (preview):", tokenPreview)
    console.log("[v0] Token completo existe:", !!WHATSAPP_ACCESS_TOKEN)
    console.log("[v0] Tamanho do token:", WHATSAPP_ACCESS_TOKEN?.length || 0)

    // Testar o token atual
    let tokenStatus = "não testado"
    let errorDetails = null

    if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`, {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          },
        })

        if (response.ok) {
          tokenStatus = "válido"
        } else {
          const errorData = await response.json()
          tokenStatus = "inválido"
          errorDetails = errorData
        }
      } catch (error) {
        tokenStatus = "erro de conexão"
        errorDetails = { message: error.message }
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        tokenPreview,
        tokenExists: !!WHATSAPP_ACCESS_TOKEN,
        tokenLength: WHATSAPP_ACCESS_TOKEN?.length || 0,
        phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
        verifyTokenExists: !!WHATSAPP_VERIFY_TOKEN,
        tokenStatus,
        errorDetails,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Erro no debug do token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao fazer debug do token",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

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

    // Testar o novo token antes de sugerir atualização
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

    let testResult = null
    if (WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`, {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        })

        if (response.ok) {
          testResult = { status: "válido", message: "Token testado com sucesso" }
        } else {
          const errorData = await response.json()
          testResult = { status: "inválido", error: errorData }
        }
      } catch (error) {
        testResult = { status: "erro", error: { message: error.message } }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Token testado",
      testResult,
      instructions:
        testResult?.status === "válido"
          ? "Token válido! Atualize a variável WHATSAPP_ACCESS_TOKEN nas configurações do projeto."
          : "Token inválido. Verifique se o token está correto e tente novamente.",
    })
  } catch (error) {
    console.error("[v0] Erro ao testar novo token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao testar token",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
