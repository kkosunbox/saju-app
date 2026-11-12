import React, { useEffect, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import SolidIcon from '../../components/SolidIcon';
import PressableScale from '../../components/PressableScale';
import { Coin, Hero, SubHead } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { CROWN, SUB_BG, SubscriptionBadge } from '../../components/premium/SubscriptionBadge';
import { subscriptionLine } from './subscriptionText';
import { PACKS, SUBSCRIPTION, fmtN, fmtP } from '../../services/premium/catalog';
import { TransactionDirection, TransactionType, pointsApi, pointsKeys } from '../../services/server/pointsApi';
import { useApp } from '../../context/AppContext';
import { useStoreBilling } from '../../context/StoreBillingContext';
import { colors, gradients } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { useReducedMotion } from '../../utils/motion';

const TYPE_LABEL: Record<TransactionType, string> = { charge: '충전', grant: '적립', use: '사용', expire: '소멸', refund: '환불', revoke: '회수', adjust: '조정' };
/** 서버 시각(UTC) → 한국 날짜 */
const kstDate = (iso: string) => new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10);
/** 보너스 · 무료 칩 글자색 (디자인의 #00A3FF) */
const SKY = '#00A3FF';
/** 이용내역 한 번에 불러오는 개수 */
const PAGE = 20;
/** 이용내역에서 빠져나간 알 숫자 색 */
const MINUS = '#F47A7A';
/** 이용내역 필터 — 사용은 나간 알, 적립은 들어온 알 (서버가 거른다) */
const FILTERS = [[undefined, '전체'], ['out', '사용'], ['in', '적립']] as const satisfies readonly (readonly [TransactionDirection | undefined, string])[];

/** 흰 칸 안의 알 아이콘 — 충전 상품 행 */
function CoinBox() {
  return <View style={s.coinBox}><Coin size={13} /></View>;
}

/** 남색 알약 — [부호] 알 아이콘 숫자 */
function CoinPill({ label, sign, color = colors.white }: { label: string; sign?: string; color?: string }) {
  return (
    <View style={s.coinPill}>
      {sign ? <Text style={[s.coinPillText, { color }]}>{sign}</Text> : null}
      <Coin size={14} />
      <Text style={[s.coinPillText, { color }]}>{label}</Text>
    </View>
  );
}

