import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// Verificação do webhook (Meta exige isso)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Token de verificação (configure no seu painel Meta)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "cartago_webhook_token"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] Webhook verificado com sucesso")
    return new NextResponse(challenge)
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// Recebimento de mensagens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Webhook recebido:", JSON.stringify(body, null, 2))

    // Verifica se é uma mensagem de texto
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0]
      const from = message.from // Número do cliente
      const text = message.text?.body // Texto da mensagem

      if (text) {
        // Processa mensagem com IA
        const resposta = await processarMensagemComIA(text, from)

        // Envia resposta via WhatsApp
        await enviarMensagemWhatsApp(from, resposta)
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[v0] Erro no webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processarMensagemComIA(mensagem: string, telefone: string): Promise<string> {
  try {
    // Contexto do negócio (seria carregado do banco de dados)
    const contextoNegocio = `
    Você é o assistente virtual do Cartago Burger Grill, um restaurante especializado em hambúrgueres artesanais.

    INFORMAÇÕES DO RESTAURANTE:
    - Nome: Cartago Burger Grill
    - Especialidade: Hambúrgueres artesanais e lanches gourmet
    - Horário: 18h às 23h (Segunda a Domingo)
    - Delivery: Disponível via WhatsApp
    - Tempo médio de entrega: 30-45 minutos

    CARDÁPIO PRINCIPAL:
    - Cartago Classic: R$ 18,90 (hambúrguer 150g, queijo, alface, tomate, molho especial)
    - Cartago Bacon: R$ 22,90 (hambúrguer 150g, bacon, queijo, cebola caramelizada)
    - Cartago Duplo: R$ 28,90 (2 hambúrgueres 150g, queijo duplo, molho especial)
    - Batata Frita: R$ 12,90 (porção individual)
    - Refrigerante Lata: R$ 5,90

    INSTRUÇÕES:
    - Seja cordial e prestativo
    - Ofereça o cardápio quando perguntado
    - Ajude com pedidos de forma clara
    - Informe sobre tempo de entrega
    - Se não souber algo, peça para falar com atendente humano
    - Use emojis moderadamente
    - Mantenha respostas concisas mas informativas
    `

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content: contextoNegocio,
        },
        {
          role: "user",
          content: mensagem,
        },
      ],
      maxTokens: 300,
      temperature: 0.7,
    })

    return text
  } catch (error) {
    console.error("[v0] Erro ao processar IA:", error)
    return "Desculpe, estou com dificuldades técnicas no momento. Um atendente humano entrará em contato em breve! 🤖"
  }
}

async function enviarMensagemWhatsApp(para: string, mensagem: string): Promise<void> {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneNumberId) {
      console.error("[v0] Tokens WhatsApp não configurados")
      return
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: para,
        type: "text",
        text: {
          body: mensagem,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Erro ao enviar mensagem WhatsApp:", error)
    } else {
      console.log("[v0] Mensagem enviada com sucesso para:", para)
    }
  } catch (error) {
    console.error("[v0] Erro na API WhatsApp:", error)
  }
}
