// Catalan before a place name: «de» and «a» take the town's article and elide before a vowel, as written in running
// text: «d’Alcover», «de l’Aldea», «de les Borges Blanques», «a la Riba», «del Prat». The stations' own names keep
// their capital (L'Aldea-Amposta-Tortosa); in a sentence the article goes lower case
const article = (n: string): string => n.replace(/^(La|Les|L['’])(?=[\s'’]|$)/, m => m.toLowerCase()).replace(/^L'/, 'l’').replace(/^l'/, 'l’');
const vowel = (n: string): boolean => /^h?[aeiouàèéíòóú]/i.test(n) && !/^h?[iu][aeiouàèéíòóú]/i.test(n);

export function ofPlace(n: string): string {
  if(/^Els? /.test(n)) return 'de' + n.slice(1).replace(/^l/, 'l');   // «El Prat» → «del Prat», «Els …» → «dels …»
  return vowel(n) ? 'd’' + n : 'de ' + article(n);
}
export function atPlace(n: string): string {
  if(/^Els? /.test(n)) return 'a' + n.slice(1);                       // «al Prat», «als …»
  return 'a ' + article(n);
}

// the days a timetable covers, in running text: «de l’11 al 24 d’octubre del 2026», «del 28 de setembre a l’1 d’octubre
// del 2026»; the month and the year are said once when both days share them. 1 and 11 take «l’» (l’u, l’onze)
const MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const ofMonth = (m: number): string => (vowel(MONTHS[m - 1]) ? 'd’' : 'de ') + MONTHS[m - 1];
const day = (d: number, of: 'de' | 'a'): string => d === 1 || d === 11 ? `${of} l’${d}` : `${of === 'de' ? 'del' : 'al'} ${d}`;
export function dateSpan(first: string, last: string): string {
  const [y1, m1, d1] = first.split('-').map(Number), [y2, m2, d2] = last.split('-').map(Number);
  const head = day(d1, 'de') + (m1 === m2 && y1 === y2 ? '' : ' ' + ofMonth(m1) + (y1 === y2 ? '' : ` del ${y1}`));
  return `${head} ${day(d2, 'a')} ${ofMonth(m2)} del ${y2}`;
}
