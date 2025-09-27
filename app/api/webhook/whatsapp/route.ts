import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// Verificação do webhook (Meta exige isso)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

  console.log("[v0] ===== VERIFICAÇÃO WEBHOOK GET =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token recebido:", token)
  console.log("[v0] Token esperado:", VERIFY_TOKEN)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] URL completa:", request.url)
  console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))
  console.log("[v0] X-Forwarded-For:", request.headers.get("x-forwarded-for"))
  console.log("[v0] ===== FIM VERIFICAÇÃO =====")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] ✅ Webhook verificado com sucesso - Challenge:", challenge)
    return new NextResponse(challenge)
  }

  console.log("[v0] ❌ Webhook rejeitado - tokens não coincidem")
  return new NextResponse("Forbidden", { status: 403 })
}

const mensagensProcessadas = new Set<string>()

// Recebimento de mensagens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] ===== WEBHOOK POST RECEBIDO =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] User-Agent:", request.headers.get("user-agent"))
    console.log("[v0] X-Hub-Signature-256:", request.headers.get("x-hub-signature-256"))
    console.log("[v0] X-Forwarded-For:", request.headers.get("x-forwarded-for"))
    console.log("[v0] Content-Type:", request.headers.get("content-type"))
    console.log("[v0] Headers completos:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] Body completo:", JSON.stringify(body, null, 2))

    if (body.object === "whatsapp_business_account") {
      console.log("[v0] ✅ Webhook do WhatsApp Business Account detectado")

      // Verifica se é uma mensagem de texto
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0]
        const from = message.from // Número do cliente
        const text = message.text?.body // Texto da mensagem
        const messageId = message.id // ID único da mensagem

        console.log("[v0] Mensagem detectada - De:", from, "Texto:", text, "ID:", messageId)

        if (mensagensProcessadas.has(messageId)) {
          console.log("[v0] Mensagem já processada, ignorando:", messageId)
          return NextResponse.json({ status: "already_processed" })
        }

        mensagensProcessadas.add(messageId)

        if (text) {
          console.log("[v0] Processando mensagem com IA...")
          console.log("[v0] Usando modelo Groq com contexto do Cartago Burger Grill")

          // Processa mensagem com IA
          const resposta = await processarMensagemComIA(text, from)
          console.log("[v0] Resposta da IA gerada:", resposta)

          // Envia resposta via WhatsApp
          console.log("[v0] Enviando resposta via WhatsApp para:", from)
          const enviado = await enviarMensagemWhatsApp(from, resposta)

          if (enviado) {
            console.log("[v0] Mensagem enviada com sucesso!")
          } else {
            console.log("[v0] Falha ao enviar mensagem")
          }
        }
      } else {
        console.log("[v0] Webhook recebido mas não é uma mensagem de texto")
        console.log("[v0] Estrutura do body:", {
          hasEntry: !!body.entry,
          entryLength: body.entry?.length,
          hasChanges: !!body.entry?.[0]?.changes,
          changesLength: body.entry?.[0]?.changes?.length,
          hasValue: !!body.entry?.[0]?.changes?.[0]?.value,
          hasMessages: !!body.entry?.[0]?.changes?.[0]?.value?.messages,
          messagesLength: body.entry?.[0]?.changes?.[0]?.value?.messages?.length,
        })
      }
    } else {
      console.log("[v0] ⚠️ Webhook recebido mas não é do WhatsApp Business Account")
      console.log("[v0] Object type:", body.object)
      console.log("[v0] Possível webhook de teste ou configuração")
    }

    console.log("[v0] ===== FIM WEBHOOK =====")
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[v0] ❌ Erro no webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processarMensagemComIA(mensagem: string, telefone: string): Promise<string> {
  try {
    console.log("[v0] Iniciando processamento IA para:", mensagem)

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

    console.log("[v0] Chamando API Groq...")
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
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

    console.log("[v0] Resposta da IA recebida:", text)
    return text
  } catch (error) {
    console.error("[v0] Erro ao processar IA:", error)
    return "Desculpe, estou com dificuldades técnicas no momento. Um atendente humano entrará em contato em breve! 🤖"
  }
}

async function enviarMensagemWhatsApp(para: string, mensagem: string): Promise<boolean> {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] Verificando tokens - Token existe:", !!token, "Phone ID existe:", !!phoneNumberId)

    if (!token || !phoneNumberId) {
      console.error("[v0] Tokens WhatsApp não configurados")
      return false
    }

    console.log("[v0] Enviando para API WhatsApp:", `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`)
    console.log("[v0] Payload:", {
      messaging_product: "whatsapp",
      to: para,
      type: "text",
      text: { body: mensagem },
    })

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

    console.log("[v0] Status da resposta:", response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Erro ao enviar mensagem WhatsApp:", error)
      return false
    } else {
      const responseData = await response.json()
      console.log("[v0] Mensagem enviada com sucesso para:", para, "Resposta:", responseData)
      return true
    }
  } catch (error) {
    console.error("[v0] Erro na API WhatsApp:", error)
    return false
  }
}
