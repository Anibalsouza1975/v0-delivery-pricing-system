-- Script de criação das tabelas do sistema Cartago
-- Versão compatível com Supabase (sem extensão uuid-ossp)

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

-- Tabela de itens do combo
CREATE TABLE IF NOT EXISTS combo_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id uuid NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
    bebida_id uuid REFERENCES bebidas(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT combo_itens_produto_ou_bebida CHECK (
        (produto_id IS NOT NULL AND bebida_id IS NULL) OR 
        (produto_id IS NULL AND bebida_id IS NOT NULL)
    )
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido SERIAL UNIQUE,
    cliente_nome TEXT,
    cliente_telefone TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    tipo_entrega TEXT NOT NULL DEFAULT 'balcao',
    endereco_entrega TEXT,
    taxa_entrega DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id uuid REFERENCES produtos(id),
    bebida_id uuid REFERENCES bebidas(id),
    combo_id uuid REFERENCES combos(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pedido_itens_um_tipo CHECK (
        (produto_id IS NOT NULL AND bebida_id IS NULL AND combo_id IS NULL) OR
        (produto_id IS NULL AND bebida_id IS NOT NULL AND combo_id IS NULL) OR
        (produto_id IS NULL AND bebida_id IS NULL AND combo_id IS NOT NULL)
    )
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_produto_id ON produto_insumos(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_insumo_id ON produto_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_bebidas_ativo ON bebidas(ativo);
CREATE INDEX IF NOT EXISTS idx_combos_ativo ON combos(ativo);
CREATE INDEX IF NOT EXISTS idx_combo_itens_combo_id ON combo_itens(combo_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON insumos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bebidas_updated_at BEFORE UPDATE ON bebidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_combos_updated_at BEFORE UPDATE ON combos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
