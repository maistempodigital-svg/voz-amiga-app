// VOZ AMIGA v14.8 — PLANO GRÁTIS x COMPLETO, TESTE PREMIUM E SÁBADO
//
// Pedidos do Adriano (16/11/2026):
//  • Teste premium grátis, SEM cartão, de 30 dias (Firebase: limitações/rotina/testePremiumDias). Os pais começam quando quiserem.
//  • Faltando poucos dias (5, 3 e 1), avisar os pais que vai travar. Quando acaba, TRAVA os recursos premium.
//  • A criança nunca fica sem falar: depois do teste ela continua com as pranchas do limite grátis (as mais usadas,
//    ou as que os pais escolherem). O resto fica guardado (nunca apagado) e volta na hora ao assinar.
//  • Sem cobrança no sábado: de sexta 17h até sábado 20h, no horário do cliente OU no do Adriano (São Paulo),
//    o botão de pagar fica travado com o aviso "logo logo será liberado".
//  • Ao tocar em algo pago: mensagem curta + botão "Me leve até o plano" (e "Testar grátis" se o teste não foi usado).
//
// Tudo aqui é lógica pura (sem React), para poder ser testada.
import { Idioma } from '../tipos';

const DIA_MS = 24 * 60 * 60 * 1000;

// ------------------------------------------------------------------ TESTE PREMIUM

/** O que fica guardado (no servidor, na conta da família — o app só lê). */
export interface TestePremium {
  /** quando os pais apertaram "começar teste" (ms). Sem isso: ainda não usou. */
  inicio?: number;
  /** quantos dias valiam quando o teste começou (mudar no Firebase depois não encurta um teste já começado). */
  dias?: number;
}

export type EstadoTeste =
  | { fase: 'nao_usado' }
  | { fase: 'ativo'; diasRestantes: number; fim: number }
  | { fase: 'acabou'; fim: number };

/** Em que fase está o teste agora. Datas estranhas nunca liberam o premium. */
export const estadoTeste = (t: TestePremium | undefined, agora: number, diasPadrao: number): EstadoTeste => {
  const inicio = t?.inicio;
  if (typeof inicio !== 'number' || !Number.isFinite(inicio) || inicio <= 0) return { fase: 'nao_usado' };
  const diasBrutos = typeof t?.dias === 'number' && Number.isFinite(t.dias) ? t.dias : diasPadrao;
  const dias = Math.max(0, Math.min(365, Math.round(diasBrutos)));
  // relógio adiantado/atrasado demais (mais de 1 dia no futuro): não confia, considera acabado
  if (inicio > agora + DIA_MS) return { fase: 'acabou', fim: inicio };
  const fim = inicio + dias * DIA_MS;
  if (agora >= fim) return { fase: 'acabou', fim };
  return { fase: 'ativo', diasRestantes: Math.max(1, Math.ceil((fim - agora) / DIA_MS)), fim };
};

/** O teste pode ser oferecido? (nunca usado e o dono deixou dias > 0) */
export const podeOferecerTeste = (t: TestePremium | undefined, diasPadrao: number) =>
  diasPadrao > 0 && !(typeof t?.inicio === 'number' && t.inicio > 0);

/** Libera o Plano Completo? Assinante de verdade OU teste premium ativo. Só o booleano true vale. */
export const temPremium = (assinante: unknown, teste: EstadoTeste) => assinante === true || teste.fase === 'ativo';

/** Dias em que os pais recebem o aviso "vai travar" (uma vez em cada). */
export const DIAS_AVISO = [5, 3, 1];

/** Deve mostrar o aviso hoje? Devolve o dia do aviso (5, 3 ou 1) ou undefined. */
export const avisoFimTeste = (teste: EstadoTeste, avisosVistos: number[] = []): number | undefined => {
  if (teste.fase !== 'ativo') return undefined;
  // mostra só o aviso mais próximo do fim que ainda não foi visto
  const pendentes = DIAS_AVISO.filter((n) => teste.diasRestantes <= n && !avisosVistos.includes(n));
  return pendentes.length ? Math.min(...pendentes) : undefined;
};

// ------------------------------------------------------------------ O QUE A CRIANÇA CONTINUA USANDO

export interface PranchaUso { id: string; usos: number; criadaEm?: number }

/**
 * Depois do teste (ou no grátis): quais pranchas continuam na tela da criança.
 * 1º as escolhidas pelos pais; depois as mais usadas; empate = a mais antiga. Nada é apagado: as outras ficam guardadas com 👑.
 */
