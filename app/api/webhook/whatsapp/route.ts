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

              // This ensures the response appears in the dashboard even if WhatsApp sending fails
              await salvarRespostaNoBanco(from, resposta)
              console.log("[v0] ✅ Resposta salva no banco de dados")

              const enviado = await enviarMensagemWhatsApp(from, resposta)

              if (enviado) {
                console.log("[v0] ✅ Mensagem enviada com sucesso via WhatsApp para:", from)
                await atualizarStatusMensagem(from, resposta, "enviada")
              } else {
                console.log("[v0] ⚠️ Falha ao enviar via WhatsApp, mas resposta já está salva no banco")
                await atualizarStatusMensagem(from, resposta, "pendente")
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

    const isOrderTracking = /rastreio|rastrear|pedido|acompanhar|status.*pedido|onde.*está|número.*pedido/i.test(
      mensagem,
    )

    if (isOrderTracking) {
      console.log("[v0] Detectado: pergunta sobre rastreamento de pedido")

      // Extrair número do pedido se mencionado
      const numeroPedidoMatch = mensagem.match(/#?(\d{4,6})/)

      if (numeroPedidoMatch) {
        const numeroPedido = numeroPedidoMatch[1]
        console.log("[v0] Número do pedido detectado:", numeroPedido)

        // Buscar pedido no banco de dados
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "")}/api/pedidos/buscar?numero=${numeroPedido}`,
          )

          if (response.ok) {
            const { pedido } = await response.json()

            return (
              `📦 Encontrei seu pedido #${pedido.numero_pedido}!\n\n` +
              `Status: ${getStatusEmoji(pedido.status)} ${getStatusTexto(pedido.status)}\n` +
              `Total: R$ ${pedido.total.toFixed(2)}\n\n` +
              `${getStatusMensagem(pedido.status)}`
            )
          }
        } catch (error) {
          console.error("[v0] Erro ao buscar pedido:", error)
        }
      }

      // Se não encontrou número ou não conseguiu buscar, pedir o número
      return (
        "Para consultar seu pedido, por favor me informe o número do pedido. " +
        "Você pode encontrá-lo no comprovante ou na mensagem de confirmação. 📱\n\n" +
        "Exemplo: #12345"
      )
    }

    // Contexto do negócio (seria carregado do banco de dados)
    const contextoNegocio = `
    Você é o assistente virtual do Cartago Burger Grill, um restaurante especializado em hambúrgueres artesanais.

    INFORMAÇÕES DO RESTAURANTE:
    - Nome: Cartago Burger Grill
    - Especialidade: Hambúrgueres artesanais e lanches gourmet
    - Horário: 18h às 23h (Segunda a Domingo)
    - Delivery: Disponível via WhatsApp
    - Tempo médio de entrega: 30-45 minutos
    - WhatsApp para pedidos: (11) 9 1234-5678

    CARDÁPIO PRINCIPAL:
    - Cartago Classic: R$ 18,90 (hambúrguer 150g, queijo, alface, tomate, molho especial)
    - Cartago Bacon: R$ 22,90 (hambúrguer 150g, bacon, queijo, cebola caramelizada)
    - Cartago Duplo: R$ 28,90 (2 hambúrgueres 150g, queijo duplo, molho especial)
    - Batata Frita: R$ 12,90 (porção individual)
    - Refrigerante Lata: R$ 5,90

    RASTREAMENTO DE PEDIDOS:
    - Se o cliente perguntar sobre rastreamento, status ou localização do pedido, peça o número do pedido
    - Explique que com o número do pedido você pode consultar o status em tempo real
    - Seja educado e prestativo

    INSTRUÇÕES:
    - Seja cordial e prestativo
    - Ofereça o cardápio quando perguntado
    - Ajude com pedidos de forma clara
    - Informe sobre tempo de entrega
    - Para rastreamento, sempre peça o número do pedido
    - Se não souber algo específico, peça para falar com atendente humano
    - Use emojis moderadamente
    - Mantenha respostas concisas mas informativas
    - SEMPRE responda algo, nunca fique em silêncio
    - Se não entender a pergunta, peça esclarecimento de forma educada
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

    if (!text || text.trim().length === 0) {
      console.log("[v0] ⚠️ Resposta da IA vazia, usando fallback")
      return "Desculpe, não entendi sua mensagem. Pode reformular? Estou aqui para ajudar com nosso cardápio, pedidos e informações sobre o restaurante! 😊"
    }

    return text
  } catch (error) {
    console.error("[v0] Erro ao processar IA:", error)
    return "Desculpe, estou com dificuldades técnicas no momento. Um atendente humano entrará em contato em breve! 🤖"
  }
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    pendente: "⏳",
    confirmado: "✅",
    preparando: "👨‍🍳",
    pronto: "🍔",
    saiu_entrega: "🚗",
    entregue: "✅",
    cancelado: "❌",
  }
  return emojis[status] || "📦"
}

function getStatusTexto(status: string): string {
  const textos: Record<string, string> = {
    pendente: "Aguardando confirmação",
    confirmado: "Pedido confirmado",
    preparando: "Em preparação",
    pronto: "Pronto para retirada/entrega",
    saiu_entrega: "Saiu para entrega",
    entregue: "Entregue",
    cancelado: "Cancelado",
  }
  return textos[status] || "Status desconhecido"
}

function getStatusMensagem(status: string): string {
  const mensagens: Record<string, string> = {
    pendente: "Estamos processando seu pedido. Em breve você receberá a confirmação!",
    confirmado: "Seu pedido foi confirmado e já está sendo preparado!",
    preparando: "Nosso chef está preparando seu pedido com todo carinho! 👨‍🍳",
    pronto: "Seu pedido está pronto! Se for delivery, sairá em breve. Se for retirada, pode vir buscar!",
    saiu_entrega: "Seu pedido saiu para entrega! Chegará em breve. 🚗",
    entregue: "Seu pedido foi entregue! Bom apetite! 🍔",
    cancelado: "Seu pedido foi cancelado. Entre em contato conosco para mais informações.",
  }
  return mensagens[status] || "Entre em contato conosco para mais informações."
}

async function enviarMensagemWhatsApp(para: string, mensagem: string): Promise<boolean> {
  try {
    const token =
      "EAALON6v2KzMBPkQK6TJazZBm65CHLOZB3s4n4ZBRi8L3fWe6x7D2IsxV5cIMVdbQKWIZC3ZCPvFWZB6UogZBxBZCqUIdICZBnP438gY6gdRLlkZCee8LL2k5oaKsgIv3y8BmZCdPUCFpEMwZAe1ZA2XVsk3T495c4koQwtR4AICPZCOcoKdzHDzHNENi4cNcavd3rZBxwwHibHMd2ENwHLbOTV1J7KmCKwopIjCWh8iV6wEZC3ixgKD6XxAZD"
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] ===== ENVIANDO MENSAGEM WHATSAPP =====")
    console.log("[v0] Para:", para)
    console.log("[v0] Mensagem:", mensagem)
    console.log("[v0] Token existe:", !!token)
    console.log("[v0] 🔑 TOKEN HARDCODED ATIVO!")
    console.log("[v0] Token primeiros 10 chars:", token?.substring(0, 10))
    console.log("[v0] Token últimos 10 chars:", token?.substring(token.length - 10))
    console.log("[v0] Token length:", token?.length)
    console.log("[v0] Phone ID existe:", !!phoneNumberId)
    console.log("[v0] Phone ID:", phoneNumberId)

    if (!token || !phoneNumberId) {
      console.error("[v0] ❌ Tokens WhatsApp não configurados")
      console.error("[v0] - WHATSAPP_ACCESS_TOKEN:", !!token)
      console.error("[v0] - WHATSAPP_PHONE_NUMBER_ID:", !!phoneNumberId)
      await salvarMensagemFalha(para, mensagem, "Token não configurado")
      return false
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    const payload = {
      messaging_product: "whatsapp",
      to: para,
      type: "text",
      text: { body: mensagem },
    }

    console.log("[v0] URL da API:", url)
    console.log("[v0] Payload completo:", JSON.stringify(payload, null, 2))
    console.log("[v0] 🔐 Authorization header (REMOVER DEPOIS):", `Bearer ${token}`)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] Status da resposta:", response.status)
    console.log("[v0] Headers da resposta:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("[v0] Resposta completa:", responseText)

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar mensagem WhatsApp")
      console.error("[v0] Status:", response.status)
      console.error("[v0] Resposta:", responseText)

      try {
        const errorData = JSON.parse(responseText)
        console.error("[v0] Erro detalhado:", JSON.stringify(errorData, null, 2))

        if (errorData.error?.code === 190) {
          console.error("[v0] 🚨 TOKEN EXPIRADO! Você precisa gerar um novo token no Facebook Developer Console")
          console.error("[v0] 🚨 Erro:", errorData.error.message)
          console.error("[v0] 🚨 Token que falhou (primeiros 20 chars):", token?.substring(0, 20))
          await salvarMensagemFalha(para, mensagem, `Token expirado: ${errorData.error.message}`)
        } else {
          await salvarMensagemFalha(
            para,
            mensagem,
            `Erro ${response.status}: ${errorData.error?.message || responseText}`,
          )
        }
      } catch (e) {
        console.error("[v0] Não foi possível parsear erro como JSON")
        await salvarMensagemFalha(para, mensagem, `Erro ${response.status}: ${responseText}`)
      }

      return false
    } else {
      console.log("[v0] ✅ Mensagem enviada com sucesso!")

      try {
        const responseData = JSON.parse(responseText)
        console.log("[v0] Dados da resposta:", JSON.stringify(responseData, null, 2))
      } catch (e) {
        console.log("[v0] Resposta não é JSON válido:", responseText)
      }

      console.log("[v0] ===== FIM ENVIO MENSAGEM =====")
      return true
    }
  } catch (error) {
    console.error("[v0] ❌ Erro crítico na API WhatsApp:", error)
    console.error("[v0] Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    await salvarMensagemFalha(
      para,
      mensagem,
      `Erro crítico: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
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
      const { error } = await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        message_id: `ai_${Date.now()}`,
        tipo: "bot",
        conteudo: resposta,
        status: "pendente", // Changed from "enviada" to "pendente"
      })

      if (error) {
        console.error("[v0] Erro ao salvar resposta IA:", error)
      } else {
        console.log("[v0] Resposta IA salva com sucesso (status: pendente)")
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao salvar resposta IA:", error)
  }
}

