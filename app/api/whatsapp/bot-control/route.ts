import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Verificar status do bot para um número
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telefone = searchParams.get("telefone")

    if (!telefone) {
      return NextResponse.json({ error: "Telefone não informado" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from("bot_control").select("*").eq("telefone", telefone).single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar status do bot:", error)
      return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 })
    }

    // Se não existe registro, bot está ativo por padrão
    if (!data) {
      return NextResponse.json({
        success: true,
        bot_ativo: true,
        telefone,
      })
    }

    return NextResponse.json({
      success: true,
      bot_ativo: data.bot_ativo,
      telefone,
      motivo: data.motivo,
      desativado_por: data.desativado_por,
    })
  } catch (error) {
    console.error("[v0] Erro na API bot-control GET:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Ativar/desativar bot para um número
export async function POST(request: NextRequest) {
  try {
    const { telefone, bot_ativo, motivo = "Atendimento manual", desativado_por = "Sistema" } = await request.json()

    if (!telefone) {
      return NextResponse.json({ error: "Telefone não informado" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se já existe registro
    const { data: existing } = await supabase.from("bot_control").select("id").eq("telefone", telefone).single()

    if (existing) {
      // Atualizar registro existente
      const updateData: any = {
        bot_ativo,
        updated_at: new Date().toISOString(),
      }

      if (bot_ativo) {
        updateData.data_reativacao = new Date().toISOString()
        updateData.motivo = null
        updateData.desativado_por = null
      } else {
        updateData.data_desativacao = new Date().toISOString()
        updateData.motivo = motivo
        updateData.desativado_por = desativado_por
      }

      const { error } = await supabase.from("bot_control").update(updateData).eq("id", existing.id)

      if (error) {
        console.error("[v0] Erro ao atualizar bot_control:", error)
        return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
      }
    } else {
      // Criar novo registro
      const { error } = await supabase.from("bot_control").insert({
        telefone,
        bot_ativo,
        motivo: bot_ativo ? null : motivo,
        desativado_por: bot_ativo ? null : desativado_por,
        data_desativacao: bot_ativo ? null : new Date().toISOString(),
        data_reativacao: bot_ativo ? new Date().toISOString() : null,
      })

      if (error) {
        console.error("[v0] Erro ao criar bot_control:", error)
        return NextResponse.json({ error: "Erro ao criar registro" }, { status: 500 })
      }
    }

    console.log(`[v0] Bot ${bot_ativo ? "ativado" : "desativado"} para ${telefone}`)

    return NextResponse.json({
      success: true,
      bot_ativo,
      telefone,
      message: `Bot ${bot_ativo ? "ativado" : "desativado"} com sucesso`,
    })
  } catch (error) {
    console.error("[v0] Erro na API bot-control POST:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
