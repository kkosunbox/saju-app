/**
 * 포인트 · 열람 권한 · 이용 내역 · 출석 · 이달의 미션.
 * 결제는 미리보기용(실제 결제 없음). 저장은 AsyncStorage, 프로필 초기화 시 함께 지워진다.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from './AppContext';
import { scopedKey } from '../services/storage/storageService';
import { Item, fmtP } from '../services/premium/catalog';
import { PACKS } from '../services/premium/data';
import PrimaryButton from '../components/PrimaryButton';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

export interface HistoryEntry { t: '충전' | '사용' | '적립'; label: string; amt: number; date: string }
type Unlocks = Record<string, { at: string; until?: string | null }>;
type Sheet = { type: 'unlock'; item: Item; onDone?(): void } | { type: 'charge'; i: number } | null;

interface PremiumState {
  ready: boolean;
  points: number;
  history: HistoryEntry[];
  unlocks: Unlocks;
  attendedToday: boolean;
  missions: Record<string, boolean>;
  owned(key: string): boolean;
  ownedCount: number;
  openUnlock(item: Item, onDone?: () => void): void;
  openCharge(i: number): void;
  attend(): void;
  toggleMission(key: string): void;
  /** 공유 보상: 콘텐츠마다 하루 한 번, 하루 최대 3번 +10P. 받았으면 true */
  rewardShare(key: string): boolean;
  shareRewardsLeft: number;
  toast(msg: string): void;
  goWallet?: () => void;
  setGoWallet(fn: () => void): void;
}

