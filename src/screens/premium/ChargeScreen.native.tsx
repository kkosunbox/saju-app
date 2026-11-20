import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import { Amount } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { useStoreBilling } from '../../context/StoreBillingContext';
import { PACKS, fmtP, packBonus, safeReturnTo } from '../../services/premium/catalog';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

export default function ChargeScreen() {
  const { productId, returnTo } = useLocalSearchParams<{ productId?: string; returnTo?: string }>();
  const billing = useStoreBilling();
  const { firstCharge } = usePremium();
  // 콘텐츠를 열다가 알이 모자라 온 거면 충전 후 그 화면으로 돌아간다
  const done = safeReturnTo(returnTo) ?? '/wallet';
  const [requested, setRequested] = useState(false);
  const pack = PACKS.find(pack => pack[3] === productId);
  const product = productId ? billing.products[productId] : undefined;
  const busy = ['purchasing', 'verifying'].includes(billing.status);
  const pending = billing.status === 'pending';
  const completed = requested && billing.status === 'success' && billing.activeProductId === productId;
  // 결제가 끝나면 지갑을 다시 읽어 1+1 표시가 꺼지므로, 결제 중 · 직후엔 결제 전 값을 그대로 보여 준다
  const first = useRef(firstCharge);
  if (!busy && billing.status !== 'success') first.current = firstCharge;
  const bonus = pack ? packBonus(pack, first.current) : 0;
  useEffect(() => { if (completed) router.replace(done as never); }, [completed, done]);
  const unavailable = !billing.loading && !product;
  const retry = pending || billing.status === 'error' || unavailable || !billing.ready;
  const label = busy ? billing.status === 'verifying' ? '결제 확인 중…' : '스토어 결제 중…'
    : pending ? '승인 상태 다시 확인'
    : billing.loading ? '상품 확인 중…' : retry ? '다시 확인' : `${product!.displayPrice} 결제하기`;
  return (
    <Screen title="알 충전" back footer={
      <View style={{ gap: 8 }}>
        <PrimaryButton label={label} disabled={busy || billing.loading || !pack}
          onPress={() => {
            if (retry) billing.retry();
            else { setRequested(true); void billing.purchase(pack![3]); }
          }} />
        <PrimaryButton label="내 알 보러 가기" variant="soft" onPress={() => router.replace('/wallet')} />
      </View>
    }>
      {pack ? <View style={s.summary}>
        <Amount value={pack[1] + bonus} size={22} style={txt.h2} />
        {bonus ? <Text style={txt.small}>기본 {fmtP(pack[1])} + {bonus > pack[2] ? '첫 충전 1+1 ' : ''}보너스 {fmtP(bonus)}</Text> : null}
        {product ? <Text style={txt.body}>{product.displayPrice}</Text> : null}
      </View> : <Text style={txt.body}>충전 상품을 찾지 못했어요.</Text>}
      <View style={s.content}>
        {billing.loading || busy ? <ActivityIndicator color={colors.purple} /> : null}
        <Text style={[txt.body, { textAlign: 'center' }]}>
          {(billing.status !== 'success' || requested ? billing.message : null) || (unavailable ? '현재 스토어에서 이 상품을 구매할 수 없어요. 잠시 후 다시 확인해 주세요.'
            : `${Platform.OS === 'ios' ? 'App Store' : 'Google Play'}에서 결제해요. 결제 승인 후 알이 충전됩니다.`)}
        </Text>
        <Text style={txt.caption}>앱에서 구매한 알은 유효기간 없이 사용할 수 있어요. 환불은 구매한 스토어에서 신청할 수 있어요.</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.card, gap: 8, marginTop: 4 },
  content: { gap: 16, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 12 },
});
