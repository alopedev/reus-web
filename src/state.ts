// what the visitor has chosen, shared by the timetable, the landscape and the table
export type Direction = 'reus' | 'bcn';
// minute: the departure of the train chosen (useNow false); ave: that train is the AVE from Camp de Tarragona
export interface ViewState { dir: Direction; useNow: boolean; minute: number | null; ave: boolean }

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const state: ViewState = {dir:'reus', useNow:true, minute:null, ave:false};
