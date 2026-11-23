// PRIMEIRA ABERTURA (v2.0.7): 1) idioma → 2) login → 3) 5 dicas → 4) o que vem em cada plano → 5) PLANOS
// (planos ativos com preço da Play + "Continuar no plano gratuito"; quem já pagou pula) → 6) tour do mascote.
// A mesma tela de planos aparece quando o teste grátis acaba. Cores do autismo (azul, vermelho, amarelo, verde).
import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Mascote } from '../src/rotina-amiga/v14/Mascote';
import { JANELA_PADRAO, JanelaSabado, pagamentoTravado } from '../src/rotina-amiga/v14/premium';
import { usePlanosVenda } from './planosVenda';

type L = 'pt' | 'en' | 'es';
/** Cores do autismo (as peças do quebra-cabeça) + roxo do Plano Completo. */
export const CORES_TEA = {
  azul: '#1E6FD9', azulClaro: '#E8F1FD', vermelho: '#E0393E', vermelhoClaro: '#FDECEC', amarelo: '#F2B705', amareloClaro: '#FFF7DB',
  verde: '#2E9E4F', verdeClaro: '#E9F7EE', roxo: '#7C3AED', roxoClaro: '#F3EEFF', tinta: '#0F172A', texto: '#334155', linha: '#E2E8F0', fundo: '#F4F7FC',
};
const C = CORES_TEA;
const SEQ = [C.azul, C.vermelho, C.amarelo, C.verde, C.azul];
const SEQ_CLARO = [C.azulClaro, C.vermelhoClaro, C.amareloClaro, C.verdeClaro, C.azulClaro];

