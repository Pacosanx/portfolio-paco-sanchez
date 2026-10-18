import{Ecosystem}from'./ecosystem.js';import{pack}from'./render-state.js';
import matureState from './mature-state.js';
let eco=null,running=false,timer=null,last=0,accumulator=0,lastPublish=-1,awaiting=false,cost=0,stepCount=0,preview=false;
function publish(){if(awaiting)return;const started=performance.now(),state=pack(eco);state.timings={simulationMs:cost,packingMs:performance.now()-started,steps:stepCount};awaiting=true;postMessage({type:'state',state},[state.bodies.buffer,state.lines.buffer,state.packets.buffer,state.resource.buffer,state.memory.buffer]);lastPublish=eco.time;}
function tick(){timer=null;if(!running)return;const now=performance.now();accumulator=Math.min(.5,accumulator+(now-last)/1000);last=now;const began=performance.now();let steps=0;
 while(accumulator>=.1&&steps<4){const s=performance.now();eco.step(.1);cost=cost*.8+(performance.now()-s)*.2;accumulator-=.1;steps++;stepCount++;if(performance.now()-began>7)break;}
 if(eco.time-lastPublish>(preview?.45:.12))publish();timer=setTimeout(tick,35);
}
onmessage=e=>{const m=e.data;if(m.type==='init'&&!eco){eco=Ecosystem.restore(matureState,m.seed);running=!!m.visible;preview=!!m.preview;last=performance.now();publish();if(running)timer=setTimeout(tick,35);}
 else if(m.type==='ack')awaiting=false;
 else if(m.type==='presence'&&eco&&running)eco.influence(m.x,m.y,m.strength,Math.min(.3,m.dt),m);
 else if(m.type==='mode'&&eco){preview=!!m.preview;const next=!!m.visible;if(next!==running){running=next;clearTimeout(timer);timer=null;last=performance.now();accumulator=0;if(running)timer=setTimeout(tick,35);}}
};
