import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { message, from } = await request.json()

    // Contexto do Cartago Burger Grill para a IA
    const context = `
    Você é o assistente virtual do Cartago Burger Grill, uma hamburgueria premium.
    
    CARDÁPIO PRINCIPAL:
    - Cartago Classic (R$ 28,90): Hambúrguer artesanal, queijo cheddar, alface, tomate, cebola roxa
    - Cartago Bacon (R$ 32,90): Hambúrguer artesanal, bacon crocante, queijo cheddar, molho especial
    - Cartago Veggie (R$ 26,90): Hambúrguer de grão-de-bico, queijo vegano, rúcula, tomate seco
    - Batata Rústica (R$ 18,90): Batatas artesanais com ervas e molho especial
    - Refrigerantes (R$ 6,90): Coca-Cola, Guaraná, Sprite
    - Milkshakes (R$ 14,90): Chocolate, Morango, Baunilha
    
    INFORMAÇÕES:
    - Horário: 18h às 23h (Terça a Domingo)
    - Delivery: Taxa R$ 5,00 (grátis acima de R$ 50,00)
    - Tempo de preparo: 25-35 minutos
    - Formas de pagamento: Dinheiro, PIX, Cartão
    
    Seja amigável, prestativo e sempre ofereça sugestões do cardápio.
    `

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
      maxTokens: 300,
    })

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Erro ao processar mensagem:", error)
    return NextResponse.json({ success: false, error: "Erro ao processar mensagem" }, { status: 500 })
  }
}
