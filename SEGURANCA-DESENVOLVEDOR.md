# Segurança: o que o desenvolvedor precisa conferir no Voz Amiga

Varredura de 15/11/2026, feita com a lista de 26 itens. Cada falha foi conferida por um segundo auditor independente.
O módulo Rotina Amiga já vem corrigido. Os itens abaixo ficam no app principal e no Firebase, que só o desenvolvedor pode mudar.

## 1. ALTA: tela de recorte de imagem aberta para outros apps

**Onde está.** No APK de produção (versionCode 24), o `AndroidManifest.xml` final tem:

```xml
<activity android:name="com.canhub.cropper.CropImageActivity" android:exported="true" />
```

**O risco.** Outro app instalado no celular consegue abrir essa tela "como se fosse o Voz Amiga". Ele aponta a origem para imagens privadas do app (fotos das pranchas) ou o destino para um arquivo que ele controla. O Expo usa a própria `ExpoCropImageActivity`, que já está com `exported="false"`.

**Correção.** Forçar `exported="false"` com um config plugin. É um arquivo pequeno, `plugins/fecharCropper.js`:

```js
const { withAndroidManifest } = require('@expo/config-plugins');
module.exports = (config) => withAndroidManifest(config, (c) => {
  const app = c.modResults.manifest.application[0];
  c.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  app.activity = (app.activity || []).filter((a) => a.$['android:name'] !== 'com.canhub.cropper.CropImageActivity');
  app.activity.push({ $: { 'android:name': 'com.canhub.cropper.CropImageActivity', 'android:exported': 'false', 'tools:replace': 'android:exported' } });
  return c;
});
```

Em `app.json`, acrescente em `"plugins"`: `"./plugins/fecharCropper.js"`.

**Como conferir.** Depois do build, rode `aapt dump xmltree app.apk AndroidManifest.xml | grep -A3 CropImageActivity`. Tem que aparecer `exported=0`.

## 2. MÉDIA: regras do Firebase (gravação)

O app lê `limitações`, `anuncio` e `appConfig` do Realtime Database, e `users/{uid}` do Firestore. Se um usuário logado conseguir **gravar** nesses lugares, ele consegue:
- trocar o link do anúncio de todo mundo;
- liberar o plano pago para todos os gratuitos;
- marcar a própria conta como paga (`hasAccess`).

**Realtime Database.** Confira se está assim. Só leitura para o app; quem grava é o console ou as Cloud Functions.

```json
{
  "rules": {
    "limitações": { ".read": "auth != null", ".write": false },
    "anuncio":    { ".read": "auth != null", ".write": false },
    "appConfig":  { ".read": "auth != null", ".write": false },
    "$outro":     { ".read": false, ".write": false }
  }
}
```

**Firestore.** Cada um lê só o próprio documento. Os campos de plano só mudam pelo servidor.

```
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid
    && !request.resource.data.keys().hasAny(['hasAccess','hasEntitlement','latestPlanType','accessSource']);
  allow update: if request.auth != null && request.auth.uid == uid
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['hasAccess','hasEntitlement','latestPlanType','accessSource']);
  allow delete: if false;
}
```

**Como testar sem estragar nada.** Use o *Rules Playground* do console, simulando um usuário logado:
- tentar `update` em `users/<outro uid>` tem que dar **negado**;
- tentar `update` em `users/<próprio uid>` mudando `hasAccess` tem que dar **negado**;
- tentar gravar em `limitações/rotina` tem que dar **negado**.

## 3. MÉDIA: Firebase App Check

**O que falta.** O APK não tem App Check. Não aparece nenhuma classe `com/google/firebase/appcheck`, nem `initializeAppCheck` no bundle. Sem ele, qualquer pessoa com a chave pública chama o Firebase e as Cloud Functions direto, sem passar pelo app. Isso inclui a `generateTtsAudio`, que gasta cota paga.

**Correção.**
1. Instalar `@react-native-firebase/app-check` e ligar o provedor **Play Integrity**.
2. No console do Firebase, em App Check, primeiro observar as métricas. Depois **ativar a obrigatoriedade** no Firestore, no Realtime Database e nas Functions.
3. Nas Functions chamáveis, usar `enforceAppCheck: true`.

## 4. BAIXA: restringir as chaves do Google

O APK tem duas chaves de cliente `AIza…`: uma em `app.config` e outra no bundle. Elas podem ficar no app, mas precisam estar restringidas no Google Cloud Console, em APIs e serviços › Credenciais:
- **Restrição de aplicativo:** Android, com o pacote `com.vozamiga` mais o SHA-1 da chave de assinatura do Play (e o da chave de upload).
- **Restrição de API:** só as APIs que o app usa (Identity Toolkit, Firestore, Realtime Database, Firebase Installations, Token Service).

## 5. O que o módulo Rotina Amiga já faz

- **Links abertos.** Só abre links `https`, `mailto` e WhatsApp, inclusive o do anúncio que vem do Firebase (`linkSeguro`). A imagem do anúncio só é carregada por `https` (`imagemSegura`).
- **Tamanho dos textos.** Nomes vão até 60 caracteres e notas até 1000, na tela e ao salvar.
- **Relatório HTML.** Escapa todo texto digitado (`< > & " '`).
- **Plano pago.** Só é liberado pelo valor `assinante` que o app passa (o mesmo `hasAccess`). O módulo não tem atalho escondido.
- **Armazenamento.** Os dados ficam no aparelho (AsyncStorage, `allowBackup=false`). Para guardar cifrado, passe a prop `armazenamento` com um armazenamento cifrado, como `react-native-encrypted-storage`, embrulhado na interface do módulo: `{ ler: () => Promise<string | null>, gravar: (texto) => Promise<void> }` (a chave do armazenamento é sua, por exemplo `CHAVE_ARMAZENAMENTO`).

- **Plano pago.** Só o booleano `true` em `assinante` libera o plano; um texto `"false"` não libera. Os limites são conferidos de novo na hora de salvar tarefa e prêmio.
- **Analytics.** `aoRegistrarEvento` não recebe texto digitado pelos pais: vão só o id e o ícone da tarefa.
- **Ajustes.** Os quadros ROTINA AMIGA e RELATÓRIO GERAL abrem com um toque porque ficam **dentro** dos Ajustes do Voz. Os Ajustes têm de continuar protegidos por "segurar 3 s + continha".

## 6. O APK de teste (com.vozamiga.rotinateste) não vai para a loja

Ele é só uma casca WebView para testar as telas. Ele é assinado com a chave local `vozamiga-release.jks` (certificado `DF:60:57:01…`). Essa é a mesma chave das versões de teste de outubro, e **não** é a assinatura do app na Play: o Voz Amiga publicado é assinado pelo Google com o certificado `D9:AA:7A:68…`. Mesmo assim, essa chave e a senha dela devem ficar guardadas só com o dono e **não** devem ser usadas como chave de upload da Play. Ficam três observações, todas na casca nativa e nenhuma no módulo:
- foto tirada pela câmera vai para a galeria;
- a ponte nativa abre o link que o JavaScript mandar (o JavaScript já filtra com `linkSeguro`);
- as permissões da WebView são liberadas em bloco.

No app de verdade, use o seletor de imagem do Expo, que guarda no cache privado, e o `Linking` do React Native.

## 7. Contas (só o dono ativa)

Verificação em 2 etapas no Google (Firebase e Play Console), no GitHub e na Kiwify. O repositório `apkvozamiga` no GitHub deve ser **privado**.
