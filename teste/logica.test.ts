// Testes das regras (rodar: npx tsx teste/logica.test.ts). Sem React — só lógica pura.
import assert from 'node:assert/strict';
import * as A from '../rotina-amiga/logica/acoes';
import * as RG from '../rotina-amiga/logica/relatorioGeral';
import { sortearConta } from '../rotina-amiga/logica/conta';
import { completarPalavra, sugerir } from '../rotina-amiga/logica/sugestoes';
import { avaliarFrase, conquistas, progressoMeta, sequenciaDias } from '../rotina-amiga/logica/estrelas';
import { intervalo, resumo, serie, ultimosDias } from '../rotina-amiga/logica/relatorio';
import { abaDoMomento, podeTerminar, proximaEtapa, tarefasDoDia } from '../rotina-amiga/logica/rotina';
import { chaveDia, formatarHorario, paraMin } from '../rotina-amiga/logica/tempo';
import { estadoPadrao, modelosRotina } from '../rotina-amiga/padroes';
import { LIMITES_COMPLETO, LIMITES_GRATIS, lerLimitesFirebase, limitesEfetivos } from '../rotina-amiga/logica/plano';
import * as P from '../rotina-amiga/logica/profissional';
import * as FP from '../rotina-amiga/logica/frasesProntas';
import { imagemSegura, linkSeguro } from '../rotina-amiga/logica/plano';
import * as RG from '../rotina-amiga/logica/relatorioGeral';
import { paletaDaCor, hexParaHsv, hsvParaHex } from '../rotina-amiga/paleta';

let n = 0;
const ok = (nome: string, f: () => void) => { f(); n++; console.log('✓', nome); };
const em = (iso: string) => new Date(iso);
const seg = em('2026-10-19T13:10:00'); // segunda
const T = seg.getTime();

ok('tempo', () => {
  assert.equal(paraMin('07:30'), 450);
  assert.equal(paraMin('24:00'), undefined);
  assert.equal(paraMin(''), undefined);
  assert.equal(formatarHorario('730'), '07:30');
  assert.equal(formatarHorario('1300'), '13:00');
  assert.equal(chaveDia(seg), '2026-10-19');
});

ok('tarefas do dia em ordem de horário; escola só em dia útil', () => {
  const s = estadoPadrao('pt', true);
  assert.deepEqual(tarefasDoDia(s, 'escola', seg).map((t) => t.id), ['e1', 'e2', 'e3', 'e4']);
  assert.equal(tarefasDoDia(s, 'escola', em('2026-10-18T13:00:00')).length, 0); // domingo
});

ok('rotina do momento e próxima etapa (só uma)', () => {
  const s = estadoPadrao('pt', true);
  assert.equal(abaDoMomento(s, seg)?.id, 'escola');
  assert.equal(abaDoMomento(s, em('2026-10-19T07:05:00'))?.id, 'manha');
});

ok('manhã pendente continua aparecendo até ser feita', () => {
  const s = estadoPadrao('pt', true);
  // às 10h a manhã (07:00) ainda tem pendências => aparece
  assert.equal(abaDoMomento(s, em('2026-10-19T10:00:00'))?.id, 'manha');
  // manhã feita => nada às 10h (próxima rotina começa 12:30) => anúncio
  const k = '2026-10-19';
  const s2 = { ...s, concluidas: { [k]: { manha: ['m1', 'm2', 'm3'] } } };
  // sem rotina com horário agora => entra a aba sem horário (Banheiro); sem ela => nada (anúncio)
  assert.equal(abaDoMomento(s2, em('2026-10-19T10:00:00'))?.id, 'banheiro');
  const s3 = { ...s2, tarefas: s2.tarefas.filter((t) => t.abaId !== 'banheiro') };
  assert.equal(abaDoMomento(s3, em('2026-10-19T10:00:00')), undefined);
  assert.equal(proximaEtapa(s3, em('2026-10-19T10:00:00')), undefined);
  // 30 min antes do almoço já aparece
  assert.equal(abaDoMomento(s2, em('2026-10-19T12:05:00'))?.id, 'tarde');
});

ok('aba sem horário: prioridade mais baixa; modo foco foi removido (v8) e não muda nada', () => {
  const s = estadoPadrao('pt', true);
  assert.notEqual(abaDoMomento(s, em('2026-10-19T22:30:00'))?.id, 'banheiro');
  const f = A.mudarConfig(s, { modoFoco: 'banheiro' });
  assert.equal(proximaEtapa(f, seg)?.tarefa.id, proximaEtapa(s, seg)?.tarefa.id);
});

ok('travar até o horário', () => {
  let s = estadoPadrao('pt', true);
  s = { ...s, concluidas: { '2026-10-19': { escola: ['e1'] } } };
  s = A.salvarTarefa(s, { ...s.tarefas.find((t) => t.id === 'e2')!, travarAteHorario: true });
  assert.equal(proximaEtapa(s, seg)?.bloqueadaAte, '13:30');
  assert.equal(proximaEtapa(s, em('2026-10-19T13:30:00'))?.bloqueadaAte, undefined);
  assert.equal(proximaEtapa(A.mudarConfig(s, { travarHorario: false }), seg)?.bloqueadaAte, undefined);
});

ok('temporizador: criança não termina antes; fim do tempo conclui com estrela', () => {
  let s = estadoPadrao('pt', true);
  s = A.iniciarTarefa(s, 'escola', 'e3', T); // 30 min
  assert.equal(podeTerminar(s, T + 60000), false);
  assert.equal(podeTerminar(s, T + 30 * 60000), true);
  assert.equal(proximaEtapa(s, seg)?.ativa?.tarefaId, 'e3');
  const r = A.concluirTarefa(s, T + 30 * 60000);
  assert.equal(r.estrelas, 1);
  assert.equal(r.estado.estrelas, 1);
  assert.equal(r.estado.tarefaAtiva, undefined);
  assert.deepEqual(r.estado.concluidas['2026-10-19'].escola, ['e3']);
  assert.equal(r.estado.log.at(-1)?.segundos, 1800);
});

