// Todas as mudanças de estado (funções puras — testadas em teste/logica.test.ts).
import { ConfigV14, configV14Padrao, sanearConfigV14 } from '../v14/config';
import { AbaRotina, ConfigRotina, EstadoRotina, Evento, Meta, Recompensa, Tarefa } from '../tipos';
import { avaliarFrase, chavePeriodoMeta, normalizar, progressoMeta } from './estrelas';
import { feitasDoDia, rotinaCompleta, tarefasDoDia } from './rotina';
import { chaveDia } from './tempo';

/** Guarda ~2 anos de histórico (para o relatório anual) sem crescer sem limite. */
export const MAX_EVENTOS = 40000;

const comLog = (s: EstadoRotina, ...ev: Evento[]): EstadoRotina => {
  const log = s.log.concat(ev);
  return { ...s, log: log.length > MAX_EVENTOS ? log.slice(log.length - MAX_EVENTOS) : log };
};

const marcarFeita = (s: EstadoRotina, abaId: string, tarefaId: string, agora: number): EstadoRotina => {
  const k = chaveDia(agora);
  const dia = { ...(s.concluidas[k] || {}) };
  const lista = Array.isArray(dia[abaId]) ? dia[abaId] : [];
  if (!lista.includes(tarefaId)) dia[abaId] = [...lista, tarefaId];
  return { ...s, concluidas: { ...s.concluidas, [k]: dia } };
};

export const iniciarTarefa = (s: EstadoRotina, abaId: string, tarefaId: string, agora = Date.now()): EstadoRotina => {
  const t = s.tarefas.find((x) => x.id === tarefaId);
  if (!t || s.tarefaAtiva) return s;
  return comLog({ ...s, tarefaAtiva: { abaId, tarefaId, inicio: agora, duracaoSeg: Math.max(0, Math.round(t.duracaoMin * 60)) } }, { t: agora, tipo: 'tarefa_inicio', abaId, tarefaId, rotulo: t.titulo });
};

export interface ResultadoConclusao {
  estado: EstadoRotina;
  estrelas: number;
  rotinaCompleta: boolean;
}

/** Concluir (pela criança quando pode, pelo fim do temporizador, ou pelo adulto). */
export const concluirTarefa = (s: EstadoRotina, agora = Date.now(), darEstrela = true, quem: 'crianca' | 'adulto' = 'crianca'): ResultadoConclusao => {
  const a = s.tarefaAtiva;
  if (!a) return { estado: s, estrelas: 0, rotinaCompleta: false };
  const t = s.tarefas.find((x) => x.id === a.tarefaId);
  const ganho = darEstrela ? Math.max(0, t?.estrelas ?? 1) : 0;
  const segundos = Math.round((agora - a.inicio) / 1000);
  let n = marcarFeita({ ...s, tarefaAtiva: undefined }, a.abaId, a.tarefaId, agora);
  n = comLog(n, darEstrela
    ? { t: agora, tipo: 'tarefa_fim', abaId: a.abaId, tarefaId: a.tarefaId, rotulo: t?.titulo, estrelas: ganho, origem: 'rotina', segundos, quem }
    : { t: agora, tipo: 'tarefa_liberada', abaId: a.abaId, tarefaId: a.tarefaId, rotulo: t?.titulo, segundos });
  let total = ganho;
  const completa = rotinaCompleta(n, a.abaId, new Date(agora));
  if (completa) {
    const bonus = Math.max(0, n.config.bonusRotina);
    total += bonus;
    const aba = n.abas.find((x) => x.id === a.abaId);
    n = comLog(n, { t: agora, tipo: 'rotina_completa', abaId: a.abaId, rotulo: aba?.nome, estrelas: bonus, origem: 'rotina' });
  }
  return { estado: { ...n, estrelas: n.estrelas + total }, estrelas: total, rotinaCompleta: completa };
};

export const cancelarTarefa = (s: EstadoRotina, agora = Date.now()): EstadoRotina => {
  const a = s.tarefaAtiva;
  if (!a) return s;
  const t = s.tarefas.find((x) => x.id === a.tarefaId);
  return comLog({ ...s, tarefaAtiva: undefined }, { t: agora, tipo: 'tarefa_cancelada', abaId: a.abaId, tarefaId: a.tarefaId, rotulo: t?.titulo, segundos: Math.round((agora - a.inicio) / 1000) });
};

