import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Plus,
  Check,
  UserX,
  Ban,
  CalendarClock,
  CircleDollarSign,
  X,
  Download,
  Users,
  Trash2,
  Video,
  Copy,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  getClasses,
  getStudents,
  createClass,
  updateClassStatus,
  rescheduleClass,
  absentDecision,
  exportClassesCSV,
  getClassParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant,
  replicateWeek,
  ApiRequestError,
} from "../../services/api";
import type {
  Class,
  Student,
  ClassType,
  ClassStatus,
  ClassParticipant,
  CreateClassData,
  RescheduleClassData,
  ReplicateWeekPreviewItem,
} from "../../types";
import { cn } from "../../utils/cn";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ClassStatus, string> = {
  SCHEDULED: "Programada",
  TAUGHT: "Dictada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
  ABSENT: "Ausente",
};

const STATUS_COLORS: Record<ClassStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  TAUGHT: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  RESCHEDULED: "bg-orange-100 text-orange-700",
  ABSENT: "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ status }: { status: ClassStatus }) {
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── ClassesPage ───────────────────────────────────────────────────────────────

export function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClassStatus | "">("");
  const [exporting, setExporting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showReplicate, setShowReplicate] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Class | null>(null);
  const [absentTarget, setAbsentTarget] = useState<Class | null>(null);
  const [participantsTarget, setParticipantsTarget] = useState<Class | null>(
    null,
  );

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  );

  const loading = loadingClasses || loadingStudents;

  useEffect(() => {
    getStudents()
      .then((sts) => {
        setStudents(sts.filter((s) => s.isActive));
      })
      .catch((err) => {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar alumnos",
        );
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  function patchClass(updated: Class) {
    setClasses((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }

  const fetchFilteredClasses = useCallback(async () => {
    try {
      const cls = await getClasses({
        studentId: filterStudentId || undefined,
        status: filterStatus || undefined,
      });
      setClasses(cls);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Error al cargar clases",
      );
    } finally {
      setLoadingClasses(false);
    }
  }, [filterStudentId, filterStatus]);

  useEffect(() => {
    setLoadingClasses(true);
    void fetchFilteredClasses();
  }, [fetchFilteredClasses]);

  async function handleMarkTaught(cls: Class) {
    if (
      !confirm(
        "¿Marcar esta clase como dictada? Se generará un cargo automáticamente.",
      )
    )
      return;
    try {
      patchClass(await updateClassStatus(cls.id, "TAUGHT"));
      void fetchFilteredClasses();
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.message
          : "Error al actualizar la clase",
      );
    }
  }

  async function handleMarkAbsent(cls: Class) {
    try {
      const updated = await updateClassStatus(cls.id, "ABSENT");
      patchClass(updated);
      setAbsentTarget(updated);
      void fetchFilteredClasses();
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.message
          : "Error al marcar ausente",
      );
    }
  }

  async function handleCancel(cls: Class) {
    if (!confirm("¿Cancelar esta clase? La acción no puede deshacerse."))
      return;
    try {
      patchClass(await updateClassStatus(cls.id, "CANCELLED"));
      void fetchFilteredClasses();
    } catch (err) {
      alert(
        err instanceof ApiRequestError
          ? err.message
          : "Error al cancelar la clase",
      );
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportClassesCSV({
        studentId: filterStudentId || undefined,
        status: filterStatus || undefined,
      });
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  }

  const visible = classes;

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-app-neutral-dark">Clases</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? "Exportando…" : "Exportar CSV"}
          </button>
          <button
            onClick={() => setShowReplicate(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Copy size={15} />
            Replicar semana
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors"
          >
            <Plus size={16} />
            Nueva clase
          </button>
        </div>
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ClassStatus | "")}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as ClassStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
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
          {filterStudentId || filterStatus
            ? "No hay clases que coincidan con los filtros."
            : "Todavía no hay clases. ¡Agendá la primera!"}
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
                  Fecha
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Hora
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Duración
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tarifa
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((cls) => (
                <tr
                  key={cls.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-app-neutral-dark">
                    {cls.classType === "GROUP" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Grupal
                        </span>
                      </span>
                    ) : (
                      (studentMap[cls.studentId ?? ""] ?? "—")
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {fmtDate(cls.scheduledAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {fmtTime(cls.scheduledAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {cls.duration} min
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={cls.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {cls.appliedRate
                      ? `$${Number(cls.appliedRate).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {cls.student?.meetingLink && (
                        <a
                          href={cls.student.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                          aria-label="Unirse a la clase"
                          title="Unirse a la clase"
                        >
                          <Video size={15} />
                        </a>
                      )}
                      <ClassActions
                        cls={cls}
                        onMarkTaught={handleMarkTaught}
                        onMarkAbsent={handleMarkAbsent}
                        onCancel={handleCancel}
                        onReschedule={setRescheduleTarget}
                        onAbsentDecision={setAbsentTarget}
                        onManageParticipants={setParticipantsTarget}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {showCreate && (
        <CreateClassModal
          students={students}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void fetchFilteredClasses();
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          cls={rescheduleTarget}
          studentName={studentMap[rescheduleTarget.studentId ?? ""] ?? ""}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={(updated) => {
            patchClass(updated);
            setRescheduleTarget(null);
            void fetchFilteredClasses(); // trae la clase nueva generada por el backend
          }}
        />
      )}

      {absentTarget && (
        <AbsentDecisionModal
          cls={absentTarget}
          studentName={
            absentTarget.studentId
              ? (studentMap[absentTarget.studentId] ?? "")
              : ""
          }
          onClose={() => setAbsentTarget(null)}
          onDecided={(updated) => {
            patchClass(updated);
            setAbsentTarget(null);
            void fetchFilteredClasses();
          }}
        />
      )}

      {participantsTarget && (
        <ParticipantsModal
          cls={participantsTarget}
          students={students}
          onClose={() => setParticipantsTarget(null)}
        />
      )}

      {showReplicate && (
        <ReplicateWeekModal
          onClose={() => setShowReplicate(false)}
          onConfirmed={() => {
            setShowReplicate(false);
            void fetchFilteredClasses();
          }}
        />
      )}
    </div>
  );
}

// ── ClassActions ──────────────────────────────────────────────────────────────

interface ClassActionsProps {
  cls: Class;
  onMarkTaught: (cls: Class) => void;
  onMarkAbsent: (cls: Class) => void;
  onCancel: (cls: Class) => void;
  onReschedule: (cls: Class) => void;
  onAbsentDecision: (cls: Class) => void;
  onManageParticipants: (cls: Class) => void;
}

function ClassActions({
  cls,
  onMarkTaught,
  onMarkAbsent,
  onCancel,
  onReschedule,
  onAbsentDecision,
  onManageParticipants,
}: ClassActionsProps) {
  if (cls.status === "SCHEDULED") {
    return (
      <div className="flex items-center justify-end gap-1">
        {cls.classType === "GROUP" && (
          <button
            onClick={() => onManageParticipants(cls)}
            title="Gestionar participantes"
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Users size={15} />
          </button>
        )}
        <button
          onClick={() => onMarkTaught(cls)}
          title="Marcar como dictada"
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => onMarkAbsent(cls)}
          title="Marcar ausente"
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
        >
          <UserX size={15} />
        </button>
        <button
          onClick={() => onReschedule(cls)}
          title="Reagendar"
          className="p-1.5 text-gray-400 hover:text-app-primary hover:bg-app-primary-light rounded-lg transition-colors"
        >
          <CalendarClock size={15} />
        </button>
        <button
          onClick={() => onCancel(cls)}
          title="Cancelar clase"
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Ban size={15} />
        </button>
      </div>
    );
  }

  // ABSENT sin decisión tomada todavía
  if (cls.status === "ABSENT" && !cls.chargeGenerated) {
    return (
      <div className="flex items-center justify-end">
        <button
          onClick={() => onAbsentDecision(cls)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
        >
          <CircleDollarSign size={13} />
          Resolver cargo
        </button>
      </div>
    );
  }

  return null;
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

function ModalActions({
  onClose,
  isSubmitting,
  submitLabel,
}: {
  onClose: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
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
        {isSubmitting ? "Guardando…" : submitLabel}
      </button>
    </div>
  );
}

// ── CreateClassModal ──────────────────────────────────────────────────────────

interface CreateClassFormData {
  classType: ClassType;
  studentId: string;
  scheduledAt: string;
  duration: number;
  notes: string;
}

function CreateClassModal({
  students,
  onClose,
  onCreated,
}: {
  students: Student[];
  onClose: () => void;
  onCreated: (cls: Class) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [addParticipantId, setAddParticipantId] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormData>({
    defaultValues: {
      classType: "INDIVIDUAL",
      studentId: "",
      scheduledAt: "",
      duration: 60,
      notes: "",
    },
  });

  const classType = watch("classType");

  const studentNameMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  );
  const availableToAdd = students.filter(
    (s) => !groupParticipants.includes(s.id),
  );

  function handleAddGroupParticipant() {
    if (!addParticipantId) return;
    setGroupParticipants((prev) => [...prev, addParticipantId]);
    setAddParticipantId("");
  }

  async function onSubmit(data: CreateClassFormData) {
    setSubmitError(null);
    if (data.classType === "GROUP" && groupParticipants.length === 0) {
      setSubmitError(
        "Debés agregar al menos un participante para una clase grupal.",
      );
      return;
    }
    try {
      const payload: CreateClassData = {
        classType: data.classType,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        duration: data.duration,
        ...(data.classType === "INDIVIDUAL"
          ? { studentId: data.studentId }
          : {
              participants: groupParticipants.map((id) => ({ studentId: id })),
            }),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
      };
      onCreated(await createClass(payload));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al crear la clase",
      );
    }
  }

  return (
    <ModalShell title="Nueva clase" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        {/* Tipo de clase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de clase
          </label>
          <div className="flex gap-3">
            {(["INDIVIDUAL", "GROUP"] as ClassType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("classType")}
                  type="radio"
                  value={t}
                  className="accent-app-primary"
                />
                <span className="text-sm text-gray-700">
                  {t === "INDIVIDUAL" ? "Individual" : "Grupal"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Alumno — solo INDIVIDUAL */}
        {classType === "INDIVIDUAL" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alumno <span className="text-red-500">*</span>
            </label>
            <select
              {...register("studentId", {
                validate: (v) =>
                  classType !== "INDIVIDUAL" ||
                  !!v ||
                  "El alumno es obligatorio",
              })}
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
        )}

        {classType === "GROUP" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Participantes <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={addParticipantId}
                onChange={(e) => setAddParticipantId(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
              >
                <option value="">Agregar alumno…</option>
                {availableToAdd.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddGroupParticipant}
                disabled={!addParticipantId}
                className="px-3 py-2 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
              >
                <Plus size={16} />
              </button>
            </div>
            {groupParticipants.length === 0 ? (
              <p className="text-xs text-gray-400">
                Agregá al menos un alumno.
              </p>
            ) : (
              <ul className="space-y-1">
                {groupParticipants.map((id) => (
                  <li
                    key={id}
                    className="flex items-center justify-between px-3 py-1.5 bg-purple-50 rounded-lg"
                  >
                    <span className="text-sm text-purple-800">
                      {studentNameMap[id]}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupParticipants((prev) =>
                          prev.filter((p) => p !== id),
                        )
                      }
                      className="text-purple-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Fecha y hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            {...register("scheduledAt", {
              required: "La fecha es obligatoria",
            })}
            type="datetime-local"
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary",
              errors.scheduledAt ? "border-red-400" : "border-gray-200",
            )}
          />
          {errors.scheduledAt && (
            <p className="mt-1 text-xs text-red-500">
              {errors.scheduledAt.message}
            </p>
          )}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (minutos) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("duration", {
              valueAsNumber: true,
              validate: {
                required: (v) => !isNaN(v) || "La duración es obligatoria",
                positive: (v) => v > 0 || "Debe ser mayor a 0",
              },
            })}
            type="number"
            min="15"
            step="15"
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary",
              errors.duration ? "border-red-400" : "border-gray-200",
            )}
          />
          {errors.duration && (
            <p className="mt-1 text-xs text-red-500">
              {errors.duration.message}
            </p>
          )}
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

        <ModalActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Crear clase"
        />
      </form>
    </ModalShell>
  );
}

// ── RescheduleModal ───────────────────────────────────────────────────────────

interface RescheduleFormData {
  scheduledAt: string;
  notes: string;
}

function RescheduleModal({
  cls,
  studentName,
  onClose,
  onRescheduled,
}: {
  cls: Class;
  studentName: string;
  onClose: () => void;
  onRescheduled: (updated: Class) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleFormData>({
    defaultValues: { scheduledAt: "", notes: "" },
  });

  async function onSubmit(data: RescheduleFormData) {
    setSubmitError(null);
    try {
      const payload: RescheduleClassData = {
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
      };
      onRescheduled(await rescheduleClass(cls.id, payload));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError ? err.message : "Error al reagendar",
      );
    }
  }

  return (
    <ModalShell title={`Reagendar — ${studentName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        <p className="text-xs text-gray-500">
          Clase original:{" "}
          <span className="font-medium">
            {fmtDate(cls.scheduledAt)} {fmtTime(cls.scheduledAt)}
          </span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            {...register("scheduledAt", {
              required: "La fecha es obligatoria",
            })}
            type="datetime-local"
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary",
              errors.scheduledAt ? "border-red-400" : "border-gray-200",
            )}
          />
          {errors.scheduledAt && (
            <p className="mt-1 text-xs text-red-500">
              {errors.scheduledAt.message}
            </p>
          )}
        </div>

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

        <ModalActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Reagendar"
        />
      </form>
    </ModalShell>
  );
}

// ── ParticipantsModal ─────────────────────────────────────────────────────────

function ParticipantsModal({
  cls,
  students,
  onClose,
}: {
  cls: Class;
  students: Student[];
  onClose: () => void;
}) {
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addStudentId, setAddStudentId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canEditAttendance = cls.status === "SCHEDULED";

  useEffect(() => {
    getClassParticipants(cls.id)
      .then(setParticipants)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar participantes",
        ),
      )
      .finally(() => setLoading(false));
  }, [cls.id]);

  const participantIds = useMemo(
    () => new Set(participants.map((p) => p.studentId)),
    [participants],
  );

  const availableStudents = students.filter((s) => !participantIds.has(s.id));

  async function handleAdd() {
    if (!addStudentId) return;
    setAdding(true);
    setError(null);
    try {
      // Re-fetch the full list so we get the populated `student` relation
      await addParticipant(cls.id, { studentId: addStudentId });
      const updated = await getClassParticipants(cls.id);
      setParticipants(updated);
      setAddStudentId("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al agregar participante",
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(studentId: string) {
    setRemovingId(studentId);
    setError(null);
    try {
      await removeParticipant(cls.id, studentId);
      setParticipants((prev) => prev.filter((p) => p.studentId !== studentId));
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al quitar participante",
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleToggleAttendance(
    studentId: string,
    next: "PRESENT" | "ABSENT",
  ) {
    setTogglingId(studentId);
    setError(null);
    try {
      const updated = await updateParticipant(cls.id, studentId, {
        attendance: next,
      });
      setParticipants((prev) =>
        prev.map((p) => (p.studentId === studentId ? { ...p, ...updated } : p)),
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al actualizar asistencia",
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <ModalShell
      title={`Participantes — ${fmtDate(cls.scheduledAt)} ${fmtTime(cls.scheduledAt)}`}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Agregar participante — solo mientras SCHEDULED */}
        {canEditAttendance && (
          <div className="flex gap-2">
            <select
              value={addStudentId}
              onChange={(e) => setAddStudentId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary bg-white"
            >
              <option value="">Agregar alumno…</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleAdd()}
              disabled={!addStudentId || adding}
              className="px-4 py-2 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
            >
              {adding ? "…" : <Plus size={16} />}
            </button>
          </div>
        )}

        {/* Lista de participantes */}
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Todavía no hay participantes.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-2.5 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-app-neutral-dark truncate">
                    {p.student.fullName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {`${p.student.currency} ${Number(p.effectiveRate).toFixed(2)}`}
                  </p>
                </div>

                {/* Attendance toggle — solo mientras SCHEDULED */}
                {canEditAttendance ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void handleToggleAttendance(p.studentId, "PRESENT")
                      }
                      disabled={togglingId === p.studentId}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors",
                        p.attendance === "PRESENT"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      )}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleToggleAttendance(p.studentId, "ABSENT")
                      }
                      disabled={togglingId === p.studentId}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors",
                        p.attendance === "ABSENT"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      )}
                    >
                      Ausente
                    </button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                      p.attendance === "ABSENT"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700",
                    )}
                  >
                    {p.attendance === "ABSENT" ? "Ausente" : "Presente"}
                  </span>
                )}

                {/* Quitar — solo mientras SCHEDULED */}
                {canEditAttendance && (
                  <button
                    onClick={() => void handleRemove(p.studentId)}
                    disabled={removingId === p.studentId}
                    title="Quitar participante"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── ReplicateWeekModal ────────────────────────────────────────────────────────

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getMondayStr(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ReplicateWeekModal({
  onClose,
  onConfirmed,
}: {
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const todayMonday = getMondayStr(new Date());
  const lastMonday = addDaysStr(todayMonday, -7);

  const [sourceFrom, setSourceFrom] = useState(lastMonday);
  const [targetFrom, setTargetFrom] = useState(todayMonday);
  const [step, setStep] = useState<"setup" | "preview">("setup");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<ReplicateWeekPreviewItem[]>(
    [],
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sourceTo = addDaysStr(sourceFrom, 6);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, ReplicateWeekPreviewItem[]>();
    for (const item of previewItems) {
      const day = item.scheduledAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [previewItems]);

  async function handlePreview() {
    setLoading(true);
    setError(null);
    try {
      const result = await replicateWeek({
        sourceFrom,
        sourceTo,
        targetFrom,
        preview: true,
      });
      if (result.proposedClasses.length === 0) {
        setError(
          "No se encontraron clases replicables en la semana seleccionada.",
        );
        return;
      }
      setPreviewItems(
        result.proposedClasses.map((item) => ({
          ...item,
          participants: [...item.participants],
        })),
      );
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al obtener el preview",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const classes = previewItems.map((item) => ({
        classType: item.classType,
        ...(item.classType === "INDIVIDUAL" && item.studentId
          ? { studentId: item.studentId }
          : {}),
        scheduledAt: item.scheduledAt,
        duration: item.duration,
        ...(item.appliedRate ? { appliedRate: item.appliedRate } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
        ...(item.classType === "GROUP"
          ? {
              participants: item.participants.map((p) => ({
                studentId: p.studentId,
                ...(p.appliedRate ? { appliedRate: p.appliedRate } : {}),
              })),
            }
          : {}),
      }));
      const result = await replicateWeek({
        sourceFrom,
        sourceTo,
        targetFrom,
        preview: false,
        classes,
      });
      const skippedNote =
        result.skipped > 0 ? ` (${result.skipped} ya existían)` : "";
      setSuccessMsg(
        `Se crearon ${result.created} clase${result.created !== 1 ? "s" : ""}${skippedNote}.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al confirmar la replicación",
      );
      setConfirming(false);
    }
  }

  function removeItem(sourceClassId: string) {
    setPreviewItems((prev) =>
      prev.filter((i) => i.sourceClassId !== sourceClassId),
    );
  }

  function updateItem(
    sourceClassId: string,
    patch: Partial<ReplicateWeekPreviewItem>,
  ) {
    setPreviewItems((prev) =>
      prev.map((i) =>
        i.sourceClassId === sourceClassId ? { ...i, ...patch } : i,
      ),
    );
  }

  function removeParticipantFromItem(
    sourceClassId: string,
    studentId: string,
  ) {
    setPreviewItems((prev) =>
      prev.map((i) =>
        i.sourceClassId === sourceClassId
          ? {
              ...i,
              participants: i.participants.filter(
                (p) => p.studentId !== studentId,
              ),
            }
          : i,
      ),
    );
  }

  if (successMsg) {
    return (
      <ModalShell title="Semana replicada" onClose={onConfirmed}>
        <div className="px-6 py-8 text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check size={24} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-700">{successMsg}</p>
          <button
            onClick={onConfirmed}
            className="w-full py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors"
          >
            Cerrar
          </button>
        </div>
      </ModalShell>
    );
  }

  if (step === "setup") {
    return (
      <ModalShell title="Replicar semana" onClose={onClose}>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Copiá las clases de una semana a otra. Se replican clases con estado
            SCHEDULED y TAUGHT. Las que ya existan en destino se saltean.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana de origen (inicio)
            </label>
            <input
              type="date"
              value={sourceFrom}
              onChange={(e) => setSourceFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary"
            />
            <p className="mt-1 text-xs text-gray-400">
              Cubre: {sourceFrom} → {sourceTo}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana de destino (inicio)
            </label>
            <input
              type="date"
              value={targetFrom}
              onChange={(e) => setTargetFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-app-primary"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handlePreview()}
              disabled={loading || !sourceFrom || !targetFrom}
              className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Cargando…" : "Ver preview"}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Preview step — wider modal with scrollable body
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-app-neutral-dark">
              Preview — clases a crear
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {sourceFrom} → {targetFrom} · {previewItems.length} clase
              {previewItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
          {previewItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Quitaste todas las clases. Confirmá para no crear ninguna, o volvé
              a ajustar la semana.
            </p>
          )}
          {groupedByDay.map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {new Date(day + "T12:00:00").toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <PreviewItemRow
                    key={item.sourceClassId}
                    item={item}
                    onRemove={() => removeItem(item.sourceClassId)}
                    onChangeScheduledAt={(val) =>
                      updateItem(item.sourceClassId, { scheduledAt: val })
                    }
                    onChangeAppliedRate={(val) =>
                      updateItem(item.sourceClassId, {
                        appliedRate: val || null,
                      })
                    }
                    onRemoveParticipant={(studentId) =>
                      removeParticipantFromItem(item.sourceClassId, studentId)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("setup");
              setError(null);
            }}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={confirming || previewItems.length === 0}
            className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
          >
            {confirming
              ? "Creando…"
              : `Confirmar (${previewItems.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewItemRow({
  item,
  onRemove,
  onChangeScheduledAt,
  onChangeAppliedRate,
  onRemoveParticipant,
}: {
  item: ReplicateWeekPreviewItem;
  onRemove: () => void;
  onChangeScheduledAt: (val: string) => void;
  onChangeAppliedRate: (val: string) => void;
  onRemoveParticipant: (studentId: string) => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.classType === "GROUP" ? (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              Grupal
            </span>
          ) : (
            <p className="text-sm font-medium text-app-neutral-dark truncate">
              {item.fullName ?? "—"}
            </p>
          )}
        </div>
        <button
          onClick={onRemove}
          title="Quitar esta clase"
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-0.5">
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            value={toLocalInput(item.scheduledAt)}
            onChange={(e) =>
              onChangeScheduledAt(new Date(e.target.value).toISOString())
            }
            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-app-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-0.5">
            Tarifa ({item.duration} min)
          </label>
          <input
            type="text"
            value={item.appliedRate ?? ""}
            onChange={(e) => onChangeAppliedRate(e.target.value)}
            placeholder="ej. 45.00"
            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-app-primary bg-white"
          />
        </div>
      </div>

      {item.classType === "GROUP" && item.participants.length > 0 && (
        <div className="space-y-1">
          {item.participants.map((p) => (
            <div
              key={p.studentId}
              className="flex items-center justify-between px-2 py-1 bg-purple-50 rounded-lg"
            >
              <span className="text-xs text-purple-800">{p.fullName}</span>
              <button
                onClick={() => onRemoveParticipant(p.studentId)}
                title="Quitar participante"
                className="p-0.5 text-purple-400 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AbsentDecisionModal ───────────────────────────────────────────────────────

function AbsentDecisionModal({
  cls,
  studentName,
  onClose,
  onDecided,
}: {
  cls: Class;
  studentName: string;
  onClose: () => void;
  onDecided: (updated: Class) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // GROUP: per-participant decisions
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(
    cls.classType === "GROUP",
  );
  // map studentId -> chargeable (default true)
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (cls.classType !== "GROUP") return;
    getClassParticipants(cls.id)
      .then((pts) => {
        setParticipants(pts);
        setDecisions(Object.fromEntries(pts.map((p) => [p.studentId, true])));
      })
      .catch((err) =>
        setSubmitError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar participantes",
        ),
      )
      .finally(() => setLoadingParticipants(false));
  }, [cls.id, cls.classType]);

  async function decide(chargeable: boolean) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      onDecided(await absentDecision(cls.id, chargeable));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al registrar la decisión",
      );
      setSubmitting(false);
    }
  }

  async function decideGroup() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const participantsPayload = participants.map((p) => ({
        studentId: p.studentId,
        chargeable: decisions[p.studentId] ?? true,
      }));
      // top-level chargeable = majority default (true); individual overrides sent explicitly
      onDecided(await absentDecision(cls.id, true, participantsPayload));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Error al registrar la decisión",
      );
      setSubmitting(false);
    }
  }

  const title =
    cls.classType === "GROUP"
      ? "Clase grupal ausente"
      : `Clase ausente — ${studentName}`;

  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        <p className="text-sm text-gray-600">
          Clase del{" "}
          <strong>
            {fmtDate(cls.scheduledAt)} a las {fmtTime(cls.scheduledAt)}
          </strong>
          .
        </p>

        {cls.classType === "GROUP" ? (
          <>
            <p className="text-sm text-gray-600">
              Decidí si cobrar a cada participante:
            </p>
            {loadingParticipants ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                Sin participantes registrados.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                {participants.map((p) => (
                  <li
                    key={p.studentId}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-app-neutral-dark">
                        {p.student.fullName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.student.currency}{" "}
                        {Number(p.effectiveRate).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((d) => ({
                            ...d,
                            [p.studentId]: false,
                          }))
                        }
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
                          decisions[p.studentId] === false
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                        )}
                      >
                        No cobrar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((d) => ({
                            ...d,
                            [p.studentId]: true,
                          }))
                        }
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
                          decisions[p.studentId] !== false
                            ? "bg-app-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                        )}
                      >
                        Cobrar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void decideGroup()}
                disabled={submitting || loadingParticipants}
                className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              El alumno no asistió. ¿Querés cobrar esta clase de todas formas?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void decide(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                No cobrar
              </button>
              <button
                onClick={() => void decide(true)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
              >
                Cobrar
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
