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
} from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

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
