import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BrewMethod, beverageEstimate, extractionYield, isBrewMethod } from '../core/brew';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';
import { BrewCalc } from '../shared/brew-calc';
import { BrewTimer } from '../shared/brew-timer';
import { FlavorWheel } from '../shared/flavor-wheel';

/** Gold Cup zone for filter coffee (SCA): 1.15–1.35 % TDS, 18–22 % extraction. */
const TDS_ZONE: [number, number] = [1.15, 1.35];
const EY_ZONE: [number, number] = [18, 22];

@Component({
  selector: 'app-tools',
  imports: [BrewCalc, BrewTimer, FlavorWheel],
  template: `
    <header class="page-head">
      <h1>⏱ {{ i18n.t('tools.title') }}</h1>
      <p class="muted">{{ i18n.t('tools.subtitle') }}</p>
    </header>

    <nav class="method-tabs" role="tablist" [attr.aria-label]="i18n.t('tools.method')">
      @for (p of content.presets(); track p.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="p.id === current()"
          [class.on]="p.id === current()"
          (click)="pick(p.id)"
        >
          {{ p.icon }} {{ i18n.pick(p.name) }}
        </button>
      }
    </nav>

    @if (content.presets().length) {
      <div class="tools-grid">
        @for (m of [current()]; track m) {
          <app-brew-calc [method]="m" [startCoffee]="coffeeNum()" />
          <app-brew-timer [method]="m" [startCoffee]="coffeeNum()" [startWater]="waterNum()" />
        }
      </div>
    }

    <section class="card ey-card">
      <h2>🔬 {{ i18n.t('ey.title') }}</h2>
      <p class="small muted">{{ i18n.t('ey.intro') }}</p>
      <div class="ey-grid">
        <label class="calc-field">
          <span>{{ i18n.t('ey.tds') }}</span>
          <span class="calc-input"
            ><input
              type="number"
              step="0.01"
              min="0"
              inputmode="decimal"
              [value]="tds()"
              (input)="tds.set($any($event.target).valueAsNumber)"
            /><em>%</em></span
          >
        </label>
        <label class="calc-field">
          <span>{{ i18n.t('calc.coffee') }}</span>
          <span class="calc-input"
            ><input
              type="number"
              step="0.1"
              min="0"
              inputmode="decimal"
              [value]="eyCoffee()"
              (input)="eyCoffee.set($any($event.target).valueAsNumber)"
            /><em>g</em></span
          >
        </label>
        <label class="calc-field">
          <span>{{ i18n.t('ey.beverage') }}</span>
          <span class="calc-input"
            ><input
              type="number"
              step="1"
              min="0"
              inputmode="decimal"
              [value]="beverage()"
              (input)="beverage.set($any($event.target).valueAsNumber)"
            /><em>g</em></span
          >
        </label>
      </div>
      <div class="ey-result" [class]="'ey-result ' + verdict().cls">
        <strong>{{ ey() || '–' }} %</strong>
        <span>{{ verdict().text }}</span>
      </div>
      <div class="ey-bar" aria-hidden="true">
        <span class="ey-zone" [style.left.%]="zoneLeft" [style.width.%]="zoneWidth"></span>
        @if (ey()) {
          <span class="ey-mark" [style.left.%]="markLeft()"></span>
        }
      </div>
      <p class="small muted">
        {{ i18n.t('ey.zone') }} ·
        <a
          href="https://www.seattlecoffeegear.com/blogs/learning-center/achieving-the-gold-cup-standard-your-guide-to-brewing-excellence"
          target="_blank"
          rel="noopener"
          >SCA Gold Cup</a
        >
      </p>
    </section>

    <section class="card">
      <h2>🎨 {{ i18n.t('flavor.title') }}</h2>
      <app-flavor-wheel />
    </section>
  `,
})
export class ToolsPage {
  /** Query params (?method=phin&coffee=20&water=120) bound by the router. */
  readonly method = input<string | undefined>(undefined);
  readonly coffee = input<string | undefined>(undefined);
  readonly water = input<string | undefined>(undefined);

  protected readonly i18n = inject(I18n);
  protected readonly content = inject(ContentService);
  private readonly router = inject(Router);

  protected readonly current = computed<BrewMethod>(() => {
    const m = this.method();
    return isBrewMethod(m) ? m : 'v60';
  });
  protected readonly coffeeNum = computed(() => {
    const n = Number(this.coffee());
    return n > 0 ? n : undefined;
  });
  protected readonly waterNum = computed(() => {
    const n = Number(this.water());
    return n > 0 ? n : undefined;
  });

  // Extraction calculator
  protected readonly tds = signal(1.3);
  protected readonly eyCoffee = linkedSignal(
    () => this.coffeeNum() ?? this.content.presetById().get(this.current())?.coffee ?? 15,
  );
  protected readonly beverage = linkedSignal(() => {
    const p = this.content.presetById().get(this.current());
    const coffee = this.eyCoffee();
    const water = this.waterNum() ?? Math.round(coffee * (p?.ratio ?? 16));
    return this.current() === 'espresso' ? water : beverageEstimate(water, coffee);
  });
  protected readonly ey = computed(() =>
    extractionYield(this.tds(), this.beverage(), this.eyCoffee()),
  );
  protected readonly verdict = computed(() => {
    const e = this.ey();
    if (!e) return { cls: '', text: '' };
    if (e < EY_ZONE[0]) return { cls: 'low', text: this.i18n.t('ey.under') };
    if (e > EY_ZONE[1]) return { cls: 'high', text: this.i18n.t('ey.over') };
    const t = this.tds();
    if (t < TDS_ZONE[0]) return { cls: 'ok', text: this.i18n.t('ey.weak') };
    if (t > TDS_ZONE[1]) return { cls: 'ok', text: this.i18n.t('ey.strong') };
    return { cls: 'ok', text: this.i18n.t('ey.balanced') };
  });
  // Bar spans 14–26 % extraction.
  protected readonly zoneLeft = ((EY_ZONE[0] - 14) / 12) * 100;
  protected readonly zoneWidth = ((EY_ZONE[1] - EY_ZONE[0]) / 12) * 100;
  protected readonly markLeft = computed(() =>
    Math.min(100, Math.max(0, ((this.ey() - 14) / 12) * 100)),
  );

  protected pick(method: BrewMethod) {
    this.router.navigate(['/tools'], { queryParams: { method }, replaceUrl: true });
  }
}
