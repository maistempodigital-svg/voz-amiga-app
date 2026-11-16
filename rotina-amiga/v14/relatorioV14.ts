// VOZ AMIGA v14 — "Evolução" no relatório: palavras novas, pedidos feitos sozinho, mais usadas, nível, marcos, modo exemplo e missões.
import { EstadoRotina, Idioma } from '../tipos';
import { configV14Padrao } from './config';
import { MARCOS, NIVEIS } from './crescer';

type L = Record<Idioma, string>;
const TX: Record<string, L> = {
  titulo: { pt: 'Evolução (funções novas)', en: 'Progress (new features)', es: 'Evolución (funciones nuevas)' },
  novas: { pt: 'Palavras novas (1ª vez no período)', en: 'New words (first time in period)', es: 'Palabras nuevas (1ª vez en el período)' },
  sozinho: { pt: 'Pedidos feitos pela criança sozinha', en: 'Requests made by the child alone', es: 'Pedidos hechos por el niño solo' },
  nivel: { pt: 'Nível da frase agora', en: 'Current sentence level', es: 'Nivel de la frase ahora' },
  modelo: { pt: 'Palavras mostradas pelos pais (modo exemplo)', en: 'Words shown by parents (show-me mode)', es: 'Palabras mostradas por los padres (modo ejemplo)' },
  missoes: { pt: 'Missões do dia feitas pelos pais', en: 'Daily missions done by parents', es: 'Misiones del día hechas por los padres' },
  emergencia: { pt: 'Botão de emergência usado', en: 'Emergency button used', es: 'Botón de emergencia usado' },
  maisUsadas: { pt: 'Palavras mais usadas', en: 'Most used words', es: 'Palabras más usadas' },
  marcos: { pt: 'Marcos alcançados no período', en: 'Milestones reached in the period', es: 'Logros alcanzados en el período' },
  listaNovas: { pt: 'Palavras novas', en: 'New words', es: 'Palabras nuevas' },
};

export interface DadosEvolucao { titulo: string; itens: { rotulo: string; valor: string }[]; listas: { titulo: string; linhas: string[] }[]; vazia: boolean }

const norm = (w: string) => w.trim().toLowerCase();

export const evolucao = (s: EstadoRotina, inicio: number, fim: number, idioma: Idioma): DadosEvolucao => {
  const cfg = s.v14 || configV14Padrao();
  const antes = new Set<string>();
  const uso = new Map<string, number>();
  const novas: string[] = [];
  let sozinho = 0, modelo = 0, missoes = 0, emerg = 0;
  const marcos: string[] = [];
  for (const e of s.log) {
    const daCrianca = (e.tipo === 'prancha' || e.tipo === 'frase') && e.origem !== 'pais';
    const palavras = daCrianca ? (e.tipo === 'prancha' ? [e.rotulo || ''] : e.palavras || []).map(norm).filter(Boolean) : [];
    if (e.t < inicio) { palavras.forEach((w) => antes.add(w)); continue; }
    if (e.t >= fim) continue;
    if (daCrianca) {
      sozinho++;
      for (const w of palavras) { uso.set(w, (uso.get(w) || 0) + 1); if (!antes.has(w)) { antes.add(w); novas.push(w); } }
    }
    if (e.tipo === 'modelo') modelo++;
    if (e.tipo === 'missao') missoes++;
    if (e.tipo === 'emergencia') emerg++;
    if (e.tipo === 'marco' && e.valor) { const d = MARCOS.find((m) => m.id === e.valor); if (d) marcos.push(`${d.emoji} ${d.r[idioma]}`); }
  }
  const top = [...uso.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, n]) => `${w} (${n})`);
  const nivel = NIVEIS.find((n) => n.n === cfg.nivel);
  const listas = [
    ...(top.length ? [{ titulo: TX.maisUsadas[idioma], linhas: top }] : []),
    ...(novas.length ? [{ titulo: TX.listaNovas[idioma], linhas: [novas.slice(0, 40).join(', ')] }] : []),
    ...(marcos.length ? [{ titulo: TX.marcos[idioma], linhas: marcos }] : []),
  ];
  return {
    titulo: TX.titulo[idioma],
    itens: [
      { rotulo: TX.novas[idioma], valor: String(novas.length) },
      { rotulo: TX.sozinho[idioma], valor: String(sozinho) },
      { rotulo: TX.nivel[idioma], valor: nivel ? `${nivel.emoji} ${nivel.r[idioma]}` : '—' },
      { rotulo: TX.modelo[idioma], valor: String(modelo) },
      { rotulo: TX.missoes[idioma], valor: String(missoes) },
      { rotulo: TX.emergencia[idioma], valor: String(emerg) },
    ],
    listas,
    vazia: sozinho + modelo + missoes + emerg + marcos.length === 0,
  };
};
