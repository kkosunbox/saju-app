import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Amount } from '../../components/premium/Kit';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import BusinessFooter from '../../components/BusinessFooter';
import { usePremium, refreshPoints } from '../../context/PremiumContext';
import { PACKS, fmtP } from '../../services/premium/catalog';
import { TossOrder, pointsApi } from '../../services/server/pointsApi';
import { ApiError } from '../../api/client';
import { TOSS_FAIL_MESSAGE as FAIL_MESSAGE, TossWidgets, loadToss } from '../../services/premium/tossSdk';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

type Phase = 'loading' | 'ready' | 'paying' | 'confirming' | 'error';

/**
 * 웹 포인트 충전: 서버가 주문을 만들고 → 토스 결제위젯으로 결제 → 돌아오면 서버가 승인하고 포인트를 넣는다.
 * 결제창에서 돌아올 때 이 화면이 successUrl/failUrl 로 다시 열린다 (?result=success|fail).
 */
export default function ChargeScreen() {
  const q = useLocalSearchParams<{ productId?: string; result?: string; paymentKey?: string; orderId?: string; amount?: string; code?: string; message?: string }>();
  const { toast } = usePremium();
  const pack = PACKS.find(([, , , id]) => id === q.productId);
  // 처음 상태: 앱(준비 중) · 결제창에서 돌아옴(승인 중 / 실패) · 처음 열림(결제창 준비)
  const initial = ((): { phase: Phase; error: string | null } => {
    if (Platform.OS !== 'web') return { phase: 'error', error: '앱 결제는 준비 중이에요. 지금은 웹에서 충전할 수 있어요.' };
    if (q.result === 'success') return { phase: 'confirming', error: null };
    if (q.result === 'fail') return { phase: 'error', error: FAIL_MESSAGE[q.code ?? ''] ?? q.message ?? '결제하지 못했어요.' };
    if (!pack) return { phase: 'error', error: '충전 상품을 찾지 못했어요.' };
    return { phase: 'loading', error: null };
  })();
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [error, setError] = useState<string | null>(initial.error);
  const [order, setOrder] = useState<TossOrder | null>(null);
  const widgets = useRef<TossWidgets | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (initial.phase === 'error' || started.current) return;
    started.current = true;
    const fail = (msg: string) => { setError(msg); setPhase('error'); };

    // 결제창에서 돌아옴: 승인
    if (q.result === 'success') {
      pointsApi.confirmToss({ paymentKey: q.paymentKey ?? '', orderId: q.orderId ?? '', amount: Number(q.amount) })
        .then(async () => {
          await refreshPoints();
          toast('알이 충전됐어요');
          router.replace('/wallet');
        })
        .catch(e => fail(e instanceof ApiError && e.code === 'PAYMENT_FAILED'
          ? '결제가 승인되지 않았어요. 돈은 빠져나가지 않았어요.'
          : '결제를 확인하지 못했어요. 잠시 후 내 알 화면에서 다시 확인해 주세요.'));
      return;
    }

    // 처음 열림: 주문을 만들고 결제위젯을 그린다
    (async () => {
      try {
        const [TossPayments, created] = await Promise.all([loadToss(), pointsApi.createTossOrder(q.productId!)]);
        const w = TossPayments(created.clientKey).widgets({ customerKey: created.customerKey });
        await w.setAmount({ currency: 'KRW', value: created.amount });
        await Promise.all([
          w.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'woonpickwidget' }),
          w.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        widgets.current = w;
        setOrder(created);
        setPhase('ready');
      } catch (e) {
        if (e instanceof ApiError && e.code === 'PAYMENT_NOT_READY') {
          toast('알 충전은 준비 중이에요');
          fail('알 충전은 준비 중이에요. 조금만 기다려 주세요.');
          return;
        }
        fail('결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    })();
  }, []);

  const pay = async () => {
    if (!widgets.current || !order) return;
    setPhase('paying');
    const back = `${window.location.origin}/charge`;
    try {
      await widgets.current.requestPayment({ orderId: order.orderId, orderName: order.orderName, successUrl: `${back}?result=success`, failUrl: `${back}?result=fail` });
    } catch (e) {
      // 결제창을 닫으면 여기로 온다 (리다이렉트 없이)
      const code = (e as { code?: string }).code ?? '';
      toast(FAIL_MESSAGE[code] ?? '결제하지 못했어요.');
      setPhase('ready');
    }
  };

  const footer = phase === 'error' ? <PrimaryButton label="내 알 보러 가기" onPress={() => router.replace('/wallet')} /> : undefined;

  return (
    <Screen title="알 충전" back footer={footer} contentStyle={s.fill}>
      {pack && phase !== 'confirming' && phase !== 'error' ? (
        <View style={s.sum}>
          <Amount value={pack[1] + pack[2]} size={22} style={txt.h2} />
          <Text style={txt.small}>{pack[2] ? `기본 ${fmtP(pack[1])} + 보너스 ${fmtP(pack[2])} · ` : ''}{pack[0].toLocaleString('ko-KR')}원</Text>
        </View>
      ) : null}
      {phase === 'loading' || phase === 'confirming' ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.purple} />
          <Text style={[txt.small, { marginTop: 12 }]}>{phase === 'confirming' ? '결제를 확인하고 있어요' : '결제창을 준비하고 있어요'}</Text>
        </View>
      ) : null}
      {phase === 'error' ? (
        <View style={s.center}>
          <Text style={[txt.body, { textAlign: 'center' }]}>{error}</Text>
        </View>
      ) : null}
      {/* 토스 결제위젯이 그려지는 자리 (웹에서 nativeID 는 id 가 된다) */}
      {Platform.OS === 'web' && q.result == null ? (
        <View style={phase === 'ready' || phase === 'paying' ? s.widget : s.hidden}>
          <View nativeID="toss-payment-method" />
          <View nativeID="toss-agreement" />
        </View>
      ) : null}
      {/* 결제하기는 위젯(결제수단 → 약관) 바로 아래에 둔다 — PC처럼 세로로 긴 화면에서 창 맨 아래 고정 버튼은 눈에 잘 안 띈다 */}
      {phase === 'ready' || phase === 'paying' ? (
        <PrimaryButton style={s.pay} label={phase === 'paying' ? '결제창 여는 중…' : `${order!.amount.toLocaleString('ko-KR')}원 결제하기`} onPress={pay} disabled={phase === 'paying'} />
      ) : null}
      {/* 사업자 정보는 내용이 짧아도 화면 맨 아래에 붙인다 */}
      <View style={s.spacer} />
      <BusinessFooter />
    </Screen>
  );
}

const s = StyleSheet.create({
  sum: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.card, gap: 4, marginTop: 4 },
  center: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 12 },
  widget: { marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white },
  hidden: { height: 0, overflow: 'hidden' },
  pay: { marginTop: 16 },
  fill: { flexGrow: 1 },
  spacer: { flexGrow: 1, minHeight: 32 },
});
