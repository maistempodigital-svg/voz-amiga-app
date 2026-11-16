// SIMULAÇÃO do Voz Amiga para o APK de teste (só para mostrar o módulo Rotina funcionando dentro dele).
// No app oficial são usadas as telas ORIGINAIS do Voz — nada daqui vai para o projeto real.
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { lerAntigo, montarEstadoMigrado } from '../migrarNoCelular';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { linkSeguro } from '../../src/rotina-amiga/logica/plano';
import { categoriaDaPalavra } from '../../src/rotina-amiga/logica/frasesProntas';

// ------------------------------------------------------------ temas das abas (tabela do Voz original)
export interface Tema { id: string; nome: string; fundo: string; claro: string; borda: string; icone: string; texto: string; iconeNome: string }
const T = (id: string, nome: string, fundo: string, claro: string, borda: string, icone: string, texto: string, iconeNome: string): Tema => ({ id, nome, fundo, claro, borda, icone, texto, iconeNome });
export const TEMAS: Record<string, Tema> = Object.fromEntries([
  T('COMUNICACAO', 'Azul', '#3b82f6', '#eff6ff', '#2563eb', '#2563eb', '#ffffff', 'message-square'),
  T('EMOCOES', 'Verde', '#22c55e', '#f0fdf4', '#16a34a', '#16a34a', '#ffffff', 'smile'),
  T('APRENDIZAGEM', 'Amarelo', '#facc15', '#fefce8', '#ca8a04', '#ca8a04', '#0f172a', 'book-open'),
  T('SOCIALIZACAO', 'Rosa', '#ec4899', '#fdf2f8', '#db2777', '#db2777', '#ffffff', 'users'),
  T('ALIMENTOS', 'Laranja', '#f59e0b', '#fffbeb', '#d97706', '#d97706', '#ffffff', 'coffee'),
  T('GERAL', 'Geral', '#475569', '#f8fafc', '#334155', '#334155', '#ffffff', 'grid'),
  T('FAVORITOS', 'Vermelho', '#ef4444', '#fef2f2', '#dc2626', '#dc2626', '#ffffff', 'heart'),
  T('ROXO', 'Roxo', '#a855f7', '#faf5ff', '#9333ea', '#9333ea', '#ffffff', 'star'),
  T('LILAS', 'Lilás', '#d946ef', '#fdf4ff', '#c026d3', '#c026d3', '#ffffff', 'disc'),
  T('CIANO', 'Ciano', '#06b6d4', '#ecfeff', '#0891b2', '#0891b2', '#ffffff', 'droplet'),
  T('VERDE_AGUA', 'Verde Água', '#14b8a6', '#ccfbf1', '#0d9488', '#0d9488', '#ffffff', 'droplet'),
  T('VERDE_ESCURO', 'Verde Escuro', '#15803d', '#dcfce7', '#166534', '#166534', '#ffffff', 'droplet'),
  T('AZUL_ESCURO', 'Azul Escuro', '#1d4ed8', '#dbeafe', '#1e3a8a', '#1e3a8a', '#ffffff', 'cloud'),
  T('MARROM', 'Marrom', '#b45309', '#fef3c7', '#92400e', '#92400e', '#ffffff', 'coffee'),
  T('CINZA', 'Cinza', '#64748b', '#f1f5f9', '#475569', '#475569', '#ffffff', 'circle'),
  T('ESCURO', 'Escuro', '#334155', '#f1f5f9', '#1e293b', '#1e293b', '#ffffff', 'moon'),
].map((t) => [t.id, t]));
export const tema = (id?: string) => TEMAS[id || ''] || TEMAS.COMUNICACAO;

