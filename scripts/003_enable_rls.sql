-- Habilitar Row Level Security para todas as tabelas
-- Como este é um sistema single-tenant, vamos permitir acesso total por enquanto

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bebidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_bebidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para sistema single-tenant (sem autenticação por enquanto)
-- Permitir todas as operações para todos os usuários

-- Custos Fixos
CREATE POLICY "Allow all operations on custos_fixos" ON public.custos_fixos FOR ALL USING (true) WITH CHECK (true);

-- Custos Variáveis
CREATE POLICY "Allow all operations on custos_variaveis" ON public.custos_variaveis FOR ALL USING (true) WITH CHECK (true);

-- Ingredientes Base
CREATE POLICY "Allow all operations on ingredientes_base" ON public.ingredientes_base FOR ALL USING (true) WITH CHECK (true);

-- Insumos
CREATE POLICY "Allow all operations on insumos" ON public.insumos FOR ALL USING (true) WITH CHECK (true);

-- Produtos
CREATE POLICY "Allow all operations on produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- Produto Insumos
CREATE POLICY "Allow all operations on produto_insumos" ON public.produto_insumos FOR ALL USING (true) WITH CHECK (true);

-- Bebidas
CREATE POLICY "Allow all operations on bebidas" ON public.bebidas FOR ALL USING (true) WITH CHECK (true);

-- Combos
CREATE POLICY "Allow all operations on combos" ON public.combos FOR ALL USING (true) WITH CHECK (true);

-- Combo Produtos
CREATE POLICY "Allow all operations on combo_produtos" ON public.combo_produtos FOR ALL USING (true) WITH CHECK (true);

-- Combo Bebidas
CREATE POLICY "Allow all operations on combo_bebidas" ON public.combo_bebidas FOR ALL USING (true) WITH CHECK (true);

-- Estoque Insumos
CREATE POLICY "Allow all operations on estoque_insumos" ON public.estoque_insumos FOR ALL USING (true) WITH CHECK (true);

-- Compras Insumos
CREATE POLICY "Allow all operations on compras_insumos" ON public.compras_insumos FOR ALL USING (true) WITH CHECK (true);

-- Vendas
CREATE POLICY "Allow all operations on vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

-- Itens Venda
CREATE POLICY "Allow all operations on itens_venda" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);

-- Notificações
CREATE POLICY "Allow all operations on notificacoes" ON public.notificacoes FOR ALL USING (true) WITH CHECK (true);
