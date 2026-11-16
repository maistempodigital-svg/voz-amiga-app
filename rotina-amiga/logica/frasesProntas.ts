// FRASES PRONTAS + CORES DA COMUNICAÇÃO (Chave de Fitzgerald modificada, padrão de cores da CAA):
//   pessoas = amarelo · ações (verbos) = verde · coisas e lugares = laranja · descrição e sentimentos = azul
//   expressões sociais = rosa · negação = vermelho · perguntas = roxo · palavras de ligação = cinza
import { Idioma } from '../tipos';

export type Categoria = 'pessoa' | 'verbo' | 'coisa' | 'descricao' | 'social' | 'negacao' | 'pergunta' | 'ligacao';

export const CORES_FITZGERALD: Record<Categoria, { fundo: string; borda: string; texto: string }> = {
  pessoa: { fundo: '#FEF08A', borda: '#EAB308', texto: '#713F12' },
  verbo: { fundo: '#BBF7D0', borda: '#22C55E', texto: '#14532D' },
  coisa: { fundo: '#FED7AA', borda: '#F97316', texto: '#7C2D12' },
  descricao: { fundo: '#BFDBFE', borda: '#3B82F6', texto: '#1E3A8A' },
  social: { fundo: '#FBCFE8', borda: '#EC4899', texto: '#831843' },
  negacao: { fundo: '#FECACA', borda: '#EF4444', texto: '#7F1D1D' },
  pergunta: { fundo: '#DDD6FE', borda: '#8B5CF6', texto: '#4C1D95' },
  ligacao: { fundo: '#F1F5F9', borda: '#94A3B8', texto: '#334155' },
};

export const NOMES_CATEGORIA: Record<Categoria, Record<Idioma, string>> = {
  pessoa: { pt: 'Pessoas', en: 'People', es: 'Personas' },
  verbo: { pt: 'Ações', en: 'Actions', es: 'Acciones' },
  coisa: { pt: 'Coisas e lugares', en: 'Things and places', es: 'Cosas y lugares' },
  descricao: { pt: 'Descrição e sentimentos', en: 'Describing and feelings', es: 'Descripción y sentimientos' },
  social: { pt: 'Expressões sociais', en: 'Social expressions', es: 'Expresiones sociales' },
  negacao: { pt: 'Negação', en: 'Negation', es: 'Negación' },
  pergunta: { pt: 'Perguntas', en: 'Questions', es: 'Preguntas' },
  ligacao: { pt: 'Ligação', en: 'Linking words', es: 'Enlace' },
};

const sem = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[?!.,¿¡]/g, '').trim();

