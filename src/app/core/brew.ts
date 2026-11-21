/**
 * Coffee brewing domain: methods, presets, ratio maths and the parser for the
 * ```brew-calc / ```brew-timer blocks that articles embed.
 * Everything here is pure (no Angular, no DOM) so it is easy to unit test.
 */
import { I18nText } from './models';

export const BREW_METHODS = [
  'phin',
  'v60',
  'french-press',
  'aeropress',
  'espresso',
  'cold-brew',
] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export function isBrewMethod(v: unknown): v is BrewMethod {
  return typeof v === 'string' && (BREW_METHODS as readonly string[]).includes(v);
}

/** One step of a timed recipe. `pour` is the water added in this step (g ≈ ml). */
export interface BrewStep {
  /** Second (from start) at which the step begins. */
  at: number;
  pour?: number;
  label: I18nText | string;
}

/** One brew method as described in public/content/brew-presets.json. */
export interface BrewPreset {
  id: BrewMethod;
  icon: string;
  name: I18nText;
  /** Default water : coffee ratio, e.g. 16 for 1:16. For espresso: yield : dose. */
  ratio: number;
  ratioRange: [number, number];
  coffee: number;
  tempC: [number, number];
  grind: I18nText;
  /** Typical total time in seconds. */
  timeSec: number;
  steps: BrewStep[];
  note?: I18nText;
  /** Where the numbers come from. */
  source: { title: string; url: string }[];
}

/** Grams of water (≈ ml) for a dose and ratio, rounded to the gram. */
export function waterFor(coffeeG: number, ratio: number): number {
  if (!(coffeeG > 0) || !(ratio > 0)) return 0;
  return Math.round(coffeeG * ratio);
}

/** Grams of coffee for an amount of water and ratio, rounded to 0.1 g. */
export function coffeeFor(waterG: number, ratio: number): number {
  if (!(waterG > 0) || !(ratio > 0)) return 0;
  return Math.round((waterG / ratio) * 10) / 10;
}

/** Ratio (water ÷ coffee) rounded to 0.1, or 0 when undefined. */
export function ratioOf(coffeeG: number, waterG: number): number {
  if (!(coffeeG > 0) || !(waterG > 0)) return 0;
  return Math.round((waterG / coffeeG) * 10) / 10;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Extraction yield (%) from brew strength.
 * EY = TDS% × beverage mass ÷ dose. For filter coffee, beverage mass ≈ water − 2 × dose
 * (grounds retain about twice their weight); for espresso pass the measured yield.
 */
export function extractionYield(tdsPct: number, beverageG: number, coffeeG: number): number {
  if (!(tdsPct > 0) || !(beverageG > 0) || !(coffeeG > 0)) return 0;
  return Math.round(((tdsPct * beverageG) / coffeeG) * 10) / 10;
}

/** Estimate of beverage mass for percolation/immersion brews (grounds hold ~2 g water per g). */
export function beverageEstimate(waterG: number, coffeeG: number): number {
  return Math.max(0, Math.round(waterG - 2 * coffeeG));
}

/** "mm:ss" */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** "1:30" → 90, "45" → 45, "2:00:00" → 7200. Returns NaN when invalid. */
export function parseClock(text: string): number {
  const parts = text.trim().split(':');
  if (!parts.length || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

/** Index of the step active at `elapsed` seconds (−1 before the first step). */
export function activeStepIndex(steps: { at: number }[], elapsed: number): number {
  let idx = -1;
  for (let i = 0; i < steps.length; i++) if (steps[i].at <= elapsed) idx = i;
  return idx;
}

/** Running total of water poured up to and including each step. */
export function cumulativePours(steps: { pour?: number }[]): number[] {
  let sum = 0;
  return steps.map((s) => (sum += s.pour ?? 0));
}

/** Scale every pour so the recipe uses `targetWater` instead of its own total. */
export function scaleSteps<T extends { pour?: number }>(steps: T[], targetWater: number): T[] {
  const total = steps.reduce((n, s) => n + (s.pour ?? 0), 0);
  if (!(total > 0) || !(targetWater > 0)) return steps;
  const k = targetWater / total;
  return steps.map((s) => (s.pour ? { ...s, pour: Math.round(s.pour * k) } : s));
}

// ---------------------------------------------------------------------------
// Article blocks
// ---------------------------------------------------------------------------

export interface BlockSpec {
  props: Record<string, string>;
  steps: { at: number; pour?: number; label: string }[];
  errors: string[];
}

/**
 * Parses the body of a ```brew-calc / ```brew-timer / ```flavor-wheel block:
 *
 *   method: phin
 *   coffee: 20
 *   ratio: 6
 *   range: 4-10
 *   step: 0:00 | 40 | Bloom
 *   step: 0:40 | 80 | Fill the chamber
 *   step: 4:30 |    | Last drips
 *
 * Lines starting with "#" are comments. Unknown keys are kept in `props`.
 */
export function parseBlock(text: string): BlockSpec {
  const props: Record<string, string> = {};
  const steps: BlockSpec['steps'] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const m = line.match(/^([a-z][a-z-]*)\s*:\s*(.*)$/i);
    if (!m) {
      errors.push(`line ${i + 1}: expected "key: value"`);
      return;
    }
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key !== 'step') {
      props[key] = value;
      return;
    }
    const [at, pour, ...label] = value.split('|').map((x) => x.trim());
    const atSec = parseClock(at ?? '');
    const pourG = pour ? Number(pour) : undefined;
    if (Number.isNaN(atSec)) errors.push(`line ${i + 1}: step time "${at}" must be m:ss`);
    else if (pourG !== undefined && !(pourG >= 0))
      errors.push(`line ${i + 1}: pour "${pour}" must be a number of grams`);
    else steps.push({ at: atSec, pour: pourG || undefined, label: label.join('|') || '' });
  });
  for (let i = 1; i < steps.length; i++)
    if (steps[i].at < steps[i - 1].at) errors.push(`steps must be in time order`);
  if (props['method'] && !isBrewMethod(props['method']))
    errors.push(`unknown method "${props['method']}"`);
  for (const k of ['coffee', 'ratio', 'water'])
    if (props[k] !== undefined && !(Number(props[k]) > 0)) errors.push(`${k} must be a number > 0`);
  if (props['range'] !== undefined && !parseRange(props['range']))
    errors.push(`range must look like "14-18"`);
  return { props, steps, errors };
}

/** "14-18" → [14, 18] */
export function parseRange(text: string): [number, number] | null {
  const m = text.match(/^\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a > 0 && b > a ? [a, b] : null;
}
