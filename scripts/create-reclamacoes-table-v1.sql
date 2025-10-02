-- Criar tabela de reclamações/suporte
CREATE TABLE IF NOT EXISTS reclamacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket TEXT NOT NULL UNIQUE,
  numero_pedido TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  resposta TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_resolucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reclamacoes_status ON reclamacoes(status);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_numero_pedido ON reclamacoes(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_cliente_telefone ON reclamacoes(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_data_criacao ON reclamacoes(data_criacao DESC);

-- Comentários para documentação
COMMENT ON TABLE reclamacoes IS 'Tabela para gerenciar reclamações e tickets de suporte dos clientes';
COMMENT ON COLUMN reclamacoes.numero_ticket IS 'Número único do ticket de suporte (ex: TKT20250110001)';
COMMENT ON COLUMN reclamacoes.categoria IS 'Categoria da reclamação: problema_pedido, problema_entrega, qualidade_produto, problema_pagamento, outro';
COMMENT ON COLUMN reclamacoes.status IS 'Status do ticket: aberto, em_andamento, resolvido, fechado';
