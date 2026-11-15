import { useEffect, useState } from 'react';
import { Trash2, Menu, PanelLeft } from 'lucide-react';
import { SAMPLE_MATH_PLAN, SAMPLE_PHYSICS_PLAN } from './data/samplePlan';
import {
  AdaptiveExamSummary,
  ChartDataset,
  StepByStepExercise,
  StudyPlan,
  StudyTab,
  SummarySection,
} from './types/study';
import { DashboardSidebar } from './components/DashboardSidebar';
import { StudyPlannerView } from './components/StudyPlannerView';
import { ExamSummaryView } from './components/ExamSummaryView';
import { ReviewGuideView } from './components/ReviewGuideView';
import { StepByStepView } from './components/StepByStepView';
import { ExamCountdownView } from './components/ExamCountdownView';
import { DataChartLabView } from './components/DataChartLabView';
import { PeriodicTableView } from './components/PeriodicTableView';
import { SummariesLibraryView } from './components/SummariesLibraryView';
import { StudyAssistantDrawer } from './components/StudyAssistantDrawer';
import { NewPlanModal } from './components/NewPlanModal';

const STORAGE_KEY = 'codice_study_plans_v1';
const ACTIVE_ID_KEY = 'codice_active_plan_id_v1';
const READING_MODE_KEY = 'codice_reading_mode_v1';
const NIGHT_MODE_KEY = 'codice_night_mode_v1';
const SIDEBAR_COLLAPSED_KEY = 'codice_sidebar_collapsed_v1';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      localStorage.setItem(ACTIVE_ID_KEY, activePlanId);
      localStorage.setItem(READING_MODE_KEY, String(readingMode));
      localStorage.setItem(NIGHT_MODE_KEY, String(nightMode));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore storage quota errors
    }
  }, [plans, activePlanId, readingMode, nightMode, sidebarCollapsed]);

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
      className={`min-h-screen flex transition-colors duration-200 ${
        isNightSurfaceActive
          ? 'night-mode bg-[#0B0F17] text-[#E2E8F0]'
          : isReadingSurfaceActive
            ? 'bg-[#EFE8D6] text-slate-900'
            : 'bg-slate-50 text-slate-900'
      }`}
    >
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        plansCount={plans.length}
        activeSubject={activePlan.subject}
        onOpenNewModal={() => setModalOpen(true)}
        onOpenAssistant={() =>
          handleOpenAssistant({
            mode: activeTab === 'summary' ? 'improve' : 'ask',
          })
        }
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isReadingMode={isReadingSurfaceActive}
        isNightMode={isNightSurfaceActive}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header
          className={`border-b sticky top-0 z-20 transition-colors duration-200 ${
            isNightSurfaceActive
              ? 'bg-[#121824] border-[#242F42]'
              : isReadingSurfaceActive
                ? 'bg-[#FAF6EB] border-[#E4DCC8]'
                : 'bg-white border-slate-200'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Abrir menú lateral"
                className={`lg:hidden p-2 rounded-lg border transition-colors shrink-0 ${
                  isNightSurfaceActive
                    ? 'bg-[#1B2435] border-[#2C384E] text-[#E2E8F0] hover:bg-[#222D42]'
                    : isReadingSurfaceActive
                      ? 'bg-[#F2ECDC] border-[#DFD5BE] text-[#2B2316] hover:bg-[#EAE1CC]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Menu className="w-4 h-4" />
              </button>

              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Desplegar barra lateral"
                  title="Desplegar barra lateral"
                  className={`hidden lg:inline-flex p-2 rounded-lg border transition-colors shrink-0 ${
                    isNightSurfaceActive
                      ? 'bg-[#1B2435] border-[#2C384E] text-[#E2E8F0] hover:bg-[#222D42]'
                      : isReadingSurfaceActive
                        ? 'bg-[#F2ECDC] border-[#DFD5BE] text-[#2B2316] hover:bg-[#EAE1CC]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              <div className="space-y-0.5 min-w-0">
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
                  className={`text-xl sm:text-2xl font-semibold tracking-tight truncate ${
                    isNightSurfaceActive ? 'text-[#F1F5F9]' : 'text-slate-900'
                  }`}
                >
                  {activePlan.subject}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg max-w-[240px] truncate focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    isNightSurfaceActive
                      ? 'bg-[#1B2435] border-[#2C384E] text-[#E2E8F0]'
                      : isReadingSurfaceActive
                        ? 'bg-[#F2ECDC] border-[#DFD5BE] text-[#2B2316]'
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
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'periodic' && <PeriodicTableView />}

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
              : isReadingSurfaceActive
                ? 'border-[#E4DCC8] bg-[#FAF6EB]'
                : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs ${
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
      </div>

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
