// TOUR DO APLICATIVO — tela guiada: destaca CADA botão, fala a explicação em voz alta e mostra uma
// mini demonstração animada do que acontece. Em português, inglês e espanhol.
//
// No Voz original:
//   1) Envolva cada botão com <AlvoTour id="..."> (ids em tourPassos.ts / INTEGRACAO.md).
//   2) Troque os <ScrollView> das telas percorridas por <RolagemTour> (o tour rola até o botão).
//   3) Passe tourIrPara ao <RotinaAmigaProvider> para o tour abrir as telas do Voz
//      ('home', 'ajustesVoz', 'criarPrancha', 'definicoes'). As telas do Rotina o módulo abre sozinho.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { C, px, sombra } from './componentes/ui';
import { PARTES, PASSOS_TOUR, TelaTour, UI_TOUR } from './tourPassos';
import { Rolador, RolagemCtx } from './tourRolagem';
import { Idioma } from './tipos';
import type { PassoTour } from './tourPassos';
import { anunciarFala, MascoteVoando, pararFalaMascote } from './v14/Mascote';

export { PASSOS_TOUR } from './tourPassos';
export type { PassoTour, TelaTour } from './tourPassos';
export { RolagemTour } from './tourRolagem';

export type TelaHost = 'home' | 'ajustesVoz' | 'criarPrancha' | 'definicoes';
export type TelaModulo = 'rotinaAjustes' | 'rotinaOpcoes' | 'editarTarefa' | 'premios' | 'relatorio' | 'frasesProntas' | 'conquistas';
const HOST: TelaTour[] = ['home', 'ajustesVoz', 'criarPrancha', 'definicoes'];

interface Ret { x: number; y: number; w: number; h: number }
interface Alvo { ref: React.RefObject<View | null>; rolador: Rolador | null }
/** v14: o mesmo motor serve para o CURSO dos pais (lista própria de passos + mascote voando). */
export interface OpcoesCurso { passos: PassoTour[]; partes: string[]; aoTerminar?: (completo: boolean) => void }
interface CtxTour { ativo: boolean; passo: number; modo: 'tour' | 'curso'; iniciar: () => void; iniciarCurso: (o: OpcoesCurso) => void; registrar: (id: string, a: Alvo) => () => void }
const TourCtx = createContext<CtxTour | null>(null);
export const useTour = () => useContext(TourCtx);

/** Marque qualquer botão com <AlvoTour id="..."> para o tour poder destacá-lo (não muda o visual). */
export function AlvoTour({ id, children, style }: { id: string; children: React.ReactNode; style?: object }) {
  const ctx = useTour();
  const rolador = useContext(RolagemCtx);
  const ref = useRef<View>(null);
  useEffect(() => (ctx ? ctx.registrar(id, { ref, rolador }) : undefined), [ctx, id, rolador]); // eslint-disable-line react-hooks/exhaustive-deps
  // data-tour (só na web) deixa o teste automático conferir que o anel está no botão certo
  return <View ref={ref} collapsable={false} style={style} {...({ dataSet: { tour: id } } as object)}>{children}</View>;
}

/** Anel laranja piscando em volta do botão de verdade. */
function Anel({ x, y, w, h, calmo }: { x: number; y: number; w: number; h: number; calmo?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (calmo) return undefined;
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 650, useNativeDriver: false }), Animated.timing(v, { toValue: 0, duration: 650, useNativeDriver: false })]));
    a.start(); return () => a.stop();
  }, [calmo]); // eslint-disable-line react-hooks/exhaustive-deps
  const op = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, borderWidth: 4, borderColor: '#F97316', opacity: op }} />;
}

