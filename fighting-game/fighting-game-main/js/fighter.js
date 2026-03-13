'use strict';

class Fighter {
  constructor(pid, sx, charDef, isP2) {
    this.pid = pid;
    this.charDef = charDef;
    this.pal = PALETTES[charDef.palette];
    this.stats = charDef.stats;
    this.moves = charDef.moves || {};
    this.p2 = isP2;
    this.facing = isP2 ? -1 : 1;

    this.x = sx;
    this.y = GAME.FLOOR_Y;
    this.vy = 0;

    this.hp = GAME.MAX_HP;
    this.hpD = GAME.MAX_HP;
    this.ex = 0;
    this.ca = 0;

    this.st = 'idle';
    this.sT = 0;
    this.aBox = null;
    this.aTyp = '';
    this.aDur = 0;
    this.aCd = 0;
    this.hurtT = 0;
    this.kvx = 0;
    this.jN = 0;
    this.grd = false;

    this.combo = 0;
    this.comboT = 0;
    this.maxCombo = 0;
    this.hadoT = 0;
    this.shoryuT = 0;
    this.wins = 0;
    this.dmg = 0;
    this.hits = 0;

    this.aF = 0;
    this.aT = 0;
    this.wPh = 0;
    this.shake = 0;
  }

  get cx() { return this.x + GAME.FW / 2; }
  get onG() { return this.y >= GAME.FLOOR_Y; }

  hb() {
    return {
      x: this.x + 12,
      y: this.y - GAME.FH + 8,
      w: GAME.FW - 24,
      h: GAME.FH - 8,
    };
  }

  ab() {
    if (!this.aBox || !this.aBox.act) return null;
    const d = this.facing;
    const bx = d > 0 ? this.x + GAME.FW - 6 : this.x - this.aBox.w + 6;
    return { x: bx, y: this.y - GAME.FH * 0.68, w: this.aBox.w, h: this.aBox.h };
  }

  move(dx) {
    if (['hurt', 'super', 'knocked', 'attack'].includes(this.st)) return;
    const spd = dx * this.stats.speed;
    this.x = Math.max(6, Math.min(GAME.W - GAME.FW - 6, this.x + spd));
    if (this.onG) this.wPh += Math.abs(spd) * 0.08;
  }

  jump() {
    if (this.jN >= 2 || ['hurt', 'super', 'knocked'].includes(this.st)) return;
    this.vy = -16.5 * this.stats.jumpPow;
    this.jN++;
    if (this.st !== 'attack') this.st = 'jump';
  }

  attack(type) {
    if (this.aCd > 0 || ['hurt', 'super', 'knocked'].includes(this.st) || this.grd) return false;

    const base = ATTACK_DATA[type];
    if (!base) return false;

    const c = { ...base, ...(this.moves[type] || {}) };
    c.dmg = Math.round(c.dmg * this.stats.power);

    this.st = 'attack';
    this.sT = 0;
    this.aTyp = type;
    this.aDur = c.dur;
    this.aCd = c.cd;
    this.aBox = { ...c, act: false, hit: false };

    (type === 'heavy' ? SFX.hitHeavy : SFX.hitWeak)();
    return true;
  }

  hadoken() {
    const mv = this.moves.hadoken || {};
    const cd = mv.cd ?? 50;

    if (this.hadoT > 0 || this.st !== 'idle') return false;

    this.hadoT = cd;
    this.st = 'attack';
    this.sT = 0;
    this.aTyp = 'hado';
    this.aDur = 30;
    this.aCd = cd;
    this.aBox = null;

    const self = this;
    setTimeout(() => {
      spawnHadoken(
        self.cx + self.facing * 12,
        self.y - GAME.FH * 0.52,
        self.facing,
        self.pid,
        false
      );

      const projs = getProjs();
      const p = projs[projs.length - 1];
      if (p) {
        p.vx = self.facing * (mv.speed ?? 11);
        p.w = mv.w ?? 58;
        p.h = mv.h ?? 33;
        p.dmg = Math.round((mv.dmg ?? 29) * self.stats.power);
        p.ex = mv.ex ?? 13;
        p.kbx = mv.kbx ?? 19;
        p.kby = mv.kby ?? -5;
        p.ht = mv.ht ?? 21;
      }

      ring(self.cx + self.facing * 12, self.y - GAME.FH * 0.52, '#88ccff', 20);
      SFX.hadoken();
    }, 140);

    return true;
  }

