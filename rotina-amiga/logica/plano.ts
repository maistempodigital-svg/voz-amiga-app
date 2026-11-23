// PLANO GRATUITO x PLANO COMPLETO do Rotina Amiga.
// Quem é assinante vem do app (o mesmo "hasAccess" que o Voz já lê do Firebase).
// Os limites da versão gratuita podem vir do Firebase (Realtime Database: limitações/rotina) — se não vier nada, valem os padrões abaixo.

export interface LimitesRotina {
  /** Quantas rotinas (abas) os pais podem criar. */
  rotinas: number;
  /** Quantas tarefas por rotina. */
  tarefasPorRotina: number;
  /** Quantos prêmios na loja. */
  premios: number;
  /** Temporizador nas tarefas. */
  temporizador: boolean;
  /** Horário fixo, "travar até o horário" e alarme. */
  horario: boolean;
  /** Metas e conquistas. */
  metas: boolean;
  /** Relatório completo para profissionais (todos os períodos, tendência, crises, PDF). Sem ele: resumo de 7 dias. */
  relatorioCompleto: boolean;
  /** Mostrar anúncio na área de baixo quando não há etapa da rotina. */
  anuncios: boolean;
  /** Frases prontas: todas as frases + criar/editar as suas. Sem ele: 2 por grupo, só liga/desliga e oculta. */
  frasesPersonalizadas: boolean;
  /** v14.3: quantos botões o "Criar prancha falando" cria de uma vez (o resto aparece, mas fica do Plano Completo). */
  botoesPorVez: number;
  /** v14.7: quantas pranchas (botões) a família pode ter no total. As que já existem nunca são apagadas. */
  pranchas: number;
  /** v14.7: quantas pranchas podem ter a voz gravada dos pais. */
  vozGravada: number;
  /** v14.7: quais pacotes prontos são grátis (ids). Os outros aparecem com 👑. */
  pacotesGratis: string[];
  /** v14.8: tirar foto e escolher da galeria. Sem ele: só emojis. */
  fotos: boolean;
  /** Criação rápida (montar várias pranchas só tocando) */
  criacaoRapida: boolean;
  /** Travar o app (a criança não sai) */
  travarApp: boolean;
  /** v14.8: dias do teste premium (sem cartão, começa quando os pais quiserem). 0 = sem teste. */
  testePremiumDias: number;
}

/** Padrão da versão gratuita (pode ser mudado pelo Firebase sem atualizar o app). */
export const LIMITES_GRATIS: LimitesRotina = {
  rotinas: 1,
  tarefasPorRotina: 5,
  premios: 1,
  temporizador: false,
  horario: false,
  metas: false,
  relatorioCompleto: false,
  anuncios: true,
  frasesPersonalizadas: false,
  botoesPorVez: 10,
  pranchas: 10,
  vozGravada: 0,
  pacotesGratis: ['BEBIDAS'],
  fotos: false,
  criacaoRapida: false,
  travarApp: false,
  testePremiumDias: 30,
};

/** Plano Completo (Mensal, Semestral, Anual, Vitalício): tudo liberado e sem anúncio. */
export const LIMITES_COMPLETO: LimitesRotina = {
  rotinas: 999,
  tarefasPorRotina: 999,
  premios: 999,
  temporizador: true,
  horario: true,
  metas: true,
  relatorioCompleto: true,
  anuncios: false,
  frasesPersonalizadas: true,
  botoesPorVez: 999,
  pranchas: 99999,
  vozGravada: 99999,
  pacotesGratis: ['*'],
  fotos: true,
  criacaoRapida: true,
  travarApp: true,
  testePremiumDias: 0,
};

const num = (v: unknown, d: number) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && isFinite(n) && n >= 0 ? Math.round(n) : d;
};
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : d);

/**
 * Lê o nó do Firebase `limitações/rotina` (formato no arquivo integracao-firebase/limitacoes-rotina.json).
 * Aceita valores faltando ou em texto — o que não vier fica com o padrão gratuito.
 */