ok('sem temporizador: mínimo de segundos', () => {
  let s = estadoPadrao('pt', true);
  s = A.iniciarTarefa(s, 'escola', 'e1', T);
  assert.equal(podeTerminar(s, T + 2000), false);
  assert.equal(podeTerminar(s, T + 5000), true);
});

ok('adulto pula: sem estrela, registrado como liberada', () => {
  let s = estadoPadrao('pt', true);
  s = A.iniciarTarefa(s, 'escola', 'e3', T);
  const r = A.concluirTarefa(s, T + 1000, false);
  assert.equal(r.estado.estrelas, 0);
  assert.equal(r.estado.log.at(-1)?.tipo, 'tarefa_liberada');
});

ok('rotina completa dá bônus', () => {
  let s = estadoPadrao('pt', true);
  for (const id of ['e1', 'e2', 'e3']) s = A.concluirTarefa(A.iniciarTarefa(s, 'escola', id, T), T + 5000).estado;
  const r = A.concluirTarefa(A.iniciarTarefa(s, 'escola', 'e4', T), T + 5000);
  assert.equal(r.rotinaCompleta, true);
  assert.equal(r.estrelas, 1 + s.config.bonusRotina);
  assert.equal(r.estado.estrelas, 4 + s.config.bonusRotina);
  assert.equal(proximaEtapa(r.estado, seg)?.aba.id, 'tarde'); // escola feita => almoço (12:30) ainda pendente
});

ok('fala: não premia apertar sem parar', () => {
  let s = estadoPadrao('pt', true);
  assert.equal(avaliarFrase(s, ['água'], T).motivo, 'uma_palavra');
  assert.equal(avaliarFrase(s, ['água', 'água', 'água'], T).motivo, 'uma_palavra');
  let r = A.registrarFala(s, ['eu', 'quero', 'água'], T);
  assert.equal(r.estrelas, 1 + 2); // 1 + palavras novas (máx 2)
  s = r.estado;
  assert.equal(avaliarFrase(s, ['quero', 'brincar'], T + 5000).motivo, 'intervalo');
  assert.equal(avaliarFrase(s, ['água', 'quero', 'eu'], T + 60000).motivo, 'repetida');
  r = A.registrarFala(s, ['quero', 'brincar'], T + 60000);
  assert.equal(r.estrelas, 2); // brincar é nova
  s = r.estado;
  // limite diário
  s = A.mudarConfig(s, { limiteFalaDia: 6, intervaloFalaSeg: 0 });
  r = A.registrarFala(s, ['mamãe', 'vem', 'aqui'], T + 120000);
  assert.equal(r.estrelas, 1); // só resta 1 do limite
  assert.equal(avaliarFrase(r.estado, ['papai', 'vem'], T + 180000).motivo, 'limite');
  // desligado
  assert.equal(avaliarFrase(A.mudarConfig(s, { premiarFala: false }), ['a', 'b'], T).motivo, 'desligado');
});

ok('metas: progresso e resgate uma vez por período', () => {
  let s = estadoPadrao('pt', true);
  s = A.mudarConfig(s, { intervaloFalaSeg: 0 });
  const frases = [['a', 'b'], ['c', 'd'], ['e', 'f'], ['g', 'h'], ['i', 'j']];
  frases.forEach((f, i) => { s = A.registrarFala(s, f, T + i * 1000).estado; });
  const g1 = s.metas.find((m) => m.id === 'g1')!;
  const p = progressoMeta(s, g1, seg);
  assert.equal(p.completa, true);
  const antes = s.estrelas;
  const r = A.resgatarMeta(s, 'g1', T + 10000);
  assert.equal(r.estado.estrelas, antes + g1.premio);
  assert.equal(A.resgatarMeta(r.estado, 'g1', T + 20000).estrelas, 0);
  // no dia seguinte a meta zera
  assert.equal(progressoMeta(r.estado, g1, em('2026-10-20T09:00:00')).feito, 0);
});

ok('loja: compra direta e com espera', () => {
  let s = { ...estadoPadrao('pt', true), estrelas: 12 };
  assert.equal(A.comprar(s, 'r3', T).ok, false); // 30 > 12
  let c = A.comprar(s, 'r1', T); // sobremesa 5
  assert.equal(c.estado.estrelas, 7);
  s = { ...estadoPadrao('pt', true), estrelas: 12 };
  c = A.comprar(s, 'r2', T); // ver desenho 10, espera 5 min
  assert.equal(c.espera, true);
  assert.equal(c.estado.estrelas, 12); // só desconta no fim
  assert.equal(A.confirmarEspera(c.estado, T + 60000), c.estado); // ainda não
  const f = A.confirmarEspera(c.estado, T + 5 * 60000);
  assert.equal(f.estrelas, 2);
  assert.equal(f.esperaAtiva, undefined);
  assert.equal(A.desistirEspera(c.estado).estrelas, 12);
});

ok('pais: ajustar estrelas nunca negativo', () => {
  const s = estadoPadrao('pt', true);
  assert.equal(A.ajustarEstrelas(s, -5).estrelas, 0);
  assert.equal(A.ajustarEstrelas(s, 3).estrelas, 3);
});

ok('excluir aba remove tarefas e desliga foco', () => {
  let s = A.mudarConfig(estadoPadrao('pt', true), { modoFoco: 'escola' });
  s = A.excluirAba(s, 'escola');
  assert.equal(s.tarefas.some((t) => t.abaId === 'escola'), false);
  assert.equal(s.config.modoFoco, 'none');
});

ok('sanear dados quebrados não derruba o app', () => {
  const p = estadoPadrao('pt', true);
  assert.deepEqual(A.sanear(null, p), p);
  const x = A.sanear({ estrelas: -3, tarefas: 'x', config: { senhaPais: false }, tarefaAtiva: { tarefaId: 'nao-existe' } }, p);
  assert.equal(x.estrelas, 0);
  assert.equal(x.tarefas.length, p.tarefas.length);
  assert.equal(x.config.senhaPais, false);
  assert.equal(x.config.travarHorario, true);
  assert.equal(x.tarefaAtiva, undefined);
});

