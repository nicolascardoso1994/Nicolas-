import { useState } from 'react';
import { Eye, EyeOff, Calculator } from 'lucide-react';
import { MathBlock } from './MathText';

interface RevealableFormulaProps {
  latex: string;
  caption?: string;
  label?: string;
  bold?: boolean;
  defaultVisible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  isReadingMode?: boolean;
  isNightMode?: boolean;
  compact?: boolean;
}

export function RevealableFormula({
  latex,
  caption,
  label = 'Ver fórmula',
  bold = true,
  defaultVisible = false,
  open,
  onToggle,
  isReadingMode = false,
  isNightMode = false,
  compact = false,
}: RevealableFormulaProps) {
  const [localOpen, setLocalOpen] = useState(defaultVisible);
  const isControlled = open !== undefined;
  const isVisible = isControlled ? open : localOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalOpen((prev) => !prev);
    }
  };

  if (!latex || !latex.trim()) return null;

  if (!isVisible) {
    return (
      <div className={compact ? 'pt-1' : 'my-2'}>
        <button
          type="button"
          aria-expanded={false}
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          } font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 font-sans ${
            isNightMode
              ? 'bg-[#1F2838] border-[#34445E] text-white hover:bg-[#283449]'
              : isReadingMode
                ? 'bg-[#F2ECDC] border-[#D8CBB0] text-[#3B2E1E] hover:bg-[#E8DEC7]'
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800'
          }`}
        >
          <Calculator
            className={`w-3.5 h-3.5 shrink-0 ${
              isNightMode
                ? 'text-[#7CB4FF]'
                : isReadingMode
                  ? 'text-[#8B5220]'
                  : 'text-blue-700'
            }`}
          />
          <span>{label}</span>
          <Eye className="w-3.5 h-3.5 opacity-70 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${compact ? 'my-1.5 px-3 py-2.5' : 'my-3 px-4 py-3'} border rounded-lg space-y-2 transition-colors ${
        isNightMode
          ? 'bg-[#1F2838] border-[#313F57]'
          : isReadingMode
            ? 'bg-[#F2ECDC] border-[#DFD6BF]'
            : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-medium font-sans ${
            isNightMode
              ? 'text-[#94A3B8]'
              : isReadingMode
                ? 'text-[#6E6254]'
                : 'text-slate-500'
          }`}
        >
          Fórmula
        </span>
        <button
          type="button"
          aria-expanded={true}
          onClick={handleToggle}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium font-sans transition-colors whitespace-nowrap shrink-0 ${
            isNightMode
              ? 'text-[#93C5FD] hover:text-white'
              : isReadingMode
                ? 'text-[#8B5220] hover:text-[#5B3412]'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <EyeOff className="w-3 h-3" />
          Ocultar fórmula
        </button>
      </div>

      <div
        className={`overflow-x-auto text-center ${
          isNightMode
            ? 'text-white'
            : isReadingMode
              ? 'text-[#241E18]'
              : 'text-slate-950'
        }`}
      >
        <MathBlock latex={latex} displayMode={true} bold={bold} />
      </div>

      {caption && (
        <p
          className={`text-xs text-center ${
            isNightMode
              ? 'text-[#94A3B8]'
              : isReadingMode
                ? 'text-[#6E6254]'
                : 'text-slate-500'
          }`}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
