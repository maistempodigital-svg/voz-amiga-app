// Relatório unificado (Rotina + Voz): dia / semana / mês / ano.
import { EstadoRotina, Evento, Idioma } from '../tipos';
import { DIAS_ABREV, MESES } from '../textos';
import { chaveDia, inicioDia, inicioSemana, pad, somarDias } from './tempo';

export type Periodo = 'dia' | 'semana' | 'mes' | 'ano';

export interface Faixa {
  rotulo: string;
  inicio: number;
  fim: number;
}

export interface Intervalo {
  inicio: number;
  fim: number;
  titulo: string;
  faixas: Faixa[];
}

export const intervalo = (p: Periodo, ref: Date, idioma: Idioma = 'pt'): Intervalo => {
  const M = MESES[idioma];
  const D = DIAS_ABREV[idioma];
  if (p === 'dia') {
    const ini = inicioDia(ref);
    const faixas: Faixa[] = [];
    for (let h = 6; h < 24; h += 3) {
      const a = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), h === 6 ? 0 : h);
      const b = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), h + 3);
      faixas.push({ rotulo: `${pad(h)}h`, inicio: a.getTime(), fim: b.getTime() });
    }
    return { inicio: ini.getTime(), fim: somarDias(ini, 1).getTime(), titulo: `${D[ini.getDay()]}, ${ini.getDate()} ${M[ini.getMonth()]} ${ini.getFullYear()}`, faixas };
  }
  if (p === 'semana') {
    const ini = inicioSemana(ref);
    const faixas = Array.from({ length: 7 }, (_, i) => {
      const a = somarDias(ini, i);
      return { rotulo: `${D[a.getDay()]} ${a.getDate()}`, inicio: a.getTime(), fim: somarDias(a, 1).getTime() };
    });
    const f = somarDias(ini, 6);
    return { inicio: ini.getTime(), fim: somarDias(ini, 7).getTime(), titulo: `${ini.getDate()} ${M[ini.getMonth()]} – ${f.getDate()} ${M[f.getMonth()]}`, faixas };
  }
  if (p === 'mes') {
    const ini = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const faixas: Faixa[] = [];
    let a = ini;
    while (a < fim) {
      let b = somarDias(a, 7);
      if (b > fim) b = fim;
      faixas.push({ rotulo: `${a.getDate()}–${somarDias(b, -1).getDate()}`, inicio: a.getTime(), fim: b.getTime() });
      a = b;
    }
    return { inicio: ini.getTime(), fim: fim.getTime(), titulo: `${M[ini.getMonth()]} ${ini.getFullYear()}`, faixas };
  }
  const ini = new Date(ref.getFullYear(), 0, 1);
  const faixas = Array.from({ length: 12 }, (_, i) => ({ rotulo: M[i], inicio: new Date(ref.getFullYear(), i, 1).getTime(), fim: new Date(ref.getFullYear(), i + 1, 1).getTime() }));
  return { inicio: ini.getTime(), fim: new Date(ref.getFullYear() + 1, 0, 1).getTime(), titulo: `${ref.getFullYear()}`, faixas };
};

export const deslocar = (p: Periodo, ref: Date, n: number) => {
  if (p === 'dia') return somarDias(ref, n);
  if (p === 'semana') return somarDias(ref, 7 * n);
  if (p === 'mes') return new Date(ref.getFullYear(), ref.getMonth() + n, 1);
  return new Date(ref.getFullYear() + n, 0, 1);
};

export interface Resumo {
  tarefas: number;
  rotinas: number;
  segundos: number;
  frases: number;
  pranchas: number;
  palavrasNovas: number;
  ganhas: number;
  gastas: number;
  liberadas: number;
  diasAtivos: number;
  topPalavras: { palavra: string; n: number }[];
  topTarefas: { tarefa: string; n: number }[];
}

const entre = (s: EstadoRotina, ini: number, fim: number) => s.log.filter((e) => e.t >= ini && e.t < fim);

