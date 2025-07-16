/*
  # Configurar Storage para imágenes

  1. Buckets de almacenamiento
    - `product-images` - Para imágenes de productos
    - `brand-logos` - Para logos de marcas
    - `company-logos` - Para logos de empresas
    - `user-avatars` - Para avatares de usuarios

  2. Políticas de seguridad
    - Usuarios autenticados pueden subir/ver imágenes
    - Restricciones de tamaño y tipo de archivo
*/

-- Crear buckets de almacenamiento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('brand-logos', 'brand-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
  ('company-logos', 'company-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas para product-images
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can delete their company's product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

-- Políticas para brand-logos
CREATE POLICY "Anyone can view brand logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'brand-logos');

CREATE POLICY "Managers can manage brand logos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

-- Políticas para company-logos
CREATE POLICY "Anyone can view company logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can manage company logos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    (
      (storage.foldername(name))[1] IN (
        SELECT u.company_id::text FROM users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin' AND company_id IS NULL
      )
    )
  );

-- Políticas para user-avatars
CREATE POLICY "Users can view all avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can manage their own avatar"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );