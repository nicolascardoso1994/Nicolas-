import { useEffect, useMemo, useState } from 'react';
import { Trash2, Menu, PanelLeft, Bell, ArrowRight, X } from 'lucide-react';
import { SAMPLE_ANATOMY_PLAN, SAMPLE_MATH_PLAN, SAMPLE_PHYSICS_PLAN } from './data/samplePlan';
import {
  AdaptiveExamSummary,
  BibliographyEntry,
  ChartDataset,
  ExamAlert,
  ExamAttemptResult,
  ExamModel,
  ExamReminderConfig,
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
import { NotificationsPanel } from './components/NotificationsPanel';
import {
  computeExamAlerts,
  computePlanProgressPct,
  formatSpanishExamDate,
  getDaysUntilExam,
  isReminderTimeReachedToday,
  normalizeReminderConfig,
  toLocalDateString,
  triggerBrowserNotification,
} from './utils/examReminders';

const STORAGE_KEY = 'codice_study_plans_v1';
const ACTIVE_ID_KEY = 'codice_active_plan_id_v1';
const READING_MODE_KEY = 'codice_reading_mode_v1';
const NIGHT_MODE_KEY = 'codice_night_mode_v1';
const SIDEBAR_COLLAPSED_KEY = 'codice_sidebar_collapsed_v1';
const READ_ALERTS_KEY = 'codice_read_exam_alerts_v1';
const NOTIFIED_BROWSER_KEY = 'codice_notified_browser_alerts_v1';

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
              subjectMode: p.subjectMode || SAMPLE_PHYSICS_PLAN.subjectMode,
              folder: p.folder || SAMPLE_PHYSICS_PLAN.folder,
              pinned: p.pinned ?? SAMPLE_PHYSICS_PLAN.pinned,
              summarySections: p.summarySections?.length
                ? p.summarySections
                : SAMPLE_PHYSICS_PLAN.summarySections,
              adaptiveSummary: p.adaptiveSummary?.summarySections?.length
                ? p.adaptiveSummary
                : SAMPLE_PHYSICS_PLAN.adaptiveSummary,
              examModels: p.examModels?.length
                ? p.examModels
                : SAMPLE_PHYSICS_PLAN.examModels,
              examDate: p.examDate || SAMPLE_PHYSICS_PLAN.examDate,
            };
          }
          if (p.id === SAMPLE_MATH_PLAN.id) {
            return {
              ...SAMPLE_MATH_PLAN,
              ...p,
              subjectMode: p.subjectMode || SAMPLE_MATH_PLAN.subjectMode,
              folder: p.folder || SAMPLE_MATH_PLAN.folder,
              examDate: p.examDate || SAMPLE_MATH_PLAN.examDate,
              exercises:
                p.exercises && p.exercises.length >= SAMPLE_MATH_PLAN.exercises.length
                  ? p.exercises
                  : SAMPLE_MATH_PLAN.exercises,
              examModels: p.examModels?.length
                ? p.examModels
                : SAMPLE_MATH_PLAN.examModels,
            };
          }
          if (p.id === SAMPLE_ANATOMY_PLAN.id) {
            return {
              ...SAMPLE_ANATOMY_PLAN,
              ...p,
              folder: p.folder || SAMPLE_ANATOMY_PLAN.folder,
              examDate: p.examDate || SAMPLE_ANATOMY_PLAN.examDate,
              subjectMode: p.subjectMode || SAMPLE_ANATOMY_PLAN.subjectMode,
              visualExamples: p.visualExamples?.length
                ? p.visualExamples
                : SAMPLE_ANATOMY_PLAN.visualExamples,
              examModels: p.examModels?.length
                ? p.examModels
                : SAMPLE_ANATOMY_PLAN.examModels,
            };
          }
          return {
            ...p,
            folder: p.folder || 'General',
          };
        });

        const hasAnatomy = normalized.some((p: StudyPlan) => p.id === SAMPLE_ANATOMY_PLAN.id);
        const onlyInitialSamples = normalized.every(
          (p: StudyPlan) =>
            p.id === SAMPLE_PHYSICS_PLAN.id || p.id === SAMPLE_MATH_PLAN.id
        );

        if (
          normalized.length === 1 &&
          normalized[0].id === SAMPLE_PHYSICS_PLAN.id
        ) {
          return [...normalized, SAMPLE_MATH_PLAN, SAMPLE_ANATOMY_PLAN];
        }
        if (onlyInitialSamples && !hasAnatomy && normalized.length <= 2) {
          return [...normalized, SAMPLE_ANATOMY_PLAN];
        }
        return normalized;
      }
    }
  } catch {
    // Fallback to default sample plans
  }
  return [SAMPLE_PHYSICS_PLAN, SAMPLE_MATH_PLAN, SAMPLE_ANATOMY_PLAN];
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(READ_ALERTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [notifiedBrowserKeys, setNotifiedBrowserKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(NOTIFIED_BROWSER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toastAlert, setToastAlert] = useState<ExamAlert | null>(null);
  const [clockTick, setClockTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
        localStorage.setItem(ACTIVE_ID_KEY, activePlanId);
        localStorage.setItem(READING_MODE_KEY, String(readingMode));
        localStorage.setItem(NIGHT_MODE_KEY, String(nightMode));
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
        localStorage.setItem(READ_ALERTS_KEY, JSON.stringify(readAlertIds));
        localStorage.setItem(NOTIFIED_BROWSER_KEY, JSON.stringify(notifiedBrowserKeys));
      } catch {
        // Ignore storage quota errors
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    plans,
    activePlanId,
    readingMode,
    nightMode,
    sidebarCollapsed,
    readAlertIds,
    notifiedBrowserKeys,
  ]);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0];

  const examAlerts = useMemo(() => {
    return computeExamAlerts(plans, new Date(clockTick));
  }, [plans, clockTick]);

  const unreadAlerts = useMemo(
    () => examAlerts.filter((a) => !readAlertIds.includes(a.id)),
    [examAlerts, readAlertIds]
  );

  useEffect(() => {
    const now = new Date(clockTick);
    const todayKey = toLocalDateString(now);
    const newlyNotified: string[] = [];

    for (const alert of unreadAlerts) {
      const plan = plans.find((p) => p.id === alert.planId);
      if (!plan) continue;
      const cfg = normalizeReminderConfig(plan.reminderConfig);
      if (!cfg.browserNotifications) continue;
      if (!isReminderTimeReachedToday(cfg.reminderTime, now)) continue;

      const dailyKey = `${alert.id}__${todayKey}`;
      if (!notifiedBrowserKeys.includes(dailyKey)) {
        const sent = triggerBrowserNotification(alert.title, alert.message, dailyKey);
        if (sent) {
          newlyNotified.push(dailyKey);
        }
      }
    }

    if (newlyNotified.length > 0) {
      setNotifiedBrowserKeys((prev) => [...prev, ...newlyNotified]);
    }
  }, [clockTick, unreadAlerts, plans, notifiedBrowserKeys]);

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

  const handleReplaceExercises = (
    exercises: StepByStepExercise[],
    sourceLabel: string
  ) => {
    updateActivePlan((plan) => ({
      ...plan,
      exercises,
      exercisesSyncedAt: new Date().toISOString(),
      exercisesSourceLabel: sourceLabel,
    }));
  };

  const handleUpdateExamDate = (examDate: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      examDate,
    }));
  };

  const handleUpdateReminderConfig = (reminderConfig: ExamReminderConfig) => {
    updateActivePlan((plan) => ({
      ...plan,
      reminderConfig,
    }));
  };

  const handleAddExamModel = (model: ExamModel) => {
    updateActivePlan((plan) => ({
      ...plan,
      examModels: [model, ...(plan.examModels ?? [])],
    }));
  };

  const handleSaveExamAttempt = (modelId: string, attempt: ExamAttemptResult) => {
    updateActivePlan((plan) => ({
      ...plan,
      examModels: (plan.examModels ?? []).map((m) =>
        m.id === modelId ? { ...m, latestAttempt: attempt } : m
      ),
    }));
  };

  const handleDeleteExamModel = (modelId: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      examModels: (plan.examModels ?? []).filter((m) => m.id !== modelId),
    }));
  };

  const handleAddBibliographyEntry = (entry: BibliographyEntry) => {
    updateActivePlan((plan) => ({
      ...plan,
      bibliography: [entry, ...(plan.bibliography ?? [])],
      summaryUpdatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteBibliographyEntry = (entryId: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      bibliography: (plan.bibliography ?? []).filter((b) => b.id !== entryId),
    }));
  };

  const handleMarkAlertRead = (alertId: string) => {
    setReadAlertIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
    setToastAlert((curr) => (curr?.id === alertId ? null : curr));
  };

  const handleMarkAllAlertsRead = () => {
    const allIds = examAlerts.map((a) => a.id);
    setReadAlertIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setToastAlert(null);
  };

  const handleSendTestAlert = () => {
    const days = getDaysUntilExam(activePlan.examDate);
    const completedPct = computePlanProgressPct(activePlan);
    const formattedDate = formatSpanishExamDate(activePlan.examDate);
    const testTitle =
      days === null
        ? `Recordatorio de prueba · ${activePlan.subject}`
        : days === 0
          ? `Hoy rendís ${activePlan.subject}`
          : days === 1
            ? `Mañana es tu examen de ${activePlan.subject}`
            : `Faltan ${days} días para ${activePlan.subject}`;
    const testMessage = activePlan.examDate
      ? `${activePlan.examType} programado para el ${formattedDate}. Avance del plan: ${completedPct}%.`
      : `Configurá la fecha de tu examen en el Planificador para activar alertas automáticas.`;

    const previewAlert: ExamAlert = {
      id: `test-${Date.now()}`,
      planId: activePlan.id,
      subject: activePlan.subject,
      examType: activePlan.examType,
      examDate: activePlan.examDate || '',
      daysRemaining: days ?? 0,
      urgency: days !== null && days <= 1 ? 'tomorrow' : 'soon',
      title: testTitle,
      message: testMessage,
      completedPct,
      reminderTime: activePlan.reminderConfig?.reminderTime || '09:00',
    };

    setToastAlert(previewAlert);
    triggerBrowserNotification(previewAlert.title, previewAlert.message, previewAlert.id);
  };

  const handleSaveAdaptiveSummary = (
    adaptiveSummary: AdaptiveExamSummary,
    examDate: string
  ) => {
    updateActivePlan((plan) => ({
      ...plan,
      examDate,
      adaptiveSummary,
      summaryUpdatedAt: new Date().toISOString(),
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
      const nowIso = new Date().toISOString();
      if (existing.length === 0) {
        return { ...plan, summarySections: suggested, summaryUpdatedAt: nowIso };
      }

      const byOrder = new Map(suggested.map((s) => [s.order, s]));
      const merged = existing.map((sec) => byOrder.get(sec.order) ?? sec);
      for (const s of suggested) {
        if (!existing.some((e) => e.order === s.order)) {
          merged.push(s);
        }
      }
      merged.sort((a, b) => a.order - b.order);
      return { ...plan, summarySections: merged, summaryUpdatedAt: nowIso };
    });
  };

  const handleUndoSummaryCorrection = () => {
    const prevSections = previousSectionsByPlan[activePlan.id];
    if (!prevSections) return;
    updateActivePlan((plan) => ({
      ...plan,
      summarySections: prevSections,
      summaryUpdatedAt: new Date().toISOString(),
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

              {/* Notifications Bell Trigger */}
              <button
                id="notifications-trigger-btn"
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label={`Recordatorios de examen (${unreadAlerts.length} sin leer)`}
                className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  notificationsOpen
                    ? isNightSurfaceActive
                      ? 'bg-[#253247] border-[#3B527A] text-white'
                      : isReadingSurfaceActive
                        ? 'bg-[#E9DFC8] border-[#D3C3A3] text-[#1F170C]'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    : isNightSurfaceActive
                      ? 'bg-[#1B2435] border-[#2C384E] text-[#E2E8F0] hover:bg-[#222D42]'
                      : isReadingSurfaceActive
                        ? 'bg-[#F2ECDC] border-[#DFD5BE] text-[#2B2316] hover:bg-[#EAE1CC]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Alertas</span>
                {unreadAlerts.length > 0 && (
                  <span
                    className={`font-mono tabular-nums text-[11px] font-semibold ${
                      isNightSurfaceActive
                        ? 'text-[#93C5FD]'
                        : isReadingSurfaceActive
                          ? 'text-[#8B5220]'
                          : 'text-blue-700'
                    }`}
                  >
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

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
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Inline Urgent Exam Reminder Strip (non-modal, dismissible) */}
        {unreadAlerts.length > 0 && (
          <div
            role="status"
            className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
              isNightSurfaceActive
                ? 'bg-[#171E2B] border-[#2F4363] text-[#E2E8F0]'
                : isReadingSurfaceActive
                  ? 'bg-[#FAF6EB] border-[#DFD5BE] text-[#241E18]'
                  : unreadAlerts[0].daysRemaining <= 1
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-blue-50/70 border-blue-200 text-slate-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <Bell
                className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                  isNightSurfaceActive
                    ? 'text-[#7CB4FF]'
                    : isReadingSurfaceActive
                      ? 'text-[#8B5220]'
                      : unreadAlerts[0].daysRemaining <= 1
                        ? 'text-amber-700'
                        : 'text-blue-700'
                }`}
              />
              <div className="min-w-0 text-xs leading-relaxed">
                <span className="font-semibold">{unreadAlerts[0].title}</span>
                <span className="mx-1.5 opacity-60" aria-hidden="true">
                  ·
                </span>
                <span className="opacity-85">{unreadAlerts[0].message}</span>
                {unreadAlerts.length > 1 && (
                  <span className="ml-1.5 font-medium opacity-75">
                    (+{unreadAlerts.length - 1} más)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  handleMarkAlertRead(unreadAlerts[0].id);
                  setActivePlanId(unreadAlerts[0].planId);
                  setActiveTab('exam');
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isNightSurfaceActive
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    : isReadingSurfaceActive
                      ? 'bg-[#8B5220] text-[#FAF6EB] hover:bg-[#744318]'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Ver repaso
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleMarkAlertRead(unreadAlerts[0].id)}
                aria-label="Descartar recordatorio"
                className="px-2 py-1 text-xs font-medium opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <StudyPlannerView
            plan={activePlan}
            onToggleBlock={handleToggleBlock}
            onNavigateTab={setActiveTab}
            onRebalanceTime={handleRebalanceTime}
            onUpdateExamDate={handleUpdateExamDate}
            onUpdateReminderConfig={handleUpdateReminderConfig}
            onSendTestAlert={handleSendTestAlert}
          />
        )}

        {activeTab === 'summary' && (
          <ExamSummaryView
            plan={activePlan}
            onNavigateTab={setActiveTab}
            onAddExamModel={handleAddExamModel}
            onSaveExamAttempt={handleSaveExamAttempt}
            onDeleteExamModel={handleDeleteExamModel}
            onAddBibliographyEntry={handleAddBibliographyEntry}
            onDeleteBibliographyEntry={handleDeleteBibliographyEntry}
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
            key={activePlan.id}
            plan={activePlan}
            onAddExercise={handleAddExercise}
            onReplaceExercises={handleReplaceExercises}
            onNavigateTab={setActiveTab}
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
            onUpdateReminderConfig={handleUpdateReminderConfig}
            onSendTestAlert={handleSendTestAlert}
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

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        alerts={examAlerts}
        readAlertIds={readAlertIds}
        plans={plans}
        onMarkRead={handleMarkAlertRead}
        onMarkAllRead={handleMarkAllAlertsRead}
        onNavigatePlanTab={(planId, tab) => {
          setActivePlanId(planId);
          setActiveTab(tab);
        }}
        onSendTestAlert={handleSendTestAlert}
        isReadingMode={isReadingSurfaceActive}
        isNightMode={isNightSurfaceActive}
      />

      {/* Live Test / Triggered Toast Notification */}
      {toastAlert && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 border rounded-xl p-4 shadow-2xl space-y-2.5 ${
            isNightSurfaceActive
              ? 'bg-[#171E2B] border-[#344C73] text-[#F1F5F9]'
              : isReadingSurfaceActive
                ? 'bg-[#FAF6EB] border-[#D8CBB0] text-[#241E18]'
                : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell
                className={`w-4 h-4 shrink-0 ${
                  isNightSurfaceActive
                    ? 'text-[#7CB4FF]'
                    : isReadingSurfaceActive
                      ? 'text-[#8B5220]'
                      : 'text-blue-700'
                }`}
              />
              <span className="text-xs font-semibold">{toastAlert.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastAlert(null)}
              aria-label="Cerrar notificación"
              className="p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">{toastAlert.message}</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setActivePlanId(toastAlert.planId);
                setActiveTab('exam');
                setToastAlert(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                isNightSurfaceActive
                  ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                  : isReadingSurfaceActive
                    ? 'bg-[#8B5220] text-[#FAF6EB] hover:bg-[#744318]'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Ir al examen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
