export type StudyTab = 'plan' | 'summary' | 'guide' | 'exercises' | 'exam' | 'charts' | 'library';

export type ExamUrgencyTier = 'emergencia' | 'sprint' | 'consolidacion' | 'profundo';

export interface AdaptivePriorityTopic {
  topic: string;
  weight: string;
  whyItMatters: string;
  quickRule: string;
}

export interface AdaptiveFormulaTip {
  name: string;
  latex: string;
  survivalTip: string;
}

export interface SummarySection {
  order: number;
  title: string;
  content: string;
  formulaLatex?: string;
  formulaCaption?: string;
}

export interface AdaptiveExamSummary {
  tier: ExamUrgencyTier;
  examDate: string;
  daysRemaining: number;
  hoursPerDay: number;
  totalEffectiveHours: number;
  generatedAt: string;
  strategyTitle: string;
  timeAllocationAdvice?: string;
  compressedSummary: string;
  summarySections?: SummarySection[];
  priorityTopics: AdaptivePriorityTopic[];
  mustMemorizeFormulas: AdaptiveFormulaTip[];
  discardForNow: string[];
  lastHourChecklist: string[];
}

export type BlockCategory = 'teoria' | 'practica' | 'repaso' | 'simulacro' | 'descanso';

export interface StudyBlock {
  id: string;
  sessionLabel: string; // e.g., "Día 1 · Mañana" or "Bloque 1"
  title: string;
  category: BlockCategory;
  durationMinutes: number;
  objective: string;
  deliverable: string;
  targetTab: StudyTab;
  completed: boolean;
}

export interface KeyConcept {
  id: string;
  term: string;
  academicDefinition: string;
  simpleExplanation: string;
  everydayExample: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  latex: string;
  variables: string;
  whenToUse: string;
  whenNotToUse: string;
}

export interface ExamTrap {
  id: string;
  mistake: string;
  whyItHappens: string;
  howToAvoid: string;
}

export interface GuideSection {
  id: string;
  order: number;
  title: string;
  coreIdea: string;
  explanation: string;
  concreteExample: string;
  keyTakeaway: string;
}

export interface MasteryCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExerciseStep {
  stepNumber: number;
  title: string;
  thinkingPrompt: string;
  mathLatex: string;
  explanation: string;
  watchOut: string;
  highlightElement?: 'axes' | 'gravity' | 'normal' | 'friction' | 'applied' | 'result' | 'energy';
  quickCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  };
}

export type VisualModelType = 'inclined_plane' | 'projectile' | 'circuit_or_generic' | 'none';

export interface ExerciseVisualConfig {
  type: VisualModelType;
  angleDeg?: number;
  massKg?: number;
  mu?: number;
  velocityMs?: number;
  caption?: string;
}

export interface StepByStepExercise {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Base' | 'Parcial' | 'Integrador';
  statement: string;
  givenData: { symbol: string; value: string; unit: string }[];
  unknowns: string[];
  visualConfig?: ExerciseVisualConfig;
  steps: ExerciseStep[];
  finalAnswer: string;
}

export interface StudyPlan {
  id: string;
  subject: string;
  examType: string;
  examDate?: string;
  folder?: string;
  pinned?: boolean;
  createdAt: string;
  totalMinutes: number;
  daysAvailable: number;
  hoursPerDay: number;
  pace: 'Intensivo' | 'Equilibrado' | 'Profundo';
  executiveSummary: string;
  summarySections?: SummarySection[];
  adaptiveSummary?: AdaptiveExamSummary;
  studyBlocks: StudyBlock[];
  keyConcepts: KeyConcept[];
  formulas: FormulaItem[];
  examTraps: ExamTrap[];
  guideSections: GuideSection[];
  masteryChecklist: MasteryCheckItem[];
  quizQuestions: QuizQuestion[];
  exercises: StepByStepExercise[];
}

export interface UploadedFilePayload {
  name: string;
  mimeType: string;
  base64Data: string;
  textContent?: string;
}

export interface ChartPoint {
  x: number;
  y: number;
  label?: string;
  group?: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  unit?: string;
  color: string;
  mode: 'line' | 'scatter';
  points: ChartPoint[];
}

export interface ChartDataset {
  id: string;
  title: string;
  subjectTag: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  insightSummary: string;
  slopeMeaning?: string;
  areaMeaning?: string;
  series: ChartSeries[];
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedSections?: SummarySection[];
  applied?: boolean;
}
