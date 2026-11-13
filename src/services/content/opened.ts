/**
 * 뽑았는지(열어 봤는지) — 결과를 들어가자마자 보여주지 않고, 한 번 뽑게 한 다음부터 바로 보여준다.
 * 오늘의 운세·타로·부적은 날마다 새로 뽑고, 사주로 정해지는 캐릭터·전생·찰떡 MBTI는 한 번만 뽑는다.
 * 뽑은 결과는 서버가 그때의 프로필로 고정한다. 프로필마다 첫 뽑기를 따로 기억한다.
 * 이 기기에만 저장한다 (기기를 바꾸면 한 번 더 뽑는 정도는 괜찮다). 오늘의 운세만은 서버도 뽑았는지 기억해서 다른 기기에서도 뽑은 상태로 보인다.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceKey } from '../storage/storageService';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { DEV_TOOLS } from '../../utils/devTools';

export type OpenKind = 'fortune' | 'tarot' | 'talisman' | 'mbti-match' | 'character' | 'past-life';
const DAILY: OpenKind[] = ['fortune', 'tarot', 'talisman'];

/** 프로필별 { 종류: 마지막으로 뽑은 도장(날짜, 한 번만 뽑는 것은 아무 값) } */
type Stamps = Partial<Record<OpenKind, string>>;
const mem = new Map<string, Stamps>();
const loading = new Map<string, Promise<Stamps>>();
const subs = new Set<() => void>();
const KEY = (uid: string) => deviceKey(`opened:${uid}`);

function load(uid: string, legacyUid?: string): Promise<Stamps> {
  const cached = mem.get(uid);
  if (cached) return Promise.resolve(cached);
  let pending = loading.get(uid);
  if (!pending) {
    pending = AsyncStorage.getItem(KEY(uid))
      // 예전 계정 단위 기록은 대표 프로필에만 이어 준다.
      .then(v => v ?? (legacyUid ? AsyncStorage.getItem(KEY(legacyUid)) : null))
      .then(v => (v ? (JSON.parse(v) as Stamps) : {}))
      .catch(() => ({}))
      .then(stamps => { mem.set(uid, stamps); loading.delete(uid); return stamps; });
    loading.set(uid, pending);
  }
  return pending;
}

function save(uid: string, kind: OpenKind, stamp: string | undefined) {
  const stamps = { ...mem.get(uid), [kind]: stamp };
  if (stamp === undefined) delete stamps[kind];
  mem.set(uid, stamps);
  AsyncStorage.setItem(KEY(uid), JSON.stringify(stamps)).catch(() => {});
  subs.forEach(f => f());
}

/**
 * ready: 저장된 값을 읽었는지 (읽기 전엔 봉인도 결과도 그리지 않는다 — 깜빡임 방지)
 * opened: 이미 뽑았는지 (운세·부적은 오늘 날짜로) · open(): 뽑았다고 기록 (홈 타일도 같이 바뀐다)
 * reset(): 다시 뽑기 전으로 (테스트용). 오늘의 운세는 서버 기록보다 우선하는 기기별 초기화 도장을 둔다.
 */
export function useOpened(kind: OpenKind) {
  const { user, profiles, today, fortune, fortuneError } = useApp();
  const scope = useContentScope();
  const profile = scope?.profile ?? user;
  const profileId = scope?.profileId ?? user?.profileId;
  // 오늘의 운세 · 타로는 대표 프로필의 하루 단위 콘텐츠다.
  const accountDaily = kind === 'fortune' || kind === 'tarot';
  const uid = user ? (accountDaily ? user.id : `${user.id}:p${profileId ?? 'primary'}`) : '';
  const isPrimary = profile?.isPrimary || profileId === profiles.find(p => p.isPrimary)?.profileId;
  const legacyUid = !accountDaily && isPrimary ? user?.id : undefined;
  const daily = DAILY.includes(kind);
  const stamp = daily ? today : `v${user?.version ?? 0}`;
  const [saved, setSaved] = useState(() => ({ uid, stamps: mem.get(uid) ?? null }));
  const stamps = saved.uid === uid ? saved.stamps : mem.get(uid) ?? null;

  useEffect(() => {
    if (!uid) return;
    let live = true;
    load(uid, legacyUid).then(stamps => live && setSaved({ uid, stamps }));
    const f = () => { if (live) setSaved({ uid, stamps: mem.get(uid) ?? null }); };
    subs.add(f);
    return () => { live = false; subs.delete(f); };
  }, [uid, legacyUid]);

  const open = useCallback(() => { if (uid) save(uid, kind, stamp); }, [uid, kind, stamp]);
  const reset = useCallback(() => {
    if (uid) save(uid, kind, kind === 'fortune' && DEV_TOOLS ? `reset:${stamp}` : undefined);
  }, [uid, kind, stamp]);
  const local = daily ? stamps?.[kind] === stamp : !!stamps?.[kind];
  if (kind !== 'fortune') return { ready: !!stamps, opened: local, open, reset };
  // 오늘의 운세는 서버도 뽑았는지 기억한다 (다른 기기에서 뽑았으면 여기서도 뽑은 것) — 운세가 오기 전엔 봉인을 그리지 않는다
  const server = !!fortune?.drawn && fortune.date === today;
  // 테스트 초기화는 이 기기·오늘에만 적용한다. 새로고침에도 유지되고, open()이 오늘 도장으로 덮어쓰면 해제된다.
  const resetToday = DEV_TOOLS && stamps?.fortune === `reset:${stamp}`;
  return { ready: !!stamps && (local || !!fortune || !!fortuneError), opened: !resetToday && (local || server), open, reset };
}

/**
 * 결과 화면(분야별·종합 풀이)에 다른 길(알림·링크)로 먼저 들어왔으면 그걸로 뽑은 셈.
 * 단, 들어온 날짜에만 — 화면을 띄워 둔 채 자정이 지나면 새 날 운세를 대신 뽑지 않고 sealed를 돌려준다 (홈에서 직접 뽑게).
 */
export function useMarkOpened(kind: OpenKind) {
  const { today } = useApp();
  const { ready, opened, open } = useOpened(kind);
  const [entered, setEntered] = useState<string | null>(null);
  if (entered === null && ready) setEntered(today);
  const stale = entered !== null && entered !== today;
  useEffect(() => { if (ready && !opened && !stale) open(); }, [ready, opened, stale, open]);
  return { sealed: ready && !opened && stale };
}

/**
 * 오늘의 운세 뽑기 상태 + 뽑았으면 AI 문장을 서버에 요청 (홈과 운세 결과 화면에서).
 * 뽑기 직후는 물론, 예전에 뽑았는데 문장이 아직이면(실패·다른 길로 들어옴) 앱을 열 때 다시 요청한다.
 * 뽑았다는 기록이 서버에 아직 없으면(예전에 이 기기에서만 뽑음) 그것도 같이 남긴다.
 */
export function useFortuneDraw() {
  const o = useOpened('fortune');
  const { fortune, drawFortune } = useApp();
  const pending = !!fortune?.textsPending || fortune?.drawn === false;
  useEffect(() => { if (o.opened && pending) drawFortune(); }, [o.opened, pending, drawFortune]);
  return o;
}

/** Fortune reveals include tarot, while a tarot-only reveal never opens or requests the fortune. */
export function useTarotDraw() {
  const tarot = useOpened('tarot');
  const fortune = useOpened('fortune');
  return {
    ...tarot,
    ready: tarot.ready && fortune.ready,
    opened: tarot.opened || fortune.opened,
  };
}
