// RELATÓRIO GERAL para profissionais (fica em Ajustes e Opções do Voz — área dos pais).
// Períodos 7 d … 12 meses · por profissional (Geral, Fono, TO, Psicologia/ABA, Escola) · resumo, atenção, tendência e projeção.
// WhatsApp (texto), PDF (HTML) e anotações dos pais. Versão gratuita: resumo dos últimos 7 dias.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRotina } from '../estado';
import { linkSeguro } from '../logica/plano';
import { AlvoTour } from '../tour';
import * as A from '../logica/acoes';
import { IdPeriodo, janela, lerPeriodoLivre, PERIODOS, periodoLivre, Ponto, pontos } from '../logica/relatorioGeral';
import { somarDias } from '../logica/tempo';
import { gerarRelatorio, Item, relatorioHtml, relatorioTexto, Secao, TEXTOS_RELATORIO } from '../logica/profissional';
import { Botao, C, Cabecalho, Cartao, Icone, px, Rolagem } from '../componentes/ui';
import { SeloPlano } from '../componentes/Extras';
import { pad } from '../logica/tempo';

function Grafico({ dados, campo, cor, unidade, titulo }: { dados: Ponto[]; campo: 'palavras' | 'tarefas' | 'minutosUso'; cor: string; unidade: string; titulo: string }) {
  const max = Math.max(1, ...dados.map((d) => d[campo]));
  const passo = Math.ceil(dados.length / 8);
  return (
    <Cartao style={{ marginTop: px(20), padding: px(26), borderRadius: px(44) }}>
      <Text style={{ fontSize: px(22), fontWeight: '900', color: C.ink }}>{titulo}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: px(230), marginTop: px(16) }}>
        {dados.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            {d[campo] > 0 && dados.length <= 16 ? <Text style={{ fontSize: px(15), fontWeight: '900', color: cor, marginBottom: px(4) }}>{d[campo]}</Text> : null}
            <View style={{ width: '62%', height: `${Math.max(2, (d[campo] / max) * 88)}%`, backgroundColor: d[campo] ? cor : '#E2E8F0', borderRadius: px(8) }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: px(8) }}>
        {dados.map((d, i) => <Text key={i} numberOfLines={1} style={{ flex: 1, fontSize: px(14), fontWeight: '800', color: C.faint, textAlign: 'center' }}>{i % passo === 0 ? d.rotulo : ''}</Text>)}
      </View>
      <Text style={{ fontSize: px(16), fontWeight: '800', color: C.slate, marginTop: px(6), textAlign: 'right' }}>{unidade}</Text>
    </Cartao>
  );
}

const Delta = ({ i }: { i: Item }) => {
  if (i.delta === undefined) return null;
  const bom = i.subirBom === undefined || i.delta === 0 ? undefined : (i.delta > 0) === i.subirBom;
  const fundo = bom === undefined ? '#F1F5F9' : bom ? '#DCFCE7' : '#FFE4E6';
  const cor = bom === undefined ? C.slate2 : bom ? '#15803D' : '#BE123C';
  return (
    <View style={{ marginLeft: px(10), backgroundColor: fundo, borderRadius: px(16), paddingHorizontal: px(10), height: px(34), justifyContent: 'center' }}>
      <Text style={{ fontSize: px(16), fontWeight: '900', color: cor }}>{i.delta > 0 ? '↑' : i.delta < 0 ? '↓' : '='} {Math.abs(i.delta)}%</Text>
    </View>
  );
};

