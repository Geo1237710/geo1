import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { signIn } from './lib/auth';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: 'admin@ceramicasa.com',
    password: '1'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Intentando iniciar sesión con:', formData.email);
      const result = await signIn(formData.email, formData.password);
      console.log('Login exitoso:', result);
      onLoginSuccess(result.user);
    } catch (error) {
      console.error('Error de login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setFormData({
      email: 'admin@ceramicasa.com',
      password: '1'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-white rounded-sm"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ceramicasa</h1>
          <p className="text-red-100">Sistema de Gestión</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Accede a tu cuenta para continuar</p>
          </div>

          {/* Quick Login Button */}
          <div className="mb-6">
            <button
              onClick={handleQuickLogin}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Usar credenciales de Admin</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o ingresa manualmente</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="admin@ceramicasa.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Credenciales de demostración:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Usuario:</strong> admin@ceramicasa.com</p>
              <p><strong>Contraseña:</strong> 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;