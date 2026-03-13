// ═══════════════════════════════════════════
//  collision.js
//  当たり判定・押し合い処理
// ═══════════════════════════════════════════
'use strict';

function _ovlp(a,b) {
  return a&&b&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

// ── 攻撃ヒット判定 ───────────────────────────
function checkHits(f1, f2) {
  // 通常技
  [f1,f2].forEach(atk => {
    const def = atk===f1 ? f2 : f1;
    if (!atk.aBox?.act || atk.aBox.hit) return;
    if (!_ovlp(atk.ab(), def.hb())) return;
    atk.aBox.hit=true;
    def.hit(atk.aBox.dmg, atk.aBox, atk);
  });

  // 飛び道具
  const projs = getProjs();
  for (let i=projs.length-1;i>=0;i--) {
    const p=projs[i]; if (!p.alive) continue;
    const def = p.owner==='p1' ? f2 : f1;
    const atk = p.owner==='p1' ? f1 : f2;
    const pb  = {x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h};
    if (_ovlp(pb, def.hb())) {
      p.alive=false;
      const dmg = p.dmg ?? (p.isSuper ? 60 : 29);
def.hit(dmg,{
  dmg,
  isSup:p.isSuper,
  ex:p.ex ?? 13,
  kbx:p.kbx ?? 19,
  kby:p.kby ?? -5,
  ht:p.ht ?? 21
},atk);
      ring(p.x,p.y,'#88ccff',p.isSuper?38:22);
      spk(p.x,p.y,'#fff',10,10,16,4);
      if (p.isSuper){flashScreen(0.48);SFX.projHit();}
      projs.splice(i,1); continue;
    }
    // 飛び道具同士の衝突
    for (let j=projs.length-1;j>=0;j--) {
      if (j===i) continue;
      const q=projs[j];
      if (!q.alive||q.owner===p.owner) continue;
      if (Math.abs(p.x-q.x)<36&&Math.abs(p.y-q.y)<26) {
        ring(p.x,p.y,'#fff',28);
        spk(p.x,p.y,'#aaddff',14,8,16,3);
        p.alive=false; q.alive=false;
        SFX.clash();
      }
    }
  }
}

// ── 押し合い（重なり防止） ────────────────────
function separateFighters(f1, f2) {
  const ov=(f1.x+GAME.FW)-f2.x;
  if (ov>2) {
    const push=ov/2*1.1;
    f1.x=Math.max(6,f1.x-push);
    f2.x=Math.min(GAME.W-GAME.FW-6,f2.x+push);
  }
}
