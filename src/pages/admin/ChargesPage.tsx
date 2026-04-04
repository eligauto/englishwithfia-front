import { useState, useEffect, useMemo, type ReactNode } from "react";
import { X, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  getCharges,
  getStudents,
  getPacks,
  updateChargeStatus,
  exportChargesCSV,
  ApiRequestError,
} from "../../services/api";
import type {
  Charge,
  Student,
  Pack,
  FinancialStatus,
  UpdateChargeStatusData,
  Currency,
  PaymentMethod,
} from "../../types";
import { cn } from "../../utils/cn";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<FinancialStatus, string> = {
  PENDING_PAYMENT: "Pendiente",
  PAID: "Pagado",
  DEFERRED: "Diferido",
  WAIVED: "Condonado",
  PACK_COVERED: "Pack",
  ABSENT_CHARGEABLE: "Ausente / cobra",
  ABSENT_NON_CHARGEABLE: "Ausente / no cobra",
};

const STATUS_COLORS: Record<FinancialStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  DEFERRED: "bg-orange-100 text-orange-700",
  WAIVED: "bg-gray-100 text-gray-500",
  PACK_COVERED: "bg-purple-100 text-purple-700",
  ABSENT_CHARGEABLE: "bg-red-100 text-red-700",
  ABSENT_NON_CHARGEABLE: "bg-gray-100 text-gray-400",
};

/** Estados terminales — no admiten más transiciones */
const TERMINAL: FinancialStatus[] = [
  "PAID",
  "WAIVED",
  "PACK_COVERED",
  "ABSENT_NON_CHARGEABLE",
];

/** Transiciones válidas por estado origen (BR07) */
const TRANSITIONS: Partial<Record<FinancialStatus, FinancialStatus[]>> = {
  PENDING_PAYMENT: ["PAID", "DEFERRED", "WAIVED", "PACK_COVERED"],
  DEFERRED: ["PAID", "WAIVED", "PACK_COVERED"],
  ABSENT_CHARGEABLE: ["PAID", "DEFERRED", "WAIVED"],
};

