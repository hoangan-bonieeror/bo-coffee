import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BREW_METHODS,
  BrewMethod,
  formatClock,
  isBrewMethod,
  parseClock,
  ratioOf,
} from '../core/brew';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';
import { BrewLog, newId } from '../core/journal';
import { JournalService } from '../core/journal.service';
import { FlavorWheel } from '../shared/flavor-wheel';

interface Draft {
  beanId: string;
  method: BrewMethod;
  brewedAt: string;
  coffeeG: number | null;
  waterG: number | null;
  waterTempC: number | null;
  grind: string;
  time: string;
  tds: number | null;
  rating: BrewLog['rating'];
  flavors: string[];
  comment: string;
  fromPostId?: string;
}

/** "2026-11-21T08:05" in local time, for <input type="datetime-local">. */
function localInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v !== undefined && v !== '' && n > 0 ? n : null;
};

@Component({
  selector: 'app-brew-form',
  imports: [RouterLink, FlavorWheel],
  template: `
    <a class="back-link" routerLink="/brew">← {{ i18n.t('brew.title') }}</a>
    <header class="page-head">
      <h1>{{ id() ? i18n.t('brew.edit') : i18n.t('brew.new') }}</h1>
    </header>

    @if (draft(); as d) {
      <form class="card brew-form" (submit)="save($event)">
        <div class="form-grid">
          <label
            >{{ i18n.t('tools.method') }}
            <select (change)="patch({ method: $any($event.target).value })">
              @for (m of methods; track m) {
                <option [value]="m" [selected]="d.method === m">{{ methodName(m) }}</option>
              }
            </select></label
          >
          <label
            >{{ i18n.t('beans.title') }}
            <select (change)="patch({ beanId: $any($event.target).value })">
              <option value="" [selected]="!d.beanId">—</option>
              @for (b of journal.beans(); track b.id) {
                <option [value]="b.id" [selected]="d.beanId === b.id">
                  {{ b.name }}{{ b.archived ? ' (' + i18n.t('beans.archived') + ')' : '' }}
                </option>
              }
            </select>
            <a class="small" routerLink="/beans">+ {{ i18n.t('beans.add') }}</a></label
          >
          <label
            >{{ i18n.t('brew.when') }}
            <input
              type="datetime-local"
              [value]="d.brewedAt"
              (input)="patch({ brewedAt: $any($event.target).value })"
          /></label>
          <label
            >{{ i18n.t('calc.coffee') }} (g) *
            <input
              type="number"
              required
              min="0.1"
              step="0.1"
              inputmode="decimal"
              [value]="d.coffeeG ?? ''"
              (input)="patch({ coffeeG: $any($event.target).valueAsNumber || null })"
          /></label>
          <label
            >{{ d.method === 'espresso' ? i18n.t('calc.yield') : i18n.t('calc.water') }} (g) *
            <input
              type="number"
              required
              min="1"
              step="1"
              inputmode="decimal"
              [value]="d.waterG ?? ''"
              (input)="patch({ waterG: $any($event.target).valueAsNumber || null })"
            />
            @if (ratio()) {
              <span class="small muted">1:{{ ratio() }}</span>
            }
          </label>
          <label
            >{{ i18n.t('brew.temp') }} (°C)
            <input
              type="number"
              min="0"
              max="100"
              [value]="d.waterTempC ?? ''"
              (input)="patch({ waterTempC: $any($event.target).valueAsNumber || null })"
          /></label>
          <label
            >{{ i18n.t('calc.grind') }}
            <input
              maxlength="40"
              [value]="d.grind"
              [placeholder]="i18n.t('brew.grindPh')"
              (input)="patch({ grind: $any($event.target).value })"
          /></label>
          <label
            >{{ i18n.t('calc.time') }} (m:ss)
            <input
              [value]="d.time"
              placeholder="3:00"
              pattern="\\d{1,2}(:\\d{2}){0,2}"
              (input)="patch({ time: $any($event.target).value })"
          /></label>
          <label
            >TDS (%)
            <input
              type="number"
              min="0"
              max="20"
              step="0.01"
              [value]="d.tds ?? ''"
              [placeholder]="i18n.t('brew.optional')"
              (input)="patch({ tds: $any($event.target).valueAsNumber || null })"
          /></label>
        </div>

        <fieldset class="rating-field">
          <legend>{{ i18n.t('brew.rating') }}</legend>
          @for (n of [1, 2, 3, 4, 5]; track n) {
            <button
              type="button"
              class="star"
              [class.on]="n <= d.rating"
              [attr.aria-label]="n + '/5'"
              [attr.aria-pressed]="n === d.rating"
              (click)="patch({ rating: $any(n) })"
            >
              ★
            </button>
          }
        </fieldset>

        <fieldset>
          <legend>{{ i18n.t('brew.flavors') }}</legend>
          <app-flavor-wheel
            [selectable]="true"
            [selected]="d.flavors"
            (selectedChange)="patch({ flavors: $event })"
          />
        </fieldset>

        <label class="wide"
          >{{ i18n.t('brew.comment') }}
          <textarea
            rows="3"
            maxlength="600"
            [value]="d.comment"
            [placeholder]="i18n.t('brew.commentPh')"
            (input)="patch({ comment: $any($event.target).value })"
          ></textarea>
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <div class="form-actions">
          <button class="btn" type="submit">{{ i18n.t('common.save') }}</button>
          <a class="btn ghost" routerLink="/brew">{{ i18n.t('common.cancel') }}</a>
        </div>
      </form>
    } @else if (journal.ready()) {
      <p class="muted">{{ i18n.t('brew.notFound') }}</p>
    }
  `,
})
export class BrewFormPage {
  /** Route param for editing (/brew/:id) */
  readonly id = input<string | undefined>(undefined);
  /** Query params from the timer, calculator or bean card */
  readonly method = input<string | undefined>(undefined);
  readonly coffee = input<string | undefined>(undefined);
  readonly water = input<string | undefined>(undefined);
  readonly sec = input<string | undefined>(undefined);
  readonly post = input<string | undefined>(undefined);
  readonly bean = input<string | undefined>(undefined);

