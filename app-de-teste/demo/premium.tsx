// v14.8 — avisos do teste premium e bloco de planos com a trava do sábado (no app real: planos do Google Play).
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { pagamentoTravado, pagamentoLiberaEm, tp, JanelaSabado, JANELA_PADRAO, EstadoTeste, estadoTeste, temPremium, podeOferecerTeste, testeComSabado, lerJanelaSabado } from '../src/rotina-amiga/v14/premium';
import { useVoz } from './voz/base';
import { useConta } from './contaUI';
import { iniciarTesteServidor, temCompraNativa } from './conta';
import { veioProntaV24 } from './migracaoV24';

const BUSCA = typeof window !== 'undefined' && window.location ? window.location.search : '';
const P = new URLSearchParams(BUSCA);
/** Dias do teste. No app real: Firebase limitações/rotina/testePremiumDias (hoje 30). No teste: ?testeDias=… */
export const DIAS_TESTE = (() => { const n = Number(P.get('testeDias')); return Number.isFinite(n) && n >= 0 && P.get('testeDias') ? Math.min(365, Math.round(n)) : 30; })();

const TX_TESTE = {
  pt: { confirme: 'Confirme seu e-mail (veja a caixa de entrada) para liberar o teste grátis.', falhou: 'Não consegui liberar o teste agora. Confira a internet e tente de novo.' },
  en: { confirme: 'Confirm your email (check your inbox) to unlock the free trial.', falhou: 'Could not start the trial now. Check your internet and try again.' },
  es: { confirme: 'Confirma tu correo (mira tu bandeja de entrada) para activar la prueba gratis.', falhou: 'No pude activar la prueba ahora. Revisa tu internet e inténtalo de nuevo.' },
};
const idiomaTeste = (): 'pt' | 'en' | 'es' => { try { const l = (navigator.language || 'pt').slice(0, 2); return l === 'en' || l === 'es' ? l : 'pt'; } catch { return 'pt'; } };

/** Estado do plano no app de teste (no app real: Google Play + Firestore users/{uid}). */
export function usePremiumDemo() {
  const { s, mudar, toast } = useVoz();
  const conta = useConta();
  const diasFb = (conta.remoto.rotina as { testePremiumDias?: unknown } | undefined)?.testePremiumDias;
  const dias = P.get('testeDias') ? DIAS_TESTE : typeof diasFb === 'number' && diasFb >= 0 && diasFb <= 365 ? Math.round(diasFb) : DIAS_TESTE;
  // ?testeInicioDiasAtras=N só para testar avisos e o fim do teste
  const atras = Number(P.get('testeInicioDiasAtras'));
  // o início do teste vale do servidor (não volta ao reinstalar); sem servidor, o do celular
  const inicio = Number.isFinite(atras) && P.get('testeInicioDiasAtras') ? Date.now() - atras * 86400000 : conta.plano?.testePremium?.inicio ?? s.defs.testeInicio;
  // teste que acaba no horário do sábado continua até o pagamento abrir de novo (sábado 20h)
  const janelaSab = lerJanelaSabado(conta.remoto.sabado); const fusoCli = -new Date().getTimezoneOffset();
  const teste = testeComSabado(estadoTeste({ inicio, dias: conta.plano?.testePremium?.dias ?? s.defs.testeDias ?? dias }, Date.now(), dias), Date.now(), fusoCli, janelaSab);
  // pago de verdade = servidor (Google Play, Kiwify, liberado no painel). O "simular" só existe fora da loja.
  const simulado = !temCompraNativa() && (P.get('plano') === 'completo' || s.defs.assinanteTeste === true);
  const travado = conta.plano?.bloqueado === true || conta.plano?.soGratis === true; // escolhido pelo dono no painel
  const testeDono = conta.plano?.testeDono ? testeComSabado(estadoTeste(conta.plano.testeDono, Date.now(), dias), Date.now(), fusoCli, janelaSab) : undefined;
  const pago = !travado && (conta.plano?.hasAccess === true || simulado || testeDono?.fase === 'ativo');
  return {
    teste, pago, premium: !travado && temPremium(pago, teste), dias, simulado: !temCompraNativa(),
    podeTestar: !pago && !travado && podeOferecerTeste({ inicio }, dias),
    iniciar: async () => {
      // SEGURANÇA: no app da loja o teste SÓ começa pelo servidor (uma vez por conta, e-mail confirmado).
      // Se o servidor falhar, nada é liberado no celular; a pessoa tenta de novo.
      const r = conta.usuario ? await iniciarTesteServidor() : undefined;
      const ok = r && 'inicio' in r ? r : undefined;
      if (!ok && temCompraNativa()) {
        toast(r && 'erro' in r && r.erro === 'confirme-email' ? TX_TESTE[idiomaTeste()].confirme : TX_TESTE[idiomaTeste()].falhou);
        return false;
      }
      mudar((x) => (x.defs.testeInicio ? x : { ...x, defs: { ...x.defs, testeInicio: ok?.inicio ?? Date.now(), testeDias: ok?.dias ?? dias, avisosTeste: [] } }));
      toast(`🎁 Teste premium liberado por ${ok?.dias ?? dias} dias!`);
      return true;
    },
  };
}

