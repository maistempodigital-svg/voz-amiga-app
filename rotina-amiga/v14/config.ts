// VOZ AMIGA v14 — tudo o que os pais escolhem nas funções novas (guardado junto com a rotina, no aparelho).
import { IdRecurso, sanearPrefsRecursos } from './recursos';

export type MotorVoz = 'sistema' | 'gravada' | 'piper' | 'mascote' | 'espeak';
export type IdadeVoz = 'crianca' | 'adolescente' | 'adulto';
export type NivelFrase = 1 | 2 | 3;
export type EstiloBotao = 'redondo' | 'quadrado' | 'borda';
export type ModoTela = 'auto' | 'celular' | 'tablet';

export interface ConfigV14 {
  /** liga/desliga de cada função (o que não está aqui usa o padrão da função) */
  recursos: Partial<Record<IdRecurso, boolean>>;
  // A
  backupMax: number; // quantas cópias guardar no aparelho
  senhaHash?: string; // senha dos pais (só o "resumo" SHA-256, nunca a senha)
  senhaSal?: string;
  /** "Esqueci a senha": a senha só pode ser apagada depois desta hora (24 h de espera) */
  senhaResetEm?: number;
  /** erros seguidos da senha (continuam valendo depois de fechar o app) */
  senhaErros: { n: number; ate: number };
  emergencia: { dor: boolean; ajuda: boolean; banheiro: boolean };
  // B
  voz: { ordem: MotorVoz[]; idade: IdadeVoz; velocidade: number; tom: number; /** voz do celular escolhida para o mascote */ vozMascote?: string };
  // C
  lembreteHora: number; // 0–23
  missoesFeitas: Record<string, string>; // 'AAAA-MM-DD' => id da missão
  licoesVistas: string[];
  // E
  nivel: NivelFrase;
  nivelModo: 'manual' | 'auto';
  idadeAnos: number; // 0 = não informado
  gradeBotoes: number; // quantos botões aparecem (0 = todos)
  visual: IdadeVoz;
  marcos: Record<string, number>; // id do marco => quando
  /** conquistas criadas pelos pais (v14.2) */
  conquistasPais: { id: string; titulo: string; emoji: string; feitaEm?: number }[];
  // I
  toqueMs: number; // tempo de toque (0 = toque normal)
  estilo: EstiloBotao;
  modoTela: ModoTela;
  // H
  ia: { estado: 'nenhuma' | 'baixando' | 'pronta'; modelo?: string; soWifi: boolean };
}

export const MOTORES_PADRAO: MotorVoz[] = ['sistema', 'gravada', 'piper', 'mascote', 'espeak'];

export const configV14Padrao = (): ConfigV14 => ({
  recursos: {},
  backupMax: 3,
  senhaErros: { n: 0, ate: 0 },
  emergencia: { dor: true, ajuda: true, banheiro: false },
  voz: { ordem: [...MOTORES_PADRAO], idade: 'crianca', velocidade: 1, tom: 1 },
  lembreteHora: 18,
  missoesFeitas: {},
  licoesVistas: [],
  nivel: 3,
  nivelModo: 'manual',
  idadeAnos: 0,
  gradeBotoes: 10, // v14.3: o número que os especialistas sugerem para começar (v14/especialistas.ts)
  visual: 'crianca',
  marcos: {},
  conquistasPais: [],
  toqueMs: 0,
  estilo: 'redondo',
  modoTela: 'auto',
  ia: { estado: 'nenhuma', soWifi: true },
});

