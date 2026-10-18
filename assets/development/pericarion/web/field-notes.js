import{screenPoint,plantHeight,iso}from'./isometry.js';
import {distance,aperture} from './anatomy.js';
import {specimenDistance} from './flora.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function project(m,view,width,height,elapsed=0){const radius=m.base?m.base*Math.sqrt(m.mass/(m.max||6)):0;return screenPoint(m.x+(m.vx||0)*elapsed,m.y+(m.vy||0)*elapsed,plantHeight(radius,m.phase)*.5,view,width,height);}
// The same small pixel alphabet is used in records, controls and telemetry.
export function script(seed,count=7){let s='';for(let i=0;i<count;i++){const v=((seed*17+i*11)%13+13)%13,x=i*13;let d='';for(let y=0;y<8;y++)for(let c=0;c<5;c++){const stem=c===1&&y>0&&y<7,arm=y===2+v%3&&c>0,foot=y===6&&c<4,branch=c===3&&(y===(v%3)+1||y===(v%3)+2),mark=v%3===0&&c===4&&y===0;if(stem||arm||foot||branch||mark)d+=`M${c*2} ${y*2}h2v2h-2z`;}s+=`<g transform="translate(${x} 0)"><path d="${d}"/></g>`;}return s;}
export function recordControl(on){return `<svg viewBox="0 0 104 24" aria-hidden="true" focusable="false"><g class="pixel-script" transform="translate(5 4)">${script(41,5)}</g><path class="record-state" d="${on?'M80 4h16v16H80z M84 8v8h8V8z':'M80 4h6v4h-2v8h2v4h-6z M90 4h6v16h-6v-4h2V8h-2z'}" fill-rule="evenodd"/></svg>`;}
export function fieldInscription(activity=0){const n=Math.max(1,Math.min(5,Math.ceil(activity*5)));return `<svg viewBox="0 0 106 20" aria-hidden="true"><g class="pixel-script">${script(29,5)}</g><path class="field-meter" d="${Array.from({length:n},(_,i)=>`M${72+i*6} ${14-i*2}h4v${2+i*2}h-4z`).join('')}"/></svg>`;}
function specimen(f,phase,mass,max=6,gate=0){let path='';const size=phase===2?.25+.55*Math.sqrt(clamp(mass/max,0,1)):.6+.4*Math.sqrt(clamp(mass/max,0,1));for(let y=0;y<30;y++)for(let x=0;x<32;x++){const d=specimenDistance(f,(x-16)/(16*size),(30-y)/(19*size)),edge=d>-.2,opening=x>14&&x<18&&y>26-Math.round(gate*5),eroded=phase===1&&(x*7+y)%11<3;if(d<0&&(edge||(x+y*3)%9===0)&&!opening&&!eroded)path+=`M${x} ${y}h1v1h-1z`;}return path;}

