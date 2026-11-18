// ===== 고누 규칙 엔진 (DOM 없음) =====
const RED = 1, BLUE = 2;
const NAME = {1: '홍', 2: '청'};

function gridPts(rows, cols, sp){ const p = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) p.push([c*sp, r*sp]); return p; }
function gridAdj(rows, cols, diag){
  const a = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
    const o = [], dirs = diag ? [[-1,-1],[-1,1],[1,-1],[1,1]] : [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs){ const rr = r+dr, cc = c+dc; if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) o.push(rr*cols+cc); }
    a.push(o);
  }
  return a;
}
function gridEdges(rows, cols){ const e = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){ const i = r*cols+c; if (c < cols-1) e.push([i, i+1]); if (r < rows-1) e.push([i, i+cols]); } return e; }
const gridName = (cols, rows) => i => 'ABCDE'[i % cols] + (rows - Math.floor(i / cols));
function gridCoords(rows, cols, sp, off){
  return flip => {
    const out = [];
    for (let c = 0; c < cols; c++) out.push({x: c*sp, y: (rows-1)*sp + off, t: 'ABCDE'[flip ? cols-1-c : c]});
    for (let r = 0; r < rows; r++) out.push({x: -off, y: r*sp, t: String(flip ? r+1 : rows-r)});
    return out;
  };
}
const countP = (bd, p) => { let n = 0; for (const v of bd) if (v === p) n++; return n; };
const stepMovesFrom = (bd, f, adj) => adj[f].filter(t => bd[t] === 0).map(t => ({f, t}));

// ---------------------------------------------------------------- 우물고누
const UMUL = (() => {
  // 0 왼위 1 오른위 2 가운데 3 왼아래 4 오른아래 / 우물: 오른쪽 변(1–4)이 없음
  const P = [[0,0],[240,0],[120,120],[0,240],[240,240]];
  const E = [[0,1],[0,3],[3,4],[0,2],[1,2],[3,2],[4,2]];
  const ADJ = P.map((_, i) => E.filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]));
  const NM = ['왼쪽 위','오른쪽 위','가운데','왼쪽 아래','오른쪽 아래'];
  return {
    id: 'umul', name: '우물고누', aka: '샘고누 · 강고누', pieces: 2, kind: '가두기',
    tagline: '말 두 개로 상대를 꼼짝 못 하게 가두는, 가장 쉬운 고누',
    pts: P, edges: E, box: [-60, -60, 420, 360],
    decor(svg, h){ h.well(svg, 300, 120, 34); },
    pname: i => NM[i],
    init(){ return {bd: [BLUE, BLUE, 0, RED, RED]}; },
    moves(s){
      const p = s.turn, out = [];
      for (let f = 0; f < 5; f++) if (s.bd[f] === p) out.push(...stepMovesFrom(s.bd, f, ADJ));
      if (s.ply === 0) return out.filter(m => { const nb = s.bd.slice(); nb[m.t] = p; nb[m.f] = 0; return movesOf(nb, 3-p).length > 0; });
      return out;
      function movesOf(bd, q){ const o = []; for (let f = 0; f < 5; f++) if (bd[f] === q) o.push(...stepMovesFrom(bd, f, ADJ)); return o; }
    },
    play(s, m){ const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; return {bd, caps: 0}; },
    evaluate(s, p){ let a = 0, b = 0; for (let f = 0; f < 5; f++){ if (s.bd[f] === p) a += stepMovesFrom(s.bd, f, ADJ).length; else if (s.bd[f]) b += stepMovesFrom(s.bd, f, ADJ).length; } return (a - b) * 10; },
    rules: {
      intro: '고누 가운데 가장 순하고 많이 두던 놀이예요. 말판 한쪽에 우물(샘·강)이 있어서 그 변으로는 다닐 수 없어요.',
      sections: [
        ['준비', ['네 귀와 가운데, 점 다섯 개짜리 말판을 씁니다. 오른쪽 변에는 우물이 있어 선이 없습니다.', '홍과 청이 말을 2개씩 갖고, 홍은 아래 두 귀, 청은 위 두 귀에 놓습니다.', '홍이 먼저 둡니다.']],
        ['움직이기', ['자기 차례에 말 하나를 선을 따라 이웃한 빈 점으로 한 칸 옮깁니다.', '우물 쪽 변으로는 건너갈 수 없습니다.']],
        ['첫수 금지', ['맨 처음 수로 상대를 바로 가두는 수(우물 옆 말을 가운데로 넣는 수)는 둘 수 없습니다.']],
        ['이기기', ['상대가 자기 차례에 움직일 수 있는 말이 하나도 없으면 이깁니다.']],
      ],
      house: ['같은 국면이 세 번 나오면 무승부로 합니다. 양쪽 모두 실수하지 않으면 끝없이 이어지는 놀이이기 때문입니다.'],
      src: [['한국민족문화대백과사전 「고누」', 'https://encykorea.aks.ac.kr/Article/E0003367'], ['Wikipedia, Pong hau k’i (우물고누 항목)', 'https://en.wikipedia.org/wiki/Pong_hau_k%27i']],
    },
  };
})();

