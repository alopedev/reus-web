// a <dialog> that leaves softly (Àlex 20-10, option A for the train's sheet): `closeSheet` adds `.sale`, whose CSS
// runs the sheet's way out, and closes the dialog only once those animations have ended (at most a second later, in
// case one never ends). With reduced motion, or nothing to wait for, it closes at once. `closesSoftly` sends a tap
// on the backdrop and the dialog's cancel (Esc, Android's back gesture) through it. The curves and durations are
// --entra/--entra-ms and --sale/--sale-ms in base.css
const still = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function closeSheet(dialog: HTMLDialogElement): void {
  if(!dialog.open || dialog.classList.contains('sale')) return;
  if(still()){ dialog.close(); return; }
  dialog.classList.add('sale');
  const out = dialog.getAnimations({subtree: true}).filter(a => a.playState === 'running');
  let done = false;
  const end = (): void => {
    if(done) return; done = true;
    dialog.classList.remove('sale');
    if(dialog.open) dialog.close();
  };
  if(!out.length){ end(); return; }
  Promise.all(out.map(a => a.finished)).then(end, end);
  setTimeout(end, 1000);
}

// the backdrop is the dialog itself, outside its sheet; a cancel that cannot be held back (Chrome lets a page hold
// Esc only once per gesture) closes at once, as before
export function closesSoftly(dialog: HTMLDialogElement): void {
  dialog.addEventListener('cancel', e => { if(e.cancelable){ e.preventDefault(); closeSheet(dialog); } });
  dialog.addEventListener('click', e => { if(e.target === dialog) closeSheet(dialog); });
}
