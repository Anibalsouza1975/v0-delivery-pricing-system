import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// DELETE - Excluir conversa do backup
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Excluir mensagens primeiro (por causa da foreign key)
    const { error: msgError } = await supabase.from("whatsapp_mensagens_backup").delete().eq("conversa_backup_id", id)

    if (msgError) throw msgError

    // Excluir conversa
    const { error: convError } = await supabase.from("whatsapp_conversas_backup").delete().eq("id", id)

    if (convError) throw convError

    return NextResponse.json({
      success: true,
      message: "Conversa excluída do backup com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir conversa:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao excluir conversa",
      },
      { status: 500 },
    )
  }
}

// POST - Restaurar conversa do backup para tabelas principais
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Buscar conversa do backup
    const { data: conversa, error: convError } = await supabase
      .from("whatsapp_conversas_backup")
      .select("*")
      .eq("id", id)
      .single()

    if (convError) throw convError
    if (!conversa) throw new Error("Conversa não encontrada")

    // Buscar mensagens do backup
    const { data: mensagens, error: msgError } = await supabase
      .from("whatsapp_mensagens_backup")
      .select("*")
      .eq("conversa_backup_id", id)

    if (msgError) throw msgError

    // Inserir conversa na tabela principal
    const { data: novaConversa, error: insertConvError } = await supabase
      .from("whatsapp_conversas")
      .insert({
        cliente_nome: conversa.cliente_nome,
        cliente_telefone: conversa.cliente_telefone,
        status: "ativa",
        ultima_mensagem: conversa.ultima_mensagem,
        ultima_interacao: conversa.ultima_interacao,
      })
      .select()
      .single()

    if (insertConvError) throw insertConvError

    // Inserir mensagens na tabela principal
    if (mensagens && mensagens.length > 0) {
      const mensagensParaInserir = mensagens.map((msg) => ({
        conversa_id: novaConversa.id,
        tipo: msg.tipo,
        conteudo: msg.conteudo,
        remetente: msg.remetente,
        created_at_original: msg.created_at_original,
      }))

      const { error: insertMsgError } = await supabase.from("whatsapp_mensagens").insert(mensagensParaInserir)

      if (insertMsgError) throw insertMsgError
    }

    // Excluir do backup
    await supabase.from("whatsapp_mensagens_backup").delete().eq("conversa_backup_id", id)
    await supabase.from("whatsapp_conversas_backup").delete().eq("id", id)

    return NextResponse.json({
      success: true,
      message: "Conversa restaurada com sucesso",
      conversa: novaConversa,
    })
  } catch (error) {
    console.error("Erro ao restaurar conversa:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao restaurar conversa",
      },
      { status: 500 },
    )
  }
}
