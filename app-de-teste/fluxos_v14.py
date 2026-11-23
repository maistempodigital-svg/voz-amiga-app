import re
# Testes de uso (cliques reais) das funções da v14 — celular normal, celular barato (tela pequena) e tablet, 3 idiomas, sem internet.
import subprocess, sys, time, os, re, json
from playwright.sync_api import sync_playwright, expect
base = os.path.dirname(os.path.abspath(__file__))
PORTA = int(os.environ.get('PORTA', '8767'))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORTA), '-d', os.path.join(base, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
U = f'http://localhost:{PORTA}/'
V = U + '?tela=vozAjustes'
FALAS = "window.__falas=[];window.AndroidTTS={speak2:(t)=>window.__falas.push(t),speak:(t)=>window.__falas.push(t),vozes:()=>'[]'};"
falhas = []; externos = []
TELAS = {'celular': (411, 914), 'barato': (360, 640), 'tablet': (1024, 1366)}

def caso(nome, f, tela='celular', offline=True, premium=False):
    if os.environ.get('SO') and not any(x in nome for x in os.environ['SO'].split(',')): return
    w, h = TELAS[tela]
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, accept_downloads=True)
    pg = ctx.new_page(); erros = []
    if premium:  # v14.8: funções do Plano Completo testadas como assinante
        pg.add_init_script("if(!/plano=/.test(location.search)) history.replaceState(null,'',location.pathname+(location.search?location.search+'&':'?')+'plano=completo')")
    pg.on('pageerror', lambda e: erros.append(str(e)))
    if offline:  # 100% sem internet: qualquer pedido para fora é bloqueado e anotado
        def rota(r):
            if r.request.url.startswith(U): r.continue_()
            else:
                if 'arasaac.org' not in r.request.url and not ('api.openai.com' in r.request.url and 'chatgpt' in nome): externos.append(f'{nome}: {r.request.url[:80]}')
                r.abort()
        pg.route('**/*', rota)
    try:
        f(pg)
        if erros: raise Exception('erro JS: ' + erros[0])
        print('✓', nome, f'[{tela}]')
    except Exception as e:
        falhas.append(nome); print('✗', nome, f'[{tela}]', '->', str(e)[:400])
        try: pg.screenshot(path=os.path.join(base, 'telas-teste', 'FALHA-v14-' + nome + '.png'))
        except Exception: pass
    ctx.close()

def segurar(pg, loc, ms):
    loc.wait_for(); b0 = loc.bounding_box()
    pg.mouse.move(b0['x'] + b0['width']/2, b0['y'] + b0['height']/2); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up()
def conta(pg):
    pg.get_by_text('Resolva para entrar').wait_for()
    txt = pg.locator('text=/\\d+ \\+ \\d+ =/').inner_text()
    a, bb = map(int, re.findall(r'\d+', txt)[:2])
    digitar(pg, str(a + bb))
def digitar(pg, num):
    for ch in num: pg.get_by_label(ch, exact=True).click()
    pg.get_by_label('✓', exact=True).click()
def voltar(pg):
    # a tela de cima é a última na página (as de baixo continuam montadas por trás)
    pg.get_by_label('Voltar').locator('visible=true').last.click(); pg.wait_for_timeout(250)
GRUPO = {'backupAuto': 'Proteger as pranchas', 'apagarPranchas': 'Proteger as pranchas', 'senhaPais': 'Proteger as pranchas', 'emergencia': 'Proteger as pranchas',
         'niveis': 'Crescer com a criança', 'gradeCrescente': 'Crescer com a criança', 'visualIdade': 'Crescer com a criança', 'ia': 'IA (opcional)',
         'telaCalma': 'Conforto da tela', 'tempoToque': 'Conforto da tela', 'botoesGrandes': 'Conforto da tela', 'fundoAnimado': 'Conforto da tela'}
def chave(pg, rid):
    try: pg.get_by_label('chave ' + rid).locator('visible=true').first.wait_for(timeout=2500)
    except Exception: pg.get_by_label('assunto ' + GRUPO[rid]).click(); pg.wait_for_timeout(300)
    pg.get_by_label('chave ' + rid).locator('visible=true').first.click(); pg.wait_for_timeout(150)
def mais_funcoes(pg):
    # v14.3: as funções ficam dentro das DEFINIÇÕES
    pg.goto(V); pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_label('funções do app').wait_for()
def ir_home_via_fechar(pg):
    for _ in range(5):
        if pg.get_by_label('Voltar').locator('visible=true').count() == 0: break
        voltar(pg); pg.wait_for_timeout(200)
    pg.get_by_label('Fechar').first.click(); pg.wait_for_timeout(300)

