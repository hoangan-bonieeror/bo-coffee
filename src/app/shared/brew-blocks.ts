import { ApplicationRef, ComponentRef, EnvironmentInjector, createComponent } from '@angular/core';
import { BlockSpec, isBrewMethod, parseRange } from '../core/brew';
import { BrewCalc } from './brew-calc';
import { BrewTimer } from './brew-timer';
import { FlavorWheel } from './flavor-wheel';

/**
 * Mounts the interactive coffee tools into the placeholders the Markdown renderer leaves for
 * ```brew-calc, ```brew-timer and ```flavor-wheel blocks. Returns the component refs so the
 * caller can destroy them when the article is re-rendered.
 */
export function mountBrewBlocks(
  root: HTMLElement,
  appRef: ApplicationRef,
  environmentInjector: EnvironmentInjector,
  postId: string,
): ComponentRef<unknown>[] {
  const refs: ComponentRef<unknown>[] = [];
  for (const host of Array.from(root.querySelectorAll<HTMLElement>('.brew-block:not(.ready)'))) {
    host.classList.add('ready');
    let spec: BlockSpec;
    try {
      spec = JSON.parse(host.dataset['spec'] ?? '{}');
    } catch {
      continue;
    }
    const p = spec.props ?? {};
    const method = isBrewMethod(p['method']) ? p['method'] : 'v60';
    const num = (k: string) => (p[k] !== undefined ? Number(p[k]) : undefined);
    const el = document.createElement('div');
    host.replaceChildren(el);

    switch (host.dataset['kind']) {
      case 'calc': {
        const ref = createComponent(BrewCalc, { environmentInjector, hostElement: el });
        ref.setInput('method', method);
        ref.setInput('startCoffee', num('coffee'));
        ref.setInput('startRatio', num('ratio'));
        ref.setInput('startRange', p['range'] ? (parseRange(p['range']) ?? undefined) : undefined);
        refs.push(ref);
        break;
      }
      case 'timer': {
        const ref = createComponent(BrewTimer, { environmentInjector, hostElement: el });
        ref.setInput('method', method);
        ref.setInput('steps', spec.steps ?? []);
        ref.setInput('startCoffee', num('coffee'));
        ref.setInput('startWater', num('water'));
        ref.setInput('postId', postId);
        refs.push(ref);
        break;
      }
      case 'flavor': {
        const ref = createComponent(FlavorWheel, { environmentInjector, hostElement: el });
        ref.setInput(
          'highlight',
          (p['highlight'] ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
        refs.push(ref);
        break;
      }
    }
  }
  for (const r of refs) appRef.attachView(r.hostView);
  return refs;
}
