-- Tabela para controlar quando o bot está desativado para números específicos
CREATE TABLE IF NOT EXISTS bot_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL UNIQUE,
  bot_ativo BOOLEAN DEFAULT true,
  desativado_por TEXT, -- Nome do admin que desativou
  desativado_em TIMESTAMP WITH TIME ZONE,
  reativado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por telefone
CREATE INDEX IF NOT EXISTS idx_bot_control_telefone ON bot_control(telefone);

-- Comentários
COMMENT ON TABLE bot_control IS 'Controla quando o bot está ativo/inativo para números específicos';
COMMENT ON COLUMN bot_control.bot_ativo IS 'true = bot responde automaticamente, false = apenas admin manual';
