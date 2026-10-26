import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import { Coin, Hero, SubHead } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { PACKS, PRICE_TABLE, SUBSCRIPTION, fmtN, fmtP } from '../../services/premium/catalog';
import { PointTransaction, TransactionType, pointsApi, pointsKeys } from '../../services/server/pointsApi';
import { useApp } from '../../context/AppContext';
import { colors, gradients } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { useReducedMotion } from '../../utils/motion';

const TYPE_LABEL: Record<TransactionType, string> = { charge: '충전', grant: '적립', use: '사용', expire: '소멸', refund: '환불', revoke: '회수', adjust: '조정' };
/** 서버 시각(UTC) → 한국 날짜 */
const kstDate = (iso: string) => new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10);
/** 보너스 · 무료 칩 글자색 (디자인의 #00A3FF) */
const SKY = '#00A3FF';

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
  const { points, expiringSoon, attendedToday: att, ownedCount, attend, openCharge } = usePremium();
  const { data: history = [] } = useQuery<PointTransaction[]>({ queryKey: [...pointsKeys.transactions, account?.id], queryFn: () => pointsApi.transactions(20), enabled: !!account });
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
        <View style={s.attendIcon}><Icon name="calendar" size={20} color={colors.accent} strokeWidth={2} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.attendTitle}>출석 체크</Text>
          <Text style={s.attendSub}>{att ? '오늘은 이미 받았어요. 내일 또 만나요' : '매일 방문하고 10알을 받으세요!'}</Text>
        </View>
        {att ? <View style={s.coinPill}><Text style={s.coinPillText}>완료</Text></View> : <CoinPill label="10 받기" />}
      </Card>

      <SubHead title="정기 구독" />
      <Card onPress={() => router.push('/subscribe')} style={s.sub} accessibilityLabel={`${SUBSCRIPTION.name} 월 ${SUBSCRIPTION.won}원`}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.attendTitle}>{SUBSCRIPTION.name}</Text>
          <Text style={s.attendSub}>{SUBSCRIPTION.benefits[0]}</Text>
        </View>
        <Text style={s.won}>월 {SUBSCRIPTION.won.toLocaleString('ko-KR')}원</Text>
        <Icon name="chevronRight" size={16} color={colors.inkMute} strokeWidth={2} />
      </Card>

      <SubHead title="알 충전하기" />
      <View style={{ gap: 12 }}>
        {PACKS.map(([w, p, b], i) => {
          const row = (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CoinBox />
                <Text style={s.packCount}>{fmtN(p)}</Text>
                {b ? <View style={s.bonus}><Text style={s.chipText}>+{b} 보너스</Text></View> : null}
              </View>
              <Text style={s.won}>{w.toLocaleString('ko-KR')}원</Text>
            </>
          );
          return (
            <PressableScale key={w} onPress={() => openCharge(i)} accessibilityLabel={`${fmtP(p + b)} ${w}원`}>
              {i === 3 ? <PopularBorder>{row}</PopularBorder> : <View style={s.pack}>{row}</View>}
              {i === 3 ? <View style={s.bestTag}><Text style={s.bestText}>인기</Text></View> : null}
            </PressableScale>
          );
        })}
      </View>

      <SubHead title="콘텐츠 이용 요금" caption="운세와 4가지 분석은 평생 무료예요" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {PRICE_TABLE.map(([a, b], i) => (
          <View key={a} style={[s.priceRow, i > 0 && s.line]}>
            <Text style={s.priceName}>{a}</Text>
            {b === '무료'
              ? <View style={s.free}><Text style={s.chipText}>무료</Text></View>
              : <Text style={s.priceValue}>{b}</Text>}
          </View>
        ))}
      </Card>

      <SubHead title="이용내역" />
      <View style={s.history}>
        {history.length ? history.map((h, i) => (
          <View key={h.id} style={[s.historyRow, i > 0 && s.line]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.historyLabel}>{h.label}</Text>
              <Text style={s.historyDate}>{kstDate(h.createdAt).replace(/-/g, '.')} · {TYPE_LABEL[h.type]}</Text>
            </View>
            <CoinPill label={fmtN(Math.abs(h.amount))} sign={h.amount > 0 ? '+' : '-'} color={h.amount > 0 ? colors.white : '#BBBBBB'} />
          </View>
        )) : <Text style={[txt.body, { paddingVertical: 14 }]}>아직 이용 내역이 없어요.</Text>}
      </View>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }]}>충전한 알(보너스 포함)은 5년, 출석·공유 등으로 받은 알은 1년 동안 쓸 수 있어요. 받은 알부터 먼저 쓰여요. 충전 후 7일 안에 하나도 쓰지 않았다면 환불을 요청할 수 있어요.</Text>
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
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, minHeight: 64 },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.heroBg },
  coinPillText: { ...sansW('700'), fontSize: 12, color: colors.white },
  coinBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: radius.sm },
  packCount: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: colors.ink },
  bonus: { backgroundColor: colors.surface, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs },
  chipText: { ...sansW('600'), fontSize: 12, color: SKY, opacity: 0.8 },
  won: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  popular: { borderRadius: radius.sm, padding: 1.5, overflow: 'hidden' },
  glow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.sm, backgroundColor: colors.card, shadowColor: colors.accent, shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  flow: { position: 'absolute', top: 0, bottom: 0, left: -FLOW_PAD },
  bestTag: { position: 'absolute', top: -9, right: 24, backgroundColor: colors.accent, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs },
  bestText: { ...sansW('600'), fontSize: 12, color: colors.white },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42, paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  priceName: { ...sansW('400'), flex: 1, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  priceValue: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  free: { borderWidth: 0.5, borderColor: SKY, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs },
  history: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.lg, paddingHorizontal: 15 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 8 },
  historyLabel: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  historyDate: { ...sansW('500'), fontSize: 10, lineHeight: 12, letterSpacing: -0.5, color: colors.inkMute },
  line: { borderTopWidth: 1, borderTopColor: colors.lineStrong },
});