export const resumo = (s: EstadoRotina, ini: number, fim: number): Resumo => {
  const ev = entre(s, ini, fim);
  const pal: Record<string, number> = {};
  const tar: Record<string, number> = {};
  const dias = new Set<string>();
  const r: Resumo = { tarefas: 0, rotinas: 0, segundos: 0, frases: 0, pranchas: 0, palavrasNovas: 0, ganhas: 0, gastas: 0, liberadas: 0, diasAtivos: 0, topPalavras: [], topTarefas: [] };
  for (const e of ev) {
    if (e.tipo !== 'tarefa_inicio') dias.add(chaveDia(e.t));
    if (e.tipo === 'tarefa_fim') { r.tarefas++; r.segundos += e.segundos || 0; if (e.rotulo) tar[e.rotulo] = (tar[e.rotulo] || 0) + 1; }
    if (e.tipo === 'tarefa_liberada') { r.liberadas++; r.segundos += e.segundos || 0; }
    if (e.tipo === 'rotina_completa') r.rotinas++;
    if (e.tipo === 'frase') { r.frases++; r.palavrasNovas += e.novas || 0; for (const w of e.palavras || []) { const k = w.toLowerCase(); pal[k] = (pal[k] || 0) + 1; } }
    if (e.tipo === 'prancha') r.pranchas++;
    if ((e.estrelas || 0) > 0) r.ganhas += e.estrelas || 0;
    if ((e.estrelas || 0) < 0) r.gastas += -(e.estrelas || 0);
  }
  r.diasAtivos = dias.size;
  r.topPalavras = Object.entries(pal).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([palavra, n]) => ({ palavra, n }));
  r.topTarefas = Object.entries(tar).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tarefa, n]) => ({ tarefa, n }));
  return r;
};

export interface PontoSerie {
  rotulo: string;
  rotina: number; // tarefas concluídas
  voz: number; // frases faladas
}

export const serie = (s: EstadoRotina, it: Intervalo): PontoSerie[] =>
  it.faixas.map((f) => {
    const ev = entre(s, f.inicio, f.fim);
    return { rotulo: f.rotulo, rotina: ev.filter((e) => e.tipo === 'tarefa_fim').length, voz: ev.filter((e) => e.tipo === 'frase').length };
  });

// ----- Aba "Relatórios" do Rotina original: últimos 7 dias / mensal -----

export interface BarraDia {
  chave: string;
  rotulo: string;
  data: Date;
  tarefas: number;
  segundos: number;
}

export const ultimosDias = (s: EstadoRotina, n: number, hoje = new Date(), idioma: Idioma = 'pt'): BarraDia[] => {
  const D = DIAS_ABREV[idioma];
  return Array.from({ length: n }, (_, i) => {
    const d = somarDias(inicioDia(hoje), i - (n - 1));
    const ev = entre(s, d.getTime(), somarDias(d, 1).getTime()).filter((e) => e.tipo === 'tarefa_fim');
    return { chave: chaveDia(d), rotulo: n <= 7 ? `${D[d.getDay()]} ${d.getDate()}` : `${d.getDate()}`, data: d, tarefas: ev.length, segundos: ev.reduce((a, e) => a + (e.segundos || 0), 0) };
  });
};

/** Mensal no estilo do Rotina: 4 barras (semanas dos últimos 28 dias). */
export const ultimasSemanas = (s: EstadoRotina, hoje = new Date(), idioma: Idioma = 'pt'): BarraDia[] => {
  const M = MESES[idioma];
  return Array.from({ length: 4 }, (_, i) => {
    const fim = somarDias(inicioDia(hoje), 1 - (3 - i) * 7);
    const ini = somarDias(fim, -7);
    const ev = entre(s, ini.getTime(), fim.getTime()).filter((e) => e.tipo === 'tarefa_fim');
    const ult = somarDias(fim, -1);
    return { chave: chaveDia(ini), rotulo: `${ini.getDate()}/${M[ini.getMonth()]}`, data: ult, tarefas: ev.length, segundos: ev.reduce((a, e) => a + (e.segundos || 0), 0) };
  });
};

export const textoCompartilhar = (s: EstadoRotina, p: Periodo, ref: Date, idioma: Idioma, rot: (k: string) => string) => {
  const it = intervalo(p, ref, idioma);
  const r = resumo(s, it.inicio, it.fim);
  const linhas = [
    `${rot('fullReport')} — Voz Amiga`,
    it.titulo,
    '',
    `${rot('tasksDone')}: ${r.tarefas}`,
    `${rot('routinesDone')}: ${r.rotinas}`,
    `${rot('timeInTasks')}: ${Math.round(r.segundos / 60)} min`,
    `${rot('phrasesSpoken')}: ${r.frases}`,
    `${rot('boardsTapped')}: ${r.pranchas}`,
    `${rot('newWords')}: ${r.palavrasNovas}`,
    `${rot('starsEarned')}: ${r.ganhas}`,
    `${rot('starsSpent')}: ${r.gastas}`,
    `${rot('adultReleases')}: ${r.liberadas}`,
  ];
  if (r.topPalavras.length) linhas.push('', `${rot('topWords')}: ${r.topPalavras.map((x) => `${x.palavra} (${x.n})`).join(', ')}`);
  if (r.topTarefas.length) linhas.push(`${rot('tasksRanking')}: ${r.topTarefas.map((x) => `${x.tarefa} (${x.n})`).join(', ')}`);
  return linhas.join('\n');
};

export type { Evento };
