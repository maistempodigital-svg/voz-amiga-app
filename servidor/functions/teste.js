// node teste.js — confere a janela do sábado do servidor (igual à do app)
const assert = require('node:assert/strict');
const { lerJanela, travado, adiarPara } = require('./janela-para-teste.js');
const J = lerJanela({});
const sp = (iso) => Date.parse(iso + '-03:00');
assert.equal(travado(sp('2026-11-20T16:59:00'), J), false);
assert.equal(travado(sp('2026-11-20T17:00:00'), J), true);
assert.equal(travado(sp('2026-11-21T19:59:00'), J), true);
assert.equal(travado(sp('2026-11-21T20:00:00'), J), false);
assert.equal(adiarPara(sp('2026-11-21T10:00:00'), J), sp('2026-11-21T22:00:00'));
assert.equal(adiarPara(sp('2026-11-19T10:00:00'), J), undefined);
assert.equal(lerJanela({ ativo: 'false' }).ativo, true);
console.log('janela do sábado do servidor: ok');
