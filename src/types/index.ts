// ── Landing ───────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  level: string;
  modality: 'online' | 'presencial' | 'ambos';
}

export interface TestimonialItem {
  id: string;
  name: string;
  quote: string;
  level?: string;
  since?: string;
  origin?: string;
  avatarUrl?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

// ── API Envelope ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  timestamp: string; // ISO 8601
}

// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'OWNER' | 'ADMIN';

export type ClassModality = 'IN_PERSON' | 'ONLINE';

export type ClassStatus = 'SCHEDULED' | 'TAUGHT' | 'CANCELLED' | 'RESCHEDULED' | 'ABSENT';

export type FinancialStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DEFERRED'
  | 'WAIVED'
  | 'PACK_COVERED'
  | 'ABSENT_CHARGEABLE'
  | 'ABSENT_NON_CHARGEABLE';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

/** Respuesta de POST /auth/login y POST /auth/register */
export interface AuthResponse {
  accessToken: string;
}

/** Payload del JWT decodificado — GET /auth/me */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// ── Admin — Students ──────────────────────────────────────────────────────────

/** Entidad Student tal como la devuelve el backend */
export interface Student {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  classRate: string;            // Decimal serializado como string, e.g. "45.00"
  modality: ClassModality;
  weeklyFrequency: number | null;
  classDuration: number | null; // minutos
  isActive: boolean;
  notes: string | null;
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

export interface CreateStudentData {
  fullName: string;
  classRate: number;
  modality: ClassModality;
  email?: string;
  phone?: string;
  weeklyFrequency?: number;
  classDuration?: number;
  notes?: string;
}

export type UpdateStudentData = Partial<CreateStudentData>;

// ── Admin — Classes ───────────────────────────────────────────────────────────

/** Entidad Class tal como la devuelve el backend */
export interface Class {
  id: string;
  studentId: string;
  scheduledAt: string;              // ISO 8601
  duration: number;                 // minutos
  status: ClassStatus;
  appliedRate: string | null;       // Decimal como string, e.g. "45.00"
  chargeGenerated: boolean;
  notes: string | null;
  originalClassId: string | null;   // apunta a la clase reagendada de origen
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassData {
  studentId: string;
  scheduledAt: string;   // ISO 8601
  duration: number;      // minutos
  notes?: string;
}

export interface RescheduleClassData {
  scheduledAt: string;   // ISO 8601 — nueva fecha/hora
  notes?: string;
}

// ── Admin — Charges ───────────────────────────────────────────────────────────

/** Entidad Charge tal como la devuelve el backend */
export interface Charge {
  id: string;
  studentId: string;
  classId: string;
  amount: string;                   // Decimal como string, e.g. "45.00"
  financialStatus: FinancialStatus;
  generatedAt: string;              // ISO 8601
  promisedPaymentDate: string | null;
  paidAt: string | null;
  notes: string | null;
  packId: string | null;            // poblado cuando financialStatus = PACK_COVERED
  updatedAt: string;
}
/** Payload para PATCH /charges/:id/status */
export interface UpdateChargeStatusData {
  financialStatus: FinancialStatus;
  notes?: string;                   // obligatorio cuando financialStatus = DEFERRED
  promisedPaymentDate?: string;     // ISO 8601, opcional para DEFERRED
  packId?: string;                  // obligatorio cuando financialStatus = PACK_COVERED
}
// ── Admin — Packs ─────────────────────────────────────────────────────────────

/** Entidad Pack tal como la devuelve el backend */
export interface Pack {
  id: string;
  studentId: string;
  totalClasses: number;
  usedClasses: number;
  availableClasses: number;         // computado: totalClasses - usedClasses
  amountPaid: string;               // Decimal como string, e.g. "180.00"
  purchasedAt: string;              // ISO 8601
  expiresAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackData {
  studentId: string;
  totalClasses: number;
  amountPaid: number;      // se envía como number; Prisma lo convierte a Decimal

  expiresAt?: string;     // ISO 8601
  notes?: string;
}

// ── Admin — Dashboard ─────────────────────────────────────────────────────────

export interface DebtorSummary {
  studentId: string;
  fullName: string;
  totalDebt: number;      // ya convertido desde Decimal
  chargesCount: number;
}

export interface DeferredItem {
  chargeId: string;
  studentId: string;
  fullName: string;
  amount: number;               // ya convertido desde Decimal
  promisedPaymentDate: string;  // ISO 8601
}

export interface DashboardMetrics {
  totalPendingAmount: number;         // suma de PENDING_PAYMENT + DEFERRED + ABSENT_CHARGEABLE
  studentsWithDebt: number;
  activeDeferredPayments: number;
  taughtTodayUnpaid: number;
  overduePromises: number;            // DEFERRED donde promisedPaymentDate < ahora
  upcomingPromises: DeferredItem[];   // promesas dentro de los próximos 7 días
  topDebtors: DebtorSummary[];        // top 5 por monto pendiente
}

/** Alias por compatibilidad — preferir DashboardMetrics */
export type DashboardData = DashboardMetrics;
