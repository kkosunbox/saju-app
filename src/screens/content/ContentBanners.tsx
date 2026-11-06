import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, PanResponder, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from '../../components/PressableScale';
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

const ROTATE_MS = 4000;
/** Figma 375×96 — 화면 폭에 꽉 차게 두고 높이는 이 비율로 (배경 그림 1125×288, Figma 3배와 같은 비율) */
const RATIO = 375 / 96;
/** 자동 넘김이 다 도착했는지 보는 간격 — 도착한 뒤에만 복제 장에서 진짜 장으로 옮긴다 */
const ARRIVE_POLL_MS = 50;

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
  // 마지막으로 본 스크롤 위치 — 자동 넘김이 목표 장에 다 닿았는지 본다
  const lastX = useRef(0);

  const arrival = useRef<ReturnType<typeof setTimeout>>(undefined);
  const webEnd = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nextRotation = useRef(0);
  const dragFrom = useRef(0);
  const ignorePressUntil = useRef(0);

  const jump = useCallback((p: number) => ref.current?.scrollTo({ x: p * w, animated: false }), [w]);
  /** 복제 장에서는 같은 그림의 진짜 장으로 옮긴다. */
  const settle = useCallback((p: number) => {
    if (loop && p === 0) { p = n; jump(p); }
    else if (loop && p === n + 1) { p = 1; jump(p); }
    page.current = p;
    setI(loop ? p - 1 : p);
  }, [jump, loop, n]);

  const moveTo = useCallback((p: number) => {
    clearTimeout(arrival.current);
    clearTimeout(webEnd.current);
    nextRotation.current = Date.now() + ROTATE_MS;
    ref.current?.scrollTo({ x: p * w, animated: true });
    let tries = 0;
    const arrive = () => {
      if (Math.abs(lastX.current - p * w) < 1 || ++tries > 30) {
        arrival.current = undefined;
        jump(p);
        settle(p);
      } else arrival.current = setTimeout(arrive, ARRIVE_POLL_MS);
    };
    arrival.current = setTimeout(arrive, ARRIVE_POLL_MS);
  }, [jump, settle, w]);

  useLayoutEffect(() => {
    if (w) jump(page.current);
  }, [jump, w]);

  useEffect(() => {
    if (!w || !loop) return;
    nextRotation.current = Date.now() + ROTATE_MS;
    const timer = setInterval(() => {
      if (!touching.current && !arrival.current && Date.now() >= nextRotation.current) moveTo(page.current + 1);
    }, 100);
    return () => {
      clearInterval(timer);
      clearTimeout(arrival.current);
      arrival.current = undefined;
      clearTimeout(webEnd.current);
    };
  }, [w, loop, moveTo]);

  const beginDrag = useCallback(() => {
    touching.current = true;
    clearTimeout(arrival.current);
    arrival.current = undefined;
    clearTimeout(webEnd.current);
  }, []);

  const endDrag = useCallback(() => {
    touching.current = false;
    nextRotation.current = Date.now() + ROTATE_MS;
    ignorePressUntil.current = Date.now() + 150;
  }, []);

  const webPan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => loop && w > 0 && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => {
      beginDrag();
      dragFrom.current = lastX.current;
    },
    onPanResponderMove: (_, g) => {
      const x = Math.max(0, Math.min((n + 1) * w, dragFrom.current - g.dx));
      ref.current?.scrollTo({ x, animated: false });
    },
    onPanResponderRelease: (_, g) => {
      endDrag();
      const start = Math.round(dragFrom.current / w);
      const advance = Math.abs(g.dx) >= Math.min(48, w / 4) || (Math.abs(g.dx) > 12 && Math.abs(g.vx) > 0.4);
      moveTo(Math.max(0, Math.min(n + 1, start + (advance ? -Math.sign(g.dx) : 0))));
    },
    onPanResponderTerminate: () => {
      endDrag();
      moveTo(Math.round(lastX.current / w));
    },
  }), [beginDrag, endDrag, loop, moveTo, n, w]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (arrival.current || touching.current) return;
    const p = Math.round(e.nativeEvent.contentOffset.x / w);
    settle(p);
  };
  const onNativeDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    endDrag();
    const x = e.nativeEvent.contentOffset.x;
    const p = Math.round(x / w);
    // 이미 장 경계에서 멈추면 모멘텀 종료 이벤트가 생략될 수 있다.
    if (p > 0 && p <= n && Math.abs(x - p * w) < 1) settle(p);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    lastX.current = x;
    if (Platform.OS !== 'web' || touching.current || arrival.current) return;
    nextRotation.current = Date.now() + ROTATE_MS;
    clearTimeout(webEnd.current);
    webEnd.current = setTimeout(() => {
      const p = Math.round(x / w);
      if (Math.abs(x - p * w) > 0.01) jump(p);
      settle(p);
    }, 150);
  };

  const openBanner = useCallback((b: Banner) => {
    if (!touching.current && Date.now() >= ignorePressUntil.current) b.go();
  }, []);

  return (
    <View style={s.wrap} onLayout={onLayout}>
      <View style={s.clip}>
        <View style={[s.track, Platform.OS === 'web' && WEB_DRAG]} {...(Platform.OS === 'web' ? webPan.panHandlers : {})}>
          {/* 폭을 재기 전엔 첫 장만 보여 준다. */}
          {!w ? <Slide b={items[0]} onPress={items[0].go} /> : <ScrollView
            ref={ref} horizontal showsHorizontalScrollIndicator={false}
            pagingEnabled={Platform.OS !== 'web'}
            onScrollBeginDrag={Platform.OS === 'web' ? undefined : beginDrag}
            onScrollEndDrag={Platform.OS === 'web' ? undefined : onNativeDragEnd}
            onMomentumScrollEnd={onEnd} onScroll={onScroll} scrollEventThrottle={16}
          >
            {pages.map((b, k) => <Slide key={`${b.key}-${k}`} b={b} width={w} onPress={() => openBanner(b)} />)}
          </ScrollView>}
        </View>
        <View style={s.dots} pointerEvents="box-none">
          {items.map((b, k) => (
            <Pressable
              key={b.key}
              style={s.dotTarget}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={`${k + 1}번째 배너 · ${b.title.map(([t]) => t).join('')}`}
              accessibilityState={{ selected: k === i }}
              onPress={() => { if (w && loop) moveTo(k + 1); }}
            >
              <View style={k === i ? s.dotOn : s.dot} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/** 배너 한 장 — 화면 끝까지 차는 배너라 눌러도 줄이지 않는다 (줄이면 뒤가 테두리로 비친다) */
function Slide({ b, width, onPress }: { b: Banner; width?: number; onPress: () => void }) {
  const textColor = b.textColor ?? '#FFFFFF';
  return (
    <PressableScale onPress={onPress} style={[s.banner, { width: width || '100%' }]} scaleTo={1} accessibilityLabel={b.title.map(([t]) => t).join('')}>
      <Image source={b.bg} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} draggable={false} />
      <Text style={s.title} numberOfLines={1}>
        {b.title.map(([t, c], k) => <Text key={k} style={{ color: c ?? textColor }}>{t}</Text>)}
      </Text>
      <Text style={[s.sub, { color: textColor }]} numberOfLines={1}>{b.sub}</Text>
    </PressableScale>
  );
}

const WEB_DRAG = { cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' } as const;

const s = StyleSheet.create({
  // 화면 안쪽 여백(SCREEN_PX)을 걷어내 좌우 끝까지 — 모서리는 둥글리지 않는다.
  // 뒤에 배경색을 깔지 않는다 (장 경계·가장자리의 반 픽셀 안티앨리어싱으로 어두운 선이 비친다)
  wrap: { marginHorizontal: -SCREEN_PX, aspectRatio: RATIO, boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
  clip: { flex: 1, overflow: 'hidden' },
  track: { flex: 1 },
  banner: { height: '100%', paddingLeft: 28, paddingTop: 26 },
  title: { ...sansW('700'), fontSize: 17, lineHeight: 20, letterSpacing: -0.68, color: '#FFFFFF', includeFontPadding: false },
  sub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, marginTop: 5, includeFontPadding: false },
  // 점 줄은 배너 가운데 · 아래에서 14 (Figma 96 높이에서 위 76) — 지금 장은 6px 흰 테두리 원, 나머지는 4px 회색 점
  dots: { position: 'absolute', left: 0, right: 0, bottom: 5, height: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dotTarget: { width: 12, height: 24, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9' },
  dotOn: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF' },
});
