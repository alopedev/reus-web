// lookups for elements the page always has (they live in index.html): typed, and never null
export const byId = <T extends Element = HTMLElement>(id: string): T => document.getElementById(id) as unknown as T;
export const find = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T => root.querySelector(sel) as T;

// a part of the page redrawn only when its HTML changes (the board, the route, the day sheets and «Compra» are redrawn
// every minute): the control that had the focus hands it to its new self, found again by key(focused), a selector
export function redrawer(el: HTMLElement, key: (focused: HTMLElement) => string | null){
  let drawn: string | null = null;
  return {
    draw(html: string): boolean {
      if(html === drawn) return false;
      const f = el.querySelector<HTMLElement>(':focus'), k = f && key(f);
      el.innerHTML = drawn = html;
      if(k) el.querySelector<HTMLElement>(k)?.focus({preventScroll:true});
      return true;
    },
    reset(){ drawn = null; },
  };
}
