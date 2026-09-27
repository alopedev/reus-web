export type Rgb = [number, number, number];
export type Hour = 'night' | 'dawn' | 'day' | 'dusk';
export interface Daylight {
  name: Hour; top: Rgb; hor: Rgb; sun: Rgb; sunUV: [number, number];
  hemi: [sky: number, ground: number, intensity: number]; dir: [color: number, intensity: number, position: Rgb];
  wallA: Rgb; wallB: Rgb; wood: Rgb; seat: Rgb;
}

/* one light drives the landscape and the carriage it shines into */
export function daylight(min: number): Daylight {
  const h = min/60;
  if(h<7 || h>=21) return {name:'night', top:[.20,.24,.40], hor:[.42,.46,.62], sun:[.95,.94,.86], sunUV:[.82,.84], hemi:[0x7080b0,0x202433,.55], dir:[0xaab8e0,.35,[-.3,.8,.4]],
    wallA:[.27,.27,.35], wallB:[.17,.17,.24], wood:[.15,.13,.16], seat:[.09,.09,.12]};
  if(h<10) return {name:'dawn', top:[.78,.64,.56], hor:[.95,.83,.66], sun:[.95,.62,.36], sunUV:[.8,.5], hemi:[0xf2d9c2,0x6b5a45,.8], dir:[0xffc690,.9,[.6,.35,.5]],
    wallA:[.66,.53,.45], wallB:[.46,.35,.30], wood:[.36,.25,.20], seat:[.21,.19,.21]};
  if(h<18) return {name:'day', top:[.52,.66,.78], hor:[.88,.91,.90], sun:[.97,.82,.46], sunUV:[.82,.82], hemi:[0xe3ecf2,0x7d6e4d,.85], dir:[0xfff3de,.85,[.4,.9,.5]],
    wallA:[.60,.52,.42], wallB:[.42,.35,.27], wood:[.34,.25,.18], seat:[.19,.20,.21]};
  return {name:'dusk', top:[.60,.44,.60], hor:[.96,.72,.56], sun:[.96,.55,.32], sunUV:[.8,.46], hemi:[0xf0c7c7,0x5a4a52,.75], dir:[0xff9f7a,.8,[-.6,.3,.5]],
    wallA:[.58,.44,.41], wallB:[.39,.29,.28], wood:[.31,.21,.19], seat:[.19,.16,.19]};
}
