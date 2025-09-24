-- Seed initial data for the delivery pricing system

-- Insert sample ingredients
INSERT INTO public.ingredients (name, unit, cost_per_unit, supplier) VALUES
('Carne de Hambúrguer', 'kg', 25.00, 'Fornecedor Local'),
('Pão de Hambúrguer', 'unidade', 1.50, 'Padaria Central'),
('Queijo Cheddar', 'kg', 35.00, 'Laticínios Silva'),
('Alface', 'kg', 8.00, 'Hortifruti Verde'),
('Tomate', 'kg', 6.00, 'Hortifruti Verde'),
('Cebola', 'kg', 4.00, 'Hortifruti Verde'),
('Batata', 'kg', 5.00, 'Hortifruti Verde'),
('Óleo de Soja', 'litro', 8.00, 'Atacadão'),
('Sal', 'kg', 2.00, 'Atacadão'),
('Temperos', 'kg', 15.00, 'Atacadão')
ON CONFLICT DO NOTHING;

-- Insert sample fixed costs
INSERT INTO public.fixed_costs (name, amount, frequency, category) VALUES
('Aluguel', 2000.00, 'monthly', 'Infraestrutura'),
('Energia Elétrica', 300.00, 'monthly', 'Utilidades'),
('Água', 150.00, 'monthly', 'Utilidades'),
('Internet', 100.00, 'monthly', 'Tecnologia'),
('Funcionários', 3000.00, 'monthly', 'Pessoal'),
('Seguro', 200.00, 'monthly', 'Segurança')
ON CONFLICT DO NOTHING;

-- Insert sample variable costs
INSERT INTO public.variable_costs (name, percentage, category) VALUES
('Taxa de Entrega', 15.0, 'Logística'),
('Comissão Cartão', 3.5, 'Financeiro'),
('Embalagens', 5.0, 'Material'),
('Marketing', 2.0, 'Promocional')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, category, description, base_price, cost_price, margin_percentage, preparation_time) VALUES
('Hambúrguer Clássico', 'Hambúrgueres', 'Hambúrguer tradicional com carne, queijo, alface e tomate', 18.00, 8.50, 52.78, 15),
('Cheeseburger', 'Hambúrgueres', 'Hambúrguer com queijo cheddar derretido', 20.00, 9.00, 55.00, 15),
('Batata Frita', 'Acompanhamentos', 'Porção de batata frita crocante', 12.00, 4.00, 66.67, 10),
('Refrigerante Lata', 'Bebidas', 'Refrigerante gelado 350ml', 5.00, 2.00, 60.00, 2)
ON CONFLICT DO NOTHING;

-- Insert sample beverages
INSERT INTO public.beverages (name, size, price, cost) VALUES
('Coca-Cola', '350ml', 5.00, 2.00),
('Guaraná', '350ml', 5.00, 2.00),
('Água', '500ml', 3.00, 1.00),
('Suco Natural', '300ml', 8.00, 3.50)
ON CONFLICT DO NOTHING;

-- Insert sample combo
INSERT INTO public.combos (name, description, price, discount_percentage) VALUES
('Combo Clássico', 'Hambúrguer Clássico + Batata Frita + Refrigerante', 30.00, 15.0)
ON CONFLICT DO NOTHING;
