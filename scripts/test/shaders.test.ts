import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// GLSL leaves smoothstep(a, b, x) undefined when a ≥ b. Most GPUs work it out anyway, as the falling edge one meant,
// and the headless browser of check.py does; the iPhone's need not: there the sun's and the moon's disc
// (smoothstep(.09, .08, …)) came out as nothing (Àlex, 24-11). A falling edge is written 1. - smoothstep(b, a, x)

const dir = new URL('../../src/shaders/', import.meta.url);
const shaders = readdirSync(dir).filter(f => f.endsWith('.frag') || f.endsWith('.vert'));

// the arguments of every smoothstep( … ) call, split at the commas of its own level
function calls(src: string): string[][] {
  const out: string[][] = [];
  for(let i = src.indexOf('smoothstep('); i >= 0; i = src.indexOf('smoothstep(', i + 1)){
    const args: string[] = []; let depth = 0, cur = '';
    for(let j = i + 'smoothstep('.length; j < src.length; j++){
      const c = src[j];
      if(c === '(') depth++;
      if(c === ')' && depth-- === 0){ args.push(cur.trim()); break; }
      if(c === ',' && depth === 0){ args.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    out.push(args);
  }
  return out;
}
// an edge's value with every name taken as 0: «tbl.x + 300.» against «tbl.x» compares 300 with 0. Edges that are
// not plain sums of names and numbers are left alone (null)
function value(edge: string): number | null {
  if(!/^[\w.\s+-]+$/.test(edge)) return null;
  const sum = edge.replace(/[A-Za-z_][\w.]*/g, '0').replace(/(\d)\.(?!\d)/g, '$1');
  return /^[\d.\s+-]+$/.test(sum) ? Function(`return (${sum})`)() as number : null;
}

test('no smoothstep in the shaders has its first edge above its second', () => {
  const bad: string[] = [];
  for(const f of shaders){
    for(const [a, b] of calls(readFileSync(new URL(f, dir), 'utf8').replace(/\/\/.*$/gm, ''))){   // not in comments
      const va = value(a), vb = value(b);
      if(va !== null && vb !== null && va > vb) bad.push(`${f}: smoothstep(${a}, ${b}, …)`);
    }
  }
  assert.deepEqual(bad, []);
});

test('the check reads the edges it is meant to', () => {
  assert.equal(value('.09'), .09);
  assert.equal(value('tbl.x + 300.'), 300);
  assert.equal(value('r-.03'), -.03);
  assert.equal(value('abs(sd)'), null);
  assert.deepEqual(calls('x = smoothstep(.45,.12,length(d)) + smoothstep(0., w, abs(sd));'), [['.45', '.12', 'length(d)'], ['0.', 'w', 'abs(sd)']]);
});
