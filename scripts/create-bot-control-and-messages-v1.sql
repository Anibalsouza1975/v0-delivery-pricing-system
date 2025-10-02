-- Tabela para controlar status do bot por número
CREATE TABLE IF NOT EXISTS bot_control (
  id SERIAL PRIMARY KEY,
  telefone VARCHAR(20) UNIQUE NOT NULL,
  bot_ativo BOOLEAN DEFAULT true,
  desativado_por VARCHAR(100),
  data_desativacao TIMESTAMP,
  data_reativacao TIMESTAMP,
  motivo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar histórico de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  telefone VARCHAR(20) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'recebida' ou 'enviada'
  remetente VARCHAR(50), -- 'cliente', 'bot', ou 'admin'
  admin_nome VARCHAR(100),
  message_id VARCHAR(100),
  status VARCHAR(20), -- 'enviada', 'entregue', 'lida', 'erro'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bot_control_telefone ON bot_control(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_telefone ON whatsapp_messages(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_bot_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bot_control_updated_at
BEFORE UPDATE ON bot_control
FOR EACH ROW
EXECUTE FUNCTION update_bot_control_updated_at();
