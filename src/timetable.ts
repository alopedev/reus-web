import { reduce, state } from './state';
import { madridNow, addDays, hhmm, dur, dayData, lastDay, source, NET, BCN, bcnName, type Train } from './time';
import { LINE } from './towns';
import { setupChooser } from './chooser';
import { byId } from './dom';
import type { World } from './world';
import type { Table } from './table';
import type { Scenery } from './scenery';

// the hero's timetable: the next train, the ticket for the direction, the ruler of the day
export function setupTimetable({ world, table, scenery }: { world: World | null, table: Table, scenery: Scenery }): { render(): void } {
  const tIn = byId<HTMLInputElement>('t'), nowBtn = byId<HTMLButtonElement>('nowBtn');
  const R0 = 300, R1 = 1439, pos = (m: number) => ((Math.min(R1,Math.max(R0,m))-R0)/(R1-R0)*100).toFixed(2)+'%';
  byId('hours').innerHTML = [6,9,12,15,18,21].map(x=>`<span style="left:${pos(x*60)}">${x} h</span>`).join('');
  // today's trains on the ruler, regionals and AVE together in order of departure
  let today: {t: Train, ave: boolean}[] = [], shown: string | null = null, drawn = '';
  function render(){
    const now = madridNow();
    const start = state.useNow ? now.min : state.minute ?? now.min;
    const ida = state.dir==='casa';
    const townName = NET.estaciones[state.town].nombre;
    const bcn = bcnName(state.station);
    const from = ida ? bcn : townName, to = ida ? townName : `Barcelona ${bcn}`;
    setRoute(route(ida, townName));
    let {d, exact} = dayData(now.date, state.town, state.station);
    today = [...(ida ? d.r : d.b).map(t => ({t, ave:false})), ...(ida ? d.ar : d.ab).map(t => ({t, ave:true}))].sort((x, y) => x.t[0]-y.t[0]);
    const after = (list: Train[]) => list.filter(([dep]) => dep >= start + (state.useNow?2:0));
    let regs = after(ida ? d.r : d.b), aves = after(ida ? d.ar : d.ab), tomorrow = false;
    // no regional left today: tomorrow's first ones, after the AVE still to come today, if there is one
    const lastAve = regs.length ? undefined : aves[0];
    if(!regs.length){ ({d, exact} = dayData(addDays(now.date,1), state.town, state.station)); regs = ida ? d.r : d.b; aves = ida ? d.ar : d.ab; tomorrow = !lastAve; }
    // safety net (decision 3): no direct train at all today nor tomorrow in this direction. Only reachable for a
    // town whose only trains run on days the frozen or newly-generated timetable does not cover
    const none = !lastAve && !regs.length && !aves.length;
    if(none){
      byId('lbl').textContent = noTrain(from, to, now.date);
      byId('ticks').innerHTML = `<b class="nowline${now.min < R0 + 60 ? ' start' : now.min > R1 - 60 ? ' end' : ''}" style="left:${pos(now.min)}"><span>ahora</span></b>`;
      tIn.value = String(Math.min(R1, Math.max(R0, now.min)));
      nowBtn.parentElement!.classList.toggle('left', now.min > (R0+R1)/2);
      tIn.setAttribute('aria-valuetext', 'sin tren directo hoy ni mañana');
      nowBtn.hidden = state.useNow;
      if(world) world.setTime(now.min);
      table.setTime(now.min);
      byId('board').innerHTML = drawn = '';
      if(shown !== 'none' + state.station + state.town + state.dir){ byId('aviso').textContent = noTrain(from, to, now.date); shown = 'none' + state.station + state.town + state.dir; }
      byId('note').textContent = exact ? '' : 'Horario aproximado: aún no hay horario oficial de este día.';
      if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
      return;
    }
    // the train shown: the one chosen, or the next regional (today's last AVE when none is left); the board adds
    // the next ones and the next AVE
    const ave = lastAve ?? aves[0], isAve = lastAve ? true : !state.useNow && !tomorrow && state.ave && ave?.[0] === start;
    const a = isAve ? ave : regs[0];
    const live = state.useNow && !tomorrow;
    byId('lbl').textContent = lastAve ? 'Hoy ya no quedan regionales' : tomorrow ? 'Hoy ya no quedan · mañana' : '';
    // the ruler has one mark: the knob always stands on the train shown (every tick is a train, the AVE like the
    // rest); now is a thin line with its word
    byId('ticks').innerHTML = today.map(({t, ave:v})=>`<i class="${!tomorrow && v===isAve && t[0]===a[0] ? 'on' : ''}" style="left:${pos(t[0])}"></i>`).join('')
      + `<b class="nowline${now.min < R0 + 60 ? ' start' : now.min > R1 - 60 ? ' end' : ''}" style="left:${pos(now.min)}"><span>ahora</span></b>`;
    tIn.value = String(tomorrow ? Math.min(R1, Math.max(R0, now.min)) : a[0]);
    // «Volver a ahora» stands on the side of the ruler away from «ahora», so it never covers the word
    nowBtn.parentElement!.classList.toggle('left', now.min > (R0+R1)/2);
    tIn.setAttribute('aria-valuetext', tomorrow ? 'no quedan trenes hoy' : `${isAve ? 'AVE' : 'tren'} de las ${hhmm(a[0])}`);
    nowBtn.hidden = state.useNow;
    if(world) world.setTime(tomorrow ? a[0] : start);
    table.setTime(tomorrow ? a[0] : start);
    const trips = lastAve ? [lastAve, ...regs.slice(0, 2)] : [...regs.slice(0, ave ? 2 : 3), ...(ave ? [ave] : [])].sort((x, y) => x[0]-y[0]);
    const html = trips.map(t => trip(t, t === a, t === ave, live ? dur(t[0]-now.min) : '', !!lastAve && t !== lastAve)).join('');
    const key = a[0] + state.dir + isAve + state.town + state.station;
    const turn = shown !== null && shown !== key;
    if(html !== drawn || turn){ byId('board').innerHTML = drawn = html; if(turn && !reduce) byId('dep').classList.add('swap'); }
    if(shown !== key){ say(tomorrow, isAve ? (ida ? bcn : 'Camp de Tarragona') : from, isAve ? (ida ? 'Camp de Tarragona' : `Barcelona ${bcn}`) : to, a, isAve); shown = key; }
    byId('note').textContent = exact ? '' : 'Horario aproximado: aún no hay horario oficial de este día.';
    if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
  }
  // the ticket's route: the town's end is a button (opens the chooser), Sants stays plain text until 3.5;
  // ⇄ turns the order around, so the DOM order matches what is read: «Sants ⇄ Reus» / «Reus ⇄ Sants»
  function route(ida: boolean, townName: string): string {
    const swap = `<button type="button" class="swap" aria-label="Cambiar el sentido">⇄</button>`;
    const townBtn = `<button type="button" class="end town" aria-haspopup="dialog" aria-label="${townName}, cambiar de pueblo">${townName}</button>`;
    const sants = `<span class="end">Sants</span>`;
    return ida ? `${sants} ${swap} ${townBtn}` : `${townBtn} ${swap} ${sants}`;
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
  // one trip of the board: line, departure, where (the countdown, Camp de Tarragona for the AVE, «mañana» after
  // today's last AVE), arrival. The train shown is big; the others are buttons that show them
  // no direct train between this Barcelona station and the town, today nor tomorrow: when another Barcelona station
  // has one (França has no R11), the board names it, so the visitor knows where to go instead (Àlex, 05-10)
  function noTrain(from: string, to: string, iso: string): string {
    const ida = state.dir === 'casa';
    const runs = (st: string) => [iso, addDays(iso, 1)].some(x => { const {d} = dayData(x, state.town, st); return (ida ? d.r : d.b).length > 0; });
    const others = BCN.filter(s => s.id !== state.station && runs(s.id)).map(s => s.name);
    if(!others.length) return `No hay tren directo entre ${from} y ${to} hoy ni mañana.`;
    const town = NET.estaciones[state.town].nombre, bcn = bcnName(state.station);
    const alt = others.length > 1 ? `${others.slice(0, -1).join(', ')} o de ${others[others.length - 1]}` : others[0];
    return ida ? `Desde ${bcn} no hay tren directo a ${town}. Sale de ${alt}.` : `De ${town} no hay tren directo a ${bcn}. Va a ${alt.replace(' o de ', ' o a ')}.`;
  }
  function trip(t: Train, big: boolean, isAve: boolean, until: string, morrow: boolean){
    const soon = big ? `<span class="soon">${until && 'en ' + until}</span>` : '';
    const where = isAve ? (big && until ? `Camp de Tarragona, ${soon}` : 'Camp de Tarragona') : morrow ? 'mañana' : soon;
    // spaces between the cells: the grid ignores them, but the text (and a screen reader) keeps its words apart
    const cells = `<span class="pill" style="--c:${LINE[t[3]] ?? 'var(--shadow)'}">${t[3]}</span> <span class="t"${big ? ' id="dep"' : ''}>${hhmm(t[0])}</span> `
      + `<span class="w">${where}</span> <span class="t arr">→ ${hhmm(t[1])}</span>`;
    if(big) return `<div class="trip big">${cells}</div>`;
    const label = `${isAve ? 'AVE' : t[3]} de las ${hhmm(t[0])}${isAve ? (state.dir==='casa' ? ' a' : ' desde') + ' Camp de Tarragona' : ''}, llega a las ${hhmm(t[1])}`;
    return `<button type="button" class="trip tt" data-m="${t[0]}"${isAve ? ' data-ave' : ''} aria-label="${label}">${cells}</button>`;
  }
  // what a screen reader hears: the train, only when it changes (never the countdown's refresh)
  function say(tomorrow: boolean, from: string, to: string, a: Train, isAve: boolean){
    byId('aviso').textContent = `${tomorrow ? 'Hoy ya no quedan trenes. El primero de mañana' : state.useNow ? 'Próximo tren' : 'Tren elegido'}: ${hhmm(a[0])}, ${isAve ? 'AVE ' : ''}de ${from} a ${to}; llega a las ${hhmm(a[1])}.`;
  }
  function pick(m: number, ave = false){ state.useNow = false; state.minute = m; state.ave = ave; render(); }
  nowBtn.addEventListener('click', ()=>{ state.useNow = true; render(); tIn.focus({preventScroll:true}); });
  // the chosen trip becomes the big one: the focus moves to the ruler, which now stands on it
  byId('board').addEventListener('click', e=>{ const b = (e.target as Element).closest<HTMLElement>('.tt'); if(b){ pick(+b.dataset.m!, 'ave' in b.dataset); tIn.focus({preventScroll:true}); } });
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
  // a ragged scissor cut, different for every ticket, with the two punch notches of the stub
  function cut(seed: number){
    let s = seed; const r = ()=> (s = (s*9301+49297)%233280)/233280;
    const pts: string[] = [], n = 16, j = ()=> (r()*2.4).toFixed(2);
    for(let i=0;i<=n;i++) pts.push(`${(i/n*100).toFixed(2)}% ${j()}%`);
    for(let i=1;i<=4;i++){ const y = i*20; pts.push(`calc(100% - ${j()}%) ${y}%`); }
    for(let i=n;i>=0;i--) pts.push(`${(i/n*100).toFixed(2)}% calc(100% - ${j()}%)`);
    for(let i=4;i>=1;i--){ const y = i*20; pts.push(`${j()}% ${y}%`); }
    return `polygon(${pts.join(',')})`;
  }
  // one ticket with both ends of the trip; ⇄ turns it around. The town end opens the chooser; Barcelona's end
  // stays plain text until 3.5. Both the swap and the town button are rebuilt on every render() (route()), so
  // their listeners are delegated on the container instead of attached to elements that get replaced
  byId('tickets').innerHTML = `
    <div class="tk" style="--cut:${cut(7)}">
      <span class="pp"><span class="k">Billete</span>
      <span class="route"></span></span><span class="stub" aria-hidden="true"></span>
    </div>`;
  const chooser = setupChooser(id => { state.town = id; state.useNow = true; state.ave = false; render(); byId('tickets').querySelector<HTMLElement>('.end.town')?.focus(); });
  byId('tickets').addEventListener('click', e=>{
    const t = e.target as HTMLElement;
    if(t.closest('.swap')){ state.dir = state.dir==='casa' ? 'bcn' : 'casa'; render(); if(world) world.resize(); }
    else if(t.closest('.end.town')) chooser.open();
  });
  setInterval(()=>{ if(state.useNow) render(); }, 30000);
  { const day = (iso: string) => new Date(iso+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    byId('hasta').textContent = `Horarios cargados hasta el ${day(lastDay())}; los días siguientes se aproximan.`;
    byId('fuente').textContent = `${source.fuente}, ${day(source.actualizado)}.`; }
  return { render };
}
