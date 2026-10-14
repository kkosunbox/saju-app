/**
 * 링크 공유 · 친구 궁합 초대
 * - 웹: Web Share API(모바일 브라우저) → 없으면 클립보드 복사
 * - 네이티브: 시스템 공유 시트
 * 초대 링크에는 궁합 계산에 필요한 최소 정보만 담는다(이름·생년월일·성별·MBTI·혈액형).
 */
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PartnerInput, User } from '../../types';

const APP_URL = 'https://onulna-prototype.vercel.app';
export const appUrl = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : APP_URL);

/** 공유 결과: 'shared' | 'copied' | 'cancelled' */
export async function shareLink(text: string, url = appUrl()): Promise<'shared' | 'copied' | 'cancelled'> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.share) {
      try { await nav.share({ text, url }); return 'shared'; } catch { return 'cancelled'; }
    }
    try { await nav?.clipboard?.writeText(`${text}\n${url}`); return 'copied'; } catch { return 'cancelled'; }
  }
  const r = await Share.share({ message: `${text}\n${url}` });
  return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

/* ---------- 친구 궁합 초대 ---------- */
const PENDING = 'onulna:invite';
const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));

export function inviteUrl(u: User) {
  const code = enc({ n: u.nickname, b: u.birthDate, t: u.birthTime, g: u.gender, m: u.mbti, bl: u.bloodType });
  return `${appUrl()}/?invite=${encodeURIComponent(code)}`;
}

/** 앱을 연 링크에 초대(?invite) · 친구 결과(?r)가 있으면 저장해 두고 주소창에서는 지운다 (웹) */
export async function captureInvite() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const q = new URLSearchParams(window.location.search);
  const code = q.get('invite'), rc = q.get('r');
  if (!code && !rc) return;
  if (code) {
    try {
      const o = dec(code);
      const partner: PartnerInput = { nickname: String(o.n).slice(0, 12), birthDate: o.b, birthTime: o.t ?? null, gender: o.g, mbti: o.m, bloodType: o.bl };
      await AsyncStorage.setItem(PENDING, JSON.stringify(partner));
    } catch { /* 잘못된 링크는 무시 */ }
  }
  if (rc) {
    try {
      const o = dec(rc);
      if (RESULT_ROUTES.includes(o.c)) {
        const fr: FriendResult = { c: o.c, k: String(o.k ?? '').slice(0, 20), n: String(o.n).slice(0, 12), h: String(o.h).slice(0, 40) };
        await AsyncStorage.setItem(FRIEND, JSON.stringify(fr));
      }
    } catch { /* 잘못된 링크는 무시 */ }
  }
  window.history.replaceState(null, '', window.location.pathname);
}

/* ---------- 친구 결과 링크 (공유 → 비교 → 답장 공유) ---------- */
/** 결과 링크로 열 수 있는 화면 (그 외 값은 무시) */
export const RESULT_ROUTES = ['MbtiMatch', 'Character', 'Talisman', 'PastLife', 'Spouse', 'Consult', 'Life', 'SajuDeep', 'NewYear', 'Monthly', 'Lucky', 'Theme', 'Home', 'Compatibility'];
export interface FriendResult { c: string; k: string; n: string; h: string; seen?: boolean }
const FRIEND = 'onulna:friendResult';

/** 내 결과를 담은 링크 — c: 열 화면, k: 콘텐츠 이름, n: 보낸 사람, h: 결과 한 줄 */
export function resultUrl(r: FriendResult) {
  return `${appUrl()}/?r=${encodeURIComponent(enc({ c: r.c, k: r.k, n: r.n, h: r.h.slice(0, 40) }))}`;
}
export async function getFriendResult(): Promise<FriendResult | null> {
  try { return JSON.parse((await AsyncStorage.getItem(FRIEND)) ?? 'null'); } catch { return null; }
}
export const clearFriendResult = () => AsyncStorage.removeItem(FRIEND);
/** 홈 알림을 한 번 눌렀으면 다시 띄우지 않는다 (비교 카드는 닫을 때까지 유지) */
export async function markFriendSeen() {
  const f = await getFriendResult();
  if (f) await AsyncStorage.setItem(FRIEND, JSON.stringify({ ...f, seen: true }));
}

export async function getPendingInvite(): Promise<PartnerInput | null> {
  try { return JSON.parse((await AsyncStorage.getItem(PENDING)) ?? 'null'); } catch { return null; }
}
export const clearPendingInvite = () => AsyncStorage.removeItem(PENDING);
