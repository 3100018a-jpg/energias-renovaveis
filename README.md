# Energias Renováveis e Sustentabilidade

Jogo educativo de construção de cidades em 2D com perspectiva pseudoisométrica (2.5D), feito para as aulas de **Geografia do 9º ano**. O jogador explora o município imaginário de **Vale Esperança**, conversa com moradores, vence desafios de múltipla escolha, constrói soluções sustentáveis e conquista insígnias até montar uma rede de energia limpa que atenda a cidade 24 horas por dia.

Funciona direto no navegador, sem instalação, e foi preparado para ser publicado no **GitHub Pages**.

## O que tem no jogo

- **Mapa central** inspirado na imagem de referência: vulcão com usina geotérmica, serra, lago e barragem, rio, floresta, área queimada, agrofloresta, pastagens, canaviais, mineração, cidade, usina solar, parque eólico, termelétrica, porto, praia, usina de marés e ilhas.
- **11 missões, cada uma com um mapa próprio e um narrador próprio**:

  | Missão | Tema | Narração |
  |---|---|---|
  | Bairro do Sol | Energia solar (fotovoltaica, aquecimento solar, geração distribuída) | Luana Costa, engenheira eletricista |
  | Serra dos Ventos | Energia eólica (onshore e offshore), aves, comunidades, carvão | Rafael Nunes, meteorologista |
  | Rio Esperança | Hidrelétricas, piracema, mata ciliar, usina reversível | Dona Jandira, líder ribeirinha |
  | Costa das Marés | Energia maremotriz e das ondas, manguezais, petróleo | Marina Alves, oceanógrafa |
  | Vulcão Adormecido | Energia geotérmica, placas tectônicas, gás sulfídrico | Dr. Caio Ferraz, vulcanólogo |
  | Usina dos Canaviais | Biomassa: bagaço, palha, vinhaça, etanol 2G, queimadas | Zé Bento, agrônomo |
  | Cidade Circular | Resíduos urbanos e industriais, biogás, catadores | Tânia, catadora |
  | Floresta Viva | Desmatamento, queimadas, pecuária, agroflorestas | Jaci, guardiã da floresta |
  | Vale das Terras Raras | Mineração, terras raras, barragens de rejeitos, reciclagem | Beatriz Lima, geóloga |
  | Nuvem de Dados | Data centers: energia, água, diesel e ruído | Thiago Matos, engenheiro de computação |
  | Rede Inteligente (final) | Interconexão das fontes, armazenamento, fim do carvão e da nuclear | Clara Rocha, operadora do sistema |

- **100 desafios** de múltipla escolha. As alternativas são embaralhadas a cada jogada e têm tamanhos parecidos, para que a resposta certa não se destaque pelo comprimento. Cada desafio traz uma explicação.
- **Mais de 60 construções e ações** com efeitos sobre energia limpa, emissões, água, biodiversidade e bem-estar social. Há opções poluentes e opções limpas no lugar errado (por exemplo, uma usina solar derrubando a mata), para discutir planejamento territorial.
- **Problemas ambientais** a resolver: termelétricas a carvão e a óleo, gerador a diesel, vazamento de petróleo, lixão, queimadas, barragem de rejeitos, usina nuclear. Algumas só podem ser desligadas quando já existe energia limpa suficiente.
- **Missão final com painel das 24 horas**: mostra, hora a hora, se sol, vento, marés, biogás, hidrelétricas e armazenamento atendem o consumo da cidade.
- **Insígnias, estrelas, pontos, conquistas especiais e certificado final** com o nome do estudante.
- **Dia, entardecer, noite e ciclo automático**, escolhidos no mapa central, no cartão de cada missão ou no botão do topo da tela. À noite, janelas, postes, faróis dos carros, o farol da costa, o fogo e a lava se acendem.
- **Câmera que acompanha o personagem**, zoom com roda do mouse ou gesto de pinça, minimapa clicável e controles por teclado (setas ou W, A, S, D; E, Espaço ou Enter para interagir).
- **Qualidade gráfica automática**: o jogo estima a capacidade do computador e mede os quadros por segundo durante o jogo. Se ficar lento, desce de Alto para Médio, Baixo ou Mínimo sozinho. Também é possível escolher manualmente nas configurações.
- **Resolução adaptativa**: o terreno é desenhado em blocos e as construções são redesenhadas na resolução que corresponde ao zoom e à densidade de pixels da tela, então o mapa fica nítido mesmo bem de perto.

## Vozes em português do Brasil

Todas as falas, perguntas e alternativas são lidas pelos personagens. O jogo usa dois caminhos, sempre em português do Brasil:

