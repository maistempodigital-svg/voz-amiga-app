// APP DE TESTE / DEMONSTRAÇÃO
// Simula a tela inicial e os "Ajustes e Opções" do Voz Amiga só para mostrar onde o módulo encaixa.
// No projeto real, o desenvolvedor usa as telas ORIGINAIS do Voz e só adiciona os componentes do módulo.
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { RotinaAmigaProvider, RotinaTelas, TelaRotina, useRotina } from './src/rotina-amiga';
import { abrirLink, Aviso, falarTexto, pararFalaTexto, listarVozes, LOCALE, novoId, ponte as ponteVoz, reduzirImagem, sanearVoz, TelaBloqueio, useVoz, VozProvider } from './demo/voz/base';
import type { HostV14 } from './src/rotina-amiga/v14/estadoV14';
import { VozHome } from './demo/voz/home';
import { hostIA, hostSegredo } from './demo/ia';
import { AjustesVoz, Assinatura, CriarPrancha, Curso, Definicoes, GerirAbas, Pacotes, Sobre, Sugestoes, TelaVoz } from './demo/voz/telas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAVE_ARMAZENAMENTO, lerLimitesFirebase } from './src/rotina-amiga';
import { estadoDemo } from './demo/dados';
import { estadoPadrao, modelosRotina } from './src/rotina-amiga/padroes';
import { AvisoFimTeste, usePremiumDemo } from './demo/premium';
import { ContaProvider, useConta } from './demo/contaUI';
import { BoasVindas, TelaPlanos } from './demo/boasVindas';
import { Modal as ModalRN, View as ViewRN } from 'react-native';
import { lerJanelaSabado } from './src/rotina-amiga/v14/premium';
import { limitesDoFirebase } from './src/rotina-amiga/logica/plano';
import { avisoFimTeste } from './src/rotina-amiga/v14/premium';

// No celular: começa com dados de exemplo (histórico) para dar para ver relatórios e conquistas.
const armazenamentoDemo = {
  // família nova: 1 turno (Manhã) vazio para os pais montarem; o tour de boas-vindas começa sozinho
  ler: async () => {
    const v = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!v) return JSON.stringify({ ...estadoPadrao('pt'), abas: [modelosRotina('pt')[0]], tarefas: [] });
    // a versão 2.0.0 começava com uma "Tarefa de teste": tira de quem já instalou
    try { const e = JSON.parse(v); if (Array.isArray(e?.tarefas) && e.tarefas.some((t: { id?: string }) => t?.id === 'teste1')) { e.tarefas = e.tarefas.filter((t: { id?: string }) => t?.id !== 'teste1'); if (e.tarefaAtiva?.tarefaId === 'teste1') delete e.tarefaAtiva; return JSON.stringify(e); } } catch { /* */ }
    return v;
  },
  gravar: (v: string) => AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, v),
};

const params = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const TELA = params.get('tela') || '';

// APK de teste (WebView): a voz sai pelo TextToSpeech do Android
type Ponte = { AndroidTTS?: { speak: (t: string, l: string) => void }; __rotinaVoltar?: () => boolean };
const ponte = (typeof window !== 'undefined' ? (window as unknown as Ponte) : {}) as Ponte;
const CENARIO = params.get('cenario') || '';

export default function App() {
  React.useEffect(() => { SplashScreen.hideAsync().catch(() => undefined); }, []);
  return (
    <SafeAreaProvider>
      <VozProvider>
        <ContaProvider>
          <ComRotina />
        </ContaProvider>
      </VozProvider>
    </SafeAreaProvider>
  );
}

/** O tour chama isto para trocar entre a tela inicial e os Ajustes do Voz. */
const irParaTour = {
  atual: (_t: 'home' | 'ajustesVoz' | 'criarPrancha' | 'definicoes') => undefined as void,
  planos: () => undefined as void,
  aba: (_id: string) => undefined as void,
};

/** PDF no navegador (no app real: expo-print). */
// web: menu de compartilhar do navegador; se não tiver, WhatsApp (texto curto) ou copia o texto
function compartilharNaWeb(t: string) {
  const n = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: { text: string }) => Promise<void> }) : undefined;
  if (n?.share) { n.share({ text: t }).catch(() => undefined); return; }
  const url = `https://wa.me/?text=${encodeURIComponent(t)}`;
  if (url.length <= 12000) { abrirLink(url); return; }
  try { n?.clipboard?.writeText(t); window.alert?.('Texto do relatório copiado. Cole no WhatsApp.'); } catch { /* */ }
}