// ---------------------------------------------------------------- 호박고누
const HOBAK = (() => {
  const R = 130, H = 78, W = 78;
  // 0 가운데, 1 위, 2 오른쪽, 3 아래, 4 왼쪽 (원 위), 5~7 홍 집(가운데·왼·오), 8~10 청 집(가운데·왼·오)
  const P = [[0,0],[0,-R],[R,0],[0,R],[-R,0],[0,R+H],[-W,R+H],[W,R+H],[0,-R-H],[-W,-R-H],[W,-R-H]];
  const CIRC = [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1]];
  const E = [...CIRC, [5,3],[6,5],[5,7],[8,1],[9,8],[8,10]];
  const CADJ = [0,1,2,3,4].map(i => CIRC.filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]));
  // 플레이어별 한 방향 길
  const HOME = {1: {mid: 5, ends: [6,7], exit: 3}, 2: {mid: 8, ends: [9,10], exit: 1}};
  const NM = ['가운데','위','오른쪽','아래','왼쪽','홍 집 가운데','홍 집 왼쪽','홍 집 오른쪽','청 집 가운데','청 집 왼쪽','청 집 오른쪽'];
  function targets(bd, f, p){
    const h = HOME[p];
    if (f < 5) return CADJ[f].filter(t => bd[t] === 0);
    if (h.ends.includes(f)) return bd[h.mid] === 0 ? [h.mid] : [];
    if (f === h.mid) return bd[h.exit] === 0 ? [h.exit] : [];
    return [];
  }
  const all = (bd, p) => { const o = []; for (let f = 0; f < 11; f++) if (bd[f] === p) for (const t of targets(bd, f, p)) o.push({f, t}); return o; };
  return {
    id: 'hobak', name: '호박고누', aka: '사발고누 · 돼지고누', pieces: 3, kind: '가두기',
    tagline: '호박 모양 원 안에서 세 말로 서로의 길을 막는 고누',
    pts: P, edges: E, box: [-190, -R-H-60, 380, 2*(R+H)+120],
    decor(svg, h){ h.circle(svg, 0, 0, R); },
    skipEdges: [[1,2],[2,3],[3,4],[4,1]],
    pname: i => NM[i],
    init(){ const bd = Array(11).fill(0); bd[5] = bd[6] = bd[7] = RED; bd[8] = bd[9] = bd[10] = BLUE; return {bd}; },
    moves(s){ return all(s.bd, s.turn); },
    play(s, m){ const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; return {bd, caps: 0}; },
    evaluate(s, p){ return (all(s.bd, p).length - all(s.bd, 3-p).length) * 10; },
    rules: {
      intro: '둥근 호박 모양 말판 위아래에 각자의 집(출발선)이 있어요. 집에서 나온 말은 원 안에서만 다니고, 상대를 원 안에 가두면 이깁니다.',
      sections: [
        ['준비', ['원 안에 가로·세로 지름이 그어진 말판을 씁니다. 원 위아래로 세 점짜리 집이 하나씩 붙어 있습니다.', '홍과 청이 말을 3개씩 갖고 자기 집 세 점에 놓습니다. 홍이 먼저 둡니다.']],
        ['움직이기', ['말 하나를 선을 따라 한 칸 옮깁니다. 남의 말을 건너뛰거나 겹칠 수 없습니다.', '집 안에서는 앞으로만 갑니다(양 끝 → 가운데 → 원).', '원 안에서는 선을 따라 어느 쪽으로든 다닐 수 있습니다.', '집에서 나온 말은 자기 집으로 돌아갈 수 없고, 상대 집에도 들어갈 수 없습니다.']],
        ['이기기', ['상대가 자기 차례에 움직일 수 있는 말이 하나도 없으면 이깁니다.', '집 입구가 막혀 집에 남은 말이 못 나오면 그 말들도 갇힌 것으로 칩니다.']],
      ],
      house: ['같은 국면이 세 번 나오면 무승부로 합니다.', '자료마다 말판 그림이 조금씩 달라서, 집을 원과 이어지는 세 점(가운데 한 점이 원과 연결)으로 그렸습니다.'],
      src: [['문화체육관광부 어린이누리집 「고누」', 'https://www.mcst.go.kr/usr/child/enter/play/gonu.jsp'], ['The Korean Game of Hobak Gonu', 'https://lflank.wordpress.com/2023/07/04/the-korean-game-of-hobak-gonu/']],
    },
  };
})();

