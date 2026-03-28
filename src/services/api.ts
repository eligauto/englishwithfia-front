/**
 * API client para el backend englishwithfia-api (NestJS).
 *
 * Todas las respuestas exitosas vienen envueltas:
 *   { data: T, timestamp: string }
 *
 * Todos los errores usan la forma:
 *   { statusCode, message, error, timestamp, path }
 *
 * Base URL configurada via VITE_API_URL en .env.
 */

import type {
  ContactFormData,
  TestimonialItem,
  AuthUser,
  Student,
  CreateStudentData,
  UpdateStudentData,
  DashboardData,
  Class,
  ClassStatus,
  CreateClassData,
  RescheduleClassData,
  Charge,
  UpdateChargeStatusData,
  Pack,
  CreatePackData,
} from '../types';

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

/**
 * Garantiza que la URL base tenga siempre un esquema http/https.
 * Previene que una variable de entorno sin protocolo se trate como ruta relativa.
 */
const API_URL = /^https?:\/\//i.test(RAW_API_URL)
  ? RAW_API_URL.replace(/\/$/, '')
  : `https://${RAW_API_URL.replace(/\/$/, '')}`;

export const TOKEN_KEY = 'fia_admin_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Tipos internos ──────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  data: T;
  timestamp: string;
}

interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// ── Error tipado ────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly path: string;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiRequestError';
    this.statusCode = apiError.statusCode;
    this.path = apiError.path;
  }
}

// ── Fetch base ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? getAuthHeaders() : {}),
      ...init?.headers,
    },
    ...init,
  });

  const json: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(json as ApiError);
  }

  return (json as ApiEnvelope<T>).data;
}

// ── Health ──────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  db: string;
  uptime: number;
  timestamp: string;
}

/**
 * GET /health — Verificación pública de salud del sistema.
 * No requiere autenticación.
 */
export async function checkHealth(): Promise<HealthStatus> {
  // El endpoint /health no usa el envelope { data, timestamp }
  const response = await fetch(`${API_URL}/health`);
  return response.json() as Promise<HealthStatus>;
}

// ── Contacto ────────────────────────────────────────────────────────────────

/**
 * POST /api/contact
 * Envía el formulario de contacto del landing.
 * Endpoint pendiente de implementación en el backend.
 */
export async function submitContactForm(data: ContactFormData): Promise<void> {
  await apiFetch<void>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Testimonios ─────────────────────────────────────────────────────────────

/**
 * GET /api/testimonials
 * Devuelve los testimonios para el carrusel del landing.
 * Endpoint pendiente de implementación en el backend.
 */
export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  return apiFetch<TestimonialItem[]>('/api/testimonials');
}

// ── Auth ────────────────────────────────────────────────────────────────────

interface LoginResponse {
  accessToken: string;
}

/**
 * POST /auth/login — devuelve el JWT.
 */
export async function login(email: string, password: string): Promise<string> {
  const { accessToken } = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return accessToken;
}

/**
 * GET /auth/me — usuario autenticado actual.
 */
export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', undefined, true);
}

// ── Students ─────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  return apiFetch<Student[]>('/students', undefined, true);
}

export async function createStudent(data: CreateStudentData): Promise<Student> {
  return apiFetch<Student>('/students', { method: 'POST', body: JSON.stringify(data) }, true);
}

export async function updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch<void>(`/students/${id}`, { method: 'DELETE' }, true);
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>('/dashboard', undefined, true);
}

// ── Classes ──────────────────────────────────────────────────────────────────

export interface GetClassesFilters {
  studentId?: string;
  status?: ClassStatus;
  from?: string;
  to?: string;
}

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getClasses(filters?: GetClassesFilters): Promise<Class[]> {
  const query = toQuery({
    studentId: filters?.studentId,
    status: filters?.status,
    from: filters?.from,
    to: filters?.to,
  });

  return apiFetch<Class[]>(`/classes${query}`, undefined, true);
}

export async function createClass(data: CreateClassData): Promise<Class> {
  return apiFetch<Class>('/classes', { method: 'POST', body: JSON.stringify(data) }, true);
}

export async function updateClassStatus(id: string, status: ClassStatus): Promise<Class> {
  return apiFetch<Class>(
    `/classes/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    true,
  );
}

export async function rescheduleClass(id: string, data: RescheduleClassData): Promise<Class> {
  return apiFetch<Class>(
    `/classes/${id}/reschedule`,
    { method: 'POST', body: JSON.stringify(data) },
    true,
  );
}

export async function absentDecision(id: string, chargeable: boolean): Promise<Class> {
  return apiFetch<Class>(
    `/classes/${id}/absent-decision`,
    { method: 'POST', body: JSON.stringify({ chargeable }) },
    true,
  );
}

// ── Charges ──────────────────────────────────────────────────────────────────

export interface GetChargesFilters {
  studentId?: string;
  financialStatus?: UpdateChargeStatusData['financialStatus'];
  from?: string;
  to?: string;
}

export async function getCharges(filters?: GetChargesFilters): Promise<Charge[]> {
  const query = toQuery({
    studentId: filters?.studentId,
    financialStatus: filters?.financialStatus,
    from: filters?.from,
    to: filters?.to,
  });

  return apiFetch<Charge[]>(`/charges${query}`, undefined, true);
}

export async function updateChargeStatus(id: string, data: UpdateChargeStatusData): Promise<Charge> {
  return apiFetch<Charge>(
    `/charges/${id}/status`,
    { method: 'PATCH', body: JSON.stringify(data) },
    true,
  );
}

// ── Packs ────────────────────────────────────────────────────────────────────

export async function getPacks(studentId?: string): Promise<Pack[]> {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<Pack[]>(`/packs${query}`, undefined, true);
}

export async function createPack(data: CreatePackData): Promise<Pack> {
  return apiFetch<Pack>('/packs', { method: 'POST', body: JSON.stringify(data) }, true);
}

export async function deletePack(id: string): Promise<void> {
  await apiFetch<void>(`/packs/${id}`, { method: 'DELETE' }, true);
}
