-- Remove todas as tabelas de backup de conversas do WhatsApp

-- Remove tabela de mensagens backup (primeiro por causa da foreign key)
DROP TABLE IF EXISTS whatsapp_mensagens_backup CASCADE;

-- Remove tabela de conversas backup
DROP TABLE IF EXISTS whatsapp_conversas_backup CASCADE;

-- Remove tabela de configuração de backup
DROP TABLE IF EXISTS whatsapp_backup_config CASCADE;
