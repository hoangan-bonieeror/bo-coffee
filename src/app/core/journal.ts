/**
 * Personal coffee journal: the bean shelf and the brew log.
 * Pure types + helpers (stats, CSV, backup validation); storage lives in journal.service.ts.
 */
import { BrewMethod, isBrewMethod } from './brew';

export type Species = 'arabica' | 'robusta' | 'liberica' | 'blend';
export type Process = 'washed' | 'natural' | 'honey' | 'anaerobic' | 'other';
export type RoastLevel = 'light' | 'medium' | 'dark';

export interface Bean {
  id: string;
  name: string;
  roaster?: string;
  /** ISO country code, e.g. "VN", "ET". */
  origin?: string;
  species?: Species;
  process?: Process;
  roastLevel?: RoastLevel;
  /** YYYY-MM-DD */
  roastDate?: string;
  bagGrams?: number;
  notes?: string[];
  archived: boolean;
  created: string;
}

export interface BrewLog {
  id: string;
  beanId?: string;
  method: BrewMethod;
  /** ISO datetime */
  brewedAt: string;
  coffeeG: number;
  waterG: number;
  waterTempC?: number;
  grind?: string;
  totalSec?: number;
  /** % — only if measured with a refractometer */
  tds?: number;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Flavor ids from the flavor wheel */
  flavors: string[];
  comment?: string;
  /** Recipe came from this article */
  fromPostId?: string;
}

export const SCHEMA_VERSION = 1;

export interface JournalBackup {
  app: 'bo-coffee';
  schemaVersion: number;
  exported: string;
  beans: Bean[];
  brews: BrewLog[];
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Whole days between roast date and `on` (both local dates). */
export function daysSinceRoast(
  roastDate: string | undefined,
  on: Date = new Date(),
): number | null {
  if (!roastDate || !/^\d{4}-\d{2}-\d{2}$/.test(roastDate)) return null;
  const [y, m, d] = roastDate.split('-').map(Number);
  const roast = new Date(y, m - 1, d);
  const day = new Date(on.getFullYear(), on.getMonth(), on.getDate());
  return Math.round((day.getTime() - roast.getTime()) / 86_400_000);
}

/** Grams left in a bag after the brews logged against it (never below 0). */
export function gramsLeft(bean: Bean, brews: BrewLog[]): number | null {
  if (!bean.bagGrams) return null;
  const used = brews.filter((b) => b.beanId === bean.id).reduce((n, b) => n + b.coffeeG, 0);
  return Math.max(0, Math.round(bean.bagGrams - used));
}

export interface MethodStat {
  method: BrewMethod;
  count: number;
  avgRating: number;
}

export function statsByMethod(brews: BrewLog[]): MethodStat[] {
  const map = new Map<BrewMethod, { count: number; sum: number }>();
  for (const b of brews) {
    const s = map.get(b.method) ?? { count: 0, sum: 0 };
    s.count++;
    s.sum += b.rating;
    map.set(b.method, s);
  }
  return [...map.entries()]
    .map(([method, s]) => ({
      method,
      count: s.count,
      avgRating: Math.round((s.sum / s.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count || a.method.localeCompare(b.method));
}

/** Most frequent flavor notes in brews rated 4 or 5. */
export function topFlavors(brews: BrewLog[], limit = 8): { id: string; count: number }[] {
  const m = new Map<string, number>();
  for (const b of brews)
    if (b.rating >= 4) for (const f of b.flavors) m.set(f, (m.get(f) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Brew log as CSV (one row per brew, bean name joined in) for spreadsheets or pandas. */
export function brewsToCsv(brews: BrewLog[], beans: Bean[]): string {
  const beanName = new Map(beans.map((b) => [b.id, b.name]));
  const head = [
    'brewed_at',
    'method',
    'bean',
    'coffee_g',
    'water_g',
    'ratio',
    'water_temp_c',
    'grind',
    'total_sec',
    'tds_pct',
    'rating',
    'flavors',
    'comment',
  ];
  const rows = brews.map((b) =>
    [
      b.brewedAt,
      b.method,
      b.beanId ? beanName.get(b.beanId) : '',
      b.coffeeG,
      b.waterG,
      b.coffeeG ? Math.round((b.waterG / b.coffeeG) * 10) / 10 : '',
      b.waterTempC,
      b.grind,
      b.totalSec,
      b.tds,
      b.rating,
      b.flavors.join(';'),
      b.comment,
    ]
      .map(csvCell)
      .join(','),
  );
  return [head.join(','), ...rows].join('\n') + '\n';
}

/** Validates and normalises an imported backup. Throws with a readable message. */
export function parseBackup(text: string): JournalBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('not JSON');
  }
  const d = data as Partial<JournalBackup>;
  if (!d || d.app !== 'bo-coffee' || !Array.isArray(d.beans) || !Array.isArray(d.brews))
    throw new Error('not a Bo Coffee backup');
  if ((d.schemaVersion ?? 0) > SCHEMA_VERSION) throw new Error('backup is from a newer version');
  const beans = d.beans.filter(
    (b): b is Bean => !!b && typeof b.id === 'string' && typeof b.name === 'string',
  );
  const brews = d.brews
    .filter(
      (b): b is BrewLog =>
        !!b &&
        typeof b.id === 'string' &&
        isBrewMethod(b.method) &&
        Number(b.coffeeG) > 0 &&
        Number(b.waterG) > 0,
    )
    .map((b) => ({
      ...b,
      rating: Math.min(5, Math.max(1, Math.round(Number(b.rating) || 3))) as BrewLog['rating'],
      flavors: Array.isArray(b.flavors) ? b.flavors.map(String) : [],
    }));
  return {
    app: 'bo-coffee',
    schemaVersion: SCHEMA_VERSION,
    exported: String(d.exported ?? ''),
    beans: beans.map((b) => ({ ...b, archived: !!b.archived })),
    brews,
  };
}
