import React, { useState } from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  onEditProduct?: (product: any) => void;
  onDeleteProduct?: (productId: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onEditProduct, onDeleteProduct }) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const products = [
    {
      id: '1',
      name: 'Azulejo Cerámico Premium',
      price: 45.99,
      clave: 'ACP001',
      color: 'Blanco',
      medida: '30x30 cm',
      codigo: '7501234567890',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      name: 'Porcelanato Rectificado',
      price: 89.50,
      clave: 'PR002',
      color: 'Gris',
      medida: '60x60 cm',
      codigo: '7501234567891',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      name: 'Azulejo Decorativo',
      price: 32.75,
      clave: 'AD003',
      color: 'Azul',
      medida: '20x20 cm',
      codigo: '7501234567892',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '4',
      name: 'Cerámica Rústica',
      price: 28.90,
      clave: 'CR004',
      color: 'Terracota',
      medida: '25x25 cm',
      codigo: '7501234567893',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '5',
      name: 'Mosaico Vítreo',
      price: 67.25,
      clave: 'MV005',
      color: 'Verde',
      medida: '30x30 cm',
      codigo: '7501234567894',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '6',
      name: 'Baldosa Antideslizante',
      price: 41.80,
      clave: 'BA006',
      color: 'Beige',
      medida: '40x40 cm',
      codigo: '7501234567895',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

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

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Llamar a la función para abrir el modal de edición
      onEditProduct?.(product);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      console.log('Eliminando producto:', productId);
      // Aquí se implementaría la lógica real para eliminar el producto
      // Por ejemplo: eliminar de la lista de productos
      onDeleteProduct?.(productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Select All Checkbox */}
      <div className="flex items-center justify-end">
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={selectedProducts.length === products.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span>Seleccionar todos</span>
        </label>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            {...product}
            isSelected={selectedProducts.includes(product.id)}
            onSelect={handleProductSelect}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;