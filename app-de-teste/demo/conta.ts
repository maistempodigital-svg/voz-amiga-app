// CONTA, PLANO E PAGAMENTO — ligado ao MESMO Firebase do Voz Amiga 1.0.24 (voz-amiga-651a5).
// • Login: e-mail/senha e Google (o Google vem da casca Android: entrarGoogle → idToken).
// • Acesso pago: Firestore users/{uid}.hasAccess — quem calcula é o servidor do app atual
//   (Google Play, Kiwify e acesso liberado à mão no painel). O app só LÊ.
// • Compra: Google Play pela casca (comprar) → função verifyGooglePlayPurchase (já existe) → hasAccess.
// • Limites: Realtime Database limitações/* e appConfig/planSelection (só leitura).
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithCredential, signOut, User,
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuração web do projeto (é pública: está dentro de todo app; quem protege são as regras do Firebase)
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB9pMgoZXyV0BGGJEMfzJlcz93p51uEzss',
  authDomain: 'voz-amiga-651a5.firebaseapp.com',
  databaseURL: 'https://voz-amiga-651a5-default-rtdb.firebaseio.com',
  projectId: 'voz-amiga-651a5',
  storageBucket: 'voz-amiga-651a5.firebasestorage.app',
  messagingSenderId: '219818609699',
  appId: '1:219818609699:web:aaf6d27b5a0ee8dc0eb596',
};
export const PRODUTOS = { monthly: 'voz_amiga_monthly', semiannual: 'voz_amiga_semiannual', annual: 'voz_amiga_annual', lifetime: 'voz_amiga_lifetime' } as const;

const app = () => getApps()[0] || initializeApp(FIREBASE_CONFIG);
export const auth = () => getAuth(app());