function CartaoSecao({ s, idioma }: { s: Secao; idioma: 'pt' | 'en' | 'es' }) {
  const L = TEXTOS_RELATORIO[idioma];
  return (
    <Cartao style={{ marginTop: px(24), padding: px(26), borderRadius: px(44) }}>
      <Text style={{ fontSize: px(27), fontWeight: '900', color: C.ink }}>{s.emoji} {s.titulo}</Text>
      {s.itens.map((i) => (
        <View key={i.rotulo} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: px(13), borderBottomWidth: px(1.5), borderColor: '#F1F5F9' }}>
          <Text style={{ flex: 1, fontSize: px(21), fontWeight: '700', color: C.slate2 }}>{i.rotulo}</Text>
          <Text style={{ fontSize: px(22), fontWeight: '900', color: C.ink, maxWidth: '55%', textAlign: 'right' }}>{i.valor}</Text>
          <Delta i={i} />
        </View>
      ))}
      {(s.listas || []).map((l) => (
        <View key={l.titulo} style={{ marginTop: px(14) }}>
          <Text style={{ fontSize: px(19), fontWeight: '900', color: C.slate, textTransform: 'uppercase' }}>{l.titulo}</Text>
          {l.linhas.map((x, k) => <Text key={k} style={{ fontSize: px(21), color: C.ink2, marginTop: px(4) }}>• {x}</Text>)}
        </View>
      ))}
      {s.tendencia ? (
        <View style={{ marginTop: px(16), backgroundColor: '#EEF2FF', borderRadius: px(26), padding: px(16), flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: px(32) }}>{s.tendencia.direcao === 'sobe' ? '📈' : s.tendencia.direcao === 'cai' ? '📉' : s.tendencia.direcao === 'estavel' ? '➡️' : '⏳'}</Text>
          <Text style={{ flex: 1, marginLeft: px(12), fontSize: px(19), fontWeight: '800', color: '#3730A3' }}>
            {L.tendencia}: {L[s.tendencia.direcao]}{s.tendencia.pct !== undefined && s.tendencia.direcao !== 'sem' ? ` (${s.tendencia.pct > 0 ? '+' : ''}${s.tendencia.pct}%)` : ''}
            {s.tendencia.direcao !== 'sem' ? `\n${L.projecao}: ~${s.tendencia.projecao}${s.tendencia.unidade ? ` ${s.tendencia.unidade}` : ''}` : ''}
          </Text>
        </View>
      ) : null}
    </Cartao>
  );
}

