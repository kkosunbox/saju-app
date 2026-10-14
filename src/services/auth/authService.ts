/**
 * 인증 서비스 (기획 공유용 로컬 구현)
 * - 계정·세션을 기기(AsyncStorage)에 저장한다. 서버가 생기면 AuthService 계약을 지키는
 *   구현체(Supabase Auth, 자체 API 등)로 교체하면 화면은 그대로 쓸 수 있다.
 * - 비밀번호는 원문을 저장하지 않고 해시만 저장한다(프로토타입 수준의 해시 — 실서비스는 서버에서 처리).
 * - 비밀번호 재설정 인증번호와 카카오·네이버 로그인은 데모로 동작한다.
 * - BE 연동 단계에서 saju-be-monorepo의 /auth (게스트·소셜·Apple) 로 교체한다. 프로토타입의 마스터 계정은 넣지 않는다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashString } from '../../utils/seed';

export type AuthProviderKind = 'email' | SocialProvider;
export type SocialProvider = 'kakao' | 'naver' | 'apple' | 'google';
export const SOCIAL_LABEL: Record<SocialProvider, string> = { kakao: '카카오', naver: '네이버', apple: 'Apple', google: 'Google' };

export interface Account {
  id: string;
  provider: AuthProviderKind;
  email: string | null;
  name: string | null;
  marketing: boolean;
  createdAt: string;
}

interface StoredAccount extends Account { pwHash?: string }

export class AuthError extends Error {
  constructor(public code: 'email_taken' | 'invalid_credentials' | 'not_found' | 'social_account' | 'invalid_code' | 'expired_code', message: string) {
    super(message);
  }
}

export interface SignUpInput { email: string; password: string; marketing: boolean }

export interface AuthService {
  currentAccount(): Promise<Account | null>;
  signUp(input: SignUpInput): Promise<Account>;
  signIn(email: string, password: string): Promise<Account>;
  signInWithProvider(provider: SocialProvider, profile: { name: string; email: string | null }): Promise<Account>;
  /** 재설정 인증번호 발송. 데모에서는 화면에 보여줄 인증번호를 돌려준다 */
  requestPasswordReset(email: string): Promise<{ demoCode: string }>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(id: string): Promise<void>;
}

const K = { accounts: 'onulna:auth:accounts', session: 'onulna:auth:session', reset: 'onulna:auth:reset' };

const RESET_TTL_MS = 10 * 60 * 1000;

const normEmail = (e: string) => e.trim().toLowerCase();
const pwHash = (email: string, pw: string) => 'h1:' + hashString(`onulna|${normEmail(email)}|${pw}`).toString(36) + hashString(`${pw}|${email.length}|salt`).toString(36);
const strip = ({ pwHash: _, ...a }: StoredAccount): Account => a;

async function readAccounts(): Promise<StoredAccount[]> {
  try { return JSON.parse((await AsyncStorage.getItem(K.accounts)) ?? '[]'); } catch { return []; }
}
const writeAccounts = (list: StoredAccount[]) => AsyncStorage.setItem(K.accounts, JSON.stringify(list));
const startSession = (id: string) => AsyncStorage.setItem(K.session, id);

export const localAuth: AuthService = {
  async currentAccount() {
    const id = await AsyncStorage.getItem(K.session);
    if (!id) return null;
    const a = (await readAccounts()).find(x => x.id === id);
    return a ? strip(a) : null;
  },

  async signUp({ email, password, marketing }) {
    const list = await readAccounts();
    const e = normEmail(email);
    if (list.some(a => a.provider === 'email' && a.email === e)) throw new AuthError('email_taken', '이미 가입된 이메일이에요.');
    const acc: StoredAccount = { id: 'acc-' + Date.now().toString(36), provider: 'email', email: e, name: null, marketing, createdAt: new Date().toISOString(), pwHash: pwHash(e, password) };
    await writeAccounts([...list, acc]);
    await startSession(acc.id);
    return strip(acc);
  },

  async signIn(email, password) {
    const e = normEmail(email);
    const a = (await readAccounts()).find(x => x.provider === 'email' && x.email === e);
    if (!a || a.pwHash !== pwHash(e, password)) throw new AuthError('invalid_credentials', '이메일 또는 비밀번호가 맞지 않아요.');
    await startSession(a.id);
    return strip(a);
  },

  async signInWithProvider(provider, profile) {
    const list = await readAccounts();
    // 데모: 기기마다 같은 소셜 계정으로 다시 로그인되도록 제공자별 하나의 계정을 쓴다
    let a = list.find(x => x.provider === provider);
    if (!a) {
      a = { id: `acc-${provider}-` + Date.now().toString(36), provider, email: profile.email, name: profile.name, marketing: false, createdAt: new Date().toISOString() };
      await writeAccounts([...list, a]);
    }
    await startSession(a.id);
    return strip(a);
  },

  async requestPasswordReset(email) {
    const e = normEmail(email);
    const a = (await readAccounts()).find(x => x.email === e);
    if (!a) throw new AuthError('not_found', '가입된 이메일을 찾지 못했어요.');
    if (a.provider !== 'email') throw new AuthError('social_account', `${SOCIAL_LABEL[a.provider as SocialProvider]} 로그인으로 가입한 계정이에요. 소셜 로그인을 이용해 주세요.`);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await AsyncStorage.setItem(K.reset, JSON.stringify({ email: e, code, exp: Date.now() + RESET_TTL_MS }));
    return { demoCode: code };
  },

  async resetPassword(email, code, newPassword) {
    const e = normEmail(email);
    let r: { email: string; code: string; exp: number } | null = null;
    try { r = JSON.parse((await AsyncStorage.getItem(K.reset)) ?? 'null'); } catch { r = null; }
    if (!r || r.email !== e || r.code !== code.trim()) throw new AuthError('invalid_code', '인증번호가 맞지 않아요.');
    if (Date.now() > r.exp) throw new AuthError('expired_code', '인증번호가 만료됐어요. 다시 받아 주세요.');
    const list = await readAccounts();
    await writeAccounts(list.map(a => (a.provider === 'email' && a.email === e ? { ...a, pwHash: pwHash(e, newPassword) } : a)));
    await AsyncStorage.removeItem(K.reset);
  },

  async signOut() { await AsyncStorage.removeItem(K.session); },

  async deleteAccount(id) {
    await writeAccounts((await readAccounts()).filter(a => a.id !== id));
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter(k => k.startsWith(`onulna:a:${id}:`)));
    await AsyncStorage.removeItem(K.session);
  },
};

export const authService: AuthService = localAuth;

/* ---------- 입력 검증 ---------- */
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
/** 8자 이상, 영문과 숫자를 모두 포함 */
export const isStrongPassword = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
export const providerLabel = (p: AuthProviderKind) => (p === 'email' ? '이메일' : SOCIAL_LABEL[p]);