// ---------------------------------------------------------------- 줄고누 (네줄고누)
const JUL = (() => {
  const N = 4, SP = 100, ADJ = gridAdj(N, N, false);
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
  const at = (r, c) => (r >= 0 && r < N && c >= 0 && c < N) ? r*N + c : -1;
  function caps(bd, t, p){
    const o = 3 - p, out = [], r = Math.floor(t/N), c = t % N;
    for (const [dr, dc] of DIRS){
      const a = at(r+dr, c+dc); if (a < 0 || bd[a] !== o) continue;
      const b = at(r+2*dr, c+2*dc); if (b < 0) continue;
      if (bd[b] === p){ out.push(a); continue; }
      if (bd[b] === o){ const d = at(r+3*dr, c+3*dc); if (d >= 0 && bd[d] === p) out.push(a, b); }
    }
    return out;
  }
  const key = (bd, turn) => bd.join('') + turn;
  return {
    id: 'jul', name: '줄고누', aka: '네줄고누 · 사선고누 · 사마고누 · 정자고누', pieces: 4, kind: '잡기',
    tagline: '네 줄 말판에서 상대 말을 양쪽에서 끼워 잡는 고누',
    pts: gridPts(N, N, SP), edges: gridEdges(N, N), box: [-70, -50, 420, 440],
    coords: gridCoords(N, N, SP, 60), pname: gridName(N, N), quietLimit: 60,
    init(){ const bd = Array(16).fill(0); for (let c = 0; c < 4; c++){ bd[c] = BLUE; bd[12+c] = RED; } return {bd, k4: []}; },
    moves(s){
      const p = s.turn, out = [], k4 = s.k4 || [];
      for (let f = 0; f < 16; f++) if (s.bd[f] === p) for (const t of ADJ[f]) if (s.bd[t] === 0){
        const nb = s.bd.slice(); nb[t] = p; nb[f] = 0;
        const cs = caps(nb, t, p);
        for (const x of cs) nb[x] = 0;
        if (k4.length >= 4 && k4[k4.length-4] === key(nb, 3-p)) continue;   // 바로 전 국면 되풀이 금지
        out.push({f, t, caps: cs});
      }
      return out;
    },
    play(s, m){
      const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; for (const x of m.caps) bd[x] = 0;
      const k4 = (s.k4 || []).concat(key(bd, 3 - s.turn)).slice(-4);
      return {bd, caps: m.caps.length, extra: {k4}};
    },
    status(s){ const o = 3 - s.turn; if (countP(s.bd, s.turn) <= 1) return {winner: o, why: `${NAME[s.turn]} 말이 하나만 남았어요.`}; return null; },
    evaluate(s, p){ const o = 3-p; let m = 0; for (let f = 0; f < 16; f++){ if (s.bd[f] === p) m += ADJ[f].filter(t => !s.bd[t]).length; else if (s.bd[f] === o) m -= ADJ[f].filter(t => !s.bd[t]).length; } return (countP(s.bd, p) - countP(s.bd, o)) * 100 + m * 3; },
    rules: {
      intro: '가로·세로 네 줄 말판에서 두는 줄고누의 대표 놀이예요. 상대 말을 내 말 두 개 사이에 끼우면 잡습니다.',
      sections: [
        ['준비', ['가로·세로 네 줄이 엇갈린 말판(점 16개)을 씁니다.', '홍과 청이 말을 4개씩 갖고 자기 쪽 맨 끝 줄에 늘어놓습니다. 홍이 먼저 둡니다.']],
        ['움직이기', ['말 하나를 줄을 따라 앞·뒤·옆으로 한 칸 옮깁니다. 대각선으로는 못 갑니다.', '바로 전 국면을 그대로 되풀이하는 수는 둘 수 없습니다.']],
        ['잡기', ['내가 말을 옮겨서 상대 말 하나를 가로나 세로로 내 말 두 개 사이에 끼우면 그 말을 잡습니다.', '나란히 붙은 상대 말 두 개를 양쪽에서 끼워도 둘 다 잡습니다.', '한 수로 가로와 세로를 동시에 끼우면 한꺼번에 잡습니다.', '내 말이 상대 말 두 개 사이로 스스로 들어간 것은 잡히지 않습니다.']],
        ['이기기', ['상대 말을 하나만 남기거나, 상대가 움직일 수 없게 만들면 이깁니다.']],
      ],
      house: ['잡기 없이 60수(양쪽 합계)가 지나거나 같은 국면이 세 번 나오면 무승부입니다.'],
      src: [['한국민족문화대백과사전 「고누」', 'https://encykorea.aks.ac.kr/Article/E0003367'], ['Wikipedia, Jul-gonu', 'https://en.wikipedia.org/wiki/Jul-gonu']],
    },
  };
})();

