#!/usr/bin/env python3
"""
Gera as vozes neurais do jogo em português do Brasil (MP3).

Dois motores, sempre com vozes pt-BR monolíngues e sem distorção de timbre:

1. Azure AI Speech (recomendado). Usado quando as variáveis AZURE_SPEECH_KEY e
   AZURE_SPEECH_REGION existem. Dá a cada morador uma voz humana própria
   (Brenda, Donato, Elza, Fabio, Giovanna, Humberto, Julio, Leila, Leticia,
   Manuela, Nicolau, Thalita, Valerio, Yara, Francisca, Antonio).
   O nível gratuito (F0) cobre 500 mil caracteres por mês; o jogo usa cerca de 90 mil.

2. Serviço gratuito de vozes neurais da Microsoft (edge-tts), sem chave. É o modo usado
   pelo fluxo do GitHub. Só vozes pt-BR monolíngues, sem ajuste de tom. Cada personagem
   usa a própria voz quando o serviço a oferece; senão, a voz do mesmo gênero
   (hoje, Francisca e Antonio).

Uso:
    node tools/exportar_falas.js      # gera audio/falas.json
    pip install edge-tts              # vozes provisórias, sem a chave do Azure
    python tools/gerar_vozes.py

Arquivos já gravados com a voz certa são mantidos. O arquivo audio/vozes/motores.json
registra qual voz gravou cada fala; quando a chave do Azure passa a existir, as falas
que estavam com voz provisória são regravadas com a voz definitiva.
"""
import asyncio, json, os, sys, random, time, urllib.request, urllib.error
from xml.sax.saxutils import escape

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FALAS = os.path.join(RAIZ, 'audio', 'falas.json')
PASTA = os.path.join(RAIZ, 'audio', 'vozes')
MOTORES = os.path.join(PASTA, 'motores.json')

AZURE_PTBR = {'pt-BR-' + n + 'Neural' for n in (
    'Francisca Antonio Brenda Donato Elza Fabio Giovanna Humberto Julio Leila '
    'Leticia Manuela Nicolau Thalita Valerio Yara').split()}
EDGE_PTBR = {'pt-BR-FranciscaNeural', 'pt-BR-AntonioNeural', 'pt-BR-ThalitaNeural'}
SUBSTITUTA = {'pt-BR-ThalitaNeural': ('pt-BR-FranciscaNeural', 6)}  # (voz, ajuste de tom em Hz)

CHAVE = os.environ.get('AZURE_SPEECH_KEY', '').strip()
REGIAO = os.environ.get('AZURE_SPEECH_REGION', '').strip().lower().replace(' ', '')
USA_AZURE = bool(CHAVE and REGIAO)
USAR_EDGE = os.environ.get('USAR_EDGE', '1') != '0'  # vozes provisórias quando não há Azure
BYTES_POR_SEG = 6000  # mp3 mono de 48 kbit/s


def bytes_minimos(item):
    # fala gravada pela metade (ex.: só "Sua") fica muito menor que o esperado para o texto
    return int(max(0.7, len(item['texto']) / 30) * BYTES_POR_SEG)


def aviso(titulo, texto):
    # aparece em destaque no resumo da execução do GitHub Actions
    print(f'::warning title={titulo}::{texto}')
    print(f'{titulo}: {texto}')


POR_MINUTO = int(os.environ.get('AZURE_POR_MINUTO', '18'))  # o nível F0 aceita 20 pedidos por minuto


def ajustar_pitch(p, delta):
    v = int((p or '+0Hz').replace('Hz', '')) + delta
    return ('+' if v >= 0 else '') + str(v) + 'Hz'


def voz_desejada(item):
    return item.get('azure') or item['voz']


def destino(item):
    return os.path.join(PASTA, item['id'] + '.mp3')


def existe(item):
    d = destino(item)
    return os.path.exists(d) and os.path.getsize(d) >= bytes_minimos(item)


# ---------------- Azure ----------------
class Limite:
    def __init__(self, por_minuto):
        self.intervalo = 60.0 / max(1, por_minuto)
        self.proximo = 0.0
        self.trava = asyncio.Lock()

    async def esperar(self):
        async with self.trava:
            agora = time.monotonic()
            if agora < self.proximo:
                await asyncio.sleep(self.proximo - agora)
            self.proximo = max(time.monotonic(), self.proximo) + self.intervalo


