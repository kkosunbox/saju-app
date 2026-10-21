/**
 * 뽑았는지(열어 봤는지) — 결과를 들어가자마자 보여주지 않고, 한 번 뽑게 한 다음부터 바로 보여준다.
 * 오늘의 운세·부적은 날마다 새로 뽑고, 사주로 정해지는 캐릭터·전생·찰떡 MBTI는 프로필이 바뀔 때만 다시 뽑는다.
 * 이 기기에만 저장한다 (기기를 바꾸면 한 번 더 뽑는 정도는 괜찮다).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceKey } from '../storage/storageService';
import { useApp } from '../../context/AppContext';

export type OpenKind = 'fortune' | 'talisman' | 'mbti-match' | 'character' | 'past-life';
const DAILY: OpenKind[] = ['fortune', 'talisman'];

/** 사용자별 { 종류: 마지막으로 뽑은 도장(날짜 또는 프로필 버전) } — 종류마다 한 칸이라 쌓이지 않는다 */
type Stamps = Partial<Record<OpenKind, string>>;
let mem: { uid: string; stamps: Stamps } | null = null;
let loading: Promise<Stamps> | null = null;
const subs = new Set<() => void>();
const KEY = (uid: string) => deviceKey(`opened:${uid}`);

function load(uid: string): Promise<Stamps> {
  if (mem?.uid === uid) return Promise.resolve(mem.stamps);
  if (!loading) {
    loading = AsyncStorage.getItem(KEY(uid))
      .then(v => (v ? (JSON.parse(v) as Stamps) : {}))
      .catch(() => ({}))
      .then(stamps => { mem = { uid, stamps }; loading = null; return stamps; });
  }
  return loading;
}

function save(uid: string, kind: OpenKind, stamp: string) {
  const stamps = { ...(mem?.uid === uid ? mem.stamps : {}), [kind]: stamp };
  mem = { uid, stamps };
  AsyncStorage.setItem(KEY(uid), JSON.stringify(stamps)).catch(() => {});
  subs.forEach(f => f());
}

/**
 * ready: 저장된 값을 읽었는지 (읽기 전엔 봉인도 결과도 그리지 않는다 — 깜빡임 방지)
 * opened: 이번 날짜·프로필로 이미 뽑았는지 · open(): 뽑았다고 기록 (홈 타일도 같이 바뀐다)
 */
export function useOpened(kind: OpenKind) {
  const { user, today } = useApp();
  const uid = user?.id ?? '';
  const stamp = DAILY.includes(kind) ? today : `v${user?.version ?? 0}`;
  const [stamps, setStamps] = useState<Stamps | null>(mem?.uid === uid ? mem.stamps : null);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    load(uid).then(s => live && setStamps(s));
    const f = () => { if (mem?.uid === uid) setStamps(mem.stamps); };
    subs.add(f);
    return () => { live = false; subs.delete(f); };
  }, [uid]);

  const open = useCallback(() => { if (uid) save(uid, kind, stamp); }, [uid, kind, stamp]);
  return { ready: !!stamps, opened: stamps?.[kind] === stamp, open };
}

/** 결과 화면에 다른 길(알림·링크·기간별 운세)로 먼저 들어왔으면 그걸로 뽑은 셈 */
export function useMarkOpened(kind: OpenKind) {
  const { ready, opened, open } = useOpened(kind);
  useEffect(() => { if (ready && !opened) open(); }, [ready, opened, open]);
}

/**
 * 오늘의 운세 뽑기 상태 + 뽑았으면 AI 문장을 서버에 요청 (홈과 운세 결과 화면에서).
 * 뽑기 직후는 물론, 예전에 뽑았는데 문장이 아직이면(실패·다른 길로 들어옴) 앱을 열 때 다시 요청한다.
 */
export function useFortuneDraw() {
  const o = useOpened('fortune');
  const { fortune, drawFortune } = useApp();
  const pending = !!fortune?.textsPending;
  useEffect(() => { if (o.opened && pending) drawFortune(); }, [o.opened, pending, drawFortune]);
  return o;
}
