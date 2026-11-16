// FUZZ: estados corrompidos/adulterados (como alguém mexendo no armazenamento do celular). Rodar: N=1500 npx tsx teste/fuzz.test.ts
import assert from 'node:assert/strict';
import * as A from '../rotina-amiga/logica/acoes';
import * as R from '../rotina-amiga/logica/rotina';
import * as E from '../rotina-amiga/logica/estrelas';
import * as RG from '../rotina-amiga/logica/relatorioGeral';
import * as P from '../rotina-amiga/logica/profissional';
import { estadoPadrao } from '../rotina-amiga/padroes';
import { sanearConfigV14 } from '../rotina-amiga/v14/config';
import { evolucao } from '../rotina-amiga/v14/relatorioV14';
import { marcosNovos, nivelAutomatico, sugerirAumentarGrade } from '../rotina-amiga/v14/crescer';
import { criarBackup, lerBackup, guardarCopia } from '../rotina-amiga/v14/backup';
import { recursoAtivo, lerRecursosFirebase, RECURSOS } from '../rotina-amiga/v14/recursos';

// PRNG determinístico
let seed = Number(process.env.SEED || 12345);
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

const T = new Date('2026-11-15T13:10:00').getTime();
const D = 86400000;

// ---------- estado válido com uso real ----------
const real = () => {
  let s = estadoPadrao('pt', true);
  s = { ...s, config: { ...s.config, premiarFala: true, intervaloFalaSeg: 0, limiteFalaDia: 50, nomeCrianca: 'Ana', premioModo: 'imediato' } };
  for (let d = 20; d >= 0; d--) {
    const t0 = T - d * D;
    s = A.registrarFala(s, ['eu', 'quero', `agua${d}`], t0 + 1000, { ms: 3000, sug: 1 }).estado;
    s = A.registrarFala(s, ['ajuda', 'mamae'], t0 + 2000).estado;
    s = A.registrarPrancha(s, 'comer', t0 + 3000, 'comida');
    const aba = s.abas[d % s.abas.length];
    for (const t of R.tarefasDoDia(s, aba.id, new Date(t0))) {
      s = A.iniciarTarefa(s, aba.id, t.id, t0 + 4000);
      s = A.concluirTarefa(s, t0 + 64000, true, d % 2 ? 'adulto' : 'crianca').estado;
    }
    s = A.somarUso(s, t0 + 5000, t0 + 5000 + 1800000);
    if (d % 5 === 0) s = A.registrarCrise(s, { quando: t0 + 7000, intensidade: 3, duracaoMin: 10, gatilhos: ['barulho'], ajudou: ['abraco'], nota: 'nota crise' });
    if (d % 3 === 0) s = A.registrarSentimento(s, 'feliz', t0 + 8000);
    s = A.registrarTeclado(s, { letras: 10, apagadas: 2, palavras: ['oi'] }, t0 + 9000);
    s = A.registrarFraseIncompleta(s, ['eu', 'quero'], t0 + 9500);
    if (d % 4 === 0) s = A.adicionarNota(s, `nota ${d}`, t0 + 10000);
  }
  s = A.ajustarEstrelas(s, 30, T);
  const r = s.recompensas[0];
  s = A.comprar(s, r.id, T + 1000).estado;
  if (s.esperaAtiva) s = A.confirmarEspera(s, s.esperaAtiva.fim + 1);
  for (const m of s.metas) s = A.resgatarMeta(s, m.id, T).estado;
  // deixa uma tarefa ativa e uma espera ativa
  const t1 = s.tarefas[0];
  s = A.iniciarTarefa(s, t1.abaId, t1.id, T + 5000);
  s = { ...s, esperaAtiva: { recompensaId: s.recompensas[1].id, inicio: T, fim: T + 5 * 60000 }, proximoPremioEm: T + 60000 };
  // v14
  s = A.mudarV14(s, { nivel: 2, nivelModo: 'auto', idadeAnos: 6, gradeBotoes: 8, recursos: { niveis: true, ia: true }, missoesFeitas: { '2026-11-15': 'm3' }, marcos: { primeiroToque: T - 5 * D }, licoesVistas: ['usar'], senhaSal: 'abcdefgh12', senhaHash: 'a'.repeat(64) });
  s = A.registrarModelo(s, 'agua', T - 1000); s = A.registrarV14(s, 'missao', 'm3', T - 900); s = A.registrarV14(s, 'marco', 'duasPalavras', T - 800); s = A.registrarV14(s, 'emergencia', 'dor', T - 700); s = A.registrarV14(s, 'nivel', '2', T - 600);
  return s;
};

