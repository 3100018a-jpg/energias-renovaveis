/* =========================================================
   Motor 2.5D: terreno com relevo, entidades, partículas,
   câmera que acompanha o jogador, caminhos e entrada.
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U, T = ERS.T, SPR = ERS.SPR, Q = ERS.Q;
  const TW = 64, TH = 32, HZ = SPR.HZ;

  const M = (ERS.M = {
    cam: { x: 0, y: 0, z: 1, livre: 0 },
    t: 0,
    particulas: [],
    veiculos: [], barcos: [], animais: [], passaros: [], nuvens: [],
    hover: null,
    jogador: null,
    pausado: false,
    efeitos: [],
  });

  // ---------- coordenadas ----------
  M.canto = (x, y, h) => [(x - y) * (TW / 2), (x + y) * (TH / 2) - (h || 0) * HZ];
  M.centro = (x, y, h) => [(x - y) * (TW / 2), (x + y) * (TH / 2) + TH / 2 - (h || 0) * HZ];
  M.pontoMundo = (fx, fy, h) => [(fx - fy) * (TW / 2), (fx + fy) * (TH / 2) - (h || 0) * HZ];
  M.telaParaTile = function (sx, sy) {
    // tela (css px) → mundo → tile (ignora altura; refinado depois)
    const w = M.telaParaMundo(sx, sy);
    const fx = (w[1] / (TH / 2) + w[0] / (TW / 2)) / 2;
    const fy = (w[1] / (TH / 2) - w[0] / (TW / 2)) / 2;
    return [fx, fy];
  };
  M.telaParaMundo = function (sx, sy) {
    return [(sx - M.W / 2) / M.cam.z + M.cam.x, (sy - M.H / 2) / M.cam.z + M.cam.y];
  };
  M.mundoParaTela = function (wx, wy) {
    return [(wx - M.cam.x) * M.cam.z + M.W / 2, (wy - M.cam.y) * M.cam.z + M.H / 2];
  };
  // tile sob o cursor considerando relevo (testa alturas de cima p/ baixo)
  M.tileSob = function (sx, sy) {
    const m = M.mapa; if (!m) return null;
    const w = M.telaParaMundo(sx, sy);
    for (let h = 12; h >= -4; h--) {
      const wy = w[1] + h * HZ;
      const fx = (wy / (TH / 2) + w[0] / (TW / 2)) / 2;
      const fy = (wy / (TH / 2) - w[0] / (TW / 2)) / 2;
      const x = Math.floor(fx), y = Math.floor(fy);
      if (m.dentro(x, y) && m.H(x, y) === h) return [x, y];
    }
    const f = M.telaParaTile(sx, sy);
    const x = Math.floor(f[0]), y = Math.floor(f[1]);
    return m.dentro(x, y) ? [x, y] : null;
  };

  // ---------- inicialização ----------
  M.iniciar = function (canvas) {
    M.cv = canvas;
    M.ctx = canvas.getContext('2d', { alpha: false });
    M.redimensionar();
    window.addEventListener('resize', M.redimensionar);
    M.entrada();
    ERS.bus.on('qualidade', () => { M.redimensionar(); if (M.mapa) { M.reconstruirCache(); M.popularVida(); } });
    let ultimo = performance.now(), acum = 0;
    const loop = (agora) => {
      requestAnimationFrame(loop);
      const dtReal = Math.min(0.25, (agora - ultimo) / 1000);
      ultimo = agora;
      acum += dtReal;
      const minDt = 1 / Q.cfg.fpsMax - 0.002;
      if (acum < minDt) return;
      const dt = Math.min(0.1, acum);
      acum = 0;
      Q.medir(dt, document.hidden);
      if (!M.mapa) return;
      M.atualizar(dt);
      M.desenhar();
    };
    requestAnimationFrame(loop);
  };

  M.redimensionar = function () {
    if (!M.cv) return;
    const r = M.cv.getBoundingClientRect();
    M.W = r.width || window.innerWidth; M.H = r.height || window.innerHeight;
    M.dpr = Math.min(window.devicePixelRatio || 1, Q.cfg.dpr);
    M.cv.width = Math.round(M.W * M.dpr); M.cv.height = Math.round(M.H * M.dpr);
    M.ctx.imageSmoothingEnabled = true; M.ctx.imageSmoothingQuality = 'high';
    if (M.mapa) M.limitarCamera();
  };

  // ---------- carregar mapa ----------
  M.carregar = function (mapa, opcoes) {
    opcoes = opcoes || {};
    M.mapa = mapa;
    M.particulas = []; M.efeitos = [];
    M.hover = null;
    // prepara entidades
    mapa.ents.forEach((e, i) => M.prepararEnt(e, i));
    M.ordenarEstaticas();
    // jogador
    let ini = opcoes.inicio || mapa.inicio;
    const ok = (t) => mapa.dentro(t[0], t[1]) && !mapa.bloq[mapa.i(t[0], t[1])] && T.props[mapa.T(t[0], t[1])].andavel;
    if (!ok(ini)) {
      let achou = null;
      for (let r = 1; r < 8 && !achou; r++) for (let dy = -r; dy <= r && !achou; dy++) for (let dx = -r; dx <= r; dx++) { const t = [ini[0] + dx, ini[1] + dy]; if (ok(t)) { achou = t; break; } }
      ini = achou || mapa.inicio;
    }
    M.jogador = { x: ini[0] + 0.5, y: ini[1] + 0.5, h: mapa.H(ini[0], ini[1]), caminho: [], dir: 1, andando: false, look: ERS.LOOK_JOGADOR, alvo: null, passoT: 0 };
    const p = M.posJogador();
    M.cam.x = p[0]; M.cam.y = p[1] - 20; M.cam.livre = 0;
    M.cam.z = M.W < 700 ? 0.8 : 1;
    M.reconstruirCache();
    M.listarAgua();
    M.popularVida();
    M.prepararMinimapa();
    M.limitarCamera();
  };

  M.prepararEnt = function (e, i) {
    const m = M.mapa;
    e.id = e.id || 'e' + i;
    const d = SPR.defs[e.spr];
    const bx = Math.floor(e.x), by = Math.floor(e.y);
    const h = e.h !== undefined ? e.h : m.H(U.clamp(bx, 0, m.N - 1), U.clamp(by, 0, m.N - 1));
    e.hBase = h;
    if (e.fp) {
      e.ax = e.x; e.ay = e.y;
      const c = M.canto(e.x, e.y, h);
      e.wx = c[0]; e.wy = c[1] - (e.z || 0);
      e.prof = e.x + e.fp[0] * 0.5 + e.y + e.fp[1] * 0.5 + (e.profExtra || 0);
      if (e.bloqueia !== false) m.ocupar(e.x, e.y, e.fp[0], e.fp[1]);
    } else {
      const c = M.pontoMundo(e.x, e.y, h);
      e.wx = c[0]; e.wy = c[1] - (e.z || 0);
      e.prof = e.x + e.y + (e.profExtra || 0);
      if (e.kind === 'npc') m.ocupar(bx, by, 1, 1);
    }
    if (d) {
      e.bb = [e.wx + d.b[0], e.wy + d.b[1], e.wx + d.b[2], e.wy + d.b[3]];
    } else {
      e.bb = [e.wx - 40, e.wy - 80, e.wx + 40, e.wy + 40];
    }
    if (e.kind === 'npc' || e.kind === 'pin') e.bb = [e.wx - 30, e.wy - 120, e.wx + 30, e.wy + 10];
    if (e.kind === 'lote') {
      const w = e.fp[0], dd = e.fp[1];
      e.bb = [e.wx - dd * 32 - 10, e.wy - 160, e.wx + w * 32 + 10, e.wy + (w + dd) * 16 + 10];
    }
    // emissores
    e._emis = [];
    const add = (lst, tipo) => (lst || []).forEach((f) => {
      const p = SPR.P(f[0], f[1], f[2]);
      e._emis.push({ wx: e.wx + p[0], wy: e.wy + p[1], tipo: tipo || f[3], acc: Math.random() });
    });
    if (d && !e.semFumaca) { add(d.fumaca); add(d.fogo, 'fogo'); }
    e.animado = !!(d && (d.rotor || d.rotorAgua)) || e._emis.length > 0 || e.kind !== 'deco';
  };

  M.trocarSprite = function (e, spr, v) {
    e.spr = spr; e.v = v || 0; e.semFumaca = false;
    M.prepararEnt(e, 0);
    M.ordenarEstaticas();
    if (Q.cfg.assar) M.reconstruirCache();
  };

  M.adicionarEnt = function (e) {
    M.mapa.ents.push(e);
    M.prepararEnt(e, M.mapa.ents.length - 1);
    M.ordenarEstaticas();
    if (Q.cfg.assar && !e.animado) M.reconstruirCache();
    return e;
  };
  M.removerEnt = function (e) {
    const i = M.mapa.ents.indexOf(e);
    if (i >= 0) M.mapa.ents.splice(i, 1);
    M.ordenarEstaticas();
    if (Q.cfg.assar) M.reconstruirCache();
  };

  M.ordenarEstaticas = function () {
    M.mapa.ents.sort((a, b) => a.prof - b.prof);
  };

  // ---------- terreno em blocos com resolução adaptativa ----------
  // O terreno é pintado em blocos (chunks) de 384 px do mundo. Cada bloco é
  // renderizado na escala que corresponde ao zoom × densidade de pixels da tela,
  // então o mapa continua nítido ao aproximar a câmera.
  const CH = 384, PAD = 2;
  const NIVEIS_ESCALA = [0.5, 0.75, 1, 1.5, 2, 3, 4];
  M.chunks = new Map();
  M._px = 0;
  M.escalaAlvo = function () {
    const alvo = M.cam.z * M.dpr;
    const max = Q.cfg.terrenoMax || 1;
    let s = NIVEIS_ESCALA.find((n) => n >= alvo * 0.92) || NIVEIS_ESCALA[NIVEIS_ESCALA.length - 1];
    return Math.min(s, max);
  };
  M.resSprite = function () {
    const alvo = M.cam.z * M.dpr;
    const max = Q.cfg.sprMax || 1;
    let s = [1, 1.5, 2, 3, 4].find((n) => n >= alvo * 0.95) || 4;
    return Math.min(s, max);
  };
  M.reconstruirCache = function () {
    M.chunks.clear(); M._px = 0;
    const r = M.mapa.ret;
    M.gx0 = r.x0; M.gy0 = r.y0 - 220;
    M.gnx = Math.ceil((r.x1 - M.gx0) / CH); M.gny = Math.ceil((r.y1 - M.gy0) / CH);
  };
  // invalida blocos de uma região de tiles (ou todos)
  M.pintarArea = function (reg) {
    if (!reg) { M.reconstruirCache(); return; }
    const a = M.canto(reg[0], reg[1], 0), b = M.canto(reg[2] + 1, reg[3] + 1, 0), cc = M.canto(reg[2] + 1, reg[1], 0), d = M.canto(reg[0], reg[3] + 1, 0);
    const clip = [Math.min(a[0], d[0]) - 40, Math.min(a[1], cc[1]) - 200, Math.max(cc[0], b[0]) + 40, Math.max(b[1], d[1]) + 80];
    M.chunks.forEach((ch, k) => {
      const x0 = M.gx0 + ch.i * CH, y0 = M.gy0 + ch.j * CH;
      if (x0 + CH < clip[0] || x0 > clip[2] || y0 + CH < clip[1] || y0 > clip[3]) return;
      M._px -= ch.cv.width * ch.cv.height; M.chunks.delete(k);
    });
  };
  function renderChunk(i, j, s) {
    const m = M.mapa, N = m.N;
    const x0 = M.gx0 + i * CH - PAD, y0 = M.gy0 + j * CH - PAD, L = CH + PAD * 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(L * s); cv.height = Math.ceil(L * s);
    const c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
    c.fillStyle = '#1d6db5'; c.fillRect(x0, y0, L, L);
    M._resTex = s >= 2.5 ? 4 : s >= 1.5 ? 3 : s > 0.8 ? 2 : 1;
    const det = Q.cfg.detalheTerreno;
    const r = m.ret;
    for (let soma = 0; soma <= 2 * N - 2; soma++) {
      const wyBase = soma * 16;
      if (wyBase - 14 * HZ > y0 + L || wyBase + 48 + 6 * HZ < y0 - 20) continue;
      for (let x = Math.max(0, soma - N + 1); x <= Math.min(N - 1, soma); x++) {
        const y = soma - x;
        const wx = (x - y) * 32;
        if (wx + 34 < x0 || wx - 34 > x0 + L) continue;
        if (wx < r.x0 - 70 || wx > r.x1 + 70 || wyBase < r.y0 - 260 || wyBase > r.y1 + 40) continue;
        const h = m.alt[y * N + x];
        if (wyBase - h * HZ - 4 > y0 + L || wyBase + 34 + (h + 4) * HZ < y0) continue;
        M.pintarTile(c, x, y, det);
      }
    }
    if (Q.cfg.assar) {
      const res = Math.min(2, Math.max(1, s));
      m.ents.forEach((e) => {
        if (e.kind !== 'deco' || e.animado || e.oculto) return;
        if (e.bb[2] < x0 || e.bb[0] > x0 + L || e.bb[3] < y0 || e.bb[1] > y0 + L) return;
        const sp = SPR.get(e.spr, e.v, res);
        if (sp) c.drawImage(sp.img, e.wx + sp.l, e.wy + sp.t, sp.w, sp.h);
      });
    }
    return { cv, s, i, j, uso: 0 };
  }
  M.desenharTerreno = function (c, vis) {
    const s = M.escalaAlvo();
    const i0 = Math.max(0, Math.floor((vis[0] - M.gx0) / CH)), i1 = Math.min(M.gnx - 1, Math.floor((vis[2] - M.gx0) / CH));
    const j0 = Math.max(0, Math.floor((vis[1] - M.gy0) / CH)), j1 = Math.min(M.gny - 1, Math.floor((vis[3] - M.gy0) / CH));
    let orc = 2;
    const agora = performance.now();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = i + ',' + j;
      let ch = M.chunks.get(k);
      if (!ch || (ch.s !== s && orc > 0)) {
        if (ch) { orc--; M._px -= ch.cv.width * ch.cv.height; }
        ch = renderChunk(i, j, s);
        M.chunks.set(k, ch); M._px += ch.cv.width * ch.cv.height;
      }
      ch.uso = agora;
      const x0 = M.gx0 + i * CH - PAD, y0 = M.gy0 + j * CH - PAD, L = CH + PAD * 2;
      c.drawImage(ch.cv, x0, y0, L, L);
    }
    // descarta blocos antigos acima do orçamento de memória
    const lim = Q.cfg.memTerreno || 16e6;
    if (M._px > lim) {
      const lista = [...M.chunks.entries()].sort((a, b) => a[1].uso - b[1].uso);
      for (const [k, ch] of lista) { if (M._px <= lim * 0.8 || ch.uso === agora) break; M._px -= ch.cv.width * ch.cv.height; M.chunks.delete(k); }
    }
  };

  // ruído determinístico por tile
  const rnd = (x, y, k) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
  const DURO = new Set([T.ESTRADA, T.PONTE, T.URBANO, T.PATIO, T.CAIS]);
  const VEGETAL = new Set([T.GRAMA, T.FLORESTA, T.PASTO, T.AGROFLORESTA, T.LAVOURA, T.CANA, T.GRAMA_SECA, T.MANGUE]);
  M.pintarTile = function (c, x, y, det) {
    const m = M.mapa;
    const t = m.T(x, y), h = m.H(x, y);
    const pr = T.props[t];
    const sx = (x - y) * 32, sy = (x + y) * 16 - h * HZ;
    const cx = sx, cy = sy + 16;
    // ---- faces laterais com degradê, estratos e borda de vegetação ----
    const hl = m.dentro(x, y + 1) ? m.H(x, y + 1) : Math.min(0, h);
    const hr = m.dentro(x + 1, y) ? m.H(x + 1, y) : Math.min(0, h);
    const corLado = pr.lado || '#2a7cc4';
    const lado = (pts, escurecer, dh, k) => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath();
      const g = c.createLinearGradient(0, Math.min(pts[0][1], pts[1][1]), 0, Math.max(pts[2][1], pts[3][1]));
      g.addColorStop(0, U.shade(corLado, escurecer + 0.08)); g.addColorStop(1, U.shade(corLado, escurecer - 0.2));
      c.fillStyle = g; c.fill();
      if (!pr.agua) {
        // estratos ondulados e pedrinhas
        c.strokeStyle = 'rgba(40,25,15,.10)'; c.lineWidth = 0.7;
        for (let s2 = 1; s2 < dh * 2; s2++) {
          const o = s2 * HZ / 2 + (rnd(x, y, s2 + k) - 0.5) * 2;
          c.beginPath(); c.moveTo(pts[0][0], pts[0][1] + o);
          c.quadraticCurveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2 + o + (rnd(x, y, s2 * 3 + k) - 0.5) * 3, pts[1][0], pts[1][1] + o); c.stroke();
        }
        c.fillStyle = 'rgba(255,240,220,.12)';
        for (let i = 0; i < 3 + dh; i++) {
          const u = rnd(x, y, i * 7 + k), v2 = rnd(y, x, i * 5 + k);
          const px = U.lerp(pts[0][0], pts[1][0], u), py = U.lerp(pts[0][1], pts[1][1], u) + 3 + v2 * (dh * HZ - 4);
          c.beginPath(); c.ellipse(px, py, 1.2, 0.7, 0, 0, 7); c.fill();
        }
        if (VEGETAL.has(t)) {
          // franja de grama que escorre pela borda
          c.fillStyle = U.shade(pr.cor, -0.1);
          c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
          const n = 8;
          for (let i = 0; i <= n; i++) {
            const u = i / n;
            const px = U.lerp(pts[0][0], pts[1][0], u), py = U.lerp(pts[0][1], pts[1][1], u);
            c.lineTo(px, py + 1.6 + rnd(x, y, i + k * 9) * (i % 2 ? 3.2 : 1.6));
          }
          c.lineTo(pts[1][0], pts[1][1]); c.closePath(); c.fill();
        }
      }
    };
    if (hl < h) lado([[sx - 32, sy + 16], [sx, sy + 32], [sx, sy + 32 + (h - hl) * HZ], [sx - 32, sy + 16 + (h - hl) * HZ]], -0.02, h - hl, 1);
    if (hr < h) lado([[sx, sy + 32], [sx + 32, sy + 16], [sx + 32, sy + 16 + (h - hr) * HZ], [sx, sy + 32 + (h - hr) * HZ]], -0.24, h - hr, 2);
    // ---- topo ----
    if (t === T.ESTRADA || t === T.PONTE) { M.pintarEstrada(c, x, y, sx, sy, t); return; }
    const v = (x * 7 + y * 13 + ((x * y) % 5)) & 3;
    c.drawImage(T.textura(t, v, det, M._resTex || 2), sx - 32.5, sy - 0.25, 65, 32.5);
    const losango = () => { c.beginPath(); c.moveTo(sx, sy - 0.8); c.lineTo(sx + 33, sy + 16); c.lineTo(sx, sy + 32.8); c.lineTo(sx - 33, sy + 16); c.closePath(); };
    c.save();
    losango(); c.clip();
    // variação de cor em grande escala (pinceladas)
    // valores de ruído nos quatro vértices → degradês contínuos entre tiles vizinhos
    const fz = (u, v) => (m.ruido.fbm(u * 0.09, v * 0.09, 3) - 0.5) * 0.3;
    const tinta = (val) => (val >= 0 ? `rgba(255,248,205,${Math.min(0.2, val)})` : `rgba(12,32,22,${Math.min(0.2, -val)})`);
    const vA = fz(x, y), vB = fz(x + 1, y), vC = fz(x + 1, y + 1), vD = fz(x, y + 1);
    let g1 = c.createLinearGradient(sx - 32, sy + 16, sx + 32, sy + 16); g1.addColorStop(0, tinta(vD)); g1.addColorStop(1, tinta(vB));
    c.fillStyle = g1; c.fillRect(sx - 33, sy - 1, 66, 34);
    g1 = c.createLinearGradient(sx, sy, sx, sy + 32); g1.addColorStop(0, tinta(vA)); g1.addColorStop(1, tinta(vC));
    c.fillStyle = g1; c.fillRect(sx - 33, sy - 1, 66, 34);
    // vizinhos: [tile, ponto A da aresta, ponto B da aresta]
    const viz = [
      [x - 1, y, sx - 32, sy + 16, sx, sy],
      [x, y - 1, sx, sy, sx + 32, sy + 16],
      [x + 1, y, sx + 32, sy + 16, sx, sy + 32],
      [x, y + 1, sx, sy + 32, sx - 32, sy + 16],
    ];
    const grad = (q, cor, a0, alcance) => {
      const mx = (q[2] + q[4]) / 2, my = (q[3] + q[5]) / 2;
      const g = c.createLinearGradient(mx, my, U.lerp(mx, cx, alcance), U.lerp(my, cy, alcance));
      g.addColorStop(0, U.rgb(U.hex(cor), a0)); g.addColorStop(1, U.rgb(U.hex(cor), 0));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.lineTo(cx, cy); c.closePath(); c.fill();
    };
    viz.forEach((q, k) => {
      if (!m.dentro(q[0], q[1])) return;
      const tn = m.T(q[0], q[1]), hn = m.H(q[0], q[1]);
      const pn = T.props[tn];
      // sombra de encosta mais alta atrás (oclusão ambiente)
      if ((k === 0 || k === 1) && hn > h) {
        const mx = (q[2] + q[4]) / 2, my = (q[3] + q[5]) / 2;
        const g = c.createLinearGradient(mx, my, U.lerp(mx, cx, 0.8), U.lerp(my, cy, 0.8));
        g.addColorStop(0, `rgba(10,25,20,${Math.min(0.32, 0.14 * (hn - h))})`); g.addColorStop(1, 'rgba(10,25,20,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.lineTo(cx, cy); c.closePath(); c.fill();
      }
      if (hn !== h || tn === t) return;
      if (pr.agua && !pn.agua) {
        // água rasa turquesa e espuma junto à margem
        if (t === T.OLEO || t === T.REJEITO) return;
        grad(q, '#9fe8ff', 0.5, 0.9);
      } else if (pr.agua && pn.agua) {
        grad(q, pn.cor, 0.55, 0.85);
      } else if (!pr.agua && pn.agua) {
        grad(q, t === T.AREIA ? '#c9a868' : '#6a5a3a', 0.35, 0.55);
      } else if (!pr.agua && !pn.agua && !DURO.has(t) && !DURO.has(tn)) {
        // transição suave entre tipos de solo
        grad(q, pn.cor, 0.5, 0.75);
        c.fillStyle = U.rgb(U.hex(pn.cor), 0.55);
        for (let i = 0; i < 4; i++) {
          const u = 0.15 + rnd(x, y, i + k * 11) * 0.7, w = 0.08 + rnd(y, x, i + k * 13) * 0.22;
          const px = U.lerp(q[2], q[4], u), py = U.lerp(q[3], q[5], u);
          c.beginPath(); c.ellipse(U.lerp(px, cx, w), U.lerp(py, cy, w), 2.2 + rnd(x, y, i * 3) * 3, 1.2 + rnd(x, y, i * 4) * 1.5, 0, 0, 7); c.fill();
        }
      }
    });
    if (t === T.MAR_FUNDO) { c.fillStyle = 'rgba(0,20,60,.08)'; c.fillRect(sx - 33, sy - 1, 66, 34); }
    if (t === T.LAVA) { c.fillStyle = 'rgba(255,200,60,.25)'; c.fillRect(sx - 33, sy - 1, 66, 34); }
    c.restore();
    // espuma (fora do recorte para cruzar as emendas)
    if (pr.agua && t !== T.OLEO && t !== T.REJEITO) {
      viz.forEach((q, k) => {
        if (!m.dentro(q[0], q[1])) return;
        if (T.props[m.T(q[0], q[1])].agua || m.H(q[0], q[1]) < h) return;
        [[2.2, 0.75, 1.3], [5.5, 0.32, 0.9]].forEach((f, j) => {
          const ox = (cx - (q[2] + q[4]) / 2) / 16 * f[0], oy = (cy - (q[3] + q[5]) / 2) / 16 * f[0];
          c.strokeStyle = `rgba(255,255,255,${f[1]})`; c.lineWidth = f[2];
          c.beginPath(); c.moveTo(q[2] + ox, q[3] + oy);
          const ondas = 3;
          for (let i = 1; i <= ondas; i++) {
            const u0 = (i - 0.5) / ondas, u1 = i / ondas;
            const amp = (rnd(x, y, i + j * 5 + k) - 0.5) * 3;
            c.quadraticCurveTo(U.lerp(q[2], q[4], u0) + ox + amp * 0.3, U.lerp(q[3], q[5], u0) + oy + amp, U.lerp(q[2], q[4], u1) + ox, U.lerp(q[3], q[5], u1) + oy);
          }
          c.stroke();
        });
      });
    } else if (h > 0 && hl < h) {
      // luz suave na quina elevada
      c.strokeStyle = 'rgba(255,255,230,.18)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(sx - 32, sy + 16); c.lineTo(sx, sy + 32); c.stroke();
    }
  };

  M.pintarEstrada = function (c, x, y, sx, sy, t) {
    const m = M.mapa;
    const ehE = (tt) => tt === T.ESTRADA || tt === T.PONTE;
    const cx = sx, cy = sy + 16;
    const losangoTile = () => { c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 32, sy + 16); c.lineTo(sx, sy + 32); c.lineTo(sx - 32, sy + 16); c.closePath(); };
    if (t === T.PONTE) {
      // água por baixo + tabuleiro
      c.drawImage(T.textura(T.RIO, 0, 1, M._resTex || 2), sx - 32, sy + HZ, 64, 32);
    } else {
      c.drawImage(T.textura(T.URBANO, 1, 1, M._resTex || 2), sx - 32.5, sy - 0.25, 65, 32.5);
    }
    const lig = [
      [x - 1, y, -16, -8], [x + 1, y, 16, 8], [x, y - 1, 16, -8], [x, y + 1, -16, 8],
    ].filter((q) => m.dentro(q[0], q[1]) && ehE(m.T(q[0], q[1])));
    const asfalto = t === T.PONTE ? '#7a7f88' : '#5b616b';
    const L = 9;
    c.fillStyle = asfalto;
    // centro (cruzamento das duas faixas)
    c.beginPath(); c.moveTo(cx, cy - L); c.lineTo(cx + 2 * L, cy); c.lineTo(cx, cy + L); c.lineTo(cx - 2 * L, cy); c.closePath(); c.fill();
    lig.forEach((q) => {
      const ex = cx + q[2], ey = cy + q[3];
      const perp = q[2] * q[3] > 0 ? [L, -L / 2] : [L, L / 2];
      c.beginPath();
      c.moveTo(cx - perp[0], cy - perp[1]); c.lineTo(cx + perp[0], cy + perp[1]);
      c.lineTo(ex + perp[0], ey + perp[1]); c.lineTo(ex - perp[0], ey - perp[1]); c.closePath(); c.fill();
    });
    if (lig.length === 0) { losangoTile(); c.fill(); }
    // meio-fio claro ao longo das faixas
    const reta = lig.length === 2 && lig[0][2] === -lig[1][2];
    c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = 0.7;
    lig.forEach((q) => {
      const perp = q[2] * q[3] > 0 ? [L, -L / 2] : [L, L / 2];
      const f0 = reta ? 0 : 0.55;
      [1, -1].forEach((sg) => {
        const ax = cx + q[2] * f0 + sg * perp[0], ay = cy + q[3] * f0 + sg * perp[1];
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(cx + q[2] + sg * perp[0], cy + q[3] + sg * perp[1]); c.stroke();
      });
    });
    // faixa central tracejada
    c.strokeStyle = 'rgba(255,220,90,.9)'; c.lineWidth = 1; c.setLineDash([3, 3]);
    lig.forEach((q) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + q[2], cy + q[3]); c.stroke(); });
    c.setLineDash([]);
    if (t === T.PONTE) {
      c.strokeStyle = '#e8e8e8'; c.lineWidth = 1.5;
      lig.forEach((q) => {
        const perp = q[2] * q[3] > 0 ? [L + 1, -(L + 1) / 2] : [L + 1, (L + 1) / 2];
        [1, -1].forEach((sg) => { c.beginPath(); c.moveTo(cx + sg * perp[0], cy + sg * perp[1] - 4); c.lineTo(cx + q[2] + sg * perp[0], cy + q[3] + sg * perp[1] - 4); c.stroke(); });
      });
    }
  };

  // ---------- água animada ----------
  M.listarAgua = function () {
    const m = M.mapa;
    M.aguas = []; M.postes = []; M.lavas = [];
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      const t = m.T(x, y);
      if ((t === T.ESTRADA || t === T.PONTE) && (x * 7 + y * 3) % 4 === 0) { const c = M.centro(x, y, m.H(x, y)); M.postes.push([c[0] + 12, c[1] - 4]); }
      if (t === T.LAVA && (x + y) % 2 === 0) M.lavas.push(M.centro(x, y, m.H(x, y)));
    }
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      const t = m.T(x, y);
      if ((t === T.MAR || t === T.MAR_FUNDO || t === T.RIO || t === T.AGUA_RASA) && ((x * 31 + y * 17) % 3 === 0)) {
        const c = M.centro(x, y, 0);
        M.aguas.push([c[0], c[1], (x * 1.3 + y * 0.7) % 6.28]);
      }
    }
  };

  // ---------- vida: veículos, barcos, animais, nuvens ----------
  M.popularVida = function () {
    const m = M.mapa, cfg = Q.cfg;
    const r = U.rng(m.seed + 5);
    M.veiculos = []; M.barcos = []; M.animais = []; M.passaros = []; M.nuvens = [];
    const estradas = [], mares = [], pastos = [];
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      const t = m.T(x, y);
      if ((t === T.ESTRADA || t === T.PONTE) && !(m.semZigueZague && ehEscada(m, x, y))) estradas.push([x, y]);
      else if ((t === T.MAR || t === T.MAR_FUNDO) && !m.bloq[m.i(x, y)]) mares.push([x, y]);
      else if (t === T.PASTO && !m.bloq[m.i(x, y)]) pastos.push([x, y]);
    }
    // só circulam veículos em redes de ruas contínuas (trechos curtos e isolados
    // fariam o carro ir e voltar sem parar)
    {
      const comp = new Int32Array(m.N * m.N).fill(-1), tam = [];
      estradas.forEach((e0) => {
        if (comp[m.i(e0[0], e0[1])] >= 0) return;
        const id = tam.length; let n = 0; const fila = [e0]; comp[m.i(e0[0], e0[1])] = id;
        while (fila.length) {
          const [x, y] = fila.pop(); n++;
          vizEstrada(x, y).forEach((q) => { const k = m.i(q[0], q[1]); if (comp[k] < 0) { comp[k] = id; fila.push(q); } });
        }
        tam.push(n);
      });
      const boas = estradas.filter((e0) => tam[comp[m.i(e0[0], e0[1])]] >= 14);
      estradas.length = 0; boas.forEach((e0) => estradas.push(e0));
    }
    const CORES = ['#e04a3a', '#2f7ad2', '#f0c419', '#ffffff', '#2fa05a', '#8a5bd0', '#ff8a3a', '#30c0c0'];
    const nv = Math.round(Math.min(estradas.length / 9, 46) * cfg.veiculos);
    for (let i = 0; i < nv && estradas.length > 2; i++) {
      const p = r.pick(estradas);
      // mapas podem dispensar veículos de certa cor (ex.: carro azul em zigue-zague nos canaviais)
      if (m.semCorVeiculo && CORES[i % CORES.length] === m.semCorVeiculo) continue;
      M.veiculos.push({ x: p[0], y: p[1], px: p[0], py: p[1], nx: p[0], ny: p[1], t: 1, vel: r.range(1.2, 2.2), cor: CORES[i % CORES.length], tipo: r() < 0.15 ? 'onibus' : r() < 0.25 ? 'caminhao' : 'carro' });
    }
    const nb = Math.round(Math.min(mares.length / 160, 9) * Math.max(cfg.veiculos, 0.3));
    for (let i = 0; i < nb && mares.length; i++) {
      const p = r.pick(mares);
      M.barcos.push({ x: p[0] + 0.5, y: p[1] + 0.5, ax: p[0] + 0.5, ay: p[1] + 0.5, vx: 0, vy: 0, t: 0, spr: r() < 0.6 ? 'veleiro' : 'barco', v: i, dir: 1 });
    }
    const na = Math.min(pastos.length / 6, 26);
    for (let i = 0; i < na; i++) {
      const p = r.pick(pastos);
      M.animais.push({ x: p[0] + 0.5, y: p[1] + 0.5, alvo: null, espera: r.range(0, 4), v: i, spr: 'vaca' });
    }
    (m.animaisExtras || []).forEach((a) => M.animais.push(Object.assign({ alvo: null, espera: 1 }, a)));
    if (cfg.nuvens) {
      const rr = m.ret;
      for (let i = 0; i < 7; i++) M.nuvens.push({ x: r.range(rr.x0, rr.x1), y: r.range(rr.y0, rr.y1), v: i % 3, s: r.range(0.8, 1.5), vel: r.range(6, 14) });
    }
  };

  function ehEstrada(m, x, y) { const t = m.T(x, y); return m.dentro(x, y) && (t === T.ESTRADA || t === T.PONTE); }
  // trecho em "escada" (curva de um só tile em estrada diagonal): carros ali andam em zigue-zague
  function ehEscada(m, x, y) {
    const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => ehEstrada(m, x + d[0], y + d[1]));
    const n = v.filter(Boolean).length;
    if (n !== 2) return false;
    return !((v[0] && v[1]) || (v[2] && v[3]));
  }
  function vizEstrada(x, y) {
    const m = M.mapa;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => [x + d[0], y + d[1]]).filter((p) => ehEstrada(m, p[0], p[1]) && !(m.semZigueZague && ehEscada(m, p[0], p[1])));
  }

  // ---------- caminhos (A*) ----------
  M.andavel = function (x, y) {
    const m = M.mapa;
    if (!m.dentro(x, y)) return false;
    if (m.bloq[m.i(x, y)]) return false;
    return T.props[m.T(x, y)].andavel;
  };
  M.caminho = function (sx, sy, tx, ty) {
    const m = M.mapa, N = m.N;
    if (!M.andavel(tx, ty)) return null;
    const custo = new Float32Array(N * N).fill(1e9);
    const veio = new Int32Array(N * N).fill(-1);
    const aberto = [];
    const push = (i, f) => { aberto.push([f, i]); let k = aberto.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (aberto[p][0] <= aberto[k][0]) break; [aberto[p], aberto[k]] = [aberto[k], aberto[p]]; k = p; } };
    const pop = () => { const top = aberto[0]; const ult = aberto.pop(); if (aberto.length) { aberto[0] = ult; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let s = k; if (a < aberto.length && aberto[a][0] < aberto[s][0]) s = a; if (b < aberto.length && aberto[b][0] < aberto[s][0]) s = b; if (s === k) break; [aberto[s], aberto[k]] = [aberto[k], aberto[s]]; k = s; } } return top; };
    const ini = sy * N + sx, fim = ty * N + tx;
    custo[ini] = 0; push(ini, 0);
    const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let it = 0;
    while (aberto.length && it++ < 40000) {
      const cur = pop()[1];
      if (cur === fim) break;
      const cx = cur % N, cy = (cur / N) | 0;
      const ch = m.alt[cur];
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!M.andavel(nx, ny)) continue;
        if (Math.abs(m.H(nx, ny) - ch) > 1) continue;
        if (d[2] > 1 && (!M.andavel(cx + d[0], cy) || !M.andavel(cx, cy + d[1]))) continue;
        const ni = ny * N + nx;
        const t = m.tipo[ni];
        const pref = t === T.ESTRADA || t === T.URBANO || t === T.PONTE ? 0.85 : 1;
        const nc = custo[cur] + d[2] * pref;
        if (nc < custo[ni]) {
          custo[ni] = nc; veio[ni] = cur;
          push(ni, nc + Math.hypot(nx - tx, ny - ty) * 0.9);
        }
      }
    }
    if (veio[fim] === -1 && ini !== fim) return null;
    const cam = [];
    let k = fim;
    while (k !== ini && k !== -1) { cam.push([k % N, (k / N) | 0]); k = veio[k]; }
    return cam.reverse();
  };

  // anda até o tile e (opcional) chama ao chegar
  M.irPara = function (tx, ty, aoChegar) {
    const j = M.jogador;
    const sx = Math.floor(j.x), sy = Math.floor(j.y);
    if (sx === tx && sy === ty) { if (aoChegar) aoChegar(); return true; }
    const c = M.caminho(sx, sy, tx, ty);
    if (!c) return false;
    j.caminho = c; j.aoChegar = aoChegar || null;
    M.cam.livre = 0;
    M.marcaDestino = { x: tx, y: ty, t: 0 };
    return true;
  };
  // anda até ficar ao lado de uma entidade
  M.irAte = function (e, aoChegar) {
    const j = M.jogador;
    const m = M.mapa;
    const w = e.fp ? e.fp[0] : 1, d = e.fp ? e.fp[1] : 1;
    const x0 = Math.floor(e.x), y0 = Math.floor(e.y);
    const cand = [];
    for (let y = y0 - 1; y <= y0 + d; y++) for (let x = x0 - 1; x <= x0 + w; x++) {
      if (x >= x0 && x < x0 + w && y >= y0 && y < y0 + d) continue;
      if (M.andavel(x, y)) cand.push([x, y]);
    }
    // já está perto?
    const jx = Math.floor(j.x), jy = Math.floor(j.y);
    if (cand.some((c) => c[0] === jx && c[1] === jy) || (jx >= x0 - 1 && jx <= x0 + w && jy >= y0 - 1 && jy <= y0 + d)) {
      j.caminho = []; if (aoChegar) aoChegar(); return true;
    }
    cand.sort((a, b) => Math.hypot(a[0] - j.x, a[1] - j.y) - Math.hypot(b[0] - j.x, b[1] - j.y));
    for (let i = 0; i < Math.min(cand.length, 8); i++) {
      if (M.irPara(cand[i][0], cand[i][1], aoChegar)) return true;
    }
    // alvo cercado (ex.: lote na água): procura a margem mais próxima
    for (let r = 2; r <= 7; r++) {
      const anel = [];
      for (let y = y0 - r; y < y0 + d + r; y++) for (let x = x0 - r; x < x0 + w + r; x++) {
        const dx = x < x0 ? x0 - x : x >= x0 + w ? x - (x0 + w - 1) : 0, dy = y < y0 ? y0 - y : y >= y0 + d ? y - (y0 + d - 1) : 0;
        if (Math.max(dx, dy) === r && M.andavel(x, y)) anel.push([x, y]);
      }
      if (anel.some((c) => c[0] === jx && c[1] === jy)) { j.caminho = []; if (aoChegar) aoChegar(); return true; }
      anel.sort((a, b) => Math.hypot(a[0] - j.x, a[1] - j.y) - Math.hypot(b[0] - j.x, b[1] - j.y));
      for (let i = 0; i < Math.min(anel.length, 6); i++) if (M.irPara(anel[i][0], anel[i][1], aoChegar)) return true;
    }
    ERS.bus.emit('aviso', 'Não há caminho até aqui. Tente outro acesso.');
    return false;
  };

  M.posJogador = function () {
    const j = M.jogador;
    return M.pontoMundo(j.x, j.y, j.h);
  };

  // ---------- atualização ----------
  M.atualizar = function (dt) {
    M.t += dt;
    const j = M.jogador, m = M.mapa;
    if (M.pausado) { j.andando = false; }
    if (!M.pausado) {
      // teclado
      const k = M.teclas;
      let kx = 0, ky = 0;
      if (k.ArrowUp || k.KeyW) { kx -= 1; ky -= 1; }
      if (k.ArrowDown || k.KeyS) { kx += 1; ky += 1; }
      if (k.ArrowLeft || k.KeyA) { kx -= 1; ky += 1; }
      if (k.ArrowRight || k.KeyD) { kx += 1; ky -= 1; }
      const vel = 3.4;
      j.andando = false;
      if (kx || ky) {
        j.caminho = []; j.aoChegar = null;
        const l = Math.hypot(kx, ky);
        const dx = kx / l * vel * dt, dy = ky / l * vel * dt;
        const tenta = (nx, ny) => {
          const tx = Math.floor(nx), ty = Math.floor(ny);
          if (!M.andavel(tx, ty)) return false;
          if (Math.abs(m.H(tx, ty) - m.H(Math.floor(j.x), Math.floor(j.y))) > 1) return false;
          j.x = nx; j.y = ny; return true;
        };
        const moveu = tenta(j.x + dx, j.y + dy) || tenta(j.x + dx, j.y) || tenta(j.x, j.y + dy);
        j.andando = moveu; M.cam.livre = 0;
        const sxm = dx - dy; if (Math.abs(sxm) > 0.0001) j.dir = sxm > 0 ? 1 : -1;
      } else if (j.caminho.length) {
        const alvo = j.caminho[0];
        const tx = alvo[0] + 0.5, ty = alvo[1] + 0.5;
        const dx = tx - j.x, dy = ty - j.y;
        const d = Math.hypot(dx, dy);
        const passo = vel * dt;
        let chegou = false, aoChegar = null;
        if (d <= passo) { j.x = tx; j.y = ty; j.caminho.shift(); if (!j.caminho.length) { chegou = true; aoChegar = j.aoChegar; j.aoChegar = null; M.marcaDestino = null; } }
        else { j.x += dx / d * passo; j.y += dy / d * passo; }
        const sxm = dx - dy; if (Math.abs(sxm) > 0.05) j.dir = sxm > 0 ? 1 : -1;
        j.andando = !chegou;
        if (aoChegar) aoChegar();
      }
      if (j.andando) {
        j.passoT += dt;
        if (j.passoT > 0.28) { j.passoT = 0; ERS.A.sfx('passo'); }
      }
      // altura suave
      const hAlvo = m.H(Math.floor(j.x), Math.floor(j.y));
      j.h += (hAlvo - j.h) * Math.min(1, dt * 10);
      ERS.bus.emit('posicao', j);
    }
    // câmera
    if (M.cam.livre > 0) M.cam.livre -= dt;
    else {
      const p = M.posJogador();
      const k = Math.min(1, dt * 3.2);
      M.cam.x += (p[0] - M.cam.x) * k;
      M.cam.y += (p[1] - 30 - M.cam.y) * k;
    }
    if (M.zoomAlvo) { M.cam.z += (M.zoomAlvo - M.cam.z) * Math.min(1, dt * 8); if (Math.abs(M.zoomAlvo - M.cam.z) < 0.002) M.zoomAlvo = null; }
    M.limitarCamera();
    M.atualizarVida(dt);
    M.atualizarParticulas(dt);
    M.efeitos = M.efeitos.filter((e) => (e.t += dt) < e.dur);
  };

  M.limitarCamera = function () {
    const r = M.mapa.ret, z = M.cam.z;
    const vw = M.W / z / 2, vh = M.H / z / 2;
    const mx = (r.x1 - r.x0) / 2, my = (r.y1 - r.y0) / 2;
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
    M.cam.x = vw >= mx ? cx : U.clamp(M.cam.x, r.x0 + vw, r.x1 - vw);
    M.cam.y = vh >= my ? cy : U.clamp(M.cam.y, r.y0 + vh - 120, r.y1 - vh);
  };

  M.atualizarVida = function (dt) {
    const m = M.mapa;
    M.veiculos.forEach((v) => {
      v.t += dt * v.vel;
      if (v.t >= 1) {
        v.t = 0; v.px = v.x; v.py = v.y; v.x = v.nx; v.y = v.ny;
        const viz = vizEstrada(v.x, v.y).filter((p) => !(p[0] === v.px && p[1] === v.py));
        const esc = viz.length ? viz[Math.floor(Math.random() * viz.length)] : [v.px, v.py];
        v.nx = esc[0]; v.ny = esc[1];
      }
    });
    M.barcos.forEach((b) => {
      b.t -= dt;
      if (b.t <= 0) {
        b.t = 6 + Math.random() * 8;
        for (let k = 0; k < 6; k++) {
          const ang = Math.random() * 6.28, d = 3 + Math.random() * 6;
          const nx = b.x + Math.cos(ang) * d, ny = b.y + Math.sin(ang) * d;
          const tt = m.T(Math.floor(nx), Math.floor(ny));
          if ((tt === T.MAR || tt === T.MAR_FUNDO) && !m.bloq[m.i(Math.floor(nx), Math.floor(ny))] ) { b.ax = nx; b.ay = ny; break; }
        }
      }
      const dx = b.ax - b.x, dy = b.ay - b.y, d = Math.hypot(dx, dy);
      if (d > 0.05) {
        const nx = b.x + dx / d * dt * 0.6, ny = b.y + dy / d * dt * 0.6;
        const tt = m.T(Math.floor(nx), Math.floor(ny));
        if (tt === T.MAR || tt === T.MAR_FUNDO) { b.x = nx; b.y = ny; } else b.t = 0;
        if (Math.abs(dx - dy) > 0.02) b.dir = dx - dy > 0 ? 1 : -1;
      }
    });
    M.animais.forEach((a) => {
      if (a.alvo) {
        const dx = a.alvo[0] - a.x, dy = a.alvo[1] - a.y, d = Math.hypot(dx, dy);
        if (d < 0.05) { a.alvo = null; a.espera = 2 + Math.random() * 5; }
        else { a.x += dx / d * dt * 0.35; a.y += dy / d * dt * 0.35; a.dir = dx - dy > 0 ? 1 : -1; }
      } else if ((a.espera -= dt) <= 0) {
        const nx = a.x + (Math.random() - 0.5) * 3, ny = a.y + (Math.random() - 0.5) * 3;
        const t = m.T(Math.floor(nx), Math.floor(ny));
        if ((t === (a.terreno === undefined ? T.PASTO : a.terreno)) && !m.bloq[m.i(Math.floor(nx), Math.floor(ny))]) a.alvo = [nx, ny]; else a.espera = 1;
      }
    });
    if (Q.cfg.passaros && Math.random() < dt * 0.05 && M.passaros.length < 3) {
      const r = m.ret;
      const daEsq = Math.random() < 0.5;
      M.passaros.push({ x: daEsq ? M.cam.x - M.W / M.cam.z : M.cam.x + M.W / M.cam.z, y: M.cam.y - M.H / M.cam.z * 0.3 + Math.random() * 200, vx: daEsq ? 60 : -60, n: 3 + Math.floor(Math.random() * 4), t: 0 });
    }
    M.passaros = M.passaros.filter((p) => { p.x += p.vx * dt; p.t += dt; return p.t < 40; });
    M.nuvens.forEach((n) => { n.x += n.vel * dt; if (n.x > m.ret.x1 + 300) n.x = m.ret.x0 - 300; });
  };

  // ---------- partículas ----------
  const PART = {
    escura: { vida: 4.2, r0: 3, r1: 16, cor: [70, 66, 64], a: 0.5, vy: -14, vx: 5 },
    vapor: { vida: 3.2, r0: 4, r1: 18, cor: [250, 252, 255], a: 0.62, vy: -16, vx: 4 },
    poeira: { vida: 3, r0: 3, r1: 14, cor: [170, 130, 90], a: 0.45, vy: -8, vx: 6 },
    fogo: { vida: 0.7, r0: 3.5, r1: 0.5, cor: [255, 150, 40], a: 0.95, vy: -26, vx: 0 },
    brilho: { vida: 1.1, r0: 2.5, r1: 0.5, cor: [255, 230, 90], a: 1, vy: -30, vx: 0 },
    folha: { vida: 1.4, r0: 2.6, r1: 1.5, cor: [110, 200, 80], a: 1, vy: -24, vx: 0 },
  };
  M.emitir = function (wx, wy, tipo, n, espalhar) {
    const lim = 900 * Q.cfg.particulas;
    for (let i = 0; i < n; i++) {
      if (M.particulas.length >= lim) return;
      const p = PART[tipo];
      const e = espalhar || 2;
      M.particulas.push({
        x: wx + (Math.random() - 0.5) * e * 2, y: wy + (Math.random() - 0.5) * e,
        vx: p.vx * (0.6 + Math.random() * 0.8) + (tipo === 'brilho' || tipo === 'folha' ? (Math.random() - 0.5) * 60 : 0),
        vy: p.vy * (0.6 + Math.random() * 0.8),
        t: 0, vida: p.vida * (0.7 + Math.random() * 0.6), tipo,
        k: tipo === 'fogo' ? Math.random() : 0,
      });
    }
  };
  M.atualizarParticulas = function (dt) {
    const m = M.mapa;
    const taxa = Q.cfg.particulas;
    if (taxa > 0) {
      const vis = M.visivel;
      m.ents.forEach((e) => {
        if (!e._emis.length || e.oculto || e.semFumaca) return;
        if (vis && (e.bb[2] < vis[0] - 100 || e.bb[0] > vis[2] + 100 || e.bb[3] < vis[1] - 200 || e.bb[1] > vis[3] + 200)) return;
        e._emis.forEach((em) => {
          em.acc += dt * (em.tipo === 'fogo' ? 14 : 3.2) * taxa;
          while (em.acc >= 1) { em.acc -= 1; M.emitir(em.wx, em.wy, em.tipo, 1, em.tipo === 'fogo' ? 3 : 2); }
        });
      });
      (m.fogo || []).forEach((f) => {
        if (f.apagado) return;
        const c = f.w || (f.w = M.centro(f[0], f[1], m.H(f[0], f[1])));
        if (vis && (c[0] < vis[0] - 60 || c[0] > vis[2] + 60 || c[1] < vis[1] - 60 || c[1] > vis[3] + 60)) return;
        f.acc = (f.acc || Math.random()) + dt * 10 * taxa;
        while (f.acc >= 1) { f.acc -= 1; M.emitir(c[0] + (Math.random() - 0.5) * 24, c[1] - 2, 'fogo', 1, 6); if (Math.random() < 0.18) M.emitir(c[0], c[1] - 14, 'escura', 1, 6); }
      });
      (m.vapor || []).forEach((f) => {
        const c = f.w || (f.w = M.centro(f[0], f[1], m.H(f[0], f[1])));
        if (vis && (c[0] < vis[0] - 60 || c[0] > vis[2] + 60 || c[1] < vis[1] - 200 || c[1] > vis[3] + 60)) return;
        f.acc = (f.acc || Math.random()) + dt * (f[3] || 2.2) * taxa;
        while (f.acc >= 1) { f.acc -= 1; M.emitir(c[0], c[1] - 4, f[2] || 'vapor', 1, 8); }
      });
    }
    const arr = M.particulas;
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      p.t += dt;
      if (p.t >= p.vida) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.tipo === 'brilho' || p.tipo === 'folha') p.vy += 40 * dt;
      arr[w++] = p;
    }
    arr.length = w;
  };

  // ---------- desenho ----------
  M.desenhar = function () {
    const c = M.ctx, m = M.mapa, z = M.cam.z, dpr = M.dpr;
    const cfg = Q.cfg;
    c.setTransform(1, 0, 0, 1, 0, 0);
    // fundo: oceano profundo
    const g = c.createLinearGradient(0, 0, 0, M.cv.height);
    g.addColorStop(0, '#2a7fc6'); g.addColorStop(1, '#165a9e');
    c.fillStyle = g; c.fillRect(0, 0, M.cv.width, M.cv.height);
    const s = dpr * z;
    c.setTransform(s, 0, 0, s, M.W / 2 * dpr - M.cam.x * s, M.H / 2 * dpr - M.cam.y * s);
    const vis = [M.cam.x - M.W / 2 / z, M.cam.y - M.H / 2 / z, M.cam.x + M.W / 2 / z, M.cam.y + M.H / 2 / z];
    M.visivel = vis;
    // terreno
    M.desenharTerreno(c, vis);
    // água cintilante
    if (cfg.agua) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
      const t = M.t;
      for (let i = 0; i < M.aguas.length; i++) {
        const a = M.aguas[i];
        if (a[0] < vis[0] - 20 || a[0] > vis[2] + 20 || a[1] < vis[1] - 20 || a[1] > vis[3] + 20) continue;
        const al = Math.sin(t * 1.6 + a[2] * 3) * 0.5 + 0.5;
        if (al < 0.45) continue;
        c.globalAlpha = (al - 0.45) * 0.9;
        const o = Math.sin(t * 0.8 + a[2]) * 4;
        c.beginPath(); c.moveTo(a[0] - 7 + o, a[1]); c.quadraticCurveTo(a[0] + o, a[1] - 2.5, a[0] + 7 + o, a[1]); c.stroke();
      }
      c.globalAlpha = 1;
    }
    // sombras de nuvens
    if (cfg.nuvens && cfg.sombras) M.nuvens.forEach((n) => { const sp = nuvemSprite(n.v, true); c.globalAlpha = 0.13; c.drawImage(sp, n.x - 130 * n.s + 60, n.y + 120, 260 * n.s, 120 * n.s); c.globalAlpha = 1; });
    // marcadores no chão
    M.desenharChao(c, vis);
    // entidades ordenadas
    const lista = [];
    const ents = m.ents;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.oculto) continue;
      if (cfg.assar && e.kind === 'deco' && !e.animado) continue;
      if (e.bb[2] < vis[0] || e.bb[0] > vis[2] || e.bb[3] < vis[1] || e.bb[1] > vis[3]) continue;
      lista.push(e);
    }
    const j = M.jogador;
    lista.push({ _jog: true, prof: j.x + j.y + 0.05 });
    M.veiculos.forEach((v) => {
      const fx = U.lerp(v.x, v.nx, v.t) + 0.5, fy = U.lerp(v.y, v.ny, v.t) + 0.5;
      const w = M.pontoMundo(fx, fy, m.H(v.x, v.y));
      if (w[0] < vis[0] - 30 || w[0] > vis[2] + 30 || w[1] < vis[1] - 30 || w[1] > vis[3] + 30) return;
      lista.push({ _veic: v, prof: fx + fy, wx: w[0], wy: w[1] });
    });
    M.barcos.forEach((b) => { const w = M.pontoMundo(b.x, b.y, 0); lista.push({ _barco: b, prof: b.x + b.y, wx: w[0], wy: w[1] }); });
    M.animais.forEach((a) => { const w = M.pontoMundo(a.x, a.y, m.H(Math.floor(a.x), Math.floor(a.y))); if (w[0] < vis[0] - 30 || w[0] > vis[2] + 30 || w[1] < vis[1] - 30 || w[1] > vis[3] + 30) return; lista.push({ _animal: a, prof: a.x + a.y, wx: w[0], wy: w[1] }); });
    lista.sort((a, b) => a.prof - b.prof);
    const res = M.resSprite();
    for (let i = 0; i < lista.length; i++) {
      const e = lista[i];
      if (e._jog) { M.desenharJogador(c); continue; }
      if (e._veic) { desenharVeiculo(c, e); continue; }
      if (e._barco) { const sp = SPR.get(e._barco.spr, e._barco.v, res); const bob = Math.sin(M.t * 2 + e._barco.v) * 1.2; c.save(); c.translate(e.wx, e.wy + bob); if (e._barco.dir < 0) c.scale(-1, 1); c.drawImage(sp.img, sp.l, sp.t, sp.w, sp.h); c.restore(); continue; }
      if (e._animal) { const a = e._animal; const sp = SPR.get(a.spr, a.v, res); c.save(); c.translate(e.wx, e.wy); if (a.dir < 0) c.scale(-1, 1); c.drawImage(sp.img, sp.l, sp.t, sp.w, sp.h); c.restore(); continue; }
      M.desenharEnt(c, e, res);
    }
    // cabos das linhas de transmissão
    if (m.linhas) {
      c.strokeStyle = 'rgba(40,45,60,.55)'; c.lineWidth = 0.9;
      m.linhas.forEach((L) => {
        for (let i = 0; i < L.length - 1; i++) {
          const a = M.centro(L[i][0], L[i][1], m.H(L[i][0], L[i][1])), b = M.centro(L[i + 1][0], L[i + 1][1], m.H(L[i + 1][0], L[i + 1][1]));
          if (Math.max(a[0], b[0]) < vis[0] || Math.min(a[0], b[0]) > vis[2] || Math.max(a[1], b[1]) < vis[1] - 80 || Math.min(a[1], b[1]) > vis[3] + 80) continue;
          [[-12, -76], [12, -76], [0, -86]].forEach((o) => {
            const ax = a[0] + o[0], ay = a[1] + o[1] + 16, bx = b[0] + o[0], by = b[1] + o[1] + 16;
            c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 14, bx, by); c.stroke();
          });
        }
      });
    }
    // partículas (fumaça e vapor; fogo e brilhos vêm depois da iluminação)
    M.desenharParticulas(c, vis, 'sombra');
    // efeitos (anéis de construção etc.)
    M.efeitos.forEach((ef) => {
      const k = ef.t / ef.dur;
      c.strokeStyle = `rgba(255,230,120,${1 - k})`; c.lineWidth = 3;
      c.beginPath(); c.ellipse(ef.wx, ef.wy, 20 + k * 70, (20 + k * 70) / 2, 0, 0, 7); c.stroke();
    });
    // pássaros
    c.strokeStyle = '#2a2a3a'; c.lineWidth = 1.4;
    M.passaros.forEach((p) => {
      for (let k = 0; k < p.n; k++) {
        const bx = p.x - Math.sign(p.vx) * k * 14, by = p.y + Math.abs(k - p.n / 2) * 7;
        const f = Math.sin(M.t * 9 + k) * 3;
        c.beginPath(); c.moveTo(bx - 6, by - f); c.quadraticCurveTo(bx - 2, by - 3, bx, by); c.quadraticCurveTo(bx + 2, by - 3, bx + 6, by - f); c.stroke();
      }
    });
    // nuvens
    if (cfg.nuvens) M.nuvens.forEach((n) => { const sp = nuvemSprite(n.v); c.globalAlpha = 0.82; c.drawImage(sp, n.x - 130 * n.s, n.y - 60 * n.s - 160, 260 * n.s, 120 * n.s); c.globalAlpha = 1; });
    // moldura de nuvens nos cantos (como a referência)
    M.desenharMoldura(c);
    // período do dia: entardecer e noite
    M.iluminar(c, vis, lista);
    // trajeto e ponto de destino do jogador (sempre visíveis, de dia e à noite)
    M.desenharRota(c);
    // marcadores flutuantes (pins, balões) sempre visíveis
    M.desenharMarcadores(c, vis);
  };

  // ---------- trajeto suave até o destino ----------
  M.desenharRota = function (c) {
    const m = M.mapa, j = M.jogador;
    const md = M.marcaDestino;
    if (!md && !j.caminho.length) return;
    // pontos: posição atual do jogador + centros dos tiles restantes
    const pts = [M.posJogador()];
    j.caminho.forEach((p) => pts.push(M.centro(p[0], p[1], m.H(p[0], p[1]))));
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (pts.length > 1) {
      const tracar = () => {
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
          c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        const u = pts[pts.length - 1]; c.lineTo(u[0], u[1]);
      };
      const z = Math.max(0.7, M.cam.z);
      tracar(); c.strokeStyle = 'rgba(120,235,215,.24)'; c.lineWidth = 15 / z; c.stroke();
      tracar(); c.strokeStyle = 'rgba(150,240,222,.66)'; c.lineWidth = 6.5 / z; c.stroke();
      tracar(); c.setLineDash([2 / z, 9 / z]); c.lineDashOffset = -M.t * 22 / z;
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.2 / z; c.stroke(); c.setLineDash([]);
    }
    if (md) {
      const p = M.centro(md.x, md.y, m.H(md.x, md.y));
      const z = Math.max(0.7, M.cam.z);
      c.fillStyle = 'rgba(150,240,222,.32)';
      c.beginPath(); c.ellipse(p[0], p[1], 14, 7, 0, 0, 7); c.fill();
      for (let k = 0; k < 2; k++) {
        const f = (M.t * 0.9 + k * 0.5) % 1;
        c.strokeStyle = `rgba(190,250,236,${0.85 * (1 - f)})`; c.lineWidth = 2 / z;
        c.beginPath(); c.ellipse(p[0], p[1], 8 + f * 16, (8 + f * 16) / 2, 0, 0, 7); c.stroke();
      }
      // marcador flutuante do destino
      const y = p[1] - 22 + Math.sin(M.t * 4) * 2.5;
      c.fillStyle = 'rgba(120,235,215,.95)';
      c.beginPath(); c.moveTo(p[0], p[1] - 6); c.lineTo(p[0] - 5, y + 4); c.lineTo(p[0] + 5, y + 4); c.closePath(); c.fill();
      c.beginPath(); c.arc(p[0], y, 7, 0, 7); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p[0], y, 2.4, 0, 7); c.fill();
    }
    c.restore();
  };

  // ---------- dia, entardecer e noite ----------
  const glow = {};
  function brilhoSprite(cor) {
    if (glow[cor]) return glow[cor];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    const k = U.hex(cor);
    rg.addColorStop(0, U.rgb(k, 1)); rg.addColorStop(0.25, U.rgb(k, 0.55)); rg.addColorStop(1, U.rgb(k, 0));
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    glow[cor] = cv; return cv;
  }
  M.periodo = 'dia';
  // fase contínua: n = noite (0..1), t = entardecer (0..1)
  M.fase = function () {
    const p = M.periodo;
    if (p === 'dia') return { n: 0, t: 0 };
    if (p === 'tarde') return { n: 0.12, t: 1 };
    if (p === 'noite') return { n: 1, t: 0 };
    // ciclo automático de 6 minutos: dia → entardecer → noite → amanhecer
    const f = (M.t / 360) % 1;
    const liso = (a, b, x) => U.smooth(U.clamp((x - a) / (b - a), 0, 1));
    const t = liso(0.36, 0.46, f) * (1 - liso(0.5, 0.58, f)) + liso(0.88, 0.93, f) * (1 - liso(0.95, 1, f));
    const n = liso(0.5, 0.6, f) * (1 - liso(0.86, 0.95, f));
    return { n, t };
  };
  M.iluminar = function (c, vis, lista) {
    const F = M.fase();
    M._fase = F;
    if (F.n < 0.01 && F.t < 0.01) { M.desenharParticulas(c, vis, 'luz'); return; }
    const dpr = M.dpr, z = M.cam.z;
    // 1) gradação de cor (multiplicação)
    const base = [255, 255, 255];
    const tarde = [255, 178, 140], noite = [58, 76, 150];
    let cor = U.mix(base, tarde, F.t);
    cor = U.mix(cor, noite, F.n);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = U.rgb(cor); c.fillRect(0, 0, M.cv.width, M.cv.height);
    // céu do entardecer refletido: brilho rosado no alto da tela
    if (F.t > 0.01) {
      c.globalCompositeOperation = 'screen';
      const g = c.createLinearGradient(0, 0, 0, M.cv.height);
      g.addColorStop(0, `rgba(255,120,90,${0.28 * F.t})`); g.addColorStop(0.55, `rgba(180,90,160,${0.12 * F.t})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, M.cv.width, M.cv.height);
    }
    if (F.n > 0.01) {
      c.globalCompositeOperation = 'source-over';
      const g = c.createRadialGradient(M.cv.width / 2, M.cv.height / 2, M.cv.height * 0.3, M.cv.width / 2, M.cv.height / 2, M.cv.height * 0.95);
      g.addColorStop(0, 'rgba(5,10,40,0)'); g.addColorStop(1, `rgba(5,10,40,${0.35 * F.n})`);
      c.fillStyle = g; c.fillRect(0, 0, M.cv.width, M.cv.height);
    }
    c.restore();
    const L = U.clamp(F.n + F.t * 0.45, 0, 1); // intensidade das luzes artificiais
    if (L > 0.03) {
      const m = M.mapa;
      // 2) janelas acesas e faixas luminosas
      const res = M.resSprite();
      lista.forEach((e) => {
        if (!e.kind || e.oculto) return;
        let nome = e.spr, v = e.v || 0;
        if (e.kind === 'lote') { const b = e.construido || e.base; if (!b) return; nome = b.spr; v = b.v || 0; }
        const sp = SPR.get(nome, v, res);
        if (!sp || !sp.luzes || !sp.luzes.length) return;
        const semente = (e.x * 73 + e.y * 151) | 0;
        sp.luzes.forEach((lz, k) => {
          const acesa = lz.cor || ((Math.sin(semente * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1 < 0.62;
          if (!acesa) return;
          c.globalAlpha = L * (lz.cor ? 1 : 0.92);
          c.fillStyle = lz.cor || (k % 5 === 0 ? '#fff1c2' : '#ffd36e');
          c.beginPath();
          lz.q.forEach((p, i) => (i ? c.lineTo(e.wx + p[0], e.wy + p[1]) : c.moveTo(e.wx + p[0], e.wy + p[1])));
          c.closePath(); c.fill();
        });
        c.globalAlpha = 1;
        // halo suave do prédio
        c.globalCompositeOperation = 'lighter';
        const cx = (e.bb[0] + e.bb[2]) / 2, cy = e.wy - 6, rr = Math.max(26, (e.bb[2] - e.bb[0]) * 0.65);
        c.globalAlpha = 0.16 * L;
        c.drawImage(brilhoSprite(sp.luzes[0].cor || '#ffb85a'), cx - rr, cy - rr * 0.7, rr * 2, rr * 1.4);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      });
      c.globalCompositeOperation = 'lighter';
      // 3) postes de iluminação nas ruas
      (M.postes || []).forEach((p) => {
        if (p[0] < vis[0] - 40 || p[0] > vis[2] + 40 || p[1] < vis[1] - 40 || p[1] > vis[3] + 40) return;
        c.globalAlpha = 0.5 * L; c.drawImage(brilhoSprite('#ffc878'), p[0] - 26, p[1] - 13, 52, 26);
        c.globalAlpha = 0.9 * L; c.drawImage(brilhoSprite('#fff0c8'), p[0] - 5, p[1] - 19, 10, 10);
      });
      // 4) faróis dos veículos
      M.veiculos.forEach((v) => {
        const fx = U.lerp(v.x, v.nx, v.t) + 0.5, fy = U.lerp(v.y, v.ny, v.t) + 0.5;
        const w = M.pontoMundo(fx, fy, m.H(v.x, v.y));
        if (w[0] < vis[0] - 30 || w[0] > vis[2] + 30 || w[1] < vis[1] - 30 || w[1] > vis[3] + 30) return;
        const d = M.pontoMundo(v.nx - v.x, v.ny - v.y, 0);
        c.globalAlpha = 0.55 * L; c.drawImage(brilhoSprite('#fff4c0'), w[0] + d[0] * 0.45 - 12, w[1] + d[1] * 0.45 - 8, 24, 16);
      });
      // 5) fogo, lava e farol
      (m.fogo || []).forEach((f) => {
        if (f.apagado) return;
        const p = f.w || (f.w = M.centro(f[0], f[1], m.H(f[0], f[1])));
        if (p[0] < vis[0] - 60 || p[0] > vis[2] + 60 || p[1] < vis[1] - 60 || p[1] > vis[3] + 60) return;
        c.globalAlpha = (0.45 + Math.sin(M.t * 9 + p[0]) * 0.1) * Math.max(L, 0.3); c.drawImage(brilhoSprite('#ff7a2a'), p[0] - 40, p[1] - 30, 80, 50);
      });
      (M.lavas || []).forEach((p) => {
        if (p[0] < vis[0] - 60 || p[0] > vis[2] + 60 || p[1] < vis[1] - 60 || p[1] > vis[3] + 60) return;
        c.globalAlpha = 0.5 * L; c.drawImage(brilhoSprite('#ff5a1a'), p[0] - 44, p[1] - 26, 88, 52);
      });
      lista.forEach((e) => {
        if (e.spr !== 'farol' || e.oculto) return;
        const b = SPR.P(0.5, 0.5, 76);
        const ox = e.wx + b[0], oy = e.wy + b[1];
        const a = M.t * 1.2;
        c.globalAlpha = 0.35 * L;
        const g = c.createRadialGradient(ox, oy, 2, ox, oy, 220);
        g.addColorStop(0, 'rgba(255,245,200,.9)'); g.addColorStop(1, 'rgba(255,245,200,0)');
        c.fillStyle = g;
        c.beginPath(); c.moveTo(ox, oy);
        c.lineTo(ox + Math.cos(a - 0.12) * 220, oy + Math.sin(a - 0.12) * 110); c.lineTo(ox + Math.cos(a + 0.12) * 220, oy + Math.sin(a + 0.12) * 110); c.closePath(); c.fill();
        c.globalAlpha = L; c.drawImage(brilhoSprite('#fff6d0'), ox - 10, oy - 10, 20, 20);
      });
      // 6) lanterna do jogador para enxergar o caminho
      const pj = M.posJogador();
      c.globalAlpha = 0.26 * F.n; c.drawImage(brilhoSprite('#ffe8c0'), pj[0] - 90, pj[1] - 50, 180, 100);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    M.desenharParticulas(c, vis, 'luz');
  };

  const nuvens = {};
  function nuvemSprite(v, sombra) {
    const k = v + (sombra ? 's' : '');
    if (nuvens[k]) return nuvens[k];
    const cv = document.createElement('canvas'); cv.width = 260; cv.height = 120;
    const c = cv.getContext('2d'); const r = U.rng(v * 99 + 3);
    for (let i = 0; i < 14; i++) {
      const x = 40 + r() * 180, y = 50 + r() * 40 - Math.abs(x - 130) * 0.15, rr = 18 + r() * 26;
      const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.4, rr * 0.1, x, y, rr);
      if (sombra) { g.addColorStop(0, 'rgba(10,30,40,1)'); g.addColorStop(1, 'rgba(10,30,40,0)'); }
      else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(240,246,255,.95)'); g.addColorStop(1, 'rgba(220,232,250,0)'); }
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill();
    }
    nuvens[k] = cv;
    return cv;
  }

  M.desenharMoldura = function (c) {
    const r = M.mapa.ret;
    const cantos = [[r.x0 + 40, r.y0 + 10, 2.2], [r.x1 - 60, r.y0 + 20, 2], [r.x0 + 30, r.y1 - 30, 2.4], [r.x1 - 40, r.y1 - 20, 2.6], [(r.x0 + r.x1) / 2 + 500, r.y1 + 40, 1.8]];
    cantos.forEach((p, i) => { const sp = nuvemSprite(i % 3); c.drawImage(sp, p[0] - 130 * p[2], p[1] - 60 * p[2], 260 * p[2], 120 * p[2]); });
  };

  function desenharVeiculo(c, e) {
    const v = e._veic;
    const ex = v.nx - v.x, ey = v.ny - v.y;
    const eixoX = ex !== 0;
    const L = v.tipo === 'onibus' ? 0.42 : v.tipo === 'caminhao' ? 0.36 : 0.26, W = 0.13;
    const lado = eixoX ? (ex > 0 ? 0.1 : -0.1) : (ey > 0 ? -0.1 : 0.1);
    c.save(); c.translate(e.wx, e.wy - 2);
    const P = SPR.P;
    const pts = (x0, y0, x1, y1, z) => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
    let x0, y0, x1, y1;
    if (eixoX) { x0 = -L; x1 = L; y0 = -W + lado; y1 = W + lado; } else { y0 = -L; y1 = L; x0 = -W + lado; x1 = W + lado; }
    const h = v.tipo === 'onibus' ? 9 : v.tipo === 'caminhao' ? 8 : 5;
    const cor = v.tipo === 'onibus' ? '#2fa05a' : v.cor;
    const face = (p, f) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); c.fillStyle = f; c.fill(); };
    c.fillStyle = 'rgba(0,0,0,.25)'; face(pts(x0, y0, x1, y1, -1), 'rgba(0,0,0,.25)');
    face([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)], U.shade(cor, -0.08));
    face([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, h), P(x1, y0, h)], U.shade(cor, -0.3));
    face(pts(x0, y0, x1, y1, h), U.shade(cor, 0.15));
    if (v.tipo === 'carro') { const k = 0.5; face(pts(x0 * k, y0 * 0.85, x1 * k, y1 * 0.85, h + 3), 'rgba(140,200,240,.95)'); }
    c.restore();
  }

  M.desenharChao = function (c, vis) {
    const m = M.mapa;
    // lotes vazios
    m.ents.forEach((e) => {
      if (e.kind !== 'lote' || e.construido || e.oculto) return;
      if (e.bb[2] < vis[0] || e.bb[0] > vis[2] || e.bb[3] < vis[1] || e.bb[1] > vis[3]) return;
      const w = e.fp[0], d = e.fp[1];
      const a = M.canto(e.x, e.y, e.hBase), b = M.canto(e.x + w, e.y, e.hBase), cc = M.canto(e.x + w, e.y + d, e.hBase), dd = M.canto(e.x, e.y + d, e.hBase);
      const pulso = 0.5 + 0.5 * Math.sin(M.t * 3 + e.x);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(dd[0], dd[1]); c.closePath();
      c.fillStyle = M.hover === e ? 'rgba(255,230,90,.45)' : `rgba(255,230,90,${0.14 + pulso * 0.14})`;
      c.fill();
      c.setLineDash([6, 4]); c.lineDashOffset = -M.t * 12;
      c.strokeStyle = '#ffe14a'; c.lineWidth = 2.2; c.stroke(); c.setLineDash([]);
    });
  };

  M.desenharEnt = function (c, e, res) {
    if (e.kind === 'npc') { M.desenharNPC(c, e); return; }
    if (e.kind === 'pin') return; // desenhado como marcador
    if (e.kind === 'lote' && !e.construido && !e.base) return;
    const sprNome = e.kind === 'lote' ? (e.construido ? e.construido.spr : e.base.spr) : e.spr;
    const v = e.kind === 'lote' ? ((e.construido || e.base).v || 0) : e.v;
    const sp = SPR.get(sprNome, v, res);
    if (!sp) return;
    let esc = 1;
    if (e.surgindo !== undefined) {
      e.surgindo += 1 / 60;
      const k = Math.min(1, e.surgindo / 0.9);
      esc = 0.4 + 0.6 * U.easeOut(k);
      if (k >= 1) delete e.surgindo;
    }
    const hl = M.hover === e && e.kind !== 'deco';
    if (esc !== 1) {
      c.save(); c.translate(e.wx, e.wy); c.scale(esc, esc); c.drawImage(sp.img, sp.l, sp.t, sp.w, sp.h); c.restore();
    } else {
      if (hl) { c.save(); c.shadowColor = 'rgba(255,230,90,.95)'; c.shadowBlur = 14; }
      c.drawImage(sp.img, e.wx + sp.l, e.wy + sp.t, sp.w, sp.h);
      if (hl) c.restore();
    }
    const d = SPR.defs[sprNome];
    if (d && d.rotor) {
      const r = d.rotor; const p = SPR.P(r[0], r[1], r[2]);
      const cx = e.wx + p[0] + 2, cy = e.wy + p[1];
      const ang = M.t * (e.rotorVel || 2.2) + e.x;
      c.save(); c.translate(cx, cy);
      for (let k = 0; k < 3; k++) {
        const a = ang + k * 2.094;
        c.save(); c.rotate(a); c.scale(0.75, 1);
        c.beginPath(); c.moveTo(0, -1.8); c.quadraticCurveTo(r[3] * 0.5, -3.6, r[3], -0.4); c.lineTo(r[3], 0.6); c.quadraticCurveTo(r[3] * 0.5, 2, 0, 1.8); c.closePath();
        c.fillStyle = '#fbfcfd'; c.fill(); c.strokeStyle = 'rgba(40,50,70,.55)'; c.lineWidth = 0.7; c.stroke();
        c.restore();
      }
      c.fillStyle = '#e2e6ea'; c.beginPath(); c.arc(0, 0, 2.6, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,50,70,.5)'; c.stroke();
      c.restore();
    }
    if (d && d.rotorAgua) {
      const r = d.rotorAgua; const p = SPR.P(r[0], r[1], r[2]);
      const cx = e.wx + p[0], cy = e.wy + p[1];
      c.save(); c.translate(cx, cy); c.scale(1, 0.5);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
      const a = M.t * 2.5;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a + k * 2.09) * r[3], Math.sin(a + k * 2.09) * r[3]); c.stroke(); }
      c.beginPath(); c.arc(0, 0, r[3] + 4 + Math.sin(M.t * 3) * 2, 0, 7); c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
      c.restore();
    }
    // fumaça estática no nível mínimo (mantém o problema visível)
    if (Q.cfg.particulas === 0 && e._emis.length && !e.semFumaca) {
      e._emis.forEach((em) => {
        const cor = em.tipo === 'vapor' ? 'rgba(250,250,255,.6)' : em.tipo === 'fogo' ? 'rgba(255,140,40,.8)' : 'rgba(70,66,64,.5)';
        c.fillStyle = cor;
        [[0, -6, 6], [5, -15, 8], [12, -26, 10]].forEach((b) => { c.beginPath(); c.arc(em.wx + b[0], em.wy + b[1], b[2], 0, 7); c.fill(); });
      });
    }
  };

  M.desenharNPC = function (c, e) {
    const j = M.jogador;
    const perto = Math.hypot(j.x - e.x, j.y - e.y) < 4;
    const dir = perto ? ((j.x - j.y) - (e.x - e.y) >= 0 ? 1 : -1) : (e.dir || 1);
    const hl = M.hover === e;
    let look = e.look;
    if (e.marcador === 'feito') {
      // morador já atendido: roupa verde padrão e aro verde no chão
      look = e._lookFeito || (e._lookFeito = Object.assign({}, e.look, { camisa: '#2fbf6a', calca: '#1f6f45', colete: '#d8ffe6' }));
      c.fillStyle = 'rgba(47,191,106,.35)';
      c.beginPath(); c.ellipse(e.wx, e.wy, 15, 7.5, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,240,160,.95)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(e.wx, e.wy, 15, 7.5, 0, 0, 7); c.stroke();
    }
    if (hl) { c.save(); c.shadowColor = 'rgba(255,230,90,.95)'; c.shadowBlur = 12; }
    SPR.pessoa(c, e.wx, e.wy, look, M.t + e.x, false, dir, 1.15);
    if (hl) c.restore();
  };

  M.desenharJogador = function (c) {
    const j = M.jogador;
    const p = M.posJogador();
    // anel de destaque
    c.strokeStyle = 'rgba(255,225,74,.85)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(p[0], p[1], 11, 5.5, 0, 0, 7); c.stroke();
    SPR.pessoa(c, p[0], p[1], j.look, M.t, j.andando, j.dir, 1.2);
  };

  const LUMINOSAS = { fogo: 1, brilho: 1 };
  M.desenharParticulas = function (c, vis, modo) {
    const arr = M.particulas;
    if (modo === 'luz' && M._fase && M._fase.n > 0.2) c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (modo === 'luz' && !LUMINOSAS[p.tipo]) continue;
      if (modo === 'sombra' && LUMINOSAS[p.tipo]) continue;
      if (p.x < vis[0] - 30 || p.x > vis[2] + 30 || p.y < vis[1] - 30 || p.y > vis[3] + 30) continue;
      const d = PART[p.tipo];
      const k = p.t / p.vida;
      const r = U.lerp(d.r0, d.r1, k);
      let a = d.a * (1 - k);
      if (p.tipo === 'escura' || p.tipo === 'vapor' || p.tipo === 'poeira') a *= Math.min(1, p.t * 3);
      if (p.tipo === 'fogo') {
        const cor = k < 0.3 ? '255,240,120' : k < 0.6 ? '255,150,40' : '220,60,20';
        c.fillStyle = `rgba(${cor},${a})`;
      } else c.fillStyle = `rgba(${d.cor[0]},${d.cor[1]},${d.cor[2]},${a})`;
      c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  };

  M.desenharMarcadores = function (c, vis) {
    const m = M.mapa;
    m.ents.forEach((e) => {
      if (e.oculto) return;
      if (e.bb[2] < vis[0] - 40 || e.bb[0] > vis[2] + 40 || e.bb[3] < vis[1] - 80 || e.bb[1] > vis[3] + 80) return;
      const bob = Math.sin(M.t * 3 + e.x * 0.7) * 3;
      if (e.kind === 'pin') {
        const x = e.wx, y = e.wy - 34 + bob;
        const cor = e.cor || '#2e9e4a';
        const hl = M.hover === e;
        // haste de luz
        const g = c.createLinearGradient(0, y, 0, e.wy);
        g.addColorStop(0, U.rgb(U.hex(cor), 0.0)); g.addColorStop(1, U.rgb(U.hex(cor), 0.45));
        c.fillStyle = g; c.fillRect(x - 3, y, 6, e.wy - y);
        c.fillStyle = U.rgb(U.hex(cor), 0.35); c.beginPath(); c.ellipse(x, e.wy, 16 + Math.sin(M.t * 3) * 3, 8, 0, 0, 7); c.fill();
        const s = hl ? 1.2 : 1;
        c.save(); c.translate(x, y); c.scale(s, s);
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-6, -8, -16, -14, -16, -26); c.arc(0, -26, 16, Math.PI, 0); c.bezierCurveTo(16, -14, 6, -8, 0, 0); c.closePath();
        c.fillStyle = cor; c.fill(); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.4; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(-5, -31, 6, 0, 7); c.fill();
        ERS.drawIcon(c, e.icone || 'raio', 0, -26, 17, '#fff', 2.4);
        if (e.concluida) { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(12, -40, 7, 0, 7); c.fill(); ERS.drawIcon(c, 'estrela', 12, -40, 10, '#7a4a00', 2.4); }
        if (e.bloqueada) { c.fillStyle = 'rgba(30,30,40,.6)'; c.beginPath(); c.arc(0, -26, 16, 0, 7); c.fill(); }
        c.restore();
        // rótulo
        if (hl || M.cam.z >= 0.9) {
          c.font = '700 11px "Atkinson Hyperlegible", system-ui, sans-serif';
          const tw = c.measureText(e.rotulo).width;
          c.fillStyle = 'rgba(12,32,40,.82)';
          const bx = x - tw / 2 - 7, by = y + 6;
          if (c.roundRect) { c.beginPath(); c.roundRect(bx, by, tw + 14, 18, 9); c.fill(); } else c.fillRect(bx, by, tw + 14, 18);
          c.fillStyle = '#fff8e7'; c.fillText(e.rotulo, x - tw / 2, by + 13);
        }
        return;
      }
      let icone = null, cor = null;
      if (e.kind === 'npc') {
        if (e.marcador === 'desafio') { icone = 'falar'; cor = '#f0a21f'; }
        else if (e.marcador === 'narrador') { icone = 'alvo'; cor = '#6a4fd0'; }
        else if (e.marcador === 'feito') { icone = 'ok'; cor = '#2fbf6a'; }
      } else if (e.kind === 'lote' && !e.construido) { icone = 'martelo'; cor = '#e0a400'; }
      else if (e.kind === 'problema' && !e.resolvido) { icone = 'alerta'; cor = '#e0482a'; }
      else if (e.kind === 'info' && !e.lido) { icone = 'info'; cor = '#2a7fd0'; }
      if (!icone) return;
      let x = e.wx, y;
      if (e.kind === 'npc') y = e.wy - 52;
      else if (e.kind === 'lote') { const cc = M.canto(e.x + e.fp[0] / 2, e.y + e.fp[1] / 2, e.hBase); x = cc[0]; y = cc[1] - 30; }
      else if (e.kind === 'problema') { y = e.bb[1] + 10; if (e.fp) x = M.canto(e.x + e.fp[0] / 2, e.y + e.fp[1] / 2, e.hBase)[0]; }
      else y = e.bb[1] - 6;
      y += bob;
      c.save();
      c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
      c.fillStyle = cor; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill();
      c.beginPath(); c.moveTo(x - 5, y + 8); c.lineTo(x, y + 15); c.lineTo(x + 5, y + 8); c.fill();
      c.restore();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 11, 0, 7); c.stroke();
      ERS.drawIcon(c, icone, x, y, 13, '#fff', 2.6);
    });
  };

  // ---------- minimapa ----------
  M.prepararMinimapa = function () {
    const m = M.mapa;
    const r = m.ret;
    const W = 200, H = Math.round(200 * (r.y1 - r.y0) / (r.x1 - r.x0));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#1d6db5'; c.fillRect(0, 0, W, H);
    const kx = W / (r.x1 - r.x0), ky = H / (r.y1 - r.y0);
    for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
      const w = M.centro(x, y, 0);
      const px = (w[0] - r.x0) * kx, py = (w[1] - r.y0) * ky;
      if (px < -2 || py < -2 || px > W + 2 || py > H + 2) continue;
      const t = m.T(x, y);
      c.fillStyle = U.shade(T.props[t].cor, Math.min(0.25, m.H(x, y) * 0.03));
      c.fillRect(px - 32 * kx, py - 16 * ky, 64 * kx + 0.6, 32 * ky + 0.6);
    }
    M.minimapa = { cv, W, H, kx, ky };
  };
  M.desenharMinimapa = function (destino) {
    if (!M.minimapa || !M.mapa) return;
    const mm = M.minimapa, r = M.mapa.ret;
    const c = destino.getContext('2d');
    if (destino.width !== mm.W) { destino.width = mm.W; destino.height = mm.H; }
    c.drawImage(mm.cv, 0, 0);
    M.mapa.ents.forEach((e) => {
      let cor = null;
      if (e.kind === 'pin') cor = e.concluida ? '#ffd23f' : e.cor;
      else if (e.kind === 'npc' && e.marcador === 'desafio') cor = '#f0a21f';
      else if (e.kind === 'npc' && e.marcador === 'feito') cor = '#2fbf6a';
      else if (e.kind === 'npc' && e.marcador === 'narrador') cor = '#b59cff';
      else if (e.kind === 'lote' && !e.construido) cor = '#ffe14a';
      else if (e.kind === 'problema' && !e.resolvido) cor = '#ff4a2a';
      if (!cor) return;
      const px = (e.wx - r.x0) * mm.kx, py = (e.wy - r.y0) * mm.ky;
      c.fillStyle = cor; c.beginPath(); c.arc(px, py, e.kind === 'pin' ? 4 : 3, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
    });
    const p = M.posJogador();
    c.fillStyle = '#fff'; c.beginPath(); c.arc((p[0] - r.x0) * mm.kx, (p[1] - r.y0) * mm.ky, 4, 0, 7); c.fill(); c.strokeStyle = '#111'; c.stroke();
    const z = M.cam.z;
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2;
    c.strokeRect((M.cam.x - M.W / 2 / z - r.x0) * mm.kx, (M.cam.y - M.H / 2 / z - r.y0) * mm.ky, M.W / z * mm.kx, M.H / z * mm.ky);
  };
  M.minimapaParaTile = function (px, py) {
    const mm = M.minimapa, r = M.mapa.ret;
    const wx = px / mm.kx + r.x0, wy = py / mm.ky + r.y0;
    const fx = (wy / 16 + wx / 32) / 2, fy = (wy / 16 - wx / 32) / 2;
    return [Math.floor(fx - 0.5), Math.floor(fy - 0.5)];
  };

  // ---------- entrada ----------
  M.teclas = {};
  M.entrada = function () {
    const cv = M.cv;
    let arr = null, ptrs = new Map(), pinch = null;
    cv.addEventListener('pointerdown', (ev) => {
      ERS.A.iniciarAudio();
      cv.setPointerCapture(ev.pointerId);
      ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (ptrs.size === 2) { const v = [...ptrs.values()]; pinch = { d: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), z: M.cam.z }; arr = null; return; }
      arr = { x: ev.clientX, y: ev.clientY, cx: M.cam.x, cy: M.cam.y, moveu: false };
    });
    cv.addEventListener('pointermove', (ev) => {
      if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (pinch && ptrs.size === 2) {
        const v = [...ptrs.values()];
        const d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]);
        M.cam.z = U.clamp(pinch.z * d / pinch.d, Q.cfg.zoomMin, 2.2); M.limitarCamera(); return;
      }
      if (arr) {
        const dx = ev.clientX - arr.x, dy = ev.clientY - arr.y;
        if (Math.hypot(dx, dy) > 7) arr.moveu = true;
        if (arr.moveu) { M.cam.x = arr.cx - dx / M.cam.z; M.cam.y = arr.cy - dy / M.cam.z; M.cam.livre = 4; M.limitarCamera(); }
        return;
      }
      if (ev.pointerType === 'mouse') M.atualizarHover(ev.clientX, ev.clientY);
    });
    const fim = (ev) => {
      ptrs.delete(ev.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (arr && !arr.moveu && ev.type === 'pointerup') M.clique(ev.clientX, ev.clientY);
      arr = null;
    };
    cv.addEventListener('pointerup', fim);
    cv.addEventListener('pointercancel', fim);
    cv.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const f = ev.deltaY > 0 ? 0.88 : 1.13;
      M.zoomAlvo = U.clamp((M.zoomAlvo || M.cam.z) * f, Q.cfg.zoomMin, 2.2);
    }, { passive: false });
    window.addEventListener('keydown', (ev) => {
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      if (M.pausado || !M.mapa) return;
      if (/Arrow|Key[WASD]/.test(ev.code)) { M.teclas[ev.code] = true; ev.preventDefault(); }
      if (ev.code === 'KeyE' || ev.code === 'Space' || ev.code === 'Enter') { const e = M.maisProximo(); if (e) { ev.preventDefault(); ERS.bus.emit('interagir', e); } }
      if (ev.code === 'Equal' || ev.code === 'NumpadAdd') M.zoomAlvo = U.clamp(M.cam.z * 1.2, Q.cfg.zoomMin, 2.2);
      if (ev.code === 'Minus' || ev.code === 'NumpadSubtract') M.zoomAlvo = U.clamp(M.cam.z / 1.2, Q.cfg.zoomMin, 2.2);
    });
    window.addEventListener('keyup', (ev) => { M.teclas[ev.code] = false; });
    window.addEventListener('blur', () => { M.teclas = {}; });
  };

  M.interativas = function () {
    return M.mapa.ents.filter((e) => !e.oculto && e.kind && e.kind !== 'deco' && !(e.kind === 'npc' && e.inativo));
  };
  M.entidadeEm = function (sx, sy) {
    const w = M.telaParaMundo(sx, sy);
    let melhor = null;
    M.interativas().forEach((e) => {
      let hit = false;
      if (e.kind === 'npc') hit = Math.abs(w[0] - e.wx) < 14 && w[1] < e.wy + 6 && w[1] > e.wy - 72;
      else if (e.kind === 'pin') hit = Math.abs(w[0] - e.wx) < 22 && w[1] < e.wy + 10 && w[1] > e.wy - 80;
      else if (e.kind === 'lote' || e.fp) {
        const fp = e.fp || [1, 1];
        const f = [(w[1] / 16 + w[0] / 32) / 2, (w[1] / 16 - w[0] / 32) / 2];
        for (let hh = 0; hh <= 8; hh += 2) {
          const ff = [((w[1] + hh * 12 + e.hBase * HZ) / 16 + w[0] / 32) / 2, ((w[1] + hh * 12 + e.hBase * HZ) / 16 - w[0] / 32) / 2];
          if (ff[0] >= e.x && ff[0] <= e.x + fp[0] && ff[1] >= e.y && ff[1] <= e.y + fp[1]) { hit = true; break; }
        }
        if (!hit) hit = w[0] > e.bb[0] + 8 && w[0] < e.bb[2] - 8 && w[1] > e.bb[1] + 10 && w[1] < e.wy + (fp[0] + fp[1]) * 16 * 0.6;
      } else hit = w[0] > e.bb[0] && w[0] < e.bb[2] && w[1] > e.bb[1] && w[1] < e.bb[3];
      if (hit && (!melhor || e.prof > melhor.prof || e.kind === 'npc' || e.kind === 'pin')) melhor = e;
    });
    return melhor;
  };
  M.atualizarHover = function (sx, sy) {
    if (!M.mapa || M.pausado) { M.hover = null; return; }
    const e = M.entidadeEm(sx, sy);
    M.hover = e;
    M.cv.style.cursor = e ? 'pointer' : 'default';
    ERS.bus.emit('hover', e ? { e, x: sx, y: sy } : null);
  };
  M.clique = function (sx, sy) {
    if (!M.mapa || M.pausado) return;
    const e = M.entidadeEm(sx, sy);
    if (e) { ERS.A.sfx('clique'); M.irAte(e, () => ERS.bus.emit('interagir', e)); return; }
    const t = M.tileSob(sx, sy);
    if (!t) return;
    if (!M.irPara(t[0], t[1])) {
      // procura tile andável próximo
      for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (M.andavel(t[0] + dx, t[1] + dy) && M.irPara(t[0] + dx, t[1] + dy)) return;
      }
    }
  };
  M.maisProximo = function () {
    const j = M.jogador;
    let melhor = null, md = 2.6;
    M.interativas().forEach((e) => {
      const cx = e.fp ? U.clamp(j.x, e.x, e.x + e.fp[0]) : e.x;
      const cy = e.fp ? U.clamp(j.y, e.y, e.y + e.fp[1]) : e.y;
      let d = Math.hypot(j.x - cx, j.y - cy);
      if (e.hBase === 0 && (e.kind === 'lote' || e.kind === 'problema')) d -= 3;
      if (d < md) { md = d; melhor = e; }
    });
    return melhor;
  };

  M.focar = function (wx, wy, z) {
    M.cam.livre = 3; M.cam.x = wx; M.cam.y = wy; if (z) M.zoomAlvo = z; M.limitarCamera();
  };
  M.celebrar = function (e) {
    const c = e.fp ? M.canto(e.x + e.fp[0] / 2, e.y + e.fp[1] / 2, e.hBase) : [e.wx, e.wy];
    M.efeitos.push({ wx: c[0], wy: c[1], t: 0, dur: 1 });
    M.emitir(c[0], c[1] - 20, 'brilho', 40, 30);
    M.emitir(c[0], c[1] - 10, 'folha', 16, 30);
  };
})();
