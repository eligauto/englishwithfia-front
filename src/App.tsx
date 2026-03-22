import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { ClassesPage } from './pages/admin/ClassesPage';
import { ROUTES } from './constants/routes';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-fia-neutral-dark mb-2">{title}</h1>
      <p className="text-sm text-gray-500">Esta sección estará disponible próximamente.</p>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ADMIN.LOGIN} element={<LoginPage />} />

          {/* Rutas protegidas del panel admin */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path={ROUTES.ADMIN.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.ADMIN.STUDENTS} element={<StudentsPage />} />
              <Route path={ROUTES.ADMIN.CLASSES} element={<ClassesPage />} />
              <Route
                path={ROUTES.ADMIN.CHARGES}
                element={<PlaceholderPage title="Cargos" />}
              />
              <Route
                path={ROUTES.ADMIN.PACKS}
                element={<PlaceholderPage title="Packs" />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

