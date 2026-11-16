// AJUSTES do Rotina Amiga (Tarefas / Relatórios / Opções) — abre a partir de "Ajustes e Opções" do Voz.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { AlvoTour } from '../tour';
import * as A from '../logica/acoes';
import { tarefasDoDia } from '../logica/rotina';
import { duracaoCurta } from '../logica/tempo';
import { emojiDaTarefa } from '../padroes';
import { paletaDaAba } from '../paleta';
import { DIAS_ABREV, DIAS_LETRA, MESES } from '../textos';
import { tx } from '../textos2';
import { SeloPlano } from '../componentes/Extras';
import { TextInput } from 'react-native';
import {
  Botao, C, CaixaIcone, Cartao, Chip, Divisor, GrupoOpcoes, Icone, Interruptor, LinhaOpcao, Rolagem, Secao, sombra, T, Toque, px } from '../componentes/ui';

type Aba = 'tarefas' | 'opcoes';

export function AjustesRotina({ abaInicial = 'tarefas' }: { abaInicial?: Aba | 'relatorios' }) {
  const { t, voltar, abrir, idioma } = useRotina();
  const [aba, setAba] = useState<Aba>(abaInicial === 'relatorios' ? 'tarefas' : abaInicial);
  const abas: { id: Aba; emoji: string; rotulo: string; cor: string }[] = [
    { id: 'tarefas', emoji: '📋', rotulo: t('tasksTab'), cor: C.blue },
    { id: 'opcoes', emoji: '⚙️', rotulo: t('optionsTab'), cor: '#F43F5E' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ backgroundColor: C.white, paddingHorizontal: px(26.5), paddingTop: px(26.5), paddingBottom: px(19), flexDirection: 'row', alignItems: 'center', borderBottomWidth: px(2), borderColor: '#E9EEF5' }}>
        <View style={{ flex: 1 }}>
          <T s="kick" style={{ color: C.green, fontSize: px(18) }}>{t('rotinaAmiga')}</T>
          <T s="h1" style={{ fontSize: px(55), textTransform: 'uppercase' }}>{t('settings')}</T>
        </View>
        <Toque onPress={() => abrir({ nome: 'notificacoes' })} rotulo={tx(idioma, 'bell')} style={{ width: px(77), height: px(77), borderRadius: px(26), borderWidth: px(2), borderColor: C.line2, alignItems: 'center', justifyContent: 'center', marginRight: px(16) }}>
          <Icone n="bell" size={px(32)} color={C.ink} />
        </Toque>
        <Toque onPress={voltar} rotulo={t('done')} style={[{ backgroundColor: C.blue, borderRadius: px(36), height: px(77), paddingHorizontal: px(43), justifyContent: 'center' }, sombra(6, C.blue, 0.3)]}>
          <Text style={{ color: C.white, fontSize: px(30.5), fontWeight: '800' }}>{t('done')}</Text>
        </Toque>
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: C.white, paddingHorizontal: px(21.5), paddingTop: px(14.5), borderBottomWidth: px(2), borderColor: '#E9EEF5' }}>
        {abas.map((a) => {
          const on = a.id === aba;
          return (
            <AlvoTour key={a.id} id={a.id === 'opcoes' ? 'r_abaOpcoes' : 'r_abaTarefas'} style={{ flex: 1 }}>
            <Pressable onPress={() => setAba(a.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ alignItems: 'center', paddingVertical: px(24), backgroundColor: on ? C.bg : 'transparent', borderTopLeftRadius: px(29), borderTopRightRadius: px(29), borderBottomWidth: px(6), borderColor: on ? a.cor : 'transparent' }}>
              <Text style={{ fontSize: px(22), fontWeight: '900', color: on ? a.cor : C.slate2, letterSpacing: px(0.5), textTransform: 'uppercase' }} numberOfLines={1}>{a.emoji} {a.rotulo}</Text>
            </Pressable>
            </AlvoTour>
          );
        })}
      </View>
      {aba === 'tarefas' ? <AbaTarefas /> : <AbaOpcoes />}
    </View>
  );
}

// ------------------------------------------------------------------ TAREFAS

