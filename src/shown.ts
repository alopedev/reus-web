import type { ViewState } from './state';
import type { Trip } from './detail';
import { addDays, hhmm, dur, dayData, NET, BCN, bcnName, FAST, altOf, stopsBetween, stopName, busLeg, type Train, type Bus } from './time';
import { buyUrl } from './buy';
import { remindUrl } from './calendar';
import { homeText } from './home';
import { ofPlace, atPlace } from './ca';
import { lineNews, type Avisos } from './avisos';
import type { Retards } from './retards';

// which train the hero shows, and every word that follows from it: the one place that decides; timetable.ts only
// paints what comes out. Pure: the moment, the visitor's choice and what is known of the notices go in, plain data
// comes out (scripts/test/ runs it in Node against the frozen timetable)

// a train on the ruler: the day's (today's, or tomorrow's when tomorrow is looked at), regionals and fast trains
// together in order of departure; `on` is the train shown
export type Mark = { dep: number, ave: boolean, on: boolean };
// where the train shown is now, by the timetable: how far along its trip (0 at departure, 1 at arrival) and in words
export type Where = { at: number, words: string };
// what Renfe's real-time feed says of the train shown (10-10, Àlex: option A, the time corrected; on time says nothing)
// late (2 min or more: a minute is on time), cancelled, or unknown: due within the hour and not in the feed yet, or
// Renfe not answering, so a silence is never read as «on time»
export type Live = { kind: 'late', min: number, dep: number, arr: number } | { kind: 'cancel' } | { kind: 'unknown' };
const SOON = 60;
const REMIND = 15;   // the calendar's alarm: minutes before the train leaves (api/calendari.ts)   // a train enters Renfe's feed only once it runs: further away than this, nothing is expected yet
// one trip of the board: the train shown (big) and the one after it
// (`day`: the trip's own day, today's or tomorrow's, so that picking it keeps it; `gone`: the train shown, picked,
// has already left today, by its delay when Renfe gives one, so the board says «ja ha sortit» where it would say «el pròxim»;
// `ave`: a fast train from or to the town's other station, `other` its name: Camp de Tarragona, Figueres-Vilafant)
export type Row = { dep: number, arr: number, line: string, ave: boolean, other: string, big: boolean, until: string, morrow: boolean, day: string, gone: boolean, live?: Live };
interface Common {
  key: string; say: string;          // #aviso: what a screen reader hears, only when `key` changes
  label: string; note: string;       // #lbl, #note
  knob: number | null;               // the ruler's value; null stands on now
  valuetext: string;                 // and its words
  light: number;                     // the minute the landscape and the table are lit for
  day: string;                       // the day of the train shown: the stub's printed date
  ruler: Mark[];
  tomorrow: boolean;                 // tomorrow looked at («Demà», B3): the ruler is tomorrow's
}
export type Shown = Common & ({ kind: 'none' } | {
  kind: 'train', ave: boolean, rows: Row[], buy: string, remind: string, stops: [stop: string, arr: number][] | null,
  trip: Trip,                        // the train's sheet on a phone
  where: Where | null,               // where it is now, by the timetable; null when it is not on its way
  bus: Bus | null,                   // the part of its trip by bus (works on the line); null when all by train
  lines: string[],                   // the board's regional lines, whose notices go on the stamp
});

