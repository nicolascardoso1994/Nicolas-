import { useEffect, useState } from 'react';
import { Trash2, Plus, LineChart, MessageCircleQuestion } from 'lucide-react';
import { SAMPLE_MATH_PLAN, SAMPLE_PHYSICS_PLAN } from './data/samplePlan';
import {
  AdaptiveExamSummary,
  ChartDataset,
  StepByStepExercise,
  StudyPlan,
  StudyTab,
  SummarySection,
} from './types/study';
import { StudyPlannerView } from './components/StudyPlannerView';
import { ExamSummaryView } from './components/ExamSummaryView';
import { ReviewGuideView } from './components/ReviewGuideView';
import { StepByStepView } from './components/StepByStepView';
import { ExamCountdownView } from './components/ExamCountdownView';
import { DataChartLabView } from './components/DataChartLabView';
import { SummariesLibraryView } from './components/SummariesLibraryView';
import { StudyAssistantDrawer } from './components/StudyAssistantDrawer';
import { NewPlanModal } from './components/NewPlanModal';

const STORAGE_KEY = 'codice_study_plans_v1';
const ACTIVE_ID_KEY = 'codice_active_plan_id_v1';
const READING_MODE_KEY = 'codice_reading_mode_v1';
const NIGHT_MODE_KEY = 'codice_night_mode_v1';

const NAV_ITEMS: { id: StudyTab; label: string }[] = [
  { id: 'plan', label: 'Planificador' },
  { id: 'library', label: 'Mis Resúmenes' },
  { id: 'summary', label: 'Resumen' },
  { id: 'guide', label: 'Guía de Repaso' },
  { id: 'exercises', label: 'Paso a Paso' },
  { id: 'exam', label: 'Próximo Examen' },
];

function loadInitialPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map((p: StudyPlan) => {
          if (p.id === SAMPLE_PHYSICS_PLAN.id) {
            return {
              ...SAMPLE_PHYSICS_PLAN,
              ...p,
              folder: p.folder || SAMPLE_PHYSICS_PLAN.folder,
              pinned: p.pinned ?? SAMPLE_PHYSICS_PLAN.pinned,
              summarySections: p.summarySections?.length
                ? p.summarySections
                : SAMPLE_PHYSICS_PLAN.summarySections,
              adaptiveSummary: p.adaptiveSummary?.summarySections?.length
                ? p.adaptiveSummary
                : SAMPLE_PHYSICS_PLAN.adaptiveSummary,
              examDate: p.examDate || SAMPLE_PHYSICS_PLAN.examDate,
            };
          }
          if (p.id === SAMPLE_MATH_PLAN.id) {
            return {
              ...SAMPLE_MATH_PLAN,
              ...p,
              folder: p.folder || SAMPLE_MATH_PLAN.folder,
            };
          }
          return {
            ...p,
            folder: p.folder || 'General',
          };
        });

        if (
          normalized.length === 1 &&
          normalized[0].id === SAMPLE_PHYSICS_PLAN.id
        ) {
          return [...normalized, SAMPLE_MATH_PLAN];
        }
        return normalized;
      }
    }
  } catch {
    // Fallback to default sample plans
  }
  return [SAMPLE_PHYSICS_PLAN, SAMPLE_MATH_PLAN];
}

