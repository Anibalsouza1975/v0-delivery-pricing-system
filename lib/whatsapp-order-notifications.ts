import { createClient } from "@/lib/supabase/server"

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

export async function enviarNotificacaoPedido(data: OrderNotificationData): Promise<boolean> {
  try {
    const { clienteTelefone, status } = data

    console.log("[v0] 🔔 Iniciando envio de notificação de pedido")
    console.log("[v0] Status:", status)
    console.log("[v0] Telefone:", clienteTelefone)

    // Validar telefone
    if (!clienteTelefone || clienteTelefone.trim() === "") {
      console.log("[v0] ❌ Telefone não informado, notificação não enviada")
      return false
    }

    // Formatar telefone (remover caracteres especiais)
    const telefoneFormatado = clienteTelefone.replace(/\D/g, "")

    // Verificar se tem pelo menos 10 dígitos
    if (telefoneFormatado.length < 10) {
      console.log("[v0] ❌ Telefone inválido:", clienteTelefone)
      return false
    }

    // Adicionar código do país se não tiver
    const telefoneCompleto = telefoneFormatado.startsWith("55") ? telefoneFormatado : `55${telefoneFormatado}`

    // Gerar mensagem personalizada
    const mensagem = getStatusMessage(status, data)

    console.log("[v0] 📝 Mensagem gerada:", mensagem.substring(0, 50) + "...")

    // Buscar configuração do WhatsApp
    const supabase = await createClient()
    const { data: configData } = await supabase.from("whatsapp_config").select("token_whatsapp").single()

    const WHATSAPP_ACCESS_TOKEN = configData?.token_whatsapp || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
      console.error("[v0] ❌ WhatsApp não configurado (token ou phone number ID ausente)")
      return false
    }

    console.log("[v0] 📤 Enviando mensagem via WhatsApp API...")

    // Enviar mensagem via WhatsApp Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefoneCompleto,
        type: "text",
        text: {
          body: mensagem,
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar mensagem WhatsApp:", result)
      return false
    }

    console.log("[v0] ✅ Mensagem enviada com sucesso:", result.messages?.[0]?.id)

    // Salvar mensagem no banco de dados
    try {
      // Buscar ou criar conversa
      const { data: conversa } = await supabase
        .from("whatsapp_conversas")
        .select("id")
        .eq("cliente_telefone", telefoneCompleto)
        .single()

      if (conversa) {
        await supabase.from("whatsapp_mensagens").insert({
          conversa_id: conversa.id,
          tipo: "bot",
          conteudo: mensagem,
        })

        // Atualizar última mensagem da conversa
        await supabase
          .from("whatsapp_conversas")
          .update({
            ultima_mensagem: mensagem,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversa.id)

        console.log("[v0] 💾 Mensagem salva no banco de dados")
      } else {
        console.log("[v0] ⚠️ Conversa não encontrada, mensagem não salva no banco")
      }
    } catch (dbError) {
      console.error("[v0] ⚠️ Erro ao salvar mensagem no banco (não crítico):", dbError)
      // Não falhar a notificação por causa do erro no banco
    }

    return true
  } catch (error) {
    console.error("[v0] ❌ Erro ao enviar notificação:", error)
    return false
  }
}
