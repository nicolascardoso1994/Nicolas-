import { useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  CheckCheck,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
import { ExamAlert, StudyPlan, StudyTab } from '../types/study';
import {
  formatSpanishExamDate,
  getDaysUntilExam,
  normalizeReminderConfig,
} from '../utils/examReminders';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  alerts: ExamAlert[];
  readAlertIds: string[];
  plans: StudyPlan[];
  onMarkRead: (alertId: string) => void;
  onMarkAllRead: () => void;
  onNavigatePlanTab: (planId: string, tab: StudyTab) => void;
  onSendTestAlert: () => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
}

export function NotificationsPanel({
  open,
  onClose,
  alerts,
  readAlertIds,
  plans,
  onMarkRead,
  onMarkAllRead,
  onNavigatePlanTab,
  onSendTestAlert,
  isReadingMode = false,
  isNightMode = false,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        const trigger = document.getElementById('notifications-trigger-btn');
        if (trigger && trigger.contains(target)) return;
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = alerts.filter((a) => !readAlertIds.includes(a.id)).length;

  const panelSurface = isNightMode
    ? 'bg-[#171E2B] border-[#2C384E] text-[#E2E8F0]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#DFD5BE] text-[#241E18]'
      : 'bg-white border-slate-200 text-slate-900';

  const cardSurface = isNightMode
    ? 'bg-[#1F2838] border-[#313F57]'
    : isReadingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';

  const dividerClass = isNightMode
    ? 'border-[#253042]'
    : isReadingMode
      ? 'border-[#E9E1CE]'
      : 'border-slate-200';

  const mutedText = isNightMode
    ? 'text-[#94A3B8]'
    : isReadingMode
      ? 'text-[#6E6254]'
      : 'text-slate-500';

  const urgencyTextColor = (urgency: ExamAlert['urgency']) => {
    if (urgency === 'today') return isNightMode ? 'text-red-300' : 'text-red-700';
    if (urgency === 'tomorrow') return isNightMode ? 'text-amber-300' : 'text-amber-700';
    return isNightMode ? 'text-[#7CB4FF]' : isReadingMode ? 'text-[#8B5220]' : 'text-blue-700';
  };

  const plansWithDates = [...plans].sort((a, b) => {
    const da = getDaysUntilExam(a.examDate);
    const db = getDaysUntilExam(b.examDate);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Centro de recordatorios de examen"
      className={`fixed right-3 sm:right-6 top-[76px] z-40 w-[calc(100vw-1.5rem)] sm:w-[420px] max-h-[calc(100vh-6rem)] flex flex-col border rounded-xl shadow-2xl overflow-hidden ${panelSurface}`}
    >
      {/* Header */}
      <div className={`px-4 py-3.5 border-b flex items-center justify-between gap-2 ${dividerClass}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Bell
            className={`w-4 h-4 shrink-0 ${
              isNightMode ? 'text-[#7CB4FF]' : isReadingMode ? 'text-[#8B5220]' : 'text-blue-700'
            }`}
          />
          <h2 className="text-sm font-semibold truncate">
            Alertas y próximos exámenes
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                isNightMode
                  ? 'text-[#93C5FD] hover:bg-[#1F2838]'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar leídas
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de notificaciones"
            className={`p-1 rounded-md transition-colors ${
              isNightMode ? 'text-[#94A3B8] hover:bg-[#1F2838]' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Active alerts within reminder window */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-xs font-semibold ${mutedText}`}>
              Alertas activas ({alerts.length})
            </h3>
            <button
              type="button"
              onClick={onSendTestAlert}
              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                isNightMode ? 'text-[#7CB4FF] hover:text-[#93C5FD]' : 'text-blue-700 hover:text-blue-800'
              }`}
            >
              <BellRing className="w-3 h-3" />
              Probar alerta
            </button>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2.5">
              {alerts.map((alert) => {
                const isRead = readAlertIds.includes(alert.id);
                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-3.5 space-y-2 transition-opacity ${cardSurface} ${
                      isRead ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold">
                          <span className={urgencyTextColor(alert.urgency)}>
                            {alert.daysRemaining === 0
                              ? 'Hoy'
                              : alert.daysRemaining === 1
                                ? 'Mañana'
                                : `En ${alert.daysRemaining} días`}
                          </span>
                          <span className={mutedText} aria-hidden="true">
                            ·
                          </span>
                          <span className={mutedText}>
                            {formatSpanishExamDate(alert.examDate)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-snug">
                          {alert.title}
                        </p>
                      </div>

                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(alert.id)}
                          className={`text-[11px] font-medium shrink-0 ${mutedText} hover:underline`}
                        >
                          Leída
                        </button>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onMarkRead(alert.id);
                          onNavigatePlanTab(alert.planId, 'exam');
                          onClose();
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                          isNightMode
                            ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                            : isReadingMode
                              ? 'bg-[#8B5220] text-[#FAF6EB] hover:bg-[#744318]'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        Repaso de examen
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onMarkRead(alert.id);
                          onNavigatePlanTab(alert.planId, 'plan');
                          onClose();
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap ${
                          isNightMode
                            ? 'border-[#374863] text-[#CBD5E1] hover:bg-[#253147]'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Abrir planificador
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`border rounded-lg p-4 text-xs ${cardSurface} ${mutedText}`}>
              No tenés alertas inmediatas dentro de tus ventanas de aviso. Podés ajustar cuándo recibir avisos desde el <strong>Planificador</strong> de cada materia.
            </div>
          )}
        </div>

        {/* Scheduled Exams Overview across all plans */}
        <div className={`pt-4 border-t space-y-2.5 ${dividerClass}`}>
          <h3 className={`text-xs font-semibold ${mutedText}`}>
            Fechas configuradas por materia
          </h3>
          <div className="space-y-2">
            {plansWithDates.map((p) => {
              const days = getDaysUntilExam(p.examDate);
              const cfg = normalizeReminderConfig(p.reminderConfig);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onNavigatePlanTab(p.id, 'plan');
                    onClose();
                  }}
                  className={`w-full text-left border rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${cardSurface} ${
                    isNightMode ? 'hover:bg-[#253147]' : 'hover:border-blue-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{p.subject}</p>
                    <p className={`text-[11px] flex items-center gap-1.5 mt-0.5 ${mutedText}`}>
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>
                        {p.examDate ? formatSpanishExamDate(p.examDate) : 'Sin fecha'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{cfg.enabled ? `Aviso ${cfg.reminderTime}` : 'Pausado'}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-mono tabular-nums font-semibold shrink-0 ${
                      days !== null && days <= 1 && days >= 0
                        ? 'text-amber-700'
                        : mutedText
                    }`}
                  >
                    {days === null
                      ? 'Configurar'
                      : days < 0
                        ? 'Pasado'
                        : days === 0
                          ? 'Hoy'
                          : `${days}d`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
