// v14.8 — avisos do teste premium e bloco de planos com a trava do sábado (no app real: planos do Google Play).
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { pagamentoTravado, pagamentoLiberaEm, tp, JanelaSabado, JANELA_PADRAO, EstadoTeste, estadoTeste, temPremium, podeOferecerTeste } from '../src/rotina-amiga/v14/premium';
import { useVoz } from './voz/base';

const BUSCA = typeof window !== 'undefined' && window.location ? window.location.search : '';
const P = new URLSearchParams(BUSCA);
/** Dias do teste. No app real: Firebase limitações/rotina/testePremiumDias (hoje 30). No teste: ?testeDias=… */
export const DIAS_TESTE = (() => { const n = Number(P.get('testeDias')); return Number.isFinite(n) && n >= 0 && P.get('testeDias') ? Math.min(365, Math.round(n)) : 30; })();

/** Estado do plano no app de teste (no app real: Google Play + Firestore users/{uid}). */
export function usePremiumDemo() {
  const { s, mudar, toast } = useVoz();
  // ?testeInicioDiasAtras=N só para testar avisos e o fim do teste
  const atras = Number(P.get('testeInicioDiasAtras'));
  const inicio = Number.isFinite(atras) && P.get('testeInicioDiasAtras') ? Date.now() - atras * 86400000 : s.defs.testeInicio;
  const teste = estadoTeste({ inicio, dias: s.defs.testeDias ?? DIAS_TESTE }, Date.now(), DIAS_TESTE);
  const pago = P.get('plano') === 'completo' || s.defs.assinanteTeste === true;
  return {
    teste, pago, premium: temPremium(pago, teste), dias: DIAS_TESTE,
    podeTestar: !pago && podeOferecerTeste({ inicio }, DIAS_TESTE),
    iniciar: () => { mudar((x) => (x.defs.testeInicio ? x : { ...x, defs: { ...x.defs, testeInicio: Date.now(), testeDias: DIAS_TESTE, avisosTeste: [] } })); toast(`🎁 Teste premium liberado por ${DIAS_TESTE} dias!`); },
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
  if (s.pranchas.length <= limite) return null;
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
        {s.pranchas.map((q) => {
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
