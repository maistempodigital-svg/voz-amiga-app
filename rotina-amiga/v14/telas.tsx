// VOZ AMIGA v14 — TELAS DAS FUNÇÕES NOVAS (só para os pais; abrem por cima, atrás da trava "segurar + continha").
// Linguagem simples, pt/en/es. Nada aqui usa internet.
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRotina } from '../estado';
import { Botao, C, Cabecalho, Cartao, Divisor, GrupoOpcoes, Rolagem } from '../componentes/ui';
import { StyleProp, TextStyle } from 'react-native';
import { AlvoTour, useTour } from '../tour';
import { Idioma, TelaV14 } from '../tipos';
import { chaveDia } from '../logica/tempo';
import { GRUPOS_RECURSO, IdRecurso, RECURSOS, recursoDef } from './recursos';
import { MSG_ERRO_BACKUP } from './backup';
import { FRASE_TESTE, GUIA_PACOTE_VOZ, MOTORES, PERFIL_IDADE } from './vozes';
import { AVISO_SEMANAS, DUVIDAS, FONTES, MENSAGENS_APOIO, missaoDoDia, TEXTO_LEMBRETE } from './pais';
import { LICOES, PARTES_CURSO } from './curso';
import { completarFraseIA, MODELO_GEMMA, OPCOES_IA, podeBaixarIA, pranchaPorTemaIA } from './ia';
import { NIVEIS, VISUAIS } from './crescer';
import { resumoSenha, senhaValida } from './seguranca';
import { MascoteDesenho, CORES_MARCA } from './Mascote';
import { DicaEspecialistas, TelaCriacaoRapida, TelaIA } from './telasIA';
import { IdadeVoz } from './config';
import { FONTE_CONQUISTAS, progressoDoMes } from './conquistasMes';

export const X = (i: Idioma, pt: string, en: string, es: string) => (i === 'en' ? en : i === 'es' ? es : pt);
/** Nome curto e legível de uma voz do celular (ex.: "pt-br-x-afs-local" → "AFS · no celular"). */
const nomeVoz = (v: string) => { const m = /x-([a-z]{3})-(local|network)/i.exec(v); return m ? `${m[1].toUpperCase()} · ${m[2] === 'local' ? 'offline' : 'online'}` : v.length > 22 ? `${v.slice(0, 20)}…` : v; };

/** Textos maiores e sem caixa-alta: estas telas são para pais leigos lerem com calma. */
const ESTILO_T = { b: { fontSize: 15.5, fontWeight: '900', color: C.ink }, cap: { fontSize: 12.5, color: C.slate2, lineHeight: 17, marginTop: 2 }, p: { fontSize: 14, color: C.ink2, lineHeight: 20 }, h3: { fontSize: 17, fontWeight: '900', color: C.ink } } as const;
export const T = ({ s = 'p', style, children }: { s?: keyof typeof ESTILO_T; style?: StyleProp<TextStyle>; children?: React.ReactNode }) => <Text style={[ESTILO_T[s] as TextStyle, style]}>{children}</Text>;
export const B = (p: React.ComponentProps<typeof Botao>) => <Botao alto={50} {...p} />;
/** Título de seção legível. */
export const Secao = ({ titulo }: { titulo: string }) => <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#334155', letterSpacing: 0.4, marginTop: 20, marginBottom: 2 }}>{titulo}</Text>;

/** Qual tela de ajustes abre cada função. */
export const TELA_DO_RECURSO: Partial<Record<IdRecurso, TelaV14>> = {
  backupAuto: 'backup', senhaPais: 'senha', emergencia: 'emergencia', vozes: 'vozes', curso: 'curso', missaoDia: 'pais', duvidas: 'duvidas',
  niveis: 'crescer', gradeCrescente: 'crescer', visualIdade: 'crescer', ia: 'ia', tempoToque: 'conforto', estilosBotao: 'conforto', modoTablet: 'conforto',
};

export function Topo({ titulo, sub, kicker }: { titulo: string; sub?: string; kicker?: string }) {
  const { voltar, idioma } = useRotina();
  return <Cabecalho kicker={kicker || X(idioma, 'MAIS FUNÇÕES', 'MORE FEATURES', 'MÁS FUNCIONES')} titulo={titulo} sub={sub} onVoltar={voltar} corKicker={CORES_MARCA.laranja} />;
}

export const Caixa = ({ cor = '#FFF7ED', borda = '#FED7AA', children }: { cor?: string; borda?: string; children: React.ReactNode }) => (
  <View style={{ backgroundColor: cor, borderWidth: 1.5, borderColor: borda, borderRadius: 18, padding: 14, marginBottom: 12 }}>{children}</View>
);

const Linha = ({ emoji, titulo, texto, direita, onPress, rotulo }: { emoji: string; titulo: string; texto?: string; direita?: React.ReactNode; onPress?: () => void; rotulo?: string }) => {
  const corpo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text style={{ fontSize: 26, width: 38 }}>{emoji}</Text>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: C.ink }}>{titulo}</Text>
        {texto ? <Text style={{ fontSize: 12.5, color: C.slate2, marginTop: 2, lineHeight: 17 }}>{texto}</Text> : null}
      </View>
      {direita}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={rotulo || titulo}>{corpo}</Pressable> : corpo;
};

