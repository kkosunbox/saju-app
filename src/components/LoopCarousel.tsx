import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, PanResponder, Platform, Pressable, ScrollView, ScrollViewInstance, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const ROTATE_MS = 4000;
/** 자동 넘김이 다 도착했는지 보는 간격 — 도착한 뒤에만 복제 장에서 진짜 장으로 옮긴다 */
const ARRIVE_POLL_MS = 50;

interface Props<T> {
  items: T[];
  keyOf(item: T): string;
  /** 점 버튼의 읽기 이름 */
  labelOf(item: T): string;
  /** 한 장 — width가 없으면(폭을 재기 전) 100%로 그린다. 누르면 onPress */
  renderSlide(item: T, width: number | undefined, onPress: () => void): React.ReactNode;
  onPressItem(item: T): void;
  /** 지금 보이는 장이 바뀔 때 */
  onIndexChange?(index: number): void;
  /** 넘기는 동안 매 프레임 — 지금 보이는 위치를 진짜 장 번호(소수)로. 0 ≤ position < 장 수, 마지막 장 다음은 0으로 이어진다 */
  onProgress?(position: number): void;
  style?: StyleProp<ViewStyle>;
  dotsStyle?: StyleProp<ViewStyle>;
  dotTargetStyle?: StyleProp<ViewStyle>;
  dotStyle: StyleProp<ViewStyle>;
  dotOnStyle: StyleProp<ViewStyle>;
}

/**
 * 옆으로 넘기고, 가만히 두면 4초마다 다음 장으로 넘어가는 배너 (콘텐츠 탭 · 홈).
 * 양 끝에 복제 장(앞에 마지막 장, 뒤에 첫 장)을 두어, 끝에서도 거꾸로 감기지 않고 같은 방향으로 이어진다.
 * 복제 장에 닿으면 같은 그림의 진짜 장으로 애니메이션 없이 옮긴다.
 */
export default function LoopCarousel<T>({ items, keyOf, labelOf, renderSlide, onPressItem, onIndexChange, onProgress, style, dotsStyle, dotTargetStyle, dotStyle, dotOnStyle }: Props<T>) {
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

  const indexChange = useRef(onIndexChange);
  const progress = useRef(onProgress);
  useEffect(() => { indexChange.current = onIndexChange; progress.current = onProgress; });
  useEffect(() => { indexChange.current?.(i); }, [i]);

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
    if (w && n) {
      // 복제 장(앞: 마지막 장, 뒤: 첫 장)까지 진짜 장 번호로 접는다
      const pos = loop ? x / w - 1 : x / w;
      progress.current?.(((pos % n) + n) % n);
    }
    if (Platform.OS !== 'web' || touching.current || arrival.current) return;
    nextRotation.current = Date.now() + ROTATE_MS;
    clearTimeout(webEnd.current);
    webEnd.current = setTimeout(() => {
      const p = Math.round(x / w);
      if (Math.abs(x - p * w) > 0.01) jump(p);
      settle(p);
    }, 150);
  };

  const press = useCallback((item: T) => {
    if (!touching.current && Date.now() >= ignorePressUntil.current) onPressItem(item);
  }, [onPressItem]);

  return (
    <View style={style} onLayout={onLayout}>
      <View style={s.clip}>
        <View style={[s.track, Platform.OS === 'web' && WEB_DRAG]} {...(Platform.OS === 'web' ? webPan.panHandlers : {})}>
          {/* 폭을 재기 전엔 첫 장만 보여 준다. */}
          {!w ? renderSlide(items[0], undefined, () => onPressItem(items[0])) : <ScrollView
            ref={ref} horizontal showsHorizontalScrollIndicator={false}
            pagingEnabled={Platform.OS !== 'web'}
            onScrollBeginDrag={Platform.OS === 'web' ? undefined : beginDrag}
            onScrollEndDrag={Platform.OS === 'web' ? undefined : onNativeDragEnd}
            onMomentumScrollEnd={onEnd} onScroll={onScroll} scrollEventThrottle={16}
          >
            {pages.map((b, k) => <React.Fragment key={`${keyOf(b)}-${k}`}>{renderSlide(b, w, () => press(b))}</React.Fragment>)}
          </ScrollView>}
        </View>
        <View style={[s.dots, dotsStyle]} pointerEvents="box-none">
            {items.map((b, k) => (
              <Pressable
                key={keyOf(b)}
                style={[s.dotTarget, dotTargetStyle]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`${k + 1}번째 배너 · ${labelOf(b)}`}
                accessibilityState={{ selected: k === i }}
                onPress={() => { if (w && loop) moveTo(k + 1); }}
              >
                <View style={k === i ? dotOnStyle : dotStyle} />
              </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
}

const WEB_DRAG = { cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' } as const;

const s = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
  track: { flex: 1 },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dotTarget: { alignItems: 'center', justifyContent: 'center' },
});