export interface ResultadoFala {
  estado: EstadoRotina;
  estrelas: number;
}

/** Chamar no botão FALAR do Voz Amiga, com as palavras da frase. */
export const registrarFala = (s: EstadoRotina, palavras: string[], agora = Date.now(), extra: { ms?: number; sug?: number } = {}): ResultadoFala => {
  const limpas = palavras.map((p) => p.trim()).filter(Boolean);
  if (!limpas.length) return { estado: s, estrelas: 0 };
  const r = avaliarFrase(s, limpas, agora);
  const conhecidas = { ...s.palavras };
  for (const w of new Set(limpas.map(normalizar))) conhecidas[w] = (conhecidas[w] || 0) + 1;
  const ev: Evento = { t: agora, tipo: 'frase', palavras: limpas, estrelas: r.estrelas, origem: 'voz', novas: r.palavrasNovas.length };
  if (extra.ms && extra.ms > 0) ev.ms = Math.round(extra.ms);
  if (extra.sug && extra.sug > 0) ev.sug = Math.min(limpas.length, Math.round(extra.sug));
  const n = comLog({ ...s, palavras: conhecidas, estrelas: s.estrelas + r.estrelas }, ev);
  return { estado: n, estrelas: r.estrelas };
};

/** Chamar quando a criança toca numa prancha (só registra para o relatório; não dá estrela). */
export const registrarPrancha = (s: EstadoRotina, rotulo: string, agora = Date.now(), aba?: string): EstadoRotina =>
  comLog(s, aba ? { t: agora, tipo: 'prancha', rotulo, origem: 'voz', aba } : { t: agora, tipo: 'prancha', rotulo, origem: 'voz' });

/** Montou palavras no modo frase e saiu/limpou sem falar. */
export const registrarFraseIncompleta = (s: EstadoRotina, palavras: string[], agora = Date.now()): EstadoRotina => {
  const limpas = palavras.map((p) => p.trim()).filter(Boolean);
  return limpas.length ? comLog(s, { t: agora, tipo: 'frase_incompleta', palavras: limpas, origem: 'voz' }) : s;
};

/** Uso do teclado do app (ao falar ou fechar o teclado). */
export const registrarTeclado = (s: EstadoRotina, d: { letras: number; apagadas: number; palavras?: string[] }, agora = Date.now()): EstadoRotina =>
  d.letras > 0 || d.apagadas > 0 ? comLog(s, { t: agora, tipo: 'teclado', letras: Math.max(0, Math.round(d.letras)), apagadas: Math.max(0, Math.round(d.apagadas)), palavras: d.palavras?.length ? d.palavras : undefined, origem: 'voz' }) : s;

/** SEGURANÇA: tamanho máximo dos textos digitados (evita encher o aparelho e o relatório). */
export const LIMITE_NOTA = 1000;
export const LIMITE_NOME = 60;

export interface DadosCrise { quando: number; intensidade: number; duracaoMin: number; gatilhos: string[]; ajudou: string[]; nota?: string }
/** Momento de crise registrado pelos pais. */
export const registrarCrise = (s: EstadoRotina, d: DadosCrise): EstadoRotina =>
  comLog(s, { t: d.quando, tipo: 'crise', intensidade: Math.max(1, Math.min(5, Math.round(d.intensidade))), duracaoMin: Math.max(0, Math.round(d.duracaoMin)), gatilhos: d.gatilhos, ajudou: d.ajudou, nota: d.nota?.trim().slice(0, LIMITE_NOTA) || undefined, origem: 'pais' });

/** Apaga um registro (crise/sentimento) — usado na lista de crises. */
export const excluirRegistro = (s: EstadoRotina, t: number, tipo: Evento['tipo']): EstadoRotina =>
  ({ ...s, log: s.log.filter((e) => !(e.t === t && e.tipo === tipo)) });

/** "Como estou?" — sentimento escolhido pela criança. */
export const registrarSentimento = (s: EstadoRotina, valor: string, agora = Date.now()): EstadoRotina =>
  comLog(s, { t: agora, tipo: 'sentimento', valor });

