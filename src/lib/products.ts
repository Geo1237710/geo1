import { supabase } from './supabase';
import type { Database } from './supabase';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

/**
 * Crea un nuevo producto
 */
export async function createProduct(productData: ProductInsert): Promise<Product> {
  console.log('=== CREATING PRODUCT ===');
  console.log('Product data:', productData);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado');
  }

  console.log('User authenticated:', user.id);

  // Validar datos requeridos
  if (!productData.nombre || !productData.marca_id || !productData.unidad || productData.precio === undefined) {
    throw new Error('Faltan campos requeridos: nombre, marca_id, unidad, precio');
  }

  // Insertar producto
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error(`Error al crear producto: ${error.message}`);
  }

  console.log('Product created successfully:', data);
  return data;
}

/**
 * Obtiene productos por marca
 */
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  console.log('=== GETTING PRODUCTS BY BRAND ===');
  console.log('Brand ID:', brandId);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('marca_id', brandId)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error(`Error al obtener productos: ${error.message}`);
  }

  console.log('Products fetched:', data?.length || 0);
  return data || [];
}

/**
 * Actualiza un producto
 */
export async function updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
  console.log('=== UPDATING PRODUCT ===');
  console.log('Product ID:', id);
  console.log('Updates:', updates);

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }

  console.log('Product updated successfully:', data);
  return data;
}

/**
 * Elimina un producto (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  console.log('=== DELETING PRODUCT ===');
  console.log('Product ID:', id);

  const { error } = await supabase
    .from('products')
    .update({ activo: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(`Error al eliminar producto: ${error.message}`);
  }

  console.log('Product deleted successfully');
}

/**
 * Busca productos
 */
export async function searchProducts(
  searchTerm: string,
  brandIds?: string[],
  priceMin?: number,
  priceMax?: number,
  department?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Product[]> {
  console.log('=== SEARCHING PRODUCTS ===');
  console.log('Search params:', { searchTerm, brandIds, priceMin, priceMax, department, limit, offset });

  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('activo', true);

  // Aplicar filtros
  const term = searchTerm.trim();
  
  // Buscar en múltiples campos: nombre, descripción, clave, código de barras
  query = query.or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%,clave.ilike.%${term}%,codigo_barras.ilike.%${term}%,codigo.ilike.%${term}%`);

  if (brandIds && brandIds.length > 0) {
    query = query.in('marca_id', brandIds);
  }

  if (priceMin !== undefined) {
    query = query.gte('precio', priceMin);
  }

  if (priceMax !== undefined) {
    query = query.lte('precio', priceMax);
  }

  if (department) {
    query = query.eq('departamento', department);
  }

  // Aplicar paginación y ordenamiento
  query = query
    .order('creado_en', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error searching products:', error);
    throw new Error(`Error al buscar productos: ${error.message}`);
  }

  console.log('Search results:', data?.length || 0);
  return data || [];
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  console.log('=== GETTING PRODUCT BY ID ===');
  console.log('Product ID:', id);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No encontrado
      return null;
    }
    console.error('Error fetching product:', error);
    throw new Error(`Error al obtener producto: ${error.message}`);
  }

  console.log('Product fetched:', data);
  return data;
}

/**
 * Obtiene estadísticas de productos por marca
 */
export async function getProductStatsByBrand(brandId: string): Promise<{
  total_products: number;
  total_value: number;
  low_stock_count: number;
  departments: string[];
}> {
  console.log('=== GETTING PRODUCT STATS ===');
  console.log('Brand ID:', brandId);

  const { data, error } = await supabase
    .from('products')
    .select('precio, cantidad_stock, stock_minimo, departamento')
    .eq('marca_id', brandId)
    .eq('activo', true);

  if (error) {
    console.error('Error fetching product stats:', error);
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const products = data || [];
  
  const stats = {
    total_products: products.length,
    total_value: products.reduce((sum, p) => sum + (p.precio || 0), 0),
    low_stock_count: products.filter(p => (p.cantidad_stock || 0) <= (p.stock_minimo || 0)).length,
    departments: [...new Set(products.map(p => p.departamento).filter(Boolean))]
  };

  console.log('Product stats:', stats);
  return stats;
}

/**
 * Importación masiva de productos
 */
export async function bulkCreateProducts(
  products: ProductInsert[],
  brandId: string
): Promise<{ success: Product[]; errors: Array<{ product: ProductInsert; error: string }> }> {
  console.log('=== BULK CREATE PRODUCTS ===');
  console.log('Products count:', products.length);
  console.log('Brand ID:', brandId);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado');
  }

  const success: Product[] = [];
  const errors: Array<{ product: ProductInsert; error: string }> = [];

  // Procesar productos en lotes de 100
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    // Asegurar que todos tengan brand_id
    const batchWithBrandId = batch.map(product => ({
      ...product,
      marca_id: brandId
    }));

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(batchWithBrandId)
        .select();

      if (error) {
        // Si falla el lote completo, intentar uno por uno
        console.warn('Batch insert failed, trying individual inserts:', error);
        
        for (const product of batchWithBrandId) {
          try {
            const { data: singleData, error: singleError } = await supabase
              .from('products')
              .insert(product)
              .select()
              .single();

            if (singleError) {
              errors.push({ product, error: singleError.message });
            } else {
              success.push(singleData);
            }
          } catch (singleErr) {
            errors.push({ 
              product, 
              error: singleErr instanceof Error ? singleErr.message : 'Error desconocido' 
            });
          }
        }
      } else {
        success.push(...(data || []));
      }
    } catch (batchErr) {
      // Error en todo el lote
      batch.forEach(product => {
        errors.push({ 
          product, 
          error: batchErr instanceof Error ? batchErr.message : 'Error en lote' 
        });
      });
    }
  }

  console.log('Bulk create results:', { success: success.length, errors: errors.length });
  return { success, errors };
}