export interface PlanoServidor {
  /** acesso pago (Mensal, Vitalício, Kiwify, liberado à mão) */
  hasAccess: boolean;
  /** teste premium guardado no servidor (se a função nova estiver publicada) */
  testePremium?: { inicio?: number; dias?: number };
  /** bloqueado pelo dono no painel (sem premium e sem teste; a criança continua falando) */
  bloqueado?: boolean;
  /** "deixar limitado": só o grátis, mesmo com acesso */
  soGratis?: boolean;
  /** teste dado pelo dono no painel */
  testeDono?: { inicio: number; dias: number };
}
/** Chave do e-mail no Firebase (igual ao servidor do app 1.0.24). */
export const chaveEmail = (e: string) => e.trim().toLowerCase().replace(/[.#$/[\]]/g, ',');
/** Lê o que o dono escolheu no painel para este e-mail (controleUsuarios/{e-mail}). */
export const lerControle = (v: unknown): Partial<PlanoServidor> => {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  if (o.tipo === 'bloqueado') return { bloqueado: true };
  if (o.tipo === 'gratis') return { soGratis: true };
  if (o.tipo === 'teste' && typeof o.inicio === 'number' && typeof o.dias === 'number' && o.dias > 0 && o.dias <= 365) return { testeDono: { inicio: o.inicio, dias: o.dias } };
  return {};
};
export interface DadosRemotos { rotina?: unknown; recursos?: unknown; porData?: unknown; sabado?: unknown; planos?: Record<string, { enabled?: boolean; title?: string; subtitle?: string; googleProductId?: string; productType?: string }> }

/** Mensagens de erro do Firebase em português simples. */
export const erroAmigavel = (e: unknown): string => {
  const c = String((e as { code?: string })?.code || '');
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'E-mail ou senha incorretos.';
  if (/email-already-in-use/.test(c)) return 'Este e-mail já tem conta. Toque em "Entrar".';
  if (/weak-password/.test(c)) return 'A senha precisa ter pelo menos 6 letras ou números.';
  if (/invalid-email/.test(c)) return 'Confira o e-mail.';
  if (/network/.test(c)) return 'Sem internet. Tente de novo quando estiver conectado.';
  if (/too-many-requests/.test(c)) return 'Muitas tentativas. Espere alguns minutos.';
  return 'Não deu certo agora. Tente de novo.';
};

export const entrarEmail = (email: string, senha: string) => signInWithEmailAndPassword(auth(), email.trim(), senha);
export const criarConta = (email: string, senha: string) => createUserWithEmailAndPassword(auth(), email.trim(), senha);
export const esqueciSenha = (email: string) => sendPasswordResetEmail(auth(), email.trim());
export const sair = () => signOut(auth());

type PonteConta = { entrarGoogle?: () => void; comprar?: (produto: string, tipo: string) => void; confirmarCompra?: (token: string) => void };
const ponte = (): PonteConta | undefined => (typeof window !== 'undefined' ? (window as unknown as { AndroidTTS?: PonteConta }).AndroidTTS : undefined);
export const temGoogleNativo = () => !!ponte()?.entrarGoogle;
export const temCompraNativa = () => !!ponte()?.comprar;

/** Google: a casca abre a conta Google do celular e devolve o idToken em window.__vozGoogle(token|erro). */
export const entrarGoogle = () => new Promise<User>((ok, erro) => {
  const p = ponte();
  if (!p?.entrarGoogle) { erro(new Error('google-indisponivel')); return; }
  (window as unknown as Record<string, unknown>).__vozGoogle = async (idToken: string | null, motivo?: string) => {
    if (!idToken) { erro(new Error(motivo || 'cancelado')); return; }
    try { const r = await signInWithCredential(auth(), GoogleAuthProvider.credential(idToken)); ok(r.user); } catch (e) { erro(e); }
  };
  try { p.entrarGoogle(); } catch (e) { erro(e); }
});

/** Acompanha a conta e o plano. Devolve a função para parar. */
export function acompanharConta(mudou: (u: User | null, plano: PlanoServidor | undefined) => void): () => void {
  let pararDoc: (() => void) | undefined;
  const pararAuth = onAuthStateChanged(auth(), (u) => {
    pararDoc?.(); pararDoc = undefined;
    if (!u) { mudou(null, undefined); return; }
    mudou(u, undefined);
    // pede ao servidor para recalcular o acesso (o app antigo faz o mesmo ao entrar)
    httpsCallable(getFunctions(app(), 'us-central1'), 'syncUserAccess')({}).catch(() => undefined);
    let doUsuario: PlanoServidor | undefined;
    let doPainel: Partial<PlanoServidor> = {};
    const avisar = () => mudou(u, doUsuario ? { ...doUsuario, ...doPainel } : Object.keys(doPainel).length ? { hasAccess: false, ...doPainel } : undefined);
    const p1 = onSnapshot(doc(getFirestore(app()), 'users', u.uid), (snap) => {
      const d = (snap.data() || {}) as Record<string, unknown>;
      const t = d.testePremium as { inicio?: { toMillis?: () => number } | number; dias?: number } | undefined;
      const inicio = t?.inicio && typeof t.inicio === 'object' && t.inicio.toMillis ? t.inicio.toMillis() : typeof t?.inicio === 'number' ? t.inicio : undefined;
      doUsuario = { hasAccess: d.hasAccess === true, testePremium: inicio ? { inicio, dias: typeof t?.dias === 'number' ? t.dias : undefined } : undefined };
      avisar();
    }, () => avisar());
    const p2 = u.email ? onValue(ref(getDatabase(app()), 'controleUsuarios/' + chaveEmail(u.email)), (s2) => { doPainel = lerControle(s2.val()); avisar(); }, () => undefined) : () => undefined;
    pararDoc = () => { p1(); p2(); };
  });
  return () => { pararDoc?.(); pararAuth(); };
}

/** Lê limites e planos (só com conta: as regras pedem login). */
export function acompanharRemoto(mudou: (d: DadosRemotos) => void): () => void {
  const db = getDatabase(app());
  const atual: DadosRemotos = {};
  const paradas = [
    onValue(ref(db, 'limitações/rotina'), (s) => { atual.rotina = s.val(); mudou({ ...atual }); }, () => undefined),
    onValue(ref(db, 'limitações/recursos'), (s) => { atual.recursos = s.val(); mudou({ ...atual }); }, () => undefined),
    onValue(ref(db, 'limitações/porData'), (s) => { atual.porData = s.val(); mudou({ ...atual }); }, () => undefined),
    onValue(ref(db, 'limitações/sabado'), (s) => { atual.sabado = s.val(); mudou({ ...atual }); }, () => undefined),
    onValue(ref(db, 'appConfig/planSelection'), (s) => { atual.planos = (s.val() || {}) as DadosRemotos['planos']; mudou({ ...atual }); }, () => undefined),
  ];
  return () => paradas.forEach((p) => p());
}

/** Teste premium no servidor (função iniciarTestePremium). Sem a função publicada, devolve undefined (o app guarda no celular). */
export async function iniciarTesteServidor(): Promise<{ inicio: number; dias: number } | undefined> {
  try { const r = await httpsCallable(getFunctions(app(), 'us-central1'), 'iniciarTestePremium')({}); return r.data as { inicio: number; dias: number }; } catch { return undefined; }
}

/**
 * Compra pelo Google Play. A casca abre o pagamento e chama window.__vozCompra(json).
 * Depois o servidor confere (verifyGooglePlayPurchase) e libera hasAccess.
 */
export const comprar = (produto: string, tipo: 'subs' | 'inapp') => new Promise<'ok' | 'cancelado' | 'pendente'>((ok, erro) => {
  const p = ponte();
  if (!p?.comprar) { erro(new Error('compra-indisponivel')); return; }
  if (!auth().currentUser) { erro(new Error('precisa-entrar')); return; }
  (window as unknown as Record<string, unknown>).__vozCompra = async (txt: string) => {
    let r: { estado?: string; produto?: string; token?: string; motivo?: string } = {};
    try { r = JSON.parse(txt); } catch { /* */ }
    if (r.estado === 'cancelado') { ok('cancelado'); return; }
    if (r.estado === 'pendente') { ok('pendente'); return; }
    if (r.estado !== 'comprado' || !r.token) { erro(new Error(r.motivo || 'erro')); return; }
    try {
      await httpsCallable(getFunctions(app(), 'us-central1'), 'verifyGooglePlayPurchase')({ productId: r.produto || produto, purchaseToken: r.token, productType: tipo === 'inapp' ? 'inapp' : 'subscription' });
      try { p.confirmarCompra?.(r.token); } catch { /* o servidor também confirma */ }
      ok('ok');
    } catch (e) { erro(e); }
  };
  try { p.comprar(produto, tipo); } catch (e) { erro(e); }
});
