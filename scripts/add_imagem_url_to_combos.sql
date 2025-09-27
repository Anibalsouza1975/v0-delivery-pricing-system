-- Adicionar coluna imagem_url à tabela combos
ALTER TABLE combos ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN combos.imagem_url IS 'URL ou base64 da imagem do combo';