/** ESCOLHAS EM BOTÕES GRANDES (nada de setas ou listas): toque e pronto. */
export const Opcoes = <T extends string | number>({ valor, opcoes, onChange, colunas = 3 }: { valor: T; opcoes: { v: T; r: string; d?: string; desativado?: boolean }[]; onChange: (v: T) => void; colunas?: number }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -4 }}>
    {opcoes.map((o) => {
      const sel = valor === o.v;
      return (
        <Pressable key={String(o.v)} disabled={o.desativado} onPress={() => onChange(o.v)} accessibilityRole="radio" accessibilityState={{ selected: sel, checked: sel, disabled: !!o.desativado }} aria-checked={sel} aria-selected={sel} accessibilityLabel={o.r}
          style={({ pressed }) => [{ width: `${100 / colunas}%` as unknown as number, padding: 4, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <View style={{ minHeight: o.d ? 74 : 54, borderRadius: 16, borderWidth: 2.5, borderColor: sel ? '#2563EB' : '#E2E8F0', backgroundColor: o.desativado ? '#F1F5F9' : sel ? '#2563EB' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 8, opacity: o.desativado ? 0.6 : 1 }}>
            <Text style={{ fontWeight: '900', color: sel ? '#FFFFFF' : '#0F172A', fontSize: 14, textAlign: 'center' }} numberOfLines={2}>{sel ? '✓ ' : ''}{o.r}</Text>
            {o.d ? <Text style={{ color: sel ? '#DBEAFE' : '#64748B', fontSize: 11.5, textAlign: 'center', marginTop: 3, lineHeight: 15 }} numberOfLines={3}>{o.d}</Text> : null}
          </View>
        </Pressable>
      );
    })}
  </View>
);

/** Botão LIGA/DESLIGA grande e claro (verde = ligado). */
const Chave = ({ valor, onChange, rotulo }: { valor: boolean; onChange: (v: boolean) => void; rotulo?: string }) => {
  const { idioma } = useRotina();
  return (
    <Pressable onPress={() => onChange(!valor)} accessibilityRole="switch" accessibilityState={{ checked: valor }} accessibilityLabel={rotulo}
      style={({ pressed }) => [{ minWidth: 112, height: 44, borderRadius: 22, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: valor ? '#16A34A' : '#FFFFFF', borderWidth: 2.5, borderColor: valor ? '#16A34A' : '#CBD5E1', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <Text style={{ fontWeight: '900', fontSize: 13.5, color: valor ? '#FFFFFF' : '#475569' }}>{valor ? X(idioma, '✓ LIGADO', '✓ ON', '✓ ENCENDIDO') : X(idioma, 'DESLIGADO', 'OFF', 'APAGADO')}</Text>
    </Pressable>
  );
};

/** Cartão de uma função: o que faz + botão grande de ligar + botão de ajustes. */
function CartaoFuncao({ id }: { id: IdRecurso }) {
  const { idioma, v14, mudarV14, recurso, dispRecurso, abrir, exigir, mostrarAviso } = useRotina();
  const r = recursoDef(id);
  const disp = dispRecurso(id);
  const ligado = typeof v14.recursos[id] === 'boolean' ? !!v14.recursos[id] : r.padrao;
  const tela = TELA_DO_RECURSO[id];
  const ativo = recurso(id);
  const ligar = (v: boolean) => {
    mudarV14({ recursos: { ...v14.recursos, [id]: v } });
    mostrarAviso(v ? X(idioma, `✅ ${r.nome.pt}: LIGADO`, `✅ ${r.nome.en}: ON`, `✅ ${r.nome.es}: ENCENDIDO`) : X(idioma, `${r.nome.pt}: desligado`, `${r.nome.en}: off`, `${r.nome.es}: apagado`));
  };
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: ativo ? '#86EFAC' : '#E2E8F0', padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ativo ? '#DCFCE7' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ fontSize: 28 }}>{r.emoji}</Text></View>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '900', color: '#0F172A' }}>{r.nome[idioma]}</Text>
      </View>
      <Text style={{ fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 20 }}>{disp === 'bloqueado' ? X(idioma, 'Indisponível no momento.', 'Unavailable right now.', 'No disponible por ahora.') : r.explica[idioma]}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {disp === 'ok' ? <Chave valor={ligado} onChange={ligar} rotulo={`chave ${id}`} /> : (
          <Pressable onPress={disp === 'plano' ? () => exigir('relatorio', () => undefined) : undefined} accessibilityRole="button" accessibilityLabel={`bloqueado ${id}`} style={{ height: 44, borderRadius: 22, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#FEF3C7' }}>
            <Text style={{ fontWeight: '900', color: '#92400E' }}>{disp === 'plano' ? `👑 ${X(idioma, 'Plano Completo', 'Full Plan', 'Plan Completo')}` : '🔒'}</Text>
          </Pressable>
        )}
        {tela && ativo ? (
          <Pressable onPress={() => abrir({ nome: 'v14', tela })} accessibilityRole="button" accessibilityLabel={`ajustes ${r.nome[idioma]}`}
            style={({ pressed }) => [{ height: 44, borderRadius: 22, paddingHorizontal: 16, marginLeft: 10, justifyContent: 'center', backgroundColor: '#FFF7ED', borderWidth: 2.5, borderColor: '#FDBA74', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
            <Text style={{ fontWeight: '900', color: '#C2410C', fontSize: 13.5 }}>⚙️ {X(idioma, 'AJUSTAR', 'SETTINGS', 'AJUSTAR')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// =============================================================== HUB: MAIS FUNÇÕES (assuntos em blocos grandes)
const COR_GRUPO: Record<string, [string, string]> = { seguranca: ['#FEF2F2', '#FCA5A5'], voz: ['#EFF6FF', '#93C5FD'], pais: ['#FFF7ED', '#FDBA74'], trabalho: ['#F0FDF4', '#86EFAC'], crescer: ['#FEFCE8', '#FDE047'], progresso: ['#F5F3FF', '#C4B5FD'], conforto: ['#EEF2FF', '#A5B4FC'], ia: ['#FDF2F8', '#F9A8D4'] };

/** v14.3: as funções ficam DENTRO das Definições (o app hospedeiro coloca <FuncoesDoApp /> lá). */
export function FuncoesDoApp() {
  const { idioma, recurso, abrir } = useRotina();
  return (
    <AlvoTour id="df_funcoes">
      <View accessibilityLabel="funções do app">
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 4 }}>{X(idioma, 'FUNÇÕES DO APP (LIGAR E DESLIGAR)', 'APP FEATURES (TURN ON AND OFF)', 'FUNCIONES DE LA APP (ENCENDER Y APAGAR)')}</Text>
        <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{X(idioma, 'A tela da criança só muda se você ligar.', 'The child’s screen only changes if you turn it on.', 'La pantalla del niño solo cambia si la enciendes.')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 4 }}>
          {GRUPOS_RECURSO.map((g) => {
            const lista = RECURSOS.filter((r) => r.grupo === g.id);
            const lig = lista.filter((r) => recurso(r.id)).length;
            const [fundo, borda] = COR_GRUPO[g.id] || ['#F8FAFC', '#CBD5E1'];
            return (
              <Pressable key={g.id} onPress={() => abrir({ nome: 'v14', tela: 'grupo', grupo: g.id })} accessibilityRole="button" accessibilityLabel={`assunto ${g.r[idioma]}`}
                style={({ pressed }) => [{ width: '50%', padding: 5, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <View style={{ minHeight: 118, borderRadius: 20, backgroundColor: fundo, borderWidth: 2.5, borderColor: borda, padding: 12, justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 30 }}>{g.emoji}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 6 }} numberOfLines={2}>{g.r[idioma]}</Text>
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: lig ? '#15803D' : '#64748B', marginTop: 4 }}>{lig} {X(idioma, 'de', 'of', 'de')} {lista.length} {X(idioma, 'ligadas', 'on', 'encendidas')}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <T s="cap" style={{ marginTop: 8, textAlign: 'center' }}>{X(idioma, 'Algumas funções podem fazer parte do Plano Completo no futuro. Hoje está tudo liberado.', 'Some features may be part of the Full Plan in the future. Today everything is unlocked.', 'Algunas funciones pueden ser del Plan Completo en el futuro. Hoy todo está liberado.')}</T>
      </View>
    </AlvoTour>
  );
}

/** Tela antiga "Mais funções" (só para atalhos internos): mostra o mesmo bloco das Definições. */
export function MaisFuncoes() {
  const { idioma, voltar } = useRotina();
  return (
    <View style={{ flex: 1 }}>
      <Cabecalho kicker={X(idioma, 'DEFINIÇÕES', 'SETTINGS', 'AJUSTES')} titulo={X(idioma, 'Funções do app', 'App features', 'Funciones de la app')} onVoltar={voltar} corKicker={CORES_MARCA.laranja} />
      <Rolagem><FuncoesDoApp /></Rolagem>
    </View>
  );
}

/** Um assunto: cada função num cartão com botão grande de ligar/desligar. */
export function TelaGrupo({ grupo }: { grupo?: string }) {
  const { idioma } = useRotina();
  const g = GRUPOS_RECURSO.find((x) => x.id === grupo) || GRUPOS_RECURSO[0];
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={`${g.emoji} ${g.r[idioma]}`} sub={g.d[idioma]} />
      <Rolagem>
        {RECURSOS.filter((r) => r.grupo === g.id).map((r) => <CartaoFuncao key={r.id} id={r.id} />)}
      </Rolagem>
    </View>
  );
}

// =============================================================== BACKUP
export function TelaBackup() {
  const { idioma, backup, hostV14, v14, mudarV14, mostrarAviso, recurso } = useRotina();
  const [confirmar, setConfirmar] = useState<{ texto: string; quando: number; local?: boolean } | null>(null);
  const [colar, setColar] = useState(false);
  const [txtColado, setTxtColado] = useState('');
  const data = (t?: number) => (t ? new Date(t).toLocaleString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
  const restaurar = async (texto: string, local?: boolean) => {
    const r = await backup.restaurarTexto(texto, !local);
    setConfirmar(null); setColar(false); setTxtColado('');
    if (r.ok) mostrarAviso(X(idioma, '✅ Pronto! Tudo foi restaurado.', '✅ Done! Everything was restored.', '✅ ¡Listo! Todo fue restaurado.'));
    else mostrarAviso(r.erro === 'memoria' ? X(idioma, 'Memória cheia: não restaurei nada. Libere espaço e tente de novo.', 'Memory full: nothing was restored. Free some space and try again.', 'Memoria llena: no restauré nada. Libera espacio e intenta de nuevo.') : r.erro === 'voz' ? X(idioma, 'Não deu para restaurar as pranchas.', 'Could not restore the cards.', 'No se pudieron restaurar las tarjetas.') : MSG_ERRO_BACKUP[r.erro][idioma]);
  };
  const doArquivo = async () => {
    if (!hostV14.escolherArquivo) { setColar(true); return; }
    try { const t = await hostV14.escolherArquivo(); if (t) setConfirmar({ texto: t, quando: Date.now() }); } catch { mostrarAviso(X(idioma, 'Não deu para abrir o arquivo.', 'Could not open the file.', 'No se pudo abrir el archivo.')); }
  };
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Cópia de segurança', 'Backup', 'Copia de seguridad')} sub={X(idioma, 'Para nunca perder as pranchas.', 'So you never lose your cards.', 'Para nunca perder las tarjetas.')} />
      <Rolagem>
        <Caixa cor="#F0FDF4" borda="#86EFAC">
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#166534' }}>{recurso('backupAuto') ? X(idioma, '💾 Cópia automática LIGADA', '💾 Automatic backup ON', '💾 Copia automática ENCENDIDA') : X(idioma, '💾 Cópia automática desligada', '💾 Automatic backup off', '💾 Copia automática apagada')}</Text>
          <Text style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>{X(idioma, 'Última cópia:', 'Last copy:', 'Última copia:')} {data(backup.ultimaEm)} · {backup.copias.length} {X(idioma, 'guardadas neste celular', 'kept on this phone', 'guardadas en este celular')}</Text>
          {backup.falhou ? <Text style={{ fontSize: 13, color: C.red, fontWeight: '800', marginTop: 6 }}>{X(idioma, '⚠️ A memória está cheia. Envie uma cópia para o Drive ou WhatsApp.', '⚠️ Memory is full. Send a copy to Drive or WhatsApp.', '⚠️ La memoria está llena. Envía una copia a Drive o WhatsApp.')}</Text> : null}
        </Caixa>
        <B titulo={X(idioma, 'Fazer cópia agora', 'Back up now', 'Copiar ahora')} cor={CORES_MARCA.verde} onPress={async () => { const ok = await backup.fazerAgora(); mostrarAviso(ok ? X(idioma, 'Cópia guardada.', 'Copy saved.', 'Copia guardada.') : X(idioma, 'Memória cheia.', 'Memory full.', 'Memoria llena.')); }} />
        <View style={{ height: 10 }} />
        <B titulo={X(idioma, 'Enviar cópia (Drive, WhatsApp…)', 'Send copy (Drive, WhatsApp…)', 'Enviar copia (Drive, WhatsApp…)')} cor={CORES_MARCA.azul} onPress={backup.exportar} />
        <T s="cap" style={{ marginTop: 6, color: '#B45309', fontWeight: '700' }}>{X(idioma, '🔒 O arquivo tem dados da criança (pranchas, fotos, voz e relatório). Guarde só para você: não mande para grupos. A senha dos pais não vai no arquivo.', '🔒 The file has your child’s data (cards, photos, voice and report). Keep it for yourself: don’t send it to groups. The parents’ PIN is not in the file.', '🔒 El archivo tiene datos del niño (tarjetas, fotos, voz e informe). Guárdalo solo para ti: no lo envíes a grupos. La clave de los padres no va en el archivo.')}</T>
        <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'Guarde o arquivo no Google Drive ou mande para você no WhatsApp/e-mail. Num celular novo, instale o Voz Amiga e use "Restaurar de um arquivo".', 'Save the file to Google Drive or send it to yourself by WhatsApp/email. On a new phone, install Voz Amiga and use "Restore from a file".', 'Guarda el archivo en Google Drive o envíalo a ti por WhatsApp/correo. En un celular nuevo, instala Voz Amiga y usa "Restaurar desde un archivo".')}</T>
        <View style={{ height: 10 }} />
        <B titulo={X(idioma, 'Restaurar de um arquivo', 'Restore from a file', 'Restaurar desde un archivo')} contorno onPress={doArquivo} />
        {backup.temDesfazer && backup.desfazer ? <><View style={{ height: 10 }} /><B titulo={X(idioma, 'Desfazer a restauração', 'Undo restore', 'Deshacer la restauración')} contorno onPress={async () => { const ok = await backup.desfazer?.(); mostrarAviso(ok ? X(idioma, '↩️ Voltou como estava antes.', '↩️ Back to how it was.', '↩️ Volvió como estaba.') : X(idioma, 'Não deu para desfazer.', 'Could not undo.', 'No se pudo deshacer.')); }} /></> : null}
        {colar ? (
          <Cartao style={{ marginTop: 10 }}>
            <T s="b">{X(idioma, 'Cole aqui o conteúdo do arquivo', 'Paste the file content here', 'Pega aquí el contenido del archivo')}</T>
            <TextInput value={txtColado} onChangeText={setTxtColado} multiline accessibilityLabel="texto do backup" style={{ minHeight: 80, borderWidth: 1.5, borderColor: C.line, borderRadius: 12, padding: 8, marginTop: 8, fontSize: 12 }} />
            <View style={{ height: 8 }} />
            <B titulo={X(idioma, 'Conferir', 'Check', 'Revisar')} onPress={() => setConfirmar({ texto: txtColado, quando: Date.now() })} disabled={!txtColado.trim()} />
          </Cartao>
        ) : null}
        {confirmar ? (
          <Caixa cor="#FEF2F2" borda="#FCA5A5">
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#991B1B' }}>{X(idioma, 'Trocar tudo por esta cópia?', 'Replace everything with this copy?', '¿Cambiar todo por esta copia?')}</Text>
            <Text style={{ fontSize: 13, color: '#991B1B', marginTop: 4 }}>{X(idioma, 'Antes, o app guarda o que existe agora. Se mudar de ideia, toque em "Desfazer a restauração".', 'First, the app keeps what you have now. If you change your mind, tap "Undo restore".', 'Antes, la app guarda lo que hay ahora. Si cambias de idea, toca "Deshacer la restauración".')}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <B titulo={X(idioma, 'Cancelar', 'Cancel', 'Cancelar')} contorno onPress={() => setConfirmar(null)} style={{ flex: 1, marginRight: 8 }} />
              <B titulo={X(idioma, 'Restaurar', 'Restore', 'Restaurar')} cor={C.red} onPress={() => restaurar(confirmar.texto, confirmar.local)} style={{ flex: 1 }} />
            </View>
          </Caixa>
        ) : null}
        <Secao titulo={X(idioma, 'CÓPIAS NESTE CELULAR', 'COPIES ON THIS PHONE', 'COPIAS EN ESTE CELULAR')} />
        <GrupoOpcoes>
          {backup.copias.length ? backup.copias.map((c, i) => (
            <View key={c.t}>
              {i ? <Divisor /> : null}
              <Linha emoji="🗂️" titulo={data(c.t)} texto={`${c.resumo.pranchas} ${X(idioma, 'pranchas', 'cards', 'tarjetas')} · ${c.resumo.abas} ${X(idioma, 'abas', 'tabs', 'pestañas')} · ${c.resumo.tarefas} ${X(idioma, 'tarefas', 'tasks', 'tareas')}`}
                direita={<Pressable onPress={() => setConfirmar({ texto: c.texto, quando: c.t, local: true })} accessibilityRole="button" accessibilityLabel={`restaurar copia ${i + 1}`} style={{ paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: '#DBEAFE', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: '#1D4ED8', fontSize: 12 }}>{X(idioma, 'RESTAURAR', 'RESTORE', 'RESTAURAR')}</Text></Pressable>} />
            </View>
          )) : <Linha emoji="⏳" titulo={X(idioma, 'Ainda não há cópias.', 'No copies yet.', 'Aún no hay copias.')} />}
        </GrupoOpcoes>
        <Secao titulo={X(idioma, 'QUANTAS CÓPIAS GUARDAR', 'HOW MANY COPIES TO KEEP', 'CUÁNTAS COPIAS GUARDAR')} />
        <Opcoes colunas={4} valor={v14.backupMax} onChange={(n) => mudarV14({ backupMax: n })} opcoes={[1, 3, 5, 10].map((n) => ({ v: n, r: String(n) }))} />
        <T s="cap" style={{ marginTop: 10 }}>{X(idioma, 'Cópia na nuvem (Firebase) chega numa próxima atualização.', 'Cloud backup (Firebase) is coming in a next update.', 'La copia en la nube (Firebase) llega en una próxima actualización.')}</T>
      </Rolagem>
    </View>
  );
}

// =============================================================== SENHA DOS PAIS
export function TelaSenha() {
  const { idioma, v14, mudarV14, mostrarAviso, voltar } = useRotina();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const tem = !!v14.senhaHash;
  const salvar = () => {
    if (!senhaValida(a)) { mostrarAviso(X(idioma, 'Use de 4 a 8 números.', 'Use 4 to 8 numbers.', 'Usa de 4 a 8 números.')); return; }
    if (a !== b) { mostrarAviso(X(idioma, 'As duas senhas estão diferentes.', 'The two PINs don’t match.', 'Las dos claves son diferentes.')); return; }
    const sal = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 24);
    mudarV14({ senhaSal: sal, senhaHash: resumoSenha(a, sal), recursos: { ...v14.recursos, senhaPais: true } });
    setA(''); setB('');
    mostrarAviso(X(idioma, '🔑 Senha salva.', '🔑 PIN saved.', '🔑 Clave guardada.'));
    voltar();
  };
  const campo = (v: string, set: (x: string) => void, r: string) => (
    <TextInput value={v} onChangeText={(x) => set(x.replace(/\D/g, '').slice(0, 8))} keyboardType="number-pad" secureTextEntry placeholder={r} accessibilityLabel={r} placeholderTextColor={C.faint}
      style={{ height: 54, borderRadius: 27, borderWidth: 2, borderColor: C.line, backgroundColor: C.white, paddingHorizontal: 20, fontSize: 22, fontWeight: '900', letterSpacing: 6, marginBottom: 10 }} />
  );
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Senha dos pais', 'Parents’ PIN', 'Clave de los padres')} sub={X(idioma, 'Pedida depois da continha, para entrar nos ajustes.', 'Asked after the quick sum, to open settings.', 'Se pide después de la cuenta, para entrar a los ajustes.')} />
      <Rolagem>
        <Caixa>
          <Text style={{ fontSize: 13.5, color: '#7C2D12', lineHeight: 19 }}>{X(idioma, 'A senha fica só neste celular, guardada de forma protegida (ninguém consegue ler). Se esquecer, dá para apagar resolvendo uma conta difícil.', 'The PIN stays only on this phone, stored protected (nobody can read it). If you forget it, you can erase it by solving a hard sum.', 'La clave queda solo en este celular, guardada de forma protegida. Si la olvidas, puedes borrarla resolviendo una cuenta difícil.')}</Text>
        </Caixa>
        {campo(a, setA, X(idioma, 'Nova senha (4 a 8 números)', 'New PIN (4 to 8 numbers)', 'Nueva clave (4 a 8 números)'))}
        {campo(b, setB, X(idioma, 'Repita a senha', 'Repeat the PIN', 'Repite la clave'))}
        <B titulo={X(idioma, tem ? 'Trocar senha' : 'Salvar senha', tem ? 'Change PIN' : 'Save PIN', tem ? 'Cambiar clave' : 'Guardar clave')} cor={CORES_MARCA.verde} onPress={salvar} />
        {tem ? <><View style={{ height: 10 }} /><B titulo={X(idioma, 'Apagar senha', 'Remove PIN', 'Borrar clave')} contorno onPress={() => { mudarV14({ senhaHash: undefined, senhaSal: undefined }); mostrarAviso(X(idioma, 'Senha apagada.', 'PIN removed.', 'Clave borrada.')); }} /></> : null}
      </Rolagem>
    </View>
  );
}

// =============================================================== EMERGÊNCIA
export function TelaEmergencia() {
  const { idioma, v14, mudarV14 } = useRotina();
  const e = v14.emergencia;
  const item = (k: keyof typeof e, emoji: string, r: string) => (
    <Linha emoji={emoji} titulo={r} direita={<Chave valor={e[k]} onChange={(v) => mudarV14({ emergencia: { ...e, [k]: v } })} rotulo={`emergencia ${k}`} />} />
  );
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Botão de emergência', 'Emergency button', 'Botón de emergencia')} sub={X(idioma, 'Fica pequeno na barra da frase, sempre à vista.', 'Small on the sentence bar, always visible.', 'Pequeño en la barra de la frase, siempre visible.')} />
      <Rolagem>
        <Caixa cor="#FEF2F2" borda="#FCA5A5"><Text style={{ fontSize: 13.5, color: '#991B1B', lineHeight: 19 }}>{X(idioma, 'Um toque fala a frase bem alto, na hora, e marca no relatório. Não tira espaço das pranchas.', 'One tap says the sentence out loud right away and logs it in the report. It doesn’t take space from the cards.', 'Un toque dice la frase en voz alta al momento y la registra en el informe. No quita espacio a las tarjetas.')}</Text></Caixa>
        <GrupoOpcoes>
          {item('dor', '🤕', X(idioma, '"Estou com dor"', '"I am in pain"', '"Me duele"'))}
          <Divisor />
          {item('ajuda', '🆘', X(idioma, '"Preciso de ajuda"', '"I need help"', '"Necesito ayuda"'))}
          <Divisor />
          {item('banheiro', '🚽', X(idioma, '"Preciso ir ao banheiro"', '"I need the bathroom"', '"Necesito ir al baño"'))}
        </GrupoOpcoes>
      </Rolagem>
    </View>
  );
}

// =============================================================== VOZES
export function TelaVozes() {
  const { idioma, v14, mudarV14, hostV14, falarIdade, mostrarAviso, recurso } = useRotina();
  const [vozes, setVozes] = useState<string[]>([]);
  const [guia, setGuia] = useState(false);
  useEffect(() => {
    const ler = () => { try { setVozes(hostV14.listarVozes?.() || []); } catch { setVozes([]); } };
    ler();
    const h = setTimeout(ler, 900);
    return () => clearTimeout(h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const semVozDoCelular = !!hostV14.listarVozes && vozes.length === 0;
  const testar = () => {
    if (semVozDoCelular) mostrarAviso(X(idioma, '⚠️ A voz do celular não respondeu. Usando a próxima da lista. Siga o passo a passo abaixo.', '⚠️ The phone voice did not respond. Using the next one. Follow the steps below.', '⚠️ La voz del celular no respondió. Usando la siguiente. Sigue los pasos abajo.'));
    falarIdade(FRASE_TESTE[idioma]);
  };
  const vz = v14.voz;
  return (
    <View style={{ flex: 1 }}>
      <Topo kicker={X(idioma, 'DEFINIÇÕES', 'SETTINGS', 'AJUSTES')} titulo={X(idioma, 'Vozes', 'Voices', 'Voces')} sub={X(idioma, 'Se uma voz falhar, o app usa a próxima da lista.', 'If one voice fails, the app uses the next one.', 'Si una voz falla, la app usa la siguiente.')} />
      <Rolagem>
        <B titulo={X(idioma, '▶ Testar voz', '▶ Test voice', '▶ Probar voz')} cor={CORES_MARCA.azul} onPress={testar} alto={58} />
        {semVozDoCelular ? <Caixa cor="#FEF2F2" borda="#FCA5A5"><Text style={{ color: '#991B1B', fontWeight: '800' }}>{X(idioma, '⚠️ Não achamos voz instalada no celular. Siga o passo a passo para baixar (é grátis).', '⚠️ No voice found on the phone. Follow the steps to download one (free).', '⚠️ No encontramos voz instalada. Sigue los pasos para descargar (es gratis).')}</Text></Caixa> : null}
        <Secao titulo={X(idioma, 'QUAL VOZ O APP USA', 'WHICH VOICE THE APP USES', 'QUÉ VOZ USA LA APP')} />
        <Opcoes colunas={2} valor={vz.ordem[0]} onChange={(m) => mudarV14({ voz: { ...vz, ordem: [m, ...vz.ordem.filter((x) => x !== m)] } })}
          opcoes={MOTORES.filter((m) => m.pronto && m.id !== 'mascote').map((m) => ({ v: m.id, r: `${m.emoji} ${m.nome[idioma]}`, d: m.pronto ? (m.id === 'gravada' ? X(idioma, 'Onde tiver gravação', 'Where recorded', 'Donde haya grabación') : X(idioma, 'Funciona sem internet', 'Works offline', 'Funciona sin internet')) : X(idioma, 'Em breve', 'Coming soon', 'Pronto'), desativado: !m.pronto }))} />
        <T s="cap" style={{ marginTop: 2 }}>{X(idioma, 'Se a voz escolhida falhar, o app usa a próxima que funcionar e avisa.', 'If the chosen voice fails, the app uses the next one that works and tells you.', 'Si la voz elegida falla, la app usa la siguiente que funcione y avisa.')}</T>
        {hostV14.listarVozes && vozes.length ? (
          <>
            <Secao titulo={X(idioma, '2. VOZ DO CELULAR (TOQUE PARA OUVIR E ESCOLHER)', '2. PHONE VOICE (TAP TO HEAR AND PICK)', '2. VOZ DEL CELULAR (TOCA PARA OÍR Y ELEGIR)')} />
            <Opcoes colunas={2} valor={hostV14.vozAtual || ''} onChange={(v) => { hostV14.mudarVoz?.(v); if (v && hostV14.falarComVoz) hostV14.falarComVoz(FRASE_TESTE[idioma], v); else falarIdade(FRASE_TESTE[idioma]); }}
              opcoes={[{ v: '', r: X(idioma, 'Padrão do celular', 'Phone default', 'Predeterminada'), d: '🔊' }, ...vozes.slice(0, 11).map((v, i) => ({ v, r: `🔊 ${X(idioma, 'Voz', 'Voice', 'Voz')} ${i + 1}`, d: nomeVoz(v) }))]} />
          </>
        ) : null}
        {hostV14.falarCom ? (
          <>
            <Secao titulo={X(idioma, 'VOZ POR IDADE', 'VOICE BY AGE', 'VOZ POR EDAD')} />
            <Opcoes<IdadeVoz> valor={vz.idade} onChange={(idade) => { mudarV14({ voz: { ...vz, idade } }); }} opcoes={(['crianca', 'adolescente', 'adulto'] as IdadeVoz[]).map((k) => ({ v: k, r: PERFIL_IDADE[k].r[idioma] }))} />
            <Secao titulo={X(idioma, 'VELOCIDADE', 'SPEED', 'VELOCIDAD')} />
            <Opcoes valor={vz.velocidade} onChange={(velocidade) => mudarV14({ voz: { ...vz, velocidade } })} opcoes={[{ v: 0.75, r: X(idioma, '🐢 Devagar', '🐢 Slow', '🐢 Lento') }, { v: 1, r: X(idioma, 'Normal', 'Normal', 'Normal') }, { v: 1.25, r: X(idioma, '🐇 Rápida', '🐇 Fast', '🐇 Rápida') }]} />
          </>
        ) : (
          <Caixa cor="#EFF6FF" borda="#BFDBFE">
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#1E3A8A' }}>🐢🐇 {X(idioma, 'Velocidade e tom da voz', 'Voice speed and pitch', 'Velocidad y tono de la voz')}</Text>
            <Text style={{ fontSize: 13.5, color: '#1E3A8A', marginTop: 4, lineHeight: 19 }}>{X(idioma, 'Neste celular, a velocidade e o tom (voz mais fina, de criança) ficam nas configurações de voz do Android: toque no botão abaixo e mude "Velocidade da fala" e "Tom". Vale para o Voz Amiga na hora.', 'On this phone, speed and pitch are in the Android voice settings: tap below and change "Speech rate" and "Pitch". It applies to Voz Amiga right away.', 'En este celular, la velocidad y el tono están en los ajustes de voz de Android: toca abajo y cambia "Velocidad" y "Tono". Vale para Voz Amiga al instante.')}</Text>
            {hostV14.abrirConfigVoz ? <><View style={{ height: 8 }} /><B titulo={X(idioma, '⚙️ Abrir velocidade e tom', '⚙️ Open speed and pitch', '⚙️ Abrir velocidad y tono')} cor={CORES_MARCA.azul} onPress={() => hostV14.abrirConfigVoz?.()} /></> : null}
          </Caixa>
        )}
        {hostV14.mudarVolume ? (
          <>
            <Secao titulo={X(idioma, 'VOLUME', 'VOLUME', 'VOLUMEN')} />
            <Opcoes colunas={4} valor={hostV14.volume ?? 100} onChange={(v) => { hostV14.mudarVolume?.(v); }} opcoes={[40, 60, 80, 100].map((v) => ({ v, r: `${v}%` }))} />
          </>
        ) : null}
        <Secao titulo={X(idioma, 'BAIXAR A VOZ EM PORTUGUÊS (GRÁTIS)', 'DOWNLOAD THE VOICE (FREE)', 'DESCARGAR LA VOZ (GRATIS)')} />
        <Pressable onPress={() => setGuia(!guia)} accessibilityRole="button" accessibilityLabel="passo a passo da voz" style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#BFDBFE' }}>
          <Text style={{ fontWeight: '900', color: '#1D4ED8' }}>{guia ? '▼' : '▶'} {X(idioma, 'Ver passo a passo', 'See step by step', 'Ver paso a paso')}</Text>
        </Pressable>
        {guia ? GUIA_PACOTE_VOZ[idioma].map((g) => (
          <Cartao key={g.titulo} style={{ marginTop: 10 }}>
            <T s="b">{g.titulo}</T>
            {g.passos.map((p, i) => <Text key={p} style={{ fontSize: 13.5, color: C.ink2, marginTop: 6, lineHeight: 19 }}>{i + 1}. {p}</Text>)}
          </Cartao>
        )) : null}
        {hostV14.abrirConfigVoz ? <><View style={{ height: 10 }} /><B titulo={X(idioma, 'Abrir configurações de voz do celular', 'Open phone voice settings', 'Abrir ajustes de voz del celular')} contorno onPress={() => hostV14.abrirConfigVoz?.()} /></> : null}
      </Rolagem>
    </View>
  );
}

// =============================================================== PARA OS PAIS (missão, apoio, lembrete)
export function TelaPais() {
  const { idioma, v14, mudarV14, recurso, registrarV14, abrir, estado } = useRotina();
  const hoje = chaveDia(new Date());
  const m = missaoDoDia(hoje);
  const feita = v14.missoesFeitas[hoje] === m.id;
  const exemplosHoje = estado.log.filter((e) => e.tipo === 'modelo' && chaveDia(new Date(e.t)) === hoje).length;
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Para os pais', 'For parents', 'Para los padres')} sub={X(idioma, 'Pequenas ajudas para o dia a dia.', 'Small everyday helps.', 'Pequeñas ayudas para el día a día.')} />
      <Rolagem>
        {recurso('missaoDia') ? (
          <Caixa>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#C2410C', letterSpacing: 1 }}>{X(idioma, 'MISSÃO DO DIA', 'MISSION OF THE DAY', 'MISIÓN DEL DÍA')}</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 6, lineHeight: 23 }}>{m.emoji} {m.t[idioma]}</Text>
            <View style={{ height: 10 }} />
            <B titulo={feita ? X(idioma, '✓ Feita hoje!', '✓ Done today!', '✓ ¡Hecha hoy!') : X(idioma, 'Marcar como feita', 'Mark as done', 'Marcar como hecha')} cor={feita ? C.greenDark : CORES_MARCA.laranja} disabled={feita} onPress={() => registrarV14('missao', m.id)} />
          </Caixa>
        ) : null}
        {recurso('modoExemplo') ? (
          <Cartao style={{ marginBottom: 12 }}>
            <T s="b">👆 {X(idioma, 'Modo exemplo', 'Show-me mode', 'Modo ejemplo')}</T>
            <T style={{ marginTop: 4, fontSize: 13.5 }}>{X(idioma, 'Na tela inicial, toque no botão 👆 da barra da frase. Enquanto ele estiver aceso, os toques são seus: o app destaca e fala junto, e o relatório não conta como se fosse a criança.', 'On the home screen, tap the 👆 button on the sentence bar. While it’s on, the taps are yours: the app highlights and speaks along, and the report doesn’t count them as the child.', 'En la pantalla inicial, toca el botón 👆 de la barra. Mientras esté encendido, los toques son tuyos: la app resalta y habla contigo, y el informe no los cuenta como del niño.')}</T>
            <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'Hoje você mostrou', 'Today you showed', 'Hoy mostraste')} {exemplosHoje} {X(idioma, 'palavras.', 'words.', 'palabras.')}</T>
          </Cartao>
        ) : null}
        {recurso('lembretePais') ? (
          <Cartao style={{ marginBottom: 12 }}>
            <T s="b">⏰ {X(idioma, 'Lembrete', 'Reminder', 'Recordatorio')}</T>
            <T style={{ marginTop: 4, fontSize: 13.5 }}>{TEXTO_LEMBRETE[idioma]} {X(idioma, 'Aparece discreto, só nesta área dos pais, a partir de:', 'Shows quietly, only in this parents’ area, from:', 'Aparece discreto, solo en esta área de padres, desde:')}</T>
            <Opcoes valor={v14.lembreteHora} onChange={(h) => mudarV14({ lembreteHora: h })} opcoes={[8, 12, 16, 18, 20].map((h) => ({ v: h, r: `${h}h` }))} />
          </Cartao>
        ) : null}
        {recurso('mensagensApoio') ? (
          <>
            <Secao titulo={X(idioma, 'PARA TIRAR O MEDO', 'TO EASE YOUR WORRIES', 'PARA QUITAR EL MIEDO')} />
            {[...MENSAGENS_APOIO, ...(recurso('avisoSemanas') ? [AVISO_SEMANAS] : [])].map((a) => (
              <Cartao key={a.id} style={{ marginBottom: 10 }}>
                <T style={{ fontSize: 14.5, color: C.ink, fontWeight: '700', lineHeight: 20 }}>💛 {a.t[idioma]}</T>
                <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'Fonte:', 'Source:', 'Fuente:')} {a.fontes.map((f) => FONTES[f]?.r.split('.')[0]).join('; ')}</T>
              </Cartao>
            ))}
          </>
        ) : null}
        {recurso('duvidas') ? <B titulo={X(idioma, '❓ Dúvidas comuns', '❓ Common questions', '❓ Dudas comunes')} contorno onPress={() => abrir({ nome: 'v14', tela: 'duvidas' })} style={{ marginTop: 8 }} /> : null}
        {recurso('curso') ? <B titulo={X(idioma, '🎓 Curso para os pais', '🎓 Course for parents', '🎓 Curso para los padres')} contorno onPress={() => abrir({ nome: 'v14', tela: 'curso' })} style={{ marginTop: 10 }} /> : null}
        <T s="cap" style={{ marginTop: 14 }}>{X(idioma, 'O Voz Amiga é uma ferramenta de apoio e não substitui a fono, o médico ou o terapeuta.', 'Voz Amiga is a support tool and does not replace the therapist or doctor.', 'Voz Amiga es una herramienta de apoyo y no reemplaza a la fono, al médico o al terapeuta.')}</T>
      </Rolagem>
    </View>
  );
}

export function TelaDuvidas() {
  const { idioma } = useRotina();
  const [aberta, setAberta] = useState<string>();
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Dúvidas comuns', 'Common questions', 'Dudas comunes')} sub={X(idioma, 'Respostas simples, com base em pesquisas.', 'Simple answers, based on research.', 'Respuestas simples, basadas en investigaciones.')} />
      <Rolagem>
        <GrupoOpcoes>
          {DUVIDAS.map((d, i) => (
            <View key={d.id}>
              {i ? <Divisor /> : null}
              <Linha emoji={aberta === d.id ? '➖' : '➕'} titulo={d.p[idioma]} onPress={() => setAberta(aberta === d.id ? undefined : d.id)} />
              {aberta === d.id ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  <Text style={{ fontSize: 14, color: C.ink2, lineHeight: 20 }}>{d.r[idioma]}</Text>
                  {d.fontes.map((f) => <Text key={f} style={{ fontSize: 11, color: C.slate, marginTop: 6 }}>📚 {FONTES[f]?.r}</Text>)}
                </View>
              ) : null}
            </View>
          ))}
        </GrupoOpcoes>
      </Rolagem>
    </View>
  );
}

