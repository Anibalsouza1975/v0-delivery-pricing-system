-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias existentes baseadas nos produtos atuais
INSERT INTO categorias (nome, descricao) 
SELECT DISTINCT categoria, 'Categoria criada automaticamente' 
FROM produtos 
WHERE categoria IS NOT NULL AND categoria != ''
ON CONFLICT (nome) DO NOTHING;

-- Inserir categorias padrão se não existirem
INSERT INTO categorias (nome, descricao) VALUES
  ('Hambúrgueres', 'Hambúrgueres e sanduíches'),
  ('Batatas', 'Batatas fritas e acompanhamentos'),
  ('BBQ', 'Produtos com molho barbecue'),
  ('Pizzas', 'Pizzas variadas'),
  ('Sanduíches', 'Sanduíches diversos'),
  ('Saladas', 'Saladas e pratos leves'),
  ('Pratos Executivos', 'Refeições completas'),
  ('Lanches', 'Lanches rápidos'),
  ('Sobremesas', 'Doces e sobremesas'),
  ('Bebidas', 'Bebidas diversas'),
  ('Molhos', 'Molhos e condimentos'),
  ('Acompanhamentos', 'Acompanhamentos diversos'),
  ('Promoções', 'Produtos em promoção'),
  ('Combos', 'Combos e kits'),
  ('Outros', 'Outros produtos')
ON CONFLICT (nome) DO NOTHING;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
