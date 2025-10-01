import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

const mensagensProcessadas = new Set<string>()
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  // Log IMMEDIATELY - before any processing
  console.log("[v0] 🔔 ===== WEBHOOK GET CHAMADO =====", new Date().toISOString())

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

export async function POST(request: NextRequest) {
  // Log IMMEDIATELY when POST is called
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
  console.log(`[v0] 🔔 ===== WEBHOOK POST CHAMADO ===== [${requestId}]`, new Date().toISOString())
  console.log(`[v0] 🚀 ===== WEBHOOK POST INICIADO [${requestId}] =====`)

  try {
    console.log(`[v0] [${requestId}] User-Agent:`, request.headers.get("user-agent"))
    console.log(`[v0] [${requestId}] X-Hub-Signature-256:`, request.headers.get("x-hub-signature-256"))
    console.log(`[v0] [${requestId}] X-Forwarded-For:`, request.headers.get("x-forwarded-for"))
    console.log(`[v0] [${requestId}] Content-Type:`, request.headers.get("content-type"))
    console.log(`[v0] [${requestId}] Content-Length:`, request.headers.get("content-length"))

    // Verificar se o body existe
    const rawBody = await request.text()
    console.log(`[v0] [${requestId}] Raw body length:`, rawBody.length)
    console.log(`[v0] [${requestId}] Raw body:`, rawBody)

    if (!rawBody) {
      console.log(`[v0] [${requestId}] ⚠️ Body vazio recebido`)
      return NextResponse.json({ status: "empty_body", requestId })
    }

    let body
    try {
      body = JSON.parse(rawBody)
      console.log(`[v0] [${requestId}] ✅ Body parseado com sucesso`)
    } catch (parseError) {
      console.error(`[v0] [${requestId}] ❌ Erro ao fazer parse do JSON:`, parseError)
      console.log(`[v0] [${requestId}] Raw body que causou erro:`, rawBody)
      return NextResponse.json({ error: "Invalid JSON", requestId }, { status: 400 })
    }

    console.log(`[v0] [${requestId}] Body completo:`, JSON.stringify(body, null, 2))
    console.log(`[v0] [${requestId}] Tipo de objeto:`, body.object)

    if (body.object === "whatsapp_business_account") {
      console.log(`[v0] [${requestId}] ✅ Webhook do WhatsApp Business Account detectado`)

      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages = value?.messages
      const statuses = value?.statuses

      console.log(`[v0] [${requestId}] Estrutura detalhada:`)
      console.log(`[v0] [${requestId}] - Entry exists:`, !!entry)
      console.log(`[v0] [${requestId}] - Messages exists:`, !!messages)
      console.log(`[v0] [${requestId}] - Messages length:`, messages?.length || 0)

      // Processar mensagens recebidas
      if (messages && messages.length > 0) {
        console.log(`[v0] [${requestId}] 🎉 ${messages.length} MENSAGEM(NS) DETECTADA(S)!`)

        for (const message of messages) {
          const from = message.from
          const text = message.text?.body
          const messageId = message.id

          console.log(`[v0] [${requestId}] 📨 PROCESSANDO MENSAGEM:`)
          console.log(`[v0] [${requestId}] - De:`, from)
          console.log(`[v0] [${requestId}] - Texto:`, text)
          console.log(`[v0] [${requestId}] - ID:`, messageId)
          console.log(`[v0] [${requestId}] - Tipo:`, message.type)

          if (mensagensProcessadas.has(messageId)) {
            console.log(`[v0] [${requestId}] ⏭️ Mensagem já processada, ignorando:`, messageId)
            continue
          }

          mensagensProcessadas.add(messageId)
          console.log(`[v0] [${requestId}] ✅ Mensagem marcada como processada`)

          if (text && message.type === "text") {
            console.log(`[v0] [${requestId}] 🤖 Iniciando processamento com IA...`)

            try {
              console.log(`[v0] [${requestId}] 💾 Salvando mensagem do cliente no banco...`)
              await salvarConversaNoBanco(from, text, messageId)
              console.log(`[v0] [${requestId}] ✅ Mensagem do cliente salva`)

              console.log(`[v0] [${requestId}] 🧠 Gerando resposta com Groq AI...`)
              const resposta = await processarMensagemComIA(text, from)
              console.log(`[v0] [${requestId}] ✅ Resposta da IA gerada:`, resposta.substring(0, 100) + "...")

              console.log(`[v0] [${requestId}] 💾 Salvando resposta da IA no banco...`)
              await salvarRespostaNoBanco(from, resposta)
              console.log(`[v0] [${requestId}] ✅ Resposta da IA salva no banco`)

              console.log(`[v0] [${requestId}] 📤 Tentando enviar via WhatsApp...`)
              const enviado = await enviarMensagemWhatsApp(from, resposta)

              if (enviado) {
                console.log(`[v0] [${requestId}] ✅ Mensagem enviada com sucesso via WhatsApp`)
                await atualizarStatusMensagem(from, resposta, "enviada")
              } else {
                console.log(`[v0] [${requestId}] ⚠️ Falha ao enviar via WhatsApp (mas resposta está no banco)`)
                await atualizarStatusMensagem(from, resposta, "pendente")
              }
            } catch (error) {
              console.error(`[v0] [${requestId}] ❌ Erro ao processar mensagem:`, error)
              console.error(`[v0] [${requestId}] Stack:`, error instanceof Error ? error.stack : "No stack")
            }
          } else {
            console.log(`[v0] [${requestId}] ⏭️ Mensagem não é de texto, tipo:`, message.type)
          }
        }
      } else {
        console.log(`[v0] [${requestId}] ⚠️ Webhook recebido mas SEM mensagens`)
        console.log(`[v0] [${requestId}] Pode ser webhook de teste ou status update`)
      }

      if (statuses && statuses.length > 0) {
        console.log(`[v0] [${requestId}] 📊 ${statuses.length} status update(s) recebido(s)`)
      }
    } else {
      console.log(`[v0] [${requestId}] ⚠️ Não é webhook do WhatsApp Business Account`)
      console.log(`[v0] [${requestId}] Object type:`, body.object)
    }

    console.log(`[v0] [${requestId}] ===== FIM WEBHOOK POST =====`)
    return NextResponse.json({ status: "success", received: true, requestId })
  } catch (error) {
    console.error(`[v0] [${requestId}] ❌ ERRO CRÍTICO NO WEBHOOK:`, error)
    console.error(`[v0] [${requestId}] Stack:`, error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown", requestId },
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

      const numeroPedidoMatch = mensagem.match(/#?(\d{4,6})/)

      if (numeroPedidoMatch) {
        const numeroPedido = numeroPedidoMatch[1]
        console.log("[v0] Número do pedido detectado:", numeroPedido)

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

      return (
        "Para consultar seu pedido, por favor me informe o número do pedido. " +
        "Você pode encontrá-lo no comprovante ou na mensagem de confirmação. 📱\n\n" +
        "Exemplo: #12345"
      )
    }

    const { cardapioTexto, produtosComImagem } = await buscarCardapioDoBanco()

    const contextoNegocio = `
    Você é o assistente virtual do Cartago Burger Grill, um restaurante especializado em hambúrgueres artesanais.

    INFORMAÇÕES DO RESTAURANTE:
    - Nome: Cartago Burger Grill
    - Especialidade: Hambúrgueres artesanais e lanches gourmet
    - Horário: 18h às 23h (Segunda a Domingo)
    - Delivery: Disponível via WhatsApp
    - Tempo médio de entrega: 30-45 minutos
    - WhatsApp para pedidos: (41) 99533-6065
    - Localização: Colombo, PR

    ${cardapioTexto}

    RASTREAMENTO DE PEDIDOS:
    - Se o cliente perguntar sobre rastreamento, status ou localização do pedido, peça o número do pedido
    - Explique que com o número do pedido você pode consultar o status em tempo real
    - Seja educado e prestativo

    IMAGENS DOS PRODUTOS:
    - VOCÊ TEM ACESSO A IMAGENS dos produtos do cardápio
    - Quando o cliente perguntar sobre a imagem de um produto, mencione o nome EXATO do produto na sua resposta
    - O sistema automaticamente enviará a imagem quando você mencionar o produto
    - Seja natural e diga algo como "Vou te mostrar o [nome do produto]!" ou "Aqui está o [nome do produto]!"
    - NUNCA diga que não tem acesso a imagens

    INSTRUÇÕES:
    - Seja cordial, amigável e prestativo
    - Ofereça o cardápio quando perguntado
    - Ajude com pedidos de forma clara
    - Informe sobre tempo de entrega quando relevante
    - Para rastreamento, sempre peça o número do pedido
    - Se não souber algo específico, peça para falar com atendente humano
    - Use emojis moderadamente para deixar a conversa mais amigável
    - Mantenha respostas concisas mas informativas (máximo 3-4 linhas)
    - SEMPRE responda algo, nunca fique em silêncio
    - Se não entender a pergunta, peça esclarecimento de forma educada
    - Seja natural e conversacional, como um atendente real
    - Quando mencionar um produto específico, use EXATAMENTE o nome do produto como está no cardápio
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
      return "Desculpe, não entendi sua mensagem. Pode reformular? Estou aqui para ajudar com nosso cardápio, pedidos e informações sobre o Cartago Burger Grill! 😊"
    }

    await enviarImagemSeProdutoMencionado(text, produtosComImagem, telefone)

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
    const { data: config } = await supabase.from("whatsapp_config").select("token_whatsapp").single()

    const token = config?.token_whatsapp || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] ===== ENVIANDO MENSAGEM WHATSAPP =====")
    console.log("[v0] Para:", para)
    console.log("[v0] Mensagem:", mensagem)
    console.log("[v0] Token existe:", !!token)
    console.log("[v0] Token do banco:", !!config?.token_whatsapp)
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
          console.error("[v0] 🚨 TOKEN EXPIRADO! Você precisa atualizar o token na aba Integração")
          console.error("[v0] 🚨 Erro:", errorData.error.message)
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
        message_id: `ai_${Date.now()}_${Math.random().toString(36).substring(7)}`, // ID único para evitar duplicatas
        tipo: "bot",
        conteudo: resposta,
        status: "pendente", // Salvar com status "pendente" inicialmente, será atualizado após envio
      })

      if (error) {
        console.error("[v0] Erro ao salvar resposta IA:", error)
        console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
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
      const { error } = await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        message_id: `failed_${Date.now()}`,
        tipo: "bot",
        conteudo: mensagem,
        status: "erro", // Changed from "falha" to "erro"
      })

      if (error) {
        console.error("[v0] Erro ao salvar mensagem com falha:", error)
        console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
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
      const { error } = await supabase
        .from("whatsapp_mensagens")
        .update({ status: novoStatus })
        .eq("conversa_id", conversa.id)
        .eq("tipo", "bot")
        .eq("status", "pendente") // Só atualiza se estiver pendente
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

async function buscarCardapioDoBanco(): Promise<{
  cardapioTexto: string
  produtosComImagem: Array<{ nome: string; imagem_url: string | null; tipo: string }>
}> {
  try {
    console.log("[v0] Buscando cardápio do banco de dados...")

    const supabase = await createServerClient()

    const { data: produtos, error: erroProdutos } = await supabase
      .from("produtos")
      .select("nome, descricao, preco_venda, categoria, imagem_url")
      .eq("ativo", true)
      .order("categoria")
      .order("nome")

    const { data: bebidas, error: erroBebidas } = await supabase
      .from("bebidas")
      .select("nome, descricao, preco_venda, imagem_url")
      .eq("ativo", true)
      .order("nome")

    const { data: combos, error: erroCombos } = await supabase
      .from("combos")
      .select("nome, descricao, preco_final, imagem_url")
      .eq("ativo", true)
      .order("nome")

    if (erroProdutos || erroBebidas || erroCombos) {
      console.error("[v0] Erro ao buscar cardápio:", { erroProdutos, erroBebidas, erroCombos })
      return {
        cardapioTexto: "Cardápio temporariamente indisponível",
        produtosComImagem: [],
      }
    }

    const produtosComImagem: Array<{ nome: string; imagem_url: string | null; tipo: string }> = []

    // Formatar cardápio em texto
    let cardapioTexto = "CARDÁPIO CARTAGO BURGER GRILL:\n\n"

    if (produtos && produtos.length > 0) {
      const produtosPorCategoria = produtos.reduce(
        (acc, produto) => {
          const categoria = produto.categoria || "Outros"
          if (!acc[categoria]) {
            acc[categoria] = []
          }
          acc[categoria].push(produto)
          return acc
        },
        {} as Record<string, typeof produtos>,
      )

      // Adicionar cada categoria
      Object.entries(produtosPorCategoria).forEach(([categoria, produtosCategoria]) => {
        cardapioTexto += `🍔 ${categoria.toUpperCase()}:\n`
        produtosCategoria.forEach((p) => {
          cardapioTexto += `- ${p.nome}: R$ ${p.preco_venda.toFixed(2)}`
          if (p.descricao) {
            cardapioTexto += ` (${p.descricao})`
          }
          cardapioTexto += "\n"

          if (p.imagem_url) {
            produtosComImagem.push({
              nome: p.nome,
              imagem_url: p.imagem_url,
              tipo: "produto",
            })
          }
        })
        cardapioTexto += "\n"
      })
    }

    // Adicionar bebidas
    if (bebidas && bebidas.length > 0) {
      cardapioTexto += "🥤 BEBIDAS:\n"
      bebidas.forEach((b) => {
        cardapioTexto += `- ${b.nome}: R$ ${b.preco_venda.toFixed(2)}`
        if (b.descricao) {
          cardapioTexto += ` (${b.descricao})`
        }
        cardapioTexto += "\n"

        if (b.imagem_url) {
          produtosComImagem.push({
            nome: b.nome,
            imagem_url: b.imagem_url,
            tipo: "bebida",
          })
        }
      })
      cardapioTexto += "\n"
    }

    // Adicionar combos
    if (combos && combos.length > 0) {
      cardapioTexto += "🎁 COMBOS:\n"
      combos.forEach((c) => {
        cardapioTexto += `- ${c.nome}: R$ ${c.preco_final.toFixed(2)}`
        if (c.descricao) {
          cardapioTexto += ` (${c.descricao})`
        }
        cardapioTexto += "\n"

        if (c.imagem_url) {
          produtosComImagem.push({
            nome: c.nome,
            imagem_url: c.imagem_url,
            tipo: "combo",
          })
        }
      })
    }

    console.log("[v0] Cardápio carregado com sucesso do banco de dados")
    console.log(`[v0] Total de produtos com imagem: ${produtosComImagem.length}`)

    return {
      cardapioTexto,
      produtosComImagem,
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar cardápio do banco:", error)
    return {
      cardapioTexto: "Cardápio temporariamente indisponível",
      produtosComImagem: [],
    }
  }
}

async function enviarImagemSeProdutoMencionado(
  respostaIA: string,
  produtosComImagem: Array<{ nome: string; imagem_url: string | null; tipo: string }>,
  telefone: string,
) {
  try {
    console.log("[v0] ===== VERIFICANDO ENVIO DE IMAGEM =====")
    console.log("[v0] Resposta da IA:", respostaIA)
    console.log("[v0] Total de produtos com imagem:", produtosComImagem.length)
    console.log("[v0] Produtos disponíveis:", produtosComImagem.map((p) => p.nome).join(", "))

    // Normalizar texto para comparação
    const respostaNormalizada = respostaIA.toLowerCase()
    console.log("[v0] Resposta normalizada:", respostaNormalizada)

    // Procurar por produtos mencionados
    for (const produto of produtosComImagem) {
      const nomeNormalizado = produto.nome.toLowerCase()
      console.log(`[v0] Verificando produto: "${produto.nome}" (normalizado: "${nomeNormalizado}")`)
      console.log(`[v0] Imagem URL existe: ${!!produto.imagem_url}`)
      console.log(`[v0] Imagem URL: ${produto.imagem_url?.substring(0, 50)}...`)

      // Verificar se o nome do produto aparece na resposta
      if (respostaNormalizada.includes(nomeNormalizado)) {
        console.log(`[v0] ✅ MATCH ENCONTRADO! Produto: ${produto.nome}`)

        if (produto.imagem_url) {
          console.log(`[v0] 📤 Enviando imagem do produto: ${produto.nome}`)

          // Enviar imagem do produto
          const enviado = await enviarImagemWhatsApp(
            telefone,
            produto.imagem_url,
            `${produto.nome} - Cartago Burger Grill`,
          )

          if (enviado) {
            console.log(`[v0] ✅ Imagem enviada com sucesso!`)
          } else {
            console.log(`[v0] ❌ Falha ao enviar imagem`)
          }

          // Enviar apenas a primeira imagem encontrada para não sobrecarregar
          break
        } else {
          console.log(`[v0] ⚠️ Produto encontrado mas sem imagem_url`)
        }
      } else {
        console.log(`[v0] ❌ Produto não mencionado na resposta`)
      }
    }

    console.log("[v0] ===== FIM VERIFICAÇÃO IMAGEM =====")
  } catch (error) {
    console.error("[v0] Erro ao enviar imagem do produto:", error)
    // Não interrompe o fluxo se houver erro ao enviar imagem
  }
}

async function enviarImagemWhatsApp(para: string, imagemUrl: string, legenda?: string): Promise<boolean> {
  try {
    const { data: config } = await supabase.from("whatsapp_config").select("token_whatsapp").single()

    const token = config?.token_whatsapp || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] ===== ENVIANDO IMAGEM WHATSAPP =====")
    console.log("[v0] Para:", para)
    console.log("[v0] Imagem URL:", imagemUrl)
    console.log("[v0] Legenda:", legenda)

    if (!token || !phoneNumberId) {
      console.error("[v0] ❌ Tokens WhatsApp não configurados")
      return false
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    const payload = {
      messaging_product: "whatsapp",
      to: para,
      type: "image",
      image: {
        link: imagemUrl,
        caption: legenda || "",
      },
    }

    console.log("[v0] Payload da imagem:", JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[v0] Resposta do envio de imagem:", responseText)

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar imagem WhatsApp")
      console.error("[v0] Status:", response.status)
      console.error("[v0] Resposta:", responseText)
      return false
    }

    console.log("[v0] ✅ Imagem enviada com sucesso!")
    return true
  } catch (error) {
    console.error("[v0] ❌ Erro crítico ao enviar imagem:", error)
    return false
  }
}
