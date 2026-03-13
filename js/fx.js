// ═══════════════════════════════════════════
//  fx.js
//  エフェクト系：パーティクル・飛び道具・ヒットラベル
//  カメラシェイク・スローモーション・雨
// ═══════════════════════════════════════════
'use strict';

// ── カメラシェイク & スローモー ───────────────
let camShake=0, camShakeX=0, camShakeY=0;
let slowMo=1, slowMoT=0;

function triggerShake(s=8)   { camShake=s; }
function triggerSlowMo(f=10) { slowMoT=f; slowMo=0.22; }

function fxTick() {
  if (slowMoT>0) { slowMoT--; if (slowMoT<=0) slowMo=1; }
}
function applyCamShake(ctx) {
  if (camShake>0) {
    camShake*=0.72;
    camShakeX=(Math.random()-0.5)*camShake;
    camShakeY=(Math.random()-0.5)*camShake*0.6;
    if (camShake<0.4) camShake=0;
  } else { camShakeX=0; camShakeY=0; }
  ctx.translate(camShakeX, camShakeY);
}

// ── パーティクル ─────────────────────────────
const _pts=[];

function spk(x,y,col,n,sp,lf,sz=4) {
  for (let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2, s=sp*(0.3+Math.random()*0.7);
    _pts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*0.3,lf,ml:lf,col,sz:sz*(0.4+Math.random()*0.8)});
  }
}
function slash(x,y,dir,col='#ffffaa',n=10) {
  for (let i=0;i<n;i++) {
    const a=(Math.random()-0.5)*Math.PI*0.7+(dir>0?0:Math.PI);
    _pts.push({x,y,vx:Math.cos(a)*10,vy:Math.sin(a)*6-4,lf:16,ml:16,col,sz:2+Math.random()*4,ln:true});
  }
}
function ring(x,y,col,r=28) {
  for (let i=0;i<14;i++) {
    const a=i/14*Math.PI*2;
    _pts.push({x:x+Math.cos(a)*r*0.4,y:y+Math.sin(a)*r*0.4,vx:Math.cos(a)*6,vy:Math.sin(a)*5-2,lf:20,ml:20,col,sz:2+Math.random()*3});
  }
}

