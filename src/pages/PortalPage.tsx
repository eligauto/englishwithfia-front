import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPortalMe,
  getPortalClasses,
  getPortalCharges,
  getPortalPacks,
  ApiRequestError,
} from "../services/api";
import type {
  PortalProfile,
  PortalClass,
  PortalCharge,
  PortalPack,
  ClassStatus,
  FinancialStatus,
} from "../types";
import { cn } from "../utils/cn";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  SCHEDULED: "Programada",
  TAUGHT: "Dictada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
  ABSENT: "Ausente",
};

const CLASS_STATUS_COLORS: Record<ClassStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  TAUGHT: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  RESCHEDULED: "bg-orange-100 text-orange-700",
  ABSENT: "bg-yellow-100 text-yellow-700",
};

const CHARGE_STATUS_LABELS: Record<FinancialStatus, string> = {
  PENDING_PAYMENT: "Pendiente",
  PAID: "Pagado",
  DEFERRED: "Diferido",
  WAIVED: "Condonado",
  PACK_COVERED: "Pack",
  ABSENT_CHARGEABLE: "Ausente / cobra",
  ABSENT_NON_CHARGEABLE: "Ausente / no cobra",
};

const CHARGE_STATUS_COLORS: Record<FinancialStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  DEFERRED: "bg-orange-100 text-orange-700",
  WAIVED: "bg-gray-100 text-gray-500",
  PACK_COVERED: "bg-purple-100 text-purple-700",
  ABSENT_CHARGEABLE: "bg-red-100 text-red-700",
  ABSENT_NON_CHARGEABLE: "bg-gray-100 text-gray-400",
};

type Tab = "classes" | "charges" | "packs";

// ── PortalPage ────────────────────────────────────────────────────────────────

export function PortalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [classes, setClasses] = useState<PortalClass[]>([]);
  const [charges, setCharges] = useState<PortalCharge[]>([]);
  const [packs, setPacks] = useState<PortalPack[]>([]);
  const [tab, setTab] = useState<Tab>("classes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Link de acceso inválido. Pedile uno nuevo a tu profesor/a.");
      setLoading(false);
      return;
    }

    Promise.all([
      getPortalMe(token),
      getPortalClasses(token),
      getPortalCharges(token),
      getPortalPacks(token),
    ])
      .then(([prof, cls, chg, pks]) => {
        setProfile(prof);
        setClasses(cls.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
        setCharges(chg.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
        setPacks(pks);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          setError("El link de acceso no es válido o fue revocado. Pedile uno nuevo a tu profesor/a.");
        } else {
          setError("No se pudo cargar tu información. Intentá de nuevo más tarde.");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-fia-neutral-light flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fia-neutral-light flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center space-y-3">
          <p className="text-2xl">🔒</p>
          <p className="text-base font-semibold text-fia-neutral-dark">Sin acceso</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const pendingTotal = charges
    .filter((c) => ["PENDING_PAYMENT", "DEFERRED", "ABSENT_CHARGEABLE"].includes(c.financialStatus))
    .reduce<Record<string, number>>((acc, c) => {
      acc[c.currency] = (acc[c.currency] ?? 0) + Number(c.amount);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-fia-neutral-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Portal del alumno</p>
            <h1 className="text-xl font-bold text-fia-neutral-dark">{profile?.fullName}</h1>
          </div>
          <p className="text-sm font-semibold text-fia-primary">English with Fia</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Resumen deuda */}
        {Object.keys(pendingTotal).length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Saldo pendiente</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(pendingTotal).map(([cur, amount]) => (
                <span key={cur} className="text-sm font-bold text-yellow-700">
                  {cur} {amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {(["classes", "charges", "packs"] as Tab[]).map((t) => {
            const labels = { classes: "Clases", charges: "Cargos", packs: "Packs" };
            const counts = { classes: classes.length, charges: charges.length, packs: packs.length };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-xl transition-colors",
                  tab === t
                    ? "bg-fia-primary text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                )}
              >
                {labels[t]}
                <span className={cn("ml-1.5 text-xs", tab === t ? "opacity-70" : "text-gray-400")}>
                  {counts[t]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenido de tab */}
        {tab === "classes" && <ClassesTab classes={classes} />}
        {tab === "charges" && <ChargesTab charges={charges} />}
        {tab === "packs" && <PacksTab packs={packs} />}
      </div>
    </div>
  );
}

// ── ClassesTab ────────────────────────────────────────────────────────────────

function ClassesTab({ classes }: { classes: PortalClass[] }) {
  if (classes.length === 0) {
    return <EmptyState text="Todavía no tenés clases registradas." />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duración</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {classes.map((cls) => (
            <tr key={cls.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5 text-gray-700">{fmtDateTime(cls.scheduledAt)}</td>
              <td className="px-5 py-3.5 text-gray-500">{cls.duration} min</td>
              <td className="px-5 py-3.5">
                <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", CLASS_STATUS_COLORS[cls.status])}>
                  {CLASS_STATUS_LABELS[cls.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── ChargesTab ────────────────────────────────────────────────────────────────

function ChargesTab({ charges }: { charges: PortalCharge[] }) {
  if (charges.length === 0) {
    return <EmptyState text="Todavía no tenés cargos registrados." />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vencimiento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {charges.map((chg) => (
            <tr key={chg.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5 text-gray-500">{fmtDate(chg.generatedAt)}</td>
              <td className="px-5 py-3.5 text-gray-700 font-medium">
                {chg.currency} {Number(chg.amount).toFixed(2)}
              </td>
              <td className="px-5 py-3.5">
                <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", CHARGE_STATUS_COLORS[chg.financialStatus])}>
                  {CHARGE_STATUS_LABELS[chg.financialStatus]}
                </span>
              </td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">
                {chg.financialStatus === "DEFERRED" && chg.promisedPaymentDate
                  ? fmtDate(chg.promisedPaymentDate)
                  : chg.paidAt
                    ? fmtDate(chg.paidAt)
                    : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PacksTab ──────────────────────────────────────────────────────────────────

function PacksTab({ packs }: { packs: PortalPack[] }) {
  if (packs.length === 0) {
    return <EmptyState text="No tenés packs activos." />;
  }

  return (
    <div className="space-y-3">
      {packs.map((pack) => (
        <div key={pack.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className={cn(
              "text-xs font-semibold px-2.5 py-0.5 rounded-full",
              pack.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
            )}>
              {pack.isActive ? "Activo" : "Inactivo"}
            </span>
            <span className="text-xs text-gray-400">Comprado {fmtDate(pack.purchasedAt)}</span>
          </div>

          {/* Barra de progreso */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{pack.usedClasses} clases usadas</span>
              <span>{pack.availableClasses} disponibles</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-fia-primary rounded-full transition-all"
                style={{ width: `${Math.round((pack.usedClasses / pack.totalClasses) * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Total: {pack.totalClasses} clases
            {pack.expiresAt && ` · Vence ${fmtDate(pack.expiresAt)}`}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-sm text-gray-400 text-center py-12 bg-white rounded-2xl border border-gray-100">
      {text}
    </p>
  );
}
