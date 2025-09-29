"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    window.location.href = "/"
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Redirecionando...</h1>
        <p className="text-slate-600">Você será redirecionado para o sistema principal.</p>
      </div>
    </div>
  )
}
