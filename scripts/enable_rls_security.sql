-- Habilitar Row Level Security nas tabelas adicionais e personalizacoes
ALTER TABLE adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações (equivalente ao estado atual)
-- Você pode modificar essas políticas depois para ser mais restritivo

-- Políticas para tabela adicionais
CREATE POLICY "Allow all operations on adicionais" ON adicionais
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para tabela personalizacoes  
CREATE POLICY "Allow all operations on personalizacoes" ON personalizacoes
FOR ALL USING (true) WITH CHECK (true);
