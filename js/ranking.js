'use strict';

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

const sb =
  window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function getCharacterName(charId) {
  return CHARACTERS.find(c => c.id === charId)?.name || charId;
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function saveMatchResult({ winner, f1, f2 }) {
  if (!sb || !winner || !f1 || !f2) return;

  if (battleMode === 'online' && window.netState?.playerId !== 'p1') return;

  const matchId = crypto.randomUUID();

  const rows = [
    {
      match_id: matchId,
      battle_mode: battleMode || 'solo',
      player_slot: 'p1',
      character_id: f1.charDef.id,
      is_win: winner === 'p1'
    },
    {
      match_id: matchId,
      battle_mode: battleMode || 'solo',
      player_slot: 'p2',
      character_id: f2.charDef.id,
      is_win: winner === 'p2'
    }
  ];

  const { error } = await sb.from('battle_results').insert(rows);

  if (error) {
    console.error('saveMatchResult error:', error);
  }
}

async function loadCharacterRanking() {
  const base = CHARACTERS.map(ch => ({
    character_id: ch.id,
    character_name: ch.name,
    use_count: 0,
    win_count: 0,
    lose_count: 0,
    win_rate: 0
  }));

  if (!sb) return base;

  const { data, error } = await sb
    .from('battle_results')
    .select('character_id, is_win');

  if (error) throw error;

  const stats = new Map(base.map(row => [row.character_id, row]));

  for (const row of data || []) {
    const item = stats.get(row.character_id);
    if (!item) continue;

    item.use_count += 1;
    if (row.is_win) {
      item.win_count += 1;
    } else {
      item.lose_count += 1;
    }
  }

  return [...stats.values()]
    .map(item => ({
      ...item,
      win_rate: item.use_count
        ? Number(((item.win_count / item.use_count) * 100).toFixed(1))
        : 0
    }))
    .sort((a, b) =>
      b.use_count - a.use_count ||
      b.win_rate - a.win_rate ||
      a.character_name.localeCompare(b.character_name)
    );
}

function buildRankingHTML(ranking) {
  const rows = ranking.slice(0, 5).map((r, i) => {
    const medal =
      i === 0 ? '🥇' :
      i === 1 ? '🥈' :
      i === 2 ? '🥉' :
      `${i + 1}.`;

    return `
      <tr class="${i < 3 ? 'top' : ''}">
        <td class="rank">${medal}</td>
        <td class="char-r">${escapeHtml(r.character_name)}</td>
        <td class="combo">${r.use_count}</td>
        <td class="wins-r">${r.win_count}</td>
        <td class="dmg">${r.lose_count}</td>
        <td class="date-r">${r.win_rate}%</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="rank-table">
      <thead>
        <tr>
          <th>#</th>
          <th>CHARACTER</th>
          <th>USE</th>
          <th>WIN</th>
          <th>LOSE</th>
          <th>WIN RATE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function openRankingModal() {
  const modal = document.getElementById('ranking-modal');
  const body = document.getElementById('ranking-body');
  const title = document.querySelector('#ranking-modal .modal-title');

  if (title) title.textContent = '🏆 CHARACTER RANKING';

  modal.style.display = 'flex';
  body.innerHTML = '<div style="color:#888;text-align:center;padding:30px">読み込み中...</div>';

  if (!sb) {
    body.innerHTML = '<div style="color:#f66;text-align:center;padding:30px">Supabase設定がありません</div>';
    return;
  }

  try {
    const ranking = await loadCharacterRanking();
    body.innerHTML = buildRankingHTML(ranking);
  } catch (e) {
    console.error(e);
    body.innerHTML = '<div style="color:#f66;text-align:center;padding:30px">ランキング取得に失敗しました</div>';
  }
}

function closeRankingModal() {
  document.getElementById('ranking-modal').style.display = 'none';
}

function openScoreModal() {
  const modal = document.getElementById('score-modal');
  if (modal) modal.style.display = 'none';
}
