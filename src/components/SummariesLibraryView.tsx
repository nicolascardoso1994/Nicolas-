import { useMemo, useState } from 'react';
import {
  Search,
  Pin,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { StudyPlan, StudyTab } from '../types/study';
import { MathText } from './MathText';
import { RevealableFormula } from './RevealableFormula';

interface SummariesLibraryViewProps {
  plans: StudyPlan[];
  activePlanId: string;
  onSelectPlanAndTab: (planId: string, tab: StudyTab) => void;
  onTogglePin: (planId: string) => void;
  onChangeFolder: (planId: string, folder: string) => void;
  onDeletePlan: (planId: string) => void;
  onOpenNewModal: () => void;
}

const DEFAULT_FOLDERS = [
  'Física',
  'Matemática',
  'Química',
  'Biología',
  'Programación',
  'Economía',
  'General',
];

function getDaysUntil(examDate?: string): number | null {
  if (!examDate) return null;
  const [y, m, d] = examDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function SummariesLibraryView({
  plans,
  activePlanId,
  onSelectPlanAndTab,
  onTogglePin,
  onChangeFolder,
  onDeletePlan,
  onOpenNewModal,
}: SummariesLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'pinned' | 'exam' | 'recent' | 'alpha'>('pinned');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [customFolderDraft, setCustomFolderDraft] = useState('');

  const allFolders = useMemo(() => {
    const set = new Set<string>();
    for (const p of plans) {
      set.add((p.folder || 'General').trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = plans.filter((p) => {
      const folderName = (p.folder || 'General').trim();
      if (selectedFolder !== 'ALL' && folderName !== selectedFolder) return false;
      if (!q) return true;

      const haystack = [
        p.subject,
        p.examType,
        folderName,
        p.executiveSummary,
        ...(p.summarySections ?? []).map((s) => `${s.title} ${s.content}`),
        ...p.keyConcepts.map((c) => `${c.term} ${c.simpleExplanation}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'pinned') {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'exam') {
        const da = getDaysUntil(a.examDate);
        const db = getDaysUntil(b.examDate);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      }
      if (sortBy === 'alpha') {
        return a.subject.localeCompare(b.subject);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [plans, searchQuery, selectedFolder, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Biblioteca de resúmenes y materias
            </h2>
            <p className="text-sm text-slate-500">
              Organizá todos tus resúmenes por área, buscá conceptos al instante o fijá tus próximos exámenes.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo resumen / materia
          </button>
        </div>

        {/* Search, Sort & View Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 border-t border-slate-100 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por materia, tema, concepto o fórmula..."
              aria-label="Buscar resúmenes y materias"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <label htmlFor="library-sort" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Ordenar:
            </label>
            <select
              id="library-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="pinned">Destacadas y recientes</option>
              <option value="exam">Próximo examen primero</option>
              <option value="recent">Más recientes</option>
              <option value="alpha">Alfabético (A–Z)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Vista en tarjetas"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Vista en lista"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Folder Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1 mr-1">
            <FolderOpen className="w-3.5 h-3.5" />
            Carpetas:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFolder('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedFolder === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({plans.length})
          </button>
          {allFolders.map((folder) => {
            const count = plans.filter((p) => (p.folder || 'General').trim() === folder).length;
            const isActive = selectedFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {folder} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Grid or List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <p className="text-base font-semibold text-slate-900">
            No encontramos resúmenes que coincidan con tu búsqueda
          </p>
          <p className="text-sm text-slate-500">
            Probá limpiar el filtro de carpeta o buscá otro término.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedFolder('ALL');
            }}
            className="mt-2 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Ver todas las materias
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'
              : 'space-y-3'
          }
        >
          {filteredPlans.map((plan) => {
            const isActive = plan.id === activePlanId;
            const isExpanded = Boolean(expandedIds[plan.id]);
            const daysLeft = getDaysUntil(plan.examDate);
            const sections = plan.summarySections ?? [];
            const folderName = (plan.folder || 'General').trim();
            const completedBlocks = plan.studyBlocks.filter((b) => b.completed).length;

            return (
              <article
                key={plan.id}
                className={`bg-white border rounded-xl p-5 space-y-4 transition-colors ${
                  isActive ? 'border-blue-300' : 'border-slate-200'
                }`}
              >
                {/* Top Metadata + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-medium text-blue-700">{folderName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{plan.examType}</span>
                      {daysLeft !== null && daysLeft >= 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-700">
                            {daysLeft === 0
                              ? 'Rinde hoy'
                              : daysLeft === 1
                                ? 'Rinde mañana'
                                : `Examen en ${daysLeft} días`}
                          </span>
                        </>
                      )}
                      {isActive && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-emerald-700">Materia activa</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                      {plan.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTogglePin(plan.id)}
                      aria-label={plan.pinned ? 'Quitar destacado' : 'Fijar materia'}
                      title={plan.pinned ? 'Quitar de destacadas' : 'Fijar arriba'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        plan.pinned
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    {plans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeletePlan(plan.id)}
                        aria-label={`Eliminar ${plan.subject}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Folder Assignment */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Carpeta:</span>
                    {editingFolderId === plan.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (customFolderDraft.trim()) {
                            onChangeFolder(plan.id, customFolderDraft.trim());
                          }
                          setEditingFolderId(null);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={customFolderDraft}
                          onChange={(e) => setCustomFolderDraft(e.target.value)}
                          placeholder="Nombre carpeta..."
                          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 w-32"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 text-xs font-medium bg-slate-900 text-white rounded"
                        >
                          OK
                        </button>
                      </form>
                    ) : (
                      <select
                        value={DEFAULT_FOLDERS.includes(folderName) ? folderName : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setCustomFolderDraft(folderName);
                            setEditingFolderId(plan.id);
                          } else {
                            onChangeFolder(plan.id, e.target.value);
                          }
                        }}
                        aria-label={`Cambiar carpeta de ${plan.subject}`}
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700"
                      >
                        {!DEFAULT_FOLDERS.includes(folderName) && (
                          <option value="__custom__">{folderName}</option>
                        )}
                        {DEFAULT_FOLDERS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                        <option value="__new__">+ Carpeta personalizada...</option>
                      </select>
                    )}
                  </div>

                  <span className="font-mono tabular-nums">
                    {sections.length || 1} secciones · {plan.formulas.length} fórmulas ·{' '}
                    {completedBlocks}/{plan.studyBlocks.length} bloques
                    {' · '}
                    {plan.examModels?.some((m) => m.latestAttempt?.passed) ? (
                      <span className="text-emerald-700 font-semibold">Materia aprobada</span>
                    ) : (
                      <span className="text-amber-700">Parcial pendiente</span>
                    )}
                  </span>
                </div>

                {/* Ordered Summary Preview (Collapsed vs Expanded) */}
                {!isExpanded ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                    {sections.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800">
                          {sections[0].order}. {sections[0].title}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          <MathText text={sections[0].content} />
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        <MathText text={plan.executiveSummary} />
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    {sections.length > 0 ? (
                      sections.map((sec, idx) => (
                        <div
                          key={idx}
                          className="space-y-1.5 pb-3 border-b border-slate-200/70 last:border-b-0 last:pb-0"
                        >
                          <h4 className="text-xs font-semibold text-slate-900">
                            {sec.order}. {sec.title}
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <MathText text={sec.content} />
                          </p>
                          {sec.formulaLatex && (
                            <RevealableFormula
                              key={`${plan.id}-lib-sec-${sec.order}`}
                              latex={sec.formulaLatex}
                              compact={true}
                              bold={true}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <MathText text={plan.executiveSummary} />
                      </p>
                    )}
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(plan.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Ocultar vista rápida
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Vista rápida del resumen
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPlanAndTab(plan.id, 'exam')}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      Próximo Examen
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPlanAndTab(plan.id, 'summary')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      Abrir Resumen
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