// ------------------------------------------------------------ pacotes (mesma lista do Voz)
export const PACOTES: [string, string, string][] = [
  ['ACOES', '🏃 Ações e Verbos', 'Quero|🙋,Fazer|🛠️,Ir|🚶,Parar|✋,Brincar|🧸,Ajudar|🤝,Comer|🍽️,Beber|🥤,Dormir|🛏️,Olhar|👀,Correr|🏃,Pular|🤸,Sentar|🪑,Levantar|🧍,Pegar|🫳,Dar|🎁,Abrir|📖,Fechar|📕,Escutar|👂,Falar|🗣️'],
  ['SENTIMENTOS', '❤️ Sentimentos', 'Feliz|😄,Triste|😢,Bravo|😠,Com medo|😨,Cansado|😴,Com fome|🤤,Com sede|🥵,Doente|🤒,Calmo|😌,Animado|🤩,Com dor|🤕,Assustado|😱'],
  ['BEBIDAS', '🥤 Bebidas', 'Água|💧,Suco|🧃,Suco de laranja|🍊,Suco de maçã|🍎,Suco de uva|🍇,Suco de morango|🍓,Leite|🥛,Refrigerante|🥤,Água de coco|🥥,Achocolatado|🍫,Chá|🍵,Vitamina|🥤'],
  ['FRUTAS', '🍎 Frutas', 'Maçã|🍎,Banana|🍌,Laranja|🍊,Pêra|🍐,Uva|🍇,Morango|🍓,Melancia|🍉,Manga|🥭,Mamão|🍈,Abacaxi|🍍,Limão|🍋,Goiaba|🍈'],
  ['DOCES', '🍩 Doces', 'Bolo|🎂,Biscoito|🍪,Chocolate|🍫,Sorvete|🍦,Bala|🍬,Pirulito|🍭,Gelatina|🍮,Pudim|🍮,Salgadinho|🥨,Pão de queijo|🧀'],
  ['BRINQUEDOS', '🧸 Brinquedos', 'Bola|⚽,Boneca|🪆,Carrinho|🚗,Blocos de montar|🧱,Quebra-cabeça|🧩,Urso de pelúcia|🧸,Bolhas de sabão|🫧,Massinha|🎨,Videogame|🎮'],
  ['ANIMAIS', '🐶 Animais', 'Cachorro|🐶,Gato|🐱,Passarinho|🐦,Peixe|🐟,Cavalo|🐴,Vaca|🐮,Porco|🐷,Galinha|🐔,Leão|🦁,Elefante|🐘,Tartaruga|🐢,Coelho|🐰'],
  ['ROUPAS', '👕 Roupas', 'Camiseta|👕,Calça|👖,Bermuda|🩳,Blusa|👚,Casaco|🧥,Meia|🧦,Sapato|👞,Tênis|👟,Sandália|🩴,Pijama|🛌'],
  ['HIGIENE', '🚰 Higiene', 'Escova de dentes|🪥,Pasta de dentes|🦷,Sabonete|🧼,Shampoo|🧴,Toalha|🧺,Pente|💇,Papel higiênico|🧻,Fralda|🧷,Banheira|🛁'],
  ['LUGARES', '🏙️ Lugares', 'Praia|🏖️,Shopping|🛍️,Restaurante|🍴,Igreja|⛪,Praça|🌳,Piscina|🏊,Supermercado|🛒,Padaria|🥖,Farmácia|💊,Cinema|🎬'],
  ['TRANSPORTE', '🚗 Transporte', 'Carro|🚗,Ônibus|🚌,Avião|✈️,Trem|🚆,Bicicleta|🚲,Moto|🏍️,Caminhão|🚚,Barco|⛵,Helicóptero|🚁,Trator|🚜'],
  ['CORPO', '👁️ Partes do Corpo', 'Cabeça|🙂,Braço|💪,Perna|🦵,Mão|✋,Pé|🦶,Olho|👁️,Orelha|👂,Nariz|👃,Boca|👄,Barriga|🫃,Dente|🦷,Cabelo|💇'],
  ['CORES', '🎨 Cores', 'Azul|🔵,Vermelho|🔴,Amarelo|🟡,Verde|🟢,Rosa|🌸,Roxo|🟣,Laranja|🟠,Preto|⚫,Branco|⚪,Marrom|🟤'],
  ['FORMAS', '🟢 Formas', 'Círculo|⚪,Quadrado|🟥,Triângulo|🔺,Estrela|⭐,Coração|❤️'],
  ['NATUREZA', '🌳 Natureza', 'Sol|☀️,Chuva|🌧️,Vento|🌬️,Árvore|🌳,Flor|🌸,Nuvem|☁️,Estrela|⭐,Lua|🌙,Fogo|🔥,Água|💧'],
  ['PROFISSOES', '👷 Profissões', 'Médico|👨‍⚕️,Policial|👮,Bombeiro|🧑‍🚒,Professor|👨‍🏫,Dentista|🦷,Cozinheiro|🧑‍🍳,Motorista|🚕'],
  ['FAMILIA', '👨‍👩‍👧 Família', 'Mamãe|👩,Papai|👨,Irmão|👦,Irmã|👧,Avó|👵,Avô|👴,Tia|👩,Tio|👨,Primo|🧒,Família|👪'],
  ['ESCOLAR', '✏️ Material Escolar', 'Lápis|✏️,Caneta|🖊️,Borracha|🧽,Caderno|📓,Livro|📚,Mochila|🎒,Tesoura|✂️,Cola|🧴,Régua|📏,Escola|🏫'],
  ['TEMPO', '⏳ Tempo e Dias', 'Agora|⏱️,Depois|⏭️,Hoje|📅,Amanhã|🌅,Ontem|🔙,Manhã|🌄,Tarde|🌇,Noite|🌙'],
  ['OPOSICOES', '⚖️ Opostos e Adjetivos', 'Sim|👍,Não|👎,Mais|➕,Menos|➖,Grande|🐘,Pequeno|🐭,Quente|🔥,Frio|❄️,Aberto|🔓,Fechado|🔒'],
];
export const BANCO = ('🙋 🙅 👍 👎 🆘 ➕ 🛑 🙏 🤝 🙇 😄 😢 😠 😨 😴 🤒 🤤 🥵 😌 😬 😕 😲 👩 👨 👵 👴 👦 👧 👶 👪 🧒 👩‍🏫 👨‍⚕️ 👋 ☀️ 🌙 🧸 ⏳ ☝️ '
  + '🚽 🍽️ 🛏️ 🚿 🦷 🪥 👕 📺 🚶 🏠 🌅 🎒 💧 🧃 🥛 🍪 🍞 🍎 🍌 🍚 🥣 🍦 🍕 🍓 🍇 ⚽ 🎮 🧩 🎨 📖 📚 ✏️ 🏫 🚗 🚌 ✈️ 🚲 🌳 🛋️ 🧼 🧴 ⏰ 🎵 🎉 ⭐ ❤️ 🐶 🐱 🐟 🏖️ 🛒 💊 📱 🎁 🏆').split(' ');