/** Sinal automático vindo do app (ex.: 'tentou_sair' quando o app está travado). */
export const registrarSinal = (s: EstadoRotina, valor: string, agora = Date.now(), rotulo?: string): EstadoRotina =>
  comLog(s, { t: agora, tipo: 'sinal', valor, rotulo });

// ------------------------------------------------------------ v14
/** Modo exemplo: os pais tocaram a prancha para mostrar (vai para o relatório, mas não conta como pedido da criança). */
export const registrarModelo = (s: EstadoRotina, rotulo: string, agora = Date.now()): EstadoRotina =>
  comLog(s, { t: agora, tipo: 'modelo', rotulo: rotulo.slice(0, LIMITE_NOME), origem: 'pais' });

/** Eventos das funções novas (missão, marco, nível, emergência). */
export const registrarV14 = (s: EstadoRotina, tipo: 'missao' | 'marco' | 'nivel' | 'emergencia', valor: string, agora = Date.now(), rotulo?: string): EstadoRotina =>
  comLog(s, { t: agora, tipo, valor: valor.slice(0, LIMITE_NOME), rotulo: rotulo?.slice(0, LIMITE_NOME), origem: tipo === 'emergencia' ? 'voz' : 'pais' });

/** Muda as escolhas das funções novas (sempre passa pela conferência). */
export const mudarV14 = (s: EstadoRotina, c: Partial<ConfigV14>): EstadoRotina => ({ ...s, v14: sanearConfigV14({ ...(s.v14 || configV14Padrao()), ...c }) });

/** Anotação dos pais (vai no relatório). */
export const adicionarNota = (s: EstadoRotina, texto: string, agora = Date.now()): EstadoRotina =>
  texto.trim() ? { ...s, notas: [...(s.notas || []), { t: agora, texto: texto.trim().slice(0, LIMITE_NOTA) }].slice(-500) } : s;
export const excluirNota = (s: EstadoRotina, t: number): EstadoRotina => ({ ...s, notas: (s.notas || []).filter((n) => n.t !== t) });

export const resgatarMeta = (s: EstadoRotina, metaId: string, agora = Date.now()): ResultadoFala => {
  const m = s.metas.find((x) => x.id === metaId);
  if (!m) return { estado: s, estrelas: 0 };
  const d = new Date(agora);
  const p = progressoMeta(s, m, d);
  if (!p.completa || p.pago) return { estado: s, estrelas: 0 };
  const n = comLog({ ...s, estrelas: s.estrelas + m.premio, metasPagas: { ...s.metasPagas, [`${m.id}@${chavePeriodoMeta(m, d)}`]: true } }, { t: agora, tipo: 'meta', rotulo: m.titulo, estrelas: m.premio, origem: 'meta' });
  return { estado: n, estrelas: m.premio };
};

export type ResultadoCompra = { estado: EstadoRotina; ok: boolean; espera: boolean };

/** Minutos da regra dos pais (1 a 120). */
export const minutosPremio = (s: EstadoRotina) => Math.min(120, Math.max(1, Math.round(Number(s.config.premioMin) || 5)));
/** Quanto falta (ms) para a loja liberar outro prêmio (regra "intervalo"). 0 = pode. */
export const faltaProximoPremio = (s: EstadoRotina, agora = Date.now()) =>
  // nunca espera mais que a regra atual (relógio errado ou dado adulterado não travam a loja)
  s.config.premioModo === 'intervalo' && s.proximoPremioEm ? Math.min(minutosPremio(s) * 60000, Math.max(0, s.proximoPremioEm - agora)) : 0;
const depoisDoResgate = (s: EstadoRotina, agora: number): EstadoRotina =>
  s.config.premioModo === 'intervalo' ? { ...s, proximoPremioEm: agora + minutosPremio(s) * 60000 } : { ...s, proximoPremioEm: undefined };

