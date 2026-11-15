import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ExerciseVisualConfig } from '../types/study';

interface PhysicsVisualizerProps {
  visualConfig?: ExerciseVisualConfig;
  highlightElement?: string;
  currentStepIndex: number;
  totalSteps: number;
  stepTitles: string[];
  onSelectStep: (idx: number) => void;
}

export function PhysicsVisualizer({
  visualConfig,
  highlightElement,
  currentStepIndex,
  totalSteps,
  stepTitles,
  onSelectStep,
}: PhysicsVisualizerProps) {
  const type = visualConfig?.type ?? 'none';
  const baseAngle = visualConfig?.angleDeg ?? 35;
  const baseMu = visualConfig?.mu ?? 0.3;
  const baseMass = visualConfig?.massKg ?? 5;
  const baseVel = visualConfig?.velocityMs ?? 7.12;

  const [simAngle, setSimAngle] = useState<number>(baseAngle);
  const [simVel, setSimVel] = useState<number>(baseVel);

  // Reset helper when problem parameters differ
  const effectiveAngle = simAngle;
  const effectiveVel = simVel;

  if (type === 'inclined_plane') {
    const rad = (effectiveAngle * Math.PI) / 180;
    const g = 9.81;
    const normal = baseMass * g * Math.cos(rad);
    const px = baseMass * g * Math.sin(rad);
    const fd = baseMu * normal;
    const net = Math.max(0, px - fd);
    const acc = net / baseMass;

    // SVG ramp coordinates (origin bottom-right of ramp base or bottom-left)
    const baseX1 = 48;
    const baseY1 = 212;
    const baseLen = 230;
    const heightPx = Math.min(145, Math.max(40, baseLen * Math.tan(rad) * 0.65));
    const topX = baseX1 + baseLen;
    const topY = baseY1 - heightPx;

    // Block sits around midpoint of hypotenuse
    const midX = (baseX1 + topX) / 2;
    const midY = (baseY1 + topY) / 2;
    const slopeAngleDeg = (Math.atan2(baseY1 - topY, topX - baseX1) * 180) / Math.PI;

    const isAxes = highlightElement === 'axes';
    const isNormal = highlightElement === 'normal';
    const isFriction = highlightElement === 'friction';
    const isResult = highlightElement === 'result' || highlightElement === 'energy';

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Diagrama interactivo de fuerzas
            </h4>
            <p className="text-xs text-slate-500">
              {visualConfig?.caption ?? 'Plano inclinado y descomposición vectorial'}
            </p>
          </div>
          {simAngle !== baseAngle && (
            <button
              type="button"
              onClick={() => setSimAngle(baseAngle)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar {baseAngle}°
            </button>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <svg
            viewBox="0 0 340 245"
            className="w-full h-56 select-none"
            role="img"
            aria-label="Diagrama de cuerpo libre sobre plano inclinado"
          >
            <defs>
              <marker id="arrow-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#1D4ED8" />
              </marker>
              <marker id="arrow-emerald" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#059669" />
              </marker>
              <marker id="arrow-amber" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#D97706" />
              </marker>
              <marker id="arrow-slate" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#334155" />
              </marker>
            </defs>

            {/* Coordinate Grid */}
            <line x1="20" y1={baseY1} x2="320" y2={baseY1} stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Inclined Plane Wedge */}
            <polygon
              points={`${baseX1},${baseY1} ${topX},${baseY1} ${topX},${topY}`}
              fill="#E2E8F0"
              stroke="#64748B"
              strokeWidth="1.5"
            />

            {/* Angle arc */}
            <path
              d={`M ${baseX1 + 36} ${baseY1} A 36 36 0 0 0 ${baseX1 + 36 * Math.cos((slopeAngleDeg * Math.PI) / 180)} ${baseY1 - 36 * Math.sin((slopeAngleDeg * Math.PI) / 180)}`}
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <text
              x={baseX1 + 44}
              y={baseY1 - 10}
              fontSize="11"
              className="font-mono fill-slate-700"
            >
              θ = {effectiveAngle}°
            </text>

            {/* Rotated Local Frame centered at block */}
            <g transform={`translate(${midX}, ${midY}) rotate(${-slopeAngleDeg})`}>
              {/* Local axes if highlighted */}
              <line
                x1="-85"
                y1="-14"
                x2="75"
                y2="-14"
                stroke={isAxes ? '#1D4ED8' : '#94A3B8'}
                strokeWidth={isAxes ? '1.8' : '1'}
                strokeDasharray="4 3"
              />
              <line
                x1="0"
                y1="-80"
                x2="0"
                y2="45"
                stroke={isAxes ? '#1D4ED8' : '#94A3B8'}
                strokeWidth={isAxes ? '1.8' : '1'}
                strokeDasharray="4 3"
              />
              {isAxes && (
                <>
                  <text x="-82" y="-20" fontSize="10" className="font-mono fill-blue-700 font-semibold">+x</text>
                  <text x="6" y="-72" fontSize="10" className="font-mono fill-blue-700 font-semibold">+y</text>
                </>
              )}

              {/* Block */}
              <rect
                x="-18"
                y="-28"
                width="36"
                height="28"
                rx="3"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="2"
              />
              <text x="0" y="-10" textAnchor="middle" fontSize="11" className="font-mono fill-slate-900 font-semibold">
                {baseMass}kg
              </text>

              {/* Normal vector (+y) */}
              <line
                x1="0"
                y1="-28"
                x2="0"
                y2="-74"
                stroke={isNormal ? '#059669' : '#0284C7'}
                strokeWidth={isNormal ? '3' : '2'}
                markerEnd={isNormal ? 'url(#arrow-emerald)' : 'url(#arrow-blue)'}
              />
              <text
                x="8"
                y="-64"
                fontSize="11"
                className={`font-mono font-semibold ${isNormal ? 'fill-emerald-700' : 'fill-blue-700'}`}
              >
                N
              </text>

              {/* Friction vector (up slope, +local x) */}
              <line
                x1="18"
                y1="-4"
                x2="58"
                y2="-4"
                stroke={isFriction ? '#D97706' : '#64748B'}
                strokeWidth={isFriction ? '3' : '2'}
                markerEnd={isFriction ? 'url(#arrow-amber)' : 'url(#arrow-slate)'}
              />
              <text
                x="56"
                y="-11"
                fontSize="11"
                className={`font-mono font-semibold ${isFriction ? 'fill-amber-700' : 'fill-slate-600'}`}
              >
                f
              </text>

              {/* Acceleration indicator down slope */}
              {acc > 0.05 && (
                <g opacity={isResult ? 1 : 0.65}>
                  <line
                    x1="-24"
                    y1="-40"
                    x2="-64"
                    y2="-40"
                    stroke="#059669"
                    strokeWidth={isResult ? '2.8' : '1.8'}
                    markerEnd="url(#arrow-emerald)"
                  />
                  <text x="-64" y="-47" fontSize="10" className="font-mono fill-emerald-700 font-semibold">
                    a = {acc.toFixed(2)} m/s²
                  </text>
                </g>
              )}
            </g>

            {/* Gravity vector strictly vertical downward from block center */}
            <g transform={`translate(${midX - 8 * Math.sin((slopeAngleDeg * Math.PI) / 180)}, ${midY - 14 * Math.cos((slopeAngleDeg * Math.PI) / 180)})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="56"
                stroke="#334155"
                strokeWidth="2.4"
                markerEnd="url(#arrow-slate)"
              />
              <text x="6" y="54" fontSize="11" className="font-mono fill-slate-800 font-semibold">
                P = mg
              </text>
            </g>
          </svg>
        </div>

        {/* Interactive angle explorer */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="angle-slider" className="font-medium text-slate-700">
              Explorar inclinación θ: <span className="font-mono text-slate-900 tabular-nums">{effectiveAngle}°</span>
            </label>
            <span className="font-mono text-slate-500 tabular-nums">
              Px = {px.toFixed(1)} N · N = {normal.toFixed(1)} N
            </span>
          </div>
          <input
            id="angle-slider"
            type="range"
            min={5}
            max={70}
            step={1}
            value={effectiveAngle}
            onChange={(e) => setSimAngle(Number(e.target.value))}
            className="w-full accent-blue-700 cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Aceleración resultante: <strong className="font-mono text-slate-800 tabular-nums">{acc.toFixed(2)} m/s²</strong></span>
            <span>{px > baseMu * normal ? 'Desliza hacia abajo' : 'Permanece frenado por roce'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'projectile') {
    const H = 1.8;
    const g = 9.81;
    const tFlight = Math.sqrt((2 * H) / g);
    const range = effectiveVel * tFlight;

    // Normalize curve inside SVG
    const startX = 46;
    const startY = 72;
    const groundY = 195;
    const maxDrawW = 250;
    const clampedSpan = Math.min(maxDrawW, Math.max(70, (range / 10) * maxDrawW));
    const endX = startX + clampedSpan;
    const ctrlX = startX + clampedSpan * 0.55;
    const ctrlY = startY;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Trayectoria de lanzamiento horizontal
            </h4>
            <p className="text-xs text-slate-500">
              {visualConfig?.caption ?? 'Independencia de movimientos horizontal y vertical'}
            </p>
          </div>
          {simVel !== baseVel && (
            <button
              type="button"
              onClick={() => setSimVel(baseVel)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar {baseVel} m/s
            </button>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <svg viewBox="0 0 340 225" className="w-full h-52 select-none" role="img" aria-label="Trayectoria parabólica">
            <defs>
              <marker id="arrow-proj-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#1D4ED8" />
              </marker>
            </defs>
            {/* Cliff / platform */}
            <rect x="16" y={startY} width={startX - 16} height={groundY - startY} fill="#E2E8F0" stroke="#94A3B8" />
            <line x1="16" y1={groundY} x2="324" y2={groundY} stroke="#475569" strokeWidth="2" />

            {/* Height line */}
            <line x1={startX + 8} y1={startY} x2={startX + 8} y2={groundY} stroke="#94A3B8" strokeDasharray="3 3" />
            <text x={startX + 14} y={(startY + groundY) / 2} fontSize="10" className="font-mono fill-slate-600">
              H = 1.8 m
            </text>

            {/* Velocity vector */}
            <line
              x1={startX}
              y1={startY - 6}
              x2={startX + 54}
              y2={startY - 6}
              stroke="#1D4ED8"
              strokeWidth="2.5"
              markerEnd="url(#arrow-proj-blue)"
            />
            <text x={startX + 4} y={startY - 14} fontSize="10" className="font-mono fill-blue-700 font-semibold">
              v₀ₓ = {effectiveVel.toFixed(2)} m/s
            </text>

            {/* Parabolic path */}
            <path
              d={`M ${startX} ${startY - 6} Q ${ctrlX} ${ctrlY} ${endX} ${groundY}`}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />
            <circle cx={endX} cy={groundY} r="4.5" fill="#059669" />

            {/* Range label */}
            <line x1={startX} y1={groundY + 12} x2={endX} y2={groundY + 12} stroke="#0F172A" strokeWidth="1.2" />
            <text x={(startX + endX) / 2} y={groundY + 24} textAnchor="middle" fontSize="11" className="font-mono fill-slate-900 font-semibold">
              D = {range.toFixed(2)} m
            </text>
          </svg>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="vel-slider" className="font-medium text-slate-700">
              Probar rapidez de salida v₀ₓ: <span className="font-mono text-slate-900 tabular-nums">{effectiveVel.toFixed(1)} m/s</span>
            </label>
            <span className="font-mono text-slate-500 tabular-nums">
              t vuelo = {tFlight.toFixed(2)} s
            </span>
          </div>
          <input
            id="vel-slider"
            type="range"
            min={2}
            max={12}
            step={0.2}
            value={effectiveVel}
            onChange={(e) => setSimVel(Number(e.target.value))}
            className="w-full accent-blue-700 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  // Fallback interactive step-route pipeline for any non-kinematic subject
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-slate-900">Ruta de resolución</h4>
        <p className="text-xs text-slate-500">
          Avanzá etapa por etapa o hacé clic en cualquier paso para revisarlo.
        </p>
      </div>
      <ol className="space-y-2">
        {stepTitles.map((title, idx) => {
          const isActive = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => onSelectStep(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                    : isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`font-mono text-[11px] w-5 h-5 rounded flex items-center justify-center shrink-0 tabular-nums ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate">{title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Progreso del ejercicio</span>
        <span className="font-mono tabular-nums text-slate-700">
          {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
