// «Avisar a casa» (Àlex 06-10, only on a phone): the train you are taking, written for the people waiting at the
// other end, and the one place that knows how WhatsApp is reached. wa.me with no number and a prefilled text lets
// you pick the chat and opens it with the message written, ready to send or edit
import { atPlace } from './ca';

const WA = 'https://wa.me/';

// «Agafo l’R15 de les 18:33 a Sants. Arribo a Reus a les 20:03.»; tomorrow's first train says so. The article
// elides before a vowel and before a letter whose Catalan name starts with one (l’R15: «erra»)
export function homeText(line: string, from: string, dep: string, to: string, arr: string, tomorrow: boolean): string {
  const name = line === 'AVLO' ? 'Avlo' : line;
  return `${tomorrow ? 'Demà agafo' : 'Agafo'} ${/^([AEIOU]|[FLMNRS](?=[\dA-Z]))/i.test(name) ? 'l’' : 'el '}${name} de les ${dep} ${atPlace(from)}. Arribo ${atPlace(to)} a les ${arr}.`;
}

// spaces as %20, as WhatsApp's own examples write them (URLSearchParams would write «+»)
export const whatsappUrl = (text: string): string => `${WA}?text=${encodeURIComponent(text)}`;
