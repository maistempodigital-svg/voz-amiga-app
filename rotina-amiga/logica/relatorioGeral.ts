// RELATÓRIO GERAL — Comunicação (Voz Amiga) + Rotina (Rotina Amiga) + tempo usando o app.
// Períodos: 7 e 15 dias; 1, 2, 3, 6 e 12 meses (sempre terminando hoje), com comparação com o período anterior.
import { EstadoRotina, Evento, Idioma } from '../tipos';
import { MESES } from '../textos';
import { chaveDia, diaDaChave, inicioDia, pad, somarDias } from './tempo';

/** Períodos prontos, ou datas escolhidas pelos pais: `c:AAAA-MM-DD:AAAA-MM-DD` (início e fim, os dois inclusos). */
export type IdPeriodo = '1d' | '7d' | '15d' | '30d' | '1m' | '2m' | '3m' | '6m' | '12m' | `c:${string}`;
export const PERIODOS: { id: Exclude<IdPeriodo, `c:${string}`>; dias?: number; meses?: number; rotulo: Record<Idioma, string>; oculto?: boolean }[] = [
  { id: '1d', dias: 1, rotulo: { pt: 'Hoje', en: 'Today', es: 'Hoy' } },
  { id: '7d', dias: 7, rotulo: { pt: '7 dias', en: '7 days', es: '7 días' } },
  { id: '15d', dias: 15, rotulo: { pt: '15 dias', en: '15 days', es: '15 días' } },
  { id: '30d', dias: 30, rotulo: { pt: '30 dias', en: '30 days', es: '30 días' } },
  { id: '1m', meses: 1, rotulo: { pt: '1 mês', en: '1 month', es: '1 mes' }, oculto: true },
  { id: '2m', meses: 2, rotulo: { pt: '2 meses', en: '2 months', es: '2 meses' } },
  { id: '3m', meses: 3, rotulo: { pt: '3 meses', en: '3 months', es: '3 meses' } },
  { id: '6m', meses: 6, rotulo: { pt: '6 meses', en: '6 months', es: '6 meses' } },
  { id: '12m', meses: 12, rotulo: { pt: '12 meses', en: '12 months', es: '12 meses' } },
];

export interface Faixa { rotulo: string; inicio: number; fim: number }
export interface Janela { inicio: number; fim: number; dias: number; faixas: Faixa[]; tipoFaixa: 'dia' | 'semana' | 'mes' }

const dm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

/** Máximo de dias numa escolha livre (2 anos). */
export const MAX_DIAS_LIVRE = 731;
const dataDe = (txt: string): Date | undefined => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt);
  if (!m) return undefined;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : undefined;
};
export const chaveData = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Monta o id de um período livre (datas em qualquer ordem; limitado a 2 anos e a hoje). */
export const periodoLivre = (a: Date, b: Date, hoje = new Date()): IdPeriodo => {
  let ini = inicioDia(a < b ? a : b); let fim = inicioDia(a < b ? b : a);
  const h = inicioDia(hoje);
  if (fim > h) fim = h;
  if (ini > fim) ini = fim;
  if ((fim.getTime() - ini.getTime()) / 86400000 + 1 > MAX_DIAS_LIVRE) ini = somarDias(fim, -(MAX_DIAS_LIVRE - 1));
  return `c:${chaveData(ini)}:${chaveData(fim)}`;
};
/** Início e fim (dia inclusive) de um período livre; undefined se o id não for válido. */
export const lerPeriodoLivre = (id: string): { ini: Date; fim: Date } | undefined => {
  const m = /^c:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (!m) return undefined;
  const ini = dataDe(m[1]); const fim = dataDe(m[2]);
  if (!ini || !fim || ini > fim) return undefined;
  if ((fim.getTime() - ini.getTime()) / 86400000 + 1 > MAX_DIAS_LIVRE + 1) return undefined;
  return { ini, fim };
};
/** Nome do período para mostrar ("7 dias", "Hoje", "10/11 a 14/11"). */
export const rotuloPeriodo = (id: IdPeriodo, idioma: Idioma): string => {
  const p = PERIODOS.find((x) => x.id === id);
  if (p) return p.rotulo[idioma];
  const l = lerPeriodoLivre(id);
  if (!l) return PERIODOS[1].rotulo[idioma];
  const dias = Math.round((l.fim.getTime() - l.ini.getTime()) / 86400000) + 1;
  return idioma === 'en' ? `Chosen dates (${dias} day${dias > 1 ? 's' : ''})` : idioma === 'es' ? `Fechas elegidas (${dias} día${dias > 1 ? 's' : ''})` : `Datas escolhidas (${dias} dia${dias > 1 ? 's' : ''})`;
};

