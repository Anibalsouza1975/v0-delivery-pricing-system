import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@supabase/supabase-js"

// Verificação do webhook (Meta exige isso)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

  console.log("[v0] ===== VERIFICAÇÃO WEBHOOK GET =====")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] URL completa:", request.url)
  console.log("[v0] Mode:", mode)
  console.log("[v0] Token recebido:", token)
  console.log("[v0] Token esperado:", VERIFY_TOKEN)
  console.log("[v0] Challenge:", challenge)
  console.log("[v0] User-Agent:", request.headers.get("user-agent"))
  console.log("[v0] X-Forwarded-For:", request.headers.get("x-forwarded-for"))

  if (!mode || !token || !challenge) {
    console.log("[v0] ❌ Parâmetros obrigatórios ausentes")
    console.log("[v0] - Mode presente:", !!mode)
    console.log("[v0] - Token presente:", !!token)
    console.log("[v0] - Challenge presente:", !!challenge)

    // Retorna resposta mais específica para o Meta
    return new Response("Bad Request - Missing required parameters", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    })
  }

  if (!VERIFY_TOKEN) {
    console.log("[v0] ❌ WHATSAPP_VERIFY_TOKEN não configurado no servidor")
    return new Response("Server Configuration Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    })
  }

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] ✅ Webhook verificado com sucesso!")
    console.log("[v0] Retornando challenge:", challenge)
    console.log("[v0] ===== FIM VERIFICAÇÃO SUCESSO =====")

    // Resposta otimizada para Meta
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  console.log("[v0] ❌ Webhook rejeitado")
  console.log("[v0] - Mode correto:", mode === "subscribe")
  console.log("[v0] - Token correto:", token === VERIFY_TOKEN)
  console.log("[v0] ===== FIM VERIFICAÇÃO FALHA =====")

  return new Response("Forbidden - Invalid verification", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  })
}

