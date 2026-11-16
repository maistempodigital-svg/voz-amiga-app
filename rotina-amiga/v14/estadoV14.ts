// VOZ AMIGA v14 — parte nova do contexto (usada dentro do <RotinaAmigaProvider>).
import { anunciarFala } from './Mascote';
import { configurarHostIA, HostIA, HostSegredo } from './iaEstado';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as A from '../logica/acoes';
import { EstadoRotina, Idioma } from '../tipos';
import { chaveDia } from '../logica/tempo';
import { estadoPadrao } from '../padroes';
import { ConfigV14, configV14Padrao } from './config';
import { CopiaLocal, criarBackup, guardarCopia, lerBackup, ErroBackup, nomeArquivoBackup } from './backup';
import { Disponibilidade, disponibilidade, IdRecurso, lerRecursosFirebase, recursoAtivo, RegrasRemotas } from './recursos';
import { marcosNovos, nivelAutomatico } from './crescer';
import { parametrosVoz } from './vozes';

export const CHAVE_BACKUPS = '@voz-amiga/backups-v14';
/** Cópia de "antes de restaurar" — fora do rodízio, para o Desfazer nunca sumir. */
export const CHAVE_ANTES_RESTAURAR = '@voz-amiga/antes-de-restaurar-v14';

/** O que o app do Voz entrega ao módulo para as funções novas (tudo opcional). */
export interface HostV14 {
  /** Dados do Voz (pranchas, abas, definições) para entrar no backup. */
  lerDadosVoz?: () => unknown;
  /** Número que muda quando os dados do Voz mudam (para o backup automático). */
  versaoVoz?: number;
  /** Restaura os dados do Voz vindos de um backup. O app confere tudo e devolve true se deu certo. */
  restaurarDadosVoz?: (dados: unknown) => boolean;
  /** Onde guardar as cópias automáticas. Padrão: AsyncStorage. */
  armazenamentoBackup?: { ler: () => Promise<string | null>; gravar: (v: string) => Promise<void> };
  /** Salvar/compartilhar o arquivo (Drive, WhatsApp, e-mail). Ex.: expo-file-system + expo-sharing. */
  compartilharArquivo?: (nome: string, conteudo: string) => void;
  /** Escolher um arquivo .json do celular (ex.: expo-document-picker). Devolve o texto. */
  escolherArquivo?: () => Promise<string | null>;
  /** Vozes instaladas no celular e a escolhida. */
  listarVozes?: () => string[];
  vozAtual?: string;
  mudarVoz?: (nome: string) => void;
  volume?: number;
  mudarVolume?: (v: number) => void;
  abrirConfigVoz?: () => void;
  /** Falar com velocidade e tom (ex.: expo-speech rate/pitch). Sem ela, usa a fala normal. */
  falarCom?: (texto: string, o: { velocidade: number; tom: number; locale: string }) => void;
  /** Falar com UMA voz do celular escolhida (para ouvir antes de escolher e para a voz do mascote). */
  falarComVoz?: (texto: string, voz: string) => void;
  /** Cria várias pranchas de uma vez numa aba (pacotes de rotina e "prancha por tema" da IA). Devolve quantas criou. */
  adicionarPranchas?: (nomeAba: string, itens: [string, string][], tema?: string) => number;
  /** Está no Wi-Fi? (para baixar a IA). Sem ela, o app considera que NÃO está. */
  noWifi?: () => Promise<boolean>;
  /** v14.3: IA de verdade (baixar com progresso, ouvir a fala, gerar). Ver INTEGRACAO-V14.md. */
  ia?: HostIA;
  /** v14.3: guardar a chave do ChatGPT dos pais FORA do estado e do backup (ex.: expo-secure-store). */
  segredo?: HostSegredo;
}

