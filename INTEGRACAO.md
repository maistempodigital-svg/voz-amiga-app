# Rotina Amiga dentro do Voz Amiga: guia de integração

Este pacote coloca o **Rotina Amiga** dentro do projeto **original** do Voz Amiga (Expo SDK 54 / React Native 0.81).
Nada do que já existe é substituído: o desenvolvedor só **acrescenta** componentes em 5 lugares.

**Firebase, login e pagamento do Google não são tocados.** O módulo não importa nada disso. Os dados da rotina ficam no
AsyncStorage do aparelho, numa chave separada (`@voz-amiga/rotina-amiga-v1`).

> **Versão 13:** aba GERAL e atalho CRIAR PRANCHA, sem Favoritos nem "Como estou?", sem pop-ups (selo pequeno no PRÊMIOS), regra de liberação dos prêmios, relatório com Hoje/7/15/30 dias/2 meses/datas livres, teclado em tela cheia, sem zoom, X volta. Ver `PASSO-A-PASSO-RAPIDO.md`.
>
> **Versão 10:** frases prontas compactas, começa sem pranchas (ADICIONAR some depois da 1ª), 4 colunas, rotina mais baixa e anúncio sem corte, mensagem inteligente (`formularFrase`). Ver `PASSO-A-PASSO-RAPIDO.md`.
>
> **Versão 9:** sem botão FRASES — a barra da frase fica sempre na tela; um bloco só de sugestões (`BarraSugestoesFrase`); "Como estou?" na 1ª linha; abas sem rolar. Ver `PASSO-A-PASSO-RAPIDO.md`.
>
> **Versão 8:** menu todo em cima, frases prontas coloridas, modo frase sempre ligado, PRÊMIOS com 1 toque, conta até 15, Ajuda e tour juntos, Registrar momento dentro do relatório, sem modo foco. Detalhes em `PASSO-A-PASSO-RAPIDO.md` (seção "v8").
>
> **Versão 7:** para o caminho curto, use `instalar-rotina.mjs` + `PASSO-A-PASSO-RAPIDO.md`. As novidades da v7 (plano gratuito x completo,
> anúncio protegido, "Como estou?", registro de crises, relatório para profissionais, ajuda, notificações) estão na seção
> **"Novidades da versão 7"** no fim deste guia.

---

## 0. Antes de começar

**Não precisa instalar nenhum pacote novo.** O módulo usa só bibliotecas que o Voz Amiga já tem:

| Pacote | Para quê |
|---|---|
| `@expo/vector-icons` | ícones Feather e MaterialCommunityIcons, os mesmos do Voz e do Rotina |
| `@react-native-async-storage/async-storage` | salvar rotinas, estrelas e histórico |
| `expo-speech` | falar o nome da tarefa (ou use a função de fala do próprio Voz, passo 1) |
| `expo-image-picker` | FOTO / GALERIA no ícone da tarefa |
| `react-native-safe-area-context` | margens da tela cheia |

Como não entra nenhuma parte nativa nova, o build continua o mesmo de sempre (`eas build`).

1. Copie a pasta **`rotina-amiga/`** para dentro do projeto, por exemplo em `src/rotina-amiga/`.
2. Confirme que o `tsconfig.json` aceita importar `.json`. O `expo/tsconfig.base` já aceita.

---

## 1. Envolver o app (arquivo raiz, ex.: `App.tsx` ou `app/_layout.tsx`)

```tsx
import { RotinaAmigaProvider, RotinaTelas } from './src/rotina-amiga';

export default function App() {
  const idioma = /* idioma atual do Voz: 'pt' | 'en' | 'es' */;
  return (
    <RotinaAmigaProvider
      idioma={idioma}
      // opcional: usar a MESMA voz/volume escolhidos em Definições > Voz Nativa
      falar={(texto, locale) => falarComAVozDoVoz(texto)}
      // opcional: copiar a foto para a pasta do app, igual o Voz faz nas pranchas
      salvarImagem={async (uri) => copiarFotoParaPastaDoApp(uri)}
    >
      {/* ...tudo que já existe no Voz, sem mudar nada... */}
      <RotinaTelas />   {/* ← última linha dentro do Provider */}
    </RotinaAmigaProvider>
  );
}
```