type L = 'pt' | 'es' | 'en';

/** Aviso "seu teste acaba em X dias" (5, 3 e 1). Só na área dos pais/ao abrir, nunca no meio da fala da criança. */
export function AvisoFimTeste({ dias, idioma, fechar, irPlano }: { dias: number; idioma: L; fechar: () => void; irPlano: () => void }) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={fechar}>
      <Pressable onPress={fechar} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Pressable accessibilityLabel="aviso fim do teste premium" style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>⏳</Text>
          <Text style={{ marginTop: 8, fontSize: 18, fontWeight: '900', color: '#0F172A', textAlign: 'center' }}>{tp('testeAtivo', idioma, dias)}</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20 }}>{tp('avisoFim', idioma, dias)}</Text>
          <Pressable onPress={irPlano} accessibilityRole="button" style={{ marginTop: 16, alignSelf: 'stretch', backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>👑 {tp('meLeve', idioma)}</Text>
          </Pressable>
          <Pressable onPress={fechar} accessibilityRole="button" style={{ marginTop: 10, alignSelf: 'stretch', borderRadius: 16, borderWidth: 1.5, borderColor: '#CBD5E1', paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: '#334155', fontSize: 15, fontWeight: '800' }}>{tp('agoraNao', idioma)}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface PlanoVenda { id: string; titulo: string; subtitulo: string; preco?: string }

/**
 * Bloco da tela de Assinatura: estado do teste, botão "Testar grátis" e os planos ATIVOS.
 * De sexta 17h a sábado 20h (horário do cliente ou do Adriano) os botões de pagar ficam travados com o aviso do pôr do sol.
 */
export function BlocoPlanos({ idioma, planos, comprar, teste, podeTestar, dias, iniciarTeste, pago, janela = JANELA_PADRAO }: {
  idioma: L; planos: PlanoVenda[]; comprar: (id: string) => void; teste: EstadoTeste; podeTestar: boolean; dias: number; iniciarTeste: () => void; pago: boolean; janela?: JanelaSabado;
}) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 60000); return () => clearInterval(t); }, []);
  const fuso = -new Date().getTimezoneOffset();
  const travado = pagamentoTravado(agora, fuso, janela);
  const libera = travado ? pagamentoLiberaEm(agora, fuso, janela) : undefined;
  return (
    <View>
      {teste.fase === 'ativo' && !pago ? (
        <View accessibilityLabel="teste premium ativo" style={{ backgroundColor: '#DCFCE7', borderRadius: 14, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#166534' }}>🎁 {tp('testeAtivo', idioma, teste.diasRestantes)}</Text>
        </View>
      ) : null}
      {teste.fase === 'acabou' && !pago ? (
        <View accessibilityLabel="teste premium acabou" style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#92400E' }}>{tp('acabou', idioma)}</Text>
        </View>
      ) : null}
      {podeTestar && !pago ? (
        <Pressable onPress={iniciarTeste} accessibilityRole="button" accessibilityLabel="testar grátis"
          style={{ backgroundColor: '#16A34A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>🎁 {tp('testar', idioma, dias)}</Text>
          <Text style={{ color: '#DCFCE7', fontSize: 12, marginTop: 4, textAlign: 'center' }}>{tp('testarDesc', idioma, dias)}</Text>
        </Pressable>
      ) : null}
      {travado && !pago ? (
        <View accessibilityLabel="pagamento travado no sábado" style={{ backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#93C5FD', padding: 12, marginVertical: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E3A8A', textAlign: 'center' }}>{tp('sabado', idioma)}</Text>
          {libera ? <Text style={{ fontSize: 12, color: '#1E40AF', textAlign: 'center', marginTop: 4 }}>🕗 {new Date(libera).toLocaleString(idioma === 'pt' ? 'pt-BR' : idioma === 'es' ? 'es' : 'en', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text> : null}
        </View>
      ) : null}
      {!pago ? planos.map((p) => (
        <Pressable key={p.id} disabled={travado} onPress={() => { if (!pagamentoTravado(Date.now(), -new Date().getTimezoneOffset(), janela)) comprar(p.id); }}
          accessibilityRole="button" accessibilityLabel={`assinar ${p.titulo}`} accessibilityState={{ disabled: travado }}
          style={{ marginTop: 8, borderRadius: 16, borderWidth: 2, borderColor: travado ? '#CBD5E1' : '#7C3AED', backgroundColor: travado ? '#F1F5F9' : '#FAF5FF', padding: 14, flexDirection: 'row', alignItems: 'center', opacity: travado ? 0.6 : 1 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>👑 {p.titulo}</Text>
            <Text style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>{p.subtitulo}</Text>
          </View>
          {p.preco ? <Text style={{ fontSize: 15, fontWeight: '900', color: '#5B21B6' }}>{p.preco}</Text> : null}
          {travado ? <Text style={{ marginLeft: 8, fontSize: 18 }}>🔒</Text> : null}
        </Pressable>
      )) : null}
    </View>
  );
}

/** Pais escolhem quais pranchas continuam na tela da criança no plano grátis (as outras ficam guardadas com 👑). */
export function EscolherFixas({ limite }: { limite: number }) {
  const { s, mudar } = useVoz();
  const fixas = s.defs.pranchasFixas || [];
  const contam = s.pranchas.filter((q) => !veioProntaV24(q.id));
  if (contam.length <= limite) return null;
  const alternar = (id: string) => mudar((x) => {
    const f = x.defs.pranchasFixas || [];
    const n = f.includes(id) ? f.filter((y) => y !== id) : f.length < limite ? [...f, id] : f;
    return { ...x, defs: { ...x.defs, pranchasFixas: n } };
  });
  return (
    <View accessibilityLabel="escolher pranchas que ficam" style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#FDE68A', padding: 12 }}>
      <Text style={{ fontSize: 15, fontWeight: '900', color: '#92400E' }}>Quais pranchas ficam no plano grátis? ({fixas.length}/{limite})</Text>
      <Text style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Escolha as mais importantes para a criança. As que você não escolher, o app completa com as mais usadas. Nenhuma é apagada: as outras ficam guardadas com 👑 e voltam ao assinar.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {contam.map((q) => {
          const on = fixas.includes(q.id);
          return (
            <Pressable key={q.id} onPress={() => alternar(q.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`fica ${q.texto}`}
              style={{ margin: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: on ? '#16A34A' : '#CBD5E1', backgroundColor: on ? '#DCFCE7' : '#F8FAFC' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: on ? '#166534' : '#334155' }}>{on ? '✓ ' : ''}{q.emoji || '🖼️'} {q.texto}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
