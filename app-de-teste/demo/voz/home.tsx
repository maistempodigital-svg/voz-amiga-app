// SIMULAÇÃO da tela inicial do Voz Amiga, com o módulo Rotina encaixado.
// v8: TUDO no menu de cima (linha 1: funções; linha 2: abas + Como estou?). Embaixo só a próxima etapa da rotina (ou o anúncio).
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlvoTour, AnuncioProtegido, BarraSugestoesFrase, formularFrase, useTour, BotaoMenuVoz, PalavrasColoridas, ProximoPasso, Segurar, TecladoAmigo, useItensMenuRotina, useRotina } from '../../src/rotina-amiga';
import { abrirLink, BotaoCor, PranchaVoz, ponte, tema, useVoz } from './base';
import { useConta } from '../contaUI';
import { lerAnuncios } from '../conta';
import { NovaAbaModal, TelaVoz } from './telas';
import { maxPalavras, pranchasVisiveis, somarPalavra, VISUAIS } from '../../src/rotina-amiga/v14/crescer';
import { pranchasQueFicam } from '../../src/rotina-amiga/v14/premium';
import { contarParaLimite, veioProntaV24 } from '../migracaoV24';
import { pacoteDaTarefa } from '../../src/rotina-amiga/v14/pacotes';

const FRASES_SOS = {
  dor: { pt: 'Estou com dor', en: 'I am in pain', es: 'Me duele', e: '🤕' },
  ajuda: { pt: 'Preciso de ajuda', en: 'I need help', es: 'Necesito ayuda', e: '🆘' },
  banheiro: { pt: 'Preciso ir ao banheiro', en: 'I need the bathroom', es: 'Necesito ir al baño', e: '🚽' },
} as const;

/** v14: fundo animado (bolinhas bem devagar, nas cores da marca). Vem desligado. */
function FundoAnimado() {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: false })); a.start(); return () => a.stop(); }, [v]);
  const cores = ['#FDE68A', '#FBCFE8', '#BFDBFE', '#BBF7D0'];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
      {cores.map((c, i) => (
        <Animated.View key={c} style={{ position: 'absolute', left: `${10 + i * 22}%`, width: 90, height: 90, borderRadius: 45, backgroundColor: c, opacity: 0.35,
          top: v.interpolate({ inputRange: [0, 1], outputRange: [`${90 - i * 7}%`, `${-20 + i * 5}%`] }) }} />
      ))}
    </View>
  );
}

const ALT = 56;
const GAP = 7;

/** Todos os quadradinhos têm o MESMO tamanho (largura calculada pela tela). */
/** Selinho piscando "COMECE POR AQUI" (até a família criar a 1ª prancha). */
function ComecePorAqui() {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: false }), Animated.timing(v, { toValue: 0, duration: 600, useNativeDriver: false })])); a.start(); return () => a.stop(); }, [v]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -6, right: -6, top: -11, alignItems: 'center', zIndex: 5 }}>
      <Animated.View accessibilityLabel="comece por aqui" style={{ backgroundColor: '#F97316', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: '#FFFFFF', transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '900', fontSize: 8.5 }}>COMECE AQUI</Text>
      </Animated.View>
    </View>
  );
}

