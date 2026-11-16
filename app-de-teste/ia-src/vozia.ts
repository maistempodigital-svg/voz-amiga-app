// VOZ AMIGA — IA DO APP DE TESTE (roda dentro do celular, sem servidor).
// Gera public/ia/vozia.js. Só é carregado quando os pais abrem a IA ou o "Criar prancha falando".
// Os modelos vêm SEMPRE dos endereços fixos abaixo (Hugging Face), nunca de um endereço vindo de fora,
// e ficam guardados no próprio celular (Cache do navegador interno). Depois de baixados, funcionam sem internet.
import { env, pipeline } from '@huggingface/transformers';

type Progresso = { feito: number; total: number; arquivo?: string };
type Pipe = (...a: unknown[]) => Promise<unknown>;

const BASE = new URL('./ia/', location.href).href;
env.allowLocalModels = false;
env.useBrowserCache = true;
// o motor (WebAssembly) vem dentro do app — nada é baixado de CDN
// (".js" e não ".mjs": a casca do APK só entrega módulos com o tipo certo quando terminam em .js)
const ORT = env.backends.onnx as { wasm: { wasmPaths: unknown; numThreads: number } };
ORT.wasm.wasmPaths = { mjs: `${BASE}ort-wasm-simd-threaded.js`, wasm: `${BASE}ort-wasm-simd-threaded.wasm` };
ORT.wasm.numThreads = 1;

export const MODELOS = {
  ouvir: { repo: 'onnx-community/whisper-base', tarefa: 'automatic-speech-recognition', revisao: '27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c', dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' }, mb: 77,
    arquivoPrincipal: 'onnx/decoder_model_merged_quantized.onnx' },
  gemma: { repo: 'onnx-community/gemma-3-270m-it-ONNX', tarefa: 'text-generation', revisao: '2dbbfdb1b59bd034eb959428c6a7da9dd7ea27f0', dtype: 'q4', mb: 323,
    arquivoPrincipal: 'onnx/model_q4.onnx_data' },
} as const;
type IdModelo = keyof typeof MODELOS;

const carregados: Partial<Record<IdModelo, Pipe>> = {};
const carregando: Partial<Record<IdModelo, Promise<Pipe>>> = {};

const urlArquivo = (id: IdModelo) => `https://huggingface.co/${MODELOS[id].repo}/resolve/${MODELOS[id].revisao}/${MODELOS[id].arquivoPrincipal}`;

/** Já está no celular? (procura o arquivo principal no cache) */
async function pronto(id: IdModelo): Promise<boolean> {
  if (carregados[id]) return true;
  try { const c = await caches.open('transformers-cache'); return !!(await c.match(urlArquivo(id))); } catch { return false; }
}

/** Baixa (se precisar) e prepara. Mostra o progresso somando todos os arquivos. */
function carregar(id: IdModelo, aoProgresso?: (p: Progresso) => void): Promise<Pipe> {
  if (carregados[id]) return Promise.resolve(carregados[id]!);
  if (carregando[id]) return carregando[id]!;
  const arq: Record<string, { feito: number; total: number }> = {};
  const m = MODELOS[id];
  const p = (pipeline as unknown as (t: string, r: string, o: object) => Promise<Pipe>)(m.tarefa, m.repo, {
    dtype: m.dtype, device: 'wasm', revision: m.revisao, // versão FIXA do modelo (não muda sozinho)
    progress_callback: (x: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (!x.file) return;
      if (x.status === 'progress' && x.total) arq[x.file] = { feito: x.loaded || 0, total: x.total };
      if (x.status === 'done' && arq[x.file]) arq[x.file].feito = arq[x.file].total;
      const total = Object.values(arq).reduce((a, b) => a + b.total, 0);
      const feito = Object.values(arq).reduce((a, b) => a + b.feito, 0);
      aoProgresso?.({ feito, total: Math.max(total, m.mb * 1e6), arquivo: x.file });
    },
  }).then((pp) => { carregados[id] = pp; delete carregando[id]; return pp; }, (e) => { delete carregando[id]; throw e; });
  carregando[id] = p;
  return p;
}

async function apagar(id: IdModelo) {
  delete carregados[id];
  try {
    const c = await caches.open('transformers-cache');
    for (const r of await c.keys()) if (r.url.includes(`/${MODELOS[id].repo}/`)) await c.delete(r);
  } catch { /* */ }
}

// ------------------------------------------------------------ ouvir (microfone → texto), sem o "bip" do ditado do Google
let gravando: { rec: MediaRecorder; partes: Blob[]; stream: MediaStream } | undefined;
const MAX_MS = 30000;
let corte: ReturnType<typeof setTimeout> | undefined;
async function ouvirComecar() {
  if (gravando) ouvirCancelar(); // nunca deixa uma gravação antiga esquecida
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const rec = new MediaRecorder(stream);
  const partes: Blob[] = [];
  let tam = 0;
  rec.ondataavailable = (e) => { if (e.data.size && tam + e.data.size < 3_000_000) { tam += e.data.size; partes.push(e.data); } };
  rec.start(250);
  gravando = { rec, partes, stream };
  // para sozinho em 30 s (o microfone nunca fica ligado esquecido)
  corte = setTimeout(() => { try { if (gravando?.rec === rec && rec.state === 'recording') rec.stop(); } catch { /* */ } stream.getTracks().forEach((t) => t.stop()); }, MAX_MS);
}
async function ouvirParar(idioma: 'pt' | 'en' | 'es'): Promise<string> {
  const g = gravando; gravando = undefined; if (corte) clearTimeout(corte);
  if (!g) return '';
  await new Promise<void>((ok) => { if (g.rec.state === 'inactive') { ok(); return; } g.rec.onstop = () => ok(); try { g.rec.stop(); } catch { ok(); } });
  g.stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(g.partes, { type: g.rec.mimeType || 'audio/webm' });
  if (blob.size < 2000) return '';
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
  const dados = audio.getChannelData(0).slice(0, 16000 * 30); // até 30 s
  try { await ctx.close(); } catch { /* */ }
  const asr = await carregar('ouvir');
  const r = (await asr(dados, { language: idioma === 'en' ? 'english' : idioma === 'es' ? 'spanish' : 'portuguese', task: 'transcribe' })) as { text?: string };
  return (r?.text || '').trim().slice(0, 400);
}
function ouvirCancelar() { const g = gravando; gravando = undefined; if (corte) clearTimeout(corte); try { g?.rec.stop(); } catch { /* */ } g?.stream.getTracks().forEach((t) => t.stop()); }

// ------------------------------------------------------------ gerar texto (IA no celular)
async function gerar(mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[], max = 80): Promise<string> {
  const g = await carregar('gemma');
  const out = (await g(mensagens.slice(-6).map((m) => ({ role: m.role, content: String(m.content).slice(0, 1200) })), { max_new_tokens: Math.min(160, max), do_sample: false })) as { generated_text: { content: string }[] }[];
  const ult = out?.[0]?.generated_text;
  return (Array.isArray(ult) ? ult[ult.length - 1]?.content : '') || '';
}

const api = { MODELOS, pronto, baixar: (id: IdModelo, f?: (p: Progresso) => void) => carregar(id, f).then(() => undefined), apagar, ouvirComecar, ouvirParar, ouvirCancelar, gerar, versao: env.version };
(window as unknown as { VozIA: typeof api }).VozIA = api;
window.dispatchEvent(new Event('vozia-pronta'));
