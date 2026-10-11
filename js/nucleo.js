/* =========================================================
   Energias Renováveis e Sustentabilidade — núcleo utilitário
   ========================================================= */
(function () {
  'use strict';
  const ERS = (window.ERS = window.ERS || {});

  // ---------- números ----------
  const U = (ERS.U = {});
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // gerador pseudoaleatório determinístico (mulberry32)
  U.rng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (a0, b0) => a0 + f() * (b0 - a0);
    f.int = (a0, b0) => Math.floor(a0 + f() * (b0 - a0 + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.chance = (p) => f() < p;
    return f;
  };

  // embaralhamento (Fisher–Yates) com aleatoriedade real a cada jogada
  U.shuffle = function (arr, r) {
    const a = arr.slice();
    const rnd = r || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  // hash FNV-1a 32 bits sobre UTF-8 (idêntico ao do script Python de vozes)
  U.hash = function (str) {
    const bytes = new TextEncoder().encode(str);
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  // ruído de valor 2D suave + fbm
  U.noise2 = function (seed) {
    const P = new Uint8Array(512);
    const r = U.rng(seed);
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255];
    const V = new Float32Array(256);
    for (let i = 0; i < 256; i++) V[i] = r();
    const val = (x, y) => V[P[(P[x & 255] + y) & 511] & 255];
    const n = function (x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = U.smooth(xf), v = U.smooth(yf);
      const a = val(xi, yi), b = val(xi + 1, yi), c = val(xi, yi + 1), d = val(xi + 1, yi + 1);
      return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
    };
    n.fbm = function (x, y, oct) {
      let s = 0, amp = 0.5, f = 1, norm = 0;
      for (let i = 0; i < (oct || 4); i++) { s += amp * n(x * f, y * f); norm += amp; amp *= 0.5; f *= 2; }
      return s / norm;
    };
    return n;
  };

  // cores
  U.hex = function (h) {
    if (Array.isArray(h)) return h;
    if (h.indexOf('rgb') === 0) { const m = h.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; }
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  U.shade = function (hex, f) {
    const c = typeof hex === 'string' ? U.hex(hex) : hex;
    if (f >= 0) return U.rgb([c[0] + (255 - c[0]) * f, c[1] + (255 - c[1]) * f, c[2] + (255 - c[2]) * f]);
    return U.rgb([c[0] * (1 + f), c[1] * (1 + f), c[2] * (1 + f)]);
  };
  U.mix = function (h1, h2, t) {
    const a = typeof h1 === 'string' ? U.hex(h1) : h1;
    const b = typeof h2 === 'string' ? U.hex(h2) : h2;
    return [U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)];
  };

  // armazenamento local seguro
  const S = (ERS.S = {});
  S.get = function (k, def) {
    try { const v = localStorage.getItem('ers:' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
  };
  S.set = function (k, v) {
    try { localStorage.setItem('ers:' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ }
  };
  S.del = function (k) { try { localStorage.removeItem('ers:' + k); } catch (e) {} };

  // ---------- ícones (SVG 24x24, traço) ----------
  ERS.ICONES = {
    sol: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z M12 1.5v3 M12 19.5v3 M4.6 4.6l2.1 2.1 M17.3 17.3l2.1 2.1 M1.5 12h3 M19.5 12h3 M4.6 19.4l2.1-2.1 M17.3 6.7l2.1-2.1',
    vento: 'M3 8h11a3 3 0 1 0-3-3 M3 12h16a3 3 0 1 1-3 3 M3 16h8',
    gota: 'M12 2.5C12 2.5 5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5Z M9 15a3 3 0 0 0 3 3',
    onda: 'M2 8.5c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0s3.5-2 5-1 M2 14.5c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0s3.5-2 5-1 M2 20c2.5-2 5-2 7.5 0s5 2 7.5 0',
    chama: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6c0 2 1 3 2 3c0-4-1-6 1-9Z',
    folha: 'M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z M5 19l9-9',
    ciclo: 'M20 12a8 8 0 0 1-14.3 4.9 M4 12a8 8 0 0 1 14.3-4.9 M18.6 3v4.6H14 M5.4 21v-4.6H10',
    arvore: 'M12 22v-6 M12 16c-4 0-7-2.5-7-6a5 5 0 0 1 3-4.6A4 4 0 0 1 16 5.4a5 5 0 0 1 3 4.6c0 3.5-3 6-7 6Z',
    gema: 'M6 3h12l4 6-10 12L2 9Z M2 9h20 M9.5 3L12 21 M14.5 3L12 21',
    servidor: 'M4 3h16v7H4Z M4 14h16v7H4Z M7.5 6.5h3 M7.5 17.5h3 M16 6.5h.5 M16 17.5h.5',
    rede: 'M14 5a2 2 0 1 1-4 0a2 2 0 1 1 4 0Z M7 19a2 2 0 1 1-4 0a2 2 0 1 1 4 0Z M21 19a2 2 0 1 1-4 0a2 2 0 1 1 4 0Z M12 7v5 M12 12l-6.5 5.5 M12 12l6.5 5.5',
    raio: 'M13 2L4 14h7l-1 8 9-12h-7Z',
    casa: 'M3 11l9-8 9 8 M5 9.5V21h14V9.5 M10 21v-6h4v6',
    estrela: 'M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.6 6 21l1.3-6.8-5-4.7 6.8-.8Z',
    moeda: 'M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18Z M8 15.5c0-5 3-7.5 8-7.5c0 5-3 7.5-8 7.5Z M8 15.5l4-4',
    som: 'M4 9h4l5-4v14l-5-4H4Z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12',
    mudo: 'M4 9h4l5-4v14l-5-4H4Z M17 9.5l5 5 M22 9.5l-5 5',
    ajustes: 'M4 6h9 M17 6h3 M15 4v4 M4 12h3 M11 12h9 M9 10v4 M4 18h11 M19 18h1 M17 16v4',
    mapa: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3Z M9 3v15 M15 6v15',
    medalha: 'M7 2h4l1 5 1-5h4l-3 7 M12 22a6.5 6.5 0 1 0 0-13a6.5 6.5 0 1 0 0 13Z M12 12.5l1.2 2.3 2.5.3-1.8 1.7.5 2.5-2.4-1.3-2.4 1.3.5-2.5-1.8-1.7 2.5-.3Z',
    info: 'M12 22a10 10 0 1 0 0-20a10 10 0 1 0 0 20Z M12 11v6 M12 7.5h.01',
    martelo: 'M14 4l6 6-3 3-6-6Z M12.5 8.5L3 18l3 3 9.5-9.5',
    fechar: 'M5 5l14 14 M19 5L5 19',
    alvo: 'M12 22a10 10 0 1 0 0-20a10 10 0 1 0 0 20Z M12 17a5 5 0 1 0 0-10a5 5 0 1 0 0 10Z M12 12.5a.5.5 0 1 0 0-1',
    alerta: 'M12 3L2 21h20Z M12 10v5 M12 18h.01',
    fumaca: 'M6 20h12 M8 20v-6h8v6 M10 14V6h4v8 M14 4c2-2 5-1 5 1s-2 3-4 2',
    pessoa: 'M12 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8Z M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7',
    falar: 'M4 5h16v11H9l-5 4Z M8 9h8 M8 12h5',
    lupa: 'M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 1 0 0 13Z M15.5 15.5L21 21',
    tela: 'M3 4h18v12H3Z M8 20h8 M12 16v4',
    play: 'M7 4l13 8-13 8Z',
    pular: 'M5 5l9 7-9 7Z M17 5v14',
    certificado: 'M4 4h16v12H4Z M8 8h8 M8 11h5 M15 16l-1 6 3-2 3 2-1-6',
    mais: 'M12 5v14 M5 12h14',
    lua: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z M17 3v3 M15.5 4.5h3',
    entardecer: 'M2 18h20 M6 18a6 6 0 0 1 12 0 M12 6v3 M4.9 10.9l2.1 2.1 M19.1 10.9l-2.1 2.1 M5 21.5h14',
    nuclear: 'M12 13.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 1 0 0 3Z M12 10.5L9 5.3a7 7 0 0 0-3.9 6.7H11 M13 12h5.9A7 7 0 0 0 15 5.3L12 10.5 M12.9 13.3l3 5.2a7 7 0 0 1-7.8 0l3-5.2',
  };

  // ícone SVG inline para a interface
  ERS.svg = function (nome, cls, extra) {
    const d = ERS.ICONES[nome] || ERS.ICONES.info;
    return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}><path d="${d}"/></svg>`;
  };

  // desenha ícone no canvas (centro cx,cy; tamanho s)
  const pathCache = {};
  ERS.drawIcon = function (ctx, nome, cx, cy, s, cor, lw) {
    if (!pathCache[nome]) pathCache[nome] = new Path2D(ERS.ICONES[nome] || ERS.ICONES.info);
    ctx.save();
    ctx.translate(cx - s / 2, cy - s / 2);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = cor || '#fff';
    ctx.lineWidth = lw || 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(pathCache[nome]);
    ctx.restore();
  };

  // eventos simples
  ERS.bus = {
    h: {},
    on(n, f) { (this.h[n] = this.h[n] || []).push(f); },
    emit(n, d) { (this.h[n] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } }); },
  };
})();
