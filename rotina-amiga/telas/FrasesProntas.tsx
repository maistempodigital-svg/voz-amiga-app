// AJUSTES DAS FRASES PRONTAS (só pais): liga/desliga, modo frase sempre ligado, ocultar, e — no Plano Completo — criar/editar/excluir.
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import * as A from '../logica/acoes';
import { CORES_FITZGERALD, FRASES_PADRAO, FrasePronta, frasesEmUso, GRUPOS, GrupoFrase, NOMES_CATEGORIA, palavrasDoTexto, POR_GRUPO_GRATIS, Categoria } from '../logica/frasesProntas';
import { tx } from '../textos2';
import { AlvoTour } from '../tour';
import { Botao, C, Cabecalho, Campo, Divisor, GrupoOpcoes, Interruptor, LinhaOpcao, px, Rolagem, Secao } from '../componentes/ui';
import { SeloPlano } from '../componentes/Extras';
import { PalavrasColoridas } from '../componentes/FrasesProntas';

export function FrasesProntasTela() {
  const { estado, idioma, voltar, mudar, pode, exigir, mostrarAviso, limites } = useRotina();
  const c = estado.config;
  const completo = limites.frasesPersonalizadas;
  const set = (x: Partial<typeof c>) => mudar((s) => A.mudarConfig(s, x));
  const ocultas = new Set(c.frasesOcultas || []);
  const lista = frasesEmUso(idioma, c.frasesLista, completo);
  const [texto, setTexto] = useState('');
  const [grupo, setGrupo] = useState<GrupoFrase>('pedir');
  const [editando, setEditando] = useState<string>();

  const base = (): FrasePronta[] => (c.frasesLista && c.frasesLista.length ? c.frasesLista : FRASES_PADRAO[idioma]);
  const alternarOculta = (id: string) => set({ frasesOcultas: ocultas.has(id) ? [...ocultas].filter((x) => x !== id) : [...ocultas, id] });
  const salvar = () => exigir('frases', () => {
    const palavras = palavrasDoTexto(texto);
    if (!palavras.length) return;
    const atual = base();
    const nova = editando
      ? atual.map((f) => (f.id === editando ? { ...f, grupo, palavras } : f))
      : [...atual, { id: `p${Date.now().toString(36)}`, grupo, palavras }];
    set({ frasesLista: nova });
    setTexto(''); setEditando(undefined);
    mostrarAviso(`✓ ${tx(idioma, 'saved')}`);
  });
  const excluir = (id: string) => exigir('frases', () => set({ frasesLista: base().filter((f) => f.id !== id), frasesOcultas: [...ocultas].filter((x) => x !== id) }));
  const editar = (f: FrasePronta) => exigir('frases', () => { setTexto(f.palavras.join(' ')); setGrupo(f.grupo); setEditando(f.id); });

  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Voz Amiga" titulo={tx(idioma, 'fpTitle')} sub={tx(idioma, 'fpSub')} onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue}>
        <AlvoTour id="fp_opcoes">
          <GrupoOpcoes>
            <LinhaOpcao icone={{ f: 'feather', n: 'message-square' }} cor="#2563EB" fundo="#DBEAFE" titulo={tx(idioma, 'fpOn')} direita={<Interruptor valor={c.frasesProntas !== false} onChange={(v) => set({ frasesProntas: v })} />} />
          </GrupoOpcoes>
        </AlvoTour>

        <Secao titulo={tx(idioma, 'fpColors')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(Object.keys(CORES_FITZGERALD) as Categoria[]).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CORES_FITZGERALD[k].fundo, borderColor: CORES_FITZGERALD[k].borda, borderWidth: px(2.5), borderRadius: px(16), paddingHorizontal: px(14), paddingVertical: px(6), marginRight: px(8), marginBottom: px(8) }}>
              <Text style={{ fontSize: px(19), fontWeight: '900', color: CORES_FITZGERALD[k].texto }}>{NOMES_CATEGORIA[k][idioma]}</Text>
            </View>
          ))}
        </View>

        {!completo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(20) }}>
            <Text style={{ flex: 1, fontSize: px(20), fontWeight: '800', color: C.slate2 }}>{tx(idioma, 'fpFreeInfo', { n: POR_GRUPO_GRATIS })}</Text>
            <SeloPlano onPress={() => exigir('frases', () => undefined)} />
          </View>
        ) : null}

        {GRUPOS.map((g) => {
          const doGrupo = lista.filter((f) => f.grupo === g.id);
          if (!doGrupo.length) return null;
          return (
            <View key={g.id}>
              <Secao titulo={`${g.emoji}  ${g.r[idioma]}`} style={{ color: CORES_FITZGERALD[g.cat].texto }} />
              <GrupoOpcoes>
                {doGrupo.map((f, i) => (
                  <View key={f.id}>
                    {i ? <Divisor /> : null}
                    <View style={{ padding: px(18), opacity: ocultas.has(f.id) ? 0.45 : 1 }}>
                      <PalavrasColoridas palavras={f.palavras} tamanho={px(22)} />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(10) }}>
                        <Acao rotulo={ocultas.has(f.id) ? tx(idioma, 'fpShow') : tx(idioma, 'fpHide')} onPress={() => alternarOculta(f.id)} />
                        {pode('frases') ? <Acao rotulo={tx(idioma, 'fpEdit')} onPress={() => editar(f)} /> : null}
                        {pode('frases') ? <Acao rotulo={tx(idioma, 'fpDelete')} cor="#DC2626" onPress={() => excluir(f.id)} /> : null}
                      </View>
                    </View>
                  </View>
                ))}
              </GrupoOpcoes>
            </View>
          );
        })}

        <Secao titulo={editando ? `✏️ ${tx(idioma, 'fpNew')}` : tx(idioma, 'fpNew')} />
        <AlvoTour id="fp_nova">
          <View style={{ backgroundColor: C.white, borderRadius: px(30), padding: px(20), borderWidth: px(2), borderColor: C.line }}>
            {!pode('frases') ? <SeloPlano onPress={() => exigir('frases', () => undefined)} /> : null}
            <Campo valor={texto} onChange={setTexto} placeholder={tx(idioma, 'fpPlaceholder')} style={{ marginTop: px(12) }} maxLength={80} />
            {texto.trim() ? <View style={{ marginTop: px(12) }}><PalavrasColoridas palavras={palavrasDoTexto(texto)} tamanho={px(22)} /></View> : null}
            <Text style={{ fontSize: px(19), fontWeight: '900', color: C.slate2, marginTop: px(14) }}>{tx(idioma, 'fpGroup').toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(8) }}>
              {GRUPOS.map((g) => {
                const k = CORES_FITZGERALD[g.cat];
                const on = grupo === g.id;
                return (
                  <Pressable key={g.id} onPress={() => setGrupo(g.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={g.r[idioma]}
                    style={{ paddingHorizontal: px(16), height: px(54), borderRadius: px(27), marginRight: px(8), marginBottom: px(8), justifyContent: 'center', backgroundColor: on ? k.borda : k.fundo, borderWidth: px(2.5), borderColor: k.borda }}>
                    <Text style={{ fontSize: px(19), fontWeight: '900', color: on ? '#FFFFFF' : k.texto }}>{g.emoji} {g.r[idioma]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Botao titulo={tx(idioma, 'fpAdd')} icone={{ f: 'feather', n: 'plus' }} cor="#2563EB" borda="#1E40AF" style={{ marginTop: px(12) }} onPress={salvar} />
          </View>
        </AlvoTour>

        <Botao titulo={tx(idioma, 'fpRestore')} contorno cor={C.white} corTexto={C.slate2} style={{ marginTop: px(26) }}
          onPress={() => { set({ frasesLista: undefined, frasesOcultas: [] }); setEditando(undefined); mostrarAviso(`✓ ${tx(idioma, 'fpRestore')}`); }} />
      </Rolagem>
    </View>
  );
}

const Acao = ({ rotulo, onPress, cor = '#334155' }: { rotulo: string; onPress: () => void; cor?: string }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={rotulo} style={{ paddingHorizontal: px(16), height: px(48), borderRadius: px(24), borderWidth: px(2), borderColor: '#E2E8F0', marginRight: px(8), justifyContent: 'center' }}>
    <Text style={{ fontSize: px(18), fontWeight: '900', color: cor }}>{rotulo}</Text>
  </Pressable>
);
