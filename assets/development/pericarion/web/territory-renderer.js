import{iso,ISO_GLSL}from'./isometry.js';
import{buildFlora,SPECIMEN_GLSL}from'./flora.js';
import{gridPitch}from'./anatomy.js';
import{CONDUIT_GLSL}from'./conduits.js';
import{ANATOMY_GLSL}from'./anatomy.js';
import*as THREE from'./vendor/three.module.js';
export function levels(zoom){const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};return{medium:smooth(.8,2.1,zoom),detail:smooth(3.1,6.5,zoom),fine:smooth(.6,1.15,zoom)};}
const quad=new THREE.PlaneGeometry(2,2),ribbon=new THREE.PlaneGeometry(2,2,5,1);
const bodyVertex=`
 attribute vec4 iPosition;attribute vec4 iLife;attribute vec4 iExtra;attribute vec4 iProcess;attribute vec4 iCycle;
 uniform float uTime,uElapsed,uMotion,uMedium,uDetail,uFine;uniform vec2 uPointer;uniform float uPresence;uniform vec4 uCycle,uStorm;
 varying vec2 vUv;varying vec4 vLife,vExtra,vProcess,vCycle;
 ${ANATOMY_GLSL}
 ${ISO_GLSL}
 ${CONDUIT_GLSL}
 void main(){vUv=uv*2.0-1.0;vLife=iLife;vExtra=iExtra;vProcess=iProcess;vCycle=iCycle;
 float type=iLife.y,r=iLife.x;
 float breath=1.0+uMotion*.028*sin(uTime*(.65+iProcess.x)+iExtra.z*.19);if(type==0.0)breath*=1.0+iProcess.x*.16-iProcess.z*.08;
 vec2 centre=iPosition.xy+iPosition.zw*uElapsed;
 if(type==3.0){vec2 direction=vec2(cos(iExtra.y),sin(iExtra.y));float len=max(1.0,iLife.z),t=clamp(iLife.w+dot(iPosition.zw,direction)*uElapsed/len,0.0,1.0);vec2 a=centre-direction*len*t,b=a+direction*len;centre=conduit(a,b,t,iProcess.w,iExtra.w,uTime,uMotion,uPointer,uPresence);}
 float surge=uStorm.w*exp(-dot(centre-uStorm.xy,centre-uStorm.xy)/76000.0);breath*=1.0+surge*.23*uMotion;


 vec2 local=position.xy*r*breath;
 if(type==5.0){float a=iLife.w;local=mat2(cos(a),-sin(a),sin(a),cos(a))*local;}
 float dist=length(centre-uPointer);float touch=uPresence*exp(-dist*dist/16000.0);
 vExtra.x=max(vExtra.x,touch*.88);
 if(type<1.5){vec2 away=normalize(centre-uPointer+vec2(.01));local+=away*touch*r*.11*uMotion*sin(uTime*1.4+iExtra.z);local*=1.0-touch*.075;}
 gl_Position=projectionMatrix*modelViewMatrix*vec4(isometric(vec3(centre+local,0.0)),1.0);
 }`;
