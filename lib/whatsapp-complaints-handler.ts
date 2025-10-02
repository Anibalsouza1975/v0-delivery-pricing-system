import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Palavras-chave que indicam reclamação
const COMPLAINT_KEYWORDS = [
  "problema",
  "reclamação",
  "reclamacao",
  "errado",
  "atrasado",
  "não chegou",
  "nao chegou",
  "frio",
  "ruim",
  "péssimo",
  "pessimo",
  "horrível",
  "horrivel",
  "cancelar",
  "demorou",
  "demora",
  "insatisfeito",
  "decepcionado",
  "decepção",
  "decepcao",
  "faltando",
  "falta",
  "incorreto",
  "mal feito",
  "queimado",
  "cru",
  "estragado",
]

// Categorias de reclamação
export const COMPLAINT_CATEGORIES = {
  PEDIDO: "Problema com o pedido",
  ENTREGA: "Problema com a entrega",
  QUALIDADE: "Qualidade do produto",
  PAGAMENTO: "Problema com pagamento",
  OUTRO: "Outro assunto",
}

// Estados da conversa de reclamação
export type ComplaintState = {
  stage: "detecting" | "confirming" | "category" | "order_number" | "description" | "completed"
  category?: string
  orderNumber?: string
  description?: string
}

// Detectar se a mensagem contém palavras de reclamação
export function detectComplaint(message: string): boolean {
  const messageLower = message.toLowerCase()
  return COMPLAINT_KEYWORDS.some((keyword) => messageLower.includes(keyword))
}

// Obter estado da reclamação do cliente
export async function getComplaintState(telefone: string): Promise<ComplaintState | null> {
  try {
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("complaint_state")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa?.complaint_state) {
      return conversa.complaint_state as ComplaintState
    }

    return null
  } catch (error) {
    console.error("[v0] Erro ao buscar estado de reclamação:", error)
    return null
  }
}

// Salvar estado da reclamação
export async function saveComplaintState(telefone: string, state: ComplaintState | null): Promise<void> {
  try {
    const { data: conversa } = await supabase
      .from("whatsapp_conversas")
      .select("id")
      .eq("cliente_telefone", telefone)
      .single()

    if (conversa) {
      await supabase.from("whatsapp_conversas").update({ complaint_state: state }).eq("id", conversa.id)
    }
  } catch (error) {
    console.error("[v0] Erro ao salvar estado de reclamação:", error)
  }
}

// Criar ticket de reclamação no banco
export async function createComplaintTicket(
  telefone: string,
  clienteNome: string,
  categoria: string,
  descricao: string,
  numeroPedido?: string,
): Promise<string | null> {
  try {
    // Gerar número do ticket
    const { data: lastTicket } = await supabase
      .from("reclamacoes")
      .select("numero_ticket")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let numeroTicket = "REC001"
    if (lastTicket?.numero_ticket) {
      const lastNumber = Number.parseInt(lastTicket.numero_ticket.replace("REC", ""))
      numeroTicket = `REC${String(lastNumber + 1).padStart(3, "0")}`
    }

    // Criar ticket
    const { data: ticket, error } = await supabase
      .from("reclamacoes")
      .insert({
        numero_ticket: numeroTicket,
        numero_pedido: numeroPedido || null,
        cliente_nome: clienteNome,
        cliente_telefone: telefone,
        categoria,
        descricao,
        status: "aberto",
      })
      .select("numero_ticket")
      .single()

    if (error) {
      console.error("[v0] Erro ao criar ticket de reclamação:", error)
      return null
    }

    console.log("[v0] Ticket de reclamação criado:", ticket.numero_ticket)
    return ticket.numero_ticket
  } catch (error) {
    console.error("[v0] Erro ao criar ticket:", error)
    return null
  }
}

