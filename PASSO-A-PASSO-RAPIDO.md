# Passo a passo rápido (1 a 2 horas)

Tudo abaixo só **acrescenta** código. Firebase, login e Google Play Billing ficam como estão.

## 0. Instalar

```bash
node instalar-rotina.mjs /caminho/do/projeto-voz
```

O script copia `rotina-amiga/` para `src/rotina-amiga/`, confere as dependências e lista os arquivos onde ficam a raiz do app, o botão FALAR, o menu de cima, o anúncio e o `hasAccess`.

## 1. Raiz do app — conta, plano e voz (a ligação principal)

```tsx
import { RotinaAmigaProvider, RotinaTelas } from './src/rotina-amiga';

<RotinaAmigaProvider
  idioma={idiomaDoVoz}                                // 'pt' | 'en' | 'es'
  falar={(texto) => falarComAVozDoVoz(texto)}         // mesma voz e volume das Definições
  assinante={hasAccess}                               // ← o MESMO valor que o Voz já usa (users/{uid}.hasAccess)
  abrirPlanos={() => navigation.navigate('Planos')}   // ← tela de planos que já existe (Mensal, Vitalício…)
  abasVoz={abas.map((a) => ({ id: a.id, nome: a.nome }))}
  abrirAbaVoz={(id) => abrirAba(id)}                  // tarefa "Lanche" pode abrir a aba "Comida"
  tourIrPara={(t) => navigation.navigate({ home: 'Home', ajustesVoz: 'Ajustes', criarPrancha: 'CriarPrancha', definicoes: 'Definicoes' }[t])}
  // limitesFirebase={lerLimitesFirebase(snapshotDe('limitações/rotina'))}  // opcional (passo 6)
  // imprimirHtml={...expo-print...}                                         // opcional (PDF)
>
  {appDoVoz}
  <RotinaTelas />
</RotinaAmigaProvider>
```

Exemplos de leitura do `hasAccess` e dos limites (Firebase JS SDK ou @react-native-firebase) estão em `integracao-firebase/ligacao-voz.example.tsx`.

## 2. Tela inicial — menu de cima, área de baixo e "Como estou?"

```tsx
import { AnuncioProtegido, BotaoComoEstou, BotaoMenuVoz, ProximoPasso, useItensMenuRotina, useRotina } from './src/rotina-amiga';

const [premios] = useItensMenuRotina();
const { msAdulto, pedirAdulto } = useRotina();

// Menu de cima: TRAVAR APP · AJUSTES · PRÊMIOS · FRASES · TECLADO (mesma largura)
<BotaoMenuVoz item={premios} largura={larguraDosBotoes} altura={alturaDosBotoes} />
// AJUSTES / TRAVAR APP / ADICIONAR PRANCHA: segurar msAdulto + pedirAdulto(...) (ver INTEGRACAO.md)

// Menu de baixo (abas): no fim da lista
<BotaoComoEstou largura={larguraDosBotoes} altura={alturaDosBotoes} />

// Área do anúncio: próxima etapa da rotina; sem etapa => anúncio (gratuito) que só abre segurando 5 s
<ProximoPasso anuncio={<AnuncioProtegido anuncio={anuncioDoFirebase /* anuncio/1: imagem, link, openplan */} />} />
```

O `ProximoPasso` já esconde o anúncio de quem é assinante.

## 3. Fala — 3 linhas

```tsx
const { registrarFala, registrarPrancha, registrarFraseIncompleta } = useRotina();

// toque na prancha
registrarPrancha(prancha.texto, abaAtual.nome);

// botão FALAR (ms = tempo montando a frase, sug = palavras vindas das sugestões — opcionais)
registrarFala(frase.map((p) => p.texto), { ms: Date.now() - inicioDaFrase, sug: palavrasDasSugestoes });

// saiu do modo frase / limpou SEM falar
registrarFraseIncompleta(frase.map((p) => p.texto));
```

Teclado do app: troque o teclado do modo frase por `<TecladoAmigo … />` (ele já registra letras e correções).

### Menu da tela inicial (v9)

