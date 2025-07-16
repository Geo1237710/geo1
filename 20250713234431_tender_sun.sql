/*
  # Vistas y funciones auxiliares

  1. Vistas
    - `products_with_brand_info` - Productos con información de marca
    - `import_stats` - Estadísticas de importaciones
    - `low_stock_products` - Productos con stock bajo

  2. Funciones
    - `search_products` - Búsqueda avanzada de productos
    - `get_brand_stats` - Estadísticas por marca
*/

-- Vista de productos con información completa
CREATE OR REPLACE VIEW products_with_brand_info AS
SELECT 
  p.*,
  b.name as brand_name,
  b.logo_url as brand_logo,
  c.name as company_name,
  f.name as format_name,
  f.fields as format_fields
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN companies c ON b.company_id = c.id
LEFT JOIN formats f ON p.format_id = f.id
WHERE p.is_active = true AND b.is_active = true AND c.is_active = true;

-- Vista de estadísticas de importación
CREATE OR REPLACE VIEW import_stats AS
SELECT 
  il.*,
  b.name as brand_name,
  c.name as company_name,
  u.full_name as user_name,
  f.name as format_name
FROM import_logs il
JOIN brands b ON il.brand_id = b.id
JOIN companies c ON b.company_id = c.id
JOIN users u ON il.user_id = u.id
LEFT JOIN formats f ON il.format_id = f.id
ORDER BY il.created_at DESC;

-- Vista de productos con stock bajo
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.*,
  b.name as brand_name,
  c.name as company_name,
  (p.stock_quantity - p.min_stock) as stock_difference
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN companies c ON b.company_id = c.id
WHERE p.is_active = true 
  AND b.is_active = true 
  AND c.is_active = true
  AND p.stock_quantity <= p.min_stock
ORDER BY stock_difference ASC;

-- Función de búsqueda avanzada de productos
CREATE OR REPLACE FUNCTION search_products(
  search_term text DEFAULT '',
  brand_ids uuid[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  department_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price decimal,
  sku text,
  brand_name text,
  department text,
  image_url text,
  stock_quantity integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.sku,
    b.name as brand_name,
    p.department,
    p.image_url,
    p.stock_quantity,
    p.created_at
  FROM products p
  JOIN brands b ON p.brand_id = b.id
  WHERE p.is_active = true
    AND b.is_active = true
    AND (search_term = '' OR (
      p.name ILIKE '%' || search_term || '%' OR
      p.description ILIKE '%' || search_term || '%' OR
      p.sku ILIKE '%' || search_term || '%' OR
      p.barcode ILIKE '%' || search_term || '%'
    ))
    AND (brand_ids IS NULL OR p.brand_id = ANY(brand_ids))
    AND (price_min IS NULL OR p.price >= price_min)
    AND (price_max IS NULL OR p.price <= price_max)
    AND (department_filter IS NULL OR p.department = department_filter)
  ORDER BY 
    CASE WHEN search_term != '' THEN
      CASE 
        WHEN p.name ILIKE search_term || '%' THEN 1
        WHEN p.name ILIKE '%' || search_term || '%' THEN 2
        WHEN p.sku ILIKE search_term || '%' THEN 3
        ELSE 4
      END
    ELSE 1
    END,
    p.name
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas por marca
CREATE OR REPLACE FUNCTION get_brand_stats(p_brand_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_products', COUNT(*),
    'active_products', COUNT(*) FILTER (WHERE is_active = true),
    'total_value', COALESCE(SUM(price * stock_quantity), 0),
    'avg_price', COALESCE(AVG(price), 0),
    'low_stock_count', COUNT(*) FILTER (WHERE stock_quantity <= min_stock),
    'departments', jsonb_agg(DISTINCT department) FILTER (WHERE department IS NOT NULL),
    'last_updated', MAX(updated_at)
  ) INTO result
  FROM products
  WHERE brand_id = p_brand_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener productos relacionados
CREATE OR REPLACE FUNCTION get_related_products(
  p_product_id uuid,
  limit_count integer DEFAULT 5
) RETURNS TABLE (
  id uuid,
  name text,
  price decimal,
  image_url text,
  brand_name text
) AS $$
BEGIN
  RETURN QUERY
  WITH product_info AS (
    SELECT brand_id, department, price
    FROM products 
    WHERE id = p_product_id
  )
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image_url,
    b.name as brand_name
  FROM products p
  JOIN brands b ON p.brand_id = b.id
  JOIN product_info pi ON (
    p.brand_id = pi.brand_id OR 
    p.department = pi.department OR
    ABS(p.price - pi.price) < pi.price * 0.2
  )
  WHERE p.id != p_product_id
    AND p.is_active = true
    AND b.is_active = true
  ORDER BY 
    CASE WHEN p.brand_id = (SELECT brand_id FROM product_info) THEN 1 ELSE 2 END,
    CASE WHEN p.department = (SELECT department FROM product_info) THEN 1 ELSE 2 END,
    ABS(p.price - (SELECT price FROM product_info))
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Índices adicionales para las vistas y funciones
CREATE INDEX IF NOT EXISTS idx_products_search_text ON products USING GIN(
  to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(sku, ''))
);

CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_quantity, min_stock) WHERE is_active = true;