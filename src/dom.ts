// lookups for elements the page always has (they live in index.html): typed, and never null
export const byId = <T extends Element = HTMLElement>(id: string): T => document.getElementById(id) as unknown as T;
export const find = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T => root.querySelector(sel) as T;
