-- Schema completo do sistema de precificação de delivery
-- Baseado na estrutura atual do localStorage

-- ============================================================================
-- TABELAS PRINCIPAIS DO SISTEMA
-- ============================================================================

-- Custos Fixos (aluguel, funcionários, etc.)
CREATE TABLE IF NOT EXISTS public.custos_fixos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  frequencia TEXT DEFAULT 'mensal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custos Variáveis (taxas percentuais)
CREATE TABLE IF NOT EXISTS public.custos_variaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  percentual DECIMAL(5,2) NOT NULL,
  categoria TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredientes Base (matérias-primas que você compra)
CREATE TABLE IF NOT EXISTS public.ingredientes_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade TEXT NOT NULL,
  preco_unitario DECIMAL(10,4) NOT NULL,
  fornecedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insumos (ingredientes processados/porcionados para receitas)
CREATE TABLE IF NOT EXISTS public.insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade TEXT NOT NULL,
  preco_unitario DECIMAL(10,4) NOT NULL,
  ingrediente_base_id UUID REFERENCES public.ingredientes_base(id) ON DELETE SET NULL,
  rendimento DECIMAL(10,4) DEFAULT 1, -- quantos insumos saem de 1 ingrediente base
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produtos (itens do cardápio)
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  cmv DECIMAL(10,4) DEFAULT 0, -- calculado automaticamente
  preco_venda DECIMAL(10,2) NOT NULL,
  margem_lucro DECIMAL(5,2) DEFAULT 0, -- calculado automaticamente
  tempo_preparo INTEGER DEFAULT 15, -- em minutos
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receitas (relaciona produtos com insumos)
CREATE TABLE IF NOT EXISTS public.produto_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, insumo_id)
);

-- Bebidas
CREATE TABLE IF NOT EXISTS public.bebidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  custo_unitario DECIMAL(10,4) NOT NULL,
  markup DECIMAL(5,2) DEFAULT 100, -- percentual de markup
  preco_venda DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Combos
CREATE TABLE IF NOT EXISTS public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  preco_final DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens dos Combos (produtos)
CREATE TABLE IF NOT EXISTS public.combo_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(combo_id, produto_id)
);

-- Bebidas dos Combos
CREATE TABLE IF NOT EXISTS public.combo_bebidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  bebida_id UUID NOT NULL REFERENCES public.bebidas(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(combo_id, bebida_id)
);

-- Controle de Estoque (FIFO)
CREATE TABLE IF NOT EXISTS public.estoque_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade_atual DECIMAL(10,4) NOT NULL DEFAULT 0,
  quantidade_minima DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(insumo_id)
);

-- Compras de Insumos (para controle FIFO)
CREATE TABLE IF NOT EXISTS public.compras_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade DECIMAL(10,4) NOT NULL,
  preco_unitario DECIMAL(10,4) NOT NULL,
  quantidade_restante DECIMAL(10,4) NOT NULL, -- para controle FIFO
  data_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT UNIQUE NOT NULL,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  cliente_endereco TEXT,
  total DECIMAL(10,2) NOT NULL,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'dinheiro',
  status TEXT DEFAULT 'pendente', -- pendente, preparando, pronto, entregue, cancelado
  observacoes TEXT,
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens das Vendas
CREATE TABLE IF NOT EXISTS public.itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  bebida_id UUID REFERENCES public.bebidas(id) ON DELETE SET NULL,
  combo_id UUID REFERENCES public.combos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notificações do Sistema
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT DEFAULT 'info', -- info, warning, error, success
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_bebidas_ativo ON public.bebidas(ativo);
CREATE INDEX IF NOT EXISTS idx_combos_ativo ON public.combos(ativo);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_produto_id ON public.produto_insumos(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_insumos_insumo_id ON public.estoque_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_compras_insumos_insumo_id ON public.compras_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_custos_fixos_updated_at BEFORE UPDATE ON public.custos_fixos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custos_variaveis_updated_at BEFORE UPDATE ON public.custos_variaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ingredientes_base_updated_at BEFORE UPDATE ON public.ingredientes_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON public.insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bebidas_updated_at BEFORE UPDATE ON public.bebidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combos_updated_at BEFORE UPDATE ON public.combos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estoque_insumos_updated_at BEFORE UPDATE ON public.estoque_insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
