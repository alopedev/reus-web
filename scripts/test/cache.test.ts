// how long a browser keeps each file (vercel.json `headers`). The build's JS and CSS carry a hash in their name
// (/assets/index-BLXVefjg.js): a new build is a new name, so a visitor can keep them for good and never ask again.
// The page, the offline worker, the sharing image and /api keep their names: they must keep asking. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type Rule = { source: string; headers: { key: string; value: string }[] };
const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as { headers?: Rule[] };

// the Cache-Control vercel.json gives a path, or null when it leaves it to Vercel (or to the /api function itself).
// Vercel reads `source` as a path-to-regexp pattern; the ones here are a literal path with `(.*)`, which reads the same as a regex
function cacheControl(path: string): string | null {
  let value: string | null = null;
  for (const rule of vercel.headers ?? [])
    if (new RegExp('^' + rule.source + '$').test(path))
      for (const h of rule.headers) if (h.key.toLowerCase() === 'cache-control') value = h.value;
  return value;
}

test('the hashed JS and CSS are kept for a year without asking again', () => {
  for (const path of ['/assets/index-BLXVefjg.js', '/assets/index-D6ux0eth.css']) {
    const value = cacheControl(path) ?? '';
    assert.match(value, /\bimmutable\b/, path);
    assert.ok(Number(/max-age=(\d+)/.exec(value)?.[1]) >= 31536000, `${path}: ${value}`);
  }
});

test('the page, the offline worker, the sharing image and /api still ask every time', () => {
  for (const path of ['/', '/index.html', '/sw.js', '/og.jpg', '/api/avisos', '/api/retards'])
    assert.equal(cacheControl(path), null, path);
});
