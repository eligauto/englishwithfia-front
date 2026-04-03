import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  Receipt,
  Package,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getOrganization } from "../../services/api";
import type { Organization } from "../../types";
import { ROUTES } from "../../constants/routes";
import { cn } from "../../utils/cn";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Analytics",
    href: ROUTES.ADMIN.ANALYTICS,
    icon: BarChart3,
    end: false,
  },
  { label: "Alumnos", href: ROUTES.ADMIN.STUDENTS, icon: Users, end: false },
  { label: "Clases", href: ROUTES.ADMIN.CLASSES, icon: BookOpen, end: false },
  { label: "Cargos", href: ROUTES.ADMIN.CHARGES, icon: Receipt, end: false },
  { label: "Packs", href: ROUTES.ADMIN.PACKS, icon: Package, end: false },
  {
    label: "Horarios",
    href: ROUTES.ADMIN.SCHEDULES,
    icon: CalendarClock,
    end: false,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    getOrganization().then(setOrg).catch(() => {});
  }, []);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Usuario";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-fia-neutral-dark flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-white font-bold text-lg leading-tight">
            {org?.name ?? "English with Fia"}
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            Panel de administración
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon, end }) => (
            <NavLink
              key={href}
              to={href}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-fia-primary text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-fia-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {displayName}
              </p>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
