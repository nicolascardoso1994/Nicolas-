import { useEffect, useState } from 'react';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { StudyPlan, UploadedFilePayload } from '../types/study';
import { DEFAULT_REMINDER_CONFIG, addDaysToLocalDate } from '../utils/examReminders';
import { readValidatedFilePayload, safeFetchJson } from '../utils/apiClient';

interface NewPlanModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (plan: StudyPlan) => void;
}

const FOLDER_OPTIONS = [
  'Física',
  'Matemática',
  'Química',
  'Anatomía',
  'Biología',
  'Programación',
  'Economía',
  'General',
];

const PRESET_TEMPLATES = [
  {
    label: 'Anatomía · Corazón y Sistema Nervioso',
    subject: 'Anatomía Humana — Corazón, Vasos y Neurona',
    folder: 'Anatomía',
    notes:
      'Temas del parcial: Anatomía macroscópica del corazón (aurículas, ventrículos, válvulas auriculoventriculares y sigmoideas, aorta, venas cavas), circulación mayor y menor. Estructura de la neurona (soma, dendritas, axón, vaina de mielina y botones sinápticos) y conducción del impulso.',
    focusHint: 'Identificar partes anatómicas, recorridos y relaciones espaciales sin fórmulas innecesarias',
  },
  {
    label: 'Física I · Leyes de Newton y Energía',
    subject: 'Física I — Dinámica y Trabajo-Energía',
    folder: 'Física',
    notes:
      'Temas del parcial: Primera y segunda ley de Newton, diagramas de cuerpo libre en planos inclinados y sistemas vinculados con poleas. Rozamiento estático y dinámico. Trabajo de fuerzas constantes y variables, teorema del trabajo y la energía cinética, conservación de la energía mecánica con fuerzas no conservativas.',
    focusHint: 'Cómo plantear los ejes y no confundir rozamiento estático con dinámico',
  },
  {
    label: 'Análisis Matemático · Integrales y Series',
    subject: 'Análisis Matemático II — Integrales y Convergencia',
    folder: 'Matemática',
    notes:
      'Temas: Integración por sustitución y por partes, fracciones simples, integrales impropias de 1ra y 2da especie, criterios de convergencia de series numéricas (D’Alembert, Cauchy, comparación) y series de potencias.',
    focusHint: 'Elegir rápido qué criterio de convergencia usar en el examen',
  },
  {
    label: 'Química General · Equilibrio y Ácido-Base',
    subject: 'Química General — Equilibrio Químico y pH',
    folder: 'Química',
    notes:
      'Temas: Constante de equilibrio Kc y Kp, principio de Le Chatelier, disociación de ácidos y bases débiles, cálculo de pH en soluciones reguladoras (buffer) y curvas de titulación.',
    focusHint: 'Cuándo se puede despreciar x en la tabla ICE y cálculo de buffers',
  },
];