ok('relatório: dia/semana/mês/ano e séries rotina+voz', () => {
  let s = A.mudarConfig(estadoPadrao('pt', true), { intervaloFalaSeg: 0 });
  s = A.concluirTarefa(A.iniciarTarefa(s, 'escola', 'e1', T), T + 60000).estado;
  s = A.registrarFala(s, ['eu', 'quero'], T).estado;
  s = A.registrarPrancha(s, 'eu', T);
  for (const p of ['dia', 'semana', 'mes', 'ano'] as const) {
    const it = intervalo(p, seg, 'pt');
    const r = resumo(s, it.inicio, it.fim);
    assert.equal(r.tarefas, 1, p);
    assert.equal(r.frases, 1, p);
    assert.equal(r.pranchas, 1, p);
    const sr = serie(s, it);
    assert.equal(sr.reduce((a, x) => a + x.rotina, 0), 1, p);
    assert.equal(sr.reduce((a, x) => a + x.voz, 0), 1, p);
  }
  assert.equal(intervalo('semana', seg).faixas.length, 7);
  assert.equal(intervalo('ano', seg).faixas.length, 12);
  assert.equal(intervalo('mes', seg).faixas.reduce((a, f) => a + (f.fim - f.inicio), 0) / 86400000, 31);
  const u = ultimosDias(s, 7, seg);
  assert.equal(u[6].tarefas, 1);
  assert.equal(u[6].rotulo, 'Seg 19');
});

ok('conquistas e sequência', () => {
  let s = estadoPadrao('pt', true);
  assert.equal(conquistas(s).filter((c) => c.ganha).length, 0);
  for (let d = 0; d < 3; d++) {
    const t = T - d * 86400000;
    for (const id of ['m1', 'm2', 'm3']) s = A.concluirTarefa(A.iniciarTarefa(s, 'manha', id, t), t + 5000).estado;
  }
  assert.equal(sequenciaDias(s, seg), 3);
  const c = conquistas(s, 'pt', seg);
  assert.ok(c.find((x) => x.id === 'c4')!.ganha);
  assert.ok(c.find((x) => x.id === 'c3')!.ganha);
});

ok('paleta: mesma do Rotina e cores personalizadas', () => {
  assert.equal(hsvParaHex(...Object.values(hexParaHsv('#2563EB')) as [number, number, number]), '#2563EB');
  const p = paletaDaCor('#FACC15');
  assert.notEqual(p.onAccent, '#FFFFFF'); // cor clara => texto escuro
  assert.equal(paletaDaCor('#1E3A8A').onAccent, '#FFFFFF');
});

ok('idiomas: dados iniciais em en/es', () => {
  assert.equal(estadoPadrao('en', true).tarefas[0].titulo, 'Wake up');
  assert.equal(estadoPadrao('es', true).abas[2].nome, 'Noche');
});

ok('começa do zero e uma tarefa sem horário aparece e some ao terminar', () => {
  let s = estadoPadrao('pt');
  assert.equal(s.tarefas.length, 0);
  assert.equal(s.abas.length, 0, 'começa sem nenhuma rotina');
  assert.equal(proximaEtapa(s, seg), undefined);
  s = A.salvarAba(s, modelosRotina('pt')[0]);
  s = A.salvarTarefa(s, { id: 'x', abaId: 'manha', titulo: 'Teste', icone: 'brincar', travarAteHorario: false, alarme: false, duracaoMin: 0, dias: [0, 1, 2, 3, 4, 5, 6] });
  assert.equal(proximaEtapa(s, seg)?.tarefa.id, 'x');
  s = A.concluirTarefa(A.iniciarTarefa(s, 'manha', 'x', T), T + 6000).estado;
  assert.equal(proximaEtapa(s, seg), undefined);
});

ok('tempo de uso só com app aberto, dividido por dia', () => {
  let s = estadoPadrao('pt');
  s = A.somarUso(s, em('2026-10-19T23:59:00').getTime(), em('2026-10-20T00:01:00').getTime());
  assert.equal(s.uso!['2026-10-19'], 60);
  assert.equal(s.uso!['2026-10-20'], 60);
});

ok('relatório geral: períodos, ativo/inativo, mês a mês e texto', () => {
  let s = A.mudarConfig(estadoPadrao('pt', true), { intervaloFalaSeg: 0 });
  const hoje = em('2026-10-19T13:00:00');
  for (const p of ['7d', '15d', '1m', '2m', '3m', '6m', '12m'] as const) {
    const j = RG.janela(p, hoje);
    assert.ok(j.faixas.length >= 4 && j.faixas.length <= 16, p + ' faixas ' + j.faixas.length);
    assert.equal(j.faixas[0].inicio, j.inicio); assert.equal(j.faixas.at(-1)!.fim, j.fim);
  }
  assert.equal(RG.janela('7d', hoje).dias, 7);
  // só Voz em setembro; Voz + Rotina em outubro
  const set = em('2026-09-10T10:00:00').getTime();
  s = A.registrarFala(s, ['eu', 'quero', 'água'], set).estado;
  s = A.registrarPrancha(s, 'água', set);
  s = A.registrarFala(s, ['quero', 'brincar'], T).estado;
  s = A.concluirTarefa(A.iniciarTarefa(s, 'escola', 'e1', T), T + 60000).estado;
  s = A.somarUso(s, T, T + 600000);
  const j = RG.janela('2m', hoje);
  const n = RG.numeros(s, j.inicio, j.fim);
  assert.equal(n.frases, 2); assert.equal(n.palavrasFaladas, 5); assert.equal(n.tarefas, 1); assert.equal(n.segundosUso, 600);
  assert.ok(n.vozAtivo && n.rotinaAtivo);
  const ms = RG.meses(s, j);
  const setembro = ms.find((m) => m.rotulo.startsWith('Set'))!; const outubro = ms.find((m) => m.rotulo.startsWith('Out'))!;
  assert.ok(setembro.voz && !setembro.rotina, 'setembro só voz');
  assert.ok(outubro.voz && outubro.rotina, 'outubro os dois');
  const txt = RG.textoProfissional(s, '2m', hoje);
  assert.ok(txt.includes('Palavras faladas: 5') && txt.includes('Tarefas concluídas: 1') && txt.includes('só Voz'), txt);
  // só Rotina numa janela curta
  const n7 = RG.numeros(s, RG.janela('7d', hoje).inicio, RG.janela('7d', hoje).fim);
  assert.ok(n7.vozAtivo && n7.rotinaAtivo);
  assert.equal(RG.variacao(10, 5), 100); assert.equal(RG.variacao(5, 0), undefined);
});

