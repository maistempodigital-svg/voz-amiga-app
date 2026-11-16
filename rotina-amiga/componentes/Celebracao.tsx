// Festa curta (+estrelas) — some sozinha, não leva a criança para outra tela.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { C, Icone, sombra, px } from './ui';

/** v11: o pop-up de comemoração foi desligado (atrapalhava). Fica só o selo pequeno no botão PRÊMIOS. */
export function Celebracao() {
  return null;
}

export function CelebracaoAntiga() {
  const { celebracao, limparCelebracao } = useRotina();
  const esc = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!celebracao) return;
    esc.setValue(0);
    Animated.spring(esc, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
    const h = setTimeout(limparCelebracao, 2600);
    return () => clearTimeout(h);
  }, [celebracao, esc, limparCelebracao]);
  if (!celebracao) return null;
  return (
    <Pressable onPress={limparCelebracao} style={{ position: 'absolute', left: px(0), right: px(0), top: px(0), bottom: px(0), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.35)', zIndex: 1000, elevation: 50 }}>
      <Animated.View style={[{ backgroundColor: C.white, borderRadius: px(57.5), paddingVertical: px(45), paddingHorizontal: px(54.5), alignItems: 'center', minWidth: px(400), transform: [{ scale: esc }] }, sombra(16)]}>
        <Text style={{ fontSize: px(102.5) }}>{celebracao.emoji || '🎉'}</Text>
        <Text style={{ fontSize: px(45), fontWeight: '900', color: C.ink, marginTop: px(9.5), textAlign: 'center' }}>{celebracao.titulo}</Text>
        {celebracao.estrelas > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(22.5), backgroundColor: '#FEF3C7', borderRadius: px(48), paddingHorizontal: px(35), height: px(86.5) }}>
            <Icone f="mci" n="star-four-points" size={px(45)} color={C.starDark} />
            <Text style={{ fontSize: px(45), fontWeight: '900', color: C.starDark, marginLeft: px(13) }}>+{celebracao.estrelas}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function Aviso() {
  const { aviso } = useRotina();
  if (!aviso) return null;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: px(64), left: px(25.5), right: px(25.5), backgroundColor: C.ink, borderRadius: px(35), padding: px(25.5), zIndex: 999, elevation: 40 }, sombra(10)]}>
      <Text style={{ color: C.white, fontSize: px(27), fontWeight: '800', textAlign: 'center' }}>{aviso}</Text>
    </View>
  );
}
