import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function enviarNotificacaoWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  try {
    const { data: config } = await supabase.from("whatsapp_config").select("token_whatsapp").single()

    const token = config?.token_whatsapp || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneNumberId) {
      console.error("[v0] Tokens WhatsApp não configurados")
      return false
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    const payload = {
      messaging_product: "whatsapp",
      to: telefone,
      type: "text",
      text: { body: mensagem },
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("[v0] Erro ao enviar notificação WhatsApp:", await response.text())
      return false
    }

    console.log("[v0] Notificação WhatsApp enviada com sucesso")
    return true
  } catch (error) {
    console.error("[v0] Erro ao enviar notificação WhatsApp:", error)
    return false
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, resposta } = body

    const { data: complaintBefore, error: fetchError } = await supabase
      .from("reclamacoes")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Erro ao buscar reclamação:", fetchError)
      return NextResponse.json({ error: "Erro ao buscar reclamação" }, { status: 500 })
    }

    if (status === "resolvido") {
      // Send notification before deleting
      if (resposta && complaintBefore.cliente_telefone) {
        const mensagemNotificacao =
          `✅ Sua reclamação ${complaintBefore.numero_ticket} foi resolvida!\n\n` +
          `💬 Resposta da equipe:\n${resposta}\n\n` +
          `Agradecemos pelo seu feedback e esperamos ter resolvido sua situação. Se precisar de mais ajuda, estamos à disposição! 🙏`

        // Send notification asynchronously
        enviarNotificacaoWhatsApp(complaintBefore.cliente_telefone, mensagemNotificacao).catch((err) => {
          console.error("[v0] Erro ao enviar notificação (async):", err)
        })
      }

      // Delete the complaint from database
      const { error: deleteError } = await supabase.from("reclamacoes").delete().eq("id", params.id)

      if (deleteError) {
        console.error("Erro ao excluir reclamação:", deleteError)
        return NextResponse.json({ error: "Erro ao excluir reclamação" }, { status: 500 })
      }

      return NextResponse.json({
        message: "Reclamação resolvida e excluída com sucesso",
        deleted: true,
      })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
    }

    if (resposta !== undefined) {
      updateData.resposta = resposta
    }

    const { data, error } = await supabase.from("reclamacoes").update(updateData).eq("id", params.id).select().single()

    if (error) {
      console.error("Erro ao atualizar reclamação:", error)
      return NextResponse.json({ error: "Erro ao atualizar reclamação" }, { status: 500 })
    }

    if (resposta && complaintBefore.cliente_telefone) {
      const statusEmoji = status === "em_andamento" ? "⏳" : "🔴"
      const statusTexto = status === "em_andamento" ? "Em andamento" : status === "aberto" ? "Aberto" : "Atualizado"

      const mensagemNotificacao =
        `📢 Atualização da sua reclamação ${data.numero_ticket}\n\n` +
        `${statusEmoji} Status: ${statusTexto}\n\n` +
        `💬 Resposta da equipe:\n${resposta}\n\n` +
        `Obrigado pela sua paciência! Se precisar de mais ajuda, estamos à disposição.`

      // Send notification asynchronously (don't wait for it)
      enviarNotificacaoWhatsApp(complaintBefore.cliente_telefone, mensagemNotificacao).catch((err) => {
        console.error("[v0] Erro ao enviar notificação (async):", err)
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no PUT /api/reclamacoes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
