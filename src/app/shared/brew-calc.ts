import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrewMethod, clamp, coffeeFor, waterFor } from '../core/brew';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';

/**
 * Coffee : water calculator. Used inside articles (```brew-calc) and on the Tools page.
 * Edit the dose or the water and the other follows; drag the ratio to change strength.
 */
@Component({
  selector: 'app-brew-calc',
  imports: [RouterLink],
  template: `
    @if (preset(); as p) {
      <div class="brew-card calc">
        <header class="brew-card-head">
          <span class="brew-card-kicker">{{ p.icon }} {{ i18n.t('calc.title') }}</span>
          <strong>{{ i18n.pick(p.name) }}</strong>
        </header>

        <div class="calc-grid">
          <label class="calc-field">
            <span>{{ i18n.t('calc.coffee') }}</span>
            <span class="calc-input">
              <input
                type="number"
                inputmode="decimal"
                min="1"
                max="2000"
                step="0.5"
                [value]="coffee()"
                (input)="setCoffee($any($event.target).valueAsNumber)"
              />
              <em>g</em>
            </span>
          </label>
          <span class="calc-x" aria-hidden="true">×</span>
          <label class="calc-field">
            <span>{{ i18n.t('calc.ratio') }}</span>
            <span class="calc-ratio">1 : {{ ratio() }}</span>
          </label>
          <span class="calc-x" aria-hidden="true">=</span>
          <label class="calc-field">
            <span>{{ isEspresso() ? i18n.t('calc.yield') : i18n.t('calc.water') }}</span>
            <span class="calc-input">
              <input
                type="number"
                inputmode="decimal"
                min="1"
                max="20000"
                step="1"
                [value]="water()"
                (input)="setWater($any($event.target).valueAsNumber)"
              />
              <em>g</em>
            </span>
          </label>
        </div>

        <label class="calc-slider">
          <span class="small muted">{{ i18n.t('calc.stronger') }}</span>
          <input
            type="range"
            [min]="range()[0]"
            [max]="range()[1]"
            [step]="isEspresso() ? 0.1 : 0.5"
            [value]="ratio()"
            (input)="setRatio($any($event.target).valueAsNumber)"
            [attr.aria-label]="i18n.t('calc.ratio')"
          />
          <span class="small muted">{{ i18n.t('calc.lighter') }}</span>
        </label>

        <dl class="calc-facts">
          <div>
            <dt>{{ i18n.t('calc.temp') }}</dt>
            <dd>{{ p.tempC[0] }}–{{ p.tempC[1] }} °C</dd>
          </div>
          <div>
            <dt>{{ i18n.t('calc.grind') }}</dt>
            <dd>{{ i18n.pick(p.grind) }}</dd>
          </div>
          <div>
            <dt>{{ i18n.t('calc.time') }}</dt>
            <dd>{{ timeLabel() }}</dd>
          </div>
        </dl>
        @if (p.note) {
          <p class="small muted calc-note">{{ i18n.pick(p.note) }}</p>
        }

        <footer class="brew-card-foot">
          <a
            class="btn"
            [routerLink]="['/tools']"
            [queryParams]="{ method: p.id, coffee: coffee(), water: water() }"
            >⏱ {{ i18n.t('calc.openTimer') }}</a
          >
          @if (p.source.length) {
            <span class="small muted"
              >{{ i18n.t('calc.source') }}:
              @for (s of p.source; track s.url; let last = $last) {
                <a [href]="s.url" target="_blank" rel="noopener">{{ s.title }}</a>{{
                  last ? '' : ' · '
                }}
              }
            </span>
          }
        </footer>
      </div>
    }
  `,
})
export class BrewCalc {
  readonly method = input<BrewMethod>('v60');
  /** Optional overrides from the article block */
  readonly startCoffee = input<number | undefined>(undefined);
  readonly startRatio = input<number | undefined>(undefined);
  readonly startRange = input<[number, number] | undefined>(undefined);

  protected readonly i18n = inject(I18n);
  private readonly content = inject(ContentService);

  protected readonly preset = computed(() => this.content.presetById().get(this.method()));
  protected readonly isEspresso = computed(() => this.method() === 'espresso');
  protected readonly range = computed<[number, number]>(
    () => this.startRange() ?? this.preset()?.ratioRange ?? [10, 20],
  );

  protected readonly coffee = linkedSignal(() => this.startCoffee() ?? this.preset()?.coffee ?? 15);
  protected readonly ratio = linkedSignal(() => this.startRatio() ?? this.preset()?.ratio ?? 16);
  /**
   * Water follows the starting values only; edits update it explicitly, so the field the
   * reader is typing in is never rewritten under their cursor.
   */
  protected readonly water = linkedSignal(() =>
    waterFor(
      this.startCoffee() ?? this.preset()?.coffee ?? 15,
      this.startRatio() ?? this.preset()?.ratio ?? 16,
    ),
  );

  protected readonly timeLabel = computed(() => {
    const s = this.preset()?.timeSec ?? 0;
    if (s >= 3600) return `${Math.round(s / 3600)} ${this.i18n.t('unit.hours')}`;
    if (s >= 60) return `~${Math.round(s / 60)} ${this.i18n.t('unit.minutes')}`;
    return `${s} ${this.i18n.t('unit.seconds')}`;
  });

  constructor() {
    // Keep the ratio inside the slider range if an article asks for something odd.
    effect(() => {
      const [lo, hi] = this.range();
      const r = this.ratio();
      if (r < lo || r > hi) this.setRatio(clamp(r, lo, hi));
    });
  }

  protected setCoffee(v: number) {
    if (!(v > 0)) return;
    this.coffee.set(v);
    this.water.set(waterFor(v, this.ratio()));
  }

  protected setWater(v: number) {
    if (!(v > 0)) return;
    this.water.set(v);
    this.coffee.set(coffeeFor(v, this.ratio()));
  }

  protected setRatio(v: number) {
    if (!(v > 0)) return;
    this.ratio.set(v);
    this.water.set(waterFor(this.coffee(), v));
  }
}
