// VOZ AMIGA v14 — PACOTES POR ROTINA (somam aos pacotes que o Voz já tem).
import { Idioma } from '../tipos';

export interface PacoteRotina { id: string; emoji: string; nome: Record<Idioma, string>; itens: Record<Idioma, string>; /** cor da aba (temas do Voz) */ tema: string; /** palavras que ligam o pacote a uma tarefa da rotina */ chaves: string[] }

export const PACOTES_ROTINA: PacoteRotina[] = [
  { id: 'CAFE', emoji: '☕', tema: 'ALIMENTOS', chaves: ['café', 'cafe', 'manhã', 'desjejum', 'breakfast', 'desayuno', 'comer', 'lanche'],
    nome: { pt: 'Café da manhã', en: 'Breakfast', es: 'Desayuno' },
    itens: { pt: 'Leite|🥛,Pão|🍞,Café|☕,Suco|🧃,Fruta|🍎,Bolacha|🍪,Cereal|🥣,Mais|➕,Acabou|✅,Quero|🙋', en: 'Milk|🥛,Bread|🍞,Coffee|☕,Juice|🧃,Fruit|🍎,Cookie|🍪,Cereal|🥣,More|➕,All done|✅,Want|🙋', es: 'Leche|🥛,Pan|🍞,Café|☕,Jugo|🧃,Fruta|🍎,Galleta|🍪,Cereal|🥣,Más|➕,Terminé|✅,Quiero|🙋' } },
  { id: 'BANHO', emoji: '🛁', tema: 'CIANO', chaves: ['banho', 'bath', 'baño', 'chuveiro', 'higiene'],
    nome: { pt: 'Banho', en: 'Bath', es: 'Baño' },
    itens: { pt: 'Banho|🛁,Água|💧,Quente|🔥,Frio|❄️,Sabonete|🧼,Shampoo|🧴,Toalha|🧺,Brinquedo|🦆,Acabou|✅,Ajuda|🤝', en: 'Bath|🛁,Water|💧,Hot|🔥,Cold|❄️,Soap|🧼,Shampoo|🧴,Towel|🧺,Toy|🦆,All done|✅,Help|🤝', es: 'Baño|🛁,Agua|💧,Caliente|🔥,Frío|❄️,Jabón|🧼,Champú|🧴,Toalla|🧺,Juguete|🦆,Terminé|✅,Ayuda|🤝' } },
  { id: 'ESCOLA', emoji: '🏫', tema: 'APRENDIZAGEM', chaves: ['escola', 'school', 'escuela', 'aula', 'creche'],
    nome: { pt: 'Escola', en: 'School', es: 'Escuela' },
    itens: { pt: 'Professora|👩‍🏫,Amigo|🧒,Banheiro|🚽,Água|💧,Lanche|🍎,Brincar|🧸,Desenhar|🖍️,Mochila|🎒,Ajuda|🤝,Casa|🏠', en: 'Teacher|👩‍🏫,Friend|🧒,Bathroom|🚽,Water|💧,Snack|🍎,Play|🧸,Draw|🖍️,Backpack|🎒,Help|🤝,Home|🏠', es: 'Maestra|👩‍🏫,Amigo|🧒,Baño|🚽,Agua|💧,Merienda|🍎,Jugar|🧸,Dibujar|🖍️,Mochila|🎒,Ayuda|🤝,Casa|🏠' } },
  { id: 'PARQUE', emoji: '🌳', tema: 'EMOCOES', chaves: ['parque', 'park', 'praça', 'brincar', 'passear'],
    nome: { pt: 'Parque', en: 'Park', es: 'Parque' },
    itens: { pt: 'Balanço|🎠,Escorregador|🛝,Areia|🏖️,Bola|⚽,Correr|🏃,Mais|➕,Minha vez|🙋,Esperar|⏳,Cansado|😴,Ir embora|🚶', en: 'Swing|🎠,Slide|🛝,Sand|🏖️,Ball|⚽,Run|🏃,More|➕,My turn|🙋,Wait|⏳,Tired|😴,Go home|🚶', es: 'Columpio|🎠,Tobogán|🛝,Arena|🏖️,Pelota|⚽,Correr|🏃,Más|➕,Mi turno|🙋,Esperar|⏳,Cansado|😴,Irnos|🚶' } },
  { id: 'MEDICO', emoji: '🩺', tema: 'COMUNICACAO', chaves: ['médico', 'medico', 'doctor', 'consulta', 'dentista', 'fono', 'terapia'],
    nome: { pt: 'Médico', en: 'Doctor', es: 'Médico' },
    itens: { pt: 'Dói|🤕,Aqui|👇,Cabeça|🙂,Barriga|🫃,Garganta|👄,Ouvido|👂,Remédio|💊,Medo|😨,Parar|✋,Pronto|✅', en: 'It hurts|🤕,Here|👇,Head|🙂,Tummy|🫃,Throat|👄,Ear|👂,Medicine|💊,Scared|😨,Stop|✋,Done|✅', es: 'Duele|🤕,Aquí|👇,Cabeza|🙂,Barriga|🫃,Garganta|👄,Oído|👂,Remedio|💊,Miedo|😨,Parar|✋,Listo|✅' } },
  { id: 'DORMIR', emoji: '🌙', tema: 'AZUL_ESCURO', chaves: ['dormir', 'sleep', 'noite', 'night', 'noche', 'cama'],
    nome: { pt: 'Dormir', en: 'Bedtime', es: 'Dormir' },
    itens: { pt: 'Dormir|🛏️,Pijama|🛌,Escovar dentes|🪥,História|📖,Luz|💡,Escuro|🌙,Água|💧,Abraço|🤗,Boa noite|😴,Medo|😨', en: 'Sleep|🛏️,Pajamas|🛌,Brush teeth|🪥,Story|📖,Light|💡,Dark|🌙,Water|💧,Hug|🤗,Good night|😴,Scared|😨', es: 'Dormir|🛏️,Pijama|🛌,Cepillar dientes|🪥,Cuento|📖,Luz|💡,Oscuro|🌙,Agua|💧,Abrazo|🤗,Buenas noches|😴,Miedo|😨' } },
];

/** Lista de pranchas do pacote no idioma: [texto, emoji][] */
export const itensPacote = (p: PacoteRotina, idioma: Idioma): [string, string][] =>
  (p.itens[idioma] || p.itens.pt).split(',').map((x) => { const [t, e] = x.split('|'); return [t, e || '💬']; });

const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** A rotina do dia sugere as pranchas certas: acha o pacote cujo tema combina com o nome da tarefa. */
export const pacoteDaTarefa = (tituloTarefa: string): PacoteRotina | undefined => {
  const t = sem(tituloTarefa || '');
  return PACOTES_ROTINA.find((p) => p.chaves.some((c) => t.includes(sem(c))));
};
