-- Script para corrigir tipos de mensagem existentes no banco
-- Converte tipos antigos para os novos tipos compatíveis com a interface

-- Atualizar mensagens do tipo "recebida" para "cliente"
UPDATE whatsapp_mensagens 
SET tipo = 'cliente' 
WHERE tipo = 'recebida';

-- Atualizar mensagens do tipo "enviada" para "bot"
UPDATE whatsapp_mensagens 
SET tipo = 'bot' 
WHERE tipo = 'enviada';

-- Verificar se há outros tipos que precisam ser corrigidos
SELECT tipo, COUNT(*) as quantidade 
FROM whatsapp_mensagens 
GROUP BY tipo;
