-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  complemento TEXT,
  total_pedidos INTEGER DEFAULT 0,
  total_gasto NUMERIC(10, 2) DEFAULT 0,
  ultimo_pedido_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_ultimo_pedido ON clientes(ultimo_pedido_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_total_gasto ON clientes(total_gasto DESC);

-- Adicionar coluna cliente_id na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Criar índice para a foreign key
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_clientes_updated_at ON clientes;
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION atualizar_estatisticas_cliente(p_cliente_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE clientes
  SET 
    total_pedidos = (
      SELECT COUNT(*) 
      FROM pedidos 
      WHERE cliente_id = p_cliente_id
    ),
    total_gasto = (
      SELECT COALESCE(SUM(total), 0) 
      FROM pedidos 
      WHERE cliente_id = p_cliente_id
    ),
    ultimo_pedido_at = (
      SELECT MAX(created_at) 
      FROM pedidos 
      WHERE cliente_id = p_cliente_id
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE cliente_id = p_cliente_id) > 500 THEN 'vip'
      WHEN (SELECT MAX(created_at) FROM pedidos WHERE cliente_id = p_cliente_id) < NOW() - INTERVAL '90 days' THEN 'inativo'
      ELSE 'ativo'
    END
  WHERE id = p_cliente_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE clientes IS 'Tabela de clientes do sistema';
COMMENT ON COLUMN clientes.status IS 'Status do cliente: ativo (comprou nos últimos 90 dias), inativo (mais de 90 dias sem comprar), vip (gastou mais de R$ 500)';