  shoryu() {
    const mv = this.moves.shoryu || {};
    const cd = mv.cd ?? 55;

    if (this.shoryuT > 0 || ['hurt', 'super', 'knocked'].includes(this.st)) return false;

    this.shoryuT = 78;
    this.st = 'attack';
    this.sT = 0;
    this.aTyp = 'shoryu';
    this.aDur = 36;
    this.aCd = cd;

    const dmg = Math.round((mv.dmg ?? 30) * this.stats.power);

    this.aBox = {
      w: mv.w ?? 52,
      h: mv.h ?? 125,
      dmg,
      act: false,
      hit: false,
      ex: mv.ex ?? 13,
      kbx: mv.kbx ?? 7,
      kby: mv.kby ?? -15,
      ht: mv.ht ?? 24,
      isSh: true,
    };

    this.vy = -19 * this.stats.jumpPow;

    spk(this.cx, this.y, '#ff8800', 10, 6, 16, 4);
    spk(this.cx, this.y, '#ffcc00', 6, 4, 12, 3);
    SFX.shoryu();
    return true;
  }

  ca_move() {
    if (this.ca < GAME.MAX_CA || this.st !== 'idle') return false;

    const mv = this.moves.hadoken || {};

    this.ca = 0;
    this.st = 'super';
    this.sT = 0;
    this.aTyp = 'super';
    this.aDur = 52;
    this.aCd = 62;
    this.aBox = null;

    flashScreen(0.88);
    announceText(this.charDef.specials.caName || 'CA!!', '#00ffff', 950);
    SFX.super_();

    const self = this;
    [0, 210, 420].forEach(d => setTimeout(() => {
      spawnHadoken(self.cx + self.facing * 12, self.y - GAME.FH * 0.5, self.facing, self.pid, true);

      const projs = getProjs();
      const p = projs[projs.length - 1];
      if (p) {
        p.vx = self.facing * ((mv.speed ?? 11) + 7);
        p.w = (mv.w ?? 58) + 32;
        p.h = (mv.h ?? 33) + 17;
        p.dmg = Math.round(((mv.dmg ?? 29) + 22) * self.stats.power);
        p.ex = (mv.ex ?? 13) + 4;
        p.kbx = (mv.kbx ?? 19) + 6;
        p.kby = mv.kby ?? -5;
        p.ht = (mv.ht ?? 21) + 4;
      }

      ring(self.cx + self.facing * 12, self.y - GAME.FH * 0.5, '#aae8ff', 32);
    }, 370 + d));

    return true;
  }

