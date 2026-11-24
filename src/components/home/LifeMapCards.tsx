import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import PressableScale from '../PressableScale';
import GradientBorder from '../GradientBorder';
import Mascot, { ArtName } from '../Mascot';
import { PriceTag } from '../premium/Kit';
import { useApp } from '../../context/AppContext';
import { defaultItem, openPremium } from '../../navigation/premium';
import { colors, gradients, isDark } from '../../theme/colors';
import { sansW } from '../../theme/typography';

/** [화면, 그림, 제목, 설명, 그림 높이, 바탕 위 색, 테두리 그라데이션, 설명 자간, 카드 바탕 그림(라이트)] */
const LIFE_MAP: ['life' | 'sajuDeep', ArtName, string, string, number, string, readonly [string, string, string], number | undefined, number][] = [
  ['life', 'premium-life', '평생운', '초년 · 중년 · 말년 · 10년대운', 47, '#ECDEF7', ['#C79EE8', '#E2C4F3', '#C79EE8'], -1.04, require('../../../assets/figma/content/life-map-life.webp')],
  ['sajuDeep', 'premium-sajuDeep', '상세 사주 해석', '원국 · 오행 · 나의 본성', 56, '#D7F1FF', gradients.border, undefined, require('../../../assets/figma/content/life-map-saju.webp')],
];

/** 홈 디자인: 흰 바탕에 작은 마스코트 그림만 (Figma 홈 '나를 더 깊이 아는 운픽 콘텐츠') */
const HOME_ART = {
  life: require('../../../assets/figma/home/deeper-life.webp'),
  sajuDeep: require('../../../assets/figma/home/deeper-saju.webp'),
} as const;

/** 나의 인생 지도 — 평생운 · 상세 사주 해석 큰 카드 두 장 (콘텐츠 탭과 홈이 같이 쓴다). noPrice: 가격 표시 없이 · home: 홈 디자인(흰 바탕) */
export default function LifeMapCards({ noPrice = false, home = false }: { noPrice?: boolean; home?: boolean }) {
  const nav = useNavigation();
  const { today } = useApp();
  return (
    <View style={s.grid}>
      {LIFE_MAP.map(([k, art, t, d, h, top, edge, tight, bg]) => (
        <PressableScale key={k} onPress={() => openPremium(nav, k)} style={s.cell} scaleTo={0.97} accessibilityLabel={`${t}, ${d}`}>
          <GradientBorder colors={edge} style={s.card}>
            {/* 라이트: 피그마 카드 그림(옅은 바탕 + 큰 마스코트)을 통째로 깐다. 다크는 바탕 없이 마스코트만 */}
            {!isDark && !home ? <LinearGradient colors={[top, colors.cream]} style={StyleSheet.absoluteFill} /> : null}
            {/* 홈: 그림은 디자인 크기(155.76×125) 그대로 가운데에 — 칸이 넓어져도 커지지 않는다 */}
            {!isDark ? <Image source={home ? HOME_ART[k] : bg} style={home ? s.homeArt : StyleSheet.absoluteFill} contentFit={home ? 'fill' : 'cover'} accessible={false} /> : null}
            <View style={s.head}>
              {isDark ? <Mascot name={art} size={h} /> : null}
              {noPrice ? null : <View style={s.price}><PriceTag item={defaultItem(k, today)} small variant="figma" /></View>}
            </View>
            <Text style={s.title} numberOfLines={1}>{t}</Text>
            <View style={s.bleed}><Text style={[s.desc, tight != null && { letterSpacing: tight }]} numberOfLines={1}>{d}</Text></View>
          </GradientBorder>
        </PressableScale>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  // Figma 155.76×125 · 1px 그라데이션 테두리 · 카드 그림 위에 제목(위 71) · 설명(위 91)
  cell: { width: '47.5%', flexGrow: 1 },
  card: { minHeight: 123, padding: 15, paddingBottom: 13 },
  head: { height: 47, alignItems: 'center' },
  price: { position: 'absolute', right: -4, top: -4 },
  // 1px 테두리 안쪽 칸 기준이라 위 · 가운데를 테두리만큼 당긴다
  homeArt: { position: 'absolute', top: -1, left: '50%', marginLeft: -155.76 / 2, width: 155.76, height: 125 },
  title: { ...sansW('700'), fontSize: 13, lineHeight: 16, includeFontPadding: false, color: colors.ink, letterSpacing: -0.78, marginTop: 8 },
  // 긴 설명은 오른쪽 여백까지 써서 한 줄로 넣는다 (웹 Text는 max-width 100%라 감싼 View에서 넓힌다)
  bleed: { marginRight: -12 },
  desc: { ...sansW('500'), fontSize: 13, lineHeight: 18, includeFontPadding: false, color: colors.inkMute, letterSpacing: -0.65, marginTop: 4 },
});
