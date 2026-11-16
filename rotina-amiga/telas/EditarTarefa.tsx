// EDITAR TAREFA / NOVA TAREFA — mesmo layout do Rotina Amiga.
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { AlvoTour, RolagemTour } from '../tour';
import * as A from '../logica/acoes';
import { formatarHorario, paraMin } from '../logica/tempo';
import { ORDEM_PICTOGRAMAS, PICTOGRAMAS } from '../padroes';
import { paletaDaAba } from '../paleta';
import { DIAS_CURTOS } from '../textos';
import { Tarefa } from '../tipos';
import { Botao, C, Campo, Cartao, Icone, Marcar, px, sombra, T, Toque } from '../componentes/ui';
import { SeloPlano } from '../componentes/Extras';
import { tx } from '../textos2';

const Titulo = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: px(30), fontWeight: '900', color: C.ink2, letterSpacing: px(0.6), textTransform: 'uppercase', marginBottom: px(24) }}>{children}</Text>
);
const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: px(23), fontWeight: '900', color: C.slate2, letterSpacing: px(0.8), textTransform: 'uppercase', marginBottom: px(16) }}>{children}</Text>
);

export function EditarTarefa({ tarefaId, abaId }: { tarefaId?: string; abaId?: string }) {
  const { estado, t, voltar, mudar, idioma, salvarImagem, pode, exigir, abasVoz } = useRotina();
  const podeHorario = pode('horario');
  const podeTimer = pode('temporizador');
  const original = estado.tarefas.find((x) => x.id === tarefaId);
  const [f, setF] = useState<Tarefa>(() => original || {
    id: A.novoId('t'), abaId: abaId || estado.abas[0]?.id || 'manha', titulo: '', icone: 'acordar', horario: '', travarAteHorario: false, alarme: true, duracaoMin: 0, dias: [0, 1, 2, 3, 4, 5, 6], estrelas: 1,
  });
  const [temHorario, setTemHorario] = useState(!!(original?.horario));
  const [usaTimer, setUsaTimer] = useState((original?.duracaoMin || 0) > 0);
  const set = (x: Partial<Tarefa>) => setF((o) => ({ ...o, ...x }));
  const aba = estado.abas.find((a) => a.id === f.abaId);
  const p = paletaDaAba(aba);
  const D = DIAS_CURTOS[idioma];

  const escolherImagem = async (camera: boolean) => {
    try {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionBody')); return; }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!r.canceled && r.assets?.[0]?.uri) set({ imagemUri: await salvarImagem(r.assets[0].uri) });
    } catch { /* cancelado */ }
  };

  const valido = f.titulo.trim().length > 0 && f.dias.length > 0 && (!temHorario || paraMin(f.horario) !== undefined);
  const salvar = () => {
    if (!valido) return;
    // SEGURANÇA: confere o limite do plano de novo na hora de salvar (não só no botão de entrada)
    const original = estado.tarefas.find((x) => x.id === f.id);
    if ((!original || original.abaId !== f.abaId) && !pode('tarefa', f.abaId)) { exigir('tarefa', () => undefined, f.abaId); return; }
    const final: Tarefa = {
      ...f,
      titulo: f.titulo.trim(),
      horario: temHorario ? f.horario : undefined,
      travarAteHorario: temHorario ? f.travarAteHorario : false,
      alarme: temHorario ? f.alarme : false,
      duracaoMin: usaTimer ? Math.max(1, f.duracaoMin || 5) : 0,
    };
    mudar((s) => A.salvarTarefa(s, final));
    voltar();
  };

  const linhasDias = [[0, 1, 2, 3, 4], [5, 6]];

  return (
    <View style={{ flex: 1, backgroundColor: p.softAlt }}>
      <View style={{ backgroundColor: C.white, borderBottomWidth: px(1.5), borderColor: '#E9EEF5', paddingHorizontal: px(28), paddingTop: px(30), paddingBottom: px(26), flexDirection: 'row', alignItems: 'center' }}>
        <Toque onPress={voltar} rotulo={t('back')} style={{ width: px(82), height: px(82), borderRadius: px(30), backgroundColor: C.bg, borderWidth: px(1.5), borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
          <Icone n="arrow-left" size={px(36)} color={C.ink} />
        </Toque>
        <View style={{ flex: 1, marginLeft: px(30) }}>
          <Text style={{ fontSize: px(22), fontWeight: '900', color: p.text, letterSpacing: px(1.2), textTransform: 'uppercase' }}>{t('tasks')}</Text>
          <Text style={{ fontSize: px(50), fontWeight: '900', color: C.ink, textTransform: 'uppercase', letterSpacing: px(-0.6) }} numberOfLines={1} adjustsFontSizeToFit>{original ? `${t('edit')} ${t('tasks').replace(/s$/i, '')}` : t('newTask')}</Text>
        </View>
        <View style={{ width: px(82), height: px(82), borderRadius: px(26), backgroundColor: p.soft, borderWidth: px(3), borderColor: p.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icone f="mci" n={aba?.icone || 'star-outline'} size={px(36)} color={p.text} />
        </View>
      </View>

      <RolagemTour contentContainerStyle={{ padding: px(28), paddingBottom: px(120) }} keyboardShouldPersistTaps="handled">
        <AlvoTour id="et_nome"><Cartao style={{ padding: px(36) }}>
          <Rotulo>{t('whatToDo')}</Rotulo>
          <Campo valor={f.titulo} onChange={(v) => set({ titulo: v })} maxLength={60} placeholder={t('taskName')} style={{ height: px(100), borderRadius: px(50), fontSize: px(30), paddingHorizontal: px(30) }} />
          <Text style={{ fontSize: px(22), fontWeight: '600', color: C.slate, marginTop: px(12) }}>{t('taskNameHint')}</Text>
        </Cartao></AlvoTour>

        <Cartao style={{ padding: px(36), marginTop: px(30) }}>
          <Titulo>{t('chooseRoutine')}</Titulo>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {estado.abas.map((a) => {
              const on = a.id === f.abaId;
              const pa = paletaDaAba(a);
              return (
                <Pressable key={a.id} onPress={() => set({ abaId: a.id })} style={{ flexDirection: 'row', alignItems: 'center', height: px(76), paddingHorizontal: px(24), borderRadius: px(38), marginRight: px(14), marginBottom: px(14), backgroundColor: on ? pa.accent : pa.softAlt, borderWidth: px(2.5), borderColor: on ? pa.accentDark : pa.soft }}>
                  <Icone f="mci" n={a.icone} size={px(30)} color={on ? pa.onAccent : pa.text} />
                  <Text style={{ marginLeft: px(10), fontSize: px(24), fontWeight: '900', color: on ? pa.onAccent : pa.text, textTransform: 'uppercase' }}>{a.nome}</Text>
                </Pressable>
              );
            })}
          </View>
        </Cartao>

        <AlvoTour id="et_dias"><Cartao style={{ padding: px(36), marginTop: px(30) }}>
          <Titulo>{t('weekDays')}</Titulo>
          {linhasDias.map((linha, li) => (
            <View key={li} style={{ flexDirection: 'row', marginTop: li ? px(22) : 0 }}>
              {linha.map((d, k) => {
                const on = f.dias.includes(d);
                return (
                  <Pressable key={d} onPress={() => set({ dias: on ? f.dias.filter((x) => x !== d) : [...f.dias, d].sort() })} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                    style={{ flex: 1, height: px(80), borderRadius: px(28), marginLeft: k ? px(22) : 0, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.accent : '#F8FAFC', borderBottomWidth: px(6), borderColor: on ? p.accentDark : '#E2E8F0' }}>
                    <Text style={{ fontSize: px(22), fontWeight: '900', color: on ? p.onAccent : C.slate2 }}>{D[d]}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Cartao></AlvoTour>

        <AlvoTour id="et_horario"><Cartao style={{ padding: px(30), marginTop: px(30) }}>
          <Titulo>{t('hasFixedTime')}</Titulo>
          {!podeHorario ? <View style={{ marginBottom: px(16) }}><SeloPlano onPress={() => exigir('horario', () => undefined)} /></View> : null}
          <Marcar valor={temHorario} onChange={(v) => { if (v && !podeHorario) return exigir('horario', () => undefined); setTemHorario(v); if (v && !f.horario) set({ horario: '08:00' }); }} rotulo={temHorario ? t('yes') : t('no')} />
          {temHorario ? (
            <View style={{ borderTopWidth: px(2), borderColor: '#E2E8F0', marginTop: px(30), paddingTop: px(28), flexDirection: 'row' }}>
              <View style={{ flex: 1.05, paddingRight: px(26) }}>
                <Rotulo>{t('whatTime')}</Rotulo>
                <Campo valor={f.horario || ''} onChange={(v) => set({ horario: formatarHorario(v) })} teclado="number-pad" maxLength={5} placeholder="08:00" grande style={{ height: px(88), borderRadius: px(30), fontSize: px(34), paddingHorizontal: px(22) }} />
              </View>
              <View style={{ width: px(3), backgroundColor: '#E2E8F0' }} />
              <View style={{ flex: 1, paddingHorizontal: px(26) }}>
                <Rotulo>{t('taskTimeLock')}</Rotulo>
                <Marcar valor={f.travarAteHorario} onChange={(v) => set({ travarAteHorario: v })} rotulo={f.travarAteHorario ? t('yes') : t('no')} />
              </View>
              <View style={{ width: px(3), backgroundColor: '#E2E8F0' }} />
              <View style={{ flex: 1, paddingLeft: px(26) }}>
                <Rotulo>{t('taskAlarmToggle')}</Rotulo>
                <Marcar valor={f.alarme} onChange={(v) => set({ alarme: v })} rotulo={f.alarme ? t('yes') : t('no')} />
              </View>
            </View>
          ) : null}
        </Cartao></AlvoTour>

        <AlvoTour id="et_timer"><Cartao style={{ padding: px(30), marginTop: px(30) }}>
          <Titulo>{t('useTimer')}</Titulo>
          {!podeTimer ? <View style={{ marginBottom: px(16) }}><SeloPlano onPress={() => exigir('temporizador', () => undefined)} /></View> : null}
          <Marcar valor={usaTimer} onChange={(v) => { if (v && !podeTimer) return exigir('temporizador', () => undefined); setUsaTimer(v); if (v && !f.duracaoMin) set({ duracaoMin: 5 }); }} rotulo={usaTimer ? t('yes') : t('no')} />
          {usaTimer ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(24) }}>
              <Text style={{ flex: 1, fontSize: px(24), fontWeight: '900', color: C.slate2, textTransform: 'uppercase' }}>{t('timeMinutes')}</Text>
              <Mais onPress={() => set({ duracaoMin: Math.max(1, (f.duracaoMin || 5) - 1) })} txt="-" />
              <Text style={{ width: px(120), textAlign: 'center', fontSize: px(44), fontWeight: '900', color: C.ink }}>{f.duracaoMin || 5}</Text>
              <Mais onPress={() => set({ duracaoMin: Math.min(240, (f.duracaoMin || 5) + 1) })} txt="+" />
            </View>
          ) : null}
        </Cartao></AlvoTour>

        <Cartao style={{ padding: px(30), marginTop: px(30) }}>
          <Titulo>{t('starsPerTask')}</Titulo>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icone f="mci" n="star-four-points" size={px(40)} color={C.starDark} />
            <View style={{ flex: 1 }} />
            <Mais onPress={() => set({ estrelas: Math.max(0, (f.estrelas ?? 1) - 1) })} txt="-" />
            <Text style={{ width: px(120), textAlign: 'center', fontSize: px(44), fontWeight: '900', color: C.ink }}>{f.estrelas ?? 1}</Text>
            <Mais onPress={() => set({ estrelas: Math.min(20, (f.estrelas ?? 1) + 1) })} txt="+" />
          </View>
        </Cartao>

        {abasVoz.length ? (
          <Cartao style={{ padding: px(36), marginTop: px(30) }}>
            <Titulo>{tx(idioma, 'vozTabForTask')}</Titulo>
            <Text style={{ fontSize: px(21), fontWeight: '600', color: C.slate, marginTop: -px(12), marginBottom: px(18) }}>{tx(idioma, 'vozTabHint')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[{ id: '', nome: tx(idioma, 'vozTabNone') }, ...abasVoz].map((a) => {
                const on = (f.abaVozId || '') === a.id;
                return (
                  <Pressable key={a.id || 'none'} onPress={() => set({ abaVozId: a.id || undefined })} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={a.nome}
                    style={{ paddingHorizontal: px(22), height: px(68), borderRadius: px(34), marginRight: px(12), marginBottom: px(12), justifyContent: 'center', backgroundColor: on ? p.accent : C.white, borderWidth: px(2.5), borderColor: on ? p.accentDark : C.line2 }}>
                    <Text style={{ fontSize: px(22), fontWeight: '900', color: on ? p.onAccent : C.slate2, textTransform: 'uppercase' }}>{a.nome}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Cartao>
        ) : null}

        <AlvoTour id="et_icone"><Cartao style={{ padding: px(36), marginTop: px(30) }}>
          <Titulo>{t('taskIcon')}</Titulo>
          <View style={{ flexDirection: 'row' }}>
            <Toque onPress={() => escolherImagem(true)} rotulo={t('photo')} style={[{ flex: 1, height: px(138), borderRadius: px(36), backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }, sombra(6, '#3B82F6', 0.3)]}>
              <Icone n="camera" size={px(42)} color={C.white} />
              <Text style={{ color: C.white, fontWeight: '900', fontSize: px(22), marginTop: px(12), letterSpacing: px(0.8), textTransform: 'uppercase' }}>{t('photo')}</Text>
            </Toque>
            <View style={{ width: px(22) }} />
            <Toque onPress={() => escolherImagem(false)} rotulo={t('gallery')} style={[{ flex: 1, height: px(138), borderRadius: px(36), backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }, sombra(6, '#6366F1', 0.3)]}>
              <Icone n="image" size={px(42)} color={C.white} />
              <Text style={{ color: C.white, fontWeight: '900', fontSize: px(22), marginTop: px(12), letterSpacing: px(0.8), textTransform: 'uppercase' }}>{t('gallery')}</Text>
            </Toque>
          </View>
          {f.imagemUri ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: px(26) }}>
              <Image source={{ uri: f.imagemUri }} style={{ width: px(120), height: px(120), borderRadius: px(30), borderWidth: px(4), borderColor: p.accent }} />
              <Pressable onPress={() => set({ imagemUri: undefined })} style={{ marginLeft: px(20), padding: px(10) }}>
                <Text style={{ color: C.red, fontWeight: '900', fontSize: px(22) }}>✕ {t('delete')}</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: px(34) }}>
            {ORDEM_PICTOGRAMAS.map((k, i) => {
              const on = !f.imagemUri && f.icone === k;
              return (
                <Pressable key={k} onPress={() => set({ icone: k, imagemUri: undefined })} accessibilityLabel={k}
                  style={{ width: px(98), height: px(98), borderRadius: px(32), marginRight: i % 6 === 5 ? 0 : px(22), marginBottom: px(22), alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.soft : '#F8FAFC', borderWidth: px(3), borderColor: on ? p.accent : '#E2E8F0' }}>
                  <Text style={{ fontSize: px(52), lineHeight: px(64) }}>{PICTOGRAMAS[k]}</Text>
                </Pressable>
              );
            })}
          </View>
        </Cartao></AlvoTour>

        <View style={{ flexDirection: 'row', marginTop: px(40) }}>
          <Botao titulo={t('save')} onPress={salvar} disabled={!valido} cor={p.accent} corTexto={p.onAccent} borda={p.accentDark} alto={px(100)} style={{ flex: 1 }} />
          <View style={{ width: px(30) }} />
          <Botao titulo={t('close')} onPress={voltar} contorno alto={px(100)} style={{ flex: 1 }} />
        </View>
      </RolagemTour>
    </View>
  );
}

const Mais = ({ onPress, txt }: { onPress: () => void; txt: string }) => (
  <Toque onPress={onPress} rotulo={txt} style={{ width: px(84), height: px(84), borderRadius: px(26), borderWidth: px(2), borderColor: C.line2, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: px(40), fontWeight: '900', color: C.ink }}>{txt}</Text>
  </Toque>
);
