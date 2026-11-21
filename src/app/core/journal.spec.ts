import {
  Bean,
  BrewLog,
  brewsToCsv,
  daysSinceRoast,
  gramsLeft,
  parseBackup,
  statsByMethod,
  topFlavors,
} from './journal';

const bean: Bean = {
  id: 'b1',
  name: 'Ethiopia Guji, natural',
  bagGrams: 250,
  archived: false,
  created: '2026-11-01T00:00:00Z',
};

const brew = (over: Partial<BrewLog>): BrewLog => ({
  id: Math.random().toString(36),
  method: 'v60',
  brewedAt: '2026-11-20T08:00:00Z',
  coffeeG: 15,
  waterG: 240,
  rating: 4,
  flavors: [],
  ...over,
});

describe('journal helpers', () => {
  it('counts days since roast in local days', () => {
    expect(daysSinceRoast('2026-11-10', new Date(2026, 10, 21, 23, 0))).toBe(11);
    expect(daysSinceRoast(undefined)).toBeNull();
    expect(daysSinceRoast('11/10/2026')).toBeNull();
  });

  it('tracks grams left in a bag', () => {
    const brews = [brew({ beanId: 'b1' }), brew({ beanId: 'b1' }), brew({ beanId: 'other' })];
    expect(gramsLeft(bean, brews)).toBe(220);
    expect(gramsLeft({ ...bean, bagGrams: 20 }, brews)).toBe(0);
    expect(gramsLeft({ ...bean, bagGrams: undefined }, brews)).toBeNull();
  });

  it('summarises by method and flavor', () => {
    const brews = [
      brew({ method: 'phin', rating: 5, flavors: ['dark-chocolate', 'caramel'] }),
      brew({ method: 'phin', rating: 3, flavors: ['smoky'] }),
      brew({ method: 'v60', rating: 4, flavors: ['jasmine', 'caramel'] }),
    ];
    expect(statsByMethod(brews)).toEqual([
      { method: 'phin', count: 2, avgRating: 4 },
      { method: 'v60', count: 1, avgRating: 4 },
    ]);
    expect(topFlavors(brews)).toEqual([
      { id: 'caramel', count: 2 },
      { id: 'dark-chocolate', count: 1 },
      { id: 'jasmine', count: 1 },
    ]);
  });

  it('exports CSV with escaping and the bean name', () => {
    const csv = brewsToCsv([brew({ beanId: 'b1', comment: 'sweet, "juicy"' })], [bean]);
    const [head, row] = csv.trim().split('\n');
    expect(head.startsWith('brewed_at,method,bean')).toBe(true);
    expect(row).toContain('"Ethiopia Guji, natural"');
    expect(row).toContain('16');
    expect(row).toContain('"sweet, ""juicy"""');
  });

  it('validates backups', () => {
    const good = JSON.stringify({
      app: 'bo-coffee',
      schemaVersion: 1,
      beans: [bean, { nope: true }],
      brews: [brew({ rating: 9 as 5 }), { id: 'x', method: 'drip', coffeeG: 1, waterG: 1 }],
    });
    const parsed = parseBackup(good);
    expect(parsed.beans.length).toBe(1);
    expect(parsed.brews.length).toBe(1);
    expect(parsed.brews[0].rating).toBe(5);
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup('{"app":"other","beans":[],"brews":[]}')).toThrow();
    expect(() =>
      parseBackup('{"app":"bo-coffee","schemaVersion":99,"beans":[],"brews":[]}'),
    ).toThrow();
  });
});
