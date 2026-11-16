// Estado do Rotina Amiga dentro do Voz Amiga.
// <RotinaAmigaProvider> envolve o app do Voz; useRotina() dá acesso a tudo.
import { sugerir, Sugestoes } from './logica/sugestoes';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { AppState, Linking, Share, Vibration } from 'react-native';
import * as A from './logica/acoes';
import { alarmesAgora, podeTerminar } from './logica/rotina';
import { chaveDia } from './logica/tempo';
import { estadoPadrao } from './padroes';
import { ChaveTexto, criarT, LOCALE_VOZ, normalizarIdioma } from './textos';
import { EstadoRotina, Idioma, TelaRotina } from './tipos';
import { LimitesRotina, limitesEfetivos, Recurso, linkSeguro } from './logica/plano';
import { TelaHost, TelaModulo, TourProvider } from './tour';
import { CtxV14, HostV14, useV14 } from './v14/estadoV14';

export const CHAVE_ARMAZENAMENTO = '@voz-amiga/rotina-amiga-v1';

export interface Armazenamento {
  ler: () => Promise<string | null>;
  gravar: (valor: string) => Promise<void>;
}

const armazenamentoPadrao: Armazenamento = {
  ler: () => AsyncStorage.getItem(CHAVE_ARMAZENAMENTO),
  gravar: (v) => AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, v),
};

export interface Celebracao {
  id: number;
  titulo: string;
  estrelas: number;
  emoji?: string;
}

interface PedidoAdulto {
  titulo?: string;
  aoLiberar: () => void;
}

export interface ContextoRotina extends CtxV14 {
  pronto: boolean;
  estado: EstadoRotina;
  idioma: Idioma;
  t: (k: ChaveTexto) => string;
  agora: number;
  falar: (texto: string) => void;
  /** Tempo (ms) de segurar nas áreas de adulto — vem das Opções (padrão 3 s). */
  msAdulto: number;
  /** Muda o tempo de segurar das áreas de adulto (em segundos, 2–10). */
  mudarMsAdulto: (seg: number) => void;
  /** Sugestões inteligentes para o modo frase: próximas palavras + frases completas (aprende com o que a criança fala). */
  sugerirFrase: (frase: string[], vocab: string[]) => Sugestoes;
  /** Abre um link (WhatsApp, e-mail…). */
  abrirLink: (url: string) => void;
  /** Compartilhar texto (menu do Android). */
  compartilhar: (texto: string) => void;
  /** Guarda a foto escolhida pelos pais e devolve o endereço final. */
  salvarImagem: (uri: string) => Promise<string>;
  /** Atualiza o estado com uma função pura (usado pelas telas). */
  mudar: (f: (s: EstadoRotina) => EstadoRotina) => void;

  // ---- Integração com o Voz Amiga ----
  /** Chame no botão FALAR, com as palavras da frase. Retorna as estrelas ganhas (0 se não valeu).
   *  Opcional: ms = tempo montando a frase; sug = quantas palavras vieram das sugestões (relatório). */
  registrarFala: (palavras: string[], extra?: { ms?: number; sug?: number }) => number;
  /** Chame quando a criança toca numa prancha (só para o relatório). `aba` = nome da aba do Voz (ex.: "Expressão social"). */
  registrarPrancha: (rotulo: string, aba?: string) => void;
  /** Chame quando a criança montou palavras no modo frase e saiu/limpou SEM falar. */
  registrarFraseIncompleta: (palavras: string[]) => void;
  /** Uso do teclado do app (o TecladoAmigo já chama sozinho). */
  registrarTeclado: (d: { letras: number; apagadas: number; palavras?: string[] }) => void;
  /** "Como estou?" (o BotaoComoEstou já chama sozinho). */
  registrarSentimento: (valor: string) => void;
  /** Sinal automático, ex.: registrarSinal('tentou_sair') quando a criança tenta sair do app travado. */
  registrarSinal: (valor: string, rotulo?: string) => void;
  registrarCrise: (d: A.DadosCrise) => void;

