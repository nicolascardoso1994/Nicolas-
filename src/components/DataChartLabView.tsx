import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  SlidersHorizontal,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { ChartDataset, ChartPoint, UploadedFilePayload } from '../types/study';
import { CHART_PRESETS } from '../data/chartPresets';
import {
  computeSeriesStats,
  evaluateMathExpression,
  parseTabularData,
} from '../utils/mathParser';
import { MathText } from './MathText';

interface DataChartLabViewProps {
  subject: string;
  initialDataset?: ChartDataset | null;
}

type InputMode = 'presets' | 'table' | 'formula' | 'ai';

function readTextOrBinaryFile(file: File): Promise<UploadedFilePayload> {
  return new Promise((resolve, reject) => {
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md');
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    if (isText) {
      reader.onload = () =>
        resolve({
          name: file.name,
          mimeType: file.type || 'text/plain',
          base64Data: '',
          textContent: typeof reader.result === 'string' ? reader.result : '',
        });
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        resolve({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data: dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1000 || (Math.abs(n) > 0 && Math.abs(n) < 0.01)) {
    return n.toExponential(2);
  }
  return Number(n.toFixed(2)).toString();
}

export function DataChartLabView({ subject, initialDataset }: DataChartLabViewProps) {
  const [dataset, setDataset] = useState<ChartDataset>(
    initialDataset ?? CHART_PRESETS[0]
  );
  const [inputMode, setInputMode] = useState<InputMode>('presets');

  // Interactive Filters
  const [visibleSeriesIds, setVisibleSeriesIds] = useState<string[]>(() =>
    (initialDataset ?? CHART_PRESETS[0]).series.map((s) => s.id)
  );
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [showTrendline, setShowTrendline] = useState<boolean>(false);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [rangeMinPct, setRangeMinPct] = useState<number>(0);
  const [rangeMaxPct, setRangeMaxPct] = useState<number>(100);
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesName: string;
    color: string;
    point: ChartPoint;
  } | null>(null);

  // Manual / CSV Table state
  const [rawPasteText, setRawPasteText] = useState<string>(
    '0, 0\n1, 3.2\n2, 6.4\n3, 9.6\n4, 12.8'
  );
  const [customXLabel, setCustomXLabel] = useState('Tiempo t');
  const [customXUnit, setCustomXUnit] = useState('s');
  const [customYLabel, setCustomYLabel] = useState('Velocidad v');
  const [customYUnit, setCustomYUnit] = useState('m/s');
  const [customMode, setCustomMode] = useState<'line' | 'scatter'>('line');
  const [newRowX, setNewRowX] = useState('');
  const [newRowY, setNewRowY] = useState('');

  // Formula state
  const [formulaInput, setFormulaInput] = useState('2 * x^2 - 4 * x + 1');
  const [formulaXMin, setFormulaXMin] = useState('-2');
  const [formulaXMax, setFormulaXMax] = useState('4');
  const [formulaError, setFormulaError] = useState<string | null>(null);

  // AI Dataset generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFiles, setAiFiles] = useState<UploadedFilePayload[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync when initialDataset changes from outside (e.g. from StepByStepView)
  useEffect(() => {
    if (initialDataset) {
      loadNewDataset(initialDataset);
    }
  }, [initialDataset?.id]);

  const loadNewDataset = (next: ChartDataset) => {
    setDataset(next);
    setVisibleSeriesIds(next.series.map((s) => s.id));
    setSelectedGroup('ALL');
    setRangeMinPct(0);
    setRangeMaxPct(100);
    setHoveredPoint(null);
    setShowTrendline(next.series.some((s) => s.mode === 'scatter'));
  };

  // Global X bounds across all points in dataset
  const globalXBounds = useMemo(() => {
    const allX = dataset.series.flatMap((s) => s.points.map((p) => p.x));
    if (allX.length === 0) return { min: 0, max: 10 };
    const min = Math.min(...allX);
    const max = Math.max(...allX);
    return min === max ? { min: min - 1, max: max + 1 } : { min, max };
  }, [dataset]);

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    for (const s of dataset.series) {
      for (const p of s.points) {
        if (p.group) set.add(p.group);
      }
    }
    return Array.from(set);
  }, [dataset]);

  const filterXMin =
    globalXBounds.min +
    ((globalXBounds.max - globalXBounds.min) * Math.min(rangeMinPct, rangeMaxPct)) / 100;
  const filterXMax =
    globalXBounds.min +
    ((globalXBounds.max - globalXBounds.min) * Math.max(rangeMinPct, rangeMaxPct)) / 100;

  // Apply series visibility, group filter, and X-range filter
  const filteredSeries = useMemo(() => {
    return dataset.series
      .filter((s) => visibleSeriesIds.includes(s.id))
      .map((s) => ({
        ...s,
        points: s.points.filter((p) => {
          const inRange = p.x >= filterXMin - 1e-9 && p.x <= filterXMax + 1e-9;
          const inGroup = selectedGroup === 'ALL' || p.group === selectedGroup;
          return inRange && inGroup;
        }),
      }));
  }, [dataset, visibleSeriesIds, filterXMin, filterXMax, selectedGroup]);

  const primaryFilteredSeries = filteredSeries[0];
  const primaryStats = useMemo(
    () =>
      primaryFilteredSeries ? computeSeriesStats(primaryFilteredSeries.points) : null,
    [primaryFilteredSeries]
  );

  // SVG Coordinate mapping
  const svgW = 680;
  const svgH = 340;
  const padL = 58;
  const padR = 24;
  const padT = 22;
  const padB = 46;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const plotBounds = useMemo(() => {
    const pts = filteredSeries.flatMap((s) => s.points);
    if (pts.length === 0) {
      return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
    }
    let xMin = Math.min(...pts.map((p) => p.x));
    let xMax = Math.max(...pts.map((p) => p.x));
    let yMin = Math.min(...pts.map((p) => p.y));
    let yMax = Math.max(...pts.map((p) => p.y));

    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    }
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const yPad = (yMax - yMin) * 0.1;
    return { xMin, xMax, yMin: yMin - yPad, yMax: yMax + yPad };
  }, [filteredSeries]);

  const toSvgX = (x: number) =>
    padL + ((x - plotBounds.xMin) / (plotBounds.xMax - plotBounds.xMin)) * plotW;
  const toSvgY = (y: number) =>
    padT + plotH - ((y - plotBounds.yMin) / (plotBounds.yMax - plotBounds.yMin)) * plotH;

  const xTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = plotBounds.xMin + ((plotBounds.xMax - plotBounds.xMin) * i) / count;
      return { val, pos: toSvgX(val) };
    });
  }, [plotBounds]);

  const yTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = plotBounds.yMin + ((plotBounds.yMax - plotBounds.yMin) * i) / count;
      return { val, pos: toSvgY(val) };
    });
  }, [plotBounds]);

  // Handlers
  const toggleSeries = (id: string) => {
    setVisibleSeriesIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleApplyPastedTable = () => {
    const parsed = parseTabularData(rawPasteText);
    if (parsed.length === 0) return;
    loadNewDataset({
      id: `custom-table-${Date.now()}`,
      title: `${customYLabel} en función de ${customXLabel}`,
      subjectTag: subject,
      xLabel: customXLabel,
      xUnit: customXUnit,
      yLabel: customYLabel,
      yUnit: customYUnit,
      insightSummary:
        'Datos cargados manualmente. Usá los filtros de rango y la línea de tendencia para analizar la pendiente y el área bajo la curva.',
      slopeMeaning: `Razón de cambio Δ(${customYLabel}) / Δ(${customXLabel})`,
      areaMeaning: `Integral aproximada de ${customYLabel} respecto a ${customXLabel}`,
      series: [
        {
          id: `ser-manual-${Date.now()}`,
          name: `${customYLabel} (${customYUnit || 'u'})`,
          unit: customYUnit,
          color: '#1D4ED8',
          mode: customMode,
          points: parsed,
        },
      ],
    });
  };

  const handleCsvFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const text = await file.text();
    setRawPasteText(text);
    const parsed = parseTabularData(text);
    if (parsed.length > 0) {
      loadNewDataset({
        id: `csv-${Date.now()}`,
        title: `Datos importados: ${file.name}`,
        subjectTag: subject,
        xLabel: customXLabel,
        xUnit: customXUnit,
        yLabel: customYLabel,
        yUnit: customYUnit,
        insightSummary: `Se importaron ${parsed.length} puntos desde ${file.name}. Podés filtrar el intervalo o activar la regresión lineal.`,
        series: [
          {
            id: `ser-csv-${Date.now()}`,
            name: file.name,
            unit: customYUnit,
            color: '#1D4ED8',
            mode: 'scatter',
            points: parsed,
          },
        ],
      });
    }
  };

  const handleAddSinglePoint = () => {
    const x = Number(newRowX.replace(',', '.'));
    const y = Number(newRowY.replace(',', '.'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const targetSeries = dataset.series[0];
    if (!targetSeries) return;

    const updatedPoints = [...targetSeries.points, { x, y }].sort((a, b) => a.x - b.x);
    setDataset({
      ...dataset,
      series: dataset.series.map((s, idx) =>
        idx === 0 ? { ...s, points: updatedPoints } : s
      ),
    });
    setNewRowX('');
    setNewRowY('');
  };

  const handleDeletePoint = (seriesId: string, pointIndex: number) => {
    setDataset((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id === seriesId
          ? { ...s, points: s.points.filter((_, idx) => idx !== pointIndex) }
          : s
      ),
    }));
  };

  const handleApplyFormula = (e: React.FormEvent) => {
    e.preventDefault();
    setFormulaError(null);
    const xMin = Number(formulaXMin.replace(',', '.'));
    const xMax = Number(formulaXMax.replace(',', '.'));
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
      setFormulaError('El límite inferior debe ser menor que el superior.');
      return;
    }

    const steps = 36;
    const pts: ChartPoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / steps;
      const y = evaluateMathExpression(formulaInput, x);
      if (y !== null && Math.abs(y) < 1e7) {
        pts.push({
          x: Number(x.toFixed(3)),
          y: Number(y.toFixed(3)),
          group: x < 0 ? 'x < 0' : 'x ≥ 0',
        });
      }
    }

    if (pts.length < 2) {
      setFormulaError('No se pudo evaluar la fórmula. Probá por ejemplo: 2*x^2 - 4*x + 1 o 10*sin(x).');
      return;
    }

    loadNewDataset({
      id: `formula-${Date.now()}`,
      title: `Gráfico de f(x) = ${formulaInput}`,
      subjectTag: 'Matemática / Análisis',
      xLabel: 'x',
      xUnit: '',
      yLabel: 'f(x)',
      yUnit: '',
      insightSummary: `Curva evaluada en el intervalo $[${xMin}, ${xMax}]$. Ajustá los deslizadores de rango para medir la pendiente promedio o el área aproximada en cualquier tramo.`,
      slopeMeaning: 'Pendiente media del tramo filtrado',
      areaMeaning: 'Integral aproximada en el tramo filtrado',
      series: [
        {
          id: `ser-formula-${Date.now()}`,
          name: `f(x) = ${formulaInput}`,
          color: '#1D4ED8',
          mode: 'line',
          points: pts,
        },
      ],
    });
  };

  const handleAiChartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    if (!aiPrompt.trim() && aiFiles.length === 0) {
      setAiError('Describí qué datos o fenómeno querés graficar, o adjuntá una tabla/imagen.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/generate-chart-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          promptText: aiPrompt.trim(),
          files: aiFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo generar el gráfico.');
      }
      loadNewDataset(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error de conexión.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!primaryFilteredSeries) return;
    const header = `${dataset.xLabel} (${dataset.xUnit}),${primaryFilteredSeries.name}\n`;
    const rows = primaryFilteredSeries.points.map((p) => `${p.x},${p.y}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.title.slice(0, 32).replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Data Source Builder Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Graficador interactivo y análisis de datos
            </h2>
            <p className="text-sm text-slate-500">
              Cargá tus propios datos, escribí una fórmula o elegí un ejemplo universitario para analizar y filtrar el gráfico en tiempo real.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start overflow-x-auto max-w-full">
            {(
              [
                { id: 'presets', label: 'Plantillas' },
                { id: 'table', label: 'Cargar datos / CSV' },
                { id: 'formula', label: 'Fórmula f(x)' },
                { id: 'ai', label: 'Generar desde enunciado' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInputMode(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  inputMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode 1: Presets */}
        {inputMode === 'presets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {CHART_PRESETS.map((preset) => {
              const isSelected = dataset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadNewDataset(preset)}
                  className={`text-left p-3.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-medium text-blue-700 block">
                    {preset.subjectTag}
                  </span>
                  <span className="text-xs font-semibold block mt-0.5 leading-snug">
                    {preset.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mode 2: Paste Data / CSV */}
        {inputMode === 'table' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
            <div className="lg:col-span-6 space-y-2">
              <label htmlFor="paste-csv" className="text-xs font-semibold text-slate-700 block">
                Pegá pares de valores (x, y) separados por coma, punto y coma o tabulación
              </label>
              <textarea
                id="paste-csv"
                rows={4}
                value={rawPasteText}
                onChange={(e) => setRawPasteText(e.target.value)}
                placeholder="0, 0&#10;1, 4.9&#10;2, 19.6"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyPastedTable}
                  className="px-3.5 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Graficar estos datos
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Importar archivo .CSV / .TXT
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => handleCsvFileUpload(e.target.files)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Nombre eje X
                </label>
                <input
                  type="text"
                  value={customXLabel}
                  onChange={(e) => setCustomXLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Unidad X
                </label>
                <input
                  type="text"
                  value={customXUnit}
                  onChange={(e) => setCustomXUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Tipo de trazo
                </label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value as 'line' | 'scatter')}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="line">Línea + puntos</option>
                  <option value="scatter">Solo dispersión</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Nombre eje Y
                </label>
                <input
                  type="text"
                  value={customYLabel}
                  onChange={(e) => setCustomYLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Unidad Y
                </label>
                <input
                  type="text"
                  value={customYUnit}
                  onChange={(e) => setCustomYUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mode 3: Formula f(x) */}
        {inputMode === 'formula' && (
          <form onSubmit={handleApplyFormula} className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1">
                <label htmlFor="formula-fx" className="text-xs font-semibold text-slate-700 block">
                  Escribí la expresión en función de x (ej: 2*x^2 - 4*x + 1, 10*sin(x), 5*exp(-0.5*x))
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-600">f(x) =</span>
                  <input
                    id="formula-fx"
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Desde x</label>
                <input
                  type="text"
                  value={formulaXMin}
                  onChange={(e) => setFormulaXMin(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Hasta x</label>
                <input
                  type="text"
                  value={formulaXMax}
                  onChange={(e) => setFormulaXMax(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Graficar
                </button>
              </div>
            </div>
            {formulaError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formulaError}
              </p>
            )}
          </form>
        )}

        {/* Mode 4: Generate from Statement / Image via AI */}
        {inputMode === 'ai' && (
          <form onSubmit={handleAiChartGenerate} className="pt-2 space-y-3">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Un auto parte a 24 m/s y frena con aceleración -4 m/s² durante 6 segundos. Graficá velocidad y distancia."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Adjuntar foto de tabla o guía (.png, .pdf, .csv)
                <input
                  type="file"
                  accept=".pdf,.csv,.txt,image/*"
                  onChange={async (e) => {
                    if (!e.target.files?.[0]) return;
                    const loaded = await readTextOrBinaryFile(e.target.files[0]);
                    setAiFiles([loaded]);
                  }}
                  className="sr-only"
                />
              </label>

              {aiFiles.length > 0 && (
                <span className="text-xs text-slate-600">
                  Adjunto: <strong>{aiFiles[0].name}</strong>
                </span>
              )}

              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {aiLoading ? 'Generando puntos...' : 'Crear gráfico interactivo'}
              </button>
            </div>
            {aiError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {aiError}
              </p>
            )}
          </form>
        )}
      </section>

      {/* Main Split: Interactive Chart + Filters (Left) vs Computed Stats & Editable Data Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Graph Stage */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-medium text-blue-700">{dataset.subjectTag}</span>
              <h3 className="text-lg font-semibold text-slate-900">{dataset.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTrendline((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  showTrendline
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Regresión lineal
              </button>
              <button
                type="button"
                onClick={() => setShowPoints((v) => !v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  showPoints
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {showPoints ? 'Puntos visibles' : 'Mostrar puntos'}
              </button>
            </div>
          </div>

          {/* Series & Group Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Filtros:
              </span>
              {dataset.series.map((s) => {
                const active = visibleSeriesIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSeries(s.id)}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      active
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: active ? s.color : '#CBD5E1' }}
                    />
                    {s.name}
                  </button>
                );
              })}
            </div>

            {availableGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="group-filter" className="text-xs text-slate-600">
                  Zona / Grupo:
                </label>
                <select
                  id="group-filter"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Todos los puntos</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active point readout strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs min-h-[24px]">
            {hoveredPoint ? (
              <div className="flex items-center gap-3 font-mono tabular-nums text-slate-800">
                <span className="font-sans font-semibold text-slate-700">
                  {hoveredPoint.seriesName}:
                </span>
                <span>
                  {dataset.xLabel} = <strong>{formatNum(hoveredPoint.point.x)}</strong> {dataset.xUnit}
                </span>
                <span>·</span>
                <span>
                  {dataset.yLabel} = <strong>{formatNum(hoveredPoint.point.y)}</strong> {dataset.yUnit}
                </span>
                {hoveredPoint.point.group && (
                  <>
                    <span>·</span>
                    <span className="font-sans text-blue-700">{hoveredPoint.point.group}</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-slate-500">
                Pasá el cursor o tocá cualquier punto del gráfico para inspeccionar sus valores exactos.
              </span>
            )}
          </div>

          {/* Responsive SVG Chart */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label={dataset.title}
            >
              {/* Horizontal gridlines & Y ticks */}
              {yTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={t.pos}
                    x2={svgW - padR}
                    y2={t.pos}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={t.pos + 3.5}
                    textAnchor="end"
                    fontSize="10.5"
                    className="font-mono fill-slate-500 tabular-nums"
                  >
                    {formatNum(t.val)}
                  </text>
                </g>
              ))}

              {/* Vertical gridlines & X ticks */}
              {xTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={t.pos}
                    y1={padT}
                    x2={t.pos}
                    y2={svgH - padB}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={t.pos}
                    y={svgH - padB + 16}
                    textAnchor="middle"
                    fontSize="10.5"
                    className="font-mono fill-slate-500 tabular-nums"
                  >
                    {formatNum(t.val)}
                  </text>
                </g>
              ))}

              {/* Zero axes when visible */}
              {plotBounds.yMin < 0 && plotBounds.yMax > 0 && (
                <line
                  x1={padL}
                  y1={toSvgY(0)}
                  x2={svgW - padR}
                  y2={toSvgY(0)}
                  stroke="#94A3B8"
                  strokeWidth="1.3"
                />
              )}
              {plotBounds.xMin < 0 && plotBounds.xMax > 0 && (
                <line
                  x1={toSvgX(0)}
                  y1={padT}
                  x2={toSvgX(0)}
                  y2={svgH - padB}
                  stroke="#94A3B8"
                  strokeWidth="1.3"
                />
              )}

              {/* Outer Axis Border */}
              <line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={svgH - padB}
                stroke="#64748B"
                strokeWidth="1.5"
              />
              <line
                x1={padL}
                y1={svgH - padB}
                x2={svgW - padR}
                y2={svgH - padB}
                stroke="#64748B"
                strokeWidth="1.5"
              />

              {/* Axis Labels */}
              <text
                x={padL + plotW / 2}
                y={svgH - 8}
                textAnchor="middle"
                fontSize="11"
                className="fill-slate-700 font-medium"
              >
                {dataset.xLabel} {dataset.xUnit ? `[${dataset.xUnit}]` : ''}
              </text>
              <text
                x={15}
                y={padT + plotH / 2}
                textAnchor="middle"
                fontSize="11"
                transform={`rotate(-90 15 ${padT + plotH / 2})`}
                className="fill-slate-700 font-medium"
              >
                {dataset.yLabel} {dataset.yUnit ? `[${dataset.yUnit}]` : ''}
              </text>

              {/* Linear Regression Trendline for primary visible series */}
              {showTrendline && primaryStats && primaryStats.count >= 2 && (
                <line
                  x1={toSvgX(primaryStats.minX)}
                  y1={toSvgY(
                    primaryStats.slope * primaryStats.minX + primaryStats.intercept
                  )}
                  x2={toSvgX(primaryStats.maxX)}
                  y2={toSvgY(
                    primaryStats.slope * primaryStats.maxX + primaryStats.intercept
                  )}
                  stroke="#0F172A"
                  strokeWidth="1.8"
                  strokeDasharray="6 4"
                />
              )}

              {/* Hovered Crosshair */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={toSvgX(hoveredPoint.point.x)}
                    y1={padT}
                    x2={toSvgX(hoveredPoint.point.x)}
                    y2={svgH - padB}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={padL}
                    y1={toSvgY(hoveredPoint.point.y)}
                    x2={svgW - padR}
                    y2={toSvgY(hoveredPoint.point.y)}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                  />
                </g>
              )}

              {/* Series Lines & Points */}
              {filteredSeries.map((s) => {
                const pathData =
                  s.mode === 'line' && s.points.length >= 2
                    ? s.points
                        .map(
                          (p, idx) =>
                            `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`
                        )
                        .join(' ')
                    : '';

                return (
                  <g key={s.id}>
                    {pathData && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {(showPoints || s.mode === 'scatter') &&
                      s.points.map((p, pIdx) => {
                        const isHovered =
                          hoveredPoint?.seriesName === s.name &&
                          hoveredPoint?.point.x === p.x &&
                          hoveredPoint?.point.y === p.y;
                        return (
                          <circle
                            key={pIdx}
                            cx={toSvgX(p.x)}
                            cy={toSvgY(p.y)}
                            r={isHovered ? 6 : 4.2}
                            fill={isHovered ? '#FFFFFF' : s.color}
                            stroke={s.color}
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            className="cursor-pointer transition-all"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                seriesName: s.name,
                                color: s.color,
                                point: p,
                              })
                            }
                            onClick={() =>
                              setHoveredPoint({
                                seriesName: s.name,
                                color: s.color,
                                point: p,
                              })
                            }
                          />
                        );
                      })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-Range Filter Sliders */}
          <div className="pt-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700">
                Filtrar intervalo en {dataset.xLabel}:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  [{formatNum(filterXMin)} , {formatNum(filterXMax)}] {dataset.xUnit}
                </strong>
              </span>
              {(rangeMinPct > 0 || rangeMaxPct < 100 || selectedGroup !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setRangeMinPct(0);
                    setRangeMaxPct(100);
                    setSelectedGroup('ALL');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label htmlFor="range-min-slider" className="w-14 shrink-0">
                  Desde:
                </label>
                <input
                  id="range-min-slider"
                  type="range"
                  min={0}
                  max={95}
                  value={rangeMinPct}
                  onChange={(e) =>
                    setRangeMinPct(Math.min(Number(e.target.value), rangeMaxPct - 5))
                  }
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label htmlFor="range-max-slider" className="w-14 shrink-0">
                  Hasta:
                </label>
                <input
                  id="range-max-slider"
                  type="range"
                  min={5}
                  max={100}
                  value={rangeMaxPct}
                  onChange={(e) =>
                    setRangeMaxPct(Math.max(Number(e.target.value), rangeMinPct + 5))
                  }
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Pedagogical Interpretation */}
          {dataset.insightSummary && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-0.5 text-xs">
                Qué muestra este gráfico:
              </strong>
              <MathText text={dataset.insightSummary} />
            </div>
          )}
        </section>

        {/* Right Column: Live Computed Data & Editable Points */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Calculated Stats from Filtered View */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Datos calculados (tramo visible)
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-[230px]">
                  {primaryFilteredSeries?.name ?? 'Sin serie activa'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                title="Descargar datos filtrados en CSV"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>

            {primaryStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[11px] text-slate-500 block">Mínimo Y</span>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatNum(primaryStats.minY)} {dataset.yUnit}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[11px] text-slate-500 block">Máximo Y</span>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatNum(primaryStats.maxY)} {dataset.yUnit}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[11px] text-slate-500 block">Promedio Y</span>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatNum(primaryStats.meanY)} {dataset.yUnit}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[11px] text-slate-500 block">Puntos filtrados</span>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {primaryStats.count}
                    </span>
                  </div>
                </div>

                {/* Slope & Linear Fit */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Pendiente / Ajuste lineal (m)
                    </span>
                    <span className="font-mono font-semibold text-blue-700 tabular-nums">
                      m = {formatNum(primaryStats.slope)}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                    y = {formatNum(primaryStats.slope)}x {primaryStats.intercept >= 0 ? '+' : '-'}{' '}
                    {formatNum(Math.abs(primaryStats.intercept))} · R² ={' '}
                    {primaryStats.rSquared.toFixed(3)}
                  </p>
                  {dataset.slopeMeaning && (
                    <p className="text-xs text-slate-600 pt-1">
                      <MathText text={dataset.slopeMeaning} />
                    </p>
                  )}
                </div>

                {/* Area under curve */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Área bajo la curva (∫ y dx)
                    </span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatNum(primaryStats.trapezoidalArea)}
                    </span>
                  </div>
                  {dataset.areaMeaning && (
                    <p className="text-xs text-slate-600">
                      <MathText text={dataset.areaMeaning} />
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No hay puntos dentro del filtro actual. Ampliá el rango para ver cálculos.
              </p>
            )}
          </div>

          {/* Editable Data Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                Tabla de puntos ({primaryFilteredSeries?.points.length ?? 0})
              </h4>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {primaryFilteredSeries?.points.map((p, idx) => (
                <div
                  key={`${p.x}-${p.y}-${idx}`}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      seriesName: primaryFilteredSeries.name,
                      color: primaryFilteredSeries.color,
                      point: p,
                    })
                  }
                  className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-slate-500 w-16 truncate">x: {formatNum(p.x)}</span>
                    <span className="text-slate-900 font-medium">y: {formatNum(p.y)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.group && <span className="text-[11px] text-slate-500">{p.group}</span>}
                    {primaryFilteredSeries.points.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const realIdx = dataset.series[0].points.findIndex(
                            (orig) => orig.x === p.x && orig.y === p.y
                          );
                          if (realIdx >= 0) handleDeletePoint(dataset.series[0].id, realIdx);
                        }}
                        aria-label="Eliminar punto"
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Point */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                placeholder="x"
                value={newRowX}
                onChange={(e) => setNewRowX(e.target.value)}
                aria-label="Nuevo valor X"
                className="w-20 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
              />
              <input
                type="text"
                placeholder="y"
                value={newRowY}
                onChange={(e) => setNewRowY(e.target.value)}
                aria-label="Nuevo valor Y"
                className="w-20 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddSinglePoint}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
