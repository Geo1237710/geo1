import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getFormatsByBrand, createFormat } from '../lib/formats';
import { createProduct } from '../lib/products';
import { useParams } from 'react-router-dom';

interface Format {
  id: string;
  name: string;
  description?: string;
  fields: any[];
  created_at: string;
}

interface FormatField {
  name: string;
  type: 'text' | 'number' | 'currency' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [availableFormats, setAvailableFormats] = useState<Format[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFormat, setShowCreateFormat] = useState(false);
  const [newFormatName, setNewFormatName] = useState('');
  const [newFormatDescription, setNewFormatDescription] = useState('');
  const [newFormatFields, setNewFormatFields] = useState<FormatField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'currency' | 'select'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { brandId } = useParams();

  // Load formats when component mounts or brandId changes
  React.useEffect(() => {
    const loadFormats = async () => {
      if (brandId) {
        try {
          const formats = await getFormatsByBrand(brandId);
          setAvailableFormats(formats);
        } catch (error) {
          console.error('Error loading formats:', error);
          setError('Error cargando formatos');
        }
      }
    };
    loadFormats();
  }, [brandId]);

  // Reset states when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSelectedFormat('');
      setPreviewData([]);
      setExcelColumns([]);
      setError(null);
      setShowCreateFormat(false);
      setNewFormatName('');
      setNewFormatDescription('');
      setNewFormatFields([]);
      setNewFieldName('');
      setNewFieldType('text');
      setNewFieldRequired(false);
    }
  }, [isOpen]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        const columns = Object.keys(jsonData[0] as object);
        setExcelColumns(columns);
        setPreviewData(jsonData);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error leyendo el archivo Excel');
    }
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      setError('El nombre del campo es requerido');
      return;
    }

    const newField: FormatField = {
      name: newFieldName.trim(),
      type: newFieldType,
      required: newFieldRequired
    };
    
    setNewFormatFields(prev => [...prev, newField]);
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setError(null);
  };

  const handleCreateFormat = async () => {
    if (!newFormatName.trim() || !brandId) {
      setError('El nombre del formato es requerido');
      return;
    }

    if (newFormatFields.length === 0) {
      setError('Debe agregar al menos un campo al formato');
      return;
    }

    try {
      const formatData = {
        name: newFormatName.trim(),
        description: newFormatDescription.trim() || null,
        fields: newFormatFields,
        brand_id: brandId
      };

      const createdFormat = await createFormat(formatData);
      
      // Reload formats
      const formats = await getFormatsByBrand(brandId);
      setAvailableFormats(formats);
      
      // Select the new format
      setSelectedFormat(createdFormat.id);
      
      // Reset create format state
      setShowCreateFormat(false);
      setNewFormatName('');
      setNewFormatDescription('');
      setNewFormatFields([]);
      
      setError(null);
    } catch (error) {
      console.error('Error creating format:', error);
      setError('Error creando el formato: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleImport = async () => {
    if (!file || !previewData.length || !brandId || !selectedFormat) {
      setError('Debe seleccionar un archivo y un formato');
      return;
    }

    const format = availableFormats.find(f => f.id === selectedFormat);
    if (!format) {
      setError('Formato no encontrado');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const processedData = previewData.map((row: any, index: number) => {
        const mappedData: any = {};
        
        // Map Excel columns to format fields based on order
        format.fields.forEach((field: FormatField, fieldIndex: number) => {
          const excelColumn = excelColumns[fieldIndex];
          if (excelColumn && row[excelColumn] !== undefined) {
            mappedData[field.name] = row[excelColumn];
          }
        });

        // Ensure required fields have values
        const nombre = mappedData.nombre || mappedData.Nombre || `Producto ${index + 1}`;
        const precio = parseFloat(mappedData.precio || mappedData.Precio) || 0;
        const unidad = mappedData.unidad || mappedData.Unidad || 'Pieza';
        const medida = mappedData.medida || mappedData.Medida || mappedData['medida_formato'] || '';

        // Calculate rendimiento_M2 if not provided
        let rendimiento_M2 = parseFloat(mappedData.rendimiento_M2 || mappedData['rendimiento_M2']) || null;
        
        if (!rendimiento_M2 && medida) {
          const dimensionMatch = medida.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);
          if (dimensionMatch) {
            const width = parseFloat(dimensionMatch[1]);
            const height = parseFloat(dimensionMatch[2]);
            const area = (width * height) / 10000; // Convert cm² to m²
            rendimiento_M2 = area > 0 ? Math.round(1 / area) : 1;
          } else {
            rendimiento_M2 = 1;
          }
        }

        const precio_M2 = rendimiento_M2 && rendimiento_M2 > 0 ? precio * rendimiento_M2 : precio;

        return {
          nombre,
          precio,
          unidad,
          Medida: medida,
          rendimiento_M2: rendimiento_M2 || 1,
          precio_M2,
          marca_id: brandId,
          clave: mappedData.clave || mappedData.Clave || '',
          codigo: mappedData.codigo || mappedData.Codigo || '',
          codigo_barras: mappedData.codigo_barras || mappedData['codigo_barras'] || '',
          descripcion: mappedData.descripcion || mappedData.Descripcion || '',
          departamento: mappedData.departamento || mappedData.Departamento || 'General',
          activo: true,
          cantidad_stock: parseInt(mappedData.cantidad_stock || mappedData['cantidad_stock']) || 0,
          stock_minimo: parseInt(mappedData.stock_minimo || mappedData['stock_minimo']) || 0
        };
      });

      console.log('Procesando productos:', processedData);
      
      // Create products one by one for better error control
      const createdProducts = [];
      const errors = [];

      for (const productData of processedData) {
        try {
          const createdProduct = await createProduct(productData);
          createdProducts.push(createdProduct);
          console.log('Producto creado:', createdProduct.nombre);
        } catch (error) {
          console.error('Error creando producto:', productData.nombre, error);
          errors.push({ 
            product: productData.nombre, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          });
        }
      }

      // Notify parent component with created products
      if (createdProducts.length > 0) {
        onImport(createdProducts);
      }

      // Show result
      if (errors.length > 0) {
        console.warn('Errores durante la importación:', errors);
        alert(`Importación completada con errores:\n${createdProducts.length} productos creados\n${errors.length} errores`);
      } else {
        alert(`Importación exitosa: ${createdProducts.length} productos creados`);
      }

      onClose();
    } catch (error) {
      console.error('Error importing products:', error);
      setError('Error importando productos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Create Format Modal
  if (showCreateFormat) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Crear Formato para marca</h2>
            <button
              onClick={() => setShowCreateFormat(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Format Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del formato *
              </label>
              <input
                type="text"
                value={newFormatName}
                onChange={(e) => setNewFormatName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ej. Formato Azulejos Premium"
              />
            </div>

            {/* Format Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del formato
              </label>
              <textarea
                value={newFormatDescription}
                onChange={(e) => setNewFormatDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el propósito y uso de este formato..."
              />
            </div>

            {/* Excel Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Campos Excel</h3>
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Campo
                </button>
              </div>

              {/* Add New Field */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Nuevo Campo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del campo
                    </label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ej. Clave, Color, Medida..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de dato
                    </label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="currency">Moneda</option>
                      <option value="select">Selección</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Requerido</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar Campo
                </button>
              </div>

              {/* Fields List */}
              {newFormatFields.length > 0 && (
                <div className="space-y-2">
                  {newFormatFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                      <div>
                        <span className="font-medium">{field.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <button
                        onClick={() => setNewFormatFields(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Todos los campos definidos aquí se aplicarán a los productos de esta marca y estarán disponibles también en el formulario de "Nuevo Producto".
                  </p>
                </div>
              </div>
            </div>

            {/* Rules Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Reglas de importación:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• El archivo Excel debe tener el mismo número de columnas y nombres</li>
                <li>• Las columnas vacías se llenarán con valores por defecto según el tipo de dato</li>
                <li>• Los campos marcados como "Requerido" no pueden estar vacíos</li>
                <li>• Este formato es específico para esta marca</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              onClick={() => setShowCreateFormat(false)}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateFormat}
              disabled={!newFormatName.trim() || newFormatFields.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Guardar Formato
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Import Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Importar por Excel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Formats */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✱</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Formatos para Marca 1</h3>
              </div>

              {/* Formats List */}
              <div className="space-y-4 mb-6">
                {availableFormats.map((format) => (
                  <div key={format.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          checked={selectedFormat === format.id}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{format.name}</h4>
                          <p className="text-sm text-gray-500">
                            {format.fields?.length || 0} columnas • Creado: {new Date(format.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {format.fields?.slice(0, 4).map((field: any, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {field.name}
                              </span>
                            ))}
                            {format.fields?.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{format.fields.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* New Format Button */}
              <button
                onClick={() => setShowCreateFormat(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-600">Nuevo Formato</span>
              </button>
            </div>

            {/* Right Column - Upload */}
            <div>
              <div className="flex items-center mb-6">
                <Upload className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Subir Excel</h3>
              </div>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {file ? file.name : 'Arrastra tu archivo Excel aquí'}
                </h4>
                <p className="text-gray-500 mb-4">
                  o haz clic para seleccionar desde tu equipo
                </p>
                <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Seleccionar documento
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Formatos soportados: .xlsx, .xls (máx. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Vista previa (primeras 3 filas)</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {excelColumns.slice(0, 5).map((column) => (
                            <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {column}
                            </th>
                          ))}
                          {excelColumns.length > 5 && (
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              +{excelColumns.length - 5} más
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.slice(0, 3).map((row, index) => (
                          <tr key={index}>
                            {excelColumns.slice(0, 5).map((column) => (
                              <td key={column} className="px-3 py-2 text-sm text-gray-900">
                                {String(row[column] || '')}
                              </td>
                            ))}
                            {excelColumns.length > 5 && (
                              <td className="px-3 py-2 text-sm text-gray-500">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Total: {previewData.length} filas, {excelColumns.length} columnas
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!file || !selectedFormat || isProcessing}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;