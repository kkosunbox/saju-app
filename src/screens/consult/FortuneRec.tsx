import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import PromoSlot from '../../components/PromoSlot';
import FreeContentRow from '../../components/home/FreeContentRow';
import { Discount, DiscountChip, DiscountPrice } from '../../components/PromoCard';
import { Promo, PromoKey, promosOf } from '../../services/promo/promos';
import { StreamBlock } from '../../components/Stream';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { usePremiumPreview } from '../../services/server/premiumApi';
import { CombinedFortune, User } from '../../types';
import { SpousePreview } from '../../types/premium';
import { colors } from '../../theme/colors';
import { radius, sansW, SCREEN_PX } from '../../theme/typography';
import { spousePortraitFor } from '../content/spousePortraits';

type Cat = 'love' | 'money' | 'work' | 'relationship';
const CAT_LABEL: Record<Cat, string> = { love: '연애운', money: '재물운', work: '직장운', relationship: '관계운' };

/** 분야마다 이어서 볼 리포트 (앞에서부터, 이미 산 건 건너뛴다) — 다른 화면과 같은 추천 배너를 쓴다 */
const CAT_PROMOS: Record<Cat, PromoKey[]> = {
  love: ['spouse', 'theme-love'],
  money: ['theme-money'],
  work: ['theme-career'],
  relationship: ['crush'],
};
/** 오늘 분야와 상관없이 하나씩 번갈아 보여 주는 큰 리포트 */
const EVERGREEN: PromoKey[] = ['newyear', 'life', 'sajuDeep'];

/**
 * 오늘의 운세 아래 '더 깊이 보기' 배너 두 장 + 무료 콘텐츠 카드 줄.
 * 1) 미래 배우자(아직 안 열었으면 항상, 이벤트 할인) — 내 운세면 흐린 얼굴. 열었으면 오늘 점수가 가장 높은 분야의 리포트
 * 2) 신년운세 · 평생운 · 상세 사주 중 하나 (아직 안 산 것 중 무작위)
 * 3) 무료로 즐기기 (부적 · 찰떡 MBTI · 사주 캐릭터 · 전생테스트)
 */
export default function FortuneRec({ fortune: f, mine }: { fortune: CombinedFortune; mine: boolean }) {
  const nav = useNavigation();
  const { user, today } = useApp();
  const { owned } = usePremium();
  const promos = promosOf(nav as never, today);
  const top = (Object.keys(CAT_LABEL) as Cat[]).sort((a, b) => f[b] - f[a])[0];
  const fresh = (k: PromoKey) => !owned(promos[k].item.key);
  // 미래 배우자는 이벤트 할인 중이라 아직 안 열었으면 분야와 상관없이 맨 위에 둔다
  const catKey = fresh('spouse') ? 'spouse' : CAT_PROMOS[top].find(fresh) ?? null;
  // 화면을 다시 그려도 바뀌지 않게 처음 한 번만 고른다
  const [roll] = useState(() => Math.random());
  const pool = EVERGREEN.filter(fresh);
  const extra = pool.length ? pool[Math.floor(roll * pool.length)] : null;
  if (!user) return null;
  // 가격은 할인 중인 콘텐츠(미래 배우자)에만 보이고, 나머지는 버튼 문구만
  const noPrice = (k: PromoKey) => (promos[k].item.event ? undefined : `${promos[k].verb} →`);

  return (
    <StreamBlock style={{ marginTop: 28, gap: 12 }}>
      {catKey === 'spouse' && mine ? (
        <FortuneSpouseBanner promo={promos.spouse} screen="fortune_chat" />
      ) : catKey ? (
        <PromoSlot screen="fortune_chat" promo={promos[catKey]} teaser cta={noPrice(catKey)} />
      ) : null}
      {extra ? <PromoSlot screen="fortune_chat" promo={promos[extra]} teaser cta={noPrice(extra)} /> : null}
      {/* 무료 콘텐츠 — 가로 스크롤은 화면 끝까지 */}
      <View style={{ marginTop: 16, marginHorizontal: -SCREEN_PX }}>
        <FreeContentRow inset={SCREEN_PX} />
      </View>
    </StreamBlock>
  );
}