Tudo em cima: **linha 1** TRAVAR APP · AJUSTES · PRÊMIOS · TECLADO · `<BotaoComoEstou />`; **linha 2 em diante** as abas, quebrando linha (5 por linha, sem rolar).
**Tire o botão FRASES e o menu de abas de baixo.** Embaixo fica só `<ProximoPasso anuncio={…} />`. PRÊMIOS abre com 1 toque (`BotaoMenuVoz` já faz isso).

### Barra da frase SEMPRE na tela + um bloco só de sugestões (v9)

- Toque numa prancha: **fala a palavra na hora** (como hoje) **e** coloca a palavra na barra.
- Botão **FALAR**: diz a frase inteira. Assim a criança escolhe falar uma coisa só ou a frase completa.
- Tire a `BarraSugestoes` antiga (azul + roxo). Use só a `BarraSugestoesFrase`: botões fixos na tela, sem rolar e sem janela.

```tsx
import { BarraSugestoesFrase, PalavrasColoridas } from './rotina-amiga';

// barra (palavras coloridas: pessoa amarelo, ação verde, coisa laranja, sentimento azul, social rosa, não vermelho, pergunta roxo)
<PalavrasColoridas palavras={frase.map((p) => p.texto)} vazio="Toque nas pranchas ou numa frase pronta" />

// embaixo da barra — frase vazia: frases prontas; com palavras: próximas palavras + frases (até palavras que ainda não têm prancha)
<BarraSugestoesFrase frase={frase.map((p) => p.texto)} vocab={pranchas.map((p) => p.texto)}
  aoComecar={() => limparFrase()}
  aoPalavra={(w) => adicionarPalavraNaFrase(w)}
  aoFalarFrase={(ws) => { falar(ws.join(' ')); registrarFala(ws, { sug: ws.length }); }} />

// "X" (limpar) com 2 palavras ou mais sem FALAR => registrarFraseIncompleta(frase) (vai para o relatório)
```

As sugestões **não criam pranchas** sozinhas: quem cria são os pais (o limite de pranchas do gratuito continua o do Voz, `limitações/cardsGlobais`).
A tela de ajustes das frases já vem no módulo (quadro **FRASES PRONTAS** de `useItensAjustesRotina`).

### v10: mensagem inteligente, 4 colunas e botão de adicionar

```tsx
import { formularFrase, PalavrasColoridas } from './rotina-amiga';

// 1ª palavra da frase (prancha tocada ou sugestão): o app já monta a frase. Só fala no FALAR.
const adicionarPalavra = (w: string) => {
  if (!frase.length) {
    const f = defs.sugestoes ? formularFrase(w, idioma) : undefined;   // "água" => ["Eu","quero","água"]
    if (f) { setFrase(f); setAuto(f.length - 1); return; }
  }
  setFrase((x) => [...x, w]);
};
// na barra: palavras montadas pelo app tracejadas; tocar numa palavra tira da frase
<PalavrasColoridas palavras={frase} sugeridas={auto} aoTocar={(i) => tirarPalavra(i)} />
```

- O `TecladoAmigo` já mostra a mensagem inteligente sozinho (uma palavra escrita → "EU QUERO …"; tocar coloca no visor).
- Grade de pranchas: **4 colunas** no automático (Definições continua deixando mudar de 2 a 6).
- **ADICIONAR PRANCHA** só aparece enquanto não existe nenhuma prancha; a prancha criada por ele vai para a aba aberta.
- App novo começa **sem pranchas** (antes eram EU, QUERO, ÁGUA de exemplo).
- `ProximoPasso` ficou mais baixo; o anúncio embaixo dele não é mais cortado (`alturaFaixaAnuncio` padrão maior).

### v13: menu, aba GERAL, sem pop-up, prêmios com espera

**Menu de cima:**
- Linha 1: TRAVAR APP · AJUSTES · `BotaoMenuVoz(premios)` · TECLADO · **CRIAR PRANCHA**. O CRIAR PRANCHA é um `Segurar` de 3 s + `pedirAdulto`, que abre a tela Criar prancha do Voz.
- Linha 2: abas **Geral**, Pessoas, Expressão social, Descrição e Ações.
- Tire a aba **Favoritos** e o `<BotaoComoEstou />`.

