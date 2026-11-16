// Seletor de cor (quadrado saturação/brilho + barra de matiz), como no "Gerenciar Abas" do Rotina.
// Feito com Views + 3 PNGs de degradê (sem react-native-svg e sem expo-linear-gradient).
import React, { useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Image, LayoutChangeEvent, Text, View } from 'react-native';
import { hexParaHsv, hsvParaHex } from '../paleta';
import { C, px } from './ui';

// Degradês embutidos (PNG pequeníssimos em base64) — não precisa de arquivo de imagem.
const BRANCO = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAAF0lEQVR4nGP8////fwYGhlE8ikfxCMQAGIwCDvE8JZ0AAAAASUVORK5CYII=' };
const PRETO = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAEACAYAAAByPhyYAAAAHElEQVR4nGNggAJGplFilBglRomRQjAwMDD8BwBw6wP4dXDnJwAAAABJRU5ErkJggg==' };
const MATIZ = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAFoCAIAAAAZ+wb4AAAAb0lEQVR4nLWNQQrEMAwDB5H8/8EJqNfU7MYNdQ8CD5IsDKIF9UKu/PWE9/vYaIDmoh1HL8ufcpZ92QcjaEH9BZ92s36pD7YYiLlo/Ll/cZZ/8uPL/TsDVoOb+occvcwvZowFQzAX7Th6p/nTfun+BQYgvLliurUpAAAAAElFTkSuQmCC' };

export function SeletorCor({ cor, onChange }: { cor: string; onChange: (hex: string) => void }) {
  const ini = useMemo(() => hexParaHsv(cor), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [h, setH] = useState(ini.h);
  const [sv, setSv] = useState({ s: ini.s, v: ini.v });
  const tamQ = useRef({ w: 1, h: 1 });
  const tamM = useRef({ h: 1 });

  const emitir = (hh: number, s: number, v: number) => onChange(hsvParaHex(hh, s, v));
  const toqueQ = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const s = Math.max(0, Math.min(1, locationX / tamQ.current.w));
    const v = Math.max(0, Math.min(1, 1 - locationY / tamQ.current.h));
    setSv({ s, v });
    emitir(h, s, v);
  };
  const toqueM = (e: GestureResponderEvent) => {
    const y = Math.max(0, Math.min(1, e.nativeEvent.locationY / tamM.current.h));
    const nh = Math.min(359.9, y * 360);
    setH(nh);
    emitir(nh, sv.s, sv.v);
  };
  const resp = (f: (e: GestureResponderEvent) => void) => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: f,
    onResponderMove: f,
  });
  const hex = hsvParaHex(h, sv.s, sv.v);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View
        onLayout={(e: LayoutChangeEvent) => { tamQ.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
        style={{ flex: 1, aspectRatio: 1, maxWidth: px(352), borderRadius: px(22.5), overflow: 'hidden', backgroundColor: hsvParaHex(h, 1, 1), borderWidth: px(2.5), borderColor: C.line2 }}
        {...resp(toqueQ)}
      >
        <Image source={BRANCO} resizeMode="stretch" style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <Image source={PRETO} resizeMode="stretch" style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: `${sv.s * 100}%`, top: `${(1 - sv.v) * 100}%`, width: px(38.5), height: px(38.5), marginLeft: px(-19), marginTop: px(-19), borderRadius: px(19), borderWidth: px(5), borderColor: C.white, backgroundColor: hex }} />
      </View>
      <View
        onLayout={(e: LayoutChangeEvent) => { tamM.current = { h: e.nativeEvent.layout.height }; }}
        style={{ width: px(54.5), alignSelf: 'stretch', maxHeight: px(352), marginLeft: px(22.5), borderRadius: px(27), overflow: 'hidden' }}
        {...resp(toqueM)}
      >
        <Image source={MATIZ} resizeMode="stretch" style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: px(3), right: px(3), top: `${(h / 360) * 100}%`, height: px(25.5), marginTop: px(-13), borderRadius: px(13), borderWidth: px(5), borderColor: C.white, backgroundColor: hsvParaHex(h, 1, 1) }} />
      </View>
      <View style={{ marginLeft: px(22.5), flexDirection: 'row', alignItems: 'center', borderWidth: px(2.5), borderColor: '#DBE4F0', borderRadius: px(48), paddingHorizontal: px(22.5), height: px(80) }}>
        <View style={{ width: px(35), height: px(35), borderRadius: px(17.5), backgroundColor: hex }} />
        <Text style={{ marginLeft: px(16), fontSize: px(22.5), fontWeight: '900', color: C.ink }}>{hex}</Text>
      </View>
    </View>
  );
}
