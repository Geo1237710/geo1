import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import Header from './components/Header';
import BrandCatalog from './pages/BrandCatalog';
import BrandProducts from './pages/BrandProducts';
import { getCurrentUser } from './lib/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Verificar si hay una sesión activa al cargar la app
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('No hay sesión activa');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    // No cambiar isSearchActive aquí, se maneja desde Header
  };
  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Si hay usuario, mostrar la aplicación principal
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} onSearchResults={handleSearchResults} />
        
        {/* Search Results Overlay */}
        {isSearchActive && (
          <div className="relative z-40">
            <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resultados de búsqueda ({searchResults.length})
                  </h3>
                  <button
                    onClick={() => setIsSearchActive(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {searchResults.length === 0 ? (
                  <p className="text-gray-500">No se encontraron productos</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {searchResults.map(product => (
                      <div key={product.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Sin imagen</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-500">${product.precio}</p>
                            {product.clave && (
                              <p className="text-xs text-gray-400">Clave: {product.clave}</p>
                            )}
                            {product.codigo_barras && (
                              <p className="text-xs text-gray-400">Código: {product.codigo_barras}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<BrandCatalog />} />
          <Route path="/brand/:brandId" element={<BrandProducts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;