`<RotinaTelas />` abre as telas do Rotina em tela cheia, por cima do Voz. Ele também mostra a festinha de estrelas, o aviso
de alarme e a conta de matemática dos pais. **Não precisa mexer na navegação do Voz** (expo-router ou react-navigation).

---

## 2. Tela inicial: área dos anúncios (embaixo)

Onde hoje fica o componente de anúncio:

```tsx
import { ProximoPasso } from './src/rotina-amiga';

// antes:  <SeuAnuncio />
<ProximoPasso anuncio={<SeuAnuncio />} />
// opcional: anuncioCompacto={<SeuAnuncioPequeno />} para a faixa curta embaixo da etapa
```

Como funciona:

- **Tem etapa agora?** A criança vê **só a próxima etapa**: ícone, nome, botão **COMEÇAR**. Embaixo dela aparece um pedaço do anúncio.
- **Não tem etapa** (fora do horário, tudo feito, ou desligado em Opções)? Mostra **o anúncio inteiro**, como hoje.
- Tocar no cartão **não abre nenhuma tela**, para a criança não perder o foco.
- **Tarefa com temporizador:** a criança não consegue terminar antes. Quando o tempo acaba, conclui sozinha e ganha estrela.
- **Tarefa sem temporizador:** o botão **TERMINEI** só libera depois de alguns segundos (padrão 5 s, ajustável).
- **Configurações do Rotina pela tela inicial:** segure o nome da rotina no cartão (ex.: **MANHÃ**) por **3 segundos** (padrão; o pai pode aumentar).
  Abre a conta dos pais, se estiver ligada, e depois os Ajustes do Rotina.
- **Adulto:** segura o cartão por 3 s (padrão), resolve a conta (se a "Senha dos pais" estiver ligada) e escolhe:
  concluir agora com estrela, pular sem estrela, ou cancelar.
- **Travar até o horário:** o cartão mostra "AGUARDE 13:30" até chegar a hora.
- **Recompensa com espera** (ex.: "Ver desenho, 5 min"): a contagem também aparece aqui.

Para usuário **sem anúncio** (assinante), basta não passar `anuncio`. Aparece só a etapa, quando houver uma.

---

## 3. Menu de cima: um botão só, PRÊMIOS (Prêmios + Metas + Conquistas)

Use **o mesmo componente de botão que o Voz já usa** (TRAVAR APP, FRASES, AJUSTES…) para o visual ficar idêntico:

```tsx
import { useItensMenuRotina } from './src/rotina-amiga';

const itensRotina = useItensMenuRotina();
// cada item tem: { id, rotulo, icone: {f:'feather'|'mci', n}, cor, fundo, selo, aoTocar }
// cada item também tem segurarMs (2000): ATIVA SEGURANDO, igual AJUSTES / TRAVAR APP do Voz.
// coloque junto dos botões fixos do menu (por exemplo, PRÊMIOS depois de FRASES e METAS depois de TECLADO):
{itensRotina.map((it) => (
  <BotaoDoMenuDoVoz key={it.id} titulo={it.rotulo} icone={it.icone.n} cor={it.cor} onPress={it.aoTocar} selo={it.selo} />
))}
```

Se preferir, use o botão pronto, passando **a mesma largura/altura dos botões do Voz** para ficar tudo do mesmo tamanho:
`<BotaoMenuVoz item={it} largura={L} altura={A} raio={R} borda={B} />`. Ele já ativa segurando, com uma faixa que enche o botão.
Também existe `<Segurar ms={2000} aoCompletar={...}>` para usar em qualquer botão.

- **PRÊMIOS** abre a Loja de estrelas, com o mesmo layout do Rotina Amiga. O selo mostra o saldo de estrelas.
- **PRÊMIOS** abre **uma tela só** com três abas: **Prêmios** (loja de estrelas), **Metas** (do dia e da semana, juntando fala e rotina) e **Conquistas** (medalhas).
  O selo mostra as estrelas e quantas metas estão prontas para resgatar.

---

## 4. Ajustes e Opções do Voz: 2 quadros novos