// ------------------------------------------------------------ estado
export interface AbaVoz { id: string; nome: string; tema: string }
export interface PranchaVoz { id: string; texto: string; abaId: string; emoji?: string; imagem?: string; audio?: string }
export interface DefsVoz { idioma: 'pt' | 'en' | 'es'; colunasAuto: boolean; colunas: number; sugestoes: boolean; tecladoAvancado: boolean; bloquearApp: boolean; voz: string; volume: number; /** só no app de teste */ assinanteTeste?: boolean;
  /** v14.8: teste premium (no app real fica no servidor, na conta da família). */ testeInicio?: number; testeDias?: number; avisosTeste?: number[];
  /** v14.8: pranchas que os pais escolheram para ficar no plano grátis */ pranchasFixas?: string[];
  /** v14.8: quando a família começou a usar (0 = veio do app antigo 1.0.24) e quando migrou */ inicioUso?: number; migradoV24?: number }
export interface EstadoVoz { abas: AbaVoz[]; pranchas: PranchaVoz[]; defs: DefsVoz; modo: 'normal' | 'editar' | 'excluir'; editarAbas: boolean; seguinte: Record<string, Record<string, number>>;
  /** v14.2: dicas da primeira vez ("comece por aqui" e "segure 3 s") */
  dicas?: { criou?: boolean; toques?: Record<string, number> } }

let seq = 0;
export const novoId = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;
const BUSCA = typeof window !== 'undefined' && window.location ? window.location.search : '';
/** Só nos testes automáticos (?tela=…) começa com 3 pranchas de exemplo; &vazio=1 testa o começo vazio. */
const COM_EXEMPLOS = /[?&]tela=/.test(BUSCA) && !/[?&]vazio=1/.test(BUSCA);
const P = (abaId: string, lista: string): PranchaVoz[] => lista.split(',').map((x) => { const [texto, emoji] = x.split('|'); return { id: novoId('p'), texto, emoji, abaId }; });

