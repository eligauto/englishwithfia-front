import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/admin/LoginPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { StudentsPage } from "./pages/admin/StudentsPage";
import { ClassesPage } from "./pages/admin/ClassesPage";
import { ChargesPage } from "./pages/admin/ChargesPage";
import { PacksPage } from "./pages/admin/PacksPage";
import { SchedulesPage } from "./pages/admin/SchedulesPage";
import { ROUTES } from "./constants/routes";

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
              <Route
                path={ROUTES.ADMIN.DASHBOARD}
                element={<DashboardPage />}
              />
              <Route
                path={ROUTES.ADMIN.ANALYTICS}
                element={<AnalyticsPage />}
              />
              <Route path={ROUTES.ADMIN.STUDENTS} element={<StudentsPage />} />
              <Route path={ROUTES.ADMIN.CLASSES} element={<ClassesPage />} />
              <Route path={ROUTES.ADMIN.CHARGES} element={<ChargesPage />} />
              <Route path={ROUTES.ADMIN.PACKS} element={<PacksPage />} />
              <Route
                path={ROUTES.ADMIN.SCHEDULES}
                element={<SchedulesPage />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