const bodyFragment=`
 precision highp float;uniform float uTime,uMotion,uMedium,uDetail,uFine,uScale,uElapsed;uniform vec4 uCycle,uStorm;varying vec2 vUv;varying vec4 vLife,vExtra,vProcess,vCycle;
 ${ANATOMY_GLSL}
 float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){float unit=max(tissuePitch(vProcess.w),1.8/uScale),stepSize=unit/max(vLife.x,1.0);vec2 tile=floor(vUv/stepSize);vec2 p=(tile+.5)*stepSize;float type=vLife.y,r=length(p),angle=atan(p.y,p.x),id=vExtra.z,fuel=vLife.z;float grit=grain(tile+id);
 vec3 yellow=vec3(.61961,1.0,.22745),blue=vec3(0.0,0.0,1.0),orange=vec3(1.0,.36,.09);vec3 col=yellow;float alpha=0.0;
 if(type<.5){
  float family=vProcess.w,wear=vLife.w>.5&&vLife.w<1.5?clamp(vExtra.y/32.0,0.0,1.0):0.0;
  vec2 shell=p;float folding=uMotion*.024*sin(uTime*(.55+fuel*.25)+id+shell.y*7.0);shell.x+=sin(shell.y*5.0+id)*folding;shell.x-=sign(shell.x)*wear*.07;
  float d=anatomy(shell,family);if(d>.018)discard;
  float tissue=1.0-step(.005,d),rim=1.0-smoothstep(.018,.055,abs(d+.027));
  float metabolic=clamp(fuel*.6,0.0,1.0),hole=1.0-step(0.0,opening(shell,family,vExtra.w));
  float ribs=weave(shell,family,uTime);float seam=1.0-smoothstep(.016,.052,abs(shell.x+.035*sin(shell.y*8.0+id)));
  float stream=pow(max(0.0,sin(shell.y*25.0-uTime*(.8+metabolic)+id)),12.0);
  float lining=1.0-smoothstep(.014,.047,abs(opening(shell,family,vExtra.w)));float released=1.0-smoothstep(.15,2.2,vCycle.x+uElapsed);float captured=1.0-smoothstep(.1,1.4,vCycle.y+uElapsed);
  col=wear>.15||vLife.w>1.5?blue:mix(yellow,blue,step(grit,uCycle.y*.55));
  alpha=tissue*(.13+rim*.78+ribs*.3*uMedium+seam*.3*uMedium+stream*ribs*metabolic*uDetail*.45);alpha*=1.0-wear*step(.42,grit)*(.18+.55*uMedium);
  alpha*=1.0-hole*(.5+.4*uMedium);alpha+=lining*(.55+released*.45+captured*.4)*uMedium;col=mix(col,blue,released*lining);
  float scar=step(.5,sin(atan(p.y,p.x)*4.0+id))*vProcess.y;alpha*=1.0-scar*wear*.5;
  if(vLife.w>1.5){alpha*=mix(.3,1.0,rim);float bud=1.0-smoothstep(.13,.37,length(p-vec2(0.0,.16)));alpha+=bud*(.65+.15*sin(uTime*.9)*uMotion);col=mix(col,yellow,bud);}
  // A recurring anatomical sign, plus state ticks: a readable organisation
  // whose alphabet has no complete verbal translation.
  vec2 signPos=(p-vec2(0.0,.34))*6.0;float glyph=1.0-step(.16,mark(signPos,family));
  float tick=step(.04,abs(signPos.x))*step(abs(signPos.y-.7),.09)*step(abs(signPos.x),.3+.18*vLife.w);
  alpha=max(alpha,(glyph+tick)*uDetail*.8*tissue);
  float nucleus=1.0-smoothstep(.022,.055,length(shell-vec2(.16,.16)));if(mod(id,11.0)<1.0&&vLife.w<.5){col=mix(col,orange,nucleus*min(1.0,vProcess.x+.2));alpha+=nucleus*.8;}
  if(vProcess.x>.5)alpha+=rim*vProcess.x*.18*step(.7,fract(p.y*7.0+uTime*.12));
 }else if(type<1.5){
  float d=anatomy(p,vProcess.w)+.69;float envelope=1.0-step(.71,d);float mouth=1.0-step(0.0,opening(p,vProcess.w,clamp(fuel,0.0,1.0)));
  col=mod(vLife.w,6.0)>3.5?blue:yellow;
  alpha=envelope*(.35+.5*(1.0-smoothstep(.04,.13,abs(d-.65))))*(1.0-mouth*.8)*(.2+.8*uMedium);
  float core=exp(-length(p)*12.0);col=mix(col,yellow,core);
  float layers=weave(p,vProcess.w,uTime);alpha+=layers*uDetail*envelope*.22;
 }else if(type<3.5){
  float d=type<2.5&&vLife.w>1.5?(abs(p.x)+abs(p.y))*.8:max(abs(p.x),abs(p.y));if(d>.8)discard;
  col=type<2.5&&vLife.w>1.5?orange:type>2.5||vLife.w<.5?yellow:blue;
  alpha=(1.0-step(.8,d))*(type>2.5?max(.45,uMedium):.9*uFine);

 }else if(type<4.5){
  float fleck=sin(p.x*11.0+id+uMotion*uTime*.25)*cos(p.y*9.0-id);col=grit>.7?yellow:blue;alpha=(1.0-smoothstep(.25,.9,r))*smoothstep(-.2,.7,fleck)*.6;
 }else if(type<5.5){
  float body=anatomy(p*vec2(1.15,.85),vProcess.w);float bars=pow(max(0.0,cos(p.y*22.0+abs(p.x)*7.0-uTime*.5*uMotion)),8.0);
  col=yellow;alpha=(1.0-step(.01,body))*(.32+.4*bars+.45*(1.0-smoothstep(.015,.06,abs(body))))*uDetail;
 }else{col=yellow;alpha=(1.0-smoothstep(.1,1.0,r))*.7*(1.0-uFine);}
 if(type> .5&&type<1.5)col=mix(col,blue,step(grit,uCycle.y*.4));if(vExtra.x>.45&&grit>.75)col=mix(col,blue,.8);alpha=min(1.0,alpha+vExtra.x*.10*(1.0-smoothstep(.65,.9,r)));alpha=floor(alpha*5.0+.5)/5.0;
 if(alpha<.01)discard;gl_FragColor=vec4(col,alpha);
 }`;
