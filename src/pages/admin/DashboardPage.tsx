import { useState, useEffect, type ElementType } from "react";
import { DollarSign, Users, Clock, AlertCircle, BookCheck, CalendarCheck } from "lucide-react";
import { getDashboard, ApiRequestError } from "../../services/api";
import type { DashboardData } from "../../types";

interface KpiCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  colorClass: string;
}

function KpiCard({ icon: Icon, label, value, colorClass }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-fia-neutral-dark leading-none">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
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
        <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-fia-neutral-dark mb-6">
        Dashboard
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
              colorClass="bg-fia-secondary/20 text-fia-secondary"
            />
          ))
        ) : (
          <KpiCard
            icon={DollarSign}
            label="Deuda pendiente"
            value="$0,00"
            colorClass="bg-fia-secondary/20 text-fia-secondary"
          />
        )}
        <KpiCard
          icon={Users}
          label="Alumnos con deuda"
          value={data.studentsWithDebt}
          colorClass="bg-red-100 text-red-500"
        />
        <KpiCard
          icon={Clock}
          label="Pagos diferidos activos"
          value={data.activeDeferredPayments}
          colorClass="bg-yellow-100 text-yellow-600"
        />
        <KpiCard
          icon={BookCheck}
          label="Clases de hoy sin cobrar"
          value={data.taughtTodayUnpaid}
          colorClass="bg-blue-100 text-blue-600"
        />
        <KpiCard
          icon={AlertCircle}
          label="Promesas vencidas"
          value={data.overduePromises}
          colorClass="bg-red-100 text-red-500"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Clases programadas hoy"
          value={data.todayScheduledCount}
          colorClass="bg-fia-primary-light text-fia-primary"
        />
      </div>

      {/* Ingresos esperados hoy */}
      {(data.todayExpectedRevenueByCurrency?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {data.todayExpectedRevenueByCurrency.map((item) => (
            <div
              key={item.currency}
              className="bg-fia-primary-light rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <span className="text-xs text-fia-primary font-medium">
                Ingreso esperado hoy
              </span>
              <span className="text-sm font-bold text-fia-primary">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top deudores */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
            Top deudores por moneda
          </h2>
          {(data.topDebtorsByCurrency?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Sin deudores pendientes 🎉</p>
          ) : (
            <ul className="space-y-3">
              {data.topDebtorsByCurrency.map((d, i) => (
                <li
                  key={`${d.studentId}-${d.currency}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                    <span className="text-gray-700">{d.fullName}</span>
                    <span className="text-xs text-gray-400">{d.currency}</span>
                  </span>
                  <span className="font-semibold text-red-500">
                    {fmt(d.totalDebt, d.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximas promesas de pago */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
            Promesas de pago (próximos 7 días)
          </h2>
          {data.upcomingPromises.length === 0 ? (
            <p className="text-sm text-gray-400">Sin promesas próximas.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingPromises.map((p) => (
                <li
                  key={p.chargeId}
                  className="flex items-center justify-between text-sm gap-4"
                >
                  <span className="text-gray-700 truncate">{p.fullName}</span>
                  <span className="text-gray-400 shrink-0">
                    {new Date(p.promisedPaymentDate).toLocaleDateString(
                      "es-AR",
                    )}
                  </span>
                  <span className="font-semibold text-fia-secondary shrink-0">
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