export function noteMarkup(m,time){
 const h=(m.history||[]).slice(-6),phase=m.phase,f=m.family??m.id%6;
 const signs=['M-2-4h4v2h2v4H2v2h-4V2h-2v-4h2z','M-4-4h3v3h2v-3h3v3H2v2h2v3H1V1h-2v3h-3V1h2v-2h-2z','M-4 0h2v-4h4v4h2v4H-4z'];
 const seals=[0,1,2].map((p,i)=>`<g transform="translate(${90+i*24} 43)" class="phase-seal ${p===phase?'current':'faded'}" data-stage="${p}"><path class="seal-frame" d="M-8-8H8V8H-8z"/><path class="seal-sign" d="${signs[p]}"/></g>`).join('');
 const history=h.map((v,i)=>`<path d="M${86+i*10} 77v${-5-v.phase*3}h4v${5+v.phase*3}z"/>`).join('');
 const eventSize=time-(m.lastRelease??-100)<2.2?6:time-(m.lastCapture??-100)<2.2?4:2;
 return `<svg viewBox="0 0 166 90" class="note-sheet" data-phase="${phase}"><path class="note-divider" d="M12 29H154 M74 35V79"/><g class="pixel-script" transform="translate(15 7)">${script(m.id+f)}</g><g transform="translate(17 36)" class="note-tissue phase-${phase}"><path d="${specimen(f,phase,m.mass,m.max,m.gate)}"/></g>${m.host?'<path class="note-route" d="M49 56h8v-8h10v10h-4 M67 58v-5"/>':''}${seals}<path class="note-route" d="M98 43H106 M122 43H130 M138 54v6H90v-6"/><g class="note-history">${history}</g><path class="note-divider" d="M87 79H146"/><g class="pixel-script phase-script" transform="translate(17 72)">${script(m.id+phase*5,3)}</g><path class="note-event" d="M${150-eventSize/2} ${14-eventSize/2}h${eventSize}v${eventSize}h-${eventSize}z"/></svg>`;
}
export function chooseNotes(membranes,view,width,height,previous=[],focus=null){
 const limit=width<650?1:3;if(view.zoom<1.15)return[];
 const visible=membranes.filter(m=>{const p=project(m,view,width,height);return p.x>45&&p.x<width-100&&p.y>155&&p.y<height-140});
 const score=m=>Math.hypot(m.x-(focus?.x??view.x),m.y-(focus?.y??view.y));
 visible.sort((a,b)=>score(a)-score(b));const selected=previous.map(id=>visible.find(m=>m.id===id)).filter(Boolean).slice(0,limit);
 // Pointer motion never replaces the selected specimen.
 for(const m of visible){if(selected.length===limit)break;if(!selected.some(n=>n.id===m.id)&&selected.every(n=>Math.hypot(project(n,view,width,height).x-project(m,view,width,height).x,project(n,view,width,height).y-project(m,view,width,height).y)>210))selected.push(m);}
 return selected;
}
export function placeCard(anchor,width,height,index,occupied=[]){
 const w=166,h=90,margin=16,gap=Math.max(38,(anchor.radius||0)+25);const candidates=[[gap,-112],[-w-gap,-112],[gap,32],[-w-gap,32]];
 let best=null,bestScore=Infinity;
 for(let j=0;j<4;j++){const d=candidates[(j+index)%4],x=clamp(anchor.x+d[0],margin,Math.max(margin,width-w-90)),y=clamp(anchor.y+d[1],155,Math.max(155,height-h-140));let score=Math.abs(x-anchor.x-d[0])+Math.abs(y-anchor.y-d[1]);for(const r of occupied)if(x<r.x+w+12&&x+w+12>r.x&&y<r.y+h+12&&y+h+12>r.y)score+=1000;if(score<bestScore){best={x,y,w,h};bestScore=score;}}
 return best;
}
export class FieldNotes{
 constructor(container){this.container=container;this.enabled=true;this.items=new Map();this.state=null;this.received=0;this.lastSelect=-Infinity;this.selected=[];this.lastFrame=0;this.lastCamera=null;this.lastCameraMove=-Infinity;this.inRange=false;}
 setEnabled(on){this.enabled=on;}
 setState(state,now){this.state=state;this.received=now;}
 render(view,width,height,now,active,reduced,focus){
  if(!active||!this.state||height<400){this.container.hidden=true;this.lastFrame=now;return 0;}
  const dt=this.lastFrame?clamp((now-this.lastFrame)/1000,0,.3):.016;this.lastFrame=now;
  const elapsed=reduced?0:clamp((now-this.received)/1000,0,.25),time=this.state.time+elapsed;
  if(this.lastCamera){const movement=Math.hypot(...Object.values(iso(view.x-this.lastCamera.x,view.y-this.lastCamera.y)))*view.base*view.zoom+Math.abs(Math.log(view.zoom/this.lastCamera.zoom))*width;if(movement>2)this.lastCameraMove=now;}
  this.lastCamera={x:view.x,y:view.y,zoom:view.zoom};
  if(view.zoom>1.8)this.inRange=true;else if(view.zoom<1.15)this.inRange=false;
  const show=this.enabled&&this.inRange,limit=width<650?1:3,byId=new Map((this.state.membranes||[]).map(m=>[m.id,m]));
  let retained=0;for(const item of this.items.values()){const m=byId.get(item.id);const a=m?project(m,view,width,height,elapsed):null;item.m=m;item.retiring=!show||!a||a.x<-130||a.x>width+130||a.y<-100||a.y>height+100||retained>=limit;if(!item.retiring)retained++;}
  // Existing cards survive boundary jitter. New cards wait for navigation to settle.
  if(show&&now-this.lastSelect>700&&now-this.lastCameraMove>450){this.lastSelect=now;const chosen=chooseNotes(this.state.membranes||[],view,width,height,[...this.items.keys()]);
   const occupied=[...this.items.values()].map(i=>i.pos).filter(Boolean);
   for(const m of chosen){if(this.items.has(m.id)||this.items.size>=limit)continue;const a={...project(m,view,width,height,elapsed),radius:m.base*Math.sqrt(m.mass/(m.max||6))*view.base*view.zoom*.75},pos=placeCard(a,width,height,this.items.size,occupied);occupied.push(pos);
    const el=document.createElement('div');el.className='field-note';el.innerHTML='<svg class="note-leader" width="1" height="1"><path/><rect width="6" height="6"/></svg><div class="note-card"></div>';this.container.append(el);
    this.items.set(m.id,{id:m.id,m,el,leader:el.querySelector('.note-leader path'),dot:el.querySelector('.note-leader rect'),card:el.querySelector('.note-card'),key:null,opacity:0,retiring:false,pos:{...pos},target:{...pos},layoutAnchor:a,offset:{x:pos.x-a.x,y:pos.y-a.y},dimensions:{width,height},lastContent:-Infinity});
   }
  }
  this.container.hidden=this.items.size===0;
  for(const[id,item]of this.items){const m=item.m;item.opacity+=(Number(!item.retiring)-item.opacity)*(1-Math.exp(-dt/ .55));item.el.style.opacity=item.opacity.toFixed(3);
   if(item.retiring&&item.opacity<.015){item.el.remove();this.items.delete(id);continue;}if(!m)continue;
   const anchor=project(m,view,width,height,elapsed),resized=width!==item.dimensions.width||height!==item.dimensions.height;
   // Body movement moves the leader; the card stays still until a real camera displacement.
   if(Math.hypot(anchor.x-item.layoutAnchor.x,anchor.y-item.layoutAnchor.y)>125||resized){item.target.x=clamp(anchor.x+item.offset.x,16,Math.max(16,width-256));item.target.y=clamp(anchor.y+item.offset.y,155,Math.max(155,height-230));item.layoutAnchor=anchor;item.dimensions={width,height};}
   const blend=1-Math.exp(-dt/.65);item.pos.x+=(item.target.x-item.pos.x)*blend;item.pos.y+=(item.target.y-item.pos.y)*blend;
   item.card.style.transform=`translate(${Math.round(item.pos.x/2)*2}px,${Math.round(item.pos.y/2)*2}px)`;
   const ex=item.pos.x>anchor.x?item.pos.x:item.pos.x+166,ey=item.pos.y+45,dx=ex-anchor.x,dy=ey-anchor.y,d=Math.max(1,Math.hypot(dx,dy)),r=m.base*Math.sqrt(m.mass/(m.max||6))*view.base*view.zoom*.65,start=Math.min(r,d*.4);
   const sx=Math.round((anchor.x+dx/d*start)/2)*2,sy=Math.round((anchor.y+dy/d*start)/2)*2,mx=Math.round((anchor.x+dx*.55)/2)*2;
   item.leader.setAttribute('d',`M${sx} ${sy}H${mx}V${Math.round(ey/2)*2}H${Math.round(ex/2)*2}`);item.dot.setAttribute('x',Math.round(anchor.x/2)*2-3);item.dot.setAttribute('y',Math.round(anchor.y/2)*2-3);
   // Stage/history changes bypass the slower refresh of reserve and event marks.
   const stageKey=[m.phase,m.cycles,m.history?.at(-1)?.time].join(':');
   if(stageKey!==item.stageKey||now-item.lastContent>250){const key=[stageKey,Math.round(m.mass*10),Math.round(m.gate*10),!!m.host,time-(m.lastRelease??-100)<2.2,time-(m.lastCapture??-100)<2.2].join(':');if(key!==item.key){item.card.innerHTML=noteMarkup(m,time);item.card.setAttribute('data-phase',String(m.phase));item.key=key;}item.stageKey=stageKey;item.lastContent=now;}

  }
  this.selected=[...this.items.values()].filter(i=>!i.retiring).map(i=>i.m);return this.selected.length;
 }
}
