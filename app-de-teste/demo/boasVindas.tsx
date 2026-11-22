// PRIMEIRA ABERTURA (v2.0.2): 1) idioma → 2) login → 3) telas "como funciona" + primeiras recomendações
// → 4) no fim, o convite: Plano Completo / teste grátis / seguir no grátis (quem já pagou pula) → 5) tour do mascote.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type L = 'pt' | 'en' | 'es';

export function TelaIdioma({ atual, escolher }: { atual: L; escolher: (l: L) => void }) {
  const [sel, setSel] = useState<L>(atual);
  const op: [L, string, string][] = [['pt', '🇧🇷', 'Português'], ['en', '🇺🇸', 'English'], ['es', '🇪🇸', 'Español']];
  const titulo = { pt: 'Escolha o idioma', en: 'Choose your language', es: 'Elige el idioma' }[sel];
  const seguir = { pt: 'Continuar', en: 'Continue', es: 'Continuar' }[sel];
  return (
    <Modal visible animationType="none" onRequestClose={() => undefined}>
      <View accessibilityLabel="escolher idioma" style={{ flex: 1, backgroundColor: '#EFF6FF', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontSize: 46, textAlign: 'center' }}>💙</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 6 }}>Voz Amiga</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#334155', textAlign: 'center', marginTop: 4, marginBottom: 12 }}>{titulo}</Text>
          {op.map(([id, b, nome]) => (
            <Pressable key={id} onPress={() => setSel(id)} accessibilityRole="radio" accessibilityState={{ checked: sel === id }} accessibilityLabel={nome}
              style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: sel === id ? '#2563EB' : '#E2E8F0', backgroundColor: sel === id ? '#EFF6FF' : '#fff', borderRadius: 16, padding: 14, marginTop: 8 }}>
              <Text style={{ fontSize: 26 }}>{b}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginLeft: 12, flex: 1 }}>{nome}</Text>
              {sel === id ? <Text style={{ fontSize: 18, color: '#2563EB', fontWeight: '900' }}>✓</Text> : null}
            </Pressable>
          ))}
          <Pressable onPress={() => escolher(sel)} accessibilityRole="button" style={{ marginTop: 16, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{seguir}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const PASSOS: Record<L, { e: string; t: string; d: string }[]> = {
  pt: [
    { e: '👆', t: 'Toque e o app fala', d: 'Cada prancha tem um desenho e uma palavra. A criança toca e o Voz Amiga fala em voz alta.' },
    { e: '💬', t: 'Monte frases', d: 'Toque em várias pranchas para montar uma frase, por exemplo "eu quero água", e depois toque em FALAR.' },
    { e: '☀️', t: 'Rotina do dia', d: 'Crie a rotina da manhã, da tarde ou da noite com tarefas. A criança vê o que vem agora e ganha estrelas ao terminar.' },
    { e: '🔒', t: 'Área dos pais', d: 'Os botões AJUSTES, CRIAR PRANCHA e TRAVAR APP abrem segurando 3 segundos. Assim a criança não muda nada sem querer.' },
    { e: '🌱', t: 'Primeiras recomendações', d: 'Comece com poucas pranchas que a criança já usa no dia a dia. Use o app junto com ela, mostrando como funciona, e espere a resposta com calma. Vá acrescentando aos poucos.' },
  ],
  en: [
    { e: '👆', t: 'Tap and the app speaks', d: 'Each board has a picture and a word. The child taps it and Voz Amiga says it out loud.' },
    { e: '💬', t: 'Build sentences', d: 'Tap several boards to build a sentence, like "I want water", then tap SPEAK.' },
    { e: '☀️', t: 'Daily routine', d: 'Create a morning, afternoon or night routine with tasks. The child sees what comes next and earns stars.' },
    { e: '🔒', t: 'Parents area', d: 'SETTINGS, CREATE BOARD and LOCK APP open when held for 3 seconds, so the child does not change anything by accident.' },
    { e: '🌱', t: 'First tips', d: 'Start with a few boards the child already uses every day. Use the app together, show how it works and wait calmly for the answer. Add more little by little.' },
  ],
  es: [
    { e: '👆', t: 'Toca y la app habla', d: 'Cada tablero tiene un dibujo y una palabra. El niño lo toca y Voz Amiga lo dice en voz alta.' },
    { e: '💬', t: 'Forma frases', d: 'Toca varios tableros para formar una frase, como "yo quiero agua", y luego toca HABLAR.' },
    { e: '☀️', t: 'Rutina del día', d: 'Crea la rutina de la mañana, la tarde o la noche con tareas. El niño ve lo que sigue y gana estrellas.' },
    { e: '🔒', t: 'Área de los padres', d: 'AJUSTES, CREAR TABLERO y BLOQUEAR se abren manteniendo 3 segundos, así el niño no cambia nada sin querer.' },
    { e: '🌱', t: 'Primeras recomendaciones', d: 'Empieza con pocos tableros que el niño ya usa a diario. Usa la app junto con él, muestra cómo funciona y espera la respuesta con calma. Añade más poco a poco.' },
  ],
};
const UI = {
  pt: { prox: 'Próximo', volt: 'Voltar', pular: 'Pular', planoT: 'Quer tudo liberado?', planoD: 'No Plano Completo você tem pranchas sem limite, fotos e voz gravada, rotinas completas, relatórios e sem anúncios.', verPlanos: '👑 Ver o Plano Completo', testar: (d: number) => `🎁 Testar grátis por ${d} dias`, testarSub: 'Sem cartão. Você escolhe depois.', gratis: 'Continuar no plano grátis', gratisSub: 'Grátis: 15 pranchas, só emojis e 1 rotina com 5 tarefas.' },
  en: { prox: 'Next', volt: 'Back', pular: 'Skip', planoT: 'Want everything unlocked?', planoD: 'With the Full Plan you get unlimited boards, photos and recorded voice, full routines, reports and no ads.', verPlanos: '👑 See the Full Plan', testar: (d: number) => `🎁 Try it free for ${d} days`, testarSub: 'No card needed. Decide later.', gratis: 'Continue with the free plan', gratisSub: 'Free: 15 boards, emojis only and 1 routine with 5 tasks.' },
  es: { prox: 'Siguiente', volt: 'Atrás', pular: 'Saltar', planoT: '¿Quieres todo liberado?', planoD: 'Con el Plan Completo tienes tableros sin límite, fotos y voz grabada, rutinas completas, informes y sin anuncios.', verPlanos: '👑 Ver el Plan Completo', testar: (d: number) => `🎁 Probar gratis ${d} días`, testarSub: 'Sin tarjeta. Decides después.', gratis: 'Seguir con el plan gratis', gratisSub: 'Gratis: 15 tableros, solo emojis y 1 rutina con 5 tareas.' },
};

/** Telas de boas-vindas depois do login. `pago` = já tem o Plano Completo (pula o convite do final). */
export function BoasVindas({ idioma, pago, podeTestar, dias, fim, verPlanos, testar }: {
  idioma: L; pago: boolean; podeTestar: boolean; dias: number; fim: () => void; verPlanos: () => void; testar: () => void;
}) {
  const passos = PASSOS[idioma]; const u = UI[idioma];
  const total = passos.length + (pago ? 0 : 1);
  const [i, setI] = useState(0);
  const ultimoInfo = i === passos.length - 1;
  const proximo = () => { if (i + 1 >= total) fim(); else setI(i + 1); };
  const bt = (cor: string) => ({ backgroundColor: cor, borderRadius: 14, paddingVertical: 13, alignItems: 'center' as const, marginTop: 10 });
  return (
    <Modal visible animationType="none" onRequestClose={() => (i > 0 ? setI(i - 1) : undefined)}>
      <View accessibilityLabel="boas-vindas" style={{ flex: 1, backgroundColor: '#EFF6FF' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, maxWidth: 460, width: '100%', alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
              {Array.from({ length: total }).map((_, k) => <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, marginHorizontal: 3, backgroundColor: k === i ? '#2563EB' : '#CBD5E1' }} />)}
            </View>
            {i < passos.length ? (
              <>
                <Text style={{ fontSize: 64, textAlign: 'center' }}>{passos[i].e}</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 8 }}>{passos[i].t}</Text>
                <Text style={{ fontSize: 16, color: '#334155', textAlign: 'center', marginTop: 10, lineHeight: 23 }}>{passos[i].d}</Text>
                <Pressable onPress={proximo} accessibilityRole="button" accessibilityLabel={u.prox} style={bt('#2563EB')}>
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{u.prox} →</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <Pressable onPress={() => setI(Math.max(0, i - 1))} disabled={i === 0} hitSlop={8}><Text style={{ color: i === 0 ? '#CBD5E1' : '#475569', fontWeight: '800' }}>← {u.volt}</Text></Pressable>
                  {!ultimoInfo ? <Pressable onPress={() => setI(passos.length - (pago ? 1 : 0))} hitSlop={8} accessibilityLabel={u.pular}><Text style={{ color: '#475569', fontWeight: '800' }}>{u.pular}</Text></Pressable> : null}
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 58, textAlign: 'center' }}>👑</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 6 }}>{u.planoT}</Text>
                <Text style={{ fontSize: 15, color: '#334155', textAlign: 'center', marginTop: 8, lineHeight: 21 }}>{u.planoD}</Text>
                <Pressable onPress={() => { fim(); verPlanos(); }} accessibilityRole="button" style={bt('#7C3AED')}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{u.verPlanos}</Text>
                </Pressable>
                {podeTestar ? (
                  <Pressable onPress={() => { testar(); fim(); }} accessibilityRole="button" style={{ ...bt('#16A34A') }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{u.testar(dias)}</Text>
                    <Text style={{ color: '#DCFCE7', fontSize: 12, marginTop: 2 }}>{u.testarSub}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={fim} accessibilityRole="button" style={{ ...bt('#F1F5F9'), borderWidth: 1, borderColor: '#CBD5E1' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '900' }}>{u.gratis}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{u.gratisSub}</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
