// «Recorda» (04-11, Àlex: option A of three): the train shown, into the visitor's own calendar, with an alarm 15 min
// before it leaves. This function writes it as an iCalendar file (RFC 5545), which the iPhone, the Mac and Outlook
// open as an event to add; Android goes to Google Calendar instead (src/calendar.ts, the only place that knows both
// links). Nothing is kept: the train comes in the address and goes back as the file

// the train: its day, departure and arrival in minutes from that day's midnight (past 24:00 for a train after
// midnight), its line, and where it leaves from and goes to, as the page names them
export interface Train { d: string, s: number, a: number, l: string, o: string, x: string }

const ALARM = 15;   // minutes before it leaves

// a minute of a day in Madrid as UTC, so no calendar has to know Madrid's time zone: the offset is Madrid's at that
// moment (summer time included)
const MADRID = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
function utc(day: string, min: number): Date {
  const [y, m, d] = day.split('-').map(Number), guess = Date.UTC(y, m - 1, d, 0, min);
  const p = Object.fromEntries(MADRID.formatToParts(new Date(guess)).map(x => [x.type, x.value]));
  const offset = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - guess;
  return new Date(guess - offset);
}
const stamp = (t: Date): string => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const hhmm = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
// text in a field: RFC 5545 escapes backslash, comma, semicolon and line breaks
const text = (s: string): string => s.replace(/[\\,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');

export function ics(t: Train): string {
  const trip = `${t.l} ${t.o} → ${t.x}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Capacasa//capacasa.alope.dev//CA', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.d}-${t.s}-${t.l}-${t.o}-${t.x}@capacasa.alope.dev`.replace(/[^\w@.:-]/g, ''),
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(utc(t.d, t.s))}`, `DTEND:${stamp(utc(t.d, t.a))}`,
    `SUMMARY:${text(trip)}`,
    `LOCATION:${text(t.o)}`,
    `DESCRIPTION:${text(`Surt a les ${hhmm(t.s)} i arriba a les ${hhmm(t.a)}. Horari de capacasa.alope.dev`)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(`${trip}, a les ${hhmm(t.s)}`)}`, `TRIGGER:-PT${ALARM}M`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

// the address is anyone's to write: only a train shaped like one becomes an event. A day, two minutes of that day or
// the next (s before a), a regional line or a fast train (AV; AVE from a page open since before 08-11), and two names of letters (the stations' own, «Camp-redó»,
// «L'Hospitalet de l'Infant»): no line break can reach the file
const NAME = /^\p{L}[\p{L} '’.·()-]{0,59}$/u;
export function parse(q: URLSearchParams): Train | null {
  const d = q.get('d') ?? '', l = q.get('l') ?? '', o = q.get('o') ?? '', x = q.get('x') ?? '';
  const [s, a] = ['s', 'a'].map(k => /^\d{1,4}$/.test(q.get(k) ?? '') ? Number(q.get(k)) : NaN);
  const ok = /^\d{4}-\d\d-\d\d$/.test(d) && !isNaN(Date.parse(d)) && s >= 0 && a > s && a < 2880
    && /^(R1[1-7]|AVE?)$/.test(l) && NAME.test(o) && NAME.test(x);
  return ok ? { d, s, a, l, o, x } : null;
}

export default {
  async fetch(req: Request): Promise<Response> {
    const t = parse(new URL(req.url).searchParams);
    if(!t) return new Response('', { status: 400 });
    return new Response(ics(t), { headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // inline: Safari on the iPhone opens it as an event to add; a download would leave it among the files
      'Content-Disposition': `inline; filename="${t.l}-${t.d}-${hhmm(t.s).replace(':', '')}.ics"`,
      // the same train is the same file: the CDN can keep it a day
      'Cache-Control': 'public, max-age=0', 'Vercel-CDN-Cache-Control': 's-maxage=86400' } });
  },
};
