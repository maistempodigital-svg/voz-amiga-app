// Conta (mesmo login do app 1.0.24), plano do servidor e limites do Firebase, para o app inteiro.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { User } from 'firebase/auth';
import {
  acompanharConta, acompanharRemoto, criarConta, entrarEmail, entrarGoogle, erroAmigavel, esqueciSenha, sair,
  temGoogleNativo, DadosRemotos, PlanoServidor,
} from './conta';
import { useVoz } from './voz/base';
import { TelaIdioma } from './boasVindas';

const BUSCA = typeof window !== 'undefined' && window.location ? window.location.search : '';
/** Nos testes automáticos (?tela=…) o app não conecta no Firebase. */
const SEM_FIREBASE = /[?&](tela|semFirebase)=/.test(BUSCA);

interface Ctx { usuario: User | null; plano?: PlanoServidor; remoto: DadosRemotos; pronto: boolean; abrirEntrar: (motivo?: string) => void; precisaEntrar: boolean; precisaIdioma: boolean }
const ContaCtx = createContext<Ctx>({ usuario: null, remoto: {}, pronto: true, abrirEntrar: () => undefined, precisaEntrar: false, precisaIdioma: false });
export const useConta = () => useContext(ContaCtx);

export function ContaProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [plano, setPlano] = useState<PlanoServidor>();
  const [remoto, setRemoto] = useState<DadosRemotos>({});
  const [pronto, setPronto] = useState(SEM_FIREBASE);
  const [entrar, setEntrar] = useState<string | undefined>();
  useEffect(() => {
    if (SEM_FIREBASE) return;
    let pararRemoto: (() => void) | undefined;
    const parar = acompanharConta((u, p) => {
      setUsuario(u); setPlano(p); setPronto(true);
      pararRemoto?.(); pararRemoto = u ? acompanharRemoto(setRemoto) : undefined;
    });
    return () => { parar(); pararRemoto?.(); };
  }, []);
  // 1ª abertura: primeiro o idioma, depois o login (obrigatório; fica salvo no celular e funciona sem internet depois)
  const voz = useVoz();
  const idioma = voz.s.defs.idioma;
  const precisaIdioma = !SEM_FIREBASE && voz.pronto && !voz.s.defs.idiomaEscolhido;
  const precisaEntrar = !SEM_FIREBASE && pronto && !usuario;
  return (
    <ContaCtx.Provider value={{ usuario, plano, remoto, pronto, abrirEntrar: (m) => setEntrar(m || ''), precisaEntrar, precisaIdioma }}>
      {children}
      {precisaIdioma ? <TelaIdioma atual={idioma} escolher={(l) => voz.mudar((x) => ({ ...x, defs: { ...x.defs, idioma: l, idiomaEscolhido: true } }))} />
        : precisaEntrar ? <TelaEntrar obrigatorio idioma={idioma} motivo={TX[idioma].bemVindo} fechar={() => undefined} />
        : entrar !== undefined ? <TelaEntrar idioma={idioma} motivo={entrar} fechar={() => setEntrar(undefined)} /> : null}
    </ContaCtx.Provider>
  );
}

const TX = {
  pt: { bemVindo: 'Bem-vindo ao Voz Amiga! 💙 Entre na sua conta para começar. Se você já usava o app, use o mesmo e-mail: suas pranchas e seu plano continuam.', entrarT: '🔐 Entrar na conta', criarT: '✨ Criar conta', google: 'Entrar com Google', email: 'E-mail', senha: 'Senha', entrar: 'Entrar', criar: 'Criar conta', esqueci: 'Esqueci a senha', enviado: '✅ Enviamos um e-mail para você criar uma senha nova.', naoTem: 'Não tem conta? Criar conta', jaTem: 'Já tem conta? Entrar', agoraNao: 'Agora não', ou: 'ou com e-mail' },
  en: { bemVindo: 'Welcome to Voz Amiga! 💙 Sign in to start. If you already used the app, use the same email: your boards and your plan stay with you.', entrarT: '🔐 Sign in', criarT: '✨ Create account', google: 'Sign in with Google', email: 'Email', senha: 'Password', entrar: 'Sign in', criar: 'Create account', esqueci: 'Forgot password', enviado: '✅ We sent you an email to create a new password.', naoTem: 'No account? Create one', jaTem: 'Already have an account? Sign in', agoraNao: 'Not now', ou: 'or with email' },
  es: { bemVindo: '¡Bienvenido a Voz Amiga! 💙 Entra en tu cuenta para empezar. Si ya usabas la app, usa el mismo correo: tus tableros y tu plan siguen contigo.', entrarT: '🔐 Entrar en la cuenta', criarT: '✨ Crear cuenta', google: 'Entrar con Google', email: 'Correo', senha: 'Contraseña', entrar: 'Entrar', criar: 'Crear cuenta', esqueci: 'Olvidé la contraseña', enviado: '✅ Te enviamos un correo para crear una contraseña nueva.', naoTem: '¿No tienes cuenta? Crear cuenta', jaTem: '¿Ya tienes cuenta? Entrar', agoraNao: 'Ahora no', ou: 'o con correo' },
};

