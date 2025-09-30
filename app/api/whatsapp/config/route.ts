import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const WHATSAPP_PHONE_NUMBER_ID =
      process.env.WHATSAPP_PHONE_NUMBER_ID === "temporario"
        ? "801264823070601"
        : process.env.WHATSAPP_PHONE_NUMBER_ID || "801264823070601"
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

    console.log("[v0] WhatsApp Phone Number ID:", WHATSAPP_PHONE_NUMBER_ID)
    console.log("[v0] WhatsApp Access Token exists:", !!WHATSAPP_ACCESS_TOKEN)

    const hasWhatsAppTokens = !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_VERIFY_TOKEN)

    let whatsappApiStatus = "desconectado"
    let tokenError = null

    if (hasWhatsAppTokens) {
      try {
        const apiUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`
        console.log("[v0] Testando conexão WhatsApp API:", apiUrl)

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          },
        })

        console.log("[v0] Resposta da API WhatsApp:", response.status)

        if (response.ok) {
          try {
            const data = await response.json()
            console.log("[v0] Dados da API WhatsApp:", data)
            whatsappApiStatus = "conectado"
          } catch (jsonError) {
            console.log("[v0] Resposta não é JSON válido, mas status é OK")
            whatsappApiStatus = "conectado"
          }
        } else {
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            console.log("[v0] Erro da API WhatsApp:", errorData)

            if (errorData.error && errorData.error.code === 190) {
              tokenError = {
                type: "token_expired",
                message: errorData.error.message,
                code: errorData.error.code,
                subcode: errorData.error.error_subcode,
              }
              whatsappApiStatus = "token_expirado"
            }
          } else {
            // Handle non-JSON error responses (like rate limiting)
            const errorText = await response.text()
            console.log("[v0] Erro da API WhatsApp (texto):", errorText)

            if (response.status === 429) {
              whatsappApiStatus = "rate_limited"
              tokenError = {
                type: "rate_limited",
                message: "Muitas requisições. Aguarde alguns minutos.",
                code: 429,
              }
            } else {
              whatsappApiStatus = "erro"
            }
          }
        }
      } catch (error) {
        console.log("[v0] Erro ao testar conexão WhatsApp API:", error)
        whatsappApiStatus = "erro"
      }
    }

    const { data, error } = await supabase.from("whatsapp_config").select("*").single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar config WhatsApp:", error)
      return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 })
    }

    if (!data) {
      const defaultConfig = {
        ativo: whatsappApiStatus === "conectado",
        nome_bot: "Cartago Bot",
        mensagem_boas_vindas:
          "Olá! 👋 Bem-vindo ao Cartago Burger Grill! Sou seu assistente virtual e estou aqui para ajudar com pedidos, cardápio e informações. Como posso te ajudar hoje?",
        horario_inicio: "18:00",
        horario_fim: "23:00",
        respostas_automaticas: {
          cardapio: true,
          precos: true,
          horarios: true,
          localizacao: true,
          pedidos: true,
        },
        status_conexao: whatsappApiStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: newConfig, error: insertError } = await supabase
        .from("whatsapp_config")
        .insert(defaultConfig)
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Erro ao criar config padrão:", insertError)
        return NextResponse.json({ error: "Erro ao criar configuração" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        config: { ...newConfig, token_error: tokenError },
      })
    }

    const updatedConfig = {
      ...data,
      status_conexao: whatsappApiStatus,
      token_error: tokenError, // This is only for the response, not saved to DB
    }

    if (data.status_conexao !== updatedConfig.status_conexao) {
      await supabase
        .from("whatsapp_config")
        .update({
          status_conexao: updatedConfig.status_conexao,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
    }

    return NextResponse.json({ success: true, config: updatedConfig })
  } catch (error) {
    console.error("[v0] Erro na API config WhatsApp:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const config = await request.json()

    const hasWhatsAppTokens = !!(
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_VERIFY_TOKEN
    )

    const { data: existingConfig } = await supabase.from("whatsapp_config").select("id").single()

    const updateData = {
      ativo: config.ativo && hasWhatsAppTokens,
      nome_bot: config.nomeBot,
      mensagem_boas_vindas: config.mensagemBoasVindas,
      horario_inicio: config.horarioFuncionamento.inicio,
      horario_fim: config.horarioFuncionamento.fim,
      respostas_automaticas: config.respostasAutomaticas,
      status_conexao: hasWhatsAppTokens ? "conectado" : "desconectado",
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("whatsapp_config")
      .update(updateData)
      .eq("id", existingConfig?.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao salvar config WhatsApp:", error)
      return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 })
    }

    return NextResponse.json({ success: true, config: data })
  } catch (error) {
    console.error("[v0] Erro na API config WhatsApp:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