// ---------------------------------------------------------------- 참고누 (곤질고누)
const CHAM = (() => {
  const U = 60, DIR8 = [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
  const P = [];
  for (let k = 0; k < 3; k++){ const s = 3 - k; for (const [dx, dy] of DIR8) P.push([dx*s*U, dy*s*U]); }
  const E = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 8; j++) E.push([k*8+j, k*8+(j+1)%8]);
  for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) E.push([k*8+j, (k+1)*8+j]);
  const ADJ = P.map((_, i) => E.filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]));
  const LINES = [];
  for (let k = 0; k < 3; k++) for (const j of [0,2,4,6]) LINES.push([k*8+j, k*8+j+1, k*8+(j+2)%8]);
  for (let j = 0; j < 8; j++) LINES.push([j, 8+j, 16+j]);
  const LINES_AT = P.map((_, i) => LINES.filter(l => l.includes(i)));
  const RING = ['바깥','가운데','안'], POS = ['왼쪽 위','위','오른쪽 위','오른쪽','오른쪽 아래','아래','왼쪽 아래','왼쪽'];
  const makesMill = (bd, t, p) => LINES_AT[t].some(l => l.every(x => x === t || bd[x] === p));
  function withRemovals(bd, base, p){
    const o = 3 - p, rs = [];
    for (let i = 0; i < 24; i++) if (bd[i] === o) rs.push({...base, r: i});
    return rs.length ? rs : [{...base, r: null}];
  }
  return {
    id: 'cham', name: '참고누', aka: '곤질고누 · 짤고누 · 꽂을고누 · 곤지리', pieces: 12, kind: '잡기',
    tagline: '말 세 개를 한 줄로 세워 "꼰!" 하고 상대 말을 떼어 내는 으뜸 고누',
    pts: P, edges: E, box: [-235, -235, 470, 470], pname: i => RING[Math.floor(i/8)] + ' ' + POS[i%8],
    quietLimit: 80,
    init(){ return {bd: Array(24).fill(0), phase: 'place', hand: [0, 12, 12], marks: []}; },
    moves(s){
      const p = s.turn, out = [];
      if (s.phase === 'place'){
        if (!s.hand[p]) return [];
        for (let t = 0; t < 24; t++){
          if (s.bd[t] || s.marks.includes(t)) continue;
          if (makesMill(s.bd, t, p)){ const nb = s.bd.slice(); nb[t] = p; out.push(...withRemovals(nb, {f: null, t}, p)); }
          else out.push({f: null, t});
        }
        return out;
      }
      for (let f = 0; f < 24; f++) if (s.bd[f] === p) for (const t of ADJ[f]) if (!s.bd[t]){
        const nb = s.bd.slice(); nb[f] = 0;
        if (makesMill(nb, t, p)){ nb[t] = p; out.push(...withRemovals(nb, {f, t}, p)); }
        else out.push({f, t});
      }
      return out;
    },
    play(s, m){
      const bd = s.bd.slice(), p = s.turn;
      let hand = s.hand, marks = s.marks, phase = s.phase;
      if (m.f === null){ bd[m.t] = p; hand = hand.slice(); hand[p]--; }
      else { bd[m.t] = p; bd[m.f] = 0; }
      if (m.r !== undefined && m.r !== null){ bd[m.r] = 0; if (phase === 'place') marks = marks.concat(m.r); }
      if (phase === 'place' && !hand[1] && !hand[2]){ phase = 'move'; marks = []; }
      return {bd, caps: (m.r !== undefined && m.r !== null) ? 1 : 0, extra: {hand, marks, phase}, reset: s.phase === 'place'};
    },
    status(s){
      const p = s.turn;
      if (countP(s.bd, p) + s.hand[p] <= 2) return {winner: 3-p, why: `${NAME[p]} 말이 두 개만 남았어요.`};
      return null;
    },
    noMoves(s){
      if (s.phase === 'move'){
        const o = { ...s, turn: 3 - s.turn };
        if (!this.moves(o).length) return {winner: 0, why: '말판이 꽉 차서 아무도 움직일 수 없어요.'};
      }
      return {winner: 3 - s.turn, why: `${NAME[s.turn]}이 움직일 수 있는 말이 없어요.`};
    },
    evaluate(s, p){
      const o = 3 - p, own = countP(s.bd, p) + s.hand[p], opp = countP(s.bd, o) + s.hand[o];
      let threat = 0;
      for (const l of LINES){ let a = 0, b = 0, e = 0; for (const x of l){ if (s.bd[x] === p) a++; else if (s.bd[x] === o) b++; else e++; } if (a === 2 && e === 1) threat++; if (b === 2 && e === 1) threat--; }
      return (own - opp) * 100 + threat * 18;
    },
    marksOf: s => s.marks || [],
    rules: {
      intro: '고누 가운데 으뜸이라 해서 참고누라 불러요. 말 열두 개를 번갈아 놓다가 세 개를 한 줄로 세우면 "꼰!" 하고 상대 말 하나를 떼어 냅니다.',
      sections: [
        ['준비', ['세 겹 네모를 가로·세로·대각선으로 이은 말판(교차점 24개)을 씁니다.', '홍과 청이 말을 12개씩 손에 들고 시작합니다. 홍이 먼저 둡니다.']],
        ['놓기', ['번갈아 가며 빈 교차점에 말을 하나씩 놓습니다.', '가로·세로·대각선 한 줄에 내 말 세 개가 나란히 서면 "꼰"이 되어 상대 말 하나를 골라 떼어 냅니다.', '말을 떼어 낸 자리에는 말뚝(×)을 박아, 놓기가 끝날 때까지 아무도 놓지 못합니다.']],
        ['옮기기', ['양쪽이 12개를 다 놓으면 말뚝을 치우고, 말을 선을 따라 한 칸씩 옮깁니다.', '옮겨서 꼰을 만들면 역시 상대 말 하나를 떼어 냅니다.']],
        ['이기기', ['상대 말이 두 개만 남으면 이깁니다.']],
      ],
      house: ['옮기기 단계에서 움직일 말이 없으면 집니다. 놓기가 끝났는데 말판이 꽉 차 양쪽 모두 못 움직이면 무승부입니다.', '옮기기 단계에서 잡기 없이 80수가 지나거나 같은 국면이 세 번 나오면 무승부입니다.', '백과사전에는 "곤을 만들 수 있는 말이 세 개 이하면 진다"고 되어 있어 자료마다 조금 다릅니다. 여기서는 "두 개 남으면 진다"를 따랐습니다.'],
      src: [['한국민족문화대백과사전 「고누」', 'https://encykorea.aks.ac.kr/Article/E0003367'], ['문화체육관광부 어린이누리집 「고누」', 'https://www.mcst.go.kr/usr/child/enter/play/gonu.jsp']],
    },
  };
})();

