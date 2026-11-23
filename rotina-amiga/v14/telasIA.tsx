// VOZ AMIGA v14.3 — TELAS DA IA E DO "CRIAR PRANCHA FALANDO"
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRotina } from '../estado';
import { C, Cartao, Rolagem } from '../componentes/ui';
import { AlvoTour } from '../tour';
import { Idioma, Tarefa } from '../tipos';
import * as A from '../logica/acoes';
import { B, Caixa, Secao, T, Topo, X } from './telas';
import { anunciarFala, Mascote, MascoteDesenho, CORES_MARCA, pararFalaMascote } from './Mascote';
import { completarFraseIA, pranchaPorTemaIA } from './ia';
import { CREDITO_ARASAAC, DICA_ESPECIALISTAS, FONTE_ESPECIALISTAS, INICIO_BOTOES, O_QUE_E_ARASAAC } from './especialistas';
import { ETAPAS_RAPIDAS, montarRapida, TAREFA_DO_ITEM, TITULO_RAPIDA } from './criacaoRapida';
import {
  apagarModelo, baixarModelo, CHAVE_CHATGPT, chaveValida, hostIA, IdModeloIA, lerListaIA, mascararChave, mbTexto, MODELO_CHATGPT_PADRAO,
  MODELOS_IA, MSG_CHATGPT, perguntarChatGPT, porcento, promptExtrair, useSituacaoIA,
} from './iaEstado';

// =============================================================== peças pequenas que outras telas usam
/** Recomendação dos especialistas em destaque + a fonte em letra pequena (só texto, não é para clicar). */
export function DicaEspecialistas({ idioma, compacta }: { idioma: Idioma; compacta?: boolean }) {
  return (
    <View accessibilityLabel="recomendação dos especialistas" style={{ backgroundColor: '#EEF2FF', borderRadius: 16, borderWidth: 2, borderColor: '#A5B4FC', padding: 12, marginVertical: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '900', color: '#4338CA', letterSpacing: 0.6 }}>⭐ {X(idioma, 'SEGUNDO ESPECIALISTAS', 'ACCORDING TO SPECIALISTS', 'SEGÚN ESPECIALISTAS')}</Text>
      <Text style={{ fontSize: compacta ? 13 : 14.5, fontWeight: '800', color: '#1E1B4B', lineHeight: compacta ? 18 : 20, marginTop: 4 }}>{DICA_ESPECIALISTAS[idioma]}</Text>
      <Text style={{ fontSize: 10.5, color: '#64748B', lineHeight: 14, marginTop: 6 }}>{FONTE_ESPECIALISTAS[idioma]}</Text>
    </View>
  );
}

/** Crédito do ARASAAC com a explicação do que é (texto oficial pedido pelo site). */
export function CreditoArasaac({ idioma }: { idioma: Idioma }) {
  return (
    <View accessibilityLabel="créditos ARASAAC" style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginTop: 8 }}>
      <Text style={{ fontSize: 12, color: '#334155', lineHeight: 17 }}>ℹ️ {O_QUE_E_ARASAAC[idioma]}</Text>
      <Text style={{ fontSize: 10.5, color: '#64748B', lineHeight: 14, marginTop: 6 }}>{CREDITO_ARASAAC[idioma]}</Text>
    </View>
  );
}

/** Barra de progresso do download. */
const Barra = ({ p, cor = '#7C3AED' }: { p: number; cor?: string }) => (
  <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', overflow: 'hidden', marginTop: 8 }}>
    <View style={{ width: `${Math.max(3, p)}%`, height: 12, borderRadius: 6, backgroundColor: cor }} />
  </View>
);

