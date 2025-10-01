import { createClient } from "@/lib/supabase/server"

interface OrderItem {
  nome: string
  quantidade: number
  preco: number
  observacoes?: string
}

interface OrderNotificationData {
  numeroPedido: string
  clienteNome: string
  clienteTelefone: string
  status: string
  total?: number
  subtotal?: number
  taxaEntrega?: number
  enderecoEntrega?: string
  formaPagamento?: string
  itens?: OrderItem[]
  pedidoPago?: boolean
}

const formatarItensPedido = (itens: OrderItem[]): string => {
  let texto = ""

  itens.forEach((item) => {
    const precoTotal = item.quantidade * item.preco
    texto += `${item.quantidade} x ${item.nome}    R$ ${precoTotal.toFixed(2)}\n`
    if (item.observacoes) {
      texto += `   Obs: ${item.observacoes}\n`
    }
  })

  return texto
}

const getStatusMessage = (status: string, data: OrderNotificationData): string => {
  const {
    numeroPedido,
    clienteNome,
    total,
    subtotal,
    taxaEntrega,
    enderecoEntrega,
    formaPagamento,
    itens,
    pedidoPago,
  } = data

  switch (status) {
    case "pendente":
      let mensagemInicial = `🎉 *Pedido Confirmado!*\n\nOlá ${clienteNome}!\n\nSeu pedido *${numeroPedido}* foi recebido com sucesso!\n\n`

      // Adicionar itens do pedido
      if (itens && itens.length > 0) {
        mensagemInicial += `📋 *ITENS DO PEDIDO:*\n`
        mensagemInicial += formatarItensPedido(itens)
        mensagemInicial += `\n`
      }

      // Adicionar totais
      if (subtotal) {
        mensagemInicial += `💰 SUBTOTAL: R$ ${subtotal.toFixed(2)}\n`
      }
      if (taxaEntrega) {
        mensagemInicial += `🚚 + ENTREGA: R$ ${taxaEntrega.toFixed(2)}\n`
      }
      if (total) {
        mensagemInicial += `💵 = TOTAL A PAGAR: R$ ${total.toFixed(2)}\n\n`
      }

      // Adicionar forma de pagamento
      if (formaPagamento) {
        mensagemInicial += `💳 FORMA DE PAGAMENTO: ${formaPagamento.toUpperCase()}\n\n`
      }

      // Adicionar status de pagamento
      if (pedidoPago) {
        mensagemInicial += `✅ *** PEDIDO JÁ PAGO ***\n\n`
      }

      // Adicionar endereço
      if (enderecoEntrega) {
        mensagemInicial += `📍 Endereço: ${enderecoEntrega}\n\n`
      }

      mensagemInicial += `Estamos processando seu pedido. Você receberá atualizações automáticas a cada mudança de status! 😊`

      return mensagemInicial

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

    let messageBody: any

    if (status === "pendente") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seu-site.vercel.app"
      const trackingUrl = `${siteUrl}/acompanhar-pedido?numero=${data.numeroPedido}`

      messageBody = {
        messaging_product: "whatsapp",
        to: telefoneCompleto,
        type: "text",
        text: {
          preview_url: true,
          body: mensagem + `\n\n🔍 Acompanhe seu pedido: ${trackingUrl}`,
        },
      }
    } else {
      messageBody = {
        messaging_product: "whatsapp",
        to: telefoneCompleto,
        type: "text",
        text: {
          body: mensagem,
        },
      }
    }

    // Enviar mensagem via WhatsApp Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody),
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
