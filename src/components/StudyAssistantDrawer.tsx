import { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Check,
  RotateCcw,
  MessageCircleQuestion,
  Wand2,
} from 'lucide-react';
import { AssistantMessage, StudyPlan, SummarySection } from '../types/study';
import { MathBlock, MathText } from './MathText';

interface StudyAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  plan: StudyPlan;
  initialMode?: 'ask' | 'improve';
  initialSectionOrder?: number | null;
  onApplySummaryCorrections: (updatedSections: SummarySection[]) => void;
  onUndoSummaryCorrection?: () => void;
  canUndoCorrection?: boolean;
  readingMode?: boolean;
  nightMode?: boolean;
}

const QUICK_DOUBTS = [
  'Explicame la idea central como si recién empezara',
  '¿Cuándo uso cada fórmula sin confundirme?',
  'Dame un ejemplo cotidiano sencillo de este tema',
  '¿Qué errores comunes tengo que evitar en el parcial?',
];

const QUICK_IMPROVEMENTS = [
  {
    label: 'Hacerlo más simple y amigable',
    prompt: 'Reescribilo con lenguaje más cercano, oraciones cortas y lectura bien ágil, sin perder precisión.',
  },
  {
    label: 'Agregar ejemplo fácil',
    prompt: 'Sumá un ejemplo cotidiano concreto dentro de la explicación para que se entienda al instante.',
  },
  {
    label: 'Aclarar qué significa la fórmula',
    prompt: 'Explicá en palabras sencillas qué representa la ecuación y cuándo conviene usarla.',
  },
  {
    label: 'Resumirlo más corto',
    prompt: 'Hacé la lectura más breve y directa, dejando solo lo esencial para repasar rápido.',
  },
];