/** Um modelo de IA: BAIXAR → "Baixando 34% (26 de 77 MB)" → "✓ Pronto no celular". */
export function CartaoModeloIA({ id, compacto }: { id: IdModeloIA; compacto?: boolean }) {
  const { idioma, v14, mudarV14, hostV14, mostrarAviso } = useRotina();
  const sits = useSituacaoIA();
  const s = sits[id];
  const m = MODELOS_IA.find((x) => x.id === id)!;
  const [semWifi, setSemWifi] = useState(false);
  const iniciar = async (forcar?: boolean) => {
    if (!forcar && v14.ia.soWifi) {
      const wifi = hostV14.noWifi ? await hostV14.noWifi().catch(() => false) : false;
      if (!wifi) { setSemWifi(true); return; }
    }
    setSemWifi(false);
    baixarModelo(id, idioma).then(() => { if (id === 'gemma' && hostIA()) mudarV14({ ia: { ...v14.ia, estado: 'pronta', modelo: 'gemma3-270m' } }); });
  };
  const pc = porcento(s);
  return (
    <Cartao style={{ marginBottom: 10, borderWidth: 2, borderColor: s.st === 'pronto' ? '#86EFAC' : '#E9D5FF' }}>
      <T s="b">{m.emoji} {m.nome[idioma]}</T>
      {!compacto ? <T style={{ marginTop: 4, fontSize: 13.5 }}>{m.faz[idioma]}</T> : null}
      <T s="cap" style={{ marginTop: 4 }}>📦 {m.mb} MB · ✈️ {X(idioma, 'depois funciona sem internet', 'then works offline', 'después funciona sin internet')}</T>
      <View style={{ marginTop: 8 }} accessibilityLabel={`situação ${id}`}>
        {s.st === 'checando' ? <ActivityIndicator color="#7C3AED" /> : null}
        {s.st === 'nao' || s.st === 'erro' ? (
          <>
            {s.st === 'erro' ? <Text style={{ color: '#B91C1C', fontWeight: '800', marginBottom: 6 }}>⚠️ {s.erro}</Text> : null}
            <B titulo={X(idioma, `⬇️ Baixar (${m.mb} MB)`, `⬇️ Download (${m.mb} MB)`, `⬇️ Descargar (${m.mb} MB)`)} cor="#7C3AED" onPress={() => iniciar()} />
            {semWifi ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: '#92400E', fontWeight: '800' }}>📶 {X(idioma, 'Você não está no Wi-Fi. Baixar assim usa seus dados do celular.', 'You are not on Wi-Fi. Downloading now uses your mobile data.', 'No estás en Wi-Fi. Descargar así usa tus datos.')}</Text>
                <View style={{ height: 6 }} />
                <B titulo={X(idioma, 'Baixar mesmo assim', 'Download anyway', 'Descargar igual')} contorno onPress={() => iniciar(true)} />
              </View>
            ) : null}
          </>
        ) : null}
        {s.st === 'baixando' ? (
          <View accessibilityLabel={`baixando ${id}`}>
            <Text style={{ fontWeight: '900', color: '#6D28D9' }}>⏳ {X(idioma, 'Baixando', 'Downloading', 'Descargando')} {pc}% ({mbTexto(s.feito)} {X(idioma, 'de', 'of', 'de')} {mbTexto(s.total)})</Text>
            <Barra p={pc} />
            <T s="cap" style={{ marginTop: 4 }}>{X(idioma, 'Pode continuar usando o app. Não feche o app até terminar.', 'You can keep using the app. Don’t close the app until it finishes.', 'Puedes seguir usando la app. No la cierres hasta que termine.')}</T>
          </View>
        ) : null}
        {s.st === 'pronto' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontWeight: '900', color: '#15803D' }} accessibilityLabel={`pronto ${id}`}>✓ {X(idioma, 'Pronto no celular', 'Ready on the phone', 'Listo en el celular')}</Text>
            {!compacto ? <Pressable onPress={() => { apagarModelo(id); if (id === 'gemma') mudarV14({ ia: { ...v14.ia, estado: 'nenhuma', modelo: undefined } }); mostrarAviso(X(idioma, 'Apagado do celular.', 'Deleted from the phone.', 'Borrado del celular.')); }}
              accessibilityRole="button" accessibilityLabel={`apagar ${id}`} style={{ paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center' }}><Text style={{ fontWeight: '800', color: '#64748B' }}>🗑️ {X(idioma, 'Apagar', 'Delete', 'Borrar')}</Text></Pressable> : null}
          </View>
        ) : null}
      </View>
    </Cartao>
  );
}

// =============================================================== CHATGPT DOS PAIS
const useChaveChatGPT = () => {
  const { hostV14 } = useRotina();
  const [chave, setChave] = useState<string | null>(null);
  useEffect(() => { hostV14.segredo?.ler(CHAVE_CHATGPT).then((v) => setChave(v && chaveValida(v) ? v : null), () => setChave(null)); }, [hostV14.segredo]);
  const gravar = async (v: string | null) => { await hostV14.segredo?.gravar(CHAVE_CHATGPT, v); setChave(v); };
  return { chave, gravar, temOnde: !!hostV14.segredo };
};