const LEX: Record<Exclude<Categoria, 'coisa'>, string[]> = {
  pessoa: ['eu', 'voce', 'ele', 'ela', 'nos', 'eles', 'elas', 'mamae', 'mae', 'papai', 'pai', 'vovo', 'vovo', 'professora', 'professor', 'amigo', 'amiga', 'irmao', 'irma', 'me', 'mim', 'comigo',
    'i', 'you', 'he', 'she', 'we', 'they', 'mom', 'mommy', 'dad', 'daddy', 'grandma', 'grandpa', 'teacher', 'friend', 'brother', 'sister', 'me',
    'yo', 'tu', 'el', 'ella', 'nosotros', 'mama', 'papa', 'abuela', 'abuelo', 'maestra', 'maestro', 'hermano', 'hermana', 'mi'],
  verbo: ['quero', 'quer', 'estou', 'esta', 'vou', 'vamos', 'gosto', 'preciso', 'posso', 'pode', 'tenho', 'comer', 'beber', 'brincar', 'ir', 'dormir', 'ver', 'ajuda', 'ajudar', 'ajude', 'fazer', 'sentir', 'doi', 'para', 'parar', 'abrir', 'fechar', 'pegar', 'dar', 'da', 'sair', 'voltar', 'ouvir', 'assistir', 'tomar', 'lavar', 'escovar', 'esta',
    'want', 'am', 'is', 'are', 'go', 'like', 'need', 'can', 'have', 'eat', 'drink', 'play', 'sleep', 'see', 'help', 'do', 'feel', 'hurts', 'stop', 'open', 'give', 'watch', 'take', 'wash', 'brush', 'leave', 'going',
    'quiero', 'estoy', 'voy', 'vamos', 'gusta', 'necesito', 'puedo', 'tengo', 'comer', 'beber', 'jugar', 'dormir', 'ver', 'ayudar', 'ayudame', 'hacer', 'duele', 'parar', 'abrir', 'dar', 'dame', 'salir', 'esta'],
  descricao: ['feliz', 'triste', 'cansado', 'cansada', 'bravo', 'brava', 'medo', 'fome', 'sede', 'sono', 'dor', 'calor', 'frio', 'mais', 'menos', 'grande', 'pequeno', 'bom', 'boa', 'ruim', 'bonito', 'quente', 'gelado', 'agora', 'depois', 'tudo', 'bem', 'mal', 'calmo', 'nervoso', 'doente',
    'happy', 'sad', 'tired', 'angry', 'scared', 'hungry', 'thirsty', 'sleepy', 'pain', 'hot', 'cold', 'more', 'big', 'small', 'good', 'bad', 'now', 'later', 'okay', 'calm', 'sick', 'all',
    'triste', 'enojado', 'miedo', 'hambre', 'sed', 'sueno', 'dolor', 'calor', 'mas', 'grande', 'pequeno', 'bueno', 'malo', 'ahora', 'despues', 'bien', 'tranquilo', 'enfermo'],
  social: ['oi', 'ola', 'tchau', 'obrigado', 'obrigada', 'por favor', 'desculpa', 'bom dia', 'boa tarde', 'boa noite', 'sim', 'tudo bem', 'parabens', 'licenca',
    'hi', 'hello', 'bye', 'thanks', 'thank you', 'please', 'sorry', 'good morning', 'good night', 'yes',
    'hola', 'adios', 'chao', 'gracias', 'por favor', 'perdon', 'buenos dias', 'buenas noches', 'si'],
  negacao: ['nao', 'nunca', 'nada', 'nenhum', 'no', 'not', "don't", 'dont', 'never', 'nothing', 'nunca', 'nada', 'ninguno'],
  pergunta: ['onde', 'quando', 'quem', 'que', 'o que', 'por que', 'porque', 'como', 'qual', 'quanto', 'where', 'when', 'who', 'what', 'why', 'how', 'which', 'donde', 'cuando', 'quien', 'que', 'por que', 'como', 'cual', 'cuanto'],
  ligacao: ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'no', 'na', 'com', 'e', 'em', 'ao', 'para o', 'the', 'an', 'to', 'of', 'with', 'and', 'in', 'on', 'el', 'la', 'los', 'las', 'un', 'una', 'del', 'al', 'con', 'y', 'en'],
};
const SET = Object.fromEntries(Object.entries(LEX).map(([k, v]) => [k, new Set(v)])) as Record<Exclude<Categoria, 'coisa'>, Set<string>>;
const ORDEM: Exclude<Categoria, 'coisa'>[] = ['social', 'pergunta', 'negacao', 'pessoa', 'verbo', 'descricao', 'ligacao'];

/** Categoria de uma palavra (o que não for reconhecido é tratado como "coisa ou lugar", laranja). */
export const categoriaDaPalavra = (w: string): Categoria => {
  const k = sem(w);
  if (!k) return 'ligacao';
  for (const c of ORDEM) if (SET[c].has(k)) return c;
  return 'coisa';
};
export const corDaPalavra = (w: string) => CORES_FITZGERALD[categoriaDaPalavra(w)];

/** Expressões de duas ou três palavras que são UMA expressão social ("bom dia", "por favor", "thank you"…). */
const SOCIAL_JUNTAS = new Set(['bom dia', 'boa tarde', 'boa noite', 'por favor', 'tudo bem', 'com licenca', 'muito obrigado', 'muito obrigada',
  'thank you', 'good morning', 'good night', 'good afternoon', 'are you okay', 'excuse me',
  'buenos dias', 'buenas tardes', 'buenas noches', 'muchas gracias', 'estas bien', 'con permiso']);

/** Categoria de cada palavra levando em conta a frase inteira (expressões sociais juntas ficam rosa). */
export const categoriasDaFrase = (palavras: string[]): Categoria[] => {
  const cats = palavras.map(categoriaDaPalavra);
  const k = palavras.map(sem);
  for (let i = 0; i < k.length; i++) {
    for (const n of [3, 2]) {
      if (i + n <= k.length && SOCIAL_JUNTAS.has(k.slice(i, i + n).join(' '))) { for (let j = i; j < i + n; j++) cats[j] = 'social'; break; }
    }
  }
  return cats;
};
export const coresDaFrase = (palavras: string[]) => categoriasDaFrase(palavras).map((c) => CORES_FITZGERALD[c]);