// =============================================================== CURSO (lista de lições)
export function TelaCurso() {
  const { idioma, v14, mudarV14, fecharTudo } = useRotina();
  const tour = useTour();
  const comecar = (i: number) => {
    const l = LICOES[i];
    fecharTudo();
    setTimeout(() => tour?.iniciarCurso({ passos: l.passos, partes: PARTES_CURSO[idioma], aoTerminar: (ok) => { if (ok) mudarV14({ licoesVistas: [...new Set([...v14.licoesVistas, l.id])] }); } }), 250);
  };
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Curso para os pais', 'Course for parents', 'Curso para los padres')} sub={X(idioma, 'O mascote mostra cada parte do app. Lições de 1 a 2 minutos.', 'The mascot shows each part of the app. 1 to 2 minute lessons.', 'La mascota muestra cada parte. Lecciones de 1 a 2 minutos.')} />
      <Rolagem>
        <Caixa>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MascoteDesenho tam={52} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, color: '#7C2D12', lineHeight: 20 }}>{X(idioma, 'Para quem nunca mexeu em app. Pode repetir quantas vezes quiser!', 'For those who never used an app. Repeat as many times as you like!', '¡Para quien nunca usó una app. Repite cuantas veces quieras!')}</Text>
          </View>
        </Caixa>
        <GrupoOpcoes>
          {LICOES.map((l, i) => {
            const vista = v14.licoesVistas.includes(l.id);
            return (
              <View key={l.id}>
                {i ? <Divisor /> : null}
                <Linha emoji={l.emoji} titulo={`${i + 1}. ${l.nome[idioma]}`} texto={`${l.minutos} min · ${l.passos.length} ${X(idioma, 'passos', 'steps', 'pasos')}${vista ? X(idioma, ' · ✓ vista', ' · ✓ seen', ' · ✓ vista') : ''}`}
                  onPress={() => comecar(i)} rotulo={`licao ${l.id}`}
                  direita={<View style={{ paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: vista ? '#DCFCE7' : '#FFEDD5', justifyContent: 'center' }}><Text style={{ fontWeight: '900', fontSize: 12, color: vista ? '#166534' : '#C2410C' }}>{vista ? X(idioma, 'REPETIR', 'REPEAT', 'REPETIR') : X(idioma, 'COMEÇAR', 'START', 'EMPEZAR')}</Text></View>} />
              </View>
            );
          })}
        </GrupoOpcoes>
        <View style={{ height: 12 }} />
        <B titulo={X(idioma, 'Ver o tour completo do app', 'See the full app tour', 'Ver el recorrido completo')} contorno onPress={() => { fecharTudo(); setTimeout(() => tour?.iniciar(), 250); }} />
      </Rolagem>
    </View>
  );
}

