// VOZ AMIGA v14.6 — CRIAÇÃO RÁPIDA (criação facilitada): o pai vai TOCANDO, sem falar nem escrever.
// O app faz as perguntas principais da rotina de uma criança autista (o que precisa pedir, manhã, escola, tarde,
// noite e do que gosta) e mostra botões prontos. Cada botão escolhido já vai para a CATEGORIA certa
// (uma aba com a cor certa): "Pedir", "Manhã", "Escola", "Tarde", "Noite", "Gosto".
// Base: comunicação funcional primeiro (pedir, recusar, ajuda, dor) e vocabulário das rotinas do dia a dia,
// usado na hora em que acontece (ASHA; Light 1988). Funciona sem internet. Nada é criado sem o toque em CRIAR.
import { Idioma } from '../tipos';

type L = Record<Idioma, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });
export type ItemRapido = { id: string; emoji: string; t: L };
export interface EtapaRapida { id: string; emoji: string; tema: string; aba: L; pergunta: L; dica: L; itens: ItemRapido[]; podePular?: boolean }
const I = (id: string, emoji: string, pt: string, en: string, es: string): ItemRapido => ({ id, emoji, t: l(pt, en, es) });

export const ETAPAS_RAPIDAS: EtapaRapida[] = [
  {
    id: 'pedir', emoji: '🙋', tema: 'COMUNICACAO', aba: l('Pedir', 'Ask', 'Pedir'),
    pergunta: l('O que a criança mais precisa pedir?', 'What does the child most need to ask for?', '¿Qué necesita pedir más el niño?'),
    dica: l('Comece por aqui: pedir ajuda, banheiro e dizer "não" evita muita crise.', 'Start here: asking for help, the bathroom and saying "no" prevents many meltdowns.', 'Empieza aquí: pedir ayuda, baño y decir "no" evita muchas crisis.'),
    itens: [I('quero', '🙏', 'Quero', 'I want', 'Quiero'), I('mais', '➕', 'Mais', 'More', 'Más'), I('ajuda', '🤝', 'Ajuda', 'Help', 'Ayuda'), I('acabou', '✅', 'Acabou', 'All done', 'Terminé'),
      I('nao', '✋', 'Não', 'No', 'No'), I('sim', '👍', 'Sim', 'Yes', 'Sí'), I('agua', '💧', 'Água', 'Water', 'Agua'), I('comer', '🍽️', 'Comer', 'Eat', 'Comer'),
      I('banheiro', '🚽', 'Banheiro', 'Bathroom', 'Baño'), I('dor', '🤕', 'Dor', 'Pain', 'Dolor'), I('parar', '🛑', 'Parar', 'Stop', 'Parar'), I('cansado', '😴', 'Cansado', 'Tired', 'Cansado')],
  },
  {
    id: 'manha', emoji: '🌅', tema: 'APRENDIZAGEM', aba: l('Manhã', 'Morning', 'Mañana'),
    pergunta: l('De manhã, o que acontece?', 'What happens in the morning?', '¿Qué pasa por la mañana?'),
    dica: l('Toque só no que acontece de verdade na casa de vocês.', 'Tap only what really happens in your home.', 'Toca solo lo que de verdad pasa en su casa.'),
    itens: [I('acordar', '⏰', 'Acordar', 'Wake up', 'Despertar'), I('escovar', '🪥', 'Escovar os dentes', 'Brush teeth', 'Cepillar dientes'), I('cafe', '☕', 'Café da manhã', 'Breakfast', 'Desayuno'),
      I('leite', '🥛', 'Leite', 'Milk', 'Leche'), I('pao', '🍞', 'Pão', 'Bread', 'Pan'), I('fruta', '🍎', 'Fruta', 'Fruit', 'Fruta'), I('vestir', '👕', 'Vestir', 'Get dressed', 'Vestirse'),
      I('sapato', '👟', 'Sapato', 'Shoes', 'Zapatos'), I('remedio', '💊', 'Remédio', 'Medicine', 'Medicina'), I('cabelo', '💇', 'Pentear', 'Brush hair', 'Peinar')],
  },
  {
    id: 'escola', emoji: '🏫', tema: 'CIANO', aba: l('Escola', 'School', 'Escuela'), podePular: true,
    pergunta: l('Vai para a escola ou terapia?', 'Goes to school or therapy?', '¿Va a la escuela o terapia?'),
    dica: l('Se não vai, toque em "Pular".', 'If not, tap "Skip".', 'Si no va, toca "Saltar".'),
    itens: [I('escola', '🏫', 'Escola', 'School', 'Escuela'), I('mochila', '🎒', 'Mochila', 'Backpack', 'Mochila'), I('professora', '👩‍🏫', 'Professora', 'Teacher', 'Maestra'),
      I('amigo', '🧒', 'Amigo', 'Friend', 'Amigo'), I('recreio', '🛝', 'Recreio', 'Recess', 'Recreo'), I('lanche', '🥪', 'Lanche', 'Snack', 'Merienda'), I('terapia', '🧩', 'Terapia', 'Therapy', 'Terapia'),
      I('carro', '🚗', 'Carro', 'Car', 'Carro'), I('onibus', '🚌', 'Ônibus', 'Bus', 'Autobús'), I('casa', '🏠', 'Casa', 'Home', 'Casa')],
  },
  {
    id: 'tarde', emoji: '☀️', tema: 'ALIMENTOS', aba: l('Tarde', 'Afternoon', 'Tarde'),
    pergunta: l('À tarde, o que a criança faz?', 'What does the child do in the afternoon?', '¿Qué hace el niño por la tarde?'),
    dica: l('Coisas que a criança gosta de pedir motivam a usar o app.', 'Things the child likes to ask for motivate using the app.', 'Las cosas que le gusta pedir motivan a usar la app.'),
    itens: [I('almoco', '🍛', 'Almoço', 'Lunch', 'Almuerzo'), I('brincar', '🧸', 'Brincar', 'Play', 'Jugar'), I('tablet', '📱', 'Tablet', 'Tablet', 'Tablet'),
      I('desenho', '📺', 'Desenho', 'Cartoon', 'Dibujos'), I('parque', '🛝', 'Parque', 'Park', 'Parque'), I('bola', '⚽', 'Bola', 'Ball', 'Pelota'), I('passear', '🚶', 'Passear', 'Go out', 'Pasear'),
      I('musica', '🎵', 'Música', 'Music', 'Música'), I('pintar', '🎨', 'Pintar', 'Paint', 'Pintar'), I('biscoito', '🍪', 'Biscoito', 'Cookie', 'Galleta')],
  },
  {
    id: 'noite', emoji: '🌙', tema: 'AZUL_ESCURO', aba: l('Noite', 'Night', 'Noche'),
    pergunta: l('À noite, como é a rotina?', 'What is the night routine?', '¿Cómo es la rutina de la noche?'),
    dica: l('Rotina igual todo dia ajuda a criança a se acalmar para dormir.', 'The same routine every day helps the child calm down to sleep.', 'La misma rutina cada día ayuda a calmarse para dormir.'),
    itens: [I('jantar', '🍲', 'Jantar', 'Dinner', 'Cena'), I('banho', '🛁', 'Banho', 'Bath', 'Baño'), I('pijama', '👕', 'Pijama', 'Pajamas', 'Pijama'),
      I('escovarN', '🪥', 'Escovar os dentes', 'Brush teeth', 'Cepillar dientes'), I('historia', '📖', 'História', 'Story', 'Cuento'), I('dormir', '😴', 'Dormir', 'Sleep', 'Dormir'),
      I('abraco', '🤗', 'Abraço', 'Hug', 'Abrazo'), I('luz', '💡', 'Apagar a luz', 'Lights off', 'Apagar la luz')],
  },
  {
    id: 'gosto', emoji: '❤️', tema: 'FAVORITOS', aba: l('Gosto', 'I like', 'Me gusta'),
    pergunta: l('Pessoas e coisas que a criança mais gosta', 'People and things the child likes most', 'Personas y cosas que más le gustan'),
    dica: l('Depois você pode trocar o desenho por uma foto de verdade da pessoa.', 'Later you can swap the drawing for a real photo of the person.', 'Después puedes cambiar el dibujo por una foto real.'),
    itens: [I('mamae', '👩', 'Mamãe', 'Mom', 'Mamá'), I('papai', '👨', 'Papai', 'Dad', 'Papá'), I('vovo', '👵', 'Vovó', 'Grandma', 'Abuela'), I('vovoM', '👴', 'Vovô', 'Grandpa', 'Abuelo'),
      I('irmao', '👦', 'Irmão', 'Brother', 'Hermano'), I('irma', '👧', 'Irmã', 'Sister', 'Hermana'), I('cachorro', '🐶', 'Cachorro', 'Dog', 'Perro'), I('gato', '🐱', 'Gato', 'Cat', 'Gato'),
      I('suco', '🧃', 'Suco', 'Juice', 'Jugo'), I('chocolate', '🍫', 'Chocolate', 'Chocolate', 'Chocolate'), I('pipoca', '🍿', 'Pipoca', 'Popcorn', 'Palomitas'), I('carrinho', '🚙', 'Carrinho', 'Toy car', 'Carrito')],
  },
];