const NO_LIVE: Pick<Retards, 'train'> = { train: () => undefined };
export function shown(now: { date: string, min: number }, v: ViewState, avisos: Pick<Avisos, 'line' | 'read'>, retards = NO_LIVE): Shown {
  const start = v.useNow ? now.min : v.minute ?? now.min;
  const ida = v.dir === 'casa';
  const townName = NET.estaciones[v.town].nombre, bcn = bcnName(v.station);
  // the town's other station, where some fast trains call instead of the town's own (altOf)
  const alt = altOf(v.town) ?? v.town, altName = NET.estaciones[alt]?.nombre ?? townName;
  const from = ida ? bcn : townName, to = ida ? townName : `Barcelona ${bcn}`;
  let {d, exact} = dayData(now.date, v.town, v.station);
  const marks = (d: ReturnType<typeof dayData>['d']) => [...(ida ? d.r : d.b).map(t => ({t, ave:false})), ...(ida ? d.ar : d.ab).map(t => ({t, ave:true}))].sort((x, y) => x.t[0]-y.t[0]);
  const today = marks(d);
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
  // tomorrow looked at: one of tomorrow's trains chosen, on the «Demà» sheet, the ruler or a trip of the board, on its
  // own day (past midnight its day is today, and it is chosen like any other). The ruler is tomorrow's, and the sheet
  // says which day it is, so no label is needed
  const picked = !v.useNow && !!v.day && v.day > now.date;
  let seen = today;
  if(picked){
    ({d, exact} = dayData(v.day!, v.town, v.station)); nextDay = true; seen = marks(d);
    regs = after(ida ? d.r : d.b); aves = after(ida ? d.ar : d.ab); lastAve = undefined; tomorrow = true;
  }
  const note = exact ? '' : `Horari aproximat: ${nextDay ? 'demà' : 'avui'} encara no hi ha horari oficial.`;
  const clamp = (m: number) => Math.min(1439, Math.max(300, m));
  // safety net (decision 3): no direct train at all today nor tomorrow in this direction. Only reachable for a
  // town whose only trains run on days the frozen or newly-generated timetable does not cover
  if(!lastAve && !regs.length && !aves.length){
    const said = noTrain(v, from, to, now.date);
    return { kind: 'none', key: 'none' + v.station + v.town + v.dir, say: said, label: said, note, knob: clamp(now.min),
      valuetext: 'sense tren directe avui ni demà', light: now.min, day: now.date, ruler: today.map(({t, ave}) => ({dep: t[0], ave, on: false})), tomorrow: false };
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
  // today's last train with nothing after it today: tomorrow's first, regional or AVE, with «demà» (two trips always)
  let morrow: Train | undefined, morrowAve = false;
  if(!next && !nextDay){
    const m = dayData(addDays(now.date, 1), v.town, v.station).d, r = (ida ? m.r : m.b)[0], av = (ida ? m.ar : m.ab)[0];
    morrowAve = !!av && (!r || av[0] < r[0]); morrow = morrowAve ? av : r;
  }
  const isAveTrip = (t: Train) => aves.includes(t) || t === lastAve || (t === morrow && morrowAve);
  // the delay Renfe gives for the train shown, only for today's trains: the regionals from its Rodalies feed, the AVE
  // from its long-distance one (04-11, Àlex: option A, as the regionals)
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
  const rows: Row[] = (next ? [a, next] : morrow ? [a, morrow] : [a]).map(t => ({ dep: t[0], arr: t[1], line: t[3], ave: isAveTrip(t), other: isAveTrip(t) ? altName : '', big: t === a,
    until: t === a ? until : '', gone: t === a && !tomorrow && leaves < now.min, morrow: (!!lastAve && t !== lastAve) || t === morrow || (picked && t === a),
    day: t === lastAve ? now.date : nextDay || t === morrow ? addDays(now.date, 1) : now.date,
    ...(t === a && lv ? { live: lv } : {}) }));
  // the big train links to Renfe's search for its trip and day (a trip from the other station ends there); its stops
  // are counted in a phone's sheet and drawn on a desktop's board
  const ends = isAve ? (ida ? [v.station, alt] : [alt, v.station]) : ida ? [v.station, v.town] : [v.town, v.station];
  // Renfe opens the day's list, not the train: a cancelled or departed one has nothing to buy (12-10, option A)
  const buy = cancelled || (!tomorrow && leaves < now.min) ? '' : buyUrl(ends[0], ends[1], day, a[0], a[1]);
  const stops = stopsBetween(day, a[2], ends[0], ends[1]), bus = isAve ? null : busLeg(day, a[2], ends[0], ends[1]);
  const there = isAve ? altName : townName, fast = a[3] === FAST;
  // «Recorda» (04-11, option A): into the visitor's calendar with an alarm 15 min before, at the time it now leaves;
  // a train leaving sooner than that, gone or cancelled, has nothing to remind
  const remind = cancelled || (!tomorrow && leaves < now.min + REMIND) ? '' : remindUrl({ d: day, s: leaves,
    a: late ? late.arr : a[1], l: a[3], o: ida ? bcn : there, x: ida ? there : bcn });
  // a late train is where its delay puts it: the timetable's place that many minutes ago
  const where = day === now.date ? whereNow(now.min - (late?.min ?? 0), [[ends[0], a[0]], ...(stops ?? []), [ends[1], a[1]]]) : null;
  const trip: Trip = { line: a[3], from: ida ? bcn : there, to: ida ? there : bcn, dep: hhmm(a[0]), arr: hhmm(a[1]),
    when: tomorrow ? 'Demà' : cancelled ? 'Cancel·lat' : leaves < now.min ? 'Ja ha sortit' : leaves === now.min ? 'Surt ara' : `Surt en ${dur(leaves-now.min)}`, length: dur(a[1]-a[0]),
    stops: stops?.length ?? null, buy, remind,
    ave: isAve ? (ida ? `Aquest tren no arriba ${atPlace(townName)}: baixa ${atPlace(altName)}.` : `Aquest tren no surt ${ofPlace(townName)}: surt ${ofPlace(altName)}.`) : '',
    home: homeText(a[3], ida ? bcn : there, hhmm(a[0]), ida ? there : bcn, hhmm(late ? late.arr : a[1]), tomorrow), news: lineNews(avisos, a[3], fast), where,
    bus: bus && { first: bus.first, stop: bus.stop, words: bus.first
      ? `En autobús fins ${atPlace(NET.estaciones[bus.stop]?.nombre ?? bus.stop)} (arriba a les ${hhmm(bus.arrives)}). Allà, el tren de les ${hhmm(bus.leaves)}.`
      : `En tren fins ${atPlace(NET.estaciones[bus.stop]?.nombre ?? bus.stop)} (arriba a les ${hhmm(bus.arrives)}). Allà, l’autobús de les ${hhmm(bus.leaves)}.` },
    live: late ? `Amb ${late.min} min de retard: surt cap a les ${hhmm(late.dep)} i arriba cap a les ${hhmm(late.arr)}.` : lv?.kind === 'unknown' ? 'Retard: sense dades en directe encara.' : '' };
  // what a screen reader hears: the train, only when it changes (never the countdown's refresh)
  const sFrom = isAve ? (ida ? bcn : altName) : from, sTo = isAve ? (ida ? altName : `Barcelona ${bcn}`) : to;
  const say = `${picked ? 'Tren triat, demà' : tomorrow ? 'Avui ja no queden trens. El primer de demà' : v.useNow ? 'Pròxim tren' : 'Tren triat'}: ${hhmm(a[0])}, ${fast ? 'AV ' : ''}${ofPlace(sFrom)} ${atPlace(sTo)}${cancelled ? ', cancel·lat' : late ? `, amb ${late.min} min de retard: surt cap a les ${hhmm(late.dep)}; arriba a les ${hhmm(late.arr)}` : `; arriba a les ${hhmm(a[1])}`}.${bus ? ' ' + cap(busWords(bus)) + '.' : ''}`;
  return { kind: 'train', key: a[0] + v.dir + isAve + v.town + v.station + day + (lv?.kind ?? ''), say,
    label: picked ? '' : lastAve ? 'Avui ja no queden regionals' : tomorrow ? 'Avui ja no en queden · demà' : '', note,
    knob: tomorrow && !picked ? null : a[0], valuetext: picked ? `${fast ? 'AV' : 'tren'} de demà de les ${hhmm(a[0])}` : tomorrow ? 'avui ja no queden trens' : `${fast ? 'AV' : 'tren'} de les ${hhmm(a[0])}`,
    light: tomorrow ? a[0] : start, day,
    // the ruler has one mark: the knob always stands on the train shown (every tick is a train, the fast ones like the rest)
    ruler: seen.map(({t, ave:w}) => ({dep: t[0], ave: w, on: (picked || !tomorrow) && w === isAve && t[0] === a[0]})), tomorrow: picked,
    ave: isAve, rows, buy, remind, stops, trip, where, bus, lines: [...new Set(rows.filter(r => r.line !== FAST).map(r => r.line))] };
}

// the day sheet pressed, «avui» or «demà»: the day of the train shown (Àlex 19-10), so that at night, with tomorrow's
// first trains on the board, «demà» is pressed
export function looked(s: Shown, today: string): 'avui' | 'dema' { return s.day > today ? 'dema' : 'avui'; }

// the «Demà» sheet (B3, Àlex 15-10): tomorrow's train at this time of day, the first to leave from now's minute on,
// regional or AVE (late at night, tomorrow's last). Whoever looks at tomorrow mostly repeats today's trip; the ruler
// takes them to any other hour
export function tomorrowAt(now: { date: string, min: number }, v: ViewState): { minute: number, ave: boolean, day: string } {
  const day = addDays(now.date, 1), {d} = dayData(day, v.town, v.station), ida = v.dir === 'casa';
  const all = [...(ida ? d.r : d.b).map(t => ({dep: t[0], ave: false})), ...(ida ? d.ar : d.ab).map(t => ({dep: t[0], ave: true}))].sort((x, y) => x.dep - y.dep);
  const t = all.find(x => x.dep >= now.min) ?? all[all.length - 1];
  return { minute: t?.dep ?? now.min, ave: t?.ave ?? false, day };
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

// the bus part in words, for a screen reader: «en autobús fins a la Plana-Picamoixons», «en autobús des de …»
export function busWords(bus: Bus): string {
  const name = NET.estaciones[bus.stop]?.nombre ?? bus.stop;
  return bus.first ? `en autobús fins ${atPlace(name)}` : `en autobús des ${ofPlace(name)}`;
}
