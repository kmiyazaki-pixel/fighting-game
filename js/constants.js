// ═══════════════════════════════════════════
//  constants.js
//  ゲーム全体で使う定数・設定値・キャラクター定義
//  ここを編集するとゲームバランス・キャラが変わる
// ═══════════════════════════════════════════
'use strict';

// ── ゲーム基本設定 ───────────────────────────
const GAME = {
  W: 900, H: 506,
  FLOOR_Y: Math.floor(506 * 0.78),
  GRAV: 0.64,
  MAX_HP: 220,
  MAX_EX: 100,
  MAX_CA: 100,
  FW: 80,
  FH: 112,
  ROUND_TIME: 99,
  ROUNDS_TO_WIN: 3,
};

// ── 通常技フレームデータ ─────────────────────
//  dmg: ダメージ, dur: モーション全体フレーム
//  cd:  クールダウン, ex: EXゲージ増加
//  kbx/kby: ノックバックX/Y
//  ht:  ヒットストップフレーム
const ATTACK_DATA = {
  weak:  { w:63, h:50, dmg:9,  dur:14, cd:16, ex:4,  kbx:4,  kby:0,  ht:9  },
  heavy: { w:84, h:66, dmg:24, dur:22, cd:27, ex:11, kbx:16, kby:-4, ht:19 },
};

// ── キャラクターカラーパレット ────────────────
//  新キャラ追加時はここにパレットを追加する
const PALETTES = {
  ryu_x: {
    sk:'#ce8e68', skH:'#ffbbaa',
    fL:'#e2a27e', fM:'#bc7450', fD:'#985238',
    bL:'#eae6d2', bM:'#cec8a4', bD:'#b2ac85', bDet:'#989270',
    pants:'#eceeda', boots:'#7a5c10', belt:'#3c2806',
    hb:'#cc2200', hair:'#181820', eye:'#3a2818',
  },
  kai_z: {
    sk:'#be7640', skH:'#ffaa88',
    fL:'#ce8850', fM:'#aa6830', fD:'#884e28',
    bL:'#1c3c98', bM:'#132c7c', bD:'#0c1c56', bDet:'#0022aa',
    pants:'#0a0a1a', boots:'#181830', belt:'#1e2e9e',
    hb:'#ffaa00', hair:'#080808', eye:'#223288',
  },
    gou_rai: {
    sk:'#b97a58', skH:'#eab79b',
    fL:'#d8d8d8', fM:'#b8b8b8', fD:'#8c8c8c',
    bL:'#3a3a3a', bM:'#232323', bD:'#101010', bDet:'#ffd200',
    pants:'#1a1a1a', boots:'#5a1200', belt:'#a81c00',
    hb:'#ffd200', hair:'#101010', eye:'#ffcc00',
  },
    velt_9: {
    sk:'#c9906a', skH:'#f2c0a2',
    fL:'#1fd6c8', fM:'#12a99d', fD:'#0a6c68',
    bL:'#e9f7ff', bM:'#c7e0f0', bD:'#8ea8bb', bDet:'#7cf7ff',
    pants:'#0d1b2a', boots:'#09111a', belt:'#14b8a6',
    hb:'#66fff2', hair:'#d8ffff', eye:'#00ffee',
  },
  titan_0: {
    sk:'#8b5e3c', skH:'#c28a64',
    fL:'#7a1f1f', fM:'#561313', fD:'#2d0808',
    bL:'#5f5f68', bM:'#3b3b44', bD:'#181820', bDet:'#ff3b3b',
    pants:'#202028', boots:'#101014', belt:'#8f1111',
    hb:'#ff5522', hair:'#0b0b0f', eye:'#ff4422',
  },
  // ── 新キャラパレット追加例 ──
  // nova: {
  //   sk:'#b8d0e8', skH:'#ddeeff',
  //   fL:'#c8e0f0', fM:'#90b8d8', fD:'#6090b0', bDet:'#80b0d0',
  //   bL:'#1a1a2e', bM:'#16213e', bD:'#0f3460', pants:'#0f3460',
  //   boots:'#533483', belt:'#e94560', hb:'#00b4d8', hair:'#c0c0ff', eye:'#00ffff',
  // },
};

