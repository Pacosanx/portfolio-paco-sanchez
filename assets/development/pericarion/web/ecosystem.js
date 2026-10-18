import{climate,PERIOD}from'./climate.js';
import{captures,mouth}from'./anatomy.js';
export const SIZE=2400,COLS=48,CELL=SIZE/COLS;
export class SpatialIndex{
 constructor(cell=70){this.cell=cell;this.bins=new Map();}
 key(x,y){return Math.floor(x/this.cell)+Math.floor(y/this.cell)*100;}
 rebuild(items){this.bins.clear();for(const o of items){const k=this.key(o.x,o.y);let b=this.bins.get(k);if(!b)this.bins.set(k,b=[]);b.push(o);}}
 near(x,y,r,visit){const c=this.cell;for(let by=Math.floor((y-r)/c);by<=Math.floor((y+r)/c);by++)for(let bx=Math.floor((x-r)/c);bx<=Math.floor((x+r)/c);bx++){const b=this.bins.get(bx+by*100);if(b)for(const o of b)visit(o);}}
 nearest(x,y,r,exclude=null){let best=null,d=r*r;this.near(x,y,r,o=>{const q=(o.x-x)**2+(o.y-y)**2;if(o!==exclude&&q<d){d=q;best=o;}});return best;}
}
export class Ecosystem{
 constructor(seed=324918){
  this.seed=seed;this.time=0;this.nextId=0;this.resource=new Float32Array(COLS*COLS);this.memory=new Float32Array(COLS*COLS);this.presence=new Float32Array(COLS*COLS);this.buffer=new Float32Array(COLS*COLS);
  this.nodes=[];this.edges=[];this.masses=[];this.particles=[];this.organisms=[];this.residues=[];this.packets=[];
  this.nodeGrid=new SpatialIndex();this.massGrid=new SpatialIndex(150);this.adjacency=new Map();
  this.stats={released:0,captured:0,delivered:0,growth:0,deaths:0,regenerated:0,exchanges:0,ruptures:0};this.events=[];this.fronts=[];this.storm=null;this.nextStorm=42;this.lastBloom=-1;this.stats.storms=0;this.stats.blooms=0;
  this.centres=[[650,680,290],[1250,460,240],[1780,970,330],[1570,1650,360],[600,1640,270],[1060,1140,260]];
  for(let y=0;y<COLS;y++)for(let x=0;x<COLS;x++){const d=this.density((x+.5)*CELL,(y+.5)*CELL);this.resource[y*COLS+x]=.25+d*.55+this.random()*.15;}
  for(let g=0;g<this.centres.length;g++){
   const [cx,cy,r]=this.centres[g];const roots=[];
   for(let j=0;j<9;j++){const a=this.random()*6.28,q=Math.sqrt(this.random())*r*.85;const m={id:this.nextId++,x:cx+Math.cos(a)*q,y:cy+Math.sin(a)*q,base:22+this.random()*55,mass:2+this.random()*4,max:6,age:this.random()*55,life:55+this.random()*25,phase:j%4===0?1:0,fuel:.3+this.random()*.5,gate:0,signal:0,group:g,emit:0,ship:0,host:null,family:(this.nextId-1)%6,cycles:0};this.masses.push(m);}
   for(let j=0;j<8;j++){const a=this.random()*6.28,q=this.random()*r*.7;roots.push(this.addNode(cx+Math.cos(a)*q,cy+Math.sin(a)*q,null,g));}
   // Existing branches have history; creation is independent of camera scale.
   for(let j=0;j<100;j++){const parent=j<24?roots[j%8]:this.nodes[this.nodes.length-1-Math.floor(this.random()*Math.min(35,j))];const a=parent.angle+(this.random()-.5)*1.8;this.addNode(parent.x+Math.cos(a)*(15+this.random()*22),parent.y+Math.sin(a)*(15+this.random()*22),parent,g);}
  }
  this.rebuild();
  for(const m of this.masses){m.host=this.nodeGrid.nearest(m.x,m.y,220)?.id??this.nodes[0].id;}
  for(let i=0;i<950;i++){const p=this.sample();this.addParticle(p.x,p.y,i%6===0?1:0,.015+this.random()*.02);}
  for(let i=0;i<300;i++){const m=this.masses[i%this.masses.length];this.organisms.push({id:this.nextId++,host:m.id,phase:this.random()*6.28,orbit:.3+this.random()*.55,age:this.random()*90,life:80+this.random()*120,energy:.3+this.random()*.5});}
 }
 // A saved, pre-evolved world avoids both a cold ecological start and a costly
 // warm-up on the visitor's computer. Camera state is never part of this state.
 snapshot(){return{...this,resource:[...this.resource],memory:[...this.memory],presence:[...this.presence],buffer:undefined,nodeGrid:undefined,massGrid:undefined,adjacency:undefined,byNode:undefined,byMass:undefined,edges:this.edges.map(e=>({...e,a:e.a.id,b:e.b.id})),packets:this.packets.map(p=>({...p,edge:null}))};}
 static restore(state,seed){const eco=Object.assign(Object.create(Ecosystem.prototype),structuredClone(state));for(const k of ['resource','memory','presence'])eco[k]=Float32Array.from(state[k]);eco.buffer=new Float32Array(COLS*COLS);eco.nodeGrid=new SpatialIndex();eco.massGrid=new SpatialIndex(150);eco.adjacency=new Map();const nodes=new Map(eco.nodes.map(n=>[n.id,n]));eco.edges=eco.edges.map(e=>({...e,a:nodes.get(e.a),b:nodes.get(e.b)}));if(Number.isFinite(seed))eco.seed=seed;eco.rebuild();return eco;}
 random(){let t=this.seed=(this.seed+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
 density(x,y){let d=0;for(const [cx,cy,r]of this.centres)d+=Math.exp(-((x-cx)**2+(y-cy)**2)/(r*r*1.4));const corridor=Math.exp(-((y-(1100+300*Math.sin(x*.0025)))**2)/18000)*.45;return Math.min(1,d+corridor);}
 sample(){for(let i=0;i<30;i++){const x=80+this.random()*2240,y=80+this.random()*2240;if(this.random()<this.density(x,y))return{x,y};}return{x:this.random()*2400,y:this.random()*2400};}
 index(x,y){return Math.max(0,Math.min(COLS-1,Math.floor(y/CELL)))*COLS+Math.max(0,Math.min(COLS-1,Math.floor(x/CELL)));}
 flow(x,y){const corridor=1100+300*Math.sin(x*.0025),lane=Math.exp(-(((y-corridor)/115)**2));const speed=this.season?.flow??1;let vx=(10+lane*22+9*Math.sin(y*.004+this.time*.018)+6*Math.cos(x*.002))*speed,vy=(8*Math.cos(x*.003-this.time*.012)+lane*(corridor-y)*.11)*speed;const storm=this.storm;if(storm){const dx=x-storm.x,dy=y-storm.y;if(Math.abs(dx)<350&&Math.abs(dy)<350){const d=Math.hypot(dx,dy),g=Math.exp(-d*d/68000)*Math.sin(Math.min(1,storm.age/1.2)*Math.PI/2)*Math.max(0,1-storm.age/14);vx+=(-dy/Math.max(20,d)*storm.spin*85+dx/Math.max(20,d)*32)*g;vy+=(dx/Math.max(20,d)*storm.spin*85+dy/Math.max(20,d)*32)*g;}}for(const f of this.fronts){const dx=x-f.x,dy=y-f.y,reach=160+f.age*23;if(Math.abs(dx)>reach||Math.abs(dy)>reach)continue;const d=Math.hypot(dx,dy),ring=Math.exp(-(((d-(25+f.age*23))/45)**2))*f.strength*Math.exp(-f.age*.3);vx+=dx/Math.max(10,d)*ring*35;vy+=dy/Math.max(10,d)*ring*35;}return{x:vx,y:vy};}
 addNode(x,y,parent,group){const n={id:this.nextId++,x:Math.max(30,Math.min(2370,x)),y:Math.max(30,Math.min(2370,y)),store:parent?.store*.6||.18+this.random()*.3,age:this.random()*35,life:160+this.random()*260,angle:parent?.angle??this.random()*6.28,group,signal:0,cooldown:this.random()*3,captured:0,dead:false};this.nodes.push(n);if(parent)this.edges.push({a:parent,b:n,age:20,flow:0,signal:0});return n;}
 addParticle(x,y,kind,amount,reserved=false){if(this.particles.length>=(reserved?1600:kind===1?1536:1200))return false;const v=this.flow(x,y);this.particles.push({id:this.nextId++,x,y,vx:v.x,vy:v.y,kind,amount,age:0,life:38+this.random()*55});return true;}
 rebuild(){this.nodeGrid.rebuild(this.nodes);this.massGrid.rebuild(this.masses);this.byNode=new Map(this.nodes.map(n=>[n.id,n]));this.byMass=new Map(this.masses.map(m=>[m.id,m]));this.adjacency.clear();for(const e of this.edges){for(const [a,b]of[[e.a,e.b],[e.b,e.a]]){let arr=this.adjacency.get(a.id);if(!arr)this.adjacency.set(a.id,arr=[]);arr.push({node:b,edge:e});}}}
 influence(x,y,strength,dt,event={}){
  if(![x,y,strength,dt].every(Number.isFinite))return;
  strength=Math.max(0,Math.min(1.5,strength));dt=Math.max(0,Math.min(.3,dt));
  const impulse=event.kind==='touch'?1:0,mx=Math.max(-90,Math.min(90,event.dx||0)),my=Math.max(-90,Math.min(90,event.dy||0));
  const r=155,cx=Math.floor(x/CELL),cy=Math.floor(y/CELL);
  for(let yy=cy-3;yy<=cy+3;yy++)for(let xx=cx-3;xx<=cx+3;xx++){if(xx<0||yy<0||xx>=COLS||yy>=COLS)continue;const d=(xx-cx)**2+(yy-cy)**2;const i=yy*COLS+xx;this.presence[i]=Math.min(1,this.presence[i]+strength*dt*.14*Math.exp(-d*.35));}
  const disturb=(o,weight)=>{const dx=o.x-x,dy=o.y-y,d=Math.hypot(dx,dy);if(d>r)return;const g=(1-d/r)*strength,variation=.7+.3*Math.sin(o.id*1.71+this.time*.1);o.signal=Math.min(1,o.signal+g*(dt*2+impulse*.6));o.vx=(o.vx||0)+g*weight*(dx/Math.max(12,d)*(dt*19+impulse*30)*variation+mx*.2);o.vy=(o.vy||0)+g*weight*(dy/Math.max(12,d)*(dt*19+impulse*30)*variation+my*.2);return g;};
  this.nodeGrid.near(x,y,r,n=>{const g=disturb(n,n.store>.2?1:.35);if(!g)return;const target=Math.atan2(n.y-y,n.x-x);n.angle+=Math.atan2(Math.sin(target-n.angle),Math.cos(target-n.angle))*g*(dt*.12+impulse*(n.age<70?.35:.04));});
  this.massGrid.near(x,y,r,m=>{const g=disturb(m,m.phase===2?.15:.65);if(!g)return;m.gate=Math.max(0,m.gate-g*impulse*.32);if(impulse&&m.phase===0&&m.fuel>.35&&m.age>m.life*.45&&(m.refractory||0)===0)m.pressure=Math.min(1.2,(m.pressure||0)+g*.22);else if(impulse&&m.phase===1){m.emit+=g*.5;for(const residue of this.residues){const dx=residue.x-m.x,dy=residue.y-m.y,d=Math.hypot(dx,dy);if(d<90){residue.vx=(residue.vx||0)+dx/Math.max(10,d)*g*25;residue.vy=(residue.vy||0)+dy/Math.max(10,d)*g*25;}}}this.memory[this.index(m.x,m.y)]=Math.min(1,this.memory[this.index(m.x,m.y)]+g*impulse*.025);});
  for(const p of this.particles){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d>=r)continue;const g=(1-d/r)*strength;p.driftX=(p.driftX||0)+g*(mx*.35+dx/Math.max(10,d)*(impulse*45+dt*8));p.driftY=(p.driftY||0)+g*(my*.35+dy/Math.max(10,d)*(impulse*45+dt*8));}
 }
 rupture(m){
  // The event consumes stored tissue; a saturated particle pool keeps the
  // remaining reserve in the body instead of silently discarding matter.
  let emitted=0;const outlet=mouth(m),radius=m.base*Math.sqrt(m.mass/m.max),v=this.flow(m.x,m.y),direction=Math.atan2(v.y,v.x);
  for(let k=0;k<32&&m.mass>.45;k++){const a=direction+(this.random()-.5)*2.1;if(!this.addParticle(outlet.x+Math.cos(a)*radius*.12,outlet.y+Math.sin(a)*radius*.12,1,.024,true))break;const p=this.particles.at(-1);p.origin=m.id;p.driftX=Math.cos(a)*28;p.driftY=Math.sin(a)*28;m.mass-=.024;emitted++;}
  if(!emitted)return false;
  m.fuel=Math.max(0,m.fuel-.1);m.pressure=.08;m.refractory=22;m.scar=Math.min(1,(m.scar||0)+.38);m.signal=1;m.gate=1;m.lastRelease=this.time;
  this.memory[this.index(m.x,m.y)]=Math.min(1,this.memory[this.index(m.x,m.y)]+.3);this.stats.ruptures++;this.stats.released+=emitted;
  this.events.push({id:this.nextId++,type:'rupture',x:m.x,y:m.y,time:this.time,amount:emitted});this.events=this.events.slice(-12);
  this.fronts.push({x:m.x,y:m.y,age:0,strength:emitted/32});this.fronts=this.fronts.slice(-8);
  this.residues.push({id:this.nextId++,x:m.x-radius*.4,y:m.y,mass:.04,age:0,emit:0});m.mass=Math.max(.08,m.mass-.04);
  return true;
 }
 updateClimate(dt){
  this.season=climate(this.time);
  const bloom=Math.floor((this.time-PERIOD*.28)/PERIOD);
  if(bloom>this.lastBloom){this.lastBloom=bloom;let count=0;for(let i=0;i<this.particles.length&&count<64;i+=17){const p=this.particles[i];p.kind=2;p.age=0;p.life=22+this.random()*13;count++;}this.stats.blooms++;}
  if(this.storm){this.storm.age+=dt;if(this.storm.age>14)this.storm=null;}
  if(this.time>=this.nextStorm&&!this.storm){
   const candidates=this.masses.filter(m=>m.phase===0&&m.fuel>.35);const m=candidates[Math.floor(this.random()*candidates.length)];
   if(m){this.storm={id:this.nextId++,x:m.x,y:m.y,age:0,spin:this.random()<.5?-1:1};this.stats.storms++;this.events.push({id:this.storm.id,type:'storm',x:m.x,y:m.y,time:this.time,amount:1});this.events=this.events.slice(-12);
    this.nodeGrid.near(m.x,m.y,280,n=>{const dx=n.x-m.x,dy=n.y-m.y,d=Math.hypot(dx,dy),g=Math.max(0,1-d/280);n.vx=(n.vx||0)+dx/Math.max(15,d)*g*45;n.vy=(n.vy||0)+dy/Math.max(15,d)*g*45;n.signal=Math.max(n.signal,g);this.memory[this.index(n.x,n.y)]=Math.min(1,this.memory[this.index(n.x,n.y)]+g*.12);});
    this.massGrid.near(m.x,m.y,220,n=>{const d=Math.hypot(n.x-m.x,n.y-m.y);if(d<220){n.signal=1;n.gate=1;if(n.phase===0&&n.mass>1.2&&n.refractory===0)n.pressure=Math.max(n.pressure||0,1.02);}});
    for(const o of this.organisms)if(Math.hypot((o.x??0)-m.x,(o.y??0)-m.y)<230){o.mode=1;o.host=null;o.travel=0;}
    for(const p of this.particles)if(Math.hypot(p.x-m.x,p.y-m.y)<260&&p.id%4===0)p.kind=2;
   }
   this.nextStorm=this.time+38+this.random()*37;
  }
 }
 moveBodies(dt){
  // Elastic links, current and heterogeneous wandering: O(bodies + edges).
  for(const o of [...this.nodes,...this.masses]){o.anchorX??=o.x;o.anchorY??=o.y;o.vx??=0;o.vy??=0;const flow=this.flow(o.x,o.y);o.ax=(o.anchorX-o.x)*.15+flow.x*.055+Math.sin(this.time*.31+o.id)*2.3;o.ay=(o.anchorY-o.y)*.15+flow.y*.055+Math.cos(this.time*.27+o.id*1.3)*2.3;}
  for(const e of this.edges){const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,d=Math.max(.01,Math.hypot(dx,dy));e.rest??=d;const tension=(d-e.rest)*.7;const fx=dx/d*tension,fy=dy/d*tension;e.a.ax+=fx;e.a.ay+=fy;e.b.ax-=fx;e.b.ay-=fy;}
  const damp=Math.exp(-dt*1.5);for(const o of [...this.nodes,...this.masses]){o.vx=Math.max(-65,Math.min(65,(o.vx+o.ax*dt)*damp));o.vy=Math.max(-65,Math.min(65,(o.vy+o.ay*dt)*damp));o.x=Math.max(25,Math.min(2375,o.x+o.vx*dt));o.y=Math.max(25,Math.min(2375,o.y+o.vy*dt));}
  this.nodeGrid.rebuild(this.nodes);this.massGrid.rebuild(this.masses);
 }
 send(x,y,to,amount,fromId,edge=null){if(this.packets.length>=240||to.dead)return false;const distance=Math.hypot(to.x-x,to.y-y);this.packets.push({id:this.nextId++,x0:x,y0:y,to:to.id,amount,t:0,duration:1.2+distance/35,fromId,edge});return true;}
 step(dt){
  this.time+=dt;this.updateClimate(dt);let changed=false;this.moveBodies(dt);for(const f of this.fronts)f.age+=dt;this.fronts=this.fronts.filter(f=>f.age<9);
  for(let y=0;y<COLS;y++)for(let x=0;x<COLS;x++){const i=y*COLS+x,v=this.resource[i],sum=this.resource[y*COLS+Math.max(0,x-1)]+this.resource[y*COLS+Math.min(COLS-1,x+1)]+this.resource[Math.max(0,y-1)*COLS+x]+this.resource[Math.min(COLS-1,y+1)*COLS+x];const season=.32+.16*this.season.activity+.1*Math.sin(this.time*.018+x*.08-y*.06);this.buffer[i]=Math.max(0,Math.min(1.3,v+dt*((sum-4*v)*.045+(season-v)*.009)));this.memory[i]*=Math.exp(-dt*.004);this.presence[i]*=Math.exp(-dt*.05);}
  [this.resource,this.buffer]=[this.buffer,this.resource];
  for(const m of this.masses){
   const beforePhase=m.phase;m.history??=[{phase:m.phase,time:this.time-dt}];const i=this.index(m.x,m.y);m.age+=dt;m.signal*=Math.exp(-dt*.6);m.emit+=dt;m.ship+=dt;m.pressure??=0;m.scar=(m.scar||0)*Math.exp(-dt*.004);m.refractory=Math.max(0,(m.refractory||0)-dt);
   if(m.phase===0&&m.fuel>.3&&m.refractory===0)m.pressure=Math.min(1.2,m.pressure+dt*(.014+m.fuel*.009)*(m.age>m.life*.45?1:.25));else m.pressure=Math.max(0,m.pressure-dt*.015);
   if(m.pressure>=1&&m.mass>.8&&m.phase===0)this.rupture(m);
   if(m.phase===0){const intake=Math.min(this.resource[i],dt*.018);this.resource[i]-=intake;m.fuel=Math.min(1.6,m.fuel+intake-dt*.004);m.mass=Math.min(m.max,m.mass+intake*1.6);if(m.age>m.life||m.fuel<.05){m.phase=1;m.age=0;}}
   else if(m.phase===1){m.mass=Math.max(.08,m.mass-dt*.085);m.fuel*=Math.exp(-dt*.012);if(m.emit>1.6&&m.mass>.12){m.emit=0;const outlet=mouth(m),v=this.flow(m.x,m.y),direction=Math.atan2(v.y,v.x);for(let k=0;k<3;k++){const a=direction+(k-1)*.35;if(this.addParticle(outlet.x+Math.cos(a)*3,outlet.y+Math.sin(a)*3,1,.016)){const p=this.particles.at(-1);p.origin=m.id;p.driftX=Math.cos(a)*12;p.driftY=Math.sin(a)*12;m.lastRelease=this.time;this.stats.released++;this.memory[i]=Math.min(1,this.memory[i]+.008);}}}if(m.mass<.2){m.phase=2;m.age=0;}}
   else{const uptake=Math.min(this.resource[i],dt*.05);this.resource[i]-=uptake;m.mass+=uptake;m.fuel+=uptake*.5;if(m.mass>1.1){m.phase=0;m.age=0;m.life=55+this.random()*25;m.cycles=(m.cycles||0)+1;this.stats.regenerated++;}}
   if(m.phase!==beforePhase){m.history.push({phase:m.phase,time:this.time});m.history=m.history.slice(-6);m.signal=1;}
   m.gate+=(Math.max(0,Math.min(1,.12+m.fuel*.55+(m.phase===1?.45:0)-this.presence[i]*.35))-m.gate)*Math.min(1,dt*.8);
   let host=this.byNode.get(m.host);if(!host){host=this.nodeGrid.nearest(m.x,m.y,180);if(host){m.host=host.id;}else if(m.phase===0&&m.fuel>.4&&this.nodes.length<1000){const a=this.random()*6.28;host=this.addNode(m.x+Math.cos(a)*m.base,m.y+Math.sin(a)*m.base,null,m.group);host.age=0;host.store=.18;m.host=host.id;m.fuel-=.12;changed=true;this.stats.regenerated++;}}if(host&&m.fuel>.32&&m.ship>3.2+3*(1-m.gate)){m.ship=0;if(this.send(m.x,m.y,host,.035,m.id)){m.fuel-=.035;host.signal=Math.max(host.signal,.18);}}
  }
  // Shared field uptake makes nearby networks compete; actual packets cooperate.
  for(const n of this.nodes){const i=this.index(n.x,n.y),take=Math.min(this.resource[i],dt*(.004+n.store*.002));this.resource[i]-=take;n.store=Math.max(0,Math.min(1.5,n.store+take-dt*.0025-this.presence[i]*dt*.003));n.age+=dt;n.cooldown-=dt;n.signal*=Math.exp(-dt*.75);
   const adjacent=this.adjacency.get(n.id)||[];
   if(n.store>.16&&n.cooldown<0&&adjacent.length){const {node,edge}=adjacent[Math.floor(this.random()*adjacent.length)];if(node.store<n.store-.04&&this.send(n.x,n.y,node,.028,n.id,edge)){n.store-=.028;n.cooldown=.8+this.random()*2;edge.flow=Math.sign(node.id-n.id);edge.signal=.8;this.stats.exchanges++;}}
   if(n.age>n.life||n.store<.002){n.dead=true;this.residues.push({id:this.nextId++,x:n.x,y:n.y,mass:.12+n.store,age:0,emit:0});this.memory[i]=Math.min(1,this.memory[i]+.08);this.stats.deaths++;}
  }
  for(const e of this.edges){e.age+=dt;e.signal*=Math.exp(-dt*.45);const q=(e.a.signal-e.b.signal)*Math.min(.2,dt*.4);e.a.signal-=q;e.b.signal+=q;}
  const candidates=this.nodes.length;
  for(let i=0;i<candidates;i++){const n=this.nodes[i];if(n.dead||n.store<.16||n.age<15||n.cooldown>0||this.nodes.length>=1100||this.random()>dt*(.016+.028*Math.max(0,1-this.nodes.length/650))*(.75+.55*Math.sin(this.time*.018+n.group*.9)))continue;
   let best=null,score=-1;for(let k=0;k<4;k++){const angle=n.angle+(this.random()-.5)*2.1,x=n.x+Math.cos(angle)*(14+this.random()*25),y=n.y+Math.sin(angle)*(14+this.random()*25);if(x<30||y<30||x>2370||y>2370)continue;const j=this.index(x,y),v=this.resource[j]-.35*this.memory[j]-.18*this.presence[j];if(v>score){best={x,y,angle};score=v;}}
   if(best&&score>.12){const child=this.addNode(best.x,best.y,n,n.group);child.age=0;child.angle=best.angle;child.store=.08;n.store-=.065;n.cooldown=5;this.edges[this.edges.length-1].age=0;n.signal=1;changed=true;this.stats.growth++;const other=this.nodeGrid.nearest(child.x,child.y,16,n);if(other&&other!==child&&this.edges.length<2000)this.edges.push({a:other,b:child,age:0,flow:0,signal:0});}
  }
  const alive=[];
  for(const p of this.particles){p.age+=dt;const v=this.flow(p.x,p.y),i=this.index(p.x,p.y);p.driftX=(p.driftX||0)*Math.exp(-dt*.9);p.driftY=(p.driftY||0)*Math.exp(-dt*.9);p.vx=v.x+this.presence[i]*7+p.driftX;p.vy=v.y+p.driftY;p.x=(p.x+p.vx*dt+SIZE)%SIZE;p.y=(p.y+p.vy*dt+SIZE)%SIZE;
   let captured=false;if(p.age>2){const n=this.nodeGrid.nearest(p.x,p.y,p.kind!==0?13:8);if(n&&!n.dead&&n.store<1.3){n.signal=Math.min(1,n.signal+.38);n.captured++;this.stats.captured++;const adj=this.adjacency.get(n.id);if(adj?.length&&this.send(n.x,n.y,adj[Math.floor(this.random()*adj.length)].node,p.amount,n.id)){n.store+=p.amount*.2;}else n.store+=p.amount;captured=true;}
    if(!captured){const m=this.massGrid.nearest(p.x,p.y,90);if(m&&m.phase===0&&m.gate>.25&&captures(m,p.x,p.y)){m.fuel=Math.min(1.6,m.fuel+p.amount);m.signal=Math.min(1,m.signal+.3);m.lastCapture=this.time;this.stats.captured++;captured=true;}}}
   if(!captured&&p.kind===0&&p.age>24&&this.resource[i]>.40&&this.memory[i]<.6&&this.nodes.length<1000&&this.random()<dt*.009&&!this.nodeGrid.nearest(p.x,p.y,25)){
    const root=this.addNode(p.x,p.y,null,Math.floor(this.random()*6));root.age=0;root.store=.24;root.signal=.7;this.resource[i]-=.10;captured=true;changed=true;this.stats.regenerated++;
   }
   if(!captured&&p.age<p.life)alive.push(p);else if(!captured)this.resource[this.index(p.x,p.y)]=Math.min(1.3,this.resource[this.index(p.x,p.y)]+p.amount);
  }this.particles=alive;
  for(const packet of this.packets){packet.t+=dt/packet.duration;if(packet.t>=1){const to=this.byNode.get(packet.to);if(to&&!to.dead){to.store=Math.min(1.5,to.store+packet.amount*.92);to.signal=Math.min(1,to.signal+.4);this.stats.delivered++;}else{const i=this.index(packet.x0,packet.y0);this.resource[i]=Math.min(1.3,this.resource[i]+packet.amount);}}}this.packets=this.packets.filter(p=>p.t<1);
  for(const r of this.residues){r.vx=(r.vx||0)*Math.exp(-dt*.6)+.6*Math.sin(this.time*.12+r.id)*dt;r.vy=(r.vy||0)*Math.exp(-dt*.6)+.5*Math.cos(this.time*.14+r.id)*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.age+=dt;r.emit+=dt;const release=Math.min(r.mass,dt*.0025);r.mass-=release;this.resource[this.index(r.x,r.y)]+=release*.5;if(r.emit>4&&r.mass>.05){r.emit=0;this.addParticle(r.x,r.y,1,.018);r.mass-=.018;this.stats.released++;}}
  this.residues=this.residues.filter(r=>r.mass>.005).slice(-300);
  for(const o of this.organisms){
   let m=this.byMass.get(o.host);o.mode??=0;o.age+=dt;
   if(o.mode===0&&m){const r=m.base*Math.sqrt(m.mass/m.max)*o.orbit;o.phase+=dt*(.05+m.fuel*.06);o.x=m.x+Math.cos(o.phase)*r;o.y=m.y+Math.sin(o.phase)*r;o.vx=(m.vx||0)-Math.sin(o.phase)*r*(.05+m.fuel*.06);o.vy=(m.vy||0)+Math.cos(o.phase)*r*(.05+m.fuel*.06);o.energy=Math.max(.01,Math.min(1,o.energy+dt*(m.fuel*.012-.006)));m.fuel=Math.max(0,m.fuel-dt*.0008);
    if(o.age>o.life||m.phase===2){o.mode=1;o.host=null;o.travel=0;o.energy*=.65;this.addParticle(o.x,o.y,0,.012);}
   }else if(o.mode===2&&m&&m.phase!==2){o.travel+=dt;o.phase+=dt*.04;const r=m.base*Math.sqrt(m.mass/m.max)*o.orbit,tx=m.x+Math.cos(o.phase)*r,ty=m.y+Math.sin(o.phase)*r;o.vx=(tx-o.x)*.6;o.vy=(ty-o.y)*.6;o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.travel>7){o.mode=0;o.age=0;}}
   else{o.mode=1;o.host=null;o.travel=(o.travel||0)+dt;const v=this.flow(o.x??1200,o.y??1100);o.vx=v.x*.45;o.vy=v.y*.45;o.x=((o.x??1200)+o.vx*dt+SIZE)%SIZE;o.y=((o.y??1100)+o.vy*dt+SIZE)%SIZE;o.phase+=dt*.11;o.energy=Math.max(.03,o.energy-dt*.0005);
    if(o.travel>3){let best=null,d=180*180;this.massGrid.near(o.x,o.y,180,host=>{const q=(host.x-o.x)**2+(host.y-o.y)**2;if(host.phase===0&&host.gate>.3&&q<d){best=host;d=q;}});if(best){o.mode=2;o.host=best.id;o.travel=0;}}
   }
  }
  if(this.nodes.some(n=>n.dead)){this.nodes=this.nodes.filter(n=>!n.dead);this.edges=this.edges.filter(e=>!e.a.dead&&!e.b.dead);changed=true;}
  if(changed)this.rebuild();
  for(let k=0;k<3&&this.particles.length<1100;k++){if(this.random()<dt*7){const p=this.sample();this.addParticle(p.x,p.y,0,.012);}}
 }
}
