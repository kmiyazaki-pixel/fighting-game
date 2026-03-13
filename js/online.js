'use strict';

window.netState = {
  ws: null,
  roomId: null,
  playerId: null,
  connected: false,
  roomState: null,
  serverUrl: null
};

window.netInputs = {
  p1: {},
  p2: {}
};

function netLog(text) {
  const el = document.getElementById('online-status');
  if (el) el.textContent = text;
}

function syncRoomStateToUI(state, players = []) {
  const membersEl = document.getElementById('room-members');
  if (membersEl) {
    membersEl.textContent = `参加中: ${players.length ? players.join(', ') : '-'}`;
  }

  const readyEl = document.getElementById('room-ready-state');
  if (readyEl) {
    readyEl.textContent =
      `P1 ready:${state?.p1Ready ? 'Y' : 'N'} / P2 ready:${state?.p2Ready ? 'Y' : 'N'} / ` +
      `P1 char:${state?.p1Char || '-'} / P2 char:${state?.p2Char || '-'}`;
  }

  const charReadyEl = document.getElementById('char-online-ready-state');
  if (charReadyEl) {
    charReadyEl.textContent =
      `P1 ready:${state?.p1Ready ? 'Y' : 'N'} / P2 ready:${state?.p2Ready ? 'Y' : 'N'} / ` +
      `P1 char:${state?.p1Char || '-'} / P2 char:${state?.p2Char || '-'}`;
  }
}

function getRoomInputValue() {
  const input = document.getElementById('room-id-input');
  return input ? input.value.trim().toUpperCase() : '';
}

function setRoomInputValue(roomId) {
  const input = document.getElementById('room-id-input');
  if (input) input.value = roomId || '';
}

function connectOnline(serverUrl) {
  if (!serverUrl) {
    netLog('接続先URLがありません');
    return;
  }

  if (window.netState.ws && window.netState.ws.readyState === WebSocket.OPEN) {
    netLog('すでに接続済み');
    return;
  }

  window.netState.serverUrl = serverUrl;
  netLog('接続中...');

  const ws = new WebSocket(serverUrl);

  ws.onopen = () => {
    window.netState.ws = ws;
    window.netState.connected = true;
    netLog('接続済み');
  };

  ws.onclose = () => {
    window.netState.connected = false;
    window.netState.ws = null;
    window.netState.roomId = null;
    window.netState.playerId = null;
    window.netState.roomState = null;
    netLog('切断されました');
    syncRoomStateToUI(null, []);
  };

  ws.onerror = () => {
    netLog('接続エラー');
  };

  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }

    if (msg.type === 'hello') {
      netLog('サーバー接続OK');
      return;
    }

    if (msg.type === 'room_joined') {
      window.netState.roomId = msg.roomId;
      window.netState.playerId = msg.playerId;

      const roomEl = document.getElementById('room-id-view');
      if (roomEl) roomEl.textContent = msg.roomId;

      setRoomInputValue(msg.roomId);

      const joinedText = msg.created ? '部屋作成' : '部屋参加';
      netLog(`${joinedText}: ${msg.roomId} / あなたは ${msg.playerId}`);

      if (typeof goCharSelectOnline === 'function') {
        goCharSelectOnline();
      }

      setTimeout(() => {
        sendMyCurrentChar();
      }, 80);

      return;
    }

    if (msg.type === 'room_state') {
      window.netState.roomState = msg.state;
      syncRoomStateToUI(msg.state, msg.players || []);
      return;
    }

    if (msg.type === 'match_start') {
      netLog('対戦開始');
      if (typeof startOnlineMatch === 'function') {
        startOnlineMatch(msg.chars, msg.seed);
      }
      return;
    }

    if (msg.type === 'remote_input') {
      const remoteSide = msg.from;
      if (remoteSide === 'p1' || remoteSide === 'p2') {
        window.netInputs[remoteSide] = { ...(msg.input || {}) };
      }
      return;
    }

    if (msg.type === 'peer_left') {
      netLog(`${msg.playerId} が切断`);
      return;
    }

    if (msg.type === 'error') {
      netLog(`エラー: ${msg.message}`);
      return;
    }
  };
}

function netSend(type, payload = {}) {
  const ws = window.netState.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ type, ...payload }));
  return true;
}

function joinRoom() {
  if (!window.netState.connected) {
    netLog('先に接続してください');
    return;
  }

  const roomId = getRoomInputValue();
  if (!roomId) {
    netLog('ROOM ID を入力してください');
    return;
  }

  netSend('join_or_create_room', { roomId });
}

function joinRoomAndGoCharSelect() {
  joinRoom();
}

function sendSelectedChar(charId) {
  if (!charId) return;
  netSend('select_char', { charId });

  if (window.netState.roomState) {
    const mySide = window.netState.playerId;
    if (mySide === 'p1') window.netState.roomState.p1Ready = false;
    if (mySide === 'p2') window.netState.roomState.p2Ready = false;
    syncRoomStateToUI(window.netState.roomState, ['p1', 'p2']);
  }

  netSend('ready', { ready: false });
}

function sendMyCurrentChar() {
  if (!window.netState.connected) return;
  if (!window.netState.playerId) return;
  if (typeof getSelectedChars !== 'function') return;

  const selected = getSelectedChars();
  const mySide = window.netState.playerId;
  const myChar = selected?.[mySide];

  if (myChar?.id) {
    sendSelectedChar(myChar.id);
    netLog(`キャラ送信: ${myChar.id}`);
  }
}

function sendReady(ready) {
  if (!window.netState.connected) {
    netLog('先に接続してください');
    return;
  }

  sendMyCurrentChar();
  netSend('ready', { ready: !!ready });
}

function readyOnlineFromCharSelect() {
  sendReady(true);
  netLog('準備完了');
}

function unreadyOnlineFromCharSelect() {
  sendReady(false);
  netLog('準備解除');
}

function sendLocalInput(input) {
  if (!window.netState.connected) return;
  if (!window.netState.playerId) return;

  // 相手画面では自分は右側にいるので、左右だけ常に反転して送る
  const out = {
    ...input,
    left: !!input.right,
    right: !!input.left
  };

  netSend('input', { input: out });
}
