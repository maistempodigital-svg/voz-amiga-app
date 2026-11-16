// Cartão da PRÓXIMA ETAPA — vai na área dos anúncios, embaixo da tela inicial do Voz Amiga.
// Não abre nenhuma tela: a criança só vê a etapa atual e o botão para começar/terminar.
// Sem etapa no momento => mostra o anúncio normalmente.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import * as A from '../logica/acoes';
import { Etapa, proximaEtapa, podeTerminar, segundosRestantes } from '../logica/rotina';
import { relogio } from '../logica/tempo';
import { emojiDaTarefa } from '../padroes';
import { paletaDaAba } from '../paleta';
import { Botao, C, Icone, sombra, T, px } from '../componentes/ui';
import { Segurar } from '../componentes/Segurar';
import { AlvoTour } from '../tour';

export interface PropsProximoPasso {
  /** O anúncio da versão gratuita (ex.: <AnuncioProtegido anuncio={dadosDoFirebase} />). Assinante não vê. */
  anuncio?: React.ReactNode;
  /** Versão curta do anúncio para ficar embaixo da etapa. Se não passar, mostra só o topo do `anuncio`. */
  anuncioCompacto?: React.ReactNode;
  /** Altura da faixa do anúncio embaixo da etapa (padrão 64). */
  alturaFaixaAnuncio?: number;
}

/**
 * Quando a criança termina, o cartão SAI DESLIZANDO para o lado; se não houver outra etapa, a área fica vazia
 * (só o anúncio, se houver). A próxima etapa só aparece quando os pais adicionarem tarefas.
 */
export function ProximoPasso(props: PropsProximoPasso) {
  const { estado, agora, pronto } = useRotina();
  const etapa = pronto && estado.config.mostrarNaHome ? proximaEtapa(estado, new Date(agora)) : undefined;
  const chave = etapa ? etapa.tarefa.id : '';
  const anterior = useRef<{ chave: string; etapa?: Etapa }>({ chave: '' });
  const [saindo, setSaindo] = useState<Etapa>();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = anterior.current;
    if (a.chave && a.chave !== chave && a.etapa) {
      setSaindo(a.etapa);
      x.setValue(0);
      Animated.timing(x, { toValue: 1, duration: 550, useNativeDriver: Platform.OS !== 'web' }).start(() => setSaindo(undefined));
    }
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { anterior.current = { chave, etapa }; });
  return (
    <AlvoTour id="rotina">
      <ProximoPassoBase {...props} />
      {saindo ? (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, opacity: x.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 520] }) }, { rotate: x.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) }] }}>
          <ProximoPassoBase {...props} congelada={saindo} />
        </Animated.View>
      ) : null}
    </AlvoTour>
  );
}

