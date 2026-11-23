// GERENCIAR ABAS / GERENCIAR LOJA / EDITAR RECOMPENSA / GERENCIAR METAS (área dos pais).
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import * as A from '../logica/acoes';
import { EMOJIS_PREMIO, ICONES_ABA } from '../padroes';
import { paletaDaAba, paletaDaCor, PALETAS } from '../paleta';
import { SeletorCor } from '../componentes/SeletorCor';
import { AbaRotina, Meta, Recompensa } from '../tipos';
import { Botao, C, Cabecalho, Campo, Cartao, Icone, Interruptor, px, Rolagem, sombra, T, Toque } from '../componentes/ui';

const nomePaleta = (cor: string, paletaId?: string) => {
  if (paletaId && PALETAS[paletaId] && PALETAS[paletaId].accent.toUpperCase() === cor.toUpperCase()) return paletaId.toUpperCase();
  const achada = Object.values(PALETAS).find((p) => p.accent.toUpperCase() === cor.toUpperCase());
  return achada ? achada.id.toUpperCase() : cor.toUpperCase();
};

const Lixeira = ({ onPress, rotulo }: { onPress: () => void; rotulo: string }) => (
  <Toque onPress={onPress} rotulo={rotulo} style={{ width: px(80), height: px(80), borderRadius: px(26), backgroundColor: '#FFF1F2', borderWidth: px(2), borderColor: '#FECDD3', alignItems: 'center', justifyContent: 'center' }}>
    <Icone n="trash-2" size={px(32)} color={C.red} />
  </Toque>
);

