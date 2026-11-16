// EXEMPLO de encaixe no projeto ORIGINAL do Voz Amiga (os nomes dos componentes do Voz aqui são ilustrativos).
// A ideia é só ACRESCENTAR — nada de Firebase, login ou Google Play Billing é alterado.
import React from 'react';
import { View } from 'react-native';
import {
  AlvoTour, AnuncioProtegido, BarraSugestoesFrase, PalavrasColoridas, BotaoMenuVoz, ProximoPasso, QuadroAjustesVoz, RotinaAmigaProvider, RotinaTelas, Segurar, TecladoAmigo,
  useItensAjustesRotina, useItensMenuRotina, useRotina,
} from './src/rotina-amiga';

// ---------------------------------------------------------------- 1) raiz do app
export function RaizDoVoz({ children, idioma, falarComAVozDoVoz, navigation, hasAccess, abasDoVoz, abrirAbaDoVoz }: any) {
  return (
    <RotinaAmigaProvider
      idioma={idioma}                                              // 'pt' | 'en' | 'es' — o mesmo das Definições do Voz
      falar={(texto) => falarComAVozDoVoz(texto)}                  // mesma voz e volume do Voz
      tourIrPara={(t) => navigation.navigate(({ home: 'Home', ajustesVoz: 'Ajustes', criarPrancha: 'CriarPrancha', definicoes: 'Definicoes' } as const)[t])}
      assinante={hasAccess}                                        // ← mesmo valor que o Voz já usa (users/{uid}.hasAccess)
      abrirPlanos={() => navigation.navigate('Planos')}            // ← tela de planos que já existe
      abasVoz={abasDoVoz}                                          // [{ id, nome }]
      abrirAbaVoz={abrirAbaDoVoz}
    >
      {children /* ← o app do Voz inteiro, como está hoje (login, Firebase, pagamento…) */}
      <RotinaTelas />
    </RotinaAmigaProvider>
  );
}