export function FortuneSpouseBanner({ promo, screen, cta }: { promo: Promo; screen: string; cta?: string }) {
  const { user } = useApp();
  const { points } = usePremium();
  const preview = usePremiumPreview<SpousePreview>({ kind: 'spouse' }, !!user);
  const portrait = user && preview.data ? spousePortraitFor(user, preview.data.spouseEl)?.preview : undefined;
  if (!user || !portrait) return <PromoSlot screen={screen} promo={promo} teaser cta={cta} />;
  const { cost, event, orig } = promo.item;
  const discount = event && orig ? { orig, cost } : undefined;
  return <SpouseFaceCard user={user} portrait={portrait} onPress={promo.go} cta={cta ?? (discount ? (points >= cost ? '바로 열기 →' : '리포트 열기 →') : `${cost}알 · ${points >= cost ? '바로 열기' : '리포트 열기'} →`)} coin={!cta || !!discount} discount={discount} />;
}

/** 남색 그라데이션 카드 + 오른쪽 흐린 얼굴과 자물쇠 — 열면 또렷한 얼굴과 리포트를 본다. 글자·알약은 다른 추천 배너와 같은 모양 */
function SpouseFaceCard({ user, portrait, cta, onPress, coin = true, discount }: { user: User; portrait: number | object; cta: string; onPress(): void; coin?: boolean; discount?: Discount }) {
  const who = user.gender === 'female' ? '남편' : '아내';
  return (
    <PressableScale onPress={onPress} style={s.face} scaleTo={0.98} accessibilityLabel={`미래의 ${who} 얼굴 열어 보기`}>
      <LinearGradient colors={['#06153B', '#174E9A', '#03809C']} locations={[0.18, 0.64, 1]} start={{ x: 0.48, y: 0 }} end={{ x: 0.52, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['#FFFFFF', '#666666', '#FFFFFF']} locations={[0, 0.45, 1]} style={s.faceFrame}>
        <View style={s.faceImgBox}>
          <Image source={portrait} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={2} accessible={false} />
          <View style={s.faceWash} />
          <View style={s.faceLock}><Icon name="lock" size={20} color={colors.white} strokeWidth={2} /></View>
        </View>
      </LinearGradient>
      <View style={s.faceTitleRow}>
        <Text style={s.faceTitle}>미래 배우자 리포트</Text>
        {discount ? <DiscountChip /> : <View style={s.faceNew}><Text style={s.faceNewText}>NEW</Text></View>}
      </View>
      <Text style={s.faceDesc}>사주로 그린 배우자의 얼굴 · 성격 · 만나는 때</Text>
      <View style={s.facePill}>
        {coin ? <Image source={require('../../../assets/figma/home/deeper-point.webp')} style={s.facePoint} contentFit="contain" accessible={false} /> : null}
        <Text style={s.facePillText} numberOfLines={1}>{discount ? <DiscountPrice discount={discount} /> : null}{cta}</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  face: { minHeight: 110, padding: 16, paddingRight: 104, borderRadius: radius.lg, backgroundColor: '#1D212D', overflow: 'hidden' },
  // 사진 76×95 · 1px 그라데이션 테두리 · 오른쪽 11 · 위 8
  faceFrame: { position: 'absolute', right: 11, top: 8, width: 76, height: 95, borderRadius: 6, padding: 1 },
  faceImgBox: { flex: 1, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.lineStrong },
  faceWash: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.1)' },
  faceLock: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -15, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21,21,21,0.4)' },
  faceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 18 },
  faceTitle: { ...sansW('700'), fontSize: 16, lineHeight: 18, color: '#8AD0F6', letterSpacing: -0.8, includeFontPadding: false },
  // PromoCard 인라인 NEW와 같은 칩
  faceNew: { height: 18, minWidth: 36, paddingHorizontal: 3.5, justifyContent: 'center', borderRadius: 5, borderWidth: 0.5, borderColor: '#FF7A3C' },
  faceNewText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: '#FF7A3C', opacity: 0.8, includeFontPadding: false },
  faceDesc: { ...sansW('400'), marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.white, letterSpacing: -0.65, includeFontPadding: false },
  facePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.white },
  facePoint: { width: 16, height: 15 },
  facePillText: { ...sansW('700'), fontSize: 13, lineHeight: 18, color: '#000', letterSpacing: -0.65, includeFontPadding: false },
});
