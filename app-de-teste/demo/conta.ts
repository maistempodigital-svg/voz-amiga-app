// CONTA, PLANO E PAGAMENTO — ligado ao MESMO Firebase do Voz Amiga 1.0.24 (voz-amiga-651a5).
// • Login: e-mail/senha e Google (o Google vem da casca Android: entrarGoogle → idToken).
// • Acesso pago: Firestore users/{uid}.hasAccess — quem calcula é o servidor do app atual
//   (Google Play, Kiwify e acesso liberado à mão no painel). O app só LÊ.
// • Compra: Google Play pela casca (comprar) → função verifyGooglePlayPurchase (já existe) → hasAccess.
// • Limites: Realtime Database limitações/* e appConfig/planSelection (só leitura).
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onIdTokenChanged, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithCredential, signOut, User, sendEmailVerification, reload,
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { imagemSegura, linkSeguro } from '../src/rotina-amiga/logica/plano';

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
// SEGURANÇA: initializeAuth SEM o "popupRedirectResolver" — o app só usa signInWithCredential, então nenhuma
// página/iframe de fora (apis.google.com, __/auth/iframe) é carregada dentro do app (onde existe a ponte AndroidTTS).
let _auth: Auth | undefined;
export const auth = () => {
  if (_auth) return _auth;
  try { _auth = initializeAuth(app(), { persistence: [indexedDBLocalPersistence, browserLocalPersistence] }); } catch { _auth = getAuth(app()); }
  return _auth;
};

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
  /** conta de e-mail e senha ainda sem confirmar o e-mail: o plano pago só libera depois de confirmar */
  precisaConfirmarEmail?: boolean;
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
export interface DadosRemotos { rotina?: unknown; recursos?: unknown; porData?: unknown; sabado?: unknown; anuncio?: unknown; planos?: Record<string, { enabled?: boolean; title?: string; subtitle?: string; googleProductId?: string; productType?: string }> }

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

type PonteConta = { entrarGoogle?: () => void; comprar?: (produto: string, tipo: string) => void; confirmarCompra?: (token: string) => void; restaurarCompras?: () => void; precos?: (ids: string) => void };
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

const avisouVerificacao = new Set<string>();
/** Reenvia o e-mail de confirmação. */
export const reenviarConfirmacao = () => { const u = auth().currentUser; return u ? sendEmailVerification(u) : Promise.resolve(); };
/** Depois de clicar no link do e-mail: recarrega a conta (se confirmou, o plano libera). */
export const jaConfirmei = async () => { const u = auth().currentUser; if (!u) return false; await reload(u); await u.getIdToken(true); return u.emailVerified; };

