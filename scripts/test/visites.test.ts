// visits (P1-4): Vercel Web Analytics counts the published site, at its address (D1, 11-10) and on Vercel's own
// URLs, never a local build (check.py, `npm run preview`). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counted } from '../../src/visites';

test('the published site counts its visits, at its address and on Vercel', () => {
  for (const host of ['capacasa.alope.dev', 'reus-web-git-main-alexs-projects-856da12a.vercel.app']) assert.equal(counted(host), true, host);
});

test('a local build does not', () => {
  for (const host of ['127.0.0.1', 'localhost', 'alope.dev']) assert.equal(counted(host), false, host);
});
