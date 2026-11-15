import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ExamAttemptResult,
  ExamModel,
  StudyPlan,
  UploadedFilePayload,
} from '../types/study';
import { MathText } from './MathText';
import { RevealableFormula } from './RevealableFormula';

interface ExamModelsViewProps {
  plan: StudyPlan;
  onBackToSummary: () => void;
  onAddExamModel: (model: ExamModel) => void;
  onSaveAttempt: (modelId: string, attempt: ExamAttemptResult) => void;
  onDeleteExamModel: (modelId: string) => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
}

function readUploadedExamFile(file: File): Promise<UploadedFilePayload> {
  return new Promise((resolve, reject) => {
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv');

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));

    if (isText) {
      reader.onload = () => {
        resolve({
          name: file.name,
          mimeType: file.type || 'text/plain',
          base64Data: '',
          textContent: typeof reader.result === 'string' ? reader.result : '',
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

export function ExamModelsView({
  plan,
  onBackToSummary,
  onAddExamModel,
  onSaveAttempt,
  onDeleteExamModel,
  isReadingMode = false,
  isNightMode = false,
}: ExamModelsViewProps) {
  const models = plan.examModels ?? [];
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id ?? '');
  const [creatorTab, setCreatorTab] = useState<'none' | 'generate' | 'upload'>('none');

  // Generate form state
  const [difficultyFocus, setDifficultyFocus] = useState<'Parcial estándar' | 'Final integrador'>(
    'Parcial estándar'
  );
  const [customTitle, setCustomTitle] = useState('');

  // Upload form state
  const [uploadedText, setUploadedText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePayload[]>([]);

  // Runner & grading state
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string | number>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [isRetaking, setIsRetaking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!models.some((m) => m.id === selectedModelId)) {
      setSelectedModelId(models[0]?.id ?? '');
    }
  }, [plan.id, models, selectedModelId]);

  const activeModel = models.find((m) => m.id === selectedModelId) ?? models[0] ?? null;

  useEffect(() => {
    if (activeModel?.latestAttempt && !isRetaking) {
      setDraftAnswers(activeModel.latestAttempt.answers ?? {});
    } else if (!activeModel?.latestAttempt) {
      setDraftAnswers({});
    }
    setRevealedSolutions({});
  }, [activeModel?.id]);

  const approvedAttempt = models
    .map((m) => m.latestAttempt)
    .filter((a): a is ExamAttemptResult => Boolean(a && a.passed))
    .sort((a, b) => b.totalScore - a.totalScore)[0];

  const isSubjectApproved = Boolean(approvedAttempt);

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

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    try {
      const parsed = await Promise.all(
        Array.from(fileList).slice(0, 3).map(readUploadedExamFile)
      );
      setUploadedFiles((prev) => [...prev, ...parsed].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo del parcial.');
    }
  };

  const handleGenerateModel = async (mode: 'from_material' | 'from_upload') => {
    setError(null);
    if (
      mode === 'from_upload' &&
      !uploadedText.trim() &&
      uploadedFiles.length === 0
    ) {
      setError('Pegá las consignas del modelo de parcial o adjuntá un archivo/imagen.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-exam-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: plan.subject,
          subjectMode: plan.subjectMode || 'quantitative',
          examType: plan.examType,
          mode,
          customTitle: customTitle.trim(),
          uploadedText: uploadedText.trim(),
          files: uploadedFiles,
          executiveSummary: plan.executiveSummary,
          summarySections: plan.summarySections,
          keyConcepts: plan.keyConcepts,
          formulas: plan.formulas,
          examTraps: plan.examTraps,
          difficultyFocus,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo generar el modelo de parcial.');
      }
      onAddExamModel(data);
      setSelectedModelId(data.id);
      setCreatorTab('none');
      setCustomTitle('');
      setUploadedText('');
      setUploadedFiles([]);
      setDraftAnswers({});
      setIsRetaking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeModel || grading) return;
    setError(null);
    setGrading(true);
    try {
      const response = await fetch('/api/grade-exam-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: plan.subject,
          subjectMode: plan.subjectMode || 'quantitative',
          examModel: activeModel,
          answers: draftAnswers,
        }),
      });
      const result: ExamAttemptResult & { error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'No se pudo corregir el parcial.');
      }
      onSaveAttempt(activeModel.id, result);
      setIsRetaking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar el parcial.');
    } finally {
      setGrading(false);
    }
  };

  const handleStartRetake = () => {
    setDraftAnswers({});
    setRevealedSolutions({});
    setIsRetaking(true);
  };

  const attemptToDisplay = isRetaking ? null : activeModel?.latestAttempt ?? null;

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
      {/* Top Bar & Approval Requirement Banner */}
      <section className={`border rounded-xl p-6 space-y-5 ${cardSurface}`}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${dividerColor}`}>
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBackToSummary}
              className={`inline-flex items-center gap-1.5 text-xs font-medium font-sans transition-colors ${
                isNightMode
                  ? 'text-[#93C5FD] hover:text-white'
                  : isReadingMode
                    ? 'text-[#8B5220] hover:text-[#5C3513]'
                    : 'text-blue-700 hover:text-blue-800'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Resumen
            </button>
            <h2 className={`text-xl font-semibold ${headingInk}`}>
              Ejemplos de parciales · {plan.subject}
            </h2>
            <p className={`text-xs ${mutedInk}`}>
              Cargá un modelo real de tu cátedra o generá un parcial evaluable en base a tus apuntes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 font-sans">
            <button
              type="button"
              onClick={() =>
                setCreatorTab((prev) => (prev === 'generate' ? 'none' : 'generate'))
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                creatorTab === 'generate'
                  ? 'bg-blue-800 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar parcial desde tu material
            </button>

            <button
              type="button"
              onClick={() =>
                setCreatorTab((prev) => (prev === 'upload' ? 'none' : 'upload'))
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                creatorTab === 'upload'
                  ? isNightMode
                    ? 'bg-[#253247] border-[#3B527A] text-white'
                    : 'bg-slate-900 border-slate-900 text-white'
                  : isNightMode
                    ? 'bg-[#1F2838] border-[#313F57] text-[#E2E8F0] hover:bg-[#273247]'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Cargar modelo de parcial
            </button>
          </div>
        </div>

        {/* Approval Requirement Status */}
        <div
          className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isSubjectApproved
              ? isNightMode
                ? 'bg-[#142923] border-[#244B3E] text-[#E2E8F0]'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : isNightMode
                ? 'bg-[#2B2215] border-[#523F1F] text-[#FDE68A]'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {isSubjectApproved ? (
              <CheckCircle2
                className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 ${
                  isNightMode ? 'text-[#6EE7B7]' : 'text-emerald-700'
                }`}
              />
            ) : (
              <ShieldAlert
                className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 ${
                  isNightMode ? 'text-[#FCD34D]' : 'text-amber-700'
                }`}
              />
            )}
            <div className="space-y-0.5 text-xs leading-relaxed">
              <p className="font-semibold text-sm">
                {isSubjectApproved
                  ? `Requisito cumplido: materia aprobada (${approvedAttempt.totalScore}/100 pts)`
                  : 'Requisito obligatorio para aprobar la materia'}
              </p>
              <p className="opacity-90">
                {isSubjectApproved
                  ? 'Aprobaste al menos un modelo de parcial con 60/100 o más. Podés seguir practicando con nuevos modelos para reforzar tu nota.'
                  : 'Para dar por aprobada esta materia necesitás rendir y aprobar al menos 1 modelo de parcial con 60/100 puntos o más.'}
              </p>
            </div>
          </div>

          <div className="font-mono tabular-nums text-xs font-semibold shrink-0">
            {isSubjectApproved ? 'Aprobada' : 'Nota mínima: 60/100'}
          </div>
        </div>

        {/* Creator Drawer: Generate from Material */}
        {creatorTab === 'generate' && (
          <div className={`border rounded-xl p-5 space-y-4 font-sans ${innerSurface}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={`text-sm font-semibold ${headingInk}`}>
                Generar nuevo modelo de parcial en base al material cargado
              </h3>
              <button
                type="button"
                onClick={() => setCreatorTab('none')}
                aria-label="Cerrar creador"
                className={`p-1 rounded-md ${mutedInk}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-medium block ${bodyInk}`}>
                  Título opcional del simulacro
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`Ej: Simulacro ${plan.examType} — ${plan.subject}`}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    isNightMode
                      ? 'bg-[#171E2B] border-[#374863] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <span className={`text-xs font-medium block ${bodyInk}`}>
                  Nivel de evaluación
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Parcial estándar', 'Final integrador'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficultyFocus(lvl)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                        difficultyFocus === lvl
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : isNightMode
                            ? 'bg-[#171E2B] border-[#313F57] text-[#CBD5E1]'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerateModel('from_material')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {generating ? 'Armando parcial evaluable...' : 'Crear modelo de parcial'}
              </button>
            </div>
          </div>
        )}

        {/* Creator Drawer: Upload Real Exam Model */}
        {creatorTab === 'upload' && (
          <div className={`border rounded-xl p-5 space-y-4 font-sans ${innerSurface}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={`text-sm font-semibold ${headingInk}`}>
                Cargar tu propio modelo de parcial (PDF, foto o enunciados)
              </h3>
              <button
                type="button"
                onClick={() => setCreatorTab('none')}
                aria-label="Cerrar carga de modelo"
                className={`p-1 rounded-md ${mutedInk}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Nombre del parcial (ej: Primer Parcial Cátedra B — 2025)"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  isNightMode
                    ? 'bg-[#171E2B] border-[#374863] text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />

              <textarea
                rows={4}
                value={uploadedText}
                onChange={(e) => setUploadedText(e.target.value)}
                placeholder="Pegá acá las consignas, preguntas o ejercicios de un modelo de parcial anterior..."
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  isNightMode
                    ? 'bg-[#171E2B] border-[#374863] text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isNightMode
                      ? 'bg-[#171E2B] border-[#3B4F72] text-[#CBD5E1] hover:bg-[#1E293D]'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  <span>Adjuntar PDF, foto o archivo del parcial</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.csv,image/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  disabled={generating}
                  onClick={() => handleGenerateModel('from_upload')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors"
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  )}
                  {generating ? 'Procesando modelo...' : 'Cargar y habilitar para rendir'}
                </button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-md ${cardSurface}`}
                    >
                      <FileText className="w-3 h-3 text-blue-700" />
                      <span className="max-w-[180px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        aria-label={`Quitar ${f.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Saved Exam Models Selector */}
        {models.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-sans">
            {models.map((m) => {
              const isSelected = m.id === activeModel?.id;
              const scoreText = m.latestAttempt
                ? `${m.latestAttempt.totalScore}/100`
                : 'Sin rendir';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModelId(m.id);
                    setIsRetaking(false);
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
                  <span className="truncate max-w-[230px]">{m.title}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      isSelected
                        ? 'text-blue-100'
                        : m.latestAttempt?.passed
                          ? 'text-emerald-600'
                          : mutedInk
                    }`}
                  >
                    · {scoreText}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Exam Model Workspace */}
      {activeModel ? (
        <section className={`border rounded-xl p-6 space-y-6 ${cardSurface}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${dividerColor}`}>
            <div>
              <div className={`text-xs ${mutedInk}`}>
                {activeModel.source === 'uploaded'
                  ? 'Modelo cargado por vos'
                  : activeModel.source === 'generated'
                    ? 'Generado en base a tu material'
                    : 'Modelo de referencia'}
                <span aria-hidden="true"> · </span>
                <span>{activeModel.questions.length} consignas</span>
                <span aria-hidden="true"> · </span>
                <span>Aprueba con {activeModel.passingScore}/100</span>
              </div>
              <h3 className={`text-lg font-semibold mt-0.5 ${headingInk}`}>
                {activeModel.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-sans">
              {attemptToDisplay && (
                <button
                  type="button"
                  onClick={handleStartRetake}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isNightMode
                      ? 'border-[#313F57] text-[#CBD5E1] hover:bg-[#1F2838]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reintentar parcial
                </button>
              )}
              {models.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteExamModel(activeModel.id)}
                  aria-label="Eliminar este modelo de parcial"
                  className={`p-1.5 rounded-lg transition-colors ${mutedInk} hover:text-red-600`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Graded Result Banner */}
          {attemptToDisplay && (
            <div
              className={`border rounded-xl p-5 space-y-2 ${
                attemptToDisplay.passed
                  ? isNightMode
                    ? 'bg-[#142923] border-[#244B3E]'
                    : 'bg-emerald-50/80 border-emerald-200'
                  : isNightMode
                    ? 'bg-[#2C1A1D] border-[#5B2A32]'
                    : 'bg-red-50/80 border-red-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-base font-semibold ${
                    attemptToDisplay.passed
                      ? isNightMode
                        ? 'text-[#6EE7B7]'
                        : 'text-emerald-900'
                      : isNightMode
                        ? 'text-[#FCA5A5]'
                        : 'text-red-900'
                  }`}
                >
                  {attemptToDisplay.passed
                    ? 'Parcial aprobado — Materia acreditada'
                    : 'No alcanzaste el mínimo de aprobación'}
                </span>
                <span className="font-mono tabular-nums text-lg font-bold">
                  {attemptToDisplay.totalScore} / 100 pts
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${bodyInk}`}>
                {attemptToDisplay.overallFeedback}
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-5">
            {activeModel.questions.map((q) => {
              const qResult = attemptToDisplay?.questionResults.find(
                (r) => r.questionId === q.id
              );
              const showSolution = Boolean(revealedSolutions[q.id]);

              return (
                <article
                  key={q.id}
                  className={`border rounded-xl p-5 space-y-4 ${innerSurface}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className={`text-xs font-medium ${mutedInk}`}>
                      <span className={`font-mono font-semibold ${headingInk}`}>
                        Consigna 0{q.number}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{q.topic}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{q.type === 'choice' ? 'Opción múltiple' : 'Desarrollo'}</span>
                    </div>
                    <span className={`text-xs font-mono tabular-nums font-semibold ${headingInk}`}>
                      {qResult ? `${qResult.earnedPoints}/${q.points} pts` : `${q.points} pts`}
                    </span>
                  </div>

                  <p className={`text-sm md:text-base font-medium leading-relaxed ${headingInk}`}>
                    <MathText text={q.prompt} />
                  </p>

                  {q.type === 'choice' && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const chosen = draftAnswers[q.id] === oIdx;
                        const isRightOption = oIdx === q.correctIndex;

                        let optionClass = isNightMode
                          ? 'bg-[#171E2B] border-[#313F57] text-[#E2E8F0] hover:border-blue-500'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400';

                        if (attemptToDisplay) {
                          if (isRightOption) {
                            optionClass = isNightMode
                              ? 'bg-[#142923] border-[#2E6B56] text-[#86EFAC] font-medium'
                              : 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium';
                          } else if (chosen && !isRightOption) {
                            optionClass = isNightMode
                              ? 'bg-[#2C1A1D] border-[#7F3944] text-[#FCA5A5]'
                              : 'bg-red-50 border-red-300 text-red-900';
                          }
                        } else if (chosen) {
                          optionClass =
                            'bg-blue-50 border-blue-600 text-blue-950 font-medium';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={Boolean(attemptToDisplay)}
                            onClick={() =>
                              setDraftAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                            }
                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm border rounded-lg transition-colors flex items-start gap-2.5 ${optionClass}`}
                          >
                            <span className="font-mono text-xs font-semibold mt-0.5 shrink-0">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span className="leading-relaxed">
                              <MathText text={opt} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        disabled={Boolean(attemptToDisplay)}
                        value={typeof draftAnswers[q.id] === 'string' ? draftAnswers[q.id] : ''}
                        onChange={(e) =>
                          setDraftAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="Escribí acá tu desarrollo, justificación o respuesta paso a paso..."
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-80 ${
                          isNightMode
                            ? 'bg-[#171E2B] border-[#374863] text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}

                  {/* Per-question graded feedback */}
                  {qResult && (
                    <div
                      className={`border rounded-lg p-3.5 text-xs leading-relaxed ${
                        qResult.isCorrect
                          ? isNightMode
                            ? 'bg-[#142923] border-[#244B3E] text-[#D1FAE5]'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : isNightMode
                            ? 'bg-[#2B2215] border-[#523F1F] text-[#FDE68A]'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}
                    >
                      <strong className="block mb-1">Corrección:</strong>
                      <MathText text={qResult.feedback} />
                    </div>
                  )}

                  {/* Model Solution & Formula Reveal */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedSolutions((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className={`text-xs font-medium font-sans transition-colors ${
                        isNightMode
                          ? 'text-[#93C5FD] hover:text-white'
                          : isReadingMode
                            ? 'text-[#8B5220] hover:text-[#5C3513]'
                            : 'text-blue-700 hover:text-blue-800'
                      }`}
                    >
                      {showSolution ? 'Ocultar resolución modelo' : 'Ver resolución modelo y rúbrica'}
                    </button>
                  </div>

                  {showSolution && (
                    <div className={`border rounded-lg p-4 space-y-2.5 text-xs leading-relaxed ${cardSurface}`}>
                      {q.modelFormulaLatex && (
                        <RevealableFormula
                          latex={q.modelFormulaLatex}
                          label="Ver fórmula clave de resolución"
                          compact={true}
                          bold={true}
                          isReadingMode={isReadingMode}
                          isNightMode={isNightMode}
                        />
                      )}
                      <div>
                        <strong className={`block mb-0.5 ${headingInk}`}>Resolución esperada:</strong>
                        <p className={bodyInk}>
                          <MathText text={q.modelSolution} />
                        </p>
                      </div>
                      <div className={`pt-2 border-t ${dividerColor}`}>
                        <strong className={`block mb-0.5 ${headingInk}`}>Criterio de evaluación:</strong>
                        <p className={mutedInk}>
                          <MathText text={q.gradingCriteria} />
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {!attemptToDisplay && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-sans">
              <p className={`text-xs ${mutedInk}`}>
                Al entregar, la IA corrige tus respuestas de desarrollo y verifica si superás el 60% requerido para aprobar la materia.
              </p>
              <button
                type="button"
                disabled={grading}
                onClick={handleSubmitExam}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors"
              >
                {grading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="w-4 h-4" />
                )}
                {grading ? 'Corrigiendo parcial...' : 'Entregar y evaluar parcial'}
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className={`border rounded-xl p-8 text-center space-y-4 ${cardSurface}`}>
          <p className={`text-base font-semibold ${headingInk}`}>
            Todavía no cargaste ni generaste ningún modelo de parcial
          </p>
          <p className={`text-xs max-w-lg mx-auto leading-relaxed ${mutedInk}`}>
            Para aprobar esta materia necesitás rendir al menos un modelo de parcial con 60/100 o más. Podés generarlo automáticamente con tu material o subir un parcial de tu cátedra.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 font-sans">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerateModel('from_material')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar parcial desde tu material
            </button>
            <button
              type="button"
              onClick={() => setCreatorTab('upload')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${
                isNightMode
                  ? 'border-[#313F57] text-[#E2E8F0] hover:bg-[#1F2838]'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Cargar modelo propio
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
