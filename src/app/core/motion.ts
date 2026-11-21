import { DOCUMENT, Injectable, inject } from '@angular/core';

/** Elements that fade/slide in the first time they scroll into view. */
const REVEAL_SELECTOR = [
  '.side-block',
  '.prose > h2',
  '.prose > h3',
  '.prose > p',
  '.prose > ul',
  '.prose > ol',
  '.prose > blockquote',
  '.prose .figure',
  '.prose .code-block',
  '.prose .table-scroll',
  '.prose .callout',
  '.prose .diagram',
  '.brew-block',
  '.method-tile',
  '.post-nav-card',
  '.series-box',
  '.archive-month',
  '.cat-switch',
].join(',');

/**
 * Site-wide motion effects, implemented once with event delegation and observers so pages and
 * components stay free of animation code:
 *  - scroll reveal (IntersectionObserver; new elements are picked up by a MutationObserver)
 *  - a soft warm "aura" of light that follows the pointer
 * Everything is skipped when the user prefers reduced motion or uses touch only.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly doc = inject(DOCUMENT);
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    const win = this.doc.defaultView;
    if (!win || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.doc.documentElement.classList.add('motion');
    this.reveal(win);
    if (win.matchMedia('(hover: hover) and (pointer: fine)').matches) this.aura();
  }

  private reveal(win: Window): void {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const scan = () => {
      this.doc.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset['reveal']) return;
        el.dataset['reveal'] = '1';
        // Already on screen at load → show immediately, no flash of hidden content.
        const r = el.getBoundingClientRect();
        if (r.top < win.innerHeight * 0.92 && r.bottom > 0) {
          el.classList.add('in');
          return;
        }
        el.classList.add('reveal');
        io.observe(el);
      });
    };
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    }).observe(this.doc.body, { childList: true, subtree: true });
    scan();
  }

  private aura(): void {
    const el = this.doc.createElement('div');
    el.className = 'cursor-aura';
    el.setAttribute('aria-hidden', 'true');
    this.doc.body.appendChild(el);
    let x = -500;
    let y = -500;
    let tx = x;
    let ty = y;
    let raf = 0;
    const follow = () => {
      // Ease towards the pointer so the light trails it slightly.
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    this.doc.addEventListener(
      'pointermove',
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        el.classList.add('on');
        if (!raf) raf = requestAnimationFrame(follow);
      },
      { passive: true },
    );
    this.doc.addEventListener('pointerleave', () => el.classList.remove('on'));
  }
}