function imprimirNoNavegador(html: string) {
  if (typeof document === 'undefined') return;
  const f = document.createElement('iframe');
  // SEGURANÇA: o relatório roda isolado (sem scripts), só pode abrir a janela de impressão
  f.setAttribute('sandbox', 'allow-modals allow-same-origin');
  f.style.position = 'fixed'; f.style.right = '0'; f.style.bottom = '0'; f.style.width = '0'; f.style.height = '0'; f.style.border = '0';
  document.body.appendChild(f);
  const d = f.contentWindow?.document;
  if (!d) return;
  d.open(); d.write(html); d.close();
  setTimeout(() => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { /* */ } setTimeout(() => f.remove(), 60000); }, 300);
}

/** O módulo Rotina recebe o idioma e a voz/volume escolhidos nas Definições do Voz. */
/** Lê um arquivo .json do celular (o seletor de arquivos do Android/navegador). */
const lerArquivoTexto = (): Promise<string | null> => new Promise((res) => {
  if (typeof document === 'undefined') { res(null); return; }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json,text/plain';
  inp.onchange = () => {
    const f = inp.files?.[0];
    if (!f || f.size > 20 * 1024 * 1024) { res(null); return; }
    const r = new FileReader();
    r.onload = () => res(String(r.result)); r.onerror = () => res(null);
    r.readAsText(f);
  };
  inp.click();
});

/** Salva/compartilha o arquivo do backup. No navegador: menu de compartilhar com arquivo, ou baixa o arquivo.
 *  No APK de teste (sem ponte de arquivo): copia o texto e, se for pequeno, abre o menu de compartilhar. */
function compartilharArquivoWeb(nome: string, conteudo: string, avisar: (m: string) => void) {
  const p = ponteVoz() as { compartilhar?: (x: string) => void } | undefined;
  if (p?.compartilhar) {
    try { navigator.clipboard?.writeText(conteudo).catch(() => undefined); } catch { /* */ }
    if (conteudo.length < 400_000) p.compartilhar(conteudo);
    else avisar('Cópia grande: o texto foi copiado. Cole num e-mail para você ou no Drive.');
    return;
  }
  try {
    const blob = new Blob([conteudo], { type: 'application/json' });
    const file = typeof File !== 'undefined' ? new File([blob], nome, { type: 'application/json' }) : undefined;
    const n = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files?: File[]; title?: string }) => Promise<void> };
    if (file && n.canShare?.({ files: [file] }) && n.share) { n.share({ files: [file], title: nome }).catch(() => undefined); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch { avisar('Não deu para salvar o arquivo.'); }
}

/** Recursos do Firebase só para TESTE (?recursos=… na URL). No app real vem do RTDB `limitações/recursos`. */
/** Limites do Firebase só para TESTE (?limites=… na URL). No app real vem do RTDB `limitações/rotina`. */
const LIMITES_TESTE = (() => { try { const r = params.get('limites'); return r ? lerLimitesFirebase(JSON.parse(r)) : undefined; } catch { return undefined; } })();
const RECURSOS_TESTE = (() => { try { const r = params.get('recursos'); return r ? JSON.parse(r) : undefined; } catch { return undefined; } })();

