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
    _boas: 0,               // janelas seguidas com folga de desempenho
    _rebaixado: {},         // { nivel: { n: quedas, t: momento da última queda } }
  });
  const AMOSTRAS = 45;      // ~0,75 s de quadros por medição (resposta imediata)
  const ESPERA = 1.5;       // segundos de pausa após cada troca de nível

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
    Q._boas = 0;
    Q._cooldown = ESPERA;
    if (mudou) ERS.bus.emit('qualidade', { nivel, motivo });
  };

  // O jogo sempre começa na qualidade Alta. No modo Automático, o desempenho
  // real do computador ou celular decide, em poucos instantes, se é preciso
  // descer para Médio, Baixo ou Mínimo, ou voltar para o Alto.
  Q.iniciar = function () {
    // versão 2: preferências antigas voltam ao Automático começando no Alto
    if (ERS.S.get('versaoQualidade', 1) < 2) { ERS.S.set('qualidade', 'auto'); ERS.S.set('versaoQualidade', 2); }
    const salvo = ERS.S.get('qualidade', 'auto');
    Q.modo = NIVEIS[salvo] ? salvo : 'auto';
    Q.estimativa = Q.estimar(); // apenas informativo
    Q._rebaixado = {};
    Q.aplicar(Q.modo === 'auto' ? 'alto' : Q.modo, Q.modo === 'auto' ? 'inicio' : 'manual');
  };

  Q.definirModo = function (modo) {
    Q.modo = modo;
    ERS.S.set('qualidade', modo);
    if (modo === 'auto') { Q._rebaixado = {}; Q.aplicar('alto', 'inicio'); }
    else Q.aplicar(modo, 'manual');
  };

  // pode voltar a um nível que já ficou pesado? Só depois de um tempo,
  // e cada nova queda aumenta a espera (evita ficar alternando sem parar).
  function podeSubirPara(nivel, agora) {
    const r = Q._rebaixado[nivel];
    if (!r) return true;
    if (r.n >= 4) return false;
    return agora - r.t > 15000 * r.n;
  }

  // taxa de atualização da tela (60 Hz, 120 Hz...), medida pelos intervalos
  // entre quadros do navegador, inclusive os que o jogo não desenha
  Q._refresh = 60;
  Q._ticks = [];
  Q.tick = function (dtReal) {
    if (dtReal <= 0 || dtReal > 0.1) return;
    Q._ticks.push(dtReal);
    if (Q._ticks.length < 120) return;
    const arr = Q._ticks.sort((a, b) => a - b);
    const r = 1 / arr[Math.floor(arr.length * 0.2)];
    Q._ticks = [];
    if (r > Q._refresh && r < 250) Q._refresh = r;
  };
  // quadros por segundo que o nível consegue de fato mostrar nesta tela
  function alvoReal() {
    const R = Q._refresh, fps = Q.cfg.fpsMax;
    return Math.min(fps, R / Math.max(1, Math.ceil((1 / fps - 0.002) * R - 0.05)));
  }

  // chamado a cada quadro com dt (s). Ajusta automaticamente.
  Q.medir = function (dt, oculto) {
    if (Q.modo !== 'auto' || oculto || dt <= 0 || dt > 0.5) return;
    if (Q._cooldown > 0) { Q._cooldown -= dt; return; }
    Q._amostras.push(dt);
    if (Q._amostras.length < AMOSTRAS) return;
    const arr = Q._amostras.slice().sort((a, b) => a - b);
    const med = arr[Math.floor(arr.length * 0.5)];
    const p90 = arr[Math.floor(arr.length * 0.9)];
    Q._amostras = [];
    const fpsMed = 1 / med;
    const alvo = alvoReal();
    const i = ORDEM.indexOf(Q.nivel);
    const agora = performance.now();
    if ((fpsMed < alvo * 0.72 || 1 / p90 < alvo * 0.5) && i < ORDEM.length - 1) {
      // muito lento: desce dois níveis de uma vez; lento: desce um
      const passo = fpsMed < alvo * 0.4 && i < ORDEM.length - 2 ? 2 : 1;
      const r = Q._rebaixado[Q.nivel] || { n: 0, t: 0 };
      Q._rebaixado[Q.nivel] = { n: r.n + 1, t: agora };
      Q.aplicar(ORDEM[i + passo], 'desempenho');
    } else if (fpsMed > alvo * 0.95 && 1 / p90 > alvo * 0.75 && i > 0) {
      // folga contínua (~3 s): tenta o nível acima, até voltar ao Alto
      Q._boas++;
      const acima = ORDEM[i - 1];
      if (Q._boas >= 4 && podeSubirPara(acima, agora)) Q.aplicar(acima, 'folga');
    } else Q._boas = 0;
  };
})();
