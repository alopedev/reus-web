// the town chooser (src/towns.ts): every town it offers has a direct train to Barcelona and one back, so neither
// direction of the ticket comes up empty (12-10: Cerbère had ten trains out and none back). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS } from '../../src/towns.ts';
import { NET } from '../../src/time.ts';

const bcn = new Set(Object.keys(NET.estaciones).filter(id => NET.estaciones[id].barcelona));
const out = new Set<string>(), back = new Set<string>();
for(const t of NET.trenes){
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