const mensagensProcessadas = new Set<string>()
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Recebimento de mensagens
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== WEBHOOK POST RECEBIDO =====")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Method:", request.method)
    console.log("[v0] URL:", request.url)
    console.log("[v0] User-Agent:", request.headers.get("user-agent"))
    console.log("[v0] X-Hub-Signature-256:", request.headers.get("x-hub-signature-256"))
    console.log("[v0] X-Forwarded-For:", request.headers.get("x-forwarded-for"))
    console.log("[v0] Content-Type:", request.headers.get("content-type"))
    console.log("[v0] Content-Length:", request.headers.get("content-length"))
    console.log("[v0] Headers completos:", Object.fromEntries(request.headers.entries()))

    // Verificar se o body existe
    const rawBody = await request.text()
    console.log("[v0] Raw body length:", rawBody.length)
    console.log("[v0] Raw body:", rawBody)

    if (!rawBody) {
      console.log("[v0] ⚠️ Body vazio recebido")
      return NextResponse.json({ status: "empty_body" })
    }

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error("[v0] ❌ Erro ao fazer parse do JSON:", parseError)
      console.log("[v0] Raw body que causou erro:", rawBody)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log("[v0] Body parseado com sucesso:", JSON.stringify(body, null, 2))
    console.log("[v0] Tipo de objeto:", body.object)
    console.log("[v0] É WhatsApp Business Account?", body.object === "whatsapp_business_account")

    if (body.object === "whatsapp_business_account") {
      console.log("[v0] ✅ Webhook do WhatsApp Business Account detectado")

      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages = value?.messages
      const statuses = value?.statuses

      console.log("[v0] Estrutura detalhada:")
      console.log("[v0] - Entry exists:", !!entry)
      console.log("[v0] - Entry ID:", entry?.id)
      console.log("[v0] - Changes exists:", !!changes)
      console.log("[v0] - Changes field:", changes?.field)
      console.log("[v0] - Value exists:", !!value)
      console.log("[v0] - Messages exists:", !!messages)
      console.log("[v0] - Messages length:", messages?.length || 0)
      console.log("[v0] - Statuses exists:", !!statuses)
      console.log("[v0] - Statuses length:", statuses?.length || 0)

      // Processar mensagens recebidas
      if (messages && messages.length > 0) {
        for (const message of messages) {
          const from = message.from
          const text = message.text?.body
          const messageId = message.id
          const timestamp = message.timestamp

          console.log("[v0] 🎉 MENSAGEM REAL DETECTADA!")
          console.log("[v0] - De:", from)
          console.log("[v0] - Texto:", text)
          console.log("[v0] - ID:", messageId)
          console.log("[v0] - Timestamp:", timestamp)
          console.log("[v0] - Tipo:", message.type)

          if (mensagensProcessadas.has(messageId)) {
            console.log("[v0] Mensagem já processada, ignorando:", messageId)
            continue
          }

          mensagensProcessadas.add(messageId)

          if (text && message.type === "text") {
            console.log("[v0] Processando mensagem de texto com IA...")

            try {
              await salvarConversaNoBanco(from, text, messageId)
              const resposta = await processarMensagemComIA(text, from)
              console.log("[v0] Resposta da IA gerada:", resposta)

              const enviado = await enviarMensagemWhatsApp(from, resposta)

              if (enviado) {
                console.log("[v0] ✅ Mensagem enviada com sucesso para:", from)
                await salvarRespostaNoBanco(from, resposta)
              } else {
                console.log("[v0] ❌ Falha ao enviar mensagem para:", from)
              }
            } catch (error) {
              console.error("[v0] ❌ Erro ao processar mensagem:", error)
            }
          } else {
            console.log("[v0] Mensagem não é de texto ou não tem conteúdo, tipo:", message.type)
          }
        }
      }

      // Processar status de mensagens (entregue, lida, etc.)
      if (statuses && statuses.length > 0) {
        console.log("[v0] 📊 Status de mensagens recebidos:")
        for (const status of statuses) {
          console.log("[v0] - Status ID:", status.id)
          console.log("[v0] - Status:", status.status)
          console.log("[v0] - Timestamp:", status.timestamp)
          console.log("[v0] - Recipient ID:", status.recipient_id)
        }
      }

      if (!messages?.length && !statuses?.length) {
        console.log("[v0] ⚠️ Webhook recebido mas sem mensagens ou status")
        console.log("[v0] Pode ser webhook de teste ou configuração")
      }
    } else {
      console.log("[v0] ⚠️ Webhook recebido mas não é do WhatsApp Business Account")
      console.log("[v0] Object type:", body.object)
      console.log("[v0] Possível webhook de teste ou outro serviço")
    }

    console.log("[v0] ===== FIM WEBHOOK =====")
    return NextResponse.json({ status: "success", received: true })
  } catch (error) {
    console.error("[v0] ❌ Erro crítico no webhook:", error)
    console.error("[v0] Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
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

async function salvarConversaNoBanco(telefone: string, mensagem: string, messageId: string) {
  try {
    console.log("[v0] Salvando conversa no banco:", telefone, mensagem)

    // Verificar se já existe uma conversa para este telefone
    const { data: conversaExistente } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    let conversaId = conversaExistente?.id

    if (!conversaId) {
      // Criar nova conversa
      const { data: novaConversa, error: erroConversa } = await supabase
        .from("whatsapp_conversas")
        .insert({
          cliente_telefone: telefone,
          cliente_nome: telefone, // Será atualizado depois se necessário
          status: "ativa",
          ultima_mensagem: mensagem,
          session_id: `session_${telefone}_${Date.now()}`,
        })
        .select("id")
        .single()

      if (erroConversa) {
        console.error("[v0] Erro ao criar conversa:", erroConversa)
        return
      }

      conversaId = novaConversa.id
      console.log("[v0] Nova conversa criada:", conversaId)
    } else {
      // Atualizar conversa existente
      await supabase
        .from("whatsapp_conversas")
        .update({
          ultima_mensagem: mensagem,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversaId)

      console.log("[v0] Conversa atualizada:", conversaId)
    }

    // Alterando tipo de "recebida" para "cliente" para compatibilidade com interface
    // Salvar mensagem
    const { error: erroMensagem } = await supabase.from("whatsapp_mensagens").insert({
      conversa_id: conversaId,
      message_id: messageId,
      tipo: "cliente", // Mudança: era "recebida", agora "cliente"
      conteudo: mensagem,
      status: "entregue",
    })

    if (erroMensagem) {
      console.error("[v0] Erro ao salvar mensagem:", erroMensagem)
    } else {
      console.log("[v0] Mensagem salva com sucesso")
    }
  } catch (error) {
    console.error("[v0] Erro ao salvar no banco:", error)
  }
}

async function salvarRespostaNoBanco(telefone: string, resposta: string) {
  try {
    console.log("[v0] Salvando resposta da IA no banco:", telefone)

    // Buscar conversa existente
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa) {
      // Alterando tipo de "enviada" para "bot" para compatibilidade com interface
      // Salvar resposta da IA
      const { error } = await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        message_id: `ai_${Date.now()}`,
        tipo: "bot", // Mudança: era "enviada", agora "bot"
        conteudo: resposta,
        status: "enviada",
      })

      if (error) {
        console.error("[v0] Erro ao salvar resposta IA:", error)
      } else {
        console.log("[v0] Resposta IA salva com sucesso")
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao salvar resposta IA:", error)
  }
}
