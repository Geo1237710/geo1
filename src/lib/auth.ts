import { supabase } from './supabase';
import type { Database } from './supabase';

type User = Database['public']['Tables']['users']['Row'];

/**
 * Registra un nuevo usuario
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role?: 'admin' | 'manager' | 'viewer',
  companyId?: string
) {
  // Verificar si es el primer usuario (será admin automáticamente)
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const isFirstUser = count === 0;
  const userRole = isFirstUser ? 'admin' : (role || 'viewer');

  // Registrar en auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: userRole,
        company_id: companyId
      }
    }
  });

  if (authError) {
    throw new Error(`Error al registrar usuario: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('No se pudo crear el usuario');
  }

  // El perfil se crea automáticamente por el trigger handle_new_user

  return authData;
}

/**
 * Inicia sesión
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(`Error al iniciar sesión: ${error.message}`);
  }

  return data;
}

/**
 * Cierra sesión
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`);
  }
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return null;
  }

  return user;
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'full_name' | 'avatar_url'>>
) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
}

/**
 * Cambia la contraseña del usuario
 */
export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(`Error al cambiar contraseña: ${error.message}`);
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user: User | null, roles: Array<'admin' | 'manager' | 'viewer'>): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['admin']);
}

/**
 * Verifica si el usuario puede gestionar (admin o manager)
 */
export function canManage(user: User | null): boolean {
  return hasRole(user, ['admin', 'manager']);
}

/**
 * Obtiene la sesión actual
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Error al obtener sesión: ${error.message}`);
  }

  return session;
}

/**
 * Escucha cambios en la autenticación
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Restablece la contraseña
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    throw new Error(`Error al enviar email de restablecimiento: ${error.message}`);
  }
}