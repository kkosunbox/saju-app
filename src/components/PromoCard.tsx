import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from './PressableScale';
import { MascotPeek } from './Mascot';
import { HomePromoArt } from './home/HomeDesignAssets';
import { Coin } from './premium/Kit';
import { colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

/** 어두운 카드 제목 색 — 디자인에서 카드마다 다른 연한 색을 쓴다 */
export const PROMO_TONE = { gold: '#ECDB7B', lime: '#DFEEA5', mint: '#9FE3D2', sky: '#9ED8FF' } as const;

interface Props {
  title: string;
  desc: string;
  /** 아래 알약 버튼 문구 (예: "100 · 상담 시작하기 →" — coin이면 앞에 마스코트 아이콘) */
  cta: string;
  /** 알약 앞에 동전을 붙인다 (유료) */
  coin?: boolean;
  /** 알약 앞에 파란 "보유중"을 붙인다 */
  owned?: boolean;
  tone?: keyof typeof PROMO_TONE;
  isNew?: boolean;
  variant?: 'default' | 'figma';
  badgePlacement?: 'inline' | 'end';
  onPress(): void;
  accessibilityLabel?: string;
}

/** 어두운 남색 프로모션 카드 — 제목 · 한 줄 설명 · 알약 버튼 · 오른쪽 아래 마스코트 실루엣 */
export default function PromoCard({ title, desc, cta, coin, owned, tone = 'gold', isNew, variant = 'default', badgePlacement = 'end', onPress, accessibilityLabel }: Props) {
  const figma = variant === 'figma';
  return (
    <PressableScale onPress={onPress} style={s.card} scaleTo={0.98} accessibilityLabel={accessibilityLabel ?? title}>
      {figma && tone === 'lime' ? <HomePromoArt large /> : null}
      {figma && (tone === 'lime' || tone === 'gold') ? (
        <Image source={tone === 'lime' ? require('../../assets/figma/home/consult-base.svg') : require('../../assets/figma/home/spouse-base.svg')} style={StyleSheet.absoluteFill} contentFit="fill" accessible={false} />
      ) : null}
      {figma ? <HomePromoArt /> : <MascotPeek width={112} top={17} opacity={0.2} />}
      <View style={[s.titleRow, figma && badgePlacement === 'inline' && s.figmaInlineTitleRow]}>
        <Text style={[s.title, figma && s.figmaTitle, figma && badgePlacement === 'inline' && s.figmaInlineTitle, { color: PROMO_TONE[tone] }]}>{title}</Text>
        {isNew ? <View style={[s.new, figma && s.figmaNew, figma && badgePlacement === 'inline' && s.figmaInlineNew]}><Text style={[s.newText, figma && { ...sansW('600') }, figma && badgePlacement === 'inline' && s.figmaInlineNewText]}>NEW</Text></View> : null}
      </View>
      <Text style={[s.desc, figma && s.figmaDesc]}>{desc}</Text>
      <View style={s.cta}>
        {coin ? <Coin size={16} /> : null}
        <Text style={[s.ctaText, figma && s.figmaCtaText]}>
          {owned ? <Text style={{ color: '#4392F7' }}>보유중 · </Text> : null}{cta}
        </Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  card: { minHeight: 110, padding: 16, borderRadius: radius.lg, backgroundColor: colors.heroBg, overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, lineHeight: 18, fontWeight: '700', letterSpacing: -0.8 },
  // 0.5px 테두리와 줄높이 없는 글자는 iOS 사파리에서 아래가 잘려서 1px 반투명 테두리와 줄높이를 정해 둔다
  new: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,122,60,0.7)' },
  newText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: '#FF7A3C', opacity: 0.85 },
  desc: { fontSize: 13, lineHeight: 18, color: colors.white, letterSpacing: -0.6, marginTop: 8, paddingRight: 80 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#F5F6F8' },
  ctaText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: '#000', letterSpacing: -0.6 },
  figmaNew: { position: 'absolute', right: 0, top: -1 },
  figmaInlineNew: { paddingHorizontal: 3.5, position: 'relative', right: undefined, top: undefined, height: 18, minWidth: 36, paddingVertical: 0, justifyContent: 'center', borderWidth: 0.5, borderColor: '#FF7A3C' },
  figmaInlineNewText: { lineHeight: 14, letterSpacing: 0, opacity: 0.8, includeFontPadding: false },
  figmaInlineTitle: { minWidth: 111 },
  figmaInlineTitleRow: { height: 18 },
  figmaTitle: { ...sansW('700'), includeFontPadding: false },
  // 기능에 맞는 실제 설명은 유지하며, 긴 설명도 실루엣 앞까지 쓴다.
  figmaDesc: { ...sansW('400'), letterSpacing: -0.65, paddingRight: 0, includeFontPadding: false },
  figmaCtaText: { ...sansW('700'), letterSpacing: -0.65, includeFontPadding: false },
});