export const pranchasQueFicam = (pranchas: PranchaUso[], limite: number, escolhidasPais: string[] = []): Set<string> => {
  const lim = Math.max(0, Math.floor(limite));
  if (pranchas.length <= lim) return new Set(pranchas.map((p) => p.id));
  const ids = new Set(pranchas.map((p) => p.id));
  const fica: string[] = [];
  for (const id of escolhidasPais) if (ids.has(id) && !fica.includes(id) && fica.length < lim) fica.push(id);
  const resto = pranchas.filter((p) => !fica.includes(p.id))
    .sort((a, b) => (b.usos || 0) - (a.usos || 0) || (a.criadaEm ?? 0) - (b.criadaEm ?? 0));
  for (const p of resto) { if (fica.length >= lim) break; fica.push(p.id); }
  return new Set(fica);
};

// ------------------------------------------------------------------ SÁBADO

export interface JanelaSabado {
  /** liga/desliga (padrão: ligado) */
  ativo: boolean;
  /** começa: sexta-feira (5) às 17h */
  inicioDia: number; inicioHora: number;
  /** termina: sábado (6) às 20h */
  fimDia: number; fimHora: number;
  /** fuso do Adriano em minutos (São Paulo = -180) */
  fusoDonoMin: number;
}
export const JANELA_PADRAO: JanelaSabado = { ativo: true, inicioDia: 5, inicioHora: 17, fimDia: 6, fimHora: 20, fusoDonoMin: -180 };

/** Lê o nó do Firebase (limitações/sabado) com segurança. */
export const lerJanelaSabado = (x: unknown): JanelaSabado => {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  const int = (v: unknown, min: number, max: number, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : d);
  return {
    // só o booleano false desliga (valor estranho nunca libera cobrança no sábado)
    ativo: o.ativo === false ? false : true,
    inicioDia: int(o.inicioDia, 0, 6, JANELA_PADRAO.inicioDia),
    inicioHora: int(o.inicioHora, 0, 23, JANELA_PADRAO.inicioHora),
    fimDia: int(o.fimDia, 0, 6, JANELA_PADRAO.fimDia),
    fimHora: int(o.fimHora, 0, 23, JANELA_PADRAO.fimHora),
    fusoDonoMin: int(o.fusoDonoMin, -720, 840, JANELA_PADRAO.fusoDonoMin),
  };
};

/** Minuto da semana (0 = domingo 00:00) num fuso dado em minutos. */
const minutoDaSemana = (agoraMs: number, fusoMin: number) => {
  const d = new Date(agoraMs + fusoMin * 60000);
  return d.getUTCDay() * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes();
};
const dentro = (m: number, j: JanelaSabado) => {
  const ini = j.inicioDia * 1440 + j.inicioHora * 60;
  const fim = j.fimDia * 1440 + j.fimHora * 60;
  return ini <= fim ? m >= ini && m < fim : m >= ini || m < fim; // janela que vira a semana
};

/**
 * Pagamento travado agora? Confere o horário do cliente (fuso do celular) E o do Adriano.
 * @param fusoClienteMin  fuso do celular em minutos (ex.: -180). No app: -new Date().getTimezoneOffset().
 */
export const pagamentoTravado = (agoraMs: number, fusoClienteMin: number, j: JanelaSabado = JANELA_PADRAO) => {
  if (!j.ativo) return false;
  const fc = Number.isFinite(fusoClienteMin) && Math.abs(fusoClienteMin) <= 840 ? fusoClienteMin : j.fusoDonoMin;
  return dentro(minutoDaSemana(agoraMs, fc), j) || dentro(minutoDaSemana(agoraMs, j.fusoDonoMin), j);
};

/** Quando o pagamento volta (ms): o primeiro momento em que nenhum dos dois horários está na janela. */
export const pagamentoLiberaEm = (agoraMs: number, fusoClienteMin: number, j: JanelaSabado = JANELA_PADRAO): number | undefined => {
  if (!pagamentoTravado(agoraMs, fusoClienteMin, j)) return undefined;
  for (let t = agoraMs - (agoraMs % 60000) + 60000, i = 0; i < 4 * 1440; t += 60000, i++) if (!pagamentoTravado(t, fusoClienteMin, j)) return t;
  return undefined;
};

/** Renovação automática que cairia na janela: para quando adiar (o servidor usa isso com a API do Google Play). */
export const adiarRenovacaoPara = (renovaEmMs: number, j: JanelaSabado = JANELA_PADRAO): number | undefined => {
  if (!pagamentoTravado(renovaEmMs, j.fusoDonoMin, j)) return undefined;
  const libera = pagamentoLiberaEm(renovaEmMs, j.fusoDonoMin, j);
  return libera === undefined ? undefined : libera + 2 * 60 * 60 * 1000; // 2 h de folga depois do fim
};

