// VOZ AMIGA v14.3 — QUANTOS BOTÕES PARA COMEÇAR (o que dizem os especialistas)
// Começar com POUCAS palavras e ir acrescentando, sem mudar as antigas de lugar:
// • AssistiveWare (Progressive Language): o 1º passo mostra 9 palavras principais e cada passo seguinte acrescenta poucas.
// • Little Words (consenso clínico, citando ASHA, Binger & Light 2007): 8 a 16 símbolos na fase dos primeiros pedidos;
//   crianças que ainda descobrem que "tocar faz falar" começam com 2 a 4.
// • ASHA: usar a CAA no dia a dia, em situações reais, com o adulto mostrando (modelagem).
// O número sugerido é 10 (dentro da faixa de 8 a 16 dos primeiros pedidos; pedido do Adriano). Os pais podem pôr mais, se quiserem — é só sugestão.
import { Idioma } from '../tipos';

type L = Record<Idioma, string>;

export const INICIO_BOTOES = 10;

export const DICA_ESPECIALISTAS: L = {
  pt: `Segundo especialistas em comunicação alternativa: comece com poucas palavras (cerca de ${INICIO_BOTOES}) e vá acrescentando aos poucos, sem mudar as antigas de lugar. Você pode pôr mais, se quiser.`,
  en: `According to AAC specialists: start with few words (about ${INICIO_BOTOES}) and add more little by little, without moving the old ones. You can add more if you want.`,
  es: `Según especialistas en comunicación aumentativa: empieza con pocas palabras (unas ${INICIO_BOTOES}) y agrega de a poco, sin mover las anteriores. Puedes poner más si quieres.`,
};

/** Fonte em texto discreto (não é link, não é para clicar). */
export const FONTE_ESPECIALISTAS: L = {
  pt: 'Fontes: AssistiveWare, "Progressive Language" (o 1º passo mostra 9 palavras principais); Little Words, consenso clínico (8 a 16 símbolos nos primeiros pedidos; 2 a 4 para quem está começando); ASHA (usar a CAA no dia a dia, com o adulto mostrando).',
  en: 'Sources: AssistiveWare, "Progressive Language" (step 1 shows 9 core words); Little Words, clinical consensus (8 to 16 symbols for first requests; 2 to 4 for brand-new users); ASHA (use AAC every day, with the adult modeling).',
  es: 'Fuentes: AssistiveWare, "Progressive Language" (el 1.er paso muestra 9 palabras principales); Little Words, consenso clínico (8 a 16 símbolos en los primeros pedidos; 2 a 4 para quien empieza); ASHA (usar la CAA cada día, con el adulto mostrando).',
};

// ------------------------------------------------------------ ARASAAC (texto oficial de crédito, pedido pelo próprio site)
export const CREDITO_ARASAAC: L = {
  pt: 'Os símbolos pictográficos utilizados são propriedade do Governo de Aragão e foram criados por Sergio Palao para o ARASAAC (https://arasaac.org), que os distribui sob Licença Creative Commons (BY-NC-SA).',
  en: 'The pictographic symbols used are the property of the Government of Aragon and have been created by Sergio Palao for ARASAAC (https://arasaac.org), which distributes them under a Creative Commons License (BY-NC-SA).',
  es: 'Los símbolos pictográficos utilizados son propiedad del Gobierno de Aragón y han sido creados por Sergio Palao para ARASAAC (https://arasaac.org), que los distribuye bajo Licencia Creative Commons (BY-NC-SA).',
};

export const O_QUE_E_ARASAAC: L = {
  pt: 'O ARASAAC (Centro Aragonês de Comunicação Aumentativa e Alternativa) é um banco gratuito de desenhos (pictogramas) do Governo de Aragão, na Espanha. Ele não faz parte do Voz Amiga: o app só busca os desenhos lá, com internet, para facilitar. Sem internet, o app usa emojis.',
  en: 'ARASAAC (Aragonese Center for Augmentative and Alternative Communication) is a free bank of drawings (pictograms) from the Government of Aragon, Spain. It is not part of Voz Amiga: the app only fetches the drawings from there, online, to make things easier. Offline, the app uses emojis.',
  es: 'ARASAAC (Centro Aragonés para la Comunicación Aumentativa y Alternativa) es un banco gratuito de dibujos (pictogramas) del Gobierno de Aragón, España. No forma parte de Voz Amiga: la app solo busca los dibujos allí, con internet, para facilitar. Sin internet, la app usa emojis.',
};
