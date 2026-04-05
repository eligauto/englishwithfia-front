import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  getPacks,
  getStudents,
  createPack,
  deletePack,
  ApiRequestError,
} from "../../services/api";
import type { Pack, Student, CreatePackData, Currency } from "../../types";
import { cn } from "../../utils/cn";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── PacksPage ─────────────────────────────────────────────────────────────────

export function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showCreate, setShowCreate] = useState(false);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  );

  useEffect(() => {
    Promise.all([getPacks(), getStudents()])
      .then(([pkgs, sts]) => {
        pkgs.sort(
          (a, b) =>
            new Date(b.purchasedAt).getTime() -
            new Date(a.purchasedAt).getTime(),
        );
        setPacks(pkgs);
        setStudents(sts.filter((s) => s.isActive));
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

  async function handleDelete(pack: Pack) {
    if (
      !confirm(
        `¿Eliminar el pack de ${studentMap[pack.studentId] ?? "este alumno"}? Esta acción no puede deshacerse.`,
      )
    )
      return;
    try {
      await deletePack(pack.id);
      setPacks((prev) => prev.filter((p) => p.id !== pack.id));
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.message
          : "Error al eliminar el pack",
      );
    }
  }

  const visible = packs
    .filter((p) => !filterStudentId || p.studentId === filterStudentId)
    .filter((p) => {
      if (filterActive === "active") return p.isActive;
      if (filterActive === "inactive") return !p.isActive;
      return true;
    });

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-app-neutral-dark">
          Packs prepagos
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors"
        >
          <Plus size={16} />
          Nuevo pack
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStudentId}
          onChange={(e) => setFilterStudentId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
        >
          <option value="">Todos los alumnos</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>

        <select
          value={filterActive}
          onChange={(e) =>
            setFilterActive(e.target.value as "all" | "active" | "inactive")
          }
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Agotados / vencidos</option>
        </select>
      </div>

      {/* Estados de carga */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">
          {filterStudentId || filterActive !== "all"
            ? "No hay packs que coincidan con los filtros."
            : "Todavía no hay packs. ¡Creá el primero!"}
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
                  Clases
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Disponibles
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Monto pagado
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Comprado
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Vence
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((pack) => (
                <tr
                  key={pack.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-app-neutral-dark">
                    {studentMap[pack.studentId] ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pack.usedClasses} / {pack.totalClasses}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "font-semibold",
                        pack.availableClasses > 0
                          ? "text-green-600"
                          : "text-gray-400",
                      )}
                    >
                      {pack.availableClasses}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pack.currency} {Number(pack.amountPaid).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {fmtDate(pack.purchasedAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {fmtDate(pack.expiresAt)}
                  </td>
                  <td className="px-6 py-4">
                    {pack.isActive ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Agotado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => void handleDelete(pack)}
                      title="Eliminar pack"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo pack */}
      {showCreate && (
        <CreatePackModal
          students={students}
          onClose={() => setShowCreate(false)}
          onCreated={(pack) => {
            setPacks((prev) =>
              [pack, ...prev].sort(
                (a, b) =>
                  new Date(b.purchasedAt).getTime() -
                  new Date(a.purchasedAt).getTime(),
              ),
            );
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// ── CreatePackModal ───────────────────────────────────────────────────────────

interface CreatePackFormData {
  studentId: string;
  totalClasses: number;
  amountPaid: number;
  currency: Currency;
  expiresAt: string;
  notes: string;
}

function CreatePackModal({
  students,
  onClose,
  onCreated,
}: {
  students: Student[];
  onClose: () => void;
  onCreated: (pack: Pack) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePackFormData>({
    defaultValues: {
      studentId: "",
      totalClasses: 4,
      amountPaid: "" as unknown as number,
      currency: "ARS",
      expiresAt: "",
      notes: "",
    },
  });

  const totalClasses = watch("totalClasses");
  const amountPaid = watch("amountPaid");
  const studentId = watch("studentId");

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );

  // Auto-calcular monto al cambiar alumno o cantidad de clases
  useEffect(() => {
    if (!selectedStudent) return;
    const rate = Number(selectedStudent.classRate);
    if (rate > 0 && totalClasses > 0) {
      setValue("amountPaid", rate * totalClasses, { shouldValidate: true });
    }
    // Heredar moneda del alumno
    setValue("currency", selectedStudent.currency);
  }, [selectedStudent, totalClasses, setValue]);

  const pricePerClass = selectedStudent
    ? Number(selectedStudent.classRate)
    : totalClasses > 0 && amountPaid > 0
      ? amountPaid / totalClasses
      : null;

  async function onSubmit(data: CreatePackFormData) {
    setSubmitError(null);
    try {
      const payload: CreatePackData = {
        studentId: data.studentId,
        totalClasses: data.totalClasses,
        amountPaid: data.amountPaid,
        currency: data.currency,
        ...(data.expiresAt
          ? { expiresAt: new Date(data.expiresAt).toISOString() }
          : {}),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
      };
      onCreated(await createPack(payload));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError ? err.message : "Error al crear el pack",
      );
    }
  }

  return (
    <ModalShell title="Nuevo pack prepago" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        {/* Alumno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alumno <span className="text-red-500">*</span>
          </label>
          <select
            {...register("studentId", { required: "El alumno es obligatorio" })}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary bg-white",
              errors.studentId ? "border-red-400" : "border-gray-200",
            )}
          >
            <option value="">Seleccionar alumno…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
          {errors.studentId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.studentId.message}
            </p>
          )}
        </div>

        {/* Cantidad de clases + moneda + monto */}
        <div className="grid grid-cols-3 gap-3" style={{ alignItems: "start" }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clases <span className="text-red-500">*</span>
            </label>
            <input
              {...register("totalClasses", {
                valueAsNumber: true,
                validate: {
                  required: (v) => !isNaN(v) || "Obligatorio",
                  positive: (v) => v > 0 || "Debe ser mayor a 0",
                },
              })}
              type="number"
              min="1"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary",
                errors.totalClasses ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.totalClasses && (
              <p className="mt-1 text-xs text-red-500">
                {errors.totalClasses.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              {...register("currency")}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
            >
              {(
                [
                  "ARS",
                  "USD",
                  "EUR",
                  "UYU",
                  "BRL",
                  "GBP",
                  "OTHER",
                ] as Currency[]
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto pagado <span className="text-red-500">*</span>
            </label>
            <input
              {...register("amountPaid", {
                valueAsNumber: true,
                validate: {
                  required: (v) => !isNaN(v) || "Obligatorio",
                  positive: (v) => v > 0 || "Debe ser mayor a 0",
                },
              })}
              type="number"
              step="0.01"
              min="0"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary",
                errors.amountPaid ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.amountPaid && (
              <p className="mt-1 text-xs text-red-500">
                {errors.amountPaid.message}
              </p>
            )}
          </div>
        </div>

        {/* Hint precio por clase */}
        {pricePerClass !== null && (
          <p className="text-xs text-app-primary font-medium -mt-1">
            {selectedStudent
              ? `Tarifa del alumno: ${selectedStudent.currency} ${pricePerClass.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / clase — monto calculado automáticamente`
              : `Precio por clase: ${pricePerClass.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        )}

        {/* Vencimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vencimiento
          </label>
          <input
            {...register("expiresAt")}
            type="date"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary resize-none"
          />
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
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Guardando…" : "Crear pack"}
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
          <h2 className="text-base font-semibold text-app-neutral-dark">
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
