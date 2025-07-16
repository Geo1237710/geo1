import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { uploadBrandLogo } from '../lib/storage';
import { DEPARTMENTS } from '../lib/departments';

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandData: any) => void;
  editingBrand?: any;
}

const AddBrandModal: React.FC<AddBrandModalProps> = ({ isOpen, onClose, onSave, editingBrand }) => {
  const [brandData, setBrandData] = useState({
    name: '',
    description: '',
    department: '',
    logo: null as File | null,
    logoUrl: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Inicializar datos cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      if (editingBrand) {
        setBrandData({
          name: editingBrand.name || '',
          description: editingBrand.description || '',
          department: editingBrand.department || '',
          logo: null,
          logoUrl: editingBrand.logo_url || ''
        });
        setLogoPreview(editingBrand.logo_url || null);
      } else {
        setBrandData({
          name: '',
          description: '',
          department: '',
          logo: null,
          logoUrl: ''
        });
        setLogoPreview(null);
      }
      setIsUploading(false);
    }
  }, [isOpen, editingBrand]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Use JPEG, PNG, WebP o SVG.');
        return;
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 2MB.');
        return;
      }

      setBrandData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!brandData.name.trim()) {
      alert('El nombre de la marca es requerido');
      return;
    }

    if (!brandData.department) {
      alert('El departamento es requerido');
      return;
    }

    setIsUploading(true);
    
    try {
      let logoUrl = brandData.logoUrl;
      
      // Si hay una nueva imagen, subirla
      if (brandData.logo) {
        // Usar ID de la marca o generar uno temporal
        const brandId = editingBrand?.id || `brand-${Date.now()}`;
        console.log('Uploading brand logo for:', brandId);
        console.log('Logo file:', brandData.logo.name, brandData.logo.type, brandData.logo.size);
        
        const uploadResult = await uploadBrandLogo(brandData.logo, brandId);
        console.log('Brand logo upload result:', uploadResult);
        logoUrl = uploadResult.url;
      }

      const finalData = {
        ...brandData,
        logo_url: logoUrl
      };

      console.log('Final brand data:', finalData);
      onSave(finalData);
      
      // Limpiar formulario
      setBrandData({ name: '', description: '', department: '', logo: null, logoUrl: '' });
      setLogoPreview(null);
    } catch (error) {
      console.error('Error al guardar marca:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar marca: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nueva Marca</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la marca
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {logoPreview ? (
                <div className="text-center">
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="mx-auto h-32 w-32 object-contain rounded-lg mb-4 bg-gray-50"
                  />
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="w-4 h-4 mr-2" />
                    Cambiar logo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir logo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos: JPEG, PNG, WebP, SVG (máx. 2MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la marca *
            </label>
            <input
              type="text"
              value={brandData.name}
              onChange={(e) => setBrandData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ingrese el nombre de la marca"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento *
            </label>
            <select
              value={brandData.department}
              onChange={(e) => setBrandData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar departamento</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={brandData.description}
              onChange={(e) => setBrandData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Descripción de la marca (opcional)"
            />
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
            disabled={!brandData.name.trim() || !brandData.department || isUploading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Subiendo...
              </>
            ) : (
              editingBrand ? 'Actualizar marca' : 'Guardar marca'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBrandModal;