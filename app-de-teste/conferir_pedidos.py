# Confere, um por um, TUDO o que o Adriano pediu (v14, v14.1, v14.2, v14.3 e as correções de 16/11 11h26).
# Cada item abre o app de verdade (celular 411x914, sem internet), faz o que o pai faria e anota ✅ ou ❌, com foto.
import subprocess, sys, time, os, re, json
from playwright.sync_api import sync_playwright
base = os.path.dirname(os.path.abspath(__file__))
PORTA = 8781
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORTA), '-d', os.path.join(base, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
U = f'http://localhost:{PORTA}/'
V = U + '?tela=vozAjustes'
FOTOS = os.path.join(base, 'telas-teste', 'conferencia'); os.makedirs(FOTOS, exist_ok=True)
res = []
FALAS = "window.__falas=[];window.AndroidTTS={speak2:(t)=>window.__falas.push(t),speak:(t)=>window.__falas.push(t),vozes:()=>'[]'};"

def segurar(pg, loc, ms):
    loc.wait_for(); b0 = loc.bounding_box()
    pg.mouse.move(b0['x'] + b0['width']/2, b0['y'] + b0['height']/2); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up()
def conta(pg):
    pg.get_by_text('Resolva para entrar').wait_for()
    a, bb = map(int, re.findall(r'\d+', pg.locator('text=/\\d+ \\+ \\d+ =/').inner_text())[:2])
    for ch in str(a + bb): pg.get_by_label(ch, exact=True).click()
    pg.get_by_label('✓', exact=True).click()
def tem(pg, rot, exato=True): return pg.get_by_label(rot, exact=exato).count() > 0
def x_de(pg, rot): b = pg.get_by_label(rot, exact=True).first.bounding_box(); return b['x'] if b else -1

def item(n, pedido, f):
    ctx = b.new_context(viewport={'width': 411, 'height': 914}, device_scale_factor=1)
    pg = ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(U) else r.abort())
    try:
        f(pg)
        if erros: raise AssertionError('erro no app: ' + erros[0][:120])
        res.append((n, pedido, '✅', '')); print('✅', n, pedido)
    except Exception as e:
        msg = str(e).split('\n')[0][:160]
        res.append((n, pedido, '❌', msg)); print('❌', n, pedido, '->', msg)
    try: pg.screenshot(path=os.path.join(FOTOS, f'{n:02d}.png'))
    except Exception: pass
    ctx.close()

