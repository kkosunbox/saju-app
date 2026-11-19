/**
 * 첫 24시간 화면 이동·행동 기록 — 화면을 열 때마다, 그리고 trackAction 으로 남긴 행동마다 서버에 보낸다.
 * 게스트(프로필을 넣어 게스트 계정이 생긴 뒤)도 보낸다. 입력한 글 같은 내용은 보내지 않는다.
 * 서버는 게스트가 된 뒤 24시간, 회원으로 가입한 뒤 24시간만 저장하고, 지나면 tracking: false 를 돌려준다.
 * 그러면 이번 실행 동안 그 계정으로는 더 보내지 않는다. 기록 실패는 화면에 아무 영향을 주지 않는다.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { requestData } from '@/api/client';

const PLATFORM = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';

/** 기록을 그만 보내는 계정 (회원 id 또는 'guest', 이번 실행 동안) */
const finished = new Set<string>();
/** 지금 기록 중인 계정과 화면 — 계정이 없으면(프로필 입력 전) null */
let current: { key: string; path: string } | null = null;

function send(key: string, path: string, action?: string) {
  if (finished.has(key)) return;
  requestData<{ tracking: boolean }>('/v1/screen-views', { path, action, platform: PLATFORM })
    .then(({ tracking }) => { if (!tracking) finished.add(key); })
    .catch(() => {});
}

/**
 * 행동 하나를 지금 화면에서 한 것으로 남긴다 (예: 'consult_ask_login_required').
 * 이름은 영문 소문자·숫자·밑줄, 어드민 lib/format.ts 의 ACTION_TITLE 에 한글 이름을 같이 넣는다.
 */
export function trackAction(action: string) {
  if (current) send(current.key, current.path, action);
}

/** accountKey: 회원 id, 게스트면 'guest', 계정이 아직 없으면 undefined */
export function useFirstDayScreenViews(accountKey: string | undefined) {
  const pathname = usePathname().replace(/^\/(invite|p|r)\/[^/]+\/?$/, '/$1/[token]');
  const last = useRef<string | null>(null);
  useEffect(() => {
    current = accountKey ? { key: accountKey, path: pathname } : null;
    if (!accountKey) return;
    const key = `${accountKey}:${pathname}`;
    if (last.current === key) return;
    last.current = key;
    send(accountKey, pathname);
  }, [accountKey, pathname]);
}