/** Tarefas da Rotina do dia que entram quando o pai escolhe estes botões (só se a parte do dia existir e ainda não tiver). */
export const TAREFA_DO_ITEM: Record<string, { abaId: string; emoji: string }> = {
  cafe: { abaId: 'manha', emoji: '☕' }, escola: { abaId: 'escola', emoji: '🏫' }, banho: { abaId: 'banheiro', emoji: '🛁' }, dormir: { abaId: 'noite', emoji: '😴' },
};

/** Junta o que foi escolhido em grupos (cada etapa vira uma aba com a sua cor), sem repetir e respeitando o limite do plano. */
export const montarRapida = (escolhidos: string[], idioma: Idioma, limite: number) => {
  const vistos = new Set<string>();
  let n = 0;
  const grupos = ETAPAS_RAPIDAS.map((e) => ({
    id: e.id, aba: e.aba[idioma], emoji: e.emoji, tema: e.tema,
    itens: e.itens.filter((it) => escolhidos.includes(`${e.id}:${it.id}`)).filter((it) => { const k = it.t[idioma].toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; })
      .filter(() => n++ < limite).map((it) => [it.t[idioma], it.emoji] as [string, string]),
  })).filter((g) => g.itens.length);
  return grupos;
};

export const TITULO_RAPIDA: L = l('Criação rápida', 'Quick create', 'Creación rápida');
