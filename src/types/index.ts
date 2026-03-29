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

export type Currency = 'ARS' | 'EUR' | 'USD' | 'UYU' | 'BRL' | 'GBP' | 'OTHER';

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
  organizationId: string;
}

// ── Admin — Students ──────────────────────────────────────────────────────────

/** Entidad Student tal como la devuelve el backend */
export interface Student {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  classRate: string;            // Decimal serializado como string, e.g. "45.00"
  currency: Currency;           // moneda por defecto de los cargos
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
  currency?: Currency;
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
  currency: Currency;               // moneda heredada del alumno al momento de crear la clase
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
  currency: Currency;               // moneda del cargo (nunca mutable)
  paymentCurrency: Currency | null; // moneda en la que se recibió el pago (solo cuando PAID)
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
  paymentCurrency?: Currency;       // moneda de pago recibido (cuando financialStatus = PAID)
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
  currency: Currency;               // moneda del monto pagado
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
  currency?: Currency;
  expiresAt?: string;     // ISO 8601
  notes?: string;
}

// ── Admin — Dashboard ─────────────────────────────────────────────────────────

export interface DebtorSummary {
  studentId: string;
  fullName: string;
  totalDebt: number;      // ya convertido desde Decimal (suma multi-moneda, solo referencial)
  chargesCount: number;
}

export interface DebtorSummaryByCurrency {
  studentId: string;
  fullName: string;
  currency: Currency;
  totalDebt: number;
  chargesCount: number;
}

export interface PendingByCurrencyItem {
  currency: Currency;
  amount: number;
}

export interface DeferredItem {
  chargeId: string;
  studentId: string;
  fullName: string;
  amount: number;               // ya convertido desde Decimal
  promisedPaymentDate: string;  // ISO 8601
}

export interface DashboardMetrics {
  totalPendingAmount: number;                     // suma multi-moneda (solo referencial)
  pendingByCurrency: PendingByCurrencyItem[];     // deuda pendiente desglosada por moneda
  studentsWithDebt: number;
  activeDeferredPayments: number;
  taughtTodayUnpaid: number;
  overduePromises: number;                        // DEFERRED donde promisedPaymentDate < ahora
  upcomingPromises: DeferredItem[];               // promesas dentro de los próximos 7 días
  topDebtors: DebtorSummary[];                    // top 5 por monto (multi-moneda, referencial)
  topDebtorsByCurrency: DebtorSummaryByCurrency[]; // top deudores por (alumno, moneda)
}

/** Alias por compatibilidad — preferir DashboardMetrics */
export type DashboardData = DashboardMetrics;

// ── Admin — Analytics ───────────────────────────────────────────────────────

export interface CurrencyAmount {
  currency: Currency;
  amount: number;
}

export interface MonthlyRevenueSummary {
  month: string; // YYYY-MM
  chargesCount: number;
  paidCount: number;
  pendingCount: number;
  waivedCount: number;
  packCoveredCount: number;
  paidByCurrency: CurrencyAmount[];
  pendingByCurrency: CurrencyAmount[];
}

export interface MonthlyClassSummary {
  month: string; // YYYY-MM
  total: number;
  taught: number;
  cancelled: number;
  absent: number;
  rescheduled: number;
  scheduled: number;
}

export interface ChargeStatusEntry {
  financialStatus: FinancialStatus;
  count: number;
  totalByCurrency: CurrencyAmount[];
}

export interface StudentRevenueSummary {
  studentId: string;
  fullName: string;
  chargesCount: number;
  paidCount: number;
  pendingCount: number;
  generatedByCurrency: CurrencyAmount[];
  paidByCurrency: CurrencyAmount[];
  pendingByCurrency: CurrencyAmount[];
}

export interface AnalyticsMetrics {
  period: { from: string; to: string };
  revenueByMonth: MonthlyRevenueSummary[];
  classesByMonth: MonthlyClassSummary[];
  chargeStatusBreakdown: ChargeStatusEntry[];
  studentBreakdown: StudentRevenueSummary[];
}

/** Alias por compatibilidad — preferir AnalyticsMetrics */
export type AnalyticsData = AnalyticsMetrics;

// ── Admin — Schedules ─────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** Entidad Schedule tal como la devuelve el backend */
export interface Schedule {
  id: string;
  studentId: string;
  daysOfWeek: DayOfWeek[];
  timeOfDay: string;          // "HH:MM" (UTC)
  duration: number;           // minutos
  appliedRate: string | null; // Decimal como string; null = usa la tarifa del alumno
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleData {
  studentId: string;
  daysOfWeek: DayOfWeek[];
  timeOfDay: string;     // "HH:MM"
  duration: number;
  appliedRate?: string;
  notes?: string;
}

export type UpdateScheduleData = Partial<CreateScheduleData & { isActive: boolean }>;

export interface GenerateClassesData {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD (max 90 days range)
}
