'use strict';

const _sel = { p1: 0, p2: 1 };
let _activePick = 'p1';

function buildCharSelectScreen() {
  const screen = document.getElementById('charselect');
  _activePick = 'p1';

  const isOnline = typeof battleMode !== 'undefined' && battleMode === 'online';
  const isSoloRandom =
    typeof battleMode !== 'undefined' &&
    battleMode === 'solo' &&
    typeof cpuSelectMode !== 'undefined' &&
    cpuSelectMode === 'random';
  const isSoloSelect =
    typeof battleMode !== 'undefined' &&
    battleMode === 'solo' &&
    typeof cpuSelectMode !== 'undefined' &&
    cpuSelectMode === 'select';

  screen.innerHTML = `
    <div class="cs-title">SELECT YOUR FIGHTER</div>

    <div class="cs-grid" id="cs-grid"></div>

    <div class="cs-preview">
      <div class="cs-side pick-target active" id="cs-p1-info" title="P1を選択中"></div>
      <div class="cs-vs">VS</div>
      <div class="cs-side r pick-target ${isSoloRandom ? 'disabled' : ''}" id="cs-p2-info" title="P2を選択中"></div>
    </div>

    <div class="cs-hint">
      ${
        isOnline
          ? 'ONLINE: 自分のキャラを選んで準備完了を押してください。両者の準備完了後に自動で対戦開始します。'
          : isSoloRandom
            ? 'SOLO: 自分のキャラを選び、CPUキャラはランダムで決定されます。'
            : 'SOLO: 1回目でP1、2回目でCPUキャラを選択します。左右パネルを押して直接切り替えることもできます。'
      }
  </div>

   ${
  isOnline
    ? `
      <div class="om-row" style="justify-content:center; margin-top:8px; margin-bottom:6px;">
        <button class="tbtn" onclick="readyOnlineFromCharSelect()">準備完了</button>
        <button class="tbtn outline" onclick="unreadyOnlineFromCharSelect()">準備解除</button>
      </div>
      <div id="char-online-ready-state" class="cs-online-note" style="text-align:center; margin-top:0;">
        P1 ready:N / P2 ready:N / P1 char:- / P2 char:-
      </div>
    `
    : `<button class="cs-start-btn" onclick="startGame()" style="position:absolute;bottom:32px">
         ▶ FIGHT START
       </button>`
} 
  `;

  const p1Info = document.getElementById('cs-p1-info');
  const p2Info = document.getElementById('cs-p2-info');

  p1Info.onclick = () => {
    _activePick = 'p1';
    _renderSelections();
  };

  if (!isSoloRandom) {
    p2Info.onclick = () => {
      _activePick = 'p2';
      _renderSelections();
    };
  }

  const grid = document.getElementById('cs-grid');
  CHARACTERS.forEach((ch, i) => {
    const card = document.createElement('div');
    card.className = 'cs-card';
    card.id = 'cs-card-' + i;
    card.innerHTML = `
      <canvas class="cs-portrait" id="cs-portrait-${i}" width="110" height="140"></canvas>
      <div class="cs-name">${ch.name}</div>
      <div class="cs-rank-label">${ch.rank}</div>
    `;

    card.onclick = () => {
      if (isSoloRandom) {
        _selChar('p1', i);
        return;
      }

      _selChar(_activePick, i);

      if (isSoloSelect && _activePick === 'p1') {
        _activePick = 'p2';
        _renderSelections();
      }
    };

    grid.appendChild(card);
  });

  _renderSelections();
  _drawAllPortraits();

  if (isOnline && window.netState?.roomState) {
    syncRoomStateToUI(window.netState.roomState, ['p1', 'p2']);
  }
}

function _selChar(pid, idx) {
  _sel[pid] = Math.max(0, Math.min(CHARACTERS.length - 1, idx));
  _renderSelections();

  if (window.netState?.connected && window.netState?.playerId === pid) {
    const ch = CHARACTERS[_sel[pid]];
    if (ch) sendSelectedChar(ch.id);
  }
}