ok('continha do adulto: só de mais, resultado até 15', () => {
  let maior = 0;
  for (let i = 0; i < 5000; i++) { const c = sortearConta(); maior = Math.max(maior, c.r); assert.ok(c.r <= 15 && c.r === c.a + c.b && c.a >= 2 && c.b >= 1, JSON.stringify(c)); }
  assert.ok(maior >= 13, 'usa a faixa toda');
});

ok('sugestões inteligentes: aprende com a criança + modelo + pranchas, 3 línguas', () => {
  const vocab = ['EU', 'QUERO', 'ÁGUA', 'COMER', 'BRINCAR', 'AJUDA'];
  const vazio = sugerir({ frase: [], historico: [], vocab, idioma: 'pt', hora: 9 });
  assert.ok(vazio.palavras.includes('EU'), JSON.stringify(vazio));
  assert.ok(vazio.frases.some((f) => f.join(' ') === 'BOM DIA'), 'bom dia de manhã');
  const eu = sugerir({ frase: ['EU'], historico: [], vocab, idioma: 'pt' });
  assert.equal(eu.palavras[0], 'QUERO');
  assert.ok(eu.frases.length >= 1 && eu.frases.every((f) => f[0] === 'EU' && f.length >= 2), JSON.stringify(eu.frases));
  // aprende: a criança sempre fala "quero brincar"
  const hist = [['quero', 'brincar'], ['eu', 'quero', 'brincar'], ['quero', 'brincar']];
  const q = sugerir({ frase: ['QUERO'], historico: hist, vocab, idioma: 'pt' });
  assert.equal(q.palavras[0], 'BRINCAR'); assert.ok(!q.palavras.includes('QUERO'));
  assert.equal(q.frases[0].join(' '), 'QUERO BRINCAR');
  const en = sugerir({ frase: ['I'], historico: [], vocab: [], idioma: 'en' });
  assert.equal(en.palavras[0].toUpperCase(), 'WANT');
  const es = sugerir({ frase: ['yo'], historico: [], vocab: [], idioma: 'es', hora: 21 });
  assert.equal(es.palavras[0].toUpperCase(), 'QUIERO');
  assert.ok(sugerir({ frase: [], historico: [], vocab: [], idioma: 'es', hora: 21 }).frases.some((f) => f.join(' ').toUpperCase() === 'BUENAS NOCHES'));
  // teclado: completa a palavra
  const c = completarPalavra('ag', { anteriores: ['eu', 'quero'], historico: [], vocab, idioma: 'pt' });
  assert.equal(c[0], 'ÁGUA');
  assert.ok(completarPalavra('bri', { anteriores: [], historico: hist, vocab, idioma: 'pt' }).includes('BRINCAR'));
});

ok('plano: gratuito x completo e limites vindos do Firebase', () => {
  assert.deepEqual(limitesEfetivos(false), LIMITES_GRATIS);
  assert.deepEqual(limitesEfetivos(true, { rotinas: 1 }), LIMITES_COMPLETO, 'assinante ignora limites do gratuito');
  assert.equal(LIMITES_GRATIS.rotinas, 1); assert.equal(LIMITES_GRATIS.tarefasPorRotina, 5); assert.equal(LIMITES_GRATIS.premios, 1);
  assert.equal(LIMITES_GRATIS.criacaoRapida, false); assert.equal(LIMITES_GRATIS.travarApp, false); assert.deepEqual(LIMITES_GRATIS.pacotesGratis, ['BEBIDAS']);
  assert.equal(LIMITES_COMPLETO.criacaoRapida, true); assert.equal(LIMITES_COMPLETO.travarApp, true);
  assert.equal(lerLimitesFirebase({ travarApp: 'true' }).travarApp, true);
  assert.equal(LIMITES_GRATIS.anuncios, true); assert.equal(LIMITES_COMPLETO.anuncios, false);
  const fb = lerLimitesFirebase({ rotinas: '2', premios: 10, temporizador: 'true', relatorioCompleto: false, lixo: 1 });
  assert.deepEqual(fb, { rotinas: 2, premios: 10, temporizador: true, relatorioCompleto: false });
  assert.equal(limitesEfetivos(false, fb).rotinas, 2);
  assert.equal(limitesEfetivos(false, fb).tarefasPorRotina, 5);
  assert.deepEqual(lerLimitesFirebase(null), {});
  assert.deepEqual(lerLimitesFirebase({ rotinas: -3 }), { rotinas: 1 }, 'valor inválido volta ao padrão');
});

