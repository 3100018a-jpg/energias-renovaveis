/* =========================================================
   Geração dos mapas: mapa central (baseado na imagem de
   referência) e um mapa específico para cada missão.
   Coordenadas de projeto em "imagem": ix (0 esq → 1 dir),
   iy (0 topo → 1 base).
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U, T = ERS.T;
  const MAPAS = (ERS.MAPAS = {});

  // ---------------- ferramentas ----------------
  function base(m, op) {
    op = op || {};
    const costa = op.costa || (() => 2);
    const mont = op.montanha || (() => -1);
    const solo = op.solo === undefined ? T.GRAMA : op.solo;
    m.cada((x, y, ix, iy) => {
      const n = m.ruido.fbm(x * 0.07, y * 0.07, 4);
      const c = costa(ix) + (m.ruido(x * 0.21, y * 0.21) - 0.5) * 0.03;
      if (iy > c) {
        m.set(x, y, iy > c + 0.07 ? T.MAR_FUNDO : iy > c + 0.025 ? T.MAR : T.AGUA_RASA, 0);
        return;
      }
      // colinas amplas e contínuas (ruído de baixa frequência), sem degraus soltos
      const colina = m.ruido.fbm(x * 0.03 + 7, y * 0.03 + 3, 3);
      let h = 1 + (colina > 0.66 ? 1 : 0) + (colina > 0.76 ? 1 : 0);
      let t = solo;
      if (iy > c - 0.03 && op.praia !== false) { t = T.AREIA; h = iy > c - 0.016 ? 0 : 1; }
      const mt = mont(ix);
      if (iy < mt) {
        const k = (mt - iy) * (op.hMont || 40) * (0.65 + 0.7 * n);
        h = Math.min(op.hMax || 9, 1 + Math.round(k));
        t = h >= (op.hRocha || 5) ? T.ROCHA : h >= 3 ? T.FLORESTA : solo;
      }
      m.set(x, y, t, h);
    });
    // remove saliências e buracos isolados de um único tile
    for (let y = 1; y < m.N - 1; y++) for (let x = 1; x < m.N - 1; x++) {
      const i = m.i(x, y), h = m.alt[i];
      if (T.props[m.tipo[i]].agua) continue;
      const vz = [m.alt[i - 1], m.alt[i + 1], m.alt[i - m.N], m.alt[i + m.N]];
      const maiores = vz.filter((v) => v > h).length, menores = vz.filter((v) => v < h).length;
      if (menores >= 3) m.alt[i] = Math.max(...vz.filter((v) => v < h));
      else if (maiores >= 3) m.alt[i] = Math.min(...vz.filter((v) => v > h));
    }
    // suaviza o relevo: evita paredões e degraus bruscos
    const N = m.N;
    for (let pass = 0; pass < 2; pass++) {
      const h0 = Int8Array.from(m.alt);
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
        const i = m.i(x, y), h = h0[i];
        if (h < 2 || T.props[m.tipo[i]].agua) continue;
        const sm = h0[i - 1] + h0[i + 1] + h0[i - N] + h0[i + N];
        const nh = Math.max(1, Math.round((h * 2 + sm) / 6));
        m.alt[i] = nh;
        if (m.tipo[i] === T.ROCHA && nh < (op.hRocha || 5) - 1) m.tipo[i] = T.FLORESTA;
      }
    }
  }
  // círculo/elipse com bordas irregulares
  function zona(m, cx, cy, rx, ry, fn, irr) { m.elipse(cx, cy, rx, ry, fn, irr === undefined ? 0.5 : irr); }
  function tipoEm(m, cx, cy, rx, ry, tipo, h, irr) {
    zona(m, cx, cy, rx, ry, (x, y) => { m.set(x, y, tipo, h === undefined ? Math.max(1, m.H(x, y)) : h); }, irr);
  }
  function rio(m, pts, larg, tipo, hFn) {
    const tt = tipo === undefined ? T.RIO : tipo;
    const cel = (m._celRio = []);
    const tp = m.caminho(pts, larg, (x, y) => {
      const h = hFn ? hFn(x, y) : 0;
      m.set(x, y, tt, h);
      cel.push([x, y]);
    });
    // rios estreitos: liga trechos que só se tocam pela ponta (evita poças soltas)
    cel.forEach(([x, y]) => {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((d) => {
        const ax = x + d[0], ay = y + d[1];
        if (!m.dentro(ax, ay) || m.T(ax, ay) !== tt || m.T(x + d[0], y) === tt || m.T(x, y + d[1]) === tt) return;
        if (m.dentro(x + d[0], y) && !m.bloq[m.i(x + d[0], y)]) m.set(x + d[0], y, tt, hFn ? hFn(x + d[0], y) : 0);
      });
    });
    return tp;
  }
  // estrada contínua: cada tile toca o próximo por um lado inteiro (nunca só pela ponta)
  // linha 4-conectada entre dois tiles (um passo por eixo de cada vez, em escada suave)
  function linha4(a, b) {
    let x = a[0], y = a[1];
    const out = [];
    const dx = Math.abs(b[0] - x), dy = Math.abs(b[1] - y), sx = Math.sign(b[0] - x), sy = Math.sign(b[1] - y);
    let err = dx - dy;
    while (x !== b[0] || y !== b[1]) {
      if (err * 2 > -dy && x !== b[0]) { err -= dy; x += sx; }
      else { err += dx; y += sy; }
      out.push([x, y]);
    }
    return out;
  }
  function estrada(m, pts) {
    const tp = pts.map((p) => m.tile(p[0], p[1]));
    let cam = [tp[0]];
    for (let k = 1; k < tp.length; k++) cam = cam.concat(linha4(cam[cam.length - 1], tp[k]));
    assentar(m, cam);
  }
  // assenta uma estrada sobre uma sequência de tiles vizinhos: cada travessia de rio vira
  // uma ponte reta, perpendicular a um dos eixos, com cabeceiras retas e alinhadas nos dois lados
  function assentar(m, cam) {
    const put = (x, y) => {
      if (!m.dentro(x, y)) return;
      const t = m.T(x, y);
      if (T.ehAgua(t)) m.set(x, y, T.PONTE, 1);
      else if (t !== T.PONTE) m.set(x, y, T.ESTRADA, Math.max(1, Math.min(m.H(x, y), 2)));
    };
    const agua = (q) => m.dentro(q[0], q[1]) && T.ehAgua(m.T(q[0], q[1]));
    const terra = (q) => m.dentro(q[0], q[1]) && !T.ehAgua(m.T(q[0], q[1])) && !m.bloq[m.i(q[0], q[1])] && m.T(q[0], q[1]) !== T.LAVA;
    const igual = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
    const fim = [cam[0]];
    for (let i = 1; i < cam.length; i++) {
      if (!agua(cam[i]) || agua(cam[i - 1])) { fim.push(cam[i]); continue; }
      let j = i; while (j < cam.length && agua(cam[j])) j++;
      if (j >= cam.length) { for (let k = i; k < cam.length; k++) fim.push(cam[k]); break; }
      const A = cam[i - 1], B = cam[j];
      const eixoX = Math.abs(B[0] - A[0]) >= Math.abs(B[1] - A[1]);
      const st = eixoX ? [Math.sign(B[0] - A[0]) || 1, 0] : [0, Math.sign(B[1] - A[1]) || 1];
      const reta = [];
      let q = [A[0] + st[0], A[1] + st[1]];
      while (agua(q) && reta.length < 24) { reta.push(q); q = [q[0] + st[0], q[1] + st[1]]; }
      if (!reta.length || agua(q) || !m.dentro(q[0], q[1])) { for (let k = i; k <= j; k++) fim.push(cam[k]); i = j; continue; }
      // cabeceira de entrada: o tile anterior também fica no eixo da ponte
      const A0 = [A[0] - st[0], A[1] - st[1]];
      if (terra(A0) && fim.length >= 2 && !igual(fim[fim.length - 2], A0)) {
        fim.pop();
        const ant = fim[fim.length - 1];
        if (!igual(ant, A0)) linha4(ant, A0).filter((r) => !agua(r)).forEach((r) => fim.push(r));
        fim.push(A);
      }
      reta.forEach((r) => fim.push(r));
      fim.push(q);
      // cabeceira de saída: mais um tile reto antes de retomar o traçado
      const q2 = [q[0] + st[0], q[1] + st[1]];
      let ult = q;
      if (terra(q2) && !igual(q2, B) && Math.abs(B[0] - q[0]) + Math.abs(B[1] - q[1]) > 1) { fim.push(q2); ult = q2; }
      linha4(ult, B).filter((r) => !agua(r)).forEach((r) => fim.push(r));
      i = j;
    }
    fim.forEach((q) => put(q[0], q[1]));
    return fim;
  }

  // ---------- rede viária: tudo ligado, sem trechos que terminam no nada ----------
  const ehVia = (m, x, y) => m.dentro(x, y) && (m.T(x, y) === T.ESTRADA || m.T(x, y) === T.PONTE);
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function grauVia(m, x, y) { let n = 0; D4.forEach((d) => { if (ehVia(m, x + d[0], y + d[1])) n++; }); return n; }
  // tiles ocupados por pontos de interesse e construções (não podem virar estrada)
  function mascaraOcupada(m) {
    const oc = new Uint8Array(m.N * m.N);
    m.ents.forEach((e) => {
      if (e.kind === 'deco' && !e.fp) return;
      const w = e.fp ? e.fp[0] : 1, d = e.fp ? e.fp[1] : 1, x0 = Math.floor(e.x), y0 = Math.floor(e.y);
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) if (m.dentro(x0 + i, y0 + j)) oc[m.i(x0 + i, y0 + j)] = e.spr === 'torreLinha' ? 2 : 1;
    });
    return oc;
  }
  function componentes(m) {
    const N = m.N, comp = new Int32Array(N * N).fill(-1), tam = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!ehVia(m, x, y) || comp[m.i(x, y)] >= 0) continue;
      const id = tam.length; let n = 0; const fila = [[x, y]]; comp[m.i(x, y)] = id;
      while (fila.length) {
        const [cx, cy] = fila.pop(); n++;
        D4.forEach((d) => { const nx = cx + d[0], ny = cy + d[1]; if (ehVia(m, nx, ny) && comp[m.i(nx, ny)] < 0) { comp[m.i(nx, ny)] = id; fila.push([nx, ny]); } });
      }
      tam.push(n);
    }
    return { comp, tam };
  }
  // caminho de menor custo por terra (rios viram pontes) entre um conjunto de origens e um alvo
  function rotaEstrada(m, origens, ehAlvo, op) {
    op = op || {};
    const N = m.N, oc = op.oc || mascaraOcupada(m);
    const custo = new Float32Array(N * N).fill(1e9), veio = new Int32Array(N * N).fill(-1), pAgua = new Uint8Array(N * N);
    const heap = [];
    const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], u = heap.pop(); if (heap.length) { heap[0] = u; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let s = k; if (a < heap.length && heap[a][0] < heap[s][0]) s = a; if (b < heap.length && heap[b][0] < heap[s][0]) s = b; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; k = s; } } return top; };
    origens.forEach((q) => { const i = m.i(q[0], q[1]); custo[i] = 0; push(i, 0); });
    const limite = op.limite || 60;
    let achou = -1;
    while (heap.length) {
      const [cst, cur] = pop();
      if (cst > custo[cur]) continue;
      if (cst > limite) break;
      const cx = cur % N, cy = (cur / N) | 0;
      if (custo[cur] > 0 && ehAlvo(cx, cy)) { achou = cur; break; }
      for (const d of D4) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!m.dentro(nx, ny)) continue;
        const ni = m.i(nx, ny), t = m.tipo[ni];
        const alvo = ehAlvo(nx, ny);
        if (!alvo && (oc[ni] || (m.bloq[ni] && t !== T.ESTRADA && t !== T.PONTE))) continue;
        const pimg = m.img(nx, ny);
        if (pimg[0] < 0.01 || pimg[0] > 0.99 || pimg[1] < 0.01 || pimg[1] > 0.99) continue;
        let c = 1, ag = 0;
        // estradas novas não correm coladas às existentes (evita pistas duplas e "praças" de asfalto)
        if (t !== T.ESTRADA && t !== T.PONTE && !alvo && D4.some((d) => { const q = [nx + d[0], ny + d[1]]; return (q[0] !== cx || q[1] !== cy) && ehVia(m, q[0], q[1]); })) c += 6;
        if (t === T.ESTRADA || t === T.PONTE) c = 0.35;
        else if (T.ehAgua(t)) {
          if (t !== T.RIO && t !== T.REJEITO) continue;
          c = 6; ag = pAgua[cur] + 1;
          if (ag > (op.maxAgua || 7)) continue;
        } else {
          if (t === T.LAVA || !T.props[t].andavel) continue;
          if (t === T.FLORESTA) c = 2.2; else if (t === T.ROCHA || t === T.MINA || t === T.ESTERIL || t === T.BASALTO) c = 3; else if (t === T.CANA || t === T.QUEIMADO || t === T.CINZA_VULC) c = 1.4;
          const dh = Math.abs(m.alt[ni] - m.alt[cur]);
          if (!T.ehAgua(m.tipo[cur]) && dh > 1) c += (dh - 1) * 5;
        }
        const nc = cst + c;
        if (nc < custo[ni]) { custo[ni] = nc; veio[ni] = cur; pAgua[ni] = ag; push(ni, nc); }
      }
    }
    if (achou < 0) return null;
    const cam = [];
    for (let k = achou; k >= 0; k = veio[k]) { cam.push([k % N, (k / N) | 0]); if (custo[k] === 0) break; }
    return cam.reverse();
  }
  // liga ao núcleo principal (a cidade) os trechos de estrada que ficaram soltos
  function conectarRede(m) {
    const tentados = new Set();
    for (let it = 0; it < 12; it++) {
      const { comp, tam } = componentes(m);
      if (tam.length <= 1) return;
      let principal = 0; tam.forEach((n, k) => { if (n > tam[principal]) principal = k; });
      let alvo = -1; tam.forEach((n, k) => { if (k !== principal && !tentados.has(k + ':' + n) && (alvo < 0 || n > tam[alvo])) alvo = k; });
      if (alvo < 0) return;
      tentados.add(alvo + ':' + tam[alvo]);
      const origens = [];
      for (let i = 0; i < comp.length; i++) if (comp[i] === alvo) origens.push([i % m.N, (i / m.N) | 0]);
      const cam = rotaEstrada(m, origens, (x, y) => comp[m.i(x, y)] === principal, { limite: 70 });
      if (cam && cam.length > 1) assentar(m, cam);
    }
  }
  // comprimento do trecho sem saída, da ponta até o primeiro cruzamento
  function trechoPonta(m, x, y) {
    const lista = [[x, y]];
    let ant = null, cur = [x, y];
    for (let k = 0; k < 60; k++) {
      const viz = D4.map((d) => [cur[0] + d[0], cur[1] + d[1]]).filter((q) => ehVia(m, q[0], q[1]) && !(ant && q[0] === ant[0] && q[1] === ant[1]));
      if (viz.length !== 1) break;
      ant = cur; cur = viz[0];
      if (grauVia(m, cur[0], cur[1]) !== 2) break;
      lista.push(cur);
    }
    return lista;
  }
  const DESTINOS = {
    rural: ['fazenda', 'galpaoRural', 'silos', 'fazenda', 'curral'],
    mata: ['mirante', 'galpaoRural', 'casa'],
    praia: ['quiosque', 'casa', 'quiosque'],
    mina: ['galpaoRural', 'caixaDagua'],
    cidade: ['posto', 'casa', 'galpaoRural'],
  };
  function contextoPonta(m, x, y) {
    const cont = {};
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { if (!m.dentro(x + dx, y + dy)) continue; const t = m.T(x + dx, y + dy); cont[t] = (cont[t] || 0) + 1; }
    const n = (...ts) => ts.reduce((s, t) => s + (cont[t] || 0), 0);
    if (n(T.URBANO, T.PATIO) > 3) return 'cidade';
    if (n(T.MINA, T.ESTERIL, T.RAMPA_MINA, T.TERRA) > 12) return 'mina';
    if (n(T.AREIA, T.MANGUE) > 12) return 'praia';
    if (n(T.FLORESTA, T.ROCHA) > 22) return 'mata';
    return 'rural';
  }
  // cada ponta sem saída: ou leva a algum lugar, ou sai do mapa, ou fecha um anel, ou ganha
  // um destino (sítio, galpão, posto, mirante...), ou é removida
  function resolverPontas(m) {
    const N = m.N;
    const r = U.rng(m.seed + 91);
    for (let rodada = 0; rodada < 3; rodada++) {
      const oc = mascaraOcupada(m);
      const destinoPerto = (x, y) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (!m.dentro(nx, ny) || (!dx && !dy)) continue;
          const t = m.T(nx, ny);
          if (t === T.URBANO || t === T.PATIO || t === T.CAIS) return true;
          if (oc[m.i(nx, ny)] === 1) return true;
        }
        const p = m.img(x, y);
        return p[0] < 0.02 || p[0] > 0.98 || p[1] < 0.02 || p[1] > 0.98;
      };
      const pontas = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m.T(x, y) === T.ESTRADA && grauVia(m, x, y) === 1) pontas.push([x, y]);
      if (!pontas.length) return;
      let mudou = false;
      pontas.forEach(([x, y]) => {
        if (m.T(x, y) !== T.ESTRADA || grauVia(m, x, y) !== 1 || destinoPerto(x, y)) return;
        const trecho = trechoPonta(m, x, y);
        const nb = D4.map((d) => [x + d[0], y + d[1]]).find((q) => ehVia(m, q[0], q[1]));
        const d = [x - nb[0], y - nb[1]];
        const aparar = () => { trecho.forEach((q) => { if (m.T(q[0], q[1]) === T.ESTRADA && !destinoPerto(q[0], q[1])) { const viz = {}; D4.forEach((dd) => { const t = m.T(q[0] + dd[0], q[1] + dd[1]); if (!ehVia(m, q[0] + dd[0], q[1] + dd[1]) && !T.ehAgua(t) && t !== T.URBANO) viz[t] = (viz[t] || 0) + 1; }); let best = T.GRAMA, bn = 0; Object.keys(viz).forEach((k) => { if (viz[k] > bn) { bn = viz[k]; best = +k; } }); m.set(q[0], q[1], best); } }); mudou = true; };
        // trechos curtinhos que sobram nas bordas da malha urbana: somem
        if (trecho.length <= 2 && grauVia(m, nb[0], nb[1]) >= 3) { aparar(); return; }
        // a) segue reto até a borda do mapa (estrada para outras cidades)
        {
          const cam = [];
          let ok = false;
          for (let k = 1; k <= 12; k++) {
            const q = [x + d[0] * k, y + d[1] * k];
            if (!m.dentro(q[0], q[1])) break;
            const p = m.img(q[0], q[1]);
            const t = m.T(q[0], q[1]);
            if (oc[m.i(q[0], q[1])] || m.bloq[m.i(q[0], q[1])] || t === T.LAVA || (T.ehAgua(t) && t !== T.RIO)) break;
            cam.push(q);
            if (p[0] < -0.01 || p[0] > 1.01 || p[1] < -0.01 || p[1] > 1.01) { ok = true; break; }
          }
          if (ok) { assentar(m, [[x, y]].concat(cam)); mudou = true; return; }
        }
        // b) fecha um anel com outra estrada próxima (que não seja o próprio trecho)
        {
          const perto = new Set();
          const fila = [[x, y, 0]]; perto.add(m.i(x, y));
          while (fila.length) { const [cx, cy, k] = fila.shift(); if (k >= 14) continue; D4.forEach((dd) => { const nx = cx + dd[0], ny = cy + dd[1]; if (ehVia(m, nx, ny) && !perto.has(m.i(nx, ny))) { perto.add(m.i(nx, ny)); fila.push([nx, ny, k + 1]); } }); }
          const cam = rotaEstrada(m, [[x, y]], (ax, ay) => ehVia(m, ax, ay) && !perto.has(m.i(ax, ay)), { limite: 16, oc, maxAgua: 5 });
          if (cam && cam.length > 2 && cam.length <= 16) { assentar(m, cam); mudou = true; return; }
        }
        // c) um destino no fim da estrada
        {
          const lista = DESTINOS[contextoPonta(m, x, y)];
          const cand = [[x + d[0], y + d[1]], [x + d[1], y + d[0]], [x - d[1], y - d[0]]];
          for (const q of cand) {
            if (!m.dentro(q[0], q[1]) || oc[m.i(q[0], q[1])] || ehVia(m, q[0], q[1])) continue;
            if (!m.livre(q[0], q[1], 1, 1) || Math.abs(m.H(q[0], q[1]) - m.H(x, y)) > 1) continue;
            const t = m.T(q[0], q[1]);
            if (t === T.CANA) m.set(q[0], q[1], T.TERRA);
            m.ents = m.ents.filter((e) => !(e.kind === 'deco' && !e.fp && Math.floor(e.x) === q[0] && Math.floor(e.y) === q[1]));
            const e = ed(m, r.pick(lista), q[0], q[1], [1, 1], r.int(0, 5));
            if (e) { e.extra = true; e.destino = true; return; }
          }
        }
        // d) sem destino possível: remove o trecho vazio
        aparar();
      });
      if (!mudou) return;
    }
  }
  // afina trechos de asfalto com duas faixas de tiles (quadrados 2 × 2 de estrada):
  // cada rua fica com a largura de um tile e os veículos seguem a pista, sem cortar na diagonal
  function afinarVias(m) {
    const N = m.N;
    const nComp = () => componentes(m).tam.length;
    // tirar o tile t não pode deixar duas estradas encostadas só pela quina
    const deixaQuina = (t) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].some((d) => ehVia(m, t[0] + d[0], t[1]) && ehVia(m, t[0], t[1] + d[1]) && !ehVia(m, t[0] + d[0], t[1] + d[1]));
    const terreno = (x, y) => {
      const viz = {};
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = m.T(x + dx, y + dy); if (m.dentro(x + dx, y + dy) && !ehVia(m, x + dx, y + dy) && !T.ehAgua(t) && t !== T.URBANO && t !== T.PATIO) viz[t] = (viz[t] || 0) + 1; }
      let best = T.GRAMA, bn = 0; Object.keys(viz).forEach((k) => { if (viz[k] > bn) { bn = viz[k]; best = +k; } });
      return best;
    };
    for (let rodada = 0; rodada < 6; rodada++) {
      let mudou = false;
      for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
        const q = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
        if (!q.every((t) => ehVia(m, t[0], t[1]))) continue;
        // remove o tile do quadrado com menos ligações para fora dele (nunca uma ponte)
        const fora = (t) => D4.filter((d) => { const a = [t[0] + d[0], t[1] + d[1]]; return ehVia(m, a[0], a[1]) && !q.some((b) => b[0] === a[0] && b[1] === a[1]); }).length;
        const ordem = q.filter((t) => m.T(t[0], t[1]) === T.ESTRADA).sort((a, b) => fora(a) - fora(b));
        const antes = nComp();
        for (const t of ordem) {
          if (deixaQuina(t)) continue;
          m.set(t[0], t[1], terreno(t[0], t[1]));
          if (nComp() === antes) { mudou = true; break; }
          m.set(t[0], t[1], T.ESTRADA);
        }
      }
      if (!mudou) break;
    }
    // anéis minúsculos de estrada em volta de 1 a 3 tiles (ilhotas): abre o anel; as pontas
    // que sobrarem são aparadas por resolverPontas
    const visto = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (visto[m.i(x, y)] || ehVia(m, x, y) || T.ehAgua(m.T(x, y))) continue;
      const reg = [[x, y]], fila = [[x, y]]; visto[m.i(x, y)] = 1;
      let aberto = false;
      while (fila.length && reg.length <= 3) {
        const [cx, cy] = fila.pop();
        D4.forEach((d) => {
          const nx = cx + d[0], ny = cy + d[1];
          if (!m.dentro(nx, ny)) { aberto = true; return; }
          if (ehVia(m, nx, ny) || visto[m.i(nx, ny)]) return;
          visto[m.i(nx, ny)] = 1; reg.push([nx, ny]); fila.push([nx, ny]);
        });
      }
      if (aberto || fila.length || reg.length > 3) continue;
      const borda = [];
      reg.forEach((t) => D4.forEach((d) => { const q = [t[0] + d[0], t[1] + d[1]]; if (m.T(q[0], q[1]) === T.ESTRADA && !borda.some((b) => b[0] === q[0] && b[1] === q[1])) borda.push(q); }));
      borda.sort((a2, b2) => grauVia(m, a2[0], a2[1]) - grauVia(m, b2[0], b2[1]));
      const antes = nComp();
      for (const t of borda) {
        if (deixaQuina(t)) continue;
        m.set(t[0], t[1], terreno(t[0], t[1]));
        if (nComp() === antes) break;
        m.set(t[0], t[1], T.ESTRADA);
      }
    }
  }
  // corredor da estrada: o terreno ao lado acompanha o nível da pista (cortes e aterros
  // suaves), sem barrancos atravessando a estrada
  function nivelarCorredor(m) {
    const N = m.N, oc = mascaraOcupada(m);
    const H0 = Int8Array.from(m.alt);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!ehVia(m, x, y)) continue;
      const hv = H0[m.i(x, y)];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((!dx && !dy) || !m.dentro(nx, ny)) continue;
        const ni = m.i(nx, ny), t = m.tipo[ni];
        if (ehVia(m, nx, ny) || T.ehAgua(t) || m.bloq[ni] || oc[ni] || t === T.LAVA || t === T.CAIS) continue;
        const hn = m.alt[ni];
        if (hn === hv + 1 || hn === hv - 1) m.alt[ni] = hv;
        else if (hn > hv + 1) m.alt[ni] = hn - 1;
      }
    }
  }
  // suaviza degraus de estrada (evita degraus > 1)
  function suavizarEstradas(m) {
    for (let k = 0; k < 3; k++) for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      const t = m.T(x, y);
      if (t !== T.ESTRADA) continue;
      const h = m.H(x, y);
      [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach((d) => {
        const nx = x + d[0], ny = y + d[1];
        if (m.T(nx, ny) === T.ESTRADA && m.H(nx, ny) - h > 1) m.setH(nx, ny, h + 1);
      });
    }
  }
  function ed(m, spr, x, y, fp, v, extra) {
    fp = fp || [1, 1];
    if (!m.livre(x, y, fp[0], fp[1])) return null;
    const h = Math.max(1, m.H(x, y));
    m.nivelar(x, y, fp[0], fp[1], h);
    if (extra && extra.chao !== undefined) for (let j = 0; j < fp[1]; j++) for (let i = 0; i < fp[0]; i++) m.set(x + i, y + j, extra.chao);
    m.ocupar(x, y, fp[0], fp[1]);
    return m.ent(Object.assign({ spr, x, y, fp, v: v || 0, kind: 'deco' }, extra || {}));
  }
  function edI(m, spr, ix, iy, fp, v, extra) { const t = m.tile(ix, iy); return ed(m, spr, t[0], t[1], fp, v, extra); }
  function deco(m, spr, fx, fy, v, extra) { return m.ent(Object.assign({ spr, x: fx, y: fy, v: v || 0, kind: 'deco' }, extra || {})); }

  // árvores conforme o terreno
  function arborizar(m, op) {
    op = op || {};
    const r = m.r;
    (m._cid || []).forEach((a) => cidade(m, a[0], a[1], a[2], a[3], Object.assign({}, a[4], { agora: true, soPredios: true })));
    m._cid = [];
    const tropical = op.tropical !== false;
    // beira de rio: vizinho (8 direções) com água corrente ou lago
    const beiraRio = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const t = m.T(x + dx, y + dy); if (t === T.RIO || t === T.LAGO_CAVA) return true; } return false; };
    const margemDegradada = (x) => { if (!m.margens) return false; const p = m.img(x[0], x[1]); return p[0] > m.margens.ix0 && p[0] < m.margens.ix1; };
    const pertoVia = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = m.T(x + dx, y + dy); if (m.dentro(x + dx, y + dy) && (t === T.PONTE || t === T.ESTRADA)) return true; } return false; };
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      if (m.bloq[m.i(x, y)] || (m.semArvore && m.semArvore[m.i(x, y)])) continue;
      const t = m.T(x, y), h = m.H(x, y);
      const p = m.img(x, y);
      if (p[1] < -0.06 || p[1] > 1.05 || p[0] < -0.05 || p[0] > 1.05) continue;
      const j = () => r.range(-0.28, 0.28);
      // mata ciliar e plantas de beira d'água (juncos, capim alto, buritis)
      if (op.margens !== false && (t === T.GRAMA || t === T.PASTO || t === T.VARZEA || t === T.GRAMA_SECA || t === T.CERRADO) && beiraRio(x, y) && !margemDegradada([x, y])) {
        const q = r();
        if (q < 0.34) { deco(m, r() < 0.6 ? 'junco' : 'capim', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3)); if (r() < 0.4) deco(m, 'junco', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3)); continue; }
        if (q < 0.56 && !pertoVia(x, y)) { deco(m, tropical && r() < 0.25 ? 'buriti' : r() < 0.2 ? 'ipe' : 'arvore', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5)); continue; }
        if (q < 0.66) { deco(m, 'arbusto', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5)); continue; }
      }
      if (t === T.FLORESTA) {
        const n = op.densFloresta || 1;
        for (let k = 0; k < n; k++) {
          if (k && r() > 0.45) continue;
          let tipo = h >= 4 ? (r() < 0.6 ? 'pinheiro' : 'araucaria') : !tropical ? (r() < 0.7 ? 'arvore' : 'pinheiro') : r() < 0.62 ? 'tropical' : 'arvore';
          if (h < 4 && r() < 0.05) tipo = 'ipe';
          if (tropical && h < 4 && beiraRio(x, y) && r() < 0.35) tipo = 'buriti';
          deco(m, tipo, x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5));
        }
      } else if (t === T.AGROFLORESTA) {
        if (r() < 0.75) deco(m, r.pick(['bananeira', 'cafe', 'arvore', 'cafe', 'tropical']), x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5));
      } else if (t === T.GRAMA) {
        const q = r();
        if (q < (op.densGrama || 0.06)) deco(m, r() < 0.12 ? 'ipe' : r() < 0.72 ? 'arvore' : 'arbusto', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5));
        else if (q < (op.densGrama || 0.06) + 0.025) deco(m, 'pedra', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 2));
        else if (q < (op.densGrama || 0.06) + 0.06) deco(m, 'capim', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
        else if (q < (op.densGrama || 0.06) + 0.075) deco(m, 'flores', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
      } else if (t === T.CERRADO) {
        const q = r();
        if (q < 0.1) deco(m, 'cerradoArvore', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
        else if (q < 0.2) deco(m, 'capim', x + 0.5 + j(), y + 0.5 + j(), 3);
        else if (q < 0.24) deco(m, 'cupinzeiro', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 2));
        else if (q < 0.27) deco(m, 'ipe', x + 0.5 + j(), y + 0.5 + j(), 0);
      } else if (t === T.VARZEA) {
        const q = r();
        if (q < 0.18) deco(m, 'junco', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
        else if (q < 0.26) deco(m, tropical ? 'buriti' : 'arvore', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5));
      } else if (t === T.ROCHA) {
        const q = r();
        if (q < 0.07) deco(m, 'rochedo', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
        else if (q < 0.15) deco(m, 'pedra', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 2));
        else if (q < 0.23 && h < 8) deco(m, 'pinheiro', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 2));
      } else if (t === T.BASALTO || t === T.CINZA_VULC) {
        if (r() < 0.05) deco(m, 'rochedo', x + 0.5 + j(), y + 0.5 + j(), 3);
      } else if (t === T.ESTERIL) {
        if (r() < 0.04) deco(m, 'pedra', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 2));
      } else if (t === T.AREIA) {
        if (r() < (op.densPalma || 0.05)) deco(m, 'palmeira', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
      } else if (t === T.PASTO) {
        if (r() < 0.025) deco(m, r() < 0.2 ? 'ipe' : 'arvore', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 5));
        else if (r() < 0.03) deco(m, 'capim', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
      } else if (t === T.QUEIMADO) {
        if (r() < 0.55) deco(m, r() < 0.8 ? 'queimada' : 'toco', x + 0.5 + j(), y + 0.5 + j(), r.int(0, 3));
      } else if (t === T.MANGUE) {
        if (r() < 0.5) deco(m, 'arbusto', x + 0.5 + j(), y + 0.5 + j(), 0);
      } else if (t === T.GRAMA_SECA) {
        if (r() < 0.03) deco(m, 'toco', x + 0.5 + j(), y + 0.5 + j(), 0);
        else if (r() < 0.04) deco(m, 'capim', x + 0.5 + j(), y + 0.5 + j(), 3);
      }
    }
  }
  // remove decorações sobre tiles ocupados, água ou ruas
  function limpar(m) {
    m.ents = m.ents.filter((e) => {
      if (e.kind !== 'deco' || e.fp) return true;
      if (e.agua) return true;
      const x = Math.floor(e.x), y = Math.floor(e.y);
      const t = m.T(x, y);
      if (m.bloq[m.i(U.clamp(x, 0, m.N - 1), U.clamp(y, 0, m.N - 1))]) return false;
      if (T.ehAgua(t) || t === T.ESTRADA || t === T.PONTE || t === T.URBANO || t === T.PATIO || t === T.CAIS || t === T.LAVA) return false;
      return true;
    });
  }
  // garante que todo ponto interativo seja alcançável a partir do início
  function garantirAcesso(m) {
    const N = m.N;
    m.bloq[m.i(m.inicio[0], m.inicio[1])] = 0;
    m.bloq[m.i(m.inicio[0], m.inicio[1])] = 0;
    const andavel = (x, y) => m.dentro(x, y) && !m.bloq[m.i(x, y)] && T.props[m.T(x, y)].andavel;
    const bfs = () => {
      const vis = new Uint8Array(N * N);
      const fila = [m.inicio];
      vis[m.i(m.inicio[0], m.inicio[1])] = 1;
      while (fila.length) {
        const [x, y] = fila.shift();
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + d[0], ny = y + d[1];
          if (!andavel(nx, ny) || vis[m.i(nx, ny)]) continue;
          if (Math.abs(m.H(nx, ny) - m.H(x, y)) > 1) continue;
          vis[m.i(nx, ny)] = 1; fila.push([nx, ny]);
        }
      }
      return vis;
    };
    const anel = (e) => {
      const w = e.fp ? e.fp[0] : 1, d = e.fp ? e.fp[1] : 1, x0 = Math.floor(e.x), y0 = Math.floor(e.y);
      const r = [];
      for (let y = y0 - 1; y <= y0 + d; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (!(x >= x0 && x < x0 + w && y >= y0 && y < y0 + d) && m.dentro(x, y)) r.push([x, y]);
      if (e.kind === 'pin') r.push([x0, y0]);
      return r;
    };
    const removerPredio = (x, y) => {
      const i = m.ents.findIndex((e) => e.kind === 'deco' && e.fp && x >= e.x && x < e.x + e.fp[0] && y >= e.y && y < e.y + e.fp[1]);
      if (i < 0) return false;
      const e = m.ents[i];
      if (/barragem|torreLinha/.test(e.spr)) return false;
      for (let j = 0; j < e.fp[1]; j++) for (let k = 0; k < e.fp[0]; k++) m.bloq[m.i(e.x + k, e.y + j)] = 0;
      m.ents.splice(i, 1);
      return true;
    };
    let vis = bfs();
    const alvos = m.ents.filter((e) => ['npc', 'lote', 'problema', 'info', 'pin', 'arranjo'].indexOf(e.kind) >= 0);
    alvos.forEach((e) => {
      if (anel(e).some((t) => vis[m.i(t[0], t[1])])) return;
      // caminho de menor custo (Dijkstra) dos tiles alcançados até o anel do alvo:
      // prédios removíveis e água (vira cais) são atravessáveis com custo maior
      const dono = new Int32Array(N * N).fill(-1);
      m.ents.forEach((d, k) => { if (d.kind === 'deco' && d.fp && !/barragem|torreLinha/.test(d.spr)) for (let jj = 0; jj < d.fp[1]; jj++) for (let ii = 0; ii < d.fp[0]; ii++) if (m.dentro(d.x + ii, d.y + jj)) dono[m.i(d.x + ii, d.y + jj)] = k; });
      const custo = new Float32Array(N * N).fill(1e9), veio = new Int32Array(N * N).fill(-1);
      const fila = [];
      for (let i = 0; i < N * N; i++) if (vis[i]) { custo[i] = 0; fila.push(i); }
      const alvoSet = new Set(anel(e).map((t) => m.i(t[0], t[1])));
      let achou = -1;
      while (fila.length) {
        // fila de prioridade simples (N pequeno)
        let bi = 0; for (let k = 1; k < fila.length; k++) if (custo[fila[k]] < custo[fila[bi]]) bi = k;
        const cur = fila[bi]; fila[bi] = fila[fila.length - 1]; fila.pop();
        if (alvoSet.has(cur)) { achou = cur; break; }
        const cx = cur % N, cy = (cur / N) | 0;
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + d[0], ny = cy + d[1];
          if (!m.dentro(nx, ny)) continue;
          const ni = m.i(nx, ny);
          let c = 1;
          if (m.bloq[ni]) { if (dono[ni] < 0) continue; c += 6; }
          const t = m.T(nx, ny);
          if (T.ehAgua(t)) c += 3; else if (!T.props[t].andavel) c += 4;
          c += Math.max(0, Math.abs(m.H(nx, ny) - m.H(cx, cy)) - 1) * 2;
          if (custo[cur] + c < custo[ni]) { if (custo[ni] >= 1e9) fila.push(ni); custo[ni] = custo[cur] + c; veio[ni] = cur; }
        }
      }
      if (achou < 0) return;
      const cam = [];
      for (let k = achou; k >= 0 && !vis[k]; k = veio[k]) cam.push(k);
      cam.reverse();
      let ant = veio[cam[0]];
      cam.forEach((k) => {
        const x = k % N, y = (k / N) | 0;
        if (m.bloq[k]) removerPredio(x, y);
        const t = m.T(x, y);
        if (T.ehAgua(t)) m.set(x, y, T.CAIS, 1);
        else if (!T.props[t].andavel) m.set(x, y, T.ROCHA);
        const hPrev = ant >= 0 ? m.alt[ant] : m.H(x, y);
        m.setH(x, y, U.clamp(m.H(x, y), hPrev - 1, hPrev + 1));
        ant = k;
      });
      // ajusta o destino para não criar degrau
      vis = bfs();
    });
  }

  // prédios altos logo à frente de um morador o escondem e o fazem parecer em cima do telhado:
  // à frente de cada personagem só ficam casas baixas (e o chão livre bem perto dele)
  const ALTOS = new Set(['predio', 'torreVidro', 'predioSolar']);
  function frenteNpc(m, x, y) {
    let min = 99;
    (m._npcs || []).forEach((n) => { const dx = x - n[0], dy = y - n[1]; if (dx >= 0 && dy >= 0 && dx + dy >= 1 && dx + dy <= 7 && Math.abs(dx - dy) <= 4) min = Math.min(min, dx + dy); });
    return min;
  }
  // registra um personagem; no canavial, abre uma clareira para ele ficar no chão, à vista
  function marcarNpc(m, x, y) {
    (m._npcs = m._npcs || []).push([x, y]);
    [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]].forEach((d) => { if (m.T(x + d[0], y + d[1]) === T.CANA) m.set(x + d[0], y + d[1], T.TERRA); });
  }

  // malha urbana no espaço de tiles
  function cidade(m, cx, cy, w, d, op) {
    op = op || {};
    const c = m.tile(cx, cy);
    const x0 = c[0] - Math.floor(w / 2), y0 = c[1] - Math.floor(d / 2);
    const passo = op.passo || 5;
    const r = m.r;
    if (!op.soPredios) for (let y = y0; y < y0 + d; y++) for (let x = x0; x < x0 + w; x++) {
      if (!m.dentro(x, y)) continue;
      const t = m.T(x, y);
      if (T.ehAgua(t) || t === T.PONTE) continue;
      const rua = (x - x0) % passo === 0 || (y - y0) % passo === 0;
      if (rua) { if (!m.bloq[m.i(x, y)]) m.set(x, y, T.ESTRADA, 1); }
      else if (!m.bloq[m.i(x, y)] && t !== T.ESTRADA) m.set(x, y, op.chao || T.GRAMA, 1);
    }
    if (op.soRuas) return [x0, y0];
    // prédios são erguidos depois do conteúdo da missão (ver arborizar)
    if (!op.agora) { (m._cid = m._cid || []).push([cx, cy, w, d, op]); return [x0, y0]; }
    // edifícios
    const cxT = x0 + w / 2, cyT = y0 + d / 2;
    for (let y = y0; y < y0 + d; y++) for (let x = x0; x < x0 + w; x++) {
      if (!m.dentro(x, y) || m.T(x, y) === T.ESTRADA || T.ehAgua(m.T(x, y))) continue;
      if (m.bloq[m.i(x, y)]) continue;
      const dc = Math.hypot(x - cxT, y - cyT) / (Math.max(w, d) / 2);
      const pr = op.densidade || 0.85;
      if (r() > pr) continue;
      let spr, v = r.int(0, 5);
      if (op.centro !== false && dc < 0.35) spr = r() < 0.5 ? 'torreVidro' : r() < 0.6 ? 'predio' : 'predioSolar';
      else if (dc < 0.6) spr = r() < 0.45 ? 'predio' : r() < 0.2 ? 'casaSolar' : 'casa';
      else spr = r() < 0.18 ? 'casaSolar' : r() < 0.06 ? 'praca' : 'casa';
      if (op.tipos) spr = r.pick(op.tipos);
      const fn = frenteNpc(m, x, y);
      if (fn <= 2) continue;
      if (fn < 99 && ALTOS.has(spr)) spr = r() < 0.5 ? 'casa' : 'casaSolar';
      ed(m, spr, x, y, [1, 1], v);
    }
    return [x0, y0];
  }
  // barragem ao longo do eixo x do tile, com lago atrás (y menor) e rio à frente:
  // vertedouro com comportas no meio, tomada d'água num dos lados e ombreiras de rocha
  function represa(m, ix, iy, meio, hLago) {
    const c = m.tile(ix, iy);
    for (let i = -meio; i <= meio; i++) {
      const x = c[0] + i, y = c[1];
      m.set(x, y, T.PATIO, hLago + 1); m.ocupar(x, y, 1, 1);
      const v = Math.abs(i) <= (meio >= 3 ? 1 : 0) ? 2 : i === meio ? 4 : 0;
      deco(m, 'barragem', x, y, v, { fp: [1, 1] });
      for (let k = 1; k <= 4; k++) { if (T.ehAgua(m.T(x, y - k))) m.setH(x, y - k, hLago); else if (k <= 2) m.set(x, y - k, T.RIO, hLago); }
      // bacia de dissipação logo abaixo do vertedouro (água branca)
      if (v === 2 && T.ehAgua(m.T(x, y + 1))) (m.vapor = m.vapor || []).push([x, y + 1, 'vapor', 0.9]);
    }
    // entorno livre de árvores (crista, ombreiras e pé da barragem ficam à vista)
    m.semArvore = m.semArvore || new Uint8Array(m.N * m.N);
    for (let y = c[1] - 2; y <= c[1] + 3; y++) for (let x = c[0] - meio - 3; x <= c[0] + meio + 3; x++) if (m.dentro(x, y)) m.semArvore[m.i(x, y)] = 1;
    // ombreiras de rocha nas encostas, na altura da crista
    [c[0] - meio - 1, c[0] + meio + 1].forEach((x, k) => {
      for (let j = -1; j <= 1; j++) { const y = c[1] + j; if (!m.dentro(x, y) || T.ehAgua(m.T(x, y))) continue; if (m.H(x, y) < hLago + 1 || j === 0) m.set(x, y, T.ROCHA, hLago + 1); }
      const x2 = x + (k ? 1 : -1); if (m.dentro(x2, c[1]) && !T.ehAgua(m.T(x2, c[1])) && m.H(x2, c[1]) < hLago) m.set(x2, c[1], T.ROCHA, hLago);
    });
    return c;
  }

  // ---------- vulcão: cone com cratera, borda, lago de lava, derrames e fumarolas ----------
  function vulcao(m, cx, cy, rx, ry, op) {
    op = op || {};
    const hMax = op.hMax || 12, r = U.rng(m.seed + 313);
    const fum = [];
    zona(m, cx, cy, rx, ry, (x, y, d) => {
      if (T.ehAgua(m.T(x, y)) && d > 0.3) return;
      let h, t;
      if (d < 0.1) { h = hMax - 2; t = d < 0.07 ? T.LAVA : T.CINZA_VULC; }            // fundo da cratera
      else if (d < 0.19) { h = hMax; t = m.ruido(x * 0.5, y * 0.5) > 0.62 ? T.ROCHA : T.CINZA_VULC; } // borda
      else {
        const k = Math.pow((1 - d) / 0.81, 1.25);
        h = Math.max(1, Math.round(1 + (hMax - 1) * k));
        const n = m.ruido.fbm(x * 0.16, y * 0.16, 3);
        if (d < 0.46) t = n > 0.66 ? T.ROCHA : T.CINZA_VULC;
        else if (d < 0.7) t = n > 0.55 ? T.CINZA_VULC : n > 0.38 ? T.ROCHA : T.CERRADO;
        else t = n > 0.58 ? T.FLORESTA : n > 0.42 ? T.CERRADO : (op.solo || T.GRAMA);
      }
      m.set(x, y, t, Math.max(d < 0.19 ? 0 : m.H(x, y) * (d > 0.85 ? 1 : 0), h));
    }, 0.12);
    const ponto = (ang, d) => [cx + Math.cos(ang) * rx * d, cy + Math.sin(ang) * ry * d];
    // derrames antigos de basalto descendo as encostas
    (op.derrames || [0.6, 2.2, 3.6]).forEach((a0, k) => {
      let ang = a0;
      for (let d = 0.2; d < (k === 0 ? 0.92 : 0.8); d += 0.015) {
        ang += (m.ruido(d * 8 + k * 3, k) - 0.5) * 0.08;
        const t = m.tile(...ponto(ang, d));
        const larg = d < 0.5 ? 1 : 2;
        for (let j = 0; j < larg; j++) for (let i = 0; i < larg; i++) { const x = t[0] + i, y = t[1] + j; if (m.dentro(x, y) && !T.ehAgua(m.T(x, y)) && m.T(x, y) !== T.LAVA) m.set(x, y, T.BASALTO); }
      }
    });
    // derrame ativo: um canal de lava incandescente que transborda da cratera
    if (op.lavaAtiva !== false) {
      let ang = op.angLava === undefined ? 1.3 : op.angLava;
      for (let d = 0.09; d < 0.5; d += 0.012) {
        ang += (m.ruido(d * 10, 9) - 0.5) * 0.06;
        const t = m.tile(...ponto(ang, d));
        if (m.dentro(t[0], t[1])) m.set(t[0], t[1], T.LAVA);
        const t2 = [t[0] + 1, t[1]];
        if (d > 0.3 && m.dentro(t2[0], t2[1]) && m.T(t2[0], t2[1]) !== T.LAVA) m.set(t2[0], t2[1], T.BASALTO);
      }
    }
    // fumarolas com crosta de enxofre
    (op.fumarolas || [[0.3, 2.6], [0.36, 0.2], [0.28, 4.4]]).forEach((f) => {
      const t = m.tile(...ponto(f[1], f[0]));
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const x = t[0] + i, y = t[1] + j; if (m.dentro(x, y) && ((!i && !j) || r() < 0.22) && m.T(x, y) !== T.LAVA && !T.ehAgua(m.T(x, y))) m.set(x, y, T.ENXOFRE); }
      fum.push([t[0], t[1], 'vapor', 1.6]);
    });
    const cr = m.tile(cx, cy);
    m.vapor = (m.vapor || []).concat([[cr[0], cr[1], 'escura', 3], [cr[0] + 1, cr[1], 'vapor', 1.4]], fum);
    m._vulcao = { cx, cy, rx, ry };
    return cr;
  }

  // ---------- cava de mineração em bancadas, com rampa espiral, lago e pilha de estéril ----------
  function cava(m, cx, cy, rx, ry, op) {
    op = op || {};
    const niv = op.niveis || 4, h0 = op.h0 === undefined ? 1 : op.h0;
    zona(m, cx, cy, rx, ry, (x, y, d) => {
      const b = Math.min(niv, Math.floor((1 - d) * (niv + 0.7)));
      if (op.lago !== false && d < 0.17) m.set(x, y, T.LAGO_CAVA, h0 - niv - 1);
      else m.set(x, y, T.MINA, h0 - b);
    }, op.irr === undefined ? 0.12 : op.irr);
    // rampa: estrada de serviço em espiral, da borda até o fundo
    const rampa = [];
    let ang = op.angRampa === undefined ? 0.4 : op.angRampa;
    for (let rho = 1.02; rho > 0.24; rho -= 0.006) {
      ang += 0.034;
      const t = m.tile(cx + Math.cos(ang) * rx * rho, cy + Math.sin(ang) * ry * rho);
      if (!m.dentro(t[0], t[1]) || T.ehAgua(m.T(t[0], t[1]))) continue;
      if (!rampa.length || rampa[rampa.length - 1][0] !== t[0] || rampa[rampa.length - 1][1] !== t[1]) rampa.push(t);
    }
    // garante continuidade (vizinhos por lado) e degraus de no máximo 1 nível
    const cont = [rampa[0]];
    for (let i = 1; i < rampa.length; i++) cont.push(...linha4(cont[cont.length - 1], rampa[i]));
    cont.forEach((t, i) => {
      if (T.ehAgua(m.T(t[0], t[1]))) return;
      if (i > 0) { const p = cont[i - 1]; const hp = m.H(p[0], p[1]); m.setH(t[0], t[1], U.clamp(m.H(t[0], t[1]), hp - 1, hp + 1)); }
      m.set(t[0], t[1], T.RAMPA_MINA);
    });
    m._rampa = cont;
    // pilha de estéril (rocha sem minério) em degraus, com o topo plano
    if (op.esteril) {
      const e = op.esteril;
      zona(m, e[0], e[1], e[2], e[3], (x, y, d) => {
        if (T.ehAgua(m.T(x, y)) || m.T(x, y) === T.MINA || m.T(x, y) === T.RAMPA_MINA) return;
        m.set(x, y, d > 0.8 ? T.GRAMA_SECA : T.ESTERIL, Math.max(1, h0 + 1 + Math.min(2, Math.floor((1 - d) * 3.2))));
      }, 0.15);
    }
    m._cava = { cx, cy, rx, ry, niv, h0 };
  }
  // máquinas trabalhando na cava: escavadeira no fundo, caminhões na rampa, perfuratriz na bancada
  function maquinasCava(m) {
    const cv = m._cava; if (!cv) return;
    const rp = m._rampa || [];
    const pos = (ang, rho) => m.tile(cv.cx + Math.cos(ang) * cv.rx * rho, cv.cy + Math.sin(ang) * cv.ry * rho);
    const solta = (spr, t, v, extra) => { if (!t || !m.dentro(t[0], t[1]) || m.bloq[m.i(t[0], t[1])] || T.ehAgua(m.T(t[0], t[1]))) return; deco(m, spr, t[0] + 0.5, t[1] + 0.5, v || 0, extra); };
    [0.25, 0.55, 0.8].forEach((f, i) => { const t = rp[Math.floor(rp.length * f)]; if (t) solta('caminhaoMina', t, i); });
    solta('escavadeira', pos(2.6, 0.3), 1);
    solta('escavadeira', pos(4.6, 0.55), 0);
    solta('perfuratriz', pos(3.6, 0.78), 0);
    solta('perfuratriz', pos(5.4, 0.5), 1);
    solta('caminhaoPipa', pos(1.2, 0.7), 0);
  }

  // ---------- várzea: campos úmidos que acompanham o rio ----------
  function varzeas(m, op) {
    op = op || {};
    const N = m.N, dist = new Uint8Array(N * N).fill(9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m.T(x, y) === T.RIO) dist[m.i(x, y)] = 0;
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (dist[m.i(x, y)] <= pass) continue;
      if (D4.some((d) => m.dentro(x + d[0], y + d[1]) && dist[m.i(x + d[0], y + d[1])] === pass)) dist[m.i(x, y)] = pass + 1;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = dist[m.i(x, y)];
      if (k < 1 || k > (op.larg || 2) || m.bloq[m.i(x, y)]) continue;
      const t = m.T(x, y);
      if ((t === T.GRAMA || t === T.PASTO) && m.ruido(x * 0.22 + 4, y * 0.22) > (op.limiar || 0.45) && m.H(x, y) <= 2) m.set(x, y, T.VARZEA);
    }
  }

  // ---------- pastagens cercadas, com cupinzeiros, cocho e bebedouro ----------
  function pastagens(m, tipo) {
    const N = m.N, r = U.rng(m.seed + 57), TP = tipo === undefined ? T.PASTO : tipo;
    const ehPasto = (x, y) => m.dentro(x, y) && m.T(x, y) === TP;
    let soma = [0, 0, 0];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!ehPasto(x, y)) continue;
      const p = m.img(x, y);
      if (p[0] < 0 || p[0] > 1 || p[1] < 0 || p[1] > 1) continue;
      soma[0] += x; soma[1] += y; soma[2]++;
      // cerca nas divisas com outros usos (com porteira onde passa a estrada)
      [[0, 1, 0, 0.97], [0, -1, 0, 0.03], [1, 0, 1, 0.97], [-1, 0, 1, 0.03]].forEach((q) => {
        const nx = x + q[0], ny = y + q[1];
        if (ehPasto(nx, ny) || !m.dentro(nx, ny)) return;
        const tn = m.T(nx, ny);
        if (tn === T.ESTRADA || tn === T.PONTE || T.ehAgua(tn) || Math.abs(m.H(nx, ny) - m.H(x, y)) > 1) return;
        const fx = q[2] ? x + q[3] : x + 0.5, fy = q[2] ? y + 0.5 : y + q[3];
        deco(m, 'cerca', fx, fy, q[2], { profExtra: -0.02 });
      });
      if (!m.bloq[m.i(x, y)] && r() < 0.035) deco(m, 'cupinzeiro', x + r.range(0.25, 0.75), y + r.range(0.25, 0.75), r.int(0, 2));
    }
    if (soma[2] > 20) {
      const cx = Math.round(soma[0] / soma[2]), cy = Math.round(soma[1] / soma[2]);
      const lugar = acharPerto(m, cx, cy, 1, 1, { tipos: [TP], raio: 5 });
      if (lugar) deco(m, 'cocho', lugar[0] + 0.5, lugar[1] + 0.5, 0);
      const l2 = acharPerto(m, cx + 2, cy + 1, 1, 1, { tipos: [TP], raio: 5 });
      if (l2) deco(m, 'cocho', l2[0] + 0.5, l2[1] + 0.5, 1);
    }
  }

  // procura, em espiral a partir de (x, y), um terreno livre e plano para uma construção
  function acharPerto(m, x, y, w, d, op) {
    op = op || {};
    const raio = op.raio || 6;
    for (let r = 0; r <= raio; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = x + dx, ty = y + dy;
      if (!m.livre(tx, ty, w, d)) continue;
      let ok = true;
      const h0 = m.H(tx, ty);
      for (let j = 0; j < d && ok; j++) for (let i = 0; i < w && ok; i++) {
        const t = m.T(tx + i, ty + j);
        if (t === T.ESTRADA || t === T.LAVA || t === T.RAMPA_MINA || Math.abs(m.H(tx + i, ty + j) - h0) > 1) ok = false;
        if (op.tipos && op.tipos.indexOf(t) < 0) ok = false;
      }
      if (ok) return [tx, ty];
    }
    return null;
  }
  // implemento ou construção perto de um ponto (coords de imagem), sem ocupar estrada nem pontos do jogo
  function implemento(m, spr, ix, iy, fp, v, op) {
    fp = fp || [1, 1];
    const t = m.tile(ix, iy);
    const lugar = acharPerto(m, t[0], t[1], fp[0], fp[1], op);
    if (!lugar) return null;
    m.ents = m.ents.filter((e) => !(e.kind === 'deco' && !e.fp && e.x >= lugar[0] && e.x < lugar[0] + fp[0] && e.y >= lugar[1] && e.y < lugar[1] + fp[1]));
    for (let j = 0; j < fp[1]; j++) for (let i = 0; i < fp[0]; i++) if (m.T(lugar[0] + i, lugar[1] + j) === T.CANA || m.T(lugar[0] + i, lugar[1] + j) === T.FLORESTA) m.set(lugar[0] + i, lugar[1] + j, T.TERRA);
    return ed(m, spr, lugar[0], lugar[1], fp, v || 0, op && op.extra);
  }
  // máquina solta (sem pegada) num tile livre perto do ponto
  function maquina(m, spr, ix, iy, v, op) {
    const t = m.tile(ix, iy);
    const lugar = acharPerto(m, t[0], t[1], 1, 1, op);
    if (!lugar) return null;
    return deco(m, spr, lugar[0] + 0.5, lugar[1] + 0.5, v || 0);
  }
  // correia transportadora entre dois pontos (coords de imagem), em segmentos sobre cavaletes
  function correiaEntre(m, a, b) {
    const ta = m.tile(a[0], a[1]), tb = m.tile(b[0], b[1]);
    const cam = [ta].concat(linha4(ta, tb));
    cam.forEach((t, i) => {
      if (!m.dentro(t[0], t[1]) || m.bloq[m.i(t[0], t[1])] || T.ehAgua(m.T(t[0], t[1])) || m.T(t[0], t[1]) === T.ESTRADA) return;
      const n = cam[i + 1] || cam[i - 1];
      deco(m, 'correia', t[0] + 0.5, t[1] + 0.5, n && n[0] !== t[0] ? 0 : 1);
    });
  }
  // canoas e barcos de pesca no rio
  function canoas(m, pts) {
    pts.forEach((p, i) => { const t = m.tile(p[0], p[1]); if (m.T(t[0], t[1]) === T.RIO && !m.bloq[m.i(t[0], t[1])]) deco(m, 'canoa', t[0] + 0.5, t[1] + 0.5, i, { agua: true, h: m.H(t[0], t[1]) }); });
  }
  // arranjos de energia limpa já instalados no mapa: construções visitáveis que mostram
  // como combinar fontes limpas para enfrentar um problema do lugar
  function arranjos(m, id, posicoes) {
    const lista = (ERS.ARRANJOS && ERS.ARRANJOS[id]) || [];
    lista.forEach((a, k) => {
      const p = posicoes[k]; if (!p) return;
      const t = m.tile(p[0], p[1]);
      const lugar = acharPerto(m, t[0], t[1], 2, 2, { raio: 7 });
      if (!lugar) return;
      m.ents = m.ents.filter((e) => !(e.kind === 'deco' && !e.fp && e.x >= lugar[0] - 0.2 && e.x < lugar[0] + 2.2 && e.y >= lugar[1] - 0.2 && e.y < lugar[1] + 2.2));
      const h = Math.max(1, m.H(lugar[0], lugar[1]));
      m.nivelar(lugar[0], lugar[1], 2, 2, h);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const tt = m.T(lugar[0] + i, lugar[1] + j); if (tt === T.CANA || tt === T.FLORESTA || tt === T.ROCHA) m.set(lugar[0] + i, lugar[1] + j, T.GRAMA); }
      m.ent({ kind: 'arranjo', ref: k, spr: a.spr, x: lugar[0], y: lugar[1], fp: [2, 2], v: a.v || 0 });
      // entorno sem árvores altas, para o arranjo ficar à vista
      m.semArvore = m.semArvore || new Uint8Array(m.N * m.N);
      for (let j = -1; j <= 3; j++) for (let i = -1; i <= 3; i++) if (m.dentro(lugar[0] + i, lugar[1] + j)) m.semArvore[m.i(lugar[0] + i, lugar[1] + j)] = 1;
      m.ocupar(lugar[0], lugar[1], 2, 2);
    });
  }
  function linhaTransmissao(m, pts) {
    const tps = [];
    for (let i = 0; i < pts.length; i++) {
      const t = m.tile(pts[i][0], pts[i][1]);
      if (m.livre(t[0], t[1], 1, 1)) { m.ocupar(t[0], t[1], 1, 1); deco(m, 'torreLinha', t[0], t[1], 0, { fp: [1, 1], bloqueia: true }); tps.push(t); }
    }
    m.linhas = m.linhas || [];
    m.linhas.push(tps);
  }

  // conteúdo de missão (narrador, NPCs, lotes, problemas, placas)
  function conteudo(m, ms, pos) {
    // pontos do jogo nunca cortam estradas nem pontes: se a posição cair sobre a via,
    // vão para o terreno livre mais próximo
    const naVia = (x, y, fp) => { for (let j = 0; j < fp[1]; j++) for (let i = 0; i < fp[0]; i++) { const t = m.T(x + i, y + j); if (t === T.ESTRADA || t === T.PONTE) return true; } return false; };
    const tileLivre = (p, fp) => {
      fp = fp || [1, 1];
      const t = m.tile(p[0], p[1]);
      if (!naVia(t[0], t[1], fp)) return t;
      for (let r = 1; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = t[0] + dx, y = t[1] + dy;
        let ok = true;
        for (let j = 0; j < fp[1] && ok; j++) for (let i = 0; i < fp[0] && ok; i++) {
          const xx = x + i, yy = y + j;
          if (!m.dentro(xx, yy) || m.bloq[m.i(xx, yy)]) { ok = false; break; }
          const tt = m.T(xx, yy);
          if (tt === T.ESTRADA || tt === T.PONTE || T.ehAgua(tt) || tt === T.LAVA || Math.abs(m.H(xx, yy) - m.H(x, y)) > 1) ok = false;
        }
        if (ok) return [x, y];
      }
      return t;
    };
    const preparar = (x, y, fp) => {
      fp = fp || [1, 1];
      const h = Math.max(1, m.H(x, y));
      for (let j = 0; j < fp[1]; j++) for (let i = 0; i < fp[0]; i++) {
        const t = m.T(x + i, y + j);
        if (T.ehAgua(t) || t === T.PONTE || t === T.ESTRADA || t === T.LAVA || t === T.ROCHA) m.set(x + i, y + j, T.GRAMA, h);
        else if (t === T.CANA) m.set(x + i, y + j, T.TERRA, h); // clareira: nada fica em cima das plantas
        else m.setH(x + i, y + j, h);
      }
    };
    // narrador
    const tn = tileLivre(pos.narrador);
    preparar(tn[0], tn[1]);
    const nar = ms.narrador;
    m.ent({ kind: 'npc', papelJogo: 'narrador', x: tn[0] + 0.5, y: tn[1] + 0.5, nome: nar.nome, papel: nar.papel, voz: nar.voz, look: ERS.LOOKS[nar.look], marcador: 'narrador' });
    m.ocupar(tn[0], tn[1], 1, 1);
    marcarNpc(m, tn[0], tn[1]);
    (ms.npcs || []).forEach((n, i) => {
      const p = pos.npcs[i]; if (!p) return;
      const t = tileLivre(p);
      preparar(t[0], t[1]);
      m.ent({ kind: 'npc', papelJogo: 'desafio', ref: i, x: t[0] + 0.5, y: t[1] + 0.5, nome: n.nome, papel: n.papel, voz: n.voz, look: ERS.lookNPC(i * 3 + ms.id.length, n.g, n.faixa), marcador: 'desafio', dir: i % 2 ? 1 : -1 });
      m.ocupar(t[0], t[1], 1, 1);
      marcarNpc(m, t[0], t[1]);
    });
    (ms.lotes || []).forEach((l) => {
      const p = pos.lotes[l.id]; if (!p) return;
      const t = l.agua ? m.tile(p[0], p[1]) : tileLivre(p, l.fp);
      if (l.agua) {
        for (let j = 0; j < l.fp[1]; j++) for (let i = 0; i < l.fp[0]; i++) { if (!T.ehAgua(m.T(t[0] + i, t[1] + j))) m.set(t[0] + i, t[1] + j, T.AGUA_RASA, 0); }
      } else {
        preparar(t[0], t[1], l.fp);
        for (let j = 0; j < l.fp[1]; j++) for (let i = 0; i < l.fp[0]; i++) { const tt = m.T(t[0] + i, t[1] + j); if (tt === T.FLORESTA && l.id !== 'mata') m.set(t[0] + i, t[1] + j, T.TERRA); }
      }
      m.ent({ kind: 'lote', ref: l.id, spr: 'lote', x: t[0], y: t[1], fp: l.fp, rotulo: l.rotulo, base: l.base || null, h: l.agua ? 0 : undefined });
      m.ocupar(t[0], t[1], l.fp[0], l.fp[1]);
    });
    (ms.problemas || []).forEach((pb) => {
      const p = pos.problemas[pb.id]; if (!p) return;
      const fp = p[2] || (pb.fp || null);
      const t = pb.spr === 'plataformaPetroleo' ? m.tile(p[0], p[1]) : tileLivre(p, fp || [1, 1]);
      if (fp) {
        if (!(pb.spr === 'plataformaPetroleo')) preparar(t[0], t[1], fp);
        m.ent({ kind: 'problema', ref: pb.id, spr: pb.spr, x: t[0], y: t[1], fp, h: pb.spr === 'plataformaPetroleo' ? 0 : undefined });
        m.ocupar(t[0], t[1], fp[0], fp[1]);
      } else {
        preparar(t[0], t[1]);
        m.ent({ kind: 'problema', ref: pb.id, spr: pb.spr, x: t[0] + 0.5, y: t[1] + 0.5 });
        m.ocupar(t[0], t[1], 1, 1);
      }
    });
    (ms.infos || []).forEach((inf, i) => {
      const p = pos.infos[i]; if (!p) return;
      const t = tileLivre(p);
      preparar(t[0], t[1]);
      m.ent({ kind: 'info', ref: i, spr: 'placa', x: t[0] + 0.5, y: t[1] + 0.5 });
      m.ocupar(t[0], t[1], 1, 1);
    });
    const ti = tileLivre(pos.inicio);
    preparar(ti[0], ti[1]);
    m.inicio = ti;
    m.ocupar(ti[0], ti[1], 1, 1);
    // lotes e moradores sem posição fixa: procura um lugar livre, plano e espaçado
    (ms.lotes || []).forEach((l) => {
      if (pos.lotes[l.id]) return;
      const t = acharLugar(m, l.fp[0], l.fp[1], { min: 5, max: 17, folga: 3 });
      if (!t) return;
      preparar(t[0], t[1], l.fp);
      for (let j = 0; j < l.fp[1]; j++) for (let i = 0; i < l.fp[0]; i++) if (m.T(t[0] + i, t[1] + j) === T.FLORESTA) m.set(t[0] + i, t[1] + j, T.TERRA);
      m.ent({ kind: 'lote', ref: l.id, spr: 'lote', x: t[0], y: t[1], fp: l.fp, rotulo: l.rotulo, base: l.base || null });
      m.ocupar(t[0], t[1], l.fp[0], l.fp[1]);
    });
    (ms.npcs || []).forEach((n, i) => {
      if (pos.npcs[i]) return;
      const t = acharLugar(m, 1, 1, { min: 4, max: 15, folga: 2.5, espalhar: true });
      if (!t) return;
      preparar(t[0], t[1]);
      m.ent({ kind: 'npc', papelJogo: 'desafio', ref: i, x: t[0] + 0.5, y: t[1] + 0.5, nome: n.nome, papel: n.papel, voz: n.voz, look: ERS.lookNPC(i * 3 + ms.id.length, n.g, n.faixa), marcador: 'desafio', dir: i % 2 ? 1 : -1 });
      m.ocupar(t[0], t[1], 1, 1);
      marcarNpc(m, t[0], t[1]);
    });
  }
  // lugar livre para w×d tiles perto do início: terra firme, sem estrada, quase plano,
  // longe de outros pontos de interesse e alcançável a pé
  function acharLugar(m, w, d, op) {
    const pontos = m.ents.filter((e) => e.kind === 'npc' || e.kind === 'lote' || e.kind === 'problema' || e.kind === 'info' || e.kind === 'arranjo').map((e) => [e.x + (e.fp ? e.fp[0] / 2 : 0), e.y + (e.fp ? e.fp[1] / 2 : 0), e.kind === 'npc' ? 1 : 0]);
    pontos.push([m.inicio[0] + 0.5, m.inicio[1] + 0.5, 0]);
    // tiles alcançáveis a partir do início
    const N = m.N, alc = new Uint8Array(N * N), fila = [m.inicio];
    alc[m.i(m.inicio[0], m.inicio[1])] = 1;
    while (fila.length) {
      const [x, y] = fila.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((q) => {
        const nx = x + q[0], ny = y + q[1];
        if (!m.dentro(nx, ny) || alc[m.i(nx, ny)] || m.bloq[m.i(nx, ny)] || !T.props[m.T(nx, ny)].andavel) return;
        if (Math.abs(m.H(nx, ny) - m.H(x, y)) > 1) return;
        alc[m.i(nx, ny)] = 1; fila.push([nx, ny]);
      });
    }
    const ok = (x, y) => {
      const h0 = m.H(x, y);
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
        const xx = x + i, yy = y + j;
        if (!m.dentro(xx, yy) || m.bloq[m.i(xx, yy)]) return false;
        const t = m.T(xx, yy);
        if (!T.props[t].andavel || T.ehAgua(t) || t === T.ESTRADA || t === T.PONTE || t === T.LAVA || t === T.ROCHA) return false;
        if (Math.abs(m.H(xx, yy) - h0) > 1) return false;
      }
      // precisa de um vizinho alcançável para o jogador chegar
      for (let j = -1; j <= d; j++) for (let i = -1; i <= w; i++) {
        const xx = x + i, yy = y + j;
        if ((i < 0 || i >= w || j < 0 || j >= d) && m.dentro(xx, yy) && alc[m.i(xx, yy)]) return true;
      }
      return false;
    };
    let melhor = null;
    for (let y = 1; y < N - d - 1; y++) for (let x = 1; x < N - w - 1; x++) {
      const cx = x + w / 2, cy = y + d / 2;
      const dist = Math.hypot(cx - m.inicio[0] - 0.5, cy - m.inicio[1] - 0.5);
      if (dist < op.min || dist > op.max) continue;
      let perto = 1e9, pertoNpc = 1e9;
      pontos.forEach((p) => { const dd = Math.hypot(p[0] - cx, p[1] - cy); perto = Math.min(perto, dd); if (p[2]) pertoNpc = Math.min(pertoNpc, dd); });
      if (perto < op.folga + Math.max(w, d) / 2) continue;
      if (!ok(x, y)) continue;
      const nota = (op.espalhar ? Math.min(pertoNpc, 9) * 2 : 0) + Math.min(perto, 8) - Math.abs(dist - (op.min + op.max) / 2) * 0.4;
      if (!melhor || nota > melhor[0]) melhor = [nota, x, y];
    }
    return melhor ? [melhor[1], melhor[2]] : null;
  }

  // ---------------- MAPA CENTRAL ----------------
  MAPAS.hub = function () {
    const m = ERS.novoMapa(104, 20261);
    const costa = (ix) => {
      if (ix < 0.3) return 0.84 + Math.sin(ix * 20) * 0.015;
      if (ix < 0.56) return 0.79;
      if (ix < 0.86) return 0.775 - Math.sin((ix - 0.56) * 10) * 0.02;
      return 0.775 - (ix - 0.86) * 1.5;
    };
    base(m, { costa, montanha: (ix) => 0.13 + Math.sin(ix * 9) * 0.03 + (ix < 0.25 ? 0.05 : 0), hMont: 42, hMax: 9 });
    // vulcão (geotermia) — canto superior esquerdo: cone, cratera com lava, derrames e fumarolas
    vulcao(m, 0.075, 0.06, 0.13, 0.17, { hMax: 12, derrames: [1.9, 2.9, 0.15], angLava: 1.25, fumarolas: [[0.32, 0.5], [0.3, 2.3], [0.4, 1.0]], solo: T.ROCHA });
    // lago de montanha e barragem
    zona(m, 0.34, 0.075, 0.075, 0.07, (x, y) => m.set(x, y, T.RIO, 3), 0.3);
    zona(m, 0.34, 0.075, 0.1, 0.1, (x, y) => { if (m.T(x, y) !== T.RIO) m.set(x, y, T.FLORESTA, Math.max(4, m.H(x, y))); }, 0.3);
    // rio principal
    rio(m, [[0.355, 0.15], [0.37, 0.22], [0.45, 0.255], [0.54, 0.235], [0.62, 0.25], [0.69, 0.31], [0.76, 0.37], [0.83, 0.43], [0.9, 0.5], [0.99, 0.56]], 2.6);
    // córrego da cachoeira
    rio(m, [[0.585, -0.04], [0.59, 0.08], [0.6, 0.17], [0.615, 0.24]], 1.6, T.RIO, (x, y) => Math.max(0, m.H(x, y) - 1));
    // floresta tropical e cachoeira à direita
    zona(m, 0.74, 0.12, 0.16, 0.14, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.FLORESTA, Math.max(m.H(x, y), 2)); }, 0.6);
    // área desmatada e queimada (canto superior direito)
    zona(m, 0.95, 0.13, 0.08, 0.13, (x, y) => { if (!T.ehAgua(m.T(x, y))) { m.set(x, y, T.QUEIMADO, 2); if (m.r() < 0.12) m.fogo.push([x, y]); } }, 0.6);
    // agrofloresta
    zona(m, 0.78, 0.255, 0.07, 0.045, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.AGROFLORESTA, 1); }, 0.3);
    // pastagens
    zona(m, 0.8, 0.355, 0.08, 0.05, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.PASTO, 1); }, 0.3);
    // campos úmidos (várzea) ao longo do rio principal
    varzeas(m, { larg: 2, limiar: 0.5 });
    // lavouras
    zona(m, 0.69, 0.4, 0.05, 0.04, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.LAVOURA, 1); }, 0.2);
    // canaviais (monocultura)
    m.cada((x, y, ix, iy) => { if (ix > 0.87 && iy > 0.24 && iy < 0.47 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.CANA, 1); });
    // mineração: cava em bancadas, com rampa espiral e lago no fundo
    cava(m, 0.1, 0.33, 0.1, 0.12, { niveis: 3, h0: 1, angRampa: -0.6, irr: 0.06 });
    tipoEm(m, 0.13, 0.435, 0.035, 0.022, T.REJEITO, 0, 0.3);
    // colinas eólicas
    zona(m, 0.09, 0.64, 0.1, 0.12, (x, y, d) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.GRAMA, 1 + Math.round((1 - d) * 3)); }, 0.3);
    // córrego poluído da termelétrica até o mar
    // canal que devolve ao mar a água aquecida no resfriamento da termelétrica (poluição térmica)
    rio(m, [[0.27, 0.64], [0.3, 0.7], [0.31, 0.78], [0.32, 0.86]], 1.8);
    // lixão
    tipoEm(m, 0.26, 0.4, 0.03, 0.035, T.LIXO, 1, 0.2);
    // porto
    m.cada((x, y, ix, iy) => { if (ix > 0.36 && ix < 0.56 && iy > 0.68 && iy < 0.8 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.PATIO, 1); });
    [[0.4, 0.8, 0.4, 0.87], [0.47, 0.8, 0.47, 0.88], [0.53, 0.8, 0.53, 0.86]].forEach((p) => m.caminho([[p[0], p[1]], [p[2], p[3]]], 1, (x, y) => m.set(x, y, T.CAIS, 1)));
    // ilhas
    [[0.2, 0.93, 0.04, 0.025], [0.62, 0.95, 0.05, 0.03], [0.9, 0.86, 0.04, 0.03], [0.97, 0.72, 0.03, 0.03]].forEach((il) => zona(m, il[0], il[1], il[2], il[3], (x, y, d) => m.set(x, y, d < 0.5 ? T.FLORESTA : T.AREIA, 1), 0.4));
    // falésia do farol
    zona(m, 0.12, 0.82, 0.06, 0.04, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.GRAMA, 3); }, 0.2);

    // estradas
    estrada(m, [[0.05, 0.47], [0.2, 0.47], [0.36, 0.46]]);
    estrada(m, [[0.64, 0.46], [0.74, 0.47], [0.8, 0.5], [0.9, 0.44], [0.96, 0.4]]);
    estrada(m, [[0.45, 0.62], [0.45, 0.72]]);
    estrada(m, [[0.2, 0.47], [0.19, 0.3], [0.17, 0.2]]);
    estrada(m, [[0.36, 0.56], [0.24, 0.6], [0.1, 0.62]]);
    estrada(m, [[0.6, 0.62], [0.68, 0.66], [0.8, 0.68]]);
    estrada(m, [[0.6, 0.3], [0.66, 0.25], [0.72, 0.22]]);
    estrada(m, [[0.74, 0.47], [0.8, 0.36], [0.86, 0.33]]);
    // cidade (ruas primeiro; prédios depois dos marcos)
    cidade(m, 0.5, 0.46, 21, 21, { passo: 5, soRuas: true });
    suavizarEstradas(m);

    // usinas e marcos da referência
    edI(m, 'geotermica', 0.17, 0.13, [2, 2]);
    represa(m, 0.352, 0.145, 2, 3);
    edI(m, 'casaForca', 0.38, 0.18, [1, 1]);
    edI(m, 'beneficiamento', 0.21, 0.3, [2, 2]);
    edI(m, 'usinaSolar', 0.29, 0.52, [2, 2]); edI(m, 'usinaSolar', 0.33, 0.55, [2, 2]); edI(m, 'usinaSolar', 0.27, 0.565, [2, 2]);
    edI(m, 'termeletrica', 0.24, 0.63, [2, 2], 0, { id: 'hubTermo' });
    edI(m, 'datacenter', 0.76, 0.52, [2, 2]);
    edI(m, 'biomassa', 0.92, 0.42, [2, 2]);
    edI(m, 'lixao', 0.26, 0.4, [2, 2], 0, { id: 'hubLixao' });
    edI(m, 'reciclagem', 0.5, 0.66, [2, 2]);
    edI(m, 'fazenda', 0.71, 0.36, [1, 1]); edI(m, 'fazenda', 0.84, 0.3, [1, 1]);
    edI(m, 'farol', 0.12, 0.81, [1, 1]);
    edI(m, 'escola', 0.56, 0.58, [2, 2]);
    edI(m, 'igreja', 0.44, 0.5, [1, 1]);
    // porto
    for (let i = 0; i < 9; i++) edI(m, 'containers', 0.38 + (i % 3) * 0.035, 0.71 + Math.floor(i / 3) * 0.025, [1, 1], i);
    edI(m, 'galpao', 0.5, 0.72, [2, 1]); edI(m, 'galpao', 0.53, 0.75, [2, 1], 1);
    edI(m, 'guindaste', 0.44, 0.78, [1, 1]); edI(m, 'guindaste', 0.5, 0.79, [1, 1]);
    const tn = m.tile(0.44, 0.86); deco(m, 'navio', tn[0] + 0.5, tn[1] + 0.5, 0, { agua: true, profExtra: 1 }); m.ocupar(tn[0] - 2, tn[1], 5, 1);
    // aerogeradores
    [[0.04, 0.58], [0.08, 0.55], [0.12, 0.6], [0.06, 0.66], [0.11, 0.69], [0.15, 0.65], [0.03, 0.72], [0.16, 0.74]].forEach((p) => edI(m, 'torreEolica', p[0], p[1], [1, 1]));
    // maremotriz
    [[0.76, 0.86], [0.8, 0.87], [0.84, 0.86]].forEach((p) => { const t = m.tile(p[0], p[1]); deco(m, 'turbinaMare', t[0], t[1], 0, { fp: [1, 1], h: 0 }); m.ocupar(t[0], t[1], 1, 1); });
    const tp = m.tile(0.64, 0.9); deco(m, 'plataformaPetroleo', tp[0], tp[1], 0, { fp: [2, 2], h: 0, id: 'hubPlataforma' }); m.ocupar(tp[0], tp[1], 2, 2);
    // mineração: caminhões, escavadeiras e perfuratrizes trabalhando na cava
    maquinasCava(m);
    // praia
    [[0.64, 0.74], [0.67, 0.75], [0.7, 0.745], [0.73, 0.75], [0.77, 0.745]].forEach((p, i) => { const t = m.tile(p[0], p[1]); deco(m, 'guardaSol', t[0] + 0.5, t[1] + 0.5, i); });
    edI(m, 'quiosque', 0.69, 0.72, [1, 1]);
    // vilas e casas espalhadas
    cidade(m, 0.68, 0.645, 8, 6, { passo: 4, tipos: ['casa', 'casa', 'casaSolar'], densidade: 0.8, centro: false });
    // linhas de transmissão
    linhaTransmissao(m, [[0.36, 0.2], [0.33, 0.27], [0.32, 0.34], [0.33, 0.41]]);
    linhaTransmissao(m, [[0.2, 0.62], [0.27, 0.5], [0.33, 0.47]]);
    linhaTransmissao(m, [[0.14, 0.58], [0.21, 0.55], [0.27, 0.5]]);

    // marcadores de missão (pins), narradora e placas: fora das estradas e pontes
    const foraDaVia = (p) => {
      const t = m.tile(p[0], p[1]);
      const ok = (x, y) => m.dentro(x, y) && !m.bloq[m.i(x, y)] && m.T(x, y) !== T.ESTRADA && m.T(x, y) !== T.PONTE && !T.ehAgua(m.T(x, y)) && m.T(x, y) !== T.LAVA;
      if (ok(t[0], t[1])) return t;
      for (let r = 1; r <= 5; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(t[0] + dx, t[1] + dy)) return [t[0] + dx, t[1] + dy];
      return t;
    };
    const pinTiles = [];
    const PINS = { solar: [0.31, 0.49], eolica: [0.14, 0.555], hidro: [0.4, 0.285], mare: [0.74, 0.715], geo: [0.24, 0.2], cana: [0.87, 0.37], residuos: [0.46, 0.66], floresta: [0.72, 0.18], mineracao: [0.21, 0.38], dados: [0.72, 0.555], rede: [0.5, 0.42] };
    ERS.MISSOES.forEach((ms) => {
      const p = PINS[ms.id]; const t = foraDaVia(p);
      if (m.bloq[m.i(t[0], t[1])]) m.bloq[m.i(t[0], t[1])] = 0;
      if (!T.props[m.T(t[0], t[1])].andavel || m.T(t[0], t[1]) === T.LAVA || m.T(t[0], t[1]) === T.PONTE) m.set(t[0], t[1], T.GRAMA, Math.max(1, m.H(t[0], t[1])));
      if (m.T(t[0], t[1]) === T.CANA) m.set(t[0], t[1], T.TERRA); // clareira no canavial para o marcador
      m.ent({ kind: 'pin', ref: ms.id, x: t[0] + 0.5, y: t[1] + 0.5, cor: ms.cor, icone: ms.icone, rotulo: ms.nome });
      m.bloq[m.i(t[0], t[1])] = 1;
      pinTiles.push(t);
    });
    // narrador e placas
    const hub = ERS.HUB;
    const tn2 = foraDaVia([0.475, 0.525]);
    m.ent({ kind: 'npc', papelJogo: 'narrador', x: tn2[0] + 0.5, y: tn2[1] + 0.5, nome: hub.narrador.nome, papel: hub.narrador.papel, voz: hub.narrador.voz, look: ERS.LOOKS.iara, marcador: 'narrador' });
    m.ocupar(tn2[0], tn2[1], 1, 1);
    [[0.53, 0.52], [0.36, 0.42], [0.62, 0.68]].forEach((p, i) => { const t = foraDaVia(p); if (m.bloq[m.i(t[0], t[1])]) return; m.ent({ kind: 'info', ref: i, spr: 'placa', x: t[0] + 0.5, y: t[1] + 0.5 }); m.ocupar(t[0], t[1], 1, 1); });
    m.inicio = m.tile(0.495, 0.535);
    m.bloq[m.i(m.inicio[0], m.inicio[1])] = 1;
    // implementos do campo e da cidade
    implemento(m, 'pivoCentral', 0.69, 0.4, [3, 3], 0, { tipos: [T.LAVOURA], raio: 4 });
    maquina(m, 'trator', 0.67, 0.43, 0, { tipos: [T.LAVOURA, T.GRAMA], raio: 4 });
    implemento(m, 'silos', 0.725, 0.35, [1, 1], 0, { raio: 3 });
    implemento(m, 'galpaoRural', 0.86, 0.315, [1, 1], 1, { raio: 3 });
    implemento(m, 'curral', 0.77, 0.33, [1, 1], 0, { raio: 3 });
    implemento(m, 'caixaDagua', 0.71, 0.62, [1, 1], 0, { raio: 4 });
    implemento(m, 'posto', 0.6, 0.465, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.6, 0.37, [1, 1], 0, { raio: 4 });
    implemento(m, 'eta', 0.53, 0.29, [1, 1], 0, { raio: 4 });
    implemento(m, 'subestacao', 0.25, 0.5, [1, 1], 0, { raio: 3 });
    maquina(m, 'tratorEsteira', 0.2, 0.36, 0, { raio: 3 });
    maquina(m, 'urubus', 0.29, 0.43, 0, { raio: 3 }); maquina(m, 'urubus', 0.23, 0.39, 1, { raio: 3 });
    maquina(m, 'carretaPa', 0.18, 0.5, 0, { tipos: [T.GRAMA], raio: 4 });
    // arranjo de energia limpa da cidade
    arranjos(m, 'hub', [[0.6, 0.56]]);
    pastagens(m);
    cidade(m, 0.5, 0.46, 21, 21, { passo: 5, densidade: 0.8, agora: true, soPredios: true });
    arborizar(m, { densFloresta: 2, densGrama: 0.07, densPalma: 0.12 });
    m.bloq[m.i(m.inicio[0], m.inicio[1])] = 0;
    pinTiles.forEach((t) => { m.bloq[m.i(t[0], t[1])] = 0; });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'cidade';
    return m;
  };

  // ---------------- MISSÕES ----------------
  function ms(id) { return ERS.MISSOES.find((x) => x.id === id); }

  MAPAS.solar = function () {
    const m = ERS.novoMapa(72, 101);
    base(m, { costa: (ix) => 0.88 + Math.sin(ix * 7) * 0.02, montanha: (ix) => (ix > 0.5 ? 0.14 + (ix - 0.5) * 0.25 : 0.06), hMont: 26, hMax: 5 });
    zona(m, 0.18, 0.17, 0.15, 0.13, (x, y) => m.set(x, y, T.RIO, 0), 0.4);
    zona(m, 0.68, 0.18, 0.18, 0.16, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.FLORESTA, Math.max(2, m.H(x, y))); }, 0.5);
    tipoEm(m, 0.86, 0.56, 0.08, 0.08, T.TERRA, 1, 0.4);
    cidade(m, 0.5, 0.56, 22, 22, { passo: 5, densidade: 0.85 });
    estrada(m, [[0.6, 0.48], [0.86, 0.5]]);
    estrada(m, [[0.36, 0.4], [0.3, 0.3]]);
    suavizarEstradas(m);
    conteudo(m, ms('solar'), {
      narrador: [0.47, 0.6], inicio: [0.5, 0.63],
      npcs: [[0.4, 0.56], [0.58, 0.44], [0.69, 0.66], [0.33, 0.47]],
      lotes: { escola: [0.45, 0.46], degradado: [0.86, 0.56], mata: [0.66, 0.2], lago: [0.18, 0.17], casas: [0.55, 0.65], estac: [0.38, 0.7] },
      problemas: { diesel: [0.62, 0.53, [1, 1]] },
      infos: [[0.52, 0.55], [0.31, 0.36]],
    });
    deco(m, 'veleiro', m.tile(0.2, 0.2)[0] + 2.5, m.tile(0.2, 0.2)[1] + 0.5, 1, { agua: true });
    arranjos(m, 'solar', [[0.66, 0.4]]);
    implemento(m, 'caixaDagua', 0.64, 0.7, [1, 1], 0, { raio: 4 });
    implemento(m, 'posto', 0.72, 0.52, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.78, 0.62, [1, 1], 0, { raio: 4 });
    implemento(m, 'subestacao', 0.82, 0.45, [1, 1], 0, { raio: 4 });
    maquina(m, 'trator', 0.84, 0.6, 2, { raio: 3 });
    arborizar(m, { densFloresta: 2, densGrama: 0.1, densPalma: 0.15 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'cidade';
    return m;
  };

  MAPAS.eolica = function () {
    const m = ERS.novoMapa(72, 202);
    base(m, { costa: (ix) => 0.78 + Math.sin(ix * 5) * 0.03, montanha: () => 0.02, hMont: 10 });
    // serra (crista diagonal)
    m.cada((x, y, ix, iy) => {
      const crista = 0.24 - (ix - 0.4) * 0.05;
      const d = Math.abs(iy - crista);
      if (d < 0.17 && !T.ehAgua(m.T(x, y))) {
        const h = Math.round(1 + (1 - d / 0.17) * 4.5 + (m.ruido(x * 0.2, y * 0.2) - 0.5));
        m.set(x, y, h >= 3 && m.ruido(x * 0.17 + 9, y * 0.17) > 0.42 ? T.CERRADO : T.GRAMA, Math.max(1, h));
      }
    });
    tipoEm(m, 0.24, 0.6, 0.08, 0.07, T.RIO, 0, 0.4);
    tipoEm(m, 0.24, 0.6, 0.12, 0.1, T.MANGUE, 1, 0.4);
    tipoEm(m, 0.24, 0.6, 0.08, 0.07, T.RIO, 0, 0.4);
    // dunas
    m.cada((x, y, ix, iy) => { if (iy > 0.68 && iy < 0.8 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.AREIA, 1 + (m.ruido(x * 0.3, y * 0.3) > 0.6 ? 1 : 0)); });
    cidade(m, 0.78, 0.54, 10, 10, { passo: 5, tipos: ['casa', 'casa', 'casa', 'quiosque'], densidade: 0.7, centro: false });
    estrada(m, [[0.1, 0.48], [0.5, 0.47], [0.72, 0.5]]);
    estrada(m, [[0.42, 0.47], [0.42, 0.3]]);
    suavizarEstradas(m);
    conteudo(m, ms('eolica'), {
      narrador: [0.5, 0.42], inicio: [0.52, 0.44],
      npcs: [[0.62, 0.7], [0.32, 0.5], [0.66, 0.42], [0.36, 0.26]],
      lotes: { crista1: [0.24, 0.22], crista2: [0.42, 0.2], crista3: [0.6, 0.22], vila: [0.76, 0.44], aves: [0.31, 0.56], mar: [0.62, 0.88], sub: [0.45, 0.52] },
      problemas: { carvao: [0.53, 0.58, [2, 2]] },
      infos: [[0.48, 0.32], [0.7, 0.62]],
    });
    linhaTransmissao(m, [[0.24, 0.3], [0.33, 0.36], [0.42, 0.42]]);
    linhaTransmissao(m, [[0.6, 0.3], [0.52, 0.37], [0.44, 0.44]]);
    arranjos(m, 'eolica', [[0.88, 0.63]]);
    maquina(m, 'carretaPa', 0.3, 0.44, 0, { tipos: [T.GRAMA, T.CERRADO], raio: 4 });
    implemento(m, 'galpaoRural', 0.14, 0.42, [1, 1], 0, { raio: 4 });
    implemento(m, 'caixaDagua', 0.84, 0.48, [1, 1], 0, { raio: 4 });
    implemento(m, 'posto', 0.6, 0.52, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.5, 0.18, [1, 1], 0, { raio: 4 });
    arborizar(m, { densGrama: 0.05, densPalma: 0.12, tropical: false });
    for (let i = 0; i < 6; i++) { const t = m.tile(0.2 + i * 0.015, 0.6 + (i % 2) * 0.02); deco(m, 'barco', t[0] + 0.5, t[1] + 0.5, i, { agua: true }); i++; }
    limpar(m);
    garantirAcesso(m);
    m.tema = 'mar';
    return m;
  };

  MAPAS.hidro = function () {
    const m = ERS.novoMapa(72, 303);
    base(m, { montanha: (ix) => 0.32 - Math.abs(ix - 0.3) * 0.25, hMont: 26, hMax: 8, solo: T.GRAMA });
    m.cada((x, y, ix, iy) => { if (m.T(x, y) === T.GRAMA && m.ruido.fbm(x * 0.1, y * 0.1, 3) > 0.48) m.set(x, y, T.FLORESTA); });
    // reservatório
    zona(m, 0.27, 0.15, 0.17, 0.11, (x, y) => m.set(x, y, T.RIO, 3), 0.4);
    // rio a jusante
    rio(m, [[0.33, 0.29], [0.38, 0.38], [0.46, 0.48], [0.56, 0.56], [0.68, 0.66], [0.8, 0.78], [0.92, 0.92], [1.02, 1.05]], 2.6);
    // barragem
    represa(m, 0.325, 0.27, 3, 3);
    // várzeas e uma lavoura irrigada rio abaixo
    varzeas(m, { larg: 2, limiar: 0.48 });
    zona(m, 0.86, 0.6, 0.07, 0.06, (x, y) => { if (!T.ehAgua(m.T(x, y)) && m.T(x, y) !== T.ESTRADA) m.set(x, y, T.LAVOURA, 1); }, 0.15);
    m.cada((x, y, ix, iy) => { if (iy < 0.3 && iy > 0.24 && !T.ehAgua(m.T(x, y)) && m.T(x, y) !== T.PATIO && Math.abs(ix - 0.32) < 0.15) m.setH(x, y, Math.max(m.H(x, y), 2)); });
    // margens desmatadas
    m.cada((x, y, ix, iy) => {
      if (T.ehAgua(m.T(x, y))) return;
      const dRio = Math.abs((iy - 0.46) - (ix - 0.45) * 0.95);
      if (ix > 0.38 && ix < 0.62 && dRio < 0.07) m.set(x, y, T.TERRA, 1);
    });
    cidade(m, 0.72, 0.42, 10, 9, { passo: 4, tipos: ['casa', 'casa', 'casaSolar', 'casa'], densidade: 0.75, centro: false });
    estrada(m, [[0.41, 0.29], [0.5, 0.36], [0.64, 0.42], [0.8, 0.44], [0.98, 0.5]]);
    estrada(m, [[0.5, 0.36], [0.4, 0.6], [0.2, 0.7]]);
    suavizarEstradas(m);
    conteudo(m, ms('hidro'), {
      narrador: [0.56, 0.4], inicio: [0.58, 0.42],
      npcs: [[0.53, 0.62], [0.73, 0.52], [0.42, 0.3], [0.3, 0.6]],
      lotes: { barragem: [0.4, 0.305], corredeira: [0.7, 0.62], represa: [0.22, 0.12], encosta: [0.12, 0.4], vila: [0.66, 0.36] },
      problemas: { margens: [0.5, 0.47] },
      infos: [[0.6, 0.5], [0.26, 0.5]],
    });
    m.margens = { ix0: 0.38, ix1: 0.62 };
    arranjos(m, 'hidro', [[0.78, 0.7]]);
    implemento(m, 'pivoCentral', 0.86, 0.6, [3, 3], 1, { tipos: [T.LAVOURA], raio: 4 });
    maquina(m, 'trator', 0.82, 0.55, 3, { raio: 4 });
    implemento(m, 'silos', 0.8, 0.38, [1, 1], 0, { raio: 4 });
    implemento(m, 'galpaoRural', 0.86, 0.42, [1, 1], 1, { raio: 4 });
    implemento(m, 'casaForca', 0.4, 0.33, [1, 1], 0, { raio: 3 });
    canoas(m, [[0.6, 0.6], [0.74, 0.72], [0.86, 0.86]]);
    arborizar(m, { densFloresta: 2, densGrama: 0.08 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'floresta';
    return m;
  };

  MAPAS.mare = function () {
    const m = ERS.novoMapa(72, 404);
    base(m, { costa: (ix) => 0.46 + Math.sin(ix * 6) * 0.02, montanha: () => 0.04, hMont: 20 });
    // baía com manguezal
    zona(m, 0.78, 0.36, 0.1, 0.14, (x, y) => m.set(x, y, T.AGUA_RASA, 0), 0.4);
    zona(m, 0.8, 0.24, 0.08, 0.06, (x, y) => m.set(x, y, T.MANGUE, 1), 0.5);
    rio(m, [[0.82, 0.0], [0.81, 0.15], [0.8, 0.25]], 2);
    // óleo
    zona(m, 0.58, 0.76, 0.12, 0.09, (x, y) => { if (T.ehAgua(m.T(x, y))) m.set(x, y, T.OLEO, 0); }, 0.8);
    m.cada((x, y, ix, iy) => { if (ix > 0.52 && ix < 0.66 && iy > 0.4 && iy < 0.48 && m.T(x, y) === T.AREIA) m.set(x, y, T.OLEO, 1); });
    cidade(m, 0.42, 0.24, 18, 14, { passo: 5, densidade: 0.8 });
    // porto
    m.cada((x, y, ix, iy) => { if (ix > 0.12 && ix < 0.3 && iy > 0.34 && iy < 0.47 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.PATIO, 1); });
    m.caminho([[0.2, 0.47], [0.2, 0.56]], 1, (x, y) => m.set(x, y, T.CAIS, 1));
    estrada(m, [[0.1, 0.36], [0.3, 0.38], [0.6, 0.36], [0.7, 0.3]]);
    suavizarEstradas(m);
    conteudo(m, ms('mare'), {
      narrador: [0.45, 0.4], inicio: [0.47, 0.42],
      npcs: [[0.7, 0.2], [0.58, 0.42], [0.25, 0.4], [0.37, 0.43]],
      lotes: { baia: [0.72, 0.5], canal: [0.48, 0.56], quebramar: [0.28, 0.66], mangue: [0.74, 0.25], porto: [0.18, 0.4], largo: [0.38, 0.82] },
      problemas: { oleo: [0.57, 0.74, [2, 2]] },
      infos: [[0.54, 0.31], [0.32, 0.34]],
    });
    for (let i = 0; i < 6; i++) edI(m, 'containers', 0.14 + (i % 3) * 0.035, 0.36 + Math.floor(i / 3) * 0.04, [1, 1], i);
    edI(m, 'guindaste', 0.24, 0.45, [1, 1]);
    edI(m, 'farol', 0.04, 0.42, [1, 1]);
    const tn = m.tile(0.24, 0.53); deco(m, 'navio', tn[0] + 1.5, tn[1] + 0.5, 1, { agua: true, profExtra: 1 }); m.ocupar(tn[0] - 1, tn[1], 5, 1);
    arranjos(m, 'mare', [[0.64, 0.32]]);
    implemento(m, 'galpao', 0.28, 0.36, [2, 1], 0, { raio: 3 });
    implemento(m, 'torreCelular', 0.5, 0.12, [1, 1], 0, { raio: 4 });
    implemento(m, 'caixaDagua', 0.3, 0.16, [1, 1], 0, { raio: 4 });
    implemento(m, 'posto', 0.66, 0.26, [1, 1], 0, { raio: 4 });
    canoas(m, [[0.81, 0.08], [0.8, 0.18]]);
    arborizar(m, { densGrama: 0.08, densPalma: 0.2 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'mar';
    return m;
  };

  MAPAS.geo = function () {
    const m = ERS.novoMapa(72, 505);
    base(m, { costa: (ix) => 0.86 - ix * 0.08, montanha: () => 0.05, hMont: 20 });
    // grande vulcão: cone, borda da cratera, lago de lava, derrames de basalto e fumarolas
    vulcao(m, 0.5, 0.06, 0.24, 0.26, { hMax: 12, derrames: [1.0, 2.3, 2.9], angLava: 1.75, fumarolas: [[0.34, 1.2], [0.4, 2.1], [0.3, 0.5]] });
    m.cada((x, y, ix, iy) => { if (m.T(x, y) === T.GRAMA && m.ruido.fbm(x * 0.12, y * 0.12, 3) > 0.55) m.set(x, y, T.FLORESTA); });
    tipoEm(m, 0.22, 0.48, 0.1, 0.08, T.CINZA_VULC, 1, 0.3);
    tipoEm(m, 0.36, 0.62, 0.03, 0.025, T.AGUA_RASA, 1, 0.2);
    cidade(m, 0.6, 0.66, 14, 12, { passo: 4, tipos: ['casa', 'casa', 'casa', 'predio', 'casaSolar'], densidade: 0.75, centro: false });
    estrada(m, [[0.22, 0.42], [0.4, 0.55], [0.55, 0.6], [0.8, 0.62]]);
    estrada(m, [[0.4, 0.55], [0.36, 0.7]]);
    suavizarEstradas(m);
    conteudo(m, ms('geo'), {
      narrador: [0.47, 0.5], inicio: [0.49, 0.52],
      npcs: [[0.27, 0.56], [0.56, 0.48], [0.38, 0.66], [0.68, 0.56]],
      lotes: { campo: [0.2, 0.47], encosta: [0.44, 0.27], poco: [0.12, 0.56], estufa: [0.63, 0.5], filtro: [0.3, 0.42], fonte: [0.36, 0.59] },
      problemas: { oleo: [0.8, 0.66, [2, 2]] },
      infos: [[0.43, 0.42], [0.58, 0.56]],
    });
    // fumarolas do campo geotérmico (a cratera já solta fumaça)
    m.vapor = m.vapor || [];
    [[0.18, 0.4], [0.26, 0.52], [0.15, 0.5], [0.35, 0.61]].forEach((p) => m.vapor.push(m.tile(p[0], p[1])));
    arranjos(m, 'geo', [[0.78, 0.55]]);
    implemento(m, 'caixaDagua', 0.68, 0.74, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.3, 0.32, [1, 1], 0, { raio: 4 });
    implemento(m, 'galpaoRural', 0.85, 0.48, [1, 1], 1, { raio: 4 });
    maquina(m, 'trator', 0.82, 0.44, 1, { raio: 4 });
    arborizar(m, { densFloresta: 2, densGrama: 0.06, densPalma: 0.1 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'industria';
    return m;
  };

  MAPAS.cana = function () {
    const m = ERS.novoMapa(72, 606);
    base(m, { solo: T.CANA, praia: false });
    m.cada((x, y, ix, iy) => {
      // talhões com carreadores (estradas de terra)
      if ((x % 9 === 0 || y % 9 === 0) && m.T(x, y) === T.CANA) m.set(x, y, T.TERRA, 1);
    });
    rio(m, [[0.3, -0.02], [0.27, 0.3], [0.24, 0.6], [0.22, 1.02]], 1.8);
    zona(m, 0.8, 0.2, 0.1, 0.1, (x, y) => { if (!T.ehAgua(m.T(x, y))) { m.set(x, y, T.QUEIMADO, 1); if (m.r() < 0.18) m.fogo.push([x, y]); } }, 0.5);
    m.cada((x, y, ix, iy) => { if (ix > 0.42 && ix < 0.66 && iy > 0.32 && iy < 0.52 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.PATIO, 1); });
    // lagoa de vinhaça ao lado da estrada (e não embaixo dela)
    tipoEm(m, 0.375, 0.615, 0.03, 0.024, T.REJEITO, 0, 0.2);
    zona(m, 0.14, 0.68, 0.08, 0.08, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.PASTO, 1); }, 0.3);
    cidade(m, 0.56, 0.84, 14, 8, { passo: 4, tipos: ['casa', 'casa', 'casaSolar', 'predio'], densidade: 0.75, centro: false });
    estrada(m, [[0.05, 0.6], [0.3, 0.55], [0.5, 0.5], [0.56, 0.75]]);
    estrada(m, [[0.6, 0.42], [0.8, 0.35], [0.95, 0.3]]);
    suavizarEstradas(m);
    // talhão em plena colheita: metade já colhida (soqueira e palha), metade de cana em pé
    const tc = m.tile(0.36, 0.3), qx = Math.floor(tc[0] / 9) * 9, qy = Math.floor(tc[1] / 9) * 9;
    for (let y = qy + 1; y < qy + 9; y++) for (let x = qx + 1; x < qx + 5; x++) if (m.T(x, y) === T.CANA) m.set(x, y, T.CANA_COLHIDA, 1);
    conteudo(m, ms('cana'), {
      narrador: [0.47, 0.55], inicio: [0.49, 0.57],
      npcs: [[0.6, 0.7], [0.72, 0.3], [0.56, 0.36], [0.2, 0.62]],
      lotes: { usina: [0.5, 0.42], vinhaca: [0.45, 0.52], palha: [0.62, 0.45], corrego: [0.29, 0.45], faixa: [0.73, 0.58], curral: [0.14, 0.64] },
      problemas: { queima: [0.8, 0.22] },
      infos: [[0.53, 0.5], [0.66, 0.62]],
    });
    edI(m, 'galpao', 0.55, 0.36, [2, 1]);
    [0.46, 0.49].forEach((x) => edI(m, 'containers', x, 0.36, [1, 1], 2));
    edI(m, 'fazenda', 0.1, 0.7, [1, 1]);
    // colhedora trabalhando na divisa entre a cana colhida e a cana em pé, com o transbordo ao lado
    { const xs = qx + 4, ys = qy + 4; ed(m, 'colhedoraCana', xs, ys, [1, 1]); ed(m, 'transbordo', xs, ys - 1, [1, 1]); }
    // pátio da usina: balança, pilhas de cana, tanques de etanol e caminhões canavieiros
    edI(m, 'balancaCana', 0.6, 0.41, [1, 1]);
    edI(m, 'pilhaCana', 0.44, 0.4, [1, 1], 0); edI(m, 'pilhaCana', 0.42, 0.43, [1, 1], 1);
    edI(m, 'tanquesEtanol', 0.62, 0.36, [1, 1]); edI(m, 'tanquesEtanol', 0.645, 0.38, [1, 1]);
    edI(m, 'caminhaoCana', 0.565, 0.43, [1, 1], 0); edI(m, 'caminhaoCana', 0.5, 0.48, [1, 1], 1);
    edI(m, 'caminhaoCana', 0.66, 0.42, [1, 1], 2);
    m.semCorVeiculo = '#2f7ad2';
    m.semZigueZague = true;
    m.animaisExtras = [];
    arranjos(m, 'cana', [[0.34, 0.69]]);
    implemento(m, 'silos', 0.68, 0.4, [1, 1], 0, { raio: 3 });
    implemento(m, 'galpaoRural', 0.12, 0.62, [1, 1], 1, { raio: 4 });
    implemento(m, 'curral', 0.17, 0.73, [1, 1], 0, { raio: 4 });
    maquina(m, 'caminhaoPipa', 0.74, 0.27, 0, { raio: 4 });
    maquina(m, 'trator', 0.62, 0.66, 0, { raio: 4 });
    implemento(m, 'caixaDagua', 0.62, 0.8, [1, 1], 0, { raio: 4 });
    pastagens(m);
    arborizar(m, { densGrama: 0.08 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'floresta';
    return m;
  };

  MAPAS.residuos = function () {
    const m = ERS.novoMapa(72, 707);
    base(m, { montanha: () => 0.03, hMont: 20 });
    rio(m, [[0.3, -0.02], [0.24, 0.35], [0.2, 0.65], [0.16, 1.02]], 2);
    tipoEm(m, 0.14, 0.24, 0.09, 0.09, T.LIXO, 1, 0.4);
    rio(m, [[0.17, 0.27], [0.22, 0.32]], 1.2, T.REJEITO);
    cidade(m, 0.54, 0.52, 24, 22, { passo: 5, densidade: 0.85 });
    m.cada((x, y, ix, iy) => { if (ix > 0.74 && ix < 0.92 && iy > 0.5 && iy < 0.72 && m.T(x, y) !== T.ESTRADA && !T.ehAgua(m.T(x, y))) m.set(x, y, T.PATIO, 1); });
    zona(m, 0.86, 0.2, 0.09, 0.08, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.PASTO, 1); }, 0.3);
    estrada(m, [[0.18, 0.4], [0.4, 0.4]]);
    estrada(m, [[0.7, 0.4], [0.86, 0.3]]);
    estrada(m, [[0.66, 0.6], [0.84, 0.62]]);
    suavizarEstradas(m);
    conteudo(m, ms('residuos'), {
      narrador: [0.47, 0.5], inicio: [0.49, 0.52],
      npcs: [[0.3, 0.33], [0.6, 0.38], [0.24, 0.45], [0.76, 0.56]],
      lotes: { galpao: [0.33, 0.24], gas: [0.24, 0.2], praca: [0.5, 0.58], horta: [0.62, 0.46], industria: [0.82, 0.66], granja: [0.86, 0.2] },
      problemas: { lixao: [0.14, 0.24, [2, 2]] },
      infos: [[0.4, 0.44], [0.55, 0.42]],
    });
    edI(m, 'fabrica', 0.78, 0.56, [2, 2]); edI(m, 'fabrica', 0.86, 0.6, [2, 2]); edI(m, 'galpao', 0.8, 0.7, [2, 1]);
    edI(m, 'fazenda', 0.9, 0.16, [1, 1]); edI(m, 'fazenda', 0.82, 0.24, [1, 1], 1);
    m.animaisExtras = [];
    for (let i = 0; i < 6; i++) { const t = m.tile(0.84 + (i % 3) * 0.02, 0.2 + Math.floor(i / 3) * 0.03); m.animaisExtras.push({ x: t[0] + 0.5, y: t[1] + 0.5, spr: 'vaca', v: 1, terreno: T.PASTO }); }
    arranjos(m, 'residuos', [[0.36, 0.11]]);
    maquina(m, 'urubus', 0.2, 0.3, 0, { raio: 3 }); maquina(m, 'urubus', 0.1, 0.32, 1, { raio: 3 });
    implemento(m, 'eta', 0.27, 0.58, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.7, 0.3, [1, 1], 0, { raio: 4 });
    implemento(m, 'curral', 0.8, 0.16, [1, 1], 0, { raio: 4 });
    implemento(m, 'silos', 0.92, 0.22, [1, 1], 0, { raio: 4 });
    pastagens(m);
    arborizar(m, { densGrama: 0.09 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'industria';
    return m;
  };

  MAPAS.floresta = function () {
    const m = ERS.novoMapa(72, 808);
    base(m, { solo: T.FLORESTA, praia: false });
    rio(m, [[-0.02, 0.36], [0.2, 0.42], [0.42, 0.48], [0.62, 0.53], [0.8, 0.5], [1.02, 0.54]], 2.4);
    zona(m, 0.68, 0.3, 0.14, 0.12, (x, y) => { if (!T.ehAgua(m.T(x, y))) { m.set(x, y, T.QUEIMADO, 1); if (m.r() < 0.16) m.fogo.push([x, y]); } }, 0.5);
    zona(m, 0.3, 0.68, 0.14, 0.1, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.GRAMA_SECA, 1); }, 0.4);
    zona(m, 0.68, 0.7, 0.1, 0.08, (x, y) => { if (!T.ehAgua(m.T(x, y))) m.set(x, y, T.GRAMA, 1); }, 0.3);
    tipoEm(m, 0.45, 0.46, 0.05, 0.03, T.TERRA, 1, 0.2);
    for (let i = 0; i < 8; i++) { const t = m.tile(0.62 + (i % 4) * 0.035, 0.66 + Math.floor(i / 4) * 0.06); ed(m, i % 3 ? 'casa' : 'cooperativa', t[0], t[1], [1, 1], i); }
    estrada(m, [[0.68, 0.62], [0.56, 0.6], [0.4, 0.62], [0.24, 0.7]]);
    suavizarEstradas(m);
    conteudo(m, ms('floresta'), {
      narrador: [0.58, 0.64], inicio: [0.6, 0.66],
      npcs: [[0.34, 0.72], [0.56, 0.4], [0.74, 0.62], [0.44, 0.55]],
      lotes: { queimada: [0.6, 0.34], pasto: [0.28, 0.64], margem: [0.45, 0.45], viveiro: [0.72, 0.74], clareira: [0.66, 0.6], curral: [0.2, 0.74] },
      problemas: { fogo: [0.72, 0.26] },
      infos: [[0.52, 0.66], [0.38, 0.56]],
    });
    edI(m, 'fazenda', 0.22, 0.7, [1, 1]);
    m.animaisExtras = [];
    for (let i = 0; i < 5; i++) { const t = m.tile(0.26 + i * 0.02, 0.7); m.animaisExtras.push({ x: t[0] + 0.5, y: t[1] + 0.5, spr: 'vaca', v: i, terreno: T.GRAMA_SECA }); }
    arranjos(m, 'floresta', [[0.3, 0.52]]);
    implemento(m, 'curral', 0.24, 0.76, [1, 1], 0, { raio: 4 });
    implemento(m, 'galpaoRural', 0.19, 0.66, [1, 1], 1, { raio: 4 });
    implemento(m, 'caixaDagua', 0.7, 0.64, [1, 1], 0, { raio: 4 });
    canoas(m, [[0.12, 0.4], [0.5, 0.5], [0.74, 0.51], [0.9, 0.52]]);
    pastagens(m, T.GRAMA_SECA);
    arborizar(m, { densFloresta: 2, densGrama: 0.12 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'floresta';
    return m;
  };

  MAPAS.mineracao = function () {
    const m = ERS.novoMapa(72, 909);
    base(m, { montanha: (ix) => 0.22 + Math.sin(ix * 8) * 0.04, hMont: 30, hMax: 8 });
    m.cada((x, y, ix, iy) => { if (m.T(x, y) === T.GRAMA && m.ruido.fbm(x * 0.1, y * 0.1, 3) > 0.56) m.set(x, y, T.FLORESTA); });
    // cava em bancadas com rampa, lago no fundo e pilha de estéril ao lado
    cava(m, 0.28, 0.3, 0.12, 0.13, { niveis: 4, h0: 1, angRampa: 0.9, irr: 0.08, esteril: [0.11, 0.36, 0.05, 0.06] });
    zona(m, 0.48, 0.25, 0.06, 0.06, (x, y) => m.set(x, y, T.TERRA, 1), 0.3);
    rio(m, [[0.66, 0.26], [0.6, 0.42], [0.52, 0.6], [0.45, 0.8], [0.4, 1.02]], 2, T.REJEITO);
    const celRejeito = m._celRio.slice();
    rio(m, [[0.45, 0.8], [0.4, 1.02]], 2, T.RIO);
    // trecho marrom do rio, na ordem do curso (da barragem para jusante)
    {
      const vistos = new Set(), lista = [];
      celRejeito.forEach((q) => { const i = m.i(q[0], q[1]); if (!vistos.has(i) && m.tipo[i] === T.REJEITO) { vistos.add(i); lista.push(q); } });
      m.rioLista = lista;
      m.rioPos = new Float32Array(m.N * m.N).fill(-1);
      lista.forEach((q, k) => { m.rioPos[m.i(q[0], q[1])] = k / Math.max(1, lista.length - 1); });
    }
    cidade(m, 0.72, 0.6, 12, 10, { passo: 4, tipos: ['casa', 'casa', 'casa', 'casaSolar', 'predio'], densidade: 0.75, centro: false });
    estrada(m, [[0.28, 0.46], [0.5, 0.5], [0.66, 0.55], [0.9, 0.7]]);
    estrada(m, [[0.5, 0.5], [0.52, 0.32]]);
    suavizarEstradas(m);
    conteudo(m, ms('mineracao'), {
      narrador: [0.56, 0.52], inicio: [0.58, 0.54],
      npcs: [[0.66, 0.46], [0.44, 0.4], [0.76, 0.68], [0.4, 0.62]],
      lotes: { cava: [0.48, 0.25], eletronicos: [0.82, 0.62], agua: [0.55, 0.44], patio: [0.36, 0.52], morro: [0.14, 0.6], vila: [0.68, 0.52] },
      problemas: { barragem: [0.62, 0.17, [2, 2]] },
      infos: [[0.6, 0.6], [0.3, 0.5]],
    });
    edI(m, 'beneficiamento', 0.32, 0.46, [2, 2]);
    maquinasCava(m);
    correiaEntre(m, [0.36, 0.36], [0.35, 0.44]);
    maquina(m, 'tratorEsteira', 0.11, 0.36, 0, { tipos: [T.ESTERIL], raio: 3 });
    arranjos(m, 'mineracao', [[0.5, 0.67]]);
    implemento(m, 'caixaDagua', 0.76, 0.54, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.6, 0.7, [1, 1], 0, { raio: 4 });
    implemento(m, 'galpaoRural', 0.44, 0.48, [1, 1], 0, { raio: 3 });
    arborizar(m, { densFloresta: 2, densGrama: 0.06, tropical: false });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'industria';
    return m;
  };

  MAPAS.dados = function () {
    const m = ERS.novoMapa(72, 1010);
    base(m, { montanha: (ix) => (ix > 0.7 ? 0.3 : 0.04), hMont: 16, hMax: 5 });
    zona(m, 0.2, 0.22, 0.12, 0.1, (x, y, d) => m.set(x, y, d < 0.55 ? T.RIO : T.TERRA, d < 0.55 ? 0 : 1), 0.4);
    m.cada((x, y, ix, iy) => { if (ix > 0.42 && ix < 0.66 && iy > 0.22 && iy < 0.42 && !T.ehAgua(m.T(x, y))) m.set(x, y, T.PATIO, 1); });
    tipoEm(m, 0.76, 0.55, 0.07, 0.06, T.TERRA, 1, 0.3);
    cidade(m, 0.3, 0.64, 18, 16, { passo: 5, densidade: 0.85 });
    estrada(m, [[0.42, 0.44], [0.6, 0.46], [0.86, 0.5]]);
    suavizarEstradas(m);
    conteudo(m, ms('dados'), {
      narrador: [0.5, 0.46], inicio: [0.52, 0.48],
      npcs: [[0.36, 0.56], [0.42, 0.62], [0.26, 0.36], [0.6, 0.44]],
      lotes: { solar: [0.76, 0.55], vento: [0.85, 0.22], resfria: [0.6, 0.27], barreira: [0.44, 0.48], calor: [0.37, 0.48], 'pátio': [0.47, 0.25] },
      problemas: { diesel: [0.62, 0.34, [1, 1]] },
      infos: [[0.56, 0.5], [0.3, 0.46]],
    });
    edI(m, 'datacenter', 0.5, 0.32, [2, 2], 0, { profExtra: 0 });
    edI(m, 'datacenter', 0.55, 0.37, [2, 2], 2);
    edI(m, 'escola', 0.32, 0.53, [2, 2]);
    // campus: guarita na entrada, estacionamentos, subestação e postes de energia
    edI(m, 'guaritaDC', 0.465, 0.415, [1, 1]);
    edI(m, 'vagasCarros', 0.44, 0.36, [1, 1], 0); edI(m, 'vagasCarros', 0.44, 0.33, [1, 1], 1);
    edI(m, 'vagasCarros', 0.6, 0.4, [1, 1], 2);
    edI(m, 'subestacao', 0.64, 0.3, [1, 1]);
    edI(m, 'carregadorVE', 0.47, 0.38, [1, 1]);
    linhaTransmissao(m, [[0.68, 0.3], [0.76, 0.32], [0.84, 0.3]]);
    arranjos(m, 'dados', [[0.34, 0.24]]);
    implemento(m, 'torreCelular', 0.68, 0.22, [1, 1], 0, { raio: 4 });
    implemento(m, 'caixaDagua', 0.18, 0.68, [1, 1], 0, { raio: 4 });
    implemento(m, 'posto', 0.68, 0.48, [1, 1], 0, { raio: 4 });
    arborizar(m, { densGrama: 0.08 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'cidade';
    return m;
  };

  MAPAS.rede = function () {
    const m = ERS.novoMapa(80, 1111);
    base(m, { costa: (ix) => 0.84 - Math.max(0, ix - 0.6) * 0.15, montanha: (ix) => 0.16 + Math.sin(ix * 6) * 0.03, hMont: 30, hMax: 7 });
    zona(m, 0.62, 0.08, 0.08, 0.07, (x, y) => m.set(x, y, T.RIO, 4), 0.3);
    rio(m, [[0.6, 0.15], [0.58, 0.3], [0.62, 0.5], [0.7, 0.7], [0.74, 0.85]], 2);
    zona(m, 0.76, 0.22, 0.08, 0.08, (x, y, d) => m.set(x, y, T.GRAMA, 2 + Math.round((1 - d) * 2)), 0.2);
    cidade(m, 0.46, 0.52, 22, 20, { passo: 5, densidade: 0.88 });
    m.cada((x, y, ix, iy) => { if (ix > 0.76 && ix < 0.92 && iy > 0.42 && iy < 0.6 && !T.ehAgua(m.T(x, y)) && m.T(x, y) !== T.ESTRADA) m.set(x, y, T.PATIO, 1); });
    tipoEm(m, 0.2, 0.62, 0.07, 0.06, T.TERRA, 1, 0.3);
    estrada(m, [[0.12, 0.4], [0.3, 0.45]]);
    estrada(m, [[0.62, 0.48], [0.86, 0.5]]);
    estrada(m, [[0.56, 0.62], [0.7, 0.74]]);
    estrada(m, [[0.3, 0.36], [0.36, 0.2]]);
    suavizarEstradas(m);
    conteudo(m, ms('rede'), {
      narrador: [0.47, 0.6], inicio: [0.49, 0.62],
      npcs: [[0.42, 0.42], [0.64, 0.66], [0.56, 0.4], [0.34, 0.6]],
      lotes: { solar: [0.2, 0.6], vento1: [0.3, 0.13], vento2: [0.42, 0.12], mar: [0.5, 0.9], reversivel: [0.76, 0.2], bateria: [0.6, 0.36], biogas: [0.14, 0.3], controle: [0.5, 0.54], h2: [0.82, 0.5] },
      problemas: { carvao: [0.2, 0.42, [2, 2]], nuclear: [0.74, 0.74, [2, 2]] },
      infos: [[0.44, 0.64], [0.28, 0.5]],
    });
    represa(m, 0.6, 0.15, 2, 4);
    edI(m, 'subestacao', 0.58, 0.32, [1, 1]);
    linhaTransmissao(m, [[0.2, 0.36], [0.3, 0.32], [0.4, 0.3], [0.5, 0.3], [0.57, 0.28]]);
    linhaTransmissao(m, [[0.6, 0.22], [0.58, 0.28]]);
    linhaTransmissao(m, [[0.72, 0.68], [0.68, 0.56], [0.64, 0.44], [0.6, 0.38]]);
    linhaTransmissao(m, [[0.28, 0.62], [0.34, 0.48]]);
    arranjos(m, 'rede', [[0.3, 0.74]]);
    implemento(m, 'posto', 0.66, 0.5, [1, 1], 0, { raio: 4 });
    implemento(m, 'torreCelular', 0.24, 0.52, [1, 1], 0, { raio: 4 });
    implemento(m, 'caixaDagua', 0.62, 0.72, [1, 1], 0, { raio: 4 });
    varzeas(m, { larg: 1, limiar: 0.5 });
    canoas(m, [[0.62, 0.48], [0.7, 0.7]]);
    arborizar(m, { densFloresta: 2, densGrama: 0.07, densPalma: 0.12 });
    limpar(m);
    garantirAcesso(m);
    m.tema = 'cidade';
    return m;
  };

  // acabamento das estradas: liga trechos que só se tocam pela ponta e nivela degraus
  function acabarEstradas(m) {
    const eh = (x, y) => m.dentro(x, y) && (m.T(x, y) === T.ESTRADA || m.T(x, y) === T.PONTE);
    const livre = (x, y) => m.dentro(x, y) && !m.bloq[m.i(x, y)] && !T.ehAgua(m.T(x, y)) && T.props[m.T(x, y)].andavel;
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      if (!eh(x, y)) continue;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((d) => {
        if (!eh(x + d[0], y + d[1]) || eh(x + d[0], y) || eh(x, y + d[1])) return;
        // prefere o tile que não forma um quadrado 2 × 2 de asfalto
        const quadrado = (q) => [[0, 0], [-1, 0], [0, -1], [-1, -1]].some((o) => { const x0 = q[0] + o[0], y0 = q[1] + o[1]; return [[x0, y0], [x0 + 1, y0], [x0, y0 + 1], [x0 + 1, y0 + 1]].every((t) => (t[0] === q[0] && t[1] === q[1]) || eh(t[0], t[1])); });
        const opc = [[x + d[0], y], [x, y + d[1]]].filter((q) => livre(q[0], q[1])).sort((a2, b2) => quadrado(a2) - quadrado(b2));
        if (opc.length) { const q = opc[0]; m.set(q[0], q[1], T.ESTRADA, Math.max(1, Math.min(m.H(x, y), m.H(x + d[0], y + d[1])))); }
      });
    }
    let mudou = false;
    // as pontes ficam na mesma altura das estradas que chegam até elas
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      if (m.T(x, y) !== T.ESTRADA) continue;
      D4.forEach((d) => { if (m.T(x + d[0], y + d[1]) === T.PONTE && m.H(x, y) > 1) { m.setH(x, y, 1); mudou = true; } });
    }
    // nivela até não sobrar degrau entre tiles de estrada vizinhos
    for (let k = 0, mexeu = true; k < 40 && mexeu; k++) { mexeu = false; for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      if (!eh(x, y) || m.T(x, y) === T.PONTE) continue;
      D4.forEach((d) => {
        const nx = x + d[0], ny = y + d[1];
        if (!eh(nx, ny) || m.T(nx, ny) === T.PONTE) return;
        const a = m.H(x, y), b = m.H(nx, ny);
        if (a > b) { m.setH(x, y, b); mudou = true; mexeu = true; }
      });
    } }
    return mudou;
  }

  // construções extras de cada lugar (casas, comércio, sítios), em terrenos livres
  const EXTRAS = {
    solar: ['casaSolar', 'casaSolar', 'predioSolar', 'aquecedorSolar', 'carregadorVE', 'quiosque', 'casa', 'praca'],
    eolica: ['fazenda', 'casa', 'casa', 'cooperativa', 'quiosque', 'fazenda', 'casaSolar'],
    hidro: ['casa', 'casa', 'cooperativa', 'quiosque', 'fazenda', 'viveiro', 'casaSolar'],
    mare: ['quiosque', 'quiosque', 'guardaSol', 'guardaSol', 'casa', 'casa', 'casaSolar'],
    geo: ['estufa', 'estufa', 'casa', 'casa', 'quiosque', 'cooperativa', 'casaSolar'],
    cana: ['fazenda', 'fazenda', 'casa', 'casa', 'cooperativa', 'casaSolar', 'quiosque'],
    residuos: ['ecoponto', 'compostagem', 'casa', 'casa', 'predio', 'praca', 'casaSolar'],
    floresta: ['casa', 'casa', 'cooperativa', 'viveiro', 'quiosque', 'casaSolar'],
    mineracao: ['casa', 'casa', 'casa', 'escavadeira', 'caminhaoMina', 'cooperativa', 'igreja'],
    dados: ['predio', 'predio', 'casa', 'casa', 'praca', 'predioSolar', 'carregadorVE'],
    rede: ['predio', 'predioSolar', 'casaSolar', 'casaSolar', 'praca', 'carregadorVE', 'quiosque'],
  };
  function povoar(m, lista) {
    lista.forEach((spr, k) => {
      const t = acharLugar(m, 1, 1, { min: 6, max: 24, folga: 2.2 });
      if (!t) return;
      // tira árvores soltas do lugar escolhido
      m.ents = m.ents.filter((e) => !(e.kind === 'deco' && !e.fp && Math.floor(e.x) === t[0] && Math.floor(e.y) === t[1]));
      if (ALTOS.has(spr) && frenteNpc(m, t[0], t[1]) < 99) spr = 'casa';
      const e = ed(m, spr, t[0], t[1], [1, 1], k + 2);
      if (e) e.extra = true;
    });
  }

  ERS.gerarMapa = function (id) {
    const f = MAPAS[id];
    const m = f();
    m.id = id;
    acabarEstradas(m);
    // rede viária contínua: trechos soltos ligados à cidade e nenhuma ponta sem destino
    conectarRede(m);
    resolverPontas(m);
    conectarRede(m);
    resolverPontas(m);
    for (let k = 0; k < 3; k++) { afinarVias(m); resolverPontas(m); }
    acabarEstradas(m);
    afinarVias(m); resolverPontas(m);
    acabarEstradas(m);
    nivelarCorredor(m);
    limpar(m);
    if (EXTRAS[id]) povoar(m, EXTRAS[id]);
    garantirAcesso(m);
    return m;
  };
})();
