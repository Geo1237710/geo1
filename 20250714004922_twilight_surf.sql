/*
  # Crear usuario administrador por defecto

  1. Funciones
    - Función para crear usuario admin por defecto
    - Función para verificar si es el primer usuario

  2. Usuario Admin
    - Email: admin@ceramicasa.com
    - Contraseña: 1 (para desarrollo)
    - Rol: admin
    - Empresa: Ceramicasa (por defecto)

  3. Seguridad
    - Solo se ejecuta si no hay usuarios existentes
    - Crea la empresa por defecto si no existe
*/

-- Función para verificar si es el primer usuario
CREATE OR REPLACE FUNCTION is_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1);
END;
$$;

-- Función para crear empresa por defecto
CREATE OR REPLACE FUNCTION create_default_company()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
BEGIN
  -- Verificar si ya existe la empresa por defecto
  SELECT id INTO company_id 
  FROM companies 
  WHERE name = 'Ceramicasa' 
  LIMIT 1;
  
  -- Si no existe, crearla
  IF company_id IS NULL THEN
    INSERT INTO companies (
      name,
      description,
      email,
      is_active
    ) VALUES (
      'Ceramicasa',
      'Empresa de cerámicas y materiales de construcción',
      'admin@ceramicasa.com',
      true
    ) RETURNING id INTO company_id;
  END IF;
  
  RETURN company_id;
END;
$$;

-- Función para crear usuario admin por defecto
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  company_id uuid;
BEGIN
  -- Solo ejecutar si es el primer usuario
  IF is_first_user() THEN
    -- Crear empresa por defecto
    company_id := create_default_company();
    
    -- Crear usuario en auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@ceramicasa.com',
      crypt('1', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrador", "role": "admin"}',
      false,
      '',
      '',
      '',
      ''
    ) RETURNING id INTO user_id;
    
    -- Crear perfil de usuario
    INSERT INTO users (
      id,
      email,
      full_name,
      role,
      company_id,
      is_active
    ) VALUES (
      user_id,
      'admin@ceramicasa.com',
      'Administrador',
      'admin',
      company_id,
      true
    );
    
    RAISE NOTICE 'Usuario administrador creado: admin@ceramicasa.com / contraseña: 1';
  END IF;
END;
$$;

-- Ejecutar la función para crear el admin por defecto
SELECT create_default_admin();

-- Limpiar funciones temporales (opcional)
-- DROP FUNCTION IF EXISTS is_first_user();
-- DROP FUNCTION IF EXISTS create_default_company();
-- DROP FUNCTION IF EXISTS create_default_admin();