ok('novos registros: incompleta, teclado, crise, sentimento, sinal, quem concluiu, cancelada, notas', () => {
  let s = estadoPadrao('pt', true);
  s = A.registrarFraseIncompleta(s, ['eu', 'quero'], T);
  s = A.registrarFraseIncompleta(s, [], T); // vazia não registra
  s = A.registrarTeclado(s, { letras: 12, apagadas: 3, palavras: ['oi'] }, T);
  s = A.registrarTeclado(s, { letras: 0, apagadas: 0 }, T);
  s = A.registrarCrise(s, { quando: T, intensidade: 9, duracaoMin: 12, gatilhos: ['barulho'], ajudou: ['calmo'], nota: ' saída da escola ' });
  s = A.registrarSentimento(s, 'feliz', T);
  s = A.registrarSinal(s, 'tentou_sair', T);
  s = A.registrarPrancha(s, 'oi', T, 'Expressão social');
  const tipos = s.log.map((e) => e.tipo);
  assert.deepEqual(tipos, ['frase_incompleta', 'teclado', 'crise', 'sentimento', 'sinal', 'prancha']);
  const crise = s.log.find((e) => e.tipo === 'crise')!;
  assert.equal(crise.intensidade, 5, 'intensidade limitada a 5'); assert.equal(crise.nota, 'saída da escola');
  assert.equal(s.log.at(-1)!.aba, 'Expressão social');
  s = A.excluirRegistro(s, T, 'crise');
  assert.ok(!s.log.some((e) => e.tipo === 'crise'));
  // quem concluiu
  let r = A.concluirTarefa(A.iniciarTarefa(s, 'banheiro', 'b1', T), T + 60000, true, 'adulto');
  assert.equal(r.estado.log.find((e) => e.tipo === 'tarefa_fim')!.quem, 'adulto');
  r = A.concluirTarefa(A.iniciarTarefa(s, 'banheiro', 'b2', T), T + 60000);
  assert.equal(r.estado.log.find((e) => e.tipo === 'tarefa_fim')!.quem, 'crianca');
  const c = A.cancelarTarefa(A.iniciarTarefa(s, 'banheiro', 'b3', T), T + 5000);
  assert.equal(c.log.at(-1)!.tipo, 'tarefa_cancelada'); assert.equal(c.tarefaAtiva, undefined);
  // fala com tempo e sugestões
  const f = A.registrarFala(s, ['eu', 'quero', 'água'], T, { ms: 4200, sug: 9 });
  const ev = f.estado.log.at(-1)!;
  assert.equal(ev.ms, 4200); assert.equal(ev.sug, 3, 'sug nunca passa do total de palavras');
  // notas
  let n2 = A.adicionarNota(s, '  dormiu mal  ', T);
  assert.equal(n2.notas!.at(-1)!.texto, 'dormiu mal');
  n2 = A.excluirNota(n2, T); assert.equal(n2.notas!.length, 0);
  assert.equal(A.adicionarNota(s, '   ').notas?.length || 0, 0);
});

ok('tendência e projeção', () => {
  assert.equal(P.tendencia([1, 2, 3, 4, 5, 6], 21).direcao, 'sobe');
  assert.equal(P.tendencia([6, 5, 4, 3, 2, 1], 21).direcao, 'cai');
  assert.equal(P.tendencia([5, 5, 5, 5], 20).direcao, 'estavel');
  assert.equal(P.tendencia([0, 0, 0], 0).direcao, 'sem');
  assert.equal(P.tendencia([0, 3], 3).direcao, 'sem', 'poucos pontos');
  const t = P.tendencia([2, 4, 6, 8], 20);
  assert.ok(t.projecao! > 20, 'projeção acima do atual quando sobe');
});

ok('relatório para profissionais: métricas, áreas, alertas, 3 línguas, texto e PDF', () => {
  const hoje = em('2026-10-19T20:00:00');
  const H = hoje.getTime();
  const dia = 86400000;
  let s = A.mudarConfig(estadoPadrao('pt', true), { intervaloFalaSeg: 0, limiteFalaDia: 999, nomeCrianca: 'Pedro' });
  // período anterior (8-14 dias atrás): pouco uso, 1 crise
  s = A.registrarFala(s, ['eu', 'quero'], H - 10 * dia).estado;
  s = A.registrarCrise(s, { quando: H - 9 * dia, intensidade: 4, duracaoMin: 20, gatilhos: ['barulho'], ajudou: ['abraco'] });
  // período atual (últimos 7 dias): mais frases, frases maiores, sugestões, incompletas, teclado, sentimentos, 3 crises
  for (let k = 0; k < 6; k++) s = A.registrarFala(s, ['eu', 'quero', 'água', 'gelada'], H - k * dia - 3600000, { ms: 5000, sug: k % 2 }).estado;
  s = A.registrarFala(s, ['oi', 'mamãe'], H - 2 * dia).estado;
  s = A.registrarFala(s, ['não', 'quero'], H - 2 * dia + 1000).estado;
  s = A.registrarFala(s, ['ajuda', 'dor'], H - 1 * dia).estado;
  s = A.registrarFala(s, ['ajuda'], H - 1 * dia + 2000).estado;
  for (let k = 0; k < 4; k++) s = A.registrarFraseIncompleta(s, ['eu'], H - dia + k * 60000);
  s = A.registrarTeclado(s, { letras: 20, apagadas: 5, palavras: ['oi', 'mae'] }, H - dia);
  s = A.registrarSentimento(s, 'feliz', H - dia); s = A.registrarSentimento(s, 'triste', H - 2 * dia);
  for (let k = 1; k <= 3; k++) s = A.registrarCrise(s, { quando: H - k * dia, intensidade: 3, duracaoMin: 10, gatilhos: ['mudanca', 'barulho'], ajudou: ['calmo'], nota: k === 1 ? 'no mercado' : undefined });
  for (let k = 0; k < 10; k++) s = A.registrarPrancha(s, 'água', H - dia + k * 500); // rajada
  s = A.concluirTarefa(A.iniciarTarefa(s, 'banheiro', 'b1', H - dia), H - dia + 60000).estado;
  s = A.concluirTarefa(A.iniciarTarefa(s, 'banheiro', 'b2', H - dia), H - dia + 60000, true, 'adulto').estado;
  s = A.somarUso(s, H - dia, H - dia + 1800000);
  s = A.adicionarNota(s, 'Começou fono nova', H - 2 * dia);

  const m = P.metricas(s, H - 7 * dia + 1, H + dia, hoje);
  assert.ok(m.mlu > 2.5, 'tamanho médio da frase ' + m.mlu);
  assert.equal(m.incompletas, 4); assert.equal(m.sequenciasIncompletas, 1);
  assert.equal(m.letras, 20); assert.equal(m.apagadas, 5);
  assert.equal(m.crises.length, 3); assert.deepEqual(m.gatilhos.map((g) => g.n), [3, 3]);
  assert.equal(m.sozinha, 1); assert.equal(m.comAjuda, 1); assert.equal(m.autonomia, 50);
  assert.ok(m.funcoes.pedir >= 6 && m.funcoes.social >= 1 && m.funcoes.recusar >= 1 && m.funcoes.ajuda >= 2, JSON.stringify(m.funcoes));
  assert.equal(m.rajadas, 1);
  assert.equal(m.independencia, Math.round((7 / 10) * 100), 'frases sem sugestão');
  assert.equal(m.negativos, 50);

  for (const idioma of ['pt', 'en', 'es'] as const) {
    for (const area of ['geral', 'fono', 'to', 'psico', 'escola'] as const) {
      const r = P.gerarRelatorio(s, '7d', area, idioma, hoje);
      assert.ok(r.destaques.length >= 1 && r.secoes.length >= 2, `${idioma}/${area}`);
      const txt = P.relatorioTexto(r);
      assert.ok(txt.includes('Pedro'));
      const html = P.relatorioHtml(r);
      assert.ok(html.startsWith('<!doctype html>') && html.includes('</html>') && !html.includes('undefined'), `${idioma}/${area} html`);
      assert.ok(!txt.includes('undefined') && !txt.includes('NaN'), `${idioma}/${area} texto: ${txt}`);
    }
  }
  const pt = P.gerarRelatorio(s, '7d', 'geral', 'pt', hoje);
  assert.ok(pt.alertas.some((a) => a.includes('crise')), 'alerta de crises subindo: ' + pt.alertas.join(' | '));
  assert.ok(pt.alertas.some((a) => a.includes('não faladas')), 'alerta de frases incompletas');
  assert.ok(pt.notas.some((n) => n.texto === 'Começou fono nova'));
  const fono = P.gerarRelatorio(s, '7d', 'fono', 'pt', hoje);
  assert.ok(fono.secoes.some((x) => x.id === 'teclado') && !fono.secoes.some((x) => x.id === 'crises'), 'fono foca em comunicação');
  const psico = P.gerarRelatorio(s, '7d', 'psico', 'pt', hoje);
  assert.equal(psico.secoes[0].id, 'crises');
  const lim = P.gerarRelatorio(s, '12m', 'psico', 'pt', hoje, { limitado: true });
  assert.deepEqual(lim.secoes.map((x) => x.id), ['percebeu', 'uso', 'comunicacao', 'evolucao', 'rotina']); assert.equal(lim.notas.length, 0);
  const en = P.relatorioTexto(P.gerarRelatorio(s, '7d', 'geral', 'en', hoje));
  assert.ok(en.includes('Summary') && en.includes('Crisis'));
  const es = P.relatorioTexto(P.gerarRelatorio(s, '7d', 'geral', 'es', hoje));
  assert.ok(es.includes('Resumen') && es.includes('crisis'));
  // vazio não quebra
  const vazio = P.gerarRelatorio(estadoPadrao('pt'), '12m', 'geral', 'pt', hoje);
  assert.ok(vazio.destaques[0].includes('poucos registros'));
});

