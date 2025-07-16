import { supabase } from './supabase';
import type { Database } from './supabase';

type Format = Database['public']['Tables']['formats']['Row'];
type FormatInsert = Database['public']['Tables']['formats']['Insert'];
type FormatUpdate = Database['public']['Tables']['formats']['Update'];

export interface FormatField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export interface CustomFormat {
  id: string;
  name: string;
  description: string;
  fields: FormatField[];
  brand_id: string;
  created_at: string;
}

/**
 * Crea un nuevo formato personalizado
 */
export async function createFormat(formatData: {
  name: string;
  description?: string;
  fields: FormatField[];
  brand_id: string;
}): Promise<Format> {
  console.log('=== CREATING FORMAT ===');
  console.log('Format data:', formatData);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado');
  }

  // Preparar datos para Supabase
  const formatDataForDB: FormatInsert = {
    name: formatData.name,
    description: formatData.description || null,
    fields: formatData.fields,
    brand_id: formatData.brand_id,
    is_active: true
  };

  const { data, error } = await supabase
    .from('formats')
    .insert(formatDataForDB)
    .select()
    .single();

  if (error) {
    console.error('Error creating format:', error);
    throw new Error(`Error al crear formato: ${error.message}`);
  }

  console.log('Format created successfully:', data);
  return data;
}

/**
 * Obtiene formatos por marca
 */
export async function getFormatsByBrand(brandId: string): Promise<Format[]> {
  console.log('=== GETTING FORMATS BY BRAND ===');
  console.log('Brand ID:', brandId);

  const { data, error } = await supabase
    .from('formats')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching formats:', error);
    throw new Error(`Error al obtener formatos: ${error.message}`);
  }

  console.log('Formats fetched:', data?.length || 0);
  return data || [];
}

/**
 * Actualiza un formato
 */
export async function updateFormat(id: string, updates: FormatUpdate): Promise<Format> {
  console.log('=== UPDATING FORMAT ===');
  console.log('Format ID:', id);
  console.log('Updates:', updates);

  const { data, error } = await supabase
    .from('formats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating format:', error);
    throw new Error(`Error al actualizar formato: ${error.message}`);
  }

  console.log('Format updated successfully:', data);
  return data;
}

/**
 * Elimina un formato (soft delete)
 */
export async function deleteFormat(id: string): Promise<void> {
  console.log('=== DELETING FORMAT ===');
  console.log('Format ID:', id);

  const { error } = await supabase
    .from('formats')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting format:', error);
    throw new Error(`Error al eliminar formato: ${error.message}`);
  }

  console.log('Format deleted successfully');
}

/**
 * Obtiene un formato por ID
 */
export async function getFormatById(id: string): Promise<Format | null> {
  console.log('=== GETTING FORMAT BY ID ===');
  console.log('Format ID:', id);

  const { data, error } = await supabase
    .from('formats')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching format:', error);
    throw new Error(`Error al obtener formato: ${error.message}`);
  }

  console.log('Format fetched:', data);
  return data;
}

/**
 * Valida datos según un formato
 */
export function validateDataAgainstFormat(
  data: Record<string, any>,
  format: Format
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields = format.fields as FormatField[];

  fields.forEach(field => {
    const value = data[field.name];
    
    // Validar campos requeridos
    if (field.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field.name} es requerido`);
      return;
    }

    // Validar tipos de datos
    if (value && value.toString().trim() !== '') {
      switch (field.type) {
        case 'number':
        case 'currency':
          if (isNaN(Number(value))) {
            errors.push(`${field.name} debe ser un número válido`);
          }
          break;
        case 'select':
          if (field.options && !field.options.includes(value)) {
            errors.push(`${field.name} debe ser una de las opciones válidas: ${field.options.join(', ')}`);
          }
          break;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convierte datos de formato a especificaciones de producto
 */
export function formatDataToSpecifications(
  data: Record<string, any>,
  format: Format
): Record<string, any> {
  const specifications: Record<string, any> = {};
  const fields = format.fields as FormatField[];

  fields.forEach(field => {
    const value = data[field.name];
    if (value !== undefined && value !== null && value.toString().trim() !== '') {
      // Convertir tipos según el campo
      switch (field.type) {
        case 'number':
        case 'currency':
          specifications[field.name] = Number(value);
          break;
        default:
          specifications[field.name] = value.toString().trim();
      }
    }
  });

  return specifications;
}