/* Standalone component: no dependencies, no external audio or network requests. */
(() => {
  'use strict';
  const voices = [
    {name:'Celeste', color:'#079eff', wave:'sine'},
    {name:'Azul', color:'#527aff', wave:'triangle'},
    {name:'Azul profundo', color:'#233ac7', wave:'custom'}
  ];
  const css = `
    :host{display:block;--ink:#e3eef2;--muted:#90a8b4;color:var(--ink);font:13px Arial,Helvetica,sans-serif;color-scheme:dark}
    *{box-sizing:border-box}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}button:focus-visible,canvas:focus-visible{outline:2px solid #60d4ef;outline-offset:5px}button:disabled{opacity:.35;cursor:default}
    .toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:58px;border-top:1px solid #ffffff30;border-bottom:1px solid #ffffff30;padding:10px 0}.palette,.actions{display:flex;align-items:center;gap:8px}.label{font:10px 'Courier New',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-right:10px}.swatch{width:32px;height:32px;border:1px solid transparent;border-radius:50%;padding:6px}.swatch span{display:block;border-radius:50%;height:100%;background:var(--color)}.swatch[aria-pressed=true]{border-color:var(--color)}.action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:7px 12px;border:1px solid #ffffff28;border-radius:2px;font-size:11px;white-space:nowrap}.action:hover:not(:disabled){background:#ffffff09;border-color:#ffffff65}.action svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5}.action[aria-pressed=true]{color:#60d4ef}.divider{width:1px;height:18px;background:#ffffff20;margin:0 5px}
    .stage{position:relative;isolation:isolate;overflow:hidden;background:#08141b;height:clamp(340px,42vw,570px);border-bottom:1px solid #ffffff30;background-image:linear-gradient(#7cb1c40c 1px,transparent 1px),linear-gradient(90deg,#7cb1c40c 1px,transparent 1px);background-size:40px 40px}.stage:after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 100px #030c1245;pointer-events:none;z-index:-1}canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}.pitch-label{position:absolute;right:17px;font:9px 'Courier New',monospace;letter-spacing:.13em;text-transform:uppercase;color:#8ca9b7;pointer-events:none}.high{top:20px}.low{bottom:20px}.ruler{position:absolute;right:25px;top:44px;bottom:44px;width:1px;background:linear-gradient(#60d4ef77,#60d4ef0d);pointer-events:none}.pitch-dot{position:absolute;right:-3px;width:7px;height:7px;border-radius:50%;background:#60d4ef;box-shadow:0 0 10px #60d4ef70;opacity:0;transition:opacity .15s}.pitch-dot.active{opacity:1}.hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:none;transition:opacity .25s;color:#7c9baa;gap:15px}.hint.hidden{opacity:0}.hint svg{width:180px;height:62px;overflow:visible}.hint p{font-size:12px;margin:0}.hint small{font:9px 'Courier New',monospace;letter-spacing:.08em;color:#698491}.bottom{display:flex;justify-content:space-between;align-items:center;gap:15px;min-height:40px;color:var(--muted);font:10px/1.5 'Courier New',monospace}.status{display:flex;align-items:center;gap:8px}.led{width:5px;height:5px;border-radius:50%;background:#536a75;flex-shrink:0}.led.active{background:#60d4ef;box-shadow:0 0 8px #60d4ef80}.frequency{white-space:nowrap}.keyboard{font:10px/1.6 Arial,Helvetica,sans-serif;color:#6f8d9c;margin:4px 0 0}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%)}
    .playhead{position:absolute;width:10px;height:10px;border:1px solid #d9f6ff;border-radius:50%;box-shadow:0 0 16px #60d4ef;transform:translate(-50%,-50%);pointer-events:none;opacity:0}.playhead.active{opacity:1}
    @media(max-width:650px){.toolbar{align-items:start;gap:8px;flex-wrap:wrap;padding:10px 0}.palette{gap:5px}.label{font-size:9px;margin-right:3px}.actions{gap:5px;flex-wrap:wrap}.action{padding:7px 9px;font-size:10px;min-height:34px}.divider{display:none}.stage{height:380px}.pitch-label{right:11px}.ruler{right:18px}.hint p{font-size:11px}.hint small{font-size:8px}.bottom{font-size:9px;align-items:start;padding:12px 0}.keyboard{display:none}}
  `;
  class InmsonDrawing extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = `<style>${css}</style>
        <div class="toolbar"><div class="palette" role="group" aria-label="Color y timbre del trazo"><span class="label">Trazo</span>${voices.map((v,i)=>`<button class="swatch" style="--color:${v.color}" data-voice="${i}" aria-label="${v.name}" aria-pressed="${i===0}"><span></span></button>`).join('')}</div>
        <div class="actions"><button class="action sound" aria-pressed="true" aria-label="Silenciar sonido"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-4v12l-4-4H3zM13 7q3 3 0 6M15 4q6 6 0 12"/></svg><span>Sonido activo</span></button><span class="divider"></span><button class="action play" disabled><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 4 10 6-10 6z"/></svg><span>Escuchar dibujo</span></button><button class="action clear" disabled>Borrar</button></div></div>
        <div class="stage"><canvas tabindex="0" role="application" aria-label="Lienzo sonoro. Dibujá arrastrando. Con teclado: flechas para moverte y espacio para dibujar. Arriba agudo, abajo grave." aria-describedby="keyboard-help"></canvas><span class="pitch-label high">Agudo</span><div class="ruler"><span class="pitch-dot"></span></div><span class="pitch-label low">Grave</span><div class="hint"><svg viewBox="0 0 180 62" aria-hidden="true"><path d="M3 51C20 47 16 12 37 13S55 57 77 50 83 3 109 9 125 57 147 46 158 20 177 12" stroke="#60d4ef88" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="177" cy="12" r="4" fill="#60d4ef"/></svg><p>Un movimiento, una línea, un sonido.</p><small>DIBUJÁ PARA EMPEZAR</small></div></div>
        <div class="bottom"><span class="status"><span class="led"></span><span class="status-text" role="status">El sonido empieza con tu primer trazo.</span></span><span class="frequency">Grave ↕ Agudo</span></div><p class="keyboard" id="keyboard-help">También con teclado: flechas para moverte · mantené espacio para dibujar.</p><span class="sr-only announcement" aria-live="polite"></span>`;
      this.$ = s => this.shadowRoot.querySelector(s);
      this.canvas = this.$('canvas');
      this.playhead=document.createElement('span');this.playhead.className='playhead';this.playhead.setAttribute('aria-hidden','true');this.$('.stage').append(this.playhead);
      this.ctx = this.canvas.getContext('2d');
      // Composite each stroke once so sample density does not change opacity.
      this.finished=document.createElement('canvas');this.finishedCtx=this.finished.getContext('2d');
      this.$('.hint svg path').setAttribute('stroke-width','3');
      this.strokes = [];
      this.voice = 0;
      this.soundEnabled = true;
      this.cursor = {x:.5,y:.5};
      this.replayFrame = 0;
    }
    connectedCallback() {
      this.events = new AbortController();
      const on = (target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:this.events.signal});
      on(this.canvas,'pointerdown',e=>this.pointerDown(e));
      on(this.canvas,'pointermove',e=>this.pointerMove(e));
      for (const name of ['pointerup','pointercancel','lostpointercapture']) on(this.canvas,name,e=>{if(e.pointerId===this.pointerId)this.endStroke();});
      on(this.canvas,'keydown',e=>this.keyDown(e));
      on(this.canvas,'keyup',e=>{if(e.code==='Space'){e.preventDefault();this.endStroke();}});
      on(this.canvas,'blur',()=>this.endStroke());
      on(window,'blur',()=>this.stop());
      on(document,'visibilitychange',()=>{if(document.hidden)this.stop();});
      for (const button of this.shadowRoot.querySelectorAll('[data-voice]')) on(button,'click',()=>{
        this.stop();this.voice=Number(button.dataset.voice);
        for(const b of this.shadowRoot.querySelectorAll('[data-voice]')) b.setAttribute('aria-pressed',String(b===button));
      });
      on(this.$('.sound'),'click',()=>{
        this.soundEnabled=!this.soundEnabled;
        this.$('.sound').setAttribute('aria-pressed',String(this.soundEnabled));
        this.$('.sound').setAttribute('aria-label',this.soundEnabled?'Silenciar sonido':'Activar sonido');
        this.$('.sound span').textContent=this.soundEnabled?'Sonido activo':'Sin sonido';
        if(!this.soundEnabled)this.silence();
        else this.ensureAudio();
        this.status(this.soundEnabled?'Sonido activo. Dibujá para escuchar.':'Podés seguir dibujando sin sonido.');
      });
      on(this.$('.clear'),'click',()=>{
        this.stop();this.strokes=[];this.redraw();this.updateControls();
        this.$('.hint').classList.remove('hidden');this.$('.frequency').textContent='Grave ↕ Agudo';this.status('Lienzo vacío. Probá un nuevo movimiento.');this.announce('Dibujo borrado.');
      });
      on(this.$('.play'),'click',()=>this.replayFrame?this.stop():this.replay());
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);
      this.resize();
    }
    disconnectedCallback(){this.stop();if(this.paintFrame)cancelAnimationFrame(this.paintFrame);this.paintFrame=0;this.observer?.disconnect();this.events?.abort();this.audio?.close();this.audio=null;}
    announce(message){this.$('.announcement').textContent=message;}
    status(message,active=false){this.$('.status-text').textContent=message;this.$('.led').classList.toggle('active',active);}
    updateControls(){this.$('.play').disabled=!this.strokes.length;this.$('.clear').disabled=!this.strokes.length;}
    resize(){
      const rect=this.canvas.getBoundingClientRect();this.w=rect.width;this.h=rect.height;
      this.dpr=Math.min(window.devicePixelRatio||1,2);
      for(const canvas of [this.canvas,this.finished]){canvas.width=Math.round(this.w*this.dpr);canvas.height=Math.round(this.h*this.dpr);canvas.getContext('2d').setTransform(this.dpr,0,0,this.dpr,0,0);}
      this.redraw();
    }
    point(e){const r=this.canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
    pointerDown(e){
      if(!e.isPrimary||e.button!==0||this.current)return;
      e.preventDefault();this.canvas.focus({preventScroll:true});this.stop();
      this.pointerId=e.pointerId;this.canvas.setPointerCapture(e.pointerId);
      this.startStroke(this.point(e));
    }
    pointerMove(e){
      if(!this.current||e.pointerId!==this.pointerId)return;
      if(e.pointerType==='mouse'&&!(e.buttons&1)){this.endStroke();return;}
      const events=e.getCoalescedEvents?.()||[e];
      for(const sample of events.length?events:[e])this.addPoint(this.point(sample));
    }
    startStroke(point){
      this.ensureAudio();this.started=performance.now();this.cursor={...point};
      this.current={voice:this.voice,points:[{...point,t:0}]};this.strokes.push(this.current);
      this.$('.hint').classList.add('hidden');this.updateControls();this.schedulePaint();this.tone(point.y,this.voice);this.status('Dibujando · la altura cambia el sonido.',true);
    }
    addPoint(point){
      if(!this.current)return;
      const last=this.current.points.at(-1);
      if(Math.hypot((point.x-last.x)*this.w,(point.y-last.y)*this.h)<1)return;
      if(this.current.points.length>=12000){this.endStroke();this.status('Soltá y empezá un nuevo trazo.');return;}
      const next={...point,t:performance.now()-this.started};this.current.points.push(next);this.cursor={...point};
      this.schedulePaint();this.tone(point.y,this.current.voice);
    }
    endStroke(){
      if(!this.current)return;
      this.paintStroke(this.finishedCtx,this.current);this.current=null;this.pointerId=null;this.schedulePaint();this.silence();this.$('.pitch-dot').classList.remove('active');
      this.status(this.soundEnabled?'Tu trazo queda. Podés seguir o volver a escucharlo.':'Podés seguir dibujando sin sonido.');
    }
    schedulePaint(){if(!this.paintFrame)this.paintFrame=requestAnimationFrame(()=>{this.paintFrame=0;this.paint();});}
    paint(){
      const c=this.ctx;c.clearRect(0,0,this.w,this.h);
      c.drawImage(this.finished,0,0,this.w,this.h);
      if(this.current)this.paintStroke(c,this.current);
    }
    paintStroke(c,stroke){
      const points=stroke.points;
      c.save();c.strokeStyle=c.fillStyle=voices[stroke.voice].color;
      c.globalAlpha=.52;c.lineWidth=3;c.lineCap='round';c.lineJoin='round';
      c.beginPath();
      if(points.length===1){
        c.arc(points[0].x*this.w,points[0].y*this.h,1.5,0,Math.PI*2);c.fill();
      }else{
        c.moveTo(points[0].x*this.w,points[0].y*this.h);
        for(let i=1;i<points.length;i++)c.lineTo(points[i].x*this.w,points[i].y*this.h);
        c.stroke();
      }
      c.restore();
    }
    redraw(){
      if(this.paintFrame){cancelAnimationFrame(this.paintFrame);this.paintFrame=0;}
      this.finishedCtx.clearRect(0,0,this.w,this.h);
      for(const s of this.strokes)if(s!==this.current)this.paintStroke(this.finishedCtx,s);
      this.paint();
    }
    ensureAudio(){
      if(!this.soundEnabled)return;
      try{
        if(!this.audio){
          const Audio=window.AudioContext||window.webkitAudioContext;
          if(!Audio)throw new Error('Audio no disponible');
          this.audio=new Audio();this.audioVoice=null;this.gain=this.audio.createGain();this.gain.gain.value=0;this.gain.connect(this.audio.destination);
          this.osc=this.audio.createOscillator();this.osc.connect(this.gain);this.osc.start();
          this.indigoWave=this.audio.createPeriodicWave(new Float32Array([0,0,0,0]),new Float32Array([0,1,.22,.08]));
        }
        if(this.audio.state==='suspended')this.audio.resume().catch(()=>this.status('El navegador no pudo activar el sonido. Podés seguir dibujando.'));
      }catch{this.status('Audio no disponible en este navegador. Podés dibujar sin sonido.');}
    }
    tone(y,voice){
      const f=110*Math.pow(8,1-y);
      this.$('.frequency').textContent=`${Math.round(f)} Hz`;
      this.$('.pitch-dot').style.top=`${y*100}%`;this.$('.pitch-dot').classList.add('active');
      if(!this.soundEnabled||!this.audio||this.audio.state!=='running')return;
      const now=this.audio.currentTime;
      if(voice!==this.audioVoice){
        if(voices[voice].wave==='custom')this.osc.setPeriodicWave(this.indigoWave);
        else this.osc.type=voices[voice].wave;
        this.audioVoice=voice;
      }
      this.osc.frequency.setTargetAtTime(f,now,.018);
      this.gain.gain.cancelScheduledValues(now);this.gain.gain.setTargetAtTime(voice===1?.09:.12,now,.012);
      // A short release makes stillness silent and avoids stuck notes.
      this.gain.gain.setTargetAtTime(0,now+.14,.03);
    }
    silence(){if(this.audio&&this.gain){const now=this.audio.currentTime;this.gain.gain.cancelScheduledValues(now);this.gain.gain.setTargetAtTime(0,now,.018);}}
    keyDown(e){
      if(e.code==='Space'){
        e.preventDefault();if(!e.repeat&&!this.current){this.stop();this.startStroke(this.cursor);}return;
      }
      const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.code];
      if(!dir)return;e.preventDefault();
      const step=e.shiftKey?18:6;
      const point={x:Math.max(0,Math.min(1,this.cursor.x+dir[0]*step/this.w)),y:Math.max(0,Math.min(1,this.cursor.y+dir[1]*step/this.h))};
      if(this.current)this.addPoint(point);else{this.cursor=point;this.$('.frequency').textContent=`${Math.round(110*Math.pow(8,1-point.y))} Hz`;}
    }
    replay(){
      if(!this.strokes.length)return;
      this.endStroke();this.ensureAudio();
      const timeline=[];let offset=0;
      for(const s of this.strokes){
        // Preserve gesture timing; cap long pauses between sampled points.
        let t=offset;
        s.points.forEach((p,i)=>{if(i)t+=Math.min(100,p.t-s.points[i-1].t);timeline.push({t,p,voice:s.voice});});
        offset=t+260;
      }
      const started=performance.now();let index=0;
      this.$('.play span').textContent='Detener';this.$('.play').setAttribute('aria-label','Detener reproducción');this.status('Escuchando el recorrido de tus trazos.',true);this.announce('Reproduciendo dibujo.');
      const frame=()=>{
        const time=performance.now()-started;
        while(index<timeline.length&&timeline[index].t<=time){const event=timeline[index++];this.tone(event.p.y,event.voice);this.playhead.style.left=`${event.p.x*100}%`;this.playhead.style.top=`${event.p.y*100}%`;this.playhead.classList.add('active');}
        if(index<timeline.length){this.replayFrame=requestAnimationFrame(frame);return;}
        this.stop();this.status('Podés seguir dibujando.');
      };
      this.replayFrame=requestAnimationFrame(frame);
    }
    stop(){
      this.endStroke();if(this.replayFrame){cancelAnimationFrame(this.replayFrame);this.status('Podés seguir dibujando.');}this.replayFrame=0;
      this.silence();this.$('.pitch-dot').classList.remove('active');this.playhead.classList.remove('active');this.$('.play span').textContent='Escuchar dibujo';this.$('.play').removeAttribute('aria-label');
      this.$('.led').classList.remove('active');
    }
  }
  if(!customElements.get('inmson-drawing'))customElements.define('inmson-drawing',InmsonDrawing);
})();
