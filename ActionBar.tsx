import React from 'react';
import { ArrowLeft, Filter, Edit, Upload, Plus } from 'lucide-react';

interface ActionBarProps {
  onAddProduct: () => void;
  onImportExcel: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ onAddProduct, onImportExcel }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and title */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Página anterior</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Marca 1</h2>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Categorías</span>
          </button>
          
          <button 
            onClick={onImportExcel}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>
          
          <button 
            onClick={onAddProduct}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar producto</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;