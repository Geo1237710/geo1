/*
  # Crear tabla de formatos

  1. Nueva tabla
    - `formats`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `fields` (jsonb, estructura de campos)
      - `brand_id` (uuid, foreign key)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS
    - Políticas para gestión por marca
*/

-- Crear tabla de formatos
CREATE TABLE IF NOT EXISTS formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, brand_id)
);

-- Habilitar RLS
ALTER TABLE formats ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view formats from their company brands"
  ON formats
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

CREATE POLICY "Managers and admins can manage formats"
  ON formats
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
CREATE TRIGGER update_formats_updated_at
  BEFORE UPDATE ON formats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_formats_name ON formats(name);
CREATE INDEX IF NOT EXISTS idx_formats_brand_id ON formats(brand_id);
CREATE INDEX IF NOT EXISTS idx_formats_is_active ON formats(is_active);
CREATE INDEX IF NOT EXISTS idx_formats_fields ON formats USING GIN(fields);