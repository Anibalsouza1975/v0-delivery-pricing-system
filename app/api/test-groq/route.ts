import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    console.log("[v0] Testando Groq com mensagem:", message)

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um assistente de cálculo de frete da empresa Cartago Transportes.
          
Sua função é ajudar clientes a calcular o valor do frete baseado em:
- Origem e destino
- Peso da carga
- Tipo de carga

Tabela de preços base:
- Até 100km: R$ 50 + R$ 2 por kg
- 100-300km: R$ 100 + R$ 3 por kg
- 300-500km: R$ 200 + R$ 4 por kg
- Acima de 500km: R$ 300 + R$ 5 por kg

Seja educado, objetivo e sempre forneça um valor estimado quando possível.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content || "Sem resposta"

    console.log("[v0] Resposta do Groq:", response)

    return NextResponse.json({
      success: true,
      response,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error("[v0] Erro no Groq:", error)
    return NextResponse.json({ error: error.message || "Erro ao processar com Groq" }, { status: 500 })
  }
}