  hit(dmg, c, atk) {
    if (this.st === 'knocked') return;
    const blk = this.grd && !c.isTh && !c.isSh && !c.isSup;
    const defMult = blk ? 0.08 : (1 / this.stats.defense);
    const actual = blk ? Math.max(1, Math.floor(dmg * 0.08)) : Math.round(dmg * defMult);
    const prev = this.hp;

    this.hp = Math.max(0, this.hp - actual);
    atk.dmg += actual;
    atk.hits++;
    atk.ex = Math.min(GAME.MAX_EX, atk.ex + (c.ex || 5));
    if (atk.ex >= GAME.MAX_EX) {
      atk.ca = Math.min(GAME.MAX_CA, atk.ca + 12);
      atk.ex = 0;
    }
    atk.combo++;
    atk.comboT = 72;
    if (atk.combo > atk.maxCombo) atk.maxCombo = atk.combo;

    if (!blk) {
      this.st = c.isSup ? 'knocked' : 'hurt';
      this.hurtT = c.ht || 13;
      this.sT = 0;
      this.shake = 5;
      const dir = atk.cx < this.cx ? 1 : -1;
      this.kvx = dir * (c.kbx || 10);
      if (c.kby) this.vy = c.kby;
    } else {
      this.st = 'hurt';
      this.hurtT = 5;
      this.sT = 0;
      SFX.guard();
    }

    updateHP(this.pid, this.hp, prev);
    const ab = atk.ab();
    const sx = ab ? ab.x + ab.w / 2 : this.cx;
    const sy = this.y - GAME.FH * 0.54;

    if (c.isSup || dmg >= 24) {
      spk(sx, sy, '#ffaa00', 12, 10, 20, 5);
      spk(sx, sy, '#fff', 8, 12, 15, 3);
      ring(sx, sy, '#ffdd00', 22);
      triggerShake(10);
      triggerSlowMo(14);
    } else if (!blk) {
      spk(sx, sy, '#fff', 7, 8, 14, 3);
      spk(sx, sy, '#aaddff', 5, 6, 12, 3);
      triggerShake(4);
    }

    if (!blk) slash(sx, sy, atk.facing, '#ffffaa', 9);
    const lt = blk ? 'GUARD' : c.isSup ? 'CRITICAL!!' : (c.isTh || c.isSh) ? 'SMASH!' : dmg >= 22 ? 'HEAVY!' : 'HIT!';
    const lc = blk ? '#44aaff' : c.isSup ? '#ff00ff' : (c.isTh || c.isSh) ? '#ff7700' : dmg >= 22 ? '#ffcc00' : '#ffffff';
    hitLabel(sx, sy - 24, lt, lc);
    if (!blk && dmg >= 22) SFX.hitHeavy();
  }

  update(opp) {
    this.sT++;
    this.aT++;
    if (this.aT > 7) {
      this.aT = 0;
      this.aF = (this.aF + 1) % 4;
    }
    if (this.hadoT > 0) this.hadoT--;
    if (this.shoryuT > 0) this.shoryuT--;
    if (this.aCd > 0) this.aCd--;
    if (this.comboT > 0) {
      this.comboT--;
      if (!this.comboT) this.combo = 0;
    }
    if (this.shake > 0) this.shake--;

    if (!this.onG || this.vy < 0) {
      this.vy += GAME.GRAV;
      this.y = Math.min(GAME.FLOOR_Y, this.y + this.vy);
      if (this.y >= GAME.FLOOR_Y) {
        this.y = GAME.FLOOR_Y;
        this.vy = 0;
        this.jN = 0;
        if (this.st === 'jump') this.st = 'idle';
        if (this.st === 'knocked') {
          this.st = 'idle';
          spk(this.cx, this.y, '#aaa', 8, 4, 14, 2);
        }
      }
    }

    if (this.kvx) {
      this.x = Math.max(6, Math.min(GAME.W - GAME.FW - 6, this.x + this.kvx));
      this.kvx *= 0.65;
      if (Math.abs(this.kvx) < 0.4) this.kvx = 0;
    }

    if (this.st === 'hurt') {
      this.hurtT--;
      if (this.hurtT <= 0) this.st = this.onG ? 'idle' : 'jump';
    }

    if (this.st === 'attack' || this.st === 'super') {
      const as = Math.floor(this.aDur * 0.27);
      const ae = Math.floor(this.aDur * 0.67);
      if (this.aBox) this.aBox.act = this.sT >= as && this.sT < ae;
      if (this.sT >= this.aDur) {
        this.st = this.onG ? 'idle' : 'jump';
        this.aBox = null;
      }
    }

    if (this.aTyp === 'shoryu' && this.sT % 3 === 0 && this.sT < this.aDur) {
      spk(this.cx, this.y - GAME.FH * 0.3, '#ff8800', 2, 3, 10, 3);
    }

    if (['idle', 'jump'].includes(this.st)) this.facing = this.cx < opp.cx ? 1 : -1;
    this.grd = this.grd && this.onG;

    if (this.hpD > this.hp) {
      this.hpD = Math.max(this.hp, this.hpD - 0.72);
      document.getElementById('d' + this.pid[1]).style.width = (this.hpD / GAME.MAX_HP * 100) + '%';
    }

    const cel = _comboDivs[this.pid];
    if (cel) {
      if (this.combo >= 2 && this.comboT > 0) {
        const sz = Math.min(58, 30 + this.combo * 3);
        cel.innerHTML = `<span style="font-size:${sz}px;color:#ffd700;display:block;line-height:1">${this.combo}</span><span style="font-size:12px;color:#ffaa00;letter-spacing:.12em">HIT COMBO</span>`;
        cel.style.opacity = Math.min(1, this.comboT / 18) + '';
      } else {
        cel.style.opacity = '0';
      }
    }

    if (this.x <= 6) {
      this.x = 6;
      this.kvx = Math.abs(this.kvx) * 0.25;
    }
    if (this.x >= GAME.W - GAME.FW - 6) {
      this.x = GAME.W - GAME.FW - 6;
      this.kvx = -Math.abs(this.kvx) * 0.25;
    }
  }

