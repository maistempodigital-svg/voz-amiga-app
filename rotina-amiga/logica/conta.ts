/** Conta de MAIS bem simples para o adulto: o resultado é no máximo 15 (ex.: 8 + 5). */
export const LIMITE_CONTA = 15;
export const sortearConta = () => {
  const a = 2 + Math.floor(Math.random() * 8); // 2..9
  const b = 1 + Math.floor(Math.random() * Math.min(9, LIMITE_CONTA - a)); // resultado ≤ 15
  return { a, b, r: a + b };
};
