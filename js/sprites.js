/* =========================================================
   Sprites procedurais em estilo pintado à mão (2.5D isométrico)
   Cada sprite é desenhado uma vez num canvas e reaproveitado.
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U;
  const TW = 64, TH = 32, HZ = 9;
  const SPR = (ERS.SPR = { TW, TH, HZ, defs: {}, cache: {} });
  const CONTORNO = 'rgba(28,32,48,0.36)';

  // ---------- primitivas ----------
  const P = (x, y, z) => [(x - y) * (TW / 2), (x + y) * (TH / 2) - (z || 0)];
  SPR.P = P;

  function poly(c, pts, fill, stroke, lw) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke !== false) { c.strokeStyle = stroke || CONTORNO; c.lineWidth = lw || 0.7; c.stroke(); }
  }
  function cores(base) {
    return { topo: U.shade(base, 0.18), esq: U.shade(base, -0.04), dir: U.shade(base, -0.24) };
  }
  // caixa isométrica
  function caixa(c, x0, y0, x1, y1, z0, z1, base, op) {
    op = op || {};
    const k = typeof base === 'string' ? cores(base) : base;
    if (!op.semTopo) poly(c, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], k.topo, op.contorno);
    poly(c, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], k.esq, op.contorno);
    poly(c, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], k.dir, op.contorno);
    if (z0 <= 0 && !op.semAO) {
      c.strokeStyle = 'rgba(20,30,25,.28)'; c.lineWidth = 1.4;
      const a0 = P(x0, y1, 0.6), b0 = P(x1, y1, 0.6), d0 = P(x1, y0, 0.6);
      c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]); c.lineTo(d0[0], d0[1]); c.stroke();
    }
    if (op.brilho !== false) {
      // luz pintada na aresta superior
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
      c.beginPath(); const a = P(x0, y1, z1), b = P(x1, y1, z1), d = P(x1, y0, z1);
      c.moveTo(a[0], a[1] + 0.5); c.lineTo(b[0], b[1] + 0.5); c.lineTo(d[0], d[1] + 0.5); c.stroke();
    }
  }
  // janelas na face esquerda (y = y1) e direita (x = x1)
  function janelasE(c, x0, x1, y, z0, z1, linhas, cols, cor, mx, my) {
    mx = mx || 0.12; my = my || 4;
    const w = (x1 - x0) / cols, h = (z1 - z0) / linhas;
    for (let i = 0; i < cols; i++) for (let j = 0; j < linhas; j++) {
      const a = x0 + i * w + w * 0.22, b = x0 + (i + 1) * w - w * 0.22;
      const za = z0 + j * h + h * 0.25, zb = z0 + (j + 1) * h - h * 0.2;
      janela(c, [P(a, y, za), P(b, y, za), P(b, y, zb), P(a, y, zb)], typeof cor === 'function' ? cor(i, j) : cor);
    }
  }
  // registro das janelas/luzes de cada sprite (usado à noite)
  let REC = null;
  function emissivo(q, cor) { if (REC) REC.push({ q: q.map((p) => [p[0], p[1]]), cor: cor || null }); }
  SPR.emissivo = emissivo;
  // vidraça com moldura clara, reflexo e peitoril
  function janela(c, q, cor) {
    emissivo(q);
    poly(c, q, cor, 'rgba(250,250,245,.75)', 0.6);
    c.save(); c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) c.lineTo(q[i][0], q[i][1]); c.closePath(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.1;
    const w = q[1][0] - q[0][0];
    c.beginPath(); c.moveTo(q[3][0] + w * 0.15, q[3][1] + (q[1][1] - q[0][1]) * 0.15 + 1); c.lineTo(q[3][0] + w * 0.55, q[0][1] + (q[3][1] - q[0][1]) * 0.1 + (q[1][1] - q[0][1]) * 0.55); c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(q[0][0] - 0.5, q[0][1] + 0.8); c.lineTo(q[1][0] + 0.5, q[1][1] + 0.8); c.stroke();
  }
  function janelasD(c, y0, y1, x, z0, z1, linhas, cols, cor) {
    const w = (y1 - y0) / cols, h = (z1 - z0) / linhas;
    for (let i = 0; i < cols; i++) for (let j = 0; j < linhas; j++) {
      const a = y0 + i * w + w * 0.22, b = y0 + (i + 1) * w - w * 0.22;
      const za = z0 + j * h + h * 0.25, zb = z0 + (j + 1) * h - h * 0.2;
      janela(c, [P(x, a, za), P(x, b, za), P(x, b, zb), P(x, a, zb)], typeof cor === 'function' ? cor(i, j) : cor);
    }
  }
  // telhado de duas águas; ao longo de x (eixo=0) ou y (eixo=1)
  function telhado(c, x0, y0, x1, y1, z, hr, cor, eixo, corOitao) {
    const o = 0.06;
    x0 -= o; y0 -= o; x1 += o; y1 += o;
    const k = cores(cor);
    if (!eixo) {
      const ym = (y0 + y1) / 2;
      const R0 = P(x0, ym, z + hr), R1 = P(x1, ym, z + hr);
      poly(c, [P(x0, y0, z), P(x1, y0, z), R1, R0], k.dir);
      poly(c, [P(x0, y1, z), P(x1, y1, z), R1, R0], k.topo);
      poly(c, [P(x1, y0, z), P(x1, y1, z), R1], corOitao || U.shade(cor, -0.35));
      telhas(c, P(x0, y1, z), P(x1, y1, z), R1, R0, k.esq);
      c.strokeStyle = U.shade(cor, 0.4); c.lineWidth = 1.3; c.beginPath(); c.moveTo(R0[0], R0[1]); c.lineTo(R1[0], R1[1]); c.stroke();
      c.strokeStyle = 'rgba(30,20,15,.35)'; c.lineWidth = 0.9; const e0 = P(x0, y1, z), e1 = P(x1, y1, z); c.beginPath(); c.moveTo(e0[0], e0[1] + 0.8); c.lineTo(e1[0], e1[1] + 0.8); c.stroke();
    } else {
      const xm = (x0 + x1) / 2;
      const R0 = P(xm, y0, z + hr), R1 = P(xm, y1, z + hr);
      poly(c, [P(x0, y0, z), P(x0, y1, z), R1, R0], k.topo);
      poly(c, [P(x0, y1, z), P(x1, y1, z), R1], corOitao || U.shade(cor, -0.1));
      poly(c, [P(x1, y0, z), P(x1, y1, z), R1, R0], k.dir);
      telhas(c, P(x1, y0, z), P(x1, y1, z), R1, R0, U.shade(cor, -0.38));
      c.strokeStyle = U.shade(cor, 0.4); c.lineWidth = 1.3; c.beginPath(); c.moveTo(R0[0], R0[1]); c.lineTo(R1[0], R1[1]); c.stroke();
      c.strokeStyle = 'rgba(30,20,15,.35)'; c.lineWidth = 0.9; const e0 = P(x1, y0, z), e1 = P(x1, y1, z); c.beginPath(); c.moveTo(e0[0], e0[1] + 0.8); c.lineTo(e1[0], e1[1] + 0.8); c.stroke();
    }
  }
  function telhas(c, a, b, r1, r0, cor) {
    c.strokeStyle = cor; c.globalAlpha = 0.4; c.lineWidth = 0.55;
    for (let t = 0.16; t < 1; t += 0.165) {
      c.beginPath();
      c.moveTo(U.lerp(a[0], r0[0], t), U.lerp(a[1], r0[1], t));
      c.lineTo(U.lerp(b[0], r1[0], t), U.lerp(b[1], r1[1], t));
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  function cilindro(c, cx, cy, r, z0, z1, cor, op) {
    op = op || {};
    const C0 = P(cx, cy, z0), C1 = P(cx, cy, z1);
    const ry = r / 2;
    const g = c.createLinearGradient(C0[0] - r, 0, C0[0] + r, 0);
    g.addColorStop(0, U.shade(cor, 0.25)); g.addColorStop(0.45, U.shade(cor, 0.05)); g.addColorStop(1, U.shade(cor, -0.35));
    c.beginPath();
    c.moveTo(C1[0] - r, C1[1]);
    c.lineTo(C0[0] - r, C0[1]);
    c.ellipse(C0[0], C0[1], r, ry, 0, Math.PI, 0, true);
    c.lineTo(C1[0] + r, C1[1]);
    c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 1; c.stroke();
    if (op.faixas) {
      op.faixas.forEach((f) => {
        const za = U.lerp(z0, z1, f[0]), zb = U.lerp(z0, z1, f[1]);
        const A0 = P(cx, cy, za), B0 = P(cx, cy, zb);
        c.beginPath();
        c.moveTo(B0[0] - r, B0[1]); c.lineTo(A0[0] - r, A0[1]);
        c.ellipse(A0[0], A0[1], r, ry, 0, Math.PI, 0, true);
        c.lineTo(B0[0] + r, B0[1]);
        c.ellipse(B0[0], B0[1], r, ry, 0, 0, Math.PI, false);
        c.closePath(); c.fillStyle = f[2]; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
      });
    }
    if (op.semTopo) return;
    c.beginPath(); c.ellipse(C1[0], C1[1], r, ry, 0, 0, Math.PI * 2);
    c.fillStyle = op.topo || U.shade(cor, 0.3); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    if (op.oco) { c.beginPath(); c.ellipse(C1[0], C1[1], r * 0.72, ry * 0.72, 0, 0, Math.PI * 2); c.fillStyle = op.oco; c.fill(); }
  }
  function sombra(c, cx, cy, rx, ry, a) {
    const C = P(cx, cy, 0);
    const g = c.createRadialGradient(C[0], C[1], 1, C[0], C[1], rx);
    g.addColorStop(0, `rgba(20,40,30,${a || 0.35})`); g.addColorStop(1, 'rgba(20,40,30,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(C[0], C[1], rx, ry, 0, 0, Math.PI * 2); c.fill();
  }
  function bolha(c, x, y, r, cor, luz) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, U.shade(cor, luz || 0.28)); g.addColorStop(0.65, cor); g.addColorStop(1, U.shade(cor, -0.3));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  function painelSolar(c, x, y, w, d, z, inclin) {
    // painel inclinado voltado para "norte" do mapa (face esquerda)
    const a = P(x, y, z + inclin), b = P(x + w, y, z + inclin), cc = P(x + w, y + d, z), dd = P(x, y + d, z);
    poly(c, [a, b, cc, dd], '#1f3f95', '#0f1d44');
    c.strokeStyle = 'rgba(140,190,255,.55)'; c.lineWidth = 0.6;
    for (let i = 1; i < 4; i++) {
      const t = i / 4;
      c.beginPath(); c.moveTo(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t)); c.lineTo(U.lerp(dd[0], cc[0], t), U.lerp(dd[1], cc[1], t)); c.stroke();
    }
    c.beginPath(); c.moveTo(U.lerp(a[0], dd[0], 0.5), U.lerp(a[1], dd[1], 0.5)); c.lineTo(U.lerp(b[0], cc[0], 0.5), U.lerp(b[1], cc[1], 0.5)); c.stroke();
    // reflexo
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(U.lerp(a[0], b[0], 0.4), U.lerp(a[1], b[1], 0.4)); c.lineTo(U.lerp(dd[0], cc[0], 0.15), U.lerp(dd[1], cc[1], 0.15)); c.closePath(); c.fill();
  }
  function placaIcone(c, x, y, z, icone, cor) {
    const p = P(x, y, z);
    c.fillStyle = cor; c.beginPath(); c.arc(p[0], p[1], 6.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; c.stroke();
    ERS.drawIcon(c, icone, p[0], p[1], 8.5, '#fff', 2.6);
  }
  function chamine(c, x, y, r, z0, z1, listras) {
    cilindro(c, x, y, r, z0, z1, '#d8d8d8', { faixas: listras ? [[0.7, 0.78, '#d23b2f'], [0.86, 0.94, '#d23b2f']] : [[0.88, 0.96, '#7d7d7d']], oco: '#333' });
  }
  function torreResfriamento(c, x, y, r, z1, cor, manchada) {
    const C0 = P(x, y, 0), C1 = P(x, y, z1);
    const rt = r * 0.72, rm = r * 0.6;
    const g = c.createLinearGradient(C0[0] - r, 0, C0[0] + r, 0);
    g.addColorStop(0, U.shade(cor, 0.25)); g.addColorStop(0.5, cor); g.addColorStop(1, U.shade(cor, -0.35));
    c.beginPath();
    c.moveTo(C0[0] - r, C0[1]);
    c.quadraticCurveTo(C0[0] - rm * 0.95, C0[1] - z1 * 0.6, C1[0] - rt, C1[1]);
    c.lineTo(C1[0] + rt, C1[1]);
    c.quadraticCurveTo(C0[0] + rm * 0.95, C0[1] - z1 * 0.6, C0[0] + r, C0[1]);
    c.ellipse(C0[0], C0[1], r, r / 2, 0, 0, Math.PI, false);
    c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    if (manchada) { c.fillStyle = 'rgba(60,50,40,.25)'; c.fillRect(C1[0] - rt, C1[1], rt * 2, 6); }
    c.beginPath(); c.ellipse(C1[0], C1[1], rt, rt / 2, 0, 0, Math.PI * 2); c.fillStyle = '#5a5a5a'; c.fill(); c.strokeStyle = CONTORNO; c.stroke();
  }

  // ---------- registro ----------
  // b = [esq, topo, dir, base] em px relativos à âncora; fp = [w,d] pegada em tiles
  function def(nome, b, desenho, extra) {
    SPR.defs[nome] = Object.assign({ b, desenho }, extra || {});
  }
  SPR.get = function (nome, v, res) {
    res = res || 1;
    const chave = nome + ':' + (v || 0) + ':' + res;
    if (SPR.cache[chave]) return SPR.cache[chave];
    const d = SPR.defs[nome];
    if (!d) return null;
    const b = d.b;
    const w = b[2] - b[0], h = b[3] - b[1];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const c = cv.getContext('2d');
    c.scale(res, res); c.translate(-b[0], -b[1]);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const r = U.rng(9137 + (v || 0) * 7919 + nome.length * 131);
    const prev = REC; REC = [];
    d.desenho(c, r, v || 0);
    const luzes = REC; REC = prev;
    const s = { img: cv, l: b[0], t: b[1], w, h, luzes };
    SPR.cache[chave] = s;
    return s;
  };
  SPR.limpar = function () { SPR.cache = {}; };

  // =========================================================
  // VEGETAÇÃO (âncora = base do tronco)
  // =========================================================
  // copa delicada: massa sombreada + tufos menores + folhinhas + luz de borda
  function copa(c, r, cx, cy, rx, ry, cor, n) {
    if (typeof cor === 'string' && cor[0] === '#') cor = U.hex(cor);
    const tom = (f) => U.shade(cor, f);
    c.fillStyle = U.shade(cor, -0.32);
    c.beginPath(); c.ellipse(cx + rx * 0.08, cy + ry * 0.12, rx * 0.92, ry * 0.88, 0, 0, 7); c.fill();
    const tufos = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.62;
      tufos.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, (0.32 + r() * 0.22) * Math.min(rx, ry) * 1.25]);
    }
    tufos.sort((a, b) => a[1] - b[1]);
    tufos.forEach((t) => {
      const luz = (cy - t[1]) / ry * 0.18 + (cx - t[0]) / rx * 0.1;
      bolha(c, t[0], t[1], t[2], tom(U.clamp(luz, -0.15, 0.2)), 0.3);
    });
    // folhinhas
    c.lineWidth = 0.7;
    for (let i = 0; i < n * 3; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.85;
      const px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d;
      c.strokeStyle = py < cy ? 'rgba(235,255,190,.42)' : 'rgba(20,50,20,.3)';
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + r.range(-1.6, 1.6), py - r.range(0.6, 1.8)); c.stroke();
    }
    // brilho de borda superior-esquerda
    c.strokeStyle = 'rgba(255,255,220,.28)'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, rx * 0.86, ry * 0.82, 0, Math.PI * 1.05, Math.PI * 1.55); c.stroke();
  }
  function tronco(c, h, larg, cor) {
    const g = c.createLinearGradient(-larg, 0, larg, 0); g.addColorStop(0, U.shade(cor, 0.2)); g.addColorStop(1, U.shade(cor, -0.3));
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-larg, 0); c.quadraticCurveTo(-larg * 0.5, -h * 0.5, -larg * 0.45, -h); c.lineTo(larg * 0.45, -h); c.quadraticCurveTo(larg * 0.5, -h * 0.5, larg, 0); c.closePath(); c.fill();
    c.strokeStyle = U.shade(cor, -0.1); c.lineWidth = 1.1; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -h * 0.6); c.lineTo(-larg * 2.2, -h * 1.05); c.moveTo(0, -h * 0.75); c.lineTo(larg * 2, -h * 1.15); c.stroke();
  }
  const VERDES = ['#3f9a3a', '#4fae3f', '#2f8a46', '#6dbb3c', '#3a8f5c', '#58a83a'];
  def('arvore', [-22, -52, 22, 8], (c, r, v) => {
    const cor = VERDES[v % VERDES.length];
    sombra(c, 0, 0, 15, 6, 0.26);
    tronco(c, 16, 2.4, '#7a4b2a');
    copa(c, r, 0, -30, 15, 13, cor, 11);
    if (v % 3 === 1) { c.fillStyle = ['#ffd23f', '#ff7aa8', '#ffffff'][v % 3]; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(r.range(-12, 12), r.range(-40, -20), 1.6, 0, 7); c.fill(); } }
  });
  def('tropical', [-26, -62, 26, 8], (c, r, v) => {
    const cor = ['#2e7d32', '#367f2a', '#2a6f3a', '#3d8b2f'][v % 4];
    sombra(c, 0, 0, 19, 7.5, 0.28);
    tronco(c, 26, 3, '#6a3f22');
    copa(c, r, -6, -32, 13, 10, cor, 8);
    copa(c, r, 7, -34, 13, 10, cor, 8);
    copa(c, r, 0, -45, 15, 11, cor, 10);
  });
  def('pinheiro', [-16, -60, 16, 6], (c, r, v) => {
    sombra(c, 0, 0, 12, 5, 0.3);
    c.fillStyle = '#6a4326'; c.fillRect(-2, -10, 4, 10);
    const cor = ['#2f6f4f', '#2c6a3a', '#3b7a4a'][v % 3];
    for (let i = 0; i < 4; i++) {
      const y = -10 - i * 11, w = 14 - i * 2.6;
      c.beginPath(); c.moveTo(-w, y); c.lineTo(0, y - 20); c.lineTo(w, y); c.closePath();
      const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, U.shade(cor, 0.25)); g.addColorStop(1, U.shade(cor, -0.25));
      c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
    }
  });
  def('araucaria', [-24, -66, 24, 6], (c, r, v) => {
    sombra(c, 0, 0, 14, 6, 0.3);
    c.strokeStyle = '#6a4326'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -50); c.stroke();
    c.lineWidth = 2;
    [[-46, 20], [-40, 16], [-34, 12]].forEach((g, i) => {
      c.beginPath(); c.moveTo(0, g[0]); c.quadraticCurveTo(-g[1] * 0.6, g[0] - 6, -g[1], g[0] - 2); c.moveTo(0, g[0]); c.quadraticCurveTo(g[1] * 0.6, g[0] - 6, g[1], g[0] - 2); c.stroke();
    });
    [[-20, -54, 7], [20, -54, 7], [-14, -58, 7], [14, -58, 7], [0, -60, 9], [-7, -52, 6], [7, -52, 6]].forEach((b) => bolha(c, b[0], b[1], b[2], '#2f6a3c', 0.2));
  });
  def('palmeira', [-26, -58, 26, 6], (c, r, v) => {
    sombra(c, 0, 0, 12, 5, 0.28);
    c.strokeStyle = '#8a5a32'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -20, 3 + (v % 2 ? -4 : 4), -44); c.stroke();
    c.strokeStyle = 'rgba(60,30,10,.35)'; c.lineWidth = 1;
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(-2, -i * 5.5); c.lineTo(3, -i * 5.5 - 1); c.stroke(); }
    const tx = 3 + (v % 2 ? -4 : 4), ty = -44;
    const fol = [[-24, -2], [-18, -14], [-4, -18], [10, -16], [22, -6], [18, 6], [-14, 8]];
    fol.forEach((f) => {
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + f[0] * 0.5, ty + f[1] - 8, tx + f[0], ty + f[1] + 4);
      c.quadraticCurveTo(tx + f[0] * 0.5, ty + f[1] - 2, tx, ty + 2);
      c.fillStyle = '#3ea83a'; c.fill(); c.strokeStyle = '#2a7a2a'; c.lineWidth = 0.8; c.stroke();
    });
    c.fillStyle = '#7a5a2a'; c.beginPath(); c.arc(tx - 2, ty + 3, 2.4, 0, 7); c.arc(tx + 2, ty + 4, 2.4, 0, 7); c.fill();
  });
  def('arbusto', [-14, -18, 14, 6], (c, r, v) => {
    sombra(c, 0, 0, 11, 4, 0.22);
    const cor = VERDES[(v + 2) % VERDES.length];
    copa(c, r, 0, -8, 11, 7, cor, 7);
    if (v % 2) { c.fillStyle = ['#ff5c8a', '#ffd23f', '#ffffff', '#b36bff'][v % 4]; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(r.range(-8, 8), r.range(-14, -4), 1.5, 0, 7); c.fill(); } }
  });
  def('muda', [-10, -24, 10, 5], (c, r, v) => {
    sombra(c, 0, 0, 7, 3, 0.25);
    c.strokeStyle = '#b08a5a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(3, 0); c.lineTo(3, -20); c.stroke();
    c.strokeStyle = '#5a3a20'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -12); c.stroke();
    bolha(c, -3, -13, 4, '#6fcf4a'); bolha(c, 3, -15, 4, '#58b83a'); bolha(c, 0, -18, 3.5, '#7ddc55');
  });
  def('queimada', [-14, -40, 14, 5], (c, r, v) => {
    sombra(c, 0, 0, 10, 4, 0.3);
    c.strokeStyle = '#2a211c'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(v % 2 ? 2 : -1, -34); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(0, -18); c.lineTo(-9, -26); c.moveTo(1, -24); c.lineTo(9, -31); c.moveTo(0, -12); c.lineTo(7, -17); c.stroke();
    c.fillStyle = 'rgba(255,120,40,.6)'; c.beginPath(); c.arc(1, -20, 1.2, 0, 7); c.fill();
  });
  def('toco', [-9, -10, 9, 4], (c) => {
    sombra(c, 0, 0, 8, 3, 0.25);
    c.fillStyle = '#7a4b2a'; c.fillRect(-4, -7, 8, 7);
    c.fillStyle = '#d7b07a'; c.beginPath(); c.ellipse(0, -7, 4, 2, 0, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
  });
  def('pedra', [-14, -14, 14, 5], (c, r, v) => {
    sombra(c, 0, 0, 11, 4, 0.25);
    const cor = ['#9a958a', '#8c8579', '#a7a094'][v % 3];
    c.beginPath(); c.moveTo(-11, 0); c.lineTo(-8, -8); c.lineTo(-1, -12); c.lineTo(7, -9); c.lineTo(11, -1); c.closePath();
    const g = c.createLinearGradient(-10, -12, 10, 0); g.addColorStop(0, U.shade(cor, 0.3)); g.addColorStop(1, U.shade(cor, -0.3));
    c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.stroke();
  });
  def('bananeira', [-20, -40, 20, 5], (c, r, v) => {
    sombra(c, 0, 0, 12, 5, 0.25);
    c.fillStyle = '#7a8f3a'; c.fillRect(-2, -20, 4, 20);
    [[-18, -30], [16, -32], [-10, -40], [8, -40], [0, -36]].forEach((f) => {
      c.beginPath(); c.moveTo(0, -20); c.quadraticCurveTo(f[0] * 0.3, f[1] - 4, f[0], f[1]); c.quadraticCurveTo(f[0] * 0.8, f[1] + 8, 0, -18);
      c.fillStyle = '#5fbf3a'; c.fill(); c.strokeStyle = '#3a8a2a'; c.lineWidth = 0.8; c.stroke();
    });
    c.fillStyle = '#e5d24a'; c.beginPath(); c.ellipse(4, -18, 3, 5, 0.4, 0, 7); c.fill();
  });
  def('cafe', [-10, -16, 10, 4], (c, r) => {
    sombra(c, 0, 0, 8, 3, 0.25);
    bolha(c, 0, -8, 7, '#2f7a32');
    c.fillStyle = '#d62f2f'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(r.range(-5, 5), r.range(-12, -4), 1.2, 0, 7); c.fill(); }
  });
  def('vaca', [-12, -14, 12, 4], (c, r, v) => {
    sombra(c, 0, 0, 9, 3, 0.3);
    const cor = v % 3 === 0 ? '#f4f0e8' : v % 3 === 1 ? '#8a5a3a' : '#e8e2d6';
    c.fillStyle = '#3a3a3a'; [-6, -3, 3, 6].forEach((x) => c.fillRect(x, -5, 1.6, 5));
    c.fillStyle = cor; c.beginPath(); c.ellipse(0, -8, 8, 4.5, 0, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    if (v % 3 !== 1) { c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(-2, -9, 2.5, 1.8, 0, 0, 7); c.ellipse(3, -7, 2, 1.5, 0, 0, 7); c.fill(); }
    c.fillStyle = cor; c.beginPath(); c.ellipse(8.5, -10, 3, 2.6, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#f2b8a8'; c.beginPath(); c.ellipse(10.5, -9.4, 1.4, 1.2, 0, 0, 7); c.fill();
  });

  // =========================================================
  // CIDADE (âncora = canto superior da pegada)
  // =========================================================
  const PAREDES = ['#f3e6cf', '#f7d9a8', '#e9eef2', '#ffd6c2', '#e6f2d8', '#f5e1f0'];
  const TELHAS = ['#d9533b', '#e8823a', '#3a7bd5', '#2f9e8f', '#c8463a', '#8a5bd0'];
  function casa(c, r, v, solar) {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    const pa = PAREDES[v % PAREDES.length], te = TELHAS[(v * 3 + 1) % TELHAS.length];
    caixa(c, 0.16, 0.2, 0.84, 0.84, 0, 18, pa);
    janelasE(c, 0.16, 0.84, 0.84, 2, 12, 1, 2, '#7fc4ef');
    janelasD(c, 0.2, 0.84, 0.84, 2, 12, 1, 2, '#6aaedc');
    const p1 = P(0.42, 0.84, 0), p2 = P(0.56, 0.84, 0);
    poly(c, [[p1[0] - 1, p1[1] + 1], [p2[0] + 1, p2[1] + 1], [p2[0] + 1, p2[1] - 12], [p1[0] - 1, p1[1] - 12]], '#fbf6ec', false);
    poly(c, [p1, p2, [p2[0], p2[1] - 11], [p1[0], p1[1] - 11]], ['#8a5a32', '#2f7a6a', '#b0463a', '#3a5a9a'][v % 4], 'rgba(60,30,10,.4)', 0.6);
    c.fillStyle = '#ffd86a'; c.beginPath(); c.arc(p2[0] - 2, p2[1] - 5, 0.8, 0, 7); c.fill();
    poly(c, [P(0.4, 0.84, 0), P(0.58, 0.84, 0), P(0.58, 0.95, 0), P(0.4, 0.95, 0)], '#d8d2c4', 'rgba(0,0,0,.15)', 0.5);
    caixa(c, 0.62, 0.3, 0.72, 0.4, 18, 34, '#b8644a', { brilho: false, semAO: true });
    poly(c, [P(0.6, 0.28, 34), P(0.74, 0.28, 34), P(0.74, 0.42, 34), P(0.6, 0.42, 34)], '#7a3a2a', 'rgba(0,0,0,.3)', 0.5);
    telhado(c, 0.16, 0.2, 0.84, 0.84, 18, 12, te, v % 2);
    // floreira sob a janela
    const fl = P(0.24, 0.84, 3), fl2 = P(0.36, 0.84, 3);
    c.fillStyle = '#4fae3f'; c.beginPath(); c.ellipse((fl[0] + fl2[0]) / 2, (fl[1] + fl2[1]) / 2, 4.5, 1.8, 0.45, 0, 7); c.fill();
    ['#ff6a8a', '#ffd23f', '#ffffff'].forEach((k, i) => { c.fillStyle = k; c.beginPath(); c.arc(U.lerp(fl[0], fl2[0], 0.25 + i * 0.25), U.lerp(fl[1], fl2[1], 0.25 + i * 0.25) - 1.5, 0.9, 0, 7); c.fill(); });
    if (solar) {
      if (v % 2) painelSolar(c, 0.2, 0.25, 0.28, 0.5, 21, 7);
      else painelSolar(c, 0.25, 0.22, 0.5, 0.26, 20, 8);
    }
  }
  def('casa', [-34, -50, 34, 34], (c, r, v) => casa(c, r, v, false));
  def('casaSolar', [-34, -54, 34, 34], (c, r, v) => casa(c, r, v, true));
  def('predio', [-34, -120, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.28);
    const h = [56, 72, 92][v % 3];
    const cor = ['#f0e2c8', '#dfe8ef', '#f4d2b8', '#d8ecd8'][v % 4];
    caixa(c, 0.12, 0.12, 0.88, 0.88, 0, h, cor);
    const luz = (i, j) => (r() < 0.2 ? '#ffe9a0' : '#78b9e6');
    janelasE(c, 0.12, 0.88, 0.88, 4, h - 6, Math.floor(h / 13), 3, luz);
    janelasD(c, 0.12, 0.88, 0.88, 4, h - 6, Math.floor(h / 13), 3, luz);
    caixa(c, 0.3, 0.3, 0.55, 0.55, h, h + 6, '#b8bcc4');
    if (v % 2) { c.strokeStyle = '#555'; c.beginPath(); const a = P(0.7, 0.7, h); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 16); c.stroke(); }
  });
  def('predioSolar', [-34, -110, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.28);
    const h = [56, 72][v % 2];
    caixa(c, 0.12, 0.12, 0.88, 0.88, 0, h, '#e6ece8');
    janelasE(c, 0.12, 0.88, 0.88, 4, h - 6, Math.floor(h / 13), 3, '#78b9e6');
    janelasD(c, 0.12, 0.88, 0.88, 4, h - 6, Math.floor(h / 13), 3, '#78b9e6');
    painelSolar(c, 0.18, 0.18, 0.3, 0.6, h + 1, 6); painelSolar(c, 0.52, 0.18, 0.3, 0.6, h + 1, 6);
    // jardim vertical
    const a = P(0.12, 0.88, 4), b = P(0.24, 0.88, 4);
    poly(c, [a, b, [b[0], b[1] - h + 10], [a[0], a[1] - h + 10]], '#4fae3f');
  });
  def('torreVidro', [-34, -150, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.3);
    const h = 110 + (v % 2) * 18;
    const k = { topo: '#bfe6ff', esq: '#6fb7e6', dir: '#3b86c4' };
    caixa(c, 0.15, 0.15, 0.85, 0.85, 0, h, k);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.8;
    for (let z = 8; z < h; z += 8) { const a = P(0.15, 0.85, z), b = P(0.85, 0.85, z), d = P(0.85, 0.15, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke(); }
    const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    poly(c, [P(0.15, 0.85, 0), P(0.4, 0.85, 0), P(0.4, 0.85, h), P(0.15, 0.85, h)], g, false);
    caixa(c, 0.35, 0.35, 0.65, 0.65, h, h + 8, '#9aa3ad');
    for (let z = 4; z < h - 6; z += 8) for (let k = 0; k < 3; k++) {
      const a0 = 0.18 + k * 0.22, a1 = a0 + 0.16;
      emissivo([P(a0, 0.85, z), P(a1, 0.85, z), P(a1, 0.85, z + 5), P(a0, 0.85, z + 5)]);
      emissivo([P(0.85, a0, z), P(0.85, a1, z), P(0.85, a1, z + 5), P(0.85, a0, z + 5)]);
    }
  });
  def('escola', [-66, -70, 66, 66], (c, r, v) => {
    sombra(c, 1, 1, 60, 28, 0.25);
    caixa(c, 0.1, 0.15, 1.9, 0.95, 0, 26, '#ffe2a8');
    janelasE(c, 0.1, 1.9, 0.95, 3, 22, 2, 6, '#7fc4ef');
    janelasD(c, 0.15, 0.95, 1.9, 3, 22, 2, 2, '#6aaedc');
    telhado(c, 0.1, 0.15, 1.9, 0.95, 26, 12, '#d9533b', 0);
    if (v === 1) { painelSolar(c, 0.25, 0.25, 0.7, 0.32, 30, 6); painelSolar(c, 1.05, 0.25, 0.7, 0.32, 30, 6); }
    // quadra
    poly(c, [P(0.2, 1.15, 0), P(1.8, 1.15, 0), P(1.8, 1.9, 0), P(0.2, 1.9, 0)], '#3aa0d8', 'rgba(255,255,255,.8)');
    c.strokeStyle = 'rgba(255,255,255,.85)'; const m1 = P(1, 1.15, 0), m2 = P(1, 1.9, 0); c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.stroke();
    // mastro
    const f = P(1.95, 0.1, 0); c.strokeStyle = '#ddd'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(f[0], f[1] - 46); c.stroke();
    c.fillStyle = '#2e9e4a'; c.fillRect(f[0], f[1] - 46, 12, 8); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(f[0] + 6, f[1] - 45); c.lineTo(f[0] + 11, f[1] - 42); c.lineTo(f[0] + 6, f[1] - 39); c.lineTo(f[0] + 1, f[1] - 42); c.fill();
  });
  def('praca', [-34, -30, 34, 34], (c, r, v) => {
    poly(c, [P(0.05, 0.05, 0), P(0.95, 0.05, 0), P(0.95, 0.95, 0), P(0.05, 0.95, 0)], '#e9dcc2', 'rgba(120,100,80,.5)');
    poly(c, [P(0.2, 0.2, 0), P(0.8, 0.2, 0), P(0.8, 0.8, 0), P(0.2, 0.8, 0)], '#7ccf5a', false);
    cilindro(c, 0.5, 0.5, 10, 0, 4, '#c8c8c8', { topo: '#5fc4f0' });
    const p = P(0.5, 0.5, 4); c.fillStyle = 'rgba(200,240,255,.9)'; c.beginPath(); c.arc(p[0], p[1] - 7, 2.5, 0, 7); c.fill();
    c.strokeStyle = 'rgba(200,240,255,.8)'; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 8); c.stroke();
  });
  def('fabrica', [-66, -110, 66, 66], (c, r, v) => {
    sombra(c, 1, 1, 60, 28, 0.3);
    caixa(c, 0.1, 0.2, 1.4, 1.85, 0, 30, '#c7b9a6');
    // telhado dente-de-serra
    for (let i = 0; i < 4; i++) {
      const y0 = 0.2 + i * 0.41, y1 = y0 + 0.41;
      poly(c, [P(0.1, y0, 30), P(1.4, y0, 30), P(1.4, y1, 42), P(0.1, y1, 42)], '#9aa6b2');
      poly(c, [P(0.1, y1, 30), P(1.4, y1, 30), P(1.4, y1, 42), P(0.1, y1, 42)], '#8ec8ec');
    }
    janelasE(c, 0.1, 1.4, 1.85, 4, 24, 1, 4, '#5f7d99');
    caixa(c, 1.45, 0.4, 1.9, 1.2, 0, 20, '#a89a88');
    chamine(c, 1.65, 1.55, 6, 0, 92, true);
    cilindro(c, 1.7, 0.2, 8, 0, 26, '#b5bdc6');
  }, { fumaca: [[1.65, 1.55, 92, 'escura']] });
  def('galpao', [-66, -50, 66, 50], (c, r, v) => {
    sombra(c, 1, 0.5, 56, 22, 0.25);
    caixa(c, 0.1, 0.1, 1.9, 0.9, 0, 22, ['#d5d9de', '#e2c79c', '#b9d3c4'][v % 3]);
    const p1 = P(0.6, 0.9, 0), p2 = P(1.2, 0.9, 0);
    poly(c, [p1, p2, [p2[0], p2[1] - 16], [p1[0], p1[1] - 16]], '#7a8590');
    telhado(c, 0.1, 0.1, 1.9, 0.9, 22, 8, '#8e99a5', 0);
  });
  def('containers', [-34, -46, 34, 34], (c, r, v) => {
    const cs = ['#d23b2f', '#2f7ad2', '#f0a21f', '#2fa05a', '#8a5bd0', '#1fa3a3'];
    let k = v;
    [[0.1, 0.1, 0.9, 0.45, 0], [0.1, 0.5, 0.9, 0.85, 0], [0.1, 0.1, 0.9, 0.45, 12], [0.1, 0.5, 0.9, 0.85, 12]].forEach((q, i) => {
      if (i === 3 && v % 2) return;
      caixa(c, q[0], q[1], q[2], q[3], q[4], q[4] + 12, cs[(k++) % cs.length]);
    });
  });
  def('guindaste', [-50, -120, 50, 34], (c, r, v) => {
    const cor = '#f08a1f';
    caixa(c, 0.15, 0.15, 0.35, 0.35, 0, 70, cor, { brilho: false });
    caixa(c, 0.65, 0.15, 0.85, 0.35, 0, 70, cor, { brilho: false });
    caixa(c, 0.15, 0.65, 0.35, 0.85, 0, 70, cor, { brilho: false });
    caixa(c, 0.65, 0.65, 0.85, 0.85, 0, 70, cor, { brilho: false });
    caixa(c, -0.6, 0.35, 1.2, 0.65, 70, 80, '#e07a10');
    caixa(c, 0.3, 0.3, 0.7, 0.7, 80, 92, '#3a5068');
    const a = P(-0.4, 0.5, 70); c.strokeStyle = '#333'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] + 40); c.stroke();
  });
  def('navio', [-110, -60, 110, 60], (c, r, v) => {
    // casco ao longo de x
    const cs = ['#d23b2f', '#2f7ad2', '#f0a21f', '#2fa05a', '#ffffff'];
    sombra(c, 0, 0, 0, 0, 0);
    const casco = [P(-1.6, -0.35, 4), P(1.4, -0.35, 4), P(1.9, 0, 4), P(1.4, 0.35, 4), P(-1.6, 0.35, 4)];
    poly(c, [P(-1.6, 0.35, -6), P(1.4, 0.35, -6), P(1.9, 0, -4), P(1.9, 0, 4), P(1.4, 0.35, 4), P(-1.6, 0.35, 4)], '#2b3e66');
    poly(c, [P(1.4, -0.35, -6), P(1.9, 0, -4), P(1.9, 0, 4), P(1.4, -0.35, 4)], '#1e2c4c');
    poly(c, casco, '#c94a3a');
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
      const x0 = -1.0 + i * 0.38, y0 = -0.3 + j * 0.3;
      caixa(c, x0, y0, x0 + 0.34, y0 + 0.27, 4, 14 + ((i + j + v) % 2) * 9, cs[(i * 2 + j + v) % cs.length], { brilho: false });
    }
    caixa(c, -1.55, -0.3, -1.15, 0.3, 4, 30, '#f2f2f2');
    janelasE(c, -1.55, -1.15, 0.3, 20, 28, 1, 3, '#6aaedc');
  });
  def('farol', [-24, -100, 24, 20], (c) => {
    sombra(c, 0.5, 0.5, 14, 6, 0.3);
    cilindro(c, 0.5, 0.5, 9, 0, 70, '#ffffff', { faixas: [[0.15, 0.3, '#d23b2f'], [0.5, 0.65, '#d23b2f']] });
    cilindro(c, 0.5, 0.5, 7, 70, 80, '#ffe36a', { topo: '#d23b2f' });
    const p = P(0.5, 0.5, 80); c.fillStyle = '#d23b2f'; c.beginPath(); c.moveTo(p[0] - 8, p[1]); c.lineTo(p[0], p[1] - 10); c.lineTo(p[0] + 8, p[1]); c.fill();
  });
  def('igreja', [-34, -96, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.15, 0.25, 0.85, 0.85, 0, 26, '#fff4dc');
    telhado(c, 0.15, 0.25, 0.85, 0.85, 26, 14, '#c8463a', 0);
    caixa(c, 0.62, 0.3, 0.85, 0.55, 26, 50, '#fff4dc');
    const p = P(0.735, 0.425, 50); c.fillStyle = '#c8463a'; c.beginPath(); c.moveTo(p[0] - 8, p[1]); c.lineTo(p[0], p[1] - 16); c.lineTo(p[0] + 8, p[1]); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    janelasE(c, 0.15, 0.85, 0.85, 6, 20, 1, 3, '#b8e0ff');
  });
  def('quiosque', [-30, -40, 30, 30], (c, r, v) => {
    sombra(c, 0.5, 0.5, 22, 10, 0.25);
    caixa(c, 0.25, 0.25, 0.75, 0.75, 0, 12, '#c8a070');
    const t = P(0.5, 0.5, 30);
    poly(c, [P(0.1, 0.9, 12), P(0.9, 0.9, 12), t], '#e8c86a'); poly(c, [P(0.9, 0.1, 12), P(0.9, 0.9, 12), t], '#c9a23f');
  });
  def('guardaSol', [-16, -26, 16, 6], (c, r, v) => {
    c.strokeStyle = '#eee'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -18); c.stroke();
    const cor = ['#ff5a4a', '#2fa0e0', '#ffd23f', '#4fc46a'][v % 4];
    c.beginPath(); c.ellipse(0, -18, 13, 6, 0, Math.PI, 0); c.closePath(); c.fillStyle = cor; c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(0, -24); c.lineTo(-5, -18); c.lineTo(5, -18); c.fill();
  });
  def('veleiro', [-20, -40, 20, 8], (c, r, v) => {
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-12, -2); c.lineTo(12, -2); c.lineTo(8, 4); c.lineTo(-8, 4); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.strokeStyle = '#8a6a4a'; c.beginPath(); c.moveTo(0, -2); c.lineTo(0, -36); c.stroke();
    c.fillStyle = ['#ffffff', '#ffe6a0', '#ffd0d0'][v % 3]; c.beginPath(); c.moveTo(1, -34); c.lineTo(14, -6); c.lineTo(1, -6); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.beginPath(); c.moveTo(-1, -28); c.lineTo(-10, -6); c.lineTo(-1, -6); c.fillStyle = '#f2f2f2'; c.fill(); c.stroke();
  });
  def('barco', [-18, -16, 18, 8], (c, r, v) => {
    c.fillStyle = ['#d9533b', '#2f7ad2', '#f0a21f'][v % 3]; c.beginPath(); c.moveTo(-14, -2); c.lineTo(14, -4); c.lineTo(9, 4); c.lineTo(-10, 4); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.fillStyle = '#f2f2f2'; c.fillRect(-4, -10, 9, 7); c.strokeRect(-4, -10, 9, 7);
  });
  def('placa', [-16, -40, 16, 6], (c, r, v) => {
    sombra(c, 0, 0, 8, 3, 0.25);
    c.fillStyle = '#7a4b2a'; c.fillRect(-1.5, -22, 3, 22);
    c.fillStyle = '#f5e6c0'; c.strokeStyle = '#7a4b2a'; c.lineWidth = 2;
    c.beginPath(); c.roundRect ? c.roundRect(-12, -36, 24, 16, 3) : c.rect(-12, -36, 24, 16); c.fill(); c.stroke();
    ERS.drawIcon(c, 'info', 0, -28, 11, '#2a6f9e', 2.4);
  });
  def('ponto', [-12, -30, 12, 6], (c) => {
    c.fillStyle = '#4a5566'; c.fillRect(-1, -24, 2, 24);
    caixa(c, -0.1, -0.1, 0.1, 0.1, 18, 26, '#3aa0d8');
  });
  def('carregadorVE', [-34, -48, 34, 34], (c) => {
    poly(c, [P(0.05, 0.05, 0), P(0.95, 0.05, 0), P(0.95, 0.95, 0), P(0.05, 0.95, 0)], '#59606b', 'rgba(255,255,255,.4)');
    poly(c, [P(0.1, 0.1, 30), P(0.9, 0.1, 30), P(0.9, 0.9, 30), P(0.1, 0.9, 30)], '#1f3f95', CONTORNO);
    painelSolar(c, 0.1, 0.1, 0.8, 0.8, 30, 4);
    [0.2, 0.8].forEach((x) => { const a = P(x, 0.5, 0); c.strokeStyle = '#ccc'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 30); c.stroke(); });
    caixa(c, 0.4, 0.4, 0.55, 0.55, 0, 14, '#2fc46a');
    const b = P(0.48, 0.55, 10); ERS.drawIcon(c, 'raio', b[0] - 2, b[1], 7, '#fff', 2);
  });

  // =========================================================
  // ENERGIA
  // =========================================================
  // termelétrica a carvão/óleo (2x2)
  def('termeletrica', [-70, -150, 70, 70], (c, r, v) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    torreResfriamento(c, 0.6, 0.6, 26, 70, '#c9c4bc', true);
    caixa(c, 0.9, 1.0, 1.9, 1.9, 0, 34, '#8f8a84');
    janelasE(c, 0.9, 1.9, 1.9, 6, 28, 2, 4, '#556270');
    caixa(c, 1.2, 1.1, 1.7, 1.6, 34, 46, '#77726c');
    chamine(c, 1.55, 0.4, 7, 0, 112, true);
    // carvão
    const p = P(0.4, 1.6, 0);
    c.fillStyle = '#26221f'; c.beginPath(); c.ellipse(p[0], p[1] - 4, 22, 10, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#3b3530'; c.beginPath(); c.ellipse(p[0] - 3, p[1] - 8, 12, 6, 0, Math.PI, 0); c.fill();
  }, { fumaca: [[1.55, 0.4, 112, 'escura'], [0.6, 0.6, 70, 'vapor']] });
  def('termeletricaDesativada', [-70, -150, 70, 70], (c, r, v) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    torreResfriamento(c, 0.6, 0.6, 26, 70, '#cfd8c8', false);
    // torre vira mirante com jardim
    const t = P(0.6, 0.6, 70); c.fillStyle = '#5fbf4a'; c.beginPath(); c.ellipse(t[0], t[1], 18, 9, 0, 0, 7); c.fill();
    caixa(c, 0.9, 1.0, 1.9, 1.9, 0, 34, '#d8cbb2');
    janelasE(c, 0.9, 1.9, 1.9, 6, 28, 2, 4, '#9fd4f5');
    painelSolar(c, 1.0, 1.05, 0.4, 0.8, 36, 6); painelSolar(c, 1.45, 1.05, 0.4, 0.8, 36, 6);
    const p = P(1.0, 1.95, 22); c.fillStyle = '#2e9e4a'; c.fillRect(p[0] - 2, p[1] - 4, 50, 10);
    c.fillStyle = '#fff'; c.font = 'bold 7px sans-serif'; c.fillText('MUSEU DA ENERGIA', p[0] + 1, p[1] + 3.5);
  });
  def('nuclear', [-70, -140, 70, 70], (c, r, v) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    torreResfriamento(c, 0.55, 0.55, 28, 82, '#d6d2ca', false);
    cilindro(c, 1.35, 1.2, 22, 0, 30, '#e6e2da', { semTopo: true });
    const p = P(1.35, 1.2, 30); const g = c.createRadialGradient(p[0] - 8, p[1] - 14, 2, p[0], p[1], 24);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a9a49b');
    c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], 22, 24, 0, Math.PI, 0); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    caixa(c, 0.8, 1.55, 1.9, 1.95, 0, 22, '#b8b3aa');
    placaIcone(c, 1.35, 1.2, 50, 'nuclear', '#e0a400');
  }, { fumaca: [[0.55, 0.55, 82, 'vapor']] });
  // painéis solares no chão (1x1)
  def('painelSolar', [-34, -24, 34, 34], (c, r, v) => {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const x = 0.1 + i * 0.42, y = 0.08 + j * 0.3;
      const a = P(x + 0.36, y + 0.12, 0); c.strokeStyle = '#7a7f88'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 6); c.stroke();
      painelSolar(c, x, y, 0.36, 0.22, 3, 6);
    }
  });
  def('usinaSolar', [-68, -40, 68, 68], (c, r, v) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) {
      const x = 0.08 + i * 0.47, y = 0.08 + j * 0.31;
      painelSolar(c, x, y, 0.4, 0.22, 3, 6);
    }
    caixa(c, 1.72, 1.72, 1.95, 1.95, 0, 12, '#e8e8e8');
    placaIcone(c, 1.83, 1.83, 22, 'sol', '#f0a21f');
  });
  def('solarFlutuante', [-68, -30, 68, 68], (c, r, v) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
      const x = 0.1 + i * 0.46, y = 0.12 + j * 0.36;
      poly(c, [P(x - 0.03, y - 0.03, 0), P(x + 0.43, y - 0.03, 0), P(x + 0.43, y + 0.3, 0), P(x - 0.03, y + 0.3, 0)], '#f2f2f2', 'rgba(0,40,80,.3)');
      painelSolar(c, x, y, 0.4, 0.26, 2, 4);
    }
  });
  def('aquecedorSolar', [-34, -50, 34, 34], (c, r, v) => {
    casa(c, r, v + 2, false);
    const a = P(0.3, 0.3, 30);
    cilindro(c, 0.62, 0.32, 5, 30, 38, '#d0d4d8');
    poly(c, [P(0.25, 0.42, 34), P(0.55, 0.42, 34), P(0.55, 0.6, 27), P(0.25, 0.6, 27)], '#2a2f3a', '#111');
    c.strokeStyle = '#8899aa'; for (let i = 1; i < 5; i++) { const p1 = P(0.25 + i * 0.06, 0.42, 34), p2 = P(0.25 + i * 0.06, 0.6, 27); c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); }
  });
  // torre eólica (pás desenhadas dinamicamente)
  def('torreEolica', [-20, -130, 20, 16], (c, r, v) => {
    sombra(c, 0.5, 0.5, 10, 5, 0.3);
    const b = P(0.5, 0.5, 0);
    c.beginPath(); c.moveTo(b[0] - 4, b[1]); c.lineTo(b[0] - 1.6, b[1] - 104); c.lineTo(b[0] + 1.6, b[1] - 104); c.lineTo(b[0] + 4, b[1]); c.closePath();
    const g = c.createLinearGradient(b[0] - 4, 0, b[0] + 4, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9c2cc');
    c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#eef2f6'; c.beginPath(); c.ellipse(b[0] + 2, b[1] - 106, 7, 3.6, -0.2, 0, 7); c.fill(); c.stroke();
    if (v === 1) { // base offshore
      c.fillStyle = '#f0c419'; c.fillRect(b[0] - 6, b[1] - 10, 12, 10); c.strokeRect(b[0] - 6, b[1] - 10, 12, 10);
    }
  }, { rotor: [0.5, 0.5, 106, 30] });
  def('barragem', [-34, -60, 34, 40], (c, r, v) => {
    // segmento de barragem ao longo de x (v=0) ou y (v=1); v=2/3 com vertedouro
    const ao = v % 2;
    const k = { topo: '#e6e2da', esq: '#c9c4ba', dir: '#a8a296' };
    if (!ao) caixa(c, 0, 0.25, 1, 0.75, -10, 30, k); else caixa(c, 0.25, 0, 0.75, 1, -10, 30, k);
    if (v >= 2) {
      const g = c.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(160,220,255,.6)');
      if (!ao) poly(c, [P(0.2, 0.75, 28), P(0.8, 0.75, 28), P(0.8, 0.75, -10), P(0.2, 0.75, -10)], g, false);
      else poly(c, [P(0.75, 0.2, 28), P(0.75, 0.8, 28), P(0.75, 0.8, -10), P(0.75, 0.2, -10)], g, false);
    } else {
      // gradil
      c.strokeStyle = '#7a7f88'; c.lineWidth = 0.8;
      const a = !ao ? P(0, 0.75, 33) : P(0.75, 0, 33), b = !ao ? P(1, 0.75, 33) : P(0.75, 1, 33);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  });
  def('casaForca', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.15, 0.9, 0.85, 0, 22, '#d8d2c4');
    janelasE(c, 0.1, 0.9, 0.85, 4, 18, 1, 4, '#7fc4ef');
    caixa(c, 0.2, 0.25, 0.8, 0.75, 22, 26, '#a8b0b8');
    placaIcone(c, 0.5, 0.5, 34, 'gota', '#2a7fd0');
  });
  def('pch', [-34, -46, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.25, 0.9, 0.75, -6, 14, '#d8d2c4');
    caixa(c, 0.55, 0.15, 0.85, 0.85, 14, 26, '#c9b89a');
    telhado(c, 0.55, 0.15, 0.85, 0.85, 26, 8, '#2f9e8f', 1);
    const g = c.createLinearGradient(0, -10, 0, 20); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(120,200,255,.4)');
    poly(c, [P(0.15, 0.75, 10), P(0.45, 0.75, 10), P(0.45, 0.75, -6), P(0.15, 0.75, -6)], g, false);
  });
  def('usinaReversivel', [-70, -80, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.25);
    // reservatório superior + tubulação
    poly(c, [P(0.05, 0.05, 40), P(0.9, 0.05, 40), P(0.9, 0.7, 40), P(0.05, 0.7, 40)], '#3a9be0', CONTORNO);
    caixa(c, 0.05, 0.05, 0.9, 0.7, 0, 40, { topo: '#3a9be0', esq: '#8fa07a', dir: '#6f805a' }, { semTopo: true });
    cilindro(c, 0.9, 1.0, 4, 0, 36, '#7a8590', { semTopo: true });
    const a = P(0.7, 0.6, 40), b = P(1.3, 1.3, 8); c.strokeStyle = '#5a6570'; c.lineWidth = 5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = '#9aa5b0'; c.lineWidth = 2; c.stroke();
    caixa(c, 1.1, 1.2, 1.9, 1.9, 0, 20, '#d8d2c4');
    placaIcone(c, 1.5, 1.55, 30, 'ciclo', '#2a7fd0');
  });
  def('turbinaMare', [-34, -40, 34, 34], (c, r, v) => {
    // plataforma de corrente de maré
    caixa(c, 0.2, 0.2, 0.8, 0.8, -4, 6, '#f0c419');
    cilindro(c, 0.5, 0.5, 4, 6, 26, '#e8e8e8');
    caixa(c, 0.3, 0.3, 0.7, 0.7, 26, 32, '#d23b2f');
  }, { rotorAgua: [0.5, 0.5, 2, 16] });
  def('barragemMare', [-34, -46, 34, 40], (c, r, v) => {
    const k = { topo: '#d9d4ca', esq: '#bdb6aa', dir: '#9a9386' };
    caixa(c, 0, 0.2, 1, 0.8, -10, 16, k);
    for (let i = 0; i < 2; i++) { const p = P(0.25 + i * 0.5, 0.8, 4); c.fillStyle = '#2a3a4a'; c.beginPath(); c.ellipse(p[0], p[1], 6, 4, 0, 0, 7); c.fill(); }
    caixa(c, 0.35, 0.3, 0.65, 0.7, 16, 24, '#3a7bd5');
  });
  def('boiaOndas', [-30, -20, 30, 20], (c, r, v) => {
    // conversor de ondas tipo "serpente" (segmentos articulados)
    for (let i = 0; i < 4; i++) { const x = 0.1 + i * 0.22; cilindro(c, x, 0.5, 6, 0, 5, '#e85a2a', { topo: '#ff7a4a' }); }
  });
  def('geotermica', [-70, -100, 70, 70], (c) => {
    sombra(c, 1, 1, 64, 30, 0.28);
    caixa(c, 0.2, 0.9, 1.3, 1.85, 0, 28, '#e8e2d2');
    janelasE(c, 0.2, 1.3, 1.85, 4, 22, 2, 4, '#7fc4ef');
    telhado(c, 0.2, 0.9, 1.3, 1.85, 28, 8, '#2f9e8f', 0);
    torreResfriamento(c, 1.5, 0.5, 18, 48, '#e2e6ea', false);
    cilindro(c, 0.5, 0.35, 7, 0, 22, '#c9cfd6');
    // tubulações
    c.strokeStyle = '#c0c6cc'; c.lineWidth = 3.5;
    [[[0.5, 0.35, 10], [1.0, 0.35, 10], [1.0, 0.9, 10]], [[1.5, 0.5, 8], [1.5, 1.2, 8], [1.3, 1.2, 8]], [[0.05, 1.5, 6], [0.2, 1.5, 6]]].forEach((L) => {
      c.beginPath(); L.forEach((p, i) => { const q = P(p[0], p[1], p[2]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
    });
    c.strokeStyle = '#8a9096'; c.lineWidth = 1; c.stroke();
    placaIcone(c, 0.75, 1.35, 44, 'chama', '#e0552a');
  }, { fumaca: [[1.5, 0.5, 48, 'vapor'], [0.5, 0.35, 22, 'vapor']] });
  def('biomassa', [-70, -130, 70, 70], (c) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    caixa(c, 0.15, 0.8, 1.35, 1.85, 0, 36, '#e2d6bf');
    janelasE(c, 0.15, 1.35, 1.85, 5, 30, 2, 5, '#7fc4ef');
    caixa(c, 0.3, 0.95, 1.2, 1.7, 36, 44, '#b8a888');
    [0.35, 0.75].forEach((x) => cilindro(c, x, 0.3, 9, 0, 46, '#d6dce2', { topo: '#eef2f5' }));
    chamine(c, 1.6, 0.6, 6, 0, 96, false);
    // pilha de bagaço
    const p = P(1.65, 1.6, 0); c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 22, 11, 0, Math.PI, 0); c.fill(); c.strokeStyle = 'rgba(140,100,40,.6)'; c.stroke();
    c.fillStyle = '#f2d98a'; c.beginPath(); c.ellipse(p[0] - 4, p[1] - 8, 12, 6, 0, Math.PI, 0); c.fill();
    placaIcone(c, 0.75, 1.3, 56, 'folha', '#2e9e4a');
  }, { fumaca: [[1.6, 0.6, 96, 'vapor']] });
  def('biodigestor', [-34, -44, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 26, 12, 0.25);
    cilindro(c, 0.5, 0.5, 22, 0, 6, '#8a9a7a', { semTopo: true });
    const p = P(0.5, 0.5, 6); const g = c.createRadialGradient(p[0] - 8, p[1] - 14, 2, p[0], p[1], 26);
    g.addColorStop(0, '#9fe08a'); g.addColorStop(1, '#3f8a3a');
    c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], 22, 22, 0, Math.PI, 0); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.strokeStyle = '#d0d0d0'; c.lineWidth = 2; const q = P(0.5, 0.5, 28); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + 10, q[1] - 6); c.stroke();
  });
  def('usinaBiogas', [-34, -70, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.35, 0.7, 0.9, 0, 18, '#e2e6ea');
    janelasE(c, 0.1, 0.7, 0.9, 3, 14, 1, 2, '#7fc4ef');
    cilindro(c, 0.82, 0.25, 3, 0, 44, '#9aa5b0', { oco: '#333' });
    caixa(c, 0.15, 0.4, 0.65, 0.85, 18, 22, '#2e9e4a');
  }, { fogo: [[0.82, 0.25, 46]] });
  def('lixao', [-70, -50, 70, 70], (c, r) => {
    const p = P(1, 1, 0);
    c.fillStyle = '#8a7a5a'; c.beginPath(); c.ellipse(p[0], p[1], 58, 28, 0, 0, 7); c.fill();
    c.fillStyle = '#9b8a6a'; c.beginPath(); c.ellipse(p[0], p[1] - 10, 42, 22, 0, Math.PI, 0); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    const cs = ['#e04a3a', '#3a8ae0', '#f0c419', '#ffffff', '#4fae3f', '#8a5bd0', '#333'];
    for (let i = 0; i < 140; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = p[0] + Math.cos(a) * 50 * d, y = p[1] - 8 + Math.sin(a) * 22 * d - (1 - d) * 14;
      c.fillStyle = cs[i % cs.length]; c.fillRect(x, y, r.range(1.5, 4), r.range(1.5, 3));
    }
    // chorume
    c.fillStyle = 'rgba(60,40,20,.55)'; c.beginPath(); c.ellipse(p[0] + 30, p[1] + 18, 18, 6, 0, 0, 7); c.fill();
  }, { fumaca: [[0.8, 1.0, 18, 'escura'], [1.3, 1.2, 10, 'escura']] });
  def('aterro', [-70, -60, 70, 70], (c, r) => {
    const p = P(1, 1, 0);
    c.fillStyle = '#6f8a4a'; c.beginPath(); c.ellipse(p[0], p[1], 58, 28, 0, 0, 7); c.fill();
    c.fillStyle = '#86b05a'; c.beginPath(); c.ellipse(p[0], p[1] - 8, 46, 22, 0, Math.PI, 0); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(p[0], p[1] - 8, 46 - i * 10, 22 - i * 5, 0, Math.PI, 0); c.stroke(); }
    // drenos de gás
    [[-20, -14], [0, -24], [20, -14], [-8, -6], [12, -6]].forEach((d) => { c.fillStyle = '#d0d4d8'; c.fillRect(p[0] + d[0] - 1.5, p[1] + d[1] - 10, 3, 10); c.fillStyle = '#d23b2f'; c.fillRect(p[0] + d[0] - 2.5, p[1] + d[1] - 12, 5, 3); });
    // geomembrana na borda
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.beginPath(); c.ellipse(p[0], p[1], 58, 28, 0, 0, Math.PI); c.stroke();
  });
  def('reciclagem', [-70, -80, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.25);
    caixa(c, 0.2, 0.2, 1.8, 1.4, 0, 26, '#e6f2d8');
    janelasE(c, 0.2, 1.8, 1.4, 4, 20, 1, 5, '#7fc4ef');
    telhado(c, 0.2, 0.2, 1.8, 1.4, 26, 10, '#2e9e4a', 0);
    const cs = ['#3a8ae0', '#e04a3a', '#2fa05a', '#f0c419'];
    cs.forEach((k, i) => caixa(c, 0.3 + i * 0.38, 1.6, 0.6 + i * 0.38, 1.9, 0, 10, k));
    placaIcone(c, 1.0, 0.8, 46, 'ciclo', '#2e9e4a');
  });
  def('compostagem', [-34, -24, 34, 34], (c) => {
    for (let i = 0; i < 3; i++) {
      const y = 0.18 + i * 0.28; const a = P(0.12, y, 0), b = P(0.88, y, 0);
      c.fillStyle = ['#6a4a2a', '#7a5a32', '#5f4226'][i]; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 14, b[0], b[1]); c.lineTo(b[0] - 6, b[1] + 6); c.lineTo(a[0] - 6, a[1] + 6); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
      c.fillStyle = '#7fcf4a'; c.beginPath(); c.arc((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 8, 1.5, 0, 7); c.fill();
    }
  });
  def('bateria', [-34, -40, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    poly(c, [P(0.05, 0.05, 0), P(0.95, 0.05, 0), P(0.95, 0.95, 0), P(0.05, 0.95, 0)], '#b9bdc2', 'rgba(0,0,0,.2)');
    [[0.1, 0.12], [0.1, 0.55], [0.52, 0.12], [0.52, 0.55]].forEach((q) => {
      caixa(c, q[0], q[1], q[0] + 0.38, q[1] + 0.33, 0, 14, '#f4f6f8');
      const p = P(q[0] + 0.1, q[1] + 0.33, 9); c.fillStyle = '#2fd16a'; c.fillRect(p[0], p[1], 6, 2.2);
    });
  });
  def('subestacao', [-34, -60, 34, 34], (c) => {
    poly(c, [P(0.02, 0.02, 0), P(0.98, 0.02, 0), P(0.98, 0.98, 0), P(0.02, 0.98, 0)], '#a9a49a', 'rgba(0,0,0,.25)');
    [[0.2, 0.2], [0.6, 0.2], [0.2, 0.6], [0.6, 0.6]].forEach((q, i) => {
      caixa(c, q[0], q[1], q[0] + 0.22, q[1] + 0.22, 0, 12, '#7a8590');
      [0.05, 0.11, 0.17].forEach((d) => { const p = P(q[0] + d, q[1] + 0.1, 12); c.fillStyle = '#c96a3a'; c.fillRect(p[0] - 1, p[1] - 8, 2, 8); c.fillStyle = '#e8e8e8'; c.fillRect(p[0] - 1.5, p[1] - 9, 3, 2); });
    });
    c.strokeStyle = '#6a7380'; c.lineWidth = 1;
    const a = P(0.1, 0.5, 0), b = P(0.9, 0.5, 0);
    [a, b].forEach((p) => { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 34); c.stroke(); });
    c.beginPath(); c.moveTo(a[0], a[1] - 34); c.lineTo(b[0], b[1] - 34); c.stroke();
  });
  def('torreLinha', [-16, -84, 16, 8], (c) => {
    const b = P(0.5, 0.5, 0);
    c.strokeStyle = '#7d8590'; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(b[0] - 7, b[1]); c.lineTo(b[0] - 2, b[1] - 70); c.lineTo(b[0] + 2, b[1] - 70); c.lineTo(b[0] + 7, b[1]);
    for (let i = 0; i < 6; i++) { const y = b[1] - i * 11, w = 7 - i * 0.85; c.moveTo(b[0] - w, y); c.lineTo(b[0] + w - 0.85, y - 11); c.moveTo(b[0] + w, y); c.lineTo(b[0] - w + 0.85, y - 11); }
    c.moveTo(b[0] - 12, b[1] - 60); c.lineTo(b[0] + 12, b[1] - 60); c.moveTo(b[0] - 9, b[1] - 50); c.lineTo(b[0] + 9, b[1] - 50);
    c.stroke();
  }, { cabos: [[-12, -60], [12, -60], [0, -70]] });
  def('hidrogenio', [-34, -60, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.45, 0.6, 0.9, 0, 16, '#e8eef4');
    janelasE(c, 0.1, 0.6, 0.9, 3, 12, 1, 2, '#7fc4ef');
    cilindro(c, 0.75, 0.3, 8, 0, 30, '#f4f6f8', { faixas: [[0.7, 0.8, '#2fa0d8']] });
    cilindro(c, 0.3, 0.2, 6, 0, 24, '#f4f6f8', { faixas: [[0.7, 0.8, '#2fa0d8']] });
    const p = P(0.75, 0.3, 18); c.fillStyle = '#2fa0d8'; c.font = 'bold 8px sans-serif'; c.fillText('H₂', p[0] - 5, p[1]);
  });
  def('centroControle', [-34, -80, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.15, 0.15, 0.85, 0.85, 0, 34, '#e6eef6');
    janelasE(c, 0.15, 0.85, 0.85, 4, 30, 2, 3, '#4fd1ff');
    janelasD(c, 0.15, 0.85, 0.85, 4, 30, 2, 3, '#3ab0e0');
    const p = P(0.5, 0.5, 34); c.strokeStyle = '#666'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 22); c.stroke();
    c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(p[0], p[1] - 22, 2, 0, 7); c.fill();
    c.strokeStyle = '#ccc'; c.beginPath(); c.arc(p[0] - 8, p[1] - 6, 6, -0.6, 1.2); c.stroke();
    placaIcone(c, 0.5, 0.85, 40, 'rede', '#6a4fd0');
  });
  def('datacenter', [-70, -80, 70, 70], (c, r, v) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    const k = { topo: '#3a4256', esq: '#2a3044', dir: '#1d2233' };
    caixa(c, 0.1, 0.1, 1.9, 1.75, 0, 36, k);
    // faixas de luz
    for (let i = 0; i < 3; i++) {
      const z = 8 + i * 9;
      poly(c, [P(0.1, 1.75, z), P(1.9, 1.75, z), P(1.9, 1.75, z + 2), P(0.1, 1.75, z + 2)], i === 1 ? '#7a5bff' : '#3ad1ff', false);
      poly(c, [P(1.9, 0.1, z), P(1.9, 1.75, z), P(1.9, 1.75, z + 2), P(1.9, 0.1, z + 2)], i === 1 ? '#5a3bdf' : '#2aa1df', false);
      emissivo([P(0.1, 1.75, z), P(1.9, 1.75, z), P(1.9, 1.75, z + 2), P(0.1, 1.75, z + 2)], i === 1 ? '#a08bff' : '#7ae8ff');
      emissivo([P(1.9, 0.1, z), P(1.9, 1.75, z), P(1.9, 1.75, z + 2), P(1.9, 0.1, z + 2)], i === 1 ? '#a08bff' : '#7ae8ff');
    }
    // resfriadores no telhado
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = 0.25 + i * 0.4, y = 0.25 + j * 0.45;
      caixa(c, x, y, x + 0.3, y + 0.3, 36, 42, '#9aa5b0', { brilho: false });
      const p = P(x + 0.15, y + 0.15, 42); c.fillStyle = '#4a5566'; c.beginPath(); c.ellipse(p[0], p[1], 6, 3, 0, 0, 7); c.fill();
    }
    if (v === 1) { painelSolar(c, 0.25, 0.25, 1.5, 0.5, 44, 4); }
    placaIcone(c, 1.0, 1.75, 30, 'servidor', '#6a4fd0');
  }, { ruido: true });
  def('geradorDiesel', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    [[0.1, 0.15], [0.1, 0.55]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.75, q[1] + 0.32, 0, 14, '#e0b83a'); cilindro(c, q[0] + 0.6, q[1] + 0.15, 2.5, 14, 26, '#555', { oco: '#222' }); });
  }, { fumaca: [[0.7, 0.3, 26, 'escura'], [0.7, 0.7, 26, 'escura']] });
  def('resfriamentoAgua', [-34, -60, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.1, 0.9, 0.9, 0, 24, '#9fb3c4');
    [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].forEach((q) => { cilindro(c, q[0], q[1], 6, 24, 30, '#c8d2dc', { oco: '#3a4a5a' }); });
  }, { fumaca: [[0.5, 0.5, 30, 'vapor']] });
  def('estufa', [-34, -40, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.2);
    const k = { topo: 'rgba(200,240,255,.75)', esq: 'rgba(170,220,240,.7)', dir: 'rgba(130,190,220,.7)' };
    for (let i = 0; i < 4; i++) { const x = 0.15 + i * 0.18; const p = P(x, 0.85, 4); c.fillStyle = '#4fae3f'; c.beginPath(); c.arc(p[0], p[1] - 3, 3, 0, 7); c.fill(); }
    caixa(c, 0.1, 0.15, 0.9, 0.85, 0, 14, k);
    telhado(c, 0.1, 0.15, 0.9, 0.85, 14, 9, '#cdeefc', 0, 'rgba(200,240,255,.7)');
  });
  def('cinturaoVerde', [-34, -50, 34, 34], (c, r) => {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const p = P(0.2 + i * 0.3, 0.3 + j * 0.4, 0);
      bolha(c, p[0], p[1] - 16, 10, VERDES[(i + j) % VERDES.length]);
      bolha(c, p[0] + 3, p[1] - 22, 7, VERDES[(i + j + 1) % VERDES.length]);
    }
  });
  def('muroAcustico', [-34, -40, 34, 34], (c) => {
    caixa(c, 0.05, 0.75, 0.95, 0.9, 0, 20, '#7fb06a');
    for (let i = 0; i < 5; i++) { const p = P(0.12 + i * 0.18, 0.9, 14); c.fillStyle = '#5a9a4a'; c.beginPath(); c.arc(p[0], p[1], 3, 0, 7); c.fill(); }
  });
  def('plataformaPetroleo', [-70, -130, 70, 60], (c) => {
    [[0.3, 0.3], [1.5, 0.3], [0.3, 1.5], [1.5, 1.5]].forEach((q) => cilindro(c, q[0], q[1], 5, -10, 30, '#f0c419'));
    caixa(c, 0.1, 0.1, 1.8, 1.8, 30, 40, '#7a8590');
    caixa(c, 0.2, 0.9, 0.9, 1.7, 40, 64, '#e8e8e8');
    janelasE(c, 0.2, 0.9, 1.7, 44, 60, 2, 3, '#6aaedc');
    const t = P(1.3, 0.5, 40); c.strokeStyle = '#d23b2f'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(t[0] - 10, t[1]); c.lineTo(t[0], t[1] - 70); c.lineTo(t[0] + 10, t[1]); c.moveTo(t[0] - 7, t[1] - 20); c.lineTo(t[0] + 7, t[1] - 20); c.moveTo(t[0] - 4, t[1] - 45); c.lineTo(t[0] + 4, t[1] - 45); c.stroke();
    caixa(c, 0.95, 0.15, 1.75, 0.5, 40, 42, '#ff5a3a');
  }, { fogo: [[1.75, 1.75, 50]], fumaca: [[1.75, 1.75, 56, 'escura']] });
  def('cavaloPetroleo', [-34, -40, 34, 34], (c) => {
    caixa(c, 0.3, 0.3, 0.7, 0.7, 0, 4, '#555');
    const a = P(0.5, 0.5, 4); c.strokeStyle = '#333'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(a[0] - 6, a[1]); c.lineTo(a[0], a[1] - 20); c.lineTo(a[0] + 6, a[1]); c.stroke();
    c.strokeStyle = '#d23b2f'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(a[0] - 18, a[1] - 14); c.lineTo(a[0] + 16, a[1] - 24); c.stroke();
    c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(a[0] - 18, a[1] - 10, 4, 0, 7); c.fill();
  });
  // mineração
  def('escavadeira', [-30, -40, 30, 12], (c, r, v) => {
    sombra(c, 0, 0, 16, 6, 0.3);
    c.fillStyle = '#2a2a2a'; c.fillRect(-12, -5, 24, 5);
    c.fillStyle = '#f0b419'; c.fillRect(-10, -16, 16, 11); c.strokeStyle = CONTORNO; c.strokeRect(-10, -16, 16, 11);
    c.fillStyle = '#8ad0ff'; c.fillRect(-8, -14, 6, 5);
    c.strokeStyle = '#d99a10'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(4, -12); c.lineTo(16, -28); c.lineTo(24, -14); c.stroke();
    c.fillStyle = '#555'; c.beginPath(); c.moveTo(20, -14); c.lineTo(28, -14); c.lineTo(25, -7); c.fill();
  });
  def('caminhaoMina', [-26, -28, 26, 10], (c, r, v) => {
    sombra(c, 0, 0, 18, 6, 0.3);
    c.fillStyle = '#222'; [-12, -4, 10].forEach((x) => { c.beginPath(); c.arc(x, -3, 4, 0, 7); c.fill(); });
    c.fillStyle = '#f0b419'; c.beginPath(); c.moveTo(-18, -8); c.lineTo(6, -8); c.lineTo(8, -22); c.lineTo(-20, -20); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.fillStyle = '#e0a010'; c.fillRect(6, -18, 10, 10); c.fillStyle = '#8ad0ff'; c.fillRect(9, -16, 5, 4);
    c.fillStyle = '#8a5a3a'; c.beginPath(); c.ellipse(-6, -21, 12, 4, 0, Math.PI, 0); c.fill();
  });
  def('beneficiamento', [-70, -100, 70, 70], (c) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    caixa(c, 0.2, 0.7, 1.3, 1.8, 0, 40, '#b8a68a');
    janelasE(c, 0.2, 1.3, 1.8, 6, 34, 2, 4, '#556270');
    cilindro(c, 1.5, 0.5, 12, 0, 50, '#9aa5b0');
    c.strokeStyle = '#555'; c.lineWidth = 4; const a = P(0.2, 0.4, 0), b = P(0.8, 0.9, 40); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = '#8a6a4a'; c.lineWidth = 2; c.stroke();
    chamine(c, 1.6, 1.4, 5, 0, 80, false);
  }, { fumaca: [[1.6, 1.4, 80, 'poeira']] });
  def('reciclaEletronicos', [-34, -60, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.15, 0.9, 0.85, 0, 26, '#e8e2f4');
    janelasE(c, 0.1, 0.9, 0.85, 4, 20, 1, 3, '#7fc4ef');
    telhado(c, 0.1, 0.15, 0.9, 0.85, 26, 9, '#6a4fd0', 0);
    placaIcone(c, 0.5, 0.85, 18, 'ciclo', '#6a4fd0');
    const p = P(0.95, 0.4, 0); ['#333', '#555', '#2a6fb0'].forEach((k, i) => { c.fillStyle = k; c.fillRect(p[0] + i * 4, p[1] - 6 - i * 2, 8, 6); });
  });
  def('viveiro', [-34, -40, 34, 34], (c) => {
    const k = { topo: 'rgba(40,60,40,.55)', esq: 'rgba(40,60,40,.35)', dir: 'rgba(40,60,40,.45)' };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const p = P(0.18 + i * 0.2, 0.18 + j * 0.2, 0); bolha(c, p[0], p[1] - 3, 3, '#5fc43a'); }
    caixa(c, 0.08, 0.08, 0.92, 0.92, 0, 16, k, { brilho: false });
  });
  def('lote', [-34, -6, 34, 34], (c) => { /* placeholder: desenhado dinamicamente */ });
  def('cooperativa', [-34, -56, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.12, 0.2, 0.88, 0.85, 0, 20, '#fff0c8');
    janelasE(c, 0.12, 0.88, 0.85, 3, 15, 1, 3, '#7fc4ef');
    telhado(c, 0.12, 0.2, 0.88, 0.85, 20, 11, '#2f9e8f', 1);
    if (v === 1) painelSolar(c, 0.5, 0.25, 0.32, 0.55, 24, 6);
  });
  def('irrigacaoGotejo', [-34, -10, 34, 34], (c) => {
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const a = P(0.1, 0.15 + i * 0.22, 1), b = P(0.9, 0.15 + i * 0.22, 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); for (let k = 0; k < 6; k++) { const p = P(0.15 + k * 0.14, 0.15 + i * 0.22, 1); c.fillStyle = '#4fc0ff'; c.beginPath(); c.arc(p[0], p[1] + 1.5, 1, 0, 7); c.fill(); } }
  });
  def('tanqueVinhaca', [-34, -30, 34, 34], (c) => {
    poly(c, [P(0.08, 0.08, 0), P(0.92, 0.08, 0), P(0.92, 0.92, 0), P(0.08, 0.92, 0)], '#5a3a22', CONTORNO);
    poly(c, [P(0.15, 0.15, 0), P(0.85, 0.15, 0), P(0.85, 0.85, 0), P(0.15, 0.85, 0)], '#7a4a2a', false);
  });
  def('escadaPeixes', [-34, -30, 34, 34], (c) => {
    for (let i = 0; i < 5; i++) caixa(c, 0.1 + i * 0.16, 0.3, 0.26 + i * 0.16, 0.7, 0, 4 + i * 4, '#c9c4ba', { brilho: false });
    for (let i = 0; i < 5; i++) { const p = P(0.18 + i * 0.16, 0.5, 5 + i * 4); c.fillStyle = 'rgba(90,180,255,.85)'; c.beginPath(); c.ellipse(p[0], p[1], 5, 2.5, 0, 0, 7); c.fill(); }
  });
  def('mataCiliar', [-34, -46, 34, 34], (c, r) => {
    for (let i = 0; i < 5; i++) { const p = P(r.range(0.15, 0.85), r.range(0.15, 0.85), 0); bolha(c, p[0], p[1] - 14, r.range(6, 9), VERDES[i % VERDES.length]); c.fillStyle = '#6a3f22'; c.fillRect(p[0] - 1, p[1] - 6, 2, 6); }
  });
  def('ecoponto', [-34, -40, 34, 34], (c) => {
    poly(c, [P(0.05, 0.05, 0), P(0.95, 0.05, 0), P(0.95, 0.95, 0), P(0.05, 0.95, 0)], '#d8d2c4', 'rgba(0,0,0,.2)');
    ['#3a8ae0', '#e04a3a', '#2fa05a', '#f0c419', '#8a5a3a'].forEach((k, i) => caixa(c, 0.12 + i * 0.16, 0.4, 0.26 + i * 0.16, 0.7, 0, 14, k));
  });
  def('fazenda', [-34, -56, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.15, 0.25, 0.85, 0.85, 0, 18, '#c8463a');
    telhado(c, 0.15, 0.25, 0.85, 0.85, 18, 13, '#6a6f78', 1);
    const p1 = P(0.35, 0.85, 0), p2 = P(0.65, 0.85, 0); poly(c, [p1, p2, [p2[0], p2[1] - 13], [p1[0], p1[1] - 13]], '#fff4dc');
    cilindro(c, 0.95, 0.2, 7, 0, 32, '#d6dce2', { topo: '#a8b0b8' });
  });
  def('pocoGeo', [-34, -50, 34, 34], (c) => {
    poly(c, [P(0.15, 0.15, 0), P(0.85, 0.15, 0), P(0.85, 0.85, 0), P(0.15, 0.85, 0)], '#b3ada2', 'rgba(0,0,0,.25)');
    cilindro(c, 0.5, 0.5, 6, 0, 10, '#d23b2f');
    cilindro(c, 0.5, 0.5, 3, 10, 24, '#c0c6cc');
    c.strokeStyle = '#c0c6cc'; c.lineWidth = 3; const a = P(0.5, 0.5, 18), b = P(0.95, 0.5, 18); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    placaIcone(c, 0.5, 0.5, 34, 'gota', '#2a7fd0');
  });
  def('filtroGas', [-34, -60, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.45, 0.6, 0.9, 0, 18, '#e8eef4');
    [0.25, 0.7].forEach((x) => cilindro(c, x, 0.28, 7, 0, 34, '#9fd0b8', { faixas: [[0.8, 0.9, '#2e9e4a']] }));
    placaIcone(c, 0.35, 0.9, 12, 'folha', '#2e9e4a');
  });
  def('destilaria', [-34, -64, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.4, 0.6, 0.9, 0, 18, '#f2e6c8');
    janelasE(c, 0.1, 0.6, 0.9, 3, 14, 1, 2, '#7fc4ef');
    cilindro(c, 0.78, 0.3, 7, 0, 40, '#e0e4e8', { faixas: [[0.6, 0.7, '#2e9e4a']] });
    cilindro(c, 0.35, 0.2, 5, 0, 30, '#e0e4e8');
    const p = P(0.92, 0.85, 0); c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(p[0], p[1] - 2, 10, 5, 0, Math.PI, 0); c.fill();
  });
  def('canavial', [-34, -30, 34, 34], (c, r) => {
    for (let i = 0; i < 26; i++) {
      const p = P(r.range(0.1, 0.9), r.range(0.1, 0.9), 0);
      c.strokeStyle = r() < 0.5 ? '#7aa82a' : '#a6c93a'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + r.range(-3, 3), p[1] - 12, p[0] + r.range(-6, 6), p[1] - r.range(16, 24)); c.stroke();
    }
  });
  def('agrofloresta', [-68, -64, 68, 68], (c, r) => {
    const itens = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) itens.push([0.25 + i * 0.5 + r.range(-0.08, 0.08), 0.25 + j * 0.5 + r.range(-0.08, 0.08), (i + j * 2) % 4]);
    itens.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    itens.forEach((it) => {
      const p = P(it[0], it[1], 0);
      c.save(); c.translate(p[0], p[1]);
      if (it[2] === 0) { const s = SPR.get('bananeira', 0, 1); c.drawImage(s.img, s.l * 0.8, s.t * 0.8, s.w * 0.8, s.h * 0.8); }
      else if (it[2] === 1) { const s = SPR.get('cafe', 0, 1); c.drawImage(s.img, s.l, s.t, s.w, s.h); }
      else if (it[2] === 2) { const s = SPR.get('arvore', 3, 1); c.drawImage(s.img, s.l * 0.85, s.t * 0.85, s.w * 0.85, s.h * 0.85); }
      else { const s = SPR.get('tropical', 1, 1); c.drawImage(s.img, s.l * 0.7, s.t * 0.7, s.w * 0.7, s.h * 0.7); }
      c.restore();
    });
  });
  def('reflorestamento', [-68, -40, 68, 68], (c, r) => {
    const itens = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) itens.push([0.2 + i * 0.4, 0.2 + j * 0.4, r() < 0.35]);
    itens.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    itens.forEach((it) => {
      const p = P(it[0], it[1], 0);
      const s = it[2] ? SPR.get('arbusto', 1, 1) : SPR.get('muda', 0, 1);
      c.drawImage(s.img, p[0] + s.l, p[1] + s.t, s.w, s.h);
    });
  });
  def('incinerador', [-34, -110, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.3, 0.75, 0.9, 0, 24, '#8f8a84');
    janelasE(c, 0.1, 0.75, 0.9, 4, 20, 1, 3, '#556270');
    chamine(c, 0.82, 0.22, 5, 0, 78, false);
  }, { fumaca: [[0.82, 0.22, 78, 'escura']] });
  def('cavaMina', [-68, -40, 68, 68], (c) => {
    const p = P(1, 1, 0);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = ['#c98f5a', '#b5784a', '#a0683e', '#8a5a34'][i];
      c.beginPath(); c.ellipse(p[0], p[1] + i * 3, 58 - i * 13, 28 - i * 6.5, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(80,40,20,.35)'; c.stroke();
    }
    c.fillStyle = '#5a7a8a'; c.beginPath(); c.ellipse(p[0], p[1] + 10, 10, 4, 0, 0, 7); c.fill();
    const s = SPR.get('escavadeira', 0, 1); c.drawImage(s.img, p[0] + 10 + s.l, p[1] - 4 + s.t, s.w, s.h);
  });
  def('eta', [-34, -40, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    poly(c, [P(0.05, 0.05, 0), P(0.95, 0.05, 0), P(0.95, 0.95, 0), P(0.05, 0.95, 0)], '#c9c4ba', 'rgba(0,0,0,.2)');
    [[0.3, 0.3], [0.7, 0.68]].forEach((q) => cilindro(c, q[0], q[1], 13, 0, 8, '#d8d4cc', { topo: '#4fb8e8', oco: '#3a9be0' }));
    caixa(c, 0.6, 0.12, 0.9, 0.42, 0, 14, '#e8eef4');
    placaIcone(c, 0.75, 0.27, 24, 'gota', '#2a7fd0');
  });
  def('lagoRejeito', [-70, -40, 70, 70], (c) => {
    const p = P(1, 1, 0);
    // dique
    c.fillStyle = '#9a8a6a'; c.beginPath(); c.ellipse(p[0], p[1], 60, 30, 0, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.fillStyle = '#7a6a4a'; c.beginPath(); c.ellipse(p[0], p[1] + 4, 60, 30, 0, 0.1, Math.PI - 0.1); c.lineTo(p[0] - 58, p[1] + 2); c.fill();
    c.fillStyle = '#8a7b5c'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 50, 24, 0, 0, 7); c.fill();
    c.fillStyle = '#6f6248'; c.beginPath(); c.ellipse(p[0] - 6, p[1] - 3, 34, 15, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(p[0] - 30 + i * 15, p[1] - 6 + i); c.lineTo(p[0] - 20 + i * 15, p[1] - 6 + i); c.stroke(); }
    // rachaduras no dique
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0] + 20, p[1] + 26); c.lineTo(p[0] + 24, p[1] + 20); c.lineTo(p[0] + 21, p[1] + 15); c.moveTo(p[0] - 14, p[1] + 28); c.lineTo(p[0] - 10, p[1] + 22); c.stroke();
  });
  def('pilhaSeca', [-70, -50, 70, 70], (c) => {
    const p = P(1, 1, 0);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = ['#b8a888', '#c8b898', '#a8c878', '#8ac85a'][i];
      c.beginPath(); c.ellipse(p[0], p[1] - i * 7, 56 - i * 12, 26 - i * 5.5, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(60,50,30,.35)'; c.stroke();
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const s = SPR.get('muda', 0, 1); c.drawImage(s.img, p[0] + Math.cos(a) * 30 + s.l, p[1] - 20 + Math.sin(a) * 12 + s.t, s.w, s.h); }
  });
  def('vulcaoTopo', [-70, -40, 70, 40], () => {});

  // =========================================================
  // PERSONAGENS (desenhados a cada quadro)
  // =========================================================
  SPR.pessoa = function (c, x, y, look, t, andando, dir, escala) {
    const s = escala || 1;
    c.save();
    c.translate(x, y);
    c.scale(dir < 0 ? -s : s, s);
    const passo = andando ? Math.sin(t * 12) : 0;
    const bob = andando ? Math.abs(Math.cos(t * 12)) * 1.2 : Math.sin(t * 2) * 0.4;
    // sombra
    c.fillStyle = 'rgba(20,30,20,.3)'; c.beginPath(); c.ellipse(0, 0, 8, 3.5, 0, 0, 7); c.fill();
    c.translate(0, -bob);
    // pernas
    c.strokeStyle = look.calca || '#2a4a7a'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-2, -9); c.lineTo(-2 + passo * 3, -1); c.moveTo(2, -9); c.lineTo(2 - passo * 3, -1); c.stroke();
    c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(-2 + passo * 3, -0.5, 1.8, 0, 7); c.arc(2 - passo * 3, -0.5, 1.8, 0, 7); c.fill();
    // mochila
    if (look.mochila) { c.fillStyle = look.mochila; c.beginPath(); c.roundRect ? c.roundRect(-8, -19, 5, 9, 2) : c.rect(-8, -19, 5, 9); c.fill(); }
    // corpo
    c.fillStyle = look.camisa || '#2fa05a';
    c.beginPath(); c.moveTo(-5, -9); c.lineTo(-5.5, -19); c.quadraticCurveTo(0, -22, 5.5, -19); c.lineTo(5, -9); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.8; c.stroke();
    if (look.colete) { c.fillStyle = look.colete; c.fillRect(-4.5, -18, 9, 4); }
    // braços
    c.strokeStyle = look.pele || '#c98a5a'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-5, -18); c.lineTo(-6.5 - passo * 2, -11); c.moveTo(5, -18); c.lineTo(6.5 + passo * 2, -11); c.stroke();
    // cabeça
    c.fillStyle = look.pele || '#c98a5a'; c.beginPath(); c.arc(0, -25, 5.2, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
    // cabelo
    c.fillStyle = look.cabelo || '#2a1a10';
    const tc = look.tipoCabelo || 0;
    c.beginPath();
    if (tc === 0) { c.arc(0, -26.5, 5.4, Math.PI, 0); }
    else if (tc === 1) { c.arc(0, -26.5, 5.6, Math.PI * 0.9, Math.PI * 2.1); c.rect(-5.6, -26.5, 2.4, 9); c.rect(3.2, -26.5, 2.4, 9); }
    else if (tc === 2) { c.arc(0, -27, 6.6, 0, 7); }
    else if (tc === 3) { c.arc(0, -26.5, 5.4, Math.PI, 0); c.arc(-4.5, -24, 2.6, 0, 7); }
    else { c.arc(0, -26, 5.3, Math.PI * 1.05, Math.PI * 1.95); }
    c.fill();
    if (tc === 2) { c.fillStyle = look.pele || '#c98a5a'; c.beginPath(); c.arc(0.8, -24.6, 4.3, 0, 7); c.fill(); }
    // olhos
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(1.6, -25, 0.8, 0, 7); c.arc(4, -25, 0.8, 0, 7); c.fill();
    if (look.oculos) { c.strokeStyle = '#222'; c.lineWidth = 0.7; c.beginPath(); c.arc(1.6, -25, 1.6, 0, 7); c.moveTo(5.6, -25); c.arc(4, -25, 1.6, 0, 7); c.stroke(); }
    // chapéu / capacete
    if (look.chapeu === 'capacete') { c.fillStyle = look.corChapeu || '#ffd23f'; c.beginPath(); c.arc(0, -28, 5.8, Math.PI, 0); c.fill(); c.fillRect(-7, -28.5, 14, 1.8); }
    else if (look.chapeu === 'bone') { c.fillStyle = look.corChapeu || '#d23b2f'; c.beginPath(); c.arc(0, -28, 5.5, Math.PI, 0); c.fill(); c.fillRect(0, -29, 9, 2); }
    else if (look.chapeu === 'palha') { c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(0, -28.5, 10, 2.6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -29, 5, Math.PI, 0); c.fill(); c.strokeStyle = '#b08a3a'; c.lineWidth = 0.6; c.stroke(); }
    else if (look.chapeu === 'cocar') { ['#d23b2f', '#ffd23f', '#2fa05a', '#2f7ad2', '#ffd23f', '#d23b2f'].forEach((k, i) => { c.fillStyle = k; c.beginPath(); c.ellipse(-5 + i * 2, -33, 1.2, 4, (i - 2.5) * 0.25, 0, 7); c.fill(); }); }
    c.restore();
  };

  // retrato do personagem (busto) para diálogos
  SPR.retrato = function (canvas, look, fundo) {
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fundo || '#7fd1ff'); g.addColorStop(1, U.shade(fundo || '#7fd1ff', -0.35));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(w * 0.75, h * 0.25, w * 0.3, 0, 7); c.fill();
    c.save();
    c.translate(w / 2, h * 1.02);
    const k = w / 34;
    c.scale(k, k);
    // ombros
    c.fillStyle = look.camisa || '#2fa05a';
    c.beginPath(); c.moveTo(-15, 0); c.quadraticCurveTo(-14, -14, 0, -15); c.quadraticCurveTo(14, -14, 15, 0); c.fill();
    if (look.colete) { c.fillStyle = look.colete; c.fillRect(-12, -10, 24, 4); }
    // cabelo de trás (volumoso ou comprido) fica atrás do rosto
    const tcb = look.tipoCabelo || 0;
    if (tcb === 2) { c.fillStyle = look.cabelo || '#2a1a10'; c.beginPath(); c.arc(0, -28, 12.5, 0, 7); c.arc(-9, -23, 5.5, 0, 7); c.arc(9, -23, 5.5, 0, 7); c.fill(); }
    if (tcb === 1) { c.fillStyle = look.cabelo || '#2a1a10'; c.beginPath(); c.ellipse(0, -24, 10.5, 13, 0, 0, 7); c.fill(); }
    c.fillStyle = look.pele || '#c98a5a'; c.fillRect(-3, -19, 6, 5);
    // cabeça
    c.beginPath(); c.ellipse(0, -26, 8.5, 9.5, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(-8.5, -25, 1.8, 0, 7); c.arc(8.5, -25, 1.8, 0, 7); c.fill();
    // cabelo
    c.fillStyle = look.cabelo || '#2a1a10';
    const tc = look.tipoCabelo || 0;
    c.beginPath();
    if (tc === 0) { c.ellipse(0, -31, 9, 6, 0, Math.PI, 0); c.rect(-9, -32, 2, 6); c.rect(7, -32, 2, 6); }
    else if (tc === 1) { c.ellipse(0, -31, 9.6, 6.5, 0, Math.PI, 0); c.rect(-10, -31, 2.6, 12); c.rect(7.4, -31, 2.6, 12); }
    else if (tc === 2) { c.ellipse(0, -32.5, 10, 6, 0, Math.PI, 0); }
    else if (tc === 3) { c.ellipse(0, -31, 9, 6, 0, Math.PI, 0); c.arc(0, -37, 4, 0, 7); }
    else { c.ellipse(0, -33, 8.5, 4, 0, Math.PI, 0); }
    c.fill();
    if (look.barba) { c.fillStyle = look.cabelo; c.beginPath(); c.ellipse(0, -20, 6, 3.4, 0, 0, Math.PI); c.fill(); }
    // rosto
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(-3.2, -26, 1.1, 1.4, 0, 0, 7); c.ellipse(3.2, -26, 1.1, 1.4, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-2.8, -26.5, 0.4, 0, 7); c.arc(3.6, -26.5, 0.4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(80,30,20,.8)'; c.lineWidth = 0.8; c.beginPath(); c.arc(0, -22.5, 2.6, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.25)'; c.beginPath(); c.arc(-5, -23, 1.6, 0, 7); c.arc(5, -23, 1.6, 0, 7); c.fill();
    if (look.oculos) { c.strokeStyle = '#222'; c.lineWidth = 0.7; c.beginPath(); c.arc(-3.2, -26, 2.3, 0, 7); c.moveTo(5.5, -26); c.arc(3.2, -26, 2.3, 0, 7); c.moveTo(-0.9, -26); c.lineTo(0.9, -26); c.stroke(); }
    if (look.chapeu === 'capacete') { c.fillStyle = look.corChapeu || '#ffd23f'; c.beginPath(); c.ellipse(0, -32, 10, 7.5, 0, Math.PI, 0); c.fill(); c.fillRect(-12, -32.5, 24, 2); }
    else if (look.chapeu === 'bone') { c.fillStyle = look.corChapeu || '#d23b2f'; c.beginPath(); c.ellipse(0, -32, 9.4, 7, 0, Math.PI, 0); c.fill(); c.fillRect(-2, -33, 14, 2.4); }
    else if (look.chapeu === 'palha') { c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(0, -32, 16, 3.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -33, 8.5, 6, 0, Math.PI, 0); c.fill(); c.fillStyle = '#b0462a'; c.fillRect(-8.5, -34, 17, 1.6); }
    else if (look.chapeu === 'cocar') { ['#d23b2f', '#ffd23f', '#2fa05a', '#2f7ad2', '#ffd23f', '#2fa05a', '#d23b2f'].forEach((k2, i) => { c.fillStyle = k2; c.beginPath(); c.ellipse(-9 + i * 3, -38, 1.6, 6, (i - 3) * 0.2, 0, 7); c.fill(); }); c.fillStyle = '#8a5a2a'; c.fillRect(-9, -34, 18, 2); }
    c.restore();
  };
})();
