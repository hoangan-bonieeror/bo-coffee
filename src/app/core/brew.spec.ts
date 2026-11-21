import {
  activeStepIndex,
  beverageEstimate,
  coffeeFor,
  cumulativePours,
  extractionYield,
  formatClock,
  parseBlock,
  parseClock,
  parseRange,
  ratioOf,
  scaleSteps,
  waterFor,
} from './brew';

describe('ratio maths', () => {
  it('converts both ways', () => {
    expect(waterFor(15, 16)).toBe(240);
    expect(coffeeFor(240, 16)).toBe(15);
    expect(coffeeFor(250, 16)).toBe(15.6);
    expect(ratioOf(18, 36)).toBe(2);
    expect(ratioOf(15, 250)).toBe(16.7);
  });

  it('returns 0 for empty or invalid input', () => {
    expect(waterFor(0, 16)).toBe(0);
    expect(coffeeFor(-1, 16)).toBe(0);
    expect(ratioOf(15, NaN)).toBe(0);
  });
});

describe('extraction', () => {
  it('computes extraction yield', () => {
    // 15 g, 250 g water → ~220 g beverage at 1.35% TDS ≈ 19.8%
    expect(beverageEstimate(250, 15)).toBe(220);
    expect(extractionYield(1.35, 220, 15)).toBe(19.8);
    expect(extractionYield(0, 220, 15)).toBe(0);
  });
});

describe('clock', () => {
  it('formats and parses', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(95)).toBe('1:35');
    expect(formatClock(3 * 3600 + 5)).toBe('3:00:05');
    expect(parseClock('1:30')).toBe(90);
    expect(parseClock('45')).toBe(45);
    expect(parseClock('12:00:00')).toBe(43200);
    expect(parseClock('1:x')).toBeNaN();
  });
});

describe('steps', () => {
  const steps = [{ at: 0, pour: 40 }, { at: 40, pour: 80 }, { at: 270 }];

  it('finds the active step', () => {
    expect(activeStepIndex(steps, -1)).toBe(-1);
    expect(activeStepIndex(steps, 0)).toBe(0);
    expect(activeStepIndex(steps, 39)).toBe(0);
    expect(activeStepIndex(steps, 40)).toBe(1);
    expect(activeStepIndex(steps, 999)).toBe(2);
  });

  it('accumulates pours', () => {
    expect(cumulativePours(steps)).toEqual([40, 120, 120]);
  });

  it('scales pours to a new total', () => {
    expect(scaleSteps(steps, 240).map((s) => s.pour)).toEqual([80, 160, undefined]);
    expect(scaleSteps(steps, 0)).toBe(steps);
  });
});

describe('parseBlock', () => {
  it('reads props and steps', () => {
    const b = parseBlock(
      [
        'method: phin',
        'coffee: 20',
        '# comment',
        'step: 0:00 | 40 | Ủ',
        'step: 4:30 | | Xong',
      ].join('\n'),
    );
    expect(b.errors).toEqual([]);
    expect(b.props).toEqual({ method: 'phin', coffee: '20' });
    expect(b.steps).toEqual([
      { at: 0, pour: 40, label: 'Ủ' },
      { at: 270, pour: undefined, label: 'Xong' },
    ]);
  });

  it('reports mistakes instead of throwing', () => {
    const b = parseBlock(
      'method: drip\ncoffee: abc\nstep: 1:00 | 10 | b\nstep: 0:30 | 10 | a\noops',
    );
    expect(b.errors.length).toBe(4);
  });

  it('parses ranges', () => {
    expect(parseRange('14-18')).toEqual([14, 18]);
    expect(parseRange('1.5 – 3')).toEqual([1.5, 3]);
    expect(parseRange('18-14')).toBeNull();
    expect(parseRange('x')).toBeNull();
  });
});
