// VOZ AMIGA v14.2 — CONQUISTAS DO MÊS (o app escolhe sozinho e RENOVA todo mês)
// Base profissional: as funções da comunicação na CAA — pedir o que quer, interagir socialmente (cumprimentar),
// compartilhar informação/sentimentos e recusar/protestar (Light, 1988) — e a orientação da ASHA de usar a CAA
// todos os dias, em situações reais, valorizando a comunicação ESPONTÂNEA (feita pela criança sozinha).
// Duas conquistas valem todo mês (uso e pedidos sozinho); as outras giram de mês em mês para sempre ter novidade.
// Os pais também podem criar conquistas da família (ficam em ConfigV14.conquistasPais).
import { EstadoRotina, Evento, Idioma } from '../tipos';
import { chaveDia } from '../logica/tempo';

type L = Record<Idioma, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });
const sem = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const PAL = {
  sentir: ['feliz', 'triste', 'bravo', 'brava', 'cansado', 'cansada', 'medo', 'alegre', 'happy', 'sad', 'angry', 'tired', 'scared', 'enojado', 'cansado', 'miedo', 'contento'],
  social: ['oi', 'ola', 'tchau', 'bom dia', 'boa noite', 'obrigado', 'obrigada', 'hi', 'hello', 'bye', 'thanks', 'hola', 'chao', 'adios', 'gracias'],
  ajuda: ['ajuda', 'help', 'ayuda'],
  recusa: ['nao', 'no', 'parar', 'stop', 'chega', 'basta'],
  pergunta: ['onde', 'quem', 'que', 'quando', 'por que', 'porque', 'qual', 'where', 'who', 'what', 'when', 'why', 'donde', 'quien', 'cuando', 'por que'],
};

export interface DefConquistaMes { id: string; emoji: string; t: L; alvo: number; fixa?: boolean; medir: (eventos: Evento[], antes: Evento[]) => number }

const daCrianca = (e: Evento) => (e.tipo === 'prancha' || e.tipo === 'frase') && e.origem !== 'pais';
const palavrasDe = (e: Evento) => (e.tipo === 'prancha' ? [e.rotulo || ''] : e.palavras || []).map(sem).filter(Boolean);
const contaCom = (ev: Evento[], lista: string[]) => ev.filter(daCrianca).filter((e) => { const ws = palavrasDe(e); const f = ws.join(' '); return ws.some((w) => lista.includes(w)) || lista.some((x) => x.includes(' ') && f.includes(x)); }).length;

