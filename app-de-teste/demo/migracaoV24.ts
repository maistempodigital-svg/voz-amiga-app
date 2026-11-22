// MIGRAÇÃO: Voz Amiga 1.0.24 (app da loja) → app novo (v14.8+).
// A versão nova usa o MESMO pacote (com.vozamiga), então os dados do app antigo continuam no celular
// (AsyncStorage "RKStorage" + pasta de arquivos). A casca Android lê as chaves "vozAmiga*" e entrega aqui.
// Regra de ouro: NADA se perde. O que não der para converter fica guardado cru (backup) para tentar de novo.
import { PADROES_V24 } from './padroesV24';

type Idioma = 'pt' | 'en' | 'es';
export interface AbaMig { id: string; nome: string; tema: string }
export interface PranchaMig { id: string; texto: string; abaId: string; emoji?: string; imagem?: string; audio?: string }
/** Arquivo do celular que ainda precisa virar imagem/áudio dentro do app novo. */
export interface MidiaMig { pranchaId: string; tipo: 'imagem' | 'audio'; origem: string }
export interface ResultadoMig { abas: AbaMig[]; pranchas: PranchaMig[]; midias: MidiaMig[]; idioma: Idioma; voz?: string; volume?: number; colunas?: number; avisos: string[] }

const TEMAS_OK = new Set(['COMUNICACAO', 'EMOCOES', 'APRENDIZAGEM', 'SOCIALIZACAO', 'ALIMENTOS', 'ROXO', 'LILAS', 'CIANO', 'VERDE_AGUA', 'VERDE_ESCURO', 'AZUL_ESCURO', 'MARROM', 'CINZA', 'ESCURO']);
const temaNovo = (t: unknown): string => {
  const s = typeof t === 'string' ? t.toUpperCase() : '';
  if (s === 'ROSA') return 'SOCIALIZACAO';
  if (s === 'ROTINA') return 'VERDE_AGUA';
  return TEMAS_OK.has(s) ? s : 'COMUNICACAO';
};
const NOMES_PADRAO: Record<Idioma, Record<string, string>> = {
  pt: { COMUNICACAO: 'Descrição', EMOCOES: 'Ações', APRENDIZAGEM: 'Pessoas', SOCIALIZACAO: 'Expressão social', ROTINA: 'Rotina', ALIMENTOS: 'Alimentos' },
  en: { COMUNICACAO: 'Description', EMOCOES: 'Actions', APRENDIZAGEM: 'People', SOCIALIZACAO: 'Social expression', ROTINA: 'Routine', ALIMENTOS: 'Food' },
  es: { COMUNICACAO: 'Descripción', EMOCOES: 'Acciones', APRENDIZAGEM: 'Personas', SOCIALIZACAO: 'Expresión social', ROTINA: 'Rutina', ALIMENTOS: 'Alimentos' },
};
const ORDEM_PADRAO = ['FAVORITOS', 'COMUNICACAO', 'APRENDIZAGEM', 'EMOCOES', 'SOCIALIZACAO'];

const json = <T>(v: string | null | undefined, padrao: T): T => { if (!v) return padrao; try { const x = JSON.parse(v); return (x ?? padrao) as T; } catch { return padrao; } };
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const txt = (x: unknown, n: number) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
/** id das pranchas prontas do app antigo: "default:<categoria>:<texto em minúsculas codificado>" */
export const idPadraoV24 = (cat: string, texto: string) => `default:${cat}:${encodeURIComponent(String(texto).trim().toLowerCase())}`;
const ehEmoji = (s: string) => s.length > 0 && s.length <= 16 && !/^(file|content|https?|data|asset|\/)/i.test(s);
const ehArquivo = (s: string) => /^(file:\/\/|content:\/\/|\/data\/)/i.test(s);
const ehArasaac = (s: string) => /^https:\/\/static\.arasaac\.org\/pictograms\/\d+\/\d+_300\.png$/.test(s);
const ehDataImg = (s: string) => /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s);

/**
 * Converte as chaves do app antigo (valores em texto, como estão no AsyncStorage) para o formato do app novo.
 * @param chaves ex.: { vozAmigaCustomItems: '{"...":[...]}', vozAmigaLang: '"pt"', ... }
 */
