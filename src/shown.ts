import type { ViewState } from './state';
import type { Trip } from './detail';
import { addDays, hhmm, dur, dayData, NET, BCN, bcnName, CAMP, stopsBetween, stopName, type Train } from './time';
import { buyUrl } from './buy';
import { homeText } from './home';
import { ofPlace, atPlace } from './ca';
import { LINE } from './towns';
import { lineNews, type Avisos } from './avisos';
import type { Retards } from './retards';

// which train the hero shows, and every word that follows from it: the one place that decides; timetable.ts only
// paints what comes out. Pure: the moment, the visitor's choice and what is known of the notices go in, plain data
// comes out (scripts/test/ runs it in Node against the frozen timetable)

// a train on the ruler: today's, regionals and AVE together in order of departure; `on` is the train shown
export type Mark = { dep: number, ave: boolean, on: boolean };
// one trip of the board: the train shown (big) and the one after it
// (`day`: the trip's own day, today's or tomorrow's, so that picking it keeps it)
// where the train shown is now, by the timetable: how far along its trip (0 at departure, 1 at arrival) and in words
export type Where = { at: number, words: string };
// what Renfe's real-time feed says of the train shown (10-10, Àlex: option A, the time corrected; on time says nothing)
// late (2 min or more: a minute is on time), cancelled, or unknown: due within the hour and not in the feed yet, or
// Renfe not answering, so a silence is never read as «on time»
export type Live = { kind: 'late', min: number, dep: number, arr: number } | { kind: 'cancel' } | { kind: 'unknown' };
const SOON = 60;   // a train enters Renfe's feed only once it runs: further away than this, nothing is expected yet
export type Row = { dep: number, arr: number, line: string, ave: boolean, big: boolean, until: string, morrow: boolean, day: string, live?: Live };
interface Common {
  key: string; say: string;          // #aviso: what a screen reader hears, only when `key` changes
  label: string; note: string;       // #lbl, #note
  knob: number | null;               // the ruler's value; null stands on now
  valuetext: string;                 // and its words
  light: number;                     // the minute the landscape and the table are lit for
  day: string;                       // the day of the train shown: the stub's printed date
  ruler: Mark[];
}
export type Shown = Common & ({ kind: 'none' } | {
  kind: 'train', ave: boolean, rows: Row[], buy: string, stops: [stop: string, arr: number][] | null,
  trip: Trip,                        // the train's sheet on a phone
  where: Where | null,               // where it is now, by the timetable; null when it is not on its way
  lines: string[],                   // the board's regional lines, whose notices go on the stamp
});

