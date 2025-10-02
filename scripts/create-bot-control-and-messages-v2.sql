-- Tabela para controlar quando o bot está desativado para números específicos
CREATE TABLE IF NOT EXISTS bot_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL UNIQUE,
  bot_ativo BOOLEAN DEFAULT true,
  desativado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_control_telefone ON bot_control(telefone);

-- Tabela para armazenar conversas do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_telefone TEXT NOT NULL UNIQUE,
  cliente_nome TEXT,
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_telefone ON whatsapp_conversas(cliente_telefone);

-- Tabela para armazenar mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('recebida', 'enviada')),
  remetente TEXT NOT NULL CHECK (remetente IN ('cliente', 'admin', 'bot')),
  conteudo TEXT NOT NULL,
  whatsapp_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_conversa ON whatsapp_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_created ON whatsapp_mensagens(created_at);
