// ============================================================================
// LIGAÇÃO DO ROTINA AMIGA COM O QUE O VOZ AMIGA JÁ TEM (Google Play + Firebase)
// Nada aqui muda pagamento, login ou regras do Firebase: o módulo só LÊ o que o app já sabe.
//
// 3 informações que o app passa para o <RotinaAmigaProvider>:
//   1) assinante        -> o MESMO valor que o Voz usa hoje para tirar anúncio/liberar recursos
//                          (no Firebase: Firestore users/{uid}.hasAccess — atualizado pela função syncUserAccess)
//   2) limitesFirebase  -> Realtime Database "limitações/rotina" (arquivo limitacoes-rotina.json)
//   3) anúncio          -> Realtime Database "anuncio/1" (imagem, link, openplan) — o mesmo que o Voz já usa
//
// Use a variante que o projeto já usa: (A) Firebase JS SDK  ou  (B) @react-native-firebase.
// Se o Voz já tem um hook/estado com "hasAccess", use ele direto e ignore os exemplos de leitura.
// ============================================================================
import React, { useEffect, useState } from 'react';
import { AnuncioProtegido, DadosAnuncio, LimitesRotina, lerLimitesFirebase, RotinaAmigaProvider, RotinaTelas } from '../src/rotina-amiga';

// ---------------------------------------------------------------- (A) Firebase JS SDK (firebase/app, firebase/firestore, firebase/database)
// import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
// import { getDatabase, ref, onValue } from 'firebase/database';
//
// function useAcessoEConfig(uid?: string) {
//   const [assinante, setAssinante] = useState(false);
//   const [limites, setLimites] = useState<Partial<LimitesRotina>>();
//   const [anuncio, setAnuncio] = useState<DadosAnuncio>();
//   useEffect(() => {
//     if (!uid) return;
//     const off1 = onSnapshot(doc(getFirestore(), 'users', uid), (d) => setAssinante(!!d.data()?.hasAccess));
//     const off2 = onValue(ref(getDatabase(), 'limitações/rotina'), (s) => setLimites(lerLimitesFirebase(s.val())));
//     const off3 = onValue(ref(getDatabase(), 'anuncio/1'), (s) => setAnuncio(s.val() || undefined));
//     return () => { off1(); off2(); off3(); };
//   }, [uid]);
//   return { assinante, limites, anuncio };
// }

// ---------------------------------------------------------------- (B) @react-native-firebase
// import firestore from '@react-native-firebase/firestore';
// import database from '@react-native-firebase/database';
//
// function useAcessoEConfig(uid?: string) {
//   const [assinante, setAssinante] = useState(false);
//   const [limites, setLimites] = useState<Partial<LimitesRotina>>();
//   const [anuncio, setAnuncio] = useState<DadosAnuncio>();
//   useEffect(() => {
//     if (!uid) return;
//     const off1 = firestore().collection('users').doc(uid).onSnapshot((d) => setAssinante(!!d.data()?.hasAccess));
//     const r2 = database().ref('limitações/rotina');
//     const f2 = r2.on('value', (s) => setLimites(lerLimitesFirebase(s.val())));
//     const r3 = database().ref('anuncio/1');
//     const f3 = r3.on('value', (s) => setAnuncio(s.val() || undefined));
//     return () => { off1(); r2.off('value', f2); r3.off('value', f3); };
//   }, [uid]);
//   return { assinante, limites, anuncio };
// }

// ---------------------------------------------------------------- Encaixe na raiz do app
// (troque os nomes marcados com ← pelos do projeto do Voz)
export function RaizComRotina({ children, uid, idioma, falarComAVozDoVoz, navigation, abasDoVoz, abrirAbaDoVoz, hasAccessQueOVozJaTem }: {
  children: React.ReactNode;
  uid?: string;
  idioma: string;
  falarComAVozDoVoz: (texto: string) => void;
  navigation: { navigate: (tela: string) => void };
  abasDoVoz: { id: string; nome: string }[];
  abrirAbaDoVoz: (id: string) => void;
  hasAccessQueOVozJaTem: boolean; // ← o valor que o Voz já usa hoje (users/{uid}.hasAccess)
}) {
  // const { limites } = useAcessoEConfig(uid);   // ← (A) ou (B), se quiser os limites pelo Firebase
  const limites: Partial<LimitesRotina> | undefined = undefined;
  void uid;
  return (
    <RotinaAmigaProvider
      idioma={idioma}
      falar={(t) => falarComAVozDoVoz(t)}
      assinante={hasAccessQueOVozJaTem}
      limitesFirebase={limites}
      abrirPlanos={() => navigation.navigate('Planos')}            // ← tela de planos que já existe
      abasVoz={abasDoVoz}
      abrirAbaVoz={abrirAbaDoVoz}
      tourIrPara={(t) => navigation.navigate(({ home: 'Home', ajustesVoz: 'Ajustes', criarPrancha: 'CriarPrancha', definicoes: 'Definicoes' } as const)[t])}
      // imprimirHtml={async (html) => { const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri); }} // opcional: expo-print + expo-sharing
    >
      {children}
      <RotinaTelas />
    </RotinaAmigaProvider>
  );
}

/** Área de baixo da tela inicial: próxima etapa da rotina; sem etapa => anúncio (gratuito) que só abre segurando 5 s. */
export function AreaDeBaixo({ anuncio }: { anuncio?: DadosAnuncio }) {
  // import { ProximoPasso } from '../src/rotina-amiga';
  // return <ProximoPasso anuncio={<AnuncioProtegido anuncio={anuncio} />} />;
  return <AnuncioProtegido anuncio={anuncio} />;
}

export const _naoUsado = { useEffect, useState };
