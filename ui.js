// ===== 화면 =====
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const h = (tag, cls, text, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
const ptsD = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');

function nearest(g){ let d = Infinity; for (const [a, b] of g.edges){ const [x1, y1] = g.pts[a], [x2, y2] = g.pts[b]; d = Math.min(d, Math.hypot(x2-x1, y2-y1)); } return d; }
const DRAW = {
  circle(svg, cx, cy, r){ el('circle', {cx, cy, r, class: 'line', fill: 'none'}, svg); },
  well(svg, x, y, r){ el('circle', {cx: x, cy: y, r, class: 'well'}, svg); el('path', {d: `M${x-r*0.55} ${y-4} q${r*0.27} -8 ${r*0.55} 0 t${r*0.55} 0`, class: 'ripple'}, svg); el('path', {d: `M${x-r*0.4} ${y+10} q${r*0.2} -7 ${r*0.4} 0 t${r*0.4} 0`, class: 'ripple'}, svg); },
  poly(svg, pts, cls){ el('path', {d: ptsD(pts), class: cls || 'line', fill: 'none'}, svg); },
};
function drawStatic(g, svg, opts = {}){
  const skip = new Set((g.skipEdges || []).map(e => e.join('-')));
  for (const [a, b] of g.edges){ if (skip.has(a + '-' + b)) continue; const [x1, y1] = g.pts[a], [x2, y2] = g.pts[b]; el('line', {x1, y1, x2, y2, class: 'line'}, svg); }
  if (g.decor) g.decor(svg, DRAW);
  const nr = Math.max(3.5, Math.min(6, nearest(g) * 0.06));
  for (const [x, y] of g.pts) el('circle', {cx: x, cy: y, r: nr, class: 'node'}, svg);
}
function drawPiece(parent, v, x, y, r, extra){
  const gp = el('g', {class: `piece ${v === RED ? 'red' : 'blue'}${extra || ''}`, transform: `translate(${x} ${y})`}, parent);
  el('circle', {r, class: 'body'}, gp); el('circle', {r: r * 0.66, class: 'ring'}, gp); el('ellipse', {cx: -r*0.26, cy: -r*0.37, rx: r*0.37, ry: r*0.22, class: 'gloss'}, gp);
  return gp;
}
function thumb(g){
  const svg = el('svg', {viewBox: g.box.join(' '), class: 'thumb'});
  drawStatic(g, svg);
  const s = g.init(), r = Math.min(26, nearest(g) * 0.3);
  s.bd.forEach((v, i) => { if (v) drawPiece(svg, v, g.pts[i][0], g.pts[i][1], r); });
  return svg;
}

// ===== 메인 =====
let selectedId = 'bakwi';
function renderHome(){
  const cards = $('cards'); cards.innerHTML = '';
  for (const g of GAMES){
    const c = h('button', 'card' + (g.id === selectedId ? ' on' : ''), null, cards);
    c.appendChild(thumb(g));
    const t = h('div', 'ct', null, c);
    h('div', 'cn', g.name, t);
    h('div', 'ck', `${g.kind} · 말 ${g.pieces}개`, t);
    h('div', 'cd', g.tagline, t);
    c.onclick = () => { selectedId = g.id; renderHome(); if (matchMedia('(max-width: 900px)').matches) $('detail').scrollIntoView({behavior: 'smooth'}); };
  }
  const us = $('unsorted'); us.innerHTML = '';
  for (const u of UNSORTED){ const d = h('div', 'ucard', null, us); h('div', 'un', u.name, d); h('div', 'uk', u.known, d); h('div', 'um', '빠진 정보: ' + u.missing, d); }
  renderDetail($('detail'), GAME_BY_ID[selectedId], true);
}
function renderRules(box, g){
  h('p', 'lead', g.rules.intro, box);
  g.rules.sections.forEach(([title, items], i) => {
    const h3 = h('h3', null, null, box); h('span', 'n', String(i + 1), h3); h3.appendChild(document.createTextNode(title));
    const ul = h('ul', null, null, box); for (const it of items) h('li', null, it, ul);
  });
  const h3 = h('h3', null, null, box); h('span', 'n', '+', h3); h3.appendChild(document.createTextNode('이 판에서 정한 규칙'));
  const hb = h('div', 'house', null, box); const ul = h('ul', null, null, hb); for (const it of g.rules.house) h('li', null, it, ul);
  const src = h('p', 'src', '규칙 출처: ', box);
  g.rules.src.forEach(([label, url], i) => { if (i) src.appendChild(document.createTextNode(' · ')); const a = h('a', null, label, src); a.href = url; a.target = '_blank'; a.rel = 'noopener'; });
}
function renderDetail(box, g, withModes){
  box.innerHTML = '';
  const head = h('div', 'dhead', null, box);
  h('h2', null, g.name, head); h('div', 'aka', g.aka, head);
  const tags = h('div', 'tags', null, head); h('span', 'tag', g.kind, tags); h('span', 'tag', `말 ${g.pieces}개씩`, tags);
  if (withModes){
    const modes = h('div', 'modes', null, box);
    const solo = h('div', 'mode', null, modes);
    h('div', 'mt', '혼자 두기', solo); h('div', 'md', '컴퓨터와 둡니다. 내가 홍(선공)이에요.', solo);
    const lv = h('div', 'seg small', null, solo);
    for (const [k, t] of [['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']]){ const b = h('button', level === k ? 'on' : '', t, lv); b.onclick = () => { level = k; renderHome(); }; }
    const b1 = h('button', 'btn primary', '컴퓨터와 시작', solo); b1.onclick = () => startLocal(g, 'ai');
    const duo = h('div', 'mode', null, modes);
    h('div', 'mt', '둘이서 한 화면', duo); h('div', 'md', '한 기기에서 번갈아 둡니다.', duo);
    const b2 = h('button', 'btn primary', '둘이서 시작', duo); b2.onclick = () => startLocal(g, 'pvp');
    const on = h('div', 'mode', null, modes);
    h('div', 'mt', '온라인 초대', on); h('div', 'md', '방을 만들고 초대 링크를 보내면 다른 기기에서 실시간으로 둡니다.', on);
    const b3 = h('button', 'btn primary', '방 만들고 초대하기', on); b3.onclick = () => createRoom(g);
  }
  renderRules(h('div', 'rules', null, box), g);
}

// ===== 대국 =====
let cur = null, level = 'normal', selected = null, pendingRemove = null, busy = false, aiTimer = null, flipped = false;
function startLocal(g, mode){
  if (NET.code) leaveRoom(true);
  cur = {g, mode, s: newState(g), hist: [], log: [], last: null};
  selected = null; pendingRemove = null; busy = false; clearTimeout(aiTimer);
  showPlay(); setFlip(false); render(); maybeAI();
}
function showPlay(){
  $('home').hidden = true; $('play').hidden = false; $('backBtn').hidden = false;
  const g = cur.g;
  $('gameTitle').textContent = g.name;
  setupBoard(g);
  const rb = $('playRules'); rb.innerHTML = ''; renderDetail(rb, g, false);
  [...$('modeSeg').children].forEach(x => x.classList.toggle('on', x.dataset.mode === cur.mode));
  $('levelSeg').style.display = cur.mode === 'ai' ? '' : 'none';
  $('localBtns').style.display = cur.mode === 'online' ? 'none' : '';
  $('onlinePanel').hidden = cur.mode !== 'online';
  [...$('levelSeg').children].forEach(x => x.classList.toggle('on', x.dataset.level === level));
  window.scrollTo({top: 0});
}
function goHome(){
  clearTimeout(aiTimer);
  if (NET.code) leaveRoom(true);
  cur = null; $('home').hidden = false; $('play').hidden = true; $('backBtn').hidden = true; renderHome();
}

let PR = 24, HITR = 40;
function setupBoard(g){
  const svg = $('board');
  svg.setAttribute('viewBox', g.box.join(' '));
  const d = nearest(g); PR = Math.min(27, d * 0.3); HITR = Math.min(46, d * 0.47);
  $('lines').innerHTML = ''; drawStatic(g, $('lines'));
  const hg = $('hits'); hg.innerHTML = '';
  g.pts.forEach(([x, y], i) => {
    const c = el('circle', {cx: x, cy: y, r: HITR, class: 'hit'}, hg);
    c.addEventListener('click', () => onPoint(i));
    c.addEventListener('mouseenter', () => onHover(i));
    c.addEventListener('mouseleave', () => onHover(null));
  });
  flipped = null; setFlip(false);
}
function setFlip(f){
  if (flipped === f || !cur) return;
  flipped = f;
  const [x, y, w, hh] = cur.g.box;
  $('world').setAttribute('transform', f ? `rotate(180 ${x + w/2} ${y + hh/2})` : '');
  const cg = $('coords'); cg.innerHTML = '';
  if (cur.g.coords) for (const c of cur.g.coords(f)) el('text', {x: c.x, y: c.y, class: 'coord'}, cg).textContent = c.t;
}
const XY = i => cur.g.pts[i];
const pieceTf = (x, y) => `translate(${x} ${y})` + (flipped ? ' rotate(180)' : '');
const result = () => cur && outcome(cur.g, cur.s);
function myTurn(){
  if (!cur || busy || result()) return false;
  if (cur.mode === 'pvp') return true;
  if (cur.mode === 'ai') return cur.s.turn === RED;
  return NET.ready() && cur.s.turn === NET.color;
}
function resultTitle(w){
  if (!w) return '무승부';
  if (cur.mode === 'ai') return w === RED ? '이겼어요!' : '컴퓨터 승리';
  if (cur.mode === 'online' && NET.color) return w === NET.color ? '이겼어요!' : '졌어요';
  return `${NAME[w]} 승리!`;
}
function viewBoard(){
  if (!pendingRemove) return cur.s.bd;
  const bd = cur.s.bd.slice(), m = pendingRemove[0];
  if (m.f !== null && m.f !== undefined) bd[m.f] = 0; bd[m.t] = cur.s.turn; return bd;
}
function render(){
  if (!cur) return;
  const g = cur.g, s = cur.s, bd = viewBoard(), res = result(), mt = myTurn();
  const pg = $('pieces'); pg.innerHTML = '';
  const legalNow = mt ? g.moves(s) : [];
  const movable = new Set(legalNow.filter(m => m.f !== null && m.f !== undefined).map(m => m.f));
  const removable = new Set(pendingRemove ? pendingRemove.map(m => m.r) : []);
  bd.forEach((v, i) => {
    if (!v) return;
    const [x, y] = XY(i);
    let cls = '';
    if (selected === i) cls += ' sel';
    if (!pendingRemove && movable.has(i)) cls += ' movable';
    if (removable.has(i)) cls += ' removable';
    const gp = drawPiece(pg, v, x, y, PR, cls); gp.setAttribute('transform', pieceTf(x, y)); gp.dataset.sq = i;
  });
  const hg = $('hints'); hg.innerHTML = '';
  for (const mk of (g.marksOf ? g.marksOf(s) : [])){ const [x, y] = XY(mk); const k = PR * 0.55; el('path', {d: `M${x-k} ${y-k} L${x+k} ${y+k} M${x+k} ${y-k} L${x-k} ${y+k}`, class: 'mark'}, hg); }
  if (mt && !pendingRemove){
    if (s.phase === 'place'){ const seen = new Set(); for (const m of legalNow){ if (seen.has(m.t)) continue; seen.add(m.t); const [x, y] = XY(m.t); el('circle', {cx: x, cy: y, r: PR*0.32, class: isCap(m) ? 'hint-capdot' : 'hint-step'}, hg); } }
    else if (selected !== null){ const seen = new Set(); for (const m of legalNow.filter(m => m.f === selected)){ if (seen.has(m.t)) continue; seen.add(m.t); const [x, y] = XY(m.t); if (s.bd[m.t]) el('circle', {cx: x, cy: y, r: PR*1.35, class: 'hint-cap'}, hg); else el('circle', {cx: x, cy: y, r: PR*0.38, class: isCap(m) ? 'hint-capdot' : 'hint-step'}, hg); } }
  }
  if (removable.size) for (const r of removable){ const [x, y] = XY(r); el('circle', {cx: x, cy: y, r: PR*1.35, class: 'hint-cap'}, hg); }
  if (cur.last){ for (const sq of [cur.last.f, cur.last.t]) if (sq !== null && sq !== undefined){ const [x, y] = XY(sq); el('circle', {cx: x, cy: y, r: PR*0.5, class: 'lastmove'}, hg); } }
  $('route').setAttribute('d', '');

  const inHand = s.hand ? ` (손에 ${s.hand[RED]})` : '', inHandB = s.hand ? ` (손에 ${s.hand[BLUE]})` : '';
  $('redLeft').textContent = countP(s.bd, RED) + inHand; $('blueLeft').textContent = countP(s.bd, BLUE) + inHandB;
  $('turnChip').className = 'chip ' + (s.turn === RED ? 'red' : 'blue');
  if (res){
    const title = resultTitle(res.winner);
    $('turnText').textContent = title; $('msg').textContent = res.why;
    $('ovTitle').textContent = title; $('ovSub').textContent = res.why; $('overlay').classList.add('show');
    $('turnChip').className = res.winner ? 'chip ' + (res.winner === RED ? 'red' : 'blue') : 'chip';
  } else {
    $('overlay').classList.remove('show');
    let who = NAME[s.turn] + ' 차례';
    if (cur.mode === 'ai') who += s.turn === RED ? ' (나)' : ' (컴퓨터)';
    if (cur.mode === 'online' && NET.color) who += s.turn === NET.color ? ' (나)' : ' (상대)';
    $('turnText').textContent = who;
    $('msg').textContent = statusMsg(legalNow);
  }
  $('log').innerHTML = '';
  if (!cur.log.length) h('span', null, '아직 둔 수가 없어요.', $('log'));
  cur.log.forEach((t, i) => h('span', t.c ? 'cap' : '', `${i+1}. ${t.x}`, $('log')));
  $('log').scrollTop = 1e6;
  $('undoBtn').disabled = !cur.hist.length;
  if (cur.mode === 'online') renderOnline();
}
function statusMsg(legalNow){
  const s = cur.s;
  if (cur.mode === 'online'){
    if (!NET.code) return '방을 만들거나 방 코드로 참가하세요.';
    if (!NET.data) return '방에 연결하는 중…';
    if (!NET.color && NET.joinErr) return NET.joinErr;
    if (!NET.data.blue) return `친구를 기다리는 중이에요. 초대 링크나 방 코드 ${NET.code}를 보내 주세요.`;
    if (!NET.color) return '구경하는 중이에요.';
    if (busy) return '';
    if (s.turn !== NET.color) return '상대가 두기를 기다리는 중…';
  }
  if (busy && cur.mode === 'ai' && s.turn === BLUE) return '컴퓨터가 생각하는 중…';
  if (pendingRemove) return '꼰! 떼어 낼 상대 말을 고르세요.';
  if (s.phase === 'place') return `빈 점을 눌러 말을 놓으세요. 한 줄에 세 개를 세우면 꼰!`;
  if (selected !== null){
    const ms = legalNow.filter(m => m.f === selected);
    return ms.some(isCap) ? '금색 표시는 잡는 수예요. 위에 올리면 잡히는 말이 보여요.' : '초록 점으로 옮길 수 있어요.';
  }
  if (cur.g.id === 'obat') return '대각선으로 한 칸씩 옮겨 상대 진영을 차지하세요.';
  return legalNow.some(isCap) ? '잡을 수 있는 수가 있어요!' : '움직일 말을 누르세요.';
}
function onHover(sq){
  const r = $('route');
  if (!cur || sq === null || selected === null || pendingRemove){ r.setAttribute('d', ''); $('capPreview').innerHTML = ''; return; }
  const m = cur.g.moves(cur.s).find(m => m.f === selected && m.t === sq);
  r.setAttribute('d', m && m.path && cur.g.pathPts ? ptsD(cur.g.pathPts(m, XY)) : '');
  const cp = $('capPreview'); cp.innerHTML = '';
  if (m && m.caps) for (const c of m.caps){ const [x, y] = XY(c); el('circle', {cx: x, cy: y, r: PR*1.15, class: 'cap-preview'}, cp); }
}
function onPoint(i){
  if (!myTurn()) return;
  const g = cur.g, s = cur.s, ms = g.moves(s);
  if (pendingRemove){ const m = pendingRemove.find(x => x.r === i); if (m){ pendingRemove = null; doMove(m); } return; }
  let cands = [];
  if (s.phase === 'place') cands = ms.filter(m => m.t === i);
  else if (selected !== null) cands = ms.filter(m => m.f === selected && m.t === i);
  if (cands.length){
    const withR = cands.filter(m => m.r !== undefined && m.r !== null);
    if (withR.length > 1){ pendingRemove = withR; selected = null; render(); return; }
    doMove(cands[0]); return;
  }
  selected = (s.bd[i] === s.turn && ms.some(m => m.f === i) && selected !== i) ? i : null;
  render();
}
function animate(m, done){
  if (m.f === null || m.f === undefined){ done(); return; }
  const gp = [...$('pieces').children].find(n => +n.dataset.sq === m.f);
  if (!gp){ done(); return; }
  gp.parentNode.appendChild(gp);
  const pts = (m.path && cur.g.pathPts) ? cur.g.pathPts(m, XY) : [XY(m.f), XY(m.t)];
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++){ const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); total += d; }
  const dur = m.path ? Math.min(1600, Math.max(500, total * 1.1)) : 220;
  if (m.path) $('route').setAttribute('d', ptsD(pts));
  for (const c of (m.caps || [])){ const t = [...$('pieces').children].find(n => +n.dataset.sq === c); if (t) t.classList.add('dying'); }
  const t0 = performance.now();
  (function frame(now){
    let t = Math.min(1, (now - t0) / dur);
    t = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    let dist = t * total, i = 0;
    while (i < seg.length - 1 && dist > seg[i]){ dist -= seg[i]; i++; }
    const f = seg[i] ? Math.min(1, dist / seg[i]) : 1;
    gp.setAttribute('transform', pieceTf(pts[i][0] + (pts[i+1][0] - pts[i][0]) * f, pts[i][1] + (pts[i+1][1] - pts[i][1]) * f));
    if (t < 1) requestAnimationFrame(frame); else done();
  })(t0);
}
// 한 수 적용(공통). animateIt=false면 바로 반영
function commit(m, after){
  const g = cur.g, s = cur.s;
  cur.log = cur.log.concat(logEntry(g, s, m));
  cur.s = applyMove(g, s, m);
  cur.last = {f: m.f, t: m.t};
  if (after) after();
}
function doMove(m){
  if (cur.mode !== 'online') cur.hist.push({s: cur.s, log: cur.log, last: cur.last});
  selected = null; busy = true; render();
  animate(m, () => { busy = false; commit(m); if (cur.mode === 'online') netPush(m); render(); maybeAI(); if (NET.pending){ const d = NET.pending; NET.pending = null; onData(d); } });
}
function maybeAI(){
  if (!cur || cur.mode !== 'ai' || result() || cur.s.turn !== BLUE) return;
  busy = true; render();
  aiTimer = setTimeout(() => {
    const m = aiChoose(cur.g, cur.s, level);
    busy = false;
    if (m) doMove(m); else render();
  }, 350);
}

