/*
  # Funciones para importación masiva optimizada

  1. Funciones de importación
    - `bulk_insert_products` - Inserción masiva de productos
    - `validate_product_data` - Validación de datos antes de insertar
    - `process_import_batch` - Procesamiento por lotes

  2. Optimizaciones
    - Desactivar triggers temporalmente
    - Inserción por lotes
    - Manejo de errores
*/

-- Función para validar datos de producto
CREATE OR REPLACE FUNCTION validate_product_data(
  p_name text,
  p_price decimal,
  p_brand_id uuid,
  p_unit text
) RETURNS boolean AS $$
BEGIN
  -- Validaciones básicas
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN false;
  END IF;
  
  IF p_price IS NULL OR p_price < 0 THEN
    RETURN false;
  END IF;
  
  IF p_brand_id IS NULL THEN
    RETURN false;
  END IF;
  
  IF p_unit IS NULL OR trim(p_unit) = '' THEN
    RETURN false;
  END IF;
  
  -- Verificar que la marca existe
  IF NOT EXISTS (SELECT 1 FROM brands WHERE id = p_brand_id AND is_active = true) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función para inserción masiva de productos
CREATE OR REPLACE FUNCTION bulk_insert_products(
  products_data jsonb,
  p_brand_id uuid,
  p_format_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_count integer := 0;
  success_count integer := 0;
  error_count integer := 0;
  errors jsonb := '[]'::jsonb;
  product_record jsonb;
  new_product_id uuid;
BEGIN
  -- Contar total de productos
  total_count := jsonb_array_length(products_data);
  
  -- Desactivar triggers para mejor rendimiento
  SET session_replication_role = replica;
  
  -- Procesar cada producto
  FOR product_record IN SELECT * FROM jsonb_array_elements(products_data)
  LOOP
    BEGIN
      -- Validar datos
      IF validate_product_data(
        product_record->>'name',
        (product_record->>'price')::decimal,
        p_brand_id,
        product_record->>'unit'
      ) THEN
        -- Insertar producto
        INSERT INTO products (
          name,
          description,
          price,
          sku,
          barcode,
          brand_id,
          format_id,
          department,
          unit,
          format_data,
          custom_fields,
          stock_quantity,
          min_stock
        ) VALUES (
          product_record->>'name',
          product_record->>'description',
          (product_record->>'price')::decimal,
          product_record->>'sku',
          product_record->>'barcode',
          p_brand_id,
          p_format_id,
          product_record->>'department',
          product_record->>'unit',
          COALESCE(product_record->'format_data', '{}'::jsonb),
          COALESCE(product_record->'custom_fields', '{}'::jsonb),
          COALESCE((product_record->>'stock_quantity')::integer, 0),
          COALESCE((product_record->>'min_stock')::integer, 0)
        ) RETURNING id INTO new_product_id;
        
        success_count := success_count + 1;
      ELSE
        error_count := error_count + 1;
        errors := errors || jsonb_build_object(
          'product', product_record,
          'error', 'Datos de producto inválidos'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := errors || jsonb_build_object(
        'product', product_record,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Reactivar triggers
  SET session_replication_role = DEFAULT;
  
  -- Construir resultado
  result := jsonb_build_object(
    'total_count', total_count,
    'success_count', success_count,
    'error_count', error_count,
    'errors', errors
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar importación por lotes
CREATE OR REPLACE FUNCTION process_import_batch(
  p_import_log_id uuid,
  p_batch_data jsonb,
  p_batch_size integer DEFAULT 1000
) RETURNS void AS $$
DECLARE
  log_record record;
  batch_result jsonb;
  current_batch jsonb;
  batch_start integer := 0;
  total_records integer;
  start_time timestamptz;
  end_time timestamptz;
BEGIN
  start_time := now();
  
  -- Obtener información del log
  SELECT * INTO log_record FROM import_logs WHERE id = p_import_log_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import log not found';
  END IF;
  
  -- Actualizar status a processing
  UPDATE import_logs 
  SET status = 'processing'
  WHERE id = p_import_log_id;
  
  total_records := jsonb_array_length(p_batch_data);
  
  -- Procesar en lotes
  WHILE batch_start < total_records LOOP
    -- Extraer lote actual
    current_batch := (
      SELECT jsonb_agg(value)
      FROM (
        SELECT value
        FROM jsonb_array_elements(p_batch_data)
        WITH ORDINALITY AS t(value, ord)
        WHERE ord > batch_start AND ord <= batch_start + p_batch_size
      ) sub
    );
    
    -- Procesar lote
    batch_result := bulk_insert_products(
      current_batch,
      log_record.brand_id,
      log_record.format_id,
      log_record.user_id
    );
    
    -- Actualizar contadores
    UPDATE import_logs 
    SET 
      successful_records = successful_records + (batch_result->>'success_count')::integer,
      failed_records = failed_records + (batch_result->>'error_count')::integer,
      error_details = CASE 
        WHEN error_details IS NULL THEN batch_result->'errors'
        ELSE error_details || batch_result->'errors'
      END
    WHERE id = p_import_log_id;
    
    batch_start := batch_start + p_batch_size;
  END LOOP;
  
  end_time := now();
  
  -- Finalizar importación
  UPDATE import_logs 
  SET 
    status = 'completed',
    completed_at = end_time,
    processing_time = end_time - start_time
  WHERE id = p_import_log_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Marcar como fallido en caso de error
  UPDATE import_logs 
  SET 
    status = 'failed',
    error_details = jsonb_build_object('error', SQLERRM),
    completed_at = now()
  WHERE id = p_import_log_id;
  
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos antes de importación masiva
CREATE OR REPLACE FUNCTION prepare_bulk_import()
RETURNS void AS $$
BEGIN
  -- Aumentar work_mem temporalmente para mejor rendimiento
  SET work_mem = '256MB';
  
  -- Desactivar autovacuum temporalmente
  ALTER TABLE products SET (autovacuum_enabled = false);
  
  -- Configurar checkpoint para mejor rendimiento
  SET checkpoint_completion_target = 0.9;
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar configuración después de importación
CREATE OR REPLACE FUNCTION cleanup_bulk_import()
RETURNS void AS $$
BEGIN
  -- Restaurar configuraciones
  RESET work_mem;
  ALTER TABLE products SET (autovacuum_enabled = true);
  RESET checkpoint_completion_target;
  
  -- Forzar vacuum y analyze
  VACUUM ANALYZE products;
END;
$$ LANGUAGE plpgsql;