function CartaoChatGPT() {
  const { idioma, v14, mostrarAviso } = useRotina();
  const { chave, gravar, temOnde } = useChaveChatGPT();
  const [nova, setNova] = useState('');
  const [msg, setMsg] = useState('');
  const [testando, setTestando] = useState(false);
  const modelo = (v14.ia as { modeloNuvem?: string }).modeloNuvem || MODELO_CHATGPT_PADRAO;
  const testar = async (k: string) => {
    setTestando(true); setMsg('');
    try { await perguntarChatGPT(k, modelo, [{ role: 'user', content: 'Responda só: ok' }], 5); setMsg(MSG_CHATGPT.ok[idioma]); }
    catch (e) { const c = (e as Error).message as 'chave' | 'saldo' | 'erro'; setMsg(MSG_CHATGPT[c in MSG_CHATGPT ? c : 'erro'][idioma]); }
    setTestando(false);
  };
  return (
    <Cartao style={{ marginBottom: 10, borderWidth: 2, borderColor: chave ? '#86EFAC' : '#BAE6FD' }}>
      <T s="b">🤖 {X(idioma, 'ChatGPT (IA personalizada, com o seu saldo)', 'ChatGPT (custom AI, with your credit)', 'ChatGPT (IA personalizada, con tu saldo)')}</T>
      <T style={{ marginTop: 4, fontSize: 13.5 }}>{X(idioma,
        'Mais esperta para entender o que você conta. Usa internet e é paga por uso (centavos por conversa), com o saldo que VOCÊ carrega na OpenAI.',
        'Smarter at understanding what you say. Uses internet and is pay-per-use (cents per chat), with credit YOU add at OpenAI.',
        'Más lista para entender lo que cuentas. Usa internet y se paga por uso (centavos por charla), con el saldo que TÚ cargas en OpenAI.')}</T>
      <Caixa cor="#F0F9FF" borda="#BAE6FD">
        <Text style={{ fontSize: 13, color: '#075985', lineHeight: 19 }}>{X(idioma,
          '1. Entre em platform.openai.com e crie a conta.\n2. Em "Billing", carregue um saldo (ex.: US$ 5).\n3. Em "API keys", crie uma chave e copie.\n4. Cole aqui e toque em Salvar.',
          '1. Go to platform.openai.com and create an account.\n2. In "Billing", add credit (e.g. US$ 5).\n3. In "API keys", create a key and copy it.\n4. Paste it here and tap Save.',
          '1. Entra en platform.openai.com y crea la cuenta.\n2. En "Billing", carga saldo (ej.: US$ 5).\n3. En "API keys", crea una clave y cópiala.\n4. Pégala aquí y toca Guardar.')}</Text>
      </Caixa>
      {!temOnde ? <T s="cap" style={{ color: '#B91C1C' }}>{X(idioma, 'Este aparelho ainda não tem onde guardar a chave com segurança.', 'This device has no safe place to keep the key yet.', 'Este aparato aún no tiene dónde guardar la clave con seguridad.')}</T> : chave ? (
        <View style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: '900', color: '#15803D' }} accessibilityLabel="chave salva">✓ {X(idioma, 'Chave salva', 'Key saved', 'Clave guardada')}: {mascararChave(chave)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={{ flex: 1 }}><B titulo={testando ? '…' : X(idioma, 'Testar', 'Test', 'Probar')} cor="#0284C7" onPress={() => testar(chave)} /></View>
            <View style={{ width: 8 }} />
            <View style={{ flex: 1 }}><B titulo={X(idioma, 'Apagar chave', 'Delete key', 'Borrar clave')} contorno onPress={() => { gravar(null); setMsg(''); mostrarAviso(X(idioma, 'Chave apagada do celular.', 'Key deleted from the phone.', 'Clave borrada del celular.')); }} /></View>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 6 }}>
          <TextInput value={nova} onChangeText={(v) => setNova(v.replace(/\s/g, '').slice(0, 220))} placeholder="sk-..." placeholderTextColor={C.faint} secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel="chave do ChatGPT"
            style={{ height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.line, paddingHorizontal: 16, fontSize: 15, backgroundColor: '#FFFFFF' }} />
          <View style={{ height: 8 }} />
          <B titulo={X(idioma, 'Salvar chave', 'Save key', 'Guardar clave')} cor="#0284C7" disabled={!chaveValida(nova)} onPress={async () => { await gravar(nova.trim()); setNova(''); testar(nova.trim()); }} />
        </View>
      )}
      {msg ? <Text style={{ marginTop: 8, fontWeight: '800', color: msg === MSG_CHATGPT.ok[idioma] ? '#15803D' : '#B45309' }}>{msg}</Text> : null}
      <T s="cap" style={{ marginTop: 8 }}>🔒 {X(idioma, 'A chave fica só neste celular: não vai no backup, no relatório nem para ninguém. Nunca mostre a chave a outras pessoas.', 'The key stays only on this phone: not in the backup, the report or sent to anyone. Never show it to others.', 'La clave queda solo en este celular: no va en la copia, el informe ni a nadie. Nunca la muestres.')}</T>
      <T s="cap">{X(idioma, 'Modelo', 'Model', 'Modelo')}: {modelo}</T>
    </Cartao>
  );
}

