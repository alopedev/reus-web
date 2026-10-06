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
