import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { telefone, ativar, adminNome } = await request.json()

    if (!telefone) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }

    console.log(`[v0] ${ativar ? "Ativando" : "Desativando"} bot para telefone:`, telefone)

    const { data: existing } = await supabase.from("bot_control").select("id").eq("telefone", telefone).single()

    if (existing) {
      const { error } = await supabase
        .from("bot_control")
        .update({
          bot_ativo: ativar,
          desativado_por: ativar ? null : adminNome || "Admin",
          updated_at: new Date().toISOString(),
        })
        .eq("telefone", telefone)

      if (error) {
        console.error("[v0] Erro ao atualizar bot_control:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from("bot_control").insert({
        telefone,
        bot_ativo: ativar,
        desativado_por: ativar ? null : adminNome || "Admin",
      })

      if (error) {
        console.error("[v0] Erro ao criar bot_control:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    console.log(`[v0] Bot ${ativar ? "ativado" : "desativado"} com sucesso para:`, telefone)

    return NextResponse.json({
      success: true,
      botAtivo: ativar,
    })
  } catch (error) {
    console.error("[v0] Erro ao alternar bot:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
