/**
 * 오늘의 행동 "하면 좋은 것" 체크 — 오늘 해낸 행동을 기억해 둔다 (홈과 겹쳐 읽기 화면이 같은 값을 쓴다).
 * 날짜가 바뀌면 새로 시작하고, 이 기기에만 저장한다.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceKey } from '../storage/storageService';
import { useApp } from '../../context/AppContext';

/** 사용자별 { date: 체크한 날, done: 해낸 행동들 } — 하루치만 둔다 */
type Checks = { date: string; done: string[] };
let mem: { uid: string; checks: Checks } | null = null;
let loading: Promise<Checks> | null = null;
const subs = new Set<() => void>();
const KEY = (uid: string) => deviceKey(`actions:${uid}`);

function load(uid: string): Promise<Checks> {
  if (mem?.uid === uid) return Promise.resolve(mem.checks);
  if (!loading) {
    loading = AsyncStorage.getItem(KEY(uid))
      .then(v => (v ? (JSON.parse(v) as Checks) : { date: '', done: [] }))
      .catch(() => ({ date: '', done: [] }))
      .then(checks => { mem = { uid, checks }; loading = null; return checks; });
  }
  return loading;
}

function save(uid: string, checks: Checks) {
  mem = { uid, checks };
  AsyncStorage.setItem(KEY(uid), JSON.stringify(checks)).catch(() => {});
  subs.forEach(f => f());
}

/** done: 오늘 체크한 행동들 · toggle(item): 체크를 켜고 끈다 */
export function useActionChecks() {
  const { user, today } = useApp();
  const uid = user?.id ?? '';
  const [checks, setChecks] = useState<Checks | null>(mem?.uid === uid ? mem.checks : null);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    load(uid).then(c => live && setChecks(c));
    const f = () => { if (mem?.uid === uid) setChecks(mem.checks); };
    subs.add(f);
    return () => { live = false; subs.delete(f); };
  }, [uid]);

  const done = checks?.date === today ? checks.done : [];
  const toggle = useCallback((item: string) => {
    if (!uid) return;
    const cur = mem?.uid === uid && mem.checks.date === today ? mem.checks.done : [];
    save(uid, { date: today, done: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item] });
  }, [uid, today]);
  return { ready: !!checks, done, toggle };
}
