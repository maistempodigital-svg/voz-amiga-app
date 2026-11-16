// App de teste: liga o módulo à IA que roda no celular (public/ia/vozia.js, carregado só quando precisa).
// No app oficial (React Native), o desenvolvedor troca isto pela versão nativa (ver INTEGRACAO-V14.md).
import type { HostIA, HostSegredo, IdModeloIA } from '../src/rotina-amiga';

type VozIA = {
  pronto: (id: IdModeloIA) => Promise<boolean>;
  baixar: (id: IdModeloIA, f?: (p: { feito: number; total: number }) => void) => Promise<void>;
  apagar: (id: IdModeloIA) => Promise<void>;
  ouvirComecar: () => Promise<void>;
  ouvirParar: (i: 'pt' | 'en' | 'es') => Promise<string>;
  ouvirCancelar: () => void;
  gerar: (m: { role: 'system' | 'user' | 'assistant'; content: string }[], max?: number) => Promise<string>;
};

let carregando: Promise<VozIA> | undefined;
const carregar = (): Promise<VozIA> => {
  const w = window as unknown as { VozIA?: VozIA };
  if (w.VozIA) return Promise.resolve(w.VozIA);
  if (carregando) return carregando;
  carregando = new Promise<VozIA>((ok, erro) => {
    const el = document.createElement('script');
    el.type = 'module';
    el.src = new URL('ia/vozia.js', document.baseURI).href; // arquivo do próprio app (nunca de fora)
    const pronto = () => (w.VozIA ? ok(w.VozIA) : erro(new Error('ia')));
    window.addEventListener('vozia-pronta', pronto, { once: true });
    el.onerror = () => { carregando = undefined; erro(new Error('ia')); };
    document.head.appendChild(el);
  });
  return carregando;
};

const temCache = () => typeof window !== 'undefined' && typeof caches !== 'undefined';

/** Só nos testes automáticos (?iafake=1): simula o download para conferir a tela sem baixar centenas de MB. */
const FAKE = typeof window !== 'undefined' && /[?&]iafake=1/.test(window.location.search);
const fakeProntos = new Set<IdModeloIA>();
const hostFake: HostIA = {
  pronto: async (id) => fakeProntos.has(id),
  baixar: async (id, f) => { const total = id === 'ouvir' ? 77e6 : 323e6; for (let k = 1; k <= 10; k++) { await new Promise((r) => setTimeout(r, 120)); f({ feito: (total * k) / 10, total }); } fakeProntos.add(id); },
  apagar: async (id) => { fakeProntos.delete(id); },
  ouvirComecar: async () => undefined,
  ouvirParar: async () => 'café da manhã, escola e banho',
  ouvirCancelar: () => undefined,
  gerar: async () => 'água, bola',
};

export const hostIA: HostIA | undefined = FAKE ? hostFake : temCache() ? {
  pronto: async (id) => { try { if (!(await caches.keys()).includes('transformers-cache')) return false; return (await carregar()).pronto(id); } catch { return false; } },
  baixar: async (id, f) => (await carregar()).baixar(id, f),
  apagar: async (id) => (await carregar()).apagar(id),
  ouvirComecar: async () => (await carregar()).ouvirComecar(),
  ouvirParar: async (i) => (await carregar()).ouvirParar(i),
  ouvirCancelar: () => { (window as unknown as { VozIA?: VozIA }).VozIA?.ouvirCancelar(); },
  gerar: async (m, max) => (await carregar()).gerar(m, max),
} : undefined;

/** Chave do ChatGPT: guardada à parte (nunca no estado do app nem no backup). No app oficial: expo-secure-store. */
export const hostSegredo: HostSegredo = {
  ler: async (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  gravar: async (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* */ } },
};
