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

export type ClassType = 'INDIVIDUAL' | 'GROUP';

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

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'DIGITAL_WALLET' | 'OTHER';

// ── Organization ──────────────────────────────────────────────────────────────

export type VocabularyPreset = 'EDUCATION' | 'HEALTH' | 'FITNESS' | 'COACHING' | 'GENERIC';

/** Etiquetas de nombre resueltas server-side desde el preset activo */
export interface VocabularyLabels {
  studentSingular: string; // e.g. "alumno", "paciente", "atleta", "cliente"
  studentPlural: string;   // e.g. "alumnos", "pacientes"
  sessionSingular: string; // e.g. "clase", "consulta", "sesión"
  sessionPlural: string;   // e.g. "clases", "consultas"
}

export interface Organization {
  id: string;
  name: string;
  timezone: string;            // IANA tz string, e.g. "America/Buenos_Aires"
  notificationEmail: string | null;
  dailyBriefingHour: number;   // hora local 0–23
  vocabularyPreset: VocabularyPreset; // default: "EDUCATION"
  vocabularyLabels: VocabularyLabels; // computado server-side, no almacenado
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface UpdateOrganizationData {
  name?: string;
  timezone?: string;           // IANA tz string
  vocabularyPreset?: VocabularyPreset;
  notificationEmail?: string | null;
  dailyBriefingHour?: number;
}

export interface OrganizationMember {
  id: string; // membership cuid
  userId: string;
  role: UserRole;
  createdAt: string; // ISO 8601
}

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
  classType: ClassType;             // INDIVIDUAL (default) o GROUP
  studentId: string | null;         // null para clases GROUP
  scheduledAt: string;              // ISO 8601
  duration: number;                 // minutos
  status: ClassStatus;
  appliedRate: string | null;       // Decimal como string, e.g. "45.00" (INDIVIDUAL)
  currency: Currency;               // moneda heredada del alumno al momento de crear la clase
  chargeGenerated: boolean;
  notes: string | null;
  originalClassId: string | null;   // apunta a la clase reagendada de origen
  createdAt: string;
  updatedAt: string;
}

export interface ClassParticipant {
  id: string;
  classId: string;
  studentId: string;
  appliedRate: string | null;       // tarifa por participante (override del classRate del alumno)
  attendance: "PRESENT" | "ABSENT"; // default "PRESENT"; se puede cambiar mientras la clase está SCHEDULED
  effectiveRate: string;            // appliedRate ?? student.classRate — siempre tiene valor
  createdAt: string;                // ISO 8601
  student: {
    fullName: string;
    classRate: string;
    currency: Currency;
  };
}

export interface AddParticipantData {
  studentId: string;
  appliedRate?: number;             // override de tarifa opcional
}

export interface CreateClassData {
  classType?: ClassType;            // omitir = INDIVIDUAL
  studentId?: string;               // obligatorio para INDIVIDUAL, omitir para GROUP
  participants?: { studentId: string; appliedRate?: number }[]; // mínimo 1 para GROUP
  scheduledAt: string;              // ISO 8601
  duration: number;                 // minutos
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
  amount: string;                     // Decimal como string, e.g. "45.00"
  currency: Currency;                 // moneda del cargo (nunca mutable)
  paymentCurrency: Currency | null;   // moneda en la que se recibió el pago (solo cuando PAID)
  paymentMethod: PaymentMethod | null; // cómo se recibió el pago (solo cuando PAID)
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
  notes?: string;                    // obligatorio cuando financialStatus = DEFERRED
  promisedPaymentDate?: string;      // ISO 8601, opcional para DEFERRED
  packId?: string;                   // obligatorio cuando financialStatus = PACK_COVERED
  paymentCurrency?: Currency;        // moneda de pago recibido (cuando financialStatus = PAID)
  paymentMethod?: PaymentMethod;     // método de pago (cuando financialStatus = PAID)
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
  currency: Currency;
  promisedPaymentDate: string;  // ISO 8601
}

export interface TodayRevenueByCurrency {
  currency: Currency;
  amount: number;
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
  todayScheduledCount: number;                    // clases SCHEDULED hoy (timezone de la org)
  todayExpectedRevenueByCurrency: TodayRevenueByCurrency[]; // ingresos esperados de las clases de hoy
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

/** Un slot de horario: un día de la semana + hora específica */
export interface ScheduleSlot {
  id: string;
  scheduleId: string;
  dayOfWeek: DayOfWeek;
  timeOfDay: string; // "HH:MM" 24h — hora local del timezone de la organización
}

/** Entidad Schedule tal como la devuelve el backend */
export interface Schedule {
  id: string;
  classType: ClassType;       // INDIVIDUAL (default) | GROUP
  studentId: string | null;   // null para schedules GROUP
  slots: ScheduleSlot[];  // uno por cada (día, hora) — permite horarios distintos por día
  duration: number;           // minutos
  appliedRate: string | null; // Decimal como string; null = usa la tarifa del alumno
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSlotInput {
  dayOfWeek: DayOfWeek;
  timeOfDay: string; // "HH:MM"
}

export interface CreateScheduleData {
  classType?: ClassType;      // INDIVIDUAL (default) | GROUP
  studentId?: string;         // requerido para INDIVIDUAL, omitir para GROUP
  slots: ScheduleSlotInput[];
  duration: number;
  appliedRate?: string;
  notes?: string;
}

export type UpdateScheduleData = Partial<Omit<CreateScheduleData, 'studentId'> & { isActive: boolean }>;

export interface GenerateClassesData {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD (max 90 days range)
}

/** Respuesta de POST /schedules/:id/generate */
export interface GenerateResult {
  generated: number;
  restored: number;  // clases CANCELLED reactivadas a SCHEDULED
  skipped: number;
  classes: Class[];
}

// ── Portal del Alumno ─────────────────────────────────────────────────────────

/** Respuesta de POST /students/:id/portal-token */
export interface PortalTokenData {
  portalToken: string;
}

/** Perfil del alumno — GET /portal/me (campos internos omitidos) */
export interface PortalProfile {
  id: string;
  fullName: string;
  modality: ClassModality;
  classDuration: number | null;
  weeklyFrequency: number | null;
  currency: Currency;
  isActive: boolean;
}

/** Clase visible para el alumno — GET /portal/classes (sin appliedRate) */
export interface PortalClass {
  id: string;
  scheduledAt: string;   // ISO 8601
  duration: number;       // minutos
  status: ClassStatus;
  classType: ClassType;
  notes: string | null;
  createdAt: string;
}

/** Cargo visible para el alumno — GET /portal/charges (sin notes interno) */
export interface PortalCharge {
  id: string;
  classId: string;
  amount: string;                   // Decimal como string
  currency: Currency;
  paymentCurrency: Currency | null;
  paymentMethod: PaymentMethod | null;
  financialStatus: FinancialStatus;
  generatedAt: string;
  promisedPaymentDate: string | null;
  paidAt: string | null;
}

/** Pack visible para el alumno — GET /portal/packs (sin amountPaid) */
export interface PortalPack {
  id: string;
  totalClasses: number;
  usedClasses: number;
  availableClasses: number;
  currency: Currency;
  purchasedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}
