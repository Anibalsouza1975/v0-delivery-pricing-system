-- Script para resetar completamente o banco de dados
-- Remove todas as tabelas existentes e recria do zero

-- Desabilitar RLS temporariamente para limpeza
SET session_replication_role = replica;

-- Remover todas as tabelas existentes (em ordem para evitar conflitos de FK)
DROP TABLE IF EXISTS public.itens_venda CASCADE;
DROP TABLE IF EXISTS public.receitas CASCADE;
DROP TABLE IF EXISTS public.produto_insumos CASCADE;
DROP TABLE IF EXISTS public.product_ingredients CASCADE;
DROP TABLE IF EXISTS public.combo_products CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.estoque_insumos CASCADE;
DROP TABLE IF EXISTS public.vendas CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.bebidas CASCADE;
DROP TABLE IF EXISTS public.beverages CASCADE;
DROP TABLE IF EXISTS public.combos CASCADE;
DROP TABLE IF EXISTS public.insumos CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.custos_fixos CASCADE;
DROP TABLE IF EXISTS public.fixed_costs CASCADE;
DROP TABLE IF EXISTS public.custos_variaveis CASCADE;
DROP TABLE IF EXISTS public.variable_costs CASCADE;
DROP TABLE IF EXISTS public.fornecedores CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Reabilitar RLS
SET session_replication_role = DEFAULT;
