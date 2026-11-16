// Dados iniciais — iguais aos do Rotina Amiga original (abas, tarefas, horários, loja).
import { AbaRotina, ConfigRotina, EstadoRotina, Idioma, Meta, Recompensa, Tarefa } from './tipos';

/** Pictogramas do Rotina Amiga (chave -> emoji). */
export const PICTOGRAMAS: Record<string, string> = {
  acordar: '🌄', banho: '🚿', comer: '🍽️', cafe: '🥣', lanche: '🍎', estudar: '📖',
  escola: '🏫', mochila: '🎒', roda_conversa: '⭕', tarefa: '📝', parquinho: '🛝', onibus: '🚌',
  casa: '🏠', brincar: '🧸', guardar: '📦', dormir: '🛌', banheiro: '🚽', descarga: '🌪️',
  lavar_maos: '🧼', toalha: '🧻', escovar_dentes: '🪥', roupa: '👕', tablet: '📱', historia: '📚',
};
export const ORDEM_PICTOGRAMAS = Object.keys(PICTOGRAMAS);

export const emojiDaTarefa = (icone: string) => PICTOGRAMAS[icone] || icone || '⭐';

/** Ícones disponíveis para abas (MaterialCommunityIcons) — mesma lista do Rotina Amiga. */
export const ICONES_ABA = [
  'weather-sunset-up', 'weather-sunset-down', 'moon-waning-crescent', 'school-outline', 'bathtub-outline',
  'star-outline', 'heart-outline', 'home-outline', 'silverware-fork-knife', 'book-outline', 'music-note-outline',
  'trophy-outline', 'gamepad-variant-outline', 'brush-outline', 'emoticon-happy-outline', 'run-fast', 'car-outline',
];

export const EMOJIS_PREMIO = ['🍦', '📺', '🛝', '🎁', '🍫', '🎮', '🧸', '📱', '🎨', '⚽', '🚲', '🍕', '🎈', '🏊', '🎬', '🌳', '🍿', '🧩'];