try:
  with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------------------------------------------------------------- TELA INICIAL LIMPA
    def home_limpa(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        # topo continua com os 5 botões e as abas numa linha só (todas na mesma altura)
        ys = {round(pg.get_by_label(n, exact=True).bounding_box()['y']) for n in ['GERAL', 'PESSOAS', 'EXPRESSÃO SOCIAL', 'DESCRIÇÃO']}
        assert len(ys) == 1, f'abas em mais de uma linha: {ys}'
        assert pg.get_by_label('fileira de abas').count() == 1
        # pranchas aparecem sem rolar a página e sem rolagem para o lado
        bx = pg.get_by_label('ÁGUA', exact=True).bounding_box(); vh = pg.viewport_size['height']
        assert bx and bx['y'] + bx['height'] <= vh, 'prancha fora da tela'
        assert pg.evaluate('document.scrollingElement.scrollWidth <= window.innerWidth + 1'), 'rolagem para o lado'
        # nada novo ligado por padrão atrapalha: sem fundo animado, sem textos de missão na tela da criança
        assert pg.get_by_text('MISSÃO DO DIA').count() == 0
    for t in TELAS: caso('home-limpa', home_limpa, t)

    def abas_deslizam(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click()
        for pac in ['Banho', 'Escola', 'Frutas', 'Doces']:
            pg.get_by_label('pacote ' + pac, exact=True).click(); pg.get_by_label('Transferir Pacote').click(); pg.get_by_text(f'Pacote "{pac}" transferido!').wait_for()
        pg.get_by_label('Fechar').first.click(); pg.get_by_label('Fechar').first.click(); pg.get_by_label('GERAL', exact=True).wait_for()
        fileira = pg.get_by_label('fileira de abas')
        assert fileira.evaluate('e => e.scrollWidth > e.clientWidth + 5'), 'com muitas abas a fileira tem que deslizar'
        ys = {round(pg.get_by_label(n, exact=True).bounding_box()['y']) for n in ['GERAL', 'AÇÕES', 'ESCOLA']}
        assert len(ys) == 1, f'abas não podem descer: {ys}'
        pg.get_by_label('DOCES', exact=True).scroll_into_view_if_needed(); pg.get_by_label('DOCES', exact=True).click()
        pg.get_by_label('BOLO', exact=True).wait_for()
    caso('abas-numa-fileira-que-desliza', abas_deslizam, premium=True)
    caso('abas-numa-fileira-que-desliza', abas_deslizam, 'barato', premium=True)

    # ---------------------------------------------------------------- MAIS FUNÇÕES (liga/desliga)
    def hub(pg):
        mais_funcoes(pg)
        for txt in ['Proteger as pranchas', 'Menos trabalho', 'Crescer com a criança', 'Conforto da tela', 'IA (opcional)']:
            pg.get_by_label('assunto ' + txt, exact=True).wait_for()
        assert pg.get_by_label('assunto Voz', exact=True).count() == 0, 'voz não repete aqui (fica em Definições)'
        # desligar emergência some com o botão da tela inicial
        chave(pg, 'emergencia'); ir_home_via_fechar(pg)
        pg.get_by_label('EU', exact=True).wait_for(); assert pg.get_by_label('emergência').count() == 0
    caso('mais-funcoes-desliga-emergencia', hub)

    def protegido(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('AJUSTES', exact=True).click(); pg.wait_for_timeout(400)
        assert pg.get_by_text('Ajustes e Opções').count() == 0, 'ajustes só segurando + continha'
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); conta(pg); pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_label('funções do app').wait_for()
    caso('mais-funcoes-protegido-pela-trava', protegido)

    # ---------------------------------------------------------------- EMERGÊNCIA (sem pop-up)
    def emergencia(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('emergência').click()
        pg.get_by_label('Estou com dor', exact=True).wait_for(); pg.get_by_label('Preciso de ajuda', exact=True).click()
        pg.wait_for_timeout(300); assert pg.get_by_label('Estou com dor', exact=True).count() == 0
        assert pg.get_by_role('dialog').count() == 0
    caso('emergencia-na-barra', emergencia)
    caso('emergencia-na-barra', emergencia, 'barato')

    # ---------------------------------------------------------------- MODO EXEMPLO
    def exemplo(pg):
        # v14.2: no modo exemplo o pai monta e aperta FALAR; fala, mas não conta como da criança (sem estrela)
        pg.add_init_script(FALAS); pg.goto(U + '?tela=home'); pg.get_by_label('modo exemplo').click(); pg.get_by_label('ÁGUA', exact=True).click(); pg.wait_for_timeout(400)
        assert pg.evaluate('window.__falas.length') == 0, 'tocar não fala'
        pg.get_by_label('FALAR', exact=True).click(); pg.wait_for_timeout(500)
        assert pg.evaluate('window.__falas.length') == 1, 'FALAR fala no modo exemplo'
        assert pg.get_by_label(re.compile(r'^selo \+')).count() == 0, 'modo exemplo não dá estrela'
        pg.get_by_label('modo exemplo').click(); pg.get_by_label('ÁGUA', exact=True).click(); pg.get_by_label('palavra Eu', exact=True).wait_for()
        pg.get_by_label('FALAR', exact=True).click(); pg.wait_for_timeout(400); assert pg.evaluate('window.__falas.length') == 2, 'a criança fala no FALAR'
    caso('modo-exemplo', exemplo)

    # ---------------------------------------------------------------- SENHA DOS PAIS
    def senha(pg):
        pg.goto(U + '?tela=v14:senha'); pg.get_by_label('Nova senha (4 a 8 números)').fill('2468'); pg.get_by_label('Repita a senha').fill('2468')
        pg.get_by_label('Salvar senha').click(); pg.wait_for_timeout(500)
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); conta(pg)
        pg.get_by_text('Digite a senha de números.').wait_for(); digitar(pg, '1111'); pg.get_by_text('Senha errada.').wait_for()
        digitar(pg, '2468'); pg.get_by_text('Ajustes e Opções').wait_for()
        # esqueci a senha: conta difícil apaga
        pg.get_by_label('Fechar').first.click(); segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); conta(pg)
        # v14 (auditoria): "esqueci a senha" NÃO abre os ajustes; só deixa apagar depois de 24 h
        pg.get_by_label('Esqueci a senha').click(); pg.get_by_text('Por segurança, a senha só pode ser apagada daqui a 24 horas', exact=False).wait_for()
        pg.wait_for_timeout(400); assert pg.get_by_label('DEFINIÇÕES').count() == 0, 'não pode abrir os ajustes'
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); conta(pg); pg.get_by_text('Digite a senha de números.').wait_for()
        pg.get_by_label('Esqueci a senha').click(); pg.get_by_text('A senha poderá ser apagada a partir de', exact=False).wait_for()
    caso('senha-dos-pais', senha)

    # ---------------------------------------------------------------- BACKUP (arquivo + cópias + adulterado)
    def backup(pg):
        pg.goto(U + 'index.html'); pg.evaluate('localStorage.clear()'); pg.goto(U + '?tela=v14:backup')
        pg.get_by_label('Fazer cópia agora').click(); pg.get_by_text('Cópia guardada.').wait_for()
        pg.get_by_label('restaurar copia 1').wait_for()
        with pg.expect_download() as d: pg.get_by_label('Enviar cópia (Drive, WhatsApp…)').click()
        caminho = d.value.path(); texto = open(caminho, encoding='utf-8').read(); j = json.loads(texto)
        assert j['formato'] == 'vozamiga-backup' and len(j['soma']) == 64 and j['resumo']['pranchas'] == 3, j['resumo']
        # arquivo adulterado é recusado
        ruim = texto.replace('Água', 'Agua')
        with pg.expect_file_chooser() as fc: pg.get_by_label('Restaurar de um arquivo').click()
        fc.value.set_files(files=[{'name': 'x.json', 'mimeType': 'application/json', 'buffer': ruim.encode()}])
        pg.get_by_label('Restaurar', exact=True).click(); pg.get_by_text('O arquivo foi alterado ou chegou cortado').wait_for()
        # arquivo bom restaura
        with pg.expect_file_chooser() as fc: pg.get_by_label('Restaurar de um arquivo').click()
        fc.value.set_files(files=[{'name': 'x.json', 'mimeType': 'application/json', 'buffer': texto.encode()}])
        pg.get_by_label('Restaurar', exact=True).click(); pg.get_by_text('Pronto! Tudo foi restaurado.').wait_for()
        # lixo
        with pg.expect_file_chooser() as fc: pg.get_by_label('Restaurar de um arquivo').click()
        fc.value.set_files(files=[{'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'{"formato":"vozamiga-backup","versao":1,"dados":{"voz":{"abas":"x","pranchas":[]},"rotina":{}}}'}])
        pg.get_by_label('Restaurar', exact=True).click(); pg.wait_for_timeout(600)
        assert pg.get_by_text('Pronto! Tudo foi restaurado.').count() == 0
    caso('backup-arquivo-e-copias', backup)

    def backup_celular_novo(pg):
        # exporta num "celular", importa noutro (contexto novo = celular novo, vazio)
        pg.goto(U + '?tela=v14:backup')
        with pg.expect_download() as d: pg.get_by_label('Enviar cópia (Drive, WhatsApp…)').click()
        texto = open(d.value.path(), encoding='utf-8').read()
        ctx2 = b.new_context(viewport={'width': 411, 'height': 914}); p2 = ctx2.new_page()
        p2.goto(U + 'index.html?semFirebase=1'); p2.evaluate('localStorage.clear()'); p2.reload(); p2.get_by_label('Pular tour').click()
        assert p2.get_by_label('ÁGUA', exact=True).count() == 0
        segurar(p2, p2.get_by_label('AJUSTES', exact=True), 3300); conta(p2); p2.get_by_label('DEFINIÇÕES').click(); p2.get_by_label('assunto Proteger as pranchas').click(); p2.get_by_label('ajustes Cópia de segurança').click()
        with p2.expect_file_chooser() as fc: p2.get_by_label('Restaurar de um arquivo').click()
        fc.value.set_files(files=[{'name': 'b.json', 'mimeType': 'application/json', 'buffer': texto.encode()}])
        p2.get_by_label('Restaurar', exact=True).click(); p2.get_by_text('Pronto! Tudo foi restaurado.').wait_for()
        for _ in range(3): voltar(p2)
        p2.wait_for_timeout(300); p2.get_by_label('Fechar').first.click()
        p2.get_by_label('ÁGUA', exact=True).wait_for()
        p2.reload(); p2.get_by_label('ÁGUA', exact=True).wait_for()  # continua depois de reabrir (nunca sai sozinho)
        ctx2.close()
    caso('backup-num-celular-novo', backup_celular_novo)

    # ---------------------------------------------------------------- VOZES
    def vozes(pg):
        pg.goto(U + '?tela=v14:vozes'); pg.get_by_label('▶ Testar voz').click()
        pg.get_by_label('passo a passo da voz').click(); pg.get_by_text('Instalar dados de voz', exact=False).first.wait_for()
        pg.get_by_label('Adolescente', exact=True).click(); pg.get_by_label('🐢 Devagar').click()
        pg.get_by_label('🎙️ Voz gravada por você').click(); expect(pg.get_by_label('🎙️ Voz gravada por você')).to_have_attribute('aria-checked', 'true')
        corpo = pg.inner_text('body'); assert 'Piper' not in corpo and 'eSpeak' not in corpo and 'voz do mascote' not in corpo.lower(), 'Piper/voz do mascote foram tirados'
    caso('vozes', vozes)

    # ---------------------------------------------------------------- CURSO COM O MASCOTE
    def curso(pg):
        pg.goto(U + '?tela=v14:curso'); pg.get_by_label('licao usar').click()
        pg.get_by_text('Oi! Eu sou o mascote do Voz Amiga', exact=False).wait_for()
        assert pg.get_by_label('mascote').count() >= 1
        for _ in range(4): pg.get_by_label('Próximo passo').click(); pg.wait_for_timeout(1100)
        pg.get_by_text('Teclado', exact=True).first.wait_for()
        pg.get_by_label('Concluir tour').click(); pg.wait_for_timeout(600)
        assert pg.get_by_text('Oi! Eu sou o mascote').count() == 0
        pg.get_by_label('EU', exact=True).wait_for()
    caso('curso-licao-com-mascote', curso)
    caso('curso-licao-com-mascote', curso, 'barato')
    def curso_montar(pg):
        pg.goto(U + '?tela=v14:curso'); pg.get_by_label('licao montar').click(); pg.get_by_text('Criar prancha', exact=True).first.wait_for()
        pg.get_by_label('Próximo passo').click(); pg.wait_for_timeout(1300); pg.get_by_text('Escreva a palavra').wait_for()
        assert pg.get_by_text('Imagem da Prancha').count() >= 1, 'o curso abre a tela de criar prancha'
        pg.get_by_label('Sair da lição').click()
    caso('curso-abre-as-telas', curso_montar)

    # ---------------------------------------------------------------- NÍVEIS, GRADE, PACOTES DE ROTINA, FOTO
    def niveis(pg):
        mais_funcoes(pg); chave(pg, 'niveis'); pg.get_by_label('ajustes Níveis de frase').click(); pg.get_by_label('1️⃣ Uma palavra').click()
        ir_home_via_fechar(pg)
        pg.get_by_label('EU', exact=True).click(); pg.get_by_label('QUERO', exact=True).click(); pg.wait_for_timeout(300)
        n = pg.get_by_label(re.compile(r'^palavra ')).count(); q = pg.get_by_label(re.compile(r'^palavra quero$', re.I)).count()
        assert n == 1 and q == 1, f'nível 1: uma palavra só (tem {n})'
    caso('nivel-uma-palavra', niveis, premium=True)

    def grade(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('pacote Frutas', exact=True).click(); pg.get_by_label('Transferir Pacote').click(); pg.get_by_text('transferido!', exact=False).wait_for()
        pg.get_by_label('Fechar').first.click(); mais_funcoes(pg); chave(pg, 'gradeCrescente'); ir_home_via_fechar(pg)
        pg.get_by_label('GERAL', exact=True).click(); pg.wait_for_timeout(300)
        assert pg.get_by_label('ÁGUA', exact=True).count() == 1 and pg.get_by_label('MAÇÃ', exact=True).count() == 1
        assert pg.get_by_label('MELANCIA', exact=True).count() == 1 and pg.get_by_label('MANGA', exact=True).count() == 0, 'grade de 10: as novas esperam'
    caso('grade-que-cresce', grade, premium=True)

    def pacote_rotina(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click()
        for pac in ['Café da manhã', 'Banho', 'Escola', 'Parque', 'Médico', 'Dormir']: pg.get_by_label('pacote ' + pac, exact=True).wait_for()
        pg.get_by_label('grade de pacotes').wait_for()
        ys = [round(pg.get_by_label('pacote ' + p, exact=True).bounding_box()['y']) for p in ['Café da manhã', 'Banho', 'Escola']]
        assert len(set(ys)) == 1, f'3 pacotes um ao lado do outro: {ys}'
        assert pg.evaluate('document.scrollingElement.scrollWidth <= window.innerWidth + 1'), 'sem rolagem para o lado'
        pg.get_by_label('pacote Médico', exact=True).click(); pg.get_by_label('pacote escolhido').wait_for(); pg.get_by_label('Transferir Pacote').click(); pg.get_by_text('Pacote "Médico" transferido!').wait_for()
    caso('pacotes-de-rotina', pacote_rotina, premium=True)

    def sem_foto(pg):
        pg.goto(V); pg.get_by_label('DEFINIÇÕES').first.wait_for()
        assert pg.get_by_label('MAIS FUNÇÕES').count() == 0, 'Mais funções foi para as Definições'
        assert pg.get_by_label('CRIAR PRANCHA').count() >= 1 and pg.get_by_label('CRIAÇÃO RÁPIDA').count() == 0, 'criar prancha nos Ajustes; o guiado fica dentro do Criar prancha'
        pg.get_by_label('CRIAR PRANCHA', exact=True).click(); pg.get_by_label('CRIAÇÃO RÁPIDA').click(); pg.get_by_label('COMEÇAR ›').wait_for()
        assert pg.get_by_label('CRIAR COM FOTO').count() == 0, 'criar com foto foi tirado'
        assert pg.get_by_text('Frases prontas', exact=False).count() == 0 and pg.get_by_text('FRASES PRONTAS').count() == 0, 'frases prontas tiradas dos ajustes'
    caso('sem-criar-com-foto-e-frases-prontas', sem_foto, premium=True)

    # ---------------------------------------------------------------- IA (sugere, pais aprovam)
    def ia(pg):
        pg.goto(U + '?tela=v14:ia'); pg.get_by_label('palavra para completar').fill('água'); pg.get_by_text('"eu quero água, por favor"', exact=False).wait_for()
        pg.get_by_label('Aprovar e guardar').click(); pg.get_by_text('Frase aprovada', exact=False).wait_for()
        pg.get_by_label('tema da prancha').fill('festa'); pg.get_by_label('Aprovar e criar 10 botões').click(); pg.get_by_text('10 botões criados', exact=False).wait_for()
        assert pg.get_by_role('textbox', name='mensagem para a IA').count() == 0, 'sem chat livre'
    caso('ia-sugere-pais-aprovam', ia)
    def ia_criar(pg):
        mais_funcoes(pg); chave(pg, 'ia'); ir_home_via_fechar(pg); segurar(pg, pg.get_by_label('CRIAR PRANCHA', exact=True), 3300); conta(pg); pg.get_by_text('Imagem da Prancha').wait_for()
        pg.get_by_placeholder('Ex: Obrigado').fill('brincar'); pg.get_by_label('usar sugestão da IA').click(); expect(pg.get_by_placeholder('Ex: Obrigado')).to_have_value('Brincar')
    caso('ia-sugere-nome-e-cor', ia_criar, premium=True)

    # ---------------------------------------------------------------- CONFORTO
    def conforto(pg):
        pg.goto(U + '?tela=v14:conforto'); chave(pg, 'telaCalma'); chave(pg, 'tempoToque'); pg.get_by_label('estilo quadrado').click(); pg.get_by_label('📲 Tablet').click()
        pg.get_by_label('0,6 s').click()
    caso('conforto', conforto, premium=True)
    caso('conforto', conforto, 'tablet', premium=True)

    # ---------------------------------------------------------------- CADA FUNÇÃO TEM EFEITO VISÍVEL NA TELA DA CRIANÇA
    def efeito(pg):
        def medir():
            pg.get_by_label('ÁGUA', exact=True).wait_for()
            bx = pg.get_by_label('ÁGUA', exact=True).bounding_box()
            fundo = pg.get_by_label('ÁGUA', exact=True).evaluate("e => getComputedStyle(e.firstElementChild || e).backgroundColor")
            return bx['width'], fundo, pg.get_by_text('👑 Plano Completo').count()
        pg.goto(U + '?tela=home'); w0, f0, ad0 = medir()
        assert ad0 == 1
        mais_funcoes(pg); chave(pg, 'telaCalma'); pg.get_by_text('Tela calma: LIGADO', exact=False).wait_for(); ir_home_via_fechar(pg)
        w1, f1, ad1 = medir()
        assert f1 != f0, f'tela calma não mudou a cor ({f0} -> {f1})'
        assert ad1 == 0, 'tela calma esconde o anúncio'
        mais_funcoes(pg); chave(pg, 'botoesGrandes'); ir_home_via_fechar(pg)
        w2, _, _ = medir()
        assert w2 > w0 * 1.15, f'botões grandes não aumentou ({w0} -> {w2})'
    caso('cada-funcao-muda-a-tela', efeito)

    def curso_caixinha(pg):
        pg.goto(U + '?tela=v14:curso'); pg.get_by_label('licao montar').click(); pg.get_by_text('Criar prancha', exact=True).first.wait_for(); pg.wait_for_timeout(900)
        cx = pg.get_by_label('caixinha do curso').bounding_box(); vw = pg.viewport_size
        assert cx['width'] <= 300 and cx['height'] < vw['height'] * 0.4, f'caixinha grande demais: {cx}'
        # o mascote é o personagem laranja desenhado (sem imagem), com olho, boca e braços
        assert pg.locator('[aria-label="mascote"] img').count() >= 15, 'mascote oficial (imagens da marca)'
        # aponta para o botão de verdade (caixinha encostada no botão CRIAR PRANCHA)
        alvo = pg.get_by_label('CRIAR PRANCHA').first.bounding_box()
        assert abs(cx['y'] - (alvo['y'] + alvo['height'])) < 60 or abs((cx['y'] + cx['height']) - alvo['y']) < 60, 'caixinha longe do botão'
    caso('curso-caixinha-ao-lado-do-botao', curso_caixinha)
    caso('curso-caixinha-ao-lado-do-botao', curso_caixinha, 'barato')

    # ---------------------------------------------------------------- 3 IDIOMAS
    def idiomas(pg):
        for idi, txt in [('pt', 'Funções do app'), ('en', 'App features'), ('es', 'Funciones de la app')]:
            pg.goto(U + f'?tela=maisFuncoes&idioma={idi}'); pg.get_by_text(txt).first.wait_for()
            corpo = pg.inner_text('body'); assert 'undefined' not in corpo and '[object' not in corpo, idi
            for t in ['backup', 'vozes', 'pais', 'duvidas', 'curso', 'ia', 'conforto', 'crescer', 'senha', 'emergencia', 'conquistas', 'rapida']:
                pg.goto(U + f'?tela=v14:{t}&idioma={idi}'); pg.wait_for_timeout(500)
                corpo = pg.inner_text('body'); assert 'undefined' not in corpo and 'NaN' not in corpo and '[object' not in corpo, f'{idi} {t}'
    caso('tres-idiomas-todas-as-telas', idiomas)

    # ---------------------------------------------------------------- FIREBASE PREPARADO (sem tocar no Firebase)
    def firebase(pg):
        r = json.dumps({'ia': {'liberado': True, 'plano': 'completo'}, 'curso': {'liberado': False}, 'senhaPais': {'liberado': False}})
        pg.goto(U + '?tela=maisFuncoes&recursos=' + r); pg.get_by_label('assunto IA (opcional)').click()
        pg.get_by_label('bloqueado ia').wait_for(); pg.get_by_text('👑 Plano Completo', exact=False).locator('visible=true').first.wait_for()
        assert pg.get_by_label('chave ia').locator('visible=true').count() == 0
        voltar(pg); pg.get_by_label('assunto Aprender e apoio para os pais').click(); pg.get_by_text('Indisponível no momento.').locator('visible=true').first.wait_for()
        voltar(pg); pg.get_by_label('assunto Proteger as pranchas').click(); pg.get_by_label('chave senhaPais').wait_for()  # proteção nunca depende do Firebase
        pg.goto(U + '?tela=maisFuncoes&plano=completo&recursos=' + r); pg.get_by_label('assunto IA (opcional)').click(); pg.get_by_label('chave ia').wait_for()
    caso('firebase-libera-ou-bloqueia-por-plano', firebase)

    # ---------------------------------------------------------------- relatório com evolução
    def relatorio(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('modo exemplo').click(); pg.get_by_label('ÁGUA', exact=True).click(); pg.get_by_label('modo exemplo').click()
        pg.get_by_label('EU', exact=True).click(); pg.get_by_label('emergência').click(); pg.get_by_label('Estou com dor', exact=True).click()
        pg.goto(U + '?tela=relatorio'); pg.get_by_text('Evolução (funções novas)').first.wait_for()
    caso('relatorio-evolucao', relatorio, premium=True)
    # ---------------------------------------------------------------- v14.2: SÓ FALA NO "FALAR"
    def so_falar(pg):
        pg.add_init_script(FALAS); pg.goto(U + '?tela=home'); pg.get_by_label('ÁGUA', exact=True).click(); pg.wait_for_timeout(500)
        assert pg.evaluate('window.__falas.length') == 0, f'falou sem apertar FALAR: {pg.evaluate("window.__falas")}'
        pg.get_by_label('FALAR', exact=True).click(); pg.wait_for_timeout(400)
        f = pg.evaluate('window.__falas'); assert len(f) == 1 and 'gua' in f[0].lower(), f'FALAR com uma palavra: {f}'
        # sugestões numa linha só
        ln = pg.get_by_label('linha de sugestões')
        if ln.count():
            bx = ln.first.bounding_box(); assert bx['height'] < 80, f'sugestões em mais de uma linha: {bx}'
    caso('so-fala-no-botao-falar', so_falar)

    def segure(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        alvo = pg.get_by_label(re.compile('^(AJUSTES|TRAVAR APP)', re.I)).first
        for i in range(3):
            alvo.click(); pg.wait_for_timeout(300)
            n = pg.get_by_label('aviso segure 3 segundos').count()
            if i < 2: assert n == 1, f'toque {i+1}: aviso não apareceu'
            else: assert n == 0 or i >= 2, 'aviso deve parar depois de 2 vezes'
            pg.wait_for_timeout(4200)
        assert pg.get_by_label('aviso segure 3 segundos').count() == 0, 'depois de 2 vezes não avisa mais'
    caso('aviso-segure-3-segundos', segure)

    def comece(pg):
        pg.goto(U + '?tela=home&vazio=1'); pg.get_by_label('comece por aqui').first.wait_for()
    caso('comece-por-aqui', comece)

    def conquistas(pg):
        pg.goto(V); pg.get_by_label('CONQUISTAS E PRÊMIOS').first.click()
        pg.get_by_text('Conquistas do mês', exact=False).first.wait_for()
        pg.get_by_label('nome da nova conquista').fill('Escovou os dentes sozinho')
        pg.get_by_label(re.compile('Criar conquista')).first.click()
        pg.get_by_text('Escovou os dentes sozinho').first.wait_for()
        pg.get_by_label('marcar Escovou os dentes sozinho').click(); pg.wait_for_timeout(300)
        voltar(pg); pg.get_by_label('CONQUISTAS E PRÊMIOS').first.click(); pg.get_by_text('Escovou os dentes sozinho').first.wait_for()  # continua salva
    caso('conquistas-e-premios', conquistas)

    def ajuda(pg):
        pg.goto(U + '?tela=ajuda'); pg.get_by_label('Buscar na ajuda').fill('trocar a voz'); pg.wait_for_timeout(400)
        pg.get_by_text('Trocar a voz, velocidade e tom').first.click()
        pg.get_by_label(re.compile('^me leve até lá Trocar a voz')).click()
        pg.get_by_label('▶ Testar voz').wait_for()
        pg.goto(U + '?tela=ajuda'); pg.get_by_label(re.compile('^tour ')).first.wait_for()
        assert pg.get_by_label(re.compile('^tour ')).count() >= 4, 'tours por parte'
    caso('ajuda-sabe-tudo-e-me-leva', ajuda)
    # ---------------------------------------------------------------- v14.3
    def definicoes_juntas(pg):
        pg.goto(U + '?tela=voz:definicoes'); pg.get_by_label('funções do app').wait_for()
        assert pg.get_by_label('Testar Voz', exact=True).count() == 0, 'testar voz repetido saiu'
        pg.get_by_label('assunto Conforto da tela').click(); pg.get_by_label('chave telaCalma').wait_for()
    caso('definicoes-com-funcoes-e-destaque', definicoes_juntas)

    def segure_pequeno(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('AJUSTES', exact=True).click(); pg.wait_for_timeout(300)
        bx = pg.get_by_label('aviso segure 3 segundos').bounding_box(); assert bx['height'] < 45 and bx['y'] < 260, f'aviso grande ou embaixo: {bx}'
        assert 'Segure 3 s para abrir' in pg.get_by_label('aviso segure 3 segundos').inner_text()
    caso('aviso-segure-pequeno-azul', segure_pequeno)

    def ia_baixa(pg):
        pg.goto(U + '?tela=v14:ia&iafake=1'); pg.get_by_label(re.compile('Baixar \\(323')).first.click()
        if pg.get_by_label('Baixar mesmo assim').count(): pg.get_by_label('Baixar mesmo assim').first.click()
        pg.get_by_label('baixando gemma').wait_for(); assert '%' in pg.get_by_label('baixando gemma').inner_text()
        pg.get_by_label('pronto gemma').wait_for(timeout=8000)
        pg.get_by_label('apagar gemma').click(); pg.get_by_label(re.compile('Baixar \\(323')).first.wait_for()
    caso('ia-baixa-mostrando-porcentagem', ia_baixa)

    def chatgpt(pg):
        pg.goto(U + '?tela=v14:ia'); campo = pg.get_by_label('chave do ChatGPT')
        campo.fill('abc'); assert pg.get_by_label('Salvar chave').is_disabled()
        k = 'sk-teste' + 'x' * 40; campo.fill(k); pg.get_by_label('Salvar chave').click()
        pg.get_by_label('chave salva').wait_for(); assert k not in pg.inner_text('body'), 'chave inteira na tela'
        outros = pg.evaluate("Object.keys(localStorage).filter(c => c !== 'vozamiga-chatgpt-chave').map(c => localStorage.getItem(c)).join('|')")
        assert k not in outros, 'a chave vazou para o estado/backup'
        pg.get_by_label('Apagar chave').click(); pg.get_by_label('chave do ChatGPT').wait_for()
    caso('chatgpt-chave-so-no-celular', chatgpt)

    def rapida(pg):
        pg.goto(U + '?tela=voz:criar'); pg.get_by_label('CRIAÇÃO RÁPIDA').click(); pg.get_by_label('recomendação dos especialistas').first.wait_for()
        pg.get_by_label('COMEÇAR ›').click(); pg.get_by_label('pergunta pedir').wait_for()
        for o in ['Água', 'Banheiro', 'Ajuda']: pg.get_by_label('opção ' + o, exact=True).click()
        pg.get_by_label('PRÓXIMA ›').click(); pg.get_by_label('pergunta manha').wait_for(); pg.get_by_label('opção Café da manhã', exact=True).click()
        pg.get_by_label('PRÓXIMA ›').click(); pg.get_by_label('Pular pergunta').click()  # escola
        pg.get_by_label('pergunta tarde').wait_for(); pg.get_by_label('opção Tablet', exact=True).click(); pg.get_by_label('opção Bola', exact=True).click()
        pg.get_by_label('PRÓXIMA ›').click(); pg.get_by_label('opção Banho', exact=True).click(); pg.get_by_label('opção Dormir', exact=True).click()
        pg.get_by_label('PRÓXIMA ›').click(); pg.get_by_label('opção Mamãe', exact=True).click(); pg.get_by_label('opção Papai', exact=True).click()
        # Plano Completo: sem o limite de 10 do grátis
        pg.get_by_label('opção Cachorro', exact=True).click(); pg.wait_for_timeout(200)
        assert pg.get_by_label('opção Cachorro', exact=True).get_attribute('aria-checked') == 'true', 'no pago o cachorro entra'
        pg.get_by_label('VER E CRIAR ›').click(); pg.get_by_label('revisar criação rápida').wait_for()
        pg.get_by_label(re.compile(r'CRIAR \d+ BOTÕES')).click(); pg.get_by_text('botões criados', exact=False).first.wait_for()
        pg.get_by_label('Ver na tela da criança').click(); pg.get_by_label('PEDIR', exact=True).click(); pg.get_by_label('BANHEIRO', exact=True).wait_for()
        pg.get_by_label('NOITE', exact=True).click(); pg.get_by_label('DORMIR', exact=True).wait_for()
    caso('criacao-rapida-tocando', rapida, premium=True)
    caso('criacao-rapida-tocando', rapida, 'barato', premium=True)
    def rapida_gratis(pg):
        pg.goto(U + '?tela=voz:criar'); pg.get_by_label(re.compile('CRIAÇÃO RÁPIDA')).first.click(); pg.wait_for_timeout(400)
        assert pg.get_by_label('COMEÇAR ›').count() == 0, 'grátis não abre a criação rápida'
        pg.get_by_text(re.compile('Criação rápida .*Plano Completo')).first.wait_for()
    caso('criacao-rapida-e-do-plano-pago', rapida_gratis)

    def pacote_fixo(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('grade de pacotes').wait_for()
        ult = pg.locator('[aria-label^="pacote "]').last; ult.scroll_into_view_if_needed(); ult.click(); pg.wait_for_timeout(300)
        bx = pg.get_by_label('pacote escolhido').bounding_box(); vh = pg.viewport_size['height']
        assert bx and bx['y'] + bx['height'] <= vh + 1 and bx['y'] > vh * 0.4, f'painel não está fixo embaixo: {bx}'
        pg.get_by_label('créditos ARASAAC').first.scroll_into_view_if_needed(); assert 'Sergio Palao' in pg.get_by_label('créditos ARASAAC').first.inner_text()
    caso('pacotes-painel-fixo-e-creditos', pacote_fixo)

    # ---- v2.0.7: regras do grátis e entrada nova ----
    def so_bebidas(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('grade de pacotes').wait_for()
        nomes = pg.locator('[aria-label^="pacote "]').all_inner_texts()
        livres = [n for n in nomes if '👑' not in n]
        assert len(livres) == 1 and 'BEBIDA' in livres[0].upper(), f'no grátis só Bebidas: {livres}'
    caso('gratis-so-pacote-bebidas', so_bebidas)
    def sug_agua(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('ÁGUA', exact=True).first.wait_for(); pg.wait_for_timeout(500)
        if pg.get_by_label('Limpar frase').count(): pg.get_by_label('Limpar frase').click(); pg.wait_for_timeout(300)
        pg.get_by_label('ÁGUA', exact=True).first.click(); pg.wait_for_timeout(400)
        pg.get_by_label(re.compile(r'^frase mais água$', re.I)).first.wait_for()
        pg.get_by_label(re.compile(r'^frase eu não quero água$', re.I)).first.wait_for()
    caso('sugestao-agua-vira-frases', sug_agua)
    def entrada(pg):
        pg.goto(U + '?tela=boasVindas'); pg.get_by_label('boas-vindas').wait_for()
        for _ in range(5): pg.get_by_label('Próximo', exact=True).click(); pg.wait_for_timeout(250)
        assert pg.get_by_text('muitas famílias', exact=False).count() == 0
        pg.get_by_label('Próximo', exact=True).click(); pg.wait_for_timeout(250)  # comparação → planos
        pg.get_by_label('Continuar no plano gratuito', exact=True).wait_for()
        bx = pg.get_by_label('Continuar no plano gratuito', exact=True).bounding_box(); vh = pg.viewport_size['height']
        assert bx and bx['y'] + bx['height'] <= vh + 1, f'botão do grátis fora da tela: {bx}'
        pg.get_by_label('Continuar no plano gratuito', exact=True).click(); pg.wait_for_timeout(400)
        assert pg.get_by_label('boas-vindas').count() == 0
    caso('entrada-5-dicas-planos-e-gratis', entrada)
    caso('entrada-5-dicas-planos-e-gratis', entrada, 'barato')
    b.close()
finally:
    srv.terminate()
print('PEDIDOS PARA FORA (devem ser 0):', len(externos), externos[:5])
print('FALHAS:', falhas)
