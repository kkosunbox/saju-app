/**
 * 링크 공유 · 친구 궁합 초대
 * - 웹: Web Share API(모바일 브라우저) → 없으면 클립보드 복사
 * - 네이티브: 시스템 공유 시트
 * 궁합 초대 링크에는 서버가 발급한 무작위 토큰만 담는다(/invite/{token}). 생년월일은 링크에 넣지 않는다.
 */
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, call } from '../../api/client';
import { Relationship } from '../../types';
import { RELATIONSHIP_INFO } from '../../data/relationships';

/** 앱(네이티브)에서 만든 링크가 여는 웹 주소 — 배포마다 EXPO_PUBLIC_WEB_URL (없으면 운영 웹) */
const APP_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://woonpick.com';
export const appUrl = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : APP_URL);

/** 공유 결과: 'shared' | 'copied' | 'cancelled' */
export async function shareLink(text: string, url = appUrl()): Promise<'shared' | 'copied' | 'cancelled'> {
  // 한 메시지로 보내야 공유받는 앱이 URL과 문구를 구분자 없이 붙이지 않는다.
  const message = `${url.trim()}\n\n${text.trim()}`;
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.share) {
      try { await nav.share({ text: message }); return 'shared'; } catch { return 'cancelled'; }
    }
    try { await nav?.clipboard?.writeText(message); return 'copied'; } catch { return 'cancelled'; }
  }
  const r = await Share.share({ message });
  return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

/* ---------- 친구 궁합 초대 ---------- */
const PENDING = 'onulna:invite';
const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));

/** 내 초대 링크 (서버 토큰, 30일 유효). 같은 관계의 살아 있는 링크가 있으면 그것을 쓴다. */
export async function createInviteUrl(relationship: Relationship): Promise<string> {
  const invite = await call<{ token: string }>(api.POST('/v1/compatibility-invites', { body: { relationship } }));
  return `${appUrl()}/invite/${invite.token}`;
}

/** 친구 궁합 초대를 공유한다. 링크를 못 만들면 'failed'. */
export async function shareInvite(nickname: string, relationship: Relationship): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const url = await createInviteUrl(relationship).catch(() => null);
  if (!url) return 'failed';
  return shareLink(`${nickname}님이 ${RELATIONSHIP_INFO[relationship].label} 궁합 초대를 보냈어요.\n내 생일만 넣으면 둘의 궁합이 바로 나와요.`, url);
}

/**
 * 초대 링크로 들어온 사람에게 보여 줄 대기 중인 초대 (초대한 사람 이름과 관계).
 * sharesProfile: 궁합을 보면 서로의 생년월일 등이 공개되는 링크 (false·없음은 공개 안내 전에 만든 비공개 링크)
 * auto: 프로필을 넣으러 갔다 — 홈에 오면 궁합 보기 안내를 바로 연다 (한 번만)
 */
export interface PendingInvite { token: string; inviterNickname: string; relationship?: Relationship; sharesProfile?: boolean; auto?: boolean }

export async function savePendingInvite(invite: PendingInvite) {
  await AsyncStorage.setItem(PENDING, JSON.stringify(invite));
}

/** 앱을 연 링크에 친구 결과(?r)가 있으면 저장해 두고 주소창에서는 지운다 (웹). 초대는 /invite/{token} 화면이 처리한다. */
export async function captureInvite() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const rc = new URLSearchParams(window.location.search).get('r');
  if (!rc) return;
  {
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
export const RESULT_ROUTES = ['MbtiMatch', 'Character', 'Talisman', 'PastLife', 'Spouse', 'Life', 'SajuDeep', 'NewYear', 'Monthly', 'Lucky', 'Theme', 'ThemeMoney', 'ThemeCareer', 'Home', 'Compatibility'];
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

export async function getPendingInvite(): Promise<PendingInvite | null> {
  try { return JSON.parse((await AsyncStorage.getItem(PENDING)) ?? 'null'); } catch { return null; }
}
export const clearPendingInvite = () => AsyncStorage.removeItem(PENDING);
