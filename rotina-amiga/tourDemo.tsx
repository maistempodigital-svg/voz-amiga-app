// Mini demonstrações animadas do tour (tipo GIF): mostram o que acontece ao usar cada botão.
// Feitas só com Views + Animated (sem vídeo, sem pacote extra), repetem em loop.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { C, px } from './componentes/ui';

export type TipoDemo =
  | 'tocar' | 'aba' | 'frase' | 'teclado' | 'segurar2' | 'segurar5' | 'travar' | 'rotina' | 'anuncio'
  | 'criar' | 'foto' | 'banco' | 'picto' | 'audio' | 'salvar' | 'editar' | 'excluir' | 'pacote'
  | 'relatorio' | 'whatsapp' | 'premios' | 'metas' | 'definicoes' | 'idioma' | 'tamanho' | 'voz' | 'volume'
  | 'dias' | 'horario' | 'timer' | 'tour' | 'crise' | 'sentimento' | 'ajuda' | 'plano';

const ND = Platform.OS !== 'web';

/** Linha do tempo 0→1 em loop. */
function useLoop(ms: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: false }),
      Animated.delay(400),
    ]));
    v.setValue(0);
    a.start();
    return () => a.stop();
  }, [ms, v]);
  return v;
}
const faixa = (v: Animated.Value, pontos: number[], valores: (number | string)[]) => v.interpolate({ inputRange: pontos, outputRange: valores as never, extrapolate: 'clamp' });

const Dedo = ({ x, y, esc = 1 }: { x: Animated.AnimatedInterpolation<number> | number; y: Animated.AnimatedInterpolation<number> | number; esc?: Animated.AnimatedInterpolation<number> | number }) => (
  <Animated.Text style={{ position: 'absolute', fontSize: px(52), left: x as never, top: y as never, transform: [{ scale: esc as never }] }}>👆</Animated.Text>
);
const Cartao = ({ e, t, cor = '#2563EB', w = px(96) }: { e: string; t: string; cor?: string; w?: number }) => (
  <View style={{ width: w, height: w, borderRadius: px(18), borderWidth: px(3), borderColor: cor, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: w * 0.4 }}>{e}</Text>
    <Text style={{ fontSize: w * 0.13, fontWeight: '900', color: '#1E293B' }}>{t}</Text>
  </View>
);
const Balao = ({ texto, op }: { texto: string; op: Animated.AnimatedInterpolation<number> }) => (
  <Animated.View style={{ position: 'absolute', right: px(16), top: px(14), opacity: op, transform: [{ scale: op }], backgroundColor: '#22C55E', borderRadius: px(20), paddingHorizontal: px(16), paddingVertical: px(8) }}>
    <Text style={{ color: C.white, fontWeight: '900', fontSize: px(22) }}>🔊 {texto}</Text>
  </Animated.View>
);
const Barra = ({ prog, cor = '#2563EB', rot }: { prog: Animated.AnimatedInterpolation<number>; cor?: string; rot: string }) => (
  <View style={{ width: px(200), height: px(70), borderRadius: px(16), borderWidth: px(3), borderColor: cor, backgroundColor: C.white, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: cor + '44' }} />
    <Text style={{ fontWeight: '900', fontSize: px(20), color: cor }}>{rot}</Text>
  </View>
);

const TECLAS_DEMO = [{ l: 'O' }, { l: 'I' }, { l: '!' }];