const NOMES_ABAS: Record<Idioma, Record<string, string>> = {
  pt: { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', escola: 'Escola', banheiro: 'Banheiro' },
  en: { manha: 'Morning', tarde: 'Afternoon', noite: 'Night', escola: 'School', banheiro: 'Bathroom' },
  es: { manha: 'Mañana', tarde: 'Tarde', noite: 'Noche', escola: 'Escuela', banheiro: 'Baño' },
};

export const abasPadrao = (l: Idioma): AbaRotina[] => [
  { id: 'manha', nome: NOMES_ABAS[l].manha, icone: 'weather-sunset-up', cor: '#2563EB', paletaId: 'blue' },
  { id: 'tarde', nome: NOMES_ABAS[l].tarde, icone: 'weather-sunset-down', cor: '#F97316', paletaId: 'orange' },
  { id: 'noite', nome: NOMES_ABAS[l].noite, icone: 'moon-waning-crescent', cor: '#6366F1', paletaId: 'indigo' },
  { id: 'escola', nome: NOMES_ABAS[l].escola, icone: 'school-outline', cor: '#10B981', paletaId: 'emerald' },
  { id: 'banheiro', nome: NOMES_ABAS[l].banheiro, icone: 'bathtub-outline', cor: '#06B6D4', paletaId: 'cyan' },
];

const TODOS = [0, 1, 2, 3, 4, 5, 6];
const UTEIS = [1, 2, 3, 4, 5];

type T3 = [string, string, string];
const TAREFAS: [string, T3, string, string | undefined, number, string, number[]][] = [
  ['m1', ['Acordar', 'Wake up', 'Despertar'], 'acordar', '07:00', 0, 'manha', TODOS],
  ['m2', ['Vestir roupa', 'Get dressed', 'Vestirse'], 'roupa', '07:15', 5, 'manha', TODOS],
  ['m3', ['Café da manhã', 'Breakfast', 'Desayuno'], 'cafe', '07:30', 15, 'manha', TODOS],
  ['e1', ['Chegada e mochila', 'Arrival and backpack', 'Llegada y mochila'], 'mochila', '13:00', 0, 'escola', UTEIS],
  ['e2', ['Roda de conversa', 'Circle time', 'Ronda'], 'roda_conversa', '13:30', 0, 'escola', UTEIS],
  ['e3', ['Atividade de mesa', 'Desk activity', 'Actividad de mesa'], 'tarefa', '14:00', 30, 'escola', UTEIS],
  ['e4', ['Hora do lanche', 'Snack time', 'Merienda'], 'lanche', '15:00', 15, 'escola', UTEIS],
  ['t1', ['Almoço', 'Lunch', 'Almuerzo'], 'comer', '12:30', 20, 'tarde', TODOS],
  ['t2', ['Tempo livre', 'Free time', 'Tiempo libre'], 'tablet', '13:30', 30, 'tarde', TODOS],
  ['t3', ['Brincar', 'Play time', 'Jugar'], 'brincar', '16:00', 45, 'tarde', TODOS],
  ['n1', ['Jantar', 'Dinner', 'Cena'], 'comer', '18:30', 20, 'noite', TODOS],
  ['n2', ['Vestir pijama', 'Put on pajamas', 'Ponerse el pijama'], 'roupa', '20:00', 5, 'noite', TODOS],
  ['n3', ['História e relaxar', 'Story and relax', 'Historia y relax'], 'historia', '20:30', 20, 'noite', TODOS],
  ['b1', ['Banho', 'Bath', 'Baño'], 'banho', undefined, 15, 'banheiro', TODOS],
  ['b2', ['Escovar dentes', 'Brush teeth', 'Cepillar dientes'], 'escovar_dentes', undefined, 2, 'banheiro', TODOS],
  ['b3', ['Lavar as mãos', 'Wash hands', 'Lavarse las manos'], 'lavar_maos', undefined, 1, 'banheiro', TODOS],
];

const IDX: Record<Idioma, number> = { pt: 0, en: 1, es: 2 };

export const tarefasPadrao = (l: Idioma): Tarefa[] =>
  TAREFAS.map(([id, nomes, icone, horario, duracaoMin, abaId, dias]) => ({
    id, titulo: nomes[IDX[l]], icone, horario, duracaoMin, abaId, dias: [...dias],
    travarAteHorario: false, alarme: !!horario, estrelas: 1,
  }));

export const recompensasPadrao = (l: Idioma): Recompensa[] => {
  const n: Record<Idioma, string[]> = {
    pt: ['Sobremesa', 'Ver desenho', 'Parquinho', 'Brinquedo novo'],
    en: ['Dessert', 'Watch TV', 'Park', 'New toy'],
    es: ['Postre', 'Ver dibujos', 'Parque', 'Juguete nuevo'],
  };
  return [
    { id: 'r1', titulo: n[l][0], custo: 5, icone: '🍦', esperaMin: 0 },
    { id: 'r2', titulo: n[l][1], custo: 10, icone: '📺', esperaMin: 5 },
    { id: 'r3', titulo: n[l][2], custo: 30, icone: '🛝', esperaMin: 0 },
    { id: 'r4', titulo: n[l][3], custo: 100, icone: '🎁', esperaMin: 0 },
  ];
};

export const metasPadrao = (l: Idioma): Meta[] => {
  const n: Record<Idioma, string[]> = {
    pt: ['Falar 5 frases hoje', 'Completar 3 tarefas hoje', 'Usar 2 palavras novas hoje', 'Completar uma rotina inteira hoje', 'Completar 5 rotinas na semana', 'Falar 30 frases na semana'],
    en: ['Say 5 sentences today', 'Finish 3 tasks today', 'Use 2 new words today', 'Finish a whole routine today', 'Finish 5 routines this week', 'Say 30 sentences this week'],
    es: ['Decir 5 frases hoy', 'Completar 3 tareas hoy', 'Usar 2 palabras nuevas hoy', 'Completar una rutina entera hoy', 'Completar 5 rutinas en la semana', 'Decir 30 frases en la semana'],
  };
  // v11: metas não podem ficar aparecendo toda hora. Vêm ligadas só as SEMANAIS; as diárias os pais ligam se quiserem.
  return [
    { id: 'g1', titulo: n[l][0], tipo: 'frases', alvo: 5, periodo: 'dia', premio: 2, ativa: false, icone: '🗣️' },
    { id: 'g2', titulo: n[l][1], tipo: 'tarefas', alvo: 3, periodo: 'dia', premio: 2, ativa: false, icone: '✅' },
    { id: 'g3', titulo: n[l][2], tipo: 'palavras_novas', alvo: 2, periodo: 'dia', premio: 3, ativa: false, icone: '✨' },
    { id: 'g4', titulo: n[l][3], tipo: 'rotinas', alvo: 1, periodo: 'dia', premio: 3, ativa: false, icone: '🏁' },
    { id: 'g5', titulo: n[l][4], tipo: 'rotinas', alvo: 5, periodo: 'semana', premio: 10, ativa: true, icone: '🏆' },
    { id: 'g6', titulo: n[l][5], tipo: 'frases', alvo: 30, periodo: 'semana', premio: 10, ativa: true, icone: '💬' },
  ];
};

export const configPadrao = (): ConfigRotina => ({
  modoFoco: 'none',
  travarHorario: true,
  senhaPais: true,
  sonsSuaves: false,
  mostrarNaHome: true,
  falarTarefa: true,
  premiarFala: true,
  limiteFalaDia: 10,
  intervaloFalaSeg: 20,
  bonusRotina: 2,
  minimoSemTimerSeg: 5,
  segurarAdultoSeg: 3,
  personagem: 'menino',
  comoEstou: true,
  nomeCrianca: '',
});

export const VERSAO_ESTADO = 1;

/** Modelos para criar uma rotina com 1 toque (os pais escolhem; também podem criar com nome próprio). */
export const modelosRotina = abasPadrao;

/**
 * Estado inicial. Começa DO ZERO: SEM rotinas e SEM tarefas — os pais criam a rotina que quiserem
 * (ex.: Manhã ou Banheiro) e as tarefas. `comExemplos` coloca as 5 rotinas e as tarefas de exemplo do Rotina Amiga original (testes).
 */
export const estadoPadrao = (l: Idioma, comExemplos = false): EstadoRotina => ({
  versao: VERSAO_ESTADO,
  abas: comExemplos ? abasPadrao(l) : [],
  tarefas: comExemplos ? tarefasPadrao(l) : [],
  recompensas: recompensasPadrao(l),
  metas: metasPadrao(l),
  config: configPadrao(),
  estrelas: 0,
  concluidas: {},
  metasPagas: {},
  palavras: {},
  log: [],
  uso: {},
});