export const comprar = (s: EstadoRotina, recompensaId: string, agora = Date.now()): ResultadoCompra => {
  const r = s.recompensas.find((x) => x.id === recompensaId);
  if (!r || !(s.estrelas >= r.custo) || s.esperaAtiva || faltaProximoPremio(s, agora) > 0) return { estado: s, ok: false, espera: false };
  // espera: a do prêmio ou a regra geral dos pais ("aguarda alguns minutos para liberar") — vale a maior
  const esperaMin = Math.max(r.esperaMin || 0, s.config.premioModo === 'espera' ? minutosPremio(s) : 0);
  if (esperaMin > 0) {
    return { estado: comLog({ ...s, esperaAtiva: { recompensaId, inicio: agora, fim: agora + esperaMin * 60000 } }, { t: agora, tipo: 'espera_inicio', rotulo: r.titulo, esperouMin: esperaMin }), ok: true, espera: true };
  }
  return { estado: depoisDoResgate(comLog({ ...s, estrelas: Math.max(0, s.estrelas - r.custo) }, { t: agora, tipo: 'resgate', rotulo: r.titulo, estrelas: -r.custo, esperouMin: 0 }), agora), ok: true, espera: false };
};

/** Fim da espera: confirma o prêmio e desconta as estrelas. */
export const confirmarEspera = (s: EstadoRotina, agora = Date.now()): EstadoRotina => {
  const e = s.esperaAtiva;
  if (!e || agora < e.fim) return s;
  const r = s.recompensas.find((x) => x.id === e.recompensaId);
  if (!r) return { ...s, esperaAtiva: undefined };
  const esperou = Math.round((agora - e.inicio) / 60000);
  return depoisDoResgate(comLog({ ...s, esperaAtiva: undefined, estrelas: Math.max(0, s.estrelas - r.custo) }, { t: agora, tipo: 'resgate', rotulo: r.titulo, estrelas: -r.custo, esperouMin: esperou }), agora);
};

export const desistirEspera = (s: EstadoRotina, agora = Date.now()): EstadoRotina => {
  const e = s.esperaAtiva;
  if (!e) return s;
  const r = s.recompensas.find((x) => x.id === e.recompensaId);
  return comLog({ ...s, esperaAtiva: undefined }, { t: agora, tipo: 'espera_desistiu', rotulo: r?.titulo, esperouMin: Math.round((agora - e.inicio) / 60000) });
};

export const ajustarEstrelas = (s: EstadoRotina, delta: number, agora = Date.now()): EstadoRotina => {
  const novo = Math.max(0, s.estrelas + delta);
  if (novo === s.estrelas) return s;
  return comLog({ ...s, estrelas: novo }, { t: agora, tipo: 'estrelas', estrelas: novo - s.estrelas, origem: 'pais' });
};

// ---------- Edição pelos pais ----------

export const novoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const salvarEm = <T extends { id: string }>(lista: T[], item: T) => {
  const i = lista.findIndex((x) => x.id === item.id);
  if (i < 0) return [...lista, item];
  const c = [...lista];
  c[i] = item;
  return c;
};

export const salvarTarefa = (s: EstadoRotina, t: Tarefa): EstadoRotina => ({ ...s, tarefas: salvarEm(s.tarefas, t) });
export const excluirTarefa = (s: EstadoRotina, id: string): EstadoRotina => ({
  ...s,
  tarefas: s.tarefas.filter((t) => t.id !== id),
  tarefaAtiva: s.tarefaAtiva?.tarefaId === id ? undefined : s.tarefaAtiva,
});

export const salvarAba = (s: EstadoRotina, a: AbaRotina): EstadoRotina => ({ ...s, abas: salvarEm(s.abas, a) });
export const excluirAba = (s: EstadoRotina, id: string): EstadoRotina => ({
  ...s,
  abas: s.abas.filter((a) => a.id !== id),
  tarefas: s.tarefas.filter((t) => t.abaId !== id),
  tarefaAtiva: s.tarefaAtiva?.abaId === id ? undefined : s.tarefaAtiva,
  config: s.config.modoFoco === id ? { ...s.config, modoFoco: 'none' } : s.config,
});

export const salvarRecompensa = (s: EstadoRotina, r: Recompensa): EstadoRotina => ({ ...s, recompensas: salvarEm(s.recompensas, r) });
export const excluirRecompensa = (s: EstadoRotina, id: string): EstadoRotina => ({
  ...s,
  recompensas: s.recompensas.filter((r) => r.id !== id),
  esperaAtiva: s.esperaAtiva?.recompensaId === id ? undefined : s.esperaAtiva,
});

export const salvarMeta = (s: EstadoRotina, m: Meta): EstadoRotina => ({ ...s, metas: salvarEm(s.metas, m) });
export const excluirMeta = (s: EstadoRotina, id: string): EstadoRotina => ({ ...s, metas: s.metas.filter((m) => m.id !== id) });

