// VOZ AMIGA v14 — APOIO AOS PAIS: missão do dia, mensagens de apoio, dúvidas comuns (com fontes).
// As afirmações seguem pesquisas revisadas por pares e a ASHA (associação americana de fonoaudiologia).
// Nada aqui substitui a avaliação da fono, do médico ou do terapeuta.
import { Idioma } from '../tipos';

type L = Record<Idioma, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });

export interface Missao { id: string; emoji: string; t: L }
export const MISSOES: Missao[] = [
  { id: 'm1', emoji: '💧', t: l('Na hora de beber, toque em ÁGUA no app antes de dar o copo.', 'At drink time, tap WATER on the app before giving the cup.', 'A la hora de beber, toca AGUA en la app antes de dar el vaso.') },
  { id: 'm2', emoji: '👆', t: l('Hoje, mostre 3 vezes uma palavra no app enquanto fala com a criança.', 'Today, show a word on the app 3 times while you talk to your child.', 'Hoy, muestra 3 veces una palabra en la app mientras hablas con el niño.') },
  { id: 'm3', emoji: '⏳', t: l('Depois de perguntar, conte até 10 em silêncio. Dê tempo para a criança responder.', 'After asking, count to 10 silently. Give your child time to answer.', 'Después de preguntar, cuenta hasta 10 en silencio. Dale tiempo para responder.') },
  { id: 'm4', emoji: '🎉', t: l('Comemore qualquer toque da criança no app, mesmo sem querer.', 'Celebrate any tap your child makes, even by accident.', 'Celebra cualquier toque del niño en la app, aunque sea sin querer.') },
  { id: 'm5', emoji: '🧸', t: l('Na brincadeira, use MAIS e PARAR no app.', 'While playing, use MORE and STOP on the app.', 'Jugando, usa MÁS y PARAR en la app.') },
  { id: 'm6', emoji: '🍽️', t: l('Deixe o celular perto na hora da refeição.', 'Keep the phone close at mealtime.', 'Deja el celular cerca a la hora de comer.') },
  { id: 'm7', emoji: '🙋', t: l('Ofereça duas escolhas no app: "suco ou água?".', 'Offer two choices on the app: "juice or water?".', 'Ofrece dos opciones en la app: "¿jugo o agua?".') },
  { id: 'm8', emoji: '😊', t: l('Mostre como você se sente: toque em FELIZ ou CANSADO.', 'Show how you feel: tap HAPPY or TIRED.', 'Muestra cómo te sientes: toca FELIZ o CANSADO.') },
  { id: 'm9', emoji: '👋', t: l('Use o app para dizer OI e TCHAU para alguém da família.', 'Use the app to say HI and BYE to someone in the family.', 'Usa la app para decir HOLA y CHAO a alguien de la familia.') },
  { id: 'm10', emoji: '🛁', t: l('Na hora do banho, mostre 2 palavras do banho no app.', 'At bath time, show 2 bath words on the app.', 'A la hora del baño, muestra 2 palabras del baño en la app.') },
  { id: 'm11', emoji: '📸', t: l('Tire a foto de algo que a criança adora e crie um botão.', 'Take a photo of something your child loves and make a button.', 'Saca una foto de algo que al niño le encanta y crea un botón.') },
  { id: 'm12', emoji: '🔁', t: l('Repita a palavra que a criança tocou, falando junto.', 'Repeat the word your child tapped, saying it together.', 'Repite la palabra que el niño tocó, diciéndola juntos.') },
  { id: 'm13', emoji: '🚫', t: l('Não peça "fala!" ou "toca aqui!". Só mostre, sem cobrar.', 'Don’t say "say it!" or "tap here!". Just show, without pressure.', 'No pidas "¡dilo!" o "¡toca aquí!". Solo muestra, sin presionar.') },
  { id: 'm14', emoji: '📖', t: l('Ao ler uma história, aponte 2 palavras no app.', 'While reading a story, point to 2 words on the app.', 'Al leer un cuento, señala 2 palabras en la app.') },
];

