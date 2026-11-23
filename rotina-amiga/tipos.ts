import type { ConfigV14 } from './v14/config';
// Rotina Amiga dentro do Voz Amiga — tipos de dados.
// Tudo fica salvo localmente (AsyncStorage), separado dos dados do Voz Amiga.
// Nada aqui toca em Firebase, login ou pagamento.

export type Idioma = 'pt' | 'en' | 'es';

/** Aba de rotina (Manhã, Tarde, Noite, Escola, Banheiro ou criada pelos pais). */
export interface AbaRotina {
  id: string;
  nome: string;
  /** Nome de ícone do MaterialCommunityIcons (mesmo conjunto do Rotina Amiga). */
  icone: string;
  /** Cor principal (#RRGGBB). A paleta clara/escura é calculada a partir dela. */
  cor: string;
  /** Nome da paleta original ("blue", "orange"...) — só para exibição. */
  paletaId?: string;
}

export interface Tarefa {
  id: string;
  abaId: string;
  titulo: string;
  /** Chave do pictograma (ex.: "mochila") ou um emoji direto. */
  icone: string;
  /** Foto tirada/escolhida pelos pais (substitui o pictograma). */
  imagemUri?: string;
  /** "HH:MM" ou vazio quando não tem horário fixo. */
  horario?: string;
  /** Só pode começar quando chegar o horário. */
  travarAteHorario: boolean;
  /** Avisar na hora (com o app aberto; fora do app requer expo-notifications — ver INTEGRACAO.md). */
  alarme: boolean;
  /** Temporizador em minutos. 0 = sem temporizador. */
  duracaoMin: number;
  /** 0 = domingo … 6 = sábado */
  dias: number[];
  /** Estrelas ao concluir (padrão 1). */
  estrelas?: number;
  /** Aba de pranchas do Voz Amiga que abre quando a tarefa começa (ex.: lanche => aba Comida). */
  abaVozId?: string;
}

export interface Recompensa {
  id: string;
  titulo: string;
  custo: number;
  icone: string; // emoji
  /** Minutos de espera antes de receber (ex.: "Ver desenho" = 5). */
  esperaMin: number;
  /** v2.0.7: quando a criança trocou este prêmio. No plano grátis o prêmio trocado sai da loja (1 por vez). */
  trocadoEm?: number;
}

export type TipoMeta = 'frases' | 'tarefas' | 'rotinas' | 'palavras_novas' | 'pranchas';

export interface Meta {
  id: string;
  titulo: string;
  tipo: TipoMeta;
  alvo: number;
  periodo: 'dia' | 'semana';
  premio: number; // estrelas
  ativa: boolean;
  icone: string; // emoji
}

export type TipoEvento =
  | 'prancha' // toque em uma prancha do Voz
  | 'frase' // botão FALAR do Voz
  | 'tarefa_inicio'
  | 'tarefa_fim'
  | 'tarefa_liberada' // adulto liberou/pulou a tarefa
  | 'rotina_completa'
  | 'estrelas' // estrelas ganhas (+) ou ajustadas pelos pais
  | 'resgate' // prêmio da loja (esperouMin = minutos que a criança esperou)
  | 'espera_inicio' // tocou no prêmio e começou a esperar
  | 'espera_desistiu' // desistiu de esperar
  | 'meta' // meta concluída
  | 'tarefa_cancelada' // adulto cancelou a tarefa em andamento
  | 'frase_incompleta' // montou palavras no modo frase e saiu sem falar
  | 'teclado' // uso do teclado do app (letras, apagadas)
  | 'crise' // momento de crise registrado pelos pais
  | 'sentimento' // "Como estou?" escolhido pela criança
  | 'sinal' // sinal automático (ex.: tentou sair do app travado)
  // v14
  | 'modelo' // pais tocaram uma prancha no MODO EXEMPLO (não conta como pedido da criança)
  | 'missao' // missão do dia feita pelos pais
  | 'marco' // marco alcançado (rotulo = id do marco)
  | 'nivel' // nível de frase mudou (valor = '1' | '2' | '3')
  | 'emergencia'; // botão de emergência (valor = 'dor' | 'ajuda' | 'banheiro')

export interface Evento {
  t: number;
  tipo: TipoEvento;
  abaId?: string;
  tarefaId?: string;
  rotulo?: string;
  palavras?: string[];
  estrelas?: number;
  origem?: 'rotina' | 'voz' | 'meta' | 'pais';
  /** Segundos gastos (tarefa_fim). */
  segundos?: number;
  /** Quantas palavras novas a frase trouxe. */
  novas?: number;
  /** Tempo montando a frase (ms). */
  ms?: number;
  /** Quantas palavras vieram das sugestões. */
  sug?: number;
  /** Teclado: letras digitadas / apagadas. */
  letras?: number;
  apagadas?: number;
  /** Quem concluiu a tarefa: a criança sozinha ou o adulto. */
  quem?: 'crianca' | 'adulto';
  /** Aba do Voz onde a prancha foi tocada. */
  aba?: string;
  /** Crise: intensidade 1–5, duração, gatilhos, o que ajudou, anotação. */
  intensidade?: number;
  duracaoMin?: number;
  gatilhos?: string[];
  ajudou?: string[];
  nota?: string;
  /** Sentimento escolhido / tipo de sinal. */
  valor?: string;
  /** Minutos que a criança esperou pelo prêmio. */
  esperouMin?: number;
}

