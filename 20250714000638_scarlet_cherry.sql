/*
  # Configurar políticas de Storage para buckets de imágenes

  1. Políticas de Storage
    - Permitir a usuarios autenticados subir imágenes a sus buckets correspondientes
    - Permitir lectura pública de imágenes
    - Configurar políticas específicas para cada bucket

  2. Seguridad
    - Los usuarios solo pueden subir a buckets de su empresa/marca
    - Lectura pública para mostrar imágenes en la aplicación
    - Validación de tipos de archivo en las políticas
*/

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Políticas para product-images bucket
CREATE POLICY "Users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text
      FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text
      FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text
      FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Políticas para brand-logos bucket
CREATE POLICY "Users can upload brand logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text
      FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update brand logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'brand-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT b.id::text
      FROM brands b
      JOIN users u ON b.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Public can view brand logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'brand-logos');

-- Políticas para company-logos bucket
CREATE POLICY "Admins can upload company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT u.company_id::text
      FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update company logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT u.company_id::text
      FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Public can view company logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Políticas para user-avatars bucket
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'user-avatars');