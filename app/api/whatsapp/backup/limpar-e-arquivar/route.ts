import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Mover conversas antigas para backup e limpar das tabelas principais
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { dias = 30 } = await request.json()

    // Calcular data limite (conversas mais antigas que X dias)
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - dias)

    // Buscar conversas antigas que serão arquivadas
    const { data: conversasAntigas, error: conversasError } = await supabase
      .from("whatsapp_conversas")
      .select(
        `
        *,
        whatsapp_mensagens (*)
      `,
      )
      .lt("updated_at", dataLimite.toISOString())
      .order("created_at", { ascending: false })

    if (conversasError) {
      console.error("[v0] Erro ao buscar conversas antigas:", conversasError)
      return NextResponse.json({ error: "Erro ao buscar conversas antigas" }, { status: 500 })
    }

    if (!conversasAntigas || conversasAntigas.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Nenhuma conversa com mais de ${dias} dias encontrada`,
        conversas_arquivadas: 0,
        mensagens_arquivadas: 0,
      })
    }

    let conversasArquivadas = 0
    let mensagensArquivadas = 0
    const idsConversasParaDeletar: string[] = []

    // Fazer backup de cada conversa antiga
    for (const conversa of conversasAntigas) {
      // Inserir conversa no backup
      const { data: conversaBackupData, error: conversaError } = await supabase
        .from("whatsapp_conversas_backup")
        .insert({
          conversa_id_original: conversa.id,
          cliente_nome: conversa.cliente_nome,
          cliente_telefone: conversa.cliente_telefone,
          status: conversa.status,
          ultima_mensagem: conversa.ultima_mensagem,
          session_id: conversa.session_id,
          created_at_original: conversa.created_at,
          updated_at_original: conversa.updated_at,
        })
        .select()
        .single()

      if (conversaError) {
        console.error("[v0] Erro ao fazer backup da conversa:", conversaError)
        continue
      }

      conversasArquivadas++
      idsConversasParaDeletar.push(conversa.id)

      // Fazer backup das mensagens
      if (conversa.whatsapp_mensagens && conversa.whatsapp_mensagens.length > 0) {
        const mensagensParaBackup = conversa.whatsapp_mensagens.map((msg: any) => ({
          mensagem_id_original: msg.id,
          conversa_backup_id: conversaBackupData.id,
          conversa_id_original: conversa.id,
          tipo: msg.tipo,
          conteudo: msg.conteudo,
          message_id: msg.message_id,
          status: msg.status,
          created_at_original: msg.created_at,
        }))

        const { error: mensagensError } = await supabase.from("whatsapp_mensagens_backup").insert(mensagensParaBackup)

        if (!mensagensError) {
          mensagensArquivadas += mensagensParaBackup.length
        }
      }
    }

    // Agora deletar as conversas antigas das tabelas principais
    // As mensagens serão deletadas automaticamente por CASCADE
    if (idsConversasParaDeletar.length > 0) {
      const { error: deleteError } = await supabase
        .from("whatsapp_conversas")
        .delete()
        .in("id", idsConversasParaDeletar)

      if (deleteError) {
        console.error("[v0] Erro ao deletar conversas antigas:", deleteError)
        return NextResponse.json(
          {
            error: "Backup realizado, mas erro ao deletar conversas antigas",
            conversas_arquivadas: conversasArquivadas,
            mensagens_arquivadas: mensagensArquivadas,
          },
          { status: 500 },
        )
      }
    }

    // Atualizar data do último backup
    const { data: configAtual } = await supabase.from("whatsapp_backup_config").select("id").limit(1).single()

    if (configAtual) {
      await supabase
        .from("whatsapp_backup_config")
        .update({ ultimo_backup: new Date().toISOString() })
        .eq("id", configAtual.id)
    }

    return NextResponse.json({
      success: true,
      message: `${conversasArquivadas} conversas e ${mensagensArquivadas} mensagens foram arquivadas e removidas das tabelas principais`,
      conversas_arquivadas: conversasArquivadas,
      mensagens_arquivadas: mensagensArquivadas,
      dias_limite: dias,
    })
  } catch (error) {
    console.error("[v0] Erro na API limpar-e-arquivar:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
