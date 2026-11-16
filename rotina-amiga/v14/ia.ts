// VOZ AMIGA v14 — IA (OPCIONAL)
// Regra de ouro: a IA SÓ SUGERE e os PAIS APROVAM. Nunca há conversa livre com a criança.
// Nesta versão as sugestões vêm de regras feitas no próprio aparelho (sem internet, sem baixar nada).
// A estrutura para a IA de verdade (Gemma 3 270M rodando no celular com LiteRT-LM) está pronta: falta só a parte nativa.
import { Idioma } from '../tipos';
import { categoriaDaPalavra, formularFrase } from '../logica/frasesProntas';
import { PACOTES_ROTINA, itensPacote } from './pacotes';

type L = Record<Idioma, string>;
export interface OpcaoIA { id: string; emoji: string; nome: L; faz: L; tamanho: L; offline: boolean; celulares: L; disponivel: 'agora' | 'proxima' | 'firebase' }

export const OPCOES_IA: OpcaoIA[] = [
  { id: 'regras', emoji: '🧩', offline: true, disponivel: 'agora',
    nome: { pt: 'Sugestões simples (já vem no app)', en: 'Simple suggestions (built in)', es: 'Sugerencias simples (ya viene en la app)' },
    faz: { pt: 'Completa frases ("água" vira "eu quero água"), sugere a cor do botão e monta pranchas por tema.', en: 'Completes sentences ("water" becomes "I want water"), suggests the button color and builds themed boards.', es: 'Completa frases ("agua" se vuelve "yo quiero agua"), sugiere el color del botón y arma tableros por tema.' },
    tamanho: { pt: '0 MB (já está no app)', en: '0 MB (already in the app)', es: '0 MB (ya está en la app)' },
    celulares: { pt: 'Todos', en: 'All', es: 'Todos' } },
  { id: 'gemma3-270m', emoji: '✨', offline: true, disponivel: 'proxima',
    nome: { pt: 'Gemma 3 270M (IA no celular)', en: 'Gemma 3 270M (on-phone AI)', es: 'Gemma 3 270M (IA en el celular)' },
    faz: { pt: 'Frases mais naturais e sugestões melhores. Depois de baixar, funciona sem internet.', en: 'More natural sentences and better suggestions. After download, works offline.', es: 'Frases más naturales y mejores sugerencias. Después de descargar, funciona sin internet.' },
    tamanho: { pt: 'cerca de 125 a 290 MB, conforme a versão', en: 'about 125 to 290 MB, depending on the version', es: 'unos 125 a 290 MB, según la versión' },
    celulares: { pt: 'Android com 3 GB de memória ou mais', en: 'Android with 3 GB of RAM or more', es: 'Android con 3 GB de memoria o más' } },
  { id: 'gemini-nano', emoji: '🔷', offline: true, disponivel: 'firebase',
    nome: { pt: 'Gemini Nano (Google)', en: 'Gemini Nano (Google)', es: 'Gemini Nano (Google)' },
    faz: { pt: 'IA que já vem em alguns celulares top. Precisa de ligação com o Firebase, que fica para depois.', en: 'AI built into some high-end phones. Needs Firebase, planned for later.', es: 'IA que ya viene en algunos celulares de gama alta. Necesita Firebase, queda para después.' },
    tamanho: { pt: 'Já vem no celular', en: 'Built into the phone', es: 'Ya viene en el celular' },
    celulares: { pt: 'Poucos: Pixel 8 ou mais novo, Galaxy S24 ou mais novo', en: 'Few: Pixel 8 or newer, Galaxy S24 or newer', es: 'Pocos: Pixel 8 o más nuevo, Galaxy S24 o más nuevo' } },
  { id: 'firebase-ai', emoji: '☁️', offline: false, disponivel: 'firebase',
    nome: { pt: 'IA na nuvem (Firebase AI Logic)', en: 'Cloud AI (Firebase AI Logic)', es: 'IA en la nube (Firebase AI Logic)' },
    faz: { pt: 'IA mais forte, pela internet. Precisa de Firebase e de proteção extra (App Check). Fica para depois.', en: 'Stronger AI over the internet. Needs Firebase and extra protection (App Check). Planned for later.', es: 'IA más fuerte, por internet. Necesita Firebase y protección extra (App Check). Queda para después.' },
    tamanho: { pt: '0 MB, mas usa internet', en: '0 MB, but uses internet', es: '0 MB, pero usa internet' },
    celulares: { pt: 'Todos com internet', en: 'All with internet', es: 'Todos con internet' } },
];

