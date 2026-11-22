import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

interface Wisp {
  x: number;
  phase: number;
  speed: number;
  width: number;
  amp: number;
}

interface BeanDot {
  x: number;
  y: number;
  r: number;
  rot: number;
  vr: number;
  vy: number;
}

/**
 * Quiet animated background: soft steam wisps rising and a few coffee beans drifting.
 * Colours come from CSS variables (--steam, --bean-bg) so light/dark themes follow.
 * Fewer elements on small screens, paused when the tab is hidden, DPR capped at 2,
 * and fully static when the OS asks for reduced motion.
 */
@Component({
  selector: 'app-steam-bg',
  template: `<canvas #c class="steam-bg" aria-hidden="true"></canvas>`,
})
export class SteamBackground {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('c');

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const cleanup = this.run();
      destroy.onDestroy(cleanup);
    });
  }

  private run(): () => void {
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let wisps: Wisp[] = [];
    let beans: BeanDot[] = [];
    let raf = 0;
    let t = 0;
    let steam = '';
    let beanFill = '';
    let beanLine = '';
    let widthScale = 1;

    const css = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = w < 700;
      wisps = Array.from({ length: small ? 3 : 6 }, (_, i) => ({
        x: (w / (small ? 3 : 6)) * (i + 0.5) + (Math.random() - 0.5) * 60,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.25,
        width: 14 + Math.random() * 18,
        amp: 18 + Math.random() * 26,
      }));
      beans = Array.from({ length: small ? 5 : 11 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 7 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.004,
        vy: 0.08 + Math.random() * 0.12,
      }));
    };

    const drawBean = (b: BeanDot, fill: string, line: string) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r, b.r * 0.68, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-b.r * 0.75, 0);
      ctx.bezierCurveTo(-b.r * 0.25, -b.r * 0.35, b.r * 0.25, b.r * 0.35, b.r * 0.75, 0);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    };

    const frame = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      // Re-read theme colours about once a second (cheap, and follows the theme toggle).
      if (t % 60 === 1) {
        steam = css('--steam', 'rgba(255,255,255,.35)');
        beanFill = css('--bean-bg', 'rgba(120,80,50,.08)');
        beanLine = css('--bean-line', 'rgba(120,80,50,.12)');
        widthScale = Number.parseFloat(css('--steam-scale', '1')) || 1;
      }

      for (const b of beans) {
        if (!reduce) {
          b.y -= b.vy;
          b.rot += b.vr;
          if (b.y < -20) {
            b.y = h + 20;
            b.x = Math.random() * w;
          }
        }
        drawBean(b, beanFill, beanLine);
      }

      ctx.lineCap = 'round';
      for (const s of wisps) {
        ctx.beginPath();
        const steps = 28;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps;
          const y = h - k * h * 0.9;
          const x = s.x + Math.sin(k * 5 + s.phase + t * 0.01 * s.speed) * s.amp * (0.4 + k);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const g = ctx.createLinearGradient(0, h, 0, h * 0.1);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.35, steam);
        g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g;
        ctx.lineWidth = s.width * widthScale;
        ctx.globalAlpha = 0.28;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(frame);
    };

    resize();
    frame();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }
}
