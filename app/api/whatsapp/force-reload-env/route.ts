import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== FORÇANDO RELOAD DE VARIÁVEIS DE AMBIENTE =====")
    console.log("[v0] Timestamp:", new Date().toISOString())

    // Forçar o Node.js a recarregar as variáveis de ambiente
    // Nota: Em produção, isso pode não funcionar completamente devido ao cache do Vercel
    // A solução definitiva é fazer redeploy

    const tokenAntes = process.env.WHATSAPP_ACCESS_TOKEN
    console.log("[v0] Token ANTES do reload (primeiros 20 chars):", tokenAntes?.substring(0, 20))
    console.log("[v0] Token ANTES do reload (últimos 10 chars):", tokenAntes?.substring(tokenAntes.length - 10))

    // Limpar o cache do módulo (não funciona em todas as situações)
    delete require.cache[require.resolve("process")]

    const tokenDepois = process.env.WHATSAPP_ACCESS_TOKEN
    console.log("[v0] Token DEPOIS do reload (primeiros 20 chars):", tokenDepois?.substring(0, 20))
    console.log("[v0] Token DEPOIS do reload (últimos 10 chars):", tokenDepois?.substring(tokenDepois.length - 10))

    const mudou = tokenAntes !== tokenDepois

    console.log("[v0] Token mudou após reload?", mudou)
    console.log("[v0] ===== FIM RELOAD =====")

    return NextResponse.json({
      success: true,
      message: mudou
        ? "Token recarregado com sucesso! Mas pode ser necessário redeploy para garantir."
        : "Token não mudou. VOCÊ PRECISA FAZER REDEPLOY no Vercel para as mudanças terem efeito.",
      tokenChanged: mudou,
      tokenPreview: {
        antes: tokenAntes?.substring(0, 20) + "..." + tokenAntes?.substring(tokenAntes.length - 10),
        depois: tokenDepois?.substring(0, 20) + "..." + tokenDepois?.substring(tokenDepois.length - 10),
      },
      instructions: [
        "1. Vá para https://vercel.com/seu-projeto",
        "2. Clique na aba 'Deployments'",
        "3. Clique nos três pontinhos (...) no deployment mais recente",
        "4. Clique em 'Redeploy'",
        "5. Aguarde o deployment terminar",
        "6. Teste novamente",
      ],
    })
  } catch (error) {
    console.error("[v0] Erro ao forçar reload:", error)
    return NextResponse.json(
      {
        error: "Erro ao forçar reload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
