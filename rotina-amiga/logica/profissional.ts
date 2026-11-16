// RELATÓRIO PARA PROFISSIONAIS — Comunicação + Rotina + Recompensas + Crises + Sentimentos + Uso.
// Um único gerador alimenta a tela, o texto do WhatsApp e o PDF (HTML). Tudo em pt / en / es.
import { evolucao } from '../v14/relatorioV14';
import { oQueOAppPercebeu, TITULO_PERCEBEU } from '../v14/percebeu';
import { EstadoRotina, Evento, Idioma } from '../tipos';
import { GATILHOS, AJUDOU, SENTIMENTOS, rotuloLista } from '../textos2';
import { DIAS_NOME } from '../textos';
import { IdPeriodo, Janela, janela, meses, numeros, rotuloPeriodo, tempoTexto, variacao } from './relatorioGeral';
import { chaveDia, inicioDia, pad, somarDias } from './tempo';
import { conquistas } from './estrelas';

export type AreaRel = 'geral' | 'fono' | 'to' | 'psico' | 'escola';

export const AREAS: { id: AreaRel; emoji: string; r: Record<Idioma, string> }[] = [
  { id: 'geral', emoji: '📋', r: { pt: 'Geral', en: 'General', es: 'General' } },
  { id: 'fono', emoji: '🗣️', r: { pt: 'Fonoaudiologia', en: 'Speech therapy', es: 'Fonoaudiología' } },
  { id: 'to', emoji: '🧩', r: { pt: 'Terapia ocupacional', en: 'Occupational therapy', es: 'Terapia ocupacional' } },
  { id: 'psico', emoji: '🧠', r: { pt: 'Psicologia / ABA', en: 'Psychology / ABA', es: 'Psicología / ABA' } },
  { id: 'escola', emoji: '🏫', r: { pt: 'Escola', en: 'School', es: 'Escuela' } },
];

type IdSecao = 'percebeu' | 'uso' | 'comunicacao' | 'evolucao' | 'funcoes' | 'teclado' | 'rotina' | 'recompensas' | 'crises' | 'sinais' | 'sentimentos' | 'meses';

const SECOES_POR_AREA: Record<AreaRel, IdSecao[]> = {
  geral: ['percebeu', 'uso', 'comunicacao', 'evolucao', 'funcoes', 'teclado', 'rotina', 'recompensas', 'crises', 'sinais', 'sentimentos', 'meses'],
  fono: ['comunicacao', 'evolucao', 'funcoes', 'teclado', 'sentimentos', 'uso'],
  to: ['rotina', 'uso', 'recompensas', 'sinais'],
  psico: ['crises', 'sinais', 'sentimentos', 'recompensas', 'rotina', 'funcoes'],
  escola: ['rotina', 'funcoes', 'crises', 'sentimentos', 'comunicacao', 'evolucao'],
};

