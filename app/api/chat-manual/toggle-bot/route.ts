import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { telefone, ativar } = await request.json()

    if (!telefone) {
      return NextResponse.json({ error: "Telefone não fornecido" }, { status: 400 })
    }

    const updateData = ativar
      ? {
          bot_ativo: true,
          data_reativacao: new Date().toISOString(),
        }
      : {
          bot_ativo: false,
          desativado_por: "Admin",
          data_desativacao: new Date().toISOString(),
          motivo: "Atendimento manual de reclamação",
        }

    const { data, error } = await supabase
      .from("bot_control")
      .upsert({ telefone, ...updateData }, { onConflict: "telefone" })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Erro ao alterar status do bot:", error)
    return NextResponse.json({ error: "Erro ao alterar status" }, { status: 500 })
  }
}
