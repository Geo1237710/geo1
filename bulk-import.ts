import { supabase } from './supabase';
import type { Database } from './supabase';

type ImportLog = Database['public']['Tables']['import_logs']['Row'];
type ImportLogInsert = Database['public']['Tables']['import_logs']['Insert'];

/**
 * Interfaz para datos de producto en importación masiva
 */
export interface BulkProductData {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  barcode?: string;
  department?: string;
  unit: string;
  format_data?: Record<string, any>;
  custom_fields?: Record<string, any>;
  stock_quantity?: number;
  min_stock?: number;
}

/**
 * Resultado de importación masiva
 */
export interface BulkImportResult {
  total_count: number;
  success_count: number;
  error_count: number;
  errors: Array<{
    product: BulkProductData;
    error: string;
  }>;
}

/**
 * Configuración para importación masiva
 */
export interface BulkImportConfig {
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

/**
 * Crea un log de importación
 */
export async function createImportLog(
  data: ImportLogInsert
): Promise<ImportLog> {
  const { data: importLog, error } = await supabase
    .from('import_logs')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear log de importación: ${error.message}`);
  }

  return importLog;
}

/**
 * Actualiza el estado de un log de importación
 */
export async function updateImportLog(
  id: string,
  updates: Partial<ImportLog>
): Promise<void> {
  const { error } = await supabase
    .from('import_logs')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error(`Error al actualizar log de importación: ${error.message}`);
  }
}

/**
 * Valida datos de productos antes de importar
 */
export function validateProductData(
  products: BulkProductData[]
): { valid: BulkProductData[]; invalid: Array<{ product: BulkProductData; errors: string[] }> } {
  const valid: BulkProductData[] = [];
  const invalid: Array<{ product: BulkProductData; errors: string[] }> = [];

  products.forEach(product => {
    const errors: string[] = [];

    // Validaciones básicas
    if (!product.name || product.name.trim() === '') {
      errors.push('El nombre del producto es requerido');
    }

    if (product.price === undefined || product.price === null || product.price < 0) {
      errors.push('El precio debe ser un número mayor o igual a 0');
    }

    if (!product.unit || product.unit.trim() === '') {
      errors.push('La unidad de venta es requerida');
    }

    // Validaciones de formato
    if (product.name && product.name.length > 255) {
      errors.push('El nombre del producto no puede exceder 255 caracteres');
    }

    if (product.sku && product.sku.length > 100) {
      errors.push('El SKU no puede exceder 100 caracteres');
    }

    if (product.barcode && product.barcode.length > 50) {
      errors.push('El código de barras no puede exceder 50 caracteres');
    }

    if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
      errors.push('La cantidad en stock no puede ser negativa');
    }

    if (product.min_stock !== undefined && product.min_stock < 0) {
      errors.push('El stock mínimo no puede ser negativo');
    }

    if (errors.length === 0) {
      valid.push(product);
    } else {
      invalid.push({ product, errors });
    }
  });

  return { valid, invalid };
}

/**
 * Procesa importación masiva de productos
 */
export async function bulkImportProducts(
  products: BulkProductData[],
  brandId: string,
  formatId?: string,
  config: BulkImportConfig = {}
): Promise<BulkImportResult> {
  const {
    batchSize = 1000,
    validateOnly = false,
    skipDuplicates = true,
    updateExisting = false
  } = config;

  // Validar datos primero
  const { valid, invalid } = validateProductData(products);
  
  if (validateOnly) {
    return {
      total_count: products.length,
      success_count: valid.length,
      error_count: invalid.length,
      errors: invalid.map(item => ({
        product: item.product,
        error: item.errors.join(', ')
      }))
    };
  }

  if (valid.length === 0) {
    throw new Error('No hay productos válidos para importar');
  }

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Crear log de importación
  const importLog = await createImportLog({
    user_id: user.id,
    brand_id: brandId,
    format_id: formatId,
    file_name: `bulk_import_${Date.now()}.json`,
    total_records: valid.length,
    status: 'pending'
  });

  try {
    // Preparar para importación masiva
    await supabase.rpc('prepare_bulk_import');

    // Procesar en lotes
    const results: BulkImportResult[] = [];
    
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize);
      
      // Actualizar estado a processing
      await updateImportLog(importLog.id, { status: 'processing' });

      // Llamar función de importación masiva
      const { data: result, error } = await supabase.rpc('bulk_insert_products', {
        products_data: batch,
        p_brand_id: brandId,
        p_format_id: formatId,
        p_user_id: user.id
      });

      if (error) {
        throw new Error(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }

      results.push(result);
    }

    // Consolidar resultados
    const finalResult: BulkImportResult = {
      total_count: products.length,
      success_count: results.reduce((sum, r) => sum + r.success_count, 0),
      error_count: results.reduce((sum, r) => sum + r.error_count, 0) + invalid.length,
      errors: [
        ...results.flatMap(r => r.errors),
        ...invalid.map(item => ({
          product: item.product,
          error: item.errors.join(', ')
        }))
      ]
    };

    // Actualizar log final
    await updateImportLog(importLog.id, {
      status: 'completed',
      successful_records: finalResult.success_count,
      failed_records: finalResult.error_count,
      error_details: finalResult.errors.length > 0 ? finalResult.errors : null,
      completed_at: new Date().toISOString()
    });

    // Limpiar después de importación
    await supabase.rpc('cleanup_bulk_import');

    return finalResult;

  } catch (error) {
    // Marcar como fallido
    await updateImportLog(importLog.id, {
      status: 'failed',
      error_details: { error: error instanceof Error ? error.message : 'Error desconocido' },
      completed_at: new Date().toISOString()
    });

    // Limpiar en caso de error
    await supabase.rpc('cleanup_bulk_import');

    throw error;
  }
}

/**
 * Obtiene el historial de importaciones
 */
export async function getImportHistory(
  brandId?: string,
  limit: number = 50
): Promise<ImportLog[]> {
  let query = supabase
    .from('import_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener historial: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene estadísticas de importación
 */
export async function getImportStats(brandId?: string): Promise<{
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  total_products_imported: number;
  avg_processing_time: string | null;
}> {
  let query = supabase
    .from('import_logs')
    .select('status, successful_records, processing_time');

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const stats = {
    total_imports: data?.length || 0,
    successful_imports: data?.filter(log => log.status === 'completed').length || 0,
    failed_imports: data?.filter(log => log.status === 'failed').length || 0,
    total_products_imported: data?.reduce((sum, log) => sum + (log.successful_records || 0), 0) || 0,
    avg_processing_time: null as string | null
  };

  // Calcular tiempo promedio de procesamiento
  const completedImports = data?.filter(log => log.status === 'completed' && log.processing_time);
  if (completedImports && completedImports.length > 0) {
    // Esto es una simplificación - en producción necesitarías una función SQL más sofisticada
    stats.avg_processing_time = '~2 minutos'; // Placeholder
  }

  return stats;
}

/**
 * Cancela una importación en progreso
 */
export async function cancelImport(importLogId: string): Promise<void> {
  const { error } = await supabase
    .from('import_logs')
    .update({
      status: 'failed',
      error_details: { error: 'Importación cancelada por el usuario' },
      completed_at: new Date().toISOString()
    })
    .eq('id', importLogId)
    .eq('status', 'processing');

  if (error) {
    throw new Error(`Error al cancelar importación: ${error.message}`);
  }
}