import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Listar backups existentes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar configuração de backup
    const { data: config } = await supabase.from("whatsapp_backup_config").select("*").single()

    // Buscar backups agrupados por data
    const { data: backups, error } = await supabase
      .from("whatsapp_conversas_backup")
      .select("data_backup, id")
      .order("data_backup", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar backups:", error)
      return NextResponse.json({ error: "Erro ao buscar backups" }, { status: 500 })
    }

    // Agrupar por data
    const backupsAgrupados = backups?.reduce(
      (acc, backup) => {
        const data = new Date(backup.data_backup).toISOString().split("T")[0]
        if (!acc[data]) {
          acc[data] = { data, quantidade: 0, ids: [] }
        }
        acc[data].quantidade++
        acc[data].ids.push(backup.id)
        return acc
      },
      {} as Record<string, { data: string; quantidade: number; ids: string[] }>,
    )

    return NextResponse.json({
      success: true,
      config,
      backups: Object.values(backupsAgrupados || {}),
    })
  } catch (error) {
    console.error("[v0] Erro na API backup GET:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo backup
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar todas as conversas ativas
    const { data: conversas, error: conversasError } = await supabase
      .from("whatsapp_conversas")
      .select(
        `
        *,
        whatsapp_mensagens (*)
      `,
      )
      .order("created_at", { ascending: false })

    if (conversasError) {
      console.error("[v0] Erro ao buscar conversas:", conversasError)
      return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
    }

    if (!conversas || conversas.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma conversa para fazer backup", quantidade: 0 })
    }

    let conversasBackup = 0
    let mensagensBackup = 0

    // Fazer backup de cada conversa
    for (const conversa of conversas) {
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

      conversasBackup++

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
          mensagensBackup += mensagensParaBackup.length
        }
      }
    }

    // Atualizar data do último backup
    const { data: configAtual } = await supabase.from("whatsapp_backup_config").select("id").limit(1).single()

    if (configAtual) {
      await supabase
        .from("whatsapp_backup_config")
        .update({ ultimo_backup: new Date().toISOString() })
        .eq("id", configAtual.id)
    } else {
      // Se não existe config, criar uma
      await supabase.from("whatsapp_backup_config").insert({
        backup_automatico: false,
        intervalo_dias: 7,
        manter_dias: 30,
        ultimo_backup: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Backup realizado com sucesso",
      conversas: conversasBackup,
      mensagens: mensagensBackup,
    })
  } catch (error) {
    console.error("[v0] Erro na API backup POST:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Limpar backups antigos
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const dias = Number.parseInt(searchParams.get("dias") || "30")

    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - dias)

    const { error } = await supabase
      .from("whatsapp_conversas_backup")
      .delete()
      .lt("data_backup", dataLimite.toISOString())

    if (error) {
      console.error("[v0] Erro ao limpar backups:", error)
      return NextResponse.json({ error: "Erro ao limpar backups" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Backups com mais de ${dias} dias foram removidos` })
  } catch (error) {
    console.error("[v0] Erro na API backup DELETE:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
