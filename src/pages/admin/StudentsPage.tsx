import { useState, useEffect } from "react";
import { Plus, Pencil, UserX, Search, X, Link, Trash2, Video } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  generatePortalToken,
  revokePortalToken,
  ApiRequestError,
} from "../../services/api";
import type {
  Student,
  CreateStudentData,
  ClassModality,
  Currency,
} from "../../types";
import { ROUTES } from "../../constants/routes";
import { cn } from "../../utils/cn";

// ── Tipos del formulario ──────────────────────────────────────────────────────

interface StudentFormData {
  fullName: string;
  email: string;
  phone: string;
  classRate: number;
  currency: Currency;
  modality: ClassModality;
  meetingLink: string;
}

function toPayload(data: StudentFormData): CreateStudentData {
  return {
    fullName: data.fullName.trim(),
    classRate: data.classRate,
    currency: data.currency,
    modality: data.modality,
    ...(data.email.trim() ? { email: data.email.trim() } : {}),
    ...(data.phone.trim() ? { phone: data.phone.trim() } : {}),
    ...(data.meetingLink.trim()
      ? { meetingLink: data.meetingLink.trim() }
      : {}),
  };
}

// ── StudentsPage ──────────────────────────────────────────────────────────────

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalStudent, setModalStudent] = useState<Student | null | undefined>(
    undefined,
  );
  // undefined = modal cerrado, null = modal abierto para crear, Student = editar
  const [portalTarget, setPortalTarget] = useState<Student | null>(null);

  useEffect(() => {
    getStudents()
      .then(setStudents)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar alumnos",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(saved: Student) {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setModalStudent(undefined);
  }

  async function handleDeactivate(student: Student) {
    if (
      !confirm(
        `¿Dar de baja a ${student.fullName}? Se puede reactivar más adelante.`,
      )
    )
      return;
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.message
          : "Error al dar de baja al alumno",
      );
    }
  }

  const visible = students
    .filter((s) => s.isActive)
    .filter(
      (s) =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-app-neutral-dark tracking-tight">Alumnos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de tus alumnos</p>
        </div>
        <button
          onClick={() => setModalStudent(null)}
          className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white text-sm font-semibold rounded-lg hover:bg-app-primary-dark transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={15} />
          Nuevo alumno
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-5 max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-app-primary/40 focus:border-app-primary transition-colors"
        />
      </div>

      {/* Estado: cargando */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] border-app-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      {/* Estado: vacío */}
      {!loading && !error && visible.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-400">
            {search
              ? "No hay alumnos que coincidan con la búsqueda."
              : "Todavía no hay alumnos. ¡Creá el primero!"}
          </p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && visible.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Tarifa
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-app-primary-light/20 transition-colors"
                >
                  <td className="px-6 py-3.5 font-semibold text-app-neutral-dark text-[13px]">
                    {student.fullName}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 text-[13px]">
                    {student.email ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 text-[13px]">
                    {student.phone ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700 text-[13px] tabular-nums">
                    {student.currency} {Number(student.classRate).toFixed(2)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {student.meetingLink && (
                        <a
                          href={student.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-md transition-colors cursor-pointer"
                          aria-label="Unirse a la clase"
                          title="Unirse a la clase"
                        >
                          <Video size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => setPortalTarget(student)}
                        className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                        aria-label="Portal del alumno"
                        title="Portal del alumno"
                      >
                        <Link size={14} />
                      </button>
                      <button
                        onClick={() => setModalStudent(student)}
                        className="p-1.5 text-gray-400 hover:text-app-primary hover:bg-app-primary-light rounded-md transition-colors cursor-pointer"
                        aria-label="Editar alumno"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(student)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        aria-label="Dar de baja"
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      {modalStudent !== undefined && (
        <StudentModal
          student={modalStudent}
          onClose={() => setModalStudent(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal portal del alumno */}
      {portalTarget && (
        <PortalModal
          student={portalTarget}
          onClose={() => setPortalTarget(null)}
        />
      )}
    </div>
  );
}

// ── PortalModal ───────────────────────────────────────────────────────────────

function PortalModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portalUrl = token
    ? `${window.location.origin}${ROUTES.PORTAL}?token=${token}`
    : null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { portalToken } = await generatePortalToken(student.id);
      setToken(portalToken);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al generar el token",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (
      !confirm(
        "¿Revocar el acceso al portal? El link actual dejará de funcionar.",
      )
    )
      return;
    setRevoking(true);
    setError(null);
    try {
      await revokePortalToken(student.id);
      setToken(null);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al revocar el token",
      );
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-app-neutral-dark">
            Portal — {student.fullName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Generá un link de acceso para que{" "}
                <span className="font-medium">{student.fullName}</span> pueda
                ver sus clases, cargos y packs sin necesitar una cuenta.
              </p>
              <button
                onClick={() => void handleGenerate()}
                disabled={loading}
                className="w-full py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
              >
                {loading ? "Generando…" : "Generar link de acceso"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Compartí este link con el alumno. Cualquiera que lo tenga puede
                ver su información.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={portalUrl ?? ""}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-600 truncate"
                />
                <button
                  onClick={() => void handleCopy()}
                  className="px-3 py-2 bg-app-primary text-white text-xs font-semibold rounded-xl hover:bg-app-primary-dark transition-colors"
                >
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <button
                onClick={() => void handleRevoke()}
                disabled={revoking}
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-60"
              >
                <Trash2 size={13} />
                {revoking ? "Revocando…" : "Revocar acceso"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StudentModal ──────────────────────────────────────────────────────────────

interface StudentModalProps {
  student: Student | null; // null = crear, Student = editar
  onClose: () => void;
  onSaved: (student: Student) => void;
}

function StudentModal({ student, onClose, onSaved }: StudentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    defaultValues: {
      fullName: student?.fullName ?? "",
      email: student?.email ?? "",
      phone: student?.phone ?? "",
      classRate: student
        ? Number(student.classRate)
        : ("" as unknown as number),
      currency: student?.currency ?? "ARS",
      modality: student?.modality ?? "ONLINE",
      meetingLink: student?.meetingLink ?? "",
    },
  });

  async function onSubmit(data: StudentFormData) {
    setSubmitError(null);
    try {
      const payload = toPayload(data);
      const saved = student
        ? await updateStudent(student.id, payload)
        : await createStudent(payload);
      onSaved(saved);
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al guardar el alumno",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-app-neutral-dark">
            {student ? "Editar alumno" : "Nuevo alumno"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {submitError}
            </p>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...register("fullName", {
                required: "El nombre es obligatorio",
              })}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.fullName ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email", {
                validate: (v) =>
                  !v.trim() || /^\S+@\S+\.\S+$/.test(v) || "Email inválido",
              })}
              type="email"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.email ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition"
            />
          </div>

          {/* Tarifa + Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarifa por clase <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                {...register("currency")}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary bg-white w-24 shrink-0"
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
              <input
                {...register("classRate", {
                  valueAsNumber: true,
                  validate: {
                    required: (v) => !isNaN(v) || "La tarifa es obligatoria",
                    positive: (v) => v > 0 || "La tarifa debe ser mayor a 0",
                  },
                })}
                type="number"
                step="0.01"
                min="0"
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                  errors.classRate ? "border-red-400" : "border-gray-200",
                )}
              />
            </div>
            {errors.classRate && (
              <p className="mt-1 text-xs text-red-500">
                {errors.classRate.message}
              </p>
            )}
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              {...register("modality", {
                required: "La modalidad es obligatoria",
              })}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition bg-white",
                errors.modality ? "border-red-400" : "border-gray-200",
              )}
            >
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">Presencial</option>
            </select>
            {errors.modality && (
              <p className="mt-1 text-xs text-red-500">
                {errors.modality.message}
              </p>
            )}
          </div>

          {/* Link de videollamada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link de videollamada
            </label>
            <input
              {...register("meetingLink", {
                validate: (v) =>
                  !v.trim() ||
                  /^https?:\/\/.+/.test(v.trim()) ||
                  "Debe ser una URL válida (https://…)",
              })}
              type="url"
              placeholder="https://meet.google.com/…"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.meetingLink ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.meetingLink && (
              <p className="mt-1 text-xs text-red-500">
                {errors.meetingLink.message}
              </p>
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
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
