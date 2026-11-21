import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  BrewMethod,
  BrewStep,
  activeStepIndex,
  cumulativePours,
  formatClock,
  scaleSteps,
} from '../core/brew';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';
import { I18nText } from '../core/models';

interface TimerStep {
  at: number;
  pour?: number;
  label: I18nText | string;
}

type WakeLock = { release(): Promise<void> };

/**
 * Step-by-step brew timer. Steps come from the article block or the method preset; pours are
 * scaled to the chosen amount of water. Beeps and vibrates on each new step, keeps the screen on
 * while running, and hands the finished brew to the journal form.
 */
@Component({
  selector: 'app-brew-timer',
  template: `
    <div class="brew-card timer" [class.running]="running()" [class.big]="big()">
      <header class="brew-card-head">
        <span class="brew-card-kicker">⏱ {{ i18n.t('timer.title') }}</span>
        <strong>{{ methodName() }}</strong>
        <span class="small muted"
          >{{ coffee() }} g · {{ water() }} g {{ isEspresso() ? i18n.t('timer.out') : '' }}</span
        >
        <button
          type="button"
          class="icon-btn timer-expand"
          (click)="big.set(!big())"
          [attr.aria-label]="i18n.t('timer.focus')"
          [title]="i18n.t('timer.focus')"
        >
          {{ big() ? '⤡' : '⤢' }}
        </button>
      </header>

      <div class="timer-face" aria-live="polite">
        <span class="timer-clock">{{ clock() }}</span>
        @if (current(); as c) {
          <span class="timer-now">{{ label(c.label) }}</span>
          @if (c.target) {
            <span class="timer-target"
              >{{ i18n.t('timer.pourTo') }} <strong>{{ c.target }} g</strong></span
            >
          }
        } @else {
          <span class="timer-now muted">{{ i18n.t('timer.ready') }}</span>
        }
        @if (next(); as n) {
          <span class="timer-next small muted"
            >{{ i18n.t('timer.next') }} {{ n.in }} · {{ label(n.label) }}</span
          >
        }
      </div>

      <div class="timer-actions">
        @if (!running()) {
          <button type="button" class="btn" (click)="start()">
            ▶ {{ elapsed() > 0 ? i18n.t('timer.resume') : i18n.t('timer.start') }}
          </button>
        } @else {
          <button type="button" class="btn" (click)="pause()">⏸ {{ i18n.t('timer.pause') }}</button>
        }
        <button type="button" class="btn ghost" (click)="reset()" [disabled]="elapsed() === 0">
          ↺ {{ i18n.t('timer.reset') }}
        </button>
        @if (elapsed() > 0) {
          <button type="button" class="btn ghost" (click)="logBrew()">
            📒 {{ i18n.t('timer.log') }}
          </button>
        }
      </div>

      <ol class="timer-steps">
        @for (s of rows(); track $index; let i = $index) {
          <li [class.done]="i < activeIndex()" [class.active]="i === activeIndex()">
            <span class="timer-step-at">{{ s.atLabel }}</span>
            <span class="timer-step-label">{{ label(s.label) }}</span>
            @if (s.target) {
              <span class="timer-step-target">→ {{ s.target }} g</span>
            }
          </li>
        }
      </ol>
    </div>
  `,
})
export class BrewTimer {
  readonly method = input<BrewMethod>('v60');
  /** Steps from an article block; the preset's steps are used when empty. */
  readonly steps = input<TimerStep[]>([]);
  readonly startCoffee = input<number | undefined>(undefined);
  readonly startWater = input<number | undefined>(undefined);
  readonly postId = input<string | undefined>(undefined);

  protected readonly i18n = inject(I18n);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);

  protected readonly big = signal(false);
  protected readonly running = signal(false);
  protected readonly elapsed = signal(0);
  private startedAt = 0;
  private carried = 0;
  private tick?: ReturnType<typeof setInterval>;
  private wake?: WakeLock;
  private lastStep = -1;
  private audio?: AudioContext;

  private readonly preset = computed(() => this.content.presetById().get(this.method()));
  protected readonly isEspresso = computed(() => this.method() === 'espresso');
  protected readonly methodName = computed(() => this.i18n.pick(this.preset()?.name));
  protected readonly coffee = computed(() => this.startCoffee() ?? this.preset()?.coffee ?? 15);
  protected readonly water = computed(
    () => this.startWater() ?? Math.round(this.coffee() * (this.preset()?.ratio ?? 16)),
  );

  private readonly baseSteps = computed<TimerStep[]>(() =>
    this.steps().length ? this.steps() : ((this.preset()?.steps ?? []) as BrewStep[]),
  );

  protected readonly rows = computed(() => {
    const scaled = scaleSteps(this.baseSteps(), this.water());
    const totals = cumulativePours(scaled);
    return scaled.map((s, i) => ({
      ...s,
      atLabel: formatClock(s.at),
      target: s.pour ? totals[i] : undefined,
    }));
  });

  protected readonly activeIndex = computed(() =>
    this.elapsed() > 0 || this.running() ? activeStepIndex(this.rows(), this.elapsed()) : -1,
  );
  protected readonly current = computed(() => this.rows()[this.activeIndex()]);
  protected readonly next = computed(() => {
    const n = this.rows()[this.activeIndex() + 1];
    return n ? { ...n, in: formatClock(n.at - this.elapsed()) } : null;
  });
  protected readonly clock = computed(() => formatClock(this.elapsed()));

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearInterval(this.tick);
      this.releaseWake();
      this.audio?.close().catch(() => undefined);
    });
  }

  protected label(l: I18nText | string): string {
    return typeof l === 'string' ? l : this.i18n.pick(l);
  }

  protected start() {
    this.startedAt = Date.now();
    this.running.set(true);
    this.lastStep = this.activeIndex();
    this.update();
    this.tick = setInterval(() => this.update(), 250);
    this.requestWake();
  }

  protected pause() {
    this.update();
    this.carried = this.elapsed();
    this.running.set(false);
    clearInterval(this.tick);
    this.releaseWake();
  }

  protected reset() {
    this.pause();
    this.carried = 0;
    this.elapsed.set(0);
    this.lastStep = -1;
  }

  private update() {
    if (!this.running()) return;
    this.elapsed.set(this.carried + Math.floor((Date.now() - this.startedAt) / 1000));
    const idx = this.activeIndex();
    if (idx !== this.lastStep) {
      this.lastStep = idx;
      this.chime();
    }
  }

  /** Short beep + vibration when a new step starts. Silently skipped where unsupported. */
  private chime() {
    try {
      navigator.vibrate?.(200);
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.audio ??= new Ctx();
      const osc = this.audio.createOscillator();
      const gain = this.audio.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.25);
      osc.connect(gain).connect(this.audio.destination);
      osc.start();
      osc.stop(this.audio.currentTime + 0.25);
    } catch {
      /* no audio: fine */
    }
  }

  private requestWake() {
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: 'screen'): Promise<WakeLock> };
    };
    nav.wakeLock
      ?.request('screen')
      .then((w) => (this.wake = w))
      .catch(() => undefined);
  }

  private releaseWake() {
    this.wake?.release().catch(() => undefined);
    this.wake = undefined;
  }

  protected logBrew() {
    this.pause();
    this.router.navigate(['/brew/new'], {
      queryParams: {
        method: this.method(),
        coffee: this.coffee(),
        water: this.water(),
        sec: this.elapsed(),
        post: this.postId() ?? null,
      },
    });
  }
}