1. **Vozes neurais gravadas (recomendado).** Ao publicar pelo GitHub, o fluxo automático em `.github/workflows/pages.yml` gera cerca de 1.050 arquivos MP3 com as vozes neurais pt-BR **Francisca**, **Antonio** e **Thalita**, cada personagem com seu ritmo e tom. Vozes multilíngues ou de outros idiomas não são usadas. Os arquivos ficam em `audio/vozes/` e o jogo passa a usá-los automaticamente.
2. **Vozes do navegador (alternativa).** Enquanto os MP3 não existem, o jogo usa somente vozes pt-BR instaladas no navegador e escolhe as mais naturais (no Microsoft Edge, as vozes "Online (Natural)"; no Chrome, "Google português do Brasil"). Se o navegador não tiver nenhuma voz pt-BR, as falas aparecem só em texto, para não usar uma voz estrangeira.

Para gerar as vozes no seu próprio computador:

```bash
pip install edge-tts
node tools/exportar_falas.js
python tools/gerar_vozes.py
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `energias-renovaveis`).
2. Envie todos os arquivos desta pasta para o ramo `main` (pelo site, em **Add file → Upload files**, ou com `git push`).
3. No repositório, abra **Settings → Pages** e, em **Build and deployment → Source**, escolha **GitHub Actions**.
4. Abra a aba **Actions**. O fluxo "Publicar jogo" roda sozinho: gera as vozes, guarda os MP3 no repositório e publica o site. A primeira execução leva de 10 a 20 minutos por causa das vozes; as seguintes são rápidas.
5. O endereço do jogo aparece em **Settings → Pages**, no formato `https://seu-usuario.github.io/energias-renovaveis/`.

Se preferir não usar o fluxo automático, escolha em **Settings → Pages** a opção **Deploy from a branch** (ramo `main`, pasta `/`). O jogo funciona da mesma forma, usando as vozes do navegador.

Também é possível abrir o `index.html` direto no computador, com dois cliques.

## Como jogar

- **Caminhar:** clique ou toque no chão, ou use as setas.
- **Interagir:** clique em personagens, placas, lotes amarelos e alertas vermelhos.
- **Desafios:** moradores com balão laranja fazem perguntas. Acertos dão pontos e créditos verdes.
- **Construir:** lotes amarelos recebem construções. Compare os efeitos antes de escolher; é possível demolir e recuperar metade dos créditos.
- **Concluir a missão:** vença os desafios, construa ao menos três soluções sustentáveis, resolva os problemas e leve o Índice de Sustentabilidade a 70 pontos.
- **Desafio extra:** converse com o narrador da missão para ganhar mais créditos.
- Com **seis insígnias**, a missão final é liberada no centro da cidade.

## Relação com a BNCC

O conteúdo dialoga com a habilidade **EF09GE18** (identificar e analisar as cadeias industriais e de inovação e as consequências dos usos de recursos naturais e das diferentes fontes de energia) e com temas de natureza, ambientes e qualidade de vida: matriz energética brasileira, Sistema Interligado Nacional, impactos socioambientais de cada fonte, Código Florestal, Política Nacional de Resíduos Sólidos, mineração e terras raras, data centers e inteligência artificial.

Vale Esperança é um município imaginário que reúne paisagens de várias regiões. O vulcão, por exemplo, não existe no Brasil real, e o próprio jogo explica por quê.

## Estrutura dos arquivos

```
index.html               página do jogo
css/estilo.css           interface
js/nucleo.js             utilidades, ícones, armazenamento
js/qualidade.js          qualidade gráfica automática
js/audio.js              vozes pt-BR, efeitos e trilha sonora
js/sprites.js            construções, árvores e personagens pintados em código
js/terreno.js            tipos de terreno e ferramentas de mapa
js/dados.js              missões, personagens, questões e construções
js/falas.js              frases faladas e lista para gerar as vozes
js/mapas.js              geração do mapa central e dos mapas das missões
js/motor.js              renderização 2.5D, câmera, iluminação e caminhos
js/jogo.js               regras do jogo e interface
audio/vozes/             vozes neurais em MP3 (geradas automaticamente)
tools/                   scripts para exportar falas e gerar vozes
assets/                  imagem de referência e ícone
```

Para mudar perguntas, textos ou construções, edite `js/dados.js`. Depois de alterar falas, o fluxo do GitHub gera os áudios novos sozinho.

## Licença

Código sob licença MIT. O conteúdo educativo pode ser usado e adaptado livremente em sala de aula.