export function RelatorioGeral() {
  const { estado, voltar, idioma, agora, abrirLink, compartilhar, imprimir, pode, exigir, mudar, abrir, recurso } = useRotina();
  const completo = pode('relatorio');
  const [id, setId] = useState<IdPeriodo>(completo ? '30d' : '7d');
  const [escolhendo, setEscolhendo] = useState(false);
  const [nota, setNota] = useState('');
  const hoje = new Date(agora);
  const minuto = Math.floor(agora / 60000);
  const rel = useMemo(() => gerarRelatorio(estado, completo ? id : '7d', 'geral', idioma, new Date(agora), { limitado: !completo, evolucao: recurso('relatorioEvolucao') }), [estado, id, idioma, completo, minuto, recurso]); // eslint-disable-line react-hooks/exhaustive-deps
  const j = useMemo(() => janela(completo ? id : '7d', hoje, idioma), [id, idioma, completo, minuto]); // eslint-disable-line react-hooks/exhaustive-deps
  const pts = useMemo(() => pontos(estado, j), [estado, j]);
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt);
  const LR = TEXTOS_RELATORIO[idioma];
  const porFaixa = j.tipoFaixa === 'dia' ? L('por dia', 'per day', 'por día') : j.tipoFaixa === 'semana' ? L('por semana', 'per week', 'por semana') : L('por mês', 'per month', 'por mes');
  const texto = () => relatorioTexto(rel);
  const mostrarGraf = (sid: string) => rel.secoes.some((s) => s.id === sid);

  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Voz Amiga + Rotina Amiga" titulo={L('Relatório geral', 'Full report', 'Reporte general')} sub={L('Tudo num relatório só. Envie para quem acompanha a criança.', 'Everything in one report. Send it to whoever follows the child.', 'Todo en un solo reporte. Envíalo a quien acompaña al niño.')} corKicker="#4F46E5" onVoltar={voltar} />
      <View style={{ backgroundColor: C.white, borderBottomWidth: px(1.5), borderColor: '#E9EEF5' }}>
        <AlvoTour id="rel_periodos">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: px(24), paddingTop: px(16), paddingBottom: px(8) }}>
            {PERIODOS.filter((p) => !p.oculto).map((p) => {
              const on = (completo ? id : '7d') === p.id && !escolhendo;
              const travado = !completo && p.id !== '7d';
              return (
                <Pressable key={p.id} onPress={() => (travado ? exigir('relatorio', () => undefined) : (setEscolhendo(false), setId(p.id)))} accessibilityRole="tab" accessibilityLabel={p.rotulo[idioma]} accessibilityState={{ selected: on }}
                  style={{ paddingHorizontal: px(24), height: px(66), borderRadius: px(33), marginRight: px(12), justifyContent: 'center', backgroundColor: on ? '#4F46E5' : '#EEF2FF', borderWidth: px(2), borderColor: on ? '#3730A3' : '#E0E7FF', opacity: travado ? 0.55 : 1 }}>
                  <Text style={{ fontSize: px(21), fontWeight: '900', color: on ? C.white : '#4338CA' }}>{travado ? '👑 ' : ''}{p.rotulo[idioma]}</Text>
                </Pressable>
              );
            })}
            {/* datas livres: os pais escolhem o dia de início e o de fim (pode ser 1 dia ou voltar quanto quiser) */}
            <Pressable onPress={() => (completo ? (setEscolhendo(true), setId(id.startsWith('c:') ? id : periodoLivre(somarDias(hoje, -6), hoje, hoje))) : exigir('relatorio', () => undefined))}
              accessibilityRole="tab" accessibilityLabel={L('Escolher datas', 'Choose dates', 'Elegir fechas')} accessibilityState={{ selected: escolhendo || id.startsWith('c:') }}
              style={{ paddingHorizontal: px(24), height: px(66), borderRadius: px(33), marginRight: px(12), justifyContent: 'center', backgroundColor: escolhendo || id.startsWith('c:') ? '#4F46E5' : '#EEF2FF', borderWidth: px(2), borderColor: escolhendo || id.startsWith('c:') ? '#3730A3' : '#E0E7FF', opacity: completo ? 1 : 0.75 }}>
              <Text style={{ fontSize: px(21), fontWeight: '900', color: escolhendo || id.startsWith('c:') ? C.white : '#4338CA' }}>{completo ? '📅 ' : '👑 '}{L('Escolher datas', 'Choose dates', 'Elegir fechas')}</Text>
            </Pressable>
          </ScrollView>
        </AlvoTour>
        {completo && (escolhendo || id.startsWith('c:')) ? <EscolherDatas id={id} hoje={hoje} idioma={idioma} aoMudar={setId} /> : null}
        {/* v14.2: relatório ÚNICO (sem separar por profissional) — tudo junto, para qualquer pessoa que acompanha a criança */}
      </View>
      <Rolagem fundo={C.bgBlue} style={{ padding: px(26) }}>
        <AlvoTour id="rel_momento">
          <Botao titulo={L('Registrar momento (crise)', 'Record a moment (crisis)', 'Registrar momento (crisis)')} icone={{ f: 'mci', n: 'weather-lightning-rainy' }} cor="#EA580C" borda="#9A3412" alto={px(90)} style={{ marginBottom: px(20) }} onPress={() => abrir({ nome: 'crise' })} />
        </AlvoTour>
        {!completo ? (
          <Cartao style={{ padding: px(24), borderRadius: px(36), backgroundColor: '#FAF5FF', borderWidth: px(2), borderColor: '#E9D5FF' }}>
            <Text style={{ fontSize: px(21), fontWeight: '800', color: '#6B21A8' }}>{L('Versão gratuita: resumo dos últimos 7 dias. O relatório completo (todos os períodos, tendência, crises e PDF) é do Plano Completo.', 'Free version: last 7 days summary. The full report (all periods, trends, crises and PDF) is part of the Full Plan.', 'Versión gratuita: resumen de 7 días. El reporte completo (todos los períodos, tendencia, crisis y PDF) es del Plan Completo.')}</Text>
            <View style={{ marginTop: px(12) }}><SeloPlano onPress={() => exigir('relatorio', () => undefined)} /></View>
          </Cartao>
        ) : null}

        <Cartao style={{ marginTop: px(20), padding: px(26), borderRadius: px(44) }}>
          <Text style={{ fontSize: px(19), fontWeight: '900', color: C.slate, letterSpacing: px(1), textTransform: 'uppercase' }}>{LR.periodo}</Text>
          <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink, marginTop: px(4) }}>{rel.periodoTexto}</Text>
          {rel.crianca ? <Text style={{ fontSize: px(22), fontWeight: '800', color: C.slate2, marginTop: px(4) }}>👤 {rel.crianca}</Text> : null}
        </Cartao>

        <Cartao style={{ marginTop: px(20), padding: px(26), borderRadius: px(44), backgroundColor: '#ECFDF5', borderWidth: px(2), borderColor: '#A7F3D0' }}>
          <Text style={{ fontSize: px(26), fontWeight: '900', color: '#065F46' }}>✨ {LR.resumo}</Text>
          {rel.destaques.map((d, k) => <Text key={k} style={{ fontSize: px(22), color: '#064E3B', marginTop: px(8), lineHeight: px(31) }}>• {d}</Text>)}
        </Cartao>
        {rel.alertas.length ? (
          <Cartao style={{ marginTop: px(16), padding: px(26), borderRadius: px(44), backgroundColor: '#FFF7ED', borderWidth: px(2), borderColor: '#FED7AA' }}>
            <Text style={{ fontSize: px(26), fontWeight: '900', color: '#9A3412' }}>⚠️ {LR.atencao}</Text>
            {rel.alertas.map((d, k) => <Text key={k} style={{ fontSize: px(22), color: '#7C2D12', marginTop: px(8), lineHeight: px(31) }}>• {d}</Text>)}
          </Cartao>
        ) : null}

        {mostrarGraf('uso') ? <Grafico dados={pts} campo="minutosUso" cor="#4F46E5" unidade={L('minutos', 'minutes', 'minutos')} titulo={`${L('Minutos no app', 'Minutes in the app', 'Minutos en la app')} ${porFaixa}`} /> : null}
        {mostrarGraf('comunicacao') ? <Grafico dados={pts} campo="palavras" cor="#F97316" unidade={LR.pal} titulo={`${LR.palavras} ${porFaixa}`} /> : null}
        {mostrarGraf('rotina') ? <Grafico dados={pts} campo="tarefas" cor="#10B981" unidade={L('tarefas', 'tasks', 'tareas')} titulo={`${LR.tarefas} ${porFaixa}`} /> : null}

        {rel.secoes.map((s) => <CartaoSecao key={s.id} s={s} idioma={idioma} />)}

        {completo ? (
          <Cartao style={{ marginTop: px(24), padding: px(26), borderRadius: px(44) }}>
            <Text style={{ fontSize: px(27), fontWeight: '900', color: C.ink }}>📝 {LR.notas}</Text>
            {rel.notas.map((n) => <Text key={n.data + n.texto} style={{ fontSize: px(21), color: C.ink2, marginTop: px(8) }}>• {n.data}: {n.texto}</Text>)}
            <TextInput value={nota} onChangeText={setNota} maxLength={1000} placeholder={L('Escreva o que você percebeu hoje…', 'Write what you noticed today…', 'Escribe lo que notaste hoy…')} placeholderTextColor={C.faint} multiline accessibilityLabel={LR.notas}
              style={{ marginTop: px(14), minHeight: px(110), borderRadius: px(26), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.bg, padding: px(18), fontSize: px(22), color: C.ink, textAlignVertical: 'top' }} />
            <Botao titulo={L('Adicionar anotação', 'Add note', 'Agregar nota')} icone={{ f: 'feather', n: 'plus' }} contorno alto={px(80)} style={{ marginTop: px(12) }} disabled={!nota.trim()} onPress={() => { mudar((s) => A.adicionarNota(s, nota, Date.now())); setNota(''); }} />
          </Cartao>
        ) : null}

        <AlvoTour id="rel_whatsapp">
          <View>
            <Botao titulo={L('Enviar no WhatsApp', 'Send on WhatsApp', 'Enviar por WhatsApp')} icone={{ f: 'mci', n: 'whatsapp' }} cor="#25D366" corTexto={C.white} borda="#128C7E" alto={px(100)} style={{ marginTop: px(36) }}
              onPress={() => {
                // relatório muito grande (muitas notas) não cabe num link: abre o menu de compartilhar do celular (WhatsApp aparece lá)
                const url = `https://wa.me/?text=${encodeURIComponent(texto())}`;
                if (linkSeguro(url)) abrirLink(url); else compartilhar(texto());
              }} />
            <Botao titulo={L('Gerar PDF', 'Create PDF', 'Generar PDF')} icone={{ f: 'feather', n: 'file-text' }} cor="#DC2626" borda="#991B1B" alto={px(96)} style={{ marginTop: px(14) }}
              onPress={() => (completo ? imprimir(relatorioHtml(rel), texto()) : exigir('relatorio', () => undefined))} />
          </View>
        </AlvoTour>
        <Botao titulo={L('Compartilhar de outro jeito', 'Share another way', 'Compartir de otra forma')} icone={{ f: 'feather', n: 'share-2' }} contorno alto={px(88)} style={{ marginTop: px(14) }} onPress={() => compartilhar(texto())} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: px(16) }}>
          <Icone n="lock" size={px(20)} color={C.slate} />
          <Text style={{ marginLeft: px(8), fontSize: px(17), color: C.slate, textAlign: 'center', flex: 1 }}>{L('Os dados ficam no celular. Só os pais escolhem o que enviar.', 'Data stays on the phone. Only parents choose what to send.', 'Los datos quedan en el celular. Solo los padres eligen qué enviar.')} {`${pad(hoje.getHours())}:${pad(hoje.getMinutes())}`}</Text>
        </View>
      </Rolagem>
    </View>
  );
}

