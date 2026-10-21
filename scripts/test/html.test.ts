// text that goes into the page's HTML (src/html.ts): one way of escaping it, for an element's text and for an
// attribute in double quotes alike (town names, notices, links). `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../../src/html.ts';

test('the characters HTML reads as markup are written as text', () => {
  assert.equal(esc(`L'Aldea & "Amposta" <R16>`), 'L&#39;Aldea &amp; &quot;Amposta&quot; &lt;R16&gt;');
});

test('everything else stays as it is, the Catalan letters and the typographic apostrophe too', () => {
  assert.equal(esc('Agafo l’R15 de les 18:33 a Sants · Vila-seca, Lleida-Pirineus'), 'Agafo l’R15 de les 18:33 a Sants · Vila-seca, Lleida-Pirineus');
  assert.equal(esc('https://wa.me/?text=a%20b&x=1'), 'https://wa.me/?text=a%20b&amp;x=1');
});
