// BARRA DA FRASE (sempre visível) do Voz: palavras coloridas pelas cores da comunicação + UMA fileira de sugestões.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { corDaPalavra, coresDaFrase, FrasePronta, frasesEmUso, GRUPOS } from '../logica/frasesProntas';
import { AlvoTour } from '../tour';
import { px } from './ui';

/** Frases prontas que valem agora (respeita liga/desliga, ocultas e o plano). */
export const useFrasesProntas = (): { ligado: boolean; frases: FrasePronta[] } => {
  const { estado, idioma, limites } = useRotina();
  const c = estado.config;
  const ocultas = new Set(c.frasesOcultas || []);
  const frases = frasesEmUso(idioma, c.frasesLista, limites.frasesPersonalizadas).filter((f) => !ocultas.has(f.id));
  return { ligado: c.frasesProntas !== false, frases };
};

/** Mostra cada palavra da frase num quadrinho com a cor da sua categoria (pessoa amarelo, ação verde…). */
/**
 * Palavras da frase coloridas. `sugeridas`: quantas palavras do começo foram montadas pelo app (borda tracejada).
 * `aoTocar(i)`: tocar numa palavra (ex.: para tirar da frase).
 */
export function PalavrasColoridas({ palavras, tamanho = px(26), vazio, sugeridas = 0, aoTocar }: { palavras: string[]; tamanho?: number; vazio?: string; sugeridas?: number; aoTocar?: (i: number) => void }) {
  const cores = coresDaFrase(palavras);
  if (!palavras.length) return vazio ? <Text style={{ fontSize: tamanho * 0.75, fontWeight: '800', color: '#94A3B8' }}>{vazio}</Text> : null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {palavras.map((w, i) => {
        const c = cores[i];
        const sugerida = i < sugeridas;
        return (
          <Pressable key={`${i}-${w}`} disabled={!aoTocar} onPress={() => aoTocar?.(i)} accessibilityRole={aoTocar ? 'button' : undefined} accessibilityLabel={`palavra ${w}`}
            style={{ backgroundColor: c.fundo, borderColor: c.borda, borderWidth: px(2.5), borderStyle: sugerida ? 'dashed' : 'solid', opacity: sugerida ? 0.8 : 1, borderRadius: px(14), paddingHorizontal: px(12), paddingVertical: px(4), marginRight: px(8), marginVertical: px(3) }}>
            <Text style={{ fontSize: tamanho, fontWeight: '900', color: c.texto }}>{w.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * UM bloco só de sugestões (botões fixos na tela, sem rolar e sem janela), embaixo da barra da frase (sempre visível):
 *  - frase vazia: palavras para começar + frases prontas;
 *  - com palavras: próximas palavras + frases que continuam o que a criança começou
 *    (frases prontas dos pais + o que o app aprendeu). Sugere mesmo palavras que ainda não têm prancha.
 * Palavra: entra na frase. Frase: é montada palavra por palavra e falada no fim.
 */
export function BarraSugestoesFrase({ frase, vocab, aoComecar, aoPalavra, aoFalarFrase, intervaloMs = 300, max = 6 }: {
  frase: string[]; vocab: string[]; aoComecar?: () => void; aoPalavra: (w: string) => void; aoFalarFrase: (palavras: string[]) => void; intervaloMs?: number; max?: number;
}) {
  const { sugerirFrase } = useRotina();
  const { ligado, frases: prontas } = useFrasesProntas();
  const [montando, setMontando] = useState<string>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const sug = sugerirFrase(frase, vocab);
  const k = (ws: string[]) => ws.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[?!.,¿¡]/g, '');
  const prefixo = k(frase);
  // frases prontas: sem frase => uma de cada grupo, alternando; com frase => as que começam igual
  let daLista: string[][] = [];
  if (ligado) {
    if (!frase.length) {
      const porGrupo = GRUPOS.map((g) => prontas.filter((f) => f.grupo === g.id));
      for (let r = 0; r < 4; r++) for (const l of porGrupo) if (l[r]) daLista.push(l[r].palavras);
    } else daLista = prontas.map((f) => f.palavras).filter((ws) => ws.length > frase.length && k(ws).startsWith(prefixo + ' '));
  }
  const vistos = new Set<string>();
  const frasesSug: string[][] = [];
  for (const ws of [...daLista, ...sug.frases]) { const c = k(ws); if (!vistos.has(c) && c !== prefixo) { vistos.add(c); frasesSug.push(ws); } }
  // tela inicial fácil: sem frase => só as frases prontas como botões; com frase => poucas palavras + poucas frases (sem rolar, sem janela)
  const palavras = frase.length ? sug.palavras.slice(0, 4) : [];
  const nFrases = frase.length ? 3 : max;
  const lista = frasesSug.slice(0, nFrases);
  if (!palavras.length && !lista.length) return null;
  const falar = (ws: string[]) => {
    if (montando) return;
    const id = ws.join(' ');
    setMontando(id);
    aoComecar?.();
    ws.forEach((w, i) => timers.current.push(setTimeout(() => aoPalavra(w), i * intervaloMs)));
    timers.current.push(setTimeout(() => { aoFalarFrase(ws); setMontando(undefined); }, ws.length * intervaloMs + 150));
  };
  return (
    <AlvoTour id="sugestoesFrase">
      {/* v14.2: sempre UMA linha só, que desliza para o lado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" accessibilityLabel="linha de sugestões" style={{ marginTop: px(10) }} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
        {palavras.map((w) => {
          const c = corDaPalavra(w);
          return (
            <Pressable key={`p-${w}`} onPress={() => aoPalavra(w)} accessibilityRole="button" accessibilityLabel={`sugestão ${w}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: c.fundo, borderWidth: px(2), borderBottomWidth: px(4), borderColor: c.borda, borderRadius: px(16), paddingHorizontal: px(14), height: px(54), marginRight: px(8), opacity: pressed ? 0.8 : 1 })}>
              <Text style={{ fontSize: px(21), fontWeight: '900', color: c.texto }}>{w.toUpperCase()}</Text>
            </Pressable>
          );
        })}
        {lista.map((ws) => {
          const cores = coresDaFrase(ws);
          const id = ws.join(' ');
          return (
            <Pressable key={`f-${id}`} onPress={() => falar(ws)} accessibilityRole="button" accessibilityLabel={`frase ${id}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: px(2), borderBottomWidth: px(4), borderColor: '#C4B5FD', borderRadius: px(16), paddingHorizontal: px(12), height: px(54), marginRight: px(8), opacity: montando && montando !== id ? 0.5 : pressed ? 0.85 : 1 })}>
              {/* compacto: só o texto colorido (cores da comunicação), sem caixinha em cada palavra */}
              {ws.map((w, i) => <View key={i} style={{ borderBottomWidth: px(4), borderColor: cores[i].borda, marginRight: i < ws.length - 1 ? px(7) : 0 }}><Text style={{ fontSize: px(20), fontWeight: '900', color: cores[i].texto }}>{w.toUpperCase()}</Text></View>)}
            </Pressable>
          );
        })}
      </ScrollView>
    </AlvoTour>
  );
}
