import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from '../../components/PressableScale';
import LoopCarousel from '../../components/LoopCarousel';
import { SCREEN_PX, sansW } from '../../theme/typography';

export interface Banner {
  key: string;
  /** require()로 불러온 배경 그림 */
  bg: number;
  /** 제목 조각 — [글자, 색] */
  title: [string, string?][];
  sub: string;
  /** 제목과 안내 문구의 기본 색 (기본값 흰색) */
  textColor?: string;
  go(): void;
}

/** Figma 375×96 — 화면 폭에 꽉 차게 두고 높이는 이 비율로 (배경 그림 1125×288, Figma 3배와 같은 비율) */
const RATIO = 375 / 96;
const label = (b: Banner) => b.title.map(([t]) => t).join('');

/** 콘텐츠 탭 맨 위 배너 — 화면 좌우 끝까지 꽉 차고, 옆으로 넘기고, 가만히 두면 4초마다 다음 장으로 넘어간다 */
export default function ContentBanners({ items }: { items: Banner[] }) {
  return (
    <LoopCarousel
      items={items}
      keyOf={b => b.key}
      labelOf={label}
      onPressItem={b => b.go()}
      renderSlide={(b, width, onPress) => <Slide b={b} width={width} onPress={onPress} />}
      style={s.wrap}
      dotsStyle={s.dots}
      dotTargetStyle={s.dotTarget}
      dotStyle={s.dot}
      dotOnStyle={s.dotOn}
    />
  );
}

/** 배너 한 장 — 화면 끝까지 차는 배너라 눌러도 줄이지 않는다 (줄이면 뒤가 테두리로 비친다) */
function Slide({ b, width, onPress }: { b: Banner; width?: number; onPress: () => void }) {
  const textColor = b.textColor ?? '#FFFFFF';
  return (
    <PressableScale onPress={onPress} style={[s.banner, { width: width || '100%' }]} scaleTo={1} accessibilityLabel={label(b)}>
      <Image source={b.bg} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} draggable={false} />
      <Text style={s.title} numberOfLines={1}>
        {b.title.map(([t, c], k) => <Text key={k} style={{ color: c ?? textColor }}>{t}</Text>)}
      </Text>
      <Text style={[s.sub, { color: textColor }]} numberOfLines={1}>{b.sub}</Text>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  // 화면 안쪽 여백(SCREEN_PX)을 걷어내 좌우 끝까지 — 모서리는 둥글리지 않는다.
  // 뒤에 배경색을 깔지 않는다 (장 경계·가장자리의 반 픽셀 안티앨리어싱으로 어두운 선이 비친다)
  wrap: { marginHorizontal: -SCREEN_PX, aspectRatio: RATIO, boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
  banner: { height: '100%', paddingLeft: 28, paddingTop: 26 },
  title: { ...sansW('700'), fontSize: 17, lineHeight: 20, letterSpacing: -0.68, color: '#FFFFFF', includeFontPadding: false },
  sub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, marginTop: 5, includeFontPadding: false },
  // 점 줄은 배너 가운데 · 아래에서 14 (Figma 96 높이에서 위 76) — 지금 장은 6px 흰 테두리 원, 나머지는 4px 회색 점
  dots: { bottom: 5, height: 24 },
  dotTarget: { width: 12, height: 24 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9' },
  dotOn: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF' },
});
