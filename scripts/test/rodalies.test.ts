// every Rodalies line in the web (Àlex 08-11: that it serves anyone who lives in Catalonia). data/rodalies.json is 80 kB
// with gzip, too much for every visit: the build splits it (src/split.ts) into a small index that goes with the page
// (the stations and one train per stopping pattern, for the town chooser) and one file per town with the trains that
// stop there, fetched only when that town is chosen and added to the network (addPart in src/time.ts). Against the
// frozen timetable: scripts/baseline/rodalies.json, the same days as scripts/baseline/red.json. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { split } from '../../src/split.ts';
import { NET, addPart, direct, dayData, BCN, SANTS, type Network } from '../../src/time.ts';
import { GROUPS, TOWNS } from '../../src/towns.ts';
import { find } from '../../src/find.ts';

const rod = JSON.parse(readFileSync('scripts/baseline/rodalies.json', 'utf8')) as Network;
const { index, towns } = split(rod);
const MATARO = '79500', BLANES = '79606', VILANOVA = '71700', CATALUNYA = '78805';

test('the index keeps every station and one train per stopping pattern, without days', () => {
  assert.deepEqual(Object.keys(index.estaciones).sort(), Object.keys(rod.estaciones).sort());
  const shape = (t: { p: string, s: [string, number, number][] }) => t.p + ':' + t.s.map(x => x[0]).join(',');
  assert.equal(new Set(index.patrons.map(shape)).size, index.patrons.length);
  assert.deepEqual(new Set(index.patrons.map(shape)), new Set(rod.trenes.map(shape)));
  assert.ok(index.patrons.length < rod.trenes.length / 5, `${index.patrons.length} patterns`);
});

test('a town\'s file has every train that stops there, on its days, and nothing for a Barcelona station', () => {
  const mataro = towns[MATARO];
  const stops = rod.trenes.flatMap((t, i) => t.s.some(x => x[0] === MATARO) ? [i] : []);
  assert.equal(mataro.t.length, stops.length);
  for(const [day, ids] of Object.entries(rod.dias))
    assert.deepEqual((mataro.dias[day] ?? []).map(j => stops[j]).sort((a, b) => a - b), ids.filter(i => stops.includes(i)).sort((a, b) => a - b), day);
  assert.equal(towns[SANTS], undefined);
  assert.equal(towns[CATALUNYA], undefined);
});

test('the chooser offers the Rodalies towns before their trains arrive, under their lines', () => {
  assert.ok(TOWNS.some(t => t.id === MATARO), 'Mataró is a town');
  assert.deepEqual(TOWNS.find(t => t.id === MATARO)!.lines, ['R1']);
  assert.deepEqual(find('matar', TOWNS).map(t => t.name), ['Mataró']);
  const r1 = GROUPS.find(g => g.lines.includes('R1'))!;
  const order = r1.towns.map(t => t.id);
  assert.ok(order.indexOf(MATARO) < order.indexOf(BLANES), 'Mataró before Blanes, going out of Barcelona');
  assert.ok(TOWNS.find(t => t.id === VILANOVA)!.lines.includes('R2S'), 'Vilanova has its R2 Sud too');
});

test('Plaça de Catalunya is a Barcelona station, after Sants, Passeig de Gràcia and França, «Catalunya» on the ticket', () => {
  assert.deepEqual(BCN.map(s => s.short), ['Sants', 'Gràcia', 'França', 'Catalunya']);
  assert.equal(BCN[3].id, CATALUNYA);
});

test('a town\'s trains join the network once its file comes, and twice changes nothing', () => {
  const day = '2026-09-29';
  assert.deepEqual(direct(day, SANTS, MATARO), []);
  addPart(towns[MATARO]);
  const once = direct(day, SANTS, MATARO);
  assert.ok(once.length > 20, `${once.length} trains from Sants to Mataró`);
  assert.ok(once.every(t => t[3] === 'R1'));
  addPart(towns[MATARO]);
  addPart(towns[BLANES]);   // Blanes shares most of its trains with Mataró
  assert.deepEqual(direct(day, SANTS, MATARO), once);
  assert.ok(direct(day, CATALUNYA, MATARO).length > 20, 'from Plaça de Catalunya too');
  assert.equal(new Set(NET.trenes).size, NET.trenes.length);
});

test('a town on a regional line and a Rodalies line gets both on its board', () => {
  const day = '2026-09-29', before = dayData(day, VILANOVA).d.r.length;
  addPart(towns[VILANOVA]);
  const after = dayData(day, VILANOVA).d.r;
  assert.ok(after.length > before + 20, `${before} → ${after.length}`);
  assert.ok(after.some(t => t[3] === 'R2S') && after.some(t => t[3].startsWith('R1')));
});

test('on the big train\'s route a Rodalies stop keeps a name of its own: Montgat-Nord is not Montgat, Plaça de Catalunya is «Catalunya»', async () => {
  const { stopName } = await import('../../src/time.ts');
  assert.equal(stopName('79406'), 'Montgat-Nord');
  assert.equal(stopName(CATALUNYA), 'Catalunya');
  assert.equal(stopName('78804'), 'Arc de Triomf');
  assert.equal(stopName('78707'), 'Montcada i Reixac-Santa Maria');
  assert.equal(stopName('71502'), 'Altafulla');
});

test('a line that crosses Barcelona keeps each side whole: the R4 from Manresa and from Martorell, never one town of each in turn', () => {
  const r4 = GROUPS.find(g => g.lines.includes('R4'))!.towns;
  const side = (id: string) => r4.find(t => t.id === id)!.side;
  assert.notEqual(side('78600'), side('72209'));
  const sides = r4.map(t => t.side);
  assert.deepEqual(sides, [...sides].sort((a, b) => a - b), 'one side, then the other');
  assert.equal(GROUPS.find(g => g.lines.includes('R13'))!.towns.every(t => t.side === 0), true);
});
