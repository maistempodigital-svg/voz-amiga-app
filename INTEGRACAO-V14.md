# Voz Amiga v14: guia para o desenvolvedor

Tudo o que é novo fica em `rotina-amiga/v14/` e entra pelo mesmo `<RotinaAmigaProvider>`. **A tela da criança não muda**:

- as novidades ficam atrás da trava (segurar + continha);
- cada uma liga e desliga em **Ajustes › Mais funções**.

Nada depende de internet nem de Firebase.

## 1. Passar duas coisas novas ao Provider

```tsx
<RotinaAmigaProvider
  /* …o que já existe… */
  hostV14={hostV14}                 // backup, vozes e "criar várias pranchas" (veja abaixo)
  recursosFirebase={recursosRTDB}   // opcional: conteúdo de RTDB `limitações/recursos` (sem isso, tudo liberado)
>
```

### `hostV14`

Todos os campos são opcionais. O tipo `HostV14` está em `v14/estadoV14.ts`.

| Campo | Para quê | No app oficial (Expo) |
|---|---|---|
| `lerDadosVoz()` | Pranchas, abas e definições que entram no backup | Devolver o estado das pranchas (o mesmo que o app grava hoje) |
| `versaoVoz` | Número que muda quando as pranchas mudam (dispara o backup automático) | Um contador ou o `updatedAt` |
| `restaurarDadosVoz(d)` | Restaurar as pranchas de um backup. **Confira tudo** antes de gravar: veja `sanearVoz` em `teste-app/demo/voz/base.tsx` | Mesmo formato do estado do Voz |
| `compartilharArquivo(nome, texto)` | "Enviar cópia" (Drive, WhatsApp, e-mail) | `expo-file-system` (gravar em `cacheDirectory/nome`) + `expo-sharing` (`shareAsync`) |
| `escolherArquivo()` | "Restaurar de um arquivo" | `expo-document-picker` (`type: 'application/json'`) + `FileSystem.readAsStringAsync` |
| `listarVozes`, `vozAtual`, `mudarVoz`, `volume`, `mudarVolume`, `abrirConfigVoz` | Tela Vozes | O que já existe nas Definições do Voz |
| `falarCom(texto, {velocidade, tom, locale})` | Voz por idade e velocidade | `Speech.speak(texto, { language: locale, rate: velocidade, pitch: tom })` |
| `adicionarPranchas(aba, itens, tema)` | IA "prancha por tema" | Criar a aba (se não existir) e as pranchas |
| `noWifi()` | Baixar a IA só no Wi-Fi | `@react-native-community/netinfo` (`type === 'wifi'`) |

Exemplo completo, que já funciona no app de teste: `teste-app/App.tsx` (procure `hostV14`).

## 2. Botões e alvos novos (para o curso e o tour)

- **Ajustes e Opções:** `useItensAjustesRotina()` já traz os quadros **MAIS FUNÇÕES** e **CURSO PARA PAIS**. Envolva-os com `<AlvoTour id="aj_maisfuncoes">` e `<AlvoTour id="aj_curso">`.
- **CONQUISTAS E PRÊMIOS (v14.2):** quadro amarelo em destaque no topo dos Ajustes (`useItensAjustesRotina()` já traz, id `conquistasPremios`). Envolva com `<AlvoTour id="aj_conquistas">`. Abre `{ nome: 'v14', tela: 'conquistas' }`: prêmios, metas, conquistas do mês (o app escolhe e renova todo mês, `v14/conquistasMes.ts`) e conquistas criadas pelos pais (`v14.conquistasPais`).
- **Saíram na v14.2:** "Criar com foto", o quadro "Frases prontas" dos Ajustes (as sugestões continuam na tela), Piper/eSpeak, voz do mascote e o cartão de voz repetido (a voz fica só em Definições › "Escolher e testar a voz").
- **Ajuda:** a busca entende a dúvida (sem acento, palavra por palavra) e cada resposta tem **"Me leve até lá"**. Há também tour por parte (o pai escolhe).
- **Excluir pranchas:** mostre o quadro **só** quando `recurso('apagarPranchas')` for `true` (vem desligado). Peça sempre confirmação.

## 3. Tela inicial: o que muda (pouco, e só se os pais ligarem)

Use `useRotina()`:

