// the mist on the window (src/vidre.ts, Àlex 08-11, idea 4 B): on a phone a tap on the glass breathes on it and only
// then does a finger draw, so a swipe that starts on the window still moves the page; the first visit finds a few words
// wiped in the mist, once, remembered in this browser. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hintDue, hintWords, isTap } from '../../src/vidre.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

test('a short touch that hardly moves is a tap', () => {
  assert.equal(isTap({x: 100, y: 200, t: 0}, {x: 104, y: 203, t: 180}), true);
});

test('a touch that moves or lingers is not a tap: it scrolls, or it was held', () => {
  assert.equal(isTap({x: 100, y: 200, t: 0}, {x: 100, y: 260, t: 150}), false);
  assert.equal(isTap({x: 100, y: 200, t: 0}, {x: 101, y: 201, t: 700}), false);
});

test('the words in the mist come on the first visit only', () => {
  const store = memory();
  assert.equal(hintDue(store), true);
  assert.equal(hintDue(store), false);
  assert.equal(store.m.get('capacasa.vaho'), '1');
});

test('a browser that keeps nothing still gets the words, and no error', () => {
  assert.equal(hintDue(null), true);
  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.equal(hintDue(full), true);
  const blocked = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => {} };
  assert.equal(hintDue(blocked), true);
});

test('the words say what the hand can do: a finger taps, a mouse passes over', () => {
  assert.deepEqual(hintWords(true), ['toca el vidre', 'i dibuixa']);
  assert.deepEqual(hintWords(false), ['passa-hi', 'el ratolí']);
});
