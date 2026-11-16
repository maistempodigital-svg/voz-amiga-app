// VOZ AMIGA v14 — VOZES: as opções, a ordem de reserva e a voz por idade.
import { Idioma } from '../tipos';
import { IdadeVoz, MotorVoz } from './config';

export interface InfoMotor {
  id: MotorVoz;
  emoji: string;
  nome: Record<Idioma, string>;
  explica: Record<Idioma, string>;
  /** funciona sem internet */
  offline: boolean;
  /** já funciona nesta versão do app */
  pronto: boolean;
}

export const MOTORES: InfoMotor[] = [
  { id: 'sistema', emoji: '📱', offline: true, pronto: true,
    nome: { pt: 'Voz do celular (Google ou Samsung)', en: 'Phone voice (Google or Samsung)', es: 'Voz del celular (Google o Samsung)' },
    explica: { pt: 'É a voz que já vem no Android. Grátis. Funciona sem internet depois que você baixa o pacote de português (veja o passo a passo abaixo).', en: 'The voice that comes with Android. Free. Works offline after you download the English pack (see the steps below).', es: 'La voz que ya viene en Android. Gratis. Funciona sin internet después de descargar el paquete de español (mira los pasos abajo).' } },
  { id: 'gravada', emoji: '🎙️', offline: true, pronto: true,
    nome: { pt: 'Voz gravada por você', en: 'Voice recorded by you', es: 'Voz grabada por ti' },
    explica: { pt: 'Em Criar prancha › Áudio, grave a sua voz. Aquela prancha fala com a sua voz. As outras usam a próxima da lista.', en: 'In Create card › Audio, record your voice. That card speaks with your voice. The others use the next one on the list.', es: 'En Crear tarjeta › Audio, graba tu voz. Esa tarjeta habla con tu voz. Las demás usan la siguiente de la lista.' } },
  { id: 'piper', emoji: '📦', offline: true, pronto: false,
    nome: { pt: 'Vozes para baixar (Piper)', en: 'Downloadable voices (Piper)', es: 'Voces para descargar (Piper)' },
    explica: { pt: 'Vozes grátis e mais naturais (ex.: "Edresson", em português), que funcionam sem internet. Tamanho: cerca de 60 MB. Chega numa próxima atualização do app.', en: 'Free, more natural voices that work offline. Size: about 60 MB. Coming in a next app update.', es: 'Voces gratis y más naturales, sin internet. Tamaño: unos 60 MB. Llegan en una próxima actualización.' } },
  { id: 'mascote', emoji: '🗨️', offline: true, pronto: true,
    nome: { pt: 'Voz do mascote', en: 'Mascot voice', es: 'Voz de la mascota' },
    explica: { pt: 'Uma voz mais alegre (mais fina e um pouco mais rápida) para o mascote explicar o curso. Usa a voz do celular.', en: 'A cheerful voice (higher and a bit faster) for the mascot in the course. Uses the phone voice.', es: 'Una voz alegre (más aguda y un poco más rápida) para la mascota del curso. Usa la voz del celular.' } },
  { id: 'espeak', emoji: '🤖', offline: true, pronto: false,
    nome: { pt: 'Voz de reserva (eSpeak)', en: 'Backup voice (eSpeak)', es: 'Voz de reserva (eSpeak)' },
    explica: { pt: 'Voz robótica, bem pequena, que funciona em qualquer celular. Fica como última reserva. Chega numa próxima atualização.', en: 'A small robotic voice that works on any phone. Last backup. Coming in a next update.', es: 'Voz robótica, muy pequeña, funciona en cualquier celular. Última reserva. Llega en una próxima actualización.' } },
];

export const infoMotor = (id: MotorVoz) => MOTORES.find((m) => m.id === id)!;

/** Velocidade e tom por idade (1 = normal). */
export const PERFIL_IDADE: Record<IdadeVoz, { velocidade: number; tom: number; r: Record<Idioma, string> }> = {
  crianca: { velocidade: 0.95, tom: 1.25, r: { pt: 'Criança', en: 'Child', es: 'Niño' } },
  adolescente: { velocidade: 1, tom: 1.08, r: { pt: 'Adolescente', en: 'Teen', es: 'Adolescente' } },
  adulto: { velocidade: 1, tom: 1, r: { pt: 'Adulto', en: 'Adult', es: 'Adulto' } },
};
export const PERFIL_MASCOTE = { velocidade: 1.08, tom: 1.35 };