```tsx
import { useItensAjustesRotina, QuadroAjustesVoz } from './src/rotina-amiga';

const novos = useItensAjustesRotina(); // [ROTINA AMIGA, RELATÓRIO GERAL]
// na grade (CRIAR PRANCHA, EDITAR PRANCHAS, ...), use o quadro do próprio Voz ou o pronto:
{novos.map((it) => <QuadroAjustesVoz key={it.id} item={it} />)}
```

- **ROTINA AMIGA** abre os Ajustes do Rotina, iguais ao app original:
  - **Tarefas:** rotina atual, lista, editar, excluir, adicionar.
  - **Relatórios:** semanal/mensal, melhor dia, tempo total, saldo.
  - **Opções:** saldo da criança, gerenciar loja, gerenciar metas, estrelas pela fala, gerenciar abas,
    mostrar na tela inicial, senha dos pais, travar horário, sons suaves.
  - Idioma e "Sair da conta" ficam **só nos ajustes do Voz**, que já os tem.
- **RELATÓRIO GERAL** é o relatório de tudo (Voz + Rotina). Ele não fica dentro do Rotina.
  - **Períodos:** 7 dias, 15 dias, 1, 2, 3, 6 e 12 meses, sempre terminando hoje.
  - **Gráficos:** por dia, por semana ou por mês, conforme o período escolhido.
  - **Comparação:** cada número mostra a variação em % em relação ao período anterior.
  - **Comunicação:** palavras faladas, frases, palavras diferentes, palavras novas e palavras mais usadas.
  - **Rotina:** tarefas, rotinas completas, tempo nas tarefas, liberações pelo adulto e tarefas mais feitas.
  - **Tempo usando o app:** só conta com o app aberto na tela, sem tempo ocioso. Mostra o total, os dias com uso e a média por dia.
  - **Mostra só o que foi usado:** se no período só a Voz foi usada, só a Voz aparece; se foram as duas, aparecem as duas.
  - **Mês a mês:** cada mês diz se usou Voz, Rotina ou os dois.
  - **Enviar no WhatsApp:** monta um texto pronto para o profissional. O provider aceita `abrirLink` e `compartilhar`, se quiser trocar o comportamento padrão.

---

## 5. Ligar a fala ao sistema de estrelas (2 linhas)

```tsx
import { useRotina } from './src/rotina-amiga';
const { registrarFala, registrarPrancha } = useRotina();

// no botão FALAR, com as palavras da frase montada:
registrarFala(frase.map((p) => p.texto));

// ao tocar numa prancha (só registra para o relatório; não dá estrela):
registrarPrancha(prancha.texto);
```

Regras que **incentivam a fala sem premiar apertar sem parar**:

- Toque solto não vale. Só vale frase com **2 ou mais palavras diferentes**.
- A **mesma frase** só vale uma vez por dia.
- Há um **intervalo mínimo** entre frases premiadas (padrão 20 s).
- Há um **limite diário** de estrelas vindas da fala (padrão 10).
- Palavra nova (usada pela primeira vez) vale **+1** (máx. +2 por frase).

Os pais ajustam tudo isso em Rotina Amiga → Opções → Estrelas pela fala.

---

## Começa do zero

Na primeira vez **não há rotina nem tarefas**. Os pais tocam em **Criar rotina** e escolhem um modelo (Manhã, Tarde, Noite, Escola, Banheiro) ou dão um nome próprio, e depois criam as tarefas.

- **Sem tarefa no momento:** a área de baixo mostra só o anúncio.
- **Ao terminar:** o cartão sai deslizando para o lado.
- **Tarefas sem horário:** aparecem quando não há nenhuma rotina com horário acontecendo.

## Opcional: alarme com o app fechado

Com o app **aberto**, o alarme da tarefa já funciona: fala o nome, vibra e mostra um aviso.
Para avisar com o app **fechado**, instale `expo-notifications` (`npx expo install expo-notifications`) e agende a partir de
`estado.tarefas` (as que têm `alarme: true` e `horario`). Isso exige um novo build nativo, por isso ficou fora do módulo.

## Opcional: sincronizar com o Firebase depois

Para guardar os dados da rotina na conta do usuário, passe um armazenamento próprio ao Provider:

```tsx
<RotinaAmigaProvider armazenamento={{ ler: () => lerDoSeuBanco(), gravar: (json) => gravarNoSeuBanco(json) }} />
```

