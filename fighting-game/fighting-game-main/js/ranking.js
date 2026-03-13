// ═══════════════════════════════════════════
//  ranking.js
//  ランキングシステム
//  window.storage が使える環境ではそれを使い、
//  使えない通常ブラウザでは localStorage に保存する
// ═══════════════════════════════════════════
'use strict';

const RANKING_KEY   = 'ironfist:ranking';
const RANKING_LIMIT = 20;   // 保存するスコア数の上限

const rankingStore = {
  async get(key) {
    if (typeof window.storage !== 'undefined' && window.storage?.get) {
      const res = await window.storage.get(key, true);
      return res ? res.value : null;
    }
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    if (typeof window.storage !== 'undefined' && window.storage?.set) {
      await window.storage.set(key, value, true);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
};

// ── スコアデータ構造 ─────────────────────────
// {
//   name:     string   プレイヤー名
//   charId:   string   使用キャラID
//   maxCombo: number   最高コンボ数
//   totalDmg: number   総ダメージ
//   wins:     number   勝利数
//   date:     string   ISO日時
// }

// ── 読み込み ─────────────────────────────────
async function loadRanking() {
  try {
    const raw = await rankingStore.get(RANKING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// ── 保存（スコア追加） ────────────────────────
async function saveScore(entry) {
  let scores = await loadRanking();
  scores.push({ ...entry, date: new Date().toISOString() });

  // 最高コンボ数→総ダメージ→日時の順でソート
  scores.sort((a, b) => b.maxCombo - a.maxCombo || b.totalDmg - a.totalDmg);
  scores = scores.slice(0, RANKING_LIMIT);

  try {
    await rankingStore.set(RANKING_KEY, JSON.stringify(scores));
  } catch (e) {}

  return scores;
}

// ── ランキング画面の HTML を生成 ───────────────
function buildRankingHTML(scores) {
  if (!scores.length) {
    return '<div style="color:#555;text-align:center;padding:20px">まだスコアがありません</div>';
  }

  const rows = scores.map((s, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const char  = CHARACTERS.find(c => c.id === s.charId);
    const cname = char ? char.name : s.charId;
    const date  = new Date(s.date).toLocaleDateString('ja-JP');

    return `
      <tr class="${i < 3 ? 'top' : ''}">
        <td class="rank">${medal}</td>
        <td class="pname-r">${s.name || '???'}</td>
        <td class="char-r">${cname}</td>
        <td class="combo">${s.maxCombo}</td>
        <td class="dmg">${s.totalDmg}</td>
        <td class="wins-r">${s.wins}W</td>
        <td class="date-r">${date}</td>
      </tr>`;
  }).join('');

  return `
    <table class="rank-table">
      <thead>
        <tr>
          <th>#</th><th>NAME</th><th>CHAR</th>
          <th>MAX COMBO</th><th>DAMAGE</th><th>WINS</th><th>DATE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── ランキングモーダルを開く ────────────────
async function openRankingModal() {
  const modal = document.getElementById('ranking-modal');
  const body  = document.getElementById('ranking-body');

  body.innerHTML = '<div style="color:#888;text-align:center;padding:30px">読み込み中...</div>';
  modal.style.display = 'flex';

  const scores = await loadRanking();
  body.innerHTML = buildRankingHTML(scores);
}

function closeRankingModal() {
  document.getElementById('ranking-modal').style.display = 'none';
}

// ── スコア入力モーダルを開く ─────────────────
function openScoreModal(charId, maxCombo, totalDmg, wins, onSave) {
  const modal = document.getElementById('score-modal');
  const input = document.getElementById('score-name-input');

  input.value = '';
  modal.style.display = 'flex';

  document.getElementById('score-save-btn').onclick = async () => {
    const name = input.value.trim() || 'FIGHTER';
    modal.style.display = 'none';
    await saveScore({ name, charId, maxCombo, totalDmg, wins });
    openRankingModal();
  };

  document.getElementById('score-skip-btn').onclick = () => {
    modal.style.display = 'none';
    if (onSave) onSave(false);
  };
}