ok('frases prontas: cores da comunicação, 3 línguas, limite do gratuito', () => {
  assert.equal(FP.categoriaDaPalavra('Eu'), 'pessoa');
  assert.equal(FP.categoriaDaPalavra('quero'), 'verbo');
  assert.equal(FP.categoriaDaPalavra('água'), 'coisa');
  assert.equal(FP.categoriaDaPalavra('triste'), 'descricao');
  assert.equal(FP.categoriaDaPalavra('Obrigado'), 'social');
  assert.equal(FP.categoriaDaPalavra('não'), 'negacao');
  assert.equal(FP.categoriaDaPalavra('Onde'), 'pergunta');
  assert.equal(FP.categoriaDaPalavra('I'), 'pessoa'); assert.equal(FP.categoriaDaPalavra('want'), 'verbo');
  assert.equal(FP.categoriaDaPalavra('¿Dónde'), 'pergunta'); assert.equal(FP.categoriaDaPalavra('quiero'), 'verbo');
  assert.deepEqual(FP.categoriasDaFrase(['Bom', 'dia']), ['social', 'social']);
  assert.deepEqual(FP.categoriasDaFrase(['Me', 'ajuda', 'por', 'favor']), ['pessoa', 'verbo', 'social', 'social']);
  assert.equal(FP.corDaPalavra('quero').fundo, FP.CORES_FITZGERALD.verbo.fundo);
  for (const id of ['pt', 'en', 'es'] as const) {
    const todas = FP.FRASES_PADRAO[id];
    assert.ok(todas.length >= 30, id);
    assert.equal(new Set(todas.map((f) => f.id)).size, todas.length, 'ids únicos');
    const gratis = FP.frasesEmUso(id, undefined, false);
    for (const g of FP.GRUPOS) assert.equal(gratis.filter((f) => f.grupo === g.id).length, FP.POR_GRUPO_GRATIS, `${id} ${g.id}`);
    assert.equal(FP.frasesEmUso(id, undefined, true).length, todas.length);
  }
  const minhas = [{ id: 'x', grupo: 'pedir' as const, palavras: ['Eu', 'quero', 'suco'] }];
  assert.deepEqual(FP.frasesEmUso('pt', minhas, true), minhas);
  assert.deepEqual(FP.palavrasDoTexto('  Eu   quero  suco '), ['Eu', 'quero', 'suco']);
  const fb = lerLimitesFirebase({ frasesPersonalizadas: 'true' });
  assert.equal(fb.frasesPersonalizadas, true);
  assert.equal(LIMITES_GRATIS.frasesPersonalizadas, false); assert.equal(LIMITES_COMPLETO.frasesPersonalizadas, true);
});

