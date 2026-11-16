// Roda UMA vez, na primeira abertura da versão nova no celular que tinha o Voz Amiga 1.0.24.
import { migrarDoAppAntigo, temDadosV24, ResultadoMig } from './migracaoV24';
import type { EstadoVoz } from './voz/base';

type PonteMig = { lerAppAntigo?: () => string; pastaArquivos?: () => string };
const ponteMig = (): PonteMig | undefined => (typeof window !== 'undefined' ? (window as unknown as { AndroidTTS?: PonteMig }).AndroidTTS : undefined);

/** Endereço que a casca entende para um arquivo do app antigo. */
export const enderecoArquivo = (origem: string, pasta: string): string | undefined => {
  let u = origem.replace(/^file:\/\//, '');
  try { u = decodeURI(u); } catch { /* */ }
  const p = pasta.replace(/\/$/, '');
  const alt = p.replace('/data/user/0/', '/data/data/');
  for (const base of [p, alt]) if (u.startsWith(base + '/')) return 'https://appassets.androidplatform.net/arquivos/' + u.slice(base.length + 1).split('/').map(encodeURIComponent).join('/');
  if (/^https:\/\//.test(origem)) return origem;
  return undefined;
};

const paraDataUrl = async (url: string, limite: number): Promise<string | undefined> => {
  try {
    const b = await (await fetch(url)).blob();
    if (!b.size || b.size > limite) return undefined;
    return await new Promise<string>((ok, erro) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = erro; fr.readAsDataURL(b); });
  } catch { return undefined; }
};

/** Lê o app antigo. undefined = não tem nada para migrar. */
export function lerAntigo(): Record<string, string> | undefined {
  const p = ponteMig();
  if (!p?.lerAppAntigo) return undefined;
  try { const o = JSON.parse(p.lerAppAntigo()) as Record<string, string>; return temDadosV24(o) ? o : undefined; } catch { return undefined; }
}

/** Converte tudo (fotos e áudios viram dados dentro do app novo). */
export async function montarEstadoMigrado(chaves: Record<string, string>, base: EstadoVoz, reduzirImagem: (u: string) => Promise<string>): Promise<{ estado: EstadoVoz; r: ResultadoMig; falharam: number }> {
  const r = migrarDoAppAntigo(chaves);
  const pasta = ponteMig()?.pastaArquivos?.() || '/data/user/0/com.vozamiga/files';
  const porId = new Map(r.pranchas.map((p) => [p.id, { ...p }]));
  let falharam = 0;
  for (const m of r.midias) {
    const alvo = porId.get(m.pranchaId); if (!alvo) continue;
    const url = enderecoArquivo(m.origem, pasta);
    if (!url) { falharam++; continue; }
    if (m.tipo === 'imagem') {
      const d = await reduzirImagem(url).catch(() => '');
      if (d && /^data:image\//.test(d)) { alvo.imagem = d; delete alvo.emoji; } else falharam++;
    } else {
      const d = await paraDataUrl(url, 2_500_000);
      if (d && /^data:audio\//.test(d)) alvo.audio = d; else falharam++;
    }
  }
  const geral = base.abas.find((a) => a.id === 'geral') || { id: 'geral', nome: 'Geral', tema: 'GERAL' };
  const estado: EstadoVoz = {
    ...base,
    abas: [geral, ...r.abas],
    pranchas: r.pranchas.map((p) => porId.get(p.id)!),
    defs: { ...base.defs, idioma: r.idioma, ...(r.voz ? { voz: r.voz } : {}), ...(r.volume !== undefined ? { volume: r.volume } : {}), ...(r.colunas ? { colunas: r.colunas, colunasAuto: false } : {}), inicioUso: 0, migradoV24: Date.now() },
  };
  return { estado, r, falharam };
}
