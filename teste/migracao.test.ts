// Testes da migração do app 1.0.24 (rodar: npx tsx teste/migracao.test.ts)
import assert from 'node:assert/strict';
import { migrarDoAppAntigo, idPadraoV24, temDadosV24 } from '../app-de-teste/demo/migracaoV24';
let n = 0; const ok = (nome: string, f: () => void) => { f(); n++; console.log('✓ ' + nome); };

ok('família que nunca mexeu: abas e pranchas prontas iguais ao app antigo', () => {
  const r = migrarDoAppAntigo({ vozAmigaLang: '"pt"' });
  assert.deepEqual(r.abas.map((a) => a.nome), ['Descrição', 'Pessoas', 'Ações', 'Expressão social']);
  assert.equal(r.pranchas.length, 48);
  assert.equal(r.pranchas[0].texto, 'Eu'); assert.equal(r.pranchas[0].emoji, '👤');
});
ok('apagadas continuam apagadas; ordem da família respeitada', () => {
  const del = [idPadraoV24('COMUNICACAO', 'Eu')];
  const ordem = { COMUNICACAO: [idPadraoV24('COMUNICACAO', 'Sim'), idPadraoV24('COMUNICACAO', 'Não')] };
  const r = migrarDoAppAntigo({ vozAmigaDeletedDefaults: JSON.stringify(del), vozAmigaItemOrders: JSON.stringify(ordem), vozAmigaCategoryOrder: '["COMUNICACAO"]' });
  assert.ok(!r.pranchas.some((p) => p.texto === 'Eu'));
  assert.deepEqual(r.pranchas.slice(0, 2).map((p) => p.texto), ['Sim', 'Não']);
});
ok('pranchas criadas, foto do celular e voz gravada viram mídia para converter', () => {
  const custom = { COMUNICACAO: [{ id: 'custom_1', text: 'Vovó Ana', icon: 'file:///data/user/0/com.vozamiga/files/img1.jpg', audioKey: 'aud1' }, { id: 'custom_2', text: 'Pipoca', icon: '🍿' }] };
  const r = migrarDoAppAntigo({ vozAmigaCustomItems: JSON.stringify(custom), vozAmigaAudioMap: JSON.stringify({ aud1: 'file:///data/user/0/com.vozamiga/files/a1.m4a' }) });
  const ana = r.pranchas.find((p) => p.texto === 'Vovó Ana')!;
  assert.ok(ana); assert.equal(r.midias.filter((m) => m.pranchaId === ana.id).length, 2);
  assert.equal(r.pranchas.find((p) => p.texto === 'Pipoca')!.emoji, '🍿');
});
ok('categoria criada pela família (pacote) com itens próprios', () => {
  const uc = { CUSTOM_1: { id: 'CUSTOM_1', label: 'Frutas', theme: 'ROXO', items: [{ id: 'f1', text: 'Maçã', icon: '🍎' }, { id: 'f2', text: 'Uva', icon: 'https://static.arasaac.org/pictograms/2516/2516_300.png' }] } };
  const r = migrarDoAppAntigo({ vozAmigaUserCategories: JSON.stringify(uc), vozAmigaCategoryOrder: '["COMUNICACAO","CUSTOM_1"]' });
  const aba = r.abas.find((a) => a.nome === 'Frutas')!; assert.equal(aba.tema, 'ROXO');
  const uva = r.pranchas.find((p) => p.texto === 'Uva')!; assert.equal(uva.abaId, aba.id); assert.ok(uva.imagem);
});
ok('categoria apagada some; itens órfãos não se perdem', () => {
  const r = migrarDoAppAntigo({ vozAmigaDeletedCategories: '["EMOCOES"]', vozAmigaCustomItems: JSON.stringify({ SUMIU: [{ id: 'x', text: 'Bola', icon: '⚽' }] }) });
  assert.ok(!r.abas.some((a) => a.nome === 'Ações'));
  assert.ok(r.pranchas.some((p) => p.texto === 'Bola'));
  assert.equal(r.avisos.length, 1);
});
ok('dados estragados não derrubam o app', () => {
  const r = migrarDoAppAntigo({ vozAmigaCustomItems: '{quebrado', vozAmigaUserCategories: '[1,2', vozAmigaItemOrders: 'null', vozAmigaLang: '"xx"' });
  assert.equal(r.idioma, 'pt'); assert.ok(r.pranchas.length > 0);
  assert.equal(temDadosV24({}), false); assert.equal(temDadosV24({ vozAmigaLang: '"pt"' }), true);
});
ok('inglês e espanhol', () => {
  assert.equal(migrarDoAppAntigo({ vozAmigaLang: '"en"' }).abas[0].nome, 'Description');
  assert.equal(migrarDoAppAntigo({ vozAmigaLang: '"es"' }).pranchas[0].texto.length > 0, true);
});
ok('voz, volume e colunas', () => {
  const r = migrarDoAppAntigo({ vozAmigaVoice: '"pt-br-x-abc-local"', vozAmigaVolume: '0.8', vozAmigaGridCols: '5' });
  assert.equal(r.voz, 'pt-br-x-abc-local'); assert.equal(r.volume, 80); assert.equal(r.colunas, 5);
});
console.log(`\n${n} grupos de testes da migração passaram.`);

import { chaveEmail, lerControle } from '../app-de-teste/demo/conta';
ok('painel: e-mail vira a mesma chave do servidor; escolhas do dono', () => {
  assert.equal(chaveEmail(' Maria.Silva@Gmail.com '), 'maria,silva@gmail,com');
  assert.deepEqual(lerControle({ tipo: 'bloqueado' }), { bloqueado: true });
  assert.deepEqual(lerControle({ tipo: 'gratis' }), { soGratis: true });
  assert.deepEqual(lerControle({ tipo: 'teste', inicio: 1, dias: 10 }), { testeDono: { inicio: 1, dias: 10 } });
  assert.deepEqual(lerControle({ tipo: 'teste', inicio: 1, dias: 9999 }), {});
  assert.deepEqual(lerControle(null), {});
  console.log('✓ painel por e-mail');
});
