/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies create infinite recursion when checking user permissions
    - Policies reference the users table while being evaluated on the users table

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use auth.uid() directly without table lookups
    - Separate admin access from regular user access

  3. Security
    - Users can only see their own profile
    - Admins have full access via service role
    - No recursive policy checks
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "users_select_own" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: Admin access is handled via service_role, not through RLS policies
-- This prevents any recursive lookups in the users table