  protected readonly i18n = inject(I18n);
  protected readonly journal = inject(JournalService);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);

  protected readonly methods = BREW_METHODS;
  protected readonly draft = signal<Draft | null>(null);
  protected readonly error = signal('');
  protected readonly ratio = computed(() => {
    const d = this.draft();
    return d?.coffeeG && d.waterG ? ratioOf(d.coffeeG, d.waterG) : 0;
  });

  constructor() {
    // Build the draft once the journal has loaded (and again if the route changes).
    effect(() => {
      if (!this.journal.ready() || !this.content.presets().length) return;
      const id = this.id();
      untracked(() => this.draft.set(id ? this.fromExisting(id) : this.fresh()));
    });
  }

  private fromExisting(id: string): Draft | null {
    const b = this.journal.brewById().get(id);
    if (!b) return null;
    return {
      beanId: b.beanId ?? '',
      method: b.method,
      brewedAt: localInput(new Date(b.brewedAt)),
      coffeeG: b.coffeeG,
      waterG: b.waterG,
      waterTempC: b.waterTempC ?? null,
      grind: b.grind ?? '',
      time: b.totalSec ? formatClock(b.totalSec) : '',
      tds: b.tds ?? null,
      rating: b.rating,
      flavors: [...b.flavors],
      comment: b.comment ?? '',
      fromPostId: b.fromPostId,
    };
  }

  /** New brew: query params first, then the last brew with the same bean/method, then the preset. */
  private fresh(): Draft {
    const method: BrewMethod = isBrewMethod(this.method()) ? (this.method() as BrewMethod) : 'v60';
    const beanId = this.bean() && this.journal.beanById().has(this.bean()!) ? this.bean()! : '';
    const last = this.journal
      .brews()
      .find((b) => b.method === method && (!beanId || b.beanId === beanId));
    const preset = this.content.presetById().get(method);
    const coffeeG = num(this.coffee()) ?? last?.coffeeG ?? preset?.coffee ?? null;
    const sec = num(this.sec());
    return {
      beanId: beanId || last?.beanId || '',
      method,
      brewedAt: localInput(new Date()),
      coffeeG,
      waterG:
        num(this.water()) ??
        last?.waterG ??
        (coffeeG && preset ? Math.round(coffeeG * preset.ratio) : null),
      waterTempC:
        last?.waterTempC ?? (preset ? Math.round((preset.tempC[0] + preset.tempC[1]) / 2) : null),
      grind: last?.grind ?? '',
      time: sec ? formatClock(sec) : '',
      tds: null,
      rating: 3,
      flavors: [],
      comment: '',
      fromPostId: this.post() || undefined,
    };
  }

  protected methodName(m: BrewMethod) {
    return this.i18n.pick(this.content.presetById().get(m)?.name) || m;
  }

  protected patch(p: Partial<Draft>) {
    const d = this.draft();
    if (d) this.draft.set({ ...d, ...p });
    this.error.set('');
  }

  protected async save(e: Event) {
    e.preventDefault();
    const d = this.draft();
    if (!d) return;
    if (!(d.coffeeG && d.coffeeG > 0) || !(d.waterG && d.waterG > 0)) {
      this.error.set(this.i18n.t('brew.needAmounts'));
      return;
    }
    const totalSec = d.time.trim() ? parseClock(d.time) : undefined;
    if (Number.isNaN(totalSec)) {
      this.error.set(this.i18n.t('brew.badTime'));
      return;
    }
    const when = new Date(d.brewedAt);
    await this.journal.saveBrew({
      id: this.id() ?? newId(),
      beanId: d.beanId || undefined,
      method: d.method,
      brewedAt: (Number.isNaN(when.getTime()) ? new Date() : when).toISOString(),
      coffeeG: d.coffeeG,
      waterG: d.waterG,
      waterTempC: d.waterTempC ?? undefined,
      grind: d.grind.trim() || undefined,
      totalSec: totalSec || undefined,
      tds: d.tds ?? undefined,
      rating: d.rating,
      flavors: d.flavors,
      comment: d.comment.trim() || undefined,
      fromPostId: d.fromPostId,
    });
    this.router.navigate(['/brew']);
  }
}
