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
  Settings,
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
  {
    label: "Configuración",
    href: ROUTES.ADMIN.SETTINGS,
    icon: Settings,
    end: false,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    getOrganization()
      .then(setOrg)
      .catch(() => {});
  }, []);

  const displayName = user?.email
    ? user.email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Usuario";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-screen overflow-hidden bg-app-canvas">
      {/* Sidebar */}
      <aside className="w-[216px] shrink-0 bg-app-sidebar flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-app-primary flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold tracking-tight">P</span>
            </div>
            <p className="text-white font-semibold text-sm tracking-tight truncate">
              {org?.name ?? "Practiq"}
            </p>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/[0.07] mb-3" />

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon, end }) => (
            <NavLink
              key={href}
              to={href}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-app-primary/90 text-white shadow-sm"
                    : "text-white/45 hover:text-white/85 hover:bg-white/[0.07]",
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="mx-4 h-px bg-white/[0.07] mt-3" />
        <div className="px-3 py-4">
          <div className="flex items-center gap-2.5 px-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-app-primary to-app-primary-dark flex items-center justify-center text-white text-[11px] font-bold shrink-0 ring-2 ring-white/10">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[12px] font-medium truncate leading-tight">
                {displayName}
              </p>
              <p className="text-white/35 text-[10px] truncate leading-tight mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-white/35 hover:text-white/70 hover:bg-white/[0.07] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
