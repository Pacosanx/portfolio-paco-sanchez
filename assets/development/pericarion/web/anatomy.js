// Stable families: anatomy and apertures belong to the simulation, not zoom.
export const FAMILIES=['01','02','03','04','05','06'];
export const PHASES=['Crecimiento','Desgaste','Regeneración'];
export const familyOf=m=>m.family??m.id%3;
// A single lobed envelope: families vary folds and slit, not visual genus.
export const gridPitch=f=>[1.15,1.4,1.75,1.3,1.6,1.9][Math.floor(f)%6];
export function distance(f,x,y){
 f=Math.floor(f)%6;const sx=[1.18,1.4,1.06,1.5,1.12,1.24][f],sy=[1.02,.9,1.16,.86,1.05,.96][f],qX=x*sx,qY=y*sy,a=Math.atan2(qY,qX),lobes=[3,4,5,3,6,4][f];
 return Math.hypot(qX,qY)-(.68+.05*Math.cos(a*lobes)+.024*Math.cos(a*lobes*2+f*.55))+(f===3?.1*Math.exp(-y*y*14):0);
}
export function aperture(f,x,y,gate){return Math.hypot(x*(1.25+(f%3)*.3),(y+.28)*1.8)<.075+gate*.22;}
export function captures(m,x,y){const r=m.base*Math.sqrt(m.mass/m.max),px=(x-m.x)/r,py=(y-m.y)/r;return distance(familyOf(m),px,py)<.02&&aperture(familyOf(m),px,py,m.gate);}
export function mouth(m){const r=m.base*Math.sqrt(m.mass/m.max),f=familyOf(m);return{x:m.x,y:m.y+-.28*r};}
export const ANATOMY_GLSL=`
 float tissuePitch(float f){return f<.5?1.15:f<1.5?1.4:f<2.5?1.75:f<3.5?1.3:f<4.5?1.6:1.9;}
 float anatomy(vec2 p,float f){
 float sx=f<.5?1.18:f<1.5?1.4:f<2.5?1.06:f<3.5?1.5:f<4.5?1.12:1.24;
 float sy=f<.5?1.02:f<1.5?.9:f<2.5?1.16:f<3.5?.86:f<4.5?1.05:.96;
 float lobes=f<.5?3.0:f<1.5?4.0:f<2.5?5.0:f<3.5?3.0:f<4.5?6.0:4.0;
 vec2 q=p*vec2(sx,sy);float a=atan(q.y,q.x);
 return length(q)-(.68+.05*cos(a*lobes)+.024*cos(a*lobes*2.0+f*.55))+(f>2.5&&f<3.5?.1*exp(-p.y*p.y*14.0):0.0);
 }
 float weave(vec2 p,float f,float time){
 float folded=pow(max(0.0,cos(p.y*24.0+abs(p.x)*7.0)),10.0);
 if(f<.5)return folded;
 if(f<1.5)return max(folded*.5,pow(max(0.0,cos(p.x*23.0+sin(p.y*5.0)*2.0)),14.0));
 if(f<2.5)return pow(max(0.0,cos(length(p)*29.0+sin(atan(p.y,p.x)*5.0))),12.0);
 if(f<3.5)return pow(max(0.0,cos(p.y*31.0)),12.0)*(.5+.5*cos(p.x*9.0));
 if(f<4.5){vec2 q=abs(fract(p*6.0)-.5);return 1.0-smoothstep(.04,.1,abs(length(q)-.3));}
 return max(pow(max(0.0,cos(p.y*23.0+p.x*13.0)),16.0),pow(max(0.0,cos(p.y*23.0-p.x*13.0)),16.0))*.8;
 }
 float opening(vec2 p,float f,float gate){return length((p-vec2(0.0,-.28))*vec2(1.25+mod(f,3.0)*.3,1.8))-(.075+gate*.22);}
 float stroke(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0));}
 float mark(vec2 p,float f){float d=stroke(p,vec2(0.0,-.8),vec2(0.0,.8));
 if(f<.5)d=min(d,abs(length(p-vec2(.2,-.25))-.4));
 else if(f<1.5){d=min(d,stroke(p,vec2(-.6,-.6),vec2(0.0,0.0)));d=min(d,stroke(p,vec2(.6,-.6),vec2(0.0,0.0)));}
 else{d=min(d,stroke(p,vec2(-.5,-.35),vec2(.5,-.35)));d=min(d,stroke(p,vec2(-.5,.3),vec2(.5,.3)));}
 return d;}
`;