// Processar mensagem no contexto de reclamação
export async function processComplaintMessage(
  message: string,
  telefone: string,
  clienteNome: string,
): Promise<{ response: string; shouldContinue: boolean }> {
  const currentState = await getComplaintState(telefone)

  // Se não há estado, detectar se é uma reclamação
  if (!currentState) {
    const isComplaint = detectComplaint(message)

    if (isComplaint) {
      // Oferecer registrar reclamação
      await saveComplaintState(telefone, { stage: "confirming" })

      return {
        response:
          "Percebi que você está com um problema. Gostaria de registrar uma reclamação formal? Isso nos ajudará a resolver sua situação mais rapidamente.\n\n" +
          "Digite SIM para registrar ou NÃO para continuar a conversa normal.",
        shouldContinue: false,
      }
    }

    return { response: "", shouldContinue: true }
  }

  // Processar baseado no estágio
  switch (currentState.stage) {
    case "confirming":
      const wantsToComplain = /sim|quero|confirmo|registrar|yes/i.test(message)

      if (wantsToComplain) {
        await saveComplaintState(telefone, { stage: "category" })

        return {
          response:
            "Entendi! Vou registrar sua reclamação. Primeiro, selecione a categoria do problema:\n\n" +
            "1️⃣ Problema com o pedido (item errado, faltando, etc.)\n" +
            "2️⃣ Problema com a entrega (atrasada, não chegou, etc.)\n" +
            "3️⃣ Qualidade do produto (frio, mal feito, etc.)\n" +
            "4️⃣ Problema com pagamento\n" +
            "5️⃣ Outro assunto\n\n" +
            "Digite o número da categoria:",
          shouldContinue: false,
        }
      } else {
        // Cliente não quer registrar reclamação
        await saveComplaintState(telefone, null)

        return {
          response: "Entendido! Como posso ajudar você então?",
          shouldContinue: true,
        }
      }

    case "category":
      const categoryMap: Record<string, string> = {
        "1": COMPLAINT_CATEGORIES.PEDIDO,
        "2": COMPLAINT_CATEGORIES.ENTREGA,
        "3": COMPLAINT_CATEGORIES.QUALIDADE,
        "4": COMPLAINT_CATEGORIES.PAGAMENTO,
        "5": COMPLAINT_CATEGORIES.OUTRO,
      }

      const selectedCategory = categoryMap[message.trim()]

      if (selectedCategory) {
        await saveComplaintState(telefone, {
          ...currentState,
          stage: "order_number",
          category: selectedCategory,
        })

        return {
          response:
            `Categoria selecionada: ${selectedCategory}\n\n` +
            "Qual o número do seu pedido? (Se não tiver ou não se lembrar, digite PULAR)",
          shouldContinue: false,
        }
      } else {
        return {
          response: "Por favor, digite um número de 1 a 5 para selecionar a categoria.",
          shouldContinue: false,
        }
      }

    case "order_number":
      const orderNumber = message.trim().toUpperCase()
      const skipOrder = /pular|skip|não|nao|sem/i.test(message)

      await saveComplaintState(telefone, {
        ...currentState,
        stage: "description",
        orderNumber: skipOrder ? undefined : orderNumber,
      })

      return {
        response:
          "Agora, por favor, descreva detalhadamente o problema que você está enfrentando:\n\n" +
          "(Quanto mais detalhes você fornecer, mais rápido poderemos resolver)",
        shouldContinue: false,
      }

    case "description":
      const description = message.trim()

      if (description.length < 10) {
        return {
          response: "Por favor, forneça mais detalhes sobre o problema (mínimo 10 caracteres).",
          shouldContinue: false,
        }
      }

      // Criar ticket
      const ticketNumber = await createComplaintTicket(
        telefone,
        clienteNome,
        currentState.category!,
        description,
        currentState.orderNumber,
      )

      // Limpar estado
      await saveComplaintState(telefone, null)

      if (ticketNumber) {
        return {
          response:
            `✅ Sua reclamação foi registrada com sucesso!\n\n` +
            `📋 Número do ticket: ${ticketNumber}\n` +
            `📂 Categoria: ${currentState.category}\n` +
            `${currentState.orderNumber ? `📦 Pedido: ${currentState.orderNumber}\n` : ""}` +
            `\n` +
            `Nossa equipe analisará sua reclamação e entrará em contato em breve.\n\n` +
            `Você pode acompanhar o status da sua reclamação informando o número do ticket.\n\n` +
            `Obrigado pelo seu feedback! 🙏`,
          shouldContinue: true,
        }
      } else {
        return {
          response:
            "Desculpe, houve um erro ao registrar sua reclamação. Por favor, tente novamente mais tarde ou entre em contato diretamente conosco.",
          shouldContinue: true,
        }
      }

    default:
      return { response: "", shouldContinue: true }
  }
}

// Adicionar coluna complaint_state na tabela whatsapp_conversas
export async function ensureComplaintStateColumn() {
  try {
    // Esta função seria executada uma vez para adicionar a coluna
    // Você pode criar um script SQL para isso
    console.log("[v0] Verificando coluna complaint_state...")
  } catch (error) {
    console.error("[v0] Erro ao verificar coluna:", error)
  }
}
