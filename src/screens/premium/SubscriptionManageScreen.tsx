/**
 * 구독 관리 — 상태 · 다음 결제 · 이번 결제 기간 혜택 사용 · 결제 내역 · 해지/해지 취소.
 * 해지해도 이번 결제 기간 끝까지 혜택이 남고 다음 결제부터 청구되지 않는다. 환불은 1:1 문의로만 받는다.
 * App Store · Google Play 구독은 해지 · 결제 수단 · 환불을 스토어에서 한다 (스토어 구독 관리로 연결).
 * 앱(iOS · Android)에서도 해지·해지 취소는 되지만, 구독 시작은 웹에서만 한다 (결제 링크를 두지 않는다).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import SolidIcon from '../../components/SolidIcon';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { CROWN, SUB_BG, SUB_INK, SubscriptionBadge } from '../../components/premium/SubscriptionBadge';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION } from '../../services/premium/catalog';
import { MySubscription, pointsApi, pointsKeys } from '../../services/server/pointsApi';
import { consultKeys } from '../../services/server/consultApi';
import { queryClient } from '../../api/query';
import { colors } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { TOSS_CARD_FAIL_MESSAGE, loadToss } from '../../services/premium/tossSdk';
import { ApiError } from '../../api/client';
import { kstDot, kstMonthDay, subscriptionStatusLabel, won } from './subscriptionText';
import { PaymentRows } from './SubscriptionPaymentsScreen';
import { useStoreBilling } from '../../context/StoreBillingContext';

/** 구독 관리 화면에 보이는 최근 결제 수. 더 있으면 '더보기'로 결제 내역 화면을 연다 */
const RECENT = 10;

/** 카드 변경 오류 → 안내 */
function cardError(e: unknown): string {
  const code = e instanceof ApiError ? e.code : '';
  if (code === 'PAYMENT_FAILED') return '새 카드를 등록하지 못했어요. 다른 카드로 다시 시도해 주세요';
  if (code === 'PAYMENT_NOT_READY') return '카드 변경은 준비 중이에요. 조금만 기다려 주세요';
  return '카드를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요';
}

