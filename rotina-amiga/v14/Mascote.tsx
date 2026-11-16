// O MASCOTE OFICIAL do Voz Amiga (robozinho 3D laranja dos Reels): as imagens vêm do código oficial da marca
// (skill "mascote-voz-amiga", mascote_voz_amiga.py, conferido pelo SHA-256) — NUNCA redesenhar.
// Cada imagem é uma pose (braço, boca e olhos); o app troca as poses para ele acenar, apontar, piscar e FALAR.
// Boca sincronizada: toda vez que o app fala pelo mascote, anunciarFala(texto) monta a sequência da boca pelas letras
// (vogal abre, m/b/p fecha, pausa nas vírgulas e pontos), no ritmo da voz do celular. Com tela calma, fica parado.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

export const CORES_MARCA = { laranja: '#F97316', laranjaEscuro: '#EA580C', rosa: '#EC4899', amarelo: '#FACC15', azul: '#3B82F6', verde: '#22C55E', tinta: '#0F172A' };
/** proporção das imagens do mascote (largura 377 × altura 373) */
export const ALTURA_MASCOTE = 373 / 377;

// n = braço normal (acenando leve), a = acenando alto, p = apontando, d = olhando para a direita; 0/1/2 = boca fechada/meio/aberta;
// nP/aP = piscando; w = piscadinha da logo
const QUADROS = {
  n0: require('./mascote/m_n0.png'), n1: require('./mascote/m_n1.png'), n2: require('./mascote/m_n2.png'),
  a0: require('./mascote/m_a0.png'), a1: require('./mascote/m_a1.png'), a2: require('./mascote/m_a2.png'),
  p0: require('./mascote/m_p0.png'), p1: require('./mascote/m_p1.png'), p2: require('./mascote/m_p2.png'),
  d0: require('./mascote/m_d0.png'), d1: require('./mascote/m_d1.png'), d2: require('./mascote/m_d2.png'),
  nP: require('./mascote/m_nP.png'), aP: require('./mascote/m_aP.png'), w: require('./mascote/m_w.png'),
} as const;
type Quadro = keyof typeof QUADROS;
const NOMES = Object.keys(QUADROS) as Quadro[];

// ------------------------------------------------------------ boca sincronizada com a fala
type Passo = { ate: number; boca: 0 | 1 | 2 };
let fala: { inicio: number; passos: Passo[] } | undefined;
const ouvintes = new Set<() => void>();
const VOGAIS = /[aeiouáéíóúâêôãõày]/i;
/** Chame sempre que o app falar pelo mascote: a boca acompanha as letras do texto (≈ 14 letras por segundo). */
export function anunciarFala(texto: string, velocidade = 1) {
  const t = String(texto || '').slice(0, 1200);
  const ms = 72 / Math.max(0.5, Math.min(2, velocidade));
  const passos: Passo[] = [];
  let ac = 280; // a voz do celular demora um pouquinho para começar
  let abre = true;
  for (const ch of t) {
    let boca: 0 | 1 | 2; let d = ms;
    if (/[.!?;:]/.test(ch)) { boca = 0; d = ms * 4; } else if (ch === ',') { boca = 0; d = ms * 2.5; } else if (/\s/.test(ch)) { boca = 0; d = ms * 0.6; }
    else if (VOGAIS.test(ch)) { boca = abre ? 2 : 1; abre = !abre; } else if (/[mbp]/i.test(ch)) boca = 0; else boca = 1;
    ac += d; passos.push({ ate: ac, boca });
  }
  fala = { inicio: Date.now(), passos };
  ouvintes.forEach((f) => f());
}
export function pararFalaMascote() { fala = undefined; ouvintes.forEach((f) => f()); }
const bocaAgora = (): 0 | 1 | 2 => {
  if (!fala) return 0;
  const dt = Date.now() - fala.inicio;
  const p = fala.passos.find((x) => x.ate >= dt);
  if (!p) { fala = undefined; return 0; }
  return p.boca;
};
/** Nível da boca (0, 1, 2) atualizado enquanto o mascote fala. */
function useBoca(ativo: boolean) {
  const [b, setB] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    if (!ativo) return undefined;
    let h: ReturnType<typeof setInterval> | undefined;
    const ligar = () => { if (h) return; h = setInterval(() => { const v = bocaAgora(); setB(v); if (!fala && h) { clearInterval(h); h = undefined; } }, 60); };
    const f = () => { if (fala) ligar(); else setB(0); };
    ouvintes.add(f); f();
    return () => { ouvintes.delete(f); if (h) clearInterval(h); };
  }, [ativo]);
  return b;
}