export function NewPlanModal({ open, onClose, onCreated }: NewPlanModalProps) {
  const [subject, setSubject] = useState('');
  const [folder, setFolder] = useState('General');
  const [customFolder, setCustomFolder] = useState('');
  const [examType, setExamType] = useState('Primer Parcial');
  const [daysAvailable, setDaysAvailable] = useState(2);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [pace, setPace] = useState<'Intensivo' | 'Equilibrado' | 'Profundo'>('Equilibrado');
  const [notesText, setNotesText] = useState('');
  const [focusHint, setFocusHint] = useState('');
  const [files, setFiles] = useState<UploadedFilePayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const totalMinutes = Math.round(daysAvailable * hoursPerDay * 60);
  const totalHoursFormatted = `${Math.floor(totalMinutes / 60)} h ${
    totalMinutes % 60 > 0 ? `${totalMinutes % 60} min` : ''
  }`.trim();

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    try {
      const parsed = await Promise.all(
        Array.from(fileList).slice(0, 4).map(readValidatedFilePayload)
      );
      setFiles((prev) => [...prev, ...parsed].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar los archivos.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subject.trim()) {
      setError('Escribí el nombre de la materia o tema principal.');
      return;
    }

    setLoading(true);
    try {
      const data = await safeFetchJson<StudyPlan>('/api/study-plan', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          examType,
          daysAvailable,
          hoursPerDay,
          pace,
          notesText: notesText.trim(),
          focusHint: focusHint.trim(),
          files,
        }),
      });
      const resolvedFolder =
        folder === '__custom__' ? customFolder.trim() || 'General' : folder;
      onCreated({
        ...data,
        folder: resolvedFolder,
        examDate: data.examDate || addDaysToLocalDate(daysAvailable),
        reminderConfig: {
          ...DEFAULT_REMINDER_CONFIG,
          daysBefore: [...DEFAULT_REMINDER_CONFIG.daysBefore],
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-plan-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
          <div>
            <h2 id="new-plan-title" className="text-lg font-semibold text-slate-900">
              Crear nuevo plan y guía universitaria
            </h2>
            <p className="text-xs text-slate-500">
              Cargá tu tiempo disponible y tus apuntes, PDFs o fotos para generar tu hoja de ruta.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 block">
              Plantillas rápidas para probar:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSubject(preset.subject);
                    setFolder(preset.folder);
                    setNotesText(preset.notes);
                    setFocusHint(preset.focusHint);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Subject, Folder & Exam Type */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="subject-input" className="text-xs font-semibold text-slate-700 block">
                Materia y unidad temática
              </label>
              <input
                id="subject-input"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Física I — Electrostática y Ley de Gauss"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="folder-select" className="text-xs font-semibold text-slate-700 block">
                Carpeta / Área
              </label>
              <select
                id="folder-select"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {FOLDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__">Otra carpeta...</option>
              </select>
              {folder === '__custom__' && (
                <input
                  type="text"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  placeholder="Ej: Álgebra o Histología"
                  className="w-full mt-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exam-type" className="text-xs font-semibold text-slate-700 block">
                Tipo de evaluación
              </label>
              <select
                id="exam-type"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Primer Parcial">Primer Parcial</option>
                <option value="Segundo Parcial">Segundo Parcial</option>
                <option value="Examen Final">Examen Final</option>
                <option value="Recuperatorio">Recuperatorio</option>
                <option value="Coloquio / TP">Coloquio / TP</option>
              </select>
            </div>
          </div>

          {/* 2. Available Time */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                ¿Cuánto tiempo tenés para estudiar?
              </h3>
              <span className="font-mono text-sm font-semibold text-blue-700 tabular-nums">
                Total disponible: {totalHoursFormatted}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="days-input" className="text-xs font-medium text-slate-700 block">
                  Días disponibles
                </label>
                <input
                  id="days-input"
                  type="number"
                  min={1}
                  max={30}
                  value={daysAvailable}
                  onChange={(e) => setDaysAvailable(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hours-input" className="text-xs font-medium text-slate-700 block">
                  Horas por día
                </label>
                <input
                  id="hours-input"
                  type="number"
                  min={0.5}
                  max={14}
                  step={0.5}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Math.max(0.5, Number(e.target.value) || 0.5))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 block">Ritmo de estudio</span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg">
                  {(['Intensivo', 'Equilibrado', 'Profundo'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPace(p)}
                      className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                        pace === p
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Material & File Upload */}
          <div className="space-y-3">
            <label htmlFor="notes-textarea" className="text-xs font-semibold text-slate-700 block">
              Pegá tus apuntes, programa de la materia o ejercicios (o adjuntá archivos)
            </label>
            <textarea
              id="notes-textarea"
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Pegá acá el temario, transcripción de clases, definiciones o enunciados de la guía práctica..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Subir PDF, TXT, MD o imágenes de apuntes
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.csv,image/*"
                  multiple
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="sr-only"
                />
              </label>

              {files.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {files.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span className="max-w-[160px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Eliminar archivo"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Focus Hint */}
          <div className="space-y-1.5">
            <label htmlFor="focus-hint" className="text-xs font-semibold text-slate-700 block">
              ¿Qué tema o tipo de ejercicio te cuesta más? (opcional)
            </label>
            <input
              id="focus-hint"
              type="text"
              value={focusHint}
              onChange={(e) => setFocusHint(e.target.value)}
              placeholder="Ej: Necesito entender bien el paso a paso de conservación de energía con rozamiento"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Armando plan y resumen...' : 'Generar plan y guía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
