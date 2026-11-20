import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from './PressableScale';
import { MascotPeek } from './Mascot';
import { HomePromoArt } from './home/HomeDesignAssets';
import { Coin, EVENT_PINK } from './premium/Kit';
import { colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

/** 어두운 카드 제목 색 — 디자인에서 카드마다 다른 연한 색을 쓴다 */
export const PROMO_TONE = { gold: '#ECDB7B', lime: '#DFEEA5', mint: '#9FE3D2', sky: '#9ED8FF', pink: '#F3C5DD', sage: '#AFE4C4', amber: '#FFDC9F', lavender: '#E5DCFF' } as const;

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
  variant?: 'default' | 'figma' | 'home' | 'recommendation';
  badgePlacement?: 'inline' | 'end';
  /** 그림까지 들어 있는 배경 (figma) — 주면 기본 배경·마스코트 대신 쓴다 */
  base?: number;
  /** 밝은 배경 그림에 맞춰 제목과 설명을 어둡게 표시한다 */
  lightBackground?: boolean;
  /** 그림이 설명 줄까지 올라오는 배경에서 설명 오른쪽을 비워 둔다 */
  descInset?: number;
  onPress(): void;
  accessibilityLabel?: string;
  /** 할인 중: NEW 대신 '할인중' 칩, 알약 앞에 원래 가격(취소선)과 할인 가격 */
  discount?: Discount;
}

export interface Discount { orig: number; cost: number }

/** 할인 칩 — NEW 칩과 같은 자리 · 같은 크기 */
export function DiscountChip() {
  return <View style={s.sale}><Text style={s.saleText}>할인중</Text></View>;
}

/** 알약 안 가격: ~~300~~ 50 · (뒤에 버튼 문구) */
export function DiscountPrice({ discount }: { discount: Discount }) {
  return <><Text style={s.orig}>{discount.orig.toLocaleString('ko-KR')}</Text> <Text style={s.salePrice}>{discount.cost.toLocaleString('ko-KR')}</Text>{' · '}</>;
}

/** 프로모션 카드 — 제목 · 한 줄 설명 · 알약 버튼 · 오른쪽 그림 */
export default function PromoCard({ title, desc, cta, coin, owned, tone = 'gold', isNew, variant = 'default', badgePlacement = 'end', base, lightBackground, descInset, onPress, accessibilityLabel, discount }: Props) {
  const home = variant === 'home';
  const recommendation = variant === 'recommendation';
  const figma = variant !== 'default';
  const ownBase = figma && !!base;
  return (
    <PressableScale onPress={onPress} style={[s.card, (home || recommendation) && s.homeCard, lightBackground && s.lightCard]} scaleTo={0.98} accessibilityLabel={accessibilityLabel ?? title} accessibilityHint={recommendation ? desc : undefined}>
      {/* 그림이 카드보다 넓으면 마스코트가 있는 오른쪽을 남긴다 */}
      {ownBase ? <Image source={base} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right center" accessible={false} /> : null}
      {figma && !ownBase && tone === 'lime' ? <HomePromoArt large /> : null}
      {figma && !ownBase && (tone === 'lime' || tone === 'gold') ? (
        <Image source={tone === 'lime' ? require('../../assets/figma/home/consult-base.svg') : require('../../assets/figma/home/spouse-base.svg')} style={StyleSheet.absoluteFill} contentFit="fill" accessible={false} />
      ) : null}
      {ownBase ? null : figma ? <HomePromoArt /> : <MascotPeek width={112} top={17} opacity={0.2} />}
      <View style={[s.titleRow, figma && badgePlacement === 'inline' && (home ? s.homeTitleRow : s.figmaInlineTitleRow)]}>
        <Text style={[s.title, figma && s.figmaTitle, figma && badgePlacement === 'inline' && s.figmaInlineTitle, (home || recommendation) && s.homeTitle, { color: lightBackground ? '#005E94' : PROMO_TONE[tone] }]} numberOfLines={recommendation ? 1 : undefined}>{title}</Text>
        {discount ? <DiscountChip /> : isNew ? <View style={[s.new, figma && s.figmaNew, figma && badgePlacement === 'inline' && s.figmaInlineNew]}><Text style={[s.newText, figma && { ...sansW('600') }, figma && badgePlacement === 'inline' && s.figmaInlineNewText]}>NEW</Text></View> : null}
      </View>
      <Text style={[s.desc, figma && s.figmaDesc, recommendation && s.recommendationDesc, lightBackground && s.lightDesc, descInset != null && { paddingRight: descInset }]} numberOfLines={recommendation ? 1 : undefined}>{desc}</Text>
      <View style={[s.cta, home && s.homeCta]}>
        {home && (coin || owned || discount) ? (
          <Image source={require('../../assets/figma/home/deeper-point.webp')} style={s.homePoint} contentFit="contain" accessible={false} />
        ) : recommendation && (coin || discount) ? (
          <Image source={require('../../assets/figma/home/deeper-point.webp')} style={s.recommendationPoint} contentFit="contain" accessible={false} />
        ) : coin || discount ? <Coin size={16} /> : null}
        <Text style={[s.ctaText, figma && s.figmaCtaText]}>
          {owned ? <><Text style={{ color: home ? '#28B2FE' : '#4392F7' }}>{recommendation ? '보유중' : '보유중 · '}</Text>{recommendation ? ' · ' : null}</> : null}{discount ? <DiscountPrice discount={discount} /> : null}{cta}
        </Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  card: { minHeight: 110, padding: 16, borderRadius: radius.lg, backgroundColor: colors.heroBg, overflow: 'hidden' },
  lightCard: { backgroundColor: '#DFEAF9' },
  lightDesc: { color: '#1D212D' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, lineHeight: 18, fontWeight: '700', letterSpacing: -0.8 },
  // 0.5px 테두리와 줄높이 없는 글자는 iOS 사파리에서 아래가 잘려서 1px 반투명 테두리와 줄높이를 정해 둔다
  new: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,122,60,0.7)' },
  newText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: '#FF7A3C', opacity: 0.85 },
  // 할인 칩: NEW(figma inline)와 같은 크기, 분홍
  sale: { height: 18, minWidth: 40, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 5, borderWidth: 1, borderColor: EVENT_PINK, backgroundColor: 'rgba(255,77,141,0.12)' },
  saleText: { ...sansW('700'), fontSize: 12, lineHeight: 14, color: EVENT_PINK, includeFontPadding: false },
  orig: { ...sansW('500'), color: '#999999', textDecorationLine: 'line-through' },
  salePrice: { ...sansW('800'), color: EVENT_PINK },
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
  homeCard: { backgroundColor: '#1D212D' },
  homeTitleRow: { minHeight: 18, gap: 8 },
  homeTitle: { flexShrink: 1 },
  homeCta: { backgroundColor: '#FFFFFF' },
  homePoint: { width: 16, height: 15 },
  recommendationPoint: { width: 17, height: 16 },
  recommendationDesc: { paddingRight: 40 },
});