export function TourProvider({ children, irPara, abrirModulo, fecharModulo, jaVisto, marcarVisto, idioma, falar, pararFala, falarMascote, abrirCurso, calmo }: {
  children: React.ReactNode;
  irPara?: (tela: TelaHost) => void;
  abrirModulo: (tela: TelaModulo) => void;
  fecharModulo: () => void;
  jaVisto: boolean;
  marcarVisto: () => void;
  idioma: Idioma;
  falar: (texto: string) => void;
  pararFala: () => void;
  /** v14: voz do mascote (mais alegre). Sem ela, usa `falar`. */
  falarMascote?: (texto: string) => void;
  /** v14: no fim do tour, botão para abrir o curso dos pais. */
  abrirCurso?: () => void;
  /** v14: tela calma = mascote sem movimento. */
  calmo?: boolean;
}) {
  const alvos = useRef(new Map<string, Alvo>());
  const [ativo, setAtivo] = useState(false);
  const [passo, setPasso] = useState(0);
  const [ret, setRet] = useState<Ret | null>(null);
  const [navegando, setNavegando] = useState(false);
  const [som, setSom] = useState(true);
  const [altBalao, setAltBalao] = useState(0);
  const raiz = useRef<View>(null);
  const telaAtual = useRef<TelaTour>('home');
  const [curso, setCurso] = useState<OpcoesCurso | null>(null);
  const lista = curso ? curso.passos : PASSOS_TOUR;
  const U = UI_TOUR[idioma];

  const registrar = useCallback((id: string, a: Alvo) => {
    alvos.current.set(id, a);
    return () => { if (alvos.current.get(id) === a) alvos.current.delete(id); };
  }, []);
  const iniciar = useCallback(() => { setCurso(null); telaAtual.current = 'home'; irPara?.('home'); fecharModulo(); setPasso(0); setAtivo(true); }, [irPara, fecharModulo]);
  const iniciarCurso = useCallback((o: OpcoesCurso) => { if (!o.passos.length) return; setCurso(o); telaAtual.current = 'home'; irPara?.('home'); fecharModulo(); setPasso(0); setAtivo(true); }, [irPara, fecharModulo]);

  useEffect(() => { if (!jaVisto) { const h = setTimeout(iniciar, 1200); return () => clearTimeout(h); } return undefined; }, [jaVisto]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = lista[passo];
  const tx = p ? p[idioma] : undefined;

  // 1) vai para a tela do passo
  useEffect(() => {
    if (!ativo || !p) return;
    const de = telaAtual.current;
    if (de === p.tela) return;
    setNavegando(true);
    const deModulo = !HOST.includes(de);
    const paraModulo = !HOST.includes(p.tela);
    if (deModulo && !paraModulo) fecharModulo();
    if (!paraModulo) irPara?.(p.tela as TelaHost);
    else { if (de === 'home') irPara?.('ajustesVoz'); abrirModulo(p.tela as TelaModulo); }
    telaAtual.current = p.tela;
    const h = setTimeout(() => setNavegando(false), 420); // o tour volta POR CIMA da tela nova
    return () => clearTimeout(h);
  }, [ativo, passo]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) fala a explicação
  useEffect(() => {
    if (!ativo || !tx) return;
    const h = setTimeout(() => { if (som) { const fala = `${tx.t.replace(/^[^\p{L}]+/u, '').replace(/[^\p{L}\p{N}\s.,!?¡¿'"():-]/gu, '')}. ${tx.d}`; if (falarMascote) falarMascote(fala); else { anunciarFala(fala); falar(fala); } } }, 450);
    return () => clearTimeout(h);
  }, [ativo, passo, som, idioma]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3) acha o botão, rola até ele se precisar, e mede
  useEffect(() => {
    if (!ativo || !p) return;
    setRet(null);
    if (!p.alvo) return;
    let vivo = true;
    const { height: H } = Dimensions.get('window');
    const medir = (tent: number, rolou: boolean) => {
      const a = alvos.current.get(p.alvo!);
      const el = a?.ref.current;
      if (!el || !raiz.current) { if (tent < 10) setTimeout(() => vivo && medir(tent + 1, rolou), 250); return; }
      raiz.current.measureInWindow((rx, ry) => {
        el.measureInWindow((x, y, w, h) => {
          if (!vivo) return;
          if (!w || !h) { if (tent < 10) setTimeout(() => vivo && medir(tent + 1, rolou), 250); return; }
          const r = { x: x - rx, y: y - ry, w, h };
          const fora = r.y < px(60) || r.y + r.h > H - px(60);
          if (fora && a.rolador && !rolou) {
            a.rolador.rolar(r.y - H * 0.22);
            setTimeout(() => vivo && medir(tent + 1, true), 350);
            return;
          }
          setRet(r);
        });
      });
    };
    const h = setTimeout(() => medir(0, false), 380);
    return () => { vivo = false; clearTimeout(h); };
  }, [ativo, passo]); // eslint-disable-line react-hooks/exhaustive-deps

  const terminar = (completo = false) => {
    setAtivo(false);
    pararFala(); pararFalaMascote();
    if (curso) { try { curso.aoTerminar?.(completo); } catch { /* */ } setCurso(null); } else marcarVisto();
    if (telaAtual.current !== 'home') { fecharModulo(); irPara?.('home'); telaAtual.current = 'home'; }
  };
  const ir = (d: number) => { const n = passo + d; if (n < 0) return; if (n >= lista.length) { terminar(true); return; } setPasso(n); };
  const pularParte = () => {
    const prox = lista.findIndex((x, i) => i > passo && x.parte > p.parte);
    if (prox < 0) terminar(); else setPasso(prox);
  };

  const { width: W, height: H } = Dimensions.get('window');
  const m = 6;
  const r = ret ? { x: Math.max(0, ret.x - m), y: Math.max(0, ret.y - m), w: Math.min(W - Math.max(0, ret.x - m), ret.w + 2 * m), h: Math.min(H - 2 - Math.max(0, ret.y - m), ret.h + 2 * m) } : null;
  const visivel = !!r && r.y < H && r.y + r.h > 0;
  // v14.1: o app continua à vista (sombra leve); só o botão de verdade fica aceso
  const sombraCor = 'rgba(15,23,42,0.42)';
  const ultimo = passo === lista.length - 1;
  const nomeParte = curso ? curso.partes[p?.parte ?? 0] || '' : PARTES[idioma][p?.parte ?? 0];

  // CAIXINHA PEQUENA ao lado do botão (embaixo se couber, senão em cima), com setinha apontando
  const LB = Math.min(290, W - 24);
  const hb = altBalao || 170;
  const espacoBaixo = r ? H - (r.y + r.h) : 0;
  const embaixo = r ? espacoBaixo >= hb + 24 || espacoBaixo > r.y : true;
  const cx = r ? r.x + r.w / 2 : W / 2;
  const bx = Math.max(12, Math.min(W - LB - 12, cx - LB / 2));
  const by = r && visivel ? (embaixo ? Math.min(H - hb - 8, r.y + r.h + 14) : Math.max(8, r.y - hb - 14)) : Math.max(90, H * 0.32);
  const setaX = Math.max(bx + 18, Math.min(bx + LB - 30, cx - 9));
  // o mascote fica AO LADO da caixinha (do lado que tiver espaço), olhando e apontando para o botão
  const TM = 66; const HM = TM * (373 / 377);
  const mx = bx >= TM + 4 ? bx - TM - 2 : bx + LB + TM + 4 <= W ? bx + LB + 2 : Math.max(2, bx - 8);
  const ladoLivre = bx >= TM + 4 || bx + LB + TM + 4 <= W;
  const my = ladoLivre ? Math.max(4, Math.min(H - HM - 4, by + 4)) : Math.max(4, by - HM + 18);

  return (
    <TourCtx.Provider value={{ ativo, passo, modo: curso ? 'curso' : 'tour', iniciar, iniciarCurso, registrar }}>
      {children}
      <Modal visible={ativo && !navegando} transparent animationType="fade" onRequestClose={() => terminar()} statusBarTranslucent>
        <View ref={raiz} collapsable={false} style={{ flex: 1 }}>
          {visivel && r ? (
            <>
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: r.y, backgroundColor: sombraCor }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: r.y + r.h, bottom: 0, backgroundColor: sombraCor }} />
              <View style={{ position: 'absolute', left: 0, width: r.x, top: r.y, height: r.h, backgroundColor: sombraCor }} />
              <View style={{ position: 'absolute', left: r.x + r.w, right: 0, top: r.y, height: r.h, backgroundColor: sombraCor }} />
              <Anel x={r.x} y={r.y} w={r.w} h={r.h} calmo={calmo} />
            </>
          ) : <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: sombraCor }} />}

          {p && tx ? (
            <>
              {visivel && r ? <View pointerEvents="none" style={{ position: 'absolute', left: setaX, top: embaixo ? by - 8 : by + hb - 10, width: 18, height: 18, backgroundColor: C.white, transform: [{ rotate: '45deg' }] }} /> : null}
              <View onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (Math.abs(h - hb) > 2) setAltBalao(h); }}
                accessibilityLabel="caixinha do curso"
                style={[{ position: 'absolute', left: bx, top: by, width: LB, maxHeight: H * 0.45, backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, borderWidth: 2, borderColor: '#FDBA74' }, sombra(10)]}>
                <ScrollView bounces={false} style={{ flexGrow: 0 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#EA580C', letterSpacing: 0.6, marginRight: 40 }} numberOfLines={1}>{passo + 1}/{lista.length} · {nomeParte.toUpperCase()}</Text>
                  <Text style={{ fontSize: 16.5, fontWeight: '900', color: C.ink, marginTop: 3 }}>{tx.t}</Text>
                  <Text style={{ fontSize: 14, color: C.slate2, marginTop: 4, lineHeight: 19 }}>{tx.d}</Text>
                  {tx.dica ? <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#92400E', marginTop: 6 }}>✋ {tx.dica}</Text> : null}
                  {!curso && ultimo && abrirCurso ? (
                    <Pressable onPress={() => { terminar(true); setTimeout(abrirCurso, 300); }} accessibilityRole="button" accessibilityLabel="Abrir o curso para os pais" style={{ marginTop: 8, backgroundColor: '#FFF7ED', borderWidth: 1.5, borderColor: '#FDBA74', borderRadius: 12, padding: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#9A3412' }}>{U.curso}</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Pressable onPress={() => terminar()} accessibilityRole="button" accessibilityLabel={curso ? 'Sair da lição' : 'Pular tour'} hitSlop={8} style={{ paddingVertical: 6, paddingRight: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: C.slate }}>{U.pular}</Text>
                  </Pressable>
                  <Pressable onPress={() => { if (som) { pararFala(); pararFalaMascote(); } setSom(!som); }} accessibilityRole="button" accessibilityLabel={U.ouvir} hitSlop={8} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 16 }}>{som ? '🔊' : '🔇'}</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  {passo > 0 ? (
                    <Pressable onPress={() => ir(-1)} accessibilityRole="button" accessibilityLabel="Voltar passo" style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5, borderColor: C.line2, justifyContent: 'center', marginRight: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: C.slate2 }}>‹</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => ir(1)} accessibilityRole="button" accessibilityLabel={ultimo ? 'Concluir tour' : 'Próximo passo'} style={({ pressed }) => [{ height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#F97316', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                    <Text style={{ fontSize: 13.5, fontWeight: '900', color: C.white }}>{ultimo ? U.concluir : U.proximo}</Text>
                  </Pressable>
                </View>
                {!ultimo && !curso ? (
                  <Pressable onPress={pularParte} accessibilityRole="button" accessibilityLabel="Pular parte" hitSlop={6} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#2563EB' }}>{U.pularParte} »</Text>
                  </Pressable>
                ) : null}
              </View>
              <MascoteVoando calmo={calmo} tam={TM} x={mx} y={my} falando={som} alvoTela={visivel && r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : undefined} />
            </>
          ) : null}
        </View>
      </Modal>
    </TourCtx.Provider>
  );
}
