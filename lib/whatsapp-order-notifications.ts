// Helper para enviar notificações de pedidos via WhatsApp

interface OrderNotificationData {
  numeroPedido: string
  clienteNome: string
  clienteTelefone: string
  status: string
  total?: number
  enderecoEntrega?: string
}

// Mensagens personalizadas para cada status
const getStatusMessage = (status: string, data: OrderNotificationData): string => {
  const { numeroPedido, clienteNome, total, enderecoEntrega } = data

  switch (status) {
    case "pendente":
      return `🎉 *Pedido Confirmado!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* foi recebido com sucesso!\n\n💰 Total: R$ ${total?.toFixed(2)}\n📍 Endereço: ${enderecoEntrega}\n\nEstamos processando seu pedido. Em breve você receberá atualizações! 😊`

    case "confirmado":
      return `✅ *Pedido Confirmado!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* foi confirmado!\n\nEm breve começaremos a preparar. Tempo estimado: 30-40 minutos ⏱️`

    case "preparando":
      return `👨‍🍳 *Pedido em Preparo!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* está sendo preparado agora!\n\nNossos chefs estão caprichando no seu pedido! 🍔✨`

    case "pronto":
      return `✅ *Pedido Pronto!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* está pronto!\n\nEm breve sairá para entrega! 🚚`

    case "saiu_entrega":
      return `🚚 *Pedido a Caminho!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* saiu para entrega!\n\n📍 Destino: ${enderecoEntrega}\n\nChegará em breve! 🎉`

    case "entregue":
      return `🎉 *Pedido Entregue!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* foi entregue com sucesso!\n\nObrigado pela preferência! Esperamos que aproveite! 😊🍔\n\nVolte sempre! ❤️`

    case "cancelado":
      return `❌ *Pedido Cancelado*\n\nOlá ${clienteNome}!\n\nInfelizmente seu pedido *${numeroPedido}* foi cancelado.\n\nSe tiver dúvidas, entre em contato conosco.`

    default:
      return `📦 *Atualização do Pedido*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* foi atualizado.\n\nStatus: ${status}`
  }
}

// Função para enviar notificação via WhatsApp
export async function enviarNotificacaoPedido(data: OrderNotificationData): Promise<boolean> {
  try {
    const { clienteTelefone, status } = data

    // Validar telefone
    if (!clienteTelefone || clienteTelefone.trim() === "") {
      console.log("[v0] Telefone não informado, notificação não enviada")
      return false
    }

    // Formatar telefone (remover caracteres especiais)
    const telefoneFormatado = clienteTelefone.replace(/\D/g, "")

    // Verificar se tem pelo menos 10 dígitos
    if (telefoneFormatado.length < 10) {
      console.log("[v0] Telefone inválido:", clienteTelefone)
      return false
    }

    // Adicionar código do país se não tiver
    const telefoneCompleto = telefoneFormatado.startsWith("55") ? telefoneFormatado : `55${telefoneFormatado}`

    // Gerar mensagem personalizada
    const mensagem = getStatusMessage(status, data)

    console.log("[v0] Enviando notificação de pedido via WhatsApp")
    console.log("[v0] Telefone:", telefoneCompleto)
    console.log("[v0] Status:", status)

    // Enviar mensagem via API do WhatsApp
    const response = await fetch("/api/whatsapp/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: telefoneCompleto,
        message: mensagem,
        tipo: "notificacao",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Erro ao enviar notificação WhatsApp:", error)
      return false
    }

    const result = await response.json()
    console.log("[v0] Notificação enviada com sucesso:", result.messageId)
    return true
  } catch (error) {
    console.error("[v0] Erro ao enviar notificação:", error)
    return false
  }
}

// Função para enviar notificação com botão de rastreamento
export async function enviarNotificacaoComRastreamento(data: OrderNotificationData): Promise<boolean> {
  try {
    const { clienteTelefone, numeroPedido } = data

    // Validar telefone
    if (!clienteTelefone || clienteTelefone.trim() === "") {
      console.log("[v0] Telefone não informado, notificação não enviada")
      return false
    }

    // Formatar telefone
    const telefoneFormatado = clienteTelefone.replace(/\D/g, "")
    const telefoneCompleto = telefoneFormatado.startsWith("55") ? telefoneFormatado : `55${telefoneFormatado}`

    // URL de rastreamento
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-delivery-pricing-system.vercel.app"
    const trackingUrl = `${siteUrl}/status-pedido?numero=${numeroPedido}`

    // Mensagem inicial
    const mensagem = getStatusMessage(data.status, data)

    console.log("[v0] Enviando notificação com botão de rastreamento")

    // Enviar mensagem com botão
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefoneCompleto,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: mensagem,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: `track_${numeroPedido}`,
                  title: "Acompanhar Pedido 📦",
                },
              },
            ],
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Erro ao enviar notificação com botão:", error)
      // Fallback: enviar mensagem simples
      return await enviarNotificacaoPedido(data)
    }

    const result = await response.json()
    console.log("[v0] Notificação com botão enviada:", result.messages?.[0]?.id)
    return true
  } catch (error) {
    console.error("[v0] Erro ao enviar notificação com botão:", error)
    // Fallback: enviar mensagem simples
    return await enviarNotificacaoPedido(data)
  }
}
