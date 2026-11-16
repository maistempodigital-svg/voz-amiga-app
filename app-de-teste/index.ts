// Relógio fixo para os testes de tela no navegador (?hora=2026-10-19T13:10:00).
const q0 = typeof window !== 'undefined' && typeof document !== 'undefined' ? new URLSearchParams(window.location.search) : null;
// só nos testes automáticos (?tela=...); no APK de teste usa o relógio real do celular
if (q0 && (q0.get('tela') || q0.get('hora'))) {
  const q = q0;
  const alvo = q.get('hora') || '2026-10-19T13:10:00';
  const Real = Date;
  const desvio = new Real(alvo).getTime() - Real.now();
  class Falso extends Real {
    constructor(...a: unknown[]) {
      if (a.length === 0) super(Real.now() + desvio);
      else super(...(a as [number]));
    }
    static now() { return Real.now() + desvio; }
  }
  (globalThis as unknown as { Date: DateConstructor }).Date = Falso as unknown as DateConstructor;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerRootComponent } = require('expo');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const App = require('./App').default;
registerRootComponent(App);

// Celular (WebView): segurar um botão não pode selecionar texto nem abrir menu.
if (typeof document !== 'undefined') {
  const css = document.createElement('style');
  css.textContent = '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}input,textarea{-webkit-user-select:text;user-select:text}';
  document.head.appendChild(css);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}