export type GrupoFrase = 'pedir' | 'sentir' | 'social' | 'recusar' | 'perguntar';
/** Cada grupo usa a cor da sua expressão principal. */
export const GRUPOS: { id: GrupoFrase; cat: Categoria; emoji: string; r: Record<Idioma, string> }[] = [
  { id: 'pedir', cat: 'verbo', emoji: '🙋', r: { pt: 'Pedir', en: 'Ask', es: 'Pedir' } },
  { id: 'sentir', cat: 'descricao', emoji: '💙', r: { pt: 'Sentir', en: 'Feel', es: 'Sentir' } },
  { id: 'social', cat: 'social', emoji: '👋', r: { pt: 'Social', en: 'Social', es: 'Social' } },
  { id: 'recusar', cat: 'negacao', emoji: '✋', r: { pt: 'Recusar', en: 'Refuse', es: 'Rechazar' } },
  { id: 'perguntar', cat: 'pergunta', emoji: '❓', r: { pt: 'Perguntar', en: 'Ask a question', es: 'Preguntar' } },
];

export interface FrasePronta { id: string; grupo: GrupoFrase; palavras: string[] }

const F = (grupo: GrupoFrase, lista: string[]): FrasePronta[] => lista.map((t, i) => ({ id: `${grupo}${i}`, grupo, palavras: t.split(' ') }));

/** Frases prontas padrão (as primeiras de cada grupo aparecem na versão gratuita). */
export const FRASES_PADRAO: Record<Idioma, FrasePronta[]> = {
  pt: [
    ...F('pedir', ['Eu quero água', 'Eu quero comer', 'Eu quero ir ao banheiro', 'Eu quero brincar', 'Eu quero mais', 'Me ajuda por favor', 'Eu quero colo', 'Eu quero dormir']),
    ...F('sentir', ['Eu estou feliz', 'Eu estou triste', 'Eu estou com fome', 'Eu estou com dor', 'Eu estou cansado', 'Eu estou com medo', 'Eu estou bravo', 'Eu estou com sono']),
    ...F('social', ['Oi', 'Bom dia', 'Obrigado', 'Por favor', 'Tchau', 'Desculpa', 'Tudo bem?', 'Boa noite']),
    ...F('recusar', ['Eu não quero', 'Não gosto', 'Para por favor', 'Agora não']),
    ...F('perguntar', ['Onde está a mamãe?', 'Quando vamos embora?', 'Posso brincar?', 'O que é isso?']),
  ],
  en: [
    ...F('pedir', ['I want water', 'I want to eat', 'I want to go to the bathroom', 'I want to play', 'I want more', 'Help me please', 'I want a hug', 'I want to sleep']),
    ...F('sentir', ['I am happy', 'I am sad', 'I am hungry', 'I am in pain', 'I am tired', 'I am scared', 'I am angry', 'I am sleepy']),
    ...F('social', ['Hi', 'Good morning', 'Thank you', 'Please', 'Bye', 'Sorry', 'Are you okay?', 'Good night']),
    ...F('recusar', ['I do not want', 'I do not like it', 'Stop please', 'Not now']),
    ...F('perguntar', ['Where is mom?', 'When are we leaving?', 'Can I play?', 'What is this?']),
  ],
  es: [
    ...F('pedir', ['Yo quiero agua', 'Yo quiero comer', 'Yo quiero ir al baño', 'Yo quiero jugar', 'Yo quiero más', 'Ayúdame por favor', 'Quiero brazos', 'Yo quiero dormir']),
    ...F('sentir', ['Yo estoy feliz', 'Yo estoy triste', 'Tengo hambre', 'Tengo dolor', 'Estoy cansado', 'Tengo miedo', 'Estoy enojado', 'Tengo sueño']),
    ...F('social', ['Hola', 'Buenos días', 'Gracias', 'Por favor', 'Adiós', 'Perdón', '¿Estás bien?', 'Buenas noches']),
    ...F('recusar', ['No quiero', 'No me gusta', 'Para por favor', 'Ahora no']),
    ...F('perguntar', ['¿Dónde está mamá?', '¿Cuándo nos vamos?', '¿Puedo jugar?', '¿Qué es esto?']),
  ],
};

/** Quantas por grupo na versão gratuita (o resto aparece no Plano Completo). */
export const POR_GRUPO_GRATIS = 2;

/** Lista em uso: a personalizada dos pais ou a padrão; no gratuito, só as primeiras de cada grupo. */
export const frasesEmUso = (idioma: Idioma, personalizadas: FrasePronta[] | undefined, completo: boolean): FrasePronta[] => {
  const base = personalizadas && personalizadas.length ? personalizadas : FRASES_PADRAO[idioma];
  if (completo) return base;
  const cont: Record<string, number> = {};
  return base.filter((f) => { cont[f.grupo] = (cont[f.grupo] || 0) + 1; return cont[f.grupo] <= POR_GRUPO_GRATIS; });
};

/** Separa o texto digitado pelos pais em palavras (mantém pontuação junto da palavra). */
export const palavrasDoTexto = (t: string) => t.trim().split(/\s+/).filter(Boolean).slice(0, 12);