O padrão é o AsyncStorage local. Não há ligação com o Firebase, a não ser que vocês escolham fazer isso.

## "Travar aplicativo"

Continua sendo o do Voz (TRAVAR APP / Bloquear App), sem mudança. A tarefa em andamento tem a sua própria trava: só termina
quando o tempo acaba ou quando o adulto libera.

---

## Arquivos

```
rotina-amiga/
  index.ts              ← tudo que o Voz importa
  estado.tsx            ← Provider, useRotina(), relógio, alarme, salvar
  RotinaTelas.tsx       ← telas em tela cheia + festinha + portão dos pais
  home/ProximoPasso.tsx ← cartão da próxima etapa (área dos anúncios)
  home/Menus.tsx        ← itens do menu de cima e dos Ajustes
  telas/                ← Ajustes (Tarefas/Relatórios/Opções), Editar Tarefa, Gerenciar Abas/Loja/Metas,
                          Loja de estrelas, Metas, Conquistas, Relatório completo
  logica/               ← regras puras (testadas): rotina, estrelas/metas/conquistas, relatório, ações
  padroes.ts            ← abas, tarefas, horários e loja iguais ao Rotina Amiga original (pt/en/es)
  textos.ts + textos-rotina.json ← textos do Rotina original + novos (pt/en/es)
  paleta.ts             ← cores das abas do Rotina original
teste/logica.test.ts    ← 20 grupos de testes das regras:  npx tsx teste/logica.test.ts
```

## Testes feitos antes da entrega

- `tsc --strict` sem erros.
- 20 grupos de testes das regras: temporizador, trava de horário, liberação pelo adulto, bônus de rotina, anti-spam da fala,
  metas, loja com espera, relatório dia/semana/mês/ano, conquistas, dados corrompidos.
- 14 fluxos clicados no navegador:
  - criança começa e termina uma tarefa;
  - temporizador sem botão;
  - adulto libera com a conta;
  - FALAR dá estrela;
  - compra na loja, com e sem espera;
  - pais criam e editam tarefa, criam aba e dão estrela;
  - metas;
  - períodos do relatório;
  - abrir pelos Ajustes do Voz.
- 25 telas capturadas na mesma proporção das capturas originais (pasta `telas-teste/`).

## Regra das áreas de adulto

Toda área de adulto pede **segurar 3 segundos (padrão) + uma conta de MAIS bem simples, com resultado até 15** (ex.: 8 + 5), sempre.

O tempo de segurar fica em `useRotina().msAdulto`. O pai pode aumentar para 5, 7 ou 10 s:

- nas Definições do Voz, coloque o cartão **Tempo para Segurar**, com botões 3 / 5 / 7 / 10 s que chamam `useRotina().mudarMsAdulto(seg)`. O modelo está no app de teste, em `demo/voz/telas.tsx` → `df_segurar`;
- também dá para mudar em Rotina Amiga → Opções.

Onde vale:

- **AJUSTES:** quem já protege é o próprio Voz. Use o mesmo padrão: `<Segurar ms={msAdulto} aoCompletar={() => pedirAdulto(abrirAjustes)} />`.
- **TRAVAR APP:** igual.
- **Nome da rotina no cartão da tela inicial:** segurar abre os ajustes do Rotina.
- **Segurar o cartão da etapa:** libera a tarefa, ou seja, conclui, pula ou cancela.

`useRotina().pedirAdulto(fn, titulo)` mostra a conta e só chama `fn` quando a resposta está certa.

PRÊMIOS (área da criança) abre com 1 toque, sem conta. O anúncio abre só segurando 5 s.

## Tela inicial: onde fica cada botão

- **Em cima, os botões dos pais e as funções**, todos do mesmo tamanho:

  | | TRAVAR APP | AJUSTES | PRÊMIOS | FRASES | TECLADO |
  |---|---|---|---|---|---|
  | Como abre | segura 3 s + conta | segura 3 s + conta | toque | toque | toque |

- **Embaixo, logo acima da área da rotina e do anúncio:** o menu das abas (Favoritos, Pessoas, Expressão social, Descrição, Ações…), para a criança mexer.
  - Os quadradinhos têm o mesmo tamanho dos de cima.
  - Com mais de 5 abas, o menu rola para o lado.

