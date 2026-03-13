'use strict';

const K = {};

document.addEventListener('keydown', e => {
  K[e.key] = 1;
  K[e.code] = 1;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', e => {
  delete K[e.key];
  delete K[e.code];
});

const ky = (...keys) => keys.some(k => K[k]);

const KEYBINDS = {
  p1: {
    left:   ['a', 'A', 'KeyA'],
    right:  ['d', 'D', 'KeyD'],
    jump:   ['w', 'W', 'KeyW'],
    guard:  ['h', 'H', 'KeyH'],
    weak:   ['f', 'F', 'KeyF'],
    heavy:  ['g', 'G', 'KeyG'],
    hado:   ['r', 'R', 'KeyR'],
    shoryu: ['t', 'T', 'KeyT']
  },
  p2: {
    left:   ['ArrowLeft'],
    right:  ['ArrowRight'],
    jump:   ['ArrowUp'],
    guard:  ['/'],
    weak:   [','],
    heavy:  ['.'],
    hado:   ['m', 'M', 'KeyM'],
    shoryu: ['n', 'N', 'KeyN']
  }
};

const _lk = {
  p1: {},
  p2: {}
};

const _cpuState = {
  nextDecisionAt: 0,
  move: 0,
  jump: false,
  guard: false,
  weak: false,
  heavy: false,
  hado: false,
  shoryu: false,
  lastAction: 'idle',
  repeatCount: 0
};

function _pressed(bindings, action) {
  return ky(...(bindings[action] || []));
}

function _buildOfflineInput(pid) {
  const b = KEYBINDS[pid];
  return {
    left:   _pressed(b, 'left'),
    right:  _pressed(b, 'right'),
    jump:   _pressed(b, 'jump'),
    guard:  _pressed(b, 'guard'),
    weak:   _pressed(b, 'weak'),
    heavy:  _pressed(b, 'heavy'),
    hado:   _pressed(b, 'hado'),
    shoryu: _pressed(b, 'shoryu')
  };
}

function buildLocalNetInput() {
  const mySide = window.netState?.playerId || 'p1';
  const b = KEYBINDS[mySide];

  return {
    left:   _pressed(b, 'left'),
    right:  _pressed(b, 'right'),
    jump:   _pressed(b, 'jump'),
    guard:  _pressed(b, 'guard'),
    weak:   _pressed(b, 'weak'),
    heavy:  _pressed(b, 'heavy'),
    hado:   _pressed(b, 'hado'),
    shoryu: _pressed(b, 'shoryu')
  };
}

function _getOnlineInputs() {
  const mySide = window.netState?.playerId;
  const local = buildLocalNetInput();
  const remoteP1 = window.netInputs?.p1 || {};
  const remoteP2 = window.netInputs?.p2 || {};

  // ローカル画面では常に
  // p1 = 自分（左）
  // p2 = 相手（右）
  if (mySide === 'p1') {
    return {
      p1: local,
      p2: {
        left:   !!remoteP2.left,
        right:  !!remoteP2.right,
        jump:   !!remoteP2.jump,
        guard:  !!remoteP2.guard,
        weak:   !!remoteP2.weak,
        heavy:  !!remoteP2.heavy,
        hado:   !!remoteP2.hado,
        shoryu: !!remoteP2.shoryu
      }
    };
  }

  if (mySide === 'p2') {
    return {
      p1: local,
      p2: {
        left:   !!remoteP1.left,
        right:  !!remoteP1.right,
        jump:   !!remoteP1.jump,
        guard:  !!remoteP1.guard,
        weak:   !!remoteP1.weak,
        heavy:  !!remoteP1.heavy,
        hado:   !!remoteP1.hado,
        shoryu: !!remoteP1.shoryu
      }
    };
  }

  return {
    p1: _buildOfflineInput('p1'),
    p2: _buildOfflineInput('p2')
  };
}

function _cpuParams() {
  const level = typeof cpuDifficulty !== 'undefined' ? cpuDifficulty : 'normal';

  if (level === 'easy') {
    return {
      thinkMin: 220,
      thinkMax: 420,
      hadoFar: 0.08,
      hadoMid: 0.10,
      walkMid: 0.48,
      guardClose: 0.12,
      weakClose: 0.24,
      heavyClose: 0.08,
      jumpAny: 0.04,
      antiAir: 0.10,
      retreatClose: 0.05,
      punishClose: 0.10
    };
  }

  if (level === 'hard') {
    return {
      thinkMin: 80,
      thinkMax: 160,
      hadoFar: 0.24,
      hadoMid: 0.26,
      walkMid: 0.82,
      guardClose: 0.40,
      weakClose: 0.58,
      heavyClose: 0.30,
      jumpAny: 0.08,
      antiAir: 0.55,
      retreatClose: 0.16,
      punishClose: 0.32
    };
  }

  return {
    thinkMin: 120,
    thinkMax: 220,
    hadoFar: 0.16,
    hadoMid: 0.18,
    walkMid: 0.66,
    guardClose: 0.24,
    weakClose: 0.42,
    heavyClose: 0.20,
    jumpAny: 0.06,
    antiAir: 0.34,
    retreatClose: 0.10,
    punishClose: 0.18
  };
}

