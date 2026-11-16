// Componentes novos: aviso do Plano Completo, anúncio protegido (segurar 5 s) e "Como estou?".
import React, { useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, Text, View, ViewStyle } from 'react-native';
import { useRotina } from '../estado';
import { imagemSegura, linkSeguro } from '../logica/plano';
import { SENTIMENTOS, tx } from '../textos2';
import { Botao, C, Icone, px, sombra } from './ui';
import { AlvoTour } from '../tour';
import { tp } from '../v14/premium';

// ------------------------------------------------------------------ AVISO DO PLANO COMPLETO
export function AvisoPlano() {
  const { pedidoPlano, responderPlano, idioma, limites, testePremium } = useRotina();
  if (!pedidoPlano) return null;
  const oferecerTeste = !!testePremium?.podeOferecer && testePremium.dias > 0;
  const n = pedidoPlano === 'rotina' ? limites.rotinas : pedidoPlano === 'tarefa' ? limites.tarefasPorRotina : pedidoPlano === 'premio' ? limites.premios : pedidoPlano === 'prancha' ? limites.pranchas : pedidoPlano === 'vozGravada' ? limites.vozGravada : 0;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => responderPlano(false)}>
      <Pressable onPress={() => responderPlano(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: px(40) }}>
        <Pressable style={[{ width: '100%', maxWidth: 520, backgroundColor: C.white, borderRadius: px(48), padding: px(40), alignItems: 'center' }, sombra(10)]}>
          <View style={{ width: px(120), height: px(120), borderRadius: px(60), backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: px(64) }}>👑</Text>
          </View>
          <Text style={{ marginTop: px(20), fontSize: px(34), fontWeight: '900', color: C.ink, textAlign: 'center' }}>{tp('ehPremium', idioma)}</Text>
          <Text style={{ marginTop: px(12), fontSize: px(25), fontWeight: '600', color: C.slate2, textAlign: 'center', lineHeight: px(36) }}>{tx(idioma, `plan_${pedidoPlano}` as never, { n })}</Text>
          <Botao titulo={tp('meLeve', idioma)} icone={{ f: 'mci', n: 'crown' }} cor="#7C3AED" borda="#5B21B6" alto={px(96)} style={{ marginTop: px(30), alignSelf: 'stretch' }} onPress={() => responderPlano(true)} />
          {oferecerTeste ? (
            <>
              <Text style={{ marginTop: px(22), fontSize: px(22), fontWeight: '600', color: C.slate2, textAlign: 'center', lineHeight: px(32) }}>{tp('testarDesc', idioma, testePremium!.dias)}</Text>
              <Botao titulo={tp('testar', idioma, testePremium!.dias)} icone={{ f: 'mci', n: 'gift-outline' }} cor="#16A34A" borda="#15803D" alto={px(90)} style={{ marginTop: px(12), alignSelf: 'stretch' }} onPress={() => { responderPlano(false); try { testePremium!.iniciar(); } catch { /* */ } }} />
            </>
          ) : null}
          <Botao titulo={tx(idioma, 'planLater')} contorno alto={px(84)} style={{ marginTop: px(14), alignSelf: 'stretch' }} onPress={() => responderPlano(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Selo "👑 Plano Completo" para recursos bloqueados. */
export const SeloPlano = ({ onPress }: { onPress?: () => void }) => {
  const { idioma } = useRotina();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={tx(idioma, 'planChip')} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F3E8FF', borderColor: '#C4B5FD', borderWidth: px(2), borderRadius: px(20), paddingHorizontal: px(14), height: px(44) }}>
      <Text style={{ fontSize: px(20) }}>👑</Text>
      <Text style={{ marginLeft: px(6), fontSize: px(19), fontWeight: '900', color: '#6D28D9' }}>{tx(idioma, 'planChip')}</Text>
    </Pressable>
  );
};

// ------------------------------------------------------------------ ANÚNCIO (segurar 5 s para abrir)
export interface DadosAnuncio {
  /** Endereço da imagem (no Firebase: anuncio/N/imagem). */
  imagem?: string;
  /** Link que abre ao segurar (anuncio/N/link). */
  link?: string;
  /** true = abre a tela de planos do app em vez do link (anuncio/N/openplan). */
  openplan?: boolean;
  titulo?: string;
  texto?: string;
}

/**
 * Anúncio da versão gratuita. A criança NÃO abre sem querer: é preciso SEGURAR 5 segundos
 * (uma barrinha enche enquanto segura). Sem dados, mostra um anúncio de exemplo.
 * Assinantes nunca veem anúncio (o ProximoPasso já esconde).
 */
export function AnuncioProtegido({ anuncio, aoAbrir, ms = 5000, altura = px(150) }: { anuncio?: DadosAnuncio; aoAbrir?: (a: DadosAnuncio) => void; ms?: number; altura?: number }) {
  const { idioma, abrirLink, responderPlano } = useRotina();
  const prog = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [segurando, setSegurando] = useState(false);
  const a: DadosAnuncio = anuncio || {};
  const imagem = imagemSegura(a.imagem);
  const exemplo = !imagem && !a.titulo;
  const abrir = () => {
    if (aoAbrir) return aoAbrir({ ...a, link: linkSeguro(a.link), imagem }); // o app recebe o link já conferido
    if (a.openplan) return responderPlano(true);
    const link = linkSeguro(a.link); // só https/mailto/WhatsApp (o link vem do Firebase)
    if (link) abrirLink(link);
  };
  const parar = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    setSegurando(false);
    prog.stopAnimation();
    Animated.timing(prog, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };
  return (
    <AlvoTour id="anuncio">
      <View style={{ paddingHorizontal: px(22.5), paddingBottom: px(16) }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel={`${tx(idioma, 'adLabel')}: ${a.titulo || tx(idioma, 'adSample')}`} accessibilityHint={tx(idioma, 'adHold')}
          onPressIn={() => {
            setSegurando(true);
            prog.setValue(0);
            Animated.timing(prog, { toValue: 1, duration: ms, useNativeDriver: false }).start();
            timer.current = setTimeout(() => { parar(); abrir(); }, ms);
          }}
          onPressOut={parar}
          {...(Platform.OS === 'web' ? { onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault() } : {})}
          style={[{ height: altura, borderRadius: px(32), overflow: 'hidden', backgroundColor: exemplo ? '#F8FAFC' : C.white, borderWidth: px(2), borderColor: exemplo ? '#CBD5E1' : '#E2E8F0', borderStyle: exemplo ? 'dashed' : 'solid', flexDirection: 'row', alignItems: 'center' }, sombra(3), Platform.OS === 'web' ? ({ userSelect: 'none' } as unknown as ViewStyle) : null]}>
          {imagem
            ? <Image source={{ uri: imagem }} resizeMode="cover" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
            : (
              <>
                <View style={{ width: px(96), height: px(96), borderRadius: px(24), backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginLeft: px(24) }}>
                  <Text style={{ fontSize: px(26), fontWeight: '900', color: C.slate }}>AD</Text>
                </View>
                <View style={{ flex: 1, marginLeft: px(22), marginRight: px(16) }}>
                  <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink2 }} numberOfLines={1}>{a.titulo || tx(idioma, 'adSample')}</Text>
                  <Text style={{ fontSize: px(20), fontWeight: '600', color: C.slate }} numberOfLines={2}>{a.texto || tx(idioma, 'adSampleSub')}</Text>
                </View>
              </>
            )}
          <View pointerEvents="none" style={{ position: 'absolute', right: px(14), top: px(10), backgroundColor: 'rgba(15,23,42,0.72)', borderRadius: px(14), paddingHorizontal: px(12), height: px(34), flexDirection: 'row', alignItems: 'center' }}>
            <Icone n="clock" size={px(18)} color={C.white} />
            <Text style={{ marginLeft: px(6), fontSize: px(16), fontWeight: '900', color: C.white }}>{tx(idioma, 'adHold')}</Text>
          </View>
          {/* barrinha crescendo enquanto segura */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: px(14), backgroundColor: segurando ? 'rgba(15,23,42,0.12)' : 'transparent' }}>
            <Animated.View style={{ height: '100%', backgroundColor: '#2563EB', width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
          </View>
        </Pressable>
      </View>
    </AlvoTour>
  );
}

// ------------------------------------------------------------------ COMO ESTOU?
/** Botão "Como estou?" (para a barra de baixo, junto das abas). A criança escolhe o rostinho; a voz fala "Estou feliz". */
export function BotaoComoEstou({ largura = px(140), altura = px(118), raio = px(22) }: { largura?: number; altura?: number; raio?: number }) {
  const { idioma, estado } = useRotina();
  const [aberto, setAberto] = useState(false);
  if (estado.config.comoEstou === false) return null;
  return (
    <AlvoTour id="comoEstou">
      <Pressable onPress={() => setAberto(true)} accessibilityRole="button" accessibilityLabel={tx(idioma, 'howFeel')}
        style={{ width: largura, height: altura, borderRadius: raio, borderWidth: 1.2, borderColor: '#F472B6', backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: Math.round(largura * 0.26) }}>😊</Text>
        <Text numberOfLines={2} adjustsFontSizeToFit style={{ fontSize: 8.5, lineHeight: 10, fontWeight: '900', color: '#BE185D', marginTop: 2, textAlign: 'center' }}>{tx(idioma, 'howFeel').toUpperCase()}</Text>
      </Pressable>
      <PainelComoEstou visivel={aberto} fechar={() => setAberto(false)} />
    </AlvoTour>
  );
}

export function PainelComoEstou({ visivel, fechar }: { visivel: boolean; fechar: () => void }) {
  const { idioma, falar, registrarSentimento } = useRotina();
  return (
    <Modal transparent visible={visivel} animationType="slide" onRequestClose={fechar}>
      <Pressable onPress={fechar} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
        <Pressable style={{ backgroundColor: C.white, borderTopLeftRadius: px(48), borderTopRightRadius: px(48), padding: px(30), paddingBottom: px(50) }}>
          <Text style={{ fontSize: px(40), fontWeight: '900', color: C.ink, textAlign: 'center' }}>{tx(idioma, 'howFeel')}</Text>
          <Text style={{ fontSize: px(22), fontWeight: '700', color: C.slate, textAlign: 'center', marginTop: px(4) }}>{tx(idioma, 'howFeelSub')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: px(24) }}>
            {SENTIMENTOS.map((s) => (
              <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`${tx(idioma, 'iFeel')} ${s.r[idioma]}`}
                onPress={() => { registrarSentimento(s.id); falar(`${tx(idioma, 'iFeel')} ${s.r[idioma]}`); fechar(); }}
                style={({ pressed }) => [{ width: px(230), height: px(200), margin: px(10), borderRadius: px(36), borderWidth: px(4), borderColor: s.cor, backgroundColor: s.cor + '1A', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                <Text style={{ fontSize: px(90) }}>{s.emoji}</Text>
                <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink, textTransform: 'uppercase', marginTop: px(4) }}>{s.r[idioma]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