// ------------------------------------------------------------------ TEXTOS (3 idiomas)

type T3 = Record<Idioma, string>;
export const TEXTOS_PREMIUM: Record<string, T3> = {
  ehPremium: { pt: 'Isto faz parte do Plano Completo 👑', es: 'Esto es parte del Plan Completo 👑', en: 'This is part of the Full Plan 👑' },
  meLeve: { pt: 'Me leve até o plano', es: 'Llévame al plan', en: 'Take me to the plan' },
  testar: { pt: 'Testar grátis por {n} dias', es: 'Probar gratis por {n} días', en: 'Try free for {n} days' },
  testarDesc: { pt: 'Use todos os recursos premium de graça durante {n} dias. Sem cartão e sem cobrança. Comece agora ou quando quiser.', es: 'Usa todos los recursos premium gratis durante {n} días. Sin tarjeta y sin cobro. Empieza ahora o cuando quieras.', en: 'Use every premium feature free for {n} days. No card, no charge. Start now or whenever you like.' },
  agoraNao: { pt: 'Agora não', es: 'Ahora no', en: 'Not now' },
  testeAtivo: { pt: 'Teste premium: faltam {n} dias', es: 'Prueba premium: faltan {n} días', en: 'Premium trial: {n} days left' },
  avisoFim: { pt: 'Seu teste premium acaba em {n} dia(s). Depois disso, os recursos premium serão travados. Nada será apagado.', es: 'Tu prueba premium termina en {n} día(s). Después, los recursos premium se bloquearán. Nada se borrará.', en: 'Your premium trial ends in {n} day(s). After that, premium features will be locked. Nothing will be deleted.' },
  acabou: { pt: 'Você já usou o teste premium. Para continuar com todos os recursos, faça a atualização para o Plano Completo.', es: 'Ya usaste la prueba premium. Para seguir con todos los recursos, pasa al Plan Completo.', en: 'You have used the premium trial. To keep every feature, upgrade to the Full Plan.' },
  guardado: { pt: 'Guardado 👑 (volta ao assinar)', es: 'Guardado 👑 (vuelve al suscribirte)', en: 'Saved 👑 (comes back when you subscribe)' },
  sabado: { pt: 'O pagamento estará disponível depois do pôr do sol de sábado. Logo logo será liberado! 💙', es: 'El pago estará disponible después de la puesta del sol del sábado. ¡Muy pronto se liberará! 💙', en: 'Payment will be available after sunset on Saturday. It will open again very soon! 💙' },
  soEmoji: { pt: 'No plano grátis as pranchas usam emojis. Foto, galeria e voz gravada fazem parte do Plano Completo.', es: 'En el plan gratis las tarjetas usan emojis. Foto, galería y voz grabada son del Plan Completo.', en: 'On the free plan cards use emojis. Photo, gallery and recorded voice are part of the Full Plan.' },
  poucosBotoes: { pt: 'Dica: comece com poucos botões. A criança aprende melhor assim, e você vai aumentando aos poucos.', es: 'Consejo: empieza con pocos botones. El niño aprende mejor así, y vas sumando poco a poco.', en: 'Tip: start with few buttons. Children learn better this way, and you add more little by little.' },
};
export const tp = (k: keyof typeof TEXTOS_PREMIUM, l: Idioma, n?: number) => (TEXTOS_PREMIUM[k][l] ?? TEXTOS_PREMIUM[k].pt).replace('{n}', String(n ?? ''));

/**
 * Teste que ACABA no horário do sábado (sexta 17h → sábado 20h): continua liberado até o pagamento abrir de novo,
 * porque nesse horário ninguém consegue assinar. Fora disso, devolve o mesmo estado.
 */
export const testeComSabado = (e: EstadoTeste, agora: number, fusoClienteMin: number, j: JanelaSabado = JANELA_PADRAO): EstadoTeste => {
  if (e.fase !== 'acabou' || typeof e.fim !== 'number') return e;
  if (!pagamentoTravado(agora, fusoClienteMin, j) || !pagamentoTravado(e.fim, fusoClienteMin, j)) return e;
  const libera = pagamentoLiberaEm(agora, fusoClienteMin, j) ?? agora;
  return { fase: 'ativo', diasRestantes: 1, fim: libera };
};
