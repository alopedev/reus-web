// the town chooser's search (option B, Àlex 08-11: write the town, the lines below): whoever lives anywhere in
// Catalonia knows their town's name, not always its line. `find` (src/find.ts) reads what is typed the forgiving way —
// no accents, no capitals, any word of the name — over `TOWNS` (src/towns.ts), every town the chooser offers, once.
// Against the frozen timetable. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { find, marks } from '../../src/find.ts';
import { GROUPS, TOWNS } from '../../src/towns.ts';

const names = (q: string) => find(q, TOWNS).map(t => t.name);

test('every town of the lines is there to be found, once, with all its lines and its comarca', () => {
  const ids = new Set(GROUPS.flatMap(g => g.towns.map(t => t.id)));
  assert.deepEqual(new Set(TOWNS.map(t => t.id)), ids);
  assert.equal(TOWNS.length, ids.size);
  const vicenc = TOWNS.find(t => t.name === 'Sant Vicenç de Calders')!;
  assert.deepEqual(vicenc.lines, ['R2', 'R2S', 'R4', 'R13', 'R14', 'R15', 'R16', 'R17']);
  assert.equal(vicenc.comarca, 'Baix Penedès');
});
test('the start of a name finds it, in alphabetical order', () => {
  assert.deepEqual(names('vila'), ['Vila-seca', 'Vilabella', 'Viladecans', 'Viladecavalls', 'Vilafranca del Penedès', 'Vilajuïga',
    'Vilamalla', 'Vilanova i la Geltrú', 'Vilassar de Mar', 'Cabrera de Mar-Vilassar de Mar', 'Castellbell i el Vilar-Monist Montserrat']);
});
test('no accents and no capitals are needed', () => {
  assert.deepEqual(names('MORA'), ['Móra la Nova']);
  assert.deepEqual(names('vilajuiga'), ['Vilajuïga']);
  assert.deepEqual(names('Ascó'), names('asco'));
});
test('any word of the name finds it, the names that start with it first', () => {
  assert.deepEqual(names('hospitalet'), ['L\'Hospitalet de l\'Infant', 'L\'Hospitalet de Llobregat']);
  assert.deepEqual(names('tortosa'), ['Tortosa', 'L\'Aldea-Amposta-Tortosa']);
  assert.deepEqual(names('l’hosp'), ['L\'Hospitalet de l\'Infant', 'L\'Hospitalet de Llobregat']);
});
test('several words narrow it down', () => {
  assert.deepEqual(names('sant cel'), ['Sant Celoni']);
  assert.deepEqual(names('  sant   cel '), ['Sant Celoni']);
});
test('nothing typed, or nothing like it, finds nothing', () => {
  assert.deepEqual(names(''), []);
  assert.deepEqual(names('   '), []);
  assert.deepEqual(names('matadepera'), []);
});
test('what was typed is marked in each name found, word by word', () => {
  assert.deepEqual(marks('Vila-seca', 'vila'), [[0, 4]]);
  assert.deepEqual(marks('Móra la Nova', 'MORA'), [[0, 4]]);
  assert.deepEqual(marks('L\'Aldea-Amposta-Tortosa', 'tortosa'), [[16, 23]]);
  assert.deepEqual(marks('Sant Celoni', 'sant cel'), [[0, 4], [5, 8]]);
  assert.deepEqual(marks('Reus', ''), []);
});
