import { NET } from './time';

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

// follow(town) asks for that town's weather when it changes or is older than FRESH, and calls back when the answer
// changes what the window shows; now() is what it shows (check.py reads it)
export function createWeather(onChange: (w: Weather) => void){
  let town = '', shown: Weather = 'clear', asked = 0, req = 0, pending = false;
  async function ask(id: string){
    const ll = NET.estaciones[id]?.ll, mine = ++req;
    if(!ll){ pending = false; show('clear'); return; }
    pending = true; asked = Date.now();
    let w: Weather = 'clear';
    const stop = new AbortController(), timer = setTimeout(() => stop.abort(), WAIT);
    try {
      const res = await fetch(`${URL_}?latitude=${ll[0]}&longitude=${ll[1]}&current=weather_code`, {signal: stop.signal});
      const code = res.ok ? (await res.json())?.current?.weather_code : undefined;
      if(typeof code === 'number') w = kind(code);
    } catch { /* no answer: fair weather */ }
    clearTimeout(timer);
    if(mine !== req) return;   // the visitor chose another town meanwhile: its answer will tell
    pending = false; show(w);
  }
  function show(w: Weather){ if(w !== shown){ shown = w; onChange(w); } }
  return {
    follow(id: string){
      if(id !== town){ town = id; show('clear'); void ask(id); }
      else if(!pending && Date.now() - asked > FRESH) void ask(id);
    },
    now: () => shown,
  };
}
