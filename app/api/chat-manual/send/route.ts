import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function sendWhatsAppMessage(to: string, message: string) {
  const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao enviar mensagem: ${error}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { telefone, mensagem } = await request.json()

    if (!telefone || !mensagem) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Enviar mensagem via WhatsApp
    const whatsappResponse = await sendWhatsAppMessage(telefone, mensagem)

    // Salvar no histórico
    const { error: dbError } = await supabase.from("whatsapp_messages").insert({
      telefone,
      mensagem,
      tipo: "enviada",
      remetente: "admin",
      admin_nome: "Admin",
      message_id: whatsappResponse.messages?.[0]?.id,
      status: "enviada",
    })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