// ------------------------------------------------------------------ textos
const T = {
  pt: {
    titulo: 'Relatório Voz Amiga', para: 'para', periodo: 'Período', a: 'a', resumo: 'Resumo', atencao: 'Pontos de atenção',
    tendencia: 'Tendência', projecao: 'Se continuar assim, no próximo período', sobe: 'subindo', cai: 'caindo', estavel: 'estável', sem: 'sem dados suficientes',
    vsAnterior: 'vs período anterior', notas: 'Anotações dos pais', geradoEm: 'Gerado pelo app Voz Amiga em', naoUsado: 'não usado no período',
    s_uso: 'Tempo de uso', s_comunicacao: 'Comunicação', s_funcoes: 'Para que a criança se comunica', s_teclado: 'Escrita no teclado',
    s_rotina: 'Rotina e autonomia', s_recompensas: 'Prêmios, metas e conquistas', s_crises: 'Momentos de crise (registro dos pais)',
    s_sinais: 'Sinais de alerta (automáticos — não é diagnóstico)', s_sentimentos: 'Como a criança disse que estava', s_meses: 'Mês a mês',
    tempoApp: 'Tempo com o app aberto', diasUso: 'Dias com uso', mediaDia: 'Média por dia de uso', horarios: 'Horários em que mais se comunica',
    palavras: 'Palavras faladas', frases: 'Frases faladas', tamFrase: 'Tamanho médio da frase', palavrasDif: 'Palavras diferentes', palavrasNovas: 'Palavras novas',
    independencia: 'Frases montadas sem sugestão', incompletas: 'Frases começadas e não faladas', velocidade: 'Tempo médio para montar uma frase',
    maisUsadas: 'Palavras mais usadas', f_pedir: 'Pedir', f_recusar: 'Recusar / dizer não', f_sentir: 'Sentimentos', f_social: 'Social (oi, obrigado…)', f_ajuda: 'Pedir ajuda / dor',
    letras: 'Letras digitadas', apagadas: 'Correções (apagou)', palavrasEscritas: 'Palavras escritas',
    tarefas: 'Tarefas concluídas', adesao: 'Do que estava previsto, foi feito', sozinha: 'Feitas sozinho(a)', comAjuda: 'Precisou de adulto', canceladas: 'Abandonadas / canceladas',
    atraso: 'Atraso médio para começar', pontual: 'Começou no horário', sequencia: 'Dias seguidos com rotina completa', rotinas: 'Rotinas completas', dificeis: 'Tarefas mais difíceis',
    duracao: 'Tempo real vs. temporizador', estrelasGanhas: 'Estrelas ganhas', estrelasGastas: 'Estrelas trocadas', premios: 'Prêmios escolhidos', metas: 'Metas cumpridas',
    esperas: 'Esperas pelo prêmio', esperouFim: 'Esperou até o fim', desistiu: 'Desistiu de esperar', esperaMedia: 'Tempo médio de espera', regraPremio: 'Regra dos prêmios', regraImediato: 'na hora', regraEspera: 'esperar {n} min para liberar', regraIntervalo: '{n} min entre um prêmio e outro', metasLista: 'Metas cumpridas no período', conquistasLista: 'Conquistas da criança',
    crises: 'Crises registradas', intensidade: 'Intensidade média (1–5)', duracaoCrise: 'Tempo total em crise', gatilhos: 'O que pode ter causado', ajudou: 'O que ajudou',
    quando: 'Quando mais acontece', diaSemana: 'Dia da semana com mais crises', correlacao: 'Crises em dias com rotina completa vs. sem rotina',
    rajadas: 'Toques repetidos sem parar (rajadas)', pedidosAjuda: 'Pedidos de ajuda / dor', sequenciasIncompletas: 'Várias frases abandonadas em seguida', tentouSair: 'Tentou sair do app travado',
    sentimentosTop: 'Mais escolhidos', negativos: 'Sentimentos difíceis (triste, bravo, medo, dor)', manha: 'manhã', tarde: 'tarde', noite: 'noite', madrugada: 'madrugada',
    porDia: 'por dia', min: 'min', seg: 's', pal: 'palavras', vezes: 'vez(es)',
    d_palavrasSobe: 'Falou {a} palavras, {p}% a mais que no período anterior.', d_palavrasCai: 'Falou {a} palavras, {p}% a menos que no período anterior.',
    d_novas: 'Palavras novas usadas: {a}.', d_frasesMaiores: 'As frases ficaram maiores: média de {a} palavras (antes {b}).',
    d_autonomia: 'Fez {a}% das tarefas sozinho(a).', d_adesao: 'Cumpriu {a}% da rotina prevista.', d_sequencia: '{a} dia(s) seguidos com a rotina completa.',
    d_crisesCai: 'Os momentos de crise caíram de {b} para {a}.', d_crisesSobe: 'Os momentos de crise subiram de {b} para {a}.',
    d_incompletasSobe: 'Mais frases começadas e não faladas ({b} → {a}): pode indicar dificuldade para encontrar as palavras.',
    d_usoCai: 'Usou {p}% menos o aplicativo que no período anterior.', d_usoSobe: 'Usou {p}% mais o aplicativo.',
    d_ajuda: 'Pediu ajuda ou falou de dor {a} vez(es).', d_rajadas: '{a} rajada(s) de toques repetidos — vale observar o contexto.',
    d_semDados: 'Ainda há poucos registros neste período.',
  },
  en: {
    titulo: 'Voz Amiga Report', para: 'for', periodo: 'Period', a: 'to', resumo: 'Summary', atencao: 'Points of attention',
    tendencia: 'Trend', projecao: 'If it keeps going like this, next period', sobe: 'going up', cai: 'going down', estavel: 'stable', sem: 'not enough data',
    vsAnterior: 'vs previous period', notas: 'Parents’ notes', geradoEm: 'Generated by the Voz Amiga app on', naoUsado: 'not used in the period',
    s_uso: 'Time of use', s_comunicacao: 'Communication', s_funcoes: 'What the child communicates for', s_teclado: 'Typing on the keyboard',
    s_rotina: 'Routine and autonomy', s_recompensas: 'Prizes, goals and achievements', s_crises: 'Crisis moments (parents’ records)',
    s_sinais: 'Warning signs (automatic — not a diagnosis)', s_sentimentos: 'How the child said they felt', s_meses: 'Month by month',
    tempoApp: 'Time with the app open', diasUso: 'Days with use', mediaDia: 'Average per day of use', horarios: 'Times they communicate the most',
    palavras: 'Words spoken', frases: 'Sentences spoken', tamFrase: 'Average sentence length', palavrasDif: 'Different words', palavrasNovas: 'New words',
    independencia: 'Sentences built without suggestions', incompletas: 'Sentences started and not spoken', velocidade: 'Average time to build a sentence',
    maisUsadas: 'Most used words', f_pedir: 'Requesting', f_recusar: 'Refusing / saying no', f_sentir: 'Feelings', f_social: 'Social (hi, thanks…)', f_ajuda: 'Asking for help / pain',
    letras: 'Letters typed', apagadas: 'Corrections (deleted)', palavrasEscritas: 'Words written',
    tarefas: 'Tasks done', adesao: 'Of what was planned, done', sozinha: 'Done independently', comAjuda: 'Needed an adult', canceladas: 'Abandoned / canceled',
    atraso: 'Average delay to start', pontual: 'Started on time', sequencia: 'Days in a row with full routine', rotinas: 'Routines completed', dificeis: 'Hardest tasks',
    duracao: 'Real time vs. timer', estrelasGanhas: 'Stars earned', estrelasGastas: 'Stars traded', premios: 'Prizes chosen', metas: 'Goals reached',
    esperas: 'Waits for a prize', esperouFim: 'Waited until the end', desistiu: 'Gave up waiting', esperaMedia: 'Average wait', regraPremio: 'Prize rule', regraImediato: 'right away', regraEspera: 'wait {n} min to release', regraIntervalo: '{n} min between prizes', metasLista: 'Goals reached in the period', conquistasLista: 'Child’s achievements',
    crises: 'Crises recorded', intensidade: 'Average intensity (1–5)', duracaoCrise: 'Total time in crisis', gatilhos: 'Possible causes', ajudou: 'What helped',
    quando: 'When it happens most', diaSemana: 'Weekday with most crises', correlacao: 'Crises on days with full routine vs. without routine',
    rajadas: 'Non-stop repeated taps (bursts)', pedidosAjuda: 'Asking for help / pain', sequenciasIncompletas: 'Several abandoned sentences in a row', tentouSair: 'Tried to leave the locked app',
    sentimentosTop: 'Most chosen', negativos: 'Hard feelings (sad, angry, scared, pain)', manha: 'morning', tarde: 'afternoon', noite: 'evening', madrugada: 'night',
    porDia: 'per day', min: 'min', seg: 's', pal: 'words', vezes: 'time(s)',
    d_palavrasSobe: 'Spoke {a} words, {p}% more than the previous period.', d_palavrasCai: 'Spoke {a} words, {p}% fewer than the previous period.',
    d_novas: 'New words used: {a}.', d_frasesMaiores: 'Sentences got longer: average of {a} words (before {b}).',
    d_autonomia: 'Did {a}% of the tasks independently.', d_adesao: 'Completed {a}% of the planned routine.', d_sequencia: '{a} day(s) in a row with the full routine.',
    d_crisesCai: 'Crisis moments went down from {b} to {a}.', d_crisesSobe: 'Crisis moments went up from {b} to {a}.',
    d_incompletasSobe: 'More sentences started and not spoken ({b} → {a}): may indicate difficulty finding words.',
    d_usoCai: 'Used the app {p}% less than the previous period.', d_usoSobe: 'Used the app {p}% more.',
    d_ajuda: 'Asked for help or mentioned pain {a} time(s).', d_rajadas: '{a} burst(s) of repeated taps — worth checking the context.',
    d_semDados: 'Still few records in this period.',
  },
  es: {
    titulo: 'Reporte Voz Amiga', para: 'de', periodo: 'Período', a: 'a', resumo: 'Resumen', atencao: 'Puntos de atención',
    tendencia: 'Tendencia', projecao: 'Si sigue así, en el próximo período', sobe: 'subiendo', cai: 'bajando', estavel: 'estable', sem: 'datos insuficientes',
    vsAnterior: 'vs período anterior', notas: 'Notas de los padres', geradoEm: 'Generado por la app Voz Amiga el', naoUsado: 'no usado en el período',
    s_uso: 'Tiempo de uso', s_comunicacao: 'Comunicación', s_funcoes: 'Para qué se comunica el niño', s_teclado: 'Escritura en el teclado',
    s_rotina: 'Rutina y autonomía', s_recompensas: 'Premios, metas y logros', s_crises: 'Momentos de crisis (registro de los padres)',
    s_sinais: 'Señales de alerta (automáticas — no es diagnóstico)', s_sentimentos: 'Cómo dijo el niño que estaba', s_meses: 'Mes a mes',
    tempoApp: 'Tiempo con la app abierta', diasUso: 'Días con uso', mediaDia: 'Promedio por día de uso', horarios: 'Horarios en que más se comunica',
    palavras: 'Palabras dichas', frases: 'Frases dichas', tamFrase: 'Tamaño medio de la frase', palavrasDif: 'Palabras diferentes', palavrasNovas: 'Palabras nuevas',
    independencia: 'Frases armadas sin sugerencia', incompletas: 'Frases empezadas y no dichas', velocidade: 'Tiempo medio para armar una frase',
    maisUsadas: 'Palabras más usadas', f_pedir: 'Pedir', f_recusar: 'Rechazar / decir no', f_sentir: 'Sentimientos', f_social: 'Social (hola, gracias…)', f_ajuda: 'Pedir ayuda / dolor',
    letras: 'Letras escritas', apagadas: 'Correcciones (borró)', palavrasEscritas: 'Palabras escritas',
    tarefas: 'Tareas completadas', adesao: 'De lo previsto, se hizo', sozinha: 'Hechas solo(a)', comAjuda: 'Necesitó un adulto', canceladas: 'Abandonadas / canceladas',
    atraso: 'Retraso medio para empezar', pontual: 'Empezó a tiempo', sequencia: 'Días seguidos con rutina completa', rotinas: 'Rutinas completas', dificeis: 'Tareas más difíciles',
    duracao: 'Tiempo real vs. temporizador', estrelasGanhas: 'Estrellas ganadas', estrelasGastas: 'Estrellas canjeadas', premios: 'Premios elegidos', metas: 'Metas cumplidas',
    esperas: 'Esperas por el premio', esperouFim: 'Esperó hasta el final', desistiu: 'Desistió de esperar', esperaMedia: 'Tiempo medio de espera', regraPremio: 'Regla de premios', regraImediato: 'al momento', regraEspera: 'esperar {n} min para liberar', regraIntervalo: '{n} min entre un premio y otro', metasLista: 'Metas cumplidas en el período', conquistasLista: 'Logros del niño',
    crises: 'Crisis registradas', intensidade: 'Intensidad media (1–5)', duracaoCrise: 'Tiempo total en crisis', gatilhos: 'Posibles causas', ajudou: 'Qué ayudó',
    quando: 'Cuándo pasa más', diaSemana: 'Día de la semana con más crisis', correlacao: 'Crisis en días con rutina completa vs. sin rutina',
    rajadas: 'Toques repetidos sin parar (ráfagas)', pedidosAjuda: 'Pedidos de ayuda / dolor', sequenciasIncompletas: 'Varias frases abandonadas seguidas', tentouSair: 'Intentó salir de la app bloqueada',
    sentimentosTop: 'Más elegidos', negativos: 'Sentimientos difíciles (triste, enojado, miedo, dolor)', manha: 'mañana', tarde: 'tarde', noite: 'noche', madrugada: 'madrugada',
    porDia: 'por día', min: 'min', seg: 's', pal: 'palabras', vezes: 'vez(es)',
    d_palavrasSobe: 'Dijo {a} palabras, {p}% más que en el período anterior.', d_palavrasCai: 'Dijo {a} palabras, {p}% menos que en el período anterior.',
    d_novas: 'Palabras nuevas usadas: {a}.', d_frasesMaiores: 'Las frases son más largas: promedio de {a} palabras (antes {b}).',
    d_autonomia: 'Hizo el {a}% de las tareas solo(a).', d_adesao: 'Cumplió el {a}% de la rutina prevista.', d_sequencia: '{a} día(s) seguidos con la rutina completa.',
    d_crisesCai: 'Los momentos de crisis bajaron de {b} a {a}.', d_crisesSobe: 'Los momentos de crisis subieron de {b} a {a}.',
    d_incompletasSobe: 'Más frases empezadas y no dichas ({b} → {a}): puede indicar dificultad para encontrar palabras.',
    d_usoCai: 'Usó la app un {p}% menos que en el período anterior.', d_usoSobe: 'Usó la app un {p}% más.',
    d_ajuda: 'Pidió ayuda o habló de dolor {a} vez(es).', d_rajadas: '{a} ráfaga(s) de toques repetidos: conviene observar el contexto.',
    d_semDados: 'Aún hay pocos registros en este período.',
  },
};
type Txt = typeof T.pt;
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