// =============================================================== IA (OPCIONAL)
// =============================================================== CONFORTO
export function TelaConforto() {
  const { idioma, v14, mudarV14, recurso } = useRotina();
  const estilo = (k: 'redondo' | 'quadrado' | 'borda', r: string) => (
    <Pressable key={k} onPress={() => mudarV14({ estilo: k })} accessibilityRole="radio" accessibilityState={{ selected: v14.estilo === k }} accessibilityLabel={`estilo ${k}`} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4, paddingVertical: 10, borderRadius: 18, borderWidth: 2.5, borderColor: v14.estilo === k ? '#2563EB' : '#E2E8F0', backgroundColor: v14.estilo === k ? '#EFF6FF' : '#FFFFFF' }}>
      <View style={{ width: 64, height: 64, borderRadius: k === 'redondo' ? 18 : k === 'quadrado' ? 4 : 14, borderWidth: k === 'borda' ? 4 : 2.5, borderBottomWidth: k === 'borda' ? 4 : 6, borderColor: CORES_MARCA.azul, backgroundColor: k === 'borda' ? C.white : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 26 }}>💧</Text>
      </View>
      <Text style={{ marginTop: 4, fontWeight: '900', color: v14.estilo === k ? CORES_MARCA.laranja : C.slate2, fontSize: 12 }}>{v14.estilo === k ? '● ' : ''}{r}</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Conforto da tela', 'Screen comfort', 'Comodidad de la pantalla')} sub={X(idioma, 'Para a criança ficar tranquila.', 'To keep the child calm.', 'Para que el niño esté tranquilo.')} />
      <Rolagem>
        <CartaoFuncao id="telaCalma" /><CartaoFuncao id="botoesGrandes" /><CartaoFuncao id="tempoToque" /><CartaoFuncao id="fundoAnimado" />
        {recurso('tempoToque') ? (
          <>
            <Secao titulo={X(idioma, 'TEMPO DE TOQUE', 'TOUCH TIME', 'TIEMPO DE TOQUE')} />
            <T s="cap">{X(idioma, 'Quanto tempo o dedo precisa ficar no botão para ele falar. Ajuda quem toca sem querer.', 'How long the finger must stay on a button for it to speak. Helps with accidental taps.', 'Cuánto tiempo el dedo debe quedar en el botón. Ayuda con toques sin querer.')}</T>
            <Opcoes colunas={4} valor={v14.toqueMs} onChange={(toqueMs) => mudarV14({ toqueMs })} opcoes={[{ v: 0, r: X(idioma, 'Normal', 'Normal', 'Normal') }, { v: 300, r: '0,3 s' }, { v: 600, r: '0,6 s' }, { v: 1000, r: '1 s' }]} />
          </>
        ) : null}
        {recurso('estilosBotao') ? (
          <>
            <Secao titulo={X(idioma, 'ESTILO DOS BOTÕES', 'BUTTON STYLE', 'ESTILO DE LOS BOTONES')} />
            <View style={{ flexDirection: 'row', marginHorizontal: -4, marginTop: 6 }}>{estilo('redondo', X(idioma, 'Redondinho', 'Rounded', 'Redondeado'))}{estilo('quadrado', X(idioma, 'Quadrado', 'Square', 'Cuadrado'))}{estilo('borda', X(idioma, 'Com borda', 'Outlined', 'Con borde'))}</View>
            <T s="cap" style={{ marginTop: 6 }}>{X(idioma, 'As cores das categorias (amarelo, rosa, azul, verde) nunca mudam.', 'Category colors (yellow, pink, blue, green) never change.', 'Los colores de las categorías nunca cambian.')}</T>
          </>
        ) : null}
        {recurso('modoTablet') ? (
          <>
            <Secao titulo={X(idioma, 'CELULAR OU TABLET', 'PHONE OR TABLET', 'CELULAR O TABLET')} />
            <Opcoes colunas={3} valor={v14.modoTela} onChange={(modoTela) => mudarV14({ modoTela })} opcoes={[{ v: 'auto', r: X(idioma, 'Automático', 'Automatic', 'Automático') }, { v: 'celular', r: X(idioma, '📱 Celular', '📱 Phone', '📱 Celular') }, { v: 'tablet', r: X(idioma, '📲 Tablet', '📲 Tablet', '📲 Tablet') }]} />
          </>
        ) : null}
      </Rolagem>
    </View>
  );
}

