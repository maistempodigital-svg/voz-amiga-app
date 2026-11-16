export const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const chaveDia = (d: Date | number = new Date()) => {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export const diaDaChave = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** "07:30" -> 450. Inválido ou vazio -> undefined. */
export const paraMin = (hhmm?: string) => {
  if (!hhmm) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return undefined;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return undefined;
  return h * 60 + mi;
};

export const minDoDia = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const somarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Semana começando no domingo (igual ao relatório do Rotina Amiga). */
export const inicioSemana = (d: Date) => somarDias(inicioDia(d), -d.getDay());

export const relogio = (seg: number) => {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

export const duracaoCurta = (seg: number) => {
  const m = Math.round(seg / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 ? ` ${m % 60}m` : ''}`;
};

/** Normaliza o texto digitado no campo de horário ("730" -> "07:30"). */
export const formatarHorario = (txt: string) => {
  const d = txt.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, d.length - 2).padStart(2, '0')}:${d.slice(-2)}`;
};