/** Entrar na conta: e-mail/senha, criar conta, esqueci a senha e Google. */
export function TelaEntrar({ motivo, fechar, obrigatorio, idioma = 'pt' }: { motivo?: string; fechar: () => void; obrigatorio?: boolean; idioma?: 'pt' | 'en' | 'es' }) {
  const x = TX[idioma];
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const rodar = async (f: () => Promise<unknown>, ok?: string) => {
    setOcupado(true); setMsg('');
    try { await f(); if (ok) setMsg(ok); else fechar(); } catch (e) { setMsg(erroAmigavel(e)); }
    setOcupado(false);
  };
  const bt = (cor: string) => ({ marginTop: 10, backgroundColor: cor, borderRadius: 14, paddingVertical: 13, alignItems: 'center' as const, opacity: ocupado ? 0.6 : 1 });
  const campo = { marginTop: 8, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' };
  return (
    <Modal transparent visible animationType={obrigatorio ? "none" : "fade"} onRequestClose={fechar}>
      <View style={{ flex: 1, backgroundColor: obrigatorio ? '#EFF6FF' : 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 16 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View accessibilityLabel="entrar na conta" style={{ backgroundColor: '#fff', borderRadius: 22, padding: 18, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
            {obrigatorio ? <Text style={{ fontSize: 46, textAlign: 'center' }}>💙</Text> : null}
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>{modo === 'entrar' ? x.entrarT : x.criarT}</Text>
            {motivo ? <Text style={{ marginTop: 6, fontSize: 14, color: '#475569' }}>{motivo}</Text> : null}
            {temGoogleNativo() ? (
              <Pressable disabled={ocupado} onPress={() => rodar(() => entrarGoogle())} accessibilityRole="button" style={{ ...bt('#fff'), borderWidth: 1.5, borderColor: '#CBD5E1' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>G  {x.google}</Text>
              </Pressable>
            ) : null}
            <TextInput value={email} onChangeText={setEmail} placeholder={x.email} autoCapitalize="none" keyboardType="email-address" accessibilityLabel="e-mail" style={campo} />
            <TextInput value={senha} onChangeText={setSenha} placeholder={x.senha} secureTextEntry accessibilityLabel="senha" style={campo} />
            {msg ? <Text accessibilityLabel="mensagem da conta" style={{ marginTop: 8, color: msg.startsWith('✅') ? '#166534' : '#B91C1C', fontWeight: '700' }}>{msg}</Text> : null}
            <Pressable disabled={ocupado} onPress={() => rodar(() => (modo === 'entrar' ? entrarEmail(email, senha) : criarConta(email, senha)))} accessibilityRole="button" style={bt('#2563EB')}>
              {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{modo === 'entrar' ? x.entrar : x.criar}</Text>}
            </Pressable>
            {modo === 'entrar' ? (
              <Pressable disabled={ocupado || !email.trim()} onPress={() => rodar(() => esqueciSenha(email), x.enviado)} style={{ marginTop: 10, alignItems: 'center' }}>
                <Text style={{ color: '#2563EB', fontWeight: '800' }}>{x.esqueci}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMsg(''); }} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#334155', fontWeight: '800' }}>{modo === 'entrar' ? x.naoTem : x.jaTem}</Text>
            </Pressable>
            {obrigatorio ? null : <Pressable onPress={fechar} style={{ marginTop: 12, alignItems: 'center' }}><Text style={{ color: '#64748B', fontWeight: '700' }}>{x.agoraNao}</Text></Pressable>}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Bloco "Sua conta" na tela de Assinatura. */
export function BlocoConta() {
  const { usuario, abrirEntrar, plano } = useConta();
  if (SEM_FIREBASE) return null;
  return (
    <View accessibilityLabel="sua conta" style={{ backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10 }}>
      {usuario ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>👤 {usuario.email}</Text>
          <Text style={{ fontSize: 12.5, color: plano?.hasAccess ? '#166534' : '#475569', marginTop: 2 }}>{plano?.hasAccess ? '👑 Plano Completo ativo' : 'Versão gratuita'}</Text>
          <Pressable onPress={() => sair()} style={{ marginTop: 8 }}><Text style={{ color: '#B91C1C', fontWeight: '800' }}>Sair da conta</Text></Pressable>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 14, color: '#334155' }}>Entre na sua conta para assinar ou para recuperar o plano que você já tem.</Text>
          <Pressable onPress={() => abrirEntrar()} accessibilityRole="button" style={{ marginTop: 8, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900' }}>Entrar na conta</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
