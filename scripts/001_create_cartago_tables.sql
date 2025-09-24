-- Criação das tabelas do sistema Cartago BD
-- Baseado na estrutura mostrada pelo usuário

-- Habilitando extensão UUID e corrigindo tipos de dados
-- Habilitar extensão UUID (necessário para gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de insumos (ingredientes)
CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL,
  preco_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  categoria TEXT DEFAULT 'Ingredientes',
  fornecedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  preco_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0,
  margem_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  tempo_preparacao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação produto-insumos
CREATE TABLE IF NOT EXISTS produto_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bebidas
CREATE TABLE IF NOT EXISTS bebidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de combos
CREATE TABLE IF NOT EXISTS combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de custos fixos
CREATE TABLE IF NOT EXISTS custos_fixos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  frequencia TEXT NOT NULL DEFAULT 'mensal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de custos variáveis
CREATE TABLE IF NOT EXISTS custos_variaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de estoque de insumos
CREATE TABLE IF NOT EXISTS estoque_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade_atual DECIMAL(10,3) NOT NULL DEFAULT 0,
  quantidade_minima DECIMAL(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  cliente TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produto_insumos_produto_id ON produto_insumos(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_insumo_id ON produto_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_estoque_insumos_insumo_id ON estoque_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bebidas_updated_at BEFORE UPDATE ON bebidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combos_updated_at BEFORE UPDATE ON combos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custos_fixos_updated_at BEFORE UPDATE ON custos_fixos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custos_variaveis_updated_at BEFORE UPDATE ON custos_variaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estoque_insumos_updated_at BEFORE UPDATE ON estoque_insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