const lineVertex=`
 attribute vec4 iLine;attribute vec4 iInfo;attribute vec2 iIds;attribute vec4 iVelocity;attribute vec4 iTissue;uniform float uScale,uTime,uMotion,uElapsed;uniform vec2 uPointer;uniform float uPresence;uniform vec4 uCycle,uStorm;
 varying vec2 vUv;varying vec4 vInfo;varying float vId,vLength;varying vec2 vWorld,vOrigin;varying float vPitch;
 ${ANATOMY_GLSL}
 ${ISO_GLSL}
 ${CONDUIT_GLSL}
 void main(){vUv=uv;vInfo=iInfo;vId=iIds.x;vec2 a=iLine.xy+iVelocity.xy*uElapsed,b=iLine.zw+iVelocity.zw*uElapsed;
 float k=floor(uv.x*5.0+.5);vec2 pos=routeKnot(a,b,k),prev=routeKnot(a,b,max(0.0,k-1.0)),next=routeKnot(a,b,min(5.0,k+1.0));
 vec2 here=isometric(vec3(pos,0.0)).xy,left=isometric(vec3(prev,0.0)).xy,right=isometric(vec3(next,0.0)).xy;
 vec2 incoming=here-left,outgoing=right-here;
 if(length(incoming)<.001)incoming=outgoing;if(length(outgoing)<.001)outgoing=incoming;
 if(length(incoming)<.001)incoming=vec2(1.0,.5);if(length(outgoing)<.001)outgoing=incoming;
 vec2 n1=normalize(vec2(-incoming.y,incoming.x)),n2=normalize(vec2(-outgoing.y,outgoing.x));vec2 joined=n1+n2;
 if(length(joined)<.001)joined=n1;joined=normalize(joined);float miter=min(1.5,1.0/max(.67,abs(dot(joined,n1))));
 float touch=uPresence*exp(-dot(pos-uPointer,pos-uPointer)/16000.0);vInfo.y=max(vInfo.y,touch*.62);vPitch=4.0;vOrigin=a;
 vLength=0.0;float travelled=0.0;for(int i=0;i<5;i++){float lengthHere=length(routeKnot(a,b,float(i+1))-routeKnot(a,b,float(i)));vLength+=lengthHere;if(float(i)<k)travelled+=lengthHere;}vUv.x=travelled/max(.001,vLength);
 // A narrow collar seats each end inside its tissue; joined corners have no spikes.
 float collar=mix(.42,1.0,smoothstep(0.0,.2,uv.x)*smoothstep(0.0,.2,1.0-uv.x));float width=max(.65/uScale,.9+min(1.0,iInfo.x)*.75)*collar;
 vWorld=pos;gl_Position=projectionMatrix*modelViewMatrix*vec4(here+joined*position.y*width*miter,0.0,1.0);

 }`;
