"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import StatusPedidoClienteModule from "@/components/modules/status-pedido-cliente"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function AcompanharPedidoContent() {
  const searchParams = useSearchParams()
  const numeroPedido = searchParams.get("numero") || ""

  return <StatusPedidoClienteModule initialNumero={numeroPedido} />
}

export default function AcompanharPedidoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="border-b bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold text-white">Cartago Burguer Grill</h1>
            <p className="text-orange-100 mt-1 md:mt-2 text-sm md:text-base">Acompanhe seu pedido em tempo real</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando...</span>
              </CardContent>
            </Card>
          }
        >
          <AcompanharPedidoContent />
        </Suspense>
      </main>
    </div>
  )
}