| Função | O que fazer na tela inicial do Voz |
|---|---|
| Abas | Uma única fileira com `ScrollView horizontal` (nunca quebrar linha) |
| `recurso('emergencia')` | Botão 🆘 pequeno na barra da frase. Com mais de uma frase ligada (`v14.emergencia`), mostra uma linha na própria tela, sem pop-up. Chame `registrarV14('emergencia', 'dor' \| 'ajuda' \| 'banheiro')` |
| `recurso('modoExemplo')` | Botão 👆 na barra. Ligado: o toque chama `registrarModelo(texto)` em vez de `registrarPrancha`, destaca a prancha e fala. Desliga sozinho em 2 min |
| `recurso('niveis')` + `v14.nivel` | `somarPalavra(frase, palavra, nivel)` de `v14/crescer.ts`. Nível 1: sem mensagem inteligente |
| `recurso('gradeCrescente')` + `v14.gradeBotoes` | `pranchasVisiveis(todas, limite)` na ordem de criação (as antigas não mudam de lugar) |
| `recurso('telaCalma')`, `botoesGrandes`, `tempoToque` (`v14.toqueMs`), `estilosBotao` (`v14.estilo`), `fundoAnimado`, `modoTablet` (`v14.modoTela`), `visualIdade` (`VISUAIS[v14.visual]`) | Só aparência e tamanho. As cores das 4 categorias não mudam |
| `recurso('rotinaPranchas')` | Com tarefa ativa sem aba ligada, `pacoteDaTarefa(titulo)` escolhe a aba |
| `recurso('vozGravada')` | Se a gravação falhar, use a voz do celular e avise discretamente |

| **Regra da fala (v14.2)** | Tocar numa prancha **só põe a palavra na barra**. O celular fala apenas no botão **FALAR** (mesmo com uma palavra só). As sugestões ficam numa linha que desliza para o lado |
| Aviso "segure 3 segundos" | Nas 2 primeiras vezes que tocarem rápido em TRAVAR APP, AJUSTES ou CRIAR PRANCHA, mostre um aviso amarelo (conta em `dicas.toques`) |
| "Comece por aqui" | Selo laranja no CRIAR PRANCHA até a primeira prancha ser criada (`dicas.criou`) |

Referência pronta: `teste-app/demo/voz/home.tsx`.

## 4. Firebase: deixar preparado (o Adriano liga quando quiser)

O nó sugerido no Realtime Database é **`limitações/recursos`**. O modelo está em `integracao-firebase/recursos-v14.json`, com uma linha por função:

```json
{ "recursos": { "ia": { "liberado": true, "plano": "completo" }, "curso": { "liberado": false } } }
```

| Campo | Significado |
|---|---|
| `liberado: false` | A função some para todos ("Indisponível no momento") |
| `plano: "completo"` | Só assinantes (`assinante === true`, o mesmo `hasAccess` de hoje) |
| `plano: "gratis"` (ou sem nada) | Todo mundo |

- **Regra final:** dono libera **E** (grátis **OU** assinante) **E** os pais ligaram.
- **Leitura segura:** `lerRecursosFirebase()` ignora valores estranhos. O texto `"false"` não bloqueia nada, e o texto `"true"` não vira assinante.
- **Regra do RTDB sugerida:** `".write": false` em `limitações` (só pelo console/Admin SDK) e `".read": "auth != null"`.

## 5. O que ficou preparado, mas precisa de código nativo (não deu para compilar aqui)

| Item | Estado | Próximo passo |
|---|---|---|
| IA Gemma 3 270M | Tela, tamanhos, "só no Wi-Fi", apagar e sugestões por regras já funcionam | Módulo nativo `LiteRT-LM`. Baixar o modelo de um endereço **fixo no app** (nunca vindo de fora), conferir SHA-256 e trocar `completarFraseIA` / `pranchaPorTemaIA` pela IA, mantendo a aprovação dos pais |
| Velocidade e tom no APK de teste | A casca de teste não tem `rate`/`pitch` | No app oficial, `expo-speech` já aceita |

## 6. Testes

| Teste | Comando | Resultado |
|---|---|---|
| Lógica v14 (13 grupos) | `npx tsx teste/v14.test.ts` | ok |
| Lógica geral (34 grupos) | `npx tsx teste/logica.test.ts` | ok |
| Dados corrompidos | `N=1500 npx tsx teste/fuzz.test.ts` (troque `SEED` para variar) | 0 erros |
| Cliques v14 (celular, celular barato 360×640, tablet, 3 idiomas, sem internet) | `python3 teste-app/fluxos_v14.py` | ok |

## 7. Relatório e pictogramas (v14.2)

