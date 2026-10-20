// the weather at home (src/weather.ts): what the window paints, after asking Open-Meteo for the chosen town, with an
// answer, a clock and a timer of the test's own. `npm test`, no browser: check_weather keeps how it looks
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWeather, kind, type Weather } from '../../src/weather.ts';

const REUS = '71400', TORTOSA = '65300', MIN = 60e3;
const code = (n: number) => ({ current: { weather_code: n } });
const land = () => new Promise(r => setTimeout(r, 0));

// Open-Meteo as the test wants it: each ask waits until the test answers it, so two can be in flight
function setup(){
  const t = { now: 0, asks: [] as { town: string, answer: (body: unknown) => void }[], shown: [] as Weather[], timer: null as null | { fn: () => void, ms: number } };
  const ask = (town: string) => new Promise<unknown>(answer => { t.asks.push({ town, answer }); });
  const wait = (fn: () => void, ms: number) => { t.timer = { fn, ms }; return () => { t.timer = null; }; };
  const weather = createWeather(w => { t.shown.push(w); }, { ask, clock: () => t.now, wait, hidden: () => false });
  return { t, weather };
}

test('WMO codes: partly cloudy is fair, fog, drizzle to storms are rain, snow is an overcast sky', () => {
  assert.deepEqual([0, 2, 3, 45, 48, 51, 67, 71, 80, 95].map(kind), ['clear', 'clear', 'cloudy', 'fog', 'fog', 'rain', 'rain', 'cloudy', 'rain', 'rain']);
});

test('it asks for the chosen town and paints what Open-Meteo says', async () => {
  const { t, weather } = setup();
  weather.follow(REUS);
  assert.deepEqual(t.asks.map(a => a.town), [REUS]);
  assert.equal(weather.now(), 'clear');                          // before the answer: fair weather, as always
  t.asks[0].answer(code(61)); await land();
  assert.equal(weather.now(), 'rain');
  assert.deepEqual(t.shown, ['rain']);
});

test('no answer, or one without a code: fair weather', async () => {
  for(const body of [null, {}, { current: {} }, 'Service Unavailable']){
    const { t, weather } = setup();
    weather.follow(REUS); t.asks[0].answer(body); await land();
    assert.equal(weather.now(), 'clear', JSON.stringify(body));
    assert.deepEqual(t.shown, []);
  }
});

test('another town: fair weather at once, and the answer for the town left behind is not painted', async () => {
  const { t, weather } = setup();
  weather.follow(REUS); t.asks[0].answer(code(61)); await land();
  weather.follow(TORTOSA);
  assert.equal(weather.now(), 'clear');
  weather.follow(REUS); weather.follow(TORTOSA);                   // the visitor goes back and forth
  t.asks[1].answer(code(45)); t.asks[2].answer(code(61)); await land();   // Tortosa's first ask, then Reus's
  assert.equal(weather.now(), 'clear');
  t.asks[3].answer(code(45)); await land();
  assert.equal(weather.now(), 'fog');
});

test('the same town: it asks again at most every 15 minutes, and on its own when the time comes', async () => {
  const { t, weather } = setup();
  weather.follow(REUS); t.asks[0].answer(code(3)); await land();
  t.now += 15 * MIN; weather.follow(REUS);
  assert.equal(t.asks.length, 1);
  assert.ok(t.timer && t.timer.ms > 15 * MIN, JSON.stringify(t.timer));
  t.now += t.timer.ms - 15 * MIN; t.timer.fn();
  assert.equal(t.asks.length, 2);
});
