// Esta rota não é mais necessária com a implementação de polling otimizado

export async function GET() {
  return new Response("SSE endpoint removido - usando polling otimizado", {
    status: 410, // Gone
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