const num = (v: unknown, min: number, max: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 100) / 100)) : d);
const um = <T extends string | number>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Confere campo a campo (dados adulterados nunca derrubam o app; só o campo ruim volta ao padrão). */
export const sanearConfigV14 = (x: unknown): ConfigV14 => {
  const p = configV14Padrao();
  const o = obj(x);
  const em = obj(o.emergencia);
  const vz = obj(o.voz);
  const ia = obj(o.ia);
  const ordem = Array.isArray(vz.ordem) ? vz.ordem.filter((m): m is MotorVoz => MOTORES_PADRAO.includes(m as MotorVoz)) : [];
  const ordemFinal = [...new Set([...ordem, ...MOTORES_PADRAO])];
  const missoes: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(o.missoesFeitas)).slice(-400)) if (DIA.test(k) && typeof v === 'string' && v.length <= 20) missoes[k] = v;
  const marcos: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj(o.marcos)).slice(0, 100)) if (k.length <= 30 && typeof v === 'number' && Number.isFinite(v) && v > 0) marcos[k] = v;
  return {
    recursos: sanearPrefsRecursos(o.recursos),
    backupMax: num(o.backupMax, 1, 10, p.backupMax),
    senhaHash: typeof o.senhaHash === 'string' && /^[0-9a-f]{64}$/.test(o.senhaHash) && typeof o.senhaSal === 'string' && /^[0-9a-z]{8,40}$/.test(o.senhaSal) ? o.senhaHash : undefined,
    senhaResetEm: typeof o.senhaResetEm === 'number' && Number.isFinite(o.senhaResetEm) && o.senhaResetEm > 0 ? o.senhaResetEm : undefined,
    senhaErros: { n: Math.round(num(obj(o.senhaErros).n, 0, 1000, 0)), ate: num(obj(o.senhaErros).ate, 0, 8.64e15, 0) },
    senhaSal: typeof o.senhaSal === 'string' && /^[0-9a-z]{8,40}$/.test(o.senhaSal) ? o.senhaSal : undefined,
    emergencia: { dor: typeof em.dor === 'boolean' ? em.dor : p.emergencia.dor, ajuda: typeof em.ajuda === 'boolean' ? em.ajuda : p.emergencia.ajuda, banheiro: typeof em.banheiro === 'boolean' ? em.banheiro : p.emergencia.banheiro },
    voz: { ordem: ordemFinal, idade: um(vz.idade, ['crianca', 'adolescente', 'adulto'] as const, p.voz.idade), velocidade: num(vz.velocidade, 0.5, 1.5, 1), tom: num(vz.tom, 0.5, 1.6, 1), vozMascote: typeof vz.vozMascote === 'string' && vz.vozMascote.length <= 120 ? vz.vozMascote : undefined },
    lembreteHora: Math.round(num(o.lembreteHora, 0, 23, p.lembreteHora)),
    missoesFeitas: missoes,
    licoesVistas: Array.isArray(o.licoesVistas) ? [...new Set(Array.prototype.filter.call(o.licoesVistas, (v): v is string => typeof v === 'string' && v.length <= 30))].slice(0, 50) : [],
    nivel: um(o.nivel, [1, 2, 3] as const, p.nivel),
    nivelModo: um(o.nivelModo, ['manual', 'auto'] as const, p.nivelModo),
    idadeAnos: Math.round(num(o.idadeAnos, 0, 99, 0)),
    gradeBotoes: Math.round(num(o.gradeBotoes, 0, 60, p.gradeBotoes)),
    visual: um(o.visual, ['crianca', 'adolescente', 'adulto'] as const, p.visual),
    marcos,
    conquistasPais: (Array.isArray(o.conquistasPais) ? Array.prototype.slice.call(o.conquistasPais, 0, 30) : []).map((c) => obj(c)).filter((c) => typeof c.id === 'string' && /^[a-z0-9_-]{1,30}$/i.test(c.id) && typeof c.titulo === 'string' && c.titulo.trim())
      .map((c) => ({ id: c.id as string, titulo: (c.titulo as string).slice(0, 60), emoji: typeof c.emoji === 'string' && c.emoji.length <= 8 ? c.emoji : '⭐', feitaEm: typeof c.feitaEm === 'number' && Number.isFinite(c.feitaEm) && c.feitaEm > 0 ? c.feitaEm : undefined })),
    toqueMs: Math.round(num(o.toqueMs, 0, 2000, 0)),
    estilo: um(o.estilo, ['redondo', 'quadrado', 'borda'] as const, p.estilo),
    modoTela: um(o.modoTela, ['auto', 'celular', 'tablet'] as const, p.modoTela),
    // "baixando" não sobrevive a fechar o app (volta para "nenhuma")
    ia: { estado: ia.estado === 'pronta' ? 'pronta' : 'nenhuma', modelo: typeof ia.modelo === 'string' && ia.modelo.length <= 40 ? ia.modelo : undefined, soWifi: ia.soWifi === false ? false : true },
  };
};
