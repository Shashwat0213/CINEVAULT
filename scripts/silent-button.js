/* =========================================================
   CINEVAULT SILENT BUTTON LOGIC
========================================================= */
document.addEventListener("DOMContentLoaded", function() {
  const btn = document.getElementById('cv-silent-btn');
  if (!btn) return;

  const prints = document.getElementById('cv-prints');
  const grainEl = document.getElementById('cv-grain');
  const stage = document.querySelector('.cv-signup-wrapper .stage');
  
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  
  // 1. Grain Texture
  (function makeGrain(){
    const W=Math.round(305*2),H=Math.round(116*2),c=document.createElement('canvas');c.width=W;c.height=H;
    const g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data,r=mulberry32(1337);
    for(let i=0;i<W*H;i++){const u=r();const a=0.30*Math.pow(u,1.7);d[i*4]=255;d[i*4+1]=255;d[i*4+2]=255;d[i*4+3]=Math.round(a*255)}
    g.putImageData(img,0,0);grainEl.style.backgroundImage='url('+c.toDataURL()+')';
  })();

  // 2. Liquid Potion Animation
  const potion=(function(){
    const cv=document.getElementById('cv-potion'),S=84,D=2,g=cv.getContext('2d');g.scale(D,D);
    const rnd=mulberry32(4242);
    function np(init){return{x:8+rnd()*68,y:init?26+rnd()*54:80+rnd()*5,r:.35+rnd()*rnd()*1.6,v:.05+rnd()*.15,ph:rnd()*6.28,sw:.25+rnd()*.7,a:.3+rnd()*.7}}
    const P=[];for(let i=0;i<46;i++)P.push(np(true));
    let glow=0,target=0,level=52,tLevel=52,t=0,last=performance.now(),burst=[],running=false;
    const surf=x=>level+Math.sin(x*.18+t*2.1)*1.1+Math.sin(x*.31-t*1.4)*.7;
    function draw(dt){
      t+=dt/60;glow+=(target-glow)*Math.min(1,.07*dt);level+=(tLevel-level)*Math.min(1,.05*dt);
      g.clearRect(0,0,S,S);
      g.beginPath();g.moveTo(-2,surf(-2));for(let x=1;x<=S+2;x+=3)g.lineTo(x,surf(x));g.lineTo(S+2,S+2);g.lineTo(-2,S+2);g.closePath();
      const A=.32+glow*.45,lg=g.createLinearGradient(0,level-4,0,S);
      lg.addColorStop(0,'rgba(70,225,150,'+A+')');lg.addColorStop(.35,'rgba(22,150,92,'+(A*.9)+')');lg.addColorStop(1,'rgba(4,42,28,'+(A*.85)+')');
      g.fillStyle=lg;g.fill();
      g.beginPath();for(let x=-2;x<=S+2;x+=2){const y=surf(x);x===-2?g.moveTo(x,y):g.lineTo(x,y)}
      g.strokeStyle='rgba(175,255,215,'+(.25+glow*.45)+')';g.lineWidth=1;g.stroke();
      g.globalCompositeOperation='lighter';
      for(const p of P){
        p.y-=p.v*dt*(1+glow*.7);p.x+=Math.sin(t*p.sw*3+p.ph)*.12*dt;
        if(p.y<surf(p.x)+1.5)Object.assign(p,np(false));
        const al=p.a*(.3+glow*.7)*Math.min(1,(S-p.y)/6);
        g.beginPath();g.arc(p.x,p.y,p.r,0,6.283);g.fillStyle='rgba(165,255,208,'+al+')';g.shadowColor='rgba(120,255,190,.9)';g.shadowBlur=3+glow*4;g.fill();
      }
      g.shadowBlur=0;
      for(let i=0;i<7;i++){const x=14+((i*11.3+t*4*(i%2?1:-1)+300)%56);const y=level-6-((i*7+t*6)%Math.max(8,level-14));const tw=.5+.5*Math.sin(t*5+i*1.7);
        g.beginPath();g.arc(x,y,.6+tw*.5,0,6.283);g.fillStyle='rgba(195,255,225,'+((.12+glow*.5)*tw)+')';g.fill()}
      for(let i=burst.length-1;i>=0;i--){const b=burst[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=.02*dt;b.l-=dt/38;if(b.l<=0){burst.splice(i,1);continue}
        g.beginPath();g.arc(b.x,b.y,b.r*b.l,0,6.283);g.fillStyle='rgba(205,255,228,'+(.9*b.l)+')';g.shadowColor='rgba(120,255,190,.9)';g.shadowBlur=4;g.fill()}
      g.shadowBlur=0;g.globalCompositeOperation='source-over';
    }
    function frame(now){const dt=Math.min(40,now-last)/16.67;last=now;draw(dt);requestAnimationFrame(frame)}
    function start(){if(running)return;running=true;last=performance.now();requestAnimationFrame(frame)}
    draw(1);start();
    return{set(s){target=s==='press'?1.3:s==='hover'?1:0;tLevel=s==='idle'?52:47},
      burst(){for(let i=0;i<18;i++){const a=-Math.PI/2+(rnd()-.5)*1.5,sp=.7+rnd()*1.5;burst.push({x:42+(rnd()-.5)*22,y:level+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:.8+rnd()*1.4,l:1})}},
      step(n){for(let i=0;i<n;i++)draw(1)}};
  })();

  // 3. Fingerprint Generator
  function makePrint(seed){
    const r=mulberry32(seed);const W=110,H=140,D=2;
    const c=document.createElement('canvas');c.width=W*D;c.height=H*D;const g=c.getContext('2d');
    const LS=32,latA=new Float32Array(LS*LS),latB=new Float32Array(LS*LS);
    for(let i=0;i<LS*LS;i++){latA[i]=r()*2-1;latB[i]=r()*2-1}
    function vn(lat,x,y){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
      const x0=((xi%LS)+LS)%LS,x1=(x0+1)%LS,y0=((yi%LS)+LS)%LS,y1=(y0+1)%LS;
      return (lat[y0*LS+x0]*(1-sx)+lat[y0*LS+x1]*sx)*(1-sy)+(lat[y1*LS+x0]*(1-sx)+lat[y1*LS+x1]*sx)*sy}
    function fbm(lat,x,y){return vn(lat,x,y)*.6+vn(lat,x*2.1+3.7,y*2.1+1.3)*.28+vn(lat,x*4.3+9.1,y*4.3+5.2)*.12}
    const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
    const tr=r(),type=tr<.58?'loop':(tr<.85?'whorl':'arch');
    const cx=55,cy=48,sp=2.55+r()*.45,wAmp=3.5+r()*3.5,wF=1/(34+r()*10);
    const tilt=(r()-.5)*.4,ct=Math.cos(tilt),st=Math.sin(tilt);
    const spiral=r()<.5?0:(r()<.5?1:-1),ell=1.05+r()*.2,archA=10+r()*6,archS=15+r()*8,diverge=.002+r()*.003;
    const img=g.createImageData(W*D,H*D),d=img.data;
    for(let py=0;py<H*D;py++)for(let px=0;px<W*D;px++){
      const x=px/D,y=py/D;
      const wx=x+fbm(latA,x*wF,y*wF)*wAmp,wy=y+fbm(latB,x*wF+5,y*wF+7)*wAmp;
      const dx=wx-cx,dy=wy-cy,ux=dx*ct-dy*st,uy=dx*st+dy*ct;
      let f;
      if(type==='loop'){f=uy<0?Math.hypot(ux,uy):Math.abs(ux)/(1+uy*diverge)+0}
      else if(type==='whorl'){f=Math.hypot(ux,uy/ell)+spiral*Math.atan2(uy,ux)*sp/(2*Math.PI)}
      else{f=uy+archA*Math.exp(-(ux*ux)/(archS*archS))}
      const ph=2*Math.PI*f/sp,ridge=ss(-.12,.5,Math.cos(ph));
      const br=fbm(latB,x*.11+40,y*.11+40),cut=ss(-.52,-.34,br);
      const ex=(x-cx)/43,ey=(y-cy-16)/58,re=Math.hypot(ex,ey);
      const en=fbm(latA,x*.05+20,y*.05+20)*.16,mask=ss(1.08+en,.78+en,re);
      const pr=.55+.45*(1-Math.min(1,re)),gr=.82+.18*vn(latA,x*.9+11,y*.9+3);
      const a=Math.min(1,ridge*cut*mask*pr*gr+mask*.05);
      const o=(py*W*D+px)*4;d[o]=255;d[o+1]=255;d[o+2]=255;d[o+3]=Math.round(a*255);
    }
    g.putImageData(img,0,0);
    return c;
  }

  // 4. Interaction Logic
  let seed=7;
  function addPrint(x,y,rot,hold){
    const el=document.createElement('div');el.className='print';seed+=1;
    const cv=makePrint(seed);cv.style.transform='rotate('+rot+'deg)';cv.style.transformOrigin='55px 55px';el.appendChild(cv);
    el.style.left=(x-55-2)+'px';el.style.top=(y-48-15)+'px';el.style.transformOrigin='55px 55px';
    prints.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
    if(hold===Infinity){el.classList.add('show')}else{setTimeout(()=>el.classList.add('fade'),hold);setTimeout(()=>el.remove(),hold+900)}
    return el;
  }

  let pressed=false,sentTimer=0;const rnd=mulberry32(99);
  function setState(){potion.set(btn.classList.contains('press')?'press':btn.classList.contains('hover')?'hover':'idle')}
  function localPoint(e){const r=stage.getBoundingClientRect();const s=r.width/540;const br=btn.getBoundingClientRect();return{x:(e.clientX-br.left)/s,y:(e.clientY-br.top)/s}}
  
  function release(withPrint,e){
    if(!pressed)return;pressed=false;btn.classList.remove('press');
    if(withPrint){
      const p=e?localPoint(e):{x:btn.offsetWidth*.45,y:btn.offsetHeight*.5};
      addPrint(p.x,p.y,-35+rnd()*70,3000);
      potion.burst();
      btn.classList.add('sent');
      clearTimeout(sentTimer);
      sentTimer=setTimeout(()=>btn.classList.remove('sent'),480);
      
      // OPEN AUTH MODAL ON CLICK
      setTimeout(() => {
        if(window.CV_AUTH && window.CV_AUTH.openAuth) {
          window.CV_AUTH.openAuth();
        }
      }, 400);
    }
    setState();
  }

  btn.addEventListener('pointerenter',()=>{btn.classList.add('hover');setState()});
  btn.addEventListener('pointerleave',()=>{btn.classList.remove('hover');release(false);setState()});
  btn.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;pressed=true;btn.classList.add('press');btn.classList.add('hover');setState();try{btn.setPointerCapture(e.pointerId)}catch(_){}});
  btn.addEventListener('pointerup',e=>release(true,e));
  btn.addEventListener('pointercancel',()=>release(false));
  btn.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){if(!pressed){pressed=true;btn.classList.add('press');setState()}e.preventDefault()}});
  btn.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&pressed)release(true,null)});
  btn.addEventListener('contextmenu',e=>e.preventDefault());
});