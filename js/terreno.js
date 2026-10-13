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
    ['CANA_COLHIDA', '#bfa75a', '#9b6b43', 1, 0],
    // solos e superfícies acrescentados para mapas mais próximos da realidade
    ['BASALTO', '#3f3b3d', '#2b2729', 1, 0],      // lava resfriada (derrames antigos)
    ['CERRADO', '#b9c46a', '#a0643a', 1, 0],      // capim dourado com arbustos tortuosos
    ['VARZEA', '#6fb469', '#6a5236', 1, 0],       // campo úmido na beira do rio
    ['ESTERIL', '#a49783', '#7d705f', 1, 0],      // pilha de estéril da mineração
    ['RAMPA_MINA', '#cfae80', '#a0623a', 1, 0],   // estrada de serviço (rampa) dentro da cava
    ['LAGO_CAVA', '#2f9e95', '#8fe0d0', 0, 1],    // água acumulada no fundo da cava
    ['ENXOFRE', '#d8c64c', '#6f685c', 1, 0],      // crosta de enxofre em volta das fumarolas
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
        pinc(18 * n, ['#3f8a30', '#5aa83f', '#356f2a', '#6a4a2a'], 1.5, 5);
        // serrapilheira (folhas caídas) e sub-bosque
        for (let i = 0; i < 12 * n; i++) { c.fillStyle = ['rgba(150,100,40,.55)', 'rgba(200,150,60,.45)', 'rgba(90,60,30,.5)'][i % 3]; c.beginPath(); c.ellipse(r() * 64, r() * 32, 1.1, 0.6, r() * 3, 0, 7); c.fill(); }
        fios(10 * n, '#2f6a28', 3.4);
        break;
      case T.AGROFLORESTA:
        pinc(12 * n, ['#5aa83f', '#8ac85a', '#6a4a2a'], 1.5, 4);
        c.strokeStyle = 'rgba(90,60,30,.35)'; c.lineWidth = 2;
        for (let i = -2; i < 6; i++) { c.beginPath(); c.moveTo(i * 12, 0); c.lineTo(i * 12 + 32, 32); c.stroke(); }
        break;
      case T.PASTO: {
        pinc(10 * n, [U.shade(base, 0.12), U.shade(base, -0.08), '#c9d47a'], 2, 6);
        // trilhas de gado: caminhos estreitos de capim pisoteado
        if (v !== 3) {
          c.strokeStyle = 'rgba(214,196,130,.75)'; c.lineWidth = 1.3;
          const y0 = 6 + r() * 20, y1 = 6 + r() * 20;
          c.beginPath(); c.moveTo(-2, y0); c.bezierCurveTo(20, y0 + r.range(-8, 8), 44, y1 + r.range(-8, 8), 66, y1); c.stroke();
          c.strokeStyle = 'rgba(150,130,80,.35)'; c.lineWidth = 0.5; c.stroke();
        }
        // manchas de solo exposto (pastejo intenso)
        if (v === 1 || v === 2) { c.fillStyle = 'rgba(176,140,90,.45)'; c.beginPath(); c.ellipse(16 + r() * 32, 8 + r() * 16, r.range(3, 7), r.range(1.5, 3), 0, 0, 7); c.fill(); }
        fios(20 * n, U.shade(base, -0.22), 3.2); fios(10 * n, '#e4e6a0', 2.4);
        // touceiras de capim
        for (let i = 0; i < 4 * n; i++) { const x = r() * 64, y = r() * 32; c.strokeStyle = '#7f9a3a'; c.lineWidth = 0.6; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + k * 0.9, y - 2.6 - Math.abs(k) * -0.3); c.stroke(); } }
        break;
      }
      case T.CERRADO: {
        pinc(12 * n, ['#c8cf7a', '#a9b45a', '#d9c879', '#9aa64e'], 2, 6);
        // solo vermelho aparente entre as touceiras
        for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(178,98,58,.35)'; c.beginPath(); c.ellipse(r() * 64, r() * 32, r.range(1.5, 4), r.range(0.8, 2), 0, 0, 7); c.fill(); }
        fios(24 * n, '#d8c060', 3.6); fios(14 * n, '#8a9a40', 2.8);
        for (let i = 0; i < 3; i++) { c.fillStyle = r() < 0.5 ? '#6a8a3a' : '#7a9a44'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(1.2, 2.2), 0, 7); c.fill(); }
        break;
      }
      case T.VARZEA: {
        pinc(14 * n, ['#5fa85c', '#7cc070', '#4f9a52', '#86c27a'], 2, 6);
        // poças d'água refletindo o céu
        for (let i = 0; i < (v === 0 ? 3 : 1); i++) { const x = 10 + r() * 44, y = 6 + r() * 20; c.fillStyle = 'rgba(120,190,220,.55)'; c.beginPath(); c.ellipse(x, y, r.range(2.5, 6), r.range(1, 2.4), 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x - 1, y - 0.5, 1.5, 0.5, 0, Math.PI, 0); c.stroke(); }
        fios(26 * n, '#3f8a42', 3.4); fios(12 * n, '#a8d890', 2.8);
        break;
      }
      case T.ESTERIL: {
        pinc(18 * n, ['#b3a691', '#8f8371', '#c2b6a0', '#7a6f60'], 0.8, 3);
        for (let i = 0; i < 10; i++) { c.fillStyle = r() < 0.5 ? '#6f6556' : '#cfc3ad'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.6, 1.6), 0, 7); c.fill(); }
        c.strokeStyle = 'rgba(90,80,60,.35)'; c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) { const y = 8 + i * 8 + r() * 2; c.beginPath(); c.moveTo(0, y); c.lineTo(64, y + r.range(-2, 2)); c.stroke(); }
        break;
      }
      case T.RAMPA_MINA: {
        // cascalho compactado da estrada de serviço, com marcas de pneus e leiras de segurança
        pinc(12 * n, ['#d8bb8e', '#bf9b6c', '#e4cba0'], 1, 3);
        c.strokeStyle = 'rgba(120,80,45,.32)'; c.lineWidth = 1.4;
        for (let i = 0; i < 2; i++) { const y = 10 + i * 10 + r() * 3; c.beginPath(); c.moveTo(4, y); c.bezierCurveTo(20, y + r.range(-4, 4), 44, y + r.range(-4, 4), 60, y + r.range(-2, 2)); c.stroke(); }
        for (let i = 0; i < 10; i++) { c.fillStyle = r() < 0.5 ? '#8a6a4a' : '#f0dcb4'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.5, 1.1), 0, 7); c.fill(); }
        break;
      }
      case T.ENXOFRE: {
        pinc(14, ['#e6d45a', '#c9b23a', '#f2e58a', '#b8a24a'], 1.2, 4);
        for (let i = 0; i < 6; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,240,.7)' : 'rgba(220,120,40,.55)'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.6, 1.4), 0, 7); c.fill(); }
        c.strokeStyle = 'rgba(90,80,40,.45)'; c.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) { c.beginPath(); let x = r() * 64, y = r() * 32; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-5, 5); y += r.range(-2.5, 2.5); c.lineTo(x, y); } c.stroke(); }
        break;
      }
      case T.BASALTO: {
        pinc(10, ['#4a4548', '#2f2b2d', '#55504f'], 2, 6);
        // superfície em cordas (pahoehoe) e fraturas de resfriamento
        c.strokeStyle = 'rgba(110,104,100,.55)'; c.lineWidth = 0.7;
        for (let i = 0; i < 6; i++) { const x = r() * 64, y = r() * 32, rr = r.range(3, 7); c.beginPath(); c.arc(x, y, rr, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
        c.strokeStyle = 'rgba(15,12,14,.7)'; c.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) { c.beginPath(); let x = r() * 64, y = r() * 32; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-6, 6); y += r.range(-3, 3); c.lineTo(x, y); } c.stroke(); }
        if (v === 2) { c.fillStyle = 'rgba(120,150,70,.6)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(r() * 64, r() * 32, 1.2, 0, 7); c.fill(); } }
        break;
      }
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
        // chão do talhão: sulcos de plantio entre as linhas de cana (as plantas vêm de T.canavial)
        c.fillStyle = '#6f8f2a'; c.fillRect(0, 0, 64, 32);
        // sulcos paralelos às linhas de plantio (eixo x do tile)
        for (let i = 0; i < 8; i++) {
          const v0 = (i + 0.5) / 8;
          c.strokeStyle = i % 2 ? 'rgba(110,80,40,.55)' : 'rgba(70,110,30,.6)'; c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(32 - v0 * 32, v0 * 16); c.lineTo(64 - v0 * 32, 16 + v0 * 16); c.stroke();
        }
        pinc(10 * n, ['#5f7f22', '#86a83a', '#7a6a3a'], 1, 3);
        break;
      }
      case T.CANA_COLHIDA: {
        // talhão recém-colhido: soqueira (tocos) e palha espalhada sobre o solo
        c.fillStyle = '#a8904c'; c.fillRect(0, 0, 64, 32);
        for (let i = 0; i < 8; i++) {
          const v0 = (i + 0.5) / 8;
          c.strokeStyle = i % 2 ? 'rgba(120,90,45,.5)' : 'rgba(225,205,130,.6)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(32 - v0 * 32, v0 * 16); c.lineTo(64 - v0 * 32, 16 + v0 * 16); c.stroke();
        }
        // soqueira: tocos curtos das plantas cortadas, nas linhas de plantio
        for (let li = 0; li < 4; li++) for (let k = 0; k < 6; k++) {
          const u = 0.08 + k * 0.168, v0 = 0.125 + li * 0.25;
          const px = (u - v0) * 32 + 32, py = (u + v0) * 16;
          c.fillStyle = '#6f7a2a'; c.fillRect(px - 1.2, py - 2, 1, 2); c.fillRect(px + 0.4, py - 1.6, 1, 1.6);
        }
        c.strokeStyle = 'rgba(240,222,150,.8)'; c.lineWidth = 0.6;
        for (let i = 0; i < 40 * n; i++) { const x = r() * 64, y = r() * 32, a = r() * 3.1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 1.5); c.stroke(); }
        for (let i = 0; i < 14 * n; i++) { c.fillStyle = r() < 0.5 ? '#7a8a2a' : '#6a5a2a'; c.fillRect(r() * 64, r() * 32, 1.2, 1.6); }
        break;
      }
      case T.AREIA:
        pinc(14 * n, [U.shade(base, 0.1), U.shade(base, -0.08)], 1, 3);
        c.strokeStyle = 'rgba(200,160,90,.35)'; c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) { c.beginPath(); const y = 6 + i * 9 + r() * 3; c.moveTo(4, y); c.quadraticCurveTo(32, y - 4, 60, y); c.stroke(); }
        break;
      case T.TERRA:
        pinc(14 * n, [U.shade(base, 0.12), U.shade(base, -0.15)], 1, 4);
        for (let i = 0; i < 6; i++) { c.fillStyle = '#8a7a6a'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.8, 1.8), 0, 7); c.fill(); }
        break;
      case T.MINA: {
        // piso da bancada: laterita avermelhada, cascalho e marcas de máquinas
        const tons = [['#c47a45', '#a85f34', '#d89a62'], ['#b86a3c', '#9a5530', '#cf8a55'], ['#c9895a', '#ad6b40', '#e0a874'], ['#a9643c', '#8e512e', '#c47e50']][v];
        c.fillStyle = tons[0]; c.fillRect(0, 0, 64, 32);
        pinc(16 * n, tons, 1, 4);
        for (let i = 0; i < 9; i++) { c.fillStyle = r() < 0.5 ? '#7d6a5a' : '#e2c29a'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.6, 1.7), 0, 7); c.fill(); }
        c.strokeStyle = 'rgba(90,50,20,.35)'; c.lineWidth = 1.1;
        const ang = v % 2 ? 0.5 : -0.5;
        for (let i = 0; i < 2; i++) { const y = 10 + i * 12 + r() * 3; c.beginPath(); c.moveTo(0, y); c.lineTo(64, y + 64 * ang * 0.25); c.stroke(); }
        break;
      }
      case T.ROCHA: {
        pinc(10 * n, [U.shade(base, 0.12), U.shade(base, -0.12), '#8a8478'], 2, 6);
        // placas de rocha com aresta iluminada (luz do alto à esquerda) e sombra embaixo
        for (let i = 0; i < 5; i++) {
          const x = r() * 64, y = r() * 32, w = r.range(4, 9), h = r.range(2, 4.5);
          c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * 0.3, y - h); c.lineTo(x + w * 0.7, y - h * 0.6); c.lineTo(x + w, y + h * 0.3); c.lineTo(x, y + h * 0.6); c.closePath();
          c.fillStyle = U.shade(base, r.range(-0.12, 0.1)); c.fill();
          c.strokeStyle = 'rgba(255,250,235,.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * 0.3, y - h); c.lineTo(x + w * 0.7, y - h * 0.6); c.stroke();
          c.strokeStyle = 'rgba(40,36,32,.35)'; c.beginPath(); c.moveTo(x + w, y + h * 0.3); c.lineTo(x, y + h * 0.6); c.lineTo(x - w, y); c.stroke();
        }
        c.strokeStyle = 'rgba(50,46,42,.5)'; c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) { c.beginPath(); let x = r() * 64, y = r() * 32; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-6, 6); y += r.range(-3, 3); c.lineTo(x, y); } c.stroke(); }
        // líquens e musgo
        for (let i = 0; i < 4; i++) { c.fillStyle = ['rgba(190,200,120,.55)', 'rgba(220,160,70,.45)', 'rgba(120,160,80,.5)'][i % 3]; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.8, 1.8), 0, 7); c.fill(); }
        if (v === 3) { pinc(4, ['#6aa83f', '#7ab84a'], 2, 4); }
        break;
      }
      case T.NEVE: pinc(8, ['#ffffff', '#e2e8f0'], 2, 6); break;
      case T.CINZA_VULC: {
        pinc(14, ['#6a625a', '#423b36', '#5a524c'], 1, 4);
        // ondulações deixadas pelo vento na cinza e lapilli (pedrinhas vulcânicas)
        c.strokeStyle = 'rgba(140,130,120,.35)'; c.lineWidth = 0.6;
        for (let i = 0; i < 4; i++) { const y = 4 + i * 7 + r() * 3; c.beginPath(); c.moveTo(4, y); c.quadraticCurveTo(32, y - 3, 60, y + 1); c.stroke(); }
        for (let i = 0; i < 8; i++) { c.fillStyle = r() < 0.6 ? '#2e2825' : '#8a4a32'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.5, 1.2), 0, 7); c.fill(); }
        if (v === 3) for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(230,210,80,.55)'; c.beginPath(); c.arc(r() * 64, r() * 32, r.range(0.8, 1.8), 0, 7); c.fill(); }
        break;
      }
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
      case T.LIXO: {
        pinc(10, ['#8a7a5a', '#a6956f', '#6f6248'], 2, 5);
        // manchas escuras de chorume escorrendo pelo solo
        for (let i = 0; i < 2; i++) { c.fillStyle = 'rgba(50,38,22,.45)'; c.beginPath(); c.ellipse(r() * 64, r() * 32, r.range(4, 9), r.range(1.5, 3), r.range(-0.3, 0.3), 0, 7); c.fill(); }
        // sacolas, garrafas, papelão e restos misturados
        const cs = ['#e04a3a', '#3a8ae0', '#f0c419', '#fff', '#4fae3f', '#2a2a2a', '#c9b48a'];
        for (let i = 0; i < 26; i++) {
          c.fillStyle = cs[i % cs.length];
          const x = r() * 64, y = r() * 32;
          if (i % 3 === 0) { c.beginPath(); c.ellipse(x, y, r.range(1.2, 2.4), r.range(0.8, 1.4), r() * 3, 0, 7); c.fill(); }
          else c.fillRect(x, y, r.range(1.2, 2.6), r.range(0.8, 1.6));
        }
        break;
      }
      case T.MANGUE:
        pinc(14, ['#5f7a3a', '#7a9a4a', '#4a5a2a'], 2, 5);
        c.fillStyle = 'rgba(60,120,140,.35)'; c.beginPath(); c.ellipse(r() * 64, r() * 32, 10, 4, 0, 0, 7); c.fill();
        break;
      case T.CAIS:
        c.fillStyle = '#b88a5a'; c.fillRect(0, 0, 64, 32);
        c.strokeStyle = 'rgba(90,60,30,.6)'; c.lineWidth = 1;
        for (let i = -4; i < 12; i++) { c.beginPath(); c.moveTo(i * 6, 0); c.lineTo(i * 6 + 32, 32); c.stroke(); }
        break;
      case T.MAR: case T.MAR_FUNDO: case T.AGUA_RASA: case T.RIO: case T.REJEITO: case T.OLEO: case T.LAGO_CAVA: {
        if (tipo === T.LAGO_CAVA) { pinc(5, ['rgba(40,140,130,.6)', 'rgba(90,190,170,.4)'], 4, 10); }
        if (tipo === T.REJEITO) { pinc(6, ['rgba(110,95,65,.55)', 'rgba(150,130,90,.45)'], 3, 9); }
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

  // ---------- plantas de cana-de-açúcar sobre o tile (64 × 58, base no losango) ----------
  // Linhas de touceiras: colmos verticais com nós e folhas longas e arqueadas.
  // A imagem é desenhada com o canto superior esquerdo em (sx - 33, sy - CANA_ALT).
  T.CANA_ALT = 24;
  const canas = {};
  T.canavial = function (v, res) {
    res = res || 1;
    const k = v + ':' + res;
    if (canas[k]) return canas[k];
    const A = T.CANA_ALT, W = 66, H = 32 + A + 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(W * res); cv.height = Math.ceil(H * res);
    const c = cv.getContext('2d');
    c.scale(res, res); c.translate(33, A);
    c.lineCap = 'round';
    const r = U.rng(4517 + v * 131);
    const P = (x, y) => [(x - y) * 32, (x + y) * 16];
    const touceiras = [];
    // 4 linhas de plantio ao longo do eixo x do tile
    for (let li = 0; li < 4; li++) {
      const y = 0.125 + li * 0.25;
      for (let xi = 0; xi < 6; xi++) touceiras.push([0.08 + xi * 0.168 + r.range(-0.03, 0.03), y + r.range(-0.03, 0.03)]);
    }
    touceiras.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    const verdes = ['#5f9a24', '#74b02c', '#8cc63a', '#4e8a1f', '#9ccf48'];
    touceiras.forEach((t) => {
      const b = P(t[0], t[1]);
      const alt = r.range(15, 22);
      // colmos
      const nC = 3 + Math.floor(r() * 2);
      for (let i = 0; i < nC; i++) {
        const dx = r.range(-2.2, 2.2), topo = [b[0] + dx + r.range(-1.2, 1.2), b[1] - alt * r.range(0.75, 1)];
        c.strokeStyle = r() < 0.5 ? '#9a9a3a' : '#b0a548'; c.lineWidth = 1.25;
        c.beginPath(); c.moveTo(b[0] + dx * 0.5, b[1]); c.lineTo(topo[0], topo[1]); c.stroke();
        // nós do colmo
        c.strokeStyle = 'rgba(90,80,30,.55)'; c.lineWidth = 0.6;
        for (let z = 3; z < alt * 0.7; z += 3.4) { const yy = b[1] - z, xx = U.lerp(b[0] + dx * 0.5, topo[0], z / alt); c.beginPath(); c.moveTo(xx - 0.8, yy); c.lineTo(xx + 0.8, yy); c.stroke(); }
      }
      // folhas longas e arqueadas, das de trás para as da frente
      const nF = 6 + Math.floor(r() * 3);
      for (let i = 0; i < nF; i++) {
        const o = [b[0] + r.range(-1.5, 1.5), b[1] - alt * r.range(0.45, 0.95)];
        const lado = r() < 0.5 ? -1 : 1, comp = r.range(7, 12);
        const fim = [o[0] + lado * comp, o[1] + r.range(-1, 5)];
        const ctl = [o[0] + lado * comp * 0.35, o[1] - r.range(4, 8)];
        c.strokeStyle = verdes[(i + Math.floor(r() * 5)) % verdes.length]; c.lineWidth = r.range(1, 1.7);
        c.beginPath(); c.moveTo(o[0], o[1]); c.quadraticCurveTo(ctl[0], ctl[1], fim[0], fim[1]); c.stroke();
        if (r() < 0.35) { c.strokeStyle = 'rgba(220,210,120,.75)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(U.lerp(ctl[0], fim[0], 0.7), U.lerp(ctl[1], fim[1], 0.7)); c.lineTo(fim[0], fim[1]); c.stroke(); }
      }
      // brilho no alto da touceira
      c.fillStyle = 'rgba(230,255,170,.35)';
      c.beginPath(); c.ellipse(b[0] - 1, b[1] - alt * 0.85, 3, 1.4, 0, 0, 7); c.fill();
    });
    canas[k] = cv;
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
      aguaSob: new Uint8Array(N * N).fill(255), // água que passa sob cada ponte (255 = nenhuma)
      bloq: new Uint8Array(N * N),
      ents: [], fogo: [], marcos: [],
      ruido: U.noise2(seed),
      r: U.rng(seed),
    };
    m.i = (x, y) => y * N + x;
    m.dentro = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
    m.T = (x, y) => (m.dentro(x, y) ? m.tipo[y * N + x] : T.MAR_FUNDO);
    m.H = (x, y) => (m.dentro(x, y) ? m.alt[y * N + x] : 0);
    m.set = (x, y, t, h) => {
      if (!m.dentro(x, y)) return;
      const i = y * N + x;
      // ao virar ponte, guarda o tipo de água de baixo (rio, rejeito, lago…)
      if (t === T.PONTE && m.tipo[i] !== T.PONTE) m.aguaSob[i] = T.ehAgua(m.tipo[i]) ? m.tipo[i] : 255;
      m.tipo[i] = t; if (h !== undefined) m.alt[i] = h;
    };
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
