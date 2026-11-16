// Botões para o MENU DE CIMA do Voz (PRÊMIOS e METAS — Metas e Conquistas ficam juntas na mesma tela)
// e para a tela AJUSTES E OPÇÕES do Voz (Rotina Amiga, Relatório completo).
// Se o Voz já tem o componente de botão dele, use só os "itens" (useItensMenuRotina / useItensAjustesRotina)
// e desenhe com o componente do Voz — assim o visual fica 100% igual.
import React from 'react';
import { Text, View } from 'react-native';
import { useRotina } from '../estado';
import { metasParaResgatar } from '../logica/estrelas';
import { C, CaixaIcone, Icone, IconeDef, Toque, px } from '../componentes/ui';
import { Segurar } from '../componentes/Segurar';
import { useTour } from '../tour';
import { tx } from '../textos2';

export interface ItemMenu {
  id: 'metas' | 'premios' | 'conquistas' | 'ajustesRotina' | 'relatorio' | 'momento' | 'ajuda' | 'tour' | 'frasesProntas' | 'maisFuncoes' | 'cursoPais' | 'conquistasPremios';
  rotulo: string;
  icone: IconeDef;
  cor: string; // borda e ícone
  fundo: string; // fundo claro
  fundoIcone: string;
  /** Número para mostrar num selo (estrelas, metas prontas). */
  selo?: string;
  /** Tempo segurando para ativar (igual AJUSTES / TRAVAR APP do Voz). 0 = toque simples. */
  segurarMs: number;
  aoTocar: () => void;
}

export const useItensMenuRotina = (): ItemMenu[] => {
  const { t, abrir, estado, agora, ganhoRecente } = useRotina();
  const prontas = metasParaResgatar(estado, new Date(agora));
  // selo discreto: "+2" logo depois de ganhar; senão as estrelas (e as metas prontas, se houver)
  const selo = ganhoRecente > 0 ? `+${ganhoRecente}★` : prontas ? `★${estado.estrelas}·🎯${prontas}` : `★${estado.estrelas}`;
  return [
    { id: 'premios', rotulo: t('prizes').toUpperCase(), icone: { f: 'feather', n: 'gift' }, cor: '#D97706', fundo: '#FFFBEB', fundoIcone: '#FEF3C7', selo, segurarMs: 0, aoTocar: () => abrir({ nome: 'loja' }) }, // abre com 1 toque (a criança vê os prêmios)
  ];
};

export const useItensAjustesRotina = (): ItemMenu[] => {
  const { t, abrir, idioma, recurso } = useRotina();
  void useTour;
  const R = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt);
  return [
    // v14.2: CONQUISTAS E PRÊMIOS num botão destacado (prêmios, metas, conquistas do mês e da família)
    { id: 'conquistasPremios', rotulo: R('CONQUISTAS E PRÊMIOS', 'ACHIEVEMENTS & PRIZES', 'LOGROS Y PREMIOS'), icone: { f: 'feather', n: 'award' }, cor: '#B45309', fundo: '#FEF3C7', fundoIcone: '#FDE68A', segurarMs: 0, aoTocar: () => abrir({ nome: 'v14', tela: 'conquistas' }) },
    { id: 'ajustesRotina', rotulo: t('rotinaAmiga').toUpperCase(), icone: { f: 'mci', n: 'calendar-check-outline' }, cor: '#10B981', fundo: '#ECFDF5', fundoIcone: '#D1FAE5', segurarMs: 0, aoTocar: () => abrir({ nome: 'ajustes' }) },
    { id: 'relatorio', rotulo: R('RELATÓRIO GERAL', 'FULL REPORT', 'REPORTE GENERAL'), icone: { f: 'feather', n: 'bar-chart-2' }, cor: '#6366F1', fundo: '#EEF2FF', fundoIcone: '#E0E7FF', segurarMs: 0, aoTocar: () => abrir({ nome: 'relatorio' }) },
    // Ajuda e Tour juntos num quadro só (o tour começa pelo botão no topo da Ajuda). "Registrar momento" fica dentro do Relatório.
    { id: 'ajuda', rotulo: R('AJUDA E TOUR', 'HELP & TOUR', 'AYUDA Y TOUR'), icone: { f: 'feather', n: 'help-circle' }, cor: '#0284C7', fundo: '#F0F9FF', fundoIcone: '#E0F2FE', segurarMs: 0, aoTocar: () => abrir({ nome: 'ajuda' }) },
    // v14: curso dos pais (com o mascote) e o painel "Mais funções" (liga/desliga cada novidade)
    ...(recurso('curso') ? [{ id: 'cursoPais' as const, rotulo: R('CURSO PARA PAIS', 'PARENTS COURSE', 'CURSO PARA PADRES'), icone: { f: 'mci' as const, n: 'school-outline' }, cor: '#EA580C', fundo: '#FFF7ED', fundoIcone: '#FFEDD5', segurarMs: 0, aoTocar: () => abrir({ nome: 'v14', tela: 'curso' }) }] : []),
    // v14.3: "Mais funções" foi para dentro das DEFINIÇÕES (<FuncoesDoApp />), sem quadro repetido aqui
  ];
};