def ssml(item, voz):
    attrs = f"rate='{item.get('rate') or '+0%'}'"
    # narradores mantêm o leve ajuste de tom que já tinham; moradores falam com a voz natural
    if not item.get('azure') and item.get('pitch') and item['pitch'] not in ('+0Hz', '-0Hz'):
        attrs += f" pitch='{item['pitch']}'"
    return ("<speak version='1.0' xml:lang='pt-BR'>"
            f"<voice xml:lang='pt-BR' name='{voz}'><prosody {attrs}>{escape(item['texto'])}</prosody></voice></speak>")


def azure_pedido(corpo):
    url = f'https://{REGIAO}.tts.speech.microsoft.com/cognitiveservices/v1'
    req = urllib.request.Request(url, data=corpo.encode('utf-8'), method='POST', headers={
        'Ocp-Apim-Subscription-Key': CHAVE,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'energias-renovaveis-jogo',
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


async def gerar_azure(item, limite):
    voz = voz_desejada(item)
    if voz not in AZURE_PTBR:
        print('Voz não permitida, ignorando:', voz)
        return None
    corpo = ssml(item, voz)
    for tentativa in range(6):
        await limite.esperar()
        try:
            dados = await asyncio.to_thread(azure_pedido, corpo)
            if len(dados) < bytes_minimos(item):
                raise RuntimeError(f'áudio incompleto ({len(dados)} bytes)')
            tmp = destino(item) + '.tmp'
            with open(tmp, 'wb') as fh:
                fh.write(dados)
            os.replace(tmp, destino(item))
            return voz
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                return 'RECUSADA'
            espera = float(e.headers.get('Retry-After') or 0) or 2 ** tentativa + random.random()
            print(f'  Azure respondeu {e.code} ({item["id"]}); nova tentativa em {espera:.0f}s')
            await asyncio.sleep(espera)
        except Exception as e:
            espera = 2 ** tentativa + random.random()
            print(f'  tentativa {tentativa + 1} falhou ({item["id"]}): {e}; nova tentativa em {espera:.0f}s')
            await asyncio.sleep(espera)
    return None


# ---------------- edge-tts ----------------
async def edge_disponiveis(edge_tts):
    try:
        vozes = await edge_tts.list_voices()
        return {v['ShortName'] for v in vozes if v['Locale'] == 'pt-BR' and 'Multilingual' not in v['ShortName']}
    except Exception as e:
        print('Aviso: não consegui listar as vozes:', e)
        return EDGE_PTBR


def edge_resolver(item, ok):
    # a voz própria do personagem, se o serviço gratuito a oferecer; senão, a voz do mesmo gênero
    preferida = item.get('azure')
    if preferida and preferida in ok:
        return preferida, '+0Hz'
    voz, pitch = item['voz'], '+0Hz'
    if voz not in ok and voz in SUBSTITUTA:
        voz = SUBSTITUTA[voz][0]
    return voz, pitch


async def gerar_edge(item, edge_tts, ok, sem):
    voz, pitch = edge_resolver(item, ok)
    if voz not in ok or 'Multilingual' in voz or not voz.startswith('pt-BR-'):
        print('Voz não permitida, ignorando:', voz)
        return None
    async with sem:
        for tentativa in range(5):
            try:
                tmp = destino(item) + '.tmp'
                await edge_tts.Communicate(item['texto'], voz, rate=item.get('rate') or '+0%', pitch=pitch).save(tmp)
                if os.path.getsize(tmp) < bytes_minimos(item):
                    raise RuntimeError('áudio incompleto')
                os.replace(tmp, destino(item))
                return voz
            except Exception as e:
                espera = 2 ** tentativa + random.random()
                print(f'  tentativa {tentativa + 1} falhou ({item["id"]}): {e}; nova tentativa em {espera:.0f}s')
                await asyncio.sleep(espera)
    return None


def salvar_motores(motores):
    with open(MOTORES, 'w', encoding='utf-8') as fh:
        json.dump(motores, fh, separators=(',', ':'), sort_keys=True)


def testar_azure():
    """Grava uma palavra para conferir a chave e a região antes de começar."""
    try:
        dados = azure_pedido(ssml({'texto': 'Olá.', 'rate': '+0%'}, 'pt-BR-FranciscaNeural'))
        return len(dados) > 200, ''
    except urllib.error.HTTPError as e:
        return False, f'erro {e.code}'
    except Exception as e:
        return False, str(e)


def salvar_estado(falas, motores):
    por_id = {f['id']: f for f in falas}
    validos = {k: v for k, v in motores.items() if k in por_id and existe(por_id[k])}
    salvar_motores(validos)
    ids = sorted(f['id'] for f in falas if existe(f))
    with open(os.path.join(PASTA, 'manifest.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Gerado por tools/gerar_vozes.py — falas gravadas com vozes neurais pt-BR. */\n')
        fh.write('window.ERS_VOZES = ' + json.dumps({i: 1 for i in ids}, separators=(',', ':')) + ';\n')
    return validos, ids


async def main():
    if not os.path.exists(FALAS):
        sys.exit('Rode antes: node tools/exportar_falas.js')
    os.makedirs(PASTA, exist_ok=True)
    falas = json.load(open(FALAS, encoding='utf-8'))
    try:
        motores = json.load(open(MOTORES, encoding='utf-8'))
    except Exception:
        motores = {}

    danificadas = [f for f in falas if os.path.exists(destino(f)) and not existe(f)]
    if danificadas:
        print(f'{len(danificadas)} gravações incompletas serão refeitas.')
        for f in danificadas:
            os.remove(destino(f)); motores.pop(f['id'], None)
    for f in falas:
        if existe(f) and f['id'] not in motores:
            motores[f['id']] = SUBSTITUTA.get(f['voz'], (f['voz'],))[0]

    usar_azure = USA_AZURE
    if USA_AZURE:
        ok, motivo = testar_azure()
        if ok:
            print(f'Chave do Azure conferida (região {REGIAO}).')
        else:
            usar_azure = False
            aviso('Chave do Azure recusada', f'O Azure não aceitou a chave ou a região "{REGIAO}" ({motivo}). Confira a KEY 1 e a região (ex.: brazilsouth). Por enquanto, as falas usam vozes provisórias.')

    if usar_azure:
        print(f'Motor: Azure AI Speech ({REGIAO}), vozes humanas pt-BR distintas.')
        pendentes = [f for f in falas if not existe(f) or motores.get(f['id']) != voz_desejada(f)]
        print(f'{len(pendentes)} falas para gravar ({sum(len(f["texto"]) for f in pendentes)} caracteres).')
        limite = Limite(POR_MINUTO)
        fazer = lambda f: gerar_azure(f, limite)
    elif USAR_EDGE:
        print('Motor: vozes neurais da Microsoft (serviço gratuito, sem chave).')
        try:
            import edge_tts
        except ImportError:
            sys.exit('Instale a biblioteca: pip install edge-tts')
        ok_vozes = await edge_disponiveis(edge_tts)
        print('Vozes pt-BR monolíngues disponíveis:', ', '.join(sorted(ok_vozes)))
        # grava o que falta e regrava quando a voz própria do personagem passar a existir
        pendentes = [f for f in falas if not existe(f) or motores.get(f['id']) != edge_resolver(f, ok_vozes)[0]]
        sem = asyncio.Semaphore(int(os.environ.get('PARALELO', '4')))
        fazer = lambda f: gerar_edge(f, edge_tts, ok_vozes, sem)
    else:
        pendentes = []
        fazer = None

    async def rodar(f):
        return f, await fazer(f)

    feitas = 0
    recusada = False
    for i, t in enumerate(asyncio.as_completed([rodar(f) for f in pendentes]), 1):
        f, voz = await t
        if voz == 'RECUSADA':
            recusada = True
        elif voz:
            motores[f['id']] = voz
            feitas += 1
        if i % 50 == 0:
            print(f'{i}/{len(pendentes)} processadas')
            # salva o progresso: se a execução for interrompida, o que já foi gravado vale
            motores, _ = salvar_estado(falas, motores)
    if recusada:
        aviso('Chave do Azure recusada', 'O Azure recusou parte dos pedidos. Confira a chave e rode o fluxo de novo.')

    # remove gravações antigas que não pertencem mais ao jogo
    validos = {f['id'] for f in falas}
    removidos = 0
    for nome in os.listdir(PASTA):
        if nome.endswith('.mp3') and nome[:-4] not in validos:
            os.remove(os.path.join(PASTA, nome)); removidos += 1
    if removidos:
        print(f'{removidos} gravações antigas removidas.')
    motores, ids = salvar_estado(falas, motores)
    provisorias = sum(1 for f in falas if f.get('azure') and motores.get(f['id']) != f['azure'])
    print(f'Concluído: {feitas} gravadas agora; {len(ids)} de {len(falas)} falas com áudio neural.')
    if provisorias:
        print(f'{provisorias} falas usam a voz do mesmo gênero (a voz própria do personagem não está no serviço gratuito).')


asyncio.run(main())
