import { useEffect, useState } from 'react';
import { Eye, MapPin, Sparkles } from 'lucide-react';
import {
  SvgShapePrimitive,
  VisualDiagramPart,
  VisualExample,
  VisualTemplateId,
} from '../types/study';

interface VisualDiagramCardProps {
  example: VisualExample;
  highlightedPartNumber?: number;
  onSelectPartNumber?: (partNumber: number) => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
}

function renderTemplateArtwork(templateId: VisualTemplateId | undefined, isNightMode: boolean) {
  const strokeInk = isNightMode ? '#94A3B8' : '#334155';
  const softInk = isNightMode ? '#64748B' : '#94A3B8';

  switch (templateId) {
    case 'heart':
      return (
        <g aria-hidden="true">
          {/* Superior & Inferior Vena Cava (Right side of heart = left on anatomical anterior view) */}
          <path
            d="M 118 22 L 118 82 L 144 88 L 144 22 Z"
            fill="#93C5FD"
            stroke="#1D4ED8"
            strokeWidth="1.6"
          />
          <path
            d="M 122 182 L 122 240 L 144 240 L 144 182 Z"
            fill="#93C5FD"
            stroke="#1D4ED8"
            strokeWidth="1.6"
          />
          {/* Pulmonary Trunk & Arteries */}
          <path
            d="M 190 120 C 192 78, 212 52, 260 48 L 260 66 C 224 68, 212 88, 212 120 Z"
            fill="#60A5FA"
            stroke="#1E40AF"
            strokeWidth="1.6"
          />
          {/* Aortic Arch */}
          <path
            d="M 176 112 C 172 42, 226 18, 258 46 L 244 60 C 224 42, 196 56, 198 112 Z"
            fill="#FCA5A5"
            stroke="#B91C1C"
            strokeWidth="1.8"
          />
          {/* Main Myocardium Body */}
          <path
            d="M 112 96 C 95 128, 108 192, 168 224 C 216 248, 272 224, 282 168 C 292 120, 262 84, 224 84 C 194 84, 146 78, 112 96 Z"
            fill="#FEE2E2"
            stroke="#991B1B"
            strokeWidth="2.2"
          />
          {/* Right Atrium (anatomical right = viewer left) */}
          <ellipse
            cx="138"
            cy="118"
            rx="26"
            ry="24"
            fill="#BFDBFE"
            stroke="#1D4ED8"
            strokeWidth="1.5"
          />
          {/* Right Ventricle */}
          <path
            d="M 134 148 C 128 182, 152 212, 184 216 L 192 146 Z"
            fill="#DBEAFE"
            stroke="#1D4ED8"
            strokeWidth="1.5"
          />
          {/* Left Atrium */}
          <ellipse
            cx="248"
            cy="112"
            rx="24"
            ry="20"
            fill="#FECACA"
            stroke="#B91C1C"
            strokeWidth="1.5"
          />
          {/* Left Ventricle (thick muscular wall) */}
          <path
            d="M 206 144 L 198 220 C 236 226, 268 194, 266 144 Z"
            fill="#FCA5A5"
            stroke="#991B1B"
            strokeWidth="1.8"
          />
          {/* Interventricular Septum */}
          <path
            d="M 192 142 L 188 222 L 200 222 L 204 142 Z"
            fill="#F87171"
            stroke="#991B1B"
            strokeWidth="1.2"
          />
          {/* Tricuspid & Mitral Valve Markers */}
          <line x1="138" y1="142" x2="176" y2="146" stroke={strokeInk} strokeWidth="2.2" strokeDasharray="3 2" />
          <line x1="214" y1="138" x2="256" y2="138" stroke={strokeInk} strokeWidth="2.2" strokeDasharray="3 2" />
        </g>
      );

    case 'cell':
      return (
        <g aria-hidden="true">
          {/* Outer Plasma Membrane */}
          <ellipse
            cx="200"
            cy="132"
            rx="158"
            ry="104"
            fill="#ECFEFF"
            stroke="#0E7490"
            strokeWidth="3"
          />
          <ellipse
            cx="200"
            cy="132"
            rx="150"
            ry="96"
            fill="#F0FDFA"
            stroke="#14B8A6"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Nucleus & Nucleolus */}
          <circle cx="176" cy="126" r="44" fill="#DDD6FE" stroke="#6D28D9" strokeWidth="2" />
          <circle cx="170" cy="122" r="16" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="1.5" />
          {/* Rough Endoplasmic Reticulum folds */}
          <path
            d="M 218 96 C 236 106, 236 126, 218 136 C 238 144, 238 164, 216 172"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 228 104 C 246 114, 246 134, 228 144 C 246 152, 244 166, 226 174"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Mitochondria */}
          <g transform="translate(292, 114) rotate(22)">
            <ellipse cx="0" cy="0" rx="26" ry="13" fill="#FED7AA" stroke="#C2410C" strokeWidth="1.8" />
            <path d="M -18 0 Q -10 -7, -2 0 T 16 0" fill="none" stroke="#C2410C" strokeWidth="1.4" />
          </g>
          <g transform="translate(114, 186) rotate(-18)">
            <ellipse cx="0" cy="0" rx="22" ry="11" fill="#FED7AA" stroke="#C2410C" strokeWidth="1.6" />
            <path d="M -14 0 Q -7 -6, 0 0 T 14 0" fill="none" stroke="#C2410C" strokeWidth="1.3" />
          </g>
          {/* Golgi Apparatus */}
          <g transform="translate(268, 178)">
            <path d="M -22 -10 Q 0 -16, 22 -10" fill="none" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M -26 -2 Q 0 -8, 26 -2" fill="none" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M -20 6 Q 0 1, 20 6" fill="none" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          {/* Ribosomes & Lysosome */}
          <circle cx="96" cy="108" r="11" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.6" />
          <circle cx="132" cy="70" r="3.5" fill="#0F766E" />
          <circle cx="242" cy="74" r="3.5" fill="#0F766E" />
          <circle cx="305" cy="156" r="3.5" fill="#0F766E" />
        </g>
      );

    case 'neuron':
      return (
        <g aria-hidden="true">
          {/* Dendrites */}
          <path d="M 88 128 L 44 92 M 66 110 L 58 76 M 84 134 L 38 134 M 88 144 L 46 178 M 64 162 L 60 196 M 102 104 L 94 64" stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round" />
          {/* Soma (Cell Body) */}
          <path
            d="M 84 114 C 96 92, 134 94, 146 124 C 154 144, 138 170, 108 168 C 86 166, 74 140, 84 114 Z"
            fill="#DBEAFE"
            stroke="#1D4ED8"
            strokeWidth="2.2"
          />
          {/* Nucleus */}
          <circle cx="114" cy="132" r="15" fill="#93C5FD" stroke="#1E40AF" strokeWidth="1.6" />
          {/* Axon shaft */}
          <line x1="145" y1="132" x2="322" y2="132" stroke="#1D4ED8" strokeWidth="4" />
          {/* Myelin Sheath Segments + Nodes of Ranvier */}
          <rect x="164" y="118" width="38" height="28" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <rect x="212" y="118" width="38" height="28" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <rect x="260" y="118" width="38" height="28" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          {/* Axon Terminals */}
          <path d="M 322 132 L 352 104 M 322 132 L 358 132 M 322 132 L 352 160" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="356" cy="102" r="6" fill="#A7F3D0" stroke="#059669" strokeWidth="1.6" />
          <circle cx="362" cy="132" r="6" fill="#A7F3D0" stroke="#059669" strokeWidth="1.6" />
          <circle cx="356" cy="162" r="6" fill="#A7F3D0" stroke="#059669" strokeWidth="1.6" />
        </g>
      );

    case 'respiratory':
      return (
        <g aria-hidden="true">
          {/* Larynx & Trachea */}
          <rect x="184" y="24" width="32" height="18" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.6" />
          <rect x="188" y="42" width="24" height="62" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.6" />
          {[52, 64, 76, 88].map((y) => (
            <line key={y} x1="188" y1={y} x2="212" y2={y} stroke="#0369A1" strokeWidth="1.4" />
          ))}
          {/* Right & Left Lungs */}
          <path
            d="M 176 92 C 122 86, 86 134, 88 202 C 118 214, 162 208, 178 190 Z"
            fill="#FCE7F3"
            stroke="#BE185D"
            strokeWidth="2"
          />
          <path
            d="M 224 92 C 278 86, 314 134, 312 202 C 282 214, 238 208, 222 190 Z"
            fill="#FCE7F3"
            stroke="#BE185D"
            strokeWidth="2"
          />
          {/* Bronchi & Bronchioles */}
          <path d="M 194 104 L 150 132 M 150 132 L 122 154 M 150 132 L 146 172" stroke="#0284C7" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 206 104 L 250 132 M 250 132 L 278 154 M 250 132 L 254 172" stroke="#0284C7" strokeWidth="3.2" strokeLinecap="round" />
          {/* Alveolar Cluster Inset */}
          <circle cx="122" cy="162" r="7" fill="#FBCFE8" stroke="#9D174D" strokeWidth="1.2" />
          <circle cx="278" cy="162" r="7" fill="#FBCFE8" stroke="#9D174D" strokeWidth="1.2" />
          {/* Diaphragm */}
          <path d="M 76 226 Q 200 194, 324 226" fill="none" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    case 'nephron':
      return (
        <g aria-hidden="true">
          {/* Bowman's Capsule */}
          <path
            d="M 102 68 C 72 68, 72 124, 106 124 C 122 124, 134 114, 136 96"
            fill="#FEF9C3"
            stroke="#A16207"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Glomerulus capillary tuft */}
          <circle cx="102" cy="96" r="18" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1.8" />
          <path d="M 62 84 L 90 92 M 62 110 L 90 100" stroke="#DC2626" strokeWidth="2.4" />
          {/* Proximal Convoluted Tubule */}
          <path
            d="M 136 96 C 154 78, 174 116, 192 94 C 204 80, 214 96, 214 116"
            fill="none"
            stroke="#CA8A04"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Loop of Henle */}
          <path
            d="M 214 116 L 214 212 C 214 232, 250 232, 250 212 L 250 112"
            fill="none"
            stroke="#EAB308"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Distal Convoluted Tubule */}
          <path
            d="M 250 112 C 264 88, 286 118, 304 94 C 314 82, 324 92, 328 104"
            fill="none"
            stroke="#CA8A04"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Collecting Duct */}
          <path d="M 328 52 L 328 228" stroke="#0284C7" strokeWidth="7" strokeLinecap="round" />
          <path d="M 328 134 L 308 148 M 328 176 L 308 190" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    case 'bone':
      return (
        <g aria-hidden="true">
          {/* Long Bone Silhouette (Femur-like) */}
          <path
            d="M 132 40 C 102 36, 94 74, 128 92 L 154 110 L 154 186 L 130 208 C 110 226, 134 246, 172 242 C 210 246, 234 226, 214 208 L 194 186 L 194 110 L 218 92 C 246 74, 238 36, 208 40 C 188 44, 178 58, 172 68 C 166 58, 154 44, 132 40 Z"
            fill="#FEF3C7"
            stroke="#92400E"
            strokeWidth="2.2"
          />
          {/* Spongy bone epiphysis texture */}
          <ellipse cx="142" cy="64" rx="22" ry="15" fill="#FDE68A" stroke="#B45309" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Medullary Cavity */}
          <rect x="163" y="116" width="22" height="72" rx="8" fill="#FECACA" stroke="#B91C1C" strokeWidth="1.4" />
          {/* Articular Cartilage */}
          <path d="M 118 42 C 102 48, 98 66, 114 82" fill="none" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 136 238 Q 172 248, 208 238" fill="none" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );

    default:
      return (
        <g aria-hidden="true">
          <rect x="20" y="20" width="360" height="220" rx="12" fill="none" stroke={softInk} strokeDasharray="4 4" strokeWidth="1.2" />
        </g>
      );
  }
}