async function salvarMensagemFalha(telefone: string, mensagem: string, erro: string) {
  try {
    console.log("[v0] 💾 Salvando mensagem com falha para retry posterior")
    console.log("[v0] Telefone:", telefone)
    console.log("[v0] Erro:", erro)

    // Buscar conversa existente
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa) {
      // Salvar mensagem com status de falha
      const { error } = await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        message_id: `failed_${Date.now()}`,
        tipo: "bot",
        conteudo: mensagem,
        status: "falha", // Mark as failed
        metadata: { erro, timestamp: new Date().toISOString() },
      })

      if (error) {
        console.error("[v0] Erro ao salvar mensagem com falha:", error)
      } else {
        console.log("[v0] ✅ Mensagem com falha salva para retry posterior")
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao salvar mensagem com falha:", error)
  }
}

async function atualizarStatusMensagem(telefone: string, conteudo: string, novoStatus: string) {
  try {
    console.log("[v0] Atualizando status da mensagem para:", novoStatus)

    // Buscar conversa existente
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa) {
      // Update the most recent bot message with this content
      const { error } = await supabase
        .from("whatsapp_mensagens")
        .update({ status: novoStatus })
        .eq("conversa_id", conversa.id)
        .eq("tipo", "bot")
        .eq("conteudo", conteudo)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("[v0] Erro ao atualizar status da mensagem:", error)
      } else {
        console.log("[v0] Status da mensagem atualizado para:", novoStatus)
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao atualizar status da mensagem:", error)
  }
}