// ---------------------------------------------------------------- 네바퀴고누 (자동차고누)
const BAKWI = (() => {
  const S = 100, L = 16;
  const CIRCUIT = [[1,0],[1,1],[1,2],[1,3],[0,2],[1,2],[2,2],[3,2],[2,3],[2,2],[2,1],[2,0],[3,1],[2,1],[1,1],[0,1]].map(([r,c]) => r*4+c);
  const WHEELS = [{cx:300,cy:0,a0:90},{cx:300,cy:300,a0:180},{cx:0,cy:300,a0:-90},{cx:0,cy:0,a0:0}];
  const ADJ = gridAdj(4, 4, false);
  function capMoves(bd, from, p){
    const best = new Map();
    for (let i = 0; i < L; i++){
      if (CIRCUIT[i] !== from) continue;
      for (const d of [1, -1]){
        let k = i, wheels = 0; const path = [{t:'p', sq:from}];
        for (let s = 0; s < 2*L; s++){
          const nk = (k + d + L) % L, bk = d === 1 ? k : nk;
          if (bk % 4 === 3){ wheels++; path.push({t:'w', w:(bk-3)/4, rev:d === -1}); }
          k = nk; const sq = CIRCUIT[k]; path.push({t:'p', sq});
          if (sq === from) continue;
          const v = bd[sq]; if (v === 0) continue;
          if (v !== p && wheels > 0){ const prev = best.get(sq); if (!prev || prev.path.length > path.length) best.set(sq, {f: from, t: sq, caps: [sq], wheels, path: path.slice()}); }
          break;
        }
      }
    }
    return [...best.values()];
  }
  function wheelPts(w, rev){ const {cx, cy, a0} = WHEELS[w], pts = []; for (let i = 1; i < 40; i++){ const t = rev ? 1 - i/40 : i/40, a = (a0 - 270*t) * Math.PI/180; pts.push([cx + S*Math.cos(a), cy + S*Math.sin(a)]); } return pts; }
  const all = (bd, p) => { const o = []; for (let f = 0; f < 16; f++) if (bd[f] === p){ o.push(...capMoves(bd, f, p)); for (const t of ADJ[f]) if (!bd[t]) o.push({f, t, caps: []}); } return o; };
  return {
    id: 'bakwi', name: '네바퀴고누', aka: '자동차고누 · 자전거고누', pieces: 4, kind: '잡기',
    tagline: '네 귀퉁이 바퀴를 한 바퀴 돌아 나와야만 잡을 수 있는 고누',
    pts: gridPts(4, 4, S), edges: gridEdges(4, 4), box: [-160, -130, 620, 590],
    coords: (flip) => { const o = []; for (let c = 0; c < 4; c++) o.push({x: c*S, y: 432, t: 'ABCD'[flip ? 3-c : c]}); for (let r = 0; r < 4; r++) o.push({x: -130, y: r*S, t: String(flip ? r+1 : 4-r)}); return o; },
    pname: gridName(4, 4), quietLimit: 60,
    decor(svg, h){ for (let w = 0; w < 4; w++){ const {cx, cy, a0} = WHEELS[w], r0 = a0*Math.PI/180, r1 = (a0-270)*Math.PI/180; h.poly(svg, [[cx+S*Math.cos(r0), cy+S*Math.sin(r0)], ...wheelPts(w, false), [cx+S*Math.cos(r1), cy+S*Math.sin(r1)]], 'line'); } },
    pathPts(m, XY){ const pts = []; for (const s of m.path) if (s.t === 'p') pts.push(XY(s.sq)); else pts.push(...wheelPts(s.w, s.rev)); return pts; },
    init(){ const bd = Array(16).fill(0); for (let c = 0; c < 4; c++){ bd[c] = BLUE; bd[12+c] = RED; } return {bd}; },
    moves(s){ return all(s.bd, s.turn); },
    play(s, m){ const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; return {bd, caps: m.caps.length}; },
    status(s){ if (countP(s.bd, s.turn) === 0) return {winner: 3 - s.turn, why: `${NAME[s.turn]} 말을 모두 잡았어요.`}; return null; },
    evaluate(s, p){ const o = 3-p, mm = all(s.bd, p), om = all(s.bd, o); const mt = new Set(mm.filter(m => m.caps.length).map(m => m.t)).size, ot = new Set(om.filter(m => m.caps.length).map(m => m.t)).size; return (countP(s.bd, p) - countP(s.bd, o)) * 100 + mt * 18 - ot * 12 + (mm.length - om.length) * 2; },
    rules: {
      intro: '말판 네 귀퉁이의 둥근 바퀴를 한 바퀴 돌아 나와야만 상대 말을 잡을 수 있어요. 평소엔 한 칸씩 걷다가, 바퀴를 탄 말만 길게 달려 상대를 잡습니다.',
      sections: [
        ['준비', ['가로·세로 네 줄 말판(점 16개)과 네 귀퉁이 바퀴를 씁니다.', '홍과 청이 말을 4개씩 갖고 자기 쪽 맨 끝 줄에 놓습니다. 홍이 먼저 둡니다.']],
        ['걷기', ['말 하나를 줄을 따라 앞·뒤·옆으로 한 칸 옮깁니다. 대각선으로는 못 갑니다.']],
        ['잡기 — 바퀴 타기', ['바퀴와 이어진 안쪽 줄(가운데 가로 두 줄, 세로 두 줄)의 말만 바퀴를 탈 수 있습니다.', '줄을 따라 곧게 달리다 바퀴를 돌아 나와, 처음 부딪치는 말이 상대 말이면 잡고 그 자리에 섭니다.', '빈 점은 몇 칸이든 지나고, 바퀴를 여러 개 이어 돌아도 됩니다.', '길목에 자기 말이 있으면 막힙니다. 떠난 출발점은 빈 점으로 칩니다.', '바퀴를 한 번도 돌지 않고는 잡을 수 없습니다.']],
        ['이기기', ['상대 말을 먼저 모두 잡으면 이깁니다.']],
      ],
      house: ['시작 배치(양쪽 맨 끝 줄)와 홍 선공은 이 판에서 정했습니다.', '움직일 수 있는 말이 없으면 집니다. 잡기 없이 60수가 지나거나 같은 국면이 세 번 나오면 무승부입니다.', '계산해 보면 양쪽이 완벽하게 둘 때 후공(청)이 이기는 판입니다. 청의 첫 응수는 귀퉁이 말이어야 합니다.'],
      src: [['한국민족문화대백과사전 「고누」 자동차고누', 'https://encykorea.aks.ac.kr/Article/E0003367']],
    },
  };
})();

