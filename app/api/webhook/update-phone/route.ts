import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumberId } = await request.json()

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Phone Number ID é obrigatório" }, { status: 400 })
    }

    // Retorna instruções para o usuário
    return NextResponse.json({
      message: "Para atualizar o Phone Number ID, você precisa:",
      steps: [
        "1. Acesse https://vercel.com/cartago-burger-grills-projects/v0-delivery-pricing-system/settings/environment-variables",
        "2. Encontre a variável WHATSAPP_PHONE_NUMBER_ID",
        '3. Clique em "Edit" ao lado dela',
        `4. Mude o valor para: ${phoneNumberId}`,
        '5. Clique em "Save"',
        "6. O sistema será reimplantado automaticamente",
      ],
      currentValue: process.env.WHATSAPP_PHONE_NUMBER_ID,
      newValue: phoneNumberId,
      vercelUrl:
        "https://vercel.com/cartago-burger-grills-projects/v0-delivery-pricing-system/settings/environment-variables",
    })
  } catch (error) {
    console.error("[v0] Erro ao processar atualização:", error)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST com { "phoneNumberId": "774222885783648" } para obter instruções de atualização',
    currentPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    correctPhoneNumberId: "774222885783648",
  })
}
