import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import BusinessFooter from '../../components/BusinessFooter';
import { ActRow, Bullet, Hero, SubHead } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { SUBSCRIPTION } from '../../services/premium/catalog';
import { colors } from '../../theme/colors';
import { sansW, txt } from '../../theme/typography';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

/** 정기 구독 상품 안내 — 아직 판매 전이라 구독하기는 준비 중 안내로 끝난다 (catalog SUBSCRIPTION) */
export default function SubscribeScreen() {
  const { toast } = usePremium();
  const p = SUBSCRIPTION;
  return (
    <Screen title="정기 구독" back footer={<PrimaryButton label={`월 ${won(p.won)} 구독하기`} onPress={() => toast('정기 구독은 준비 중이에요. 조금만 기다려 주세요')} />}>
      <Hero style={{ marginTop: 4, padding: 16 }}>
        <Text style={s.heroSub}>{p.period} 자동 갱신</Text>
        <Text style={s.heroName}>{p.name}</Text>
        <Text style={s.heroPrice}>월 {won(p.won)}</Text>
      </Hero>

      <SubHead title="구독 혜택" />
      <Card style={{ gap: 10 }}>
        {p.benefits.map(b => <ActRow key={b}>{b}</ActRow>)}
      </Card>

      <SubHead title="결제 안내" />
      <View style={{ gap: 6 }}>
        <Bullet>첫 결제일부터 {p.period}마다 등록한 카드로 {won(p.won)}이 자동 결제돼요.</Bullet>
        <Bullet>결제는 토스페이먼츠 정기결제로 처리되고, 결제일은 매달 첫 결제일과 같은 날이에요. 그 날이 없는 달은 말일에 결제돼요.</Bullet>
        <Bullet>결제에 실패하면 3일 동안 하루 한 번 다시 시도하고, 그래도 실패하면 구독이 끝나요.</Bullet>
        <Bullet>언제든 [마이 &gt; 내 알 &gt; 정기 구독]에서 해지할 수 있어요. 해지해도 이번 결제 기간이 끝날 때까지 혜택이 유지되고, 다음 결제부터 청구되지 않아요.</Bullet>
        <Bullet>결제 후 7일 안에 혜택(적립된 알·무료 콘텐츠)을 하나도 쓰지 않았다면 전액 환불을 요청할 수 있어요. 그 밖에는 이용약관 제4조의2를 따라요.</Bullet>
      </View>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]} onPress={() => router.push('/legal/terms')}>이용약관 보기</Text>
      <BusinessFooter style={{ marginTop: 32 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  heroSub: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: '#DDDDDD' },
  heroName: { ...sansW('800'), fontSize: 22, lineHeight: 30, letterSpacing: -0.88, color: colors.white, marginTop: 4 },
  heroPrice: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.64, color: colors.white, marginTop: 2 },
});
