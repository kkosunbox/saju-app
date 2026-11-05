import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from '../../components/PressableScale';
import { SCREEN_PX, sansW } from '../../theme/typography';

export interface Banner {
  key: string;
  /** require()로 불러온 배경 그림 */
  bg: number;
  /** 제목 조각 — [글자, 색] (색이 없으면 흰색) */
  title: [string, string?][];
  sub: string;
  go(): void;
}

const ROTATE_MS = 4000;
/** Figma 375×96 — 화면 폭에 꽉 차게 두고 높이는 이 비율로 (배경 그림 1125×288, Figma 3배와 같은 비율) */
const RATIO = 375 / 96;
/** 자동으로 넘기는 애니메이션이 끝날 즈음 (복제 장에서 진짜 장으로 옮길 때) */
const SLIDE_MS = 450;

/**
 * 콘텐츠 탭 맨 위 배너 — 화면 좌우 끝까지 꽉 차고, 옆으로 넘기고, 가만히 두면 4초마다 다음 장으로 넘어간다.
 * 양 끝에 복제 장(앞에 마지막 장, 뒤에 첫 장)을 두어, 끝에서도 거꾸로 감기지 않고 같은 방향으로 이어진다.
 * 복제 장에 닿으면 같은 그림의 진짜 장으로 애니메이션 없이 옮긴다.
 */
export default function ContentBanners({ items }: { items: Banner[] }) {
  const ref = useRef<ScrollViewInstance>(null);
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const n = items.length;
  const loop = n > 1;
  const pages = loop ? [items[n - 1], ...items, items[0]] : items;
  // 스크롤 위치의 장 번호 (복제 장 포함) — 처음엔 진짜 첫 장
  const page = useRef(loop ? 1 : 0);
  const touching = useRef(false);

  const jump = (p: number) => ref.current?.scrollTo({ x: p * w, animated: false });
  /** 멈춘 장이 복제 장이면 진짜 장으로 옮기고 점을 맞춘다 */
  const settle = (p: number) => {
    if (loop && p === 0) { p = n; jump(p); }
    else if (loop && p === n + 1) { p = 1; jump(p); }
    page.current = p;
    setI(loop ? p - 1 : p);
  };

  // 폭을 알면 진짜 첫 장으로 (앞의 복제 장을 건너뛴다)
  useEffect(() => {
    if (w && loop) jump(page.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, loop]);

  useEffect(() => {
    if (!w || !loop) return;
    let slide: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      if (touching.current) return;
      const next = page.current + 1;
      ref.current?.scrollTo({ x: next * w, animated: true });
      page.current = next;
      setI((next - 1) % n);
      slide = setTimeout(() => settle(next), SLIDE_MS);
    }, ROTATE_MS);
    return () => { clearInterval(t); if (slide) clearTimeout(slide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, loop, n]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => endAt(e.nativeEvent.contentOffset.x);
  const endAt = (x: number) => {
    touching.current = false;
    if (!w) return;
    const p = Math.round(x / w);
    // 넘김이 반 픽셀쯤 어긋나 멈추면 옆 장 끄트머리가 비친다 — 장 경계에 딱 맞춘다
    if (Math.abs(x - p * w) > 0.01) jump(p);
    settle(p);
  };

  // 웹 ScrollView는 onMomentumScrollEnd를 부르지 않는다 — 스크롤이 잠깐 멎으면 끝난 것으로 본다
  const webEnd = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(webEnd.current), []);
  const onScroll = Platform.OS === 'web' ? (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    clearTimeout(webEnd.current);
    webEnd.current = setTimeout(() => endAt(x), 150);
  } : undefined;

  return (
    <View style={s.wrap} onLayout={onLayout}>
      <View style={s.clip}>
        <ScrollView
          ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { touching.current = true; }} onMomentumScrollEnd={onEnd} onScroll={onScroll} scrollEventThrottle={16}
        >
          {/* 화면 끝까지 차는 배너라 눌러도 줄이지 않는다 (줄이면 뒤 배경이 테두리로 비친다) */}
          {pages.map((b, k) => (
            <PressableScale key={`${b.key}-${k}`} onPress={b.go} style={[s.banner, { width: w || 375 }]} scaleTo={1} accessibilityLabel={b.title.map(([t]) => t).join('')}>
              <Image source={b.bg} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
              <Text style={s.title} numberOfLines={1}>
                {b.title.map(([t, c], k) => <Text key={k} style={{ color: c ?? '#FFFFFF' }}>{t}</Text>)}
              </Text>
              <Text style={s.sub} numberOfLines={1}>{b.sub}</Text>
            </PressableScale>
          ))}
        </ScrollView>
        <View style={s.dots} pointerEvents="none">
          {items.map((b, k) => <View key={b.key} style={k === i ? s.dotOn : s.dot} />)}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // 화면 안쪽 여백(SCREEN_PX)을 걷어내 좌우 끝까지 — 모서리는 둥글리지 않는다.
  // 뒤에 배경색을 깔지 않는다 (장 경계·가장자리의 반 픽셀 안티앨리어싱으로 어두운 선이 비친다)
  wrap: { marginHorizontal: -SCREEN_PX, aspectRatio: RATIO, boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
  clip: { flex: 1, overflow: 'hidden' },
  banner: { height: '100%', paddingLeft: 28, paddingTop: 26 },
  title: { ...sansW('700'), fontSize: 17, lineHeight: 20, letterSpacing: -0.68, color: '#FFFFFF', includeFontPadding: false },
  sub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 5, includeFontPadding: false },
  // 점 줄은 배너 가운데 · 아래에서 14 (Figma 96 높이에서 위 76) — 지금 장은 6px 흰 테두리 원, 나머지는 4px 회색 점
  dots: { position: 'absolute', left: 0, right: 0, bottom: 14, height: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9' },
  dotOn: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF' },
});