function Tile({ n, i, c, b, borda, ativo, onPress, segurar, aoTocarCurto, ms = 3000, lapis, tour, largura, ultimo, comecePorAqui }: {
  n: string; i: string; c: string; b: string; borda?: string; ativo?: boolean; onPress?: () => void; segurar?: () => void; aoTocarCurto?: () => void; ms?: number; lapis?: boolean; tour?: string; largura: number; ultimo?: boolean; comecePorAqui?: boolean;
}) {
  const estilo = { width: largura, height: ALT, borderRadius: 10, borderWidth: ativo ? 1.6 : 1.2, borderColor: borda || c, backgroundColor: ativo ? c : b };
  const cor = ativo ? '#FFFFFF' : c;
  // letra do tamanho certo para a maior palavra caber inteira (nunca quebra "DESCRIÇÃO" no meio)
  const maiorPalavra = Math.max(...n.split(/\s+/).map((w) => w.length), 1);
  const fs = Math.max(6, Math.min(10.5, (largura - 10) / (maiorPalavra * 0.78)));
  const miolo = (
    <>
      <Feather name={i as never} size={15} color={cor} />
      <Text numberOfLines={2} style={{ fontSize: fs, lineHeight: Math.round(fs * 1.18), fontWeight: '900', color: cor, marginTop: 4, textAlign: 'center', paddingHorizontal: 2 }}>{n}</Text>
      {lapis ? <View style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#7E22CE', alignItems: 'center', justifyContent: 'center' }}><Feather name="edit-2" size={8} color="#fff" /></View> : null}
    </>
  );
  const botao = segurar
    ? <Segurar ms={ms} aoCompletar={segurar} aoTocar={aoTocarCurto} rotulo={n} style={[estilo, comecePorAqui ? { borderWidth: 3, borderColor: '#F97316' } : null]} corFaixa="rgba(37,99,235,0.25)">{miolo}</Segurar>
    : <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={n} style={({ pressed }) => [estilo, { alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 }]}>{miolo}</Pressable>;
  return (
    <View style={{ marginRight: ultimo ? 0 : GAP }}>
      {tour ? <AlvoTour id={tour}>{botao}</AlvoTour> : botao}
      {comecePorAqui ? <ComecePorAqui /> : null}
    </View>
  );
}

/** Prancha com resposta rápida ao toque (pula de leve). Tela calma: cores suaves, sem movimento. */
function CartaoPrancha({ p, t, lado, raio, calma, estilo, destaque, vis, modo, aoTocar }: {
  p: { id: string; texto: string; emoji?: string; imagem?: string; audio?: string }; t: { borda: string; claro: string }; lado: number; raio: number; calma: boolean; estilo: string; destaque: boolean;
  vis: { emojiGrande: boolean; letraMaiuscula: boolean }; modo: string; aoTocar: (msSegurado: number) => void;
}) {
  const esc = React.useRef(new Animated.Value(1)).current;
  const ini = React.useRef(0);
  const borda = estilo === 'borda';
  const corBorda = destaque ? '#F59E0B' : calma ? `${t.borda}80` : t.borda;
  const fundo = calma ? '#FFFFFF' : borda ? '#FFFFFF' : t.claro;
  return (
    <Pressable
      onPressIn={() => { ini.current = Date.now(); if (!calma) Animated.spring(esc, { toValue: 0.9, useNativeDriver: false, speed: 40, bounciness: 0 }).start(); }}
      onPressOut={() => { if (!calma) Animated.spring(esc, { toValue: 1, useNativeDriver: false, speed: 18, bounciness: 14 }).start(); }}
      onPress={() => aoTocar(Date.now() - ini.current)} accessibilityRole="button" accessibilityLabel={p.texto.toUpperCase()}>
      <Animated.View style={{ width: lado, height: lado, borderRadius: estilo === 'quadrado' ? 4 : raio, borderWidth: destaque ? 5 : calma ? 1.5 : borda ? 4 : 2.5, borderBottomWidth: destaque ? 5 : calma ? 1.5 : borda ? 4 : 5, borderColor: corBorda, backgroundColor: fundo, alignItems: 'center', justifyContent: 'center', margin: 4, overflow: 'hidden', transform: [{ scale: destaque && !calma ? 1.06 : esc }] }}>
        {calma ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: `${t.borda}66` }} /> : null}
        {p.imagem ? <Image source={{ uri: p.imagem }} style={{ width: lado * 0.6, height: lado * 0.55, opacity: calma ? 0.9 : 1 }} resizeMode="contain" /> : <Text style={{ fontSize: lado * (calma ? 0.26 : vis.emojiGrande ? 0.34 : 0.28) }}>{p.emoji || '💬'}</Text>}
        <Text numberOfLines={2} style={{ fontSize: fsPrancha(p.texto, lado), fontWeight: calma ? '700' : '900', marginTop: 4, color: calma ? '#475569' : '#1E293B', textAlign: 'center', paddingHorizontal: 4 }}>{vis.letraMaiuscula ? p.texto.toUpperCase() : p.texto}</Text>
        {p.audio ? <View style={{ position: 'absolute', top: 5, left: 5 }}><Feather name="mic" size={12} color={t.borda} /></View> : null}
        {modo !== 'normal' ? <View style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: modo === 'excluir' ? '#E11D48' : '#7E22CE', alignItems: 'center', justifyContent: 'center' }}><Feather name={modo === 'excluir' ? 'trash-2' : 'edit-2'} size={12} color="#fff" /></View> : null}
      </Animated.View>
    </Pressable>
  );
}

