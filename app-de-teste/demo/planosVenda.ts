// Planos à venda (os que o dono deixou LIGADOS no painel) + preço real da Play Store + compra.
// Usado na entrada do app, quando o teste acaba e em Ajustes › Minha assinatura.
import React, { useState } from 'react';
import { comprar, lerPrecos, temCompraNativa } from './conta';
import { useConta } from './contaUI';
import { lerJanelaSabado, pagamentoTravado } from '../src/rotina-amiga/v14/premium';

export interface PlanoAVenda { id: string; titulo: string; subtitulo: string; tipo: 'subs' | 'inapp'; preco?: string; vitalicio: boolean }

type Id = 'pt' | 'en' | 'es';
// nomes nos 3 idiomas (o título do painel é em português)
const NOMES: Record<string, Record<Id, [string, string]>> = {
  voz_amiga_lifetime: { pt: ['Plano Vitalício', 'Pagamento único, acesso para sempre.'], en: ['Lifetime Plan', 'One-time payment, access forever.'], es: ['Plan Vitalicio', 'Pago único, acceso para siempre.'] },
  voz_amiga_monthly: { pt: ['Plano Mensal', 'Renova todo mês. Cancela quando quiser.'], en: ['Monthly Plan', 'Renews every month. Cancel anytime.'], es: ['Plan Mensual', 'Se renueva cada mes. Cancela cuando quieras.'] },
  voz_amiga_semiannual: { pt: ['Plano Semestral', 'Renova a cada 6 meses.'], en: ['6-Month Plan', 'Renews every 6 months.'], es: ['Plan Semestral', 'Se renueva cada 6 meses.'] },
  voz_amiga_annual: { pt: ['Plano Anual', 'Renova uma vez por ano.'], en: ['Yearly Plan', 'Renews once a year.'], es: ['Plan Anual', 'Se renueva una vez al año.'] },
};
const MSG: Record<Id, Record<string, string>> = {
  pt: { loja: 'No app da loja abre o pagamento do Google Play.', entrar: 'Entre na sua conta para assinar. Assim o plano fica guardado mesmo se trocar de celular.', sabado: '🌅 O pagamento abre de novo no sábado às 20h. Logo logo será liberado.', ok: '👑 Pagamento confirmado! Tudo liberado.', pendente: 'Pagamento em análise pelo Google. Assim que aprovar, libera sozinho.', cancelado: 'Pagamento cancelado.', erro: 'O pagamento não foi concluído. Nada foi cobrado. Tente de novo.' },
  en: { loja: 'Google Play payment opens in the store app.', entrar: 'Sign in to subscribe, so your plan stays with you even on a new phone.', sabado: '🌅 Payments open again on Saturday at 8 pm. Coming soon.', ok: '👑 Payment confirmed! Everything unlocked.', pendente: 'Payment under review by Google. It unlocks by itself once approved.', cancelado: 'Payment canceled.', erro: 'The payment was not completed. Nothing was charged. Please try again.' },
  es: { loja: 'En la app de la tienda se abre el pago de Google Play.', entrar: 'Entra en tu cuenta para suscribirte, así el plan se guarda aunque cambies de celular.', sabado: '🌅 El pago se abre de nuevo el sábado a las 20h. Muy pronto.', ok: '👑 ¡Pago confirmado! Todo desbloqueado.', pendente: 'Pago en revisión por Google. Cuando se apruebe, se libera solo.', cancelado: 'Pago cancelado.', erro: 'El pago no se completó. No se cobró nada. Inténtalo de nuevo.' },
};

export function usePlanosVenda(aviso: (t: string) => void, idioma: Id = 'pt') {
  const m = MSG[idioma] || MSG.pt;
  const conta = useConta();
  const doFb = Object.entries(conta.remoto.planos || {})
    .filter(([k, v]) => k !== 'free' && v?.enabled === true && typeof v.googleProductId === 'string' && /^[a-z0-9_.]{3,60}$/.test(v.googleProductId))
    .map(([, v]) => ({ id: v.googleProductId as string, titulo: (NOMES[v.googleProductId as string]?.[idioma]?.[0] || v.title || 'Plano').slice(0, 40), subtitulo: (NOMES[v.googleProductId as string]?.[idioma]?.[1] || v.subtitle || '').slice(0, 120), tipo: v.productType === 'inapp' ? 'inapp' as const : 'subs' as const }));
  const base = doFb.length ? doFb : [
    { id: 'voz_amiga_lifetime', titulo: NOMES.voz_amiga_lifetime[idioma][0], subtitulo: NOMES.voz_amiga_lifetime[idioma][1], tipo: 'inapp' as const },
    { id: 'voz_amiga_monthly', titulo: NOMES.voz_amiga_monthly[idioma][0], subtitulo: NOMES.voz_amiga_monthly[idioma][1], tipo: 'subs' as const },
  ];
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const ids = base.map((p) => p.id).join(',');
  React.useEffect(() => { let vivo = true; lerPrecos(ids.split(',')).then((r) => { if (vivo) setPrecos(r); }); return () => { vivo = false; }; }, [ids]);
  // vitalício primeiro (é o mais escolhido), depois os outros
  const planos: PlanoAVenda[] = base.map((p) => ({ ...p, preco: precos[p.id], vitalicio: p.tipo === 'inapp' }))
    .sort((a, b) => Number(b.vitalicio) - Number(a.vitalicio));
  const [comprando, setComprando] = useState(false);
  const fazerCompra = async (id: string): Promise<boolean> => {
    if (!temCompraNativa()) { aviso(m.loja); return false; }
    if (!conta.usuario) { conta.abrirEntrar(m.entrar); return false; }
    if (comprando) return false;
    // SEGURANÇA/SÁBADO: confere na HORA do toque (a tela pode ter aberto antes de sexta 17h)
    if (pagamentoTravado(Date.now(), -new Date().getTimezoneOffset(), lerJanelaSabado(conta.remoto.sabado))) { aviso(m.sabado); return false; }
    setComprando(true);
    try {
      const r = await comprar(id, planos.find((x) => x.id === id)?.tipo || 'subs');
      aviso(r === 'ok' ? m.ok : r === 'pendente' ? m.pendente : m.cancelado);
      return r === 'ok';
    } catch { aviso(m.erro); return false; }
    finally { setComprando(false); }
  };
  return { planos, fazerCompra, comprando };
}