/** Janela que termina no fim de HOJE e volta N dias ou N meses — ou as datas escolhidas pelos pais. */
export const janela = (id: IdPeriodo, hoje = new Date(), idioma: Idioma = 'pt'): Janela => {
  const livre = lerPeriodoLivre(id);
  const p = PERIODOS.find((x) => x.id === id) || PERIODOS[1];
  const fimD = livre ? somarDias(livre.fim, 1) : somarDias(inicioDia(hoje), 1);
  const iniD = livre ? livre.ini : p.dias ? somarDias(fimD, -p.dias) : somarDias(new Date(hoje.getFullYear(), hoje.getMonth() - p.meses!, hoje.getDate()), 1);
  const dias = Math.round((fimD.getTime() - iniD.getTime()) / 86400000);
  const faixas: Faixa[] = [];
  let tipoFaixa: Janela['tipoFaixa'];
  if (dias <= 16) {
    tipoFaixa = 'dia';
    for (let i = 0; i < dias; i++) { const a = somarDias(iniD, i); faixas.push({ rotulo: dm(a), inicio: a.getTime(), fim: somarDias(a, 1).getTime() }); }
  } else if (dias <= 95) {
    tipoFaixa = 'semana';
    let a = iniD;
    while (a < fimD) { let b = somarDias(a, 7); if (b > fimD) b = fimD; faixas.push({ rotulo: dm(a), inicio: a.getTime(), fim: b.getTime() }); a = b; }
  } else {
    tipoFaixa = 'mes';
    let a = iniD;
    while (a < fimD) {
      let b = new Date(a.getFullYear(), a.getMonth() + 1, 1);
      if (b > fimD) b = fimD;
      faixas.push({ rotulo: `${MESES[idioma][a.getMonth()]}`, inicio: a.getTime(), fim: b.getTime() });
      a = b;
    }
  }
  return { inicio: iniD.getTime(), fim: fimD.getTime(), dias, faixas, tipoFaixa };
};

export interface Numeros {
  // Comunicação (Voz Amiga)
  palavrasFaladas: number; // palavras das frases + toques nas pranchas (cada toque fala uma palavra)
  frases: number;
  palavrasDiferentes: number;
  palavrasNovas: number;
  pranchas: number;
  // Rotina
  tarefas: number;
  rotinas: number;
  segundosTarefas: number;
  liberadas: number;
  // App
  segundosUso: number; // só com o app aberto na tela
  diasComUso: number;
  estrelasGanhas: number;
  estrelasGastas: number;
  // Quais partes foram usadas
  vozAtivo: boolean;
  rotinaAtivo: boolean;
  topPalavras: { palavra: string; n: number }[];
  topTarefas: { tarefa: string; n: number }[];
}

const entre = (s: EstadoRotina, a: number, b: number): Evento[] => s.log.filter((e) => e.t >= a && e.t < b);

export const segundosUso = (s: EstadoRotina, a: number, b: number) => {
  let tot = 0; let dias = 0;
  for (const [k, seg] of Object.entries(s.uso || {})) {
    const t = diaDaChave(k).getTime();
    if (t >= inicioDia(new Date(a)).getTime() && t < b && seg > 0) { tot += seg; dias++; }
  }
  return { tot, dias };
};