// ---------------------------------------------------------------- MENSAGEM INTELIGENTE
// A criança põe UMA palavra ("água") e o app já monta a frase ("Eu quero água").
// Ela pode apagar o que não for; o app só fala quando ela aperta FALAR.
const INF_PT = new Set(['comer', 'beber', 'brincar', 'ir', 'dormir', 'ver', 'ajudar', 'fazer', 'parar', 'abrir', 'fechar', 'pegar', 'sair', 'voltar', 'ouvir', 'assistir', 'tomar', 'lavar', 'escovar', 'passear', 'desenhar', 'pintar', 'correr', 'nadar', 'jogar', 'cantar', 'dancar', 'ler', 'descansar', 'tomar banho']);
const INF_EN = new Set(['eat', 'drink', 'play', 'go', 'sleep', 'see', 'watch', 'help', 'leave', 'stop', 'open', 'read', 'draw', 'paint', 'run', 'swim', 'sing', 'dance', 'rest', 'wash', 'brush']);
const INF_ES = new Set(['comer', 'beber', 'jugar', 'ir', 'dormir', 'ver', 'ayudar', 'hacer', 'parar', 'abrir', 'salir', 'volver', 'leer', 'dibujar', 'pintar', 'correr', 'nadar', 'cantar', 'bailar', 'descansar', 'banarme']);
const COM_PT = new Set(['fome', 'sede', 'sono', 'dor', 'medo', 'calor', 'frio']);
const ESTOU_PT = new Set(['feliz', 'triste', 'cansado', 'cansada', 'bravo', 'brava', 'calmo', 'calma', 'nervoso', 'nervosa', 'doente', 'bem', 'mal']);
const AM_EN = new Set(['hungry', 'thirsty', 'sleepy', 'happy', 'sad', 'tired', 'angry', 'scared', 'sick', 'hot', 'cold', 'calm', 'okay']);
const TENGO_ES = new Set(['hambre', 'sed', 'sueno', 'miedo', 'dolor', 'calor', 'frio']);
const ESTOY_ES = new Set(['feliz', 'triste', 'cansado', 'cansada', 'enojado', 'enojada', 'tranquilo', 'tranquila', 'enfermo', 'enferma', 'bien', 'mal']);

/**
 * Monta uma frase a partir de UMA palavra. Devolve a frase (palavras) ou undefined quando não sabe montar
 * (pessoas, expressões sociais, perguntas, "não" e verbos já conjugados ficam como estão).
 */
export const formularFrase = (palavra: string, idioma: Idioma): string[] | undefined => {
  const w = palavra.trim();
  if (!w || /\s/.test(w)) return undefined;
  const k = sem(w);
  const cat = categoriaDaPalavra(w);
  if (idioma === 'en') {
    if (AM_EN.has(k)) return ['I', 'am', w];
    if (k === 'more') return ['I', 'want', w];
    if (INF_EN.has(k)) return ['I', 'want', 'to', w];
    if (k === 'bathroom' || k === 'park' || k === 'school') return ['I', 'want', 'to', 'go', 'to', 'the', w];
    if (k === 'home') return ['I', 'want', 'to', 'go', w];
    if (cat === 'coisa') return ['I', 'want', w];
    return undefined;
  }
  if (idioma === 'es') {
    if (TENGO_ES.has(k)) return ['Tengo', w];
    if (ESTOY_ES.has(k)) return ['Estoy', w];
    if (k === 'mas') return ['Yo', 'quiero', w];
    if (INF_ES.has(k)) return ['Yo', 'quiero', w];
    if (k === 'bano' || k === 'parque') return ['Yo', 'quiero', 'ir', 'al', w];
    if (k === 'casa' || k === 'escuela') return ['Yo', 'quiero', 'ir', 'a', k === 'casa' ? '' : 'la', w].filter(Boolean);
    if (cat === 'coisa') return ['Yo', 'quiero', w];
    return undefined;
  }
  if (k === 'banheiro' || k === 'escola' || k === 'parque' || k === 'casa') return ['Eu', 'quero', 'ir', k === 'banheiro' || k === 'parque' ? 'ao' : k === 'casa' ? 'para' : 'para a', w].join(' ').split(' ');
  if (COM_PT.has(k)) return ['Eu', 'estou', 'com', w];
  if (ESTOU_PT.has(k)) return ['Eu', 'estou', w];
  if (k === 'mais') return ['Eu', 'quero', w];
  if (INF_PT.has(k)) return ['Eu', 'quero', w];
  if (cat === 'coisa') return ['Eu', 'quero', w];
  return undefined;
};
