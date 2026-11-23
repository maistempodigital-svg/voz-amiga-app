// Testes do plano grátis, teste premium e sábado (rodar: npx tsx teste/premium.test.ts)
import assert from 'node:assert/strict';
import { estadoTeste, podeOferecerTeste, temPremium, avisoFimTeste, pranchasQueFicam, pagamentoTravado, pagamentoLiberaEm, lerJanelaSabado, adiarRenovacaoPara, JANELA_PADRAO, tp } from '../rotina-amiga/v14/premium';
import { LIMITES_GRATIS, lerLimitesFirebase, limitesDoFirebase } from '../rotina-amiga/logica/plano';

let n = 0;
const ok = (nome: string, f: () => void) => { f(); n++; console.log('✓ ' + nome); };
const DIA = 86400000;
// 2026-11-20 é sexta-feira. Horários em UTC; São Paulo = UTC-3.
const sp = (iso: string) => Date.parse(iso + '-03:00');

ok('plano grátis do Adriano: 10 pranchas, 1 turno com 5 tarefas, só emoji, sem voz gravada, teste 30 dias', () => {
  assert.equal(LIMITES_GRATIS.pranchas, 10); assert.equal(LIMITES_GRATIS.premios, 1); assert.equal(LIMITES_GRATIS.rotinas, 1); assert.equal(LIMITES_GRATIS.tarefasPorRotina, 5);
  assert.equal(LIMITES_GRATIS.fotos, false); assert.equal(LIMITES_GRATIS.vozGravada, 0); assert.equal(LIMITES_GRATIS.testePremiumDias, 30);
  assert.equal(lerLimitesFirebase({ fotos: 'true' }).fotos, true);
  assert.equal(lerLimitesFirebase({ testePremiumDias: 9999 }).testePremiumDias, 365);
});

ok('teste premium: não usado → ativo → acaba; relógio estranho não libera', () => {
  const t0 = Date.parse('2026-11-01T12:00:00Z');
  assert.deepEqual(estadoTeste(undefined, t0, 30), { fase: 'nao_usado' });
  assert.equal(podeOferecerTeste(undefined, 30), true);
  assert.equal(podeOferecerTeste({ inicio: t0 }, 30), false);
  assert.equal(podeOferecerTeste(undefined, 0), false);
  const a = estadoTeste({ inicio: t0, dias: 30 }, t0 + 10 * DIA, 30);
  assert.equal(a.fase, 'ativo'); assert.equal(a.fase === 'ativo' && a.diasRestantes, 20);
  assert.equal(estadoTeste({ inicio: t0, dias: 30 }, t0 + 30 * DIA, 30).fase, 'acabou');
  assert.equal(estadoTeste({ inicio: t0 + 5 * DIA }, t0, 30).fase, 'acabou', 'início no futuro');
  assert.equal(estadoTeste({ inicio: NaN }, t0, 30).fase, 'nao_usado');
  // mudar os dias no Firebase depois não encurta um teste já começado
  assert.equal(estadoTeste({ inicio: t0, dias: 30 }, t0 + 20 * DIA, 7).fase, 'ativo');
  assert.equal(temPremium(false, a), true); assert.equal(temPremium('true', { fase: 'acabou', fim: 0 }), false); assert.equal(temPremium(true, { fase: 'nao_usado' }), true);
});

ok('avisos "vai travar" em 5, 3 e 1 dia, um de cada vez', () => {
  const t0 = 1_700_000_000_000;
  const em = (dias: number) => estadoTeste({ inicio: t0, dias: 30 }, t0 + (30 - dias) * DIA + 1, 30);
  assert.equal(avisoFimTeste(em(10)), undefined);
  assert.equal(avisoFimTeste(em(5)), 5);
  assert.equal(avisoFimTeste(em(5), [5]), undefined);
  assert.equal(avisoFimTeste(em(3), [5]), 3);
  assert.equal(avisoFimTeste(em(1), []), 1, 'pulou dias: mostra só o mais urgente');
  assert.equal(avisoFimTeste({ fase: 'acabou', fim: 0 }), undefined);
});

ok('depois do teste a criança continua falando: as escolhidas pelos pais + as mais usadas; nada é apagado', () => {
  const p = Array.from({ length: 20 }, (_, i) => ({ id: 'p' + i, usos: i, criadaEm: i }));
  const fica = pranchasQueFicam(p, 15, ['p0', 'p1']);
  assert.equal(fica.size, 15); assert.ok(fica.has('p0') && fica.has('p1') && fica.has('p19'));
  assert.ok(!fica.has('p2'));
  assert.equal(pranchasQueFicam(p.slice(0, 5), 15).size, 5);
  assert.equal(pranchasQueFicam(p, 15, ['nao-existe']).size, 15);
  assert.equal(p.length, 20, 'a lista original não muda');
});

