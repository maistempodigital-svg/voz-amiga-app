// PRIMEIRA ABERTURA (v2.0.2): 1) idioma → 2) login → 3) telas "como funciona" + primeiras recomendações
// → 4) no fim, o convite: Plano Completo / teste grátis / seguir no grátis (quem já pagou pula) → 5) tour do mascote.
import React, { useRef, useState } from 'react';
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
    { e: '💬', t: 'O que é CAA', d: 'Comunicação Alternativa (CAA) dá à criança outro jeito de se expressar: com imagens e voz. Ela não atrapalha a fala. Ao contrário, ajuda a fala a aparecer.' },
    { e: '👆', t: 'Como o Voz Amiga funciona', d: 'A criança toca na prancha e o app fala. Juntando pranchas, ela monta frases como "eu quero água".' },
    { e: '🌱', t: 'Comece com pouco', d: 'Comece com 3 ou 4 pranchas do dia a dia: água, comer, banheiro, mamãe. Quando ela usar bem, acrescente mais. Muitas pranchas de uma vez confundem.' },
    { e: '📖', t: 'É como aprender a ler', d: 'Não acontece da noite para o dia. Pode levar semanas. Tenha paciência: mostre como usar, fale junto e comemore cada tentativa.' },
    { e: '☀️', t: 'Rotina sempre no mesmo horário', d: 'Monte a rotina da manhã, da tarde ou da noite. O app lembra a próxima tarefa na hora certa, e a criança sabe o que vem depois. Isso traz calma.' },
    { e: '🎁', t: 'Prêmios e recompensas', d: 'Cada tarefa feita vira estrela. Vocês escolhem os prêmios: um passeio, um desenho, um brinquedo. Recompense o esforço, não só o acerto.' },
    { e: '💙', t: 'Dicas para os pais', d: 'Deixe o celular sempre por perto. Use o app vocês também, para a criança copiar. Espere a resposta com calma, sem pressa.' },
  ],
  en: [
    { e: '💬', t: 'What is AAC', d: 'Augmentative and Alternative Communication (AAC) gives the child another way to express themselves, with pictures and voice. It does not hold speech back. It helps speech come.' },
    { e: '👆', t: 'How Voz Amiga works', d: 'The child taps a board and the app speaks. Putting boards together, they build sentences like "I want water".' },
    { e: '🌱', t: 'Start small', d: 'Start with 3 or 4 everyday boards: water, eat, bathroom, mom. When the child uses them well, add more. Too many boards at once is confusing.' },
    { e: '📖', t: 'It is like learning to read', d: 'It does not happen overnight. It can take weeks. Be patient: show how to use it, speak along and celebrate every try.' },
    { e: '☀️', t: 'Same routine, same time', d: 'Build a morning, afternoon or night routine. The app reminds the next task on time, so the child knows what comes next. That brings calm.' },
    { e: '🎁', t: 'Prizes and rewards', d: 'Every task done earns a star. You choose the prizes: a walk, a cartoon, a toy. Reward the effort, not only the result.' },
    { e: '💙', t: 'Tips for parents', d: 'Keep the phone always nearby. Use the app yourselves so the child can copy you. Wait calmly for the answer, with no rush.' },
  ],
  es: [
    { e: '💬', t: 'Qué es la CAA', d: 'La Comunicación Aumentativa y Alternativa (CAA) le da al niño otra forma de expresarse: con imágenes y voz. No frena el habla. Al contrario, ayuda a que aparezca.' },
    { e: '👆', t: 'Cómo funciona Voz Amiga', d: 'El niño toca un tablero y la app habla. Juntando tableros forma frases como "yo quiero agua".' },
    { e: '🌱', t: 'Empieza con poco', d: 'Empieza con 3 o 4 tableros del día a día: agua, comer, baño, mamá. Cuando los use bien, añade más. Muchos tableros a la vez confunden.' },
    { e: '📖', t: 'Es como aprender a leer', d: 'No pasa de un día para otro. Puede llevar semanas. Ten paciencia: muestra cómo usarla, habla junto y celebra cada intento.' },
    { e: '☀️', t: 'Rutina siempre a la misma hora', d: 'Arma la rutina de la mañana, la tarde o la noche. La app recuerda la próxima tarea a su hora y el niño sabe qué viene después. Eso trae calma.' },
    { e: '🎁', t: 'Premios y recompensas', d: 'Cada tarea hecha es una estrella. Ustedes eligen los premios: un paseo, un dibujo, un juguete. Premia el esfuerzo, no solo el acierto.' },
    { e: '💙', t: 'Consejos para los padres', d: 'Deja el celular siempre cerca. Usen la app ustedes también, para que el niño copie. Espera la respuesta con calma, sin prisa.' },
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
  const x0 = useRef(0);
  const proximo = () => { if (i + 1 >= total) fim(); else setI(i + 1); };
  const bt = (cor: string) => ({ backgroundColor: cor, borderRadius: 14, paddingVertical: 13, alignItems: 'center' as const, marginTop: 10 });
  return (
    <Modal visible animationType="none" onRequestClose={() => (i > 0 ? setI(i - 1) : undefined)}>
      <View accessibilityLabel="boas-vindas" style={{ flex: 1, backgroundColor: '#EFF6FF' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          <View onTouchStart={(e) => { x0.current = e.nativeEvent.pageX; }}
            onTouchEnd={(e) => { const d = e.nativeEvent.pageX - x0.current; if (i < passos.length && d < -60) proximo(); else if (d > 60 && i > 0) setI(i - 1); }}
            style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, maxWidth: 460, width: '100%', alignSelf: 'center' }}>
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