export interface CtxBackup {
  copias: CopiaLocal[];
  ultimaEm?: number;
  /** aviso de erro ao gravar (memória cheia) */
  falhou: boolean;
  fazerAgora: () => Promise<boolean>;
  exportar: () => void;
  /** Restaura a partir do texto de um arquivo. Antes, guarda uma cópia do que existe agora (dá para desfazer). */
  /** `deFora` = arquivo recebido ou texto colado (filtro mais rígido); cópias do próprio celular: false */
  restaurarTexto: (texto: string, deFora?: boolean) => Promise<{ ok: true } | { ok: false; erro: ErroBackup | 'voz' | 'memoria' }>;
  /** Desfaz a última restauração (volta ao que existia antes). */
  desfazer?: () => Promise<boolean>;
  temDesfazer: boolean;
}

export interface CtxV14 {
  v14: ConfigV14;
  mudarV14: (c: Partial<ConfigV14>) => void;
  /** a função está valendo agora? (dono deixou + pais ligaram) */
  recurso: (id: IdRecurso) => boolean;
  /** o dono do app deixa usar? */
  dispRecurso: (id: IdRecurso) => Disponibilidade;
  remotos: RegrasRemotas;
  registrarModelo: (rotulo: string) => void;
  registrarV14: (tipo: 'missao' | 'marco' | 'nivel' | 'emergencia', valor: string, rotulo?: string) => void;
  falarMascote: (texto: string) => void;
  /** fala com a voz por idade (velocidade/tom) */
  falarIdade: (texto: string) => void;
  backup: CtxBackup;
  hostV14: HostV14;
}