// =============================================================== CRESCER
export function TelaCrescer() {
  const { idioma, v14, mudarV14, recurso, registrarV14 } = useRotina();
  return (
    <View style={{ flex: 1 }}>
      <Topo titulo={X(idioma, 'Crescer com a criança', 'Grow with the child', 'Crecer con el niño')} sub={X(idioma, 'Palavras novas entram sem mudar as antigas de lugar.', 'New words come in without moving the old ones.', 'Las palabras nuevas entran sin mover las viejas.')} />
      <Rolagem>
        <CartaoFuncao id="niveis" />
        {recurso('niveis') ? (
          <>
            <Secao titulo={X(idioma, 'NÍVEL DA FRASE', 'SENTENCE LEVEL', 'NIVEL DE LA FRASE')} />
            <Opcoes valor={v14.nivel} colunas={3} onChange={(n) => { if (v14.nivel !== n) registrarV14('nivel', String(n), 'pais'); }} opcoes={NIVEIS.map((n) => ({ v: n.n, r: `${n.emoji} ${n.r[idioma]}`, d: n.d[idioma] }))} />
            <Secao titulo={X(idioma, 'QUEM MUDA O NÍVEL', 'WHO CHANGES THE LEVEL', 'QUIÉN CAMBIA EL NIVEL')} />
            <Opcoes colunas={2} valor={v14.nivelModo} onChange={(nivelModo) => mudarV14({ nivelModo })} opcoes={[{ v: 'manual', r: X(idioma, '✋ Eu (manual)', '✋ Me (manual)', '✋ Yo (manual)') }, { v: 'auto', r: X(idioma, '🤖 O app (automático)', '🤖 The app (automatic)', '🤖 La app (automático)') }]} />
            {v14.nivelModo === 'auto' ? <T s="cap">{X(idioma, 'O app sobe o nível quando a criança usa bastante (nunca desce sozinho). Idade ajuda:', 'The app raises the level when the child uses it a lot (never lowers it). Age helps:', 'La app sube el nivel cuando el niño la usa mucho (nunca baja sola). La edad ayuda:')}</T> : null}
            {v14.nivelModo === 'auto' ? <Opcoes valor={v14.idadeAnos} onChange={(idadeAnos) => mudarV14({ idadeAnos })} opcoes={[{ v: 0, r: '—' }, { v: 3, r: '2–4' }, { v: 6, r: '5–8' }, { v: 10, r: '9–11' }, { v: 13, r: '12–15' }, { v: 18, r: '16+' }]} /> : null}
          </>
        ) : null}
        <View style={{ height: 14 }} />
        <CartaoFuncao id="gradeCrescente" />
        <DicaEspecialistas idioma={idioma} />
        {recurso('gradeCrescente') ? (
          <>
            <Secao titulo={X(idioma, 'QUANTOS BOTÕES APARECEM', 'HOW MANY BUTTONS SHOW', 'CUÁNTOS BOTONES APARECEN')} />
            <Caixa><Text style={{ fontSize: 13.5, color: '#7C2D12', lineHeight: 19 }}>{X(idioma, 'Dica: comece com 5 ou 6 botões que a criança adora. Quando ela usar quase todos, o app sugere aumentar. Os botões novos entram no fim.', 'Tip: start with 5 or 6 buttons your child loves. When they use almost all, the app suggests adding more. New buttons go at the end.', 'Consejo: empieza con 5 o 6 botones que le encantan. Cuando use casi todos, la app sugiere aumentar. Los nuevos van al final.')}</Text></Caixa>
            <Opcoes valor={v14.gradeBotoes} onChange={(gradeBotoes) => mudarV14({ gradeBotoes })} opcoes={[4, 6, 10, 12, 16, 24].map((n) => ({ v: n, r: n === 10 ? '10 ⭐' : String(n) })).concat([{ v: 0, r: X(idioma, 'Todos', 'All', 'Todos') }])} />
          </>
        ) : null}
        <View style={{ height: 14 }} />
        <CartaoFuncao id="visualIdade" />
        {recurso('visualIdade') ? (
          <>
            <Secao titulo={X(idioma, 'VISUAL', 'LOOK', 'ASPECTO')} />
            <Opcoes<IdadeVoz> valor={v14.visual} onChange={(visual) => mudarV14({ visual })} opcoes={(['crianca', 'adolescente', 'adulto'] as IdadeVoz[]).map((k) => ({ v: k, r: VISUAIS[k].r[idioma] }))} />
            <T s="cap">{X(idioma, 'Muda só cantos, fundo e letras. Nada do que você montou se perde.', 'Changes only corners, background and letters. Nothing you built is lost.', 'Cambia solo esquinas, fondo y letras. Nada se pierde.')}</T>
          </>
        ) : null}
        <Secao titulo={X(idioma, 'TECLADO', 'KEYBOARD', 'TECLADO')} />
        <T s="cap">{X(idioma, '✓ O teclado do app já sugere a palavra enquanto a criança digita (previsão de palavras).', '✓ The app keyboard already suggests the word while typing (word prediction).', '✓ El teclado de la app ya sugiere la palabra mientras escribe (predicción).')}</T>
      </Rolagem>
    </View>
  );
}

