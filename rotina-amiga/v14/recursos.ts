// VOZ AMIGA v14 — "CHAVES" DE CADA FUNÇÃO NOVA
//
// Duas camadas, como o Adriano pediu:
//   1) OS PAIS ligam e desligam cada função (Ajustes › Definições › Funções do app).
//   2) O ADRIANO (dono do app), pelo Firebase, libera/bloqueia cada função e diz se ela é do plano grátis ou do
//      Plano Completo. Hoje NADA vem do Firebase: tudo liberado. Quando ligar, basta passar `recursosFirebase`
//      ao <RotinaAmigaProvider> com o conteúdo de RTDB `limitações/recursos` (ver integracao-firebase/recursos-v14.json).
//
// Regra final de cada função:  liberada pelo dono  E  (grátis  OU  assinante === true)  E  ligada pelos pais.
import { Idioma } from '../tipos';

export type IdRecurso =
  // A. segurança das pranchas
  | 'backupAuto' | 'apagarPranchas' | 'senhaPais' | 'emergencia'
  // B. voz
  | 'vozes' | 'vozGravada'
  // C. ensinar e apoiar os pais
  | 'curso' | 'missaoDia' | 'lembretePais' | 'modoExemplo' | 'mensagensApoio' | 'avisoSemanas' | 'duvidas'
  // D. menos trabalho
  | 'pacotesRotina' | 'rotinaPranchas'
  // E. crescer com a criança
  | 'niveis' | 'gradeCrescente' | 'visualIdade'
  // G. progresso
  | 'relatorioEvolucao' | 'marcos'
  // H. IA
  | 'ia'
  // I. conforto
  | 'telaCalma' | 'botoesGrandes' | 'tempoToque' | 'estilosBotao' | 'fundoAnimado' | 'modoTablet';

export type GrupoRecurso = 'seguranca' | 'voz' | 'pais' | 'trabalho' | 'crescer' | 'progresso' | 'ia' | 'conforto';

export interface DefRecurso {
  id: IdRecurso;
  grupo: GrupoRecurso;
  emoji: string;
  /** ligado quando a família instala (os pais mudam depois) */
  padrao: boolean;
  nome: Record<Idioma, string>;
  /** uma frase simples, para leigos */
  explica: Record<Idioma, string>;
  /** tem uma tela com mais ajustes */
  temAjustes?: boolean;
}

export const GRUPOS_RECURSO: { id: GrupoRecurso; emoji: string; r: Record<Idioma, string>; d: Record<Idioma, string> }[] = [
  { id: 'seguranca', emoji: '🛡️', r: { pt: 'Proteger as pranchas', en: 'Protect the cards', es: 'Proteger las tarjetas' }, d: { pt: 'Para não perder nada do que você montou.', en: 'So you never lose what you built.', es: 'Para no perder nada de lo que armaste.' } },
  { id: 'pais', emoji: '👨‍👩‍👧', r: { pt: 'Aprender e apoio para os pais', en: 'Learning and support for parents', es: 'Aprender y apoyo para los padres' }, d: { pt: 'Passo a passo, sem pressa.', en: 'Step by step, no rush.', es: 'Paso a paso, sin prisa.' } },
  { id: 'trabalho', emoji: '⏱️', r: { pt: 'Menos trabalho', en: 'Less work', es: 'Menos trabajo' }, d: { pt: 'Coisas prontas para o dia a dia.', en: 'Ready-made things for every day.', es: 'Cosas listas para el día a día.' } },
  { id: 'crescer', emoji: '🌱', r: { pt: 'Crescer com a criança', en: 'Grow with the child', es: 'Crecer con el niño' }, d: { pt: 'O app acompanha cada fase.', en: 'The app follows each stage.', es: 'La app acompaña cada etapa.' } },
  { id: 'progresso', emoji: '📈', r: { pt: 'Ver o progresso', en: 'See progress', es: 'Ver el progreso' }, d: { pt: 'Para você e para a fono.', en: 'For you and the therapist.', es: 'Para ti y la fono.' } },
  { id: 'conforto', emoji: '🌙', r: { pt: 'Conforto da tela', en: 'Screen comfort', es: 'Comodidad de la pantalla' }, d: { pt: 'Calma, tamanho e jeito dos botões.', en: 'Calm, size and style of buttons.', es: 'Calma, tamaño y estilo de los botones.' } },
  { id: 'ia', emoji: '✨', r: { pt: 'IA (opcional)', en: 'AI (optional)', es: 'IA (opcional)' }, d: { pt: 'Sugestões. Você sempre aprova.', en: 'Suggestions. You always approve.', es: 'Sugerencias. Tú siempre apruebas.' } },
];

