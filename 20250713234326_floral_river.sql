/*
  # Crear tabla de productos

  1. Nueva tabla
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `price` (decimal, not null)
      - `sku` (text, unique)
      - `barcode` (text, nullable)
      - `brand_id` (uuid, foreign key)
      - `format_id` (uuid, foreign key, nullable)
      - `department` (text, nullable)
      - `unit` (text, not null)
      - `image_url` (text, nullable)
      - `format_data` (jsonb, datos específicos del formato)
      - `custom_fields` (jsonb, campos personalizados)
      - `stock_quantity` (integer, default 0)
      - `min_stock` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS
    - Políticas para gestión por marca/empresa
*/

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  sku text UNIQUE,
  barcode text,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  format_id uuid REFERENCES formats(id) ON DELETE SET NULL,
  department text,
  unit text NOT NULL,
  image_url text,
  format_data jsonb DEFAULT '{}'::jsonb,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock integer DEFAULT 0 CHECK (min_stock >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view products from their company brands"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para optimización masiva
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_format_id ON products(format_id);
CREATE INDEX IF NOT EXISTS idx_products_department ON products(department);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_format_data ON products USING GIN(format_data);
CREATE INDEX IF NOT EXISTS idx_products_custom_fields ON products USING GIN(custom_fields);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, sku, barcode);

-- Función para generar SKU automático
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL THEN
    NEW.sku := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' || 
               LPAD(nextval('products_sku_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secuencia para SKU
CREATE SEQUENCE IF NOT EXISTS products_sku_seq START 1;

-- Trigger para generar SKU
CREATE TRIGGER generate_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_sku();