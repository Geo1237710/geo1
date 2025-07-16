/*
  # Traducir campos de productos al español

  1. Cambios en la tabla products
    - `name` → `nombre`
    - `price` → `precio`
    - `unit` → `unidad`
    - `clave` → `clave` (ya está en español)
    - `codigo` → `codigo` (ya está en español)
    - `codigo_barras` → `codigo_barras` (ya está en español)
    - `descripcion` → `descripcion` (ya está en español)
    - `brand_id` → `marca_id`
    - `format_id` → `formato_id`
    - `department` → `departamento`
    - `image_url` → `imagen_url`
    - `stock_quantity` → `cantidad_stock`
    - `min_stock` → `stock_minimo`
    - `is_active` → `activo`
    - `created_at` → `creado_en`
    - `updated_at` → `actualizado_en`

  2. Cambios en otras tablas relacionadas
    - Actualizar referencias de foreign keys
    - Mantener consistencia en toda la base de datos
*/

-- Renombrar columnas en la tabla products
ALTER TABLE products 
  RENAME COLUMN name TO nombre;

ALTER TABLE products 
  RENAME COLUMN price TO precio;

ALTER TABLE products 
  RENAME COLUMN unit TO unidad;

ALTER TABLE products 
  RENAME COLUMN brand_id TO marca_id;

ALTER TABLE products 
  RENAME COLUMN format_id TO formato_id;

ALTER TABLE products 
  RENAME COLUMN department TO departamento;

ALTER TABLE products 
  RENAME COLUMN image_url TO imagen_url;

ALTER TABLE products 
  RENAME COLUMN stock_quantity TO cantidad_stock;

ALTER TABLE products 
  RENAME COLUMN min_stock TO stock_minimo;

ALTER TABLE products 
  RENAME COLUMN is_active TO activo;

ALTER TABLE products 
  RENAME COLUMN created_at TO creado_en;

ALTER TABLE products 
  RENAME COLUMN updated_at TO actualizado_en;

-- Actualizar índices que referencian las columnas renombradas
DROP INDEX IF EXISTS idx_products_brand_id;
CREATE INDEX idx_products_marca_id ON products(marca_id);

DROP INDEX IF EXISTS idx_products_format_id;
CREATE INDEX idx_products_formato_id ON products(formato_id);

DROP INDEX IF EXISTS idx_products_is_active;
CREATE INDEX idx_products_activo ON products(activo);

DROP INDEX IF EXISTS idx_products_name;
CREATE INDEX idx_products_nombre ON products(nombre);

DROP INDEX IF EXISTS idx_products_price;
CREATE INDEX idx_products_precio ON products(precio);

DROP INDEX IF EXISTS idx_products_stock;
CREATE INDEX idx_products_cantidad_stock ON products(cantidad_stock);

DROP INDEX IF EXISTS idx_products_brand_active;
CREATE INDEX idx_products_marca_activo ON products(marca_id, activo);

DROP INDEX IF EXISTS idx_products_stock_alert;
CREATE INDEX idx_products_alerta_stock ON products(cantidad_stock, stock_minimo) WHERE (activo = true);

DROP INDEX IF EXISTS idx_products_price_range;
CREATE INDEX idx_products_rango_precio ON products(precio) WHERE (activo = true);

-- Actualizar foreign keys
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

ALTER TABLE products 
  ADD CONSTRAINT products_marca_id_fkey 
  FOREIGN KEY (marca_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_format_id_fkey;

ALTER TABLE products 
  ADD CONSTRAINT products_formato_id_fkey 
  FOREIGN KEY (formato_id) REFERENCES formats(id) ON DELETE SET NULL;

-- Actualizar triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_actualizado_en 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Actualizar políticas RLS
DROP POLICY IF EXISTS "Managers and admins can manage products" ON products;
CREATE POLICY "Managers and admins can manage products" ON products
  FOR ALL TO authenticated
  USING (
    (marca_id IN (
      SELECT b.id FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role = ANY(ARRAY['admin'::user_role, 'manager'::user_role])
    )) OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
      )
    )
  );

DROP POLICY IF EXISTS "Users can view products from their company brands" ON products;
CREATE POLICY "Users can view products from their company brands" ON products
  FOR SELECT TO authenticated
  USING (
    (marca_id IN (
      SELECT b.id FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    )) OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
      )
    )
  );

-- Actualizar constraints de check
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_price_check;

ALTER TABLE products 
  ADD CONSTRAINT products_precio_check 
  CHECK (precio >= 0::numeric);

ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_stock_quantity_check;

ALTER TABLE products 
  ADD CONSTRAINT products_cantidad_stock_check 
  CHECK (cantidad_stock >= 0);

ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_min_stock_check;

ALTER TABLE products 
  ADD CONSTRAINT products_stock_minimo_check 
  CHECK (stock_minimo >= 0);