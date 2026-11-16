// VOZ AMIGA v14.8 — funções do servidor (Firebase Cloud Functions, projeto voz-amiga-651a5)
//
// ATENÇÃO NA HORA DE PUBLICAR: o projeto JÁ tem funções do desenvolvedor (Kiwify etc.).
// Publique SÓ estas, pelo nome, para não apagar as outras:
//   firebase deploy --only functions:iniciarTestePremium,functions:notificacaoPlay,functions:adiarRenovacoesSabado
//
// 1) iniciarTestePremium  — os pais tocam "Testar grátis": o início fica no servidor (não reinicia reinstalando o app).
// 2) notificacaoPlay      — recebe os avisos do Google Play (RTDN, via Pub/Sub) e guarda quando cada assinatura renova.
// 3) adiarRenovacoesSabado — de hora em hora: renovação que cairia de sexta 17h a sábado 20h é ADIADA para depois.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();
const PACOTE = 'com.vozamiga';
const TOPICO_PLAY = 'play-rtdn'; // nome do tópico Pub/Sub ligado na Play Console (Monetização › Configuração)

// ------------------------------------------------------------------ janela do sábado (igual ao app: v14/premium.ts)
const JANELA_PADRAO = { ativo: true, inicioDia: 5, inicioHora: 17, fimDia: 6, fimHora: 20, fusoDonoMin: -180 };
const lerJanela = (x) => {
  const o = x && typeof x === 'object' ? x : {};
  const int = (v, min, max, d) => (Number.isInteger(v) && v >= min && v <= max ? v : d);
  return {
    ativo: o.ativo === false ? false : true,
    inicioDia: int(o.inicioDia, 0, 6, 5), inicioHora: int(o.inicioHora, 0, 23, 17),
    fimDia: int(o.fimDia, 0, 6, 6), fimHora: int(o.fimHora, 0, 23, 20),
    fusoDonoMin: int(o.fusoDonoMin, -720, 840, -180),
  };
};
const minutoSemana = (ms, fuso) => { const d = new Date(ms + fuso * 60000); return d.getUTCDay() * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes(); };
const dentro = (m, j) => { const i = j.inicioDia * 1440 + j.inicioHora * 60, f = j.fimDia * 1440 + j.fimHora * 60; return i <= f ? m >= i && m < f : m >= i || m < f; };
const travado = (ms, j) => j.ativo && dentro(minutoSemana(ms, j.fusoDonoMin), j);
/** Para quando adiar uma renovação que cairia na janela (2 h depois do fim). */
const adiarPara = (ms, j) => {
  if (!travado(ms, j)) return undefined;
  for (let t = ms - (ms % 60000) + 60000, k = 0; k < 4 * 1440; t += 60000, k++) if (!travado(t, j)) return t + 2 * 3600000;
  return undefined;
};
exports._teste = { lerJanela, travado, adiarPara }; // usado nos testes

// ------------------------------------------------------------------ 1) teste premium no servidor
exports.iniciarTestePremium = onCall({ region: 'us-central1' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Entre na conta primeiro.');
  const diasCfg = (await admin.database().ref('limitações/rotina/testePremiumDias').get()).val();
  const dias = Number.isInteger(diasCfg) && diasCfg >= 0 && diasCfg <= 365 ? diasCfg : 30;
  if (dias === 0) throw new HttpsError('failed-precondition', 'O teste premium está desligado.');
  const docRef = admin.firestore().doc(`users/${req.auth.uid}`);
  return admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const ja = snap.exists ? snap.get('testePremium') : undefined;
    if (ja && ja.inicio) return { inicio: ja.inicio.toMillis ? ja.inicio.toMillis() : ja.inicio, dias: ja.dias, jaUsado: true };
    const inicio = Date.now();
    tx.set(docRef, { testePremium: { inicio: admin.firestore.Timestamp.fromMillis(inicio), dias } }, { merge: true });
    return { inicio, dias, jaUsado: false };
  });
});

// ------------------------------------------------------------------ Google Play API
const play = () => google.androidpublisher({ version: 'v3', auth: new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/androidpublisher'] }) });

// ------------------------------------------------------------------ 2) avisos do Google Play: guarda a próxima renovação
exports.notificacaoPlay = onMessagePublished({ topic: TOPICO_PLAY, region: 'us-central1' }, async (ev) => {
  const msg = ev.data.message.json || {};
  const n = msg.subscriptionNotification;
  if (!n || msg.packageName !== PACOTE) return;
  const r = await play().purchases.subscriptions.get({ packageName: PACOTE, subscriptionId: n.subscriptionId, token: n.purchaseToken });
  const expira = Number(r.data.expiryTimeMillis || 0);
  await admin.firestore().doc(`assinaturasPlay/${n.purchaseToken}`).set({
    subscriptionId: n.subscriptionId, expira, renovaSozinha: r.data.autoRenewing === true, atualizado: Date.now(),
  }, { merge: true });
});

// ------------------------------------------------------------------ 3) adiar renovação que cairia no sábado
exports.adiarRenovacoesSabado = onSchedule({ schedule: 'every 60 minutes', timeZone: 'America/Sao_Paulo', region: 'us-central1' }, async () => {
  const j = lerJanela((await admin.database().ref('limitações/sabado').get()).val());
  if (!j.ativo) return;
  const agora = Date.now();
  // olha as renovações das próximas 72 h
  const q = await admin.firestore().collection('assinaturasPlay').where('renovaSozinha', '==', true).where('expira', '>', agora).where('expira', '<', agora + 72 * 3600000).get();
  for (const d of q.docs) {
    const a = d.data();
    const novo = adiarPara(a.expira, j);
    if (!novo || novo <= a.expira) continue;
    try {
      await play().purchases.subscriptions.defer({
        packageName: PACOTE, subscriptionId: a.subscriptionId, token: d.id,
        requestBody: { deferralInfo: { expectedExpiryTimeMillis: String(a.expira), desiredExpiryTimeMillis: String(novo) } },
      });
      await d.ref.set({ expira: novo, adiadoEm: agora, adiadoDe: a.expira }, { merge: true });
    } catch (e) {
      console.error('Não deu para adiar', d.id.slice(0, 8), e.message);
    }
  }
});
