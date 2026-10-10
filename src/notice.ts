import './styles/notice.css';
import { byId } from './dom';
import { rag } from './paper';
import { LINE } from './towns';
import { gist } from './avisos';

// how the lines' notices show (09-10, Àlex): on a desktop, an ink stamp on the ticket when a line of the board has a
// notice (option A), which opens a sheet with the whole text; on a phone nothing on the board, and the train's own
// sheet (#detalle) says what is known of its line: a notice, none, or that it could not be asked
export const MORE = 'https://rodalies.gencat.cat/ca/';
const FROM = 'Avisos: Generalitat de Catalunya. No substitueix la informació oficial.';

export type Notice = { line: string, text: string };
// what the train's sheet says of its line: pending until the first answer, «ave» for the AVE, which has no notices
export type LineNews = { kind: 'avis', line: string, text: string, read: string } | { kind: 'normal', line: string, read: string }
  | { kind: 'error' | 'pending', line: string } | { kind: 'ave' };

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const pill = (l: string) => `<span class="pill" style="--c:${LINE[l] ?? 'var(--shadow)'}">${esc(l)}</span>`;
// a time read by the function, in Madrid: «11:30»
export const at = (iso: string): string => new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

// the same text on two lines (R13 and R14 share a stretch) is said once
const grouped = (ns: Notice[]): { lines: string[], text: string }[] => {
  const out: { lines: string[], text: string }[] = [];
  for(const n of ns){ const g = out.find(x => x.text === n.text); if(g) g.lines.push(n.line); else out.push({ lines: [n.line], text: n.text }); }
  return out;
};

// the stamp's words: «Avís R13 · R14» and what happens, in a few words
export function stamp(ns: Notice[]): string {
  const lines = ns.map(n => n.line).join(' · ');
  return `<button type="button" class="segell" aria-haspopup="dialog" aria-label="Avís de la Generalitat a ${ns.map(n => 'l’' + n.line).join(' i ')}: ${gist(ns[0].text)}. Veure l’avís">`
    + `Avís ${lines}<small>${gist(ns[0].text)} ›</small></button>`;
}
// what a screen reader hears when a notice appears or changes
export const heard = (ns: Notice[]): string => grouped(ns).map(g => `Avís de la Generalitat a ${g.lines.map(l => 'l’' + l).join(' i ')}: ${gist(g.text)}.`).join(' ');

// the train's sheet on a phone: its line's notice, or a line that says there is none, or that nobody knows
export function news(n: LineNews): string {
  const link = `<a class="mes" href="${MORE}" target="_blank" rel="noopener">Més a rodalies.gencat.cat ↗<span class="sr"> (s’obre en una altra pestanya)</span></a>`;
  if(n.kind === 'avis') return `<div class="avisos avis"><p class="k">${pill(n.line)} Avís de la Generalitat</p><p class="txt">${esc(n.text)}</p>`
    + `<p class="qui">Consultat a les ${at(n.read)}. ${link}</p><p class="qui">${FROM}</p></div>`;
  const say = n.kind === 'ave' ? 'De l’AVE no tenim avisos.'
    : n.kind === 'normal' ? `Sense avisos a l’${esc(n.line)} (consultat a les ${at(n.read)}).`
    : n.kind === 'error' ? `No hem pogut consultar els avisos de l’${esc(n.line)}.`
    : `Consultant els avisos de l’${esc(n.line)}…`;
  return `<p class="avisos">${say}</p>`;
}

// the sheet the stamp opens on a desktop: a native <dialog> cut like the chooser's, every notice of the board
export function setupNotice(): { open(ns: Notice[], read: string | null): void } {
  const dialog = byId<HTMLDialogElement>('avis');
  const edge = `--cut:${rag(17)}`;
  function open(ns: Notice[], read: string | null){
    const body = grouped(ns).map(g => `<div class="nota"><p class="k">${g.lines.map(pill).join(' ')}</p><p class="txt">${esc(g.text)}</p></div>`).join('');
    dialog.innerHTML = `<div class="sheet"><div class="pp" style="${edge}"><button type="button" class="x" aria-label="Tancar">✕</button>`
      + `<h3 id="avisH">Avís de la Generalitat</h3>${body}`
      + `<p class="qui">${read ? `Consultat a les ${at(read)}. ` : ''}<a class="mes" href="${MORE}" target="_blank" rel="noopener">Més a rodalies.gencat.cat ↗<span class="sr"> (s’obre en una altra pestanya)</span></a></p>`
      + `<p class="qui">${FROM}</p></div></div>`;
    dialog.showModal();
  }
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t === dialog || t.closest('.x')) dialog.close();
  });
  dialog.addEventListener('close', () => byId('tickets').querySelector<HTMLElement>('.segell')?.focus({ preventScroll: true }));
  return { open };
}
