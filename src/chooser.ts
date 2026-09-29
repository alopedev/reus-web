import './styles/chooser.css';
import { GROUPS, LINE, type Group } from './towns';
import { state } from './state';
import { byId } from './dom';

export interface Chooser { open(): void }

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// the pueblo chooser: a paper sheet over the darkened scene (native <dialog>, so Esc, focus-trapping and the
// inert backdrop all come from the browser). Two steps: corridor, then the line's towns
export function setupChooser(onPick: (id: string) => void): Chooser {
  const dialog = byId<HTMLDialogElement>('selp');
  let group: Group | null = null, picking = false;

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
  function draw(): void {
    dialog.innerHTML = `<div class="sheet"><button type="button" class="x" aria-label="Cerrar">✕</button>${group ? stepTowns(group) : stepGroups()}</div>`;
  }
  const focusSel = (sel: string) => dialog.querySelector<HTMLElement>(sel)?.focus();

  function open(): void {
    picking = false; group = null;
    draw();
    dialog.showModal();
    focusSel('.ln');
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
    if(opt){ picking = true; const id = opt.dataset.town!; dialog.close(); onPick(id); }
  });
  // Esc and the backdrop close the dialog through the browser's own 'cancel'/'close' handling; picking a town
  // also closes it (above) but has already told the caller, so only an unpicked close returns the focus here
  dialog.addEventListener('close', () => { if(!picking) byId('tickets').querySelector<HTMLElement>('.end.town')?.focus(); });
  return { open };
}
