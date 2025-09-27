"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Database } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Database className="h-12 w-12 text-primary" />
              <Loader2 className="h-6 w-6 text-primary animate-spin absolute -top-1 -right-1" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Carregando Sistema</h2>
            <p className="text-muted-foreground">Conectando ao banco de dados e carregando seus dados...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
