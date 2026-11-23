// Planos à venda (os que o dono deixou LIGADOS no painel) + preço real da Play Store + compra.
// Usado na entrada do app, quando o teste acaba e em Ajustes › Minha assinatura.
import React, { useState } from 'react';
import { comprar, lerPrecos, temCompraNativa } from './conta';
import { useConta } from './contaUI';

export interface PlanoAVenda { id: string; titulo: string; subtitulo: string; tipo: 'subs' | 'inapp'; preco?: string; vitalicio: boolean }

export function usePlanosVenda(aviso: (t: string) => void) {
  const conta = useConta();
  const doFb = Object.entries(conta.remoto.planos || {})
    .filter(([k, v]) => k !== 'free' && v?.enabled === true && typeof v.googleProductId === 'string' && /^[a-z0-9_.]{3,60}$/.test(v.googleProductId))
    .map(([, v]) => ({ id: v.googleProductId as string, titulo: (v.title || 'Plano').slice(0, 40), subtitulo: (v.subtitle || '').slice(0, 120), tipo: v.productType === 'inapp' ? 'inapp' as const : 'subs' as const }));
  const base = doFb.length ? doFb : [
    { id: 'voz_amiga_lifetime', titulo: 'Plano Vitalício', subtitulo: 'Pagamento único, acesso para sempre.', tipo: 'inapp' as const },
    { id: 'voz_amiga_monthly', titulo: 'Plano Mensal', subtitulo: 'Renova todo mês. Cancela quando quiser.', tipo: 'subs' as const },
  ];
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const ids = base.map((p) => p.id).join(',');
  React.useEffect(() => { let vivo = true; lerPrecos(ids.split(',')).then((r) => { if (vivo) setPrecos(r); }); return () => { vivo = false; }; }, [ids]);
  // vitalício primeiro (é o mais escolhido), depois os outros
  const planos: PlanoAVenda[] = base.map((p) => ({ ...p, preco: precos[p.id], vitalicio: p.tipo === 'inapp' }))
    .sort((a, b) => Number(b.vitalicio) - Number(a.vitalicio));
  const [comprando, setComprando] = useState(false);
  const fazerCompra = async (id: string): Promise<boolean> => {
    if (!temCompraNativa()) { aviso('No app da loja abre o pagamento do Google Play.'); return false; }
    if (!conta.usuario) { conta.abrirEntrar('Entre na sua conta para assinar. Assim o plano fica guardado mesmo se trocar de celular.'); return false; }
    if (comprando) return false;
    setComprando(true);
    try {
      const r = await comprar(id, planos.find((x) => x.id === id)?.tipo || 'subs');
      aviso(r === 'ok' ? '👑 Pagamento confirmado! Tudo liberado.' : r === 'pendente' ? 'Pagamento em análise pelo Google. Assim que aprovar, libera sozinho.' : 'Pagamento cancelado.');
      return r === 'ok';
    } catch { aviso('O pagamento não foi concluído. Nada foi cobrado. Tente de novo.'); return false; }
    finally { setComprando(false); }
  };
  return { planos, fazerCompra, comprando };
}
