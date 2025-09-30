import { NextResponse } from "next/server"

export async function GET() {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  return NextResponse.json({
    webhook_url: "https://v0-delivery-pricing-system.vercel.app/api/webhook/whatsapp",
    verify_token_configured: !!verifyToken,
    verify_token_value: verifyToken || "NÃO CONFIGURADO",
    verify_token_length: verifyToken?.length || 0,
    access_token_configured: !!accessToken,
    access_token_preview: accessToken
      ? `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 10)}`
      : "NÃO CONFIGURADO",
    phone_number_id: phoneNumberId || "NÃO CONFIGURADO",
    instructions: {
      step1: "Copie o valor de 'verify_token_value' acima",
      step2: "Cole EXATAMENTE esse valor no campo 'Verificar token' no Meta",
      step3: "Clique em 'Verificar e salvar'",
      step4: "Role para baixo e verifique se o campo 'messages' está com toggle azul (Assinado)",
    },
  })
}
