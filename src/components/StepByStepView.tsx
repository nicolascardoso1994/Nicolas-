import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ListOrdered,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  LineChart,
  RefreshCw,
  BookOpenText,
  AlertCircle,
} from 'lucide-react';
import {
  ChartDataset,
  StepByStepExercise,
  StudyPlan,
  StudyTab,
  UploadedFilePayload,
} from '../types/study';
import { MathText } from './MathText';
import { RevealableFormula } from './RevealableFormula';
import { PhysicsVisualizer } from './PhysicsVisualizer';
import { readValidatedFilePayload, safeFetchJson } from '../utils/apiClient';

interface StepByStepViewProps {
  plan: StudyPlan;
  onAddExercise: (exercise: StepByStepExercise) => void;
  onReplaceExercises?: (exercises: StepByStepExercise[], sourceLabel: string) => void;
  onNavigateTab?: (tab: StudyTab) => void;
  onOpenChart?: (dataset: ChartDataset) => void;
}

function isExerciseVisualMode(
  exercise: StepByStepExercise | undefined,
  planMode?: StudyPlan['subjectMode']
): boolean {
  if (!exercise) return planMode === 'theoretical';
  if (exercise.visualConfig?.type === 'visual_diagram') return true;
  if (planMode === 'theoretical') return true;
  const hasMath = exercise.steps.some((s) => Boolean(s.mathLatex && s.mathLatex.trim().length > 0));
  return (
    !hasMath &&
    exercise.visualConfig?.type !== 'inclined_plane' &&
    exercise.visualConfig?.type !== 'projectile'
  );
}