const R = (id: IdRecurso, grupo: GrupoRecurso, emoji: string, padrao: boolean, nome: [string, string, string], explica: [string, string, string], temAjustes?: boolean): DefRecurso =>
  ({ id, grupo, emoji, padrao, nome: { pt: nome[0], en: nome[1], es: nome[2] }, explica: { pt: explica[0], en: explica[1], es: explica[2] }, temAjustes });

export const RECURSOS: DefRecurso[] = [
  R('backupAuto', 'seguranca', '💾', true, ['Cópia de segurança', 'Backup', 'Copia de seguridad'], ['Guarda sozinho uma cópia das pranchas no celular. Você pode mandar a cópia para o Drive ou WhatsApp.', 'Saves a copy of the cards on the phone by itself. You can send it to Drive or WhatsApp.', 'Guarda sola una copia de las tarjetas en el celular. Puedes enviarla a Drive o WhatsApp.'], true),
  R('apagarPranchas', 'seguranca', '🗑️', false, ['Permitir apagar pranchas', 'Allow deleting cards', 'Permitir borrar tarjetas'], ['Desligado, ninguém apaga uma prancha sem querer. Ligue só quando for apagar.', 'When off, nobody deletes a card by accident. Turn on only when you need to delete.', 'Apagado, nadie borra una tarjeta sin querer. Enciéndelo solo para borrar.']),
  R('senhaPais', 'seguranca', '🔑', false, ['Senha dos pais', 'Parents’ PIN', 'Clave de los padres'], ['Além de segurar e fazer a continha, pede uma senha de números para entrar nos ajustes.', 'Besides holding and the quick sum, asks for a number PIN to open settings.', 'Además de mantener y hacer la cuenta, pide una clave de números para entrar.'], true),
  R('emergencia', 'seguranca', '🆘', true, ['Botão de emergência', 'Emergency button', 'Botón de emergencia'], ['Um botão vermelho pequeno na barra da frase: "estou com dor" e "preciso de ajuda".', 'A small red button on the sentence bar: "I am in pain" and "I need help".', 'Un botón rojo pequeño en la barra: "me duele" y "necesito ayuda".'], true),

  R('vozes', 'voz', '🗣️', true, ['Escolher a voz', 'Choose the voice', 'Elegir la voz'], ['Voz do celular, voz gravada dos pais e outras. Se uma falhar, o app usa a próxima.', 'Phone voice, parents’ recorded voice and more. If one fails, the app uses the next.', 'Voz del celular, voz grabada de los padres y otras. Si una falla, usa la siguiente.'], true),
  R('vozGravada', 'voz', '🎙️', true, ['Voz gravada dos pais', 'Parents’ recorded voice', 'Voz grabada de los padres'], ['Quando a prancha tem uma gravação, toca a gravação no lugar da voz do celular.', 'When a card has a recording, it plays the recording instead of the phone voice.', 'Si la tarjeta tiene grabación, suena la grabación en lugar de la voz del celular.']),

  R('curso', 'pais', '🎓', true, ['Curso para os pais', 'Course for parents', 'Curso para los padres'], ['Lições curtas com o mascote mostrando cada parte do app. Pode repetir quando quiser.', 'Short lessons with the mascot showing each part of the app. Repeat any time.', 'Lecciones cortas con la mascota mostrando cada parte. Repite cuando quieras.'], true),
  R('missaoDia', 'pais', '🎯', true, ['Missão do dia', 'Mission of the day', 'Misión del día'], ['Uma tarefinha por dia para você usar o app junto com a criança.', 'One small task a day to use the app together with your child.', 'Una tarea pequeña al día para usar la app junto al niño.'], true),
  R('lembretePais', 'pais', '⏰', true, ['Lembrete para os pais', 'Reminder for parents', 'Recordatorio para los padres'], ['Lembra você de usar também. A criança aprende vendo você usar.', 'Reminds you to use it too. Children learn by seeing you use it.', 'Te recuerda usarla también. El niño aprende viéndote usarla.']),
  R('modoExemplo', 'pais', '👆', true, ['Modo exemplo', 'Show-me mode', 'Modo ejemplo'], ['Você toca nas pranchas para mostrar. O app destaca e fala junto, e não conta como se fosse a criança.', 'You tap the cards to show. The app highlights and speaks along, and it doesn’t count as the child.', 'Tocas las tarjetas para mostrar. La app resalta y habla contigo, y no cuenta como si fuera el niño.']),
  R('mensagensApoio', 'pais', '💛', true, ['Mensagens de apoio', 'Support messages', 'Mensajes de apoyo'], ['Frases curtas para tirar o medo de que o app atrapalhe a fala.', 'Short messages about the fear that the app hinders speech.', 'Frases cortas sobre el miedo de que la app frene el habla.']),
  R('avisoSemanas', 'pais', '📅', false, ['Aviso "é normal demorar"', '"It takes time" notice', 'Aviso "es normal tardar"'], ['Lembra que pode levar semanas para a criança começar a usar sozinha.', 'Reminds you it can take weeks for the child to use it alone.', 'Recuerda que puede tardar semanas en usarla solo.']),
  R('duvidas', 'pais', '❓', true, ['Dúvidas comuns', 'Common questions', 'Dudas comunes'], ['Respostas simples, com informação de profissionais.', 'Simple answers, with information from professionals.', 'Respuestas simples, con información de profesionales.'], true),

  R('pacotesRotina', 'trabalho', '🧺', true, ['Pacotes por rotina', 'Routine packs', 'Paquetes por rutina'], ['Pranchas prontas para café, banho, escola, parque, médico e dormir.', 'Ready cards for breakfast, bath, school, park, doctor and bedtime.', 'Tarjetas listas para desayuno, baño, escuela, parque, médico y dormir.']),
  R('rotinaPranchas', 'trabalho', '🗓️', true, ['A rotina mostra as pranchas certas', 'Routine shows the right cards', 'La rutina muestra las tarjetas correctas'], ['Quando começa uma tarefa da rotina, abre a aba das pranchas daquela hora.', 'When a routine task starts, it opens the tab with the cards for that moment.', 'Al empezar una tarea, abre la pestaña de tarjetas de ese momento.']),

  R('niveis', 'crescer', '🪜', false, ['Níveis de frase', 'Sentence levels', 'Niveles de frase'], ['Começa com uma palavra, depois duas, depois frases. Pode ser você que muda ou o app sugere.', 'Starts with one word, then two, then sentences. You change it or the app suggests.', 'Empieza con una palabra, luego dos, luego frases. Lo cambias tú o la app sugiere.'], true),
  R('gradeCrescente', 'crescer', '🔢', false, ['Poucos botões no começo', 'Few buttons at first', 'Pocos botones al principio'], ['Mostra só alguns botões (5 ou 6) e vai aumentando. As palavras antigas não mudam de lugar.', 'Shows only a few buttons (5 or 6) and adds more. Old words stay in place.', 'Muestra pocos botones (5 o 6) y va sumando. Las palabras viejas no cambian de lugar.'], true),
  R('visualIdade', 'crescer', '🧒', true, ['Visual por idade', 'Look by age', 'Aspecto por edad'], ['Criança, adolescente ou adulto. Muda o jeito da tela sem perder nada.', 'Child, teen or adult. Changes the look without losing anything.', 'Niño, adolescente o adulto. Cambia el aspecto sin perder nada.'], true),

  R('relatorioEvolucao', 'progresso', '📊', true, ['Evolução no relatório', 'Progress in the report', 'Evolución en el informe'], ['Palavras novas, pedidos feitos sozinho, nível, marcos e missões no relatório.', 'New words, requests made alone, level, milestones and missions in the report.', 'Palabras nuevas, pedidos hechos solo, nivel, logros y misiones en el informe.']),
  R('marcos', 'progresso', '🏅', true, ['Marcos', 'Milestones', 'Logros'], ['Guarda as conquistas importantes, como a primeira frase de duas palavras. Sem pop-up.', 'Keeps important milestones, like the first two-word sentence. No pop-ups.', 'Guarda los logros importantes, como la primera frase de dos palabras. Sin ventanas.']),

  R('ia', 'ia', '✨', false, ['IA (opcional)', 'AI (optional)', 'IA (opcional)'], ['Sugere frases, nomes e pranchas por tema. Você sempre aprova. Nunca conversa com a criança.', 'Suggests sentences, names and themed boards. You always approve. Never chats with the child.', 'Sugiere frases, nombres y tableros por tema. Tú apruebas. Nunca conversa con el niño.'], true),

  R('telaCalma', 'conforto', '🌙', false, ['Tela calma', 'Calm screen', 'Pantalla calma'], ['Cores mais suaves e nada se mexendo.', 'Softer colors and nothing moving.', 'Colores más suaves y nada en movimiento.']),
  R('botoesGrandes', 'conforto', '🔍', false, ['Botões grandes', 'Big buttons', 'Botones grandes'], ['Menos botões por linha, cada um maior.', 'Fewer buttons per row, each one bigger.', 'Menos botones por fila, cada uno más grande.']),
  R('tempoToque', 'conforto', '✋', false, ['Tempo de toque', 'Touch time', 'Tiempo de toque'], ['O botão só fala se o dedo ficar um pouquinho em cima. Evita toques sem querer.', 'The button only speaks if the finger stays a moment. Avoids accidental taps.', 'El botón solo habla si el dedo se queda un momento. Evita toques sin querer.'], true),
  R('estilosBotao', 'conforto', '🎨', true, ['Estilo dos botões', 'Button style', 'Estilo de los botones'], ['Redondinho, quadrado ou com borda. Sempre nas cores do Voz Amiga.', 'Rounded, square or outlined. Always in Voz Amiga colors.', 'Redondeado, cuadrado o con borde. Siempre en los colores de Voz Amiga.'], true),
  R('fundoAnimado', 'conforto', '🫧', false, ['Fundo animado', 'Animated background', 'Fondo animado'], ['Bolinhas coloridas bem devagar no fundo. Vem desligado para não agitar.', 'Colorful bubbles moving slowly in the background. Off by default so it doesn’t agitate.', 'Burbujas de colores lentas al fondo. Apagado para no agitar.']),
  R('modoTablet', 'conforto', '📱', true, ['Celular ou tablet', 'Phone or tablet', 'Celular o tablet'], ['Ajusta o tamanho da tela. No automático o app descobre sozinho.', 'Fits the screen size. On automatic the app figures it out.', 'Ajusta el tamaño. En automático la app lo detecta sola.'], true),
];

