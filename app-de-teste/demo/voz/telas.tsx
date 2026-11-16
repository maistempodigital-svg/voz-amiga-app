// SIMULAÇÃO das telas de Ajustes do Voz Amiga (para o APK de teste).
import React, { useState } from 'react';
import { BlocoPlanos, EscolherFixas, PlanoVenda, usePremiumDemo } from '../premium';
import { tp } from '../../src/rotina-amiga/v14/premium';
const p0Id = (id?: string) => id || '';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View , useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlvoTour, CreditoArasaac, DestaqueCriacaoRapida, DicaEspecialistas, FuncoesDoApp, RolagemTour, useItensAjustesRotina, useRotina } from '../../src/rotina-amiga';
import { PACOTES_ROTINA, itensPacote } from '../../src/rotina-amiga/v14/pacotes';
import { pacoteGratis } from '../../src/rotina-amiga/logica/plano';
import { contarParaLimite } from '../migracaoV24';
import { sugerirBotaoIA } from '../../src/rotina-amiga/v14/ia';
import { precisaLembrete, TEXTO_LEMBRETE } from '../../src/rotina-amiga/v14/pais';
import { chaveDia } from '../../src/rotina-amiga/logica/tempo';
import {
  abrirLink, BANCO, BotaoCor, Cab, CartaoDef, Deslizar, escolherArquivo, Estado, falarTexto, Lista, listarVozes, novoId, PACOTES, PranchaVoz, ponte, reduzirImagem, tema, TEMAS, useGravador, useVoz, categoriaAuto, buscarPictoArasaac } from './base';

export type TelaVoz =
  | { n: 'home' } | { n: 'ajustes' } | { n: 'criar'; id?: string; abaId?: string; foto?: boolean } | { n: 'abas' } | { n: 'pacotes' }
  | { n: 'assinatura' } | { n: 'sobre' } | { n: 'curso' } | { n: 'definicoes' };

type Nav = { ir: (t: TelaVoz) => void; voltar: () => void; casa: () => void };

const Fundo = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>{children}</SafeAreaView>
);

// ------------------------------------------------------------ AJUSTES E OPÇÕES
function Quadro({ titulo, icone, cor, claro, fundoIcone, onPress, ativo, f = 'feather', tour }: { titulo: string; icone: string; cor: string; claro: string; fundoIcone: string; onPress: () => void; ativo?: boolean; f?: 'feather' | 'mci'; tour?: string }) {
  return (
    <AlvoTour id={tour || titulo} style={{ width: '48.5%', marginBottom: 9 }}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={titulo} style={({ pressed }) => [{ width: '100%', height: 82, borderRadius: 14, borderWidth: ativo ? 2.5 : 1.2, borderColor: ativo ? '#7E22CE' : cor, backgroundColor: ativo ? '#FAF5FF' : claro, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 }]}>
      {ativo ? <View style={{ position: 'absolute', top: 6, right: 8, backgroundColor: '#7E22CE', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>ATIVO</Text></View> : null}
      <View style={{ width: 37, height: 37, borderRadius: 11, backgroundColor: ativo ? '#F3E8FF' : fundoIcone, alignItems: 'center', justifyContent: 'center' }}>
        {f === 'mci' ? <MaterialCommunityIcons name={icone as never} size={19} color={cor} /> : <Feather name={(ativo ? 'check-circle' : icone) as never} size={18} color={ativo ? '#7E22CE' : cor} />}
      </View>
      <Text style={{ fontSize: 10, fontWeight: '900', color: '#0F172A', marginTop: 8 }} numberOfLines={1}>{titulo}</Text>
    </Pressable>
    </AlvoTour>
  );
}

function Linha({ titulo, sub, icone, cor, claro, borda, onPress, vermelho }: { titulo: string; sub?: string; icone: string; cor: string; claro: string; borda: string; onPress: () => void; vermelho?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={titulo} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.2, borderColor: borda, backgroundColor: claro, padding: 12, marginBottom: 10, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: vermelho ? '#FEE2E2' : '#FFFFFF80', alignItems: 'center', justifyContent: 'center' }}><Feather name={icone as never} size={18} color={cor} /></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: vermelho ? '#B91C1C' : '#0F172A' }}>{titulo}</Text>
        {sub ? <Text style={{ fontSize: 11, color: vermelho ? '#B91C1C' : '#475569' }}>{sub}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={vermelho ? '#B91C1C' : '#475569'} />
    </Pressable>
  );
}

