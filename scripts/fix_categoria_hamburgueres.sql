-- Atualizar produtos existentes para usar "Hambúrgueres" (plural)
UPDATE produtos 
SET categoria = 'Hambúrgueres' 
WHERE categoria = 'Hambúrguer';
