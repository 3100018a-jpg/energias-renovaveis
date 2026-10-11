/* =========================================================
   Qualidade gráfica automática: alto → médio → baixo → mínimo
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;

  const NIVEIS = {
    alto:   { nome: 'Alto',   dpr: 3,    sprRes: 2, sprMax: 4, terrenoMax: 3, memTerreno: 60e6, particulas: 1.0, nuvens: true,  veiculos: 1.0, agua: true,  passaros: true,  sombras: true,  fpsMax: 60, assar: false, zoomMin: 0.55, detalheTerreno: 1 },
    medio:  { nome: 'Médio',  dpr: 1.5,  sprRes: 2, sprMax: 2.5, terrenoMax: 2, memTerreno: 30e6, particulas: 0.55, nuvens: true, veiculos: 0.6, agua: true,  passaros: false, sombras: true,  fpsMax: 60, assar: false, zoomMin: 0.6, detalheTerreno: 1 },
    baixo:  { nome: 'Baixo',  dpr: 1,    sprRes: 1.5, sprMax: 1.5, terrenoMax: 1, memTerreno: 12e6, particulas: 0.25, nuvens: false, veiculos: 0.3, agua: false, passaros: false, sombras: false, fpsMax: 40, assar: true,  zoomMin: 0.7, detalheTerreno: 0.6 },
    minimo: { nome: 'Mínimo', dpr: 0.75, sprRes: 1, sprMax: 1, terrenoMax: 0.75, memTerreno: 6e6, particulas: 0.0,  nuvens: false, veiculos: 0.0, agua: false, passaros: false, sombras: false, fpsMax: 30, assar: true,  zoomMin: 0.8, detalheTerreno: 0.3 },
  };
  const ORDEM = ['alto', 'medio', 'baixo', 'minimo'];

  const Q = (ERS.Q = {
    NIVEIS, ORDEM,
    modo: 'auto',           // 'auto' ou um dos níveis
    nivel: 'alto',
    cfg: NIVEIS.alto,
    _amostras: [],
    _t0: 0,
    _cooldown: 0,
    _subidas: 0,
    _rebaixado: {},
  });

  // estimativa inicial a partir do hardware
  Q.estimar = function () {
    let pontos = 0;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const movel = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    pontos += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
    pontos += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;
    if (movel) pontos -= 1;
    let gpu = '';
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) pontos -= 2;
      else {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
        if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) pontos -= 3;
        if (/intel.*(hd|uhd) graphics [2-5]\d\d\b|mali-4|adreno \(tm\) 3/i.test(gpu)) pontos -= 1;
        if (/nvidia|radeon|rtx|gtx|apple m\d|adreno \(tm\) [67]/i.test(gpu)) pontos += 1;
      }
    } catch (e) { pontos -= 1; }
    const px = screen.width * screen.height * (window.devicePixelRatio || 1);
    if (px > 5e6) pontos -= 1;
    Q.gpu = gpu;
    if (pontos >= 4) return 'alto';
    if (pontos >= 2) return 'medio';
    if (pontos >= 0) return 'baixo';
    return 'minimo';
  };

  Q.aplicar = function (nivel, motivo) {
    if (!NIVEIS[nivel]) return;
    const mudou = nivel !== Q.nivel;
    Q.nivel = nivel;
    Q.cfg = NIVEIS[nivel];
    Q._amostras = [];
    Q._cooldown = 3;
    if (mudou) ERS.bus.emit('qualidade', { nivel, motivo });
  };

  Q.iniciar = function () {
    const salvo = ERS.S.get('qualidade', 'auto');
    Q.modo = salvo;
    if (salvo === 'auto') Q.aplicar(Q.estimar(), 'estimativa');
    else Q.aplicar(salvo, 'manual');
  };

  Q.definirModo = function (modo) {
    Q.modo = modo;
    ERS.S.set('qualidade', modo);
    if (modo === 'auto') { Q._rebaixado = {}; Q.aplicar(Q.estimar(), 'estimativa'); }
    else Q.aplicar(modo, 'manual');
  };

  // chamado a cada quadro com dt (s). Ajusta automaticamente.
  Q.medir = function (dt, oculto) {
    if (Q.modo !== 'auto' || oculto || dt <= 0 || dt > 0.5) return;
    if (Q._cooldown > 0) { Q._cooldown -= dt; return; }
    Q._amostras.push(dt);
    if (Q._amostras.length < 90) return;
    const arr = Q._amostras.slice().sort((a, b) => a - b);
    const med = arr[Math.floor(arr.length * 0.5)];
    const p90 = arr[Math.floor(arr.length * 0.9)];
    Q._amostras = [];
    const fpsMed = 1 / med;
    const alvo = Q.cfg.fpsMax;
    const i = ORDEM.indexOf(Q.nivel);
    if ((fpsMed < alvo * 0.72 || 1 / p90 < alvo * 0.5) && i < ORDEM.length - 1) {
      Q._rebaixado[Q.nivel] = (Q._rebaixado[Q.nivel] || 0) + 1;
      Q.aplicar(ORDEM[i + 1], 'desempenho');
    } else if (fpsMed > alvo * 0.97 && i > 0 && Q._subidas < 2) {
      const acima = ORDEM[i - 1];
      if (!Q._rebaixado[acima]) { Q._subidas++; Q.aplicar(acima, 'folga'); }
    }
  };
})();
