// ------------------------------------------------------------------ janela do sábado (igual ao app: v14/premium.ts)
const JANELA_PADRAO = { ativo: true, inicioDia: 5, inicioHora: 17, fimDia: 6, fimHora: 20, fusoDonoMin: -180 };
const lerJanela = (x) => {
  const o = x && typeof x === 'object' ? x : {};
  const int = (v, min, max, d) => (Number.isInteger(v) && v >= min && v <= max ? v : d);
  return {
    ativo: o.ativo === false ? false : true,
    inicioDia: int(o.inicioDia, 0, 6, 5), inicioHora: int(o.inicioHora, 0, 23, 17),
    fimDia: int(o.fimDia, 0, 6, 6), fimHora: int(o.fimHora, 0, 23, 20),
    fusoDonoMin: int(o.fusoDonoMin, -720, 840, -180),
  };
};
const minutoSemana = (ms, fuso) => { const d = new Date(ms + fuso * 60000); return d.getUTCDay() * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes(); };
const dentro = (m, j) => { const i = j.inicioDia * 1440 + j.inicioHora * 60, f = j.fimDia * 1440 + j.fimHora * 60; return i <= f ? m >= i && m < f : m >= i || m < f; };
const travado = (ms, j) => j.ativo && dentro(minutoSemana(ms, j.fusoDonoMin), j);
/** Para quando adiar uma renovação que cairia na janela (2 h depois do fim). */
const adiarPara = (ms, j) => {
  if (!travado(ms, j)) return undefined;
  for (let t = ms - (ms % 60000) + 60000, k = 0; k < 4 * 1440; t += 60000, k++) if (!travado(t, j)) return t + 2 * 3600000;
  return undefined;
};
module.exports = { lerJanela, travado, adiarPara };