// ── キャラクター定義 ─────────────────────────
//  id:       内部ID（ランキング・保存に使用）
//  name:     表示名
//  rank:     ランク称号
//  palette:  PALETTESのキー
//  bio:      キャラ選択画面の説明文
//  stats:    能力値 (0.0〜2.0, 1.0 が基準)
//    speed:    移動速度倍率
//    power:    ダメージ倍率
//    defense:  被ダメ軽減倍率 (高いほど硬い)
//    jumpPow:  ジャンプ力倍率
//  specials: 技の上書き（省略可 → デフォルト技）
//    hadokenColor: 波動拳の色
//    shoryuColor:  昇龍拳エフェクト色
//    caName:       CA必殺技の名前
const CHARACTERS = [
  {
    id: 'ryu_x',
    name: 'RYU-X',
    rank: 'MASTER',
    palette: 'ryu_x',
    bio: 'オールラウンダー。波動拳・昇龍拳を軸に立ち回るバランス型。',
    stats: { speed:1.0, power:1.0, defense:1.0, jumpPow:1.0 },
    specials: {
      hadokenColor: '#4488ff',
      shoryuColor:  '#ff8800',
      caName: '真・波動拳',
    },
    moves: {
      weak:   { w:63, h:50, dmg:9,  dur:14, cd:16, ex:4,  kbx:4,  kby:0,  ht:9  },
      heavy:  { w:84, h:66, dmg:24, dur:22, cd:27, ex:11, kbx:16, kby:-4, ht:19 },
      hadoken:{ dmg:29, speed:11, w:58, h:33, cd:50, ex:13, kbx:19, kby:-5, ht:21 },
      shoryu: { dmg:30, w:52, h:125, cd:55, ex:13, kbx:7,  kby:-15, ht:24 }
    }
  },
  {
    id: 'kai_z',
    name: 'KAI-Z',
    rank: 'DIAMOND',
    palette: 'kai_z',
    bio: 'スピード型。移動速度が高く、コンボを繋げやすい。波動拳は弱め。',
    stats: { speed:1.25, power:0.88, defense:0.92, jumpPow:1.1 },
    specials: {
      hadokenColor: '#ff6600',
      shoryuColor:  '#ffcc00',
      caName: '烈・爆炎拳',
    },
    moves: {
      weak:   { w:66, h:48, dmg:8,  dur:12, cd:13, ex:4,  kbx:4,  kby:0,  ht:8  },
      heavy:  { w:78, h:60, dmg:21, dur:19, cd:22, ex:10, kbx:13, kby:-3, ht:16 },
      hadoken:{ dmg:24, speed:13.5, w:52, h:28, cd:42, ex:11, kbx:15, kby:-4, ht:18 },
      shoryu: { dmg:26, w:48, h:118, cd:48, ex:12, kbx:6,  kby:-16, ht:20 }
    }
  },
  {
    id: 'gou_rai',
    name: 'GOU-RAI',
    rank: 'OVERLORD',
    palette: 'gou_rai',
    bio: '重量級。機動力は低いが、一撃の火力と耐久に優れるパワータイプ。',
    stats: { speed:0.86, power:1.28, defense:1.16, jumpPow:0.9 },
    specials: {
      hadokenColor: '#ffcc00',
      shoryuColor:  '#ff3300',
      caName: '轟・雷砕拳',
    },
    moves: {
      weak:   { w:68, h:52, dmg:12, dur:16, cd:18, ex:5,  kbx:6,  kby:0,  ht:10 },
      heavy:  { w:96, h:74, dmg:31, dur:26, cd:31, ex:13, kbx:20, kby:-5, ht:22 },
      hadoken:{ dmg:32, speed:10, w:68, h:36, cd:54, ex:14, kbx:21, kby:-5, ht:22 },
      shoryu: { dmg:36, w:60, h:132, cd:60, ex:14, kbx:9,  kby:-15, ht:26 }
    }
  },
  {
    id: 'velt_9',
    name: 'VELT-9',
    rank: 'PHANTOM',
    palette: 'velt_9',
    bio: '高機動のテクニカル型。移動とジャンプに優れ、手数で崩す。',
    stats: { speed:1.18, power:0.96, defense:0.97, jumpPow:1.18 },
    specials: {
      hadokenColor: '#66fff2',
      shoryuColor:  '#00d0ff',
      caName: 'ゼロ・スプリット',
    },
    moves: {
      weak:   { w:70, h:46, dmg:9,  dur:11, cd:12, ex:4,  kbx:3,  kby:0,  ht:8  },
      heavy:  { w:76, h:56, dmg:20, dur:18, cd:20, ex:10, kbx:11, kby:-3, ht:15 },
      hadoken:{ dmg:23, speed:14, w:50, h:26, cd:40, ex:11, kbx:14, kby:-4, ht:17 },
      shoryu: { dmg:24, w:46, h:116, cd:46, ex:11, kbx:6,  kby:-17, ht:19 }
    }
  },
  {
    id: 'titan_0',
    name: 'TITAN-0',
    rank: 'COLOSSUS',
    palette: 'titan_0',
    bio: '超重量級。動きは鈍いが、圧倒的火力と装甲を持つ。',
    stats: { speed:0.78, power:1.42, defense:1.22, jumpPow:0.82 },
    specials: {
      hadokenColor: '#ff5522',
      shoryuColor:  '#ff2222',
      caName: 'ギガ・ブレイク',
    },
    moves: {
      weak:   { w:72, h:54, dmg:13, dur:17, cd:20, ex:5,  kbx:6,  kby:0,  ht:10 },
      heavy:  { w:104,h:78, dmg:36, dur:28, cd:34, ex:15, kbx:24, kby:-6, ht:24 },
      hadoken:{ dmg:35, speed:9,  w:74, h:40, cd:58, ex:15, kbx:24, kby:-5, ht:24 },
      shoryu: { dmg:40, w:64, h:138, cd:64, ex:15, kbx:10, kby:-14,ht:28 }
    }
  }
];
  // ── 新キャラ追加例 ──
  // {
  //   id: 'nova',
  //   name: 'NOVA',
  //   rank: 'LEGEND',
  //   palette: 'nova',
  //   bio: 'パワー型。動作は遅いが一撃が重い。昇龍拳は極めて強力。',
  //   stats: { speed:0.82, power:1.35, defense:1.18, jumpPow:0.9 },
  //   specials: {
  //     hadokenColor: '#cc00ff',
  //     shoryuColor:  '#ffffff',
  //     caName: '滅・震天拳',
  //   },
  // },

