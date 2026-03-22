import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../services/api';
import type { LoginFormData } from '../../types';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  // Si ya está autenticado, redirigir directamente
  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 401) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError('No se pudo conectar con el servidor. Intentá de nuevo.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-fia-neutral-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fia-neutral-dark">English with Fia</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de administración</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
              })}
              type="email"
              autoComplete="email"
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition',
                errors.email ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              {...register('password', { required: 'La contraseña es obligatoria' })}
              type="password"
              autoComplete="current-password"
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition',
                errors.password ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
