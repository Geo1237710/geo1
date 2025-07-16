import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { getDepartmentById } from '../lib/departments';
import { Format, Brand } from '../lib/supabase';
import { createFormat, updateFormat } from '../lib/formats';

interface FormatEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  format?: Format;
  onSave: () => void;
}

interface FormatField {
  name: string;
  type: 'text' | 'number' | 'currency' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
  isSystemField?: boolean; // Para identificar campos del sistema que no se pueden eliminar
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moneda' },
  { value: 'select', label: 'Selección' }
];

// Campos obligatorios que siempre deben estar presentes
const REQUIRED_FIELDS: FormatField[] = [
  {
    name: 'nombre',
    type: 'text',
    required: true,
    placeholder: 'Nombre del producto',
    isSystemField: true
  },
  {
    name: 'precio',
    type: 'currency',
    required: true,
    placeholder: 'Precio del producto',
    isSystemField: true
  },
  {
    name: 'unidad',
    type: 'select',
    required: true,
    options: ['Pieza', 'Caja', 'Litro', 'Kit', 'Metro cuadrado', 'Metro lineal', 'Paquete'],
    placeholder: 'Unidad de venta',
    isSystemField: true
  },
  {
    name: 'medida',
    type: 'text',
    required: true,
    placeholder: 'Medida del producto (ej. 30x30 cm)',
    isSystemField: true
  },
  {
    name: 'rendimiento_M2',
    type: 'number',
    required: true,
    placeholder: 'Piezas por metro cuadrado',
    isSystemField: true
  },
  {
    name: 'precio_M2',
    type: 'currency',
    required: true,
    placeholder: 'Precio por metro cuadrado',
    isSystemField: true
  },
  {
    name: 'clave',
    type: 'text',
    required: false,
    placeholder: 'Clave del producto',
    isSystemField: true
  },
  {
    name: 'codigo',
    type: 'text',
    required: false,
    placeholder: 'Código interno',
    isSystemField: true
  },
  {
    name: 'codigo_barras',
    type: 'text',
    required: false,
    placeholder: 'Código de barras',
    isSystemField: true
  },
  {
    name: 'descripcion',
    type: 'text',
    required: false,
    placeholder: 'Descripción del producto',
    isSystemField: true
  }
];

