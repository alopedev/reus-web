import './styles/chooser.css';
import { GROUPS, LINE, lineStyle, type Group } from './towns';
import { state } from './state';
import { byId } from './dom';
import { NET, BCN, hasAve } from './time';
import { rag } from './paper';
import { closeSheet, closesSoftly, still } from './sheet';

export interface Chooser { open(): void; openStation(): void }

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// what each Barcelona station misses, read from the data: França has no R11 (named by its corridor's first town).
// The AVE leaves only from Sants, so it is said only there, and only for a town the AVE serves
function reach(id: string): string {
  const regional = (id: string) => (NET.estaciones[id]?.lineas ?? []).filter(l => l.startsWith('R'));
  const all = [...new Set(BCN.flatMap(s => regional(s.id)))].sort();
  const has = new Set(regional(id));
  const miss = all.filter(l => !has.has(l)).map(l => {
    const where = GROUPS.find(g => g.lines.includes(l))?.label.split(' · ')[0];
    return where ? `l’${l} (${where})` : `l’${l}`;
  });
  const ave = hasAve(state.town) && NET.trenes.some(t => t.p === 'AVE' && t.s.some(x => x[0] === id)) ? ' i l’AVE' : '';
  return (miss.length ? `Totes menys ${miss.join(' i ')}` : 'Totes les línies') + ave;
}

// the pueblo chooser: a paper sheet over the darkened scene (native <dialog>, so Esc, focus-trapping and the
// inert backdrop all come from the browser). Two steps: corridor, then the line's towns. The same sheet, with a
// single step, chooses the Barcelona station (3.5)
export function setupChooser(onPick: (id: string) => void, onStation: (id: string) => void): Chooser {
  const dialog = byId<HTMLDialogElement>('selp');
  let group: Group | null = null, station = false, picked = false;

  const question = () => state.dir === 'casa' ? 'On vas?' : 'D’on tornes?';
  // the pills in line-number order (R14 over R15), as in the prototype; the strip itself starts with the main line
  const pills = (g: Group) => [...g.lines].sort().map(l => `<span class="pill" style="${lineStyle(l)}">${l}</span>`).join('');

  function stepGroups(): string {
    return `<h3 id="selpH">${question()}</h3><div class="lns">${GROUPS.map(g =>
      `<button type="button" class="ln" data-group="${g.key}"><span class="pills">${pills(g)}</span><span>${esc(g.label)}</span></button>`).join('')}</div>`;
  }
  function stepTowns(g: Group): string {
    const rows = g.towns.map(t => `<li class="${t.line !== g.lines[0] ? 'branch' : ''}" style="--c:${LINE[t.line]}">
      <button type="button" class="opt" data-town="${t.id}"${t.id === state.town ? ' aria-current="true"' : ''}>${esc(t.name)}</button></li>`).join('');
    return `<button type="button" class="back">‹ Línies</button><h3 id="selpH">${question()}</h3><ol class="strip" style="--c:${LINE[g.lines[0]]}">${rows}</ol>`;
  }
  function stepStations(): string {
    const q = state.dir === 'casa' ? 'De quina estació surts?' : 'A quina estació arribes?';
    return `<h3 id="selpH">${q}</h3><div class="ests">${BCN.map(s =>
      `<button type="button" class="est" data-station="${s.id}"${s.id === state.station ? ' aria-current="true"' : ''}>`
      + `<span class="n">${esc(s.name)}</span> <span class="d">${reach(s.id)}</span></button>`).join('')}</div>`;
  }
  // the sheet is cut with scissors like the ticket: the shadow sits on .sheet, the ragged paper is .pp
  const edge = `--cut:${rag(11)}`;
  // a step turns like a page (option B, Àlex 20-10): the old page is left where it was, inert, and slides away to one
  // side while the new one comes in from the other (forward, from the right). With reduced motion it just changes
  function draw(dir = 0): void {
    const body = station ? stepStations() : group ? stepTowns(group) : stepGroups();
    const old = dir && dialog.open && !still() ? dialog.querySelector<HTMLElement>('.sheet:not(.va)') : null;
    if(old){
      const d = dialog.getBoundingClientRect();
      Object.assign(old.style, {position: 'fixed', margin: '0', left: `${d.left + old.offsetLeft}px`, top: `${d.top + old.offsetTop}px`, width: `${old.offsetWidth}px`});
      old.classList.add('va'); old.inert = true;
      const gone = (): void => old.remove();
      old.addEventListener('animationend', gone, {once: true}); setTimeout(gone, 600);
    }
    dialog.querySelectorAll('.sheet:not(.va)').forEach(s => s.remove());
    dialog.classList.toggle('pas', !!old); dialog.classList.toggle('enrere', dir < 0);
    dialog.insertAdjacentHTML('beforeend', `<div class="sheet"><div class="pp" style="${edge}"><button type="button" class="x" aria-label="Tancar">✕</button>${body}</div></div>`);
  }
  const focusSel = (sel: string) => dialog.querySelector<HTMLElement>(sel)?.focus();

  function open(): void {
    group = null; station = false;
    dialog.replaceChildren(); draw();
    dialog.showModal();
    focusSel('.ln');
  }
  function openStation(): void {
    group = null; station = true;
    dialog.replaceChildren(); draw();
    dialog.showModal();
    focusSel(`.est[data-station="${state.station}"]`);
  }
  // it leaves the way paper would (sheet.ts): a tap outside, Esc or ✕ send it back down before it closes
  closesSoftly(dialog);
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t.closest('.x')){ closeSheet(dialog); return; }
    if(t.closest('.back')){ const from = group!.key; group = null; draw(-1); focusSel(`.ln[data-group="${from}"]`); return; }
    const ln = t.closest<HTMLElement>('.ln[data-group]');
    if(ln){ group = GROUPS.find(g => g.key === ln.dataset.group) ?? null; draw(1);
      focusSel(group!.towns.some(x => x.id === state.town) ? `.opt[data-town="${state.town}"]` : '.opt'); return; }
    const opt = t.closest<HTMLElement>('.opt[data-town]');
    if(opt){ picked = true; closeSheet(dialog); onPick(opt.dataset.town!); return; }
    const est = t.closest<HTMLElement>('.est[data-station]');
    if(est){ picked = true; closeSheet(dialog); onStation(est.dataset.station!); }
  });
  // once it has gone (the page behind is inert until then), the focus goes back to the ticket's end that opened it,
  // rebuilt by then if a town or a station was picked, and then stamped on the ticket (option B, Àlex 20-10)
  dialog.addEventListener('close', () => {
    const end = byId('tickets').querySelector<HTMLElement>(station ? '.end.bcn' : '.end.town');
    end?.focus();
    if(picked && end && !still()){ end.classList.add('estampat'); end.addEventListener('animationend', () => end.classList.remove('estampat'), {once: true}); }
    picked = false;
  });
  return { open, openStation };
}
