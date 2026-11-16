// "Senha dos pais — bloqueio matemático" (igual ao Rotina Amiga).
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRotina } from '../estado';
import { Botao, C, CaixaIcone, sombra, T, px } from './ui';

import { sortearConta } from '../logica/conta';
import { conferirSenha, esperaSenhaMs } from '../v14/seguranca';

const L_SENHA = {
  pt: { t: 'Senha dos pais', d: 'Digite a senha de números.', erro: 'Senha errada.', espera: 'Muitas tentativas. Espere', esqueci: 'Esqueci a senha', dificil: 'Para apagar a senha, resolva:', apagada: 'Senha apagada. Crie outra em Mais funções.', pedido: 'Alguém pediu para apagar a senha. Se não foi você, digite a senha certa: o pedido é cancelado.', espera24: 'Por segurança, a senha só pode ser apagada daqui a 24 horas. Volte amanhã e toque de novo em "Esqueci a senha".', falta: 'A senha poderá ser apagada a partir de' },
  en: { t: 'Parents’ PIN', d: 'Type the number PIN.', erro: 'Wrong PIN.', espera: 'Too many tries. Wait', esqueci: 'Forgot PIN', dificil: 'To erase the PIN, solve:', apagada: 'PIN erased. Create another in More features.', pedido: 'Someone asked to erase the PIN. If it wasn’t you, type the right PIN: the request is cancelled.', espera24: 'For safety, the PIN can only be erased in 24 hours. Come back tomorrow and tap "Forgot PIN" again.', falta: 'The PIN can be erased from' },
  es: { t: 'Clave de los padres', d: 'Escribe la clave de números.', erro: 'Clave incorrecta.', espera: 'Demasiados intentos. Espera', esqueci: 'Olvidé la clave', dificil: 'Para borrar la clave, resuelve:', apagada: 'Clave borrada. Crea otra en Más funciones.', pedido: 'Alguien pidió borrar la clave. Si no fuiste tú, escribe la clave correcta: el pedido se cancela.', espera24: 'Por seguridad, la clave solo se puede borrar dentro de 24 horas. Vuelve mañana y toca otra vez "Olvidé la clave".', falta: 'La clave se podrá borrar desde' },
};

const sortear = sortearConta;