function AbaTarefas() {
  const { estado, t, abrir, mudar, idioma, exigir, pode, assinante, limites } = useRotina();
  const [i, setI] = useState(0);
  const idx = Math.min(i, Math.max(0, estado.abas.length - 1));
  const aba = estado.abas[idx];
  const tarefas = useMemo(() => {
    if (!aba) return [];
    const doAba = estado.tarefas.filter((x) => x.abaId === aba.id);
    const hoje = tarefasDoDia({ ...estado, tarefas: doAba.map((x) => ({ ...x, dias: [0, 1, 2, 3, 4, 5, 6] })) }, aba.id);
    return hoje.map((h) => doAba.find((x) => x.id === h.id)!);
  }, [aba, estado]);
  const p = paletaDaAba(aba);
  const L = DIAS_LETRA[idioma];
  if (!aba) {
    return (
      <Rolagem>
        <AlvoTour id="r_rotinaAtual">
          <Cartao style={{ padding: px(36), alignItems: 'center' }}>
            <Text style={{ fontSize: px(80) }}>🗓️</Text>
            <T s="h3" style={{ textAlign: 'center', marginTop: px(10), fontSize: px(27) }}>{tx(idioma, 'noRoutineYet')}</T>
            <Botao titulo={tx(idioma, 'firstRoutine')} icone={{ f: 'feather', n: 'plus' }} cor={C.green} corTexto="#052E1B" borda={C.greenDark} alto={px(96)} style={{ marginTop: px(26), alignSelf: 'stretch' }} onPress={() => abrir({ nome: 'novaRotina' })} />
          </Cartao>
        </AlvoTour>
        <AlvoTour id="r_adicionar">
          <Pressable onPress={() => abrir({ nome: 'novaRotina' })} accessibilityRole="button" style={{ marginTop: px(31), height: px(125), borderRadius: px(62.5), borderWidth: px(3.5), borderStyle: 'dashed', borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Icone n="plus" size={px(36)} color={C.slate2} />
            <Text style={{ marginLeft: px(17), fontSize: px(30.5), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{t('addSpecificTask')}</Text>
          </Pressable>
        </AlvoTour>
      </Rolagem>
    );
  }
  const nTarefas = estado.tarefas.filter((x) => x.abaId === aba.id).length;
  return (
    <Rolagem>
      <AlvoTour id="r_rotinaAtual">
      <Cartao style={{ paddingVertical: px(26.5) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T s="kick" style={{ letterSpacing: px(1.5), fontSize: px(20.5) }}>{t('currentRoutine')}</T>
          <T s="kick" style={{ color: C.faint, fontSize: px(20.5) }}>{idx + 1} / {estado.abas.length}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(21.5) }}>
          <Toque onPress={() => setI((idx - 1 + estado.abas.length) % estado.abas.length)} rotulo="anterior" style={{ width: px(79), height: px(79), borderRadius: px(24), borderWidth: px(2), borderColor: C.line2, alignItems: 'center', justifyContent: 'center' }}>
            <Icone n="chevron-left" size={px(33.5)} color={C.ink} />
          </Toque>
          <View style={[{ flex: 1, marginHorizontal: px(19), height: px(105.5), borderRadius: px(53), backgroundColor: p.accent, borderWidth: px(2.5), borderColor: p.accentDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, sombra(6, p.accent, 0.3)]}>
            <View style={{ width: px(55), height: px(55), borderRadius: px(27.5), backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Icone f="mci" n={aba.icone} size={px(29)} color={p.onAccent} />
            </View>
            <Text style={{ marginLeft: px(19), fontSize: px(27.5), fontWeight: '900', letterSpacing: px(1), color: p.onAccent, textTransform: 'uppercase' }} numberOfLines={1}>{aba.nome}</Text>
          </View>
          <Toque onPress={() => setI((idx + 1) % estado.abas.length)} rotulo="próxima" style={{ width: px(79), height: px(79), borderRadius: px(24), borderWidth: px(2), borderColor: C.line2, alignItems: 'center', justifyContent: 'center' }}>
            <Icone n="chevron-right" size={px(33.5)} color={C.ink} />
          </Toque>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: px(26.5) }}>
          {estado.abas.map((a, k) => <View key={a.id} style={{ width: k === idx ? 40 : 14, height: px(17), borderRadius: px(8.5), marginHorizontal: px(6), backgroundColor: k === idx ? p.accent : C.line2 }} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: px(20) }}>
          <Pressable onPress={() => exigir('rotina', () => abrir({ nome: 'novaRotina' }))} accessibilityRole="button" accessibilityLabel={tx(idioma, 'addRoutine')} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: px(22), height: px(60), borderRadius: px(30), borderWidth: px(2), borderColor: C.line2 }}>
            <Icone n="plus" size={px(24)} color={C.slate2} />
            <Text style={{ marginLeft: px(8), fontSize: px(20), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{tx(idioma, 'addRoutine')}</Text>
          </Pressable>
          {!pode('rotina') && !assinante ? <View style={{ marginLeft: px(12) }}><SeloPlano onPress={() => exigir('rotina', () => undefined)} /></View> : null}
        </View>
      </Cartao>
      </AlvoTour>

      {tarefas.map((ta) => (
        <Cartao key={ta.id} style={{ marginTop: px(31) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: px(110.5), height: px(110.5), borderRadius: px(31), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: px(69), lineHeight: px(83) }}>{emojiDaTarefa(ta.icone)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: px(24) }}>
              <Text style={{ fontSize: px(30.5), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }} numberOfLines={2}>{ta.titulo}</Text>
              <Text style={{ marginTop: px(7), fontSize: px(25), fontWeight: '800', color: C.slate2 }}>{[ta.horario || t('noTime'), ta.duracaoMin ? `${ta.duracaoMin} min` : ''].filter(Boolean).join(' • ')}</Text>
            </View>
            <Toque onPress={() => abrir({ nome: 'editarTarefa', tarefaId: ta.id })} rotulo={t('edit')} style={{ width: px(74.5), height: px(74.5), borderRadius: px(24), backgroundColor: '#EFF6FF', borderWidth: px(2), borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' }}>
              <Icone n="edit-2" size={px(29)} color={C.blue} />
            </Toque>
            <Toque onPress={() => mudar((s) => A.excluirTarefa(s, ta.id))} rotulo={t('delete')} style={{ width: px(74.5), height: px(74.5), borderRadius: px(24), backgroundColor: '#FFF1F2', borderWidth: px(2), borderColor: '#FECDD3', alignItems: 'center', justifyContent: 'center', marginLeft: px(14.5) }}>
              <Icone n="trash-2" size={px(29)} color={C.red} />
            </Toque>
          </View>
          <View style={{ flexDirection: 'row', marginTop: px(24) }}>
            {L.map((l, d) => {
              const on = ta.dias.includes(d);
              return (
                <View key={d} style={{ width: px(62.5), height: px(62.5), borderRadius: px(31), marginRight: px(9.5), backgroundColor: on ? C.blue : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: px(23.5), fontWeight: '900', color: on ? C.white : C.slate }}>{l}</Text>
                </View>
              );
            })}
          </View>
        </Cartao>
      ))}

      {!assinante ? <Text style={{ marginTop: px(24), textAlign: 'center', fontSize: px(20), fontWeight: '800', color: C.slate2 }}>{tx(idioma, 'tasksFreeCount', { a: nTarefas, b: limites.tarefasPorRotina })}</Text> : null}
      <AlvoTour id="r_adicionar">
      <Pressable onPress={() => exigir('tarefa', () => abrir({ nome: 'editarTarefa', abaId: aba.id }), aba.id)} accessibilityRole="button" style={{ marginTop: px(31), height: px(125), borderRadius: px(62.5), borderWidth: px(3.5), borderStyle: 'dashed', borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Icone n="plus" size={px(36)} color={C.slate2} />
        <Text style={{ marginLeft: px(17), fontSize: px(30.5), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{t('addSpecificTask')}</Text>
      </Pressable>
      </AlvoTour>

      <Pressable onPress={() => mudar((s) => A.resetarRotinaHoje(s, aba.id))} style={{ marginTop: px(26.5), alignSelf: 'center', padding: px(12) }}>
        <Text style={{ color: C.slate, fontWeight: '800', fontSize: px(20.5), textDecorationLine: 'underline' }}>{t('resetRoutine')}</Text>
      </Pressable>
    </Rolagem>
  );
}

// RELATÓRIOS: a aba usa o relatório unificado (Rotina + Voz) — ver RelatorioCompleto.tsx

// ------------------------------------------------------------------ OPÇÕES

const Contador = ({ valor, onMenos, onMais, grande }: { valor: number | string; onMenos: () => void; onMais: () => void; grande?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
    <Toque onPress={onMenos} rotulo="menos" style={{ width: grande ? 70 : 48, height: grande ? 70 : 48, borderRadius: grande ? 20 : 16, borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: grande ? 34 : 24, fontWeight: '900', color: C.ink }}>-</Text>
    </Toque>
    <Text style={{ fontSize: grande ? 50 : 24, fontWeight: '900', color: C.ink, minWidth: grande ? 130 : 64, textAlign: 'center' }}>{valor}</Text>
    <Toque onPress={onMais} rotulo="mais" style={{ width: grande ? 70 : 48, height: grande ? 70 : 48, borderRadius: grande ? 20 : 16, borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: grande ? 34 : 24, fontWeight: '900', color: C.ink }}>+</Text>
    </Toque>
  </View>
);

function AbaOpcoes() {
  const { estado, t, mudar, abrir, exigir, idioma } = useRotina();
  const c = estado.config;
  const set = (x: Partial<typeof c>) => mudar((s) => A.mudarConfig(s, x));
  return (
    <Rolagem>
      <Secao titulo={t('economyAwards')} style={{ marginTop: px(7) }} />
      <AlvoTour id="r_saldo"><Cartao style={{ padding: px(29) }}>
        <T s="h3" style={{ fontSize: px(30.5) }}>{t('childBalance')}</T>
        <T s="cap" style={{ marginTop: px(21.5), fontSize: px(19.5), color: C.slate2 }}>{t('giveTakeStars')}</T>
        <View style={{ backgroundColor: C.bg, borderRadius: px(48), paddingVertical: px(31), marginTop: px(21.5) }}>
          <Contador grande valor={estado.estrelas} onMenos={() => mudar((s) => A.ajustarEstrelas(s, -1))} onMais={() => mudar((s) => A.ajustarEstrelas(s, 1))} />
        </View>
      </Cartao></AlvoTour>
      <View style={{ height: px(29) }} />
      <GrupoOpcoes>
        {/* v14.2: prêmios, metas e conquistas ficam juntos em "Conquistas e prêmios" (botão destacado nos Ajustes) */}
        <LinhaOpcao icone={{ f: 'feather', n: 'award' }} cor="#B45309" fundo="#FEF3C7" titulo={tx(idioma, 'cpTitulo')} legenda={tx(idioma, 'cpDesc')} onPress={() => abrir({ nome: 'v14', tela: 'conquistas' })} />
        <Divisor />
        <LinhaOpcao icone={{ f: 'mci', n: 'account-voice' }} cor="#EA580C" fundo="#FFEDD5" titulo={t('speechRewards')} legenda={t('speechRewardsDesc')} direita={<Interruptor valor={c.premiarFala} onChange={(v) => set({ premiarFala: v })} />} />
        {c.premiarFala ? (
          <View style={{ paddingHorizontal: px(21.5), paddingBottom: px(21.5) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(5) }}>
              <T s="cap" style={{ color: C.slate2 }}>{t('dailyLimit')}</T>
              <Contador valor={c.limiteFalaDia} onMenos={() => set({ limiteFalaDia: Math.max(1, c.limiteFalaDia - 1) })} onMais={() => set({ limiteFalaDia: Math.min(50, c.limiteFalaDia + 1) })} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(14.5) }}>
              <T s="cap" style={{ color: C.slate2 }}>{t('interval')}</T>
              <Contador valor={c.intervaloFalaSeg} onMenos={() => set({ intervaloFalaSeg: Math.max(0, c.intervaloFalaSeg - 5) })} onMais={() => set({ intervaloFalaSeg: Math.min(300, c.intervaloFalaSeg + 5) })} />
            </View>
          </View>
        ) : null}
        <Divisor />
        <View style={{ paddingHorizontal: px(21.5), paddingVertical: px(19), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <CaixaIcone icone={{ f: 'mci', n: 'flag-checkered' }} cor="#1D4ED8" fundo="#DBEAFE" tam={px(69.5)} raio={px(21.5)} />
            <T s="h3" style={{ marginLeft: px(21.5), fontSize: px(25), flex: 1 }}>{t('routineBonus')}</T>
          </View>
          <Contador valor={c.bonusRotina} onMenos={() => set({ bonusRotina: Math.max(0, c.bonusRotina - 1) })} onMais={() => set({ bonusRotina: Math.min(20, c.bonusRotina + 1) })} />
        </View>
      </GrupoOpcoes>

      <Secao titulo={t('visualFocus')} />
      <GrupoOpcoes>
        <LinhaOpcao icone={{ f: 'feather', n: 'grid' }} cor="#059669" fundo="#D1FAE5" titulo={t('manageTabs')} onPress={() => abrir({ nome: 'gerenciarAbas' })} />
        <LinhaOpcao icone={{ f: 'feather', n: 'layout' }} cor="#7C3AED" fundo="#F3E8FF" titulo={t('showOnHome')} legenda={t('showOnHomeDesc')} direita={<Interruptor valor={c.mostrarNaHome} onChange={(v) => set({ mostrarNaHome: v })} />} />
        <Divisor />
        <LinhaOpcao icone={{ f: 'feather', n: 'volume-2' }} cor="#0891B2" fundo="#CFFAFE" titulo={t('speakTask')} legenda={t('speakTaskDesc')} direita={<Interruptor valor={c.falarTarefa} onChange={(v) => set({ falarTarefa: v })} />} />
      </GrupoOpcoes>

      <Secao titulo={tx(idioma, 'characterTitle')} />
      <GrupoOpcoes>
        <View style={{ flexDirection: 'row', padding: px(21.5) }}>
          {(['menino', 'menina'] as const).map((k) => {
            const on = (c.personagem || 'menino') === k;
            return (
              <Pressable key={k} onPress={() => set({ personagem: k })} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={tx(idioma, k === 'menino' ? 'boy' : 'girl')}
                style={{ flex: 1, height: px(96), marginRight: k === 'menino' ? px(16) : 0, borderRadius: px(30), borderWidth: px(3), borderColor: on ? C.blue : C.line2, backgroundColor: on ? '#EFF6FF' : C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: px(44) }}>{k === 'menino' ? '👦' : '👧'}</Text>
                <Text style={{ marginLeft: px(10), fontSize: px(24), fontWeight: '900', color: on ? C.blue : C.slate2, textTransform: 'uppercase' }}>{tx(idioma, k === 'menino' ? 'boy' : 'girl')}</Text>
              </Pressable>
            );
          })}
        </View>
        <Divisor />
        <View style={{ padding: px(21.5) }}>
          <Text style={{ fontSize: px(21), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{tx(idioma, 'childName')}</Text>
          <TextInput value={c.nomeCrianca || ''} onChangeText={(v) => set({ nomeCrianca: v.slice(0, 40) })} placeholder={tx(idioma, 'childNamePh')} placeholderTextColor={C.faint} accessibilityLabel={tx(idioma, 'childName')}
            style={{ marginTop: px(12), height: px(84), borderRadius: px(28), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.bg, paddingHorizontal: px(22), fontSize: px(26), color: C.ink }} />
        </View>
      </GrupoOpcoes>

      <Secao titulo={tx(idioma, 'premRegra')} />
      <AlvoTour id="r_premios">
      <GrupoOpcoes>
        <Text style={{ paddingHorizontal: px(21.5), paddingTop: px(16), fontSize: px(20), fontWeight: '700', color: C.slate }}>{tx(idioma, 'premRegraSub')}</Text>
        {(['imediato', 'espera', 'intervalo'] as const).map((m) => {
          const on = (c.premioModo || 'imediato') === m;
          const n = c.premioMin || 5;
          const tit = tx(idioma, m === 'imediato' ? 'premImediato' : m === 'espera' ? 'premEspera' : 'premIntervalo');
          return (
            <Pressable key={m} onPress={() => set({ premioModo: m })} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={tit}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: px(21.5), paddingVertical: px(16) }}>
              <View style={{ width: px(40), height: px(40), borderRadius: px(20), borderWidth: px(3), borderColor: on ? C.blue : C.line2, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <View style={{ width: px(20), height: px(20), borderRadius: px(10), backgroundColor: C.blue }} /> : null}
              </View>
              <View style={{ marginLeft: px(18), flex: 1 }}>
                <Text style={{ fontSize: px(23), fontWeight: '900', color: C.ink }}>{tit}</Text>
                <Text style={{ fontSize: px(19), fontWeight: '600', color: C.slate, marginTop: px(2) }}>{tx(idioma, m === 'imediato' ? 'premImediatoDesc' : m === 'espera' ? 'premEsperaDesc' : 'premIntervaloDesc', { n })}</Text>
              </View>
            </Pressable>
          );
        })}
        {(c.premioModo || 'imediato') !== 'imediato' ? (
          <View style={{ paddingHorizontal: px(21.5), paddingVertical: px(16), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T s="h3" style={{ fontSize: px(23.5) }}>{tx(idioma, 'premMinutos')}</T>
            <Contador valor={`${c.premioMin || 5} min`} onMenos={() => set({ premioMin: Math.max(1, (c.premioMin || 5) - ((c.premioMin || 5) > 10 ? 5 : 1)) })} onMais={() => set({ premioMin: Math.min(120, (c.premioMin || 5) + ((c.premioMin || 5) >= 10 ? 5 : 1)) })} />
          </View>
        ) : null}
      </GrupoOpcoes>
      </AlvoTour>

      <Secao titulo={t('rulesSafety')} />
      <GrupoOpcoes>
        <LinhaOpcao icone={{ f: 'feather', n: 'lock' }} cor="#D97706" fundo="#FEF3C7" titulo={t('timeLock')} legenda={t('exactTime')} direita={<Interruptor valor={c.travarHorario} onChange={(v) => set({ travarHorario: v })} />} />
        <Divisor />
        <LinhaOpcao icone={{ f: 'feather', n: c.sonsSuaves ? 'volume-x' : 'volume-1' }} cor={C.blue} fundo="#DBEAFE" titulo={t('appSounds')} legenda={t('appSoundsDesc')} direita={<Interruptor valor={c.sonsSuaves} onChange={(v) => set({ sonsSuaves: v })} />} />
        <Divisor />
        <View style={{ paddingHorizontal: px(21.5), paddingVertical: px(19), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <CaixaIcone icone={{ f: 'feather', n: 'clock' }} cor="#0F766E" fundo="#CCFBF1" tam={px(69.5)} raio={px(21.5)} />
            <T s="h3" style={{ marginLeft: px(21.5), fontSize: px(23.5), flex: 1 }}>{t('minSeconds')}</T>
          </View>
          <Contador valor={`${c.minimoSemTimerSeg}s`} onMenos={() => set({ minimoSemTimerSeg: Math.max(0, c.minimoSemTimerSeg - 5) })} onMais={() => set({ minimoSemTimerSeg: Math.min(600, c.minimoSemTimerSeg + 5) })} />
        </View>
        <Divisor />
        <View style={{ paddingHorizontal: px(21.5), paddingVertical: px(19), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <CaixaIcone icone={{ f: 'feather', n: 'shield' }} cor="#7C3AED" fundo="#EDE9FE" tam={px(69.5)} raio={px(21.5)} />
            <T s="h3" style={{ marginLeft: px(21.5), fontSize: px(23.5), flex: 1 }}>{t('holdTime')}</T>
          </View>
          <Contador valor={`${c.segurarAdultoSeg ?? 3}s`} onMenos={() => set({ segurarAdultoSeg: Math.max(2, (c.segurarAdultoSeg ?? 3) - 1) })} onMais={() => set({ segurarAdultoSeg: Math.min(10, (c.segurarAdultoSeg ?? 3) + 1) })} />
        </View>
      </GrupoOpcoes>
    </Rolagem>
  );
}
