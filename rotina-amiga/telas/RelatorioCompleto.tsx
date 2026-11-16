// RELATÓRIO COMPLETO — Rotina + Comunicação, por dia / semana / mês / ano.
import React, { useMemo, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { deslocar, intervalo, Periodo, resumo, serie, textoCompartilhar } from '../logica/relatorio';
import { duracaoCurta } from '../logica/tempo';
import { Botao, C, Cabecalho, CaixaIcone, Cartao, Icone, IconeDef, px, Rolagem, Toque } from '../componentes/ui';

const AZUL = '#2563EB';
const LARANJA = '#F97316';

/** Corpo do relatório unificado (usado na aba RELATÓRIOS dos ajustes do Rotina e na tela própria). */
export function CorpoRelatorio() {
  const { estado, t, idioma, agora } = useRotina();
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [ref, setRef] = useState(() => new Date(agora));
  const it = useMemo(() => intervalo(periodo, ref, idioma), [periodo, ref, idioma]);
  const r = useMemo(() => resumo(estado, it.inicio, it.fim), [estado, it]);
  const pontos = useMemo(() => serie(estado, it), [estado, it]);
  const max = Math.max(1, ...pontos.map((p) => Math.max(p.rotina, p.voz)));
  const futuro = it.fim > agora && deslocar(periodo, ref, 1).getTime() > agora;
  const vazio = r.tarefas + r.frases + r.pranchas + r.rotinas + r.ganhas + r.gastas === 0;

  const kpis: { rot: string; val: string; icone: IconeDef; cor: string; fundo: string }[] = [
    { rot: t('tasksDone'), val: String(r.tarefas), icone: { f: 'feather', n: 'check-circle' }, cor: '#059669', fundo: '#ECFDF5' },
    { rot: t('routinesDone'), val: String(r.rotinas), icone: { f: 'mci', n: 'flag-checkered' }, cor: '#1D4ED8', fundo: '#DBEAFE' },
    { rot: t('timeInTasks'), val: duracaoCurta(r.segundos), icone: { f: 'feather', n: 'clock' }, cor: '#EA580C', fundo: '#FFF7ED' },
    { rot: t('phrasesSpoken'), val: String(r.frases), icone: { f: 'mci', n: 'account-voice' }, cor: '#C2410C', fundo: '#FFEDD5' },
    { rot: t('boardsTapped'), val: String(r.pranchas), icone: { f: 'feather', n: 'grid' }, cor: '#0E7490', fundo: '#CFFAFE' },
    { rot: t('newWords'), val: String(r.palavrasNovas), icone: { f: 'mci', n: 'star-four-points-outline' }, cor: '#7C3AED', fundo: '#F3E8FF' },
    { rot: t('starsEarned'), val: `+${r.ganhas}`, icone: { f: 'mci', n: 'star-four-points' }, cor: '#B45309', fundo: '#FEF3C7' },
    { rot: t('starsSpent'), val: `-${r.gastas}`, icone: { f: 'feather', n: 'gift' }, cor: '#BE185D', fundo: '#FCE7F3' },
  ];

  return (
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        <View style={[{ backgroundColor: '#FACC15', borderRadius: px(40), borderWidth: px(3), borderColor: '#FDE047', padding: px(26), flexDirection: 'row', alignItems: 'center', marginBottom: px(26) }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: px(26), fontWeight: '900', color: '#78350F', textTransform: 'uppercase' }}>{t('balance')}</Text>
            <Text style={{ fontSize: px(18), fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>{t('fullReportSub')}</Text>
          </View>
          <Icone f="mci" n="star-four-points" size={px(44)} color="#7C2D12" />
          <Text style={{ fontSize: px(50), fontWeight: '900', color: '#422006', marginLeft: px(10) }}>{estado.estrelas}</Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: px(32), padding: px(8) }}>
          {(['dia', 'semana', 'mes', 'ano'] as Periodo[]).map((p) => (
            <Pressable key={p} onPress={() => { setPeriodo(p); setRef(new Date(agora)); }} style={{ flex: 1, height: px(84), borderRadius: px(26), alignItems: 'center', justifyContent: 'center', backgroundColor: periodo === p ? C.white : 'transparent' }}>
              <Text style={{ fontSize: px(24), fontWeight: '900', color: periodo === p ? '#1D4ED8' : C.slate2, textTransform: 'uppercase' }}>{t(p === 'dia' ? 'period_day' : p === 'semana' ? 'period_week' : p === 'mes' ? 'period_month' : 'period_year')}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(26) }}>
          <Toque onPress={() => setRef(deslocar(periodo, ref, -1))} rotulo="anterior" style={{ width: px(86), height: px(86), borderRadius: px(28), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icone n="chevron-left" size={px(40)} color={C.ink} />
          </Toque>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: px(30), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }} numberOfLines={1} adjustsFontSizeToFit>{it.titulo}</Text>
          <Toque onPress={() => !futuro && setRef(deslocar(periodo, ref, 1))} rotulo="próximo" style={{ width: px(86), height: px(86), borderRadius: px(28), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', opacity: futuro ? 0.35 : 1 }}>
            <Icone n="chevron-right" size={px(40)} color={C.ink} />
          </Toque>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {kpis.map((k) => (
            <Cartao key={k.rot} style={{ width: '48.4%', marginTop: px(24), padding: px(28), borderRadius: px(44) }}>
              <CaixaIcone icone={k.icone} cor={k.cor} fundo={k.fundo} tam={px(76)} raio={px(24)} />
              <Text style={{ marginTop: px(18), fontSize: px(46), fontWeight: '900', color: C.ink }}>{k.val}</Text>
              <Text style={{ marginTop: px(4), fontSize: px(19), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }} numberOfLines={2}>{k.rot}</Text>
            </Cartao>
          ))}
        </View>

        <Cartao style={{ marginTop: px(30), padding: px(32), borderRadius: px(48) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CaixaIcone icone={{ f: 'feather', n: 'bar-chart-2' }} cor={AZUL} fundo="#EFF6FF" tam={px(76)} raio={px(24)} />
            <Text style={{ marginLeft: px(22), fontSize: px(30), fontWeight: '900', color: C.ink, textTransform: 'uppercase', flex: 1 }}>{t('reportsTitle')}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: px(22) }}>
            {[{ c: AZUL, r: `${t('routineSeries')} · ${t('tasksDone')}` }, { c: LARANJA, r: `${t('voiceSeries')} · ${t('phrasesSpoken')}` }].map((l) => (
              <View key={l.r} style={{ flexDirection: 'row', alignItems: 'center', marginRight: px(24), flexShrink: 1 }}>
                <View style={{ width: px(22), height: px(22), borderRadius: px(6), backgroundColor: l.c }} />
                <Text style={{ marginLeft: px(10), fontSize: px(19), fontWeight: '800', color: C.slate2 }} numberOfLines={1}>{l.r}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', height: px(360), marginTop: px(26), alignItems: 'flex-end' }}>
            {pontos.map((p) => (
              <View key={p.rotulo} style={{ flex: 1, alignItems: 'center', height: '100%' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
                  <View style={{ width: px(periodo === 'ano' ? 14 : 22), height: `${(p.rotina / max) * 100}%`, minHeight: px(6), backgroundColor: p.rotina ? AZUL : '#DBEAFE', borderRadius: px(8), marginRight: px(4) }} />
                  <View style={{ width: px(periodo === 'ano' ? 14 : 22), height: `${(p.voz / max) * 100}%`, minHeight: px(6), backgroundColor: p.voz ? LARANJA : '#FFEDD5', borderRadius: px(8) }} />
                </View>
                <Text style={{ marginTop: px(12), fontSize: px(periodo === 'ano' ? 15 : 17), fontWeight: '800', color: C.faint }} numberOfLines={1}>{p.rotulo}</Text>
              </View>
            ))}
          </View>
        </Cartao>

        {vazio ? (
          <Cartao style={{ marginTop: px(30), padding: px(36), borderRadius: px(48), alignItems: 'center' }}>
            <Text style={{ fontSize: px(70) }}>🌱</Text>
            <Text style={{ fontSize: px(24), fontWeight: '800', color: C.slate2, textAlign: 'center', marginTop: px(12) }}>{t('noDataPeriod')}</Text>
          </Cartao>
        ) : null}

        {r.topPalavras.length ? (
          <Cartao style={{ marginTop: px(30), padding: px(32), borderRadius: px(48) }}>
            <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }}>{t('topWords')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(18) }}>
              {r.topPalavras.map((w) => (
                <View key={w.palavra} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', borderWidth: px(2), borderColor: '#FED7AA', borderRadius: px(30), paddingHorizontal: px(20), height: px(60), marginRight: px(14), marginBottom: px(14) }}>
                  <Text style={{ fontSize: px(23), fontWeight: '900', color: '#9A3412' }}>{w.palavra}</Text>
                  <Text style={{ marginLeft: px(10), fontSize: px(20), fontWeight: '900', color: '#EA580C' }}>{w.n}</Text>
                </View>
              ))}
            </View>
          </Cartao>
        ) : null}

        {r.topTarefas.length ? (
          <Cartao style={{ marginTop: px(30), padding: px(32), borderRadius: px(48) }}>
            <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }}>{t('tasksRanking')}</Text>
            {r.topTarefas.map((x) => (
              <View key={x.tarefa} style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(18) }}>
                <Text style={{ width: px(260), fontSize: px(22), fontWeight: '800', color: C.ink2 }} numberOfLines={1}>{x.tarefa}</Text>
                <View style={{ flex: 1, height: px(22), borderRadius: px(11), backgroundColor: '#EFF6FF', overflow: 'hidden' }}>
                  <View style={{ width: `${(x.n / r.topTarefas[0].n) * 100}%`, height: '100%', backgroundColor: AZUL, borderRadius: px(11) }} />
                </View>
                <Text style={{ width: px(60), textAlign: 'right', fontSize: px(22), fontWeight: '900', color: AZUL }}>{x.n}</Text>
              </View>
            ))}
            {r.liberadas ? <Text style={{ marginTop: px(20), fontSize: px(20), fontWeight: '800', color: C.slate }}>{t('adultReleases')}: {r.liberadas}</Text> : null}
          </Cartao>
        ) : null}

        <Botao titulo={t('share')} icone={{ f: 'feather', n: 'share-2' }} cor="#4F46E5" borda="#3730A3" alto={px(100)} style={{ marginTop: px(36) }}
          onPress={() => { Share.share({ message: textoCompartilhar(estado, periodo, ref, idioma, t as (k: string) => string) }).catch(() => undefined); }} />
      </Rolagem>
  );
}

export function RelatorioCompleto() {
  const { t, voltar } = useRotina();
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker={t('fullReportSub')} titulo={t('fullReport')} corKicker="#4F46E5" onVoltar={voltar} />
      <CorpoRelatorio />
    </View>
  );
}
