// Componentes visuais no estilo do Rotina Amiga / Voz Amiga.
// Só usa React Native puro + @expo/vector-icons (já existem no Voz Amiga).
import React, { useRef } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Animated, Dimensions, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle,
} from 'react-native';
import { useRotina } from '../estado';
import { RolagemTour } from '../tourRolagem';

/**
 * Medidas: os números das telas são os pixels das capturas originais (900 px de largura).
 * px() converte para o tamanho do aparelho, mantendo a mesma proporção das telas do Rotina Amiga.
 */
const LARGURA = (() => {
  const w = Dimensions.get('window').width || 411;
  return Platform.OS === 'web' ? w : Math.min(w, 520);
})();
export const ESCALA = LARGURA / 900;
export const px = (n: number) => Math.round(n * ESCALA * 2) / 2;

export const C = {
  ink: '#0F172A',
  ink2: '#1E293B',
  slate: '#64748B',
  slate2: '#475569',
  faint: '#94A3B8',
  line: '#E2E8F0',
  line2: '#CBD5E1',
  bg: '#F8FAFC',
  bgBlue: '#F3F6FC',
  white: '#FFFFFF',
  blue: '#2563EB',
  blueSoft: '#DBEAFE',
  green: '#10B981',
  greenDark: '#047857',
  greenSoft: '#D1FAE5',
  red: '#E11D48',
  redSoft: '#FFE4E6',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
  star: '#FACC15',
  starDark: '#7C2D12',
  purple: '#8B5CF6',
  purpleSoft: '#F3E8FF',
};

export type IconeDef = { f: 'mci' | 'feather'; n: string };

export const Icone = ({ f = 'feather', n, size = px(60), color = C.ink }: { f?: 'mci' | 'feather'; n: string; size?: number; color?: string }) =>
  f === 'mci'
    ? <MaterialCommunityIcons name={n as never} size={size} color={color} />
    : <Feather name={n as never} size={size} color={color} />;

export const T = ({ children, s, style, n, ...rest }: { children?: React.ReactNode; s?: 'h1' | 'h2' | 'h3' | 'b' | 'p' | 'cap' | 'kick'; style?: StyleProp<TextStyle>; n?: number; selectable?: boolean }) => (
  <Text {...rest} numberOfLines={n} style={[estilosTexto[s || 'p'], style]}>{children}</Text>
);

const estilosTexto = StyleSheet.create({
  h1: { fontSize: px(47), fontWeight: '900', color: C.ink, letterSpacing: px(-1) },
  h2: { fontSize: px(30.5), fontWeight: '900', color: C.ink, letterSpacing: px(0) },
  h3: { fontSize: px(25), fontWeight: '800', color: C.ink },
  b: { fontSize: px(22), fontWeight: '800', color: C.ink },
  p: { fontSize: px(20.5), fontWeight: '500', color: C.slate2, lineHeight: px(29) },
  cap: { fontSize: px(16.5), fontWeight: '800', color: C.slate, letterSpacing: px(1), textTransform: 'uppercase' },
  kick: { fontSize: px(18), fontWeight: '900', color: C.slate, letterSpacing: px(2.5), textTransform: 'uppercase' },
});

export const sombra = (alt = 6, cor = '#0F172A', op = 0.1): ViewStyle => ({
  shadowColor: cor, shadowOpacity: op, shadowRadius: alt * 1.6, shadowOffset: { width: px(0), height: alt * 0.6 }, elevation: alt,
});

/** Botão com "afundar" ao tocar (efeito do Rotina Amiga). */
const PressAnim = Animated.createAnimatedComponent(Pressable);
export const Toque = ({ onPress, onLongPress, delayLongPress, disabled, style, children, rotulo }: {
  onPress?: () => void; onLongPress?: () => void; delayLongPress?: number; disabled?: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode; rotulo?: string;
}) => {
  const esc = useRef(new Animated.Value(1)).current;
  const ir = (v: number) => Animated.spring(esc, { toValue: v, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 6 }).start();
  return (
    <PressAnim
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={() => ir(0.96)}
      onPressOut={() => ir(1)}
      style={[style, { transform: [{ scale: esc }] }]}
    >
      {children}
    </PressAnim>
  );
};