type Props = {
  tam?: number;
  /** anima (pisca, acena, fala). false = parado */
  vivo?: boolean;
  /** (mantido por compatibilidade) a boca segue anunciarFala() */
  falando?: boolean;
  /** para onde aponta: vetor em relação ao mascote (ex.: {x: 1, y: 0} = direita) */
  alvo?: { x: number; y: number };
};

/** O mascote oficial. Troca de pose sem piscar a imagem (todas ficam carregadas, só uma aparece). */
export function Mascote({ tam = 70, vivo = true, alvo }: Props) {
  const boca = useBoca(vivo);
  const [pisca, setPisca] = useState(false);
  const [aceno, setAceno] = useState(false);
  useEffect(() => {
    if (!vivo) return undefined;
    const h1 = setInterval(() => { setPisca(true); setTimeout(() => setPisca(false), 130); }, 3400);
    const h2 = setInterval(() => setAceno((v) => !v), 650);
    return () => { clearInterval(h1); clearInterval(h2); };
  }, [vivo]);
  let q: Quadro;
  if (alvo && alvo.x > 8) q = `p${boca}` as Quadro;                         // alvo à direita: aponta com o bracinho
  else if (alvo) q = (boca ? `d${boca}` : pisca ? 'nP' : 'n0') as Quadro;   // alvo à esquerda/em cima: olha e inclina
  else if (!vivo) q = 'w';
  else q = (boca ? `${aceno ? 'a' : 'n'}${boca}` : pisca ? (aceno ? 'aP' : 'nP') : aceno ? 'a0' : 'n0') as Quadro;
  const inclina = alvo && alvo.x <= 8 ? '-8deg' : '0deg';
  const alto = tam * ALTURA_MASCOTE;
  return (
    <View accessibilityLabel="mascote" pointerEvents="none" style={{ width: tam, height: alto, transform: [{ rotate: inclina }] }}>
      {NOMES.map((k) => (
        <Image key={k} source={QUADROS[k]} resizeMode="contain" style={{ position: 'absolute', left: 0, top: 0, width: tam, height: alto, opacity: k === q ? 1 : 0 }} />
      ))}
    </View>
  );
}

/** Mascote parado (piscadinha da logo), para cartões e avatares. */
export function MascoteDesenho({ tam = 64 }: { tam?: number; apontar?: 'cima' | 'baixo' }) {
  return <Mascote tam={tam} vivo={false} />;
}

export function MascoteVoando({ x, y, tam = 64, calmo, falando = true, alvoTela }: { x: number; y: number; tam?: number; calmo?: boolean; falando?: boolean; alvoTela?: { x: number; y: number }; espelhar?: boolean; apontar?: 'cima' | 'baixo' }) {
  const pos = useRef(new Animated.ValueXY({ x, y: y + 60 })).current;
  const bal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (calmo) { pos.setValue({ x, y }); return; }
    Animated.spring(pos, { toValue: { x, y }, useNativeDriver: false, friction: 7, tension: 80 }).start();
  }, [x, y, calmo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (calmo) return undefined;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(bal, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(bal, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    a.start();
    return () => a.stop();
  }, [calmo]); // eslint-disable-line react-hooks/exhaustive-deps
  const sobe = bal.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const cx = x + tam / 2; const cy = y + (tam * ALTURA_MASCOTE) * 0.6;
  const alvo = alvoTela ? { x: alvoTela.x - cx, y: alvoTela.y - cy } : undefined;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 20, transform: [{ translateY: sobe }] }}>
      <Mascote tam={tam} vivo={!calmo} falando={falando} alvo={alvo} />
    </Animated.View>
  );
}