function ProximoPassoBase({ anuncio: anuncioHost, anuncioCompacto: compactoHost, alturaFaixaAnuncio = px(160), congelada }: PropsProximoPasso & { congelada?: Etapa }) {
  const ctx = useRotina();
  const { estado, agora, t, pronto, msAdulto, limites } = ctx;
  // Plano Completo: nunca mostra anúncio. Gratuito: o anúncio que o app passar.
  const anuncio = limites.anuncios ? anuncioHost : undefined;
  const anuncioCompacto = limites.anuncios ? compactoHost : undefined;
  const [opcoes, setOpcoes] = useState(false);

  const etapa = congelada || (pronto && estado.config.mostrarNaHome ? proximaEtapa(estado, new Date(agora)) : undefined);
  const espera = !congelada && pronto ? estado.esperaAtiva : undefined;

  if (!etapa && !espera) return anuncio ? <>{anuncio}</> : null;

  const faixa = congelada ? null : anuncioCompacto ?? (anuncio ? <View style={{ maxHeight: alturaFaixaAnuncio, overflow: 'hidden', borderRadius: px(29) }}>{anuncio}</View> : null);

  if (espera) {
    const r = estado.recompensas.find((x) => x.id === espera.recompensaId);
    const falta = Math.max(0, (espera.fim - agora) / 1000);
    const pronta = falta <= 0;
    return (
      <View style={{ paddingHorizontal: px(22.5), paddingBottom: px(16) }}>
        <View style={[{ backgroundColor: pronta ? '#ECFDF5' : '#EEF2FF', borderRadius: px(48), borderWidth: px(4), borderColor: pronta ? C.green : '#818CF8', padding: px(25.5), flexDirection: 'row', alignItems: 'center' }, sombra(6)]}>
          <View style={{ width: px(137.5), height: px(137.5), borderRadius: px(38.5), backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: px(85) }}>{r?.icone || '🎁'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: px(22.5) }}>
            <T s="cap" style={{ color: pronta ? C.greenDark : '#4338CA' }}>{pronta ? t('waitingReadyKicker') : t('waitingTitle')}</T>
            <T s="h2" style={{ textTransform: 'uppercase', fontSize: px(34) }} n={2}>{r?.titulo}</T>
            {pronta
              ? <Botao titulo={t('confirm')} cor={C.green} corTexto="#052E1B" borda={C.greenDark} alto={px(80)} style={{ marginTop: px(13) }} onPress={() => { ctx.mudar((s) => A.confirmarEspera(s, Date.now())); ctx.celebrar({ titulo: r?.titulo || '', estrelas: 0, emoji: r?.icone }); }} />
              : <Text style={{ fontSize: px(58), fontWeight: '900', color: '#4338CA', marginTop: px(6.5) }}>{relogio(falta)}</Text>}
          </View>
        </View>
        {faixa ? <View style={{ marginTop: px(16) }}>{faixa}</View> : null}
      </View>
    );
  }

  const e = etapa!;
  const p = paletaDaAba(e.aba);
  const ativa = e.ativa;
  const restante = ativa ? segundosRestantes(ativa, agora) : 0;
  const pode = ativa ? podeTerminar(estado, agora) : false;
  const frac = ativa && ativa.duracaoSeg > 0 ? Math.min(1, (agora - ativa.inicio) / 1000 / ativa.duracaoSeg) : 0;
  const sub = [e.tarefa.horario, e.tarefa.duracaoMin ? `${e.tarefa.duracaoMin} ${t('minutes')}` : ''].filter(Boolean).join(' · ');

  const abrirAdulto = () => ctx.pedirAdulto(() => setOpcoes(true), t('adultRelease'));

  return (
    <View style={{ paddingHorizontal: px(22.5), paddingBottom: px(16) }}>
      <Pressable onLongPress={abrirAdulto} delayLongPress={msAdulto} accessibilityHint={t('holdForAdult')}>
        {/* v9: cartão mais baixo, para sobrar espaço para o anúncio embaixo sem cortar */}
        <View style={[{ backgroundColor: p.softAlt, borderRadius: px(38), borderWidth: px(3.5), borderColor: ativa ? p.accentDark : p.border, paddingHorizontal: px(20), paddingVertical: px(14) }, sombra(6, p.accent, 0.18)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Segurar (3 s por padrão) no nome da rotina => configurações do Rotina (com a conta dos pais, se ligada) */}
            <Segurar ms={msAdulto} rotulo={`${e.aba.nome} — ${t('settings')}`} corFaixa="rgba(255,255,255,0.35)"
              aoCompletar={() => ctx.pedirAdulto(() => ctx.abrir({ nome: 'ajustes' }), t('settings'))}
              style={{ backgroundColor: p.accent, borderRadius: px(24), paddingHorizontal: px(16), height: px(48) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icone f="mci" n={e.aba.icone} size={px(29)} color={p.onAccent} />
                <Text style={{ color: p.onAccent, fontWeight: '900', fontSize: px(22), letterSpacing: px(1.5), marginLeft: px(9.5), textTransform: 'uppercase' }}>{e.aba.nome}</Text>
              </View>
            </Segurar>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: Math.min(e.total, 8) }).map((_, i) => (
                <View key={i} style={{ width: i === e.indice ? 18 : 8, height: px(13), borderRadius: px(6.5), marginLeft: px(6.5), backgroundColor: i < e.feitas ? p.accent : i === e.indice ? p.accentDark : p.soft }} />
              ))}
              <Text style={{ marginLeft: px(13), fontWeight: '900', color: p.text, fontSize: px(24) }}>{e.feitas}/{e.total}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(12) }}>
            <View style={[{ width: px(104), height: px(104), borderRadius: px(28), backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, sombra(2)]}>
              {e.tarefa.imagemUri
                ? <Image source={{ uri: e.tarefa.imagemUri }} style={{ width: px(104), height: px(104) }} />
                : <Text style={{ fontSize: px(66), lineHeight: px(80) }}>{emojiDaTarefa(e.tarefa.icone)}</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: px(22.5) }}>
              <T s="cap" style={{ color: p.text }}>{ativa ? t('doing') : t('nextStep')}</T>
              <Text style={{ fontSize: px(30), fontWeight: '900', color: C.ink, textTransform: 'uppercase', marginTop: px(2) }} numberOfLines={1}>{e.tarefa.titulo}</Text>
              {sub ? <Text style={{ fontSize: px(21), fontWeight: '800', color: C.slate, marginTop: px(2) }}>{sub}</Text> : null}
            </View>
          </View>

          <View style={{ marginTop: px(12) }}>
            {!ativa && e.bloqueadaAte ? (
              <View style={{ height: px(76), borderRadius: px(32), borderWidth: px(3), borderColor: p.border, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icone n="lock" size={px(32)} color={p.text} />
                <Text style={{ marginLeft: px(16), fontSize: px(30.5), fontWeight: '900', color: p.text, letterSpacing: px(1) }}>{t('waitUntil').toUpperCase()} {e.bloqueadaAte}</Text>
              </View>
            ) : !ativa ? (
              <Botao alto={px(82)} titulo={t('startTask')} icone={{ f: 'feather', n: 'play' }} cor={p.accent} corTexto={p.onAccent} borda={p.accentDark} onPress={() => ctx.iniciar(e.aba.id, e.tarefa.id)} />
            ) : ativa.duracaoSeg > 0 ? (
              <View>
                <View style={{ height: px(35), borderRadius: px(17.5), backgroundColor: p.soft, overflow: 'hidden' }}>
                  <View style={{ width: `${frac * 100}%`, height: '100%', backgroundColor: p.accent, borderRadius: px(17.5) }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: px(8) }}>
                  <Icone n="clock" size={px(32)} color={p.text} />
                  <Text style={{ fontSize: px(44), fontWeight: '900', color: p.text, marginLeft: px(13) }}>{relogio(restante)}</Text>
                </View>
              </View>
            ) : (
              <Botao alto={px(82)} titulo={t('iDidIt')} icone={{ f: 'feather', n: 'check' }} cor={C.green} corTexto="#052E1B" borda={C.greenDark} disabled={!pode} onPress={ctx.terminar} />
            )}
          </View>
        </View>
      </Pressable>

      {faixa ? <View style={{ marginTop: px(12) }}>{faixa}</View> : null}

      <Modal transparent visible={opcoes} animationType="slide" onRequestClose={() => setOpcoes(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpcoes(false)}>
          <Pressable style={{ backgroundColor: C.white, borderTopLeftRadius: px(51), borderTopRightRadius: px(51), padding: px(35), paddingBottom: px(54.5) }}>
            <T s="h2">{t('adultRelease')}</T>
            <T style={{ marginTop: px(9.5) }}>{t('adultReleaseDesc')}</T>
            <Text style={{ marginTop: px(16), fontSize: px(30.5), fontWeight: '900', color: C.ink }}>{emojiDaTarefa(e.tarefa.icone)}  {e.tarefa.titulo}</Text>
            {ativa ? <Botao titulo={t('completeNow')} cor={C.green} corTexto="#052E1B" borda={C.greenDark} style={{ marginTop: px(25.5) }} onPress={() => { setOpcoes(false); ctx.liberarComEstrela(); }} /> : null}
            <Botao titulo={t('skipTask')} cor="#F59E0B" corTexto="#451A03" borda="#B45309" style={{ marginTop: px(19) }} onPress={() => {
              setOpcoes(false);
              if (ativa) ctx.pularTarefa();
              else ctx.mudar((s) => A.concluirTarefa(A.iniciarTarefa(s, e.aba.id, e.tarefa.id, Date.now()), Date.now(), false).estado);
            }} />
            {ativa ? <Botao titulo={t('cancelTask')} contorno style={{ marginTop: px(19) }} onPress={() => { setOpcoes(false); ctx.cancelarTarefa(); }} /> : null}
            <Botao titulo={t('close')} contorno style={{ marginTop: px(19) }} onPress={() => setOpcoes(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
