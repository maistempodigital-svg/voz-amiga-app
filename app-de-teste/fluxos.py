# Testes de uso (cliques reais) no navegador.
import subprocess, sys, time, os, re
from playwright.sync_api import sync_playwright, expect
base = os.path.dirname(os.path.abspath(__file__))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8766', '-d', os.path.join(base, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
falhas = []
def caso(nome, f):
    ctx = b.new_context(viewport={'width': 411, 'height': 914}, device_scale_factor=2)
    pg = ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    try:
        f(pg)
        if erros: raise Exception('erro JS: ' + erros[0])
        print('✓', nome)
    except Exception as e:
        falhas.append(nome); print('✗', nome, '->', str(e)[:300])
        pg.screenshot(path=os.path.join(base, 'telas-teste', 'FALHA-' + nome + '.png'))
    ctx.close()
U = 'http://localhost:8766/'
def segurar(pg, loc, ms):
    loc.wait_for(); b0 = loc.bounding_box()
    pg.mouse.move(b0['x'] + b0['width']/2, b0['y'] + b0['height']/2); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up()
def conta(pg):
    pg.get_by_text('Resolva para entrar').wait_for()
    txt = pg.locator('text=/\\d+ \\+ \\d+ =/').inner_text()
    a, bb = map(int, re.findall(r'\d+', txt)[:2])
    for ch in str(a+bb): pg.get_by_label(ch, exact=True).click()
    pg.get_by_label('✓', exact=True).click()
