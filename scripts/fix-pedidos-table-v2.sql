-- Corrigir estrutura da tabela de pedidos para corresponder ao que a API espera
-- Verificar se a tabela existe e tem as colunas corretas

-- Adicionar colunas que podem estar faltando
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS frete DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_estimado INTEGER DEFAULT 35,
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'menu';

-- Atualizar constraint de origem se necessário
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_origem_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_origem_check CHECK (origem IN ('menu', 'vendas'));

-- Renomear taxa_entrega para frete se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'taxa_entrega') THEN
        -- Copiar dados de taxa_entrega para frete
        UPDATE pedidos SET frete = taxa_entrega WHERE frete IS NULL OR frete = 0;
        -- Remover coluna antiga
        ALTER TABLE pedidos DROP COLUMN taxa_entrega;
    END IF;
END $$;

-- Renomear observacoes_pedido para observacoes se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'observacoes_pedido') THEN
        -- Copiar dados
        UPDATE pedidos SET observacoes = observacoes_pedido WHERE observacoes IS NULL;
        -- Remover coluna antiga
        ALTER TABLE pedidos DROP COLUMN observacoes_pedido;
    END IF;
END $$;

-- Renomear cliente_observacoes para cliente_complemento se necessário
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'cliente_observacoes') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'cliente_complemento') THEN
        ALTER TABLE pedidos RENAME COLUMN cliente_observacoes TO cliente_complemento;
    END IF;
END $$;

-- Garantir que todos os pedidos tenham origem definida
UPDATE pedidos SET origem = 'menu' WHERE origem IS NULL;

-- Garantir que todos os pedidos tenham frete definido
UPDATE pedidos SET frete = 0 WHERE frete IS NULL;

-- Garantir que todos os pedidos tenham tempo_estimado definido
UPDATE pedidos SET tempo_estimado = 35 WHERE tempo_estimado IS NULL;

-- Criar índices otimizados se não existirem
CREATE INDEX IF NOT EXISTS idx_pedidos_status_created ON pedidos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_origem_status ON pedidos(origem, status);

-- Atualizar políticas RLS para garantir acesso
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pedidos;
DROP POLICY IF EXISTS "Enable read access for all users" ON pedidos;

-- Política mais permissiva para desenvolvimento
CREATE POLICY "Enable all operations for all users" ON pedidos
    FOR ALL USING (true);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;