export function PortaoPais() {
  const { pedidoAdulto, responderAdulto, t, recurso, v14, idioma, mudarV14, mostrarAviso, registrarSinal } = useRotina();
  const [conta, setConta] = useState(sortear);
  // v14: depois da continha, a senha dos pais (se ligada). 'reset' = conta difícil para apagar a senha esquecida.
  const [fase, setFase] = useState<'conta' | 'senha' | 'reset'>('conta');
  const [dificil, setDificil] = useState({ a: 12, b: 7 });
  const [agoraMs, setAgoraMs] = useState(Date.now());
  const LS = L_SENHA[idioma] || L_SENHA.pt;
  // a senha não depende do plano nem do Firebase (é proteção da família)
  const comSenha = recurso('senhaPais') && !!v14.senhaHash && !!v14.senhaSal;
  const errosSenha = v14.senhaErros;
  useEffect(() => { if (fase !== 'senha' || errosSenha.ate <= Date.now()) return undefined; const h = setInterval(() => setAgoraMs(Date.now()), 1000); return () => clearInterval(h); }, [fase, agoraMs]);
  const [txt, setTxt] = useState('');
  const [erro, setErro] = useState(false);
  useEffect(() => { if (pedidoAdulto) { setConta(sortear()); setTxt(''); setErro(false); setFase('conta'); } }, [pedidoAdulto]);
  const teclas = useMemo(() => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'], []);
  if (!pedidoAdulto) return null;
  const tocar = (k: string) => {
    if (k === '⌫') { setTxt((x) => x.slice(0, -1)); setErro(false); return; }
    if (k === '✓') {
      if (fase === 'senha') {
        if (errosSenha.ate > Date.now()) return;
        if (conferirSenha(txt, v14.senhaSal || '', v14.senhaHash)) { mudarV14({ senhaErros: { n: 0, ate: 0 }, senhaResetEm: undefined }); responderAdulto(true); }
        else { const n = errosSenha.n + 1; mudarV14({ senhaErros: { n, ate: Date.now() + esperaSenhaMs(n) } }); setAgoraMs(Date.now()); setErro(true); setTxt(''); }
        return;
      }
      if (fase === 'reset') {
        // SEGURANÇA: só depois das 24 h; apaga a senha mas NÃO abre os ajustes (os pais entram de novo e criam outra)
        if (Number(txt) === dificil.a * dificil.b && v14.senhaResetEm && Date.now() >= v14.senhaResetEm) { mudarV14({ senhaHash: undefined, senhaSal: undefined, senhaResetEm: undefined, senhaErros: { n: 0, ate: 0 } }); registrarSinal('senha_apagada'); mostrarAviso(LS.apagada); responderAdulto(false); }
        else { setErro(true); setTxt(''); setDificil({ a: 11 + Math.floor(Math.random() * 15), b: 6 + Math.floor(Math.random() * 4) }); }
        return;
      }
      if (Number(txt) === conta.r) { if (comSenha) { setFase('senha'); setTxt(''); setErro(false); } else responderAdulto(true); }
      else { setErro(true); setTxt(''); setConta(sortear()); }
      return;
    }
    if (txt.length < (fase === 'senha' ? 8 : 3)) { setTxt((x) => x + k); setErro(false); }
  };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => responderAdulto(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: px(35) }}>
        <View style={[{ backgroundColor: C.white, borderRadius: px(51), padding: px(38.5) }, sombra(12)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CaixaIcone icone={{ f: 'mci', n: 'cog-outline' }} cor="#E11D48" fundo="#FFE4E6" tam={px(86.5)} />
            <View style={{ marginLeft: px(22.5), flex: 1 }}>
              <T s="h2">{pedidoAdulto.titulo || t('parentsArea')}</T>
              <T s="cap" style={{ marginTop: px(3) }}>{t('solveToEnter')}</T>
            </View>
          </View>
          {fase === 'senha' ? (
            <>
              <T s="h3" style={{ textAlign: 'center', marginTop: px(28) }}>🔑 {LS.t}</T>
              <T s="cap" style={{ textAlign: 'center' }}>{LS.d}</T>
              {v14.senhaResetEm ? <T style={{ textAlign: 'center', color: '#B45309', fontWeight: '800', marginTop: px(6) }}>⚠️ {LS.pedido}</T> : null}
              <Text accessibilityLabel="senha digitada" style={{ fontSize: px(60), fontWeight: '900', color: erro ? C.red : C.blue, textAlign: 'center', marginTop: px(10), letterSpacing: px(10) }}>{txt ? '●'.repeat(txt.length) : '_ _ _ _'}</Text>
              {errosSenha.ate > agoraMs ? <T style={{ textAlign: 'center', color: C.red, fontWeight: '800' }}>{LS.espera} {Math.ceil((errosSenha.ate - agoraMs) / 1000)} s</T> : erro ? <T style={{ textAlign: 'center', color: C.red, fontWeight: '800' }}>{LS.erro}</T> : null}
            </>
          ) : fase === 'reset' ? (
            <>
              <T s="cap" style={{ textAlign: 'center', marginTop: px(28) }}>{LS.dificil}</T>
              <Text style={{ fontSize: px(58), fontWeight: '900', color: C.ink, textAlign: 'center', marginTop: px(8) }}>{dificil.a} × {dificil.b} = <Text style={{ color: erro ? C.red : C.blue }}>{txt || '?'}</Text></Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: px(64), fontWeight: '900', color: C.ink, textAlign: 'center', marginTop: px(35) }}>{conta.a} + {conta.b} = <Text style={{ color: erro ? C.red : C.blue }}>{txt || '?'}</Text></Text>
              {erro ? <T style={{ textAlign: 'center', color: C.red, fontWeight: '800', marginTop: px(6.5) }}>{t('wrong')}</T> : null}
            </>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: px(25.5) }}>
            {teclas.map((k) => (
              <Pressable key={k} onPress={() => tocar(k)} accessibilityLabel={k} style={({ pressed }) => [{ width: '31%', height: px(99), borderRadius: px(32), marginBottom: px(16), alignItems: 'center', justifyContent: 'center', backgroundColor: k === '✓' ? C.green : '#F1F5F9', opacity: pressed ? 0.7 : 1 }]}>
                <Text style={{ fontSize: px(41.5), fontWeight: '900', color: k === '✓' ? '#052E1B' : C.ink }}>{k}</Text>
              </Pressable>
            ))}
          </View>
          {fase === 'senha' ? (
            <Pressable onPress={() => {
              if (!v14.senhaResetEm) { mudarV14({ senhaResetEm: Date.now() + 24 * 3600_000 }); registrarSinal('senha_esquecida'); mostrarAviso(LS.espera24); responderAdulto(false); return; }
              if (Date.now() < v14.senhaResetEm) { mostrarAviso(`${LS.falta} ${new Date(v14.senhaResetEm).toLocaleString()}`); responderAdulto(false); return; }
              setFase('reset'); setTxt(''); setErro(false); setDificil({ a: 11 + Math.floor(Math.random() * 15), b: 6 + Math.floor(Math.random() * 4) }); }} accessibilityRole="button" accessibilityLabel={LS.esqueci} style={{ alignSelf: 'center', padding: px(10) }}>
              <Text style={{ color: C.blue, fontWeight: '800', fontSize: px(22) }}>{LS.esqueci}</Text>
            </Pressable>
          ) : null}
          <Botao titulo={t('cancel')} contorno onPress={() => responderAdulto(false)} style={{ marginTop: px(9.5) }} />
        </View>
      </View>
    </Modal>
  );
}