function StatusBadge({ status }: { status: FinancialStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
        STATUS_COLORS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── ChargesPage ───────────────────────────────────────────────────────────────

export function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allPacks, setAllPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterStatus, setFilterStatus] = useState<FinancialStatus | "">("");
  const [target, setTarget] = useState<Charge | null>(null);
  const [exporting, setExporting] = useState(false);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  );

  /** Packs activos con clases disponibles, agrupados por alumno */
  const packsMap = useMemo(() => {
    const map = new Map<string, Pack[]>();
    for (const p of allPacks) {
      if (!p.isActive || p.availableClasses <= 0) continue;
      const list = map.get(p.studentId) ?? [];
      list.push(p);
      map.set(p.studentId, list);
    }
    return map;
  }, [allPacks]);

  useEffect(() => {
    Promise.all([getCharges(), getStudents(), getPacks()])
      .then(([chg, sts, pkgs]) => {
        chg.sort(
          (a, b) =>
            new Date(b.generatedAt).getTime() -
            new Date(a.generatedAt).getTime(),
        );
        setCharges(chg);
        setStudents(sts);
        setAllPacks(pkgs);
      })
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar datos",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  function patchCharge(updated: Charge) {
    setCharges((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }

  const visible = charges
    .filter((c) => !filterStudentId || c.studentId === filterStudentId)
    .filter((c) => !filterStatus || c.financialStatus === filterStatus);

  // Deuda pendiente del subconjunto visible, agrupada por moneda
  const pendingByCurrency = visible
    .filter((c) =>
      (
        [
          "PENDING_PAYMENT",
          "DEFERRED",
          "ABSENT_CHARGEABLE",
        ] as FinancialStatus[]
      ).includes(c.financialStatus),
    )
    .reduce<Record<string, number>>((acc, c) => {
      acc[c.currency] = (acc[c.currency] ?? 0) + Number(c.amount);
      return acc;
    }, {});

  const pendingEntries = Object.entries(pendingByCurrency);

  async function handleExport() {
    setExporting(true);
    try {
      await exportChargesCSV({
        studentId: filterStudentId || undefined,
        financialStatus: filterStatus || undefined,
      });
    } catch (err) {
      alert(
        err instanceof ApiRequestError ? err.message : 'Error al exportar',
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fia-neutral-dark">Cargos</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
          {pendingEntries.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Deuda visible:</span>
              {pendingEntries.map(([cur, total]) => (
                <span key={cur} className="font-semibold text-red-500">
                  {cur}{" "}
                  {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStudentId}
          onChange={(e) => setFilterStudentId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
        >
          <option value="">Todos los alumnos</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as FinancialStatus | "")
          }
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as FinancialStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Estados de carga */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">
          {filterStudentId || filterStatus
            ? "No hay cargos que coincidan con los filtros."
            : "Todavía no hay cargos registrados."}
        </p>
      )}

      {/* Tabla */}
      {!loading && !error && visible.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Generado
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Promesa / Pago
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((charge) => {
                const isTerminal = TERMINAL.includes(charge.financialStatus);
                return (
                  <tr
                    key={charge.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-fia-neutral-dark">
                      {studentMap[charge.studentId] ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {fmtDate(charge.generatedAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {charge.currency} {Number(charge.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={charge.financialStatus} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {charge.financialStatus === "DEFERRED" &&
                      charge.promisedPaymentDate
                        ? fmtDate(charge.promisedPaymentDate)
                        : charge.paidAt
                          ? fmtDate(charge.paidAt)
                          : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {charge.paymentMethod
                        ? PAYMENT_METHOD_LABELS[charge.paymentMethod]
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isTerminal && (
                        <button
                          onClick={() => setTarget(charge)}
                          className="px-3 py-1.5 text-xs font-medium text-fia-primary border border-fia-primary rounded-lg hover:bg-fia-primary-light transition-colors"
                        >
                          Actualizar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal actualizar estado */}
      {target && (
        <UpdateChargeModal
          charge={target}
          studentName={studentMap[target.studentId] ?? ""}
          availablePacks={packsMap.get(target.studentId) ?? []}
          onClose={() => setTarget(null)}
          onUpdated={(updated) => {
            patchCharge(updated);
            setTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ── UpdateChargeModal ─────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  DIGITAL_WALLET: "Billetera digital",
  OTHER: "Otro",
};

interface UpdateFormData {
  financialStatus: FinancialStatus;
  notes: string;
  promisedPaymentDate: string;
  packId: string;
  paymentCurrency: Currency;
  paymentMethod: PaymentMethod | "";
}

function UpdateChargeModal({
  charge,
  studentName,
  availablePacks,
  onClose,
  onUpdated,
}: {
  charge: Charge;
  studentName: string;
  availablePacks: Pack[];
  onClose: () => void;
  onUpdated: (charge: Charge) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const transitions = TRANSITIONS[charge.financialStatus] ?? [];

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFormData>({
    defaultValues: {
      financialStatus: transitions[0],
      notes: "",
      promisedPaymentDate: "",
      packId: "",
      paymentCurrency: charge.currency,
      paymentMethod: "" as PaymentMethod | "",
    },
  });

  const selectedStatus = watch("financialStatus");

  async function onSubmit(data: UpdateFormData) {
    setSubmitError(null);
    try {
      const payload: UpdateChargeStatusData = {
        financialStatus: data.financialStatus,
      };
      if (data.notes.trim()) payload.notes = data.notes.trim();
      if (data.financialStatus === "DEFERRED" && data.promisedPaymentDate) {
        payload.promisedPaymentDate = new Date(
          data.promisedPaymentDate,
        ).toISOString();
      }
      if (data.financialStatus === "PACK_COVERED" && data.packId) {
        payload.packId = data.packId;
      }
      if (data.financialStatus === "PAID") {
        payload.paymentCurrency = data.paymentCurrency;
        if (data.paymentMethod) payload.paymentMethod = data.paymentMethod;
      }
      onUpdated(await updateChargeStatus(charge.id, payload));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al actualizar el cargo",
      );
    }
  }

  return (
    <ModalShell title={`Actualizar cargo — ${studentName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        {/* Info del cargo */}
        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
          <span>
            Monto:{" "}
            <span className="font-semibold text-gray-700">
              {charge.currency} {Number(charge.amount).toFixed(2)}
            </span>
          </span>
          <span>
            Estado actual:{" "}
            <span className="font-semibold text-gray-700">
              {STATUS_LABELS[charge.financialStatus]}
            </span>
          </span>
        </div>

        {/* Nuevo estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nuevo estado <span className="text-red-500">*</span>
          </label>
          <select
            {...register("financialStatus")}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
          >
            {transitions.map((t) => (
              <option key={t} value={t}>
                {STATUS_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* PACK_COVERED — selector de pack */}
        {selectedStatus === "PACK_COVERED" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pack <span className="text-red-500">*</span>
            </label>
            {availablePacks.length === 0 ? (
              <p className="text-xs text-red-500">
                El alumno no tiene packs activos con clases disponibles.
              </p>
            ) : (
              <select
                {...register("packId", {
                  required:
                    selectedStatus === "PACK_COVERED"
                      ? "Seleccioná un pack"
                      : false,
                })}
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white",
                  errors.packId ? "border-red-400" : "border-gray-200",
                )}
              >
                <option value="">Seleccionar pack…</option>
                {availablePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.availableClasses} clases disponibles — comprado{" "}
                    {fmtDate(p.purchasedAt)}
                  </option>
                ))}
              </select>
            )}
            {errors.packId && (
              <p className="mt-1 text-xs text-red-500">
                {errors.packId.message}
              </p>
            )}
          </div>
        )}

        {/* DEFERRED — fecha promesa */}
        {selectedStatus === "DEFERRED" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de promesa de pago
            </label>
            <input
              {...register("promisedPaymentDate")}
              type="date"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary"
            />
          </div>
        )}

        {/* PAID — moneda y método de pago */}
        {selectedStatus === "PAID" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda recibida
              </label>
              <select
                {...register("paymentCurrency")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
              >
                {(["ARS", "USD", "EUR", "UYU", "BRL", "GBP", "OTHER"] as Currency[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de pago
              </label>
              <select
                {...register("paymentMethod")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
              >
                <option value="">Sin especificar</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Notas (obligatorio para DEFERRED) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
            {selectedStatus === "DEFERRED" && (
              <span className="text-red-500"> *</span>
            )}
          </label>
          <textarea
            {...register("notes", {
              validate: (v) =>
                selectedStatus !== "DEFERRED" || v.trim().length > 0
                  ? true
                  : "Las notas son obligatorias para diferir un pago",
            })}
            rows={2}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary resize-none",
              errors.notes ? "border-red-400" : "border-gray-200",
            )}
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (selectedStatus === "PACK_COVERED" && availablePacks.length === 0)
            }
            className="flex-1 py-2.5 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── ModalShell ────────────────────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-fia-neutral-dark">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
