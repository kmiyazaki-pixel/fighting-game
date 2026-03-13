import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();
// rooms: Map<roomId, { players: Map<playerId, ws>, state: { p1Ready, p2Ready, p1Char, p2Char } }>

function send(ws, type, payload = {}) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function broadcast(room, type, payload = {}) {
  for (const [, sock] of room.players) {
    send(sock, type, payload);
  }
}

function randomRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function normalizeRoomId(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

function createEmptyRoom() {
  return {
    players: new Map(),
    state: {
      p1Ready: false,
      p2Ready: false,
      p1Char: null,
      p2Char: null
    }
  };
}

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, createEmptyRoom());
  }
  return rooms.get(roomId);
}

function getSeat(room) {
  const taken = [...room.players.keys()];
  if (!taken.includes('p1')) return 'p1';
  if (!taken.includes('p2')) return 'p2';
  return null;
}

function leaveCurrentRoom(ws) {
  const { roomId, playerId } = ws.meta || {};
  if (!roomId || !playerId) return;

  const room = rooms.get(roomId);
  if (!room) {
    ws.meta.roomId = null;
    ws.meta.playerId = null;
    return;
  }

  room.players.delete(playerId);

  if (playerId === 'p1') {
    room.state.p1Ready = false;
    room.state.p1Char = null;
  }
  if (playerId === 'p2') {
    room.state.p2Ready = false;
    room.state.p2Char = null;
  }

  ws.meta.roomId = null;
  ws.meta.playerId = null;

  if (room.players.size === 0) {
    rooms.delete(roomId);
    return;
  }

  broadcast(room, 'peer_left', { playerId });
  broadcast(room, 'room_state', {
    roomId,
    players: [...room.players.keys()],
    state: room.state
  });
}

function joinOrCreateRoom(ws, requestedRoomId) {
  let roomId = normalizeRoomId(requestedRoomId);

  if (!roomId) {
    roomId = randomRoomId();
    while (rooms.has(roomId)) roomId = randomRoomId();
  }

  const room = getOrCreateRoom(roomId);
  const seat = getSeat(room);

  if (!seat) {
    send(ws, 'error', { message: 'room full' });
    return;
  }

  room.players.set(seat, ws);
  ws.meta.roomId = roomId;
  ws.meta.playerId = seat;

  send(ws, 'room_joined', {
    roomId,
    playerId: seat,
    created: room.players.size === 1
  });

  broadcast(room, 'room_state', {
    roomId,
    players: [...room.players.keys()],
    state: room.state
  });
}

wss.on('connection', (ws) => {
  ws.meta = {
    roomId: null,
    playerId: null
  };

  send(ws, 'hello', { ok: true });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, 'error', { message: 'invalid json' });
      return;
    }

    if (msg.type === 'create_room') {
      if (ws.meta.roomId || ws.meta.playerId) {
        leaveCurrentRoom(ws);
      }

      let roomId = randomRoomId();
      while (rooms.has(roomId)) roomId = randomRoomId();

      joinOrCreateRoom(ws, roomId);
      return;
    }

    if (msg.type === 'join_room') {
      const roomId = normalizeRoomId(msg.roomId);
      if (!roomId) {
        send(ws, 'error', { message: 'roomId required' });
        return;
      }

      if (ws.meta.roomId || ws.meta.playerId) {
        leaveCurrentRoom(ws);
      }

      joinOrCreateRoom(ws, roomId);
      return;
    }

    if (msg.type === 'join_or_create_room') {
      const roomId = normalizeRoomId(msg.roomId);

      if (ws.meta.roomId || ws.meta.playerId) {
        leaveCurrentRoom(ws);
      }

      joinOrCreateRoom(ws, roomId);
      return;
    }

    const roomId = ws.meta.roomId;
    const playerId = ws.meta.playerId;
    if (!roomId || !playerId) {
      send(ws, 'error', { message: 'join room first' });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      send(ws, 'error', { message: 'room missing' });
      return;
    }

    if (msg.type === 'select_char') {
      const charId = msg.charId ?? null;
      if (playerId === 'p1') room.state.p1Char = charId;
      if (playerId === 'p2') room.state.p2Char = charId;

      broadcast(room, 'room_state', {
        roomId,
        players: [...room.players.keys()],
        state: room.state
      });
      return;
    }

    if (msg.type === 'ready') {
      const ready = !!msg.ready;
      if (playerId === 'p1') room.state.p1Ready = ready;
      if (playerId === 'p2') room.state.p2Ready = ready;

      broadcast(room, 'room_state', {
        roomId,
        players: [...room.players.keys()],
        state: room.state
      });

      if (
        room.players.has('p1') &&
        room.players.has('p2') &&
        room.state.p1Ready &&
        room.state.p2Ready &&
        room.state.p1Char &&
        room.state.p2Char
      ) {
        broadcast(room, 'match_start', {
          roomId,
          seed: Date.now(),
          chars: {
            p1: room.state.p1Char,
            p2: room.state.p2Char
          }
        });
      }
      return;
    }

    if (msg.type === 'input') {
      const target = playerId === 'p1' ? room.players.get('p2') : room.players.get('p1');
      if (target) {
        send(target, 'remote_input', {
          from: playerId,
          input: msg.input || {}
        });
      }
      return;
    }
  });

  ws.on('close', () => {
    leaveCurrentRoom(ws);
  });
});

console.log(`IRONFIST online server listening on :${PORT}`);