- **Relatório:** um só relatório geral, sem nome de profissional. A seção **"O que o app percebeu"** (`v14/percebeu.ts`) aponta, por regras simples e sem internet, horário e dia de mais uso, palavra mais usada, tendência, frases deixadas pela metade, dias de rotina e horário dos momentos difíceis.
- **Pictogramas ARASAAC:** a busca mostra que os desenhos vêm de um banco gratuito que não é do Voz Amiga, com o crédito (autor Sergio Palao, origem ARASAAC, licença CC BY-NC-SA, Governo de Aragão). **Atenção:** a licença é "não comercial". Como o app tem plano pago, o Adriano precisa pedir autorização à ARASAAC antes de publicar (ou manter a busca como ferramenta externa gratuita).


## 8. v14.3: o que mudou para o desenvolvedor

**Telas sem repetição**
- Saíram dos Ajustes: **CRIAR PRANCHA** (fica só no topo da tela inicial), **EDITAR ABAS** (o GERIR ABAS já edita) e **MAIS FUNÇÕES**.
- As funções foram para dentro das **Definições**: coloque `<FuncoesDoApp />` no fim da tela de Definições.
- Volume e "Testar voz" ficam só na tela de vozes (`{ nome: 'v14', tela: 'vozes' }`).

**Definições**
- No topo, `<DestaqueCriarFalando />`, o recurso especial que abre `{ nome: 'v14', tela: 'assistente' }`.
- Um cartão "IA (opcional)" que abre `{ nome: 'v14', tela: 'ia' }`.
- Alvos do tour: `df_criarfalando`, `df_ia`, `df_funcoes`.

**Aviso de segurar:** caixinha azul pequena, lá em cima, sem empurrar a tela: "✋ Segure 3 s para abrir". Aparece só nas 2 primeiras vezes.

**Pacotes**
- A grade fica em cima, e o painel do pacote escolhido fica **fixo embaixo**.
- Ao transferir, o app busca o desenho de cada palavra no ARASAAC (`api.arasaac.org` → `static.arasaac.org`) e tenta guardar a imagem como `data:` para funcionar sem internet. Sem internet, ficam os emojis.
- Use `CreditoArasaac` (texto oficial do site + explicação) no criar prancha, nos pacotes e no Sobre.

**Começar com poucos botões:** `INICIO_BOTOES = 9`, com o texto `DICA_ESPECIALISTAS` e as fontes `FONTE_ESPECIALISTAS` (AssistiveWare, Little Words, ASHA). O padrão da grade que cresce passou de 6 para 9.

**Criar prancha falando** (`v14/assistente.ts` e `v14/telasIA.tsx`)
- A conversa tem 4 perguntas: nome, rotinas, gostos e o que a criança já fala. O pai também pode pedir direto ("cria os botões: …").
- O app sugere uma 1ª aba com 9 palavras e uma aba pequena por rotina. Os pais desmarcam o que não querem e tocam em CRIAR.
- As rotinas citadas também viram tarefas da Rotina, se ainda não existirem.
- Tudo funciona sem internet, por regras. A IA, quando existe, só devolve **palavras**, e o app confere tudo.

**IA de verdade** (`HostV14.ia` e `HostV14.segredo`, em `v14/iaEstado.ts`)

| Função | O que fazer no app oficial (React Native) |
|---|---|
| `ia.pronto(id)` / `ia.baixar(id, aoProgresso)` / `ia.apagar(id)` | Baixar de endereço **fixo** (Hugging Face), guardar no aparelho e avisar o progresso `{ feito, total }` em bytes |
| `ia.ouvirComecar()` / `ia.ouvirParar(idioma)` | Gravar o microfone e transcrever com Whisper. Sugestão: `whisper.rn` com `ggml-base` (offline) |
| `ia.gerar(msgs)` | IA no celular. Sugestão: LiteRT-LM ou `llama.rn` com Gemma 3 270M |
| `segredo.ler/gravar(k)` | `expo-secure-store` (a chave do ChatGPT **nunca** entra no estado nem no backup) |

O app de teste já faz tudo isso na WebView, com `@huggingface/transformers` 3.8.1. Ele está em `app-de-teste/ia-src/` (rode `build.sh`) e gera `public/ia/`, com o motor WebAssembly dentro do app.

Modelos usados:
- `onnx-community/whisper-base` (q8, cerca de 77 MB);
- `onnx-community/gemma-3-270m-it-ONNX` (q4, cerca de 323 MB).

**ChatGPT dos pais:** chamada direta a `api.openai.com/v1/chat/completions` com a chave dos pais (modelo padrão `gpt-4o-mini`).
- A chave fica guardada só no aparelho e aparece mascarada.
- O texto do pai vai entre aspas, com a ordem de ignorar instruções.
- A resposta só vira palavras curtas, e os pais aprovam antes de criar.
