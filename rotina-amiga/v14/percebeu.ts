// VOZ AMIGA v14.2 — "O QUE O APP PERCEBEU": observações automáticas com o tempo de uso (Voz + Rotina).
// São padrões simples, contados no próprio aparelho. Servem para conversar com quem acompanha a criança — não são diagnóstico.
import { EstadoRotina, Evento, Idioma } from '../tipos';
import { chaveDia } from '../logica/tempo';

type L = Record<Idioma, string>;
const X = (i: Idioma, l: L) => l[i];
const crianca = (e: Evento) => (e.tipo === 'prancha' || e.tipo === 'frase') && e.origem !== 'pais';
const FAIXAS: [number, number, L][] = [[5, 12, { pt: 'de manhã', en: 'in the morning', es: 'por la mañana' }], [12, 18, { pt: 'à tarde', en: 'in the afternoon', es: 'por la tarde' }], [18, 24, { pt: 'à noite', en: 'in the evening', es: 'por la noche' }], [0, 5, { pt: 'de madrugada', en: 'late at night', es: 'de madrugada' }]];
const DIAS: L[] = [
  { pt: 'domingo', en: 'Sunday', es: 'domingo' }, { pt: 'segunda', en: 'Monday', es: 'lunes' }, { pt: 'terça', en: 'Tuesday', es: 'martes' }, { pt: 'quarta', en: 'Wednesday', es: 'miércoles' },
  { pt: 'quinta', en: 'Thursday', es: 'jueves' }, { pt: 'sexta', en: 'Friday', es: 'viernes' }, { pt: 'sábado', en: 'Saturday', es: 'sábado' },
];
const faixa = (h: number) => FAIXAS.find(([a, b]) => h >= a && h < b)!;
const maisComum = <T,>(l: T[]): [T, number] | undefined => { const m = new Map<T, number>(); l.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1])[0]; };

/** Até 6 frases curtas sobre o período. */
export const oQueOAppPercebeu = (s: EstadoRotina, inicio: number, fim: number, idioma: Idioma): string[] => {
  const ev = s.log.filter((e) => e.t >= inicio && e.t < fim);
  const out: string[] = [];
  const pedidos = ev.filter(crianca);
  if (pedidos.length >= 5) {
    const f = maisComum(pedidos.map((e) => faixa(new Date(e.t).getHours())[2]))!;
    out.push(X(idioma, { pt: `A criança se comunica mais ${f[0].pt}.`, en: `The child communicates most ${f[0].en}.`, es: `El niño se comunica más ${f[0].es}.` }));
    const d = maisComum(pedidos.map((e) => new Date(e.t).getDay()))!;
    out.push(X(idioma, { pt: `O dia com mais pedidos é ${DIAS[d[0]].pt}.`, en: `The day with most requests is ${DIAS[d[0]].en}.`, es: `El día con más pedidos es ${DIAS[d[0]].es}.` }));
    const w = maisComum(pedidos.flatMap((e) => (e.tipo === 'prancha' ? [e.rotulo || ''] : e.palavras || [])).map((x) => x.toLowerCase()).filter(Boolean));
    if (w) out.push(X(idioma, { pt: `A palavra mais pedida foi "${w[0]}" (${w[1]} vezes).`, en: `The most requested word was "${w[0]}" (${w[1]} times).`, es: `La palabra más pedida fue "${w[0]}" (${w[1]} veces).` }));
    const meio = inicio + (fim - inicio) / 2;
    const a = pedidos.filter((e) => e.t < meio).length; const b = pedidos.length - a;
    if (a >= 3 && Math.abs(b - a) / a >= 0.25) out.push(b > a
      ? X(idioma, { pt: `Os pedidos aumentaram ${Math.round(((b - a) / a) * 100)}% na segunda metade do período.`, en: `Requests went up ${Math.round(((b - a) / a) * 100)}% in the second half of the period.`, es: `Los pedidos subieron ${Math.round(((b - a) / a) * 100)}% en la segunda mitad del período.` })
      : X(idioma, { pt: `Os pedidos diminuíram ${Math.round(((a - b) / a) * 100)}% na segunda metade do período.`, en: `Requests went down ${Math.round(((a - b) / a) * 100)}% in the second half of the period.`, es: `Los pedidos bajaron ${Math.round(((a - b) / a) * 100)}% en la segunda mitad del período.` }));
  }
  const incompletas = ev.filter((e) => e.tipo === 'frase_incompleta').length;
  if (incompletas >= 3 && incompletas > pedidos.filter((e) => e.tipo === 'frase').length / 2) out.push(X(idioma, { pt: `Muitas frases ficaram sem o FALAR (${incompletas}). Mostre o botão FALAR junto com a criança.`, en: `Many sentences were left without SPEAK (${incompletas}). Show the SPEAK button together.`, es: `Muchas frases quedaron sin HABLAR (${incompletas}). Muestra el botón HABLAR junto al niño.` }));
  const dias = new Set(ev.map((e) => chaveDia(new Date(e.t)))).size;
  const rot = new Set(ev.filter((e) => e.tipo === 'rotina_completa').map((e) => chaveDia(new Date(e.t)))).size;
  if (dias >= 3 && rot > 0) out.push(X(idioma, { pt: `A rotina foi completada em ${rot} de ${dias} dias de uso.`, en: `The routine was completed on ${rot} of ${dias} days of use.`, es: `La rutina se completó en ${rot} de ${dias} días de uso.` }));
  const crises = ev.filter((e) => e.tipo === 'crise');
  if (crises.length >= 2) {
    const f = maisComum(crises.map((e) => faixa(new Date(e.t).getHours())[2]))!;
    out.push(X(idioma, { pt: `Os momentos difíceis aconteceram mais ${f[0].pt}.`, en: `Hard moments happened most ${f[0].en}.`, es: `Los momentos difíciles ocurrieron más ${f[0].es}.` }));
  }
  const modelo = ev.filter((e) => e.tipo === 'modelo').length;
  if (pedidos.length >= 10 && modelo === 0) out.push(X(idioma, { pt: 'Ainda não houve modo exemplo. Mostrar as palavras no app ajuda a criança a aprender.', en: 'No show-me mode yet. Showing words on the app helps the child learn.', es: 'Aún no hubo modo ejemplo. Mostrar palabras en la app ayuda a aprender.' }));
  return out.slice(0, 6);
};

export const TITULO_PERCEBEU: L = { pt: 'O que o app percebeu', en: 'What the app noticed', es: 'Lo que la app notó' };
