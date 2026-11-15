import { useMemo, useState } from 'react';
import { Atom, Check, Copy, FlaskConical, Plus, Search, X } from 'lucide-react';
import {
  CATEGORY_META,
  ELEMENT_BY_SYMBOL,
  ElementCategory,
  MatterState,
  PERIODIC_ELEMENTS,
  PeriodicElement,
} from '../data/periodicElements';

type CellMetricMode = 'mass' | 'electronegativity' | 'state';

interface FormulaBreakdownRow {
  element: PeriodicElement;
  count: number;
  subtotalMass: number;
  percent: number;
}

function parseChemicalFormula(
  rawFormula: string
): { totalMass: number; rows: FormulaBreakdownRow[] } | { error: string } {
  const formula = rawFormula.trim();
  if (!formula) {
    return { error: 'Escribí una fórmula química (ej: H2SO4 o Ca(OH)2).' };
  }

  // Split hydrate parts by · or . or *
  const parts = formula.split(/[·.*]/).map((p) => p.trim()).filter(Boolean);
  const totalCounts = new Map<string, number>();

  for (const part of parts) {
    let idx = 0;
    let partMultiplier = 1;

    const leadingNumMatch = part.match(/^(\d+)/);
    if (leadingNumMatch) {
      partMultiplier = Number(leadingNumMatch[1]);
      idx = leadingNumMatch[1].length;
    }

    const parseGroup = (): Map<string, number> => {
      const counts = new Map<string, number>();
      while (idx < part.length) {
        const ch = part[idx];
        if (ch === ')' || ch === ']') {
          break;
        }
        if (ch === '(' || ch === '[') {
          const closing = ch === '(' ? ')' : ']';
          idx++;
          const inner = parseGroup();
          if (part[idx] !== closing) {
            throw new Error(`Falta cerrar "${closing}" en la fórmula.`);
          }
          idx++;
          let multStr = '';
          while (idx < part.length && /\d/.test(part[idx])) {
            multStr += part[idx];
            idx++;
          }
          const mult = multStr ? Number(multStr) : 1;
          inner.forEach((cnt, sym) => {
            counts.set(sym, (counts.get(sym) ?? 0) + cnt * mult);
          });
          continue;
        }

        if (/[A-Z]/.test(ch)) {
          let sym = ch;
          idx++;
          while (idx < part.length && /[a-z]/.test(part[idx])) {
            sym += part[idx];
            idx++;
          }
          if (!ELEMENT_BY_SYMBOL[sym]) {
            throw new Error(`Símbolo químico no reconocido: "${sym}".`);
          }
          let countStr = '';
          while (idx < part.length && /\d/.test(part[idx])) {
            countStr += part[idx];
            idx++;
          }
          const cnt = countStr ? Number(countStr) : 1;
          counts.set(sym, (counts.get(sym) ?? 0) + cnt);
          continue;
        }

        if (/\s/.test(ch)) {
          idx++;
          continue;
        }

        throw new Error(`Carácter inesperado "${ch}" en la fórmula.`);
      }
      return counts;
    };

    try {
      const groupCounts = parseGroup();
      if (idx < part.length) {
        return { error: 'Paréntesis sin abrir en la fórmula.' };
      }
      groupCounts.forEach((cnt, sym) => {
        totalCounts.set(sym, (totalCounts.get(sym) ?? 0) + cnt * partMultiplier);
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Fórmula inválida.',
      };
    }
  }

  if (totalCounts.size === 0) {
    return { error: 'No se detectaron elementos válidos en la fórmula.' };
  }

  let totalMass = 0;
  const preliminary: { element: PeriodicElement; count: number; subtotalMass: number }[] = [];

  totalCounts.forEach((count, sym) => {
    const element = ELEMENT_BY_SYMBOL[sym];
    const subtotalMass = element.atomicMass * count;
    totalMass += subtotalMass;
    preliminary.push({ element, count, subtotalMass });
  });

  const rows: FormulaBreakdownRow[] = preliminary.map((item) => ({
    ...item,
    percent: totalMass > 0 ? (item.subtotalMass / totalMass) * 100 : 0,
  }));

  return { totalMass, rows };
}

const PRESET_FORMULAS = ['H2O', 'H2SO4', 'Ca(OH)2', 'NaCl', 'C6H12O6', 'Al2(SO4)3', 'CuSO4·5H2O'];

export function PeriodicTableView() {
  const [selectedElement, setSelectedElement] = useState<PeriodicElement>(
    ELEMENT_BY_SYMBOL['C']
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ElementCategory | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<MatterState | 'all'>('all');
  const [metricMode, setMetricMode] = useState<CellMetricMode>('mass');
  const [formulaInput, setFormulaInput] = useState('H2SO4');
  const [copiedMass, setCopiedMass] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesFilter = (el: PeriodicElement): boolean => {
    if (activeCategory !== 'all' && el.category !== activeCategory) return false;
    if (stateFilter !== 'all' && el.state !== stateFilter) return false;
    if (normalizedQuery) {
      const byNum = String(el.number) === normalizedQuery;
      const bySym = el.symbol.toLowerCase().includes(normalizedQuery);
      const byName = el.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(
          normalizedQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );
      return byNum || bySym || byName;
    }
    return true;
  };

  const matchCount = useMemo(
    () => PERIODIC_ELEMENTS.filter(matchesFilter).length,
    [activeCategory, stateFilter, normalizedQuery]
  );

  const molarCalc = useMemo(
    () => parseChemicalFormula(formulaInput),
    [formulaInput]
  );

  const selectedMeta = CATEGORY_META[selectedElement.category];

  const handleCopyMass = (mass: string) => {
    navigator.clipboard?.writeText(mass).then(() => {
      setCopiedMass(true);
      setTimeout(() => setCopiedMass(false), 1600);
    });
  };

  const handleAppendElementToFormula = (symbol: string) => {
    setFormulaInput((prev) => (prev.trim() ? `${prev.trim()}${symbol}` : symbol));
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Tabla Periódica Interactiva
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Los 118 elementos con configuración electrónica, electronegatividad, estados de oxidación y calculadora de masa molar integrada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar elemento, símbolo o Z..."
              aria-label="Buscar elemento en la tabla periódica"
              className="pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-56 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {(['all', 'Sólido', 'Líquido', 'Gas'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStateFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  stateFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter Bar + Cell Metric Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                activeCategory === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Todas las familias ({matchCount})
            </button>
            {(Object.keys(CATEGORY_META) as ElementCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActiveCategory((prev) => (prev === cat ? 'all' : cat))
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : `${meta.cellBg} ${meta.cellBorder} ${meta.cellText}`
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : meta.dotColor
                    }`}
                  />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Dato en celda:</span>
            <select
              aria-label="Propiedad mostrada en las celdas"
              value={metricMode}
              onChange={(e) => setMetricMode(e.target.value as CellMetricMode)}
              className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="mass">Masa atómica (u)</option>
              <option value="electronegativity">Electronegatividad (Pauling)</option>
              <option value="state">Estado (25 °C)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 18-Column Periodic Table */}
      <section
        aria-label="Cuadrícula de la tabla periódica"
        className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 overflow-x-auto"
      >
        <div className="min-w-[880px]">
          {/* Group Header Row 1..18 */}
          <div className="grid grid-cols-[24px_repeat(18,minmax(0,1fr))] gap-1 mb-1">
            <div />
            {Array.from({ length: 18 }, (_, i) => i + 1).map((grp) => (
              <div
                key={grp}
                className="text-center text-[10px] font-mono tabular-nums text-slate-400 font-medium"
              >
                {grp}
              </div>
            ))}
          </div>

          {/* Periods 1..7 + f-block rows 9..10 */}
          <div className="grid grid-cols-[24px_repeat(18,minmax(0,1fr))] gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((period) => (
              <div
                key={`p-label-${period}`}
                style={{ gridRow: period, gridColumn: 1 }}
                className="flex items-center justify-center text-[10px] font-mono tabular-nums text-slate-400 font-medium"
              >
                {period}
              </div>
            ))}

            {/* f-block guide markers in Group 3 */}
            <div
              style={{ gridRow: 6, gridColumn: 4 }}
              className="rounded-md border border-dashed border-orange-300 bg-orange-50/60 flex flex-col items-center justify-center p-1 text-center"
            >
              <span className="text-[10px] font-mono font-semibold text-orange-800">
                57–71
              </span>
              <span className="text-[9px] text-orange-700 leading-tight">
                Lantánidos
              </span>
            </div>
            <div
              style={{ gridRow: 7, gridColumn: 4 }}
              className="rounded-md border border-dashed border-fuchsia-300 bg-fuchsia-50/60 flex flex-col items-center justify-center p-1 text-center"
            >
              <span className="text-[10px] font-mono font-semibold text-fuchsia-800">
                89–103
              </span>
              <span className="text-[9px] text-fuchsia-700 leading-tight">
                Actínidos
              </span>
            </div>

            {/* Spacer row 8 */}
            <div style={{ gridRow: 8, gridColumn: '1 / span 19' }} className="h-3" />

            {/* Labels for Lanthanides & Actinides */}
            <div
              style={{ gridRow: 9, gridColumn: '2 / span 3' }}
              className="flex items-center justify-end pr-2 text-[11px] font-medium text-orange-800"
            >
              Lantánidos (4f)
            </div>
            <div
              style={{ gridRow: 10, gridColumn: '2 / span 3' }}
              className="flex items-center justify-end pr-2 text-[11px] font-medium text-fuchsia-800"
            >
              Actínidos (5f)
            </div>

            {PERIODIC_ELEMENTS.map((el) => {
              const meta = CATEGORY_META[el.category];
              const isSelected = selectedElement.number === el.number;
              const isMatch = matchesFilter(el);

              const subValue =
                metricMode === 'mass'
                  ? el.atomicMass < 10
                    ? el.atomicMass.toFixed(3)
                    : el.atomicMass.toFixed(1)
                  : metricMode === 'electronegativity'
                    ? el.electronegativity !== null
                      ? `χ ${el.electronegativity.toFixed(2)}`
                      : '—'
                    : el.state;

              return (
                <button
                  key={el.number}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  style={{ gridRow: el.gridRow, gridColumn: el.gridCol + 1 }}
                  title={`${el.number} · ${el.name} (${el.symbol}) — ${el.atomicMass} u`}
                  className={`rounded-md border p-1 text-left transition-all flex flex-col justify-between min-h-[54px] ${
                    isSelected
                      ? 'ring-2 ring-blue-700 border-blue-700 bg-blue-50 text-slate-950 shadow-sm z-10'
                      : `${meta.cellBg} ${meta.cellBorder} ${meta.cellText}`
                  } ${isMatch ? 'opacity-100' : 'opacity-25 hover:opacity-80'}`}
                >
                  <div className="flex items-center justify-between gap-0.5 leading-none">
                    <span className="text-[9px] font-mono tabular-nums opacity-75">
                      {el.number}
                    </span>
                    <span className="text-[8px] font-mono opacity-60">
                      {el.state === 'Gas' ? 'G' : el.state === 'Líquido' ? 'L' : ''}
                    </span>
                  </div>
                  <div className="text-sm font-bold leading-tight tracking-tight">
                    {el.symbol}
                  </div>
                  <div className="text-[8.5px] leading-tight truncate opacity-80 font-medium">
                    {el.name}
                  </div>
                  <div className="text-[8.5px] font-mono tabular-nums leading-none opacity-70">
                    {subValue}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Interactive Deck: Element Detail + Molar Mass Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Selected Element Detail Inspector */}
        <section
          aria-label="Ficha del elemento seleccionado"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-xl border flex flex-col items-center justify-center shrink-0 ${selectedMeta.cellBg} ${selectedMeta.cellBorder} ${selectedMeta.cellText}`}
              >
                <span className="text-[11px] font-mono tabular-nums opacity-80">
                  Z = {selectedElement.number}
                </span>
                <span className="text-3xl font-bold tracking-tight leading-none my-0.5">
                  {selectedElement.symbol}
                </span>
                <span className="text-[10px] font-mono tabular-nums opacity-80">
                  {selectedElement.atomicMass} u
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{selectedMeta.label}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Período {selectedElement.period}
                    {selectedElement.group ? ` · Grupo ${selectedElement.group}` : ' · Bloque f'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedElement.name}
                </h3>
                <p className="text-xs text-slate-600">
                  Estado a 25 °C: <strong className="text-slate-900">{selectedElement.state}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAppendElementToFormula(selectedElement.symbol)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Sumar a fórmula
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-medium text-slate-500">Masa atómica</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {selectedElement.atomicMass} g/mol
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-medium text-slate-500">Electronegatividad</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {selectedElement.electronegativity ?? 'No definida'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-medium text-slate-500">1.ª Ionización</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {selectedElement.ionizationEv ? `${selectedElement.ionizationEv} eV` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 col-span-2">
              <p className="text-[11px] font-medium text-slate-500">Configuración electrónica</p>
              <p className="text-sm font-semibold font-mono text-slate-900 mt-0.5">
                {selectedElement.electronConfig}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-medium text-slate-500">Estados de oxidación</p>
              <p className="text-sm font-semibold font-mono text-slate-900 mt-0.5">
                {selectedElement.oxidationStates}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/70 flex items-start gap-2.5">
            <Atom className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-slate-700">
              <strong className="text-slate-900">Dato clave de examen:</strong>{' '}
              {selectedElement.studyNote}
            </p>
          </div>
        </section>

        {/* Built-In Molar Mass & Percentage Composition Calculator */}
        <section
          aria-label="Calculadora de masa molar"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-700" />
                Calculadora de Masa Molar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresá una fórmula química o hacé clic en &quot;Sumar a fórmula&quot; sobre cualquier elemento. Soporta paréntesis e hidratos.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="Ej: H2SO4, Ca(OH)2, CuSO4·5H2O"
              aria-label="Fórmula química para calcular masa molar"
              className="flex-1 px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {formulaInput && (
              <button
                type="button"
                onClick={() => setFormulaInput('')}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Ejemplos:</span>
            {PRESET_FORMULAS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormulaInput(preset)}
                className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                  formulaInput === preset
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {'error' in molarCalc ? (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {molarCalc.error}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-900 text-white flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    Masa molar total ({formulaInput})
                  </p>
                  <p className="text-2xl font-bold font-mono tabular-nums mt-0.5">
                    {molarCalc.totalMass.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-slate-300">g/mol</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyMass(molarCalc.totalMass.toFixed(3))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                >
                  {copiedMass ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3 font-medium">Elemento</th>
                      <th className="py-2 px-3 font-medium text-right">Átomos</th>
                      <th className="py-2 px-3 font-medium text-right">Subtotal (g/mol)</th>
                      <th className="py-2 px-3 font-medium text-right">% masa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {molarCalc.rows.map((row) => (
                      <tr
                        key={row.element.symbol}
                        onClick={() => setSelectedElement(row.element)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-3 font-medium text-slate-900">
                          <span className="font-mono font-bold mr-1.5 text-blue-700">
                            {row.element.symbol}
                          </span>
                          {row.element.name}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                          {row.count}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                          {row.subtotalMass.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {row.percent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
