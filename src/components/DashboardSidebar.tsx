import { useEffect } from 'react';
import {
  Atom,
  BookOpenText,
  CalendarClock,
  CheckSquare,
  Clock,
  FolderOpen,
  LineChart,
  ListChecks,
  MessageCircleQuestion,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
} from 'lucide-react';
import { StudyTab } from '../types/study';

interface DashboardSidebarProps {
  activeTab: StudyTab;
  onSelectTab: (tab: StudyTab) => void;
  plansCount: number;
  activeSubject: string;
  onOpenNewModal: () => void;
  onOpenAssistant: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isReadingMode: boolean;
  isNightMode: boolean;
}

interface SidebarNavItem {
  id: StudyTab;
  label: string;
  icon: typeof CalendarClock;
}

const PRIMARY_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'plan', label: 'Planificador', icon: CalendarClock },
  { id: 'library', label: 'Mis Resúmenes', icon: FolderOpen },
  { id: 'summary', label: 'Resumen', icon: BookOpenText },
  { id: 'guide', label: 'Guía de Repaso', icon: CheckSquare },
  { id: 'exercises', label: 'Paso a Paso', icon: ListChecks },
  { id: 'exam', label: 'Próximo Examen', icon: Clock },
];

const TOOLS_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'charts', label: 'Gráficos y Datos', icon: LineChart },
  { id: 'periodic', label: 'Tabla Periódica', icon: Atom },
];

