import { REUS, SANTS } from './time';

// what the visitor has chosen, shared by the timetable, the landscape and the table. 'casa' = Barcelona → the
// town (the default sense); 'bcn' = the town → Barcelona
export type Direction = 'casa' | 'bcn';
// minute: the departure of the train chosen (useNow false); ave: that train is the AVE from Camp de Tarragona;
// town: the chosen town's stop_id (Reus by default, until the chooser picks another one); station: the Barcelona
// end's stop_id (Sants by default)
export interface ViewState { dir: Direction; useNow: boolean; minute: number | null; ave: boolean; town: string; station: string }

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const state: ViewState = {dir:'casa', useNow:true, minute:null, ave:false, town:REUS, station:SANTS};