export function AjustesVoz({ ir, casa }: Nav) {
  const { s, mudar, toast } = useVoz();
  const novos = useItensAjustesRotina(); // ROTINA AMIGA (o relatório unificado fica lá dentro)
  const { recurso, idioma, estado: estR, abrir } = useRotina();
  const hoje = chaveDia(new Date());
  const lembrete = recurso('lembretePais') && precisaLembrete(new Date(), estR.v14?.lembreteHora ?? 18, estR.log.some((e) => e.tipo === 'modelo' && chaveDia(new Date(e.t)) === hoje));
  const [sair, setSair] = useState(false);
  const modo = (m: 'editar' | 'excluir') => { mudar((x) => ({ ...x, modo: x.modo === m ? 'normal' : m })); casa(); toast(m === 'editar' ? 'Toque na prancha que quer editar.' : 'Toque nas pranchas que quer excluir.'); };
  return (
    <Fundo>
      <Cab icone="settings" titulo="Ajustes e Opções" onFechar={casa} />
      <RolagemTour contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: 40 }}>
        {lembrete ? (
          <Pressable onPress={() => abrir({ nome: 'v14', tela: 'pais' })} accessibilityRole="button" accessibilityLabel="lembrete para os pais" style={{ backgroundColor: '#FFF7ED', borderWidth: 1.5, borderColor: '#FDBA74', borderRadius: 14, padding: 10, marginBottom: 9 }}>
            <Text style={{ fontWeight: '800', color: '#9A3412', fontSize: 13 }}>⏰ {TEXTO_LEMBRETE[idioma]}</Text>
          </Pressable>
        ) : null}
        {/* v14.2: CONQUISTAS E PRÊMIOS em destaque */}
        {novos.filter((it) => it.id === 'conquistasPremios').map((it) => (
          <AlvoTour key={it.id} id="aj_conquistas">
            <Pressable onPress={it.aoTocar} accessibilityRole="button" accessibilityLabel={it.rotulo} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', height: 70, borderRadius: 16, backgroundColor: '#F59E0B', paddingHorizontal: 16, marginBottom: 10, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <Text style={{ fontSize: 30 }}>🏆</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>{it.rotulo}</Text>
                <Text style={{ fontSize: 12, color: '#FFFBEB' }}>Prêmios, metas e conquistas do mês</Text>
              </View>
              <Feather name="chevron-right" size={22} color="#FFFFFF" />
            </Pressable>
          </AlvoTour>
        ))}
        {/* v14.6: a Criação rápida fica DENTRO do Criar prancha */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Quadro tour="aj_criar" titulo="CRIAR PRANCHA" icone="plus" cor="#3B82F6" claro="#EFF6FF" fundoIcone="#DBEAFE" onPress={() => ir({ n: 'criar' })} />
          <Quadro tour="aj_editar" titulo={s.modo === 'editar' ? 'SAIR DA EDIÇÃO' : 'EDITAR PRANCHAS'} ativo={s.modo === 'editar'} icone="edit-2" cor="#F97316" claro="#FFF7ED" fundoIcone="#FFEDD5" onPress={() => modo('editar')} />
          {/* v14: apagar pranchas vem DESLIGADO (Mais funções › Permitir apagar pranchas) e sempre pede confirmação */}
          {recurso('apagarPranchas') || s.modo === 'excluir' ? <Quadro tour="aj_excluir" titulo={s.modo === 'excluir' ? 'SAIR DE EXCLUIR' : 'EXCLUIR PRANCHAS'} ativo={s.modo === 'excluir'} icone="trash-2" cor="#F43F5E" claro="#FFF1F2" fundoIcone="#FFE4E6" onPress={() => modo('excluir')} /> : null}
          <Quadro tour="aj_gerir" titulo="GERIR ABAS" icone="folder" cor="#EAB308" claro="#FEFCE8" fundoIcone="#FEF3C7" onPress={() => ir({ n: 'abas' })} />
          <Quadro tour="aj_editarAbas" titulo={s.editarAbas ? 'SAIR DE EDITAR ABAS' : 'EDITAR ABAS'} ativo={s.editarAbas} icone="layers" cor="#7E22CE" claro="#FAF5FF" fundoIcone="#F3E8FF" onPress={() => { mudar((x) => ({ ...x, editarAbas: !x.editarAbas })); if (!s.editarAbas) { casa(); toast('Toque numa aba lá em cima para editar.'); } }} />
          <Quadro tour="aj_pacotes" titulo="BAIXAR PACOTES" icone="package" cor="#F59E0B" claro="#FFF7ED" fundoIcone="#FFEDD5" onPress={() => ir({ n: 'pacotes' })} />
          <Quadro tour="aj_assinatura" titulo="MINHA ASSINATURA" icone="credit-card" cor="#22C55E" claro="#F0FDF4" fundoIcone="#DCFCE7" onPress={() => ir({ n: 'assinatura' })} />
          <Quadro tour="aj_sobre" titulo="SOBRE A CAA" icone="info" cor="#22D3EE" claro="#ECFEFF" fundoIcone="#CFFAFE" onPress={() => ir({ n: 'sobre' })} />
          {/* NOVO (Rotina Amiga) — mesmo formato dos outros quadros */}
          {novos.filter((it) => it.id !== 'conquistasPremios').map((it) => <Quadro key={it.id} tour={({ ajustesRotina: 'aj_rotina', relatorio: 'aj_relatorio', ajuda: 'aj_ajuda', cursoPais: 'aj_curso' } as Record<string, string>)[it.id] || it.id} titulo={it.rotulo} f={it.icone.f} icone={it.icone.n} cor={it.cor} claro={it.fundo} fundoIcone={it.fundoIcone} onPress={it.aoTocar} />)}
        </View>
        <AlvoTour id="aj_definicoes"><Linha titulo="DEFINIÇÕES" icone="sliders" cor="#0F172A" claro="#FFFFFF" borda="#CBD5E1" onPress={() => ir({ n: 'definicoes' })} /></AlvoTour>
        <Linha titulo="SUPORTE (SEG-SEX 08H-16H)" icone="mail" cor="#059669" claro="#ECFDF5" borda="#34D399" onPress={() => abrirLink('mailto:grupoamigapp@gmail.com')} />
        <Linha titulo="CONHEÇA NOSSO INSTAGRAM!" icone="instagram" cor="#4F46E5" claro="#EEF2FF" borda="#818CF8" onPress={() => abrirLink('https://www.instagram.com/appvoz_amiga/')} />
        <Linha titulo="SAIR DA CONTA" sub="conta de teste" icone="log-out" cor="#DC2626" claro="#FFF5F5" borda="#FECACA" vermelho onPress={() => setSair(true)} />
      </RolagemTour>
      <Modal visible={sair} transparent animationType="fade" onRequestClose={() => setSair(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>Sair da conta?</Text>
            <Text style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>No app oficial, isto encerra o login (Firebase, sem mudanças). Neste teste não há conta: você pode apagar os dados de teste e começar de novo.</Text>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <BotaoCor titulo="Cancelar" cor="#E2E8F0" texto="#334155" flex onPress={() => setSair(false)} />
              <View style={{ width: 8 }} />
              <BotaoCor titulo="Apagar dados" cor="#DC2626" flex onPress={async () => {
                try { localStorage.clear(); } catch { /* */ }
                if (typeof window !== 'undefined') window.location.reload();
              }} />
            </View>
          </View>
        </View>
      </Modal>
    </Fundo>
  );
}

// ------------------------------------------------------------ CRIAR / EDITAR PRANCHA
export function CriarPrancha({ id, abaId, voltar, casa }: Nav & { id?: string; abaId?: string; foto?: boolean }) {
  const { s, mudar, toast, tocar } = useVoz();
  const { recurso, idioma: idiomaRot, limites, pode, pedirPlano } = useRotina();
  const orig = s.pranchas.find((p) => p.id === id);
  // v14.8: plano grátis = só emojis; voz gravada e quantidade de pranchas pelo limite do Firebase
  const fotoLiberada = pode('foto');
  const comAudio = s.pranchas.filter((q) => q.audio && q.id !== p0Id(id)).length;
  const vozLiberada = comAudio < limites.vozGravada;
  // categoria: a aba aberta, ou AUTOMÁTICA (o app escolhe pelo texto; os pais podem trocar)
  const [p, setP] = useState<PranchaVoz>(() => orig || { id: novoId('p'), texto: '', abaId: abaId && abaId !== 'geral' ? abaId : 'auto' });
  const [banco, setBanco] = useState(false);
  const [picto, setPicto] = useState(false);
  const [novaAba, setNovaAba] = useState(false);
  const grav = useGravador();
  const set = (x: Partial<PranchaVoz>) => setP((o) => ({ ...o, ...x }));

  const foto = async (camera: boolean) => {
    if (!fotoLiberada) { pedirPlano('foto'); return; }
    try {
      const r = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!r.canceled && r.assets?.[0]?.uri) set({ imagem: await reduzirImagem(r.assets[0].uri), emoji: undefined });
    } catch { toast(camera ? 'Sem acesso à câmera.' : 'Sem acesso à galeria.'); }
  };
  const sugIA = recurso('ia') && p.texto.trim().length >= 2 ? sugerirBotaoIA(p.texto) : undefined;
  const gravar = async () => {
    if (!vozLiberada && !grav.gravando) { pedirPlano('vozGravada'); return; }
    if (grav.gravando) { const a = await grav.parar(); if (a) { set({ audio: a }); toast('Áudio pronto para salvar.'); } return; }
    const erro = await grav.iniciar();
    if (erro) toast(erro);
  };
  const audioGaleria = async () => {
    if (!vozLiberada) { pedirPlano('vozGravada'); return; }
    const a = await escolherArquivo('audio/*');
    if (!a) return;
    if (a.length > 2_500_000) { toast('Áudio muito grande. Escolha um mais curto.'); return; }
    set({ audio: a }); toast('Áudio carregado!');
  };
  const salvar = () => {
    if (!p.texto.trim()) { toast('Escreva o que a prancha diz.'); return; }
    if (!p.abaId) { toast('Selecione uma aba.'); return; }
    if (!orig && contarParaLimite(s.pranchas) >= limites.pranchas) { pedirPlano('prancha'); return; }
    // grátis: foto/desenho/voz gravada que sobrou de antes não é salva numa prancha NOVA
    if (!orig && ((p.imagem && !fotoLiberada) || (p.audio && !vozLiberada))) { pedirPlano(p.imagem && !fotoLiberada ? 'foto' : 'vozGravada'); return; }
    const abaFinal = p.abaId === 'auto' || p.abaId === 'geral' ? categoriaAuto(p.texto) : p.abaId;
    mudar((x) => {
      const i = x.pranchas.findIndex((y) => y.id === p.id);
      const lista = [...x.pranchas];
      const nova = { ...p, abaId: abaFinal, texto: p.texto.trim().slice(0, 40), emoji: p.imagem ? undefined : p.emoji || '💬' };
      if (i >= 0) lista[i] = nova; else lista.push(nova);
      return { ...x, pranchas: lista, dicas: { ...x.dicas, criou: true } };
    });
    toast(orig ? 'Prancha atualizada!' : `Prancha criada em ${s.abas.find((a) => a.id === abaFinal)?.nome || ''}!`);
    if (orig) casa(); else voltar();
  };
  const t = tema(s.abas.find((a) => a.id === (p.abaId === 'auto' ? categoriaAuto(p.texto) : p.abaId))?.tema);
  return (
    <Fundo>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}><Feather name={orig ? 'edit-2' : 'plus'} size={18} color="#16A34A" /></View>
        <Text style={{ flex: 1, marginLeft: 10, fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{orig ? 'Editar Prancha' : 'Criar Prancha'}</Text>
        <Pressable onPress={voltar} accessibilityLabel="Voltar" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}><Feather name="arrow-left" size={18} color="#0F172A" /></Pressable>
        <Pressable onPress={voltar} accessibilityLabel="Fechar" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}><Feather name="x" size={18} color="#DC2626" /></Pressable>
      </View>
      <RolagemTour contentContainerStyle={{ padding: 13, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* v14.6: CRIAÇÃO RÁPIDA (o pai só toca; substitui o "criar falando") */}
        {!orig ? (
          <>
            <DestaqueCriacaoRapida antes={casa} />
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 0.6, marginBottom: 6 }}>OU CRIE UMA PRANCHA DO JEITO NORMAL:</Text>
          </>
        ) : null}
        <Text style={{ fontSize: 17, fontWeight: '900', color: '#334155' }}>Imagem da Prancha</Text>
        {!fotoLiberada ? <Text accessibilityLabel="dica só emojis" style={{ marginTop: 4, fontSize: 12, color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 10, padding: 8 }}>{tp('soEmoji', idiomaRot)} {tp('poucosBotoes', idiomaRot)}</Text> : null}
        {p.imagem || p.emoji ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: 90, height: 90, borderRadius: 16, borderWidth: 2.5, borderColor: t.borda, backgroundColor: t.claro, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {p.imagem ? <Image source={{ uri: p.imagem }} style={{ width: 86, height: 86 }} resizeMode="contain" /> : <Text style={{ fontSize: 46 }}>{p.emoji}</Text>}
            </View>
            <Pressable onPress={() => set({ imagem: undefined, emoji: undefined })} style={{ marginLeft: 12, padding: 8 }}><Text style={{ color: '#DC2626', fontWeight: '900' }}>Remover Imagem</Text></Pressable>
          </View>
        ) : null}
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.8, marginTop: 12 }}>O QUE A PRANCHA DIZ?</Text>
        <AlvoTour id="cp_texto"><TextInput value={p.texto} onChangeText={(v) => set({ texto: v })} placeholder="Ex: Obrigado" placeholderTextColor="#94A3B8" style={{ marginTop: 6, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 16, fontWeight: '700', color: '#0F172A' }} /></AlvoTour>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <AlvoTour id="cp_camera" style={{ flex: 1 }}><BotaoCor pequeno titulo={fotoLiberada ? 'Câmera' : 'Câmera 👑'} rotulo="Câmera" icone="camera" cor="#14B8A6" alto={38} onPress={() => foto(true)} /></AlvoTour><View style={{ width: 6 }} />
          <AlvoTour id="cp_galeria" style={{ flex: 1 }}><BotaoCor pequeno titulo={fotoLiberada ? 'Galeria' : 'Galeria 👑'} rotulo="Galeria" icone="image" cor="#0EA5E9" alto={38} onPress={() => foto(false)} /></AlvoTour><View style={{ width: 6 }} />
          <AlvoTour id="cp_banco" style={{ flex: 1 }}><BotaoCor pequeno titulo="Banco" icone="database" cor="#3B82F6" alto={38} onPress={() => setBanco(true)} /></AlvoTour><View style={{ width: 6 }} />
          <AlvoTour id="cp_picto" style={{ flex: 1 }}><BotaoCor pequeno titulo={fotoLiberada ? 'Picto' : 'Picto 👑'} rotulo="Picto" icone="search" cor="#F59E0B" alto={38} onPress={() => (fotoLiberada ? setPicto(true) : pedirPlano('foto'))} /></AlvoTour>
        </View>
        {sugIA && (sugIA.nome !== p.texto.trim() || (p.abaId !== 'auto' && p.abaId !== sugIA.categoria)) ? (
          <Pressable onPress={() => set({ texto: sugIA.nome, abaId: sugIA.categoria })} accessibilityRole="button" accessibilityLabel="usar sugestão da IA" style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', borderWidth: 1.5, borderColor: '#C4B5FD', borderRadius: 14, padding: 8 }}>
            <Text style={{ flex: 1, color: '#5B21B6', fontWeight: '800', fontSize: 12 }}>✨ Sugestão: "{sugIA.nome}" · {s.abas.find((a) => a.id === sugIA.categoria)?.nome || sugIA.categoria}</Text>
            <Text style={{ color: '#5B21B6', fontWeight: '900', fontSize: 12 }}>USAR</Text>
          </Pressable>
        ) : null}
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>CATEGORIA (COR)</Text>
        <AlvoTour id="cp_aba"><Lista rotulo="Aba de destino" valor={p.abaId} onChange={(v) => { if (v === '__nova') setNovaAba(true); else set({ abaId: v }); }}
          opcoes={[{ v: 'auto', r: `🤖 Automática${p.texto.trim() ? ` (${s.abas.find((a) => a.id === categoriaAuto(p.texto))?.nome})` : ''}`, cor: tema(s.abas.find((a) => a.id === categoriaAuto(p.texto))?.tema).fundo }, ...s.abas.filter((a) => a.id !== 'geral').map((a) => ({ v: a.id, r: a.nome, cor: tema(a.tema).fundo })), { v: '__nova', r: '➕ Criar nova aba' }]} /></AlvoTour>
        <AlvoTour id="cp_audio"><View style={{ marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', padding: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0C4A6E' }}>Áudio (Opcional)</Text>
          <Text style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Grave a sua voz no momento ou escolha um áudio do telemóvel.</Text>
          {p.audio ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 8 }}>
              <Pressable onPress={() => tocar({ ...p, texto: p.texto || 'áudio' })} accessibilityLabel="Ouvir áudio" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}><Feather name="play" size={16} color="#fff" /></Pressable>
              <Text style={{ flex: 1, marginLeft: 10, fontWeight: '800', color: '#166534' }}>Esta prancha tem uma voz gravada.</Text>
              <Pressable onPress={() => { set({ audio: undefined }); toast('Áudio apagado. A prancha usará a voz nativa.'); }} style={{ padding: 6 }}><Feather name="trash-2" size={18} color="#DC2626" /></Pressable>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <BotaoCor titulo={grav.gravando ? 'Parar' : (p.audio ? 'Gravar de novo' : 'Gravar') + (vozLiberada ? '' : ' 👑')} rotulo="Gravar" icone={grav.gravando ? 'square' : 'mic'} cor={grav.gravando ? '#991B1B' : '#EF4444'} alto={38} flex onPress={gravar} />
            <View style={{ width: 8 }} />
             <BotaoCor titulo={vozLiberada ? 'Galeria' : 'Galeria 👑'} rotulo="Áudio da galeria" icone="music" cor="#6366F1" alto={38} flex onPress={audioGaleria} />
          </View>
          {grav.gravando ? <Text style={{ marginTop: 8, color: '#DC2626', fontWeight: '800' }}>● Microfone captando...</Text> : null}
        </View></AlvoTour>
        <View style={{ height: 14 }} />
        <AlvoTour id="cp_salvar"><BotaoCor titulo="Salvar Prancha" cor="#22C55E" alto={48} onPress={salvar} /></AlvoTour>
        {/* v14.3: crédito e explicação dos desenhos ARASAAC (texto oficial do site) */}
        <CreditoArasaac idioma={idiomaRot} />
      </RolagemTour>

      <Modal visible={banco} transparent animationType="slide" onRequestClose={() => setBanco(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, maxHeight: '70%' }}>
            <Cab icone="database" cor="#2563EB" fundo="#DBEAFE" titulo="Banco de imagens" onFechar={() => setBanco(false)} />
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {BANCO.map((e, i) => (
                <Pressable key={i} onPress={() => { set({ emoji: e, imagem: undefined }); setBanco(false); }} style={{ width: '16.66%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 30 }}>{e}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BuscaPicto visivel={picto} inicial={p.texto} fechar={() => setPicto(false)} escolher={(url) => { set({ imagem: url, emoji: undefined }); setPicto(false); }} />
      <NovaAbaModal visivel={novaAba} fechar={() => setNovaAba(false)} criada={(abaId) => { set({ abaId }); setNovaAba(false); }} />
    </Fundo>
  );
}

function BuscaPicto({ visivel, inicial, fechar, escolher }: { visivel: boolean; inicial: string; fechar: () => void; escolher: (url: string) => void }) {
  const { idioma } = useRotina();
  const [q, setQ] = useState(inicial);
  const [ids, setIds] = useState<number[]>([]);
  const [st, setSt] = useState('');
  React.useEffect(() => { if (visivel) setQ(inicial); }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps
  const buscar = async () => {
    if (!q.trim()) { setSt('Digite uma palavra.'); return; }
    setSt('Buscando...'); setIds([]);
    try {
      const r = await fetch(`https://api.arasaac.org/v1/pictograms/pt/search/${encodeURIComponent(q.trim())}`);
      const j: unknown = r.ok ? await r.json() : [];
      // só números inteiros viram endereço de imagem (resposta estranha é ignorada)
      const l = (Array.isArray(j) ? j : []).map((x) => (x && typeof x === 'object' ? (x as { _id?: unknown })._id : undefined))
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 1e7).slice(0, 18);
      setIds(l); setSt(l.length ? 'Toque numa imagem para usar.' : 'Nenhum pictograma encontrado no ARASAAC.');
    } catch { setSt('Sem internet para buscar pictogramas agora.'); }
  };
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, height: '80%' }}>
          <Cab icone="search" cor="#D97706" fundo="#FEF3C7" titulo="Pictogramas" onFechar={fechar} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput value={q} onChangeText={setQ} onSubmitEditing={buscar} placeholder="Ex: água, brincar, mamãe" placeholderTextColor="#94A3B8" style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, fontSize: 15 }} />
            <View style={{ width: 8 }} />
            <BotaoCor titulo="Buscar" cor="#F59E0B" alto={44} onPress={buscar} />
          </View>
          {/* v14.2: aviso claro — banco externo e gratuito, não é do Voz Amiga */}
          <View accessibilityLabel="aviso pictogramas gratuitos"><CreditoArasaac idioma={idioma} /></View>
          <Text style={{ marginTop: 8, color: '#475569', fontWeight: '700' }}>{st}</Text>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {ids.map((id) => {
              const url = `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
              return (
                <Pressable key={id} onPress={() => escolher(url)} style={{ width: '31%', aspectRatio: 1, margin: '1%', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri: url }} style={{ width: '85%', height: '85%' }} resizeMode="contain" />
                </Pressable>
              );
            })}
          </ScrollView>
          {/* crédito exigido pela ARASAAC (autor, origem, licença e propriedade) */}
          
        </View>
      </View>
    </Modal>
  );
}

const CORES_ABA = ['COMUNICACAO', 'EMOCOES', 'APRENDIZAGEM', 'SOCIALIZACAO', 'ALIMENTOS', 'FAVORITOS', 'ROXO', 'LILAS', 'CIANO', 'VERDE_AGUA', 'VERDE_ESCURO', 'AZUL_ESCURO', 'MARROM', 'CINZA', 'ESCURO'];

export function SeletorTema({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {CORES_ABA.map((c) => (
        <Pressable key={c} onPress={() => onChange(c)} accessibilityLabel={`cor ${TEMAS[c].nome}`} style={{ width: 34, height: 34, borderRadius: 17, margin: 4, backgroundColor: TEMAS[c].fundo, borderWidth: valor === c ? 3 : 1, borderColor: valor === c ? '#0F172A' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          {valor === c ? <Feather name="check" size={16} color="#fff" /> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function NovaAbaModal({ visivel, fechar, criada, abaId }: { visivel: boolean; fechar: () => void; criada?: (id: string) => void; abaId?: string }) {
  const { s, mudar, toast } = useVoz();
  const orig = s.abas.find((a) => a.id === abaId);
  const [nome, setNome] = useState('');
  const [t, setT] = useState('COMUNICACAO');
  const [confirmar, setConfirmar] = useState(false);
  const podeApagar = useRotina().recurso('apagarPranchas');
  React.useEffect(() => { if (visivel) { setNome(orig?.nome || ''); setT(orig?.tema || 'COMUNICACAO'); setConfirmar(false); } }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{orig ? 'Editar aba' : 'Nova aba'}</Text>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', marginTop: 12 }}>NOME DA ABA</Text>
          <TextInput value={nome} onChangeText={setNome} placeholder="Ex: Emoções" placeholderTextColor="#94A3B8" style={{ marginTop: 6, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, fontSize: 15 }} />
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', marginTop: 12, marginBottom: 4 }}>COR DA ABA</Text>
          <SeletorTema valor={t} onChange={setT} />
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            {orig && podeApagar ? <><BotaoCor titulo={confirmar ? 'Confirmar exclusão' : 'Excluir'} cor="#DC2626" flex onPress={() => {
              if (s.abas.length <= 1) { toast('Precisa ficar pelo menos uma aba.'); return; }
              const n = s.pranchas.filter((p) => p.abaId === orig.id).length;
              if (!confirmar) { setConfirmar(true); toast(n ? `Isso apaga também ${n} pranchas. Toque de novo para confirmar.` : 'Toque de novo para confirmar.'); return; }
              mudar((x) => ({ ...x, abas: x.abas.filter((a) => a.id !== orig.id), pranchas: x.pranchas.filter((p) => p.abaId !== orig.id) })); toast('Aba excluída.'); fechar();
            }} /><View style={{ width: 8 }} /></> : <><BotaoCor titulo="Cancelar" cor="#E2E8F0" texto="#334155" flex onPress={fechar} /><View style={{ width: 8 }} /></>}
            <BotaoCor titulo={orig ? 'Salvar' : 'Criar'} cor="#2563EB" flex desativado={!nome.trim()} onPress={() => {
              const id = orig?.id || novoId('aba');
              mudar((x) => ({ ...x, abas: orig ? x.abas.map((a) => (a.id === id ? { ...a, nome: nome.trim(), tema: t } : a)) : [...x.abas, { id, nome: nome.trim(), tema: t }] }));
              toast(orig ? 'Aba salva.' : 'Aba criada.');
              if (criada) criada(id); else fechar();
            }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ------------------------------------------------------------ GERIR ABAS
export function GerirAbas({ voltar, casa }: Nav) {
  const { s, mudar } = useVoz();
  const [edit, setEdit] = useState<string | undefined>();
  const [nova, setNova] = useState(false);
  const mover = (i: number, d: number) => mudar((x) => { const a = [...x.abas]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, abas: a }; });
  return (
    <Fundo>
      <Cab icone="folder" cor="#CA8A04" fundo="#FEF3C7" titulo="Gerir Abas" onVoltar={voltar} onFechar={voltar} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        {s.abas.map((a, i) => {
          const t = tema(a.tema);
          const n = a.id === 'geral' ? s.pranchas.length : s.pranchas.filter((p) => p.abaId === a.id).length;
          return (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.claro, borderWidth: 1.5, borderColor: t.borda, borderRadius: 16, padding: 10, marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: t.fundo, alignItems: 'center', justifyContent: 'center' }}><Feather name={t.iconeNome as never} size={17} color={t.texto} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>{a.nome}</Text>
                <Text style={{ fontSize: 11, color: '#475569' }}>{n} pranchas · {a.id === 'geral' ? 'todas, cada uma com a cor da categoria' : t.nome}</Text>
              </View>
              <Pressable onPress={() => mover(i, -1)} accessibilityLabel={`subir ${a.nome}`} style={{ padding: 6 }}><Feather name="chevron-up" size={18} color="#334155" /></Pressable>
              <Pressable onPress={() => mover(i, 1)} accessibilityLabel={`descer ${a.nome}`} style={{ padding: 6 }}><Feather name="chevron-down" size={18} color="#334155" /></Pressable>
              {a.id === 'geral' ? null : <Pressable onPress={() => setEdit(a.id)} accessibilityLabel={`editar ${a.nome}`} style={{ padding: 6 }}><Feather name="edit-2" size={17} color="#2563EB" /></Pressable>}
            </View>
          );
        })}
        <BotaoCor titulo="Nova aba" icone="plus" cor="#EAB308" texto="#422006" onPress={() => setNova(true)} />
      </ScrollView>
      <NovaAbaModal visivel={!!edit} abaId={edit} fechar={() => setEdit(undefined)} />
      <NovaAbaModal visivel={nova} fechar={() => setNova(false)} />
    </Fundo>
  );
}

// ------------------------------------------------------------ BAIXAR PACOTES
export function Pacotes({ voltar, casa }: Nav) {
  const { s, mudar, toast } = useVoz();
  const { recurso, idioma, limites, assinante: premium, pedirPlano, pode } = useRotina();
  const { width: W, height: H } = useWindowDimensions();
  // v14.8: no grátis só os pacotes sem 👑 (Firebase limitações/rotina/pacotesGratis) e só emojis; os pacotes de rotina são grátis
  const ehRotina = (id: string) => PACOTES_ROTINA.some((r) => r.id === id);
  const gratis = (id: string) => premium || ehRotina(id) || pacoteGratis(limites, id);
  const desenhosOk = premium || pode('foto');
  // v14.3: os pacotes em GRADE em cima; o que tem o pacote escolhido fica FIXO embaixo (não some ao rolar)
  const lista: { id: string; r: string; itens: string[][]; tema?: string }[] = [
    ...(recurso('pacotesRotina') ? PACOTES_ROTINA.map((x) => ({ id: x.id, r: `${x.emoji} ${x.nome[idioma]}`, itens: itensPacote(x, idioma), tema: x.tema })) : []),
    ...PACOTES.map(([id, r, it]) => ({ id, r, itens: it.split(',').map((x) => x.split('|')) })),
  ];
  const [pac, setPac] = useState<string>();
  const p = lista.find((x) => x.id === pac);
  const [cor, setCor] = useState('ALIMENTOS');
  const [baixando, setBaixando] = useState<string>();
  const [comDesenhos, setComDesenhos] = useState(true);
  const colunas = W >= 900 ? 5 : W >= 600 ? 4 : 3;
  const nomeDe = (r: string) => r.replace(/^\S+\s/, '');
  const emojiDe = (r: string) => r.split(' ')[0];
  const ja = (r: string) => s.abas.some((a) => a.nome.toLowerCase() === nomeDe(r).toLowerCase());
  const escolher = (x: typeof lista[number]) => { setPac(x.id); if (x.tema) setCor(x.tema); };
  const transferir = async () => {
    if (!p || baixando) return;
    if (!gratis(p.id)) { pedirPlano('pacote'); return; }
    const espaco = premium ? Infinity : limites.pranchas - contarParaLimite(s.pranchas);
    if (espaco <= 0) { pedirPlano('prancha'); return; }
    let cortou = false;
    const nome = nomeDe(p.r);
    setBaixando('Transferindo…');
    let novas: PranchaVoz[] = [];
    mudar((x) => {
      let aba = x.abas.find((a) => a.nome.toLowerCase() === nome.toLowerCase());
      let abas = x.abas;
      if (!aba) { aba = { id: novoId('aba'), nome, tema: cor }; abas = [...abas, aba]; }
      const jaTem = new Set(x.pranchas.filter((q) => q.abaId === aba!.id).map((q) => q.texto.toLowerCase()));
      novas = p.itens.filter(([t]) => !jaTem.has(t.toLowerCase())).map(([texto, emoji]) => ({ id: novoId('p'), texto, emoji, abaId: aba!.id }));
      if (novas.length > espaco) { novas = novas.slice(0, Math.max(0, espaco)); cortou = true; }
      return { ...x, abas, pranchas: [...x.pranchas, ...novas], dicas: { ...x.dicas, criou: true } };
    });
    // desenhos do ARASAAC (com internet). Sem internet, ficam os emojis.
    let achou = 0;
    if (comDesenhos && desenhosOk) {
      for (let k = 0; k < novas.length; k++) {
        setBaixando(`Buscando desenhos ${k + 1} de ${novas.length}…`);
        const img = await buscarPictoArasaac(novas[k].texto, idioma);
        if (!img) { if (k === 0) break; continue; }
        achou++;
        const id = novas[k].id;
        mudar((x) => ({ ...x, pranchas: x.pranchas.map((q) => (q.id === id ? { ...q, imagem: img } : q)) }));
      }
    }
    setBaixando(undefined);
    toast(`Pacote "${nome}" transferido!${comDesenhos && desenhosOk ? (achou ? ` ${achou} desenhos do ARASAAC.` : ' Sem internet: ficaram os emojis.') : ''}`);
    setPac(undefined);
    if (cortou) setTimeout(() => pedirPlano('prancha'), 900);
  };
  return (
    <Fundo>
      <Cab icone="package" cor="#D97706" fundo="#FFEDD5" titulo="Baixar Pacotes" onVoltar={voltar} onFechar={voltar} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10, paddingBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#475569', marginHorizontal: 4, marginBottom: 6 }}>Toque num pacote: embaixo aparece o que ele tem. Depois toque em <Text style={{ fontWeight: '900' }}>Transferir</Text>.</Text>
        <View accessibilityLabel="grade de pacotes" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {lista.map((x) => (
            <Pressable key={x.id} onPress={() => escolher(x)} accessibilityRole="button" accessibilityLabel={`pacote ${nomeDe(x.r)}`} accessibilityState={{ selected: x.id === pac }}
              style={({ pressed }) => [{ width: `${100 / colunas}%` as unknown as number, padding: 4, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
              <View style={{ minHeight: 132, borderRadius: 16, borderWidth: 2, borderColor: x.id === pac ? '#F59E0B' : ja(x.r) ? '#86EFAC' : '#E2E8F0', backgroundColor: x.id === pac ? '#FFF7ED' : '#FFFFFF', padding: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 30 }}>{emojiDe(x.r)}</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{nomeDe(x.r)}{gratis(x.id) ? '' : ' 👑'}</Text>
                <Text style={{ fontSize: 10.5, color: '#64748B', textAlign: 'center', marginTop: 3, lineHeight: 13 }} numberOfLines={3}>{x.itens.slice(0, 4).map(([t]) => t).join(', ')}…</Text>
                <Text style={{ fontSize: 10.5, fontWeight: '900', color: ja(x.r) ? '#15803D' : '#D97706', marginTop: 4 }}>{ja(x.r) ? '✓ já tem' : `${x.itens.length} botões`}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <DicaEspecialistas idioma={idioma} compacta />
        <CreditoArasaac idioma={idioma} />
      </ScrollView>
      {/* painel FIXO embaixo: o que tem o pacote escolhido */}
      <View accessibilityLabel={p ? 'pacote escolhido' : 'escolha um pacote'} style={{ borderTopWidth: 2, borderColor: p ? '#F59E0B' : '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, maxHeight: Math.round(H * 0.46) }}>
        {p ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>{p.r} · {p.itens.length} botões</Text>
              <Pressable onPress={() => setPac(undefined)} accessibilityRole="button" accessibilityLabel="Escolher outro" style={{ padding: 6 }}><Feather name="x" size={20} color="#64748B" /></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 92, marginTop: 4 }} nestedScrollEnabled>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {p.itens.map(([t, e]) => <View key={t} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 3 }}><Text>{e}</Text><Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: '#334155' }}>{t}</Text></View>)}
              </View>
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}><SeletorTema valor={cor} onChange={setCor} /></ScrollView>
            <Pressable onPress={() => (desenhosOk ? setComDesenhos((v) => !v) : pedirPlano('foto'))} accessibilityRole="checkbox" accessibilityState={{ checked: comDesenhos && desenhosOk }} accessibilityLabel="usar desenhos do ARASAAC" style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Feather name={comDesenhos && desenhosOk ? 'check-square' : 'square'} size={18} color="#2563EB" />
              <Text style={{ marginLeft: 6, fontSize: 12.5, color: '#1E3A8A', fontWeight: '800', flex: 1 }}>Usar desenhos do ARASAAC (com internet). Sem internet, usa emojis.{desenhosOk ? '' : ' 👑'}</Text>
            </Pressable>
            <View style={{ height: 8 }} />
            <BotaoCor titulo={baixando || 'Transferir Pacote'} icone="download" cor="#F59E0B" desativado={!!baixando} onPress={transferir} />
          </>
        ) : <Text style={{ fontSize: 13.5, color: '#64748B', textAlign: 'center' }}>👆 Escolha um pacote para ver o que ele tem.</Text>}
      </View>
    </Fundo>
  );
}


// ------------------------------------------------------------ MINHA ASSINATURA
export function Assinatura({ voltar, casa }: Nav) {
  const { s, mudar, toast } = useVoz();
  const pm = usePremiumDemo();
  const { limites: limitesPlano } = useRotina();
  const pago = pm.pago;
  // planos ATIVOS (no app real: appConfig/planSelection do Firebase + produtos do Google Play)
  const planos: PlanoVenda[] = [
    { id: 'voz_amiga_monthly', titulo: 'Plano Mensal', subtitulo: 'Pagamento mês a mês.' },
    { id: 'voz_amiga_lifetime', titulo: 'Plano Vitalício', subtitulo: 'Pagamento único, acesso vitalício.' },
  ];
  const itens: [string, string, string][] = [['image', 'Fotos e áudios', 'cards personalizados'], ['folder', 'Categorias e pacotes', 'mais organização'], ['lock', 'Travar app', 'menos distrações'], ['shield', 'Sem anúncios', 'uso tranquilo']];
  return (
    <Fundo>
      <Cab icone="credit-card" cor="#16A34A" fundo="#DCFCE7" titulo="Minha Assinatura" onVoltar={voltar} onFechar={voltar} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#86EFAC', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>👑</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{pago ? 'Plano Completo' : 'Versão gratuita'}</Text>
              <Text style={{ fontSize: 12, color: '#475569' }}>{pago ? 'Sem anúncios, tudo liberado' : pm.teste.fase === 'ativo' ? 'Teste premium: tudo liberado' : 'Grátis · 15 pranchas · só emojis · 1 turno com 5 tarefas'}</Text>
            </View>
            <View style={{ backgroundColor: pago ? '#22C55E' : '#94A3B8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{pago ? 'ATIVO' : 'GRÁTIS'}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 }}>
            {itens.map(([i, t, d]) => (
              <View key={t} style={{ width: '48.5%', borderRadius: 14, borderWidth: 1, borderColor: '#E9D5FF', padding: 10, marginBottom: 8, alignItems: 'center' }}>
                <Feather name={i as never} size={18} color="#7C3AED" />
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#0F172A', marginTop: 6 }}>{t}</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>{d}</Text>
              </View>
            ))}
          </View>
          <BlocoPlanos idioma={s.defs.idioma} planos={planos} pago={pago} teste={pm.teste} podeTestar={pm.podeTestar} dias={pm.dias} iniciarTeste={pm.iniciar}
            comprar={(id) => toast(`No app oficial abre o pagamento do Google Play (${id}).`)} />
          {!pm.premium ? <EscolherFixas limite={limitesPlano.pranchas} /> : null}
          <Text style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>No app oficial, a assinatura continua sendo feita pelo Google Play, exatamente como hoje.</Text>
          <Pressable onPress={() => mudar((x) => ({ ...x, defs: { ...x.defs, assinanteTeste: !pago } }))} accessibilityRole="switch" accessibilityLabel="Simular Plano Completo" accessibilityState={{ checked: pago }}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: '#FDE68A', backgroundColor: '#FFFBEB', padding: 12 }}>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: '#92400E' }}>🧪 Só no teste: simular {pago ? 'versão gratuita' : 'Plano Completo'}</Text>
            <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: pago ? '#22C55E' : '#CBD5E1', justifyContent: 'center', paddingHorizontal: 3 }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: pago ? 'flex-end' : 'flex-start' }} /></View>
          </Pressable>
          <View style={{ height: 12 }} />
          <BotaoCor titulo="Gerenciar no Google Play" icone="external-link" cor="#2563EB" onPress={() => abrirLink('https://play.google.com/store/account/subscriptions')} />
        </View>
      </ScrollView>
    </Fundo>
  );
}

// ------------------------------------------------------------ SOBRE A CAA + CURSO
const DICAS = ['Seja o modelo: use o app no dia a dia para mostrar como funciona.', 'Dê tempo de espera para a pessoa processar e responder.', 'Evite transformar tudo em teste; comunicação precisa ser natural.', 'Mantenha o dispositivo acessível e disponível.'];
const CONCEITOS = ['Vocabulário essencial ajuda em várias situações do cotidiano.', 'Gestos, olhares e sons também são comunicação.', 'Presuma competência e ofereça ferramentas adequadas.'];
export function Sobre({ voltar, casa, ir }: Nav) {
  const Bloco = ({ t, c, b, children }: { t: string; c: string; b: string; children: React.ReactNode }) => (
    <View style={{ backgroundColor: b, borderRadius: 16, padding: 12, marginBottom: 10 }}><Text style={{ fontSize: 14, fontWeight: '900', color: c }}>{t}</Text><View style={{ marginTop: 4 }}>{children}</View></View>
  );
  return (
    <Fundo>
      <Cab icone="info" cor="#0891B2" fundo="#CFFAFE" titulo="O que é a CAA?" onVoltar={voltar} onFechar={voltar} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, color: '#334155', marginBottom: 10 }}>A Comunicação Aumentativa e Alternativa (CAA) reúne ferramentas, estratégias e tecnologias que apoiam ou substituem a fala, promovendo inclusão, autonomia e participação.</Text>
        <Bloco t="Mito quebrado" c="#B45309" b="#FEF3C7"><Text style={{ color: '#334155' }}>A CAA não inibe a fala. Pelo contrário, pode reduzir frustração, aumentar vocabulário e apoiar o desenvolvimento da comunicação.</Text></Bloco>
        <Bloco t="Importante" c="#BE123C" b="#FFE4E6"><Text style={{ color: '#334155' }}>O Voz Amiga é uma ferramenta de apoio e não substitui avaliação, diagnóstico ou acompanhamento médico, fonoaudiológico ou terapêutico.</Text></Bloco>
        <Bloco t="Dicas para famílias" c="#15803D" b="#DCFCE7">{DICAS.map((d) => <Text key={d} style={{ color: '#334155', marginTop: 2 }}>• {d}</Text>)}</Bloco>
        <Bloco t="Conceitos importantes" c="#1D4ED8" b="#DBEAFE">{CONCEITOS.map((d) => <Text key={d} style={{ color: '#334155', marginTop: 2 }}>• {d}</Text>)}</Bloco>
        <BotaoCor titulo="Curso informativo sobre CAA" icone="play-circle" cor="#0891B2" onPress={() => ir({ n: 'curso' })} />
        <Bloco t="Créditos" c="#475569" b="#F1F5F9"><CreditoArasaac idioma={useRotina().idioma} /></Bloco>
      </ScrollView>
    </Fundo>
  );
}

const CURSO: [string, string, string, string][] = [
  ['👋', 'Bem-vindo(a)!', 'Antes de usar o aplicativo, reserve 2 minutos para conhecer a melhor forma de ajudar seu filho(a). Essas orientações podem fazer toda a diferença no desenvolvimento da comunicação.', '#DBEAFE'],
  ['💙', 'Como o aplicativo ajuda?', 'Com imagens, palavras e voz, a pessoa pode expressar o que sente, o que deseja e o que precisa. Menos frustração. Mais compreensão. Mais momentos em família.', '#DBEAFE'],
  ['❓', 'Uma dúvida muito comum', 'A CAA atrapalha a fala? Não. A CAA não substitui a fala. Ela incentiva a comunicação e ajuda a pessoa a se expressar enquanto desenvolve suas habilidades.', '#FEF3C7'],
  ['🌱', 'O segredo é a paciência', 'Comece com poucos botões. Ensine uma imagem por vez. Use o aplicativo todos os dias. Comemore cada pequena conquista.', '#DCFCE7'],
  ['❤️', 'Você não está sozinho(a)', 'Com pequenas orientações, você poderá ajudar ainda mais no desenvolvimento da comunicação.', '#FFE4E6'],
];
export function Curso({ voltar, casa }: Nav) {
  const [i, setI] = useState(0);
  const c = CURSO[i];
  return (
    <Fundo>
      <Cab icone="play-circle" cor="#0891B2" fundo="#CFFAFE" titulo="Curso sobre CAA" onVoltar={voltar} onFechar={voltar} />
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, borderWidth: 1.5, borderColor: '#BFDBFE', padding: 22, alignItems: 'center' }}>
          <View style={{ width: 70, height: 70, borderRadius: 20, backgroundColor: c[3], alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 34 }}>{c[0]}</Text></View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 14 }}>{c[1]}</Text>
          <Text style={{ fontSize: 15, color: '#334155', textAlign: 'center', marginTop: 10, lineHeight: 22 }}>{c[2]}</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 12, color: '#64748B', fontWeight: '800' }}>{i + 1} / {CURSO.length}</Text>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <BotaoCor titulo="Anterior" cor="#E2E8F0" texto="#334155" flex desativado={i === 0} onPress={() => setI(i - 1)} />
          <View style={{ width: 8 }} />
          <BotaoCor titulo={i === CURSO.length - 1 ? 'Concluir' : 'Próximo'} cor="#2563EB" flex onPress={() => (i === CURSO.length - 1 ? voltar() : setI(i + 1))} />
        </View>
      </View>
    </Fundo>
  );
}

// ------------------------------------------------------------ DEFINIÇÕES
export function Definicoes({ voltar, casa }: Nav) {
  const { s, mudar, toast } = useVoz();
  const d = s.defs;
  const { msAdulto, mudarMsAdulto, recurso, abrir } = useRotina();
  const set = (x: Partial<typeof d>) => mudar((v) => ({ ...v, defs: { ...v.defs, ...x } }));
  const [vozes, setVozes] = useState<string[]>([]);
  React.useEffect(() => {
    const carregar = () => setVozes(listarVozes(d.idioma));
    carregar();
    const h = setTimeout(carregar, 800); // as vozes do Android chegam depois de iniciar o leitor
    return () => clearTimeout(h);
  }, [d.idioma]);
  const colunas = d.colunasAuto ? 4 : d.colunas;
  return (
    <Fundo>
      <Cab icone="settings" titulo="Definições" onVoltar={voltar} onFechar={voltar} />
      <RolagemTour contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <AlvoTour id="df_idioma"><CartaoDef icone="globe" cor="#2563EB" fundo="#DBEAFE" titulo="Idioma da Aplicação" desc="Troque o idioma do app instantaneamente.">
          <Lista rotulo="Idioma" valor={d.idioma} onChange={(v) => set({ idioma: v, voz: '' })} opcoes={[{ v: 'pt', r: '🇧🇷/🇵🇹 Português' }, { v: 'en', r: '🇺🇸 English' }, { v: 'es', r: '🇪🇸 Español' }]} />
        </CartaoDef></AlvoTour>
        <AlvoTour id="df_tamanho"><CartaoDef icone="layout" cor="#2563EB" fundo="#DBEAFE" titulo="Tamanho dos Botões" desc="Escolha quantos botões aparecem em cada linha.">
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, padding: 8 }}>
            <Pressable onPress={() => set({ colunasAuto: !d.colunasAuto })} accessibilityLabel="Automático" accessibilityRole="checkbox" accessibilityState={{ checked: d.colunasAuto }} style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', backgroundColor: d.colunasAuto ? '#334155' : '#fff' }}>
              {d.colunasAuto ? <Feather name="check" size={16} color="#fff" /> : null}
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: 12, opacity: d.colunasAuto ? 0.4 : 1 }}>
              <Deslizar rotulo="Colunas" valor={colunas} min={2} max={6} onChange={(v) => set({ colunas: v, colunasAuto: false })} />
            </View>
            <View style={{ width: 36, height: 30, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: '#1D4ED8', fontSize: 16 }}>{colunas}</Text></View>
          </View>
          <Text style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>{d.colunasAuto ? `Automático ativo: ${colunas} colunas.` : `Manual: ${colunas} colunas.`}</Text>
        </CartaoDef></AlvoTour>
        <AlvoTour id="df_sugestoes"><CartaoDef icone="zap" cor="#CA8A04" fundo="#FEF3C7" titulo="Sugestões Inteligentes" desc="Sugere a próxima palavra e frases completas, aprendendo com o que a criança fala. Funciona sem internet.">
          <Estado rotulo="Sugestões" on={d.sugestoes} onChange={(v) => set({ sugestoes: v })} />
        </CartaoDef></AlvoTour>
        <AlvoTour id="df_teclado"><CartaoDef icone="type" cor="#334155" fundo="#E2E8F0" titulo="Teclado Avançado" desc="O teclado colorido do app ganha números, acentos, Ç, pontuação e letras minúsculas. Desligado: modo normal, só letras grandes.">
          <Estado rotulo="Teclado avançado" on={d.tecladoAvancado} onChange={(v) => set({ tecladoAvancado: v })} sim="ATIVADO" nao="DESATIVADO" />
        </CartaoDef></AlvoTour>
        <AlvoTour id="df_bloquear"><CartaoDef icone="shield" cor="#7C3AED" fundo="#EDE9FE" titulo="Bloquear App" desc="Pede o código protegido ao tentar sair ou ao voltar depois de minimizar.">
          <Estado rotulo="Bloquear app" on={d.bloquearApp} onChange={(v) => set({ bloquearApp: v })} sim="ATIVADO" nao="DESATIVADO" />
        </CartaoDef></AlvoTour>
        <AlvoTour id="df_segurar"><CartaoDef icone="clock" cor="#7C3AED" fundo="#EDE9FE" titulo="Tempo para Segurar" desc="Quantos segundos o adulto segura TRAVAR APP, AJUSTES, ADICIONAR PRANCHA e a rotina antes da continha.">
          <View style={{ flexDirection: 'row' }}>
            {[3, 5, 7, 10].map((n) => (
              <Pressable key={n} onPress={() => mudarMsAdulto(n)} accessibilityRole="button" accessibilityLabel={`Segurar ${n} segundos`} accessibilityState={{ selected: msAdulto === n * 1000 }}
                style={{ flex: 1, height: 44, marginRight: n === 10 ? 0 : 8, borderRadius: 14, borderWidth: 2, borderColor: msAdulto === n * 1000 ? '#7C3AED' : '#E2E8F0', backgroundColor: msAdulto === n * 1000 ? '#7C3AED' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 15, color: msAdulto === n * 1000 ? '#FFFFFF' : '#334155' }}>{n} s</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>Padrão: 3 segundos. Aumente se a criança conseguir abrir sozinha.</Text>
        </CartaoDef></AlvoTour>
        {/* v14.2: a voz tem UM lugar só — esta tela de vozes (sem repetir em Mais funções) */}
        <AlvoTour id="df_voz"><CartaoDef icone="volume-2" cor="#0891B2" fundo="#CFFAFE" titulo="Voz e volume" desc={`Agora: ${d.voz ? d.voz : 'voz padrão do celular'} · volume ${d.volume}%. Toque para ouvir as vozes, escolher, mudar o volume e testar.`}>
          <BotaoCor titulo="🔊 Escolher e testar a voz" icone="sliders" cor="#2563EB" alto={48} onPress={() => abrir({ nome: 'v14', tela: 'vozes' })} />
        </CartaoDef></AlvoTour>
        {/* v14.3: volume e "testar voz" ficam na tela de vozes (sem repetir); IA nas Definições; as funções do app vieram para cá */}
        <AlvoTour id="df_ia"><CartaoDef icone="cpu" cor="#7C3AED" fundo="#EDE9FE" titulo="IA (opcional)" desc="Baixar a IA para o celular (grátis) ou usar o seu ChatGPT. A IA só sugere; você aprova.">
          <BotaoCor titulo="✨ Abrir IA" icone="cpu" cor="#7C3AED" alto={48} onPress={() => abrir({ nome: 'v14', tela: 'ia' })} />
        </CartaoDef></AlvoTour>
        <View style={{ height: 6 }} />
        <FuncoesDoApp />
      </RolagemTour>
    </Fundo>
  );
}

export const useRotinaPronta = () => useRotina().pronto;
