import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("empresa").select("*").eq("ativo", true).single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar dados da empresa:", error)
      return NextResponse.json({ error: "Erro ao buscar dados da empresa" }, { status: 500 })
    }

    return NextResponse.json(data || null)
  } catch (error) {
    console.error("[v0] Erro interno ao buscar empresa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = await createClient()

    // Verificar se já existe uma empresa ativa
    const { data: empresaExistente } = await supabase.from("empresa").select("id").eq("ativo", true).single()

    let result

    if (empresaExistente) {
      // Atualizar empresa existente
      const { data, error } = await supabase
        .from("empresa")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", empresaExistente.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao atualizar empresa:", error)
        return NextResponse.json({ error: "Erro ao atualizar dados da empresa" }, { status: 500 })
      }

      result = data
    } else {
      // Criar nova empresa
      const { data, error } = await supabase
        .from("empresa")
        .insert([
          {
            ...body,
            ativo: true,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao criar empresa:", error)
        return NextResponse.json({ error: "Erro ao criar dados da empresa" }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Erro interno ao salvar empresa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
