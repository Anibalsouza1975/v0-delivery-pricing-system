import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar mensagens de uma conversa específica do backup
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const conversaBackupId = params.id

    const { data: mensagens, error } = await supabase
      .from("whatsapp_mensagens_backup")
      .select("*")
      .eq("conversa_backup_id", conversaBackupId)
      .order("created_at_original", { ascending: true })

    if (error) {
      console.error("[v0] Erro ao buscar mensagens backup:", error)
      return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mensagens: mensagens || [],
    })
  } catch (error) {
    console.error("[v0] Erro na API mensagens backup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
