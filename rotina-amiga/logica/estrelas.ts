// Estrelas, metas e conquistas — juntando ROTINA e COMUNICAÇÃO (Voz Amiga).
import { EstadoRotina, Evento, Idioma, Meta } from '../tipos';
import { chaveDia, diaDaChave, inicioDia, inicioSemana, somarDias } from './tempo';
import { rotinaCompleta } from './rotina';

export const normalizar = (w: string) => w.trim().toLowerCase().replace(/[.,!?;:]+$/g, '');

const eventosDoDia = (s: EstadoRotina, agora: number) => {
  const k = chaveDia(agora);
  return s.log.filter((e) => chaveDia(e.t) === k);
};

export const estrelasDaFalaHoje = (s: EstadoRotina, agora = Date.now()) =>
  eventosDoDia(s, agora).filter((e) => e.tipo === 'frase').reduce((a, e) => a + (e.estrelas || 0), 0);

export interface ResultadoFrase {
  estrelas: number;
  motivo?: 'desligado' | 'uma_palavra' | 'intervalo' | 'repetida' | 'limite';
  palavrasNovas: string[];
}

/**
 * Incentiva a FALA sem premiar "apertar sem parar":
 * - frase precisa de 2+ palavras diferentes;
 * - intervalo mínimo entre frases premiadas;
 * - a mesma frase só vale uma vez por dia;
 * - limite diário de estrelas vindas da fala;
 * - +1 extra quando usa uma palavra nova pela primeira vez (máx. +2).
 */
export const avaliarFrase = (s: EstadoRotina, palavras: string[], agora = Date.now()): ResultadoFrase => {
  const distintas = Array.from(new Set(palavras.map(normalizar).filter(Boolean)));
  const palavrasNovas = distintas.filter((w) => !s.palavras[w]);
  const r: ResultadoFrase = { estrelas: 0, palavrasNovas };
  if (!s.config.premiarFala) return { ...r, motivo: 'desligado' };
  if (distintas.length < 2) return { ...r, motivo: 'uma_palavra' };
  const hoje = eventosDoDia(s, agora);
  const ultimaPremiada = [...hoje].reverse().find((e) => e.tipo === 'frase' && (e.estrelas || 0) > 0);
  if (ultimaPremiada && agora - ultimaPremiada.t < s.config.intervaloFalaSeg * 1000) return { ...r, motivo: 'intervalo' };
  const assinatura = [...distintas].sort().join('|');
  const repetida = hoje.some((e) => e.tipo === 'frase' && (e.estrelas || 0) > 0 && Array.from(new Set((e.palavras || []).map(normalizar))).sort().join('|') === assinatura);
  if (repetida) return { ...r, motivo: 'repetida' };
  const resta = s.config.limiteFalaDia - estrelasDaFalaHoje(s, agora);
  if (resta <= 0) return { ...r, motivo: 'limite' };
  const ganho = 1 + Math.min(palavrasNovas.length, 2);
  return { ...r, estrelas: Math.min(ganho, resta) };
};

// ---------- Metas ----------

export const chavePeriodoMeta = (m: Meta, d = new Date()) =>
  m.periodo === 'dia' ? chaveDia(d) : `S${chaveDia(inicioSemana(d))}`;

const dentro = (e: Evento, ini: Date, fim: Date) => e.t >= ini.getTime() && e.t < fim.getTime();

export const contarTipo = (s: EstadoRotina, tipo: Meta['tipo'], ini: Date, fim: Date) => {
  const ev = s.log.filter((e) => dentro(e, ini, fim));
  switch (tipo) {
    case 'frases':
      return ev.filter((e) => e.tipo === 'frase').length;
    case 'tarefas':
      return ev.filter((e) => e.tipo === 'tarefa_fim').length;
    case 'rotinas':
      return ev.filter((e) => e.tipo === 'rotina_completa').length;
    case 'pranchas':
      return ev.filter((e) => e.tipo === 'prancha').length;
    case 'palavras_novas':
      return ev.filter((e) => e.tipo === 'frase').reduce((a, e) => a + (e.novas || 0), 0);
  }
};

export const progressoMeta = (s: EstadoRotina, m: Meta, d = new Date()) => {
  const ini = m.periodo === 'dia' ? inicioDia(d) : inicioSemana(d);
  const fim = m.periodo === 'dia' ? somarDias(ini, 1) : somarDias(ini, 7);
  const feito = contarTipo(s, m.tipo, ini, fim);
  const pago = !!s.metasPagas[`${m.id}@${chavePeriodoMeta(m, d)}`];
  return { feito: Math.min(feito, m.alvo), alvo: m.alvo, completa: feito >= m.alvo, pago };
};

export const metasParaResgatar = (s: EstadoRotina, d = new Date()) =>
  s.metas.filter((m) => m.ativa).filter((m) => {
    const p = progressoMeta(s, m, d);
    return p.completa && !p.pago;
  }).length;