// ===== 온라인 (Vercel API + Redis) =====
const API = '/api/room';
const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
const TAB = (() => { const k = 'gonu-tab'; try { let t = sessionStorage.getItem(k); if (!t){ t = rid(); sessionStorage.setItem(k, t); } return t; } catch (e) { return rid(); } })();
const store = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} },
};
const NET = {
  avail: null, token: TAB, code: null, data: null, seq: -1, round: 0, color: null,
  pending: null, pollT: null, lastPing: 0, fails: 0, joinErr: '', posting: false,
  ready(){ return !!(this.data && this.data.red && this.data.blue && this.color); },
};
function note(t){ $('onlineNote').textContent = t || ''; $('homeNote').textContent = t || ''; }
const validCode = c => /^[A-Z0-9]{5}$/.test(c);
function validState(g, st){ return st && Array.isArray(st.bd) && st.bd.length === g.pts.length && st.bd.every(v => v === 0 || v === 1 || v === 2) && (st.turn === 1 || st.turn === 2); }
const myName = () => (store.get('gonu-name') || '').slice(0, 12);

async function api(method, params){
  const opt = {method, headers: {'Content-Type': 'application/json'}};
  let url = API;
  if (method === 'GET') url += '?' + new URLSearchParams(params).toString();
  else opt.body = JSON.stringify(params);
  const r = await fetch(url, opt);
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok){ const err = new Error((j && j.error) || 'http_' + r.status); err.status = r.status; err.body = j; throw err; }
  return j;
}
function explainErr(e){
  if (e && e.status === 404) return '방을 찾을 수 없어요. 코드를 다시 확인해 주세요.';
  if (e && e.message === 'no_store') return '온라인 저장소가 아직 연결되지 않았어요. (Vercel에 Redis 연결 필요)';
  return '연결이 불안정해요. 잠시 뒤 다시 해 주세요.';
}
(function initOnline(){
  NET.avail = location.protocol.startsWith('http');
  hashJoin();
  window.addEventListener('hashchange', hashJoin);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && NET.code) poll(true); });
})();
function hashJoin(){
  const m = (location.hash || '').match(/^#g-([A-Za-z0-9]{5})$/);
  if (m && NET.avail && m[1].toUpperCase() !== NET.code) joinRoom(m[1].toUpperCase());
}
function needOnline(){
  if (!NET.avail){ note('온라인 대전은 웹사이트 주소로 접속했을 때만 쓸 수 있어요.'); return false; }
  return true;
}
async function createRoom(g){
  if (!needOnline()) return;
  note('');
  try {
    const d = await api('POST', {action: 'create', game: g.id, t: NET.token, name: myName()});
    store.set('gonu-seat-' + d.code, NET.token);
    enterRoom(d.code, g, d);
  } catch (e){ note(explainErr(e)); }
}
async function joinRoom(code){
  if (!needOnline()) return;
  if (!validCode(code)){ note('방 코드는 다섯 글자예요.'); return; }
  note('');
  try {
    const d = await api('POST', {action: 'join', code, t: NET.token, alt: store.get('gonu-seat-' + code) || '', name: myName()});
    if (d.adopt) NET.token = d.adopt;
    if (d.you) store.set('gonu-seat-' + code, NET.token);
    const g = GAME_BY_ID[d.game];
    if (!g){ note('알 수 없는 고누 방이에요.'); return; }
    enterRoom(code, g, d);
    NET.joinErr = d.you ? '' : '이미 두 사람이 두고 있어서 구경으로 들어왔어요.';
    if (NET.joinErr) note(NET.joinErr);
    render();
  } catch (e){ note(explainErr(e)); }
}
function enterRoom(code, g, d){
  leaveRoom(true);
  NET.code = code; NET.data = null; NET.seq = -1; NET.round = 0; NET.joinErr = '';
  try { history.replaceState(null, '', '#g-' + code); } catch (e) {}
  cur = {g, mode: 'online', s: newState(g), hist: [], log: [], last: null};
  selected = null; pendingRemove = null; busy = false;
  showPlay();
  if (d) onData(d); else render();
  schedulePoll(300);
}
function leaveRoom(silent){
  clearTimeout(NET.pollT); NET.pollT = null;
  NET.code = null; NET.data = null; NET.color = null; NET.seq = -1; NET.pending = null;
  if (NET.token !== TAB) NET.token = TAB;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  if (!silent && cur) startLocal(cur.g, 'pvp');
}
function pollDelay(){
  if (document.hidden) return 6000;
  const d = NET.data;
  if (!d || !d.blue) return 1200;
  if (result()) return 2500;
  return (cur && cur.s.turn !== NET.color) ? 800 : 3000;   // 상대 차례면 자주 확인
}
function schedulePoll(ms){ clearTimeout(NET.pollT); NET.pollT = setTimeout(() => poll(), ms === undefined ? pollDelay() : ms); }
async function poll(now){
  if (!NET.code) return;
  if (now) clearTimeout(NET.pollT);
  const code = NET.code;
  const ping = Date.now() - NET.lastPing > 12000;
  try {
    const d = await api('GET', {code, t: NET.token, ping: ping ? 1 : 0});
    if (code !== NET.code) return;
    if (ping) NET.lastPing = Date.now();
    NET.fails = 0; if (/연결이 불안정/.test($('onlineNote').textContent)) note('');
    onData(d);
  } catch (e){
    if (code !== NET.code) return;
    if (e.status === 404){ note('방이 사라졌어요.'); leaveRoom(); return; }
    if (++NET.fails >= 3) note(explainErr(e));
  }
  if (NET.code === code) schedulePoll();
}
function onData(d){
  if (!cur || !d) return;
  const g = GAME_BY_ID[d.game];
  if (!g || !validState(g, d.state)) return;
  if (busy || NET.posting){ NET.pending = d; return; }
  const prevOnline = NET.data && NET.data.online;
  NET.data = d;
  NET.color = d.you || null;
  if (cur.g !== g){ cur.g = g; showPlay(); }
  setFlip(NET.color === BLUE);
  const round = d.round || 1, sameRound = NET.round === round;
  if (sameRound && d.seq <= NET.seq){ render(); return; }
  const toState = () => {
    cur.s = d.state; cur.log = Array.isArray(d.log) ? d.log : []; cur.last = d.last || null;
    NET.seq = d.seq; NET.round = round; selected = null; pendingRemove = null;
  };
  if (sameRound && d.seq === NET.seq + 1 && d.lastKey){
    const m = cur.g.moves(cur.s).find(x => moveKey(x) === d.lastKey);
    if (m){ remoteMove(m, d.seq, toState); return; }
  }
  toState(); render();
}
function remoteMove(m, seq, then){
  selected = null; pendingRemove = null; busy = true; render();
  animate(m, () => {
    busy = false; commit(m); NET.seq = seq;
    if (then) then();
    render();
    flushPending();
  });
}
function flushPending(){ if (NET.pending){ const d = NET.pending; NET.pending = null; onData(d); } }
async function netPush(m){
  const base = NET.seq, k = moveKey(m);
  NET.posting = true;
  try {
    const d = await api('POST', {action: 'move', code: NET.code, t: NET.token, base, key: k});
    NET.posting = false;
    NET.seq = d.seq; NET.data = d;
    render();
  } catch (e){
    NET.posting = false;
    if (e.status === 409 && e.body && e.body.room){ NET.seq = -1; onData(e.body.room); note('상대 화면과 어긋나서 최신 판으로 맞췄어요.'); }
    else note(explainErr(e));
  }
  flushPending();
  schedulePoll();
}
async function rematch(){
  try { const d = await api('POST', {action: 'rematch', code: NET.code, t: NET.token, round: NET.round}); onData(d); }
  catch (e){ if (e.status === 409 && e.body && e.body.room) onData(e.body.room); else note(explainErr(e)); }
}
function renderOnline(){
  const inRoom = !!NET.code;
  $('lobby').hidden = inRoom; $('inRoom').hidden = !inRoom;
  if (!inRoom){ $('nameInput').value = myName(); return; }
  $('roomCode').textContent = NET.code;
  $('rematchBtn').hidden = !(result() && NET.color);
  const live = $('liveDot');
  live.className = 'live ' + (NET.fails ? 'off' : 'on');
  live.textContent = NET.fails ? '연결 확인 중…' : '연결됨';
  const d = NET.data, box = $('players');
  box.innerHTML = '';
  if (!d) return;
  for (const color of [RED, BLUE]){
    const has = color === RED ? d.red : d.blue, nm = color === RED ? d.redName : d.blueName;
    const row = h('div', 'p', null, box);
    const chip = h('span', 'chip ' + (color === RED ? 'red' : 'blue'), null, row); chip.style.width = chip.style.height = '12px';
    h('span', null, `${NAME[color]} · ` + (has ? (nm || (color === NET.color ? '나' : '상대')) : '기다리는 중…'), row);
    if (has && color === NET.color) h('span', 'me', '나', row);
    else if (has && NET.color){ const on = d.online && d.online[color]; h('span', 'presence ' + (on ? 'on' : 'off'), on ? '접속 중' : '자리 비움', row); }
  }
  if (!NET.color && d.red && d.blue) h('div', 'p', '👀 구경 중', box);
}

// ===== 버튼 =====
$('backBtn').onclick = goHome;
$('newBtn').onclick = () => startLocal(cur.g, cur.mode);
$('undoBtn').onclick = () => {
  if (busy || !cur.hist.length || cur.mode === 'online') return;
  clearTimeout(aiTimer);
  let hh = cur.hist.pop();
  if (cur.mode === 'ai' && hh.s.turn === BLUE && cur.hist.length) hh = cur.hist.pop();
  cur.s = hh.s; cur.log = hh.log; cur.last = hh.last; selected = null; pendingRemove = null;
  render(); maybeAI();
};
for (const b of $('modeSeg').children) b.onclick = () => {
  const m = b.dataset.mode;
  if (m === 'online'){ if (NET.code) return; cur.mode = 'online'; cur.s = newState(cur.g); cur.log = []; cur.hist = []; cur.last = null; showPlay(); render(); needOnline(); return; }
  if (NET.code) leaveRoom(true);
  startLocal(cur.g, m);
};
for (const b of $('levelSeg').children) b.onclick = () => { level = b.dataset.level; [...$('levelSeg').children].forEach(x => x.classList.toggle('on', x === b)); };
$('createBtn').onclick = () => createRoom(cur.g);
$('nameInput').addEventListener('change', e => store.set('gonu-name', e.target.value.trim().slice(0, 12)));
$('joinBtn').onclick = () => joinRoom($('codeInput').value.trim().toUpperCase());
$('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('joinBtn').click(); });
$('homeJoinBtn').onclick = () => joinRoom($('homeCode').value.trim().toUpperCase());
$('homeCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('homeJoinBtn').click(); });
$('leaveBtn').onclick = () => leaveRoom(false);
$('rematchBtn').onclick = rematch;
function copyText(btn, text, label){
  try { navigator.clipboard.writeText(text).then(() => { btn.textContent = '복사됨'; setTimeout(() => btn.textContent = label, 1300); }, () => {}); } catch (e) {}
}
$('copyBtn').onclick = () => copyText($('copyBtn'), `${cur.g.name} 한 판 둘래요? ${location.origin}${location.pathname}#g-${NET.code} (방 코드 ${NET.code})`, '초대 링크 복사');
renderHome();
