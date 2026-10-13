#!/usr/bin/env node
/* Exporta todas as falas do jogo para audio/falas.json e cria a página
   amostras-vozes.html, para ouvir a voz de cada personagem no site publicado.
   Uso: node tools/exportar_falas.js
   Cada item: { id, voz, azure, rate, pitch, texto } — o id é o mesmo calculado
   pelo jogo (hash da voz + texto), então o MP3 gerado é encontrado automaticamente. */
const fs = require('fs');
const path = require('path');
global.window = global;
global.localStorage = undefined;
const raiz = path.join(__dirname, '..');
['js/nucleo.js', 'js/audio.js', 'js/dados.js', 'js/falas.js'].forEach((f) => require(path.join(raiz, f)));
const ERS = global.ERS;

const idDe = (texto, chave) => ERS.A.idFala(ERS.A.limparTexto(texto), ERS.VOZES[chave]);
const lista = ERS.listaFalas().map((f) => {
  const perfil = ERS.VOZES[f.voz];
  const limpo = ERS.A.limparTexto(f.texto);
  const item = { id: ERS.A.idFala(limpo, perfil), voz: perfil.edge, rate: perfil.rate, pitch: perfil.pitch, texto: ERS.A.textoFalado(limpo) };
  if (perfil.azure) item.azure = perfil.azure;
  return item;
});
const unicos = [...new Map(lista.map((f) => [f.id, f])).values()];
fs.mkdirSync(path.join(raiz, 'audio'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'audio', 'falas.json'), JSON.stringify(unicos, null, 1));
console.log('Falas exportadas:', unicos.length);

// ---------- página de amostras ----------
const ids = new Set(unicos.map((f) => f.id));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nomeVoz = (p) => (p.azure || p.edge).replace('pt-BR-', '').replace('Neural', '');
const FAIXA = { idoso: 'mais velho(a)', adulto: 'adulto(a)', jovem: 'jovem' };
function linha(nome, papel, chave, texto) {
  const p = ERS.VOZES[chave];
  const id = idDe(texto, chave);
  if (!ids.has(id)) throw new Error('Fala de amostra não exportada: ' + nome);
  const desc = (p.genero === 'M' ? 'personagem masculino' : 'personagem feminina') + ' · ' + (FAIXA[p.faixa] || 'narração');
  return `<li data-id="${id}" data-voz="${esc(p.azure || p.edge)}"><div class="q"><b>${esc(nome)}</b> <span>${esc(papel)}</span></div>` +
    `<div class="v">${esc(desc)} <em class="st"></em></div><p>${esc(texto)}</p>` +
    `<audio controls preload="none" src="audio/vozes/${id}.mp3"></audio></li>`;
}
let corpo = `<section><h2>${esc(ERS.HUB.nome)}</h2><ul>` +
  linha(ERS.HUB.narrador.nome, ERS.HUB.narrador.papel, ERS.HUB.narrador.voz, ERS.HUB.intro[0]) + '</ul></section>';
ERS.MISSOES.forEach((m) => {
  corpo += `<section><h2>${esc(m.nome)}</h2><ul>` + linha(m.narrador.nome, m.narrador.papel, m.narrador.voz, m.intro[0]);
  m.npcs.forEach((n) => { corpo += linha(n.nome, n.papel, n.voz, n.fala); });
  corpo += '</ul></section>';
});
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vozes dos personagens</title>
<style>
:root{--fundo:#f4f1e8;--cartao:#fff;--texto:#22302a;--suave:#5d6b64;--borda:#dcd6c6;--ok:#1f7a4d;--aviso:#a8641a}
@media (prefers-color-scheme:dark){:root{--fundo:#18201c;--cartao:#222c27;--texto:#e8efe9;--suave:#a5b3ab;--borda:#33413a;--ok:#5fd39a;--aviso:#e8a85a}}
body{margin:0;background:var(--fundo);color:var(--texto);font:16px/1.45 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px 48px}
h1{margin:0 0 6px;font-size:1.6rem}h2{margin:28px 0 10px;font-size:1.15rem}
.intro{color:var(--suave);margin:0 0 8px}
ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
li{background:var(--cartao);border:1px solid var(--borda);border-radius:12px;padding:12px 14px}
.q span{color:var(--suave);font-size:.9rem}.v{font-size:.85rem;color:var(--suave);margin-top:2px}
p{margin:8px 0;font-size:.95rem}audio{width:100%;height:36px}
.st{font-style:normal;font-weight:600}.st.ok{color:var(--ok)}.st.prov{color:var(--aviso)}.st.falta{color:var(--suave)}
a{color:inherit}
</style></head><body><main>
<h1>Vozes dos personagens</h1>
<p class="intro">Vozes neurais da Microsoft em português do Brasil, sem vozes multilíngues ou estrangeiras e sem ajuste artificial de tom. A primeira fala de cada personagem está abaixo para ouvir, com a voz usada na gravação.</p>
<p class="intro"><a href="./">Voltar ao jogo</a></p>
${corpo}
</main>
<script>
fetch('audio/vozes/motores.json').then(function(r){return r.ok?r.json():{}}).catch(function(){return {}}).then(function(m){
  document.querySelectorAll('li').forEach(function(li){
    var st=li.querySelector('.st'),feito=m[li.dataset.id];
    if(!feito){st.textContent='· ainda não gravada';st.className='st falta';}
    else{st.textContent='· gravada com a voz '+feito.replace('pt-BR-','').replace('Neural','');st.className='st ok';}
  });
});
</script>
</body></html>
`;
fs.writeFileSync(path.join(raiz, 'amostras-vozes.html'), html);
console.log('Página de amostras: amostras-vozes.html');
