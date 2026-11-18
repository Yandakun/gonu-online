// 고누 온라인 방 API (Vercel Serverless + Upstash Redis REST)
const G = require('../games.js');

const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 60 * 60 * 24 * 7;      // 방은 7일 보관
const ONLINE_MS = 30000;            // 30초 안에 확인한 사람 = 접속 중

async function redis(cmd){
  const r = await fetch(RURL, {method: 'POST', headers: {Authorization: `Bearer ${RTOK}`, 'Content-Type': 'application/json'}, body: JSON.stringify(cmd)});
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const K = c => `gonu:room:${c}`;
const SEEN = (c, s) => `gonu:seen:${c}:${s}`;
const okCode = c => typeof c === 'string' && /^[A-Z0-9]{5}$/.test(c);
const okTok = t => typeof t === 'string' && /^[a-z0-9]{8,40}$/.test(t);
const clean = n => (typeof n === 'string' ? n : '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
function genCode(){ const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += a[Math.floor(Math.random() * a.length)]; return c; }
const seatOf = (room, t) => (t && room.redTok === t) ? 1 : (t && room.blueTok === t) ? 2 : 0;

function pub(code, room, you, seen, extra){
  const now = Date.now();
  return Object.assign({
    code, game: room.game, red: !!room.redTok, blue: !!room.blueTok, redName: room.redName || '', blueName: room.blueName || '',
    state: room.state, seq: room.seq, round: room.round, lastKey: room.lastKey || null, last: room.last || null, log: room.log || [],
    you, online: {1: !!seen[0] && now - +seen[0] < ONLINE_MS, 2: !!seen[1] && now - +seen[1] < ONLINE_MS},
  }, extra || {});
}
async function load(code){
  const [raw, s1, s2] = await redis(['MGET', K(code), SEEN(code, 1), SEEN(code, 2)]);
  return raw ? {room: JSON.parse(raw), seen: [s1, s2]} : null;
}
const save = (code, room) => redis(['SET', K(code), JSON.stringify(room), 'EX', TTL]);
const touch = (code, seat) => redis(['SET', SEEN(code, seat), String(Date.now()), 'EX', 120]);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!RURL || !RTOK) return res.status(503).json({error: 'no_store'});
  try {
    if (req.method === 'GET'){
      const {code, t, ping} = req.query;
      if (!okCode(code)) return res.status(400).json({error: 'bad_code'});
      const got = await load(code);
      if (!got) return res.status(404).json({error: 'not_found'});
      const you = seatOf(got.room, t);
      if (you && ping === '1'){ await touch(code, you); got.seen[you - 1] = String(Date.now()); }
      return res.json(pub(code, got.room, you, got.seen));
    }
    if (req.method !== 'POST') return res.status(405).json({error: 'method'});
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!okTok(b.t)) return res.status(400).json({error: 'bad_token'});

    if (b.action === 'create'){
      const g = G.GAME_BY_ID[b.game];
      if (!g) return res.status(400).json({error: 'bad_game'});
      const room = {game: g.id, redTok: b.t, redName: clean(b.name), blueTok: null, blueName: '', state: G.newState(g), seq: 0, round: 1, lastKey: null, last: null, log: [], created: Date.now()};
      for (let i = 0; i < 6; i++){
        const code = genCode();
        const ok = await redis(['SET', K(code), JSON.stringify(room), 'NX', 'EX', TTL]);
        if (ok){ await touch(code, 1); return res.json(pub(code, room, 1, [String(Date.now()), null])); }
      }
      return res.status(503).json({error: 'busy'});
    }

    if (!okCode(b.code)) return res.status(400).json({error: 'bad_code'});
    const got = await load(b.code);
    if (!got) return res.status(404).json({error: 'not_found'});
    const {room, seen} = got, code = b.code;
    let you = seatOf(room, b.t);

    if (b.action === 'join'){
      let adopt = null;
      if (!you && okTok(b.alt)){
        // 같은 기기에서 다시 들어온 경우: 자리 주인이 30초 넘게 안 보이면 그 자리를 되찾음
        const s = seatOf(room, b.alt);
        if (s && !(seen[s - 1] && Date.now() - +seen[s - 1] < ONLINE_MS)){ you = s; adopt = b.alt; }
      }
      if (!you && !room.blueTok){
        room.blueTok = b.t; room.blueName = clean(b.name); you = 2;
        await save(code, room);
      }
      if (you){ await touch(code, you); seen[you - 1] = String(Date.now()); }
      return res.json(pub(code, room, you, seen, adopt ? {adopt} : null));
    }

    if (b.action === 'move'){
      const g = G.GAME_BY_ID[room.game];
      if (!you) return res.status(403).json({error: 'not_player'});
      if (b.base !== room.seq) return res.status(409).json({error: 'stale', room: pub(code, room, you, seen)});
      if (room.state.turn !== you || G.outcome(g, room.state)) return res.status(409).json({error: 'not_your_turn', room: pub(code, room, you, seen)});
      const m = g.moves(room.state).find(x => G.moveKey(x) === b.key);
      if (!m) return res.status(409).json({error: 'illegal', room: pub(code, room, you, seen)});
      room.log = (room.log || []).concat(G.logEntry(g, room.state, m)).slice(-300);
      room.state = G.applyMove(g, room.state, m);
      room.seq += 1; room.lastKey = b.key; room.last = {f: m.f === undefined ? null : m.f, t: m.t};
      await save(code, room);
      await touch(code, you);
      return res.json(pub(code, room, you, seen));
    }

    if (b.action === 'rematch'){
      const g = G.GAME_BY_ID[room.game];
      if (!you) return res.status(403).json({error: 'not_player'});
      if (!G.outcome(g, room.state) || (b.round !== undefined && b.round !== room.round)) return res.status(409).json({error: 'not_over', room: pub(code, room, you, seen)});
      [room.redTok, room.blueTok] = [room.blueTok, room.redTok];
      [room.redName, room.blueName] = [room.blueName, room.redName];
      [seen[0], seen[1]] = [seen[1], seen[0]];
      room.state = G.newState(g); room.seq += 1; room.round = (room.round || 1) + 1; room.lastKey = null; room.last = null; room.log = [];
      await save(code, room);
      return res.json(pub(code, room, seatOf(room, b.t), seen));
    }
    return res.status(400).json({error: 'bad_action'});
  } catch (e){
    return res.status(500).json({error: 'server'});
  }
};