// =============================================================== CONQUISTAS E PRÊMIOS (tudo num lugar só, para os pais)
const EMOJIS_CONQ = ['⭐', '🏆', '🎉', '💬', '🦷', '🚽', '🍽️', '😴', '👟', '🧸'];
export function TelaConquistasPremios() {
  const { idioma, estado, abrir, exigir, v14, mudarV14, mostrarAviso } = useRotina();
  const [novo, setNovo] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const prog = progressoDoMes(estado, idioma);
  const mes = new Date().toLocaleString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { month: 'long' });
  const grande = (emo: string, r: string, d: string, cor: string, onPress: () => void, rot: string) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={rot} style={({ pressed }) => [{ width: '50%', padding: 5, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <View style={{ minHeight: 96, borderRadius: 18, backgroundColor: cor, padding: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 26 }}>{emo}</Text>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF', marginTop: 4 }}>{r}</Text>
        <Text style={{ fontSize: 11.5, color: '#FFFFFFDD', marginTop: 2 }}>{d}</Text>
      </View>
    </Pressable>
  );
  const adicionar = () => {
    const t = novo.trim().slice(0, 60);
    if (!t) return;
    mudarV14({ conquistasPais: [...v14.conquistasPais, { id: `cp${Date.now().toString(36)}`, titulo: t, emoji }].slice(0, 30) });
    setNovo(''); mostrarAviso(X(idioma, '✅ Conquista criada.', '✅ Achievement created.', '✅ Logro creado.'));
  };
  return (
    <View style={{ flex: 1 }}>
      <Topo kicker={X(idioma, 'AJUSTES', 'SETTINGS', 'AJUSTES')} titulo={X(idioma, 'Conquistas e prêmios', 'Achievements and prizes', 'Logros y premios')} sub={X(idioma, 'Tudo o que motiva a criança, num lugar só.', 'Everything that motivates the child, in one place.', 'Todo lo que motiva al niño, en un solo lugar.')} />
      <Rolagem>
        <Secao titulo={X(idioma, 'PRÊMIOS E ESTRELAS', 'PRIZES AND STARS', 'PREMIOS Y ESTRELLAS')} />
        <AlvoTour id="cq_premios"><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
          {grande('🎁', X(idioma, 'Prêmios', 'Prizes', 'Premios'), X(idioma, 'Criar e editar a loja', 'Create and edit the shop', 'Crear y editar la tienda'), '#9333EA', () => abrir({ nome: 'gerenciarLoja' }), 'editar prêmios')}
          {grande('🎯', X(idioma, 'Metas', 'Goals', 'Metas'), X(idioma, 'Estrelas extras por objetivo', 'Extra stars per goal', 'Estrellas extra por objetivo'), '#0284C7', () => exigir('metas', () => abrir({ nome: 'gerenciarMetas' })), 'editar metas')}
          {grande('⭐', X(idioma, 'Estrelas e liberação', 'Stars and release', 'Estrellas y liberación'), X(idioma, 'Saldo, espera e intervalo', 'Balance, wait and interval', 'Saldo, espera e intervalo'), '#D97706', () => abrir({ nome: 'ajustes', aba: 'opcoes' }), 'estrelas e liberação')}
          {grande('🏆', X(idioma, 'Ver como a criança vê', 'See as the child sees', 'Ver como el niño ve'), X(idioma, 'Loja, metas e conquistas', 'Shop, goals, achievements', 'Tienda, metas y logros'), '#16A34A', () => abrir({ nome: 'loja' }), 'ver loja')}
        </View></AlvoTour>

        <AlvoTour id="cq_mes"><Secao titulo={`🏅 ${X(idioma, 'CONQUISTAS DE', 'ACHIEVEMENTS FOR', 'LOGROS DE')} ${mes.toUpperCase()}`} /></AlvoTour>
        <T s="cap">{X(idioma, 'O app escolhe sozinho e renova todo mês. A criança ganha fazendo as coisas no dia a dia.', 'The app picks them and renews them every month. The child earns them in daily life.', 'La app los elige y los renueva cada mes. El niño los gana en el día a día.')}</T>
        {prog.map((c) => (
          <View key={c.id} accessibilityLabel={`conquista do mês ${c.titulo}`} style={{ backgroundColor: c.ganhou ? '#F0FDF4' : '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: c.ganhou ? '#86EFAC' : '#E2E8F0', padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 26, marginRight: 10 }}>{c.ganhou ? '🏆' : c.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '900', color: '#0F172A' }}>{c.titulo}</Text>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', marginTop: 6, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, (c.feito / c.alvo) * 100)}%`, height: '100%', backgroundColor: c.ganhou ? '#16A34A' : '#F97316' }} /></View>
            </View>
            <Text style={{ marginLeft: 10, fontWeight: '900', color: c.ganhou ? '#15803D' : '#64748B' }}>{Math.min(c.feito, c.alvo)}/{c.alvo}</Text>
          </View>
        ))}
        <T s="cap" style={{ marginTop: 6, fontSize: 11 }}>📚 {FONTE_CONQUISTAS[idioma]}</T>

        <AlvoTour id="cq_familia"><Secao titulo={X(idioma, '👨‍👩‍👧 CONQUISTAS DA FAMÍLIA (VOCÊ CRIA)', '👨‍👩‍👧 FAMILY ACHIEVEMENTS (YOU CREATE)', '👨‍👩‍👧 LOGROS DE LA FAMILIA (TÚ CREAS)')} /></AlvoTour>
        {v14.conquistasPais.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: c.feitaEm ? '#86EFAC' : '#E2E8F0', padding: 10, marginTop: 8 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>{c.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '800', color: '#0F172A' }}>{c.titulo}</Text>
            <Pressable onPress={() => mudarV14({ conquistasPais: v14.conquistasPais.map((x) => (x.id === c.id ? { ...x, feitaEm: x.feitaEm ? undefined : Date.now() } : x)) })} accessibilityRole="button" accessibilityLabel={`marcar ${c.titulo}`}
              style={{ height: 38, borderRadius: 19, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: c.feitaEm ? '#16A34A' : '#F1F5F9', marginRight: 6 }}>
              <Text style={{ fontWeight: '900', color: c.feitaEm ? '#FFFFFF' : '#475569', fontSize: 12.5 }}>{c.feitaEm ? X(idioma, '✓ CONSEGUIU', '✓ DONE', '✓ LOGRADO') : X(idioma, 'CONSEGUIU?', 'DONE?', '¿LOGRADO?')}</Text>
            </Pressable>
            <Pressable onPress={() => mudarV14({ conquistasPais: v14.conquistasPais.filter((x) => x.id !== c.id) })} accessibilityRole="button" accessibilityLabel={`apagar ${c.titulo}`} hitSlop={8} style={{ padding: 6 }}><Text style={{ fontSize: 16 }}>🗑️</Text></Pressable>
          </View>
        ))}
        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 16, borderWidth: 1.5, borderColor: '#FED7AA', padding: 12, marginTop: 10 }}>
          <Text style={{ fontWeight: '900', color: '#9A3412' }}>{X(idioma, 'Nova conquista', 'New achievement', 'Nuevo logro')}</Text>
          <TextInput value={novo} onChangeText={(v) => setNovo(v.slice(0, 60))} placeholder={X(idioma, 'Ex.: Escovou os dentes sozinho', 'E.g. Brushed teeth alone', 'Ej.: Se cepilló solo')} placeholderTextColor={C.faint} accessibilityLabel="nome da nova conquista"
            style={{ height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#FFFFFF', paddingHorizontal: 16, marginTop: 8, fontSize: 15 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {EMOJIS_CONQ.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} accessibilityLabel={`emoji ${e}`} style={{ width: 42, height: 42, borderRadius: 12, margin: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: emoji === e ? '#F97316' : '#E2E8F0', backgroundColor: '#FFFFFF' }}><Text style={{ fontSize: 20 }}>{e}</Text></Pressable>
            ))}
          </View>
          <View style={{ height: 8 }} />
          <B titulo={X(idioma, '+ Criar conquista', '+ Create achievement', '+ Crear logro')} cor={CORES_MARCA.laranja} onPress={adicionar} disabled={!novo.trim()} />
        </View>
      </Rolagem>
    </View>
  );
}

/** Abre a tela certa. */
export function TelaDoV14({ tela, grupo }: { tela: TelaV14; grupo?: string }) {
  switch (tela) {
    case 'grupo': return <TelaGrupo grupo={grupo} />;
    case 'conquistas': return <TelaConquistasPremios />;
    case 'backup': return <TelaBackup />;
    case 'vozes': return <TelaVozes />;
    case 'pais': case 'missao': return <TelaPais />;
    case 'duvidas': return <TelaDuvidas />;
    case 'curso': return <TelaCurso />;
    case 'ia': return <TelaIA />;
    case 'rapida': case 'assistente': return <TelaCriacaoRapida />;
    case 'conforto': return <TelaConforto />;
    case 'crescer': return <TelaCrescer />;
    case 'senha': return <TelaSenha />;
    case 'emergencia': return <TelaEmergencia />;
  }
}
