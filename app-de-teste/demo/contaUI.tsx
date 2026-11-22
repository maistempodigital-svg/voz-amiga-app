// Conta (mesmo login do app 1.0.24), plano do servidor e limites do Firebase, para o app inteiro.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { User } from 'firebase/auth';
import {
  acompanharConta, acompanharRemoto, criarConta, entrarEmail, entrarGoogle, erroAmigavel, esqueciSenha, sair,
  temGoogleNativo, DadosRemotos, PlanoServidor,
} from './conta';

const BUSCA = typeof window !== 'undefined' && window.location ? window.location.search : '';
/** Nos testes automáticos (?tela=…) o app não conecta no Firebase. */
const SEM_FIREBASE = /[?&](tela|semFirebase)=/.test(BUSCA);

interface Ctx { usuario: User | null; plano?: PlanoServidor; remoto: DadosRemotos; pronto: boolean; abrirEntrar: (motivo?: string) => void; precisaEntrar: boolean }
const ContaCtx = createContext<Ctx>({ usuario: null, remoto: {}, pronto: true, abrirEntrar: () => undefined, precisaEntrar: false });
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
  // Login obrigatório: sem conta, o app mostra a tela de entrar (o login fica salvo no celular, funciona sem internet depois)
  const precisaEntrar = !SEM_FIREBASE && pronto && !usuario;
  return (
    <ContaCtx.Provider value={{ usuario, plano, remoto, pronto, abrirEntrar: (m) => setEntrar(m || ''), precisaEntrar }}>
      {children}
      {precisaEntrar ? <TelaEntrar obrigatorio motivo={'Bem-vindo ao Voz Amiga! 💙 Entre na sua conta para começar. Se você já usava o app, use o mesmo e-mail: suas pranchas e seu plano continuam.'} fechar={() => undefined} />
        : entrar !== undefined ? <TelaEntrar motivo={entrar} fechar={() => setEntrar(undefined)} /> : null}
    </ContaCtx.Provider>
  );
}

/** Entrar na conta: e-mail/senha, criar conta, esqueci a senha e Google. */
export function TelaEntrar({ motivo, fechar, obrigatorio }: { motivo?: string; fechar: () => void; obrigatorio?: boolean }) {
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
    <Modal transparent visible animationType="fade" onRequestClose={fechar}>
      <View style={{ flex: 1, backgroundColor: obrigatorio ? '#EFF6FF' : 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 16 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View accessibilityLabel="entrar na conta" style={{ backgroundColor: '#fff', borderRadius: 22, padding: 18, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
            {obrigatorio ? <Text style={{ fontSize: 46, textAlign: 'center' }}>💙</Text> : null}
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>{modo === 'entrar' ? '🔐 Entrar na conta' : '✨ Criar conta'}</Text>
            {motivo ? <Text style={{ marginTop: 6, fontSize: 14, color: '#475569' }}>{motivo}</Text> : null}
            {temGoogleNativo() ? (
              <Pressable disabled={ocupado} onPress={() => rodar(() => entrarGoogle())} accessibilityRole="button" style={{ ...bt('#fff'), borderWidth: 1.5, borderColor: '#CBD5E1' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>G  Entrar com Google</Text>
              </Pressable>
            ) : null}
            <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" accessibilityLabel="e-mail" style={campo} />
            <TextInput value={senha} onChangeText={setSenha} placeholder="Senha" secureTextEntry accessibilityLabel="senha" style={campo} />
            {msg ? <Text accessibilityLabel="mensagem da conta" style={{ marginTop: 8, color: msg.startsWith('✅') ? '#166534' : '#B91C1C', fontWeight: '700' }}>{msg}</Text> : null}
            <Pressable disabled={ocupado} onPress={() => rodar(() => (modo === 'entrar' ? entrarEmail(email, senha) : criarConta(email, senha)))} accessibilityRole="button" style={bt('#2563EB')}>
              {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</Text>}
            </Pressable>
            {modo === 'entrar' ? (
              <Pressable disabled={ocupado || !email.trim()} onPress={() => rodar(() => esqueciSenha(email), '✅ Enviamos um e-mail para você criar uma senha nova.')} style={{ marginTop: 10, alignItems: 'center' }}>
                <Text style={{ color: '#2563EB', fontWeight: '800' }}>Esqueci a senha</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMsg(''); }} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#334155', fontWeight: '800' }}>{modo === 'entrar' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}</Text>
            </Pressable>
            {obrigatorio ? null : <Pressable onPress={fechar} style={{ marginTop: 12, alignItems: 'center' }}><Text style={{ color: '#64748B', fontWeight: '700' }}>Agora não</Text></Pressable>}
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