export const lerLimitesFirebase = (no: unknown): Partial<LimitesRotina> => {
  if (!no || typeof no !== 'object') return {};
  const o = no as Record<string, unknown>;
  const out: Partial<LimitesRotina> = {};
  if ('rotinas' in o) out.rotinas = num(o.rotinas, LIMITES_GRATIS.rotinas);
  if ('tarefasPorRotina' in o) out.tarefasPorRotina = num(o.tarefasPorRotina, LIMITES_GRATIS.tarefasPorRotina);
  if ('premios' in o) out.premios = num(o.premios, LIMITES_GRATIS.premios);
  if ('botoesPorVez' in o) out.botoesPorVez = Math.max(1, num(o.botoesPorVez, LIMITES_GRATIS.botoesPorVez));
  if ('pranchas' in o) out.pranchas = Math.min(99999, num(o.pranchas, LIMITES_GRATIS.pranchas));
  if ('vozGravada' in o) out.vozGravada = Math.min(99999, num(o.vozGravada, LIMITES_GRATIS.vozGravada));
  if ('pacotesGratis' in o) {
    // lista de ids (ou texto "ACOES,BEBIDAS"); só letras/números/_; no máximo 60
    const v = o.pacotesGratis;
    const lista = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : v && typeof v === 'object' ? Object.keys(v as object).filter((k) => (v as Record<string, unknown>)[k] === true) : [])
      .filter((x): x is string => typeof x === 'string').map((x) => x.trim().toUpperCase()).filter((x) => /^[A-Z0-9_*]{1,30}$/.test(x)).slice(0, 60);
    out.pacotesGratis = lista;
  }
  if ('testePremiumDias' in o) out.testePremiumDias = Math.min(365, num(o.testePremiumDias, LIMITES_GRATIS.testePremiumDias));
  for (const k of ['temporizador', 'horario', 'metas', 'relatorioCompleto', 'anuncios', 'frasesPersonalizadas', 'fotos', 'criacaoRapida', 'travarApp'] as const) {
    if (k in o) out[k] = bool(o[k], LIMITES_GRATIS[k]);
  }
  return out;
};

/**
 * v14.8 — "NOVOS / ANTIGOS / TODOS" (painel do Adriano).
 * Firebase `limitações/porData` = { corte: ms, antigos: { ...limites } }.
 *  • Família que começou a usar ANTES do corte (antiga) usa `antigos` por cima de `limitações/rotina`.
 *  • Família que começou DEPOIS do corte (nova) usa só `limitações/rotina`.
 * O painel monta isso: "só novos" = rotina recebe o valor novo e antigos guarda o valor velho;
 * "só antigos" = antigos recebe o valor novo; "todos" = rotina recebe o valor novo e a chave sai de antigos.
 * @param inicioUso quando a família começou a usar o app (ms). Quem veio do app antigo = 0 (antiga).
 */
export const limitesDoFirebase = (rotina: unknown, porData: unknown, inicioUso: number): Partial<LimitesRotina> => {
  const base = lerLimitesFirebase(rotina);
  const o = porData && typeof porData === 'object' && !Array.isArray(porData) ? (porData as Record<string, unknown>) : undefined;
  const corte = typeof o?.corte === 'number' && Number.isFinite(o.corte) ? o.corte : undefined;
  if (corte === undefined || !(Number.isFinite(inicioUso) && inicioUso < corte)) return base;
  return { ...base, ...lerLimitesFirebase(o?.antigos) };
};

/** Limites que valem agora. Assinante = tudo liberado; gratuito = padrão + o que vier do Firebase. */
export const limitesEfetivos = (assinante: boolean, doFirebase?: Partial<LimitesRotina>): LimitesRotina =>
  assinante === true ? LIMITES_COMPLETO : { ...LIMITES_GRATIS, ...lerLimitesFirebase(doFirebase) }; // confere de novo aqui: valor estranho nunca libera nada // só o booleano true libera ("false" em texto não libera)

/** SEGURANÇA: só abre endereços https, e-mail (mailto) e WhatsApp. Bloqueia tel:, sms:, intent:, market:, javascript:, file:, http: etc. */
export const linkSeguro = (url: unknown): string | undefined => {
  if (typeof url !== 'string') return undefined;
  const u = url.trim();
  // o texto do relatório no WhatsApp pode ser longo; os outros links, no máximo 2000
  const max = /^https:\/\/wa\.me\//i.test(u) ? 12000 : 2000;
  if (u.length > max) return undefined;
  if (/^https:\/\/[^\s\x00-\x1f\x7f]+$/i.test(u)) return u;
  if (/^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(u) && !/%40/i.test(u.slice(7).split('@')[0] + '')) return u; // um destinatário, sem parâmetros
  if (/^whatsapp:\/\/send\?text=[^&#\s\x00-\x1f\x7f]*$/i.test(u)) return u; // só texto, sem número de destino
  return undefined;
};
/** SEGURANÇA: imagem só por https (ou data:image de até ~1 MB). */
export const imagemSegura = (url: unknown): string | undefined => {
  if (typeof url !== 'string') return undefined;
  const u = url.trim();
  if (/^https:\/\/[^\s\x00-\x1f\x7f]+$/i.test(u) && u.length <= 2000) return u;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u) && u.length <= 1_400_000) return u;
  return undefined;
};

export type Recurso = 'rotina' | 'tarefa' | 'premio' | 'temporizador' | 'horario' | 'metas' | 'relatorio' | 'frases' | 'prancha' | 'pacote' | 'vozGravada' | 'foto' | 'funcao' | 'criacaoRapida' | 'travarApp';
/** O pacote é grátis neste plano? */
export const pacoteGratis = (l: LimitesRotina, id: string) => l.pacotesGratis.includes('*') || l.pacotesGratis.includes(id.toUpperCase());