function _cpuCharBias(cpu) {
  const id = cpu?.charDef?.id || 'ryu_x';

  switch (id) {
    case 'kai_z':
      return {
        thinkScale: 0.9,
        hadoFarMul: 0.7,
        hadoMidMul: 0.8,
        walkMidMul: 1.2,
        guardCloseMul: 0.85,
        weakCloseMul: 1.2,
        heavyCloseMul: 0.8,
        jumpAnyMul: 1.35,
        antiAirMul: 0.9,
        retreatCloseMul: 0.9,
        punishCloseMul: 1.1
      };
    case 'gou_rai':
      return {
        thinkScale: 1.1,
        hadoFarMul: 0.8,
        hadoMidMul: 0.9,
        walkMidMul: 0.85,
        guardCloseMul: 1.25,
        weakCloseMul: 0.9,
        heavyCloseMul: 1.35,
        jumpAnyMul: 0.7,
        antiAirMul: 1.1,
        retreatCloseMul: 0.75,
        punishCloseMul: 1.15
      };
    case 'velt_9':
      return {
        thinkScale: 0.82,
        hadoFarMul: 0.75,
        hadoMidMul: 0.85,
        walkMidMul: 1.3,
        guardCloseMul: 0.9,
        weakCloseMul: 1.25,
        heavyCloseMul: 0.8,
        jumpAnyMul: 1.45,
        antiAirMul: 0.95,
        retreatCloseMul: 1.1,
        punishCloseMul: 1.0
      };
    case 'titan_0':
      return {
        thinkScale: 1.18,
        hadoFarMul: 0.65,
        hadoMidMul: 0.75,
        walkMidMul: 0.78,
        guardCloseMul: 1.3,
        weakCloseMul: 0.85,
        heavyCloseMul: 1.5,
        jumpAnyMul: 0.55,
        antiAirMul: 1.2,
        retreatCloseMul: 0.55,
        punishCloseMul: 1.2
      };
    default:
      return {
        thinkScale: 1.0,
        hadoFarMul: 1.0,
        hadoMidMul: 1.0,
        walkMidMul: 1.0,
        guardCloseMul: 1.0,
        weakCloseMul: 1.0,
        heavyCloseMul: 1.0,
        jumpAnyMul: 1.0,
        antiAirMul: 1.0,
        retreatCloseMul: 1.0,
        punishCloseMul: 1.0
      };
  }
}

function _cpuPenalty(action) {
  if (_cpuState.lastAction !== action) return 1;
  return Math.max(0.35, 1 - _cpuState.repeatCount * 0.22);
}

function _cpuTry(action, chance) {
  return Math.random() < chance * _cpuPenalty(action);
}

function _cpuCommit(action) {
  if (_cpuState.lastAction === action) {
    _cpuState.repeatCount += 1;
  } else {
    _cpuState.lastAction = action;
    _cpuState.repeatCount = 1;
  }
}

function _cpuClearIntent() {
  _cpuState.move = 0;
  _cpuState.jump = false;
  _cpuState.guard = false;
  _cpuState.weak = false;
  _cpuState.heavy = false;
  _cpuState.hado = false;
  _cpuState.shoryu = false;
}

