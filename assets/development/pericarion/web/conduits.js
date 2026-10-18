// A shared world grid: its X/Y axes become the two 2:1 isometric diagonals.
export const CONDUIT_GRID=4;
export function routeKnots(a,b){const ax=Math.round(a.x/4)*4,bx=Math.round(b.x/4)*4,my=Math.round((a.y+b.y)/8)*4;return[a,{x:ax,y:a.y},{x:ax,y:my},{x:bx,y:my},{x:bx,y:b.y},b];}
export function routePoint(a,b,t){const ps=routeKnots(a,b),lengths=ps.slice(1).map((p,i)=>Math.hypot(p.x-ps[i].x,p.y-ps[i].y));let d=Math.max(0,Math.min(1,t))*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<5;i++){if(d<=lengths[i]||i===4){const f=lengths[i]?Math.min(1,d/lengths[i]):0;return{x:ps[i].x+(ps[i+1].x-ps[i].x)*f,y:ps[i].y+(ps[i+1].y-ps[i].y)*f};}d-=lengths[i];}return b;}
export const CONDUIT_GLSL=`
 vec2 routeKnot(vec2 a,vec2 b,float k){float ax=floor(a.x/4.0+.5)*4.0,bx=floor(b.x/4.0+.5)*4.0,my=floor((a.y+b.y)/8.0+.5)*4.0;
 if(k<.5)return a;if(k<1.5)return vec2(ax,a.y);if(k<2.5)return vec2(ax,my);if(k<3.5)return vec2(bx,my);if(k<4.5)return vec2(bx,b.y);return b;}
 vec2 conduit(vec2 a,vec2 b,float t,float family,float id,float time,float motion,vec2 pointer,float presence){
 float total=0.0;for(int i=0;i<5;i++)total+=length(routeKnot(a,b,float(i+1))-routeKnot(a,b,float(i)));
 float distance=clamp(t,0.0,1.0)*total;for(int i=0;i<5;i++){vec2 p=routeKnot(a,b,float(i)),q=routeKnot(a,b,float(i+1));float span=length(q-p);if(distance<=span||i==4)return mix(p,q,clamp(distance/max(.0001,span),0.0,1.0));distance-=span;}return b;
 }
`;
