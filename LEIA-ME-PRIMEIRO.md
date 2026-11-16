# Voz Amiga + Rotina Amiga: pacote para o desenvolvedor (v14)

> **Novo na v14 (leia `INTEGRACAO-V14.md`):** a tela da criança não muda. Tudo o que é novo liga e desliga em **Ajustes › Mais funções**, protegido pela trava. Nada usa internet.
> - **Proteger:**
>   - cópia de segurança automática no celular (últimas N);
>   - enviar e restaurar o arquivo pelo Drive, WhatsApp ou e-mail, inclusive num celular novo;
>   - apagar pranchas vem desligado e pede confirmação;
>   - senha dos pais depois da continha;
>   - botão de emergência 🆘 na barra da frase.
> - **Vozes:** voz do celular com passo a passo para baixar o pacote; voz gravada dos pais; Piper e eSpeak preparados (falta a parte nativa); voz do mascote; velocidade, volume e voz por idade; reserva automática.
> - **Curso para os pais:** o mascote (balão da logo) voa até cada parte e explica falando, em 7 lições que podem ser repetidas. O tour leva ao curso.
> - **Para os pais:** missão do dia, lembrete, **modo exemplo** (👆), mensagens de apoio e dúvidas comuns, sempre com as fontes.
> - **Menos trabalho:**
>   - pacotes por rotina: café, banho, escola, parque, médico e dormir;
>   - abas e pacotes numa **fileira que desliza para o lado**;
>   - criar com foto;
>   - a rotina abre as pranchas certas.
> - **Crescer:** níveis (1 palavra, 2 palavras, frases), manual ou automático; grade que cresce sem mudar as antigas de lugar; visual criança, adolescente ou adulto.
> - **Relatório:** nova seção **Evolução**.
> - **IA (opcional):** só sugere e os pais aprovam. Gemma 3 270M preparada (falta a parte nativa).
> - **Conforto:** tela calma, botões grandes, tempo de toque, estilos, fundo animado (desligado) e celular ou tablet.
> - **Preço:** cada função tem uma "chave" que o Firebase pode liberar ou bloquear por plano (`limitações/recursos`, modelo em `integracao-firebase/recursos-v14.json`). Hoje está tudo liberado.


> **Novo na v13:**
> - **Menu:** linha 1 com TRAVAR APP · AJUSTES · PRÊMIOS · TECLADO · **CRIAR PRANCHA** (atalho dos pais: segurar 3 s + continha). Linha 2 com as abas **GERAL** · Pessoas · Expressão social · Descrição · Ações. **Saíram** a aba Favoritos e o botão "Como estou?".
> - **Aba GERAL:** o app abre nela, com todas as pranchas numa tela só. Cada prancha tem a cor da sua categoria, nas 4 cores da comunicação:
>   - pessoas: amarelo;
>   - expressão social: rosa;
>   - descrição: azul;
>   - ações: verde.
>
>   A categoria é **automática** pelo texto (`categoriaDaPalavra`) ou escolhida pelos pais.
> - **Sem pop-ups:** a comemoração na tela foi desligada. O ganho aparece pequenininho no botão PRÊMIOS ("+2★"), e as metas diárias vêm desligadas (só as semanais ficam ligadas).
> - **Liberação dos prêmios** (Ajustes da Rotina): na hora · **esperar N min para liberar** · **intervalo de N min entre prêmios**. Vai para o relatório: esperas, esperou até o fim, desistiu e tempo médio.
> - **Relatório:**
>   - períodos: Hoje, 7, 15 e 30 dias, 2, 3, 6 e 12 meses, e **Escolher datas** (início e fim livres, até 2 anos);
>   - a seção **Prêmios, metas e conquistas** mostra as metas cumpridas e as conquistas.
> - **Teclado em tela cheia**, com o **X vermelho** destacado. As sugestões ficam numa **linha só**, maiores.
> - **Sem zoom** e **o X volta para a tela anterior** em todas as telas.