/** Dados do modelo para baixar (quando a parte nativa existir). Endereço fica no app nativo, nunca vindo de fora. */
export const MODELO_GEMMA = { id: 'gemma3-270m', mbMin: 125, mbMax: 290 };

/** Só baixa no Wi-Fi (se os pais deixaram assim) e com espaço livre suficiente. */
export const podeBaixarIA = (o: { noWifi: boolean; soWifi: boolean; mbLivres: number }) =>
  o.soWifi && !o.noWifi ? 'wifi' : o.mbLivres < MODELO_GEMMA.mbMax * 2 ? 'espaco' : 'ok';

// ------------------------------------------------------------------ Sugestões (os pais aprovam)
/** 1) Completar frase: "água" => "eu quero água, por favor". */
export const completarFraseIA = (palavra: string, idioma: Idioma): string | undefined => {
  const f = formularFrase(palavra.trim(), idioma);
  if (!f) return undefined;
  const educado = { pt: 'por favor', en: 'please', es: 'por favor' }[idioma];
  const base = f.join(' ').toLowerCase();
  return categoriaDaPalavra(f[f.length - 1]) === 'coisa' || f.length >= 3 ? `${base}, ${educado}` : base;
};

/** 2) Sugerir nome (limpo) e categoria (uma das 4 cores) de um botão novo. */
export const sugerirBotaoIA = (texto: string): { nome: string; categoria: 'pessoas' | 'social' | 'descricao' | 'acoes' } => {
  const nome = texto.trim().replace(/\s+/g, ' ').slice(0, 40);
  const nomeBonito = nome ? nome[0].toUpperCase() + nome.slice(1) : '';
  const c = categoriaDaPalavra(nome.split(' ')[0] || '');
  return { nome: nomeBonito, categoria: c === 'pessoa' ? 'pessoas' : c === 'verbo' ? 'acoes' : c === 'social' || c === 'pergunta' || c === 'negacao' ? 'social' : 'descricao' };
};

const TEMAS_EXTRA: Record<string, string[]> = {
  aniversario: ['festa', 'bolo', 'parabéns', 'presente', 'aniversário', 'birthday', 'cumpleaños'],
  praia: ['praia', 'mar', 'beach', 'playa', 'areia'],
};
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ITENS_EXTRA: Record<string, Record<Idioma, string>> = {
  aniversario: { pt: 'Festa|🎉,Bolo|🎂,Parabéns|👏,Presente|🎁,Vela|🕯️,Balão|🎈,Doce|🍬,Amigos|🧒,Cantar|🎵,Foto|📸', en: 'Party|🎉,Cake|🎂,Congrats|👏,Gift|🎁,Candle|🕯️,Balloon|🎈,Candy|🍬,Friends|🧒,Sing|🎵,Photo|📸', es: 'Fiesta|🎉,Torta|🎂,Felicidades|👏,Regalo|🎁,Vela|🕯️,Globo|🎈,Dulce|🍬,Amigos|🧒,Cantar|🎵,Foto|📸' },
  praia: { pt: 'Praia|🏖️,Mar|🌊,Areia|🏝️,Sol|☀️,Protetor|🧴,Balde|🪣,Nadar|🏊,Sorvete|🍦,Água|💧,Casa|🏠', en: 'Beach|🏖️,Sea|🌊,Sand|🏝️,Sun|☀️,Sunscreen|🧴,Bucket|🪣,Swim|🏊,Ice cream|🍦,Water|💧,Home|🏠', es: 'Playa|🏖️,Mar|🌊,Arena|🏝️,Sol|☀️,Protector|🧴,Balde|🪣,Nadar|🏊,Helado|🍦,Agua|💧,Casa|🏠' },
};

/** 3) Montar uma prancha a partir de um tema ("banho", "festa", "praia"…). Devolve as palavras para os pais aprovarem. */
export const pranchaPorTemaIA = (tema: string, idioma: Idioma): { titulo: string; itens: [string, string][] } | undefined => {
  const t = sem(tema.trim());
  if (!t) return undefined;
  const p = PACOTES_ROTINA.find((x) => sem(x.nome[idioma]).includes(t) || x.chaves.some((c) => sem(c).includes(t) || t.includes(sem(c))));
  if (p) return { titulo: p.nome[idioma], itens: itensPacote(p, idioma) };
  const extra = Object.entries(TEMAS_EXTRA).find(([, cs]) => cs.some((c) => sem(c).includes(t) || t.includes(sem(c))));
  if (extra) {
    const itens = ITENS_EXTRA[extra[0]][idioma].split(',').map((x) => x.split('|') as [string, string]);
    return { titulo: itens[0][0], itens };
  }
  return undefined;
};