// =============================================================== TELA DA IA
export function TelaIA() {
  const { idioma, hostV14, mostrarAviso, mudar } = useRotina();
  const [palavra, setPalavra] = useState('');
  const [tema, setTema] = useState('');
  const frase = palavra.trim() ? completarFraseIA(palavra, idioma) : undefined;
  const prancha0 = tema.trim() ? pranchaPorTemaIA(tema, idioma) : undefined;
  // v14.6: tema que as regras não conhecem → a IA baixada (Gemma) ou o ChatGPT dos pais sugere as palavras
  const sitsIA = useSituacaoIA();
  const { chave } = useChaveChatGPT();
  const [daIA, setDaIA] = useState<{ tema: string; itens: [string, string][] } | undefined>();
  const [pensandoIA, setPensandoIA] = useState(false);
  const temIA = !!chave || (sitsIA.gemma.st === 'pronto' && !!hostV14.ia?.gerar);
  const pedirIA = async () => {
    const t = tema.trim().slice(0, 40); if (!t || pensandoIA) return;
    setPensandoIA(true);
    try {
      const msgs = promptExtrair(X(idioma, `Liste 10 palavras simples para uma prancha de comunicação sobre: ${t}`, `List 10 simple words for a communication board about: ${t}`, `Lista 10 palabras simples para un tablero de comunicación sobre: ${t}`), idioma);
      const r = chave ? await perguntarChatGPT(chave, MODELO_CHATGPT_PADRAO, msgs, 80) : await hostV14.ia!.gerar!(msgs, 60);
      const itens = lerListaIA(r).slice(0, 10).map((w) => [w.charAt(0).toUpperCase() + w.slice(1), '💬'] as [string, string]);
      setDaIA(itens.length ? { tema: t, itens } : undefined);
      if (!itens.length) mostrarAviso(X(idioma, 'A IA não sugeriu nada agora. Tente outra palavra.', 'The AI suggested nothing now. Try another word.', 'La IA no sugirió nada. Prueba otra palabra.'));
    } catch { mostrarAviso(X(idioma, 'A IA não respondeu agora (internet ou saldo?).', 'The AI did not answer now (internet or credit?).', 'La IA no respondió (¿internet o saldo?).')); }
    setPensandoIA(false);
  };
  const prancha = prancha0 || (daIA && daIA.tema === tema.trim().slice(0, 40) ? { titulo: daIA.tema.charAt(0).toUpperCase() + daIA.tema.slice(1), itens: daIA.itens } : undefined);
  const aprovarFrase = () => {
    if (!frase) return;
    const palavras = frase.replace(/,/g, '').split(/\s+/).filter(Boolean).slice(0, 12);
    mudar((s) => ({ ...s, config: { ...s.config, frasesLista: [...(s.config.frasesLista || []), { id: `ia${Date.now().toString(36)}`, grupo: 'pedir' as const, palavras }].slice(-60) } }));
    mostrarAviso(X(idioma, '✅ Frase aprovada: entrou nas frases prontas.', '✅ Approved: added to ready phrases.', '✅ Aprobada: entró en las frases listas.'));
    setPalavra('');
  };
  return (
    <View style={{ flex: 1 }}>
      <Topo kicker={X(idioma, 'DEFINIÇÕES', 'SETTINGS', 'AJUSTES')} titulo={X(idioma, 'IA (opcional)', 'AI (optional)', 'IA (opcional)')} sub={X(idioma, 'A IA só sugere. Você sempre aprova. Nunca conversa com a criança.', 'AI only suggests. You always approve. It never chats with the child.', 'La IA solo sugiere. Tú siempre apruebas. Nunca conversa con el niño.')} />
      <Rolagem>
        <Caixa cor="#FDF4FF" borda="#F0ABFC">
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#701A75' }}>{X(idioma, 'Como funciona, em 3 frases', 'How it works, in 3 sentences', 'Cómo funciona, en 3 frases')}</Text>
          <Text style={{ fontSize: 13.5, color: '#4A044E', lineHeight: 20, marginTop: 4 }}>{X(idioma,
            '• Sem baixar nada, o app já sugere frases e pranchas por regras.\n• IA no celular: grátis. Toque em BAIXAR uma vez (no Wi-Fi) e ela sugere palavras para qualquer tema, sem internet.\n• ChatGPT: IA personalizada, mais esperta. Você usa a sua conta e o seu saldo na OpenAI.',
            '• Without downloading, the app already suggests phrases and boards by rules.\n• On-phone AI: free. Tap DOWNLOAD once (on Wi-Fi) and it works offline.\n• ChatGPT: custom, smarter AI. You use your own OpenAI account and credit.',
            '• Sin descargar nada, la app ya sugiere frases y tableros por reglas.\n• IA en el celular: gratis. Toca DESCARGAR una vez (en Wi-Fi) y funciona sin internet.\n• ChatGPT: IA personalizada, más lista. Usas tu cuenta y tu saldo de OpenAI.')}</Text>
        </Caixa>
        <Secao titulo={X(idioma, 'BAIXAR PARA O CELULAR (GRÁTIS)', 'DOWNLOAD TO THE PHONE (FREE)', 'DESCARGAR AL CELULAR (GRATIS)')} />
        {!hostV14.ia ? <T s="cap" style={{ marginBottom: 8 }}>{X(idioma, 'Este aparelho ainda não tem a parte que roda a IA.', 'This device does not have the AI engine yet.', 'Este aparato aún no tiene la parte que ejecuta la IA.')}</T> : null}
        <CartaoModeloIA id="gemma" />
        <Secao titulo={X(idioma, 'OU USE O SEU CHATGPT', 'OR USE YOUR CHATGPT', 'O USA TU CHATGPT')} />
        <CartaoChatGPT />
        <Secao titulo={X(idioma, 'EXPERIMENTE (VOCÊ APROVA)', 'TRY IT (YOU APPROVE)', 'PRUÉBALO (TÚ APRUEBAS)')} />
        <Cartao style={{ marginBottom: 10 }}>
          <T s="b">💬 {X(idioma, 'Completar frase', 'Complete a sentence', 'Completar frase')}</T>
          <TextInput value={palavra} onChangeText={(v) => setPalavra(v.slice(0, 40))} placeholder={X(idioma, 'Ex.: água', 'E.g. water', 'Ej.: agua')} accessibilityLabel="palavra para completar" placeholderTextColor={C.faint} style={{ height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.line, paddingHorizontal: 16, marginTop: 8, fontSize: 16 }} />
          {frase ? <><Text style={{ marginTop: 8, fontSize: 16, fontWeight: '800', color: '#1D4ED8' }}>✨ "{frase}"</Text><View style={{ height: 8 }} /><B titulo={X(idioma, 'Aprovar e guardar', 'Approve and save', 'Aprobar y guardar')} cor={CORES_MARCA.verde} onPress={aprovarFrase} /></> : palavra.trim() ? <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'Sem sugestão para essa palavra.', 'No suggestion for this word.', 'Sin sugerencia para esa palabra.')}</T> : null}
        </Cartao>
        <Cartao>
          <T s="b">🧺 {X(idioma, 'Montar prancha por tema', 'Build a board from a theme', 'Armar tablero por tema')}</T>
          <TextInput value={tema} onChangeText={(v) => setTema(v.slice(0, 40))} placeholder={X(idioma, 'Ex.: banho, escola, festa, praia', 'E.g. bath, school, party, beach', 'Ej.: baño, escuela, fiesta, playa')} accessibilityLabel="tema da prancha" placeholderTextColor={C.faint} style={{ height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.line, paddingHorizontal: 16, marginTop: 8, fontSize: 16 }} />
          {prancha ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>{prancha.itens.map(([t, e]) => <View key={t} style={{ backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 3 }}><Text>{e} {t}</Text></View>)}</View>
              <View style={{ height: 8 }} />
              {hostV14.adicionarPranchas ? <B titulo={X(idioma, `Aprovar e criar ${prancha.itens.length} botões`, `Approve and create ${prancha.itens.length} buttons`, `Aprobar y crear ${prancha.itens.length} botones`)} cor={CORES_MARCA.verde} onPress={() => { const n = hostV14.adicionarPranchas?.(prancha.titulo, prancha.itens) || 0; mostrarAviso(X(idioma, `✅ ${n} botões criados na aba ${prancha.titulo}.`, `✅ ${n} buttons created in ${prancha.titulo}.`, `✅ ${n} botones creados en ${prancha.titulo}.`)); setTema(''); }} /> : null}
            </>
          ) : tema.trim() ? (
            <View>
              <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'As regras do app ainda não conhecem esse tema. Tente: banho, escola, parque, médico, dormir, festa, praia.', 'The app’s rules don’t know this theme yet. Try: bath, school, park, doctor, bedtime, party, beach.', 'Las reglas de la app aún no conocen ese tema. Prueba: baño, escuela, parque, médico, dormir, fiesta, playa.')}</T>
              {temIA ? <View style={{ marginTop: 8 }}><B titulo={pensandoIA ? X(idioma, 'Pensando…', 'Thinking…', 'Pensando…') : X(idioma, '✨ Pedir sugestões à IA', '✨ Ask the AI for suggestions', '✨ Pedir sugerencias a la IA')} cor="#7C3AED" onPress={pedirIA} /></View>
                : <T s="cap" style={{ marginTop: 4 }}>{X(idioma, 'Com a IA baixada ou o seu ChatGPT, ela sugere as palavras de qualquer tema.', 'With the downloaded AI or your ChatGPT, it suggests words for any theme.', 'Con la IA descargada o tu ChatGPT, sugiere palabras de cualquier tema.')}</T>}
            </View>
          ) : null}
        </Cartao>
      </Rolagem>
    </View>
  );
}

