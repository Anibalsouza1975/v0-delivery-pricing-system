import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 })
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] Erro ao enviar mensagem WhatsApp:", result)
      return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
    }

    const supabase = await createClient()

    // Buscar ou criar conversa
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", to)
      .single()

    if (conversa) {
      // Salvar mensagem enviada
      await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        tipo: "bot",
        conteudo: message,
      })

      // Atualizar última mensagem da conversa
      await supabase
        .from("whatsapp_conversas")
        .update({
          ultima_mensagem: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversa.id)
    }

    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id })
  } catch (error) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