/** 계정별 저장 키 */
const K = {
  get points() { return scopedKey('points'); }, get history() { return scopedKey('history'); }, get unlocks() { return scopedKey('unlocks'); },
  get attend() { return scopedKey('attend'); }, get missions() { return scopedKey('missions'); },
  get shareReward() { return scopedKey('shareReward'); },
};
const Ctx = createContext<PremiumState | null>(null);
export const SHARE_P = 10, SHARE_DAILY = 3;

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { account, user, today } = useApp();
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [unlocks, setUnlocks] = useState<Unlocks>({});
  const [lastAttend, setLastAttend] = useState<string | null>(null);
  const [missions, setMissions] = useState<Record<string, boolean>>({});
  const [shared, setShared] = useState<{ date: string; keys: string[] }>({ date: '', keys: [] });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const goWalletRef = useRef<() => void>(undefined);

  // 계정·프로필이 바뀌면(초기화 포함) 저장된 값을 다시 읽고, 처음이면 가입 축하 포인트를 준다.
  // 포인트·열람권은 회원만 가진다 (게스트는 0P, 열람 시 로그인 안내)
  useEffect(() => {
    (async () => {
      if (!account) {
        setPoints(0); setHistory([]); setUnlocks({}); setLastAttend(null); setMissions({});
        setReady(true);
        return;
      }
      const read = async <T,>(k: string): Promise<T | null> => { try { const v = await AsyncStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
      const [p, h, u, a, m] = await Promise.all([read<number>(K.points), read<HistoryEntry[]>(K.history), read<Unlocks>(K.unlocks), read<string>(K.attend), read<Record<string, boolean>>(K.missions)]);
      if (p === null) {
        const start = 100;
        const first: HistoryEntry[] = [{ t: '적립', label: '가입 축하 포인트', amt: start, date: today }];
        setPoints(start); setHistory(first); setUnlocks({}); setLastAttend(null);
        await persist({ points: start, history: first, unlocks: {}, attend: null });
      } else {
        setPoints(p); setHistory(h ?? []); setUnlocks(u ?? {}); setLastAttend(a);
      }
      setMissions(m ?? {});
      setShared((await read<{ date: string; keys: string[] }>(K.shareReward)) ?? { date: '', keys: [] });
      setReady(true);
    })();
  }, [account?.id, user?.id]);

  async function persist(v: { points: number; history: HistoryEntry[]; unlocks: Unlocks; attend: string | null }) {
    await AsyncStorage.multiSet([
      [K.points, JSON.stringify(v.points)], [K.history, JSON.stringify(v.history.slice(0, 50))],
      [K.unlocks, JSON.stringify(v.unlocks)], [K.attend, JSON.stringify(v.attend)],
    ]).catch(() => {});
  }

  // 마스터 계정은 모든 콘텐츠를 열람할 수 있다
  const owned = useCallback((key: string) => { const u = unlocks[key]; return !!u && (!u.until || u.until >= today); }, [unlocks, today]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  function apply(next: { points: number; history: HistoryEntry[]; unlocks?: Unlocks; attend?: string | null }) {
    const u = next.unlocks ?? unlocks, a = next.attend === undefined ? lastAttend : next.attend;
    setPoints(next.points); setHistory(next.history); setUnlocks(u); setLastAttend(a);
    persist({ points: next.points, history: next.history, unlocks: u, attend: a });
  }

  function doUnlock(it: Item, onDone?: () => void) {
    if (points < it.cost) return;
    const u = { ...unlocks };
    (it.includes ?? [it.key]).forEach(k => (u[k] = { at: today, until: it.until ?? null }));
    if (it.includes) u[it.key] = { at: today };
    apply({ points: points - it.cost, history: [{ t: '사용', label: it.title, amt: -it.cost, date: today }, ...history], unlocks: u });
    setSheet(null);
    toast(`${it.title}이(가) 열렸어요`);
    onDone?.();
  }

  function doCharge(i: number) {
    const [w, pt, b] = PACKS[i];
    apply({ points: points + pt + b, history: [{ t: '충전', label: `${w.toLocaleString('ko-KR')}원 충전${b ? ' (보너스 +' + b + ')' : ''}`, amt: pt + b, date: today }, ...history] });
    setSheet(null);
    toast(`${fmtP(pt + b)} 충전됐어요`);
  }

  /** 게스트가 포인트 기능을 쓰려 하면 로그인으로 보낸다. 로그인했으면 false */
  const requireLogin = (): boolean => {
    if (account) return false;
    toast('로그인하면 포인트로 열어볼 수 있어요');
    router.push('/login');
    return true;
  };

  const value: PremiumState = {
    ready, points, history, unlocks, missions, owned,
    attendedToday: lastAttend === today,
    ownedCount: Object.keys(unlocks).filter(k => owned(k) && !k.startsWith('bundle')).length,
    openUnlock: (item, onDone) => { if (!requireLogin()) setSheet({ type: 'unlock', item, onDone }); },
    openCharge: i => { if (!requireLogin()) setSheet({ type: 'charge', i }); },
    attend: () => {
      if (requireLogin() || lastAttend === today) return;
      apply({ points: points + 10, history: [{ t: '적립', label: '출석 체크', amt: 10, date: today }, ...history], attend: today });
      toast('출석 체크 +10P');
    },
    toggleMission: key => {
      const next = { ...missions, [key]: !missions[key] };
      setMissions(next);
      AsyncStorage.setItem(K.missions, JSON.stringify(next)).catch(() => {});
    },
    rewardShare: key => {
      if (!account) return false;
      const cur = shared.date === today ? shared : { date: today, keys: [] };
      if (cur.keys.includes(key) || cur.keys.length >= SHARE_DAILY) return false;
      const next = { date: today, keys: [...cur.keys, key] };
      setShared(next);
      AsyncStorage.setItem(K.shareReward, JSON.stringify(next)).catch(() => {});
      apply({ points: points + SHARE_P, history: [{ t: '적립', label: '공유 보상', amt: SHARE_P, date: today }, ...history] });
      setTimeout(() => toast(`공유 고마워요! +${SHARE_P}P`), 400);
      return true;
    },
    shareRewardsLeft: SHARE_DAILY - (shared.date === today ? shared.keys.length : 0),
    toast,
    goWallet: () => goWalletRef.current?.(),
    setGoWallet: fn => { goWalletRef.current = fn; },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <BottomSheet visible={!!sheet} onClose={() => setSheet(null)}>
        {sheet?.type === 'unlock' ? (
          <UnlockSheet item={sheet.item} points={points} onConfirm={() => doUnlock(sheet.item, sheet.onDone)} onClose={() => setSheet(null)} onWallet={() => { setSheet(null); goWalletRef.current?.(); }} />
        ) : sheet?.type === 'charge' ? (
          <ChargeSheet i={sheet.i} points={points} onConfirm={() => doCharge(sheet.i)} onClose={() => setSheet(null)} />
        ) : null}
      </BottomSheet>
      {toastMsg ? <Toast msg={toastMsg} /> : null}
    </Ctx.Provider>
  );
}

export function usePremium() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePremium must be used within PremiumProvider');
  return v;
}

/* ---------- 시트 내용 · 토스트 ---------- */
function SumRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.sumRow}>
      <Text style={txt.small}>{label}</Text>
      <Text style={[s.sumVal, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function UnlockSheet({ item: it, points, onConfirm, onClose, onWallet }: { item: Item; points: number; onConfirm(): void; onClose(): void; onWallet(): void }) {
  const enough = points >= it.cost;
  return (
    <View>
      <Text style={[txt.caption, s.center]}>포인트 사용</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{it.title}</Text>
      <Text style={[txt.small, s.center, { marginTop: 2 }]}>{it.desc}</Text>
      <View style={s.sumBox}>
        <SumRow label="보유 포인트" value={fmtP(points)} />
        <SumRow label="사용 포인트" value={'−' + fmtP(it.cost)} color={colors.love} />
        <View style={s.hr} />
        <SumRow label={enough ? '사용 후 잔액' : '부족한 포인트'} value={enough ? fmtP(points - it.cost) : fmtP(it.cost - points)} color={enough ? colors.purple : colors.danger} />
      </View>
      <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>{it.scope}</Text>
      {enough
        ? <PrimaryButton label={`${it.cost}P 사용하고 열기`} onPress={onConfirm} />
        : <PrimaryButton label="포인트 충전하러 가기" onPress={onWallet} />}
      <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
    </View>
  );
}

function ChargeSheet({ i, points, onConfirm, onClose }: { i: number; points: number; onConfirm(): void; onClose(): void }) {
  const [w, p, b] = PACKS[i];
  return (
    <View>
      <Text style={[txt.caption, s.center]}>포인트 충전</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{fmtP(p + b)} 충전</Text>
      {b ? <Text style={[txt.small, s.center, { marginTop: 2 }]}>기본 {fmtP(p)} + 보너스 {fmtP(b)}</Text> : null}
      <View style={s.sumBox}>
        <SumRow label="결제 금액" value={w.toLocaleString('ko-KR') + '원'} />
        <SumRow label="충전 후 잔액" value={fmtP(points + p + b)} color={colors.purple} />
      </View>
      <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>미리보기용 화면이라 실제 결제는 되지 않아요</Text>
      <PrimaryButton label={`${w.toLocaleString('ko-KR')}원 결제하기`} onPress={onConfirm} />
      <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
    </View>
  );
}

function Toast({ msg }: { msg: string }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }, [msg]);
  return (
    <Animated.View pointerEvents="none" style={[s.toast, { top: insets.top + 60, opacity: a }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Text style={s.toastText}>{msg}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { textAlign: 'center' },
  sumBox: { backgroundColor: colors.cream, borderRadius: radius.lg, padding: 16, marginTop: 18, marginBottom: 12, gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumVal: { fontSize: 15, fontWeight: '700', color: colors.ink },
  hr: { height: 1, backgroundColor: colors.lineStrong },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: colors.heroBg, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  toastText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
