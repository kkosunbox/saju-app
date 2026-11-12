import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { SUBSCRIPTION } from '../../services/premium/catalog';
import { TOSS_FAIL_MESSAGE, loadToss } from '../../services/premium/tossSdk';
import { pointsApi } from '../../services/server/pointsApi';
import { ApiError } from '../../api/client';
import { colors } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

/** '프리미엄' 글자에 흰색 → 금색 그라데이션(Figma: 이름 폭 54%부터 #FFCA6E). 글자 단위로 근사한다 */
const PREMIUM_TINT = ['#FFFFFF', '#FFF2DB', '#FFE3B3', '#FFD385'];
const PREMIUM = '프리미엄';

/** 서버 오류 코드 → 구독 안내 문구 */
function subscribeError(e: unknown): string {
  const code = e instanceof ApiError ? e.code : '';
  if (code === 'ACTIVE_SUBSCRIPTION_EXISTS') return '이미 구독 중이에요';
  if (code === 'PAYMENT_FAILED') return '첫 결제가 승인되지 않았어요. 다른 카드로 다시 시도해 주세요';
  if (code === 'PAYMENT_NOT_READY' || code === 'CONTENT_NOT_FOR_SALE') return '정기 구독은 준비 중이에요. 조금만 기다려 주세요';
  if (code === 'UNAUTHORIZED' || code === 'MEMBER_ONLY') return '로그인한 뒤 구독할 수 있어요';
  return '구독을 시작하지 못했어요. 잠시 후 다시 시도해 주세요';
}

/**
 * 정기 구독 (catalog SUBSCRIPTION). 웹: 토스 카드 등록창 → 이 화면으로 돌아오면(?result=success&authKey=…)
 * 서버가 빌링키를 받고 첫 회차를 결제한다. 앱은 아직 스토어 구독이 없어 웹 안내로 끝난다.
 */
export default function SubscribeScreen() {
  const { toast } = usePremium();
  const p = SUBSCRIPTION;
  const q = useLocalSearchParams<{ result?: string; authKey?: string; code?: string; message?: string }>();
  const [busy, setBusy] = useState(q.result === 'success');
  const handled = useRef(false);

  // 카드 등록창에서 돌아옴: 성공이면 구독 시작, 실패면 안내
  useEffect(() => {
    if (handled.current || !q.result) return;
    handled.current = true;
    if (q.result === 'fail') {
      toast(TOSS_FAIL_MESSAGE[q.code ?? ''] ?? q.message ?? '카드를 등록하지 못했어요');
      router.setParams({ result: undefined, code: undefined, message: undefined });
      return;
    }
    pointsApi.startTossSubscription(p.productId, q.authKey ?? '')
      .then(() => { toast('정기 구독을 시작했어요'); router.replace('/wallet'); })
      .catch(e => { toast(subscribeError(e)); setBusy(false); router.setParams({ result: undefined, authKey: undefined, customerKey: undefined }); });
  }, []);

  const subscribe = async () => {
    if (Platform.OS !== 'web') { toast('정기 구독은 지금은 웹에서 시작할 수 있어요'); return; }
    setBusy(true);
    try {
      const [TossPayments, auth] = await Promise.all([loadToss(), pointsApi.subscriptionBillingAuth()]);
      const back = `${window.location.origin}/subscribe`;
      await TossPayments(auth.clientKey).payment({ customerKey: auth.customerKey })
        .requestBillingAuth({ method: 'CARD', successUrl: `${back}?result=success`, failUrl: `${back}?result=fail` });
    } catch (e) {
      // 등록창을 닫으면 여기로 온다 (리다이렉트 없이)
      const code = (e as { code?: string }).code ?? '';
      toast(e instanceof ApiError ? subscribeError(e) : TOSS_FAIL_MESSAGE[code] ?? '카드 등록창을 열지 못했어요');
      setBusy(false);
    }
  };

  return (
    <Screen title="정기구독" back contentStyle={s.content} footer={<PrimaryButton size="medium" label={busy ? '구독 준비 중…' : `월 ${won(p.won)} 구독하기`} onPress={subscribe} disabled={busy} />}>
      <View style={s.hero}>
        <Image source={require('../../../assets/figma/subscribe/hero.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <Text style={s.heroSub}>{p.period} 자동 갱신</Text>
        <Text style={s.heroName}>
          {p.name.endsWith(PREMIUM) ? <>{p.name.slice(0, -PREMIUM.length)}{[...PREMIUM].map((c, i) => <Text key={i} style={{ color: PREMIUM_TINT[i] }}>{c}</Text>)}</> : p.name}
        </Text>
        <Text style={s.heroPrice}>월 {won(p.won)}</Text>
      </View>

      <SubHead title="구독 혜택" variant="figma" />
      <View style={s.benefits}>
        {p.benefits.map(b => (
          <View key={b} style={s.benefit}>
            <Image source={require('../../../assets/figma/subscribe/check.svg')} style={{ width: 18, height: 18 }} contentFit="contain" accessible={false} />
            <Text style={s.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <SubHead title="결제 안내" variant="figma" />
      <View style={{ gap: 6 }}>
        <Bullet>첫 결제일부터 {p.period}마다 등록한 카드로 {won(p.won)}이 자동 결제돼요.</Bullet>
        <Bullet>결제는 토스페이먼츠 정기결제로 처리되고, 결제일은 매달 첫 결제일과 같은 날이에요. 그 날이 없는 달은 말일에 결제돼요.</Bullet>
        <Bullet>결제에 실패하면 3일 동안 하루 한 번 다시 시도하고, 그래도 실패하면 구독이 끝나요.</Bullet>
        <Bullet>언제든 [마이 &gt; 내 알 &gt; 정기 구독]에서 해지할 수 있어요. 해지해도 이번 결제 기간이 끝날 때까지 혜택이 유지되고, 다음 결제부터 청구되지 않아요.</Bullet>
        <Bullet>결제 후 7일 안에 혜택(무료 운알톡·콘텐츠)을 하나도 쓰지 않았다면 전액 환불을 요청할 수 있어요. 그 밖에는 이용약관 제4조의2를 따라요.</Bullet>
      </View>
      <Text style={s.terms} accessibilityRole="link" onPress={() => router.push('/legal/terms')}>이용약관 보기</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 0 },
  hero: { height: 102, padding: 16, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.heroBg },
  heroSub: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD' },
  heroName: { ...sansW('800'), fontSize: 20, lineHeight: 26, letterSpacing: -1, color: colors.white, marginTop: 4 },
  heroPrice: { ...sansW('700'), fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: colors.white, marginTop: 4 },
  benefits: { padding: 16, gap: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { ...sansW('600'), flex: 1, fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink },
  terms: { ...sansW('700'), fontSize: 12, lineHeight: 20, letterSpacing: -0.48, color: colors.inkMute, textDecorationLine: 'underline', textAlign: 'center', marginTop: 16 },
});
