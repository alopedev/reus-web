// the town chooser (src/towns.ts): every town it offers has a direct train to Barcelona and one back, so neither
// direction of the ticket comes up empty (12-10: Cerbère had ten trains out and none back). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS } from '../../src/towns.ts';
import { NET, PATTERNS } from '../../src/time.ts';

const bcn = new Set(Object.keys(NET.estaciones).filter(id => NET.estaciones[id].barcelona));
const out = new Set<string>(), back = new Set<string>();
// the other Rodalies lines' trains come with the town: one per stopping pattern is enough to know where they go
for(const t of [...NET.trenes, ...PATTERNS]){
  const ids = t.s.map(s => s[0]), at = ids.flatMap((id, i) => bcn.has(id) ? [i] : []);
  if(!at.length) continue;
  ids.slice(at[at.length - 1] + 1).forEach(id => out.add(id));
  ids.slice(0, at[0]).forEach(id => back.add(id));
}

test('every town in the chooser has a direct train from Barcelona and one back', () => {
  for(const g of GROUPS) for(const t of g.towns){
    assert.ok(out.has(t.id), `${t.name} (${g.key}): no direct train from Barcelona`);
    assert.ok(back.has(t.id), `${t.name} (${g.key}): no direct train back to Barcelona`);
  }
});
test('Portbou stays: only Cerbère, past the border, has no train back', () => {
  const ids = GROUPS.flatMap(g => g.towns.map(t => t.id));
  assert.ok(ids.includes('79315'), 'Portbou');
  assert.ok(!ids.includes('79316'), 'Cerbère');
});

// the station sheet says, under each Barcelona station, which lines go from there to the town (08-11: with every
// Rodalies line, «every line but…» named a dozen of them); the other Rodalies lines by their stopping patterns
test('the lines from each Barcelona station to the town, in number order, none where no train goes', async () => {
  const { stationLines } = await import('../../src/towns.ts');
  assert.deepEqual(stationLines('71801', '71400'), ['R14', 'R15']);
  assert.deepEqual(stationLines('78805', '71400'), []);
  assert.deepEqual(stationLines('78805', '79500'), ['R1']);
  assert.deepEqual(stationLines('71802', '79500'), []);
  assert.deepEqual(stationLines('71801', '71700'), ['R2', 'R2S', 'R15', 'R16', 'R17']);
});