Modelo pronto em `teste-app/demo/voz/home.tsx`: a largura é `(largura do menu − 4 × 7) / 5`, igual para todos.

## Teclado do aplicativo (colorido, sem o teclado do celular)

`<TecladoAmigo>` substitui o teclado do sistema, que nunca abre. Tem teclas grandes, uma cor por linha e as vogais em rosa.

- **Modo normal:** letras maiúsculas, espaço, apagar e FALAR.
- **Modo avançado** (Definições → Teclado avançado): acrescenta números, acentos, Ç/Ñ, pontuação e minúsculas.
- **Sugestões:** completam a palavra que está sendo escrita, inclusive sem acento ("ag" → ÁGUA).

```tsx
import { TecladoAmigo } from './src/rotina-amiga';
<TecladoAmigo visivel={teclado} fechar={() => setTeclado(false)}
  avancado={defs.tecladoAvancado} sugestoes={defs.sugestoes} vocab={pranchas.map((p) => p.texto)}
  aoFalar={(texto, palavras) => { falarVoz(texto); registrarFala(palavras); }} />
```

## Sugestões inteligentes de frases

O motor fica em `logica/sugestoes.ts`.

- **Como funciona:** roda no celular, sem internet e sem custo. Aprende com as frases que a criança fala no botão FALAR. Usa também um modelo de pedidos comuns em CAA (pt / en / es), as pranchas que existem e a hora do dia ("Bom dia", "Boa noite").
- **Como usar:** `useRotina().sugerirFrase(frase, vocab)` devolve `{ palavras, frases }`:
  - `palavras`: próximas palavras;
  - `frases`: frases completas, ex.: EU → "EU QUERO ÁGUA".
- **Visual:** `<BarraSugestoes>` mostra:
  - as palavras em **azul forte**;
  - as ideias de frases em **roxo**, que falam com um toque.

  Substitui as sugestões amarelas e apagadas.

```tsx
const { sugerirFrase } = useRotina();
const sug = sugerirFrase(frase, pranchas.map((p) => p.texto));
<BarraSugestoes palavras={sug.palavras} frases={sug.frases}
  aoPalavra={(w) => setFrase((f) => [...f, w])} aoFrase={(f) => falarFrase(f)} rotuloFrases="IDEIAS DE FRASES — TOQUE PARA FALAR" />
```

## Tour do aplicativo (passo a passo para os pais)

O módulo traz uma **tela guiada que passa por cada botão do aplicativo**. Para cada um:

- escurece a tela e põe uma **moldura amarela** no botão;
- **fala em voz alta** "este botão serve para…" (pode silenciar no 🔊);
- mostra uma **mini demonstração animada** (tipo GIF) do que acontece ao usar o botão;
- diz como ativar (tocar, segurar 5 s, ou segurar 3 s + continha).

Detalhes:

- **Sempre nas 3 línguas** (português, inglês, espanhol). Segue o `idioma` passado ao Provider.
- **Quando abre:** sozinho na primeira vez. Depois, pelo quadro **AJUDA E TOUR** nos Ajustes (botão "Começar o tour" no topo), que vem em `useItensAjustesRotina()`.
- **Botões do tour:** Próximo, Voltar, Pular parte e Sair.
- **O que cobre:** cerca de 52 passos em 8 partes. O tour abre cada tela sozinho e rola até o botão.
  1. Tela inicial
  2. Ajustes e Opções
  3. Criar prancha
  4. Definições
  5. Rotina Amiga (tarefas, nova tarefa, opções)
  6. Prêmios
  7. Relatório geral
  8. Fim
- **Textos e demonstrações:**
  - os textos ficam em `rotina-amiga/tourPassos.ts` (`PASSOS_TOUR`, nas 3 línguas) e podem ser editados;
  - as animações ficam em `rotina-amiga/tourDemo.tsx`.

### O que o desenvolvedor faz

1. Passa `tourIrPara` ao Provider, para o tour poder abrir as telas do Voz. As telas do Rotina o módulo abre sozinho.

