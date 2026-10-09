// the lines' notices (09-10, Àlex: «que la web reflecteixi els avisos d'incidències»): the Generalitat publishes one
// RSS feed per regional line, but without CORS, so the page cannot read it itself. This function reads the six lines
// Capacasa shows and answers in one small JSON. Vercel's CDN keeps the answer 2 minutes, so however many visitors
// come, the Generalitat is asked at most once every 2 minutes per CDN region. The only place that knows the URL
const LINES = ['R11', 'R13', 'R14', 'R15', 'R16', 'R17'];
const feed = (line: string) => `https://www.gencat.cat/rodalies/incidencies_rodalies_rss_${line.toLowerCase()}_ca_ES.xml`;
// the feed also publishes the normal service as an item: those are not notices. A sentence not in this list is
// shown, better one notice too many than one too few
const NORMAL = ['servei ferroviari a tot el recorregut', 'normalitat al servei'];
const WAIT = 5000, STALE = 60*60e3;   // a feed that has not been rebuilt for an hour is not trusted

export type Line = { estat: 'avis', text: string, publicat: string | null } | { estat: 'normal' } | { estat: 'error' };
export interface Answer { llegit: string, linies: Record<string, Line> }

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };
const decode = (s: string): string => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1] === 'x' || e[1] === 'X' ? 2 : 1), e[1] === 'x' || e[1] === 'X' ? 16 : 10)) : entities[e] ?? m)
  .replace(/\s+/g, ' ').trim();
const tag = (xml: string, name: string): string | null => { const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : null; };
const normal = (s: string): boolean => NORMAL.includes(s.toLowerCase().replace(/[.\s]+$/, ''));

// one line: its notices joined, or normal; error when the feed fails, is stale or carries nothing at all
export function read(xml: string, now: number): Line {
  const built = Date.parse(tag(xml.split('<item>')[0], 'lastBuildDate') ?? '');
  if(!(now - built < STALE)) return { estat: 'error' };
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => ({
    // the title is cut at about 150 characters; the description carries the whole notice
    text: tag(m[1], 'description') || tag(m[1], 'title') || '', at: Date.parse(tag(m[1], 'pubDate') ?? '') }));
  if(!items.some(i => i.text)) return { estat: 'error' };
  const notices = items.filter(i => i.text && !normal(i.text));
  if(!notices.length) return { estat: 'normal' };
  const times = notices.map(i => i.at).filter(t => !isNaN(t));
  return { estat: 'avis', text: [...new Set(notices.map(i => i.text))].join(' '),
    publicat: times.length ? new Date(Math.max(...times)).toISOString() : null };
}

async function line(name: string): Promise<Line> {
  try {
    const res = await fetch(feed(name), { signal: AbortSignal.timeout(WAIT) });
    return res.ok ? read(await res.text(), Date.now()) : { estat: 'error' };
  } catch { return { estat: 'error' }; }
}

export default {
  async fetch(): Promise<Response> {
    const linies = Object.fromEntries(await Promise.all(LINES.map(async l => [l, await line(l)] as const)));
    const answer: Answer = { llegit: new Date().toISOString(), linies };
    // nothing read at all: a 502, which the CDN does not keep, so the next visitor asks again
    const none = Object.values(linies).every(l => l.estat === 'error');
    return new Response(JSON.stringify(answer), { status: none ? 502 : 200, headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0',   // the browser always asks; the CDN answers from its copy
      'Vercel-CDN-Cache-Control': 's-maxage=120, stale-while-revalidate=60' } });
  },
};