// =============================================================== DESTAQUE DENTRO DO CRIAR PRANCHA
/** v14.6: "CRIAÇÃO RÁPIDA" — o pai vai tocando nas perguntas da rotina (substitui o "criar falando"). */
export function DestaqueCriacaoRapida({ antes }: { /** o app fecha a tela dele antes (ex.: Criar prancha), para voltar direto à tela da criança no fim */ antes?: () => void }) {
  const { idioma, abrir, pode, pedirPlano } = useRotina();
  const livre = pode('criacaoRapida');
  return (
    <AlvoTour id="cp_rapida">
      <Pressable onPress={() => { if (!livre) { pedirPlano('criacaoRapida'); return; } antes?.(); abrir({ nome: 'v14', tela: 'rapida' }); }} accessibilityRole="button" accessibilityLabel="CRIAÇÃO RÁPIDA"
        style={({ pressed }) => [{ borderRadius: 22, backgroundColor: '#7C3AED', padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: '#F97316', transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
        <Mascote tam={64} vivo />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: '#F97316', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10.5 }}>✨ {X(idioma, 'MAIS FÁCIL: SÓ TOCAR', 'EASIEST: JUST TAP', 'MÁS FÁCIL: SOLO TOCAR')}</Text></View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 19, marginTop: 4 }}>⚡ {X(idioma, 'CRIAÇÃO RÁPIDA', 'QUICK CREATE', 'CREACIÓN RÁPIDA')}{livre ? '' : ' 👑'}</Text>
          <Text style={{ color: '#EDE9FE', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{X(idioma, 'O app pergunta a rotina (manhã, escola, tarde, noite) e você só toca nos botões. Cada um já vai para a categoria certa.', 'The app asks about the routine (morning, school, afternoon, night) and you just tap the buttons. Each goes to the right category.', 'La app pregunta la rutina (mañana, escuela, tarde, noche) y tú solo tocas los botones. Cada uno va a la categoría correcta.')}</Text>
        </View>
      </Pressable>
    </AlvoTour>
  );
}

// =============================================================== CRIAÇÃO RÁPIDA (tocando)
export function TelaCriacaoRapida() {
  const { idioma, hostV14, mudar, estado, mostrarAviso, fecharTudo, falar, limites, assinante, pode, responderPlano, pedirPlano, voltar } = useRotina();
  const limite = assinante ? 999 : Math.max(1, limites.botoesPorVez || 10);
  // v2.0.7: a criação rápida é do Plano Completo, por qualquer caminho que abrir esta tela
  const livre = pode('criacaoRapida');
  useEffect(() => { if (!livre) { voltar(); pedirPlano('criacaoRapida'); } }, [livre]); // eslint-disable-line react-hooks/exhaustive-deps
  // passo 0 = boas-vindas; 1..N = perguntas; N+1 = revisar
  const [passo, setPasso] = useState(0);
  const [esc, setEsc] = useState<string[]>([]);
  const [criado, setCriado] = useState(false);
  const rol = useRef<ScrollView>(null);
  const N = ETAPAS_RAPIDAS.length;
  const etapa = passo >= 1 && passo <= N ? ETAPAS_RAPIDAS[passo - 1] : undefined;
  const falarMascote = (t: string) => { anunciarFala(t); falar(t); };
  useEffect(() => { rol.current?.scrollTo({ y: 0, animated: false }); if (etapa) falarMascote(etapa.pergunta[idioma]); }, [passo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => pararFalaMascote(), []);
  const alternar = (k: string) => {
    if (esc.includes(k)) { setEsc(esc.filter((x) => x !== k)); return; }
    if (esc.length >= limite) {
      mostrarAviso(X(idioma, `👑 No plano gratuito dá para criar até ${limite} botões de uma vez. Desmarque um para trocar, ou conheça o Plano Completo.`, `👑 The free plan creates up to ${limite} buttons at once. Uncheck one to swap, or see the Full Plan.`, `👑 El plan gratuito crea hasta ${limite} botones a la vez. Desmarca uno para cambiar, o conoce el Plan Completo.`));
      return;
    }
    setEsc([...esc, k]);
  };
  const grupos = montarRapida(esc, idioma, limite);
  const criar = () => {
    if (!hostV14.adicionarPranchas || !esc.length) return;
    let n = 0;
    for (const g of grupos) n += hostV14.adicionarPranchas(g.aba, g.itens, g.tema) || 0;
    // as rotinas escolhidas também entram na Rotina do dia (se ainda não existirem e o plano deixar)
    const novas: Tarefa[] = [];
    for (const [item, t] of Object.entries(TAREFA_DO_ITEM)) {
      const et = ETAPAS_RAPIDAS.find((e) => e.itens.some((x) => x.id === item));
      const it = et?.itens.find((x) => x.id === item);
      if (!et || !it || !esc.includes(`${et.id}:${item}`)) continue;
      const titulo = it.t[idioma];
      if (!estado.abas.some((a) => a.id === t.abaId) || estado.tarefas.some((x) => x.titulo.toLowerCase() === titulo.toLowerCase())) continue;
      if (!pode('tarefa', t.abaId) || novas.some((x) => x.abaId === t.abaId)) continue;
      novas.push({ id: `cr_${item}_${Date.now().toString(36)}`, abaId: t.abaId, titulo, icone: t.emoji, travarAteHorario: false, alarme: false, duracaoMin: 0, dias: [0, 1, 2, 3, 4, 5, 6] });
    }
    if (novas.length) mudar((s) => novas.reduce((acc, t) => A.salvarTarefa(acc, t), s));
    setCriado(true);
    const m = X(idioma, `✅ Pronto! ${n} botões criados${novas.length ? ` e ${novas.length} tarefa(s) na Rotina` : ''}.`, `✅ Done! ${n} buttons created${novas.length ? ` and ${novas.length} routine task(s)` : ''}.`, `✅ ¡Listo! ${n} botones creados${novas.length ? ` y ${novas.length} tarea(s)` : ''}.`);
    mostrarAviso(m); falarMascote(m.replace('✅ ', ''));
  };
  const Barrinha = () => (
    <View style={{ flexDirection: 'row', marginBottom: 10 }} accessibilityLabel={`passo ${passo} de ${N + 1}`}>
      {Array.from({ length: N + 1 }, (_, k) => <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, marginHorizontal: 2, backgroundColor: k < passo ? '#7C3AED' : '#E2E8F0' }} />)}
    </View>
  );
  const Contador = () => (
    <View accessibilityLabel="limite do plano" style={{ backgroundColor: assinante ? '#F0FDF4' : '#FEF3C7', borderRadius: 12, borderWidth: 1.5, borderColor: assinante ? '#86EFAC' : '#FCD34D', padding: 10, marginTop: 8 }}>
      <Text style={{ fontWeight: '900', color: assinante ? '#166534' : '#92400E' }}>{assinante ? X(idioma, `👑 Plano Completo: ${esc.length} escolhidos (sem limite).`, `👑 Full Plan: ${esc.length} chosen (no limit).`, `👑 Plan Completo: ${esc.length} elegidos (sin límite).`) : X(idioma, `${esc.length} de ${limite} botões do plano gratuito.`, `${esc.length} of ${limite} buttons on the free plan.`, `${esc.length} de ${limite} botones del plan gratuito.`)}</Text>
      {!assinante && esc.length >= limite ? <Pressable onPress={() => responderPlano(true)} accessibilityRole="button" accessibilityLabel="ver Plano Completo"><Text style={{ color: '#B45309', fontWeight: '900', marginTop: 4 }}>👑 {X(idioma, 'Quer mais de uma vez? Conheça o Plano Completo ›', 'Want more at once? See the Full Plan ›', '¿Quieres más a la vez? Conoce el Plan Completo ›')}</Text></Pressable> : null}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Topo kicker={X(idioma, 'CRIAR PRANCHA · GUIADO', 'CREATE CARD · GUIDED', 'CREAR TARJETA · GUIADO')} titulo={`⚡ ${TITULO_RAPIDA[idioma]}`} sub={X(idioma, 'Só tocar. Nada é criado sem você tocar em CRIAR.', 'Just tap. Nothing is created until you tap CREATE.', 'Solo tocar. Nada se crea sin que toques CREAR.')} />
      <ScrollView ref={rol} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
        <Barrinha />
        {passo === 0 ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Mascote tam={86} vivo />
              <View style={{ flex: 1, marginLeft: 8, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 12 }}>
                <Text style={{ fontSize: 15.5, lineHeight: 21, color: '#0F172A', fontWeight: '700' }}>{X(idioma, 'Oi! Vou fazer 6 perguntas rápidas sobre o dia da criança. É só tocar nos botões. Cada um já vai para a categoria certa.', 'Hi! I will ask 6 quick questions about the child’s day. Just tap the buttons. Each one goes to the right category.', '¡Hola! Haré 6 preguntas rápidas sobre el día del niño. Solo toca los botones. Cada uno va a la categoría correcta.')}</Text>
              </View>
            </View>
            <DicaEspecialistas idioma={idioma} />
            <B titulo={X(idioma, 'COMEÇAR ›', 'START ›', 'EMPEZAR ›')} cor="#7C3AED" onPress={() => setPasso(1)} />
          </View>
        ) : null}
        {etapa ? (
          <View accessibilityLabel={`pergunta ${etapa.id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Mascote tam={70} vivo />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#7C3AED' }}>{passo}/{N} · {etapa.emoji} {etapa.aba[idioma].toUpperCase()}</Text>
                <Text style={{ fontSize: 19, fontWeight: '900', color: '#0F172A', marginTop: 2 }}>{etapa.pergunta[idioma]}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>💡 {etapa.dica[idioma]}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginHorizontal: -4 }}>
              {etapa.itens.map((it) => {
                const k = `${etapa.id}:${it.id}`; const on = esc.includes(k); const travado = !on && esc.length >= limite;
                return (
                  <Pressable key={k} onPress={() => alternar(k)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`opção ${it.t[idioma]}`}
                    style={({ pressed }) => [{ width: '33.33%', padding: 4, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                    <View style={{ minHeight: 92, borderRadius: 16, borderWidth: 3, borderColor: on ? '#22C55E' : '#E2E8F0', backgroundColor: on ? '#F0FDF4' : travado ? '#F8FAFC' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 6, opacity: travado ? 0.55 : 1 }}>
                      <Text style={{ fontSize: 30 }}>{it.emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{it.t[idioma]}</Text>
                      {on ? <Text style={{ position: 'absolute', top: 4, right: 6, fontSize: 14 }}>✅</Text> : travado ? <Text style={{ position: 'absolute', top: 4, right: 6, fontSize: 12 }}>👑</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Contador />
          </View>
        ) : null}
        {passo === N + 1 ? (
          <View accessibilityLabel="revisar criação rápida">
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#0F172A', marginBottom: 6 }}>{X(idioma, 'Confira e toque em CRIAR', 'Check and tap CREATE', 'Revisa y toca CREAR')}</Text>
            {grupos.length ? grupos.map((g) => (
              <Cartao key={g.id} style={{ marginBottom: 8 }}>
                <T s="b">{g.emoji} {g.aba} <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>({g.itens.length})</Text></T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{g.itens.map(([t, e]) => <View key={t} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1.5, borderColor: '#86EFAC', paddingHorizontal: 8, paddingVertical: 4, margin: 3 }}><Text>{e}</Text><Text style={{ marginLeft: 4, fontWeight: '800', color: '#14532D' }}>{t}</Text></View>)}</View>
              </Cartao>
            )) : <T s="cap">{X(idioma, 'Nenhum botão escolhido. Volte e toque em alguns.', 'No buttons chosen. Go back and tap some.', 'Ningún botón elegido. Vuelve y toca algunos.')}</T>}
            <Contador />
            <View style={{ height: 8 }} />
            {!criado ? <B titulo={X(idioma, `✅ CRIAR ${esc.length} BOTÕES`, `✅ CREATE ${esc.length} BUTTONS`, `✅ CREAR ${esc.length} BOTONES`)} cor={CORES_MARCA.verde} disabled={!esc.length || !hostV14.adicionarPranchas} onPress={criar} />
              : <B titulo={X(idioma, 'Ver na tela da criança', 'See on the child’s screen', 'Ver en la pantalla del niño')} cor="#2563EB" onPress={fecharTudo} />}
          </View>
        ) : null}
      </ScrollView>
      {passo >= 1 && passo <= N ? (
        <View style={{ flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <Pressable onPress={() => setPasso(passo - 1)} accessibilityRole="button" accessibilityLabel="Voltar pergunta" style={{ height: 52, paddingHorizontal: 16, borderRadius: 26, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: '#475569' }}>‹</Text></Pressable>
          <View style={{ width: 8 }} />
          {etapa?.podePular ? <><Pressable onPress={() => setPasso(passo + 1)} accessibilityRole="button" accessibilityLabel="Pular pergunta" style={{ height: 52, paddingHorizontal: 14, borderRadius: 26, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: '#475569' }}>{X(idioma, 'Pular', 'Skip', 'Saltar')}</Text></Pressable><View style={{ width: 8 }} /></> : null}
          <View style={{ flex: 1 }}><B titulo={passo === N ? X(idioma, 'VER E CRIAR ›', 'REVIEW ›', 'REVISAR ›') : X(idioma, 'PRÓXIMA ›', 'NEXT ›', 'SIGUIENTE ›')} cor="#7C3AED" onPress={() => setPasso(passo + 1)} /></View>
        </View>
      ) : null}
    </View>
  );
}