export default function SubscriptionManageScreen() {
  const { account } = useApp();
  const { subscription: sub, ready, owned, attendedToday, toast } = usePremium();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const storeBilling = useStoreBilling().subscription;
  const payments = useQuery({
    queryKey: [...pointsKeys.subscriptionPayments, account?.id, 1, RECENT],
    queryFn: () => pointsApi.subscriptionPayments(1, RECENT),
    enabled: !!account && !!sub,
  });
  // 카드 등록창에서 돌아옴 (?card=success&authKey=… / ?card=fail&code=…)
  const q = useLocalSearchParams<{ card?: string; authKey?: string; code?: string; message?: string }>();
  const [cardBusy, setCardBusy] = useState(q.card === 'success');
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current || !q.card) return;
    handled.current = true;
    const clear = () => router.setParams({ card: undefined, authKey: undefined, customerKey: undefined, code: undefined, message: undefined });
    if (q.card === 'fail') {
      toast(TOSS_CARD_FAIL_MESSAGE[q.code ?? ''] ?? q.message ?? '카드를 등록하지 못했어요');
      clear();
      return;
    }
    pointsApi.changeSubscriptionCard(q.authKey ?? '')
      .then(async v => {
        await refreshPoints();
        toast(v.status === 'active' && sub?.status === 'grace' ? '카드를 바꾸고 바로 결제했어요' : '결제 카드를 바꿨어요');
      })
      .catch(e => toast(cardError(e)))
      .finally(() => { setCardBusy(false); clear(); });
  }, []);

  if (!ready) return <LoadingScreen />;
  if (!sub) {
    return (
      <Screen title="구독 관리" back>
        <View style={s.empty}>
          <SolidIcon name="crown" size={28} color={CROWN} />
          <Text style={[txt.h3, { marginTop: 12, textAlign: 'center' }]}>지금 이용 중인 구독이 없어요</Text>
          <Text style={[txt.small, { marginTop: 6, textAlign: 'center' }]}>구독이 끝났거나 아직 시작하지 않았어요.</Text>
          <PrimaryButton label="구독 안내 보기" variant="soft" onPress={() => router.replace('/subscribe')} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  const b = sub.benefits;
  const end = kstMonthDay(sub.currentPeriodEnd);
  const monthKey = b.monthlyContentKey; // monthly:YYYY-MM
  const [y, m] = monthKey.slice('monthly:'.length).split('-').map(Number);
  const monthlyOpened = owned(monthKey);

  const act = async (run: () => Promise<MySubscription>, done: string) => {
    setBusy(true);
    try {
      await run();
      await refreshPoints();
      queryClient.invalidateQueries({ queryKey: consultKeys.status });
      toast(done);
    } catch {
      toast('처리하지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  const cancel = () => act(pointsApi.cancelSubscription, sub.status === 'grace' ? '구독을 해지했어요' : `해지했어요. ${end}까지 혜택은 그대로예요`);
  const resume = () => act(pointsApi.resumeSubscription, `해지를 취소했어요. ${end}에 다시 자동 결제돼요`);

  /** 웹: 토스 카드 등록창을 다시 열어 새 카드를 받는다. 앱은 웹에서 바꾸도록 안내한다 */
  const changeCard = async () => {
    if (Platform.OS !== 'web') { toast('결제 카드는 웹(woonpick.com)에서 바꿀 수 있어요'); return; }
    setCardBusy(true);
    try {
      const [TossPayments, auth] = await Promise.all([loadToss(), pointsApi.subscriptionBillingAuth()]);
      const back = `${window.location.origin}/subscription`;
      await TossPayments(auth.clientKey).payment({ customerKey: auth.customerKey })
        .requestBillingAuth({ method: 'CARD', successUrl: `${back}?card=success`, failUrl: `${back}?card=fail` });
    } catch (e) {
      // 등록창을 닫으면 여기로 온다
      const code = (e as { code?: string }).code ?? '';
      toast(e instanceof ApiError ? cardError(e) : TOSS_CARD_FAIL_MESSAGE[code] ?? '카드 등록창을 열지 못했어요');
      setCardBusy(false);
    }
  };
  // App Store · Google Play 구독: 결제 수단 · 해지 · 환불은 스토어에서
  const storeSub = sub.store !== 'toss';
  const storeName = sub.store === 'apple' ? 'App Store' : 'Google Play';
  const storeWhere = sub.store === 'apple' ? '설정 > Apple 계정 > 구독' : 'Play 스토어 > 결제 및 정기 결제';
  const manageInStore = () => {
    // 이 기기 스토어와 구독한 스토어가 같을 때만 바로 연다
    if ((sub.store === 'apple' && Platform.OS === 'ios') || (sub.store === 'google' && Platform.OS === 'android')) void storeBilling.manage();
    else toast(`${storeName}에서 구독한 거라 ${storeWhere}에서 관리할 수 있어요`);
  };
  const payList = payments.data?.list ?? [];
  const payTotal = payments.data?.total ?? 0;

  return (
    <Screen title="구독 관리" back>
      {/* 상태 · 가격 · 다음 결제 */}
      <View style={s.hero}>
        <View style={s.between}>
          <View style={s.row}>
            <SolidIcon name="crown" size={18} color={CROWN} />
            <Text style={s.heroName}>{SUBSCRIPTION.name}</Text>
          </View>
          <View style={[s.status, sub.status === 'grace' && s.statusWarn, sub.status === 'cancelled' && s.statusMute]}>
            <Text style={[s.statusText, sub.status !== 'active' && { color: colors.ink }]}>{subscriptionStatusLabel(sub)}</Text>
          </View>
        </View>
        <Text style={s.heroPrice}>월 {won(sub.priceKrw)}</Text>
        <View style={s.heroRows}>
          <HeroRow k="이용 기간" v={`${kstDot(sub.currentPeriodStart)} ~ ${kstDot(sub.currentPeriodEnd)}`} />
          <HeroRow
            k="다음 결제"
            v={sub.status === 'cancelled' ? '없음 (해지 예약)' : sub.status === 'grace' ? '다시 시도하는 중'
              : sub.nextChargeAt ? `${kstDot(sub.nextChargeAt)} · ${won(sub.priceKrw)}`
              // 스토어 구독은 스토어가 기간 끝에 자동 갱신한다
              : sub.store !== 'toss' && sub.autoRenew ? `${kstDot(sub.currentPeriodEnd)} 자동 갱신` : '-'}
          />
          {storeSub ? <HeroRow k="결제" v={`${storeName} 구독`} /> : null}
          {storeSub ? null : <View style={s.between}>
            <Text style={s.heroK}>결제 카드</Text>
            <View style={s.row}>
              <Text style={s.heroV}>{sub.cardLabel ?? '-'}</Text>
              {sub.store === 'toss' ? (
                <PressableScale onPress={changeCard} disabled={cardBusy} scaleTo={0.95} style={[s.cardBtn, cardBusy && { opacity: 0.5 }]} accessibilityLabel="결제 카드 변경">
                  <Text style={s.cardBtnText}>{cardBusy ? '바꾸는 중…' : '변경'}</Text>
                </PressableScale>
              ) : null}
            </View>
          </View>}
        </View>
      </View>

      {sub.status === 'grace' ? (
        <View style={s.warn}>
          <Icon name="bell" size={16} color={colors.danger} />
          <Text style={s.warnText}>
            {storeSub
              ? `${storeName}에서 갱신 결제가 승인되지 않았어요. ${sub.graceUntil ? `${kstMonthDay(sub.graceUntil)}까지는 혜택을 그대로 쓸 수 있어요. ` : '결제가 될 때까지 구독 혜택은 잠시 멈춰요. '}${storeWhere}에서 결제 수단을 확인해 주세요.`
              : `갱신 결제가 승인되지 않았어요. ${sub.graceUntil ? `${kstMonthDay(sub.graceUntil)}까지 ` : ''}하루 한 번 다시 시도하고, 그래도 안 되면 구독이 끝나요. 결제가 될 때까지 구독 혜택은 잠시 멈춰요. 결제 카드를 바꾸면 새 카드로 바로 다시 결제해요.`}
          </Text>
        </View>
      ) : sub.status === 'cancelled' ? (
        <View style={s.note}>
          <Text style={s.noteText}>해지를 예약했어요. {end}까지 혜택을 그대로 쓸 수 있고, 그 뒤로는 결제되지 않아요.</Text>
        </View>
      ) : null}

      {/* 이번 결제 기간 혜택 — 무엇을 얼마나 썼는지 */}
      <SubHead title="이번 결제 기간 혜택" caption={b.active ? `${end}에 다시 채워져요` : undefined} />
      <View style={s.benefits}>
        <BenefitRow
          title="운알톡 무료"
          desc={b.active ? `${b.consultTotal}회 중 ${b.consultLeft}회 남음` : '결제가 되면 다시 쓸 수 있어요'}
          bar={b.consultTotal ? b.consultUsed / b.consultTotal : 0}
          onPress={() => router.push('/consult')}
        />
        <BenefitRow
          title={`${m}월 월별 상세운세 무료`}
          desc={monthlyOpened ? '이번 달 운세를 열었어요 · 구독이 끝나도 계속 볼 수 있어요' : b.active ? '아직 열지 않았어요 · 눌러서 무료로 열어 보세요' : '결제가 되면 무료로 열 수 있어요'}
          done={monthlyOpened}
          onPress={() => router.push(`/premium/monthly?y=${y}&m=${m}` as never)}
        />
        <BenefitRow
          title={`출석 체크 알 ${b.attendanceMultiplier}배`}
          desc={attendedToday ? '오늘 출석 체크를 했어요' : '오늘 출석 체크하고 2배로 받아 가세요'}
          done={attendedToday}
          onPress={() => router.push('/wallet')}
        />
        <BenefitRow
          title="광고 없이 이용"
          desc={b.active ? '구독 중에는 광고가 보이지 않아요' : '결제가 되면 다시 적용돼요'}
        />
      </View>

      {payList.length ? (
        <>
          <SubHead title="결제 내역" caption={payTotal > RECENT ? `최근 ${RECENT}건` : undefined} />
          <PaymentRows rows={payList.slice(0, RECENT)} />
          {payTotal > RECENT ? (
            <PressableScale onPress={() => router.push('/subscription/payments')} style={s.more} scaleTo={0.98} accessibilityLabel="결제 내역 더보기">
              <Text style={s.moreText}>더보기</Text>
              <Icon name="chevronRight" size={16} color={colors.inkMute} strokeWidth={1.5} />
            </PressableScale>
          ) : null}
        </>
      ) : null}

      <View style={{ marginTop: 24, gap: 8 }}>
        {storeSub ? (
          <PrimaryButton label={`${storeName}에서 구독 관리`} variant="soft" onPress={manageInStore} />
        ) : sub.status === 'cancelled' ? (
          <PrimaryButton label={busy ? '처리 중…' : '해지 취소하기'} onPress={resume} disabled={busy} />
        ) : (
          <PrimaryButton label="구독 해지하기" variant="soft" onPress={() => setConfirm(true)} disabled={busy} />
        )}
      </View>

      <View style={{ marginTop: 20, gap: 6 }}>
        {storeSub ? (
          <Bullet textStyle={s.small}>해지·결제 수단 변경은 {storeWhere}에서 할 수 있어요. 해지해도 이번 결제 기간이 끝날 때까지 혜택이 유지돼요.</Bullet>
        ) : (
          <Bullet textStyle={s.small}>해지해도 이번 결제 기간이 끝날 때까지 혜택이 유지되고, 다음 결제부터 청구되지 않아요. 기간이 끝나기 전에는 해지를 취소할 수 있어요.</Bullet>
        )}
        <Bullet textStyle={s.small}>남은 운알톡 횟수는 다음 결제 기간으로 넘어가지 않아요. 구독으로 연 월별 상세운세는 구독이 끝나도 계속 볼 수 있어요.</Bullet>
        {storeSub ? (
          <Bullet textStyle={s.small}>환불은 {storeName} 정책에 따라 {sub.store === 'apple' ? 'Apple' : 'Google Play'}에 요청해 주세요.</Bullet>
        ) : (
          <Bullet textStyle={s.small}>환불은 1:1 문의로 요청해 주세요. 결제 후 7일 안에 혜택을 하나도 쓰지 않았다면 전액 환불해 드려요.</Bullet>
        )}
      </View>
      <Text style={s.link} accessibilityRole="link" onPress={() => router.push('/inquiry')}>1:1 문의하기</Text>

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.h2, s.center]}>구독을 해지할까요?</Text>
        <Text style={[txt.small, s.center, { marginTop: 8 }]}>
          {sub.status === 'grace'
            ? '결제가 밀린 상태라 해지하면 바로 끝나요.'
            : `${end}까지 혜택은 그대로 쓸 수 있고,\n그 뒤로는 결제되지 않아요.${b.consultLeft ? `\n남은 운알톡 ${b.consultLeft}회는 기간이 끝나면 사라져요.` : ''}`}
        </Text>
        <PrimaryButton label={busy ? '해지하는 중…' : '해지하기'} onPress={cancel} disabled={busy} style={{ marginTop: 20 }} />
        <PrimaryButton label="계속 구독하기" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

function HeroRow({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.between}>
      <Text style={s.heroK}>{k}</Text>
      <Text style={s.heroV}>{v}</Text>
    </View>
  );
}

/** 혜택 한 줄. onPress가 없으면(광고 없이 이용) 눌러서 갈 곳이 없어 화살표도 없다 */
function BenefitRow({ title, desc, bar, done, onPress }: { title: string; desc: string; bar?: number; done?: boolean; onPress?(): void }) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.98} accessibilityLabel={`${title} · ${desc}`}>
      <Card style={s.benefit}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={s.row}>
            <SubscriptionBadge label="구독" small />
            <Text style={s.benefitTitle}>{title}</Text>
            {done ? <Icon name="check" size={14} color={colors.success} strokeWidth={2.6} /> : null}
          </View>
          <Text style={s.benefitDesc}>{desc}</Text>
          {bar !== undefined ? (
            <View style={s.track}><View style={[s.fill, { width: `${Math.round(Math.min(1, Math.max(0, bar)) * 100)}%` }]} /></View>
          ) : null}
        </View>
        {onPress ? <Icon name="chevronRight" size={18} color={colors.inkMute} strokeWidth={2} /> : null}
      </Card>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  empty: { alignItems: 'center', paddingTop: 48 },
  hero: { marginTop: 4, padding: 16, borderRadius: radius.lg, backgroundColor: colors.heroBg },
  heroName: { ...sansW('800'), fontSize: 18, lineHeight: 24, letterSpacing: -0.9, color: colors.white },
  heroPrice: { ...sansW('700'), fontSize: 15, lineHeight: 20, letterSpacing: -0.6, color: '#DDDDDD', marginTop: 4 },
  heroRows: { marginTop: 14, gap: 6, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.25)' },
  heroK: { ...sansW('400'), fontSize: 13, lineHeight: 18, color: '#BBBBBB' },
  heroV: { ...sansW('600'), fontSize: 13, lineHeight: 18, color: colors.white, flexShrink: 1, textAlign: 'right' },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: CROWN },
  statusWarn: { backgroundColor: '#FFD6D6' },
  statusMute: { backgroundColor: SUB_BG },
  statusText: { ...sansW('700'), fontSize: 12, lineHeight: 16, color: colors.heroBg },
  warn: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: radius.lg, backgroundColor: '#FFF0F0' },
  warnText: { ...sansW('400'), flex: 1, fontSize: 13, lineHeight: 19, letterSpacing: -0.4, color: colors.ink },
  note: { marginTop: 12, padding: 12, borderRadius: radius.lg, backgroundColor: SUB_BG },
  noteText: { ...sansW('500'), fontSize: 13, lineHeight: 19, letterSpacing: -0.4, color: SUB_INK },
  benefits: { gap: 10 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  benefitTitle: { ...sansW('700'), fontSize: 14, lineHeight: 18, letterSpacing: -0.56, color: colors.ink, flexShrink: 1 },
  benefitDesc: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.4, color: colors.inkMute },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.lineStrong, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: CROWN },
  cardBtn: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cardBtnText: { ...sansW('600'), fontSize: 12, lineHeight: 16, color: colors.white },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 12, marginTop: 4 },
  moreText: { ...sansW('500'), fontSize: 13, color: colors.inkMute },
  small: { fontSize: 12, lineHeight: 18, color: colors.inkMute },
  link: { ...sansW('700'), fontSize: 13, lineHeight: 20, color: colors.inkMute, textDecorationLine: 'underline', textAlign: 'center', marginTop: 14 },
});
