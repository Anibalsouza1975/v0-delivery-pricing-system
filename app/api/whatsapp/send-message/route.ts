import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const WHATSAPP_ACCESS_TOKEN =
  "EAALON6v2KzMBPr5sHF7XZAdqFGNmLwZARg8yugMN6fmpJ4ZBsXLRh0sqwW1PLUBmsLhWGKE2e8FBZCZBwLGkffPRD9XLmqZBJpf4csZBGUFJYi2Mrf7WVnZCADviizlVREZCgxwR1QvYHZBe1ykbTZBjv90qJcHtvbH1bThDKwdhArCNZBLy1x8OiXztUuZCweu1azKcRkyvmZB8zM2gjnczNHK9ZAJfBuFhebRDK9ZCD2QrVgl1un0CsAwZD"

export async function POST(request: NextRequest) {
  try {
    const { to, message, tipo = "bot" } = await request.json()

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
      return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 })
    }

    console.log("[v0] 📤 Enviando mensagem para:", to)
    console.log("[v0] 📝 Mensagem:", message)
    console.log(
      "[v0] 🔑 Token Preview:",
      WHATSAPP_ACCESS_TOKEN.substring(0, 20) + "..." + WHATSAPP_ACCESS_TOKEN.slice(-10),
    )

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
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
      console.error("[v0] ❌ Erro ao enviar mensagem WhatsApp:", result)

      if (result.error?.code === 10) {
        return NextResponse.json(
          {
            error:
              "Permissão negada. O número WhatsApp precisa ser verificado no Meta Business ou você precisa adicionar números de teste autorizados.",
            details: result.error.message,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: "Erro ao enviar mensagem",
          details: result.error?.message,
        },
        { status: response.status },
      )
    }

    console.log("[v0] ✅ Mensagem enviada com sucesso:", result.messages?.[0]?.id)

    const supabase = await createClient()

    // Buscar ou criar conversa
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", to)
      .single()

    if (conversa) {
      await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        tipo: tipo,
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
    console.error("[v0] ❌ Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