export function migrarDoAppAntigo(chaves: Record<string, string | null | undefined>): ResultadoMig {
  const avisos: string[] = [];
  const langRaw = json<unknown>(chaves.vozAmigaLang, 'pt');
  const idioma: Idioma = langRaw === 'en' || langRaw === 'es' ? langRaw : 'pt';
  const custom = json<unknown>(chaves.vozAmigaCustomItems, {});
  const userCats = obj(json<unknown>(chaves.vozAmigaUserCategories, {}));
  const delDef = new Set(json<unknown[]>(chaves.vozAmigaDeletedDefaults, []).filter((x): x is string => typeof x === 'string'));
  const delCat = new Set(json<unknown[]>(chaves.vozAmigaDeletedCategories, []).filter((x): x is string => typeof x === 'string'));
  const ordemCat = json<unknown[]>(chaves.vozAmigaCategoryOrder, ORDEM_PADRAO).filter((x): x is string => typeof x === 'string');
  const ordemItens = obj(json<unknown>(chaves.vozAmigaItemOrders, {}));
  const audioMap = obj(json<unknown>(chaves.vozAmigaAudioMap, {}));

  // ---------- abas (categorias), na ordem que a família deixou
  const abas: AbaMig[] = [];
  const vistas = new Set<string>();
  const addAba = (id: string) => {
    if (!id || vistas.has(id) || id === 'FAVORITOS' || delCat.has(id)) return;
    const uc = obj(userCats[id]);
    const padrao = PADROES_V24[idioma][id];
    if (!padrao && !Object.keys(uc).length) return;
    vistas.add(id);
    abas.push({ id: `v24_${id}`.slice(0, 80), nome: (txt(uc.label, 40) || NOMES_PADRAO[idioma][id] || id).slice(0, 40), tema: temaNovo(uc.theme || uc.color || id) });
  };
  for (const id of ordemCat) addAba(id);
  for (const id of Object.keys(userCats)) addAba(id); // categorias criadas que ficaram fora da ordem

  // ---------- pranchas de cada aba
  const pranchas: PranchaMig[] = [];
  const midias: MidiaMig[] = [];
  const usados = new Set<string>();
  const addPrancha = (abaOld: string, it: Record<string, unknown>, idPadrao?: string) => {
    const texto = txt(it.text ?? it.label, 40);
    if (!texto) return;
    const idVelho = txt(it.id, 120) || idPadrao || `${abaOld}:${texto}`;
    const id = `v24_${idVelho}`.replace(/[^\w:.%-]/g, '_').slice(0, 80);
    if (usados.has(id)) return;
    usados.add(id);
    const icon = txt(it.icon, 3_000_000);
    const p: PranchaMig = { id, texto, abaId: `v24_${abaOld}`.slice(0, 80) };
    if (ehDataImg(icon) || ehArasaac(icon)) p.imagem = icon;
    else if (ehArquivo(icon)) { midias.push({ pranchaId: id, tipo: 'imagem', origem: icon }); p.emoji = '🖼️'; }
    else if (/^https:\/\//i.test(icon)) { midias.push({ pranchaId: id, tipo: 'imagem', origem: icon }); p.emoji = '🖼️'; }
    else p.emoji = ehEmoji(icon) ? icon : '💬';
    // voz gravada: audioMap[audioKey || id]
    const chaveAudio = txt(it.audioKey, 200) || idVelho;
    const a = typeof audioMap[chaveAudio] === 'string' ? (audioMap[chaveAudio] as string) : typeof obj(audioMap[chaveAudio]).uri === 'string' ? (obj(audioMap[chaveAudio]).uri as string) : '';
    if (a) midias.push({ pranchaId: id, tipo: 'audio', origem: a });
    pranchas.push(p);
  };
  const itensCustom = (cat: string): Record<string, unknown>[] => {
    // formatos aceitos: { CAT: [itens] }  ou  [ { categoryId, ... } ]
    if (Array.isArray(custom)) return custom.map(obj).filter((x) => x.categoryId === cat);
    const v = obj(custom)[cat];
    return Array.isArray(v) ? v.map(obj) : Object.values(obj(v)).map(obj);
  };
  for (const a of abas) {
    const cat = a.id.slice(4);
    const lista: { it: Record<string, unknown>; idPadrao?: string }[] = [];
    for (const [t, e] of PADROES_V24[idioma][cat] || []) {
      const idp = idPadraoV24(cat, t);
      if (!delDef.has(idp)) lista.push({ it: { id: idp, text: t, icon: e }, idPadrao: idp });
    }
    const uc = obj(userCats[cat]);
    for (const it of Array.isArray(uc.items) ? uc.items.map(obj) : []) lista.push({ it });
    for (const it of itensCustom(cat)) lista.push({ it });
    // ordem salva pela família (lista de ids)
    const ordem = Array.isArray(ordemItens[cat]) ? (ordemItens[cat] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const pos = new Map(ordem.map((id, i) => [id, i]));
    lista.sort((x, y) => (pos.get(txt(x.it.id, 120)) ?? 1e9) - (pos.get(txt(y.it.id, 120)) ?? 1e9));
    for (const { it, idPadrao } of lista) addPrancha(cat, it, idPadrao);
  }
  // itens personalizados de categorias que não existem mais na lista: vão para a 1ª aba (não se perdem)
  if (!Array.isArray(custom)) for (const [cat, v] of Object.entries(obj(custom))) {
    if (vistas.has(cat)) continue;
    const itens = Array.isArray(v) ? v.map(obj) : Object.values(obj(v)).map(obj);
    if (itens.length && abas[0]) { avisos.push(`categoria ${cat} não existe mais: ${itens.length} pranchas foram para "${abas[0].nome}"`); for (const it of itens) addPrancha(abas[0].id.slice(4), it); }
  }
  const voz = txt(json<unknown>(chaves.vozAmigaVoice, ''), 120) || undefined;
  const volRaw = json<unknown>(chaves.vozAmigaVolume, undefined);
  const volume = typeof volRaw === 'number' && Number.isFinite(volRaw) ? Math.round(volRaw <= 1 ? volRaw * 100 : Math.min(100, volRaw)) : undefined;
  const colRaw = json<unknown>(chaves.vozAmigaGridCols, undefined);
  const colunas = typeof colRaw === 'number' && colRaw >= 2 && colRaw <= 8 ? Math.round(colRaw) : undefined;
  return { abas, pranchas, midias, idioma, voz, volume, colunas, avisos };
}

/** Tem dados do app antigo para migrar? */
export const temDadosV24 = (chaves: Record<string, string | null | undefined>) =>
  ['vozAmigaCustomItems', 'vozAmigaUserCategories', 'vozAmigaDeletedDefaults', 'vozAmigaCategoryOrder', 'vozAmigaItemOrders', 'vozAmigaLang'].some((k) => !!chaves[k]);

/** Pranchas prontas que vieram do app antigo NÃO contam no limite do plano grátis (nunca somem da tela). */
export const veioProntaV24 = (id: string) => id.startsWith('v24_default:');
export const contarParaLimite = (pranchas: { id: string }[]) => pranchas.filter((p) => !veioProntaV24(p.id)).length;

/** Instalação nova: as pranchas prontas de sempre (as mesmas do app 1.0.24), nas 4 abas do app novo.
 *  Têm id "v24_default:…", então NÃO contam no limite do plano grátis. */
export function pranchasProntas(idioma: Idioma): PranchaMig[] {
  const mapa: [string, string][] = [['APRENDIZAGEM', 'pessoas'], ['SOCIALIZACAO', 'social'], ['COMUNICACAO', 'descricao'], ['EMOCOES', 'acoes']];
  const out: PranchaMig[] = []; const vistos = new Set<string>();
  for (const [cat, aba] of mapa) for (const [texto, emoji] of PADROES_V24[idioma][cat] || []) {
    const id = `v24_${idPadraoV24(cat, texto)}`.replace(/[^\w:.%-]/g, '_').slice(0, 80);
    if (vistos.has(id)) continue; vistos.add(id);
    out.push({ id, texto, emoji, abaId: aba });
  }
  return out;
}
