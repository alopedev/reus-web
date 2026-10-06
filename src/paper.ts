// paper cut with scissors: the ticket and the selector's sheet share the ragged edge, never a ruled line
const rnd = (seed: number) => { let s = seed; return () => (s = (s*9301+49297)%233280)/233280; };

// a ragged scissor cut, different for every ticket, with the two punch notches of the stub
export function cut(seed: number){
  const r = rnd(seed);
  const pts: string[] = [], n = 16, j = ()=> (r()*2.4).toFixed(2);
  for(let i=0;i<=n;i++) pts.push(`${(i/n*100).toFixed(2)}% ${j()}%`);
  for(let i=1;i<=4;i++){ const y = i*20; pts.push(`calc(100% - ${j()}%) ${y}%`); }
  for(let i=n;i>=0;i--) pts.push(`${(i/n*100).toFixed(2)}% calc(100% - ${j()}%)`);
  for(let i=4;i>=1;i--){ const y = i*20; pts.push(`${j()}% ${y}%`); }
  return `polygon(${pts.join(',')})`;
}

// the same cut on a sheet of any size: the edge wanders by up to `d` rem, so a tall sheet is no more ragged than
// the ticket, and its sides get as many snips as its top and bottom
export function rag(seed: number, d = .3){
  const r = rnd(seed), j = () => `${(r()*d).toFixed(3)}rem`, pts: string[] = [], n = 22, m = 14;
  for(let i=0;i<=n;i++) pts.push(`${(i/n*100).toFixed(2)}% ${j()}`);
  for(let i=1;i<m;i++) pts.push(`calc(100% - ${j()}) ${(i/m*100).toFixed(2)}%`);
  for(let i=n;i>=0;i--) pts.push(`${(i/n*100).toFixed(2)}% calc(100% - ${j()})`);
  for(let i=m-1;i>=1;i--) pts.push(`${j()} ${(i/m*100).toFixed(2)}%`);
  return `polygon(${pts.join(',')})`;
}
