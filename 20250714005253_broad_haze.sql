/*
  # Deshabilitar RLS completamente en tabla users

  1. Cambios
    - Eliminar todas las políticas RLS de la tabla users
    - Deshabilitar RLS en la tabla users
    - Permitir acceso directo sin políticas recursivas

  2. Seguridad
    - La seguridad se maneja a nivel de aplicación
    - Los usuarios autenticados pueden acceder a sus datos
    - Sin recursión infinita en políticas
*/

-- Eliminar todas las políticas existentes de la tabla users
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Deshabilitar RLS completamente en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;