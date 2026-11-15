import { StudyPlan } from '../types/study';
import { MathBlock, MathText } from './MathText';

interface SummaryPdfSheetProps {
  plan: StudyPlan;
  filterMode: 'all' | 'concepts' | 'formulas' | 'traps';
  readingMode: boolean;
}

export function SummaryPdfSheet({
  plan,
  filterMode,
  readingMode,
}: SummaryPdfSheetProps) {
  const sections = plan.summarySections ?? [];

  const filterLabel =
    filterMode === 'all'
      ? 'Resumen completo'
      : filterMode === 'concepts'
        ? 'Resumen y conceptos clave'
        : filterMode === 'formulas'
          ? 'Resumen y formulario crítico'
          : 'Resumen y trampas de examen';

  const cardClass = readingMode
    ? 'bg-[#FAF6EB] border border-[#E2D9C2] rounded-xl p-5'
    : 'bg-white border border-slate-200 rounded-xl p-5';
  const formulaBoxClass = readingMode
    ? 'bg-[#F2ECDC] border border-[#DFD6BF] rounded-lg px-4 py-3'
    : 'bg-slate-50 border border-slate-200 rounded-lg px-4 py-3';
  const headingInk = readingMode ? 'text-[#241E18]' : 'text-slate-900';
  const bodyInk = readingMode ? 'text-[#3D352C]' : 'text-slate-700';
  const mutedInk = readingMode ? 'text-[#6E6254]' : 'text-slate-500';
  const accentInk = readingMode ? 'text-[#8B5220]' : 'text-blue-700';

  return (
    <div
      aria-hidden="true"
      className={`w-[720px] space-y-4 p-1 ${
        readingMode ? 'reading-serif bg-[#FAF6EB]' : 'bg-white'
      }`}
    >
      {/* Document Header */}
      <div
        data-pdf-block="true"
        className={`pb-4 border-b-2 ${
          readingMode ? 'border-[#D8CBB0]' : 'border-slate-900'
        }`}
      >
        <div className={`text-xs font-medium ${accentInk}`}>
          Códice · {plan.examType} · {filterLabel}
        </div>
        <h1 className={`mt-1 text-2xl font-bold leading-snug ${headingInk}`}>
          {plan.subject}
        </h1>
        <div className={`mt-2 text-xs ${mutedInk}`}>
          {plan.folder ? `Carpeta: ${plan.folder} · ` : ''}
          Material ordenado de estudio universitario
        </div>
      </div>

      {/* Ordered Summary Sections */}
      {sections.length > 0 ? (
        sections.map((sec, idx) => (
          <article key={idx} data-pdf-block="true" className={`${cardClass} space-y-2.5`}>
            <h2 className={`text-lg font-semibold ${headingInk}`}>
              {sec.order}. {sec.title}
            </h2>
            <p
              className={`${bodyInk} ${
                readingMode ? 'text-[15.5px] leading-[1.78]' : 'text-[14.5px] leading-relaxed'
              }`}
            >
              <MathText text={sec.content} />
            </p>
            {sec.formulaLatex && (
              <div className={`${formulaBoxClass} space-y-1`}>
                <div className={`text-center ${headingInk}`}>
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
        ))
      ) : (
        <div data-pdf-block="true" className={cardClass}>
          <p className={`text-[15px] leading-relaxed ${bodyInk}`}>
            <MathText text={plan.executiveSummary} />
          </p>
        </div>
      )}

      {/* Key Concepts */}
      {(filterMode === 'all' || filterMode === 'concepts') &&
        plan.keyConcepts.length > 0 && (
          <>
            <div data-pdf-block="true" className="pt-2">
              <h2 className={`text-base font-bold ${headingInk}`}>
                Conceptos clave y ejemplos sencillos
              </h2>
            </div>
            {plan.keyConcepts.map((concept, idx) => (
              <article key={concept.id} data-pdf-block="true" className={`${cardClass} space-y-2.5`}>
                <div className={`text-[11px] font-mono ${mutedInk}`}>
                  0{idx + 1}. Concepto evaluable
                </div>
                <h3 className={`text-base font-semibold ${headingInk}`}>
                  <MathText text={concept.term} />
                </h3>
                <p className={`text-[14px] leading-relaxed ${bodyInk}`}>
                  <MathText text={concept.academicDefinition} />
                </p>
                <div className={`pt-2 border-t ${readingMode ? 'border-[#E9E1CE]' : 'border-slate-100'}`}>
                  <span className={`text-xs font-semibold ${accentInk}`}>
                    En palabras simples:{' '}
                  </span>
                  <span className={`text-[13.5px] ${bodyInk}`}>
                    <MathText text={concept.simpleExplanation} />
                  </span>
                </div>
                <div className={formulaBoxClass}>
                  <span className={`text-xs font-semibold ${headingInk}`}>
                    Ejemplo cotidiano:{' '}
                  </span>
                  <span className={`text-xs leading-relaxed ${bodyInk}`}>
                    <MathText text={concept.everydayExample} />
                  </span>
                </div>
              </article>
            ))}
          </>
        )}

      {/* Critical Formulas */}
      {(filterMode === 'all' || filterMode === 'formulas') &&
        plan.formulas.length > 0 && (
          <>
            <div data-pdf-block="true" className="pt-2">
              <h2 className={`text-base font-bold ${headingInk}`}>
                Formulario y relaciones críticas
              </h2>
            </div>
            {plan.formulas.map((formula, idx) => (
              <div key={formula.id} data-pdf-block="true" className={`${cardClass} space-y-2.5`}>
                <h3 className={`text-sm font-semibold ${headingInk}`}>
                  0{idx + 1}. {formula.name}
                </h3>
                <div className={`${formulaBoxClass} text-center ${headingInk}`}>
                  <MathBlock latex={formula.latex} displayMode={true} bold={true} />
                </div>
                <p className={`text-xs leading-relaxed ${mutedInk}`}>
                  <strong className={headingInk}>Variables:</strong>{' '}
                  <MathText text={formula.variables} />
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div
                    className={`border rounded-lg p-2.5 ${
                      readingMode
                        ? 'bg-[#ECF2E7] border-[#CEDAC4]'
                        : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <strong className={`block mb-0.5 ${readingMode ? 'text-[#2D4A29]' : 'text-emerald-800'}`}>
                      Cuándo usarla
                    </strong>
                    <span className={bodyInk}>
                      <MathText text={formula.whenToUse} />
                    </span>
                  </div>
                  <div
                    className={`border rounded-lg p-2.5 ${
                      readingMode
                        ? 'bg-[#F7EEDB] border-[#E2CFA8]'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <strong className={`block mb-0.5 ${readingMode ? 'text-[#6A4614]' : 'text-amber-800'}`}>
                      Cuándo evitarla
                    </strong>
                    <span className={bodyInk}>
                      <MathText text={formula.whenNotToUse} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

      {/* Exam Traps */}
      {(filterMode === 'all' || filterMode === 'traps') &&
        plan.examTraps.length > 0 && (
          <>
            <div data-pdf-block="true" className="pt-2">
              <h2 className={`text-base font-bold ${headingInk}`}>
                Trampas frecuentes en parciales y finales
              </h2>
            </div>
            {plan.examTraps.map((trap, idx) => (
              <div key={trap.id} data-pdf-block="true" className={`${cardClass} space-y-2 text-xs`}>
                <div className={`font-mono font-semibold ${readingMode ? 'text-[#8A5114]' : 'text-amber-700'}`}>
                  Error #{idx + 1}
                </div>
                <p className={`text-sm font-semibold ${headingInk}`}>
                  <MathText text={trap.mistake} />
                </p>
                <p className={mutedInk}>
                  <strong className={headingInk}>Por qué ocurre: </strong>
                  <MathText text={trap.whyItHappens} />
                </p>
                <p className={bodyInk}>
                  <strong className={readingMode ? 'text-[#2D5429]' : 'text-emerald-700'}>
                    Cómo resolverlo bien:{' '}
                  </strong>
                  <MathText text={trap.howToAvoid} />
                </p>
              </div>
            ))}
          </>
        )}
    </div>
  );
}