export const POOL_CONQUISTAS: DefConquistaMes[] = [
  { id: 'cm_pedidos', emoji: '🙋', fixa: true, alvo: 20, t: l('Fez 20 pedidos sozinho', 'Made 20 requests alone', 'Hizo 20 pedidos solo'), medir: (ev) => ev.filter(daCrianca).length },
  { id: 'cm_dias', emoji: '📅', fixa: true, alvo: 12, t: l('Usou o app em 12 dias do mês', 'Used the app on 12 days this month', 'Usó la app 12 días del mes'), medir: (ev) => new Set(ev.filter(daCrianca).map((e) => chaveDia(new Date(e.t)))).size },
  { id: 'cm_novas', emoji: '🆕', alvo: 5, t: l('Usou 5 palavras novas', 'Used 5 new words', 'Usó 5 palabras nuevas'), medir: (ev, antes) => { const v = new Set(antes.filter(daCrianca).flatMap(palavrasDe)); const n = new Set<string>(); for (const e of ev.filter(daCrianca)) for (const w of palavrasDe(e)) if (!v.has(w)) n.add(w); return n.size; } },
  { id: 'cm_sentir', emoji: '❤️', alvo: 3, t: l('Contou como se sente 3 vezes', 'Shared a feeling 3 times', 'Contó cómo se siente 3 veces'), medir: (ev) => ev.filter((e) => e.tipo === 'sentimento').length + contaCom(ev, PAL.sentir) },
  { id: 'cm_social', emoji: '👋', alvo: 5, t: l('Cumprimentou ou agradeceu 5 vezes', 'Greeted or thanked 5 times', 'Saludó o agradeció 5 veces'), medir: (ev) => contaCom(ev, PAL.social) },
  { id: 'cm_frases', emoji: '💬', alvo: 10, t: l('Montou 10 frases de 2 palavras ou mais', 'Built 10 sentences of 2+ words', 'Armó 10 frases de 2+ palabras'), medir: (ev) => ev.filter((e) => e.tipo === 'frase' && e.origem !== 'pais' && (e.palavras?.length || 0) >= 2).length },
  { id: 'cm_rotina', emoji: '🗓️', alvo: 8, t: l('Completou a rotina em 8 dias', 'Completed the routine on 8 days', 'Completó la rutina 8 días'), medir: (ev) => new Set(ev.filter((e) => e.tipo === 'rotina_completa').map((e) => chaveDia(new Date(e.t)))).size },
  { id: 'cm_espera', emoji: '⏳', alvo: 3, t: l('Esperou o prêmio com calma 3 vezes', 'Waited calmly for a prize 3 times', 'Esperó el premio con calma 3 veces'), medir: (ev) => ev.filter((e) => e.tipo === 'resgate' && (e.esperouMin || 0) > 0).length },
  { id: 'cm_ajuda', emoji: '🤝', alvo: 2, t: l('Pediu ajuda 2 vezes', 'Asked for help 2 times', 'Pidió ayuda 2 veces'), medir: (ev) => contaCom(ev, PAL.ajuda) },
  { id: 'cm_recusa', emoji: '✋', alvo: 3, t: l('Disse "não" com o app 3 vezes', 'Said "no" with the app 3 times', 'Dijo "no" con la app 3 veces'), medir: (ev) => contaCom(ev, PAL.recusa) },
  { id: 'cm_pergunta', emoji: '❓', alvo: 3, t: l('Fez 3 perguntas', 'Asked 3 questions', 'Hizo 3 preguntas'), medir: (ev) => contaCom(ev, PAL.pergunta) },
  { id: 'cm_teclado', emoji: '⌨️', alvo: 3, t: l('Escreveu no teclado 3 vezes', 'Typed on the keyboard 3 times', 'Escribió en el teclado 3 veces'), medir: (ev) => ev.filter((e) => e.tipo === 'teclado').length },
];

export const FONTE_CONQUISTAS = l(
  'Baseado nas funções da comunicação (pedir, cumprimentar, contar sentimentos, recusar, perguntar — Light, 1988) e na orientação da ASHA de usar a CAA todo dia.',
  'Based on the functions of communication (requesting, greeting, sharing feelings, refusing, asking — Light, 1988) and ASHA guidance to use AAC every day.',
  'Basado en las funciones de la comunicación (pedir, saludar, contar sentimientos, rechazar, preguntar — Light, 1988) y la guía de ASHA de usar la CAA cada día.',
);

/** Quais conquistas valem neste mês: as fixas + 4 que giram (muda todo mês, igual para o mês inteiro). */
export const conquistasDoMes = (ano: number, mes: number): DefConquistaMes[] => {
  const fixas = POOL_CONQUISTAS.filter((c) => c.fixa);
  const giram = POOL_CONQUISTAS.filter((c) => !c.fixa);
  const k = (ano * 12 + mes) % giram.length;
  return [...fixas, ...Array.from({ length: 4 }, (_, i) => giram[(k + i * 3) % giram.length]).filter((c, i, a) => a.indexOf(c) === i)];
};

export interface ProgressoConquista { id: string; emoji: string; titulo: string; feito: number; alvo: number; ganhou: boolean }
/** Progresso de cada conquista do mês atual. */
export const progressoDoMes = (s: EstadoRotina, idioma: Idioma, agora = new Date()): ProgressoConquista[] => {
  const ini = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).getTime();
  const ev = s.log.filter((e) => e.t >= ini && e.t < fim);
  const antes = s.log.filter((e) => e.t < ini);
  return conquistasDoMes(agora.getFullYear(), agora.getMonth()).map((c) => {
    const feito = Math.max(0, Math.round(c.medir(ev, antes)));
    return { id: c.id, emoji: c.emoji, titulo: c.t[idioma], feito, alvo: c.alvo, ganhou: feito >= c.alvo };
  });
};
