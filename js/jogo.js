/* =========================================================
   Lógica do jogo e interface
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;
  const U = ERS.U, M = ERS.M, A = ERS.A, Q = ERS.Q, T = ERS.T, SPR = ERS.SPR, S = ERS.S;
  const $ = (id) => document.getElementById(id);
  const FP2 = new Set(['escola', 'usinaSolar', 'solarFlutuante', 'termeletrica', 'termeletricaDesativada', 'nuclear', 'fabrica', 'usinaReversivel', 'geotermica', 'biomassa', 'lixao', 'aterro', 'reciclagem', 'datacenter', 'plataformaPetroleo', 'beneficiamento', 'agrofloresta', 'reflorestamento', 'cavaMina', 'lagoRejeito', 'pilhaSeca', 'solarDesmate', 'solarCava', 'escolaEficiente', 'loteamento', 'termeletricaGas', 'geotermicaRisco', 'geotermicaBinaria', 'regeneracao', 'ilpf', 'fabricaReciclados', 'recuperarMina', 'reatorModular',
    'microrrede', 'solarBateria', 'eolicaSolar', 'eolicaH2', 'hidroSolar', 'reversivelSolar', 'portoSolar', 'eolicaCosteira', 'geoSolar', 'geoCascata', 'canaHibrida', 'aterroSolar', 'ecoparque', 'miniusina', 'escolaAldeia', 'minaHibrida', 'h2Mina', 'dcHibrido', 'redeHibrida', 'solarH2',
    'museuEnergia', 'termeletricaBiomassa', 'patioBaterias', 'plataformaContida', 'plataformaEolica', 'recifeArtificial', 'termeletricaBiodiesel', 'usinaConvertidaGeo', 'centralTriagem', 'parqueRecuperado', 'barragemReforcada', 'reprocessamento', 'usinaDesmontada', 'carvaoSolar', 'compensador', 'nuclearDescomissionada', 'nuclearMonitorada', 'nuclearSolar']);

  // ---------- estado persistente ----------
  const J = (ERS.J = {
    perfil: S.get('perfil', null),
    pontos: S.get('pontos', 0),
    insignias: S.get('insignias', {}),
    conquistas: S.get('conquistas', []),
    limpasTotal: S.get('limpasTotal', 0),
    progresso: S.get('progresso', {}),
    periodos: (function () {
      // versão 2: o mapa principal passa a começar no ciclo automático
      const p = S.get('periodos', {});
      if (S.get('versaoPeriodo', 1) < 2) { delete p.hub; delete p.todos; S.set('periodos', p); S.set('versaoPeriodo', 2); }
      return p;
    })(),
    local: 'hub', ms: null, est: null,
  });
  function salvar() {
    S.set('perfil', J.perfil); S.set('pontos', J.pontos); S.set('insignias', J.insignias);
    S.set('conquistas', J.conquistas); S.set('limpasTotal', J.limpasTotal); S.set('progresso', J.progresso); S.set('periodos', J.periodos);
  }
  const missao = (id) => ERS.MISSOES.find((m) => m.id === id);
  const nInsignias = () => ERS.MISSOES.filter((m) => J.insignias[m.id]).length;

  // ---------- utilidades de interface ----------
  function toast(txt, tipo, ms) {
    const d = document.createElement('div');
    d.className = 'toast ' + (tipo || '');
    d.textContent = txt;
    $('toasts').appendChild(d);
    setTimeout(() => d.remove(), ms || 3400);
  }
  function pulsar(id) { const el = $(id); if (!el) return; const c = el.closest('.chip') || el; c.classList.remove('pulsa'); void c.offsetWidth; c.classList.add('pulsa'); }
  function ganharPontos(n, motivo) {
    if (!n) return;
    J.pontos = Math.max(0, J.pontos + n);
    if (J.est) J.est.pontos = (J.est.pontos || 0) + n;
    salvar(); atualizarHUD(); pulsar('hud-pontos');
    if (motivo) toast((n > 0 ? '+' : '') + n + ' pontos · ' + motivo, n > 0 ? 'ouro' : 'ruim');
  }
  function ganharCreditos(n) {
    if (!J.est || !n) return;
    J.est.creditos += n; salvarEst(); atualizarHUD(); pulsar('hud-creditos');
    if (n > 0) { A.sfx('moeda'); toast('+' + n + ' créditos verdes', 'bom'); }
  }
  function salvarEst() { if (J.est) { J.progresso[J.est.id] = J.est; salvar(); } }

  // modais
  let modalAberto = null;
  function abrirModal(id) {
    fecharModal(true);
    modalAberto = $(id);
    $('veu').hidden = false;
    modalAberto.hidden = false;
    M.pausado = true;
    $('dica-hover').hidden = true; $('prompt-interagir').hidden = true;
    A.sfx('abrir');
    const f = modalAberto.querySelector('button:not([data-fechar]), [data-fechar]');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 50);
  }
  function fecharModal(silencioso) {
    if (modalAberto) { modalAberto.hidden = true; const fn = modalAberto._aoFechar; modalAberto._aoFechar = null; modalAberto = null; if (fn) fn(); }
    $('veu').hidden = true;
    if (!dlgAtivo) M.pausado = false;
    if (!silencioso) A.parar();
    verificarConclusao();
  }
  document.addEventListener('click', (ev) => { if (ev.target.closest('[data-fechar]')) fecharModal(); });
  $('veu').addEventListener('click', () => { if (modalAberto && modalAberto.id !== 'modal-quiz' && modalAberto.id !== 'modal-vitoria') fecharModal(); });

  // ---------- retratos ----------
  function retrato(canvas, look, cor) { SPR.retrato(canvas, look || ERS.LOOK_JOGADOR, cor); }

  // ---------- diálogo ----------
  let dlgAtivo = null;
  function dialogo(itens) {
    if (dlgAtivo) dlgAtivo.pular();
    $('dica-hover').hidden = true;
    return new Promise((resolve) => {
      let i = 0;
      dlgAtivo = { resolve };
      M.pausado = true;
      $('dialogo').hidden = false;
      $('prompt-interagir').hidden = true;
      const mostrar = () => {
        const it = itens[i];
        const q = it.quem;
        $('dlg-nome').textContent = q.nome;
        $('dlg-papel').textContent = q.papel || '';
        retrato($('dlg-retrato'), q.look, q.cor || '#7fd1ff');
        $('dlg-texto').textContent = it.texto;
        const esc = $('dlg-escolhas');
        esc.innerHTML = '';
        $('dlg-proximo').hidden = !!it.escolhas;
        $('dlg-proximo').textContent = i < itens.length - 1 ? 'Continuar' : (it.fim || 'Fechar');
        if (it.escolhas) {
          it.escolhas.forEach((e, k) => {
            const b = document.createElement('button');
            b.className = 'bt ' + (k === 0 ? 'bt-ouro' : 'bt-vidro') + ' bt-peq';
            b.textContent = e.rotulo;
            b.onclick = () => { A.sfx('clique'); terminar(e.acao); };
            esc.appendChild(b);
          });
        }
        $('dialogo').classList.add('falando');
        A.falar(it.texto, ERS.VOZES[q.voz]).then(() => $('dialogo').classList.remove('falando'));
        A.precarregar(itens.slice(i + 1, i + 3).map((x) => ({ texto: x.texto, perfil: ERS.VOZES[x.quem.voz] })));
        setTimeout(() => { const b = it.escolhas ? esc.querySelector('button') : $('dlg-proximo'); if (b) b.focus({ preventScroll: true }); }, 60);
      };
      const terminar = (acao) => {
        A.parar();
        $('dialogo').hidden = true;
        dlgAtivo = null;
        if (!modalAberto) M.pausado = false;
        resolve();
        if (acao) setTimeout(acao, 30); else verificarConclusao();
      };
      dlgAtivo.proximo = () => { A.sfx('clique'); if (itens[i].escolhas) return; i++; if (i >= itens.length) terminar(); else mostrar(); };
      dlgAtivo.pular = () => terminar();
      dlgAtivo.ouvir = () => { const it = itens[i]; A.falar(it.texto, ERS.VOZES[it.quem.voz]); };
      mostrar();
    });
  }
  $('dlg-proximo').onclick = () => dlgAtivo && dlgAtivo.proximo();
  $('dlg-pular').onclick = () => dlgAtivo && dlgAtivo.pular();
  $('dlg-ouvir').onclick = () => dlgAtivo && dlgAtivo.ouvir();
  $('dlg-ouvir').innerHTML = ERS.svg('som');

  const quemNarrador = () => {
    if (J.local === 'hub') { const n = ERS.HUB.narrador; return { nome: n.nome, papel: n.papel, voz: n.voz, look: ERS.LOOKS[n.look], cor: '#b59cff' }; }
    const n = J.ms.narrador; return { nome: n.nome, papel: n.papel, voz: n.voz, look: ERS.LOOKS[n.look], cor: J.ms.cor };
  };
  const quemNPC = (i) => { const n = J.ms.npcs[i]; return { nome: n.nome, papel: n.papel, voz: n.voz, look: ERS.lookNPC(i * 3 + J.ms.id.length, n.g, n.faixa), cor: '#ffd88a' }; };

  // ---------- indicadores ----------
  function itensConstruidos(ms, est) {
    const out = [];
    ms.lotes.forEach((l) => { const k = est.lotes[l.id]; if (k !== undefined && k !== null) out.push(ERS.opcaoLote(l.opcoes[k])); });
    return out;
  }
  function calcular(ms, est) {
    const b = ms.base;
    let energia = b.energia, limpa = b.energia, co2 = b.co2, agua = b.agua, bio = b.bio, social = b.social;
    itensConstruidos(ms, est).forEach((it) => {
      const e = it.ef || {};
      energia += e.energia || 0; if (it.tipo !== 'suja') limpa += e.energia || 0;
      co2 += e.co2 || 0; agua += e.agua || 0; bio += e.bio || 0; social += e.social || 0;
    });
    ms.problemas.forEach((pb) => { const k = ERS.solucaoEscolhida(pb, est.problemas[pb.id]); if (k >= 0) { const e = (ERS.solucoes(pb)[k] || pb.acao).ef; co2 += e.co2 || 0; agua += e.agua || 0; bio += e.bio || 0; social += e.social || 0; } });
    co2 = U.clamp(co2, 0, 100); agua = U.clamp(agua, 0, 100); bio = U.clamp(bio, 0, 100); social = U.clamp(social, 0, 100);
    let cob = U.clamp(limpa / ms.demanda, 0, 1);
    let h24 = null;
    if (ms.final) { h24 = simular24(ms, est); cob = h24.horas / 24; }
    const indice = Math.round(35 * cob + 20 * (1 - co2 / 100) + 15 * bio / 100 + 15 * agua / 100 + 15 * social / 100);
    return { energia, limpa, co2, agua, bio, social, cob, indice, h24 };
  }

  // simulação horária para a rede inteligente
  const CORES_FONTE = { solar: '#ffc93c', eolica: '#7fd1ff', mare: '#1fc4c4', base: '#7ed957', hidro: '#3a7bd5', armazen: '#c38bff' };
  function simular24(ms, est) {
    const D = ms.demanda;
    // arranjos híbridos entram como várias fontes (ex.: sol + vento + baterias)
    const itens = [];
    itensConstruidos(ms, est).forEach((i) => {
      if (i.perfis) i.perfis.forEach((p) => itens.push({ perfil: p[0], cap: p[1], armazena: p[2] }));
      else if (i.perfil && i.perfil !== 'fossil') itens.push(i);
    });
    (ms.existentes || []).forEach((e) => itens.push(Object.assign({ existente: true }, e)));
    const smart = itens.some((i) => i.perfil === 'smart');
    const g = (h, mu, s) => Math.exp(-0.5 * ((h - mu) / s) ** 2);
    const dem = (h) => {
      let d = D * (0.6 + 0.16 * g(h, 13, 4) + 0.4 * g(h, 19.5, 2.2));
      if (smart) d = d * 0.93 - 0.06 * D * g(h, 19.5, 2.2) + 0.04 * D * g(h, 12.5, 2.5);
      return d;
    };
    const varia = (h) => {
      const r = { solar: 0, eolica: 0, mare: 0, base: 0 };
      itens.forEach((i) => {
        if (i.perfil === 'solar') r.solar += h > 6 && h < 18 ? i.cap * Math.pow(Math.sin(Math.PI * (h - 6) / 12), 1.2) : 0;
        else if (i.perfil === 'eolica') r.eolica += i.cap * (0.55 + 0.3 * Math.cos(2 * Math.PI * (h - 2) / 24));
        else if (i.perfil === 'mare') r.mare += i.cap * (0.55 + 0.45 * Math.cos(2 * Math.PI * (h - 3) / 12.4));
        else if (i.perfil === 'base') r.base += i.cap * 0.95;
      });
      return r;
    };
    const hidros = itens.filter((i) => i.perfil === 'hidro' && !i.armazena);
    const stores = [];
    itens.forEach((i) => {
      if (i.perfil === 'bateria') stores.push({ pot: i.cap, cap: i.cap * 3, ef: 0.9, nivel: i.cap * 1.5 });
      if (i.perfil === 'hidro' && i.armazena) stores.push({ pot: i.cap, cap: i.armazena, ef: 0.78, nivel: i.armazena / 2 });
      if (i.perfil === 'h2') stores.push({ pot: i.cap, cap: i.armazena || 60, ef: 0.42, nivel: (i.armazena || 60) / 2 });
    });
    const res = { horas: 0, dem: [], solar: [], eolica: [], mare: [], base: [], hidro: [], armazen: [], falta: [] };
    for (let dia = 0; dia < 2; dia++) {
      let orc = hidros.reduce((s, h) => s + (h.energiaDia || h.cap * 14), 0);
      const potH = hidros.reduce((s, h) => s + h.cap, 0);
      for (let h = 0; h < 24; h++) {
        const d = dem(h + 0.5), v = varia(h + 0.5);
        const vt = v.solar + v.eolica + v.mare + v.base;
        let need = d - vt, hid = 0, arm = 0;
        if (need < 0) {
          let sobra = -need;
          stores.forEach((s) => { const c = Math.min(s.pot, sobra, (s.cap - s.nivel) / s.ef); if (c > 0) { s.nivel += c * s.ef; sobra -= c; } });
        } else {
          hid = Math.min(potH, need, orc); orc -= hid; need -= hid;
          stores.forEach((s) => { const c = Math.min(s.pot, need, s.nivel); if (c > 0) { s.nivel -= c; need -= c; arm += c; } });
        }
        if (dia === 1) {
          res.dem.push(d); res.solar.push(v.solar); res.eolica.push(v.eolica); res.mare.push(v.mare); res.base.push(v.base);
          res.hidro.push(hid); res.armazen.push(arm); res.falta.push(need > 0.05 ? need : 0);
          if (!(need > 0.05)) res.horas++;
        }
      }
    }
    return res;
  }

  function objetivos(ms, est, c) {
    const nD = Object.keys(est.desafios).length;
    const nL = itensConstruidos(ms, est).filter((i) => i.tipo !== 'suja').length;
    const metaL = ms.final ? 5 : 3;
    const o = [
      { txt: 'Vença os desafios dos moradores', atual: nD, meta: ms.npcs.length },
      { txt: 'Construa soluções sustentáveis', atual: nL, meta: metaL },
    ];
    ms.problemas.forEach((pb) => o.push({ txt: 'Resolva: ' + pb.nome, ok: !!est.problemas[pb.id] }));
    if (ms.final) o.push({ txt: 'Energia renovável em todas as 24 horas', atual: c.h24.horas, meta: 24 });
    o.push({ txt: 'Índice de Sustentabilidade 70 ou mais', atual: c.indice, meta: 70 });
    o.forEach((x) => { if (x.ok === undefined) x.ok = x.atual >= x.meta; });
    return o;
  }

  // ---------- período do dia ----------
  const PERIODOS = [['dia', 'Dia', 'sol'], ['tarde', 'Entardecer', 'entardecer'], ['noite', 'Noite', 'lua'], ['ciclo', 'Ciclo automático', 'ciclo']];
  // mapa principal: ciclo automático por padrão; missões: dia por padrão
  const periodoDe = (local) => J.periodos[local] || J.periodos.todos || (local === 'hub' ? 'ciclo' : 'dia');
  function aplicarPeriodo(p, local, todos) {
    if (todos) { J.periodos = { todos: p }; } else J.periodos[local || J.local] = p;
    salvar();
    if (!local || local === J.local) { M.periodo = p; if (p === 'ciclo') M.t = 0; }
    atualizarHUD();
  }
  function segmentoPeriodo(el, atual, aoEscolher) {
    el.innerHTML = '';
    PERIODOS.forEach((o) => {
      const b = document.createElement('button');
      b.innerHTML = ERS.svg(o[2]) + ' ' + o[1];
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', atual === o[0]);
      b.onclick = () => { A.sfx('clique'); aoEscolher(o[0]); el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x === b)); };
      el.appendChild(b);
    });
  }
  $('bt-periodo').onclick = () => {
    const i = PERIODOS.findIndex((o) => o[0] === M.periodo);
    const prox = PERIODOS[(i + 1) % PERIODOS.length];
    aplicarPeriodo(prox[0], J.local);
    A.sfx('clique');
    toast(prox[1]);
  };

  // ---------- HUD ----------
  function atualizarHUD() {
    $('hud-pontos').textContent = J.pontos.toLocaleString('pt-BR');
    $('hud-insignias').textContent = nInsignias() + '/' + ERS.MISSOES.length;
    const emMissao = J.local !== 'hub' && J.est;
    $('chip-creditos').hidden = !emMissao;
    if (emMissao) $('hud-creditos').textContent = J.est.creditos;
    $('bt-voltar-hub').hidden = !emMissao;
    $('bt-sair').hidden = !!emMissao;
    if (emMissao) {
      $('hud-titulo').textContent = J.ms.nome;
      $('hud-sub').textContent = J.ms.fonte;
      $('hud-icone').innerHTML = ERS.svg(J.ms.icone);
      $('hud-icone').style.background = J.ms.cor;
    } else {
      $('hud-titulo').textContent = 'Vale Esperança';
      $('hud-sub').textContent = 'Mapa central · ' + (J.perfil ? J.perfil.nome : '');
      $('hud-icone').innerHTML = ERS.svg('mapa');
      $('hud-icone').style.background = '#2e9e4a';
    }
    const per = PERIODOS.find((o) => o[0] === M.periodo) || PERIODOS[0];
    $('bt-periodo').innerHTML = ERS.svg(per[2]);
    $('bt-periodo').title = 'Período: ' + per[1] + ' (clique para mudar)';
    $('bt-voz').innerHTML = ERS.svg(A.vozLigada ? 'som' : 'mudo');
    $('bt-voz').classList.toggle('ativo', A.vozLigada);
  }

  function anel(canvas, valor, cor) {
    const c = canvas.getContext('2d');
    const s = canvas.width;
    c.clearRect(0, 0, s, s);
    c.lineWidth = s * 0.12; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,.12)';
    c.beginPath(); c.arc(s / 2, s / 2, s * 0.4, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = cor;
    c.beginPath(); c.arc(s / 2, s / 2, s * 0.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.clamp(valor / 100, 0, 1)); c.stroke();
    c.fillStyle = '#fff'; c.font = `700 ${s * 0.3}px "Lilita One", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(valor, s / 2, s / 2 + 1);
  }

  function atualizarPainel() {
    if (J.local === 'hub' || !J.est) { $('painel-missao').hidden = true; return; }
    $('painel-missao').hidden = false;
    const ms = J.ms, est = J.est;
    const c = calcular(ms, est);
    J.calc = c;
    $('pm-nome').textContent = ms.nome;
    $('pm-fonte').textContent = 'Narração: ' + ms.narrador.nome + ' · ' + ms.fonte;
    const ob = objetivos(ms, est, c);
    $('pm-objetivos').innerHTML = ob.map((o) => `<li class="${o.ok ? 'ok' : ''}"><span>${o.txt}${o.meta !== undefined ? ` <b>${Math.min(o.atual, o.meta)}/${o.meta}</b>` : ''}</span></li>`).join('');
    const corInd = c.indice >= 70 ? '#43c46a' : c.indice >= 50 ? '#ffc93c' : '#ff6b4a';
    const barra = (rot, val, txt, cor) => `<div class="ind"><span>${rot}</span><b>${txt}</b><div class="barra"><i style="width:${U.clamp(val, 0, 100)}%;background:${cor}"></i></div></div>`;
    $('pm-indicadores').innerHTML =
      (ms.final
        ? barra('Horas atendidas por renováveis', c.h24.horas / 24 * 100, c.h24.horas + ' de 24 h', '#ffc93c')
        : barra('Energia limpa', c.cob * 100, Math.round(c.limpa) + ' de ' + ms.demanda + ' MW', '#ffc93c')) +
      barra('Emissões de gases', c.co2, c.co2 > 60 ? 'altas' : c.co2 > 30 ? 'médias' : 'baixas', c.co2 > 60 ? '#ff6b4a' : c.co2 > 30 ? '#ffb347' : '#43c46a') +
      barra('Água', c.agua, c.agua, '#4fb8ff') +
      barra('Biodiversidade', c.bio, c.bio, '#43c46a') +
      barra('Bem-estar social', c.social, c.social, '#ff8ac0') +
      `<div class="indice"><canvas width="128" height="128" id="anel-indice"></canvas><p><strong>Índice de Sustentabilidade</strong>Meta: 70 pontos. Combina energia limpa, emissões, água, biodiversidade e bem-estar.</p></div>`;
    anel($('anel-indice'), c.indice, corInd);
    $('bt-painel24').hidden = !ms.final;
    if (!$('modal-24h').hidden) desenhar24();
  }

  // ---------- carregamento de locais ----------
  function mostrarCarregando(txt) { $('carregando-texto').textContent = txt || 'Preparando o mapa…'; $('carregando').hidden = false; }
  function carregarLocal(id, aoPronto, inicio) {
    A.parar();
    mostrarCarregando(id === 'hub' ? 'Voltando a Vale Esperança…' : 'Viajando para ' + missao(id).nome + '…');
    setTimeout(() => {
      const mapa = ERS.gerarMapa(id);
      J.local = id;
      if (id === 'hub') { J.ms = null; J.est = null; transformarHub(mapa); }
      else {
        J.ms = missao(id);
        J.est = J.progresso[id] || novoEstado(J.ms);
        aplicarEstadoNoMapa(mapa);
      }
      M.periodo = periodoDe(id);
      M.carregar(mapa, { inicio });
      prepararEntidades();
      // baixa antes as falas de abertura e as dos moradores, para não haver espera
      const pre = [];
      if (id === 'hub') ERS.HUB.intro.forEach((t) => pre.push({ texto: t, perfil: ERS.VOZES[ERS.HUB.narrador.voz] }));
      else {
        const pv = ERS.VOZES[J.ms.narrador.voz];
        J.ms.intro.forEach((t) => pre.push({ texto: t, perfil: pv }));
        J.ms.npcs.forEach((n) => pre.push({ texto: n.fala, perfil: ERS.VOZES[n.voz] }));
      }
      A.precarregar(pre);
      $('carregando').hidden = true;
      $('hud').hidden = false; $('caixa-minimapa').hidden = false;
      atualizarHUD(); atualizarPainel();
      A.musica(mapa.tema);
      if (id === 'hub') setTimeout(avisarVozes, 1800);
      if (aoPronto) setTimeout(aoPronto, 250);
    }, 60);
  }
  // sem gravações e sem vozes naturais dos dois gêneros: indica o navegador que tem as vozes neurais
  let avisouVozes = false;
  function avisarVozes() {
    if (avisouVozes || !A.vozLigada) return;
    if (window.ERS_VOZES && Object.keys(window.ERS_VOZES).length) return;
    const n = A.vozesNaturais();
    if (n.F && n.M) return;
    avisouVozes = true;
    toast(n.F || n.M ? 'Algumas vozes não estão disponíveis neste navegador. Para ouvir todos os personagens com vozes neurais, abra o jogo no Microsoft Edge.' : 'Para ouvir as vozes neurais dos personagens, abra o jogo no navegador Microsoft Edge.', '', 9000);
  }
  function novoEstado(ms) {
    return { id: ms.id, creditos: ms.final ? 1000 : 250, desafios: {}, tentativas: {}, usadas: [], lotes: {}, problemas: {}, infos: {}, erros: 0, primeira: 0, pontos: 0, intro: false };
  }

  // estado visual do mapa central conforme as missões concluídas
  function transformarHub(m) {
    const ok = (id) => !!J.insignias[id];
    const ent = (id) => m.ents.find((e) => e.id === id);
    if (ok('floresta')) { m.fogo.forEach((f) => (f.apagado = true)); for (let i = 0; i < m.tipo.length; i++) if (m.tipo[i] === T.QUEIMADO) m.tipo[i] = T.GRAMA; m.ents.forEach((e) => { if (e.spr === 'queimada' || e.spr === 'toco') { e.spr = 'muda'; } }); }
    if (ok('residuos')) { const e = ent('hubLixao'); if (e) { e.spr = 'aterro'; e.semFumaca = true; } for (let i = 0; i < m.tipo.length; i++) if (m.tipo[i] === T.LIXO) m.tipo[i] = T.GRAMA; }
    if (ok('mare')) { const e = ent('hubPlataforma'); if (e) { e.spr = 'turbinaMare'; e.semFumaca = true; } }
    if (ok('rede')) { const e = ent('hubTermo'); if (e) { e.spr = 'termeletricaDesativada'; e.semFumaca = true; } for (let i = 0; i < m.tipo.length; i++) if (m.tipo[i] === T.OLEO) m.tipo[i] = T.RIO; }
    if (ok('mineracao')) for (let i = 0; i < m.tipo.length; i++) if (m.tipo[i] === T.REJEITO) m.tipo[i] = T.AGUA_RASA;
    if (ok('dados')) m.ents.forEach((e) => { if (e.spr === 'datacenter') e.v = 1; });
    if (ok('solar')) m.ents.forEach((e, i) => { if (e.spr === 'casa' && i % 3 === 0) e.spr = 'casaSolar'; });
    m.ents.forEach((e) => {
      if (e.kind === 'pin') {
        const ms = missao(e.ref);
        e.concluida = ok(e.ref);
        e.bloqueada = ms.final && nInsignias() < ms.requer;
      }
      if (e.kind === 'info') e.lido = !!(J.hubInfos && J.hubInfos[e.ref]);
    });
  }

  function aplicarEstadoNoMapa(m) {
    const ms = J.ms, est = J.est;
    ms.problemas.forEach((pb) => { if (est.problemas[pb.id]) modificarTerreno(m, pb); });
  }
  // efeitos de terreno das soluções de problemas
  function modificarTerreno(m, pb) {
    if (pb.apagarFogo) { m.fogo.forEach((f) => (f.apagado = true)); for (let i = 0; i < m.tipo.length; i++) if (m.tipo[i] === T.QUEIMADO) m.tipo[i] = pb.id === 'queima' ? T.CANA : T.GRAMA; m.ents.forEach((e) => { if (e.kind === 'deco' && (e.spr === 'queimada' || e.spr === 'toco')) e.spr = pb.id === 'queima' ? 'arbusto' : 'muda'; }); }
    if (pb.limparOleo) for (let i = 0; i < m.tipo.length; i++) { if (m.tipo[i] === T.OLEO) m.tipo[i] = m.alt[i] > 0 ? T.AREIA : T.MAR; }
    if (pb.plantar) {
      const r = U.rng(77);
      for (let y = 0; y < m.N; y++) for (let x = 0; x < m.N; x++) {
        if (m.T(x, y) !== T.TERRA) continue;
        const p = m.img(x, y);
        if (m.margens && (p[0] < m.margens.ix0 || p[0] > m.margens.ix1)) continue;
        m.set(x, y, T.GRAMA);
        if (!m.bloq[m.i(x, y)] && r() < 0.7) m.ents.push({ kind: 'deco', spr: r() < 0.6 ? 'muda' : 'arbusto', x: x + 0.5 + r.range(-0.2, 0.2), y: y + 0.5 + r.range(-0.2, 0.2), v: 1 });
      }
    }
  }

  function offsetLote(e, spr) {
    // sprite 1x1 em lote 2x2: centraliza
    if (e.fp && e.fp[0] === 2 && !FP2.has(spr)) { e.z = -16; } else e.z = 0;
  }
  function prepararEntidades() {
    const m = M.mapa;
    if (J.local === 'hub') return;
    const ms = J.ms, est = J.est;
    m.ents.forEach((e) => {
      if (e.kind === 'lote') {
        const k = est.lotes[e.ref];
        if (k !== undefined && k !== null) {
          const l = ms.lotes.find((x) => x.id === e.ref);
          const it = ERS.opcaoLote(l.opcoes[k]);
          e.construido = { spr: it.spr, v: it.v || 0 };
          offsetLote(e, it.spr); M.prepararEnt(e, 0);
          prepararFumaca(e, it.spr);
        }
      } else if (e.kind === 'problema') {
        const pb = ms.problemas.find((x) => x.id === e.ref);
        if (est.problemas[pb.id]) resolverVisual(e, pb);
      } else if (e.kind === 'npc' && e.papelJogo === 'desafio') {
        e.marcador = est.desafios[e.ref] ? 'feito' : 'desafio';
      } else if (e.kind === 'info') e.lido = !!est.infos[e.ref];
    });
    M.ordenarEstaticas();
  }
  function prepararFumaca(e, spr) {
    const d = SPR.defs[spr];
    e._emis = [];
    const add = (lst, tipo) => (lst || []).forEach((f) => { const p = SPR.P(f[0], f[1], f[2]); e._emis.push({ wx: e.wx + p[0], wy: e.wy + p[1], tipo: tipo || f[3], acc: Math.random() }); });
    if (d) { add(d.fumaca); add(d.fogo, 'fogo'); }
  }
  function resolverVisual(e, pb) {
    e.resolvido = true;
    const k = Math.max(0, ERS.solucaoEscolhida(pb, J.est && J.est.problemas[pb.id]));
    const sol = ERS.solucoes(pb)[k] || {};
    const spr = sol.spr || pb.sprResolvido;
    if (spr) {
      // alertas sem pegada (fogo, margens) viram uma construção de 1 tile
      if (!e.fp) { e.x = Math.floor(e.x); e.y = Math.floor(e.y); e.fp = [1, 1]; }
      e.spr = spr; e.v = sol.v || 0; e.semFumaca = false; e.oculto = false;
      offsetLote(e, e.spr);
      M.prepararEnt(e, 0);
      prepararFumaca(e, spr);
    } else { e.oculto = true; e.semFumaca = true; }
  }

  // ---------- interação ----------
  // ao clicar num personagem, placa ou alerta, a fala dele começa a ser baixada durante a caminhada
  ERS.bus.on('alvo', (e) => {
    if (!e || J.local === 'hub' || !J.ms) return;
    const ms = J.ms;
    if (e.kind === 'npc' && e.papelJogo === 'desafio' && ms.npcs[e.ref]) A.precarregar([{ texto: ms.npcs[e.ref].fala, perfil: ERS.VOZES[ms.npcs[e.ref].voz] }]);
    else if (e.kind === 'info' && ms.infos[e.ref]) A.precarregar([{ texto: ERS.falaInfo(ms.infos[e.ref]), perfil: ERS.VOZES[ms.narrador.voz] }]);
    else if (e.kind === 'problema') { const pb = ms.problemas.find((x) => x.id === e.ref); if (pb) A.precarregar([{ texto: ERS.falaProblema(pb), perfil: ERS.VOZES[ms.narrador.voz] }]); }
  });
  ERS.bus.on('interagir', (e) => {
    if (dlgAtivo || modalAberto) return;
    M.jogador.caminho = [];
    if (J.local === 'hub') interagirHub(e); else interagirMissao(e);
  });

  function interagirHub(e) {
    if (e.kind === 'pin') abrirCartaoMissao(e);
    else if (e.kind === 'npc') {
      const n = nInsignias();
      const q = quemNarrador();
      if (n >= ERS.MISSOES.length) dialogo([{ quem: q, texto: ERS.FRASES.hubTodas }]);
      else if (n >= 6 && !J.insignias.rede) dialogo([{ quem: q, texto: ERS.FRASES.hubFinal }]);
      else dialogo(ERS.HUB.intro.map((t) => ({ quem: q, texto: t })));
    } else if (e.kind === 'info') {
      const inf = ERS.HUB.infos[e.ref];
      abrirInfo(inf, quemNarrador(), () => { if (!e.lido) { e.lido = true; J.hubInfos = J.hubInfos || {}; J.hubInfos[e.ref] = 1; ganharPontos(20, 'curiosidade'); } });
    }
  }

  function abrirCartaoMissao(e) {
    const ms = missao(e.ref);
    $('mis-insignia').innerHTML = svgInsignia(ms, !J.insignias[ms.id]);
    $('mis-fonte').textContent = ms.fonte;
    $('mis-titulo').textContent = ms.nome;
    $('mis-narrador').textContent = 'Narração: ' + ms.narrador.nome + ', ' + ms.narrador.papel.toLowerCase();
    $('mis-desc').textContent = ms.intro[1];
    const ins = J.insignias[ms.id];
    const st = $('mis-status');
    const bloqueada = ms.final && nInsignias() < ms.requer;
    st.className = 'requisito ' + (bloqueada ? 'falta' : 'ok');
    if (bloqueada) st.textContent = 'Missão bloqueada: conquiste ' + ms.requer + ' insígnias para liberar. Você tem ' + nInsignias() + '.';
    else if (ins) st.textContent = 'Concluída com ' + ins.estrelas + ' de 3 estrelas e índice ' + ins.indice + '. Você pode jogar de novo para melhorar.';
    else if (J.progresso[ms.id]) st.textContent = 'Missão em andamento. Seu progresso foi salvo.';
    else st.textContent = 'Insígnia: ' + ms.insignia.nome + ' — ' + ms.insignia.desc;
    segmentoPeriodo($('mis-periodo'), periodoDe(ms.id), (p) => aplicarPeriodo(p, ms.id));
    $('mis-entrar').disabled = bloqueada;
    $('mis-entrar').textContent = ins ? 'Jogar novamente' : J.progresso[ms.id] ? 'Continuar missão' : 'Entrar na missão';
    $('mis-entrar').onclick = () => {
      fecharModal();
      A.sfx('portal');
      if (ins && !J.progresso[ms.id]) J.progresso[ms.id] = novoEstado(ms);
      J.ultimoPin = [Math.floor(e.x), Math.floor(e.y)];
      S.set('ultimoPin', J.ultimoPin);
      entrarMissao(ms.id);
    };
    abrirModal('modal-missao');
    if (bloqueada) A.falar(ERS.FRASES.hubBloqueada, ERS.VOZES.iara);
  }

  function entrarMissao(id) {
    carregarLocal(id, () => {
      const ms = J.ms, est = J.est;
      if (!est.intro) {
        est.intro = true; salvarEst();
        const q = quemNarrador();
        dialogo(ms.intro.map((t) => ({ quem: q, texto: t })).concat([{ quem: q, texto: ERS.FRASES.dicas[0] }]));
      }
    });
  }

  function interagirMissao(e) {
    const ms = J.ms, est = J.est;
    if (e.kind === 'npc' && e.papelJogo === 'narrador') {
      const q = quemNarrador();
      const c = calcular(ms, est);
      const ob = objetivos(ms, est, c);
      const falta = ob.find((o) => !o.ok);
      let dica = ERS.FRASES.dicas[0];
      if (falta) {
        if (falta.txt.startsWith('Construa')) dica = ERS.FRASES.dicas[1];
        else if (falta.txt.startsWith('Resolva')) dica = ERS.FRASES.dicas[2];
        else if (falta.txt.startsWith('Índice') || falta.txt.startsWith('Energia')) dica = ERS.FRASES.dicas[3];
      }
      dialogo([{ quem: q, texto: dica, escolhas: [
        { rotulo: 'Desafio extra (+ créditos)', acao: () => desafioExtra() },
        { rotulo: 'Repetir a apresentação', acao: () => dialogo(ms.intro.map((t) => ({ quem: q, texto: t }))) },
        { rotulo: 'Voltar ao mapa central', acao: () => voltarHub() },
        { rotulo: 'Fechar', acao: null },
      ] }]);
    } else if (e.kind === 'npc') {
      const q = quemNPC(e.ref);
      if (est.desafios[e.ref]) { dialogo([{ quem: q, texto: ERS.FRASES.obrigado }]); return; }
      dialogo([{ quem: q, texto: ms.npcs[e.ref].fala, escolhas: [{ rotulo: 'Aceitar o desafio', acao: () => abrirDesafio(e.ref, false, e) }, { rotulo: 'Depois', acao: null }] }]);
    } else if (e.kind === 'lote') abrirConstrucao(e);
    else if (e.kind === 'problema') abrirProblema(e);
    else if (e.kind === 'info') {
      abrirInfo(ms.infos[e.ref], quemNarrador(), () => {
        if (!est.infos[e.ref]) { est.infos[e.ref] = true; e.lido = true; ganharPontos(20, 'curiosidade'); ganharCreditos(30); salvarEst(); checarConquistas(); }
      });
    }
  }

  function abrirInfo(inf, quem, aoLer) {
    $('info-titulo').textContent = inf.titulo;
    $('info-texto').textContent = inf.texto;
    abrirModal('modal-info');
    A.falar(ERS.falaInfo(inf), ERS.VOZES[quem.voz]);
    if (aoLer) aoLer();
  }

  // ---------- desafios ----------
  function desafioExtra() {
    const ms = J.ms;
    const q = quemNarrador();
    dialogo([{ quem: q, texto: ERS.FRASES.extra }]).then(() => {
      abrirDesafio(Math.floor(Math.random() * ms.npcs.length), true);
    });
  }
  function abrirDesafio(dono, extra, ent) {
    const ms = J.ms, est = J.est;
    const pool = ms.questoes.map((_, j) => j).filter((j) => ERS.donoQuestao(ms, j) === dono);
    let livres = pool.filter((j) => est.usadas.indexOf(j) < 0);
    if (!livres.length) livres = pool;
    const j = livres[Math.floor(Math.random() * livres.length)];
    if (est.usadas.indexOf(j) < 0) est.usadas.push(j);
    const qd = ms.questoes[j];
    const opcoes = U.shuffle([{ t: qd.c, ok: true }].concat(qd.d.map((t) => ({ t, ok: false }))));
    const quem = quemNPC(dono);
    const voz = ERS.VOZES[quem.voz];
    retrato($('quiz-retrato'), quem.look, '#ffd88a');
    $('quiz-eyebrow').textContent = extra ? 'Desafio extra' : 'Desafio';
    $('quiz-quem').innerHTML = `${quem.nome} <span>· ${quem.papel}</span>`;
    $('quiz-pergunta').textContent = qd.p;
    $('quiz-retorno').hidden = true;
    const ol = $('quiz-opcoes');
    ol.innerHTML = '';
    const botoes = opcoes.map((o, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.innerHTML = `<span class="letra">${'ABCD'[i]}</span><span>${o.t}</span><span class="falar-op" title="Ouvir esta alternativa">${ERS.svg('som')}</span>`;
      b.onclick = (ev) => {
        if (ev.target.closest('.falar-op')) { ev.stopPropagation(); A.falarSequencia([{ texto: ERS.FRASES.letras[i], perfil: voz }, { texto: o.t, perfil: voz }]); return; }
        responder(i);
      };
      li.appendChild(b); ol.appendChild(li);
      return b;
    });
    const ler = () => {
      const seq = [{ texto: qd.p, perfil: voz }];
      if (A.lerAlternativas) opcoes.forEach((o, i) => {
        seq.push({ texto: ERS.FRASES.letras[i], perfil: voz, antes: () => { botoes.forEach((b) => b.classList.remove('lendo')); botoes[i].classList.add('lendo'); } });
        seq.push({ texto: o.t, perfil: voz, depois: () => botoes[i].classList.remove('lendo') });
      });
      A.falarSequencia(seq);
    };
    $('quiz-ouvir').innerHTML = ERS.svg('som');
    $('quiz-ouvir').onclick = ler;
    let respondido = false;
    const responder = (i) => {
      if (respondido) return;
      respondido = true;
      A.parar();
      botoes.forEach((b, k) => { b.disabled = true; b.classList.remove('lendo'); if (opcoes[k].ok) b.classList.add('certa'); });
      const certo = opcoes[i].ok;
      if (!certo) botoes[i].classList.add('errada');
      const fr = certo ? U.shuffle(ERS.FRASES.acerto)[0] : U.shuffle(ERS.FRASES.erro)[0];
      $('quiz-veredito').textContent = fr;
      $('quiz-veredito').className = 'veredito ' + (certo ? 'bom' : 'ruim');
      $('quiz-explica').textContent = qd.e;
      $('quiz-retorno').hidden = false;
      A.sfx(certo ? 'acerto' : 'erro');
      A.falarSequencia([{ texto: fr, perfil: voz }, { texto: qd.e, perfil: voz }]);
      setTimeout(() => $('quiz-ok').focus({ preventScroll: true }), 80);
      // resultados
      if (certo) {
        if (extra) { ganharPontos(40, 'desafio extra'); ganharCreditos(100); }
        else {
          const primeira = !est.tentativas[dono];
          est.desafios[dono] = true;
          if (primeira) est.primeira++;
          ganharPontos(primeira ? 100 : 60, primeira ? 'acertou de primeira' : 'desafio vencido');
          ganharCreditos(primeira ? 150 : 110);
          if (ent) { ent.marcador = 'feito'; M.celebrar(ent); }
        }
      } else {
        est.erros++;
        if (!extra) est.tentativas[dono] = (est.tentativas[dono] || 0) + 1;
      }
      salvarEst();
      atualizarPainel();
    };
    $('quiz-ok').onclick = () => fecharModal();
    abrirModal('modal-quiz');
    setTimeout(ler, 250);
  }

  // ---------- construção ----------
  function textoEfeitos(ef) {
    const nomes = { energia: ['Energia', ' MW'], co2: ['Emissões', ''], agua: ['Água', ''], bio: ['Biodiversidade', ''], social: ['Bem-estar', ''] };
    return Object.keys(nomes).filter((k) => ef[k]).map((k) => {
      const v = ef[k];
      const bom = k === 'co2' ? v < 0 : v > 0;
      return `<span class="ef ${bom ? 'mais' : 'menos'}">${nomes[k][0]} ${v > 0 ? '+' : ''}${v}${nomes[k][1]}</span>`;
    }).join('');
  }
  function previa(canvas, spr, v) { SPR.previa(canvas, spr, v); }
  function abrirConstrucao(e) {
    const ms = J.ms, est = J.est;
    const l = ms.lotes.find((x) => x.id === e.ref);
    $('cons-titulo').textContent = l.rotulo;
    const atualK = est.lotes[l.id];
    const atual = atualK !== undefined && atualK !== null ? ERS.opcaoLote(l.opcoes[atualK]) : null;
    $('cons-atual').hidden = !atual;
    if (atual) $('cons-atual').innerHTML = `${ERS.iconeObra(atual, 'em-linha')} Construído aqui: <b>${atual.nome}</b>. Você pode demolir e escolher outra opção.`;
    const box = $('cons-opcoes');
    box.innerHTML = '';
    l.opcoes.forEach((o, k) => {
      const it = ERS.opcaoLote(o);
      const card = document.createElement('div');
      card.className = 'opcao ' + it.tipo;
      const rot = it.tipo === 'limpa' ? 'Sustentável' : it.tipo === 'suja' ? 'Poluente' : 'Atenção ao local';
      const ehAtual = atualK === k;
      card.innerHTML = `<canvas width="460" height="240"></canvas>${ERS.iconeObra(it, 'no-cartao')}<span class="selo-tipo ${it.tipo}">${rot}</span><h4>${it.nome}</h4><p>${it.desc}</p><div class="efeitos">${textoEfeitos(it.ef || {})}</div>`;
      const b = document.createElement('button');
      if (ehAtual) { b.className = 'bt bt-perigo bt-peq'; b.textContent = 'Demolir (devolve ' + Math.floor(it.custo / 2) + ')'; b.onclick = () => demolir(e, l, it); }
      else if (atual) { b.className = 'bt bt-vidro bt-peq'; b.textContent = 'Demolir o atual primeiro'; b.disabled = true; }
      else { b.className = 'bt bt-ouro bt-peq'; b.textContent = it.custo ? 'Construir · ' + it.custo + ' créditos' : 'Fazer (sem custo)'; b.onclick = () => construir(e, l, k, it); }
      card.appendChild(b);
      box.appendChild(card);
      previa(card.querySelector('canvas'), it.spr, it.v);
    });
    abrirModal('modal-construir');
  }
  function construir(e, l, k, it) {
    const est = J.est;
    if (est.creditos < it.custo) {
      A.sfx('erro'); toast('Créditos insuficientes: faltam ' + (it.custo - est.creditos), 'ruim');
      A.falar(ERS.FRASES.semCredito, ERS.VOZES[J.ms.narrador.voz]);
      return;
    }
    est.creditos -= it.custo;
    est.lotes[l.id] = k;
    e.construido = { spr: it.spr, v: it.v || 0 };
    offsetLote(e, it.spr);
    M.prepararEnt(e, 0); prepararFumaca(e, it.spr);
    e.surgindo = 0;
    M.ordenarEstaticas();
    if (Q.cfg.assar) M.reconstruirCache();
    fecharModal(true);
    A.sfx('construir');
    setTimeout(() => M.celebrar(e), 500);
    if (it.tipo === 'limpa') { J.limpasTotal++; ganharPontos(40, 'construção sustentável'); }
    else ganharPontos(-20, it.tipo === 'suja' ? 'escolha poluente' : 'escolha com impacto');
    salvarEst(); atualizarHUD(); atualizarPainel(); checarConquistas();
    const q = quemNarrador();
    const itens = [{ quem: q, texto: ERS.falaItem(it) }];
    if (it.tipo !== 'limpa') itens.push({ quem: q, texto: ERS.FRASES.sujo });
    setTimeout(() => dialogo(itens), 700);
  }
  function demolir(e, l, it) {
    const est = J.est;
    est.lotes[l.id] = null;
    est.creditos += Math.floor(it.custo / 2);
    e.construido = null; e._emis = [];
    offsetLote(e, 'lote'); e.z = 0; M.prepararEnt(e, 0);
    if (Q.cfg.assar) M.reconstruirCache();
    A.sfx('demolir');
    salvarEst(); atualizarHUD(); atualizarPainel();
    fecharModal(true);
    toast('Construção removida · +' + Math.floor(it.custo / 2) + ' créditos', '');
    A.falar(ERS.FRASES.demolir, ERS.VOZES[J.ms.narrador.voz]);
  }

  // ---------- problemas ----------
  function abrirProblema(e) {
    const ms = J.ms, est = J.est;
    const pb = ms.problemas.find((x) => x.id === e.ref);
    $('prob-titulo').textContent = pb.nome;
    $('prob-desc').textContent = pb.desc;
    $('prob-impactos').innerHTML = pb.impactos.map((i) => `<li>${i}</li>`).join('');
    const req = $('prob-requisito');
    const box = $('prob-opcoes');
    box.innerHTML = '';
    const sols = ERS.solucoes(pb);
    const escolhida = ERS.solucaoEscolhida(pb, est.problemas[pb.id]);
    if (escolhida >= 0) {
      const sol = sols[escolhida] || sols[0];
      req.hidden = false; req.className = 'requisito ok';
      req.innerHTML = `${ERS.iconeObra(sol, 'em-linha')} Resolvido com: <b>${sol.rotulo}</b>. ${sol.fala}`;
    } else {
      req.hidden = false; req.className = 'requisito'; req.textContent = 'Escolha uma das soluções. Compare custos, requisitos e efeitos.';
      const c = calcular(ms, est);
      sols.forEach((sol, k) => {
        let ok = true, txt = '';
        if (sol.requer && sol.requer.cobertura) { ok = c.cob >= sol.requer.cobertura; txt = `Requer energia limpa de ${Math.round(sol.requer.cobertura * 100)}% da demanda (agora: ${Math.round(c.cob * 100)}%).`; }
        if (sol.requer && sol.requer.horas24) { ok = c.h24.horas >= 24; txt = `Requer energia renovável nas 24 horas (agora: ${c.h24.horas} de 24).`; }
        const tipo = sol.tipo || 'limpa';
        const rot = tipo === 'limpa' ? 'Solução completa' : 'Atenção: solução parcial';
        const card = document.createElement('div');
        card.className = 'opcao ' + tipo;
        card.innerHTML = `<canvas width="460" height="240"></canvas>${ERS.iconeObra(Object.assign({ tipo }, sol), 'no-cartao')}<span class="selo-tipo ${tipo}">${rot}</span><h4>${sol.rotulo}</h4><p>${k === 0 ? 'A solução recomendada pelos especialistas.' : sol.desc}</p><div class="efeitos">${textoEfeitos(sol.ef || {})}</div>${txt ? `<p class="req-opcao ${ok ? 'ok' : 'falta'}">${txt}</p>` : ''}`;
        const b = document.createElement('button');
        b.className = 'bt bt-ouro bt-peq';
        b.textContent = sol.custo ? 'Aplicar · ' + sol.custo + ' créditos' : 'Aplicar';
        b.onclick = () => aplicarSolucao(e, pb, k, sol, ok);
        card.appendChild(b);
        box.appendChild(card);
        previa(card.querySelector('canvas'), sol.spr || pb.sprResolvido || pb.spr, 0);
      });
    }
    abrirModal('modal-problema');
    A.falar(ERS.falaProblema(pb), ERS.VOZES[ms.narrador.voz]);
  }
  function aplicarSolucao(e, pb, k, sol, ok) {
    const ms = J.ms, est = J.est;
    if (!ok) { A.sfx('erro'); A.falar(sol.requer.horas24 ? ERS.FRASES.requisito24 : ERS.FRASES.requisito, ERS.VOZES[ms.narrador.voz]); toast('Requisito ainda não atendido', 'ruim'); return; }
    if (est.creditos < sol.custo) { A.sfx('erro'); A.falar(ERS.FRASES.semCredito, ERS.VOZES[ms.narrador.voz]); toast('Créditos insuficientes', 'ruim'); return; }
    est.creditos -= sol.custo;
    est.problemas[pb.id] = k === 0 ? true : k;
    modificarTerreno(M.mapa, pb);
    if (pb.apagarFogo || pb.limparOleo || pb.plantar) {
      M.mapa.ents.forEach((x, i) => { if (x.kind === 'deco' && !x.wx) M.prepararEnt(x, i); });
      M.ordenarEstaticas(); M.reconstruirCache(); M.listarAgua(); M.prepararMinimapa();
    }
    resolverVisual(e, pb);
    M.ordenarEstaticas();
    if (Q.cfg.assar) M.reconstruirCache();
    fecharModal(true);
    A.sfx('construir');
    M.celebrar(e);
    ganharPontos(sol.tipo === 'atencao' ? 80 : 150, sol.tipo === 'atencao' ? 'solução parcial' : 'problema resolvido');
    salvarEst(); atualizarHUD(); atualizarPainel();
    if (ms.final && est.problemas.carvao && est.problemas.nuclear) addConquista('zerofossil');
    setTimeout(() => dialogo([{ quem: quemNarrador(), texto: sol.fala || pb.fala }]), 600);
  }

  // ---------- conclusão de missão ----------
  let concluindo = false;
  function pronto() {
    if (concluindo || J.local === 'hub' || !J.est || !J.ms || dlgAtivo || modalAberto) return false;
    return objetivos(J.ms, J.est, calcular(J.ms, J.est)).every((o) => o.ok);
  }
  function verificarConclusao() {
    if (!pronto()) return;
    setTimeout(() => { if (pronto()) { concluindo = true; concluirMissao(); } }, 900);
  }
  function concluirMissao() {
    const ms = J.ms, est = J.est;
    const c = calcular(ms, est);
    const q = quemNarrador();
    dialogo(ms.conclusao.map((t) => ({ quem: q, texto: t }))).then(() => {
      const estrelas = c.indice >= 88 && est.erros <= 1 ? 3 : c.indice >= 80 ? 2 : 1;
      const bonus = 300 + estrelas * 100;
      const ant = J.insignias[ms.id];
      J.insignias[ms.id] = { estrelas: Math.max(estrelas, ant ? ant.estrelas : 0), indice: Math.max(c.indice, ant ? ant.indice : 0), pontos: (est.pontos || 0) + bonus };
      ganharPontos(bonus, 'missão concluída');
      if (est.primeira >= ms.npcs.length && est.erros === 0) addConquista('perfeito');
      if (Object.keys(est.infos).length >= ms.infos.length) addConquista('curioso');
      if (nInsignias() >= ERS.MISSOES.length) addConquista('mestre');
      const resumo = [['Desafios vencidos', Object.keys(est.desafios).length + ' de ' + ms.npcs.length], ['Acertos de primeira', est.primeira], ['Construções', itensConstruidos(ms, est).length], ['Índice de Sustentabilidade', c.indice], ['Pontos nesta missão', (est.pontos || 0)]];
      delete J.progresso[ms.id];
      salvar();
      $('vit-insignia').innerHTML = svgInsignia(ms, false);
      $('vit-titulo').textContent = 'Insígnia ' + ms.insignia.nome;
      $('vit-estrelas').innerHTML = [1, 2, 3].map((k) => `<span class="${k <= estrelas ? '' : 'apagada'}">★</span>`).join('');
      $('vit-resumo').innerHTML = resumo.map((r) => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
      A.sfx('insignia');
      abrirModal('modal-vitoria');
      $('modal-vitoria')._aoFechar = () => { const de = J.local; J.est = null; voltarHub(de); concluindo = false; };
    });
  }
  $('vit-ok').onclick = () => fecharModal();

  function voltarHub(origem) {
    salvarEst();
    const pin = J.ultimoPin || S.get('ultimoPin', null);
    const de = typeof origem === 'string' ? origem : J.local;
    carregarLocal('hub', () => {
      if (nInsignias() >= ERS.MISSOES.length && de === 'rede') dialogo([{ quem: quemNarrador(), texto: ERS.FRASES.hubTodas }]);
      else if (nInsignias() >= 6 && !J.insignias.rede && J.insignias[de]) dialogo([{ quem: quemNarrador(), texto: ERS.FRASES.hubFinal }]);
    }, pin ? [pin[0] + 1, pin[1] + 1] : null);
  }
  $('bt-voltar-hub').onclick = () => { if (!dlgAtivo && !modalAberto) voltarHub(); };
  // sair do mapa principal e voltar à tela inicial
  function sairParaInicio() {
    if (dlgAtivo) dlgAtivo.pular();
    if (modalAberto) fecharModal(true);
    A.parar();
    salvar();
    M.mapa = null;
    ['hud', 'caixa-minimapa', 'painel-missao', 'dialogo', 'prompt-interagir', 'dica-hover', 'selo-qualidade'].forEach((id) => { $(id).hidden = true; });
    $('bt-continuar').hidden = !J.perfil;
    $('bt-novo').textContent = J.perfil ? 'Novo personagem' : 'Novo jogo';
    $('tela-inicio').hidden = false;
    setTimeout(() => $('bt-continuar').focus({ preventScroll: true }), 50);
  }
  $('bt-sair').onclick = () => { A.sfx('clique'); sairParaInicio(); };

  // ---------- conquistas e insígnias ----------
  function addConquista(id) {
    if (J.conquistas.indexOf(id) >= 0) return;
    J.conquistas.push(id); salvar();
    const c = ERS.CONQUISTAS.find((x) => x.id === id);
    toast('Conquista: ' + c.nome, 'ouro');
    A.sfx('insignia');
  }
  function checarConquistas() { if (J.limpasTotal >= 15) addConquista('construtor'); }

  let nSvg = 0;
  function svgInsignia(ms, bloq, icone, cor) {
    const id = 'g' + (nSvg++);
    cor = cor || ms.cor;
    icone = icone || ms.icone;
    const d = ERS.ICONES[icone];
    return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${U.shade(cor, 0.35)}"/><stop offset="1" stop-color="${U.shade(cor, -0.3)}"/></radialGradient><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#c98a00"/></linearGradient></defs>
      <path d="M34 86 L22 116 L38 108 L46 120 L54 90Z" fill="${U.shade(cor, -0.2)}"/><path d="M86 86 L98 116 L82 108 L74 120 L66 90Z" fill="${U.shade(cor, -0.2)}"/>
      <circle cx="60" cy="56" r="48" fill="url(#${id}o)"/>
      ${Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return `<circle cx="${60 + Math.cos(a) * 44}" cy="${56 + Math.sin(a) * 44}" r="3" fill="#fff3c4" opacity=".8"/>`; }).join('')}
      <circle cx="60" cy="56" r="38" fill="url(#${id})" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
      <ellipse cx="50" cy="38" rx="20" ry="10" fill="rgba(255,255,255,.18)"/>
      <g transform="translate(36 32) scale(2)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>
      ${bloq ? '<circle cx="60" cy="56" r="48" fill="rgba(10,20,30,.55)"/>' : ''}</svg>`;
  }
  function abrirInsignias() {
    $('ins-grade').innerHTML = ERS.MISSOES.map((ms) => {
      const ins = J.insignias[ms.id];
      return `<div class="ins ${ins ? '' : 'bloq'}">${svgInsignia(ms, !ins)}<strong>${ms.insignia.nome}</strong><small>${ins ? ms.insignia.desc : ms.nome}</small>${ins ? `<span class="estrelinhas">${'★'.repeat(ins.estrelas)}${'☆'.repeat(3 - ins.estrelas)}</span>` : ''}</div>`;
    }).join('');
    $('ins-conquistas').innerHTML = ERS.CONQUISTAS.map((c) => {
      const tem = J.conquistas.indexOf(c.id) >= 0;
      return `<div class="ins ${tem ? '' : 'bloq'}">${svgInsignia({ cor: c.cor, icone: c.icone }, !tem, c.icone, c.cor)}<strong>${c.nome}</strong><small>${c.desc}</small></div>`;
    }).join('');
    const todas = nInsignias() >= ERS.MISSOES.length;
    $('ins-certificado').innerHTML = todas
      ? `<div class="certificado"><h3>Certificado de Especialista em Energia Sustentável</h3><p>Certificamos que</p><p class="nome">${(J.perfil && J.perfil.nome) || 'Estudante'}</p><p>concluiu as ${ERS.MISSOES.length} missões de Vale Esperança, com ${J.pontos.toLocaleString('pt-BR')} pontos, e ajudou a construir uma rede de energia limpa, justa e interligada.</p></div>`
      : `<p class="nota">Conquiste as ${ERS.MISSOES.length} insígnias para liberar seu certificado. Você tem ${nInsignias()}.</p>`;
    abrirModal('modal-insignias');
  }
  $('bt-insignias').onclick = abrirInsignias;

  // ---------- painel 24 h ----------
  function desenhar24() {
    if (!J.ms || !J.ms.final) return;
    const r = calcular(J.ms, J.est).h24;
    const cv = $('h24-grafico'), c = cv.getContext('2d');
    const W = cv.width, H = cv.height, pl = 46, pr = 12, pt = 16, pb = 34;
    c.clearRect(0, 0, W, H);
    const maxV = Math.max(J.ms.demanda * 1.15, ...r.dem.map((d, i) => r.solar[i] + r.eolica[i] + r.mare[i] + r.base[i] + r.hidro[i] + r.armazen[i]));
    const x = (h) => pl + (W - pl - pr) * h / 24, y = (v) => H - pb - (H - pb - pt) * v / maxV;
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '12px "Atkinson Hyperlegible", sans-serif'; c.lineWidth = 1;
    for (let v = 0; v <= maxV; v += 10) { c.beginPath(); c.moveTo(pl, y(v)); c.lineTo(W - pr, y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(v + ' MW', pl - 6, y(v) + 4); }
    c.textAlign = 'center';
    for (let h = 0; h < 24; h += 3) c.fillText(h + 'h', x(h + 0.5), H - pb + 18);
    const bw = (W - pl - pr) / 24 - 3;
    for (let h = 0; h < 24; h++) {
      let base = 0;
      ['base', 'hidro', 'eolica', 'mare', 'solar', 'armazen'].forEach((k) => {
        const v = r[k][h]; if (v <= 0) return;
        c.fillStyle = CORES_FONTE[k];
        c.fillRect(x(h) + 1.5, y(base + v), bw, y(base) - y(base + v));
        base += v;
      });
      if (r.falta[h] > 0) { c.fillStyle = 'rgba(255,107,74,.75)'; c.fillRect(x(h) + 1.5, y(base + r.falta[h]), bw, y(base) - y(base + r.falta[h])); }
    }
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath();
    r.dem.forEach((d, h) => { const px = x(h + 0.5), py = y(d); h ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke();
    $('h24-legenda').innerHTML = [['solar', 'Solar'], ['eolica', 'Eólica'], ['mare', 'Marés'], ['base', 'Biogás e biomassa'], ['hidro', 'Hidrelétrica'], ['armazen', 'Armazenamento']].map((k) => `<span><i style="background:${CORES_FONTE[k[0]]}"></i>${k[1]}</span>`).join('') + '<span><i style="background:#ff6b4a"></i>Falta energia</span><span><i style="background:#fff"></i>Consumo</span>';
    const rr = $('h24-resumo');
    rr.className = 'requisito ' + (r.horas >= 24 ? 'ok' : 'falta');
    rr.textContent = r.horas >= 24 ? 'Excelente! A energia renovável atende a cidade nas 24 horas. Agora você pode aposentar as usinas a carvão e nuclear.' : 'Atendidas ' + r.horas + ' de 24 horas. Dica: o consumo é maior no começo da noite. Combine eólica, marés, biogás, armazenamento e rede inteligente.';
  }
  $('bt-painel24').onclick = () => { abrirModal('modal-24h'); desenhar24(); };

  // ---------- configurações ----------
  function abrirConfig() {
    const seg = $('cfg-qualidade');
    const opc = [['auto', 'Automático'], ['alto', 'Alto'], ['medio', 'Médio'], ['baixo', 'Baixo'], ['minimo', 'Mínimo']];
    seg.innerHTML = '';
    opc.forEach((o) => {
      const b = document.createElement('button');
      b.textContent = o[1]; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', Q.modo === o[0]);
      b.onclick = () => { Q.definirModo(o[0]); abrirConfig(); };
      seg.appendChild(b);
    });
    $('cfg-qualidade-info').textContent = 'Em uso agora: ' + Q.NIVEIS[Q.nivel].nome + (Q.modo === 'auto' ? ' (ajuste automático conforme o desempenho do computador).' : ' (escolha manual).');
    segmentoPeriodo($('cfg-periodo'), M.periodo, (p) => aplicarPeriodo(p, J.local, $('cfg-periodo-todos').checked));
    $('cfg-periodo-todos').checked = !!J.periodos.todos && Object.keys(J.periodos).length === 1;
    $('cfg-voz').checked = A.vozLigada;
    $('cfg-alternativas').checked = A.lerAlternativas;
    $('cfg-vol-voz').value = A.volVoz; $('cfg-vol-mus').value = A.volMusica; $('cfg-vol-fx').value = A.volEfeitos;
    const sel = $('cfg-lista-vozes');
    sel.innerHTML = '<option value="">Automática (a mais natural disponível)</option>' + A.vozes.map((v) => `<option value="${v.v.name}" ${A.vozEscolhida === v.v.name ? 'selected' : ''}>${v.v.name}${v.nota >= 6 ? ' · natural' : ''}</option>`).join('');
    const nMp3 = window.ERS_VOZES ? Object.keys(window.ERS_VOZES).length : 0;
    $('cfg-voz-info').textContent = nMp3
      ? 'Vozes neurais gravadas ativas: ' + nMp3 + ' falas em português do Brasil.'
      : A.vozes.length
        ? 'Sem áudio gravado. Usando a voz do sistema em português do Brasil. Para vozes neurais gravadas, publique pelo GitHub (veja o README).'
        : 'Nenhuma voz em português do Brasil foi encontrada neste navegador. Use o Microsoft Edge ou o Google Chrome, ou publique pelo GitHub para gerar as vozes gravadas.';
    $('cfg-confirmar').hidden = true;
    abrirModal('modal-config');
  }
  $('cfg-voz').onchange = (e) => { A.vozLigada = e.target.checked; if (!A.vozLigada) A.parar(); A.salvar(); atualizarHUD(); };
  $('cfg-alternativas').onchange = (e) => { A.lerAlternativas = e.target.checked; A.salvar(); };
  $('cfg-vol-voz').oninput = (e) => { A.volVoz = +e.target.value; A.salvar(); };
  $('cfg-vol-mus').oninput = (e) => { A.volMusica = +e.target.value; A.salvar(); A.atualizarVolumes(); };
  $('cfg-vol-fx').oninput = (e) => { A.volEfeitos = +e.target.value; A.salvar(); A.atualizarVolumes(); };
  $('cfg-lista-vozes').onchange = (e) => { A.vozEscolhida = e.target.value; A.salvar(); };
  $('cfg-testar').onclick = () => { A.iniciarAudio(); A.falar('Olá! Eu sou a professora Iara. Vamos aprender sobre energias renováveis em Vale Esperança.', ERS.VOZES.iara); };
  $('cfg-reiniciar').onclick = () => { $('cfg-confirmar').hidden = false; };
  $('cfg-nao').onclick = () => { $('cfg-confirmar').hidden = true; };
  $('cfg-sim').onclick = () => {
    ['perfil', 'pontos', 'insignias', 'conquistas', 'limpasTotal', 'progresso', 'ultimoPin'].forEach((k) => S.del(k));
    location.reload();
  };
  $('bt-config').onclick = abrirConfig;
  $('bt-config-inicio').onclick = abrirConfig;
  $('bt-config').innerHTML = ERS.svg('ajustes');
  $('bt-tela').innerHTML = ERS.svg('tela');
  $('bt-voltar-hub').innerHTML = ERS.svg('mapa');
  $('bt-sair').innerHTML = ERS.svg('sair');
  $('bt-centralizar').innerHTML = ERS.svg('alvo');
  ['modal-construir', 'modal-problema', 'modal-info', 'modal-missao', 'modal-insignias', 'modal-config', 'modal-como', 'modal-24h'].forEach((id) => {
    const b = $(id).querySelector('.fechar'); if (b) b.innerHTML = ERS.svg('fechar');
  });
  $('bt-voz').onclick = () => { A.vozLigada = !A.vozLigada; if (!A.vozLigada) A.parar(); A.salvar(); atualizarHUD(); toast(A.vozLigada ? 'Vozes ligadas' : 'Vozes desligadas'); };
  $('bt-tela').onclick = () => {
    try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); } catch (e) {}
  };
  $('bt-zoom-mais').onclick = () => { M.zoomAlvo = U.clamp(M.cam.z * 1.25, Q.cfg.zoomMin, 2.2); };
  $('bt-zoom-menos').onclick = () => { M.zoomAlvo = U.clamp(M.cam.z / 1.25, Q.cfg.zoomMin, 2.2); };
  $('bt-centralizar').onclick = () => { M.cam.livre = 0; };
  $('bt-recolher').onclick = () => { const p = $('painel-missao'); p.classList.toggle('fechado'); $('bt-recolher').setAttribute('aria-expanded', !p.classList.contains('fechado')); };
  $('bt-como').onclick = () => abrirModal('modal-como');

  // minimapa
  $('minimapa').addEventListener('click', (ev) => {
    if (dlgAtivo || modalAberto) return;
    const r = ev.target.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width * M.minimapa.W, py = (ev.clientY - r.top) / r.height * M.minimapa.H;
    const t = M.minimapaParaTile(px, py);
    for (let rad = 0; rad <= 4; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (M.andavel(t[0] + dx, t[1] + dy) && M.irPara(t[0] + dx, t[1] + dy)) return;
    }
    toast('Não há caminho até esse ponto.', 'ruim');
  });
  setInterval(() => { if (!$('caixa-minimapa').hidden) M.desenharMinimapa($('minimapa')); }, 200);

  // dica ao passar o mouse
  ERS.bus.on('hover', (h) => {
    const d = $('dica-hover');
    if (!h || dlgAtivo || modalAberto) { d.hidden = true; return; }
    const e = h.e;
    let t = '', s = '';
    if (e.kind === 'pin') { const ms = missao(e.ref); t = ms.nome; s = ms.fonte + (J.insignias[ms.id] ? ' · concluída' : ''); }
    else if (e.kind === 'npc') { t = e.nome; s = e.papel; }
    else if (e.kind === 'lote') { t = e.rotulo; s = e.construido ? 'Construído · clique para ver' : 'Clique para construir'; }
    else if (e.kind === 'problema') { const pb = J.ms.problemas.find((x) => x.id === e.ref); t = pb.nome; s = e.resolvido ? 'Resolvido' : 'Problema ambiental'; }
    else if (e.kind === 'info') { t = 'Placa: Você sabia?'; s = 'Clique para ler'; }
    d.innerHTML = `${t}<small>${s}</small>`;
    d.style.left = h.x + 'px'; d.style.top = h.y + 'px';
    d.hidden = false;
  });
  // aviso de interação próxima
  let ultimoPrompt = 0;
  ERS.bus.on('posicao', () => {
    const agora = performance.now();
    if (agora - ultimoPrompt < 150) return;
    ultimoPrompt = agora;
    const p = $('prompt-interagir');
    if (dlgAtivo || modalAberto || matchMedia('(pointer: coarse)').matches) { p.hidden = true; return; }
    const e = M.maisProximo();
    if (!e) { p.hidden = true; return; }
    const verbo = e.kind === 'npc' ? 'Conversar com ' + e.nome : e.kind === 'pin' ? 'Abrir missão ' + missao(e.ref).nome : e.kind === 'lote' ? 'Construir: ' + e.rotulo : e.kind === 'problema' ? 'Ver problema' : 'Ler placa';
    p.innerHTML = `<kbd>E</kbd>${verbo}`;
    p.hidden = false;
  });
  ERS.bus.on('aviso', (t) => toast(t, 'ruim'));
  ERS.bus.on('qualidade', (q) => {
    const s = $('selo-qualidade');
    s.textContent = 'Gráficos: ' + Q.NIVEIS[q.nivel].nome + (Q.modo === 'auto' ? ' · automático' : '');
    if (q.motivo === 'desempenho' && !$('hud').hidden) toast('Qualidade gráfica ajustada para ' + Q.NIVEIS[q.nivel].nome + ' para manter o jogo fluido.');
  });

  // teclado para diálogos e modais
  window.addEventListener('keydown', (ev) => {
    if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    if (dlgAtivo && (ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'KeyE')) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      const ae = document.activeElement;
      if (ae && ae.tagName === 'BUTTON' && ae.closest('#dialogo')) ae.click(); else dlgAtivo.proximo();
      return;
    }
    if (modalAberto && (ev.code === 'KeyE' || ev.code === 'Enter' || ev.code === 'Space')) { ev.stopImmediatePropagation(); return; }
    if (ev.code === 'Escape') { ev.stopImmediatePropagation(); if (modalAberto && modalAberto.id !== 'modal-quiz' && modalAberto.id !== 'modal-vitoria') fecharModal(); else if (dlgAtivo) dlgAtivo.pular(); }
  });

  // ---------- tela inicial e personagem ----------
  let avatarSel = 0;
  function telaAvatar() {
    $('tela-inicio').hidden = true;
    $('tela-avatar').hidden = false;
    const box = $('lista-avatares');
    box.innerHTML = '';
    ERS.AVATARES.forEach((av, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === avatarSel); b.setAttribute('aria-label', av.nome);
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 160;
      retrato(cv, av, ['#7fd1ff', '#ffd88a', '#a8f0c0', '#d8b8ff'][i]);
      b.appendChild(cv);
      b.onclick = () => { avatarSel = i; A.sfx('clique'); box.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-checked', k === i)); };
      box.appendChild(b);
    });
    $('campo-nome').value = (J.perfil && J.perfil.nome) || '';
    setTimeout(() => $('campo-nome').focus(), 50);
  }
  $('bt-novo').onclick = () => { A.iniciarAudio(); A.sfx('abrir'); telaAvatar(); };
  $('bt-avatar-voltar').onclick = () => { $('tela-avatar').hidden = true; $('tela-inicio').hidden = false; };
  $('bt-avatar-ok').onclick = () => {
    const nome = $('campo-nome').value.trim() || 'Estudante';
    const novo = !J.perfil;
    J.perfil = { nome, avatar: avatarSel };
    if (novo || true) { J.progresso = J.progresso || {}; }
    salvar();
    ERS.LOOK_JOGADOR = ERS.AVATARES[avatarSel];
    $('tela-avatar').hidden = true;
    iniciarJogo(true);
  };
  $('bt-continuar').onclick = () => {
    A.iniciarAudio();
    ERS.LOOK_JOGADOR = ERS.AVATARES[(J.perfil && J.perfil.avatar) || 0];
    $('tela-inicio').hidden = true;
    iniciarJogo(false);
  };
  $('campo-nome').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('bt-avatar-ok').click(); });

  function iniciarJogo(primeiraVez) {
    A.iniciarAudio();
    carregarLocal('hub', () => {
      const q = quemNarrador();
      if (primeiraVez && !S.get('introHub', false)) { S.set('introHub', true); dialogo(ERS.HUB.intro.map((t) => ({ quem: q, texto: t }))); }
      else dialogo([{ quem: q, texto: nInsignias() >= 6 && !J.insignias.rede ? ERS.FRASES.hubFinal : ERS.FRASES.hubOla }]);
    });
    $('selo-qualidade').hidden = false;
    $('selo-qualidade').textContent = 'Gráficos: ' + Q.NIVEIS[Q.nivel].nome + (Q.modo === 'auto' ? ' · automático' : '');
    setTimeout(() => { $('selo-qualidade').hidden = true; }, 9000);
  }

  // ---------- início ----------
  Q.iniciar();
  M.iniciar($('mundo'));
  if (J.perfil) { $('bt-continuar').hidden = false; $('bt-novo').textContent = 'Novo personagem'; }
  ERS.J.calcular = calcular;
  ERS.J.simular24 = simular24;
  ERS.J.carregarLocal = carregarLocal;
  ERS.J.entrarMissao = entrarMissao;
})();