// ---------- Conquistas ----------

export interface Conquista {
  id: string;
  titulo: string;
  icone: string; // MaterialCommunityIcons
  cor: string;
  fundo: string;
  ganha: boolean;
  progresso: number; // 0..1
}

const diasComRotinaCompleta = (s: EstadoRotina) =>
  Object.keys(s.concluidas).filter((k) => s.abas.some((a) => rotinaCompleta(s, a.id, diaDaChave(k))));

export const sequenciaDias = (s: EstadoRotina, d = new Date()) => {
  const set = new Set(diasComRotinaCompleta(s));
  let n = 0;
  let cur = inicioDia(d);
  if (!set.has(chaveDia(cur))) cur = somarDias(cur, -1);
  while (set.has(chaveDia(cur)) && n < 3650) {
    n++;
    cur = somarDias(cur, -1);
  }
  return n;
};

const NOMES: Record<Idioma, string[]> = {
  pt: ['Primeira tarefa', 'Primeira frase', 'Rotina completa', '3 dias seguidos', '7 dias seguidos', '10 palavras', '50 palavras', '100 frases', '50 tarefas', 'Primeiro prêmio', 'Pediu ajuda', 'Mês de rotina'],
  en: ['First task', 'First sentence', 'Full routine', '3 days in a row', '7 days in a row', '10 words', '50 words', '100 sentences', '50 tasks', 'First prize', 'Asked for help', 'Routine month'],
  es: ['Primera tarea', 'Primera frase', 'Rutina completa', '3 días seguidos', '7 días seguidos', '10 palabras', '50 palabras', '100 frases', '50 tareas', 'Primer premio', 'Pidió ayuda', 'Mes de rutina'],
};

export const conquistas = (s: EstadoRotina, idioma: Idioma = 'pt', d = new Date()): Conquista[] => {
  const tarefas = s.log.filter((e) => e.tipo === 'tarefa_fim').length;
  const frases = s.log.filter((e) => e.tipo === 'frase').length;
  const rotinas = s.log.filter((e) => e.tipo === 'rotina_completa').length;
  const palavras = Object.keys(s.palavras).length;
  const seq = sequenciaDias(s, d);
  const diasCompletos = diasComRotinaCompleta(s).length;
  const premio = s.log.some((e) => e.tipo === 'resgate');
  const ajuda = s.log.some((e) => e.tipo === 'frase' && (e.palavras || []).some((w) => ['ajuda', 'help', 'ayuda'].includes(normalizar(w))));
  const n = NOMES[idioma];
  const p = (v: number, alvo: number) => Math.min(1, v / alvo);
  return [
    { id: 'c1', titulo: n[0], icone: 'check-circle', cor: '#047857', fundo: '#D1FAE5', ganha: tarefas >= 1, progresso: p(tarefas, 1) },
    { id: 'c2', titulo: n[1], icone: 'chat-processing', cor: '#C2410C', fundo: '#FFEDD5', ganha: frases >= 1, progresso: p(frases, 1) },
    { id: 'c3', titulo: n[2], icone: 'flag-checkered', cor: '#1D4ED8', fundo: '#DBEAFE', ganha: rotinas >= 1, progresso: p(rotinas, 1) },
    { id: 'c4', titulo: n[3], icone: 'fire', cor: '#DC2626', fundo: '#FEE2E2', ganha: seq >= 3, progresso: p(seq, 3) },
    { id: 'c5', titulo: n[4], icone: 'calendar-star', cor: '#B45309', fundo: '#FEF3C7', ganha: seq >= 7, progresso: p(seq, 7) },
    { id: 'c6', titulo: n[5], icone: 'alphabetical-variant', cor: '#0E7490', fundo: '#CFFAFE', ganha: palavras >= 10, progresso: p(palavras, 10) },
    { id: 'c7', titulo: n[6], icone: 'book-open-variant', cor: '#15803D', fundo: '#DCFCE7', ganha: palavras >= 50, progresso: p(palavras, 50) },
    { id: 'c8', titulo: n[7], icone: 'account-voice', cor: '#BE185D', fundo: '#FCE7F3', ganha: frases >= 100, progresso: p(frases, 100) },
    { id: 'c9', titulo: n[8], icone: 'medal', cor: '#4338CA', fundo: '#E0E7FF', ganha: tarefas >= 50, progresso: p(tarefas, 50) },
    { id: 'c10', titulo: n[9], icone: 'gift', cor: '#B45309', fundo: '#FEF3C7', ganha: premio, progresso: premio ? 1 : 0 },
    { id: 'c11', titulo: n[10], icone: 'hand-heart', cor: '#BE123C', fundo: '#FFE4E6', ganha: ajuda, progresso: ajuda ? 1 : 0 },
    { id: 'c12', titulo: n[11], icone: 'trophy', cor: '#6D28D9', fundo: '#EDE9FE', ganha: diasCompletos >= 30, progresso: p(diasCompletos, 30) },
  ];
};
