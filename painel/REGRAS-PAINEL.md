# Regras do Realtime Database para o painel

Hoje `limitações`, `appConfig` e os outros nós têm `".write": false` (ninguém grava pelo app — continua assim).
Para o painel salvar, só a conta do Adriano (e-mail verificado do Google) ganha gravação nestes lugares:

```
"limitações": {
  ".read": "auth != null",
  ".write": "auth != null && auth.token.email === 'maistempodigital@gmail.com' && auth.token.email_verified === true"
},
"appConfig": {
  "planSelection": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.email === 'maistempodigital@gmail.com' && auth.token.email_verified === true"
  },
  ...
}
```
Nada muda para os clientes: o app continua só lendo.
