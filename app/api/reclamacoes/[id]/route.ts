import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, resposta } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
      if (status === "resolvido" || status === "fechado") {
        updateData.data_resolucao = new Date().toISOString()
      }
    }

    if (resposta !== undefined) {
      updateData.resposta = resposta
    }

    const { data, error } = await supabase.from("reclamacoes").update(updateData).eq("id", params.id).select().single()

    if (error) {
      console.error("Erro ao atualizar reclamação:", error)
      return NextResponse.json({ error: "Erro ao atualizar reclamação" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no PUT /api/reclamacoes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
