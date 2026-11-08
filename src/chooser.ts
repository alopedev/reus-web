import './styles/chooser.css';
import { GROUPS, LINE, TOWNS, lineStyle, type Group, type Place } from './towns';
import { find, marks } from './find';
import { PHONE } from './phone';
import { state } from './state';
import { byId } from './dom';
import { NET, BCN, FAST, altOf } from './time';
import { rag } from './paper';
import { closeSheet, closesSoftly, still } from './sheet';
import { esc } from './html';

export interface Chooser { open(): void; openStation(): void }


// what each Barcelona station misses, read from the data: França has no R11 (named by its corridor's first town).
// The fast trains (AV) are said only where one of them leaves for the town, or for its other station (altOf)
function reach(id: string): string {
  const regional = (id: string) => (NET.estaciones[id]?.lineas ?? []).filter(l => l.startsWith('R'));
  const all = [...new Set(BCN.flatMap(s => regional(s.id)))].sort();
  const has = new Set(regional(id));
  const miss = all.filter(l => !has.has(l)).map(l => {
    const where = GROUPS.find(g => g.lines.includes(l))?.label.split(' · ')[0];
    return where ? `l’${l} (${where})` : `l’${l}`;
  });
  const ends = new Set([state.town, altOf(state.town)]);
  const ave = NET.trenes.some(t => t.p === FAST && t.s.some(x => x[0] === id) && t.s.some(x => ends.has(x[0]))) ? ' i l’AV' : '';
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

  // step 1 (option B, Àlex 08-11): a line to write the town on and, below it, the lines; as soon as something is
  // written, the towns it finds take the lines' place (none found: a word to say so, and the lines again)
  function stepGroups(): string {
    return `<h3 id="selpH">${question()}</h3>`
      + `<label class="cerca" for="cercaP"><span class="lbl">Escriu el teu poble</span><span class="camp">`
      + `<input id="cercaP" type="text" inputmode="search" enterkeyhint="go" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Reus, Girona…" aria-controls="trobats">`
      + `<svg class="llapis" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l3.5-1 11-11-2.5-2.5-11 11zM16 5.5l2.5 2.5 2-2-2.5-2.5z"/></svg></span></label>`
      + `<p class="quants" role="status"></p><ol class="hits" id="trobats" hidden></ol>`
      + `<div class="linies"><p class="o">o tria la línia</p><div class="lns">${GROUPS.map(g =>
      `<button type="button" class="ln" data-group="${g.key}"><span class="pills">${pills(g)}</span><span>${esc(g.label)}</span></button>`).join('')}</div></div>`;
  }
  // a town found: its name with what was typed in bold, its comarca under it and its lines on the right
  function hit(t: Place, q: string): string {
    let name = '', at = 0;
    for(const [a, b] of marks(t.name, q)){ name += `${esc(t.name.slice(at, a))}<b>${esc(t.name.slice(a, b))}</b>`; at = b; }
    name += esc(t.name.slice(at));
    return `<li><button type="button" class="hit" data-town="${t.id}"${t.id === state.town ? ' aria-current="true"' : ''}>`
      + `<span class="nm">${name}</span><span class="cm">${esc(t.comarca)}</span>`
      + `<span class="pills">${t.lines.map(l => `<span class="pill" style="${lineStyle(l)}">${l}</span>`).join('')}</span></button></li>`;
  }
  function search(q: string): void {
    const list = dialog.querySelector<HTMLElement>('.hits'), lines = dialog.querySelector<HTMLElement>('.linies'),
      said = dialog.querySelector<HTMLElement>('.quants');
    if(!list || !lines || !said) return;
    const found = find(q, TOWNS);
    list.innerHTML = found.map(t => hit(t, q)).join('');
    list.hidden = !found.length; lines.hidden = !!found.length;
    said.textContent = !q.trim() ? '' : found.length ? `${found.length} ${found.length === 1 ? 'poble' : 'pobles'}`
      : 'Cap poble amb tren directe es diu així. Prova-ho amb una altra paraula, o tria la línia.';
    said.classList.toggle('cap', !!q.trim() && !found.length);
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
    dialog.classList.toggle('pas', !!old); dialog.classList.toggle('enrere', dir < 0); dialog.classList.remove('escriu');
    dialog.insertAdjacentHTML('beforeend', `<div class="sheet"><div class="pp" style="${edge}"><button type="button" class="x" aria-label="Tancar">✕</button>${body}</div></div>`);
  }
  const focusSel = (sel: string) => dialog.querySelector<HTMLElement>(sel)?.focus();

  function open(): void {
    group = null; station = false;
    dialog.replaceChildren(); draw();
    dialog.showModal();
    focusSel(matchMedia(PHONE).matches ? '.ln' : '#cercaP');
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
    const opt = t.closest<HTMLElement>('.opt[data-town], .hit[data-town]');
    if(opt){ picked = true; closeSheet(dialog); onPick(opt.dataset.town!); return; }
    const est = t.closest<HTMLElement>('.est[data-station]');
    if(est){ picked = true; closeSheet(dialog); onStation(est.dataset.station!); }
  });
  dialog.addEventListener('input', e => { if((e.target as HTMLElement).id === 'cercaP') search((e.target as HTMLInputElement).value); });
  // Enter takes the first town found; the down arrow goes down to it
  dialog.addEventListener('keydown', e => {
    if((e.target as HTMLElement).id !== 'cercaP') return;
    const first = dialog.querySelector<HTMLElement>('.hits:not([hidden]) .hit');
    if(e.key === 'Enter' && first){ e.preventDefault(); first.click(); }
    if(e.key === 'ArrowDown' && first){ e.preventDefault(); first.focus(); }
  });
  // on a phone the keyboard covers half the screen: while the field is written in, the sheet goes up to the top of
  // what can be seen (the visual viewport) and fits above the keyboard. It comes down only once the keyboard has
  // gone and nothing is written, so a tap that closes the keyboard still lands where it was aimed
  const vv = window.visualViewport;
  function fit(): void {
    const field = dialog.querySelector<HTMLInputElement>('#cercaP');
    const up = !!field && matchMedia(PHONE).matches && (document.activeElement === field || !!field.value.trim());
    dialog.classList.toggle('escriu', up);
    if(up && vv){ dialog.style.setProperty('--vv', `${vv.height}px`); dialog.style.setProperty('--vvt', `${vv.offsetTop}px`); }
  }
  dialog.addEventListener('focusin', fit);
  vv?.addEventListener('resize', () => { if(dialog.open) fit(); });
  vv?.addEventListener('scroll', () => { if(dialog.open && dialog.classList.contains('escriu')) fit(); });
  // once it has gone (the page behind is inert until then), the focus goes back to the ticket's end that opened it,
  // rebuilt by then if a town or a station was picked, and then stamped on the ticket (option B, Àlex 20-10)
  dialog.addEventListener('close', () => {
    const end = byId('tickets').querySelector<HTMLElement>(station ? '.end.bcn' : '.end.town');
    end?.focus();
    if(picked && end && !still()){ end.classList.add('estampat'); end.addEventListener('animationend', () => end.classList.remove('estampat'), {once: true}); }
    picked = false; dialog.classList.remove('escriu');
  });
  return { open, openStation };
}