// ------------------------------------------------------------------ funções comunicativas (léxico simples, sem acento)
const semAcento = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const LEX: Record<'pedir' | 'recusar' | 'sentir' | 'social' | 'ajuda', string[]> = {
  pedir: ['quero', 'quer', 'mais', 'da', 'me da', 'preciso', 'pode', 'agua', 'comer', 'beber', 'brincar', 'ir', 'want', 'more', 'give', 'need', 'can', 'water', 'eat', 'play', 'quiero', 'mas', 'dame', 'necesito', 'puedo', 'jugar'],
  recusar: ['nao', 'nao quero', 'para', 'chega', 'no', 'stop', 'dont', "don't", 'basta', 'nunca'],
  sentir: ['feliz', 'triste', 'bravo', 'raiva', 'medo', 'cansado', 'calmo', 'nervoso', 'happy', 'sad', 'angry', 'scared', 'tired', 'calm', 'enojado', 'miedo', 'cansada', 'tranquilo'],
  social: ['oi', 'ola', 'tchau', 'obrigado', 'obrigada', 'por favor', 'bom dia', 'boa tarde', 'boa noite', 'desculpa', 'hi', 'hello', 'bye', 'thanks', 'thank you', 'please', 'sorry', 'hola', 'adios', 'gracias', 'perdon', 'buenos dias'],
  ajuda: ['ajuda', 'socorro', 'sos', 'dor', 'doi', 'machucou', 'help', 'pain', 'hurts', 'ayuda', 'dolor', 'duele'],
};
const LEX_SET = Object.fromEntries(Object.entries(LEX).map(([k, v]) => [k, new Set(v)])) as Record<keyof typeof LEX, Set<string>>;
const ABA_FUNCAO: [RegExp, keyof typeof LEX][] = [[/social|expres/i, 'social'], [/sentim|emoc|feel/i, 'sentir']];

const funcoesDe = (palavras: string[], aba?: string) => {
  const r = { pedir: 0, recusar: 0, sentir: 0, social: 0, ajuda: 0 };
  const ws = palavras.map(semAcento);
  const juntas = ws.join(' ');
  for (const k of Object.keys(LEX) as (keyof typeof LEX)[]) {
    if (ws.some((w) => LEX_SET[k].has(w)) || LEX[k].some((f) => f.includes(' ') && juntas.includes(f))) r[k]++;
  }
  if (aba) for (const [re, k] of ABA_FUNCAO) if (re.test(aba) && !r[k]) r[k]++;
  return r;
};

// ------------------------------------------------------------------ métricas de um intervalo
export interface Metricas {
  base: ReturnType<typeof numeros>;
  mlu: number; // palavras por frase
  independencia?: number; // % frases sem sugestão
  incompletas: number;
  taxaIncompletas?: number;
  segPorFrase?: number;
  funcoes: { pedir: number; recusar: number; sentir: number; social: number; ajuda: number };
  periodoDia: Record<'manha' | 'tarde' | 'noite' | 'madrugada', number>;
  letras: number; apagadas: number; palavrasEscritas: number;
  sozinha: number; comAjuda: number; canceladas: number; previstas: number; adesao?: number; autonomia?: number;
  atrasoMedioMin?: number; pontual?: number; sequencia: number;
  dificeis: { tarefa: string; n: number }[];
  duracaoRelativa?: number; // % do temporizador usado
  premios: { premio: string; n: number }[]; metas: number;
  esperas: number; esperouFim: number; desistiu: number; esperaMediaMin?: number; metasLista: { meta: string; n: number }[];
  crises: Evento[]; intensidadeMedia?: number; minutosCrise: number;
  gatilhos: { id: string; n: number }[]; ajudou: { id: string; n: number }[];
  crisePorPeriodo: Record<'manha' | 'tarde' | 'noite' | 'madrugada', number>; criseDiaSemana?: number;
  correlacao?: { comRotina: number; semRotina: number };
  rajadas: number; pedidosAjuda: number; sequenciasIncompletas: number; tentouSair: number;
  sentimentos: { id: string; n: number }[]; negativos?: number;
}