const lineFragment=`
 precision highp float;uniform float uTime,uMedium,uDetail,uMotion,uScale;uniform vec4 uCycle,uStorm;varying vec2 vUv;varying vec4 vInfo;varying float vId,vLength;varying vec2 vWorld,vOrigin;varying float vPitch;
 void main(){float pitch=max(vPitch,1.8/uScale)/max(1.0,vLength);vec2 pixel=vec2((floor(vUv.x/pitch)+.5)*pitch,(floor(vUv.y*5.0)+.5)/5.0);float transverse=abs(pixel.y-.5)*2.0;float alpha=(1.0-smoothstep(.45,1.0,transverse))*(.3+.5*uMedium);
 vec3 yellow=vec3(.61961,1.0,.22745),blue=vec3(0.0,0.0,1.0),orange=vec3(1.0,.36,.09);vec3 col=mix(yellow,blue,step(fract(vId*.618),uCycle.y*.65));
 vec2 lattice=floor((vWorld-vOrigin)/max(vPitch,1.8/uScale));float seam=step(.8,fract((lattice.x+lattice.y)*.618));alpha*=.8+seam*.2;
 float circulation=pow(max(0.0,sin(pixel.x*vLength*.7-uTime*3.0*vInfo.z+vId)),14.0)*vInfo.y*uDetail;
 if(vInfo.y>.55&&circulation>.15)col=blue;alpha+=circulation*.45;
 // Double wall and moving material are revealed only at tissue scale.
 alpha*=mix(1.0,.55+.45*cos(transverse*9.0),uDetail);
 gl_FragColor=vec4(col,alpha);
 }`;
const floraVertex=`
 attribute vec4 iRoot,iStart,iEnd,iState,iTissue;
 uniform float uTime,uElapsed,uMotion,uScale,uPresence;uniform vec2 uPointer;
 varying vec2 vUv;varying vec4 vState,vTissue;varying float vTouch;
 void main(){vUv=uv;vState=iState;vTissue=iTissue;vec2 root=iRoot.xy+iRoot.zw*uElapsed;
 vTouch=uPresence*exp(-dot(root-uPointer,root-uPointer)/16000.0);
 vec2 ground=vec2(root.x-root.y,(root.x+root.y)*.5);
 // Screen-aligned, flat sprite: apparent volume is painted in its pixel mask.
 vec2 offset=vec2(position.x*1.1,-uv.y*2.2)*iTissue.z;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(ground+offset,0.0,1.0);
 }`;
const floraFragment=`
 precision highp float;uniform float uTime,uMedium,uDetail,uMotion;uniform vec4 uCycle,uStorm;
 varying vec2 vUv;varying vec4 vState,vTissue;varying float vTouch;
 ${SPECIMEN_GLSL}
 float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
 vec2 p=vec2(vUv.x*2.0-1.0,vUv.y*1.6);
 // Deform rows of the drawing by one or two pixels; never rotate a 3D object.
 p.x+=floor(sin(p.y*5.0+uTime*.7+vState.w)*uMotion*(1.2+vTouch*1.8))/24.0;
 p=floor(p*24.0)/24.0;float f=vTissue.x,d=specimen(f,p);if(d>0.0)discard;
 float cell=noise(floor(p*24.0)+vState.w),wear=step(.5,vState.y)*(1.0-step(1.5,vState.y));
 if(wear>.5&&cell<.12&&d>-.45)discard;
 float border=step(-.16,d),upper=step(specimen(f,p+vec2(-.04,.045)),d),seam=step(.82,fract(p.y*7.0+abs(p.x)*3.5));
 vec3 lime=vec3(.61961,1.0,.22745),blue=vec3(0.0,0.0,1.0),orange=vec3(1.0,.36,.09);
 float cold=max(wear*.85,step(fract(vState.w*.618),uCycle.y*.5));vec3 pigment=f>5.5?orange:mix(lime,blue,cold);
 float shade=.27+upper*.23+border*.24+seam*.13;
 float pore=step(.91,cell)*step(-.65,d)*(1.0-border)*uDetail;
 float vessel=step(abs(p.x+.12*sin(p.y*7.0+f)),.055);
 float transfer=pow(max(0.0,sin(p.y*21.0-uTime*(.9+vState.x)*uMotion+vState.w)),12.0);
 vec3 col=pigment*shade*(1.0-pore*.88);
 col+=pigment*vessel*(.2+transfer*.7*clamp(vState.x+.2,0.0,1.0))*uMedium;
 col+=pigment*(vTouch+vState.z*.3)*border*.3;
 if(f>5.5){float shell=step(.6,fract(p.y*11.0+p.x*4.0));col=orange*(.55+border*.4-shell*.2);col=mix(col,lime,vessel*transfer*.35*uDetail);}
 gl_FragColor=vec4(col,1.0);
 }`;
