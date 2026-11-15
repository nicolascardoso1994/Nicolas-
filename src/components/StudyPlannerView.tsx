import { useEffect, useState } from 'react';
import { Check, Clock, Play, Pause, RotateCcw, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { StudyBlock, StudyPlan, StudyTab } from '../types/study';
import { MathText } from './MathText';

interface StudyPlannerViewProps {
  plan: StudyPlan;
  onToggleBlock: (blockId: string) => void;
  onNavigateTab: (tab: StudyTab) => void;
  onRebalanceTime: (newTotalMinutes: number) => void;
}

const CATEGORY_LABELS: Record<StudyBlock['category'], string> = {
  teoria: 'Teoría esencial',
  practica: 'Práctica guiada',
  repaso: 'Repaso activo',
  simulacro: 'Autoevaluación',
  descanso: 'Descanso',
};

const TAB_CTA_LABELS: Record<StudyTab, string> = {
  plan: 'Ver cronograma',
  summary: 'Ir al Resumen',
  guide: 'Ir a Guía de Repaso',
  exercises: 'Ir a Ejercicios',
  exam: 'Ir a Próximo Examen',
  charts: 'Ir a Gráficos',
  periodic: 'Ir a Tabla Periódica',
  library: 'Ir a Mis Resúmenes',
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function StudyPlannerView({
  plan,
  onToggleBlock,
  onNavigateTab,
  onRebalanceTime,
}: StudyPlannerViewProps) {
  const [activeTimerBlockId, setActiveTimerBlockId] = useState<string | null>(
    plan.studyBlocks.find((b) => !b.completed && b.category !== 'descanso')?.id ??
      plan.studyBlocks[0]?.id ??
      null
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const initial =
      plan.studyBlocks.find((b) => !b.completed && b.category !== 'descanso') ??
      plan.studyBlocks[0];
    return (initial?.durationMinutes ?? 45) * 60;
  });
  const [timerRunning, setTimerRunning] = useState(false);

  const [editingHours, setEditingHours] = useState(false);
  const [draftHours, setDraftHours] = useState(
    String(Math.round((plan.totalMinutes / 60) * 10) / 10)
  );

  // Sync timer when plan switches
  useEffect(() => {
    const firstPending =
      plan.studyBlocks.find((b) => !b.completed && b.category !== 'descanso') ??
      plan.studyBlocks[0];
    setActiveTimerBlockId(firstPending?.id ?? null);
    setSecondsLeft((firstPending?.durationMinutes ?? 45) * 60);
    setTimerRunning(false);
    setDraftHours(String(Math.round((plan.totalMinutes / 60) * 10) / 10));
  }, [plan.id]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const totalPlanMinutes = plan.studyBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const completedMinutes = plan.studyBlocks
    .filter((b) => b.completed)
    .reduce((acc, b) => acc + b.durationMinutes, 0);
  const remainingMinutes = Math.max(0, totalPlanMinutes - completedMinutes);
  const completedCount = plan.studyBlocks.filter((b) => b.completed).length;
  const progressPct =
    totalPlanMinutes > 0 ? Math.round((completedMinutes / totalPlanMinutes) * 100) : 0;

  const activeBlock = plan.studyBlocks.find((b) => b.id === activeTimerBlockId);

  const selectBlockForTimer = (block: StudyBlock) => {
    setActiveTimerBlockId(block.id);
    setSecondsLeft(block.durationMinutes * 60);
    setTimerRunning(false);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const handleApplyHours = () => {
    const parsed = parseFloat(draftHours.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed >= 0.5 && parsed <= 80) {
      onRebalanceTime(Math.round(parsed * 60));
    }
    setEditingHours(false);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI & Time Control Strip (Full-width row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Tiempo total asignado</span>
            <button
              type="button"
              onClick={() => setEditingHours((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Ajustar
            </button>
          </div>
          {editingHours ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0.5}
                max={80}
                step={0.5}
                value={draftHours}
                onChange={(e) => setDraftHours(e.target.value)}
                aria-label="Horas totales disponibles"
                className="w-20 px-2 py-1 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs text-slate-500">h</span>
              <button
                type="button"
                onClick={handleApplyHours}
                className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Recalcular
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
              {formatDuration(totalPlanMinutes)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {plan.daysAvailable} {plan.daysAvailable === 1 ? 'día' : 'días'} · Ritmo {plan.pace}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500">Progreso completado</span>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {progressPct}%
          </p>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500">Tiempo restante</span>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatDuration(remainingMinutes)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {completedCount} de {plan.studyBlocks.length} bloques listos
          </p>
        </div>

        {/* Active Study Block Timer */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 truncate">
              {activeBlock ? activeBlock.sessionLabel : 'Temporizador de bloque'}
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
              {mm}:{ss}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                aria-label={timerRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft((activeBlock?.durationMinutes ?? 45) * 60);
                }}
                aria-label="Reiniciar temporizador"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {activeBlock?.title ?? 'Seleccioná un bloque'}
          </p>
        </div>
      </div>

      {/* Study Blocks Schedule */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Plan de estudio optimizado por bloques
            </h2>
            <p className="text-sm text-slate-500">
              Distribución exacta según tus horas disponibles. Marcá cada bloque al completarlo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('summary')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Empezar por el Resumen
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {plan.studyBlocks.map((block, index) => {
            const isTimerSelected = block.id === activeTimerBlockId;
            return (
              <div
                key={block.id}
                className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  block.completed ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleBlock(block.id)}
                    aria-label={block.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                    className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      block.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white hover:border-blue-600'
                    }`}
                  >
                    {block.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono tabular-nums font-medium text-slate-700">
                        0{index + 1}.
                      </span>
                      <span>{block.sessionLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{CATEGORY_LABELS[block.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {block.durationMinutes} min
                      </span>
                      {block.completed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium">Completado</span>
                        </>
                      )}
                    </div>

                    <h3
                      className={`text-base font-semibold ${
                        block.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {block.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      <MathText text={block.objective} />
                    </p>
                    <p className="text-xs text-slate-500">
                      Meta del bloque: <span className="text-slate-700">{block.deliverable}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-9 md:pl-0">
                  {block.category !== 'descanso' && (
                    <>
                      <button
                        type="button"
                        onClick={() => selectBlockForTimer(block)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          isTimerSelected
                            ? 'border-blue-200 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isTimerSelected ? 'En temporizador' : 'Cargar reloj'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(block.targetTab)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        {TAB_CTA_LABELS[block.targetTab]}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
