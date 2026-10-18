import{screenPoint,plantHeight,iso}from'./isometry.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// Measure the current view, never the entire population as a proxy for density.
export function soundFrame(state,view,gesture={}){
 const width=view.width||1280,height=view.height||800,s=(view.base||.6)*view.zoom,halfW=width/(2*s),halfH=height/(2*s),body=state.bodies||[],macro=state.climate||{blue:.5,activity:.5};
 let area=0,count=0,blueArea=0,colorArea=0,particles=0,orange=0,flow=0;
 for(let i=0;i<body.length;i+=12){const x=body[i],y=body[i+1],r=body[i+4],type=body[i+5],phase=body[i+7];const p=screenPoint(x,y,type===0?plantHeight(r,phase)*.5:0,view,width,height);if(p.x<-r*s||p.x>width+r*s||p.y<-r*s||p.y>height+r*s||type===5&&view.zoom<2.9)continue;count++;if(type===2){particles++;if(phase===2)orange++;}flow+=Math.hypot(body[i+2],body[i+3]);
  const weight=Math.min(width*height*.08,Math.PI*(r*s)**2)*(type===0?1:type===1?.5:type===5?.2:.06);area+=weight;
  if(type===0||type===1){const blue=type===0?(phase===2?.8:phase===1&&body[i+9]>4.8?1:macro.blue*.55):(phase>3.5?1:macro.blue*.4);blueArea+=weight*blue;colorArea+=weight;}
 }
 const depth=clamp(Math.log(view.zoom/.45)/Math.log(22/.45)),density=clamp(Math.sqrt(area/(width*height))*.95+Math.log1p(count)/12*.35),blue=colorArea?blueArea/colorArea:macro.blue;
 const pointer=Math.hypot(...Object.values(iso(gesture.dx||0,gesture.dy||0)))*s/60,motion=clamp(pointer+(gesture.cameraMotion||0)*.35+(gesture.zoomMotion||0)*.5);
 const storm=state.storm?clamp(1-state.storm.age/14)*Math.exp(-((state.storm.x-view.x)**2+(state.storm.y-view.y)**2)/800000):0;
 return{depth,density,blue,motion,drag:gesture.drag?1:0,pan:clamp(iso(gesture.dx||0,gesture.dy||0).x*s/120,-1,1),cycle:macro.activity,storm,visible:count,particles,orange,flow:count?flow/count:0,regionX:view.x/400,regionY:view.y/400};
}
export function mapSound(f){return{cutoff:180+f.depth*f.depth*3400,layerGain:.009+f.density*.023,breathRate:.055+f.density*.22,harmonicStretch:1+f.blue*.11,beating:.7+f.blue*5,airGain:.002+f.motion*.015+f.drag*f.motion*.009+f.storm*.008,pan:f.pan*(.25+.6*f.motion),breathDepth:.0015+f.density*.0035};}
// Original regional motifs: position changes their register and contour; ecology
// changes articulation. A 16-step phrase returns inside the 108-second season.
export function scoreFrame(f,time){const rx=Math.floor(f.regionX||0),ry=Math.floor(f.regionY||0),region=((rx*7+ry*11)%12+12)%12,step=Math.floor(time/.72),phrase=step%16,season=Math.floor(time/108),degrees=[0,2,4,7,9];const seed=(region*17+phrase*7+season*3+Math.floor((f.flow||0)/12))%25;
 const degree=degrees[seed%5],root=45+[0,5,7,2][region%4],octave=f.depth>.65?24:12;
 return{step,region,root,midi:root+degree+octave,answer:root+degrees[(seed+2)%5]+12,gate:(seed%7)/7<.25+f.density*.7,duration:1.2+f.blue*1.8,echoes:Math.min(4,1+Math.floor((f.particles||0)/65)),eventSpacing:.16+.28*(1-f.depth)};
}
const frequency=midi=>440*Math.pow(2,(midi-69)/12);
function envelope(param,time,peak,duration){param.cancelScheduledValues(time);param.setValueAtTime(0,time);param.linearRampToValueAtTime(peak,time+.045);param.setTargetAtTime(.00001,time+.12,duration/5);param.setValueAtTime(0,time+duration);}
// Six continuous partials, one breathing modulator and one filtered noise bed.
// No per-event chimes, growing voice lists, sample downloads or FFT work.
export class EcosystemAudio{
 constructor(){this.enabled=false;this.active=false;this.volume=.22;this.layers=[];this.lastTime=0;this.previousView=null;this.suspendTimer=null;this.lastFrame=null;this.targets=null;this.voices=[];this.eventVoices=[];this.lastStep=-1;this.seenEvents=new Set();this.lastEvent=-Infinity;}
 async enable(){
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return false;
  try{if(!this.context)this.prepare(new Context());await this.context.resume();this.enabled=true;this.sync();return true;}catch{return false;}
 }
 prepare(c){
  this.context=c;this.master=c.createGain();this.master.gain.value=0;
  const limit=c.createDynamicsCompressor();limit.threshold.value=-16;limit.knee.value=15;limit.ratio.value=3;limit.attack.value=.025;limit.release.value=.7;this.master.connect(limit).connect(c.destination);
  this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=260;this.filter.Q.value=.45;
  this.space=c.createStereoPanner();this.filter.connect(this.space).connect(this.master);
  this.delay=c.createDelay(1.5);this.delay.delayTime.value=.67;this.feedback=c.createGain();this.feedback.gain.value=.24;this.wet=c.createGain();this.wet.gain.value=.2;this.space.connect(this.delay);this.delay.connect(this.feedback).connect(this.delay);this.delay.connect(this.wet).connect(this.master);
  this.breath=c.createOscillator();this.breath.type='sine';this.breath.frequency.value=.08;this.breathGain=c.createGain();this.breathGain.gain.value=.0025;this.breath.connect(this.breathGain);
  const frequencies=[52.32,78.48,104.65,157.1,209.3,314.8];
  for(let i=0;i<6;i++){const osc=c.createOscillator(),gain=c.createGain(),pan=c.createStereoPanner();osc.type=i<2?'sine':i<4?'triangle':'sawtooth';osc.frequency.value=frequencies[i];gain.gain.value=.007;pan.pan.value=(i%2?1:-1)*(.12+i*.08);osc.connect(gain).connect(pan).connect(this.filter);this.breathGain.connect(gain.gain);osc.start();this.layers.push({osc,gain,base:frequencies[i]});}
  this.breath.start();
  const buffer=c.createBuffer(1,Math.floor(c.sampleRate*2),c.sampleRate),data=buffer.getChannelData(0);let smooth=0;for(let i=0;i<data.length;i++){smooth=smooth*.72+(Math.random()*2-1)*.28;data[i]=smooth;}
  this.air=c.createBufferSource();this.air.buffer=buffer;this.air.loop=true;this.airFilter=c.createBiquadFilter();this.airFilter.type='bandpass';this.airFilter.frequency.value=850;this.airFilter.Q.value=.55;this.airGain=c.createGain();this.airGain.gain.value=.002;this.airPan=c.createStereoPanner();this.air.connect(this.airFilter).connect(this.airGain).connect(this.airPan).connect(this.filter);this.air.start();
  // A fixed pool: three soft melodic voices and two disruption voices.
  for(let i=0;i<5;i++){const osc=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter(),pan=c.createStereoPanner();osc.type=i===1?'triangle':i<3?'sawtooth':'sine';gain.gain.value=0;filter.type='lowpass';filter.frequency.value=i<3?750:1200;filter.Q.value=i<3?1.1:2;pan.pan.value=(i%2?1:-1)*.3;osc.connect(filter).connect(gain).connect(pan).connect(this.space);osc.start();const voice={osc,gain,filter,pan,busy:0};(i<3?this.voices:this.eventVoices).push(voice);}

 }
 setActive(value){this.active=!!value;this.sync();if(!this.active){this.previousView=null;this.lastStep=-1;if(this.context)for(const v of [...this.voices,...this.eventVoices]){v.gain.gain.cancelScheduledValues(this.context.currentTime);v.gain.gain.setTargetAtTime(0,this.context.currentTime,.08);v.busy=0;}}}
 setVolume(value){this.volume=clamp(Number(value)||0);this.sync();}
 sync(){if(!this.context)return;clearTimeout(this.suspendTimer);const audible=this.enabled&&this.active;this.master.gain.setTargetAtTime(audible?this.volume:0,this.context.currentTime,.15);if(audible){Promise.resolve(this.context.resume()).catch(()=>{});}else{this.suspendTimer=setTimeout(()=>{if(!this.enabled||!this.active)Promise.resolve(this.context.suspend?.()).catch(()=>{});},700);}}
 update(state,view,gesture={}){
  if(!this.enabled||!this.active||!this.context)return;
  const now=gesture.now??performance.now(),dt=this.lastTime?clamp((now-this.lastTime)/1000,.05,1):.15;if(this.lastTime&&now-this.lastTime<120)return;this.lastTime=now;
  const old=this.previousView,s=(view.base||.6)*view.zoom;
  const cameraMotion=old?clamp(Math.hypot(...Object.values(iso(view.x-old.x,view.y-old.y)))*s/(dt*600)):0,zoomMotion=old?clamp(Math.abs(Math.log(view.zoom/old.zoom))/(dt*1.7)):0;this.previousView={x:view.x,y:view.y,zoom:view.zoom};
  const f=soundFrame(state,view,{...gesture,cameraMotion,zoomMotion}),p=mapSound(f),c=this.context,t=c.currentTime,score=scoreFrame(f,state.time);this.lastFrame=f;this.targets=p;
  this.filter.frequency.setTargetAtTime(p.cutoff,t,.8);this.space.pan.setTargetAtTime(p.pan,t,.6);this.airPan.pan.setTargetAtTime(-p.pan*.8,t,.7);this.airGain.gain.setTargetAtTime(p.airGain,t,.4);this.airFilter.frequency.setTargetAtTime(650+f.blue*1100,t,1.1);
  this.breath.frequency.setTargetAtTime(p.breathRate,t,1.4);this.breathGain.gain.setTargetAtTime(p.breathDepth,t,1.1);this.delay.delayTime.setTargetAtTime(.52+f.cycle*.25,t,2.5);
  // The listener changes the current region, not the world's clock or its rules.
  if(score.step!==this.lastStep){this.lastStep=score.step;if(score.gate){const voice=this.voices[score.step%3],midi=score.step%4===3?score.answer:score.midi;voice.osc.frequency.setTargetAtTime(frequency(midi),t,.06);voice.osc.detune.setTargetAtTime(Math.sin(state.time*.13+score.region)*4,t,.4);voice.filter.frequency.setTargetAtTime(380+f.depth*1900+f.cycle*500,t,.25);voice.filter.Q.setTargetAtTime(.7+f.blue*1.2,t,.4);envelope(voice.gain.gain,t,(.008+f.density*.015)*(f.storm>.1?.7:1),score.duration);}}
  // Only new, recent, locally audible disturbances can excite the fixed pool.
  for(const event of state.events||[]){if(this.seenEvents.has(event.id))continue;this.seenEvents.add(event.id);if(this.seenEvents.size>64)this.seenEvents.delete(this.seenEvents.values().next().value);
   if(!Number.isFinite(event.x)||!Number.isFinite(event.y)||state.time-event.time>2.5||state.time-event.time<0||state.time-this.lastEvent<1.2)continue;
   const screen=screenPoint(event.x,event.y,0,view,view.width||1280,view.height||800),margin=100;if(screen.x<-margin||screen.x>(view.width||1280)+margin||screen.y<-margin||screen.y>(view.height||800)+margin)continue;
   const voice=this.eventVoices.find(v=>v.busy<=t);if(!voice)continue;this.lastEvent=state.time;const duration=.55,interval=score.eventSpacing,peak=.018+Math.min(1,(event.amount||1)/24)*.012;
   voice.osc.frequency.cancelScheduledValues(t);voice.osc.frequency.setValueAtTime(frequency(score.midi-12),t);voice.osc.frequency.exponentialRampToValueAtTime(frequency(score.midi+7),t+.3);voice.filter.frequency.setTargetAtTime(700+f.depth*1700,t,.08);voice.pan.pan.setTargetAtTime(clamp(screen.x/(view.width||1280)*2-1,-.8,.8),t,.1);
   voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setValueAtTime(0,t);
   for(let repeat=0;repeat<score.echoes;repeat++){const start=t+repeat*(duration+interval),amp=peak*Math.pow(.58,repeat);voice.gain.gain.setValueAtTime(0,start);voice.gain.gain.linearRampToValueAtTime(amp,start+.035);voice.gain.gain.exponentialRampToValueAtTime(.00001,start+duration);}
   voice.busy=t+score.echoes*(duration+interval);voice.gain.gain.setValueAtTime(0,voice.busy);this.lastDisruption={id:event.id,echoes:score.echoes,particles:f.particles};
  }

  for(let i=0;i<this.layers.length;i++){const layer=this.layers[i],wander=Math.sin(state.time*(.013+i*.004)+view.x*.0006+i*2.1)*.8;layer.osc.frequency.setTargetAtTime(frequency(score.root-12)*[1,1.5,2,3,4,6][i]*(1+(p.harmonicStretch-1)*.018)+(i%2?1:-1)*p.beating*.3+wander,t,1.7);layer.osc.detune.setTargetAtTime(f.motion*(i%2?3:-3)+f.storm*4,t,.8);layer.gain.gain.setTargetAtTime(p.layerGain*(i<2?.9:.45+f.depth*.35)*(1+.1*Math.sin(state.time*.041+i)),t,1.2);}
 }
}
