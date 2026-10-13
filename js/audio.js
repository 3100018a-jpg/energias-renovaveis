/* =========================================================
   Áudio: vozes neurais em português do Brasil + efeitos + trilha
   1) Usa MP3 neurais pré-gerados (audio/vozes/*.mp3, ver tools/gerar_vozes.py)
   2) Na falta deles, usa somente vozes pt-BR do sistema, priorizando as
      neurais/naturais (Edge: Francisca/Antonio/Thalita Online Natural;
      Chrome: Google português do Brasil; Safari: Luciana aprimorada).
      Vozes multilíngues ou de outros idiomas são descartadas.
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U;

  const A = (ERS.A = {
    vozLigada: ERS.S.get('vozLigada', true),
    lerAlternativas: ERS.S.get('lerAlternativas', true),
    volVoz: ERS.S.get('volVoz', 1),
    volMusica: ERS.S.get('volMusica', 0.35),
    volEfeitos: ERS.S.get('volEfeitos', 0.7),
    vozEscolhida: ERS.S.get('vozEscolhida', ''),
    vozes: [],
    falando: false,
    _token: 0,
    _audio: null,
  });

  // ---------- perfis das vozes (personagens) ----------
  // edge: voz neural usada pelo gerador de MP3; tom/ritmo: ajustes no navegador
  A.chaveVoz = function (p) {
    if (p.azure) return 'az:' + p.azure + '|' + (p.rate || '+0%');
    return (p.edge || 'pt-BR-FranciscaNeural') + '|' + (p.rate || '+0%') + '|' + (p.pitch || '+0Hz');
  };
  A.idFala = function (texto, perfil) {
    return U.hash(A.chaveVoz(perfil) + '|' + texto);
  };
  A.limparTexto = function (t) {
    return String(t)
      .replace(/<[^>]+>/g, '')
      .replace(/CO₂/g, 'CO2').replace(/CH₄/g, 'metano')
      .replace(/\s+/g, ' ')
      .trim();
  };
  // texto falado: siglas e símbolos lidos de forma natural
  A.textoFalado = function (t) {
    return A.limparTexto(t)
      .replace(/\bCO2\b/g, 'cê ó dois')
      .replace(/\bH2S\b/g, 'agá dois ésse')
      .replace(/\bkWh\b/g, 'quilowatt-hora')
      .replace(/\bMWh\b/g, 'megawatt-hora')
      .replace(/\bMW\b/g, 'megawatts')
      .replace(/\bGW\b/g, 'gigawatts')
      .replace(/\bkW\b/g, 'quilowatts')
      .replace(/\bPUE\b/g, 'pê u é')
      .replace(/\bPCH\b/g, 'pê cê agá')
      .replace(/\bLEDs?\b/g, (m) => (m === 'LEDs' ? 'léds' : 'léd'))
      .replace(/ ?\(2G\)/g, '')
      .replace(/\b2G\b/g, 'de segunda geração')
      .replace(/\bSAFs?\b/g, (m) => (m === 'SAFs' ? 'sistemas agroflorestais' : 'sistema agroflorestal'))
      .replace(/\bAPPs?\b/g, (m) => (m === 'APPs' ? 'a pê pês' : 'a pê pê'))
      .replace(/\bSIN\b/g, 'Sistema Interligado Nacional')
      .replace(/\bEIA\/RIMA\b/g, 'é i a rima')
      .replace(/(\d+)\s?%/g, '$1 por cento')
      .replace(/°C/g, ' graus Celsius')
      .replace(/ +\./g, '.');
  };

  // ---------- Web Speech ----------
  const NOMES_F = /francisca|thalita|luciana|maria|fernanda|vit[oó]ria|brenda|elza|giovanna|leila|let[ií]cia|manuela|yara|raquel|google portugu[eê]s|\bfemale\b|feminina/i;
  const NOMES_M = /ant[oô]nio|daniel|felipe|donato|f[aá]bio|humberto|j[uú]lio|nicolau|val[eé]rio|\bmale\b|masculin/i;

  function pontuar(v) {
    let s = 0;
    const n = v.name;
    if (/natural|neural|online/i.test(n)) s += 10;
    if (/premium|enhanced|aprimorad|superior/i.test(n)) s += 8;
    if (/google/i.test(n)) s += 6;
    if (/francisca|thalita|antonio|luciana/i.test(n)) s += 2;
    if (/compact|espeak|eloquence|novelty/i.test(n)) s -= 12;
    if (v.localService === false) s += 1;
    return s;
  }

  A.carregarVozes = function () {
    if (!('speechSynthesis' in window)) { A.vozes = []; return; }
    const todas = speechSynthesis.getVoices() || [];
    A.vozes = todas
      .filter((v) => /^pt[-_]BR$/i.test(v.lang) || /portugu[eê]s.*brasil/i.test(v.name))
      .filter((v) => !/multiling/i.test(v.name))
      // só vozes neurais e naturais; vozes robóticas antigas ficam de fora (nesse caso, só legenda)
      .filter((v) => /natural|neural|online|premium|enhanced|aprimorad|superior|google/i.test(v.name))
      .map((v) => ({ v, nota: pontuar(v), genero: NOMES_M.test(v.name) ? 'M' : NOMES_F.test(v.name) ? 'F' : '?' }))
      .sort((a, b) => b.nota - a.nota);
    ERS.bus.emit('vozes', A.vozes);
  };
  if ('speechSynthesis' in window) {
    A.carregarVozes();
    speechSynthesis.onvoiceschanged = A.carregarVozes;
  }

  // voz do navegador para um personagem: sempre do mesmo gênero; cada personagem
  // fica com uma das vozes naturais disponíveis, de forma estável
  A.escolherVoz = function (genero, variante, chave) {
    if (!A.vozes.length) return null;
    const doGenero = A.vozes.filter((x) => x.genero === genero);
    if (A.vozEscolhida) {
      const f = doGenero.find((x) => x.v.name === A.vozEscolhida);
      if (f) return { item: f, exata: true };
    }
    if (!doGenero.length) return null; // nunca uma voz do gênero errado
    const melhores = doGenero.filter((x) => x.nota >= doGenero[0].nota - 6);
    // a ordem do elenco espalha as vozes disponíveis entre os personagens da mesma missão
    const ORDEM = genero === 'M' ? ['Antonio', 'Donato', 'Fabio', 'Humberto', 'Julio', 'Nicolau', 'Valerio'] : ['Francisca', 'Thalita', 'Brenda', 'Elza', 'Giovanna', 'Leila', 'Leticia', 'Manuela', 'Yara'];
    const pos = ORDEM.indexOf(String(chave || ''));
    const k = pos >= 0 ? pos : chave ? U.hash(String(chave)).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) : (variante || 0);
    return { item: melhores[k % melhores.length], exata: true };
  };
  // vozes naturais do navegador por gênero (para avisar quando faltam)
  A.vozesNaturais = function () {
    return { F: A.vozes.filter((x) => x.genero === 'F').length, M: A.vozes.filter((x) => x.genero === 'M').length };
  };

  A.temMp3 = function (id) {
    return !!(window.ERS_VOZES && window.ERS_VOZES[id]);
  };

  A.disponivel = function () {
    return !!((window.ERS_VOZES && Object.keys(window.ERS_VOZES).length) || A.vozes.length);
  };

  A.parar = function () {
    A._token++;
    A.falando = false;
    try { if (A._audio) { A._audio.pause(); A._audio = null; } } catch (e) {}
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
    A.musicaDuck(false);
    ERS.bus.emit('fala', null);
  };

  function dividir(t) {
    const partes = t.match(/[^.!?;:]+[.!?;:]*/g) || [t];
    const out = [];
    let buf = '';
    partes.forEach((p) => {
      if ((buf + p).length > 180 && buf) { out.push(buf.trim()); buf = p; } else buf += p;
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function falarSintese(texto, perfil, token) {
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) return res();
      const esc = A.escolherVoz(perfil.genero || 'F', perfil.variante, perfil.vozAzure || perfil.edge);
      if (!esc) return res();
      const pedacos = dividir(A.textoFalado(texto));
      let i = 0;
      const prox = () => {
        if (token !== A._token || i >= pedacos.length) return res();
        const u = new SpeechSynthesisUtterance(pedacos[i++]);
        u.voice = esc.item.v;
        u.lang = 'pt-BR';
        u.pitch = 1; // voz natural, sem alterar o tom
        u.rate = U.clamp((perfil.ritmo || 1) * 1.0, 0.7, 1.3);
        u.volume = A.volVoz;
        let fim = false;
        const terminar = () => { if (fim) return; fim = true; clearTimeout(guarda); prox(); };
        u.onend = terminar;
        u.onerror = terminar;
        // salvaguarda: navegadores que não disparam onend
        const guarda = setTimeout(terminar, 1500 + u.text.length * 95);
        speechSynthesis.speak(u);
      };
      try { speechSynthesis.cancel(); } catch (e) {}
      setTimeout(prox, 30);
    });
  }

  // falas já baixadas, prontas para tocar sem espera
  const cacheAudio = new Map();
  function audioDe(id) {
    let au = cacheAudio.get(id);
    if (!au) {
      au = new Audio((window.ERS_VOZES_BASE || 'audio/vozes/') + id + '.mp3');
      au.preload = 'auto';
      cacheAudio.set(id, au);
      if (cacheAudio.size > 60) { const k = cacheAudio.keys().next().value; cacheAudio.delete(k); }
    }
    return au;
  }
  // baixa antecipadamente as gravações das próximas falas
  A.precarregar = function (itens) {
    (itens || []).forEach((it) => {
      if (!it || !it.texto) return;
      const id = A.idFala(A.limparTexto(it.texto), it.perfil || {});
      if (A.temMp3(id)) audioDe(id);
    });
  };
  function tocarMp3(id, token, texto) {
    return new Promise((res) => {
      const au = audioDe(id);
      let fim = false;
      const ok = () => { if (!fim) { fim = true; res(true); } };
      const falhou = () => { if (!fim) { fim = true; res(false); } };
      try { au.pause(); au.currentTime = 0; } catch (e) {}
      au.volume = A.volVoz;
      A._audio = au;
      // gravação muito mais curta que o texto: arquivo danificado, não toca
      const conferir = () => { if (texto && isFinite(au.duration) && au.duration < Math.max(0.6, texto.length / 40)) { cacheAudio.delete(id); try { au.pause(); } catch (e) {} falhou(); } };
      au.onloadedmetadata = conferir;
      au.onended = ok;
      au.onerror = falhou;
      if (au.readyState >= 1) conferir();
      if (!fim) au.play().catch(falhou);
      const verif = setInterval(() => { if (token !== A._token) { clearInterval(verif); try { au.pause(); } catch (e) {} ok(); } if (fim) clearInterval(verif); }, 120);
    });
  }

  // fala um texto com o perfil do personagem; resolve ao terminar
  A.falar = async function (texto, perfil, opts) {
    opts = opts || {};
    if (!opts.continuar) A.parar();
    if (!A.vozLigada || !texto) return;
    const token = A._token;
    perfil = perfil || {};
    const limpo = A.limparTexto(texto);
    A.falando = true;
    A.musicaDuck(true);
    ERS.bus.emit('fala', { texto: limpo, perfil });
    const id = A.idFala(limpo, perfil);
    let feito = false;
    if (A.temMp3(id)) feito = await tocarMp3(id, token, limpo);
    if (!feito && token === A._token) await falarSintese(limpo, perfil, token);
    if (token === A._token && !opts.manter) { A.falando = false; A.musicaDuck(false); ERS.bus.emit('fala', null); }
  };

  // fala uma sequência; interrompível
  A.falarSequencia = async function (itens) {
    A.parar();
    const token = A._token;
    for (let i = 0; i < itens.length; i++) {
      if (token !== A._token) return;
      if (itens[i].antes) itens[i].antes();
      await A.falar(itens[i].texto, itens[i].perfil, { continuar: true, manter: i < itens.length - 1 });
      if (itens[i].depois) itens[i].depois();
    }
  };

  A.salvar = function () {
    ERS.S.set('vozLigada', A.vozLigada);
    ERS.S.set('lerAlternativas', A.lerAlternativas);
    ERS.S.set('volVoz', A.volVoz);
    ERS.S.set('volMusica', A.volMusica);
    ERS.S.set('volEfeitos', A.volEfeitos);
    ERS.S.set('vozEscolhida', A.vozEscolhida);
  };

  // ---------- Efeitos sonoros (Web Audio, sintetizados) ----------
  let ctx = null, mestre = null, busMus = null, busFx = null, busAmb = null;
  A.iniciarAudio = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      mestre = ctx.createGain(); mestre.gain.value = 0.9; mestre.connect(ctx.destination);
      busMus = ctx.createGain(); busMus.gain.value = A.volMusica * 0.5; busMus.connect(mestre);
      busFx = ctx.createGain(); busFx.gain.value = A.volEfeitos; busFx.connect(mestre);
      busAmb = ctx.createGain(); busAmb.gain.value = A.volMusica * 0.6; busAmb.connect(mestre);
    } catch (e) { ctx = null; }
  };
  A.atualizarVolumes = function () {
    if (!ctx) return;
    busMus.gain.setTargetAtTime(A.volMusica * (A._duck ? 0.18 : 0.5), ctx.currentTime, 0.2);
    busAmb.gain.setTargetAtTime(A.volMusica * (A._duck ? 0.25 : 0.6), ctx.currentTime, 0.2);
    busFx.gain.setTargetAtTime(A.volEfeitos, ctx.currentTime, 0.05);
  };
  A.musicaDuck = function (on) { A._duck = on; A.atualizarVolumes(); };

  function tom(freq, dur, tipo, vol, quando, destino, glide) {
    if (!ctx) return;
    const t = ctx.currentTime + (quando || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destino || busFx);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function ruido(dur, vol, filtroFreq, quando, destino) {
    if (!ctx) return;
    const t = ctx.currentTime + (quando || 0);
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filtroFreq || 1000; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(destino || busFx);
    s.start(t);
  }

  A.sfx = function (nome) {
    if (!ctx) return;
    switch (nome) {
      case 'clique': tom(880, 0.06, 'triangle', 0.12); break;
      case 'abrir': tom(520, 0.08, 'sine', 0.12); tom(780, 0.1, 'sine', 0.1, 0.05); break;
      case 'acerto': [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.22, 'triangle', 0.16, i * 0.07)); break;
      case 'erro': tom(220, 0.28, 'sawtooth', 0.07, 0, null, 150); tom(196, 0.3, 'square', 0.04, 0.12); break;
      case 'moeda': tom(988, 0.08, 'square', 0.06); tom(1319, 0.18, 'square', 0.06, 0.07); break;
      case 'construir':
        for (let i = 0; i < 4; i++) { ruido(0.07, 0.25, 1800, i * 0.18); tom(140, 0.08, 'square', 0.06, i * 0.18); }
        [392, 523, 659].forEach((f, i) => tom(f, 0.25, 'triangle', 0.1, 0.8 + i * 0.08));
        break;
      case 'demolir': ruido(0.5, 0.3, 400); tom(90, 0.4, 'sawtooth', 0.08, 0, null, 50); break;
      case 'insignia':
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tom(f, 0.35, 'triangle', 0.14, i * 0.11));
        tom(262, 1.2, 'sine', 0.12, 0); tom(392, 1.2, 'sine', 0.08, 0.3);
        break;
      case 'passo': ruido(0.04, 0.05, 2500); break;
      case 'portal': tom(330, 0.5, 'sine', 0.12, 0, null, 990); tom(495, 0.5, 'sine', 0.08, 0.1, null, 1485); break;
      case 'alerta': tom(660, 0.12, 'square', 0.06); tom(660, 0.12, 'square', 0.06, 0.18); break;
    }
  };

  // ---------- trilha generativa suave + ambiente ----------
  let musTimer = null, ambNode = null, tema = 'cidade';
  const ESCALAS = {
    cidade: [261.6, 293.7, 329.6, 392.0, 440.0],
    mar: [246.9, 277.2, 329.6, 370.0, 415.3],
    floresta: [220.0, 246.9, 293.7, 329.6, 370.0],
    industria: [196.0, 233.1, 261.6, 311.1, 349.2],
  };
  const ACORDES = [[0, 2, 4], [1, 3, 0], [4, 1, 3], [2, 4, 1]];
  A.musica = function (novoTema) {
    tema = novoTema || tema;
    if (!ctx) return;
    if (musTimer) clearInterval(musTimer);
    let passo = 0;
    const tocar = () => {
      if (A.volMusica <= 0.001) return;
      const esc = ESCALAS[tema] || ESCALAS.cidade;
      const ac = ACORDES[Math.floor(passo / 8) % ACORDES.length];
      if (passo % 8 === 0) ac.forEach((g, i) => tom(esc[g] / 2, 3.6, 'sine', 0.05, i * 0.02, busMus));
      if (Math.random() < 0.55) {
        const n = esc[ac[Math.floor(Math.random() * 3)]] * (Math.random() < 0.5 ? 1 : 2);
        tom(n, 0.9, 'triangle', 0.035, 0, busMus);
      }
      passo++;
    };
    tocar();
    musTimer = setInterval(tocar, 480);
    A.ambiente(tema);
  };
  A.ambiente = function (t) {
    if (!ctx) return;
    if (ambNode) { try { ambNode.stop(); } catch (e) {} ambNode = null; }
    const n = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; d[i] = last * 6; }
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = t === 'mar' ? 900 : t === 'floresta' ? 1400 : 600;
    const g = ctx.createGain(); g.gain.value = t === 'mar' ? 0.22 : 0.1;
    const lfo = ctx.createOscillator(); lfo.frequency.value = t === 'mar' ? 0.12 : 0.05;
    const lg = ctx.createGain(); lg.gain.value = 0.08;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    s.connect(f); f.connect(g); g.connect(busAmb); s.start();
    ambNode = s;
  };
})();
