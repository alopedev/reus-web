// what the visitor has chosen, shared by the timetable, the landscape and the table
export type Direction = 'reus' | 'bcn';
export interface ViewState { dir: Direction; useNow: boolean; minute: number | null }

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const state: ViewState = {dir:'reus', useNow:true, minute:null};
