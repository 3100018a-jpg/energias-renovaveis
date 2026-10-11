#!/usr/bin/env python3
"""
Gera as vozes neurais do jogo em português do Brasil (MP3).

Usa as vozes neurais pt-BR do serviço de leitura em voz alta do Microsoft Edge
(biblioteca edge-tts). Somente vozes pt-BR monolíngues são usadas:
pt-BR-FranciscaNeural, pt-BR-AntonioNeural e pt-BR-ThalitaNeural
(se a Thalita não estiver disponível, a Francisca a substitui com outro tom).

Uso:
    pip install edge-tts
    node tools/exportar_falas.js      # gera audio/falas.json
    python tools/gerar_vozes.py       # gera audio/vozes/*.mp3 e manifest.js

Arquivos que já existem são mantidos, então o processo pode ser retomado.
"""
import asyncio, json, os, sys, random

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FALAS = os.path.join(RAIZ, 'audio', 'falas.json')
PASTA = os.path.join(RAIZ, 'audio', 'vozes')
PERMITIDAS = {'pt-BR-FranciscaNeural', 'pt-BR-AntonioNeural', 'pt-BR-ThalitaNeural'}
SUBSTITUTA = {'pt-BR-ThalitaNeural': ('pt-BR-FranciscaNeural', 6)}  # (voz, ajuste de tom em Hz)

try:
    import edge_tts
except ImportError:
    sys.exit('Instale a biblioteca: pip install edge-tts')


def ajustar_pitch(p, delta):
    v = int(p.replace('Hz', '')) + delta
    return ('+' if v >= 0 else '') + str(v) + 'Hz'


async def disponiveis():
    try:
        vozes = await edge_tts.list_voices()
        return {v['ShortName'] for v in vozes if v['Locale'] == 'pt-BR' and 'Multilingual' not in v['ShortName']}
    except Exception as e:
        print('Aviso: não consegui listar as vozes:', e)
        return PERMITIDAS


async def gerar(item, vozes_ok, sem):
    destino = os.path.join(PASTA, item['id'] + '.mp3')
    if os.path.exists(destino) and os.path.getsize(destino) > 1000:
        return True
    voz, pitch = item['voz'], item['pitch']
    if voz not in vozes_ok and voz in SUBSTITUTA:
        voz, delta = SUBSTITUTA[voz]
        pitch = ajustar_pitch(pitch, delta)
    if voz not in PERMITIDAS:
        print('Voz não permitida, ignorando:', voz)
        return False
    async with sem:
        for tentativa in range(5):
            try:
                com = edge_tts.Communicate(item['texto'], voz, rate=item['rate'], pitch=pitch)
                tmp = destino + '.tmp'
                await com.save(tmp)
                if os.path.getsize(tmp) < 500:
                    raise RuntimeError('áudio vazio')
                os.replace(tmp, destino)
                return True
            except Exception as e:
                espera = 2 ** tentativa + random.random()
                print(f'  tentativa {tentativa + 1} falhou ({item["id"]}): {e}; nova tentativa em {espera:.0f}s')
                await asyncio.sleep(espera)
    return False


async def main():
    if not os.path.exists(FALAS):
        sys.exit('Rode antes: node tools/exportar_falas.js')
    os.makedirs(PASTA, exist_ok=True)
    falas = json.load(open(FALAS, encoding='utf-8'))
    vozes_ok = await disponiveis()
    print('Vozes pt-BR disponíveis:', ', '.join(sorted(vozes_ok)))
    sem = asyncio.Semaphore(int(os.environ.get('PARALELO', '4')))
    feitas = 0
    tarefas = [gerar(f, vozes_ok, sem) for f in falas]
    for i, t in enumerate(asyncio.as_completed(tarefas), 1):
        if await t:
            feitas += 1
        if i % 50 == 0:
            print(f'{i}/{len(falas)} processadas')
    ids = sorted(f['id'] for f in falas if os.path.exists(os.path.join(PASTA, f['id'] + '.mp3')))
    with open(os.path.join(PASTA, 'manifest.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Gerado por tools/gerar_vozes.py — falas gravadas com vozes neurais pt-BR. */\n')
        fh.write('window.ERS_VOZES = ' + json.dumps({i: 1 for i in ids}, separators=(',', ':')) + ';\n')
    print(f'Concluído: {len(ids)} de {len(falas)} falas com áudio neural.')


asyncio.run(main())
