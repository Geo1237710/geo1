import React, { useState } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { uploadProductImage } from '../lib/storage';
import { createProduct, updateProduct } from '../lib/products';
import { getDepartmentById, validateSpecifications } from '../lib/departments';

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency';
  value: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => void;
  editingProduct?: any;
}

// Simular formatos existentes (en una app real vendrían de una API o estado global)
const existingFormats = [
  {
    id: '1',
    name: 'Formato 1 - Azulejos Básicos',
    columns: ['Clave', 'Color', 'Medida', 'Código']
  },
  {
    id: '2',
    name: 'Formato 2 - Porcelanatos',
    columns: ['Clave', 'Color', 'Medida', 'Código', 'Acabado', 'Resistencia']
  }
];

// Obtener todos los campos únicos de todos los formatos
const getFormatFields = () => {
  const allFields = new Set<string>();
  existingFormats.forEach(format => {
    format.columns.forEach(column => allFields.add(column));
  });
  return Array.from(allFields);
};

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave, editingProduct }) => {
  const [productData, setProductData] = useState({
    nombre: '',
    clave: '',
    codigo: '',
    codigo_barras: '',
    descripcion: '',
    precio: '',
    Medida: '',
    rendimiento_M2: '',
    precio_M2: '',
    unidad: '',
    image: null as File | null
  });

  const [especificaciones, setEspecificaciones] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'currency'
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<any>(null);

  // Cargar información de la marca actual
  React.useEffect(() => {
    const loadBrandInfo = async () => {
      const pathParts = window.location.pathname.split('/');
      const brandId = pathParts[2];
      
      if (brandId) {
        try {
          // Aquí deberías cargar la información de la marca desde Supabase
          // Por ahora usamos un placeholder
          setCurrentBrand({ id: brandId, department: 'recubrimientos' });
        } catch (error) {
          console.error('Error loading brand:', error);
        }
      }
    };

    loadBrandInfo();
  }, []);

  // Inicializar campos al abrir el modal
  React.useEffect(() => {
    if (isOpen) {
      // Si estamos editando, cargar los datos del producto
      if (editingProduct) {
        setProductData({
          nombre: editingProduct.nombre || '',
          clave: editingProduct.clave || '',
          codigo: editingProduct.codigo || '',
          codigo_barras: editingProduct.codigo_barras || '',
          descripcion: editingProduct.descripcion || '',
          precio: editingProduct.precio?.toString() || '',
          medida: editingProduct.medida || '',
          Medida: editingProduct.Medida || '',
          rendimiento_M2: editingProduct.rendimiento_M2?.toString() || '',
          precio_M2: editingProduct.precio_M2?.toString() || '',
          unidad: editingProduct.unidad || '',
          image: null
        });
        setImagePreview(editingProduct.imagen_url || null);
        // Cargar especificaciones existentes
        const existingSpecs = editingProduct.especificaciones || {};
        console.log('Loading existing specifications:', existingSpecs);
        setEspecificaciones(existingSpecs);
      } else {
        // Modo crear - limpiar formulario
        setProductData({
          nombre: '',
          clave: '',
          codigo: '',
          codigo_barras: '',
          descripcion: '',
          precio: '',
          medida: '',
          Medida: '',
          rendimiento_M2: '',
          precio_M2: '',
          medida: '',
          rendimiento_M2: '',
          precio_M2: '',
          unidad: '',
          image: null
        });
        setEspecificaciones({});
      }
      
      // Limpiar campos personalizados y preview
      setCustomFields([]);
      if (!editingProduct) {
        setImagePreview(null);
      }
    }
  }, [isOpen, editingProduct]);

  // Obtener departamento actual
  const currentDepartment = currentBrand ? getDepartmentById(currentBrand.department) : null;

  const units = [
    'Pieza',
    'Caja',
    'Litro',
    'Kit',
    'Metro cuadrado',
    'Metro lineal',
    'Paquete'
  ];

  const fieldTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Numérico' },
    { value: 'currency', label: 'Moneda' }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }

      setProductData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomField = () => {
    if (newField.name.trim()) {
      const customField: CustomField = {
        id: Date.now().toString(),
        name: newField.name,
        type: newField.type,
        value: ''
      };
      setCustomFields(prev => [...prev, customField]);
      setNewField({ name: '', type: 'text' });
      setShowAddField(false);
    }
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFields(prev => 
      prev.map(field => 
        field.id === id ? { ...field, value } : field
      )
    );
  };

  const handleSave = async () => {
    if (!productData.nombre.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }


    if (!productData.unidad.trim()) {
      alert('La unidad de venta es requerida');
      return;
    }
    
    if (!productData.precio || parseFloat(productData.precio) < 0) {
      alert('El precio debe ser un número válido mayor o igual a 0');
      return;
    }

    if (!productData.Medida.trim()) {
      alert('La medida es requerida');
      return;
    }

    if (!productData.rendimiento_M2 || parseFloat(productData.rendimiento_M2) <= 0) {
      alert('El rendimiento por M² debe ser un número válido mayor a 0');
      return;
    }

    if (!productData.precio_M2 || parseFloat(productData.precio_M2) <= 0) {
      alert('El precio por M² debe ser un número válido mayor a 0');
      return;
    }
    // Validar especificaciones del departamento
    if (currentBrand && currentDepartment) {
      const validation = validateSpecifications(currentBrand.department, especificaciones);
      if (!validation.isValid) {
        alert(`Errores en especificaciones:\n${validation.errors.join('\n')}`);
        return;
      }
    }

    // Obtener brandId de la URL actual
    const pathParts = window.location.pathname.split('/');
    const brandId = pathParts[2];
    
    if (!brandId) {
      alert('No se pudo determinar la marca. Asegúrate de estar en la página correcta.');
      return;
    }
    setIsUploading(true);

    try {
      let imageUrl = editingProduct?.imagen_url || '';
      
      // Si hay una nueva imagen, subirla
      if (productData.image) {
        const productId = editingProduct?.id || `product-${Date.now()}`;
        
        console.log('Uploading image for product:', productId, 'brand:', brandId);
        console.log('Image file:', productData.image.name, productData.image.type, productData.image.size);
        
        try {
          const uploadResult = await uploadProductImage(productData.image, brandId, productId);
          console.log('Upload result:', uploadResult);
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Error específico de upload:', uploadError);
          throw new Error(`Error al subir imagen: ${uploadError instanceof Error ? uploadError.message : 'Error desconocido'}`);
        }
      }

      // Preparar datos para Supabase
      const productDataForDB = {
        nombre: productData.nombre.trim(),
        clave: productData.clave.trim() || null,
        codigo: productData.codigo.trim() || null,
        codigo_barras: productData.codigo_barras.trim() || null,
        descripcion: productData.descripcion.trim() || null,
        precio: parseFloat(productData.precio),
        Medida: productData.Medida.trim(),
        rendimiento_M2: parseFloat(productData.rendimiento_M2),
        precio_M2: parseFloat(productData.precio_M2),
        marca_id: brandId,
        formato_id: null,
        departamento: currentDepartment?.name || 'General',
        unidad: productData.unidad,
        imagen_url: imageUrl || null,
        especificaciones: especificaciones,
        cantidad_stock: 0,
        stock_minimo: 0,
        activo: true
      };

      console.log('Product data for DB:', productDataForDB);

      // Guardar en Supabase
      let savedProduct;
      if (editingProduct) {
        // Actualizar producto existente
        savedProduct = await updateProduct(editingProduct.id, productDataForDB);
        console.log('Producto actualizado:', savedProduct);
        alert('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        savedProduct = await createProduct(productDataForDB);
        console.log('Producto creado:', savedProduct);
        alert('Producto creado exitosamente');
      }
      
      // Notificar al componente padre
      onSave(savedProduct);
      
      // Limpiar formulario
      setProductData({
        nombre: '',
        clave: '',
        codigo: '',
        codigo_barras: '',
        descripcion: '',
        precio: '',
        unidad: '',
        image: null
      });
      setCustomFields([]);
      setEspecificaciones({});
      setImagePreview(null);
      
      onClose();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mostrar error más específico
      if (errorMessage.includes('Bucket not found')) {
        alert('Error: Los buckets de almacenamiento no están configurados. Contacta al administrador.');
      } else if (errorMessage.includes('not authenticated')) {
        alert('Error: No estás autenticado. Por favor, inicia sesión nuevamente.');
      } else if (errorMessage.includes('File size')) {
        alert('Error: El archivo es demasiado grande. Máximo 5MB.');
      } else if (errorMessage.includes('brand_id')) {
        alert('Error: Problema con la marca seleccionada. Verifica que estés en la página correcta.');
      } else if (errorMessage.includes('price')) {
        alert('Error: El precio debe ser un número válido.');
      } else {
        alert(`Error al guardar producto: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEspecificacionChange = (fieldKey: string, value: string) => {
    setEspecificaciones(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent";
    
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder="Ingrese un número"
          />
        );
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={field.value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              className={`${baseClasses} pl-8`}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder="Ingrese texto"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {imagePreview ? (
                <div className="text-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-40 w-40 object-cover rounded-lg mb-4 border border-gray-200"
                  />
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="w-4 h-4 mr-2" />
                    Cambiar imagen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-40 w-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Insertar imagen desde equipo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos: JPEG, PNG, WebP (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <input
              type="text"
              value={productData.nombre}
              onChange={(e) => setProductData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ingrese el nombre del producto"
              required
            />
          </div>

          {/* Clave */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave del producto
            </label>
            <input
              type="text"
              value={productData.clave}
              onChange={(e) => setProductData(prev => ({ ...prev, clave: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ingrese la clave única del producto"
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código interno
            </label>
            <input
              type="text"
              value={productData.codigo}
              onChange={(e) => setProductData(prev => ({ ...prev, codigo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Código interno del producto"
            />
          </div>

          {/* Código de Barras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de barras
            </label>
            <input
              type="text"
              value={productData.codigo_barras}
              onChange={(e) => setProductData(prev => ({ ...prev, codigo_barras: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Código de barras (opcional)"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={productData.descripcion}
              onChange={(e) => setProductData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Descripción detallada del producto"
            />
          </div>

          {/* Unit of Sale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad de venta *
            </label>
            <select
              value={productData.unidad}
              onChange={(e) => setProductData(prev => ({ ...prev, unidad: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar unidad</option>
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio (MXN) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={productData.precio}
                onChange={(e) => setProductData(prev => ({ ...prev, precio: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            {productData.unidad && (
              <p className="text-sm text-gray-500 mt-1">
                El precio se interpreta por {productData.unidad.toLowerCase()}
              </p>
            )}
          </div>

          {/* Medida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medida *
            </label>
            <input
              type="text"
              value={productData.Medida}
              onChange={(e) => setProductData(prev => ({ ...prev, Medida: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="ej. 30x30 cm, 60x60 cm"
              required
            />
          </div>

          {/* Rendimiento M2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rendimiento por M² *
            </label>
            <div className="relative">
              <input
                type="number"
                value={productData.rendimiento_M2}
                onChange={(e) => setProductData(prev => ({ ...prev, rendimiento_M2: e.target.value }))}
                className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="11"
                step="0.01"
                min="0"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                pzs/m²
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Número de piezas que cubren un metro cuadrado
            </p>
          </div>

          {/* Precio M2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio por M² *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={productData.precio_M2}
                onChange={(e) => setProductData(prev => ({ ...prev, precio_M2: e.target.value }))}
                className="w-full pl-8 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="50.00"
                step="0.01"
                min="0"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                MXN/m²
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Precio calculado por metro cuadrado
            </p>
          </div>
          {/* Departamento actual */}
          {currentDepartment && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Departamento: {currentDepartment.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Los siguientes campos son específicos para este departamento (opcionales):
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Especificaciones del departamento
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDepartment.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={especificaciones[field.key] || ''}
                        onChange={(e) => handleEspecificacionChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required={field.required}
                      >
                        <option value="">Seleccionar {field.label.toLowerCase()}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type={field.type}
                          value={especificaciones[field.key] || ''}
                          onChange={(e) => handleEspecificacionChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                        {field.unit && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {field.unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Campos adicionales personalizables
              </label>
              <button
                onClick={() => setShowAddField(true)}
                className="inline-flex items-center px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar campo
              </button>
            </div>

            {/* Add Field Form */}
            {showAddField && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del campo
                    </label>
                    <input
                      type="text"
                      value={newField.name}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="ej. Medida, Color, Acabado..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de campo
                    </label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddCustomField}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Custom Fields List */}
            {customFields.length > 0 && (
              <div className="space-y-4">
                {customFields.map(field => (
                  <div key={field.id} className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name}
                        <span className="text-xs text-gray-500 ml-1">
                          ({fieldTypes.find(t => t.value === field.type)?.label})
                        </span>
                      </label>
                      {renderCustomFieldInput(field)}
                    </div>
                    <button
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customFields.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Estos campos forman parte de los formatos anteriormente creados y se aplican a todos los productos de esta marca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Subiendo...
              </>
            ) : (
              editingProduct ? 'Actualizar producto' : 'Guardar producto'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;