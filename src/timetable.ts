import { reduce, state, type Direction } from './state';
import { madridNow, addDays, hhmm, dur, dayData, lastDay, type Train } from './time';
import { byId, find } from './dom';
import type { World } from './world';
import type { Table } from './table';
import type { Scenery } from './scenery';

// the hero's timetable: the next train, the tickets for the direction, the ruler of the day
export function setupTimetable({ world, table, scenery }: { world: World | null, table: Table, scenery: Scenery }): { render(): void } {
  const tIn = byId<HTMLInputElement>('t'), tOut = byId<HTMLOutputElement>('tOut'), nowBtn = byId<HTMLButtonElement>('nowBtn');
  const R0 = 300, R1 = 1439, pos = (m: number) => ((Math.min(R1,Math.max(R0,m))-R0)/(R1-R0)*100).toFixed(2)+'%';
  byId('hours').innerHTML = [6,9,12,15,18,21].map(x=>`<span style="left:${pos(x*60)}">${x} h</span>`).join('');
  let todayTrains: Train[] = [], shown: string | null = null;
  function render(){
    const now = madridNow();
    const start = state.useNow ? now.min : state.minute ?? now.min;
    const key = state.dir==='reus' ? 'r' : 'b';
    const from = state.dir==='reus' ? 'Sants' : 'Reus', to = state.dir==='reus' ? 'Reus' : 'Barcelona Sants';
    let iso = now.date, {d, exact} = dayData(iso);
    todayTrains = d[key];
    let list = d[key].filter(([dep]) => dep >= start + (state.useNow?2:0)).slice(0,3), tomorrow = false;
    if(!list.length){ iso = addDays(now.date,1); ({d, exact} = dayData(iso)); list = d[key].slice(0,3); tomorrow = true; }
    const [a, ...rest] = list;
    const live = state.useNow && !tomorrow;
    byId('lbl').textContent = state.useNow || tomorrow ? 'Próximo tren' : 'Tren elegido';
    // the ruler: every tick is a train, the chosen one stands taller
    byId('ticks').innerHTML = todayTrains.map(([dep])=>`<i class="${!tomorrow && dep===a[0]?'on':''}" style="left:${pos(dep)}"></i>`).join('');
    tIn.value = String(state.useNow ? Math.min(R1, Math.max(R0, now.min)) : start);
    byId('tLbl').textContent = state.useNow ? 'Son las' : 'Tren de las';
    tOut.textContent = hhmm(state.useNow ? now.min : a[0]);
    tIn.setAttribute('aria-valuetext', tomorrow ? 'no quedan trenes hoy' : `tren de las ${hhmm(a[0])}`);
    nowBtn.hidden = state.useNow;
    if(world) world.setTime(tomorrow ? a[0] : start);
    table.setTime(tomorrow ? a[0] : start);
    byId('soon').innerHTML = tomorrow ? 'Hoy ya no quedan trenes. El primero de mañana' :
      live ? `Sale de ${from} en <strong>${dur(a[0]-now.min)}</strong>` : `Sale de ${from}`;
    const dep = byId('dep');
    if(shown !== a[0] + state.dir){ dep.textContent = hhmm(a[0]); say(tomorrow, from, to, a); if(shown !== null){ dep.classList.remove('swap'); void dep.offsetWidth; dep.classList.add('swap'); } shown = a[0] + state.dir; }
    drawTickets(from, to, a);
    byId('then').innerHTML = rest.length ? `Luego ${rest.map(r=>`<button type="button" class="tt" data-m="${r[0]}" aria-label="Ver el tren de las ${hhmm(r[0])}">${hhmm(r[0])}</button>`).join(' y ')}` : '';
    const prev = !tomorrow && !live ? [...todayTrains].reverse().find(([x]) => x < a[0]) : null;
    byId('prev').innerHTML = prev ? `Anterior <button type="button" class="tt" data-m="${prev[0]}" aria-label="Ver el tren anterior, de las ${hhmm(prev[0])}">${hhmm(prev[0])}</button>` : '';
    byId('note').textContent = exact ? '' : 'Horario aproximado: aún no hay horario oficial de este día.';
    if(world && (!scenery.isPlaying() || reduce)) world.frame(0,0,1);
  }
  // what a screen reader hears: the train, only when it changes (never the countdown's refresh)
  function say(tomorrow: boolean, from: string, to: string, a: Train){
    byId('aviso').textContent = `${tomorrow ? 'Hoy ya no quedan trenes. El primero de mañana' : byId('lbl').textContent}: ${hhmm(a[0])}, de ${from} a ${to}; llega a las ${hhmm(a[1])}.`;
  }
  function pick(m: number){ state.useNow = false; state.minute = m; render(); }
  nowBtn.addEventListener('click', ()=>{ state.useNow = true; render(); tIn.focus({preventScroll:true}); });
  byId('info').addEventListener('click', e=>{ const b = (e.target as Element).closest<HTMLElement>('.tt'); if(b) pick(+b.dataset.m!); });
  // dragging or tapping the ruler lands on the nearest train, never between two
  let rq = 0;
  function snap(){
    const v = +tIn.value; if(!todayTrains.length) return;
    const near = todayTrains.reduce((b,[x]) => Math.abs(x-v) < Math.abs(b-v) ? x : b, todayTrains[0][0]);
    state.useNow = false; state.minute = near;
    if(!rq) rq = requestAnimationFrame(()=>{ rq=0; render(); });
  }
  tIn.addEventListener('input', snap); tIn.addEventListener('change', snap); tIn.addEventListener('pointerup', ()=> setTimeout(snap, 0));
  // keys step from train to train
  tIn.addEventListener('keydown', e=>{
    const shownDep = byId('dep').textContent ?? '';
    const cur = +shownDep.slice(0,2)*60 + +shownDep.slice(3,5);
    const deps = todayTrains.map(([x])=>x); let m: number | undefined;
    if(e.key==='ArrowRight' || e.key==='ArrowUp') m = deps.find(x => x > cur);
    else if(e.key==='ArrowLeft' || e.key==='ArrowDown') m = [...deps].reverse().find(x => x < cur);
    else if(e.key==='Home') m = deps[0];
    else if(e.key==='End') m = deps[deps.length-1];
    else return;
    e.preventDefault(); if(m != null) pick(m);
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
  function drawTickets(from: string, to: string, a: Train){
    const other: {d: Direction, route: string, title: string, to: string} = state.dir==='reus' ? {d:'bcn', route:'Reus → Sants', title:'A Barcelona', to:'Barcelona'} : {d:'reus', route:'Sants → Reus', title:'A Reus', to:'Reus'};
    const mins = a[1]-a[0];
    byId('tickets').innerHTML = `
      <button type="button" class="tk on" aria-pressed="true" style="--cut:${cut(7)}">
        <span class="pp"><span class="k">Billete sencillo, tren directo</span>
        <span class="route">${from} → ${to==='Barcelona Sants'?'Sants':to}</span>
        <span class="row">Llega a las <b>${hhmm(a[1])}</b> · ${dur(mins)}</span></span><span class="stub" aria-hidden="true"></span>
      </button>
      <button type="button" class="tk off" data-d="${other.d}" aria-pressed="false" style="--cut:${cut(23)}" aria-label="Cambiar a ${other.to}">
        <span class="pp"><span class="k">${other.route}</span><span class="route">${other.title}</span></span><span class="stub" aria-hidden="true"></span>
      </button>`;
  }
  byId('tickets').addEventListener('click', e=>{
    const b = (e.target as Element).closest<HTMLElement>('.tk.off'); if(!b) return;
    state.dir = b.dataset.d as Direction; render();
    requestAnimationFrame(()=> find('.tk.off')?.focus({preventScroll:true}));
    if(world) world.resize();
  });
  setInterval(()=>{ if(state.useNow) render(); }, 30000);
  { const last = lastDay();
    byId('hasta').textContent = `Horarios cargados hasta el ${new Date(last+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}; los días siguientes se aproximan.`; }
  return { render };
}