export const Botao = ({ titulo, onPress, cor = C.blue, corTexto = C.white, borda, icone, disabled, style, alto = px(72.5), contorno }: {
  titulo: string; onPress?: () => void; cor?: string; corTexto?: string; borda?: string; icone?: IconeDef; disabled?: boolean; style?: StyleProp<ViewStyle>; alto?: number; contorno?: boolean;
}) => (
  <Toque onPress={onPress} disabled={disabled} rotulo={titulo} style={[
    { height: alto, borderRadius: alto / 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: px(22.5) },
    contorno ? { backgroundColor: C.white, borderWidth: px(2), borderColor: C.line } : { backgroundColor: cor, borderBottomWidth: borda ? 4 : 0, borderColor: borda },
    !contorno && !disabled ? sombra(5, cor, 0.25) : null,
    disabled ? { opacity: 0.45 } : null,
    style,
  ]}>
    {icone ? <View style={{ marginRight: px(12.5) }}><Icone f={icone.f} n={icone.n} size={px(25)} color={contorno ? C.slate2 : corTexto} /></View> : null}
    <Text style={{ color: contorno ? C.slate2 : corTexto, fontSize: Math.max(px(23.5), Math.round(alto * 0.3)), fontWeight: '900', letterSpacing: px(0.5), textTransform: 'uppercase' }} numberOfLines={1}>{titulo}</Text>
  </Toque>
);

export const Cartao = ({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ backgroundColor: C.white, borderRadius: px(37.5), borderWidth: px(2), borderColor: C.line, padding: px(25) }, sombra(4, '#0F172A', 0.08), style]}>{children}</View>
);

export const CaixaIcone = ({ icone, cor, fundo, tam = px(70), raio = px(22.5), size }: { icone: IconeDef; cor: string; fundo: string; tam?: number; raio?: number; size?: number }) => (
  <View style={{ width: tam, height: tam, borderRadius: raio, backgroundColor: fundo, alignItems: 'center', justifyContent: 'center' }}>
    <Icone f={icone.f} n={icone.n} size={size || tam * 0.46} color={cor} />
  </View>
);

export const Secao = ({ titulo, style }: { titulo: string; style?: StyleProp<TextStyle> }) => (
  <T s="kick" style={[{ marginTop: px(32.5), marginBottom: px(17.5), marginLeft: px(17.5), color: C.faint, fontSize: px(18) }, style]}>{titulo}</T>
);

export const Interruptor = ({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) => (
  <Pressable accessibilityRole="switch" accessibilityState={{ checked: valor }} onPress={() => onChange(!valor)} hitSlop={10}
    style={{ width: px(62.5), height: px(37.5), borderRadius: px(19), backgroundColor: valor ? '#60A5FA' : C.line2, justifyContent: 'center', paddingHorizontal: px(4) }}>
    <View style={[{ width: px(32.5), height: px(32.5), borderRadius: px(16), backgroundColor: C.white, alignSelf: valor ? 'flex-end' : 'flex-start' }, sombra(2)]} />
  </Pressable>
);

export const LinhaOpcao = ({ icone, cor, fundo, titulo, legenda, direita, onPress, destaque }: {
  icone: IconeDef; cor: string; fundo: string; titulo: string; legenda?: string; direita?: React.ReactNode; onPress?: () => void; destaque?: string;
}) => {
  const corpo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: px(22.5), paddingHorizontal: px(22.5), backgroundColor: destaque }}>
      <CaixaIcone icone={icone} cor={cor} fundo={fundo} tam={px(72.5)} raio={px(22.5)} />
      <View style={{ flex: 1, marginLeft: px(22.5) }}>
        <T s="h3" style={{ fontSize: px(26) }}>{titulo}</T>
        {legenda ? <T s="cap" style={{ marginTop: px(4), color: C.slate2, fontSize: px(17) }}>{legenda}</T> : null}
      </View>
      {direita !== undefined ? direita : onPress ? <Icone n="chevron-right" size={px(30)} color={C.slate} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={titulo}>{corpo}</Pressable> : corpo;
};

export const Divisor = () => <View style={{ height: px(2), backgroundColor: '#EEF2F7' }} />;

export const GrupoOpcoes = ({ children }: { children?: React.ReactNode }) => (
  <View style={[{ backgroundColor: C.white, borderRadius: px(37.5), borderWidth: px(2), borderColor: C.line, overflow: 'hidden' }, sombra(4, '#0F172A', 0.08)]}>{children}</View>
);

export const Campo = ({ valor, onChange, placeholder, style, teclado, maxLength, grande }: {
  valor: string; onChange: (v: string) => void; placeholder?: string; style?: StyleProp<TextStyle>; teclado?: 'default' | 'number-pad'; maxLength?: number; grande?: boolean;
}) => (
  <TextInput
    value={valor}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={C.faint}
    keyboardType={teclado}
    maxLength={maxLength}
    style={[{ height: grande ? 78 : 66, borderRadius: px(41), borderWidth: px(2.5), borderColor: '#DBE4F0', backgroundColor: C.bg, paddingHorizontal: px(35), fontSize: grande ? 26 : 20, fontWeight: grande ? '900' : '600', color: C.ink }, style]}
  />
);