export const mudarConfig = (s: EstadoRotina, c: Partial<ConfigRotina>): EstadoRotina => {
  const n = { ...s, config: { ...s.config, ...c } };
  // mudou a regra dos prêmios: zera o intervalo que estava contando
  if (('premioModo' in c && c.premioModo !== s.config.premioModo) || ('premioMin' in c && c.premioMin !== s.config.premioMin)) n.proximoPremioEm = undefined;
  return n;
};

/** "Resetar progresso desta rotina" (hoje). */
export const resetarRotinaHoje = (s: EstadoRotina, abaId: string, agora = Date.now()): EstadoRotina => {
  const k = chaveDia(agora);
  const dia = { ...(s.concluidas[k] || {}) };
  delete dia[abaId];
  return { ...s, concluidas: { ...s.concluidas, [k]: dia }, tarefaAtiva: s.tarefaAtiva?.abaId === abaId ? undefined : s.tarefaAtiva };
};

/** Imagem de tarefa aceita: do próprio aparelho ou pictograma ARASAAC. */
export const imagemLocal = (u: unknown): string | undefined =>
  typeof u === 'string' && u.length < 3_000_000 && /^(data:image\/(png|jpe?g|webp|gif);base64,|file:\/\/\/|content:\/\/|https:\/\/static\.arasaac\.org\/pictograms\/\d+\/\d+_300\.png$)/.test(u) ? u : undefined;

/** Corrige dados salvos antigos/incompletos (nunca quebra o app). */
const corta = (x: unknown, n: number) => (typeof x === 'string' ? x.slice(0, n) : '');
/** Converte para número SEM nunca lançar erro (objetos com toString estranho viram NaN). */
const numero = (x: unknown): number => (typeof x === 'number' ? x : typeof x === 'string' ? Number(x) : NaN);
const inteiro = (x: unknown, min: number, max: number, padrao: number) => { const v = Math.round(numero(x)); return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao; };

const TIPOS_META: Meta['tipo'][] = ['frases', 'tarefas', 'rotinas', 'palavras_novas', 'pranchas'];