/** Velocidade e tom finais: perfil da idade × ajuste fino dos pais (limitados para não ficar estranho). */
export const parametrosVoz = (idade: IdadeVoz, velocidade: number, tom: number, mascote = false) => {
  const p = mascote ? PERFIL_MASCOTE : PERFIL_IDADE[idade] || PERFIL_IDADE.crianca;
  const lim = (v: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(v * 100) / 100));
  return { velocidade: lim(p.velocidade * (Number.isFinite(velocidade) ? velocidade : 1), 0.5, 1.6), tom: lim(p.tom * (Number.isFinite(tom) ? tom : 1), 0.5, 2) };
};

/**
 * Qual voz usar para uma prancha. Vai descendo a lista dos pais e pula o que não está disponível agora.
 * `disponivel` diz o que funciona neste aparelho (ex.: { sistema: true, piper: false }).
 */
export const escolherMotor = (ordem: MotorVoz[], disponivel: Partial<Record<MotorVoz, boolean>>, temGravacao: boolean, ignorar: MotorVoz[] = []): MotorVoz | undefined =>
  ordem.find((m) => !ignorar.includes(m) && m !== 'mascote' && (m === 'gravada' ? temGravacao && disponivel.gravada !== false : disponivel[m] === true));

/** Próxima voz depois de uma falha (para o aviso "a voz X falhou, usando Y"). */
export const proximoMotor = (ordem: MotorVoz[], disponivel: Partial<Record<MotorVoz, boolean>>, falhou: MotorVoz[], temGravacao: boolean) => escolherMotor(ordem, disponivel, temGravacao, falhou);

/** Passo a passo para baixar a voz em português no Android (Google e Samsung). */
export const GUIA_PACOTE_VOZ: Record<Idioma, { titulo: string; passos: string[] }[]> = {
  pt: [
    { titulo: 'Celular com Google (a maioria)', passos: ['Abra Configurações do celular.', 'Toque em Sistema › Idiomas e entrada (ou procure "Saída de conversão de texto em voz").', 'Escolha "Serviços de fala do Google" como mecanismo preferido.', 'Toque na engrenagem ⚙️ ao lado › Instalar dados de voz.', 'Escolha Português (Brasil) e toque em baixar ⬇️. Use o Wi-Fi.', 'Pronto! Volte ao Voz Amiga e toque em "Testar voz".'] },
    { titulo: 'Celular Samsung', passos: ['Abra Configurações › Gerenciamento geral.', 'Toque em "Conversão de texto em voz".', 'Escolha o mecanismo Samsung ou Google.', 'Toque na engrenagem ⚙️ › Instalar dados de voz › Português.', 'Volte ao Voz Amiga e toque em "Testar voz".'] },
  ],
  en: [
    { titulo: 'Phone with Google (most phones)', passos: ['Open the phone Settings.', 'Tap System › Languages & input (or search "Text-to-speech output").', 'Choose "Speech Services by Google" as the preferred engine.', 'Tap the gear ⚙️ › Install voice data.', 'Choose English and tap download ⬇️. Use Wi-Fi.', 'Done! Go back to Voz Amiga and tap "Test voice".'] },
    { titulo: 'Samsung phone', passos: ['Open Settings › General management.', 'Tap "Text-to-speech".', 'Choose the Samsung or Google engine.', 'Tap the gear ⚙️ › Install voice data › English.', 'Go back to Voz Amiga and tap "Test voice".'] },
  ],
  es: [
    { titulo: 'Celular con Google (la mayoría)', passos: ['Abre Ajustes del celular.', 'Toca Sistema › Idiomas e introducción (o busca "Salida de texto a voz").', 'Elige "Servicios de voz de Google" como motor preferido.', 'Toca el engranaje ⚙️ › Instalar datos de voz.', 'Elige Español y toca descargar ⬇️. Usa Wi-Fi.', '¡Listo! Vuelve a Voz Amiga y toca "Probar voz".'] },
    { titulo: 'Celular Samsung', passos: ['Abre Ajustes › Administración general.', 'Toca "Texto a voz".', 'Elige el motor Samsung o Google.', 'Toca el engranaje ⚙️ › Instalar datos de voz › Español.', 'Vuelve a Voz Amiga y toca "Probar voz".'] },
  ],
};

export const FRASE_TESTE: Record<Idioma, string> = { pt: 'Olá! Eu sou a Voz Amiga.', en: 'Hello! I am Voz Amiga.', es: '¡Hola! Soy Voz Amiga.' };