export const numeros = (s: EstadoRotina, a: number, b: number): Numeros => {
  const ev = entre(s, a, b);
  const pal: Record<string, number> = {};
  const tar: Record<string, number> = {};
  const n: Numeros = { palavrasFaladas: 0, frases: 0, palavrasDiferentes: 0, palavrasNovas: 0, pranchas: 0, tarefas: 0, rotinas: 0, segundosTarefas: 0, liberadas: 0, segundosUso: 0, diasComUso: 0, estrelasGanhas: 0, estrelasGastas: 0, vozAtivo: false, rotinaAtivo: false, topPalavras: [], topTarefas: [] };
  for (const e of ev) {
    if (e.tipo === 'frase') {
      n.frases++; n.palavrasNovas += e.novas || 0;
      for (const w of e.palavras || []) { n.palavrasFaladas++; const k = w.toLowerCase(); pal[k] = (pal[k] || 0) + 1; }
    }
    if (e.tipo === 'prancha') { n.pranchas++; if (e.rotulo) { const k = e.rotulo.toLowerCase(); pal[k] = (pal[k] || 0) + 1; } }
    if (e.tipo === 'tarefa_fim') { n.tarefas++; n.segundosTarefas += e.segundos || 0; if (e.rotulo) tar[e.rotulo] = (tar[e.rotulo] || 0) + 1; }
    if (e.tipo === 'tarefa_liberada') n.liberadas++;
    if (e.tipo === 'rotina_completa') n.rotinas++;
    if ((e.estrelas || 0) > 0) n.estrelasGanhas += e.estrelas || 0;
    if ((e.estrelas || 0) < 0) n.estrelasGastas -= e.estrelas || 0;
  }
  // toque na prancha fora do modo frase = 1 palavra falada; dentro de uma frase já foi contada na frase
  const toquesSoltos = Math.max(0, n.pranchas - ev.filter((e) => e.tipo === 'frase').reduce((x, e) => x + (e.palavras || []).length, 0));
  n.palavrasFaladas += toquesSoltos;
  n.palavrasDiferentes = Object.keys(pal).length;
  const u = segundosUso(s, a, b);
  n.segundosUso = u.tot; n.diasComUso = u.dias;
  n.vozAtivo = n.frases + n.pranchas > 0;
  n.rotinaAtivo = n.tarefas + n.liberadas + n.rotinas > 0 || ev.some((e) => e.tipo === 'tarefa_inicio');
  n.topPalavras = Object.entries(pal).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([palavra, c]) => ({ palavra, n: c }));
  n.topTarefas = Object.entries(tar).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([tarefa, c]) => ({ tarefa, n: c }));
  return n;
};

export interface Ponto { rotulo: string; palavras: number; tarefas: number; minutosUso: number }
export const pontos = (s: EstadoRotina, j: Janela): Ponto[] => j.faixas.map((f) => {
  const x = numeros(s, f.inicio, f.fim);
  return { rotulo: f.rotulo, palavras: x.palavrasFaladas, tarefas: x.tarefas, minutosUso: Math.round(x.segundosUso / 60) };
});

/** Variação em % em relação ao período anterior do mesmo tamanho (undefined se não havia dados antes). */
export const variacao = (agora: number, antes: number) => (antes > 0 ? Math.round(((agora - antes) / antes) * 100) : undefined);

export interface MesUso { rotulo: string; voz: boolean; rotina: boolean; palavras: number; tarefas: number; minutosUso: number }
/** Mês a mês: o que foi usado (Voz, Rotina, os dois ou nenhum). */
export const meses = (s: EstadoRotina, j: Janela, idioma: Idioma = 'pt'): MesUso[] => {
  const out: MesUso[] = [];
  const ini = new Date(j.inicio);
  let a = new Date(ini.getFullYear(), ini.getMonth(), 1);
  while (a.getTime() < j.fim) {
    const b = new Date(a.getFullYear(), a.getMonth() + 1, 1);
    const x = numeros(s, Math.max(a.getTime(), j.inicio), Math.min(b.getTime(), j.fim));
    out.push({ rotulo: `${MESES[idioma][a.getMonth()]}/${a.getFullYear()}`, voz: x.vozAtivo, rotina: x.rotinaAtivo, palavras: x.palavrasFaladas, tarefas: x.tarefas, minutosUso: Math.round(x.segundosUso / 60) });
    a = b;
  }
  return out;
};