const periodoDoDia = (t: number): 'manha' | 'tarde' | 'noite' | 'madrugada' => {
  const h = new Date(t).getHours();
  return h < 5 ? 'madrugada' : h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
};
const ranking = (o: Record<string, number>, n = 5) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
const minDoHorario = (h?: string) => {
  if (!h) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(h);
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};

export const metricas = (s: EstadoRotina, a: number, b: number, hoje = new Date()): Metricas => {
  const ev = s.log.filter((e) => e.t >= a && e.t < b);
  const base = numeros(s, a, b);
  const frases = ev.filter((e) => e.tipo === 'frase');
  const totPal = frases.reduce((x, e) => x + (e.palavras?.length || 0), 0);
  const comSug = frases.filter((e) => (e.sug || 0) > 0).length;
  const comMs = frases.filter((e) => (e.ms || 0) > 0);
  const incompletas = ev.filter((e) => e.tipo === 'frase_incompleta');
  const funcoes = { pedir: 0, recusar: 0, sentir: 0, social: 0, ajuda: 0 };
  const periodoDia = { manha: 0, tarde: 0, noite: 0, madrugada: 0 };
  for (const e of ev) {
    if (e.tipo === 'frase' || e.tipo === 'prancha') {
      const f = funcoesDe(e.tipo === 'frase' ? e.palavras || [] : [e.rotulo || ''], e.aba);
      (Object.keys(f) as (keyof typeof f)[]).forEach((k) => { funcoes[k] += f[k]; });
      periodoDia[periodoDoDia(e.t)]++;
    }
  }
  const tecl = ev.filter((e) => e.tipo === 'teclado');
  // rotina
  const fins = ev.filter((e) => e.tipo === 'tarefa_fim');
  const sozinha = fins.filter((e) => e.quem !== 'adulto').length;
  const comAjuda = fins.filter((e) => e.quem === 'adulto').length + ev.filter((e) => e.tipo === 'tarefa_liberada').length;
  const canceladas = ev.filter((e) => e.tipo === 'tarefa_cancelada').length;
  // previsto: tarefas agendadas nos dias com algum uso/registro
  const diasAtivos = new Set<string>();
  for (const e of ev) diasAtivos.add(chaveDia(e.t));
  for (const [k, seg] of Object.entries(s.uso || {})) { const t = new Date(`${k}T12:00:00`).getTime(); if (t >= a && t < b && seg > 0) diasAtivos.add(k); }
  let previstas = 0;
  for (const k of diasAtivos) {
    const dow = new Date(`${k}T12:00:00`).getDay();
    previstas += s.tarefas.filter((t) => t.dias.includes(dow)).length;
  }
  // pontualidade
  const atrasos: number[] = [];
  for (const e of ev.filter((x) => x.tipo === 'tarefa_inicio')) {
    const tarefa = s.tarefas.find((t) => t.id === e.tarefaId);
    const hm = minDoHorario(tarefa?.horario);
    if (hm === undefined) continue;
    const d = new Date(e.t);
    atrasos.push(d.getHours() * 60 + d.getMinutes() - hm);
  }
  const positivos = atrasos.map((x) => Math.max(0, x));
  // dificuldade: liberadas + canceladas + concluídas por adulto
  const dif: Record<string, number> = {};
  for (const e of ev) if ((e.tipo === 'tarefa_liberada' || e.tipo === 'tarefa_cancelada' || (e.tipo === 'tarefa_fim' && e.quem === 'adulto')) && e.rotulo) dif[e.rotulo] = (dif[e.rotulo] || 0) + 1;
  // duração relativa (só tarefas com temporizador concluídas pela criança antes do fim são raras; usamos todas com temporizador)
  const rel: number[] = [];
  for (const e of fins) {
    const tarefa = s.tarefas.find((t) => t.id === e.tarefaId);
    if (tarefa && tarefa.duracaoMin > 0 && e.segundos) rel.push(e.segundos / (tarefa.duracaoMin * 60));
  }
  // sequência de dias com rotina completa terminando hoje (ou ontem)
  const diasCompletos = new Set(s.log.filter((e) => e.tipo === 'rotina_completa').map((e) => chaveDia(e.t)));
  let sequencia = 0;
  let d = inicioDia(hoje);
  if (!diasCompletos.has(chaveDia(d))) d = somarDias(d, -1);
  while (diasCompletos.has(chaveDia(d))) { sequencia++; d = somarDias(d, -1); }
  // recompensas
  const prem: Record<string, number> = {};
  for (const e of ev) if (e.tipo === 'resgate' && e.rotulo) prem[e.rotulo] = (prem[e.rotulo] || 0) + 1;
  // crises
  const crises = ev.filter((e) => e.tipo === 'crise').sort((x, y) => y.t - x.t);
  const gat: Record<string, number> = {}; const aj: Record<string, number> = {};
  const crisePorPeriodo = { manha: 0, tarde: 0, noite: 0, madrugada: 0 };
  const porDow: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const c of crises) {
    (c.gatilhos || []).forEach((g) => { gat[g] = (gat[g] || 0) + 1; });
    (c.ajudou || []).forEach((g) => { aj[g] = (aj[g] || 0) + 1; });
    crisePorPeriodo[periodoDoDia(c.t)]++;
    porDow[new Date(c.t).getDay()]++;
  }
  let correlacao: Metricas['correlacao'];
  if (crises.length) {
    const comR: string[] = []; const semR: string[] = [];
    for (const k of diasAtivos) (diasCompletos.has(k) ? comR : semR).push(k);
    if (comR.length && semR.length) {
      const cnt = (ks: string[]) => crises.filter((c) => ks.includes(chaveDia(c.t))).length / ks.length;
      correlacao = { comRotina: Math.round(cnt(comR) * 10) / 10, semRotina: Math.round(cnt(semR) * 10) / 10 };
    }
  }
  // sinais automáticos
  const toques = ev.filter((e) => e.tipo === 'prancha').map((e) => e.t).sort((x, y) => x - y);
  let rajadas = 0;
  for (let i = 0; i + 7 < toques.length;) {
    if (toques[i + 7] - toques[i] <= 10000) { rajadas++; const fimR = toques[i + 7]; while (i < toques.length && toques[i] <= fimR + 5000) i++; } else i++;
  }
  const inc = incompletas.map((e) => e.t).sort((x, y) => x - y);
  let sequenciasIncompletas = 0;
  for (let i = 0; i + 2 < inc.length;) { if (inc[i + 2] - inc[i] <= 600000) { sequenciasIncompletas++; i += 3; } else i++; }
  // sentimentos
  const sent: Record<string, number> = {};
  for (const e of ev) if (e.tipo === 'sentimento' && e.valor) sent[e.valor] = (sent[e.valor] || 0) + 1;
  const totSent = Object.values(sent).reduce((x, y) => x + y, 0);
  const neg = ['triste', 'bravo', 'medo', 'dor'].reduce((x, k) => x + (sent[k] || 0), 0);
  const maxDow = Math.max(...porDow);
  return {
    base,
    mlu: frases.length ? Math.round((totPal / frases.length) * 10) / 10 : 0,
    independencia: frases.length ? Math.round(((frases.length - comSug) / frases.length) * 100) : undefined,
    incompletas: incompletas.length,
    taxaIncompletas: frases.length + incompletas.length ? Math.round((incompletas.length / (frases.length + incompletas.length)) * 100) : undefined,
    segPorFrase: comMs.length ? Math.round(comMs.reduce((x, e) => x + (e.ms || 0), 0) / comMs.length / 100) / 10 : undefined,
    funcoes, periodoDia,
    letras: tecl.reduce((x, e) => x + (e.letras || 0), 0), apagadas: tecl.reduce((x, e) => x + (e.apagadas || 0), 0),
    palavrasEscritas: tecl.reduce((x, e) => x + (e.palavras?.length || 0), 0),
    sozinha, comAjuda, canceladas, previstas,
    adesao: previstas ? Math.min(100, Math.round((fins.length / previstas) * 100)) : undefined,
    autonomia: sozinha + comAjuda ? Math.round((sozinha / (sozinha + comAjuda)) * 100) : undefined,
    atrasoMedioMin: positivos.length ? Math.round(positivos.reduce((x, y) => x + y, 0) / positivos.length) : undefined,
    pontual: atrasos.length ? Math.round((atrasos.filter((x) => x <= 15).length / atrasos.length) * 100) : undefined,
    sequencia,
    dificeis: ranking(dif).map(([tarefa, n]) => ({ tarefa, n })),
    duracaoRelativa: rel.length ? Math.round((rel.reduce((x, y) => x + y, 0) / rel.length) * 100) : undefined,
    premios: ranking(prem).map(([premio, n]) => ({ premio, n })),
    metas: ev.filter((e) => e.tipo === 'meta').length,
    // espera pelo prêmio (ensina a esperar)
    esperas: ev.filter((e) => e.tipo === 'espera_inicio').length,
    esperouFim: ev.filter((e) => e.tipo === 'resgate' && (e.esperouMin || 0) > 0).length,
    desistiu: ev.filter((e) => e.tipo === 'espera_desistiu').length,
    esperaMediaMin: (() => { const w = ev.filter((e) => e.tipo === 'resgate' && (e.esperouMin || 0) > 0).map((e) => e.esperouMin!); return w.length ? Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 10) / 10 : undefined; })(),
    metasLista: ranking(ev.filter((e) => e.tipo === 'meta' && e.rotulo).reduce((acc, e) => { acc[e.rotulo!] = (acc[e.rotulo!] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([meta, n]) => ({ meta, n })),
    crises,
    intensidadeMedia: crises.length ? Math.round((crises.reduce((x, c) => x + (c.intensidade || 0), 0) / crises.length) * 10) / 10 : undefined,
    minutosCrise: crises.reduce((x, c) => x + (c.duracaoMin || 0), 0),
    gatilhos: ranking(gat).map(([id, n]) => ({ id, n })), ajudou: ranking(aj).map(([id, n]) => ({ id, n })),
    crisePorPeriodo, criseDiaSemana: maxDow > 0 ? porDow.indexOf(maxDow) : undefined, correlacao,
    rajadas, pedidosAjuda: funcoes.ajuda, sequenciasIncompletas,
    tentouSair: ev.filter((e) => e.tipo === 'sinal' && e.valor === 'tentou_sair').length,
    sentimentos: ranking(sent, 7).map(([id, n]) => ({ id, n })),
    negativos: totSent ? Math.round((neg / totSent) * 100) : undefined,
  };
};

// ------------------------------------------------------------------ tendência e projeção
export interface Tendencia { direcao: 'sobe' | 'cai' | 'estavel' | 'sem'; pct?: number; projecao?: number }
/** Reta de tendência (mínimos quadrados) sobre as faixas do período. pct = variação do começo ao fim da reta, em relação à média. */
export const tendencia = (valores: number[], total: number): Tendencia => {
  const n = valores.length;
  const media = valores.reduce((x, y) => x + y, 0) / Math.max(1, n);
  if (n < 3 || media === 0 || valores.filter((v) => v > 0).length < 2) return { direcao: 'sem' };
  const mx = (n - 1) / 2;
  let num = 0; let den = 0;
  valores.forEach((v, i) => { num += (i - mx) * (v - media); den += (i - mx) ** 2; });
  const incl = den ? num / den : 0;
  const pct = Math.round(((incl * (n - 1)) / media) * 100);
  const lim = Math.max(-90, Math.min(300, pct));
  return { direcao: pct > 10 ? 'sobe' : pct < -10 ? 'cai' : 'estavel', pct, projecao: Math.max(0, Math.round(total * (1 + lim / 200))) };
};

// ------------------------------------------------------------------ montagem
export interface Item { rotulo: string; valor: string; delta?: number; /** true = subir é bom; false = subir é ruim */ subirBom?: boolean }
export interface Secao { id: IdSecao; titulo: string; emoji: string; itens: Item[]; listas?: { titulo: string; linhas: string[] }[]; tendencia?: Tendencia & { rotulo: string; unidade: string }; vazia?: boolean }
export interface Relatorio {
  idioma: Idioma; area: AreaRel; periodo: IdPeriodo; titulo: string; crianca?: string; periodoTexto: string;
  destaques: string[]; alertas: string[]; secoes: Secao[]; notas: { data: string; texto: string }[]; geradoEm: string; limitado?: boolean;
}

const dmY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const pctTxt = (v?: number) => (v === undefined ? '—' : `${v}%`);

export const gerarRelatorio = (s: EstadoRotina, periodo: IdPeriodo, area: AreaRel, idioma: Idioma, hoje = new Date(), opcoes: { limitado?: boolean; evolucao?: boolean } = {}): Relatorio => {
  const L: Txt = T[idioma];
  const j: Janela = janela(periodo, hoje, idioma);
  const dur = j.fim - j.inicio;
  const m = metricas(s, j.inicio, j.fim, hoje);
  const ant = metricas(s, j.inicio - dur, j.inicio, somarDias(new Date(j.inicio), -1));
  const n = m.base; const na = ant.base;
  const fx = j.faixas.map((f) => metricas(s, f.inicio, f.fim, new Date(f.fim - 1)));
  const tend = (vals: number[], total: number, rotulo: string, unidade: string) => ({ ...tendencia(vals, total), rotulo, unidade });

  // ---- destaques e alertas
  const destaques: string[] = []; const alertas: string[] = [];
  const vPal = variacao(n.palavrasFaladas, na.palavrasFaladas);
  if (vPal !== undefined && vPal >= 15) destaques.push(fmt(L.d_palavrasSobe, { a: n.palavrasFaladas, p: vPal }));
  if (vPal !== undefined && vPal <= -25) alertas.push(fmt(L.d_palavrasCai, { a: n.palavrasFaladas, p: -vPal }));
  if (n.palavrasNovas > 0) destaques.push(fmt(L.d_novas, { a: n.palavrasNovas }));
  if (m.mlu > 0 && ant.mlu > 0 && m.mlu - ant.mlu >= 0.3) destaques.push(fmt(L.d_frasesMaiores, { a: m.mlu, b: ant.mlu }));
  if (m.autonomia !== undefined && m.sozinha + m.comAjuda >= 3) destaques.push(fmt(L.d_autonomia, { a: m.autonomia }));
  if (m.adesao !== undefined && m.previstas >= 3) destaques.push(fmt(L.d_adesao, { a: m.adesao }));
  if (m.sequencia >= 2) destaques.push(fmt(L.d_sequencia, { a: m.sequencia }));
  if (ant.crises.length && m.crises.length < ant.crises.length) destaques.push(fmt(L.d_crisesCai, { a: m.crises.length, b: ant.crises.length }));
  if (m.crises.length > ant.crises.length && m.crises.length >= 2) alertas.push(fmt(L.d_crisesSobe, { a: m.crises.length, b: ant.crises.length }));
  if (m.incompletas >= 3 && m.incompletas > ant.incompletas * 1.3) alertas.push(fmt(L.d_incompletasSobe, { a: m.incompletas, b: ant.incompletas }));
  const vUso = variacao(n.segundosUso, na.segundosUso);
  if (vUso !== undefined && vUso <= -30) alertas.push(fmt(L.d_usoCai, { p: -vUso }));
  if (vUso !== undefined && vUso >= 30) destaques.push(fmt(L.d_usoSobe, { p: vUso }));
  if (m.pedidosAjuda >= 2) alertas.push(fmt(L.d_ajuda, { a: m.pedidosAjuda }));
  if (m.rajadas >= 2) alertas.push(fmt(L.d_rajadas, { a: m.rajadas }));
  if (!destaques.length && !alertas.length) destaques.push(L.d_semDados);

  // ---- seções
  const pd = (o: Record<'manha' | 'tarde' | 'noite' | 'madrugada', number>) =>
    (Object.entries(o) as [keyof typeof o, number][]).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${L[k]} (${v})`).join(', ') || '—';
  const sec: Record<IdSecao, () => Secao> = {
    // v14: evolução (pode ser desligada em Mais funções › Evolução no relatório)
    percebeu: () => { const l = oQueOAppPercebeu(s, j.inicio, j.fim, idioma); return { id: 'percebeu', emoji: '💡', titulo: TITULO_PERCEBEU[idioma], itens: [], listas: l.length ? [{ titulo: '', linhas: l }] : undefined, vazia: !l.length }; },
    evolucao: () => { const ev = evolucao(s, j.inicio, j.fim, idioma); return { id: 'evolucao', emoji: '🌱', titulo: ev.titulo, itens: ev.itens, listas: ev.listas, vazia: ev.vazia || opcoes.evolucao === false }; },
    uso: () => ({
      id: 'uso', emoji: '📱', titulo: L.s_uso,
      itens: [
        { rotulo: L.tempoApp, valor: tempoTexto(n.segundosUso), delta: vUso, subirBom: true },
        { rotulo: L.diasUso, valor: `${n.diasComUso} / ${j.dias}` },
        { rotulo: L.mediaDia, valor: tempoTexto(n.diasComUso ? n.segundosUso / n.diasComUso : 0) },
      ],
      tendencia: tend(fx.map((x) => Math.round(x.base.segundosUso / 60)), Math.round(n.segundosUso / 60), L.tempoApp, L.min),
    }),
    comunicacao: () => ({
      id: 'comunicacao', emoji: '🗣️', titulo: L.s_comunicacao, vazia: !n.vozAtivo,
      itens: [
        { rotulo: L.palavras, valor: String(n.palavrasFaladas), delta: vPal, subirBom: true },
        { rotulo: L.frases, valor: String(n.frases), delta: variacao(n.frases, na.frases), subirBom: true },
        { rotulo: L.tamFrase, valor: m.mlu ? `${m.mlu} ${L.pal}` : '—', delta: ant.mlu ? Math.round(((m.mlu - ant.mlu) / ant.mlu) * 100) : undefined, subirBom: true },
        { rotulo: L.palavrasDif, valor: String(n.palavrasDiferentes) },
        { rotulo: L.palavrasNovas, valor: String(n.palavrasNovas) },
        { rotulo: L.independencia, valor: pctTxt(m.independencia) },
        { rotulo: L.incompletas, valor: `${m.incompletas}${m.taxaIncompletas !== undefined ? ` (${m.taxaIncompletas}%)` : ''}`, delta: variacao(m.incompletas, ant.incompletas), subirBom: false },
        ...(m.segPorFrase !== undefined ? [{ rotulo: L.velocidade, valor: `${m.segPorFrase} ${L.seg}`, delta: ant.segPorFrase ? Math.round(((m.segPorFrase - ant.segPorFrase) / ant.segPorFrase) * 100) : undefined, subirBom: false }] : []),
        { rotulo: L.horarios, valor: pd(m.periodoDia) },
      ],
      listas: n.topPalavras.length ? [{ titulo: L.maisUsadas, linhas: [n.topPalavras.slice(0, 10).map((w) => `${w.palavra} (${w.n})`).join(', ')] }] : undefined,
      tendencia: tend(fx.map((x) => x.base.palavrasFaladas), n.palavrasFaladas, L.palavras, L.pal),
    }),
    funcoes: () => ({
      id: 'funcoes', emoji: '💬', titulo: L.s_funcoes, vazia: !n.vozAtivo,
      itens: [
        { rotulo: L.f_pedir, valor: String(m.funcoes.pedir), delta: variacao(m.funcoes.pedir, ant.funcoes.pedir) },
        { rotulo: L.f_recusar, valor: String(m.funcoes.recusar) },
        { rotulo: L.f_sentir, valor: String(m.funcoes.sentir), delta: variacao(m.funcoes.sentir, ant.funcoes.sentir), subirBom: true },
        { rotulo: L.f_social, valor: String(m.funcoes.social), delta: variacao(m.funcoes.social, ant.funcoes.social), subirBom: true },
        { rotulo: L.f_ajuda, valor: String(m.funcoes.ajuda) },
      ],
    }),
    teclado: () => ({
      id: 'teclado', emoji: '⌨️', titulo: L.s_teclado, vazia: m.letras === 0,
      itens: [
        { rotulo: L.letras, valor: String(m.letras), delta: variacao(m.letras, ant.letras), subirBom: true },
        { rotulo: L.palavrasEscritas, valor: String(m.palavrasEscritas), delta: variacao(m.palavrasEscritas, ant.palavrasEscritas), subirBom: true },
        { rotulo: L.apagadas, valor: `${m.apagadas}${m.letras ? ` (${Math.round((m.apagadas / m.letras) * 100)}%)` : ''}` },
      ],
      tendencia: tend(fx.map((x) => x.letras), m.letras, L.letras, ''),
    }),
    rotina: () => ({
      id: 'rotina', emoji: '📅', titulo: L.s_rotina, vazia: !n.rotinaAtivo,
      itens: [
        { rotulo: L.tarefas, valor: String(n.tarefas), delta: variacao(n.tarefas, na.tarefas), subirBom: true },
        { rotulo: L.adesao, valor: pctTxt(m.adesao) },
        { rotulo: L.sozinha, valor: `${m.sozinha}${m.autonomia !== undefined ? ` (${m.autonomia}%)` : ''}`, delta: variacao(m.sozinha, ant.sozinha), subirBom: true },
        { rotulo: L.comAjuda, valor: String(m.comAjuda), delta: variacao(m.comAjuda, ant.comAjuda), subirBom: false },
        { rotulo: L.canceladas, valor: String(m.canceladas) },
        { rotulo: L.rotinas, valor: String(n.rotinas), delta: variacao(n.rotinas, na.rotinas), subirBom: true },
        { rotulo: L.sequencia, valor: String(m.sequencia) },
        ...(m.pontual !== undefined ? [{ rotulo: L.pontual, valor: pctTxt(m.pontual) }, { rotulo: L.atraso, valor: `${m.atrasoMedioMin ?? 0} ${L.min}` }] : []),
        ...(m.duracaoRelativa !== undefined ? [{ rotulo: L.duracao, valor: `${m.duracaoRelativa}%` }] : []),
      ],
      listas: m.dificeis.length ? [{ titulo: L.dificeis, linhas: m.dificeis.map((x) => `${x.tarefa} (${x.n})`) }] : undefined,
      tendencia: tend(fx.map((x) => x.base.tarefas), n.tarefas, L.tarefas, ''),
    }),
    recompensas: () => {
      const modo = s.config.premioModo || 'imediato';
      const nMin = s.config.premioMin || 5;
      const regra = modo === 'espera' ? L.regraEspera.replace('{n}', String(nMin)) : modo === 'intervalo' ? L.regraIntervalo.replace('{n}', String(nMin)) : L.regraImediato;
      const ganhas = conquistas(s, idioma, hoje).filter((c) => c.ganha).map((c) => c.titulo);
      const listas = [
        ...(m.premios.length ? [{ titulo: L.premios, linhas: m.premios.map((x) => `${x.premio} (${x.n})`) }] : []),
        ...(m.metasLista.length ? [{ titulo: L.metasLista, linhas: m.metasLista.map((x) => `${x.meta} (${x.n})`) }] : []),
        ...(ganhas.length ? [{ titulo: L.conquistasLista, linhas: ganhas }] : []),
      ];
      return {
        id: 'recompensas', emoji: '⭐', titulo: L.s_recompensas, vazia: n.estrelasGanhas + n.estrelasGastas === 0 && m.esperas + m.desistiu === 0 && !ganhas.length,
        itens: [
          { rotulo: L.estrelasGanhas, valor: `+${n.estrelasGanhas}`, delta: variacao(n.estrelasGanhas, na.estrelasGanhas), subirBom: true },
          { rotulo: L.estrelasGastas, valor: String(n.estrelasGastas) },
          { rotulo: L.metas, valor: String(m.metas) },
          { rotulo: L.regraPremio, valor: regra },
          ...(m.esperas + m.desistiu ? [
            { rotulo: L.esperas, valor: String(m.esperas) },
            { rotulo: L.esperouFim, valor: String(m.esperouFim) },
            { rotulo: L.desistiu, valor: String(m.desistiu) },
            ...(m.esperaMediaMin !== undefined ? [{ rotulo: L.esperaMedia, valor: `${m.esperaMediaMin} min` }] : []),
          ] : []),
        ],
        listas: listas.length ? listas : undefined,
      };
    },
    crises: () => ({
      id: 'crises', emoji: '🌧️', titulo: L.s_crises, vazia: m.crises.length === 0 && ant.crises.length === 0,
      itens: [
        { rotulo: L.crises, valor: String(m.crises.length), delta: variacao(m.crises.length, ant.crises.length), subirBom: false },
        { rotulo: L.intensidade, valor: m.intensidadeMedia !== undefined ? String(m.intensidadeMedia) : '—' },
        { rotulo: L.duracaoCrise, valor: `${m.minutosCrise} ${L.min}` },
        { rotulo: L.quando, valor: pd(m.crisePorPeriodo) },
        ...(m.criseDiaSemana !== undefined ? [{ rotulo: L.diaSemana, valor: DIAS_NOME[idioma][m.criseDiaSemana] }] : []),
        ...(m.correlacao ? [{ rotulo: L.correlacao, valor: `${m.correlacao.comRotina} × ${m.correlacao.semRotina} ${L.porDia}` }] : []),
      ],
      listas: [
        ...(m.gatilhos.length ? [{ titulo: L.gatilhos, linhas: m.gatilhos.map((g) => `${rotuloLista(GATILHOS, g.id, idioma)} (${g.n})`) }] : []),
        ...(m.ajudou.length ? [{ titulo: L.ajudou, linhas: m.ajudou.map((g) => `${rotuloLista(AJUDOU, g.id, idioma)} (${g.n})`) }] : []),
        ...(m.crises.some((c) => c.nota) ? [{ titulo: L.notas, linhas: m.crises.filter((c) => c.nota).slice(0, 8).map((c) => `${dmY(new Date(c.t))}: ${c.nota}`) }] : []),
      ],
      tendencia: tend(fx.map((x) => x.crises.length), m.crises.length, L.crises, ''),
    }),
    sinais: () => ({
      id: 'sinais', emoji: '🔎', titulo: L.s_sinais,
      itens: [
        { rotulo: L.rajadas, valor: String(m.rajadas), delta: variacao(m.rajadas, ant.rajadas), subirBom: false },
        { rotulo: L.pedidosAjuda, valor: String(m.pedidosAjuda), delta: variacao(m.pedidosAjuda, ant.pedidosAjuda), subirBom: false },
        { rotulo: L.sequenciasIncompletas, valor: String(m.sequenciasIncompletas) },
        { rotulo: L.canceladas, valor: String(m.canceladas) },
        { rotulo: L.tentouSair, valor: String(m.tentouSair) },
      ],
    }),
    sentimentos: () => ({
      id: 'sentimentos', emoji: '😊', titulo: L.s_sentimentos, vazia: m.sentimentos.length === 0,
      itens: [{ rotulo: L.negativos, valor: pctTxt(m.negativos), delta: m.negativos !== undefined && ant.negativos !== undefined ? m.negativos - ant.negativos : undefined, subirBom: false }],
      listas: m.sentimentos.length ? [{ titulo: L.sentimentosTop, linhas: m.sentimentos.map((x) => { const f = SENTIMENTOS.find((y) => y.id === x.id); return `${f?.emoji || ''} ${f?.r[idioma] || x.id} (${x.n})`; }) }] : undefined,
    }),
    meses: () => {
      const ms = meses(s, j, idioma);
      return {
        id: 'meses', emoji: '🗓️', titulo: L.s_meses, vazia: ms.length < 2,
        itens: ms.map((x) => ({ rotulo: x.rotulo, valor: `${x.voz && x.rotina ? 'Voz + Rotina' : x.voz ? 'Voz' : x.rotina ? 'Rotina' : '—'} · ${x.palavras} ${L.pal} · ${x.tarefas} ✓ · ${x.minutosUso} ${L.min}` })),
      };
    },
  };
  let ids = SECOES_POR_AREA[area];
  if (opcoes.limitado) ids = ['percebeu', 'uso', 'comunicacao', 'evolucao', 'rotina'];
  const secoes = ids.map((id) => sec[id]()).filter((x) => !x.vazia || x.id === 'uso');
  const ini = new Date(j.inicio); const fim = somarDias(new Date(j.fim), -1);
  const notas = (s.notas || []).filter((x) => x.t >= j.inicio && x.t < j.fim).map((x) => ({ data: dmY(new Date(x.t)), texto: x.texto }));
  return {
    idioma, area, periodo, titulo: L.titulo, crianca: s.config.nomeCrianca || undefined,
    periodoTexto: `${rotuloPeriodo(periodo, idioma)} (${dmY(ini)} ${L.a} ${dmY(fim)})`,
    destaques: destaques.slice(0, 5), alertas: alertas.slice(0, 5), secoes, notas: opcoes.limitado ? [] : notas,
    geradoEm: `${L.geradoEm} ${dmY(hoje)} ${pad(hoje.getHours())}:${pad(hoje.getMinutes())}`, limitado: opcoes.limitado,
  };
};

const seta = (d?: number, bom?: boolean) => (d === undefined ? '' : d === 0 ? ' (=)' : ` (${d > 0 ? '↑' : '↓'} ${Math.abs(d)}%${bom === undefined ? '' : (d > 0) === bom ? ' ✓' : ' ⚠'})`);
const textoTendencia = (r: Relatorio, x: NonNullable<Secao['tendencia']>) => {
  const L = T[r.idioma];
  if (x.direcao === 'sem') return `${L.tendencia}: ${L.sem}`;
  return `${L.tendencia}: ${L[x.direcao]}${x.pct !== undefined ? ` (${x.pct > 0 ? '+' : ''}${x.pct}%)` : ''} · ${L.projecao}: ~${x.projecao}${x.unidade ? ` ${x.unidade}` : ''}`;
};

/** Texto para WhatsApp. */
export const relatorioTexto = (r: Relatorio) => {
  const L = T[r.idioma];
  const A = AREAS.find((x) => x.id === r.area)!;
  const out: string[] = [];
  out.push(`📊 *${r.titulo}${r.crianca ? ` — ${r.crianca}` : ''}*`);
  void A; // v14.2: relatório único, sem nome de área/profissional
  out.push(`${L.periodo}: ${r.periodoTexto}`);
  out.push('', `✨ *${L.resumo}*`, ...r.destaques.map((d) => `• ${d}`));
  if (r.alertas.length) out.push('', `⚠️ *${L.atencao}*`, ...r.alertas.map((d) => `• ${d}`));
  for (const s of r.secoes) {
    out.push('', `${s.emoji} *${s.titulo}*`);
    for (const i of s.itens) out.push(`• ${i.rotulo}: ${i.valor}${seta(i.delta, i.subirBom)}`);
    for (const l of s.listas || []) out.push(`• ${l.titulo}: ${l.linhas.join('; ')}`);
    if (s.tendencia) out.push(`📈 ${textoTendencia(r, s.tendencia)}`);
  }
  if (r.notas.length) out.push('', `📝 *${L.notas}*`, ...r.notas.map((x) => `• ${x.data}: ${x.texto}`));
  out.push('', `_${r.geradoEm}_`);
  return out.join('\n');
};

const esc = (x: string) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** HTML pronto para imprimir/salvar em PDF (expo-print ou o navegador). */
export const relatorioHtml = (r: Relatorio) => {
  const L = T[r.idioma];
  const A = AREAS.find((x) => x.id === r.area)!; void A;
  const linha = (i: Item) => {
    const cls = i.delta === undefined || i.subirBom === undefined || i.delta === 0 ? '' : (i.delta > 0) === i.subirBom ? 'bom' : 'ruim';
    return `<tr><td>${esc(i.rotulo)}</td><td class="v">${esc(i.valor)}${i.delta !== undefined ? ` <span class="d ${cls}">${i.delta > 0 ? '↑' : i.delta < 0 ? '↓' : '='} ${Math.abs(i.delta)}%</span>` : ''}</td></tr>`;
  };
  const secoes = r.secoes.map((s) => `
    <section><h2>${s.emoji} ${esc(s.titulo)}</h2>
      <table>${s.itens.map(linha).join('')}</table>
      ${(s.listas || []).map((l) => `<p><b>${esc(l.titulo)}:</b> ${esc(l.linhas.join('; '))}</p>`).join('')}
      ${s.tendencia ? `<p class="t">📈 ${esc(textoTendencia(r, s.tendencia))}</p>` : ''}
    </section>`).join('');
  return `<!doctype html><html lang="${r.idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.titulo)}</title>
<style>
  body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#0f172a;margin:24px;font-size:13px}
  h1{font-size:22px;margin:0} .sub{color:#475569;margin:4px 0 16px}
  .box{border-radius:12px;padding:12px 16px;margin:10px 0} .res{background:#ecfdf5;border:1px solid #a7f3d0} .ale{background:#fff7ed;border:1px solid #fed7aa}
  .box h3{margin:0 0 6px;font-size:14px} .box li{margin:3px 0}
  section{break-inside:avoid;margin-top:16px} h2{font-size:15px;border-bottom:2px solid #e2e8f0;padding-bottom:4px}
  table{width:100%;border-collapse:collapse} td{padding:5px 6px;border-bottom:1px solid #f1f5f9} td.v{text-align:right;font-weight:700}
  .d{font-weight:700;color:#64748b;font-size:11px} .d.bom{color:#15803d} .d.ruim{color:#be123c}
  .t{color:#4338ca;font-weight:600} footer{margin-top:24px;color:#64748b;font-size:11px}
</style></head><body>
<h1>📊 ${esc(r.titulo)}${r.crianca ? ` — ${esc(r.crianca)}` : ''}</h1>
<div class="sub">${esc(L.periodo)}: ${esc(r.periodoTexto)}</div>
<div class="box res"><h3>✨ ${esc(L.resumo)}</h3><ul>${r.destaques.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
${r.alertas.length ? `<div class="box ale"><h3>⚠️ ${esc(L.atencao)}</h3><ul>${r.alertas.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
${secoes}
${r.notas.length ? `<section><h2>📝 ${esc(L.notas)}</h2>${r.notas.map((x) => `<p><b>${esc(x.data)}</b> — ${esc(x.texto)}</p>`).join('')}</section>` : ''}
<footer>${esc(r.geradoEm)}</footer>
</body></html>`;
};

export const TEXTOS_RELATORIO = T;
export { chaveDia };
