import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar configuração de backup
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: config, error } = await supabase.from("whatsapp_backup_config").select("*").single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar config:", error)
      return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: config || {
        backup_automatico: false,
        intervalo_dias: 7,
        manter_dias: 30,
      },
    })
  } catch (error) {
    console.error("[v0] Erro na API config GET:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar configuração de backup
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { backup_automatico, intervalo_dias, manter_dias } = body

    // Verificar se já existe configuração
    const { data: existente } = await supabase.from("whatsapp_backup_config").select("id").single()

    let result

    if (existente) {
      // Atualizar existente
      result = await supabase
        .from("whatsapp_backup_config")
        .update({
          backup_automatico,
          intervalo_dias,
          manter_dias,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id)
    } else {
      // Criar novo
      result = await supabase.from("whatsapp_backup_config").insert({
        backup_automatico,
        intervalo_dias,
        manter_dias,
      })
    }

    if (result.error) {
      console.error("[v0] Erro ao salvar config:", result.error)
      return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Configuração salva com sucesso",
    })
  } catch (error) {
    console.error("[v0] Erro na API config PUT:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
