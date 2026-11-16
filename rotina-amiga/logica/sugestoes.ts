// Sugestões inteligentes de palavras e frases (funciona offline, dentro do celular).
// Mistura 3 fontes, nesta ordem de força:
//   1) o que ESTA criança já falou (frases do botão FALAR, com repetição e data);
//   2) um modelo de língua pequeno com os pedidos mais comuns em CAA (pt / en / es);
//   3) as pranchas que existem no aplicativo.
// Também sugere FRASES COMPLETAS para a criança falar com um toque.
import { Idioma } from '../tipos';

type Modelo = { inicio: string[]; seguinte: Record<string, string[]>; hora: { manha: string[][]; tarde: string[][]; noite: string[][] } };

const MODELO: Record<Idioma, Modelo> = {
  pt: {
    inicio: ['eu', 'quero', 'não', 'sim', 'oi', 'me', 'você', 'obrigado'],
    seguinte: {
      eu: ['quero', 'estou', 'gosto', 'preciso', 'vou', 'não', 'sou', 'te'],
      quero: ['água', 'comer', 'brincar', 'ir', 'mais', 'colo', 'dormir', 'banheiro', 'ajuda'],
      não: ['quero', 'gosto', 'sei', 'consigo', 'agora'],
      estou: ['com', 'feliz', 'triste', 'cansado', 'bem', 'bravo'],
      com: ['fome', 'sede', 'sono', 'dor', 'frio', 'calor', 'medo'],
      preciso: ['de', 'ir', 'ajuda', 'banheiro'],
      de: ['ajuda', 'água', 'você', 'brincar'],
      vou: ['brincar', 'comer', 'dormir', 'embora', 'ao'],
      ir: ['ao', 'embora', 'brincar', 'para'],
      ao: ['banheiro', 'parque', 'médico'],
      para: ['casa', 'escola', 'fora'],
      gosto: ['de', 'muito', 'disso'],
      mais: ['água', 'comida', 'por', 'um'],
      por: ['favor'],
      me: ['ajuda', 'dá', 'ajude', 'abraça'],
      você: ['quer', 'pode', 'gosta', 'vem'],
      pode: ['me', 'ajudar', 'brincar'],
      te: ['amo'],
      oi: ['mamãe', 'papai', 'tudo'],
      tudo: ['bem'],
      bom: ['dia'], boa: ['tarde', 'noite'],
      obrigado: ['mamãe', 'papai'],
      comer: ['mais', 'agora', 'fruta'],
      brincar: ['com', 'mais', 'lá'],
      água: ['por', 'agora'],
    },
    hora: { manha: [['bom', 'dia'], ['eu', 'quero', 'comer']], tarde: [['boa', 'tarde'], ['eu', 'quero', 'brincar']], noite: [['boa', 'noite'], ['estou', 'com', 'sono']] },
  },
  en: {
    inicio: ['i', 'want', 'no', 'yes', 'hi', 'help', 'please', 'you', 'thank'],
    seguinte: {
      i: ['want', 'am', 'like', 'need', 'go', "don't", 'love', 'feel'],
      want: ['water', 'to', 'more', 'food', 'help', 'mom', 'dad', 'hug'],
      to: ['eat', 'play', 'go', 'sleep', 'drink'],
      go: ['to', 'home', 'outside', 'bathroom'],
      am: ['hungry', 'thirsty', 'tired', 'happy', 'sad', 'okay'],
      feel: ['sick', 'happy', 'sad', 'tired'],
      need: ['help', 'water', 'bathroom', 'a'],
      "don't": ['want', 'like', 'know'],
      like: ['it', 'this', 'you', 'to'],
      love: ['you'],
      more: ['please', 'water', 'food'],
      help: ['me', 'please'],
      please: ['help', 'more'],
      you: ['want', 'can', 'like'],
      can: ['you', 'i', 'help'],
      thank: ['you'],
      hi: ['mom', 'dad', 'friend'],
      good: ['morning', 'afternoon', 'night'],
      water: ['please'], eat: ['now', 'more'], play: ['with', 'outside', 'more'], with: ['me', 'you'],
    },
    hora: { manha: [['good', 'morning'], ['i', 'want', 'to', 'eat']], tarde: [['good', 'afternoon'], ['i', 'want', 'to', 'play']], noite: [['good', 'night'], ['i', 'am', 'tired']] },
  },
  es: {
    inicio: ['yo', 'quiero', 'no', 'sí', 'hola', 'ayuda', 'tú', 'gracias'],
    seguinte: {
      yo: ['quiero', 'estoy', 'tengo', 'necesito', 'voy', 'no', 'te'],
      quiero: ['agua', 'comer', 'jugar', 'ir', 'más', 'dormir', 'baño', 'ayuda', 'brazos'],
      no: ['quiero', 'me', 'sé', 'puedo'],
      estoy: ['feliz', 'triste', 'cansado', 'bien', 'enojado'],
      tengo: ['hambre', 'sed', 'sueño', 'frío', 'calor', 'miedo', 'dolor'],
      necesito: ['ayuda', 'ir', 'agua'],
      voy: ['a', 'al'],
      ir: ['al', 'a', 'a casa'],
      a: ['jugar', 'comer', 'dormir', 'casa'],
      al: ['baño', 'parque', 'médico'],
      más: ['agua', 'por', 'comida'],
      por: ['favor'],
      me: ['gusta', 'ayudas', 'das', 'duele'],
      gusta: ['esto', 'jugar', 'mucho'],
      te: ['quiero', 'amo'],
      tú: ['quieres', 'puedes'],
      puedes: ['ayudarme', 'jugar'],
      hola: ['mamá', 'papá', 'amigo'],
      buenos: ['días'], buenas: ['tardes', 'noches'],
      gracias: ['mamá', 'papá'],
      ayuda: ['por'],
      jugar: ['contigo', 'más', 'afuera'],
    },
    hora: { manha: [['buenos', 'días'], ['yo', 'quiero', 'comer']], tarde: [['buenas', 'tardes'], ['yo', 'quiero', 'jugar']], noite: [['buenas', 'noches'], ['tengo', 'sueño']] },
  },
};

