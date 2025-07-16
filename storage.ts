import { supabase, createSupabaseClientWithOpts } from './supabase';

// Configuración para usar service_role en desarrollo
const getStorageClient = () => {
  // Usar el cliente principal con autenticación
  // Las políticas RLS ahora permiten a los admins subir archivos
  return supabase;
};

// Configuración de buckets
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  BRAND_LOGOS: 'brand-logos',
  COMPANY_LOGOS: 'company-logos',
  USER_AVATARS: 'user-avatars'
} as const;

// Tipos de archivo permitidos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

export const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
] as const;

// Límites de tamaño (en bytes)
export const FILE_SIZE_LIMITS = {
  PRODUCT_IMAGE: 5 * 1024 * 1024, // 5MB
  BRAND_LOGO: 2 * 1024 * 1024,    // 2MB
  COMPANY_LOGO: 2 * 1024 * 1024,  // 2MB
  USER_AVATAR: 1 * 1024 * 1024    // 1MB
} as const;

/**
 * Sube una imagen de producto
 */
export async function uploadProductImage(
  file: File,
  brandId: string,
  productId?: string
): Promise<{ url: string; path: string }> {
  console.log('=== UPLOAD PRODUCT IMAGE DEBUG ===');
  console.log('File:', file.name, file.type, file.size);
  console.log('Brand ID:', brandId);
  console.log('Product ID:', productId);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Current user:', user?.id, user?.email);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    throw new Error('Usuario no autenticado. Por favor, inicie sesión.');
  }

  // Validar parámetros
  if (!brandId || brandId === 'undefined') {
    throw new Error('ID de marca no válido');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    throw new Error('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
  }

  if (file.size > FILE_SIZE_LIMITS.PRODUCT_IMAGE) {
    throw new Error('El archivo es demasiado grande. Máximo 5MB.');
  }

  const storageClient = getStorageClient();

  const fileExt = file.name.split('.').pop();
  const fileName = productId 
    ? `${productId}.${fileExt}`
    : `product-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const filePath = `${brandId}/${fileName}`;

  console.log('Upload path:', filePath);
  console.log('Bucket:', STORAGE_BUCKETS.PRODUCT_IMAGES);

  // Intentar subir archivo
  const { data, error } = await storageClient.storage
    .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });

  if (error) {
    console.error('=== STORAGE ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    // Intentar crear el bucket si no existe
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket_not_found')) {
      console.log('Attempting to create bucket...');
      const { error: createError } = await storageClient.storage.createBucket(STORAGE_BUCKETS.PRODUCT_IMAGES, {
        public: true,
        allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
        fileSizeLimit: FILE_SIZE_LIMITS.PRODUCT_IMAGE,
        avifAutoDetection: false
      });
      
      if (createError) {
        console.error('Failed to create bucket:', createError);
        throw new Error(`Error al crear bucket: ${createError.message}`);
      }
      
      console.log('Bucket created successfully, retrying upload...');
      
      // Reintentar upload
      const { data: retryData, error: retryError } = await storageClient.storage
        .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
        
      if (retryError) {
        console.error('Retry upload failed:', retryError);
        throw new Error(`Error al subir imagen (reintento): ${retryError.message}`);
      }
      
      console.log('Retry upload successful:', retryData);
      
      // Usar datos del reintento
      const { data: { publicUrl } } = storageClient.storage
        .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
        .getPublicUrl(filePath);

      console.log('Generated public URL (retry):', publicUrl);
      console.log('=== END DEBUG (RETRY) ===');

      return {
        url: publicUrl,
        path: filePath
      };
    } else {
      throw new Error(`Error al subir imagen: ${error.message}`);
    }
  }

  console.log('=== UPLOAD SUCCESSFUL ===');
  console.log('Upload data:', data);

  const { data: { publicUrl } } = storageClient.storage
    .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(filePath);

  console.log('Generated public URL:', publicUrl);
  console.log('=== END DEBUG ===');

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Sube un logo de marca
 */
export async function uploadBrandLogo(
  file: File,
  brandId: string
): Promise<{ url: string; path: string }> {
  console.log('=== UPLOAD BRAND LOGO DEBUG ===');
  console.log('File:', file.name, file.type, file.size);
  console.log('Brand ID:', brandId);

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Current user:', user?.id, user?.email);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    throw new Error('Usuario no autenticado. Por favor, inicie sesión.');
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type as any)) {
    throw new Error('Tipo de archivo no permitido. Use JPEG, PNG, SVG o WebP.');
  }

  if (file.size > FILE_SIZE_LIMITS.BRAND_LOGO) {
    throw new Error('El archivo es demasiado grande. Máximo 2MB.');
  }

  const storageClient = getStorageClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `logo.${fileExt}`;
  const filePath = `${brandId}/${fileName}`;

  console.log('Upload path:', filePath);
  console.log('Bucket:', STORAGE_BUCKETS.BRAND_LOGOS);

  const { data, error } = await storageClient.storage
    .from(STORAGE_BUCKETS.BRAND_LOGOS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      duplex: 'half'
    });

  if (error) {
    console.error('=== BRAND LOGO STORAGE ERROR ===');
    console.error('Error details:', error);
    
    // Intentar crear el bucket si no existe
    if (error.message?.includes('Bucket not found')) {
      console.log('Attempting to create brand logos bucket...');
      const { error: createError } = await storageClient.storage.createBucket(STORAGE_BUCKETS.BRAND_LOGOS, {
        public: true,
        allowedMimeTypes: ALLOWED_LOGO_TYPES,
        fileSizeLimit: FILE_SIZE_LIMITS.BRAND_LOGO
      });
      
      if (createError) {
        console.error('Failed to create bucket:', createError);
        throw new Error(`Error al crear bucket: ${createError.message}`);
      }
      
      // Reintentar upload
      const { data: retryData, error: retryError } = await storageClient.storage
        .from(STORAGE_BUCKETS.BRAND_LOGOS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          duplex: 'half'
        });
        
      if (retryError) {
        throw new Error(`Error al subir logo (reintento): ${retryError.message}`);
      }
      
      console.log('Retry upload successful:', retryData);
    } else {
      throw new Error(`Error al subir logo: ${error.message}`);
    }
  }

  console.log('=== BRAND LOGO UPLOAD SUCCESSFUL ===');
  console.log('Upload data:', data);

  const { data: { publicUrl } } = storageClient.storage
    .from(STORAGE_BUCKETS.BRAND_LOGOS)
    .getPublicUrl(filePath);

  console.log('Generated public URL:', publicUrl);
  console.log('=== END DEBUG ===');

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Sube un logo de empresa
 */
export async function uploadCompanyLogo(
  file: File,
  companyId: string
): Promise<{ url: string; path: string }> {
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado. Por favor, inicie sesión.');
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type as any)) {
    throw new Error('Tipo de archivo no permitido. Use JPEG, PNG, SVG o WebP.');
  }

  if (file.size > FILE_SIZE_LIMITS.COMPANY_LOGO) {
    throw new Error('El archivo es demasiado grande. Máximo 2MB.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `logo.${fileExt}`;
  const filePath = `${companyId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.COMPANY_LOGOS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      duplex: 'half'
    });

  if (error) {
    // Intentar crear el bucket si no existe
    if (error.message?.includes('Bucket not found')) {
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKETS.COMPANY_LOGOS, {
        public: true,
        allowedMimeTypes: ALLOWED_LOGO_TYPES,
        fileSizeLimit: FILE_SIZE_LIMITS.COMPANY_LOGO
      });
      
      if (!createError) {
        // Reintentar upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from(STORAGE_BUCKETS.COMPANY_LOGOS)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            duplex: 'half'
          });
          
        if (retryError) {
          throw new Error(`Error al subir logo (reintento): ${retryError.message}`);
        }
      }
    } else {
      throw new Error(`Error al subir logo: ${error.message}`);
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.COMPANY_LOGOS)
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Sube un avatar de usuario
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado. Por favor, inicie sesión.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    throw new Error('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
  }

  if (file.size > FILE_SIZE_LIMITS.USER_AVATAR) {
    throw new Error('El archivo es demasiado grande. Máximo 1MB.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.USER_AVATARS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      duplex: 'half'
    });

  if (error) {
    // Intentar crear el bucket si no existe
    if (error.message?.includes('Bucket not found')) {
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKETS.USER_AVATARS, {
        public: true,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
        fileSizeLimit: FILE_SIZE_LIMITS.USER_AVATAR
      });
      
      if (!createError) {
        // Reintentar upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from(STORAGE_BUCKETS.USER_AVATARS)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            duplex: 'half'
          });
          
        if (retryError) {
          throw new Error(`Error al subir avatar (reintento): ${retryError.message}`);
        }
      }
    } else {
      throw new Error(`Error al subir avatar: ${error.message}`);
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.USER_AVATARS)
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Elimina un archivo del storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

/**
 * Obtiene la URL pública de un archivo
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
// Usar siempre el cliente principal con autenticación
    .getPublicUrl(path);
const getStorageClient = () => supabase;
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}