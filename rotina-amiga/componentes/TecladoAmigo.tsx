// TECLADO DO APLICATIVO (não usa o teclado do celular): teclas grandes e coloridas.
//  • Normal: letras maiúsculas, espaço, apagar e FALAR.
//  • Avançado (Definições → Teclado avançado): + números, acentos, Ç/Ñ, pontuação e minúsculas.
//  • Sugestões inteligentes completam a palavra e sugerem a próxima.
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRotina } from '../estado';
import { formularFrase } from '../logica/frasesProntas';
import { PalavrasColoridas } from './FrasesProntas';
import { completarPalavra } from '../logica/sugestoes';
import { px } from './ui';

const LINHAS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M']];
const NUMEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const ACENTOS = { pt: ['Á', 'À', 'Â', 'Ã', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Õ', 'Ú', 'Ç', '?', '!'], en: ['?', '!', "'", '-', '@', '&', '(', ')', ':', ';'], es: ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü', '¿', '?', '¡', '!'] };
const PONTOS = [',', '.'];
const VOGAIS = new Set(['A', 'E', 'I', 'O', 'U', 'Á', 'À', 'Â', 'Ã', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Õ', 'Ú', 'Ü']);
// cores por linha (fundo, borda de baixo, letra) — vogais em rosa para ajudar na leitura
const COR_LINHA = [['#DBEAFE', '#93C5FD', '#1D4ED8'], ['#DCFCE7', '#86EFAC', '#15803D'], ['#FFEDD5', '#FDBA74', '#C2410C']];
const COR_VOGAL = ['#FCE7F3', '#F9A8D4', '#BE185D'];
const COR_NUM = ['#EDE9FE', '#C4B5FD', '#6D28D9'];
const COR_ACENTO = ['#FEF9C3', '#FDE047', '#A16207'];

const TXT = {
  pt: { titulo: 'Teclado', vazio: 'Toque nas letras…', falar: 'FALAR', espaco: 'ESPAÇO', apagar: 'Apagar letra', limpar: 'Limpar tudo', fechar: 'Fechar teclado' },
  en: { titulo: 'Keyboard', vazio: 'Tap the letters…', falar: 'SPEAK', espaco: 'SPACE', apagar: 'Delete letter', limpar: 'Clear all', fechar: 'Close keyboard' },
  es: { titulo: 'Teclado', vazio: 'Toca las letras…', falar: 'HABLAR', espaco: 'ESPACIO', apagar: 'Borrar letra', limpar: 'Borrar todo', fechar: 'Cerrar teclado' },
};

export interface PropsTeclado {
  visivel: boolean;
  fechar: () => void;
  /** Definições → Teclado avançado. */
  avancado?: boolean;
  /** Definições → Sugestões inteligentes. */
  sugestoes?: boolean;
  /** Textos das pranchas (melhora as sugestões). */
  vocab?: string[];
  /** Padrão: fala com a voz do Voz Amiga e registra a frase (estrelas + relatório). */
  aoFalar?: (texto: string, palavras: string[]) => void;
}

export function TecladoAmigo({ visivel, fechar, avancado = false, sugestoes = true, vocab = [], aoFalar }: PropsTeclado) {
  const ctx = useRotina();
  const L = TXT[ctx.idioma];
  const { width, height } = useWindowDimensions();
  const [txt, setTxt] = useState('');
  const [minus, setMinus] = useState(false);
  const cont = React.useRef({ letras: 0, apagadas: 0, sug: 0 });
  const gravarUso = (palavras?: string[]) => { const c = cont.current; if (c.letras || c.apagadas) ctx.registrarTeclado({ letras: c.letras, apagadas: c.apagadas, palavras }); cont.current = { letras: 0, apagadas: 0, sug: 0 }; };
  const fecharTeclado = () => { gravarUso(); fechar(); };
  const larg = Math.min(width, 700);
  const tecla = Math.floor((larg - px(24) - 10 * px(8)) / 10);
  // v11: TELA CHEIA — a altura das teclas se ajusta ao celular para nada ficar cortado embaixo
  const nLinhas = 4 + (avancado ? 2 : 0);
  const sobra = height - px(150) - px(140) - px(110) - px(150); // topo + visor + sugestões + margens
  const altTecla = Math.max(px(70), Math.min(px(130), Math.floor(sobra / nLinhas) - px(10)));

  const historico = useMemo(() => ctx.estado.log.filter((e) => e.tipo === 'frase' && e.palavras?.length).slice(-300).map((e) => e.palavras as string[]), [ctx.estado.log]);
  const partes = txt.split(/\s+/);
  const atual = /\s$/.test(txt) ? '' : partes[partes.length - 1] || '';
  const anteriores = (/\s$/.test(txt) ? partes : partes.slice(0, -1)).filter(Boolean);
  const sug = sugestoes ? completarPalavra(atual, { anteriores, historico, vocab, idioma: ctx.idioma, hora: new Date(ctx.agora).getHours() }) : [];

  // MENSAGEM INTELIGENTE: com UMA palavra escrita ("água"), o app já sugere a frase montada ("Eu quero água").
  // Tocar coloca a frase no visor (dá para apagar); só fala quando apertar FALAR.
  const umaPalavra = txt.trim() && !/\s/.test(txt.trim()) ? txt.trim() : '';
  const base = umaPalavra && atual && sug[0] && sug[0].toLowerCase().startsWith(atual.toLowerCase()) ? sug[0] : umaPalavra;
  const inteligente = sugestoes && base ? formularFrase(base, ctx.idioma) : undefined;
  const usarInteligente = () => { if (!inteligente) return; cont.current.sug += inteligente.length - 1; setTxt(inteligente.join(' ') + ' '); };
  const digitar = (c: string) => { cont.current.letras++; setTxt((x) => x + (minus && c.length === 1 ? c.toLowerCase() : c)); };
  const usarSugestao = (w: string) => { cont.current.sug++; setTxtSug(w); };
  const setTxtSug = (w: string) => setTxt((x) => (atual ? x.slice(0, x.length - atual.length) : x) + w + ' ');
  const falarTudo = () => {
    const t = txt.trim();
    if (!t) return;
    const palavras = t.split(/\s+/).filter(Boolean);
    const sug = cont.current.sug;
    gravarUso(palavras);
    if (aoFalar) aoFalar(t, palavras);
    else { ctx.falar(t); ctx.registrarFala(palavras, { sug }); }
    setTxt('');
  };

  const Tecla = ({ c, cor, w = tecla, rotulo, onPress, children }: { c?: string; cor: string[]; w?: number; rotulo?: string; onPress?: () => void; children?: React.ReactNode }) => (
    <Pressable onPress={onPress || (() => c && digitar(c))} accessibilityRole="button" accessibilityLabel={rotulo || `tecla ${c}`}
      style={({ pressed }) => ({ width: w, height: altTecla, marginHorizontal: px(4), marginVertical: px(5), borderRadius: px(18), backgroundColor: cor[0], borderBottomWidth: pressed ? px(2) : px(7), borderColor: cor[1], alignItems: 'center', justifyContent: 'center', transform: [{ translateY: pressed ? px(4) : 0 }] })}>
      {children || <Text style={{ fontSize: px(40), fontWeight: '900', color: cor[2] }}>{minus && c && c.length === 1 ? c.toLowerCase() : c}</Text>}
    </Pressable>
  );
  const corDe = (c: string, linha: number) => (VOGAIS.has(c) ? COR_VOGAL : COR_LINHA[linha]);

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent={false} onRequestClose={fecharTeclado}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: px(12), paddingTop: px(46), paddingBottom: px(40), alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: larg - px(24) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: px(12) }}>
              <Feather name="grid" size={px(34)} color="#2563EB" />
              <Text style={{ flex: 1, marginLeft: px(12), fontSize: px(34), fontWeight: '900', color: '#0F172A' }}>{L.titulo}</Text>
              {/* X bem destacado para sair */}
              <Pressable onPress={fecharTeclado} accessibilityRole="button" accessibilityLabel={L.fechar} hitSlop={12}
                style={({ pressed }) => ({ width: px(100), height: px(100), borderRadius: px(50), backgroundColor: pressed ? '#B91C1C' : '#DC2626', borderWidth: px(5), borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' })}>
                <Feather name="x" size={px(54)} color="#FFFFFF" />
              </Pressable>
            </View>
            {/* visor: o que foi escrito */}
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: px(120), borderRadius: px(26), borderWidth: px(4), borderColor: '#93C5FD', backgroundColor: '#EFF6FF', paddingHorizontal: px(20) }}>
              <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }}>
                <Text accessibilityLabel="texto do teclado" style={{ fontSize: px(44), fontWeight: '900', color: txt ? '#0F172A' : '#94A3B8' }}>{txt || L.vazio}<Text style={{ color: '#2563EB' }}>{txt ? '|' : ''}</Text></Text>
              </ScrollView>
              {txt ? (
                <Pressable onPress={() => setTxt('')} accessibilityRole="button" accessibilityLabel={L.limpar} style={{ padding: px(12) }}>
                  <Feather name="x-circle" size={px(40)} color="#64748B" />
                </Pressable>
              ) : null}
            </View>
            {/* sugestões numa LINHA só (sem quebrar), um pouco maiores: primeiro a mensagem inteligente, depois as palavras */}
            {sugestoes && (inteligente || sug.length) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: px(14), flexGrow: 0 }} contentContainerStyle={{ alignItems: 'center', paddingRight: px(10) }}>
                {inteligente ? (
                  <Pressable onPress={usarInteligente} accessibilityRole="button" accessibilityLabel={`mensagem inteligente ${inteligente.join(' ')}`}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', height: px(92), marginRight: px(10), backgroundColor: '#F5F3FF', borderWidth: px(3), borderColor: '#A78BFA', borderRadius: px(24), paddingHorizontal: px(16), opacity: pressed ? 0.85 : 1 })}>
                    <Feather name="zap" size={px(30)} color="#7C3AED" />
                    <View style={{ marginLeft: px(8), flexDirection: 'row' }}><PalavrasColoridas palavras={inteligente} tamanho={px(30)} /></View>
                  </Pressable>
                ) : null}
                {sug.map((w) => (
                  <Pressable key={w} onPress={() => usarSugestao(w)} accessibilityRole="button" accessibilityLabel={`sugestão ${w}`}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', height: px(92), marginRight: px(10), backgroundColor: '#2563EB', borderBottomWidth: px(6), borderColor: '#1E3A8A', borderRadius: px(26), paddingHorizontal: px(26), opacity: pressed ? 0.85 : 1 })}>
                    <Feather name="zap" size={px(28)} color="#FDE047" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: px(36), marginLeft: px(8) }}>{w.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : <View style={{ height: px(106) }} />}
            <View style={{ height: px(10) }} />
            {avancado ? <View style={{ flexDirection: 'row', justifyContent: 'center' }}>{NUMEROS.map((c) => <Tecla key={c} c={c} cor={COR_NUM} />)}</View> : null}
            {LINHAS.map((linha, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {linha.map((c) => <Tecla key={c} c={c} cor={corDe(c, i)} />)}
                {i === 2 ? (
                  <Tecla cor={['#FEE2E2', '#FCA5A5', '#B91C1C']} w={tecla * 2 + px(8)} rotulo={L.apagar} onPress={() => { if (txt) cont.current.apagadas++; setTxt((x) => x.slice(0, -1)); }}>
                    <Feather name="delete" size={px(44)} color="#B91C1C" />
                  </Tecla>
                ) : null}
              </View>
            ))}
            {avancado ? (
              <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
                {ACENTOS[ctx.idioma].map((c) => <Tecla key={c} c={c} cor={VOGAIS.has(c) ? COR_VOGAL : COR_ACENTO} />)}
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              {avancado ? (
                <Tecla cor={['#E2E8F0', '#94A3B8', '#334155']} w={tecla * 1.4} rotulo={minus ? 'ABC' : 'abc'} onPress={() => setMinus(!minus)}>
                  <Text style={{ fontSize: px(30), fontWeight: '900', color: '#334155' }}>{minus ? 'ABC' : 'abc'}</Text>
                </Tecla>
              ) : null}
              {avancado ? <Tecla c={PONTOS[0]} cor={COR_ACENTO} /> : null}
              <Tecla cor={['#F1F5F9', '#CBD5E1', '#334155']} w={tecla * (avancado ? 3 : 5) + px(8) * (avancado ? 2 : 4)} rotulo={L.espaco} onPress={() => setTxt((x) => (x && !x.endsWith(' ') ? x + ' ' : x))}>
                <Text style={{ fontSize: px(26), fontWeight: '900', color: '#475569', letterSpacing: px(3) }}>{L.espaco}</Text>
              </Tecla>
              {avancado ? <Tecla c={PONTOS[1]} cor={COR_ACENTO} /> : null}
              <Pressable onPress={falarTudo} accessibilityRole="button" accessibilityLabel={`${L.falar} TECLADO`}
                style={({ pressed }) => ({ flex: 1, height: altTecla, marginHorizontal: px(4), marginVertical: px(5), borderRadius: px(18), backgroundColor: txt.trim() ? '#22C55E' : '#CBD5E1', borderBottomWidth: pressed ? px(2) : px(7), borderColor: txt.trim() ? '#15803D' : '#94A3B8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: pressed ? px(4) : 0 }] })}>
                <Feather name="volume-2" size={px(36)} color="#FFFFFF" />
                <Text style={{ fontSize: px(32), fontWeight: '900', color: '#FFFFFF', marginLeft: px(8) }}>{L.falar}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