/** Dois seletores de data (início e fim) com botões de -1/+1 dia e -1/+1 mês. Sem teclado, sem erro de digitação. */
function EscolherDatas({ id, hoje, idioma, aoMudar }: { id: IdPeriodo; hoje: Date; idioma: 'pt' | 'en' | 'es'; aoMudar: (id: IdPeriodo) => void }) {
  const l = lerPeriodoLivre(id) || { ini: somarDias(hoje, -6), fim: hoje };
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const mudarData = (qual: 'ini' | 'fim', dias: number, meses = 0) => {
    const base = qual === 'ini' ? l.ini : l.fim;
    const nova = meses ? new Date(base.getFullYear(), base.getMonth() + meses, base.getDate()) : somarDias(base, dias);
    let ini = qual === 'ini' ? nova : l.ini;
    let fim = qual === 'fim' ? nova : l.fim;
    // início nunca passa do fim (e vice-versa): empurra o outro junto
    if (ini > fim) { if (qual === 'ini') fim = ini; else ini = fim; }
    aoMudar(periodoLivre(ini, fim, hoje));
  };
  const Linha = ({ qual, rotulo, data }: { qual: 'ini' | 'fim'; rotulo: string; data: Date }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(12) }}>
      <Text style={{ width: px(110), fontSize: px(20), fontWeight: '900', color: C.slate2 }}>{rotulo}</Text>
      {([['-1m', 0, -1], ['-1', -1, 0]] as const).map(([r, d, m]) => (
        <Pressable key={r} onPress={() => mudarData(qual, d, m)} accessibilityRole="button" accessibilityLabel={`${rotulo} ${r}`} style={{ width: px(70), height: px(60), borderRadius: px(18), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: px(6) }}>
          <Text style={{ fontSize: px(19), fontWeight: '900', color: '#4338CA' }}>{r === '-1m' ? '«' : '‹'}</Text>
        </Pressable>
      ))}
      <Text accessibilityLabel={`${rotulo} data`} style={{ flex: 1, textAlign: 'center', fontSize: px(24), fontWeight: '900', color: C.ink }}>{fmt(data)}</Text>
      {([['+1', 1, 0], ['+1m', 0, 1]] as const).map(([r, d, m]) => (
        <Pressable key={r} onPress={() => mudarData(qual, d, m)} accessibilityRole="button" accessibilityLabel={`${rotulo} ${r}`} style={{ width: px(70), height: px(60), borderRadius: px(18), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginLeft: px(6) }}>
          <Text style={{ fontSize: px(19), fontWeight: '900', color: '#4338CA' }}>{r === '+1m' ? '»' : '›'}</Text>
        </Pressable>
      ))}
    </View>
  );
  const dias = Math.round((l.fim.getTime() - l.ini.getTime()) / 86400000) + 1;
  return (
    <View style={{ paddingHorizontal: px(24), paddingBottom: px(16) }}>
      <Linha qual="ini" rotulo={L('De', 'From', 'Desde')} data={l.ini} />
      <Linha qual="fim" rotulo={L('Até', 'To', 'Hasta')} data={l.fim} />
      <Text style={{ marginTop: px(8), fontSize: px(18), fontWeight: '800', color: C.slate }}>{L(`${dias} dia(s) · ‹ › muda 1 dia · « » muda 1 mês`, `${dias} day(s) · ‹ › 1 day · « » 1 month`, `${dias} día(s) · ‹ › 1 día · « » 1 mes`)}</Text>
    </View>
  );
}
