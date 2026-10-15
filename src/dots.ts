// the date on the ticket's stub, printed by the machine as on a Rodalies ticket (Àlex 09-10, option C): a 5×7 dot
// matrix drawn as circles, so it is a drawing and not a third typeface. «09-OCT-26», the day of the train shown
const GLYPH: Record<string, string> = {
  '0':'01110100011001110101110011000101110', '1':'00100011000010000100001000010001110', '2':'01110100010000100010001000100011111',
  '3':'11111000100010000010000011000101110', '4':'00010001100101010010111110001000010', '5':'11111100001111000001000011000101110',
  '6':'00110010001000011110100011000101110', '7':'11111000010001000100010000100001000', '8':'01110100011000101110100011000101110',
  '9':'01110100011000101111000010001001100', '-':'00000000000000011111000000000000000',
  A:'01110100011000110001111111000110001', B:'11110100011000111110100011000111110', C:'01110100011000010000100001000101110',
  D:'11100100101000110001100011001011100', E:'11111100001000011110100001000011111', F:'11111100001000011110100001000010000',
  G:'01110100011000010111100011000101111', I:'01110001000010000100001000010001110', J:'00111000100001000010000101001001100',
  L:'10000100001000010000100001000011111', M:'10001110111010110101100011000110001', N:'10001100011100110101100111000110001',
  O:'01110100011000110001100011000101110', P:'11110100011000111110100001000010000', R:'11110100011000111110101001001010001',
  S:'01111100001000001110000010000111110', T:'11111001000010000100001000010000100', U:'10001100011000110001100011000101110',
  V:'10001100011000110001100010101000100', Y:'10001100010101000100001000010000100', 'Ç':'01110100011000010000100010111000100',
  ' ':'00000000000000000000000000000000000', '·':'00000000000000000100000000000000000',
};
const MONTH = ['GEN','FEB','MAR','ABR','MAI','JUN','JUL','AGO','SET','OCT','NOV','DES'];
const MONTHS = ['GENER','FEBRER','MARÇ','ABRIL','MAIG','JUNY','JULIOL','AGOST','SETEMBRE','OCTUBRE','NOVEMBRE','DESEMBRE'];
const DAYS = ['DIUMENGE','DILLUNS','DIMARTS','DIMECRES','DIJOUS','DIVENDRES','DISSABTE'];

// any word the machine knows, one 5×7 cell and a gap per letter; the colour is the ink's
export function dotText(text: string, ink = '#3A2D3A'): string {
  let dots = '';
  [...text].forEach((ch, k) => [...GLYPH[ch]].forEach((on, i) => {
    if(on === '1') dots += `<circle cx="${k * 6 + i % 5 + .5}" cy="${Math.floor(i / 5) + .5}" r=".42"/>`;
  }));
  return `<svg viewBox="0 0 ${text.length * 6 - 1} 7" data-t="${text}" aria-hidden="true"><g fill="${ink}">${dots}</g></svg>`;
}

export function dotDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return dotText(`${d}-${MONTH[+m - 1]}-${y.slice(2)}`);
}

// the tear-off pad of «Avui · Demà» (Àlex 15-10, A): the weekday on each sheet, the month on its cardboard
export const weekday = (iso: string) => DAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
export function padMonth(today: string, tomorrow: string): string {
  const [y1, m1] = today.split('-'), [y2, m2] = tomorrow.split('-');
  if(m1 === m2) return `${MONTHS[+m1 - 1]} ${y1}`;
  if(y1 === y2) return `${MONTH[+m1 - 1]} · ${MONTH[+m2 - 1]} ${y1}`;
  return `${MONTH[+m1 - 1]} ${y1.slice(2)} · ${MONTH[+m2 - 1]} ${y2.slice(2)}`;
}
