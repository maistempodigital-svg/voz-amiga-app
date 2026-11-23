// Telas que a criança abre pelo MENU DE CIMA do Voz: Prêmios (Loja de estrelas), Metas, Conquistas.
import { tx } from '../textos2';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { AlvoTour } from '../tour';
import * as A from '../logica/acoes';
import { conquistas, progressoMeta } from '../logica/estrelas';
import { relogio } from '../logica/tempo';
import { Recompensa } from '../tipos';
import { Botao, C, Icone, px, sombra } from '../componentes/ui';

const Fundo = ({ cor, children }: { cor: string; children: React.ReactNode }) => (
  <View style={{ flex: 1, backgroundColor: cor, overflow: 'hidden' }}>
    <View pointerEvents="none" style={{ position: 'absolute', width: px(560), height: px(560), borderRadius: px(280), right: px(-250), top: px(-200), backgroundColor: 'rgba(255,255,255,0.10)' }} />
    <View pointerEvents="none" style={{ position: 'absolute', width: px(560), height: px(560), borderRadius: px(280), left: px(-300), top: px(1360), backgroundColor: 'rgba(255,255,255,0.10)' }} />
    {children}
  </View>
);

const Topo = ({ kicker, titulo, sub, onFechar }: { kicker: string; titulo: string; sub: string; onFechar: () => void }) => (
  <View style={{ paddingHorizontal: px(28), paddingTop: px(30), flexDirection: 'row' }}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: px(22), fontWeight: '900', letterSpacing: px(1.4), textTransform: 'uppercase' }}>{kicker}</Text>
      <Text style={{ color: C.white, fontSize: px(52), fontWeight: '900', textTransform: 'uppercase', letterSpacing: px(-0.6), marginTop: px(4) }} numberOfLines={2} adjustsFontSizeToFit>{titulo}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: px(23), fontWeight: '500', marginTop: px(8) }}>{sub}</Text>
    </View>
    <Pressable onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" style={{ width: px(78), height: px(78), borderRadius: px(39), backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: px(2), borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
      <Icone n="x" size={px(36)} color={C.white} />
    </Pressable>
  </View>
);

