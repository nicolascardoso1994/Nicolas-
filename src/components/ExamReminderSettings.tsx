import { useState } from 'react';
import { Bell, BellOff, BellRing, Calendar, Clock } from 'lucide-react';
import { ExamReminderConfig } from '../types/study';
import {
  REMINDER_MILESTONE_OPTIONS,
  addDaysToLocalDate,
  formatSpanishExamDate,
  getBrowserNotificationStatus,
  getDaysUntilExam,
  normalizeReminderConfig,
  requestBrowserNotificationPermission,
  toLocalDateString,
} from '../utils/examReminders';

interface ExamReminderSettingsProps {
  examDate?: string;
  reminderConfig?: ExamReminderConfig;
  showDateInput?: boolean;
  onUpdateExamDate?: (examDate: string) => void;
  onUpdateReminderConfig: (config: ExamReminderConfig) => void;
  onSendTestAlert: () => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
}

export function ExamReminderSettings({
  examDate,
  reminderConfig,
  showDateInput = true,
  onUpdateExamDate,
  onUpdateReminderConfig,
  onSendTestAlert,
  isReadingMode = false,
  isNightMode = false,
}: ExamReminderSettingsProps) {
  const config = normalizeReminderConfig(reminderConfig);
  const [browserPermission, setBrowserPermission] = useState(() =>
    getBrowserNotificationStatus()
  );
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);

  const todayStr = toLocalDateString(new Date());
  const daysUntil = getDaysUntilExam(examDate);

  const surfaceClass = isNightMode
    ? 'bg-[#171E2B] border-[#293549] text-[#E2E8F0]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#E4DCC8] text-[#241E18]'
      : 'bg-white border-slate-200 text-slate-900';

  const subSurfaceClass = isNightMode
    ? 'bg-[#1F2838] border-[#313F57]'
    : isReadingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';

  const dividerClass = isNightMode
    ? 'border-[#253042]'
    : isReadingMode
      ? 'border-[#E9E1CE]'
      : 'border-slate-100';

  const mutedText = isNightMode
    ? 'text-[#94A3B8]'
    : isReadingMode
      ? 'text-[#6E6254]'
      : 'text-slate-500';

  const headingText = isNightMode
    ? 'text-white'
    : isReadingMode
      ? 'text-[#241E18]'
      : 'text-slate-900';

  const toggleEnabled = () => {
    onUpdateReminderConfig({
      ...config,
      enabled: !config.enabled,
    });
  };

  const toggleMilestone = (days: number) => {
    const exists = config.daysBefore.includes(days);
    const nextDays = exists
      ? config.daysBefore.filter((d) => d !== days)
      : [...config.daysBefore, days].sort((a, b) => b - a);
    onUpdateReminderConfig({
      ...config,
      daysBefore: nextDays,
    });
  };

  const handleTimeChange = (value: string) => {
    onUpdateReminderConfig({
      ...config,
      reminderTime: value || '09:00',
    });
  };

  const handleEnableBrowserAlerts = async () => {
    setPermissionFeedback(null);
    const status = await requestBrowserNotificationPermission();
    setBrowserPermission(status);

    if (status === 'granted') {
      onUpdateReminderConfig({
        ...config,
        browserNotifications: true,
      });
      setPermissionFeedback('Avisos del navegador activados.');
    } else if (status === 'denied') {
      onUpdateReminderConfig({
        ...config,
        browserNotifications: false,
      });
      setPermissionFeedback(
        'El navegador o vista previa bloqueó las ventanas nativas; seguirás viendo alertas dentro de Códice.'
      );
    } else if (status === 'unsupported') {
      setPermissionFeedback(
        'Este navegador no admite notificaciones nativas; las alertas aparecerán dentro de la app.'
      );
    }
  };

  const toggleBrowserSetting = async () => {
    if (!config.browserNotifications) {
      if (browserPermission !== 'granted') {
        await handleEnableBrowserAlerts();
        return;
      }
      onUpdateReminderConfig({
        ...config,
        browserNotifications: true,
      });
    } else {
      onUpdateReminderConfig({
        ...config,
        browserNotifications: false,
      });
    }
  };

  const daysLabel =
    daysUntil === null
      ? 'Sin fecha asignada'
      : daysUntil < 0
        ? `Fecha pasada (${formatSpanishExamDate(examDate)})`
        : daysUntil === 0
          ? 'Hoy es el examen'
          : daysUntil === 1
            ? 'Falta 1 día'
            : `Faltan ${daysUntil} días`;

  return (
    <section className={`border rounded-xl p-5 space-y-4 transition-colors duration-200 ${surfaceClass}`}>
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b ${dividerClass}`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {config.enabled ? (
              <Bell className={`w-4 h-4 shrink-0 ${isNightMode ? 'text-[#7CB4FF]' : isReadingMode ? 'text-[#8B5220]' : 'text-blue-700'}`} />
            ) : (
              <BellOff className={`w-4 h-4 shrink-0 ${mutedText}`} />
            )}
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Recordatorios y alertas de examen
            </h3>
          </div>
          <p className={`text-xs ${mutedText}`}>
            {examDate
              ? `Fecha configurada: ${formatSpanishExamDate(examDate)} · ${daysLabel}`
              : 'Elegí la fecha del examen para activar avisos automáticos antes de rendir.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={toggleEnabled}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              config.enabled
                ? isNightMode
                  ? 'bg-[#1D2B42] border-[#344C73] text-[#F1F5F9]'
                  : isReadingMode
                    ? 'bg-[#EFE6D2] border-[#D8CBB0] text-[#3B2E1E]'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                : isNightMode
                  ? 'bg-[#1F2838] border-[#313F57] text-[#94A3B8]'
                  : isReadingMode
                    ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#6E6254]'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span>{config.enabled ? 'Alertas activas' : 'Alertas pausadas'}</span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                config.enabled
                  ? isReadingMode
                    ? 'bg-[#8B5220]'
                    : 'bg-blue-700'
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onSendTestAlert}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isNightMode
                ? 'bg-[#1F2838] border-[#313F57] text-[#CBD5E1] hover:bg-[#273247]'
                : isReadingMode
                  ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#3D352C] hover:bg-[#EAE1CC]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            Probar aviso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {showDateInput && onUpdateExamDate && (
          <div className={`lg:col-span-4 border rounded-lg p-3.5 space-y-2 ${subSurfaceClass}`}>
            <label
              htmlFor="planner-exam-date"
              className={`flex items-center gap-1.5 text-xs font-semibold ${headingText}`}
            >
              <Calendar className={`w-3.5 h-3.5 ${isNightMode ? 'text-[#7CB4FF]' : isReadingMode ? 'text-[#8B5220]' : 'text-blue-700'}`} />
              Fecha del examen
            </label>
            <input
              id="planner-exam-date"
              type="date"
              min={todayStr}
              value={examDate || ''}
              onChange={(e) => onUpdateExamDate(e.target.value)}
              className={`w-full px-3 py-1.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                isNightMode
                  ? 'bg-[#171E2B] border-[#374863] text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Mañana', days: 1 },
                { label: '3 días', days: 3 },
                { label: '7 días', days: 7 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => onUpdateExamDate(addDaysToLocalDate(preset.days))}
                  className={`px-2 py-1 text-[11px] font-medium border rounded transition-colors whitespace-nowrap shrink-0 ${
                    isNightMode
                      ? 'bg-[#171E2B] border-[#313F57] text-[#CBD5E1] hover:bg-[#253147]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={`${
            showDateInput && onUpdateExamDate ? 'lg:col-span-5' : 'lg:col-span-8'
          } border rounded-lg p-3.5 space-y-2.5 ${subSurfaceClass}`}
        >
          <span className={`text-xs font-semibold block ${headingText}`}>
            Cuándo enviarte recordatorios
          </span>
          <div className="flex flex-wrap gap-2">
            {REMINDER_MILESTONE_OPTIONS.map((opt) => {
              const selected = config.daysBefore.includes(opt.days);
              return (
                <button
                  key={opt.days}
                  type="button"
                  disabled={!config.enabled}
                  onClick={() => toggleMilestone(opt.days)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${
                    selected
                      ? isNightMode
                        ? 'bg-[#2563EB] border-[#3B82F6] text-white'
                        : isReadingMode
                          ? 'bg-[#8B5220] border-[#744318] text-[#FAF6EB]'
                          : 'bg-slate-900 border-slate-900 text-white'
                      : isNightMode
                        ? 'bg-[#171E2B] border-[#313F57] text-[#CBD5E1] hover:bg-[#253147]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {config.enabled && config.daysBefore.length === 0 && (
            <p className="text-[11px] text-amber-700">
              Seleccioná al menos un momento de aviso para activar las alertas.
            </p>
          )}
        </div>

        <div
          className={`${
            showDateInput && onUpdateExamDate ? 'lg:col-span-3' : 'lg:col-span-4'
          } border rounded-lg p-3.5 space-y-2.5 ${subSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="reminder-hour-input"
              className={`flex items-center gap-1.5 text-xs font-semibold ${headingText}`}
            >
              <Clock className={`w-3.5 h-3.5 ${mutedText}`} />
              Hora del aviso
            </label>
            <input
              id="reminder-hour-input"
              type="time"
              disabled={!config.enabled}
              value={config.reminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={`px-2 py-1 text-xs font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 ${
                isNightMode
                  ? 'bg-[#171E2B] border-[#374863] text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <button
            type="button"
            disabled={!config.enabled}
            onClick={toggleBrowserSetting}
            className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors disabled:opacity-50 ${
              config.browserNotifications && browserPermission === 'granted'
                ? isNightMode
                  ? 'bg-[#142923] border-[#244B3E] text-[#86EFAC]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isNightMode
                  ? 'bg-[#171E2B] border-[#313F57] text-[#CBD5E1] hover:bg-[#253147]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {config.browserNotifications && browserPermission === 'granted'
              ? 'Avisos del navegador activos'
              : 'Activar avisos del navegador'}
          </button>

          {permissionFeedback && (
            <p className={`text-[11px] leading-snug ${mutedText}`}>
              {permissionFeedback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