ok('sábado: sexta 17h até sábado 20h (São Paulo) trava; fora disso libera', () => {
  const J = JANELA_PADRAO;
  assert.equal(pagamentoTravado(sp('2026-11-20T16:59:00'), -180, J), false);
  assert.equal(pagamentoTravado(sp('2026-11-20T17:00:00'), -180, J), true);
  assert.equal(pagamentoTravado(sp('2026-11-21T12:00:00'), -180, J), true);
  assert.equal(pagamentoTravado(sp('2026-11-21T19:59:00'), -180, J), true);
  assert.equal(pagamentoTravado(sp('2026-11-21T20:00:00'), -180, J), false);
  assert.equal(pagamentoTravado(sp('2026-11-18T10:00:00'), -180, J), false);
});

ok('sábado: confere o fuso do cliente E o do Adriano', () => {
  // Lisboa (UTC+0): sexta 20h30 lá = sexta 17h30 em SP → trava pelos dois
  assert.equal(pagamentoTravado(Date.parse('2026-11-20T20:30:00Z'), 0), true);
  // Lisboa sexta 18h = SP sexta 15h → trava pelo cliente
  assert.equal(pagamentoTravado(Date.parse('2026-11-20T18:00:00Z'), 0), true);
  // Japão (UTC+9): sábado 21h lá = sábado 09h em SP → trava pelo Adriano
  assert.equal(pagamentoTravado(Date.parse('2026-11-21T12:00:00Z'), 540), true);
  // Nova York (UTC-5): sábado 19h lá = sábado 21h em SP → trava pelo cliente
  assert.equal(pagamentoTravado(Date.parse('2026-11-22T00:00:00Z'), -300), true);
  // Nova York sábado 20h01 = SP 22h01 → libera
  assert.equal(pagamentoTravado(Date.parse('2026-11-22T01:01:00Z'), -300), false);
  // fuso inválido usa o do Adriano
  assert.equal(pagamentoTravado(sp('2026-11-21T10:00:00'), NaN), true);
});

ok('sábado: quando libera, desligar só com false, e adiar renovação', () => {
  const lib = pagamentoLiberaEm(sp('2026-11-21T10:00:00'), -180);
  assert.equal(lib, sp('2026-11-21T20:00:00'));
  assert.equal(pagamentoLiberaEm(sp('2026-11-18T10:00:00'), -180), undefined);
  assert.equal(lerJanelaSabado({ ativo: 'false' }).ativo, true, 'texto não desliga');
  assert.equal(lerJanelaSabado({ ativo: false }).ativo, false);
  assert.equal(lerJanelaSabado({ inicioHora: 99 }).inicioHora, 17);
  assert.equal(pagamentoTravado(sp('2026-11-21T10:00:00'), -180, lerJanelaSabado({ ativo: false })), false);
  assert.equal(adiarRenovacaoPara(sp('2026-11-21T10:00:00')), sp('2026-11-21T22:00:00'));
  assert.equal(adiarRenovacaoPara(sp('2026-11-19T10:00:00')), undefined);
});

ok('painel: novos / antigos / todos', () => {
  const rotina = { pranchas: 5 }; const corte = 1000;
  const porData = { corte, antigos: { pranchas: 10 } };
  assert.equal(limitesDoFirebase(rotina, porData, 500).pranchas, 10, 'antiga mantém 10');
  assert.equal(limitesDoFirebase(rotina, porData, 2000).pranchas, 5, 'nova usa 5');
  assert.equal(limitesDoFirebase(rotina, porData, 0).pranchas, 10, 'veio do app antigo = antiga');
  assert.equal(limitesDoFirebase(rotina, undefined, 0).pranchas, 5, 'sem regra: todos iguais');
  assert.equal(limitesDoFirebase(rotina, { corte: 'x', antigos: { pranchas: 10 } }, 0).pranchas, 5, 'corte estranho: ignora');
  assert.equal(limitesDoFirebase(rotina, porData, NaN).pranchas, 5);
});

ok('textos nos 3 idiomas', () => {
  for (const l of ['pt', 'es', 'en'] as const) { assert.ok(tp('meLeve', l).length > 3); assert.ok(tp('testar', l, 30).includes('30')); assert.ok(tp('sabado', l).length > 20); }
});

console.log(`\n${n} grupos de testes do premium passaram.`);
