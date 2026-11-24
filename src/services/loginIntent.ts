/**
 * 로그인하려던 이유 — 게스트가 막힌 순간 하려던 일을 기억했다가, 로그인 화면에 보여 주고 로그인한 뒤 이어서 한다.
 * - consult: 운알톡에 보내려던 질문. 로그인 뒤 상담 탭이 그 질문을 그대로 보낸다.
 * - unlock: 열어 보려던 콘텐츠 이름. 로그인 화면이 "로그인하면 바로 열어 볼 수 있어요"로 알려 준다.
 * 웹 소셜 로그인은 다른 사이트에 갔다 오며 페이지가 새로 뜨므로 sessionStorage(같은 탭)에도 둔다.
 * 30분이 지나면 잊는다 (나중에 다시 와서 엉뚱한 질문이 보내지지 않게).
 */
import { Platform } from 'react-native';
import { router } from 'expo-router';
import type { ConsultCat } from './content/consult';
import type { ChatSource } from './server/consultApi';

export type LoginIntent =
  | { kind: 'consult'; worry: string; topic?: ConsultCat; source?: ChatSource; at: number }
  | { kind: 'unlock'; title: string; returnTo?: string; at: number };

const KEY = 'onulna:login-intent';
const TTL_MS = 30 * 60 * 1000;
let mem: LoginIntent | null = null;

function session(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try { return window.sessionStorage; } catch { return null; }
}

type NewIntent =
  | { kind: 'consult'; worry: string; topic?: ConsultCat; source?: ChatSource }
  | { kind: 'unlock'; title: string; returnTo?: string };

export function setLoginIntent(intent: NewIntent) {
  mem = { ...intent, at: Date.now() } as LoginIntent;
  try { session()?.setItem(KEY, JSON.stringify(mem)); } catch { /* 저장 못 해도 이번 화면에서는 기억한다 */ }
}

export function peekLoginIntent(): LoginIntent | null {
  if (!mem) {
    try {
      const v = session()?.getItem(KEY);
      mem = v ? (JSON.parse(v) as LoginIntent) : null;
    } catch { mem = null; }
  }
  if (mem && Date.now() - mem.at > TTL_MS) clearLoginIntent();
  return mem;
}

export function clearLoginIntent() {
  mem = null;
  try { session()?.removeItem(KEY); } catch { /* 무시 */ }
}

/** 운알톡 질문을 꺼내고 지운다 (한 번만 이어서 보낸다) */
export function takeConsultIntent(): Extract<LoginIntent, { kind: 'consult' }> | null {
  const i = peekLoginIntent();
  if (i?.kind !== 'consult') return null;
  clearLoginIntent();
  return i;
}

/** 로그인한 뒤 갈 곳 — 질문이 있으면 상담 탭(거기서 바로 보낸다), 콘텐츠면 그 화면 */
export function loginIntentReturnTo(): string | undefined {
  const i = peekLoginIntent();
  if (i?.kind === 'consult') return '/consult';
  if (i?.kind === 'unlock') return i.returnTo;
  return undefined;
}

/** 막힌 순간 띄우는 가입 안내 시트(LoginPromptHost)에 넘기는 내용 */
export type LoginPrompt = { intent?: NewIntent; reason?: 'charge' | 'attend' };
let promptListener: ((p: LoginPrompt) => void) | null = null;

/** 가입 안내 시트가 앱에 붙어 있을 때 goLogin이 시트를 띄우게 한다. 해제 함수를 돌려준다 */
export function subscribeLoginPrompt(listener: (p: LoginPrompt) => void) {
  promptListener = listener;
  return () => { if (promptListener === listener) promptListener = null; };
}

/** 하려던 일을 기억하고 가입 안내 시트를 띄운다 (시트가 없으면 로그인 화면으로). reason은 시트 문구에만 쓴다 */
export function goLogin(intent?: NewIntent, reason?: LoginPrompt['reason']) {
  if (intent) setLoginIntent(intent);
  else clearLoginIntent();
  if (promptListener) promptListener({ intent, reason });
  else router.push('/login');
}
