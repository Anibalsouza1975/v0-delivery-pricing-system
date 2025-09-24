-- Dados de exemplo para testar as tabelas
INSERT INTO insumos (nome, preco_unitario, unidade, categoria, estoque_minimo) VALUES
('Farinha de Trigo', 4.50, 'kg', 'Ingredientes', 10),
('Açúcar', 3.20, 'kg', 'Ingredientes', 5),
('Ovos', 0.50, 'unidade', 'Ingredientes', 50);

INSERT INTO produtos (nome, preco_venda, categoria, descricao, margem_lucro) VALUES
('Pão Francês', 0.75, 'Pães', 'Pão francês tradicional', 60.00),
('Bolo de Chocolate', 25.00, 'Bolos', 'Bolo de chocolate com cobertura', 80.00);

INSERT INTO bebidas (nome, preco_venda, categoria, tamanho, temperatura) VALUES
('Café Expresso', 3.50, 'Cafés', '50ml', 'Quente'),
('Refrigerante Cola', 4.00, 'Refrigerantes', '350ml', 'Gelado');
