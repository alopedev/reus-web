import { NET } from './time';
import { createLive, type LiveOptions } from './live';

// the weather at home, now: what the window paints over the chosen town's landscape (08-10, Àlex: raindrops on the
// glass under a grey sky). Open-Meteo, free and keyless, answers from any web page (CORS); when it does not answer
// (offline, or down: it gave a 503 the day it was tried), the window shows fair weather, as it always had
export type Weather = 'clear' | 'cloudy' | 'rain' | 'fog';

// WMO weather codes, as Open-Meteo gives them (open-meteo.com/en/docs): partly cloudy still lets the sun through;
// snow is painted as an overcast sky (there is no snow to paint, and it hardly ever snows on these lines); drizzle,
// showers and storms are rain
export function kind(code: number): Weather {
  if(code <= 2) return 'clear';
  if(code === 45 || code === 48) return 'fog';
  if((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  return 'cloudy';
}

const URL_ = 'https://api.open-meteo.com/v1/forecast';
const FRESH = 15*60e3, WAIT = 6000;

// Open-Meteo, for a town: what it answered, or null (no coordinates in red.json, an error, no answer in WAIT)
export type Ask = (town: string) => Promise<unknown>;
const askOpenMeteo: Ask = async town => {
  const ll = NET.estaciones[town]?.ll;
  if(!ll) return null;
  try {
    const res = await fetch(`${URL_}?latitude=${ll[0]}&longitude=${ll[1]}&current=weather_code`, { signal: AbortSignal.timeout(WAIT) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
};
// what the window paints for an answer: fair weather when it has no code
const read = (body: unknown): Weather => {
  const code = (body as { current?: { weather_code?: unknown } } | null)?.current?.weather_code;
  return typeof code === 'number' ? kind(code) : 'clear';
};
const isWeather = (w: unknown): w is Weather => typeof w === 'string';

// follow(town) asks for that town's weather when it changes, and at most every 15 minutes (live.ts); another town
// is fair weather until its answer comes. onChange runs when what the window shows changes; now() is what it shows
// (check.py reads it)
export function createWeather(onChange: (w: Weather) => void, o: Omit<Partial<LiveOptions<Weather, string>>, 'ask'> & { ask?: Ask } = {}){
  const { ask = askOpenMeteo, ...rest } = o;
  let shown: Weather = 'clear';
  const now = (): Weather => live.answer() ?? 'clear';
  const live = createLive<Weather, string>(() => { const w = now(); if(w !== shown){ shown = w; onChange(w); } },
    { fresh: FRESH, usable: isWeather, ...rest, ask: async town => read(await ask(town)) });
  return { follow: live.follow, now };
}