export const tempoTexto = (seg: number) => {
  const m = Math.round(seg / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 ? ` ${pad(m % 60)}min` : ''}`;
};

const seta = (v?: number) => (v === undefined ? '' : v > 0 ? ` (↑ ${v}% vs período anterior)` : v < 0 ? ` (↓ ${-v}% vs período anterior)` : ' (= período anterior)');

/** Texto para mandar ao profissional (WhatsApp). */
export const textoProfissional = (s: EstadoRotina, id: IdPeriodo, hoje = new Date(), idioma: Idioma = 'pt', nomeCrianca?: string) => {
  const j = janela(id, hoje, idioma);
  const n = numeros(s, j.inicio, j.fim);
  const ant = numeros(s, j.inicio - (j.fim - j.inicio), j.inicio);
  const ini = new Date(j.inicio);
  const fim = somarDias(new Date(j.fim), -1);
  const L: string[] = [];
  L.push(`📊 *Relatório Voz Amiga${nomeCrianca ? ` — ${nomeCrianca}` : ''}*`);
  L.push(`Período: ${rotuloPeriodo(id, idioma)} (${dm(ini)}/${ini.getFullYear()} a ${dm(fim)}/${fim.getFullYear()})`);
  L.push('');
  L.push(`⏱️ *Tempo usando o app:* ${tempoTexto(n.segundosUso)} em ${n.diasComUso} dia(s)${seta(variacao(n.segundosUso, ant.segundosUso))}`);
  if (n.vozAtivo) {
    L.push('');
    L.push('🗣️ *Comunicação (Voz Amiga)*');
    L.push(`• Palavras faladas: ${n.palavrasFaladas}${seta(variacao(n.palavrasFaladas, ant.palavrasFaladas))}`);
    L.push(`• Frases montadas: ${n.frases}${seta(variacao(n.frases, ant.frases))}`);
    L.push(`• Palavras diferentes: ${n.palavrasDiferentes} · palavras novas: ${n.palavrasNovas}`);
    if (n.topPalavras.length) L.push(`• Mais usadas: ${n.topPalavras.slice(0, 6).map((x) => `${x.palavra} (${x.n})`).join(', ')}`);
  } else L.push('', '🗣️ Comunicação (Voz Amiga): não usada no período.');
  if (n.rotinaAtivo) {
    L.push('');
    L.push('📅 *Rotina (Rotina Amiga)*');
    L.push(`• Tarefas concluídas: ${n.tarefas}${seta(variacao(n.tarefas, ant.tarefas))}`);
    L.push(`• Rotinas completas: ${n.rotinas} · tempo nas tarefas: ${tempoTexto(n.segundosTarefas)}`);
    if (n.liberadas) L.push(`• Tarefas liberadas por adulto: ${n.liberadas}`);
    if (n.topTarefas.length) L.push(`• Mais feitas: ${n.topTarefas.slice(0, 5).map((x) => `${x.tarefa} (${x.n})`).join(', ')}`);
  } else L.push('', '📅 Rotina (Rotina Amiga): não usada no período.');
  const ms = meses(s, j, idioma);
  if (ms.length > 1) {
    L.push('');
    L.push('🗓️ *Mês a mês*');
    for (const m of ms) {
      const usado = m.voz && m.rotina ? 'Voz + Rotina' : m.voz ? 'só Voz' : m.rotina ? 'só Rotina' : 'sem uso';
      L.push(`• ${m.rotulo}: ${usado} — ${m.palavras} palavras, ${m.tarefas} tarefas, ${m.minutosUso} min no app`);
    }
  }
  L.push('');
  L.push(`⭐ Estrelas: +${n.estrelasGanhas} ganhas, ${n.estrelasGastas} trocadas por prêmios`);
  L.push('_Gerado pelo app Voz Amiga._');
  return L.join('\n');
};

export const chaveHoje = () => chaveDia(new Date());