const BASE = real();
const PADRAO = estadoPadrao('pt', false);

// ---------- valores lixo ----------
const lixos: unknown[] = [null, undefined, 0, -1, 1, 1.5, -1e9, 1e300, -1e300, NaN, Infinity, -Infinity, '', 'x', '123', '-5', 'NaN', 'Infinity', '07:30', '99:99',
  '__proto__', 'constructor', 'toString', 'a'.repeat(5000), [], [1, 2], ['a', null], [{}], [[]], {}, { a: 1 }, { id: 'x' }, { __proto__: { polu: 1 } }, true, false,
  { toString: 1 }, { valueOf: 'x' }, Object.create(null), [null], [NaN], ['manha'], { id: 5 }, { t: 'x', tipo: 1 }, 1e15, -0, '0x10', ' ', '\u0000'];
const lixo = () => { const v = pick(lixos); return Array.isArray(v) ? [...v] : v && typeof v === 'object' ? { ...(v as object) } : v; };

const camposTopo = ['v14', 'v14', 'config', 'tarefas', 'abas', 'recompensas', 'metas', 'concluidas', 'metasPagas', 'palavras', 'uso', 'notas', 'log', 'tarefaAtiva', 'esperaAtiva', 'proximoPremioEm', 'estrelas', 'versao'];
const camposConfig = ['modoFoco', 'travarHorario', 'senhaPais', 'sonsSuaves', 'mostrarNaHome', 'falarTarefa', 'premiarFala', 'limiteFalaDia', 'intervaloFalaSeg', 'bonusRotina', 'minimoSemTimerSeg', 'tourVisto', 'segurarAdultoSeg', 'personagem', 'comoEstou', 'nomeCrianca', 'premioModo', 'premioMin', 'frasesProntas', 'frasesLista', 'frasesOcultas', 'modoFraseSempre'];
const camposTarefa = ['id', 'abaId', 'titulo', 'icone', 'imagemUri', 'horario', 'travarAteHorario', 'alarme', 'duracaoMin', 'dias', 'estrelas', 'abaVozId'];
const camposAba = ['id', 'nome', 'icone', 'cor', 'paletaId'];
const camposRec = ['id', 'titulo', 'custo', 'icone', 'esperaMin'];
const camposMeta = ['id', 'titulo', 'tipo', 'alvo', 'periodo', 'premio', 'ativa', 'icone'];
const camposLog = ['t', 'tipo', 'abaId', 'tarefaId', 'rotulo', 'palavras', 'estrelas', 'origem', 'segundos', 'novas', 'ms', 'sug', 'letras', 'apagadas', 'quem', 'aba', 'intensidade', 'duracaoMin', 'gatilhos', 'ajudou', 'nota', 'valor', 'esperouMin'];
const camposNota = ['t', 'texto'];
const camposV14 = ['recursos', 'backupMax', 'senhaHash', 'senhaSal', 'emergencia', 'voz', 'lembreteHora', 'missoesFeitas', 'licoesVistas', 'nivel', 'nivelModo', 'idadeAnos', 'gradeBotoes', 'visual', 'marcos', 'toqueMs', 'estilo', 'modoTela', 'ia'];
const camposTA = ['abaId', 'tarefaId', 'inicio', 'duracaoSeg'];
const camposEA = ['recompensaId', 'inicio', 'fim'];

const clone = (x: unknown) => JSON.parse(JSON.stringify(x));
const desc = (v: unknown) => { try { if (typeof v === 'number') return String(v); if (typeof v === 'string') return JSON.stringify(v.length > 30 ? v.slice(0, 20) + '…(' + v.length + ')' : v); if (v === undefined) return 'undefined'; return JSON.stringify(v)?.slice(0, 60) ?? String(v); } catch { return String(v); } };

