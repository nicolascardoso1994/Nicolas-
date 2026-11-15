import { type RefObject, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  BookOpen,
  BookOpenText,
  Calculator,
  ArrowRight,
  Wand2,
  FileDown,
  Loader2,
  Moon,
  Eye,
} from 'lucide-react';
import { StudyPlan, StudyTab } from '../types/study';
import { MathBlock, MathText } from './MathText';
import { SummaryPdfSheet } from './SummaryPdfSheet';
import { VisualDiagramCard } from './VisualDiagramCard';
import { exportBlocksToPdf } from '../utils/exportPdf';

type SummarySectionTarget = 'all' | 'concepts' | 'visuals' | 'formulas' | 'traps';

interface ExamSummaryViewProps {
  plan: StudyPlan;
  onNavigateTab: (tab: StudyTab) => void;
  readingMode?: boolean;
  onToggleReadingMode?: () => void;
  nightMode?: boolean;
  onToggleNightMode?: () => void;
  onAskAssistant?: (options?: { mode?: 'ask' | 'improve'; sectionOrder?: number }) => void;
}

export function ExamSummaryView({
  plan,
  onNavigateTab,
  readingMode: controlledReadingMode,
  onToggleReadingMode,
  nightMode: controlledNightMode,
  onToggleNightMode,
  onAskAssistant,
}: ExamSummaryViewProps) {
  const [activeSection, setActiveSection] = useState<SummarySectionTarget>('all');
  const [highlightedSection, setHighlightedSection] = useState<SummarySectionTarget | null>(null);
  const [localReadingMode, setLocalReadingMode] = useState(false);
  const [localNightMode, setLocalNightMode] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfSheetRef = useRef<HTMLDivElement | null>(null);

  const summaryTopRef = useRef<HTMLElement | null>(null);
  const conceptsRef = useRef<HTMLElement | null>(null);
  const visualsRef = useRef<HTMLElement | null>(null);
  const formulasRef = useRef<HTMLElement | null>(null);
  const trapsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setActiveSection('all');
    setHighlightedSection(null);
  }, [plan.id]);

  useEffect(() => {
    if (!highlightedSection) return;
    const timer = window.setTimeout(() => setHighlightedSection(null), 1400);
    return () => window.clearTimeout(timer);
  }, [highlightedSection]);

  const handleJumpToSection = (target: SummarySectionTarget) => {
    setActiveSection(target);
    const refMap: Record<SummarySectionTarget, RefObject<HTMLElement | null>> = {
      all: summaryTopRef,
      concepts: conceptsRef,
      visuals: visualsRef,
      formulas: formulasRef,
      traps: trapsRef,
    };
    const element = refMap[target].current;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target !== 'all') {
        setHighlightedSection(target);
      }
    }
  };

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

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setPdfError(null);
    setExportingPdf(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => setTimeout(resolve, 100));
      });
      if (!pdfSheetRef.current) {
        throw new Error('No se pudo preparar la vista de impresión.');
      }
      await exportBlocksToPdf(pdfSheetRef.current, {
        fileName: `Resumen_${plan.subject}`,
        subject: plan.subject,
        readingMode: isReadingMode,
      });
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : 'No se pudo generar el archivo PDF.'
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const sections = plan.summarySections ?? [];
  const visualExamples = plan.visualExamples ?? [];
  const hasConcepts = plan.keyConcepts.length > 0;
  const hasFormulas = plan.formulas.length > 0;
  const hasVisuals = visualExamples.length > 0;
  const hasTraps = plan.examTraps.length > 0;

  const cardSurface = isNightMode
    ? 'bg-[#171E2B] border-[#293549]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#E4DCC8]'
      : 'bg-white border-slate-200';
  const innerPaper = isNightMode
    ? 'bg-[#1F2838] border-[#313F57]'
    : isReadingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';
  const dividerColor = isNightMode
    ? 'border-[#253042]'
    : isReadingMode
      ? 'border-[#E9E1CE]'
      : 'border-slate-100';
  const headingInk = isNightMode
    ? 'text-white'
    : isReadingMode
      ? 'text-[#241E18]'
      : 'text-slate-900';
  const bodyInk = isNightMode
    ? 'text-[#CBD5E1]'
    : isReadingMode
      ? 'text-[#3D352C]'
      : 'text-slate-700';
  const mutedInk = isNightMode
    ? 'text-[#94A3B8]'
    : isReadingMode
      ? 'text-[#6E6254]'
      : 'text-slate-500';
  const accentInk = isNightMode
    ? 'text-white'
    : isReadingMode
      ? 'text-[#8B5220]'
      : 'text-blue-700';

  return (
    <div
      className={`space-y-8 transition-colors duration-200 ${
        isNightMode
          ? 'night-mode bg-[#111722] border border-[#242F42] rounded-2xl p-4 sm:p-6 md:p-8'
          : isReadingMode
            ? 'reading-serif bg-[#F6F0E2] border border-[#E4DCC8] rounded-2xl p-4 sm:p-6 md:p-8'
            : ''
      }`}
    >
      {/* Ordered Executive Summary */}
      <section
        ref={summaryTopRef}
        className={`scroll-mt-28 border rounded-xl p-6 space-y-6 transition-colors duration-200 ${cardSurface}`}
      >
        <div
          className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b ${dividerColor}`}
        >
          <div>
            <p className={`text-xs font-medium ${accentInk}`}>
              Resumen de nivel universitario · {plan.examType}
            </p>
            <h2 className={`mt-1 text-xl font-semibold ${headingInk}`}>
              Resumen ordenado de {plan.subject}
            </h2>
            {isReadingMode && (
              <p className={`mt-1 text-xs ${mutedInk}`}>
                Modo Lectura activo · Fondo crema y tipografía serif para sesiones largas sin fatiga visual
              </p>
            )}
            {isNightMode && (
              <p className={`mt-1 text-xs ${mutedInk}`}>
                Modo Nocturno activo · Fondo oscuro de bajo brillo para estudiar de noche
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
            <button
              type="button"
              disabled={exportingPdf}
              onClick={handleExportPdf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 font-sans disabled:opacity-60 ${
                isNightMode
                  ? 'bg-[#253247] border-[#374863] text-[#F1F5F9] hover:bg-[#2F3F59]'
                  : isReadingMode
                    ? 'bg-[#8B5220] border-[#744318] text-[#FAF6EB] hover:bg-[#744318]'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {exportingPdf ? 'Generando PDF...' : 'Exportar PDF'}
            </button>

            {onAskAssistant && (
              <button
                type="button"
                onClick={() => onAskAssistant({ mode: 'improve' })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 font-sans ${
                  isNightMode
                    ? 'bg-[#1D2B42] border-[#2E4468] text-[#93C5FD] hover:bg-[#243552]'
                    : isReadingMode
                      ? 'bg-[#EFE6D2] border-[#D8CBB0] text-[#3B2E1E] hover:bg-[#E7DAC0]'
                      : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Simplificar o preguntar a la IA
              </button>
            )}

            {/* Reading Mode Switch */}
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

            {/* Night Mode Switch right next to Reading Mode */}
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

            {/* Quick section jump navigation */}
            <nav
              aria-label="Ir directo a apartado del resumen"
              className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg font-sans ${
                isNightMode
                  ? 'bg-[#111722]'
                  : isReadingMode
                    ? 'bg-[#EFE7D5]'
                    : 'bg-slate-100'
              }`}
            >
              {(
                [
                  { id: 'all', label: 'Todo', show: true },
                  { id: 'concepts', label: 'Conceptos', show: hasConcepts },
                  { id: 'visuals', label: 'Esquemas visuales', show: hasVisuals },
                  { id: 'formulas', label: 'Fórmulas', show: hasFormulas },
                  { id: 'traps', label: 'Trampas', show: hasTraps },
                ] as const
              )
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleJumpToSection(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      activeSection === item.id
                        ? isNightMode
                          ? 'bg-[#253147] text-[#F1F5F9] shadow-xs'
                          : isReadingMode
                            ? 'bg-[#FAF6EB] text-[#241E18] shadow-xs'
                            : 'bg-white text-slate-900 shadow-xs'
                        : isNightMode
                          ? 'text-[#94A3B8] hover:text-[#F1F5F9]'
                          : isReadingMode
                            ? 'text-[#6E6254] hover:text-[#241E18]'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </nav>
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((sec, idx) => (
              <article
                key={idx}
                className={`space-y-3 pb-6 border-b last:border-b-0 last:pb-0 ${dividerColor}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className={`font-semibold ${headingInk} ${
                      isReadingMode ? 'text-lg md:text-xl' : 'text-base'
                    }`}
                  >
                    {sec.order}. {sec.title}
                  </h3>
                  {onAskAssistant && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskAssistant({ mode: 'improve', sectionOrder: sec.order })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors font-sans whitespace-nowrap shrink-0 ${
                        isNightMode
                          ? 'border-[#313F57] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1F2838]'
                          : isReadingMode
                            ? 'border-[#DFD6BF] text-[#6E6254] hover:text-[#241E18] hover:bg-[#F2ECDC]'
                            : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Wand2 className="w-3 h-3" />
                      Hacer más fácil
                    </button>
                  )}
                </div>
                <p
                  className={`${bodyInk} ${
                    isReadingMode
                      ? 'text-base md:text-[17px] leading-[1.82] max-w-[68ch]'
                      : isNightMode
                        ? 'text-sm md:text-base leading-[1.75] max-w-4xl'
                        : 'text-sm md:text-base leading-relaxed max-w-4xl'
                  }`}
                >
                  <MathText text={sec.content} />
                </p>
                {sec.formulaLatex && (
                  <div className={`my-3 border rounded-lg px-4 py-3 space-y-1 ${innerPaper}`}>
                    <div className={`overflow-x-auto text-center ${headingInk}`}>
                      <MathBlock latex={sec.formulaLatex} displayMode={true} bold={true} />
                    </div>
                    {sec.formulaCaption && (
                      <p className={`text-xs text-center ${mutedInk}`}>
                        {sec.formulaCaption}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p
            className={`${bodyInk} ${
              isReadingMode
                ? 'text-base md:text-[17px] leading-[1.82] max-w-[68ch]'
                : 'text-base leading-relaxed max-w-4xl'
            }`}
          >
            <MathText text={plan.executiveSummary} />
          </p>
        )}
      </section>

      {/* Key Concepts */}
      {hasConcepts && (
        <section
          ref={conceptsRef}
          id="resumen-conceptos"
          className={`scroll-mt-28 space-y-4 rounded-xl transition-shadow duration-300 ${
            highlightedSection === 'concepts'
              ? isNightMode
                ? 'ring-2 ring-[#3B82F6]/60 ring-offset-4 ring-offset-[#111722]'
                : isReadingMode
                  ? 'ring-2 ring-[#8B5220]/45 ring-offset-4 ring-offset-[#F6F0E2]'
                  : 'ring-2 ring-blue-500/45 ring-offset-4 ring-offset-slate-50'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${accentInk}`} />
              <h3 className={`text-lg font-semibold ${headingInk}`}>
                Conceptos clave y ejemplos sencillos
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs tabular-nums ${mutedInk}`}>
                {plan.keyConcepts.length} núcleos temáticos
              </span>
              <button
                type="button"
                onClick={() => handleJumpToSection('all')}
                className={`inline-flex items-center gap-1 text-xs font-medium font-sans transition-colors ${mutedInk} hover:underline`}
              >
                <ArrowUp className="w-3 h-3" />
                Arriba
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plan.keyConcepts.map((concept, idx) => (
              <article
                key={concept.id}
                className={`border rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors duration-200 ${cardSurface}`}
              >
                <div className="space-y-3">
                  <div className={`text-xs font-mono tabular-nums ${mutedInk}`}>
                    0{idx + 1}. Concepto evaluable
                  </div>
                  <h4 className={`text-base font-semibold ${headingInk}`}>
                    <MathText text={concept.term} />
                  </h4>
                  <p
                    className={`${bodyInk} ${
                      isReadingMode ? 'text-[15px] leading-[1.75]' : 'text-sm leading-relaxed'
                    }`}
                  >
                    <MathText text={concept.academicDefinition} />
                  </p>
                </div>

                <div className={`pt-3 border-t space-y-2.5 ${dividerColor}`}>
                  <div>
                    <span className={`text-xs font-semibold ${accentInk}`}>
                      En palabras simples:{' '}
                    </span>
                    <span
                      className={`${bodyInk} ${
                        isReadingMode ? 'text-[15px] leading-[1.7]' : 'text-sm'
                      }`}
                    >
                      <MathText text={concept.simpleExplanation} />
                    </span>
                  </div>
                  <div className={`border rounded-lg p-3 ${innerPaper}`}>
                    <span className={`text-xs font-semibold ${headingInk}`}>
                      Ejemplo cotidiano:{' '}
                    </span>
                    <span
                      className={
                        isNightMode
                          ? 'text-xs text-[#CBD5E1] leading-relaxed'
                          : isReadingMode
                            ? 'text-[13px] text-[#4A4035] leading-relaxed'
                            : 'text-xs text-slate-600 leading-relaxed'
                      }
                    >
                      <MathText text={concept.everydayExample} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Visual & Anatomical Examples */}
      {hasVisuals && (
        <section
          ref={visualsRef}
          id="resumen-esquemas"
          className={`scroll-mt-28 space-y-4 rounded-xl transition-shadow duration-300 ${
            highlightedSection === 'visuals'
              ? isNightMode
                ? 'ring-2 ring-[#3B82F6]/60 ring-offset-4 ring-offset-[#111722]'
                : isReadingMode
                  ? 'ring-2 ring-[#8B5220]/45 ring-offset-4 ring-offset-[#F6F0E2]'
                  : 'ring-2 ring-blue-500/45 ring-offset-4 ring-offset-slate-50'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Eye className={`w-4 h-4 ${accentInk}`} />
              <h3 className={`text-lg font-semibold ${headingInk}`}>
                Ejemplos gráficos y partes clave
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs tabular-nums ${mutedInk}`}>
                {visualExamples.length}{' '}
                {visualExamples.length === 1 ? 'esquema interactivo' : 'esquemas interactivos'}
              </span>
              <button
                type="button"
                onClick={() => handleJumpToSection('all')}
                className={`inline-flex items-center gap-1 text-xs font-medium font-sans transition-colors ${mutedInk} hover:underline`}
              >
                <ArrowUp className="w-3 h-3" />
                Arriba
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visualExamples.map((example) => (
              <VisualDiagramCard
                key={example.id}
                example={example}
                isReadingMode={isReadingMode}
                isNightMode={isNightMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* Critical Formulas */}
      {hasFormulas && (
        <section
          ref={formulasRef}
          id="resumen-formulas"
          className={`scroll-mt-28 space-y-4 rounded-xl transition-shadow duration-300 ${
            highlightedSection === 'formulas'
              ? isNightMode
                ? 'ring-2 ring-[#3B82F6]/60 ring-offset-4 ring-offset-[#111722]'
                : isReadingMode
                  ? 'ring-2 ring-[#8B5220]/45 ring-offset-4 ring-offset-[#F6F0E2]'
                  : 'ring-2 ring-blue-500/45 ring-offset-4 ring-offset-slate-50'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calculator className={`w-4 h-4 ${accentInk}`} />
              <h3 className={`text-lg font-semibold ${headingInk}`}>
                Formulario y relaciones críticas
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs tabular-nums ${mutedInk}`}>
                {plan.formulas.length} ecuaciones
              </span>
              <button
                type="button"
                onClick={() => handleJumpToSection('all')}
                className={`inline-flex items-center gap-1 text-xs font-medium font-sans transition-colors ${mutedInk} hover:underline`}
              >
                <ArrowUp className="w-3 h-3" />
                Arriba
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.formulas.map((formula, idx) => (
              <div
                key={formula.id}
                className={`border rounded-xl p-5 space-y-3 transition-colors duration-200 ${cardSurface}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${headingInk}`}>
                    0{idx + 1}. {formula.name}
                  </h4>
                </div>

                <div
                  className={`border rounded-lg px-4 py-3 overflow-x-auto text-center ${
                    isNightMode
                      ? 'bg-[#1F2838] border-[#313F57] text-white'
                      : isReadingMode
                        ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#241E18]'
                        : 'bg-slate-50 border-slate-200 text-slate-950'
                  }`}
                >
                  <MathBlock latex={formula.latex} displayMode={true} bold={true} />
                </div>

                <p className={`text-xs leading-relaxed ${mutedInk}`}>
                  <strong className={headingInk}>Variables:</strong>{' '}
                  <MathText text={formula.variables} />
                </p>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t text-xs ${dividerColor}`}>
                  <div
                    className={`border rounded-lg p-2.5 ${
                      isNightMode
                        ? 'bg-[#142923] border-[#244B3E]'
                        : isReadingMode
                          ? 'bg-[#ECF2E7] border-[#CEDAC4]'
                          : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <span
                      className={`font-semibold block mb-0.5 ${
                        isNightMode
                          ? 'text-[#86EFAC]'
                          : isReadingMode
                            ? 'text-[#2D4A29]'
                            : 'text-emerald-800'
                      }`}
                    >
                      Cuándo usarla
                    </span>
                    <span className={`${bodyInk} leading-relaxed`}>
                      <MathText text={formula.whenToUse} />
                    </span>
                  </div>
                  <div
                    className={`border rounded-lg p-2.5 ${
                      isNightMode
                        ? 'bg-[#2B2215] border-[#523F1F]'
                        : isReadingMode
                          ? 'bg-[#F7EEDB] border-[#E2CFA8]'
                          : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <span
                      className={`font-semibold block mb-0.5 ${
                        isNightMode
                          ? 'text-[#FCD34D]'
                          : isReadingMode
                            ? 'text-[#6A4614]'
                            : 'text-amber-800'
                      }`}
                    >
                      Cuándo evitarla
                    </span>
                    <span className={`${bodyInk} leading-relaxed`}>
                      <MathText text={formula.whenNotToUse} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exam Traps */}
      {hasTraps && (
        <section
          ref={trapsRef}
          id="resumen-trampas"
          className={`scroll-mt-28 border rounded-xl overflow-hidden transition-all duration-300 ${cardSurface} ${
            highlightedSection === 'traps'
              ? isNightMode
                ? 'ring-2 ring-[#3B82F6]/60 ring-offset-4 ring-offset-[#111722]'
                : isReadingMode
                  ? 'ring-2 ring-[#8B5220]/45 ring-offset-4 ring-offset-[#F6F0E2]'
                  : 'ring-2 ring-blue-500/45 ring-offset-4 ring-offset-slate-50'
              : ''
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
              isNightMode
                ? 'border-[#293549]'
                : isReadingMode
                  ? 'border-[#E4DCC8]'
                  : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  isNightMode
                    ? 'text-[#FBBF24]'
                    : isReadingMode
                      ? 'text-[#9A5B13]'
                      : 'text-amber-600'
                }`}
              />
              <h3 className={`text-lg font-semibold ${headingInk}`}>
                Trampas frecuentes en parciales y finales
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleJumpToSection('all')}
                className={`inline-flex items-center gap-1 text-xs font-medium font-sans transition-colors ${mutedInk} hover:underline`}
              >
                <ArrowUp className="w-3 h-3" />
                Arriba
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('exercises')}
                className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 font-sans ${
                  isNightMode
                    ? 'text-[#7CB4FF] hover:text-[#93C5FD]'
                    : isReadingMode
                      ? 'text-[#8B5220] hover:text-[#6B3E16]'
                      : 'text-blue-700 hover:text-blue-800'
                }`}
              >
                {plan.subjectMode === 'theoretical' || !hasFormulas
                  ? 'Ver casos visuales paso a paso'
                  : 'Practicar en ejercicios'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
            {plan.examTraps.map((trap, idx) => (
              <div key={trap.id} className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span
                    className={`text-xs font-mono font-semibold block mb-1 ${
                      isNightMode
                        ? 'text-white'
                        : isReadingMode
                          ? 'text-[#8A5114]'
                          : 'text-amber-700'
                    }`}
                  >
                    Error #{idx + 1}
                  </span>
                  <p className={`font-semibold ${headingInk}`}>
                    <MathText text={trap.mistake} />
                  </p>
                </div>
                <div>
                  <span className={`text-xs font-medium block mb-1 ${mutedInk}`}>
                    Por qué suele ocurrir
                  </span>
                  <p
                    className={
                      isNightMode
                        ? 'text-[#94A3B8] leading-relaxed'
                        : isReadingMode
                          ? 'text-[#4F453A] leading-[1.7]'
                          : 'text-slate-600 leading-relaxed'
                    }
                  >
                    <MathText text={trap.whyItHappens} />
                  </p>
                </div>
                <div>
                  <span
                    className={`text-xs font-medium block mb-1 ${
                      isNightMode
                        ? 'text-[#6EE7B7]'
                        : isReadingMode
                          ? 'text-[#2D5429]'
                          : 'text-emerald-700'
                    }`}
                  >
                    Cómo resolverlo bien
                  </span>
                  <p className={`${isReadingMode ? `${bodyInk} leading-[1.7]` : `${bodyInk} leading-relaxed`}`}>
                    <MathText text={trap.howToAvoid} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pdfError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {pdfError}
        </div>
      )}

      {exportingPdf && (
        <div
          ref={pdfSheetRef}
          className="fixed -left-[12000px] top-0 pointer-events-none -z-10"
        >
          <SummaryPdfSheet
            plan={plan}
            filterMode={activeSection === 'visuals' ? 'all' : activeSection}
            readingMode={isReadingMode}
          />
        </div>
      )}
    </div>
  );
}