ok('mensagem inteligente: uma palavra vira frase', () => {
  assert.deepEqual(FP.formularFrase('Água', 'pt'), ['Eu', 'quero', 'Água']);
  assert.deepEqual(FP.formularFrase('brincar', 'pt'), ['Eu', 'quero', 'brincar']);
  assert.deepEqual(FP.formularFrase('fome', 'pt'), ['Eu', 'estou', 'com', 'fome']);
  assert.deepEqual(FP.formularFrase('feliz', 'pt'), ['Eu', 'estou', 'feliz']);
  assert.deepEqual(FP.formularFrase('banheiro', 'pt'), ['Eu', 'quero', 'ir', 'ao', 'banheiro']);
  for (const w of ['Eu', 'quero', 'não', 'Oi', 'mamãe', 'Onde']) assert.equal(FP.formularFrase(w, 'pt'), undefined, w);
  assert.deepEqual(FP.formularFrase('water', 'en'), ['I', 'want', 'water']);
  assert.deepEqual(FP.formularFrase('play', 'en'), ['I', 'want', 'to', 'play']);
  assert.deepEqual(FP.formularFrase('hungry', 'en'), ['I', 'am', 'hungry']);
  assert.deepEqual(FP.formularFrase('agua', 'es'), ['Yo', 'quiero', 'agua']);
  assert.deepEqual(FP.formularFrase('hambre', 'es'), ['Tengo', 'hambre']);
  assert.equal(FP.formularFrase('duas palavras', 'pt'), undefined);
});

ok('segurança: links e imagens só seguros; textos com limite; relatório escapado', () => {
  for (const u of ['https://vozamiga.com/x?a=1', 'mailto:grupoamigapp@gmail.com', 'https://wa.me/?text=oi%20tudo', 'https://wa.me/?text=' + 'a'.repeat(9000), 'whatsapp://send?text=oi']) assert.equal(linkSeguro(u), u, u);
  for (const u of ['http://site.com', 'tel:190', 'sms:123?body=x', 'intent://x#Intent;end', 'market://details?id=x', 'javascript:alert(1)', 'file:///data/data/x', 'content://x', ' ', '', 'https://a b', 'https://' + 'a'.repeat(2100), 'https://x\u0000y', 'https://x\u0007', 'mailto:a@b.com?cc=c%40d.com&bcc=e%40f.com&body=x', 'mailto:a%40b.com,c%40d.com@x', 'mailto:a@b?attach=/data/data/x', 'https://wa.me/?text=' + 'a'.repeat(13000), 'whatsapp://x', 'whatsapp://send?text=x&phone=55']) assert.equal(linkSeguro(u), undefined, u);
  assert.equal(linkSeguro(123), undefined); assert.equal(linkSeguro(undefined), undefined);
  assert.equal(imagemSegura('https://x.com/a.png'), 'https://x.com/a.png');
  for (const u of ['http://x.com/a.png', 'file:///sdcard/a.png', 'content://media/1', 'data:text/html;base64,PHNjcmlwdD4=']) assert.equal(imagemSegura(u), undefined, u);
  const s0 = estadoPadrao('pt');
  const s1 = A.adicionarNota(s0, 'x'.repeat(5000), 1);
  assert.equal(s1.notas![0].texto.length, A.LIMITE_NOTA);
  const s2 = A.registrarCrise(s0, { quando: 1, intensidade: 3, duracaoMin: 5, gatilhos: [], ajudou: [], nota: 'y'.repeat(5000) });
  assert.equal(s2.log[s2.log.length - 1].nota!.length, A.LIMITE_NOTA);
  const lido = A.sanear({ ...s0, tarefas: [{ ...(estadoPadrao('pt', true).tarefas[0]), titulo: 'z'.repeat(999) }], notas: [{ t: 1, texto: 'w'.repeat(9999) }] }, s0);
  assert.equal(lido.tarefas[0].titulo.length, A.LIMITE_NOME); assert.equal(lido.notas![0].texto.length, A.LIMITE_NOTA);
  const s3 = A.adicionarNota(A.mudarConfig(s0, { nomeCrianca: '"><img src=x onerror=alert(1)>' }), `<script>alert('x')</script>"`, Date.now());
  const html = P.relatorioHtml(P.gerarRelatorio(s3, '7d', 'geral', 'pt', new Date()));
  assert.ok(!/<script>alert|<img src=x/i.test(html), 'texto do usuário virou HTML');
  assert.ok(html.includes('&lt;script&gt;') || html.includes('&lt;img'), 'deveria aparecer escapado');
  assert.equal(limitesEfetivos('false' as unknown as boolean).relatorioCompleto, false, 'texto "false" não pode liberar o plano');
  assert.equal(limitesEfetivos(1 as unknown as boolean).anuncios, true);
  assert.equal(limitesEfetivos(true).anuncios, false);
  const n = A.sanear({ ...s0, config: { ...s0.config, nomeCrianca: 'n'.repeat(100000) } }, s0);
  assert.equal(n.config.nomeCrianca!.length, 40);
});

