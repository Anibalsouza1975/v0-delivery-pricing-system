import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Buscar métricas em tempo real
    const hoje = new Date().toISOString().split("T")[0]

    // Total de conversas
    const { count: totalConversas } = await supabase
      .from("whatsapp_conversas")
      .select("*", { count: "exact", head: true })

    // Conversas ativas
    const { count: conversasAtivas } = await supabase
      .from("whatsapp_conversas")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativa")

    // Conversas de hoje
    const { count: conversasHoje } = await supabase
      .from("whatsapp_conversas")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${hoje}T00:00:00`)
      .lt("created_at", `${hoje}T23:59:59`)

    // Mensagens enviadas hoje
    const { count: mensagensHoje } = await supabase
      .from("whatsapp_mensagens")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${hoje}T00:00:00`)
      .lt("created_at", `${hoje}T23:59:59`)

    // Taxa de resposta (simulada por enquanto)
    const taxaResposta = conversasAtivas && totalConversas ? Math.round((conversasAtivas / totalConversas) * 100) : 98

    const metricas = {
      totalConversas: totalConversas || 0,
      conversasAtivas: conversasAtivas || 0,
      conversasHoje: conversasHoje || 0,
      mensagensHoje: mensagensHoje || 0,
      taxaResposta,
      tempoMedioResposta: "< 1min", // Simulado
    }

    return NextResponse.json({ success: true, metricas })
  } catch (error) {
    console.error("[v0] Erro ao buscar métricas WhatsApp:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