// ---------------------------------------------------------------- 네밭고누
const NEBAT = (() => {
  const N = 4, SP = 100, ADJ = gridAdj(N, N, false);
  const at = (r, c) => (r >= 0 && r < N && c >= 0 && c < N) ? r*N + c : -1;
  function all(bd, p){
    const o = [];
    for (let f = 0; f < 16; f++){
      if (bd[f] !== p) continue;
      const r = Math.floor(f/N), c = f % N;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const a = at(r+dr, c+dc); if (a < 0) continue;
        if (bd[a] === 0){ o.push({f, t: a, caps: []}); continue; }
        if (bd[a] === p){ const b = at(r+2*dr, c+2*dc); if (b >= 0 && bd[b] === 3-p) o.push({f, t: b, caps: [b], jump: a}); }
      }
    }
    return o;
  }
  return {
    id: 'nebat', name: '네밭고누', aka: 'Four-field kono', pieces: 8, kind: '잡기',
    tagline: '꽉 찬 말판에서 내 말을 딛고 넘어 상대 말을 잡는 고누',
    pts: gridPts(N, N, SP), edges: gridEdges(N, N), box: [-70, -50, 420, 440],
    coords: gridCoords(N, N, SP, 60), pname: gridName(N, N), quietLimit: 60,
    init(){ const bd = Array(16).fill(0); for (let i = 0; i < 8; i++){ bd[i] = BLUE; bd[8+i] = RED; } return {bd}; },
    moves(s){ return all(s.bd, s.turn); },
    play(s, m){ const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; return {bd, caps: m.caps.length}; },
    status(s){ if (countP(s.bd, s.turn) <= 1) return {winner: 3 - s.turn, why: `${NAME[s.turn]} 말이 하나만 남았어요.`}; return null; },
    evaluate(s, p){ const o = 3-p; return (countP(s.bd, p) - countP(s.bd, o)) * 100 + (all(s.bd, p).length - all(s.bd, o).length) * 4; },
    rules: {
      intro: '네 줄 말판을 양쪽 말로 꽉 채우고 시작해요. 내 말 하나를 딛고 넘어 바로 뒤의 상대 말을 잡는 고누입니다.',
      sections: [
        ['준비', ['가로·세로 네 줄 말판(점 16개)을 씁니다.', '홍과 청이 말을 8개씩 갖고, 각자 자기 쪽 두 줄을 꽉 채웁니다. 홍이 먼저 둡니다.']],
        ['움직이기', ['말 하나를 앞·뒤·옆으로 한 칸 빈 점에 옮기거나, 잡기를 합니다. 대각선으로는 못 갑니다.', '처음엔 말판이 꽉 차 있어서 첫수는 반드시 잡기입니다.']],
        ['잡기', ['바로 옆의 내 말을 뛰어넘어, 그 너머에 붙은 상대 말 자리에 내려앉으며 그 말을 잡습니다.', '한 번에 한 마리만 잡을 수 있고, 잡기는 의무가 아닙니다.']],
        ['이기기', ['상대 말을 하나만 남기거나, 상대가 움직이지도 잡지도 못하게 만들면 이깁니다.']],
      ],
      house: ['어느 쪽 두 줄이 누구 것인지는 자료에 없어 각자 자기 쪽 두 줄로 정했습니다.', '잡기 없이 60수가 지나거나 같은 국면이 세 번 나오면 무승부입니다.'],
      src: [['Wikipedia, Four-field kono', 'https://en.wikipedia.org/wiki/Four-field_kono']],
    },
  };
})();