export function DashboardSidebar({
  activeTab,
  onSelectTab,
  plansCount,
  activeSubject,
  onOpenNewModal,
  onOpenAssistant,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isReadingMode,
  isNightMode,
}: DashboardSidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const sidebarSurfaceClass = isNightMode
    ? 'bg-[#121824] border-[#242F42] text-[#E2E8F0]'
    : isReadingMode
      ? 'bg-[#F5EFE0] border-[#E4DCC8] text-[#2B2316]'
      : 'bg-white border-slate-200 text-slate-900';

  const borderMutedClass = isNightMode
    ? 'border-[#242F42]'
    : isReadingMode
      ? 'border-[#E4DCC8]'
      : 'border-slate-200';

  const renderNavButton = (item: SidebarNavItem, isCollapsedView: boolean) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const fullLabel =
      item.id === 'library' ? `${item.label} (${plansCount})` : item.label;

    const buttonColorClass = isActive
      ? isNightMode
        ? 'bg-[#1F2A3E] text-white border-[#3B527A]'
        : isReadingMode
          ? 'bg-[#E9DFC8] text-[#1F170C] border-[#D3C3A3]'
          : 'bg-blue-50 text-blue-800 border-blue-200'
      : isNightMode
        ? 'border-transparent text-[#94A3B8] hover:bg-[#192233] hover:text-white'
        : isReadingMode
          ? 'border-transparent text-[#5D503C] hover:bg-[#ECE3CE] hover:text-[#1F170C]'
          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900';

    const iconColorClass = isActive
      ? isNightMode
        ? 'text-[#93C5FD]'
        : isReadingMode
          ? 'text-[#6F4118]'
          : 'text-blue-700'
      : isNightMode
        ? 'text-[#64748B]'
        : isReadingMode
          ? 'text-[#7C6D56]'
          : 'text-slate-400';

    return (
      <button
        key={item.id}
        type="button"
        title={isCollapsedView ? fullLabel : undefined}
        aria-label={fullLabel}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          onSelectTab(item.id);
          onCloseMobile();
        }}
        className={`w-full flex items-center ${
          isCollapsedView ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
        } rounded-lg border text-sm font-medium transition-colors ${buttonColorClass}`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${iconColorClass}`} />
          {!isCollapsedView && (
            <span className="truncate">{item.label}</span>
          )}
        </span>

        {!isCollapsedView && item.id === 'library' && (
          <span
            className={`text-xs font-mono tabular-nums shrink-0 ${
              isActive
                ? isNightMode
                  ? 'text-white'
                  : isReadingMode
                    ? 'text-[#6F4118]'
                    : 'text-blue-700'
                : isNightMode
                  ? 'text-[#94A3B8]'
                  : isReadingMode
                    ? 'text-[#7C6D56]'
                    : 'text-slate-500'
            }`}
          >
            ({plansCount})
          </span>
        )}
      </button>
    );
  };

  const renderSidebarBody = (isCollapsedView: boolean, isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand + Collapse / Close Control */}
      <div
        className={`h-16 px-4 border-b flex items-center ${
          isCollapsedView ? 'justify-center' : 'justify-between'
        } gap-2 shrink-0 ${borderMutedClass}`}
      >
        {!isCollapsedView && (
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('plan');
              onCloseMobile();
            }}
            className={`text-lg font-bold tracking-tight whitespace-nowrap truncate ${
              isNightMode ? 'text-white' : isReadingMode ? 'text-[#241B10]' : 'text-slate-900'
            }`}
          >
            Códice
          </a>
        )}

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú lateral"
            className={`p-1.5 rounded-lg transition-colors ${
              isNightMode
                ? 'text-[#94A3B8] hover:bg-[#1E2738] hover:text-white'
                : isReadingMode
                  ? 'text-[#5D503C] hover:bg-[#E7DDC6]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsedView ? 'Desplegar panel lateral' : 'Contraer panel lateral'}
            title={isCollapsedView ? 'Desplegar panel' : 'Contraer panel'}
            className={`p-1.5 rounded-lg transition-colors ${
              isNightMode
                ? 'text-[#94A3B8] hover:bg-[#1E2738] hover:text-white'
                : isReadingMode
                  ? 'text-[#5D503C] hover:bg-[#E7DDC6]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isCollapsedView ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Primary Action: Nueva Materia */}
      <div className={`p-3 border-b shrink-0 ${borderMutedClass}`}>
        <button
          type="button"
          onClick={() => {
            onOpenNewModal();
            onCloseMobile();
          }}
          title={isCollapsedView ? 'Nueva Materia' : undefined}
          aria-label="Nueva Materia"
          className={`w-full inline-flex items-center justify-center gap-2 ${
            isCollapsedView ? 'px-2 py-2.5' : 'px-3.5 py-2.5'
          } text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            isNightMode
              ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
              : isReadingMode
                ? 'bg-[#6F4118] text-[#FAF6EB] hover:bg-[#593312]'
                : 'bg-blue-700 text-white hover:bg-blue-800'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsedView && <span>Nueva Materia</span>}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav
        aria-label="Secciones del panel"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
      >
        <div className="space-y-1">
          {!isCollapsedView && (
            <p
              className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                isNightMode
                  ? 'text-[#64748B]'
                  : isReadingMode
                    ? 'text-[#87765B]'
                    : 'text-slate-400'
              }`}
            >
              Estudio
            </p>
          )}
          <div className="space-y-1">
            {PRIMARY_NAV_ITEMS.map((item) => renderNavButton(item, isCollapsedView))}
          </div>
        </div>

        {/* Tools Section */}
        <div className={`pt-4 border-t space-y-1 ${borderMutedClass}`}>
          {!isCollapsedView && (
            <p
              className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                isNightMode
                  ? 'text-[#64748B]'
                  : isReadingMode
                    ? 'text-[#87765B]'
                    : 'text-slate-400'
              }`}
            >
              Herramientas
            </p>
          )}
          <div className="space-y-1">
            {TOOLS_NAV_ITEMS.map((item) => renderNavButton(item, isCollapsedView))}
            <button
              type="button"
              title={isCollapsedView ? '¿Dudas? Preguntale a la IA' : undefined}
              aria-label="¿Dudas? Preguntale a la IA"
              onClick={() => {
                onOpenAssistant();
                onCloseMobile();
              }}
              className={`w-full flex items-center ${
                isCollapsedView ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } rounded-lg border text-sm font-medium transition-colors ${
                isNightMode
                  ? 'border-[#334663] bg-[#1B263B] text-[#E2E8F0] hover:bg-[#24334D] hover:text-white'
                  : isReadingMode
                    ? 'border-[#D9CCB0] bg-[#EFE6D2] text-[#4C3216] hover:bg-[#E5DAC0]'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <MessageCircleQuestion
                className={`w-4 h-4 shrink-0 ${
                  isNightMode
                    ? 'text-[#93C5FD]'
                    : isReadingMode
                      ? 'text-[#6F4118]'
                      : 'text-blue-700'
                }`}
              />
              {!isCollapsedView && (
                <span className="truncate">Preguntale a la IA</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Subject Indicator (Expanded only) */}
      {!isCollapsedView && (
        <div className={`px-4 py-3 border-t shrink-0 ${borderMutedClass}`}>
          <p
            className={`text-[11px] font-medium ${
              isNightMode
                ? 'text-[#64748B]'
                : isReadingMode
                  ? 'text-[#87765B]'
                  : 'text-slate-400'
            }`}
          >
            Materia actual
          </p>
          <p
            className={`text-xs font-semibold truncate mt-0.5 ${
              isNightMode
                ? 'text-white'
                : isReadingMode
                  ? 'text-[#2B2316]'
                  : 'text-slate-800'
            }`}
            title={activeSubject}
          >
            {activeSubject}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Panel lateral"
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r transition-all duration-200 z-30 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${sidebarSurfaceClass}`}
      >
        {renderSidebarBody(collapsed, false)}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
          />
          <aside
            aria-label="Menú de navegación móvil"
            className={`relative w-72 max-w-[85vw] h-full border-r shadow-2xl flex flex-col ${sidebarSurfaceClass}`}
          >
            {renderSidebarBody(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}
