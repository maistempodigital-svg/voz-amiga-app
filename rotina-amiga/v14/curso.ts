// VOZ AMIGA v14 — CURSO PARA OS PAIS (separado do tour). O mascote voa até cada parte do app, aponta e explica.
// Cada lição é curta e pode ser repetida. Usa os mesmos alvos do tour (<AlvoTour id="...">).
import type { PassoTour, TelaTour } from '../tourPassos';
import { Idioma } from '../tipos';

type Tx = { t: string; d: string; dica?: string };
type L3 = [Tx, Tx, Tx];
export interface Licao { id: string; emoji: string; nome: Record<Idioma, string>; minutos: number; passos: PassoTour[] }

const P = (licao: number, id: string, tela: TelaTour, alvo: string | undefined, [pt, en, es]: L3): PassoTour => ({ id: `c_${id}`, tela, alvo, parte: licao, pt, en, es });

export const LICOES: Licao[] = [
  { id: 'usar', emoji: '👆', minutos: 1, nome: { pt: 'Usar as pranchas', en: 'Using the cards', es: 'Usar las tarjetas' }, passos: [
    P(0, 'usar0', 'home', undefined, [
      { t: 'Oi! Eu sou o mascote do Voz Amiga 👋', d: 'Vou voar até cada parte do app e explicar devagar. Toque em Próximo quando quiser.' },
      { t: 'Hi! I am the Voz Amiga mascot 👋', d: 'I will fly to each part of the app and explain slowly. Tap Next when you are ready.' },
      { t: '¡Hola! Soy la mascota de Voz Amiga 👋', d: 'Voy a volar hasta cada parte de la app y explicar despacio. Toca Siguiente cuando quieras.' }]),
    P(0, 'usar1', 'home', 'pranchas', [
      { t: 'Os botões (pranchas)', d: 'Cada quadrado é uma palavra. A criança toca e a palavra vai para a barra de cima. Nada é falado ainda.', dica: 'Toque' },
      { t: 'The buttons (cards)', d: 'Each square is a word. The child taps and the word goes to the bar above. Nothing is spoken yet.', dica: 'Tap' },
      { t: 'Los botones (tarjetas)', d: 'Cada cuadrado es una palabra. El niño toca y la palabra va a la barra de arriba. Aún no se dice nada.', dica: 'Toca' }]),
    P(0, 'usar2', 'home', 'abas', [
      { t: 'As abas', d: 'Aqui em cima ficam as abas. GERAL mostra tudo. As outras separam por cor. Se tiver muitas, arraste para o lado.' },
      { t: 'The tabs', d: 'The tabs are up here. GENERAL shows everything. The others split by color. If there are many, swipe sideways.' },
      { t: 'Las pestañas', d: 'Aquí arriba están las pestañas. GENERAL muestra todo. Las otras separan por color. Si hay muchas, desliza al costado.' }]),
    P(0, 'usar3', 'home', 'frases', [
      { t: 'Falar: botão FALAR', d: 'As palavras tocadas ficam nesta barra. O celular só fala quando a criança toca em FALAR, mesmo com uma palavra. A linha de sugestões embaixo desliza para o lado. O X limpa.' },
      { t: 'Speaking: the SPEAK button', d: 'Tapped words stay in this bar. The phone only speaks when the child taps SPEAK, even with one word. The suggestion row below slides sideways. X clears.' },
      { t: 'Hablar: botón HABLAR', d: 'Las palabras tocadas quedan en esta barra. El celular solo habla cuando el niño toca HABLAR, aunque sea una palabra. La fila de sugerencias se desliza. La X limpia.' }]),
    P(0, 'usar4', 'home', 'teclado', [
      { t: 'Teclado', d: 'Para escrever qualquer palavra. Enquanto digita, ele sugere a palavra.' },
      { t: 'Keyboard', d: 'To type any word. While typing, it suggests the word.' },
      { t: 'Teclado', d: 'Para escribir cualquier palabra. Mientras escribes, sugiere la palabra.' }]),
  ] },
  { id: 'montar', emoji: '🧱', minutos: 2, nome: { pt: 'Montar uma prancha', en: 'Making a card', es: 'Armar una tarjeta' }, passos: [
    P(1, 'mont1', 'home', 'criarPrancha', [
      { t: 'Criar prancha', d: 'Segure este botão uns segundos e faça a continha. Só adultos conseguem.', dica: 'Segure' },
      { t: 'Create card', d: 'Hold this button a few seconds and solve the quick sum. Only adults can.', dica: 'Hold' },
      { t: 'Crear tarjeta', d: 'Mantén este botón unos segundos y resuelve la cuenta. Solo los adultos pueden.', dica: 'Mantén' }]),
    P(1, 'mont2', 'criarPrancha', 'cp_texto', [
      { t: 'Escreva a palavra', d: 'O que o botão vai falar. Ex.: "água", "mamãe", "brincar".' },
      { t: 'Type the word', d: 'What the button will say. E.g. "water", "mom", "play".' },
      { t: 'Escribe la palabra', d: 'Lo que dirá el botón. Ej.: "agua", "mamá", "jugar".' }]),
    P(1, 'mont3', 'criarPrancha', 'cp_aba', [
      { t: 'A cor (categoria)', d: 'Deixe em "Automática": o app escolhe a cor certa sozinho. Você pode trocar.' },
      { t: 'The color (category)', d: 'Leave it on "Automatic": the app picks the right color. You can change it.' },
      { t: 'El color (categoría)', d: 'Déjalo en "Automática": la app elige el color correcto. Puedes cambiarlo.' }]),
    P(1, 'mont4', 'criarPrancha', 'cp_salvar', [
      { t: 'Salvar', d: 'Pronto! O botão novo aparece no fim, sem tirar os outros do lugar.' },
      { t: 'Save', d: 'Done! The new button shows up at the end, without moving the others.' },
      { t: 'Guardar', d: '¡Listo! El botón nuevo aparece al final, sin mover los otros.' }]),
  ] },
  { id: 'foto', emoji: '📸', minutos: 1, nome: { pt: 'Tirar uma foto', en: 'Taking a photo', es: 'Sacar una foto' }, passos: [
    P(2, 'foto1', 'criarPrancha', 'cp_camera', [
      { t: 'Câmera', d: 'Tire a foto do objeto de verdade (o copo, o brinquedo). Muitas crianças reconhecem melhor a foto.' },
      { t: 'Camera', d: 'Take a photo of the real object (the cup, the toy). Many children recognize photos better.' },
      { t: 'Cámara', d: 'Saca la foto del objeto real (el vaso, el juguete). Muchos niños reconocen mejor la foto.' }]),
    P(2, 'foto2', 'criarPrancha', 'cp_galeria', [
      { t: 'Galeria', d: 'Ou escolha uma foto que já está no celular.' },
      { t: 'Gallery', d: 'Or choose a photo already on the phone.' },
      { t: 'Galería', d: 'O elige una foto que ya está en el celular.' }]),
    P(2, 'foto2b', 'criarPrancha', 'cp_picto', [
      { t: 'Desenhos prontos (pictogramas)', d: 'Busca desenhos num banco gratuito (ARASAAC), que não é do Voz Amiga: está aqui só para facilitar. Precisa de internet.' },
      { t: 'Ready drawings (pictograms)', d: 'Searches drawings in a free bank (ARASAAC), not part of Voz Amiga: it is here just to help. Needs internet.' },
      { t: 'Dibujos listos (pictogramas)', d: 'Busca dibujos en un banco gratuito (ARASAAC), que no es de Voz Amiga: está aquí solo para ayudar. Necesita internet.' }]),
    P(2, 'foto3', 'criarPrancha', 'cp_audio', [
      { t: 'Sua voz no botão', d: 'Grave você falando a palavra. O botão fala com a sua voz.' },
      { t: 'Your voice on the button', d: 'Record yourself saying the word. The button speaks with your voice.' },
      { t: 'Tu voz en el botón', d: 'Grábate diciendo la palabra. El botón habla con tu voz.' }]),
  ] },
  { id: 'editar', emoji: '✏️', minutos: 1, nome: { pt: 'Editar e organizar', en: 'Editing and organizing', es: 'Editar y organizar' }, passos: [
    P(3, 'ed1', 'home', 'ajustes', [
      { t: 'Ajustes', d: 'Segure aqui e faça a continha para entrar nos ajustes.', dica: 'Segure' },
      { t: 'Settings', d: 'Hold here and solve the sum to open settings.', dica: 'Hold' },
      { t: 'Ajustes', d: 'Mantén aquí y resuelve la cuenta para entrar a los ajustes.', dica: 'Mantén' }]),
    P(3, 'ed2', 'ajustesVoz', 'aj_editar', [
      { t: 'Editar pranchas', d: 'Toque aqui e depois no botão que quer mudar.' },
      { t: 'Edit cards', d: 'Tap here and then the button you want to change.' },
      { t: 'Editar tarjetas', d: 'Toca aquí y después el botón que quieres cambiar.' }]),
    P(3, 'ed3', 'ajustesVoz', 'aj_gerir', [
      { t: 'Organizar as abas', d: 'Mude a ordem, o nome e a cor das abas.' },
      { t: 'Organize tabs', d: 'Change the order, name and color of tabs.' },
      { t: 'Organizar pestañas', d: 'Cambia el orden, el nombre y el color de las pestañas.' }]),
    P(3, 'ed3b', 'ajustesVoz', 'aj_pacotes', [
      { t: 'Baixar pacotes', d: 'Pacotes prontos (frutas, banho, escola…). Veja o que cada um tem e transfira com um toque.' },
      { t: 'Download packs', d: 'Ready packs (fruits, bath, school…). See what each has and transfer with one tap.' },
      { t: 'Descargar paquetes', d: 'Paquetes listos (frutas, baño, escuela…). Mira lo que tiene cada uno y transfiere con un toque.' }]),
    P(3, 'ed4', 'definicoes', 'df_funcoes', [
      { t: 'Funções do app (nas Definições)', d: 'Aqui você liga e desliga cada novidade: backup, senha, emergência, níveis, tela calma… Tudo explicado.' },
      { t: 'App features (in Preferences)', d: 'Turn each new feature on or off here: backup, PIN, emergency, levels, calm screen… All explained.' },
      { t: 'Funciones de la app (en Preferencias)', d: 'Aquí enciendes y apagas cada novedad: copia, clave, emergencia, niveles, pantalla calma… Todo explicado.' }]),
  ] },
  { id: 'rotina', emoji: '🗓️', minutos: 2, nome: { pt: 'Usar a rotina', en: 'Using the routine', es: 'Usar la rutina' }, passos: [
    P(4, 'rot1', 'ajustesVoz', 'aj_rotina', [
      { t: 'Rotina Amiga', d: 'Monte o dia da criança: acordar, escola, banho… Cada tarefa vira uma etapa com estrelas.' },
      { t: 'Rotina Amiga', d: 'Plan the child’s day: wake up, school, bath… Each task is a step with stars.' },
      { t: 'Rotina Amiga', d: 'Arma el día del niño: despertar, escuela, baño… Cada tarea es un paso con estrellas.' }]),
    P(4, 'rot2', 'rotinaAjustes', 'r_adicionar', [
      { t: 'Nova tarefa', d: 'Toque para criar uma tarefa: nome, figura e horário (se quiser).' },
      { t: 'New task', d: 'Tap to create a task: name, picture and time (optional).' },
      { t: 'Nueva tarea', d: 'Toca para crear una tarea: nombre, figura y horario (si quieres).' }]),
    P(4, 'rot3', 'home', 'rotina', [
      { t: 'Na tela inicial', d: 'A próxima tarefa aparece aqui embaixo. A criança toca quando termina e ganha estrela.' },
      { t: 'On the home screen', d: 'The next task shows here at the bottom. The child taps when done and earns a star.' },
      { t: 'En la pantalla inicial', d: 'La próxima tarea aparece aquí abajo. El niño toca al terminar y gana estrella.' }]),
  ] },
  { id: 'relatorio', emoji: '📊', minutos: 1, nome: { pt: 'Ver o relatório', en: 'Seeing the report', es: 'Ver el informe' }, passos: [
    P(5, 'rel1', 'ajustesVoz', 'aj_relatorio', [
      { t: 'Relatório', d: 'Mostra o que a criança falou, palavras novas, nível e marcos.' },
      { t: 'Report', d: 'Shows what the child said, new words, level and milestones.' },
      { t: 'Informe', d: 'Muestra lo que el niño dijo, palabras nuevas, nivel y logros.' }]),
    P(5, 'rel2', 'relatorio', 'rel_periodos', [
      { t: 'Escolha o período', d: '7 dias, 30 dias, ou as datas que quiser.' },
      { t: 'Pick the period', d: '7 days, 30 days, or any dates you want.' },
      { t: 'Elige el período', d: '7 días, 30 días, o las fechas que quieras.' }]),
    P(5, 'rel2b', 'relatorio', 'rel_momento', [
      { t: 'Registrar um momento difícil', d: 'Anote uma crise: o que aconteceu antes e o que ajudou. O app vai percebendo os padrões com o tempo.' },
      { t: 'Record a hard moment', d: 'Note a crisis: what happened before and what helped. The app notices patterns over time.' },
      { t: 'Registrar un momento difícil', d: 'Anota una crisis: qué pasó antes y qué ayudó. La app nota los patrones con el tiempo.' }]),
    P(5, 'rel3', 'relatorio', 'rel_whatsapp', [
      { t: 'Mandar para a fono', d: 'Envie pelo WhatsApp ou salve em PDF para o médico ou a fono.' },
      { t: 'Send to the therapist', d: 'Send by WhatsApp or save as PDF for the doctor or therapist.' },
      { t: 'Enviar a la fono', d: 'Envía por WhatsApp o guarda en PDF para el médico o la fono.' }]),
  ] },
  { id: 'conquistas', emoji: '🏆', minutos: 2, nome: { pt: 'Conquistas e prêmios', en: 'Achievements and prizes', es: 'Logros y premios' }, passos: [
    P(6, 'cq1', 'ajustesVoz', 'aj_conquistas', [
      { t: 'Conquistas e prêmios', d: 'O botão amarelo nos Ajustes junta tudo o que motiva a criança.' },
      { t: 'Achievements and prizes', d: 'The yellow button in Settings brings together everything that motivates the child.' },
      { t: 'Logros y premios', d: 'El botón amarillo en Ajustes junta todo lo que motiva al niño.' }]),
    P(6, 'cq2', 'conquistas', 'cq_premios', [
      { t: 'Prêmios e metas', d: 'Crie prêmios (ex.: 10 minutos de tablet = 5 estrelas) e metas que dão estrelas extras.' },
      { t: 'Prizes and goals', d: 'Create prizes (e.g. 10 minutes of tablet = 5 stars) and goals that give extra stars.' },
      { t: 'Premios y metas', d: 'Crea premios (ej.: 10 minutos de tablet = 5 estrellas) y metas que dan estrellas extra.' }]),
    P(6, 'cq3', 'conquistas', 'cq_mes', [
      { t: 'Conquistas do mês', d: 'O app escolhe e renova todo mês: pedir sozinho, cumprimentar, contar sentimentos…' },
      { t: 'Monthly achievements', d: 'The app picks and renews them every month: requesting alone, greeting, sharing feelings…' },
      { t: 'Logros del mes', d: 'La app los elige y renueva cada mes: pedir solo, saludar, contar sentimientos…' }]),
    P(6, 'cq4', 'conquistas', 'cq_familia', [
      { t: 'Crie as suas', d: 'Escreva uma conquista da família, escolha o desenho e marque quando a criança conseguir.' },
      { t: 'Create your own', d: 'Type a family achievement, pick a picture and mark it when the child makes it.' },
      { t: 'Crea los tuyos', d: 'Escribe un logro de la familia, elige el dibujo y márcalo cuando el niño lo logre.' }]),
  ] },
  { id: 'ajuda', emoji: '❓', minutos: 1, nome: { pt: 'Pedir ajuda ao app', en: 'Asking the app for help', es: 'Pedir ayuda a la app' }, passos: [
    P(7, 'aj1', 'ajustesVoz', 'aj_ajuda', [
      { t: 'Ajuda e tour', d: 'Escreva sua dúvida (ex.: "trocar a voz"). O app mostra a resposta e o botão "Me leve até lá". Também dá para ver o tour de uma parte só.' },
      { t: 'Help and tour', d: 'Type your question (e.g. "change the voice"). The app shows the answer and a "Take me there" button. You can also see a tour of just one part.' },
      { t: 'Ayuda y recorrido', d: 'Escribe tu duda (ej.: "cambiar la voz"). La app muestra la respuesta y el botón "Llévame ahí". También puedes ver el recorrido de una parte.' }]),
    P(7, 'aj2', 'ajustesVoz', 'aj_curso', [
      { t: 'Voltar ao curso', d: 'O curso fica aqui nos Ajustes. Faça uma lição por dia, no seu tempo; o app marca as que você já viu.' },
      { t: 'Back to the course', d: 'The course lives here in Settings. Do one lesson a day, at your pace; the app marks the ones you have seen.' },
      { t: 'Volver al curso', d: 'El curso está aquí en Ajustes. Haz una lección por día, a tu ritmo; la app marca las que ya viste.' }]),
  ] },
  { id: 'rapida', emoji: '⚡', minutos: 2, nome: { pt: 'Criação rápida', en: 'Quick create', es: 'Creación rápida' }, passos: [
    P(8, 'rap1', 'criarPrancha', 'cp_rapida', [
      { t: 'Só tocar', d: 'Abra o CRIAR PRANCHA e toque em CRIAÇÃO RÁPIDA. O app faz 6 perguntas sobre o dia da criança e mostra botões prontos. Toque nos que fazem parte da rotina de vocês.' },
      { t: 'Just tap', d: 'Open CREATE CARD and tap QUICK CREATE. The app asks 6 questions about the child’s day and shows ready buttons. Tap the ones that are part of your routine.' },
      { t: 'Solo tocar', d: 'Abre CREAR TARJETA y toca CREACIÓN RÁPIDA. La app hace 6 preguntas sobre el día del niño y muestra botones listos. Toca los que son parte de su rutina.' }]),
    P(8, 'rap2', 'criarPrancha', 'cp_rapida', [
      { t: 'Cada um na sua categoria', d: 'Os botões já vão para a aba certa: Pedir, Manhã, Escola, Tarde, Noite e Gosto. Comece com 10 (recomendação dos especialistas) e acrescente depois.' },
      { t: 'Each in its category', d: 'Buttons go to the right tab: Ask, Morning, School, Afternoon, Night and I like. Start with 10 (specialists’ advice) and add more later.' },
      { t: 'Cada uno en su categoría', d: 'Los botones van a la pestaña correcta: Pedir, Mañana, Escuela, Tarde, Noche y Me gusta. Empieza con 10 (recomendación de especialistas) y agrega después.' }]),
  ] },
  { id: 'vozes', emoji: '🔊', minutos: 1, nome: { pt: 'As vozes', en: 'Voices', es: 'Las voces' }, passos: [
    P(9, 'voz1', 'definicoes', 'df_voz', [
      { t: 'Voz do celular', d: 'Toque em "Escolher e testar a voz": ouça cada voz do celular e escolha. Lá tem o passo a passo para baixar a voz em português e funcionar sem internet.' },
      { t: 'Phone voice', d: 'Tap "Choose and test the voice": hear each phone voice and pick one. Steps to download the voice and use it offline are there too.' },
      { t: 'Voz del celular', d: 'Toca "Elegir y probar la voz": oye cada voz del celular y elige. Ahí están los pasos para descargar la voz y usarla sin internet.' }]),
    P(9, 'voz2', 'definicoes', 'df_voz', [
      { t: 'Volume', d: 'O volume fica na mesma tela da voz. Deixe confortável: algumas crianças se incomodam com som alto.' },
      { t: 'Volume', d: 'Volume is on the same voice screen. Keep it comfortable: some children are bothered by loud sounds.' },
      { t: 'Volumen', d: 'El volumen está en la misma pantalla de la voz. Déjalo cómodo: a algunos niños les molesta el sonido fuerte.' }]),
  ] },
];

export const PARTES_CURSO: Record<Idioma, string[]> = {
  pt: LICOES.map((l) => `Lição: ${l.nome.pt}`),
  en: LICOES.map((l) => `Lesson: ${l.nome.en}`),
  es: LICOES.map((l) => `Lección: ${l.nome.es}`),
};
