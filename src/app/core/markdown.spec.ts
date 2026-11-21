import { renderMarkdown } from './markdown';

describe('renderMarkdown brew blocks', () => {
  it('turns a valid brew block into a placeholder with its parsed spec', () => {
    const r = renderMarkdown(
      '## Steps\n\n```brew-timer\nmethod: phin\nstep: 0:00 | 40 | Bloom\n```\n',
    );
    expect(r.hasBrew).toBe(true);
    const m = r.html.match(/<div class="brew-block" data-kind="timer" data-spec="([^"]+)"><\/div>/);
    expect(m).not.toBeNull();
    const spec = JSON.parse(m![1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    expect(spec.props.method).toBe('phin');
    expect(spec.steps[0]).toEqual({ at: 0, pour: 40, label: 'Bloom' });
    expect(r.toc).toEqual([{ id: 'steps', text: 'Steps', level: 2 }]);
  });

  it('shows a readable error instead of a broken tool', () => {
    const r = renderMarkdown('```brew-calc\nmethod: drip\n```\n');
    expect(r.hasBrew).toBe(false);
    expect(r.html).toContain('brew-error');
    expect(r.html).toContain('unknown method');
  });

  it('escapes block content so it cannot inject HTML', () => {
    const r = renderMarkdown(
      '```brew-timer\nstep: 0:00 | 10 | <img src=x onerror=alert(1)>\n```\n',
    );
    expect(r.html).not.toContain('<img src=x');
  });
});
