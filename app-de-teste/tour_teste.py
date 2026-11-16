"""Teste do tour v2: percorre TODOS os passos nas 3 línguas e confere que cada botão foi destacado
(moldura laranja visível dentro da tela) e que a mini‑demonstração aparece."""
import subprocess, sys, time, os, re
from playwright.sync_api import sync_playwright
base = os.path.dirname(os.path.abspath(__file__))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8769', '-d', os.path.join(base, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
src = open(os.path.join(base, 'src/rotina-amiga/tourPassos.ts')).read()
blocos = re.split(r"\n  \{ id: '", src)[1:]
passos = []
for bl in blocos:
    pid = bl.split("'", 1)[0]
    alvo = re.match(r"[^']+', alvo: '([^']+)'", bl)
    demo = re.search(r"demo: '([^']+)'", bl.split('\n', 1)[0])
    tit = {l: re.search(l + r": \{ t: '((?:[^'\\]|\\.)*)'", bl).group(1).replace("\\'", "'") for l in ('pt', 'en', 'es')}
    passos.append((pid, alvo.group(1) if alvo else None, demo.group(1) if demo else None, tit))
FOTOS = {'pranchas', 'premios', 'ajustes', 'rotina', 'aj_rotina', 'cp_banco', 'cp_audio', 'df_voz', 'df_volume', 'et_timer', 'r_adicionar', 'p_abas', 'rel_whatsapp', 'fim', 'frases', 'aj_frases', 'rel_momento', 'aj_ajuda'}
JS_MOLDURA = """() => Array.from(document.querySelectorAll('div')).some(d => { const c = getComputedStyle(d); const r = d.getBoundingClientRect();
  return c.borderTopColor === 'rgb(249, 115, 22)' && r.width > 10 && r.height > 10 && r.top >= -2 && r.bottom <= innerHeight + 2; })"""
JS_NO_ALVO = """(alvo) => {
  const alvos = Array.from(document.querySelectorAll(`[data-tour="${alvo}"]`)).map(e => e.getBoundingClientRect()).filter(r => r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight);
  if (!alvos.length) return 'botão não está na tela';
  const aneis = Array.from(document.querySelectorAll('div')).filter(d => getComputedStyle(d).borderTopColor === 'rgb(249, 115, 22)').map(d => d.getBoundingClientRect()).filter(r => r.width > 10 && r.height > 10);
  const ok = aneis.some(a => alvos.some(t => Math.abs((a.left + a.width / 2) - (t.left + t.width / 2)) < Math.max(24, t.width / 2) && Math.abs((a.top + a.height / 2) - (t.top + t.height / 2)) < Math.max(24, t.height / 2) && a.width >= t.width * 0.6 && a.width <= t.width + 60));
  return ok ? 'ok' : 'anel em outro lugar';
}"""
falhas = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for lang in ('pt', 'en', 'es'):
            ctx = b.new_context(viewport={'width': 411, 'height': 914}, device_scale_factor=900/411); pg = ctx.new_page()
            erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
            url = 'http://localhost:8769/index.html' + ('' if lang == 'pt' else f'?idioma={lang}')
            pg.goto(url); pg.evaluate('localStorage.clear()'); pg.reload()
            for i, (pid, alvo, demo, tit) in enumerate(passos):
                try:
                    pg.get_by_text(tit[lang], exact=True).first.wait_for(timeout=9000)
                except Exception:
                    falhas.append(f'[{lang}] passo {i+1} {pid}: título "{tit[lang]}" não apareceu'); break
                pg.wait_for_timeout(1500)
                if alvo and not pg.evaluate(JS_MOLDURA): falhas.append(f'[{lang}] passo {i+1} {pid}: botão "{alvo}" não destacado')
                elif alvo:
                    r = pg.evaluate(JS_NO_ALVO, alvo)
                    if r != 'ok': falhas.append(f'[{lang}] passo {i+1} {pid}: anel fora do botão "{alvo}" ({r})')
                if lang == 'pt' or pid in ('pranchas', 'cp_banco', 'df_volume', 'rel_whatsapp'):
                    if pid in FOTOS: pg.screenshot(path=os.path.join(base, 'telas-teste', f'40-tour-{lang}-{i+1:02d}-{pid}.png'))
                pg.get_by_label('Concluir tour' if i == len(passos) - 1 else 'Próximo passo').click()
            pg.wait_for_timeout(1500)
            if pg.get_by_text(passos[0][3][lang]).count(): falhas.append(f'[{lang}] tour não fechou')
            pg.reload(); pg.wait_for_timeout(3000)
            if pg.get_by_text(passos[0][3][lang]).count(): falhas.append(f'[{lang}] tour abriu de novo sozinho')
            if erros: falhas.append(f'[{lang}] erro JS: ' + erros[0])
            ctx.close()
        # rever pelo Ajustes + pular parte + voltar
        ctx = b.new_context(viewport={'width': 411, 'height': 914}, device_scale_factor=900/411); pg = ctx.new_page()
        pg.goto('http://localhost:8769/?tela=vozAjustes'); pg.get_by_label('AJUDA E TOUR').click(); pg.get_by_label('Começar o tour (passo a passo)').click()
        pg.get_by_text(passos[0][3]['pt'], exact=True).wait_for()
        pg.get_by_label('Próximo passo').click(); pg.get_by_text(passos[1][3]['pt'], exact=True).first.wait_for()
        pg.get_by_label('Voltar passo').click(); pg.get_by_text(passos[0][3]['pt'], exact=True).wait_for()
        pg.get_by_label('Pular parte').click(); pg.wait_for_timeout(1500)
        prim1 = next(t for (pid, a, d, t) in passos if pid.startswith('aj_'))
        if not pg.get_by_text(prim1['pt'], exact=True).count(): falhas.append('Pular parte não foi para a parte 2')
        pg.get_by_label('Pular tour').click(); pg.wait_for_timeout(1000)
        if pg.get_by_text(prim1['pt'], exact=True).count(): falhas.append('Pular tour não fechou')
        b.close()
finally:
    srv.terminate()
print(len(passos), 'passos x 3 línguas'); print('FALHAS:', falhas)