const Lapis = ({ onPress, rotulo }: { onPress: () => void; rotulo: string }) => (
  <Toque onPress={onPress} rotulo={rotulo} style={{ width: px(80), height: px(80), borderRadius: px(26), backgroundColor: '#EFF6FF', borderWidth: px(2), borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center', marginRight: px(18) }}>
    <Icone n="edit-2" size={px(30)} color={C.blue} />
  </Toque>
);

const Rotulo = ({ children, cor = C.blue }: { children: React.ReactNode; cor?: string }) => (
  <Text style={{ fontSize: px(22), fontWeight: '900', color: cor, letterSpacing: px(1.2), textTransform: 'uppercase', marginTop: px(40), marginBottom: px(20) }}>{children}</Text>
);

export function GerenciarAbas() {
  const { estado, t, voltar, mudar, exigir } = useRotina();
  const [editando, setEditando] = useState<string>();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#2563EB');
  const [icone, setIcone] = useState(ICONES_ABA[0]);
  const [chaveCor, setChaveCor] = useState(0);
  const p = paletaDaCor(cor);

  const editar = (a: AbaRotina) => { setEditando(a.id); setNome(a.nome); setCor(a.cor); setIcone(a.icone); setChaveCor((k) => k + 1); };
  const limpar = () => { setEditando(undefined); setNome(''); setCor('#2563EB'); setIcone(ICONES_ABA[0]); setChaveCor((k) => k + 1); };
  const criar = () => {
    if (!nome.trim()) return;
    if (!editando) return exigir('rotina', () => salvarNova());
    salvarNova();
  };
  const salvarNova = () => {
    const antiga = estado.abas.find((a) => a.id === editando);
    const pal = Object.values(PALETAS).find((x) => x.accent.toUpperCase() === cor.toUpperCase());
    mudar((s) => A.salvarAba(s, { id: editando || A.novoId('aba'), nome: nome.trim(), cor, icone, paletaId: pal?.id || (antiga?.cor === cor ? antiga?.paletaId : undefined) }));
    limpar();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker={t('options')} titulo={t('manageTabs')} sub={t('manageTabsSub')} onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        <Text style={{ fontSize: px(28), fontWeight: '900', color: C.ink, textTransform: 'uppercase', marginTop: px(20) }}>{t('currentTabs')}</Text>
        <Text style={{ fontSize: px(22), fontWeight: '500', color: C.slate2, marginTop: px(8) }}>{t('currentTabsSub')}</Text>
        {estado.abas.map((a) => {
          const pa = paletaDaAba(a);
          return (
            <Pressable key={a.id} onPress={() => editar(a)} style={[{ marginTop: px(26), borderRadius: px(56), borderWidth: px(3), borderLeftWidth: px(12), borderColor: pa.border, borderLeftColor: pa.accent, backgroundColor: pa.softAlt, paddingVertical: px(36), paddingLeft: px(26), paddingRight: px(36), flexDirection: 'row', alignItems: 'center' }, sombra(4, pa.accent, 0.12), editando === a.id ? { borderColor: pa.accentDark } : null]}>
              <View style={{ width: px(102), height: px(102), borderRadius: px(32), backgroundColor: pa.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icone f="mci" n={a.icone} size={px(42)} color={pa.onAccent} />
              </View>
              <View style={{ flex: 1, marginLeft: px(30) }}>
                <Text style={{ fontSize: px(29), fontWeight: '900', color: C.ink2, textTransform: 'uppercase' }} numberOfLines={1}>{a.nome}</Text>
                <Text style={{ fontSize: px(22), fontWeight: '900', color: pa.text, letterSpacing: px(1), marginTop: px(8) }}>{nomePaleta(a.cor, a.paletaId)}</Text>
              </View>
              <Lixeira rotulo={t('delete')} onPress={() => { mudar((s) => A.excluirAba(s, a.id)); if (editando === a.id) limpar(); }} />
            </Pressable>
          );
        })}

        <Cartao style={{ marginTop: px(32), padding: px(36), borderRadius: px(56) }}>
          <Text style={{ fontSize: px(28), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }}>{editando ? t('edit') : t('newTab')}</Text>
          <Text style={{ fontSize: px(22), fontWeight: '500', color: C.slate2, marginTop: px(8) }}>{t('newTabSub')}</Text>
          <Campo valor={nome} onChange={setNome} maxLength={60} placeholder={t('tabName')} style={{ marginTop: px(34), height: px(98), borderRadius: px(49), borderColor: '#BFDBFE', fontSize: px(30) }} />
          <Rotulo>{t('colorSel')}</Rotulo>
          <SeletorCor key={chaveCor} cor={cor} onChange={setCor} />
          <Rotulo>{t('iconSel')}</Rotulo>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ICONES_ABA.map((ic) => {
              const on = ic === icone;
              return (
                <Pressable key={ic} onPress={() => setIcone(ic)} accessibilityLabel={ic} style={{ width: px(92), height: px(92), borderRadius: px(28), marginRight: px(22), marginBottom: px(22), alignItems: 'center', justifyContent: 'center', borderWidth: px(3), borderColor: on ? p.accent : '#BFDBFE', backgroundColor: on ? p.accent : '#F8FAFC' }}>
                  <Icone f="mci" n={ic} size={px(38)} color={on ? p.onAccent : C.slate2} />
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: px(20), borderRadius: px(46), borderWidth: px(2), borderColor: '#E2E8F0', backgroundColor: C.bg, padding: px(30) }}>
            <Text style={{ fontSize: px(22), fontWeight: '900', color: C.slate2, letterSpacing: px(1.2), textTransform: 'uppercase' }}>{t('preview')}</Text>
            <View style={{ flexDirection: 'row', marginTop: px(20) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', height: px(98), paddingLeft: px(22), paddingRight: px(34), borderRadius: px(49), backgroundColor: p.accent, borderWidth: px(3), borderColor: p.accentDark }}>
                <View style={{ width: px(54), height: px(54), borderRadius: px(27), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icone f="mci" n={icone} size={px(30)} color={p.onAccent} />
                </View>
                <Text style={{ marginLeft: px(20), fontSize: px(24), fontWeight: '900', color: p.onAccent, letterSpacing: px(0.8), textTransform: 'uppercase' }}>{nome.trim() || t('newTabName')}</Text>
              </View>
            </View>
          </View>
          <Botao titulo={editando ? t('save') : t('create')} onPress={criar} disabled={!nome.trim()} cor={p.accent} corTexto={p.onAccent} alto={px(100)} style={{ marginTop: px(30) }} />
          {editando ? <Botao titulo={t('cancel')} onPress={limpar} contorno alto={px(90)} style={{ marginTop: px(16) }} /> : null}
        </Cartao>
      </Rolagem>
    </View>
  );
}

// ------------------------------------------------------------------ LOJA (pais)
const SELOS = {
  pt: { loja: '🏪 Na loja agora', fila: '⏸️ Esperando (no grátis é 1 por vez)', trocado: '✅ Já trocado (pode apagar)' },
  en: { loja: '🏪 In the shop now', fila: '⏸️ Waiting (free plan: 1 at a time)', trocado: '✅ Already redeemed (you can delete it)' },
  es: { loja: '🏪 En la tienda ahora', fila: '⏸️ Esperando (gratis: 1 a la vez)', trocado: '✅ Ya canjeado (puedes borrarlo)' },
};

export function GerenciarLoja() {
  const { estado, t, voltar, mudar, abrir, exigir, limites, idioma } = useRotina();
  // v2.0.7: no grátis mostra qual prêmio está na loja agora, quais esperam e quais já foram trocados
  const naLoja = new Set(A.premiosNaLoja(estado, limites.premios).map((r) => r.id));
  const selo = (r: { id: string; trocadoEm?: number }) => limites.premios >= 99 ? '' : r.trocadoEm ? SELOS[idioma].trocado : naLoja.has(r.id) ? SELOS[idioma].loja : SELOS[idioma].fila;
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker={t('options')} titulo={t('manageShop')} sub={t('shopSub')} corKicker="#9333EA" onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        {estado.recompensas.map((r) => (
          <Cartao key={r.id} style={{ marginTop: px(26), flexDirection: 'row', alignItems: 'center', padding: px(30), borderRadius: px(46) }}>
            <View style={{ width: px(100), height: px(100), borderRadius: px(30), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: px(56), lineHeight: px(68) }}>{r.icone}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: px(26) }}>
              <Text style={{ fontSize: px(28), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }} numberOfLines={2}>{r.titulo}</Text>
              {selo(r) ? <Text accessibilityLabel={`situação ${r.titulo}`} style={{ marginTop: px(6), fontSize: px(21), fontWeight: '800', color: r.trocadoEm ? '#64748B' : naLoja.has(r.id) ? '#15803D' : '#B45309' }}>{selo(r)}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(10) }}>
                <Icone f="mci" n="star-four-points" size={px(26)} color={C.starDark} />
                <Text style={{ marginLeft: px(8), fontSize: px(24), fontWeight: '900', color: C.starDark }}>{r.custo}</Text>
                {r.esperaMin ? <Text style={{ marginLeft: px(18), fontSize: px(22), fontWeight: '900', color: '#0F766E' }}>⏳ {r.esperaMin} {t('minutes')}</Text> : null}
              </View>
            </View>
            <Lapis rotulo={t('edit')} onPress={() => abrir({ nome: 'editarRecompensa', recompensaId: r.id })} />
            <Lixeira rotulo={t('delete')} onPress={() => mudar((s) => A.excluirRecompensa(s, r.id))} />
          </Cartao>
        ))}
        <Pressable onPress={() => exigir('premio', () => abrir({ nome: 'editarRecompensa' }))} accessibilityRole="button" style={{ marginTop: px(34), height: px(104), borderRadius: px(52), borderWidth: px(3), borderStyle: 'dashed', borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Icone n="plus" size={px(34)} color={C.slate2} />
          <Text style={{ marginLeft: px(14), fontSize: px(26), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{t('newReward')}</Text>
        </Pressable>
      </Rolagem>
    </View>
  );
}

const Contador = ({ valor, onMenos, onMais }: { valor: number; onMenos: () => void; onMais: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Toque onPress={onMenos} rotulo="-" style={{ width: px(84), height: px(84), borderRadius: px(26), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: px(40), fontWeight: '900', color: C.ink }}>-</Text>
    </Toque>
    <Text style={{ minWidth: px(120), textAlign: 'center', fontSize: px(44), fontWeight: '900', color: C.ink }}>{valor}</Text>
    <Toque onPress={onMais} rotulo="+" style={{ width: px(84), height: px(84), borderRadius: px(26), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: px(40), fontWeight: '900', color: C.ink }}>+</Text>
    </Toque>
  </View>
);

export function EditarRecompensa({ recompensaId }: { recompensaId?: string }) {
  const { estado, t, voltar, mudar, pode, exigir } = useRotina();
  const orig = estado.recompensas.find((r) => r.id === recompensaId);
  const [f, setF] = useState<Recompensa>(() => orig || { id: A.novoId('r'), titulo: '', custo: 10, icone: '🎁', esperaMin: 0 });
  const set = (x: Partial<Recompensa>) => setF((o) => ({ ...o, ...x }));
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker={t('manageShop')} titulo={orig ? t('edit') : t('newReward')} corKicker="#9333EA" onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        <Cartao style={{ padding: px(36), borderRadius: px(46) }}>
          <Text style={{ fontSize: px(23), fontWeight: '900', color: C.slate2, letterSpacing: px(0.8), textTransform: 'uppercase', marginBottom: px(16) }}>{t('prizeName')}</Text>
          <Campo valor={f.titulo} onChange={(v) => set({ titulo: v })} maxLength={60} placeholder={t('prizeName')} style={{ height: px(100), borderRadius: px(50), fontSize: px(30) }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(34) }}>
            <Text style={{ fontSize: px(24), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{t('cost')} ★</Text>
            <Contador valor={f.custo} onMenos={() => set({ custo: Math.max(1, f.custo - 1) })} onMais={() => set({ custo: Math.min(999, f.custo + 1) })} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(26) }}>
            <Text style={{ fontSize: px(24), fontWeight: '900', color: C.slate2, textTransform: 'uppercase', flex: 1 }}>{t('rewardWaitTime')}</Text>
            <Contador valor={f.esperaMin} onMenos={() => set({ esperaMin: Math.max(0, f.esperaMin - 1) })} onMais={() => set({ esperaMin: Math.min(120, f.esperaMin + 1) })} />
          </View>
          <Text style={{ fontSize: px(23), fontWeight: '900', color: C.slate2, letterSpacing: px(0.8), textTransform: 'uppercase', marginTop: px(36), marginBottom: px(20) }}>{t('iconSel')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {EMOJIS_PREMIO.map((e, i) => {
              const on = e === f.icone;
              return (
                <Pressable key={e} onPress={() => set({ icone: e })} style={{ width: px(98), height: px(98), borderRadius: px(32), marginRight: i % 6 === 5 ? 0 : px(22), marginBottom: px(22), alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#F3E8FF' : C.bg, borderWidth: px(3), borderColor: on ? '#9333EA' : '#E2E8F0' }}>
                  <Text style={{ fontSize: px(52), lineHeight: px(64) }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </Cartao>
        <View style={{ flexDirection: 'row', marginTop: px(40) }}>
          <Botao titulo={t('save')} disabled={!f.titulo.trim()} onPress={() => {
            // SEGURANÇA: confere o limite do plano de novo na hora de salvar
            if (!estado.recompensas.some((x) => x.id === f.id) && !pode('premio')) { exigir('premio', () => undefined); return; }
            mudar((s) => A.salvarRecompensa(s, { ...f, titulo: f.titulo.trim() })); voltar();
          }} cor="#9333EA" borda="#6B21A8" alto={px(100)} style={{ flex: 1 }} />
          <View style={{ width: px(30) }} />
          <Botao titulo={t('close')} onPress={voltar} contorno alto={px(100)} style={{ flex: 1 }} />
        </View>
      </Rolagem>
    </View>
  );
}

// ------------------------------------------------------------------ METAS (pais)

export function GerenciarMetas() {
  const { estado, t, voltar, mudar } = useRotina();
  const set = (m: Meta, x: Partial<Meta>) => mudar((s) => A.salvarMeta(s, { ...m, ...x }));
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker={t('options')} titulo={t('manageGoals')} sub={t('goalsSub')} corKicker="#0284C7" onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        {estado.metas.map((m) => (
          <Cartao key={m.id} style={{ marginTop: px(26), padding: px(30), borderRadius: px(46), opacity: m.ativa ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: px(52) }}>{m.icone}</Text>
              <View style={{ flex: 1, marginLeft: px(20) }}>
                <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink }}>{m.titulo}</Text>
                <Text style={{ fontSize: px(20), fontWeight: '800', color: C.slate, textTransform: 'uppercase', marginTop: px(4) }}>{m.periodo === 'dia' ? t('perDay') : t('perWeek')}</Text>
              </View>
              <Interruptor valor={m.ativa} onChange={(v) => set(m, { ativa: v })} />
            </View>
            {m.ativa ? (
              <View style={{ marginTop: px(24) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <T s="cap" style={{ fontSize: px(22), color: C.slate2 }}>{t('target')}</T>
                  <Contador valor={m.alvo} onMenos={() => set(m, { alvo: Math.max(1, m.alvo - 1) })} onMais={() => set(m, { alvo: Math.min(500, m.alvo + 1) })} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(16) }}>
                  <T s="cap" style={{ fontSize: px(22), color: C.slate2 }}>{t('reward')} ★</T>
                  <Contador valor={m.premio} onMenos={() => set(m, { premio: Math.max(0, m.premio - 1) })} onMais={() => set(m, { premio: Math.min(100, m.premio + 1) })} />
                </View>
              </View>
            ) : null}
          </Cartao>
        ))}
      </Rolagem>
    </View>
  );
}
