// Telas novas: CRIAR ROTINA (modelos), NOTIFICAÇÕES, REGISTRAR MOMENTO (crises), AJUDA e CONFERÊNCIA DO DESENVOLVEDOR.
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRotina } from '../estado';
import * as A from '../logica/acoes';
import { modelosRotina } from '../padroes';
import { paletaDaAba } from '../paleta';
import { AJUDOU, GATILHOS, rotuloLista, SENTIMENTOS, tx } from '../textos2';
import { PARTES, PASSOS_TOUR } from '../tourPassos';
import type { PassoTour } from '../tourPassos';
import { MiniDemo } from '../tourDemo';
import { AlvoTour, useTour } from '../tour';
import { Evento, Idioma, TelaRotina } from '../tipos';
import { Botao, C, Cabecalho, Cartao, Icone, px, Rolagem, sombra } from '../componentes/ui';
import { Segurar } from '../componentes/Segurar';
import { SeloPlano } from '../componentes/Extras';
import { pad } from '../logica/tempo';

const dataHora = (t: number) => { const d = new Date(t); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ------------------------------------------------------------------ CRIAR ROTINA
export function NovaRotina() {
  const { estado, idioma, voltar, mudar, abrir, exigir, pode, assinante, limites, mostrarAviso } = useRotina();
  const usados = new Set(estado.abas.map((a) => a.id));
  const modelos = modelosRotina(idioma).filter((m) => !usados.has(m.id));
  const criar = (m: ReturnType<typeof modelosRotina>[number]) => exigir('rotina', () => {
    mudar((s) => A.salvarAba(s, m));
    mostrarAviso(`✓ ${tx(idioma, 'created')}: ${m.nome}`);
    voltar();
  });
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Rotina Amiga" titulo={tx(idioma, 'newRoutineTitle')} sub={tx(idioma, 'newRoutineSub')} corKicker={C.green} onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(30) }}>
        {!assinante ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(10) }}>
            <Text style={{ flex: 1, fontSize: px(21), fontWeight: '800', color: C.slate2 }}>{tx(idioma, 'routinesFreeCount', { a: estado.abas.length, b: limites.rotinas })}</Text>
            {!pode('rotina') ? <SeloPlano onPress={() => exigir('rotina', () => undefined)} /> : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: px(16) }}>
          {modelos.map((m) => {
            const p = paletaDaAba(m);
            return (
              <Pressable key={m.id} onPress={() => criar(m)} accessibilityRole="button" accessibilityLabel={m.nome}
                style={[{ width: '48.5%', marginTop: px(20), borderRadius: px(44), borderWidth: px(4), borderColor: p.accent, backgroundColor: p.softAlt, padding: px(26), alignItems: 'center' }, sombra(4, p.accent, 0.15)]}>
                <View style={{ width: px(110), height: px(110), borderRadius: px(36), backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Icone f="mci" n={m.icone} size={px(54)} color={p.onAccent} />
                </View>
                <Text style={{ marginTop: px(16), fontSize: px(28), fontWeight: '900', color: C.ink, textTransform: 'uppercase' }}>{m.nome}</Text>
              </Pressable>
            );
          })}
        </View>
        <Botao titulo={tx(idioma, 'custom')} icone={{ f: 'feather', n: 'edit-3' }} contorno alto={px(96)} style={{ marginTop: px(34) }} onPress={() => exigir('rotina', () => { voltar(); setTimeout(() => abrir({ nome: 'gerenciarAbas' }), 30); })} />
      </Rolagem>
    </View>
  );
}

// ------------------------------------------------------------------ NOTIFICAÇÕES
const ICONE_EV: Partial<Record<Evento['tipo'], string>> = {
  frase: '🗣️', tarefa_fim: '✅', tarefa_liberada: '⏭️', tarefa_cancelada: '✖️', rotina_completa: '🏆', resgate: '🎁', meta: '🎯', crise: '🌧️', estrelas: '⭐', sentimento: '💬',
};
export const textoNotificacao = (e: Evento, idioma: Idioma): string | undefined => {
  const x = e.rotulo || '';
  switch (e.tipo) {
    case 'frase': return (e.estrelas || 0) > 0 ? tx(idioma, 'n_frase', { n: e.estrelas || 0, x: (e.palavras || []).join(' ') }) : undefined;
    case 'tarefa_fim': return tx(idioma, e.quem === 'adulto' ? 'n_tarefaAdulto' : 'n_tarefa', { x });
    case 'tarefa_liberada': return tx(idioma, 'n_liberada', { x });
    case 'tarefa_cancelada': return tx(idioma, 'n_cancelada', { x });
    case 'rotina_completa': return tx(idioma, 'n_rotina', { x });
    case 'resgate': return tx(idioma, 'n_resgate', { x });
    case 'meta': return tx(idioma, 'n_meta', { x });
    case 'crise': return tx(idioma, 'n_crise', { n: e.intensidade || 0 });
    case 'estrelas': return tx(idioma, 'n_estrelas', { n: `${(e.estrelas || 0) > 0 ? '+' : ''}${e.estrelas || 0}` });
    case 'sentimento': { const s = SENTIMENTOS.find((y) => y.id === e.valor); return tx(idioma, 'n_sentimento', { x: `${s?.emoji || ''} ${s?.r[idioma] || e.valor}` }); }
    default: return undefined;
  }
};

