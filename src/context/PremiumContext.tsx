/**
 * 포인트 · 열람권 · 출석 · 공유 보상 (서버) · 이달의 미션 체크(기기 저장).
 * 포인트와 열람권은 회원만 가진다. 게스트가 쓰려 하면 로그인으로 보낸다.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useApp } from './AppContext';
import { Item, PACKS, fmtP, packProductId, ro, titleOfKey } from '../services/premium/catalog';
import { Amount, Coin } from '../components/Amount';
import { pointsApi, pointsKeys } from '../services/server/pointsApi';
import { listReadings, readingsKey } from '../services/server/premiumApi';
import { ApiError } from '../api/client';
import { queryClient } from '../api/query';
import PrimaryButton from '../components/PrimaryButton';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

type Sheet = { type: 'unlock'; item: Item; onDone?(): void } | { type: 'charge'; i: number } | null;

interface PremiumState {
  ready: boolean;
  points: number;
  /** 30일 안에 만료되는 포인트 */
  expiringSoon: number;
  attendedToday: boolean;
  missions: Record<string, boolean>;
  owned(key: string): boolean;
  ownedCount: number;
  openUnlock(item: Item, onDone?: () => void): void;
  openCharge(i: number): void;
  attend(): Promise<void>;
  toggleMission(key: string): void;
  /** 공유 보상: 콘텐츠마다 하루 한 번, 하루 최대 3번 +10알 (서버가 판단) */
  rewardShare(key: string): Promise<void>;
  shareRewardsLeft: number;
  toast(msg: string): void;
  goWallet?: () => void;
  setGoWallet(fn: () => void): void;
  /** 아직 알려 주지 않은 가입 축하 알 (0이면 없음). 메인 화면이 한 번 보여 주고 지운다 */
  welcomeBonus: number;
  dismissWelcomeBonus(): void;
}

const Ctx = createContext<PremiumState | null>(null);
export const SHARE_P = 10;

const UNLOCK_ERROR: Record<string, string> = {
  INSUFFICIENT_POINTS: '알이 모자라요. 충전 후 다시 열어 주세요',
  CONTENT_NOT_FOR_SALE: '지금은 열 수 없는 콘텐츠예요',
};

