/* =========================================================
   Tipos de terreno, texturas pintadas e ferramentas de mapa
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U;

  // id → propriedades
  const T = (ERS.T = {});
  const LISTA = [
    ['MAR_FUNDO', '#1d6db5', '#8fd3f5', 0, 1],
    ['MAR', '#2b8bd4', '#8fd3f5', 0, 1],
    ['AGUA_RASA', '#4cb8e8', '#a8e0f8', 0, 1],
    ['RIO', '#3a9be0', '#c4ecfc', 0, 1],
    ['AREIA', '#f2d99a', '#d6b46e', 1, 0],
    ['GRAMA', '#7cc65a', '#9b6b43', 1, 0],
    ['FLORESTA', '#4f9a3c', '#86593a', 1, 0],
    ['PASTO', '#b9d46a', '#9b6b43', 1, 0],
    ['LAVOURA', '#9ccc4f', '#9b6b43', 1, 0],
    ['CANA', '#a6c93a', '#9b6b43', 1, 0],
    ['TERRA', '#c98f5a', '#9a6438', 1, 0],
    ['MINA', '#c07a45', '#93552c', 1, 0],
    ['ROCHA', '#9a9284', '#6f685c', 1, 0],
    ['LAVA', '#ff6a1f', '#4a2a22', 0, 0],
    ['ESTRADA', '#5b616b', '#8d8a82', 1, 0],
    ['URBANO', '#d6d0c2', '#a9a49a', 1, 0],
    ['QUEIMADO', '#4a4038', '#5f4a3a', 1, 0],
    ['REJEITO', '#8a7b5c', null, 0, 1],
    ['OLEO', '#2b2420', null, 0, 1],
    ['MANGUE', '#6f8a4a', '#6a5236', 1, 0],
    ['PONTE', '#8a8a8a', '#777', 1, 1],
    ['PATIO', '#b3ada2', '#8d887e', 1, 0],
    ['AGROFLORESTA', '#6fb04a', '#86593a', 1, 0],
    ['LIXO', '#9b8a6a', '#7a6a4a', 1, 0],
    ['CAIS', '#b88a5a', '#7a5a3a', 1, 1],
    ['GRAMA_SECA', '#cdb86a', '#9b6b43', 1, 0],
    ['NEVE', '#f4f6f8', '#b8bcc4', 1, 0],
    ['CINZA_VULC', '#5a524c', '#3e3833', 1, 0],
  ];
  T.props = [];
  LISTA.forEach((l, i) => {
    T[l[0]] = i;
    T.props[i] = { nome: l[0], cor: l[1], lado: l[2], andavel: !!l[3], agua: !!l[4] };
  });
  T.props[T.LAVA].andavel = false;
  T.ehAgua = (t) => T.props[t] && T.props[t].agua && t !== T.PONTE && t !== T.CAIS;

  // ---------- texturas do topo (64x32, losango) ----------
  const tex = {};
  function losango(c) {
    c.beginPath(); c.moveTo(32, -1.2); c.lineTo(66, 16); c.lineTo(32, 33.2); c.lineTo(-2, 16); c.closePath();
  }
  T.textura = function (tipo, v, detalhe, res) {
    res = res || 1;
    const k = tipo + ':' + v + ':' + (detalhe > 0.5 ? 1 : 0) + ':' + res;
    if (tex[k]) return tex[k];
    const cv = document.createElement('canvas');
    cv.width = 64 * res; cv.height = 32 * res;
    const c = cv.getContext('2d');
    c.scale(res, res);
    const r = U.rng(tipo * 1000 + v * 37 + 11);
    const base = T.props[tipo].cor;
    losango(c); c.save(); c.clip();
    // base com leve gradiente (luz vinda do alto à esquerda)
    c.fillStyle = base; c.fillRect(0, 0, 64, 32);
    const pinc = (n, cores, rmin, rmax) => {
      for (let i = 0; i < n; i++) {
        c.fillStyle = cores[i % cores.length];
        c.beginPath(); c.ellipse(r() * 64, r() * 32, r.range(rmin, rmax), r.range(rmin, rmax) * 0.55, 0, 0, 7); c.fill();
      }
    };
    const fios = (n, cor, alt) => {
      c.strokeStyle = cor; c.lineWidth = 0.55;
      for (let i = 0; i < n * 1.6; i++) { const x = r() * 64, y = r() * 32; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + r.range(-1, 1), y - alt * 0.5, x + r.range(-1.8, 1.8), y - r.range(1, alt)); c.stroke(); }
    };
    const n = detalhe > 0.5 ? 1 : 0.4;
    switch (tipo) {
      case T.GRAMA:
        pinc(14 * n, [U.shade(base, 0.1), U.shade(base, -0.08), U.shade(base, 0.04)], 1.5, 5);
        fios(26 * n, U.shade(base, -0.2), 3.2); fios(16 * n, U.shade(base, 0.28), 2.6);
        for (let i = 0; i < 8 * n; i++) { c.fillStyle = 'rgba(255,255,220,.25)'; c.fillRect(r() * 64, r() * 32, 0.8, 0.8); }
        if (v === 2 || v === 3) { const fl = v === 2 ? ['#fff', '#ffe14a'] : ['#ff7aa8', '#c38bff']; for (let i = 0; i < 5; i++) { c.fillStyle = fl[i % 2]; c.beginPath(); c.arc(r() * 64, r() * 32, 1.2, 0, 7); c.fill(); } }
        break;
      case T.GRAMA_SECA:
        pinc(10 * n, [U.shade(base, 0.12), U.shade(base, -0.12)], 2, 6); fios(22 * n, '#a8903f', 3); break;
      case T.FLORESTA:
        pinc(18 * n, ['#3f8a30', '#5aa83f', '#356f2a', '#6a4a2a'], 1.5, 5); break;
      case T.AGROFLORESTA:
        pinc(12 * n, ['#5aa83f', '#8ac85a', '#6a4a2a'], 1.5, 4);
        c.strokeStyle = 'rgba(90,60,30,.35)'; c.lineWidth = 2;
        for (let i = -2; i < 6; i++) { c.beginPath(); c.moveTo(i * 12, 0); c.lineTo(i * 12 + 32, 32); c.stroke(); }
        break;
      case T.PASTO:
        pinc(10 * n, [U.shade(base, 0.12), U.shade(base, -0.08)], 2, 6); fios(18 * n, U.shade(base, -0.2), 3);
        break;
      case T.LAVOURA: {
        c.lineWidth = 3;
        for (let i = -4; i < 10; i++) {
          c.strokeStyle = i % 2 ? '#8fc23f' : '#7aa83a';
          c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8 + 32, 16 + 16); c.stroke();
        }
        c.fillStyle = 'rgba(255,255,200,.2)'; for (let i = 0; i < 10; i++) c.fillRect(r() * 64, r() * 32, 1.5, 1.5);
        break;
      }
      case T.CANA: {
        c.fillStyle = '#93b832'; c.fillRect(0, 0, 64, 32);
        c.strokeStyle = '#6f9a22'; c.lineWidth = 1;
        for (let i = -6; i < 12; i++) { c.beginPath(); c.moveTo(i * 6, 0); c.lineTo(i * 6 + 32, 32); c.stroke(); }
        fios(50 * n, '#c4e04a', 5); fios(30 * n, '#5f8a1a', 4);
        break;
      }
      case T.AREIA:
        pinc(14 * n, [U.shade(base, 0.1), U.shade(base, -0.08)], 1, 3);
        c.strokeStyle = 'rgba(200,160,90,.35)'; c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) { c.beginPath(); const y = 6 + i * 9 + r() * 3; c.moveTo(4, y); c.quadraticCurveTo(32, y - 4, 60, y); c.stroke(); }
        break;
      case T.TERRA: case T.MINA:
        pinc(14 * n, [U.shade(base, 0.12), U.shade(base, -0.15)], 1, 4);
        for (let i = 0; i < 6; i++) { c.fillStyle = '#8a7a6a'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.8, 1.8), 0, 7); c.fill(); }
        if (tipo === T.MINA) { c.strokeStyle = 'rgba(90,50,20,.4)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 8 + i * 8); c.lineTo(64, 8 + i * 8); c.stroke(); } }
        break;
      case T.ROCHA:
        pinc(12 * n, [U.shade(base, 0.15), U.shade(base, -0.15)], 2, 6);
        c.strokeStyle = 'rgba(60,55,50,.45)'; c.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) { c.beginPath(); let x = r() * 64, y = r() * 32; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-6, 6); y += r.range(-3, 3); c.lineTo(x, y); } c.stroke(); }
        if (v === 3) { pinc(4, ['#6aa83f'], 2, 4); }
        break;
      case T.NEVE: pinc(8, ['#ffffff', '#e2e8f0'], 2, 6); break;
      case T.CINZA_VULC: pinc(14, ['#6a625a', '#423b36'], 1, 4); break;
      case T.LAVA: {
        c.fillStyle = '#ff3d10'; c.fillRect(0, 0, 64, 32);
        pinc(10, ['#ffb52e', '#ffd84a', '#c22a08'], 2, 7);
        c.strokeStyle = '#5a1a08'; c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(r() * 64, r() * 32); c.lineTo(r() * 64, r() * 32); c.stroke(); }
        break;
      }
      case T.URBANO:
        c.strokeStyle = 'rgba(140,130,115,.35)'; c.lineWidth = 0.7;
        for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8 - 32, 16 + 16); c.stroke(); c.beginPath(); c.moveTo(i * 8 - 32, 0); c.lineTo(i * 8, 32); c.stroke(); }
        break;
      case T.PATIO:
        pinc(18 * n, [U.shade(base, 0.12), U.shade(base, -0.12)], 0.8, 2.4); break;
      case T.QUEIMADO:
        pinc(16, ['#3a322c', '#5a4f46', '#2a2420'], 1.5, 5);
        for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(255,110,30,.8)'; c.beginPath(); c.arc(r() * 64, r() * 32, 0.9, 0, 7); c.fill(); }
        break;
      case T.LIXO:
        pinc(10, ['#8a7a5a', '#a6956f'], 2, 5);
        { const cs = ['#e04a3a', '#3a8ae0', '#f0c419', '#fff', '#4fae3f']; for (let i = 0; i < 18; i++) { c.fillStyle = cs[i % 5]; c.fillRect(r() * 64, r() * 32, 2, 1.4); } }
        break;
      case T.MANGUE:
        pinc(14, ['#5f7a3a', '#7a9a4a', '#4a5a2a'], 2, 5);
        c.fillStyle = 'rgba(60,120,140,.35)'; c.beginPath(); c.ellipse(r() * 64, r() * 32, 10, 4, 0, 0, 7); c.fill();
        break;
      case T.CAIS:
        c.fillStyle = '#b88a5a'; c.fillRect(0, 0, 64, 32);
        c.strokeStyle = 'rgba(90,60,30,.6)'; c.lineWidth = 1;
        for (let i = -4; i < 12; i++) { c.beginPath(); c.moveTo(i * 6, 0); c.lineTo(i * 6 + 32, 32); c.stroke(); }
        break;
      case T.MAR: case T.MAR_FUNDO: case T.AGUA_RASA: case T.RIO: case T.REJEITO: case T.OLEO: {
        c.strokeStyle = tipo === T.OLEO ? 'rgba(160,120,255,.25)' : 'rgba(255,255,255,.22)';
        c.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const x = r() * 54, y = 4 + r() * 24; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 5, y - 2, x + 10, y); c.stroke(); }
        if (tipo === T.OLEO) { c.fillStyle = 'rgba(80,200,180,.15)'; c.beginPath(); c.ellipse(32, 16, 18, 6, 0, 0, 7); c.fill(); }
        break;
      }
    }
    c.restore();
    tex[k] = cv;
    return cv;
  };

  // ---------- gerador de mapas (coordenadas de imagem) ----------
  // Cada mapa é um losango N×N; a área jogável é o retângulo de tela que
  // corresponde à imagem (ix,iy ∈ [0,1]).
  ERS.novoMapa = function (N, seed) {
    const m = {
      N, seed,
      tipo: new Uint8Array(N * N).fill(T.MAR),
      alt: new Int8Array(N * N).fill(0),
      bloq: new Uint8Array(N * N),
      ents: [], fogo: [], marcos: [],
      ruido: U.noise2(seed),
      r: U.rng(seed),
    };
    m.i = (x, y) => y * N + x;
    m.dentro = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
    m.T = (x, y) => (m.dentro(x, y) ? m.tipo[y * N + x] : T.MAR_FUNDO);
    m.H = (x, y) => (m.dentro(x, y) ? m.alt[y * N + x] : 0);
    m.set = (x, y, t, h) => { if (!m.dentro(x, y)) return; m.tipo[y * N + x] = t; if (h !== undefined) m.alt[y * N + x] = h; };
    m.setH = (x, y, h) => { if (m.dentro(x, y)) m.alt[y * N + x] = h; };
    // imagem → tile
    m.tile = (ix, iy) => {
      const sx = ix - 0.5, sy = 0.25 + iy * 0.5;
      return [Math.floor(N * (sy + sx / 2)), Math.floor(N * (sy - sx / 2))];
    };
    m.img = (x, y) => {
      const sx = (x - y + 0) / N, sy = (x + y + 1) / (2 * N);
      return [sx + 0.5, (sy - 0.25) * 2];
    };
    m.cada = (fn) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const p = m.img(x, y); fn(x, y, p[0], p[1]); } };
    // retângulo de mundo (px) — área visível
    m.ret = { x0: -N * 16 - 40, x1: N * 16 + 40, y0: N * 8 - 40, y1: N * 24 + 40 };
    // pintar um polígono/elipse em coords de imagem
    m.elipse = (cx, cy, rx, ry, fn, irreg) => {
      m.cada((x, y, ix, iy) => {
        let d = ((ix - cx) / rx) ** 2 + ((iy - cy) / ry) ** 2;
        if (irreg) d += (m.ruido.fbm(x * 0.18, y * 0.18, 3) - 0.5) * irreg;
        if (d <= 1) fn(x, y, d, ix, iy);
      });
    };
    m.retangulo = (ix0, iy0, ix1, iy1, fn) => {
      m.cada((x, y, ix, iy) => { if (ix >= ix0 && ix <= ix1 && iy >= iy0 && iy <= iy1) fn(x, y, ix, iy); });
    };
    // traçar caminho (rio/estrada) por pontos em coords de imagem
    m.caminho = (pts, larg, fn) => {
      const tp = pts.map((p) => m.tile(p[0], p[1]));
      for (let k = 0; k < tp.length - 1; k++) {
        const a = tp[k], b = tp[k + 1];
        const passos = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 2 + 1;
        for (let s = 0; s <= passos; s++) {
          const t = s / passos;
          const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          const rr = larg / 2;
          for (let dy = -Math.ceil(rr); dy <= Math.ceil(rr); dy++) for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) {
            if (dx * dx + dy * dy <= rr * rr + 0.25) {
              const xx = Math.round(x + dx), yy = Math.round(y + dy);
              if (m.dentro(xx, yy)) fn(xx, yy);
            }
          }
        }
      }
      return tp;
    };
    // estrada em L entre dois tiles (manhattan), útil para malha urbana
    m.estradaTiles = (a, b, tipo) => {
      tipo = tipo === undefined ? T.ESTRADA : tipo;
      let x = a[0], y = a[1];
      const put = () => { const t = m.T(x, y); if (T.ehAgua(t)) m.set(x, y, T.PONTE, 1); else if (t !== T.PONTE) m.set(x, y, tipo, Math.max(1, m.H(x, y))); };
      put();
      while (x !== b[0]) { x += Math.sign(b[0] - x); put(); }
      while (y !== b[1]) { y += Math.sign(b[1] - y); put(); }
    };
    m.ent = (o) => { m.ents.push(o); return o; };
    // posiciona entidade por coords de imagem
    m.em = (ix, iy, o) => { const t = m.tile(ix, iy); o.x = t[0]; o.y = t[1]; return m.ent(o); };
    m.livre = (x, y, w, d) => {
      for (let j = 0; j < (d || 1); j++) for (let i = 0; i < (w || 1); i++) {
        const xx = x + i, yy = y + j;
        if (!m.dentro(xx, yy)) return false;
        if (m.bloq[m.i(xx, yy)]) return false;
        if (!T.props[m.T(xx, yy)].andavel || m.T(xx, yy) === T.PONTE) return false;
      }
      return true;
    };
    m.ocupar = (x, y, w, d) => { for (let j = 0; j < (d || 1); j++) for (let i = 0; i < (w || 1); i++) if (m.dentro(x + i, y + j)) m.bloq[m.i(x + i, y + j)] = 1; };
    // nivelar pegada (útil para prédios em terreno irregular)
    m.nivelar = (x, y, w, d, h) => { for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) m.setH(x + i, y + j, h); };
    return m;
  };
})();
