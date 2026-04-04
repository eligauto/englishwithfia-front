import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Check } from "lucide-react";
import {
  getOrganization,
  updateOrganization,
  ApiRequestError,
} from "../../services/api";
import type { Organization, VocabularyPreset } from "../../types";
import { cn } from "../../utils/cn";

// ── Preset catalogue (display data — labels come from the API) ────────────────

interface PresetMeta {
  value: VocabularyPreset;
  label: string;
  description: string;
  studentExample: string;
  sessionExample: string;
  icon: string;
}

const PRESETS: PresetMeta[] = [
  {
    value: "EDUCATION",
    label: "Educación",
    description: "Para clases particulares, tutorías y academias.",
    studentExample: "alumno / alumnos",
    sessionExample: "clase / clases",
    icon: "🎓",
  },
  {
    value: "HEALTH",
    label: "Salud",
    description: "Para psicólogos, médicos, nutricionistas y afines.",
    studentExample: "paciente / pacientes",
    sessionExample: "consulta / consultas",
    icon: "🩺",
  },
  {
    value: "FITNESS",
    label: "Fitness",
    description: "Para entrenadores, coaches deportivos y pilates.",
    studentExample: "atleta / atletas",
    sessionExample: "sesión / sesiones",
    icon: "💪",
  },
  {
    value: "COACHING",
    label: "Coaching",
    description: "Para coaches de vida, mentores y consultores.",
    studentExample: "cliente / clientes",
    sessionExample: "sesión / sesiones",
    icon: "🧭",
  },
  {
    value: "GENERIC",
    label: "Genérico",
    description: "Terminología neutra adaptable a cualquier servicio.",
    studentExample: "cliente / clientes",
    sessionExample: "sesión / sesiones",
    icon: "⚙️",
  },
];

// ── Form types ────────────────────────────────────────────────────────────────

interface OrgFormData {
  name: string;
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] =
    useState<VocabularyPreset>("EDUCATION");
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetSuccess, setPresetSuccess] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);

  const [orgSuccess, setOrgSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrgFormData>();

  useEffect(() => {
    getOrganization()
      .then((data) => {
        setOrg(data);
        setSelectedPreset(data.vocabularyPreset);
        reset({ name: data.name });
      })
      .catch((err) =>
        setLoadError(
          err instanceof ApiRequestError
            ? err.message
            : "Error al cargar la configuración",
        ),
      )
      .finally(() => setLoading(false));
  }, [reset]);

  async function handleSaveOrg(data: OrgFormData) {
    setOrgSuccess(false);
    try {
      const updated = await updateOrganization({ name: data.name.trim() });
      setOrg(updated);
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch (err) {
      // error surfaced via react-hook-form setError not needed here — alert is fine
      alert(err instanceof ApiRequestError ? err.message : "Error al guardar");
    }
  }

  async function handleSavePreset() {
    if (!org || selectedPreset === org.vocabularyPreset) return;
    setPresetSaving(true);
    setPresetError(null);
    setPresetSuccess(false);
    try {
      const updated = await updateOrganization({
        vocabularyPreset: selectedPreset,
      });
      setOrg(updated);
      setPresetSuccess(true);
      setTimeout(() => setPresetSuccess(false), 3000);
    } catch (err) {
      setPresetError(
        err instanceof ApiRequestError ? err.message : "Error al guardar",
      );
    } finally {
      setPresetSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-fia-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          {loadError}
        </p>
      </div>
    );
  }

  const presetChanged = selectedPreset !== org?.vocabularyPreset;
  const activeLabels =
    org?.vocabularyPreset === selectedPreset ? org?.vocabularyLabels : null;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-fia-neutral-dark mb-8">
        Configuración
      </h1>

      {/* ── Sección: Organización ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-fia-neutral-dark mb-4">
          Organización
        </h2>
        <form onSubmit={handleSubmit(handleSaveOrg)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la organización
            </label>
            <input
              {...register("name", { required: "El nombre es obligatorio" })}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition",
                errors.name ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Guardando…" : "Guardar nombre"}
            </button>
            {orgSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Check size={14} />
                Guardado
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ── Sección: Terminología ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-fia-neutral-dark">
            Terminología
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Elegí el vocabulario que mejor se adapta a tu actividad. El sistema
            usará estos términos en toda la plataforma.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.value;
            const isCurrent = org?.vocabularyPreset === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setSelectedPreset(preset.value)}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3",
                  isSelected
                    ? "border-fia-primary bg-fia-primary-light"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                )}
              >
                <span className="text-xl mt-0.5 shrink-0">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-fia-neutral-dark" : "text-gray-700",
                      )}
                    >
                      {preset.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-fia-primary text-white px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {preset.description}
                  </p>
                  <div className="flex gap-4 mt-1.5">
                    <span className="text-xs text-gray-400">
                      <span className="font-medium text-gray-600">
                        Persona:
                      </span>{" "}
                      {preset.studentExample}
                    </span>
                    <span className="text-xs text-gray-400">
                      <span className="font-medium text-gray-600">
                        Actividad:
                      </span>{" "}
                      {preset.sessionExample}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="shrink-0 w-5 h-5 rounded-full bg-fia-primary flex items-center justify-center mt-0.5">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Labels activos del backend (para el preset guardado) */}
        {activeLabels && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-xs text-gray-500">
            <span className="font-medium text-gray-600 mr-2">
              Etiquetas activas:
            </span>
            {activeLabels.studentSingular} · {activeLabels.studentPlural} ·{" "}
            {activeLabels.sessionSingular} · {activeLabels.sessionPlural}
          </div>
        )}

        {presetError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-3">
            {presetError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSavePreset()}
            disabled={presetSaving || !presetChanged}
            className="px-5 py-2.5 bg-fia-primary text-white text-sm font-semibold rounded-xl hover:bg-fia-primary-dark transition-colors disabled:opacity-50"
          >
            {presetSaving ? "Guardando…" : "Guardar terminología"}
          </button>
          {presetSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check size={14} />
              Guardado
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