export interface EntradaSugestao {
  /** Palavras já escolhidas na frase. */
  frase: string[];
  /** Frases faladas antes (as mais novas no fim). */
  historico: string[][];
  /** Textos das pranchas do aplicativo. */
  vocab: string[];
  idioma: Idioma;
  /** Hora do dia (0–23), para frases como "Bom dia". */
  hora?: number;
  maxPalavras?: number;
  maxFrases?: number;
}

export interface Sugestoes { palavras: string[]; frases: string[][] }

const norm = (w: string) => w.trim().toLowerCase();
const semAcento = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Próximas palavras + frases completas. */
export function sugerir(e: EntradaSugestao): Sugestoes {
  const m = MODELO[e.idioma] || MODELO.pt;
  const maxP = e.maxPalavras ?? 5;
  const maxF = e.maxFrases ?? 3;
  const forma = new Map<string, string>(); // como escrever (igual à prancha, se existir)
  const estiloMaiusculo = e.vocab.length > 0 && e.vocab.filter((v) => v === v.toUpperCase()).length > e.vocab.length / 2;
  const escrever = (k: string) => forma.get(k) || (estiloMaiusculo ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1));
  e.vocab.forEach((v) => { const k = norm(v); if (k && !forma.has(k)) forma.set(k, v.trim()); });
  const hist = e.historico.map((f) => f.map(norm).filter(Boolean)).filter((f) => f.length);
  hist.forEach((f, i) => f.forEach((k, j) => { if (!forma.has(k)) forma.set(k, e.historico[i][j].trim()); }));
  const vocabSet = new Set(e.vocab.map(norm));
  const frase = e.frase.map(norm).filter(Boolean);
  const ult = frase[frase.length - 1];
  const pen = frase[frase.length - 2];

  // ---- 1) próxima palavra
  const nota = new Map<string, number>();
  const somar = (k: string, v: number) => { if (k) nota.set(k, (nota.get(k) || 0) + v); };
  hist.forEach((f, idx) => {
    const recente = 1 + idx / Math.max(1, hist.length); // frases novas valem um pouco mais
    if (!ult) { somar(f[0], 3 * recente); return; }
    for (let i = 0; i < f.length - 1; i++) {
      if (f[i] === ult) {
        somar(f[i + 1], 3 * recente);
        if (pen && i > 0 && f[i - 1] === pen) somar(f[i + 1], 5 * recente);
      }
    }
  });
  const base = ult ? m.seguinte[ult] || [] : m.inicio;
  base.forEach((k, i) => somar(k, 2.2 - i * 0.15));
  if (ult && !base.length && !nota.size) e.vocab.forEach((v) => somar(norm(v), 0.5)); // sem pista: as pranchas
  nota.forEach((v, k) => { if (vocabSet.has(k)) nota.set(k, v + 0.8); });
  const usadas = new Set(frase);
  const palavras = Array.from(nota.entries())
    .filter(([k]) => k && k !== ult && (!usadas.has(k) || k.length <= 3))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxP)
    .map(([k]) => escrever(k));

  // ---- 2) frases completas
  const candidatas = new Map<string, number>();
  const add = (f: string[], v: number) => { if (f.length > frase.length && f.length >= 2) { const key = f.join(' '); candidatas.set(key, (candidatas.get(key) || 0) + v); } };
  hist.forEach((f, idx) => {
    if (frase.every((w, i) => f[i] === w)) add(f, 4 + idx / Math.max(1, hist.length));
  });
  // completar com o modelo: segue a palavra mais provável até 4 palavras
  const completar = (ini: string[], primeira?: string) => {
    const r = [...ini];
    if (primeira) r.push(primeira);
    while (r.length < 4) {
      const u = r[r.length - 1];
      const prox = (m.seguinte[u] || []).find((k) => !r.includes(k) && (vocabSet.has(k) || m.seguinte[k] || r.length >= 2));
      if (!prox) break;
      r.push(prox);
      if (!m.seguinte[prox]) break; // chegou num "objeto": fim natural
    }
    return r;
  };
  const primeiras = palavras.map(norm).slice(0, 3);
  primeiras.forEach((p, i) => add(completar(frase, p), 2 - i * 0.3));
  if (!frase.length && e.hora !== undefined) {
    const h = e.hora < 12 ? m.hora.manha : e.hora < 18 ? m.hora.tarde : m.hora.noite;
    h.forEach((f, i) => add(f, 2.5 - i * 0.2));
  }
  const frases = Array.from(candidatas.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.split(' '))
    .filter((f, i, arr) => arr.findIndex((g) => g.join(' ') === f.join(' ')) === i)
    .slice(0, maxF)
    .map((f) => f.map(escrever));

  return { palavras, frases };
}

/** Completar a palavra que está sendo escrita no teclado. */
export function completarPalavra(parte: string, e: Omit<EntradaSugestao, 'frase'> & { anteriores: string[] }): string[] {
  const p = semAcento(norm(parte));
  if (!p) return sugerir({ ...e, frase: e.anteriores }).palavras;
  const m = MODELO[e.idioma] || MODELO.pt;
  const nota = new Map<string, number>();
  const somar = (k: string, v: number) => { const b = semAcento(k); if (b.startsWith(p) && b !== p) nota.set(k, (nota.get(k) || 0) + v); };
  sugerir({ ...e, frase: e.anteriores, maxPalavras: 12 }).palavras.forEach((w, i) => somar(norm(w), 6 - i * 0.3));
  e.historico.flat().forEach((w) => somar(norm(w), 1));
  e.vocab.forEach((w) => somar(norm(w), 1.5));
  Object.entries(m.seguinte).forEach(([k, vs]) => { somar(k, 0.5); vs.forEach((v) => somar(v, 0.4)); });
  return Array.from(nota.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k.toUpperCase());
}
