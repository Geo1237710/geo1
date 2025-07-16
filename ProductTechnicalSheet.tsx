import React from 'react';
import { X, Calendar, Package, Tag, Layers, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductTechnicalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  brandName?: string;
  formatName?: string;
}

const ProductTechnicalSheet: React.FC<ProductTechnicalSheetProps> = ({
  isOpen,
  onClose,
  product,
  brandName,
  formatName
}) => {
  if (!isOpen || !product) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { text: 'Sin stock', color: 'text-red-600 bg-red-50' };
    if (current <= min) return { text: 'Stock bajo', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'En stock', color: 'text-green-600 bg-green-50' };
  };

  const stockStatus = getStockStatus(product.cantidad_stock, product.stock_minimo);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="pr-12">
            <h1 className="text-2xl font-bold mb-2">{product.nombre}</h1>
            <p className="text-red-100 text-sm">Ficha Técnica del Producto</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Basic Info */}
            <div className="space-y-6">
              {/* Product Image */}
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {product.imagen_url ? (
                  <img
                    src={product.imagen_url}
                    alt={product.nombre}
                    className="w-full h-80 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800';
                    }}
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                      <p>Sin imagen disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price and Stock */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Precio</h3>
                    <p className="text-3xl font-bold text-red-600">{formatPrice(product.precio)}</p>
                    <p className="text-sm text-gray-500">por {product.unidad.toLowerCase()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Stock</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">{product.cantidad_stock}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Mínimo: {product.stock_minimo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Información General
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Clave</label>
                      <p className="text-gray-900 font-mono">{product.clave || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código</label>
                      <p className="text-gray-900 font-mono">{product.codigo || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medida</label>
                      <p className="text-gray-900">{product.medida}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rendimiento/M²</label>
                      <p className="text-gray-900">{product.rendimiento_M2} pzs/m²</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Precio/M²</label>
                      <p className="text-gray-900">${product.precio_M2}</p>
                    </div>
                  </div>

                  {product.codigo_barras && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código de Barras</label>
                      <p className="text-gray-900 font-mono">{product.codigo_barras}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Descripción</label>
                    <p className="text-gray-900">{product.descripcion || 'Sin descripción'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Departamento</label>
                      <p className="text-gray-900">{product.departamento || 'General'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Unidad de Venta</label>
                      <p className="text-gray-900">{product.unidad}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand and Format Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Layers className="w-5 h-5 mr-2" />
                  Marca y Formato
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Marca</label>
                    <p className="text-gray-900">{brandName || 'N/A'}</p>
                  </div>
                  {formatName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Formato</label>
                      <p className="text-gray-900">{formatName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Especificaciones Técnicas
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(product.especificaciones).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-900">{value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Información del Sistema
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Fecha de Creación</span>
                    <span className="text-sm text-gray-900">{formatDate(product.creado_en)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Última Actualización</span>
                    <span className="text-sm text-gray-900">{formatDate(product.actualizado_en)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Estado</span>
                    <span className={`text-sm font-medium ${product.activo ? 'text-green-600' : 'text-red-600'}`}>
                      {product.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTechnicalSheet;