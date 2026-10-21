// text into the page's HTML: what HTML would read as markup is written as text, for an element's text and for an
// attribute in double quotes alike (town names like «L'Aldea-Amposta-Tortosa», the Generalitat's notices, links)
const SAFE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string): string => s.replace(/[&<>"']/g, c => SAFE[c]);
