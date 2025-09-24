CREATE TABLE receitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT,
    insumo_id INT,
    quantidade DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);