export function Notificacoes() {
  const { estado, idioma, voltar } = useRotina();
  const itens = useMemo(() => {
    const out: { t: number; e: Evento; txt: string }[] = [];
    for (let i = estado.log.length - 1; i >= 0 && out.length < 120; i--) {
      const e = estado.log[i];
      const txt = textoNotificacao(e, idioma);
      if (txt) out.push({ t: e.t, e, txt });
    }
    return out;
  }, [estado.log, idioma]);
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Rotina Amiga" titulo={tx(idioma, 'notifTitle')} sub={tx(idioma, 'notifSub')} onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(26) }}>
        {!itens.length ? <Cartao style={{ marginTop: px(20), alignItems: 'center', padding: px(40) }}><Text style={{ fontSize: px(70) }}>🔔</Text><Text style={{ fontSize: px(24), fontWeight: '800', color: C.slate2, marginTop: px(8) }}>{tx(idioma, 'notifEmpty')}</Text></Cartao> : null}
        {itens.map((x) => (
          <View key={`${x.t}-${x.e.tipo}`} style={[{ marginTop: px(16), backgroundColor: C.white, borderRadius: px(34), padding: px(22), flexDirection: 'row', alignItems: 'center', borderWidth: px(1.5), borderColor: '#E9EEF5' }, sombra(2)]}>
            <View style={{ width: px(76), height: px(76), borderRadius: px(24), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: px(38) }}>{ICONE_EV[x.e.tipo] || '•'}</Text></View>
            <Text style={{ flex: 1, marginLeft: px(18), fontSize: px(23), fontWeight: '800', color: C.ink2 }}>{x.txt}</Text>
            <Text style={{ fontSize: px(18), fontWeight: '800', color: C.faint, marginLeft: px(10) }}>{dataHora(x.t)}</Text>
          </View>
        ))}
      </Rolagem>
    </View>
  );
}

