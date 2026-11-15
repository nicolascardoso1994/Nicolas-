import { ChartPoint } from '../types/study';

/**
 * Safe recursive-descent math expression evaluator for f(x) formulas.
 * Supports +, -, *, /, ^, parentheses, x variable, pi, e, and common functions.
 */
export function evaluateMathExpression(rawExpr: string, xVal: number): number | null {
  const expr = rawExpr
    .toLowerCase()
    .replace(/^y\s*=\s*/i, '')
    .replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');

  if (!expr) return null;

  let pos = 0;

  function peek(): string {
    return expr[pos] ?? '';
  }

  function consume(): string {
    return expr[pos++] ?? '';
  }

  function parseExpression(): number {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parsePower();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '^') {
      consume();
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') {
      consume();
      return -parseUnary();
    }
    if (peek() === '+') {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === '(') {
      consume();
      const val = parseExpression();
      if (peek() === ')') consume();
      return val;
    }

    // Number literal
    if (/[0-9.]/.test(peek())) {
      let numStr = '';
      while (/[0-9.]/.test(peek())) {
        numStr += consume();
      }
      const num = Number(numStr);
      // Support implicit multiplication like 2x or 2(x+1)
      if (peek() === 'x' || peek() === '(') {
        return num * parsePrimary();
      }
      return num;
    }

    // Identifiers (x, pi, e, functions)
    if (/[a-z]/.test(peek())) {
      let ident = '';
      while (/[a-z0-9]/.test(peek())) {
        ident += consume();
      }

      if (ident === 'x') return xVal;
      if (ident === 'pi') return Math.PI;
      if (ident === 'e') return Math.E;

      if (peek() === '(') {
        consume();
        const arg = parseExpression();
        if (peek() === ')') consume();
        switch (ident) {
          case 'sin':
          case 'sen':
            return Math.sin(arg);
          case 'cos':
            return Math.cos(arg);
          case 'tan':
          case 'tg':
            return Math.tan(arg);
          case 'sqrt':
          case 'raiz':
            return Math.sqrt(arg);
          case 'abs':
            return Math.abs(arg);
          case 'ln':
            return Math.log(arg);
          case 'log':
            return Math.log10(arg);
          case 'exp':
            return Math.exp(arg);
          default:
            return NaN;
        }
      }
      return NaN;
    }

    return NaN;
  }

  try {
    const result = parseExpression();
    if (pos < expr.length || !Number.isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export interface SeriesStats {
  count: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  meanY: number;
  slope: number;
  intercept: number;
  rSquared: number;
  trapezoidalArea: number;
}

export function computeSeriesStats(points: ChartPoint[]): SeriesStats | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const n = sorted.length;

  let minX = sorted[0].x;
  let maxX = sorted[0].x;
  let minY = sorted[0].y;
  let maxY = sorted[0].y;
  let sumX = 0;
  let sumY = 0;

  for (const p of sorted) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Linear regression y = m*x + b
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of sorted) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const slope = sxx > 1e-12 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  const rSquared =
    sxx > 1e-12 && syy > 1e-12 ? (sxy * sxy) / (sxx * syy) : syy <= 1e-12 ? 1 : 0;

  // Trapezoidal area under curve
  let area = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].x - sorted[i - 1].x;
    area += ((sorted[i].y + sorted[i - 1].y) / 2) * dx;
  }

  return {
    count: n,
    minX,
    maxX,
    minY,
    maxY,
    meanY,
    slope,
    intercept,
    rSquared,
    trapezoidalArea: area,
  };
}

/**
 * Parses CSV / pasted tabular text into (x, y) points.
 * Accepts comma, semicolon, or tab separators; skips non-numeric header rows.
 */
export function parseTabularData(rawText: string): ChartPoint[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const points: ChartPoint[] = [];

  for (const line of lines) {
    // Replace semicolon or tab with comma if needed, preserve decimal dots
    const parts = line.includes('\t')
      ? line.split('\t')
      : line.includes(';')
        ? line.split(';')
        : line.split(',');

    if (parts.length < 2) continue;
    const xNum = Number(parts[0].trim().replace(',', '.'));
    const yNum = Number(parts[1].trim().replace(',', '.'));
    if (Number.isFinite(xNum) && Number.isFinite(yNum)) {
      points.push({
        x: xNum,
        y: yNum,
        label: parts[2]?.trim() || undefined,
        group: parts[3]?.trim() || undefined,
      });
    }
  }

  return points.sort((a, b) => a.x - b.x);
}
