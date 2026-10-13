/* =========================================================
   Falas: frases fixas e composição de tudo o que é falado.
   Este arquivo também é lido por tools/exportar_falas.js para
   gerar as vozes neurais gravadas (MP3).
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;

  ERS.FRASES = {
    acerto: ['Isso mesmo! Resposta certa.', 'Muito bem! Você acertou.', 'Excelente! Está correto.', 'Parabéns, resposta certa!'],
    erro: ['Não foi dessa vez. Veja a explicação.', 'Quase! Vamos entender a resposta certa.', 'Ainda não. Leia a explicação com atenção.'],
    letras: ['Alternativa A.', 'Alternativa B.', 'Alternativa C.', 'Alternativa D.'],
    obrigado: 'Obrigado pela ajuda! Agora eu entendo bem melhor esse assunto.',
    dicas: [
      'Converse com os moradores que têm um balão laranja sobre a cabeça. Cada um traz um desafio.',
      'Clique nos lotes amarelos para construir. Compare os efeitos de cada opção antes de decidir.',
      'O alerta vermelho mostra um problema ambiental. Algumas soluções exigem energia limpa suficiente antes.',
      'Acompanhe o Índice de Sustentabilidade no painel. Ele precisa chegar a setenta pontos.',
    ],
    extra: 'Vou chamar um morador para fazer mais um desafio. Acertando, você ganha créditos verdes.',
    semCredito: 'Faltam créditos verdes. Vença desafios ou leia as placas para ganhar mais.',
    requisito: 'Ainda não dá. Primeiro é preciso gerar mais energia limpa, para não deixar a cidade no escuro.',
    requisito24: 'Ainda não dá. A energia renovável precisa atender a cidade em todas as vinte e quatro horas do dia.',
    quaseLa: 'Os objetivos estão quase completos. Confira o painel de objetivos.',
    sujo: 'Atenção: essa escolha aumenta a poluição e piora o Índice de Sustentabilidade.',
    demolir: 'Construção removida. Metade dos créditos voltou para você.',
    hubOla: 'Que bom ver você de novo! Escolha uma missão nos marcadores coloridos.',
    hubFinal: 'Você já tem insígnias suficientes. A missão final da Rede Inteligente está liberada no centro da cidade!',
    hubBloqueada: 'Esta missão será liberada quando você conquistar seis insígnias.',
    hubTodas: 'Você completou todas as missões de Vale Esperança. Que orgulho! Veja seu certificado na coleção de insígnias.',
  };

  ERS.falaInfo = (inf) => inf.titulo + '. ' + inf.texto;
  ERS.falaItem = (op) => op.nome + '. ' + op.desc;
  ERS.falaProblema = (pb) => pb.nome + '. ' + pb.desc;

  // opção de lote com sobrescritas
  ERS.opcaoLote = function (op) {
    if (typeof op === 'string') return Object.assign({ id: op }, ERS.CATALOGO[op]);
    const b = ERS.CATALOGO[op.item];
    return Object.assign({ id: op.item }, b, op, { ef: Object.assign({}, op.ef || b.ef) });
  };
  // dono (voz) de cada questão: morador índice j % nº de moradores
  ERS.donoQuestao = (ms, j) => j % ms.npcs.length;

  // lista completa de falas (texto + chave de voz) para gerar MP3
  ERS.listaFalas = function () {
    const L = [];
    const add = (texto, voz) => { if (texto) L.push({ texto, voz }); };
    const F = ERS.FRASES;
    const narradoras = new Set(['iara']);
    // mapa central
    ERS.HUB.intro.forEach((t) => add(t, 'iara'));
    add(ERS.HUB.retorno, 'iara');
    ERS.HUB.infos.forEach((i) => add(ERS.falaInfo(i), 'iara'));
    (ERS.ARRANJOS && ERS.ARRANJOS.hub || []).forEach((a) => add(ERS.falaInfo(ERS.infoArranjo(a)), 'iara'));
    [F.hubOla, F.hubFinal, F.hubBloqueada, F.hubTodas].forEach((t) => add(t, 'iara'));
    ERS.MISSOES.forEach((ms) => {
      const vn = ms.narrador.voz;
      narradoras.add(vn);
      ms.intro.forEach((t) => add(t, vn));
      ms.conclusao.forEach((t) => add(t, vn));
      ms.infos.forEach((i) => add(ERS.falaInfo(i), vn));
      (ERS.ARRANJOS && ERS.ARRANJOS[ms.id] || []).forEach((a) => add(ERS.falaInfo(ERS.infoArranjo(a)), vn));
      ms.problemas.forEach((pb) => { add(ERS.falaProblema(pb), vn); add(pb.fala, vn); (pb.alternativas || []).forEach((a) => add(a.fala, vn)); });
      ms.lotes.forEach((l) => l.opcoes.forEach((o) => add(ERS.falaItem(ERS.opcaoLote(o)), vn)));
      [F.extra, F.semCredito, F.requisito, F.requisito24, F.quaseLa, F.sujo, F.demolir].concat(F.dicas).forEach((t) => add(t, vn));
      ms.npcs.forEach((n) => {
        add(n.fala, n.voz);
        add(F.obrigado, n.voz);
        F.acerto.concat(F.erro, F.letras).forEach((t) => add(t, n.voz));
      });
      ms.questoes.forEach((q, j) => {
        const v = ms.npcs[ERS.donoQuestao(ms, j)].voz;
        add(q.p, v); add(q.c, v); q.d.forEach((d) => add(d, v)); add(q.e, v);
      });
    });
    // remove duplicatas
    const vistos = new Set();
    return L.filter((f) => { const k = f.voz + '|' + f.texto; if (vistos.has(k)) return false; vistos.add(k); return true; });
  };
})();
