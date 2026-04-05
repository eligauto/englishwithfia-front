import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { register as registerApi, ApiRequestError } from "../../services/api";
import { ROUTES } from "../../constants/routes";
import { cn } from "../../utils/cn";

interface RegisterFormData {
  inviteCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const VALID_CODE = (import.meta.env.VITE_REGISTER_CODE as string | undefined) ?? "";

export function RegisterPage() {
  const { isAuthenticated, isLoading, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  async function onSubmit(data: RegisterFormData) {
    setError(null);
    try {
      const token = await registerApi(data.email, data.password);
      await loginWithToken(token);
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 409) {
        setError("Ya existe una cuenta con ese email.");
      } else if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-app-neutral-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-app-neutral-dark">Practiq</h1>
          <p className="text-sm text-gray-500 mt-1">Crear cuenta</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Código de invitación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de acceso
            </label>
            <input
              {...register("inviteCode", {
                required: "El código de acceso es obligatorio",
                validate: (v) =>
                  !VALID_CODE || v === VALID_CODE || "Código incorrecto",
              })}
              type="password"
              autoComplete="off"
              placeholder="••••••••"
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.inviteCode ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.inviteCode && (
              <p className="mt-1 text-xs text-red-500">
                {errors.inviteCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email", {
                required: "El email es obligatorio",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Email inválido" },
              })}
              type="email"
              autoComplete="email"
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.email ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: { value: 8, message: "Mínimo 8 caracteres" },
              })}
              type="password"
              autoComplete="new-password"
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.password ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              {...register("confirmPassword", {
                required: "Confirmá tu contraseña",
                validate: (v) =>
                  v === getValues('password') || 'Las contraseñas no coinciden',
              })}
              type="password"
              autoComplete="new-password"
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-app-primary transition",
                errors.confirmPassword ? "border-red-400" : "border-gray-200",
              )}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-app-primary text-white text-sm font-semibold rounded-xl hover:bg-app-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link
            to={ROUTES.ADMIN.LOGIN}
            className="text-app-primary font-medium hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