/** 지갑·내역·열람권을 서버에서 다시 읽는다 */
export const refreshPoints = () => queryClient.invalidateQueries({ queryKey: ['points'] });

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { account } = useApp();
  const member = !!account;
  // 가입 축하 알은 지갑을 처음 만든 응답에만 실려 온다. 가입 직후엔 캐시를 비우고 다시 읽느라 그 응답이 화면까지 못 올 수 있어서,
  // 받는 즉시 기기에 적어 두고 메인이 보여 준 뒤 지운다
  const welcomeKey = account ? `onulna:welcomeBonus:${account.id}` : null;
  const [stored, setStored] = useState<{ key: string | null; value: number }>({ key: null, value: 0 });
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const wallet = useQuery({
    queryKey: [...pointsKeys.wallet, account?.id],
    queryFn: async () => {
      const w = await pointsApi.wallet();
      if (welcomeKey && w.signupBonus > 0) {
        setStored({ key: welcomeKey, value: w.signupBonus });
        AsyncStorage.setItem(welcomeKey, String(w.signupBonus)).catch(() => {});
      }
      return w;
    },
    enabled: member,
  });
  const unlocks = useQuery({ queryKey: [...pointsKeys.unlocks, account?.id], queryFn: pointsApi.unlocks, enabled: member });
  // AI 풀이는 서버가 백그라운드로 쓴다. 쓰는 중인 게 있으면 지켜보다가 다 쓰면 어디에 있든 알려 준다
  const readings = useQuery({
    queryKey: [...readingsKey, account?.id],
    queryFn: listReadings,
    enabled: member,
    refetchInterval: q => (q.state.data?.some(r => r.status === 'writing') ? 5000 : false),
  });
  const readingStatus = useRef<Map<string, string>>(new Map());
  const [missionState, setMissionState] = useState<{ key: string | null; value: Record<string, boolean> }>({ key: null, value: {} });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const goWalletRef = useRef<() => void>(undefined);

  // 이달의 미션 체크는 기기에만 저장한다 (계정별)
  const missionKey = account ? `onulna:missions:${account.id}` : null;
  const missions = missionState.key === missionKey ? missionState.value : {};

  useEffect(() => {
    if (!welcomeKey) return;
    AsyncStorage.getItem(welcomeKey)
      .then(v => { if (v) setStored(w => (w.key === welcomeKey ? w : { key: welcomeKey, value: Number(v) || 0 })); })
      .catch(() => {});
  }, [welcomeKey]);
  const welcomeBonus = welcomeKey && dismissedKey !== welcomeKey && stored.key === welcomeKey ? stored.value : 0;
  useEffect(() => {
    if (!missionKey) return;
    AsyncStorage.getItem(missionKey)
      .then(v => setMissionState({ key: missionKey, value: v ? JSON.parse(v) : {} }))
      .catch(() => setMissionState({ key: missionKey, value: {} }));
  }, [missionKey]);

  const ownedKeys = useMemo(() => new Set((unlocks.data ?? []).map(e => e.contentKey)), [unlocks.data]);
  const owned = useCallback((key: string) => ownedKeys.has(key), [ownedKeys]);
  const points = wallet.data?.balance ?? 0;

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  async function doUnlock(it: Item, onDone?: () => void) {
    if (busy) return;
    setBusy(true);
    try {
      await pointsApi.unlock(it.key);
      await refreshPoints();
      setSheet(null);
      toast(`${it.title}이(가) 열렸어요`);
      onDone?.();
    } catch (e) {
      toast((e instanceof ApiError && UNLOCK_ERROR[e.code]) || '열지 못했어요. 잠시 후 다시 시도해 주세요');
      refreshPoints();
    } finally {
      setBusy(false);
    }
  }

  /** 웹은 토스 결제창으로, 앱은 스토어 결제 준비 중 */
  function doCharge(i: number) {
    setSheet(null);
    router.push({ pathname: '/charge', params: { productId: packProductId(PACKS[i][0]) } });
  }

  /** 게스트가 포인트 기능을 쓰려 하면 로그인으로 보낸다. 로그인했으면 false */
  const requireLogin = (): boolean => {
    if (account) return false;
    toast('로그인하면 열어볼 수 있어요');
    router.push('/login');
    return true;
  };

  useEffect(() => {
    const prev = readingStatus.current;
    const next = new Map((readings.data ?? []).map(r => [r.contentKey, r.status] as [string, string]));
    next.forEach((status, key) => {
      if (prev.get(key) === 'writing' && status === 'done') {
        toast(`${titleOfKey(key)} 풀이가 완성됐어요`);
        queryClient.invalidateQueries({ queryKey: ['premium', key] });
      }
    });
    readingStatus.current = next;
  }, [readings.data, toast]);

  const value: PremiumState = {
    ready: !member || (wallet.isFetched && unlocks.isFetched),
    points, missions, owned,
    expiringSoon: wallet.data?.expiringSoon ?? 0,
    attendedToday: !!wallet.data?.attendedToday,
    ownedCount: [...ownedKeys].filter(k => !k.startsWith('bundle:')).length,
    openUnlock: (item, onDone) => {
      if (requireLogin()) return;
      if (owned(item.key)) { onDone?.(); return; }
      setSheet({ type: 'unlock', item, onDone });
    },
    openCharge: i => { if (!requireLogin()) setSheet({ type: 'charge', i }); },
    attend: async () => {
      if (requireLogin() || wallet.data?.attendedToday) return;
      try {
        await pointsApi.attend();
        toast('출석 체크 +10알');
      } catch (e) {
        if (!(e instanceof ApiError && e.code === 'ALREADY_CHECKED_IN')) toast('출석 체크를 하지 못했어요. 잠시 후 다시 시도해 주세요');
      }
      refreshPoints();
    },
    toggleMission: key => {
      const next = { ...missions, [key]: !missions[key] };
      setMissionState({ key: missionKey, value: next });
      if (missionKey) AsyncStorage.setItem(missionKey, JSON.stringify(next)).catch(() => {});
    },
    rewardShare: async key => {
      if (!account) return;
      try {
        const r = await pointsApi.rewardShare(`share:${key}`);
        if (r.granted) {
          refreshPoints();
          setTimeout(() => toast(`공유 고마워요! +${SHARE_P}알`), 400);
        }
      } catch {
        // 보상을 못 받아도 공유는 이미 끝났다
      }
    },
    shareRewardsLeft: member ? wallet.data?.shareRewardsLeft ?? 0 : 0,
    toast,
    goWallet: () => goWalletRef.current?.(),
    setGoWallet: fn => { goWalletRef.current = fn; },
    welcomeBonus,
    dismissWelcomeBonus: () => {
      setDismissedKey(welcomeKey);
      if (welcomeKey) AsyncStorage.removeItem(welcomeKey).catch(() => {});
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <BottomSheet visible={!!sheet} onClose={() => setSheet(null)}>
        {sheet?.type === 'unlock' ? (
          <UnlockSheet item={sheet.item} points={points} busy={busy} onConfirm={() => doUnlock(sheet.item, sheet.onDone)} onClose={() => setSheet(null)} onWallet={() => { setSheet(null); goWalletRef.current?.(); }} />
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
/** value 가 숫자면 [마스코트]숫자로 보여 준다 (sign: '−' 등) */
function SumRow({ label, value, color, sign }: { label: string; value: string | number; color?: string; sign?: string }) {
  return (
    <View style={s.sumRow}>
      <Text style={txt.small}>{label}</Text>
      {typeof value === 'number'
        ? <Amount value={value} sign={sign} size={15} style={[s.sumVal, color ? { color } : null]} />
        : <Text style={[s.sumVal, color ? { color } : null]}>{value}</Text>}
    </View>
  );
}

function UnlockSheet({ item: it, points, busy, onConfirm, onClose, onWallet }: { item: Item; points: number; busy: boolean; onConfirm(): void; onClose(): void; onWallet(): void }) {
  const enough = points >= it.cost;
  return (
    <View>
      <Text style={[txt.caption, s.center]}>알 사용</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{it.title}</Text>
      <Text style={[txt.small, s.center, { marginTop: 2 }]}>{it.desc}</Text>
      <View style={s.sumBox}>
        <SumRow label="보유 알" value={points} />
        <SumRow label="사용할 알" value={it.cost} sign="−" color={colors.love} />
        <View style={s.hr} />
        <SumRow label={enough ? '사용 후 잔액' : '부족한 알'} value={enough ? points - it.cost : it.cost - points} color={enough ? colors.purple : colors.danger} />
      </View>
      <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>{it.scope}</Text>
      {enough
        ? <PrimaryButton label={busy ? '여는 중…' : `${it.cost}${ro(it.cost)} 열기`} icon={busy ? undefined : <Coin size={18} />} onPress={onConfirm} disabled={busy} />
        : <PrimaryButton label="알 충전하러 가기" onPress={onWallet} />}
      <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
    </View>
  );
}

function ChargeSheet({ i, points, onConfirm, onClose }: { i: number; points: number; onConfirm(): void; onClose(): void }) {
  const [w, p, b] = PACKS[i];
  return (
    <View>
      <Text style={[txt.caption, s.center]}>알 충전</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{fmtP(p + b)} 충전</Text>
      {b ? <Text style={[txt.small, s.center, { marginTop: 2 }]}>기본 {fmtP(p)} + 보너스 {fmtP(b)}</Text> : null}
      <View style={s.sumBox}>
        <SumRow label="결제 금액" value={w.toLocaleString('ko-KR') + '원'} />
        <SumRow label="충전 후 잔액" value={points + p + b} color={colors.purple} />
      </View>
      {Platform.OS === 'web' ? (
        <>
          <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>토스페이먼츠 결제창으로 이동해요</Text>
          <PrimaryButton label={`${w.toLocaleString('ko-KR')}원 결제하기`} onPress={onConfirm} />
        </>
      ) : (
        <>
          <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>앱 결제는 준비 중이에요. 지금은 웹에서 충전할 수 있어요</Text>
          <PrimaryButton label="준비 중" onPress={() => {}} disabled />
        </>
      )}
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
