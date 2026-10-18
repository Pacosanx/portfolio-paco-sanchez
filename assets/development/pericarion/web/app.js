import{worldPoint,uniso}from'./isometry.js';
import{pickFlora}from'./flora.js';
import{TerritoryRenderer}from'./territory-renderer.js';
import{EcosystemAudio}from'./ecosystem-audio.js';
import{FieldNotes,recordControl,fieldInscription}from'./field-notes.js';
const audio=new EcosystemAudio();
const $=id=>document.getElementById(id),canvas=$('world'),panels=[$('entry')];
const notes=new FieldNotes($('field-notes'));
const target={x:1200,y:1100,zoom:1},view={...target,base:1},pointers=new Map();
let width=1,height=1,renderer=null,worker=null,entered=false,failed=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let hover=null,dwell=0,keyboardPresence=false,pinch=null,frameId=null,lastFrame=0,lastPresence=performance.now();
let motionX=0,motionY=0,focusUntil=0,focusLocation=null,press=null;
let lastAudio=0;
let state=null,pendingDraw=false,fpsStart=performance.now(),fpsFrames=0,smoothFps=0,lastResolution=0;
const metrics={simulationMs:0,packingMs:0,uploadMs:0,drawMs:0,drawCalls:0,fps:0,lod:{medium:0,detail:0},counts:{},time:0};
const anyPanel=()=>panels.some(d=>d.open),active=()=>entered&&!document.hidden&&!anyPanel();
const previewing=()=>$('entry').open&&!document.hidden;const running=()=>active()||previewing();
const scale=()=>view.base*target.zoom;
function point(x,y,current=false){const v=current?view:target,s=view.base*v.zoom;return worldPoint(x,y,{...v,base:view.base},width,height);}
function presencePoint(x,y){return pickFlora(state,x,y,view,width,height)||point(x,y,true);}
function clampCamera(){target.x=Math.max(0,Math.min(2400,target.x));target.y=Math.max(0,Math.min(2400,target.y));}
function labels(){$('scale').textContent=`${target.zoom.toFixed(1)}×`;$('position').textContent=`${Math.round(target.x)} : ${Math.round(target.y)}`;$('scale-unit').textContent=`${Math.round(70/scale())} u`;}
function invalidate(){pendingDraw=true;if(frameId===null&&!document.hidden)frameId=requestAnimationFrame(frame);}
function cancelDraw(){if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;}
function syncMode(){cancelDraw();worker?.postMessage({type:'mode',visible:running(),preview:previewing()});renderer?.setPreview(previewing());audio.setActive(entered&&!document.hidden);lastPresence=performance.now();lastFrame=0;fpsStart=performance.now();fpsFrames=0;smoothFps=0;if(!document.hidden&&renderer)invalidate();}
function clearPresence(){focusUntil=0;focusLocation=null;motionX=motionY=0;press=null;hover=null;dwell=0;keyboardPresence=false;pointers.clear();pinch=null;}
function openPanel(id){clearPresence();$(id).showModal();syncMode();}
function closePanel(id){$(id).close();canvas.focus({preventScroll:true});syncMode();}
function setReduced(value){reduced=value;$('motion').setAttribute('aria-pressed',String(value));$('motion').textContent=value?'Movimiento reducido: sí':'Movimiento reducido';if(value)Object.assign(view,target);syncMode();}
function resize(){width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);view.base=Math.min(width/1800,height/1300);renderer?.resize(width,height);labels();invalidate();}
function zoomBy(mult,x=width/2,y=height/2){const before=point(x,y);target.zoom=Math.max(.45,Math.min(22,target.zoom*mult));const after=point(x,y);target.x+=before.x-after.x;target.y+=before.y-after.y;clampCamera();labels();if(active()){focusLocation=presencePoint(x,y);focusUntil=performance.now()+1800;}invalidate();}
function startSimulation(){
 if(worker||failed)return;
 try{
  if(!renderer){renderer=new TerritoryRenderer(canvas);renderer.resize(width,height);}
  worker=new Worker(new URL('./simulation-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=e=>{if(e.data.type!=='state')return;state=e.data.state;const began=performance.now();notes.setState(state,began);renderer.setState(state,began);metrics.uploadMs=performance.now()-began;metrics.simulationMs=state.timings.simulationMs;metrics.packingMs=state.timings.packingMs;metrics.time=state.time;metrics.counts=state.counts;worker.postMessage({type:'ack'});if(running())invalidate();};
  worker.onerror=()=>{failed=true;worker?.terminate();worker=null;cancelDraw();$('presence-status').textContent='La simulación se detuvo. Recargá para volver.';};
  worker.postMessage({type:'init',seed:crypto.getRandomValues(new Uint32Array(1))[0],visible:running(),preview:previewing()});renderer.setPreview(previewing());invalidate();
 }catch(error){failed=true;console.error(error);$('presence-status').textContent='Este navegador necesita WebGL 2 para entrar.';$('graphics-error').hidden=false;}
}
function frame(now){
 frameId=null;if(document.hidden||!renderer)return;
 const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):.016;lastFrame=now;
 const blend=reduced?1:1-Math.exp(-dt*18);for(const k of ['x','y','zoom'])view[k]+=(target[k]-view[k])*blend;
 if(running()||pendingDraw){
  const p=active()&&(keyboardPresence?{x:view.x,y:view.y}:hover?presencePoint(hover.x,hover.y):now<focusUntil?focusLocation:null);
  const began=performance.now(),result=renderer.render(view,now,reduced,p);metrics.drawMs=metrics.drawMs*.85+(performance.now()-began)*.15;Object.assign(metrics,result);const notesStart=performance.now();metrics.notes=notes.render(view,width,height,now,active(),reduced,p);metrics.notesMs=(metrics.notesMs||0)*.85+(performance.now()-notesStart)*.15;if(entered&&state&&now-lastAudio>120){const audioStart=performance.now();audio.update(state,{...view,width,height},{dx:motionX,dy:motionY,drag:pointers.size>0,now});metrics.audioMs=performance.now()-audioStart;metrics.sound=audio.lastFrame;lastAudio=now;}pendingDraw=false;fpsFrames++;
  if(now-fpsStart>=500){const recent=fpsFrames*1000/(now-fpsStart);smoothFps=smoothFps?smoothFps*.55+recent*.45:recent;metrics.fps=smoothFps;$('fps').textContent=`FPS ${Math.round(smoothFps)}`;const band=Math.ceil((state?.climate?.activity||0)*5);if($('field-script').dataset.band!==String(band)){$('field-script').innerHTML=fieldInscription(state?.climate?.activity||0);$('field-script').dataset.band=String(band);}fpsStart=now;fpsFrames=0;canvas.dataset.diagnostics=JSON.stringify({...metrics,zoom:view.zoom,position:{x:view.x,y:view.y},ratio:renderer.ratio,reduced});
   if(active()&&!reduced&&now-lastResolution>5000&&smoothFps<35&&smoothFps>0){renderer.lowerResolution();lastResolution=now;}
  }
 }
 const moving=Math.abs(view.x-target.x)+Math.abs(view.y-target.y)+Math.abs(view.zoom-target.zoom)>.01;
 if(active()&&(!reduced||moving)&&!failed)frameId=requestAnimationFrame(frame);
}
setInterval(()=>{if(!active()||!worker)return;const now=performance.now(),dt=Math.min(.3,(now-lastPresence)/1000);lastPresence=now;if(hover||keyboardPresence||now<focusUntil){dwell+=dt;const p=keyboardPresence?view:hover?presencePoint(hover.x,hover.y):focusLocation;worker.postMessage({type:'presence',kind:Math.hypot(motionX,motionY)>1?'motion':'stay',x:p.x,y:p.y,dx:motionX,dy:motionY,strength:.38+Math.min(.62,dwell/6),dt});}else dwell=0;motionX=motionY=0;},150);
setReduced(reduced);
function enter(){if(!$('entry').open)return;entered=true;void audio.enable();closePanel('entry');startSimulation();}
$('entry').onclick=enter;
$('entry').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();enter();}});
$('entry').addEventListener('cancel',e=>{e.preventDefault();enter();});
$('home').onclick=e=>{e.preventDefault();openPanel('entry');};
function notesControl(){const button=$('notes-toggle');button.setAttribute('aria-pressed',String(notes.enabled));button.setAttribute('aria-label',notes.enabled?'Ocultar bitácora':'Mostrar bitácora');button.dataset.state=notes.enabled?'A':'B';button.innerHTML=recordControl(notes.enabled);}
notesControl();$('field-script').innerHTML=fieldInscription();
$('notes-toggle').onclick=()=>{notes.setEnabled(!notes.enabled);notesControl();invalidate();};
// Retry an interrupted audio context from a genuine gesture, never toggle it off.
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{if(entered&&(!audio.enabled||audio.context?.state==='suspended'))void audio.enable();});
$('zoom-in').onclick=()=>zoomBy(1.35);$('zoom-out').onclick=()=>zoomBy(1/1.35);$('motion').onclick=()=>setReduced(!reduced);
panels.forEach(d=>d.addEventListener('close',syncMode));
canvas.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(-Math.max(-250,Math.min(250,e.deltaY))*.0023),e.offsetX,e.offsetY);},{passive:false});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);press=pointers.size?null:{x:e.offsetX,y:e.offsetY,time:performance.now(),id:e.pointerId};pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});hover={x:e.offsetX,y:e.offsetY};dwell=0;});
canvas.addEventListener('pointermove',e=>{
 const x=e.offsetX,y=e.offsetY,old=pointers.get(e.pointerId);
 if(press&&Math.hypot(x-press.x,y-press.y)>6)press=null;
 if(hover){const delta=uniso((x-hover.x)/scale(),(y-hover.y)/scale());motionX=Math.max(-90,Math.min(90,motionX+delta.x));motionY=Math.max(-90,Math.min(90,motionY+delta.y));}
 if(old){pointers.set(e.pointerId,{x,y});if(pointers.size===1){const delta=uniso((x-old.x)/scale(),(y-old.y)/scale());target.x-=delta.x;target.y-=delta.y;clampCamera();labels();invalidate();}else if(pointers.size===2){const a=[...pointers.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)zoomBy(distance/pinch,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);pinch=distance;}}
 if(hover&&Math.hypot(x-hover.x,y-hover.y)>8)dwell=0;hover={x,y};if(active())invalidate();
});
function release(e){if(e.type!=='pointercancel'&&press&&press.id===e.pointerId&&pointers.size===1&&performance.now()-press.time<750&&active()){const p=presencePoint(press.x,press.y);worker?.postMessage({type:'presence',kind:'touch',x:p.x,y:p.y,strength:1,dt:.15});focusLocation=p;focusUntil=performance.now()+1800;invalidate();}press=null;pointers.delete(e.pointerId);pinch=null;if(e.pointerType!=='mouse')hover=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('pointerleave',()=>{if(!pointers.size){hover=null;dwell=0;}});
canvas.addEventListener('keydown',e=>{if(anyPanel())return;const delta=70/scale();let handled=true;if(e.key.startsWith('Arrow')){const d=uniso(e.key==='ArrowLeft'?-delta:e.key==='ArrowRight'?delta:0,e.key==='ArrowUp'?-delta:e.key==='ArrowDown'?delta:0);target.x+=d.x;target.y+=d.y;}else if(e.key==='+'||e.key==='=')zoomBy(1.3);else if(e.key==='-')zoomBy(1/1.3);else if(e.key==='Enter'||e.key===' '){worker?.postMessage({type:'presence',kind:'touch',x:view.x,y:view.y,strength:1,dt:.15});focusLocation={x:view.x,y:view.y};focusUntil=performance.now()+1800;}else if(e.key.toLowerCase()==='p'){keyboardPresence=!keyboardPresence;dwell=0;}else handled=false;if(handled){e.preventDefault();clampCamera();labels();invalidate();}});
document.addEventListener('visibilitychange',()=>{clearPresence();syncMode();});window.addEventListener('blur',clearPresence);window.addEventListener('pagehide',()=>{cancelDraw();audio.setActive(false);worker?.postMessage({type:'mode',visible:false});});window.addEventListener('pageshow',syncMode);window.addEventListener('resize',resize);resize();
// Let the entry paint before preparing its bounded, low-resolution living view.
requestAnimationFrame(()=>{if(!document.hidden)startSimulation();});
if(document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'navigate_territory',title:'Recorrer el territorio',description:'Desplaza o cambia la escala de la mirada.',inputSchema:{type:'object',properties:{dx:{type:'number',minimum:-500,maximum:500},dy:{type:'number',minimum:-500,maximum:500},zoomFactor:{type:'number',minimum:.5,maximum:2}},additionalProperties:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['dx','dy','zoomFactor'].includes(k)))throw Error('Parámetros no válidos');for(const k of Object.keys(input)){const v=input[k];if(!Number.isFinite(v)||v<(k==='zoomFactor'?.5:-500)||v>(k==='zoomFactor'?2:500))throw Error('Valor fuera de rango');}if(!active())throw Error('Entrá al territorio antes de recorrerlo');target.x+=input.dx??0;target.y+=input.dy??0;clampCamera();if(input.zoomFactor)zoomBy(input.zoomFactor);labels();invalidate();return {...target};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}

// Portfolio controls: only the same-origin containing document may set sound.
let portfolioMuted=new URLSearchParams(location.search).get('muted')==='1';
function setPortfolioMuted(value){
 portfolioMuted=Boolean(value);
 audio.setVolume(portfolioMuted?0:.22);
 if(!portfolioMuted&&entered)void audio.enable();
 document.documentElement.dataset.portfolioMuted=String(portfolioMuted);
 if(parent!==window)parent.postMessage({type:'pericarion:state',muted:portfolioMuted},location.origin);
}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='pericarion:set-muted')return;
 setPortfolioMuted(event.data.muted);
});
document.documentElement.dataset.portfolioReady='true';
setPortfolioMuted(portfolioMuted);
