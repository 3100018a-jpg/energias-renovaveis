/* =========================================================
   Cenário: vegetação nativa, implementos (máquinas, galpões,
   silos, pivô, postos), barragem, lixão e aterro detalhados e
   os arranjos de energia limpa instalados em cada mapa.
   Mesmo estilo pintado à mão dos outros sprites.
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U;
  const SPR = ERS.SPR;
  const { P, poly, caixa, cilindro, telhado, janelasE, janelasD, painelSolar, placaIcone, chamine, sombra, bolha, copa, tronco, emissivo, def, VERDES, CONTORNO } = SPR.h;

  // ---------- utilitários de desenho ----------
  const piso = (c, x0, y0, x1, y1, cor, borda, z) => poly(c, [P(x0, y0, z || 0), P(x1, y0, z || 0), P(x1, y1, z || 0), P(x0, y1, z || 0)], cor, borda === undefined ? 'rgba(0,0,0,.18)' : borda);
  function linha(c, pts, cor, lw) {
    c.strokeStyle = cor; c.lineWidth = lw || 2; c.beginPath();
    pts.forEach((q, i) => { const p = P(q[0], q[1], q[2] || 0); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
    c.stroke();
  }
  function cano(c, pts, cor, lw) { linha(c, pts, U.shade(cor, -0.35), (lw || 3) + 1.4); linha(c, pts, cor, lw || 3); }
  function sub(c, r, nome, v, x, y, z, esc) {
    const d = SPR.defs[nome];
    if (!d) return;
    const p = P(x || 0, y || 0, z || 0);
    c.save(); c.translate(p[0], p[1]); if (esc) c.scale(esc, esc);
    d.desenho(c, r, v || 0);
    c.restore();
  }
  // roda vista de lado: na face y = const (ao longo de x) ou x = const (ao longo de y)
  function roda(c, x, y, z, rr, aoLongoY, cor) {
    const p = P(x, y, z);
    c.fillStyle = '#1d1d20'; c.beginPath(); c.ellipse(p[0], p[1], rr * 0.82, rr, aoLongoY ? 0.46 : -0.46, 0, 7); c.fill();
    c.fillStyle = cor || '#c9c2b0'; c.beginPath(); c.ellipse(p[0], p[1], rr * 0.36, rr * 0.44, aoLongoY ? 0.46 : -0.46, 0, 7); c.fill();
  }
  // polígono de pontos em coordenadas de tile
  const polyT = (c, pts, cor, borda) => poly(c, pts.map((q) => P(q[0], q[1], q[2] || 0)), cor, borda);
  // elipse no chão (círculo em perspectiva) de raio rr (em tiles)
  function disco(c, cx, cy, rr, z, cor, borda) {
    const pts = [];
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; pts.push(P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z || 0)); }
    poly(c, pts, cor, borda === undefined ? false : borda);
  }
  // pessoa pequena (silhueta) para dar escala
  function pessoinha(c, x, y, cor, chapeu) {
    const p = P(x, y, 0);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(p[0], p[1], 2.4, 1, 0, 0, 7); c.fill();
    c.fillStyle = '#2a3a5a'; c.fillRect(p[0] - 1.1, p[1] - 4, 2.2, 4);
    c.fillStyle = cor || '#e0a020'; c.fillRect(p[0] - 1.6, p[1] - 8, 3.2, 4.4);
    c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(p[0], p[1] - 9.4, 1.5, 0, 7); c.fill();
    if (chapeu) { c.fillStyle = chapeu; c.beginPath(); c.arc(p[0], p[1] - 10, 1.7, Math.PI, 0); c.fill(); }
  }
  // carro estacionado (pequeno), ao longo de x (eixo 0) ou y (eixo 1)
  function carrinho(c, x, y, cor, eixo) {
    if (!eixo) { caixa(c, x - 0.17, y - 0.08, x + 0.17, y + 0.08, 0, 4, cor, { brilho: false }); caixa(c, x - 0.1, y - 0.07, x + 0.06, y + 0.07, 4, 7, '#5a7f9a', { brilho: false, semAO: true }); }
    else { caixa(c, x - 0.08, y - 0.17, x + 0.08, y + 0.17, 0, 4, cor, { brilho: false }); caixa(c, x - 0.07, y - 0.1, x + 0.07, y + 0.06, 4, 7, '#5a7f9a', { brilho: false, semAO: true }); }
  }
  // bateria em contêiner (armazenamento de energia)
  function containerBateria(c, x0, y0, x1, y1, z) {
    caixa(c, x0, y0, x1, y1, z || 0, (z || 0) + 13, '#e8eef2');
    const n = 4;
    for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * (i + 0.2) / n, b = x0 + (x1 - x0) * (i + 0.8) / n; poly(c, [P(a, y1, (z || 0) + 3), P(b, y1, (z || 0) + 3), P(b, y1, (z || 0) + 10), P(a, y1, (z || 0) + 10)], '#c6d0d8', 'rgba(0,0,0,.25)', 0.5); }
    const p = P((x0 + x1) / 2, y1, (z || 0) + 7);
    c.fillStyle = '#2fbf6a'; c.fillRect(p[0] - 1.2, p[1] - 2.5, 2.4, 5); emissivo([[p[0] - 1.2, p[1] - 2.5], [p[0] + 1.2, p[1] - 2.5], [p[0] + 1.2, p[1] + 2.5], [p[0] - 1.2, p[1] + 2.5]], '#7dffb0');
  }
  // painel solar sobre estrutura elevada (cobertura de estacionamento)
  function coberturaSolar(c, x0, y0, x1, y1, z) {
    [[x0 + 0.05, y1 - 0.05], [x1 - 0.05, y1 - 0.05], [x0 + 0.05, y0 + 0.05], [x1 - 0.05, y0 + 0.05]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], z]], '#8a9098', 1.6));
    painelSolar(c, x0, y0, x1 - x0, y1 - y0, z, 6);
  }
  // carregador de veículo elétrico
  function carregador(c, x, y) {
    caixa(c, x - 0.04, y - 0.04, x + 0.04, y + 0.04, 0, 9, '#f2f4f6');
    const p = P(x + 0.04, y, 7);
    c.fillStyle = '#2fbf6a'; c.fillRect(p[0] - 1, p[1] - 1.5, 2, 3);
    emissivo([[p[0] - 1, p[1] - 1.5], [p[0] + 1, p[1] - 1.5], [p[0] + 1, p[1] + 1.5], [p[0] - 1, p[1] + 1.5]], '#8dffc0');
  }
  // pequena turbina eólica (rotor desenhado pelo motor, a partir do campo "rotor")
  function torreEolicaPequena(c, x, y, h) {
    const b = P(x, y, 0);
    c.beginPath(); c.moveTo(b[0] - 2.4, b[1]); c.lineTo(b[0] - 1, b[1] - h); c.lineTo(b[0] + 1, b[1] - h); c.lineTo(b[0] + 2.4, b[1]); c.closePath();
    c.fillStyle = '#eef2f6'; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#e2e6ea'; c.beginPath(); c.ellipse(b[0] + 1.5, b[1] - h - 1, 4.5, 2.4, -0.2, 0, 7); c.fill(); c.stroke();
  }

  // =========================================================
  // VEGETAÇÃO NATIVA E DETALHES DO CHÃO (âncora = base)
  // =========================================================
  def('capim', [-11, -18, 11, 4], (c, r, v) => {
    const cores = v === 3 ? ['#d9bf5a', '#c4a844', '#e8d27a'] : [['#6aa83a', '#86c04a', '#4f8f2f'], ['#7ab84a', '#9ccf5a', '#5a9a38'], ['#5e9e3a', '#7cb648', '#8fc85a']][v % 3];
    c.fillStyle = 'rgba(20,40,20,.18)'; c.beginPath(); c.ellipse(0, 0, 7, 2.6, 0, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) {
      const x0 = r.range(-4, 4), a = r.range(-0.9, 0.9), h = r.range(8, 15);
      c.strokeStyle = cores[i % 3]; c.lineWidth = r.range(0.7, 1.2);
      c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo(x0 + a * 3, -h * 0.6, x0 + a * 7, -h); c.stroke();
    }
    if (v === 3) { c.fillStyle = '#f4e6a8'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(r.range(-6, 6), r.range(-15, -9), 0.8, 1.6, 0, 0, 7); c.fill(); } }
  });
  def('junco', [-11, -24, 11, 4], (c, r, v) => {
    c.fillStyle = 'rgba(20,40,30,.2)'; c.beginPath(); c.ellipse(0, 0, 7, 2.6, 0, 0, 7); c.fill();
    for (let i = 0; i < 10; i++) {
      const x0 = r.range(-5, 5), a = r.range(-0.5, 0.5), h = r.range(10, 18);
      c.strokeStyle = ['#4f8a3a', '#6aa04a', '#3f7a32'][i % 3]; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo(x0 + a * 2, -h * 0.5, x0 + a * 5, -h); c.stroke();
    }
    // taboas: espigas marrons no alto das hastes
    for (let i = 0; i < 3 + (v % 2); i++) {
      const x0 = r.range(-4, 4), h = r.range(14, 20);
      c.strokeStyle = '#7a9a4a'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 0.5, -h); c.stroke();
      c.fillStyle = '#6a4326'; c.beginPath(); c.ellipse(x0 + 0.5, -h + 2.5, 1.3, 3, 0, 0, 7); c.fill();
    }
  });
  def('flores', [-11, -9, 11, 4], (c, r, v) => {
    const cs = [['#ffffff', '#ffe14a'], ['#ff7aa8', '#ffd23f'], ['#c38bff', '#ffffff'], ['#ffb03a', '#ff6a5a']][v % 4];
    for (let i = 0; i < 9; i++) {
      const x = r.range(-7, 7), y = r.range(-3, 2);
      c.strokeStyle = '#4f8f2f'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 3.5); c.stroke();
      c.fillStyle = cs[i % 2]; c.beginPath(); c.arc(x, y - 4, 1.3, 0, 7); c.fill();
    }
  });
  def('buriti', [-26, -78, 26, 8], (c, r, v) => {
    sombra(c, 0, 0, 13, 5, 0.28);
    // estipe alto e reto, com marcas das folhas antigas
    const g = c.createLinearGradient(-2.5, 0, 2.5, 0); g.addColorStop(0, '#9a7a52'); g.addColorStop(1, '#5e4630');
    c.fillStyle = g; c.beginPath(); c.moveTo(-2.6, 0); c.lineTo(-1.8, -56); c.lineTo(1.8, -56); c.lineTo(2.6, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(50,35,20,.45)'; c.lineWidth = 0.7;
    for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo(-2.4, -i * 4.6); c.lineTo(2.4, -i * 4.6 + 0.6); c.stroke(); }
    // folhas secas pendentes (saia) e copa em leque
    c.fillStyle = '#a07a3a'; c.beginPath(); c.moveTo(-5, -52); c.lineTo(5, -52); c.lineTo(3, -44); c.lineTo(-3, -44); c.closePath(); c.fill();
    const cx = 0, cy = -58;
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.95 + i * 0.11) + r.range(-0.05, 0.05), L = r.range(16, 22);
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.75 + 4;
      c.fillStyle = ['#3f8a3a', '#4f9e40', '#357a32'][i % 3];
      c.beginPath(); c.moveTo(cx, cy);
      c.lineTo(ex + Math.cos(a + 1.57) * 4, ey + Math.sin(a + 1.57) * 3);
      c.lineTo(ex + Math.cos(a) * 3, ey + Math.sin(a) * 2);
      c.lineTo(ex - Math.cos(a + 1.57) * 4, ey - Math.sin(a + 1.57) * 3);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,60,20,.5)'; c.lineWidth = 0.5;
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex + Math.cos(a + 1.57) * k * 3, ey + Math.sin(a + 1.57) * k * 2); c.stroke(); }
    }
    c.fillStyle = '#8a4a2a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(r.range(-3, 3), -52 + r.range(-2, 2), 1.4, 0, 7); c.fill(); }
  });
  // ipê florido: amarelo, rosa, branco ou roxo
  def('ipe', [-24, -60, 24, 8], (c, r, v) => {
    const flor = ['#f2c81e', '#e86aa6', '#f4f0e6', '#9a5ad0', '#f5b81a', '#ec7ab2'][v % 6];
    sombra(c, 0, 0, 15, 6, 0.24);
    tronco(c, 20, 2.2, '#6a4a32');
    c.strokeStyle = '#5a3a24'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -14); c.lineTo(-8, -24); c.moveTo(0, -16); c.lineTo(9, -26); c.stroke();
    copa(c, r, 0, -32, 15, 11, flor, 12);
    c.fillStyle = U.shade(flor, 0.35); for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(r.range(-12, 12), r.range(-40, -24), 1.2, 0, 7); c.fill(); }
    // flores caídas no chão
    c.fillStyle = flor; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(r.range(-12, 12), r.range(-2, 3), 1.2, 0.6, 0, 0, 7); c.fill(); }
  });
  // árvore do cerrado: tronco tortuoso, casca grossa e copa rala
  def('cerradoArvore', [-20, -42, 20, 6], (c, r, v) => {
    sombra(c, 0, 0, 12, 4.5, 0.24);
    c.strokeStyle = '#5a3e2a'; c.lineCap = 'round';
    c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -8, 1, -14); c.quadraticCurveTo(5, -18, 2, -22); c.stroke();
    c.lineWidth = 1.8; c.beginPath(); c.moveTo(1, -14); c.quadraticCurveTo(-6, -18, -9, -24); c.moveTo(2, -20); c.quadraticCurveTo(8, -22, 10, -28); c.stroke();
    c.strokeStyle = 'rgba(30,20,10,.4)'; c.lineWidth = 0.6; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-1.4, -i * 3 - 1); c.lineTo(1.4, -i * 3 - 2); c.stroke(); }
    const cor = ['#7a9a3a', '#6f8f34', '#8aa548', '#748f3e'][v % 4];
    [[-9, -27, 7, 4.5], [9, -30, 7, 4.5], [1, -31, 8, 5], [-2, -25, 6, 4]].forEach((b) => copa(c, r, b[0], b[1], b[2], b[3], cor, 5));
  });
  def('rochedo', [-22, -28, 22, 6], (c, r, v) => {
    sombra(c, 0, 0, 17, 5.5, 0.28);
    const base = v === 3 ? '#3e3a3c' : ['#9a958a', '#8c8579', '#a49c8c'][v % 3];
    const pedra = (x, y, w, h) => {
      c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * 0.8, y - h * 0.6); c.lineTo(x - w * 0.2, y - h); c.lineTo(x + w * 0.6, y - h * 0.8); c.lineTo(x + w, y - h * 0.2); c.lineTo(x + w * 0.7, y); c.closePath();
      const g = c.createLinearGradient(x - w, y - h, x + w, y); g.addColorStop(0, U.shade(base, 0.3)); g.addColorStop(1, U.shade(base, -0.32));
      c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(x - w * 0.8, y - h * 0.6); c.lineTo(x - w * 0.2, y - h); c.lineTo(x + w * 0.6, y - h * 0.8); c.stroke();
      c.strokeStyle = 'rgba(30,25,20,.35)'; c.beginPath(); c.moveTo(x - w * 0.1, y - h * 0.9); c.lineTo(x + w * 0.1, y - h * 0.3); c.stroke();
    };
    pedra(-6, 1, 10, 16); pedra(8, 2, 9, 12); pedra(1, 4, 6, 7);
    if (v !== 3) { c.fillStyle = 'rgba(160,190,90,.55)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(r.range(-12, 10), r.range(-12, -2), 1.3, 0, 7); c.fill(); } }
  });
  def('cupinzeiro', [-9, -20, 9, 4], (c, r, v) => {
    sombra(c, 0, 0, 7, 2.6, 0.3);
    const cor = ['#b0643a', '#a25a34', '#bf7446'][v % 3];
    c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-6, -8, -3, -12); c.quadraticCurveTo(-1, -18, 1, -17); c.quadraticCurveTo(4, -12, 5, -6); c.quadraticCurveTo(6, -2, 6, 0); c.closePath();
    const g = c.createLinearGradient(-6, -16, 6, 0); g.addColorStop(0, U.shade(cor, 0.25)); g.addColorStop(1, U.shade(cor, -0.3));
    c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.6; c.stroke();
    c.fillStyle = 'rgba(60,30,15,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(r.range(-4, 4), r.range(-12, -2), 0.7, 0, 7); c.fill(); }
  });
  // cerca de arame com mourões, ao longo de x (v = 0) ou de y (v = 1), centrada na âncora
  def('cerca', [-20, -20, 20, 12], (c, r, v) => {
    const a = v ? [0, -0.5] : [-0.5, 0], b = v ? [0, 0.5] : [0.5, 0];
    const pt = (u, z) => P(U.lerp(a[0], b[0], u), U.lerp(a[1], b[1], u), z);
    c.strokeStyle = 'rgba(70,64,58,.75)'; c.lineWidth = 0.5;
    [3.2, 5.6, 8].forEach((z) => { const p = pt(0, z), q = pt(1, z); c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 0.6, q[0], q[1]); c.stroke(); });
    for (let i = 0; i <= 3; i++) {
      const p = pt(i / 3, 0), q = pt(i / 3, 9.5);
      c.strokeStyle = '#6a4a2c'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
      c.strokeStyle = 'rgba(255,230,190,.35)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(p[0] - 0.5, p[1]); c.lineTo(q[0] - 0.5, q[1]); c.stroke();
    }
  });
  // cocho de sal (v = 0) ou bebedouro redondo (v = 1)
  def('cocho', [-15, -14, 15, 6], (c, r, v) => {
    sombra(c, 0, 0, 11, 4, 0.25);
    if (!v) {
      caixa(c, -0.28, -0.08, 0.28, 0.08, 0, 4, '#8a5a32', { brilho: false });
      polyT(c, [[-0.25, -0.05, 4], [0.25, -0.05, 4], [0.25, 0.05, 4], [-0.25, 0.05, 4]], '#e8e2d2', false);
      [[-0.2, 0.08], [0.2, 0.08]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], 4]], '#5a3a20', 1.2));
    } else {
      cilindro(c, 0, 0, 10, 0, 5, '#9aa4ac', { topo: '#4a9ad0', oco: '#3a8ac8' });
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.6; const p = P(0, 0, 5); c.beginPath(); c.ellipse(p[0] - 2, p[1], 3, 1.2, 0, Math.PI, 0); c.stroke();
    }
  });
  def('urubus', [-16, -14, 16, 4], (c, r, v) => {
    const urubu = (x, y, s) => {
      c.fillStyle = '#1e1e22'; c.beginPath(); c.ellipse(x, y - 4 * s, 3.2 * s, 2.4 * s, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(x - 3 * s, y - 4 * s); c.lineTo(x - 6 * s, y - 1 * s); c.lineTo(x - 1 * s, y - 2.5 * s); c.fill();
      c.fillStyle = '#5a5a60'; c.beginPath(); c.arc(x + 2.6 * s, y - 6.4 * s, 1.1 * s, 0, 7); c.fill();
      c.strokeStyle = '#3a3a3a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 1, y - 2); c.lineTo(x - 1, y); c.moveTo(x + 1, y - 2); c.lineTo(x + 1, y); c.stroke();
    };
    urubu(-7, 1, 1); urubu(3, 0, 1.1); if (v % 2) urubu(9, 2, 0.9);
  });

  // =========================================================
  // MÁQUINAS (âncora = chão, sem pegada)
  // =========================================================
  // trator agrícola: v = 0/1 ao longo de x (frente para +x / -x), v = 2/3 ao longo de y
  def('trator', [-28, -36, 28, 10], (c, r, v) => {
    sombra(c, 0, 0, 18, 7, 0.3);
    const cor = ['#2f8a3a', '#c8382a', '#2f6ad0', '#e8a21e'][v % 4];
    const aoY = v >= 2, s = v % 2 ? -1 : 1;
    const B = (a0, a1, b0, b1, z0, z1, k, op) => {
      const A0 = Math.min(a0 * s, a1 * s), A1 = Math.max(a0 * s, a1 * s);
      return aoY ? caixa(c, b0, A0, b1, A1, z0, z1, k, op) : caixa(c, A0, b0, A1, b1, z0, z1, k, op);
    };
    const R = (a, b, z, rr) => (aoY ? roda(c, b, a * s, z, rr, true, '#e8c23a') : roda(c, a * s, b, z, rr, false, '#e8c23a'));
    // rodas do lado de trás (escondido) primeiro
    R(-0.12, -0.11, 6, 6.5); R(0.16, -0.1, 3.4, 3.6);
    B(-0.2, 0.22, -0.07, 0.07, 3, 8, '#3a3a3a', { brilho: false });
    B(0.02, 0.24, -0.06, 0.06, 6, 11, cor);       // capô
    B(-0.2, 0.02, -0.08, 0.08, 6, 10, cor);       // corpo
    // cabine com vidros e teto
    B(-0.18, 0.0, -0.075, 0.075, 10, 19, '#9fd0ee', { brilho: false });
    B(-0.2, 0.02, -0.085, 0.085, 19, 21, '#f2f2f2');
    // escapamento
    const ex = aoY ? P(0.03, 0.14 * s, 11) : P(0.14 * s, -0.03, 11);
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ex[0], ex[1]); c.lineTo(ex[0], ex[1] - 10); c.stroke();
    R(-0.12, 0.11, 6, 6.5); R(0.16, 0.1, 3.4, 3.6);
  });
  // perfuratriz de mina: esteiras, cabine e mastro de perfuração
  def('perfuratriz', [-22, -64, 22, 8], (c, r, v) => {
    sombra(c, 0, 0, 16, 6, 0.3);
    caixa(c, -0.22, -0.12, 0.22, -0.05, 0, 4, '#2a2a2a', { brilho: false });
    caixa(c, -0.22, 0.05, 0.22, 0.12, 0, 4, '#2a2a2a', { brilho: false });
    caixa(c, -0.18, -0.1, 0.14, 0.1, 4, 11, v ? '#e8a21e' : '#f0c419');
    caixa(c, -0.16, 0.0, -0.02, 0.1, 11, 19, '#9fd0ee', { brilho: false });
    caixa(c, -0.17, -0.01, -0.01, 0.11, 19, 20.5, '#f2f2f2');
    // mastro inclinado com a haste de perfuração
    const a = P(0.14, 0, 8), b = P(0.06, 0, 58);
    c.strokeStyle = '#d99a10'; c.lineWidth = 4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = '#5a5a5a'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0] + 2, a[1]); c.lineTo(b[0] + 2, b[1]); c.stroke();
    for (let i = 1; i < 6; i++) { const z = 8 + i * 9; const p = P(0.14 - i * 0.014, 0, z); c.strokeStyle = '#a87a10'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(p[0] - 2.2, p[1]); c.lineTo(p[0] + 2.2, p[1] + 2); c.stroke(); }
    const pe = P(0.16, 0, 0); c.fillStyle = 'rgba(190,150,110,.6)'; c.beginPath(); c.ellipse(pe[0], pe[1], 5, 2, 0, 0, 7); c.fill();
  }, { fumaca: [[0.16, 0, 2, 'poeira']] });
  // trator de esteira (escavadeira de lâmina)
  def('tratorEsteira', [-26, -30, 26, 8], (c, r, v) => {
    sombra(c, 0, 0, 18, 6.5, 0.3);
    caixa(c, -0.24, -0.13, 0.18, -0.05, 0, 5, '#2a2a2a', { brilho: false });
    caixa(c, -0.24, 0.05, 0.18, 0.13, 0, 5, '#2a2a2a', { brilho: false });
    for (let i = 0; i < 5; i++) { const p = P(-0.2 + i * 0.09, 0.13, 2.5); c.fillStyle = '#555'; c.beginPath(); c.arc(p[0], p[1], 1.4, 0, 7); c.fill(); }
    caixa(c, -0.2, -0.1, 0.12, 0.1, 5, 12, '#f0b419');
    caixa(c, -0.2, -0.07, -0.04, 0.07, 12, 20, '#9fd0ee', { brilho: false });
    caixa(c, -0.21, -0.08, -0.03, 0.08, 20, 21.5, '#e8a21e');
    // lâmina frontal
    caixa(c, 0.22, -0.16, 0.26, 0.16, 0, 9, '#c88a10');
    linha(c, [[0.12, 0.08, 6], [0.22, 0.1, 4]], '#555', 1.5);
    linha(c, [[-0.2, 0, 6], [-0.3, 0, 1]], '#555', 1.6);
  });
  // caminhão-pipa: molha as vias para baixar a poeira
  def('caminhaoPipa', [-28, -28, 28, 8], (c, r, v) => {
    sombra(c, 0, 0, 20, 6.5, 0.3);
    caixa(c, -0.3, -0.08, 0.26, 0.08, 2, 4, '#333', { brilho: false });
    roda(c, -0.2, 0.08, 3, 3.2); roda(c, -0.06, 0.08, 3, 3.2); roda(c, 0.18, 0.08, 3, 3.2);
    caixa(c, 0.12, -0.09, 0.3, 0.09, 4, 14, '#2f7ad2');
    caixa(c, 0.27, -0.08, 0.3, 0.08, 8, 12.5, '#9fd0ee', { brilho: false, semAO: true });
    // tanque cilíndrico deitado
    const a = P(-0.3, 0, 9), b = P(0.08, 0, 9);
    c.strokeStyle = '#6f7a84'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = '#c9d2da'; c.lineWidth = 8.5; c.beginPath(); c.moveTo(a[0], a[1] - 0.5); c.lineTo(b[0], b[1] - 0.5); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0] + 1, a[1] - 3.5); c.lineTo(b[0] - 1, b[1] - 3.5); c.stroke();
    // jato d'água atrás
    const j = P(-0.34, 0, 3); c.fillStyle = 'rgba(170,220,255,.55)'; c.beginPath(); c.ellipse(j[0] - 6, j[1] + 2, 9, 3, -0.3, 0, 7); c.fill();
  });
  // compactador de aterro: rodas de aço com dentes
  def('compactador', [-24, -28, 24, 8], (c, r, v) => {
    sombra(c, 0, 0, 16, 6, 0.3);
    const rodaDentada = (x, y) => { const p = P(x, y, 5); c.fillStyle = '#4a4a4a'; c.beginPath(); c.ellipse(p[0], p[1], 5, 5.6, -0.46, 0, 7); c.fill(); c.fillStyle = '#8a8a8a'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; c.fillRect(p[0] + Math.cos(a) * 5 - 0.8, p[1] + Math.sin(a) * 5.6 - 0.8, 1.6, 1.6); } };
    rodaDentada(-0.14, -0.1); rodaDentada(0.14, -0.1);
    caixa(c, -0.18, -0.09, 0.18, 0.09, 4, 11, '#f0c419');
    caixa(c, -0.12, -0.06, 0.02, 0.06, 11, 19, '#9fd0ee', { brilho: false });
    caixa(c, -0.13, -0.07, 0.03, 0.07, 19, 20.5, '#e8a21e');
    caixa(c, 0.2, -0.13, 0.23, 0.13, 1, 8, '#c88a10');
    rodaDentada(-0.14, 0.1); rodaDentada(0.14, 0.1);
  });
  // correia transportadora ao longo de x (v = 0) ou y (v = 1), com minério sobre a lona
  def('correia', [-36, -26, 36, 20], (c, r, v) => {
    const a = v ? [0, -0.5] : [-0.5, 0], b = v ? [0, 0.5] : [0.5, 0];
    const pt = (u, z, off) => P(U.lerp(a[0], b[0], u) + (v ? off || 0 : 0), U.lerp(a[1], b[1], u) + (v ? 0 : off || 0), z);
    for (let i = 0; i <= 2; i++) { const p = pt(i / 2, 0), q = pt(i / 2, 12); c.strokeStyle = '#7a7f88'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    const lona = [pt(0, 12, -0.07), pt(1, 12, -0.07), pt(1, 12, 0.07), pt(0, 12, 0.07)];
    poly(c, lona, '#2a2c30', 'rgba(0,0,0,.4)');
    c.fillStyle = '#8a5a3a';
    for (let i = 0; i < 9; i++) { const p = pt(0.05 + i * 0.11, 13.2, r.range(-0.03, 0.03)); c.beginPath(); c.ellipse(p[0], p[1], 2.2, 1.1, 0, 0, 7); c.fill(); }
    // cobertura em meia-lua (protege da chuva e do pó)
    c.strokeStyle = 'rgba(200,205,210,.8)'; c.lineWidth = 0.8;
    for (let i = 0; i <= 4; i++) { const p = pt(i / 4, 12, -0.08), q = pt(i / 4, 12, 0.08), t = pt(i / 4, 18, 0); c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(t[0], t[1] - 3, q[0], q[1]); c.stroke(); }
  });
  def('canoa', [-18, -12, 18, 6], (c, r, v) => {
    c.fillStyle = 'rgba(0,30,60,.25)'; c.beginPath(); c.ellipse(0, 1, 15, 3.5, 0, 0, 7); c.fill();
    c.fillStyle = v % 2 ? '#c8463a' : '#7a4a2a';
    c.beginPath(); c.moveTo(-15, -2); c.quadraticCurveTo(0, 5, 15, -3); c.lineTo(13, -6); c.quadraticCurveTo(0, -1, -13, -5); c.closePath(); c.fill();
    c.strokeStyle = CONTORNO; c.lineWidth = 0.6; c.stroke();
    c.fillStyle = '#e8d8b0'; c.fillRect(-3, -5.5, 6, 1.4);
    if (v % 3 === 0) pessoinha(c, 0.05, 0, '#2f7ad2', '#e8c86a');
  });
  // carreta levando uma pá de aerogerador (escala: as pás passam de 60 m)
  def('carretaPa', [-52, -24, 52, 22], (c, r, v) => {
    sombra(c, 0, 0, 36, 9, 0.28);
    caixa(c, -0.62, -0.06, 0.4, 0.06, 2, 4, '#3a3a3a', { brilho: false });
    [-0.5, -0.4, -0.3, 0.2].forEach((x) => roda(c, x, 0.06, 2.6, 2.8));
    caixa(c, 0.4, -0.09, 0.62, 0.09, 2, 13, '#d23b2f');
    caixa(c, 0.59, -0.08, 0.62, 0.08, 7, 11.5, '#9fd0ee', { brilho: false, semAO: true });
    roda(c, 0.52, 0.09, 3, 3.2);
    // pá branca, larga na raiz e fina na ponta
    const a = P(-0.95, 0, 9), b = P(0.36, 0, 10), m1 = P(-0.2, 0.02, 12);
    c.fillStyle = '#f6f8fa'; c.beginPath(); c.moveTo(b[0], b[1] - 4); c.quadraticCurveTo(m1[0], m1[1] - 8, a[0], a[1] - 1); c.lineTo(a[0], a[1] + 1); c.quadraticCurveTo(m1[0], m1[1] + 1, b[0], b[1] + 3); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,50,70,.45)'; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#d6dbe0'; c.beginPath(); c.ellipse(b[0], b[1] - 0.5, 2.5, 4, 0, 0, 7); c.fill();
    c.fillStyle = '#ff6a1a'; c.fillRect(a[0] - 1, a[1] - 2, 2, 3);
  });

  // =========================================================
  // CONSTRUÇÕES RURAIS E URBANAS (âncora = canto superior da pegada)
  // =========================================================
  // pivô central de irrigação sobre lavoura circular (3 × 3)
  def('pivoCentral', [-100, -36, 100, 100], (c, r, v) => {
    const C = 1.5, R = 1.42;
    disco(c, C, C, R + 0.04, 0, 'rgba(90,70,40,.35)');
    // setores em fases diferentes: plantio recente, verde, maduro e colhido
    const setores = [['#7cbf3a', '#6aa830'], ['#a8c84a', '#8fb03a'], ['#d8c26a', '#c4ac52'], ['#b88a5a', '#a07448']];
    for (let s = 0; s < 4; s++) {
      const a0 = s * Math.PI / 2 + 0.3, a1 = a0 + Math.PI / 2;
      const pts = [P(C, C, 0)];
      for (let i = 0; i <= 10; i++) { const a = U.lerp(a0, a1, i / 10); pts.push(P(C + Math.cos(a) * R, C + Math.sin(a) * R, 0)); }
      poly(c, pts, setores[s][0], false);
      // linhas de plantio em círculos concêntricos
      c.strokeStyle = setores[s][1]; c.lineWidth = 0.8;
      for (let k = 1; k < 9; k++) { c.beginPath(); for (let i = 0; i <= 10; i++) { const a = U.lerp(a0, a1, i / 10), p = P(C + Math.cos(a) * R * k / 9, C + Math.sin(a) * R * k / 9, 0); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
    }
    // trilhas das rodas das torres
    c.strokeStyle = 'rgba(120,90,50,.55)'; c.lineWidth = 1;
    [0.36, 0.72, 1.08].forEach((k) => { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(P(C + Math.cos(a) * k, C + Math.sin(a) * k, 0)); } c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); });
    // torre central
    caixa(c, C - 0.08, C - 0.08, C + 0.08, C + 0.08, 0, 14, '#9aa4ac');
    // braço com treliça e torres móveis
    const ang = 0.55 + (v || 0) * 0.8;
    const ponta = (k, z) => [C + Math.cos(ang) * k, C + Math.sin(ang) * k, z];
    [0.36, 0.72, 1.08, R].forEach((k) => {
      const b = ponta(k, 0);
      linha(c, [[b[0] - 0.05, b[1] + 0.05, 0], [b[0], b[1], 11], [b[0] + 0.05, b[1] - 0.05, 0]], '#b8c0c8', 1.2);
      const p = P(b[0], b[1], 1.6); c.fillStyle = '#2a2a2a'; c.beginPath(); c.ellipse(p[0], p[1], 1.8, 2, 0, 0, 7); c.fill();
    });
    linha(c, [ponta(0, 13), ponta(R, 11)], '#dfe5ea', 2.2);
    for (let i = 0; i < 12; i++) { const k0 = i / 12 * R, k1 = (i + 0.5) / 12 * R; linha(c, [ponta(k0, 12.5), ponta(k1, 9), ponta(k0 + R / 12, 12.4)], 'rgba(170,180,190,.9)', 0.6); }
    // gotejadores (borrifos d'água)
    c.fillStyle = 'rgba(170,220,255,.65)';
    for (let i = 1; i < 14; i++) { const p = P(...ponta(i / 14 * R, 7)); c.beginPath(); c.ellipse(p[0], p[1] + 3, 2, 3.5, 0, 0, 7); c.fill(); }
  });
  def('silos', [-34, -92, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.28);
    piso(c, 0.05, 0.05, 0.95, 0.95, '#b8b2a6');
    const silo = (x, y, rr, h) => {
      cilindro(c, x, y, rr, 0, h, '#d6dce2', { faixas: [[0.2, 0.22, '#9aa4ac'], [0.45, 0.47, '#9aa4ac'], [0.7, 0.72, '#9aa4ac']], semTopo: true });
      const t = P(x, y, h), a = P(x, y, h + rr * 0.9);
      c.beginPath(); c.moveTo(t[0] - rr, t[1]); c.lineTo(a[0], a[1]); c.lineTo(t[0] + rr, t[1]); c.ellipse(t[0], t[1], rr, rr / 2, 0, 0, Math.PI, false); c.closePath();
      const g = c.createLinearGradient(t[0] - rr, 0, t[0] + rr, 0); g.addColorStop(0, '#eef2f4'); g.addColorStop(1, '#9aa4ac');
      c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
    };
    silo(0.32, 0.32, 11, 46); silo(0.7, 0.42, 10, 40); silo(0.42, 0.74, 9, 34);
    // elevador de grãos e calhas
    caixa(c, 0.78, 0.74, 0.88, 0.84, 0, 66, '#c8463a');
    linha(c, [[0.83, 0.79, 64], [0.36, 0.36, 56]], '#9aa4ac', 1.6);
    linha(c, [[0.83, 0.79, 62], [0.7, 0.44, 50]], '#9aa4ac', 1.6);
  });
  def('galpaoRural', [-34, -50, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    piso(c, 0.12, 0.14, 0.88, 0.88, '#b8a888');
    // fardos de feno e um trator guardados
    [[0.3, 0.32], [0.3, 0.5], [0.45, 0.32]].forEach((q) => cilindro(c, q[0], q[1], 5, 0, 8, '#e0c36a', { topo: '#c9a84a' }));
    if (v % 2) sub(c, r, 'trator', 0, 0.6, 0.62, 0, 0.9);
    else { caixa(c, 0.55, 0.5, 0.82, 0.8, 0, 9, '#8a6a4a'); }
    // pilares e telhado de zinco
    [[0.14, 0.86], [0.86, 0.86], [0.86, 0.16], [0.5, 0.86]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], 20]], '#6a4a2c', 1.8));
    telhado(c, 0.12, 0.14, 0.88, 0.88, 20, 9, '#9aa4ac', 1, '#7a848c');
  });
  def('caixaDagua', [-24, -96, 24, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 18, 8, 0.25);
    [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]].forEach((q) => linha(c, [[q[0], q[1], 0], [0.5 + (q[0] - 0.5) * 0.6, 0.5 + (q[1] - 0.5) * 0.6, 54]], '#8a9098', 2));
    linha(c, [[0.32, 0.68, 18], [0.68, 0.68, 18], [0.68, 0.32, 18]], '#8a9098', 1);
    linha(c, [[0.32, 0.68, 36], [0.68, 0.68, 36], [0.68, 0.32, 36]], '#8a9098', 1);
    cilindro(c, 0.5, 0.5, 15, 54, 74, '#e8eef2', { faixas: [[0.4, 0.5, '#2f7ad2']] });
    const t = P(0.5, 0.5, 74), a = P(0.5, 0.5, 80);
    c.fillStyle = '#c9d2da'; c.beginPath(); c.moveTo(t[0] - 15, t[1]); c.lineTo(a[0], a[1]); c.lineTo(t[0] + 15, t[1]); c.ellipse(t[0], t[1], 15, 7.5, 0, 0, Math.PI, false); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    cano(c, [[0.55, 0.55, 54], [0.55, 0.55, 0]], '#9aa4ac', 1.6);
  });
  def('curral', [-34, -30, 34, 34], (c, r, v) => {
    piso(c, 0.08, 0.08, 0.92, 0.92, '#b89a6a', 'rgba(0,0,0,.12)');
    c.fillStyle = 'rgba(120,90,50,.35)'; for (let i = 0; i < 10; i++) { const p = P(r.range(0.15, 0.85), r.range(0.15, 0.85), 0); c.beginPath(); c.ellipse(p[0], p[1], 2, 1, 0, 0, 7); c.fill(); }
    sub(c, r, 'vaca', 1, 0.4, 0.45, 0); sub(c, r, 'vaca', 0, 0.62, 0.6, 0);
    sub(c, r, 'cocho', 0, 0.75, 0.3, 0);
    // cerca de tábuas
    const lados = [[[0.08, 0.08], [0.92, 0.08]], [[0.08, 0.08], [0.08, 0.92]], [[0.08, 0.92], [0.55, 0.92]], [[0.92, 0.08], [0.92, 0.92]]];
    lados.forEach((l) => {
      [4, 8].forEach((z) => linha(c, [[l[0][0], l[0][1], z], [l[1][0], l[1][1], z]], '#8a6a42', 1.6));
      for (let i = 0; i <= 4; i++) { const x = U.lerp(l[0][0], l[1][0], i / 4), y = U.lerp(l[0][1], l[1][1], i / 4); linha(c, [[x, y, 0], [x, y, 10]], '#5a3a20', 1.6); }
    });
    // porteira aberta
    linha(c, [[0.92, 0.92, 4], [0.98, 1.1, 4]], '#a07a4a', 1.4); linha(c, [[0.92, 0.92, 8], [0.98, 1.1, 8]], '#a07a4a', 1.4);
  });
  // posto de combustível com cobertura solar e eletroposto
  def('posto', [-34, -52, 34, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    piso(c, 0.02, 0.02, 0.98, 0.98, '#c9c4ba');
    caixa(c, 0.08, 0.08, 0.4, 0.36, 0, 16, '#f4f1ea');
    janelasE(c, 0.08, 0.4, 0.36, 3, 13, 1, 2, '#7fc4ef');
    // bombas e carregador
    [[0.52, 0.58], [0.74, 0.58]].forEach((q) => caixa(c, q[0] - 0.04, q[1] - 0.04, q[0] + 0.04, q[1] + 0.04, 0, 8, '#e04a3a'));
    carregador(c, 0.66, 0.84);
    carrinho(c, 0.62, 0.72, '#2f7ad2', 1);
    // pilares e cobertura com painéis
    [[0.46, 0.46], [0.9, 0.46], [0.46, 0.92], [0.9, 0.92]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], 22]], '#d8dde2', 2));
    caixa(c, 0.42, 0.42, 0.94, 0.96, 22, 25, '#2fa05a');
    painelSolar(c, 0.45, 0.46, 0.46, 0.46, 25, 3);
    const p = P(0.94, 0.7, 23.5); c.fillStyle = '#fff'; c.fillRect(p[0] - 1, p[1] - 1, 2, 2);
  });
  def('torreCelular', [-22, -132, 22, 34], (c, r, v) => {
    sombra(c, 0.5, 0.5, 14, 7, 0.25);
    caixa(c, 0.62, 0.58, 0.9, 0.86, 0, 10, '#d8d4cc');
    const base = [[0.38, 0.38], [0.62, 0.38], [0.62, 0.62], [0.38, 0.62]], topo = [0.5, 0.5];
    base.forEach((q) => linha(c, [[q[0], q[1], 0], [U.lerp(q[0], topo[0], 0.8), U.lerp(q[1], topo[1], 0.8), 104]], '#c8382a', 1.4));
    for (let z = 8; z < 100; z += 12) {
      const k = z / 130;
      const pts = base.map((q) => [U.lerp(q[0], topo[0], k), U.lerp(q[1], topo[1], k), z]);
      linha(c, [pts[3], pts[0], pts[1]], z % 24 < 12 ? '#f2f2f2' : '#c8382a', 0.8);
      linha(c, [pts[3], [pts[0][0], pts[0][1], z + 12]], 'rgba(200,60,40,.7)', 0.6);
    }
    // antenas e luz de sinalização
    [[-6, 92], [6, 96], [-2, 100]].forEach((a) => { const p = P(0.5, 0.5, a[1]); c.fillStyle = '#eef0f2'; c.fillRect(p[0] + a[0] - 1.5, p[1] - 6, 3, 9); });
    const l = P(0.5, 0.5, 110); c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(l[0], l[1], 1.6, 0, 7); c.fill();
    emissivo([[l[0] - 2, l[1] - 2], [l[0] + 2, l[1] - 2], [l[0] + 2, l[1] + 2], [l[0] - 2, l[1] + 2]], '#ff5a3a');
  });
  def('pontoOnibus', [-16, -28, 16, 6], (c, r, v) => {
    sombra(c, 0, 0, 12, 4, 0.22);
    caixa(c, -0.22, -0.08, 0.22, 0.02, 0, 3, '#8a6a4a', { brilho: false });
    linha(c, [[-0.2, -0.08, 0], [-0.2, -0.08, 14]], '#8a9098', 1.2); linha(c, [[0.2, -0.08, 0], [0.2, -0.08, 14]], '#8a9098', 1.2);
    polyT(c, [[-0.2, -0.09, 3], [0.2, -0.09, 3], [0.2, -0.09, 13], [-0.2, -0.09, 13]], 'rgba(170,215,240,.55)', 'rgba(255,255,255,.6)');
    caixa(c, -0.26, -0.14, 0.26, 0.1, 14, 16, '#2f7ad2');
    linha(c, [[0.3, 0.04, 0], [0.3, 0.04, 18]], '#8a9098', 1); const p = P(0.3, 0.04, 19); c.fillStyle = '#2f7ad2'; c.beginPath(); c.arc(p[0], p[1], 3, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(p[0] - 1.5, p[1] - 1, 3, 2);
  });

  // =========================================================
  // BARRAGEM, LIXÃO E ATERRO SANITÁRIO (substituem os desenhos simples)
  // =========================================================
  // segmento de barragem de concreto ao longo de x: lago atrás (y menor), rio à frente.
  // v = 0 trecho comum, v = 2 vertedouro com comportas, v = 4 tomada d'água com condutos forçados
  def('barragem', [-40, -76, 40, 64], (c, r, v) => {
    const k = { topo: '#e9e5dc', esq: '#cfcabf', dir: '#aaa498' };
    // paramento de montante (lado do lago), com a marca da linha d'água
    caixa(c, 0, 0.2, 1, 0.42, -10, 30, k, { semAO: true });
    polyT(c, [[0, 0.2, -10], [1, 0.2, -10], [1, 0.2, -4], [0, 0.2, -4]], 'rgba(60,80,70,.35)', false);
    // corpo com paramento de jusante inclinado (barragem de gravidade)
    const corpo = [[0, 0.42, 30], [1, 0.42, 30], [1, 1.08, -14], [0, 1.08, -14]];
    polyT(c, corpo, v === 2 ? '#d9d4ca' : '#c9c4b9', CONTORNO);
    // juntas verticais entre blocos e galerias de drenagem
    c.strokeStyle = 'rgba(70,66,60,.35)'; c.lineWidth = 0.6;
    for (let i = 1; i < 3; i++) { const x = i / 3; linha(c, [[x, 0.42, 30], [x, 1.08, -14]], 'rgba(70,66,60,.3)', 0.6); }
    [0.62, 0.84].forEach((y) => { const z = U.lerp(30, -14, (y - 0.42) / 0.66); linha(c, [[0, y, z], [1, y, z]], 'rgba(90,86,80,.35)', 0.7); });
    // crista: pista com mureta dos dois lados e postes de luz
    caixa(c, 0, 0.2, 1, 0.46, 30, 32, '#bdb8ae', { brilho: false, semAO: true });
    polyT(c, [[0, 0.26, 32], [1, 0.26, 32], [1, 0.4, 32], [0, 0.4, 32]], '#6a6f78', false);
    c.setLineDash([2.5, 2.5]); linha(c, [[0, 0.33, 32.2], [1, 0.33, 32.2]], 'rgba(255,214,90,.9)', 0.7); c.setLineDash([]);
    linha(c, [[0, 0.22, 34], [1, 0.22, 34]], '#8a9098', 1); linha(c, [[0, 0.44, 34], [1, 0.44, 34]], '#8a9098', 1);
    if (v !== 2) {
      const p = P(0.5, 0.44, 32), q = P(0.5, 0.44, 44);
      c.strokeStyle = '#6a7078'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
      c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(q[0] + 1.5, q[1], 1.4, 0, 7); c.fill();
      emissivo([[q[0], q[1] - 1.5], [q[0] + 3, q[1] - 1.5], [q[0] + 3, q[1] + 1.5], [q[0], q[1] + 1.5]], '#fff0b0');
    }
    if (v === 2) {
      // vertedouro: pilares, comportas de segmento e a água descendo em degraus
      [0.05, 0.36, 0.67, 0.95].forEach((x) => caixa(c, x - 0.04, 0.16, x + 0.04, 0.5, 26, 44, '#d8d3c8'));
      caixa(c, 0, 0.16, 1, 0.3, 44, 47, '#9aa4ac');
      [[0.09, 0.32], [0.4, 0.63], [0.71, 0.91]].forEach((g) => polyT(c, [[g[0], 0.24, 30], [g[1], 0.24, 30], [g[1], 0.24, 40], [g[0], 0.24, 40]], '#5a7a9a', 'rgba(0,0,0,.4)'));
      const g = c.createLinearGradient(0, P(0, 0.42, 30)[1], 0, P(0, 1.1, -14)[1]);
      g.addColorStop(0, 'rgba(225,245,255,.95)'); g.addColorStop(0.6, 'rgba(255,255,255,.98)'); g.addColorStop(1, 'rgba(200,235,255,.8)');
      polyT(c, [[0.08, 0.42, 30], [0.92, 0.42, 30], [0.95, 1.1, -14], [0.05, 1.1, -14]], g, false);
      c.strokeStyle = 'rgba(120,180,220,.55)'; c.lineWidth = 0.8;
      for (let i = 0; i < 7; i++) { const y = 0.48 + i * 0.09, z = U.lerp(30, -14, (y - 0.42) / 0.66); linha(c, [[0.08, y, z], [0.92, y, z]], 'rgba(130,190,230,.55)', 0.8); }
      // espuma na bacia de dissipação
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 9; i++) { const p = P(r.range(0.05, 0.95), r.range(1.05, 1.25), -14); c.beginPath(); c.arc(p[0], p[1], r.range(2, 4), 0, 7); c.fill(); }
    }
    if (v === 4) {
      // tomada d'água: torre no lago com grades e pórtico
      caixa(c, 0.3, -0.12, 0.7, 0.2, -10, 50, '#d8d3c8');
      janelasE(c, 0.3, 0.7, 0.2, 34, 46, 1, 3, '#6a8aa8');
      caixa(c, 0.26, -0.16, 0.74, 0.24, 50, 53, '#8a9098');
      linha(c, [[0.3, 0.02, 53], [0.3, 0.02, 60], [0.7, 0.02, 60], [0.7, 0.02, 53]], '#e0a020', 1.4);
      // condutos forçados descendo o paramento até a casa de força
      [0.36, 0.64].forEach((x) => { cano(c, [[x, 0.46, 26], [x, 1.08, -12]], '#3f6a50', 3.2); });
    }
  });
  // lixão a céu aberto: montes de lixo, chorume, fumaça, urubus e catadores
  def('lixao', [-72, -58, 72, 72], (c, r) => {
    const p = P(1, 1, 0);
    c.fillStyle = '#7a6a4a'; c.beginPath(); c.ellipse(p[0], p[1] + 2, 62, 30, 0, 0, 7); c.fill();
    // córrego de chorume escorrendo para fora
    c.fillStyle = 'rgba(52,38,20,.75)'; c.beginPath(); c.moveTo(p[0] + 22, p[1] + 14); c.quadraticCurveTo(p[0] + 40, p[1] + 26, p[0] + 62, p[1] + 34); c.lineTo(p[0] + 60, p[1] + 38); c.quadraticCurveTo(p[0] + 34, p[1] + 30, p[0] + 18, p[1] + 18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(40,30,15,.6)'; c.beginPath(); c.ellipse(p[0] + 28, p[1] + 18, 16, 6, 0, 0, 7); c.fill();
    const cs = ['#e04a3a', '#3a8ae0', '#f0c419', '#ffffff', '#4fae3f', '#8a5bd0', '#2a2a2a', '#c9b48a'];
    const monte = (mx, my, rx, ry, h) => {
      c.fillStyle = '#9b8a6a'; c.beginPath(); c.moveTo(mx - rx, my); c.quadraticCurveTo(mx - rx * 0.5, my - h, mx, my - h); c.quadraticCurveTo(mx + rx * 0.6, my - h * 0.9, mx + rx, my); c.ellipse(mx, my, rx, ry, 0, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.stroke();
      for (let i = 0; i < 70; i++) {
        const a = r() * Math.PI, d = Math.sqrt(r());
        const x = mx + Math.cos(a) * rx * d * (r() < 0.5 ? -1 : 1), y = my - Math.sin(a) * h * (1 - d * 0.7) + r.range(-2, ry * 0.6);
        c.fillStyle = cs[i % cs.length];
        if (i % 4 === 0) { c.beginPath(); c.ellipse(x, y, r.range(1.5, 3), r.range(1, 2), r() * 3, 0, 7); c.fill(); } else c.fillRect(x, y, r.range(1.5, 3.5), r.range(1, 2.4));
      }
    };
    monte(p[0] - 22, p[1] - 4, 26, 10, 24); monte(p[0] + 16, p[1] - 10, 22, 9, 18); monte(p[0] - 2, p[1] + 12, 24, 9, 14);
    // barraco de lona dos catadores e sacos de recicláveis
    caixa(c, 1.55, 0.25, 1.85, 0.6, 0, 12, '#c9b48a');
    polyT(c, [[1.5, 0.2, 12], [1.9, 0.2, 12], [1.9, 0.65, 14], [1.5, 0.65, 14]], '#3a6ad0', CONTORNO);
    [[1.4, 0.75], [1.5, 0.85], [1.62, 0.78]].forEach((q) => { const b = P(q[0], q[1], 0); c.fillStyle = '#f2f2ee'; c.beginPath(); c.ellipse(b[0], b[1] - 4, 5, 5, 0, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke(); });
    pessoinha(c, 1.3, 0.62, '#e0602a', '#e8c86a'); pessoinha(c, 0.55, 1.5, '#3a8ae0');
    // urubus empoleirados e voando
    sub(c, r, 'urubus', 0, 0.6, 0.7, 20); sub(c, r, 'urubus', 1, 1.2, 0.8, 16);
    c.strokeStyle = '#1e1e22'; c.lineWidth = 1.2;
    [[p[0] - 30, p[1] - 44], [p[0] + 10, p[1] - 52], [p[0] + 34, p[1] - 40]].forEach((b) => { c.beginPath(); c.moveTo(b[0] - 6, b[1]); c.quadraticCurveTo(b[0] - 2, b[1] - 3, b[0], b[1]); c.quadraticCurveTo(b[0] + 2, b[1] - 3, b[0] + 6, b[1]); c.stroke(); });
  }, { fumaca: [[0.8, 1.0, 18, 'escura'], [1.3, 1.2, 10, 'escura']] });
  // aterro sanitário: células cobertas com grama, célula em operação com manta,
  // drenos de biogás com queimador, lagoa de chorume revestida e canaletas
  def('aterro', [-72, -62, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9b09a', 'rgba(0,0,0,.15)');
    // canaleta de drenagem de águas da chuva em volta
    linha(c, [[0.1, 1.9, 0.5], [1.9, 1.9, 0.5], [1.9, 0.1, 0.5]], '#9aa4ac', 2.2);
    // lagoa de chorume revestida com manta preta
    piso(c, 1.36, 1.36, 1.86, 1.86, '#1e1e20', 'rgba(0,0,0,.4)');
    piso(c, 1.42, 1.42, 1.8, 1.8, '#5a4a2a', false);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.6; for (let i = 0; i < 3; i++) linha(c, [[1.48, 1.5 + i * 0.1, 0.2], [1.72, 1.5 + i * 0.1, 0.2]], 'rgba(255,255,255,.18)', 0.6);
    // patamares do maciço (camadas de lixo compactado e cobertas com terra e grama)
    const patamar = (x0, y0, x1, y1, z0, z1, topo, lado) => {
      polyT(c, [[x0, y1, z0], [x1, y1, z0], [x1 - 0.08, y1 - 0.08, z1], [x0 + 0.08, y1 - 0.08, z1]], lado, CONTORNO);
      polyT(c, [[x1, y0, z0], [x1, y1, z0], [x1 - 0.08, y1 - 0.08, z1], [x1 - 0.08, y0 + 0.08, z1]], U.shade(lado, -0.15), CONTORNO);
      polyT(c, [[x0 + 0.08, y0 + 0.08, z1], [x1 - 0.08, y0 + 0.08, z1], [x1 - 0.08, y1 - 0.08, z1], [x0 + 0.08, y1 - 0.08, z1]], topo, CONTORNO);
    };
    patamar(0.1, 0.1, 1.3, 1.3, 0, 10, '#86b05a', '#7a9a4a');
    patamar(0.22, 0.22, 1.16, 1.16, 10, 19, '#8fbb62', '#7a9a4a');
    // célula em operação: manta impermeável na borda e lixo sendo coberto
    polyT(c, [[1.02, 0.18, 0], [1.3, 0.18, 0], [1.3, 1.3, 0], [1.02, 1.3, 0]], '#2a2a2c', false);
    const cs = ['#e04a3a', '#3a8ae0', '#f0c419', '#ffffff', '#8a7a5a'];
    for (let i = 0; i < 40; i++) { const q = P(r.range(1.06, 1.27), r.range(0.24, 1.24), 1); c.fillStyle = cs[i % cs.length]; c.fillRect(q[0], q[1], 2.2, 1.4); }
    sub(c, r, 'compactador', 0, 1.18, 0.7, 0, 0.8);
    // drenos verticais de gás (brita e tubo) com queimadores
    [[0.45, 0.45], [0.8, 0.45], [0.45, 0.82], [0.8, 0.82], [0.62, 0.64]].forEach((q, i) => {
      const z = 19;
      cilindro(c, q[0], q[1], 3, z, z + 9, '#c0c6cc', { topo: '#8a9098' });
      if (i % 2 === 0) { const f = P(q[0], q[1], z + 11); c.fillStyle = 'rgba(255,170,60,.9)'; c.beginPath(); c.ellipse(f[0], f[1], 1.8, 3, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,240,150,.9)'; c.beginPath(); c.ellipse(f[0], f[1] + 0.8, 0.8, 1.6, 0, 0, 7); c.fill(); }
    });
    cano(c, [[0.45, 0.82, 19], [0.62, 0.64, 19], [0.8, 0.45, 19]], '#e0a020', 1.2);
    // cerca e portaria com balança
    caixa(c, 1.55, 0.12, 1.85, 0.4, 0, 12, '#f2efe6');
    polyT(c, [[1.45, 0.48, 0.3], [1.9, 0.48, 0.3], [1.9, 0.72, 0.3], [1.45, 0.72, 0.3]], '#8a9098', 'rgba(0,0,0,.3)');
  });

  // =========================================================
  // ARRANJOS DE ENERGIA LIMPA (2 × 2, âncora = canto superior)
  // =========================================================
  const onibusEletrico = (c, x0, y0, cor) => {
    caixa(c, x0, y0, x0 + 0.92, y0 + 0.22, 1, 12, cor || '#2fa05a');
    polyT(c, [[x0 + 0.06, y0 + 0.22, 6], [x0 + 0.86, y0 + 0.22, 6], [x0 + 0.86, y0 + 0.22, 10.5], [x0 + 0.06, y0 + 0.22, 10.5]], '#3c5d78', false);
    polyT(c, [[x0 + 0.92, y0 + 0.02, 4], [x0 + 0.92, y0 + 0.2, 4], [x0 + 0.92, y0 + 0.2, 11], [x0 + 0.92, y0 + 0.02, 11]], '#7fb3d8', false);
    caixa(c, x0 + 0.3, y0 + 0.05, x0 + 0.6, y0 + 0.17, 12, 14, '#c9ccd0', { brilho: false });
    [0.18, 0.76].forEach((a) => roda(c, x0 + a, y0 + 0.22, 2, 2.4));
  };
  def('garagemOnibusSolar', [-72, -64, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#7a7f88');
    for (let i = 0; i < 3; i++) linha(c, [[0.1, 0.5 + i * 0.5, 0.2], [1.5, 0.5 + i * 0.5, 0.2]], 'rgba(255,255,255,.7)', 0.8);
    // escritório com oficina
    caixa(c, 1.55, 0.1, 1.92, 0.7, 0, 18, '#f2efe6'); janelasE(c, 1.55, 1.92, 0.7, 3, 15, 1, 2, '#7fc4ef');
    telhado(c, 1.55, 0.1, 1.92, 0.7, 18, 6, '#3a7bd5', 0);
    containerBateria(c, 1.58, 1.2, 1.92, 1.5);
    containerBateria(c, 1.58, 1.58, 1.92, 1.88);
    // ônibus elétricos sob as coberturas solares, com carregadores de pantógrafo
    [0.18, 0.68, 1.18].forEach((y, i) => {
      onibusEletrico(c, 0.25, y, i === 1 ? '#2f7ad2' : '#2fa05a');
      carregador(c, 0.14, y + 0.12);
      linha(c, [[0.14, y + 0.12, 9], [0.14, y + 0.12, 22], [0.4, y + 0.12, 22]], '#8a9098', 1);
      coberturaSolar(c, 0.1, y - 0.05, 1.3, y + 0.33, 24);
    });
    placaIcone(c, 1.73, 0.4, 32, 'onibus', '#2fa05a');
  });
  def('carportSolar', [-72, -50, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#6f747c');
    // vagas e carros elétricos recarregando
    const cores = ['#e04a3a', '#f2f2f2', '#2f7ad2', '#f0c419', '#2fa05a', '#8a5bd0'];
    [0.35, 1.1].forEach((y, j) => {
      for (let i = 0; i < 4; i++) {
        const x = 0.25 + i * 0.36;
        linha(c, [[x - 0.18, y - 0.25, 0.2], [x - 0.18, y + 0.25, 0.2]], 'rgba(255,255,255,.75)', 0.7);
        if ((i + j) % 4 !== 3) carrinho(c, x, y, cores[(i + j * 4) % cores.length], 1);
        carregador(c, x, y - 0.3);
      }
      coberturaSolar(c, 0.05, y - 0.32, 1.48, y + 0.3, 22);
    });
    // baterias, transformador e quadro de gestão de energia
    containerBateria(c, 1.58, 0.15, 1.92, 0.5);
    containerBateria(c, 1.58, 0.6, 1.92, 0.95);
    caixa(c, 1.62, 1.1, 1.86, 1.34, 0, 12, '#9aa4ac');
    caixa(c, 1.62, 1.5, 1.88, 1.85, 0, 14, '#f2efe6');
    const tela = P(1.88, 1.68, 9); c.fillStyle = '#1a2a3a'; c.fillRect(tela[0] - 3, tela[1] - 4, 6, 5);
    emissivo([[tela[0] - 3, tela[1] - 4], [tela[0] + 3, tela[1] - 4], [tela[0] + 3, tela[1] + 1], [tela[0] - 3, tela[1] + 1]], '#7fd4ff');
    placaIcone(c, 1.75, 1.7, 26, 'tomada', '#2fa05a');
  });
  def('dessalinizadora', [-72, -96, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#d8cfb8');
    // painéis solares
    for (let i = 0; i < 3; i++) painelSolar(c, 0.15 + i * 0.32, 1.25, 0.26, 0.55, 3, 6);
    // prédio da osmose reversa com os vasos de pressão
    caixa(c, 0.95, 0.15, 1.6, 0.75, 0, 20, '#f4f6f8'); janelasE(c, 0.95, 1.6, 0.75, 4, 16, 1, 3, '#7fc4ef');
    caixa(c, 0.95, 0.15, 1.6, 0.75, 20, 22, '#2f7ad2', { brilho: false });
    for (let i = 0; i < 4; i++) { const a = P(1.0 + i * 0.14, 0.78, 6), b = P(1.08 + i * 0.14, 0.78, 6); c.strokeStyle = '#9aa4ac'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1] + 4); c.stroke(); }
    // tanque de água potável e tanque de rejeito salino
    cilindro(c, 1.45, 1.2, 13, 0, 24, '#e8eef2', { faixas: [[0.6, 0.7, '#2f7ad2']] });
    cilindro(c, 1.75, 1.6, 9, 0, 14, '#c9c4ba', { faixas: [[0.6, 0.7, '#9aa4ac']] });
    // captação de água do mar e emissário (lado de baixo do terreno, rumo ao mar)
    cano(c, [[1.2, 0.75, 2], [1.2, 1.98, 2]], '#4a8a9a', 2.4);
    cano(c, [[1.75, 1.6, 2], [1.98, 1.98, 2]], '#8a9098', 1.8);
    cano(c, [[1.6, 0.5, 8], [1.45, 1.2, 10]], '#2f7ad2', 1.6);
    // aerogerador de pequeno porte
    torreEolicaPequena(c, 0.4, 0.4, 70);
    placaIcone(c, 1.27, 0.45, 32, 'gota', '#2a7fd0');
  }, { rotor: [0.4, 0.4, 71, 20] });
  def('bombeamentoSolar', [-72, -92, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#8a6a42', 'rgba(0,0,0,.12)');
    // canteiros com irrigação por gotejamento
    for (let i = 0; i < 6; i++) {
      const y = 0.95 + i * 0.16;
      polyT(c, [[0.1, y, 0.5], [1.9, y, 0.5], [1.9, y + 0.08, 0.5], [0.1, y + 0.08, 0.5]], '#5a3e24', false);
      for (let k = 0; k < 16; k++) { const p = P(0.15 + k * 0.11, y + 0.04, 0.5); bolha(c, p[0], p[1] - 2.2, 2.6, k % 3 ? '#5fae3a' : '#7cc04a'); }
      linha(c, [[0.1, y + 0.07, 0.6], [1.9, y + 0.07, 0.6]], '#1e1e20', 0.8);
    }
    // gerador fotovoltaico e casinha da bomba
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) painelSolar(c, 0.12 + i * 0.36, 0.1 + j * 0.34, 0.3, 0.26, 6, 7);
    [[0.15, 0.4], [0.8, 0.4]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], 6]], '#8a9098', 1));
    caixa(c, 0.9, 0.15, 1.15, 0.4, 0, 10, '#e8e2d2'); telhado(c, 0.9, 0.15, 1.15, 0.4, 10, 4, '#2f9e8f', 0);
    // reservatório elevado: guarda a água bombeada de dia (a "bateria" do sistema)
    sub(c, r, 'caixaDagua', 0, 1.3, 0.1, 0, 0.85);
    cano(c, [[1.15, 0.3, 3], [1.5, 0.45, 3]], '#2f7ad2', 1.6);
    cano(c, [[1.6, 0.55, 2], [1.6, 0.9, 1], [0.1, 0.92, 1]], '#2f7ad2', 1.4);
    pessoinha(c, 0.7, 1.4, '#2fa05a', '#e8c86a');
    placaIcone(c, 1.05, 0.28, 22, 'sol', '#f0a21f');
  });
  def('fabricaGelo', [-72, -64, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c9c4ba');
    // galpão de gelo com painéis no telhado
    caixa(c, 0.15, 0.15, 1.35, 1.0, 0, 20, '#f4f6f8');
    janelasE(c, 0.15, 1.35, 1.0, 4, 16, 1, 4, '#7fc4ef');
    polyT(c, [[0.55, 1.0, 0], [0.85, 1.0, 0], [0.85, 1.0, 14], [0.55, 1.0, 14]], '#9aa4ac', 'rgba(0,0,0,.3)');
    caixa(c, 0.15, 0.15, 1.35, 1.0, 20, 22, '#d8dde2', { brilho: false });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) painelSolar(c, 0.22 + i * 0.28, 0.22 + j * 0.38, 0.24, 0.32, 22, 4);
    // câmara fria e condensadoras
    caixa(c, 1.45, 0.2, 1.88, 0.75, 0, 16, '#e8eef2');
    [[1.5, 0.8], [1.7, 0.8]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.16, q[1] + 0.14, 0, 8, '#c9d2da'); const p = P(q[0] + 0.08, q[1] + 0.07, 8); c.strokeStyle = '#6a7078'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(p[0], p[1], 3, 1.5, 0, 0, 7); c.stroke(); });
    // blocos de gelo, caixas de pescado e pescadores
    for (let i = 0; i < 4; i++) caixa(c, 0.3 + i * 0.16, 1.2, 0.42 + i * 0.16, 1.32, 0, 6, '#d8f2ff', { brilho: true });
    for (let i = 0; i < 5; i++) caixa(c, 1.05 + (i % 3) * 0.16, 1.25 + Math.floor(i / 3) * 0.16, 1.17 + (i % 3) * 0.16, 1.37 + Math.floor(i / 3) * 0.16, 0, 5, '#2f7ad2');
    pessoinha(c, 0.9, 1.5, '#e0a020', '#e8c86a'); pessoinha(c, 1.5, 1.6, '#c8463a');
    carrinho(c, 1.6, 1.15, '#f2f2f2', 0);
    placaIcone(c, 0.75, 0.6, 30, 'peixe', '#1fa3a3');
  });
  def('centralCalor', [-72, -76, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8b2a6');
    // poço produtor e poço de reinjeção (a água volta ao subsolo)
    [[0.3, 0.3, '#c8463a'], [0.3, 1.7, '#2f7ad2']].forEach((q) => {
      caixa(c, q[0] - 0.1, q[1] - 0.1, q[0] + 0.1, q[1] + 0.1, 0, 3, '#9aa4ac');
      cilindro(c, q[0], q[1], 3, 3, 16, '#d8dde2'); caixa(c, q[0] - 0.08, q[1] - 0.02, q[0] + 0.08, q[1] + 0.02, 10, 13, q[2]);
    });
    // trocador de calor
    caixa(c, 0.6, 0.15, 1.1, 0.55, 0, 16, '#e8e2d2'); janelasE(c, 0.6, 1.1, 0.55, 4, 13, 1, 2, '#7fc4ef');
    cilindro(c, 0.95, 0.75, 6, 0, 18, '#c0c6cc', { topo: '#9aa4ac' });
    // tubulação isolada em cascata: casas → estufa → tanques de peixe → reinjeção
    cano(c, [[0.3, 0.3, 12], [0.6, 0.3, 12]], '#e8eaec', 2.4);
    cano(c, [[1.1, 0.35, 6], [1.55, 0.35, 6], [1.55, 0.6, 6]], '#d84a2a', 2);
    cano(c, [[1.0, 0.8, 4], [1.0, 1.2, 4], [1.2, 1.2, 4]], '#f0a21f', 2);
    cano(c, [[0.5, 1.5, 3], [0.3, 1.6, 3]], '#2f7ad2', 2);
    // casas aquecidas
    sub(c, r, 'casa', 2, 1.45, 0.05, 0, 0.55); sub(c, r, 'casa', 4, 1.45, 0.48, 0, 0.55);
    // estufa
    caixa(c, 1.2, 1.0, 1.85, 1.45, 0, 12, 'rgba(200,235,240,.75)');
    for (let i = 0; i < 5; i++) { const x = 1.22 + i * 0.13; linha(c, [[x, 1.45, 0], [x, 1.45, 12], [x, 1.0, 12]], 'rgba(255,255,255,.7)', 0.6); }
    for (let i = 0; i < 6; i++) { const p = P(1.3 + (i % 3) * 0.2, 1.1 + Math.floor(i / 3) * 0.2, 2); bolha(c, p[0], p[1] - 2, 3, '#5fae3a'); }
    // tanques de peixes (água morna)
    [[0.75, 1.3], [0.75, 1.7], [1.1, 1.75]].forEach((q) => cilindro(c, q[0], q[1], 9, 0, 5, '#c9c4ba', { topo: '#4aa8c0', oco: '#3a98b0' }));
    placaIcone(c, 0.85, 0.35, 26, 'chama', '#e0552a');
  }, { fumaca: [[0.3, 0.3, 18, 'vapor']] });
  def('postoBiometano', [-72, -70, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8b2a6');
    // biodigestores com cúpula de membrana
    [[0.45, 0.45], [1.1, 0.4]].forEach((q) => {
      cilindro(c, q[0], q[1], 22, 0, 8, '#c9c4ba', { semTopo: true });
      const t = P(q[0], q[1], 8);
      c.beginPath(); c.ellipse(t[0], t[1], 22, 11, 0, Math.PI, 0); c.quadraticCurveTo(t[0] + 20, t[1] - 20, t[0], t[1] - 20); c.quadraticCurveTo(t[0] - 20, t[1] - 20, t[0] - 22, t[1]); c.closePath();
      const g = c.createLinearGradient(t[0] - 22, 0, t[0] + 22, 0); g.addColorStop(0, '#5fae5a'); g.addColorStop(1, '#2f7a3a');
      c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(t[0] - 7, t[1] - 13, 6, 3, -0.3, 0, 7); c.fill();
    });
    // purificação (remove CO₂ e gás sulfídrico) e compressor
    cilindro(c, 1.6, 0.35, 6, 0, 38, '#d8dde2', { faixas: [[0.8, 0.86, '#2fa05a']] });
    caixa(c, 1.45, 0.65, 1.85, 0.95, 0, 12, '#e8e2d2');
    cano(c, [[0.45, 0.45, 8], [1.1, 0.4, 8], [1.6, 0.35, 8]], '#e0a020', 1.6);
    cano(c, [[1.65, 0.95, 4], [1.2, 1.35, 4]], '#e0a020', 1.4);
    // posto de biometano com caminhão canavieiro abastecendo
    [[0.85, 1.15], [1.55, 1.15], [0.85, 1.75], [1.55, 1.75]].forEach((q) => linha(c, [[q[0], q[1], 0], [q[0], q[1], 22]], '#d8dde2', 2));
    caixa(c, 0.82, 1.1, 1.6, 1.8, 22, 25, '#2fa05a');
    caixa(c, 1.15, 1.4, 1.25, 1.5, 0, 9, '#2fa05a');
    sub(c, r, 'caminhaoCana', 0, 0.55, 1.2, 0, 0.75);
    placaIcone(c, 1.2, 1.45, 34, 'folha', '#2e9e4a');
  });
  def('aterroEnergia', [-72, -66, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9b09a');
    // célula encerrada: maciço coberto de grama com painéis solares
    polyT(c, [[0.08, 1.35, 0], [1.35, 1.35, 0], [1.25, 1.25, 12], [0.18, 1.25, 12]], '#7a9a4a', CONTORNO);
    polyT(c, [[1.35, 0.08, 0], [1.35, 1.35, 0], [1.25, 1.25, 12], [1.25, 0.18, 12]], '#6a8a40', CONTORNO);
    polyT(c, [[0.18, 0.18, 12], [1.25, 0.18, 12], [1.25, 1.25, 12], [0.18, 1.25, 12]], '#8fbb62', CONTORNO);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) painelSolar(c, 0.24 + i * 0.33, 0.24 + j * 0.33, 0.28, 0.24, 13, 5);
    // poços de biogás no maciço
    [[0.3, 1.18], [0.75, 1.18], [1.18, 0.75], [1.18, 0.3]].forEach((q) => cilindro(c, q[0], q[1], 2.5, 12, 20, '#c0c6cc', { topo: '#8a9098' }));
    cano(c, [[0.3, 1.18, 16], [1.18, 1.18, 16], [1.18, 0.3, 16]], '#e0a020', 1.4);
    // motogeradores em contêineres e queimador (flare)
    [[1.5, 0.2], [1.5, 0.6]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.4, q[1] + 0.3, 0, 13, '#2fa05a'); cilindro(c, q[0] + 0.3, q[1] + 0.15, 2, 13, 22, '#8a9098'); });
    cilindro(c, 1.75, 1.45, 4, 0, 40, '#c0c6cc', { faixas: [[0.85, 0.95, '#d23b2f']] });
    caixa(c, 1.45, 1.05, 1.75, 1.25, 0, 14, '#9aa4ac');
    cano(c, [[1.18, 0.75, 6], [1.5, 0.75, 6]], '#e0a020', 1.6);
    placaIcone(c, 1.7, 0.85, 30, 'ciclo', '#3aa86a');
  }, { fogo: [[1.75, 1.45, 42]], fumaca: [[1.85, 0.35, 22, 'vapor']] });
  def('comunidadeSolar', [-72, -60, 72, 72], (c, r) => {
    // margem do rio: metade do terreno é água, com palafitas e o barco solar
    polyT(c, [[0.02, 1.1, 0], [1.98, 0.9, 0], [1.98, 1.98, 0], [0.02, 1.98, 0]], '#3a9be0', false);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) linha(c, [[0.2 + i * 0.3, 1.5 + (i % 2) * 0.2, 0], [0.35 + i * 0.3, 1.5 + (i % 2) * 0.2, 0]], 'rgba(255,255,255,.4)', 0.7);
    polyT(c, [[0.02, 0.02, 0], [1.98, 0.02, 0], [1.98, 0.9, 0], [0.02, 1.1, 0]], '#9a8458', 'rgba(0,0,0,.15)');
    const palafita = (x, y, cor, solar) => {
      [[x, y + 0.35], [x + 0.4, y + 0.35], [x + 0.4, y], [x, y]].forEach((q) => linha(c, [[q[0], q[1], -2], [q[0], q[1], 8]], '#6a4a2c', 1.6));
      caixa(c, x - 0.04, y - 0.04, x + 0.44, y + 0.39, 8, 10, '#8a6a42', { brilho: false });
      caixa(c, x, y, x + 0.4, y + 0.35, 10, 20, cor);
      janelasE(c, x, x + 0.4, y + 0.35, 12, 18, 1, 2, '#7fc4ef');
      telhado(c, x, y, x + 0.4, y + 0.35, 20, 7, '#7a5a3a', 0);
      if (solar) painelSolar(c, x + 0.04, y + 0.02, 0.32, 0.14, 25, 3);
    };
    palafita(0.2, 0.75, '#f7d9a8', true); palafita(0.8, 0.65, '#e6f2d8', true); palafita(1.4, 0.55, '#ffd6c2', true);
    // trapiche e barco escolar elétrico com teto solar
    caixa(c, 0.95, 1.05, 1.1, 1.6, 0, 3, '#a07a4a', { brilho: false });
    polyT(c, [[1.15, 1.45, 1], [1.75, 1.45, 1], [1.8, 1.6, 1], [1.75, 1.75, 1], [1.15, 1.75, 1]], '#f2c419', CONTORNO);
    [[1.2, 1.5], [1.7, 1.5], [1.2, 1.7], [1.7, 1.7]].forEach((q) => linha(c, [[q[0], q[1], 1], [q[0], q[1], 9]], '#8a9098', 0.8));
    painelSolar(c, 1.18, 1.48, 0.55, 0.25, 9, 1);
    // casa de baterias com painéis e purificador de água
    caixa(c, 0.15, 0.08, 0.55, 0.42, 0, 12, '#e8eef2'); containerBateria(c, 0.62, 0.1, 0.92, 0.35);
    for (let i = 0; i < 3; i++) painelSolar(c, 1.05 + i * 0.28, 0.08, 0.24, 0.32, 4, 6);
    cilindro(c, 1.85, 0.3, 7, 0, 14, '#2f7ad2', { topo: '#7fc4ef' });
    pessoinha(c, 1.0, 1.3, '#2fa05a'); pessoinha(c, 0.6, 0.55, '#c8463a', '#e8c86a');
    placaIcone(c, 0.35, 0.25, 22, 'sol', '#f0a21f');
  });
  def('correiaSolar', [-72, -72, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8946a', 'rgba(0,0,0,.12)');
    // usina solar
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) painelSolar(c, 0.1 + i * 0.3, 0.1 + j * 0.36, 0.26, 0.28, 3, 6);
    // estação de recarga com caminhão fora de estrada elétrico
    caixa(c, 1.1, 0.12, 1.35, 0.4, 0, 14, '#e8eef2'); containerBateria(c, 1.45, 0.12, 1.88, 0.4);
    const p = P(1.1, 0.55, 0);
    caixa(c, 1.05, 0.6, 1.7, 0.95, 3, 9, '#f0c419'); caixa(c, 1.5, 0.62, 1.7, 0.93, 9, 17, '#f0b419');
    polyT(c, [[1.06, 0.62, 9], [1.48, 0.62, 9], [1.48, 0.93, 16], [1.06, 0.93, 13]], '#d9a010', CONTORNO);
    [1.12, 1.62].forEach((x) => roda(c, x, 0.95, 4, 4.5));
    cano(c, [[1.25, 0.4, 8], [1.25, 0.6, 8]], '#1e1e20', 1);
    c.fillStyle = '#2fbf6a'; c.beginPath(); c.arc(p[0], p[1] - 4, 1.5, 0, 7); c.fill();
    // correia transportadora em diagonal, com torre de transferência
    for (let i = 0; i < 5; i++) { const x = 0.15 + i * 0.36, y = 1.85 - i * 0.18; linha(c, [[x, y, 0], [x, y, 10 + i * 3]], '#7a7f88', 1.3); }
    const a = [0.1, 1.9, 10], b = [1.75, 1.15, 22];
    linha(c, [a, b], '#2a2c30', 4.2);
    c.fillStyle = '#8a5a3a'; for (let i = 0; i < 14; i++) { const u = (i + 0.5) / 14; const q = P(U.lerp(a[0], b[0], u), U.lerp(a[1], b[1], u), U.lerp(a[2], b[2], u) + 1.6); c.beginPath(); c.ellipse(q[0], q[1], 1.8, 1, 0, 0, 7); c.fill(); }
    caixa(c, 1.7, 1.05, 1.92, 1.3, 0, 30, '#c9c4ba');
    placaIcone(c, 0.55, 0.35, 18, 'sol', '#f0a21f');
  });
  def('reusoSolarDC', [-72, -52, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8b2a6');
    // decantadores e filtros da água de reúso
    [[0.35, 0.35], [0.85, 0.3]].forEach((q) => { cilindro(c, q[0], q[1], 16, 0, 8, '#d8d4cc', { topo: '#5a9ab0', oco: '#4a8aa0' }); const t = P(q[0], q[1], 8); c.strokeStyle = '#8a9098'; c.lineWidth = 1; c.beginPath(); c.moveTo(t[0] - 15, t[1]); c.lineTo(t[0] + 15, t[1]); c.stroke(); });
    caixa(c, 1.3, 0.12, 1.88, 0.5, 0, 14, '#e8eef2'); janelasE(c, 1.3, 1.88, 0.5, 3, 11, 1, 3, '#7fc4ef');
    // lagoa de água tratada com painéis solares flutuantes
    polyT(c, [[0.1, 0.8, 0], [1.9, 0.75, 0], [1.9, 1.9, 0], [0.1, 1.9, 0]], '#9a9080', CONTORNO);
    polyT(c, [[0.18, 0.86, -0.5], [1.82, 0.82, -0.5], [1.82, 1.82, -0.5], [0.18, 1.82, -0.5]], '#3a8ac0', false);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { polyT(c, [[0.3 + i * 0.38, 0.95 + j * 0.28, 0.6], [0.6 + i * 0.38, 0.95 + j * 0.28, 0.6], [0.6 + i * 0.38, 1.17 + j * 0.28, 0.6], [0.3 + i * 0.38, 1.17 + j * 0.28, 0.6]], '#e8eef2', false); painelSolar(c, 0.32 + i * 0.38, 0.97 + j * 0.28, 0.26, 0.18, 1, 2); }
    cano(c, [[1.88, 0.3, 4], [1.98, 0.3, 4]], '#2f7ad2', 2);
    cano(c, [[0.85, 0.5, 2], [0.85, 0.8, 1]], '#2f7ad2', 1.6);
    placaIcone(c, 1.6, 0.3, 24, 'gota', '#2a7fd0');
  });
  def('usinaVirtual', [-72, -64, 72, 72], (c, r) => {
    sombra(c, 1, 1, 64, 30, 0.2);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#9ac46a', 'rgba(0,0,0,.12)');
    polyT(c, [[0.9, 0.02, 0.2], [1.15, 0.02, 0.2], [1.15, 1.98, 0.2], [0.9, 1.98, 0.2]], '#7a7f88', false);
    // casas com painéis e baterias domésticas
    sub(c, r, 'casaSolar', 1, 0.05, 0.05, 0, 0.75); sub(c, r, 'casaSolar', 2, 0.05, 0.9, 0, 0.75);
    sub(c, r, 'casaSolar', 3, 1.25, 0.05, 0, 0.75);
    // baterias de bairro e carros elétricos conectados
    containerBateria(c, 1.25, 0.95, 1.9, 1.25);
    containerBateria(c, 1.25, 1.35, 1.9, 1.65);
    carrinho(c, 0.4, 1.75, '#2f7ad2', 0); carregador(c, 0.65, 1.75);
    carrinho(c, 1.5, 1.82, '#e04a3a', 0); carregador(c, 1.75, 1.85);
    // central de controle (software que coordena tudo) e medidores inteligentes
    caixa(c, 0.15, 1.55, 0.45, 1.7, 0, 10, '#f2efe6');
    const tela = P(0.3, 1.7, 7); c.fillStyle = '#1a2a3a'; c.fillRect(tela[0] - 3.5, tela[1] - 3, 7, 4.5);
    emissivo([[tela[0] - 3.5, tela[1] - 3], [tela[0] + 3.5, tela[1] - 3], [tela[0] + 3.5, tela[1] + 1.5], [tela[0] - 3.5, tela[1] + 1.5]], '#7fd4ff');
    [[0.85, 0.5], [0.85, 1.3], [1.2, 0.9]].forEach((q) => { linha(c, [[q[0], q[1], 0], [q[0], q[1], 26]], '#8a6a42', 1.6); const p = P(q[0], q[1], 26); c.fillStyle = '#2fbf6a'; c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 7); c.fill(); });
    linha(c, [[0.85, 0.5, 24], [0.85, 1.3, 24]], 'rgba(40,45,60,.6)', 0.6); linha(c, [[0.85, 1.3, 24], [1.2, 0.9, 24]], 'rgba(40,45,60,.6)', 0.6);
    placaIcone(c, 1.57, 1.3, 26, 'rede', '#d23b6a');
  });

  SPR.c2 = { piso, linha, cano, sub, roda, polyT, disco, pessoinha, carrinho, containerBateria, coberturaSolar, carregador, torreEolicaPequena };
})();