/** Categorias (as 4 cores da comunicação): pessoas amarelo, expressão social rosa, descrição azul, ações verde. */
export const CATEGORIAS = ['pessoas', 'social', 'descricao', 'acoes'] as const;
/** Escolhe a categoria pelo texto da prancha (os pais podem trocar). Coisas e lugares ficam em Descrição. */
export const categoriaAuto = (texto: string): string => {
  const c = categoriaDaPalavra(String(texto ?? '').trim().split(/\s+/)[0] || '');
  return c === 'pessoa' ? 'pessoas' : c === 'verbo' ? 'acoes' : c === 'social' || c === 'pergunta' || c === 'negacao' ? 'social' : 'descricao';
};
/** Atualiza dados antigos: a aba Favoritos vira Geral; pranchas que estavam nela ganham uma categoria. */
export const migrarVoz = (s: EstadoVoz): EstadoVoz => {
  const padrao = estadoVozPadrao();
  const abasIn = (Array.isArray(s.abas) ? s.abas : padrao.abas).filter((a) => a && typeof a.id === 'string' && typeof a.nome === 'string');
  const temGeral = abasIn.some((a) => a.id === 'geral');
  const abas = temGeral ? abasIn.filter((a) => a.id !== 'favoritos') : [{ id: 'geral', nome: 'Geral', tema: 'GERAL' }, ...abasIn.filter((a) => a.id !== 'favoritos')];
  const ids = new Set(abas.map((a) => a.id));
  const pranchas = (Array.isArray(s.pranchas) ? s.pranchas : []).filter((p) => p && typeof p.texto === 'string').map((p) => (p.abaId === 'geral' || !ids.has(p.abaId) ? { ...p, abaId: categoriaAuto(p.texto) } : p));
  return { ...s, abas, pranchas, defs: { ...padrao.defs, ...(s.defs && typeof s.defs === 'object' ? s.defs : {}) } };
};

/** v14.3: desenho do ARASAAC para uma palavra (pacotes). Tenta guardar a imagem no celular (data:) para funcionar
 *  sem internet depois; se não der, usa o endereço oficial do ARASAAC. Sem internet ou sem resultado: undefined (fica o emoji). */