export const sanear = (bruto: unknown, padrao: EstadoRotina): EstadoRotina => {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return padrao;
  const b = bruto as Partial<EstadoRotina>;
  // SEGURANÇA/ROBUSTEZ: tudo o que vem do armazenamento é conferido campo a campo.
  // Um item corrompido ou adulterado é descartado (ou volta ao padrão) sem derrubar o app nem apagar o resto.
  const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  const arr = <T,>(x: unknown, d: T[]) => (Array.isArray(x) ? (x.filter(obj) as unknown as T[]) : d);
  const txt = (x: unknown, n: number, d = '') => (typeof x === 'string' ? x.slice(0, n) : d);
  const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
  const num = (x: unknown) => (Number.isFinite(numero(x)) ? numero(x) : 0);
  const textos = (x: unknown) => (Array.isArray(x) ? x.filter((w) => w !== null && w !== undefined && typeof w !== 'object').map((w) => String(w).slice(0, LIMITE_NOME)) : []);
  const comId = <T extends { id?: unknown }>(l: T[]) => l.filter((x) => typeof x.id === 'string' && x.id.length > 0 && x.id.length < 100);
  const mapaNum = (x: unknown): Record<string, number> => {
    if (!obj(x)) return {};
    const o: Record<string, number> = {};
    for (const [k, v] of Object.entries(x)) if (Number.isFinite(numero(v))) o[k.slice(0, 200)] = Math.max(0, numero(v));
    return o;
  };

  const pc = padrao.config;
  const bc = obj(b.config) ? (b.config as Partial<ConfigRotina>) : {};
  const config: ConfigRotina = {
    ...pc,
    ...bc,
    modoFoco: typeof bc.modoFoco === 'string' ? bc.modoFoco : pc.modoFoco,
    travarHorario: bool(bc.travarHorario, pc.travarHorario),
    senhaPais: bool(bc.senhaPais, pc.senhaPais),
    sonsSuaves: bool(bc.sonsSuaves, pc.sonsSuaves),
    mostrarNaHome: bool(bc.mostrarNaHome, pc.mostrarNaHome),
    falarTarefa: bool(bc.falarTarefa, pc.falarTarefa),
    premiarFala: bool(bc.premiarFala, pc.premiarFala),
    limiteFalaDia: inteiro(bc.limiteFalaDia, 0, 100, pc.limiteFalaDia),
    intervaloFalaSeg: inteiro(bc.intervaloFalaSeg, 0, 3600, pc.intervaloFalaSeg),
    bonusRotina: inteiro(bc.bonusRotina, 0, 20, pc.bonusRotina),
    minimoSemTimerSeg: inteiro(bc.minimoSemTimerSeg, 0, 600, pc.minimoSemTimerSeg),
    segurarAdultoSeg: inteiro(bc.segurarAdultoSeg, 2, 10, pc.segurarAdultoSeg ?? 3),
    personagem: bc.personagem === 'menina' ? 'menina' : 'menino',
    nomeCrianca: txt(bc.nomeCrianca, 40, pc.nomeCrianca || ''),
    premioModo: bc.premioModo === 'espera' || bc.premioModo === 'intervalo' ? bc.premioModo : 'imediato',
    premioMin: inteiro(bc.premioMin, 1, 120, 5),
    frasesLista: Array.isArray(bc.frasesLista) ? comId(arr<NonNullable<ConfigRotina['frasesLista']>[number]>(bc.frasesLista, [])).map((f) => ({ ...f, palavras: textos(f.palavras).slice(0, 12) })).filter((f) => f.palavras.length) : undefined,
    frasesOcultas: Array.isArray(bc.frasesOcultas) ? textos(bc.frasesOcultas) : [],
  };

  const tarefas = comId(arr<Tarefa>(b.tarefas, padrao.tarefas)).map((t) => ({
    ...t,
    abaId: txt(t.abaId, 100), titulo: txt(t.titulo, LIMITE_NOME), icone: txt(t.icone, 40, '⭐'),
    horario: typeof t.horario === 'string' && /^\d{1,2}:\d{2}$/.test(t.horario) ? t.horario : undefined,
    // SEGURANÇA (v14): só imagens do próprio celular (pasta do app/galeria/data:) ou pictogramas da ARASAAC — nada de http:, javascript: ou sites de fora
    imagemUri: imagemLocal(t.imagemUri),
    travarAteHorario: bool(t.travarAteHorario, false), alarme: bool(t.alarme, false),
    estrelas: inteiro(t.estrelas, 0, 20, 1),
    dias: Array.isArray(t.dias) ? t.dias.map(numero).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
    duracaoMin: inteiro(t.duracaoMin, 0, 240, 0),
  }));

  // concluídas: { dia: { aba: [ids] } }
  const concluidas: EstadoRotina['concluidas'] = {};
  if (obj(b.concluidas)) for (const [dia, abas] of Object.entries(b.concluidas)) {
    if (!obj(abas)) continue;
    const d: Record<string, string[]> = {};
    for (const [aba, ids] of Object.entries(abas)) if (Array.isArray(ids)) d[aba] = ids.filter((x) => typeof x === 'string');
    concluidas[dia] = d;
  }
  const metasPagas: Record<string, boolean> = {};
  if (obj(b.metasPagas)) for (const [k, v] of Object.entries(b.metasPagas)) if (v === true) metasPagas[k] = true;

  const s: EstadoRotina = {
    ...padrao,
    ...b,
    abas: comId(arr<EstadoRotina['abas'][number]>(b.abas, padrao.abas)).map((a) => ({ ...a, nome: corta(a.nome, LIMITE_NOME) })),
    tarefas,
    recompensas: comId(arr<EstadoRotina['recompensas'][number]>(b.recompensas, padrao.recompensas)).map((r) => ({ ...r, titulo: corta(r.titulo, LIMITE_NOME), icone: txt(r.icone, 40, '🎁'), custo: inteiro(r.custo, 1, 999, 5), esperaMin: inteiro(r.esperaMin, 0, 120, 0) })),
    metas: comId(arr<EstadoRotina['metas'][number]>(b.metas, padrao.metas)).map((m) => ({ ...m, titulo: corta(m.titulo, LIMITE_NOME), icone: txt(m.icone, 40, '🎯'), tipo: TIPOS_META.includes(m.tipo) ? m.tipo : 'frases', periodo: m.periodo === 'semana' ? 'semana' : 'dia', ativa: bool(m.ativa, false), alvo: inteiro(m.alvo, 1, 500, 1), premio: inteiro(m.premio, 0, 100, 0) })),
    config,
    v14: sanearConfigV14(b.v14),
    estrelas: inteiro(b.estrelas, 0, 1_000_000, 0),
    concluidas,
    metasPagas,
    palavras: mapaNum(b.palavras),
    uso: mapaNum(b.uso),
    notas: arr<NonNullable<EstadoRotina['notas']>[number]>(b.notas, []).filter((n) => Number.isFinite(numero(n.t))).map((n) => ({ ...n, t: numero(n.t), texto: corta(n.texto, LIMITE_NOTA) })),
    // eventos: só os válidos; textos e números sempre do tipo certo
    log: arr<Evento>(b.log, []).filter((e) => Number.isFinite(numero(e.t)) && typeof e.tipo === 'string').map((e) => {
      const n: Evento = { ...e, t: numero(e.t) };
      if (e.palavras !== undefined) n.palavras = textos(e.palavras);
      for (const k of ['rotulo', 'abaId', 'tarefaId', 'aba', 'quem', 'nota', 'valor', 'sug'] as const) {
        const v = (e as unknown as Record<string, unknown>)[k];
        if (v !== undefined && k !== 'sug') (n as unknown as Record<string, unknown>)[k] = typeof v === 'object' ? undefined : String(v).slice(0, k === 'nota' ? LIMITE_NOTA : LIMITE_NOME);
      }
      for (const k of ['estrelas', 'segundos', 'novas', 'ms', 'sug', 'letras', 'apagadas', 'intensidade', 'duracaoMin', 'esperouMin'] as const) {
        const v = (e as unknown as Record<string, unknown>)[k];
        if (v !== undefined) (n as unknown as Record<string, unknown>)[k] = num(v);
      }
      if (e.gatilhos !== undefined) n.gatilhos = textos(e.gatilhos);
      if (e.ajudou !== undefined) n.ajudou = textos(e.ajudou);
      return n;
    }),
  };
  const ta = s.tarefaAtiva as unknown;
  if (ta && !(obj(ta) && typeof ta.tarefaId === 'string' && typeof ta.abaId === 'string' && s.tarefas.some((t) => t.id === ta.tarefaId) && Number.isFinite(numero(ta.inicio)))) s.tarefaAtiva = undefined;
  else if (s.tarefaAtiva) s.tarefaAtiva = { ...s.tarefaAtiva, inicio: numero(s.tarefaAtiva.inicio), duracaoSeg: inteiro(s.tarefaAtiva.duracaoSeg, 0, 240 * 60, 0) };
  s.proximoPremioEm = Number.isFinite(numero(b.proximoPremioEm)) && numero(b.proximoPremioEm) > 0 ? numero(b.proximoPremioEm) : undefined;
  const ea = s.esperaAtiva as unknown;
  if (ea && !(obj(ea) && Number.isFinite(ea.inicio) && Number.isFinite(ea.fim) && (ea.fim as number) >= (ea.inicio as number) && (ea.fim as number) - (ea.inicio as number) <= 120 * 60000 && s.recompensas.some((r) => r.id === ea.recompensaId))) s.esperaAtiva = undefined;
  return s;
};

/** Usado pelo relatório da aba "Tarefas" do Rotina original (ex.: 4/5 na rotina atual). */
export const resumoAba = (s: EstadoRotina, abaId: string, d = new Date()) => {
  const ts = tarefasDoDia(s, abaId, d);
  const f = feitasDoDia(s, abaId, d);
  return { total: ts.length, feitas: ts.filter((t) => f.includes(t.id)).length };
};

/** Soma tempo de uso (app aberto e na tela) no dia. Divide entre dias se passar da meia-noite. */
export const somarUso = (s: EstadoRotina, inicio: number, fim: number): EstadoRotina => {
  if (!(fim > inicio)) return s;
  const uso = { ...(s.uso || {}) };
  let a = inicio;
  while (a < fim) {
    const d = new Date(a);
    const meiaNoite = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const b = Math.min(fim, meiaNoite);
    const k = chaveDia(a);
    uso[k] = (uso[k] || 0) + Math.round((b - a) / 1000);
    a = b;
  }
  return { ...s, uso };
};
