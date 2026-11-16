// VOZ AMIGA v14 — CRESCER COM A CRIANÇA: níveis de frase, grade que cresce e visual por idade.
import { Evento, Idioma } from '../tipos';
import { IdadeVoz, NivelFrase } from './config';

export const NIVEIS: { n: NivelFrase; emoji: string; r: Record<Idioma, string>; d: Record<Idioma, string> }[] = [
  { n: 1, emoji: '1️⃣', r: { pt: 'Uma palavra', en: 'One word', es: 'Una palabra' }, d: { pt: 'Cada toque fala uma palavra. Ideal para começar.', en: 'Each tap says one word. Great to start.', es: 'Cada toque dice una palabra. Ideal para empezar.' } },
  { n: 2, emoji: '2️⃣', r: { pt: 'Duas palavras', en: 'Two words', es: 'Dos palabras' }, d: { pt: 'Junta duas palavras: "quero água", "mais bola".', en: 'Joins two words: "want water", "more ball".', es: 'Junta dos palabras: "quiero agua", "más pelota".' } },
  { n: 3, emoji: '💬', r: { pt: 'Frases', en: 'Sentences', es: 'Frases' }, d: { pt: 'Frases completas, com sugestões.', en: 'Full sentences, with suggestions.', es: 'Frases completas, con sugerencias.' } },
];

/** Quantas palavras cabem na frase em cada nível. */
export const maxPalavras = (nivel: NivelFrase) => (nivel === 1 ? 1 : nivel === 2 ? 2 : 12);

/** Coloca uma palavra na frase respeitando o nível (no nível 1 a palavra nova troca a antiga). */
export const somarPalavra = (frase: string[], w: string, nivel: NivelFrase): string[] => {
  const max = maxPalavras(nivel);
  if (max === 1) return [w];
  return frase.length >= max ? [...frase.slice(-(max - 1)), w] : [...frase, w];
};

const DIA = 86_400_000;

/** Pedidos feitos pela criança (sem contar o modo exemplo dos pais). */
export const falasDaCrianca = (log: Evento[], desde: number) => log.filter((e) => e.t >= desde && (e.tipo === 'frase' || e.tipo === 'prancha') && e.origem !== 'pais');

/**
 * Modo automático: sugere o nível pela idade e pelo uso dos últimos 14 dias.
 * Sobe de 1 para 2 com 30 toques em 8 palavras diferentes; de 2 para 3 com 15 frases de 2 palavras. Nunca desce sozinho.
 */
export const nivelAutomatico = (atual: NivelFrase, log: Evento[], agora: number, idadeAnos: number): NivelFrase => {
  const recentes = falasDaCrianca(log, agora - 14 * DIA);
  const toques = recentes.filter((e) => e.tipo === 'prancha');
  const diferentes = new Set(toques.map((e) => (e.rotulo || '').toLowerCase()).filter(Boolean)).size;
  const duplas = recentes.filter((e) => e.tipo === 'frase' && (e.palavras?.length || 0) >= 2).length;
  let n: NivelFrase = atual;
  if (n === 1 && ((toques.length >= 30 && diferentes >= 8) || idadeAnos >= 12)) n = 2;
  if (n === 2 && (duplas >= 15 || idadeAnos >= 16)) n = 3;
  return n;
};

/**
 * GRADE QUE CRESCE: mostra só os primeiros `limite` botões (na ordem em que foram criados).
 * Os novos entram no fim, então as palavras antigas nunca mudam de lugar. 0 = mostrar todos.
 */
export const pranchasVisiveis = <P,>(todas: P[], limite: number): P[] => (limite > 0 ? todas.slice(0, limite) : todas);

/** O app sugere aumentar quando a criança usou quase todos os botões que aparecem (últimos 7 dias). */
export const sugerirAumentarGrade = (visiveis: string[], log: Evento[], agora: number, limite: number): number | undefined => {
  if (limite <= 0 || visiveis.length < limite) return undefined;
  const usados = new Set(falasDaCrianca(log, agora - 7 * DIA).filter((e) => e.tipo === 'prancha').map((e) => (e.rotulo || '').toLowerCase()));
  const n = visiveis.filter((v) => usados.has(v.toLowerCase())).length;
  return n >= Math.ceil(visiveis.length * 0.8) ? Math.min(60, limite + 2) : undefined;
};

/** Visual por idade: muda só cores de fundo, cantos e letras. Nunca tira botões. */
export const VISUAIS: Record<IdadeVoz, { r: Record<Idioma, string>; raio: number; fundo: string; letraMaiuscula: boolean; emojiGrande: boolean }> = {
  crianca: { r: { pt: 'Criança', en: 'Child', es: 'Niño' }, raio: 16, fundo: '#EFF6FF', letraMaiuscula: true, emojiGrande: true },
  adolescente: { r: { pt: 'Adolescente', en: 'Teen', es: 'Adolescente' }, raio: 12, fundo: '#F1F5F9', letraMaiuscula: true, emojiGrande: false },
  adulto: { r: { pt: 'Adulto', en: 'Adult', es: 'Adulto' }, raio: 8, fundo: '#F8FAFC', letraMaiuscula: false, emojiGrande: false },
};

// ----------------------------------------------------------------- MARCOS (guardados sem pop-up)
export interface DefMarco { id: string; emoji: string; r: Record<Idioma, string>; teste: (log: Evento[]) => boolean }
const toquesCrianca = (log: Evento[]) => log.filter((e) => e.tipo === 'prancha' && e.origem !== 'pais');
const frasesCrianca = (log: Evento[]) => log.filter((e) => e.tipo === 'frase' && e.origem !== 'pais');
export const MARCOS: DefMarco[] = [
  { id: 'primeiroToque', emoji: '👆', r: { pt: 'Primeiro toque sozinho', en: 'First tap alone', es: 'Primer toque solo' }, teste: (l) => toquesCrianca(l).length >= 1 },
  { id: 'dezPalavras', emoji: '🔟', r: { pt: '10 palavras diferentes', en: '10 different words', es: '10 palabras diferentes' }, teste: (l) => new Set(toquesCrianca(l).map((e) => (e.rotulo || '').toLowerCase())).size >= 10 },
  { id: 'duasPalavras', emoji: '2️⃣', r: { pt: 'Primeira frase de 2 palavras', en: 'First 2-word sentence', es: 'Primera frase de 2 palabras' }, teste: (l) => frasesCrianca(l).some((e) => (e.palavras?.length || 0) >= 2) },
  { id: 'tresPalavras', emoji: '💬', r: { pt: 'Primeira frase de 3 palavras', en: 'First 3-word sentence', es: 'Primera frase de 3 palabras' }, teste: (l) => frasesCrianca(l).some((e) => (e.palavras?.length || 0) >= 3) },
  { id: 'cemToques', emoji: '💯', r: { pt: '100 pedidos', en: '100 requests', es: '100 pedidos' }, teste: (l) => toquesCrianca(l).length + frasesCrianca(l).length >= 100 },
  { id: 'sentimento', emoji: '❤️', r: { pt: 'Contou como se sente', en: 'Shared a feeling', es: 'Contó cómo se siente' }, teste: (l) => l.some((e) => e.tipo === 'sentimento' as Evento['tipo']) },
];

/** Marcos novos (ainda não guardados). */
export const marcosNovos = (log: Evento[], ja: Record<string, number>): string[] => MARCOS.filter((m) => !ja[m.id] && m.teste(log)).map((m) => m.id);