// ---------------------------------------------------------------- 오밭고누
const OBAT = (() => {
  const N = 5, SP = 90, ADJ = gridAdj(N, N, true);
  const START = {1: [20,21,22,23,24,15,19], 2: [0,1,2,3,4,5,9]};
  const all = (bd, p) => { const o = []; for (let f = 0; f < 25; f++) if (bd[f] === p) for (const t of ADJ[f]) if (!bd[t]) o.push({f, t}); return o; };
  return {
    id: 'obat', name: '오밭고누', aka: 'Five-field kono', pieces: 7, kind: '자리 바꾸기',
    tagline: '말 일곱 개를 대각선으로 몰아 상대 진영을 먼저 차지하는 고누',
    pts: gridPts(N, N, SP), edges: gridEdges(N, N), box: [-70, -50, 500, 520],
    coords: gridCoords(N, N, SP, 60), pname: gridName(N, N), quietLimit: 0, plyLimit: 200,
    targets: p => START[3-p],
    init(){ const bd = Array(25).fill(0); for (const i of START[1]) bd[i] = RED; for (const i of START[2]) bd[i] = BLUE; return {bd}; },
    moves(s){ return all(s.bd, s.turn); },
    play(s, m){ const bd = s.bd.slice(); bd[m.t] = bd[m.f]; bd[m.f] = 0; return {bd, caps: 0}; },
    status(s){
      const mover = 3 - s.turn;
      if (START[s.turn].every(i => s.bd[i] === mover)) return {winner: mover, why: `${NAME[mover]}이 상대 진영 일곱 자리를 모두 차지했어요.`};
      return null;
    },
    evaluate(s, p){
      let v = 0;
      for (let i = 0; i < 25; i++){ const r = Math.floor(i/5); if (s.bd[i] === RED) v += (4 - r) * 6 + (START[2].includes(i) ? 8 : 0); else if (s.bd[i] === BLUE) v -= r * 6 + (START[1].includes(i) ? 8 : 0); }
      return p === RED ? v : -v;
    },
    rules: {
      intro: '다섯 줄 말판에서 말 일곱 개를 대각선으로만 움직여, 상대가 처음 서 있던 자리를 먼저 모두 차지하는 놀이예요. 잡기가 없습니다.',
      sections: [
        ['준비', ['가로·세로 다섯 줄 말판(점 25개)을 씁니다.', '홍과 청이 말을 7개씩 갖고, 자기 쪽 맨 끝 줄 다섯 점과 그 앞줄 양 끝 두 점에 놓습니다. 홍이 먼저 둡니다.']],
        ['움직이기', ['말 하나를 대각선으로 한 칸, 빈 점에 옮깁니다. 앞으로도 뒤로도 갈 수 있습니다.', '말을 뛰어넘거나 잡을 수 없습니다.']],
        ['이기기', ['내 말 일곱 개로 상대가 처음 놓였던 일곱 자리를 먼저 모두 차지하면 이깁니다.']],
      ],
      house: ['움직일 수 있는 말이 없으면 집니다.', '200수가 지나도록 승부가 안 나거나 같은 국면이 세 번 나오면 무승부입니다.'],
      src: [['Wikipedia, Five-field kono', 'https://en.wikipedia.org/wiki/Five-field_kono']],
    },
  };
})();

const GAMES = [UMUL, HOBAK, JUL, CHAM, BAKWI, NEBAT, OBAT];
const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

// ===== 공통 진행 =====
const posKey = s => s.bd.join('') + s.turn + (s.phase === 'place' ? 'p' + s.hand.join('') + s.marks.join(',') : '');
function newState(g){
  const s = Object.assign({turn: RED, ply: 0, quiet: 0, reps: {}}, g.init());
  s.reps[posKey(s)] = 1;
  return s;
}
function legal(g, s){ return g.moves(s); }
function moveKey(m){ return `${m.f === null || m.f === undefined ? '-' : m.f}>${m.t}${m.r !== undefined && m.r !== null ? 'x' + m.r : ''}`; }
function applyMove(g, s, m, fast){
  const r = g.play(s, m);
  const n = Object.assign({}, s, r.extra || {}, {bd: r.bd, turn: 3 - s.turn, ply: s.ply + 1, quiet: (r.caps || r.reset) ? 0 : s.quiet + 1});
  if (!fast){
    n.reps = (r.caps || r.reset) ? {} : Object.assign({}, s.reps);
    const k = posKey(n); n.reps[k] = (n.reps[k] || 0) + 1;
  }
  return n;
}
function outcome(g, s, moves){
  const st = g.status ? g.status(s) : null; if (st) return st;
  if (!(moves || g.moves(s)).length) return g.noMoves ? g.noMoves(s) : {winner: 3 - s.turn, why: `${NAME[s.turn]}이 움직일 수 있는 말이 없어요.`};
  if (s.reps && s.reps[posKey(s)] >= 3) return {winner: 0, why: '같은 국면이 세 번 나왔어요.'};
  if (g.quietLimit && s.quiet >= g.quietLimit && !(s.phase === 'place')) return {winner: 0, why: `잡기 없이 ${g.quietLimit}수가 지났어요.`};
  if (g.plyLimit && s.ply >= g.plyLimit) return {winner: 0, why: `${g.plyLimit}수가 지났어요.`};
  return null;
}

const isCap = m => (m.caps && m.caps.length > 0) || (m.r !== undefined && m.r !== null);
function logEntry(g, s, m){
  const nm = g.pname, who = NAME[s.turn];
  let x = (m.f === null || m.f === undefined) ? `${who} ${nm(m.t)}에 놓음` : `${who} ${nm(m.f)}→${nm(m.t)}`;
  if (m.caps && m.caps.length) x += m.wheels ? ` (바퀴${m.wheels > 1 ? ' ' + m.wheels + '번' : ''}) ${m.caps.length}개 잡음` : ` · ${m.caps.length}개 잡음`;
  if (m.r !== undefined && m.r !== null) x += ` · 꼰! ${nm(m.r)} 떼어 냄`;
  return {x, c: isCap(m)};
}

