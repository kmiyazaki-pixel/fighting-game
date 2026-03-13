// ═══════════════════════════════════════════
//  hud.js
//  HUD更新・アナウンス・コンボ表示・フラッシュ
// ═══════════════════════════════════════════
'use strict';

// コンボ表示div（game.jsからfighterに参照される）
const _comboDivs = {};

function buildComboDivs() {
  ['p1','p2'].forEach(pid => {
    // 既存があれば削除
    const existing = document.getElementById('combo-'+pid);
    if (existing) existing.remove();
    const d = document.createElement('div');
    d.id = 'combo-'+pid;
    d.style.cssText = `position:absolute;pointer-events:none;z-index:7;
      font-family:'Black Ops One',cursive;text-shadow:3px 3px 0 #000;opacity:0;
      bottom:28%;${pid==='p1'?'left:14px':'right:14px'};
      text-align:${pid==='p1'?'left':'right'}`;
    document.getElementById('wrap').appendChild(d);
    _comboDivs[pid] = d;
  });
}

// ── HP バー ──────────────────────────────────
function updateHP(pid, hp, prev) {
  const n   = pid[1];
  const pct = hp/GAME.MAX_HP*100;
  const el  = document.getElementById('h'+n);
  el.style.width = pct+'%';
  el.className   = 'hp-bar'+(hp<GAME.MAX_HP*0.25?' red':hp<GAME.MAX_HP*0.5?' yellow':'');
  document.getElementById('d'+n).style.width = (prev/GAME.MAX_HP*100)+'%';
}

// ── EX / CA バー ─────────────────────────────
function updateGauges(f) {
  const n = f.pid[1];
  document.getElementById('ex'+n).style.width = (f.ex/GAME.MAX_EX*100)+'%';
  const cpct = f.ca/GAME.MAX_CA*100;
  const cb   = document.getElementById('ca'+n);
  cb.style.width    = cpct+'%';
  cb.className      = 'ca-bar'+(cpct>=100?' full':'');
}

// ── ラウンド勝利ピップ ─────────────────────
function buildP2Pips() {
  // 既存チェック
  if (document.getElementById('pp2a')) return;
  const mid  = document.querySelector('.mid');
  const row2 = document.createElement('div');
  row2.className = 'pips'; row2.style.marginTop='2px';
  row2.innerHTML  = '<div class="pip" id="pp2a"></div><div class="pip" id="pp2b"></div>';
  mid.appendChild(row2);
}

function updateAllPips(f1, f2) {
  document.getElementById('pp1a').className = 'pip'+(f1.wins>=1?' on':'');
  document.getElementById('pp1b').className = 'pip'+(f1.wins>=2?' on':'');
  const pp2a = document.getElementById('pp2a');
  if (pp2a) {
    pp2a.className = 'pip'+(f2.wins>=1?' on':'');
    document.getElementById('pp2b').className = 'pip'+(f2.wins>=2?' on':'');
  }
}

// ── プレイヤー名表示を選択キャラに更新 ──────
function updatePlayerNames(charP1, charP2) {
  document.querySelector('#s1 .pname').innerHTML =
    `${charP1.name} <span class="badge">${charP1.rank}</span>`;
  document.querySelector('#s2 .pname').innerHTML =
    `<span class="badge">${charP2.rank}</span> ${charP2.name}`;
}

// ── アナウンス ────────────────────────────────
let _annTmr;
function announceText(text, col='#ffd700', dur=1400) {
  const el = document.getElementById('at');
  el.textContent=text; el.style.color=col; el.classList.add('on');
  clearTimeout(_annTmr);
  _annTmr = setTimeout(()=>el.classList.remove('on'), dur);
}

// ── 画面フラッシュ ────────────────────────────
function flashScreen(s=0.82) {
  const el = document.getElementById('flash');
  el.style.opacity=s+'';
  setTimeout(()=>el.style.opacity='0', 160);
}

// ── タイマー表示 ──────────────────────────────
function updateTimer(t) {
  const el = document.getElementById('timer');
  el.textContent = t;
  el.className   = t<=10 ? 'low' : '';
}

// ── ラウンド表示 ──────────────────────────────
function updateRoundLabel(round) {
  document.getElementById('rlbl').textContent = `ROUND ${round}`;
}

// ── リザルト表示 ──────────────────────────────
function showResultScreen(winner, f1, f2) {
  document.getElementById('result').style.display='flex';
  const wf = winner==='p1' ? f1 : f2;
  document.getElementById('rko').textContent   = winner ? 'K.O.!' : 'DRAW!';
  document.getElementById('rwin').textContent  = winner ? `${wf.charDef.name} WINS!` : 'DRAW!';
  document.getElementById('rst').innerHTML =
    `<div><span>${wf.hits}</span>HITS</div>` +
    `<div><span>${wf.dmg}</span>DAMAGE</div>` +
    `<div><span>${wf.maxCombo}</span>MAX COMBO</div>` +
    `<div><span>${f1.wins}-${f2.wins}</span>ROUNDS</div>`;
}