export const recursoDef = (id: IdRecurso) => RECURSOS.find((r) => r.id === id)!;

/** O que o Firebase pode mandar para cada função (tudo opcional). */
export interface RegraRemota { liberado?: boolean; plano?: 'gratis' | 'completo' }
export type RegrasRemotas = Partial<Record<IdRecurso, RegraRemota>>;

/** Lê o nó do Firebase de forma segura (valores estranhos são ignorados). */
export const lerRecursosFirebase = (bruto: unknown): RegrasRemotas => {
  const out: RegrasRemotas = {};
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return out;
  for (const def of RECURSOS) {
    const v = (bruto as Record<string, unknown>)[def.id];
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    const r: RegraRemota = {};
    if (typeof o.liberado === 'boolean') r.liberado = o.liberado;
    if (o.plano === 'gratis' || o.plano === 'completo') r.plano = o.plano;
    out[def.id] = r;
  }
  return out;
};

/** v14.7: PLANO PADRÃO (o mesmo de integracao-firebase/recursos-v14.json). Acessibilidade e o que ajuda os pais
 *  continuam grátis; o Firebase pode mudar qualquer item sem atualizar o app. */
export const REGRAS_PADRAO: RegrasRemotas = {
  niveis: { plano: 'completo' }, visualIdade: { plano: 'completo' }, ia: { plano: 'completo' },
  estilosBotao: { plano: 'completo' }, fundoAnimado: { plano: 'completo' }, relatorioEvolucao: { plano: 'completo' },
};

