import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telefone = searchParams.get("telefone")

    if (!telefone) {
      return NextResponse.json({ error: "Telefone não fornecido" }, { status: 400 })
    }

    let { data: botControl, error } = await supabase.from("bot_control").select("*").eq("telefone", telefone).single()

    // Se não existir registro, criar um com bot ativo
    if (error && error.code === "PGRST116") {
      const { data: newControl, error: insertError } = await supabase
        .from("bot_control")
        .insert({ telefone, bot_ativo: true })
        .select()
        .single()

      if (insertError) throw insertError
      botControl = newControl
    } else if (error) {
      throw error
    }

    return NextResponse.json(botControl)
  } catch (error) {
    console.error("Erro ao buscar status do bot:", error)
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 })
  }
}
