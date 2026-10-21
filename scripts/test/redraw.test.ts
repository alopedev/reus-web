// a part of the page redrawn only when its HTML changes, the focused control handing the focus to its new self
// (src/dom.ts, redrawer): the board, the ticket's route, the day sheets and «Compra» are redrawn every minute, and a
// finger or a key on one of them keeps its place. `npm test`, with a container faked here
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redrawer } from '../../src/dom.ts';

// a container that remembers what is written in it, and finds a control by the selector asked for
function fake(){
  const t = { writes: 0, html: '', focused: null as null | { sel: string, cls: string }, asked: [] as string[] };
  const el = {
    set innerHTML(h: string){ t.writes++; t.html = h; t.focused = null; },
    get innerHTML(){ return t.html; },
    querySelector(sel: string){
      if(sel === ':focus') return t.focused && { className: t.focused.cls };
      t.asked.push(sel);
      return t.html.includes(sel.slice(1)) ? { focus(){ t.focused = { sel, cls: sel.slice(1) }; } } : null;
    },
  } as unknown as HTMLElement;
  return { t, el };
}
const byClass = (f: HTMLElement) => '.' + f.className;

test('the same HTML is not written again', () => {
  const { t, el } = fake(), draw = redrawer(el, byClass);
  assert.equal(draw.draw('<a class="x">'), true);
  assert.equal(draw.draw('<a class="x">'), false);
  assert.equal(t.writes, 1);
});

test('new HTML: the control that had the focus gives it to its new self', () => {
  const { t, el } = fake(), draw = redrawer(el, byClass);
  draw.draw('<a class="compra">13 min</a>'); t.focused = { sel: '.compra', cls: 'compra' };
  draw.draw('<a class="compra">12 min</a>');
  assert.equal(t.writes, 2);
  assert.deepEqual(t.focused, { sel: '.compra', cls: 'compra' });
});

test('nothing focused, nothing looked for; reset() writes the same HTML again', () => {
  const { t, el } = fake(), draw = redrawer(el, byClass);
  draw.draw('<a class="x">'); draw.reset(); draw.draw('<a class="x">');
  assert.equal(t.writes, 2);
  assert.deepEqual(t.asked, []);
});
