import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { Check, Calendar, Loader2, AlertCircle, X } from "lucide-react";
import {
  getOrganization,
  updateOrganization,
  getGoogleCalendarStatus,
  getGoogleCalendarConnectUrl,
  disconnectGoogleCalendar,
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

// ── Tipos de estado de Google Calendar ───────────────────────────────────────

type GCalStatus = "loading" | "connected" | "disconnected" | "error";

interface GCalToast {
  type: "success" | "error";
  message: string;
}

// Clave de sessionStorage usada para detectar el regreso desde el flujo OAuth
const GCAL_CONNECTING_KEY = "gcal_connecting";

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] =
    useState<VocabularyPreset>("EDUCATION");
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetSuccess, setPresetSuccess] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);

  const [orgSuccess, setOrgSuccess] = useState(false);

  // ── Google Calendar state ──
  const [gcalStatus, setGCalStatus] = useState<GCalStatus>("loading");
  const [gcalConnecting, setGCalConnecting] = useState(false);
  const [gcalDisconnecting, setGCalDisconnecting] = useState(false);
  const [gcalConfirmDisconnect, setGCalConfirmDisconnect] = useState(false);
  const [gcalToast, setGCalToast] = useState<GCalToast | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrgFormData>();

  const refreshGCalStatus = useCallback(async () => {
    try {
      const { connected } = await getGoogleCalendarStatus();
      setGCalStatus(connected ? "connected" : "disconnected");
    } catch {
      setGCalStatus("error");
    }
  }, []);

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

  // Carga el estado de Google Calendar y maneja el regreso del flujo OAuth
  useEffect(() => {
    const oauthError = searchParams.get("error");
    const wasConnecting = sessionStorage.getItem(GCAL_CONNECTING_KEY) === "1";

    // Limpiar params de la URL si vienen del redirect OAuth
    if (oauthError === "google_auth_failed" || wasConnecting) {
      setSearchParams({}, { replace: true });
    }

    if (oauthError === "google_auth_failed") {
      sessionStorage.removeItem(GCAL_CONNECTING_KEY);
      setGCalStatus("disconnected");
      setGCalToast({
        type: "error",
        message:
          "No se pudo conectar con Google Calendar. Intentá de nuevo.",
      });
      void refreshGCalStatus();
      return;
    }

    if (wasConnecting) {
      sessionStorage.removeItem(GCAL_CONNECTING_KEY);
      void refreshGCalStatus().then(() => {
        setGCalToast({
          type: "success",
          message: "Google Calendar conectado correctamente.",
        });
      });
      return;
    }

    void refreshGCalStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGCalConnect() {
    setGCalConnecting(true);
    try {
      const authUrl = await getGoogleCalendarConnectUrl();
      sessionStorage.setItem(GCAL_CONNECTING_KEY, "1");
      window.location.href = authUrl;
    } catch (err) {
      setGCalConnecting(false);
      const isConfigError =
        err instanceof ApiRequestError && err.statusCode === 400;
      setGCalToast({
        type: "error",
        message: isConfigError
          ? "La integración no está disponible en este momento."
          : "Error al iniciar la conexión con Google Calendar.",
      });
    }
  }

  async function handleGCalDisconnect() {
    setGCalDisconnecting(true);
    setGCalConfirmDisconnect(false);
    try {
      await disconnectGoogleCalendar();
      setGCalStatus("disconnected");
      setGCalToast({ type: "success", message: "Google Calendar desconectado." });
    } catch {
      setGCalToast({
        type: "error",
        message: "No se pudo desconectar Google Calendar. Intentá de nuevo.",
      });
    } finally {
      setGCalDisconnecting(false);
    }
  }

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
        <div className="w-8 h-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="mb-8">
        <h1 className="text-xl font-bold text-app-neutral-dark tracking-tight">Configuración</h1>
        <p className="text-sm text-gray-400 mt-0.5">Preferencias de tu organización</p>
      </div>

      {/* ── Sección: Organización ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-app-neutral-dark mb-4">
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
                "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
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
              className="px-5 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
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
          <h2 className="text-base font-semibold text-app-neutral-dark">
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
                    ? "border-app-primary bg-app-primary-light"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                )}
              >
                <span className="text-xl mt-0.5 shrink-0">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-app-neutral-dark" : "text-gray-700",
                      )}
                    >
                      {preset.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-app-primary text-white px-2 py-0.5 rounded-full">
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
                  <div className="shrink-0 w-5 h-5 rounded-full bg-app-primary flex items-center justify-center mt-0.5">
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
            className="px-5 py-2.5 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-50"
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

      {/* ── Sección: Integraciones ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-neutral-dark">
            Integraciones
          </h2>
        </div>

        {/* Toast de Google Calendar */}
        {gcalToast && (
          <div
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl mb-4 text-sm",
              gcalToast.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            )}
          >
            {gcalToast.type === "success" ? (
              <Check size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{gcalToast.message}</span>
            <button
              type="button"
              onClick={() => setGCalToast(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Card de Google Calendar */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200">
          {/* Ícono Google Calendar */}
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" fill="#ffffff" stroke="#DADCE0" strokeWidth="1.5" />
              <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8" />
              <rect x="3" y="7" width="18" height="2" fill="#1A73E8" />
              <path d="M8 3v3M16 3v3" stroke="#1A73E8" strokeWidth="1.5" strokeLinecap="round" />
              <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1A73E8" fontFamily="Arial, sans-serif">G</text>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-app-neutral-dark">
                Google Calendar
              </span>
              {gcalStatus === "connected" && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {gcalStatus === "connected"
                ? "Las clases nuevas se sincronizan automáticamente."
                : "Sincronizá tus clases automáticamente con Google Calendar."}
            </p>
          </div>

          {/* Acciones */}
          <div className="shrink-0">
            {gcalStatus === "loading" && (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            )}

            {gcalStatus === "error" && (
              <button
                type="button"
                onClick={() => void refreshGCalStatus()}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                Reintentar
              </button>
            )}

            {gcalStatus === "disconnected" && (
              <button
                type="button"
                onClick={() => void handleGCalConnect()}
                disabled={gcalConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
              >
                {gcalConnecting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Conectando…
                  </>
                ) : (
                  <>
                    <Calendar size={14} />
                    Conectar
                  </>
                )}
              </button>
            )}

            {gcalStatus === "connected" && !gcalConfirmDisconnect && (
              <button
                type="button"
                onClick={() => setGCalConfirmDisconnect(true)}
                disabled={gcalDisconnecting}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-60"
              >
                Desconectar
              </button>
            )}

            {gcalStatus === "connected" && gcalConfirmDisconnect && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">¿Confirmar?</span>
                <button
                  type="button"
                  onClick={() => void handleGCalDisconnect()}
                  disabled={gcalDisconnecting}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {gcalDisconnecting ? "Desconectando…" : "Sí, desconectar"}
                </button>
                <button
                  type="button"
                  onClick={() => setGCalConfirmDisconnect(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
