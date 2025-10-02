import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const telefone = searchParams.get("telefone")

    if (!telefone) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }

    const { data: botControl } = await supabase.from("bot_control").select("*").eq("telefone", telefone).single()

    const botAtivo = botControl?.bot_ativo ?? true

    return NextResponse.json({
      botAtivo,
      desativadoPor: botControl?.desativado_por,
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar status do bot:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
