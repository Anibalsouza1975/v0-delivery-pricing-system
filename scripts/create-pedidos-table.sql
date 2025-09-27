-- Criar tabela de pedidos para o controle de produção
CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  numero_pedido TEXT UNIQUE NOT NULL,
  
  -- Dados do cliente
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_endereco TEXT,
  cliente_complemento TEXT,
  cliente_bairro TEXT,
  cliente_cep TEXT,
  cliente_observacoes TEXT,
  
  -- Dados do pedido
  itens JSONB NOT NULL, -- Array de itens com personalizações
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) NOT NULL DEFAULT 0, -- Renomeado de taxa_entrega para frete
  total DECIMAL(10,2) NOT NULL,
  
  -- Controle
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'concluido')),
  forma_pagamento TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'menu' CHECK (origem IN ('menu', 'vendas')),
  tempo_estimado INTEGER DEFAULT 35, -- Adicionado tempo estimado em minutos
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Observações gerais do pedido
  observacoes TEXT -- Renomeado de observacoes_pedido para observacoes
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_origem ON pedidos(origem);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_telefone ON pedidos(cliente_telefone); -- Índice para busca por telefone

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security para maior segurança
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajustar conforme necessário)
CREATE POLICY "Enable all operations for authenticated users" ON pedidos
    FOR ALL USING (true);

-- Política para permitir leitura pública (para o menu de clientes)
CREATE POLICY "Enable read access for all users" ON pedidos
    FOR SELECT USING (true);

-- Comentários para documentação
COMMENT ON TABLE pedidos IS 'Tabela para armazenar todos os pedidos do sistema de delivery';
COMMENT ON COLUMN pedidos.itens IS 'JSON com array de itens, incluindo personalizações e observações';
COMMENT ON COLUMN pedidos.origem IS 'Origem do pedido: menu (online) ou vendas (balcão)';
COMMENT ON COLUMN pedidos.status IS 'Status atual do pedido no fluxo de produção';
COMMENT ON COLUMN pedidos.frete IS 'Valor da taxa de entrega em reais';
COMMENT ON COLUMN pedidos.tempo_estimado IS 'Tempo estimado de preparo em minutos';

-- Inserir dados de exemplo para teste (opcional)
INSERT INTO pedidos (
  id, numero_pedido, cliente_nome, cliente_telefone, cliente_endereco,
  itens, subtotal, frete, total, forma_pagamento, status
) VALUES (
  'PED_EXEMPLO_001',
  'PED_EXEMPLO_001', 
  'Cliente Teste',
  '11999999999',
  'Rua Teste, 123 - Centro',
  '[{"nome": "Hambúrguer Teste", "quantidade": 1, "preco": 15.00}]'::jsonb,
  15.00,
  5.00,
  20.00,
  'pix',
  'pendente'
) ON CONFLICT (id) DO NOTHING;
