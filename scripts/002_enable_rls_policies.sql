-- Enable Row Level Security (RLS) for all tables
-- Since this is a single-tenant restaurant system, we'll allow all operations for now
-- but keep RLS enabled for future multi-tenant support

-- Enable RLS on all tables
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single-tenant use
-- Allow all operations for now (can be restricted later for multi-tenant)

-- Ingredients policies
CREATE POLICY "Allow all operations on ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);

-- Products policies
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Product ingredients policies
CREATE POLICY "Allow all operations on product_ingredients" ON public.product_ingredients FOR ALL USING (true) WITH CHECK (true);

-- Fixed costs policies
CREATE POLICY "Allow all operations on fixed_costs" ON public.fixed_costs FOR ALL USING (true) WITH CHECK (true);

-- Variable costs policies
CREATE POLICY "Allow all operations on variable_costs" ON public.variable_costs FOR ALL USING (true) WITH CHECK (true);

-- Orders policies
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Order items policies
CREATE POLICY "Allow all operations on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- Combos policies
CREATE POLICY "Allow all operations on combos" ON public.combos FOR ALL USING (true) WITH CHECK (true);

-- Combo products policies
CREATE POLICY "Allow all operations on combo_products" ON public.combo_products FOR ALL USING (true) WITH CHECK (true);

-- Beverages policies
CREATE POLICY "Allow all operations on beverages" ON public.beverages FOR ALL USING (true) WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
