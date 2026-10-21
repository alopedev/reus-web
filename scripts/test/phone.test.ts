// what a phone is (src/phone.ts): the stacked hero, the phone's board and its sheet, the landscape painted twice as
// fine. One query, written once in the TypeScript, and the CSS copies of it read the same: before, 13 places wrote
// their own, and the landscape of a phone held sideways was painted with a desktop's grain. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PHONE, UPRIGHT, SIDEWAYS } from '../../src/phone.ts';

const src = new URL('../../src/', import.meta.url);
const read = (f: string) => readFileSync(new URL(f, src), 'utf8');
const queries = (css: string) => [...css.matchAll(/@media ([^{]+)\{/g)].map(m => m[1].trim());

test('a phone is upright (narrow, or a portrait tablet) or held sideways', () => {
  assert.equal(PHONE, `${UPRIGHT}, ${SIDEWAYS}`);
  assert.equal(UPRIGHT, '(max-width:700px), (max-aspect-ratio:4/5)');
  assert.equal(SIDEWAYS, '(orientation:landscape) and (max-height:500px)');
});

test('the hero stacks for a phone, and a phone held sideways adds its two columns', () => {
  const hero = queries(read('styles/hero.css'));
  assert.ok(hero.includes(PHONE), 'hero.css: the stacked hero is the phone query');
  assert.ok(hero.includes(SIDEWAYS), 'hero.css: a phone held sideways has its own two columns');
});

test('the chooser goes to one column only upright: held sideways it keeps three, which fit a low screen (Àlex 21-10)', () => {
  assert.ok(queries(read('styles/chooser.css')).includes(UPRIGHT));
});

test('no TypeScript module writes its own phone query: it imports PHONE', () => {
  const own = readdirSync(src).filter(f => f.endsWith('.ts') && f !== 'phone.ts')
    .filter(f => /max-width:700px|max-aspect-ratio:4\/5|max-height:500px/.test(read(f)));
  assert.deepEqual(own, []);
});