export interface TarefaAtiva {
  abaId: string;
  tarefaId: string;
  inicio: number;
  duracaoSeg: number; // 0 = sem temporizador
}

export interface EsperaAtiva {
  recompensaId: string;
  inicio: number;
  fim: number;
}

export interface ConfigRotina {
  /** 'none' = todas as rotinas; ou o id de uma aba. */
  modoFoco: string;
  /** Exigir a hora da tarefa (liga/desliga o "travar até o horário" de todas). */
  travarHorario: boolean;
  /** Pedir conta de matemática antes de ações de adulto (liberar tarefa, editar). */
  senhaPais: boolean;
  sonsSuaves: boolean;
  /** Mostrar a próxima etapa na tela inicial do Voz (área dos anúncios). */
  mostrarNaHome: boolean;
  /** Falar o nome da tarefa ao começar. */
  falarTarefa: boolean;
  /** Estrelas por comunicação (frases no botão FALAR). */
  premiarFala: boolean;
  limiteFalaDia: number;
  intervaloFalaSeg: number;
  /** Bônus ao completar uma rotina inteira. */
  bonusRotina: number;
  /** Tarefa sem temporizador: segundos mínimos antes de poder marcar como feita. */
  minimoSemTimerSeg: number;
  /** O tour do aplicativo já foi visto (não abre sozinho de novo). */
  tourVisto?: boolean;
  /** Segundos para segurar nas áreas de adulto (padrão 3; os pais podem aumentar). */
  segurarAdultoSeg?: number;
  /** Personagem da espera do prêmio. */
  personagem?: 'menino' | 'menina';
  /** Mostrar o botão "Como estou?" para a criança. */
  comoEstou?: boolean;
  /** Nome da criança (só aparece no relatório). */
  nomeCrianca?: string;
  /** Como o prêmio é liberado: na hora · espera N minutos depois de tocar · intervalo de N minutos entre um prêmio e outro. */
  premioModo?: 'imediato' | 'espera' | 'intervalo';
  /** Minutos usados por premioModo (1 a 120). */
  premioMin?: number;
  /** Mostrar as frases prontas coloridas no modo frase (padrão: sim). */
  frasesProntas?: boolean;
  /** Frases prontas dos pais (vazio = usar as padrão). Criar/editar é do Plano Completo. */
  frasesLista?: { id: string; grupo: 'pedir' | 'sentir' | 'social' | 'recusar' | 'perguntar'; palavras: string[] }[];
  /** Frases padrão que os pais ocultaram (ids). */
  frasesOcultas?: string[];
  /** (v8, não usado desde a v9: a barra da frase fica sempre visível.) */
  modoFraseSempre?: boolean;
}

export interface EstadoRotina {
  versao: number;
  /** v14: escolhas dos pais nas funções novas */
  v14?: ConfigV14;
  abas: AbaRotina[];
  tarefas: Tarefa[];
  recompensas: Recompensa[];
  metas: Meta[];
  config: ConfigRotina;
  estrelas: number;
  /** { '2026-10-19': { escola: ['e1','e2'] } } */
  concluidas: Record<string, Record<string, string[]>>;
  tarefaAtiva?: TarefaAtiva;
  esperaAtiva?: EsperaAtiva;
  /** Regra "intervalo": antes desta hora, a loja não libera outro prêmio. */
  proximoPremioEm?: number;
  /** chave "metaId@periodo" => true quando o prêmio já foi pago */
  metasPagas: Record<string, boolean>;
  /** palavras já usadas em frases => contagem */
  palavras: Record<string, number>;
  log: Evento[];
  /** Tempo com o app ABERTO na tela (segundos por dia: '2026-10-19' => 1840). Não conta tempo em segundo plano. */
  uso?: Record<string, number>;
  /** Anotações dos pais para o relatório. */
  notas?: { t: number; texto: string }[];
}

export type TelaRotina =
  | { nome: 'ajustes'; aba?: 'tarefas' | 'relatorios' | 'opcoes' }
  | { nome: 'editarTarefa'; tarefaId?: string; abaId?: string }
  | { nome: 'gerenciarAbas' }
  | { nome: 'gerenciarLoja' }
  | { nome: 'editarRecompensa'; recompensaId?: string }
  | { nome: 'gerenciarMetas' }
  | { nome: 'loja' }
  | { nome: 'metas' }
  | { nome: 'conquistas' }
  | { nome: 'relatorio' }
  | { nome: 'novaRotina' }
  | { nome: 'notificacoes' }
  | { nome: 'crise'; aba?: 'novo' | 'lista' }
  | { nome: 'ajuda'; topico?: string }
  | { nome: 'diagnostico' }
  | { nome: 'frasesProntas' }
  // v14
  | { nome: 'maisFuncoes' }
  | { nome: 'v14'; tela: TelaV14; grupo?: string };
export type TelaV14 = 'grupo' | 'rapida' | 'assistente' | 'conquistas' | 'backup' | 'vozes' | 'pais' | 'curso' | 'duvidas' | 'ia' | 'conforto' | 'crescer' | 'senha' | 'emergencia' | 'missao';