function charSelectInput() {
  const now = Date.now();
  const isSoloRandom =
    typeof battleMode !== 'undefined' &&
    battleMode === 'solo' &&
    typeof cpuSelectMode !== 'undefined' &&
    cpuSelectMode === 'random';

  if (!K._csInit) K._csInit = now;

  if (ky('a', 'A') && !K._csl1 && now - (K._cslast1 || 0) > 180) {
    _selChar('p1', _sel.p1 - 1);
    K._cslast1 = now;
    K._csl1 = 1;
    _activePick = 'p1';
  }
  if (!ky('a', 'A')) delete K._csl1;

  if (ky('d', 'D') && !K._csr1 && now - (K._csright1 || 0) > 180) {
    _selChar('p1', _sel.p1 + 1);
    K._csright1 = now;
    K._csr1 = 1;
    _activePick = 'p1';
  }
  if (!ky('d', 'D')) delete K._csr1;

  if (!isSoloRandom) {
    if (ky('ArrowLeft') && !K._csl2 && now - (K._cslast2 || 0) > 180) {
      _selChar('p2', _sel.p2 - 1);
      K._cslast2 = now;
      K._csl2 = 1;
      _activePick = 'p2';
    }
    if (!ky('ArrowLeft')) delete K._csl2;

    if (ky('ArrowRight') && !K._csr2 && now - (K._csright2 || 0) > 180) {
      _selChar('p2', _sel.p2 + 1);
      K._csright2 = now;
      K._csr2 = 1;
      _activePick = 'p2';
    }
    if (!ky('ArrowRight')) delete K._csr2;
  }

  _renderSelections();
}

function _renderSelections() {
  const isSoloRandom =
    typeof battleMode !== 'undefined' &&
    battleMode === 'solo' &&
    typeof cpuSelectMode !== 'undefined' &&
    cpuSelectMode === 'random';

  CHARACTERS.forEach((ch, i) => {
    const card = document.getElementById('cs-card-' + i);
    if (!card) return;

    card.className =
      'cs-card' +
      (_sel.p1 === i && _sel.p2 === i
        ? ' both'
        : _sel.p1 === i
          ? ' p1sel'
          : _sel.p2 === i
            ? ' p2sel'
            : '');
  });

  const ch1 = CHARACTERS[_sel.p1];
  const ch2 = isSoloRandom
    ? { name: 'RANDOM', bio: '開始時にCPUキャラがランダム決定されます。', stats: { speed:1, power:1, defense:1, jumpPow:1 }, specials: { caName: '???' } }
    : CHARACTERS[_sel.p2];

  const p1 = document.getElementById('cs-p1-info');
  const p2 = document.getElementById('cs-p2-info');

  if (p1) {
    p1.innerHTML = _charInfoHTML(ch1, 'p1');
    p1.classList.toggle('active', _activePick === 'p1');
  }

  if (p2) {
    p2.innerHTML = isSoloRandom
      ? `
        <div class="cs-charname">RANDOM</div>
        <div class="cs-bio">開始時にCPUキャラがランダム決定されます。</div>
        <div class="cs-ca-name">CA: ???</div>
      `
      : _charInfoHTML(ch2, 'p2');
    p2.classList.toggle('active', !isSoloRandom && _activePick === 'p2');
  }
}

function _charInfoHTML(ch, side) {
  const s = ch.stats;
  const bar = (v, max = 2.0) => {
    const pct = Math.round((v / max) * 100);
    const col = side === 'p1' ? '#4af' : '#f84';
    return `<div class="stat-bar-bg"><div class="stat-bar" style="width:${pct}%;background:${col}"></div></div>`;
  };

  return `
    <div class="cs-charname">${ch.name}</div>
    <div class="cs-bio">${ch.bio}</div>
    <div class="cs-stats">
      <div class="stat-row"><span>SPEED</span>${bar(s.speed)}</div>
      <div class="stat-row"><span>POWER</span>${bar(s.power)}</div>
      <div class="stat-row"><span>DEFENSE</span>${bar(s.defense)}</div>
      <div class="stat-row"><span>JUMP</span>${bar(s.jumpPow)}</div>
    </div>
    <div class="cs-ca-name">CA: ${ch.specials.caName}</div>
  `;
}

function _drawAllPortraits() {
  CHARACTERS.forEach((ch, i) => {
    const canvas = document.getElementById('cs-portrait-' + i);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 110, 140);

    const dummy = new Fighter('p1', 0, ch, false);
    dummy.x = 0;
    dummy.y = 120;
    dummy.facing = 1;

    ctx.save();
    ctx.translate(55, 0);
    dummy.draw(ctx);
    ctx.restore();
  });
}

function getSelectedChars() {
  return {
    p1: CHARACTERS[_sel.p1],
    p2: CHARACTERS[_sel.p2],
  };
}