export function StepByStepView({
  plan,
  onAddExercise,
  onReplaceExercises,
  onNavigateTab,
  onOpenChart,
}: StepByStepViewProps) {
  const [selectedExIdx, setSelectedExIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [stepChecks, setStepChecks] = useState<Record<string, number>>({});

  // Custom exercise solver state
  const [solverOpen, setSolverOpen] = useState(false);
  const [customStatement, setCustomStatement] = useState('');
  const [customFiles, setCustomFiles] = useState<UploadedFilePayload[]>([]);
  const [solving, setSolving] = useState(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [charting, setCharting] = useState(false);

  // Sync-from-summary state
  const [syncSource, setSyncSource] = useState<string>('base');
  const [syncingFromSummary, setSyncingFromSummary] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const exercises = plan.exercises ?? [];
  const sections = plan.summarySections ?? [];
  const hasAdaptive = Boolean(plan.adaptiveSummary);
  const hasBibliography = (plan.bibliography?.length ?? 0) > 0;
  const isPlanTheoretical =
    plan.subjectMode === 'theoretical' ||
    (!plan.subjectMode && (plan.formulas?.length ?? 0) === 0);

  const isSummaryOutOfSync = useMemo(() => {
    if (!plan.summaryUpdatedAt) return false;
    if (!plan.exercisesSyncedAt) return true;
    return new Date(plan.summaryUpdatedAt).getTime() > new Date(plan.exercisesSyncedAt).getTime();
  }, [plan.summaryUpdatedAt, plan.exercisesSyncedAt]);

  useEffect(() => {
    setSelectedExIdx(0);
    setCurrentStepIdx(0);
    setShowAllSteps(false);
    setStepChecks({});
    setSolverOpen(false);
    setCustomStatement('');
    setCustomFiles([]);
    setSolveError(null);
    setSyncError(null);
    setSyncSource('base');
  }, [plan.id]);

  // Clamp index if exercises array is replaced or shrinks
  useEffect(() => {
    if (selectedExIdx >= exercises.length && exercises.length > 0) {
      setSelectedExIdx(0);
      setCurrentStepIdx(0);
    }
  }, [exercises.length, selectedExIdx]);

  const activeExercise = exercises[selectedExIdx] ?? exercises[0];

  const handleSelectExercise = (idx: number) => {
    setSelectedExIdx(idx);
    setCurrentStepIdx(0);
    setShowAllSteps(false);
  };

  const handleCustomFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setSolveError(null);
    try {
      const loaded = await Promise.all(
        Array.from(fileList).slice(0, 3).map(readValidatedFilePayload)
      );
      setCustomFiles((prev) => [...prev, ...loaded].slice(0, 3));
    } catch (err) {
      setSolveError(err instanceof Error ? err.message : 'Error al leer el archivo.');
    }
  };

  const handleSolveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSolveError(null);
    if (!customStatement.trim() && customFiles.length === 0) {
      setSolveError('Pegá el enunciado del ejercicio o adjuntá una imagen/PDF.');
      return;
    }

    setSolving(true);
    try {
      const data = await safeFetchJson<StepByStepExercise>('/api/solve-exercise', {
        method: 'POST',
        body: JSON.stringify({
          subject: plan.subject,
          subjectMode: plan.subjectMode,
          statement: customStatement.trim(),
          files: customFiles,
          summaryContext: {
            summarySections: sections,
            formulas: plan.formulas,
          },
        }),
      });
      onAddExercise(data);
      setSelectedExIdx(exercises.length);
      setCurrentStepIdx(0);
      setShowAllSteps(false);
      setCustomStatement('');
      setCustomFiles([]);
      setSolverOpen(false);
    } catch (err) {
      setSolveError(err instanceof Error ? err.message : 'Error de conexión.');
    } finally {
      setSolving(false);
    }
  };

  const handleSyncFromSummary = async (forcedSource?: string) => {
    if (!onReplaceExercises || syncingFromSummary) return;
    setSyncError(null);
    setSyncingFromSummary(true);

    const effectiveSelection = forcedSource ?? syncSource;
    let sourceType: 'base' | 'adaptive' | 'bibliography' | 'section' = 'base';
    let targetSectionTitle = '';

    if (effectiveSelection === 'adaptive') {
      sourceType = 'adaptive';
    } else if (effectiveSelection === 'bibliography') {
      sourceType = 'bibliography';
    } else if (effectiveSelection.startsWith('section:')) {
      sourceType = 'section';
      targetSectionTitle = effectiveSelection.slice('section:'.length);
    }

    try {
      const data = await safeFetchJson<{
        sourceLabel: string;
        exercises: StepByStepExercise[];
      }>('/api/generate-exercises-from-summary', {
        method: 'POST',
        body: JSON.stringify({
          subject: plan.subject,
          examType: plan.examType,
          subjectMode: plan.subjectMode,
          sourceType,
          targetSectionTitle,
          executiveSummary: plan.executiveSummary,
          summarySections: sections,
          keyConcepts: plan.keyConcepts,
          formulas: plan.formulas,
          adaptiveSummary: plan.adaptiveSummary ?? null,
          bibliography: plan.bibliography ?? [],
        }),
      });

      if (Array.isArray(data.exercises) && data.exercises.length > 0) {
        onReplaceExercises(data.exercises, data.sourceLabel || 'Resumen actual');
        setSelectedExIdx(0);
        setCurrentStepIdx(0);
        setShowAllSteps(false);
        setStepChecks({});
      } else {
        setSyncError('No se pudieron generar casos paso a paso para este resumen.');
      }
    } catch (err) {
      setSyncError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar el paso a paso según el resumen.'
      );
    } finally {
      setSyncingFromSummary(false);
    }
  };

  const isVisualOrTheoretical = isExerciseVisualMode(activeExercise, plan.subjectMode);
  const steps = activeExercise?.steps ?? [];
  const activeStep = steps[currentStepIdx] ?? steps[0];
  const stepsToRender = showAllSteps ? steps : activeStep ? [activeStep] : [];

  return (
    <div className="space-y-6">
      {/* Active Resumen Synchronization Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              <span>Resumen activo:</span>
              <span className="font-semibold text-slate-800 truncate">{plan.subject}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isPlanTheoretical
                  ? 'Enfoque teórico y visual (sin cuentas)'
                  : 'Enfoque cuantitativo con fórmulas'}
              </span>
              {plan.exercisesSourceLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-700 font-medium">
                    Base: {plan.exercisesSourceLabel}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Cada ejercicio o esquema visual se adapta al resumen en el que estás trabajando. Podés actualizarlo según todo el resumen, una sección o el resumen adaptado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('summary')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpenText className="w-3.5 h-3.5 text-slate-500" />
                Ver resumen
              </button>
            )}

            {onReplaceExercises && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Fuente del resumen para Paso a paso"
                  value={syncSource}
                  onChange={(e) => setSyncSource(e.target.value)}
                  disabled={syncingFromSummary}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[230px]"
                >
                  <option value="base">Todo el resumen actual</option>
                  {hasAdaptive && (
                    <option value="adaptive">Resumen adaptado al examen</option>
                  )}
                  {hasBibliography && (
                    <option value="bibliography">Bibliografía de ayuda</option>
                  )}
                  {sections.map((sec) => (
                    <option key={sec.order} value={`section:${sec.title}`}>
                      Sección {sec.order}: {sec.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={syncingFromSummary}
                  onClick={() => handleSyncFromSummary()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  {syncingFromSummary ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {syncingFromSummary ? 'Actualizando...' : 'Actualizar según resumen'}
                </button>
              </div>
            )}
          </div>
        </div>

        {isSummaryOutOfSync && onReplaceExercises && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Modificaste este resumen recientemente. Actualizá el Paso a paso para alinear la práctica con los últimos cambios.
              </span>
            </div>
            <button
              type="button"
              disabled={syncingFromSummary}
              onClick={() => handleSyncFromSummary('base')}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-900 text-white rounded-md hover:bg-amber-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              Sincronizar ahora
            </button>
          </div>
        )}

        {syncError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {syncError}
          </p>
        )}
      </section>

      {/* Exercise Selector Bar (when exercises exist) */}
      {exercises.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {exercises.map((ex, idx) => {
              const exIsVisual = isExerciseVisualMode(ex, plan.subjectMode);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectExercise(idx)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    idx === selectedExIdx
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {exIsVisual ? 'Caso visual' : 'Ejercicio'} {idx + 1} · {ex.difficulty}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenChart && activeExercise && !isVisualOrTheoretical && (
              <button
                type="button"
                disabled={charting}
                onClick={async () => {
                  if (!activeExercise) return;
                  const cfg = activeExercise.visualConfig;
                  if (cfg?.type === 'inclined_plane') {
                    const rad = ((cfg.angleDeg ?? 35) * Math.PI) / 180;
                    const mu = cfg.mu ?? 0.3;
                    const a = Math.max(0.5, 9.81 * (Math.sin(rad) - mu * Math.cos(rad)));
                    const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4];
                    onOpenChart({
                      id: `ex-chart-${activeExercise.id}`,
                      title: `Cinemática del bloque: ${activeExercise.title}`,
                      subjectTag: plan.subject,
                      xLabel: 'Tiempo t',
                      xUnit: 's',
                      yLabel: 'Velocidad / Distancia',
                      yUnit: 'm/s | m',
                      insightSummary: `Aceleración calculada $a = ${a.toFixed(2)}\\text{ m/s}^2$. La pendiente de $v(t)$ da la aceleración y el área bajo $v(t)$ equivale a la distancia recorrida.`,
                      slopeMeaning: `Aceleración $a = ${a.toFixed(2)}\\text{ m/s}^2$`,
                      areaMeaning: 'Distancia recorrida $d$ en metros',
                      series: [
                        {
                          id: 'ex-vel',
                          name: 'Velocidad v(t) [m/s]',
                          unit: 'm/s',
                          color: '#1D4ED8',
                          mode: 'line',
                          points: times.map((t) => ({
                            x: t,
                            y: Number((a * t).toFixed(2)),
                            group: t <= 1.2 ? 'Inicio' : 'Aceleración',
                          })),
                        },
                        {
                          id: 'ex-dist',
                          name: 'Distancia d(t) [m]',
                          unit: 'm',
                          color: '#059669',
                          mode: 'line',
                          points: times.map((t) => ({
                            x: t,
                            y: Number((0.5 * a * t * t).toFixed(2)),
                            group: t <= 1.2 ? 'Inicio' : 'Aceleración',
                          })),
                        },
                      ],
                    });
                    return;
                  }

                  if (cfg?.type === 'projectile') {
                    const v0 = cfg.velocityMs ?? 7.12;
                    const H = 1.8;
                    const tMax = Math.sqrt((2 * H) / 9.81);
                    const pts = Array.from({ length: 11 }, (_, i) => {
                      const t = (tMax * i) / 10;
                      const x = v0 * t;
                      const y = Math.max(0, H - 0.5 * 9.81 * t * t);
                      return {
                        x: Number(x.toFixed(2)),
                        y: Number(y.toFixed(2)),
                        group: x < (v0 * tMax) / 2 ? 'Primer tramo' : 'Caída final',
                      };
                    });
                    onOpenChart({
                      id: `ex-chart-${activeExercise.id}`,
                      title: `Trayectoria y(x): ${activeExercise.title}`,
                      subjectTag: plan.subject,
                      xLabel: 'Distancia horizontal x',
                      xUnit: 'm',
                      yLabel: 'Altura y',
                      yUnit: 'm',
                      insightSummary: `Con velocidad horizontal inicial $v_{0x} = ${v0}\\text{ m/s}$ desde $H = ${H}\\text{ m}$, el proyectil alcanza $D = ${(v0 * tMax).toFixed(2)}\\text{ m}$.`,
                      slopeMeaning: 'Pendiente instantánea $dy/dx$ (inclinación del vector velocidad)',
                      areaMeaning: 'Área bajo la trayectoria espacial',
                      series: [
                        {
                          id: 'ex-traj',
                          name: 'Altura y(x) [m]',
                          unit: 'm',
                          color: '#0284C7',
                          mode: 'line',
                          points: pts,
                        },
                      ],
                    });
                    return;
                  }

                  setCharting(true);
                  setSolveError(null);
                  try {
                    const data = await safeFetchJson<ChartDataset>('/api/generate-chart-data', {
                      method: 'POST',
                      body: JSON.stringify({
                        subject: plan.subject,
                        promptText: `Generá una tabla de puntos para graficar la relación física o matemática principal de este ejercicio:\n${activeExercise.statement}`,
                      }),
                    });
                    if (Array.isArray(data.series) && data.series.length > 0) {
                      onOpenChart(data);
                    }
                  } catch (err) {
                    setSolveError(
                      err instanceof Error
                        ? err.message
                        : 'No se pudo generar el gráfico del ejercicio.'
                    );
                  } finally {
                    setCharting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {charting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LineChart className="w-3.5 h-3.5 text-blue-700" />
                )}
                {charting ? 'Preparando gráfico...' : 'Graficar este ejercicio'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSolverOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {solverOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {solverOpen
                ? 'Cerrar panel'
                : isVisualOrTheoretical
                  ? 'Analizar caso o estructura'
                  : 'Resolver mi ejercicio'}
            </button>
          </div>
        </div>
      )}

      {/* Inline Custom Exercise Solver (renders both in empty state and normal state) */}
      {solverOpen && (
        <form
          onSubmit={handleSolveCustom}
          className="bg-white border border-blue-200 rounded-xl p-5 space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {isVisualOrTheoretical
                ? 'Cargar tema, estructura o caso práctico para análisis visual'
                : 'Cargar ejercicio propio para resolución paso a paso'}
            </h3>
            <p className="text-xs text-slate-500">
              {isVisualOrTheoretical
                ? 'Pegá el caso o subí una foto/PDF para descomponer sus partes y mecanismos paso a paso según este resumen.'
                : 'Pegá el enunciado o subí una foto/PDF de tu guía de trabajos prácticos para resolverlo según este resumen.'}
            </p>
          </div>

          <textarea
            rows={3}
            value={customStatement}
            onChange={(e) => setCustomStatement(e.target.value)}
            placeholder={
              isVisualOrTheoretical
                ? 'Ej: Explicar las partes anatómicas del riñón y el recorrido de filtración en la nefrona...'
                : 'Ej: Un bloque de 4 kg sube por un plano inclinado de 30° empujado por una fuerza horizontal de 50 N...'
            }
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Adjuntar imagen o PDF
              <input
                type="file"
                accept=".pdf,.txt,.md,image/*"
                multiple
                onChange={(e) => handleCustomFiles(e.target.files)}
                className="sr-only"
              />
            </label>

            {customFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {customFiles.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                    {f.name}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Quitar archivo"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={solving}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {solving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {solving ? 'Analizando paso a paso...' : 'Generar guía paso a paso'}
            </button>
          </div>

          {solveError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {solveError}
            </p>
          )}
        </form>
      )}

      {/* Empty State when plan has 0 exercises */}
      {!activeExercise ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-slate-900">
              Todavía no hay ejercicios o casos cargados para este resumen.
            </p>
            <p className="text-sm text-slate-500">
              Generá la práctica paso a paso directamente desde el resumen de {plan.subject}, o cargá un enunciado propio.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onReplaceExercises && (
              <button
                type="button"
                disabled={syncingFromSummary}
                onClick={() => handleSyncFromSummary()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {syncingFromSummary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {syncingFromSummary ? 'Generando desde el resumen...' : 'Generar desde este resumen'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSolverOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              {isPlanTheoretical ? 'Analizar caso o estructura' : 'Resolver un ejercicio propio'}
            </button>
          </div>
        </div>
      ) : (
        /* Two-Zone Sandbox Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Stage: Statement, Given Data & Interactive Visualizer */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">
                  {activeExercise.topic} · Nivel {activeExercise.difficulty}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {activeExercise.title}
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                <MathText text={activeExercise.statement} />
              </p>

              {/* Structured Given Data & Unknowns */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">
                    {isVisualOrTheoretical ? 'Partes y datos clave' : 'Datos conocidos'}
                  </h4>
                  <div className="space-y-1.5">
                    {activeExercise.givenData.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                      >
                        <span className="font-mono text-slate-800">
                          <MathText text={isVisualOrTheoretical ? d.symbol : `$${d.symbol}$`} />
                        </span>
                        <span className="font-mono tabular-nums font-medium text-slate-900 text-right">
                          {d.value} {d.unit !== '-' ? d.unit : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">
                    {isVisualOrTheoretical ? 'Qué identificar' : 'Incógnitas'}
                  </h4>
                  <ul className="space-y-1.5">
                    {activeExercise.unknowns.map((u, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-700 bg-blue-50/50 border border-blue-200 rounded px-2.5 py-1.5"
                      >
                        <MathText text={u} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <PhysicsVisualizer
              key={`${activeExercise.id}-${activeExercise.visualConfig?.type ?? 'none'}-${activeExercise.visualConfig?.angleDeg ?? ''}-${activeExercise.visualConfig?.velocityMs ?? ''}`}
              visualConfig={activeExercise.visualConfig}
              highlightElement={activeStep?.highlightElement}
              highlightPartNumber={activeStep?.highlightPartNumber}
              currentStepIndex={currentStepIdx}
              totalSteps={steps.length}
              stepTitles={steps.map((s) => s.title)}
              onSelectStep={(idx) => {
                setShowAllSteps(false);
                setCurrentStepIdx(idx);
              }}
            />
          </div>

          {/* Right Control & Step Deck */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step Controls Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                  {showAllSteps
                    ? `Vista completa (${steps.length} pasos)`
                    : `Paso ${currentStepIdx + 1} de ${steps.length}`}
                </span>
                {!showAllSteps && (
                  <div className="flex items-center gap-1">
                    {steps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentStepIdx(idx)}
                        aria-label={`Ir al paso ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentStepIdx
                            ? 'w-6 bg-blue-700'
                            : idx < currentStepIdx
                              ? 'w-2.5 bg-emerald-500'
                              : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllSteps((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {showAllSteps ? (
                    <>
                      <ListOrdered className="w-3.5 h-3.5" />
                      Paso a paso
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Ver todo
                    </>
                  )}
                </button>

                {!showAllSteps && (
                  <>
                    <button
                      type="button"
                      disabled={currentStepIdx === 0}
                      onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={currentStepIdx >= steps.length - 1}
                      onClick={() =>
                        setCurrentStepIdx((i) => Math.min(steps.length - 1, i + 1))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      Siguiente
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Step Cards */}
            <div className="space-y-4">
              {stepsToRender.map((step) => {
                const checkKey = `${activeExercise.id}-s${step.stepNumber}`;
                const chosenCheck = stepChecks[checkKey];
                const isCheckAnswered = chosenCheck !== undefined;

                return (
                  <article
                    key={step.stepNumber}
                    className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        Paso 0{step.stepNumber}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      <MathText text={step.title} />
                    </h3>

                    {/* Thinking prompt */}
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5">
                      <span className="text-xs font-semibold text-blue-800 block mb-1">
                        {isVisualOrTheoretical
                          ? 'Qué observar en el esquema'
                          : 'Qué pensar antes de calcular'}
                      </span>
                      <p className="text-sm text-slate-800 leading-relaxed">
                        <MathText text={step.thinkingPrompt} />
                      </p>
                    </div>

                    {/* Math Formula */}
                    {step.mathLatex && step.mathLatex.trim().length > 0 && (
                      <RevealableFormula
                        key={`${activeExercise?.id ?? 'ex'}-${step.stepNumber}`}
                        latex={step.mathLatex}
                        label="Ver fórmula"
                        bold={false}
                      />
                    )}

                    {/* Concrete Explanation */}
                    <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                      <MathText text={step.explanation} />
                    </p>

                    {/* Watch out */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-amber-900">Cuidado en el examen: </strong>
                      <MathText text={step.watchOut} />
                    </div>

                    {/* Optional interactive Quick Check */}
                    {step.quickCheck && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <p className="text-xs font-semibold text-slate-800">
                          Comprobación rápida: <MathText text={step.quickCheck.question} />
                        </p>
                        <div className="space-y-1.5">
                          {step.quickCheck.options.map((opt, oIdx) => {
                            const isSelected = chosenCheck === oIdx;
                            const isRight = oIdx === step.quickCheck!.correctIndex;

                            let style =
                              'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                            if (isCheckAnswered) {
                              if (isRight) {
                                style =
                                  'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                              } else if (isSelected && !isRight) {
                                style = 'border-red-300 bg-red-50 text-red-900';
                              } else {
                                style = 'border-slate-200 bg-slate-50 text-slate-500';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setStepChecks((prev) => ({ ...prev, [checkKey]: oIdx }))
                                }
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${style}`}
                              >
                                <span>
                                  <MathText text={opt} />
                                </span>
                                {isCheckAnswered && isRight && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {isCheckAnswered && isSelected && !isRight && (
                                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {isCheckAnswered && (
                          <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <MathText text={step.quickCheck.feedback} />
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Final Answer Panel */}
            {(showAllSteps || currentStepIdx >= steps.length - 1) && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 space-y-1.5">
                <span className="text-xs font-semibold text-emerald-800">
                  {isVisualOrTheoretical
                    ? 'Síntesis visual verificada'
                    : 'Respuesta final verificada'}
                </span>
                <p className="text-sm md:text-base font-medium text-slate-900 leading-relaxed">
                  <MathText text={activeExercise.finalAnswer} />
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