// ------------------------------------------------------------------ REGISTRAR MOMENTO (CRISE) — só pais
const Chips = ({ itens, sel, onToggle, idioma, cor }: { itens: { id: string; r: Record<Idioma, string> }[]; sel: string[]; onToggle: (id: string) => void; idioma: Idioma; cor: string }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(12) }}>
    {itens.map((g) => {
      const on = sel.includes(g.id);
      return (
        <Pressable key={g.id} onPress={() => onToggle(g.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={g.r[idioma]}
          style={{ paddingHorizontal: px(20), height: px(64), borderRadius: px(32), marginRight: px(12), marginBottom: px(12), justifyContent: 'center', backgroundColor: on ? cor : C.white, borderWidth: px(2.5), borderColor: on ? cor : C.line2 }}>
          <Text style={{ fontSize: px(21), fontWeight: '900', color: on ? C.white : C.slate2 }}>{g.r[idioma]}</Text>
        </Pressable>
      );
    })}
  </View>
);
const Rot = ({ children }: { children: React.ReactNode }) => <Text style={{ fontSize: px(22), fontWeight: '900', color: C.slate2, letterSpacing: px(0.8), textTransform: 'uppercase', marginTop: px(30) }}>{children}</Text>;

export function Crise({ abaInicial = 'novo' }: { abaInicial?: 'novo' | 'lista' }) {
  const { estado, idioma, voltar, registrarCrise, mudar, mostrarAviso } = useRotina();
  const [aba, setAba] = useState(abaInicial);
  const [quando, setQuando] = useState(0);
  const [int, setInt] = useState(3);
  const [dur, setDur] = useState(10);
  const [gat, setGat] = useState<string[]>([]);
  const [aj, setAj] = useState<string[]>([]);
  const [nota, setNota] = useState('');
  const tog = (l: string[], set: (x: string[]) => void) => (id: string) => set(l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  const lista = useMemo(() => estado.log.filter((e) => e.tipo === 'crise').sort((a, b) => b.t - a.t), [estado.log]);
  const salvar = () => {
    registrarCrise({ quando: Date.now() - quando * 60000, intensidade: int, duracaoMin: dur, gatilhos: gat, ajudou: aj, nota });
    setGat([]); setAj([]); setNota(''); setQuando(0); setInt(3); setDur(10);
    mostrarAviso(`✓ ${tx(idioma, 'saved')}`);
    setAba('lista');
  };
  const CORES = ['#22C55E', '#84CC16', '#F59E0B', '#F97316', '#EF4444'];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Voz Amiga + Rotina Amiga" titulo={tx(idioma, 'criseTitle')} sub={tx(idioma, 'criseSub')} corKicker="#EA580C" onVoltar={voltar} />
      <View style={{ flexDirection: 'row', backgroundColor: C.white, paddingHorizontal: px(20), borderBottomWidth: px(2), borderColor: '#E9EEF5' }}>
        {(['novo', 'lista'] as const).map((k) => (
          <Pressable key={k} onPress={() => setAba(k)} accessibilityRole="tab" accessibilityState={{ selected: aba === k }} style={{ flex: 1, alignItems: 'center', paddingVertical: px(22), borderBottomWidth: px(6), borderColor: aba === k ? '#EA580C' : 'transparent' }}>
            <Text style={{ fontSize: px(22), fontWeight: '900', color: aba === k ? '#EA580C' : C.slate2, textTransform: 'uppercase' }}>{k === 'novo' ? tx(idioma, 'criseNew') : `${tx(idioma, 'criseList')} (${lista.length})`}</Text>
          </Pressable>
        ))}
      </View>
      {aba === 'novo' ? (
        <Rolagem fundo={C.bgBlue} style={{ padding: px(28) }}>
          <Cartao style={{ padding: px(30), borderRadius: px(44) }}>
            <Rot>{tx(idioma, 'when')}</Rot>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(12) }}>
              {([[0, 'w_now'], [30, 'w_30'], [60, 'w_60'], [120, 'w_120'], [240, 'w_240']] as const).map(([m, k]) => (
                <Pressable key={k} onPress={() => setQuando(m)} accessibilityRole="radio" accessibilityState={{ selected: quando === m }} style={{ paddingHorizontal: px(20), height: px(60), borderRadius: px(30), marginRight: px(10), marginBottom: px(10), justifyContent: 'center', backgroundColor: quando === m ? C.ink : C.white, borderWidth: px(2), borderColor: quando === m ? C.ink : C.line2 }}>
                  <Text style={{ fontSize: px(21), fontWeight: '900', color: quando === m ? C.white : C.slate2 }}>{tx(idioma, k)}</Text>
                </Pressable>
              ))}
            </View>
            <Rot>{tx(idioma, 'intensity')}</Rot>
            <View style={{ flexDirection: 'row', marginTop: px(14) }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setInt(n)} accessibilityRole="radio" accessibilityLabel={`${tx(idioma, 'intensity')} ${n}`} accessibilityState={{ selected: int === n }}
                  style={{ flex: 1, height: px(96), marginRight: n < 5 ? px(12) : 0, borderRadius: px(28), alignItems: 'center', justifyContent: 'center', backgroundColor: int >= n ? CORES[n - 1] : C.white, borderWidth: px(3), borderColor: CORES[n - 1] }}>
                  <Text style={{ fontSize: px(36), fontWeight: '900', color: int >= n ? C.white : CORES[n - 1] }}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: px(8) }}>
              <Text style={{ fontSize: px(18), fontWeight: '800', color: C.slate }}>{tx(idioma, 'int_1')}</Text>
              <Text style={{ fontSize: px(18), fontWeight: '800', color: C.slate }}>{tx(idioma, 'int_3')}</Text>
              <Text style={{ fontSize: px(18), fontWeight: '800', color: C.slate }}>{tx(idioma, 'int_5')}</Text>
            </View>
            <Rot>{tx(idioma, 'duration')}</Rot>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(12) }}>
              {[-5, -1].map((d) => <Botao key={d} titulo={`${d}`} contorno alto={px(80)} style={{ width: px(110), marginRight: px(10) }} onPress={() => setDur(Math.max(0, dur + d))} />)}
              <Text style={{ flex: 1, textAlign: 'center', fontSize: px(46), fontWeight: '900', color: C.ink }}>{dur}</Text>
              {[1, 5].map((d) => <Botao key={d} titulo={`+${d}`} contorno alto={px(80)} style={{ width: px(110), marginLeft: px(10) }} onPress={() => setDur(Math.min(600, dur + d))} />)}
            </View>
            <Rot>{tx(idioma, 'triggers')}</Rot>
            <Chips itens={GATILHOS} sel={gat} onToggle={tog(gat, setGat)} idioma={idioma} cor="#EA580C" />
            <Rot>{tx(idioma, 'helped')}</Rot>
            <Chips itens={AJUDOU} sel={aj} onToggle={tog(aj, setAj)} idioma={idioma} cor="#059669" />
            <Rot>{tx(idioma, 'note')}</Rot>
            <TextInput value={nota} onChangeText={setNota} maxLength={1000} placeholder={tx(idioma, 'notePh')} placeholderTextColor={C.faint} multiline
              style={{ marginTop: px(12), minHeight: px(130), borderRadius: px(28), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.bg, padding: px(20), fontSize: px(24), color: C.ink, textAlignVertical: 'top' }} />
          </Cartao>
          <Botao titulo={tx(idioma, 'saveMoment')} icone={{ f: 'feather', n: 'save' }} cor="#EA580C" borda="#9A3412" alto={px(100)} style={{ marginTop: px(28) }} onPress={salvar} />
        </Rolagem>
      ) : (
        <Rolagem fundo={C.bgBlue} style={{ padding: px(28) }}>
          {!lista.length ? <Cartao style={{ alignItems: 'center', padding: px(40) }}><Text style={{ fontSize: px(70) }}>🌤️</Text><Text style={{ fontSize: px(24), fontWeight: '800', color: C.slate2 }}>{tx(idioma, 'noneYet')}</Text></Cartao> : null}
          {lista.map((c) => (
            <Cartao key={c.t} style={{ marginTop: px(18), padding: px(26), borderRadius: px(40) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: px(70), height: px(70), borderRadius: px(35), backgroundColor: CORES[(c.intensidade || 3) - 1], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: px(32), fontWeight: '900', color: C.white }}>{c.intensidade}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: px(18) }}>
                  <Text style={{ fontSize: px(26), fontWeight: '900', color: C.ink }}>{dataHora(c.t)}</Text>
                  <Text style={{ fontSize: px(20), fontWeight: '800', color: C.slate }}>{c.duracaoMin || 0} min</Text>
                </View>
                <Segurar ms={1500} rotulo={tx(idioma, 'deleteRec')} aoCompletar={() => mudar((s) => A.excluirRegistro(s, c.t, 'crise'))} corFaixa="rgba(225,29,72,0.25)"
                  style={{ height: px(64), paddingHorizontal: px(20), borderRadius: px(22), borderWidth: px(2), borderColor: '#FECDD3', backgroundColor: '#FFF1F2' }}>
                  <Text style={{ fontSize: px(19), fontWeight: '900', color: C.red }}>{tx(idioma, 'deleteRec')}</Text>
                </Segurar>
              </View>
              {c.gatilhos?.length ? <Text style={{ marginTop: px(12), fontSize: px(21), color: C.ink2 }}>⚡ {c.gatilhos.map((g) => rotuloLista(GATILHOS, g, idioma)).join(', ')}</Text> : null}
              {c.ajudou?.length ? <Text style={{ marginTop: px(6), fontSize: px(21), color: '#047857' }}>💚 {c.ajudou.map((g) => rotuloLista(AJUDOU, g, idioma)).join(', ')}</Text> : null}
              {c.nota ? <Text style={{ marginTop: px(6), fontSize: px(21), color: C.slate2, fontStyle: 'italic' }}>“{c.nota}”</Text> : null}
            </Cartao>
          ))}
        </Rolagem>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ AJUDA
