import './styles/chooser.css';
import { GROUPS, LINE, type Group } from './towns';
import { state } from './state';
import { byId } from './dom';
import { NET, BCN, hasAve } from './time';
import { rag } from './paper';

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
    return where ? `la ${l} (${where})` : `la ${l}`;
  });
  const ave = hasAve(state.town) && NET.trenes.some(t => t.p === 'AVE' && t.s.some(x => x[0] === id)) ? ' y el AVE' : '';
  return (miss.length ? `Todas menos ${miss.join(' y ')}` : 'Todas las líneas') + ave;
}

// the pueblo chooser: a paper sheet over the darkened scene (native <dialog>, so Esc, focus-trapping and the
// inert backdrop all come from the browser). Two steps: corridor, then the line's towns. The same sheet, with a
// single step, chooses the Barcelona station (3.5)
export function setupChooser(onPick: (id: string) => void, onStation: (id: string) => void): Chooser {
  const dialog = byId<HTMLDialogElement>('selp');
  let group: Group | null = null, picking = false, station = false;

  const question = () => state.dir === 'casa' ? '¿A qué pueblo vas?' : '¿Desde qué pueblo vuelves?';
  // the pills in line-number order (R14 over R15), as in the prototype; the strip itself starts with the main line
  const pills = (g: Group) => [...g.lines].sort().map(l => `<span class="pill" style="--c:${LINE[l]}">${l}</span>`).join('');

  function stepGroups(): string {
    return `<h3 id="selpH">${question()}</h3><div class="lns">${GROUPS.map(g =>
      `<button type="button" class="ln" data-group="${g.key}"><span class="pills">${pills(g)}</span><span>${esc(g.label)}</span></button>`).join('')}</div>`;
  }
  function stepTowns(g: Group): string {
    const rows = g.towns.map(t => `<li class="${t.line !== g.lines[0] ? 'branch' : ''}" style="--c:${LINE[t.line]}">
      <button type="button" class="opt" data-town="${t.id}"${t.id === state.town ? ' aria-current="true"' : ''}>${esc(t.name)}</button></li>`).join('');
    return `<button type="button" class="back">‹ Líneas</button><h3 id="selpH">${question()}</h3><ol class="strip" style="--c:${LINE[g.lines[0]]}">${rows}</ol>`;
  }
  function stepStations(): string {
    const q = state.dir === 'casa' ? '¿Desde qué estación de Barcelona sales?' : '¿A qué estación de Barcelona llegas?';
    return `<h3 id="selpH">${q}</h3><div class="ests">${BCN.map(s =>
      `<button type="button" class="est" data-station="${s.id}"${s.id === state.station ? ' aria-current="true"' : ''}>`
      + `<span class="n">${esc(s.name)}</span> <span class="d">${reach(s.id)}</span></button>`).join('')}</div>`;
  }
  // the sheet is cut with scissors like the ticket: the shadow sits on .sheet, the ragged paper is .pp
  const edge = `--cut:${rag(11)}`;
  function draw(): void {
    const body = station ? stepStations() : group ? stepTowns(group) : stepGroups();
    dialog.innerHTML = `<div class="sheet"><div class="pp" style="${edge}"><button type="button" class="x" aria-label="Cerrar">✕</button>${body}</div></div>`;
  }
  const focusSel = (sel: string) => dialog.querySelector<HTMLElement>(sel)?.focus();

  function open(): void {
    picking = false; group = null; station = false;
    draw();
    dialog.showModal();
    focusSel('.ln');
  }
  function openStation(): void {
    picking = false; group = null; station = true;
    draw();
    dialog.showModal();
    focusSel(`.est[data-station="${state.station}"]`);
  }
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t === dialog){ dialog.close(); return; }                          // the backdrop: dialog itself, outside .sheet
    if(t.closest('.x')){ dialog.close(); return; }
    if(t.closest('.back')){ const from = group!.key; group = null; draw(); focusSel(`.ln[data-group="${from}"]`); return; }
    const ln = t.closest<HTMLElement>('.ln[data-group]');
    if(ln){ group = GROUPS.find(g => g.key === ln.dataset.group) ?? null; draw();
      focusSel(group!.towns.some(x => x.id === state.town) ? `.opt[data-town="${state.town}"]` : '.opt'); return; }
    const opt = t.closest<HTMLElement>('.opt[data-town]');
    if(opt){ picking = true; const id = opt.dataset.town!; dialog.close(); onPick(id); return; }
    const est = t.closest<HTMLElement>('.est[data-station]');
    if(est){ picking = true; const id = est.dataset.station!; dialog.close(); onStation(id); }
  });
  // Esc and the backdrop close the dialog through the browser's own 'cancel'/'close' handling; picking a town
  // also closes it (above) but has already told the caller, so only an unpicked close returns the focus here
  dialog.addEventListener('close', () => { if(!picking) byId('tickets').querySelector<HTMLElement>(station ? '.end.bcn' : '.end.town')?.focus(); });
  return { open, openStation };
}