```tsx
<RotinaAmigaProvider tourIrPara={(tela) => {
  // tela: 'home' | 'ajustesVoz' | 'criarPrancha' | 'definicoes'
  if (tela === 'home') navigation.navigate('Home');
  else if (tela === 'ajustesVoz') navigation.navigate('Ajustes');
  else if (tela === 'criarPrancha') navigation.navigate('CriarPrancha');
  else navigation.navigate('Definicoes');
}}>
```

2. Nas telas Ajustes, Criar Prancha e Definições, troca o `<ScrollView>` por `<RolagemTour>`, que vem do módulo e tem as mesmas props. Assim o tour consegue rolar até o botão.

3. Envolve os botões ORIGINAIS do Voz com `<AlvoTour id="...">`. Não muda o visual, só marca o botão:

| id | botão do Voz |
|---|---|
| `pranchas` | a primeira prancha da grade |
| `abas` | a primeira aba (menu de cima, a partir da 2ª linha) |
| `frases` | a barra da frase (sempre na tela) |
| `teclado` | TECLADO |
| `premios` | PRÊMIOS (novo) |
| `travar` | TRAVAR APP |
| `ajustes` | AJUSTES (engrenagem) |
| `adicionar` | ADICIONAR PRANCHA |
| `anuncio` | o anúncio da tela inicial (já marcado dentro do `AnuncioProtegido`) |
| `comoEstou` | "Como estou?" (já marcado dentro do `BotaoComoEstou`) |
| `aj_criar` | CRIAR PRANCHA |
| `aj_editar` | EDITAR PRANCHAS |
| `aj_excluir` | EXCLUIR PRANCHAS |
| `aj_gerir` | GERIR ABAS |
| `aj_editarAbas` | EDITAR ABAS / SAIR DE EDITAR ABAS |
| `aj_pacotes` | BAIXAR PACOTES |
| `aj_assinatura` | MINHA ASSINATURA |
| `aj_sobre` | SOBRE A CAA |
| `aj_rotina` | ROTINA AMIGA (novo) |
| `aj_relatorio` | RELATÓRIO GERAL (novo) |
| `aj_frases` | FRASES PRONTAS (novo) |
| `aj_ajuda` | AJUDA E TOUR (novo) |
| `aj_definicoes` | DEFINIÇÕES |
| `cp_texto` | Criar prancha → campo do texto |
| `cp_camera` / `cp_galeria` / `cp_banco` / `cp_picto` | Criar prancha → Câmera / Galeria / Banco / Picto |
| `cp_aba` | Criar prancha → Aba de destino |
| `cp_audio` | Criar prancha → caixa "Áudio (Opcional)" |
| `cp_salvar` | Criar prancha → Salvar Prancha |
| `df_idioma` | Definições → Idioma da Aplicação |
| `df_tamanho` | Definições → Tamanho dos Botões |
| `df_sugestoes` | Definições → Sugestões Inteligentes |
| `df_teclado` | Definições → Teclado Avançado |
| `df_bloquear` | Definições → Bloquear App |
| `df_segurar` | Definições → Tempo para Segurar (novo) |
| `df_voz` | Definições → Voz Nativa |
| `df_volume` | Definições → Volume da Voz |

O cartão da rotina (`rotina`) e as telas do Rotina já vêm marcados. Se algum id não estiver na tela, aquele passo aparece no meio da tela, sem destaque, e o tour continua normalmente.

Veja `EXEMPLO-encaixe-no-Voz.tsx`: lá estão os mesmos encaixes num exemplo completo.


---

## Novidades da versão 7

### Plano gratuito x Plano Completo

O módulo recebe do app **quem é assinante** e aplica os limites sozinho:

| Prop do `RotinaAmigaProvider` | O que passar |
|---|---|
| `assinante` | o mesmo valor que o Voz usa hoje (`users/{uid}.hasAccess` no Firestore, atualizado pela função `syncUserAccess`) |
| `abrirPlanos` | abre a tela de planos que já existe |
| `limitesFirebase` | opcional: `lerLimitesFirebase(valor de limitações/rotina)` — ver `integracao-firebase/` |

Padrão do gratuito (`LIMITES_GRATIS`): 1 rotina, 3 tarefas por rotina, 6 prêmios, sem temporizador/horário/alarme, sem metas e conquistas,
relatório de 7 dias, com anúncio. Assinante (`LIMITES_COMPLETO`): sem limites e **sem anúncio**.

