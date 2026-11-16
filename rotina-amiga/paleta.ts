// Paletas copiadas do Rotina Amiga original (createRoutinePaletteFromColor).

export interface Paleta {
  id: string;
  accent: string;
  accentDark: string;
  onAccent: string;
  soft: string;
  softAlt: string;
  text: string;
  border: string;
}

export const PALETAS: Record<string, Paleta> = {
  blue: { id: 'blue', accent: '#2563EB', accentDark: '#1747C4', onAccent: '#FFFFFF', soft: '#DBEAFE', softAlt: '#EFF6FF', text: '#1D4ED8', border: '#60A5FA' },
  orange: { id: 'orange', accent: '#F97316', accentDark: '#C2410C', onAccent: '#FFFFFF', soft: '#FED7AA', softAlt: '#FFF7ED', text: '#C2410C', border: '#FB923C' },
  indigo: { id: 'indigo', accent: '#6366F1', accentDark: '#4338CA', onAccent: '#FFFFFF', soft: '#C7D2FE', softAlt: '#EEF2FF', text: '#4338CA', border: '#818CF8' },
  emerald: { id: 'emerald', accent: '#10B981', accentDark: '#047857', onAccent: '#052E1B', soft: '#A7F3D0', softAlt: '#ECFDF5', text: '#047857', border: '#34D399' },
  cyan: { id: 'cyan', accent: '#06B6D4', accentDark: '#0E7490', onAccent: '#083344', soft: '#A5F3FC', softAlt: '#ECFEFF', text: '#0E7490', border: '#22D3EE' },
  rose: { id: 'rose', accent: '#F43F5E', accentDark: '#BE123C', onAccent: '#FFFFFF', soft: '#FECDD3', softAlt: '#FFF1F2', text: '#BE123C', border: '#FB7185' },
  amber: { id: 'amber', accent: '#F59E0B', accentDark: '#B45309', onAccent: '#451A03', soft: '#FDE68A', softAlt: '#FFFBEB', text: '#B45309', border: '#FBBF24' },
  purple: { id: 'purple', accent: '#8B5CF6', accentDark: '#6D28D9', onAccent: '#FFFFFF', soft: '#DDD6FE', softAlt: '#F5F3FF', text: '#6D28D9', border: '#A78BFA' },
};

const hex = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();

export const corValida = (c: string) => hex(c) !== null;

/** Mistura a cor com outra (t = quanto da outra). */
export const misturar = (c: string, outra: string, t: number) => {
  const a = hex(c) || [37, 99, 235];
  const b = hex(outra) || [255, 255, 255];
  return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
};

const luminancia = (c: string) => {
  const a = hex(c) || [0, 0, 0];
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]);
};

/** Mesmo cálculo do Rotina Amiga para abas com cor personalizada. */
export const paletaDaCor = (cor: string, id = 'custom'): Paleta => {
  const accent = corValida(cor) ? cor.toUpperCase() : PALETAS.blue.accent;
  const claro = luminancia(accent) > 0.42;
  return {
    id,
    accent,
    accentDark: misturar(accent, '#000000', 0.24),
    onAccent: claro ? misturar(accent, '#000000', 0.78) : '#FFFFFF',
    soft: misturar(accent, '#FFFFFF', 0.68),
    softAlt: misturar(accent, '#FFFFFF', 0.9),
    text: misturar(accent, '#000000', 0.3),
    border: misturar(accent, '#FFFFFF', 0.34),
  };
};

export const paletaDaAba = (aba?: { cor: string; paletaId?: string }): Paleta => {
  if (!aba) return PALETAS.blue;
  const p = aba.paletaId ? PALETAS[aba.paletaId] : undefined;
  if (p && p.accent.toUpperCase() === aba.cor.toUpperCase()) return p;
  return paletaDaCor(aba.cor);
};

// HSV <-> HEX para o seletor de cor da tela "Gerenciar Abas"
export const hsvParaHex = (h: number, s: number, v: number) => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return toHex(f(5) * 255, f(3) * 255, f(1) * 255);
};

export const hexParaHsv = (c: string) => {
  const a = hex(c) || [37, 99, 235];
  const r = a[0] / 255, g = a[1] / 255, b = a[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
};