function _buildCpuInput(cpu, enemy, now) {
  const dist = Math.abs(cpu.cx - enemy.cx);
  const enemyAir = !enemy.onG;
  const cpuLowHp = cpu.hp < GAME.MAX_HP * 0.35;
  const enemyBusy = ['attack', 'super', 'hurt'].includes(enemy.st);
  const enemyGuarding = !!enemy.grd;
  const P = _cpuParams();
  const B = _cpuCharBias(cpu);

  const thinkMin = P.thinkMin * B.thinkScale;
  const thinkMax = P.thinkMax * B.thinkScale;

  if (now >= _cpuState.nextDecisionAt) {
    _cpuState.nextDecisionAt = now + thinkMin + Math.random() * (thinkMax - thinkMin);
    _cpuClearIntent();

    let decidedAction = 'idle';

    if (enemyAir && dist < 120 && _cpuTry('shoryu', P.antiAir * B.antiAirMul)) {
      _cpuState.shoryu = true;
      decidedAction = 'shoryu';
    } else if (dist > 220) {
      _cpuState.move = cpu.cx < enemy.cx ? 1 : -1;
      decidedAction = 'walk';

      if (_cpuTry('hado', P.hadoFar * B.hadoFarMul)) {
        _cpuState.hado = true;
        _cpuState.move = 0;
        decidedAction = 'hado';
      }
    } else if (dist > 110) {
      if (_cpuTry('walk', P.walkMid * B.walkMidMul)) {
        _cpuState.move = cpu.cx < enemy.cx ? 1 : -1;
        decidedAction = 'walk';
      }

      if (_cpuTry('hado', P.hadoMid * B.hadoMidMul)) {
        _cpuState.hado = true;
        _cpuState.move = 0;
        decidedAction = 'hado';
      }

      if (_cpuTry('jump', (P.jumpAny * 0.7) * B.jumpAnyMul)) {
        _cpuState.jump = true;
        decidedAction = 'jump';
      }
    } else {
      if (_cpuTry('guard', P.guardClose * B.guardCloseMul)) {
        _cpuState.guard = true;
        decidedAction = 'guard';
      }

      if (enemyBusy && _cpuTry('heavy', P.punishClose * B.punishCloseMul)) {
        _cpuState.heavy = true;
        decidedAction = 'heavy';
      } else {
        if (enemyGuarding) {
          if (_cpuTry('heavy', (P.heavyClose * 0.55) * B.heavyCloseMul)) {
            _cpuState.heavy = true;
            decidedAction = 'heavy';
          } else if (_cpuTry('weak', (P.weakClose * 0.7) * B.weakCloseMul)) {
            _cpuState.weak = true;
            decidedAction = 'weak';
          }
        } else {
          if (_cpuTry('weak', P.weakClose * B.weakCloseMul)) {
            _cpuState.weak = true;
            decidedAction = 'weak';
          }
          if (!_cpuState.weak && _cpuTry('heavy', P.heavyClose * B.heavyCloseMul)) {
            _cpuState.heavy = true;
            decidedAction = 'heavy';
          }
        }
      }

      if (!_cpuState.weak && !_cpuState.heavy && _cpuTry('retreat', P.retreatClose * B.retreatCloseMul)) {
        _cpuState.move = cpu.cx < enemy.cx ? -1 : 1;
        decidedAction = 'retreat';
      }
    }

    if (cpuLowHp && dist < 130 && _cpuTry('guard', (P.guardClose + 0.12) * B.guardCloseMul)) {
      _cpuState.guard = true;
      _cpuState.weak = false;
      _cpuState.heavy = false;
      _cpuState.hado = false;
      _cpuState.shoryu = false;
      decidedAction = 'guard';
    }

    if (
      !_cpuState.hado &&
      !_cpuState.shoryu &&
      !_cpuState.weak &&
      !_cpuState.heavy &&
      !_cpuState.guard &&
      _cpuTry('jump', P.jumpAny * B.jumpAnyMul)
    ) {
      _cpuState.jump = true;
      decidedAction = 'jump';
    }

    _cpuCommit(decidedAction);
  }

  return {
    left: _cpuState.move < 0,
    right: _cpuState.move > 0,
    jump: _cpuState.jump,
    guard: _cpuState.guard,
    weak: _cpuState.weak,
    heavy: _cpuState.heavy,
    hado: _cpuState.hado,
    shoryu: _cpuState.shoryu
  };
}

function processInput(f1, f2) {
  const now = Date.now();
  let inputs;

  if (typeof battleMode !== 'undefined' && battleMode === 'online' && window.netState?.connected && window.netState?.playerId) {
    inputs = _getOnlineInputs();
  } else if (typeof battleMode !== 'undefined' && battleMode === 'solo') {
    inputs = {
      p1: _buildOfflineInput('p1'),
      p2: _buildCpuInput(f2, f1, now)
    };
  } else {
    inputs = {
      p1: _buildOfflineInput('p1'),
      p2: _buildOfflineInput('p2')
    };
  }

  _processPlayer(f1, 'p1', now, inputs.p1);
  _processPlayer(f2, 'p2', now, inputs.p2);
}

function _processPlayer(f, pid, now, input) {
  const lk = _lk[pid];
  const free = !['hurt', 'super', 'knocked', 'attack'].includes(f.st);

  if (free) {
    if (input.left) f.move(-5.5);
    if (input.right) f.move(5.5);
  }

  if (input.jump && !lk.jumpHeld) {
    f.jump();
    lk.jumpHeld = 1;
  }
  if (!input.jump) {
    delete lk.jumpHeld;
  }

  f.grd = input.guard && f.onG && !['attack', 'hurt'].includes(f.st);

  if (!f.grd) {
    if (input.weak && input.heavy && now - (lk.ca || 0) > 500) {
      if (f.ca_move()) lk.ca = now;
    } else if (input.shoryu && now - (lk.sh || 0) > 600) {
      if (f.shoryu()) lk.sh = now;
    } else if (input.hado && now - (lk.hd || 0) > 620) {
      if (f.hadoken()) lk.hd = now;
    } else if (input.heavy && now - (lk.hy || 0) > 370) {
      if (f.attack('heavy')) lk.hy = now;
    } else if (input.weak && now - (lk.wk || 0) > 210) {
      if (f.attack('weak')) lk.wk = now;
    }
  }
}