> **Segurança (15/11):** leia `SEGURANCA-DESENVOLVEDOR.md`. Há 1 item ALTO no app principal (tela de recorte de imagem aberta para outros apps), e as regras de gravação do Firebase e o App Check precisam ser conferidos.

> **Novo na v10:** frases prontas **compactas** (bem menores) · o app começa **sem pranchas**, só com **ADICIONAR PRANCHA**, que **some depois da primeira** (depois: Ajustes › Criar prancha) · **4 pranchas lado a lado** por padrão (os pais mudam em Definições) · cartão da rotina mais baixo e **anúncio sem corte** · **mensagem inteligente**: a 1ª palavra ("água") já vira frase ("EU QUERO ÁGUA"), as palavras montadas aparecem tracejadas, tocar numa palavra tira ela, e **só fala no FALAR** (também no TECLADO).

> **Novo na v9:** saiu o botão FRASES. A **barra da frase fica sempre na tela**: tocar numa prancha fala a palavra na hora e coloca na frase; **FALAR** diz a frase inteira. Embaixo da barra há **um bloco só de sugestões**, com botões fixos na tela (sem rolar, sem janela): frases prontas quando a frase está vazia; próximas palavras e frases quando a criança começa. "Como estou?" foi para a 1ª linha do menu, e as abas quebram linha em vez de rolar.

> **Novo na v8:** abas e "Como estou?" no **menu de cima** (embaixo só a rotina/anúncio) · **frases prontas** coloridas pelas cores da comunicação · opção **modo frase sempre ligado** · PRÊMIOS abre com **1 toque** · continha do adulto **até 15** · **Ajuda e tour** num lugar só · **Registrar momento** dentro do Relatório geral · **modo foco removido** · o botão voltar das telas de ajustes volta para a **tela anterior**.

## O que é

É a atualização do **Voz Amiga original**, o mesmo projeto que já está na Play Store (com.vozamiga). Ela coloca o Rotina Amiga dentro dele.

**Não substitui o projeto.** O código vem como uma pasta para **copiar dentro do projeto do Voz**, e o app só **liga 3 pontos** no que já existe.

**Não mexe** no Firebase, no login, no Google Play Billing nem nas telas atuais do Voz. O pagamento continua pela Google Play, exatamente como hoje.

## Comece por aqui

1. `node instalar-rotina.mjs <pasta-do-projeto-voz>` — copia o módulo, confere as dependências e mostra onde colar.
2. **`PASSO-A-PASSO-RAPIDO.md`** — as 3 ligações (conta/plano, anúncio, fala) e o resto em ordem. Leva de 1 a 2 horas.
3. No app: **Ajustes → AJUDA E TOUR → segure 5 s no rodapé** → "Conferência do desenvolvedor" mostra se tudo ficou ligado.
4. Gere a versão com a **chave de upload de sempre** e envie primeiro para o **teste interno**.

## Conteúdo

| Pasta/arquivo | O que é |
|---|---|
| `rotina-amiga/` | **O código para copiar** em `src/rotina-amiga/`. Não precisa de pacote nativo novo: usa só o que o Voz já tem (AsyncStorage, expo-speech, expo-image-picker, @expo/vector-icons, safe-area-context). |
| `instalar-rotina.mjs` | Instalador: copia, confere dependências, aponta os lugares no código. |
| `PASSO-A-PASSO-RAPIDO.md` | O encaixe em ordem, curto. |
| `integracao-firebase/` | `limitacoes-rotina.json` (limites da versão gratuita, para acrescentar no Realtime Database em `limitações`) e `ligacao-voz.example.tsx` (como passar `hasAccess`, os limites e o anúncio). |
| `INTEGRACAO.md` | Referência completa de cada componente e regra. |
| `EXEMPLO-encaixe-no-Voz.tsx` | Exemplo dos encaixes em código. |
| `teste/logica.test.ts` | 30 grupos de testes das regras: `npx tsx teste/logica.test.ts`. |
| `app-de-teste/` | O app usado para testar tudo no navegador e gerar o APK de teste. As telas do Voz que estão nele são **simulações**. |
| `apk-de-teste/` | O APK de teste (pacote `com.vozamiga.rotinateste`), só para aprovação do cliente. |
| `telas-testadas/` | Capturas das telas testadas. |