  // ---- Plano (gratuito x completo) ----
  /** true = assinante (Mensal, Semestral, Anual, Vitalício) — vem do app (hasAccess do Firebase). */
  assinante: boolean;
  limites: LimitesRotina;
  /** Pode usar o recurso agora? (`abaId` para tarefas). */
  pode: (r: Recurso, abaId?: string) => boolean;
  /** Executa se puder; senão mostra o aviso do Plano Completo (com o botão "Ver planos"). */
  exigir: (r: Recurso, fn: () => void, abaId?: string) => void;
  /** v14.7: mostra o aviso amigável do Plano Completo (o app hospedeiro chama ao bater um limite dele, ex.: pranchas) */
  pedirPlano: (r: Recurso) => void;
  pedidoPlano?: Recurso;
  responderPlano: (verPlanos: boolean) => void;
  /** v14.8: teste premium grátis (sem cartão). undefined = o app não oferece teste. */
  testePremium?: TesteOferta;
  /** Abas de pranchas do Voz (para ligar uma tarefa a uma aba). */
  abasVoz: { id: string; nome: string }[];
  /** PDF: usa a função do app (ex.: expo-print). Sem ela, compartilha o texto. */
  imprimir: (html: string, textoAlternativo: string) => void;
  mostrarAviso: (texto: string) => void;
  /** O que o app passou para o módulo (tela de conferência do desenvolvedor). */
  ligacoes: Record<string, boolean | string>;

  // ---- Criança ----
  iniciar: (abaId: string, tarefaId: string) => void;
  terminar: () => void;
  // ---- Adulto ----
  liberarComEstrela: () => void;
  pularTarefa: () => void;
  cancelarTarefa: () => void;
  pedirAdulto: (aoLiberar: () => void, titulo?: string) => void;

  // ---- Navegação das telas do Rotina (abre por cima do Voz, em tela cheia) ----
  pilha: TelaRotina[];
  abrir: (tela: TelaRotina) => void;
  voltar: () => void;
  fecharTudo: () => void;

  celebracao?: Celebracao;
  /** v11: sem pop-up. Estrelas ganhas há pouco (aparece pequenininho no botão PRÊMIOS por alguns segundos). */
  ganhoRecente: number;
  celebrar: (c: Omit<Celebracao, 'id'>) => void;
  limparCelebracao: () => void;
  pedidoAdulto?: PedidoAdulto;
  responderAdulto: (ok: boolean) => void;
  aviso?: string;
}

const Ctx = createContext<ContextoRotina | null>(null);

export const useRotina = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRotina precisa estar dentro de <RotinaAmigaProvider>');
  return c;
};

export interface PropsProvider {
  children?: React.ReactNode;
  /** Idioma atual do Voz Amiga ('pt', 'en', 'es' ou 'pt-BR' etc.). */
  idioma?: string;
  /** Use a função de fala do Voz Amiga (mesma voz e volume escolhidos nas Definições). */
  falar?: (texto: string, locale: string) => void;
  /** Troque se quiser guardar em outro lugar. Padrão: AsyncStorage (já existe no Voz). */
  armazenamento?: Armazenamento;
  /** Opcional: para enviar eventos ao seu analytics. */
  aoRegistrarEvento?: (tipo: string, dados: Record<string, unknown>) => void;
  /** Opcional: copiar a foto para a pasta do app (ex.: com expo-file-system, como o Voz faz nas pranchas). */
  salvarImagem?: (uri: string) => Promise<string>;
  /** Opcional: troque como abre links/compartilha (padrão: Linking e Share do React Native). */
  abrirLink?: (url: string) => void;
  compartilhar?: (texto: string) => void;
  /** Tour do aplicativo: abre as telas do Voz — 'home', 'ajustesVoz' ("Ajustes e Opções"), 'criarPrancha' e 'definicoes'. */
  tourIrPara?: (tela: TelaHost) => void;
  /** Só para testes/demonstração. */
  estadoInicial?: EstadoRotina;