export const buscarPictoArasaac = async (texto: string, idioma: 'pt' | 'en' | 'es'): Promise<string | undefined> => {
  const q = texto.trim().toLowerCase().slice(0, 40);
  if (!q) return undefined;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const t = setTimeout(() => ctl?.abort(), 8000);
  try {
    let r = await fetch(`https://api.arasaac.org/v1/pictograms/${idioma}/bestsearch/${encodeURIComponent(q)}`, { signal: ctl?.signal });
    if (!r.ok) r = await fetch(`https://api.arasaac.org/v1/pictograms/${idioma}/search/${encodeURIComponent(q)}`, { signal: ctl?.signal });
    const j: unknown = r.ok ? await r.json() : [];
    const id = (Array.isArray(j) ? j : []).map((x) => (x && typeof x === 'object' ? (x as { _id?: unknown })._id : undefined)).find((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 1e7);
    if (!id) return undefined;
    const url = `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
    try {
      const b = await (await fetch(url, { signal: ctl?.signal })).blob();
      if (b.size > 0 && b.size < 600_000 && /^image\/png/.test(b.type)) {
        const d = await new Promise<string>((ok, erro) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = erro; fr.readAsDataURL(b); });
        if (/^data:image\/png;base64,/.test(d)) return d;
      }
    } catch { /* o site pode não deixar copiar: usa o endereço */ }
    return url;
  } catch { return undefined; } finally { clearTimeout(t); }
};

/** v14: confere os dados do Voz vindos de um backup (cada prancha e aba, campo a campo). */
// imagens: só as do próprio celular (data:) ou os pictogramas da ARASAAC (o app não busca imagens de outros sites)
const IMG_OK = /^(data:image\/(png|jpe?g|webp|gif);base64,|https:\/\/static\.arasaac\.org\/pictograms\/\d+\/\d+_300\.png$)/;
const AUD_OK = /^data:audio\/[a-z0-9.+-]+(;codecs=[a-z0-9.,+-]+)?;base64,/i;
export const sanearVoz = (x: unknown): EstadoVoz | null => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  if (!Array.isArray(o.abas) || !Array.isArray(o.pranchas)) return null;
  const txt = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
  const abas = o.abas.filter((a): a is AbaVoz => !!a && typeof a === 'object' && typeof (a as AbaVoz).id === 'string' && typeof (a as AbaVoz).nome === 'string')
    .slice(0, 60).map((a) => ({ id: txt(a.id, 80), nome: txt(a.nome, 40), tema: TEMAS[a.tema] ? a.tema : 'COMUNICACAO' }));
  const pranchas = o.pranchas.filter((p): p is PranchaVoz => !!p && typeof p === 'object' && typeof (p as PranchaVoz).id === 'string' && typeof (p as PranchaVoz).texto === 'string')
    .slice(0, 2000).map((p) => ({ id: txt(p.id, 80), texto: txt(p.texto, 40), abaId: txt(p.abaId, 80), emoji: p.emoji ? txt(p.emoji, 16) : undefined,
      imagem: typeof p.imagem === 'string' && IMG_OK.test(p.imagem) && p.imagem.length < 3_000_000 ? p.imagem : undefined,
      audio: typeof p.audio === 'string' && AUD_OK.test(p.audio) && p.audio.length < 3_000_000 ? p.audio : undefined }));
  const d = o.defs && typeof o.defs === 'object' ? (o.defs as Partial<DefsVoz>) : {};
  const pd = estadoVozPadrao().defs;
  const defs: DefsVoz = {
    idioma: d.idioma === 'en' || d.idioma === 'es' ? d.idioma : 'pt',
    colunasAuto: typeof d.colunasAuto === 'boolean' ? d.colunasAuto : pd.colunasAuto,
    colunas: typeof d.colunas === 'number' && d.colunas >= 2 && d.colunas <= 8 ? Math.round(d.colunas) : pd.colunas,
    sugestoes: typeof d.sugestoes === 'boolean' ? d.sugestoes : pd.sugestoes,
    tecladoAvancado: typeof d.tecladoAvancado === 'boolean' ? d.tecladoAvancado : pd.tecladoAvancado,
    bloquearApp: typeof d.bloquearApp === 'boolean' ? d.bloquearApp : pd.bloquearApp,
    voz: txt(d.voz, 120), volume: typeof d.volume === 'number' && d.volume >= 0 && d.volume <= 100 ? d.volume : pd.volume,
  };
  return migrarVoz({ ...estadoVozPadrao(), abas, pranchas, defs, modo: 'normal', editarAbas: false, seguinte: {} });
};

export const estadoVozPadrao = (): EstadoVoz => ({
  abas: [
    // v11: GERAL mostra TODAS as pranchas numa tela só, cada uma com a cor da sua categoria
    { id: 'geral', nome: 'Geral', tema: 'GERAL' },
    { id: 'pessoas', nome: 'Pessoas', tema: 'APRENDIZAGEM' },
    { id: 'social', nome: 'Expressão social', tema: 'SOCIALIZACAO' },
    { id: 'descricao', nome: 'Descrição', tema: 'COMUNICACAO' },
    { id: 'acoes', nome: 'Ações', tema: 'EMOCOES' },
  ],
  // v9: começa SEM pranchas (só o botão ADICIONAR PRANCHA) — os pais criam. Nos testes automáticos (?tela=…) entram 3 de exemplo.
  pranchas: COM_EXEMPLOS ? [...P('pessoas', 'Eu|🙋'), ...P('acoes', 'Quero|🙏'), ...P('descricao', 'Água|💧')] : [],
  defs: { idioma: 'pt', colunasAuto: true, colunas: 4, sugestoes: true, tecladoAvancado: false, bloquearApp: false, voz: '', volume: 100 },
  modo: 'normal',
  editarAbas: false,
  seguinte: {},
});

const CHAVE = '@voz-amiga-teste/estado-v1';

interface Ctx {
  s: EstadoVoz;
  mudar: (f: (s: EstadoVoz) => EstadoVoz) => void;
  falar: (texto: string) => void;
  tocar: (p: PranchaVoz, usarGravacao?: boolean) => void;
  toast: (m: string) => void;
  msg: string;
  /** v14: muda a cada alteração (backup automático) */
  rev: number;
}
const VozCtx = createContext<Ctx | null>(null);
export const useVoz = () => useContext(VozCtx)!;

// ------------------------------------------------------------ ponte com o Android (APK de teste)
type Ponte = { AndroidTTS?: { speak?: (t: string, l: string) => void; speak2?: (t: string, l: string, v: string, vol: number) => void; vozes?: (l: string) => string; abrirConfigVoz?: () => void; abrirLink?: (u: string) => void; sair?: () => void; travar?: () => void; destravar?: () => void } };
export const ponte = (): Ponte['AndroidTTS'] => (typeof window !== 'undefined' ? (window as unknown as Ponte).AndroidTTS : undefined);
export const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' } as const;

// SEGURANÇA: só https, e-mail e WhatsApp chegam na ponte do Android (bloqueia tel:, sms:, intent:, file:, javascript:…)
export const abrirLink = (url: string) => {
  const u = linkSeguro(url);
  if (!u) return;
  const p = ponte();
  if (p?.abrirLink) { p.abrirLink(u); return; }
  if (typeof window !== 'undefined') window.open(u, '_blank', 'noopener,noreferrer');
};

export const listarVozes = (idioma: DefsVoz['idioma']): string[] => {
  const p = ponte();
  try {
    if (p?.vozes) return JSON.parse(p.vozes(LOCALE[idioma])) as string[];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(idioma)).map((v) => v.name);
  } catch { /* */ }
  return [];
};

export function falarTexto(texto: string, d: DefsVoz) {
  if (!texto) return;
  const p = ponte();
  try {
    if (p?.speak2) { p.speak2(texto, LOCALE[d.idioma], d.voz, d.volume / 100); return; }
    if (p?.speak) { p.speak(texto, LOCALE[d.idioma]); return; }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = LOCALE[d.idioma];
      u.volume = d.volume / 100;
      const v = window.speechSynthesis.getVoices().find((x) => x.name === d.voz);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }
  } catch { /* sem voz */ }
}

export function VozProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<EstadoVoz>(estadoVozPadrao);
  const ref = useRef(s);
  ref.current = s;
  const [pronto, setPronto] = useState(false);
  const [msg, setMsg] = useState('');
  const [rev, setRev] = useState(0);
  const [migrando, setMigrando] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then(async (t) => {
      if (t) { try { setS(migrarVoz({ ...estadoVozPadrao(), ...JSON.parse(t) })); } catch { /* */ } setPronto(true); return; }
      // 1ª abertura: o celular tinha o Voz Amiga 1.0.24? Traz tudo (sem apagar o original).
      const antigo = lerAntigo();
      if (antigo) {
        setMigrando(true);
        try {
          await AsyncStorage.setItem(CHAVE + '/v24-bruto', JSON.stringify(antigo)).catch(() => undefined); // cópia crua, por segurança
          const { estado } = await montarEstadoMigrado(antigo, estadoVozPadrao(), (u) => reduzirImagem(u));
          setS(migrarVoz(estado));
        } catch { /* se falhar, abre normal; a cópia crua fica guardada */ }
        setMigrando(false);
      } else {
        setS((x) => ({ ...x, defs: { ...x.defs, inicioUso: Date.now() } }));
      }
      setPronto(true);
    }).catch(() => setPronto(true));
  }, []);
  useEffect(() => { if (pronto) AsyncStorage.setItem(CHAVE, JSON.stringify(s)).catch(() => toast('Memória cheia: use imagens menores.')); }, [s, pronto]); // eslint-disable-line react-hooks/exhaustive-deps
  const mudar = (f: (x: EstadoVoz) => EstadoVoz) => { const n = f(ref.current); if (n === ref.current) return; ref.current = n; setS(n); setRev((r) => r + 1); };
  const falar = (t: string) => falarTexto(t, ref.current.defs);
  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg((x) => (x === m ? '' : x)), 2600); };
  // v14: a voz gravada falhou? usa a próxima voz da lista e avisa (sem pop-up)
  const tocar = (p: PranchaVoz, usarGravacao = true) => {
    if (usarGravacao && p.audio && Platform.OS === 'web') {
      try { const a = new window.Audio(p.audio); a.volume = ref.current.defs.volume / 100; a.play().catch(() => { toast('A gravação não tocou. Usando a voz do celular.'); falar(p.texto); }); return; } catch { /* */ }
    }
    falar(p.texto);
  };
  if (migrando) return (
    <View accessibilityLabel="trazendo pranchas" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF7E8' }}>
      <Text style={{ fontSize: 48 }}>💙</Text>
      <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 12 }}>Trazendo as suas pranchas…</Text>
      <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8 }}>Só leva um instante. Nada do que vocês montaram será perdido.</Text>
    </View>
  );
  return <VozCtx.Provider value={{ s, mudar, falar, tocar, toast, msg, rev }}>{children}</VozCtx.Provider>;
}

// ------------------------------------------------------------ imagens/áudio (WebView)
/** Diminui a foto para caber na memória do app de teste. */
export const reduzirImagem = (uri: string, max = 360): Promise<string> => new Promise((res) => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') { res(uri); return; }
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext('2d');
    if (!g) { res(uri); return; }
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    try { res(c.toDataURL('image/jpeg', 0.82)); } catch { res(uri); }
  };
  img.onerror = () => res(uri);
  img.src = uri;
});

export const escolherArquivo = (accept: string): Promise<string | null> => new Promise((res) => {
  if (typeof document === 'undefined') { res(null); return; }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = accept;
  inp.onchange = () => {
    const f = inp.files?.[0];
    if (!f) { res(null); return; }
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => res(null);
    r.readAsDataURL(f);
  };
  inp.click();
});

/** Gravador de voz (MediaRecorder). */
export function useGravador() {
  const rec = useRef<MediaRecorder | null>(null);
  const [gravando, setGravando] = useState(false);
  const iniciar = async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pedacos: Blob[] = [];
      const mr = new MediaRecorder(stream);
      rec.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
      mr.start();
      setGravando(true);
      return null;
    } catch { return 'Permita o uso do microfone para gravar a voz da prancha.'; }
  };
  const parar = (): Promise<string | null> => new Promise((res) => {
    const mr = rec.current;
    if (!mr) { res(null); return; }
    const pedacos: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
    mr.onstop = () => {
      mr.stream.getTracks().forEach((t) => t.stop());
      setGravando(false);
      const b = new Blob(pedacos, { type: mr.mimeType || 'audio/webm' });
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => res(null);
      r.readAsDataURL(b);
    };
    mr.stop();
  });
  return { gravando, iniciar, parar };
}

// ------------------------------------------------------------ peças visuais do Voz
export const Cab = ({ icone, cor = '#0F172A', fundo = '#E2E8F0', titulo, onVoltar, onFechar }: { icone: string; cor?: string; fundo?: string; titulo: string; onVoltar?: () => void; onFechar: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingTop: 10, paddingBottom: 8 }}>
    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: fundo, alignItems: 'center', justifyContent: 'center' }}><Feather name={icone as never} size={18} color={cor} /></View>
    <Text style={{ flex: 1, marginLeft: 10, fontSize: 20, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>{titulo}</Text>
    {onVoltar ? <Pressable onPress={onVoltar} accessibilityLabel="Voltar" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}><Feather name="arrow-left" size={18} color="#0F172A" /></Pressable> : null}
    <Pressable onPress={onFechar} accessibilityLabel="Fechar" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}><Feather name="x" size={18} color="#DC2626" /></Pressable>
  </View>
);

export const CartaoDef = ({ icone, cor, fundo, titulo, desc, children }: { icone: string; cor: string; fundo: string; titulo: string; desc?: string; children?: React.ReactNode }) => (
  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: fundo, alignItems: 'center', justifyContent: 'center' }}><Feather name={icone as never} size={16} color={cor} /></View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>{titulo}</Text>
        {desc ? <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{desc}</Text> : null}
      </View>
    </View>
    <View style={{ marginTop: 10 }}>{children}</View>
  </View>
);

export const Estado = ({ on, onChange, sim = 'ATIVADAS', nao = 'DESATIVADAS', rotulo }: { on: boolean; onChange: (v: boolean) => void; sim?: string; nao?: string; rotulo?: string }) => (
  <Pressable onPress={() => onChange(!on)} accessibilityRole="switch" accessibilityLabel={rotulo} accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', height: 40, borderRadius: 20, borderWidth: 1, borderColor: on ? '#86EFAC' : '#CBD5E1', backgroundColor: on ? '#F0FDF4' : '#F8FAFC', paddingHorizontal: 10 }}>
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: on ? '#DCFCE7' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}><Feather name={on ? 'check' : 'x'} size={14} color={on ? '#16A34A' : '#475569'} /></View>
    <Text style={{ marginLeft: 10, fontSize: 13, fontWeight: '900', color: on ? '#15803D' : '#475569' }}>{on ? sim : nao}</Text>
  </Pressable>
);

export function Lista<T extends string>({ valor, opcoes, onChange, rotulo }: { valor: T; opcoes: { v: T; r: string; cor?: string }[]; onChange: (v: T) => void; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.v === valor);
  return (
    <>
      <Pressable onPress={() => setAberto(true)} accessibilityLabel={rotulo} style={{ flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12 }}>
        {atual?.cor ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: atual.cor, marginRight: 10 }} /> : null}
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{atual?.r || 'Selecione'}</Text>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><Feather name="chevron-down" size={16} color="#334155" /></View>
      </Pressable>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable onPress={() => setAberto(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, maxHeight: '75%', overflow: 'hidden' }}>
            <ScrollView>
              {opcoes.map((o) => (
                <Pressable key={o.v} onPress={() => { onChange(o.v); setAberto(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#F1F5F9', backgroundColor: o.v === valor ? '#EFF6FF' : '#FFFFFF' }}>
                  {o.cor ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: o.cor, marginRight: 10 }} /> : null}
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 }}>{o.r}</Text>
                  {o.v === valor ? <Feather name="check" size={16} color="#2563EB" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Barra deslizante simples (sem pacotes extras). */
export function Deslizar({ valor, min, max, passo = 1, onChange, cor = '#2563EB', rotulo }: { valor: number; min: number; max: number; passo?: number; onChange: (v: number) => void; cor?: string; rotulo?: string }) {
  const larg = useRef(1);
  const de = (x: number) => { const k = Math.max(0, Math.min(1, x / larg.current)); onChange(Math.round((min + k * (max - min)) / passo) * passo); };
  const f = (valor - min) / (max - min || 1);
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={rotulo} onLayout={(e) => { larg.current = e.nativeEvent.layout.width; }}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => de(e.nativeEvent.locationX)} onResponderMove={(e) => de(e.nativeEvent.locationX)}
      style={{ height: 32, justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }}>
        <View style={{ width: `${f * 100}%`, height: 4, borderRadius: 2, backgroundColor: cor }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: `${f * 100}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: cor }} />
    </View>
  );
}