function renderCustomShape(shape: SvgShapePrimitive, idx: number, defaultStroke: string) {
  const stroke = shape.stroke || defaultStroke;
  const fill = shape.fill || 'transparent';
  const strokeWidth = shape.strokeWidth ?? 1.8;

  switch (shape.kind) {
    case 'ellipse':
      return (
        <ellipse
          key={idx}
          cx={shape.cx ?? 200}
          cy={shape.cy ?? 130}
          rx={shape.rx ?? 40}
          ry={shape.ry ?? 24}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'circle':
      return (
        <circle
          key={idx}
          cx={shape.cx ?? 200}
          cy={shape.cy ?? 130}
          r={shape.r ?? 24}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'rect':
      return (
        <rect
          key={idx}
          x={shape.x ?? 140}
          y={shape.y ?? 90}
          width={shape.width ?? 120}
          height={shape.height ?? 60}
          rx={8}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'line':
      return (
        <line
          key={idx}
          x1={shape.x1 ?? 80}
          y1={shape.y1 ?? 130}
          x2={shape.x2 ?? 320}
          y2={shape.y2 ?? 130}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    case 'polygon':
      return (
        <polygon
          key={idx}
          points={shape.points ?? '160,180 200,80 240,180'}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'path':
    default:
      return (
        <path
          key={idx}
          d={shape.d ?? 'M 80 130 Q 200 70 320 130'}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
  }
}

export function VisualDiagramCard({
  example,
  highlightedPartNumber,
  onSelectPartNumber,
  isReadingMode = false,
  isNightMode = false,
}: VisualDiagramCardProps) {
  const parts = example.parts ?? [];
  const [localPartNumber, setLocalPartNumber] = useState<number>(
    parts[0]?.number ?? 1
  );

  useEffect(() => {
    setLocalPartNumber(parts[0]?.number ?? 1);
  }, [example.id]);

  const activePartNumber =
    highlightedPartNumber !== undefined ? highlightedPartNumber : localPartNumber;

  const activePart: VisualDiagramPart | undefined =
    parts.find((p) => p.number === activePartNumber) ?? parts[0];

  const handleSelect = (num: number) => {
    setLocalPartNumber(num);
    onSelectPartNumber?.(num);
  };

  const cardBg = isNightMode
    ? 'bg-[#171E2B] border-[#293549]'
    : isReadingMode
      ? 'bg-[#FAF6EB] border-[#E4DCC8]'
      : 'bg-white border-slate-200';
  const canvasBg = isNightMode
    ? 'bg-[#101622] border-[#293549]'
    : isReadingMode
      ? 'bg-[#F2ECDC] border-[#DFD6BF]'
      : 'bg-slate-50 border-slate-200';
  const headingInk = isNightMode
    ? 'text-white'
    : isReadingMode
      ? 'text-[#241E18]'
      : 'text-slate-900';
  const mutedInk = isNightMode
    ? 'text-[#94A3B8]'
    : isReadingMode
      ? 'text-[#6E6254]'
      : 'text-slate-500';
  const bodyInk = isNightMode
    ? 'text-[#CBD5E1]'
    : isReadingMode
      ? 'text-[#3D352C]'
      : 'text-slate-700';

  return (
    <div className={`border rounded-xl p-4 sm:p-5 space-y-4 transition-colors ${cardBg}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-medium flex items-center gap-1.5 ${
              isNightMode
                ? 'text-[#7CB4FF]'
                : isReadingMode
                  ? 'text-[#8B5220]'
                  : 'text-blue-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{example.categoryLabel || 'Ejemplo visual'}</span>
          </p>
          <h4 className={`text-base font-semibold mt-0.5 ${headingInk}`}>
            {example.title}
          </h4>
          {example.caption && (
            <p className={`text-xs mt-0.5 ${mutedInk}`}>{example.caption}</p>
          )}
        </div>
        <span className={`text-xs font-mono tabular-nums ${mutedInk}`}>
          {parts.length} partes señaladas
        </span>
      </div>

      {/* Interactive Vector Canvas */}
      <div className={`border rounded-xl p-2 sm:p-3 ${canvasBg}`}>
        <svg
          viewBox="0 0 400 260"
          className="w-full h-56 sm:h-64 select-none"
          role="img"
          aria-label={example.title}
        >
          {example.shapes && example.shapes.length > 0
            ? example.shapes.map((s, idx) =>
                renderCustomShape(s, idx, isNightMode ? '#94A3B8' : '#334155')
              )
            : renderTemplateArtwork(example.templateId, isNightMode)}

          {/* Interactive Numbered Hotspot Pins */}
          {parts.map((part) => {
            const cx = Math.min(380, Math.max(20, part.x));
            const cy = Math.min(242, Math.max(18, part.y));
            const isActive = activePart?.number === part.number;

            return (
              <g
                key={part.id}
                onClick={() => handleSelect(part.number)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${part.number}. ${part.label}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(part.number);
                  }
                }}
              >
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill={isNightMode ? 'rgba(96,165,250,0.22)' : 'rgba(29,78,216,0.16)'}
                    stroke={isNightMode ? '#60A5FA' : '#1D4ED8'}
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill={
                    isActive
                      ? '#1D4ED8'
                      : isNightMode
                        ? '#1E293B'
                        : '#FFFFFF'
                  }
                  stroke={
                    isActive
                      ? '#FFFFFF'
                      : isNightMode
                        ? '#60A5FA'
                        : '#1E293B'
                  }
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-mono"
                  fill={
                    isActive
                      ? '#FFFFFF'
                      : isNightMode
                        ? '#F8FAFC'
                        : '#0F172A'
                  }
                >
                  {part.number}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Clickable Parts Selector Strip */}
      {parts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {parts.map((part) => {
            const isActive = activePart?.number === part.number;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => handleSelect(part.number)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isActive
                    ? isNightMode
                      ? 'bg-[#1F2A3E] border-[#60A5FA] text-white'
                      : isReadingMode
                        ? 'bg-[#6F4118] border-[#593312] text-[#FAF6EB]'
                        : 'bg-blue-700 border-blue-700 text-white'
                    : isNightMode
                      ? 'bg-[#1D2636] border-[#2F3C52] text-[#CBD5E1] hover:bg-[#253147]'
                      : isReadingMode
                        ? 'bg-[#F2ECDC] border-[#DFD6BF] text-[#3D352C] hover:bg-[#EAE1CA]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono font-bold tabular-nums">{part.number}.</span>
                <span>{part.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Part Detailed Breakdown */}
      {activePart && (
        <div className={`border rounded-xl p-4 space-y-2.5 ${canvasBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className={`text-sm font-semibold ${headingInk}`}>
              {activePart.number}. {activePart.label}
            </h5>
            {activePart.location && (
              <span className={`inline-flex items-center gap-1 text-xs ${mutedInk}`}>
                <MapPin className="w-3 h-3 shrink-0" />
                {activePart.location}
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed ${bodyInk}`}>
            {activePart.description}
          </p>

          {activePart.examTip && (
            <div
              className={`border rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
                isNightMode
                  ? 'bg-[#172133] border-[#2C3D59] text-[#E2E8F0]'
                  : isReadingMode
                    ? 'bg-[#FAF6EB] border-[#E4DCC8] text-[#3D352C]'
                    : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                  isNightMode ? 'text-[#7CB4FF]' : 'text-blue-700'
                }`}
              />
              <span>
                <strong className={headingInk}>Clave de examen:</strong>{' '}
                {activePart.examTip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