/** Missão do dia: muda todo dia, igual para o dia inteiro. */
export const missaoDoDia = (chaveDia: string): Missao => {
  let h = 0;
  for (const c of chaveDia) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MISSOES[h % MISSOES.length];
};

export interface Fonte { r: string; url?: string }
export const FONTES: Record<string, Fonte> = {
  romski2005: { r: 'Romski & Sevcik (2005). Augmentative communication and early intervention: myths and realities. Infants & Young Children, 18(3).' },
  millar2006: { r: 'Millar, Light & Schlosser (2006). The impact of AAC intervention on the speech production of individuals with developmental disabilities. JSLHR, 49(2).' },
  schlosser2008: { r: 'Schlosser & Wendt (2008). Effects of AAC intervention on speech production in children with autism: a systematic review. AJSLP, 17(3).' },
  sennott2016: { r: 'Sennott, Light & McNaughton (2016). AAC modeling intervention research review. Research and Practice for Persons with Severe Disabilities, 41(2).' },
  asha: { r: 'ASHA — Augmentative and Alternative Communication (Practice Portal).', url: 'https://www.asha.org/practice-portal/professional-issues/augmentative-and-alternative-communication/' },
};

export interface Apoio { id: string; t: L; fontes: string[] }
export const MENSAGENS_APOIO: Apoio[] = [
  { id: 'a1', t: l('O app não atrapalha a fala. As pesquisas mostram que a comunicação alternativa não faz a criança parar de falar, e muitas vezes ajuda.', 'The app does not hold back speech. Research shows AAC does not stop children from talking, and often helps.', 'La app no frena el habla. Las investigaciones muestran que la comunicación alternativa no hace que el niño deje de hablar, y muchas veces ayuda.'), fontes: ['millar2006', 'schlosser2008', 'romski2005'] },
  { id: 'a2', t: l('Você usar o app na frente da criança é a melhor aula. Ela aprende vendo, como aprendeu a falar ouvindo.', 'You using the app in front of your child is the best lesson. Children learn by seeing, like they learned to talk by hearing.', 'Que tú uses la app frente al niño es la mejor clase. Aprende viendo, como aprendió a hablar escuchando.'), fontes: ['sennott2016', 'asha'] },
  { id: 'a3', t: l('Não existe idade mínima nem "pré-requisito" para começar. Qualquer momento é um bom momento.', 'There is no minimum age or "prerequisite" to start. Any time is a good time.', 'No hay edad mínima ni "requisito" para empezar. Cualquier momento es bueno.'), fontes: ['romski2005', 'asha'] },
  { id: 'a4', t: l('Errar faz parte. Toques sem querer também são aprendizado.', 'Mistakes are part of it. Accidental taps are learning too.', 'Equivocarse es parte. Los toques sin querer también son aprendizaje.'), fontes: ['asha'] },
];
export const AVISO_SEMANAS: Apoio = { id: 'semanas', t: l('É normal levar semanas (ou meses) até a criança usar sozinha. Continue mostrando, sem cobrar.', 'It’s normal to take weeks (or months) before the child uses it alone. Keep showing, without pressure.', 'Es normal tardar semanas (o meses) hasta que el niño la use solo. Sigue mostrando, sin presionar.'), fontes: ['sennott2016'] };

