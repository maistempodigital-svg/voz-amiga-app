// VOZ AMIGA v14 — CÓPIA DE SEGURANÇA (sem internet, sem Firebase)
// • Automática: a cada mudança o app guarda uma cópia no próprio aparelho e mantém as últimas N.
// • Arquivo: os pais mandam a cópia pelo menu de compartilhar (Drive, WhatsApp, e-mail) e restauram em qualquer celular.
// O arquivo é um texto JSON com uma "soma de conferência" (SHA-256): se alguém mexer no arquivo ou ele vier cortado, o app recusa.
import { sha256 } from './seguranca';

export const FORMATO_BACKUP = 'vozamiga-backup';
export const VERSAO_BACKUP = 1;
/** Tamanho máximo aceito na restauração (fotos e áudios entram no arquivo). */
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

/** O que vai dentro: as pranchas/abas/definições do Voz (do jeito que o app guarda) e a rotina. */
export interface DadosBackup { voz: unknown; rotina: unknown }
export interface ArquivoBackup { formato: typeof FORMATO_BACKUP; versao: number; criadoEm: number; app: string; soma: string; resumo: ResumoBackup; dados: DadosBackup }
export interface ResumoBackup { pranchas: number; abas: number; tarefas: number }
export interface CopiaLocal { t: number; resumo: ResumoBackup; soma: string; texto: string }

const conta = (v: unknown, k: string) => { const a = v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined; return Array.isArray(a) ? a.length : 0; };
export const resumir = (d: DadosBackup): ResumoBackup => ({ pranchas: conta(d.voz, 'pranchas'), abas: conta(d.voz, 'abas'), tarefas: conta(d.rotina, 'tarefas') });

/** Cria o texto do arquivo de backup. */
/** SEGURANÇA: a senha dos pais (resumo e sal) NUNCA vai para o arquivo — ele pode circular por Drive/WhatsApp. */
const semSenha = (rotina: unknown): unknown => {
  if (!rotina || typeof rotina !== 'object' || Array.isArray(rotina)) return rotina;
  const r = rotina as Record<string, unknown>;
  if (!r.v14 || typeof r.v14 !== 'object') return rotina;
  const { senhaHash: _h, senhaSal: _s, senhaErros: _e, senhaResetEm: _r, ...resto } = r.v14 as Record<string, unknown>;
  void _h; void _s; void _e; void _r;
  return { ...r, v14: resto };
};
export const criarBackup = (dadosIn: DadosBackup, agora = Date.now(), app = 'Voz Amiga'): string => {
  const dados = { voz: dadosIn.voz, rotina: semSenha(dadosIn.rotina) };
  const corpo = JSON.stringify(dados);
  const arq: ArquivoBackup = { formato: FORMATO_BACKUP, versao: VERSAO_BACKUP, criadoEm: agora, app: String(app).slice(0, 40), soma: sha256(corpo), resumo: resumir(dados), dados };
  return JSON.stringify(arq);
};

export type ErroBackup = 'vazio' | 'grande' | 'naoJson' | 'formato' | 'versao' | 'soma' | 'dados';
export type LeituraBackup = { ok: true; dados: DadosBackup; criadoEm: number; resumo: ResumoBackup } | { ok: false; erro: ErroBackup };

/** Lê e confere um arquivo de backup. Nunca lança erro; quem chama ainda passa os dados pelo "sanear" de cada parte. */
export const lerBackup = (texto: unknown): LeituraBackup => {
  if (typeof texto !== 'string' || !texto.trim()) return { ok: false, erro: 'vazio' };
  if (texto.length > MAX_BACKUP_BYTES) return { ok: false, erro: 'grande' };
  let o: Record<string, unknown>;
  try { const v = JSON.parse(texto); if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, erro: 'formato' }; o = v as Record<string, unknown>; } catch { return { ok: false, erro: 'naoJson' }; }
  if (o.formato !== FORMATO_BACKUP) return { ok: false, erro: 'formato' };
  if (typeof o.versao !== 'number' || o.versao < 1 || o.versao > VERSAO_BACKUP) return { ok: false, erro: 'versao' };
  const d = o.dados as DadosBackup | undefined;
  if (!d || typeof d !== 'object' || Array.isArray(d) || !('voz' in d) || !('rotina' in d)) return { ok: false, erro: 'dados' };
  if (typeof o.soma !== 'string' || sha256(JSON.stringify(d)) !== o.soma) return { ok: false, erro: 'soma' };
  const criadoEm = typeof o.criadoEm === 'number' && Number.isFinite(o.criadoEm) ? o.criadoEm : 0;
  return { ok: true, dados: { voz: d.voz, rotina: d.rotina }, criadoEm, resumo: resumir(d) };
};

/** Junta uma cópia nova às antigas: a mais nova primeiro, sem repetir a mesma cópia, até `max`. */
export const guardarCopia = (lista: CopiaLocal[] | unknown, texto: string, agora: number, max: number): CopiaLocal[] => {
  const antigas = (Array.isArray(lista) ? lista : []).filter((c): c is CopiaLocal => !!c && typeof c === 'object' && typeof (c as CopiaLocal).texto === 'string' && typeof (c as CopiaLocal).t === 'number' && typeof (c as CopiaLocal).soma === 'string');
  const lim = Math.max(1, Math.min(10, Math.round(max) || 1));
  // a cópia acabou de ser criada pelo próprio app: confere só o formato (sem recalcular o SHA-256, que pesa em celular simples)
  let arq: ArquivoBackup;
  try { arq = JSON.parse(texto) as ArquivoBackup; } catch { return antigas.slice(0, lim); }
  if (!arq || arq.formato !== FORMATO_BACKUP || typeof arq.soma !== 'string' || !arq.resumo) return antigas.slice(0, lim);
  if (antigas[0]?.soma === arq.soma) return antigas.slice(0, lim);
  return [{ t: agora, resumo: arq.resumo, soma: arq.soma, texto }, ...antigas].slice(0, lim);
};

/** Nome do arquivo: VozAmiga-backup-2026-11-16.json */
export const nomeArquivoBackup = (agora = Date.now()) => {
  const d = new Date(agora);
  const z = (n: number) => String(n).padStart(2, '0');
  return `VozAmiga-backup-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}.json`;
};

export const MSG_ERRO_BACKUP: Record<ErroBackup, { pt: string; en: string; es: string }> = {
  vazio: { pt: 'O arquivo está vazio.', en: 'The file is empty.', es: 'El archivo está vacío.' },
  grande: { pt: 'O arquivo é grande demais.', en: 'The file is too big.', es: 'El archivo es demasiado grande.' },
  naoJson: { pt: 'Este não é um arquivo de backup do Voz Amiga.', en: 'This is not a Voz Amiga backup file.', es: 'Este no es un archivo de copia de Voz Amiga.' },
  formato: { pt: 'Este não é um arquivo de backup do Voz Amiga.', en: 'This is not a Voz Amiga backup file.', es: 'Este no es un archivo de copia de Voz Amiga.' },
  versao: { pt: 'Este backup é de uma versão mais nova. Atualize o app.', en: 'This backup is from a newer version. Update the app.', es: 'Esta copia es de una versión más nueva. Actualiza la app.' },
  soma: { pt: 'O arquivo foi alterado ou chegou cortado. Use outra cópia.', en: 'The file was changed or is incomplete. Use another copy.', es: 'El archivo fue alterado o llegó cortado. Usa otra copia.' },
  dados: { pt: 'O arquivo está incompleto.', en: 'The file is incomplete.', es: 'El archivo está incompleto.' },
};