// ---------------------------------------------------------------- 2) tela inicial do Voz (v9)
export function TrechosDaHome({ BotaoDoVoz, anuncioDoFirebase, abrirAjustesDoVoz, abrirCriarPrancha, travarApp, frase, setFrase, falarFrase, pranchas, abas, AbaDoVoz, defs, falarVoz }: any) {
  const { pedirAdulto, registrarFala, registrarFraseIncompleta, msAdulto } = useRotina();
  const [premios] = useItensMenuRotina();
  const [teclado, setTeclado] = React.useState(false);
  const [largMenu, setLargMenu] = React.useState(370);
  const lt = Math.floor((largMenu - 4 * 7) / 5); // MESMA largura para todos os quadradinhos (5 por linha)
  const vocab = pranchas.map((p: any) => p.texto);
  return (
    <>
      {/* EM CIMA, linha 1: TRAVAR APP · AJUSTES · PRÊMIOS · TECLADO · Como estou? (sem o botão FRASES) */}
      <View onLayout={(e) => setLargMenu(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AlvoTour id="travar">
          <Segurar ms={msAdulto} aoCompletar={() => pedirAdulto(travarApp, 'Travar app')}><BotaoDoVoz titulo="TRAVAR APP" largura={lt} /></Segurar>
        </AlvoTour>
        <AlvoTour id="ajustes">
          <Segurar ms={msAdulto} aoCompletar={() => pedirAdulto(abrirAjustesDoVoz, 'Ajustes')}><BotaoDoVoz titulo="AJUSTES" largura={lt} /></Segurar>
        </AlvoTour>
        <AlvoTour id="premios"><BotaoMenuVoz item={premios} largura={lt} altura={56} /></AlvoTour>
        <AlvoTour id="teclado"><BotaoDoVoz titulo="TECLADO" largura={lt} onPress={() => setTeclado(true)} /></AlvoTour>
        {/* v13: CRIAR PRANCHA (atalho dos pais) no lugar do "Como estou?" */}
        <AlvoTour id="criarPrancha"><Segurar ms={msAdulto} aoCompletar={() => pedirAdulto(abrirCriarPrancha, 'Criar prancha')}><BotaoDoVoz titulo="CRIAR PRANCHA" largura={lt} /></Segurar></AlvoTour>
      </View>
      {/* linha 2 em diante: as abas, quebrando linha (todas à vista, sem rolar) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 7, rowGap: 7, columnGap: 7 }}>
        {abas.map((a: any, i: number) => <AlvoTour key={a.id} id={i === 0 ? 'abas' : `aba-${a.id}`}><AbaDoVoz aba={a} largura={lt} /></AlvoTour>)}
      </View>

      {/* BARRA DA FRASE — sempre na tela */}
      <AlvoTour id="frases">
        <View>
          <PalavrasColoridas palavras={frase} vazio="Toque nas pranchas ou numa frase pronta" />
          {/* FALAR: onPress={() => { falarFrase(frase); registrarFala(frase); }} */}
          {/* X: onPress={() => { if (frase.length > 1) registrarFraseIncompleta(frase); setFrase([]); }} */}
          {/* UM bloco só de sugestões, botões fixos (frases prontas + o que o app entende) */}
          {defs.sugestoes ? (
            <BarraSugestoesFrase frase={frase} vocab={vocab} aoComecar={() => setFrase([])}
              aoPalavra={(w) => setFrase((f: string[]) => [...f, w])}
              aoFalarFrase={(ws) => { falarVoz(ws.join(' ')); registrarFala(ws, { sug: ws.length }); }} />
          ) : null}
        </View>
      </AlvoTour>

      {/* … grade de pranchas do Voz … */}
      {/* toque na prancha: FALA NA HORA e entra na frase; se for a 1ª palavra, formularFrase() já monta "EU QUERO …" (só fala no FALAR) */}
      {/* onPress={() => { registrarPrancha(prancha.texto); falarPrancha(prancha); setFrase((f) => [...f, prancha.texto]); }} */}

      {/* TECLADO do aplicativo (colorido; normal/avançado pelas Definições) */}
      <TecladoAmigo visivel={teclado} fechar={() => setTeclado(false)} avancado={defs.tecladoAvancado} sugestoes={defs.sugestoes} vocab={vocab}
        aoFalar={(texto, palavras) => { falarVoz(texto); registrarFala(palavras); }} />

      {/* EMBAIXO: só a próxima etapa da rotina; sem etapa, o anúncio (gratuito, abre segurando 5 s) */}
      <ProximoPasso anuncio={<AnuncioProtegido anuncio={anuncioDoFirebase} />} />
    </>
  );
}
// ---------------------------------------------------------------- 3) Ajustes e Opções do Voz
export function TrechosDosAjustes({ QuadroDoVoz }: any) {
  const novos = useItensAjustesRotina(); // ROTINA AMIGA, RELATÓRIO GERAL, FRASES PRONTAS, AJUDA E TOUR
  const idTour: Record<string, string> = { ajustesRotina: 'aj_rotina', relatorio: 'aj_relatorio', tour: 'aj_tour' };
  return (
    <>
      <AlvoTour id="aj_criar"><QuadroDoVoz titulo="CRIAR PRANCHA" /></AlvoTour>
      <AlvoTour id="aj_editar"><QuadroDoVoz titulo="EDITAR PRANCHAS" /></AlvoTour>
      {/* … aj_excluir, aj_gerir, aj_editarAbas, aj_pacotes, aj_assinatura, aj_sobre, aj_definicoes … */}
      {novos.map((it) => (
        <AlvoTour key={it.id} id={idTour[it.id]}>
          {/* de preferência desenhe com o QuadroDoVoz original, usando it.rotulo / it.icone / it.cor / it.aoTocar */}
          <QuadroAjustesVoz item={it} />
        </AlvoTour>
      ))}
    </>
  );
}