export type Disponibilidade = 'ok' | 'bloqueado' | 'plano';
/** O dono do app deixa usar? ('plano' = é do Plano Completo e a família não é assinante) */
/** Proteções da família nunca dependem do plano nem do Firebase (o dono não consegue desligar). */
export const PROTECOES: IdRecurso[] = ['senhaPais', 'emergencia', 'backupAuto', 'apagarPranchas'];
export const disponibilidade = (id: IdRecurso, remotos: RegrasRemotas | undefined, assinante: boolean): Disponibilidade => {
  if (PROTECOES.includes(id)) return 'ok';
  // o que o Firebase mandar vale; se não mandar nada (ou estiver sem internet), vale o plano padrão abaixo
  const r = { ...REGRAS_PADRAO[id], ...remotos?.[id] };
  if (r?.liberado === false) return 'bloqueado';
  if (r?.plano === 'completo' && assinante !== true) return 'plano';
  return 'ok';
};

/** A função está valendo agora? (dono deixa + pais ligaram) */
export const recursoAtivo = (id: IdRecurso, prefs: Partial<Record<IdRecurso, boolean>> | undefined, remotos: RegrasRemotas | undefined, assinante: boolean) =>
  disponibilidade(id, remotos, assinante) === 'ok' && (typeof prefs?.[id] === 'boolean' ? (prefs[id] as boolean) : recursoDef(id).padrao);

/** Preferências salvas, só com chaves e valores válidos. */
export const sanearPrefsRecursos = (x: unknown): Partial<Record<IdRecurso, boolean>> => {
  const out: Partial<Record<IdRecurso, boolean>> = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return out;
  for (const def of RECURSOS) { const v = (x as Record<string, unknown>)[def.id]; if (typeof v === 'boolean') out[def.id] = v; }
  return out;
};