Quando o adulto passa do limite, aparece o aviso **"Recurso do Plano Completo"** com **Ver planos** (chama `abrirPlanos`).
Na área da criança (PRÊMIOS → Metas/Conquistas) só aparece um cadeado, **sem** botão de compra.
Tarefas e prêmios que já existem continuam funcionando se a assinatura acabar; só não dá para criar mais.

### Anúncio protegido (segurar 5 s)

`<AnuncioProtegido anuncio={{ imagem, link, openplan }} />` usa o mesmo nó `anuncio/N` do Realtime Database.
Abre só segurando **5 segundos** (barrinha enchendo). `openplan: true` abre os planos em vez do link. Sem dados, mostra um anúncio de exemplo.
O `ProximoPasso` esconde o anúncio de assinantes.

### "Como estou?"

`<BotaoComoEstou largura altura raio />` no menu de cima, ao lado das abas. A criança escolhe o rostinho (feliz, calmo, cansado, triste, bravo, com medo, com dor),
a voz fala "Estou feliz", e vai para o relatório. Os pais podem desligar em Rotina → Opções.

### Registrar momento (crises) — só pais

Botão **Registrar momento (crise)** no topo do **Relatório geral**: quando, intensidade 1–5, duração, o que pode ter causado, o que ajudou e anotação.
Tem histórico (apagar segurando).

### Relatório para profissionais

Em **RELATÓRIO GERAL**: períodos de 7 dias a 12 meses e áreas **Geral, Fonoaudiologia, Terapia ocupacional, Psicologia/ABA, Escola**.

- **Resumo** e **Pontos de atenção** gerados automaticamente (ex.: "frases maiores", "crises subiram", "mais frases começadas e não faladas").
- **Comunicação:** palavras, frases, tamanho médio da frase, palavras diferentes/novas, frases sem sugestão (independência),
  frases começadas e não faladas, tempo para montar a frase, horários, palavras mais usadas.
- **Para que se comunica:** pedir, recusar, sentimentos, social, pedir ajuda/dor.
- **Teclado:** letras, palavras escritas, correções.
- **Rotina e autonomia:** feito sozinho x com adulto, % do previsto, canceladas, pontualidade, dias seguidos, tarefas mais difíceis.
- **Recompensas, crises** (intensidade, causas, o que ajudou, quando, dia da semana, crises com/sem rotina completa),
  **sinais de alerta automáticos** (rajadas de toques, pedidos de ajuda/dor, frases abandonadas em seguida, tentativas de sair do app travado — não é diagnóstico),
  **sentimentos**, **tempo de uso** e **mês a mês**.
- **Tendência e projeção** em cada parte ("subindo +25% · se continuar assim, no próximo período ~N").
- **Anotações dos pais**, **WhatsApp** e **PDF** (`imprimirHtml` com expo-print; sem ele, compartilha o texto).

Para alimentar o relatório, o app chama (além de `registrarFala`/`registrarPrancha`):

```tsx
registrarPrancha(texto, nomeDaAba);                       // a aba ajuda a classificar (Expressão social…)
registrarFala(palavras, { ms: tempoMontando, sug: palavrasDasSugestoes });
registrarFraseIncompleta(palavras);                       // saiu do modo frase / limpou sem falar
registrarSinal('tentou_sair');                            // opcional: tentou sair com o app travado
```

### Tarefa abre a aba do Voz

Com `abasVoz` e `abrirAbaVoz`, a tela da tarefa ganha **"Pranchas do Voz para esta tarefa"**. Quando a criança toca COMEÇAR, o Voz abre aquela aba.

### Ajuda, notificações e conferência

- **AJUDA** (quadro novo): cada parte do app explicada, com busca e as demonstrações do tour. Dá para acrescentar tópicos com `adicionarTopicoAjuda()`.
- **Notificações** (sino nos ajustes do Rotina): estrelas, prêmios, tarefas, crises, sentimentos.
- **Conferência do desenvolvedor:** AJUDA → segurar 5 s no rodapé. Mostra o que o app ligou ao módulo e os limites em uso.

### Opções novas do Rotina

Personagem da espera (menino/menina), botão "Como estou?" liga/desliga, nome da criança (aparece no relatório).
