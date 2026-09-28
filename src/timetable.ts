import { reduce, state } from './state';
import { madridNow, addDays, hhmm, dur, dayData, lastDay, source, type Train } from './time';

// each line's colour, as Renfe paints it; the AVE in the carriage's dark ink
const LINE: Record<string, string> = { R11:'#0064A7', R13:'#E52782', R14:'#6A2C91', R15:'#9B7B5A', R16:'#B8114E', R17:'#F39700' };
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
    const ida = state.dir==='reus';
    const from = ida ? 'Sants' : 'Reus', to = ida ? 'Reus' : 'Barcelona Sants';
    let {d, exact} = dayData(now.date);
    today = [...(ida ? d.r : d.b).map(t => ({t, ave:false})), ...(ida ? d.ar : d.ab).map(t => ({t, ave:true}))].sort((x, y) => x.t[0]-y.t[0]);
    const after = (list: Train[]) => list.filter(([dep]) => dep >= start + (state.useNow?2:0));
    let regs = after(ida ? d.r : d.b), aves = after(ida ? d.ar : d.ab), tomorrow = false;
    if(!regs.length){ ({d, exact} = dayData(addDays(now.date,1))); regs = ida ? d.r : d.b; aves = ida ? d.ar : d.ab; tomorrow = true; }
    // the train shown: the one chosen, or the next regional; the board adds the next ones and the next AVE
    const ave = aves[0], isAve = !state.useNow && !tomorrow && state.ave && ave?.[0] === start;
    const a = isAve ? ave : regs[0];
    const live = state.useNow && !tomorrow;
    byId('lbl').textContent = tomorrow ? 'Hoy ya no quedan · mañana' : '';
    // the ruler has one mark: the knob always stands on the train shown (every tick is a train, the AVE its own
    // mark); now is a thin line with its word
    byId('ticks').innerHTML = today.map(({t, ave:v})=>`<i class="${v ? 'ave' : ''}${!tomorrow && v===isAve && t[0]===a[0] ? ' on' : ''}" style="left:${pos(t[0])}"></i>`).join('')
      + `<b class="nowline" style="left:${pos(now.min)}"><span>ahora</span></b>`;
    tIn.value = String(tomorrow ? Math.min(R1, Math.max(R0, now.min)) : a[0]);
    // «Volver a ahora» stands on the side of the ruler away from «ahora», so it never covers the word
    nowBtn.parentElement!.classList.toggle('left', now.min > (R0+R1)/2);
    tIn.setAttribute('aria-valuetext', tomorrow ? 'no quedan trenes hoy' : `${isAve ? 'AVE' : 'tren'} de las ${hhmm(a[0])}`);
    nowBtn.hidden = state.useNow;
    if(world) world.setTime(tomorrow ? a[0] : start);
    table.setTime(tomorrow ? a[0] : start);
    const trips = [...regs.slice(0, ave ? 2 : 3), ...(ave ? [ave] : [])].sort((x, y) => x[0]-y[0]);
    const html = trips.map(t => trip(t, t === a, t === ave, live ? dur(t[0]-now.min) : '')).join('');
    const turn = shown !== null && shown !== a[0] + state.dir + isAve;
    if(html !== drawn || turn){ byId('board').innerHTML = drawn = html; if(turn && !reduce) byId('dep').classList.add('swap'); }
    if(shown !== a[0] + state.dir + isAve){ say(tomorrow, isAve ? (ida ? 'Sants' : 'Camp de Tarragona') : from, isAve ? (ida ? 'Camp de Tarragona' : 'Barcelona Sants') : to, a, isAve); shown = a[0] + state.dir + isAve; }
    ends[0].textContent = from; ends[1].textContent = ida ? 'Reus' : 'Sants';
    byId('note').textContent = exact ? '' : 'Horario aproximado: aún no hay horario oficial de este día.';
    if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
  }
  // one trip of the board: line, departure, where (the countdown, or Camp de Tarragona for the AVE), arrival.
  // The train shown is big; the others are buttons that show them
  function trip(t: Train, big: boolean, isAve: boolean, until: string){
    const where = isAve ? 'Camp de Tarragona' : big ? `<span class="soon">${until && 'en ' + until}</span>` : '';
    // spaces between the cells: the grid ignores them, but the text (and a screen reader) keeps its words apart
    const cells = `<span class="pill" style="--c:${LINE[t[3]] ?? 'var(--shadow)'}">${t[3]}</span> <span class="t"${big ? ' id="dep"' : ''}>${hhmm(t[0])}</span> `
      + `<span class="w">${where}</span> <span class="t arr">→ ${hhmm(t[1])}</span>`;
    if(big) return `<div class="trip big">${cells}</div>`;
    const label = `${isAve ? 'AVE' : t[3]} de las ${hhmm(t[0])}${isAve ? (state.dir==='reus' ? ' a' : ' desde') + ' Camp de Tarragona' : ''}, llega a las ${hhmm(t[1])}`;
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
  // one ticket with both ends of the trip; ⇄ turns it around. The ends will open their lists (the town, Barcelona's
  // stations): until then they are plain text, never a button that does nothing
  byId('tickets').innerHTML = `
    <div class="tk" style="--cut:${cut(7)}">
      <span class="pp"><span class="k">Billete</span>
      <span class="route"><span class="end"></span> <button type="button" class="swap" aria-label="Cambiar el sentido">⇄</button> <span class="end"></span></span></span><span class="stub" aria-hidden="true"></span>
    </div>`;
  const ends = byId('tickets').querySelectorAll<HTMLElement>('.end');
  byId('tickets').querySelector('.swap')!.addEventListener('click', ()=>{
    state.dir = state.dir==='reus' ? 'bcn' : 'reus'; render();
    if(world) world.resize();
  });
  setInterval(()=>{ if(state.useNow) render(); }, 30000);
  { const day = (iso: string) => new Date(iso+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    byId('hasta').textContent = `Horarios cargados hasta el ${day(lastDay())}; los días siguientes se aproximan.`;
    byId('fuente').textContent = `${source.fuente}, ${day(source.actualizado)}.`; }
  return { render };
}
