-- Add missing fields to bebidas table
ALTER TABLE bebidas 
ADD COLUMN IF NOT EXISTS imagem_url TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS preco_ifood NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lucro_unitario NUMERIC DEFAULT 0;

-- Update existing records to calculate missing values
UPDATE bebidas 
SET 
  preco_ifood = CASE 
    WHEN preco_venda IS NOT NULL THEN preco_venda * 1.35 -- Assuming 35% markup for iFood
    ELSE 0 
  END,
  lucro_unitario = CASE 
    WHEN preco_venda IS NOT NULL AND custo_unitario IS NOT NULL 
    THEN preco_venda - custo_unitario
    ELSE 0 
  END
WHERE preco_ifood IS NULL OR lucro_unitario IS NULL;
