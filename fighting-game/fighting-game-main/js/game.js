'use strict';

const GC = document.getElementById('gc');
const gx = GC.getContext('2d');
const FC = document.getElementById('fc');
const fx2 = FC.getContext('2d');

let f1, f2;
let running = false;
let round = 1;
let gtime = GAME.ROUND_TIME;
let _tInt = null;
let _raf = null;

// 'solo' | 'online'
let battleMode = 'solo';
// 'easy' | 'normal' | 'hard'
let cpuDifficulty = 'normal';
// 'random' | 'select'
let cpuSelectMode = 'random';

function hideAllScreens() {
  const ids = ['title', 'solo-menu', 'online-menu', 'charselect', 'result'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function updateSoloDifficultyView() {
  const el = document.getElementById('solo-difficulty-view');
  if (!el) return;

  const label =
    cpuDifficulty === 'easy' ? 'EASY' :
    cpuDifficulty === 'hard' ? 'HARD' : 'NORMAL';

  el.textContent = `現在: ${label}`;
}

function setSoloDifficulty(level) {
  cpuDifficulty = level;
  updateSoloDifficultyView();
}

function updateCpuSelectModeView() {
  const el = document.getElementById('cpu-select-mode-view');
  if (!el) return;

  el.textContent =
    `CPUキャラ: ${cpuSelectMode === 'select' ? 'SELECT' : 'RANDOM'}`;
}

function setCpuSelectMode(mode) {
  cpuSelectMode = mode === 'select' ? 'select' : 'random';
  updateCpuSelectModeView();
}

function initFighters(charP1, charP2) {
  f1 = new Fighter('p1', 130, charP1, false);
  f2 = new Fighter('p2', GAME.W - 210, charP2, true);
}

function startTimer() {
  gtime = GAME.ROUND_TIME;
  updateTimer(gtime);
  clearInterval(_tInt);
  _tInt = setInterval(() => {
    if (!running) return;
    gtime--;
    updateTimer(gtime);
    if (gtime <= 0) endRound(true);
  }, 1000);
}

function endRound(isTimeout = false) {
  running = false;
  clearInterval(_tInt);
  cancelAnimationFrame(_raf);

  let winner = null;

  if (isTimeout) {
    winner = f1.hp > f2.hp ? 'p1' : f2.hp > f1.hp ? 'p2' : null;
    announceText(winner ? 'TIME OVER!' : 'DRAW!', '#ffd700', 9999);
  } else {
    winner = f1.hp <= 0 ? 'p2' : 'p1';
    flashScreen(0.92);
    announceText('K.O.!!', '#ff3300', 9999);

    const loser = winner === 'p1' ? f2 : f1;
    spk(loser.cx, loser.y - GAME.FH * 0.4, '#ff4400', 22, 10, 38, 6);
    spk(loser.cx, loser.y - GAME.FH * 0.4, '#ffaa00', 14, 8, 28, 4);
    ring(loser.cx, loser.y - GAME.FH * 0.4, '#ff8800', 32);
    SFX.ko();
  }

  if (winner) {
    (winner === 'p1' ? f1 : f2).wins++;
  }

  updateAllPips(f1, f2);

  setTimeout(() => {
    if (f1.wins >= GAME.ROUNDS_TO_WIN || f2.wins >= GAME.ROUNDS_TO_WIN) {
      setTimeout(() => _showResult(winner), 900);
    } else {
      round++;
      updateRoundLabel(round);
      setTimeout(() => nextRound(), 2400);
    }
  }, 2000);
}

function nextRound() {
  const ch1 = f1.charDef;
  const ch2 = f2.charDef;

  initFighters(ch1, ch2);

  [f1, f2].forEach(f => {
    updateHP(f.pid, GAME.MAX_HP, GAME.MAX_HP);
    updateGauges(f);
  });

  resetFX();
  announceText(`ROUND ${round}`, '#ffd700', 1200);
  setTimeout(() => announceText('FIGHT!!', '#00ff88', 950), 1300);
  setTimeout(() => {
    running = true;
    startTimer();
    _raf = requestAnimationFrame(_loop);
  }, 2100);
}

function _showResult(winner) {
  showResultScreen(winner, f1, f2);

  const wf = winner === 'p1' ? f1 : f2;
  if (winner) {
    openScoreModal(wf.charDef.id, wf.maxCombo, wf.dmg, wf.wins, null);
  }
}

function _loop() {
  if (!running) return;

  if (battleMode === 'online' && window.netState?.connected && window.netState?.playerId) {
    sendLocalInput(buildLocalNetInput());
  }

  fxTick();
  processInput(f1, f2);

  f1.update(f2);
  f2.update(f1);

  checkHits(f1, f2);
  separateFighters(f1, f2);

  updateGauges(f1);
  updateGauges(f2);

  if (f1.hp <= 0 || f2.hp <= 0) {
    endRound(false);
    return;
  }

  gx.save();
  applyCamShake(gx);
  gx.clearRect(-20, -20, GAME.W + 40, GAME.H + 40);
  drawBG(gx);

  gx.save();
  gx.globalAlpha = 0.12;
  gx.scale(1, -1);
  gx.translate(0, -GAME.FLOOR_Y * 2);
  f1.draw(gx);
  f2.draw(gx);
  gx.globalAlpha = 1;

  const rfg = gx.createLinearGradient(0, -GAME.FLOOR_Y, 0, -GAME.FLOOR_Y + 55);
  rfg.addColorStop(0, 'rgba(15,8,30,0)');
  rfg.addColorStop(1, 'rgba(15,8,30,1)');
  gx.fillStyle = rfg;
  gx.fillRect(0, -GAME.FLOOR_Y, GAME.W, 60);
  gx.restore();

  if (f1.cx < f2.cx) {
    f1.draw(gx);
    f2.draw(gx);
  } else {
    f2.draw(gx);
    f1.draw(gx);
  }

  drawRain(gx);
  gx.restore();

  fx2.clearRect(0, 0, GAME.W, GAME.H);
  drawProjs(fx2);
  drawPts(fx2);
  drawLabels(fx2);
  drawSlowMoVignette(fx2);

  _raf = requestAnimationFrame(_loop);
}

function _startCharSelectLoop() {
  clearInterval(window._charSelLoop);
  window._charSelLoop = setInterval(() => {
    const cs = document.getElementById('charselect');
    if (cs && cs.style.display !== 'none') {
      charSelectInput();
    }
  }, 16);
}

function goTitle() {
  hideAllScreens();
  document.getElementById('title').style.display = 'flex';

  clearInterval(_tInt);
  cancelAnimationFrame(_raf);
  clearInterval(window._charSelLoop);
  running = false;
}

function goSoloMenu() {
  battleMode = 'solo';
  initAudio();
  hideAllScreens();
  document.getElementById('solo-menu').style.display = 'flex';
  updateSoloDifficultyView();
  updateCpuSelectModeView();
}

function goOnlineMenu() {
  battleMode = 'online';
  initAudio();
  hideAllScreens();
  document.getElementById('online-menu').style.display = 'flex';
}

function goCharSelectSolo() {
  battleMode = 'solo';
  initAudio();
  hideAllScreens();
  document.getElementById('charselect').style.display = 'flex';
  buildCharSelectScreen();
  _startCharSelectLoop();
}

function goCharSelectOnline() {
  battleMode = 'online';
  initAudio();
  hideAllScreens();
  document.getElementById('charselect').style.display = 'flex';
  buildCharSelectScreen();
  _startCharSelectLoop();

  setTimeout(() => {
    if (typeof sendMyCurrentChar === 'function') {
      sendMyCurrentChar();
    }
  }, 50);
}

function goCharSelect() {
  goCharSelectSolo();
}

function startGame() {
  clearInterval(window._charSelLoop);

  const selected = getSelectedChars();
  const ch1 = selected.p1;
  let ch2 = selected.p2;

  if (battleMode === 'solo' && cpuSelectMode === 'random') {
    const candidates = CHARACTERS.filter(c => c.id !== ch1.id);
    ch2 = candidates[Math.floor(Math.random() * candidates.length)] || CHARACTERS[1];
  }

  document.getElementById('charselect').style.display = 'none';

  round = 1;
  updateRoundLabel(1);

  initFighters(ch1, ch2);
  buildComboDivs();
  buildP2Pips();
  updateAllPips(f1, f2);
  updatePlayerNames(ch1, ch2);
  buildBG();

  gx.clearRect(0, 0, GAME.W, GAME.H);
  drawBG(gx);
  f1.draw(gx);
  f2.draw(gx);

  announceText(
    battleMode === 'solo'
      ? `CPU ${cpuDifficulty.toUpperCase()}`
      : 'ROUND 1',
    '#ffd700',
    1200
  );
  setTimeout(() => announceText('FIGHT!!', '#00ff88', 950), 1300);
  setTimeout(() => {
    running = true;
    startTimer();
    _raf = requestAnimationFrame(_loop);
  }, 2100);
}

function startOnlineMatch(chars, seed) {
  battleMode = 'online';
  clearInterval(window._charSelLoop);

  const mySide = window.netState?.playerId || 'p1';

  const seatP1Char = CHARACTERS.find(c => c.id === chars.p1) || CHARACTERS[0];
  const seatP2Char = CHARACTERS.find(c => c.id === chars.p2) || CHARACTERS[1];

  // 自分の画面では常に自分を左、相手を右にする
  const myChar = mySide === 'p1' ? seatP1Char : seatP2Char;
  const enemyChar = mySide === 'p1' ? seatP2Char : seatP1Char;

  hideAllScreens();

  round = 1;
  updateRoundLabel(1);

  // f1 = 自分（左）, f2 = 相手（右）
  initFighters(myChar, enemyChar);

  buildComboDivs();
  buildP2Pips();
  updateAllPips(f1, f2);
  updatePlayerNames(myChar, enemyChar);
  buildBG();
  resetFX();

  gx.clearRect(0, 0, GAME.W, GAME.H);
  drawBG(gx);
  f1.draw(gx);
  f2.draw(gx);

  announceText('ONLINE ROUND 1', '#ffd700', 1200);
  setTimeout(() => announceText('FIGHT!!', '#00ff88', 950), 1300);
  setTimeout(() => {
    running = true;
    startTimer();
    _raf = requestAnimationFrame(_loop);
  }, 2100);
}

function rematch() {
  document.getElementById('result').style.display = 'none';

  round = 1;
  updateRoundLabel(1);

  f1.wins = 0;
  f2.wins = 0;
  updateAllPips(f1, f2);

  resetFX();
  clearInterval(_tInt);
  cancelAnimationFrame(_raf);
  running = false;

  if (battleMode === 'online' && window.netState?.connected && window.netState?.playerId) {
    goOnlineMenu();
    return;
  }

  nextRound();
}

window.addEventListener('load', () => {
  buildBG();

  const ch1 = CHARACTERS[0];
  const ch2 = CHARACTERS[1];

  f1 = new Fighter('p1', 130, ch1, false);
  f2 = new Fighter('p2', GAME.W - 210, ch2, true);

  gx.clearRect(0, 0, GAME.W, GAME.H);
  drawBG(gx);
  f1.draw(gx);
  f2.draw(gx);

  updateSoloDifficultyView();
  updateCpuSelectModeView();

  document.getElementById('title').style.display = 'flex';
  document.getElementById('solo-menu').style.display = 'none';
  document.getElementById('online-menu').style.display = 'none';
  document.getElementById('charselect').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('ranking-modal').style.display = 'none';
  document.getElementById('score-modal').style.display = 'none';

  clearInterval(window._charSelLoop);
  clearInterval(_tInt);
  cancelAnimationFrame(_raf);
  running = false;
});
