import { NextResponse } from "next/server"

export async function GET() {
  const currentPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const correctPhoneId = "774222885783648"

  return NextResponse.json({
    problem: "Phone Number ID incorreto",
    current: currentPhoneId,
    correct: correctPhoneId,
    isCorrect: currentPhoneId === correctPhoneId,
    instructions: {
      step1: "O Phone Number ID atual está incorreto",
      step2: `Valor atual: ${currentPhoneId}`,
      step3: `Valor correto: ${correctPhoneId}`,
      step4: "Como corrigir:",
      steps: [
        "1. Acesse https://vercel.com e faça login",
        "2. Vá para o projeto 'Delivery pricing system'",
        "3. Clique em 'Settings' no menu superior",
        "4. Clique em 'Environment Variables' no menu lateral",
        `5. Encontre a variável 'WHATSAPP_PHONE_NUMBER_ID'`,
        `6. Clique em 'Edit' e mude o valor de '${currentPhoneId}' para '${correctPhoneId}'`,
        "7. Clique em 'Save'",
        "8. Aguarde alguns segundos para o sistema reimplantar",
        "9. Envie uma mensagem de teste para o WhatsApp",
      ],
      alternative: "Ou peça para alguém com acesso ao Vercel fazer essa alteração",
    },
  })
}
