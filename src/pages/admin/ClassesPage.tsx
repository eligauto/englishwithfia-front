import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Plus,
  Check,
  UserX,
  Ban,
  CalendarClock,
  CircleDollarSign,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  getClasses,
  getStudents,
  createClass,
  updateClassStatus,
  rescheduleClass,
  absentDecision,
  ApiRequestError,
} from '../../services/api';
import type {
  Class,
  Student,
  ClassStatus,
  CreateClassData,
  RescheduleClassData,
} from '../../types';
import { cn } from '../../utils/cn';

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ClassStatus, string> = {
  SCHEDULED: 'Programada',
  TAUGHT: 'Dictada',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reagendada',
  ABSENT: 'Ausente',
};

const STATUS_COLORS: Record<ClassStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  TAUGHT: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  RESCHEDULED: 'bg-orange-100 text-orange-700',
  ABSENT: 'bg-yellow-100 text-yellow-700',
};

function StatusBadge({ status }: { status: ClassStatus }) {
  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLORS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── ClassesPage ───────────────────────────────────────────────────────────────

export function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClassStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Class | null>(null);
  const [absentTarget, setAbsentTarget] = useState<Class | null>(null);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  );

  useEffect(() => {
    Promise.all([getClasses(), getStudents()])
      .then(([cls, sts]) => {
        // orden descendente por fecha
        cls.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        setClasses(cls);
        setStudents(sts.filter((s) => s.isActive));
      })
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : 'Error al cargar datos'),
      )
      .finally(() => setLoading(false));
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

  function prependClass(created: Class) {
    setClasses((prev) => [created, ...prev]);
  }

  // Después de reagendar se refresca la lista para que aparezca la clase nueva
  async function refetchClasses() {
    try {
      const cls = await getClasses();
      cls.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
      setClasses(cls);
    } catch {
      // silent — el estado local sigue siendo coherente
    }
  }

  async function handleMarkTaught(cls: Class) {
    if (!confirm('¿Marcar esta clase como dictada? Se generará un cargo automáticamente.')) return;
    try {
      patchClass(await updateClassStatus(cls.id, 'TAUGHT'));
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'Error al actualizar la clase');
    }
  }

  async function handleMarkAbsent(cls: Class) {
    try {
      const updated = await updateClassStatus(cls.id, 'ABSENT');
      patchClass(updated);
      setAbsentTarget(updated);
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'Error al marcar ausente');
    }
  }

  async function handleCancel(cls: Class) {
    if (!confirm('¿Cancelar esta clase? La acción no puede deshacerse.')) return;
    try {
      patchClass(await updateClassStatus(cls.id, 'CANCELLED'));
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'Error al cancelar la clase');
    }
  }

  const visible = classes
    .filter((c) => !filterStudentId || c.studentId === filterStudentId)
    .filter((c) => !filterStatus || c.status === filterStatus);

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fia-neutral-dark">Clases</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors"
        >
          <Plus size={16} />
          Nueva clase
        </button>
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
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ClassStatus | '')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as ClassStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
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
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">
          {filterStudentId || filterStatus
            ? 'No hay clases que coincidan con los filtros.'
            : 'Todavía no hay clases. ¡Agendá la primera!'}
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
                <tr key={cls.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-fia-neutral-dark">
                    {studentMap[cls.studentId] ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{fmtDate(cls.scheduledAt)}</td>
                  <td className="px-6 py-4 text-gray-500">{fmtTime(cls.scheduledAt)}</td>
                  <td className="px-6 py-4 text-gray-500">{cls.duration} min</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={cls.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {cls.appliedRate ? `$${Number(cls.appliedRate).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <ClassActions
                      cls={cls}
                      onMarkTaught={handleMarkTaught}
                      onMarkAbsent={handleMarkAbsent}
                      onCancel={handleCancel}
                      onReschedule={setRescheduleTarget}
                      onAbsentDecision={setAbsentTarget}
                    />
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
          onCreated={(cls) => {
            prependClass(cls);
            setShowCreate(false);
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          cls={rescheduleTarget}
          studentName={studentMap[rescheduleTarget.studentId] ?? ''}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={(updated) => {
            patchClass(updated);
            setRescheduleTarget(null);
            void refetchClasses(); // trae la clase nueva generada por el backend
          }}
        />
      )}

      {absentTarget && (
        <AbsentDecisionModal
          cls={absentTarget}
          studentName={studentMap[absentTarget.studentId] ?? ''}
          onClose={() => setAbsentTarget(null)}
          onDecided={(updated) => {
            patchClass(updated);
            setAbsentTarget(null);
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
}

function ClassActions({
  cls,
  onMarkTaught,
  onMarkAbsent,
  onCancel,
  onReschedule,
  onAbsentDecision,
}: ClassActionsProps) {
  if (cls.status === 'SCHEDULED') {
    return (
      <div className="flex items-center justify-end gap-1">
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
          className="p-1.5 text-gray-400 hover:text-fia-primary hover:bg-fia-primary-light rounded-lg transition-colors"
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
  if (cls.status === 'ABSENT' && !cls.chargeGenerated) {
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
          <h2 className="text-base font-semibold text-fia-neutral-dark">{title}</h2>
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
        className="flex-1 py-2.5 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
      >
        {isSubmitting ? 'Guardando…' : submitLabel}
      </button>
    </div>
  );
}

// ── CreateClassModal ──────────────────────────────────────────────────────────

interface CreateClassFormData {
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormData>({
    defaultValues: { studentId: '', scheduledAt: '', duration: 60, notes: '' },
  });

  async function onSubmit(data: CreateClassFormData) {
    setSubmitError(null);
    try {
      const payload: CreateClassData = {
        studentId: data.studentId,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        duration: data.duration,
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
      };
      onCreated(await createClass(payload));
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : 'Error al crear la clase');
    }
  }

  return (
    <ModalShell title="Nueva clase" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{submitError}</p>
        )}

        {/* Alumno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alumno <span className="text-red-500">*</span>
          </label>
          <select
            {...register('studentId', { required: 'El alumno es obligatorio' })}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white',
              errors.studentId ? 'border-red-400' : 'border-gray-200',
            )}
          >
            <option value="">Seleccionar alumno…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
          {errors.studentId && (
            <p className="mt-1 text-xs text-red-500">{errors.studentId.message}</p>
          )}
        </div>

        {/* Fecha y hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            {...register('scheduledAt', { required: 'La fecha es obligatoria' })}
            type="datetime-local"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary',
              errors.scheduledAt ? 'border-red-400' : 'border-gray-200',
            )}
          />
          {errors.scheduledAt && (
            <p className="mt-1 text-xs text-red-500">{errors.scheduledAt.message}</p>
          )}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (minutos) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('duration', {
              valueAsNumber: true,
              validate: {
                required: (v) => !isNaN(v) || 'La duración es obligatoria',
                positive: (v) => v > 0 || 'Debe ser mayor a 0',
              },
            })}
            type="number"
            min="15"
            step="15"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary',
              errors.duration ? 'border-red-400' : 'border-gray-200',
            )}
          />
          {errors.duration && (
            <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary resize-none"
          />
        </div>

        <ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel="Crear clase" />
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
  } = useForm<RescheduleFormData>({ defaultValues: { scheduledAt: '', notes: '' } });

  async function onSubmit(data: RescheduleFormData) {
    setSubmitError(null);
    try {
      const payload: RescheduleClassData = {
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
      };
      onRescheduled(await rescheduleClass(cls.id, payload));
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : 'Error al reagendar');
    }
  }

  return (
    <ModalShell title={`Reagendar — ${studentName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{submitError}</p>
        )}

        <p className="text-xs text-gray-500">
          Clase original:{' '}
          <span className="font-medium">
            {fmtDate(cls.scheduledAt)} {fmtTime(cls.scheduledAt)}
          </span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            {...register('scheduledAt', { required: 'La fecha es obligatoria' })}
            type="datetime-local"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary',
              errors.scheduledAt ? 'border-red-400' : 'border-gray-200',
            )}
          />
          {errors.scheduledAt && (
            <p className="mt-1 text-xs text-red-500">{errors.scheduledAt.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary resize-none"
          />
        </div>

        <ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel="Reagendar" />
      </form>
    </ModalShell>
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

  async function decide(chargeable: boolean) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      onDecided(await absentDecision(cls.id, chargeable));
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError ? err.message : 'Error al registrar la decisión',
      );
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title={`Clase ausente — ${studentName}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{submitError}</p>
        )}

        <p className="text-sm text-gray-600">
          El alumno no asistió a la clase del{' '}
          <strong>
            {fmtDate(cls.scheduledAt)} a las {fmtTime(cls.scheduledAt)}
          </strong>
          .
        </p>
        <p className="text-sm text-gray-600">¿Querés cobrar esta clase de todas formas?</p>

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
            className="flex-1 py-2.5 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
          >
            Cobrar
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