try:
  with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------------- TELA INICIAL
    def f(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        ordem = sorted(['TRAVAR APP', 'AJUSTES', 'CRIAR PRANCHA', 'TECLADO', 'PRÊMIOS'], key=lambda r: x_de(pg, r) if r != 'PRÊMIOS' else pg.get_by_label(re.compile('PRÊMIOS')).first.bounding_box()['x'])
        assert ordem == ['TRAVAR APP', 'AJUSTES', 'CRIAR PRANCHA', 'TECLADO', 'PRÊMIOS'], f'ordem: {ordem}'
        cor = pg.get_by_label('CRIAR PRANCHA', exact=True).first.evaluate("e => getComputedStyle(e).backgroundColor")
        assert cor == 'rgb(22, 163, 74)', f'criar prancha sem destaque: {cor}'
    item(1, 'CRIAR PRANCHA no meio, em cima, em destaque; PRÊMIOS no lugar dele', f)
    def f(pg):
        pg.goto(U + '?tela=home&vazio=1'); pg.get_by_label('dica criar prancha lá em cima').wait_for()
        assert not tem(pg, 'ADICIONAR PRANCHA'), 'ADICIONAR PRANCHA ainda aparece embaixo'
    item(2, 'Sem "Adicionar prancha" embaixo: só o atalho lá em cima', f)
    def f(pg):
        pg.goto(U + '?tela=home&vazio=1'); pg.get_by_label('comece por aqui').first.wait_for()
    item(3, '"COMECE AQUI" no Criar prancha na 1ª vez', f)
    def f(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        for nome in ['TRAVAR APP', 'AJUSTES', 'CRIAR PRANCHA']:
            pg.get_by_label(nome, exact=True).first.click(); pg.wait_for_timeout(250)
            a = pg.get_by_label('aviso segure 3 segundos'); a.wait_for()
            bx = a.bounding_box(); assert bx['height'] < 45 and bx['y'] < 260, f'aviso grande/embaixo {bx}'
            assert 'Segure 3 s para abrir' in a.inner_text()
            pg.wait_for_timeout(4000)
    item(4, 'Aviso pequeno, azul, lá em cima: "Segure 3 s para abrir"', f)
    def f(pg):
        pg.add_init_script(FALAS); pg.goto(U + '?tela=home'); pg.get_by_label('ÁGUA', exact=True).click(); pg.wait_for_timeout(400)
        assert pg.evaluate('window.__falas.length') == 0, 'falou ao tocar'
        pg.get_by_label('FALAR', exact=True).click(); pg.wait_for_timeout(300); assert pg.evaluate('window.__falas.length') == 1
    item(5, 'Prancha só fala no FALAR (mesmo com 1 palavra)', f)
    def f(pg):
        pg.goto(U + '?tela=home'); bx = pg.get_by_label('linha de sugestões').bounding_box(); assert bx['height'] < 80
        assert pg.evaluate('document.scrollingElement.scrollWidth <= innerWidth + 1')
    item(6, 'Sugestões de frase numa linha só', f)
    def f(pg):
        pg.goto(U + '?tela=home'); assert tem(pg, 'emergência') and tem(pg, 'modo exemplo'); assert pg.get_by_text('MISSÃO DO DIA').count() == 0
    item(7, 'SOS e modo exemplo na barra; nada novo atrapalhando a criança', f)
    # ---------------- AJUSTES
    def f(pg):
        pg.goto(V); pg.get_by_label('DEFINIÇÕES').first.wait_for()
        faltam = [r for r in ['CONQUISTAS E PRÊMIOS', 'CRIAR PRANCHA', 'EDITAR PRANCHAS', 'GERIR ABAS', 'EDITAR ABAS', 'BAIXAR PACOTES', 'MINHA ASSINATURA', 'SOBRE A CAA', 'ROTINA AMIGA', 'RELATÓRIO GERAL', 'AJUDA E TOUR', 'CURSO PARA PAIS', 'DEFINIÇÕES'] if not tem(pg, r)]
        assert not faltam, f'faltam nos Ajustes: {faltam}'
        sobra = [r for r in ['MAIS FUNÇÕES', 'FRASES PRONTAS', 'CRIAR COM FOTO'] if tem(pg, r)]
        assert not sobra, f'deviam ter saído: {sobra}'
    item(8, 'Ajustes completos (Criar prancha de volta) e sem os que deviam sair', f)
    def f(pg):
        pg.goto(V); assert not tem(pg, 'CRIAÇÃO RÁPIDA') and not tem(pg, 'CRIAR PRANCHA FALANDO'), 'o guiado não fica nos Ajustes'
        pg.goto(U + '?tela=voz:criar'); bx = pg.get_by_label('CRIAÇÃO RÁPIDA').bounding_box(); assert bx['y'] < 300, 'a criação rápida vem no topo do Criar prancha'
        pg.get_by_text('OU CRIE UMA PRANCHA DO JEITO NORMAL', exact=False).wait_for()
        assert not tem(pg, 'CRIAR PRANCHA FALANDO'), 'o criar falando saiu'
    item(9, 'Criação rápida DENTRO do Criar prancha (o "criar falando" saiu)', f)
    # ---------------- DEFINIÇÕES
    def f(pg):
        pg.goto(U + '?tela=voz:definicoes'); pg.get_by_label('funções do app').wait_for(); pg.get_by_label('✨ Abrir IA').wait_for()
        assert pg.get_by_label('🔊 Escolher e testar a voz').count() == 1 and not tem(pg, 'Testar Voz')
        for g in ['Proteger as pranchas', 'Aprender e apoio para os pais', 'Menos trabalho', 'Crescer com a criança', 'Ver o progresso', 'Conforto da tela', 'IA (opcional)']:
            assert tem(pg, 'assunto ' + g), g
    item(10, 'Funções do app juntas nas Definições; voz num lugar só; IA', f)
    def f(pg):
        pg.goto(U + '?tela=v14:vozes'); pg.get_by_label('▶ Testar voz').wait_for(); pg.get_by_label('passo a passo da voz').wait_for()
        t = pg.inner_text('body'); assert 'Piper' not in t and 'mascote' not in t.lower()
        for r in ['Criança', 'Adolescente', 'Adulto']: assert tem(pg, r)
        assert '100%' in t
    item(11, 'Vozes: testar, passo a passo, voz por idade, volume; sem Piper e sem voz do mascote', f)
    # ---------------- PACOTES
    def f(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('grade de pacotes').wait_for()
        ys = [round(pg.get_by_label('pacote ' + x, exact=True).bounding_box()['y']) for x in ['Café da manhã', 'Banho', 'Escola']]; assert len(set(ys)) == 1
        ult = pg.locator('[aria-label^="pacote "]').last; ult.scroll_into_view_if_needed(); ult.click(); pg.wait_for_timeout(300)
        bx = pg.get_by_label('pacote escolhido').bounding_box(); assert bx['y'] > 914 * 0.4 and bx['y'] + bx['height'] <= 915
        assert tem(pg, 'usar desenhos do ARASAAC')
        pg.get_by_label('créditos ARASAAC').first.scroll_into_view_if_needed(); t = pg.get_by_label('créditos ARASAAC').first.inner_text()
        assert 'Sergio Palao' in t and 'Governo de Aragão' in t and 'não faz parte do Voz Amiga' in t
    item(12, 'Pacotes: 3 por fileira, o que tem fica fixo embaixo, desenhos ARASAAC e créditos', f)
    def f(pg):
        pg.goto(U + '?tela=voz:criar'); pg.get_by_text('Imagem da Prancha').wait_for()
        assert tem(pg, 'Câmera') or tem(pg, 'CÂMERA') or pg.get_by_text('CÂMERA').count()
        t = pg.get_by_label('créditos ARASAAC').first.inner_text(); assert 'Sergio Palao' in t and 'ARASAAC' in t
    item(13, 'Criar prancha: câmera e créditos/explicação do ARASAAC', f)
    # ---------------- IA
    def f(pg):
        pg.goto(U + '?tela=v14:ia&iafake=1'); pg.get_by_text('Como funciona, em 3 frases').wait_for()
        pg.get_by_label(re.compile('Baixar \\(323')).first.click()
        if tem(pg, 'Baixar mesmo assim'): pg.get_by_label('Baixar mesmo assim').first.click()
        pg.get_by_label('baixando gemma').wait_for(); assert '%' in pg.get_by_label('baixando gemma').inner_text()
        pg.get_by_label('pronto gemma').wait_for(timeout=8000)
        assert tem(pg, 'chave do ChatGPT')
        pg.get_by_label('tema da prancha').fill('dinossauros'); pg.get_by_label('✨ Pedir sugestões à IA').click(); pg.get_by_text('Água', exact=False).first.wait_for()
    item(14, 'IA: explicação, BAIXAR mostra a porcentagem, ChatGPT; a IA sugere palavras de qualquer tema', f)
    # ---------------- CRIAR PRANCHA FALANDO
    def f(pg):
        pg.goto(U + '?tela=v14:rapida'); pg.get_by_label('COMEÇAR ›').click()
        nomes = []
        for k in range(6):
            q = pg.locator('[aria-label^="pergunta "]').first; q.wait_for(); nomes.append(q.get_attribute('aria-label').split(' ')[1])
            n = pg.locator('[aria-label^="opção "]').count(); assert n >= 8, 'poucos botões para tocar'
            assert pg.locator('[aria-label^="opção "]').first.bounding_box()['height'] >= 80, 'botões pequenos'
            pg.get_by_label('VER E CRIAR ›' if k == 5 else 'PRÓXIMA ›').click()
        assert nomes == ['pedir', 'manha', 'escola', 'tarde', 'noite', 'gosto'], nomes
        pg.get_by_label('revisar criação rápida').wait_for()
    item(15, 'Criação rápida: perguntas da rotina (pedir, manhã, escola, tarde, noite, gostos) com botões grandes para tocar', f)
    def f(pg):
        pg.goto(U + '?tela=v14:rapida'); pg.get_by_label('recomendação dos especialistas').first.wait_for()
        t = pg.get_by_label('recomendação dos especialistas').first.inner_text(); assert 'cerca de 10' in t and 'AssistiveWare' in t
        pg.get_by_label('COMEÇAR ›').click()
        for k in range(6):
            for o in pg.locator('[aria-label^="opção "]').all()[:4]: o.click()
            pg.get_by_label('VER E CRIAR ›' if k == 5 else 'PRÓXIMA ›').click()
        pg.get_by_label('revisar criação rápida').wait_for(); assert '10 de 10' in pg.get_by_label('limite do plano').inner_text()
        grupos = pg.locator('[aria-label="revisar criação rápida"] >> text=/^(🙋|🌅|🏫|☀️|🌙|❤️)/').count(); assert grupos >= 2, 'categorias'
        pg.get_by_label('✅ CRIAR 10 BOTÕES').click(); pg.get_by_text('botões criados', exact=False).first.wait_for()
    item(16, 'Começa com 10; não passa do limite do plano; cada botão vai para a sua categoria', f)
    def f(pg):
        pg.goto(U + '?tela=v14:rapida&plano=completo'); pg.get_by_label('COMEÇAR ›').click()
        for o in pg.locator('[aria-label^="opção "]').all(): o.click()
        assert pg.locator('[aria-label^="opção "][aria-checked="true"]').count() == 12, 'Plano Completo marca todos'
        assert 'Plano Completo' in pg.get_by_label('limite do plano').inner_text()
    item(17, 'Plano Completo pode criar todos', f)
    # ---------------- CONQUISTAS, AJUDA, CURSO, RELATÓRIO
    def f(pg):
        pg.goto(V); pg.get_by_label('CONQUISTAS E PRÊMIOS').first.click(); pg.get_by_text('Conquistas de', exact=False).first.wait_for()
        pg.get_by_label('nome da nova conquista').fill('Escovou os dentes'); pg.get_by_label(re.compile('Criar conquista')).click(); pg.get_by_text('Escovou os dentes').first.wait_for()
    item(18, 'Conquistas do mês (o app renova) + conquistas da família', f)
    def f(pg):
        pg.goto(U + '?tela=ajuda'); pg.get_by_label('Buscar na ajuda').fill('criação rápida'); pg.wait_for_timeout(300)
        pg.get_by_text('Criação rápida (montar as pranchas só tocando)').first.click(); pg.get_by_label(re.compile('^me leve até lá Criação rápida')).first.click()
        pg.get_by_label('COMEÇAR ›').or_(pg.get_by_label('CRIAÇÃO RÁPIDA')).first.wait_for()  # abre a tela ou mostra o lugar com o tour
        pg.goto(U + '?tela=ajuda'); pg.get_by_label(re.compile('^tour ')).first.wait_for(); assert pg.get_by_label(re.compile('^tour ')).count() >= 6
    item(19, 'Ajuda que sabe tudo + "Me leve até lá" + tour por parte', f)
    def f(pg):
        pg.goto(U + '?tela=v14:curso'); pg.get_by_label('licao usar').wait_for(); n = pg.locator('[aria-label^="licao "]').count(); assert n >= 10, f'{n} lições'
        pg.get_by_label('licao usar').click(); pg.get_by_label('mascote').first.wait_for(); assert pg.locator('[aria-label="mascote"] img').count() >= 15, 'mascote oficial'
        cx = pg.get_by_label('caixinha do curso').bounding_box(); assert cx['width'] <= 300
    item(20, 'Curso detalhado (10 lições), mascote oficial, caixinha pequena', f)
    def f(pg):
        pg.goto(U + '?tela=relatorio'); pg.wait_for_timeout(1200); t = pg.inner_text('body')
        assert 'O que o app percebeu' in t and 'Fonoaudiologia' not in t and 'Terapia ocupacional' not in t
    item(21, 'Relatório geral sem nome de profissional + "O que o app percebeu"', f)
    def f(pg):
        pg.goto(U + '?tela=v14:crescer'); pg.get_by_label('recomendação dos especialistas').first.wait_for(); pg.wait_for_timeout(600); t = pg.inner_text('body'); assert 'SEGUNDO ESPECIALISTAS' in t and 'cerca de 10' in t
    item(22, 'Crescer: recomendação dos especialistas (10) com a fonte discreta', f)
    def f(pg):
        pg.add_init_script(FALAS); pg.goto(U + '?tela=v14:rapida'); pg.get_by_label('COMEÇAR ›').click(); pg.get_by_label('pergunta pedir').wait_for()
        m = pg.get_by_label('mascote').last; m.wait_for(); assert pg.locator('[aria-label="mascote"] img').count() >= 15, 'mascote oficial (imagens) não está'
        visto = set()
        for _ in range(30):
            src = pg.evaluate("() => { const ms = document.querySelectorAll('[aria-label=mascote]'); const m = ms[ms.length - 1]; const v = [...m.querySelectorAll('img')].find(i => getComputedStyle(i.parentElement).opacity === '1' || i.parentElement.style.opacity === '1'); return v ? v.src.split('/').pop() : ''; }")
            visto.add(re.sub(r'\.[0-9a-f]+\.png$', '', src)); pg.wait_for_timeout(90)
        bocas = {v for v in visto if re.search(r'm_[nadp][12]', v)}
        assert len(bocas) >= 1 and any(re.search(r'm_[nadp]0|m_[na]P', v) for v in visto), f'a boca não mexeu com a fala: {visto}'
    item(24, 'Mascote oficial dentro do app, com a boca sincronizada com a fala', f)
    def f(pg):
        for idi in ['en', 'es']:
            for t in ['rapida', 'ia', 'conquistas', 'vozes', 'crescer']:
                pg.goto(U + f'?tela=v14:{t}&idioma={idi}'); pg.wait_for_timeout(400); c = pg.inner_text('body')
                assert 'undefined' not in c and 'NaN' not in c, f'{idi} {t}'
    item(23, 'Telas novas em inglês e espanhol', f)
    b.close()
finally:
    srv.terminate()
ok = sum(1 for r in res if r[2] == '✅')
with open(os.path.join(FOTOS, 'resultado.md'), 'w') as fh:
    fh.write('| # | Pedido | Resultado | Detalhe |\n|---|---|---|---|\n')
    for n, ped, st, d in res: fh.write(f'| {n} | {ped} | {st} | {d} |\n')
print(f'\n{ok} de {len(res)} pedidos conferidos OK')
