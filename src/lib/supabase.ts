import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente principal con anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'ceramicasa-app'
    }
  }
});

// Cliente con service_role para operaciones administrativas
export const createSupabaseClientWithOpts = (url: string, key: string, options?: any) => {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...options?.auth
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'ceramicasa-app-admin'
      }
    },
    ...options
  });
};

// Tipos TypeScript para la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'manager' | 'viewer';
          company_id: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'manager' | 'viewer';
          company_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: 'admin' | 'manager' | 'viewer';
          company_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          company_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          logo_url?: string | null;
          company_id: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          company_id?: string;
          is_active?: boolean;
        };
      };
      formats: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          fields: any;
          brand_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          fields: any;
          brand_id: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          fields?: any;
          brand_id?: string;
          is_active?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          nombre: string;
          clave: string | null;
          codigo: string | null;
          codigo_barras: string | null;
          descripcion: string | null;
          precio: number;
          Medida: string;
          rendimiento_M2: number;
          precio_M2: number;
          marca_id: string;
          formato_id: string | null;
          departamento: string | null;
          unidad: string;
          imagen_url: string | null;
          especificaciones: any;
          cantidad_stock: number;
          stock_minimo: number;
          activo: boolean;
          creado_en: string;
          updated_at: string;
        };
        Insert: {
          nombre: string;
          clave?: string | null;
          codigo?: string | null;
          codigo_barras?: string | null;
          descripcion?: string | null;
          precio: number;
          Medida: string;
          rendimiento_M2: number;
          precio_M2: number;
          marca_id: string;
          formato_id?: string | null;
          departamento?: string | null;
          unidad: string;
          imagen_url?: string | null;
          especificaciones?: any;
          cantidad_stock?: number;
          stock_minimo?: number;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          clave?: string | null;
          codigo?: string | null;
          codigo_barras?: string | null;
          descripcion?: string | null;
          precio?: number;
          Medida?: string;
          rendimiento_M2?: number;
          precio_M2?: number;
          marca_id?: string;
          formato_id?: string | null;
          departamento?: string | null;
          unidad?: string;
          imagen_url?: string | null;
          especificaciones?: any;
          cantidad_stock?: number;
          stock_minimo?: number;
          activo?: boolean;
        };
      };
      import_logs: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string;
          format_id: string | null;
          file_name: string;
          file_size: number | null;
          total_records: number;
          successful_records: number;
          failed_records: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_details: any | null;
          processing_time: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          brand_id: string;
          format_id?: string | null;
          file_name: string;
          file_size?: number | null;
          total_records?: number;
          successful_records?: number;
          failed_records?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_details?: any | null;
          processing_time?: string | null;
          completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          brand_id?: string;
          format_id?: string | null;
          file_name?: string;
          file_size?: number | null;
          total_records?: number;
          successful_records?: number;
          failed_records?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_details?: any | null;
          processing_time?: string | null;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      products_with_brand_info: {
        Row: {
          id: string;
          name: string;
          clave: string;
          codigo: string;
          codigo_barras: string | null;
          descripcion: string;
          price: number;
          brand_id: string;
          brand_name: string;
          brand_logo: string | null;
          company_name: string;
          format_name: string | null;
          format_fields: any | null;
          department: string | null;
          unit: string;
          image_url: string | null;
          especificaciones: any;
          custom_fields: any;
          stock_quantity: number;
          min_stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      search_products: {
        Args: {
          search_term?: string;
          brand_ids?: string[];
          price_min?: number;
          price_max?: number;
          department_filter?: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          id: string;
          name: string;
          descripcion: string | null;
          price: number;
          clave: string | null;
          brand_name: string;
          department: string | null;
          image_url: string | null;
          stock_quantity: number;
          created_at: string;
        }[];
      };
      bulk_insert_products: {
        Args: {
          products_data: any;
          p_brand_id: string;
          p_format_id?: string;
          p_user_id?: string;
        };
        Returns: any;
      };
      get_brand_stats: {
        Args: {
          p_brand_id: string;
        };
        Returns: any;
      };
    };
  };
}