const Estrela = ({ n, cor = C.starDark, tam = 26 }: { n: number | string; cor?: string; tam?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Icone f="mci" n="star-four-points" size={px(tam + 4)} color={cor} />
    <Text style={{ fontSize: px(tam), fontWeight: '900', color: cor, marginLeft: px(8) }}>{n}</Text>
  </View>
);

// ------------------------------------------------------------------ LOJA

function LojaLista({ seletor }: { seletor: React.ReactNode }) {
  const { estado, t, voltar, mudar, agora, falar, idioma, limites } = useRotina();
  const [confirmar, setConfirmar] = useState<Recompensa>();
  // regra dos pais "intervalo entre prêmios": a loja espera um pouco até o próximo
  const faltaMs = A.faltaProximoPremio(estado, agora);
  const podeAlgum = !faltaMs && A.premiosNaLoja(estado, limites.premios).some((r) => r.custo <= estado.estrelas);
  const comprar = (r: Recompensa) => {
    const res = A.comprar(estado, r.id, Date.now());
    if (!res.ok) return;
    mudar((s) => A.comprar(s, r.id, Date.now()).estado); // aplica sobre o estado mais novo
    if (!res.espera) falar(r.titulo); // sem pop-up
  };
  return (
    <Fundo cor="#3F3CB8">
      <ScrollView contentContainerStyle={{ paddingBottom: px(80) }}>
        <Topo kicker={t('shop')} titulo={t('starShop')} sub={t('shopSub')} onFechar={voltar} />
        {seletor}
        <View style={[{ marginHorizontal: px(28), marginTop: px(44), backgroundColor: '#FBBF24', borderRadius: px(56), padding: px(40), borderTopWidth: px(4), borderColor: '#FCD34D' }, sombra(10, '#000', 0.25)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: px(28), fontWeight: '900', color: '#78350F', textTransform: 'uppercase' }}>{t('balance')}</Text>
            <View style={{ backgroundColor: 'rgba(253,224,71,0.85)', borderRadius: px(26), paddingHorizontal: px(22), height: px(52), justifyContent: 'center' }}>
              <Text style={{ fontSize: px(19), fontWeight: '900', color: '#78350F', textTransform: 'uppercase' }}>{podeAlgum ? t('readyToRedeem') : t('keepGoing')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(40) }}>
            <View style={{ width: px(96), height: px(96), borderRadius: px(30), backgroundColor: 'rgba(253,224,71,0.9)', alignItems: 'center', justifyContent: 'center' }}>
              <Icone f="mci" n="star-four-points" size={px(48)} color="#7C2D12" />
            </View>
            <Text style={{ marginLeft: px(24), fontSize: px(96), fontWeight: '900', color: '#78350F', letterSpacing: px(-2) }}>{estado.estrelas}</Text>
          </View>
        </View>

        {faltaMs > 0 ? (
          <View accessibilityLabel="intervalo entre prêmios" style={{ marginHorizontal: px(28), marginTop: px(22), flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: px(30), paddingHorizontal: px(22), height: px(60) }}>
            <Text style={{ fontSize: px(24) }}>⏳</Text>
            <Text style={{ marginLeft: px(10), fontSize: px(22), fontWeight: '900', color: '#3730A3' }}>{tx(idioma, 'premProximo', { t: relogio(faltaMs / 1000) })}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: px(28), marginTop: px(16), justifyContent: 'space-between' }}>
          {A.premiosNaLoja(estado, limites.premios).length === 0 ? (
            <Text accessibilityLabel="sem prêmio na loja" style={{ width: '100%', marginTop: px(24), fontSize: px(26), fontWeight: '900', color: '#3730A3', textAlign: 'center' }}>{tx(idioma, 'premVazio')}</Text>
          ) : null}
          {A.premiosNaLoja(estado, limites.premios).map((r) => {
            const pode = !faltaMs && r.custo <= estado.estrelas;
            return (
              <View key={r.id} style={[{ width: '48.5%', marginTop: px(24), borderRadius: px(44), padding: px(30), alignItems: 'center', backgroundColor: pode ? C.white : 'rgba(224,226,250,0.82)' }, sombra(6, '#000', 0.15)]}>
                {r.esperaMin ? (
                  <View style={{ position: 'absolute', top: px(18), right: px(18), flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', borderRadius: px(22), paddingHorizontal: px(14), height: px(44) }}>
                    <Text style={{ fontSize: px(18) }}>⏳</Text>
                    <Text style={{ marginLeft: px(6), fontSize: px(19), fontWeight: '900', color: '#0F766E' }}>{r.esperaMin} {t('minutes').toUpperCase()}</Text>
                  </View>
                ) : null}
                <View style={{ width: px(124), height: px(124), borderRadius: px(36), backgroundColor: pode ? '#F8FAFC' : 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: px(66), lineHeight: px(80), opacity: pode ? 1 : 0.85 }}>{r.icone}</Text>
                </View>
                <Text style={{ marginTop: px(30), fontSize: px(31), fontWeight: '900', color: pode ? C.ink : '#3F4466', textTransform: 'uppercase', textAlign: 'center' }} numberOfLines={2} adjustsFontSizeToFit>{r.titulo}</Text>
                {!pode ? (
                  <View style={{ marginTop: px(18), backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: px(26), paddingHorizontal: px(22), height: px(48), justifyContent: 'center' }}>
                    <Text style={{ fontSize: px(20), fontWeight: '900', color: '#4B5072', textTransform: 'uppercase' }}>{t('missing')} {r.custo - estado.estrelas}</Text>
                  </View>
                ) : <View style={{ height: px(66) }} />}
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(16) }}>
                  <Text style={{ fontSize: px(20), fontWeight: '900', color: pode ? C.slate2 : '#6B7096', letterSpacing: px(1), textTransform: 'uppercase' }}>{t('cost')}</Text>
                  <View style={{ backgroundColor: pode ? '#FEF3C7' : 'rgba(255,255,255,0.45)', borderRadius: px(30), paddingHorizontal: px(20), height: px(58), justifyContent: 'center' }}>
                    <Estrela n={r.custo} cor={pode ? C.starDark : '#8A8FB3'} tam={24} />
                  </View>
                </View>
                <Pressable disabled={!pode} onPress={() => setConfirmar(r)} accessibilityRole="button" style={[{ alignSelf: 'stretch', marginTop: px(14), height: px(76), borderRadius: px(38), alignItems: 'center', justifyContent: 'center', backgroundColor: pode ? '#1D4ED8' : 'rgba(255,255,255,0.45)' }, pode ? sombra(4, '#1D4ED8', 0.3) : null]}>
                  <Text style={{ fontSize: px(22), fontWeight: '900', color: pode ? C.white : '#A3A7C6', letterSpacing: px(0.6), textTransform: 'uppercase' }}>{t('redeem')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal transparent visible={!!confirmar} animationType="fade" onRequestClose={() => setConfirmar(undefined)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: px(40) }}>
          <View style={[{ backgroundColor: C.white, borderRadius: px(56), padding: px(44), alignItems: 'center' }, sombra(14)]}>
            <Text style={{ fontSize: px(110) }}>{confirmar?.icone}</Text>
            <Text style={{ fontSize: px(40), fontWeight: '900', color: C.ink, textTransform: 'uppercase', textAlign: 'center', marginTop: px(10) }}>{confirmar?.titulo}</Text>
            <View style={{ marginTop: px(20), backgroundColor: '#FEF3C7', borderRadius: px(34), paddingHorizontal: px(30), height: px(70), justifyContent: 'center' }}>
              <Estrela n={confirmar?.custo ?? 0} tam={32} />
            </View>
            <Botao titulo={t('confirm')} cor="#1D4ED8" alto={px(100)} style={{ alignSelf: 'stretch', marginTop: px(36) }} onPress={() => { const r = confirmar!; setConfirmar(undefined); comprar(r); }} />
            <Botao titulo={t('cancel')} contorno alto={px(90)} style={{ alignSelf: 'stretch', marginTop: px(16) }} onPress={() => setConfirmar(undefined)} />
          </View>
        </View>
      </Modal>

      {estado.esperaAtiva ? <TelaEspera agora={agora} /> : null}
    </Fundo>
  );
}

/** "Falta pouco... Espere o tempo acabar para ganhar!" (recompensa com espera). */
function TelaEspera({ agora }: { agora: number }) {
  const { estado, t, mudar, celebrar, falar } = useRotina();
  const e = estado.esperaAtiva!;
  const r = estado.recompensas.find((x) => x.id === e.recompensaId);
  const falta = Math.max(0, (e.fim - agora) / 1000);
  const pronta = falta <= 0;
  const frac = Math.min(1, (agora - e.inicio) / Math.max(1, e.fim - e.inicio));
  const segurando = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: pronta ? '#065F46' : '#312E81', alignItems: 'center', justifyContent: 'center', padding: px(40) }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: px(24), fontWeight: '900', letterSpacing: px(2), textTransform: 'uppercase' }}>{pronta ? t('waitingReadyKicker') : t('wait')}</Text>
      <Text style={{ color: C.white, fontSize: px(56), fontWeight: '900', textAlign: 'center', marginTop: px(10) }}>{pronta ? t('waitingReadyTitle') : t('waitingTitle')}</Text>
      <View style={{ width: px(300), height: px(300), borderRadius: px(150), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: px(50) }}>
        <Text style={{ fontSize: px(150) }}>{r?.icone || '🎁'}</Text>
        <Text style={{ position: 'absolute', right: -px(30), bottom: -px(10), fontSize: px(110) }}>{estado.config.personagem === 'menina' ? '👧' : '👦'}</Text>
      </View>
      <Text style={{ color: C.white, fontSize: px(36), fontWeight: '900', textTransform: 'uppercase', marginTop: px(30) }}>{r?.titulo}</Text>
      {pronta ? (
        <>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: px(24), textAlign: 'center', marginTop: px(16) }}>{t('waitingReadyDesc')}</Text>
          <Botao titulo={t('confirm')} cor={C.green} corTexto="#052E1B" borda="#047857" alto={px(110)} style={{ alignSelf: 'stretch', marginTop: px(40) }} onPress={() => { mudar((s) => A.confirmarEspera(s, Date.now())); celebrar({ titulo: r?.titulo || '', estrelas: 0, emoji: r?.icone }); falar(r?.titulo || ''); }} />
        </>
      ) : (
        <>
          <Text style={{ color: C.white, fontSize: px(110), fontWeight: '900', marginTop: px(20) }}>{relogio(falta)}</Text>
          <View style={{ alignSelf: 'stretch', height: px(26), borderRadius: px(13), backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: px(10) }}>
            <View style={{ width: `${frac * 100}%`, height: '100%', backgroundColor: '#FACC15' }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: px(24), textAlign: 'center', marginTop: px(20) }}>{t('waitingDesc')}</Text>
          <Pressable
            onPressIn={() => { segurando.current = setTimeout(() => mudar(A.desistirEspera), 5000); }}
            onPressOut={() => { if (segurando.current) clearTimeout(segurando.current); }}
            style={{ marginTop: px(50), paddingHorizontal: px(40), height: px(80), borderRadius: px(40), borderWidth: px(2), borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: px(22), fontWeight: '800' }}>{t('waitingHoldToGiveUp')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ METAS

function MetasLista({ seletor }: { seletor: React.ReactNode }) {
  const { estado, t, voltar, mudar, agora, celebrar } = useRotina();
  const d = new Date(agora);
  const grupos = [
    { titulo: t('today'), metas: estado.metas.filter((m) => m.ativa && m.periodo === 'dia') },
    { titulo: t('thisWeek'), metas: estado.metas.filter((m) => m.ativa && m.periodo === 'semana') },
  ];
  return (
    <Fundo cor="#0369A1">
      <ScrollView contentContainerStyle={{ paddingBottom: px(80) }}>
        <Topo kicker={t('goals')} titulo={t('goals')} sub={t('goalsSub')} onFechar={voltar} />
        {seletor}
        <View style={{ marginHorizontal: px(28), marginTop: px(30), flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FBBF24', borderRadius: px(40), paddingHorizontal: px(30), height: px(80) }}>
          <Estrela n={estado.estrelas} tam={34} />
        </View>
        {grupos.map((g) => g.metas.length ? (
          <View key={g.titulo} style={{ paddingHorizontal: px(28) }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: px(24), fontWeight: '900', letterSpacing: px(2), textTransform: 'uppercase', marginTop: px(46) }}>{g.titulo}</Text>
            {g.metas.map((m) => {
              const p = progressoMeta(estado, m, d);
              return (
                <View key={m.id} style={[{ marginTop: px(22), backgroundColor: C.white, borderRadius: px(44), padding: px(30) }, sombra(6, '#000', 0.15)]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: px(104), height: px(104), borderRadius: px(32), backgroundColor: p.completa ? '#DCFCE7' : '#F0F9FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: px(56), lineHeight: px(68) }}>{m.icone}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: px(24) }}>
                      <Text style={{ fontSize: px(28), fontWeight: '900', color: C.ink }}>{m.titulo}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(14) }}>
                        <View style={{ flex: 1, height: px(22), borderRadius: px(11), backgroundColor: '#E0F2FE', overflow: 'hidden' }}>
                          <View style={{ width: `${(p.feito / p.alvo) * 100}%`, height: '100%', borderRadius: px(11), backgroundColor: p.completa ? C.green : '#0EA5E9' }} />
                        </View>
                        <Text style={{ marginLeft: px(16), fontSize: px(24), fontWeight: '900', color: C.slate2 }}>{p.feito}/{p.alvo}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(22) }}>
                    <View style={{ backgroundColor: '#FEF3C7', borderRadius: px(30), paddingHorizontal: px(20), height: px(58), justifyContent: 'center' }}>
                      <Estrela n={`+${m.premio}`} tam={24} />
                    </View>
                    {p.pago ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: px(34), paddingHorizontal: px(26), height: px(68) }}>
                        <Icone n="check" size={px(28)} color={C.greenDark} />
                        <Text style={{ marginLeft: px(10), fontSize: px(22), fontWeight: '900', color: C.greenDark, textTransform: 'uppercase' }}>{t('claimed')}</Text>
                      </View>
                    ) : (
                      <Pressable disabled={!p.completa} onPress={() => { const r = A.resgatarMeta(estado, m.id, Date.now()); mudar((s) => A.resgatarMeta(s, m.id, Date.now()).estado); if (r.estrelas) celebrar({ titulo: m.titulo, estrelas: r.estrelas, emoji: m.icone }); }}
                        style={[{ paddingHorizontal: px(36), height: px(72), borderRadius: px(36), justifyContent: 'center', backgroundColor: p.completa ? '#1D4ED8' : '#E2E8F0' }, p.completa ? sombra(4, '#1D4ED8', 0.3) : null]}>
                        <Text style={{ fontSize: px(22), fontWeight: '900', color: p.completa ? C.white : C.faint, textTransform: 'uppercase' }}>{t('claim')}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null)}
      </ScrollView>
    </Fundo>
  );
}

// ------------------------------------------------------------------ CONQUISTAS

function ConquistasGrade({ seletor }: { seletor: React.ReactNode }) {
  const { estado, t, voltar, idioma, agora } = useRotina();
  const lista = conquistas(estado, idioma, new Date(agora));
  const ganhas = lista.filter((c) => c.ganha).length;
  return (
    <Fundo cor="#5B21B6">
      <ScrollView contentContainerStyle={{ paddingBottom: px(80) }}>
        <Topo kicker={`${ganhas}/${lista.length}`} titulo={t('achievements')} sub={t('achievementsSub')} onFechar={voltar} />
        {seletor}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: px(28), marginTop: px(20) }}>
          {lista.map((c) => (
            <View key={c.id} style={[{ width: '31.5%', marginTop: px(22), borderRadius: px(40), paddingVertical: px(28), paddingHorizontal: px(14), alignItems: 'center', backgroundColor: c.ganha ? C.white : 'rgba(255,255,255,0.16)' }, c.ganha ? sombra(6, '#000', 0.18) : null]}>
              <View style={{ width: px(118), height: px(118), borderRadius: px(59), backgroundColor: c.ganha ? c.fundo : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: px(4), borderColor: c.ganha ? c.cor : 'rgba(255,255,255,0.25)' }}>
                <Icone f="mci" n={c.ganha ? c.icone : 'lock-outline'} size={px(54)} color={c.ganha ? c.cor : 'rgba(255,255,255,0.7)'} />
              </View>
              <Text style={{ marginTop: px(18), fontSize: px(22), fontWeight: '900', color: c.ganha ? C.ink : C.white, textAlign: 'center', textTransform: 'uppercase' }} numberOfLines={2}>{c.titulo}</Text>
              {!c.ganha ? (
                <View style={{ alignSelf: 'stretch', height: px(14), borderRadius: px(7), backgroundColor: 'rgba(255,255,255,0.2)', marginTop: px(14), overflow: 'hidden' }}>
                  <View style={{ width: `${c.progresso * 100}%`, height: '100%', backgroundColor: '#FACC15' }} />
                </View>
              ) : <Text style={{ marginTop: px(8), fontSize: px(18), fontWeight: '900', color: c.cor, textTransform: 'uppercase' }}>✓ {t('unlocked')}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </Fundo>
  );
}

// ------------------------------------------------------------------ PRÊMIOS + METAS + CONQUISTAS (um lugar só)

export type AbaPremios = 'premios' | 'metas' | 'conquistas';

/** Um único botão no menu (PRÊMIOS) abre esta tela, com 3 abas: Prêmios (loja), Metas e Conquistas. */
export function PremiosCentral({ inicial = 'premios' }: { inicial?: AbaPremios }) {
  const { t, estado, agora, pode, idioma } = useRotina();
  const [aba, setAba] = useState<AbaPremios>(pode('metas') ? inicial : 'premios');
  const cor: Record<AbaPremios, string> = { premios: '#3F3CB8', metas: '#0369A1', conquistas: '#5B21B6' };
  const prontas = estado.metas.filter((m) => m.ativa).filter((m) => { const p = progressoMeta(estado, m, new Date(agora)); return p.completa && !p.pago; }).length;
  const rot: Record<AbaPremios, string> = { premios: `🎁 ${t('prizes')}`, metas: `🎯 ${t('goals')}${prontas ? ` (${prontas})` : ''}`, conquistas: `🏅 ${t('achievements')}` };
  const seletor = (
    <AlvoTour id="p_abas">
    <View style={{ flexDirection: 'row', marginHorizontal: px(28), marginTop: px(30), backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: px(40), padding: px(8) }}>
      {(['premios', 'metas', 'conquistas'] as const).map((a) => (
        <Pressable key={a} onPress={() => setAba(a)} accessibilityRole="tab" accessibilityLabel={a} accessibilityState={{ selected: aba === a }} style={{ flex: 1, height: px(80), borderRadius: px(34), alignItems: 'center', justifyContent: 'center', backgroundColor: aba === a ? C.white : 'transparent' }}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: px(21), fontWeight: '900', textTransform: 'uppercase', color: aba === a ? cor[a] : C.white, paddingHorizontal: px(6) }}>{rot[a]}</Text>
        </Pressable>
      ))}
    </View>
    </AlvoTour>
  );
  if (aba === 'premios') return <LojaLista seletor={seletor} />;
  if (!pode('metas')) {
    // área da criança: só avisa (sem botão de compra) — os planos ficam com os pais
    return (
      <View style={{ flex: 1, backgroundColor: cor[aba] }}>
        {seletor}
        <View style={{ margin: px(40), backgroundColor: C.white, borderRadius: px(44), padding: px(40), alignItems: 'center' }}>
          <Text style={{ fontSize: px(90) }}>🔒</Text>
          <Text style={{ marginTop: px(12), fontSize: px(26), fontWeight: '800', color: C.slate2, textAlign: 'center' }}>{tx(idioma, 'plan_metas')}</Text>
        </View>
      </View>
    );
  }
  return aba === 'metas' ? <MetasLista seletor={seletor} /> : <ConquistasGrade seletor={seletor} />;
}

export const LojaEstrelas = () => <PremiosCentral inicial="premios" />;
export const Metas = () => <PremiosCentral inicial="metas" />;
export const Conquistas = () => <PremiosCentral inicial="conquistas" />;
export const MetasEConquistas = Metas;
