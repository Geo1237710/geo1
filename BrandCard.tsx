import React from 'react';

interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    product_count?: number;
    is_active: boolean;
  };
  onClick: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Background Image */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              // Fallback si la imagen no carga
              e.currentTarget.src = 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-200" />
        
        {/* Brand Name */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-white text-2xl font-bold tracking-wide">
            {brand.name}
          </h3>
        </div>

        {/* Product Count Badge */}
        {brand.product_count && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
            {brand.product_count} productos
          </div>
        )}

        {/* Status Indicator */}
        <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${
          brand.is_active ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500 rounded-lg transition-all duration-200" />
    </div>
  );
};

export default BrandCard;