/* =========================================================
   Conteúdo do jogo: personagens, vozes, questões, construções
   Público: 9º ano do Ensino Fundamental — Geografia (BNCC EF09GE18)
   ========================================================= */
(function () {
  'use strict';
  const ERS = window.ERS;

  // ---------- vozes (perfis) ----------
  // edge = voz neural pt-BR usada pelo gerador de MP3; genero/tom/ritmo = navegador
  const V = (ERS.VOZES = {
    iara:     { edge: 'pt-BR-FranciscaNeural', rate: '+0%',  pitch: '+0Hz',  genero: 'F', tom: 1.0,  ritmo: 1.0 },
    luana:    { edge: 'pt-BR-ThalitaNeural',   rate: '+4%',  pitch: '+0Hz',  genero: 'F', tom: 1.06, ritmo: 1.03 },
    rafael:   { edge: 'pt-BR-AntonioNeural',   rate: '+0%',  pitch: '+0Hz',  genero: 'M', tom: 1.0,  ritmo: 1.0 },
    jandira:  { edge: 'pt-BR-FranciscaNeural', rate: '-8%',  pitch: '-6Hz',  genero: 'F', tom: 0.9,  ritmo: 0.92 },
    marina:   { edge: 'pt-BR-ThalitaNeural',   rate: '+0%',  pitch: '+2Hz',  genero: 'F', tom: 1.04, ritmo: 1.0 },
    caio:     { edge: 'pt-BR-AntonioNeural',   rate: '-4%',  pitch: '-5Hz',  genero: 'M', tom: 0.9,  ritmo: 0.96 },
    bento:    { edge: 'pt-BR-AntonioNeural',   rate: '-7%',  pitch: '-9Hz',  genero: 'M', tom: 0.84, ritmo: 0.93 },
    tania:    { edge: 'pt-BR-FranciscaNeural', rate: '+5%',  pitch: '+4Hz',  genero: 'F', tom: 1.08, ritmo: 1.05 },
    jaci:     { edge: 'pt-BR-ThalitaNeural',   rate: '-3%',  pitch: '-2Hz',  genero: 'F', tom: 0.97, ritmo: 0.97 },
    beatriz:  { edge: 'pt-BR-FranciscaNeural', rate: '+2%',  pitch: '+6Hz',  genero: 'F', tom: 1.1,  ritmo: 1.02 },
    thiago:   { edge: 'pt-BR-AntonioNeural',   rate: '+6%',  pitch: '+5Hz',  genero: 'M', tom: 1.1,  ritmo: 1.05 },
    clara:    { edge: 'pt-BR-ThalitaNeural',   rate: '+2%',  pitch: '-3Hz',  genero: 'F', tom: 0.98, ritmo: 1.02 },
    homemA:   { edge: 'pt-BR-AntonioNeural',   rate: '+3%',  pitch: '+2Hz',  genero: 'M', tom: 1.04, ritmo: 1.02 },
    homemB:   { edge: 'pt-BR-AntonioNeural',   rate: '-5%',  pitch: '-8Hz',  genero: 'M', tom: 0.86, ritmo: 0.95 },
    mulherA:  { edge: 'pt-BR-FranciscaNeural', rate: '+3%',  pitch: '+8Hz',  genero: 'F', tom: 1.12, ritmo: 1.03 },
    mulherB:  { edge: 'pt-BR-ThalitaNeural',   rate: '-4%',  pitch: '-4Hz',  genero: 'F', tom: 0.94, ritmo: 0.96 },
    jovem:    { edge: 'pt-BR-ThalitaNeural',   rate: '+8%',  pitch: '+10Hz', genero: 'F', tom: 1.18, ritmo: 1.07 },
    jovemM:   { edge: 'pt-BR-AntonioNeural',   rate: '+8%',  pitch: '+12Hz', genero: 'M', tom: 1.16, ritmo: 1.07 },
  });

  // ---------- aparência ----------
  const PELE = ['#f1c7a3', '#d9a07a', '#b97a52', '#8a5636', '#6a3f26'];
  const L = (ERS.LOOKS = {
    iara: { pele: PELE[2], cabelo: '#2a1a10', tipoCabelo: 2, camisa: '#6a4fd0', calca: '#2a3a5a', oculos: true },
    luana: { pele: PELE[1], cabelo: '#4a2a14', tipoCabelo: 1, camisa: '#f0a21f', calca: '#2a4a7a', chapeu: 'capacete', corChapeu: '#ffffff' },
    rafael: { pele: PELE[3], cabelo: '#1a1a1a', tipoCabelo: 4, camisa: '#2f7ad2', calca: '#3a3a3a', barba: true },
    jandira: { pele: PELE[3], cabelo: '#d8d8d8', tipoCabelo: 3, camisa: '#2e9e4a', calca: '#5a3a2a', chapeu: 'palha' },
    marina: { pele: PELE[0], cabelo: '#b8562a', tipoCabelo: 1, camisa: '#1fa3a3', calca: '#2a3a5a' },
    caio: { pele: PELE[1], cabelo: '#6a6a6a', tipoCabelo: 0, camisa: '#e85a2a', calca: '#4a4a4a', oculos: true, barba: true, chapeu: 'capacete', corChapeu: '#ff8a3a' },
    bento: { pele: PELE[2], cabelo: '#3a2a1a', tipoCabelo: 4, camisa: '#8ac83a', calca: '#5a4a2a', chapeu: 'palha', barba: true },
    tania: { pele: PELE[4], cabelo: '#1a1a1a', tipoCabelo: 2, camisa: '#2fa05a', calca: '#2a3a5a', colete: '#ffd23f' },
    jaci: { pele: PELE[2], cabelo: '#0f0f0f', tipoCabelo: 1, camisa: '#c8463a', calca: '#3a2a1a', chapeu: 'cocar' },
    beatriz: { pele: PELE[1], cabelo: '#2a1a10', tipoCabelo: 3, camisa: '#8a5bd0', calca: '#3a3a3a', chapeu: 'capacete', corChapeu: '#ffd23f', colete: '#ff8a3a' },
    thiago: { pele: PELE[0], cabelo: '#5a3a1a', tipoCabelo: 0, camisa: '#3a4256', calca: '#2a2a3a', oculos: true },
    clara: { pele: PELE[3], cabelo: '#1a1a1a', tipoCabelo: 3, camisa: '#2a7fd0', calca: '#2a3a5a', chapeu: 'capacete', corChapeu: '#ffffff' },
  });
  // personagens secundários gerados
  const CAMISAS = ['#d9533b', '#3a7bd5', '#f0c419', '#2fa05a', '#8a5bd0', '#ff8a3a', '#1fa3a3', '#e85a8a'];
  ERS.lookNPC = function (k) {
    return { pele: PELE[k % 5], cabelo: ['#1a1a1a', '#4a2a14', '#d8d8d8', '#8a5a2a', '#2a1a10'][(k * 3) % 5], tipoCabelo: k % 5, camisa: CAMISAS[k % CAMISAS.length], calca: ['#2a3a5a', '#3a3a3a', '#5a4a2a'][k % 3], chapeu: k % 4 === 1 ? 'bone' : k % 7 === 3 ? 'palha' : undefined, corChapeu: CAMISAS[(k + 3) % 8], oculos: k % 6 === 2 };
  };
  ERS.AVATARES = [
    { nome: 'Estudante 1', pele: PELE[1], cabelo: '#2a1a10', tipoCabelo: 0, camisa: '#2fa05a', calca: '#2a4a7a', chapeu: 'bone', corChapeu: '#ffd23f', mochila: '#d9533b' },
    { nome: 'Estudante 2', pele: PELE[3], cabelo: '#1a1a1a', tipoCabelo: 2, camisa: '#f0a21f', calca: '#3a3a5a', mochila: '#3a7bd5' },
    { nome: 'Estudante 3', pele: PELE[0], cabelo: '#b8562a', tipoCabelo: 1, camisa: '#3a7bd5', calca: '#2a2a3a', mochila: '#2fa05a' },
    { nome: 'Estudante 4', pele: PELE[4], cabelo: '#1a1a1a', tipoCabelo: 3, camisa: '#8a5bd0', calca: '#2a3a5a', chapeu: 'bone', corChapeu: '#2fa05a', mochila: '#f0c419' },
  ];
  ERS.LOOK_JOGADOR = ERS.AVATARES[0];

  // ---------- questões ----------
  const q = (p, c, d, e) => ({ p, c, d, e });

  // ---------- catálogo de construções ----------
  // ef: energia (MW limpos), co2 (pontos de emissão; negativo reduz), agua, bio, social
  // perfil (missão final): solar | eolica | mare | base | hidro | bateria | h2 | smart | fossil
  ERS.CATALOGO = {
    escolaSolar: { nome: 'Painéis solares no telhado da escola', spr: 'escola', v: 1, custo: 150, tipo: 'limpa', ef: { energia: 4, co2: -6, social: 6 }, desc: 'Geração distribuída: a escola produz a própria energia e serve de exemplo para o bairro.' },
    aquecedorSolar: { nome: 'Aquecedores solares de água', spr: 'aquecedorSolar', custo: 90, tipo: 'limpa', ef: { energia: 2, co2: -4, social: 5 }, desc: 'Esquentam a água do banho com o Sol e reduzem o uso do chuveiro elétrico.' },
    casaSolar: { nome: 'Casas com painéis fotovoltaicos', spr: 'casaSolar', custo: 110, tipo: 'limpa', ef: { energia: 3, co2: -4, social: 5 }, desc: 'Microgeração nos telhados das casas, com o excedente enviado à rede.' },
    usinaSolar: { nome: 'Usina solar fotovoltaica', spr: 'usinaSolar', custo: 260, tipo: 'limpa', ef: { energia: 12, co2: -12, bio: 2 }, perfil: 'solar', cap: 12, desc: 'Grande conjunto de painéis. Gera muito ao meio-dia e nada à noite.' },
    solarFlutuante: { nome: 'Usina solar flutuante', spr: 'solarFlutuante', custo: 240, tipo: 'limpa', ef: { energia: 10, co2: -10, agua: 5 }, perfil: 'solar', cap: 10, desc: 'Painéis sobre a represa: não ocupam terra e reduzem a evaporação da água.' },
    painelSolar: { nome: 'Painéis solares comunitários', spr: 'painelSolar', custo: 100, tipo: 'limpa', ef: { energia: 4, co2: -5, social: 4 }, perfil: 'solar', cap: 4, desc: 'Pequena central solar que atende a comunidade local.' },
    bateria: { nome: 'Banco de baterias', spr: 'bateria', custo: 130, tipo: 'limpa', ef: { energia: 3, social: 2 }, perfil: 'bateria', cap: 5, desc: 'Guarda a energia que sobra durante o dia para usar no início da noite.' },
    carregadorVE: { nome: 'Estacionamento solar com recarga elétrica', spr: 'carregadorVE', custo: 110, tipo: 'limpa', ef: { energia: 2, co2: -6, social: 4 }, desc: 'Cobertura com painéis e recarga para ônibus e carros elétricos.' },
    geradorDiesel: { nome: 'Gerador a óleo diesel', spr: 'geradorDiesel', custo: 80, tipo: 'suja', ef: { energia: 6, co2: 18, social: -6 }, perfil: 'fossil', cap: 6, desc: 'Barato e rápido, mas queima combustível fóssil, polui o ar e faz barulho.' },
    termeletricaOleo: { nome: 'Termelétrica a óleo combustível', spr: 'termeletrica', custo: 200, tipo: 'suja', ef: { energia: 15, co2: 30, agua: -8, social: -8 }, perfil: 'fossil', cap: 15, desc: 'Produz muita energia queimando derivados de petróleo. Emite CO₂ e aquece a água dos rios.' },
    termeletricaGas: { nome: 'Termelétrica a gás natural', spr: 'termeletrica', custo: 220, tipo: 'suja', ef: { energia: 15, co2: 20, agua: -6, social: -4 }, perfil: 'fossil', cap: 15, desc: 'Emite menos que o carvão, mas continua sendo uma fonte fóssil.' },
    parque: { nome: 'Parque e trilha na mata', spr: 'cinturaoVerde', custo: 60, tipo: 'limpa', ef: { bio: 10, social: 6, co2: -2 }, desc: 'Conserva a mata nativa e cria lazer e educação ambiental.' },
    torreEolica: { nome: 'Aerogerador', spr: 'torreEolica', custo: 140, tipo: 'limpa', ef: { energia: 6, co2: -7, bio: -1, social: 2 }, perfil: 'eolica', cap: 6, desc: 'Transforma a força do vento em eletricidade.' },
    eolicaOffshore: { nome: 'Aerogerador no mar (offshore)', spr: 'torreEolica', v: 1, custo: 220, tipo: 'limpa', ef: { energia: 9, co2: -9, bio: -3, social: 1 }, perfil: 'eolica', cap: 9, desc: 'Aproveita ventos mais fortes e constantes no mar.' },
    subestacao: { nome: 'Subestação e linha de transmissão', spr: 'subestacao', custo: 120, tipo: 'limpa', ef: { energia: 2, social: 3 }, desc: 'Conecta as usinas à rede e reduz perdas de energia.' },
    escadaPeixes: { nome: 'Escada de peixes na barragem', spr: 'escadaPeixes', custo: 90, tipo: 'limpa', ef: { bio: 12, social: 4 }, desc: 'Permite que os peixes subam o rio na piracema.' },
    pch: { nome: 'Pequena central hidrelétrica (PCH)', spr: 'pch', custo: 170, tipo: 'limpa', ef: { energia: 7, co2: -6, bio: -3, social: 1 }, perfil: 'hidro', cap: 4, desc: 'Usina pequena, com reservatório reduzido e menor área alagada.' },
    grandeBarragem: { nome: 'Nova grande hidrelétrica (alaga o vale)', spr: 'casaForca', custo: 260, tipo: 'atencao', ef: { energia: 16, co2: 4, bio: -22, social: -18 }, perfil: 'hidro', cap: 10, desc: 'Muita energia, mas alaga florestas, desloca famílias e libera metano.' },
    usinaReversivel: { nome: 'Usina hidrelétrica reversível', spr: 'usinaReversivel', custo: 240, tipo: 'limpa', ef: { energia: 6, co2: -4, social: 2 }, perfil: 'hidro', cap: 8, armazena: 40, desc: 'Bombeia água para cima quando sobra energia e gera quando falta. Uma bateria gigante.' },
    centroComunitario: { nome: 'Centro comunitário com energia solar', spr: 'cooperativa', v: 1, custo: 100, tipo: 'limpa', ef: { energia: 1, social: 10, co2: -2 }, desc: 'Espaço de decisão da comunidade sobre os projetos de energia.' },
    barragemMare: { nome: 'Barragem de maré', spr: 'barragemMare', custo: 240, tipo: 'limpa', ef: { energia: 11, co2: -10, bio: -8, social: 1 }, perfil: 'mare', cap: 11, desc: 'Represa a água na maré alta e gera energia quando ela volta.' },
    barragemMareMangue: { nome: 'Barragem de maré no manguezal', spr: 'barragemMare', custo: 240, tipo: 'atencao', ef: { energia: 11, co2: -6, bio: -25, social: -8 }, perfil: 'mare', cap: 11, desc: 'Gera energia, mas bloqueia o berçário de peixes e caranguejos.' },
    turbinaMare: { nome: 'Turbina de corrente de maré', spr: 'turbinaMare', custo: 200, tipo: 'limpa', ef: { energia: 7, co2: -7, bio: -2 }, perfil: 'mare', cap: 7, desc: 'Hélice submersa movida pelas correntes. Não precisa de barragem.' },
    boiaOndas: { nome: 'Conversor de energia das ondas', spr: 'boiaOndas', custo: 160, tipo: 'limpa', ef: { energia: 5, co2: -5, bio: -1 }, perfil: 'mare', cap: 5, desc: 'Flutuadores articulados que geram energia com o sobe e desce das ondas.' },
    preservarMangue: { nome: 'Reserva do manguezal', spr: 'mataCiliar', custo: 50, tipo: 'limpa', ef: { bio: 12, social: 4, co2: -3 }, desc: 'Protege o berçário marinho e a pesca artesanal.' },
    eletrificarPorto: { nome: 'Eletrificação do porto', spr: 'carregadorVE', custo: 120, tipo: 'limpa', ef: { co2: -8, social: 4, energia: 1 }, desc: 'Navios atracados ligam-se à rede em vez de manter motores a diesel ligados.' },
    geotermica: { nome: 'Usina geotérmica', spr: 'geotermica', custo: 280, tipo: 'limpa', ef: { energia: 14, co2: -10, agua: -3, social: 2 }, perfil: 'base', cap: 7, desc: 'Usa o vapor do subsolo quente para girar turbinas, dia e noite.' },
    geotermicaRisco: { nome: 'Usina geotérmica na encosta de risco', spr: 'geotermica', custo: 280, tipo: 'atencao', ef: { energia: 14, co2: -8, bio: -6, social: -15 }, desc: 'Gera energia, mas fica numa área sujeita a deslizamentos e gases.' },
    pocoReinjecao: { nome: 'Poços de reinjeção', spr: 'pocoGeo', custo: 80, tipo: 'limpa', ef: { agua: 8, bio: 3, social: 2 }, desc: 'Devolvem a água ao reservatório e mantêm a pressão do subsolo.' },
    estufaGeo: { nome: 'Estufas aquecidas pelo calor da Terra', spr: 'estufa', custo: 90, tipo: 'limpa', ef: { energia: 2, social: 7, co2: -3 }, desc: 'Uso direto do calor para produzir alimentos o ano todo.' },
    estacaoSismica: { nome: 'Estação de monitoramento sísmico', spr: 'centroControle', custo: 70, tipo: 'limpa', ef: { social: 8 }, desc: 'Monitora tremores, gases e o vulcão para proteger a população.' },
    filtroGas: { nome: 'Filtros de gás sulfídrico', spr: 'filtroGas', custo: 90, tipo: 'limpa', ef: { social: 8, co2: -2, agua: 2 }, desc: 'Retiram o gás com cheiro de ovo podre antes que chegue ao ar.' },
    termas: { nome: 'Parque de águas termais', spr: 'quiosque', custo: 70, tipo: 'limpa', ef: { social: 8 }, desc: 'Turismo e lazer com as fontes naturais de água quente.' },
    biomassa: { nome: 'Cogeração com bagaço de cana', spr: 'biomassa', custo: 260, tipo: 'limpa', ef: { energia: 14, co2: -8, social: 4 }, perfil: 'base', cap: 6, desc: 'A usina queima o bagaço em caldeiras, gera vapor e eletricidade.' },
    biogasVinhaca: { nome: 'Biogás a partir da vinhaça', spr: 'usinaBiogas', custo: 160, tipo: 'limpa', ef: { energia: 5, agua: 9, co2: -5 }, perfil: 'base', cap: 5, desc: 'A vinhaça vai para biodigestores e vira gás combustível e adubo.' },
    vinhacaRio: { nome: 'Despejar a vinhaça no córrego', spr: 'tanqueVinhaca', custo: 0, tipo: 'suja', ef: { agua: -20, bio: -10, social: -4 }, desc: 'Sem custo, mas contamina a água e mata os peixes.' },
    etanol2G: { nome: 'Destilaria de etanol de 2ª geração', spr: 'destilaria', custo: 180, tipo: 'limpa', ef: { energia: 4, co2: -8, social: 3 }, desc: 'Transforma palha e bagaço em mais etanol, sem plantar mais cana.' },
    mataCiliar: { nome: 'Recomposição da mata ciliar', spr: 'mataCiliar', custo: 60, tipo: 'limpa', ef: { agua: 8, bio: 9, co2: -3 }, desc: 'Árvores nativas nas margens protegem o rio e os animais.' },
    expandirCana: { nome: 'Expandir o canavial até o córrego', spr: 'canavial', custo: 40, tipo: 'suja', ef: { bio: -12, agua: -8, social: -2 }, desc: 'Mais cana, mas sem mata ciliar o solo escorre para o rio.' },
    agrofloresta: { nome: 'Sistema agroflorestal', spr: 'agrofloresta', custo: 120, tipo: 'limpa', ef: { bio: 12, co2: -6, social: 6, agua: 3 }, desc: 'Árvores nativas, frutas e lavouras juntas: diversidade e renda.' },
    biodigestor: { nome: 'Biodigestor rural', spr: 'biodigestor', custo: 110, tipo: 'limpa', ef: { energia: 3, co2: -6, agua: 6 }, perfil: 'base', cap: 3, desc: 'Transforma esterco em biogás e biofertilizante.' },
    reciclagem: { nome: 'Galpão da cooperativa de reciclagem', spr: 'reciclagem', custo: 180, tipo: 'limpa', ef: { social: 12, co2: -6, bio: 2 }, desc: 'Renda digna para catadores e menos lixo no aterro.' },
    usinaBiogasAterro: { nome: 'Usina de biogás do aterro', spr: 'usinaBiogas', custo: 180, tipo: 'limpa', ef: { energia: 6, co2: -10 }, perfil: 'base', cap: 5, desc: 'Captura o metano do lixo e o usa para gerar eletricidade.' },
    incinerador: { nome: 'Incinerador sem controle de gases', spr: 'incinerador', custo: 150, tipo: 'suja', ef: { energia: 8, co2: 12, social: -10 }, desc: 'Gera energia queimando lixo, mas solta gases tóxicos como dioxinas.' },
    ecoponto: { nome: 'Ecoponto de coleta seletiva', spr: 'ecoponto', custo: 60, tipo: 'limpa', ef: { social: 6, co2: -3, bio: 2 }, desc: 'Lugar para entregar recicláveis, óleo de cozinha e entulho.' },
    compostagem: { nome: 'Compostagem comunitária', spr: 'compostagem', custo: 50, tipo: 'limpa', ef: { bio: 4, social: 6, co2: -4 }, desc: 'Restos de alimentos viram adubo para a horta.' },
    logisticaReversa: { nome: 'Posto de logística reversa', spr: 'reciclaEletronicos', custo: 120, tipo: 'limpa', ef: { social: 4, co2: -3, bio: 4, agua: 3 }, desc: 'Recebe pilhas, eletrônicos e pneus e devolve aos fabricantes.' },
    reflorestamento: { nome: 'Reflorestamento com espécies nativas', spr: 'reflorestamento', custo: 120, tipo: 'limpa', ef: { bio: 14, co2: -8, agua: 4 }, desc: 'Mudas nativas recuperam a floresta, o solo e a água.' },
    pastoExtensivo: { nome: 'Pasto extensivo para gado', spr: 'fazenda', custo: 60, tipo: 'suja', ef: { bio: -10, co2: 8, social: 2 }, desc: 'Ocupa muita terra com poucos animais e estimula novos desmatamentos.' },
    viveiro: { nome: 'Viveiro de mudas nativas', spr: 'viveiro', custo: 70, tipo: 'limpa', ef: { social: 8, bio: 4 }, desc: 'Produz mudas e gera trabalho para a comunidade.' },
    recuperarMina: { nome: 'Recuperação da área minerada', spr: 'reflorestamento', custo: 110, tipo: 'limpa', ef: { bio: 12, social: 4, agua: 4 }, desc: 'Solo tratado, curvas de nível e plantio de espécies nativas.' },
    novaCava: { nome: 'Nova cava sem licença ambiental', spr: 'cavaMina', custo: 30, tipo: 'suja', ef: { bio: -15, agua: -10, social: -10 }, desc: 'Lucro rápido, mas ilegal e muito danoso ao ambiente.' },
    reciclaEletronicos: { nome: 'Mineração urbana: reciclagem de eletrônicos', spr: 'reciclaEletronicos', custo: 140, tipo: 'limpa', ef: { co2: -4, bio: 6, social: 6 }, desc: 'Recupera terras raras, cobre e ouro de aparelhos descartados.' },
    eta: { nome: 'Estação de tratamento de água', spr: 'eta', custo: 120, tipo: 'limpa', ef: { agua: 12, social: 4 }, desc: 'Trata a água usada pela mina antes de devolvê-la ao rio.' },
    eolicaSemImas: { nome: 'Aerogerador sem ímãs de terras raras', spr: 'torreEolica', custo: 150, tipo: 'limpa', ef: { energia: 6, co2: -7, bio: 1 }, perfil: 'eolica', cap: 6, desc: 'Usa gerador de indução e reduz a demanda por terras raras.' },
    resfriamentoPotavel: { nome: 'Resfriamento evaporativo com água potável', spr: 'resfriamentoAgua', custo: 80, tipo: 'atencao', ef: { agua: -15, social: -4 }, desc: 'Barato, mas gasta milhões de litros de água que faltam à cidade.' },
    resfriamentoReuso: { nome: 'Resfriamento em circuito fechado com água de reúso', spr: 'eta', custo: 160, tipo: 'limpa', ef: { agua: 10, energia: 3, co2: -3 }, desc: 'Reaproveita a água e usa o ar externo frio quando possível.' },
    muroAcustico: { nome: 'Barreira acústica com jardim', spr: 'muroAcustico', custo: 70, tipo: 'limpa', ef: { social: 10, bio: 2 }, desc: 'Reduz o ruído dos ventiladores para os vizinhos.' },
    cinturaoVerde: { nome: 'Cinturão verde de árvores', spr: 'cinturaoVerde', custo: 60, tipo: 'limpa', ef: { social: 6, bio: 6, co2: -2 }, desc: 'Árvores absorvem ruído, sombreiam e abrigam aves.' },
    estufaCalor: { nome: 'Estufas e piscina com calor reaproveitado', spr: 'estufa', custo: 90, tipo: 'limpa', ef: { energia: 2, social: 8, co2: -4 }, desc: 'O calor dos servidores aquece estufas e uma piscina pública.' },
    hidrogenio: { nome: 'Planta de hidrogênio verde', spr: 'hidrogenio', custo: 200, tipo: 'limpa', ef: { energia: 2, co2: -6 }, perfil: 'h2', cap: 4, armazena: 60, desc: 'Usa energia renovável para separar a água e guardar hidrogênio.' },
    redeInteligente: { nome: 'Centro de controle da rede inteligente', spr: 'centroControle', custo: 160, tipo: 'limpa', ef: { social: 6, co2: -4 }, perfil: 'smart', desc: 'Medidores inteligentes deslocam consumo e reduzem o pico da noite.' },
    usinaBiogas: { nome: 'Usina de biogás', spr: 'usinaBiogas', custo: 170, tipo: 'limpa', ef: { energia: 5, co2: -6 }, perfil: 'base', cap: 5, desc: 'Energia firme a partir de resíduos orgânicos.' },
  };

  // ---------- missões ----------
  const MISSOES = [];
  ERS.MISSOES = MISSOES;

  MISSOES.push({
    id: 'solar', nome: 'Bairro do Sol', fonte: 'Energia solar', icone: 'sol', cor: '#f0a21f', tema: 'cidade',
    insignia: { nome: 'Raio de Sol', desc: 'Domina a energia solar fotovoltaica e térmica.' },
    narrador: { nome: 'Luana Costa', papel: 'Engenheira eletricista', voz: 'luana', look: 'luana' },
    intro: [
      'Oi! Eu sou a Luana, engenheira eletricista. Bem-vindo ao Bairro do Sol, a parte mais ensolarada de Vale Esperança.',
      'Hoje o bairro depende de um gerador a óleo diesel barulhento e poluente. A conta de luz está cara e o ar está pesado.',
      'Sua missão: conversar com os moradores, vencer os desafios, construir soluções solares nos lotes amarelos e desligar o gerador a diesel.',
      'Mas atenção: até uma energia limpa pode causar problemas se for colocada no lugar errado. Escolha bem!',
    ],
    conclusao: ['Incrível! O bairro agora produz energia com o Sol, de forma limpa e silenciosa.', 'Você ganhou a insígnia Raio de Sol. Leve esse conhecimento para as próximas missões!'],
    demanda: 30, base: { energia: 0, co2: 90, agua: 45, bio: 45, social: 45 },
    npcs: [
      { nome: 'Seu Joaquim', papel: 'Comerciante', voz: 'homemB', fala: 'Minha padaria gasta muita energia. Será que o Sol pode ajudar? Responda este desafio!' },
      { nome: 'Ana', papel: 'Estudante do 9º ano', voz: 'jovem', fala: 'Estou fazendo um trabalho sobre energia solar. Me ajuda com esta pergunta?' },
      { nome: 'Dona Cida', papel: 'Aposentada', voz: 'mulherB', fala: 'Meu neto quer colocar painéis no telhado. Antes, quero entender uma coisa.' },
      { nome: 'Pedro', papel: 'Eletricista', voz: 'homemA', fala: 'Eu instalo painéis solares. Quero ver se você entende do assunto!' },
    ],
    lotes: [
      { id: 'escola', rotulo: 'Telhado da Escola Municipal', fp: [2, 2], base: { spr: 'escola', v: 0 }, opcoes: ['escolaSolar', 'geradorDiesel'] },
      { id: 'degradado', rotulo: 'Terreno degradado (antigo depósito)', fp: [2, 2], opcoes: ['usinaSolar', 'termeletricaOleo'] },
      { id: 'mata', rotulo: 'Mata nativa do morro', fp: [2, 2], opcoes: [{ item: 'usinaSolar', nome: 'Usina solar derrubando a mata', tipo: 'atencao', ef: { energia: 12, co2: -6, bio: -22, social: -4 }, desc: 'Gera energia limpa, mas derruba a floresta e expulsa os animais.' }, 'parque'] },
      { id: 'lago', rotulo: 'Lago da represa', fp: [2, 2], agua: true, opcoes: ['solarFlutuante'] },
      { id: 'casas', rotulo: 'Rua das Palmeiras', fp: [1, 1], opcoes: ['casaSolar', 'aquecedorSolar'] },
      { id: 'estac', rotulo: 'Estacionamento do mercado', fp: [1, 1], opcoes: ['carregadorVE', 'bateria', 'geradorDiesel'] },
    ],
    problemas: [
      { id: 'diesel', nome: 'Gerador a diesel do bairro', spr: 'geradorDiesel', sprResolvido: 'bateria', desc: 'O gerador queima óleo diesel o dia inteiro, faz barulho e solta fumaça.', impactos: ['Emite CO₂ e fuligem', 'Poluição sonora', 'Combustível caro e fóssil'], acao: { rotulo: 'Desligar o gerador e instalar baterias', custo: 60, requer: { cobertura: 0.5 }, ef: { co2: -35, social: 8 } }, fala: 'Muito bem! Sem o diesel, o ar fica mais limpo e as noites, silenciosas.' },
    ],
    infos: [
      { titulo: 'Geração distribuída', texto: 'No Brasil, casas, escolas e comércios podem produzir a própria energia solar e enviar o excedente para a rede. Isso é a micro e minigeração distribuída.' },
      { titulo: 'O caminho da luz', texto: 'As células fotovoltaicas, feitas principalmente de silício, transformam a luz do Sol em corrente elétrica. Um inversor converte essa corrente para uso nas tomadas.' },
    ],
    questoes: [
      q('Como funciona um painel fotovoltaico?', 'Converte a luz do Sol diretamente em energia elétrica.', ['Aquece a água para gerar vapor que move turbinas.', 'Armazena o calor do Sol em rochas para usar à noite.', 'Usa o vento quente do dia para girar um gerador.'], 'As células fotovoltaicas, geralmente de silício, transformam a luz em corrente elétrica, sem queima e sem ruído.'),
      q('Qual é a principal limitação da energia solar fotovoltaica?', 'A geração para à noite e cai em dias muito nublados.', ['Ela emite muito gás carbônico durante a operação.', 'Ela só funciona em países de clima frio e seco.', 'Ela precisa de grandes represas para funcionar bem.'], 'A energia solar é intermitente. Por isso ela é combinada com baterias, hidrelétricas e outras fontes.'),
      q('Por que o Brasil tem grande potencial para a energia solar?', 'Porque a maior parte do território está na zona tropical.', ['Porque o país fica inteiro no hemisfério norte do planeta.', 'Porque o Brasil tem invernos longos e cobertos de neve.', 'Porque o céu brasileiro fica nublado durante o ano todo.'], 'Grande parte do Brasil recebe muita radiação solar o ano inteiro, com destaque para o semiárido nordestino e o interior do país.'),
      q('O que é geração distribuída de energia solar?', 'Produzir energia perto de onde ela é consumida, como em telhados.', ['Transportar energia solar por navios até outros continentes.', 'Distribuir painéis solares apenas dentro de usinas nucleares.', 'Gerar energia só em grandes usinas muito longe das cidades.'], 'Na geração distribuída, casas, escolas e comércios produzem a própria energia e podem enviar o excedente para a rede.'),
      q('Qual é uma boa escolha de local para uma usina solar de grande porte?', 'Uma área já degradada, sem floresta e com muito sol.', ['Uma floresta nativa, derrubada para instalar painéis.', 'O fundo de um vale sombreado por montanhas altas.', 'Uma área de mangue, aterrada para receber painéis.'], 'Instalar painéis em áreas degradadas, telhados ou reservatórios evita desmatamento e conflitos com a biodiversidade.'),
      q('O que deve acontecer com os painéis solares no fim da vida útil?', 'Devem ser reciclados para recuperar vidro, alumínio e silício.', ['Devem ser queimados em fornos a céu aberto no centro das cidades.', 'Devem ser jogados nos rios para não ocupar espaço nos aterros.', 'Devem ser enterrados em lixões junto com o lixo comum das casas.'], 'Os painéis duram de 25 a 30 anos. A reciclagem evita resíduos e reaproveita materiais valiosos.'),
      q('Qual é a diferença entre aquecedor solar e painel fotovoltaico?', 'O aquecedor esquenta a água; o painel fotovoltaico gera eletricidade.', ['O aquecedor gera eletricidade; o painel serve apenas para iluminar a casa.', 'Os dois são iguais e servem apenas para aquecer a água das piscinas.', 'O aquecedor usa carvão; o painel usa óleo diesel para funcionar.'], 'O aquecedor solar térmico reduz o uso do chuveiro elétrico; o painel fotovoltaico produz energia elétrica.'),
      q('Por que as baterias ajudam a energia solar?', 'Guardam a energia do dia para usar à noite ou no horário de pico.', ['Aumentam a luz do Sol que chega aos painéis durante o meio-dia.', 'Transformam a energia solar em petróleo para abastecer os carros.', 'Impedem que os painéis esquentem demais durante todo o verão.'], 'O armazenamento resolve parte da intermitência: a energia sobra ao meio-dia e falta no início da noite.'),
      q('Qual impacto ambiental está ligado à fabricação dos painéis solares?', 'A mineração de matérias-primas, como quartzo, prata e cobre.', ['A emissão de fumaça preta enquanto os painéis funcionam.', 'O barulho intenso que os painéis fazem durante o dia.', 'O vazamento de óleo dos painéis nos rios da cidade.'], 'Toda tecnologia tem impactos. No caso da solar, eles se concentram na extração de minerais e na fabricação.'),
    ],
  });

  MISSOES.push({
    id: 'eolica', nome: 'Serra dos Ventos', fonte: 'Energia eólica', icone: 'vento', cor: '#2fa0d8', tema: 'mar',
    insignia: { nome: 'Vento Forte', desc: 'Planeja parques eólicos ouvindo pessoas e natureza.' },
    narrador: { nome: 'Rafael Nunes', papel: 'Meteorologista', voz: 'rafael', look: 'rafael' },
    intro: [
      'Olá, eu sou o Rafael, meteorologista. Aqui na Serra dos Ventos o vento sopra forte quase o ano inteiro.',
      'Ao lado da vila funciona uma termelétrica a carvão. Ela solta fumaça escura e gases que causam chuva ácida.',
      'Sua missão é planejar um parque eólico: escolha os melhores lugares para os aerogeradores, respeite a vila e a rota das aves, e desative a termelétrica.',
    ],
    conclusao: ['Os aerogeradores giram e a fumaça do carvão sumiu do céu da serra.', 'Você conquistou a insígnia Vento Forte!'],
    demanda: 30, base: { energia: 0, co2: 92, agua: 45, bio: 50, social: 45 },
    npcs: [
      { nome: 'Seu Tião', papel: 'Pescador', voz: 'homemB', fala: 'O vento aqui é bom para velejar. Será que também serve para gerar energia?' },
      { nome: 'Lia', papel: 'Bióloga de aves', voz: 'mulherA', fala: 'Eu estudo as aves migratórias desta serra. Tenho um desafio para você.' },
      { nome: 'Dona Rosa', papel: 'Agricultora', voz: 'mulherB', fala: 'Uma empresa quer alugar minha terra para uma torre. Antes de decidir, me ajude.' },
      { nome: 'Caio', papel: 'Técnico de manutenção', voz: 'jovemM', fala: 'Eu subo nas torres para fazer manutenção. Bora testar seu conhecimento?' },
    ],
    lotes: [
      { id: 'crista1', rotulo: 'Crista da serra (norte)', fp: [1, 1], opcoes: ['torreEolica', 'geradorDiesel'] },
      { id: 'crista2', rotulo: 'Crista da serra (centro)', fp: [1, 1], opcoes: ['torreEolica', 'geradorDiesel'] },
      { id: 'crista3', rotulo: 'Crista da serra (sul)', fp: [1, 1], opcoes: ['torreEolica', 'painelSolar'] },
      { id: 'vila', rotulo: 'Terreno colado às casas da vila', fp: [1, 1], opcoes: [{ item: 'torreEolica', nome: 'Aerogerador ao lado das casas', tipo: 'atencao', ef: { energia: 6, co2: -7, social: -14 }, desc: 'Gera energia, mas o ruído e a sombra das pás incomodam os moradores.' }, 'painelSolar'] },
      { id: 'aves', rotulo: 'Lagoa da rota das aves', fp: [1, 1], opcoes: [{ item: 'torreEolica', nome: 'Aerogerador na rota migratória', tipo: 'atencao', ef: { energia: 6, co2: -7, bio: -16 }, desc: 'Gera energia, mas aumenta o risco de colisão de aves.' }, 'parque'] },
      { id: 'mar', rotulo: 'Mar raso (offshore)', fp: [1, 1], agua: true, opcoes: ['eolicaOffshore'] },
      { id: 'sub', rotulo: 'Área da subestação', fp: [1, 1], opcoes: ['subestacao', 'bateria'] },
    ],
    problemas: [
      { id: 'carvao', nome: 'Termelétrica a carvão mineral', spr: 'termeletrica', sprResolvido: 'termeletricaDesativada', fp: [2, 2], desc: 'Queima carvão mineral dia e noite para gerar eletricidade.', impactos: ['Grande emissão de CO₂', 'Gases que formam chuva ácida', 'Água quente devolvida ao rio'], acao: { rotulo: 'Desativar e transformar em Museu da Energia', custo: 80, requer: { cobertura: 0.6 }, ef: { co2: -45, agua: 8, social: 8 } }, fala: 'A chaminé apagou! A antiga usina virou museu e conta a história da transição energética.' },
    ],
    infos: [
      { titulo: 'Ventos alísios', texto: 'Os ventos alísios sopram dos trópicos em direção à linha do Equador. No litoral do Nordeste eles são fortes e constantes, ideais para a energia eólica.' },
      { titulo: 'Vento e água se completam', texto: 'No Nordeste, venta mais justamente no período seco. Assim, a energia eólica ajuda a poupar a água dos reservatórios das hidrelétricas.' },
    ],
    questoes: [
      q('O que faz as pás de um aerogerador girarem?', 'A energia cinética do vento, que move as pás e o gerador.', ['O calor do Sol, que dilata as pás e faz o rotor girar.', 'Um motor a diesel instalado dentro da torre eólica.', 'A água da chuva, que escorre pelas pás e as empurra.'], 'O vento empurra as pás, o rotor gira e o gerador transforma esse movimento em eletricidade.'),
      q('Qual região brasileira se destaca na geração eólica?', 'O Nordeste, com ventos fortes e constantes no litoral e no interior.', ['A Amazônia, onde as árvores muito altas aumentam a força dos ventos.', 'O Pantanal, onde as cheias criam ventos muito fortes todos os dias.', 'O Sul, porque somente lá os ventos sopram durante a noite toda.'], 'Bahia, Rio Grande do Norte, Piauí e Ceará concentram parques eólicos, favorecidos por ventos regulares como os alísios.'),
      q('Qual é um impacto possível dos parques eólicos?', 'Ruído e efeito de sombra intermitente para moradores próximos.', ['Grande emissão de fumaça tóxica durante toda a geração de energia.', 'Contaminação do lençol freático com o óleo combustível das torres.', 'Inundação de cidades inteiras para formar reservatórios.'], 'As pás fazem barulho e projetam sombras que piscam. Por isso se respeita uma distância mínima das casas e se ouve a comunidade.'),
      q('Como reduzir a morte de aves e morcegos em parques eólicos?', 'Evitar rotas de migração e parar turbinas nos horários críticos.', ['Pintar as pás de preto para que as aves consigam vê-las no escuro.', 'Instalar as torres nas rotas migratórias para afastar aves.', 'Aumentar a velocidade das pás para espantar os animais da região.'], 'Estudos ambientais mapeiam rotas de aves. Radares e paradas programadas também reduzem colisões.'),
      q('Por que a energia eólica é considerada renovável?', 'Porque o vento se renova naturalmente e não se esgota com o uso.', ['Porque as torres são feitas de materiais que nunca se desgastam.', 'Porque o vento é produzido por usinas que queimam carvão.', 'Porque cada turbina só pode ser usada uma única vez na vida.'], 'O vento resulta do aquecimento desigual da atmosfera pelo Sol e está sempre se renovando.'),
      q('O que é a complementaridade entre vento e água no Brasil?', 'Venta mais no período seco, quando os reservatórios estão baixos.', ['Chove mais quando venta, então os rios sempre transbordam.', 'O vento enche os reservatórios das hidrelétricas com água.', 'As turbinas eólicas funcionam só quando as represas estão cheias.'], 'No Nordeste os ventos são mais fortes no segundo semestre, época seca. Assim, a eólica poupa a água dos reservatórios.'),
      q('Qual é a vantagem dos parques eólicos no mar (offshore)?', 'Os ventos no mar costumam ser mais fortes e mais constantes.', ['No mar não existe nenhum impacto sobre a vida marinha.', 'As turbinas no mar não precisam de cabos para levar energia.', 'No mar as turbinas funcionam com a força das ondas.'], 'A eólica offshore aproveita ventos melhores, mas exige estudos sobre pesca, aves marinhas e rotas de navios.'),
      q('Que conflito pode surgir com comunidades tradicionais em áreas eólicas?', 'Perda de acesso a terras e mudanças no modo de vida local.', ['Aumento da pesca de baleias pelos trabalhadores das torres.', 'Falta de vento nas casas por causa das turbinas próximas.', 'Proibição total do uso de energia elétrica pelas famílias.'], 'Contratos justos, consulta prévia e partilha de benefícios ajudam a evitar injustiças com comunidades rurais, pesqueiras e quilombolas.'),
      q('Por que trocar uma termelétrica a carvão por fontes renováveis?', 'A queima do carvão libera CO₂, fuligem e gases da chuva ácida.', ['O carvão é renovável, mas produz uma energia mais cara que a solar.', 'O carvão gera energia sem nenhuma emissão de gases poluentes no ar.', 'As termelétricas a carvão não produzem nenhum resíduo.'], 'O carvão mineral é fóssil e está entre os maiores emissores de gases de efeito estufa e de poluentes que afetam a saúde.'),
    ],
  });

  MISSOES.push({
    id: 'hidro', nome: 'Rio Esperança', fonte: 'Energia hidrelétrica', icone: 'gota', cor: '#2a7fd0', tema: 'floresta',
    insignia: { nome: 'Guardiã das Águas', desc: 'Concilia hidreletricidade, rios vivos e comunidades.' },
    narrador: { nome: 'Dona Jandira', papel: 'Ribeirinha e líder comunitária', voz: 'jandira', look: 'jandira' },
    intro: [
      'Seja bem-vindo, meu filho, minha filha. Eu sou a Jandira e moro na beira do Rio Esperança desde menina.',
      'A barragem trouxe energia para a cidade, mas os peixes sumiram e as margens perderam a mata. Agora o rio está ficando raso, cheio de terra.',
      'Querem construir outra barragem enorme, que alagaria o vale. Ajude a comunidade a escolher caminhos melhores e a recuperar o rio.',
    ],
    conclusao: ['O rio respira de novo. Os peixes voltaram a subir na piracema e a energia continua chegando à cidade.', 'Você ganhou a insígnia Guardiã das Águas. Obrigada por ouvir o povo do rio!'],
    demanda: 30, base: { energia: 12, co2: 70, agua: 40, bio: 35, social: 40 },
    npcs: [
      { nome: 'Seu Bené', papel: 'Pescador artesanal', voz: 'homemB', fala: 'Antes da barragem, a gente pescava fartura. Me responde uma coisa, por favor.' },
      { nome: 'Iracema', papel: 'Professora da vila', voz: 'mulherB', fala: 'Meus alunos perguntaram como a água vira energia. Vamos ver se você sabe!' },
      { nome: 'Davi', papel: 'Engenheiro da usina', voz: 'homemA', fala: 'Eu opero as turbinas desta usina. Tenho um desafio técnico para você.' },
      { nome: 'Mel', papel: 'Estudante', voz: 'jovem', fala: 'Eu quero ser geógrafa! Me ajuda nessa questão sobre rios e energia?' },
    ],
    lotes: [
      { id: 'barragem', rotulo: 'Barragem existente', fp: [1, 1], opcoes: ['escadaPeixes'] },
      { id: 'corredeira', rotulo: 'Corredeira do vale', fp: [1, 1], opcoes: ['pch', 'grandeBarragem'] },
      { id: 'represa', rotulo: 'Reservatório', fp: [2, 2], agua: true, opcoes: ['solarFlutuante'] },
      { id: 'encosta', rotulo: 'Encosta com desnível', fp: [2, 2], opcoes: ['usinaReversivel', 'termeletricaOleo'] },
      { id: 'vila', rotulo: 'Praça da vila ribeirinha', fp: [1, 1], opcoes: ['centroComunitario', 'geradorDiesel'] },
    ],
    problemas: [
      { id: 'margens', nome: 'Margens desmatadas e rio assoreado', spr: 'toco', desc: 'Sem a mata ciliar, a chuva leva terra para o rio, que fica raso e barrento.', impactos: ['Assoreamento do rio', 'Menos água no reservatório', 'Peixes sem abrigo'], acao: { rotulo: 'Replantar a mata ciliar com a comunidade', custo: 100, ef: { agua: 18, bio: 14, co2: -10 } }, plantar: true, fala: 'As mudas nativas já seguram o solo. Em poucos anos, o rio estará protegido.' },
    ],
    infos: [
      { titulo: 'Piracema', texto: 'Piracema é a subida dos peixes rio acima para se reproduzir. Barragens sem passagem interrompem esse ciclo e reduzem a pesca.' },
      { titulo: 'Crise hídrica de 2021', texto: 'Com pouca chuva, os reservatórios baixaram e o Brasil precisou ligar termelétricas, mais caras e poluentes. Diversificar as fontes deixa o sistema mais seguro.' },
    ],
    questoes: [
      q('Qual transformação de energia ocorre numa usina hidrelétrica?', 'A energia da água em movimento gira turbinas ligadas a geradores.', ['O calor da água fervente produz o vapor que move as grandes turbinas.', 'A luz refletida na represa é convertida diretamente em eletricidade.', 'A água é queimada nas caldeiras para produzir eletricidade.'], 'A água desce com força, gira as turbinas, e os geradores transformam esse movimento em eletricidade.'),
      q('Qual é um impacto social comum na construção de grandes hidrelétricas?', 'O deslocamento de famílias ribeirinhas e povos indígenas.', ['A falta total de água nas cidades próximas à barragem.', 'O aumento imediato da neve nas regiões do reservatório.', 'A proibição de navegar em todos os rios do país inteiro.'], 'Casos como Belo Monte, no rio Xingu, mostram conflitos com povos indígenas e ribeirinhos que dependem do rio.'),
      q('Por que reservatórios em áreas de floresta podem emitir gases de efeito estufa?', 'A vegetação alagada apodrece e libera metano e gás carbônico.', ['A água parada produz fumaça preta ao ser aquecida pelo Sol.', 'As turbinas queimam a madeira que desce pelo rio junto com a água.', 'Os peixes do reservatório liberam óleo diesel na água da represa.'], 'Quando a floresta é inundada sem retirada, a decomposição sem oxigênio produz metano, um gás de efeito estufa potente.'),
      q('Para que serve uma escada de peixes numa barragem?', 'Permite que os peixes subam o rio para se reproduzir na piracema.', ['Serve para os turistas descerem com segurança até o fundo da represa.', 'Ajuda a retirar os peixes do rio para vender nos mercados das cidades.', 'Aumenta a força da água que chega às turbinas da usina.'], 'A escada cria pequenos degraus de água por onde os peixes conseguem vencer o desnível da barragem.'),
      q('O que é uma hidrelétrica a fio d\'água?', 'Uma usina com reservatório pequeno, que usa a vazão natural do rio.', ['Uma usina que bombeia a água do mar para dentro dos rios do interior.', 'Uma usina que funciona apenas com a água da chuva no telhado.', 'Uma usina que precisa de um reservatório maior que um estado inteiro.'], 'Ela alaga menos área, mas a geração varia com a quantidade de água do rio ao longo do ano.'),
      q('Qual é a importância da mata ciliar para uma hidrelétrica?', 'Protege as margens, reduz o assoreamento e conserva a água.', ['Aumenta a quantidade de sedimentos que chega às turbinas.', 'Serve para esconder a barragem e evitar visitantes curiosos.', 'Impede que a chuva caia sobre o reservatório da usina.'], 'As raízes seguram o solo e filtram a água da chuva. Sem elas, a terra vai para o rio e o reservatório perde volume.'),
      q('O que pode acontecer com a geração hidrelétrica numa seca prolongada?', 'A produção cai, e o país tende a acionar termelétricas mais caras.', ['A produção aumenta, porque a água parada fica mais forte e concentrada.', 'Nada muda, pois as turbinas funcionam sem precisar de água.', 'As usinas passam a gerar energia usando apenas a luz da Lua cheia.'], 'Na crise hídrica de 2021, reservatórios baixos levaram ao uso de termelétricas, mais poluentes, e a contas de luz mais caras.'),
      q('Como funciona uma usina hidrelétrica reversível?', 'Bombeia água para cima quando sobra energia e gera quando falta.', ['Faz o rio correr ao contrário durante todos os fins de semana.', 'Transforma a água do reservatório em gelo para usar no verão.', 'Usa a correnteza do mar para encher os rios no período seco.'], 'Ela funciona como uma grande bateria e combina muito bem com a energia solar e a eólica.'),
      q('Qual fonte responde pela maior parte da eletricidade gerada no Brasil?', 'A hidrelétrica, aproveitando os grandes rios do país.', ['A nuclear, com dezenas de usinas no litoral brasileiro.', 'O carvão mineral, extraído principalmente na Amazônia.', 'O petróleo, queimado em usinas em todas as capitais.'], 'A hidreletricidade ainda é a maior fonte da matriz elétrica brasileira, embora a eólica e a solar cresçam rapidamente.'),
    ],
  });

  MISSOES.push({
    id: 'mare', nome: 'Costa das Marés', fonte: 'Energia das marés e das ondas', icone: 'onda', cor: '#1fa3a3', tema: 'mar',
    insignia: { nome: 'Força das Marés', desc: 'Aproveita o mar sem destruir manguezais.' },
    narrador: { nome: 'Marina Alves', papel: 'Oceanógrafa', voz: 'marina', look: 'marina' },
    intro: [
      'Olá! Eu sou a Marina, oceanógrafa. Aqui na Costa das Marés, a água sobe e desce vários metros duas vezes por dia.',
      'Essa força pode virar energia limpa. Mas uma plataforma de petróleo antiga está vazando óleo, e ele já chega às praias.',
      'Sua missão: conter o vazamento, instalar tecnologias de marés e ondas nos lugares certos e proteger o manguezal.',
    ],
    conclusao: ['O mar está limpo de novo, e as marés agora iluminam a cidade.', 'Você ganhou a insígnia Força das Marés!'],
    demanda: 28, base: { energia: 0, co2: 88, agua: 40, bio: 42, social: 45 },
    npcs: [
      { nome: 'Dona Lurdes', papel: 'Marisqueira', voz: 'mulherB', fala: 'Eu tiro meu sustento do mangue. Me ajude a entender esse mar!' },
      { nome: 'Jonas', papel: 'Surfista e salva-vidas', voz: 'jovemM', fala: 'Conheço cada onda desta praia. Topa um desafio sobre o mar?' },
      { nome: 'Capitão Nilo', papel: 'Comandante do porto', voz: 'homemB', fala: 'Navio que entra aqui depende da maré. Responda esta, marinheiro!' },
      { nome: 'Bia', papel: 'Mergulhadora', voz: 'mulherA', fala: 'Eu vi o óleo no fundo do mar. Precisamos de pessoas que entendam o problema.' },
    ],
    lotes: [
      { id: 'baia', rotulo: 'Boca da baía (marés altas)', fp: [1, 1], agua: true, opcoes: ['barragemMare'] },
      { id: 'canal', rotulo: 'Canal de correnteza', fp: [1, 1], agua: true, opcoes: ['turbinaMare'] },
      { id: 'quebramar', rotulo: 'Mar de ondas fortes', fp: [1, 1], agua: true, opcoes: ['boiaOndas'] },
      { id: 'mangue', rotulo: 'Entrada do manguezal', fp: [1, 1], opcoes: ['preservarMangue', 'barragemMareMangue'] },
      { id: 'porto', rotulo: 'Cais do porto', fp: [1, 1], opcoes: ['eletrificarPorto', 'geradorDiesel'] },
      { id: 'largo', rotulo: 'Mar aberto', fp: [1, 1], agua: true, opcoes: ['eolicaOffshore'] },
    ],
    problemas: [
      { id: 'oleo', nome: 'Vazamento de petróleo da plataforma', spr: 'plataformaPetroleo', fp: [2, 2], sprResolvido: 'turbinaMare', desc: 'Uma plataforma antiga vaza óleo. As manchas atingem praias, peixes e aves.', impactos: ['Manchas de óleo nas praias', 'Morte de peixes e aves', 'Prejuízo à pesca e ao turismo'], acao: { rotulo: 'Conter o óleo e desativar a plataforma', custo: 120, requer: { cobertura: 0.5 }, ef: { co2: -38, bio: 14, social: 8 } }, limparOleo: true, fala: 'Barreiras de contenção recolheram o óleo e a plataforma foi desativada. O mar agradece!' },
    ],
    infos: [
      { titulo: 'Marés do Maranhão', texto: 'Na baía de São Marcos, perto de São Luís, a diferença entre maré alta e maré baixa pode passar de seis metros. É um dos melhores lugares do Brasil para energia maremotriz.' },
      { titulo: 'Usina de ondas de Pecém', texto: 'No porto de Pecém, no Ceará, pesquisadores brasileiros testaram um protótipo pioneiro de usina que gera energia com as ondas do mar.' },
    ],
    questoes: [
      q('O que é energia maremotriz?', 'Energia obtida com a subida e a descida periódica das marés.', ['Energia obtida com a queima de algas retiradas do fundo do mar.', 'Energia obtida com o calor do Sol sobre a areia das praias.', 'Energia obtida com o sal retirado da água do oceano.'], 'A usina aproveita a diferença de nível entre a maré alta e a maré baixa para mover turbinas.'),
      q('Qual fator natural causa as marés?', 'A atração gravitacional da Lua e do Sol sobre os oceanos.', ['O vento que sopra do continente em direção ao oceano.', 'O calor do centro da Terra que aquece a água do mar.', 'A chuva forte que cai sobre os oceanos todas as tardes.'], 'A gravidade da Lua, e em menor grau a do Sol, puxa a água dos oceanos e forma as marés.'),
      q('Que condição favorece uma usina maremotriz?', 'Grande diferença de altura entre a maré alta e a maré baixa.', ['Mar sempre calmo, sem nenhuma variação no nível da água.', 'Praias com areia muito branca e água muito transparente.', 'Regiões geladas onde o mar fica congelado o ano inteiro.'], 'No Brasil, o litoral do Maranhão, perto de São Luís, tem marés que podem passar de seis metros de amplitude.'),
      q('Qual impacto ambiental uma barragem de maré pode causar?', 'Alterar o fluxo de água e sedimentos em estuários e manguezais.', ['Aumentar a quantidade de petróleo misturado na água do estuário.', 'Produzir fumaça preta que escurece as praias próximas.', 'Esquentar a água do mar até ela começar a ferver perto da usina.'], 'Os estuários são berçários de peixes e caranguejos. Estudos de impacto e turbinas de corrente reduzem esses danos.'),
      q('Como funciona um conversor de energia das ondas?', 'Usa o movimento de sobe e desce das ondas para acionar geradores.', ['Usa a cor azul do mar para absorver a luz do Sol e gerar energia.', 'Usa o sal da água para criar faíscas elétricas dentro dos geradores.', 'Usa a areia levada pelas ondas para girar um moinho.'], 'Em Pecém, no Ceará, foi testado um protótipo pioneiro de usina de ondas na América Latina.'),
      q('Qual desvantagem atual das energias do mar?', 'Custos altos e equipamentos que sofrem com a corrosão do sal.', ['Elas só funcionam em lagos de água doce no interior do continente.', 'Elas emitem mais CO₂ do que as usinas a carvão mineral.', 'Elas dependem da queima de óleo diesel para mover as turbinas.'], 'São tecnologias ainda em desenvolvimento. O ambiente marinho é agressivo, e a manutenção é cara.'),
      q('Por que os manguezais são importantes na costa?', 'São berçários de espécies e protegem o litoral contra a erosão.', ['São áreas sem vida, ideais para depósitos de lixo e entulho.', 'São lagos artificiais criados para as usinas de energia.', 'São desertos de areia onde nenhuma planta consegue viver.'], 'Os manguezais abrigam filhotes de peixes, caranguejos e aves, guardam carbono e amortecem a força do mar.'),
      q('Qual é o principal risco ambiental da extração de petróleo no mar?', 'Vazamentos de óleo que atingem praias, peixes e aves marinhas.', ['O aumento da quantidade de ondas grandes para os surfistas.', 'A formação de novas ilhas de areia perto das plataformas.', 'A transformação da água salgada em água doce potável.'], 'Em 2019, manchas de óleo atingiram centenas de praias do Nordeste e prejudicaram a pesca, o turismo e os ecossistemas.'),
      q('Ao contrário do vento e do sol, a maré é:', 'Previsível, pois segue ciclos que podem ser calculados.', ['Totalmente imprevisível, pois muda de forma aleatória.', 'Constante, pois o nível do mar nunca muda ao longo do dia.', 'Controlada pelas usinas, que decidem quando a maré sobe.'], 'As tábuas de marés mostram com antecedência os horários de maré alta e baixa, o que facilita planejar a geração.'),
    ],
  });

  MISSOES.push({
    id: 'geo', nome: 'Vulcão Adormecido', fonte: 'Energia geotérmica', icone: 'chama', cor: '#e0552a', tema: 'industria',
    insignia: { nome: 'Calor da Terra', desc: 'Aproveita o calor interno do planeta com segurança.' },
    narrador: { nome: 'Dr. Caio Ferraz', papel: 'Vulcanólogo', voz: 'caio', look: 'caio' },
    intro: [
      'Saudações! Sou o doutor Caio Ferraz, vulcanólogo. Este é o Vulcão Adormecido de Vale Esperança, um lugar imaginário.',
      'No Brasil real não há vulcões ativos, mas em países como Islândia, Indonésia e Quênia o calor da Terra gera muita eletricidade.',
      'A vila daqui ainda queima óleo combustível. Sua missão: instalar a usina geotérmica no lugar seguro, reduzir os gases e aproveitar o calor para a comunidade.',
    ],
    conclusao: ['O vapor da Terra agora move turbinas, aquece estufas e a velha usina a óleo foi desligada.', 'Você ganhou a insígnia Calor da Terra!'],
    demanda: 26, base: { energia: 0, co2: 88, agua: 45, bio: 45, social: 42 },
    npcs: [
      { nome: 'Helga', papel: 'Engenheira de perfuração', voz: 'mulherA', fala: 'Eu perfuro poços até as rochas quentes. Quero ver se você entende o calor da Terra!' },
      { nome: 'Seu Ari', papel: 'Agricultor da encosta', voz: 'homemB', fala: 'Às vezes sinto um cheiro estranho vindo das fontes. Me explique uma coisa.' },
      { nome: 'Nina', papel: 'Guia de turismo', voz: 'jovem', fala: 'Eu levo turistas às fontes termais. Responda este desafio!' },
      { nome: 'Otávio', papel: 'Técnico de segurança', voz: 'homemA', fala: 'Minha função é proteger a vila de riscos. Tenho uma pergunta importante.' },
    ],
    lotes: [
      { id: 'campo', rotulo: 'Campo geotérmico estável', fp: [2, 2], opcoes: ['geotermica', 'termeletricaOleo'] },
      { id: 'encosta', rotulo: 'Encosta instável do vulcão', fp: [2, 2], opcoes: ['geotermicaRisco', 'parque'] },
      { id: 'poco', rotulo: 'Área de reinjeção', fp: [1, 1], opcoes: ['pocoReinjecao'] },
      { id: 'estufa', rotulo: 'Horta da vila', fp: [1, 1], opcoes: ['estufaGeo', 'geradorDiesel'] },
      { id: 'filtro', rotulo: 'Pátio ao lado da usina', fp: [1, 1], opcoes: ['filtroGas', 'estacaoSismica'] },
      { id: 'fonte', rotulo: 'Fonte de água quente', fp: [1, 1], opcoes: ['termas', 'estacaoSismica'] },
    ],
    problemas: [
      { id: 'oleo', nome: 'Termelétrica a óleo combustível', spr: 'termeletrica', sprResolvido: 'termeletricaDesativada', fp: [2, 2], desc: 'A vila depende de uma usina que queima óleo combustível trazido de navio.', impactos: ['Emissão de CO₂ e fuligem', 'Risco de derramamento no transporte', 'Energia cara'], acao: { rotulo: 'Desligar a usina a óleo', custo: 80, requer: { cobertura: 0.6 }, ef: { co2: -42, social: 8, agua: 6 } }, fala: 'A usina a óleo foi desligada. Agora o calor da própria Terra mantém as luzes acesas.' },
    ],
    infos: [
      { titulo: 'Placas tectônicas', texto: 'Vulcões e fontes quentes aparecem principalmente nos limites entre placas tectônicas. O Brasil fica no interior da Placa Sul-Americana, por isso tem baixo potencial geotérmico para eletricidade.' },
      { titulo: 'Águas termais no Brasil', texto: 'Em Caldas Novas, em Goiás, a água quente do subsolo é usada no turismo. Esse calor não basta para grandes usinas, mas pode aquecer piscinas e casas.' },
    ],
    questoes: [
      q('De onde vem a energia geotérmica?', 'Do calor do interior da Terra, que aquece rochas e água subterrânea.', ['Do calor do Sol acumulado na areia das praias durante todo o dia.', 'Da queima de carvão vegetal dentro de cavernas profundas e escuras.', 'Do atrito do vento com as rochas do topo das montanhas.'], 'O interior da Terra é muito quente. Esse calor aquece rochas e água, formando vapor que pode girar turbinas.'),
      q('Onde a energia geotérmica é mais aproveitada para gerar eletricidade?', 'Em áreas vulcânicas ou nos limites entre placas tectônicas.', ['No centro de placas tectônicas estáveis e sem vulcões.', 'Em planícies alagadas, longe de qualquer atividade sísmica.', 'Em desertos de areia, onde o chão esquenta com o Sol.'], 'Islândia, Indonésia, Quênia, Itália e Estados Unidos aproveitam bem essa fonte.'),
      q('Por que o Brasil tem baixo potencial geotérmico para eletricidade?', 'Fica no interior de uma placa tectônica, sem vulcões ativos.', ['Porque o subsolo brasileiro é formado apenas por gelo.', 'Porque o Brasil fica exatamente sobre vários vulcões ativos.', 'Porque as rochas brasileiras não conduzem nenhum calor.'], 'O Brasil está no centro da Placa Sul-Americana. Há águas termais, como em Caldas Novas, mas o calor não basta para grandes usinas.'),
      q('Qual gás de cheiro forte pode ser liberado por usinas geotérmicas?', 'O gás sulfídrico, que tem cheiro de ovo podre.', ['O gás oxigênio, que tem cheiro de flores do campo.', 'O gás hélio, que tem cheiro de fumaça de churrasco.', 'O vapor de água, que tem cheiro forte de gasolina.'], 'Filtros e a reinjeção dos fluidos reduzem a liberação de gás sulfídrico e de outros gases.'),
      q('Para que serve reinjetar a água no reservatório geotérmico?', 'Para manter a pressão do reservatório e evitar poluir rios e solos.', ['Para esfriar o vulcão e impedir qualquer erupção no futuro próximo.', 'Para transformar a água quente em petróleo nas camadas do subsolo.', 'Para aumentar a quantidade de gases liberados no ar.'], 'A água retirada tem sais e gases. Devolvê-la ao subsolo protege o ambiente e mantém a usina funcionando por mais tempo.'),
      q('Além de eletricidade, como o calor geotérmico pode ser usado?', 'Para aquecer estufas, casas, piscinas e secar alimentos.', ['Para congelar alimentos em grandes armazéns no deserto.', 'Para produzir gasolina e diesel para os automóveis.', 'Para fabricar gelo nas geleiras do topo dos vulcões.'], 'Na Islândia, quase todas as casas são aquecidas com o calor do subsolo.'),
      q('Qual risco geológico deve ser monitorado em projetos geotérmicos?', 'Pequenos tremores e afundamentos do solo perto dos poços.', ['Aumento da altura das montanhas a cada novo poço perfurado.', 'Formação de geleiras no lugar dos poços que foram perfurados.', 'Mudança na direção da rotação do planeta Terra.'], 'A retirada e a injeção de fluidos podem provocar pequenos sismos. Estações de monitoramento acompanham tudo.'),
      q('Qual vantagem a geotérmica tem em relação à solar e à eólica?', 'Gera energia de forma contínua, de dia e de noite.', ['Ela não precisa de nenhum tipo de estudo ambiental.', 'Ela pode ser instalada em qualquer lugar do planeta.', 'Ela funciona melhor quando o tempo está nublado.'], 'Por funcionar o tempo todo, a geotérmica é uma fonte de base, como a biomassa e as hidrelétricas com reservatório.'),
      q('A energia geotérmica é considerada renovável porque:', 'O calor interno da Terra é imenso e se repõe naturalmente.', ['As usinas fabricam calor novo a partir da queima de lixo.', 'O vulcão produz petróleo que se renova a cada erupção.', 'As rochas quentes podem ser compradas de outros países.'], 'Desde que o reservatório seja bem manejado, com reinjeção de água, o calor se mantém por muitas décadas.'),
    ],
  });

  MISSOES.push({
    id: 'cana', nome: 'Usina dos Canaviais', fonte: 'Biomassa da cana-de-açúcar', icone: 'folha', cor: '#2e9e4a', tema: 'floresta',
    insignia: { nome: 'Energia do Canavial', desc: 'Transforma resíduos agrícolas em energia sem degradar o campo.' },
    narrador: { nome: 'Zé Bento', papel: 'Agrônomo da cooperativa', voz: 'bento', look: 'bento' },
    intro: [
      'Bãom? Eu sou o Zé Bento, agrônomo da cooperativa. Aqui é terra de cana-de-açúcar a perder de vista.',
      'Da cana sai o açúcar e o etanol. Sobram o bagaço, a palha e a vinhaça, que podem virar energia ou virar problema.',
      'Ainda tem gente queimando a palha antes da colheita, e a fumaça adoece a cidade. Sua missão: acabar com as queimadas e usar os resíduos com inteligência.',
    ],
    conclusao: ['O céu está limpo, a usina gera energia com o bagaço e o córrego voltou a ter peixe.', 'Você ganhou a insígnia Energia do Canavial!'],
    demanda: 26, base: { energia: 0, co2: 80, agua: 40, bio: 35, social: 42 },
    npcs: [
      { nome: 'Dona Fátima', papel: 'Moradora da cidade', voz: 'mulherB', fala: 'Na época da queimada, meu neto vive tossindo. Me ajude com esta pergunta.' },
      { nome: 'Jurandir', papel: 'Operador de colheitadeira', voz: 'homemB', fala: 'Eu dirijo a colheitadeira, que colhe sem fogo. Bora para o desafio?' },
      { nome: 'Lara', papel: 'Química da usina', voz: 'mulherA', fala: 'Eu cuido do etanol e da vinhaça. Vamos ver se você entende de biomassa.' },
      { nome: 'Miguel', papel: 'Filho de sitiante', voz: 'jovemM', fala: 'Meu pai cria gado e planta cana. Tenho uma dúvida para você!' },
    ],
    lotes: [
      { id: 'usina', rotulo: 'Pátio da usina sucroenergética', fp: [2, 2], opcoes: ['biomassa', 'termeletricaOleo'] },
      { id: 'vinhaca', rotulo: 'Lagoa de vinhaça', fp: [1, 1], opcoes: ['biogasVinhaca', 'vinhacaRio'] },
      { id: 'palha', rotulo: 'Galpão da palha', fp: [1, 1], opcoes: ['etanol2G'] },
      { id: 'corrego', rotulo: 'Margem do córrego', fp: [1, 1], opcoes: ['mataCiliar', 'expandirCana'] },
      { id: 'faixa', rotulo: 'Faixa entre os talhões', fp: [2, 2], opcoes: ['agrofloresta'] },
      { id: 'curral', rotulo: 'Curral do sítio', fp: [1, 1], opcoes: ['biodigestor'] },
    ],
    problemas: [
      { id: 'queima', nome: 'Queima da palha da cana', spr: 'queimada', desc: 'Parte do canavial é queimada antes da colheita manual. A fumaça e a fuligem invadem a cidade.', impactos: ['Doenças respiratórias', 'Morte de animais', 'Emissão de gases e fuligem'], acao: { rotulo: 'Adotar a colheita mecanizada sem fogo', custo: 110, ef: { co2: -30, social: 10, bio: 8 } }, apagarFogo: true, fala: 'Sem fogo! A palha agora fica no campo, protegendo o solo, ou vai para a usina virar energia.' },
    ],
    infos: [
      { titulo: 'Cogeração', texto: 'As usinas de cana queimam o bagaço em caldeiras. O vapor move turbinas, gera eletricidade para a própria usina e o excedente vai para a rede.' },
      { titulo: 'Fim das queimadas em São Paulo', texto: 'Em São Paulo, a queima da palha foi eliminada aos poucos, com a colheita mecanizada. Isso melhorou a qualidade do ar nas cidades do interior.' },
    ],
    questoes: [
      q('O que é biomassa, como fonte de energia?', 'Matéria orgânica de plantas e animais usada para gerar energia.', ['Rochas metálicas retiradas de minas profundas no subsolo do país.', 'Água salgada aquecida pelo calor das correntes marinhas.', 'Gás de cozinha produzido a partir do petróleo da camada do pré-sal.'], 'Bagaço, palha, lenha de reflorestamento, esterco e restos de alimentos são exemplos de biomassa.'),
      q('Como o bagaço da cana gera eletricidade nas usinas?', 'É queimado em caldeiras, produzindo vapor que move turbinas.', ['É jogado nos rios para mover as rodas d\'água das usinas.', 'É misturado ao petróleo para fazer gasolina mais barata.', 'É enterrado para virar carvão mineral em poucos dias.'], 'Esse processo é a cogeração: a usina produz vapor e eletricidade para si mesma e ainda vende o excedente.'),
      q('Por que a queima da palha da cana foi proibida em muitos lugares?', 'Polui o ar, causa doenças respiratórias e mata animais.', ['Deixa a cana mais doce e aumenta muito o lucro da usina.', 'Faz a chuva cair com mais força sobre os canaviais.', 'Aumenta a umidade do ar e melhora a saúde das pessoas.'], 'Em São Paulo, a queima foi eliminada aos poucos, com colheita mecanizada e uso da palha como energia ou cobertura do solo.'),
      q('O que é a vinhaça e qual cuidado ela exige?', 'Um resíduo do etanol que polui rios se for despejado sem controle.', ['Um tipo de vinho produzido com as sobras das laranjas da colheita.', 'Um combustível fóssil retirado das camadas profundas do pré-sal.', 'Um gás leve usado para encher os balões das festas.'], 'A vinhaça pode virar fertilizante, aplicada em doses certas, e também biogás em biodigestores.'),
      q('Qual é um problema das grandes monoculturas de cana?', 'Perda de biodiversidade e desgaste do solo pelo cultivo único.', ['Aumento da variedade de animais e de plantas nativas da região.', 'Formação de florestas densas e nativas entre as plantações.', 'Diminuição do uso de máquinas agrícolas e de combustíveis fósseis.'], 'Plantar uma só espécie em grandes áreas reduz habitats, empobrece o solo e aumenta o uso de agrotóxicos.'),
      q('O que é o etanol de segunda geração (2G)?', 'Etanol feito do bagaço e da palha, aproveitando restos da cana.', ['Etanol feito com o petróleo extraído de poços terrestres.', 'Etanol feito da água do mar com a ajuda da energia solar direta.', 'Etanol feito do carvão mineral importado de outros países distantes.'], 'O etanol 2G produz mais combustível com a mesma área plantada, sem precisar expandir o canavial.'),
      q('Por que a biomassa pode ser considerada renovável?', 'Porque as plantas voltam a crescer e reabsorvem o CO₂ do ar.', ['Porque sua queima não libera nenhum tipo de gás poluente.', 'Porque ela é retirada de jazidas que nunca se esgotam.', 'Porque ela é produzida em laboratório a partir de metais.'], 'Para ser sustentável, a biomassa não pode vir de desmatamento, e o cultivo deve conservar o solo e a água.'),
      q('Como um biodigestor aproveita o esterco de animais?', 'Decompõe o esterco sem oxigênio e produz biogás e biofertilizante.', ['Seca o esterco ao Sol e o transforma em areia para as obras da cidade.', 'Queima o esterco ao ar livre para espantar os insetos.', 'Mistura o esterco à água do rio para limpar a correnteza mais rápido.'], 'O biogás serve para cozinhar, aquecer ou gerar eletricidade. O que sobra é um ótimo adubo.'),
      q('Qual cultura agrícola mais fornece biomassa para eletricidade no Brasil?', 'A cana-de-açúcar, com o bagaço e a palha das usinas.', ['O café, com as folhas retiradas dos cafezais do Sul.', 'A uva, com as cascas que sobram da produção de sucos.', 'O cacau, com a polpa retirada dos frutos na Bahia.'], 'O bagaço de cana é a principal biomassa da matriz elétrica brasileira, sobretudo no Sudeste e no Centro-Oeste.'),
    ],
  });

  MISSOES.push({
    id: 'residuos', nome: 'Cidade Circular', fonte: 'Resíduos urbanos e industriais', icone: 'ciclo', cor: '#3aa86a', tema: 'industria',
    insignia: { nome: 'Cidade Circular', desc: 'Transforma lixo em recurso e renda.' },
    narrador: { nome: 'Tânia', papel: 'Catadora e presidente da cooperativa', voz: 'tania', look: 'tania' },
    intro: [
      'E aí, tudo bem? Eu sou a Tânia, catadora e presidente da cooperativa de reciclagem de Vale Esperança.',
      'O lixão da cidade está a céu aberto. O chorume escorre para o córrego, o metano escapa para o ar e ainda tem fumaça de lixo queimando.',
      'Sua missão: fechar o lixão, valorizar os catadores e transformar resíduos em energia, adubo e novos produtos.',
    ],
    conclusao: ['O lixão virou aterro sanitário com captação de biogás, e a cooperativa ganhou um galpão novo.', 'Você ganhou a insígnia Cidade Circular!'],
    demanda: 12, base: { energia: 2, co2: 85, agua: 38, bio: 42, social: 40 },
    npcs: [
      { nome: 'Seu Zé Carlos', papel: 'Catador há vinte anos', voz: 'homemB', fala: 'Eu tiro meu sustento da reciclagem. Quero ver se você entende de resíduos.' },
      { nome: 'Júlia', papel: 'Estudante de engenharia', voz: 'jovem', fala: 'Estou estudando o biogás dos aterros. Me ajuda com este desafio?' },
      { nome: 'Dona Celina', papel: 'Vizinha do lixão', voz: 'mulherB', fala: 'O cheiro aqui é forte demais. Me explique uma coisa, por favor.' },
      { nome: 'Rui', papel: 'Gerente de fábrica', voz: 'homemA', fala: 'Minha fábrica quer reduzir resíduos. Responda esta pergunta!' },
    ],
    lotes: [
      { id: 'galpao', rotulo: 'Terreno da cooperativa', fp: [2, 2], opcoes: ['reciclagem'] },
      { id: 'gas', rotulo: 'Ao lado do aterro', fp: [1, 1], opcoes: ['usinaBiogasAterro', 'incinerador'] },
      { id: 'praca', rotulo: 'Praça do bairro', fp: [1, 1], opcoes: ['ecoponto', 'compostagem'] },
      { id: 'horta', rotulo: 'Horta comunitária', fp: [1, 1], opcoes: ['compostagem', 'ecoponto'] },
      { id: 'industria', rotulo: 'Distrito industrial', fp: [1, 1], opcoes: ['logisticaReversa', 'incinerador'] },
      { id: 'granja', rotulo: 'Granja de suínos', fp: [1, 1], opcoes: ['biodigestor'] },
    ],
    problemas: [
      { id: 'lixao', nome: 'Lixão a céu aberto', spr: 'lixao', sprResolvido: 'aterro', fp: [2, 2], desc: 'Todo o lixo da cidade vai para um terreno sem proteção. Há fumaça, urubus, mau cheiro e chorume.', impactos: ['Chorume contamina solo e água', 'Metano escapa para o ar', 'Doenças e trabalho insalubre'], acao: { rotulo: 'Encerrar o lixão e construir aterro sanitário', custo: 180, ef: { co2: -30, agua: 18, social: 10, bio: 6 } }, fala: 'O lixão foi encerrado! O aterro sanitário tem manta impermeável, trata o chorume e capta os gases.' },
    ],
    infos: [
      { titulo: 'Política Nacional de Resíduos Sólidos', texto: 'A lei brasileira de 2010 determina o fim dos lixões, cria a logística reversa e reconhece o trabalho das cooperativas de catadores.' },
      { titulo: 'Metano', texto: 'O metano liberado pelo lixo orgânico aquece a atmosfera muito mais que o gás carbônico, em curto prazo. Queimá-lo para gerar energia reduz esse impacto.' },
    ],
    questoes: [
      q('Qual é a diferença entre lixão e aterro sanitário?', 'O aterro tem solo impermeabilizado e trata o chorume e os gases.', ['O lixão é coberto e controlado; o aterro fica a céu aberto.', 'Não há diferença, pois os dois são proibidos em todo o mundo hoje.', 'O aterro recebe apenas o lixo hospitalar e os restos de obras.'], 'Nos lixões, o chorume contamina solo e água, e o lixo atrai doenças. A Política Nacional de Resíduos Sólidos determina o fim dos lixões.'),
      q('O que é o chorume?', 'Um líquido escuro e poluente formado pela decomposição do lixo.', ['Um gás perfumado usado para disfarçar o cheiro forte do lixo.', 'Um tipo de adubo pronto, vendido em lojas de jardinagem.', 'Uma bebida típica feita com as frutas que sobraram da feira livre.'], 'O chorume pode atingir o lençol freático e os rios. Por isso precisa ser coletado e tratado.'),
      q('Qual gás é produzido pelo lixo orgânico e pode gerar energia?', 'O metano, principal componente do biogás dos aterros.', ['O oxigênio, que é liberado pelas cascas de frutas.', 'O hélio, que sai das embalagens plásticas usadas.', 'O cloro, que é produzido pelos restos de comida.'], 'O metano é um gás de efeito estufa muito potente. Capturá-lo e queimá-lo para gerar energia reduz o aquecimento global.'),
      q('Qual é o papel dos catadores na gestão dos resíduos?', 'Recolhem e separam recicláveis, devolvendo materiais à indústria.', ['Queimam o lixo nas ruas para diminuir o volume total de resíduos.', 'Levam todo o lixo reciclável para dentro dos rios da cidade.', 'Fiscalizam as usinas nucleares para evitar acidentes muito graves.'], 'As cooperativas de catadores são reconhecidas pela lei e merecem renda e condições de trabalho dignas.'),
      q('O que é logística reversa?', 'O retorno de produtos usados ao fabricante para reciclagem ou descarte.', ['A entrega de produtos novos com caminhões andando de marcha à ré pela cidade.', 'O transporte do lixo de volta para a casa de quem o produziu.', 'A venda de produtos usados como se fossem novos nas lojas do centro.'], 'Pilhas, baterias, pneus, eletrônicos e embalagens de agrotóxicos têm logística reversa obrigatória no Brasil.'),
      q('O que a compostagem faz com os restos de alimentos?', 'Transforma os restos orgânicos em adubo rico para o solo.', ['Transforma os restos em plástico para novas embalagens.', 'Transforma os restos em gasolina para abastecer carros.', 'Transforma os restos em vidro para fabricar garrafas.'], 'Mais da metade do lixo doméstico brasileiro é orgânico. Compostar evita metano no aterro e produz adubo.'),
      q('Qual destas atitudes vem primeiro na hierarquia dos resíduos?', 'Não gerar e reduzir o lixo, antes mesmo de reciclar.', ['Queimar todo o lixo em casa para economizar espaço.', 'Enterrar o lixo no quintal para que ele desapareça.', 'Jogar o lixo no rio para a correnteza levar embora.'], 'A ordem é: não gerar, reduzir, reutilizar, reciclar, tratar e, por último, dispor os rejeitos de forma adequada.'),
      q('Qual é um problema da incineração de lixo sem controle rigoroso?', 'A liberação de gases tóxicos, como dioxinas, no ar.', ['A produção excessiva de água potável para a cidade.', 'O aumento da quantidade de árvores nos bairros.', 'A geração de chorume limpo e próprio para beber.'], 'Sem filtros modernos, a queima de lixo libera substâncias tóxicas. Além disso, destrói materiais que poderiam ser reciclados.'),
      q('Em uma granja de porcos, qual é a solução mais sustentável para os dejetos?', 'Tratar os dejetos em biodigestores e gerar biogás e adubo.', ['Lançar os dejetos diretamente no córrego mais próximo.', 'Acumular os dejetos ao ar livre perto das casas vizinhas.', 'Misturar os dejetos à água da caixa d\'água da cidade.'], 'Os biodigestores reduzem o mau cheiro e a poluição da água, e ainda produzem energia para a propriedade.'),
    ],
  });

  MISSOES.push({
    id: 'floresta', nome: 'Floresta Viva', fonte: 'Florestas, agroflorestas e pecuária', icone: 'arvore', cor: '#2f7a32', tema: 'floresta',
    insignia: { nome: 'Floresta Viva', desc: 'Protege a floresta e cria renda com ela em pé.' },
    narrador: { nome: 'Jaci', papel: 'Guardiã da floresta e agente agroflorestal', voz: 'jaci', look: 'jaci' },
    intro: [
      'Olá! Meu nome é Jaci. Sou guardiã desta floresta e trabalho com agroflorestas na minha comunidade.',
      'O fogo está avançando sobre a mata para abrir pasto. Quando a floresta queima, o carbono vai para o ar e a chuva diminui.',
      'Sua missão: combater a queimada, recuperar as áreas degradadas e mostrar que a floresta em pé vale mais do que derrubada.',
    ],
    conclusao: ['O fogo se apagou. As mudas crescem, a agrofloresta dá frutos e os rios voadores seguem levando chuva.', 'Você ganhou a insígnia Floresta Viva!'],
    demanda: 10, base: { energia: 2, co2: 85, agua: 40, bio: 30, social: 42 },
    npcs: [
      { nome: 'Seu Raimundo', papel: 'Pecuarista', voz: 'homemB', fala: 'Meu pasto está fraco e pensei em abrir mais mata. Antes, me responda isso.' },
      { nome: 'Kauê', papel: 'Brigadista florestal', voz: 'jovemM', fala: 'Eu combato incêndios na floresta. Tenho um desafio para você!' },
      { nome: 'Dona Socorro', papel: 'Extrativista de castanha', voz: 'mulherB', fala: 'Eu vivo da castanha e do açaí. Me ajude a responder esta pergunta.' },
      { nome: 'Lúcia', papel: 'Pesquisadora do clima', voz: 'mulherA', fala: 'Eu estudo como a floresta influencia as chuvas. Vamos ao desafio!' },
    ],
    lotes: [
      { id: 'queimada', rotulo: 'Área queimada', fp: [2, 2], opcoes: ['reflorestamento', 'pastoExtensivo'] },
      { id: 'pasto', rotulo: 'Pasto degradado', fp: [2, 2], opcoes: ['agrofloresta', 'pastoExtensivo'] },
      { id: 'margem', rotulo: 'Margem do igarapé', fp: [1, 1], opcoes: ['mataCiliar'] },
      { id: 'viveiro', rotulo: 'Terreno da comunidade', fp: [1, 1], opcoes: ['viveiro'] },
      { id: 'clareira', rotulo: 'Clareira da vila', fp: [1, 1], opcoes: ['painelSolar', 'geradorDiesel'] },
      { id: 'curral', rotulo: 'Curral da fazenda', fp: [1, 1], opcoes: ['biodigestor'] },
    ],
    problemas: [
      { id: 'fogo', nome: 'Queimada para abrir pasto', spr: 'queimada', desc: 'Fogo ateado na mata para abrir pastagem. As chamas avançam sobre a floresta.', impactos: ['Libera carbono das árvores', 'Fumaça e doenças respiratórias', 'Morte de animais e perda de solo'], acao: { rotulo: 'Acionar a brigada e combater o fogo', custo: 90, ef: { co2: -32, bio: 12, social: 6 } }, apagarFogo: true, fala: 'A brigada controlou o fogo! Agora é hora de recuperar o que foi queimado.' },
    ],
    infos: [
      { titulo: 'Rios voadores', texto: 'As árvores da Amazônia transpiram muita água. Esse vapor é levado pelos ventos e ajuda a formar chuvas no Centro-Oeste, no Sudeste e no Sul do Brasil.' },
      { titulo: 'Agrofloresta', texto: 'Num sistema agroflorestal, árvores nativas, frutas como banana e cacau, e lavouras crescem juntas. O solo fica protegido e a família tem renda o ano inteiro.' },
    ],
    questoes: [
      q('Qual atividade é a principal causa do desmatamento na Amazônia?', 'A abertura de pastagens para a criação extensiva de gado.', ['A instalação de painéis solares nos telhados das cidades.', 'A pesca artesanal feita pelas comunidades ribeirinhas.', 'A construção de escolas e postos de saúde nas aldeias.'], 'A maior parte da área desmatada na Amazônia vira pasto, muitas vezes com baixa produtividade.'),
      q('O que são os "rios voadores"?', 'Massas de umidade da Amazônia que levam chuva a outras regiões.', ['Rios que mudam de lugar a cada estação por causa do vento.', 'Cachoeiras tão altas que toda a água evapora antes de chegar ao chão.', 'Canais artificiais que levam a água do mar até o sertão nordestino.'], 'A floresta transpira enorme quantidade de água. Esse vapor é levado pelos ventos e forma chuvas em outras regiões.'),
      q('Por que as queimadas aumentam o aquecimento global?', 'Liberam o carbono guardado nas árvores na forma de CO₂.', ['Esfriam o ar e aumentam a formação de neve nas serras.', 'Aumentam a quantidade de oxigênio guardado no solo.', 'Fazem as árvores crescerem mais rápido depois do fogo.'], 'As árvores guardam carbono no tronco e nas folhas. Quando queimam, esse carbono vai para a atmosfera.'),
      q('O que é um sistema agroflorestal (SAF)?', 'Um cultivo que combina árvores, frutas e lavouras no mesmo lugar.', ['Uma floresta cortada para plantar apenas uma única espécie.', 'Uma fazenda que cria o gado o tempo todo em galpões fechados.', 'Uma área de mineração cercada por plantas feitas de plástico.'], 'Os SAFs imitam a floresta: protegem o solo, guardam água e geram alimentos variados.'),
      q('O que diz o Código Florestal sobre as margens dos rios?', 'São Áreas de Preservação Permanente e devem manter a vegetação.', ['Devem ser desmatadas para facilitar a passagem e o acesso dos barcos.', 'Podem receber lixões, desde que fiquem longe das cidades.', 'São áreas livres para a criação de gado, sem nenhum tipo de limite.'], 'As Áreas de Preservação Permanente protegem rios, nascentes e encostas. A largura da faixa depende do tamanho do rio.'),
      q('Como a pecuária contribui para o efeito estufa, além do desmatamento?', 'A digestão do gado libera metano, um gás de efeito estufa.', ['O gado absorve todo o gás carbônico emitido pelos carros.', 'O pelo do gado reflete o calor do Sol de volta ao espaço.', 'O leite das vacas produz ozônio que protege a atmosfera.'], 'Na digestão dos bois, micro-organismos produzem metano, liberado principalmente pelo arroto dos animais.'),
      q('Qual prática reduz a pressão por novos desmatamentos para pecuária?', 'Recuperar pastos degradados e integrar lavoura, gado e floresta.', ['Queimar a floresta todo ano para renovar o capim do pasto do gado.', 'Abrir novas áreas na mata nativa sempre que o pasto ficar fraco.', 'Retirar as árvores das margens dos rios para o gado beber.'], 'A integração lavoura-pecuária-floresta aumenta a produção na mesma área, sem derrubar mais mata.'),
      q('Qual é o papel dos povos indígenas na conservação das florestas?', 'Terras indígenas estão entre as áreas mais preservadas do país.', ['Os povos indígenas são os maiores responsáveis pelas queimadas.', 'As aldeias usam a floresta apenas para extrair minério.', 'Os territórios indígenas não têm nenhuma floresta nativa.'], 'Imagens de satélite mostram que as terras indígenas funcionam como barreiras contra o desmatamento.'),
      q('Por que a energia solar é boa para comunidades isoladas na floresta?', 'Evita transportar diesel por rios e reduz a poluição local.', ['Exige desmatar grandes áreas para instalar cada painel.', 'Precisa de linhas de transmissão de milhares de quilômetros.', 'Só funciona se a comunidade tiver uma usina a carvão.'], 'Muitas comunidades da Amazônia dependem de geradores a diesel. Sistemas solares com baterias são mais limpos e baratos a longo prazo.'),
    ],
  });

  MISSOES.push({
    id: 'mineracao', nome: 'Vale das Terras Raras', fonte: 'Mineração e terras raras', icone: 'gema', cor: '#8a5bd0', tema: 'industria',
    insignia: { nome: 'Mineração Responsável', desc: 'Entende o custo mineral da transição energética.' },
    narrador: { nome: 'Beatriz Lima', papel: 'Geóloga', voz: 'beatriz', look: 'beatriz' },
    intro: [
      'Oi! Sou a Beatriz, geóloga. Este vale guarda terras raras, elementos usados nos ímãs de aerogeradores e de carros elétricos.',
      'Ou seja: até a energia limpa depende da mineração. E a mineração pode deixar cavas abertas, rios contaminados e barragens de rejeitos perigosas.',
      'Sua missão: eliminar o risco da barragem de rejeitos, recuperar áreas degradadas e reduzir a necessidade de minerar com reciclagem e inovação.',
    ],
    conclusao: ['A barragem perigosa foi desativada, o rio está sendo tratado e a reciclagem reduz a pressão sobre o vale.', 'Você ganhou a insígnia Mineração Responsável!'],
    demanda: 16, base: { energia: 2, co2: 72, agua: 36, bio: 38, social: 38 },
    npcs: [
      { nome: 'Seu Geraldo', papel: 'Morador abaixo da barragem', voz: 'homemB', fala: 'Moro abaixo da barragem e tenho medo. Me ajude a entender os riscos.' },
      { nome: 'Patrícia', papel: 'Fiscal ambiental', voz: 'mulherA', fala: 'Eu fiscalizo as licenças da mineradora. Responda este desafio!' },
      { nome: 'Leo', papel: 'Técnico em eletrônica', voz: 'jovemM', fala: 'Dentro de um celular velho tem muito metal valioso. Sabia? Bora testar!' },
      { nome: 'Dona Zilda', papel: 'Agricultora do vale', voz: 'mulherB', fala: 'Minha horta depende da água do rio. Me responda, por favor.' },
    ],
    lotes: [
      { id: 'cava', rotulo: 'Cava abandonada', fp: [2, 2], opcoes: ['recuperarMina', 'novaCava'] },
      { id: 'eletronicos', rotulo: 'Galpão na entrada da cidade', fp: [1, 1], opcoes: ['reciclaEletronicos'] },
      { id: 'agua', rotulo: 'Saída de água da mina', fp: [1, 1], opcoes: ['eta'] },
      { id: 'patio', rotulo: 'Pátio da mineradora', fp: [1, 1], opcoes: ['painelSolar', 'geradorDiesel'] },
      { id: 'morro', rotulo: 'Morro ventoso', fp: [1, 1], opcoes: ['eolicaSemImas', 'torreEolica'] },
      { id: 'vila', rotulo: 'Centro da vila mineira', fp: [1, 1], opcoes: ['centroComunitario'] },
    ],
    problemas: [
      { id: 'barragem', nome: 'Barragem de rejeitos em risco', spr: 'lagoRejeito', fp: [2, 2], sprResolvido: 'pilhaSeca', desc: 'Uma barragem antiga guarda lama de rejeitos de mineração acima da vila.', impactos: ['Risco de rompimento', 'Contaminação do rio', 'Ameaça à vida dos moradores'], acao: { rotulo: 'Descaracterizar a barragem e empilhar a seco', custo: 200, ef: { social: 16, agua: 14, bio: 6, co2: -18 } }, fala: 'A lama foi drenada e os rejeitos secos foram empilhados com segurança. A vila pode dormir tranquila.' },
    ],
    infos: [
      { titulo: 'Terras raras no Brasil', texto: 'O Brasil tem uma das maiores reservas de terras raras do mundo, em estados como Minas Gerais e Goiás. Explorá-las exige licenciamento rigoroso e respeito às comunidades.' },
      { titulo: 'Mariana e Brumadinho', texto: 'Os rompimentos de barragens em Mariana, em 2015, e Brumadinho, em 2019, mataram centenas de pessoas e devastaram rios. Desde então, barragens do tipo a montante devem ser desativadas.' },
    ],
    questoes: [
      q('O que são as terras raras?', 'Um grupo de 17 elementos químicos usados em ímãs e eletrônicos.', ['Solos muito férteis encontrados apenas em ilhas vulcânicas.', 'Terrenos caros localizados no centro das grandes cidades.', 'Areias coloridas usadas para fabricar vidro de garrafas.'], 'Neodímio, disprósio e lantânio são exemplos. Apesar do nome, não são tão raros, mas são difíceis de separar.'),
      q('Por que as terras raras se relacionam com a energia limpa?', 'São usadas em ímãs de turbinas eólicas e de motores elétricos.', ['São queimadas para gerar eletricidade dentro das usinas solares.', 'São misturadas à água das represas para aumentar a vazão dos rios.', 'São plantadas nos canaviais para produzir mais bagaço.'], 'Ímãs muito fortes de neodímio tornam geradores e motores menores e mais eficientes.'),
      q('Qual país domina hoje a produção e o refino das terras raras?', 'A China, que concentra a maior parte do refino mundial.', ['A Islândia, que extrai os minerais dentro dos vulcões.', 'O Chile, que retira esses minerais do deserto do Atacama.', 'A Austrália, que proíbe qualquer tipo de mineração.'], 'O Brasil tem grandes reservas, como em Minas Gerais e Goiás, e discute como explorá-las com responsabilidade.'),
      q('Qual é um risco da mineração de terras raras?', 'Rejeitos que podem conter metais pesados e elementos radioativos.', ['Produção de chuva doce que estraga os telhados das casas da vila.', 'Formação de florestas densas ao redor das minas abertas na serra.', 'Aumento da quantidade de peixes nos rios da região.'], 'Os minérios de terras raras costumam vir acompanhados de tório e urânio, que exigem cuidado no descarte.'),
      q('O que aconteceu em Mariana (2015) e Brumadinho (2019)?', 'Rompimentos de barragens de rejeitos de mineração de ferro.', ['Erupções de vulcões que destruíram cidades históricas mineiras.', 'Grandes vazamentos de usinas nucleares instaladas no litoral.', 'Terremotos causados por parques eólicos na serra.'], 'As tragédias mataram centenas de pessoas e devastaram rios como o Doce e o Paraopeba.'),
      q('O que é a "mineração urbana"?', 'Recuperar metais valiosos de eletrônicos e baterias descartados.', ['Abrir minas de ferro embaixo das praças das grandes cidades.', 'Construir prédios usando apenas pedras retiradas de rios.', 'Trocar todas as calçadas da cidade por pedras preciosas.'], 'Uma tonelada de celulares velhos pode ter mais ouro que uma tonelada de minério. Reciclar reduz a necessidade de minerar.'),
      q('O que o empilhamento a seco de rejeitos faz?', 'Retira a água dos rejeitos e evita grandes barragens de lama.', ['Joga os rejeitos secos diretamente no leito dos rios.', 'Transforma os rejeitos em combustível para termelétricas.', 'Mistura mais água aos rejeitos para que escorram rápido.'], 'Sem água, os rejeitos ficam estáveis e o risco de uma onda de lama diminui muito.'),
      q('Como diminuir a dependência de terras raras nas turbinas eólicas?', 'Usar geradores sem ímãs permanentes e reciclar os ímãs antigos.', ['Trocar todas as turbinas eólicas por usinas a carvão mineral.', 'Construir turbinas com pás feitas inteiramente de terras raras puras.', 'Proibir a reciclagem de turbinas e de motores elétricos.'], 'Geradores de indução funcionam sem ímãs de terras raras, e a reciclagem recupera os ímãs de equipamentos velhos.'),
      q('O que deve ser feito numa área depois que a mineração termina?', 'Recuperar a área degradada, com solo tratado e plantio de nativas.', ['Abandonar a cava aberta para que ela vire um depósito de lixo urbano.', 'Encher a cava com rejeitos sem nenhum tipo de controle.', 'Cercar a área e proibir que qualquer planta volte a crescer ali.'], 'O Plano de Recuperação de Áreas Degradadas é exigido no licenciamento ambiental das minas.'),
    ],
  });

  MISSOES.push({
    id: 'dados', nome: 'Nuvem de Dados', fonte: 'Data centers', icone: 'servidor', cor: '#6a4fd0', tema: 'cidade',
    insignia: { nome: 'Dados Verdes', desc: 'Torna a internet e a inteligência artificial mais sustentáveis.' },
    narrador: { nome: 'Thiago Matos', papel: 'Engenheiro de computação', voz: 'thiago', look: 'thiago' },
    intro: [
      'E aí, beleza? Eu sou o Thiago, engenheiro de computação. Cada vídeo, jogo ou pergunta para uma inteligência artificial passa por um data center.',
      'Este data center novo usa energia como uma cidade inteira, gasta muita água para resfriar os servidores e tem geradores a diesel barulhentos.',
      'Sua missão: abastecer o data center com energia renovável, economizar água, reduzir o ruído e aproveitar o calor que sobra.',
    ],
    conclusao: ['Agora a nuvem é verde: energia renovável, água reaproveitada e calor que aquece a comunidade.', 'Você ganhou a insígnia Dados Verdes!'],
    demanda: 24, base: { energia: 0, co2: 90, agua: 38, bio: 50, social: 38 },
    npcs: [
      { nome: 'Sofia', papel: 'Gamer e youtuber', voz: 'jovem', fala: 'Eu passo o dia na internet e nunca pensei na energia que ela gasta. Me ajuda?' },
      { nome: 'Seu Osvaldo', papel: 'Vizinho do data center', voz: 'homemB', fala: 'O zumbido dos ventiladores não me deixa dormir. Responda este desafio.' },
      { nome: 'Renata', papel: 'Gestora da companhia de água', voz: 'mulherA', fala: 'A cidade passa por estiagem. Quero saber se você entende o problema.' },
      { nome: 'Igor', papel: 'Técnico de servidores', voz: 'homemA', fala: 'Eu cuido dos servidores lá dentro. Vamos a um desafio técnico!' },
    ],
    lotes: [
      { id: 'solar', rotulo: 'Terreno para energia própria', fp: [2, 2], opcoes: ['usinaSolar', 'termeletricaGas'] },
      { id: 'vento', rotulo: 'Colina ventosa', fp: [1, 1], opcoes: ['torreEolica'] },
      { id: 'resfria', rotulo: 'Central de resfriamento', fp: [1, 1], opcoes: ['resfriamentoReuso', 'resfriamentoPotavel'] },
      { id: 'barreira', rotulo: 'Divisa com o bairro', fp: [1, 1], opcoes: ['muroAcustico', 'cinturaoVerde'] },
      { id: 'calor', rotulo: 'Terreno ao lado da escola', fp: [1, 1], opcoes: ['estufaCalor'] },
      { id: 'pátio', rotulo: 'Pátio técnico', fp: [1, 1], opcoes: ['bateria', 'geradorDiesel'] },
    ],
    problemas: [
      { id: 'diesel', nome: 'Geradores a diesel do data center', spr: 'geradorDiesel', sprResolvido: 'bateria', desc: 'Os geradores de emergência são ligados em testes e nas falhas da rede, queimando diesel.', impactos: ['Emissão de CO₂ e fuligem', 'Ruído constante', 'Dependência de combustível fóssil'], acao: { rotulo: 'Trocar os geradores por baterias', custo: 100, requer: { cobertura: 0.5 }, ef: { co2: -38, social: 10 } }, fala: 'Os geradores a diesel saíram de cena. Baterias carregadas com energia renovável garantem a segurança.' },
    ],
    infos: [
      { titulo: 'Inteligência artificial e energia', texto: 'Treinar e usar grandes modelos de inteligência artificial exige muitos servidores. Por isso, o consumo de energia e de água dos data centers cresce rapidamente no mundo.' },
      { titulo: 'O que é PUE', texto: 'PUE compara a energia total do data center com a energia usada só pelos servidores. Quanto mais perto de 1, menos energia se perde com resfriamento e equipamentos auxiliares.' },
    ],
    questoes: [
      q('Por que os data centers consomem tanta energia elétrica?', 'Milhares de servidores funcionam sem parar e precisam ser resfriados.', ['Eles usam a energia para iluminar as nuvens do céu durante a noite.', 'Eles produzem a internet queimando o papel usado dos escritórios.', 'Eles carregam ao mesmo tempo os celulares de todas as pessoas da cidade.'], 'Os servidores funcionam 24 horas por dia e esquentam muito. Resfriá-los também consome bastante energia.'),
      q('Por que muitos data centers consomem muita água?', 'Usam água para resfriar os servidores, sobretudo por evaporação.', ['Usam a água para lavar os computadores todos os dias.', 'Usam a água para produzir eletricidade dentro dos servidores.', 'Usam a água para encher piscinas para os funcionários.'], 'Torres de resfriamento evaporam água. Em regiões com seca, isso pode competir com o abastecimento das pessoas.'),
      q('O crescimento da inteligência artificial tende a:', 'Aumentar a demanda por energia e água dos data centers.', ['Eliminar totalmente a necessidade de energia elétrica.', 'Diminuir o número de computadores em todo o planeta.', 'Substituir a água por petróleo no resfriamento das máquinas.'], 'Por isso é importante que novos data centers usem energia renovável e técnicas que poupem água.'),
      q('O que mede o indicador PUE de um data center?', 'A energia total gasta em relação à energia usada pelos servidores.', ['Quantas pessoas trabalham dentro do prédio durante cada dia útil.', 'Quantos litros de chuva caem sobre o telhado em um ano.', 'Quantos jogos podem ser baixados ao mesmo tempo na rede de internet.'], 'Quanto mais perto de 1, mais eficiente: quase toda a energia vai para a computação e pouca para o resfriamento.'),
      q('Qual problema os geradores a diesel de emergência causam?', 'Queimam combustível fóssil, emitem poluentes e fazem barulho.', ['Produzem água potável demais e alagam os bairros vizinhos.', 'Absorvem o gás carbônico do ar e esfriam a cidade inteira.', 'Funcionam apenas com a luz do Sol durante a madrugada.'], 'Baterias carregadas com energia renovável podem substituir boa parte desses geradores.'),
      q('Qual atitude reduz o impacto do resfriamento dos servidores?', 'Usar ar externo frio e circuitos fechados com água de reúso.', ['Abrir as janelas e jogar água potável sobre as máquinas.', 'Desligar os servidores no verão e ligar só no inverno.', 'Aquecer o prédio para que os servidores fiquem mais quentes.'], 'O resfriamento livre usa o ar frio de fora, e os circuitos fechados reaproveitam a mesma água muitas vezes.'),
      q('Como o calor que sobra de um data center pode ser aproveitado?', 'Para aquecer estufas, piscinas públicas ou bairros próximos.', ['Para derreter as geleiras e aumentar a quantidade de água dos rios.', 'Para gerar mais vento e mover as turbinas eólicas da região.', 'Para cozinhar a comida servida dentro dos servidores.'], 'Em países frios, o calor dos servidores já aquece milhares de casas por meio de redes de aquecimento.'),
      q('Que critério ajuda a escolher o local de um novo data center?', 'Ter energia renovável disponível e não sofrer com falta de água.', ['Ficar perto de minas de carvão para garantir o combustível barato.', 'Estar numa região muito seca, onde a água já precisa ser racionada.', 'Ser construído no meio de uma área de floresta nativa.'], 'O planejamento territorial deve evitar conflitos com o abastecimento de água e com áreas protegidas.'),
      q('Como reduzir a poluição sonora de um data center para os vizinhos?', 'Usar máquinas silenciosas, barreiras acústicas e cinturões verdes.', ['Aumentar a velocidade dos ventiladores durante toda a madrugada.', 'Instalar alto-falantes com música alta para cobrir todo o ruído.', 'Construir as casas encostadas nas paredes externas do prédio.'], 'O ruído constante prejudica o sono e a saúde. Barreiras e distância das casas fazem diferença.'),
    ],
  });

  MISSOES.push({
    id: 'rede', nome: 'Rede Inteligente', fonte: 'Interconexão das energias limpas', icone: 'rede', cor: '#d23b6a', tema: 'cidade', final: true, requer: 6,
    insignia: { nome: 'Rede Inteligente', desc: 'Integra todas as fontes limpas e aposenta as fósseis.' },
    narrador: { nome: 'Clara Rocha', papel: 'Operadora do sistema elétrico', voz: 'clara', look: 'clara' },
    intro: [
      'Olá! Eu sou a Clara, operadora do sistema elétrico de Vale Esperança. Chegou a hora do grande desafio.',
      'A cidade precisa de energia durante as 24 horas do dia. O Sol brilha de dia, o vento sopra mais à noite, a maré sobe e desce, e o consumo dispara no começo da noite.',
      'Ainda dependemos de uma termelétrica a carvão e de uma usina nuclear. Sua missão: montar uma rede renovável e interligada que atenda a cidade em todas as horas, para aposentar as duas.',
      'Use o painel das 24 horas para ver, hora a hora, se a energia limpa dá conta do consumo. Armazenamento e rede inteligente são suas melhores amigas!',
    ],
    conclusao: ['Missão cumprida! Vale Esperança é abastecida 24 horas por fontes renováveis e interligadas.', 'Você ganhou a insígnia Rede Inteligente e se tornou especialista em energia sustentável. Parabéns!'],
    demanda: 30, base: { energia: 8, co2: 95, agua: 45, bio: 45, social: 45 },
    existentes: [{ perfil: 'hidro', cap: 8, nome: 'Hidrelétrica existente', energiaDia: 110 }],
    npcs: [
      { nome: 'Prefeita Helena', papel: 'Prefeita de Vale Esperança', voz: 'mulherB', fala: 'Prometi energia limpa para a cidade. Antes de assinar o plano, responda isto.' },
      { nome: 'Dr. Paulo', papel: 'Físico nuclear', voz: 'homemB', fala: 'Trabalho na usina nuclear há trinta anos. Vamos conversar sobre os prós e contras?' },
      { nome: 'Camila', papel: 'Engenheira de redes', voz: 'mulherA', fala: 'Minha especialidade é ligar tudo com tudo. Topa um desafio sobre a rede?' },
      { nome: 'Davi', papel: 'Estudante e cientista mirim', voz: 'jovemM', fala: 'Eu fiz um projeto sobre hidrogênio verde na feira de ciências! Me responde essa?' },
    ],
    lotes: [
      { id: 'solar', rotulo: 'Campo solar', fp: [2, 2], opcoes: ['usinaSolar', 'termeletricaGas'] },
      { id: 'vento1', rotulo: 'Serra ventosa (A)', fp: [1, 1], opcoes: ['torreEolica'] },
      { id: 'vento2', rotulo: 'Serra ventosa (B)', fp: [1, 1], opcoes: ['torreEolica'] },
      { id: 'mar', rotulo: 'Canal de maré', fp: [1, 1], agua: true, opcoes: ['turbinaMare', 'eolicaOffshore'] },
      { id: 'reversivel', rotulo: 'Desnível da serra', fp: [2, 2], opcoes: ['usinaReversivel'] },
      { id: 'bateria', rotulo: 'Pátio da subestação', fp: [1, 1], opcoes: ['bateria', 'geradorDiesel'] },
      { id: 'biogas', rotulo: 'Ao lado do aterro', fp: [1, 1], opcoes: ['usinaBiogas'] },
      { id: 'controle', rotulo: 'Centro da cidade', fp: [1, 1], opcoes: ['redeInteligente'] },
      { id: 'h2', rotulo: 'Distrito industrial', fp: [1, 1], opcoes: ['hidrogenio'] },
    ],
    problemas: [
      { id: 'carvao', nome: 'Termelétrica a carvão', spr: 'termeletrica', sprResolvido: 'termeletricaDesativada', fp: [2, 2], desc: 'A maior fonte de emissões da cidade. Só pode ser desligada quando a energia limpa atender as 24 horas.', impactos: ['Gás carbônico e fuligem', 'Chuva ácida', 'Poluição térmica no rio'], acao: { rotulo: 'Aposentar a termelétrica a carvão', custo: 60, requer: { horas24: true }, ef: { co2: -45, agua: 8, social: 6 } }, fala: 'A termelétrica a carvão foi aposentada. O ar da cidade nunca esteve tão limpo!' },
      { id: 'nuclear', nome: 'Usina nuclear', spr: 'nuclear', sprResolvido: 'termeletricaDesativada', fp: [2, 2], desc: 'Emite pouco gás carbônico, mas usa urânio, que não é renovável, e gera lixo radioativo por milhares de anos.', impactos: ['Rejeito radioativo de longa duração', 'Risco de acidentes graves', 'Água aquecida devolvida ao mar'], acao: { rotulo: 'Planejar o descomissionamento seguro', custo: 80, requer: { horas24: true }, ef: { co2: -10, agua: 8, social: 6 } }, fala: 'A usina será descomissionada com segurança, e o rejeito radioativo ficará monitorado.' },
    ],
    infos: [
      { titulo: 'Sistema Interligado Nacional', texto: 'O Brasil tem uma das maiores redes elétricas interligadas do mundo. Quando falta chuva numa região, a energia de outra região ou de outra fonte pode compensar.' },
      { titulo: 'A curva do consumo', texto: 'O consumo de energia cresce no fim da tarde e no começo da noite, quando o Sol já se pôs. Armazenar a energia solar do meio-dia é um dos maiores desafios da transição energética.' },
    ],
    questoes: [
      q('O que é o Sistema Interligado Nacional (SIN)?', 'Uma rede que liga usinas e consumidores de quase todo o Brasil.', ['Um aplicativo que mostra a previsão do tempo nas capitais.', 'Uma usina gigante que produz toda a energia do país sozinha.', 'Um cabo submarino que traz energia de outros continentes.'], 'Linhas de transmissão ligam as regiões e permitem trocar energia entre elas conforme a necessidade.'),
      q('Por que interligar fontes diferentes torna o sistema mais seguro?', 'Quando uma fonte produz menos, outras podem compensar a falta.', ['Porque todas as fontes produzem sempre a mesma quantidade.', 'Porque a interligação elimina a necessidade de consumir energia.', 'Porque assim a energia nunca precisa ser transmitida.'], 'Sol, vento, água e biomassa variam de formas diferentes. Juntas, elas se completam.'),
      q('O que é uma rede elétrica inteligente (smart grid)?', 'Uma rede com sensores e medidores que equilibram geração e consumo.', ['Uma rede elétrica feita somente de fios de ouro e de prata pura.', 'Uma rede que só funciona quando existe internet em todas as casas.', 'Uma rede que desliga toda a cidade sempre nos horários de pico.'], 'Com informação em tempo real, é possível deslocar consumos e aproveitar melhor as fontes renováveis.'),
      q('Qual é o combustível das usinas nucleares de Angra dos Reis?', 'O urânio, um mineral radioativo que não é renovável.', ['O carvão vegetal, produzido com madeira de reflorestamento.', 'O bagaço de cana, trazido das usinas do interior paulista.', 'O hidrogênio verde, produzido com energia solar e eólica.'], 'Angra 1 e Angra 2 usam a fissão do urânio. O minério é extraído, por exemplo, em Caetité, na Bahia.'),
      q('Qual é o principal desafio ambiental da energia nuclear?', 'Guardar com segurança, por milhares de anos, o lixo radioativo.', ['A grande emissão de fumaça preta durante a fissão do urânio.', 'A necessidade de alagar florestas para formar reservatórios.', 'O barulho das pás gigantes que giram dia e noite sem parar.'], 'A nuclear emite pouco gás carbônico, mas gera resíduos radioativos de longa duração e exige segurança contra acidentes como os de Chernobyl e Fukushima.'),
      q('O que é poluição térmica?', 'A devolução de água aquecida aos rios e mares pelas usinas.', ['O excesso de luz das cidades que atrapalha ver as estrelas.', 'O barulho de motores que esquenta os ouvidos das pessoas.', 'A queda de granizo quente sobre as plantações de soja.'], 'Termelétricas e usinas nucleares usam água para resfriamento. A água aquecida perde oxigênio e prejudica os peixes.'),
      q('Por que os combustíveis fósseis não são renováveis?', 'Levaram milhões de anos para se formar e se esgotam com o uso.', ['Podem ser produzidos novamente em poucos dias nas refinarias.', 'São fabricados por plantas que crescem em apenas uma semana.', 'Surgem sempre que chove sobre as rochas do subsolo.'], 'Petróleo, carvão mineral e gás natural vêm de restos de seres vivos soterrados há milhões de anos.'),
      q('Para que serve o hidrogênio verde num sistema de energia limpa?', 'Armazenar energia renovável e substituir combustíveis fósseis.', ['Pintar de verde as usinas a carvão para que pareçam mais limpas.', 'Aumentar a fumaça das chaminés para espantar os insetos.', 'Produzir petróleo a partir da água armazenada nas hidrelétricas.'], 'Ele é produzido pela eletrólise da água com energia solar ou eólica e pode abastecer indústrias, caminhões e navios.'),
      q('O que significa eficiência energética?', 'Fazer o mesmo trabalho gastando menos energia.', ['Gastar mais energia para que os aparelhos durem mais.', 'Produzir energia apenas com combustíveis importados.', 'Deixar os aparelhos ligados para não desgastar botões.'], 'Lâmpadas LED, aparelhos com selo Procel e bons hábitos reduzem o consumo e a necessidade de novas usinas.'),
      q('Qual é o principal gás responsável pela intensificação do efeito estufa?', 'O gás carbônico, liberado sobretudo pela queima de fósseis.', ['O gás oxigênio, liberado sobretudo pelas florestas tropicais.', 'O gás nitrogênio, liberado sobretudo pelas ondas do mar.', 'O gás hélio, liberado sobretudo pelas usinas eólicas.'], 'O excesso de gás carbônico retém mais calor na atmosfera e aquece o planeta.'),
    ],
  });

  // ---------- mapa central ----------
  ERS.HUB = {
    nome: 'Vale Esperança',
    narrador: { nome: 'Profª Iara Moreira', papel: 'Geógrafa e guia do jogo', voz: 'iara', look: 'iara' },
    intro: [
      'Olá! Eu sou a professora Iara Moreira, geógrafa. Bem-vindo e bem-vinda a Vale Esperança, um município imaginário que reúne, num só território, paisagens de várias regiões.',
      'Aqui há serras, um vulcão adormecido, rios, florestas, fazendas, minas, indústrias, um porto e o litoral. Cada lugar enfrenta um desafio diferente de energia e de meio ambiente.',
      'Os marcadores coloridos indicam as missões. Clique no chão para caminhar ou use as setas do teclado. Clique em um marcador para ir até ele e entrar na missão.',
      'Em cada missão você vai conversar com moradores, responder desafios, construir soluções sustentáveis e ganhar insígnias. Com seis insígnias, a missão final da Rede Inteligente será liberada. Vamos lá!',
    ],
    retorno: 'Bom trabalho! Escolha a próxima missão no mapa.',
    infos: [
      { titulo: 'Energia renovável', texto: 'Fontes renováveis se renovam naturalmente, como o Sol, o vento, a água dos rios, as marés, o calor da Terra e a biomassa. Fontes não renováveis, como petróleo, carvão, gás natural e urânio, se esgotam.' },
      { titulo: 'Matriz elétrica brasileira', texto: 'A maior parte da eletricidade do Brasil vem de fontes renováveis, principalmente das hidrelétricas, seguidas pela eólica, pela solar e pela biomassa.' },
      { titulo: 'Efeito estufa', texto: 'Gases como o gás carbônico e o metano retêm calor na atmosfera. A queima de combustíveis fósseis e o desmatamento aumentam esses gases e intensificam o aquecimento global.' },
    ],
  };

  // insígnias especiais
  ERS.CONQUISTAS = [
    { id: 'perfeito', nome: 'Sem Erros', desc: 'Venceu todos os desafios de uma missão na primeira tentativa.', icone: 'estrela', cor: '#ffd23f' },
    { id: 'curioso', nome: 'Curiosidade', desc: 'Leu todas as placas de uma missão.', icone: 'lupa', cor: '#2a7fd0' },
    { id: 'construtor', nome: 'Construtor Verde', desc: 'Construiu 15 soluções limpas.', icone: 'martelo', cor: '#2e9e4a' },
    { id: 'zerofossil', nome: 'Zero Fóssil', desc: 'Aposentou as fontes fósseis e nuclear da cidade.', icone: 'folha', cor: '#1fa3a3' },
    { id: 'mestre', nome: 'Mestre da Sustentabilidade', desc: 'Conquistou todas as insígnias de missão.', icone: 'certificado', cor: '#d23b6a' },
  ];
})();
