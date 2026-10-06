// «Avisar a casa» (Àlex 06-10, only on a phone): the train you are taking, written for the people waiting at the
// other end, and the one place that knows how WhatsApp is reached. wa.me with no number and a prefilled text lets
// you pick the chat and opens it with the message written, ready to send or edit
const WA = 'https://wa.me/';

// «Cojo el R15 de las 18:33 en Sants. Llego a Reus a las 20:03.»; tomorrow's first train says so
export function homeText(line: string, from: string, dep: string, to: string, arr: string, tomorrow: boolean): string {
  const name = line === 'AVLO' ? 'Avlo' : line;
  return `${tomorrow ? 'Mañana cojo' : 'Cojo'} el ${name} de las ${dep} en ${from}. Llego a ${to} a las ${arr}.`;
}

// spaces as %20, as WhatsApp's own examples write them (URLSearchParams would write «+»)
export const whatsappUrl = (text: string): string => `${WA}?text=${encodeURIComponent(text)}`;
