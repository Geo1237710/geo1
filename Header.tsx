import React from 'react';
import { Search, User, ChevronDown, LogOut } from 'lucide-react';
import { signOut } from '../lib/auth';
import { searchProducts } from '../lib/products';

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
  onSearchResults?: (results: any[]) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onSearchResults, setIsSearchActive }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout?.();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim() || term.trim().length === 0) {
      onSearchResults?.([]);
      setIsSearchActive?.(false);
      return;
    }

    // Mostrar overlay inmediatamente cuando hay texto
    setIsSearchActive?.(true);

    setIsSearching(true);
    try {
      console.log('Searching for:', term);
      const results = await searchProducts(term);
      console.log('Search results:', results);
      onSearchResults?.(results);
    } catch (error) {
      console.error('Error searching products:', error);
      onSearchResults?.([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si no hay texto, ocultar resultados inmediatamente
    if (!value.trim()) {
      onSearchResults?.([]);
      setIsSearchActive?.(false);
      return;
    }
    
    // Buscar automáticamente después de 200ms de inactividad (más rápido)
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 200);

    // Limpiar timeout anterior
    return () => clearTimeout(timeoutId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Ceramicasa</h1>
            <p className="text-sm text-gray-600">Sistema de Gestión</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por código de barras, clave o descripción..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              </div>
            )}
          </form>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || 'Administrador'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.full_name || 'Administrador'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'admin@ceramicasa.com'}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">
                  Rol: {user?.role || 'admin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;