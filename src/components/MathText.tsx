import katex from 'katex';
import { Fragment, memo } from 'react';

interface MathBlockProps {
  latex: string;
  displayMode?: boolean;
  bold?: boolean;
  className?: string;
}

export const MathBlock = memo(
  function MathBlock({
    latex,
    displayMode = true,
    bold = false,
    className = '',
  }: MathBlockProps) {
    const cleaned = latex.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();
    const formatted = bold ? `\\boldsymbol{${cleaned}}` : cleaned;

    let html = '';
    let failed = false;
    try {
      html = katex.renderToString(formatted, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      failed = true;
    }

    if (failed || !html) {
      return (
        <code
          className={`math-code-fallback font-mono text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded ${
            bold ? 'font-bold math-bold' : ''
          } ${className}`}
        >
          {cleaned}
        </code>
      );
    }

    return (
      <span
        className={`${bold ? 'font-bold text-slate-950 math-bold' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
  (prev, next) =>
    prev.latex === next.latex &&
    prev.displayMode === next.displayMode &&
    prev.bold === next.bold &&
    prev.className === next.className
);

interface MathTextProps {
  text: string;
  className?: string;
  boldDisplayMath?: boolean;
}

export const MathText = memo(
  function MathText({
    text,
    className = '',
    boldDisplayMath = true,
  }: MathTextProps) {
    if (!text) return null;

    // Split by $$...$$ first, then $...$
    const tokens = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

    return (
      <span className={className}>
        {tokens.map((token, idx) => {
          if (token.startsWith('$$') && token.endsWith('$$') && token.length > 4) {
            const inner = token.slice(2, -2);
            return (
              <span
                key={idx}
                className="math-display-box block my-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto text-center font-bold text-slate-950"
              >
                <MathBlock latex={inner} displayMode={true} bold={boldDisplayMath} />
              </span>
            );
          }
          if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
            const inner = token.slice(1, -1);
            return <MathBlock key={idx} latex={inner} displayMode={false} />;
          }

          // Handle simple **bold** inside plain text segments
          const boldParts = token.split(/(\*\*[^*]+\*\*)/g);
          return (
            <Fragment key={idx}>
              {boldParts.map((part, bIdx) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                  return (
                    <strong key={bIdx} className="math-strong font-semibold text-slate-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <Fragment key={bIdx}>{part}</Fragment>;
              })}
            </Fragment>
          );
        })}
      </span>
    );
  },
  (prev, next) =>
    prev.text === next.text &&
    prev.className === next.className &&
    prev.boldDisplayMath === next.boldDisplayMath
);
