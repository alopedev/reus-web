// the privacy sheet (11-10): the signature on the inside of the notebook's cover opens it; a native <dialog> cut like
// the chooser's (focus kept inside, Esc closes), and the focus goes back to the button
import { rag } from './paper';
import { closeSheet, closesSoftly } from './sheet';
import { byId, find } from './dom';

export function setupPrivacy(): void {
  const dialog = byId<HTMLDialogElement>('privacitat'), button = find<HTMLButtonElement>('#cuaderno .priv');
  find<HTMLElement>('#privacitat .pp').style.setProperty('--cut', rag(23));
  button.addEventListener('click', () => dialog.showModal());
  closesSoftly(dialog);
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t.closest('.x')) closeSheet(dialog);
  });
  dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
}
