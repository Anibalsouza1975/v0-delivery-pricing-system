-- Criar tabela de adicionais se não existir
CREATE TABLE IF NOT EXISTS adicionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    preco NUMERIC(10,2) NOT NULL DEFAULT 0,
    insumo_id UUID REFERENCES insumos(id),
    categorias TEXT[] DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    imagem_url TEXT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de personalizações se não existir
CREATE TABLE IF NOT EXISTS personalizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('remover', 'substituir')),
    descricao TEXT,
    categorias TEXT[] DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo preco_ifood na tabela produtos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'preco_ifood') THEN
        ALTER TABLE produtos ADD COLUMN preco_ifood NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo tempo_preparo na tabela produtos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'tempo_preparo') THEN
        ALTER TABLE produtos ADD COLUMN tempo_preparo INTEGER DEFAULT 15;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_adicionais_categorias ON adicionais USING GIN (categorias);
CREATE INDEX IF NOT EXISTS idx_personalizacoes_categorias ON personalizacoes USING GIN (categorias);
CREATE INDEX IF NOT EXISTS idx_adicionais_ativo ON adicionais (ativo);
CREATE INDEX IF NOT EXISTS idx_personalizacoes_ativo ON personalizacoes (ativo);
