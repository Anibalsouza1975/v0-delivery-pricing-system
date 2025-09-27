-- Criar tabela para dados da empresa
CREATE TABLE IF NOT EXISTS empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  razao_social VARCHAR(255),
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#dc2626',
  cor_secundaria VARCHAR(7) DEFAULT '#f59e0b',
  descricao TEXT,
  horario_funcionamento TEXT,
  redes_sociais JSONB DEFAULT '{}',
  configuracoes JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados padrão da empresa
INSERT INTO empresa (
  nome, 
  telefone, 
  endereco, 
  cidade, 
  estado, 
  cep,
  descricao,
  horario_funcionamento
) VALUES (
  'Minha Empresa',
  '(11) 99999-9999',
  'Rua Principal, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'Delivery de comida deliciosa',
  'Segunda a Sábado: 18h às 23h'
) ON CONFLICT DO NOTHING;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_empresa_ativo ON empresa(ativo);
