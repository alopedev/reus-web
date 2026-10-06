import { addDays } from './time';

// the one place that knows how Renfe's ticket search is reached: if Renfe changes it, only this file changes.
// Renfe's station codes are the GTFS stop_ids: its own list (estacionesEstaticas.js on renfe.com) keys every
// station of red.json as «0071,<stop_id>,<stop_id>». It takes origin, destination and day, not a given train:
// the visitor picks the train on Renfe's list
const SEARCH = 'https://venta.renfe.com/vol/buscarTren.do';
const code = (stop: string) => `0071,${stop},${stop}`;
const day = (iso: string) => iso.split('-').reverse().join('/');

// `iso` is the timetable's day and `dep` the departure in minutes after its midnight: past 24:00 the train leaves
// on the next calendar day, which is the one Renfe searches
export function buyUrl(from: string, to: string, iso: string, dep: number): string {
  const date = day(addDays(iso, Math.floor(dep / 1440)));
  // the fields renfe.com's own search box sends, minus the station names (Renfe and the GTFS spell them differently)
  // and the empty ones. Without the passenger counts, tipoBusqueda and currenLocation Renfe answers E500 to a browser
  // with no Renfe session, and without vengoderenfecom one that already has a session sees its previous search
  // (tried on 06-10-2026 with fresh and reused browsers: Sants → Reus, L'Aldea → Sants, Passeig de Gràcia → Reus)
  const q = new URLSearchParams({
    cdgoOrigen: code(from), cdgoDestino: code(to), FechaIdaSel: date, adultos_: '1', ninos_: '0', ninosMenores: '0',
    tipoBusqueda: 'autocomplete', currenLocation: 'menuBusqueda', vengoderenfecom: 'SI', Idioma: 'es', Pais: 'ES',
  });
  return `${SEARCH}?${q}`;
}
