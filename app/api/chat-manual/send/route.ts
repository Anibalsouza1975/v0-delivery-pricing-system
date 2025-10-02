import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { telefone, mensagem } = await request.json()

    if (!telefone || !mensagem) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Admin enviando mensagem para:", telefone)

    const enviado = await enviarMensagemWhatsAppAdmin(telefone, mensagem)

    if (!enviado) {
      return NextResponse.json({ error: "Falha ao enviar mensagem" }, { status: 500 })
    }

    // Salvar mensagem no banco
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa) {
      await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        message_id: `admin_${Date.now()}`,
        tipo: "admin",
        conteudo: mensagem,
        status: "enviada",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao enviar mensagem do admin:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function enviarMensagemWhatsAppAdmin(para: string, mensagem: string): Promise<boolean> {
  try {
    const { data: config } = await supabase.from("whatsapp_config").select("token_whatsapp").single()

    const token = config?.token_whatsapp || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("[v0] ===== ENVIANDO MENSAGEM ADMIN =====")
    console.log("[v0] Para:", para)
    console.log("[v0] Token existe:", !!token)
    console.log("[v0] Phone ID existe:", !!phoneNumberId)

    if (!token || !phoneNumberId) {
      console.error("[v0] Tokens WhatsApp não configurados")
      return false
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    const payload = {
      messaging_product: "whatsapp",
      to: para,
      type: "text",
      text: { body: mensagem },
    }

    console.log("[v0] URL:", url)
    console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[v0] Status:", response.status)
    console.log("[v0] Resposta:", responseText)

    if (!response.ok) {
      console.error("[v0] Erro ao enviar mensagem")
      return false
    }

    console.log("[v0] Mensagem enviada com sucesso!")
    return true
  } catch (error) {
    console.error("[v0] Erro crítico:", error)
    return false
  }
}