## Gratuito x Plano Completo (já programado no módulo)

| | Gratuito | Plano Completo (Mensal, Semestral, Anual, Vitalício) |
|---|---|---|
| Anúncio embaixo (abre só segurando 5 s) | sim | **não** |
| Rotinas | 1 | ilimitadas |
| Tarefas por rotina | 3 | ilimitadas |
| Prêmios na loja | 6 | ilimitados |
| Temporizador, horário fixo, alarme | — | sim |
| Metas e conquistas | — | sim |
| Relatório | resumo de 7 dias | completo: todos os períodos, por profissional, tendência, crises, PDF |
| Frases prontas | 2 por grupo (liga/desliga, ocultar) | todas + criar e editar as suas |
| "Como estou?", registro de crises, tour, ajuda, barra da frase e sugestões | sim | sim |

Os números do gratuito podem ser mudados pelo Firebase (`limitações/rotina`) sem atualizar o app.

## Lista de verificação (antes de publicar)

**Tela inicial**
- [ ] Em cima, linha 1: TRAVAR APP, AJUSTES, PRÊMIOS, TECLADO e "Como estou?". Linha 2 em diante: as abas (Favoritos, Pessoas, Expressão social…), todas à vista. Todos do mesmo tamanho. **Embaixo não tem menu.**
- [ ] Embaixo aparece só a próxima etapa de uma rotina. Sem etapa: anúncio (gratuito) ou nada (assinante).
- [ ] O anúncio só abre segurando 5 s, com a barrinha enchendo.
- [ ] TECLADO abre o teclado colorido do app.
- [ ] Barra da frase sempre na tela. Prancha: fala na hora e entra na frase. FALAR: diz a frase inteira.
- [ ] Um bloco só de sugestões (botões fixos): frases prontas coloridas; tocar numa monta a frase e fala.
- [ ] Ajustes → FRASES PRONTAS: liga/desliga, ocultar; criar/editar só no Plano Completo.
- [ ] PRÊMIOS abre com um toque.

**Áreas de adulto** (segurar 3 s, ajustável, + conta de mais até 15): AJUSTES, TRAVAR APP, ADICIONAR PRANCHA, nome da rotina no cartão, liberar tarefa.

**Plano**
- [ ] Assinante (hasAccess) não vê anúncio e não tem limites.
- [ ] Gratuito: ao passar do limite aparece "Recurso do Plano Completo" → "Ver planos" abre a tela de planos do Voz.
- [ ] A compra continua pela tela de planos e pelo Google Play de sempre.

**Rotina**
- [ ] Começa sem rotina; "Criar rotina" com modelos (Manhã, Tarde, Noite, Escola, Banheiro) ou nome próprio.
- [ ] Tarefa pode abrir uma aba de pranchas do Voz ao começar.

**Relatório e registros**
- [ ] RELATÓRIO GERAL: Geral, Fono, TO, Psicologia/ABA, Escola; resumo, pontos de atenção, tendência e projeção.
- [ ] WhatsApp e PDF funcionam.
- [ ] Relatório geral → **Registrar momento (crise)** (no topo) salva crises (intensidade, duração, causas, o que ajudou).
- [ ] Frases começadas e não faladas aparecem no relatório (o app chama `registrarFraseIncompleta`).

**Tour e ajuda**
- [ ] Tour abre na primeira vez, destaca cada botão (55 passos, pt/en/es).
- [ ] AJUDA E TOUR (um quadro só): explica cada parte, tem busca e o botão "Começar o tour" no topo.
- [ ] Em todas as telas de ajustes (Criar prancha, Gerir abas, Definições, Frases prontas, Registrar momento…), a seta ← volta para a tela anterior, não para o início.

**O que não pode mudar**
- [ ] Login, assinatura (Google Play) e dados do Firebase continuam iguais.
