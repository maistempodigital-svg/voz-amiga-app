// Coloque <RotinaTelas /> UMA vez, como último filho da tela raiz do Voz Amiga.
// Ele mostra as telas do Rotina em tela cheia (por cima do Voz), a festinha de estrelas,
// o aviso de alarme e a conta de matemática dos pais. Não precisa mexer na navegação do Voz.
import React, { useContext } from 'react';
import { BackHandler, Modal, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Aviso, Celebracao } from './componentes/Celebracao';
import { PortaoPais } from './componentes/PortaoPais';
import { C } from './componentes/ui';
import { useRotina } from './estado';
import { AjustesRotina } from './telas/AjustesRotina';
import { Conquistas, LojaEstrelas, Metas } from './telas/Crianca';
import { EditarTarefa } from './telas/EditarTarefa';
import { EditarRecompensa, GerenciarAbas, GerenciarLoja, GerenciarMetas } from './telas/Gerenciar';
import { RelatorioGeral } from './telas/RelatorioGeral';
import { Ajuda, Crise, Diagnostico, Notificacoes, NovaRotina } from './telas/Extras';
import { FrasesProntasTela } from './telas/FrasesProntas';
import { AvisoPlano } from './componentes/Extras';
import { TelaRotina } from './tipos';
import { MaisFuncoes, TelaDoV14 } from './v14/telas';

export function TelaDoRotina({ tela }: { tela: TelaRotina }) {
  switch (tela.nome) {
    case 'ajustes': return <AjustesRotina abaInicial={tela.aba} />;
    case 'editarTarefa': return <EditarTarefa tarefaId={tela.tarefaId} abaId={tela.abaId} />;
    case 'gerenciarAbas': return <GerenciarAbas />;
    case 'gerenciarLoja': return <GerenciarLoja />;
    case 'editarRecompensa': return <EditarRecompensa recompensaId={tela.recompensaId} />;
    case 'gerenciarMetas': return <GerenciarMetas />;
    case 'loja': return <LojaEstrelas />;
    case 'metas': return <Metas />;
    case 'conquistas': return <Conquistas />;
    case 'relatorio': return <RelatorioGeral />;
    case 'novaRotina': return <NovaRotina />;
    case 'notificacoes': return <Notificacoes />;
    case 'crise': return <Crise abaInicial={tela.aba} />;
    case 'ajuda': return <Ajuda topico={tela.topico} />;
    case 'diagnostico': return <Diagnostico />;
    case 'frasesProntas': return <FrasesProntasTela />;
    case 'maisFuncoes': return <MaisFuncoes />;
    case 'v14': return <TelaDoV14 tela={tela.tela} grupo={tela.grupo} />;
  }
}

const COR_TOPO: Partial<Record<TelaRotina['nome'], string>> = { loja: '#3F3CB8', metas: '#0369A1', conquistas: '#5B21B6' };

export function RotinaTelas() {
  const { pilha, voltar } = useRotina();
  const insets = useContext(SafeAreaInsetsContext);
  const topo = pilha[pilha.length - 1];
  React.useEffect(() => {
    if (!topo) return;
    const s = BackHandler.addEventListener('hardwareBackPress', () => { voltar(); return true; });
    return () => s.remove();
  }, [topo, voltar]);
  return (
    <>
      <Celebracao />
      <Aviso />
      <Modal visible={!!topo} animationType="slide" onRequestClose={voltar} statusBarTranslucent={false}>
        <View style={{ flex: 1, backgroundColor: (topo && COR_TOPO[topo.nome]) || C.white, paddingTop: insets?.top || 0, paddingBottom: insets?.bottom || 0 }}>
          {/* todas as telas da pilha ficam montadas (voltar mantém a aba/rolagem); só a de cima aparece */}
          {pilha.map((tela, i) => (
            <View key={`${i}-${tela.nome}-${'aba' in tela ? tela.aba || '' : ''}${'tela' in tela ? tela.tela : ''}${'grupo' in tela ? tela.grupo || '' : ''}`} style={{ flex: 1, display: i === pilha.length - 1 ? 'flex' : 'none' }}>
              <TelaDoRotina tela={tela} />
            </View>
          ))}
          <Celebracao />
        </View>
        <PortaoPais />
        <AvisoPlano />
      </Modal>
      {!topo ? <><PortaoPais /><AvisoPlano /></> : null}
    </>
  );
}
