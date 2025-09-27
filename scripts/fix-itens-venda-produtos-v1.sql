-- Script para associar itens_venda aos produtos corretos
-- Baseado nos nomes dos produtos nas vendas existentes

-- Primeiro, vamos ver quais produtos temos cadastrados
SELECT id, nome, categoria FROM produtos ORDER BY nome;

-- Vamos ver os itens_venda que precisam ser corrigidos
SELECT id, venda_id, produto_id, bebida_id, combo_id, quantidade FROM itens_venda WHERE produto_id IS NULL AND bebida_id IS NULL AND combo_id IS NULL;

-- Agora vamos tentar associar baseado nos dados das vendas
-- Como não temos o nome do produto diretamente nos itens_venda,
-- vamos usar uma abordagem baseada nos valores das vendas

-- Vamos assumir que as vendas de R$ 17,95 são de um produto específico
-- e as vendas de R$ 31,57 são de outro produto ou combo

-- Primeiro, vamos identificar os produtos mais prováveis baseado nos preços
WITH vendas_por_valor AS (
  SELECT DISTINCT total, COUNT(*) as quantidade_vendas
  FROM vendas 
  GROUP BY total
  ORDER BY total
),
produtos_por_preco AS (
  SELECT id, nome, preco_venda, categoria
  FROM produtos 
  ORDER BY preco_venda
)
SELECT * FROM vendas_por_valor;
SELECT * FROM produtos_por_preco;

-- Vamos associar os itens_venda aos produtos baseado nos valores mais próximos
-- Assumindo que vendas de R$ 17,95 correspondem ao produto mais barato
-- e vendas de R$ 31,57 correspondem a um combo ou produto mais caro

-- Primeiro, vamos pegar o produto mais barato (provavelmente o de R$ 17,95)
WITH produto_mais_barato AS (
  SELECT id FROM produtos ORDER BY preco_venda ASC LIMIT 1
),
vendas_17_95 AS (
  SELECT id FROM vendas WHERE total = 17.95
)
UPDATE itens_venda 
SET produto_id = (SELECT id FROM produto_mais_barato)
WHERE venda_id IN (SELECT id FROM vendas_17_95)
  AND produto_id IS NULL 
  AND bebida_id IS NULL 
  AND combo_id IS NULL;

-- Para as vendas de R$ 31,57, vamos assumir que é um combo
WITH combo_disponivel AS (
  SELECT id FROM combos ORDER BY preco ASC LIMIT 1
),
vendas_31_57 AS (
  SELECT id FROM vendas WHERE total = 31.57
)
UPDATE itens_venda 
SET combo_id = (SELECT id FROM combo_disponivel)
WHERE venda_id IN (SELECT id FROM vendas_31_57)
  AND produto_id IS NULL 
  AND bebida_id IS NULL 
  AND combo_id IS NULL;

-- Se não houver combos, vamos associar ao segundo produto mais caro
WITH segundo_produto AS (
  SELECT id FROM produtos ORDER BY preco_venda ASC LIMIT 1 OFFSET 1
),
vendas_31_57_restantes AS (
  SELECT id FROM vendas WHERE total = 31.57
)
UPDATE itens_venda 
SET produto_id = (SELECT id FROM segundo_produto)
WHERE venda_id IN (SELECT id FROM vendas_31_57_restantes)
  AND produto_id IS NULL 
  AND bebida_id IS NULL 
  AND combo_id IS NULL;

-- Verificar o resultado
SELECT 
  iv.id,
  iv.venda_id,
  iv.produto_id,
  iv.bebida_id,
  iv.combo_id,
  iv.quantidade,
  v.total as valor_venda,
  p.nome as produto_nome,
  c.nome as combo_nome
FROM itens_venda iv
LEFT JOIN vendas v ON iv.venda_id = v.id
LEFT JOIN produtos p ON iv.produto_id = p.id
LEFT JOIN combos c ON iv.combo_id = c.id
ORDER BY v.total;
