// "Segure para ativar" — igual aos botões de AJUSTES / TRAVAR APP do Voz.
// Enquanto segura, uma faixa enche o botão; ao completar o tempo, executa.
// Toque rápido não faz nada (ou chama aoTocar, se for passado).
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';

export function Segurar({ ms = 2000, aoCompletar, aoTocar, children, style, corFaixa = 'rgba(15,23,42,0.14)', rotulo, desativado }: {
  ms?: number;
  aoCompletar: () => void;
  aoTocar?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  corFaixa?: string;
  rotulo?: string;
  desativado?: boolean;
}) {
  const prog = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completou = useRef(false);
  const parar = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    prog.stopAnimation();
    Animated.timing(prog, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={`Segure ${Math.round(ms / 1000)} segundos`}
      disabled={desativado}
      onPressIn={() => {
        completou.current = false;
        prog.setValue(0);
        Animated.timing(prog, { toValue: 1, duration: ms, useNativeDriver: false }).start();
        timer.current = setTimeout(() => { completou.current = true; parar(); aoCompletar(); }, ms);
      }}
      onPressOut={parar}
      onPress={() => { if (!completou.current && aoTocar) aoTocar(); }}
      // sem menu de contexto / seleção de texto ao segurar
      {...(Platform.OS === 'web' ? { onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault() } : {})}
      style={[style, { overflow: 'hidden' }, Platform.OS === 'web' ? ({ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } as unknown as ViewStyle) : null]}
    >
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: corFaixa, width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center', flex: 1, alignSelf: 'stretch' }}>{children}</View>
    </Pressable>
  );
}
