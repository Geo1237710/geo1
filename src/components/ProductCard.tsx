import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2, Upload, Eye } from 'lucide-react';
import { Product } from '../lib/supabase';

interface ProductCardProps {
  product: Product & { showDetails?: boolean };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (product: any) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (product: any) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative">
      {/* Header with checkbox and menu */}
      <div className="flex items-center justify-between p-4 pb-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(product.id)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
              <button
                onClick={() => {
                  onViewDetails?.(product);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
              >
                <Eye className="w-4 h-4" />
                <span>Ver detalles</span>
              </button>
              <button
                onClick={() => {
                  onEdit?.(product);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                <span>Editar producto</span>
              </button>
              <button
                onClick={() => {
                  onDelete?.(product.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar producto</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Image */}
      <div className="px-4 pb-4">
        <div 
          className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onViewDetails?.(product)}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback si la imagen no carga
                e.currentTarget.src = 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Sin imagen</span>
              </div>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded text-sm font-medium flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </div>
          </div>
          
          {/* Ver detalles overlay for specific product */}
          {product.showDetails && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium">
                Ver detalles
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 pb-4">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg">{product.nombre}</h3>
        <div className="mb-3">
          <p className="text-2xl font-bold text-red-600">${(product.precio ?? 0).toFixed(2)}</p>
        </div>
        
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Departamento:</span>
            <span className="text-gray-900">{product.departamento}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Unidad:</span>
            <span className="text-gray-900">{product.unidad}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Medida:</span>
            <span className="text-gray-900">{product.medida}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rendimiento:</span>
            <span className="text-gray-900">{product.rendimiento_M2} pzs/m²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Precio/m²:</span>
            <span className="text-gray-900">${product.precio_M2}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Clave:</span>
            <span className="text-gray-900">{product.clave}</span>
          </div>
          {product.codigo_barras && (
            <div className="flex justify-between">
              <span className="text-gray-500">Código:</span>
              <span className="text-gray-900">{product.codigo_barras}</span>
            </div>
          )}
          
          {/* Especificaciones */}
          {product.especificaciones && Object.keys(product.especificaciones).length > 0 && 
           Object.entries(product.especificaciones).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-900 truncate ml-2" title={String(value)}>
                {String(value)}
              </span>
            </div>
          ))}
          
          {/* Mostrar indicador si hay más especificaciones */}
          {product.especificaciones && Object.keys(product.especificaciones).length > 3 && (
            <div className="text-xs text-gray-400 text-center">
              +{Object.keys(product.especificaciones).length - 3} más...
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ProductCard;