import { reduce, state } from './state';
import { madridNow, firstDay, lastDay, source, NET, bcnName, bcnShort, addDays } from './time';
import { shown, tomorrowAt, type Mark } from './shown';
import { board } from './board';
import { cut } from './paper';
import { setupChooser } from './chooser';
import { setupDetail, type Trip } from './detail';
import { fitJourney } from './journey';
import { dotDate } from './dots';
import { byId } from './dom';
import type { World } from './world';
import type { Table } from './table';
import type { Scenery } from './scenery';
import type { createWeather } from './weather';
import { notices, type Avisos } from './avisos';
import type { Retards } from './retards';
import { stamp, heard, setupNotice, type Notice } from './notice';
import { dateSpan } from './ca';

// the hero's timetable: the next train, the ticket for the direction, the ruler of the day
export function setupTimetable({ world, table, scenery, weather, avisos, retards }: { world: World | null, table: Table, scenery: Scenery, weather: ReturnType<typeof createWeather>, avisos: Avisos, retards: Retards }): { render(): void } {
  const tIn = byId<HTMLInputElement>('t'), nowBtn = byId<HTMLButtonElement>('nowBtn');
  const R0 = 300, R1 = 1439, pos = (m: number) => ((Math.min(R1,Math.max(R0,m))-R0)/(R1-R0)*100).toFixed(2)+'%';
  byId('hours').innerHTML = [6,9,12,15,18,21].map(x=>`<span style="left:${pos(x*60)}">${x} h</span>`).join('');
  // today's trains on the ruler, regionals and AVE together in order of departure; `said` is the train #aviso last spoke of
  let marks: Mark[] = [], said: string | null = null, drawn = '', tomorrow = false;
  // on a phone (the stacked hero) the board is pared down to times and a «›» per trip; tapping one opens its detail
  // (6B, Àlex 06-10). The board is redrawn when the screen crosses over
  const narrow = matchMedia('(max-width:700px), (max-aspect-ratio:4/5), (orientation:landscape) and (max-height:500px)');
  let cur: Trip | null = null;
  // now on the ruler: a thin orange line with «ara»; away from now, the station clock stands on it in place of the word
  const nowLine = (m: number) => `<b class="nowline${m < R0 + 60 ? ' start' : m > R1 - 60 ? ' end' : ''}${state.useNow ? '' : ' away'}" style="left:${pos(m)}"><span>ara</span></b>`;
  function clock(m: number){
    nowBtn.hidden = state.useNow;
    nowBtn.style.left = pos(m);
    nowBtn.style.setProperty('--h', `${(m % 720) / 2}deg`);
    nowBtn.style.setProperty('--m', `${(m % 60) * 6}deg`);
    nowBtn.style.setProperty('--s', String(new Date().getSeconds()));
  }
  function render(){
    const now = madridNow(), v = shown(now, state, avisos, retards);
    weather.follow(state.town);
    avisos.follow();
    retards.follow();
    setRoute(route(state.dir==='casa', NET.estaciones[state.town].nombre));
    marks = v.ruler; tomorrow = v.tomorrow;
    setDays(now.date, v.tomorrow);
    byId('lbl').textContent = v.label;
    tIn.value = String(v.knob ?? Math.min(R1, Math.max(R0, now.min)));
    tIn.setAttribute('aria-valuetext', v.valuetext);
    clock(now.min);
    nowBtn.hidden = state.useNow || v.tomorrow;
    if(world) world.setTime(v.light);
    table.setTime(v.light);
    setDate(v.day);
    if(v.kind === 'none'){
      byId('ticks').innerHTML = nowLine(now.min);
      byId('board').innerHTML = drawn = ''; cur = null; setStamp([]);
      if(said !== v.key){ byId('aviso').textContent = v.say; said = v.key; }
      byId('note').textContent = v.note;
      if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
      return;
    }
    // the ruler has one mark: the knob always stands on the train shown; now is a thin line with its word
    byId('ticks').innerHTML = v.ruler.map(m=>`<i class="${m.on ? 'on' : ''}" style="left:${pos(m.dep)}"></i>`).join('') + (v.tomorrow ? '' : nowLine(now.min));
    const html = board(v, state.dir==='casa', narrow.matches).join('');
    cur = v.trip;
    // the notices of the board's regional lines: a stamp on a desktop's ticket
    const ns = notices(avisos, v.lines);
    setStamp(narrow.matches ? [] : ns);
    const turn = said !== null && said !== v.key;
    if(html !== drawn || turn){
      byId('board').innerHTML = drawn = html; if(turn && !reduce) byId('dep').classList.add('swap');
      const rec = byId('board').querySelector<HTMLElement>('.rec'); if(rec) laid.observe(rec);
    }
    const told = said !== v.key;
    if(told){ byId('aviso').textContent = v.say; said = v.key; }
    // a screen reader hears a notice when it appears or changes: after the train, or alone when the train is the same
    const nk = JSON.stringify(ns);
    if(nk !== noticed){ if(ns.length) byId('aviso').textContent = (told ? byId('aviso').textContent + ' ' : '') + heard(ns); noticed = nk; }
    detail.refresh(cur);
    byId('note').textContent = v.note;
    if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
  }
  // the ticket's route: both ends are buttons, the town's opens the town chooser and Barcelona's the station
  // chooser (3.5); the arrows turn the order around, so the DOM order matches what is read: «Sants ▶▶▷ Reus» / «Reus ▶▶▷ Sants»
  function route(ida: boolean, townName: string): string {
    // the three fading arrows of a printed Rodalies ticket point the way (Àlex 09-10, option A); still the button that
    // turns the trip around
    const swap = `<button type="button" class="swap" aria-label="Canviar el sentit"><svg class="fletxes" viewBox="0 0 46 16" aria-hidden="true">`
      + `<path d="M1 1 13 8 1 15Z" fill="#E07A1F"/><path d="M16 1 28 8 16 15Z" fill="#EDA864"/>`
      + `<path d="M31 1 43 8 31 15Z" fill="#FBEBDC" stroke="#EDA864" stroke-width=".8"/></svg></button>`;
    const townBtn = `<button type="button" class="end town" aria-haspopup="dialog" aria-label="${townName}, canviar de poble">${townName}</button>`;
    const bcnBtn = `<button type="button" class="end bcn" aria-haspopup="dialog" aria-label="${bcnName(state.station)}, canviar d’estació de Barcelona">${bcnShort(state.station)}</button>`;
    return ida ? `${bcnBtn} ${swap} ${townBtn}` : `${townBtn} ${swap} ${bcnBtn}`;
  }
  // the route is only rebuilt when it changes (the arrows, a new town), never on the countdown's refresh; a rebuilt control
  // hands the focus to its new self, so the arrows keep it after turning the trip around
  let routeHtml = '';
  function setRoute(html: string){
    if(html === routeHtml) return;
    const el = byId('tickets').querySelector<HTMLElement>('.route')!, had = el.querySelector(':focus')?.className;
    el.innerHTML = routeHtml = html;
    if(had) el.querySelector<HTMLElement>('.' + had.split(' ').join('.'))?.focus({preventScroll:true});
  }
  // the stamp sits on the ticket, outside its route, so a new route never takes it away; redrawn only when it changes
  let stamped = '', noticed = '[]', shownNotices: Notice[] = [];
  // the stub's printed date: the day of the train shown (tomorrow's when the board has moved on to tomorrow)
  let dated = '';
  function setDate(iso: string){ if(iso === dated) return; const f = byId('tickets').querySelector<HTMLElement>('.fecha')!; f.innerHTML = dotDate(dated = iso); f.dataset.dia = iso; }
  function setStamp(ns: Notice[]){
    const html = ns.length ? stamp(ns) : ''; shownNotices = ns;
    if(html === stamped) return;
    const tk = byId('tickets').querySelector<HTMLElement>('.tk')!, had = tk.querySelector('.segell:focus');
    tk.querySelector('.segell')?.remove(); stamped = html; tk.classList.toggle('sellat', !!html);
    if(html){ tk.insertAdjacentHTML('beforeend', html); if(had) tk.querySelector<HTMLElement>('.segell')?.focus({preventScroll:true}); }
  }
  // «Avui · Demà» (B3, Àlex 15-10): two sheets of a tear-off calendar over the ruler, the day looked at pressed flat and
  // the other raised. Today goes back to now; tomorrow lands on tomorrow's train at this time of day (tomorrowAt), and
  // then the ruler is tomorrow's. Past midnight tomorrow is today, and the sheets follow. Redrawn only when the day or
  // the date changes, so a sheet keeps the focus
  const days = byId('days');
  let daysHtml = '';
  const longDay = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('ca-ES', { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' });
  function setDays(today: string, tom: boolean){
    const tw = addDays(today, 1);
    const sheet = (key: string, word: string, iso: string, on: boolean) =>
      `<button type="button" class="full${on ? ' on' : ''}" data-dia="${key}" aria-pressed="${on}" aria-label="${word}, ${longDay(iso)}">`
      + `<span class="pp" aria-hidden="true"><i>${word.toLowerCase()}</i> <b>${+iso.slice(8)}</b></span></button>`;
    const html = sheet('avui', 'Avui', today, !tom) + sheet('dema', 'Demà', tw, tom);
    if(html === daysHtml) return;
    const had = days.querySelector<HTMLElement>(':focus')?.dataset.dia;
    days.innerHTML = daysHtml = html;
    if(had) days.querySelector<HTMLElement>(`[data-dia="${had}"]`)?.focus({preventScroll:true});
  }
  days.addEventListener('click', e=>{
    const b = (e.target as Element).closest<HTMLElement>('.full'); if(!b) return;
    if(b.dataset.dia === 'avui'){ state.useNow = true; state.day = null; state.ave = false; }
    else Object.assign(state, { useNow: false, ...tomorrowAt(madridNow(), state) });
    render();
  });
  // the day of a train picked on the ruler: the ruler's day, tomorrow's when tomorrow is looked at
  const rulerDay = () => tomorrow ? addDays(madridNow().date, 1) : null;
  // a trip of the board keeps its day (tomorrow's stays tomorrow's)
  function pick(m: number, ave = false, day: string | null = null){ state.useNow = false; state.minute = m; state.ave = ave; state.day = day; render(); }
  nowBtn.addEventListener('click', ()=>{ state.useNow = true; render(); tIn.focus({preventScroll:true}); });
  // the chosen trip becomes the big one: the focus moves to the ruler, which now stands on it
  // on a phone, any trip opens the sheet with its detail, after becoming the train shown
  byId('board').addEventListener('click', e=>{
    const b = (e.target as Element).closest<HTMLElement>('.tt, button.big'); if(!b) return;
    if(b.matches('.tt')) pick(+b.dataset.m!, 'ave' in b.dataset, b.dataset.d!);
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
    const v = +tIn.value; if(!marks.length) return;
    const near = marks.reduce((b, x) => Math.abs(x.dep-v) < Math.abs(b.dep-v) ? x : b, marks[0]);
    state.useNow = false; state.minute = near.dep; state.ave = near.ave; state.day = rulerDay();
    if(!rq) rq = requestAnimationFrame(()=>{ rq=0; render(); });
  }
  tIn.addEventListener('input', snap); tIn.addEventListener('change', snap); tIn.addEventListener('pointerup', ()=> setTimeout(snap, 0));
  // keys step from train to train, AVE included
  tIn.addEventListener('keydown', e=>{
    const cur = +tIn.value, i = marks.findIndex(x => x.dep === cur && x.ave === state.ave && !state.useNow);
    let next: Mark | undefined;
    if(e.key==='ArrowRight' || e.key==='ArrowUp') next = i >= 0 ? marks[i+1] : marks.find(x => x.dep > cur);
    else if(e.key==='ArrowLeft' || e.key==='ArrowDown') next = i >= 0 ? marks[i-1] : [...marks].reverse().find(x => x.dep < cur);
    else if(e.key==='Home') next = marks[0];
    else if(e.key==='End') next = marks[marks.length-1];
    else return;
    e.preventDefault(); if(next) pick(next.dep, next.ave, rulerDay());
  });
  // one ticket with both ends of the trip; the arrows turn it around. The town end opens the town chooser, Barcelona's
  // end the station chooser. The swap and both ends are rebuilt on every render() (route()), so
  // their listeners are delegated on the container instead of attached to elements that get replaced
  byId('tickets').innerHTML = `
    <div class="tk" style="--cut:${cut(7)}">
      <span class="pp"><span class="k">Bitllet</span>
      <span class="route"></span></span><span class="stub" aria-hidden="true"></span><span class="fecha" aria-hidden="true"></span>
    </div>`;
  const detail = setupDetail(), notice = setupNotice();
  const chooser = setupChooser(
    id => { state.town = id; again(); byId('tickets').querySelector<HTMLElement>('.end.town')?.focus(); },
    id => { state.station = id; again(); byId('tickets').querySelector<HTMLElement>('.end.bcn')?.focus(); });
  // a new town or station starts again from now, on the day looked at
  function again(){
    if(tomorrow) Object.assign(state, { useNow: false, ...tomorrowAt(madridNow(), state) });
    else { state.useNow = true; state.ave = false; }
    render();
  }
  byId('tickets').addEventListener('click', e=>{
    const t = e.target as HTMLElement;
    if(t.closest('.swap')){ state.dir = state.dir==='casa' ? 'bcn' : 'casa'; render(); if(world) world.resize(); }
    else if(t.closest('.end.town')) chooser.open();
    else if(t.closest('.end.bcn')) chooser.openStation();
    else if(t.closest('.segell')) notice.open(shownNotices, avisos.read());
  });
  // on the minute, like the clock: the countdown, «ara» and the clock's hands move together (away from now too)
  const tick = () => { render(); setTimeout(tick, Math.max(1000, 60050 - Date.now() % 60000)); };
  setTimeout(tick, Math.max(1000, 60050 - Date.now() % 60000));
  // Renfe's licence asks for its exact words, in Spanish (data.renfe.com/legal); the rest is ours. The live delays
  // (Renfe's real-time feed) and the weather (Open-Meteo) are CC BY 4.0
  byId('fuente').textContent = `${source.fuente}. Horaris ${dateSpan(firstDay(), lastDay())}. Retards en directe: Renfe, CC BY 4.0. Temps: Open-Meteo, CC BY 4.0.`;
  return { render };
}
