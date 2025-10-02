-- Tabelas para backup de conversas do WhatsApp

-- Tabela de configuração de backup
CREATE TABLE IF NOT EXISTS whatsapp_backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_automatico BOOLEAN DEFAULT false,
  intervalo_dias INTEGER DEFAULT 7,
  manter_dias INTEGER DEFAULT 30,
  ultimo_backup TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de backup de conversas
CREATE TABLE IF NOT EXISTS whatsapp_conversas_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id_original UUID NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  status TEXT NOT NULL,
  ultima_mensagem TEXT,
  session_id TEXT,
  data_backup TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at_original TIMESTAMP WITH TIME ZONE,
  updated_at_original TIMESTAMP WITH TIME ZONE
);

-- Tabela de backup de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_mensagens_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id_original UUID NOT NULL,
  conversa_backup_id UUID REFERENCES whatsapp_conversas_backup(id) ON DELETE CASCADE,
  conversa_id_original UUID NOT NULL,
  tipo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  message_id TEXT,
  status TEXT,
  data_backup TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at_original TIMESTAMP WITH TIME ZONE
);

-- Inserir configuração padrão se não existir
INSERT INTO whatsapp_backup_config (backup_automatico, intervalo_dias, manter_dias) 
SELECT false, 7, 30
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_backup_config);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_backup_telefone ON whatsapp_conversas_backup(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_backup_nome ON whatsapp_conversas_backup(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_backup_data ON whatsapp_conversas_backup(data_backup);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_backup_conversa ON whatsapp_mensagens_backup(conversa_backup_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_backup_data ON whatsapp_mensagens_backup(data_backup);
