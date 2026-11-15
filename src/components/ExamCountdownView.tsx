import { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  CheckSquare,
  MinusCircle,
  RefreshCw,
  BookOpenText,
  Moon,
} from 'lucide-react';
import { AdaptiveExamSummary, ExamReminderConfig, ExamUrgencyTier, StudyPlan } from '../types/study';
import { MathText } from './MathText';
import { RevealableFormula } from './RevealableFormula';
import { VisualDiagramCard } from './VisualDiagramCard';
import { ExamReminderSettings } from './ExamReminderSettings';

interface ExamCountdownViewProps {
  plan: StudyPlan;
  onUpdateExamDate: (examDate: string) => void;
  onUpdateReminderConfig: (config: ExamReminderConfig) => void;
  onSendTestAlert: () => void;
  onSaveAdaptiveSummary: (summary: AdaptiveExamSummary, examDate: string) => void;
  readingMode?: boolean;
  onToggleReadingMode?: () => void;
  nightMode?: boolean;
  onToggleNightMode?: () => void;
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysFromToday(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toLocalDateInputValue(d);
}

function calculateDaysRemaining(examDateStr: string): number {
  if (!examDateStr) return 3;
  const [y, m, d] = examDateStr.split('-').map(Number);
  if (!y || !m || !d) return 3;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function getTierMeta(daysRemaining: number): {
  tier: ExamUrgencyTier;
  label: string;
  description: string;
  badgeStyle: string;
} {
  if (daysRemaining <= 1) {
    return {
      tier: 'emergencia',
      label: 'Modo Emergencia (≤ 24 h)',
      description: 'Resumen ultra-condensado 80/20: solo lo indispensable para aprobar.',
      badgeStyle: 'text-red-800 bg-red-50 border-red-200',
    };
  }
  if (daysRemaining <= 4) {
    return {
      tier: 'sprint',
      label: 'Sprint Táctico (2–4 días)',
      description: 'Priorización de conceptos de mayor peso, fórmulas clave y errores típicos.',
      badgeStyle: 'text-amber-800 bg-amber-50 border-amber-200',
    };
  }
  if (daysRemaining <= 10) {
    return {
      tier: 'consolidacion',
      label: 'Consolidación (5–10 días)',
      description: 'Resumen universitario completo conectado con criterios de aplicación y práctica.',
      badgeStyle: 'text-blue-800 bg-blue-50 border-blue-200',
    };
  }
  return {
    tier: 'profundo',
    label: 'Dominio Profundo (> 10 días)',
    description: 'Cobertura integral con rigor académico, casos límite y repaso espaciado.',
    badgeStyle: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  };
}

export function ExamCountdownView({
  plan,
  onUpdateExamDate,
  onUpdateReminderConfig,
  onSendTestAlert,
  onSaveAdaptiveSummary,
  readingMode: controlledReadingMode,
  onToggleReadingMode,
  nightMode: controlledNightMode,
  onToggleNightMode,
}: ExamCountdownViewProps) {
  const defaultDate = plan.examDate || addDaysFromToday(3);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [hoursPerDay, setHoursPerDay] = useState<number>(
    plan.adaptiveSummary?.hoursPerDay ?? plan.hoursPerDay ?? 2.5
  );
  const [includeTimeDistribution, setIncludeTimeDistribution] = useState<boolean>(false);
  const [showTimeDistribution, setShowTimeDistribution] = useState<boolean>(false);
  const [loadingTimeAdvice, setLoadingTimeAdvice] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedFormulaIndices, setRevealedFormulaIndices] = useState<number[]>([]);
  const [localReadingMode, setLocalReadingMode] = useState(false);
  const [localNightMode, setLocalNightMode] = useState(false);

  const isReadingMode =
    controlledReadingMode !== undefined ? controlledReadingMode : localReadingMode;
  const isNightMode =
    controlledNightMode !== undefined ? controlledNightMode : localNightMode;

  const handleToggleReadingMode = () => {
    if (onToggleReadingMode) {
      onToggleReadingMode();
    } else {
      setLocalReadingMode((prev) => {
        const next = !prev;
        if (next) setLocalNightMode(false);
        return next;
      });
    }
  };

  const handleToggleNightMode = () => {
    if (onToggleNightMode) {
      onToggleNightMode();
    } else {
      setLocalNightMode((prev) => {
        const next = !prev;
        if (next) setLocalReadingMode(false);
        return next;
      });
    }
  };

  const daysRemaining = useMemo(
    () => calculateDaysRemaining(selectedDate),
    [selectedDate]
  );

  const effectiveDays = daysRemaining === 0 ? 0.5 : daysRemaining;
  const totalEffectiveHours = Math.round(effectiveDays * hoursPerDay * 10) / 10;
  const tierMeta = getTierMeta(daysRemaining);

  const todayStr = toLocalDateInputValue(new Date());

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    onUpdateExamDate(newDate);
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/adaptive-exam-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: plan.subject,
          examType: plan.examType,
          examDate: selectedDate,
          daysRemaining,
          hoursPerDay,
          includeTimeDistribution,
          executiveSummary: plan.executiveSummary,
          keyConcepts: plan.keyConcepts,
          formulas: plan.formulas,
          examTraps: plan.examTraps,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo generar el resumen adaptado.');
      }
      onSaveAdaptiveSummary(data, selectedDate);
      setShowTimeDistribution(includeTimeDistribution && Boolean(data.timeAllocationAdvice));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTimeDistribution = async () => {
    if (!plan.adaptiveSummary) return;

    if (showTimeDistribution) {
      setShowTimeDistribution(false);
      return;
    }

    if (plan.adaptiveSummary.timeAllocationAdvice) {
      setShowTimeDistribution(true);
      return;
    }

    setError(null);
    setLoadingTimeAdvice(true);
    try {
      const response = await fetch('/api/time-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: plan.subject,
          examType: plan.examType,
          daysRemaining,
          hoursPerDay,
          priorityTopics: plan.adaptiveSummary.priorityTopics,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo calcular la distribución del tiempo.');
      }
      onSaveAdaptiveSummary(
        {
          ...plan.adaptiveSummary,
          timeAllocationAdvice: data.advice,
        },
        selectedDate
      );
      setShowTimeDistribution(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar distribución de tiempo.');
    } finally {
      setLoadingTimeAdvice(false);
    }
  };

  const summary = plan.adaptiveSummary;
  const isOutOfSync =
    summary &&
    (summary.examDate !== selectedDate ||
      summary.hoursPerDay !== hoursPerDay ||
      summary.daysRemaining !== daysRemaining);

  const orderedSections = summary?.summarySections ?? [];

  return (
    <div className="space-y-6">
      {/* Configuration & Countdown Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Fecha del próximo examen y resumen según tiempo disponible
            </h2>
            <p className="text-sm text-slate-500">
              Indicá cuándo rendís y cuántas horas reales tenés por día: la densidad y prioridad del resumen se recalibran automáticamente.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading
              ? 'Calibrando resumen...'
              : summary
                ? 'Actualizar resumen para este tiempo'
                : 'Generar resumen según tiempo'}
          </button>
        </div>

        {/* Inputs & Live Countdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <label
              htmlFor="exam-date-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Fecha del examen
            </label>
            <input
              id="exam-date-input"
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Mañana', days: 1 },
                { label: '3 días', days: 3 },
                { label: '7 días', days: 7 },
                { label: '14 días', days: 14 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => handleDateChange(addDaysFromToday(preset.days))}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <label
              htmlFor="exam-hours-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              Horas disponibles por día
            </label>
            <div className="flex items-center gap-2">
              <input
                id="exam-hours-input"
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) =>
                  setHoursPerDay(Math.max(0.5, Math.min(16, Number(e.target.value) || 0.5)))
                }
                className="w-24 px-3 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs text-slate-600">h / día</span>
            </div>
            <p className="text-xs text-slate-500">
              Ajustá tus horas reales para medir el alcance del temario.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Cuenta regresiva real
            </span>
            <div>
              <p className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {daysRemaining === 0
                  ? 'Hoy'
                  : daysRemaining === 1
                    ? '1 día'
                    : `${daysRemaining} días`}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {totalEffectiveHours} h útiles disponibles
              </p>
            </div>
          </div>

          <div className={`border rounded-xl p-4 flex flex-col justify-between ${tierMeta.badgeStyle}`}>
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Estrategia automática
            </span>
            <div className="mt-2">
              <p className="text-sm font-semibold">{tierMeta.label}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-snug">
                {tierMeta.description}
              </p>
            </div>
          </div>
        </div>

        {/* Optional Time Distribution preference */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTimeDistribution}
              onChange={(e) => setIncludeTimeDistribution(e.target.checked)}
              className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            Incluir sugerencia de cómo distribuir el tiempo restante al generar
          </label>
        </div>

        {isOutOfSync && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-950">
            <span>
              Cambiaste la fecha o tus horas disponibles (ahora tenés{' '}
              <strong className="font-mono tabular-nums">{totalEffectiveHours} h</strong> en{' '}
              {daysRemaining === 0 ? 'menos de 24 h' : `${daysRemaining} día(s)`}). Actualizá el resumen para ajustar el recorte de temas.
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="px-3 py-1.5 font-medium bg-amber-900 text-white rounded-md hover:bg-amber-950 transition-colors whitespace-nowrap shrink-0"
            >
              Recalibrar ahora
            </button>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
      </section>

      <ExamReminderSettings
        examDate={selectedDate}
        reminderConfig={plan.reminderConfig}
        showDateInput={false}
        onUpdateReminderConfig={onUpdateReminderConfig}
        onSendTestAlert={onSendTestAlert}
        isReadingMode={isReadingMode}
        isNightMode={isNightMode}
      />

      {/* Generated Adaptive Summary */}
      {summary ? (
        <div
          className={`space-y-6 transition-colors duration-200 ${
            isNightMode
              ? 'night-mode bg-[#111722] border border-[#242F42] rounded-2xl p-4 sm:p-6'
              : isReadingMode
                ? 'reading-serif bg-[#F6F0E2] border border-[#E4DCC8] rounded-2xl p-4 sm:p-6'
                : ''
          }`}
        >
          {/* Ordered Summary Card */}
          <section
            className={`border rounded-xl p-6 space-y-6 transition-colors duration-200 ${
              isNightMode
                ? 'bg-[#171E2B] border-[#293549]'
                : isReadingMode
                  ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                  : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b ${
                isNightMode
                  ? 'border-[#253042]'
                  : isReadingMode
                    ? 'border-[#E9E1CE]'
                    : 'border-slate-100'
              }`}
            >
              <div>
                <p
                  className={`text-xs font-medium ${
                    isNightMode
                      ? 'text-[#7CB4FF]'
                      : isReadingMode
                        ? 'text-[#8B5220]'
                        : 'text-blue-700'
                  }`}
                >
                  Calibrado para {summary.daysRemaining === 0 ? 'hoy' : `${summary.daysRemaining} día(s)`} · {summary.totalEffectiveHours} h útiles
                </p>
                <h3
                  className={`text-lg font-semibold mt-0.5 ${
                    isNightMode
                      ? 'text-[#F1F5F9]'
                      : isReadingMode
                        ? 'text-[#241E18]'
                        : 'text-slate-900'
                  }`}
                >
                  {summary.strategyTitle}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isReadingMode}
                  onClick={handleToggleReadingMode}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 font-sans ${
                    isReadingMode
                      ? 'bg-[#EFE6D2] border-[#D8CBB0] text-[#3B2E1E]'
                      : isNightMode
                        ? 'bg-[#1E2636] border-[#2F3C52] text-[#CBD5E1] hover:bg-[#253044]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookOpenText
                    className={`w-3.5 h-3.5 ${
                      isReadingMode
                        ? 'text-[#8B5220]'
                        : isNightMode
                          ? 'text-[#94A3B8]'
                          : 'text-slate-500'
                    }`}
                  />
                  <span>Modo Lectura</span>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      isReadingMode
                        ? 'bg-[#8B5220]'
                        : isNightMode
                          ? 'bg-[#334155]'
                          : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isReadingMode ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isNightMode}
                  onClick={handleToggleNightMode}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 font-sans ${
                    isNightMode
                      ? 'bg-[#222E44] border-[#3B4F72] text-[#F1F5F9]'
                      : isReadingMode
                        ? 'bg-[#FAF6EB] border-[#DFD6BF] text-[#4A4035] hover:bg-[#EFE6D2]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Moon
                    className={`w-3.5 h-3.5 ${
                      isNightMode
                        ? 'text-[#7CB4FF]'
                        : isReadingMode
                          ? 'text-[#6E6254]'
                          : 'text-slate-500'
                    }`}
                  />
                  <span>Modo Nocturno</span>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      isNightMode ? 'bg-[#3B82F6]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isNightMode ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>

                {/* Optional on-demand Time Distribution toggle/request button */}
                <button
                  type="button"
                  disabled={loadingTimeAdvice}
                  onClick={handleRequestTimeDistribution}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap shrink-0 font-sans ${
                    isNightMode
                      ? 'border-[#313F57] text-[#CBD5E1] bg-[#1F2838] hover:bg-[#273247]'
                      : isReadingMode
                        ? 'border-[#DFD6BF] text-[#3D352C] bg-[#F2ECDC] hover:bg-[#EAE1CC]'
                        : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {loadingTimeAdvice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        isNightMode
                          ? 'text-[#7CB4FF]'
                          : isReadingMode
                            ? 'text-[#8B5220]'
                            : 'text-blue-700'
                      }`}
                    />
                  )}
                  {loadingTimeAdvice
                    ? 'Calculando distribución...'
                    : showTimeDistribution
                      ? 'Ocultar distribución de tiempo'
                      : '¿Cómo distribuir mi tiempo restante?'}
                </button>
              </div>
            </div>

            {/* Shown strictly when user requested it */}
            {showTimeDistribution && summary.timeAllocationAdvice && (
              <div
                className={`border rounded-lg p-4 text-sm leading-relaxed ${
                  isNightMode
                    ? 'bg-[#1F2838] border-[#313F57] text-[#CBD5E1]'
                    : isReadingMode
                      ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#3D352C]'
                      : 'bg-blue-50/50 border-blue-200 text-slate-700'
                }`}
              >
                <strong
                  className={`block mb-1 ${
                    isNightMode
                      ? 'text-[#F1F5F9]'
                      : isReadingMode
                        ? 'text-[#241E18]'
                        : 'text-slate-900'
                  }`}
                >
                  Sugerencia para distribuir tu tiempo restante:
                </strong>
                <MathText text={summary.timeAllocationAdvice} />
              </div>
            )}

            {summary.compressedSummary && (
              <p
                className={`${
                  isNightMode
                    ? 'text-sm md:text-base text-[#CBD5E1] leading-[1.75] max-w-4xl'
                    : isReadingMode
                      ? 'text-base md:text-[17px] text-[#4A4035] leading-[1.8] max-w-[68ch]'
                      : 'text-sm md:text-base text-slate-600 leading-relaxed max-w-4xl'
                }`}
              >
                <MathText text={summary.compressedSummary} />
              </p>
            )}

            {/* Ordered Numbered Summary Sections with Title Above & Standalone Bold Equations */}
            {orderedSections.length > 0 && (
              <div className="space-y-6 pt-2">
                {orderedSections.map((sec, idx) => (
                  <article
                    key={idx}
                    className={`space-y-2.5 pb-5 border-b last:border-b-0 last:pb-0 ${
                      isNightMode
                        ? 'border-[#253042]'
                        : isReadingMode
                          ? 'border-[#E9E1CE]'
                          : 'border-slate-100'
                    }`}
                  >
                    <h4
                      className={`font-semibold ${
                        isNightMode
                          ? 'text-base text-[#F1F5F9]'
                          : isReadingMode
                            ? 'text-lg md:text-xl text-[#241E18]'
                            : 'text-base text-slate-900'
                      }`}
                    >
                      {sec.order}. {sec.title}
                    </h4>
                    <p
                      className={`${
                        isNightMode
                          ? 'text-sm md:text-base text-[#CBD5E1] leading-[1.75] max-w-4xl'
                          : isReadingMode
                            ? 'text-base md:text-[17px] text-[#3D352C] leading-[1.82] max-w-[68ch]'
                            : 'text-sm md:text-base text-slate-700 leading-relaxed max-w-4xl'
                      }`}
                    >
                      <MathText text={sec.content} />
                    </p>
                    {sec.formulaLatex && (
                      <RevealableFormula
                        key={`${plan.id}-adaptive-sec-${sec.order}`}
                        latex={sec.formulaLatex}
                        caption={sec.formulaCaption}
                        bold={true}
                        isReadingMode={isReadingMode}
                        isNightMode={isNightMode}
                      />
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Priority Topics & Must-Memorize Formulas / Visual Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section
              className={`${
                summary.mustMemorizeFormulas.length > 0 || (plan.visualExamples?.length ?? 0) > 0
                  ? 'lg:col-span-7'
                  : 'lg:col-span-12'
              } border rounded-xl overflow-hidden transition-colors duration-200 ${
                isNightMode
                  ? 'bg-[#171E2B] border-[#293549]'
                  : isReadingMode
                    ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`px-5 py-4 border-b ${
                  isNightMode
                    ? 'border-[#253042]'
                    : isReadingMode
                      ? 'border-[#E9E1CE]'
                      : 'border-slate-200'
                }`}
              >
                <h3
                  className={`text-base font-semibold ${
                    isNightMode
                      ? 'text-white'
                      : isReadingMode
                        ? 'text-[#241E18]'
                        : 'text-slate-900'
                  }`}
                >
                  Temas ordenados por rentabilidad de examen
                </h3>
                <p
                  className={`text-xs ${
                    isNightMode
                      ? 'text-[#94A3B8]'
                      : isReadingMode
                        ? 'text-[#6E6254]'
                        : 'text-slate-500'
                  }`}
                >
                  Estudiá en este orden estricto para asegurar la mayor cantidad de puntos.
                </p>
              </div>
              <div
                className={`divide-y ${
                  isNightMode
                    ? 'divide-[#253042]'
                    : isReadingMode
                      ? 'divide-[#E9E1CE]'
                      : 'divide-slate-100'
                }`}
              >
                {summary.priorityTopics.map((item, idx) => (
                  <div key={idx} className="p-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          isNightMode
                            ? 'text-white'
                            : isReadingMode
                              ? 'text-[#241E18]'
                              : 'text-slate-900'
                        }`}
                      >
                        0{idx + 1}. {item.topic}
                      </h4>
                      <span
                        className={`text-xs font-medium ${
                          isNightMode
                            ? 'text-white'
                            : isReadingMode
                              ? 'text-[#8B5220]'
                              : 'text-blue-700'
                        }`}
                      >
                        {item.weight}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isNightMode
                          ? 'text-[#CBD5E1]'
                          : isReadingMode
                            ? 'text-[#4A4035]'
                            : 'text-slate-600'
                      }`}
                    >
                      <MathText text={item.whyItMatters} />
                    </p>
                    <p
                      className={`text-xs border rounded-lg px-3 py-2 ${
                        isNightMode
                          ? 'text-[#E2E8F0] bg-[#1F2838] border-[#313F57]'
                          : isReadingMode
                            ? 'text-[#3D352C] bg-[#F2ECDC] border-[#DFD6BF]'
                            : 'text-slate-800 bg-slate-50 border-slate-200'
                      }`}
                    >
                      <strong>Regla rápida: </strong>
                      <MathText text={item.quickRule} />
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {summary.mustMemorizeFormulas.length > 0 ? (
              <section
                className={`lg:col-span-5 border rounded-xl overflow-hidden transition-colors duration-200 ${
                  isNightMode
                    ? 'bg-[#171E2B] border-[#293549]'
                    : isReadingMode
                      ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                      : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${
                    isNightMode
                      ? 'border-[#253042]'
                      : isReadingMode
                        ? 'border-[#E9E1CE]'
                        : 'border-slate-200'
                  }`}
                >
                  <div>
                    <h3
                      className={`text-base font-semibold ${
                        isNightMode
                          ? 'text-white'
                          : isReadingMode
                            ? 'text-[#241E18]'
                            : 'text-slate-900'
                      }`}
                    >
                      Fórmulas clave para memorizar
                    </h3>
                    <p
                      className={`text-xs ${
                        isNightMode
                          ? 'text-[#94A3B8]'
                          : isReadingMode
                            ? 'text-[#6E6254]'
                            : 'text-slate-500'
                      }`}
                    >
                      Lo mínimo indispensable que tenés que saber de memoria o deducir rápido.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allOpen =
                        summary.mustMemorizeFormulas.length > 0 &&
                        summary.mustMemorizeFormulas.every((_, i) =>
                          revealedFormulaIndices.includes(i)
                        );
                      setRevealedFormulaIndices(
                        allOpen ? [] : summary.mustMemorizeFormulas.map((_, i) => i)
                      );
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors font-sans whitespace-nowrap shrink-0 ${
                      isNightMode
                        ? 'border-[#313F57] text-[#93C5FD] hover:bg-[#1F2838]'
                        : isReadingMode
                          ? 'border-[#DFD6BF] text-[#8B5220] hover:bg-[#F2ECDC]'
                          : 'border-slate-200 bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {summary.mustMemorizeFormulas.every((_, i) =>
                      revealedFormulaIndices.includes(i)
                    )
                      ? 'Ocultar todas'
                      : 'Ver todas'}
                  </button>
                </div>
                <div
                  className={`divide-y ${
                    isNightMode
                      ? 'divide-[#253042]'
                      : isReadingMode
                        ? 'divide-[#E9E1CE]'
                        : 'divide-slate-100'
                  }`}
                >
                  {summary.mustMemorizeFormulas.map((f, idx) => (
                    <div key={idx} className="p-5 space-y-2.5">
                      <h4
                        className={`text-sm font-semibold ${
                          isNightMode
                            ? 'text-white'
                            : isReadingMode
                              ? 'text-[#241E18]'
                              : 'text-slate-900'
                        }`}
                      >
                        {f.name}
                      </h4>
                      <RevealableFormula
                        latex={f.latex}
                        bold={true}
                        open={revealedFormulaIndices.includes(idx)}
                        onToggle={() =>
                          setRevealedFormulaIndices((prev) =>
                            prev.includes(idx)
                              ? prev.filter((i) => i !== idx)
                              : [...prev, idx]
                          )
                        }
                        isReadingMode={isReadingMode}
                        isNightMode={isNightMode}
                      />
                      <p
                        className={`text-xs leading-relaxed ${
                          isNightMode
                            ? 'text-[#CBD5E1]'
                            : isReadingMode
                              ? 'text-[#4A4035]'
                              : 'text-slate-600'
                        }`}
                      >
                        <MathText text={f.survivalTip} />
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : plan.visualExamples && plan.visualExamples[0] ? (
              <div className="lg:col-span-5">
                <VisualDiagramCard
                  example={plan.visualExamples[0]}
                  isReadingMode={isReadingMode}
                  isNightMode={isNightMode}
                />
              </div>
            ) : null}
          </div>

          {/* What to discard vs Last Hour Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section
              className={`border rounded-xl p-5 space-y-3 transition-colors duration-200 ${
                isNightMode
                  ? 'bg-[#171E2B] border-[#293549]'
                  : isReadingMode
                    ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <MinusCircle
                  className={`w-4 h-4 shrink-0 ${
                    isNightMode ? 'text-white' : 'text-amber-600'
                  }`}
                />
                <h3
                  className={`text-base font-semibold ${
                    isNightMode
                      ? 'text-white'
                      : isReadingMode
                        ? 'text-[#241E18]'
                        : 'text-slate-900'
                  }`}
                >
                  Qué posponer o descartar por ahora
                </h3>
              </div>
              <ul className="space-y-2 text-sm">
                {summary.discardForNow.map((item, idx) => (
                  <li
                    key={idx}
                    className={`border rounded-lg px-3.5 py-2.5 leading-relaxed ${
                      isNightMode
                        ? 'bg-[#1F2838] border-[#313F57] text-[#CBD5E1]'
                        : isReadingMode
                          ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#3D352C]'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <MathText text={item} />
                  </li>
                ))}
              </ul>
            </section>

            <section
              className={`border rounded-xl p-5 space-y-3 transition-colors duration-200 ${
                isNightMode
                  ? 'bg-[#171E2B] border-[#293549]'
                  : isReadingMode
                    ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare
                  className={`w-4 h-4 shrink-0 ${
                    isNightMode ? 'text-white' : 'text-emerald-600'
                  }`}
                />
                <h3
                  className={`text-base font-semibold ${
                    isNightMode
                      ? 'text-white'
                      : isReadingMode
                        ? 'text-[#241E18]'
                        : 'text-slate-900'
                  }`}
                >
                  Checklist de última hora antes de rendir
                </h3>
              </div>
              <ul className="space-y-2 text-sm">
                {summary.lastHourChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className={`border rounded-lg px-3.5 py-2.5 leading-relaxed ${
                      isNightMode
                        ? 'bg-[#142923] border-[#244B3E] text-[#E2E8F0]'
                        : isReadingMode
                          ? 'bg-[#ECF2E7] border-[#CEDAC4] text-[#2D4A29]'
                          : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    }`}
                  >
                    <MathText text={item} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">
            Elegí la fecha de tu examen y generá tu resumen calibrado
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Si falta menos de un día, recibís un resumen de supervivencia 80/20; si tenés varios días, armamos una síntesis ordenada por secciones y prioridades.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Generar resumen adaptado
          </button>
        </div>
      )}
    </div>
  );
}
