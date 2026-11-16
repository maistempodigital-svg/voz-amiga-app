// ================================================================
//  ROTINA AMIGA dentro do VOZ AMIGA — ponto de entrada do módulo
//  Veja INTEGRACAO.md para os 5 passos de encaixe no projeto original.
// ================================================================
export { RotinaAmigaProvider, useRotina, CHAVE_ARMAZENAMENTO } from './estado';
export type { Armazenamento, ContextoRotina, PropsProvider } from './estado';
export { RotinaTelas, TelaDoRotina } from './RotinaTelas';
export { ProximoPasso } from './home/ProximoPasso';
export { Segurar } from './componentes/Segurar';
export { TecladoAmigo } from './componentes/TecladoAmigo';
export type { PropsTeclado } from './componentes/TecladoAmigo';
export { BarraSugestoes } from './componentes/Sugestoes';
export { sugerir, completarPalavra } from './logica/sugestoes';
export type { Sugestoes, EntradaSugestao } from './logica/sugestoes';
export { AlvoTour, PASSOS_TOUR, RolagemTour, useTour } from './tour';
export type { PassoTour, TelaTour, TelaHost, TelaModulo } from './tour';
export type { PropsProximoPasso } from './home/ProximoPasso';
export { BotaoMenuVoz, QuadroAjustesVoz, useItensAjustesRotina, useItensMenuRotina } from './home/Menus';
export type { ItemMenu } from './home/Menus';
export * from './tipos';

// ---- Plano (gratuito x completo) — ligação com o Google Play / Firebase que o Voz já tem
export { LIMITES_GRATIS, LIMITES_COMPLETO, lerLimitesFirebase, limitesEfetivos } from './logica/plano';
export type { LimitesRotina, Recurso } from './logica/plano';
// ---- Anúncio protegido (segurar 5 s), "Como estou?", selo do plano
export { AnuncioProtegido, BotaoComoEstou, PainelComoEstou, SeloPlano } from './componentes/Extras';
export type { DadosAnuncio } from './componentes/Extras';
// ---- Relatório para profissionais
export { gerarRelatorio, relatorioTexto, relatorioHtml, AREAS } from './logica/profissional';
export type { AreaRel, Relatorio } from './logica/profissional';
// ---- Ajuda (dá para acrescentar tópicos depois)
export { adicionarTopicoAjuda } from './telas/Extras';
export type { TopicoAjuda } from './telas/Extras';

// v9: barra da frase sempre visível + UMA fileira de sugestões (frases prontas + o que o app aprendeu), cores da comunicação
export { BarraSugestoesFrase, PalavrasColoridas, useFrasesProntas } from './componentes/FrasesProntas';
export { imagemSegura, linkSeguro } from './logica/plano';
export { LIMITE_NOME, LIMITE_NOTA } from './logica/acoes';
export { CORES_FITZGERALD, NOMES_CATEGORIA, FRASES_PADRAO, GRUPOS as GRUPOS_FRASES, categoriaDaPalavra, corDaPalavra, categoriasDaFrase, coresDaFrase, formularFrase, frasesEmUso } from './logica/frasesProntas';
export type { Categoria, FrasePronta, GrupoFrase } from './logica/frasesProntas';

// ---- v14: funções novas (todas ligam/desligam em Ajustes › Mais funções; nada usa internet)
export { RECURSOS, GRUPOS_RECURSO, lerRecursosFirebase, recursoAtivo, disponibilidade } from './v14/recursos';
export type { IdRecurso, RegrasRemotas, Disponibilidade } from './v14/recursos';
export type { ConfigV14 } from './v14/config';
export type { HostV14 } from './v14/estadoV14';
export { criarBackup, lerBackup, nomeArquivoBackup } from './v14/backup';
export { somarPalavra, maxPalavras, pranchasVisiveis, sugerirAumentarGrade, VISUAIS, NIVEIS } from './v14/crescer';
export { PACOTES_ROTINA, itensPacote, pacoteDaTarefa } from './v14/pacotes';
export { completarFraseIA, sugerirBotaoIA, pranchaPorTemaIA } from './v14/ia';
export { MascoteDesenho, MascoteVoando } from './v14/Mascote';
export { MaisFuncoes, FuncoesDoApp } from './v14/telas';
export { DestaqueCriacaoRapida, DicaEspecialistas, CreditoArasaac, TelaCriacaoRapida } from './v14/telasIA';
export { CREDITO_ARASAAC, O_QUE_E_ARASAAC, DICA_ESPECIALISTAS, FONTE_ESPECIALISTAS, INICIO_BOTOES } from './v14/especialistas';
export type { HostIA, HostSegredo, IdModeloIA } from './v14/iaEstado';
