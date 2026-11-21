import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FLAVOR_WHEEL, FlavorFamily } from '../core/flavors';
import { I18n } from '../core/i18n';

interface Arc {
  id: string;
  d: string;
  color: string;
  label: string;
  lx: number;
  ly: number;
  rot: number;
  family: FlavorFamily;
  isFamily: boolean;
}

const CX = 200;
const CY = 200;
const R0 = 46;
const R1 = 112;
const R2 = 196;

function polar(r: number, a: number): [number, number] {
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return (
    `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}` +
    `L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`
  );
}

/** Text runs outward along the radius and is flipped on the left half so it never reads upside down. */
function labelAt(r: number, mid: number): { lx: number; ly: number; rot: number } {
  const [lx, ly] = polar(r, mid);
  let deg = (mid * 180) / Math.PI;
  if (deg > 90 && deg < 270) deg -= 180;
  return { lx, ly, rot: deg };
}

/**
 * Interactive flavor wheel. Read mode: tap a family to read about it.
 * Select mode (journal): tap notes to pick them; chips below mirror the selection for keyboard
 * and screen-reader users.
 */
@Component({
  selector: 'app-flavor-wheel',
  template: `
    <div class="flavor-wheel" [class.selectable]="selectable()">
      <svg viewBox="0 0 400 400" role="img" [attr.aria-label]="i18n.t('flavor.title')">
        @for (a of arcs(); track a.id) {
          <g
            class="fw-seg"
            [class.family]="a.isFamily"
            [class.on]="isOn(a)"
            [class.dim]="dim(a)"
            (click)="tap(a)"
          >
            <path [attr.d]="a.d" [attr.fill]="a.color" />
            <text
              [attr.x]="a.lx"
              [attr.y]="a.ly"
              [attr.transform]="'rotate(' + a.rot + ' ' + a.lx + ' ' + a.ly + ')'"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ a.label }}
            </text>
          </g>
        }
        <circle [attr.cx]="200" [attr.cy]="200" [attr.r]="44" class="fw-hub" />
        <text x="200" y="200" class="fw-hub-text" text-anchor="middle" dominant-baseline="central">
          {{ selectable() ? selected().length : '☕' }}
        </text>
      </svg>

      @if (!selectable()) {
        @if (focusFamily(); as f) {
          <div class="fw-info" [style.--fw]="f.color">
            <strong>{{ i18n.pick(f.name) }}</strong>
            <p>{{ i18n.pick(f.desc) }}</p>
            <p class="small muted">
              @for (n of f.notes; track n.id; let last = $last) {
                {{ i18n.pick(n.name) }}{{ last ? '' : ' · ' }}
              }
            </p>
          </div>
        } @else {
          <p class="small muted center">{{ i18n.t('flavor.hint') }}</p>
        }
      } @else {
        <div class="fw-chips" role="group" [attr.aria-label]="i18n.t('flavor.title')">
          @for (f of families; track f.id) {
            @for (n of f.notes; track n.id) {
              <button
                type="button"
                class="chip"
                [class.on]="selected().includes(n.id)"
                [attr.aria-pressed]="selected().includes(n.id)"
                [style.--fw]="f.color"
                (click)="toggle(n.id)"
              >
                {{ i18n.pick(n.name) }}
              </button>
            }
          }
        </div>
      }
    </div>
  `,
})
export class FlavorWheel {
  readonly selectable = input(false);
  readonly selected = model<string[]>([]);
  /** Families to emphasise in read mode (from the article block). */
  readonly highlight = input<string[]>([]);

  protected readonly i18n = inject(I18n);
  protected readonly families = FLAVOR_WHEEL;
  protected readonly focusFamily = signal<FlavorFamily | null>(null);

  protected readonly arcs = computed<Arc[]>(() => {
    const total = FLAVOR_WHEEL.reduce((n, f) => n + f.notes.length, 0);
    const step = (2 * Math.PI) / total;
    let a = -Math.PI / 2;
    const out: Arc[] = [];
    for (const family of FLAVOR_WHEEL) {
      const a0 = a;
      for (const note of family.notes) {
        const n0 = a;
        const n1 = a + step;
        out.push({
          id: note.id,
          d: arcPath(R1 + 2, R2, n0 + 0.004, n1 - 0.004),
          color: family.color,
          label: this.i18n.pick(note.name),
          ...labelAt((R1 + R2) / 2 + 2, (n0 + n1) / 2),
          family,
          isFamily: false,
        });
        a = n1;
      }
      out.push({
        id: family.id,
        d: arcPath(R0, R1, a0 + 0.006, a - 0.006),
        color: family.color,
        label: this.i18n.pick(family.name),
        ...labelAt((R0 + R1) / 2, (a0 + a) / 2),
        family,
        isFamily: true,
      });
    }
    return out;
  });

  protected isOn(a: Arc): boolean {
    if (this.selectable()) return !a.isFamily && this.selected().includes(a.id);
    return this.focusFamily()?.id === a.family.id || this.highlight().includes(a.family.id);
  }

  protected dim(a: Arc): boolean {
    if (this.selectable()) return false;
    const f = this.focusFamily();
    return !!f && f.id !== a.family.id;
  }

  protected tap(a: Arc) {
    if (this.selectable()) {
      if (!a.isFamily) this.toggle(a.id);
      return;
    }
    this.focusFamily.set(this.focusFamily()?.id === a.family.id ? null : a.family);
  }

  protected toggle(id: string) {
    const s = this.selected();
    this.selected.set(s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }
}