function floraBatch(capacity,uniforms){
 const g=new THREE.InstancedBufferGeometry();g.index=quad.index;g.setAttribute('position',quad.attributes.position);g.setAttribute('uv',quad.attributes.uv);
 const attrs={};for(const name of ['iRoot','iStart','iEnd','iState','iTissue']){const a=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(name,a);attrs[name]=a;}g.instanceCount=0;
 const mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms,vertexShader:floraVertex,fragmentShader:floraFragment,side:THREE.DoubleSide,transparent:true,forceSinglePass:true,depthTest:false,depthWrite:false}));mesh.frustumCulled=false;mesh.renderOrder=2;return{mesh,g,attrs,capacity};
}
function batch(capacity,kind,uniforms){
 const g=new THREE.InstancedBufferGeometry();const base=kind==='line'?ribbon:quad;g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
 const attrs={};for(const [name,size]of kind==='line'?[['iLine',4],['iInfo',4],['iIds',2],['iVelocity',4],['iTissue',4]]:[['iPosition',4],['iLife',4],['iExtra',4],['iProcess',4],['iCycle',4]]){const a=new THREE.InstancedBufferAttribute(new Float32Array(capacity*size),size);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(name,a);attrs[name]=a;}
 g.instanceCount=0;const material=new THREE.ShaderMaterial({uniforms,vertexShader:kind==='line'?lineVertex:bodyVertex,fragmentShader:kind==='line'?lineFragment:bodyFragment,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false});
 const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;return{mesh,g,attrs,capacity};
}
export class TerritoryRenderer{
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power',depth:false,stencil:false});this.renderer.setClearColor('#030405');this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,20);this.camera.position.z=10;
  this.uniforms={uTime:{value:0},uElapsed:{value:0},uMotion:{value:1},uMedium:{value:0},uDetail:{value:0},uScale:{value:1},uFine:{value:0},uPointer:{value:new THREE.Vector2(-999,-999)},uPresence:{value:0},uCycle:{value:new THREE.Vector4(0,1,0,.55)},uStorm:{value:new THREE.Vector4(-999,-999,0,0)}};
  this.bodies=batch(4300,'body',this.uniforms);this.lines=batch(2300,'line',this.uniforms);this.lines.mesh.renderOrder=0;this.bodies.mesh.renderOrder=1;this.scene.add(this.lines.mesh,this.bodies.mesh);this.flora=floraBatch(2800,this.uniforms);this.scene.add(this.flora.mesh);
  const pixels=new Uint8Array(48*48*4);this.field=new THREE.DataTexture(pixels,48,48,THREE.RGBAFormat);this.field.minFilter=this.field.magFilter=THREE.LinearFilter;this.field.needsUpdate=true;
  this.backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.ShaderMaterial({uniforms:{map:{value:this.field},time:this.uniforms.uTime},vertexShader:`varying vec2 vUv;${ISO_GLSL}void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(isometric(vec3(position.xy+vec2(1200.0),0.0)),1.0);}`,fragmentShader:'uniform sampler2D map;uniform float time;varying vec2 vUv;void main(){vec4 f=texture2D(map,vUv);vec2 cell=floor(vUv*800.0);float grain=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float deposit=step(.87,grain)*f.r;vec2 grid=fract(vUv*48.0);float edge=step(.965,max(grid.x,grid.y))*step(.22,f.r);vec3 c=vec3(.011765,.015686,.019608)+f.r*vec3(.002,.004,.001)+deposit*vec3(.009,.013,.002)+f.g*vec3(0.0,0.0,.018)+edge*vec3(.018,.025,.005);gl_FragColor=vec4(c,1.0);}',side:THREE.DoubleSide,depthTest:false,depthWrite:false}));this.backdrop.renderOrder=-1;this.scene.add(this.backdrop);
  this.state=null;this.received=0;this.lastField=-10;this.ratio=1;this.lastZoom=1;this.visibleCounts={bodies:0,lines:0};this.renderer.debug.onShaderError=(gl,p,vs,fs)=>{console.error('Pericarión shader',gl.getProgramInfoLog(p),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs));};
 }
 resize(width,height){this.width=width;this.height=height;this.ratio=Math.min(this.ratio,1,Math.sqrt(1600000/(width*height)));this.renderer.setPixelRatio(this.preview?Math.min(.5,this.ratio):this.ratio);this.renderer.setSize(width,height,false);}
 setPreview(value){if(this.preview===value)return;this.preview=value;if(this.width)this.resize(this.width,this.height);}
 setState(state,now){this.state=state;this.received=now;if(state.time-this.lastField>1){const pixels=this.field.image.data;for(let i=0;i<2304;i++){pixels[i*4]=Math.min(255,state.resource[i]*190);pixels[i*4+1]=Math.min(255,state.memory[i]*255);pixels[i*4+2]=0;pixels[i*4+3]=255;}this.field.needsUpdate=true;this.lastField=state.time;}this.upload(this.lastZoom);if(this.flora){const parts=buildFlora(state),n=Math.min(this.flora.capacity,parts.length),a=this.flora.attrs;for(let i=0;i<n;i++){const p=parts[i];a.iRoot.array.set(p.root,i*4);a.iStart.array.set(p.a,i*4);a.iEnd.array.set(p.b,i*4);a.iState.array.set(p.state,i*4);a.iTissue.array.set(p.tissue,i*4);}for(const v of Object.values(a))v.needsUpdate=true;this.flora.g.instanceCount=n;}}
 upload(zoom){
  if(!this.state)return;const body=this.state.bodies,packets=this.state.packets,out=[];const bins=new Map();const far=zoom<1.15;
  for(let i=0;i<body.length;i+=12){const type=body[i+5];if(type===2&&body[i+7]===2)continue;if(type===5&&zoom<2.9)continue;
   if(type===2&&far&&body[i+7]<1.5){const key=Math.floor(body[i]/70)+Math.floor(body[i+1]/70)*100;let a=bins.get(key);if(!a)bins.set(key,a=[0,0,0,0,0]);a[0]+=body[i];a[1]+=body[i+1];a[2]+=body[i+2];a[3]+=body[i+3];a[4]++;if(zoom>.6)for(let j=0;j<12;j++)out.push(body[i+j]);}else for(let j=0;j<12;j++)out.push(body[i+j]);
  }
  for(const a of bins.values())out.push(a[0]/a[4],a[1]/a[4],a[2]/a[4],a[3]/a[4],1.5+Math.log2(a[4]+1),6,.02,0,0,0,a[0],0);
  if(zoom>.9)for(const v of packets)out.push(v);
  const processes=new Map((this.state.membranes||[]).map(m=>[m.id,m])),tissues=new Map();for(let i=0;i<body.length;i+=12){if(body[i+5]===0||body[i+5]===1)tissues.set(body[i+10],{family:processes.get(body[i+10])?.family??body[i+11],radius:body[i+4]});}const a=this.bodies.attrs,count=Math.min(this.bodies.capacity,out.length/12);
  for(let i=0;i<count;i++){const type=out[i*12+5],m=type===0?processes.get(out[i*12+10]):null,family=m?.family??(type===3?tissues.get(out[i*12+11])?.family:type===1||type===5?out[i*12+11]:0)??0;a.iProcess.array.set(m?[m.pressure,m.scar,Math.min(1,m.refractory/22),family]:[0,0,0,family],i*4);a.iCycle.array.set(m?[this.state.time-m.lastRelease,this.state.time-m.lastCapture,m.age/Math.max(1,m.life),m.mass/6]:[100,100,0,0],i*4);for(let j=0;j<4;j++){a.iPosition.array[i*4+j]=out[i*12+j];a.iLife.array[i*4+j]=out[i*12+4+j];a.iExtra.array[i*4+j]=out[i*12+8+j];}}
  for(const v of Object.values(a))v.needsUpdate=true;this.bodies.g.instanceCount=count;
  const es=this.state.lines,l=this.lines.attrs,n=Math.min(this.lines.capacity,es.length/14);for(let i=0;i<n;i++){const source=tissues.get(es[i*14+8]),dest=tissues.get(es[i*14+9]);l.iTissue.array.set([gridPitch(source?.family??0),source?.family??0,source?.radius??3,dest?.radius??3],i*4);l.iLine.array.set(es.subarray(i*14,i*14+4),i*4);l.iInfo.array.set(es.subarray(i*14+4,i*14+8),i*4);l.iIds.array.set(es.subarray(i*14+8,i*14+10),i*2);l.iVelocity.array.set(es.subarray(i*14+10,i*14+14),i*4);}for(const v of Object.values(l))v.needsUpdate=true;this.lines.g.instanceCount=n;this.visibleCounts={bodies:count,lines:n};
 }
 render(view,now,reduced,presence){
  const scale=view.base*view.zoom,w=this.width/scale,h=this.height/scale;this.camera.left=-w/2;this.camera.right=w/2;this.camera.top=-h/2;this.camera.bottom=h/2;const centre=iso(view.x,view.y);this.camera.position.x=centre.x;this.camera.position.y=centre.y;this.camera.updateProjectionMatrix();
  // Inverted orthographic bounds match DOM coordinates (Y grows downward).
  this.camera.updateMatrixWorld();
  const lv=levels(view.zoom);this.uniforms.uFine.value=lv.fine;this.uniforms.uMedium.value=lv.medium;this.uniforms.uDetail.value=lv.detail;this.uniforms.uScale.value=scale;this.uniforms.uMotion.value=reduced?0:1;
  const elapsed=this.state?Math.min(.25,(now-this.received)/1000):0;this.uniforms.uElapsed.value=reduced?0:elapsed;this.uniforms.uTime.value=(this.state?.time||0)+(reduced?0:elapsed);
  const cycle=this.state?.climate||{activity:.5,blue:.5,phase:0,flow:1},storm=this.state?.storm;this.uniforms.uCycle.value.set(cycle.activity,cycle.blue,cycle.phase,cycle.flow);this.uniforms.uStorm.value.set(storm?.x??-999,storm?.y??-999,storm?.age??0,storm?Math.sin(Math.min(1,storm.age/1.2)*Math.PI/2)*Math.max(0,1-storm.age/14):0);
  this.uniforms.uPresence.value=presence?1:0;if(presence)this.uniforms.uPointer.value.set(presence.x,presence.y);
  if((view.zoom<1.15)!==(this.lastZoom<1.15)||(view.zoom>.6)!==(this.lastZoom>.6)||(view.zoom<2.9)!==(this.lastZoom<2.9)||(view.zoom>.9)!==(this.lastZoom>.9))this.upload(view.zoom);this.lastZoom=view.zoom;
  this.renderer.render(this.scene,this.camera);return{drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,lod:lv,instances:{...this.visibleCounts,laminae:this.flora?.g.instanceCount??0}};
 }
 lowerResolution(){if(this.ratio>.6){this.ratio=Math.max(.6,this.ratio-.1);this.resize(this.width,this.height);}}
 dispose(){this.renderer.dispose();}
}
export const SHADERS={bodyVertex,bodyFragment,lineVertex,lineFragment,floraVertex,floraFragment};