function ComRotina() {
  const { s, mudar, rev, toast } = useVoz();
  // v14: o que o Voz entrega ao módulo (backup, vozes, pranchas por tema)
  const hostV14: HostV14 = {
    lerDadosVoz: () => ({ abas: s.abas, pranchas: s.pranchas, defs: s.defs }),
    versaoVoz: rev,
    restaurarDadosVoz: (d) => { const v = sanearVoz(d); if (!v) return false; mudar(() => ({ ...v, defs: { ...v.defs, assinanteTeste: s.defs.assinanteTeste, testeInicio: s.defs.testeInicio, testeDias: s.defs.testeDias, avisosTeste: s.defs.avisosTeste } })); return true; }, // o teste premium nunca vem do backup
    compartilharArquivo: (nome, conteudo) => compartilharArquivoWeb(nome, conteudo, toast),
    escolherArquivo: lerArquivoTexto,
    listarVozes: () => listarVozes(s.defs.idioma),
    vozAtual: s.defs.voz,
    mudarVoz: (v) => mudar((x) => ({ ...x, defs: { ...x.defs, voz: v } })),
    volume: s.defs.volume,
    mudarVolume: (v) => mudar((x) => ({ ...x, defs: { ...x.defs, volume: Math.max(0, Math.min(100, v)) } })),
    abrirConfigVoz: () => { const p = ponteVoz(); if (p?.abrirConfigVoz) p.abrirConfigVoz(); else toast('Abre as configurações de voz do Android no celular.'); },
    // ouvir/usar UMA voz do celular (funciona também no APK: a ponte aceita o nome da voz)
    falarComVoz: (texto, voz) => falarTexto(texto, { ...s.defs, voz }),
    // velocidade/tom: só no navegador (a casca do APK de teste não tem esse ajuste)
    falarCom: ponteVoz() ? undefined : (texto, o) => {
      try {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) { falarTexto(texto, s.defs); return; }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = LOCALE[s.defs.idioma]; u.rate = o.velocidade; u.pitch = o.tom; u.volume = s.defs.volume / 100;
        const v = window.speechSynthesis.getVoices().find((x) => x.name === s.defs.voz); if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      } catch { falarTexto(texto, s.defs); }
    },
    adicionarPranchas: (nomeAba, itens, tema) => {
      let n = 0;
      mudar((x) => {
        let aba = x.abas.find((a) => a.nome.toLowerCase() === nomeAba.toLowerCase());
        let abas = x.abas;
        if (!aba) { aba = { id: novoId('aba'), nome: nomeAba.slice(0, 40), tema: tema || 'COMUNICACAO' }; abas = [...abas, aba]; }
        const ja = new Set(x.pranchas.filter((q) => q.abaId === aba!.id).map((q) => q.texto.toLowerCase()));
        const novas = itens.filter(([t]) => !ja.has(t.toLowerCase())).slice(0, 40).map(([texto, emoji]) => ({ id: novoId('p'), texto: texto.slice(0, 40), emoji: (emoji || '💬').slice(0, 16), abaId: aba!.id }));
        n = novas.length;
        return { ...x, abas, pranchas: [...x.pranchas, ...novas] };
      });
      return n;
    },
    noWifi: async () => { const c = (navigator as Navigator & { connection?: { type?: string } }).connection; return c?.type === 'wifi'; },
    ia: hostIA,
    segredo: hostSegredo,
  };
  const inicial = React.useMemo(() => estadoDemo(CENARIO), []);
  // v14.8: teste premium grátis (30 dias, sem cartão). No app real o início fica no servidor (users/{uid}.testePremium).
  const pm = usePremiumDemo();
  const conta = useConta();
  const teste = pm.teste, pagou = pm.pago, premium = pm.premium;
  const [avisoTeste, setAvisoTeste] = React.useState<number>();
  // aviso "vai travar" faltando 5, 3 e 1 dia (uma vez cada)
  React.useEffect(() => {
    if (pagou) return;
    const d = avisoFimTeste(teste, s.defs.avisosTeste || []);
    if (d === undefined) return;
    setAvisoTeste(d);
    mudar((x) => ({ ...x, defs: { ...x.defs, avisosTeste: [...(x.defs.avisosTeste || []), d] } }));
  }, [teste.fase, teste.fase === 'ativo' ? teste.diasRestantes : 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const ofertaTeste = { podeOferecer: pm.podeTestar, dias: pm.dias, iniciar: pm.iniciar };
  // depois do login: telas de boas-vindas (como funciona + recomendações + convite do plano). Só uma vez.
  const semFb = !!TELA || params.has('semFirebase');
  const verBoasVindas = TELA === 'boasVindas' ? !s.defs.boasVindasVista : !semFb && !!conta.usuario && !conta.precisaIdioma && !s.defs.boasVindasVista; // ?tela=boasVindas só nos testes
  const primeiraAbertura = !semFb && (conta.precisaIdioma || conta.precisaEntrar || !conta.pronto || verBoasVindas);
  return (
    <RotinaAmigaProvider idioma={params.get('idioma') || s.defs.idioma} estadoInicial={TELA ? inicial : undefined} armazenamento={armazenamentoDemo}
      falar={(t) => falarTexto(t, s.defs)} pararVoz={pararFalaTexto} segurarTour={primeiraAbertura} salvarImagem={(u) => reduzirImagem(u)}
      assinante={premium /* assinante OU teste premium ativo */} limitesFirebase={LIMITES_TESTE ?? limitesDoFirebase(conta.remoto.rotina, conta.remoto.porData, s.defs.inicioUso ?? Date.now())} testePremium={ofertaTeste}
      abrirPlanos={() => irParaTour.planos()}
      abasVoz={s.abas.map((a) => ({ id: a.id, nome: a.nome }))}
      abrirAbaVoz={(id) => irParaTour.aba(id)}
      imprimirHtml={ponte.AndroidTTS ? undefined : imprimirNoNavegador}
      hostV14={hostV14} recursosFirebase={RECURSOS_TESTE ?? conta.remoto.recursos}
      tourIrPara={(t) => irParaTour.atual(t)} abrirLink={(u) => abrirLink(u)} compartilhar={(t) => { const p = ponteVoz() as { compartilhar?: (x: string) => void } | undefined; if (p?.compartilhar) p.compartilhar(t); else compartilharNaWeb(t); }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Raiz />
      <RotinaTelas />
      <Aviso />
      {verBoasVindas ? <BoasVindasNaRotina idioma={s.defs.idioma} pago={pagou} podeTestar={pm.podeTestar} dias={pm.dias} aviso={toast} janela={lerJanelaSabado(conta.remoto.sabado)}
        fim={() => mudar((x) => ({ ...x, defs: { ...x.defs, boasVindasVista: true } }))} testar={() => pm.iniciar()} /> : null}
      {/* o teste grátis acabou: mostra os planos uma vez (com "Continuar no plano gratuito") */}
      {!verBoasVindas && !primeiraAbertura && !pagou && teste.fase === 'acabou' && !s.defs.fimTesteVisto ? (
        <ModalRN visible animationType="none" onRequestClose={() => mudar((x) => ({ ...x, defs: { ...x.defs, fimTesteVisto: true } }))}>
          <ViewRN accessibilityLabel="planos fim do teste" style={{ flex: 1, backgroundColor: '#F4F7FC' }}>
            <TelaPlanos acabou idioma={s.defs.idioma} podeTestar={false} dias={pm.dias} testar={() => undefined} aviso={toast} janela={lerJanelaSabado(conta.remoto.sabado)}
              continuarGratis={() => mudar((x) => ({ ...x, defs: { ...x.defs, fimTesteVisto: true } }))} />
          </ViewRN>
        </ModalRN>
      ) : null}
      {avisoTeste !== undefined ? <AvisoFimTeste dias={avisoTeste} idioma={s.defs.idioma} fechar={() => setAvisoTeste(undefined)} irPlano={() => { setAvisoTeste(undefined); irParaTour.planos(); }} /> : null}
    </RotinaAmigaProvider>
  );
}

/** Boas-vindas dentro da rotina: se escolher "ver planos", o tour não puxa a pessoa de volta (fica para Ajustes › Tour). */
function BoasVindasNaRotina(p: React.ComponentProps<typeof BoasVindas>) {
  const { mudar } = useRotina();
  void mudar;
  return <BoasVindas {...p} />;
}

const MAPA: Record<string, TelaRotina> = {
  ajustes: { nome: 'ajustes' },
  relatorios: { nome: 'ajustes', aba: 'relatorios' },
  opcoes: { nome: 'ajustes', aba: 'opcoes' },
  editar: { nome: 'editarTarefa', tarefaId: 'e1' },
  nova: { nome: 'editarTarefa', abaId: 'manha' },
  abas: { nome: 'gerenciarAbas' },
  loja: { nome: 'loja' },
  gerenciarLoja: { nome: 'gerenciarLoja' },
  editarRecompensa: { nome: 'editarRecompensa', recompensaId: 'r2' },
  metas: { nome: 'metas' },
  gerenciarMetas: { nome: 'gerenciarMetas' },
  conquistas: { nome: 'conquistas' },
  relatorio: { nome: 'relatorio' },
  ajuda: { nome: 'ajuda' },
};


const SUB_AJUSTES: TelaVoz['n'][] = ['criar', 'abas', 'pacotes', 'assinatura', 'sobre', 'definicoes'];

function Raiz() {
  const { abrir, pronto, pedirAdulto, pilha, voltar } = useRotina();
  const { s } = useVoz();
  const inicialVoz: TelaVoz = TELA === 'vozAjustes' ? { n: 'ajustes' } : TELA.startsWith('voz:') ? ({ n: TELA.slice(4) } as TelaVoz) : { n: 'home' };
  const [pilhaVoz, setPilhaVoz] = useState<TelaVoz[]>([inicialVoz]);
  const [bloqueio, setBloqueio] = useState<null | 'voltou' | 'sair'>(null);
  const [abaVoz, setAbaVoz] = useState<string>();
  const { registrarSinal } = useRotina();
  const tela = pilhaVoz[pilhaVoz.length - 1];
  const nav = {
    ir: (t: TelaVoz) => setPilhaVoz((p) => [...p, t]),
    voltar: () => setPilhaVoz((p) => (p.length > 1 ? p.slice(0, -1) : [{ n: 'home' }])),
    casa: () => setPilhaVoz([{ n: 'home' }]),
  };
  irParaTour.planos = () => setPilhaVoz([{ n: 'ajustes' }, { n: 'assinatura' } as TelaVoz]);
  irParaTour.aba = (id) => { setAbaVoz(id); setPilhaVoz([{ n: 'home' }]); };
  irParaTour.atual = (t) => setPilhaVoz(t === 'home' ? [{ n: 'home' }] : t === 'ajustesVoz' ? [{ n: 'ajustes' }] : t === 'criarPrancha' ? [{ n: 'ajustes' }, { n: 'criar' } as TelaVoz] : [{ n: 'ajustes' }, { n: 'definicoes' } as TelaVoz]);
  const refs = useRef({ pilha, tela, s, bloqueio });
  refs.current = { pilha, tela, s, bloqueio };
  // botão "voltar" do Android (APK de teste)
  ponte.__rotinaVoltar = () => {
    const r = refs.current;
    if (r.bloqueio) return true;
    if (r.pilha.length) { voltar(); return true; }
    if (r.tela.n !== 'home') { nav.voltar(); return true; }
    if (r.s.defs.bloquearApp) { registrarSinal('tentou_sair'); setBloqueio('sair'); return true; }
    return false;
  };
  // "Bloquear App": pede a conta ao voltar depois de minimizar
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const f = () => { if (document.visibilityState === 'visible' && refs.current.s.defs.bloquearApp) setBloqueio('voltou'); };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  useEffect(() => {
    if (!pronto) return;
    if (MAPA[TELA]) abrir(MAPA[TELA]);
    if (TELA === 'maisFuncoes') abrir({ nome: 'maisFuncoes' });
    if (TELA.startsWith('v14:')) abrir({ nome: 'v14', tela: TELA.slice(4) as never });
    if (TELA === 'portao') pedirAdulto(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);
  const corpo = (() => {
    switch (tela.n) {
      case 'ajustes': return <AjustesVoz {...nav} />;
      case 'criar': return <CriarPrancha {...nav} id={tela.id} abaId={tela.abaId} foto={tela.foto} />;
      case 'abas': return <GerirAbas {...nav} />;
      case 'pacotes': return <Pacotes {...nav} />;
      case 'assinatura': return <Assinatura {...nav} />;
      case 'sobre': return <Sobre {...nav} />;
      case 'curso': return <Curso {...nav} />;
      case 'definicoes': return <Definicoes {...nav} />;
      case 'sugestoes': return <Sugestoes {...nav} />;
      default: return <VozHome key={abaVoz || 'home'} ir={nav.ir} abaInicial={abaVoz} />;
    }
  })();
  void SUB_AJUSTES;
  return (
    <>
      {corpo}
      {bloqueio ? <TelaBloqueio aoLiberar={() => { const b = bloqueio; setBloqueio(null); if (b === 'sair') ponteVoz()?.sair?.(); }} /> : null}
    </>
  );
}
