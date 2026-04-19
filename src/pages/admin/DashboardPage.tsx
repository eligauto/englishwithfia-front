import { useState, useEffect, type ElementType } from "react";
import { DollarSign, Users, Clock, AlertCircle, BookCheck, CalendarCheck } from "lucide-react";
import { getDashboard, ApiRequestError } from "../../services/api";
import type { DashboardData } from "../../types";

interface KpiCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  colorClass: string;
  accentClass?: string;
}

function KpiCard({ icon: Icon, label, value, colorClass, accentClass = "border-l-gray-200" }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4 border-l-2 ${accentClass}`}>
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1.5">
          {label}
        </p>
        <p className="text-[22px] font-bold text-app-neutral-dark leading-none tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function fmt(amount: number, currency = "") {
  const num = Number(amount).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${num}` : `$${num}`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar el dashboard",
        ),
      );
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-app-neutral-dark tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen de tu práctica</p>
      </div>

      {/* Ingresos esperados hoy — banner */}
      {(data.todayExpectedRevenueByCurrency?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {data.todayExpectedRevenueByCurrency.map((item) => (
            <div
              key={item.currency}
              className="bg-app-primary text-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm"
            >
              <CalendarCheck size={14} className="opacity-80" />
              <span className="text-xs font-medium opacity-80">Ingreso esperado hoy</span>
              <span className="text-sm font-bold">
                {item.currency}{" "}
                {item.amount.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 mb-8">
        {data.pendingByCurrency.length > 0 ? (
          data.pendingByCurrency.map((item) => (
            <KpiCard
              key={item.currency}
              icon={DollarSign}
              label={`Deuda pendiente (${item.currency})`}
              value={item.amount.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              colorClass="bg-app-secondary/15 text-app-secondary"
              accentClass="border-l-app-secondary"
            />
          ))
        ) : (
          <KpiCard
            icon={DollarSign}
            label="Deuda pendiente"
            value="$0,00"
            colorClass="bg-app-secondary/15 text-app-secondary"
            accentClass="border-l-app-secondary"
          />
        )}
        <KpiCard
          icon={Users}
          label="Alumnos con deuda"
          value={data.studentsWithDebt}
          colorClass="bg-red-50 text-red-400"
          accentClass="border-l-red-400"
        />
        <KpiCard
          icon={Clock}
          label="Pagos diferidos activos"
          value={data.activeDeferredPayments}
          colorClass="bg-amber-50 text-amber-500"
          accentClass="border-l-amber-400"
        />
        <KpiCard
          icon={BookCheck}
          label="Clases de hoy sin cobrar"
          value={data.taughtTodayUnpaid}
          colorClass="bg-sky-50 text-sky-500"
          accentClass="border-l-sky-400"
        />
        <KpiCard
          icon={AlertCircle}
          label="Promesas vencidas"
          value={data.overduePromises}
          colorClass="bg-red-50 text-red-400"
          accentClass="border-l-red-400"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Clases programadas hoy"
          value={data.todayScheduledCount}
          colorClass="bg-app-primary-light text-app-primary"
          accentClass="border-l-app-primary"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top deudores */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[13px] font-semibold text-app-neutral-dark mb-4 uppercase tracking-wide">
            Top deudores por moneda
          </h2>
          {(data.topDebtorsByCurrency?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Sin deudores pendientes</p>
          ) : (
            <ul className="space-y-2.5">
              {data.topDebtorsByCurrency.map((d, i) => (
                <li
                  key={`${d.studentId}-${d.currency}`}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-gray-300 w-4 tabular-nums">{i + 1}</span>
                    <span className="text-gray-700 font-medium">{d.fullName}</span>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{d.currency}</span>
                  </span>
                  <span className="font-semibold text-red-500 tabular-nums">
                    {fmt(d.totalDebt, d.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximas promesas de pago */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[13px] font-semibold text-app-neutral-dark mb-4 uppercase tracking-wide">
            Promesas de pago · próximos 7 días
          </h2>
          {data.upcomingPromises.length === 0 ? (
            <p className="text-sm text-gray-400">Sin promesas próximas.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.upcomingPromises.map((p) => (
                <li
                  key={p.chargeId}
                  className="flex items-center justify-between text-sm gap-4 py-1"
                >
                  <span className="text-gray-700 font-medium truncate">{p.fullName}</span>
                  <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                    {new Date(p.promisedPaymentDate).toLocaleDateString("es-AR")}
                  </span>
                  <span className="font-semibold text-app-secondary shrink-0 tabular-nums">
                    {fmt(p.amount, p.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