export function VozHome({ ir, abaInicial }: { ir: (t: TelaVoz) => void; abaInicial?: string }) {
  const { s, mudar, tocar, falar, toast } = useVoz();
  const { registrarFala, registrarPrancha, registrarFraseIncompleta, pedirAdulto, msAdulto, sugerirFrase, idioma, recurso, v14, registrarModelo, registrarV14, estado: estRotina, assinante: premium, limites, pode, pedirPlano } = useRotina();
  // v14.8: no grátis (ou quando o teste premium acaba) a criança CONTINUA falando com as pranchas do limite:
  // as escolhidas pelos pais + as mais usadas. As outras ficam guardadas (nunca apagadas) e voltam ao assinar.
  // anúncios dos parceiros (painel): no grátis, um por vez na tela inicial, revezando a cada abertura; sem anúncio, o convite do Plano Completo
  const conta = useConta();
  const anuncios = lerAnuncios(conta.remoto.anuncio);
  const [vez] = useState(() => Math.floor(Math.random() * 1000));
  const anuncioPainel = anuncios.length ? anuncios[vez % anuncios.length] : undefined;
  const abrirAnuncio = (a: { link?: string }) => {
    if (!anuncioPainel || !a.link) return adulto(() => ir({ n: 'assinatura' } as TelaVoz), 'Planos');
    abrirLink(a.link);
  };
  const pranchasDoPlano = React.useMemo(() => {
    if (premium || contarParaLimite(s.pranchas) <= limites.pranchas) return s.pranchas;
    const usos: Record<string, number> = {};
    for (const e of estRotina.log || []) if (e.tipo === 'prancha' && e.rotulo) usos[e.rotulo.toLowerCase()] = (usos[e.rotulo.toLowerCase()] || 0) + 1;
    const contam = s.pranchas.filter((q) => !veioProntaV24(q.id));
    const fica = pranchasQueFicam(contam.map((q, i) => ({ id: q.id, usos: usos[q.texto.toLowerCase()] || 0, criadaEm: i })), limites.pranchas, s.defs.pranchasFixas || []);
    return s.pranchas.filter((q) => veioProntaV24(q.id) || fica.has(q.id));
  }, [premium, s.pranchas, limites.pranchas, estRotina.log, s.defs.pranchasFixas]);
  const fotoOk = premium || pode('foto');
  const vozOk = premium || limites.vozGravada > 0;
  // v14
  const [exemplo, setExemplo] = useState(false);
  const [sos, setSos] = useState(false);
  const [destaque, setDestaque] = useState<string>();
  // v14.2: "segure 3 segundos" — aparece nas 2 primeiras vezes que tocarem rápido em TRAVAR, AJUSTES ou CRIAR PRANCHA
  const [dicaSegurar, setDicaSegurar] = useState<string>();
  const avisarSegurar = (nome: string) => {
    const n = s.dicas?.toques?.[nome] || 0;
    if (n >= 2) return;
    mudar((x) => ({ ...x, dicas: { ...x.dicas, toques: { ...(x.dicas?.toques || {}), [nome]: n + 1 } } }));
    setDicaSegurar(nome);
    setTimeout(() => setDicaSegurar((d) => (d === nome ? undefined : d)), 3800);
  };
  const toqueIni = React.useRef(0);
  const calma = recurso('telaCalma');
  const nivel = recurso('niveis') ? v14.nivel : 3;
  // o modo exemplo desliga sozinho depois de 2 minutos (para a criança não ficar com os toques "do pai")
  React.useEffect(() => { if (!exemplo) return undefined; const h = setTimeout(() => setExemplo(false), 120000); return () => clearTimeout(h); }, [exemplo, destaque]);
  // relatório: quando a frase começou e quantas palavras vieram das sugestões
  const inicioFrase = React.useRef(0);
  const sugUsadas = React.useRef(0);
  const [premios] = useItensMenuRotina(); // PRÊMIOS (prêmios + metas + conquistas)
  // o app sempre abre na aba GERAL (todas as pranchas numa tela só)
  const [aba, setAba] = useState(abaInicial || s.abas.find((a) => a.id === 'geral')?.id || s.abas[0]?.id);
  const [frase, setFrase] = useState<string[]>([]);
  // quantas palavras do começo da frase o app montou sozinho (mensagem inteligente) — aparecem tracejadas
  const [auto, setAuto] = useState(0);
  const tour = useTour();
  const [travado, setTravado] = useState(false);
  const [teclado, setTeclado] = useState(false);
  const [largMenu, setLargMenu] = useState(371);
  const [excluir, setExcluir] = useState<PranchaVoz>();
  const [editAba, setEditAba] = useState<string>();
  const [larg, setLarg] = useState(360);
  // prancha nova criada: mostra a aba onde ela foi parar
  const qtd = React.useRef(s.pranchas.length);
  React.useEffect(() => { if (s.pranchas.length > qtd.current && !(qtd.current === 0 && s.defs.migradoV24)) setAba(s.pranchas[s.pranchas.length - 1].abaId); qtd.current = s.pranchas.length; }, [s.pranchas]); // v14.8: depois de trazer as pranchas do app antigo, fica na GERAL
  // v14: a rotina do dia abre a aba das pranchas daquela hora (ex.: tarefa "Banho" → aba Banho, se existir)
  const tarefaAtivaId = estRotina.tarefaAtiva?.tarefaId;
  React.useEffect(() => {
    if (!tarefaAtivaId || !recurso('rotinaPranchas')) return;
    const t = estRotina.tarefas.find((x) => x.id === tarefaAtivaId);
    if (!t || t.abaVozId) return;
    const pac = pacoteDaTarefa(t.titulo);
    const alvo = pac && s.abas.find((a) => a.nome.toLowerCase() === pac.nome[idioma].toLowerCase());
    if (alvo) setAba(alvo.id);
  }, [tarefaAtivaId]); // eslint-disable-line react-hooks/exhaustive-deps
  const abaAtual = s.abas.find((a) => a.id === aba) || s.abas[0];
  const geral = abaAtual?.id === 'geral';
  // v14: GRADE QUE CRESCE — só os primeiros N botões (na ordem de criação); os novos entram no fim, os antigos não mudam de lugar
  const base = pranchasDoPlano;
  const todas = recurso('gradeCrescente') ? pranchasVisiveis(base, v14.gradeBotoes) : base;
  const pranchas = geral ? todas : todas.filter((p) => p.abaId === abaAtual?.id);
  const vis = VISUAIS[recurso('visualIdade') ? v14.visual : 'crianca'];
  const tablet = recurso('modoTablet') && (v14.modoTela === 'tablet' || (v14.modoTela === 'auto' && larg >= 700));
  const raio = recurso('estilosBotao') ? (v14.estilo === 'quadrado' ? 4 : v14.estilo === 'borda' ? 12 : vis.raio) : 16;
  const temaDaPrancha = (p: { abaId: string }) => tema(s.abas.find((a) => a.id === p.abaId)?.tema);
  const colBase = s.defs.colunasAuto ? 4 : s.defs.colunas; // padrão: 4 lado a lado (os pais mudam em Definições)
  const colunas = Math.max(2, Math.min(8, (tablet ? colBase + 2 : colBase) - (recurso('botoesGrandes') ? 1 : 0)));
  const lado = Math.floor((larg - 24 - colunas * 8) / colunas);

  const adulto = (f: () => void, titulo: string) => pedirAdulto(f, titulo);

  const tocarPrancha = (p: PranchaVoz) => {
    if (s.modo === 'editar') { ir({ n: 'criar', id: p.id }); return; }
    if (s.modo === 'excluir') { setExcluir(p); return; }
    // v14.2: o toque NÃO fala — só coloca a palavra na frase. O app fala SÓ no botão FALAR (mesmo com 1 palavra).
    if (exemplo) { // MODO EXEMPLO: o pai mostra; o app destaca; não conta como pedido da criança
      registrarModelo(p.texto); setDestaque(p.id); setTimeout(() => setDestaque((d) => (d === p.id ? undefined : d)), 1100);
      adicionarPalavra(p.texto); return;
    }
    registrarPrancha(p.texto, abaAtual?.nome);
    adicionarPalavra(p.texto);
  };
  // MENSAGEM INTELIGENTE: a 1ª palavra ("água") já vira frase ("EU QUERO ÁGUA"). Dá para apagar; só fala no FALAR.
  const adicionarPalavra = (w: string) => {
    if (!frase.length || nivel === 1) {
      inicioFrase.current = Date.now();
      // nível 1 (uma palavra): sem mensagem inteligente; nível 2: no máximo 2 palavras
      const f = s.defs.sugestoes && nivel === 3 ? formularFrase(w, idioma) : undefined;
      if (f) { setFrase(f); setAuto(f.length - 1); return; }
      if (nivel === 1) { if (frase.length) registrarFraseIncompleta([]); setFrase([w]); setAuto(0); return; }
    }
    setFrase((x) => somarPalavra(x, w, nivel));
    if (frase.length >= maxPalavras(nivel)) setAuto(0);
  };
  const tirarPalavra = (i: number) => { setFrase((f) => f.filter((_, k) => k !== i)); if (i < auto) setAuto((a) => a - 1); };
  const lembrar = (palavras: string[]) => mudar((x) => {
    const seg = { ...x.seguinte };
    for (let i = 0; i < palavras.length - 1; i++) {
      const a = palavras[i].toLowerCase(); const b = palavras[i + 1];
      seg[a] = { ...(seg[a] || {}), [b]: ((seg[a] || {})[b] || 0) + 1 };
    }
    return { ...x, seguinte: seg };
  });
  const falarFrase = () => {
    if (!frase.length) return;
    // 1 palavra com voz gravada dos pais: toca a gravação; senão, a voz do celular
    const so = frase.length === 1 ? s.pranchas.find((q) => q.texto.toLowerCase() === frase[0].toLowerCase() && q.audio) : undefined;
    if (so && recurso('vozGravada') && vozOk) tocar(so, true); else falar(frase.join(' '));
    // modo exemplo: é o pai mostrando — fala, mas não conta como frase da criança (nem estrela)
    if (!exemplo) {
      registrarFala(frase, { ms: inicioFrase.current ? Date.now() - inicioFrase.current : undefined, sug: sugUsadas.current + auto });
      lembrar(frase);
    }
    setFrase([]); setAuto(0);
    sugUsadas.current = 0;
  };
  /** Saiu do modo frase ou limpou sem falar => frase incompleta (vai para o relatório). */
  // 1 palavra só já foi falada no toque; frase incompleta = 2 palavras ou mais sem FALAR
  const descartarFrase = () => { if (frase.length) registrarFraseIncompleta(frase); setFrase([]); setAuto(0); sugUsadas.current = 0; };
  const vocab = React.useMemo(() => s.pranchas.map((p) => p.texto), [s.pranchas]);
  const emojisPorTexto = React.useMemo(() => Object.fromEntries(s.pranchas.filter((p) => p.emoji).map((p) => [p.texto.toLowerCase(), p.emoji as string])), [s.pranchas]);
  // largura igual para todos os quadradinhos: 5 por linha
  const lt = Math.floor((largMenu - 4 * GAP) / 5);
  const travar = () => (!travado && !pode('travarApp') ? pedirPlano('travarApp') : adulto(() => {
    const p = ponte();
    if (!travado) { try { p?.travar?.(); } catch { /* */ } setTravado(true); toast({ pt: 'App travado. Segure de novo para destravar.', en: 'App locked. Hold again to unlock.', es: 'App bloqueada. Mantén pulsado de nuevo para desbloquear.' }[idioma] || 'App travado.'); }
    else { try { p?.destravar?.(); } catch { /* */ } setTravado(false); toast({ pt: 'App destravado.', en: 'App unlocked.', es: 'App desbloqueada.' }[idioma] || 'App destravado.'); }
  }, travado ? 'Destravar app' : 'Travar app'));

  // EM CIMA: botões dos pais (segurar) e funções
  const topo = [
    <Tile key="travar" tour="travar" largura={lt} ms={msAdulto} aoTocarCurto={() => avisarSegurar(travado ? 'DESTRAVAR' : 'TRAVAR APP')} n={travado ? 'DESTRAVAR' : 'TRAVAR APP'} i={travado ? 'lock' : 'unlock'} c="#0F172A" b="#FFF7ED" borda="#F59E0B" segurar={travar} />,
    <Tile key="ajustes" tour="ajustes" largura={lt} ms={msAdulto} aoTocarCurto={() => avisarSegurar('AJUSTES')} n="AJUSTES" i="settings" c="#0F172A" b="#FFFFFF" borda="#93C5FD" segurar={() => adulto(() => ir({ n: 'ajustes' }), 'Ajustes')} />,
    // v14.3: CRIAR PRANCHA no MEIO, em destaque (verde cheio) — o atalho mais importante dos pais
    <Tile key="criar" tour="criarPrancha" largura={lt} ms={msAdulto} aoTocarCurto={() => avisarSegurar('CRIAR PRANCHA')} comecePorAqui={!s.dicas?.criou && !tour?.ativo} n="CRIAR PRANCHA" i="plus-square" c="#FFFFFF" b="#16A34A" borda="#15803D" segurar={() => adulto(() => ir({ n: 'criar', abaId: geral ? undefined : abaAtual?.id }), 'Criar prancha')} />,
    <Tile key="teclado" tour="teclado" largura={lt} n="TECLADO" i="grid" c="#334155" b="#FFFFFF" borda="#CBD5E1" onPress={() => setTeclado(true)} />,
    <View key="premios"><AlvoTour id="premios"><BotaoMenuVoz item={premios} largura={lt} altura={ALT} raio={10} borda={1.2} /></AlvoTour></View>,
  ];
  // EM CIMA, 2ª linha: as abas (a criança mexe) — mesmo tamanho dos de cima
  const tileAba = (a: typeof s.abas[number], i: number) => {
    const t = tema(a.tema);
    return <Tile key={a.id} largura={Math.max(lt, 70)} ultimo={i === s.abas.length - 1} tour={i === 0 ? 'abas' : undefined} n={a.nome.toUpperCase()} i={t.iconeNome} c={t.borda} b={calma ? '#FFFFFF' : t.claro} ativo={a.id === abaAtual?.id} lapis={s.editarAbas && a.id !== 'geral'}
      onPress={() => (s.editarAbas && a.id !== 'geral' ? setEditAba(a.id) : setAba(a.id))} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: calma ? '#F8FAFC' : vis.fundo }} edges={['top', 'bottom']}>
      {recurso('fundoAnimado') && !calma ? <FundoAnimado /> : null}
      <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 10, marginTop: 8, borderRadius: 22, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
        <View onLayout={(e) => setLargMenu(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', marginHorizontal: 10, paddingTop: 4 }}>{topo}</View>
        {/* v14: abas numa ÚNICA fileira que desliza para o lado (nunca desce e não rouba espaço das pranchas) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 10, marginTop: GAP }} accessibilityLabel="fileira de abas">
          {s.abas.map(tileAba)}
        </ScrollView>
      </View>

      {dicaSegurar ? (
        // v14.3: aviso PEQUENO, numa caixinha azul, lá em cima (não empurra a tela)
        <View pointerEvents="none" style={{ height: 0, zIndex: 20, alignItems: 'center' }}>
          <View accessibilityLabel="aviso segure 3 segundos" style={{ position: 'absolute', top: -4, backgroundColor: '#DBEAFE', borderWidth: 1.5, borderColor: '#60A5FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#1E40AF' }}>✋ Segure {Math.round(msAdulto / 1000)} s para abrir</Text>
          </View>
        </View>
      ) : null}
      {s.modo !== 'normal' || s.editarAbas ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 8, backgroundColor: s.modo === 'excluir' ? '#FFE4E6' : '#F3E8FF', borderRadius: 14, padding: 8 }}>
          <Feather name={s.modo === 'excluir' ? 'trash-2' : 'edit-2'} size={16} color={s.modo === 'excluir' ? '#BE123C' : '#7E22CE'} />
          <Text style={{ flex: 1, marginLeft: 8, fontWeight: '800', color: '#0F172A', fontSize: 12 }}>{s.modo === 'editar' ? 'Editar: toque na prancha.' : s.modo === 'excluir' ? 'Excluir: toque na prancha.' : 'Editar abas: toque numa aba lá em cima.'}</Text>
          <Pressable onPress={() => mudar((x) => ({ ...x, modo: 'normal', editarAbas: false }))} accessibilityLabel="Sair do modo" style={{ backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 10, height: 30, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>SAIR</Text></Pressable>
        </View>
      ) : null}

      {/* BARRA DA FRASE: sempre na tela (não tem mais o botão FRASES) */}
      <AlvoTour id="frases">
        <View style={{ marginHorizontal: 12, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: exemplo ? '#FFF7ED' : '#FFFFFF', borderRadius: 16, padding: 8, borderWidth: exemplo ? 2.5 : 1.5, borderColor: exemplo ? '#F59E0B' : '#BFDBFE' }}>
            {recurso('modoExemplo') ? (
              <Pressable onPress={() => setExemplo((x) => !x)} accessibilityRole="switch" accessibilityState={{ checked: exemplo }} accessibilityLabel="modo exemplo" style={{ width: 34, height: 34, borderRadius: 17, marginRight: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: exemplo ? '#F59E0B' : '#F1F5F9' }}>
                <Text style={{ fontSize: 16 }}>👆</Text>
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}><PalavrasColoridas palavras={frase} sugeridas={auto} aoTocar={tirarPalavra} tamanho={14} vazio={idioma === 'en' ? 'Tap the cards or a ready phrase' : idioma === 'es' ? 'Toca las tarjetas o una frase lista' : 'Toque nas pranchas ou numa frase pronta'} /></View>
            {frase.length ? <Pressable onPress={() => setFrase((f) => f.slice(0, -1))} accessibilityLabel="Apagar palavra" style={{ padding: 8 }}><Feather name="delete" size={18} color="#64748B" /></Pressable> : null}
            {frase.length ? <Pressable onPress={descartarFrase} accessibilityLabel="Limpar frase" style={{ padding: 8 }}><Feather name="x" size={18} color="#64748B" /></Pressable> : null}
            {recurso('emergencia') && (v14.emergencia.dor || v14.emergencia.ajuda || v14.emergencia.banheiro) ? (
              <Pressable onPress={() => {
                const lig = (Object.keys(FRASES_SOS) as (keyof typeof FRASES_SOS)[]).filter((k) => v14.emergencia[k]);
                if (lig.length === 1) { falar(FRASES_SOS[lig[0]][idioma]); registrarV14('emergencia', lig[0]); toast(`${FRASES_SOS[lig[0]].e} ${FRASES_SOS[lig[0]][idioma]}`); } else setSos((x) => !x);
              }} accessibilityRole="button" accessibilityLabel="emergência" style={{ width: 34, height: 34, borderRadius: 17, marginRight: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: sos ? '#B91C1C' : '#FEE2E2', borderWidth: 1.5, borderColor: '#EF4444' }}>
                <Text style={{ fontSize: 15 }}>🆘</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={falarFrase} accessibilityRole="button" accessibilityLabel="FALAR" style={{ backgroundColor: frase.length ? '#22C55E' : '#CBD5E1', borderRadius: 12, paddingHorizontal: 16, height: 40, justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>FALAR</Text>
            </Pressable>
          </View>
          {/* v14: emergência — linha na própria tela (sem pop-up), no lugar das sugestões */}
          {sos ? (
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              {(Object.keys(FRASES_SOS) as (keyof typeof FRASES_SOS)[]).filter((k) => v14.emergencia[k]).map((k) => (
                <Pressable key={k} onPress={() => { falar(FRASES_SOS[k][idioma]); registrarV14('emergencia', k); setSos(false); }} accessibilityRole="button" accessibilityLabel={FRASES_SOS[k][idioma]}
                  style={{ flex: 1, height: 52, marginRight: 6, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  <Text style={{ fontSize: 18 }}>{FRASES_SOS[k].e}</Text><Text style={{ color: '#fff', fontWeight: '900', marginLeft: 6, fontSize: 13 }} numberOfLines={2}>{FRASES_SOS[k][idioma].toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {/* UM bloco só de sugestões, botões fixos na tela: frases prontas + o que o app entende (até palavras sem prancha) */}
          {s.defs.sugestoes && !sos && nivel === 3 ? <BarraSugestoesFrase frase={frase} vocab={vocab} emojis={emojisPorTexto} palavraBase={auto > 0 && frase.length === auto + 1 ? frase[auto] : undefined}
            aoComecar={() => { descartarFrase(); setAuto(0); inicioFrase.current = Date.now(); }}
            aoPalavra={(w) => { sugUsadas.current++; adicionarPalavra(w); }}
            aoFalarFrase={() => { /* v14.2: a sugestão só monta a frase; fala no FALAR */ }} /> : null}
        </View>
      </AlvoTour>

      <ScrollView style={{ flex: 1 }} onLayout={(e) => setLarg(e.nativeEvent.layout.width)} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12 }}>
        {/* v14.3: sem botão "ADICIONAR PRANCHA" aqui embaixo — o atalho é só o CRIAR PRANCHA lá em cima */}
        {!s.pranchas.length ? (
          <AlvoTour id="pranchas">
            <View accessibilityLabel="dica criar prancha lá em cima" style={{ margin: 4, padding: 14, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#86EFAC', backgroundColor: '#F0FDF4', width: Math.max(lado * 2, 220) }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#166534' }}>⬆️ Comece pelo CRIAR PRANCHA, lá em cima</Text>
              <Text style={{ fontSize: 12.5, color: '#166534', marginTop: 4 }}>Segure {Math.round(msAdulto / 1000)} s e faça a continha. Lá dentro tem a Criação rápida: é só tocar.</Text>
            </View>
          </AlvoTour>
        ) : null}
        {pranchas.map((p, i) => {
          const t = temaDaPrancha(p); // cada prancha com a cor da SUA categoria (também na GERAL)
          return (
            <AlvoTour key={p.id} id={i === 0 ? 'pranchas' : `prancha-${p.id}`}>
            <CartaoPrancha p={fotoOk && vozOk ? p : { ...p, imagem: fotoOk ? p.imagem : undefined, emoji: !fotoOk && p.imagem ? p.emoji || '💬' : p.emoji, audio: vozOk ? p.audio : undefined }} t={t} lado={lado} raio={raio} calma={calma} estilo={recurso('estilosBotao') ? v14.estilo : 'redondo'} destaque={destaque === p.id} vis={vis} modo={s.modo}
              aoTocar={(ms) => { if (recurso('tempoToque') && v14.toqueMs > 0 && ms < v14.toqueMs) return; tocarPrancha(p); }} />
            </AlvoTour>
          );
        })}
      </ScrollView>

      {/* NOVO (Rotina Amiga): área dos anúncios — próxima etapa da rotina; sem etapa, o anúncio */}
      {/* versão gratuita: anúncio (fictício no teste) que só abre segurando 5 s; assinante não vê */}
      {/* tela calma: sem anúncio piscando */}
      <ProximoPasso anuncio={calma ? undefined : <AnuncioProtegido anuncio={anuncioPainel || ANUNCIO_PLANO} aoAbrir={(a) => abrirAnuncio(a)} />} />
      {!calma && limites.anuncios ? (
        <Pressable onPress={() => adulto(() => ir({ n: 'assinatura' } as TelaVoz), 'Planos')} accessibilityRole="button" accessibilityLabel="remover anúncio" style={{ alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10, marginTop: -6, marginBottom: 6 }}>
          <Text style={{ fontSize: 11.5, color: '#64748B', fontWeight: '700', textAlign: 'center' }}>{TX_REMOVER[s.defs.idioma] || TX_REMOVER.pt}</Text>
        </Pressable>
      ) : null}

      <TecladoAmigo visivel={teclado} fechar={() => setTeclado(false)} avancado={s.defs.tecladoAvancado} sugestoes={s.defs.sugestoes} vocab={vocab}
        aoFalar={(texto, ws) => { falar(texto); registrarFala(ws); lembrar(ws); }} />

      <Modal visible={!!excluir} transparent animationType="fade" onRequestClose={() => setExcluir(undefined)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>Excluir "{excluir?.texto}"?</Text>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <BotaoCor titulo="Cancelar" cor="#E2E8F0" texto="#334155" flex onPress={() => setExcluir(undefined)} />
              <View style={{ width: 8 }} />
              <BotaoCor titulo="Excluir" cor="#DC2626" flex onPress={() => { const id = excluir!.id; mudar((x) => ({ ...x, pranchas: x.pranchas.filter((p) => p.id !== id) })); setExcluir(undefined); toast('Prancha excluída.'); }} />
            </View>
          </View>
        </View>
      </Modal>
      <NovaAbaModal visivel={!!editAba} abaId={editAba} fechar={() => setEditAba(undefined)} />
    </SafeAreaView>
  );
}

/** Letra do nome da prancha: do tamanho de sempre, mas diminui para a maior palavra caber inteira (nada de "ASSUSTAD/O"). */
const fsPrancha = (texto: string, lado: number) => {
  const maior = Math.max(...String(texto).split(/\s+/).map((w) => w.length), 1);
  return Math.max(8, Math.min(Math.max(10, lado * 0.105), (lado - 14) / (maior * 0.74)));
};

/** Faixa da versão gratuita: convite para o Plano Completo (some para quem assina). */
const TX_REMOVER: Record<string, string> = { pt: '👑 Para remover o anúncio desta tela, assine o Plano Completo', en: '👑 To remove the ad from this screen, get the Full Plan', es: '👑 Para quitar el anuncio de esta pantalla, suscríbete al Plan Completo' };
const ANUNCIO_PLANO = { titulo: '👑 Plano Completo', texto: 'Todas as funções liberadas. Segure 5 s para ver os planos.' };