ok('prêmios: na hora, esperar para liberar e intervalo entre prêmios (vai para o relatório)', () => {
  const base = { ...estadoPadrao('pt'), estrelas: 50 };
  const r1 = base.recompensas[0];
  const t0 = new Date(2026, 10, 15, 10, 0).getTime();
  // na hora
  const a = A.comprar(base, r1.id, t0);
  assert.ok(a.ok && !a.espera); assert.equal(a.estado.estrelas, 50 - r1.custo);
  // esperar N minutos
  const e0 = A.mudarConfig(base, { premioModo: 'espera', premioMin: 3 });
  const e1 = A.comprar(e0, r1.id, t0);
  assert.ok(e1.ok && e1.espera); assert.equal(e1.estado.estrelas, 50, 'ainda não descontou');
  assert.equal(A.confirmarEspera(e1.estado, t0 + 60000), e1.estado, 'não libera antes da hora');
  const e2 = A.confirmarEspera(e1.estado, t0 + 3 * 60000);
  assert.equal(e2.estrelas, 50 - r1.custo);
  const ult = e2.log[e2.log.length - 1]; assert.equal(ult.tipo, 'resgate'); assert.equal(ult.esperouMin, 3);
  const d = A.desistirEspera(e1.estado, t0 + 60000);
  assert.equal(d.log[d.log.length - 1].tipo, 'espera_desistiu'); assert.equal(d.estrelas, 50);
  // intervalo entre prêmios
  const i0 = A.mudarConfig(base, { premioModo: 'intervalo', premioMin: 10 });
  const i1 = A.comprar(i0, r1.id, t0); assert.ok(i1.ok);
  assert.equal(A.faltaProximoPremio(i1.estado, t0 + 60000), 9 * 60000);
  assert.equal(A.comprar(i1.estado, r1.id, t0 + 60000).ok, false, 'segundo prêmio cedo demais');
  assert.ok(A.comprar(i1.estado, r1.id, t0 + 10 * 60000).ok, 'depois do intervalo pode');
  // minutos fora da faixa são corrigidos
  assert.equal(A.minutosPremio(A.mudarConfig(base, { premioMin: 9999 })), 120);
  assert.equal(A.minutosPremio(A.mudarConfig(base, { premioMin: -3 })), 1);
  const lido = A.sanear({ ...base, config: { ...base.config, premioModo: 'hack' as never } }, base);
  assert.equal(lido.config.premioModo, 'imediato');
  // relógio adiantado / dado adulterado não trava a loja além da regra; mudar a regra zera o intervalo
  const trav = { ...i1.estado, proximoPremioEm: 9e15 };
  assert.equal(A.faltaProximoPremio(trav, t0), 10 * 60000);
  assert.equal(A.mudarConfig(trav, { premioMin: 3 }).proximoPremioEm, undefined);
  const sujo = A.sanear({ ...base, recompensas: [{ ...r1, custo: -1000, esperaMin: 'abc' as never }], esperaAtiva: { recompensaId: r1.id, inicio: 0, fim: 'x' as never } }, base);
  assert.equal(sujo.recompensas[0].custo, 1); assert.equal(sujo.recompensas[0].esperaMin, 0); assert.equal(sujo.esperaAtiva, undefined);
  // itens corrompidos no armazenamento: descarta só o item ruim, não derruba o app
  const lixo = A.sanear({ ...base, recompensas: [null, r1], tarefas: [null], abas: [null], notas: [null, { t: 1, texto: 'ok' }], metas: [null, { ...base.metas[0], premio: '5' }], log: [null, { t: 'x', tipo: 'frase' }, { t: 5, tipo: 'frase', palavras: [5, null, 'oi'] }], estrelas: 1e400 } as never, base);
  assert.equal(lixo.recompensas.length, 1); assert.equal(lixo.notas!.length, 1); assert.equal(lixo.log.length, 1);
  assert.deepEqual(lixo.log[0].palavras, ['5', 'oi']); assert.equal(lixo.estrelas, 0); assert.equal(lixo.metas[0].premio, 5);
  RG.numeros(lixo, 0, Date.now());
  // campos com tipo errado (dado adulterado) não travam a tela inicial nem o relatório
  const t1 = base.tarefas.length ? base.tarefas[0] : estadoPadrao('pt', true).tarefas[0];
  const hoje = new Date(); const ch = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const ruim = A.sanear({ ...estadoPadrao('pt', true), tarefas: [{ ...t1, horario: 730, dias: ['x', 2, 9] }], concluidas: { [ch]: { [t1.abaId]: 5 } },
    config: { ...base.config, limiteFalaDia: 'x', bonusRotina: 'x', premiarFala: 'sim' },
    log: [{ t: Date.now(), tipo: 'crise', gatilhos: 'barulho', ajudou: 7, intensidade: '4' }, { t: Date.now(), tipo: 'frase', palavras: ['a'], novas: '5' }] } as never, base);
  assert.equal(ruim.tarefas[0].horario, undefined); assert.deepEqual(ruim.tarefas[0].dias, [2]);
  assert.equal(typeof ruim.config.limiteFalaDia, 'number'); assert.equal(typeof ruim.config.premiarFala, 'boolean');
  proximaEtapa(ruim, new Date()); abaDoMomento(ruim, new Date());
  const rf = A.registrarFala(ruim, ['eu', 'quero'], Date.now()); assert.ok(Number.isFinite(rf.estado.estrelas));
  for (const area of ['geral', 'psico', 'fono'] as const) P.relatorioHtml(P.gerarRelatorio(ruim, '7d', area, 'pt', new Date()));
  // relatório mostra a espera e a regra
  const html = P.relatorioHtml(P.gerarRelatorio(e2, '7d', 'geral', 'pt', new Date(t0 + 3 * 60000)));
  assert.ok(html.includes('Esperou até o fim') && html.includes('esperar 3 min para liberar'), 'espera no relatório');
});

ok('relatório: hoje, 7/15/30 dias, 2 meses e datas livres', () => {
  const hoje = new Date(2026, 10, 15, 14, 0);
  assert.equal(RG.janela('1d', hoje).dias, 1);
  assert.equal(RG.janela('30d', hoje).dias, 30);
  const id = RG.periodoLivre(new Date(2026, 9, 1), new Date(2026, 9, 10), hoje);
  assert.equal(id, 'c:2026-10-01:2026-10-10');
  const j = RG.janela(id, hoje); assert.equal(j.dias, 10); assert.equal(new Date(j.inicio).getDate(), 1);
  assert.equal(RG.periodoLivre(new Date(2026, 9, 10), new Date(2026, 9, 1), hoje), id, 'datas invertidas');
  assert.equal(RG.periodoLivre(new Date(2026, 9, 1), new Date(2027, 0, 1), hoje), 'c:2026-10-01:2026-11-15', 'não passa de hoje');
  const longo = RG.lerPeriodoLivre(RG.periodoLivre(new Date(2020, 0, 1), hoje, hoje))!;
  assert.ok((longo.fim.getTime() - longo.ini.getTime()) / 86400000 + 1 <= RG.MAX_DIAS_LIVRE);
  for (const ruim of ['c:2026-13-01:2026-10-10', 'c:2026-10-10:2026-10-01', 'c:x', 'c:2026-02-30:2026-03-01']) assert.equal(RG.lerPeriodoLivre(ruim), undefined, ruim);
  const r = P.gerarRelatorio(estadoPadrao('pt'), id, 'geral', 'pt', hoje);
  assert.ok(r.periodoTexto.includes('Datas escolhidas (10 dias)') && r.periodoTexto.includes('01/10/2026'));
});

console.log(`\n${n} grupos de testes passaram.`);