type Mut = string;
const mutar = (): { s: any; muts: Mut[] } => {
  const s: any = clone(BASE);
  const muts: Mut[] = [];
  const n = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const tipo = Math.floor(rnd() * 14);
    const v = lixo();
    const setIdx = (arrName: string, campos: string[]) => {
      const arr = s[arrName];
      if (!Array.isArray(arr) || !arr.length) { s[arrName] = v; muts.push(`${arrName}=${desc(v)}`); return; }
      const j = Math.floor(rnd() * arr.length);
      if (rnd() < 0.15) { arr[j] = v; muts.push(`${arrName}[${j}]=${desc(v)}`); return; }
      if (!arr[j] || typeof arr[j] !== 'object') return;
      const c = pick(campos); arr[j][c] = v; muts.push(`${arrName}[${j}].${c}=${desc(v)}`);
    };
    switch (tipo) {
      case 0: { const c = pick(camposTopo); s[c] = v; muts.push(`${c}=${desc(v)}`); break; }
      case 1: case 2: { if (!s.config || typeof s.config !== 'object') break; const c = pick(camposConfig); s.config[c] = v; muts.push(`config.${c}=${desc(v)}`); break; }
      case 3: setIdx('tarefas', camposTarefa); break;
      case 4: setIdx('abas', camposAba); break;
      case 5: setIdx('recompensas', camposRec); break;
      case 6: setIdx('metas', camposMeta); break;
      case 7: case 8: setIdx('log', camposLog); break;
      case 9: setIdx('notas', camposNota); break;
      case 10: {
        const k = pick(['tarefaAtiva', 'esperaAtiva']);
        if (s[k] && typeof s[k] === 'object') { const c = pick(k === 'tarefaAtiva' ? camposTA : camposEA); s[k][c] = v; muts.push(`${k}.${c}=${desc(v)}`); }
        else { s[k] = v; muts.push(`${k}=${desc(v)}`); }
        break;
      }
      case 12: case 13: {
        if (!s.v14 || typeof s.v14 !== 'object') { s.v14 = v; muts.push(`v14=${desc(v)}`); break; }
        const c = pick(camposV14);
        if (rnd() < 0.4 && s.v14[c] && typeof s.v14[c] === 'object') { const k = pick(Object.keys(s.v14[c]).concat(['__proto__', 'x', 'ordem', 'dor', 'velocidade'])); s.v14[c][k] = v; muts.push(`v14.${c}.${k}=${desc(v)}`); }
        else { s.v14[c] = v; muts.push(`v14.${c}=${desc(v)}`); }
        break;
      }
      case 11: {
        const alvo = pick(['concluidas', 'palavras', 'uso', 'metasPagas']);
        if (!s[alvo] || typeof s[alvo] !== 'object') break;
        const ks = Object.keys(s[alvo]);
        const k = rnd() < 0.3 ? pick(['__proto__', 'constructor', 'toString', 'NaN-NaN-NaN', '2026-11-15']) : pick(ks.length ? ks : ['x']);
        if (alvo === 'concluidas' && rnd() < 0.5 && s[alvo][k] && typeof s[alvo][k] === 'object') {
          const ab = rnd() < 0.3 ? '__proto__' : pick(Object.keys(s[alvo][k]).concat(['manha']));
          s[alvo][k][ab] = v; muts.push(`${alvo}[${k}][${ab}]=${desc(v)}`);
        } else if (k === '__proto__') { Object.defineProperty(s[alvo], '__proto__', { value: v, enumerable: true, configurable: true, writable: true }); muts.push(`${alvo}["__proto__"](own)=${desc(v)}`); }
        else { s[alvo][k] = v; muts.push(`${alvo}[${k}]=${desc(v)}`); }
        break;
      }
    }
  }
  return { s, muts };
};

// ---------- execução ----------
const periodos: RG.IdPeriodo[] = ['1d', '7d', '15d', '30d', '1m', '2m', '3m', '6m', '12m', 'c:2026-10-01:2026-11-15', 'c:2025-01-01:2026-11-15', 'c:2026-11-15:2026-11-15'];
const areas: P.AreaRel[] = ['geral', 'fono', 'to', 'psico', 'escola'];
const idiomas = ['pt', 'en', 'es'] as const;

interface Falha { muts: string[]; etapa: string; erro: string }
const falhas: Falha[] = [];
const avisos: Falha[] = [];
let testados = 0;

const fin = (x: number) => typeof x === 'number' && Number.isFinite(x) && x >= 0;

