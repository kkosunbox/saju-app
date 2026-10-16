import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import { usePremium, refreshPoints } from '../../context/PremiumContext';
import { PACKS, fmtP, packProductId } from '../../services/premium/catalog';
import { TossOrder, pointsApi } from '../../services/server/pointsApi';
import { ApiError } from '../../api/client';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

/** 토스페이먼츠 결제위젯 v2 (https://docs.tosspayments.com/sdk/v2/js) 중 쓰는 부분만 */
interface TossWidgets {
  setAmount(amount: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(p: { selector: string; variantKey?: string }): Promise<unknown>;
  renderAgreement(p: { selector: string; variantKey?: string }): Promise<unknown>;
  requestPayment(p: { orderId: string; orderName: string; successUrl: string; failUrl: string }): Promise<void>;
}
type TossPaymentsFn = (clientKey: string) => { widgets(p: { customerKey: string }): TossWidgets };

const TOSS_SDK = 'https://js.tosspayments.com/v2/standard';
let sdkLoading: Promise<TossPaymentsFn> | null = null;
function loadToss(): Promise<TossPaymentsFn> {
  const w = window as unknown as { TossPayments?: TossPaymentsFn };
  if (w.TossPayments) return Promise.resolve(w.TossPayments);
  sdkLoading ??= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = TOSS_SDK;
    el.onload = () => (w.TossPayments ? resolve(w.TossPayments) : reject(new Error('TossPayments missing')));
    el.onerror = () => { sdkLoading = null; reject(new Error('TossPayments load failed')); };
    document.head.appendChild(el);
  });
  return sdkLoading;
}

const FAIL_MESSAGE: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제를 취소했어요.',
  PAY_PROCESS_ABORTED: '결제가 중단됐어요. 다시 시도해 주세요.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했어요. 다른 카드로 시도해 주세요.',
};

type Phase = 'loading' | 'ready' | 'paying' | 'confirming' | 'error';

/**
 * 웹 포인트 충전: 서버가 주문을 만들고 → 토스 결제위젯으로 결제 → 돌아오면 서버가 승인하고 포인트를 넣는다.
 * 결제창에서 돌아올 때 이 화면이 successUrl/failUrl 로 다시 열린다 (?result=success|fail).
 */
export default function ChargeScreen() {
  const q = useLocalSearchParams<{ productId?: string; result?: string; paymentKey?: string; orderId?: string; amount?: string; code?: string; message?: string }>();
  const { toast } = usePremium();
  const pack = PACKS.find(([won]) => packProductId(won) === q.productId);
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
          toast('포인트가 충전됐어요');
          router.replace('/wallet');
        })
        .catch(e => fail(e instanceof ApiError && e.code === 'PAYMENT_FAILED'
          ? '결제가 승인되지 않았어요. 돈은 빠져나가지 않았어요.'
          : '결제를 확인하지 못했어요. 잠시 후 내 포인트에서 다시 확인해 주세요.'));
      return;
    }

    // 처음 열림: 주문을 만들고 결제위젯을 그린다
    (async () => {
      try {
        const [TossPayments, created] = await Promise.all([loadToss(), pointsApi.createTossOrder(q.productId!)]);
        const w = TossPayments(created.clientKey).widgets({ customerKey: created.customerKey });
        await w.setAmount({ currency: 'KRW', value: created.amount });
        await Promise.all([
          w.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' }),
          w.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        widgets.current = w;
        setOrder(created);
        setPhase('ready');
      } catch {
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

  const footer = phase === 'ready' || phase === 'paying'
    ? <PrimaryButton label={phase === 'paying' ? '결제창 여는 중…' : `${order!.amount.toLocaleString('ko-KR')}원 결제하기`} onPress={pay} disabled={phase === 'paying'} />
    : phase === 'error' ? <PrimaryButton label="내 포인트로" onPress={() => router.replace('/wallet')} /> : undefined;

  return (
    <Screen title="포인트 충전" back footer={footer}>
      {pack && phase !== 'confirming' && phase !== 'error' ? (
        <View style={s.sum}>
          <Text style={txt.h2}>{fmtP(pack[1] + pack[2])}</Text>
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
    </Screen>
  );
}

const s = StyleSheet.create({
  sum: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.card, gap: 4, marginTop: 4 },
  center: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 12 },
  widget: { marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white },
  hidden: { height: 0, overflow: 'hidden' },
});
