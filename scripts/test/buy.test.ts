// the way to Renfe (src/buy.ts): Renfe opens the day's list, drawn after the page loads, and nothing in its address
// picks a train or an hour (tried 13-11: an #anchor is wiped, its hour filter is filled from inside only). So the link
// carries a text mark for the browser itself: the departure as Renfe prints it («18:33 h») followed by the hours
// the trip takes («1 hora 30 minuts», «0 hores 31 minuts»), which tells the train that leaves at 18:33 from the one that arrives then.
// Chrome scrolls to it and marks it; Safari and Firefox open the top of the list, as before. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buyUrl } from '../../src/buy.ts';

const REUS = '71400', SANTS = '71801';
const mark = (url: string) => decodeURIComponent(new URL(url).hash);

test('the link searches the trip and the day, with the fields Renfe needs', () => {
  const u = new URL(buyUrl(SANTS, REUS, '2026-11-16', 18 * 60 + 33, 20 * 60 + 3));
  assert.equal(u.origin + u.pathname, 'https://venta.renfe.com/vol/buscarTren.do');
  assert.equal(u.searchParams.get('cdgoOrigen'), '0071,71801,71801');
  assert.equal(u.searchParams.get('cdgoDestino'), '0071,71400,71400');
  assert.equal(u.searchParams.get('FechaIdaSel'), '16/11/2026');
  for(const [k, v] of Object.entries({ adultos_: '1', ninos_: '0', ninosMenores: '0', tipoBusqueda: 'autocomplete', currenLocation: 'menuBusqueda', vengoderenfecom: 'SI' }))
    assert.equal(u.searchParams.get(k), v, k);
});

test('the link marks the train on Renfe’s list: its departure, followed by the hours it takes', () => {
  assert.equal(mark(buyUrl(SANTS, REUS, '2026-11-16', 18 * 60 + 33, 20 * 60 + 3)), '#:~:text=18:33 h,-1');
  assert.equal(mark(buyUrl(SANTS, '78400', '2026-11-16', 9 * 60 + 3, 11 * 60 + 45)), '#:~:text=09:03 h,-2', 'the hour with its zero, as Renfe prints it');
});

// Renfe prints «0 hores 31 minuts» (Sants → Camp de Tarragona, read on 13-11): the hours come first also when none
test('a trip of less than an hour is told by its zero hours', () => {
  assert.equal(mark(buyUrl(SANTS, '04104', '2026-11-16', 12 * 60, 12 * 60 + 31)), '#:~:text=12:00 h,-0');
});

test('the mark is written so that the address stays one piece: no bare space', () => {
  const url = buyUrl(SANTS, REUS, '2026-11-16', 18 * 60 + 33, 20 * 60 + 3);
  assert.match(url, /#:~:text=18:33%20h,-1$/);
});

test('past midnight Renfe searches the next day, and the hour is the one on the clock', () => {
  const url = buyUrl(SANTS, REUS, '2026-11-16', 24 * 60 + 10, 25 * 60 + 40);
  assert.equal(new URL(url).searchParams.get('FechaIdaSel'), '17/11/2026');
  assert.equal(mark(url), '#:~:text=00:10 h,-1');
});