const NO_LIVE: Pick<Retards, 'train'> = { train: () => undefined };
export function shown(now: { date: string, min: number }, v: ViewState, avisos: Pick<Avisos, 'line' | 'read'>, retards = NO_LIVE): Shown {
  const start = v.useNow ? now.min : v.minute ?? now.min;
  const ida = v.dir === 'casa';
  const townName = NET.estaciones[v.town].nombre, bcn = bcnName(v.station);
  const from = ida ? bcn : townName, to = ida ? townName : `Barcelona ${bcn}`;
  let {d, exact} = dayData(now.date, v.town, v.station);
  const today = [...(ida ? d.r : d.b).map(t => ({t, ave:false})), ...(ida ? d.ar : d.ab).map(t => ({t, ave:true}))].sort((x, y) => x.t[0]-y.t[0]);
  const stillToLeave = (t: Train, from: string): boolean => {
    const k = retards.train(t[2]);
    if(k?.estat !== 'circula' || k.retard < 2 || t[0] + k.retard < start + 2) return false;
    const order = NET.trenes.find(x => x.n === t[2])?.s.map(x => x[0]) ?? [], at = order.indexOf(k.parada);
    return at >= 0 && at <= order.indexOf(from);
  };
  const after = (list: Train[]) => list.filter(([dep]) => dep >= start + (v.useNow?2:0));
  let regs = after(ida ? d.r : d.b), aves = after(ida ? d.ar : d.ab), tomorrow = false, nextDay = false;
  // a late regional whose time has gone but that has not reached your station yet is still the next one (Renfe's
  // feed: its next stop comes before yours, or is yours)
  if(v.useNow) regs = [...(ida ? d.r : d.b).filter(t => !regs.includes(t) && stillToLeave(t, ida ? v.station : v.town)), ...regs];
  // no regional left today: tomorrow's first ones, after the AVE still to come today, if there is one
  let lastAve = regs.length ? undefined : aves[0];
  if(!regs.length){ ({d, exact} = dayData(addDays(now.date,1), v.town, v.station)); nextDay = true; regs = ida ? d.r : d.b; aves = ida ? d.ar : d.ab; tomorrow = !lastAve; }
  // one of tomorrow's trips picked on the board: that train, on its own day (past midnight its day is today, and it is
  // chosen like any other). The ruler is today's, so it stands on now, as with tomorrow's first trains
  let morrowLabel = '';
  const picked = !v.useNow && !!v.day && v.day > now.date;
  if(picked){
    // the label says what is left today, from now (the board only offers tomorrow's trips when no regional is)
    const left = (ave: boolean) => today.some(x => x.ave === ave && x.t[0] >= now.min + 2);
    morrowLabel = left(false) ? 'Demà' : left(true) ? 'Avui ja no queden regionals · demà' : 'Avui ja no en queden · demà';
    ({d, exact} = dayData(v.day!, v.town, v.station)); nextDay = true;
    regs = after(ida ? d.r : d.b); aves = after(ida ? d.ar : d.ab); lastAve = undefined; tomorrow = true;
  }
  const note = exact ? '' : `Horari aproximat: ${nextDay ? 'demà' : 'avui'} encara no hi ha horari oficial.`;
  const clamp = (m: number) => Math.min(1439, Math.max(300, m));
  // safety net (decision 3): no direct train at all today nor tomorrow in this direction. Only reachable for a
  // town whose only trains run on days the frozen or newly-generated timetable does not cover
  if(!lastAve && !regs.length && !aves.length){
    const said = noTrain(v, from, to, now.date);
    return { kind: 'none', key: 'none' + v.station + v.town + v.dir, say: said, label: said, note, knob: clamp(now.min),
      valuetext: 'sense tren directe avui ni demà', light: now.min, day: now.date, ruler: today.map(({t, ave}) => ({dep: t[0], ave, on: false})) };
  }
  // the train shown: the one chosen, or the first to leave, regional or AVE (today's last AVE when no regional is
  // left); the board adds the one after it
  const ave = lastAve ?? aves[0];
  const isAve = !!lastAve || (!!ave && (!regs.length || ave[0] < regs[0][0] || (!v.useNow && (!tomorrow || picked) && v.ave && ave[0] === start)));
  const a = isAve ? ave : regs[0];
  const live = v.useNow && !tomorrow;
  const day = tomorrow ? addDays(now.date, 1) : now.date;
  // two trips: the train shown and the one after it, regional or AVE (after today's last AVE, tomorrow's first)
  const next = lastAve ? regs[0] : [...regs, ...aves].filter(t => t !== a && t[0] >= a[0]).sort((x, y) => x[0]-y[0])[0];
  const isAveTrip = (t: Train) => aves.includes(t) || t === lastAve;
  // the delay Renfe gives for the train shown, only for today's (the feed knows the trains running now)
  const liveOf = (t: Train): Live | undefined => {
    if(day !== now.date) return undefined;
    const k = retards.train(t[2]);
    if(!k) return undefined;
    if(k.estat === 'cancelat') return { kind: 'cancel' };
    if(k.estat === 'circula') return k.retard >= 2 ? { kind: 'late', min: k.retard, dep: t[0] + k.retard, arr: t[1] + k.retard } : undefined;
    return t[0] >= now.min && t[0] - now.min <= SOON ? { kind: 'unknown' } : undefined;
  };
  const lv = liveOf(a), late = lv?.kind === 'late' ? lv : undefined, cancelled = lv?.kind === 'cancel';
  const leaves = late ? late.dep : a[0];
  const until = live && !cancelled ? dur(leaves-now.min) : '';
  const rows: Row[] = (next ? [a, next] : [a]).map(t => ({ dep: t[0], arr: t[1], line: t[3], ave: isAveTrip(t), big: t === a,
    until: t === a ? until : '', morrow: !!lastAve && t !== lastAve, day: t === lastAve ? now.date : nextDay ? addDays(now.date, 1) : now.date,
    ...(t === a && lv ? { live: lv } : {}) }));
  // the big train links to Renfe's search for its trip and day (the AVE's trip ends at Camp de Tarragona); its stops
  // are counted in a phone's sheet and drawn on a desktop's board
  const ends = isAve ? (ida ? [v.station, CAMP] : [CAMP, v.station]) : ida ? [v.station, v.town] : [v.town, v.station];
  const buy = buyUrl(ends[0], ends[1], day, a[0]);
  const stops = stopsBetween(day, a[2], ends[0], ends[1]);
  const where = day === now.date ? whereNow(now.min, [[ends[0], a[0]], ...(stops ?? []), [ends[1], a[1]]]) : null;
  const there = isAve ? 'Camp de Tarragona' : townName;
  const trip: Trip = { line: a[3], color: LINE[a[3]] ?? 'var(--shadow)', from: ida ? bcn : there, to: ida ? there : bcn, dep: hhmm(a[0]), arr: hhmm(a[1]),
    when: tomorrow ? 'Demà' : cancelled ? 'Cancel·lat' : leaves < now.min ? 'Ja ha sortit' : leaves === now.min ? 'Surt ara' : `Surt en ${dur(leaves-now.min)}`, length: dur(a[1]-a[0]),
    stops: stops?.length ?? null, buy,
    ave: isAve ? (ida ? `L’AVE no arriba ${atPlace(townName)}: baixa a Camp de Tarragona.` : `L’AVE no surt ${ofPlace(townName)}: surt de Camp de Tarragona.`) : '',
    home: homeText(a[3], ida ? bcn : there, hhmm(a[0]), ida ? there : bcn, hhmm(a[1]), tomorrow), news: lineNews(avisos, a[3], isAve), where };
  // what a screen reader hears: the train, only when it changes (never the countdown's refresh)
  const sFrom = isAve ? (ida ? bcn : 'Camp de Tarragona') : from, sTo = isAve ? (ida ? 'Camp de Tarragona' : `Barcelona ${bcn}`) : to;
  const say = `${picked ? 'Tren triat, demà' : tomorrow ? 'Avui ja no queden trens. El primer de demà' : v.useNow ? 'Pròxim tren' : 'Tren triat'}: ${hhmm(a[0])}, ${isAve ? 'AVE ' : ''}${ofPlace(sFrom)} ${atPlace(sTo)}${cancelled ? ', cancel·lat' : late ? `, amb ${late.min} min de retard: surt cap a les ${hhmm(late.dep)}; arriba a les ${hhmm(late.arr)}` : `; arriba a les ${hhmm(a[1])}`}.`;
  return { kind: 'train', key: a[0] + v.dir + isAve + v.town + v.station + day + (lv?.kind ?? ''), say,
    label: picked ? morrowLabel : lastAve ? 'Avui ja no queden regionals' : tomorrow ? 'Avui ja no en queden · demà' : '', note,
    knob: tomorrow ? null : a[0], valuetext: picked ? `${isAve ? 'AVE' : 'tren'} de demà de les ${hhmm(a[0])}` : tomorrow ? 'avui ja no queden trens' : `${isAve ? 'AVE' : 'tren'} de les ${hhmm(a[0])}`,
    light: tomorrow ? a[0] : start, day,
    // the ruler has one mark: the knob always stands on the train shown (every tick is a train, the AVE like the rest)
    ruler: today.map(({t, ave:w}) => ({dep: t[0], ave: w, on: !tomorrow && w === isAve && t[0] === a[0]})),
    ave: isAve, rows, buy, stops, trip, where, lines: [...new Set(rows.filter(r => !r.ave).map(r => r.line))] };
}

