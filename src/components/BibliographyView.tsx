import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  MinusCircle,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BibliographyEntry,
  StudyPlan,
  UploadedFilePayload,
} from '../types/study';
import { MathText } from './MathText';
import { readValidatedFilePayload, safeFetchJson } from '../utils/apiClient';

interface BibliographyViewProps {
  plan: StudyPlan;
  onBackToSummary: () => void;
  onAddBibliographyEntry: (entry: BibliographyEntry) => void;
  onDeleteBibliographyEntry: (entryId: string) => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
}

const FOCUS_SUGGESTIONS = [
  'Capítulos y conceptos centrales que entran en el parcial',
  'Solo definiciones clave, mecanismos y ejemplos prácticos',
  'Explicar los esquemas, gráficos o figuras de estas páginas',
  'Diferenciar lo obligatorio de lo complementario para ahorrar tiempo',
];

export function BibliographyView({
  plan,
  onBackToSummary,
  onAddBibliographyEntry,
  onDeleteBibliographyEntry,
  isReadingMode = false,
  isNightMode = false,
}: BibliographyViewProps) {
  const entries = plan.bibliography ?? [];
  const [selectedId, setSelectedId] = useState<string>(entries[0]?.id ?? '');
  const [showUploader, setShowUploader] = useState<boolean>(entries.length === 0);

  // Upload & study relevance dialog state
  const [materialTitle, setMaterialTitle] = useState('');
  const [focusPrompt, setFocusPrompt] = useState('');
  const [notesText, setNotesText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFilePayload[]>([]);
  const [sessionFilesByEntryId, setSessionFilesByEntryId] = useState<
    Record<string, UploadedFilePayload[]>
  >({});

  // Refinement dialog on an existing entry
  const [refinePrompt, setRefinePrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) {
      setSelectedId('');
      setShowUploader(true);
    } else if (!entries.some((e) => e.id === selectedId)) {
      setSelectedId(entries[0].id);
    }
  }, [plan.id, entries, selectedId]);

  const activeEntry = entries.find((e) => e.id === selectedId) ?? entries[0] ?? null;

  const cardSurface = isNightMode
    ? 'bg-[#171E2B] border-[#293549] text-[#E2E8F0]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#E4DCC8] text-[#241E18]'
      : 'bg-white border-slate-200 text-slate-900';

  const innerSurface = isNightMode
    ? 'bg-[#1F2838] border-[#313F57]'
    : isReadingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';

  const dividerColor = isNightMode
    ? 'border-[#253042]'
    : isReadingMode
      ? 'border-[#E9E1CE]'
      : 'border-slate-200';

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
    ? 'text-[#93C5FD]'
    : isReadingMode
      ? 'text-[#8B5220]'
      : 'text-blue-700';

  const inputClass = isNightMode
    ? 'bg-[#171E2B] border-[#374863] text-white placeholder-[#64748B]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#D8CBB0] text-[#241E18] placeholder-[#8C7E6D]'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    try {
      const parsed = await Promise.all(
        Array.from(fileList).slice(0, 4).map(readValidatedFilePayload)
      );
      setAttachedFiles((prev) => [...prev, ...parsed].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo seleccionado.');
    }
  };

  const handleAnalyzeBibliography = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!focusPrompt.trim()) {
      setError('Indicá en el cuadro de diálogo qué parte de la bibliografía necesitás estudiar o es relevante.');
      return;
    }
    if (attachedFiles.length === 0 && !notesText.trim()) {
      setError('Subí al menos un archivo (PDF, imagen o texto) o pegá fragmentos del material de lectura.');
      return;
    }

    setAnalyzing(true);
    try {
      const { entry } = await safeFetchJson<{ entry: BibliographyEntry }>(
        '/api/analyze-bibliography',
        {
          method: 'POST',
          body: JSON.stringify({
            subject: plan.subject,
            subjectMode: plan.subjectMode || 'quantitative',
            examType: plan.examType,
            title: materialTitle.trim(),
            focusPrompt: focusPrompt.trim(),
            notesText: notesText.trim(),
            files: attachedFiles,
          }),
        }
      );

      onAddBibliographyEntry(entry);
      if (attachedFiles.length > 0) {
        setSessionFilesByEntryId((prev) => ({
          ...prev,
          [entry.id]: attachedFiles,
        }));
      }
      setSelectedId(entry.id);
      setShowUploader(false);
      setMaterialTitle('');
      setFocusPrompt('');
      setNotesText('');
      setAttachedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar la bibliografía.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRefineExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry || !refinePrompt.trim() || refining) return;
    setError(null);

    const sessionFiles = sessionFilesByEntryId[activeEntry.id] ?? [];
    const contextFallback = [
      activeEntry.notesPreview || '',
      `Resumen previo: ${activeEntry.analysis.summary}`,
      ...activeEntry.analysis.relevantSections.map(
        (s) => `${s.sectionTitle}: ${s.whyRelevant} (${s.keyTakeaways.join('; ')})`
      ),
    ]
      .filter(Boolean)
      .join('\n\n');

    setRefining(true);
    try {
      const { entry } = await safeFetchJson<{ entry: BibliographyEntry }>(
        '/api/analyze-bibliography',
        {
          method: 'POST',
          body: JSON.stringify({
            subject: plan.subject,
            subjectMode: plan.subjectMode || 'quantitative',
            examType: plan.examType,
            title: `${activeEntry.title} (Enfoque específico)`,
            focusPrompt: refinePrompt.trim(),
            notesText: activeEntry.notesPreview || '',
            previousSummaryContext: contextFallback,
            fileNames: activeEntry.fileNames,
            files: sessionFiles,
          }),
        }
      );

      onAddBibliographyEntry(entry);
      if (sessionFiles.length > 0) {
        setSessionFilesByEntryId((prev) => ({
          ...prev,
          [entry.id]: sessionFiles,
        }));
      }
      setSelectedId(entry.id);
      setRefinePrompt('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo generar la nueva consulta sobre el material.'
      );
    } finally {
      setRefining(false);
    }
  };

  return (
    <div
      className={`space-y-6 transition-colors duration-200 ${
        isNightMode
          ? 'night-mode bg-[#111722] border border-[#242F42] rounded-2xl p-4 sm:p-6 md:p-8'
          : isReadingMode
            ? 'reading-serif bg-[#F6F0E2] border border-[#E4DCC8] rounded-2xl p-4 sm:p-6 md:p-8'
            : ''
      }`}
    >
      {/* Top Header & Material Switcher */}
      <section className={`border rounded-xl p-6 space-y-5 ${cardSurface}`}>
        <div
          className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${dividerColor}`}
        >
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBackToSummary}
              className={`inline-flex items-center gap-1.5 text-xs font-medium font-sans transition-colors ${accentInk} hover:underline`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Resumen
            </button>
            <h2 className={`text-xl font-semibold ${headingInk}`}>
              Bibliografía de ayuda · {plan.subject}
            </h2>
            <p className={`text-xs leading-relaxed ${mutedInk}`}>
              Subí material de lectura (PDF, fotos de capítulos, gráficos o texto) e indicá en el cuadro de diálogo qué parte necesitás estudiar o es relevante para tu examen.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-sans">
            <button
              type="button"
              onClick={() => {
                setShowUploader((prev) => !prev);
                setError(null);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                showUploader
                  ? isNightMode
                    ? 'bg-[#253247] text-white'
                    : 'bg-slate-900 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {showUploader && entries.length > 0 ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Cerrar carga
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Subir bibliografía y definir qué estudiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload + Study Relevance Dialog Panel */}
        {showUploader && (
          <form
            onSubmit={handleAnalyzeBibliography}
            className={`border rounded-xl p-5 space-y-5 font-sans ${innerSurface}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Material Upload */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="space-y-1">
                  <label htmlFor="bib-title" className={`text-xs font-semibold block ${bodyInk}`}>
                    1. Material de lectura (opcional: título o capítulo)
                  </label>
                  <input
                    id="bib-title"
                    type="text"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Ej: Guyton Cap. 14 · Apunte de cátedra Unidad 3"
                    className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${inputClass}`}
                  />
                </div>

                <label
                  className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isNightMode
                      ? 'bg-[#171E2B] border-[#3B4F72] text-[#CBD5E1] hover:bg-[#1E293D]'
                      : isReadingMode
                        ? 'bg-[#FAF6EB] border-[#D8CBB0] text-[#3D352C] hover:border-[#8B5220]'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500'
                  }`}
                >
                  <Upload className={`w-5 h-5 ${accentInk}`} />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold block">
                      Subir PDF, imágenes o textos de lectura
                    </span>
                    <span className={`text-[11px] block ${mutedInk}`}>
                      PDF, PNG, JPG, WEBP, TXT, MD o CSV (máx. 4 archivos · 8 MB c/u)
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.csv,image/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="sr-only"
                  />
                </label>

                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className={`text-[11px] font-medium block ${mutedInk}`}>
                      Archivos listos para leer ({attachedFiles.length}/4):
                    </span>
                    <div className="space-y-1.5">
                      {attachedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className={`flex items-center justify-between gap-2 px-3 py-2 border rounded-lg text-xs ${cardSurface}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.mimeType.startsWith('image/') ? (
                              <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${accentInk}`} />
                            ) : (
                              <FileText className={`w-3.5 h-3.5 shrink-0 ${accentInk}`} />
                            )}
                            <span className="truncate font-medium">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Quitar ${file.name}`}
                            className={`p-1 rounded transition-colors ${mutedInk} hover:text-red-600`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="bib-notes" className={`text-[11px] font-medium block ${mutedInk}`}>
                    O pegá fragmentos / índice del libro (opcional)
                  </label>
                  <textarea
                    id="bib-notes"
                    rows={3}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Podés copiar acá párrafos, índice de capítulos o consignas de lectura..."
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${inputClass}`}
                  />
                </div>
              </div>

              {/* Right Column: Study Focus Dialog Box */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`w-4 h-4 ${accentInk}`} />
                    <label
                      htmlFor="bib-focus-dialog"
                      className={`text-sm font-semibold ${headingInk}`}
                    >
                      2. ¿Qué parte de esta bibliografía necesitás estudiar o es relevante?
                    </label>
                  </div>
                  <p className={`text-xs leading-relaxed ${mutedInk}`}>
                    Indicá capítulos, páginas, temas puntuales del programa o qué querés que se extraiga para no perder tiempo leyendo secciones que no entran en tu examen.
                  </p>

                  <textarea
                    id="bib-focus-dialog"
                    rows={6}
                    value={focusPrompt}
                    onChange={(e) => setFocusPrompt(e.target.value)}
                    placeholder="Ej: De este PDF solo necesito estudiar el apartado de regulación de la presión arterial (págs. 18 a 27) y entender la diferencia entre control rápido y renal. Lo de historia clínica y casos pediátricos no entra en el parcial."
                    className={`w-full px-3.5 py-3 text-sm leading-relaxed border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 ${inputClass}`}
                  />

                  <div className="space-y-1.5 pt-1">
                    <span className={`text-[11px] font-medium block ${mutedInk}`}>
                      Atajos para completar tu indicación:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FOCUS_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            setFocusPrompt((prev) =>
                              prev.trim() ? `${prev.trim()}\n${suggestion}` : suggestion
                            )
                          }
                          className={`px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-colors text-left ${
                            isNightMode
                              ? 'bg-[#171E2B] border-[#313F57] text-[#CBD5E1] hover:bg-[#222D40]'
                              : isReadingMode
                                ? 'bg-[#FAF6EB] border-[#DFD6BF] text-[#3D352C] hover:bg-[#EAE1CC]'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className={`text-xs ${mutedInk}`}>
                    El análisis se guarda en la materia para consultarlo cuando repases.
                  </span>
                  <button
                    type="submit"
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                    {analyzing ? 'Analizando bibliografía...' : 'Extraer parte relevante'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-sans">
            {error}
          </div>
        )}

        {/* Saved Bibliography Entries Selector */}
        {entries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-sans">
            {entries.map((entry) => {
              const isSelected = entry.id === activeEntry?.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(entry.id);
                    setError(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : isNightMode
                        ? 'bg-[#1F2838] border-[#313F57] text-[#CBD5E1] hover:bg-[#273247]'
                        : isReadingMode
                          ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#3D352C] hover:bg-[#E7DAC0]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[230px]">{entry.title}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      isSelected ? 'text-blue-100' : mutedInk
                    }`}
                  >
                    · {entry.analysis.relevantSections.length} apartados
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Bibliography Analysis Workspace */}
      {activeEntry ? (
        <section className={`border rounded-xl p-6 space-y-6 ${cardSurface}`}>
          <div
            className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b ${dividerColor}`}
          >
            <div className="space-y-1">
              <div className={`text-xs ${mutedInk}`}>
                <span>
                  {activeEntry.fileNames.length > 0
                    ? activeEntry.fileNames.join(', ')
                    : 'Fragmento de lectura cargado'}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {activeEntry.analysis.relevantSections.length} secciones relevantes
                </span>
              </div>
              <h3 className={`text-lg font-semibold ${headingInk}`}>{activeEntry.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => onDeleteBibliographyEntry(activeEntry.id)}
              aria-label="Eliminar esta bibliografía"
              className={`p-1.5 rounded-lg transition-colors self-start ${mutedInk} hover:text-red-600`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Student Focus Request + Synthesis */}
          <div className={`border rounded-xl p-4 space-y-2.5 ${innerSurface}`}>
            <span className={`text-xs font-semibold block ${accentInk}`}>
              Parte solicitada para estudiar
            </span>
            <p className={`text-xs sm:text-sm italic leading-relaxed ${bodyInk}`}>
              “{activeEntry.focusPrompt}”
            </p>
            <div className={`pt-2.5 border-t ${dividerColor}`}>
              <span className={`text-xs font-semibold block mb-1 ${headingInk}`}>
                Síntesis enfocada del material
              </span>
              <p className={`text-sm leading-relaxed ${bodyInk}`}>
                <MathText text={activeEntry.analysis.summary} />
              </p>
            </div>
          </div>

          {/* Relevant Extracted Sections */}
          {activeEntry.analysis.relevantSections.length > 0 && (
            <div className="space-y-4">
              <h4 className={`text-base font-semibold ${headingInk}`}>
                Apartados relevantes extraídos
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeEntry.analysis.relevantSections.map((sec, idx) => (
                  <article
                    key={`${activeEntry.id}-sec-${idx}`}
                    className={`border rounded-xl p-5 space-y-3 ${innerSurface}`}
                  >
                    <div className="space-y-1">
                      <div className={`text-xs font-mono tabular-nums ${mutedInk}`}>
                        0{idx + 1}. Selección bibliográfica
                        {sec.pageOrLocationHint ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{sec.pageOrLocationHint}</span>
                          </>
                        ) : null}
                      </div>
                      <h5 className={`text-base font-semibold ${headingInk}`}>
                        {sec.sectionTitle}
                      </h5>
                    </div>

                    <p className={`text-xs leading-relaxed ${mutedInk}`}>
                      <strong className={headingInk}>Por qué importa: </strong>
                      <MathText text={sec.whyRelevant} />
                    </p>

                    {sec.keyTakeaways.length > 0 && (
                      <ul className={`pt-2 border-t space-y-1.5 text-xs sm:text-sm ${dividerColor} ${bodyInk}`}>
                        {sec.keyTakeaways.map((takeaway, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className={`w-3.5 h-3.5 mt-1 shrink-0 ${accentInk}`} />
                            <span>
                              <MathText text={takeaway} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Skip vs Study Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEntry.analysis.studyRecommendations.length > 0 && (
              <div
                className={`border rounded-xl p-4 space-y-2.5 ${
                  isNightMode
                    ? 'bg-[#142923] border-[#244B3E]'
                    : isReadingMode
                      ? 'bg-[#ECF2E7] border-[#CEDAC4]'
                      : 'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <h5
                  className={`text-xs font-semibold ${
                    isNightMode
                      ? 'text-[#6EE7B7]'
                      : isReadingMode
                        ? 'text-[#2D4A29]'
                        : 'text-emerald-900'
                  }`}
                >
                  Cómo estudiar este material
                </h5>
                <ul className={`space-y-1.5 text-xs leading-relaxed ${bodyInk}`}>
                  {activeEntry.analysis.studyRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono font-semibold shrink-0">{idx + 1}.</span>
                      <span>
                        <MathText text={rec} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeEntry.analysis.discardOrSkip.length > 0 && (
              <div
                className={`border rounded-xl p-4 space-y-2.5 ${
                  isNightMode
                    ? 'bg-[#2B2215] border-[#523F1F]'
                    : isReadingMode
                      ? 'bg-[#F7EEDB] border-[#E2CFA8]'
                      : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <h5
                  className={`text-xs font-semibold ${
                    isNightMode
                      ? 'text-[#FCD34D]'
                      : isReadingMode
                        ? 'text-[#6A4614]'
                        : 'text-amber-900'
                  }`}
                >
                  Qué podés saltear por ahora
                </h5>
                <ul className={`space-y-1.5 text-xs leading-relaxed ${bodyInk}`}>
                  {activeEntry.analysis.discardOrSkip.map((skip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <MinusCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-75" />
                      <span>
                        <MathText text={skip} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Inline Follow-up Dialog to Focus on Another Part of This Bibliography */}
          <form
            onSubmit={handleRefineExisting}
            className={`border rounded-xl p-4 space-y-3 font-sans ${innerSurface}`}
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="bib-refine-dialog"
                className={`text-xs font-semibold flex items-center gap-1.5 ${headingInk}`}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${accentInk}`} />
                Consultar otra parte o profundizar otro tema de esta bibliografía
              </label>
              {!(sessionFilesByEntryId[activeEntry.id]?.length) &&
                activeEntry.fileNames.length > 0 && (
                  <span className={`text-[11px] ${mutedInk}`}>
                    Basado en el contenido extraído (si querés re-escanear páginas nuevas, subí el PDF arriba)
                  </span>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="bib-refine-dialog"
                type="text"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="Ej: Ahora detallame solo la parte de contracción muscular o las tablas comparativas..."
                className={`flex-1 px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${inputClass}`}
              />
              <button
                type="submit"
                disabled={refining || !refinePrompt.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {refining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {refining ? 'Consultando...' : 'Pedir este enfoque'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
