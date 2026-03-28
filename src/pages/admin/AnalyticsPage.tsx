import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpenCheck, CalendarDays, Receipt } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const PIE_COLORS = [
  "#556B4A",
  "#C4A87A",
  "#9ca3af",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
];

const CHARGE_SERIES = [
  { key: "Pagados", color: "#556B4A" },
  { key: "Pendientes", color: "#C4A87A" },
  { key: "Condonados", color: "#9ca3af" },
  { key: "Pack", color: "#3b82f6" },
] as const;

const CLASS_SERIES = [
  { key: "Dictadas", color: "#556B4A" },
  { key: "Ausentes", color: "#C4A87A" },
  { key: "Canceladas", color: "#ef4444" },
  { key: "Reagendadas", color: "#3b82f6" },
  { key: "Programadas", color: "#d1d5db" },
] as const;

function ChartLegend({
  series,
}: {
  series: readonly { key: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 justify-center">
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: s.color }}
          />
          {s.key}
        </div>
      ))}
    </div>
  );
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  fill: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (nonZero.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[120px]">
      <p className="font-semibold text-gray-500 mb-2">{label}</p>
      {nonZero.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-gray-700">
            {p.dataKey}:{" "}
            <span className="font-semibold">{p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
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
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
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
        err instanceof ApiRequestError
          ? err.message
          : "Error al cargar analytics",
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

    const classes = data.classesByMonth.reduce(
      (acc, item) => acc + item.total,
      0,
    );
    const taught = data.classesByMonth.reduce(
      (acc, item) => acc + item.taught,
      0,
    );
    const charges = data.revenueByMonth.reduce(
      (acc, item) => acc + item.chargesCount,
      0,
    );
    const pendingCharges = data.revenueByMonth.reduce(
      (acc, item) => acc + item.pendingCount,
      0,
    );

    return { classes, taught, charges, pendingCharges };
  }, [data]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fia-neutral-dark">
            Analytics
          </h1>
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
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      {data && (
        <p className="text-xs text-gray-500">
          Periodo: {new Date(data.period.from).toLocaleDateString("es-AR")} -{" "}
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
        <div className="space-y-6">
          {/* Row 1: bar charts */}
          <div className="grid xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
                Cargos por mes
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data.revenueByMonth.map((m) => ({
                    month: formatMonth(m.month),
                    Pagados: m.paidCount,
                    Pendientes: m.pendingCount,
                    Condonados: m.waivedCount,
                    Pack: m.packCoveredCount,
                  }))}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  maxBarSize={48}
                  barCategoryGap="40%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="Pagados" stackId="a" fill="#556B4A" />
                  <Bar dataKey="Pendientes" stackId="a" fill="#C4A87A" />
                  <Bar dataKey="Condonados" stackId="a" fill="#9ca3af" />
                  <Bar dataKey="Pack" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend series={CHARGE_SERIES} />
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
                Clases por mes
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data.classesByMonth.map((m) => ({
                    month: formatMonth(m.month),
                    Dictadas: m.taught,
                    Ausentes: m.absent,
                    Canceladas: m.cancelled,
                    Reagendadas: m.rescheduled,
                    Programadas: m.scheduled,
                  }))}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  maxBarSize={48}
                  barCategoryGap="40%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="Dictadas" stackId="b" fill="#556B4A" />
                  <Bar dataKey="Ausentes" stackId="b" fill="#C4A87A" />
                  <Bar dataKey="Canceladas" stackId="b" fill="#ef4444" />
                  <Bar dataKey="Reagendadas" stackId="b" fill="#3b82f6" />
                  <Bar dataKey="Programadas" stackId="b" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend series={CLASS_SERIES} />
            </section>
          </div>

          {/* Row 2: pie chart + student table */}
          <div className="grid xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
                Distribución de estados financieros
              </h2>
              {data.chargeStatusBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={data.chargeStatusBreakdown.map((item) => ({
                          name: item.financialStatus,
                          value: item.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.chargeStatusBreakdown.map((item, idx) => (
                          <Cell
                            key={item.financialStatus}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value ?? 0} cargos`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="space-y-3 flex-1">
                    {data.chargeStatusBreakdown.map((item, idx) => (
                      <li
                        key={item.financialStatus}
                        className="text-sm flex items-start gap-2"
                      >
                        <span
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                          style={{
                            background: PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-700">
                            {item.financialStatus}{" "}
                            <span className="font-normal text-gray-400">
                              ({item.count})
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatCurrencyAmounts(item.totalByCurrency)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
              <h2 className="text-sm font-semibold text-fia-neutral-dark mb-4">
                Breakdown por alumno
              </h2>
              {data.studentBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos.</p>
              ) : (
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                      <th className="py-2 pr-3">Alumno</th>
                      <th className="py-2 pr-3 text-right">Cargos</th>
                      <th className="py-2 pr-3 text-right">Pagados</th>
                      <th className="py-2 text-right">Pendientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.studentBreakdown.slice(0, 10).map((student) => (
                      <tr
                        key={student.studentId}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 pr-3 text-gray-700">
                          {student.fullName}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {student.chargesCount}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {student.paidCount}
                        </td>
                        <td className="py-2 text-right">
                          {student.pendingCount > 0 ? (
                            <span className="text-amber-600 font-medium">
                              {student.pendingCount}
                              {student.pendingByCurrency.length > 0 && (
                                <span className="font-normal text-xs ml-1 text-gray-400">
                                  (
                                  {formatCurrencyAmounts(
                                    student.pendingByCurrency,
                                  )}
                                  )
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
