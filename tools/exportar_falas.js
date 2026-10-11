#!/usr/bin/env node
/* Exporta todas as falas do jogo para audio/falas.json.
   Uso: node tools/exportar_falas.js
   Cada item: { id, voz, rate, pitch, texto } — o id é o mesmo calculado
   pelo jogo (hash da voz + texto), então o MP3 gerado é encontrado automaticamente. */
const fs = require('fs');
const path = require('path');
global.window = global;
global.localStorage = undefined;
const raiz = path.join(__dirname, '..');
['js/nucleo.js', 'js/audio.js', 'js/dados.js', 'js/falas.js'].forEach((f) => require(path.join(raiz, f)));
const ERS = global.ERS;
const lista = ERS.listaFalas().map((f) => {
  const perfil = ERS.VOZES[f.voz];
  const limpo = ERS.A.limparTexto(f.texto);
  return { id: ERS.A.idFala(limpo, perfil), voz: perfil.edge, rate: perfil.rate, pitch: perfil.pitch, texto: ERS.A.textoFalado(limpo) };
});
const unicos = [...new Map(lista.map((f) => [f.id, f])).values()];
fs.mkdirSync(path.join(raiz, 'audio'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'audio', 'falas.json'), JSON.stringify(unicos, null, 1));
console.log('Falas exportadas:', unicos.length);
