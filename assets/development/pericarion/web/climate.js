export const PERIOD=108;
export function climate(time){const phase=((time%PERIOD)+PERIOD)%PERIOD/PERIOD,activity=.5-.5*Math.cos(phase*Math.PI*2);return{phase,activity,blue:1-activity,flow:.55+activity*.9};}
