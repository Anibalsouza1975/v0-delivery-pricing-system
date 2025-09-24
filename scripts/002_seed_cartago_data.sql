-- Dados de exemplo para o sistema Cartago BD
-- Inserindo dados iniciais para testar o sistema

-- Inserir insumos (ingredientes)
INSERT INTO insumos (nome, unidade, preco_compra, categoria, fornecedor) VALUES
('Farinha de Trigo', 'kg', 4.50, 'Ingredientes Básicos', 'Fornecedor A'),
('Açúcar Cristal', 'kg', 3.20, 'Ingredientes Básicos', 'Fornecedor A'),
('Ovos', 'dúzia', 8.00, 'Ingredientes Frescos', 'Fornecedor B'),
('Leite Integral', 'litro', 4.80, 'Ingredientes Frescos', 'Fornecedor B'),
('Manteiga', 'kg', 12.00, 'Ingredientes Frescos', 'Fornecedor B'),
('Chocolate em Pó', 'kg', 15.00, 'Ingredientes Especiais', 'Fornecedor C'),
('Fermento em Pó', 'kg', 8.50, 'Ingredientes Básicos', 'Fornecedor A'),
('Baunilha', 'ml', 0.25, 'Ingredientes Especiais', 'Fornecedor C')
ON CONFLICT (id) DO NOTHING;

-- Inserir produtos
INSERT INTO produtos (nome, categoria, descricao, preco_base, preco_custo, margem_percentual, tempo_preparacao, ativo) VALUES
('Bolo de Chocolate', 'Bolos', 'Delicioso bolo de chocolate com cobertura', 25.00, 12.50, 100.0, 45, true),
('Torta de Morango', 'Tortas', 'Torta cremosa com morangos frescos', 35.00, 18.00, 94.4, 60, true),
('Cupcake Baunilha', 'Cupcakes', 'Cupcake fofo com cobertura de baunilha', 8.00, 4.00, 100.0, 20, true),
('Pão de Açúcar', 'Pães', 'Pão doce tradicional', 12.00, 6.00, 100.0, 30, true),
('Brownie', 'Brownies', 'Brownie de chocolate intenso', 15.00, 7.50, 100.0, 25, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir bebidas
INSERT INTO bebidas (nome, tamanho, preco, custo, ativo) VALUES
('Café Expresso', 'Pequeno', 4.50, 1.50, true),
('Cappuccino', 'Médio', 7.00, 2.50, true),
('Suco de Laranja', 'Grande', 8.00, 3.00, true),
('Água Mineral', 'Pequeno', 3.00, 1.00, true),
('Refrigerante', 'Médio', 5.50, 2.00, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir combos
INSERT INTO combos (nome, descricao, preco, desconto_percentual, ativo) VALUES
('Combo Café da Manhã', 'Pão de açúcar + café expresso', 15.00, 10.0, true),
('Combo Lanche', 'Cupcake + cappuccino', 14.00, 6.7, true),
('Combo Sobremesa', 'Brownie + suco de laranja', 22.00, 4.3, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir custos fixos
INSERT INTO custos_fixos (nome, valor, categoria, frequencia) VALUES
('Aluguel', 2500.00, 'Infraestrutura', 'mensal'),
('Energia Elétrica', 450.00, 'Utilidades', 'mensal'),
('Água', 180.00, 'Utilidades', 'mensal'),
('Internet', 120.00, 'Tecnologia', 'mensal'),
('Salário Funcionários', 4800.00, 'Pessoal', 'mensal'),
('Seguro', 300.00, 'Seguros', 'mensal')
ON CONFLICT (id) DO NOTHING;

-- Inserir custos variáveis
INSERT INTO custos_variaveis (nome, percentual, categoria) VALUES
('Taxa de Cartão', 3.5, 'Financeiro'),
('Comissão Delivery', 15.0, 'Vendas'),
('Impostos', 8.5, 'Tributário'),
('Marketing', 2.0, 'Publicidade')
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas vendas de exemplo
INSERT INTO vendas (data, total, status, cliente, observacoes) VALUES
(NOW() - INTERVAL '1 day', 45.50, 'concluida', 'João Silva', 'Entrega rápida'),
(NOW() - INTERVAL '2 days', 28.00, 'concluida', 'Maria Santos', 'Cliente frequente'),
(NOW() - INTERVAL '3 days', 67.00, 'concluida', 'Pedro Costa', 'Pedido especial'),
(NOW(), 35.00, 'pendente', 'Ana Oliveira', 'Aguardando pagamento')
ON CONFLICT (id) DO NOTHING;

-- Criar alguns registros de estoque para os insumos
INSERT INTO estoque_insumos (insumo_id, quantidade_atual, quantidade_minima)
SELECT 
    i.id,
    CASE 
        WHEN i.nome = 'Farinha de Trigo' THEN 25.0
        WHEN i.nome = 'Açúcar Cristal' THEN 15.0
        WHEN i.nome = 'Ovos' THEN 8.0
        WHEN i.nome = 'Leite Integral' THEN 12.0
        WHEN i.nome = 'Manteiga' THEN 5.0
        WHEN i.nome = 'Chocolate em Pó' THEN 3.0
        WHEN i.nome = 'Fermento em Pó' THEN 2.0
        WHEN i.nome = 'Baunilha' THEN 500.0
        ELSE 10.0
    END as quantidade_atual,
    CASE 
        WHEN i.nome = 'Farinha de Trigo' THEN 5.0
        WHEN i.nome = 'Açúcar Cristal' THEN 3.0
        WHEN i.nome = 'Ovos' THEN 2.0
        WHEN i.nome = 'Leite Integral' THEN 3.0
        WHEN i.nome = 'Manteiga' THEN 1.0
        WHEN i.nome = 'Chocolate em Pó' THEN 1.0
        WHEN i.nome = 'Fermento em Pó' THEN 0.5
        WHEN i.nome = 'Baunilha' THEN 100.0
        ELSE 2.0
    END as quantidade_minima
FROM insumos i
ON CONFLICT (id) DO NOTHING;