const rodar = (bruto: unknown, muts: string[], viaJson: boolean) => {
  testados++;
  let etapa = 'sanear';
  const reg = (e: unknown) => falhas.push({ muts, etapa: (viaJson ? '[json] ' : '[direto] ') + etapa, erro: e instanceof Error ? e.message.split('\n')[0] : String(e) });
  const checar = (st: any, onde: string) => {
    if (!fin(st.estrelas)) falhas.push({ muts, etapa: (viaJson ? '[json] ' : '[direto] ') + onde, erro: `estrelas inválida: ${desc(st.estrelas)}` });
  };
  try {
    const s = A.sanear(bruto, PADRAO);
    checar(s, 'sanear');
    // idempotência: sanear(JSON(sanear(x))) não deve lançar e deve manter estrelas
    etapa = 'sanear(JSON(sanear))'; const s2 = A.sanear(JSON.parse(JSON.stringify(s)), PADRAO); checar(s2, etapa);
    const dias = [new Date(T), new Date(T - D * 3), new Date('2026-11-15T07:00:00'), new Date('2026-11-15T23:59:00')];
    for (const d of dias) {
      etapa = 'abaDoMomento'; R.abaDoMomento(s, d);
      etapa = 'proximaEtapa'; R.proximaEtapa(s, d);
      for (const a of (s.abas.length ? s.abas.map((x) => x.id) : ['manha']).concat(['inexistente'])) {
        etapa = `tarefasDoDia(${a})`; R.tarefasDoDia(s, a, d);
        etapa = `feitasDoDia(${a})`; const f = R.feitasDoDia(s, a, d); if (!Array.isArray(f)) throw new Error('feitasDoDia não-array');
        etapa = `rotinaCompleta(${a})`; R.rotinaCompleta(s, a, d);
        etapa = `resumoAba(${a})`; A.resumoAba(s, a, d);
      }
      etapa = 'alarmesAgora'; R.alarmesAgora(s, d);
    }
    etapa = 'podeTerminar'; R.podeTerminar(s, T + 999999);
    let st = s;
    etapa = 'registrarFala';
    for (const ws of [['eu', 'quero', 'agua'], ['constructor', 'toString'], ['__proto__', 'valueOf'], ['novo', 'palavra', 'zz']]) {
      const r = A.registrarFala(st, ws, T + 100000); st = r.estado; checar(st, 'registrarFala ' + ws.join(' '));
      if (!Number.isFinite(r.estrelas)) throw new Error('estrelas da fala não finita');
    }
    etapa = 'concluirTarefa(ativa)'; { const r = A.concluirTarefa(st, T + 200000); checar(r.estado, etapa); if (!Number.isFinite(r.estrelas)) throw new Error('ganho NaN'); st = r.estado; }
    for (const t of s.tarefas.slice(0, 6)) {
      etapa = `iniciarTarefa(${t.id})`; st = A.iniciarTarefa(st, t.abaId, t.id, T + 300000);
      etapa = `concluirTarefa(${t.id})`; const r = A.concluirTarefa(st, T + 360000, true, 'adulto'); checar(r.estado, etapa); st = r.estado;
      etapa = 'cancelarTarefa'; st = A.cancelarTarefa(st, T + 360001);
    }
    etapa = 'confirmarEspera'; st = A.confirmarEspera(st, T + 3 * 3600000); checar(st, etapa);
    etapa = 'desistirEspera'; A.desistirEspera(st, T + 3 * 3600000);
    for (const r of st.recompensas.concat([{ id: 'nao-existe' } as any])) {
      etapa = `comprar(${r.id})`; const c = A.comprar({ ...st, estrelas: 2000 }, r.id, T + 4 * 3600000); checar(c.estado, etapa);
      if (c.estado.esperaAtiva) { etapa = 'confirmarEspera pós-compra'; const z = A.confirmarEspera(c.estado, c.estado.esperaAtiva.fim); checar(z, etapa); }
      etapa = `comprar0(${r.id})`; const c0 = A.comprar(st, r.id, T + 4 * 3600000); checar(c0.estado, etapa);
      etapa = 'faltaProximoPremio'; const fp = A.faltaProximoPremio(st, T); if (!Number.isFinite(fp) || fp < 0) throw new Error('faltaProximoPremio ' + fp);
    }
    for (const m of st.metas) {
      etapa = `progressoMeta(${m.id})`; const p = E.progressoMeta(st, m, new Date(T));
      if (!Number.isFinite(p.feito)) avisos.push({ muts, etapa, erro: `feito=${desc(p.feito)} (tipo=${desc(m.tipo)})` });
      etapa = `resgatarMeta(${m.id})`; const r = A.resgatarMeta(st, m.id, T + 100); checar(r.estado, etapa); st = r.estado;
    }
    etapa = 'metasParaResgatar'; E.metasParaResgatar(st, new Date(T));
    etapa = 'ajustarEstrelas'; checar(A.ajustarEstrelas(st, -5, T), etapa);
    etapa = 'sequenciaDias'; E.sequenciaDias(st, new Date(T));
    for (const i of idiomas) { etapa = `conquistas(${i})`; const cq = E.conquistas(st, i, new Date(T)); for (const c of cq) if (!Number.isFinite(c.progresso)) avisos.push({ muts, etapa, erro: `progresso ${c.id}=${c.progresso}` }); }
    etapa = 'numeros'; const nu = RG.numeros(st, T - 400 * D, T + D);
    for (const [k, v] of Object.entries(nu)) if (typeof v === 'number' && !Number.isFinite(v)) avisos.push({ muts, etapa, erro: `numeros.${k}=${v}` });
    const ps = rnd() < 0.3 ? periodos : [pick(periodos), pick(periodos)];
    for (const per of ps) {
      for (const ar of (rnd() < 0.3 ? areas : [pick(areas)])) {
        const idi = pick([...idiomas]);
        etapa = `gerarRelatorio(${per},${ar},${idi})`; const rel = P.gerarRelatorio(st, per, ar, idi, new Date(T), { limitado: rnd() < 0.3 });
        etapa = `relatorioHtml(${per},${ar})`; const h = P.relatorioHtml(rel); if (typeof h !== 'string') throw new Error('html não string');
        etapa = `relatorioTexto(${per},${ar})`; const tx = P.relatorioTexto(rel); if (typeof tx !== 'string') throw new Error('texto não string');
        if (!muts.some((m) => m.includes('texto=')) && /\bNaN\b|undefined|\[object Object\]/.test(tx)) avisos.push({ muts, etapa, erro: 'texto do relatório contém ' + (tx.match(/\bNaN\b|undefined|\[object Object\]/)![0]) });
        if (/<script|onerror=/i.test(h)) falhas.push({ muts, etapa, erro: 'HTML com script injetado' });
      }
    }
    etapa = 'textoProfissional'; RG.textoProfissional(st, '30d', new Date(T), 'pt');
    // ---- v14
    etapa = 'v14 config'; const c = sanearConfigV14(st.v14);
    if (![1, 2, 3].includes(c.nivel) || !Number.isFinite(c.toqueMs) || !Number.isFinite(c.voz.velocidade) || c.voz.ordem.length !== 5) throw new Error('config v14 inválida');
    if (JSON.stringify(sanearConfigV14(JSON.parse(JSON.stringify(c)))) !== JSON.stringify(sanearConfigV14(c))) throw new Error('config v14 não é idempotente');
    etapa = 'v14 recursos'; for (const r of RECURSOS) if (typeof recursoAtivo(r.id, c.recursos, lerRecursosFirebase(lixo()), rnd() < 0.5) !== 'boolean') throw new Error('recurso não booleano');
    etapa = 'v14 evolucao'; for (const i of idiomas) { const ev = evolucao(st, T - 30 * D, T + D, i); for (const it of ev.itens) if (/NaN|undefined|\[object/.test(it.valor)) avisos.push({ muts, etapa, erro: `${it.rotulo}=${it.valor}` }); }
    etapa = 'v14 marcos/nivel/grade'; marcosNovos(st.log, c.marcos); nivelAutomatico(c.nivel, st.log, T, c.idadeAnos); sugerirAumentarGrade(['agua', 'comer'], st.log, T, c.gradeBotoes);
    etapa = 'v14 backup'; const bk = criarBackup({ voz: { abas: [], pranchas: [] }, rotina: st }, T); const lb = lerBackup(bk); if (!lb.ok) throw new Error('backup do próprio estado recusado');
    etapa = 'v14 restaurar'; checar(A.sanear(lb.dados.rotina, PADRAO), etapa);
    etapa = 'v14 backup adulterado'; { const k = Math.floor(rnd() * bk.length); const ad = bk.slice(0, k) + pick(['x', '"', '}', '0', '']) + bk.slice(k + 1); const la = lerBackup(ad); if (la.ok && JSON.stringify(la.dados) !== JSON.stringify(lb.dados)) throw new Error('backup adulterado aceito'); }
    etapa = 'v14 guardarCopia'; guardarCopia(lixo(), bk, T, Math.floor(rnd() * 20) - 5);
    // o estado final também deve sobreviver ao ciclo salvar/ler
    etapa = 'sanear(final)'; checar(A.sanear(JSON.parse(JSON.stringify(st)), PADRAO), etapa);
  } catch (e) { reg(e); }
};

// 1) estado válido passa por sanear sem perder dados
{
  const json = JSON.parse(JSON.stringify(BASE));
  const s = A.sanear(json, PADRAO);
  const campos = ['abas', 'tarefas', 'recompensas', 'metas', 'config', 'estrelas', 'concluidas', 'metasPagas', 'palavras', 'uso', 'notas', 'log', 'tarefaAtiva', 'esperaAtiva', 'proximoPremioEm', 'versao'] as const;
  const perdas: string[] = [];
  for (const c of campos) {
    try { assert.deepStrictEqual(JSON.parse(JSON.stringify((s as any)[c] ?? null)), JSON.parse(JSON.stringify((json as any)[c] ?? null))); } catch (e) { perdas.push(c + ': ' + (e as Error).message.split('\n').slice(0, 12).join(' | ')); }
  }
  console.log('ESTADO VÁLIDO: log', BASE.log.length, 'eventos, tarefas', BASE.tarefas.length, 'notas', (BASE.notas || []).length, 'palavras', Object.keys(BASE.palavras).length, 'uso', Object.keys(BASE.uso || {}).length, 'estrelas', BASE.estrelas, 'tarefaAtiva', !!BASE.tarefaAtiva, 'esperaAtiva', !!BASE.esperaAtiva);
  console.log('  perdas:', perdas.length ? perdas : 'nenhuma');
  // também direto (sem JSON) e estadoPadrao com/sem exemplos
  for (const [nome, x] of [['BASE direto', BASE], ['padrao true', estadoPadrao('pt', true)], ['padrao false', estadoPadrao('en', false)]] as const) {
    const y = A.sanear(x, PADRAO);
    try { assert.deepStrictEqual(JSON.parse(JSON.stringify(y)), JSON.parse(JSON.stringify(x))); console.log('  ', nome, 'idêntico'); } catch (e) { console.log('  ', nome, 'DIFERENTE:', (e as Error).message.split('\n').slice(0, 15).join(' | ')); }
  }
}

// 2) fuzz
const N = Number(process.env.N || 1500);
for (let i = 0; i < N; i++) {
  const { s, muts } = mutar();
  rodar(s, muts, false);
  // simula AsyncStorage: JSON (NaN/Infinity -> null, undefined some)
  let j: unknown; try { j = JSON.parse(JSON.stringify(s)); } catch { j = null; }
  rodar(j, muts, true);
}
// 3) topo inteiro lixo
for (const v of lixos) rodar(v, ['(estado inteiro)=' + desc(v)], false);

console.log('\nESTADOS TESTADOS:', testados);
console.log('FALHAS:', falhas.length);
const agrupa = (l: Falha[]) => { const g = new Map<string, Falha[]>(); for (const f of l) { const k = f.etapa.replace(/\(.*?\)/, '(…)') + ' :: ' + f.erro; g.set(k, [...(g.get(k) || []), f]); } return g; };
for (const [k, fs] of agrupa(falhas)) console.log(`  [${fs.length}x] ${k}\n     ex: ${fs.slice(0, 4).map((f) => f.muts.join(' ; ')).join('\n         ')}`);
console.log('AVISOS (não lançam):', avisos.length);
for (const [k, fs] of agrupa(avisos)) console.log(`  [${fs.length}x] ${k}\n     ex: ${fs.slice(0, 3).map((f) => f.muts.join(' ; ')).join('\n         ')}`);
