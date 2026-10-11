// the site's address (D1, Àlex 11-10): capacasa.alope.dev. The old one, reus-web.vercel.app, sends every path there
// for good (308, vercel.json `redirects`), so old links and shares keep working; the branch and PR test URLs
// (reus-web-git-….vercel.app) do not move. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type Redirect = { source: string; destination: string; permanent?: boolean; statusCode?: number; has?: { type: string; value: string }[] };
const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as { redirects?: Redirect[] };

// where Vercel sends a request for host + path, with its status, or null when it serves it there.
// Vercel reads `source` as a path-to-regexp pattern; the ones here are `/(.*)` or a literal path, which read the same as a regex
function redirect(host: string, path: string): { status: number; to: string } | null {
  for (const r of vercel.redirects ?? []) {
    if (!(r.has ?? []).every(h => h.type === 'host' && h.value === host)) continue;
    const m = new RegExp('^' + r.source + '$').exec(path);
    if (!m) continue;
    return { status: r.statusCode ?? (r.permanent === false ? 307 : 308), to: r.destination.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? '') };
  }
  return null;
}

test('the old address sends every path to the same path on the new one, for good', () => {
  for (const path of ['/', '/og.jpg', '/sw.js', '/api/avisos', '/assets/index-BLXVefjg.js'])
    assert.deepEqual(redirect('reus-web.vercel.app', path), { status: 308, to: 'https://capacasa.alope.dev' + path }, path);
});

test('the new address and the test URLs of branches stay where they are', () => {
  for (const host of ['capacasa.alope.dev', 'reus-web-git-claude-project-thread-syu4si-alexs-projects-856da12a.vercel.app'])
    for (const path of ['/', '/og.jpg', '/api/retards'])
      assert.equal(redirect(host, path), null, host + path);
});
