import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return undefined
        },
        set(name: string, value: string, options: any) {
          // No-op for server-side
        },
        remove(name: string, options: any) {
          // No-op for server-side
        },
      },
    })

    // Buscar apenas dados públicos da empresa (sem informações sensíveis)
    const { data, error } = await supabase
      .from("empresa")
      .select(`
        nome,
        telefone,
        endereco,
        cidade,
        estado,
        logo_url,
        cor_primaria,
        cor_secundaria,
        descricao,
        horario_funcionamento,
        redes_sociais
      `)
      .eq("ativo", true)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar dados públicos da empresa:", error)
      return NextResponse.json({ error: "Erro ao buscar dados da empresa" }, { status: 500 })
    }

    // Retornar dados padrão se não houver empresa cadastrada
    const dadosPadrao = {
      nome: "Minha Empresa",
      telefone: "(11) 99999-9999",
      endereco: "Rua Principal, 123",
      cidade: "São Paulo",
      estado: "SP",
      logo_url: null,
      cor_primaria: "#dc2626",
      cor_secundaria: "#f59e0b",
      descricao: "Delivery de comida deliciosa",
      horario_funcionamento: "Segunda a Sábado: 18h às 23h",
      redes_sociais: {},
    }

    return NextResponse.json(data || dadosPadrao)
  } catch (error) {
    console.error("[v0] Erro interno ao buscar dados públicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