export interface TopicoAjuda { id: string; parte: string; titulo: string; texto: string; demo?: React.ComponentProps<typeof MiniDemo>['tipo'] }
const EXTRAS: TopicoAjuda[] = [];
/** Para acrescentar conteúdos de ajuda depois (sem mexer nesta tela). */
export const adicionarTopicoAjuda = (t: TopicoAjuda) => { if (!EXTRAS.some((x) => x.id === t.id)) EXTRAS.push(t); };

/** v14.2: o que a ajuda também sabe (funções novas) — com o lugar para onde "Me leve até lá" leva. */
const SABE_V14: { id: string; t: Record<Idioma, string>; d: Record<Idioma, string>; tela?: TelaRotina; passoId?: string }[] = [
  { id: 'k_backup', t: { pt: 'Cópia de segurança (backup)', en: 'Backup', es: 'Copia de seguridad' }, d: { pt: 'O app guarda sozinho cópias das pranchas. Dá para mandar a cópia pelo Drive ou WhatsApp e restaurar num celular novo.', en: 'The app keeps copies of the cards by itself. You can send a copy by Drive or WhatsApp and restore it on a new phone.', es: 'La app guarda copias sola. Puedes enviarla por Drive o WhatsApp y restaurarla en un celular nuevo.' }, tela: { nome: 'v14', tela: 'backup' } },
  { id: 'k_senha', t: { pt: 'Senha dos pais', en: 'Parents’ PIN', es: 'Clave de los padres' }, d: { pt: 'Depois da continha, pede uma senha de números para entrar nos ajustes.', en: 'After the sum, asks for a number PIN to open settings.', es: 'Después de la cuenta, pide una clave de números.' }, tela: { nome: 'v14', tela: 'senha' } },
  { id: 'k_sos', t: { pt: 'Botão de emergência 🆘', en: 'Emergency button 🆘', es: 'Botón de emergencia 🆘' }, d: { pt: 'Na barra da frase: "estou com dor", "preciso de ajuda". Fala na hora e entra no relatório.', en: 'On the sentence bar: "I am in pain", "I need help". Speaks right away and goes into the report.', es: 'En la barra: "me duele", "necesito ayuda". Habla al instante y va al informe.' }, tela: { nome: 'v14', tela: 'emergencia' } },
  { id: 'k_voz', t: { pt: 'Trocar a voz, velocidade e tom', en: 'Change voice, speed and pitch', es: 'Cambiar voz, velocidad y tono' }, d: { pt: 'Toque para ouvir cada voz do celular e escolher. Velocidade e tom ficam na configuração de voz do Android.', en: 'Tap to hear each phone voice and pick. Speed and pitch are in the Android voice settings.', es: 'Toca para oír cada voz y elegir. Velocidad y tono están en los ajustes de voz de Android.' }, tela: { nome: 'v14', tela: 'vozes' } },
  { id: 'k_conq', t: { pt: 'Conquistas e prêmios', en: 'Achievements and prizes', es: 'Logros y premios' }, d: { pt: 'Prêmios da loja, metas, conquistas do mês e as conquistas que você cria.', en: 'Shop prizes, goals, monthly achievements and the ones you create.', es: 'Premios, metas, logros del mes y los que tú creas.' }, tela: { nome: 'v14', tela: 'conquistas' } },
  { id: 'k_niveis', t: { pt: 'Níveis: uma palavra, duas, frases', en: 'Levels: one word, two, sentences', es: 'Niveles: una palabra, dos, frases' }, d: { pt: 'Para começar simples e ir crescendo. As palavras antigas não mudam de lugar.', en: 'Start simple and grow. Old words stay in place.', es: 'Para empezar simple y crecer. Las palabras viejas no cambian de lugar.' }, tela: { nome: 'v14', tela: 'crescer' } },
  { id: 'k_calma', t: { pt: 'Tela calma e botões grandes', en: 'Calm screen and big buttons', es: 'Pantalla calma y botones grandes' }, d: { pt: 'Cores suaves, sem movimento e sem anúncio. Botões maiores e tempo de toque.', en: 'Soft colors, no motion and no ads. Bigger buttons and touch time.', es: 'Colores suaves, sin movimiento ni anuncio. Botones grandes y tiempo de toque.' }, tela: { nome: 'v14', tela: 'conforto' } },
  { id: 'k_pais', t: { pt: 'Missão do dia e modo exemplo', en: 'Mission of the day and show-me mode', es: 'Misión del día y modo ejemplo' }, d: { pt: 'Uma tarefinha por dia e o botão 👆 para você mostrar as palavras sem contar como a criança.', en: 'One small task a day and the 👆 button to show words without counting as the child.', es: 'Una tarea al día y el botón 👆 para mostrar palabras sin contar como el niño.' }, tela: { nome: 'v14', tela: 'pais' } },
  { id: 'k_mais', t: { pt: 'Ligar e desligar as funções', en: 'Turn features on and off', es: 'Encender y apagar funciones' }, d: { pt: 'Em Ajustes › Definições › Funções do app, cada novidade tem um botão LIGADO/DESLIGADO.', en: 'In Settings › Preferences › App features, each new feature has an ON/OFF button.', es: 'En Ajustes › Preferencias › Funciones de la app, cada novedad tiene un botón ENCENDIDO/APAGADO.' }, passoId: 'df_funcoes' },
  { id: 'k_rapida', t: { pt: 'Criação rápida (montar as pranchas só tocando)', en: 'Quick create (build cards just by tapping)', es: 'Creación rápida (armar tarjetas solo tocando)' }, d: { pt: 'Dentro do CRIAR PRANCHA: o app pergunta a rotina (pedir, manhã, escola, tarde, noite, gostos) e você toca nos botões. Cada um vai para a categoria certa.', en: 'Inside CREATE CARD: the app asks about the routine and you tap the buttons. Each goes to the right category.', es: 'Dentro de CREAR TARJETA: la app pregunta la rutina y tú tocas los botones. Cada uno va a la categoría correcta.' }, tela: { nome: 'v14', tela: 'rapida' } },
  { id: 'k_botoes', t: { pt: 'Quantos botões para começar? (especialistas)', en: 'How many buttons to start? (specialists)', es: '¿Cuántos botones para empezar? (especialistas)' }, d: { pt: 'Cerca de 10 palavras, e ir acrescentando aos poucos sem mudar as antigas de lugar. Fontes: AssistiveWare, Little Words e ASHA.', en: 'About 10 words, adding more little by little without moving old ones. Sources: AssistiveWare, Little Words and ASHA.', es: 'Unas 10 palabras, y agregar de a poco sin mover las anteriores. Fuentes: AssistiveWare, Little Words y ASHA.' }, tela: { nome: 'v14', tela: 'crescer' } },
  { id: 'k_ia', t: { pt: 'IA: baixar no celular ou usar o ChatGPT', en: 'AI: download to phone or use ChatGPT', es: 'IA: descargar al celular o usar ChatGPT' }, d: { pt: 'Toque em BAIXAR e acompanhe a porcentagem. Depois funciona sem internet. Ou cole a chave do seu ChatGPT (com o seu saldo na OpenAI).', en: 'Tap DOWNLOAD and watch the percentage. Then it works offline. Or paste your ChatGPT key (with your OpenAI credit).', es: 'Toca DESCARGAR y mira el porcentaje. Después funciona sin internet. O pega la clave de tu ChatGPT (con tu saldo de OpenAI).' }, tela: { nome: 'v14', tela: 'ia' } },
  { id: 'k_arasaac', t: { pt: 'Desenhos (pictogramas) ARASAAC: o que são', en: 'ARASAAC drawings (pictograms): what they are', es: 'Dibujos (pictogramas) ARASAAC: qué son' }, d: { pt: 'Banco gratuito do Governo de Aragão (Espanha), criado por Sergio Palao. Não faz parte do Voz Amiga; o app só busca lá, com internet (licença CC BY-NC-SA).', en: 'A free bank from the Government of Aragon (Spain), created by Sergio Palao. Not part of Voz Amiga; the app only fetches from there, online (CC BY-NC-SA).', es: 'Banco gratuito del Gobierno de Aragón (España), creado por Sergio Palao. No es parte de Voz Amiga; la app solo busca allí, con internet (CC BY-NC-SA).' }, passoId: 'cp_picto' },
  { id: 'k_curso', t: { pt: 'Curso para os pais', en: 'Course for parents', es: 'Curso para los padres' }, d: { pt: 'Lições curtas com o mascote. Pode repetir.', en: 'Short lessons with the mascot. Repeat any time.', es: 'Lecciones cortas con la mascota.' }, tela: { nome: 'v14', tela: 'curso' } },
];
const semAcento = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function Ajuda({ topico }: { topico?: string }) {
  const { idioma, voltar, fecharTudo, abrir } = useRotina();
  const tour = useTour();
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<string | undefined>(topico);
  type Top = TopicoAjuda & { passo?: PassoTour; tela?: TelaRotina };
  const topicos: Top[] = useMemo(() => [
    ...PASSOS_TOUR.filter((p) => p.id !== 'oi' && p.id !== 'fim').map((p) => ({ id: p.id, parte: PARTES[idioma][p.parte], titulo: p[idioma].t, texto: p[idioma].d + (p[idioma].dica ? ` (${p[idioma].dica})` : ''), passo: p })),
    ...SABE_V14.map((k) => ({ id: k.id, parte: idioma === 'en' ? 'Preferences' : idioma === 'es' ? 'Preferencias' : 'Definições', titulo: k.t[idioma], texto: k.d[idioma], tela: k.tela, passo: k.passoId ? PASSOS_TOUR.find((p) => p.id === k.passoId) : undefined })),
    ...EXTRAS,
  ], [idioma]);
  // busca "inteligente": cada palavra da pergunta conta pontos (no título vale mais); sem acento e sem diferença de maiúscula
  const termos = semAcento(busca).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !['como', 'que', 'para', 'onde', 'faco', 'fazer', 'the', 'how', 'what', 'donde'].includes(w));
  const pontuar = (t: Top) => termos.reduce((n, w) => n + (semAcento(t.titulo).includes(w) ? 3 : 0) + (semAcento(t.texto).includes(w) ? 1 : 0), 0);
  const filtrados = termos.length ? topicos.map((t) => [t, pontuar(t)] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([t]) => t) : topicos;
  const grupos: [string, Top[]][] = [];
  if (termos.length) grupos.push([idioma === 'en' ? 'Best answers' : idioma === 'es' ? 'Mejores respuestas' : 'Melhores respostas', filtrados.slice(0, 8)]);
  else for (const t of filtrados) { const g = grupos.find((x) => x[0] === t.parte); if (g) g[1].push(t); else grupos.push([t.parte, [t]]); }
  const levar = (t: Top) => {
    if (t.tela) { abrir(t.tela); return; }
    if (t.passo) { fecharTudo(); setTimeout(() => tour?.iniciarCurso({ passos: [t.passo!], partes: PARTES[idioma] }), 200); }
  };
  const tourParte = (parte: number) => { fecharTudo(); setTimeout(() => tour?.iniciarCurso({ passos: PASSOS_TOUR.filter((p) => p.parte === parte), partes: PARTES[idioma] }), 200); };
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt);
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Voz Amiga" titulo={tx(idioma, 'helpTitle')} sub={L('Pergunte o que quiser. Eu levo você até o botão.', 'Ask anything. I take you to the button.', 'Pregunta lo que quieras. Te llevo al botón.')} corKicker="#0284C7" onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(26) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: px(40), borderWidth: px(2), borderColor: '#7DD3FC', paddingHorizontal: px(24), height: px(96) }}>
          <Icone n="search" size={px(30)} color={C.slate} />
          <TextInput value={busca} onChangeText={(v) => setBusca(v.slice(0, 80))} placeholder={L('Ex.: como troco a voz?', 'E.g. how do I change the voice?', 'Ej.: ¿cómo cambio la voz?')} placeholderTextColor={C.faint} accessibilityLabel={tx(idioma, 'helpSearch')} style={{ flex: 1, marginLeft: px(14), fontSize: 16, color: C.ink }} />
        </View>
        {termos.length && !filtrados.length ? <Text style={{ marginTop: 10, fontSize: 14, color: C.slate2 }}>{L('Não achei. Tente outras palavras, como "voz", "prancha", "prêmio" ou "relatório".', 'Not found. Try other words like "voice", "card", "prize" or "report".', 'No encontré. Prueba "voz", "tarjeta", "premio" o "informe".')}</Text> : null}
        {!termos.length ? (
          <AlvoTour id="ajuda_tour">
            <Text style={{ marginTop: 18, fontSize: 13, fontWeight: '900', color: '#0369A1', letterSpacing: 0.6 }}>{L('TOUR POR PARTE (VOCÊ ESCOLHE)', 'TOUR BY PART (YOU CHOOSE)', 'RECORRIDO POR PARTE (TÚ ELIGES)')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 6 }}>
              {PARTES[idioma].slice(0, -1).map((nome, i) => (
                <Pressable key={nome} onPress={() => tourParte(i)} accessibilityRole="button" accessibilityLabel={`tour ${nome}`} style={({ pressed }) => [{ width: '50%', padding: 4, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                  <View style={{ minHeight: 58, borderRadius: 16, backgroundColor: '#0EA5E9', justifyContent: 'center', paddingHorizontal: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>▶ {nome}</Text>
                    <Text style={{ color: '#E0F2FE', fontSize: 11.5 }}>{PASSOS_TOUR.filter((p) => p.parte === i).length} {L('passos', 'steps', 'pasos')}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Botao titulo={tx(idioma, 'seeInTour')} icone={{ f: 'feather', n: 'compass' }} cor="#0369A1" borda="#075985" alto={px(90)} style={{ marginTop: 8 }} onPress={() => { fecharTudo(); setTimeout(() => tour?.iniciar(), 120); }} />
          </AlvoTour>
        ) : null}
        {grupos.map(([parte, ts]) => (
          <View key={parte}>
            <Text style={{ marginTop: px(32), fontSize: 13, fontWeight: '900', color: '#0369A1', letterSpacing: 0.6, textTransform: 'uppercase' }}>{parte}</Text>
            {ts.map((t) => {
              const on = aberto === t.id || (termos.length > 0 && ts[0] === t);
              return (
                <Pressable key={t.id} onPress={() => setAberto(aberto === t.id ? undefined : t.id)} accessibilityRole="button" accessibilityState={{ expanded: on }} accessibilityLabel={t.titulo}
                  style={[{ marginTop: 10, backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: on ? '#7DD3FC' : '#E9EEF5' }, sombra(2)]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '900', color: C.ink }}>{t.titulo}</Text>
                    <Icone n={on ? 'chevron-up' : 'chevron-down'} size={20} color={C.slate} />
                  </View>
                  {on ? (
                    <>
                      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: C.slate2 }}>{t.texto}</Text>
                      {t.tela || t.passo?.alvo ? (
                        <Pressable onPress={() => levar(t)} accessibilityRole="button" accessibilityLabel={`me leve até lá ${t.titulo}`} style={({ pressed }) => [{ marginTop: 10, alignSelf: 'flex-start', height: 42, borderRadius: 21, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F97316', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>📍 {L('Me leve até lá', 'Take me there', 'Llévame ahí')}</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
        <Text style={{ marginTop: px(30), fontSize: px(20), color: C.slate, textAlign: 'center' }}>{tx(idioma, 'helpMore')}</Text>
        <Segurar ms={5000} rotulo={tx(idioma, 'devCheck')} aoCompletar={() => abrir({ nome: 'diagnostico' })} style={{ marginTop: px(30), height: px(60), borderRadius: px(30) }}>
          <Text style={{ fontSize: px(16), color: C.faint }}>v2 · {tx(idioma, 'devCheck')}</Text>
        </Segurar>
      </Rolagem>
    </View>
  );
}
// ------------------------------------------------------------------ CONFERÊNCIA DO DESENVOLVEDOR
export function Diagnostico() {
  const { idioma, voltar, ligacoes, limites, estado, assinante } = useRotina();
  const linhas: [string, boolean | string, string][] = [
    ['idioma', ligacoes.idioma, 'idioma do Voz (pt/en/es)'],
    ['falar', ligacoes.falar, 'falar = mesma voz do Voz'],
    ['assinante', ligacoes.assinante, 'assinante = users/{uid}.hasAccess'],
    ['limitesFirebase', ligacoes.limitesFirebase, 'limitesFirebase = limitações/rotina'],
    ['abrirPlanos', ligacoes.abrirPlanos, 'abrirPlanos = tela de planos do Voz'],
    ['tourIrPara', ligacoes.tourIrPara, 'tourIrPara = telas do Voz no tour'],
    ['abasVoz', ligacoes.abasVoz, 'abasVoz + abrirAbaVoz (tarefa abre aba)'],
    ['abrirAbaVoz', ligacoes.abrirAbaVoz, ''],
    ['imprimirHtml', ligacoes.imprimirHtml, 'PDF (expo-print) — opcional'],
    ['salvarImagem', ligacoes.salvarImagem, 'fotos das tarefas — opcional'],
    ['armazenamento', ligacoes.armazenamento, ''],
  ];
  const ok = (v: boolean | string) => v === true || (typeof v === 'string' && v.length > 0);
  return (
    <View style={{ flex: 1, backgroundColor: C.bgBlue }}>
      <Cabecalho kicker="Rotina Amiga" titulo={tx(idioma, 'devCheck')} onVoltar={voltar} />
      <Rolagem fundo={C.bgBlue} style={{ padding: px(26) }}>
        <Cartao style={{ padding: px(20), borderRadius: px(30) }}>
          {linhas.map(([k, v, d]) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: px(12), borderBottomWidth: px(1.5), borderColor: '#EEF2F7' }}>
              <Text style={{ fontSize: px(26) }}>{ok(v) ? '✅' : k === 'assinante' ? '➖' : '⚠️'}</Text>
              <View style={{ flex: 1, marginLeft: px(14) }}>
                <Text style={{ fontSize: px(22), fontWeight: '900', color: C.ink }}>{k}: {String(v)}</Text>
                {d ? <Text style={{ fontSize: px(18), color: C.slate }}>{d}</Text> : null}
              </View>
            </View>
          ))}
        </Cartao>
        <Cartao style={{ marginTop: px(20), padding: px(24), borderRadius: px(30) }}>
          <Text style={{ fontSize: px(22), fontWeight: '900', color: C.ink }}>Limites ({assinante ? 'Plano Completo' : 'gratuito'})</Text>
          <Text selectable style={{ marginTop: px(8), fontSize: px(19), color: C.slate2, fontFamily: 'monospace' }}>{JSON.stringify(limites, null, 1)}</Text>
          <Text style={{ marginTop: px(12), fontSize: px(19), color: C.slate2 }}>Rotinas: {estado.abas.length} · tarefas: {estado.tarefas.length} · prêmios: {estado.recompensas.length} · eventos: {estado.log.length}</Text>
        </Cartao>
      </Rolagem>
    </View>
  );
}
