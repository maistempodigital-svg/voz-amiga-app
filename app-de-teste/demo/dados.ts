// Dados de exemplo para testar todas as telas (só no app de teste).
import { estadoPadrao, modelosRotina } from '../src/rotina-amiga/padroes';
import { chaveDia, somarDias } from '../src/rotina-amiga/logica/tempo';
import { EstadoRotina, Evento } from '../src/rotina-amiga/tipos';

export function estadoDemo(cenario: string): EstadoRotina {
  if (cenario === 'apk') {
    // APK de teste: começa do ZERO, com UMA tarefa só (sem horário e sem tempo) para testar.
    const z = estadoPadrao('pt');
    return { ...z, abas: [modelosRotina('pt')[0]], config: { ...z.config, tourVisto: false }, tarefas: [{ id: 'teste1', abaId: 'manha', titulo: 'Tarefa de teste', icone: 'brincar', travarAteHorario: false, alarme: false, duracaoMin: 0, dias: [0, 1, 2, 3, 4, 5, 6], estrelas: 1 }] };
  }
  if (cenario === 'zero') return estadoPadrao('pt');
  const s = estadoPadrao('pt', true);
  if (cenario === 'novo') return s;
  const agora = new Date(Date.now());
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const log: Evento[] = [];
  const concluidas: EstadoRotina['concluidas'] = {};
  const frases = [['eu', 'quero', 'água'], ['quero', 'brincar'], ['eu', 'quero', 'comer'], ['ajuda', 'por favor'], ['mamãe', 'vem'], ['quero', 'desenho']];
  // histórico: 40 dias para trás
  for (let d = 40; d >= 1; d--) {
    const dia = somarDias(hoje, -d);
    const k = chaveDia(dia);
    const n = (d * 7) % 5; // 0..4 tarefas
    const feitas: Record<string, string[]> = {};
    const manha = ['m1', 'm2', 'm3'].slice(0, Math.min(3, n));
    if (manha.length) feitas.manha = manha;
    manha.forEach((id, i) => {
      const t = s.tarefas.find((x) => x.id === id)!;
      log.push({ t: dia.getTime() + (7 * 60 + i * 15) * 60000, tipo: 'tarefa_fim', abaId: 'manha', tarefaId: id, rotulo: t.titulo, estrelas: 1, origem: 'rotina', segundos: Math.max(60, t.duracaoMin * 60) });
    });
    if (manha.length === 3) log.push({ t: dia.getTime() + 8 * 3600000, tipo: 'rotina_completa', abaId: 'manha', rotulo: 'Manhã', estrelas: 2, origem: 'rotina' });
    if (n > 3) { feitas.noite = ['n1']; log.push({ t: dia.getTime() + 18.6 * 3600000, tipo: 'tarefa_fim', abaId: 'noite', tarefaId: 'n1', rotulo: 'Jantar', estrelas: 1, origem: 'rotina', segundos: 1200 }); }
    if (Object.keys(feitas).length) concluidas[k] = feitas;
    for (let f = 0; f < (d % 4) + 1; f++) {
      const p = frases[(d + f) % frases.length];
      log.push({ t: dia.getTime() + (10 + f) * 3600000, tipo: 'frase', palavras: p, estrelas: f < 2 ? 1 : 0, origem: 'voz', novas: d > 30 && f === 0 ? 1 : 0 });
      p.forEach((w) => log.push({ t: dia.getTime() + (10 + f) * 3600000 - 5000, tipo: 'prancha', rotulo: w, origem: 'voz' }));
    }
  }
  // últimos 6 dias sem tarefas (como na captura do Rotina: Ter 13 … Dom 18 = 0)
  const corte = somarDias(hoje, -6).getTime();
  const filtrado = log.filter((e) => !(e.tipo === 'tarefa_fim' || e.tipo === 'rotina_completa') || e.t < corte);
  for (const k of Object.keys(concluidas)) if (new Date(k + 'T12:00:00').getTime() >= corte) delete concluidas[k];

  // hoje: chegou na escola (1 tarefa)
  concluidas[chaveDia(hoje)] = { escola: ['e1'] };
  filtrado.push({ t: hoje.getTime() + 13 * 3600000 + 60000, tipo: 'tarefa_fim', abaId: 'escola', tarefaId: 'e1', rotulo: 'Chegada e mochila', estrelas: 1, origem: 'rotina', segundos: 20 });
  filtrado.push({ t: hoje.getTime() + 9 * 3600000, tipo: 'frase', palavras: ['eu', 'quero', 'água'], estrelas: 1, origem: 'voz' });
  filtrado.push({ t: hoje.getTime() + 10 * 3600000, tipo: 'frase', palavras: ['quero', 'brincar', 'parque'], estrelas: 2, origem: 'voz', novas: 1 });

  const palavras: Record<string, number> = {};
  for (const e of filtrado) if (e.tipo === 'frase') for (const w of e.palavras || []) palavras[w] = (palavras[w] || 0) + 1;

  const uso: Record<string, number> = {};
  for (let d = 70; d >= 0; d--) { if (d % 6 === 3) continue; uso[chaveDia(somarDias(hoje, -d))] = 600 + ((d * 137) % 1500); }
  let st: EstadoRotina = { ...s, log: filtrado.sort((a, b) => a.t - b.t), concluidas, estrelas: 54, palavras, uso };
  if (cenario === 'bloqueada') st = { ...st, tarefas: st.tarefas.map((t) => (t.id === 'e2' ? { ...t, travarAteHorario: true } : t)) };
  if (cenario === 'ativa') st = { ...st, concluidas: { ...concluidas, [chaveDia(hoje)]: { escola: ['e1', 'e2'] } }, tarefaAtiva: { abaId: 'escola', tarefaId: 'e3', inicio: Date.now() - 4 * 60000 - 28000, duracaoSeg: 30 * 60 } };
  if (cenario === 'semtimer') st = { ...st, tarefaAtiva: { abaId: 'escola', tarefaId: 'e2', inicio: Date.now() - 12000, duracaoSeg: 0 } };
  if (cenario === 'espera') st = { ...st, esperaAtiva: { recompensaId: 'r2', inicio: Date.now() - 2 * 60000, fim: Date.now() + 3 * 60000 } };
  if (cenario === 'esperapronta') st = { ...st, esperaAtiva: { recompensaId: 'r2', inicio: Date.now() - 6 * 60000, fim: Date.now() - 1000 } };
  if (cenario === 'foco') st = { ...st, config: { ...st.config, modoFoco: 'banheiro' } };
  return { ...st, config: { ...st.config, tourVisto: true } };
}