  draw(ctx) {
    const shk = this.shake ? (Math.random() - 0.5) * 3.5 : 0;
    ctx.save();
    ctx.translate(this.x + GAME.FW / 2 + shk, this.y);
    if (this.facing < 0) ctx.scale(-1, 1);

    const hurt = this.st === 'hurt' || this.st === 'knocked';
    const atk = this.st === 'attack';
    const spr = this.st === 'super';
    const grd = this.grd;
    const jmp = !this.onG;
    const pal = this.pal;
    const t = this.sT / Math.max(1, this.aDur);
    const wp = this.wPh;
    const ws = Math.sin(wp) * 9;
    const ws2 = Math.sin(wp + Math.PI) * 9;
    const bob = Math.abs(Math.sin(wp)) * -3;

    if (spr) {
      ctx.shadowColor = 'rgba(0,220,255,.9)';
      ctx.shadowBlur = 24;
    } else if (hurt) {
      ctx.shadowColor = 'rgba(255,60,0,.8)';
      ctx.shadowBlur = 18;
    } else if (this.ca >= GAME.MAX_CA) {
      ctx.shadowColor = 'rgba(255,200,0,.65)';
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = this.p2 ? 'rgba(255,70,30,.4)' : 'rgba(30,130,255,.4)';
      ctx.shadowBlur = 9;
    }

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.scale(1, 0.18);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 30, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (grd) {
      ctx.save();
      ctx.shadowBlur = 0;
      const ga = ctx.createRadialGradient(0, -55, 5, 0, -55, 56);
      ga.addColorStop(0, 'rgba(60,140,255,.14)');
      ga.addColorStop(1, 'rgba(60,140,255,0)');
      ctx.fillStyle = ga;
      ctx.beginPath();
      ctx.ellipse(0, -55, 56, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,160,255,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -55, 52, 66, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.aTyp === 'shoryu' && atk) {
      ctx.save();
      ctx.shadowBlur = 0;
      const ff = ctx.createRadialGradient(0, -60, 5, 0, -60, 46);
      ff.addColorStop(0, 'rgba(255,180,0,.24)');
      ff.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = ff;
      ctx.beginPath();
      ctx.ellipse(0, -60, 42, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const capsule = (cx1, cy1, cx2, cy2, r, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = r * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx1, cy1, r, 0, Math.PI * 2);
      ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const fist = (x, y, s, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, s, s * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const hipY = -24 + bob;
    const shlY = -86 + bob * 0.4;
    const neckY = -101 + bob * 0.35;
    const headY = -122 + bob * 0.25;

    const sk = hurt ? '#d96b6b' : spr ? '#9fe8ff' : pal.sk;
    const bL = hurt ? '#c65b5b' : spr ? '#5bd9ff' : pal.bL;
    const bM = hurt ? '#9d3131' : spr ? '#28baf0' : pal.bM;
    const bD = hurt ? '#6a1717' : spr ? '#1188c0' : pal.bD;

    ctx.save();
    ctx.shadowBlur *= 0.7;
    if (hurt || this.st === 'knocked') {
      capsule(-12, hipY, 0, hipY + 16, 8, pal.pants);
      capsule(0, hipY + 16, 12, hipY + 24, 7, pal.pants);
      capsule(10, hipY, -8, hipY + 20, 8, pal.pants);
      capsule(-8, hipY + 20, -18, hipY + 25, 7, pal.pants);
      ctx.fillStyle = pal.boots;
      ctx.beginPath(); ctx.ellipse(-22, 0, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(20, 0, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    } else if (jmp) {
      capsule(-6, hipY, -18, hipY - 26, 8, pal.pants);
      capsule(-18, hipY - 26, -14, hipY - 2, 7, pal.pants);
      capsule(6, hipY, 14, hipY - 20, 8, pal.pants);
      capsule(14, hipY - 20, 10, hipY + 8, 7, pal.pants);
      ctx.fillStyle = pal.boots;
      ctx.beginPath(); ctx.ellipse(-14, hipY - 2, 10, 5.5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, hipY + 8, 10, 5.5, 0.2, 0, Math.PI * 2); ctx.fill();
    } else {
      const la = ws * 0.018;
      const ra = ws2 * 0.018;
      const tl = 30;
      const lkx = -8 + Math.sin(la) * tl;
      const lky = hipY + Math.cos(la) * tl;
      const rkx = 8 + Math.sin(ra) * tl;
      const rky = hipY + Math.cos(ra) * tl;
      capsule(-8, hipY, lkx, lky, 8, pal.pants);
      capsule(lkx, lky, lkx - Math.sin(la) * 2, 0, 7, pal.pants);
      capsule(8, hipY, rkx, rky, 8, pal.pants);
      capsule(rkx, rky, rkx - Math.sin(ra) * 2, 0, 7, pal.pants);
      ctx.fillStyle = pal.boots;
      ctx.beginPath(); ctx.ellipse(lkx - Math.sin(la) * 2 + 1, 1, 11, 5.5, la * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rkx - Math.sin(ra) * 2 + 1, 1, 11, 5.5, ra * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = pal.belt;
    ctx.beginPath();
    ctx.ellipse(0, hipY + 2, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    {
      const tg = ctx.createLinearGradient(0, shlY, 0, hipY);
      tg.addColorStop(0, bL);
      tg.addColorStop(0.55, bM);
      tg.addColorStop(1, bD);
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(-24, shlY + 2);
      ctx.bezierCurveTo(-26, shlY + 10, -20, hipY - 8, -16, hipY);
      ctx.lineTo(16, hipY);
      ctx.bezierCurveTo(20, hipY - 8, 26, shlY + 10, 24, shlY + 2);
      ctx.closePath();
      ctx.fill();
    }

    {
      const ext = Math.sin(Math.min(t * Math.PI, Math.PI));
      if (atk || spr) {
        if (this.aTyp === 'weak') {
  const ex = ext * 44;
  capsule(18, shlY + 6, 18 + ex, shlY + 8, 6, sk); fist(19 + ex, shlY + 7, 7, sk);
  capsule(-20, shlY + 4, -16, shlY + 22, 5, sk); fist(-15, shlY + 22, 6, sk);
} else if (this.aTyp === 'heavy') {
  const ex = ext * 52;
  capsule(14, shlY + 2, 14 + ex * 0.7, shlY - 2 + ex * 0.1, 7, sk);
  capsule(14 + ex * 0.7, shlY - 2 + ex * 0.1, 16 + ex, shlY + ex * 0.05, 6, sk);
  fist(17 + ex, shlY + ex * 0.05, 8, sk);
  capsule(-22, shlY + 4, -18, shlY + 24, 6, sk); fist(-17, shlY + 24, 7, sk);
} else if (this.aTyp === 'hado') {
  const push = ext * 18;
  capsule(-18, shlY + 6, 16 + push, shlY + 6, 6, sk);
  capsule(14, shlY + 4, 18 + push, shlY + 5, 6, sk);
  fist(17 + push, shlY + 5, 7, sk); fist(16 + push, shlY + 6, 7, sk);
} else if (this.aTyp === 'shoryu') {
  const up = Math.min(t * 1.5, 1);
  const ux = 12 + up * 10;
  const uy = shlY - up * 60;
  capsule(14, shlY + 4, ux, uy + 20, 7, sk);
  capsule(ux, uy + 20, ux - 2, uy, 6, sk);
  fist(ux - 2, uy, 8, sk);
  capsule(-18, shlY + 6, -16, shlY + 28, 5, sk); fist(-15, shlY + 28, 6, sk);
} else if (this.aTyp === 'super') {
  const push = Math.min(t * 2, 1) * 24;
  capsule(-18, shlY + 5, 14 + push, shlY + 4, 7, sk);
  capsule(14, shlY + 3, 18 + push, shlY + 4, 7, sk);
  fist(18 + push, shlY + 3, 8, sk); fist(14 + push, shlY + 4, 7, sk);
}
      } else if (grd) {
        capsule(-20, shlY + 4, -24, shlY - 14, 7, sk); fist(-24, shlY - 16, 9, sk);
        capsule(18, shlY + 2, 22, shlY - 18, 7, sk); fist(22, shlY - 20, 9, sk);
      } else {
        const aSwing = Math.sin(wp + Math.PI) * 0.35;
        const aSwing2 = Math.sin(wp) * 0.35;
        capsule(18, shlY + 6, 22 + Math.sin(aSwing) * 8, shlY + 30 + Math.cos(aSwing) * 8, 6, sk);
        fist(22 + Math.sin(aSwing) * 8, shlY + 32 + Math.cos(aSwing) * 8, 7, sk);
        capsule(-20, shlY + 6, -22 + Math.sin(aSwing2) * 8, shlY + 28 + Math.cos(aSwing2) * 8, 6, sk);
        fist(-22 + Math.sin(aSwing2) * 8, shlY + 30 + Math.cos(aSwing2) * 8, 7, sk);
      }
    }

    ctx.fillStyle = sk;
    ctx.beginPath();
    ctx.moveTo(-5, neckY);
    ctx.lineTo(5, neckY);
    ctx.lineTo(4, headY + 14);
    ctx.lineTo(-4, headY + 14);
    ctx.closePath();
    ctx.fill();

    {
      const tiltX = hurt ? 3 : grd ? -2 : 0;
      const hg = ctx.createRadialGradient(-5 + tiltX, headY - 6, 1, tiltX, headY, 19);
      hg.addColorStop(0, hurt ? '#ffe0d8' : spr ? '#d8f8ff' : pal.fL);
      hg.addColorStop(0.6, hurt ? '#e89090' : spr ? '#70c8e0' : pal.fM);
      hg.addColorStop(1, hurt ? '#c84040' : spr ? '#2888b0' : pal.fD);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(tiltX, headY, 17, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.arc(tiltX, headY - 10, 17, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.fill();
      ctx.fillStyle = pal.hb;
      ctx.beginPath();
      ctx.ellipse(tiltX, headY - 2, 18, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.restore();
  }
}
