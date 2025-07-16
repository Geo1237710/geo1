import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandCard from '../components/BrandCard';
import AddBrandModal from '../components/AddBrandModal';
import { getBrands, createBrand } from '../lib/brands';

const BrandCatalog = () => {
  const navigate = useNavigate();
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar marcas al montar el componente
  React.useEffect(() => {
    const loadBrands = async () => {
      try {
        setIsLoading(true);
        console.log('Loading brands from Supabase...');
        const fetchedBrands = await getBrands();
        console.log('Brands loaded:', fetchedBrands);
        setBrands(fetchedBrands);
      } catch (error) {
        console.error('Error loading brands:', error);
        // Mantener marcas vacías en caso de error
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrands();
  }, []);

  const handleBrandClick = (brandId: string) => {
    navigate(`/brand/${brandId}`);
  };

  const handleAddBrand = () => {
    setIsAddBrandModalOpen(true);
  };

  const handleSaveBrand = async (brandData: any) => {
    try {
      console.log('Saving brand:', brandData);
      
      // Preparar datos para Supabase
      const brandDataForDB = {
        name: brandData.name,
        description: brandData.description || null,
        logo_url: brandData.logo_url || null,
        is_active: true
      };

      const savedBrand = await createBrand(brandDataForDB);
      console.log('Brand saved successfully:', savedBrand);
      
      // Actualizar lista de marcas
      setBrands(prev => [savedBrand, ...prev]);
      
      setIsAddBrandModalOpen(false);
      alert('Marca creada exitosamente');
    } catch (error) {
      console.error('Error saving brand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar marca: ${errorMessage}`);
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Navigation */}
      <div className="mb-6">
        <nav className="text-sm text-gray-600">
          <span>Categorías</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Marcas</h1>
          <p className="text-gray-600">Gestiona las marcas de tu catálogo</p>
        </div>
        <button
          onClick={handleAddBrand}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Marca</span>
        </button>
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay marcas</h3>
          <p className="text-gray-500 mb-4">Comienza creando tu primera marca.</p>
          <button
            onClick={handleAddBrand}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primera marca</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brands.map(brand => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onClick={() => handleBrandClick(brand.id)}
            />
          ))}
        </div>
      )}

      {/* Add Brand Modal */}
      <AddBrandModal
        isOpen={isAddBrandModalOpen}
        onClose={() => setIsAddBrandModalOpen(false)}
        onSave={handleSaveBrand}
      />
    </div>
  );
};

export default BrandCatalog;