import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Upload, Plus, MoreHorizontal, Settings } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import ExcelImportModal from '../components/ExcelImportModal';
import FormatEditorModal from '../components/FormatEditorModal';
import ProductTechnicalSheet from '../components/ProductTechnicalSheet';
import { getProductsByBrand, deleteProduct } from '../lib/products';
import { createProduct } from '../lib/products';
import { getBrandById } from '../lib/brands';

const BrandProducts = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isFormatEditorOpen, setIsFormatEditorOpen] = useState(false);
  const [isTechnicalSheetOpen, setIsTechnicalSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar productos al montar el componente
  React.useEffect(() => {
    const loadData = async () => {
      if (!brandId) return;
      
      try {
        setIsLoading(true);
        console.log('Loading products for brand:', brandId);
        
        // Cargar productos y marca en paralelo
        const [fetchedProducts, fetchedBrand] = await Promise.all([
          getProductsByBrand(brandId),
          getBrandById(brandId)
        ]);
        
        console.log('Products loaded:', fetchedProducts);
        console.log('Brand loaded:', fetchedBrand);
        
        setProducts(fetchedProducts);
        setBrand(fetchedBrand);
      } catch (error) {
        console.error('Error loading data:', error);
        setProducts([]);
        setBrand(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [brandId]);

  const brandName = brand?.name || 'Marca';

  const handleBack = () => {
    navigate('/');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsAddProductModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsAddProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      const performDelete = async () => {
        try {
          await deleteProduct(productId);
          console.log('Producto eliminado:', productId);
          
          // Actualizar lista local
          setProducts(prev => prev.filter(p => p.id !== productId));
          
          // Limpiar selección si el producto estaba seleccionado
          setSelectedProducts(prev => prev.filter(id => id !== productId));
          
          alert('Producto eliminado exitosamente');
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          alert(`Error al eliminar producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      };
      
      performDelete();
    }
  };

  const handleImportExcel = () => {
    setIsExcelImportModalOpen(true);
  };

  const handleManageFormats = () => {
    setIsFormatEditorOpen(true);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSaveProduct = (productData: any) => {
    console.log('Producto guardado:', productData);
    
    // Actualizar lista de productos
    if (editingProduct) {
      // Actualizar producto existente
      setProducts(prev => 
        prev.map(p => p.id === productData.id ? productData : p)
      );
    } else {
      // Agregar nuevo producto
      setProducts(prev => [productData, ...prev]);
    }
    
    setIsAddProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleImportData = (importData: any) => {
    console.log('Datos importados:', importData);
    
    // Procesar cada producto importado
    const processImportedProducts = async () => {
      try {
        console.log('Procesando productos importados:', importData.length);
        
        for (const productData of importData) {
          try {
            console.log('Creando producto:', productData);
            const savedProduct = await createProduct({
              ...productData,
              marca_id: brandId
            });
            console.log('Producto creado exitosamente:', savedProduct);
            
            // Agregar a la lista local
            setProducts(prev => [savedProduct, ...prev]);
          } catch (error) {
            console.error('Error creando producto:', productData.nombre, error);
          }
        }
        
        alert(`Importación completada. ${importData.length} productos procesados.`);
      } catch (error) {
        console.error('Error en importación masiva:', error);
        alert('Error durante la importación: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    };
    
    processImportedProducts();
    setIsExcelImportModalOpen(false);
  };

  const handleViewProductDetails = (product: any) => {
    setSelectedProductForDetails(product);
    setIsTechnicalSheetOpen(true);
  };
  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Página anterior</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{brandName}</h1>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              Debug OFF
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span>Todos</span>
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleManageFormats}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Gestionar Formatos</span>
          </button>
          
          <button 
            onClick={handleImportExcel}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>
          
          <button 
            onClick={handleAddProduct}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar producto</span>
          </button>
        </div>
      </div>

      {/* Products Header */}
      <div className="flex items-center justify-between mb-6">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            <span className="text-lg font-semibold text-gray-900">Cargando productos...</span>
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-gray-900">
            Productos ({products.length})
          </h2>
        )}
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={selectedProducts.length === products.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            disabled={isLoading || products.length === 0}
          />
          <span>Seleccionar todos</span>
        </label>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-4">Comienza agregando tu primer producto a esta marca.</p>
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar primer producto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProducts.includes(product.id)}
              onSelect={handleProductSelect}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onViewDetails={handleViewProductDetails}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImport={handleImportData}
      />

      <FormatEditorModal
        isOpen={isFormatEditorOpen}
        onClose={() => setIsFormatEditorOpen(false)}
        brandId={brandId || ''}
        onSave={() => {
          setIsFormatEditorOpen(false);
          // Aquí podrías recargar los formatos si es necesario
        }}
      />

      <ProductTechnicalSheet
        isOpen={isTechnicalSheetOpen}
        onClose={() => {
          setIsTechnicalSheetOpen(false);
          setSelectedProductForDetails(null);
        }}
        product={selectedProductForDetails}
        brandName={brand?.name}
        formatName={selectedProductForDetails?.format_name}
      />
    </div>
  );
};

export default BrandProducts;