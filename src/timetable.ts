import { reduce, state } from './state';
import { madridNow, addDays, hhmm, dur, dayData, lastDay, source, NET, BCN, bcnName, bcnShort, CAMP, stopsBetween, type Train } from './time';
import { buyUrl } from './buy';
import { homeText } from './home';
import { cut } from './paper';
import { ofPlace, atPlace } from './ca';
import { LINE } from './towns';
import { setupChooser } from './chooser';
import { setupDetail, type Trip } from './detail';
import { journey, fitJourney } from './journey';
import { byId } from './dom';
import type { World } from './world';
import type { Table } from './table';
import type { Scenery } from './scenery';
import type { createWeather } from './weather';

// the hero's timetable: the next train, the ticket for the direction, the ruler of the day
export function setupTimetable({ world, table, scenery, weather }: { world: World | null, table: Table, scenery: Scenery, weather: ReturnType<typeof createWeather> }): { render(): void } {
  const tIn = byId<HTMLInputElement>('t'), nowBtn = byId<HTMLButtonElement>('nowBtn');
  const R0 = 300, R1 = 1439, pos = (m: number) => ((Math.min(R1,Math.max(R0,m))-R0)/(R1-R0)*100).toFixed(2)+'%';
  byId('hours').innerHTML = [6,9,12,15,18,21].map(x=>`<span style="left:${pos(x*60)}">${x} h</span>`).join('');
  // today's trains on the ruler, regionals and AVE together in order of departure
  let today: {t: Train, ave: boolean}[] = [], shown: string | null = null, drawn = '';
  // on a phone (the stacked hero) the board is pared down to times and a «›» per trip; tapping one opens its detail
  // (6B, Àlex 06-10). The board is redrawn when the screen crosses over
  const narrow = matchMedia('(max-width:700px), (max-aspect-ratio:4/5)');
  let cur: Trip | null = null;
  function render(){
    const now = madridNow();
    const start = state.useNow ? now.min : state.minute ?? now.min;
    const ida = state.dir==='casa';
    const townName = NET.estaciones[state.town].nombre;
    weather.follow(state.town);
    const bcn = bcnName(state.station);
    const from = ida ? bcn : townName, to = ida ? townName : `Barcelona ${bcn}`;
    setRoute(route(ida, townName));
    let {d, exact} = dayData(now.date, state.town, state.station);
    today = [...(ida ? d.r : d.b).map(t => ({t, ave:false})), ...(ida ? d.ar : d.ab).map(t => ({t, ave:true}))].sort((x, y) => x.t[0]-y.t[0]);
    const after = (list: Train[]) => list.filter(([dep]) => dep >= start + (state.useNow?2:0));
    let regs = after(ida ? d.r : d.b), aves = after(ida ? d.ar : d.ab), tomorrow = false, nextDay = false;
    // no regional left today: tomorrow's first ones, after the AVE still to come today, if there is one
    const lastAve = regs.length ? undefined : aves[0];
    if(!regs.length){ ({d, exact} = dayData(addDays(now.date,1), state.town, state.station)); nextDay = true; regs = ida ? d.r : d.b; aves = ida ? d.ar : d.ab; tomorrow = !lastAve; }
    // safety net (decision 3): no direct train at all today nor tomorrow in this direction. Only reachable for a
    // town whose only trains run on days the frozen or newly-generated timetable does not cover
    const none = !lastAve && !regs.length && !aves.length;
    if(none){
      byId('lbl').textContent = noTrain(from, to, now.date);
      byId('ticks').innerHTML = `<b class="nowline${now.min < R0 + 60 ? ' start' : now.min > R1 - 60 ? ' end' : ''}" style="left:${pos(now.min)}"><span>ara</span></b>`;
      tIn.value = String(Math.min(R1, Math.max(R0, now.min)));
      nowBtn.parentElement!.classList.toggle('left', now.min > (R0+R1)/2);
      tIn.setAttribute('aria-valuetext', 'sense tren directe avui ni demà');
      nowBtn.hidden = state.useNow;
      if(world) world.setTime(now.min);
      table.setTime(now.min);
      byId('board').innerHTML = drawn = ''; cur = null;
      if(shown !== 'none' + state.station + state.town + state.dir){ byId('aviso').textContent = noTrain(from, to, now.date); shown = 'none' + state.station + state.town + state.dir; }
      byId('note').textContent = exact ? '' : `Horari aproximat: ${nextDay ? 'demà' : 'avui'} encara no hi ha horari oficial.`;
      if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
      return;
    }
    // the train shown: the one chosen, or the first to leave, regional or AVE (today's last AVE when no regional is
    // left); the board adds the one after it
    const ave = lastAve ?? aves[0];
    const isAve = !!lastAve || (!!ave && (!regs.length || ave[0] < regs[0][0] || (!state.useNow && !tomorrow && state.ave && ave[0] === start)));
    const a = isAve ? ave : regs[0];
    const live = state.useNow && !tomorrow;
    byId('lbl').textContent = lastAve ? 'Avui ja no queden regionals' : tomorrow ? 'Avui ja no en queden · demà' : '';
    // the ruler has one mark: the knob always stands on the train shown (every tick is a train, the AVE like the
    // rest); now is a thin line with its word
    byId('ticks').innerHTML = today.map(({t, ave:v})=>`<i class="${!tomorrow && v===isAve && t[0]===a[0] ? 'on' : ''}" style="left:${pos(t[0])}"></i>`).join('')
      + `<b class="nowline${now.min < R0 + 60 ? ' start' : now.min > R1 - 60 ? ' end' : ''}" style="left:${pos(now.min)}"><span>ara</span></b>`;
    tIn.value = String(tomorrow ? Math.min(R1, Math.max(R0, now.min)) : a[0]);
    // «Tornar a ara» stands on the side of the ruler away from «ara», so it never covers the word
    nowBtn.parentElement!.classList.toggle('left', now.min > (R0+R1)/2);
    tIn.setAttribute('aria-valuetext', tomorrow ? 'avui ja no queden trens' : `${isAve ? 'AVE' : 'tren'} de les ${hhmm(a[0])}`);
    nowBtn.hidden = state.useNow;
    if(world) world.setTime(tomorrow ? a[0] : start);
    table.setTime(tomorrow ? a[0] : start);
    // two trips: the train shown and the one after it, regional or AVE (after today's last AVE, tomorrow's first)
    const next = lastAve ? regs[0] : [...regs, ...aves].filter(t => t !== a && t[0] >= a[0]).sort((x, y) => x[0]-y[0])[0];
    const trips = next ? [a, next] : [a];
    // the big train links to Renfe's search for its trip and day (the AVE's trip ends at Camp de Tarragona)
    const ends = isAve ? (ida ? [state.station, CAMP] : [CAMP, state.station]) : ida ? [state.station, state.town] : [state.town, state.station];
    const buy = buyUrl(ends[0], ends[1], tomorrow ? addDays(now.date, 1) : now.date, a[0]);
    const until = live ? dur(a[0]-now.min) : '';
    // its stops: counted in a phone's sheet, drawn on a desktop's board (journey.ts)
    const stops = stopsBetween(tomorrow ? addDays(now.date, 1) : now.date, a[2], ends[0], ends[1]);
    const html = trips.map(t => trip(t, t === a, aves.includes(t) || t === lastAve, t === a ? until : '', !!lastAve && t !== lastAve, buy, narrow.matches,
      t === a ? journey(stops, a[0], a[1]) : '')).join('');
    // the detail of the train shown, for the sheet a phone opens
    const there = isAve ? 'Camp de Tarragona' : townName;
    cur = { line: a[3], color: LINE[a[3]] ?? 'var(--shadow)', from: ida ? bcn : there, to: ida ? there : bcn, dep: hhmm(a[0]), arr: hhmm(a[1]),
      when: tomorrow ? 'Demà' : a[0] < now.min ? 'Ja ha sortit' : a[0] === now.min ? 'Surt ara' : `Surt en ${dur(a[0]-now.min)}`, length: dur(a[1]-a[0]),
      stops: stops?.length ?? null, buy,
      ave: isAve ? (ida ? `L’AVE no arriba ${atPlace(townName)}: baixa a Camp de Tarragona.` : `L’AVE no surt ${ofPlace(townName)}: surt de Camp de Tarragona.`) : '',
      home: homeText(a[3], ida ? bcn : there, hhmm(a[0]), ida ? there : bcn, hhmm(a[1]), tomorrow) };
    const key = a[0] + state.dir + isAve + state.town + state.station;
    const turn = shown !== null && shown !== key;
    if(html !== drawn || turn){
      byId('board').innerHTML = drawn = html; if(turn && !reduce) byId('dep').classList.add('swap');
      const rec = byId('board').querySelector<HTMLElement>('.rec'); if(rec) laid.observe(rec);
    }
    if(shown !== key){ say(tomorrow, isAve ? (ida ? bcn : 'Camp de Tarragona') : from, isAve ? (ida ? 'Camp de Tarragona' : `Barcelona ${bcn}`) : to, a, isAve); shown = key; }
    byId('note').textContent = exact ? '' : `Horari aproximat: ${nextDay ? 'demà' : 'avui'} encara no hi ha horari oficial.`;
    if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
  }
  // the ticket's route: both ends are buttons, the town's opens the town chooser and Barcelona's the station
  // chooser (3.5); ⇄ turns the order around, so the DOM order matches what is read: «Sants ⇄ Reus» / «Reus ⇄ Sants»
  function route(ida: boolean, townName: string): string {
    const swap = `<button type="button" class="swap" aria-label="Canviar el sentit">⇄</button>`;
    const townBtn = `<button type="button" class="end town" aria-haspopup="dialog" aria-label="${townName}, canviar de poble">${townName}</button>`;
    const bcnBtn = `<button type="button" class="end bcn" aria-haspopup="dialog" aria-label="${bcnName(state.station)}, canviar d’estació de Barcelona">${bcnShort(state.station)}</button>`;
    return ida ? `${bcnBtn} ${swap} ${townBtn}` : `${townBtn} ${swap} ${bcnBtn}`;
  }
  // the route is only rebuilt when it changes (⇄, a new town), never on the countdown's refresh; a rebuilt control
  // hands the focus to its new self, so ⇄ keeps it after turning the trip around
  let routeHtml = '';
  function setRoute(html: string){
    if(html === routeHtml) return;
    const el = byId('tickets').querySelector<HTMLElement>('.route')!, had = el.querySelector(':focus')?.className;
    el.innerHTML = routeHtml = html;
    if(had) el.querySelector<HTMLElement>('.' + had.split(' ').join('.'))?.focus({preventScroll:true});
  }
  // no direct train between this Barcelona station and the town, today nor tomorrow: when another Barcelona station
  // has one (França has no R11), the board names it, so the visitor knows where to go instead (Àlex, 05-10)
  function noTrain(from: string, to: string, iso: string): string {
    const ida = state.dir === 'casa';
    const runs = (st: string) => [iso, addDays(iso, 1)].some(x => { const {d} = dayData(x, state.town, st); return (ida ? d.r : d.b).length > 0; });
    const others = BCN.filter(s => s.id !== state.station && runs(s.id)).map(s => s.name);
    if(!others.length) return `No hi ha tren directe entre ${from} i ${to} avui ni demà.`;
    const town = NET.estaciones[state.town].nombre, bcn = bcnName(state.station);
    const alt = others.length > 1 ? `${others.slice(0, -1).join(', ')} o de ${others[others.length - 1]}` : others[0];
    return ida ? `Des de ${bcn} no hi ha tren directe ${atPlace(town)}. Surt de ${alt}.` : `${cap(ofPlace(town))} no hi ha tren directe a ${bcn}. Va a ${alt.replace(' o de ', ' o a ')}.`;
  }
  // one trip of the board: line, departure, which one it is («el próximo», with its countdown, and «el siguiente»;
  // «mañana» after today's last AVE), arrival. The AVE says under its arrival that it runs from or to Camp de
  // Tarragona, not the town. The train shown is big; the other is a button that shows it
  // On a phone only the times are left, with the countdown on the big train and «mañana» where it applies; every trip
  // is a button with a «›» that opens its detail, the big one included (its link to Renfe moves into the sheet)
  function trip(t: Train, big: boolean, isAve: boolean, until: string, morrow: boolean, buy: string, phone: boolean, rec: string){
    if(phone){
      const w = big ? `<span class="soon">${until && 'en ' + until}</span>` : morrow ? 'demà' : '';
      const cells = `<span class="pill" style="--c:${LINE[t[3]] ?? 'var(--shadow)'}">${t[3]}</span> <span class="t"${big ? ' id="dep"' : ''}>${hhmm(t[0])}</span> `
        + `<span class="w">${w}</span> <span class="t arr">→ ${hhmm(t[1])}</span> <span class="mas" aria-hidden="true">›</span>`;
      const where = isAve ? (state.dir==='casa' ? ' a' : ' des de') + ' Camp de Tarragona' : '';
      const label = `${isAve ? 'AVE' : t[3]} de les ${hhmm(t[0])}${where}${big && until ? ', surt en ' + until : morrow ? ', demà' : ''}, arriba a les ${hhmm(t[1])}. Veure el detall i comprar`;
      return `<button type="button" class="trip${big ? ' big' : ' tt'}" data-m="${t[0]}"${isAve ? ' data-ave' : ''} aria-haspopup="dialog" aria-label="${label}">${cells}</button>`;
    }
    // the big train's time and «compra’l ↗» open Renfe in a new tab; the word repeats the link for the eye only
    const to = ` href="${buy.replace(/&/g, '&amp;')}" target="_blank" rel="noopener"`;
    const soon = big ? `<span class="soon">${until && 'en ' + until}</span>` : '';
    const word = big ? ` <a class="buy"${to} tabindex="-1" aria-hidden="true">compra’l ↗</a>` : '';
    const where = (big ? `<span class="nx">el pròxim${until ? ', ' : ''}</span>${soon}` : morrow ? 'demà' : 'després') + word;
    // the big train's words keep to one line, and its route takes the rest of the gap up to the arrival
    const w = big ? `<span class="lead">${where}</span>${rec}` : where;
    const camp = isAve ? ` <span class="st">${state.dir==='casa' ? 'fins a' : 'des de'} Camp de Tarragona</span>` : '';
    // spaces between the cells: the grid ignores them, but the text (and a screen reader) keeps its words apart
    const dep = big ? `<a class="t" id="dep"${to} aria-label="${hhmm(t[0])}, comprar a Renfe (s’obre en una altra pestanya)">${hhmm(t[0])}</a>` : `<span class="t">${hhmm(t[0])}</span>`;
    const cells = `<span class="pill" style="--c:${LINE[t[3]] ?? 'var(--shadow)'}">${t[3]}</span> ${dep} `
      + `<span class="w">${w}</span> <span class="t arr">→ ${hhmm(t[1])}</span>${camp}`;
    if(big) return `<div class="trip big">${cells}</div>`;
    const label = `${isAve ? 'AVE' : t[3]} de les ${hhmm(t[0])}${isAve ? (state.dir==='casa' ? ' a' : ' des de') + ' Camp de Tarragona' : ''}, arriba a les ${hhmm(t[1])}`;
    return `<button type="button" class="trip tt" data-m="${t[0]}"${isAve ? ' data-ave' : ''} aria-label="${label}">${cells}</button>`;
  }
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  // what a screen reader hears: the train, only when it changes (never the countdown's refresh)
  function say(tomorrow: boolean, from: string, to: string, a: Train, isAve: boolean){
    byId('aviso').textContent = `${tomorrow ? 'Avui ja no queden trens. El primer de demà' : state.useNow ? 'Pròxim tren' : 'Tren triat'}: ${hhmm(a[0])}, ${isAve ? 'AVE ' : ''}${ofPlace(from)} ${atPlace(to)}; arriba a les ${hhmm(a[1])}.`;
  }
  function pick(m: number, ave = false){ state.useNow = false; state.minute = m; state.ave = ave; render(); }
  nowBtn.addEventListener('click', ()=>{ state.useNow = true; render(); tIn.focus({preventScroll:true}); });
  // the chosen trip becomes the big one: the focus moves to the ruler, which now stands on it
  // on a phone, any trip opens the sheet with its detail, after becoming the train shown
  byId('board').addEventListener('click', e=>{
    const b = (e.target as Element).closest<HTMLElement>('.tt, button.big'); if(!b) return;
    if(b.matches('.tt')) pick(+b.dataset.m!, 'ave' in b.dataset);
    if(narrow.matches){ if(cur) detail.open(cur); }
    else tIn.focus({preventScroll:true});
  });
  narrow.addEventListener('change', ()=>{ drawn = ''; render(); });
  // the route's labels are laid out again whenever its line changes width (a new board, the screen, the fonts)
  const laid = new ResizeObserver(es => { for(const e of es) if(e.target.isConnected) fitJourney(e.target as HTMLElement); else laid.unobserve(e.target); });
  document.fonts?.ready.then(() => { const rec = byId('board').querySelector<HTMLElement>('.rec'); if(rec) fitJourney(rec); });
  // dragging or tapping the ruler lands on the nearest train, never between two
  let rq = 0;
  function snap(){
    const v = +tIn.value; if(!today.length) return;
    const near = today.reduce((b, x) => Math.abs(x.t[0]-v) < Math.abs(b.t[0]-v) ? x : b, today[0]);
    state.useNow = false; state.minute = near.t[0]; state.ave = near.ave;
    if(!rq) rq = requestAnimationFrame(()=>{ rq=0; render(); });
  }
  tIn.addEventListener('input', snap); tIn.addEventListener('change', snap); tIn.addEventListener('pointerup', ()=> setTimeout(snap, 0));
  // keys step from train to train, AVE included
  tIn.addEventListener('keydown', e=>{
    const cur = +tIn.value, i = today.findIndex(x => x.t[0] === cur && x.ave === state.ave && !state.useNow);
    let next: {t: Train, ave: boolean} | undefined;
    if(e.key==='ArrowRight' || e.key==='ArrowUp') next = i >= 0 ? today[i+1] : today.find(x => x.t[0] > cur);
    else if(e.key==='ArrowLeft' || e.key==='ArrowDown') next = i >= 0 ? today[i-1] : [...today].reverse().find(x => x.t[0] < cur);
    else if(e.key==='Home') next = today[0];
    else if(e.key==='End') next = today[today.length-1];
    else return;
    e.preventDefault(); if(next) pick(next.t[0], next.ave);
  });
  // one ticket with both ends of the trip; ⇄ turns it around. The town end opens the town chooser, Barcelona's
  // end the station chooser. The swap and both ends are rebuilt on every render() (route()), so
  // their listeners are delegated on the container instead of attached to elements that get replaced
  byId('tickets').innerHTML = `
    <div class="tk" style="--cut:${cut(7)}">
      <span class="pp"><span class="k">Bitllet</span>
      <span class="route"></span></span><span class="stub" aria-hidden="true"></span>
    </div>`;
  const detail = setupDetail();
  const chooser = setupChooser(
    id => { state.town = id; state.useNow = true; state.ave = false; render(); byId('tickets').querySelector<HTMLElement>('.end.town')?.focus(); },
    id => { state.station = id; state.useNow = true; state.ave = false; render(); byId('tickets').querySelector<HTMLElement>('.end.bcn')?.focus(); });
  byId('tickets').addEventListener('click', e=>{
    const t = e.target as HTMLElement;
    if(t.closest('.swap')){ state.dir = state.dir==='casa' ? 'bcn' : 'casa'; render(); if(world) world.resize(); }
    else if(t.closest('.end.town')) chooser.open();
    else if(t.closest('.end.bcn')) chooser.openStation();
  });
  setInterval(()=>{ if(state.useNow) render(); }, 30000);
  { const day = (iso: string) => new Date(iso+'T12:00:00Z').toLocaleDateString('ca-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    byId('hasta').textContent = `Horaris fins al ${day(lastDay())}.`;
    // Renfe's licence asks for its exact words, in Spanish (data.renfe.com/legal); the date that follows is ours
    byId('fuente').textContent = `${source.fuente}. Dades del ${day(source.actualizado)}.`; }
  return { render };
}