// ===== 컴퓨터 =====
function aiChoose(g, s, level){
  const moves = g.moves(s);
  if (!moves.length) return null;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  if (level === 'easy'){
    const caps = moves.filter(m => (m.caps && m.caps.length) || (m.r !== undefined && m.r !== null));
    return (caps.length && Math.random() < 0.5) ? rnd(caps) : rnd(moves);
  }
  const budget = level === 'hard' ? 900 : 200, maxDepth = level === 'hard' ? 12 : 3;
  const t0 = Date.now(); let out = false;
  const WIN = 100000;
  function search(st, depth, alpha, beta){
    if (Date.now() - t0 > budget){ out = true; return 0; }
    const ms = g.moves(st);
    const o = outcome(g, st, ms);
    if (o){ if (!o.winner) return 0; return o.winner === st.turn ? WIN + depth : -WIN - depth; }
    if (depth === 0) return g.evaluate(st, st.turn);
    ms.sort((a, b) => capScore(b) - capScore(a));
    let best = -Infinity;
    for (const m of ms){
      const v = -search(applyMove(g, st, m, true), depth - 1, -beta, -alpha);
      if (out) return 0;
      if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
    }
    return best;
  }
  const capScore = m => ((m.caps && m.caps.length) || (m.r !== undefined && m.r !== null)) ? 1 : 0;
  let bestMoves = moves.slice(), order = shuffle(moves);
  for (let d = 1; d <= maxDepth; d++){
    let best = -Infinity, cands = [], scored = [];
    for (const m of order){
      const n = applyMove(g, s, m, false);
      const o = outcome(g, n);
      let v;
      if (o){ v = !o.winner ? 0 : (o.winner === s.turn ? WIN + 99 : -WIN - 99); }
      else v = -search(n, d - 1, -Infinity, Infinity);
      if (out) break;
      scored.push([v, m]);
      if (v > best){ best = v; cands = [m]; } else if (v === best) cands.push(m);
    }
    if (out) break;
    bestMoves = cands;
    order = scored.sort((a, b) => b[0] - a[0]).map(x => x[1]);
    if (best >= WIN) break;
  }
  return rnd(bestMoves);
}
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ===== 아직 규칙이 정리되지 않은 고누 =====
const UNSORTED = [
  {name: '사방고누', known: '말 4개씩, 교차점 9개 판에서 번갈아 옮겨 세 개를 먼저 나란히 놓으면 이긴다는 설명이 있습니다.', missing: '판의 선(대각선 유무)과 시작 배치가 자료마다 달라 확정할 수 없습니다.'},
  {name: '밭고누', known: '2×2 칸 판에서 말 3개씩, 상하좌우로 한 칸씩 옮겨 상대를 가두는 놀이로 소개됩니다.', missing: '시작 배치가 그림으로만 전해져 확인하지 못했습니다.'},
  {name: '이사고누', known: '말 7개씩, 가로·세로·대각선 한 칸씩 옮겨 상대 출발 자리를 먼저 차지하는 놀이로 소개됩니다.', missing: '말판 모양과 배치가 없습니다(오밭고누와 같은 놀이일 가능성).'},
  {name: '문살고누', known: '말 5개씩, 상하좌우 한 칸, 앞의 말을 뛰어넘어 잡고 이어서 넘을 수 있다는 설명이 있습니다.', missing: '말판과 시작 배치, 승리 조건이 없습니다.'},
  {name: '패랭이고누', known: '이름만 전해집니다.', missing: '말판·말 수·규칙 모두 없습니다.'},
  {name: '팔팔고누', known: '이름만 전해집니다.', missing: '말판·말 수·규칙 모두 없습니다.'},
  {name: '포위고누', known: '이름만 전해집니다.', missing: '말판·말 수·규칙 모두 없습니다.'},
  {name: '왕고누 · 장수고누', known: '이름만 전해집니다.', missing: '말판·말 수·규칙 모두 없습니다.'},
  {name: '넘기고누 · 나비고누 · 나홀로고누', known: '전통놀이 현대화 교구(말판 15종)에 이름이 나옵니다.', missing: '공개된 자료에 규칙이 없습니다.'},
  {name: '바퀴고누', known: '같은 15종 목록에 네바퀴고누와 별도 이름으로 나옵니다.', missing: '공개된 자료에 말판·규칙이 없습니다.'},
  {name: '다섯줄 · 여섯줄 · 아홉줄고누', known: '네줄고누와 같은 규칙에 줄 수만 늘린 놀이로 소개됩니다.', missing: '줄 수에 따른 말 수와 배치가 정해져 있지 않습니다.'},
  {name: '팔꼰자 (제주)', known: '특정 말 넷은 앞으로 몇 칸이든, 나머지는 앞·옆으로 두 칸씩 뛰고, 갈 자리의 상대 말을 잡는다고 합니다.', missing: '말판 모양, 말 수, 어떤 말이 특별한지가 없습니다.'},
];

if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports = {GAMES, GAME_BY_ID, newState, legal, applyMove, outcome, aiChoose, moveKey, posKey, logEntry, RED, BLUE};
