/**
 * 포인트 · 열람권 · 출석 · 공유 보상 (서버) · 이달의 미션 체크(기기 저장).
 * 포인트와 열람권은 회원만 가진다. 게스트가 쓰려 하면 로그인으로 보낸다.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useApp } from './AppContext';
import { Item, PACKS, fmtP, ro } from '../services/premium/catalog';
import { announceReadingDone } from '../services/readingDone';
import Icon from '../components/Icon';
import { Amount, Coin } from '../components/Amount';
import { Entitlement, MySubscription, pointsApi, pointsKeys } from '../services/server/pointsApi';
import { SubscriptionBadge } from '../components/premium/SubscriptionBadge';
import { listReadings, readingsKey } from '../services/server/premiumReadings';
import { ApiError } from '../api/client';
import { queryClient } from '../api/query';
import PrimaryButton from '../components/PrimaryButton';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

type Sheet = { type: 'unlock'; item: Item; onDone?(): void; profileId?: number } | { type: 'charge'; i: number } | null;

interface PremiumState {
  ready: boolean;
  points: number;
  /** 30일 안에 만료되는 포인트 */
  expiringSoon: number;
  attendedToday: boolean;
  /** 오늘 출석 체크로 받는 알 (구독 중이면 2배) */
  attendanceReward: number;
  attendanceDoubled: boolean;
  /** 끝나지 않은 내 구독 (없으면 null, 결제 실패 재시도 중 포함) */
  subscription: MySubscription | null;
  /** 지금 구독 혜택을 받는 중 */
  subscribed: boolean;
  /** 구독 혜택으로 무료로 열 수 있는 콘텐츠 (이번 달 월별 상세운세, 이번 달 혜택을 아직 안 씀). profileId 없으면 대표 프로필 */
  subscriptionFree(key: string, profileId?: number): boolean;
  missions: Record<string, boolean>;
  /** 그 프로필(없으면 대표 프로필)의 지금 정보로 열려 있는지 */
  owned(key: string, profileId?: number): boolean;
  /** 그 프로필(없으면 대표 프로필)로 이 콘텐츠를 산 기록 — 지금 정보로 연 것과 고치기 전 정보로 본 것, 최근 순 */
  records(key: string, profileId?: number): Entitlement[];
  /** 모든 프로필의 열람권 (구매 기록) */
  entitlements: Entitlement[];
  ownedCount: number;
  /** profileId: 어느 프로필로 열지 (없으면 대표 프로필) */
  openUnlock(item: Item, onDone?: () => void, profileId?: number): void;
  openCharge(i: number): void;
  attend(): Promise<void>;
  toggleMission(key: string): void;
  /** 공유 보상: 하루 한 번 +10알 (서버가 판단). 링크를 복사만 한 경우는 요청하지 않는다 */
  rewardShare(key: string): Promise<void>;
  shareRewardsLeft: number;
  /** onPress가 있으면 눌러서 이동할 수 있는 토스트 (끝에 › 표시) */
  toast(msg: string, onPress?: () => void): void;
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
  READING_UNAVAILABLE: '지금은 AI 풀이를 쓸 수 없어 잠시 열 수 없어요. 알은 쓰이지 않았어요',
};

