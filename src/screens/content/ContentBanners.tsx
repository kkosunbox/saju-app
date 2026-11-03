import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from '../../components/PressableScale';
import { radius, sansW } from '../../theme/typography';

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

/** 콘텐츠 탭 맨 위 배너 — 옆으로 넘기고, 가만히 두면 4초마다 다음 장으로 넘어간다 */
export default function ContentBanners({ items }: { items: Banner[] }) {
  const ref = useRef<ScrollViewInstance>(null);
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const at = useRef(0);
  const touching = useRef(false);

  useEffect(() => {
    if (!w || items.length < 2) return;
    const t = setInterval(() => {
      if (touching.current) return;
      const next = (at.current + 1) % items.length;
      ref.current?.scrollTo({ x: next * w, animated: true });
      at.current = next;
      setI(next);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [w, items.length]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    touching.current = false;
    if (!w) return;
    at.current = Math.round(e.nativeEvent.contentOffset.x / w);
    setI(at.current);
  };

  return (
    <View style={s.wrap} onLayout={onLayout}>
      <View style={s.clip}>
        <ScrollView
          ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { touching.current = true; }} onMomentumScrollEnd={onEnd} scrollEventThrottle={16}
        >
          {items.map(b => (
            <PressableScale key={b.key} onPress={b.go} style={[s.banner, { width: w || 327 }]} scaleTo={0.98} accessibilityLabel={b.title.map(([t]) => t).join('')}>
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
  wrap: { height: 84, borderRadius: radius.lg, backgroundColor: '#1D212D', boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
  clip: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  banner: { height: 84, paddingLeft: 19, paddingTop: 21 },
  title: { ...sansW('700'), fontSize: 17, lineHeight: 20, letterSpacing: -0.68, color: '#FFFFFF', includeFontPadding: false },
  sub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 5, includeFontPadding: false },
  // 점 줄은 배너 가운데 · 위에서 70 (지금 장은 6px 흰 테두리 원, 나머지는 4px 회색 점)
  dots: { position: 'absolute', left: 0, right: 0, top: 70, height: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9' },
  dotOn: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF' },
});
