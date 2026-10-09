(() => {
  const canvas=document.querySelector('#hero-shader');
  const hero=document.querySelector('.opening');
  if(!canvas||!hero)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl){hero.dataset.shader='fallback';canvas.remove();return}
  const vertex=`
    precision highp float;
    attribute vec4 a_seed;
    uniform vec2 u_resolution;
    uniform vec2 u_hero;
    uniform float u_scroll;
    uniform float u_time;
    uniform float u_dpr;
    uniform float u_mode;
    uniform vec3 u_pointer;
    uniform vec4 u_trail[12];
    varying float v_alpha;
    varying float v_tone;
    void main(){
      vec2 pos;
      float depth=a_seed.z;
      if(u_mode<0.5){
        float x=a_seed.x;
        float edge=(x*2.0-1.0)*(x*2.0-1.0);
        float surface=0.22+0.40*edge;
        float y=a_seed.y;
        float height=y*surface;
        pos=vec2(x*u_resolution.x,u_hero.x+(u_hero.y+96.0)*(1.0-height)-u_scroll);
        vec2 delta=pos-u_pointer.xy;
        float dist=length(delta);
        float influence=(1.0-smoothstep(0.0,115.0,dist))*u_pointer.z;
        pos+=delta/max(dist,1.0)*influence*6.0;
        float upperFade=1.0-smoothstep(0.30,1.0,y);
        float lowerFade=smoothstep(0.0,0.28,height);
        float breathing=0.96+0.04*sin(u_time*0.16);
        v_alpha=mix(0.22,0.70,depth)*upperFade*lowerFade*breathing;
        gl_PointSize=mix(1.1,1.8,depth)*u_dpr;
        v_tone=0.0;
      }else{
        float sampleIndex=floor(a_seed.w*12.0);
        vec4 trail=vec4(0.0,0.0,1.0,0.0);
        for(int i=0;i<12;i++){if(float(i)==sampleIndex)trail=u_trail[i];}
        float age=trail.z;
        float angle=a_seed.x*6.2831853;
        float radius=sqrt(a_seed.y)*(6.0+age*32.0);
        vec2 drift=vec2((depth-0.5)*18.0,8.0)*age;
        pos=trail.xy+vec2(cos(angle),sin(angle))*radius+drift;
        v_alpha=trail.w*(1.0-smoothstep(0.0,1.0,age))*mix(0.15,0.45,depth);
        gl_PointSize=mix(1.0,2.0,depth)*u_dpr;
        v_tone=1.0;
      }
      gl_Position=vec4(pos.x/u_resolution.x*2.0-1.0,1.0-pos.y/u_resolution.y*2.0,0.0,1.0);
    }
  `;
  const fragment=`
    precision mediump float;
    varying float v_alpha;
    varying float v_tone;
    void main(){
      float radius=length(gl_PointCoord-vec2(0.5));
      float alpha=(1.0-smoothstep(0.18,0.5,radius))*v_alpha;
      vec3 color=mix(vec3(0.10,0.32,1.0),vec3(0.22,0.48,1.0),v_tone);
      gl_FragColor=vec4(color*alpha,alpha);
    }
  `;
  const compile=(type,source)=>{
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null}
    return shader;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs){hero.dataset.shader='fallback';canvas.remove();return}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){hero.dataset.shader='fallback';canvas.remove();return}
  gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const names=['resolution','hero','scroll','time','dpr','mode','pointer','trail'];
  const uniform=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,'u_'+n+(n==='trail'?'[0]':''))]));
  const attribute=gl.getAttribLocation(program,'a_seed');
  const fieldBuffer=gl.createBuffer(),cursorBuffer=gl.createBuffer();
  let randomState=427;
  const random=()=>{randomState=(1664525*randomState+1013904223)>>>0;return randomState/4294967296};
  const seeds=count=>{const points=new Float32Array(count*4);for(let i=0;i<points.length;i++)points[i]=random();return points};
  const cursorCount=264;
  gl.bindBuffer(gl.ARRAY_BUFFER,cursorBuffer);gl.bufferData(gl.ARRAY_BUFFER,seeds(cursorCount),gl.STATIC_DRAW);
  const trail=Array.from({length:12},()=>({x:0,y:0,time:-10000,active:false}));
  const trailData=new Float32Array(48);
  let width=0,height=0,dpr=1,fieldCount=0,heroTop=0,heroHeight=0,scrollY=window.scrollY;
  let pointer={x:-1000,y:-1000,time:-10000},lastSample=0,nextTrail=0,lastFrame=0,frame=0,visible=true,broken=false;
  const start=performance.now();
  const bind=buffer=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,0,0)};
  const wake=()=>{if(!frame&&!broken&&!document.hidden)frame=requestAnimationFrame(draw)};
  const resize=()=>{
    width=document.documentElement.clientWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);
    const rect=hero.getBoundingClientRect();heroTop=rect.top+window.scrollY;heroHeight=rect.height;
    fieldCount=Math.min(44000,Math.max(12000,Math.round(width*heroHeight/42)));
    gl.bindBuffer(gl.ARRAY_BUFFER,fieldBuffer);gl.bufferData(gl.ARRAY_BUFFER,seeds(fieldCount),gl.STATIC_DRAW);
    canvas.dataset.particles=String(fieldCount);wake();
  };
  function draw(now){
    frame=0;if(broken||document.hidden)return;
    const pointerAge=now-pointer.time;
    const cursorActive=fine.matches&&!reduced.matches&&pointerAge<1350;
    canvas.dataset.pointer=cursorActive?'active':'idle';
    const moving=!reduced.matches&&visible;
    if(now-lastFrame<28&&(moving||cursorActive)){wake();return}
    lastFrame=now;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniform.resolution,width,height);gl.uniform2f(uniform.hero,heroTop,heroHeight);
    gl.uniform1f(uniform.scroll,scrollY);gl.uniform1f(uniform.dpr,dpr);
    gl.uniform1f(uniform.time,reduced.matches?0:(now-start)/1000);
    gl.uniform3f(uniform.pointer,pointer.x,pointer.y,cursorActive?Math.max(0,1-pointerAge/1350):0);
    if(visible){gl.uniform1f(uniform.mode,0);bind(fieldBuffer);gl.drawArrays(gl.POINTS,0,fieldCount)}
    if(cursorActive){
      for(let i=0;i<trail.length;i++){
        const t=trail[i],age=Math.min(1,(now-t.time)/1350);
        trailData.set([t.x,t.y,age,t.active?1:0],i*4);
      }
      gl.uniform4fv(uniform.trail,trailData);gl.uniform1f(uniform.mode,1);bind(cursorBuffer);gl.drawArrays(gl.POINTS,0,cursorCount);
    }
    if(moving||cursorActive)wake();
  }
  document.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||!fine.matches||reduced.matches||document.querySelector('#project-viewer')?.open)return;
    const now=performance.now();pointer={x:event.clientX,y:event.clientY,time:now};
    if(now-lastSample>22){trail[nextTrail]={x:pointer.x,y:pointer.y,time:now,active:true};nextTrail=(nextTrail+1)%12;lastSample=now}
    canvas.dataset.pointer='active';canvas.dataset.pointerPosition=Math.round(pointer.x)+','+Math.round(pointer.y);wake();
  },{passive:true});
  document.addEventListener('pointerleave',()=>{pointer.time=-10000;canvas.dataset.pointer='idle';wake()});
  window.addEventListener('scroll',()=>{scrollY=window.scrollY;wake()},{passive:true});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else wake()});
  reduced.addEventListener('change',()=>{pointer.time=-10000;wake()});
  fine.addEventListener('change',()=>{pointer.time=-10000;wake()});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake()},{rootMargin:'120px 0px'}).observe(hero);
  new ResizeObserver(resize).observe(hero);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();broken=true;cancelAnimationFrame(frame);frame=0;hero.dataset.shader='fallback';canvas.hidden=true});
  hero.dataset.shader='webgl';canvas.dataset.pointer='idle';resize();
})();
