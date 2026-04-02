import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CalendarClock, Plus, Pencil, Trash2, PlayCircle, X } from 'lucide-react';
import {
  ApiRequestError,
  createSchedule,
  deleteSchedule,
  generateClasses,
  getOrganization,
  getSchedules,
  getStudents,
  updateSchedule,
} from '../../services/api';
import type {
  CreateScheduleData,
  DayOfWeek,
  GenerateClassesData,
  Organization,
  Schedule,
  ScheduleSlotInput,
  Student,
  UpdateScheduleData,
} from '../../types';
import { cn } from '../../utils/cn';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Lun' },
  { value: 'TUESDAY', label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mié' },
  { value: 'THURSDAY', label: 'Jue' },
  { value: 'FRIDAY', label: 'Vie' },
  { value: 'SATURDAY', label: 'Sáb' },
  { value: 'SUNDAY', label: 'Dom' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function dayLabel(day: DayOfWeek): string {
  return ALL_DAYS.find((x) => x.value === day)?.label ?? day;
}

function formatSlots(slots: ScheduleSlotInput[]): string {
  if (slots.length === 0) return '—';
  return slots.map((s) => `${dayLabel(s.dayOfWeek)} ${s.timeOfDay}`).join(' · ');
}

function studentName(students: Student[], id: string): string {
  return students.find((s) => s.id === id)?.fullName ?? id;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
      )}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ── Schedule form ─────────────────────────────────────────────────────────────

interface ScheduleFormValues {
  studentId: string;
  slots: ScheduleSlotInput[];
  duration: number;
  appliedRate: string;
  notes: string;
}

function SlotEditor({
  slots,
  onChange,
}: {
  slots: ScheduleSlotInput[];
  onChange: (slots: ScheduleSlotInput[]) => void;
}) {
  function addSlot() {
    onChange([...slots, { dayOfWeek: 'MONDAY', timeOfDay: '' }]);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, patch: Partial<ScheduleSlotInput>) {
    onChange(slots.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-2">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={slot.dayOfWeek}
            onChange={(e) => updateSlot(i, { dayOfWeek: e.target.value as DayOfWeek })}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
          >
            {ALL_DAYS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="time"
            value={slot.timeOfDay}
            onChange={(e) => updateSlot(i, { timeOfDay: e.target.value })}
            className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
          />
          <button
            type="button"
            onClick={() => removeSlot(i)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSlot}
        className="flex items-center gap-1.5 text-xs text-fia-primary hover:text-fia-primary-dark transition-colors"
      >
        <Plus size={13} />
        Agregar día / hora
      </button>
    </div>
  );
}

function ScheduleModal({
  initial,
  students,
  timezone,
  onClose,
  onSave,
}: {
  initial?: Schedule;
  students: Student[];
  timezone: string;
  onClose: () => void;
  onSave: (data: CreateScheduleData | UpdateScheduleData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    defaultValues: {
      studentId: initial?.studentId ?? '',
      slots: initial?.slots.map((s) => ({ dayOfWeek: s.dayOfWeek, timeOfDay: s.timeOfDay })) ?? [{ dayOfWeek: 'MONDAY', timeOfDay: '' }],
      duration: initial?.duration ?? 60,
      appliedRate: initial?.appliedRate ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const slots = useWatch({ control, name: 'slots' });
  const slotsValid = slots.length > 0 && slots.every((s) => s.timeOfDay !== '');

  async function onSubmit(values: ScheduleFormValues) {
    const payload: CreateScheduleData = {
      studentId: values.studentId,
      slots: values.slots,
      duration: Number(values.duration),
      ...(values.appliedRate ? { appliedRate: values.appliedRate } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    await onSave(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-fia-neutral-dark">
            {initial ? 'Editar horario' : 'Nuevo horario recurrente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Alumno */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alumno *</label>
            <select
              {...register('studentId', { required: 'Requerido' })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
            >
              <option value="">Seleccionar alumno…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
            {errors.studentId && (
              <p className="text-xs text-red-500 mt-1">{errors.studentId.message}</p>
            )}
          </div>

          {/* Slots */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Días y horarios ({timezone}) *
            </label>
            <SlotEditor
              slots={slots}
              onChange={(updated) => setValue('slots', updated)}
            />
            {!slotsValid && (
              <p className="text-xs text-red-500 mt-1">
                Agregá al menos un día con hora completa
              </p>
            )}
          </div>

          {/* Duración */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duración (min) *
            </label>
            <input
              type="number"
              min={15}
              step={15}
              {...register('duration', { required: 'Requerido', min: 15 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
            />
          </div>

          {/* Tarifa override */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tarifa por clase (opcional — usa la del alumno si vacío)
            </label>
            <input
              type="text"
              placeholder="45.00"
              {...register('appliedRate')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !slotsValid}
              className="px-4 py-2 rounded-xl bg-fia-primary text-white text-sm font-semibold hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Generate classes modal ────────────────────────────────────────────────────

function GenerateModal({
  schedule,
  studentFullName,
  onClose,
  onGenerate,
}: {
  schedule: Schedule;
  studentFullName: string;
  onClose: () => void;
  onGenerate: (data: GenerateClassesData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenerateClassesData>();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-fia-neutral-dark">Generar clases</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{studentFullName}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatSlots(schedule.slots)}</p>
          <p className="text-xs text-gray-400 mt-1">Máximo 90 días por generación.</p>
        </div>

        <form onSubmit={handleSubmit(onGenerate)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde *</label>
              <input
                type="date"
                {...register('from', { required: 'Requerido' })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
              />
              {errors.from && (
                <p className="text-xs text-red-500 mt-1">{errors.from.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta *</label>
              <input
                type="date"
                {...register('to', { required: 'Requerido' })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
              />
              {errors.to && (
                <p className="text-xs text-red-500 mt-1">{errors.to.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-fia-primary text-white text-sm font-semibold hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Generando…' : 'Generar clases'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Modal =
  | { type: 'create' }
  | { type: 'edit'; schedule: Schedule }
  | { type: 'generate'; schedule: Schedule };

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulesData, studentsData, orgData] = await Promise.all([
        getSchedules({
          studentId: filterStudentId || undefined,
          isActive: filterActive === 'all' ? undefined : filterActive === 'active',
        }),
        getStudents(),
        getOrganization(),
      ]);
      setSchedules(schedulesData);
      setStudents(studentsData);
      setOrg(orgData);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [filterStudentId, filterActive]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleSaveSchedule(data: CreateScheduleData | UpdateScheduleData) {
    if (modal?.type === 'edit') {
      await updateSchedule(modal.schedule.id, data as UpdateScheduleData);
      flash('Horario actualizado');
    } else {
      await createSchedule(data as CreateScheduleData);
      flash('Horario creado');
    }
    setModal(null);
    void fetchData();
  }

  async function handleDeactivate(id: string) {
    if (!confirm('¿Desactivar este horario? No se generarán más clases desde él.')) return;
    try {
      await deleteSchedule(id);
      flash('Horario desactivado');
      void fetchData();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Error al desactivar');
    }
  }

  async function handleGenerate(schedule: Schedule, data: GenerateClassesData) {
    const result = await generateClasses(schedule.id, data);
    setModal(null);
    flash(
      result.generated === 0
        ? `No se crearon clases nuevas (${result.skipped} ya existían)`
        : `${result.generated} clase${result.generated === 1 ? '' : 's'} generada${result.generated === 1 ? '' : 's'}${result.skipped > 0 ? ` · ${result.skipped} omitida${result.skipped === 1 ? '' : 's'}` : ''}`,
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fia-neutral-dark">Horarios recurrentes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plantillas de clases periódicas por alumno
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fia-primary text-white text-sm font-semibold hover:bg-fia-primary-dark transition-colors"
        >
          <Plus size={16} />
          Nuevo horario
        </button>
      </div>

      {/* Messages */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}
      {successMsg && (
        <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl">{successMsg}</p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Alumno</label>
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
          >
            <option value="">Todos</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fia-primary bg-white"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <CalendarClock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No hay horarios recurrentes.</p>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="mt-4 px-4 py-2 rounded-xl bg-fia-primary text-white text-sm font-semibold hover:bg-fia-primary-dark transition-colors"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Alumno</th>
                <th className="px-5 py-3 font-medium">Slots ({org?.timezone ?? 'UTC'})</th>
                <th className="px-5 py-3 font-medium">Duración</th>
                <th className="px-5 py-3 font-medium">Tarifa</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-fia-neutral-dark">
                    {studentName(students, s.studentId)}
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs leading-relaxed">
                    {s.slots.length === 0
                      ? '—'
                      : s.slots.map((slot) => (
                          <span key={slot.id} className="inline-block mr-2 whitespace-nowrap">
                            {dayLabel(slot.dayOfWeek)} {slot.timeOfDay}
                          </span>
                        ))}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{s.duration} min</td>
                  <td className="px-5 py-3 text-gray-600">
                    {s.appliedRate ? s.appliedRate : <span className="text-gray-400 text-xs">del alumno</span>}
                  </td>
                  <td className="px-5 py-3">
                    <ActiveBadge isActive={s.isActive} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Generar clases"
                        onClick={() => setModal({ type: 'generate', schedule: s })}
                        disabled={!s.isActive}
                        className="p-1.5 rounded-lg text-fia-primary hover:bg-fia-primary-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <PlayCircle size={16} />
                      </button>
                      <button
                        title="Editar"
                        onClick={() => setModal({ type: 'edit', schedule: s })}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      {s.isActive && (
                        <button
                          title="Desactivar"
                          onClick={() => void handleDeactivate(s.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'create' && (
        <ScheduleModal
          students={students}
          timezone={org?.timezone ?? 'UTC'}
          onClose={() => setModal(null)}
          onSave={handleSaveSchedule}
        />
      )}
      {modal?.type === 'edit' && (
        <ScheduleModal
          initial={modal.schedule}
          students={students}
          timezone={org?.timezone ?? 'UTC'}
          onClose={() => setModal(null)}
          onSave={handleSaveSchedule}
        />
      )}
      {modal?.type === 'generate' && (
        <GenerateModal
          schedule={modal.schedule}
          studentFullName={studentName(students, modal.schedule.studentId)}
          onClose={() => setModal(null)}
          onGenerate={(data) => handleGenerate(modal.schedule, data)}
        />
      )}
    </div>
  );
}