export const BotaoCor = ({ titulo, cor, icone, onPress, texto = '#FFFFFF', alto = 46, flex, desativado, rotulo, pequeno }: { titulo: string; cor: string; icone?: string; onPress: () => void; texto?: string; alto?: number; flex?: boolean; desativado?: boolean; rotulo?: string; pequeno?: boolean }) => (
  <Pressable onPress={onPress} disabled={desativado} accessibilityRole="button" accessibilityLabel={rotulo || titulo} style={({ pressed }) => [{ height: alto, borderRadius: alto / 2, backgroundColor: cor, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: pequeno ? 4 : 12, opacity: desativado ? 0.5 : pressed ? 0.8 : 1 }, flex ? { flex: 1 } : null]}>
    {icone ? <Feather name={icone as never} size={pequeno ? 13 : 16} color={texto} style={{ marginRight: pequeno ? 4 : 8 }} /> : null}
    <Text style={{ color: texto, fontWeight: '900', fontSize: pequeno ? 11 : 14, letterSpacing: pequeno ? 0 : 0.3 }} numberOfLines={1}>{titulo.toUpperCase()}</Text>
  </Pressable>
);

export const Aviso = () => {
  const { msg } = useVoz();
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: 90, left: 20, right: 20, backgroundColor: '#0F172A', borderRadius: 14, padding: 12, zIndex: 50, elevation: 30 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'center' }}>{msg}</Text>
    </View>
  );
};

