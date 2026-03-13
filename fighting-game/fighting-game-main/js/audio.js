// ═══════════════════════════════════════════
//  audio.js
//  Web Audio API サウンドシステム
//  新しいSEを追加したいときは SFX に関数を追加する
// ═══════════════════════════════════════════
'use strict';

let _AC = null;

function initAudio() {
  if (!_AC) {
    try { _AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) {}
  }
}

function _beep(freq=200, type='sawtooth', dur=0.06, vol=0.15) {
  if (!_AC) return;
  try {
    const osc = _AC.createOscillator();
    const gain = _AC.createGain();
    osc.connect(gain); gain.connect(_AC.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, _AC.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq*0.3, _AC.currentTime+dur);
    gain.gain.setValueAtTime(vol, _AC.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _AC.currentTime+dur);
    osc.start(); osc.stop(_AC.currentTime+dur);
  } catch(e) {}
}

// ── SE 一覧 ─────────────────────────────────
const SFX = {
  hitWeak()   { _beep(210,'sawtooth',0.05,0.14); },
  hitHeavy()  { _beep(130,'sawtooth',0.09,0.20); },
  guard()     { _beep(700,'square',  0.04,0.10); },
  hadoken()   { _beep(300,'sawtooth',0.11,0.18); },
  shoryu()    { _beep(240,'square',  0.14,0.22); },
  ko()        { _beep(80, 'sawtooth',0.28,0.32); },
  clash()     { _beep(500,'square',  0.05,0.12); },
  projHit()   { _beep(220,'square',  0.10,0.22); },
  super_() {
    [0,80,180].forEach(d=>setTimeout(()=>{
      _beep(440,'square',0.12,0.25);
      setTimeout(()=>_beep(880,'sawtooth',0.16,0.28),35);
    },d));
  },
};
