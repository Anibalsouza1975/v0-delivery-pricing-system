-- Configuração de Row Level Security (RLS) para as tabelas do Cartago BD
-- Este script habilita RLS e cria políticas básicas para acesso público aos dados

-- Habilitar RLS em todas as tabelas
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bebidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas para insumos (ingredientes)
CREATE POLICY "Allow public read access on insumos" ON insumos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on insumos" ON insumos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on insumos" ON insumos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on insumos" ON insumos FOR DELETE USING (true);

-- Políticas para produtos
CREATE POLICY "Allow public read access on produtos" ON produtos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on produtos" ON produtos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on produtos" ON produtos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on produtos" ON produtos FOR DELETE USING (true);

-- Políticas para produto_insumos
CREATE POLICY "Allow public read access on produto_insumos" ON produto_insumos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on produto_insumos" ON produto_insumos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on produto_insumos" ON produto_insumos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on produto_insumos" ON produto_insumos FOR DELETE USING (true);

-- Políticas para bebidas
CREATE POLICY "Allow public read access on bebidas" ON bebidas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on bebidas" ON bebidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on bebidas" ON bebidas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on bebidas" ON bebidas FOR DELETE USING (true);

-- Políticas para combos
CREATE POLICY "Allow public read access on combos" ON combos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on combos" ON combos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on combos" ON combos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on combos" ON combos FOR DELETE USING (true);

-- Políticas para custos_fixos
CREATE POLICY "Allow public read access on custos_fixos" ON custos_fixos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on custos_fixos" ON custos_fixos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on custos_fixos" ON custos_fixos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on custos_fixos" ON custos_fixos FOR DELETE USING (true);

-- Políticas para custos_variaveis
CREATE POLICY "Allow public read access on custos_variaveis" ON custos_variaveis FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on custos_variaveis" ON custos_variaveis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on custos_variaveis" ON custos_variaveis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on custos_variaveis" ON custos_variaveis FOR DELETE USING (true);

-- Políticas para estoque_insumos
CREATE POLICY "Allow public read access on estoque_insumos" ON estoque_insumos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on estoque_insumos" ON estoque_insumos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on estoque_insumos" ON estoque_insumos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on estoque_insumos" ON estoque_insumos FOR DELETE USING (true);

-- Políticas para vendas
CREATE POLICY "Allow public read access on vendas" ON vendas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on vendas" ON vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on vendas" ON vendas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on vendas" ON vendas FOR DELETE USING (true);

-- Comentários explicativos
COMMENT ON TABLE insumos IS 'Tabela de ingredientes/insumos utilizados nos produtos';
COMMENT ON TABLE produtos IS 'Tabela de produtos do cardápio';
COMMENT ON TABLE produto_insumos IS 'Relação entre produtos e seus ingredientes com quantidades';
COMMENT ON TABLE bebidas IS 'Tabela de bebidas disponíveis';
COMMENT ON TABLE combos IS 'Tabela de combos/promoções';
COMMENT ON TABLE custos_fixos IS 'Custos fixos mensais do negócio';
COMMENT ON TABLE custos_variaveis IS 'Custos variáveis percentuais sobre vendas';
COMMENT ON TABLE estoque_insumos IS 'Controle de estoque dos ingredientes';
COMMENT ON TABLE vendas IS 'Registro de vendas realizadas';
