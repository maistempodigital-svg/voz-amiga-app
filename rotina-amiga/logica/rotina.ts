import { AbaRotina, EstadoRotina, Tarefa, TarefaAtiva } from '../tipos';
import { chaveDia, minDoDia, paraMin } from './tempo';

/** Tarefas da aba que aparecem neste dia, em ordem de horário (sem horário mantém a ordem e vai depois). */
export const tarefasDoDia = (s: EstadoRotina, abaId: string, d = new Date()): Tarefa[] => {
  const dow = d.getDay();
  const lista = s.tarefas.filter((t) => t.abaId === abaId && t.dias.includes(dow));
  return lista
    .map((t, i) => ({ t, i, m: paraMin(t.horario) }))
    .sort((a, b) => {
      if (a.m === undefined && b.m === undefined) return a.i - b.i;
      if (a.m === undefined) return 1;
      if (b.m === undefined) return -1;
      return a.m - b.m || a.i - b.i;
    })
    .map((x) => x.t);
};

export const feitasDoDia = (s: EstadoRotina, abaId: string, d = new Date()): string[] => { const v = s.concluidas?.[chaveDia(d)]?.[abaId]; return Array.isArray(v) ? v : []; };

export const rotinaCompleta = (s: EstadoRotina, abaId: string, d = new Date()) => {
  const ts = tarefasDoDia(s, abaId, d);
  const f = feitasDoDia(s, abaId, d);
  return ts.length > 0 && ts.every((t) => f.includes(t.id));
};

const primeiroHorario = (ts: Tarefa[]) => {
  const ms = ts.map((t) => paraMin(t.horario)).filter((m): m is number => m !== undefined);
  return ms.length ? Math.min(...ms) : undefined;
};

/** Antecedência (min) com que a próxima rotina já aparece na tela inicial. */
export const ANTECEDENCIA_MIN = 30;

/**
 * Rotina do momento.
 * - Modo foco: sempre a aba escolhida.
 * - Senão: a rotina com horário que já começou (ou começa em até 30 min) e ainda tem tarefas pendentes;
 *   se houver mais de uma, a que começou por último.
 * - Abas cujas tarefas não têm horário entram por último (quando não há rotina com horário acontecendo).
 */
export const abaDoMomento = (s: EstadoRotina, d = new Date()): AbaRotina | undefined => {
  if (false && s.config.modoFoco && s.config.modoFoco !== 'none') { // modo foco removido: a tela já mostra só a tarefa da vez
    return s.abas.find((a) => a.id === s.config.modoFoco);
  }
  const agora = minDoDia(d);
  let melhor: AbaRotina | undefined;
  let melhorInicio = -1;
  for (const a of s.abas) {
    const ts = tarefasDoDia(s, a.id, d);
    if (!ts.length) continue;
    const ini = primeiroHorario(ts) ?? -1; // sem horário: disponível o dia todo, prioridade mais baixa
    const pendente = ts.some((t) => !feitasDoDia(s, a.id, d).includes(t.id));
    if (pendente && ini <= agora + ANTECEDENCIA_MIN && (ini > melhorInicio || !melhor)) {
      melhor = a;
      melhorInicio = ini;
    }
  }
  return melhor;
};

export interface Etapa {
  aba: AbaRotina;
  tarefa: Tarefa;
  indice: number; // 0-based
  total: number;
  feitas: number;
  /** Preenchido quando a tarefa está travada até o horário. */
  bloqueadaAte?: string;
  ativa?: TarefaAtiva;
}

export const travadaAte = (s: EstadoRotina, t: Tarefa, d = new Date()) => {
  if (!s.config.travarHorario || !t.travarAteHorario) return undefined;
  const m = paraMin(t.horario);
  if (m === undefined || minDoDia(d) >= m) return undefined;
  return t.horario;
};

/** A ÚNICA coisa que a criança vê na tela inicial: a próxima etapa (ou a que está em andamento). */
export const proximaEtapa = (s: EstadoRotina, d = new Date()): Etapa | undefined => {
  if (s.tarefaAtiva) {
    const t = s.tarefas.find((x) => x.id === s.tarefaAtiva!.tarefaId);
    const a = s.abas.find((x) => x.id === s.tarefaAtiva!.abaId);
    if (t && a) {
      const ts = tarefasDoDia(s, a.id, d);
      const f = feitasDoDia(s, a.id, d);
      return { aba: a, tarefa: t, indice: Math.max(0, ts.findIndex((x) => x.id === t.id)), total: ts.length, feitas: f.filter((id) => ts.some((x) => x.id === id)).length, ativa: s.tarefaAtiva };
    }
  }
  const aba = abaDoMomento(s, d);
  if (!aba) return undefined;
  const ts = tarefasDoDia(s, aba.id, d);
  const f = feitasDoDia(s, aba.id, d);
  const idx = ts.findIndex((t) => !f.includes(t.id));
  if (idx < 0) return undefined;
  const tarefa = ts[idx];
  return { aba, tarefa, indice: idx, total: ts.length, feitas: ts.filter((t) => f.includes(t.id)).length, bloqueadaAte: travadaAte(s, tarefa, d) };
};

/** A criança pode marcar como feita? Com temporizador só quando o tempo acaba; sem temporizador após o mínimo. */
export const podeTerminar = (s: EstadoRotina, agora = Date.now()) => {
  const a = s.tarefaAtiva;
  if (!a) return false;
  const min = a.duracaoSeg > 0 ? a.duracaoSeg : Math.max(0, s.config.minimoSemTimerSeg);
  return agora - a.inicio >= min * 1000;
};

export const segundosRestantes = (a: TarefaAtiva, agora = Date.now()) =>
  a.duracaoSeg > 0 ? Math.max(0, a.duracaoSeg - (agora - a.inicio) / 1000) : 0;

/** Tarefas com alarme que tocam neste minuto (para o aviso dentro do app). */
export const alarmesAgora = (s: EstadoRotina, d = new Date()) => {
  const m = minDoDia(d);
  return s.tarefas.filter((t) => t.alarme && t.dias.includes(d.getDay()) && paraMin(t.horario) === m && !feitasDoDia(s, t.abaId, d).includes(t.id));
};
