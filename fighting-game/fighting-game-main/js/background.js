// ═══════════════════════════════════════════
//  background.js
//  ステージ背景の描画
//  ステージを追加する場合はここに STAGES を追加する
// ═══════════════════════════════════════════
'use strict';

let _bgCache = null;

// ── 背景を offscreen canvas にキャッシュ ──────
function buildBG() {
  const bc = document.createElement('canvas');
  bc.width = GAME.W; bc.height = GAME.H;
  const c = bc.getContext('2d');
  const FY = GAME.FLOOR_Y;

  // 空グラデーション
  const sk = c.createLinearGradient(0,0,0,FY);
  sk.addColorStop(0,'#050c1a'); sk.addColorStop(.4,'#0f1e38');
  sk.addColorStop(.7,'#1c2d50'); sk.addColorStop(1,'#283a60');
  c.fillStyle=sk; c.fillRect(0,0,GAME.W,FY);

  // 月
  const mg=c.createRadialGradient(720,58,0,720,58,52);
  mg.addColorStop(0,'rgba(255,242,200,.95)'); mg.addColorStop(.7,'rgba(255,230,160,.25)');
  mg.addColorStop(1,'rgba(255,230,160,0)');
  c.fillStyle=mg; c.beginPath(); c.arc(720,58,52,0,Math.PI*2); c.fill();

  // 星
  c.fillStyle='rgba(255,255,255,.65)';
  [[55,28],[148,18],[285,44],[408,14],[545,33],[680,21],[822,39],[175,52],[465,24],[735,48]].forEach(([sx,sy])=>{
    c.beginPath(); c.arc(sx,sy,1,0,Math.PI*2); c.fill();
  });

  // 遠景の山
  c.fillStyle='#0b1524';
  c.beginPath(); c.moveTo(0,FY);
  [[0,.65],[58,.28],[148,.47],[258,.22],[366,.38],[488,.24],[608,.40],[728,.30],[848,.42],[900,.65]]
    .forEach(([x,y])=>c.lineTo(x,FY*y));
  c.lineTo(GAME.W,FY); c.closePath(); c.fill();

  // 中景の山
  c.fillStyle='#101d35';
  c.beginPath(); c.moveTo(0,FY);
  [[0,.75],[88,.47],[198,.63],[328,.44],[458,.57],[588,.46],[708,.58],[828,.50],[900,.68]]
    .forEach(([x,y])=>c.lineTo(x,FY*y));
  c.lineTo(GAME.W,FY); c.closePath(); c.fill();

  // ビル群
  [[28,.53,36],[112,.49,29],[195,.45,42],[296,.51,31],[378,.47,39],
   [477,.52,25],[558,.46,41],[650,.52,33],[730,.48,35],[810,.54,29]].forEach(([bx,yf,bw])=>{
    c.fillStyle='#07090e'; c.fillRect(bx,FY*yf,bw,FY*(1-yf));
    for (let r=0;r<7;r++) for (let cc=0;cc<3;cc++) {
      if ((bx*r+cc)%3!==0) {
        c.fillStyle=`rgba(255,215,75,${0.22+Math.random()*0.18})`;
        c.fillRect(bx+cc*(bw/3)+3, FY*yf+r*12+5, 5, 4);
      }
    }
  });

  // ネオン看板（静的ベース）
  [[193,FY*.54,'#ff0066'],[496,FY*.51,'#00ffcc'],[746,FY*.55,'#ff8800']].forEach(([nx,ny,nc])=>{
    c.strokeStyle=nc; c.lineWidth=2; c.globalAlpha=0.42;
    c.strokeRect(nx-21,ny,42,10);
    c.globalAlpha=0.1; c.strokeRect(nx-24,ny-3,48,16); c.globalAlpha=1;
  });

  // 床
  const fg=c.createLinearGradient(0,FY,0,GAME.H);
  fg.addColorStop(0,'#18112e'); fg.addColorStop(.4,'#0c0820'); fg.addColorStop(1,'#040310');
  c.fillStyle=fg; c.fillRect(0,FY,GAME.W,GAME.H-FY);

  // 床グリッド
  c.strokeStyle='rgba(110,50,210,.18)'; c.lineWidth=1;
  for (let gx2=0;gx2<=GAME.W;gx2+=42) {
    c.beginPath(); c.moveTo(gx2,FY); c.lineTo(GAME.W/2+(gx2-GAME.W/2)*0.07,GAME.H); c.stroke();
  }
  for (let gy=0;gy<7;gy++) {
    const yy=FY+gy*(GAME.H-FY)/6;
    c.beginPath(); c.moveTo(0,yy); c.lineTo(GAME.W,yy); c.stroke();
  }

  _bgCache = bc;
}

// ── 毎フレーム描画（アニメーション付き） ────────
function drawBG(ctx) {
  if (_bgCache) ctx.drawImage(_bgCache,0,0);
  const t = performance.now()*0.001;
  const FY = GAME.FLOOR_Y;

  // 大気フォグ
  const fog=ctx.createLinearGradient(0,FY*0.65,0,FY);
  fog.addColorStop(0,'rgba(8,4,20,0)'); fog.addColorStop(1,'rgba(18,8,40,.55)');
  ctx.fillStyle=fog; ctx.fillRect(0,FY*0.65,GAME.W,FY*0.35);

  // 床ネオンエッジ
  const ne=ctx.createLinearGradient(0,FY-4,0,FY+9);
  ne.addColorStop(0,`rgba(148,48,242,${0.62+Math.sin(t*2.8)*0.1})`);
  ne.addColorStop(1,'rgba(148,48,242,0)');
  ctx.fillStyle=ne; ctx.fillRect(0,FY-4,GAME.W,13);

  // 床クロマティックグロー
  const cg=ctx.createLinearGradient(0,FY,0,FY+40);
  cg.addColorStop(0,`rgba(80,0,160,${0.3+Math.sin(t*1.2)*0.06})`);
  cg.addColorStop(1,'rgba(80,0,160,0)');
  ctx.fillStyle=cg; ctx.fillRect(0,FY,GAME.W,40);

  // ネオン看板アニメ + 床反射
  [[193,FY*0.54,'#ff0066'],[496,FY*0.51,'#00ffcc'],[746,FY*0.55,'#ff8800']].forEach(([nx,ny,nc])=>{
    const a=0.32+Math.sin(t*1.7+nx*0.01)*0.1;
    ctx.strokeStyle=nc; ctx.lineWidth=2; ctx.globalAlpha=a;
    ctx.strokeRect(nx-21,ny,42,10);
    ctx.globalAlpha=a*0.22; ctx.strokeRect(nx-25,ny-4,50,18); ctx.globalAlpha=1;
    ctx.globalAlpha=a*0.12;
    const nr=ctx.createRadialGradient(nx,FY+2,0,nx,FY+2,30);
    nr.addColorStop(0,nc); nr.addColorStop(1,'transparent');
    ctx.fillStyle=nr; ctx.fillRect(nx-30,FY,60,20); ctx.globalAlpha=1;
  });
}
