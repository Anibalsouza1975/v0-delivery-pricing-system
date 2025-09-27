-- Dados iniciais para teste do sistema

-- Custos Fixos
INSERT INTO public.custos_fixos (nome, valor, categoria) VALUES
('Aluguel', 2500.00, 'Infraestrutura'),
('Energia Elétrica', 400.00, 'Infraestrutura'),
('Água', 150.00, 'Infraestrutura'),
('Internet', 120.00, 'Infraestrutura'),
('Funcionário Cozinha', 1800.00, 'Pessoal'),
('Funcionário Entrega', 1500.00, 'Pessoal');

-- Custos Variáveis
INSERT INTO public.custos_variaveis (nome, percentual, categoria) VALUES
('Taxa iFood', 12.00, 'Plataforma'),
('Taxa Uber Eats', 15.00, 'Plataforma'),
('Taxa Cartão', 3.50, 'Pagamento'),
('Comissão Entregador', 8.00, 'Entrega');

-- Ingredientes Base
INSERT INTO public.ingredientes_base (nome, categoria, unidade, preco_unitario) VALUES
('Carne Bovina (10kg)', 'Proteína', 'kg', 35.00),
('Queijo Mussarela (2,4kg)', 'Laticínio', 'kg', 28.00),
('Pão Hambúrguer (50 unidades)', 'Carboidrato', 'unidade', 1.20),
('Batata Congelada (2kg)', 'Acompanhamento', 'kg', 12.00),
('Refrigerante 2L (12 unidades)', 'Bebida', 'unidade', 4.50);

-- Insumos (processados)
INSERT INTO public.insumos (nome, categoria, unidade, preco_unitario, ingrediente_base_id, rendimento) VALUES
('Hambúrguer 150g', 'Proteína', 'unidade', 5.25, (SELECT id FROM ingredientes_base WHERE nome = 'Carne Bovina (10kg)'), 66.67),
('Queijo Fatia', 'Laticínio', 'unidade', 1.17, (SELECT id FROM ingredientes_base WHERE nome = 'Queijo Mussarela (2,4kg)'), 24),
('Pão Hambúrguer', 'Carboidrato', 'unidade', 1.20, (SELECT id FROM ingredientes_base WHERE nome = 'Pão Hambúrguer (50 unidades)'), 1),
('Batata Frita Porção', 'Acompanhamento', 'unidade', 2.40, (SELECT id FROM ingredientes_base WHERE nome = 'Batata Congelada (2kg)'), 5);

-- Produtos
INSERT INTO public.produtos (nome, categoria, descricao, preco_venda) VALUES
('X-Burger Clássico', 'Hambúrguer', 'Hambúrguer 150g, queijo, alface, tomate', 18.90),
('X-Bacon', 'Hambúrguer', 'Hambúrguer 150g, bacon, queijo, alface, tomate', 22.90),
('Batata Frita Grande', 'Acompanhamento', 'Porção grande de batata frita crocante', 12.90);

-- Receitas (produto_insumos)
INSERT INTO public.produto_insumos (produto_id, insumo_id, quantidade) VALUES
-- X-Burger Clássico
((SELECT id FROM produtos WHERE nome = 'X-Burger Clássico'), (SELECT id FROM insumos WHERE nome = 'Hambúrguer 150g'), 1),
((SELECT id FROM produtos WHERE nome = 'X-Burger Clássico'), (SELECT id FROM insumos WHERE nome = 'Queijo Fatia'), 1),
((SELECT id FROM produtos WHERE nome = 'X-Burger Clássico'), (SELECT id FROM insumos WHERE nome = 'Pão Hambúrguer'), 1),

-- Batata Frita Grande
((SELECT id FROM produtos WHERE nome = 'Batata Frita Grande'), (SELECT id FROM insumos WHERE nome = 'Batata Frita Porção'), 1);

-- Bebidas
INSERT INTO public.bebidas (nome, tamanho, custo_unitario, markup, preco_venda) VALUES
('Coca-Cola', '350ml', 2.50, 120, 5.50),
('Guaraná Antarctica', '350ml', 2.30, 130, 5.29),
('Suco Natural', '300ml', 3.00, 100, 6.00);

-- Estoque inicial
INSERT INTO public.estoque_insumos (insumo_id, quantidade_atual, quantidade_minima) VALUES
((SELECT id FROM insumos WHERE nome = 'Hambúrguer 150g'), 50, 10),
((SELECT id FROM insumos WHERE nome = 'Queijo Fatia'), 100, 20),
((SELECT id FROM insumos WHERE nome = 'Pão Hambúrguer'), 80, 15),
((SELECT id FROM insumos WHERE nome = 'Batata Frita Porção'), 30, 5);

-- Compras iniciais (para FIFO)
INSERT INTO public.compras_insumos (insumo_id, quantidade, preco_unitario, quantidade_restante) VALUES
((SELECT id FROM insumos WHERE nome = 'Hambúrguer 150g'), 50, 5.25, 50),
((SELECT id FROM insumos WHERE nome = 'Queijo Fatia'), 100, 1.17, 100),
((SELECT id FROM insumos WHERE nome = 'Pão Hambúrguer'), 80, 1.20, 80),
((SELECT id FROM insumos WHERE nome = 'Batata Frita Porção'), 30, 2.40, 30);
