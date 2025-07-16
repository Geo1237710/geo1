import { supabase } from './supabase';
import type { Database } from './supabase';

type Brand = Database['public']['Tables']['brands']['Row'];
type BrandInsert = Database['public']['Tables']['brands']['Insert'];
type BrandUpdate = Database['public']['Tables']['brands']['Update'];

/**
 * Obtiene todas las marcas
 */
export async function getBrands(): Promise<Brand[]> {
  console.log('=== GETTING BRANDS ===');

  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brands:', error);
    throw new Error(`Error al obtener marcas: ${error.message}`);
  }

  console.log('Brands fetched:', data?.length || 0);
  return data || [];
}

/**
 * Crea una nueva marca
 */
export async function createBrand(brandData: BrandInsert): Promise<Brand> {
  console.log('=== CREATING BRAND ===');
  console.log('Brand data:', brandData);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado');
  }

  console.log('User authenticated:', user.id);

  // Obtener la empresa del usuario
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.company_id) {
    throw new Error('Usuario no tiene empresa asignada');
  }

  // Preparar datos con company_id
  const finalBrandData = {
    ...brandData,
    company_id: userData.company_id
  };

  console.log('Final brand data:', finalBrandData);

  // Insertar marca
  const { data, error } = await supabase
    .from('brands')
    .insert(finalBrandData)
    .select()
    .single();

  if (error) {
    console.error('Error creating brand:', error);
    throw new Error(`Error al crear marca: ${error.message}`);
  }

  console.log('Brand created successfully:', data);
  return data;
}

/**
 * Actualiza una marca
 */
export async function updateBrand(id: string, updates: BrandUpdate): Promise<Brand> {
  console.log('=== UPDATING BRAND ===');
  console.log('Brand ID:', id);
  console.log('Updates:', updates);

  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating brand:', error);
    throw new Error(`Error al actualizar marca: ${error.message}`);
  }

  console.log('Brand updated successfully:', data);
  return data;
}

/**
 * Elimina una marca (soft delete)
 */
export async function deleteBrand(id: string): Promise<void> {
  console.log('=== DELETING BRAND ===');
  console.log('Brand ID:', id);

  const { error } = await supabase
    .from('brands')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting brand:', error);
    throw new Error(`Error al eliminar marca: ${error.message}`);
  }

  console.log('Brand deleted successfully');
}

/**
 * Obtiene una marca por ID
 */
export async function getBrandById(id: string): Promise<Brand | null> {
  console.log('=== GETTING BRAND BY ID ===');
  console.log('Brand ID:', id);

  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No encontrado
      return null;
    }
    console.error('Error fetching brand:', error);
    throw new Error(`Error al obtener marca: ${error.message}`);
  }

  console.log('Brand fetched:', data);
  return data;
}

/**
 * Obtiene estadísticas de una marca
 */
export async function getBrandStats(brandId: string): Promise<{
  total_products: number;
  total_value: number;
  departments: string[];
}> {
  console.log('=== GETTING BRAND STATS ===');
  console.log('Brand ID:', brandId);

  const { data, error } = await supabase
    .from('products')
    .select('price, department')
    .eq('brand_id', brandId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching brand stats:', error);
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const products = data || [];
  
  const stats = {
    total_products: products.length,
    total_value: products.reduce((sum, p) => sum + (p.price || 0), 0),
    departments: [...new Set(products.map(p => p.department).filter(Boolean))]
  };

  console.log('Brand stats:', stats);
  return stats;
}