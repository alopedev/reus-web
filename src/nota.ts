// the line under the highlighted time on a phone is one line, always (25-11, Àlex's video from his iPhone): empty, one
// line or two («en 3 min · baixa a Camp de Tarragona · sense dades»), it made the window grow and shrink as the finger
// slid along the ruler. What does not fit leaves, least needed first (Àlex, 25-11, B of two): «sense dades» (3), the
// countdown (2), the bus (1); where a fast train arrives when it is not the town (0), never. All of it is still in the
// train's sheet («Agafa’l») and in what a screen reader hears of the row

// which pieces stay, in order: widths of the pieces, their priority (0 never leaves), the width of « · » and the room
export function fit(widths: number[], prio: number[], sep: number, room: number): number[] {
  const keep = widths.map((_, i) => i);
  const width = () => keep.reduce((s, i) => s + widths[i], 0) + sep * Math.max(0, keep.length - 1);
  while(width() > room){
    let out = -1;
    for(const i of keep) if(prio[i] > 0 && (out < 0 || prio[i] > prio[out])) out = i;
    if(out < 0) break;
    keep.splice(keep.indexOf(out), 1);
  }
  return keep;
}

// the board's sentence on the page: its pieces (board.ts, data-p) and the « · » between them, hidden where they do not fit
export function fitNote(nota: HTMLElement | null){
  if(!nota) return;
  const parts = [...nota.querySelectorAll<HTMLElement>('[data-p]')], seps = [...nota.querySelectorAll<HTMLElement>('.sep')];
  if(!parts.length) return;
  for(const e of [...parts, ...seps]) e.hidden = false;
  const room = nota.clientWidth, sep = seps[0]?.getBoundingClientRect().width ?? 0;
  const keep = fit(parts.map(p => p.getBoundingClientRect().width), parts.map(p => Number(p.dataset.p)), sep, room);
  parts.forEach((p, i) => { p.hidden = !keep.includes(i); });
  // a dot only between two pieces left
  seps.forEach((s, i) => { s.hidden = !keep.includes(i) || !keep.some(k => k > i); });
}