  // ---- Ligação com o plano do Voz (Google Play + Firebase) ----
  /** true quando o usuário tem acesso pago — use o MESMO valor que o Voz já usa (users/{uid}.hasAccess no Firestore). */
  assinante?: boolean;
  /** Limites da versão gratuita lidos do Firebase (Realtime Database: limitações/rotina). Use lerLimitesFirebase(). */
  limitesFirebase?: Partial<LimitesRotina>;
  /** Abre a tela de planos que o Voz já tem (Mensal, Vitalício…). */
  abrirPlanos?: () => void;
  /** v14.8: teste premium grátis de N dias, sem cartão. O app (host) guarda o início no servidor e passa aqui. */
  testePremium?: TesteOferta;
  /** Abas de pranchas do Voz e como abrir uma delas (tarefa "Lanche" pode abrir a aba "Comida"). */
  abasVoz?: { id: string; nome: string }[];
  abrirAbaVoz?: (id: string) => void;
  /** Opcional: gerar PDF (ex.: expo-print → Print.printToFileAsync({ html }) + Sharing). */
  imprimirHtml?: (html: string) => void;

  // ---- v14 ----
  /** Firebase (RTDB `limitações/recursos`): o dono libera/bloqueia cada função nova e diz se é do Plano Completo. Sem isso, tudo liberado. */
  recursosFirebase?: unknown;
  /** O que o Voz entrega para o backup, as vozes e a IA (ver v14/estadoV14.ts). */
  hostV14?: HostV14;
  /** Abre o curso dos pais no fim do tour (o módulo já sabe abrir; passe false para esconder). */
  linkCursoNoTour?: boolean;
}

/** v14.8: oferta do teste premium (o host decide se ainda pode oferecer). */
export interface TesteOferta { podeOferecer: boolean; dias: number; iniciar: () => void }

