import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { CategoryKey, categoryTheme, isDark } from '../../theme/colors';

// Figma 288:2393 / 2423 / 2401 / 2411. 각 벡터의 크기와 상대 좌표를 그대로 보존한다.
const CATEGORY = {
  love: { width: 12, height: 11, parts: [
    { source: require('../../../assets/figma/home/category-love-0.svg'), left: 0, top: 0, width: 12, height: 11 },
  ] },
  money: { width: 11, height: 13, parts: [
    { source: require('../../../assets/figma/home/category-money-0.svg'), left: 0, top: 0, width: 11, height: 5.64927 },
    { source: require('../../../assets/figma/home/category-money-1.svg'), left: 0.04, top: 8.13, width: 10.9084, height: 4.87382 },
    { source: require('../../../assets/figma/home/category-money-2.svg'), left: 0.03, top: 4.59, width: 10.924, height: 4.70814 },
  ] },
  work: { width: 13, height: 13, parts: [
    { source: require('../../../assets/figma/home/category-work-0.svg'), left: 0.01, top: 0, width: 12.9891, height: 7.40559 },
    { source: require('../../../assets/figma/home/category-work-1.svg'), left: 0, top: 7.3, width: 13, height: 5.70231 },
  ] },
  relationship: { width: 15, height: 11, parts: [
    { source: require('../../../assets/figma/home/category-relationship-0.svg'), left: 0, top: 5.66, width: 10.3504, height: 5.34521 },
    { source: require('../../../assets/figma/home/category-relationship-1.svg'), left: 2.55, top: 0, width: 5.3858, height: 4.96033 },
    { source: require('../../../assets/figma/home/category-relationship-2.svg'), left: 9.82, top: 6.42, width: 5.17673, height: 4.54097 },
    { source: require('../../../assets/figma/home/category-relationship-3.svg'), left: 8.95, top: 1.64, width: 4.40814, height: 4.14841 },
  ] },
} as const;

export function HomeCategoryGlyph({ category }: { category: CategoryKey }) {
  const art = CATEGORY[category];
  return (
    <View style={{ width: art.width, height: art.height }} pointerEvents="none" accessible={false}>
      {art.parts.map((part, i) => <Image key={i} source={part.source} style={{ position: 'absolute', left: part.left, top: part.top, width: part.width, height: part.height }} contentFit="fill" tintColor={isDark ? categoryTheme[category].color : undefined} accessible={false} />)}
    </View>
  );
}

const OUTLINE = {
  home: require('../../../assets/figma/home/nav-home.svg'),
  chat: require('../../../assets/figma/home/nav-consult.svg'),
  chatHeart: require('../../../assets/figma/home/nav-compatibility.svg'),
  grid: require('../../../assets/figma/home/nav-content.svg'),
  user: require('../../../assets/figma/home/nav-my.svg'),
  download: require('../../../assets/figma/home/download.svg'),
} as const;

export type HomeOutlineName = keyof typeof OUTLINE | 'chevronRight' | 'chevronDown';

export function HomeOutlineIcon({ name, size = 24, color }: { name: HomeOutlineName; size?: number; color?: string }) {
  const chevron = name === 'chevronRight' || name === 'chevronDown';
  const source = chevron
    ? size <= 16 ? require('../../../assets/figma/home/chevron-left-16.svg') : require('../../../assets/figma/home/chevron-left-20.svg')
    : OUTLINE[name];
  return <Image source={source} style={{ width: size, height: size, transform: chevron ? [{ rotate: name === 'chevronRight' ? '180deg' : '-90deg' }] : undefined }} contentFit="contain" tintColor={color} accessible={false} />;
}

export function HomeFreeArt({ kind }: { kind: 'tal' | 'mbti' | 'char' | 'past' | 'inv' }) {
  // Figma 288:2739 — 사주 캐릭터 카드는 내 캐릭터 대신 이 그림으로 고정
  if (kind === 'char') {
    return <Image source={require('../../../assets/figma/home/free-character.webp')} style={{ position: 'absolute', left: -3, top: -8, width: 48, height: 48 }} contentFit="cover" accessible={false} />;
  }
  if (kind === 'tal') {
    return <Image source={require('../../../assets/figma/home/free-talisman.png')} style={{ width: 39, height: 39 }} contentFit="cover" accessible={false} />;
  }
  const friends = kind === 'inv';
  const width = friends ? 64 : 41;
  const layers = kind === 'mbti' ? 2 : 1; // Figma 288:2748에는 같은 이미지 fill이 두 장 겹쳐 있다.
  return (
    <View style={{ width, height: 39, marginLeft: -3, overflow: 'hidden', transform: kind === 'mbti' ? undefined : [{ translateY: -1 }] }} pointerEvents="none">
      {Array.from({ length: layers }, (_, i) => (
        <Image
          key={i}
          source={friends ? require('../../../assets/figma/home/free-friends.png') : require('../../../assets/figma/home/free-content-sheet.png')}
          style={{ position: 'absolute', left: friends ? 0 : (kind === 'mbti' ? -0.2263 : -1.2726) * width, top: (friends ? -0.3803 : -0.1449) * 39, width: (friends ? 1 : 2.4705) * width, height: (friends ? 1.6371 : 1.2986) * 39 }}
          contentFit="fill"
          accessible={false}
        />
      ))}
    </View>
  );
}

// Figma image 130 원본 시트. 각 잘라내기 영역과 이미지 비율을 그대로 보존한다.
const ANALYSIS = {
  saju: { right: 10, top: 48, width: 59, height: 54, x: -0.191, y: -0.0953, w: 2.4802, h: 2.0411 },
  thai: { right: 7, top: 51, width: 56, height: 53, x: -0.2071, y: -1.1042, w: 2.5137, h: 2.0411 },
  mbti: { right: 6, top: 44, width: 56, height: 54, x: -1.5619, y: -0.0953, w: 2.6199, h: 2.0411 },
  blood: { right: 10, top: 51, width: 64, height: 56, x: -1.3025, y: -1.1083, w: 2.3546, h: 2.0411 },
} as const;

export function HomeAnalysisArt({ source }: { source: keyof typeof ANALYSIS }) {
  const a = ANALYSIS[source];
  return (
    <View style={{ position: 'absolute', right: a.right, top: a.top, width: a.width, height: a.height, overflow: 'hidden' }} pointerEvents="none">
      <Image source={require('../../../assets/figma/home/analysis-sheet.png')} style={{ position: 'absolute', left: a.x * a.width, top: a.y * a.height, width: a.w * a.width, height: a.h * a.height }} contentFit="fill" accessible={false} />
    </View>
  );
}

export function HomePromoArt({ large = false }: { large?: boolean }) {
  const width = large ? 133 : 112;
  const height = large ? 110 : 93;
  return (
    <View style={{ position: 'absolute', right: 0, top: large ? 0 : 17, width, height, opacity: large ? 0.3 : 0.12, overflow: 'hidden', transform: [{ scaleX: -1 }] }} pointerEvents="none">
      <Image source={require('../../../assets/figma/home/promo-mascot.png')} style={{ position: 'absolute', left: -0.2782 * width, top: 0.069 * height, width: 1.1805 * width, height: 1.3039 * height }} contentFit="fill" accessible={false} />
    </View>
  );
}