export function StudyAssistantDrawer({
  open,
  onClose,
  plan,
  initialMode = 'ask',
  initialSectionOrder = null,
  onApplySummaryCorrections,
  onUndoSummaryCorrection,
  canUndoCorrection = false,
  readingMode = false,
  nightMode = false,
}: StudyAssistantDrawerProps) {
  const [mode, setMode] = useState<'ask' | 'improve'>(initialMode);
  const [targetSectionOrder, setTargetSectionOrder] = useState<number | 'ALL'>(
    initialSectionOrder !== null ? initialSectionOrder : 'ALL'
  );
  const [input, setInput] = useState('');
  const [messagesByPlan, setMessagesByPlan] = useState<Record<string, AssistantMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setTargetSectionOrder(initialSectionOrder !== null ? initialSectionOrder : 'ALL');
      setError(null);
    }
  }, [open, initialMode, initialSectionOrder]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onClose]);

  const messages = messagesByPlan[plan.id] ?? [];

  useEffect(() => {
    if (open) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open]);

  if (!open) return null;

  const sections = plan.summarySections ?? [];

  const sendPrompt = async (customText?: string, forcedMode?: 'ask' | 'improve') => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || loading) return;

    const effectiveMode = forcedMode ?? mode;
    setError(null);

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text:
        effectiveMode === 'improve' && targetSectionOrder !== 'ALL'
          ? `[Sección ${targetSectionOrder}] ${textToSend}`
          : textToSend,
    };

    const prevHistory = messagesByPlan[plan.id] ?? [];
    setMessagesByPlan((prev) => ({
      ...prev,
      [plan.id]: [...prevHistory, userMsg],
    }));

    if (!customText) {
      setInput('');
    }
    setLoading(true);

    try {
      const response = await fetch('/api/study-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: effectiveMode,
          message: textToSend,
          targetSectionOrder:
            effectiveMode === 'improve' && targetSectionOrder !== 'ALL'
              ? targetSectionOrder
              : null,
          subject: plan.subject,
          examType: plan.examType,
          summarySections: sections,
          keyConcepts: plan.keyConcepts.map((c) => ({
            term: c.term,
            simpleExplanation: c.simpleExplanation,
          })),
          formulas: plan.formulas.map((f) => ({
            name: f.name,
            latex: f.latex,
            whenToUse: f.whenToUse,
          })),
          history: prevHistory.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No pude responder en este momento.');
      }

      const assistantMsg: AssistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply || '',
        suggestedSections: Array.isArray(data.suggestedSections) ? data.suggestedSections : [],
        applied: false,
      };

      setMessagesByPlan((prev) => ({
        ...prev,
        [plan.id]: [...(prev[plan.id] ?? []), assistantMsg],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (messageId: string, suggested: SummarySection[]) => {
    onApplySummaryCorrections(suggested);
    setMessagesByPlan((prev) => ({
      ...prev,
      [plan.id]: (prev[plan.id] ?? []).map((m) =>
        m.id === messageId ? { ...m, applied: true } : m
      ),
    }));
  };

  const panelBg = nightMode
    ? 'bg-[#151C28]'
    : readingMode
      ? 'bg-[#FAF6EB]'
      : 'bg-white';
  const softBox = nightMode
    ? 'bg-[#1D2637] border-[#2E3B52]'
    : readingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';
  const primaryText = nightMode ? 'text-[#F1F5F9]' : 'text-slate-900';
  const mutedText = nightMode ? 'text-[#94A3B8]' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-assistant-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className={`w-full max-w-xl h-full flex flex-col border-l shadow-2xl transition-colors ${panelBg} ${
          nightMode
            ? 'night-mode border-[#293549]'
            : readingMode
              ? 'border-[#DFD6BF]'
              : 'border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${
            nightMode
              ? 'border-[#253042]'
              : readingMode
                ? 'border-[#E4DCC8]'
                : 'border-slate-200'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  nightMode
                    ? 'text-[#7CB4FF]'
                    : readingMode
                      ? 'text-[#8B5220]'
                      : 'text-blue-700'
                }`}
              />
              <h2
                id="study-assistant-title"
                className={`text-base font-semibold truncate ${primaryText}`}
              >
                Tu asistente de lectura y dudas
              </h2>
            </div>
            <p className={`text-xs truncate ${mutedText}`}>
              Materia: {plan.subject}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className={`p-1.5 rounded-lg transition-colors ${
              nightMode
                ? 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1F293B]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Friendly Mode Switcher */}
        <div
          className={`px-5 py-3 border-b space-y-3 ${
            nightMode
              ? 'border-[#253042] bg-[#111722]'
              : readingMode
                ? 'border-[#E4DCC8] bg-[#F5EFE0]'
                : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-lg ${nightMode ? 'bg-[#1B2435]' : 'bg-slate-200/70'}`}>
            <button
              type="button"
              onClick={() => setMode('ask')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                mode === 'ask'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              Preguntar una duda
            </button>
            <button
              type="button"
              onClick={() => setMode('improve')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                mode === 'improve'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Hacer lectura más fácil
            </button>
          </div>

          {mode === 'improve' && sections.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label htmlFor="assistant-target-section" className="text-slate-600 font-medium whitespace-nowrap">
                  Qué mejorar:
                </label>
                <select
                  id="assistant-target-section"
                  value={targetSectionOrder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetSectionOrder(val === 'ALL' ? 'ALL' : Number(val));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Todo el resumen</option>
                  {sections.map((sec) => (
                    <option key={sec.order} value={sec.order}>
                      {sec.order}. {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              {canUndoCorrection && onUndoSummaryCorrection && (
                <button
                  type="button"
                  onClick={onUndoSummaryCorrection}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Deshacer último cambio
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-5 py-2">
              <div className={`border rounded-xl p-4 space-y-1.5 ${softBox}`}>
                <p className={`text-sm font-semibold ${primaryText}`}>
                  {mode === 'ask'
                    ? 'Preguntame lo que quieras sobre esta materia'
                    : 'Mejorá cualquier parte del resumen para leerla sin esfuerzo'}
                </p>
                <p className={`text-xs leading-relaxed ${nightMode ? 'text-[#CBD5E1]' : 'text-slate-600'}`}>
                  {mode === 'ask'
                    ? 'Podés consultarme sobre un concepto, pedir un ejemplo más cotidiano, entender por qué se usa una fórmula o repasar cómo encarar un ejercicio.'
                    : 'Elegí una sección (o todo el resumen) y pedime que lo haga más simple, más corto o que te aclare las fórmulas. Vas a poder ver la corrección y aplicarla en un clic.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className={`text-xs font-medium ${mutedText}`}>
                  {mode === 'ask' ? 'Ideas rápidas para preguntar:' : 'Atajos amigables para mejorar la lectura:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {mode === 'ask'
                    ? QUICK_DOUBTS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          disabled={loading}
                          onClick={() => sendPrompt(q, 'ask')}
                          className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            nightMode
                              ? 'text-[#E2E8F0] bg-[#1E2738] hover:bg-[#27334A]'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {q}
                        </button>
                      ))
                    : QUICK_IMPROVEMENTS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          disabled={loading}
                          onClick={() => sendPrompt(item.prompt, 'improve')}
                          className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            nightMode
                              ? 'text-[#E2E8F0] bg-[#1E2738] hover:bg-[#27334A]'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed space-y-3 ${
                      msg.role === 'user'
                        ? nightMode
                          ? 'bg-[#253552] text-[#F8FAFC]'
                          : 'bg-slate-900 text-white'
                        : `border ${softBox} ${nightMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`
                    }`}
                  >
                    <div className="space-y-2">
                      <MathText text={msg.text} />
                    </div>

                    {/* Proposed Summary Corrections */}
                    {msg.role === 'assistant' &&
                      msg.suggestedSections &&
                      msg.suggestedSections.length > 0 && (
                        <div className={`pt-3 border-t space-y-3 ${nightMode ? 'border-[#2E3B52]' : 'border-slate-200/80'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${nightMode ? 'text-[#7CB4FF]' : 'text-blue-700'}`}>
                              Versión corregida propuesta ({msg.suggestedSections.length}{' '}
                              {msg.suggestedSections.length === 1 ? 'sección' : 'secciones'})
                            </span>
                            {msg.applied ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${nightMode ? 'text-[#6EE7B7]' : 'text-emerald-700'}`}>
                                <Check className="w-3.5 h-3.5" />
                                Aplicada al resumen
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApplySuggestion(msg.id, msg.suggestedSections ?? [])
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aplicar al resumen
                              </button>
                            )}
                          </div>

                          <div className="space-y-2.5">
                            {msg.suggestedSections.map((sec, idx) => (
                              <div
                                key={idx}
                                className={`border rounded-lg p-3 space-y-1.5 ${
                                  nightMode
                                    ? 'bg-[#151C28] border-[#2E3B52]'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <h4 className={`text-xs font-semibold ${primaryText}`}>
                                  {sec.order}. {sec.title}
                                </h4>
                                <p className={`text-xs leading-relaxed ${nightMode ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>
                                  <MathText text={sec.content} />
                                </p>
                                {sec.formulaLatex && (
                                  <div
                                    className={`border rounded px-2.5 py-2 overflow-x-auto text-center ${
                                      nightMode
                                        ? 'bg-[#1D2637] border-[#313F57] text-[#F8FAFC]'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <MathBlock latex={sec.formulaLatex} displayMode={true} bold={true} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={`border rounded-xl px-4 py-3 inline-flex items-center gap-2 text-xs ${softBox} ${mutedText}`}>
                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${nightMode ? 'text-[#7CB4FF]' : 'text-blue-700'}`} />
                  <span>
                    {mode === 'improve'
                      ? 'Preparando una versión más clara y amigable...'
                      : 'Pensando una explicación clara para vos...'}
                  </span>
                </div>
              )}
              <div ref={scrollEndRef} />
            </div>
          )}

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt();
          }}
          className={`p-4 border-t space-y-2 ${
            nightMode
              ? 'border-[#253042] bg-[#111722]'
              : readingMode
                ? 'border-[#E4DCC8] bg-[#F5EFE0]'
                : 'border-slate-200 bg-white'
          }`}
        >
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(mode === 'ask' ? QUICK_DOUBTS.slice(0, 2) : QUICK_IMPROVEMENTS.slice(0, 2)).map(
                (item) => {
                  const label = typeof item === 'string' ? item : item.label;
                  const promptVal = typeof item === 'string' ? item : item.prompt;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={loading}
                      onClick={() => sendPrompt(promptVal)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors truncate max-w-[240px]"
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt();
                }
              }}
              placeholder={
                mode === 'ask'
                  ? 'Escribí tu duda acá (ej: ¿por qué desaparece la masa en la fórmula?)'
                  : 'Pedí cómo querés mejorar la lectura (ej: hacelo más corto y con un ejemplo fácil)'
              }
              className={`flex-1 px-3.5 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                nightMode
                  ? 'bg-[#18202F] border-[#313F57] text-[#F1F5F9] placeholder:text-[#64748B]'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar consulta a la IA"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 h-[42px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