/** "Bloquear App": conta de mais sem botão de cancelar. */
export function TelaBloqueio({ aoLiberar }: { aoLiberar: () => void }) {
  const sortear = () => { const a = 2 + Math.floor(Math.random() * 8); return { a, b: 1 + Math.floor(Math.random() * Math.min(9, 15 - a)) }; }; // resultado até 15
  const [c, setC] = useState(sortear);
  const [txt, setTxt] = useState('');
  const [erro, setErro] = useState(false);
  const tecla = (k: string) => {
    if (k === '⌫') { setTxt((x) => x.slice(0, -1)); return; }
    if (k === '✓') {
      if (Number(txt) === c.a + c.b) aoLiberar();
      else { setErro(true); setTxt(''); setC(sortear()); }
      return;
    }
    if (txt.length < 3) { setTxt(txt + k); setErro(false); }
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', padding: 22 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', textAlign: 'center' }}>App bloqueado</Text>
          <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 4 }}>Resolva a conta para continuar</Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 14 }}>{c.a} + {c.b} = <Text style={{ color: erro ? '#E11D48' : '#2563EB' }}>{txt || '?'}</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((k) => (
              <Pressable key={k} onPress={() => tecla(k)} accessibilityLabel={`bloqueio-${k}`} style={{ width: '31%', height: 48, borderRadius: 14, marginBottom: 8, backgroundColor: k === '✓' ? '#10B981' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>{k}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
