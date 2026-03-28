import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpenCheck, CalendarDays, Receipt } from "lucide-react";
import { ApiRequestError, getAnalytics } from "../../services/api";
import type { AnalyticsData, CurrencyAmount } from "../../types";

function defaultFromDate(): string {
  const now = new Date();
  const from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  return from.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum) return month;
  return new Date(year, monthNum - 1, 1).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
  });
}

function formatCurrencyAmounts(items: CurrencyAmount[]): string {
  if (items.length === 0) return "-";
  return items
    .map(
      (item) =>
        `${item.currency} ${item.amount.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    )
    .join(" · ");
}

function Kpi({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-fia-neutral-dark leading-none">
          {value.toLocaleString("es-AR")}
        </p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => defaultFromDate());
  const [to, setTo] = useState(() => defaultToDate());

  async function fetchAnalytics(fromValue: string, toValue: string) {
    setLoading(true);
    setError(null);

    try {
      const result = await getAnalytics({
        from: new Date(`${fromValue}T00:00:00`).toISOString(),
        to: new Date(`${toValue}T23:59:59`).toISOString(),
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Error al cargar analytics",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialFrom = defaultFromDate();
    const initialTo = defaultToDate();
    void fetchAnalytics(initialFrom, initialTo);
  }, []);

  const totals = useMemo(() => {
    if (!data) {
      return {
        classes: 0,
        taught: 0,
        charges: 0,
        pendingCharges: 0,
      };
    }

    const classes = data.classesByMonth.reduce((acc, item) => acc + item.total, 0);
    const taught = data.classesByMonth.reduce((acc, item) => acc + item.taught, 0);
    const charges = data.revenueByMonth.reduce((acc, item) => acc + item.chargesCount, 0);
    const pendingCharges = data.revenueByMonth.reduce((acc, item) => acc + item.pendingCount, 0);

    return { classes, taught, charges, pendingCharges };
  }, [data]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fia-neutral-dark">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tendencias históricas de clases y cobranza
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <label className="text-xs text-gray-500">
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
            />
          </label>
          <label className="text-xs text-gray-500">
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
            />
          </label>
          <button
            onClick={() => void fetchAnalytics(from, to)}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-fia-primary text-white text-sm font-semibold hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Cargando..." : "Aplicar"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {data && (
        <p className="text-xs text-gray-500">
          Periodo: {new Date(data.period.from).toLocaleDateString("es-AR")} - {" "}
          {new Date(data.period.to).toLocaleDateString("es-AR")}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          label="Clases totales"
          value={totals.classes}
          icon={CalendarDays}
          color="bg-blue-100 text-blue-600"
        />
        <Kpi
          label="Clases dictadas"
          value={totals.taught}
          icon={BookOpenCheck}
          color="bg-green-100 text-green-600"
        />
        <Kpi
          label="Cargos generados"
          value={totals.charges}
          icon={Receipt}
          color="bg-fia-secondary/20 text-fia-secondary"
        />
        <Kpi
          label="Cargos pendientes"
          value={totals.pendingCharges}
          icon={BarChart3}
          color="bg-yellow-100 text-yellow-700"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && (
        <div className="grid xl:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">Revenue por mes</h2>
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                  <th className="py-2 pr-2">Mes</th>
                  <th className="py-2 pr-2">Cargos</th>
                  <th className="py-2 pr-2">Pagados</th>
                  <th className="py-2 pr-2">Pendientes</th>
                  <th className="py-2 pr-2">Condonados</th>
                  <th className="py-2">Pack</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueByMonth.map((month) => (
                  <tr key={month.month} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2 text-gray-700">{formatMonth(month.month)}</td>
                    <td className="py-2 pr-2">{month.chargesCount}</td>
                    <td className="py-2 pr-2">{month.paidCount}</td>
                    <td className="py-2 pr-2">{month.pendingCount}</td>
                    <td className="py-2 pr-2">{month.waivedCount}</td>
                    <td className="py-2">{month.packCoveredCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">Clases por mes</h2>
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                  <th className="py-2 pr-2">Mes</th>
                  <th className="py-2 pr-2">Total</th>
                  <th className="py-2 pr-2">Dictadas</th>
                  <th className="py-2 pr-2">Ausentes</th>
                  <th className="py-2 pr-2">Canceladas</th>
                  <th className="py-2 pr-2">Reagendadas</th>
                  <th className="py-2">Programadas</th>
                </tr>
              </thead>
              <tbody>
                {data.classesByMonth.map((month) => (
                  <tr key={month.month} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2 text-gray-700">{formatMonth(month.month)}</td>
                    <td className="py-2 pr-2">{month.total}</td>
                    <td className="py-2 pr-2">{month.taught}</td>
                    <td className="py-2 pr-2">{month.absent}</td>
                    <td className="py-2 pr-2">{month.cancelled}</td>
                    <td className="py-2 pr-2">{month.rescheduled}</td>
                    <td className="py-2">{month.scheduled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
              Distribucion de estados financieros
            </h2>
            {data.chargeStatusBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos.</p>
            ) : (
              <ul className="space-y-3">
                {data.chargeStatusBreakdown.map((item) => (
                  <li key={item.financialStatus} className="text-sm">
                    <p className="font-medium text-gray-700">
                      {item.financialStatus} ({item.count})
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      {formatCurrencyAmounts(item.totalByCurrency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
              Breakdown por alumno
            </h2>
            {data.studentBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos.</p>
            ) : (
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                    <th className="py-2 pr-2">Alumno</th>
                    <th className="py-2 pr-2">Cargos</th>
                    <th className="py-2 pr-2">Pagados</th>
                    <th className="py-2 pr-2">Pendientes</th>
                    <th className="py-2">Pendiente por moneda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentBreakdown.slice(0, 10).map((student) => (
                    <tr key={student.studentId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-2 text-gray-700">{student.fullName}</td>
                      <td className="py-2 pr-2">{student.chargesCount}</td>
                      <td className="py-2 pr-2">{student.paidCount}</td>
                      <td className="py-2 pr-2">{student.pendingCount}</td>
                      <td className="py-2 text-gray-500">
                        {formatCurrencyAmounts(student.pendingByCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
