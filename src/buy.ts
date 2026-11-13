import { addDays } from './time';

// the one place that knows how Renfe's ticket search is reached: if Renfe changes it, only this file changes.
// Renfe's station codes are the GTFS stop_ids: its own list (estacionesEstaticas.js on renfe.com) keys every
// station of red.json as «0071,<stop_id>,<stop_id>». It takes origin, destination and day, not a given train:
// the visitor picks the train on Renfe's list. Nothing in the address picks it for them (tried 13-11-2026): the list is
// drawn after the page loads and the page rewrites its own address, so an #anchor to a row is wiped; its hour filter
// is filled from inside only. What does reach the train is the browser's own text mark (`mark`)
const SEARCH = 'https://venta.renfe.com/vol/buscarTren.do';
const code = (stop: string) => `0071,${stop},${stop}`;
const day = (iso: string) => iso.split('-').reverse().join('/');

const two = (n: number) => String(n).padStart(2, '0');

// a text mark (a «text fragment»: the browser looks for these words once the page is there, scrolls to them and
// marks them): the departure as Renfe's list prints it, «18:33 h», and right after it the hours the trip takes, the
// first number of «1 hora 30 minuts» or «0 hores 31 minuts», which is what tells the train that leaves at 18:33 from
// an earlier one that arrives at 18:33 (whose hour is followed by its price). Chrome and Edge do it, also on Android;
// Safari drops the mark when Renfe rewrites its address and Firefox does not wait for the list: both open the top of
// the list, as before. If Renfe's hours are not ours, nothing matches and nothing is lost
function mark(dep: number, arr: number): string {
  const clock = (dep % 1440 + 1440) % 1440, takes = arr - dep;
  return `#:~:text=${two(Math.floor(clock / 60))}:${two(clock % 60)}%20h,-${Math.floor(takes / 60)}`;
}

// `iso` is the timetable's day and `dep` and `arr` the departure and the arrival in minutes after its midnight: past
// 24:00 the train leaves on the next calendar day, which is the one Renfe searches
export function buyUrl(from: string, to: string, iso: string, dep: number, arr: number): string {
  const date = day(addDays(iso, Math.floor(dep / 1440)));
  // the fields renfe.com's own search box sends, minus the station names (Renfe and the GTFS spell them differently)
  // and the empty ones. Without the passenger counts, tipoBusqueda and currenLocation Renfe answers E500 to a browser
  // with no Renfe session, and without vengoderenfecom one that already has a session sees its previous search
  // (tried on 06-10-2026 with fresh and reused browsers: Sants → Reus, L'Aldea → Sants, Passeig de Gràcia → Reus)
  const q = new URLSearchParams({
    cdgoOrigen: code(from), cdgoDestino: code(to), FechaIdaSel: date, adultos_: '1', ninos_: '0', ninosMenores: '0',
    tipoBusqueda: 'autocomplete', currenLocation: 'menuBusqueda', vengoderenfecom: 'SI', Idioma: 'ca', Pais: 'ES',
  });
  return `${SEARCH}?${q}${mark(dep, arr)}`;
}
