-- Fix whatsapp_mensagens status constraint to allow 'pendente' and 'falha'
-- This allows the webhook to save bot responses correctly

-- Drop the old constraint
ALTER TABLE whatsapp_mensagens 
DROP CONSTRAINT IF EXISTS whatsapp_mensagens_status_check;

-- Add new constraint with all status values
ALTER TABLE whatsapp_mensagens 
ADD CONSTRAINT whatsapp_mensagens_status_check 
CHECK (status IN ('enviada', 'entregue', 'lida', 'erro', 'pendente', 'falha'));

-- Update any existing messages with invalid status to 'enviada'
UPDATE whatsapp_mensagens 
SET status = 'enviada' 
WHERE status NOT IN ('enviada', 'entregue', 'lida', 'erro', 'pendente', 'falha');