export default function App() {
  const [plans, setPlans] = useState<StudyPlan[]>(loadInitialPlans);
  const [activePlanId, setActivePlanId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_ID_KEY);
    const initial = loadInitialPlans();
    if (savedId && initial.some((p) => p.id === savedId)) {
      return savedId;
    }
    return initial[0].id;
  });
  const [activeTab, setActiveTab] = useState<StudyTab>('plan');
  const [activeChartDataset, setActiveChartDataset] = useState<ChartDataset | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'ask' | 'improve'>('ask');
  const [assistantSectionOrder, setAssistantSectionOrder] = useState<number | null>(null);
  const [previousSectionsByPlan, setPreviousSectionsByPlan] = useState<
    Record<string, SummarySection[]>
  >({});
  const [readingMode, setReadingMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(READING_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [nightMode, setNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NIGHT_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      localStorage.setItem(ACTIVE_ID_KEY, activePlanId);
      localStorage.setItem(READING_MODE_KEY, String(readingMode));
      localStorage.setItem(NIGHT_MODE_KEY, String(nightMode));
    } catch {
      // Ignore storage quota errors
    }
  }, [plans, activePlanId, readingMode, nightMode]);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0];

  const updateActivePlan = (updater: (plan: StudyPlan) => StudyPlan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? updater(p) : p))
    );
  };

  const handleToggleBlock = (blockId: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      studyBlocks: plan.studyBlocks.map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      ),
    }));
  };

  const handleToggleChecklist = (itemId: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      masteryChecklist: plan.masteryChecklist.map((c) =>
        c.id === itemId ? { ...c, checked: !c.checked } : c
      ),
    }));
  };

  const handleRebalanceTime = (newTotalMinutes: number) => {
    updateActivePlan((plan) => {
      const currentTotal = plan.studyBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
      if (currentTotal <= 0) return plan;
      const factor = newTotalMinutes / currentTotal;

      const updatedBlocks = plan.studyBlocks.map((b) => {
        if (b.category === 'descanso') {
          return { ...b, durationMinutes: newTotalMinutes < 120 ? 10 : 15 };
        }
        const scaled = Math.max(15, Math.round((b.durationMinutes * factor) / 5) * 5);
        return { ...b, durationMinutes: scaled };
      });

      const finalTotal = updatedBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
      const newHoursPerDay =
        Math.round((finalTotal / 60 / Math.max(1, plan.daysAvailable)) * 10) / 10;

      return {
        ...plan,
        totalMinutes: finalTotal,
        hoursPerDay: newHoursPerDay,
        studyBlocks: updatedBlocks,
      };
    });
  };

  const handleAddExercise = (exercise: StepByStepExercise) => {
    updateActivePlan((plan) => ({
      ...plan,
      exercises: [...plan.exercises, exercise],
    }));
  };

  const handleUpdateExamDate = (examDate: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      examDate,
    }));
  };

  const handleSaveAdaptiveSummary = (
    adaptiveSummary: AdaptiveExamSummary,
    examDate: string
  ) => {
    updateActivePlan((plan) => ({
      ...plan,
      examDate,
      adaptiveSummary,
    }));
  };

  const handleCreatedPlan = (newPlan: StudyPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setActivePlanId(newPlan.id);
    setActiveTab('plan');
  };

  const handleDeletePlan = (id: string) => {
    if (plans.length <= 1) return;
    const remaining = plans.filter((p) => p.id !== id);
    setPlans(remaining);
    if (activePlanId === id && remaining[0]) {
      setActivePlanId(remaining[0].id);
    }
  };

  const handleTogglePin = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, pinned: !p.pinned } : p))
    );
  };

  const handleChangeFolder = (planId: string, folder: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, folder: folder.trim() || 'General' } : p))
    );
  };

  const handleOpenAssistant = (options?: {
    mode?: 'ask' | 'improve';
    sectionOrder?: number;
  }) => {
    setAssistantMode(options?.mode ?? 'ask');
    setAssistantSectionOrder(
      options?.sectionOrder !== undefined ? options.sectionOrder : null
    );
    setAssistantOpen(true);
  };

  const handleApplySummaryCorrections = (suggested: SummarySection[]) => {
    if (!suggested || suggested.length === 0) return;
    const currentSections = activePlan.summarySections ?? [];
    setPreviousSectionsByPlan((prev) => ({
      ...prev,
      [activePlan.id]: currentSections,
    }));

    updateActivePlan((plan) => {
      const existing = plan.summarySections ?? [];
      if (existing.length === 0) {
        return { ...plan, summarySections: suggested };
      }

      const byOrder = new Map(suggested.map((s) => [s.order, s]));
      const merged = existing.map((sec) => byOrder.get(sec.order) ?? sec);
      for (const s of suggested) {
        if (!existing.some((e) => e.order === s.order)) {
          merged.push(s);
        }
      }
      merged.sort((a, b) => a.order - b.order);
      return { ...plan, summarySections: merged };
    });
  };

  const handleUndoSummaryCorrection = () => {
    const prevSections = previousSectionsByPlan[activePlan.id];
    if (!prevSections) return;
    updateActivePlan((plan) => ({
      ...plan,
      summarySections: prevSections,
    }));
    setPreviousSectionsByPlan((prev) => {
      const copy = { ...prev };
      delete copy[activePlan.id];
      return copy;
    });
  };

  const totalHoursLabel = (() => {
    const h = Math.floor(activePlan.totalMinutes / 60);
    const m = activePlan.totalMinutes % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  })();

  const handleToggleReadingMode = () => {
    setReadingMode((prev) => {
      const next = !prev;
      if (next) setNightMode(false);
      return next;
    });
  };

  const handleToggleNightMode = () => {
    setNightMode((prev) => {
      const next = !prev;
      if (next) setReadingMode(false);
      return next;
    });
  };

  const isReadingSurfaceActive =
    readingMode && !nightMode && (activeTab === 'summary' || activeTab === 'exam');
  const isNightSurfaceActive =
    nightMode && (activeTab === 'summary' || activeTab === 'exam');

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isNightSurfaceActive
          ? 'night-mode bg-[#0B0F17] text-[#E2E8F0]'
          : isReadingSurfaceActive
            ? 'bg-[#EFE8D6] text-slate-900'
            : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Bar: Strict 3-zone contract */}
      <header
        className={`border-b sticky top-0 z-30 transition-colors duration-200 ${
          isNightSurfaceActive
            ? 'bg-[#121824] border-[#242F42]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('plan');
            }}
            className={`text-xl font-bold tracking-tight whitespace-nowrap shrink-0 ${
              isNightSurfaceActive ? 'text-[#F1F5F9]' : 'text-slate-900'
            }`}
          >
            Códice
          </a>

          <nav aria-label="Secciones de estudio" className="hidden lg:flex items-center gap-5 xl:gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? isNightSurfaceActive
                        ? 'border-[#60A5FA] text-[#F8FAFC]'
                        : 'border-blue-700 text-slate-900'
                      : isNightSurfaceActive
                        ? 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {item.id === 'library' && (
                    <span
                      className={`ml-1 text-xs font-mono tabular-nums ${
                        isNightSurfaceActive ? 'text-[#64748B]' : 'text-slate-400'
                      }`}
                    >
                      ({plans.length})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Materia
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Header & Subject Context */}
      <div
        className={`border-b transition-colors duration-200 ${
          isNightSurfaceActive
            ? 'bg-[#141B29] border-[#242F42]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${
                isNightSurfaceActive ? 'text-[#94A3B8]' : 'text-slate-500'
              }`}
            >
              <span>{activePlan.examType}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{totalHoursLabel} totales</span>
              <span aria-hidden="true">·</span>
              <span>
                {activePlan.daysAvailable} {activePlan.daysAvailable === 1 ? 'día' : 'días'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Ritmo {activePlan.pace}</span>
            </div>
            <h1
              className={`text-2xl font-semibold tracking-tight text-balance ${
                isNightSurfaceActive ? 'text-[#F1F5F9]' : 'text-slate-900'
              }`}
            >
              {activePlan.subject}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('charts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'charts'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : isNightSurfaceActive
                    ? 'bg-[#1B2435] border-[#2C384E] text-[#CBD5E1] hover:bg-[#222D42]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Gráficos y Datos
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="plan-selector"
                className={`text-xs font-medium whitespace-nowrap ${
                  isNightSurfaceActive ? 'text-[#94A3B8]' : 'text-slate-500'
                }`}
              >
                Materia activa:
              </label>
              <select
                id="plan-selector"
                value={activePlan.id}
                onChange={(e) => setActivePlanId(e.target.value)}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg max-w-[260px] truncate focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  isNightSurfaceActive
                    ? 'bg-[#1B2435] border-[#2C384E] text-[#E2E8F0]'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.subject}
                  </option>
                ))}
              </select>
            </div>

            {plans.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeletePlan(activePlan.id)}
                aria-label="Eliminar materia actual"
                className={`p-1.5 rounded-lg transition-colors ${
                  isNightSurfaceActive
                    ? 'text-[#64748B] hover:text-red-400 hover:bg-red-950/40'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile / tablet navigation segmented bar */}
        <div
          className={`lg:hidden border-t px-4 py-2 flex items-center gap-1 overflow-x-auto ${
            isNightSurfaceActive ? 'border-[#242F42]' : 'border-slate-100'
          }`}
        >
          {[
            ...NAV_ITEMS,
            { id: 'charts' as StudyTab, label: 'Gráficos' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? isNightSurfaceActive
                      ? 'bg-[#253248] text-white'
                      : 'bg-slate-900 text-white'
                    : isNightSurfaceActive
                      ? 'text-[#94A3B8] hover:bg-[#1C2536]'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.id === 'library' ? `${item.label} (${plans.length})` : item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'plan' && (
          <StudyPlannerView
            plan={activePlan}
            onToggleBlock={handleToggleBlock}
            onNavigateTab={setActiveTab}
            onRebalanceTime={handleRebalanceTime}
          />
        )}

        {activeTab === 'summary' && (
          <ExamSummaryView
            plan={activePlan}
            onNavigateTab={setActiveTab}
            readingMode={readingMode}
            onToggleReadingMode={handleToggleReadingMode}
            nightMode={nightMode}
            onToggleNightMode={handleToggleNightMode}
            onAskAssistant={handleOpenAssistant}
          />
        )}

        {activeTab === 'guide' && (
          <ReviewGuideView
            plan={activePlan}
            onToggleChecklist={handleToggleChecklist}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'exercises' && (
          <StepByStepView
            plan={activePlan}
            onAddExercise={handleAddExercise}
            onOpenChart={(dataset) => {
              setActiveChartDataset(dataset);
              setActiveTab('charts');
            }}
          />
        )}

        {activeTab === 'exam' && (
          <ExamCountdownView
            key={activePlan.id}
            plan={activePlan}
            onUpdateExamDate={handleUpdateExamDate}
            onSaveAdaptiveSummary={handleSaveAdaptiveSummary}
            readingMode={readingMode}
            onToggleReadingMode={handleToggleReadingMode}
            nightMode={nightMode}
            onToggleNightMode={handleToggleNightMode}
          />
        )}

        {activeTab === 'charts' && (
          <DataChartLabView
            subject={activePlan.subject}
            initialDataset={activeChartDataset}
          />
        )}

        {activeTab === 'library' && (
          <SummariesLibraryView
            plans={plans}
            activePlanId={activePlan.id}
            onSelectPlanAndTab={(planId, tab) => {
              setActivePlanId(planId);
              setActiveTab(tab);
            }}
            onTogglePin={handleTogglePin}
            onChangeFolder={handleChangeFolder}
            onDeletePlan={handleDeletePlan}
            onOpenNewModal={() => setModalOpen(true)}
          />
        )}
      </main>

      <footer
        className={`border-t mt-12 transition-colors duration-200 ${
          isNightSurfaceActive
            ? 'border-[#242F42] bg-[#121824]'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs ${
            isNightSurfaceActive ? 'text-[#94A3B8]' : 'text-slate-500'
          }`}
        >
          <span>Códice · Organización académica, resúmenes de examen y práctica guiada</span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`font-medium whitespace-nowrap ${
              isNightSurfaceActive
                ? 'text-[#7CB4FF] hover:text-[#93C5FD]'
                : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            Cargar nuevos apuntes o PDF
          </button>
        </div>
      </footer>

      {/* Floating friendly AI question & readability helper button */}
      <button
        type="button"
        onClick={() =>
          handleOpenAssistant({
            mode: activeTab === 'summary' ? 'improve' : 'ask',
          })
        }
        className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl shadow-lg border transition-colors whitespace-nowrap ${
          isNightSurfaceActive
            ? 'bg-[#253247] border-[#3B4F72] text-[#F1F5F9] hover:bg-[#30425E]'
            : isReadingSurfaceActive
              ? 'bg-[#6F4118] border-[#593312] text-[#FAF6EB] hover:bg-[#593312]'
              : 'bg-slate-900 border-slate-800 text-white hover:bg-blue-700 hover:border-blue-700'
        }`}
      >
        <MessageCircleQuestion className="w-4 h-4 shrink-0" />
        <span>¿Dudas? Preguntale a la IA</span>
      </button>

      <StudyAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        plan={activePlan}
        initialMode={assistantMode}
        initialSectionOrder={assistantSectionOrder}
        onApplySummaryCorrections={handleApplySummaryCorrections}
        onUndoSummaryCorrection={handleUndoSummaryCorrection}
        canUndoCorrection={Boolean(previousSectionsByPlan[activePlan.id])}
        readingMode={isReadingSurfaceActive}
        nightMode={isNightSurfaceActive}
      />

      <NewPlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreatedPlan}
      />
    </div>
  );
}