try:
  with sync_playwright() as p:
    b = p.chromium.launch()
    def f1(pg):
        pg.goto(U + '?tela=home'); pg.get_by_text('RODA DE CONVERSA').wait_for()
        pg.get_by_role('button', name='Começar').click()
        pg.get_by_text('FAZENDO AGORA').wait_for()
        expect(pg.get_by_role('button', name='Terminei')).to_be_disabled()
        pg.wait_for_timeout(5600)
        pg.get_by_role('button', name='Terminei').click()
        pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
        pg.get_by_text('ATIVIDADE DE MESA').wait_for()  # próxima etapa aparece sozinha
    caso('crianca-comeca-e-termina', f1)
    def f2(pg):
        pg.goto(U + '?tela=home&cenario=ativa'); pg.get_by_text('ATIVIDADE DE MESA').wait_for()
        assert pg.get_by_role('button', name='Terminei').count() == 0, 'com temporizador não pode ter botão'
    caso('temporizador-sem-botao', f2)
    def f3(pg):
        pg.goto(U + '?tela=home&cenario=ativa&hora=2026-10-19T13:10:00')
        pg.get_by_text('ATIVIDADE DE MESA').wait_for()
        # adulto: segurar 1,5 s -> conta -> concluir
        segurar(pg, pg.get_by_text('FAZENDO AGORA'), 3400)
        conta(pg)
        pg.get_by_role('button', name='Concluir agora (dar estrela)').click()
        pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
    caso('adulto-libera-com-conta', f3)
    def f4(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        assert pg.get_by_label('FRASES', exact=True).count() == 0, 'v9: não tem mais o botão FRASES'
        pg.get_by_text('Toque nas pranchas ou numa frase pronta').wait_for()   # barra sempre na tela
        pg.get_by_label('EU', exact=True).click()   # fala na hora e entra na frase
        pg.get_by_label('Limpar frase').click()
        pg.get_by_label('QUERO', exact=True).click(); pg.get_by_label('ÁGUA', exact=True).click()
        assert pg.get_by_text('ÁGUA', exact=True).count() >= 2, 'palavra não entrou na frase'
        pg.get_by_label('FALAR', exact=True).click()
        pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
    caso('falar-ganha-estrela', f4)
    def f5(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('PRÊMIOS').click()  # v8: abre com 1 toque
        pg.get_by_text('Loja de estrelas').wait_for()
        pg.get_by_role('button', name='Resgatar').first.click()
        pg.get_by_role('button', name='Confirmar').click()
        pg.get_by_text('49').first.wait_for()
    caso('loja-compra', f5)
    def f6(pg):
        pg.goto(U + '?tela=loja'); pg.get_by_text('Loja de estrelas').wait_for()
        pg.get_by_role('button', name='Resgatar').nth(1).click(); pg.get_by_role('button', name='Confirmar').click()
        pg.get_by_text('Falta pouco...').first.wait_for()
    caso('loja-espera', f6)
    def f7(pg):
        pg.goto(U + '?tela=ajustes&plano=completo'); pg.get_by_text('Rotina atual').wait_for()
        pg.get_by_role('button', name='próxima').click(); pg.get_by_text('VESTIR PIJAMA', exact=False).count()
        pg.get_by_role('button', name='anterior').click()
        pg.get_by_role('button', name='Adicionar tarefa').click()
        pg.get_by_placeholder('Nome da tarefa').fill('Guardar brinquedos')
        pg.get_by_role('button', name='Salvar').click()
        pg.get_by_text('Guardar brinquedos').wait_for()
    caso('pais-cria-tarefa', f7)
    def f8(pg):
        pg.goto(U + '?tela=ajustes'); pg.get_by_text('Rotina atual').wait_for()
        for _ in range(3): pg.get_by_role('button', name='próxima').click()
        pg.get_by_role('button', name='Editar').first.click()
        pg.get_by_placeholder('Nome da tarefa').fill('Chegada na escola')
        pg.get_by_role('button', name='Salvar').click(); pg.get_by_text('Chegada na escola').wait_for()
    caso('pais-edita-tarefa', f8)
    def f9(pg):
        pg.goto(U + '?tela=abas&plano=completo'); pg.get_by_placeholder('Nome da aba').fill('Terapia')
        pg.get_by_role('button', name='Criar', exact=True).click(); pg.get_by_text('Terapia').first.wait_for()
    caso('pais-cria-aba', f9)
    def f10(pg):
        pg.goto(U + '?tela=opcoes'); pg.get_by_text('Saldo da criança').wait_for()
        pg.get_by_role('button', name='mais').first.click(); pg.get_by_text('55', exact=True).wait_for()
        pg.get_by_role('radio', name='Menina').click(); pg.get_by_role('radio', name='Menina').wait_for()
        pg.get_by_label('Nome da criança (aparece no relatório)').fill('Pedro')
        assert pg.get_by_text('Botão "Como estou?"').count() == 0, 'Como estou saiu do menu'
        pg.get_by_role('radio', name='Esperar para liberar').click(); pg.get_by_text('5 min', exact=True).wait_for()
    caso('pais-da-estrela', f10)
    def f11(pg):
        pg.goto(U + '?tela=metas&plano=completo'); pg.get_by_text('Falar 30 frases na semana').wait_for()
        assert pg.get_by_text('Falar 5 frases hoje').count() == 0, 'metas diárias vêm desligadas (não enjoar)'
    caso('metas-abre', f11)
    def f12(pg):
        pg.goto(U + '?tela=relatorio&plano=completo'); pg.get_by_text('Relatório geral').first.wait_for()
        for r in ['Hoje', '7 dias', '15 dias', '30 dias', '2 meses', '3 meses', '6 meses', '12 meses']:
            pg.get_by_role('tab', name=r, exact=True).click(); pg.get_by_text('✨ Resumo', exact=True).wait_for()
        pg.get_by_text('🗓️ Mês a mês', exact=True).wait_for()
        # datas livres: de/até com ‹ › e « »
        pg.get_by_role('tab', name='Escolher datas').click(); pg.get_by_label('De data').wait_for()
        pg.get_by_label('De -1', exact=True).click(); pg.get_by_label('De -1', exact=True).click()
        pg.get_by_text('Datas escolhidas (9 dias)', exact=False).first.wait_for()
        pg.get_by_label('Até -1', exact=True).click(); pg.get_by_text('Datas escolhidas (8 dias)', exact=False).first.wait_for()
        # v14.2: relatório geral só (sem nomes de profissionais) + "o que o app percebeu"
        assert pg.get_by_role('tab', name='Fonoaudiologia', exact=True).count() == 0, 'sem escolher profissional'
        pg.get_by_text('Palavras faladas', exact=True).first.wait_for(); pg.get_by_text('Tempo com o app aberto').first.wait_for()
        pg.get_by_text('📅 Rotina e autonomia').wait_for(); pg.get_by_text('🗣️ Comunicação').first.wait_for()
        pg.get_by_label('Enviar no WhatsApp').click()
    caso('relatorio-periodos', f12)
    def f13(pg):
        pg.goto(U + '?tela=vozAjustes'); pg.get_by_label('ROTINA AMIGA').click(); pg.get_by_text('Rotina atual').wait_for()
        pg.get_by_role('button', name='Concluir').click(); pg.wait_for_timeout(600)
        assert pg.get_by_text('Rotina atual').count() == 0
    caso('voz-ajustes-abre-rotina', f13)
    def f15(pg):
        pg.goto(U + '?tela=home&plano=completo'); pg.get_by_label('PRÊMIOS').click()
        pg.get_by_text('Loja de estrelas').wait_for()
        pg.get_by_role('tab', name='metas').click(); pg.get_by_text('Falar 30 frases na semana').wait_for()
        pg.get_by_role('tab', name='conquistas').click(); pg.get_by_text('Primeira tarefa').wait_for()
        assert pg.get_by_label('METAS', exact=True).count() == 0, 'não pode ter botão METAS separado'
    caso('premios-metas-conquistas-juntas', f15)
    def f16(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('AJUSTES', exact=True).click(); pg.wait_for_timeout(400)
        assert pg.get_by_text('Ajustes e Opções').count() == 0
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 1600); pg.wait_for_timeout(300)
        assert pg.get_by_text('Resolva para entrar').count() == 0, '2s não pode abrir'
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); conta(pg); pg.get_by_text('Ajustes e Opções').wait_for()
    caso('ajustes-segurando', f16)
    def f17(pg):
        pg.goto(U + '?tela=home'); segurar(pg, pg.get_by_label('TRAVAR APP'), 3300); conta(pg); pg.get_by_label('DESTRAVAR').wait_for()
        segurar(pg, pg.get_by_label('DESTRAVAR'), 3300); conta(pg); pg.get_by_label('TRAVAR APP').wait_for()
    caso('travar-e-destravar', f17)
    def f18(pg):
        pg.goto(U + '?tela=home'); pill = pg.get_by_label(re.compile('ESCOLA|Escola'))
        segurar(pg, pill.first, 1600); pg.wait_for_timeout(300)
        assert pg.get_by_text('Resolva para entrar').count() == 0, '2s não pode abrir'
        segurar(pg, pill.first, 3300); conta(pg); pg.get_by_text('Rotina atual').wait_for()
    caso('rotina-segurar-3s-abre-config', f18)
    def f19(pg):
        pg.goto(U + '?tela=home&hora=2026-10-19T10:00:00'); ad = pg.get_by_label('Anúncio: 👑 Plano Completo')
        segurar(pg, ad, 3000); pg.wait_for_timeout(300)
        assert pg.get_by_text('Resolva para entrar').count() == 0, '3 s não pode abrir o anúncio'
        segurar(pg, ad, 5300); pg.get_by_text('Resolva para entrar').wait_for()
    caso('anuncio-segurando', f19)
    def f20(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('TECLADO').click()
        for ch in 'QUERO IR':
            pg.get_by_label('ESPAÇO' if ch == ' ' else f'tecla {ch}', exact=True).click()
        assert pg.get_by_label('texto do teclado').inner_text().startswith('QUERO IR')
        pg.get_by_label('FALAR TECLADO').click(); pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
    caso('teclado-fala', f20)
    def f21(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).wait_for()
        # cada prancha na sua categoria: EU em Pessoas, QUERO em Ações, ÁGUA em Descrição (e todas na GERAL)
        pg.get_by_label('PESSOAS', exact=True).click(); pg.get_by_label('EU', exact=True).wait_for()
        assert pg.get_by_label('QUERO', exact=True).count() == 0 and pg.get_by_label('ÁGUA', exact=True).count() == 0
        pg.get_by_label('DESCRIÇÃO', exact=True).click(); pg.get_by_label('ÁGUA', exact=True).wait_for()
        assert pg.get_by_label('EU', exact=True).count() == 0
        pg.get_by_label('GERAL', exact=True).click()
        assert pg.get_by_label('QUERO', exact=True).count() == 1 and pg.get_by_label('ÁGUA', exact=True).count() == 1 and pg.get_by_label('EU', exact=True).count() == 1
    caso('trocar-aba', f21)
    def f30(pg):
        pg.goto(U + '?tela=ajustes&limites=' + '{"tarefasPorRotina":3}'); pg.get_by_text('Rotina atual').wait_for()
        pg.get_by_role('button', name='Adicionar tarefa').click()
        pg.get_by_text('Isto faz parte do Plano Completo', exact=False).wait_for(); pg.get_by_text('Na versão gratuita cada rotina tem até 3 tarefas', exact=False).wait_for()
        pg.get_by_role('button', name='Me leve até o plano').click(); pg.get_by_text('Minha Assinatura').first.wait_for()
    caso('gratis-limita-tarefa-e-abre-planos', f30)
    def f31(pg):
        pg.goto(U + '?tela=home&plano=completo&hora=2026-10-19T10:00:00'); pg.get_by_label('EU', exact=True).wait_for(); pg.wait_for_timeout(800)
        assert pg.get_by_label('Anúncio: 👑 Plano Completo').count() == 0, 'assinante não vê anúncio'
    caso('assinante-sem-anuncio', f31)
    def f32(pg):
        pg.goto(U + '?tela=ajustes&cenario=zero'); pg.get_by_role('button', name='Criar a primeira rotina').click()
        pg.get_by_text('Criar rotina').first.wait_for(); pg.get_by_role('button', name='Banheiro').click()
        pg.get_by_text('Rotina atual').wait_for(); pg.get_by_text('BANHEIRO').first.wait_for()
        pg.get_by_role('button', name='Nova rotina').click(); pg.get_by_text('Isto faz parte do Plano Completo', exact=False).wait_for()
    caso('criar-primeira-rotina-e-limite', f32)
    def f33(pg):
        pg.goto(U + '?tela=relatorio'); pg.get_by_label('Registrar momento (crise)').click()  # v8: dentro do relatório
        pg.get_by_label('Intensidade 4').click(); pg.get_by_label('Barulho').click(); pg.get_by_label('Lugar calmo').click()
        pg.get_by_role('button', name='Salvar registro').click(); pg.get_by_text('Histórico (1)').wait_for()
        pg.get_by_text('Barulho', exact=False).first.wait_for()
    caso('registrar-crise', f33)
    def f34(pg):
        # v11: sem Favoritos e sem "Como estou?"; abre na GERAL com todas as pranchas coloridas pela categoria
        pg.goto(U + '?tela=home'); pg.get_by_label('GERAL', exact=True).wait_for()
        assert pg.get_by_label('FAVORITOS', exact=True).count() == 0 and pg.get_by_label('Como estou?').count() == 0
        for n in ('EU', 'QUERO', 'ÁGUA'): pg.get_by_label(n, exact=True).wait_for()
        pg.get_by_label('PESSOAS', exact=True).click(); pg.wait_for_timeout(300)
        assert pg.get_by_label('ÁGUA', exact=True).count() == 0, 'aba Pessoas mostra só pessoas'
    caso('aba-geral', f34)
    def f35(pg):
        pg.goto(U + '?tela=relatorio'); pg.get_by_text('Versão gratuita: resumo dos últimos 7 dias', exact=False).wait_for()
        pg.get_by_role('tab', name='30 dias', exact=True).click(); pg.get_by_text('Isto faz parte do Plano Completo', exact=False).wait_for()
    caso('relatorio-gratis-7-dias', f35)
    def f36(pg):
        pg.goto(U + '?tela=vozAjustes'); pg.get_by_label('AJUDA E TOUR').click(); pg.get_by_label('Buscar na ajuda').fill('teclado')
        pg.get_by_role('button', name='Teclado').first.click(); pg.get_by_text('teclado do aplicativo em tela cheia', exact=False).first.wait_for()
    caso('ajuda-busca', f36)
    def f37(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).click(); pg.get_by_label('Limpar frase').click(); pg.wait_for_timeout(300)
        pg.goto(U + '?tela=editar&plano=completo'); pg.get_by_text('Pranchas do Voz para esta tarefa').wait_for()
    caso('tarefa-liga-aba-do-voz', f37)
    def f38(pg):
        # frases prontas já na tela como botões (sem abas, sem rolar, sem janela): monta, fala e ganha estrela
        pg.goto(U + '?tela=home'); pg.get_by_label('frase Eu estou feliz').wait_for()
        assert pg.get_by_role('tab', name='Sentir').count() == 0, 'não pode ter abas de grupos'
        # v14.2: todas numa linha só que desliza para o lado (a página não rola para o lado)
        ys = {round(pg.get_by_label('frase ' + f, exact=True).bounding_box()['y']) for f in ('Eu quero água', 'Oi', 'Eu não quero', 'Onde está a mamãe?', 'Eu quero comer')}
        assert len(ys) == 1, ('sugestões numa linha só', ys)
        assert pg.evaluate('document.scrollingElement.scrollWidth <= window.innerWidth + 1'), 'página rolando para o lado'
        pg.get_by_label('frase Eu quero comer', exact=True).click()
        pg.wait_for_timeout(500); assert pg.get_by_text('QUERO', exact=True).count() >= 2, 'não montou palavra por palavra'
        assert pg.get_by_label(re.compile(r'^selo \+')).count() == 0, 'só fala no FALAR'
        pg.get_by_label('FALAR', exact=True).click(); pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
    caso('frases-prontas', f38)
    def ir_home(pg):
        pg.get_by_label('Voltar', exact=True).last.click(); pg.get_by_text('Ajustes e Opções').wait_for(); pg.get_by_label('Fechar').first.click()
    def f39(pg):
        # v14.2: o ajuste "frases prontas" saiu dos Ajustes (as sugestões continuam na tela da criança)
        pg.goto(U + '?tela=vozAjustes'); pg.get_by_label('DEFINIÇÕES').first.wait_for()
        assert pg.get_by_label('FRASES PRONTAS').count() == 0
    caso('frases-prontas-sem-ajuste', f39)
    def f41(pg):
        # voltar leva para a tela anterior (não para o início)
        pg.goto(U + '?tela=vozAjustes'); pg.get_by_label('GERIR ABAS').click(); pg.get_by_text('Gerir Abas').first.wait_for()
        pg.get_by_label('Voltar', exact=True).last.click(); pg.get_by_text('Ajustes e Opções').wait_for()
        pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('grade de pacotes').wait_for()
        pg.get_by_label('Voltar', exact=True).last.click(); pg.get_by_text('Ajustes e Opções').wait_for()
        pg.get_by_label('RELATÓRIO GERAL').click(); pg.get_by_label('Registrar momento (crise)').click(); pg.get_by_text('Salvar registro').wait_for()
        pg.get_by_label('Voltar', exact=True).last.click(); pg.get_by_label('Registrar momento (crise)').wait_for()
    caso('voltar-tela-anterior', f41)
    def f42(pg):
        # menu: TRAVAR, AJUSTES, PRÊMIOS, TECLADO, CRIAR PRANCHA; abas GERAL…AÇÕES numa linha; embaixo só rotina/anúncio
        pg.goto(U + '?tela=home'); pg.get_by_label('GERAL', exact=True).wait_for()
        ya = pg.get_by_label('GERAL', exact=True).bounding_box()['y']; yp = pg.get_by_label('EU', exact=True).bounding_box()['y']
        yc = pg.get_by_label('CRIAR PRANCHA', exact=True).bounding_box()['y']; yt = pg.get_by_label('AJUSTES', exact=True).bounding_box()['y']
        assert yt < ya < yp and abs(yc - yt) < 4, (yt, ya, yc, yp)
        ys = {round(pg.get_by_label(n, exact=True).bounding_box()['y']) for n in ('GERAL', 'PESSOAS', 'EXPRESSÃO SOCIAL', 'DESCRIÇÃO', 'AÇÕES')}
        assert len(ys) == 1, ('abas numa linha só', ys)
        assert pg.get_by_text('MODO FOCO').count() == 0
        # atalho CRIAR PRANCHA: segurar 3 s + continha
        segurar(pg, pg.get_by_label('CRIAR PRANCHA', exact=True), 3300); conta(pg); pg.get_by_text('Imagem da Prancha').wait_for()
        pg.get_by_label('Fechar').first.click(); pg.get_by_label('GERAL', exact=True).wait_for()   # X volta para onde estava
    caso('menu-em-cima', f42)
    def f45(pg):
        # teclado em tela cheia, nada cortado embaixo, X vermelho para sair, sugestões numa linha
        pg.goto(U + '?tela=home'); pg.get_by_label('TECLADO', exact=True).click(); pg.wait_for_timeout(1200)  # espera a animação
        x = pg.get_by_label('Fechar teclado').bounding_box() if pg.get_by_label('Fechar teclado').count() else pg.get_by_role('button', name='Fechar').last.bounding_box()
        f = pg.get_by_label('FALAR TECLADO').bounding_box()
        assert x['y'] < 140 and f['y'] + f['height'] <= 914, ('tela cheia sem corte', x, f)
        for c in 'QU': pg.get_by_label('tecla ' + c, exact=True).click()
        sug = pg.locator('[aria-label^="sugestão "]'); sug.first.wait_for()
        ys = {round(sug.nth(i).bounding_box()['y']) for i in range(sug.count())}
        assert len(ys) == 1, ('sugestões numa linha só', ys)
        assert sug.first.bounding_box()['height'] >= 40, 'sugestões maiores'
    caso('teclado-tela-cheia', f45)
    def f43(pg):
        # começa vazio: só ADICIONAR PRANCHA; criou a 1ª prancha => o botão some. Padrão: 4 lado a lado
        # v14.3: começa vazio com uma DICA apontando para o CRIAR PRANCHA lá em cima (sem botão repetido embaixo)
        pg.goto(U + '?tela=home&vazio=1'); pg.get_by_label('dica criar prancha lá em cima').wait_for()
        assert pg.get_by_label('EU', exact=True).count() == 0 and pg.get_by_label('ADICIONAR PRANCHA').count() == 0
        segurar(pg, pg.get_by_label('CRIAR PRANCHA', exact=True), 3300); conta(pg); pg.get_by_text('Imagem da Prancha').wait_for()
        pg.get_by_placeholder('Ex: Obrigado').fill('Suco'); pg.get_by_label('Salvar Prancha').click()
        pg.get_by_label(re.compile('^suco$', re.I)).wait_for(); pg.wait_for_timeout(300)
        assert pg.get_by_label('dica criar prancha lá em cima').count() == 0, 'a dica continuou'
    caso('adicionar-some', f43)
    def f43b(pg):
        pg.goto(U + '?tela=home'); ys = [round(pg.get_by_label(n, exact=True).bounding_box()['y']) for n in ('EU', 'QUERO', 'ÁGUA')]
        assert len(set(ys)) == 1, ('4 por linha: as 3 cabem na mesma linha', ys)
    caso('quatro-colunas', f43b)
    def f44(pg):
        # mensagem inteligente: ÁGUA vira "EU QUERO ÁGUA"; dá para tirar palavra; só fala no FALAR
        pg.goto(U + '?tela=home'); pg.get_by_label('ÁGUA', exact=True).click()
        pg.get_by_label('palavra Eu', exact=True).wait_for(); pg.get_by_label('palavra quero', exact=True).wait_for()
        assert pg.get_by_label(re.compile(r'^selo \+')).count() == 0, 'falou sem apertar FALAR'
        pg.get_by_label('palavra Eu', exact=True).click(); pg.wait_for_timeout(200)
        assert pg.get_by_label('palavra Eu', exact=True).count() == 0, 'não tirou a palavra'
        pg.get_by_label('FALAR', exact=True).click(); pg.get_by_label(re.compile(r'^selo \+\d+★')).wait_for()
        # no teclado
        pg.goto(U + '?tela=home'); pg.get_by_label('TECLADO', exact=True).click()
        for c in 'SUCO': pg.get_by_label('tecla ' + c, exact=True).click()
        pg.get_by_label('mensagem inteligente Eu quero SUCO').click()
        assert 'Eu quero SUCO' in pg.get_by_label('texto do teclado').inner_text()
    caso('mensagem-inteligente', f44)
    def f22(pg):
        # pai aumenta o tempo para 5 s: 3,3 s não abre mais, 5,3 s abre
        pg.goto(U + '?tela=voz:definicoes'); pg.get_by_label('Segurar 5 segundos').click(); pg.wait_for_timeout(300)
        pg.get_by_label('Fechar').click(); pg.wait_for_timeout(500); segurar(pg, pg.get_by_label('AJUSTES', exact=True), 3300); pg.wait_for_timeout(300)
        assert pg.get_by_text('Resolva para entrar').count() == 0, '3 s não pode abrir com 5 s escolhido'
        segurar(pg, pg.get_by_label('AJUSTES', exact=True), 5300); conta(pg); pg.get_by_text('Ajustes e Opções').wait_for()
    caso('tempo-segurar-ajustavel', f22)
    def f23(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).first.click()
        pg.get_by_label('sugestão QUERO').click(); fr = pg.locator('[aria-label^="frase "]'); fr.first.wait_for()
        fr.first.click(); pg.wait_for_timeout(300); pg.get_by_label('FALAR', exact=True).click()
        pg.get_by_text('Toque nas pranchas ou numa frase pronta').wait_for()  # falou (só no FALAR) e limpou
    caso('sugestoes-de-frases', f23)
    V = U + '?tela=vozAjustes'
    def g1(pg):
        pg.goto(U + '?tela=voz:criar'); pg.get_by_text('Imagem da Prancha').wait_for()
        pg.get_by_placeholder('Ex: Obrigado').fill('Suco')
        pg.get_by_label('Banco').click(); pg.get_by_text('🧃').first.click()
        pg.get_by_label('Salvar Prancha').click(); pg.get_by_text('Prancha criada em Descrição!').wait_for()   # categoria automática
        if pg.get_by_label('GERAL', exact=True).count() == 0: pg.get_by_label('Fechar').locator('visible=true').last.click()
        pg.get_by_label('GERAL', exact=True).click(); pg.get_by_label('SUCO').wait_for()
    caso('criar-prancha', g1)
    def g1b(pg):
        pg.goto(U + '?tela=voz:criar'); pg.get_by_text('Imagem da Prancha').wait_for()
        pg.get_by_label('Aba de destino').click(); pg.get_by_text('Criar nova aba').click()
        pg.get_by_placeholder('Ex: Emoções').fill('Escola'); pg.get_by_label('Criar', exact=True).click()
        pg.get_by_placeholder('Ex: Obrigado').fill('Lápis'); pg.get_by_label('Salvar Prancha').click(); pg.get_by_text('Prancha criada em Escola!').wait_for()
    caso('criar-prancha-com-aba-nova', g1b)
    def g2(pg):
        pg.goto(V); pg.get_by_label('EDITAR PRANCHAS').click(); pg.get_by_text('Editar: toque na prancha.').wait_for()
        pg.get_by_label('QUERO', exact=True).click(); pg.get_by_text('Editar Prancha').wait_for()
        pg.get_by_placeholder('Ex: Obrigado').fill('Eu quero'); pg.get_by_label('Salvar Prancha').click()
        pg.get_by_label('EU QUERO', exact=True).wait_for(); pg.get_by_label('Sair do modo').click(); pg.wait_for_timeout(300)
        assert pg.get_by_text('Editar: toque na prancha.').count() == 0
    caso('editar-prancha', g2)
    def g3(pg):
        # v14: EXCLUIR vem escondido; os pais ligam em Mais funções › Permitir apagar pranchas
        pg.goto(V); pg.get_by_label('EDITAR PRANCHAS').wait_for(); assert pg.get_by_label('EXCLUIR PRANCHAS').count() == 0, 'apagar devia vir desligado'
        pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_label('assunto Proteger as pranchas').click(); pg.get_by_label('chave apagarPranchas').click()
        for _ in range(3):
            if pg.get_by_label('EXCLUIR PRANCHAS').count(): break
            pg.get_by_label('Voltar').locator('visible=true').last.click(); pg.wait_for_timeout(300)
        pg.get_by_label('EXCLUIR PRANCHAS').click(); pg.get_by_label('ÁGUA', exact=True).click()
        pg.get_by_label('Excluir', exact=True).click(); pg.get_by_text('Prancha excluída.').wait_for()
        assert pg.get_by_label('ÁGUA', exact=True).count() == 0
    caso('excluir-prancha', g3)
    def g4(pg):
        pg.goto(V); pg.get_by_label('GERIR ABAS').click(); pg.get_by_label('Nova aba').click()
        pg.get_by_placeholder('Ex: Emoções').fill('Comidas'); pg.get_by_label('cor Laranja').click(); pg.get_by_label('Criar', exact=True).click()
        pg.get_by_text('Comidas', exact=True).wait_for(); pg.wait_for_timeout(800); pg.get_by_label('editar Comidas').click()
        pg.get_by_placeholder('Ex: Emoções').locator('visible=true').fill('Lanches'); pg.get_by_label('Salvar', exact=True).click(); pg.get_by_text('Lanches').wait_for()
        pg.get_by_label('subir Lanches').click()
    caso('gerir-abas', g4)
    def g5(pg):
        # v14.3: EDITAR ABAS saiu dos Ajustes (repetia o GERIR ABAS); editar a aba é pelo GERIR ABAS
        pg.goto(V)
        pg.get_by_label('GERIR ABAS').click(); pg.get_by_label('editar Pessoas').click()
        pg.get_by_placeholder('Ex: Emoções').locator('visible=true').fill('Gente'); pg.get_by_label('Salvar', exact=True).click(); pg.get_by_text('Gente').first.wait_for()
    caso('editar-abas-pelo-gerir', g5)
    def g6(pg):
        pg.goto(V); pg.get_by_label('BAIXAR PACOTES').click(); pg.get_by_label('pacote Bebidas', exact=True).click()  # v14.8: pacote grátis
        pg.get_by_label('Transferir Pacote').click(); pg.get_by_text('Pacote "Bebidas" transferido!').wait_for()
        pg.get_by_label('Fechar').first.click(); pg.get_by_text('Ajustes e Opções').wait_for(); pg.get_by_label('Fechar').first.click(); pg.get_by_label('BEBIDAS', exact=True).click()  # X volta 1 tela de cada vez; pg.get_by_label('BANANA').wait_for()
    caso('baixar-pacote', g6)
    def g7(pg):
        pg.goto(V); pg.get_by_label('MINHA ASSINATURA').click(); pg.get_by_text('Plano Completo').wait_for(); pg.get_by_label('Voltar').click()
        pg.get_by_label('SOBRE A CAA').click(); pg.get_by_text('Mito quebrado').wait_for()
        pg.get_by_label('Curso informativo sobre CAA').click(); pg.get_by_text('Bem-vindo(a)!').wait_for(); pg.get_by_label('Próximo').click(); pg.get_by_text('Como o aplicativo ajuda?').wait_for()
    caso('assinatura-sobre-curso', g7)
    def g8(pg):
        pg.goto(V); pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_text('Idioma da Aplicação').wait_for()
        pg.get_by_label('Automático').click(); pg.get_by_text('Manual: 4 colunas.').wait_for()
        pg.get_by_label('Sugestões').click(); pg.get_by_text('DESATIVADAS').first.wait_for()
        pg.get_by_label('Teclado avançado').click(); pg.get_by_label('Bloquear app').click()
        pg.get_by_label('🔊 Escolher e testar a voz').click(); pg.get_by_label('▶ Testar voz').click(); pg.goto(V); pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_text('Idioma da Aplicação').wait_for()
        pg.get_by_label('Idioma').click(); pg.get_by_text('🇺🇸 English').click(); pg.wait_for_timeout(400)
        pg.get_by_label('Fechar').first.click(); pg.get_by_label('Fechar').first.click(); pg.get_by_label('TECLADO').click(); pg.get_by_label('tecla 1', exact=True).wait_for()
    caso('definicoes', g8)
    def g9(pg):
        pg.goto(V); pg.get_by_label('DEFINIÇÕES').click(); pg.get_by_label('Bloquear app').click(); pg.get_by_label('Fechar').first.click(); pg.get_by_label('Fechar').first.click()
        pg.wait_for_timeout(300); r = pg.evaluate("window.__rotinaVoltar()"); assert r is True
        pg.get_by_text('App bloqueado').wait_for()
    caso('bloquear-app', g9)
    def g10(pg):
        pg.goto(V); pg.get_by_label('SAIR DA CONTA').click(); pg.get_by_text('Sair da conta?').wait_for(); pg.get_by_label('Cancelar').click()
        pg.get_by_label('SUPORTE (SEG-SEX 08H-16H)').click(); pg.get_by_label('CONHEÇA NOSSO INSTAGRAM!').click()
    caso('suporte-instagram-sair', g10)
    def g11(pg):
        pg.goto(U + '?tela=home'); pg.get_by_label('EU', exact=True).click()
        pg.get_by_label(re.compile('^sugestão')).first.wait_for()
        assert pg.get_by_text('IDEIAS DE FRASES', exact=False).count() == 0, 'só um bloco de sugestões'
    caso('sugestoes-na-frase', g11)
    def g12(pg):
        pg.goto(U + '?tela=home&vazio=1'); segurar(pg, pg.get_by_label('CRIAR PRANCHA', exact=True), 3300); conta(pg); pg.get_by_text('Imagem da Prancha').wait_for()
    caso('adicionar-prancha-adulto', g12)
    def g13(pg):
        pg.goto(V); pg.get_by_label('ROTINA AMIGA').click(); pg.get_by_text('Rotina atual').wait_for()
        assert pg.get_by_role('tab', name=re.compile('Relatórios')).count() == 0, 'relatório não fica mais no Rotina'
        pg.get_by_label('Concluir').click(); pg.wait_for_timeout(500)
        pg.get_by_label('RELATÓRIO GERAL').click(); pg.get_by_text('Relatório geral').first.wait_for()
    caso('relatorio-geral-nos-ajustes-do-voz', g13)
    def g14(pg):
        # instalação nova: pede login primeiro (com Firebase) e, sem Firebase, começa sem "Tarefa de teste" e com o tour
        pg.goto(U + 'index.html'); pg.evaluate('localStorage.clear()'); pg.reload()
        pg.get_by_label('escolher idioma').wait_for(timeout=20000); pg.get_by_role('button', name='Continuar').click()
        pg.get_by_text('Entrar na conta').wait_for(timeout=20000)
        assert pg.get_by_text('Agora não').count() == 0, 'login da abertura não pode ser pulado'
        pg.goto(U + 'index.html?semFirebase=1'); pg.evaluate('localStorage.clear()'); pg.reload()
        pg.get_by_label('Pular tour').click(); pg.wait_for_timeout(600)
        assert pg.get_by_text('TAREFA DE TESTE').count() == 0, 'não pode vir tarefa de teste'
        pg.get_by_label('Anúncio: 👑 Plano Completo').wait_for()
    caso('instalacao-nova-login-e-sem-tarefa-de-teste', g14)
    def f14(pg):
        pg.goto(U + '?tela=home&hora=2026-10-19T10:00:00&cenario=x'); pg.wait_for_timeout(1500)
    caso('sem-erros-js', f14)
    b.close()
finally:
    srv.terminate()
print('FALHAS:', falhas)
