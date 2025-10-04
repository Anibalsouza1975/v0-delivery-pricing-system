-- Migrar clientes existentes da tabela pedidos para a tabela clientes
-- Este script extrai clientes únicos dos pedidos e popula a tabela clientes

INSERT INTO clientes (
  nome,
  telefone,
  endereco,
  complemento,
  total_pedidos,
  total_gasto,
  ultimo_pedido_at,
  created_at,
  status
)
SELECT 
  COALESCE(NULLIF(TRIM(cliente_nome), ''), 'Cliente') as nome,
  cliente_telefone as telefone,
  cliente_endereco as endereco,
  cliente_complemento as complemento,
  COUNT(*) as total_pedidos,
  COALESCE(SUM(total), 0) as total_gasto,
  MAX(created_at) as ultimo_pedido_at,
  MIN(created_at) as created_at,
  CASE
    WHEN COALESCE(SUM(total), 0) > 500 THEN 'vip'
    WHEN MAX(created_at) < NOW() - INTERVAL '90 days' THEN 'inativo'
    ELSE 'ativo'
  END as status
FROM pedidos
WHERE cliente_telefone IS NOT NULL 
  AND TRIM(cliente_telefone) != ''
GROUP BY cliente_telefone, cliente_nome, cliente_endereco, cliente_complemento
ON CONFLICT (telefone) DO UPDATE SET
  total_pedidos = EXCLUDED.total_pedidos,
  total_gasto = EXCLUDED.total_gasto,
  ultimo_pedido_at = EXCLUDED.ultimo_pedido_at,
  status = EXCLUDED.status;

-- Atualizar pedidos existentes com o cliente_id correspondente
UPDATE pedidos p
SET cliente_id = c.id
FROM clientes c
WHERE p.cliente_telefone = c.telefone
  AND p.cliente_id IS NULL;

-- Verificar resultados da migração
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
  COUNT(CASE WHEN status = 'vip' THEN 1 END) as clientes_vip,
  COUNT(CASE WHEN status = 'inativo' THEN 1 END) as clientes_inativos
FROM clientes;
