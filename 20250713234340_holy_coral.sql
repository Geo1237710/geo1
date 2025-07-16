/*
  # Crear tabla de logs de importación

  1. Nueva tabla
    - `import_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `brand_id` (uuid, foreign key)
      - `format_id` (uuid, foreign key, nullable)
      - `file_name` (text, not null)
      - `file_size` (bigint)
      - `total_records` (integer)
      - `successful_records` (integer)
      - `failed_records` (integer)
      - `status` (enum: pending, processing, completed, failed)
      - `error_details` (jsonb, nullable)
      - `processing_time` (interval, nullable)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)

  2. Seguridad
    - Habilitar RLS
    - Políticas para ver logs propios
*/

-- Crear enum para status
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Crear tabla de logs de importación
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  format_id uuid REFERENCES formats(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_size bigint,
  total_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  status import_status DEFAULT 'pending',
  error_details jsonb,
  processing_time interval,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Habilitar RLS
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view their own import logs"
  ON import_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
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

CREATE POLICY "Users can create import logs"
  ON import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all import logs"
  ON import_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_import_logs_user_id ON import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_brand_id ON import_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON import_logs(created_at);