export interface Duvida { id: string; p: L; r: L; fontes: string[] }
export const DUVIDAS: Duvida[] = [
  { id: 'd1', p: l('O app vai atrapalhar a fala do meu filho?', 'Will the app hold back my child’s speech?', '¿La app va a frenar el habla de mi hijo?'),
    r: l('Não. Revisões de muitos estudos não encontraram piora na fala; muitas crianças até falaram mais. O app é mais um caminho, não substitui a fala.', 'No. Reviews of many studies found no decline in speech; many children even spoke more. The app is one more path, it doesn’t replace speech.', 'No. Revisiones de muchos estudios no encontraron empeoramiento del habla; muchos niños hablaron más. La app es un camino más, no reemplaza el habla.'), fontes: ['millar2006', 'schlosser2008'] },
  { id: 'd2', p: l('Meu filho precisa saber ler?', 'Does my child need to read?', '¿Mi hijo necesita saber leer?'),
    r: l('Não. As imagens e a voz fazem o trabalho. A palavra escrita aparece junto e ajuda a aprender a ler com o tempo.', 'No. The pictures and the voice do the work. The written word shows up too and helps with reading over time.', 'No. Las imágenes y la voz hacen el trabajo. La palabra escrita aparece junto y ayuda a leer con el tiempo.'), fontes: ['romski2005'] },
  { id: 'd3', p: l('Como eu ensino?', 'How do I teach?', '¿Cómo enseño?'),
    r: l('Mostrando. Enquanto fala com a criança, toque nas palavras no app (o "modo exemplo" ajuda). Não peça para ela repetir; só mostre, muitas vezes, no dia a dia.', 'By showing. While you talk, tap the words on the app ("show-me mode" helps). Don’t ask them to repeat; just show, many times, every day.', 'Mostrando. Mientras hablas, toca las palabras en la app (el "modo ejemplo" ayuda). No pidas que repita; solo muestra, muchas veces, cada día.'), fontes: ['sennott2016', 'asha'] },
  { id: 'd4', p: l('Começo com poucos ou muitos botões?', 'Start with few or many buttons?', '¿Empiezo con pocos o muchos botones?'),
    r: l('Muitas famílias começam com 5 ou 6 botões que a criança adora e vão aumentando, sem mudar os antigos de lugar. Outras começam com mais palavras. Converse com a fono sobre o melhor para o seu filho.', 'Many families start with 5 or 6 buttons the child loves and add more, without moving the old ones. Others start with more words. Talk to the therapist about what’s best for your child.', 'Muchas familias empiezan con 5 o 6 botones que al niño le encantan y van sumando, sin mover los viejos. Otras empiezan con más palabras. Habla con la fono sobre lo mejor para tu hijo.'), fontes: ['asha'] },
  { id: 'd5', p: l('Quanto tempo demora?', 'How long does it take?', '¿Cuánto tiempo tarda?'),
    r: l('Cada criança tem seu tempo. Pode levar semanas ou meses. O que mais ajuda é usar todo dia, em situações reais.', 'Every child has their own pace. It can take weeks or months. Using it every day, in real situations, helps most.', 'Cada niño tiene su tiempo. Puede tardar semanas o meses. Lo que más ayuda es usarla cada día, en situaciones reales.'), fontes: ['sennott2016'] },
  { id: 'd6', p: l('E se a criança só ficar brincando de apertar?', 'What if my child just plays with tapping?', '¿Y si el niño solo juega a tocar?'),
    r: l('É normal no começo: é assim que ela descobre o que cada botão diz. Responda ao que ela tocou, como se fosse de propósito.', 'It’s normal at first: that’s how they learn what each button says. Respond to what they tapped as if it were on purpose.', 'Es normal al principio: así descubre lo que dice cada botón. Responde a lo que tocó como si fuera a propósito.'), fontes: ['asha'] },
  { id: 'd7', p: l('O app substitui a fono?', 'Does the app replace speech therapy?', '¿La app reemplaza a la fono?'),
    r: l('Não. O Voz Amiga é uma ferramenta de apoio. Leve o relatório do app para a fono: ajuda muito no acompanhamento.', 'No. Voz Amiga is a support tool. Bring the app report to the therapist: it helps a lot.', 'No. Voz Amiga es una herramienta de apoyo. Lleva el informe de la app a la fono: ayuda mucho.'), fontes: ['asha'] },
];

/** Lembrete para os pais: aparece (sem pop-up) depois da hora escolhida se ninguém usou o modo exemplo hoje. */
export const precisaLembrete = (agora: Date, horaLembrete: number, usouExemploHoje: boolean) => !usouExemploHoje && agora.getHours() >= horaLembrete;
export const TEXTO_LEMBRETE: L = l('Que tal usar o app junto com a criança hoje? 💛', 'How about using the app with your child today? 💛', '¿Qué tal usar la app junto al niño hoy? 💛');
