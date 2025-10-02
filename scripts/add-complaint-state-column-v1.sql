-- Adicionar coluna para armazenar estado da reclamação na conversa
ALTER TABLE whatsapp_conversas
ADD COLUMN IF NOT EXISTS complaint_state JSONB DEFAULT NULL;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_complaint_state 
ON whatsapp_conversas USING GIN (complaint_state);

-- Comentário explicativo
COMMENT ON COLUMN whatsapp_conversas.complaint_state IS 'Estado atual do fluxo de reclamação (stage, category, orderNumber, description)';
