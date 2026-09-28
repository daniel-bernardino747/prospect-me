import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { Box } from './chart';
import { chainDropTargets, collapse, exposureAt, hopIds, layout, type RaioData, stateOf } from './data';
import { type ChartMode, chartLabels, chartState, SIZES } from './scene';

const data = JSON.parse(readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8')) as RaioData;
const clear = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

const STATES = [
  { caso: 'stylelint' },
  { caso: 'stylelint', t: '101055' },
  { caso: 'stylelint', t: '101421' },
  { caso: 'stylelint', t: '093000' },
  { caso: 'got' },
  { caso: 'eslint' },
  { caso: 'stylelint', alvo: 'keyv@5.6.0' },
];

function scene(q: (typeof STATES)[number]) {
  const { g, entries, index, target } = stateOf(data, q);
  const exposure = exposureAt(data, g, entries[index].at);
  const c = collapse(g, target !== null ? [target] : chainDropTargets(data, g));
  const L = layout(g, c);
  const mode: ChartMode = target !== null ? { kind: 'whatif', target } : { kind: 'chaindrop', exposure };
  return { s: chartState(g, L, c, mode, (p) => Boolean(data.malicious[p])), ids: hopIds(L, c.nodes), c };
}

describe('chart labels', () => {
  for (const q of STATES) {
    for (const size of Object.keys(SIZES) as (keyof typeof SIZES)[]) {
      it(`${Object.values(q).join(' ')} at ${SIZES[size]}px: no overlaps, root named, every infected package named or given its ledger id`, () => {
        const { s, ids, c } = scene(q);
        const layer = chartLabels(s, ids, size);
        for (const a of layer.placed) for (const b of layer.placed) if (a !== b) expect(clear(a.box, b.box)).toBe(true);
        expect(layer.placed.some((p) => p.id === 'n0')).toBe(true);
        for (const n of c.nodes.filter((x) => x > 0 && s.nodeKind(x) === 'hit')) {
          const named = layer.placed.find((p) => p.id === `n${n}`);
          const tagged = layer.placed.find((p) => p.id === `k${n}`);
          expect(named ?? tagged).toBeDefined();
          if (tagged) expect(layer.text.get(`k${n}`)).toEqual([ids.get(n)]);
        }
        if (s.nearest) expect(layer.placed.some((p) => p.id === 'front')).toBe(true);
      });
    }
  }

  it('names every infected package on a 340px phone in the default state', () => {
    const { s, ids, c } = scene({ caso: 'stylelint' });
    const layer = chartLabels(s, ids, 'phone');
    for (const n of c.nodes.filter((x) => s.nodeKind(x) === 'hit')) {
      expect(layer.placed.some((p) => p.id === `n${n}`)).toBe(true);
    }
  });
});
