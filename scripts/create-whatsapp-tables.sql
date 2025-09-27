-- Tabelas para o sistema de Auto Atendimento WhatsApp

-- Configurações do bot WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo BOOLEAN DEFAULT false,
  nome_bot TEXT DEFAULT 'Cartago Bot',
  mensagem_boas_vindas TEXT DEFAULT 'Olá! 👋 Bem-vindo ao Cartago Burger Grill!',
  horario_inicio TIME DEFAULT '18:00',
  horario_fim TIME DEFAULT '23:00',
  respostas_automaticas JSONB DEFAULT '{"cardapio": true, "precos": true, "horarios": true, "localizacao": true, "pedidos": true}',
  webhook_url TEXT,
  token_whatsapp TEXT,
  phone_number_id TEXT,
  status_conexao TEXT DEFAULT 'desconectado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversas do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada', 'aguardando')),
  ultima_mensagem TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens das conversas
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'bot', 'atendente')),
  conteudo TEXT NOT NULL,
  message_id TEXT, -- ID da mensagem do WhatsApp
  status TEXT DEFAULT 'enviada' CHECK (status IN ('enviada', 'entregue', 'lida', 'erro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Métricas do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE DEFAULT CURRENT_DATE,
  total_conversas INTEGER DEFAULT 0,
  conversas_ativas INTEGER DEFAULT 0,
  mensagens_enviadas INTEGER DEFAULT 0,
  mensagens_recebidas INTEGER DEFAULT 0,
  taxa_resposta DECIMAL(5,2) DEFAULT 0,
  tempo_medio_resposta INTEGER DEFAULT 0, -- em segundos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO whatsapp_config (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_config);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_telefone ON whatsapp_conversas(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_status ON whatsapp_conversas(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_conversa ON whatsapp_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_created ON whatsapp_mensagens(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_metricas_data ON whatsapp_metricas(data);
