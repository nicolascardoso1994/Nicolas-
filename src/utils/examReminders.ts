import { ExamAlert, ExamReminderConfig, StudyPlan } from '../types/study';

export const DEFAULT_REMINDER_CONFIG: ExamReminderConfig = {
  enabled: true,
  daysBefore: [7, 3, 1, 0],
  reminderTime: '09:00',
  browserNotifications: false,
};

export const REMINDER_MILESTONE_OPTIONS = [
  { days: 7, label: '7 días antes' },
  { days: 3, label: '3 días antes' },
  { days: 1, label: '1 día antes' },
  { days: 0, label: 'Día del examen' },
] as const;

export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToLocalDate(days: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.max(0, Math.round(days)));
  return toLocalDateString(d);
}

export function getDaysUntilExam(examDate?: string, now: Date = new Date()): number | null {
  if (!examDate) return null;
  const parts = examDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatSpanishExamDate(examDate?: string): string {
  if (!examDate) return 'Sin fecha';
  const parts = examDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return examDate;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return examDate;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function normalizeReminderConfig(config?: ExamReminderConfig): ExamReminderConfig {
  if (!config) {
    return { ...DEFAULT_REMINDER_CONFIG, daysBefore: [...DEFAULT_REMINDER_CONFIG.daysBefore] };
  }
  const days = Array.isArray(config.daysBefore)
    ? Array.from(new Set(config.daysBefore.filter((d) => Number.isFinite(d) && d >= 0))).sort(
        (a, b) => b - a
      )
    : [...DEFAULT_REMINDER_CONFIG.daysBefore];

  return {
    enabled: config.enabled ?? true,
    daysBefore: days,
    reminderTime: config.reminderTime || '09:00',
    browserNotifications: Boolean(config.browserNotifications),
  };
}

export function isReminderTimeReachedToday(reminderTime: string, now: Date = new Date()): boolean {
  const [hhRaw, mmRaw] = (reminderTime || '09:00').split(':').map(Number);
  const targetHours = Number.isFinite(hhRaw) ? hhRaw : 9;
  const targetMinutes = Number.isFinite(mmRaw) ? mmRaw : 0;
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const targetTotal = targetHours * 60 + targetMinutes;
  return currentTotal >= targetTotal;
}

export function computePlanProgressPct(plan: StudyPlan): number {
  const totalMinutes = plan.studyBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  if (totalMinutes <= 0) return 0;
  const completedMinutes = plan.studyBlocks
    .filter((b) => b.completed)
    .reduce((acc, b) => acc + b.durationMinutes, 0);
  return Math.round((completedMinutes / totalMinutes) * 100);
}

export function computeExamAlerts(plans: StudyPlan[], now: Date = new Date()): ExamAlert[] {
  const alerts: ExamAlert[] = [];

  for (const plan of plans) {
    const config = normalizeReminderConfig(plan.reminderConfig);
    if (!config.enabled || !plan.examDate || config.daysBefore.length === 0) {
      continue;
    }

    const daysRemaining = getDaysUntilExam(plan.examDate, now);
    if (daysRemaining === null || daysRemaining < 0) {
      continue;
    }

    const maxWindow = Math.max(...config.daysBefore);
    if (daysRemaining > maxWindow) {
      continue;
    }

    // Find the tightest active threshold covering daysRemaining
    const sortedAsc = [...config.daysBefore].sort((a, b) => a - b);
    const activeMilestone = sortedAsc.find((threshold) => daysRemaining <= threshold) ?? maxWindow;

    const completedPct = computePlanProgressPct(plan);
    const formattedDate = formatSpanishExamDate(plan.examDate);

    let urgency: ExamAlert['urgency'] = 'upcoming';
    let title = '';
    let message = '';

    if (daysRemaining === 0) {
      urgency = 'today';
      title = `Hoy rendís ${plan.subject}`;
      message = `${plan.examType} programado para hoy (${formattedDate}). Progreso de estudio: ${completedPct}%.`;
    } else if (daysRemaining === 1) {
      urgency = 'tomorrow';
      title = `Mañana es tu examen de ${plan.subject}`;
      message = `${plan.examType} el ${formattedDate}. Llevás ${completedPct}% del plan completado.`;
    } else if (daysRemaining <= 3) {
      urgency = 'soon';
      title = `Faltan ${daysRemaining} días para ${plan.subject}`;
      message = `${plan.examType} el ${formattedDate}. Avance actual: ${completedPct}% de los bloques.`;
    } else {
      urgency = 'upcoming';
      title = `En ${daysRemaining} días: ${plan.subject}`;
      message = `${plan.examType} el ${formattedDate}. Llevás ${completedPct}% del temario planificado.`;
    }

    alerts.push({
      id: `${plan.id}__${plan.examDate}__m${activeMilestone}`,
      planId: plan.id,
      subject: plan.subject,
      examType: plan.examType,
      examDate: plan.examDate,
      daysRemaining,
      urgency,
      title,
      message,
      completedPct,
      reminderTime: config.reminderTime,
    });
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export type BrowserNotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

export function getBrowserNotificationStatus(): BrowserNotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission || 'denied';
  }
}

export function triggerBrowserNotification(
  title: string,
  body: string,
  tag?: string
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      body,
      tag,
    });
    return true;
  } catch {
    return false;
  }
}