**Aba Geral:**
- Mostra **todas** as pranchas.
- Cada uma usa o tema (cor) da aba/categoria dela. Na tela Criar prancha, o padrão é **"Automática"**:

```ts
import { categoriaDaPalavra } from './rotina-amiga';
const categoria = (texto: string) => {
  const c = categoriaDaPalavra(texto.trim().split(/\s+/)[0] || '');
  return c === 'pessoa' ? 'pessoas' : c === 'verbo' ? 'acoes' : ['social', 'pergunta', 'negacao'].includes(c) ? 'social' : 'descricao';
};
```

- **Migração:** quem tinha a aba Favoritos ganha a Geral, e as pranchas que estavam em Favoritos recebem a categoria automática. Veja `migrarVoz` em `app-de-teste/demo/voz/base.tsx`.

**Sem pop-up:** o módulo já não mostra janela de comemoração. Use o selo do botão PRÊMIOS, que vem em `useItensMenuRotina()`.

**Prêmios:** a regra fica em `config.premioModo` (`imediato` | `espera` | `intervalo`) e `config.premioMin` (1 a 120). A tela de Ajustes da Rotina já traz a opção.

**Sem zoom:**
- O app nativo do React Native não tem zoom de pinça.
- Limite o tamanho de letra do sistema com `Text.defaultProps = { ...(Text.defaultProps || {}), maxFontSizeMultiplier: 1.2 }` (o mesmo vale para `TextInput`).
- Se algum dia usar WebView, use `setSupportZoom(false)` / `scalesPageToFit={false}`.

**X e voltar:** em **todas** as telas (Criar prancha, Gerir abas, Pacotes, Assinatura, Sobre, Curso, Definições…), o X e a seta fazem `navigation.goBack()`, ou seja, voltam para a tela anterior.

### Botão voltar

Nas telas de ajustes do Voz (Criar prancha, Gerir abas, Baixar pacotes, Assinatura, Sobre, Definições), a seta ← deve fazer `navigation.goBack()` (tela anterior), não ir para o início.
As telas do módulo já fazem isso (`voltar()` desempilha uma tela).

## 4. Ajustes e Opções

```tsx
const novos = useItensAjustesRotina();
// ROTINA AMIGA · RELATÓRIO GERAL (com Registrar momento dentro) · FRASES PRONTAS · AJUDA E TOUR
novos.map((it) => <QuadroDoVoz key={it.id} titulo={it.rotulo} onPress={it.aoTocar} />)
```

## 5. Tour (marcar os botões originais)

Envolva os botões do Voz com `<AlvoTour id="...">` (tabela de ids em `INTEGRACAO.md`). Não muda o visual.

## 6. Firebase (opcional — só se quiser mudar os limites do gratuito sem atualizar o app)

No Realtime Database, dentro de **`limitações`**, acrescente o conteúdo de `integracao-firebase/limitacoes-rotina.json` (nó `rotina`).
As regras atuais já permitem a leitura (`limitações`: `auth != null`). **Confira que a gravação está fechada** (`".write": false` em `limitações`, `anuncio` e `appConfig`): veja `SEGURANCA-DESENVOLVEDOR.md`.
Sem esse nó, valem os padrões: 1 rotina, 3 tarefas, 6 prêmios, sem temporizador/horário/metas, relatório de 7 dias, com anúncio.

## 7. Conferir e publicar

1. `npx tsc --noEmit` e `npx expo start`.
2. No app: **Ajustes → AJUDA E TOUR → segure 5 s no rodapé** → "Conferência do desenvolvedor": tudo ✅.
3. Subir o `versionCode` (o atual na loja é **24**) e gerar com a **chave de upload de sempre** (`eas build -p android --profile production`).
4. Enviar para o **teste interno** da Play Console. O cliente testa com a conta de testador (compra de teste).
5. Aprovado: produção em etapas (20% → 100%).
