import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
}
