/**
 * Configuración de departamentos y sus campos específicos
 */

export interface DepartmentField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export interface Department {
  id: string;
  name: string;
  fields: DepartmentField[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'recubrimientos',
    name: 'Recubrimientos',
    fields: [
      {
        key: 'medida_formato',
        label: 'Medida / Formato',
        type: 'text',
        required: false,
        placeholder: 'ej. 30x30 cm, 60x60 cm'
      },
      {
        key: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'ej. Blanco, Gris, Beige'
      },
      {
        key: 'acabado',
        label: 'Acabado',
        type: 'select',
        required: false,
        options: ['Mate', 'Brillante', 'Satinado', 'Texturizado', 'Antideslizante']
      },
      {
        key: 'uso',
        label: 'Uso',
        type: 'select',
        required: false,
        options: ['Interior', 'Exterior', 'Piso', 'Pared', 'Baño', 'Cocina']
      },
      {
        key: 'tipo',
        label: 'Tipo',
        type: 'select',
        required: false,
        options: ['Cerámica', 'Porcelanato', 'Azulejo', 'Mosaico', 'Piedra Natural']
      },
      {
        key: 'rendimiento_m2',
        label: 'Rendimiento por m²',
        type: 'number',
        placeholder: 'Piezas por metro cuadrado',
        unit: 'pzs/m²'
      },
      {
        key: 'precio_m2',
        label: 'Precio por m²',
        type: 'number',
        placeholder: 'Precio calculado por metro cuadrado',
        unit: 'MXN/m²'
      }
    ]
  },
  {
    id: 'bano_cocina',
    name: 'Baño y Cocina',
    fields: [
      {
        key: 'tipo_instalacion',
        label: 'Tipo de Instalación',
        type: 'select',
        required: false,
        options: ['Empotrado', 'Sobreponer', 'Colgante', 'De pie', 'Mural']
      },
      {
        key: 'acabado',
        label: 'Acabado',
        type: 'select',
        required: false,
        options: ['Cromado', 'Níquel', 'Bronce', 'Acero Inoxidable', 'Blanco', 'Negro']
      },
      {
        key: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Cerámica', 'Porcelana', 'Acero Inoxidable', 'Latón', 'Plástico ABS']
      },
      {
        key: 'medidas',
        label: 'Medidas',
        type: 'text',
        required: false,
        placeholder: 'ej. 60x40x15 cm'
      },
      {
        key: 'consumo_agua',
        label: 'Consumo de Agua',
        type: 'number',
        placeholder: 'Litros por minuto o por descarga',
        unit: 'L/min'
      },
      {
        key: 'piezas_por_juego',
        label: 'Piezas por Juego',
        type: 'number',
        placeholder: 'Número de piezas incluidas'
      }
    ]
  },
  {
    id: 'construccion',
    name: 'Construcción',
    fields: [
      {
        key: 'presentacion',
        label: 'Presentación',
        type: 'select',
        required: false,
        options: ['Saco', 'Bote', 'Cubeta', 'Tambor', 'Bolsa', 'Caja']
      },
      {
        key: 'rendimiento_unidad',
        label: 'Rendimiento por Unidad',
        type: 'text',
        required: false,
        placeholder: 'ej. 25 m², 50 kg/m³',
        unit: 'm²'
      },
      {
        key: 'color',
        label: 'Color',
        type: 'text',
        placeholder: 'ej. Gris, Blanco, Natural'
      },
      {
        key: 'tiempo_secado',
        label: 'Tiempo de Secado',
        type: 'text',
        placeholder: 'ej. 24 horas, 2-4 horas',
        unit: 'horas'
      },
      {
        key: 'aplicacion',
        label: 'Aplicación',
        type: 'select',
        required: false,
        options: ['Interior', 'Exterior', 'Húmedo', 'Seco', 'Universal']
      }
    ]
  },
  {
    id: 'herramientas_ferreteria',
    name: 'Herramientas y Ferretería',
    fields: [
      {
        key: 'tipo_herramienta',
        label: 'Tipo de Herramienta',
        type: 'select',
        required: false,
        options: ['Manual', 'Eléctrica', 'Neumática', 'Hidráulica', 'Medición']
      },
      {
        key: 'medida',
        label: 'Medida',
        type: 'text',
        required: false,
        placeholder: 'ej. 1/2", 10mm, 25cm'
      },
      {
        key: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Acero', 'Acero Inoxidable', 'Aluminio', 'Plástico', 'Carburo', 'Hierro']
      },
      {
        key: 'voltaje',
        label: 'Voltaje',
        type: 'select',
        options: ['110V', '220V', '12V', '18V', '20V', 'Sin voltaje'],
        unit: 'V'
      },
      {
        key: 'garantia',
        label: 'Garantía',
        type: 'text',
        placeholder: 'ej. 1 año, 6 meses, De por vida'
      },
      {
        key: 'uso',
        label: 'Uso',
        type: 'select',
        required: false,
        options: ['Doméstico', 'Profesional', 'Industrial', 'Automotriz']
      }
    ]
  },
  {
    id: 'plomeria_agua',
    name: 'Plomería y Agua',
    fields: [
      {
        key: 'tipo_conexion',
        label: 'Tipo de Conexión',
        type: 'select',
        required: false,
        options: ['Roscada', 'Soldable', 'Compresión', 'Push-fit', 'Bridada']
      },
      {
        key: 'diametro',
        label: 'Diámetro',
        type: 'text',
        required: false,
        placeholder: 'ej. 1/2", 3/4", 1", 13mm',
        unit: 'pulgadas'
      },
      {
        key: 'presion_max',
        label: 'Presión Máxima',
        type: 'number',
        placeholder: 'Presión máxima de trabajo',
        unit: 'PSI'
      },
      {
        key: 'capacidad_litros',
        label: 'Capacidad',
        type: 'number',
        placeholder: 'Capacidad en litros',
        unit: 'L'
      },
      {
        key: 'tipo_instalacion',
        label: 'Tipo de Instalación',
        type: 'select',
        required: false,
        options: ['Superficial', 'Empotrada', 'Subterránea', 'Aérea']
      }
    ]
  },
  {
    id: 'pintura_acabados',
    name: 'Pintura y Acabados',
    fields: [
      {
        key: 'tipo',
        label: 'Tipo',
        type: 'select',
        required: false,
        options: ['Vinílica', 'Acrílica', 'Esmalte', 'Primer', 'Sellador', 'Barniz']
      },
      {
        key: 'presentacion',
        label: 'Presentación',
        type: 'select',
        required: false,
        options: ['1/4 Litro', '1 Litro', '4 Litros', '19 Litros', 'Cubeta 20L']
      },
      {
        key: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'ej. Blanco, Beige, Azul Cielo'
      },
      {
        key: 'rendimiento_litro',
        label: 'Rendimiento por Litro',
        type: 'number',
        placeholder: 'Metros cuadrados por litro',
        unit: 'm²/L'
      },
      {
        key: 'tiempo_secado',
        label: 'Tiempo de Secado',
        type: 'text',
        placeholder: 'ej. 2-4 horas, 24 horas',
        unit: 'horas'
      },
      {
        key: 'acabado',
        label: 'Acabado',
        type: 'select',
        required: false,
        options: ['Mate', 'Satinado', 'Semi-mate', 'Brillante', 'Texturizado']
      }
    ]
  },
  {
    id: 'jardineria_exterior',
    name: 'Jardinería y Exterior',
    fields: [
      {
        key: 'tipo_herramienta',
        label: 'Tipo de Herramienta',
        type: 'select',
        required: false,
        options: ['Manual', 'Eléctrica', 'A gasolina', 'Riego', 'Corte', 'Excavación']
      },
      {
        key: 'tamaño',
        label: 'Tamaño',
        type: 'text',
        required: false,
        placeholder: 'ej. 30cm, Grande, Mediano'
      },
      {
        key: 'capacidad',
        label: 'Capacidad',
        type: 'text',
        placeholder: 'ej. 50L, 10kg, 500ml',
        unit: 'L/kg'
      },
      {
        key: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Acero', 'Aluminio', 'Plástico', 'Madera', 'Fibra de vidrio']
      },
      {
        key: 'uso',
        label: 'Uso',
        type: 'select',
        required: false,
        options: ['Jardín', 'Césped', 'Plantas', 'Riego', 'Poda', 'Limpieza']
      }
    ]
  }
];

/**
 * Obtiene un departamento por su ID
 */
export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(dept => dept.id === id);
}

/**
 * Obtiene la lista de nombres de departamentos
 */
export function getDepartmentNames(): string[] {
  return DEPARTMENTS.map(dept => dept.name);
}

/**
 * Obtiene los campos específicos de un departamento
 */
export function getDepartmentFields(departmentId: string): DepartmentField[] {
  const department = getDepartmentById(departmentId);
  return department ? department.fields : [];
}

/**
 * Valida las especificaciones según el departamento
 */
export function validateSpecifications(
  departmentId: string, 
  specifications: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const fields = getDepartmentFields(departmentId);
  const errors: string[] = [];

  fields.forEach(field => {
    if (field.required && (!specifications[field.key] || specifications[field.key].toString().trim() === '')) {
      errors.push(`${field.label} es requerido`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}