/** Acompanha a conta e o plano. Devolve a função para parar. */
export function acompanharConta(mudou: (u: User | null, plano: PlanoServidor | undefined) => void): () => void {
  let pararDoc: (() => void) | undefined;
  // onIdTokenChanged: além de entrar/sair, avisa quando a conta é recarregada (ex.: depois de confirmar o e-mail)
  let ultimo = '(começo)';
  const pararAuth = onIdTokenChanged(auth(), (u) => {
    const chave = u ? `${u.uid}|${u.emailVerified}` : '';
    if (chave === ultimo) return; // renovação de rotina do token: nada mudou
    ultimo = chave;
    pararDoc?.(); pararDoc = undefined;
    if (!u) { mudou(null, undefined); return; }
    mudou(u, undefined);
    // pede ao servidor para recalcular o acesso (o app antigo faz o mesmo ao entrar)
    httpsCallable(getFunctions(app(), 'us-central1'), 'syncUserAccess')({}).catch(() => undefined);
    restaurarComprasPlay();
    let doUsuario: PlanoServidor | undefined;
    let doPainel: Partial<PlanoServidor> = {};
    // SEGURANÇA: conta criada com e-mail e senha só ganha o plano pago depois de CONFIRMAR o e-mail
    // (senão alguém poderia criar conta com o e-mail de um cliente que pagou e pegar o plano dele). Google já vem confirmado.
    const naoConfirmado = !u.emailVerified && u.providerData.every((p) => p.providerId === 'password');
    if (naoConfirmado && !avisouVerificacao.has(u.uid)) { avisouVerificacao.add(u.uid); sendEmailVerification(u).catch(() => undefined); }
    const avisar = () => {
      const base = doUsuario ? { ...doUsuario, ...doPainel } : Object.keys(doPainel).length ? { hasAccess: false, ...doPainel } : undefined;
      if (naoConfirmado) mudou(u, { ...(base || { hasAccess: false }), hasAccess: false, testeDono: undefined, precisaConfirmarEmail: true });
      else mudou(u, base);
    };
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
    onValue(ref(db, 'limitações/anuncios'), (s) => { atual.anuncio = s.val(); mudou({ ...atual }); }, () => undefined),
    onValue(ref(db, 'appConfig/planSelection'), (s) => { atual.planos = (s.val() || {}) as DadosRemotos['planos']; mudou({ ...atual }); }, () => undefined),
  ];
  return () => paradas.forEach((p) => p());
}

/** Teste premium no servidor (função iniciarTestePremium). Sem a função publicada, devolve undefined (o app guarda no celular). */
export async function iniciarTesteServidor(): Promise<{ inicio: number; dias: number } | { erro: 'confirme-email' | 'falhou' }> {
  try {
    const r = await httpsCallable(getFunctions(app(), 'us-central1'), 'iniciarTestePremium')({});
    const d = r.data as { inicio?: unknown; dias?: unknown };
    if (typeof d?.inicio !== 'number' || typeof d?.dias !== 'number') return { erro: 'falhou' };
    return { inicio: d.inicio, dias: d.dias };
  } catch (e) { return { erro: String((e as { message?: string })?.message || '').includes('confirme-email') ? 'confirme-email' : 'falhou' }; }
}

/**
 * Compra pelo Google Play. A casca abre o pagamento e chama window.__vozCompra(json).
 * Depois o servidor confere (verifyGooglePlayPurchase) e libera hasAccess.
 */
let comprando = false;
export const comprar = (produto: string, tipo: 'subs' | 'inapp') => new Promise<'ok' | 'cancelado' | 'pendente'>((ok0, erro0) => {
  // SEGURANÇA: vários toques seguidos não abrem várias compras
  if (comprando) { erro0(new Error('compra-em-andamento')); return; }
  comprando = true;
  let acabou = false;
  const ok = (v: 'ok' | 'cancelado' | 'pendente') => { if (acabou) return; acabou = true; comprando = false; clearTimeout(fim); ok0(v); };
  const erro = (e: unknown) => { if (acabou) return; acabou = true; comprando = false; clearTimeout(fim); erro0(e); };
  const fim = setTimeout(() => erro(new Error('tempo-esgotado')), 120000);
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

/**
 * Restaurar compras: ao entrar na conta, o celular pergunta ao Google Play o que esta conta Google já comprou
 * (vitalício antigo, assinatura ativa) e manda para o servidor conferir e liberar (verifyGooglePlayPurchase).
 */
let ultimaRestauracao = 0;
export function restaurarComprasPlay() {
  const p = ponte();
  if (!p?.restaurarCompras || typeof window === 'undefined') return;
  if (Date.now() - ultimaRestauracao < 20000) return; // SEGURANÇA: no máximo a cada 20 s
  ultimaRestauracao = Date.now();
  const vistos = new Set<string>();
  (window as unknown as Record<string, unknown>).__vozRestaurar = async (txt: string) => {
    let r: { produto?: string; token?: string; tipo?: string } = {};
    try { r = JSON.parse(txt); } catch { return; }
    if (!r.token || !r.produto || vistos.has(r.token) || !auth().currentUser) return;
    vistos.add(r.token);
    try {
      await httpsCallable(getFunctions(app(), 'us-central1'), 'verifyGooglePlayPurchase')({ productId: r.produto, purchaseToken: r.token, productType: r.tipo === 'inapp' ? 'inapp' : 'subscription' });
      try { p.confirmarCompra?.(r.token); } catch { /* */ }
    } catch { /* o servidor tenta de novo na próxima abertura */ }
  };
  try { p.restaurarCompras(); } catch { /* */ }
}

/** Preços reais da Play Store, na moeda do cliente (ex.: { voz_amiga_monthly: "R$ 19,90" }). */
export const lerPrecos = (ids: string[]) => new Promise<Record<string, string>>((ok) => {
  const p = ponte();
  if (!p?.precos || typeof window === 'undefined') { ok({}); return; }
  const h = setTimeout(() => ok({}), 8000);
  (window as unknown as Record<string, unknown>).__vozPrecos = (txt: string) => { clearTimeout(h); try { ok(JSON.parse(txt)); } catch { ok({}); } };
  try { p.precos(JSON.stringify(ids)); } catch { clearTimeout(h); ok({}); }
});

export interface AnuncioPainel { id: string; titulo?: string; texto?: string; imagem?: string; link?: string; criadoEm: number }
/** Anúncios dos parceiros que o dono colocou no painel (limitações/anuncios/{id}). Só os LIGADOS, o mais novo primeiro. */
export function lerAnuncios(v: unknown): AnuncioPainel[] {
  const lista = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const t = (x: unknown, n: number) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
  const out: AnuncioPainel[] = [];
  for (const [id, raw] of Object.entries(lista)) {
    const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    if (o.ativo !== true) continue;
    // SEGURANÇA: o app confere de novo (só https/WhatsApp/e-mail no link; só https na foto), mesmo vindo do painel
    const a = { id: id.replace(/[^\w-]/g, '').slice(0, 40), titulo: t(o.titulo, 60), texto: t(o.texto, 120), imagem: imagemSegura(t(o.imagem, 500)) || '', link: linkSeguro(t(o.link, 500)) || '', criadoEm: typeof o.criadoEm === 'number' && Number.isFinite(o.criadoEm) ? o.criadoEm : 0 };
    if (a.titulo || a.imagem) out.push(a);
  }
  return out.sort((x, y) => y.criadoEm - x.criadoEm).slice(0, 30);
}
