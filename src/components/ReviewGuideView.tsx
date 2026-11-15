import { useState } from 'react';
import { Check, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { StudyPlan, StudyTab } from '../types/study';
import { MathText } from './MathText';

interface ReviewGuideViewProps {
  plan: StudyPlan;
  onToggleChecklist: (itemId: string) => void;
  onNavigateTab: (tab: StudyTab) => void;
}

export function ReviewGuideView({
  plan,
  onToggleChecklist,
  onNavigateTab,
}: ReviewGuideViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const checkedCount = plan.masteryChecklist.filter((c) => c.checked).length;
  const totalChecks = plan.masteryChecklist.length;

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = plan.quizQuestions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="space-y-8">
      {/* Guided Reading Sections */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Guía de repaso progresiva
            </h2>
            <p className="text-sm text-slate-500">
              Lectura ágil y concreta ordenada de la base conceptual al nivel de examen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('exercises')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Pasar a Ejercicios Guiados
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {plan.guideSections.map((section) => (
            <article
              key={section.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700">
                  Idea central: <MathText text={section.coreIdea} />
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h3>
              </div>

              <p className="text-sm md:text-base text-slate-700 leading-relaxed max-w-4xl">
                <MathText text={section.explanation} />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="text-xs font-semibold text-slate-800 block mb-1">
                    Ejemplo concreto
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <MathText text={section.concreteExample} />
                  </p>
                </div>
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                  <span className="text-xs font-semibold text-blue-800 block mb-1">
                    Regla práctica para recordar
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    <MathText text={section.keyTakeaway} />
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Two-Column Bottom: Mastery Checklist + Self-Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mastery Checklist */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Checklist de dominio
              </h3>
              <p className="text-xs text-slate-500">
                Verificá qué habilidades ya tenés listas.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
              {checkedCount}/{totalChecks}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {plan.masteryChecklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleChecklist(item.id)}
                className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    item.checked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </span>
                <span
                  className={`text-sm leading-relaxed ${
                    item.checked ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}
                >
                  <MathText text={item.label} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Pre-Exam Self-Quiz */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Autoevaluación rápida tipo examen
              </h3>
              <p className="text-xs text-slate-500">
                Respondé para comprobar conceptos antes de rendir.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                {correctCount}/{plan.quizQuestions.length} correctas
              </span>
              {answeredCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAnswers({})}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {plan.quizQuestions.map((q, qIdx) => {
              const chosen = selectedAnswers[q.id];
              const isAnswered = chosen !== undefined;
              const isCorrect = chosen === q.correctIndex;

              return (
                <div key={q.id} className="p-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    <span className="font-mono text-slate-500 mr-2">0{qIdx + 1}.</span>
                    <MathText text={q.question} />
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      const isRightOption = optIdx === q.correctIndex;

                      let btnStyle =
                        'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                      if (isAnswered) {
                        if (isRightOption) {
                          btnStyle =
                            'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                        } else if (isSelected && !isRightOption) {
                          btnStyle = 'border-red-300 bg-red-50 text-red-900';
                        } else {
                          btnStyle = 'border-slate-200 bg-slate-50/50 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors flex items-start justify-between gap-3 ${btnStyle}`}
                        >
                          <span>
                            <MathText text={opt} />
                          </span>
                          {isAnswered && isRightOption && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          {isAnswered && isSelected && !isRightOption && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className={`rounded-lg p-3 text-xs leading-relaxed border ${
                        isCorrect
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/60 border-amber-200 text-amber-950'
                      }`}
                    >
                      <strong>{isCorrect ? 'Correcto: ' : 'Para revisar: '}</strong>
                      <MathText text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