// a train between its departure and its arrival: the share of its trip already gone and the two stops on either side
// (or the one it stands at, that minute)
function whereNow(min: number, pts: [stop: string, at: number][]): Where | null {
  const dep = pts[0][1], arr = pts[pts.length - 1][1];
  if(min <= dep || min >= arr) return null;
  const i = pts.findIndex(([, m]) => m > min) - 1, at = (min - dep) / (arr - dep);
  return { at, words: pts[i][1] === min ? `Ara a ${stopName(pts[i][0])}` : `Ara entre ${stopName(pts[i][0])} i ${stopName(pts[i + 1][0])}` };
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
// no direct train between this Barcelona station and the town, today nor tomorrow: when another Barcelona station
// has one (França has no R11), the board names it, so the visitor knows where to go instead (Àlex, 05-10)
function noTrain(v: ViewState, from: string, to: string, iso: string): string {
  const ida = v.dir === 'casa';
  const runs = (st: string) => [iso, addDays(iso, 1)].some(x => { const {d} = dayData(x, v.town, st); return (ida ? d.r : d.b).length > 0; });
  const others = BCN.filter(s => s.id !== v.station && runs(s.id)).map(s => s.name);
  if(!others.length) return `No hi ha tren directe entre ${from} i ${to} avui ni demà.`;
  const town = NET.estaciones[v.town].nombre, bcn = bcnName(v.station);
  const alt = others.length > 1 ? `${others.slice(0, -1).join(', ')} o de ${others[others.length - 1]}` : others[0];
  return ida ? `Des de ${bcn} no hi ha tren directe ${atPlace(town)}. Surt de ${alt}.` : `${cap(ofPlace(town))} no hi ha tren directe a ${bcn}. Va a ${alt.replace(' o de ', ' o a ')}.`;
}