/** Faixa colorida (4 cores do autismo) no topo das telas. */
const Faixa = () => (
  <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
    {[C.azul, C.vermelho, C.amarelo, C.verde].map((c) => <View key={c} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);

export function TelaIdioma({ atual, escolher }: { atual: L; escolher: (l: L) => void }) {
  const [sel, setSel] = useState<L>(atual);
  const op: [L, string, string, string][] = [['pt', '🇧🇷', 'Português', C.azul], ['en', '🇺🇸', 'English', C.vermelho], ['es', '🇪🇸', 'Español', C.verde]];
  const titulo = { pt: 'Escolha o idioma', en: 'Choose your language', es: 'Elige el idioma' }[sel];
  const seguir = { pt: 'Continuar', en: 'Continue', es: 'Continuar' }[sel];
  return (
    <Modal visible animationType="none" onRequestClose={() => undefined}>
      <View accessibilityLabel="escolher idioma" style={{ flex: 1, backgroundColor: C.fundo, justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 26, padding: 20, maxWidth: 440, width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: C.linha }}>
          <Faixa />
          <View style={{ alignItems: 'center' }}><Mascote tam={84} /></View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.tinta, textAlign: 'center', marginTop: 6 }}>Voz Amiga</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.texto, textAlign: 'center', marginTop: 4, marginBottom: 10 }}>{titulo}</Text>
          {op.map(([id, b, nome, cor]) => (
            <Pressable key={id} onPress={() => setSel(id)} accessibilityRole="radio" accessibilityState={{ checked: sel === id }} accessibilityLabel={nome}
              style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2.5, borderColor: sel === id ? cor : C.linha, backgroundColor: sel === id ? `${cor}14` : '#fff', borderRadius: 18, padding: 14, marginTop: 8 }}>
              <Text style={{ fontSize: 26 }}>{b}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: C.tinta, marginLeft: 12, flex: 1 }}>{nome}</Text>
              {sel === id ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: cor, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text></View> : null}
            </Pressable>
          ))}
          <Pressable onPress={() => escolher(sel)} accessibilityRole="button" style={{ marginTop: 16, backgroundColor: C.azul, borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{seguir}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** As 5 dicas da entrada (também aparecem em Ajustes › Sugestões). 'MASCOTE' = desenho do mascote. */
export const PASSOS_DICAS: Record<string, { e: string; t: string; d: string }[]> = {
  pt: [
    { e: '💬', t: 'O que é CAA', d: 'Comunicação Alternativa (CAA) dá à criança outro jeito de se expressar: com imagens e voz. Ela não atrapalha a fala. Ao contrário, ajuda a fala a aparecer.' },
    { e: 'MASCOTE', t: 'Voz Amiga + Rotina Amiga', d: 'Dois em um, com o nosso mascote ajudando. O Voz Amiga dá voz à criança com as pranchas. A Rotina Amiga organiza o dia com tarefas, horários e prêmios.' },
    { e: '👆', t: 'Como funciona', d: 'A criança toca na prancha e o app fala. Tocando em várias, ela monta frases como "EU QUERO ÁGUA". O app também sugere frases com a palavra tocada.' },
    { e: '☀️', t: 'A rotina, em resumo', d: 'Monte um turno: manhã, tarde, noite ou um momento como "banheiro" ou "escola". O app mostra a próxima tarefa, lembra na hora certa e a criança ganha estrelas para trocar por prêmios.' },
    { e: '🌱', t: 'Comece com poucos botões', d: 'Comece com 3 ou 4 pranchas do dia a dia: água, comer, banheiro, mamãe. Use junto com a criança, mostre como tocar e comemore cada tentativa. Ela aprende no tempo dela, como quem aprende a ler. Aos poucos, vocês acrescentam mais.' },
  ],
  en: [
    { e: '💬', t: 'What is AAC', d: 'Augmentative and Alternative Communication (AAC) gives the child another way to express themselves, with pictures and voice. It does not hold speech back. It helps speech come.' },
    { e: 'MASCOTE', t: 'Voz Amiga + Rotina Amiga', d: 'Two in one, with our mascot helping. Voz Amiga gives the child a voice with boards. Rotina Amiga organizes the day with tasks, times and prizes.' },
    { e: '👆', t: 'How it works', d: 'The child taps a board and the app speaks. Tapping several, they build sentences like "I WANT WATER". The app also suggests sentences with the tapped word.' },
    { e: '☀️', t: 'The routine, in short', d: 'Set up one period: morning, afternoon, night, or a moment like "bathroom" or "school". The app shows the next task, reminds on time, and the child earns stars to trade for prizes.' },
    { e: '🌱', t: 'Start with a few buttons', d: 'Start with 3 or 4 everyday boards: water, eat, bathroom, mom. Use it together, show how to tap and celebrate every try. The child learns at their own pace, like learning to read. Little by little, add more.' },
  ],
  es: [
    { e: '💬', t: 'Qué es la CAA', d: 'La Comunicación Aumentativa y Alternativa (CAA) le da al niño otra forma de expresarse: con imágenes y voz. No frena el habla. Al contrario, ayuda a que aparezca.' },
    { e: 'MASCOTE', t: 'Voz Amiga + Rotina Amiga', d: 'Dos en uno, con nuestra mascota ayudando. Voz Amiga le da voz al niño con los tableros. Rotina Amiga organiza el día con tareas, horarios y premios.' },
    { e: '👆', t: 'Cómo funciona', d: 'El niño toca un tablero y la app habla. Tocando varios, forma frases como "YO QUIERO AGUA". La app también sugiere frases con la palabra tocada.' },
    { e: '☀️', t: 'La rutina, en resumen', d: 'Arma un turno: mañana, tarde, noche o un momento como "baño" o "escuela". La app muestra la próxima tarea, avisa a su hora y el niño gana estrellas para cambiar por premios.' },
    { e: '🌱', t: 'Empieza con pocos botones', d: 'Empieza con 3 o 4 tableros del día a día: agua, comer, baño, mamá. Úsenla juntos, muestra cómo tocar y celebra cada intento. Aprende a su ritmo, como quien aprende a leer. Poco a poco, añadan más.' },
  ],
};

const UI = {
  pt: { prox: 'Próximo →', volt: '← Voltar', comparaT: 'O que vem em cada plano', gratisT: 'Grátis', pagoT: '👑 Plano Completo',
    gratisL: ['10 pranchas (com 3 de sugestão)', 'Só emojis', 'Pacote Bebidas', '1 turno com até 5 tarefas', '1 prêmio por vez', 'Montar frases e frases prontas', 'Relatório de 7 dias', 'Com anúncio'],
    pagoL: ['Pranchas sem limite', 'Fotos, galeria e desenhos', 'Gravar a própria voz', 'Todos os pacotes e criação rápida', 'Vários turnos e tarefas', 'Temporizador e alarme', 'Prêmios e metas sem limite', 'Relatório completo', 'Travar o app', 'Frases personalizadas', 'Sem anúncio'],
    planosT: 'Escolha como continuar', planosD: 'Preço da Play Store, na sua moeda.', maisEscolhido: 'MAIS ESCOLHIDO', assinar: 'Assinar', comprar: 'Comprar',
    vitaB: ['Tudo liberado para sempre', 'Sem mensalidade', 'Inclui as funções novas'], subsB: ['Tudo liberado', 'Renova automaticamente', 'Cancela quando quiser na Play Store'],
    precoCarregando: 'preço na Play Store', testar: (d: number) => `🎁 Testar grátis por ${d} dias`, testarD: 'Sem cartão. Libera tudo. No fim, você escolhe.',
    continuarGratis: 'Continuar no plano gratuito', gratisResumo: '10 pranchas, só emojis, 1 turno com até 5 tarefas e anúncio.',
    sabado: 'Pagamentos ficam pausados de sexta 17h até sábado 20h. Logo logo será liberado.', acabouT: 'Seu teste grátis acabou', acabouD: 'Tudo o que vocês criaram está guardado. Escolha um plano para continuar com tudo, ou siga no gratuito.' },
  en: { prox: 'Next →', volt: '← Back', comparaT: 'What each plan includes', gratisT: 'Free', pagoT: '👑 Full Plan',
    gratisL: ['10 boards (incl. 3 suggestions)', 'Emojis only', 'Drinks pack', '1 period with up to 5 tasks', '1 prize at a time', 'Build sentences and ready phrases', '7-day report', 'With ads'],
    pagoL: ['Unlimited boards', 'Photos, gallery and drawings', 'Record your own voice', 'All packs and quick create', 'Several periods and tasks', 'Timer and alarm', 'Unlimited prizes and goals', 'Full report', 'Lock the app', 'Custom phrases', 'No ads'],
    planosT: 'Choose how to continue', planosD: 'Play Store price, in your currency.', maisEscolhido: 'MOST CHOSEN', assinar: 'Subscribe', comprar: 'Buy',
    vitaB: ['Everything unlocked forever', 'No monthly fee', 'Includes new features'], subsB: ['Everything unlocked', 'Renews automatically', 'Cancel anytime in the Play Store'],
    precoCarregando: 'price in the Play Store', testar: (d: number) => `🎁 Try it free for ${d} days`, testarD: 'No card. Unlocks everything. Decide at the end.',
    continuarGratis: 'Continue with the free plan', gratisResumo: '10 boards, emojis only, 1 period with up to 5 tasks, and ads.',
    sabado: 'Payments are paused from Friday 5 pm to Saturday 8 pm. They will be back soon.', acabouT: 'Your free trial has ended', acabouD: 'Everything you created is saved. Choose a plan to keep everything, or stay on the free plan.' },
  es: { prox: 'Siguiente →', volt: '← Atrás', comparaT: 'Qué incluye cada plan', gratisT: 'Gratis', pagoT: '👑 Plan Completo',
    gratisL: ['10 tableros (con 3 de sugerencia)', 'Solo emojis', 'Paquete Bebidas', '1 turno con hasta 5 tareas', '1 premio a la vez', 'Formar frases y frases listas', 'Informe de 7 días', 'Con anuncio'],
    pagoL: ['Tableros sin límite', 'Fotos, galería y dibujos', 'Grabar tu propia voz', 'Todos los paquetes y creación rápida', 'Varios turnos y tareas', 'Temporizador y alarma', 'Premios y metas sin límite', 'Informe completo', 'Bloquear la app', 'Frases personalizadas', 'Sin anuncios'],
    planosT: 'Elige cómo continuar', planosD: 'Precio de la Play Store, en tu moneda.', maisEscolhido: 'MÁS ELEGIDO', assinar: 'Suscribirse', comprar: 'Comprar',
    vitaB: ['Todo liberado para siempre', 'Sin mensualidad', 'Incluye las funciones nuevas'], subsB: ['Todo liberado', 'Se renueva automáticamente', 'Cancela cuando quieras en la Play Store'],
    precoCarregando: 'precio en la Play Store', testar: (d: number) => `🎁 Probar gratis ${d} días`, testarD: 'Sin tarjeta. Libera todo. Al final, tú eliges.',
    continuarGratis: 'Seguir con el plan gratis', gratisResumo: '10 tableros, solo emojis, 1 turno con hasta 5 tareas y anuncio.',
    sabado: 'Los pagos quedan en pausa del viernes 17h al sábado 20h. Pronto se liberan.', acabouT: 'Tu prueba gratis terminó', acabouD: 'Todo lo que crearon está guardado. Elige un plan para seguir con todo, o sigue en el gratis.' },
};

const Item = ({ ic, t, cor }: { ic: string; t: string; cor: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 }}>
    <Text style={{ width: 20, color: cor, fontWeight: '900' }}>{ic}</Text>
    <Text style={{ flex: 1, fontSize: 13.5, color: C.texto, lineHeight: 18 }}>{t}</Text>
  </View>
);

/**
 * Tela dos PLANOS: planos ativos (com preço e benefícios), teste grátis (se puder) e, embaixo, destacado,
 * "Continuar no plano gratuito". `acabou` = aparece porque o teste de 30 dias terminou.
 */
export function TelaPlanos({ idioma, podeTestar, dias, testar, continuarGratis, aviso, janela = JANELA_PADRAO, acabou }: {
  idioma: L; podeTestar: boolean; dias: number; testar: () => void; continuarGratis: () => void; aviso: (t: string) => void; janela?: JanelaSabado; acabou?: boolean;
}) {
  const u = UI[idioma];
  const { planos, fazerCompra, comprando } = usePlanosVenda(aviso);
  const travado = pagamentoTravado(Date.now(), -new Date().getTimezoneOffset(), janela);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
        <Faixa />
        {acabou ? (
          <View accessibilityLabel="teste premium acabou" style={{ backgroundColor: C.amareloClaro, borderRadius: 16, borderWidth: 1.5, borderColor: C.amarelo, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: C.tinta }}>⏳ {u.acabouT}</Text>
            <Text style={{ fontSize: 13.5, color: C.texto, marginTop: 4, lineHeight: 19 }}>{u.acabouD}</Text>
          </View>
        ) : null}
        <Text style={{ fontSize: 23, fontWeight: '900', color: C.tinta, textAlign: 'center' }}>{u.planosT}</Text>
        <Text style={{ fontSize: 13, color: C.texto, textAlign: 'center', marginTop: 4, marginBottom: 6 }}>{u.planosD}</Text>
        {travado ? <Text accessibilityLabel="pagamento travado no sábado" style={{ backgroundColor: C.azulClaro, color: C.azul, borderRadius: 12, padding: 10, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>🌅 {u.sabado}</Text> : null}
        {planos.map((p, i) => {
          const cor = p.vitalicio ? C.roxo : [C.azul, C.verde, C.vermelho][i % 3];
          return (
            <View key={p.id} accessibilityLabel={`plano ${p.titulo}`} style={{ marginTop: 14, borderRadius: 20, borderWidth: 2.5, borderColor: cor, backgroundColor: p.vitalicio ? C.roxoClaro : '#fff', padding: 14 }}>
              {p.vitalicio ? <View style={{ position: 'absolute', top: -12, right: 14, backgroundColor: C.roxo, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{u.maisEscolhido}</Text></View> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: C.tinta, flex: 1 }}>👑 {p.titulo}</Text>
                <Text style={{ fontSize: p.preco ? 20 : 12, fontWeight: '900', color: cor, marginLeft: 8 }}>{p.preco || u.precoCarregando}</Text>
              </View>
              {(p.vitalicio ? u.vitaB : u.subsB).map((b) => <Item key={b} ic="✓" t={b} cor={cor} />)}
              <Pressable disabled={travado || comprando} onPress={() => { fazerCompra(p.id).then((ok) => { if (ok) continuarGratis(); }); }} accessibilityRole="button" accessibilityLabel={`assinar ${p.titulo}`}
                style={{ marginTop: 10, backgroundColor: travado ? '#CBD5E1' : cor, borderRadius: 14, paddingVertical: 13, alignItems: 'center', opacity: comprando ? 0.6 : 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{p.vitalicio ? u.comprar : u.assinar}</Text>
              </Pressable>
            </View>
          );
        })}
        {podeTestar ? (
          <Pressable onPress={() => { testar(); continuarGratis(); }} accessibilityRole="button" accessibilityLabel="testar grátis"
            style={{ marginTop: 14, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: C.verde, backgroundColor: C.verdeClaro, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: C.verde, fontSize: 16, fontWeight: '900' }}>{u.testar(dias)}</Text>
            <Text style={{ color: C.texto, fontSize: 12.5, marginTop: 3, textAlign: 'center' }}>{u.testarD}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      {/* embaixo, separado e destacado: continuar no grátis */}
      <View style={{ padding: 14, borderTopWidth: 1, borderColor: C.linha, backgroundColor: '#fff' }}>
        <Pressable onPress={continuarGratis} accessibilityRole="button" accessibilityLabel={u.continuarGratis}
          style={{ borderRadius: 16, borderWidth: 2.5, borderColor: C.azul, backgroundColor: C.azulClaro, paddingVertical: 13, alignItems: 'center' }}>
          <Text style={{ color: C.azul, fontSize: 16.5, fontWeight: '900' }}>{u.continuarGratis}</Text>
          <Text style={{ color: C.texto, fontSize: 12, marginTop: 3, textAlign: 'center', paddingHorizontal: 8 }}>{u.gratisResumo}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Entrada depois do login: 5 dicas → o que vem em cada plano → planos (quem já pagou pula). */
export function BoasVindas({ idioma, pago, podeTestar, dias, fim, testar, aviso, janela }: {
  idioma: L; pago: boolean; podeTestar: boolean; dias: number; fim: () => void; testar: () => void; aviso: (t: string) => void; janela?: JanelaSabado;
  /** compatibilidade: abrir a tela de planos do app (não usado mais na entrada) */ verPlanos?: () => void;
}) {
  const passos = PASSOS_DICAS[idioma] || PASSOS_DICAS.pt; const u = UI[idioma];
  const nDicas = passos.length;
  const total = nDicas + (pago ? 0 : 2);
  const [i, setI] = useState(0);
  const x0 = useRef(0);
  const proximo = () => { if (i + 1 >= total) fim(); else setI(i + 1); };
  const cor = SEQ[i % SEQ.length]; const corClara = SEQ_CLARO[i % SEQ_CLARO.length];
  const naPlanos = !pago && i === nDicas + 1;
  return (
    <Modal visible animationType="none" onRequestClose={() => (i > 0 ? setI(i - 1) : undefined)}>
      <View accessibilityLabel="boas-vindas" style={{ flex: 1, backgroundColor: C.fundo }}>
        {naPlanos ? (
          <TelaPlanos idioma={idioma} podeTestar={podeTestar} dias={dias} testar={testar} continuarGratis={fim} aviso={aviso} janela={janela} />
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }}>
            <View onTouchStart={(e) => { x0.current = e.nativeEvent.pageX; }}
              onTouchEnd={(e) => { const d = e.nativeEvent.pageX - x0.current; if (d < -60) proximo(); else if (d > 60 && i > 0) setI(i - 1); }}
              style={{ backgroundColor: '#fff', borderRadius: 26, padding: 20, maxWidth: 460, width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: C.linha }}>
              <Faixa />
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
                {Array.from({ length: total }).map((_, k) => <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, marginHorizontal: 3, backgroundColor: k === i ? cor : '#CBD5E1' }} />)}
              </View>
              {i < nDicas ? (
                <>
                  <View style={{ alignSelf: 'center', width: 116, height: 116, borderRadius: 58, backgroundColor: corClara, borderWidth: 3, borderColor: cor, alignItems: 'center', justifyContent: 'center' }}>
                    {passos[i].e === 'MASCOTE' ? <Mascote tam={92} /> : <Text style={{ fontSize: 56 }}>{passos[i].e}</Text>}
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: C.tinta, textAlign: 'center', marginTop: 12 }}>{passos[i].t}</Text>
                  <Text style={{ fontSize: 16, color: C.texto, textAlign: 'center', marginTop: 10, lineHeight: 23 }}>{passos[i].d}</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 21, fontWeight: '900', color: C.tinta, textAlign: 'center', marginBottom: 10 }}>{u.comparaT}</Text>
                  <View style={{ borderRadius: 18, borderWidth: 2, borderColor: C.verde, backgroundColor: C.verdeClaro, padding: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: C.verde }}>{u.gratisT}</Text>
                    {u.gratisL.map((t) => <Item key={t} ic="✓" t={t} cor={C.verde} />)}
                  </View>
                  <View style={{ borderRadius: 18, borderWidth: 2, borderColor: C.roxo, backgroundColor: C.roxoClaro, padding: 12, marginTop: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: C.roxo }}>{u.pagoT}</Text>
                    {u.pagoL.map((t) => <Item key={t} ic="👑" t={t} cor={C.roxo} />)}
                  </View>
                </>
              )}
              <Pressable onPress={proximo} accessibilityRole="button" accessibilityLabel="Próximo" style={{ marginTop: 16, backgroundColor: cor, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: cor === C.amarelo ? C.tinta : '#fff', fontSize: 17, fontWeight: '900' }}>{u.prox}</Text>
              </Pressable>
              <Pressable onPress={() => setI(Math.max(0, i - 1))} disabled={i === 0} hitSlop={8} style={{ marginTop: 12, alignSelf: 'center' }}>
                <Text style={{ color: i === 0 ? '#CBD5E1' : '#475569', fontWeight: '800' }}>{u.volt}</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