function drawPts(ctx) {
  for (let i=_pts.length-1;i>=0;i--) {
    const p=_pts[i];
    p.x+=p.vx*slowMo; p.y+=p.vy*slowMo; p.vy+=0.22*slowMo; p.lf--;
    if (p.lf<=0){_pts.splice(i,1);continue;}
    const a=p.lf/p.ml;
    ctx.globalAlpha=a*0.9; ctx.fillStyle=p.col;
    if (p.ln) ctx.fillRect(p.x-p.sz/2,p.y-1,p.sz*2,2);
    else {ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(a*0.5+0.5),0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
}

// ── 飛び道具（波動拳） ────────────────────────
const _projs=[];

function spawnHadoken(x,y,dir,owner,isSuper=false) {
  _projs.push({x,y,vx:dir*(isSuper?18:11),dir,owner,isSuper,
    lf:80,w:isSuper?90:58,h:isSuper?50:33,alive:true,ang:0});
}
function getProjs() { return _projs; }

function drawProjs(ctx) {
  for (let i=_projs.length-1;i>=0;i--) {
    const p=_projs[i];
    p.x+=p.vx*slowMo; p.ang+=0.18*slowMo; p.lf--;
    if (!p.alive||p.lf<=0||p.x<-110||p.x>GAME.W+110){_projs.splice(i,1);continue;}
    const cx=p.x,cy=p.y,r=p.w/2;
    ctx.save(); ctx.translate(cx,cy);
    const corona=ctx.createRadialGradient(0,0,0,0,0,r*1.6);
    corona.addColorStop(0,p.isSuper?'rgba(0,200,255,.12)':'rgba(0,100,255,.10)');
    corona.addColorStop(1,'rgba(0,0,255,0)');
    ctx.fillStyle=corona; ctx.beginPath(); ctx.ellipse(0,0,r*1.6,p.h*0.9,0,0,Math.PI*2); ctx.fill();
    const g=ctx.createRadialGradient(0,0,0,0,0,r);
    if (p.isSuper) {
      g.addColorStop(0,'rgba(255,255,255,.97)'); g.addColorStop(.3,'rgba(130,215,255,.82)');
      g.addColorStop(.65,'rgba(0,90,255,.5)');   g.addColorStop(1,'rgba(0,30,200,0)');
    } else {
      g.addColorStop(0,'rgba(255,255,255,.92)'); g.addColorStop(.35,'rgba(70,175,255,.72)');
      g.addColorStop(.75,'rgba(0,75,215,.4)');   g.addColorStop(1,'rgba(0,40,180,0)');
    }
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,0,r,p.h/2,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=p.isSuper?'rgba(190,235,255,.75)':'rgba(90,195,255,.6)';
    ctx.lineWidth=p.isSuper?2.5:1.8;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.6,p.h*0.32,p.ang,0,Math.PI*2); ctx.stroke();
    ctx.restore();
    if (Math.random()<0.65) spk(cx-p.dir*r*0.4,cy+(Math.random()-0.5)*p.h*0.5,p.isSuper?'#80e0ff':'#4488ff',1,2,10,2);
  }
}

// ── ヒットラベル ──────────────────────────────
const _lbls=[];

function hitLabel(x,y,text,col) { _lbls.push({x,y,text,col,lf:48,ml:48}); }

function drawLabels(ctx) {
  for (let i=_lbls.length-1;i>=0;i--) {
    const p=_lbls[i]; p.y-=1; p.lf--;
    if (p.lf<=0){_lbls.splice(i,1);continue;}
    const a=Math.min(1,p.lf/12);
    const sc=p.lf>40?1+(48-p.lf)*0.09:1;
    ctx.save(); ctx.globalAlpha=a;
    ctx.font=`bold ${Math.floor(23*sc)}px 'Bebas Neue',cursive`;
    ctx.textAlign='center';
    ctx.strokeStyle='rgba(0,0,0,.9)'; ctx.lineWidth=4.5;
    ctx.strokeText(p.text,p.x,p.y);
    ctx.fillStyle=p.col; ctx.fillText(p.text,p.x,p.y);
    ctx.restore();
  }
}

// ── スローモービネット ────────────────────────
function drawSlowMoVignette(ctx) {
  if (slowMo>=1) return;
  const sv=1-slowMo;
  ctx.save(); ctx.globalAlpha=sv*0.35;
  const vg=ctx.createRadialGradient(GAME.W/2,GAME.H/2,GAME.H*0.2,GAME.W/2,GAME.H/2,GAME.H*0.8);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,20,60,.9)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,GAME.W,GAME.H);
  ctx.restore();
}

// ── 雨 ───────────────────────────────────────
const _rain=[];
(function(){
  for (let i=0;i<120;i++)
    _rain.push({x:Math.random()*GAME.W,y:Math.random()*GAME.H,
      vy:13+Math.random()*8,vx:-1.5,len:9+Math.random()*15,a:0.1+Math.random()*0.18});
})();

function drawRain(ctx) {
  ctx.save(); ctx.lineWidth=0.8;
  for (const r of _rain) {
    r.x+=r.vx*slowMo; r.y+=r.vy*slowMo;
    if (r.y>GAME.H){r.y=-20;r.x=Math.random()*GAME.W;}
    if (r.x<0) r.x=GAME.W;
    ctx.strokeStyle=`rgba(160,210,255,${r.a})`;
    ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x+r.vx*r.len/r.vy,r.y+r.len); ctx.stroke();
    if (r.y>GAME.FLOOR_Y-6&&r.y<GAME.FLOOR_Y+r.len) {
      ctx.strokeStyle=`rgba(160,210,255,${r.a*0.55})`;
      ctx.beginPath(); ctx.arc(r.x,GAME.FLOOR_Y,1.5,Math.PI,0); ctx.stroke();
    }
  }
  ctx.restore();
}

// ── リセット（ラウンド開始時） ────────────────
function resetFX() {
  _pts.length=0; _projs.length=0; _lbls.length=0;
  slowMo=1; slowMoT=0; camShake=0;
}