export function MiniDemo({ tipo, idioma }: { tipo: TipoDemo; idioma: 'pt' | 'en' | 'es' }) {
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt);
  const segurando = tipo === 'segurar2' || tipo === 'anuncio' || tipo === 'premios' || tipo === 'segurar5' || tipo === 'travar';
  const dur = tipo === 'anuncio' ? 5800 : tipo === 'segurar5' || tipo === 'travar' ? 3800 : tipo === 'frase' || tipo === 'rotina' || tipo === 'criar' ? 4200 : 3000;
  const v = useLoop(dur);
  const caixa = { height: px(250), borderRadius: px(26), backgroundColor: '#F1F5F9', marginTop: px(16), overflow: 'hidden' as const, alignItems: 'center' as const, justifyContent: 'center' as const };
  const tap = (t0: number) => faixa(v, [t0 - 0.06, t0, t0 + 0.06], [1, 0.75, 1]);

  if (tipo === 'tocar' || tipo === 'editar' || tipo === 'excluir') {
    const op = faixa(v, [0.4, 0.5, 0.85, 0.95], [0, 1, 1, 0]);
    const some = tipo === 'excluir' ? faixa(v, [0.5, 0.65], [1, 0]) : 1;
    return (
      <View style={caixa}>
        <Animated.View style={{ opacity: some as never, transform: [{ scale: tipo === 'excluir' ? (some as never) : 1 }] }}>
          <Cartao e="💧" t={L('ÁGUA', 'WATER', 'AGUA')} />
          {tipo !== 'tocar' ? <View style={{ position: 'absolute', top: -px(10), right: -px(10), width: px(40), height: px(40), borderRadius: px(20), backgroundColor: tipo === 'editar' ? '#7E22CE' : '#E11D48', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: px(20) }}>{tipo === 'editar' ? '✎' : '🗑'}</Text></View> : null}
        </Animated.View>
        {tipo === 'tocar' ? <Balao texto={L('Água!', 'Water!', '¡Agua!')} op={op} /> : null}
        {tipo === 'editar' ? <Animated.View style={{ position: 'absolute', right: px(14), top: px(18), opacity: op, backgroundColor: C.white, borderRadius: px(14), padding: px(10), borderWidth: px(2), borderColor: '#E9D5FF' }}><Text style={{ fontWeight: '900', color: '#7E22CE', fontSize: px(18) }}>{L('Editar prancha', 'Edit card', 'Editar tarjeta')}</Text></Animated.View> : null}
        <Dedo x={faixa(v, [0, 0.4], [px(260), px(150)])} y={faixa(v, [0, 0.4], [px(190), px(130)])} esc={tap(0.45)} />
      </View>
    );
  }
  if (tipo === 'aba') {
    const troca = faixa(v, [0.45, 0.55], [0, 1]);
    return (
      <View style={caixa}>
        <View style={{ flexDirection: 'row', position: 'absolute', top: px(20) }}>
          <Animated.View style={{ paddingHorizontal: px(16), height: px(48), borderRadius: px(12), justifyContent: 'center', marginRight: px(10), borderWidth: px(3), borderColor: '#DC2626', backgroundColor: troca.interpolate({ inputRange: [0, 1], outputRange: ['#DC2626', '#FEF2F2'] }) }}><Text style={{ fontWeight: '900', fontSize: px(16), color: '#7F1D1D' }}>{L('FAVORITOS', 'FAVORITES', 'FAVORITOS')}</Text></Animated.View>
          <Animated.View style={{ paddingHorizontal: px(16), height: px(48), borderRadius: px(12), justifyContent: 'center', borderWidth: px(3), borderColor: '#CA8A04', backgroundColor: troca.interpolate({ inputRange: [0, 1], outputRange: ['#FEFCE8', '#FACC15'] }) }}><Text style={{ fontWeight: '900', fontSize: px(16), color: '#713F12' }}>{L('PESSOAS', 'PEOPLE', 'PERSONAS')}</Text></Animated.View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: px(60) }}>
          <Animated.View style={{ opacity: troca.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), flexDirection: 'row', position: 'absolute' }}><Cartao e="💧" t="" w={px(80)} /><View style={{ width: px(10) }} /><Cartao e="🍎" t="" w={px(80)} /></Animated.View>
          <Animated.View style={{ opacity: troca, flexDirection: 'row' }}><Cartao e="👩" t="" w={px(80)} cor="#CA8A04" /><View style={{ width: px(10) }} /><Cartao e="👨" t="" w={px(80)} cor="#CA8A04" /></Animated.View>
        </View>
        <Dedo x={faixa(v, [0, 0.4], [px(330), px(250)])} y={faixa(v, [0, 0.4], [px(150), px(40)])} esc={tap(0.47)} />
      </View>
    );
  }
  if (tipo === 'frase' || tipo === 'teclado') {
    const pal = tipo === 'frase' ? [L('EU', 'I', 'YO'), L('QUERO', 'WANT', 'QUIERO'), L('ÁGUA', 'WATER', 'AGUA')] : ['O', 'Oi', L('Oi!', 'Hi!', '¡Hola!')];
    const n = faixa(v, [0, 0.2, 0.21, 0.4, 0.41, 0.6, 0.61], [0, 0, 1, 1, 2, 2, 3]);
    const falar = faixa(v, [0.7, 0.75, 0.8], [1, 0.8, 1]);
    const estrela = faixa(v, [0.8, 0.88, 1], [0, 1, 1]);
    return (
      <View style={caixa}>
        <View style={{ position: 'absolute', top: px(18), left: px(16), right: px(16), height: px(60), borderRadius: px(16), backgroundColor: C.white, borderWidth: px(2), borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', paddingHorizontal: px(14) }}>
          {tipo === 'frase'
            ? pal.map((p, i) => <Animated.Text key={i} style={{ fontSize: px(22), fontWeight: '900', color: C.ink, marginRight: px(8), opacity: n.interpolate({ inputRange: [i, i + 0.01], outputRange: [0, 1], extrapolate: 'clamp' }) }}>{p}</Animated.Text>)
            : TECLAS_DEMO.map((k, i) => <Animated.Text key={i} style={{ fontSize: px(26), fontWeight: '900', color: C.ink, opacity: n.interpolate({ inputRange: [i, i + 0.01], outputRange: [0, 1], extrapolate: 'clamp' }) }}>{k.l}</Animated.Text>)}
          <View style={{ flex: 1 }} />
          <Animated.View style={{ backgroundColor: '#22C55E', borderRadius: px(12), paddingHorizontal: px(14), height: px(40), justifyContent: 'center', transform: [{ scale: falar }] }}><Text style={{ color: C.white, fontWeight: '900', fontSize: px(17) }}>{L('FALAR', 'SPEAK', 'HABLAR')}</Text></Animated.View>
        </View>
        {tipo === 'frase' ? (
          <View style={{ flexDirection: 'row', marginTop: px(70) }}>
            <Cartao e="🙋" t={pal[0]} w={px(80)} /><View style={{ width: px(10) }} /><Cartao e="🙏" t={pal[1]} w={px(80)} /><View style={{ width: px(10) }} /><Cartao e="💧" t={pal[2]} w={px(80)} />
          </View>
        ) : <View style={{ position: 'absolute', left: 0, right: 0, top: px(100), alignItems: 'center' }}>
            {[['Q', 'W', 'E', 'R', 'T'], ['A', 'O', 'I', 'L', '!']].map((linha, li) => (
              <View key={li} style={{ flexDirection: 'row' }}>
                {linha.map((k) => { const c = 'AEIOU'.includes(k) ? ['#FCE7F3', '#F9A8D4', '#BE185D'] : k === '!' ? ['#FEF9C3', '#FDE047', '#A16207'] : li === 0 ? ['#DBEAFE', '#93C5FD', '#1D4ED8'] : ['#DCFCE7', '#86EFAC', '#15803D'];
                  return <View key={k} style={{ width: px(56), height: px(56), borderRadius: px(12), backgroundColor: c[0], borderBottomWidth: px(5), borderColor: c[1], margin: px(4), alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', fontSize: px(24), color: c[2] }}>{k}</Text></View>; })}
              </View>
            ))}
          </View>}
        <Animated.Text style={{ position: 'absolute', right: px(26), bottom: px(18), fontSize: px(34), fontWeight: '900', color: '#B45309', opacity: estrela }}>⭐ +1</Animated.Text>
        <Dedo x={faixa(v, [0, 0.2, 0.4, 0.6, 0.7], tipo === 'frase' ? [px(90), px(90), px(180), px(270), px(330)] : [px(198), px(198), px(262), px(326), px(330)])} y={tipo === 'frase' ? faixa(v, [0, 0.6, 0.7], [px(150), px(150), px(30)]) : faixa(v, [0, 0.6, 0.7], [px(176), px(176), px(30)])} esc={faixa(v, [0.18, 0.2, 0.22, 0.38, 0.4, 0.42, 0.58, 0.6, 0.62, 0.73, 0.75, 0.77], [1, 0.75, 1, 1, 0.75, 1, 1, 0.75, 1, 1, 0.75, 1])} />
      </View>
    );
  }
  if (segurando) {
    const fimHold = tipo === 'anuncio' ? 0.82 : tipo === 'segurar5' || tipo === 'travar' ? 0.72 : 0.7;
    const prog = faixa(v, [0.1, fimHold], [0, 1]);
    const conta = faixa(v, [fimHold, fimHold + 0.05], [0, 1]);
    const seg = tipo === 'anuncio' ? 5 : tipo === 'segurar5' || tipo === 'travar' ? 3 : 2;
    const rot = tipo === 'anuncio' ? L('ANÚNCIO', 'AD', 'ANUNCIO') : tipo === 'premios' ? L('PRÊMIOS', 'PRIZES', 'PREMIOS') : tipo === 'travar' ? L('TRAVAR APP', 'LOCK APP', 'BLOQUEAR') : L('AJUSTES', 'SETTINGS', 'AJUSTES');
    const cont = faixa(v, [0.1, fimHold], [0, seg]);
    return (
      <View style={caixa}>
        <Barra prog={prog} rot={rot} cor={tipo === 'premios' ? '#D97706' : tipo === 'travar' ? '#F59E0B' : '#2563EB'} />
        <Animated.Text style={{ marginTop: px(10), fontSize: px(22), fontWeight: '900', color: C.slate2, opacity: faixa(v, [0.08, 0.12, fimHold], [0, 1, 1]) }}>✋ {L('segurando…', 'holding…', 'manteniendo…')} {seg}s</Animated.Text>
        <Animated.View style={{ position: 'absolute', opacity: conta, transform: [{ scale: conta }], backgroundColor: C.white, borderRadius: px(20), padding: px(16), borderWidth: px(3), borderColor: '#22C55E' }}>
          {seg === 3 ? <Text style={{ fontSize: px(34), fontWeight: '900', color: C.ink }}>4 + 3 = <Text style={{ color: '#16A34A' }}>7 ✓</Text></Text> : <Text style={{ fontSize: px(28), fontWeight: '900', color: '#16A34A' }}>✓ {L('Abriu!', 'Opened!', '¡Abrió!')}</Text>}
          {tipo === 'travar' ? <Text style={{ fontSize: px(20), fontWeight: '900', color: '#B45309', textAlign: 'center', marginTop: px(6) }}>🔒 {L('App fixado', 'App pinned', 'App fijada')}</Text> : null}
        </Animated.View>
        <Dedo x={px(250)} y={faixa(v, [0, 0.1], [px(190), px(70)])} esc={faixa(v, [0.08, 0.12, fimHold, fimHold + 0.04], [1, 0.8, 0.8, 1])} />
      </View>
    );
  }
  if (tipo === 'rotina') {
    const fase = faixa(v, [0.3, 0.32], [0, 1]);
    const sai = faixa(v, [0.62, 0.8], [0, 1]);
    return (
      <View style={caixa}>
        <Animated.View style={{ width: px(330), borderRadius: px(26), borderWidth: px(3), borderColor: '#34D399', backgroundColor: '#ECFDF5', padding: px(14), opacity: sai.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateX: sai.interpolate({ inputRange: [0, 1], outputRange: [0, px(420)] }) }] }}>
          <Text style={{ fontWeight: '900', color: '#047857', fontSize: px(16) }}>{L('PRÓXIMA ETAPA', 'NEXT STEP', 'PRÓXIMO PASO')}</Text>
          <Text style={{ fontWeight: '900', color: C.ink, fontSize: px(24) }}>🪥 {L('ESCOVAR DENTES', 'BRUSH TEETH', 'CEPILLAR DIENTES')}</Text>
          <View style={{ marginTop: px(10), height: px(50), borderRadius: px(25), backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.Text style={{ position: 'absolute', color: C.white, fontWeight: '900', fontSize: px(20), opacity: fase.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>▶ {L('COMEÇAR', 'START', 'EMPEZAR')}</Animated.Text>
            <Animated.Text style={{ color: '#052E1B', fontWeight: '900', fontSize: px(20), opacity: fase }}>✓ {L('TERMINEI', 'I DID IT', 'TERMINÉ')}</Animated.Text>
          </View>
        </Animated.View>
        <Animated.Text style={{ position: 'absolute', fontSize: px(30), fontWeight: '900', color: '#B45309', opacity: faixa(v, [0.6, 0.66, 0.9, 1], [0, 1, 1, 0]) }}>🎉 ⭐ +1</Animated.Text>
        <Dedo x={px(170)} y={faixa(v, [0, 0.25, 0.3, 0.55, 0.6], [px(200), px(150), px(150), px(150), px(150)])} esc={faixa(v, [0.27, 0.3, 0.33, 0.55, 0.58, 0.61], [1, 0.75, 1, 1, 0.75, 1])} />
      </View>
    );
  }
  if (tipo === 'criar' || tipo === 'foto' || tipo === 'banco' || tipo === 'picto' || tipo === 'salvar') {
    const novo = faixa(v, [0.6, 0.7], [0, 1]);
    const img = tipo === 'banco' ? '🧃' : tipo === 'picto' ? '🖼️' : tipo === 'foto' ? '📷' : '🙏';
    const btn = tipo === 'banco' ? L('BANCO', 'BANK', 'BANCO') : tipo === 'picto' ? 'PICTO' : tipo === 'foto' ? L('CÂMERA', 'CAMERA', 'CÁMARA') : L('SALVAR', 'SAVE', 'GUARDAR');
    return (
      <View style={caixa}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ height: px(56), paddingHorizontal: px(20), borderRadius: px(28), backgroundColor: tipo === 'picto' ? '#F59E0B' : tipo === 'banco' ? '#3B82F6' : tipo === 'foto' ? '#14B8A6' : '#22C55E', justifyContent: 'center' }}><Text style={{ color: C.white, fontWeight: '900', fontSize: px(19) }}>{btn}</Text></View>
          <Text style={{ fontSize: px(40), marginHorizontal: px(16) }}>→</Text>
          <Animated.View style={{ opacity: novo, transform: [{ scale: novo }] }}><Cartao e={img} t={tipo === 'criar' || tipo === 'salvar' ? L('OBRIGADO', 'THANKS', 'GRACIAS') : ''} cor="#22C55E" /></Animated.View>
        </View>
        {tipo === 'foto' ? <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: C.white, opacity: faixa(v, [0.45, 0.5, 0.58], [0, 0.9, 0]) }} /> : null}
        <Dedo x={px(80)} y={faixa(v, [0, 0.4], [px(200), px(110)])} esc={tap(0.45)} />
      </View>
    );
  }
  if (tipo === 'audio' || tipo === 'voz') {
    const onda = faixa(v, [0, 0.25, 0.5, 0.75, 1], [0.6, 1.2, 0.7, 1.3, 0.6]);
    return (
      <View style={caixa}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: px(90), height: px(90), borderRadius: px(45), backgroundColor: tipo === 'audio' ? '#EF4444' : '#0EA5E9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: px(42) }}>{tipo === 'audio' ? '🎙️' : '🔊'}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: px(20) }}>
            {[0.6, 1, 0.8, 1.2, 0.7].map((k, i) => <Animated.View key={i} style={{ width: px(14), marginHorizontal: px(4), borderRadius: px(7), backgroundColor: tipo === 'audio' ? '#EF4444' : '#0EA5E9', height: px(60 * k), transform: [{ scaleY: onda }] }} />)}
          </View>
        </View>
        <Text style={{ marginTop: px(18), fontWeight: '900', fontSize: px(20), color: C.slate2 }}>{tipo === 'audio' ? L('“Obrigado!” — com a sua voz', '“Thank you!” — in your voice', '“¡Gracias!” — con tu voz') : L('Voz do celular', 'Phone voice', 'Voz del celular')}</Text>
      </View>
    );
  }
  if (tipo === 'pacote') {
    return (
      <View style={caixa}>
        <Text style={{ fontSize: px(60), position: 'absolute', top: px(16) }}>📦</Text>
        <View style={{ flexDirection: 'row', marginTop: px(90) }}>
          {['🍎', '🍌', '🍇', '🍓'].map((e, i) => (
            <Animated.View key={e} style={{ marginHorizontal: px(5), opacity: faixa(v, [0.2 + i * 0.12, 0.3 + i * 0.12], [0, 1]), transform: [{ translateY: faixa(v, [0.2 + i * 0.12, 0.3 + i * 0.12], [-px(60), 0]) }] }}><Cartao e={e} t="" w={px(70)} cor="#F59E0B" /></Animated.View>
          ))}
        </View>
      </View>
    );
  }
  if (tipo === 'relatorio' || tipo === 'whatsapp') {
    return (
      <View style={caixa}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: px(140) }}>
          {[0.3, 0.45, 0.4, 0.65, 0.8, 1].map((k, i) => <Animated.View key={i} style={{ width: px(30), marginHorizontal: px(6), borderRadius: px(8), backgroundColor: i % 2 ? '#F97316' : '#10B981', height: faixa(v, [0, 0.6], [px(6), px(140 * k)]) }} />)}
        </View>
        <Animated.View style={{ marginTop: px(14), flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', borderRadius: px(22), paddingHorizontal: px(18), height: px(44), opacity: tipo === 'whatsapp' ? faixa(v, [0.6, 0.7], [0.3, 1]) : 1 }}>
          <Text style={{ color: C.white, fontWeight: '900', fontSize: px(18) }}>📤 WhatsApp {L('→ profissional', '→ professional', '→ profesional')}</Text>
        </Animated.View>
      </View>
    );
  }
  if (tipo === 'metas') {
    return (
      <View style={caixa}>
        <Text style={{ fontWeight: '900', fontSize: px(22), color: C.ink }}>🎯 {L('Falar 5 frases', 'Say 5 sentences', 'Decir 5 frases')}</Text>
        <View style={{ width: px(300), height: px(26), borderRadius: px(13), backgroundColor: '#E0F2FE', marginTop: px(14), overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', backgroundColor: '#0EA5E9', width: faixa(v, [0, 0.7], ['0%', '100%']) }} />
        </View>
        <Animated.Text style={{ marginTop: px(14), fontSize: px(30), fontWeight: '900', color: '#B45309', opacity: faixa(v, [0.7, 0.8], [0, 1]) }}>🏅 ⭐ +2</Animated.Text>
      </View>
    );
  }
  if (tipo === 'definicoes' || tipo === 'tamanho' || tipo === 'volume' || tipo === 'idioma') {
    const k = faixa(v, [0.1, 0.7], [0, 1]);
    if (tipo === 'idioma') {
      return (
        <View style={caixa}>
          <View style={{ flexDirection: 'row' }}>
            {['🇧🇷', '🇺🇸', '🇪🇸'].map((f, i) => <Animated.View key={f} style={{ marginHorizontal: px(10), padding: px(10), borderRadius: px(16), borderWidth: px(3), borderColor: faixa(v, [i / 3, i / 3 + 0.02, (i + 1) / 3 - 0.02, (i + 1) / 3], ['#E2E8F0', '#22C55E', '#22C55E', '#E2E8F0']) as never, backgroundColor: C.white }}><Text style={{ fontSize: px(46) }}>{f}</Text></Animated.View>)}
          </View>
          <Text style={{ marginTop: px(16), fontWeight: '900', fontSize: px(22), color: C.slate2 }}>Português · English · Español</Text>
        </View>
      );
    }
    return (
      <View style={caixa}>
        {tipo === 'tamanho' ? (
          <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', width: px(260), justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <Animated.View key={i} style={{ margin: px(4), width: faixa(v, [0.1, 0.7], [px(110), px(70)]), height: faixa(v, [0.1, 0.7], [px(60), px(40)]), borderRadius: px(10), borderWidth: px(2), borderColor: '#2563EB', backgroundColor: C.white }} />)}
          </Animated.View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: px(20), color: C.slate2, marginRight: px(14) }}>{tipo === 'volume' ? '🔈' : L('Sugestões', 'Suggestions', 'Sugerencias')}</Text>
            <View style={{ width: px(90), height: px(48), borderRadius: px(24), backgroundColor: '#CBD5E1', justifyContent: 'center', padding: px(4) }}>
              <Animated.View style={{ width: px(40), height: px(40), borderRadius: px(20), backgroundColor: C.white, transform: [{ translateX: k.interpolate({ inputRange: [0, 1], outputRange: [0, px(42)] }) }] }} />
            </View>
            {tipo === 'volume' ? <Text style={{ fontSize: px(26), marginLeft: px(14) }}>🔊</Text> : <Animated.Text style={{ marginLeft: px(14), fontWeight: '900', color: '#16A34A', fontSize: px(20), opacity: k }}>{L('ATIVADAS', 'ON', 'ACTIVADAS')}</Animated.Text>}
          </View>
        )}
        <Text style={{ marginTop: px(14), fontWeight: '800', color: C.slate, fontSize: px(18) }}>{tipo === 'tamanho' ? L('mais ou menos botões por linha', 'more or fewer buttons per row', 'más o menos botones por fila') : ''}</Text>
      </View>
    );
  }
  if (tipo === 'dias' || tipo === 'horario' || tipo === 'timer') {
    return (
      <View style={caixa}>
        {tipo === 'dias' ? (
          <View style={{ flexDirection: 'row' }}>
            {(idioma === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : idioma === 'es' ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']).map((d, i) => (
              <Animated.View key={i} style={{ width: px(44), height: px(44), borderRadius: px(22), margin: px(3), alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 || i === 6 ? '#E2E8F0' : (faixa(v, [i * 0.1, i * 0.1 + 0.05], ['#E2E8F0', '#10B981']) as never) }}>
                <Text style={{ fontWeight: '900', color: C.ink }}>{d}</Text>
              </Animated.View>
            ))}
          </View>
        ) : tipo === 'horario' ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: px(60), fontWeight: '900', color: C.ink }}>⏰ 07:30</Text>
            <Animated.Text style={{ fontWeight: '900', color: '#B45309', fontSize: px(20), opacity: faixa(v, [0.4, 0.5], [0, 1]) }}>🔒 {L('só começa às 07:30', 'starts only at 07:30', 'empieza a las 07:30')}</Animated.Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: px(300), height: px(26), borderRadius: px(13), backgroundColor: '#D1FAE5', overflow: 'hidden' }}><Animated.View style={{ height: '100%', width: faixa(v, [0, 1], ['0%', '100%']), backgroundColor: '#10B981' }} /></View>
            <Text style={{ marginTop: px(12), fontSize: px(44), fontWeight: '900', color: '#047857' }}>⏳ 5:00</Text>
            <Text style={{ fontWeight: '800', color: C.slate2, fontSize: px(18) }}>{L('termina sozinha no fim do tempo', 'ends by itself when time is up', 'termina sola al final del tiempo')}</Text>
          </View>
        )}
      </View>
    );
  }
  if (tipo === 'crise' || tipo === 'sentimento' || tipo === 'ajuda' || tipo === 'plano') {
    const k = faixa(v, [0.15, 0.35], [0, 1]);
    const k2 = faixa(v, [0.45, 0.65], [0, 1]);
    if (tipo === 'sentimento') {
      return (
        <View style={caixa}>
          <View style={{ flexDirection: 'row' }}>
            {['😊', '😢', '😠', '😴'].map((e, i) => (
              <Animated.View key={e} style={{ width: px(84), height: px(84), margin: px(6), borderRadius: px(20), borderWidth: px(3), borderColor: i === 0 ? '#22C55E' : '#CBD5E1', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', transform: [{ scale: i === 0 ? tap(0.4) : 1 }] }}>
                <Text style={{ fontSize: px(44) }}>{e}</Text>
              </Animated.View>
            ))}
          </View>
          <Balao texto={L('Estou feliz', 'I feel happy', 'Estoy feliz')} op={k2} />
          <Dedo x={faixa(v, [0, 0.35], [px(260), px(110)])} y={faixa(v, [0, 0.35], [px(190), px(120)])} esc={tap(0.4)} />
        </View>
      );
    }
    if (tipo === 'crise') {
      return (
        <View style={caixa}>
          <View style={{ backgroundColor: C.white, borderRadius: px(20), padding: px(16), width: px(360) }}>
            <Text style={{ fontWeight: '900', fontSize: px(20), color: C.ink }}>🌧️ {L('Registrar momento', 'Record moment', 'Registrar momento')}</Text>
            <View style={{ flexDirection: 'row', marginTop: px(10) }}>
              {[1, 2, 3, 4, 5].map((n) => <Animated.View key={n} style={{ width: px(44), height: px(44), marginRight: px(8), borderRadius: px(22), backgroundColor: n <= 3 ? '#F97316' : '#E2E8F0', opacity: n <= 3 ? k : 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontWeight: '900' }}>{n}</Text></Animated.View>)}
            </View>
            <Animated.Text style={{ marginTop: px(10), fontWeight: '800', color: C.slate2, fontSize: px(17), opacity: k2 }}>🔊 {L('Barulho · Lugar calmo ajudou', 'Noise · Quiet place helped', 'Ruido · Lugar tranquilo ayudó')}</Animated.Text>
          </View>
          <Animated.Text style={{ marginTop: px(12), fontWeight: '900', color: '#4338CA', fontSize: px(19), opacity: faixa(v, [0.7, 0.85], [0, 1]) }}>📊 → {L('relatório', 'report', 'reporte')}</Animated.Text>
        </View>
      );
    }
    if (tipo === 'plano') {
      return (
        <View style={caixa}>
          <Text style={{ fontSize: px(60) }}>👑</Text>
          <Animated.Text style={{ fontSize: px(24), fontWeight: '900', color: '#6D28D9', opacity: k }}>{L('Plano Completo', 'Full Plan', 'Plan Completo')}</Animated.Text>
          <Animated.Text style={{ marginTop: px(6), fontSize: px(18), fontWeight: '800', color: C.slate2, opacity: k2 }}>{L('sem anúncio · rotinas e relatório completos', 'no ads · full routines and report', 'sin anuncios · rutinas y reporte completos')}</Animated.Text>
        </View>
      );
    }
    return (
      <View style={caixa}>
        <Text style={{ fontSize: px(60) }}>❓</Text>
        <Animated.Text style={{ fontSize: px(22), fontWeight: '900', color: '#0369A1', opacity: k }}>{L('Como funciona cada parte', 'How each part works', 'Cómo funciona cada parte')}</Animated.Text>
      </View>
    );
  }
  // 'premios' (loja) e 'tour'
  return (
    <View style={caixa}>
      <Text style={{ fontSize: px(70) }}>{tipo === 'tour' ? '🧭' : '🎁'}</Text>
      <Animated.Text style={{ fontSize: px(28), fontWeight: '900', color: '#B45309', opacity: faixa(v, [0.3, 0.5], [0, 1]) }}>{tipo === 'tour' ? L('Rever o passo a passo', 'Replay the walkthrough', 'Ver el recorrido de nuevo') : '⭐ 10 → 📺'}</Animated.Text>
    </View>
  );
}
void ND;