export function useV14(o: {
  estado: EstadoRotina; pronto: boolean; idioma: Idioma; locale: string; assinante: boolean;
  mudar: (f: (s: EstadoRotina) => EstadoRotina) => void; falar: (t: string) => void;
  recursosFirebase?: unknown; host?: HostV14; compartilhar: (t: string) => void;
}): CtxV14 {
  const { estado, pronto, mudar, falar, idioma, locale } = o;
  const host = o.host || {};
  const v14 = estado.v14 || configV14Padrao();
  const remotos = useMemo(() => lerRecursosFirebase(o.recursosFirebase), [o.recursosFirebase]);
  const recurso = useCallback((id: IdRecurso) => recursoAtivo(id, v14.recursos, remotos, o.assinante === true), [v14.recursos, remotos, o.assinante]);
  const mudarV14 = useCallback((c: Partial<ConfigV14>) => mudar((s) => A.mudarV14(s, c)), [mudar]);
  // v14.3: a IA de verdade (se o app hospedeiro tiver) — confere o que já está baixado no celular
  useEffect(() => { configurarHostIA(host.ia); }, [host.ia]);

  // ---------------------------------------------------------------- voz
  const falarCom = (texto: string, mascote: boolean) => {
    const p = parametrosVoz(v14.voz.idade, v14.voz.velocidade, v14.voz.tom, mascote);
    try { if (host.falarCom) { host.falarCom(texto, { ...p, locale }); return; } } catch { /* cai na fala normal */ }
    falar(texto);
  };
  const falarMascote = (t: string) => {
    // v14.2: sem "voz do mascote" separada — o mascote fala com a mesma voz do app
    // v14.5: e a boquinha do mascote oficial acompanha a fala
    anunciarFala(t, recurso('vozes') ? v14.voz.velocidade : 1);
    falarIdade(t);
  };
  const falarIdade = (t: string) => (recurso('vozes') ? falarCom(t, false) : falar(t));

  // ---------------------------------------------------------------- marcos e nível automático (sem pop-up)
  useEffect(() => {
    if (!pronto) return;
    const s = estado;
    const cfg = s.v14 || configV14Padrao();
    const novos = recursoAtivo('marcos', cfg.recursos, remotos, o.assinante) ? marcosNovos(s.log, cfg.marcos) : [];
    let nivel = cfg.nivel;
    if (recursoAtivo('niveis', cfg.recursos, remotos, o.assinante) && cfg.nivelModo === 'auto') nivel = nivelAutomatico(cfg.nivel, s.log, Date.now(), cfg.idadeAnos);
    if (!novos.length && nivel === cfg.nivel) return;
    mudar((x) => {
      let n = x;
      const agora = Date.now();
      for (const id of novos) n = A.registrarV14(n, 'marco', id, agora);
      if (nivel !== cfg.nivel) n = A.registrarV14(n, 'nivel', String(nivel), agora, 'auto');
      const c = n.v14 || configV14Padrao();
      return A.mudarV14(n, { marcos: { ...c.marcos, ...Object.fromEntries(novos.map((id) => [id, agora])) }, nivel });
    });
  }, [estado.log.length, pronto]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- backup
  const arm = host.armazenamentoBackup || { ler: () => AsyncStorage.getItem(CHAVE_BACKUPS), gravar: (v: string) => AsyncStorage.setItem(CHAVE_BACKUPS, v) };
  const [copias, setCopias] = useState<CopiaLocal[]>([]);
  const [falhou, setFalhou] = useState(false);
  const [antes, setAntes] = useState<string | null>(null);
  // a cópia "antes de restaurar" fica SEMPRE gravada de verdade, numa chave própria (mesmo se o app trocar o armazenamento das cópias)
  const armAntes = { ler: () => AsyncStorage.getItem(CHAVE_ANTES_RESTAURAR), gravar: (v: string) => AsyncStorage.setItem(CHAVE_ANTES_RESTAURAR, v) };
  const copiasRef = useRef<CopiaLocal[]>([]);
  copiasRef.current = copias;
  useEffect(() => {
    arm.ler().then((t) => { if (t) { try { const l = JSON.parse(t); setCopias(guardarCopiaLista(l)); } catch { /* */ } } }).catch(() => undefined);
    armAntes.ler().then((t) => { if (t) setAntes(t); }).catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dadosAgora = () => ({ voz: (() => { try { return host.lerDadosVoz?.() ?? null; } catch { return null; } })(), rotina: estadoRef.current });
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const gravarCopias = async (lista: CopiaLocal[]) => {
    // memória cheia: tenta guardar menos cópias antes de desistir
    for (let n = lista.length; n >= 1; n--) {
      try { await arm.gravar(JSON.stringify(lista.slice(0, n))); setCopias(lista.slice(0, n)); setFalhou(n < lista.length); return true; } catch { /* tenta com menos */ }
    }
    setFalhou(true);
    return false;
  };
  const fazerAgora = async () => {
    const texto = criarBackup(dadosAgora(), Date.now());
    const lista = guardarCopia(copiasRef.current, texto, Date.now(), v14.backupMax);
    if (lista === copiasRef.current || lista[0]?.soma === copiasRef.current[0]?.soma) { setCopias(lista); return true; }
    return gravarCopias(lista);
  };
  // automático: alguns segundos depois de cada mudança (pranchas OU rotina)
  const backupLigado = recurso('backupAuto');
  useEffect(() => {
    if (!pronto || !backupLigado) return;
    const h = setTimeout(() => { fazerAgora().catch(() => undefined); }, 8000);
    return () => clearTimeout(h);
  }, [pronto, backupLigado, host.versaoVoz, estado.tarefas, estado.recompensas, estado.metas, estado.abas, estado.config, estado.v14, Math.floor(estado.log.length / 50)]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportar = () => {
    const texto = criarBackup(dadosAgora(), Date.now());
    const nome = nomeArquivoBackup();
    try { if (host.compartilharArquivo) { host.compartilharArquivo(nome, texto); return; } } catch { /* */ }
    o.compartilhar(texto);
  };
  const aplicar = (dados: { voz: unknown; rotina: unknown }, deFora: boolean): boolean => {
    let okVoz = true;
    if (dados.voz != null && host.restaurarDadosVoz) { try { okVoz = host.restaurarDadosVoz(dados.voz); } catch { okVoz = false; } }
    if (!okVoz) return false;
    // a senha dos pais deste aparelho continua valendo (o arquivo não traz senha)
    const atual = estadoRef.current.v14 || configV14Padrao();
    const nova = A.sanear(dados.rotina, estadoPadrao(idioma));
    // SEGURANÇA: imagens das tarefas vindas de arquivo só podem ser do próprio aparelho
    // (cópias do próprio celular e o Desfazer mantêm as fotos da pasta do app)
    const tarefas = deFora ? nova.tarefas.map((t) => (t.imagemUri && !/^data:image\//.test(t.imagemUri) && !/^https:\/\/static\.arasaac\.org\//.test(t.imagemUri) ? { ...t, imagemUri: undefined } : t)) : nova.tarefas;
    // proteções deste aparelho continuam como estão (um arquivo não desliga a senha nem libera apagar pranchas)
    const rec = { ...(nova.v14?.recursos || {}) };
    for (const k of ['senhaPais', 'apagarPranchas'] as const) { if (typeof atual.recursos[k] === 'boolean') rec[k] = atual.recursos[k]; else delete rec[k]; }
    mudar(() => A.mudarV14({ ...nova, tarefas }, { recursos: rec, senhaHash: atual.senhaHash, senhaSal: atual.senhaSal, senhaErros: atual.senhaErros, senhaResetEm: atual.senhaResetEm }));
    return true;
  };
  const restaurarTexto = async (texto: string, deFora = true): Promise<{ ok: true } | { ok: false; erro: ErroBackup | 'voz' | 'memoria' }> => {
    const l = lerBackup(texto);
    if (!l.ok) return l;
    // guarda o que existe agora FORA do rodízio (o Desfazer não some). Sem memória: não restaura.
    const agoraTxt = criarBackup(dadosAgora(), Date.now());
    try { await armAntes.gravar(agoraTxt); setAntes(agoraTxt); } catch { return { ok: false, erro: 'memoria' }; }
    if (!aplicar(l.dados, deFora)) return { ok: false, erro: 'voz' };
    return { ok: true };
  };
  const desfazer = async () => {
    if (!antes) return false;
    const l = lerBackup(antes);
    if (!l.ok || !aplicar(l.dados, false)) return false;
    setAntes(null); try { await armAntes.gravar(''); } catch { /* */ }
    return true;
  };

  // ---------------------------------------------------------------- eventos
  const registrarModelo = (rotulo: string) => mudar((s) => A.registrarModelo(s, rotulo, Date.now()));
  const registrarV14 = (tipo: 'missao' | 'marco' | 'nivel' | 'emergencia', valor: string, rotulo?: string) => mudar((s) => {
    let n = A.registrarV14(s, tipo, valor, Date.now(), rotulo);
    if (tipo === 'missao') { const c = n.v14 || configV14Padrao(); n = A.mudarV14(n, { missoesFeitas: { ...c.missoesFeitas, [chaveDia(new Date())]: valor } }); }
    if (tipo === 'nivel' && (valor === '1' || valor === '2' || valor === '3')) n = A.mudarV14(n, { nivel: Number(valor) as 1 | 2 | 3 });
    return n;
  });

  return {
    v14, mudarV14, recurso, dispRecurso: (id) => disponibilidade(id, remotos, o.assinante === true), remotos,
    registrarModelo, registrarV14, falarMascote, falarIdade,
    backup: { copias, ultimaEm: copias[0]?.t, falhou, fazerAgora, exportar, restaurarTexto, desfazer, temDesfazer: !!antes },
    hostV14: host,
  };
}

/** Lista guardada pode vir adulterada: confere cada cópia. */
const guardarCopiaLista = (l: unknown): CopiaLocal[] => (Array.isArray(l) ? l : []).filter((c): c is CopiaLocal => {
  if (!c || typeof c !== 'object') return false;
  const x = c as CopiaLocal;
  // ao abrir, só confere o formato (rápido); a conferência completa (SHA-256) acontece na hora de restaurar
  return typeof x.t === 'number' && typeof x.texto === 'string' && typeof x.soma === 'string' && /^[0-9a-f]{64}$/.test(x.soma) && x.texto.length <= 20 * 1024 * 1024 && !!x.resumo && typeof x.resumo === 'object';
}).slice(0, 10);