/**
 * Botão no formato do menu de cima do Voz. Passe a MESMA largura/altura dos botões do Voz
 * (TRAVAR APP, FRASES, AJUSTES…) para ficar tudo do mesmo tamanho; ícone e texto acompanham.
 * Ativa SEGURANDO (item.segurarMs), como AJUSTES e TRAVAR APP.
 */
export function BotaoMenuVoz({ item, largura = px(138), altura = px(116), raio, borda }: { item: ItemMenu; largura?: number; altura?: number; raio?: number; borda?: number }) {
  const conteudo = (
    <>
      <Icone f={item.icone.f} n={item.icone.n} size={Math.round(largura * 0.22)} color={item.cor} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: Math.round(altura * 0.07), fontSize: Math.round(largura * 0.135), fontWeight: '900', color: item.cor, letterSpacing: -0.2 }}>{item.rotulo}</Text>
    </>
  );
  const estilo = { width: largura, height: altura, borderRadius: raio ?? Math.round(largura * 0.17), borderWidth: borda ?? Math.max(1, largura * 0.021), borderColor: item.cor, backgroundColor: item.fundo, paddingHorizontal: 3 };
  return (
    <View style={{ width: largura, height: altura }}>
      {item.segurarMs > 0
        ? <Segurar ms={item.segurarMs} aoCompletar={item.aoTocar} rotulo={item.rotulo} style={estilo} corFaixa={item.cor + '33'}>{conteudo}</Segurar>
        : <Toque onPress={item.aoTocar} rotulo={item.rotulo} style={[estilo, { alignItems: 'center', justifyContent: 'center' }]}>{conteudo}</Toque>}
      {item.selo ? (
        // selo PEQUENINHO no canto (sem pop-up): estrelas, "+2" logo depois de ganhar, 🎯 metas prontas
        <View pointerEvents="none" accessibilityLabel={`selo ${item.selo}`} style={{ position: 'absolute', top: 3, right: 3, backgroundColor: item.id === 'premios' ? '#FEF3C7' : '#FEE2E2', borderRadius: 7, paddingHorizontal: 4, height: Math.round(altura * 0.2), minWidth: Math.round(altura * 0.2), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: Math.max(9, Math.round(largura * 0.085)), fontWeight: '900', color: item.id === 'premios' ? '#92400E' : '#B91C1C' }}>{item.selo}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Quadrado no formato da grade de "Ajustes e Opções" do Voz (como CRIAR PRANCHA / GERIR ABAS). */
export function QuadroAjustesVoz({ item, style }: { item: ItemMenu; style?: object }) {
  return (
    <Toque onPress={item.aoTocar} rotulo={item.rotulo} style={[{ height: px(182), borderRadius: px(30), borderWidth: px(3), borderColor: item.cor, backgroundColor: item.fundo, alignItems: 'center', justifyContent: 'center' }, style]}>
      <CaixaIcone icone={item.icone} cor={item.cor} fundo={item.fundoIcone} tam={px(80)} raio={px(24)} size={px(40)} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: px(18), fontSize: px(24), fontWeight: '900', color: C.ink, paddingHorizontal: px(8) }}>{item.rotulo}</Text>
    </Toque>
  );
}
