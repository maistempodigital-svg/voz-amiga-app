// Barra de SUGESTÕES INTELIGENTES (modo frase e teclado): palavras e frases completas, bem destacadas.
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { px } from './ui';

export const COR_SUG = { palavra: '#2563EB', palavraBorda: '#1E40AF', frase: '#7C3AED', fraseBorda: '#5B21B6' };

export function BarraSugestoes({ palavras, frases = [], aoPalavra, aoFrase, rotuloFrases }: {
  palavras: string[];
  frases?: string[][];
  aoPalavra: (w: string) => void;
  aoFrase?: (f: string[]) => void;
  rotuloFrases?: string;
}) {
  if (!palavras.length && !frases.length) return null;
  return (
    <View style={{ marginTop: px(12) }}>
      {palavras.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingRight: px(10) }}>
          {palavras.map((w) => (
            <Pressable key={w} onPress={() => aoPalavra(w)} accessibilityRole="button" accessibilityLabel={`sugestão ${w}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: COR_SUG.palavra, borderBottomWidth: px(5), borderColor: COR_SUG.palavraBorda, borderRadius: px(26), paddingHorizontal: px(24), height: px(76), marginRight: px(10), opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
              <Feather name="zap" size={px(26)} color="#FDE047" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: px(30), marginLeft: px(8) }}>{w.toUpperCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {frases.length && aoFrase ? (
        <View style={{ marginTop: px(10) }}>
          {rotuloFrases ? <Text style={{ fontSize: px(19), fontWeight: '900', color: '#5B21B6', letterSpacing: px(1), marginBottom: px(6) }}>{rotuloFrases}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingRight: px(10) }}>
            {frases.map((f) => (
              <Pressable key={f.join(' ')} onPress={() => aoFrase(f)} accessibilityRole="button" accessibilityLabel={`frase ${f.join(' ')}`}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: COR_SUG.frase, borderBottomWidth: px(5), borderColor: COR_SUG.fraseBorda, borderRadius: px(22), paddingHorizontal: px(20), height: px(76), marginRight: px(10), opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                <Feather name="message-circle" size={px(26)} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: px(27), marginLeft: px(8) }}>{f.join(' ').toUpperCase()}</Text>
                <View style={{ marginLeft: px(10), width: px(40), height: px(40), borderRadius: px(20), backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="volume-2" size={px(22)} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
