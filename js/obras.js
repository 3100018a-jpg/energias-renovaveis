/* =========================================================
   Construções exclusivas dos lotes: cada opção de construção
   tem um desenho próprio, no mesmo estilo pintado à mão.
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U;
  const SPR = ERS.SPR;
  const { P, poly, caixa, cilindro, telhado, janelasE, janelasD, painelSolar, placaIcone, chamine, sombra, bolha, copa, casa, torreResfriamento, emissivo, def, VERDES, CONTORNO } = SPR.h;

  // desenha outro sprite (vetorial, nítido em qualquer resolução) com a âncora em (x, y, z)
  function sub(c, r, nome, v, x, y, z, esc) {
    const d = SPR.defs[nome];
    if (!d) return;
    const p = P(x || 0, y || 0, z || 0);
    c.save(); c.translate(p[0], p[1]); if (esc) c.scale(esc, esc);
    d.desenho(c, r, v || 0);
    c.restore();
  }
  const piso = (c, x0, y0, x1, y1, cor, borda) => poly(c, [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)], cor, borda === undefined ? 'rgba(0,0,0,.18)' : borda);
  function linha(c, pts, cor, lw) {
    c.strokeStyle = cor; c.lineWidth = lw || 2; c.beginPath();
    pts.forEach((q, i) => { const p = P(q[0], q[1], q[2] || 0); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
    c.stroke();
  }
  function cano(c, pts, cor, lw) { linha(c, pts, U.shade(cor, -0.35), (lw || 3) + 1.4); linha(c, pts, cor, lw || 3); }
  function agua(c, pts, cor) {
    c.fillStyle = cor || '#4aa8e0'; c.beginPath();
    pts.forEach((q, i) => { const p = P(q[0], q[1], 0); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.8; c.stroke();
  }
  function arvorinha(c, x, y, s, cor) {
    const p = P(x, y, 0); s = s || 1;
    c.fillStyle = '#6a3f22'; c.fillRect(p[0] - 1 * s, p[1] - 7 * s, 2 * s, 7 * s);
    bolha(c, p[0], p[1] - 12 * s, 6.5 * s, cor || VERDES[Math.abs(Math.round(x * 7 + y * 5)) % VERDES.length]);
    bolha(c, p[0] + 2.5 * s, p[1] - 16 * s, 4.5 * s, U.shade(cor || '#4fae3f', 0.12));
  }
  function toco(c, x, y) {
    const p = P(x, y, 0);
    c.fillStyle = '#8a5a32'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 3.4, 1.8, 0, 0, 7); c.rect(p[0] - 3.4, p[1] - 3, 6.8, 3); c.fill();
    c.fillStyle = '#d8b07a'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 3.4, 1.8, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(90,50,20,.6)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(p[0], p[1] - 3, 1.6, 0.8, 0, 0, 7); c.stroke();
  }
  function tora(c, x, y) {
    const a = P(x, y, 1.5), b = P(x + 0.28, y + 0.05, 1.5);
    c.strokeStyle = '#7a4a28'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.fillStyle = '#d8b07a'; c.beginPath(); c.ellipse(b[0], b[1], 1.8, 1.8, 0, 0, 7); c.fill();
  }
  function placaAviso(c, x, y, z) {
    const p = P(x, y, z || 0);
    c.fillStyle = '#7a4b2a'; c.fillRect(p[0] - 0.8, p[1] - 12, 1.6, 12);
    c.fillStyle = '#ffd23f'; c.strokeStyle = '#2a2a2a'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(p[0], p[1] - 22); c.lineTo(p[0] + 6, p[1] - 12); c.lineTo(p[0] - 6, p[1] - 12); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2a2a2a'; c.fillRect(p[0] - 0.6, p[1] - 19, 1.2, 4); c.fillRect(p[0] - 0.6, p[1] - 14, 1.2, 1.2);
  }
  function passaros(c, x, y, n, s) {
    c.strokeStyle = '#2a2a3a'; c.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      const px = x + i * 6 * (s || 1) - (i % 2) * 3, py = y - (i % 3) * 4;
      c.beginPath(); c.moveTo(px - 3, py); c.quadraticCurveTo(px - 1.5, py - 2, px, py); c.quadraticCurveTo(px + 1.5, py - 2, px + 3, py); c.stroke();
    }
  }
  function vaca(c, r, x, y, esc) { sub(c, r, 'vaca', 0, x, y, 0, esc || 0.8); }
  function caminhao(c, x, y, cor, cab) {
    const p = P(x, y, 0);
    c.fillStyle = '#222'; [-9, -2, 9].forEach((d) => { c.beginPath(); c.arc(p[0] + d, p[1] - 2, 2.6, 0, 7); c.fill(); });
    c.fillStyle = cor; c.fillRect(p[0] - 13, p[1] - 14, 17, 10); c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.strokeRect(p[0] - 13, p[1] - 14, 17, 10);
    c.fillStyle = cab || '#e8eef4'; c.fillRect(p[0] + 4, p[1] - 12, 8, 8); c.strokeRect(p[0] + 4, p[1] - 12, 8, 8);
    c.fillStyle = '#8ad0ff'; c.fillRect(p[0] + 7, p[1] - 11, 4, 3);
  }
  function barcoPequeno(c, x, y, cor, solar) {
    const p = P(x, y, 0);
    c.fillStyle = cor; c.beginPath(); c.moveTo(p[0] - 13, p[1] - 3); c.lineTo(p[0] + 13, p[1] - 4); c.lineTo(p[0] + 8, p[1] + 3); c.lineTo(p[0] - 9, p[1] + 3); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#f2f2f2'; c.fillRect(p[0] - 5, p[1] - 9, 9, 6); c.strokeRect(p[0] - 5, p[1] - 9, 9, 6);
    if (solar) {
      c.fillStyle = '#ddd'; c.fillRect(p[0] - 8, p[1] - 14, 1.2, 10); c.fillRect(p[0] + 7, p[1] - 14, 1.2, 10);
      c.fillStyle = '#1f3f95'; c.beginPath(); c.moveTo(p[0] - 10, p[1] - 14); c.lineTo(p[0] + 10, p[1] - 15); c.lineTo(p[0] + 8, p[1] - 18); c.lineTo(p[0] - 8, p[1] - 17); c.closePath(); c.fill(); c.strokeStyle = '#0f1d44'; c.stroke();
      c.strokeStyle = 'rgba(140,190,255,.6)'; c.lineWidth = 0.5; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(p[0] - 10 + i * 5, p[1] - 14); c.lineTo(p[0] - 8 + i * 4, p[1] - 17); c.stroke(); }
    } else {
      c.fillStyle = '#555'; c.fillRect(p[0] + 10, p[1] - 6, 3, 5);
    }
  }
  function pier(c, x0, y0, x1, y1) {
    caixa(c, x0, y0, x1, y1, 0, 3, '#b0844f', { brilho: false });
    c.strokeStyle = 'rgba(80,50,20,.45)'; c.lineWidth = 0.5;
    for (let t = x0 + 0.06; t < x1; t += 0.08) { const a = P(t, y0, 3), b = P(t, y1, 3); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }
  function ventilador(c, x, y, z, rr, cor) {
    const p = P(x, y, z);
    c.fillStyle = cor || '#4a5566'; c.beginPath(); c.ellipse(p[0], p[1], rr, rr / 2, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(p[0] - rr * 0.7, p[1]); c.lineTo(p[0] + rr * 0.7, p[1]); c.moveTo(p[0], p[1] - rr * 0.35); c.lineTo(p[0], p[1] + rr * 0.35); c.stroke();
  }
  function tenda(c, x, y, cor) {
    caixa(c, x, y, x + 0.22, y + 0.22, 0, 6, '#f4ead8', { brilho: false });
    const t = P(x + 0.11, y + 0.11, 18);
    poly(c, [P(x - 0.03, y + 0.25, 8), P(x + 0.25, y + 0.25, 8), t], cor);
    poly(c, [P(x + 0.25, y - 0.03, 8), P(x + 0.25, y + 0.25, 8), t], U.shade(cor, -0.22));
  }
  function vapor(c, x, y, z, n) {
    for (let i = 0; i < (n || 3); i++) { const p = P(x, y, z + i * 6); c.fillStyle = `rgba(255,255,255,${0.55 - i * 0.14})`; c.beginPath(); c.arc(p[0] + (i % 2 ? 3 : -2), p[1], 3 + i * 1.6, 0, 7); c.fill(); }
  }
  function camposLinhas(c, r, x0, y0, x1, y1, cor, n) {
    for (let i = 0; i < n; i++) {
      const y = y0 + (i + 0.5) * (y1 - y0) / n;
      for (let x = x0 + 0.05; x < x1; x += 0.1) { const p = P(x, y, 0); bolha(c, p[0], p[1] - 2.5, 3.2, i % 2 ? cor : U.shade(cor, 0.08)); }
    }
  }

  // =========================================================
  // ENERGIA SOLAR
  // =========================================================
  def('solarDesmate', [-70, -46, 70, 70], (c, r) => {
    piso(c, 0, 0, 2, 2, '#a9875a', false);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) painelSolar(c, 0.12 + i * 0.5, 0.12 + j * 0.34, 0.42, 0.22, 3, 6);
    [[1.7, 0.2], [1.85, 0.6], [1.75, 1.1], [1.88, 1.5], [1.6, 1.85], [1.2, 1.88]].forEach((q) => toco(c, q[0], q[1]));
    tora(c, 1.55, 0.35); tora(c, 1.45, 1.3);
    placaAviso(c, 1.9, 1.9);
  });
  def('solarCava', [-70, -40, 70, 70], (c, r) => {
    const p = P(1, 1, 0);
    ['#86b05a', '#b8a07a', '#a88a62', '#98794f'].forEach((k, i) => { c.fillStyle = k; c.beginPath(); c.ellipse(p[0], p[1] + i * 3, 60 - i * 12, 29 - i * 6, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(80,50,20,.3)'; c.stroke(); });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) painelSolar(c, 0.55 + i * 0.32, 0.55 + j * 0.32, 0.28, 0.2, 3, 5);
    [[0.3, 1.0], [1.0, 0.3], [1.7, 1.0], [1.0, 1.7]].forEach((q) => arvorinha(c, q[0], q[1], 0.8));
    placaIcone(c, 1.6, 1.6, 20, 'sol', '#f0a21f');
  });
  def('pontoSolar', [-34, -56, 34, 34], (c) => {
    piso(c, 0.05, 0.05, 0.95, 0.95, '#b9b4aa');
    [[0.15, 0.2], [0.55, 0.2]].forEach((q) => { const a = P(q[0], q[1], 0); c.fillStyle = '#5a6270'; c.fillRect(a[0] - 0.8, a[1] - 26, 1.6, 26); });
    caixa(c, 0.12, 0.15, 0.62, 0.42, 26, 28, '#cfd6dd');
    painelSolar(c, 0.14, 0.16, 0.46, 0.24, 28, 3);
    caixa(c, 0.16, 0.36, 0.56, 0.4, 0, 9, 'rgba(180,220,240,.7)', { brilho: false });
    // ônibus elétrico
    caixa(c, 0.15, 0.55, 0.9, 0.85, 2, 18, '#2fa05a');
    janelasE(c, 0.18, 0.88, 0.85, 9, 16, 1, 4, '#bfe6ff');
    caixa(c, 0.4, 0.62, 0.65, 0.78, 18, 21, '#cfd6dd', { brilho: false });
    placaIcone(c, 0.82, 0.25, 22, 'raio', '#2fa05a');
  });
  def('predioEficiente', [-34, -112, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.28);
    caixa(c, 0.14, 0.14, 0.86, 0.86, 0, 66, '#f2efe6');
    janelasE(c, 0.14, 0.86, 0.86, 4, 60, 5, 3, '#9ad8f0');
    janelasD(c, 0.14, 0.86, 0.86, 4, 60, 5, 3, '#86c8e6');
    // brises verticais (sombreamento)
    for (let i = 0; i < 6; i++) { const x = 0.17 + i * 0.13; poly(c, [P(x, 0.9, 2), P(x + 0.03, 0.9, 2), P(x + 0.03, 0.9, 64), P(x, 0.9, 64)], '#c98a4a', false); }
    // telhado verde
    poly(c, [P(0.14, 0.14, 66), P(0.86, 0.14, 66), P(0.86, 0.86, 66), P(0.14, 0.86, 66)], '#5fae3f', CONTORNO);
    [[0.3, 0.3], [0.6, 0.35], [0.4, 0.62], [0.7, 0.7]].forEach((q) => { const p = P(q[0], q[1], 66); bolha(c, p[0], p[1] - 3, 4, '#3f9a3a'); });
    painelSolar(c, 0.55, 0.18, 0.28, 0.2, 67, 4);
    // faixa de LED
    const a = P(0.14, 0.86, 30), b = P(0.86, 0.86, 30);
    poly(c, [a, b, [b[0], b[1] - 1.5], [a[0], a[1] - 1.5]], '#fff6c0', false);
    emissivo([a, b, [b[0], b[1] - 1.5], [a[0], a[1] - 1.5]], '#fff6c0');
  });
  def('escolaEficiente', [-66, -78, 66, 66], (c, r) => {
    sub(c, r, 'escola', 0, 0, 0, 0);
    // toldos verdes sobre as janelas
    for (let i = 0; i < 6; i++) { const x = 0.18 + i * 0.29; poly(c, [P(x, 0.95, 22), P(x + 0.2, 0.95, 22), P(x + 0.2, 1.05, 18), P(x, 1.05, 18)], i % 2 ? '#2e9e4a' : '#4fc46a', 'rgba(0,60,20,.4)'); }
    // exaustores eólicos no telhado
    [0.5, 1.0, 1.5].forEach((x) => { cilindro(c, x, 0.55, 3, 36, 40, '#d8dde2'); const p = P(x, 0.55, 43); bolha(c, p[0], p[1], 3.6, '#c8d0d8', 0.4); });
    // postes de LED
    [[0.25, 1.95], [1.75, 1.95]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#4a5566'; c.fillRect(p[0] - 0.8, p[1] - 20, 1.6, 20); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(p[0], p[1] - 21, 2.2, 0, 7); c.fill(); emissivo([[p[0] - 2, p[1] - 23], [p[0] + 2, p[1] - 23], [p[0] + 2, p[1] - 19], [p[0] - 2, p[1] - 19]], '#fff6c0'); });
    placaIcone(c, 1.0, 0.95, 40, 'raio', '#2e9e4a');
  });

  def('termeletricaGas', [-70, -130, 70, 70], (c) => {
    sombra(c, 1, 1, 64, 30, 0.3);
    caixa(c, 0.15, 0.9, 1.25, 1.85, 0, 30, '#d8dde2');
    janelasE(c, 0.15, 1.25, 1.85, 4, 26, 2, 4, '#7fc4ef');
    caixa(c, 0.3, 1.05, 1.1, 1.7, 30, 36, '#a8b0b8');
    // esferas de gás natural
    [[0.45, 0.4], [1.0, 0.35]].forEach((q) => {
      [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]].forEach((d) => { const a = P(q[0] + d[0], q[1] + d[1], 0), b = P(q[0], q[1], 14); c.strokeStyle = '#7a8590'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
      const p = P(q[0], q[1], 22); bolha(c, p[0], p[1], 13, '#e8eef4', 0.35); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.beginPath(); c.arc(p[0], p[1], 13, 0, 7); c.stroke();
    });
    // chaminés finas da turbina a gás
    [[1.55, 1.1], [1.75, 1.45]].forEach((q) => cilindro(c, q[0], q[1], 4, 0, 78, '#c8ced6', { faixas: [[0.88, 0.95, '#2f7ad2']], oco: '#333' }));
    cano(c, [[0.6, 0.55, 8], [0.6, 0.95, 8]], '#ffd23f', 3);
    placaIcone(c, 0.7, 1.3, 50, 'chama', '#2f7ad2');
  }, { fumaca: [[1.55, 1.1, 78, 'vapor'], [1.75, 1.45, 78, 'escura']] });

  // =========================================================
  // VENTO
  // =========================================================
  function torre(c, x, y, faixa, nacela) {
    sombra(c, x, y, 10, 5, 0.3);
    const b = P(x, y, 0);
    c.beginPath(); c.moveTo(b[0] - 4, b[1]); c.lineTo(b[0] - 1.6, b[1] - 104); c.lineTo(b[0] + 1.6, b[1] - 104); c.lineTo(b[0] + 4, b[1]); c.closePath();
    const g = c.createLinearGradient(b[0] - 4, 0, b[0] + 4, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9c2cc');
    c.fillStyle = g; c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
    if (faixa) { c.fillStyle = faixa; c.fillRect(b[0] - 3.4, b[1] - 20, 6.8, 4); c.fillRect(b[0] - 2.8, b[1] - 30, 5.6, 2); }
    c.fillStyle = nacela || '#eef2f6'; c.beginPath(); c.ellipse(b[0] + 2, b[1] - 106, nacela ? 9 : 7, 3.8, -0.2, 0, 7); c.fill(); c.stroke();
  }
  def('eolicaSemImas', [-30, -130, 30, 20], (c) => {
    piso(c, 0.2, 0.2, 0.8, 0.8, '#b8b3a6');
    torre(c, 0.5, 0.5, '#2e9e4a', '#d8f0d8');
    // gerador de indução (caixa maior na nacele) + placa
    const p = P(0.5, 0.5, 0); c.fillStyle = '#2e9e4a'; c.beginPath(); c.arc(p[0] + 8, p[1] - 106, 2.2, 0, 7); c.fill();
    placaIcone(c, 0.85, 0.85, 14, 'ciclo', '#2e9e4a');
  }, { rotor: [0.5, 0.5, 106, 30] });
  def('eolicaVila', [-34, -130, 34, 34], (c, r) => {
    c.save(); c.translate(0, 0); c.scale(0.55, 0.55);
    const q = P(0.0, 0.9, 0); c.translate(q[0] * 0.8, q[1] * 0.8);
    casa(c, r, 1, false); c.restore();
    c.save(); c.scale(0.55, 0.55); const q2 = P(0.9, 0.0, 0); c.translate(q2[0] * 0.8, q2[1] * 0.8 + 20); casa(c, r, 2, false); c.restore();
    torre(c, 0.62, 0.62, '#d23b2f');
    placaAviso(c, 0.92, 0.92);
  }, { rotor: [0.62, 0.62, 106, 30] });
  def('eolicaAves', [-34, -130, 34, 34], (c) => {
    agua(c, [[0.05, 0.4], [0.35, 0.1], [0.6, 0.2], [0.5, 0.5], [0.2, 0.7]], '#5ab4e6');
    [[0.15, 0.85], [0.85, 0.15]].forEach((q) => arvorinha(c, q[0], q[1], 0.7));
    torre(c, 0.7, 0.7, '#f0a21f');
    passaros(c, -18, -70, 5); passaros(c, 6, -96, 3, 0.8);
  }, { rotor: [0.7, 0.7, 106, 30] });

  // =========================================================
  // ÁGUA E RIOS
  // =========================================================
  def('turbinaNova', [-34, -64, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.4, 0.9, 0.9, 0, 18, '#d8d2c4');
    janelasE(c, 0.1, 0.9, 0.9, 4, 14, 1, 4, '#7fc4ef');
    // gerador novo, azul
    cilindro(c, 0.35, 0.22, 9, 0, 14, '#2f7ad2', { faixas: [[0.6, 0.75, '#ffd23f']] });
    cilindro(c, 0.72, 0.22, 7, 0, 10, '#5aa0e8');
    // pórtico rolante
    c.strokeStyle = '#f0b419'; c.lineWidth = 2.2;
    const a = P(0.08, 0.15, 0), b = P(0.92, 0.15, 0);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 34); c.lineTo(b[0], b[1] - 34); c.lineTo(b[0], b[1]); c.stroke();
    const m = P(0.35, 0.15, 34); c.strokeStyle = '#555'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] + 10); c.stroke();
    placaIcone(c, 0.5, 0.9, 26, 'raio', '#2f7ad2');
  });
  def('monitorRio', [-34, -56, 34, 34], (c) => {
    agua(c, [[0.05, 0.5], [0.95, 0.5], [0.95, 0.95], [0.05, 0.95]], '#4aa0d8');
    // régua linimétrica
    const p = P(0.5, 0.7, 0);
    c.fillStyle = '#fff'; c.fillRect(p[0] - 2, p[1] - 30, 4, 30);
    c.fillStyle = '#d23b2f'; for (let i = 0; i < 6; i++) c.fillRect(p[0] - 2, p[1] - 28 + i * 5, 4, 2);
    // cabine com painel e antena
    caixa(c, 0.1, 0.08, 0.42, 0.38, 0, 14, '#e8eef4');
    painelSolar(c, 0.12, 0.1, 0.28, 0.14, 15, 5);
    const an = P(0.36, 0.12, 14); c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(an[0], an[1]); c.lineTo(an[0], an[1] - 20); c.stroke();
    c.fillStyle = '#2fd16a'; c.beginPath(); c.arc(an[0], an[1] - 20, 1.6, 0, 7); c.fill();
    placaIcone(c, 0.8, 0.2, 18, 'gota', '#2a7fd0');
  });
  def('hidrocinetica', [-34, -40, 34, 34], (c) => {
    agua(c, [[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98]], 'rgba(70,160,220,.85)');
    // rotor submerso, visto pela transparência
    const p = P(0.5, 0.5, -2); c.strokeStyle = 'rgba(40,60,90,.6)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const a = i * 2.1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + Math.cos(a) * 12, p[1] + Math.sin(a) * 6); c.stroke(); }
    // flutuadores e casa de máquinas
    caixa(c, 0.12, 0.15, 0.88, 0.3, 0, 5, '#c8ccd2'); caixa(c, 0.12, 0.7, 0.88, 0.85, 0, 5, '#c8ccd2');
    caixa(c, 0.4, 0.3, 0.6, 0.7, 5, 7, '#9aa3ad', { brilho: false });
    caixa(c, 0.42, 0.38, 0.6, 0.62, 7, 18, '#f0c419');
    placaIcone(c, 0.5, 0.5, 26, 'onda', '#2a7fd0');
  });
  def('raftingBase', [-34, -44, 34, 34], (c) => {
    agua(c, [[0.5, 0.02], [0.98, 0.02], [0.98, 0.98], [0.5, 0.98]], '#5ab4e6');
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = P(0.6 + i * 0.09, 0.2 + i * 0.18, 0); c.beginPath(); c.arc(a[0], a[1], 3, 3.4, 6); c.stroke(); }
    sub(c, null, 'quiosque', 0, -0.1, 0.05, 0, 0.8);
    [[0.25, 0.75, '#f0a21f'], [0.72, 0.6, '#d23b2f']].forEach((b) => { const p = P(b[0], b[1], 0); c.fillStyle = b[2]; c.beginPath(); c.ellipse(p[0], p[1] - 2, 11, 4.5, -0.3, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke(); c.fillStyle = U.shade(b[2], 0.3); c.beginPath(); c.ellipse(p[0], p[1] - 3, 7, 2.5, -0.3, 0, 7); c.fill(); });
    const rm = P(0.3, 0.55, 0); c.strokeStyle = '#7a4b2a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(rm[0] - 8, rm[1] - 2); c.lineTo(rm[0] + 6, rm[1] - 8); c.stroke();
  });
  def('mirante', [-30, -66, 30, 30], (c) => {
    sombra(c, 0.5, 0.5, 20, 9, 0.25);
    [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#7a4b2a'; c.fillRect(p[0] - 1.2, p[1] - 34, 2.4, 34); });
    linha(c, [[0.3, 0.7, 4], [0.7, 0.7, 30]], '#9a6b3a', 1.2); linha(c, [[0.7, 0.3, 4], [0.7, 0.7, 30]], '#9a6b3a', 1.2);
    caixa(c, 0.22, 0.22, 0.78, 0.78, 34, 36, '#b0844f');
    const t = P(0.5, 0.5, 52);
    poly(c, [P(0.15, 0.85, 42), P(0.85, 0.85, 42), t], '#2f7a4a'); poly(c, [P(0.85, 0.15, 42), P(0.85, 0.85, 42), t], '#25603a');
    const b = P(0.5, 0.7, 38); c.fillStyle = '#333'; c.fillRect(b[0] - 2, b[1] - 3, 4, 3);
    passaros(c, 8, -58, 3, 0.7);
  });
  def('termas', [-34, -40, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#d9c9a8');
    [[0.32, 0.32, 13], [0.68, 0.66, 11]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#9a8a72'; c.beginPath(); c.ellipse(p[0], p[1], q[2] + 3, (q[2] + 3) / 2, 0, 0, 7); c.fill(); c.fillStyle = '#6fd0e0'; c.beginPath(); c.ellipse(p[0], p[1], q[2], q[2] / 2, 0, 0, 7); c.fill(); });
    [[0.12, 0.6], [0.2, 0.85], [0.85, 0.2], [0.55, 0.1]].forEach((q) => { const p = P(q[0], q[1], 0); bolha(c, p[0], p[1] - 2, 3, '#8a8478', 0.3); });
    vapor(c, 0.32, 0.32, 6, 3); vapor(c, 0.68, 0.66, 6, 2);
    sub(c, null, 'guardaSol', 2, 0.85, 0.85, 0, 0.8);
  });
  def('barcoSolar', [-34, -36, 34, 34], (c) => {
    agua(c, [[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98]], 'rgba(80,170,225,.6)');
    pier(c, 0.05, 0.1, 0.95, 0.3);
    barcoPequeno(c, 0.35, 0.6, '#2fa05a', true);
    barcoPequeno(c, 0.75, 0.75, '#2f7ad2', true);
    placaIcone(c, 0.15, 0.2, 14, 'sol', '#f0a21f');
  });
  def('marina', [-34, -36, 34, 34], (c) => {
    agua(c, [[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98]], 'rgba(80,170,225,.6)');
    // mancha de óleo
    const m = P(0.6, 0.8, 0); const g = c.createRadialGradient(m[0], m[1], 1, m[0], m[1], 14);
    g.addColorStop(0, 'rgba(60,40,80,.55)'); g.addColorStop(0.5, 'rgba(120,200,120,.35)'); g.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(m[0], m[1], 16, 7, 0, 0, 7); c.fill();
    pier(c, 0.05, 0.1, 0.95, 0.3);
    barcoPequeno(c, 0.35, 0.55, '#ffffff'); barcoPequeno(c, 0.75, 0.6, '#d9533b');
    const b = P(0.15, 0.18, 3); c.fillStyle = '#d23b2f'; c.fillRect(b[0] - 3, b[1] - 12, 6, 12); c.fillStyle = '#fff'; c.fillRect(b[0] - 2, b[1] - 10, 4, 3);
  }, { fumaca: [[0.75, 0.6, 6, 'escura']] });

  // =========================================================
  // MAR E COSTA
  // =========================================================
  def('tomadaNavio', [-34, -60, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.6, '#b9b4aa');
    agua(c, [[0.02, 0.6], [0.98, 0.6], [0.98, 0.98], [0.02, 0.98]], '#4a9ad0');
    // casco do navio atracado
    caixa(c, 0.05, 0.66, 0.95, 0.98, -4, 14, { topo: '#e8e8e8', esq: '#2a4a7a', dir: '#1e3a62' });
    caixa(c, 0.55, 0.7, 0.9, 0.94, 14, 26, '#f2f2f2');
    janelasE(c, 0.55, 0.9, 0.94, 17, 24, 1, 3, '#7fc4ef');
    // torre de cabos e caixa de conexão
    caixa(c, 0.15, 0.15, 0.4, 0.4, 0, 16, '#2fa05a');
    const t = P(0.3, 0.45, 0); c.fillStyle = '#5a6270'; c.fillRect(t[0] - 1.5, t[1] - 34, 3, 34);
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(t[0], t[1] - 32); const n = P(0.35, 0.8, 16); c.quadraticCurveTo((t[0] + n[0]) / 2, n[1] - 18, n[0], n[1]); c.stroke();
    placaIcone(c, 0.27, 0.27, 24, 'raio', '#2fa05a');
  });
  def('manguezal', [-34, -46, 34, 34], (c, r) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#7a6a4a', false);
    agua(c, [[0.1, 0.5], [0.5, 0.35], [0.9, 0.55], [0.6, 0.75], [0.2, 0.8]], 'rgba(90,150,140,.8)');
    [[0.25, 0.25], [0.7, 0.3], [0.45, 0.6], [0.8, 0.8], [0.2, 0.75]].forEach((q, i) => {
      const p = P(q[0], q[1], 0);
      c.strokeStyle = '#5a3a20'; c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(p[0] + k * 3, p[1]); c.quadraticCurveTo(p[0] + k * 1.5, p[1] - 8, p[0], p[1] - 10); c.stroke(); }
      bolha(c, p[0], p[1] - 16, 7, VERDES[(i + 2) % VERDES.length]); bolha(c, p[0] + 3, p[1] - 20, 5, '#2f8a46');
    });
    const k = P(0.55, 0.85, 0); c.fillStyle = '#e04a3a'; c.beginPath(); c.ellipse(k[0], k[1] - 1.5, 2.6, 1.6, 0, 0, 7); c.fill();
    sub(c, null, 'placa', 0, 0.9, 0.15, 0, 0.6);
  });
  def('barragemMangue', [-34, -46, 34, 40], (c, r) => {
    piso(c, 0.02, 0.8, 0.98, 0.98, '#6a5a3a', false);
    sub(c, r, 'barragemMare', 0, 0, 0, 0);
    [[0.12, 0.9], [0.4, 0.95], [0.75, 0.92]].forEach((q) => { const p = P(q[0], q[1], 0); c.strokeStyle = '#6a6460'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 1, p[1] - 12); c.moveTo(p[0], p[1] - 7); c.lineTo(p[0] + 5, p[1] - 11); c.stroke(); });
    placaAviso(c, 0.95, 0.95);
  });
  def('viveiroMangue', [-34, -44, 34, 34], (c) => {
    agua(c, [[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95]], 'rgba(90,160,150,.7)');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const p = P(0.18 + i * 0.2, 0.2 + j * 0.26, 0);
      c.fillStyle = '#2a2a2a'; c.fillRect(p[0] - 2, p[1] - 3, 4, 3);
      c.strokeStyle = '#6a8a3a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(p[0], p[1] - 3); c.lineTo(p[0], p[1] - 11); c.stroke();
      bolha(c, p[0], p[1] - 12, 2.6, '#4fae3f');
    }
    const k = { topo: 'rgba(30,50,30,.45)', esq: 'rgba(30,50,30,.25)', dir: 'rgba(30,50,30,.35)' };
    caixa(c, 0.06, 0.06, 0.94, 0.94, 18, 19, k, { brilho: false });
    [[0.06, 0.94], [0.94, 0.94], [0.94, 0.06]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#7a4b2a'; c.fillRect(p[0] - 0.8, p[1] - 19, 1.6, 19); });
  });
  def('camarao', [-34, -30, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#8a7a5a', false);
    [[0.08, 0.08], [0.52, 0.08], [0.08, 0.52], [0.52, 0.52]].forEach((q) => {
      piso(c, q[0], q[1], q[0] + 0.4, q[1] + 0.4, '#6a8a6a', 'rgba(60,40,20,.5)');
      const p = P(q[0] + 0.2, q[1] + 0.2, 1); c.strokeStyle = '#f0f0f0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0] - 5, p[1]); c.lineTo(p[0] + 5, p[1]); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(p[0] - 5, p[1], 1.4, 0, 7); c.arc(p[0] + 5, p[1], 1.4, 0, 7); c.fill();
    });
    [[0.48, 0.03], [0.03, 0.48], [0.95, 0.5]].forEach((q) => toco(c, q[0], q[1]));
  });

  // =========================================================
  // GEOTERMIA
  // =========================================================
  def('geotermicaRisco', [-70, -100, 70, 70], (c, r) => {
    // cicatriz de deslizamento na encosta
    poly(c, [P(0.0, 1.1, 0), P(0.6, 1.0, 0), P(1.0, 2.0, 0), P(0.0, 2.0, 0)], '#a8845a', false);
    poly(c, [P(1.55, 1.3, 0), P(2.0, 1.1, 0), P(2.0, 2.0, 0), P(1.3, 2.0, 0)], '#9a7a52', false);
    sub(c, r, 'geotermica', 0, 0, 0, 0);
    [[0.15, 1.45], [0.35, 1.75], [0.6, 1.9], [1.5, 1.7], [1.7, 1.95], [1.95, 1.35], [0.1, 1.85]].forEach((q, i) => { const p = P(q[0], q[1], 0); bolha(c, p[0], p[1] - 3, 3 + (i % 3), '#7a6a58', 0.25); });
    // rachaduras e blocos de rocha da encosta
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.4;
    [[[0.1, 1.9], [0.3, 1.7], [0.25, 1.5]], [[1.6, 1.9], [1.75, 1.7], [1.9, 1.75]]].forEach((L) => { c.beginPath(); L.forEach((q, i) => { const p = P(q[0], q[1], 0); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); });
    [[1.85, 1.2], [1.9, 1.45], [1.7, 1.9], [0.05, 1.2]].forEach((q, i) => { const p = P(q[0], q[1], 0); bolha(c, p[0], p[1] - 4, 5 + (i % 2) * 2, '#8a7a6a', 0.25); });
    placaAviso(c, 1.95, 1.95); placaAviso(c, 0.05, 1.95);
  }, { fumaca: [[1.5, 0.5, 48, 'vapor'], [0.5, 0.35, 22, 'vapor']] });
  def('geotermicaBinaria', [-70, -70, 70, 70], (c) => {
    sombra(c, 1, 1, 64, 30, 0.25);
    caixa(c, 0.15, 1.05, 0.95, 1.85, 0, 22, '#e8eef4');
    janelasE(c, 0.15, 0.95, 1.85, 4, 18, 1, 3, '#7fc4ef');
    telhado(c, 0.15, 1.05, 0.95, 1.85, 22, 6, '#3a8ad0', 0);
    // condensadores a ar (grade de ventiladores)
    caixa(c, 0.15, 0.15, 1.85, 0.85, 8, 20, '#b8c2cc');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ventilador(c, 0.38 + i * 0.4, 0.33 + j * 0.34, 20, 7, '#4a5566');
    [[0.1, 0.15], [1.8, 0.15], [0.1, 0.8], [1.8, 0.8]].forEach((q) => { const p = P(q[0] + 0.05, q[1] + 0.05, 0); c.fillStyle = '#7a8590'; c.fillRect(p[0] - 1, p[1] - 8, 2, 8); });
    // tubos do fluido (circuito fechado)
    cano(c, [[1.1, 1.3, 6], [1.6, 1.3, 6], [1.6, 0.9, 6]], '#e0552a', 3);
    cano(c, [[1.1, 1.6, 6], [1.85, 1.6, 6], [1.85, 0.9, 6]], '#3a8ad0', 3);
    cilindro(c, 1.45, 1.75, 6, 0, 16, '#d8dde2');
    placaIcone(c, 0.55, 1.45, 36, 'ciclo', '#3a8ad0');
  });
  def('descarteGeo', [-34, -44, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#b3a68a', false);
    agua(c, [[0.4, 0.02], [0.75, 0.02], [0.8, 0.98], [0.45, 0.98]], '#6aa0b8');
    // crosta de sais
    c.fillStyle = 'rgba(255,255,255,.75)'; [[0.42, 0.3], [0.5, 0.55], [0.6, 0.8]].forEach((q) => { const p = P(q[0], q[1], 0); c.beginPath(); c.ellipse(p[0], p[1], 6, 2.5, 0, 0, 7); c.fill(); });
    cano(c, [[0.05, 0.4, 4], [0.45, 0.4, 4]], '#9aa5b0', 4);
    cilindro(c, 0.15, 0.15, 6, 0, 16, '#d23b2f');
    vapor(c, 0.48, 0.42, 4, 3);
  });
  def('secadorGeo', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.22);
    caixa(c, 0.1, 0.12, 0.5, 0.5, 0, 16, '#f0e2c8');
    telhado(c, 0.1, 0.12, 0.5, 0.5, 16, 7, '#b0463a', 1);
    // mesas de secagem com frutas
    [[0.55, 0.15], [0.55, 0.5], [0.15, 0.62]].forEach((q, i) => {
      caixa(c, q[0], q[1], q[0] + 0.36, q[1] + 0.28, 6, 8, '#b0844f', { brilho: false });
      for (let k = 0; k < 6; k++) { const p = P(q[0] + 0.05 + (k % 3) * 0.12, q[1] + 0.06 + Math.floor(k / 3) * 0.12, 8); c.fillStyle = ['#f0a21f', '#e04a3a', '#d8b03a'][i]; c.beginPath(); c.arc(p[0], p[1] - 1, 1.6, 0, 7); c.fill(); }
    });
    cano(c, [[0.05, 0.9, 3], [0.3, 0.9, 3], [0.3, 0.5, 3]], '#e0552a', 2.2);
    vapor(c, 0.3, 0.3, 18, 2);
  });
  def('redeCalor', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.22);
    piso(c, 0.05, 0.05, 0.95, 0.95, '#c9c4ba');
    caixa(c, 0.12, 0.12, 0.5, 0.5, 0, 18, '#e8e2d2');
    janelasE(c, 0.12, 0.5, 0.5, 4, 14, 1, 1, '#7fc4ef');
    cilindro(c, 0.72, 0.28, 8, 0, 22, '#cfd6dd', { faixas: [[0.3, 0.4, '#e0552a'], [0.6, 0.7, '#3a8ad0']] });
    cano(c, [[0.5, 0.35, 6], [0.95, 0.35, 6], [0.95, 0.95, 0]], '#e0552a', 2.6);
    cano(c, [[0.35, 0.5, 4], [0.35, 0.95, 4], [0.05, 0.95, 0]], '#3a8ad0', 2.6);
    placaIcone(c, 0.3, 0.3, 26, 'casa', '#e0552a');
  });

  // =========================================================
  // CANA E BIOMASSA
  // =========================================================
  def('biogasVinhaca', [-34, -40, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#5a3a22', CONTORNO);
    const p = P(0.45, 0.5, 0); const g = c.createRadialGradient(p[0] - 6, p[1] - 12, 2, p[0], p[1], 24);
    g.addColorStop(0, '#5a5a5a'); g.addColorStop(1, '#1e1e1e');
    c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], 24, 12, 0, Math.PI, 0); c.ellipse(p[0], p[1], 24, 12, 0, 0, Math.PI); c.fill();
    c.beginPath(); c.ellipse(p[0], p[1] - 4, 20, 14, 0, Math.PI, 0); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    cano(c, [[0.75, 0.5, 6], [0.92, 0.5, 6], [0.92, 0.2, 6]], '#2e9e4a', 2.4);
    cilindro(c, 0.88, 0.16, 3, 0, 26, '#9aa5b0', { oco: '#333' });
  }, { fogo: [[0.88, 0.16, 28]] });
  def('biogasAterro', [-34, -50, 34, 34], (c) => {
    const p = P(0.4, 0.4, 0);
    c.fillStyle = '#7a9a4a'; c.beginPath(); c.ellipse(p[0], p[1], 26, 13, 0, 0, 7); c.fill();
    c.fillStyle = '#93b85a'; c.beginPath(); c.ellipse(p[0], p[1] - 5, 20, 12, 0, Math.PI, 0); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    [[-10, -6], [4, -12], [12, -4]].forEach((d) => { c.fillStyle = '#d0d4d8'; c.fillRect(p[0] + d[0] - 1, p[1] + d[1] - 8, 2, 8); c.fillStyle = '#ffd23f'; c.fillRect(p[0] + d[0] - 2, p[1] + d[1] - 10, 4, 2); });
    // motogeradores em contêiner
    caixa(c, 0.55, 0.55, 0.95, 0.75, 0, 12, '#2e9e4a');
    caixa(c, 0.55, 0.78, 0.95, 0.98, 0, 12, '#2e9e4a');
    [0.65, 0.88].forEach((y) => cilindro(c, 0.9, y, 1.6, 12, 20, '#555', { oco: '#222' }));
    cano(c, [[0.4, 0.4, 2], [0.55, 0.65, 2]], '#ffd23f', 2);
    placaIcone(c, 0.75, 0.66, 22, 'raio', '#2e9e4a');
  });
  def('biometano', [-34, -66, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    piso(c, 0.04, 0.04, 0.96, 0.96, '#b9b4aa');
    [0.2, 0.42].forEach((x) => cilindro(c, x, 0.22, 5.5, 0, 46, '#e8eef4', { faixas: [[0.82, 0.9, '#2e9e4a']] }));
    caixa(c, 0.55, 0.1, 0.9, 0.4, 0, 14, '#d8dde2');
    // bomba de abastecimento + caminhão a biometano
    caixa(c, 0.15, 0.55, 0.25, 0.65, 0, 14, '#2e9e4a');
    caminhao(c, 0.6, 0.8, '#5fc46a', '#2e9e4a');
    placaIcone(c, 0.72, 0.25, 24, 'folha', '#2e9e4a');
  });
  def('vinhacaRio', [-34, -30, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#9ab86a', false);
    agua(c, [[0.4, 0.02], [0.7, 0.02], [0.75, 0.98], [0.45, 0.98]], '#5aa8d8');
    agua(c, [[0.42, 0.35], [0.7, 0.4], [0.74, 0.98], [0.45, 0.98]], '#7a5030');
    cano(c, [[0.05, 0.38, 3], [0.45, 0.38, 3]], '#7a8590', 4);
    [[0.55, 0.7], [0.62, 0.88]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#c8ccd2'; c.beginPath(); c.ellipse(p[0], p[1], 3.4, 1.4, 0.3, 0, 7); c.fill(); c.strokeStyle = '#555'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(p[0] - 1, p[1] - 1); c.lineTo(p[0] + 1, p[1] + 1); c.moveTo(p[0] + 1, p[1] - 1); c.lineTo(p[0] - 1, p[1] + 1); c.stroke(); });
  });
  def('palhada', [-34, -20, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#8a6a42', false);
    for (let i = 0; i < 70; i++) { const p = P(r.range(0.06, 0.94), r.range(0.06, 0.94), 0); c.strokeStyle = r() < 0.5 ? '#e8c86a' : '#d4b058'; c.lineWidth = 1; const a = r() * 3.14; c.beginPath(); c.moveTo(p[0] - Math.cos(a) * 4, p[1] - Math.sin(a) * 2); c.lineTo(p[0] + Math.cos(a) * 4, p[1] + Math.sin(a) * 2); c.stroke(); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const p = P(0.15 + i * 0.23, 0.15 + j * 0.23, 0); c.strokeStyle = '#6ab83a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 2, p[1] - 7); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 2, p[1] - 6); c.stroke(); }
  });
  def('pulverizacao', [-34, -60, 34, 34], (c, r) => {
    sub(c, r, 'canavial', 0, 0, 0, 0);
    // nuvem de agrotóxico e avião agrícola
    const n = P(0.5, 0.5, 20); const g = c.createRadialGradient(n[0], n[1], 2, n[0], n[1], 28);
    g.addColorStop(0, 'rgba(230,240,180,.65)'); g.addColorStop(1, 'rgba(230,240,180,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(n[0], n[1], 30, 14, 0, 0, 7); c.fill();
    const a = P(0.3, 0.2, 44);
    c.fillStyle = '#f0b419'; c.beginPath(); c.ellipse(a[0], a[1], 10, 2.8, -0.15, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = '#d99a10'; c.fillRect(a[0] - 3, a[1] - 9, 4, 18);
    c.fillStyle = '#8ad0ff'; c.beginPath(); c.arc(a[0] + 4, a[1] - 1, 1.6, 0, 7); c.fill();
    c.strokeStyle = 'rgba(230,240,180,.8)'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(a[0] - 1 + i * 3, a[1] + 3); c.lineTo(a[0] - 4 + i * 5, a[1] + 16); c.stroke(); }
  });
  def('canaMonocultura', [-34, -32, 34, 34], (c) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
      const p = P(0.06 + i * 0.12, 0.08 + j * 0.16, 0);
      c.strokeStyle = j % 2 ? '#8ab02e' : '#9cc03a'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 1, p[1] - 20); c.moveTo(p[0], p[1] - 10); c.lineTo(p[0] + 4, p[1] - 18); c.stroke();
    }
  });
  def('soja', [-34, -50, 34, 34], (c, r) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#8a6a42', false);
    camposLinhas(c, r, 0.02, 0.15, 0.98, 0.98, '#7ab83a', 5);
    cilindro(c, 0.12, 0.1, 6, 0, 30, '#d6dce2', { topo: '#a8b0b8' });
    cilindro(c, 0.3, 0.06, 5, 0, 24, '#d6dce2', { topo: '#a8b0b8' });
  });
  def('fertirrigacao', [-34, -40, 34, 34], (c, r) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#9ab86a', false);
    for (let i = 0; i < 4; i++) { linha(c, [[0.05, 0.2 + i * 0.22, 1], [0.95, 0.2 + i * 0.22, 1]], '#6a4428', 1.6); for (let k = 0; k < 8; k++) { const p = P(0.1 + k * 0.11, 0.2 + i * 0.22 + 0.05, 0); c.strokeStyle = '#7aa82a'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 9); c.stroke(); } }
    // carretel de mangueira
    const p = P(0.8, 0.25, 8); c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(p[0], p[1], 7, 0, 7); c.fill(); c.strokeStyle = '#7a1a1a'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(p[0], p[1], 3, 0, 7); c.fill();
    cilindro(c, 0.2, 0.15, 6, 0, 14, '#7a5030');
    placaIcone(c, 0.2, 0.15, 24, 'gota', '#8a5a3a');
  });

  // =========================================================
  // FLORESTA E CAMPO
  // =========================================================
  def('loteamento', [-70, -56, 70, 70], (c, r) => {
    piso(c, 0, 0, 2, 2, '#b08a5a', false);
    linha(c, [[0, 1.0], [2, 1.0]], '#8a8478', 6);
    [[0.1, 0.1, 0], [0.8, 0.1, 1], [1.2, 1.15, 2]].forEach((q) => { c.save(); const p = P(q[0], q[1], 0); c.translate(p[0], p[1]); c.scale(0.95, 0.95); casa(c, r, q[2], false); c.restore(); });
    [[1.7, 0.2], [1.8, 0.5], [0.2, 1.3], [0.5, 1.7], [0.9, 1.85], [1.85, 1.85]].forEach((q) => toco(c, q[0], q[1]));
    tora(c, 0.3, 1.6);
  });
  def('parqueTrilha', [-34, -50, 34, 34], (c, r) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#7ccf5a', false);
    c.strokeStyle = '#d9c39a'; c.lineWidth = 4; c.beginPath(); const a = P(0.05, 0.9, 0), b = P(0.5, 0.5, 0), d = P(0.95, 0.15, 0); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0] + 10, b[1] + 6, d[0], d[1]); c.stroke();
    [[0.2, 0.2], [0.75, 0.75], [0.15, 0.55], [0.55, 0.15], [0.85, 0.45]].forEach((q, i) => arvorinha(c, q[0], q[1], 0.9 + (i % 2) * 0.2));
    const s = P(0.45, 0.75, 0); c.fillStyle = '#8a5a32'; c.fillRect(s[0] - 5, s[1] - 4, 10, 2); c.fillRect(s[0] - 4, s[1] - 2, 1, 2); c.fillRect(s[0] + 3, s[1] - 2, 1, 2);
    sub(c, null, 'placa', 0, 0.9, 0.9, 0, 0.55);
  });
  def('regeneracao', [-70, -44, 70, 70], (c, r) => {
    piso(c, 0, 0, 2, 2, '#8aa85a', false);
    const itens = [];
    for (let i = 0; i < 26; i++) itens.push([r.range(0.15, 1.85), r.range(0.15, 1.85), r()]);
    itens.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    itens.forEach((it) => { if (it[2] < 0.4) sub(c, r, 'muda', 0, it[0], it[1], 0, 0.8); else if (it[2] < 0.75) sub(c, r, 'arbusto', Math.floor(it[2] * 10), it[0], it[1], 0, 0.9); else arvorinha(c, it[0], it[1], 0.7 + it[2] * 0.3); });
    // cerca
    c.strokeStyle = '#7a4b2a'; c.lineWidth = 1;
    [[0, 0, 2, 0], [2, 0, 2, 2], [0, 2, 2, 2], [0, 0, 0, 2]].forEach((s) => {
      for (let t = 0; t <= 1.001; t += 0.125) { const p = P(U.lerp(s[0], s[2], t), U.lerp(s[1], s[3], t), 0); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 7); c.stroke(); }
      [4, 6.5].forEach((z) => { const a = P(s[0], s[1], z), b = P(s[2], s[3], z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
    });
  });
  def('ilpf', [-70, -70, 70, 70], (c, r) => {
    piso(c, 0, 0, 2, 2, '#9cc85a', false);
    camposLinhas(c, r, 1.1, 0.1, 1.9, 0.9, '#d8c040', 4);
    const itens = [];
    for (let i = 0; i < 6; i++) { itens.push([0.15 + i * 0.32, 1.0, 'e']); itens.push([0.15 + i * 0.32, 1.9, 'e']); }
    itens.push([0.5, 1.45, 'v'], [1.2, 1.4, 'v'], [1.6, 1.55, 'v'], [0.4, 0.4, 'v']);
    itens.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    itens.forEach((it) => {
      if (it[2] === 'v') { vaca(c, r, it[0], it[1], 0.7); return; }
      const p = P(it[0], it[1], 0);
      c.fillStyle = '#d8d0c0'; c.fillRect(p[0] - 1, p[1] - 30, 2, 30);
      bolha(c, p[0], p[1] - 30, 4.5, '#3a8f5c'); bolha(c, p[0], p[1] - 38, 3.6, '#4fae6a'); bolha(c, p[0], p[1] - 22, 4, '#2f7a4a');
    });
  });
  def('gadoMargem', [-34, -36, 34, 34], (c, r) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#8a6a42', false);
    agua(c, [[0.6, 0.02], [0.98, 0.02], [0.98, 0.98], [0.7, 0.98]], '#9a8a5a');
    for (let i = 0; i < 14; i++) { const p = P(r.range(0.1, 0.6), r.range(0.1, 0.9), 0); c.fillStyle = 'rgba(60,40,20,.5)'; c.beginPath(); c.ellipse(p[0], p[1], 1.6, 0.9, 0, 0, 7); c.fill(); }
    vaca(c, r, 0.35, 0.35, 0.8); vaca(c, r, 0.55, 0.75, 0.8);
  });
  def('agroindustria', [-34, -60, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.1, 0.72, 0.72, 0, 20, '#f4e8d0');
    janelasE(c, 0.1, 0.72, 0.72, 4, 15, 1, 2, '#7fc4ef');
    telhado(c, 0.1, 0.1, 0.72, 0.72, 20, 10, '#8a3a6a', 0);
    painelSolar(c, 0.15, 0.15, 0.5, 0.2, 26, 4);
    // cestos de açaí e sacas de castanha
    [[0.82, 0.25], [0.88, 0.45]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#b08a5a'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 4, 2, 0, 0, 7); c.rect(p[0] - 4, p[1] - 3, 8, 3); c.fill(); c.fillStyle = '#4a1a4a'; c.beginPath(); c.ellipse(p[0], p[1] - 3.5, 3.4, 1.6, 0, 0, 7); c.fill(); });
    [[0.3, 0.85], [0.45, 0.88], [0.6, 0.85]].forEach((q) => { const p = P(q[0], q[1], 0); bolha(c, p[0], p[1] - 3, 3.6, '#c8a070', 0.2); });
    placaIcone(c, 0.41, 0.72, 12, 'folha', '#8a3a6a');
  });

  // =========================================================
  // RESÍDUOS E INDÚSTRIA
  // =========================================================
  def('fabricaReciclados', [-66, -110, 66, 66], (c, r) => {
    sub(c, r, 'fabrica', 0, 0, 0, 0);
    // fardos coloridos de recicláveis
    [['#3a8ae0', 0.15], ['#e04a3a', 0.35], ['#f0c419', 0.55], ['#2fa05a', 0.75]].forEach((b) => caixa(c, 1.5, b[1] + 1.0, 1.68, b[1] + 1.16, 0, 9, b[0]));
    placaIcone(c, 0.75, 1.85, 22, 'ciclo', '#2e9e4a');
  }, { fumaca: [[1.65, 1.55, 92, 'vapor']] });
  def('simbiose', [-34, -56, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.08, 0.08, 0.42, 0.42, 0, 22, '#c7b9a6'); janelasE(c, 0.08, 0.42, 0.42, 4, 18, 1, 2, '#5f7d99');
    caixa(c, 0.58, 0.58, 0.92, 0.92, 0, 18, '#b8c4ae'); janelasE(c, 0.58, 0.92, 0.92, 4, 14, 1, 2, '#5f7d99');
    // esteira entre as fábricas
    cano(c, [[0.42, 0.3, 12], [0.7, 0.3, 12], [0.7, 0.58, 12]], '#f0b419', 3);
    cano(c, [[0.3, 0.42, 6], [0.3, 0.7, 6], [0.58, 0.7, 6]], '#2fa05a', 3);
    placaIcone(c, 0.75, 0.25, 22, 'ciclo', '#2fa05a');
  });
  def('logisticaReversa', [-34, -56, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.1, 0.65, 0.6, 0, 22, '#e2ecf4');
    janelasE(c, 0.1, 0.65, 0.6, 4, 16, 1, 2, '#7fc4ef');
    telhado(c, 0.1, 0.1, 0.65, 0.6, 22, 8, '#2f7ad2', 0);
    // pilha de pneus e coletor de pilhas
    for (let i = 0; i < 3; i++) cilindro(c, 0.85, 0.25, 6, i * 3.5, i * 3.5 + 3.4, '#2a2a2a', { oco: '#555' });
    caixa(c, 0.75, 0.55, 0.92, 0.72, 0, 10, '#f0c419');
    caminhao(c, 0.4, 0.85, '#2f7ad2');
    placaIcone(c, 0.38, 0.6, 14, 'ciclo', '#2f7ad2');
  });
  def('flare', [-34, -84, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 26, 12, 0.22);
    piso(c, 0.1, 0.1, 0.9, 0.9, '#a9a49a');
    cilindro(c, 0.65, 0.35, 3.4, 0, 60, '#b8bec6', { faixas: [[0.9, 1, '#d23b2f']] });
    caixa(c, 0.15, 0.5, 0.5, 0.85, 0, 10, '#d8dde2');
    cano(c, [[0.05, 0.7, 4], [0.15, 0.7, 4]], '#ffd23f', 2.4); cano(c, [[0.5, 0.65, 6], [0.65, 0.65, 6], [0.65, 0.4, 6]], '#ffd23f', 2.4);
    placaAviso(c, 0.9, 0.9);
  }, { fogo: [[0.65, 0.35, 62]] });
  def('feira', [-34, -44, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#e9dcc2');
    tenda(c, 0.1, 0.1, '#e04a3a'); tenda(c, 0.55, 0.1, '#2f7ad2'); tenda(c, 0.1, 0.58, '#f0a21f'); tenda(c, 0.58, 0.58, '#2fa05a');
    const p = P(0.48, 0.5, 0); c.fillStyle = '#7a4b2a'; c.fillRect(p[0] - 0.7, p[1] - 14, 1.4, 14); c.fillStyle = '#fff'; c.fillRect(p[0] - 7, p[1] - 20, 14, 7); ERS.drawIcon(c, 'ciclo', p[0], p[1] - 16.5, 6, '#2fa05a', 3);
  });
  def('lagoaDejetos', [-34, -44, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#8a7a5a', false);
    agua(c, [[0.08, 0.35], [0.6, 0.3], [0.92, 0.6], [0.6, 0.95], [0.15, 0.9]], '#5a5a28');
    agua(c, [[0.25, 0.5], [0.55, 0.45], [0.7, 0.65], [0.4, 0.8]], '#6a7a2a');
    caixa(c, 0.1, 0.05, 0.6, 0.28, 0, 12, '#e8d8c0'); telhado(c, 0.1, 0.05, 0.6, 0.28, 12, 6, '#8a6a4a', 0);
    c.fillStyle = '#222'; [[2, -28], [8, -32], [-4, -30], [12, -26]].forEach((d) => { const p = P(0.55, 0.6, 0); c.beginPath(); c.arc(p[0] + d[0], p[1] + d[1], 0.9, 0, 7); c.fill(); });
  }, { fumaca: [[0.5, 0.6, 2, 'escura']] });
  def('despejoMina', [-34, -30, 34, 34], (c) => {
    piso(c, 0.02, 0.02, 0.98, 0.98, '#b5784a', false);
    agua(c, [[0.4, 0.02], [0.7, 0.02], [0.75, 0.98], [0.45, 0.98]], '#5aa8d8');
    agua(c, [[0.05, 0.5], [0.5, 0.42], [0.72, 0.6], [0.75, 0.98], [0.45, 0.98], [0.1, 0.7]], '#d8782a');
    cano(c, [[0.02, 0.55, 3], [0.15, 0.55, 3]], '#7a8590', 4);
    [[0.25, 0.2], [0.85, 0.3], [0.88, 0.8]].forEach((q) => { const p = P(q[0], q[1], 0); bolha(c, p[0], p[1] - 3, 4, '#9a4a2a', 0.25); });
  });
  def('caminhaoEletrico', [-34, -50, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#a9a49a');
    caixa(c, 0.1, 0.1, 0.3, 0.3, 0, 24, '#2fa05a');
    const s = P(0.2, 0.3, 14); c.fillStyle = '#7ae8a0'; c.fillRect(s[0] - 3, s[1] - 4, 6, 3); emissivo([[s[0] - 3, s[1] - 4], [s[0] + 3, s[1] - 4], [s[0] + 3, s[1] - 1], [s[0] - 3, s[1] - 1]], '#7ae8a0');
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.6; const a = P(0.3, 0.25, 10), b = P(0.5, 0.55, 8); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[0] + 10, b[1], b[0], b[1]); c.stroke();
    sub(c, null, 'caminhaoMina', 0, 0.6, 0.65, 0, 1.1);
    const p = P(0.6, 0.65, 0); c.fillStyle = '#2fa05a'; c.fillRect(p[0] - 18, p[1] - 12, 22, 2.4);
    placaIcone(c, 0.2, 0.2, 32, 'raio', '#2fa05a');
  });
  def('recuperarMina', [-70, -40, 70, 70], (c, r) => {
    const p = P(1, 1, 0);
    ['#a8b878', '#b8a07a', '#9ab06a', '#a88a62'].forEach((k, i) => { c.fillStyle = k; c.beginPath(); c.ellipse(p[0], p[1] + i * 3, 60 - i * 13, 29 - i * 6.5, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(60,80,30,.4)'; c.lineWidth = 1.2; c.stroke(); });
    for (let k = 0; k < 3; k++) { const rx = 52 - k * 13, ry = 25 - k * 6.5; for (let i = 0; i < 9 - k * 2; i++) { const a = Math.PI * (0.1 + 0.8 * i / (8 - k * 2)); const s = SPR.defs.muda; c.save(); c.translate(p[0] + Math.cos(a) * rx, p[1] + k * 3 + Math.sin(a) * ry); c.scale(0.8, 0.8); s.desenho(c, r, 0); c.restore(); } }
    c.fillStyle = '#5ab4e6'; c.beginPath(); c.ellipse(p[0], p[1] + 10, 9, 4, 0, 0, 7); c.fill();
  });
  def('reatorModular', [-70, -84, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.25);
    piso(c, 0.05, 0.05, 1.95, 1.95, '#c9c4ba');
    [[0.6, 0.6], [1.3, 0.6]].forEach((q) => {
      cilindro(c, q[0], q[1], 14, 0, 22, '#e2e6ea', { semTopo: true });
      const p = P(q[0], q[1], 22); const g = c.createLinearGradient(p[0] - 14, 0, p[0] + 14, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a8b0b8');
      c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], 14, 14, 0, Math.PI, 0); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    });
    caixa(c, 0.4, 1.2, 1.6, 1.8, 0, 18, '#d8d2c4');
    janelasE(c, 0.4, 1.6, 1.8, 4, 14, 1, 4, '#7fc4ef');
    // cerca de segurança
    c.strokeStyle = '#7d8590'; c.lineWidth = 0.8;
    [[0.05, 1.95, 1.95, 1.95], [1.95, 0.05, 1.95, 1.95]].forEach((s) => { for (let t = 0; t <= 1.001; t += 0.1) { const a = P(U.lerp(s[0], s[2], t), U.lerp(s[1], s[3], t), 0); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 8); c.stroke(); } const a = P(s[0], s[1], 8), b = P(s[2], s[3], 8); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
    placaIcone(c, 1.0, 1.5, 30, 'nuclear', '#e0a400');
  }, { fumaca: [[0.95, 0.6, 30, 'vapor']] });

  // =========================================================
  // DATA CENTER, CIDADE E REDE
  // =========================================================
  def('resfriamentoReuso', [-34, -44, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.22);
    piso(c, 0.04, 0.04, 0.96, 0.96, '#c9c4ba');
    [[0.1, 0.1], [0.1, 0.52]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.5, q[1] + 0.36, 0, 12, '#dfe6ec'); ventilador(c, q[0] + 0.14, q[1] + 0.18, 12, 5); ventilador(c, q[0] + 0.36, q[1] + 0.18, 12, 5); });
    cilindro(c, 0.8, 0.3, 7, 0, 18, '#8fd0f0', { topo: '#bfe6ff' });
    cano(c, [[0.6, 0.3, 6], [0.72, 0.3, 6]], '#3a8ad0', 2.4); cano(c, [[0.6, 0.7, 4], [0.85, 0.7, 4], [0.85, 0.4, 4]], '#3a8ad0', 2.4);
    placaIcone(c, 0.8, 0.3, 26, 'ciclo', '#3a8ad0');
  });
  def('resfriamentoLiquido', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.1, 0.62, 0.9, 0, 24, { topo: '#3a4256', esq: '#2a3044', dir: '#1d2233' });
    for (let i = 0; i < 3; i++) { const q = [P(0.14 + i * 0.16, 0.9, 6), P(0.26 + i * 0.16, 0.9, 6), P(0.26 + i * 0.16, 0.9, 20), P(0.14 + i * 0.16, 0.9, 20)]; poly(c, q, '#3ad1ff', false); emissivo(q, '#7ae8ff'); }
    caixa(c, 0.7, 0.2, 0.92, 0.5, 0, 16, '#e8eef4');
    cano(c, [[0.62, 0.3, 14], [0.75, 0.3, 16]], '#2fa0d8', 2.6); cano(c, [[0.62, 0.7, 6], [0.85, 0.7, 6], [0.85, 0.5, 6]], '#5ad0ff', 2.6);
    placaIcone(c, 0.81, 0.35, 24, 'gota', '#2fa0d8');
  });
  def('calorCasas', [-34, -56, 34, 34], (c, r) => {
    c.save(); const q = P(0.35, 0.35, 0); c.translate(q[0], q[1]); c.scale(0.6, 0.6); casa(c, r, 3, false); c.restore();
    cilindro(c, 0.25, 0.3, 8, 0, 30, '#c8ccd2', { faixas: [[0.2, 0.28, '#e0552a'], [0.72, 0.8, '#e0552a']], topo: '#e8eaee' });
    cano(c, [[0.25, 0.4, 8], [0.25, 0.65, 8], [0.45, 0.65, 8]], '#e0552a', 2.4);
    vapor(c, 0.25, 0.3, 32, 2);
    placaIcone(c, 0.25, 0.3, 42, 'servidor', '#e0552a');
  });
  def('estufaPiscina', [-34, -40, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#d8d2c4');
    const p = P(0.7, 0.68, 0); c.fillStyle = '#c8c4bc'; c.beginPath(); c.ellipse(p[0], p[1], 15, 7.5, 0, 0, 7); c.fill(); c.fillStyle = '#4fc8f0'; c.beginPath(); c.ellipse(p[0], p[1], 12.5, 6, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(p[0] - 6, p[1] - 1); c.lineTo(p[0] + 4, p[1] - 2); c.stroke();
    const k = { topo: 'rgba(200,240,255,.75)', esq: 'rgba(170,220,240,.7)', dir: 'rgba(130,190,220,.7)' };
    for (let i = 0; i < 3; i++) { const q = P(0.12 + i * 0.12, 0.48, 3); c.fillStyle = '#4fae3f'; c.beginPath(); c.arc(q[0], q[1] - 2, 2.6, 0, 7); c.fill(); }
    caixa(c, 0.08, 0.1, 0.5, 0.5, 0, 12, k);
    telhado(c, 0.08, 0.1, 0.5, 0.5, 12, 7, '#cdeefc', 0, 'rgba(200,240,255,.7)');
    cano(c, [[0.5, 0.3, 4], [0.7, 0.3, 4], [0.7, 0.5, 2]], '#e0552a', 2.2);
    vapor(c, 0.7, 0.68, 3, 2);
  });
  def('celulaCombustivel', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.22);
    piso(c, 0.04, 0.04, 0.96, 0.96, '#b9b4aa');
    caixa(c, 0.1, 0.45, 0.9, 0.9, 0, 16, '#f4f6f8'); janelasE(c, 0.1, 0.9, 0.9, 4, 12, 1, 4, '#a8e0f8');
    for (let i = 0; i < 4; i++) cilindro(c, 0.18 + i * 0.18, 0.2, 4, 0, 26, '#e8eef4', { faixas: [[0.75, 0.85, '#2fa0d8']] });
    placaIcone(c, 0.5, 0.9, 26, 'gota', '#2fa0d8');
  });
  def('pracaArborizada', [-34, -50, 34, 34], (c, r) => {
    sub(c, r, 'praca', 0, 0, 0, 0);
    [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]].forEach((q, i) => arvorinha(c, q[0], q[1], 1.05, VERDES[i]));
    [[0.5, 0.15], [0.15, 0.5]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#8a5a32'; c.fillRect(p[0] - 5, p[1] - 4, 10, 2); });
  });
  def('estacaoSismica', [-34, -76, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 26, 12, 0.22);
    piso(c, 0.06, 0.06, 0.94, 0.94, '#a9a49a');
    caixa(c, 0.15, 0.45, 0.6, 0.88, 0, 14, '#f4f0e6'); telhado(c, 0.15, 0.45, 0.6, 0.88, 14, 6, '#d9533b', 1);
    // mastro com antena parabólica e sensores
    const m = P(0.75, 0.3, 0); c.strokeStyle = '#7d8590'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] - 48); c.stroke();
    c.fillStyle = '#e8eef4'; c.beginPath(); c.ellipse(m[0] - 5, m[1] - 40, 7, 4, -0.6, 0, 7); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(m[0], m[1] - 48, 1.8, 0, 7); c.fill();
    // sismograma
    const s = P(0.38, 0.88, 7); c.strokeStyle = '#d23b2f'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(s[0] - 9, s[1]); [[-6, -3], [-4, 3], [-2, -5], [0, 4], [2, -2], [5, 1], [9, 0]].forEach((d) => c.lineTo(s[0] + d[0], s[1] + d[1])); c.stroke();
  });
  // =========================================================
  // ARRANJOS HÍBRIDOS (energias limpas combinadas)
  // =========================================================
  function paineis(c, x0, y0, x1, y1, passoX, passoY, z) {
    for (let x = x0; x + passoX * 0.85 <= x1 + 0.001; x += passoX) for (let y = y0; y + passoY * 0.7 <= y1 + 0.001; y += passoY) painelSolar(c, x, y, passoX * 0.86, passoY * 0.68, (z || 0) + 3, 5);
  }
  function baterias(c, x, y, n, cor) {
    for (let i = 0; i < n; i++) {
      const xx = x + i * 0.3;
      caixa(c, xx, y, xx + 0.26, y + 0.5, 0, 12, cor || '#f4f6f8');
      const p = P(xx + 0.08, y + 0.5, 8); c.fillStyle = '#2fd16a'; c.fillRect(p[0], p[1], 5, 2);
      emissivo([[p[0], p[1]], [p[0] + 5, p[1]], [p[0] + 5, p[1] + 2], [p[0], p[1] + 2]], '#7af0a8');
    }
  }
  function domo(c, x, y, r, cor) {
    const p = P(x, y, 0); const g = c.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.7, 1, p[0], p[1], r * 1.2);
    g.addColorStop(0, U.shade(cor, 0.35)); g.addColorStop(1, U.shade(cor, -0.25));
    c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], r, r * 0.9, 0, Math.PI, 0); c.closePath(); c.fill(); c.strokeStyle = CONTORNO; c.lineWidth = 0.8; c.stroke();
  }
  function tanquesH2(c, x, y) {
    cilindro(c, x, y, 5.5, 0, 26, '#f4f6f8', { faixas: [[0.72, 0.82, '#2fa0d8']] });
    cilindro(c, x + 0.25, y + 0.05, 5.5, 0, 22, '#f4f6f8', { faixas: [[0.72, 0.82, '#2fa0d8']] });
    const p = P(x + 0.12, y + 0.2, 10); c.fillStyle = '#2fa0d8'; c.font = 'bold 7px sans-serif'; c.fillText('H₂', p[0] - 4, p[1]);
  }
  function galpaoSolar(c, x0, y0, x1, y1, cor) {
    caixa(c, x0, y0, x1, y1, 0, 16, cor || '#e2e6ea');
    janelasE(c, x0, x1, y1, 3, 11, 1, Math.max(1, Math.round((x1 - x0) / 0.25)), '#7fc4ef');
    paineis(c, x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, 0.24, 0.2, 16);
  }

  def('microrrede', [-70, -60, 70, 70], (c, r) => {
    piso(c, 0.05, 0.05, 1.95, 1.95, '#cfe7b8', false);
    [[0.15, 0.1, 0], [0.95, 0.1, 1], [0.15, 0.95, 2]].forEach((q) => { c.save(); const p = P(q[0], q[1], 0); c.translate(p[0], p[1]); casa(c, r, q[2], true); c.restore(); });
    baterias(c, 1.15, 1.2, 2, '#e8f4ec');
    caixa(c, 1.3, 1.75, 1.55, 1.95, 0, 14, '#2fa05a');
    placaIcone(c, 1.42, 1.85, 22, 'rede', '#2fa05a');
    cano(c, [[0.6, 0.9, 1], [1.2, 1.3, 1]], '#3a3f48', 1.4);
  });
  def('solarBateria', [-70, -46, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.08, 0.08, 1.95, 1.25, 0.46, 0.3);
    baterias(c, 0.25, 1.4, 4);
    placaIcone(c, 1.6, 1.7, 20, 'bateria', '#2fa05a');
  });
  def('eolicaSolar', [-70, -130, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.1, 0.75, 1.9, 1.9, 0.44, 0.3);
    torre(c, 0.45, 0.35, '#f0a21f'); torre(c, 1.55, 0.35, '#f0a21f');
  }, { rotores: [[0.45, 0.35, 106, 28], [1.55, 0.35, 106, 28]] });
  def('eolicaH2', [-70, -130, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c4d0a8', false);
    caixa(c, 0.9, 1.2, 1.7, 1.85, 0, 16, '#e8eef4');
    janelasE(c, 0.9, 1.7, 1.85, 4, 12, 1, 3, '#a8e0f8');
    tanquesH2(c, 0.35, 1.35);
    cano(c, [[0.6, 1.5, 6], [0.9, 1.5, 6]], '#2fa0d8', 2.2);
    torre(c, 0.5, 0.45, '#2fa0d8'); torre(c, 1.5, 0.5, '#2fa0d8');
  }, { rotores: [[0.5, 0.45, 106, 28], [1.5, 0.5, 106, 28]] });
  def('hidroSolar', [-70, -56, 70, 70], (c) => {
    agua(c, [[0.02, 1.3], [1.98, 1.3], [1.98, 1.98], [0.02, 1.98]], '#3f9ad8');
    caixa(c, 0.02, 1.15, 1.98, 1.32, -6, 14, { topo: '#e6e2da', esq: '#c9c4ba', dir: '#a8a296' });
    piso(c, 0.02, 0.02, 1.98, 1.12, '#b9c99a', false);
    paineis(c, 0.1, 0.08, 1.9, 1.05, 0.45, 0.28);
    caixa(c, 1.55, 1.6, 1.9, 1.9, 0, 14, '#d8d2c4');
    placaIcone(c, 1.72, 1.75, 24, 'gota', '#2a7fd0');
  });
  def('reversivelSolar', [-70, -80, 70, 70], (c) => {
    // lago no alto
    caixa(c, 0.05, 0.05, 0.9, 0.75, 0, 30, { topo: '#3a9be0', esq: '#8fa07a', dir: '#6f805a' });
    poly(c, [P(0.12, 0.12, 30), P(0.83, 0.12, 30), P(0.83, 0.68, 30), P(0.12, 0.68, 30)], '#4aa8e0', false);
    const a = P(0.7, 0.7, 28), b = P(1.35, 1.4, 6); c.strokeStyle = '#5a6570'; c.lineWidth = 5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#9aa5b0'; c.lineWidth = 2; c.stroke();
    paineis(c, 1.0, 0.1, 1.95, 1.0, 0.45, 0.28);
    paineis(c, 0.1, 1.0, 0.95, 1.9, 0.42, 0.28);
    caixa(c, 1.2, 1.3, 1.85, 1.9, 0, 18, '#d8d2c4');
    placaIcone(c, 1.52, 1.6, 28, 'ciclo', '#2a7fd0');
  });
  def('portoSolar', [-70, -60, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9b4aa');
    galpaoSolar(c, 0.1, 0.1, 1.1, 0.75, '#e2ecf4');
    galpaoSolar(c, 0.1, 0.95, 0.9, 1.5, '#f0e2c8');
    baterias(c, 1.2, 0.2, 2);
    caixa(c, 1.25, 1.05, 1.9, 1.9, 0, 4, '#8a7a5a', { brilho: false });
    const t = P(1.45, 1.2, 0); c.fillStyle = '#5a6270'; c.fillRect(t[0] - 1.2, t[1] - 26, 2.4, 26);
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(t[0], t[1] - 24); const n2 = P(1.8, 1.7, 10); c.quadraticCurveTo((t[0] + n2[0]) / 2, n2[1] - 14, n2[0], n2[1]); c.stroke();
    placaIcone(c, 1.45, 1.2, 34, 'tomada', '#2fa05a');
  });
  def('eolicaCosteira', [-70, -130, 70, 70], (c, r) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#e8d8a8', false);
    for (let i = 0; i < 10; i++) { const p = P(r.range(0.1, 1.9), r.range(0.1, 1.9), 0); c.strokeStyle = '#8ab04a'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 2, p[1] - 6); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 2, p[1] - 5); c.stroke(); }
    baterias(c, 0.9, 1.35, 3);
    torre(c, 0.4, 0.5, '#2f7ad2'); torre(c, 1.5, 0.4, '#2f7ad2');
  }, { rotores: [[0.4, 0.5, 106, 28], [1.5, 0.4, 106, 28]] });
  def('geoSolar', [-70, -100, 70, 70], (c, r) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8b0a0', false);
    c.save(); c.translate(P(0, 0, 0)[0], 0); c.scale(0.62, 0.62); SPR.defs.geotermica.desenho(c, r, 0); c.restore();
    paineis(c, 1.05, 0.1, 1.95, 1.9, 0.44, 0.28);
    paineis(c, 0.1, 1.3, 1.0, 1.9, 0.44, 0.28);
  }, { fumaca: [[0.93, 0.31, 30, 'vapor']] });
  def('geoCascata', [-70, -70, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c8c0a8', false);
    caixa(c, 0.1, 0.1, 0.8, 0.7, 0, 22, '#e8e2d2'); janelasE(c, 0.1, 0.8, 0.7, 4, 18, 1, 3, '#7fc4ef'); telhado(c, 0.1, 0.1, 0.8, 0.7, 22, 7, '#2f9e8f', 0);
    const k = { topo: 'rgba(200,240,255,.75)', esq: 'rgba(170,220,240,.7)', dir: 'rgba(130,190,220,.7)' };
    [[1.0, 0.1], [1.0, 0.75]].forEach((q) => { for (let i = 0; i < 4; i++) { const p = P(q[0] + 0.1 + i * 0.2, q[1] + 0.5, 3); c.fillStyle = '#4fae3f'; c.beginPath(); c.arc(p[0], p[1] - 2, 2.6, 0, 7); c.fill(); } caixa(c, q[0], q[1], q[0] + 0.85, q[1] + 0.55, 0, 12, k); telhado(c, q[0], q[1], q[0] + 0.85, q[1] + 0.55, 12, 6, '#cdeefc', 0, 'rgba(200,240,255,.7)'); });
    [[0.15, 1.2], [0.55, 1.2], [0.15, 1.55]].forEach((q, i) => { caixa(c, q[0], q[1], q[0] + 0.32, q[1] + 0.26, 5, 7, '#b0844f', { brilho: false }); for (let k2 = 0; k2 < 4; k2++) { const p = P(q[0] + 0.06 + (k2 % 2) * 0.16, q[1] + 0.06 + Math.floor(k2 / 2) * 0.12, 7); c.fillStyle = ['#f0a21f', '#e04a3a', '#d8b03a'][i]; c.beginPath(); c.arc(p[0], p[1] - 1, 1.6, 0, 7); c.fill(); } });
    cano(c, [[0.8, 0.4, 6], [1.0, 0.4, 6]], '#e0552a', 2.2); cano(c, [[0.45, 0.7, 4], [0.45, 1.2, 4]], '#e0552a', 2.2); cano(c, [[0.8, 0.6, 3], [1.0, 1.0, 3]], '#e0552a', 2.2);
    placaIcone(c, 1.6, 1.6, 14, 'ciclo', '#e0552a');
  }, { fumaca: [[0.45, 0.4, 30, 'vapor']] });
  def('canaHibrida', [-70, -120, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c9bfa8', false);
    caixa(c, 0.1, 0.1, 0.8, 0.8, 0, 30, '#e2d6bf'); janelasE(c, 0.1, 0.8, 0.8, 4, 26, 2, 3, '#7fc4ef');
    chamine(c, 0.85, 0.15, 4.5, 0, 80, false);
    const p = P(0.3, 1.05, 0); c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 16, 8, 0, Math.PI, 0); c.fill();
    domo(c, 1.4, 0.55, 18, '#3f8a3a');
    paineis(c, 0.95, 1.05, 1.95, 1.95, 0.46, 0.28);
    paineis(c, 0.1, 1.35, 0.85, 1.95, 0.36, 0.28);
    placaIcone(c, 0.45, 0.8, 40, 'folha', '#2e9e4a');
  }, { fumaca: [[0.85, 0.15, 80, 'vapor']] });
  def('aterroSolar', [-70, -56, 70, 70], (c) => {
    const p = P(1, 1, 0);
    c.fillStyle = '#6f8a4a'; c.beginPath(); c.ellipse(p[0], p[1], 60, 29, 0, 0, 7); c.fill();
    c.fillStyle = '#86b05a'; c.beginPath(); c.ellipse(p[0], p[1] - 8, 48, 23, 0, Math.PI, 0); c.ellipse(p[0], p[1] - 8, 48, 14, 0, 0, Math.PI); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) painelSolar(c, 0.45 + i * 0.36, 0.45 + j * 0.36, 0.3, 0.2, 14, 5);
    caixa(c, 1.45, 1.55, 1.9, 1.75, 0, 12, '#2e9e4a'); caixa(c, 1.45, 1.78, 1.9, 1.98, 0, 12, '#2e9e4a');
    [[0.3, 1.5], [1.6, 0.3]].forEach((q) => { const a = P(q[0], q[1], 0); c.fillStyle = '#d0d4d8'; c.fillRect(a[0] - 1, a[1] - 9, 2, 9); c.fillStyle = '#ffd23f'; c.fillRect(a[0] - 2, a[1] - 11, 4, 2); });
    placaIcone(c, 1.67, 1.75, 22, 'chama', '#2e9e4a');
  });
  def('ecoparque', [-70, -80, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.22);
    piso(c, 0.02, 0.02, 1.98, 1.98, '#cfe7b8', false);
    caixa(c, 0.2, 0.2, 1.6, 1.2, 0, 22, '#eef6e2'); janelasE(c, 0.2, 1.6, 1.2, 4, 18, 1, 5, '#7fc4ef');
    paineis(c, 0.24, 0.24, 1.56, 1.16, 0.32, 0.22, 22);
    baterias(c, 0.3, 1.4, 2, '#e8f4ec');
    ['#3a8ae0', '#e04a3a', '#2fa05a', '#f0c419'].forEach((k2, i) => caixa(c, 1.05 + i * 0.2, 1.5, 1.22 + i * 0.2, 1.75, 0, 10, k2));
    [[1.85, 0.3], [1.85, 0.9], [0.1, 1.85]].forEach((q) => arvorinha(c, q[0], q[1], 0.9));
    placaIcone(c, 0.9, 1.2, 38, 'ciclo', '#2e9e4a');
  });
  def('miniusina', [-70, -60, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b8c88a', false);
    paineis(c, 0.1, 0.1, 1.2, 0.9, 0.36, 0.26);
    domo(c, 1.55, 0.55, 16, '#4f9a3a');
    caixa(c, 0.25, 1.15, 0.85, 1.75, 0, 14, '#c8a070'); telhado(c, 0.25, 1.15, 0.85, 1.75, 14, 9, '#a87a3a', 1);
    baterias(c, 1.05, 1.3, 2, '#e8f4ec');
    [[1.85, 1.85], [0.05, 1.9]].forEach((q) => arvorinha(c, q[0], q[1], 1));
    placaIcone(c, 1.55, 0.55, 30, 'pessoa', '#2e9e4a');
  });
  def('escolaAldeia', [-70, -64, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c8b88a', false);
    caixa(c, 0.3, 0.4, 1.5, 1.2, 0, 18, '#f4ead8'); janelasE(c, 0.3, 1.5, 1.2, 4, 14, 1, 4, '#7fc4ef');
    const t = P(0.9, 0.8, 34); poly(c, [P(0.2, 1.3, 18), P(1.6, 1.3, 18), t], '#c9a23f'); poly(c, [P(1.6, 0.3, 18), P(1.6, 1.3, 18), t], '#a8822a');
    paineis(c, 0.3, 1.45, 1.4, 1.95, 0.36, 0.26);
    baterias(c, 1.55, 1.45, 1, '#e8f4ec');
    [[0.1, 0.1], [1.85, 0.2], [1.85, 1.0]].forEach((q) => sub(c, null, 'palmeira', q[0] === 0.1 ? 0 : 1, q[0], q[1], 0, 0.7));
    placaIcone(c, 0.9, 1.2, 30, 'escola', '#2e9e4a');
  });
  def('minaHibrida', [-70, -130, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c9a07a', false);
    paineis(c, 0.1, 0.9, 1.9, 1.9, 0.44, 0.3);
    baterias(c, 0.25, 0.25, 2);
    torre(c, 1.45, 0.45, '#f0b419');
  }, { rotores: [[1.45, 0.45, 106, 28]] });
  def('h2Mina', [-70, -60, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#c9a07a', false);
    paineis(c, 0.1, 0.1, 1.9, 0.85, 0.44, 0.28);
    caixa(c, 0.15, 1.0, 0.85, 1.5, 0, 14, '#e8eef4'); janelasE(c, 0.15, 0.85, 1.5, 4, 10, 1, 3, '#a8e0f8');
    tanquesH2(c, 1.1, 1.05);
    sub(c, null, 'caminhaoMina', 0, 1.35, 1.75, 0, 1.2);
    placaIcone(c, 0.5, 1.5, 24, 'gota', '#2fa0d8');
  });
  def('dcHibrido', [-70, -130, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.1, 0.9, 1.4, 1.9, 0.42, 0.3);
    baterias(c, 1.45, 1.1, 2);
    caixa(c, 0.15, 0.15, 0.9, 0.6, 0, 18, { topo: '#3a4256', esq: '#2a3044', dir: '#1d2233' });
    const q = [P(0.2, 0.6, 7), P(0.85, 0.6, 7), P(0.85, 0.6, 9), P(0.2, 0.6, 9)]; poly(c, q, '#3ad1ff', false); emissivo(q, '#7ae8ff');
    torre(c, 1.5, 0.35, '#6a4fd0');
  }, { rotores: [[1.5, 0.35, 106, 28]] });
  def('redeHibrida', [-70, -130, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.75, 0.1, 1.9, 1.3, 0.38, 0.28);
    baterias(c, 0.85, 1.45, 3);
    caixa(c, 0.2, 1.4, 0.6, 1.85, 0, 14, '#a8b0b8'); placaIcone(c, 0.4, 1.62, 24, 'rede', '#6a4fd0');
    torre(c, 0.35, 0.35, '#6a4fd0'); torre(c, 0.4, 1.05, '#6a4fd0');
  }, { rotores: [[0.35, 0.35, 106, 28], [0.4, 1.05, 106, 28]] });
  def('solarH2', [-70, -60, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.1, 0.1, 1.9, 1.05, 0.44, 0.28);
    caixa(c, 0.15, 1.2, 0.9, 1.75, 0, 14, '#e8eef4'); janelasE(c, 0.15, 0.9, 1.75, 4, 10, 1, 3, '#a8e0f8');
    tanquesH2(c, 1.2, 1.25); tanquesH2(c, 1.45, 1.6);
    cano(c, [[0.9, 1.45, 5], [1.2, 1.45, 5]], '#2fa0d8', 2);
    placaIcone(c, 0.52, 1.75, 22, 'gota', '#2fa0d8');
  });

  // =========================================================
  // SOLUÇÕES DOS PROBLEMAS AMBIENTAIS
  // =========================================================
  function faixa(c, x0, y0, x1, y1, z, cor, txt) {
    const q = [P(x0, y1, z), P(x1, y1, z), P(x1, y1, z + 6), P(x0, y1, z + 6)];
    poly(c, q, cor, 'rgba(0,0,0,.25)');
    if (txt) { const m = P((x0 + x1) / 2, y1, z + 3); c.save(); c.translate(m[0], m[1]); c.transform(1, -0.5, 0, 1, 0, 0); c.fillStyle = '#fff'; c.font = 'bold 4.6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0.4); c.restore(); }
  }
  function boiaContencao(c, pts) {
    c.strokeStyle = '#f0b419'; c.lineWidth = 2.4; c.beginPath();
    pts.forEach((q, i) => { const p = P(q[0], q[1], 1); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
    pts.forEach((q) => { const p = P(q[0], q[1], 1); c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 7); c.fill(); });
  }
  // 1 tile
  def('bancoBaterias', [-34, -40, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#b9b4aa');
    [[0.1, 0.15], [0.5, 0.15]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.36, q[1] + 0.7, 0, 15, '#e8f4ec'); const p = P(q[0] + 0.1, q[1] + 0.7, 10); c.fillStyle = '#2fd16a'; c.fillRect(p[0], p[1], 6, 2.2); });
    c.strokeStyle = '#7d8590'; c.lineWidth = 0.6; [[0.04, 0.96, 0.96, 0.96], [0.96, 0.04, 0.96, 0.96]].forEach((L) => { for (let t = 0; t <= 1.001; t += 0.125) { const a = P(U.lerp(L[0], L[2], t), U.lerp(L[1], L[3], t), 0); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 6); c.stroke(); } const a = P(L[0], L[1], 6), b = P(L[2], L[3], 6); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
    placaIcone(c, 0.5, 0.5, 26, 'bateria', '#2fa05a');
  });
  def('geradorBiodiesel', [-34, -50, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    [[0.1, 0.15], [0.1, 0.55]].forEach((q) => { caixa(c, q[0], q[1], q[0] + 0.75, q[1] + 0.32, 0, 14, '#8ac43a'); cilindro(c, q[0] + 0.6, q[1] + 0.15, 2.5, 14, 24, '#555', { oco: '#222' }); });
    cilindro(c, 0.9, 0.85, 5, 0, 16, '#e8c84a', { faixas: [[0.6, 0.75, '#2e9e4a']] });
  }, { fumaca: [[0.7, 0.3, 24, 'vapor']] });
  def('painelBateria', [-34, -50, 34, 34], (c, r) => {
    c.save(); const q = P(0.05, 0.05, 0); c.translate(q[0], q[1]); c.scale(0.62, 0.62); casa(c, r, 2, true); c.restore();
    painelSolar(c, 0.5, 0.08, 0.42, 0.3, 3, 6);
    caixa(c, 0.55, 0.55, 0.9, 0.9, 0, 12, '#e8f4ec'); const p = P(0.65, 0.9, 7); c.fillStyle = '#2fd16a'; c.fillRect(p[0], p[1], 5, 2);
    cano(c, [[0.4, 0.6, 1], [0.55, 0.7, 1]], '#3a3f48', 1.2);
  });
  def('mudasMargem', [-34, -30, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#8ab85a', false);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) sub(c, r, 'muda', 0, 0.2 + i * 0.3, 0.2 + j * 0.3, 0, 0.8);
    sub(c, null, 'placa', 0, 0.9, 0.9, 0, 0.5);
  });
  def('cercaMargem', [-34, -34, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#9ac86a', false);
    [[0.3, 0.3], [0.65, 0.4], [0.4, 0.7]].forEach((q, i) => sub(c, r, 'arbusto', i, q[0], q[1], 0, 0.7));
    c.strokeStyle = '#7a4b2a'; c.lineWidth = 0.9;
    [[0.06, 0.06, 0.94, 0.06], [0.94, 0.06, 0.94, 0.94], [0.06, 0.94, 0.94, 0.94], [0.06, 0.06, 0.06, 0.94]].forEach((L) => { for (let t = 0; t <= 1.001; t += 0.25) { const a = P(U.lerp(L[0], L[2], t), U.lerp(L[1], L[3], t), 0); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 7); c.stroke(); } [4, 6.5].forEach((z) => { const a = P(L[0], L[1], z), b = P(L[2], L[3], z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }); });
  });
  def('agroMargem', [-34, -56, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#8ab85a', false);
    sub(c, r, 'bananeira', 0, 0.3, 0.3, 0, 0.6); sub(c, r, 'cafe', 0, 0.7, 0.35, 0, 0.8); arvorinha(c, 0.35, 0.75, 1); sub(c, r, 'bananeira', 1, 0.75, 0.75, 0, 0.55);
  });
  def('colheitadeira', [-34, -40, 34, 34], (c, r) => {
    sub(c, r, 'canaMonocultura', 0, 0, 0, 0);
    caixa(c, 0.2, 0.55, 0.65, 0.85, 0, 12, '#2e9e4a'); caixa(c, 0.45, 0.6, 0.65, 0.8, 12, 18, '#e8eef4');
    const p = P(0.2, 0.7, 4); c.fillStyle = '#d99a10'; c.fillRect(p[0] - 6, p[1] - 4, 6, 6);
    [[0.3, 0.85], [0.55, 0.85]].forEach((q) => { const a = P(q[0], q[1], 2); c.fillStyle = '#222'; c.beginPath(); c.arc(a[0], a[1], 2.6, 0, 7); c.fill(); });
  });
  def('fardosPalha', [-34, -30, 34, 34], (c, r) => {
    sub(c, r, 'palhada', 0, 0, 0, 0);
    [[0.2, 0.25], [0.5, 0.25], [0.35, 0.55], [0.65, 0.55], [0.5, 0.8]].forEach((q) => caixa(c, q[0], q[1], q[0] + 0.24, q[1] + 0.16, 0, 7, '#e8c86a'));
  });
  def('colheitaManual', [-34, -36, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#8a6a42', false);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const p = P(0.12 + i * 0.22, 0.12 + j * 0.2, 0); c.strokeStyle = '#8ab02e'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 1, p[1] - 18); c.stroke(); }
    [[0.3, 0.7], [0.6, 0.72]].forEach((q) => { const p = P(q[0], q[1], 0); c.strokeStyle = '#7aa82a'; c.lineWidth = 2; c.beginPath(); c.moveTo(p[0] - 6, p[1]); c.lineTo(p[0] + 6, p[1] - 3); c.stroke(); });
    [[0.45, 0.5, '#f0a21f'], [0.75, 0.55, '#2f7ad2']].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = q[2]; c.fillRect(p[0] - 2, p[1] - 9, 4, 6); c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(p[0], p[1] - 11, 2, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(p[0], p[1] - 12.5, 3, 1.4, 0, Math.PI, 0); c.fill(); });
    caixa(c, 0.82, 0.82, 0.95, 0.95, 0, 6, '#2fa0d8');
  });
  def('brigada', [-34, -50, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#9ab86a', false);
    caixa(c, 0.15, 0.2, 0.65, 0.65, 0, 16, '#d23b2f'); telhado(c, 0.15, 0.2, 0.65, 0.65, 16, 7, '#8a2a2a', 1);
    caixa(c, 0.55, 0.65, 0.92, 0.9, 0, 10, '#e04a3a');
    const p = P(0.4, 0.65, 8); c.fillStyle = '#fff'; c.fillRect(p[0] - 3, p[1] - 5, 6, 4);
    placaIcone(c, 0.4, 0.45, 32, 'chama', '#d23b2f');
  });
  def('aceiro', [-34, -50, 34, 34], (c, r) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#9ac86a', false);
    poly(c, [P(0.04, 0.4, 0), P(0.96, 0.4, 0), P(0.96, 0.6, 0), P(0.04, 0.6, 0)], '#b08a5a', false);
    [[0.25, 0.2], [0.7, 0.2], [0.3, 0.8], [0.75, 0.8]].forEach((q, i) => arvorinha(c, q[0], q[1], 0.75));
    const p = P(0.5, 0.5, 0); c.fillStyle = '#f0a21f'; c.fillRect(p[0] - 2, p[1] - 9, 4, 6); c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(p[0], p[1] - 11, 2, 0, 7); c.fill(); c.fillStyle = '#d23b2f'; c.beginPath(); c.ellipse(p[0], p[1] - 12.5, 3, 1.4, 0, Math.PI, 0); c.fill();
  });
  def('torreVigia', [-30, -80, 30, 30], (c) => {
    sombra(c, 0.5, 0.5, 18, 8, 0.22);
    [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#7d8590'; c.fillRect(p[0] - 0.8, p[1] - 48, 1.6, 48); });
    linha(c, [[0.32, 0.68, 6], [0.68, 0.68, 40]], '#9aa3ad', 0.8); linha(c, [[0.68, 0.32, 6], [0.68, 0.68, 40]], '#9aa3ad', 0.8);
    caixa(c, 0.25, 0.25, 0.75, 0.75, 48, 58, '#f4f0e6'); janelasE(c, 0.25, 0.75, 0.75, 50, 56, 1, 2, '#7fc4ef');
    const a = P(0.6, 0.4, 58); c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 12); c.stroke(); c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(a[0], a[1] - 12, 1.5, 0, 7); c.fill();
  });
  def('bateriasDC', [-34, -46, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.12, 0.9, 0.88, 0, 18, { topo: '#3a4256', esq: '#2a3044', dir: '#1d2233' });
    for (let i = 0; i < 4; i++) { const q = [P(0.15 + i * 0.19, 0.88, 4), P(0.28 + i * 0.19, 0.88, 4), P(0.28 + i * 0.19, 0.88, 14), P(0.15 + i * 0.19, 0.88, 14)]; poly(c, q, '#2fd16a', false); emissivo(q, '#7af0a8'); }
    placaIcone(c, 0.5, 0.5, 26, 'bateria', '#6a4fd0');
  });
  def('bateriasSegundaVida', [-34, -44, 34, 34], (c) => {
    piso(c, 0.04, 0.04, 0.96, 0.96, '#b9b4aa');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 0.12 + i * 0.27, y = 0.15 + j * 0.38; caixa(c, x, y, x + 0.22, y + 0.28, 0, 6 + j * 4, ['#2f7ad2', '#d23b2f', '#f4f6f8'][(i + j) % 3]); }
    placaIcone(c, 0.5, 0.5, 24, 'ciclo', '#2fa05a');
  });
  def('backupH2', [-34, -56, 34, 34], (c) => {
    sombra(c, 0.5, 0.5, 30, 14, 0.25);
    caixa(c, 0.1, 0.5, 0.9, 0.9, 0, 14, '#f4f6f8'); janelasE(c, 0.1, 0.9, 0.9, 4, 10, 1, 4, '#a8e0f8');
    tanquesH2(c, 0.25, 0.2);
    cilindro(c, 0.8, 0.25, 4, 0, 18, '#cfd6dd', { oco: '#333' });
  }, { fumaca: [[0.8, 0.25, 18, 'vapor']] });
  // 2 tiles
  def('museuEnergia', [-70, -150, 70, 70], (c, r) => {
    sub(c, r, 'termeletricaDesativada', 0, 0, 0, 0);
    faixa(c, 0.2, 1.75, 1.3, 1.95, 4, '#2e9e4a', 'MUSEU DA ENERGIA');
    [[1.5, 1.7], [1.7, 1.55], [0.1, 1.9]].forEach((q, i) => { const p = P(q[0], q[1], 0); c.fillStyle = ['#e04a3a', '#2f7ad2', '#f0a21f'][i]; c.fillRect(p[0] - 1.8, p[1] - 8, 3.6, 5); c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(p[0], p[1] - 10, 1.8, 0, 7); c.fill(); });
    const f = P(1.9, 1.9, 0); c.strokeStyle = '#ddd'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(f[0], f[1] - 30); c.stroke(); c.fillStyle = '#2e9e4a'; c.fillRect(f[0], f[1] - 30, 10, 6);
  });
  def('termeletricaBiomassa', [-70, -150, 70, 70], (c, r) => {
    sub(c, r, 'termeletrica', 0, 0, 0, 0);
    const p = P(1.6, 1.55, 0); c.fillStyle = '#b8864a'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 20, 10, 0, Math.PI, 0); c.fill(); c.fillStyle = '#d4a868'; c.beginPath(); c.ellipse(p[0] - 3, p[1] - 8, 11, 5, 0, Math.PI, 0); c.fill();
    placaIcone(c, 1.6, 1.55, 22, 'arvore', '#2e9e4a');
  }, { fumaca: [[1.45, 0.45, 100, 'vapor']] });
  def('patioBaterias', [-70, -60, 70, 70], (c) => {
    piso(c, 0.04, 0.04, 1.96, 1.96, '#b9b4aa');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 0.12 + i * 0.44, y = 0.15 + j * 0.62; caixa(c, x, y, x + 0.38, y + 0.5, 0, 16, '#e8f4ec'); const p = P(x + 0.1, y + 0.5, 10); c.fillStyle = '#2fd16a'; c.fillRect(p[0], p[1], 6, 2.2); emissivo([[p[0], p[1]], [p[0] + 6, p[1]], [p[0] + 6, p[1] + 2.2], [p[0], p[1] + 2.2]], '#7af0a8'); }
    sub(c, null, 'subestacao', 0, 1.0, 1.0, 0);
  });
  def('plataformaContida', [-70, -110, 70, 60], (c, r) => {
    [[0.3, 0.3], [1.5, 0.3], [0.3, 1.5], [1.5, 1.5]].forEach((q) => cilindro(c, q[0], q[1], 5, -10, 30, '#c8b878'));
    caixa(c, 0.1, 0.1, 1.8, 1.8, 30, 38, '#7a8590');
    caixa(c, 0.2, 0.9, 0.9, 1.7, 38, 56, '#d8d8d8');
    boiaContencao(c, [[-0.1, 1.95], [0.6, 2.05], [1.4, 2.05], [2.0, 1.6], [2.05, 0.6], [1.9, -0.1]]);
    placaIcone(c, 1.3, 0.5, 46, 'ok', '#2a7fd0');
  });
  def('plataformaEolica', [-70, -150, 70, 60], (c) => {
    [[0.6, 0.6], [1.4, 0.6], [0.6, 1.4], [1.4, 1.4]].forEach((q) => cilindro(c, q[0], q[1], 5, -10, 20, '#f0c419'));
    caixa(c, 0.4, 0.4, 1.6, 1.6, 20, 26, '#7a8590');
    torre(c, 1.0, 1.0, '#2f7ad2');
    boiaContencao(c, [[0.1, 1.9], [1.0, 2.0], [1.9, 1.9]]);
  }, { rotor: [1.0, 1.0, 106, 30] });
  def('recifeArtificial', [-70, -40, 70, 60], (c) => {
    agua(c, [[0.1, 0.1], [1.9, 0.1], [1.9, 1.9], [0.1, 1.9]], 'rgba(40,150,170,.55)');
    [[0.5, 0.5], [1.4, 0.6], [0.7, 1.4], [1.3, 1.35]].forEach((q, i) => { const p = P(q[0], q[1], -2); c.fillStyle = ['#ff8a6a', '#ffb84a', '#e86aa8', '#8ad86a'][i]; c.beginPath(); c.ellipse(p[0], p[1], 8, 4, 0, 0, 7); c.fill(); });
    for (let i = 0; i < 6; i++) { const p = P(0.4 + (i % 3) * 0.55, 0.5 + Math.floor(i / 3) * 0.8, 0); c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(p[0], p[1], 2.6, 1.2, 0.3, 0, 7); c.fill(); }
    [[0.1, 0.1], [1.9, 0.1], [1.9, 1.9], [0.1, 1.9]].forEach((q) => { const p = P(q[0], q[1], 0); c.fillStyle = '#f0b419'; c.beginPath(); c.arc(p[0], p[1] - 3, 3, 0, 7); c.fill(); c.strokeStyle = '#7a5a10'; c.stroke(); });
  });
  def('termeletricaBiodiesel', [-70, -150, 70, 70], (c, r) => {
    sub(c, r, 'termeletrica', 0, 0, 0, 0);
    [[1.5, 1.4], [1.78, 1.6]].forEach((q) => cilindro(c, q[0], q[1], 7, 0, 20, '#e8c84a', { faixas: [[0.6, 0.72, '#2e9e4a']] }));
    placaIcone(c, 1.64, 1.5, 30, 'ciclo', '#d18f00');
  }, { fumaca: [[1.45, 0.45, 100, 'vapor']] });
  def('usinaConvertidaGeo', [-70, -110, 70, 70], (c, r) => {
    sub(c, r, 'termeletricaDesativada', 0, 0, 0, 0);
    cano(c, [[1.95, 1.9, 6], [1.6, 1.9, 6], [1.6, 1.4, 6]], '#c0c6cc', 4);
    cano(c, [[1.95, 1.6, 4], [1.8, 1.6, 4]], '#e0552a', 3);
    sub(c, null, 'pocoGeo', 0, 1.0, 1.0, 0);
    placaIcone(c, 1.2, 1.7, 26, 'monte', '#e0552a');
  }, { fumaca: [[1.5, 1.5, 12, 'vapor']] });
  def('centralTriagem', [-70, -80, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.22);
    caixa(c, 0.15, 0.15, 1.3, 1.0, 0, 22, '#e2ecf4'); janelasE(c, 0.15, 1.3, 1.0, 4, 18, 1, 4, '#7fc4ef'); telhado(c, 0.15, 0.15, 1.3, 1.0, 22, 9, '#2f7ad2', 0);
    // esteira
    caixa(c, 1.3, 0.4, 1.9, 0.55, 8, 10, '#5a6270', { brilho: false });
    ['#3a8ae0', '#e04a3a', '#2fa05a', '#f0c419'].forEach((k, i) => caixa(c, 0.2 + i * 0.3, 1.2, 0.45 + i * 0.3, 1.45, 0, 9, k));
    for (let i = 0; i < 3; i++) { const y = 1.6 + i * 0.12; const a = P(1.1, y, 0), b = P(1.9, y, 0); c.fillStyle = ['#6a4a2a', '#7a5a32', '#5f4226'][i]; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10, b[0], b[1]); c.closePath(); c.fill(); }
    placaIcone(c, 0.72, 0.6, 42, 'ciclo', '#2f7ad2');
  });
  def('parqueRecuperado', [-70, -60, 70, 70], (c, r) => {
    const p = P(1, 1, 0);
    c.fillStyle = '#6fae4a'; c.beginPath(); c.ellipse(p[0], p[1], 60, 29, 0, 0, 7); c.fill();
    c.fillStyle = '#86c45a'; c.beginPath(); c.ellipse(p[0], p[1] - 7, 46, 22, 0, Math.PI, 0); c.ellipse(p[0], p[1] - 7, 46, 13, 0, 0, Math.PI); c.fill(); c.strokeStyle = CONTORNO; c.stroke();
    c.strokeStyle = '#e8dcc0'; c.lineWidth = 3; c.beginPath(); c.ellipse(p[0], p[1] - 7, 30, 13, 0, 0, 7); c.stroke();
    [[0.4, 0.5], [1.6, 0.5], [0.5, 1.5], [1.5, 1.6], [1.0, 0.3]].forEach((q, i) => arvorinha(c, q[0], q[1], 1, VERDES[i]));
    [[0.7, 1.05], [1.3, 0.95]].forEach((q) => { const a = P(q[0], q[1], 0); c.fillStyle = '#d0d4d8'; c.fillRect(a[0] - 1, a[1] - 7, 2, 7); });
    sub(c, null, 'quiosque', 0, 0.95, 0.95, 0, 0.7);
  });
  def('barragemReforcada', [-70, -50, 70, 70], (c, r) => {
    sub(c, r, 'lagoRejeito', 0, 0, 0, 0);
    const p = P(1, 1, 0); c.strokeStyle = '#9aa3ad'; c.lineWidth = 3; c.beginPath(); c.ellipse(p[0], p[1] + 3, 60, 30, 0, 0.15, Math.PI - 0.15); c.stroke();
    [[1.9, 0.4], [0.2, 1.9]].forEach((q) => { const a = P(q[0], q[1], 0); c.fillStyle = '#7d8590'; c.fillRect(a[0] - 1, a[1] - 22, 2, 22); c.fillStyle = '#d23b2f'; c.beginPath(); c.moveTo(a[0], a[1] - 24); c.lineTo(a[0] + 6, a[1] - 27); c.lineTo(a[0] + 6, a[1] - 21); c.closePath(); c.fill(); });
    placaAviso(c, 1.95, 1.95);
  });
  def('reprocessamento', [-70, -80, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.22);
    caixa(c, 0.15, 0.2, 1.1, 1.0, 0, 26, '#c8b8a0'); janelasE(c, 0.15, 1.1, 1.0, 5, 20, 1, 3, '#7fc4ef');
    cilindro(c, 1.45, 0.45, 10, 0, 32, '#9aa5b0');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) caixa(c, 0.2 + i * 0.32, 1.25 + j * 0.3, 0.46 + i * 0.32, 1.48 + j * 0.3, 0, 8 - j * 2, '#c8643a');
    const p = P(1.55, 1.55, 0); c.fillStyle = '#e8d8a8'; c.beginPath(); c.ellipse(p[0], p[1] - 3, 18, 9, 0, Math.PI, 0); c.fill();
    placaIcone(c, 0.62, 0.6, 46, 'ciclo', '#c8643a');
  });
  def('usinaDesmontada', [-70, -80, 70, 70], (c) => {
    piso(c, 0.04, 0.04, 1.96, 1.96, '#a9a49a');
    caixa(c, 0.2, 0.9, 1.0, 1.7, 0, 12, '#8a8f98');
    for (let i = 0; i < 6; i++) { const p = P(1.2 + (i % 3) * 0.2, 1.3 + Math.floor(i / 3) * 0.3, 0); bolha(c, p[0], p[1] - 3, 4, '#8a8478', 0.25); }
    sub(c, null, 'guindaste', 0, 1.4, 0.5, 0, 0.9);
    placaIcone(c, 0.6, 1.3, 22, 'estrela', '#6a4fd0');
  });
  def('carvaoSolar', [-70, -46, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#a9a49a', false);
    paineis(c, 0.1, 0.1, 1.95, 1.3, 0.46, 0.3);
    baterias(c, 0.2, 1.4, 3);
    sub(c, null, 'torreLinha', 0, 1.7, 1.7, 0, 0.6);
  });
  def('compensador', [-70, -90, 70, 70], (c) => {
    sombra(c, 1, 1, 60, 28, 0.25);
    caixa(c, 0.2, 0.3, 1.5, 1.4, 0, 30, '#d8dde2'); janelasE(c, 0.2, 1.5, 1.4, 5, 24, 2, 5, '#7fc4ef');
    cilindro(c, 0.85, 1.75, 9, 0, 12, '#2f7ad2', { faixas: [[0.4, 0.55, '#ffd23f']] });
    sub(c, null, 'subestacao', 0, 1.0, 1.0, 0, 0.9);
    placaIcone(c, 0.85, 0.85, 42, 'rede', '#2f7ad2');
  });
  def('nuclearDescomissionada', [-70, -120, 70, 70], (c, r) => {
    sub(c, r, 'nuclear', 0, 0, 0, 0);
    [[0.1, 1.9], [1.9, 0.1]].forEach((q) => { const a = P(q[0], q[1], 0); c.fillStyle = '#ffd23f'; c.fillRect(a[0] - 1, a[1] - 16, 2, 16); });
    faixa(c, 0.2, 1.75, 1.6, 1.95, 3, '#e0a400', 'DESCOMISSIONAMENTO');
  });
  def('nuclearMonitorada', [-70, -130, 70, 70], (c, r) => {
    sub(c, r, 'nuclear', 0, 0, 0, 0);
    const m = P(1.85, 1.85, 0); c.strokeStyle = '#7d8590'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] - 36); c.stroke();
    c.fillStyle = '#e8eef4'; c.beginPath(); c.ellipse(m[0] - 4, m[1] - 30, 6, 3.4, -0.6, 0, 7); c.fill();
    placaIcone(c, 1.85, 1.85, 42, 'lupa', '#e0a400');
  }, { fumaca: [[0.55, 0.55, 82, 'vapor']] });
  def('nuclearSolar', [-70, -46, 70, 70], (c) => {
    piso(c, 0.02, 0.02, 1.98, 1.98, '#b9c99a', false);
    paineis(c, 0.1, 0.1, 1.95, 1.95, 0.46, 0.3);
    placaIcone(c, 1.0, 1.0, 22, 'sol', '#f0a21f');
  });

  // prévia de uma construção num cartão (céu, chão e pás estáticas dos aerogeradores)
  SPR.previa = function (cv, spr, v) {
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfe9ff'); g.addColorStop(0.62, '#e8f6ff'); g.addColorStop(0.63, '#86cf5e'); g.addColorStop(1, '#5fae45');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const sp = SPR.get(spr, v || 0, 2); if (!sp) return;
    const d = SPR.defs[spr] || {};
    const rotores = d.rotores || (d.rotor ? [d.rotor] : []);
    const top = rotores.reduce((t0, r) => Math.min(t0, P(r[0], r[1], r[2])[1] - r[3]), sp.t);
    const altura = sp.t + sp.h - top;
    const k = Math.min((w - 24) / sp.w, (h - 20) / altura, 2.4);
    const x0 = (w - sp.w * k) / 2, y0 = (h - altura * k) / 2 + 6 + (sp.t - top) * k;
    c.drawImage(sp.img, x0, y0, sp.w * k, sp.h * k);
    rotores.forEach((rr) => {
      const ax = x0 - sp.l * k, ay = y0 - sp.t * k, q = P(rr[0], rr[1], rr[2]);
      const cx = ax + q[0] * k, cy = ay + q[1] * k, L = rr[3] * k;
      c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(28,32,48,.45)'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + 0.3 + i * (Math.PI * 2 / 3);
        c.save(); c.translate(cx, cy); c.rotate(a);
        c.beginPath(); c.moveTo(0, -2.2 * k); c.quadraticCurveTo(L * 0.5, -3.4 * k, L, 0); c.quadraticCurveTo(L * 0.5, 1.6 * k, 0, 2.2 * k); c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
      c.fillStyle = '#e2e6ea'; c.beginPath(); c.arc(cx, cy, 2.6 * k, 0, 7); c.fill(); c.stroke();
    });
  };
})();