export const Marcar = ({ valor, onChange, rotulo }: { valor: boolean; onChange: (v: boolean) => void; rotulo: string }) => (
  <Pressable onPress={() => onChange(!valor)} accessibilityRole="checkbox" accessibilityState={{ checked: valor }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: px(7.5) }} hitSlop={6}>
    <View style={{ width: px(50), height: px(50), borderRadius: px(15), borderWidth: px(3), borderColor: valor ? C.greenDark : C.line2, backgroundColor: valor ? C.green : C.white, alignItems: 'center', justifyContent: 'center' }}>
      {valor ? <Icone n="check" size={px(32.5)} color="#052E1B" /> : null}
    </View>
    <T s="b" style={{ marginLeft: px(17.5), fontSize: px(26), color: C.ink2, textTransform: 'uppercase' }}>{rotulo}</T>
  </Pressable>
);

export const Chip = ({ rotulo, ativo, onPress, cor = C.ink }: { rotulo: string; ativo?: boolean; onPress?: () => void; cor?: string }) => (
  <Toque onPress={onPress} rotulo={rotulo} style={[
    { paddingHorizontal: px(30), height: px(70), borderRadius: px(27.5), alignItems: 'center', justifyContent: 'center', marginRight: px(15), marginBottom: px(7.5) },
    ativo ? { backgroundColor: cor, borderBottomWidth: px(5), borderColor: '#020617' } : { backgroundColor: C.white, borderBottomWidth: px(5), borderColor: '#EEF2F7' },
  ]}>
    <Text style={{ fontSize: px(22), fontWeight: '900', letterSpacing: px(1), color: ativo ? C.white : C.slate2, textTransform: 'uppercase' }}>{rotulo}</Text>
  </Toque>
);

export const BotaoQuadrado = ({ icone, onPress, cor = C.ink, fundo = C.white, borda = C.line, tam = px(100), rotulo }: {
  icone: IconeDef; onPress?: () => void; cor?: string; fundo?: string; borda?: string; tam?: number; rotulo?: string;
}) => (
  <Toque onPress={onPress} rotulo={rotulo} style={[{ width: tam, height: tam, borderRadius: tam * 0.36, backgroundColor: fundo, borderWidth: px(2), borderColor: borda, alignItems: 'center', justifyContent: 'center' }]}>
    <Icone f={icone.f} n={icone.n} size={tam * 0.36} color={cor} />
  </Toque>
);

/** Cabeçalho das telas internas do Rotina (voltar + kicker + título + subtítulo). */
export const Cabecalho = ({ kicker, titulo, sub, corKicker = C.blue, onVoltar, direita }: {
  kicker?: string; titulo: string; sub?: string; corKicker?: string; onVoltar?: () => void; direita?: React.ReactNode;
}) => {
  const { t } = useRotina();
  return (
    <View style={{ backgroundColor: C.white, borderBottomWidth: px(2), borderColor: '#E9EEF5', paddingHorizontal: px(22.5), paddingTop: px(27.5), paddingBottom: px(22.5), flexDirection: 'row', alignItems: 'flex-start' }}>
      {onVoltar ? <BotaoQuadrado icone={{ f: 'feather', n: 'arrow-left' }} onPress={onVoltar} tam={px(82.5)} fundo="#F8FAFC" rotulo={t('back')} /> : null}
      <View style={{ flex: 1, marginLeft: onVoltar ? 18 : 6 }}>
        {kicker ? <T s="kick" style={{ color: corKicker, fontSize: px(20.5), letterSpacing: px(2) }}>{kicker}</T> : null}
        <T s="h1" style={{ fontSize: px(47), textTransform: 'uppercase', marginTop: px(2.5) }} n={2}>{titulo}</T>
        {sub ? <T style={{ marginTop: px(7.5), fontSize: px(22) }}>{sub}</T> : null}
      </View>
      {direita}
    </View>
  );
};

export const Rolagem = ({ children, fundo = C.bg, style }: { children?: React.ReactNode; fundo?: string; style?: StyleProp<ViewStyle> }) => (
  <RolagemTour style={{ flex: 1, backgroundColor: fundo }} contentContainerStyle={[{ padding: px(22.5), paddingBottom: px(75) }, style]} keyboardShouldPersistTaps="handled">{children}</RolagemTour>
);

export const Emoji = ({ e, size = 40 }: { e: string; size?: number }) => (
  <Text style={{ fontSize: size, lineHeight: size * 1.18, textAlign: 'center' }}>{e}</Text>
);

/** Selo de estrela (✦ 54) no estilo do Rotina. */
export const SeloEstrela = ({ n, tam = 'm', claro }: { n: number | string; tam?: 'p' | 'm' | 'g'; claro?: boolean }) => {
  const fs = tam === 'g' ? 26 : tam === 'p' ? 15 : 19;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: claro ? '#FEF3C7' : 'transparent', borderRadius: px(37.5), paddingHorizontal: claro ? 16 : 0, height: claro ? fs * 2.3 : undefined }}>
      <Icone f="mci" n="star-four-points" size={fs * 1.05} color={C.starDark} />
      <Text style={{ marginLeft: px(10), fontSize: fs, fontWeight: '900', color: C.starDark }}>{n}</Text>
    </View>
  );
};
