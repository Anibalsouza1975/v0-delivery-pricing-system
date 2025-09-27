import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const numeroPedido = searchParams.get("numero")

  if (!numeroPedido) {
    return NextResponse.json({ error: "Número do pedido é obrigatório" }, { status: 400 })
  }

  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    console.log("[v0] Buscando pedido no BD:", numeroPedido)

    // Buscar pedido na tabela pedidos
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", numeroPedido)
      .single()

    if (error) {
      console.log("[v0] Erro ao buscar pedido:", error)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    console.log("[v0] Pedido encontrado:", pedido.numero_pedido)

    if (pedido.itens && Array.isArray(pedido.itens)) {
      const itensComImagens = await Promise.all(
        pedido.itens.map(async (item: any) => {
          let imagemUrl = null

          if (item.id) {
            // Primeiro tentar buscar como produto
            const { data: produto } = await supabase.from("produtos").select("imagem_url").eq("id", item.id).single()

            if (produto?.imagem_url) {
              imagemUrl = produto.imagem_url
            } else {
              // Se não encontrou como produto, tentar como bebida
              const { data: bebida } = await supabase.from("bebidas").select("imagem_url").eq("id", item.id).single()

              if (bebida?.imagem_url) {
                imagemUrl = bebida.imagem_url
              } else {
                // Se não encontrou como bebida, tentar como combo
                const { data: combo } = await supabase.from("combos").select("imagem_url").eq("id", item.id).single()

                if (combo?.imagem_url) {
                  imagemUrl = combo.imagem_url
                }
              }
            }
          }

          console.log(`[v0] Item ${item.nome}: imagem encontrada = ${imagemUrl ? "SIM" : "NÃO"}`)

          return {
            ...item,
            imagem_url: imagemUrl,
          }
        }),
      )

      pedido.itens = itensComImagens
      console.log("[v0] Imagens dos produtos adicionadas aos itens")
    }

    return NextResponse.json({ pedido })
  } catch (error) {
    console.error("[v0] Erro na busca:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