export function RotinaAmigaProvider({ children, idioma: idiomaVoz, falar: falarVoz, armazenamento = armazenamentoPadrao, aoRegistrarEvento, salvarImagem, estadoInicial, abrirLink, compartilhar, tourIrPara, assinante = false, limitesFirebase, abrirPlanos, testePremium, abasVoz = [], abrirAbaVoz, imprimirHtml, recursosFirebase, hostV14, linkCursoNoTour = true }: PropsProvider) {
  const idioma = normalizarIdioma(idiomaVoz);
  const t = useMemo(() => criarT(idioma), [idioma]);
  const [estado, setEstado] = useState<EstadoRotina>(() => estadoInicial || estadoPadrao(idioma));
  const ref = useRef(estado);
  ref.current = estado;
  const [pronto, setPronto] = useState(!!estadoInicial);
  const [agora, setAgora] = useState(Date.now());
  const [pilha, setPilha] = useState<TelaRotina[]>([]);
  const [celebracao, setCelebracao] = useState<Celebracao>();
  const [ganhoRecente, setGanhoRecente] = useState(0);
  const ganhoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pedidoAdulto, setPedidoAdulto] = useState<PedidoAdulto>();
  const [aviso, setAviso] = useState<string>();
  const [pedidoPlano, setPedidoPlano] = useState<Recurso>();
  const limites = useMemo(() => limitesEfetivos(assinante, limitesFirebase), [assinante, limitesFirebase]);
  const alarmesTocados = useRef<Set<string>>(new Set());
  const seq = useRef(1);

  // Carregar
  useEffect(() => {
    if (estadoInicial) return;
    let vivo = true;
    armazenamento.ler().then((txt) => {
      if (!vivo) return;
      if (txt) {
        // sanear aguenta itens corrompidos (descarta só o item ruim); só um texto que nem é JSON cai no padrão
        try { setEstado(A.sanear(JSON.parse(txt), estadoPadrao(idioma))); } catch { /* texto ilegível: começa do padrão */ }
      }
      setPronto(true);
    }).catch(() => setPronto(true));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salvar (com atraso curto para não gravar a cada toque)
  useEffect(() => {
    if (!pronto) return;
    const h = setTimeout(() => { armazenamento.gravar(JSON.stringify(estado)).catch(() => undefined); }, 400);
    return () => clearTimeout(h);
  }, [estado, pronto, armazenamento]);

  const mudar = useCallback((f: (s: EstadoRotina) => EstadoRotina) => {
    const n = f(ref.current);
    ref.current = n;
    setEstado(n);
  }, []);

  const falar = useCallback((texto: string) => {
    if (!texto) return;
    const loc = LOCALE_VOZ[idioma];
    try {
      if (falarVoz) falarVoz(texto, loc);
      else { Speech.stop(); Speech.speak(texto, { language: loc }); }
    } catch { /* sem voz disponível */ }
  }, [falarVoz, idioma]);

  const evento = useCallback((tipo: string, dados: Record<string, unknown>) => {
    try { aoRegistrarEvento?.(tipo, dados); } catch { /* ignora */ }
  }, [aoRegistrarEvento]);

  // v11: NADA de pop-up na tela da criança. O ganho aparece discretamente no selo do botão PRÊMIOS ("+2") e some.
  const celebrar = useCallback((c: Omit<Celebracao, 'id'>) => {
    if (c.estrelas <= 0) return;
    setGanhoRecente((n) => n + c.estrelas);
    if (ganhoTimer.current) clearTimeout(ganhoTimer.current);
    ganhoTimer.current = setTimeout(() => setGanhoRecente(0), 6000);
  }, []);

  const concluir = useCallback((darEstrela: boolean, quem: 'crianca' | 'adulto' = 'crianca') => {
    const s = ref.current;
    if (!s.tarefaAtiva) return;
    const tarefa = s.tarefas.find((x) => x.id === s.tarefaAtiva!.tarefaId);
    const r = A.concluirTarefa(s, Date.now(), darEstrela, quem);
    mudar(() => r.estado);
    evento(darEstrela ? 'rotina_tarefa_concluida' : 'rotina_tarefa_liberada', { tarefaId: tarefa?.id, icone: tarefa?.icone }); // sem texto digitado pelos pais no analytics
    if (darEstrela) {
      if (!s.config.sonsSuaves) Vibration.vibrate(60);
      celebrar({ titulo: r.rotinaCompleta ? t('routineDoneShort') : t('wellDone'), estrelas: r.estrelas, emoji: r.rotinaCompleta ? '🏆' : undefined });
      falar(r.rotinaCompleta ? t('routineDoneShort') : t('wellDone'));
    }
  }, [celebrar, evento, falar, mudar, t]);

  // Tempo de uso: só conta enquanto o app está ABERTO na tela (não conta em segundo plano / tela apagada).
  useEffect(() => {
    if (!pronto) return;
    let desde: number | null = AppState.currentState === 'active' || AppState.currentState == null ? Date.now() : null;
    const gravar = () => { if (desde != null) { const agoraMs = Date.now(); const ini = desde; desde = agoraMs; if (agoraMs - ini >= 1000) mudar((s) => A.somarUso(s, ini, agoraMs)); } };
    const h = setInterval(gravar, 30000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { if (desde == null) desde = Date.now(); }
      else { gravar(); desde = null; }
    });
    return () => { gravar(); clearInterval(h); sub.remove(); };
  }, [pronto, mudar]);

  // Relógio: 1 s com tarefa em andamento ou espera ativa; 15 s no resto.
  const rapido = !!estado.tarefaAtiva || !!estado.esperaAtiva;
  useEffect(() => {
    const h = setInterval(() => setAgora(Date.now()), rapido ? 1000 : 15000);
    return () => clearInterval(h);
  }, [rapido]);

  // Fim do temporizador => conclui sozinho (a criança não precisa de nada)
  useEffect(() => {
    const a = estado.tarefaAtiva;
    if (a && a.duracaoSeg > 0 && podeTerminar(estado, agora)) concluir(true);
  }, [agora, estado, concluir]);

  // Alarme dentro do app (no horário da tarefa)
  useEffect(() => {
    const d = new Date(agora);
    for (const tarefa of alarmesAgora(estado, d)) {
      const k = `${chaveDia(d)}:${tarefa.id}`;
      if (alarmesTocados.current.has(k)) continue;
      alarmesTocados.current.add(k);
      if (!estado.config.sonsSuaves) Vibration.vibrate([0, 300, 150, 300]);
      falar(tarefa.titulo);
      setAviso(`⏰ ${tarefa.horario} · ${tarefa.titulo}`);
      setTimeout(() => setAviso(undefined), 8000);
    }
  }, [agora, estado, falar]);

  const pedirAdulto = useCallback((aoLiberar: () => void, titulo?: string) => {
    setPedidoAdulto({ aoLiberar, titulo });
  }, []);

  const responderAdulto = useCallback((ok: boolean) => {
    const p = pedidoAdulto;
    setPedidoAdulto(undefined);
    if (ok && p) setTimeout(p.aoLiberar, 50);
  }, [pedidoAdulto]);

  const pode = (r: Recurso, abaId?: string) => {
    const s = ref.current;
    switch (r) {
      case 'rotina': return s.abas.length < limites.rotinas;
      case 'tarefa': return s.tarefas.filter((x) => !abaId || x.abaId === abaId).length < limites.tarefasPorRotina;
      case 'premio': return s.recompensas.length < limites.premios;
      case 'temporizador': return limites.temporizador;
      case 'horario': return limites.horario;
      case 'metas': return limites.metas;
      case 'relatorio': return limites.relatorioCompleto;
      case 'frases': return limites.frasesPersonalizadas;
      case 'foto': return limites.fotos === true;
      // as pranchas, pacotes e vozes gravadas são do app hospedeiro: ele confere com limites.* e chama pedirPlano
      default: return true;
    }
  };
  const mostrarAviso = (texto: string) => { setAviso(texto); setTimeout(() => setAviso(undefined), 3500); };

  const compartilharSeguro = (texto: string) => { try { if (compartilhar) compartilhar(texto); else Share.share({ message: texto }).catch(() => undefined); } catch { /* */ } };
  const parteV14 = useV14({ estado, pronto, idioma, locale: LOCALE_VOZ[idioma], assinante: assinante === true, mudar, falar, recursosFirebase, host: hostV14, compartilhar: compartilharSeguro });

  const valor: ContextoRotina = {
    ...parteV14,
    pronto,
    estado,
    idioma,
    t,
    agora,
    falar,
    msAdulto: Math.max(2, Math.min(10, estado.config.segurarAdultoSeg ?? 3)) * 1000,
    sugerirFrase: (frase, vocab) => sugerir({ frase, vocab, idioma, hora: new Date(agora).getHours(), historico: estado.log.filter((e) => e.tipo === 'frase' && e.palavras?.length).slice(-300).map((e) => e.palavras as string[]) }),
    mudarMsAdulto: (seg) => mudar((s) => ({ ...s, config: { ...s.config, segurarAdultoSeg: Math.max(2, Math.min(10, Math.round(seg))) } })),
    abrirLink: (url) => { const u = linkSeguro(url); if (!u) return; try { if (abrirLink) abrirLink(u); else Linking.openURL(u).catch(() => undefined); } catch { /* */ } },
    compartilhar: compartilharSeguro,
    salvarImagem: async (uri) => { try { return salvarImagem ? await salvarImagem(uri) : uri; } catch { return uri; } },
    mudar,
    registrarFala: (palavras, extra) => {
      const r = A.registrarFala(ref.current, palavras, Date.now(), extra);
      mudar(() => r.estado);
      evento('voz_frase', { palavras: palavras.length, estrelas: r.estrelas });
      if (r.estrelas > 0) celebrar({ titulo: t('wellDone'), estrelas: r.estrelas, emoji: '🗣️' });
      return r.estrelas;
    },
    registrarPrancha: (rotulo, aba) => mudar((s) => A.registrarPrancha(s, rotulo, Date.now(), aba)),
    registrarFraseIncompleta: (palavras) => mudar((s) => A.registrarFraseIncompleta(s, palavras, Date.now())),
    registrarTeclado: (d) => mudar((s) => A.registrarTeclado(s, d, Date.now())),
    registrarSentimento: (v) => mudar((s) => A.registrarSentimento(s, v, Date.now())),
    registrarSinal: (v, rotulo) => mudar((s) => A.registrarSinal(s, v, Date.now(), rotulo)),
    registrarCrise: (d) => mudar((s) => A.registrarCrise(s, d)),
    assinante: assinante === true,
    limites,
    pode,
    exigir: (r, fn, abaId) => { if (pode(r, abaId)) fn(); else setPedidoPlano(r); },
    pedirPlano: (r) => setPedidoPlano(r),
    pedidoPlano,
    testePremium,
    responderPlano: (ver) => { setPedidoPlano(undefined); if (ver) { setPilha([]); setTimeout(() => { try { abrirPlanos?.(); } catch { /* */ } }, 80); } },
    abasVoz,
    imprimir: (html, alt) => { try { if (imprimirHtml) imprimirHtml(html); else if (compartilhar) compartilhar(alt); else Share.share({ message: alt }).catch(() => undefined); } catch { /* */ } },
    mostrarAviso,
    ligacoes: {
      idioma: idioma, falar: !!falarVoz, assinante, limitesFirebase: !!limitesFirebase, abrirPlanos: !!abrirPlanos,
      tourIrPara: !!tourIrPara, abasVoz: abasVoz.length ? `${abasVoz.length}` : false, abrirAbaVoz: !!abrirAbaVoz,
      imprimirHtml: !!imprimirHtml, salvarImagem: !!salvarImagem, armazenamento: armazenamento === armazenamentoPadrao ? 'AsyncStorage' : 'próprio',
    },
    iniciar: (abaId, tarefaId) => {
      const tarefa = ref.current.tarefas.find((x) => x.id === tarefaId);
      mudar((s) => A.iniciarTarefa(s, abaId, tarefaId, Date.now()));
      if (tarefa && ref.current.config.falarTarefa) falar(tarefa.titulo);
      if (tarefa?.abaVozId && abrirAbaVoz) { try { abrirAbaVoz(tarefa.abaVozId); } catch { /* */ } }
    },
    terminar: () => { if (podeTerminar(ref.current, Date.now())) concluir(true); },
    liberarComEstrela: () => concluir(true, 'adulto'),
    pularTarefa: () => concluir(false, 'adulto'),
    cancelarTarefa: () => mudar((s) => A.cancelarTarefa(s, Date.now())),
    pedirAdulto,
    pilha,
    abrir: (tela) => setPilha((p) => [...p, tela]),
    voltar: () => setPilha((p) => p.slice(0, -1)),
    fecharTudo: () => setPilha([]),
    celebracao,
    ganhoRecente,
    celebrar,
    limparCelebracao: () => setCelebracao(undefined),
    pedidoAdulto,
    responderAdulto,
    aviso,
  };

  const TELA_TOUR: Record<TelaModulo, TelaRotina[]> = {
    rotinaAjustes: [{ nome: 'ajustes' }],
    rotinaOpcoes: [{ nome: 'ajustes', aba: 'opcoes' }],
    editarTarefa: [{ nome: 'ajustes' }, { nome: 'editarTarefa', abaId: estado.abas[0]?.id }],
    premios: [{ nome: 'loja' }],
    relatorio: [{ nome: 'relatorio' }],
    frasesProntas: [{ nome: 'frasesProntas' }],
    conquistas: [{ nome: 'v14', tela: 'conquistas' }],
  };
  const pararFala = () => { try { if (falarVoz) falarVoz(' ', LOCALE_VOZ[idioma]); else Speech.stop(); } catch { /* */ } };
  return (
    <Ctx.Provider value={valor}>
      <TourProvider irPara={tourIrPara} abrirModulo={(tl) => setPilha(TELA_TOUR[tl])} fecharModulo={() => setPilha([])} idioma={idioma} falar={falar} pararFala={pararFala}
        jaVisto={!pronto || !!estado.config.tourVisto} marcarVisto={() => mudar((s) => A.mudarConfig(s, { tourVisto: true }))}
        falarMascote={parteV14.falarMascote} calmo={parteV14.recurso('telaCalma')}
        abrirCurso={linkCursoNoTour && parteV14.recurso('curso') ? () => setPilha([{ nome: 'v14', tela: 'curso' }]) : undefined}>
        {children}
      </TourProvider>
    </Ctx.Provider>
  );
}