export default function FormatEditorModal({ isOpen, onClose, brandId, format, onSave }: FormatEditorModalProps) {
  const [formatName, setFormatName] = useState('');
  const [formatDescription, setFormatDescription] = useState('');
  const [fields, setFields] = useState<FormatField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<any>(null);

  // Cargar información de la marca para obtener el departamento
  useEffect(() => {
    const loadBrandInfo = async () => {
      if (brandId) {
        try {
          // Aquí deberías cargar la información de la marca desde Supabase
          // Por ahora usamos un placeholder con departamento de recubrimientos
          setCurrentBrand({ id: brandId, department: 'recubrimientos' });
        } catch (error) {
          console.error('Error loading brand:', error);
        }
      }
    };

    loadBrandInfo();
  }, [brandId]);

  useEffect(() => {
    // Inicializar con campos obligatorios
    const initializeFields = () => {
      let initialFields = [...REQUIRED_FIELDS];
      
      // Agregar campos específicos del departamento si existe
      if (currentBrand?.department) {
        const department = getDepartmentById(currentBrand.department);
        if (department) {
          const departmentFields: FormatField[] = department.fields.map(field => ({
            name: field.key,
            type: field.type as 'text' | 'number' | 'currency' | 'select',
            required: field.required || false,
            options: field.options || [],
            placeholder: field.placeholder,
            isSystemField: true // Marcar como campos del sistema del departamento
          }));
          initialFields = [...initialFields, ...departmentFields];
        }
      }
      
      if (format && format.fields) {
        // Si estamos editando, mantener campos existentes pero asegurar que los obligatorios estén presentes
        const existingFields = format.fields as FormatField[];
        const customFields = existingFields.filter(field => {
          const isRequiredField = REQUIRED_FIELDS.some(reqField => reqField.name === field.name);
          const isDepartmentField = currentBrand?.department && 
            getDepartmentById(currentBrand.department)?.fields.some(deptField => deptField.key === field.name);
          return !isRequiredField && !isDepartmentField;
        }
        );
        initialFields = [...REQUIRED_FIELDS, ...customFields];
      }
      
      return initialFields;
    };

    if (format) {
      setFormatName(format.name);
      setFormatDescription(format.description || '');
      setFields(initializeFields());
    } else {
      setFormatName('');
      setFormatDescription('');
      setFields([...REQUIRED_FIELDS]);
    }
  }, [format, currentBrand]);

  const addField = () => {
    setFields([...fields, {
      name: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      isSystemField: false
    }]);
  };

  const updateField = (index: number, field: Partial<FormatField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    const fieldToRemove = fields[index];
    // No permitir eliminar campos del sistema
    if (fieldToRemove.isSystemField) {
      alert('No se pueden eliminar los campos del sistema (name, price, unit, clave, codigo, codigo_barras, descripcion)');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const updatedFields = [...fields];
    if (!updatedFields[fieldIndex].options) {
      updatedFields[fieldIndex].options = [];
    }
    updatedFields[fieldIndex].options!.push('');
    setFields(updatedFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options![optionIndex] = value;
    setFields(updatedFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options!.filter((_, i) => i !== optionIndex);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    if (!formatName.trim()) {
      alert('El nombre del formato es obligatorio');
      return;
    }

    if (fields.some(field => !field.name.trim())) {
      alert('Todos los campos deben tener un nombre');
      return;
    }

    setIsLoading(true);
    try {
      const formatData = {
        name: formatName,
        description: formatDescription,
        fields: fields,
        brand_id: brandId
      };

      if (format) {
        await updateFormat(format.id, formatData);
      } else {
        await createFormat(formatData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving format:', error);
      alert('Error al guardar el formato');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {format ? 'Editar Formato' : 'Crear Nuevo Formato'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Formato *
                </label>
                <input
                  type="text"
                  value={formatName}
                  onChange={(e) => setFormatName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ej. Formato Recubrimientos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formatDescription}
                  onChange={(e) => setFormatDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional del formato"
                />
              </div>
            </div>

            {/* Campos del formato */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Campos del Formato</h3>
                <button
                  onClick={addField}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Campo
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="border border-gray-200 rounded-lg p-4">
                    {/* Indicador de campo del sistema */}
                    {field.isSystemField && (
                      <div className="mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                          field.required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {field.required ? 'Campo Obligatorio' : 'Campo del Sistema'}
                        </span>
                        {/* Indicar si es campo de departamento */}
                        {currentBrand?.department && 
                         getDepartmentById(currentBrand.department)?.fields.some(deptField => deptField.key === field.name) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Campo de Departamento
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Campo
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(fieldIndex, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ej. color, medida, tipo"
                          disabled={field.isSystemField}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Dato
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(fieldIndex, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={field.isSystemField}
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(fieldIndex, { required: e.target.checked })}
                            className="mr-2"
                            disabled={field.isSystemField}
                          />
                          <span className="text-sm text-gray-700">Obligatorio</span>
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeField(fieldIndex)}
                          className={`transition-colors ${
                            field.isSystemField
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          disabled={field.isSystemField}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Opciones para campos de selección */}
                    {field.type === 'select' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Opciones
                          </label>
                          {!field.isSystemField && (
                            <button
                              onClick={() => addOption(fieldIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Agregar opción
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Opción"
                                disabled={field.isSystemField}
                              />
                              {!field.isSystemField && (
                                <button
                                  onClick={() => removeOption(fieldIndex, optionIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay campos definidos. Haz clic en "Agregar Campo" para comenzar.
                  </div>
                )}
                
                {/* Información sobre campos del sistema */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Campos del Sistema</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Los siguientes campos se incluyen automáticamente:
                  </p>
                  <div className="text-sm text-blue-600 space-y-1">
                    <p className="font-medium">Campos Básicos:</p>
                    <ul className="ml-4 space-y-1">
                    <li>• <strong>nombre</strong> - Nombre del producto (Texto) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>precio</strong> - Precio del producto (Moneda) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>unidad</strong> - Unidad de venta (Selección) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>medida</strong> - Medida del producto (Texto) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>rendimiento_M2</strong> - Rendimiento por M² (Número) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>precio_M2</strong> - Precio por M² (Moneda) - <span className="text-red-600">Obligatorio</span></li>
                    <li>• <strong>clave</strong> - Clave del producto (Texto) - <span className="text-gray-600">Opcional</span></li>
                    <li>• <strong>codigo</strong> - Código interno (Texto) - <span className="text-gray-600">Opcional</span></li>
                    <li>• <strong>codigo_barras</strong> - Código de barras (Texto) - <span className="text-gray-600">Opcional</span></li>
                    <li>• <strong>descripcion</strong> - Descripción del producto (Texto) - <span className="text-gray-600">Opcional</span></li>
                    </ul>
                    
                    {currentBrand?.department && getDepartmentById(currentBrand.department) && (
                      <>
                        <p className="font-medium mt-3">Campos del Departamento ({getDepartmentById(currentBrand.department)?.name}):</p>
                        <ul className="ml-4 space-y-1">
                          {getDepartmentById(currentBrand.department)?.fields.map(field => (
                            <li key={field.key}>• <strong>{field.key}</strong> - {field.label} ({field.type}) - <span className="text-gray-600">Opcional</span></li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-blue-500 mt-2">
                    Solo necesitas agregar los campos adicionales específicos para tu formato. Los campos del sistema y del departamento no se pueden eliminar ni modificar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar Formato'}
          </button>
        </div>
      </div>
    </div>
  );
}