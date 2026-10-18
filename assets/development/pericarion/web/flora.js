import {screenPoint} from './isometry.js';
// Flat pixel silhouettes. All relief is drawn into the sprite; there is no Z.
const lozenge=(x,y,cx,cy,rx,ry)=>Math.pow(Math.abs((x-cx)/rx),1.35)+Math.pow(Math.abs((y-cy)/ry),1.35)-1;
export function specimenDistance(f,x,y){
 let d=10;
 if(f===0){d=Math.min(lozenge(x,y,-.28,.46,.49,.34),lozenge(x,y,.28,.83,.43,.4),lozenge(x,y,-.19,1.15,.35,.25));}
 else if(f===1){for(let k=0;k<4;k++)d=Math.min(d,lozenge(x,y,Math.sin(k*2)*.16,.24+k*.29,.65-k*.055,.23));}
 else if(f===2){d=lozenge(x,y,0,.75,.78,.61);d=Math.max(d,-lozenge(x,y,-.13,.87,.36,.27));}
 else if(f===3){for(let k=0;k<5;k++)d=Math.min(d,lozenge(x,y,Math.sin(k*2.4)*.4,.33+k*.21,.33,.3));}
 else if(f===4){d=Math.min(lozenge(x,y,-.29,.65,.4,.5),lozenge(x,y,.3,.69,.4,.51),lozenge(x,y,0,1.09,.48,.26));}
 else if(f===5){for(let k=0;k<3;k++)d=Math.min(d,lozenge(x,y,(k-1)*.4,.6+Math.sin(k*2)*.22,.43,.42));d=Math.max(d,-lozenge(x,y,.23,.73,.13,.12));}
 else{d=Math.min(lozenge(x,y,-.2,.7,.46,.42),lozenge(x,y,.28,.92,.35,.3));d=Math.max(d,-lozenge(x,y,-.17,.77,.14,.16));}
 return d;
}
export const SPECIMEN_GLSL=`
 float lozenge(vec2 p,vec2 c,vec2 r){vec2 q=pow(abs((p-c)/r),vec2(1.35));return q.x+q.y-1.0;}
 float specimen(float f,vec2 p){float d=10.0;
 if(f<.5)d=min(min(lozenge(p,vec2(-.28,.46),vec2(.49,.34)),lozenge(p,vec2(.28,.83),vec2(.43,.4))),lozenge(p,vec2(-.19,1.15),vec2(.35,.25)));
 else if(f<1.5){for(int k=0;k<4;k++){float i=float(k);d=min(d,lozenge(p,vec2(sin(i*2.0)*.16,.24+i*.29),vec2(.65-i*.055,.23)));}}
 else if(f<2.5){d=lozenge(p,vec2(0.0,.75),vec2(.78,.61));d=max(d,-lozenge(p,vec2(-.13,.87),vec2(.36,.27)));}
 else if(f<3.5){for(int k=0;k<5;k++){float i=float(k);d=min(d,lozenge(p,vec2(sin(i*2.4)*.4,.33+i*.21),vec2(.33,.3)));}}
 else if(f<4.5)d=min(min(lozenge(p,vec2(-.29,.65),vec2(.4,.5)),lozenge(p,vec2(.3,.69),vec2(.4,.51))),lozenge(p,vec2(0.0,1.09),vec2(.48,.26)));
 else if(f<5.5){for(int k=0;k<3;k++){float i=float(k);d=min(d,lozenge(p,vec2((i-1.0)*.4,.6+sin(i*2.0)*.22),vec2(.43,.42)));}d=max(d,-lozenge(p,vec2(.23,.73),vec2(.13,.12)));}
 else{d=min(lozenge(p,vec2(-.2,.7),vec2(.46,.42)),lozenge(p,vec2(.28,.92),vec2(.35,.3)));d=max(d,-lozenge(p,vec2(-.17,.77),vec2(.14,.16)));}return d;
 }`;
export function floraParts(b,family){const[x,y,vx,vy,r,type,fuel,phase,signal,age,id]=b;const size=type===2?Math.max(10,r*2.4):r;return[{root:[x,y,vx,vy],a:[0,0,size,0],b:[0,0,0,0],state:[fuel,type===0?phase:0,signal,id],tissue:[type===2?6:family,age,size,type]}];}
export function buildFlora(state){const families=new Map(state.membranes.map(m=>[m.id,m.family])),parts=[];for(let i=0;i<state.bodies.length;i+=12){const b=state.bodies.subarray(i,i+12);if(b[5]===0||b[5]===1||b[5]===2&&b[7]===2)parts.push(...floraParts(b,families.get(b[10])??b[11]));}return parts.sort((a,b)=>(a.root[0]+a.root[1])-(b.root[0]+b.root[1]));}
export function pickFlora(state,sx,sy,view,width,height){if(!state)return null;const scale=view.base*view.zoom,families=new Map(state.membranes.map(m=>[m.id,m.family]));let best=null,depth=-Infinity;
 for(let i=0;i<state.bodies.length;i+=12){const b=state.bodies.subarray(i,i+12);if(b[5]!==0&&b[5]!==1)continue;const root=screenPoint(b[0],b[1],0,view,width,height),x=(sx-root.x)/(b[4]*1.1*scale),y=(root.y-sy)/(b[4]*1.375*scale),f=families.get(b[10])??b[11];if(Math.abs(x)>1||y<0||y>1.6)continue;if(specimenDistance(f,x,y)<0&&b[0]+b[1]>depth){best={x:b[0],y:b[1],id:b[10]};depth=b[0]+b[1];}}
 return best;
}
