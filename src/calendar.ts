// «Recorda» (04-11, Àlex: option A of three): the train shown, into the visitor's own calendar with an alarm 15 min
// before it leaves. The only place that knows both links: the iPhone, the Mac and Outlook open the iCalendar file
// that api/calendari.ts writes; Android opens Google Calendar with the train already written (its link cannot set
// the alarm: the phone's default reminder does)

// the train: its day, departure and arrival in minutes from that day's midnight (past 24:00 after midnight), its
// line, and the stations it leaves from and goes to
export interface Remind { d: string, s: number, a: number, l: string, o: string, x: string }

export const ANDROID = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

const two = (n: number): string => String(n).padStart(2, '0');
// a minute of a day as Google writes a local time, «20261106T173300»: past 24:00, the next day
function local(day: string, min: number): string {
  const [y, m, d] = day.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d, 0, min));
  return `${t.getUTCFullYear()}${two(t.getUTCMonth() + 1)}${two(t.getUTCDate())}T${two(t.getUTCHours())}${two(t.getUTCMinutes())}00`;
}

export function remindUrl(r: Remind, android: boolean = ANDROID): string {
  if(!android) return '/api/calendari?' + new URLSearchParams({ d: r.d, s: String(r.s), a: String(r.a), l: r.l, o: r.o, x: r.x });
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE',
    text: `${r.l} ${r.o} → ${r.x}`, dates: `${local(r.d, r.s)}/${local(r.d, r.a)}`, ctz: 'Europe/Madrid',
    details: 'Horari de capacasa.alope.dev' });
}