/** 인기 상품 테두리 — 디자인의 하늘색 그라디언트에서 연한 부분이 테두리를 따라 천천히 흘러가고, 바깥이 은은하게 빛난다 */
function PopularBorder({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const [flow] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const a = Animated.parallel([
      // 웹에서는 timing 하나만 되풀이하면 첫 바퀴 끝에서 멈춰서, 처음으로 되돌리는 단계를 직접 둔다
      Animated.loop(Animated.sequence([
        Animated.timing(flow, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flow, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ]);
    a.start();
    return () => a.stop();
  }, [reduced, flow, glow]);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Animated.View pointerEvents="none" style={[s.glow, { opacity: reduced ? 0.6 : glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }]} />
      <View style={s.popular}>
        {w && !reduced ? (
          // 같은 무늬를 두 번 이어 붙인 띠를 한 무늬 길이만큼 옮기며 되풀이한다 (기울여서 대각선 결을 살린다)
          <Animated.View pointerEvents="none" style={[s.flow, { width: (w + FLOW_PAD * 2) * 2, transform: [{ translateX: flow.interpolate({ inputRange: [0, 1], outputRange: [0, -(w + FLOW_PAD * 2)] }) }, { skewX: '-30deg' }] }]}>
            <LinearGradient colors={FLOW_COLORS} locations={FLOW_LOCS} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : (
          <LinearGradient colors={gradients.border} locations={[0, 0.47, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <View style={[s.pack, { height: 45, borderRadius: radius.sm - 1.5 }]}>{children}</View>
      </View>
    </View>
  );
}
/** 테두리 그라디언트(진한 하늘 → 연한 하늘 → 하늘) 한 무늬를 두 번 — 끝과 처음이 같은 색이라 이음매 없이 돈다 */
const [B1, LT, B2] = gradients.border;
const FLOW_COLORS = [B1, LT, B2, B1, LT, B2, B1] as const;
const FLOW_LOCS = [0, 0.235, 0.42, 0.5, 0.735, 0.92, 1] as const;
const FLOW_PAD = 30;

export default function WalletScreen() {
  const { account } = useApp();
  const billing = useStoreBilling();
  const { points, expiringSoon, attendedToday: att, attendanceReward: reward, attendanceDoubled: doubled, ownedCount, attend, openCharge, subscription } = usePremium();
  const [filter, setFilter] = useState<TransactionDirection>();
  const q = useInfiniteQuery({
    queryKey: [...pointsKeys.transactions, account?.id, filter],
    queryFn: ({ pageParam }) => pointsApi.transactions(PAGE, pageParam, filter),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.length < PAGE ? undefined : last[last.length - 1].id),
    enabled: !!account,
    // 필터를 바꾸는 동안 빈 목록 대신 직전 목록을 보여 준다
    placeholderData: keepPreviousData,
  });
  const history = q.data?.pages.flat() ?? [];
  return (
    <Screen title="내 알" back>
      <Hero style={{ marginTop: 4, padding: 16 }}>
        <Text style={s.heroSub}>보유 알</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Coin size={34} />
          <Text style={s.heroAmount}>{points.toLocaleString('ko-KR')}</Text>
        </View>
        <Text style={[s.heroSub, { marginTop: 4 }]}>보유 콘텐츠 {ownedCount}개</Text>
        {expiringSoon > 0 ? <Text style={s.heroSub}>30일 안에 사라지는 알 {fmtP(expiringSoon)}</Text> : null}
      </Hero>

      <Card onPress={att ? undefined : attend} style={[s.attend, att && { opacity: 0.6 }]} accessibilityLabel="출석 체크">
        <View style={s.attendIcon}><SolidIcon name="calendar" size={16} color={colors.accent} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.attendTitle}>출석 체크</Text>
            {doubled ? <SubscriptionBadge label="구독 2배" small /> : null}
          </View>
          {/* 받기 전에는 메인 알약의 금색 +10 칸과 같은 색으로 보상을 칠해, 그걸 누르고 온 자리임을 알아보게 */}
          <Text style={s.attendSub}>{att ? '오늘은 이미 받았어요. 내일 또 만나요' : <>매일 방문하고 <Text style={s.attendGold}>+{reward}알</Text>을 받으세요!</>}</Text>
        </View>
        {att ? <View style={s.coinPill}><Text style={s.coinPillText}>완료</Text></View> : <CoinPill label={`${reward} 받기`} />}
      </Card>

      <SubHead title="정기 구독" />
      {subscription ? (
        // 구독 중: 상태와 이번 회차 운알톡 남은 횟수를 보여 주고 구독 관리로
        <Card onPress={() => router.push('/subscription')} style={s.sub} accessibilityLabel={`${SUBSCRIPTION.name} 구독 관리`}>
          <View style={s.crown}><SolidIcon name="crown" size={16} color={CROWN} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.attendTitle, { lineHeight: 16 }]}>{SUBSCRIPTION.name}</Text>
            <Text style={s.subBenefit}>{subscriptionLine(subscription)}</Text>
            {subscription.benefits.active ? <Text style={s.subBenefit}>운알톡 {subscription.benefits.consultLeft}/{subscription.benefits.consultTotal}회 남음</Text> : null}
          </View>
          <Text style={s.won}>구독 관리</Text>
          <View style={s.subChevron}><Icon name="chevronRight" size={20} color={colors.inkMute} strokeWidth={2} /></View>
        </Card>
      ) : (
        <Card onPress={() => router.push('/subscribe')} style={s.sub} accessibilityLabel={`${SUBSCRIPTION.name} 월 ${SUBSCRIPTION.won}원`}>
          <View style={s.crown}><SolidIcon name="crown" size={16} color={CROWN} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.attendTitle, { lineHeight: 16 }]}>{SUBSCRIPTION.name}</Text>
            {/* 혜택 한 줄을 괄호 앞에서 끊어 두 줄로 */}
            <Text style={s.subBenefit}>{SUBSCRIPTION.benefits[0].replace(' (', '\n(')}</Text>
          </View>
          <Text style={s.won}>월 {SUBSCRIPTION.won.toLocaleString('ko-KR')}원</Text>
          <View style={s.subChevron}><Icon name="chevronRight" size={20} color={colors.inkMute} strokeWidth={2} /></View>
        </Card>
      )}

      <SubHead title="알 충전하기" />
      <View style={{ gap: 12 }}>
        {PACKS.map(([w, p, b, productId], i) => {
          const price = Platform.OS === 'web' ? `${w.toLocaleString('ko-KR')}원` : billing.products[productId]?.displayPrice ?? '가격 확인';
          const row = (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CoinBox />
                <Text style={s.packCount}>{fmtN(p)}</Text>
                {b ? <View style={s.bonus}><Text style={s.chipText}>+{b} 보너스</Text></View> : null}
              </View>
              <Text style={s.won}>{price}</Text>
            </>
          );
          return (
            <PressableScale key={w} onPress={() => openCharge(i)} accessibilityLabel={`${fmtP(p + b)} ${price}`}>
              {i === 3 ? <PopularBorder>{row}</PopularBorder> : <View style={s.pack}>{row}</View>}
              {i === 3 ? <View style={s.bestTag}><Text style={s.bestText}>인기</Text></View> : null}
            </PressableScale>
          );
        })}
      </View>

      <SubHead title="이용내역" />
      <View style={s.filters}>
        {FILTERS.map(([k, l]) => {
          const on = k === filter;
          return (
            <PressableScale key={l} onPress={() => setFilter(k)} scaleTo={0.95} style={[s.filter, on && s.filterOn]} accessibilityLabel={`이용내역 ${l}`} accessibilityState={{ selected: on }}>
              <Text style={[s.filterText, on && { color: colors.white }]}>{l}</Text>
            </PressableScale>
          );
        })}
      </View>
      <View style={s.history}>
        {history.length ? history.map((h, i) => (
          <View key={h.id} style={[s.historyRow, i > 0 && s.line]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.historyLabel}>{h.label}</Text>
              <Text style={s.historyDate}>{kstDate(h.createdAt).replace(/-/g, '.')} · {TYPE_LABEL[h.type]}</Text>
            </View>
            <CoinPill label={fmtN(Math.abs(h.amount))} sign={h.amount > 0 ? '+' : '-'} color={h.amount > 0 ? colors.white : MINUS} />
          </View>
        )) : <Text style={[txt.body, { paddingVertical: 14 }]}>아직 이용 내역이 없어요.</Text>}
        {q.hasNextPage ? (
          <PressableScale onPress={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} style={[s.more, s.line]} accessibilityLabel="이용내역 더 보기">
            <Text style={s.moreText}>{q.isFetchingNextPage ? '불러오는 중…' : '더보기'}</Text>
            {q.isFetchingNextPage ? null : <Icon name="chevronDown" size={16} color={colors.inkMute} strokeWidth={1.5} />}
          </PressableScale>
        ) : null}
      </View>
      <Text style={s.notice}>충전한 알(보너스 포함)은 5년, 출석·공유 등으로 받은 알은 1년 동안 쓸 수 있어요. 받은 알부터 먼저 쓰여요. 충전 후 7일 안에 하나도 쓰지 않았다면 환불을 요청할 수 있어요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  heroSub: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: '#DDDDDD' },
  heroAmount: { ...sansW('800'), fontSize: 32, lineHeight: 38, letterSpacing: -1.28, color: colors.white },
  attend: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, minHeight: 64 },
  attendIcon: { width: 38, height: 38, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  attendTitle: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: colors.ink },
  attendSub: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  attendGold: { ...sansW('700'), color: colors.heroBg, backgroundColor: colors.moon },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12, paddingRight: 12, minHeight: 88, backgroundColor: SUB_BG },
  crown: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center' },
  subBenefit: { ...sansW('400'), fontSize: 12, lineHeight: 18, letterSpacing: -0.72, color: colors.ink },
  subChevron: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.heroBg },
  coinPillText: { ...sansW('700'), fontSize: 12, color: colors.white },
  coinBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: radius.sm },
  packCount: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: colors.ink },
  bonus: { backgroundColor: colors.surface, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs },
  chipText: { ...sansW('600'), fontSize: 12, color: SKY, opacity: 0.8 },
  won: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  popular: { borderRadius: radius.sm, padding: 1.5, overflow: 'hidden' },
  // 안드로이드는 elevation을 주면 형제(테두리·내용) 위로 올라와 흰 배경이 셀을 덮고 깜빡여서, shadow* 대신 boxShadow로 빛만 낸다
  glow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.sm, backgroundColor: colors.card, ...Platform.select({ android: { boxShadow: `0 0 10px ${colors.accent}8C` }, default: { shadowColor: colors.accent, shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } } }) },
  flow: { position: 'absolute', top: 0, bottom: 0, left: -FLOW_PAD },
  bestTag: { position: 'absolute', top: -9, right: 24, backgroundColor: colors.accent, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs },
  bestText: { ...sansW('600'), fontSize: 12, color: colors.white },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filter: { height: 31, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.cream },
  filterOn: { backgroundColor: '#000000', borderColor: '#000000' },
  filterText: { ...sansW('500'), fontSize: 14, color: colors.ink },
  history: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.lg, paddingHorizontal: 15 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 8 },
  historyLabel: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  historyDate: { ...sansW('500'), fontSize: 10, lineHeight: 12, letterSpacing: -0.5, color: colors.inkMute },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  moreText: { ...sansW('500'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: colors.inkMute },
  notice: { ...txt.caption, letterSpacing: -0.48, color: '#838383', textAlign: 'center', marginTop: 16, paddingHorizontal: 22 },
  line: { borderTopWidth: 1, borderTopColor: colors.lineStrong },
});