/** 지갑·내역·열람권을 서버에서 다시 읽는다 */
export const refreshPoints = () => queryClient.invalidateQueries({ queryKey: ['points'] });

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { account, user, profiles } = useApp();
  const primaryId = user?.profileId ?? null;
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
  const sub = useQuery({ queryKey: [...pointsKeys.subscription, account?.id], queryFn: pointsApi.mySubscription, enabled: member });
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
  const [toastMsg, setToastMsg] = useState<{ msg: string; onPress?: () => void } | null>(null);
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

  const entitlements = useMemo(() => unlocks.data ?? [], [unlocks.data]);
  /** 열람권의 프로필 (프로필이 여럿이 되기 전에 연 것은 대표 프로필) */
  const profileOf = useCallback((e: Entitlement) => e.profileId ?? primaryId, [primaryId]);
  /** 심층 궁합 · 속마음은 궁합 기록의 프로필로 정해져서 프로필을 고르지 않는다 */
  const byRecord = (key: string) => key.startsWith('compat:') || key.startsWith('crush:');
  const owned = useCallback(
    (key: string, profileId?: number) => {
      const pid = profileId ?? primaryId;
      return entitlements.some(e => e.contentKey === key && e.current && (byRecord(key) || profileOf(e) === pid));
    },
    [entitlements, profileOf, primaryId],
  );
  const records = useCallback(
    (key: string, profileId?: number) => {
      const pid = profileId ?? primaryId;
      return entitlements.filter(e => e.contentKey === key && (byRecord(key) || profileOf(e) === pid));
    },
    [entitlements, profileOf, primaryId],
  );
  const points = wallet.data?.balance ?? 0;
  const subscription = member ? sub.data ?? null : null;
  const subscribed = !!subscription?.benefits.active;
  const subscriptionFree = useCallback(
    (key: string, profileId?: number) =>
      subscribed && key === subscription?.benefits.monthlyContentKey && !subscription?.benefits.monthlyUsed && !owned(key, profileId),
    [subscribed, subscription, owned],
  );

  const toast = useCallback((msg: string, onPress?: () => void) => {
    setToastMsg({ msg, onPress });
    clearTimeout(toastTimer.current);
    // 누를 수 있는 토스트는 누를 틈을 조금 더 준다
    toastTimer.current = setTimeout(() => setToastMsg(null), onPress ? 4000 : 2200);
  }, []);

  async function doUnlock(it: Item, onDone?: () => void, profileId?: number) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await pointsApi.unlock(it.key, profileId);
      await refreshPoints();
      setSheet(null);
      toast(r.viaSubscription ? `구독 혜택으로 ${it.title}이(가) 무료로 열렸어요` : `${it.title}이(가) 열렸어요`);
      onDone?.();
    } catch (e) {
      toast((e instanceof ApiError && UNLOCK_ERROR[e.code]) || '열지 못했어요. 잠시 후 다시 시도해 주세요');
      refreshPoints();
    } finally {
      setBusy(false);
    }
  }

  /** 결제 화면은 플랫폼별로 웹 Toss / iOS App Store / Android Play를 사용한다. */
  function doCharge(i: number) {
    setSheet(null);
    router.push({ pathname: '/charge', params: { productId: PACKS[i][3] } });
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
        queryClient.invalidateQueries({ queryKey: ['premium', key] });
        // 그 화면을 보고 있으면 알리지 않고, 백그라운드였으면 푸시가 알렸다 (readingDone.ts)
        announceReadingDone(key, toast);
      }
    });
    readingStatus.current = next;
  }, [readings.data, toast]);

  /** 열 때 '누구 것으로 여는지' (프로필이 하나뿐이면 표시하지 않는다) */
  const whoOf = (profileId?: number): string | null => {
    if (profiles.length < 2) return null;
    const p = profiles.find(x => x.profileId === (profileId ?? primaryId));
    return p ? p.nickname : null;
  };

  const value: PremiumState = {
    ready: !member || (wallet.isFetched && unlocks.isFetched),
    points, missions, owned, records, entitlements,
    expiringSoon: wallet.data?.expiringSoon ?? 0,
    attendedToday: !!wallet.data?.attendedToday,
    attendanceReward: wallet.data?.attendanceReward ?? 10,
    attendanceDoubled: !!wallet.data?.attendanceDoubled,
    subscription,
    subscribed,
    subscriptionFree,
    // 모든 프로필에서 연 콘텐츠 (같은 콘텐츠를 다른 프로필 · 바뀐 정보로 다시 연 것도 따로 센다, 패키지 자체는 빼고)
    ownedCount: entitlements.filter(e => !e.contentKey.startsWith('bundle:')).length,
    openUnlock: (item, onDone, profileId) => {
      if (requireLogin()) return;
      if (owned(item.key, profileId)) { onDone?.(); return; }
      setSheet({ type: 'unlock', item, onDone, profileId });
    },
    openCharge: i => { if (!requireLogin()) setSheet({ type: 'charge', i }); },
    attend: async () => {
      if (requireLogin() || wallet.data?.attendedToday) return;
      try {
        const t = await pointsApi.attend();
        toast(t.amount > 10 ? `출석 체크 +${t.amount}알 · 구독 혜택 2배` : `출석 체크 +${t.amount}알`);
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
          <UnlockSheet item={sheet.item} points={points} free={subscriptionFree(sheet.item.key, sheet.profileId)} busy={busy} who={whoOf(sheet.profileId)} again={records(sheet.item.key, sheet.profileId).length > 0} onConfirm={() => doUnlock(sheet.item, sheet.onDone, sheet.profileId)} onClose={() => setSheet(null)} onWallet={() => { setSheet(null); goWalletRef.current?.(); }} />
        ) : sheet?.type === 'charge' ? (
          <ChargeSheet i={sheet.i} points={points} onConfirm={() => doCharge(sheet.i)} onClose={() => setSheet(null)} />
        ) : null}
      </BottomSheet>
      {toastMsg ? (
        <ToastLayer>
          <Toast msg={toastMsg.msg} onPress={toastMsg.onPress && (() => { const go = toastMsg.onPress!; setToastMsg(null); go(); })} />
        </ToastLayer>
      ) : null}
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

function UnlockSheet({ item: it, points, free, busy, who, again, onConfirm, onClose, onWallet }: { item: Item; points: number; free: boolean; busy: boolean; who: string | null; again: boolean; onConfirm(): void; onClose(): void; onWallet(): void }) {
  // 누구 것으로 여는지 · 바뀐 정보로 다시 여는지
  const whoLine = who ? <Text style={[txt.small, s.center, { marginTop: 6, color: colors.purple }]}>{again ? `${who}님의 바뀐 정보로 다시 열어요` : `${who}님 정보로 열어요`}</Text>
    : again ? <Text style={[txt.small, s.center, { marginTop: 6, color: colors.purple }]}>바뀐 정보로 다시 열어요 · 예전 풀이도 남아요</Text> : null;
  if (free) {
    // 구독 혜택: 알을 쓰지 않는다는 것과 그게 구독 덕분이라는 걸 함께 보여 준다
    return (
      <View>
        <SubscriptionBadge style={{ alignSelf: 'center' }} />
        <Text style={[txt.h2, s.center, { marginTop: 8 }]}>{it.title}</Text>
        <Text style={[txt.small, s.center, { marginTop: 2 }]}>{it.desc}</Text>
        {whoLine}
        <View style={s.sumBox}>
          <SumRow label="원래 가격" value={it.cost} />
          <SumRow label="구독 혜택" value="이번 달 무료" color={colors.purple} />
          <View style={s.hr} />
          <SumRow label="보유 알" value={`${fmtP(points)} 그대로`} />
        </View>
        <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>한 달에 한 번, 고른 프로필로 열려요 · 구독이 끝나도 계속 볼 수 있어요</Text>
        <PrimaryButton label={busy ? '여는 중…' : '구독 혜택으로 무료 열기'} onPress={onConfirm} disabled={busy} />
        <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
      </View>
    );
  }
  const enough = points >= it.cost;
  return (
    <View>
      <Text style={[txt.caption, s.center]}>알 사용</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{it.title}</Text>
      <Text style={[txt.small, s.center, { marginTop: 2 }]}>{it.desc}</Text>
      {whoLine}
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
  const price = Platform.OS === 'web' ? w.toLocaleString('ko-KR') + '원' : '스토어에서 확인';
  return (
    <View>
      <Text style={[txt.caption, s.center]}>알 충전</Text>
      <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{fmtP(p + b)} 충전</Text>
      {b ? <Text style={[txt.small, s.center, { marginTop: 2 }]}>기본 {fmtP(p)} + 보너스 {fmtP(b)}</Text> : null}
      <View style={s.sumBox}>
        <SumRow label="결제 금액" value={price} />
        <SumRow label="충전 후 잔액" value={points + p + b} color={colors.purple} />
      </View>
      {Platform.OS === 'web' ? (
        <>
          <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>토스페이먼츠 결제창으로 이동해요</Text>
          <PrimaryButton label={`${w.toLocaleString('ko-KR')}원 결제하기`} onPress={onConfirm} />
        </>
      ) : (
        <>
          <Text style={[txt.caption, s.center, { marginBottom: 14 }]}>{Platform.OS === 'ios' ? 'App Store' : 'Google Play'}에서 결제 금액을 확인하고 구매해요</Text>
          <PrimaryButton label="스토어 결제로 계속" onPress={onConfirm} />
        </>
      )}
      <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * iOS는 공유 화면처럼 네이티브 모달(page sheet)로 뜬 화면이 앱 루트 위를 덮어서, 루트에 그린 토스트가 모달 아래에 가려진다.
 * 모달보다 위 창(FullWindowOverlay)에 그린다 — 토스트 밖 빈 곳의 터치는 아래 화면으로 그대로 넘어간다.
 */
function ToastLayer({ children }: { children: React.ReactNode }) {
  return Platform.OS === 'ios' ? <FullWindowOverlay>{children}</FullWindowOverlay> : <>{children}</>;
}

/** 알림 토스트. onPress가 있으면 눌러서 이동할 수 있고, 끝에 › 를 붙여 누를 수 있다는 걸 보여 준다 */
function Toast({ msg, onPress }: { msg: string; onPress?: () => void }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }, [msg]);
  return (
    <Animated.View pointerEvents={onPress ? 'auto' : 'none'} style={[s.toast, onPress && s.toastPressable, { top: insets.top + 60, opacity: a }]} accessibilityLiveRegion="polite">
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => [s.toastRow, pressed && { opacity: 0.7 }]} hitSlop={8} accessibilityRole="button" accessibilityHint="눌러서 바로 확인해요">
          <Text style={s.toastText}>{msg}</Text>
          <Icon name="chevronRight" size={16} strokeWidth={2.4} color={colors.white} />
        </Pressable>
      ) : (
        <Text style={s.toastText} accessibilityRole="alert">{msg}</Text>
      )}
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
  // 누를 수 있는 토스트는 여백까지 누를 수 있게 안쪽(Pressable)에 여백을 둔다
  toastPressable: { paddingHorizontal: 0, paddingVertical: 0 },
  toastRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 18, paddingRight: 14, paddingVertical: 12 },
  toastText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
